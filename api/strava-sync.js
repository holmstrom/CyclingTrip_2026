// Vercel serverless function: pulls a rider's Strava data + generates AI
// commentary, then saves to Firestore so the race-center page can render.
//
// Call: GET /api/strava-sync?rider=NAME
// or:   GET /api/strava-sync  (syncs all riders that have tokens)
//
// Steps per rider:
//   1. Refresh access token if expired
//   2. Pull last 50 activities (8 weeks)
//   3. Pull power streams for rides with watts (max 12 to limit cost)
//   4. Compute: best efforts, pacing tendencies, YTD km, climb history
//   5. Call Anthropic API for AI race-presentation
//   6. Save to Firestore riders/{name}.computed.*
//
// REQUIRED ENV VARS:
//   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
//   FIREBASE_SERVICE_ACCOUNT_JSON
//   ANTHROPIC_API_KEY

const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (sa.project_id) {
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
  } catch (e) {
    console.warn('Firebase Admin init failed', e.message);
  }
}

async function refreshStravaToken(rider) {
  const now = Math.floor(Date.now() / 1000);
  if (rider.strava.expires_at - 60 > now) {
    return rider.strava.access_token;
  }
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: rider.strava.refresh_token,
    }),
  });
  const data = await res.json();
  await admin.firestore().collection('riders').doc(rider.name).set({
    strava: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    },
  }, { merge: true });
  return data.access_token;
}

