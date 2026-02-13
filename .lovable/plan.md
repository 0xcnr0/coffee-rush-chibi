

# Saw System: Garage Unlock + Balance Tune

## Overview

Convert the Saw from an always-active weapon into a purchasable Garage upgrade, gated behind Stage 2 completion. Adjust balance values per ChatGPT specs.

---

## Changes by File

### 1. `src/game/persistence.ts` (Schema)

- Add `sawUnlocked: boolean` field to `ProgressionData` (default: `false`)
- Add `purchaseSaw(cost: number): boolean` function
  - Checks `bestStageReached >= 2` and `totalCoins >= cost`
  - Sets `sawUnlocked = true`, deducts coins
  - Logs purchase event
- Add `'saw_unlock'` to PurchaseEvent type union
- Bump `SAVE_VERSION` to 11 (clean reset ensures new field exists)

### 2. `src/game/types.ts`

- Add `'saw_unlock'` to the `PurchaseEvent.type` union

### 3. `src/game/config.ts` (Balance Tune)

Adjust values per ChatGPT design:

| Parameter | Current | New |
|---|---|---|
| `SAW_PASSIVE_RADIUS` | 70 | 65 |
| `SAW_PASSIVE_TICK_INTERVAL` | 0.2 | 0.25 |
| `SAW_PASSIVE_TICK_DAMAGE` | 8 | 7 |
| `SAW_THROW_DAMAGE` | 20 | 18 |
| `SAW_THROW_LIFETIME` | 1.2 | 1.1 |

Add new constant:
- `SAW_UNLOCK_COST: 140`

### 4. `src/game/CoffeeRushGame.tsx` (Game Loop Guards)

- On run start (line ~283): Set `hasSawRef.current = progression.sawUnlocked` instead of checking `weaponSlots`
- Passive saw loop (line ~1410): Wrap entire block in `if (hasSawRef.current)`
- Saw throw handler (line ~750): Add early return `if (!hasSawRef.current)`
- HUD props: Pass `canUseSaw` as `hasSawRef.current && power >= cost`

### 5. `src/game/GameHUD.tsx`

- Add `hasSaw: boolean` prop
- Only render the saw button when `hasSaw === true`

### 6. `src/game/GarageOverlay.tsx` (Purchase UI)

Add a "SAW SYSTEM" upgrade card in the Battle tab bottom panel (between the pip tiles and PLAY button):

- Shows lock icon + "Reach Stage 3" text when `bestStageReached < 2`
- Shows cost (140 coins) + buy button when unlocked but not purchased
- Shows "EQUIPPED" badge when already purchased
- On purchase: calls `purchaseSaw(140)`, refreshes progression state, triggers `onProgressionChange`

### 7. `src/game/renderer.ts`

- Pass `hasSaw` flag to draw functions
- Only render the spinning saw visual when `hasSaw === true`

---

## Unlock Flow

```text
Fresh save -> Saw locked (grayed in Garage, "Reach Stage 3")
Player clears Stage 2 gate -> bestStageReached >= 2
Garage now shows "SAW SYSTEM - 140 coins"
Player purchases -> sawUnlocked = true (permanent)
Next run -> passive saw + throw button active
```

---

## What Is NOT Changed

- Shotgun damage, bomb behavior, gate HP
- Spawn scaling, economy values
- Existing pip/EVO system
- Boss flow
- Wave system (Stage 1)

