
# Chapter 1 Balance Overhaul + Independent Box HP — IMPLEMENTED ✅

## Changes Made

### Part A: Independent Cargo Box HP
- Removed global `towerHpLevel` from `upgradeLevels`
- Added `cargoBoxHpLevels: [0, 0, 0]` (per-box HP upgrade levels)
- Save version 8 → 9 (hard reset on load)
- New `purchaseCargoBoxHp(boxIndex, cost)` function
- Each SmallHPTile in Garage reads/upgrades its own box
- Chassis (index 0) has fixed HP, no upgrade
- CoffeeRushGame applies per-box HP multiplier in initGame

### Part B: Balance Tuning

| Parameter | Old | New |
|-----------|-----|-----|
| BLOCK_MAX_HP | 380 | 220 |
| EARLY_GAME_SECONDS | 22 | 15 |
| LATCHED_TICK_DAMAGE | 4 | 5 |
| BLOCK_COUNT_MAX_LEVEL | 2 | 3 |
| BLOCK_COUNT_BASE_COST | 100 | 30 |
| UPGRADE_COST_SCALING | 1.50 | 1.65 |
| GATE_1_KILL_TARGET | 18 | 14 |
| GATE_2_KILL_TARGET | 26 | 22 |
| GATE_3_KILL_TARGET | 34 | 30 |
| BOSS_HP | 990 | 750 |

## Validation Needed

3 run summaries:
- Run 1 (fresh reset): should die ~25-35s
- Run 2 (after cargo box): should clear G1 but not G2
- Run 3+: gradual progress