async function stravaGet(path, token) {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Strava ${path}: ${res.status}`);
  return res.json();
}

// NP via 30s rolling avg → ^4 → mean → ^¼
function computeNP(watts) {
  if (!watts || watts.length < 30) return null;
  const win = 30;
  const rolling = [];
  let cs = 0;
  for (let i = 0; i < watts.length; i++) {
    cs += watts[i];
    if (i >= win) { cs -= watts[i - win]; rolling.push(cs / win); }
    else { rolling.push(cs / (i + 1)); }
  }
  const sum4 = rolling.reduce((a, r) => a + r * r * r * r, 0);
  return Math.pow(sum4 / rolling.length, 0.25);
}

function pacingPattern(watts) {
  if (!watts || watts.length < 600) return null;
  const third = Math.floor(watts.length / 3);
  const nps = [
    computeNP(watts.slice(0, third)),
    computeNP(watts.slice(third, 2 * third)),
    computeNP(watts.slice(2 * third)),
  ].map(n => Math.round(n));
  const spread = Math.max(...nps) - Math.min(...nps);
  let pattern;
  if (spread < 15) pattern = 'flat';
  else if (nps[2] > nps[0] + 10) pattern = 'negative_split';
  else if (nps[0] > nps[2] + 15) pattern = 'positive_split';
  else if (nps[1] > nps[0] + 10 && nps[1] > nps[2] + 10) pattern = 'spiky_middle';
  else pattern = 'flat';
  return { nps, pattern };
}

function bestRoll(watts, windowSec) {
  if (!watts || watts.length < windowSec) return null;
  let cs = 0;
  for (let i = 0; i < windowSec; i++) cs += watts[i];
  let best = cs;
  for (let i = windowSec; i < watts.length; i++) {
    cs += watts[i] - watts[i - windowSec];
    if (cs > best) best = cs;
  }
  return Math.round(best / windowSec);
}

async function generateAICommentary(riderData) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { nickname: null, commentary: 'AI-kommentar afventer ANTHROPIC_API_KEY i env.', fun_fact: null };

  const prompt = `Du er en cykel-race-kommentator der laver pre-race profil til en Tour-de-France-style 3-dages alpetur (Alpe d'Huez, Galibier, Croix de Fer) for amatører.

Skriv en race-præsentation for denne rytter på dansk i 200-250 ord. Brug stilen fra et Grand Tour-program: præcis, faktuel, lidt taktisk. Inkluder:

1. Nickname (kort signatur, fx "Den negative split-rytter" eller "Diesel-motoren")
2. Race-præsentation (200 ord) — brug ALLE specifikke datapunkter nedenfor. Brug <strong> til at fremhæve nøgletal. Slut med et <em>...</em> taktisk implikation (1 sætning).
3. Fun fact (1 sætning med 🎯-emoji — det MEST interessante/quirky fra dataen).

OUTPUT som JSON: {"nickname": "...", "commentary": "...", "fun_fact": "..."}.

RYTTER-DATA:
- Navn: ${riderData.name}
- Vægt: ${riderData.weight} kg
- FTP: ${riderData.ftp} W (W/kg: ${(riderData.ftp / riderData.weight).toFixed(2)})
- YTD km: ${riderData.ytd_km} (${riderData.ytd_outdoor_km} ude + ${riderData.ytd_indoor_km} indoor)
- Bedste 5-min: ${riderData.best_5min || '—'} W
- Bedste 20-min: ${riderData.best_20min || '—'} W
- Antal ture sidste 8 uger: ${riderData.rides_8w}
- Pacing-mønstre (sidste 8 uger): ${JSON.stringify(riderData.pacing_distribution)}
- Seneste 5 ture med pacing: ${riderData.recent_pacings ? riderData.recent_pacings.map(p => `${p.date}: ${p.nps.join('→')}W (${p.pattern})`).join('; ') : '—'}
- Største enkelt-dag TSS: ${riderData.max_tss || '—'}
- Længste enkelt-tur: ${riderData.longest_ride_km || '—'} km
- Total højdemeter sidste 8 uger: ${riderData.total_elev_8w || '—'}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { nickname: null, commentary: `AI-fejl: ${t.slice(0, 150)}`, fun_fact: null };
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  // Parse JSON out of the response (model wraps it in code-fence sometimes)
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { nickname: null, commentary: text, fun_fact: null };
  try {
    return JSON.parse(m[0]);
  } catch {
    return { nickname: null, commentary: text, fun_fact: null };
  }
}

async function syncRider(name) {
  const doc = await admin.firestore().collection('riders').doc(name).get();
  if (!doc.exists) return { error: 'rider not found' };
  const rider = { name, ...doc.data() };
  if (!rider.strava?.access_token) return { error: 'no strava token' };

  const token = await refreshStravaToken(rider);

  // Pull recent activities (last 50 — typically covers 8+ weeks for amateurs)
  const activities = await stravaGet('/athlete/activities?per_page=50', token);
  const rides = activities.filter(a => a.type === 'Ride' || a.type === 'VirtualRide');

  // Date filter: last 8 weeks
  const cutoff = Date.now() - 8 * 7 * 24 * 3600 * 1000;
  const rides8w = rides.filter(a => new Date(a.start_date).getTime() >= cutoff);

  // YTD km
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const ridesYTD = rides.filter(a => new Date(a.start_date).getTime() >= yearStart);
  const ytd_outdoor_km = ridesYTD.filter(a => a.type === 'Ride').reduce((s, a) => s + (a.distance || 0) / 1000, 0);
  const ytd_indoor_km = ridesYTD.filter(a => a.type === 'VirtualRide').reduce((s, a) => s + (a.distance || 0) / 1000, 0);
  const ytd_km = ytd_outdoor_km + ytd_indoor_km;

  // Pacing analysis: pull streams for up to 12 most recent rides with watts
  const ridesWithPower = rides8w.filter(a => a.device_watts && a.has_heartrate !== undefined).slice(0, 12);
  const pacings = [];
  let best5min = 0, best20min = 0;
  for (const a of ridesWithPower) {
    try {
      const s = await stravaGet(`/activities/${a.id}/streams?keys=watts&key_by_type=true`, token);
      const watts = s.watts?.data;
      if (!watts || watts.length < 600) continue;
      const p = pacingPattern(watts);
      if (p) pacings.push({ date: a.start_date.slice(0, 10), name: a.name, nps: p.nps, pattern: p.pattern });
      best5min = Math.max(best5min, bestRoll(watts, 300) || 0);
      best20min = Math.max(best20min, bestRoll(watts, 1200) || 0);
    } catch (e) { console.warn('stream fail', a.id, e.message); }
  }
  const pacing_distribution = {};
  for (const p of pacings) pacing_distribution[p.pattern] = (pacing_distribution[p.pattern] || 0) + 1;

  // Other stats
  const total_elev_8w = Math.round(rides8w.reduce((s, a) => s + (a.total_elevation_gain || 0), 0));
  const longest_ride_km = Math.round(Math.max(...rides8w.map(a => (a.distance || 0) / 1000), 0));
  const max_tss = null; // Strava doesn't expose TSS; would need stream + IF calc

  const profile = {
    name, weight: rider.weight, ftp: rider.ftp,
    ytd_km: Math.round(ytd_km),
    ytd_outdoor_km: Math.round(ytd_outdoor_km),
    ytd_indoor_km: Math.round(ytd_indoor_km),
    rides_8w: rides8w.length,
    best_5min: best5min || null,
    best_20min: best20min || null,
    total_elev_8w,
    longest_ride_km,
    pacing_distribution,
    recent_pacings: pacings.slice(0, 5),
  };

  const ai = await generateAICommentary(profile);

  await admin.firestore().collection('riders').doc(name).set({
    computed: { ...profile, ...ai, last_synced: new Date().toISOString() },
  }, { merge: true });

  return { ok: true, profile, ai };
}

module.exports = async (req, res) => {
  const { rider } = req.query;
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized — set FIREBASE_SERVICE_ACCOUNT_JSON env var' });
  }
  try {
    if (rider) {
      const result = await syncRider(rider);
      return res.status(200).json(result);
    }
    // Sync all riders with tokens
    const snap = await admin.firestore().collection('riders').get();
    const results = {};
    for (const doc of snap.docs) {
      if (doc.data().strava?.access_token) {
        try { results[doc.id] = await syncRider(doc.id); }
        catch (e) { results[doc.id] = { error: e.message }; }
      }
    }
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
