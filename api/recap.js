// Vercel serverless: generates an AI stage-recap for a given day from the
// segment results already computed in standings/current.
//
// Call: GET /api/recap         → generates recap for every day that has data
//       GET /api/recap?day=1   → just that day
//
// Reads standings/current.segments, builds a per-day summary, asks Claude
// for a Danish stage commentary (winner, surprises, fun detail), saves to
// Firestore recaps/{day}.
//
// ENV: FIREBASE_SERVICE_ACCOUNT_JSON, ANTHROPIC_API_KEY

const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (sa.project_id) admin.initializeApp({ credential: admin.credential.cert(sa) });
  } catch (e) { console.warn('Firebase init failed', e.message); }
}

const STAGE_NAMES = {
  1: 'Dag 1 — Bourgogne / Voie Verte du Canal',
  2: 'Dag 2 — Col du Galibier',
  3: 'Dag 3 — Croix de Fer + Glandon',
};

const TEAMS = {
  'Frederik Holmstrøm':'A','Tobias Kragh':'A','Sebastian P. Carlsen':'A',
  'Emil Bech':'B','Ulrich Bille Nielsen':'B','Rasmus Jørgensen':'B',
};

function fmt(s){ if(s==null) return '—'; const m=Math.floor(s/60),sec=Math.floor(s%60); return `${m}:${String(sec).padStart(2,'0')}`; }

function buildDaySummary(segments, day) {
  const segs = Object.values(segments).filter(s => s.stage === day && s.entries && s.entries.length);
  if (!segs.length) return null;

  // Per-rider day points + day time (sum of that day's segment times)
  const riders = {};
  const ensure = n => riders[n] || (riders[n] = { kom:0, sprint:0, descent:0, total:0, time:0, segs:0, team:TEAMS[n]||'?' });
  const segLines = [];
  for (const s of segs) {
    const kind = s.kind === 'climb' ? 'kom' : s.kind;
    const ranking = s.entries.map(e => `${e.pos}. ${e.name.split(' ')[0]} ${fmt(e.time)} (+${e.points}p)`).join(', ');
    segLines.push(`${s.category||''} ${s.name}: ${ranking}`);
    s.entries.forEach(e => {
      const r = ensure(e.name);
      r[kind] += e.points; r.total += e.points; r.time += e.time; r.segs += 1;
    });
  }
  // Day winner (most points), day fastest (lowest time among those who did all segs)
  const names = Object.keys(riders);
  const maxSegs = Math.max(...names.map(n => riders[n].segs));
  const complete = names.filter(n => riders[n].segs === maxSegs);
  const pointLeader = [...names].sort((a,b)=>riders[b].total-riders[a].total)[0];
  const fastest = [...complete].sort((a,b)=>riders[a].time-riders[b].time)[0];
  const komLeader = [...names].sort((a,b)=>riders[b].kom-riders[a].kom)[0];
  const sprintLeader = [...names].sort((a,b)=>riders[b].sprint-riders[a].sprint)[0];

  // Team day points
  const team = { A:0, B:0 };
  names.forEach(n => { if(team[riders[n].team]!=null) team[riders[n].team]+=riders[n].total; });

  return { segs, segLines, riders, pointLeader, fastest, komLeader, sprintLeader, team, maxSegs };
}

async function generateRecap(day, summary) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const r = summary.riders;
  const dataBlock = `
ETAPE: ${STAGE_NAMES[day]}
Segment-resultater (position. rytter tid (+point)):
${summary.segLines.join('\n')}

Dagens samlede point: ${Object.keys(r).sort((a,b)=>r[b].total-r[a].total).map(n=>`${n.split(' ')[0]} ${r[n].total}p`).join(', ')}
Dagens hurtigste (samlet segment-tid): ${summary.fastest ? summary.fastest.split(' ')[0]+' '+fmt(r[summary.fastest].time) : '—'}
Bjergpoint-leder: ${summary.komLeader.split(' ')[0]} (${r[summary.komLeader].kom}p)
Sprint-leder: ${summary.sprintLeader.split(' ')[0]} (${r[summary.sprintLeader].sprint}p)
Hold: A ${summary.team.A}p vs B ${summary.team.B}p`;

  if (!apiKey) return { headline: 'AI-resumé afventer ANTHROPIC_API_KEY', body: dataBlock, generated_at: new Date().toISOString() };

  const prompt = `Du er sportskommentator for en sjov 3-dages cykeltur med 6 venner i Frankrig (Tour-de-France-stil med point + trøjer). Skriv et etape-resumé på dansk for dagens etape.

Stil: levende, lidt drillende, men faktuel — som en rigtig Grand Tour-kommentar + i samme ånd som et data-drevet coach-resumé. 150-200 ord.

Inkluder:
- Hvem vandt dagen (point) og hvem var hurtigst (tid)
- Interessante observationer: tætte dueller, store gaps, overraskelser, hvem der tog bjergpoint vs sprint
- Hold-kampen
- En sjov detalje til sidst (start med 🎯)

OUTPUT som JSON: {"headline": "kort overskrift (max 8 ord)", "body": "resumé-tekst, brug \\n mellem afsnit"}.

DATA:
${dataBlock}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:800, messages:[{role:'user',content:prompt}] }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : { headline:'Etape '+day, body:text };
    return { ...parsed, generated_at: new Date().toISOString() };
  } catch (e) {
    return { headline:'Etape '+day, body:'AI-fejl: '+e.message, generated_at:new Date().toISOString() };
  }
}

module.exports = async (req, res) => {
  if (!admin.apps.length) return res.status(500).json({ error:'Firebase not init' });
  try {
    const doc = await admin.firestore().collection('standings').doc('current').get();
    if (!doc.exists) return res.status(200).json({ ok:true, note:'no standings yet' });
    const segments = doc.data().segments || {};

    const reqDay = req.query.day ? [parseInt(req.query.day)] : [1,2,3];
    const out = {};
    for (const day of reqDay) {
      const summary = buildDaySummary(segments, day);
      if (!summary) { out[day] = { skipped:'no data' }; continue; }
      const recap = await generateRecap(day, summary);
      await admin.firestore().collection('recaps').doc(String(day)).set({
        day, stage_name: STAGE_NAMES[day], ...recap,
      });
      out[day] = recap;
    }
    return res.status(200).json({ ok:true, recaps: out });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
