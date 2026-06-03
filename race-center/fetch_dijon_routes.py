"""Fetch + analyze 4 candidate Day-1 alternative routes (Dijon area)."""
import json, urllib.request, urllib.error, urllib.parse, time
from pathlib import Path

CONFIG = Path.home() / '.config' / 'strava-mcp' / 'config.json'
OUT = Path(__file__).parent / 'data'
OUT.mkdir(parents=True, exist_ok=True)

def load_token():
    cfg = json.loads(CONFIG.read_text())
    if cfg.get('expiresAt', 0) - 60 < time.time():
        data = urllib.parse.urlencode({
            'client_id': cfg['clientId'], 'client_secret': cfg['clientSecret'],
            'grant_type': 'refresh_token', 'refresh_token': cfg['refreshToken'],
        }).encode()
        req = urllib.request.Request('https://www.strava.com/api/v3/oauth/token', data=data, method='POST')
        with urllib.request.urlopen(req) as r:
            new = json.loads(r.read())
        cfg['accessToken'] = new['access_token']; cfg['refreshToken'] = new['refresh_token']; cfg['expiresAt'] = new['expires_at']
        CONFIG.write_text(json.dumps(cfg, indent=2))
    return cfg['accessToken']

tok = load_token()
headers = {'Authorization': f'Bearer {tok}'}

route_ids = [
    '3496919746527548724',
    '3496924683549897612',
    '3496922123103851710',
    '3496934878054045820',
]

for rid in route_ids:
    try:
        req = urllib.request.Request(f'https://www.strava.com/api/v3/routes/{rid}', headers=headers)
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read())
        (OUT / f'dijon_route_{rid}.json').write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')
        dist = d.get('distance', 0)/1000
        elev = d.get('elevation_gain', 0)
        mpkm = elev/dist if dist else 0
        segs = d.get('segments', [])
        # Count significant climbs
        climbs = [s for s in segs if s.get('average_grade',0) >= 4 and s.get('distance',0) >= 800
                  and 'descent' not in s.get('name','').lower()]
        descents = [s for s in segs if s.get('average_grade',0) <= -4 and s.get('distance',0) >= 1500]
        max_climb = max((s.get('elevation_high',0) for s in segs), default=0)
        print(f"\n{'='*70}")
        print(f"ROUTE {rid}")
        print(f"  Navn: {d.get('name')}")
        print(f"  Distance: {dist:.1f} km | Elev: {elev:.0f} hm | {mpkm:.1f} m/km")
        print(f"  Est. tid: {d.get('estimated_moving_time',0)/3600:.1f} t")
        print(f"  Højeste punkt: {max_climb:.0f} m")
        print(f"  Segmenter: {len(segs)} ({len(climbs)} klatre-segmenter, {len(descents)} descents)")
        if climbs:
            climbs.sort(key=lambda s: -s.get('distance',0))
            print(f"  Største klatre-segmenter:")
            for s in climbs[:4]:
                print(f"    - {s.get('name','')[:42]:42} {s.get('distance',0)/1000:5.2f} km @ {s.get('average_grade',0):4.1f}% peak {s.get('elevation_high',0):.0f}m")
        if d.get('description'):
            print(f"  Beskrivelse: {d.get('description')[:120]}")
    except urllib.error.HTTPError as e:
        print(f"\nROUTE {rid}: HTTP {e.code} — {e.read().decode()[:150]}")
    except Exception as e:
        print(f"\nROUTE {rid}: {type(e).__name__}: {e}")
