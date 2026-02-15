

# Milestone 0+1: Stabilization + Weapon System v2 (Flame)

## Overview
Three-part refactor: fix cleanup bug, rename saw->star globally, add Flame weapon system. No balance changes to Gate1/2, no EVO work.

## Protected Values (DO NOT TOUCH)
- Gate HP: 300 / 320 / 2000 / 3500 / 5000
- Stage1/Stage2 wave-based spawn
- TRAVEL_DURATION_BY_STAGE: [10, 10, 16, 18, 20]
- Star guaranteed gate hit logic
- EVO system and Block pip UI

---

## Part 1A: Cleanup Race Condition Fix

**File: `CoffeeRushGame.tsx`**

Remove the duplicate gate cleanup block (~lines 1097-1144) that transitions directly to TRAVEL, skipping BREATHER. Only the VICTORY block (~lines 1031-1061) should control the post-gate flow:

```text
VICTORY (0.8s cleanup) -> BREATHER (4.0s reduced spawn) -> TRAVEL (per-stage duration)
```

The second block also incorrectly uses `GAME_CONFIG.TRAVEL_DURATION` (1.2s) instead of `TRAVEL_DURATION_BY_STAGE`.

---

## Part 1B: Saw -> Star Global Rename

All ~365 "saw" references across 10 files renamed to "star". Key changes:

### config.ts
- `SAW_PASSIVE_RADIUS` -> `STAR_PASSIVE_RADIUS`
- `SAW_PASSIVE_TICK_INTERVAL` -> `STAR_PASSIVE_TICK_INTERVAL`
- `SAW_PASSIVE_TICK_DAMAGE` -> `STAR_PASSIVE_TICK_DAMAGE`
- `SAW_THROW_COST` -> `STAR_THROW_COST`
- `SAW_THROW_DAMAGE` -> `STAR_THROW_DAMAGE`
- `SAW_THROW_SPEED` -> `STAR_THROW_SPEED`
- `SAW_THROW_LIFETIME` -> `STAR_THROW_LIFETIME`
- `SAW_THROW_RADIUS` -> `STAR_THROW_RADIUS`
- Remove legacy values: `SAW_UNLOCK_COST`, `SAW_FIRE_RATE`, `SAW_DAMAGE`, `SAW_ABILITY_COST`, `SAW_ABILITY_DAMAGE`
- Update all comments

### types.ts
- `WeaponType: 'saw'` -> `'star'`
- `WeaponAbilityType: 'saw_line'` -> `'star_throw'`
- `proj.isSaw` -> `proj.isStar`
- Telemetry: `sawPassiveDamageDealt` -> `starPassiveDamageDealt`, etc.
- PurchaseEvent: `'saw_unlock'` -> `'star_unlock'`

### persistence.ts
- `sawUnlocked` -> `starUnlocked`
- `purchaseSaw` -> `purchaseStar`
- `SAVE_VERSION: 13` -> `14` (forced reset due to field rename)

### CoffeeRushGame.tsx
- `hasSawRef` -> `hasStarRef`
- `lastSawAttackRef` -> `lastStarAttackRef`
- `sawPassiveTickRef` -> `starPassiveTickRef`
- `sawTelemetryRef` -> `starTelemetryRef`
- `handleSawThrow` -> `handleStarThrow`
- `proj.isSaw` -> `proj.isStar`

### renderer.ts
- `drawSawZone` -> `drawStarZone`

### GameHUD.tsx
- Props: `onSawThrow` -> `onStarThrow`, `canUseSaw` -> `canUseStar`, `hasSaw` -> `hasStar`

### GarageOverlay.tsx, RunSummaryOverlay.tsx, evoData.ts
- All saw references renamed

---

## Part 2: Flame Weapon System

### 2.1 Config (config.ts)
Expand existing Flame config:
```text
FLAME_PASSIVE_RADIUS: 55
FLAME_PASSIVE_CONE_ANGLE: 45
FLAME_PASSIVE_TICK_INTERVAL: 0.35
FLAME_PASSIVE_TICK_DAMAGE: 3
FLAME_THROW_COST: 7       (existing FLAME_ABILITY_COST)
FLAME_THROW_DAMAGE: 20    (existing FLAME_ABILITY_DAMAGE)
FLAME_THROW_RADIUS: 120
FLAME_GATE_DAMAGE_MULT: 0.5  (existing)
FLAME_PER_BOX_COST: 200
```

### 2.2 Persistence (persistence.ts)
- Add `flamePerBox: boolean[]` field (default `[false, false, false]`)
- Add `purchaseFlameForBox(boxIndex, cost)` function
- Unlock condition: `bestStageReached >= 3` (Stage 2 Gate DESTROYED, not just seen)

### 2.3 Renderer (renderer.ts)
- New `drawFlameZone` function: orange/red cone visual, flame particle animation
- Same structure as `drawStarZone` but cone-shaped

### 2.4 Game Logic (CoffeeRushGame.tsx)
New refs: `hasFlameRef`, `flamePassiveTickRef`, `flameTelemetryRef`

**Passive:** Cone-shaped area in front of cart, tick damage to enemies only (no gate passive damage)

**Active (handleFlameBurst):** 7 Power cost, 120px AoE burst, 20 damage to enemies, 10 damage to gate (50% mult), orange burst particles

### 2.5 GameHUD
New button next to Star and Bomb: flame emoji, orange theme, "7 Power" badge. Only visible when `hasFlame` is true.

Button order: Pause | Power Bar | Star | Flame | Bomb

### 2.6 GarageOverlay
Flame purchase buttons next to Star buttons in Battle tab. Same design, orange theme. Visible only when `bestStageReached >= 3`. Cost: 200 coins per box.

### 2.7 Telemetry (types.ts + RunSummaryOverlay.tsx)

Six new telemetry fields in `RunTelemetry`:
```text
flamePassiveDamageDealt: number
flameBurstDamageToEnemies: number
flameBurstDamageToGate: number
flameBurstUses: number
flameUnlockedAt: number          // seconds into run when first purchased (-1 if not purchased)
flameBurstTimestamps: number[]   // array of run-time seconds for each burst use
```

All six fields included in RunSummaryOverlay output under a "Flame" section.

---

## Implementation Order

1. `config.ts` -- Saw->Star rename + Flame config + remove legacy
2. `types.ts` -- Saw->Star rename + Flame telemetry fields + proj.isStar
3. `persistence.ts` -- Saw->Star rename + flamePerBox + SAVE_VERSION 14
4. `renderer.ts` -- drawSawZone->drawStarZone + new drawFlameZone
5. `CoffeeRushGame.tsx` -- Cleanup fix + Saw->Star rename + Flame logic
6. `GameHUD.tsx` -- Props rename + Flame button
7. `GarageOverlay.tsx` -- Import rename + Flame purchase UI
8. `RunSummaryOverlay.tsx` -- Telemetry rename + Flame section
9. `evoData.ts` -- Saw->Star rename
10. `EndScreen.tsx` -- Any remaining saw references

## What This Does NOT Touch
- EVO effect engine (separate milestone)
- Block pip UI (separate milestone)
- Weapon pip UI (separate milestone)
- Gate 3+ HP rebalancing (after Flame testing)
- Boss patterns
- Chapter reset
- Stage 2 continuous spawn conversion

