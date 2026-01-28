
# TDS-Style Progression System - Implementation Plan

## Overview
Transform the game's progression system to feel more like TDS, implementing in three phases: Quick Wins (energy + caps), Garage UI, and Block Progression.

---

## PHASE 1.6A - Quick Wins (First Priority)

### 1. Energy Starts at 0
**File: `src/game/CoffeeRushGame.tsx`**

Update energy initialization in multiple places:
- Line 85: Change `useState<number>(GAME_CONFIG.MAX_ENERGY)` to `useState<number>(0)`
- Line 129: Change `energyRef.current = GAME_CONFIG.MAX_ENERGY` to `energyRef.current = 0`
- Line 200: Change `energyRef.current = GAME_CONFIG.MAX_ENERGY` to `energyRef.current = 0`
- Line 217: Change `setEnergy(GAME_CONFIG.MAX_ENERGY)` to `setEnergy(0)`

This creates the TDS pacing where auto-attack handles early enemies while energy fills up.

---

### 2. Upgrade Caps Reduced to 3
**File: `src/game/config.ts`**

```typescript
// UPGRADES (Phase 1.6A: TDS-like short caps)
UPGRADE_MAX_LEVEL: 3,              // max level for each upgrade (was 20)

// Tower Reinforcement - increases BLOCK_MAX_HP
TOWER_HP_BONUS_PER_LEVEL: 0.15,    // +15% per level (Lv3 = +45%)
TOWER_HP_BASE_COST: 8,             // beans (lower for faster initial progression)

// Espresso Mastery - increases PROJECTILE_DAMAGE
ESPRESSO_BONUS_PER_LEVEL: 0.12,    // +12% per level (Lv3 = +36%)
ESPRESSO_BASE_COST: 10,            // beans

// Caffeine Flow - increases ENERGY_REGEN_RATE
ENERGY_BONUS_PER_LEVEL: 0.10,      // +10% per level (Lv3 = +30%)
ENERGY_BASE_COST: 8,               // beans
```

---

### 3. Bump SAVE_VERSION
**File: `src/game/persistence.ts`**

```typescript
const SAVE_VERSION = 4; // Bump to reset saves for new cap system
```

---

## PHASE 1.6B - Garage UI (Second Priority)

### 1. Create New GarageScreen Component
**File: `src/game/GarageScreen.tsx` (NEW)**

Combines MenuScreen + UpgradesScreen into single view:
- Cart preview in center (reuse renderer logic or static visual)
- Upgrade cards below cart
- Total beans display
- Best time display
- Play button prominently at bottom
- "Recommended" badge for soft guidance

```text
Layout:
+----------------------------------+
|         COFFEE RUSH              |
|       [Best Time] [Beans]        |
+----------------------------------+
|                                  |
|    [Cart Preview - Visual]       |
|         (wheels + block)         |
|                                  |
+----------------------------------+
|  UPGRADES                        |
|  +----------------------------+  |
|  | Tower HP      Lv1/3  [Buy] |  |  <-- "Recommended" if Lv0
|  +----------------------------+  |
|  | Espresso      Lv0/3  [Buy] |  |
|  +----------------------------+  |
|  | Energy Regen  Lv0/3  [Buy] |  |
|  +----------------------------+  |
+----------------------------------+
|        [☕ PLAY]                 |
+----------------------------------+
```

**Soft Guidance Logic:**
1. If `towerHpLevel === 0` → Tower HP is "Recommended"
2. Else if `espressoDamageLevel === 0` → Espresso is "Recommended"
3. Else if `energyRegenLevel === 0` → Energy is "Recommended"
4. Else → No recommendation (player chooses freely)

---

### 2. Update CoffeeRushGame
**File: `src/game/CoffeeRushGame.tsx`**

- Remove `UpgradesScreen` import
- Add `GarageScreen` import
- Remove `handleUpgrades` callback (no longer needed as separate state)
- Change `MENU` state to render `GarageScreen` instead of `MenuScreen`
- Remove `UPGRADES` game state entirely from types and rendering

---

### 3. Update Types
**File: `src/game/types.ts`**

```typescript
export type GameState = 'MENU' | 'PLAY' | 'END'; // Remove 'UPGRADES'
```

---

### 4. Delete UpgradesScreen
**File: `src/game/UpgradesScreen.tsx`**

Delete entirely (merged into GarageScreen).

---

### 5. Update MenuScreen
**File: `src/game/MenuScreen.tsx`**

Delete entirely (replaced by GarageScreen).

---

### 6. Update EndScreen
**File: `src/game/EndScreen.tsx`**

Remove "Upgrades" button since upgrades are now on the home/garage screen.
Keep "Home" button which goes back to GarageScreen.

---

## PHASE 1.7 - Block Progression (Third Priority)

### 1. Add blockCountLevel to Persistence
**File: `src/game/persistence.ts`**

```typescript
export interface ProgressionData {
  // ... existing
  upgradeLevels: {
    towerHpLevel: number;
    espressoDamageLevel: number;
    energyRegenLevel: number;
    blockCountLevel: number;  // NEW: 0=1block, 1=2blocks, 2=3blocks
  };
}

const DEFAULT_PROGRESSION: ProgressionData = {
  // ... existing
  upgradeLevels: {
    towerHpLevel: 0,
    espressoDamageLevel: 0,
    energyRegenLevel: 0,
    blockCountLevel: 0,  // NEW
  },
};
```

