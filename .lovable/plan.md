
# TDS-Style Progression System - Implementation Status

## Overview
Transform the game's progression system to feel more like TDS, implementing in three phases: Quick Wins (energy + caps), Garage UI, and Block Progression.

---

## ✅ PHASE 1.6A - Quick Wins (COMPLETED)

### Changes Made:
1. **Energy starts at 0** - TDS pacing where auto-attack handles early enemies while energy fills
2. **Upgrade caps reduced to 3** - Max level for core upgrades is now 3 (was 20)
3. **Bonus values increased** - Tower HP +15%/level, Espresso +12%/level, Energy +10%/level
4. **SAVE_VERSION bumped to 4** - Resets all saves for new system

---

## ✅ PHASE 1.6B - Garage UI (COMPLETED)

### Changes Made:
1. **GarageScreen created** - Combines MenuScreen + UpgradesScreen into single view
2. **MenuScreen deleted** - Replaced by GarageScreen
3. **UpgradesScreen deleted** - Merged into GarageScreen
4. **EndScreen updated** - Removed Upgrades button (Home now returns to GarageScreen)
5. **Types updated** - Removed 'UPGRADES' from GameState
6. **"Recommended" badge** - Soft guidance for next upgrade (★ icon)

---

## ✅ PHASE 1.7 - Block Progression (COMPLETED)

### Changes Made:
1. **blockCountLevel added to persistence** - 0=1block, 1=2blocks, 2=3blocks
2. **Block count config** - BLOCK_COUNT_MAX_LEVEL: 2, BLOCK_COUNT_BASE_COST: 25
3. **Dynamic block count** - Game initializes with 1 + blockCountLevel blocks
4. **Chassis visual** - Block 0 renders as thin chassis bar (40% height, dark metallic)
5. **Cargo boxes** - Blocks 1+ render as normal cargo boxes
6. **GarageScreen updated** - Includes 4th upgrade card for "Add Cargo Box"
7. **Barista positioning** - Updated to account for chassis vs cargo box heights

---

## Balance Considerations (Post-Implementation)

After Phase 1.7:
- Starting with 1 block (chassis only): ~45-60s survival target
- With 3 blocks (chassis + 2 cargo): ~90-120s survival target
- Block HP upgrade (+45% at max) stacks with more blocks
- Need to test if latched tick damage (4/0.5s) is still fair with 3 blocks

May need to adjust:
- `LATCHED_TICK_DAMAGE` (increase if 3 blocks makes game too easy)
- `BLOCK_COUNT_BASE_COST` (tune based on bean economy)
- Spawn rates post-rush (if 3 blocks trivializes early game)

---

## Test Checklist

### Phase 1.6A
- [x] Energy starts at 0, not max
- [x] First Tonic Bomb available after ~4 seconds (at 0.5/s regen)
- [x] Upgrade max level shows 3 in UI
- [x] Bonus percentages correct: +15%, +30%, +45% for Tower HP
- [x] Old saves reset (version bump)

### Phase 1.6B
- [x] GarageScreen shows on game start
- [x] Upgrades purchasable directly on home screen
- [x] "Recommended" badge appears for first unpurchased upgrade
- [x] Play button starts game correctly
- [x] EndScreen "Home" returns to GarageScreen

### Phase 1.7
- [x] Block count increases with upgrade (1→2→3)
- [x] Block 0 renders as thin chassis bar
- [x] Blocks 1-2 render as cargo boxes
- [x] Latched enemies still target lowest block correctly
- [x] Survival time increases meaningfully with more blocks

---

## ✅ PHASE 1.8 - TDS Pacing Polish (COMPLETED)

### Changes Made:
1. **SAVE_VERSION bumped to 5** - Clean slate for all players
2. **CART_X_OFFSET and ENEMY_SCALE constants** - Added to config.ts as placeholders for Phase 2
3. **"☕ Nice!" popup** - Shows for 0.9s when breather starts (after Rush ends)
4. **breatherTimer passed to GameHUD** - Enables breather feedback

### Notes:
- Energy already starts at 0 (from Phase 1.6A)
- Checkpoint interval already 20s (from previous updates)
- Cart position and enemy scale unchanged (Phase 2)

---

## Future Phases (Not Yet Implemented)

### Phase 2 - Layout & Pacing Tweaks
- Cart position adjustment (CART_X_OFFSET)
- Enemy size scaling (ENEMY_SCALE -10%)
- Speed/spawn micro-rebalance

### Phase 2.5 - Weapons/Attachments
- Saw blade or other attachments for cargo boxes
- Heavy enemy / mini-boss variants
- Chapter/Boss system (optional)

### Phase 3 - Polish
- Tutorial hints (first run guidance)
- More particle effects for upgrades
- Sound effects integration
