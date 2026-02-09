
# Shotgun Coffee Firing Mode — IMPLEMENTED

## Status: ✅ Complete

### Shotgun Mode
- `WEAPON_MODE: 'shotgun'` (default active) in `GAME_CONFIG`
- 4 pellets per shot, 10° cone spread, weighted_center damage split
- `PROJECTILE_RADIUS` reduced from 12 → 3 (tiny coffee pellets)
- Renderer simplified to scale-aware circle (no hardcoded offsets)
- `fireProjectileAt()` accepts custom per-pellet damage
- Pellet cap: 6 max for safety
- Projectile pool expanded from 50 → 80

### Damage Split (weighted_center)
- Center pellets deal more damage, edge pellets less
- Sum of pellet damages ≈ baseDamage (DPS preserved)
- Min 1 damage per pellet

### Telemetry
- `shotsFired` counts individual pellets
- `burstsTriggered` counts shotgun trigger pulls
- Overlay shows shotgun config + burst stats
- Config snapshot includes WEAPON_MODE, pellet count, spread, split mode, radius

### Previous Features (still active)
- `gateHpRemainingByGate` snapshots gate HP at run end
- `gateDestroyedByGate` tracks which gates were destroyed
