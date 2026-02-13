

# Stage 2 Pacing + Star Throw Ground Path + Balance Nerf

## 3 Issues to Fix

### 1. Stage 2 Gate Appears Too Early

Currently Stage 2 uses continuous spawning (no wave system) and the gate appears right after the TRAVEL phase ends. The fix:

- **Extend Stage 2 travel duration** from 4.0s to 8.0s in `TRAVEL_DURATION_BY_STAGE`, giving more time for enemies to arrive and deal damage before the gate appears.
- **Add wave-based spawning to Stage 2** (like Stage 1's pilot system). This creates natural breathing windows and a build-up feel rather than the gate immediately appearing with enemies.

**Config changes (`config.ts`):**
- `TRAVEL_DURATION_BY_STAGE[1]`: 4.0 -> 8.0
- Add `STAGE2_WAVE_SIZE: 4` and `STAGE2_WAVE_BREATHER: 0.8` constants

**Game loop changes (`CoffeeRushGame.tsx`):**
- Expand the wave-based spawning logic (currently `isStage1Siege` only) to also cover Stage 2 using `STAGE2_WAVE_SIZE` and `STAGE2_WAVE_BREATHER`.

### 2. Star Throw Flies Too High (Misses Enemies)

The star throw currently launches from `topBlock.y + MUZZLE_Y_OFFSET` -- the same height as the shotgun. This means it flies above many enemies.

**Fix (`CoffeeRushGame.tsx` line 766):**
- Change the Y position to ground level: `groundY - 30` (just above the road surface, where enemies walk).
- Keep X the same (fires from cart front).

This ensures the star rolls/slides along the ground and hits enemies reliably.

### 3. Star + Passive Too Strong (Clearing Stage 3 Too Easily)

Current values make the combined saw passive + throw too powerful. Nerf both:

**Config changes (`config.ts`):**

| Parameter | Current | New | Reasoning |
|---|---|---|---|
| `SAW_PASSIVE_TICK_DAMAGE` | 7 | 5 | Passive should be chip damage, not a killer |
| `SAW_THROW_DAMAGE` | 18 | 14 | Throw should help with gates, not trivialize them |
| `SAW_THROW_SPEED` | 320 | 280 | Slower = more dodgeable by placement |

These are initial nerfs. The user plans to collect run summaries after this patch for data-driven fine-tuning.

---

## Files Changed

| File | Change |
|---|---|
| `config.ts` | Travel duration for Stage 2: 4->8s, add Stage 2 wave constants, nerf star damage values |
| `CoffeeRushGame.tsx` | Extend wave spawning to Stage 2, fix star throw Y to ground level |

