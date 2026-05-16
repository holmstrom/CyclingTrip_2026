"""Verify climbs by extracting their Strava segment IDs and full distance/elevation,
so we can:
1. Tell riders the exact segment-ID to star on Strava (appears on head unit).
2. Make sure the KOM scoring uses the right segments.
"""
import json
from pathlib import Path

DATA = Path(__file__).parent / 'data'

# Manually curated: the *real* climbs we score on each stage, with the
# Strava segment names we'll look for to extract IDs.
TARGET_CLIMBS = {
    'Dag 1: Alpe d': [
        ('HC',    'Alpe d\'Huez'),
        ('Cat 2', 'Col de Sarenne West'),
    ],
    'Dag 2: Col du Galibier': [
        ('HC',    'Col du Galibier'),       # full climb — we'll look for longest matching
    ],
    'Dag 3: Col de la Croix de Fer': [
        ('HC',    'Col de la Croix de Fer'),
        ('Cat 1', 'Glandon'),
    ],
}

# Sjove segmenter (mini-comps) — must be on Strava already.
# Each entry: (display_name, exact_segment_name_to_match)
TARGET_SPRINTS = {
    'Dag 1':  ('Alpe d\'Huez Final Sprint',    'Hairpin 1 to Marked Official Chrono Finish Lin'),
    'Dag 2':  ('Galibier Tunnel-til-Top Punch', 'GALIBIER: FROM THE TUNNEL TO THE TOP'),
    'Dag 3a': ('Croix de Fer Final 1k',         'Final 1k'),
    'Dag 3b': ('Lac du Verney Flat TT',         'Lac du Verney sprint'),
    'Dag 3c': ('Glandon Final Push',            'Glandon Final Push'),
}

routes = sorted(DATA.glob('route_*.json'))

print("=" * 75)
print("CLIMB SEGMENTS — to score for KOM points")
print("=" * 75)

for rp in routes:
    r = json.loads(rp.read_text(encoding='utf-8'))
    name = r.get('name', '')
    # Match to target by name prefix
    matching_key = None
    for key in TARGET_CLIMBS:
        if key in name:
            matching_key = key; break
    if not matching_key: continue
    print(f"\n[{name}]")
    targets = TARGET_CLIMBS[matching_key]
    for cat, target_name in targets:
        # Find longest segment whose name contains target_name
        candidates = [
            s for s in r.get('segments', [])
            if target_name.lower() in s.get('name', '').lower()
            and 'descent' not in s.get('name', '').lower()
            and 'sprint' not in s.get('name', '').lower()
        ]
        if not candidates:
            print(f"  {cat:5}  {target_name}: NO MATCH FOUND")
            continue
        # Longest by distance
        best = max(candidates, key=lambda s: s.get('distance', 0))
        seg_id = best.get('id')
        sname = best.get('name', '')
        dist = best.get('distance', 0) / 1000
        grade = best.get('average_grade', 0)
        peak = best.get('elevation_high', 0)
        starts_at = best.get('elevation_low', 0)
        elev_gain = (best.get('elevation_high', 0) - best.get('elevation_low', 0))
        print(f"  [{cat:5}] '{sname}'")
        print(f"         Strava segment ID: {seg_id}")
        print(f"         URL: https://www.strava.com/segments/{seg_id}")
        print(f"         {dist:.2f} km @ {grade:.1f}% · {starts_at:.0f}m → {peak:.0f}m (= {elev_gain:.0f} hm)")

print("\n" + "=" * 75)
print("SPRINT SEGMENTS — mini-comps")
print("=" * 75)

for rp in routes:
    r = json.loads(rp.read_text(encoding='utf-8'))
    name = r.get('name', '')
    if 'Dag 1' in name: day = 'Dag 1'
    elif 'Dag 2' in name: day = 'Dag 2'
    elif 'Dag 3' in name: day = 'Dag 3'
    else: continue
    # Day 3 has 3 sprints — process them differently
    relevant_sprints = [(k, v) for k, v in TARGET_SPRINTS.items() if k.startswith(day)]
    for sprint_key, (display_name, keywords) in relevant_sprints:
        # Find segment matching any keyword
        candidates = []
        for s in r.get('segments', []):
            sname_lower = s.get('name', '').lower()
            for kw in keywords:
                if kw in sname_lower:
                    candidates.append(s); break
        if not candidates:
            print(f"\n  {sprint_key} ({display_name}): NO MATCH")
            continue
        best = candidates[0]  # first match (could refine)
        seg_id = best.get('id')
        sname = best.get('name', '')
        dist = best.get('distance', 0) / 1000
        grade = best.get('average_grade', 0)
        print(f"\n  {sprint_key} — '{display_name}'")
        print(f"    Bound Strava segment: '{sname}'")
        print(f"    Segment ID: {seg_id}")
        print(f"    URL: https://www.strava.com/segments/{seg_id}")
        print(f"    {dist:.2f} km @ {grade:.1f}%")
