"""Extract climb profiles from the 3 saved Strava routes.
Categorize each significant climb (HC / Cat 1 / Cat 2 / Cat 3) using TdF
points criterion: length × avg_gradient combined."""
import json
from pathlib import Path

DATA = Path(__file__).parent / 'data'

def categorize(length_km: float, gradient_pct: float, peak_m: float) -> str:
    """Tour de France-style climb categorization.
    HC = Hors Categorie (extreme — Alpe d'Huez, Galibier, Croix de Fer).
    Cat 1-4 based on combined difficulty score.
    Refined: altitude > 2000m + length >= 8km is also HC even if grade is
    moderate (thin air + duration). Length >= 20km + grade >= 5% is HC too."""
    score = length_km * gradient_pct
    elev_gain = length_km * gradient_pct * 10  # approx hm climbed
    if length_km >= 8 and gradient_pct >= 7:
        return 'HC'
    if length_km >= 8 and peak_m >= 2000:
        return 'HC'  # altitude penalty — thin air at 2000m+
    if length_km >= 20 and gradient_pct >= 5:
        return 'HC'  # ultra-long sustained climb
    if elev_gain >= 900:
        return 'HC'  # raw vertical gain criterion
    if length_km >= 5 and gradient_pct >= 7:
        return 'Cat 1'
    if score >= 30:
        return 'Cat 1'
    if score >= 16:
        return 'Cat 2'
    if score >= 6:
        return 'Cat 3'
    return 'Cat 4'

POINTS = {
    'HC':    [25, 20, 16, 14, 12, 10, 8, 6, 4, 2],
    'Cat 1': [15, 12, 10, 8, 6, 4, 2, 1],
    'Cat 2': [10, 8, 6, 4, 2, 1],
    'Cat 3': [5, 3, 2, 1],
    'Cat 4': [2, 1],
}

routes = sorted(DATA.glob('route_*.json'))
print(f"Found {len(routes)} route files\n")

for rp in routes:
    r = json.loads(rp.read_text(encoding='utf-8'))
    print(f"=" * 75)
    print(f"  {r.get('name')}")
    print(f"  {r.get('distance',0)/1000:.1f} km · {r.get('elevation_gain',0):.0f} hm")
    print(f"=" * 75)

    # Collect segments that look like climbs (positive gradient, meaningful length)
    climbs = []
    for s in r.get('segments', []):
        name = s.get('name', '')
        length = s.get('distance', 0) / 1000
        grade = s.get('average_grade', 0)
        peak = s.get('elevation_high', 0)
        if length < 0.5: continue  # too short
        if grade < 3.0: continue   # not a climb
        if 'descent' in name.lower() or 'downhill' in name.lower(): continue
        if 'sprint' in name.lower(): continue
        cat = categorize(length, grade, peak)
        climbs.append((name, length, grade, peak, cat))

    # Dedupe overlapping segments — keep longest per "main climb" name root
    # Simple heuristic: cluster by first 3 words of name
    seen_roots = {}
    for c in climbs:
        root = ' '.join(c[0].lower().split()[:3])
        if root not in seen_roots or c[1] > seen_roots[root][1]:
            seen_roots[root] = c
    deduped = sorted(seen_roots.values(), key=lambda c: c[3], reverse=True)  # by peak elevation

    print(f"\n  Climbs identified ({len(deduped)} significant):")
    for name, length, grade, peak, cat in deduped[:8]:
        pts_top = POINTS.get(cat, [0])[0]
        print(f"    [{cat:5}]  {name[:46]:46} · {length:5.2f} km @ {grade:4.1f}% · peak {peak:5.0f}m  → {pts_top} pts top")
    print()
