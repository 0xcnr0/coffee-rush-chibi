

# Stage 1 Pilot: TDS Loop Refactor

## Critical Bug Found

**The gate snap lock is dead code.** Line 1037 of `CoffeeRushGame.tsx`:

```text
if (enemies.length > 0 && currentTime - lastAttackRef.current > ...)
```

The entire auto-attack block only runs when `enemies.length > 0`. When the lane is clear (no enemies), the gun never fires -- so the "gate snap lock when nearEnemies === 0" code on line 1072-1075 can never execute. This is why gate bullet damage has been so low in every run.

This fix is included in the plan below.

---

## Overview

Add a 4-state sub-flow for Stage 1 only, keeping all other stages untouched. The existing `PlayPhase` type gets 3 new values. All new logic is gated behind `stageIndexRef.current === 1`.

---

## Changes by File

### 1. `src/game/types.ts`

Extend `PlayPhase` with new Stage 1 states:

```text
'TRAVEL' | 'SIEGE' | 'EVO_PICK' | 'BOSS' | 'APPROACH' | 'VICTORY'
```

`APPROACH` and `VICTORY` are new. They will only be used for Stage 1 in this pilot.

### 2. `src/game/config.ts`

Add Stage 1 pilot constants:

```text
STAGE1_TRAVEL_DURATION: 10        // seconds (was 1.2)
STAGE1_APPROACH_DURATION: 1.0     // gate slide-in time
STAGE1_GATE_START_X: 500          // off-screen right (slides to final position)
STAGE1_WAVE_SIZE: 3               // enemies per wave
STAGE1_WAVE_BREATHER: 1.0         // seconds pause between waves
STAGE1_BOMB_SPAWN_DELAY: 1.5      // seconds of silence after bomb
```

### 3. `src/game/CoffeeRushGame.tsx` (main changes)

#### A. Fix the auto-attack gate-only firing bug

Change the auto-attack condition from:
```text
if (enemies.length > 0 && currentTime - lastAttackRef.current > ...)
```
to:
```text
const hasEnemies = enemies.length > 0;
const hasGateTarget = gateBuildingRef.current && !gateBuildingRef.current.isDestroyed;
if ((hasEnemies || hasGateTarget) && currentTime - lastAttackRef.current > ...)
```

When `hasEnemies` is false but gate exists, skip enemy targeting entirely and fire directly at gate center. This makes gate snap lock actually work.

#### B. Stage 1 TRAVEL (10 seconds with enemies)

When `stageIndexRef.current === 1` and phase is `TRAVEL`:
- Use `STAGE1_TRAVEL_DURATION` (10s) instead of the default 1.2s
- Allow enemy spawning during travel (enemies walk toward cart normally)
- Gate is null/hidden (already the case -- gate is created when TRAVEL ends)
- Background scrolls (already working)
- After 10s, transition to `APPROACH` instead of `SIEGE`

#### C. APPROACH phase (new)

Only active when `stageIndexRef.current === 1`:
- Create gate at `STAGE1_GATE_START_X` (far right, off visible area)
- Each frame, lerp gate.x toward final position (`CANVAS_WIDTH - GATE_BUILDING_X_OFFSET`)
- Gate is NOT targetable during approach (skip gate collision in projectile update)
- Background scroll speed decelerates to zero
- Enemy spawning paused
- After `STAGE1_APPROACH_DURATION`, gate reaches final X, transition to `SIEGE`
- Console log: `"STATE -> APPROACH"`

#### D. SIEGE wave spawning (Stage 1 only)

Add a `stage1WaveRef` to track:
- `enemiesInWave`: count spawned this wave
- `waveBreatherTimer`: countdown when wave cleared

When `stageIndexRef.current === 1` during SIEGE:
- Spawn up to `STAGE1_WAVE_SIZE` enemies, then stop
- When all wave enemies are dead (`aliveEnemies === 0`), start breather timer
- During breather: no spawns, gun naturally snaps to gate (via the bug fix above)
- After breather, spawn next wave

#### E. Bomb spawn timer reset (Stage 1 SIEGE only)

In `handleTonicBomb`, when `stageIndexRef.current === 1` and phase is `SIEGE`:
- Reset the wave spawn timer
- Set a `bombSilenceTimer` of 1.5s
- During this timer, no enemies spawn (gun fires at gate)

#### F. VICTORY phase (new)

When gate HP reaches 0 during Stage 1 SIEGE:
- Set phase to `VICTORY`
- Play existing crumble animation + confetti
- Fade enemies (existing cleanup logic)
- After cleanup duration, proceed to Stage 2 with normal flow (existing TRAVEL at 1.2s)

#### G. Gate non-targetable during APPROACH

In the projectile-gate collision block (line 1217-1228), add check:
```text
if (playPhaseRef.current === 'APPROACH') skip gate collision
```

### 4. `src/game/renderer.ts`

#### A. APPROACH visual: gate slide-in

Gate is already drawn when `gateBuilding` exists and `!isDestroyed`. No renderer change needed -- the gate position is controlled by game logic (lerping gate.x each frame).

#### B. APPROACH background deceleration

Currently parallax only scrolls during `TRAVEL`. Extend to also scroll during `APPROACH` but at decreasing speed:
```text
const isApproaching = playPhase === 'APPROACH';
if (isApproaching && deltaTime) {
  // Decelerate: multiply speed by remaining approach ratio
  parallaxOffset1 = (parallaxOffset1 + 15 * deltaTime) % 120;  // half speed
  parallaxOffset2 = (parallaxOffset2 + 40 * deltaTime) % 60;
}
```

#### C. State label debug overlay

Draw current phase label in top-left corner (small, semi-transparent):
```text
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.font = '10px monospace';
ctx.fillText(playPhase, 8, 14);
```

---

## New Refs Added to CoffeeRushGame

| Ref | Type | Purpose |
|-----|------|---------|
| `stage1WaveRef` | `{ spawned: number, breatherTimer: number }` | Wave tracking for Stage 1 siege |
| `bombSilenceTimerRef` | `number` | Post-bomb spawn suppression |

---

## State Flow Diagram (Stage 1 Only)

```text
Game Start
    |
    v
TRAVEL (10s, enemies spawn, gate hidden, bg scrolls)
    |
    v
APPROACH (~1s, gate slides in from right, bg decelerates, no spawns)
    |
    v
SIEGE (wave spawning: 3 enemies -> breather -> 3 enemies -> ...)
    |   Bomb used -> 1.5s spawn silence
    |   Lane clear -> gun snaps to gate (bug fix enables this)
    |
    v (gate HP = 0)
VICTORY (crumble + cleanup)
    |
    v
Stage 2+ normal flow (existing TRAVEL 1.2s -> SIEGE -> ...)
```

---

## What Is NOT Changed

- Stages 2-5 and Boss flow remain identical
- Weapon geometry (muzzle offset, aim tilt) stays as-is
- Gate hitbox size stays at 160px
- Telemetry and run summary unchanged
- No new dependencies

---

## Technical Risk: Auto-Attack Gate-Only Firing

The bug fix (allowing auto-attack when only gate target exists) means the gun will fire at the gate even with zero enemies on screen. This is the desired TDS behavior (lane clear = gate melt). The shotgun will fire pellets at gate center with the existing spread. Gate damage should increase dramatically in breather windows.

