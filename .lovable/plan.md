

# Lower Muzzle Height for Flatter TDS-Style Shots

## Problem

The cart's projectile origin is at the top of the chassis/cargo stack (Y ~385), while enemies walk at ground level with centers around Y ~437. This creates a steep downward angle (~52px vertical drop over short horizontal distances), causing:

- Pellets that aim "down" toward nearby enemies, wasting spread on vertical angle instead of horizontal coverage
- Backline enemies and the gate getting fewer hits because the cone fans out vertically rather than horizontally
- The visual look of "shooting from above" instead of TDS's flat, horizontal spray

In TDS, the weapon fires from roughly wheel/bumper height -- nearly the same Y as enemy centers -- so the spread fans out horizontally across the lane.

## Solution

Add a `MUZZLE_Y_OFFSET` config constant that shifts the projectile spawn point down from `topBlock.y` to near the chassis/wheel level. This makes shots travel more horizontally, matching TDS feel.

### Calculated offset

- Current origin: `topBlock.y` = ~385 (with 0 cargo boxes)
- Target origin: near enemy center height, around Y ~430-440
- Offset needed: approximately +50px (positive = down)
- Setting `MUZZLE_Y_OFFSET = 50` brings origin to ~435, which is close to enemy center (437)

### Changes

**`src/game/config.ts`**
- Add `MUZZLE_Y_OFFSET: 50` to GAME_CONFIG (positive = lower on screen = more horizontal shots)

**`src/game/CoffeeRushGame.tsx`**
- In the shotgun firing block (~line 1052): change `originY = topBlock.y` to `originY = topBlock.y + GAME_CONFIG.MUZZLE_Y_OFFSET`
- In the single-fire `fireProjectile` function: apply the same offset to the projectile spawn Y
- This ensures all weapon modes benefit from the flatter trajectory

**No changes to renderer** -- the muzzle offset only affects the invisible projectile spawn point, not the visual cart drawing. The barista still sits on top; shots just originate from a lower logical point (like a gun mounted on the chassis side).

### Expected impact on telemetry

- Hit rate should recover from ~77% back toward ~85-90% (less vertical waste)
- "To Gate" hits should increase because horizontal spread reaches the gate more naturally
- Kill rate should improve because pellets hit enemy centers instead of flying over/under

### Tuning notes

- If 50 feels too flat (all pellets hit same Y band), reduce to 35-40
- If still too high, increase to 55-60
- The offset should be reduced proportionally when cargo boxes are stacked (future consideration), but for now a fixed value is fine for Phase 1 testing

