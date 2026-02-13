

# Fix: Real-time Coin Display + Star System UI Redesign

## Problem 1: Coin Counter Stays at Zero During Gameplay

The HUD coin counter (`$tips`) only updates when `shouldUpdateHUD` is true (every 0.1s tick). When coins are earned from kills or gate destruction, the `setTips()` call is skipped if the HUD tick hasn't fired yet. This causes a perceived delay where coins stay at zero.

Additionally, the HUD uses a `$` prefix and `💰` emoji while the Garage uses `🪙`. These should match.

### Fix
- In `CoffeeRushGame.tsx`: Remove the `if (shouldUpdateHUD)` guard from the two `setTips()` calls (lines 1191 and 1551). Always call `setTips(tipsRef.current)` immediately when coins are earned.
- In `GameHUD.tsx`: Change the coin display icon from `💰` to `🪙` and remove the `$` prefix to match Garage style.

---

## Problem 2: Rename "Saw" to "Star" + Relocate to Per-Box Buttons

The current "SAW SYSTEM" card is a large standalone panel in the bottom section. The user wants:

1. **Rename**: "Saw" becomes "Star" everywhere (UI text, toasts). The visual in-game (renderer) already looks like a star shape, so this is consistent.
2. **Icon**: Use a star icon (⭐ or Star from lucide) instead of 🪚 in Garage and HUD.
3. **Layout**: Remove the large SAW SYSTEM card. Instead, place a small Star purchase button **next to each cargo box** (same style/size as the cargo box upgrade button), positioned to the right of each box's position on the cart.
4. **Per-box purchase**: Each cargo box can have its own Star attached. Buying a Star for one box doesn't affect others.
5. **Single throw button**: Even with multiple Stars purchased, only ONE throw button appears in the HUD. Throw damage does NOT scale with number of Stars.
6. **Passive stays constant**: The passive melee effect stays the same power regardless of how many boxes have Stars.

### Persistence Changes (`persistence.ts`)
- Add `starPerBox: boolean[]` field (e.g., `[false, false, false]`) to track which boxes have Stars. Replace or keep `sawUnlocked` as a derived value (`starPerBox.some(v => v)`).
- Add `purchaseStarForBox(boxIndex: number, cost: number): boolean` function.
- Keep the same unlock requirement: `bestStageReached >= 2`.
- Bump save version to 12.

### Garage UI Changes (`GarageOverlay.tsx`)
- Remove the large "SAW SYSTEM" card (lines 284-335).
- For each purchased cargo box (based on `blockCountLevel`), render a small Star button next to the cart, positioned below/beside the cargo box button. Same compact style (32x38px icon button).
- Button states:
  - **Locked** (bestStageReached < 2): Not visible at all.
  - **Available**: Shows star icon + coin cost.
  - **Purchased**: Shows star icon with a checkmark or filled style.
- Update toast messages: "Star Equipped!" instead of "SAW SYSTEM Unlocked!".

### HUD Changes (`GameHUD.tsx`)
- Rename saw button icon from 🪚 to ⭐.
- Keep single button regardless of how many boxes have Stars.
- `hasSaw` prop renamed conceptually but remains a single boolean (derived from `starPerBox.some(v => v)`).

### Game Logic (`CoffeeRushGame.tsx`)
- `hasSawRef` logic: Set to `true` if ANY box has a Star (`progression.starPerBox.some(v => v)`).
- Passive saw damage and throw damage remain unchanged -- no multiplication for multiple Stars.

### Renderer (`renderer.ts`)
- No functional changes needed. The visual already looks star-shaped.

### Config (`config.ts`)
- Rename `SAW_UNLOCK_COST` to `STAR_PER_BOX_COST` (same value: 140 coins per box).

---

## Summary of Files Changed

| File | Changes |
|---|---|
| `persistence.ts` | Add `starPerBox: boolean[]`, new purchase function, bump save version |
| `config.ts` | Rename SAW_UNLOCK_COST to STAR_PER_BOX_COST |
| `CoffeeRushGame.tsx` | Remove `shouldUpdateHUD` guard on `setTips()`, derive `hasSaw` from `starPerBox` |
| `GameHUD.tsx` | Change coin icon to 🪙, remove $ prefix, change saw icon to star |
| `GarageOverlay.tsx` | Remove SAW SYSTEM card, add per-box Star buttons next to cargo |
| `renderer.ts` | No changes needed |
| `types.ts` | Add `'star_unlock'` to PurchaseEvent type |

