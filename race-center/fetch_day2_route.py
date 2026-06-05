"""Fetch the new Day-2 route + list its segments for possible additions."""
import json, urllib.request, urllib.error, urllib.parse, time
from pathlib import Path

CONFIG = Path.home() / '.config' / 'strava-mcp' / 'config.json'
OUT = Path(__file__).parent / 'data'

def tok():
    c = json.loads(CONFIG.read_text())
    if c.get('expiresAt',0)-60 < time.time():
        data=urllib.parse.urlencode({'client_id':c['clientId'],'client_secret':c['clientSecret'],
            'grant_type':'refresh_token','refresh_token':c['refreshToken']}).encode()
        req=urllib.request.Request('https://www.strava.com/api/v3/oauth/token',data=data,method='POST')
        n=json.loads(urllib.request.urlopen(req).read())
        c['accessToken']=n['access_token'];c['refreshToken']=n['refresh_token'];c['expiresAt']=n['expires_at']
        CONFIG.write_text(json.dumps(c,indent=2))
    return c['accessToken']

rid='3497674681898303884'
h={'Authorization':f'Bearer {tok()}'}
req=urllib.request.Request(f'https://www.strava.com/api/v3/routes/{rid}',headers=h)
d=json.loads(urllib.request.urlopen(req).read())
OUT.mkdir(parents=True,exist_ok=True)
(OUT/f'newday2_route_{rid}.json').write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding='utf-8')

print(f"Rute: {d.get('name')}")
print(f"{d.get('distance',0)/1000:.1f} km / {d.get('elevation_gain',0):.0f} hm / højeste {max((s.get('elevation_high',0) for s in d.get('segments',[])),default=0):.0f}m")
print(f"\nNuværende Dag 2-segmenter (skal beholdes):")
keep_ids = {'18328881':'Col du Galibier HC','13218585':'Galibier Tunnel-finale','18239632':'Galibier 1ère Partie','18325341':'Galibier→Lautaret descent'}
present = {str(s.get('id')) for s in d.get('segments',[])}
for sid,name in keep_ids.items():
    print(f"  {'✓ på ruten' if sid in present else '✗ IKKE på ruten'}: {name} ({sid})")

print(f"\nAlle klatre-segmenter på ruten (gradient>=4%, >=1km), efter difficulty:")
climbs=[s for s in d.get('segments',[]) if s.get('average_grade',0)>=4 and s.get('distance',0)>=1000
        and 'descent' not in s.get('name','').lower() and 'sprint' not in s.get('name','').lower()]
climbs.sort(key=lambda s:-(s.get('distance',0)*s.get('average_grade',0)))
for s in climbs[:12]:
    star = ' ← ALLEREDE BRUGT' if str(s.get('id')) in keep_ids else ''
    print(f"  {s.get('name','')[:42]:42} {s.get('distance',0)/1000:5.2f}km @{s.get('average_grade',0):4.1f}% peak{s.get('elevation_high',0):.0f} id={s.get('id')}{star}")

print(f"\nFlade/sprint-kandidater (gradient<2.5%, >=1.5km):")
flats=[s for s in d.get('segments',[]) if abs(s.get('average_grade',0))<2.5 and s.get('distance',0)>=1500]
flats.sort(key=lambda s:-s.get('distance',0))
for s in flats[:6]:
    print(f"  {s.get('name','')[:42]:42} {s.get('distance',0)/1000:5.2f}km @{s.get('average_grade',0):4.1f}% id={s.get('id')}")

print(f"\nDescent-kandidater (gradient<=-4%, >=2km):")
desc=[s for s in d.get('segments',[]) if s.get('average_grade',0)<=-4 and s.get('distance',0)>=2000]
desc.sort(key=lambda s:s.get('average_grade',0))
for s in desc[:6]:
    star=' ← ALLEREDE BRUGT' if str(s.get('id')) in keep_ids else ''
    print(f"  {s.get('name','')[:42]:42} {s.get('distance',0)/1000:5.2f}km @{s.get('average_grade',0):4.1f}% id={s.get('id')}{star}")
