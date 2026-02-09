

# Fix Stale Telemetry & Improve Run Summary Accuracy

## Problem

Three consecutive runs produced nearly identical telemetry output (duration ~19.4s, gate dealt 40, shots 34/33, bomb 1, bombGateDamage 28, maxLatched 5). While the refs ARE being reset in `initGame()` (lines 286-295), the deterministic similarity still needs investigation, and several telemetry/overlay improvements are needed for reliable debugging.

## Changes

### 1. Run ID + telemetryBuiltAt (types.ts + CoffeeRushGame.tsx + RunSummaryOverlay.tsx)

**Problem:** Overlay uses `Date.now()` at render time, producing a new "Run ID" on each re-render.

- Add `runId: number` and `telemetryBuiltAt: number` fields to `RunTelemetry` in `types.ts`
- In `initGame()`: create `runIdRef = useRef(0)` and set `runIdRef.current = Date.now()`
- In `buildTelemetry()`: set `runId: runIdRef.current` and `telemetryBuiltAt: Date.now()`
- In `RunSummaryOverlay.tsx`: replace `Date.now()` with `t.runId`, and add two DEBUG lines showing `telemetryRunId` and `telemetryBuiltAt`

### 2. Verify Telemetry Ref Resets (CoffeeRushGame.tsx)

The refs are already reset in `initGame()` (lines 286-295), but two are missing from the explicit reset block:

- `maxLatchedPeak` and `timeAtMaxLatched` are reset inside `telemetryRef.current` (line 301) but NOT as standalone refs -- they live inside `telemetryRef`. This is actually correct for the current architecture.
- `blocksLost` and `timeToFirstBlockLost` same -- inside `telemetryRef` (lines 302-303). Correct.
- `tonicBombUses` -- inside `telemetryRef` (line 303). Correct.

No missing resets found. The identical runs are likely due to deterministic game balance (same spawn timing, same player behavior pattern). The DEBUG lines from fix #1 will confirm whether stale objects are being displayed.

### 3. Gate Destroyed Tracking (types.ts + CoffeeRushGame.tsx + RunSummaryOverlay.tsx)

**Problem:** Current overlay logic `destroyed = dealt >= maxHp && stageReached > i + 1` is fragile.

- Add `gateDestroyedByGate: boolean[]` to `RunTelemetry` (5 entries)
- Add `gateDestroyedRef = useRef<boolean[]>([false, false, false, false, false])` in CoffeeRushGame
- Reset in `initGame()`: `gateDestroyedRef.current = [false, false, false, false, false]`
- At gate destruction (line 938-939 where `gate.hp <= 0`): set `gateDestroyedRef.current[si] = true`
- In `buildTelemetry()`: include `gateDestroyedByGate: [...gateDestroyedRef.current]`
- In overlay: use `t.gateDestroyedByGate[i]` for YES/NO/[unreached] display

### 4. Damage Breakdown Clarity (RunSummaryOverlay.tsx)

**Problem:** Stage lines show total `dealt` but don't separate bomb vs bullet damage.

- In the Stage Breakdown section, for each gate line, compute:
  - `bombDmg = t.bombGateDamageByGate[i]`
  - `bulletDmg = dealt - bombDmg`
- Display format: `G1: HP 1000/1000 | Dealt: 312 (31.2%) [bullets: 284, bomb: 28] | Time: 28.4s | Destroyed: NO`

### 5. Economy Delta Explanation (RunSummaryOverlay.tsx)

Add clarity lines to the Economy section:

```
Wallet delta = coinsEnd - coinsStart
Run earned = coinsFromKills + coinsFromGateLumps + clearBonusCoins
```

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `types.ts` | Add `runId`, `telemetryBuiltAt`, `gateDestroyedByGate` to `RunTelemetry` |
| `CoffeeRushGame.tsx` | Add `runIdRef` + `gateDestroyedRef`, set in `initGame`/`buildTelemetry`/gate destruction |
| `RunSummaryOverlay.tsx` | Use `t.runId`, add DEBUG lines, damage breakdown, gate destroyed from telemetry, economy clarity |

### Implementation Order

1. Update `RunTelemetry` type with 3 new fields
2. Add refs and wiring in CoffeeRushGame (runId, gateDestroyed)
3. Update RunSummaryOverlay output format

