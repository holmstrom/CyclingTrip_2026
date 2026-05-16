# Changelog — Cycling Trip 2026 / Race Center

Records design decisions and feature additions across sessions. Each
session that ships meaningful changes appends an entry here.

Format: `## YYYY-MM-DD — [Title]` with sections for *Why*, *What*, *How*.

---

## 2026-05-15 — Race Center MVP

### Why
- Existing site (`index.html`) already has nav, blog, program, budget, etc.
  But no actual race component: no Strava-segment scoring, no live standings,
  no team competition, no daily jersey updates, no AI stage recap.
- Group wanted: Tour-de-France-style competition (GC + KOM + Sprint + Team)
  with mountain points, daily jerseys, and segment-based mini-comps that
  riders can star on Strava to see live on their head units.

### What
- New page `/race-center.html` (separate from `/index.html` — keeps existing
  site untouched).
- Editorial cycling-luxury design (oxblood / brass / Archivo) — matches the
  personal Wahoo dashboard for visual consistency across both projects.
- 3 stages fully extracted from Strava routes:
  - Day 1: Alpe d'Huez (HC) + Col de Sarenne West (Cat 2) + Alpe Final Sprint
  - Day 2: Col du Galibier (HC) + 1ère Partie Opener (sprint) + Tunnel Punch (sprint)
  - Day 3: Croix de Fer (HC) + Glandon Second Ramp (Cat 1) + 3 sprints
    (Final 1k, Lac du Verney Flat TT, Glandon Final Push)
- Total: **5 KOM segments + 6 sprint segments = 11 segments**, each with
  direct Strava-segment-URL so riders can star them for live head-unit display.
- Team configuration (confirmed by user): **Team A = Frederik + Ulrich + Rasmus**,
  **Team B = Emil + Tobias + Sebastian** (constraint: Frederik ≠ Emil's team,
  Ulrich ≠ Tobias's team).
- Daily-jersey panel at top: 🟡 GC, 🔴 KOM, 🟢 Sprint, 🏁 Team — updates after
  each stage (placeholder until Strava OAuth).
- Standings tabs (GC / KOM / Sprint / Team) with per-stage breakdown.
- Countdown to 1. juni 2026, sticky nav, mobile-first layout.
- Guide section: how to star segments on Strava, points tables for HC/Cat1/Cat2,
  daily-jersey explanation, Phase 2 plan.

### How
- `race-center/segments_config.py` — curated picks per stage with hard-coded
  Strava segment name matches. Produces `segments.json` consumed by the page.
- `race-center/extract_climbs.py` — refined HC categorization (altitude > 2000m
  or length ≥ 20km counts as HC even at moderate gradient).
- `race-center.html` — single-file page with embedded CSS + JS. Uses
  the editorial design tokens (CSS variables). Fetches `race-center/segments.json`
  client-side. No backend needed for MVP.
- `race-center/data/route_*.json` — raw Strava route responses cached locally.

### Open (Phase 2)
- Strava OAuth for 5 friends → auto-pull FTP + weight + best-efforts.
- Auto-balance team split based on Strava-derived strength estimate.
- Cycling-physics prediction model (time per segment per rider).
- Daily auto-update mechanism: Strava webhooks (real-time) + GitHub Actions
  cron at 22:00 CET (backup) + manual "Sync nu" button.
- AI-generated daily stage recap via Claude API (interesting observations,
  who attacked, biggest surprise — same style as personal-dashboard coach-card).
- Deploy to Vercel for permanent public URL.
