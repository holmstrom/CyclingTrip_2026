// Vercel serverless function: handles OAuth callback from Strava.
// Receives ?code=... &state=RIDER_NAME and exchanges for access_token.
// Stores token in Firebase Firestore (rider document) and redirects back
// to /connect.html with success flag.
//
// REQUIRED ENV VARS (set in Vercel project settings):
//   STRAVA_CLIENT_ID — public, also used in connect.html
//   STRAVA_CLIENT_SECRET — server-only secret
//   FIREBASE_SERVICE_ACCOUNT_JSON — full JSON of a Firebase admin service account
//     (or use the public API key if Firestore rules allow client-side writes)

const admin = require('firebase-admin');

// Lazy-init Firebase Admin (re-uses singleton across invocations)
if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (sa.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
    }
  } catch (e) {
    console.warn('Firebase Admin init failed', e.message);
  }
}

module.exports = async (req, res) => {
  const { code, state, error } = req.query;
  const host = req.headers.host || 'cycling-trip-2026.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${proto}://${host}`;

  if (error) {
    return res.redirect(302, `${baseUrl}/connect.html?error=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return res.redirect(302, `${baseUrl}/connect.html?error=missing_code_or_state`);
  }

  try {
    // Exchange auth code for access token
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.redirect(302, `${baseUrl}/connect.html?error=${encodeURIComponent('strava_token_exchange:' + text.slice(0, 100))}`);
    }
    const tokenData = await tokenRes.json();
    const riderName = decodeURIComponent(state);

    // Save token + athlete info to Firestore (under riders/{name})
    if (admin.apps.length) {
      await admin.firestore().collection('riders').doc(riderName).set({
        strava: {
          athlete_id: tokenData.athlete?.id,
          athlete_firstname: tokenData.athlete?.firstname,
          athlete_lastname: tokenData.athlete?.lastname,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          scope: 'read,activity:read_all,profile:read_all',
          connected_at: new Date().toISOString(),
        },
      }, { merge: true });
    }

    // Trigger initial sync (don't wait for response — fire-and-forget)
    try {
      fetch(`${baseUrl}/api/strava-sync?rider=${encodeURIComponent(riderName)}`).catch(() => {});
    } catch (_) {}

    return res.redirect(302, `${baseUrl}/connect.html?success=1&rider=${encodeURIComponent(riderName)}`);
  } catch (err) {
    return res.redirect(302, `${baseUrl}/connect.html?error=${encodeURIComponent(err.message || 'unknown')}`);
  }
};
