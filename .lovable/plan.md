

# 3 Fixes: Foam -> Brew Rename, Weapon Lock UI, Passive Telemetry Bug

## Fix 1: Rename "Foam" to "Brew" + Icon Change (🧴 -> 🫧)

All internal code keeps `foam`/`FOAM` naming (config constants, persistence fields, telemetry keys) -- only user-facing strings and emoji change. This avoids another full rename and save version bump.

### Changes:
- **GameHUD.tsx**: Change `🧴` to `🫧` on the burst button (line 210)
- **GarageOverlay.tsx**: Change `🧴` to `🫧` on purchase buttons and equipped indicators (lines 338, 345, 350). Change toast message from "Foam Equipped!" to "Brew Equipped!" (line 338)
- **RunSummaryOverlay.tsx**: Change display label from "Foam Burst" / "Foam" to "Brew Burst" / "Brew" in the telemetry output (line 102-104)
- **config.ts**: Update comment headers from "FOAM WEAPON" to "BREW WEAPON (Foam)" for clarity (lines 220-221)

No persistence or config constant rename needed -- only UI labels and emoji.

---

## Fix 2: Weapon Lock UI in GarageOverlay

**Problem:** Star button shows even when Foam is already equipped on that box, and vice versa. The persistence layer (`boxWeapons`) correctly blocks double-purchase, but the UI still renders both buttons.

**Solution:** In the per-box weapon rendering loop (GarageOverlay.tsx lines 265-357), read `boxWeapons[boxIdx]` and:
- If `boxWeapons[boxIdx] === 'star'`: show only Star (equipped/upgrade), hide Brew button
- If `boxWeapons[boxIdx] === 'foam'`: show only Brew (equipped), hide Star button  
- If `boxWeapons[boxIdx] === null`: show both Star and Brew purchase buttons (if unlock conditions met)

### Changes:
- **GarageOverlay.tsx** (lines 265-357): Add `boxWeapon` variable from `progression.boxWeapons`, wrap Star button render in `boxWeapon !== 'foam'` check, wrap Foam button render in `boxWeapon !== 'star'` check

---

## Fix 3: Brew Passive Telemetry Bug (foamPassiveDamageDealt = 0)

**Root Cause:** In `CoffeeRushGame.tsx` projectile hit detection (lines 1582-1592), when a foam projectile hits an enemy, there is no `isFoam` check to increment `foamTelemetryRef.current.passiveDamage`. Only `isStar` is checked (line 1586). Same issue for gate hits (line 1612) -- foam gate hits are not tracked in foam telemetry.

### Changes:
- **CoffeeRushGame.tsx line 1586** (enemy hit): Add foam tracking after star check:
  ```
  if ((proj as any).isFoam) foamTelemetryRef.current.passiveDamage += proj.damage;
  ```
- **CoffeeRushGame.tsx line 1612** (gate hit): Add foam tracking after star check:
  ```
  if ((proj as any).isFoam) foamTelemetryRef.current.passiveShotsToGate++;
  ```

Note: `isFoam` is already defined as optional on the `Projectile` interface and set via `(proj as any).isFoam = true` in the passive cannon code. The `as any` cast is kept for now since `isFoam` is optional.

---

## Files Affected
1. `src/game/GameHUD.tsx` -- emoji change only
2. `src/game/GarageOverlay.tsx` -- emoji + label change + weapon lock UI logic
3. `src/game/RunSummaryOverlay.tsx` -- display label change
4. `src/game/CoffeeRushGame.tsx` -- foam telemetry tracking in projectile hits
5. `src/game/config.ts` -- comment update only

## NOT Touched
- Gate HP values
- Travel durations  
- Star logic
- EVO system
- Persistence schema / SAVE_VERSION
- Config constant names (stay as FOAM_*)