---

### 2. Add Block Progression Constants
**File: `src/game/config.ts`**

```typescript
// BLOCK PROGRESSION (Phase 1.7)
BLOCK_COUNT_MAX_LEVEL: 2,          // 0→1→2 (gives 1→2→3 blocks)
BLOCK_COUNT_BASE_COST: 25,         // beans - significant investment
```

---

### 3. Update Game Init to Use Block Count
**File: `src/game/CoffeeRushGame.tsx`**

In `initGame`:
```typescript
const progression = loadProgression();
const { upgradeLevels } = progression;

// Calculate block count from upgrade level
const blockCount = 1 + upgradeLevels.blockCountLevel; // 1, 2, or 3

// Reset blocks with upgraded HP
blocksRef.current = Array.from({ length: blockCount }, (_, i) => ({
  // ... existing logic
}));
```

---

### 4. Update Renderer for Chassis Visual
**File: `src/game/renderer.ts`**

Modify `drawCart` function to render block index 0 differently:

```typescript
function drawCart(ctx: CanvasRenderingContext2D, blocks: CartBlock[]) {
  const activeBlocks = blocks.filter(b => !b.destroyed);
  // ... existing wheel drawing

  activeBlocks.forEach((block, index) => {
    if (block.id === 0) {
      // Draw as thin chassis bar (not cargo box)
      drawChassisBar(ctx, block, blockY);
    } else {
      // Draw as cargo box (existing visuals)
      drawCargoBox(ctx, block, blockY, index);
    }
  });
}
```

The chassis bar will be:
- Thinner (maybe 60% of normal BLOCK_HEIGHT)
- Darker/metallic color
- Simpler shape (no rounded cargo box look)

---

### 5. Add Block Count Upgrade to GarageScreen
**File: `src/game/GarageScreen.tsx`**

Add 4th upgrade card for "Add Cargo Box":
```typescript
{
  key: 'blockCountLevel',
  name: 'Add Cargo Box',
  description: 'Extra HP buffer for your cart',
  icon: 'box',  // or 'package'
  bonusPerLevel: 1,  // Not a percentage - just shows "+1 box"
  baseCost: GAME_CONFIG.BLOCK_COUNT_BASE_COST,
  maxLevel: GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL,
}
```

---

### 6. Update Types
**File: `src/game/types.ts`**

Update `UpgradeInfo` to support different max levels:
```typescript
export interface UpgradeInfo {
  key: 'towerHpLevel' | 'espressoDamageLevel' | 'energyRegenLevel' | 'blockCountLevel';
  // ... existing
  maxLevel?: number;  // Optional override (defaults to UPGRADE_MAX_LEVEL)
}
```

---

## Files Summary

| Phase | File | Action |
|-------|------|--------|
| 1.6A | `config.ts` | Update caps, bonus values |
| 1.6A | `persistence.ts` | Bump SAVE_VERSION |
| 1.6A | `CoffeeRushGame.tsx` | Energy starts at 0 |
| 1.6B | `GarageScreen.tsx` | CREATE new combined screen |
| 1.6B | `MenuScreen.tsx` | DELETE |
| 1.6B | `UpgradesScreen.tsx` | DELETE |
| 1.6B | `CoffeeRushGame.tsx` | Use GarageScreen, remove UPGRADES state |
| 1.6B | `EndScreen.tsx` | Remove Upgrades button |
| 1.6B | `types.ts` | Remove 'UPGRADES' from GameState |
| 1.7 | `persistence.ts` | Add blockCountLevel |
| 1.7 | `config.ts` | Add BLOCK_COUNT_MAX_LEVEL |
| 1.7 | `CoffeeRushGame.tsx` | Dynamic block count from progression |
| 1.7 | `renderer.ts` | Chassis bar visual for block 0 |
| 1.7 | `GarageScreen.tsx` | Add 4th upgrade card |
| 1.7 | `types.ts` | Update UpgradeInfo interface |

---

## Balance Considerations

After Phase 1.7:
- Starting with 1 block (chassis): ~45-60s survival target
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
- [ ] Energy starts at 0, not max
- [ ] First Tonic Bomb available after ~4 seconds (at 0.5/s regen)
- [ ] Upgrade max level shows 3 in UI
- [ ] Bonus percentages correct: +15%, +30%, +45% for Tower HP
- [ ] Old saves reset (version bump)

### Phase 1.6B
- [ ] GarageScreen shows on game start
- [ ] Upgrades purchasable directly on home screen
- [ ] "Recommended" badge appears for first unpurchased upgrade
- [ ] Play button starts game correctly
- [ ] EndScreen "Home" returns to GarageScreen

### Phase 1.7
- [ ] Block count increases with upgrade (1→2→3)
- [ ] Block 0 renders as thin chassis bar
- [ ] Blocks 1-2 render as cargo boxes
- [ ] Latched enemies still target lowest block correctly
- [ ] Survival time increases meaningfully with more blocks
