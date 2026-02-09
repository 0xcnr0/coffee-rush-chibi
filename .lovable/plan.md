

# Gate HP Remaining + Burst Spread A/B Test

## Part A: Gate HP Remaining in Overlay

Add a `gateHpRemainingByGate: number[]` field to `RunTelemetry` so the Stage Breakdown line shows actual remaining HP at run end.

### Changes

**`src/game/types.ts`**
- Add `gateHpRemainingByGate: number[]` to `RunTelemetry`

**`src/game/CoffeeRushGame.tsx`**
- In `buildTelemetry()`: snapshot current gate HP into `gateHpRemainingByGate`. For the current stage gate, read `gateBuildingRef.current.hp`. For previous stages (destroyed), use 0. For unreached stages, use the full `gateHP` from config.
- No new ref needed -- this is a point-in-time snapshot at telemetry build time.

**`src/game/RunSummaryOverlay.tsx`**
- Change stage line from `HP 1000/1000` to `HP rem: 960/1000` using `t.gateHpRemainingByGate[i]`.

---

## Part B: Controlled Spread Burst Firing Mode

The current auto-attack always targets the nearest enemy with a single projectile. With continuous spawning, enemies almost always block LoS to the gate, resulting in ~1 bullet reaching the gate per run. A configurable burst-spread mode lets us A/B test whether angular spread improves gate damage flow.

### How It Works

When `SPREAD_MODE = 'burst_spread'`, each auto-attack trigger fires `BURST_COUNT` (default 3) projectiles simultaneously with angular offsets of `[-WEAPON_SPREAD_DEG, 0, +WEAPON_SPREAD_DEG]` degrees from the line to the nearest enemy. The spread projectiles use the same damage and speed. Some will miss enemies and hit the gate behind them.

### Changes

**`src/game/config.ts`**
- Add to `GAME_CONFIG`:
  - `SPREAD_MODE: 'single' as 'single' | 'burst_spread'`
  - `WEAPON_SPREAD_DEG: 6`
  - `BURST_COUNT: 3`
  - `BURST_INTERVAL_MS: 0` (all fired simultaneously for simplicity; can add stagger later)

**`src/game/CoffeeRushGame.tsx`**

Auto-attack section (~line 990-1004):
- When `SPREAD_MODE === 'single'`: current behavior (unchanged)
- When `SPREAD_MODE === 'burst_spread'`:
  1. Find nearest enemy (same as now)
  2. Compute base angle from cart to nearest enemy
  3. For each of `BURST_COUNT` projectiles, compute spread angle offset (symmetric: e.g. -6, 0, +6 degrees)
  4. For each offset, create a new target point at that angle at the same distance
  5. Call a new `fireProjectileAtAngle(originX, originY, angle, distance)` helper (or modify `fireProjectile` to accept target coords directly)
  6. Increment `shotsFiredRef` by `BURST_COUNT`

New helper or modified `fireProjectile`:
- Accept raw `targetX, targetY` instead of an Enemy object
- The existing projectile collision logic already handles gate hits for any projectile trajectory, so no changes needed there

Telemetry additions:
- Add `burstsTriggered: number` to `RunTelemetry`
- Add `burstsTriggeredRef` in CoffeeRushGame, reset in `initGame()`, increment per burst trigger
- Include in `buildTelemetry()`

**`src/game/RunSummaryOverlay.tsx`**
- In LoS section, add: `Bursts: {burstsTriggered}` (only when spread mode active)
- In Config Snapshot, add: `SPREAD_MODE`, `WEAPON_SPREAD_DEG`, `BURST_COUNT`

**`src/game/types.ts`**
- Add `burstsTriggered: number` to `RunTelemetry`

---

## Technical Details

### Spread Angle Math

```text
baseAngle = atan2(targetY - originY, targetX - originX)
for i in 0..BURST_COUNT-1:
  offset = WEAPON_SPREAD_DEG * (i - (BURST_COUNT-1)/2) * (PI/180)
  angle = baseAngle + offset
  targetX = originX + cos(angle) * distance
  targetY = originY + sin(angle) * distance
```

### Implementation Order

1. Add `gateHpRemainingByGate` to telemetry type, buildTelemetry, and overlay
2. Add spread config values to `GAME_CONFIG`
3. Add `burstsTriggered` to telemetry type
4. Modify auto-attack in game loop with spread mode branch
5. Add a `fireProjectileAt(targetX, targetY, ...)` variant
6. Update overlay to show burst stats and new config values

### Default Behavior

`SPREAD_MODE` defaults to `'single'` -- zero gameplay change until manually toggled to `'burst_spread'` in config. This is safe for testing.

