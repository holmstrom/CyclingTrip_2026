// Vercel serverless: computes actual race results from riders' Strava data.
//
// For each connected rider:
//   1. Refresh token
//   2. Pull activities in the trip window (June 4-6 2026)
//   3. For each activity, fetch detailed version (include_all_efforts=true)
//   4. Extract segment efforts matching our scored segment IDs
//   5. Keep each rider's fastest time per segment
// Then per segment: rank riders, award points by position.
// Aggregate KOM / sprint / descent points + GC (sum of scored-segment times).
// Save to Firestore: standings/current.
//
// Call: GET /api/results
//
// ENV: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, FIREBASE_SERVICE_ACCOUNT_JSON

const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (sa.project_id) admin.initializeApp({ credential: admin.credential.cert(sa) });
  } catch (e) { console.warn('Firebase init failed', e.message); }
}

// --- Scored segments (must match race-center/segments.json) ---
// id -> { stage (1-3), kind (climb/sprint/descent), name, points[] }
const SCORED = {
  // Dag 1
  '6028820':  { stage: 1, kind: 'climb',   name: 'Combe Lavaux',          points: [15,12,10,8,6,4] },
  '5577628':  { stage: 1, kind: 'climb',   name: 'Corcelles',             points: [5,3,2,1] },
  '9174042':  { stage: 1, kind: 'climb',   name: 'Velars-Corcelles',      points: [5,3,2,1] },
  '16418681': { stage: 1, kind: 'sprint',  name: 'Route des Grands Crus', points: [5,3,2,1] },
  '17270309': { stage: 1, kind: 'sprint',  name: 'Kanal-sprint',          points: [5,3,2,1] },
  '23087194': { stage: 1, kind: 'descent', name: 'Petite descente',       points: [5,3,2,1] },
  // Dag 2
  '18328881': { stage: 2, kind: 'climb',   name: 'Col du Galibier',       points: [25,20,16,14,12,10] },
  '17295489': { stage: 2, kind: 'climb',   name: 'Balcons d\'Auris',      points: [15,12,10,8,6,4] },
  '13218585': { stage: 2, kind: 'climb',   name: 'Galibier Tunnel-finale',points: [10,8,6,4,2,1] },
  '18239632': { stage: 2, kind: 'sprint',  name: 'Galibier 1ère Partie',  points: [5,3,2,1] },
  '18325341': { stage: 2, kind: 'descent', name: 'Galibier→Lautaret',     points: [5,3,2,1] },
  // Dag 3
  '37857789': { stage: 3, kind: 'climb',   name: 'Col de la Croix de Fer',points: [25,20,16,14,12,10] },
  '10033700': { stage: 3, kind: 'climb',   name: 'Glandon (Second Ramp)', points: [15,12,10,8,6,4] },
  '12632508': { stage: 3, kind: 'sprint',  name: 'Croix de Fer Final 1k', points: [5,3,2,1] },
  '2485038':  { stage: 3, kind: 'sprint',  name: 'Lac du Verney TT',      points: [5,3,2,1] },
  '12738518': { stage: 3, kind: 'sprint',  name: 'Glandon Final Push',    points: [5,3,2,1] },
  '10058561': { stage: 3, kind: 'descent', name: 'Glandon Descent',       points: [5,3,2,1] },
};

// Team assignment
const TEAMS = {
  'Frederik Holmstrøm': 'A', 'Tobias Kragh': 'A', 'Sebastian P. Carlsen': 'A',
  'Emil Bech': 'B', 'Ulrich Bille Nielsen': 'B', 'Rasmus Jørgensen': 'B',
};

const TRIP_START = '2026-06-04';
const TRIP_END   = '2026-06-07'; // exclusive-ish (covers through June 6)

