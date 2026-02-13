

# Fix: Post-Gate Enemy Gap + Star System Overpower Nerf

## Telemetry Analysis

| Run | Duration | Stage | Key Issue |
|-----|----------|-------|-----------|
| Run1 | 16.7s | G1 (8%) | Baseline - good first death timing |
| Run3 | 86.7s | G2 (3.5%) | G1 cleared, died quickly at G2 |
| Run4 | 101s | G2 (5%) | **No enemies after G1 for long stretch** |
| Run5 | 137.8s | G3 (1.3%) | **Star passive alone clears everything, 0 bombs used, 245 kills** |

---

## Problem 1: No Enemies After Gate Victory (13-second dead zone)

The post-gate flow for Stage 2+ is:
1. VICTORY: gate cleanup **kills all enemies** (0.8s)
2. BREATHER: spawns at 40% rate (4s) -- barely any enemies appear
3. TRAVEL (Stage 2): **despawns all enemies AND spawns nothing** (8s)
4. APPROACH: no spawning (1s)

That is **13 seconds** of near-zero enemies before Stage 2 siege begins. The user correctly observed "g1 sonrasi hic enemy gelmeden bir sure devam etti."

### Fix

Make Stage 2+ TRAVEL phase spawn enemies continuously (like Stage 1 already does) instead of despawning them. This fills the dead zone with pressure.

**In `CoffeeRushGame.tsx` (lines 923-955):**
- Remove the enemy despawn logic for Stages 2+
- Add enemy spawning during TRAVEL for all stages (using that stage's spawn interval)
- Keep the existing Stage 1 spawning logic as-is

---

## Problem 2: Star Passive is Overpowered

Current: 5 damage every 0.25s = **20 DPS** in a 65px radius.
- Stage 1 enemy (32 HP): dies in 1.6s from passive alone
- Stage 2 enemy (41 HP): dies in 2.0s from passive alone
- Stage 3 enemy (54 HP): dies in 2.7s from passive alone

Combined with shotgun auto-fire, enemies never even reach the cart. Run 5 shows 245 kills, 0 bombs, 0 star throws -- pure passive dominance.

### Fix

Nerf passive to chip-damage role, not a primary damage source:

| Parameter | Current | New | Result |
|---|---|---|---|
| `SAW_PASSIVE_TICK_DAMAGE` | 5 | 2 | Chip damage only |
| `SAW_PASSIVE_TICK_INTERVAL` | 0.25s | 0.40s | Slower ticks |

New DPS: 2 / 0.40 = **5 DPS** (down from 20 DPS, 75% reduction).
- Stage 1 enemy (32 HP): 6.4s from passive alone (needs shotgun help)
- Stage 2 enemy (41 HP): 8.2s from passive alone

This makes the passive a helper, not a solo killer.

---

## Problem 3: Star Throw Too Strong for Gates

Star throw pierces through all enemies AND hits the gate for full 14 damage. A couple of throws can chunk gates significantly. The user noted "bir iki kez yildiz firlatmak yetiyor gate 2 ve 3u kesmek icin."

### Fix

| Parameter | Current | New | Reasoning |
|---|---|---|---|
| `SAW_THROW_DAMAGE` | 14 | 8 | Throw is a lane-clear tool, not a gate-buster |
| `SAW_THROW_SPEED` | 280 | 240 | Slower travel = less reliable |
| `SAW_THROW_LIFETIME` | 1.1s | 0.9s | Shorter range, might not reach gate |

---

## Summary of All Config Changes

**`config.ts`:**
- `SAW_PASSIVE_TICK_DAMAGE`: 5 -> 2
- `SAW_PASSIVE_TICK_INTERVAL`: 0.25 -> 0.40
- `SAW_THROW_DAMAGE`: 14 -> 8
- `SAW_THROW_SPEED`: 280 -> 240
- `SAW_THROW_LIFETIME`: 1.1 -> 0.9

**`CoffeeRushGame.tsx`:**
- Stage 2+ TRAVEL phase: remove enemy despawn, add enemy spawning (same as Stage 1 pattern)

## Files Changed

| File | Change |
|---|---|
| `config.ts` | Nerf star passive (2 dmg / 0.4s) and throw (8 dmg, slower, shorter) |
| `CoffeeRushGame.tsx` | Stage 2+ TRAVEL spawns enemies instead of despawning them |

