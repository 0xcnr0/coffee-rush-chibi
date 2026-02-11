

# Scale TDS Flow to All Stages + Stage 1 HP Tune

## Summary

Run 4 confirmed Stage 1 pilot works (Gate1 destroyed: bullets 432, bomb 168). Now we generalize the TRAVEL -> APPROACH -> SIEGE -> VICTORY flow to all gate stages and tune pacing.

---

## Changes by File

### 1. `src/game/config.ts`

- **Stage 1 Gate HP**: 600 -> 420
- **Add `BOMB_SILENCE_BY_STAGE`** array: `[1.5, 1.0, 0.6, 0.6, 0.6]`
- **Add `TRAVEL_DURATION_BY_STAGE`** array: `[10, 4.0, 4.0, 3.5, 3.5]` (seconds) -- Stage 1 keeps its 10s runner phase, Stages 2-5 get 3.5-4.0s for a real "run" feel before gate appears (per ChatGPT safeguard #1)
- **Rename** `STAGE1_GATE_START_X` -> `GATE_START_X` and `STAGE1_APPROACH_DURATION` -> `APPROACH_DURATION` (now shared by all stages)

### 2. `src/game/CoffeeRushGame.tsx`

#### A. TRAVEL phase -- Stage 2-5 now transition to APPROACH (not SIEGE)

Currently lines 877-903: Stage 2+ goes TRAVEL -> SIEGE (gate appears instantly). Change the `else` branch so that when travel timer ends for a non-boss stage, it transitions to APPROACH instead:
- Create gate at `GATE_START_X` (off-screen)
- Set `travelTimerRef.current = APPROACH_DURATION`
- Set phase to APPROACH

Stage 2-5 still despawn enemies during travel (existing behavior). Stage 1 still spawns during travel (existing behavior).

Travel duration: use `TRAVEL_DURATION_BY_STAGE[stageIndex - 1]` instead of hardcoded values.

#### B. APPROACH phase -- remove Stage 1 restriction

Lines 907-935: Currently labeled "Stage 1 pilot". Make generic:
- The lerp logic already uses `gateBuildingRef.current` -- it works for any stage
- On transition to SIEGE: only init `stage1WaveRef` if Stage 1 (wave spawning stays Stage 1 only)
- Init `bombSilenceTimerRef = 0` for all stages

#### C. Gate destruction -- VICTORY for ALL stages

Lines 1097-1122: Remove the `if (stageIndexRef.current === 1)` guard. All gate destructions use VICTORY phase.

#### D. VICTORY phase -- generalize stage advancement

Lines 937-972: Currently hardcoded `stageIndexRef.current = 2`. Replace with:
```text
const nextStage = stageIndexRef.current + 1;
const nextStageConfig = getStage(nextStage);
if (nextStageConfig.isBoss) {
  // Boss stage
  stageIndexRef.current = nextStage;
  travelTimerRef.current = TRAVEL_DURATION;
  playPhase = 'TRAVEL';
} else {
  stageIndexRef.current = nextStage;
  travelTimerRef.current = TRAVEL_DURATION_BY_STAGE[nextStage - 1];
  playPhase = 'TRAVEL';
}
```

This handles Stage 5 -> Boss transition correctly (ChatGPT safeguard #2). EVO_PICK is currently triggered from Garage between runs, not mid-run, so no bypass risk.

#### E. Bomb silence -- all stages during SIEGE

Lines 724-729: Remove `stageIndexRef.current === 1` guard. Use per-stage duration:
```text
if (playPhaseRef.current === 'SIEGE') {
  const si = stageIndexRef.current;
  const silenceDuration = BOMB_SILENCE_BY_STAGE[si - 1] ?? 0.6;
  bombSilenceTimerRef.current = silenceDuration;
  lastSpawnRef.current = currentTime;  // CRITICAL: reset spawn timer (safeguard #3)
  if (si === 1) {
    stage1WaveRef.current.spawned = 0;
    stage1WaveRef.current.breatherTimer = 0;
  }
}
```

The `lastSpawnRef.current = currentTime` reset prevents instant spawn burst when silence ends (ChatGPT safeguard #3).

#### F. Spawning -- add bomb silence to Stage 2+ continuous spawning

Lines 1161-1176: Add bomb silence check before continuous spawning for Stage 2+:
```text
if (bombSilenceTimerRef.current > 0) {
  bombSilenceTimerRef.current -= deltaTime;
} else {
  // existing continuous spawn logic
}
```

#### G. Old GATE CLEANUP block (lines 977-1021) -- becomes dead code

Since all stages now use VICTORY, the old cleanup block at lines 977-1021 will never trigger for gate stages. It can be kept as a safety net (boss cleanup) or removed. Safest: keep it but it should not execute for gate stages.

### 3. `src/game/renderer.ts`

No changes needed. APPROACH parallax deceleration and debug label already work based on `playPhase` string.

---

## Stage Flow After Changes

```text
Stage 1: TRAVEL (10s, enemies spawn) -> APPROACH (1s) -> SIEGE (wave-based + bomb silence 1.5s) -> VICTORY -> next
Stage 2: TRAVEL (4.0s, enemies despawn) -> APPROACH (1s) -> SIEGE (continuous + bomb silence 1.0s) -> VICTORY -> next
Stage 3: TRAVEL (4.0s, enemies despawn) -> APPROACH (1s) -> SIEGE (continuous + bomb silence 0.6s) -> VICTORY -> next
Stage 4: TRAVEL (3.5s, enemies despawn) -> APPROACH (1s) -> SIEGE (continuous + bomb silence 0.6s) -> VICTORY -> next
Stage 5: TRAVEL (3.5s, enemies despawn) -> APPROACH (1s) -> SIEGE (continuous + bomb silence 0.6s) -> VICTORY -> next
Stage 6: TRAVEL (1.2s) -> BOSS
```

---

## 3 Critical Safeguards (from ChatGPT analysis)

1. **Stage 2-5 travel duration increased** to 3.5-4.0s (was 1.2s) so the "runner" feel exists between gates
2. **VICTORY -> next stage** respects Boss transition -- no hardcoded stage index, checks `isBoss`
3. **Bomb silence resets `lastSpawnRef.current`** to prevent instant spawn burst when silence ends

---

## What Is NOT Changed

- Stage 1 wave/breather system stays Stage 1 only
- Weapon geometry, hitboxes, aim tilt unchanged
- Boss flow (Stage 6) unchanged
- Telemetry unchanged
- No new dependencies