async function refreshToken(rider) {
  const now = Math.floor(Date.now()/1000);
  if (rider.strava.expires_at - 60 > now) return rider.strava.access_token;
  const res = await fetch('https://www.strava.com/oauth/token', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type:'refresh_token', refresh_token: rider.strava.refresh_token,
    }),
  });
  const d = await res.json();
  await admin.firestore().collection('riders').doc(rider.name).set({
    strava: { access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at },
  }, { merge:true });
  return d.access_token;
}

async function sg(path, token) {
  const r = await fetch(`https://www.strava.com/api/v3${path}`, { headers:{Authorization:`Bearer ${token}`} });
  if (!r.ok) throw new Error(`Strava ${path}: ${r.status}`);
  return r.json();
}

async function riderEfforts(rider) {
  // Returns { segId: bestElapsedSeconds, ... } for this rider across trip activities
  const token = await refreshToken(rider);
  const after = Math.floor(new Date(TRIP_START).getTime()/1000);
  const before = Math.floor(new Date(TRIP_END).getTime()/1000);
  const acts = await sg(`/athlete/activities?after=${after}&before=${before}&per_page=30`, token);
  const rides = acts.filter(a => a.type === 'Ride' || a.type === 'VirtualRide');
  const best = {};
  for (const a of rides) {
    try {
      const detail = await sg(`/activities/${a.id}?include_all_efforts=true`, token);
      for (const eff of (detail.segment_efforts || [])) {
        const sid = String(eff.segment?.id);
        if (!SCORED[sid]) continue;
        const t = eff.elapsed_time;
        if (best[sid] == null || t < best[sid]) best[sid] = t;
      }
    } catch (e) { console.warn('activity detail fail', a.id, e.message); }
  }
  return best;
}

module.exports = async (req, res) => {
  if (!admin.apps.length) return res.status(500).json({ error:'Firebase not init' });
  try {
    const snap = await admin.firestore().collection('riders').get();
    const riders = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.strava?.access_token) riders.push({ name: doc.id, ...d });
    }

    // 1. Gather efforts per rider
    const effortsByRider = {};
    for (const r of riders) {
      try { effortsByRider[r.name] = await riderEfforts(r); }
      catch (e) { effortsByRider[r.name] = {}; console.warn('rider efforts fail', r.name, e.message); }
    }

    // 2. Per segment: rank + award points
    const riderPoints = {}; // name -> {kom,sprint,descent,total, gc_seconds, segments_done}
    riders.forEach(r => riderPoints[r.name] = { kom:0, sprint:0, descent:0, total:0, gc_seconds:0, segments_done:0, team: TEAMS[r.name]||'?' });
    const segmentResults = {}; // segId -> [{name,time,points,pos}]

    for (const sid of Object.keys(SCORED)) {
      const seg = SCORED[sid];
      const entries = [];
      for (const r of riders) {
        const t = effortsByRider[r.name]?.[sid];
        if (t != null) entries.push({ name: r.name, time: t });
      }
      entries.sort((a,b) => a.time - b.time);
      // climb efforts count toward the KOM jersey field
      const field = seg.kind === 'climb' ? 'kom' : seg.kind;
      entries.forEach((e, i) => {
        const pts = seg.points[i] || 0;
        e.points = pts; e.pos = i+1;
        const rp = riderPoints[e.name];
        rp[field] += pts;
        rp.total += pts;
        rp.gc_seconds += e.time;
        rp.segments_done += 1;
      });
      segmentResults[sid] = { ...seg, entries };
    }

    // 3. Team aggregation
    const teams = { A:{points:0,gc_seconds:0}, B:{points:0,gc_seconds:0} };
    for (const name of Object.keys(riderPoints)) {
      const rp = riderPoints[name];
      if (teams[rp.team]) { teams[rp.team].points += rp.total; teams[rp.team].gc_seconds += rp.gc_seconds; }
    }

    const out = {
      computed_at: new Date().toISOString(),
      riders: riderPoints,
      segments: segmentResults,
      teams,
    };
    await admin.firestore().collection('standings').doc('current').set(out);
    return res.status(200).json({ ok:true, riders_processed: riders.length, ...out });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
