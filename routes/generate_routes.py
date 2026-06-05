"""Generate GPX files + map-overlay JSON from the 3 Strava route JSONs.

Output:
  routes/dag1-alpe-dhuez.gpx
  routes/dag2-galibier.gpx
  routes/dag3-croix-de-fer.gpx
  routes/routes.json   (for Leaflet map polyline overlays)
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'race-center' / 'data'
OUT = ROOT / 'routes'
OUT.mkdir(parents=True, exist_ok=True)

ROUTES = [
    {
        'id': 'dijon_route_3496922123103851710',
        'slug': 'dag1-bourgogne-voie-verte',
        'short': 'Dag 1 — Bourgogne / Voie Verte',
        'day': 1,
    },
    {
        'id': 'newday2_route_3497674681898303884',
        'slug': 'dag2-galibier',
        'short': 'Dag 2 — Galibier + Auris Balconies',
        'day': 2,
    },
    {
        'id': '3486430726403184920',
        'slug': 'dag3-croix-de-fer',
        'short': 'Dag 3 — Croix de Fer + Glandon',
        'day': 3,
    },
]


def decode_polyline(encoded: str) -> list[tuple[float, float]]:
    """Google encoded polyline → list of (lat, lng)."""
    points = []
    i = 0
    lat = lng = 0
    n = len(encoded)
    while i < n:
        shift = 0
        result = 0
        while True:
            b = ord(encoded[i]) - 63
            i += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat
        shift = 0
        result = 0
        while True:
            b = ord(encoded[i]) - 63
            i += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng
        points.append((lat * 1e-5, lng * 1e-5))
    return points


def write_gpx(points: list[tuple[float, float]], name: str, path: Path) -> None:
    """Write a minimal GPX 1.1 file with the track."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx creator="Alps 2026 Race Center" version="1.1" '
        'xmlns="http://www.topografix.com/GPX/1/1" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 '
        'http://www.topografix.com/GPX/1/1/gpx.xsd">',
        f'  <metadata><name>{name}</name></metadata>',
        '  <trk>',
        f'    <name>{name}</name>',
        '    <trkseg>',
    ]
    for lat, lon in points:
        lines.append(f'      <trkpt lat="{lat:.6f}" lon="{lon:.6f}"></trkpt>')
    lines += ['    </trkseg>', '  </trk>', '</gpx>', '']
    path.write_text('\n'.join(lines), encoding='utf-8')


map_overlay = {'routes': []}

for r in ROUTES:
    _cand = DATA / f"{r['id']}.json"
    src = _cand if _cand.exists() else DATA / f"route_{r['id']}.json"
    if not src.exists():
        print(f"⚠️  missing {src.name}")
        continue
    rj = json.loads(src.read_text(encoding='utf-8'))
    m = rj.get('map') or {}
    poly = m.get('polyline') or m.get('summary_polyline')
    if not poly:
        print(f"⚠️  no polyline in {src.name}")
        continue
    points = decode_polyline(poly)
    gpx_path = OUT / f"{r['slug']}.gpx"
    write_gpx(points, f"{r['short']}", gpx_path)
    print(f"✅ {gpx_path.name} ({len(points)} points)")

    # Downsample for the map overlay (cap at ~600 points for smooth rendering)
    step = max(1, len(points) // 600)
    overlay_points = points[::step]
    map_overlay['routes'].append({
        'day': r['day'],
        'name': r['short'],
        'slug': r['slug'],
        'distance_km': round(rj.get('distance', 0) / 1000, 1),
        'elevation_gain_m': round(rj.get('elevation_gain', 0)),
        'gpx_url': f"routes/{r['slug']}.gpx",
        'strava_route_url': f"https://www.strava.com/routes/{r['id'].replace('dijon_route_','').replace('newday2_route_','')}",
        'points': [[lat, lng] for lat, lng in overlay_points],
    })

(OUT / 'routes.json').write_text(
    json.dumps(map_overlay, indent=2, ensure_ascii=False), encoding='utf-8'
)
print(f"\n✅ Wrote routes/routes.json with {len(map_overlay['routes'])} routes")
