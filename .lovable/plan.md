
# Gate HP Remaining + Burst Spread A/B Test — IMPLEMENTED

## Status: ✅ Complete

### Part A: Gate HP Remaining — ✅ Done
- `gateHpRemainingByGate: number[]` added to `RunTelemetry`
- `buildTelemetry()` snapshots current/destroyed/unreached gate HP
- Overlay shows `HP rem: 960/1000` format

### Part B: Burst Spread Firing — ✅ Done
- `SPREAD_MODE`, `WEAPON_SPREAD_DEG`, `BURST_COUNT` in `GAME_CONFIG`
- Default: `'single'` (zero gameplay change)
- `burst_spread` mode fires N projectiles with symmetric angular offsets
- `fireProjectileAt(targetX, targetY)` helper added
- `burstsTriggered` telemetry field tracks burst activations
- Overlay shows burst stats when spread mode active
- Config snapshot includes spread settings

### Testing
- Toggle `SPREAD_MODE` to `'burst_spread'` in config.ts to test
- Compare "To Gate" shots between single vs burst_spread runs
