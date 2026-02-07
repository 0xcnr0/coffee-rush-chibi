

# Chapter 1 Balance Overhaul + Independent Box HP

## Two Changes

1. Each cargo box gets its own HP upgrade button (max 3 cargo boxes)
2. Rebalance Chapter 1 progression curve

---

## Part A: Independent Cargo Box HP

**Data model (persistence.ts):**
- Remove `upgradeLevels.towerHpLevel`
- Add `cargoBoxHpLevels: [0, 0, 0]` (one level per possible cargo box)
- Save version 8 -> 9
- Migration: old `towerHpLevel` value applied to all existing boxes
- New `purchaseCargoBoxHp(boxIndex, cost)` function

**Garage UI (GarageOverlay.tsx):**
- Each cargo box gets its own SmallHPTile reading `cargoBoxHpLevels[i]`
- Remove "HP" from bottom horizontal upgrade row (keep Power + Damage)

**Game init (CoffeeRushGame.tsx):**
- Each block gets HP = `BLOCK_MAX_HP * (1 + 0.30 * cargoBoxHpLevels[i])`
- Chassis (index 0) stays at base HP, no upgrade

---

## Part B: Balance Tuning

**Approach:** Two levers together (lower HP + earlier pressure), not one extreme.

| Parameter | Current | New | Rationale |
|-----------|---------|-----|-----------|
| BLOCK_MAX_HP | 380 | 220 | Mid-range: not fragile, not tanky. Run 1 dies from combo of HP + rush |
| EARLY_GAME_SECONDS | 22 | 15 | Rush arrives sooner |
| LATCHED_TICK_DAMAGE | 4 | 5 | Slightly more pressure per latched enemy |
| BLOCK_COUNT_MAX_LEVEL | 2 | 3 | Max 3 cargo boxes (1 chassis + 3 cargo = 4 blocks) |
| BLOCK_COUNT_BASE_COST | 100 | 30 | Affordable after Run 1 |
| UPGRADE_COST_SCALING | 1.50 | 1.65 | Requires grinding for later upgrades |
| GATE_1_KILL_TARGET | 18 | 14 | Shorter gate |
| GATE_2_KILL_TARGET | 26 | 22 | Reachable with upgrades |
| GATE_3_KILL_TARGET | 34 | 30 | Reachable with more upgrades |
| BOSS_HP | 990 | 750 | Proportional to lower player HP |

**Not touching:** TIP_VALUE, spawn intervals, rush multipliers, enemy speed, power costs, boss damage.

**Run 1 math (0 upgrades, 1 block, 220 HP):**
- 0-15s: warmup, light spawns, 2-3 latched
- 15s: rush starts, 5 latched within seconds
- DPS at 5 latched: 5 x 5 / 0.5 = 50 DPS
- 220 HP / 50 = ~4.4s at full latch
- Total survival: ~25-30s
- Kills ~12-15 enemies = 24-30 coins -> can buy cargo box (30 coins)

**Run 2 (1 cargo box, 2 blocks = 440 HP):**
- Survives first rush, clears G1 (14 kills)
- Dies during G2

**Later runs:** gradual progress through G2, G3, boss with upgrades.

---

## Files Changed

| File | What |
|------|------|
| persistence.ts | cargoBoxHpLevels, migration, purchaseCargoBoxHp(), version 9 |
| config.ts | 10 parameter changes |
| GarageOverlay.tsx | Per-box HP tiles, remove global HP from bottom row |
| CoffeeRushGame.tsx | initGame per-box HP multiplier |

---

## After Implementation

I will need 3 run summaries:
- Run 1 (fresh reset): should die ~25-35s
- Run 2 (after cargo box): should clear G1 but not G2
- Run 3+: gradual progress

If curve is off, we adjust 1-2 numbers only (BLOCK_MAX_HP or LATCHED_TICK_DAMAGE).

