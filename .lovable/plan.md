

# Gate Fix Pack: Geometry + Lock-On + Hitbox + Feedback

Four changes to make gate hits feel solid, plus a temporary HP reduction for validation.

## Problem Summary

Run data shows hit% is fine (88-95%), but gate damage is too low because:
- Muzzle Y is too high and AIM_Y_TILT too steep -- pellets go under the gate
- No "snap lock" to gate when lane is clear
- Gate collider is only 80px tall (easy to miss)
- No visual feedback when gate takes bullet damage

## Changes

### 1. Geometry Fix (config.ts)

**`src/game/config.ts`**
- `MUZZLE_Y_OFFSET`: 50 to 75 (lower origin = flatter shots toward gate center)
- `AIM_Y_TILT`: -6 to -2 (less downward bias, pellets stay at gate height)

### 2. Gate Snap Lock (CoffeeRushGame.tsx, ~line 1054-1076)

After the weighted random target pick, before the pressure limiter:

- Count enemies within 150px of cart (`nearCount`)
- If `nearCount === 0` AND gate exists and is not destroyed: force `targetMode = 'gate'`
- This ensures when the lane is clear, the cart locks onto the gate (TDS behavior)

The existing gate pressure limiter (line 1070-1076) stays as a safety valve for when enemies ARE present.

### 3. Gate Collider Height x2 (CoffeeRushGame.tsx + config.ts)

**`src/game/config.ts`**
- `GATE_BUILDING_HEIGHT`: 80 to 160

This doubles the invisible collision zone. The visual drawing in `renderer.ts` (`drawGateBuilding`) already uses `gate.height` for the rectangle, so the visual will also grow taller. This is acceptable -- a bigger gate looks more imposing.

The gate Y position is calculated as `groundY - GATE_BUILDING_HEIGHT` (line 759), so a taller gate will extend further upward, making it much easier for horizontal pellets to hit.

**Gate aim target point** (line 1094-1095): Currently aims at `g.x - 80, originY + random`. Change to aim at gate's vertical center:
```
aimTarget = { x: g.x - 40, y: g.y + g.height / 2 + (Math.random() * 40 - 20) }
```
This targets the collider center instead of the muzzle's Y level.

### 4. Gate Damage Feedback (renderer.ts)

In `drawGateBuilding`, add a hit flash effect:
- Track a `lastHitTime` on the GateBuilding type
- When gate takes bullet damage (CoffeeRushGame.tsx line 1213), set `g.lastHitTime = currentTime`
- In renderer, if `currentTime - gate.lastHitTime < 0.15`, draw a white flash overlay on the gate

Also spawn a floating damage number on gate hits (reuse the existing `spawnParticles` or `spawnTip` system) -- the particle sparkle at line 1217 already exists but is subtle. Add a brief white overlay flash on the gate sprite for stronger feedback.

### 5. Temporary Validation: Stage 1 Gate HP (config.ts)

**`src/game/config.ts`** -- STAGES array:
- Stage 1 `gateHP`: 1000 to 600 (temporary, for testing gate destruction flow)

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/game/config.ts` | MUZZLE_Y_OFFSET 50->75, AIM_Y_TILT -6->-2, GATE_BUILDING_HEIGHT 80->160, Stage 1 HP 1000->600 |
| `src/game/CoffeeRushGame.tsx` | Gate snap lock logic (~5 lines after line 1068), gate aim target to collider center |
| `src/game/renderer.ts` | Hit flash overlay in drawGateBuilding |
| `src/game/types.ts` | Add `lastHitTime?: number` to GateBuilding type |

### Gate Snap Lock Logic (pseudocode)

```text
// After weighted random pick (line 1068), before pressure limiter (line 1070):
const nearEnemies = enemies.filter(e => e.x < cartX + 150);
if (nearEnemies.length === 0 && gateBuildingRef.current && !gateBuildingRef.current.isDestroyed) {
  targetMode = 'gate';
}
```

### Gate Aim Target Fix

Current (line 1094-1095):
```text
aimTarget = { x: g.x - 80, y: originY + (Math.random() * 70 - 35) }
```
New:
```text
aimTarget = { x: g.x - 40, y: g.y + g.height / 2 + (Math.random() * 40 - 20) }
```
Aims at collider center with small random scatter, not at muzzle height.

### Hit Flash in Renderer

```text
// In drawGateBuilding, after drawing the body:
if (gate.lastHitTime && (currentTime - gate.lastHitTime) < 0.15) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill(); // reuse the same rounded rect path
}
```
Note: `currentTime` needs to be passed to `drawGateBuilding` -- will add it as a parameter.

## Expected Outcomes

- Gate damage per run should increase significantly (lane-clear = full lock-on)
- Hit% should stay 88-95% (geometry fix helps, not hurts)
- Stage 1 gate at 600 HP should be destroyable in medium-length runs, validating the gate destruction flow
- Gate hit flash gives clear "I'm damaging it" feedback

## What This Does NOT Include (Next Phase)

- TRAVEL -> APPROACH -> SIEGE cinematic flow (separate work package)
- Gate slide-in animation
- These will be done after gate mechanics feel right

