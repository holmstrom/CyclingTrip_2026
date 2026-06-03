"""Estimate how much of each route is on bigger roads vs small lanes.
Method: decode the route polyline, sample points every ~500m, query
OpenStreetMap Overpass for the nearest road's 'highway' tag, classify.

Caveat: snapping a GPS point to the nearest OSM way is imperfect — at
junctions or parallel roads it can pick the wrong one. Treat the output
as ±15% estimate, not exact truth.
"""
import json, urllib.request, urllib.parse, math, time
from pathlib import Path

DATA = Path(__file__).parent / 'data'

ROUTES = {
    '3496919746527548724': 'Rute 1: Bourgogne ruten',
    '3496924683549897612': 'Rute 2: Saint-Aubin',
    '3496922123103851710': 'Rute 3: Voie Verte Canal',
    '3496934878054045820': 'Rute 4: Grands Crus',
}

# OSM highway tags ranked by traffic/size
BIG = {'motorway','trunk','primary','motorway_link','trunk_link','primary_link'}
MEDIUM = {'secondary','secondary_link'}
SMALL = {'tertiary','tertiary_link','unclassified','residential','living_street'}
TINY = {'track','path','cycleway','service','footway','bridleway'}

def decode_polyline(encoded):
    pts=[]; i=0; lat=0; lng=0; n=len(encoded)
    while i<n:
        shift=0;result=0
        while True:
            b=ord(encoded[i])-63;i+=1;result|=(b&0x1f)<<shift;shift+=5
            if b<0x20:break
        lat+=~(result>>1) if result&1 else result>>1
        shift=0;result=0
        while True:
            b=ord(encoded[i])-63;i+=1;result|=(b&0x1f)<<shift;shift+=5
            if b<0x20:break
        lng+=~(result>>1) if result&1 else result>>1
        pts.append((lat*1e-5,lng*1e-5))
    return pts

def haversine(a,b):
    R=6371000;la1,lo1,la2,lo2=map(math.radians,[a[0],a[1],b[0],b[1]])
    dla=la2-la1;dlo=lo2-lo1
    h=math.sin(dla/2)**2+math.cos(la1)*math.cos(la2)*math.sin(dlo/2)**2
    return 2*R*math.asin(math.sqrt(h))

def sample_every(points, meters=500):
    """Return points spaced ~meters apart along the track."""
    out=[points[0]];acc=0
    for i in range(1,len(points)):
        acc+=haversine(points[i-1],points[i])
        if acc>=meters:
            out.append(points[i]);acc=0
    return out

def overpass_nearest_highway(lat,lng,radius=25):
    """Query Overpass for highways near a point. Return the 'biggest' tag found."""
    q=f'[out:json][timeout:25];way(around:{radius},{lat},{lng})[highway];out tags 1;'
    url='https://overpass-api.de/api/interpreter'
    data=urllib.parse.urlencode({'data':q}).encode()
    try:
        req=urllib.request.Request(url,data=data,headers={'User-Agent':'alps2026-route-check'})
        with urllib.request.urlopen(req,timeout=30) as r:
            j=json.loads(r.read())
        tags=[el.get('tags',{}).get('highway') for el in j.get('elements',[])]
        tags=[t for t in tags if t]
        if not tags: return None
        # pick the biggest road present near the point
        for grp,name in [(BIG,'BIG'),(MEDIUM,'MEDIUM'),(SMALL,'SMALL'),(TINY,'TINY')]:
            if any(t in grp for t in tags): return name
        return 'OTHER'
    except Exception as e:
        return None

for rid,label in ROUTES.items():
    fp=DATA/f'dijon_route_{rid}.json'
    d=json.loads(fp.read_text(encoding='utf-8'))
    poly=(d.get('map') or {}).get('polyline')
    pts=decode_polyline(poly)
    total_km=d.get('distance',0)/1000
    sampled=sample_every(pts,1000)
    counts={'BIG':0,'MEDIUM':0,'SMALL':0,'TINY':0,'OTHER':0,'NONE':0}
    for p in sampled:
        cls=overpass_nearest_highway(p[0],p[1])
        counts[cls if cls else 'NONE']+=1
        time.sleep(1.1)  # be nice to Overpass
    n=len(sampled)
    km_per_sample=total_km/n
    print(f"\n{label}  ({total_km:.1f} km, {n} punkter samplet)")
    for k in ['BIG','MEDIUM','SMALL','TINY','OTHER','NONE']:
        km=counts[k]*km_per_sample
        pct=100*counts[k]/n
        print(f"  {k:7}: ~{km:4.1f} km ({pct:3.0f}%)")
EOF