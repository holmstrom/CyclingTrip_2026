"""Manually curated segment selection for KOM + sprint scoring.
Run once to extract IDs from route JSONs — output goes to segments.json
which is then used by the frontend race-center."""
import json
from pathlib import Path

DATA = Path(__file__).parent / 'data'

# Map: route file name fragment -> stage name
ROUTE_FILES = {
    '3486425133972935152': 'Dag 1: Alpe d\'Huez + Col de Sarenne',
    '3486425940246209816': 'Dag 2: Col du Galibier',
    '3486430726403184920': 'Dag 3: Croix de Fer + Glandon',
}

# Curated picks per stage. Each: (category, display_name, exact_segment_name_substring)
PICKS = {
    'Dag 1: Alpe d\'Huez + Col de Sarenne': [
        ('KOM:HC',    'Alpe d\'Huez',                    'Alpe d\'Huez'),
        ('KOM:Cat2',  'Col de Sarenne West',             'Col de Sarenne West'),
        ('SPRINT',    'Alpe d\'Huez Final Sprint',       'Hairpin 1 to Marked'),
        ('DESCENT',   'Sarenne-Romanche Descent',        'Sarenne-Romanche'),
    ],
    'Dag 2: Col du Galibier': [
        ('KOM:HC',    'Col du Galibier',                 'Col du Galibier (par Col du Lautaret)'),
        ('SPRINT',    'Galibier 1ère Partie (Opener)',   'Galibier 1ère Partie'),
        ('SPRINT',    'Galibier Tunnel Punch',           'GALIBIER: FROM THE TUNNEL TO THE TOP'),
        ('DESCENT',   'Galibier → Lautaret Descent',     'Descente Galibier - Lautaret'),
    ],
    'Dag 3: Croix de Fer + Glandon': [
        ('KOM:HC',    'Col de la Croix de Fer',          'Col de la Croix de Fer (par Barrage du Verney)'),
        ('KOM:Cat1',  'Glandon (Second Ramp)',           'Second ramp up South of Glandon to Café'),
        ('SPRINT',    'Croix de Fer Final 1k',           'Final 1k'),
        ('SPRINT',    'Lac du Verney Flat TT',           'Lac du Verney sprint'),
        ('SPRINT',    'Glandon Final Push',              'Glandon Final Push'),
        ('DESCENT',   'Glandon Descent',                 'Glandon Descent'),
    ],
}

POINTS = {
    'HC':      [25, 20, 16, 14, 12, 10],
    'Cat1':    [15, 12, 10, 8, 6, 4],
    'Cat2':    [10, 8, 6, 4, 2, 1],
    'Cat3':    [5, 3, 2, 1],
    'SPRINT':  [5, 3, 2, 1],
    'DESCENT': [5, 3, 2, 1],
}

output = {'stages': []}

for rid, stage_name in ROUTE_FILES.items():
    rp = DATA / f'route_{rid}.json'
    r = json.loads(rp.read_text(encoding='utf-8'))
    picks = PICKS.get(stage_name, [])
    stage_data = {
        'name': stage_name,
        'route_id': rid,
        'distance_km': round(r.get('distance', 0)/1000, 1),
        'elevation_gain_m': round(r.get('elevation_gain', 0)),
        'estimated_time_h': round(r.get('estimated_moving_time', 0)/3600, 1),
        'climbs': [],
        'sprints': [],
        'descents': [],
    }
    for cat, display_name, exact_match in picks:
        # Find best matching segment
        best = None
        for s in r.get('segments', []):
            sname = s.get('name', '')
            if exact_match in sname:
                if best is None or s.get('distance', 0) > best.get('distance', 0):
                    best = s
        if not best:
            print(f"⚠️  {stage_name} — could not find '{exact_match}'")
            continue
        cat_label = cat.replace('KOM:', '').replace('SPRINT', 'Sprint').replace('DESCENT', 'Descent')
        seg_info = {
            'name': display_name,
            'strava_segment_name': best.get('name'),
            'strava_segment_id': best.get('id'),
            'distance_km': round(best.get('distance', 0)/1000, 2),
            'avg_gradient_pct': best.get('average_grade', 0),
            'peak_elevation_m': best.get('elevation_high', 0),
            'starts_at_m': best.get('elevation_low', 0),
            'elevation_gain_m': round(abs(best.get('elevation_high', 0) - best.get('elevation_low', 0))),
            'category': cat_label,
            'points': POINTS.get(cat.replace('KOM:', ''), [5, 3, 2, 1]),
            'strava_url': f'https://www.strava.com/segments/{best.get("id")}',
        }
        if cat.startswith('KOM'):
            stage_data['climbs'].append(seg_info)
        elif cat == 'DESCENT':
            stage_data['descents'].append(seg_info)
        else:
            stage_data['sprints'].append(seg_info)
    output['stages'].append(stage_data)

out_path = Path(__file__).parent / 'segments.json'
out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding='utf-8')

print(f"✅ Wrote {out_path}\n")
for stage in output['stages']:
    print(f"\n[{stage['name']}]  {stage['distance_km']} km · {stage['elevation_gain_m']} hm")
    if stage['climbs']:
        print("  KOM-segmenter (bjergpoint):")
        for c in stage['climbs']:
            print(f"    [{c['category']:4}] {c['name']:30} · {c['distance_km']} km @ {c['avg_gradient_pct']}% · ID {c['strava_segment_id']}")
    if stage['sprints']:
        print("  Sprint-segmenter (mini-comps):")
        for s in stage['sprints']:
            print(f"    [SPRINT] {s['name']:30} · {s['distance_km']} km @ {s['avg_gradient_pct']}% · ID {s['strava_segment_id']}")
