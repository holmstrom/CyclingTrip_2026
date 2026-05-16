# Strava OAuth Setup (one-time)

Du skal sætte 4 env-vars op i Vercel **og** opdatere Strava-app'ens callback-URL.
Det her er en engangs-konfiguration. Når det er gjort, kan alle 6 ryttere bare klikke "Connect with Strava" på `/connect.html`.

---

## 1. Strava-app — opdater callback URL

Gå til [https://www.strava.com/settings/api](https://www.strava.com/settings/api) (du skal være logget ind med din egen Strava-konto).

Hvis du ikke har en app endnu:
- Klik **Create & Manage Your App**
- Application Name: `Alps 2026 Race Center`
- Category: `Training`
- Club: (blank)
- Website: `https://cycling-trip-2026.vercel.app`
- **Authorization Callback Domain: `cycling-trip-2026.vercel.app`** ← KRITISK

Hvis du har en eksisterende app — opdater **Authorization Callback Domain** til `cycling-trip-2026.vercel.app`.

Noter dig:
- **Client ID** (offentligt — fx 12345)
- **Client Secret** (hemmelig — fx abc123def456...)

---

## 2. Firebase Admin service account

Vi skal bruge en service account så Vercel-serverless-functions kan skrive til Firestore.

1. Gå til [Firebase Console → Project Settings → Service accounts](https://console.firebase.google.com/project/cyclingtrip2026/settings/serviceaccounts/adminsdk)
2. Klik **Generate new private key**
3. Download JSON-filen
4. **Kopier hele JSON-indholdet** som én linje (newlines konverteres væk når du paster i Vercel)

---

## 3. Anthropic API key (til AI race-præsentation)

Gå til [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) og opret en API key. Noter den (starter med `sk-ant-...`).

---

## 4. Vercel env vars

Gå til [Vercel project → Settings → Environment Variables](https://vercel.com/dashboard/cycling-trip-2026/settings/environment-variables).

Tilføj disse 4 env vars (alle scopes: Production + Preview + Development):

| Name | Value |
|---|---|
| `STRAVA_CLIENT_ID` | (fra trin 1) |
| `STRAVA_CLIENT_SECRET` | (fra trin 1) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | (hele JSON som én streng fra trin 2) |
| `ANTHROPIC_API_KEY` | (fra trin 3) |

---

## 5. Opdater connect.html med Client ID

Åbn `connect.html` og find nederst:

```html
<script>
  // SET YOUR STRAVA CLIENT ID HERE (or inject via build):
  // window.STRAVA_CLIENT_ID = '12345';
</script>
```

Uncomment og indsæt dit Client ID:

```html
<script>
  window.STRAVA_CLIENT_ID = '12345';  // ← dit faktiske client ID
</script>
```

Commit + push. Vercel auto-deployer.

---

## 6. Send link til vennerne

```
Hej! Tjek vores Alps 2026 Race Center:
https://cycling-trip-2026.vercel.app/race-center.html

Forbind din Strava (30 sek) så I kommer med i prædiktionen:
https://cycling-trip-2026.vercel.app/connect.html
```

---

## 7. Manuel sync (efter første ryd er connected)

Når en rytter er connected, kan du manuelt trigger en sync:
```
https://cycling-trip-2026.vercel.app/api/strava-sync?rider=Tobias%20Kragh
```

For at sync ALLE ryttere:
```
https://cycling-trip-2026.vercel.app/api/strava-sync
```

Automatisk daglig sync setup (Phase 2):
- Vercel cron job: kører `/api/strava-sync` hver aften kl. 22:00 CET
- Eller GitHub Action cron

---

## Fejlsøgning

- **"strava_token_exchange:invalid_client"** → Forkert Client ID/Secret, eller domain på Strava-app er ikke `cycling-trip-2026.vercel.app`
- **"Firebase Admin not initialized"** → `FIREBASE_SERVICE_ACCOUNT_JSON` env var er ikke sat eller invalid JSON
- **AI commentary tomt** → `ANTHROPIC_API_KEY` er ikke sat eller har ikke kredit
