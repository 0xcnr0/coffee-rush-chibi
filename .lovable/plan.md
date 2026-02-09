

# Run-Based Shotgun Tuning (4 Changes)

Based on 9 runs of telemetry data, four targeted adjustments to stabilize hit rate (target 88-95%), cap gate hits (8-16), and maintain earned coins.

## Changes

### 1. Reduce gate targeting probability (~50% cut)

**`src/game/config.ts`**
- `TARGET_WEIGHTS_NORMAL`: change from `[0.45, 0.25, 0.15, 0.15]` to `[0.50, 0.25, 0.17, 0.08]` (gate 15% down to 8%)
- `TARGET_WEIGHTS_CROWDED`: keep as `[0.70, 0.20, 0.05, 0.05]` (already low)

**`src/game/CoffeeRushGame.tsx`** (gate aim point, ~line 1087)
- When gate mode is chosen, aim at `g.x - 80` instead of `g.x - 40` (further in front of gate, so pellets pass through enemy lane first)

### 2. Distance-scaled jitter

**`src/game/CoffeeRushGame.tsx`** (~line 1097)
- Replace fixed jitter with: `jitterScaled = AIM_Y_JITTER * clamp(dist / CROWDING_RANGE, 0.35, 1.0)`
- Needs distance computed before jitter is applied -- move distance calc earlier or use a quick estimate from `aimTarget.x - originX`

Current code:
```
const jitteredY = aimTarget.y + AIM_Y_TILT + (Math.random() * 2 - 1) * AIM_Y_JITTER;
```
New:
```
const roughDist = Math.abs(aimTarget.x - originX);
const jitterScale = Math.max(0.35, Math.min(1.0, roughDist / CROWDING_RANGE));
const scaledJitter = AIM_Y_JITTER * jitterScale;
const jitteredY = aimTarget.y + AIM_Y_TILT + (Math.random() * 2 - 1) * scaledJitter;
```

### 3. Wider but edge-biased spread

**`src/game/config.ts`**
- `SHOTGUN_SPREAD_DEG_MIN`: 14 to 16
- `SHOTGUN_SPREAD_DEG_MAX`: 28 to 32

**`src/game/CoffeeRushGame.tsx`** (~line 1128, pellet angle offset)
- Apply edge-bias by raising the normalized `t` value: `t = sign(t) * |t|^1.25`
- Current: `const offset = spreadRad * (i - (count-1)/2) / max(count-1, 1)`
- New: compute normalized t in [-1,1], apply power curve, then multiply by spreadRad/2:
```
const t = (i - (count - 1) / 2) / Math.max((count - 1) / 2, 1);
const biasedT = Math.sign(t) * Math.pow(Math.abs(t), 0.8); // <1 = push toward edges
const offset = biasedT * spreadRad / 2;
```
(Power 0.8 pushes pellets slightly outward; 1.0 = linear as before)

### 4. Gate pressure limiter (runtime safety valve)

**`src/game/CoffeeRushGame.tsx`**
- Add a simple rolling check: if `shotsToGateRef.current / shotsFiredRef.current > 0.08` AND `shotsFiredRef.current > 30` (enough samples), force `targetMode = 'front'` when gate/back/mid is rolled
- This is a ~5-line check right after the weighted random pick (line ~1068), before aim target computation
- Once ratio normalizes below 0.08, normal weights resume

## Summary of config changes

| Parameter | Old | New |
|-----------|-----|-----|
| TARGET_WEIGHTS_NORMAL | [0.45, 0.25, 0.15, 0.15] | [0.50, 0.25, 0.17, 0.08] |
| SHOTGUN_SPREAD_DEG_MIN | 14 | 16 |
| SHOTGUN_SPREAD_DEG_MAX | 28 | 32 |

## Files modified
- `src/game/config.ts` -- 3 constant changes
- `src/game/CoffeeRushGame.tsx` -- jitter scaling, edge-biased spread, gate aim offset, pressure limiter

## Expected outcomes
- Hit rate: 88-95% (up from 76-87%)
- To Gate: 8-16 per run (down from spikes of 24)
- Earned: 30-45 in longer runs (maintained)

