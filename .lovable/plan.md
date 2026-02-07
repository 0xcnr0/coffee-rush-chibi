

# Bugfix: Duplicate Espresso Tile + Balance Observations

## Bug 1: UPGRADES Array Has Duplicate Espresso (Critical)

The `UPGRADES` array in `GarageOverlay.tsx` (lines 17-42) has **three entries** but index 0 and index 1 are both `espressoDamageLevel` / "Espresso". The Power upgrade is at index 2 but the bottom row renders `UPGRADES[1]` and `UPGRADES[0]` -- both Espresso.

**Fix:** Remove the duplicate entry at index 1 (lines 26-33). This makes the array `[Espresso, Power]` and the bottom row will correctly show Power (index 0 after reindex) and Espresso (index 1 after reindex). Actually, simpler: just fix the array to have 2 entries and update the render indices.

The left tile currently reads `UPGRADES[1]` with `currentLevel={progression.upgradeLevels.energyRegenLevel}` -- so the level display is correct, but the tile NAME/ICON shows "Espresso" instead of "Power" because `UPGRADES[1]` is the duplicate Espresso. Clicking it does nothing useful because it tries to purchase `espressoDamageLevel` but displays `energyRegenLevel` pips.

**Result after fix:** Left tile = Power (zap icon), Right tile = Espresso (coffee icon). Both functional.

## Bug 2: Projectile Missing With 3rd Cargo Box

With 4 blocks total, projectiles fire from a very high Y position (top block). When enemies are far right and sparse, the projectile trajectory is steep, and with the per-frame movement step size, it can overshoot enemies between frames.

**Fix:** Increase the collision check radius slightly, or better: fire projectiles from the cart X center at a fixed Y offset rather than from the very top block. A simpler fix: just increase `PROJECTILE_RADIUS` from 8 to 12, which widens the hitbox and reduces misses at steep angles.

## Balance Observations From Run Data

The run data shows:
- **Run 1:** 43 seconds, reached G1 clear (Gates:1/3), 60 coins -- still too long and too many coins for Run 1 target (25-35s, 30-40 coins)
- **Run 2:** With 1 cargo box, reached G2 (Gates:2/3), 108 coins -- too far too fast
- **Boss wall:** Runs 4-12 all die during boss, most at 100% boss HP remaining, even with D3/H0 upgrades

Two issues:
1. Run 1 survives too long (43s vs target 25-35s) -- BLOCK_MAX_HP=220 is still too high for the target curve
2. Boss is too tanky -- players are stuck for 8+ runs at the boss stage

**Proposed balance tweaks (only 2 numbers):**
- `BLOCK_MAX_HP`: 220 -> 180 (shorten Run 1 to ~30-35s)
- `BOSS_HP`: 750 -> 550 (boss should be defeatable within 3-4 attempts with upgrades, not 8+)

These are conservative adjustments. We can fine-tune after re-testing.

## Summary of Changes

| File | Change |
|------|--------|
| `GarageOverlay.tsx` | Remove duplicate Espresso from UPGRADES array (lines 26-33) |
| `config.ts` | `BLOCK_MAX_HP`: 220 -> 180, `BOSS_HP`: 750 -> 550 |
| `CoffeeRushGame.tsx` or `config.ts` | `PROJECTILE_RADIUS`: 8 -> 12 (fix projectile misses with tall carts) |

Total: 3 files, ~10 lines changed.
