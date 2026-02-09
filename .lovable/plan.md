
# Shotgun Coffee Firing Mode — TDS-Style v2

## Status: ✅ Complete

### Shotgun Mode (v2 — TDS-style 6 pellets + smart targeting)
- `WEAPON_MODE: 'shotgun'` (default active) in `GAME_CONFIG`
- 6 pellets per shot, 22° base cone (14°–28° dynamic range)
- `SHOTGUN_SPREAD_DISTANCE_SCALE: 0.35` — spread widens with distance
- `PROJECTILE_RADIUS` reduced to 2 (tiny coffee pellets)
- Weighted-center damage split preserves DPS

### Smart Target Selection (NEW)
- Each burst picks a target mode via weighted random:
  - **front**: nearest enemy (classic)
  - **mid**: random from middle 40% of enemies by X
  - **back**: random from farthest 30%
  - **gate**: aim at gate area with Y jitter
- Weights shift based on crowding:
  - Crowded (≥6 enemies near cart): 70/20/5/5
  - Normal: 45/25/15/15

### Aim Variation (TDS feel)
- `AIM_Y_TILT: -6` slight upward bias
- `AIM_Y_JITTER: 10` random vertical offset per burst
- Combined with wider spread creates natural "scatter" pattern

### Telemetry
- `shotsFired` counts individual pellets
- `burstsTriggered` counts shotgun trigger pulls
- `targetModeCounts: { front, mid, back, gate }` per run
- Overlay shows target mode distribution + aim config
- Config snapshot includes spread range, jitter, crowding params

### Previous Features (still active)
- `gateHpRemainingByGate` snapshots gate HP at run end
- `gateDestroyedByGate` tracks which gates were destroyed
