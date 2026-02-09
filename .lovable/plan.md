

# Run Summary Overlay -- Implementation Plan

## Overview

Create a full-screen, monospace, scrollable `RunSummaryOverlay` that intercepts the END state flow. It displays 7 sections of tuning data and is fully copy-paste friendly. This also requires a purchase event log system in `persistence.ts` and bomb-gate damage tracking per gate.

---

## Flow

```text
Garage (purchases logged) -> PLAY -> Run ends -> gameState='END' + showRunSummary=true
  -> RunSummaryOverlay (Continue button)
  -> clearPurchaseLog() + setShowRunSummary(false)
  -> EndScreen (Play Again / Home)
```

---

## File Changes

### 1. `src/game/types.ts` -- Add PurchaseEvent + bomb gate damage fields

Add `PurchaseEvent` interface:

```typescript
export interface PurchaseEvent {
  ts: number;
  type: 'power_pip' | 'damage_pip' | 'cargo_box' | 'block_pip' | 'weapon_pip' | 'select_weapon' | 'evo_choice';
  target: string;           // e.g. "block_0", "weapon_1", "power", "damage"
  before: string;           // human-readable
  after: string;            // human-readable
  beforeValue: number;      // numeric for analysis
  afterValue: number;       // numeric for analysis
  coinCost: number;
  coinsBefore: number;
  coinsAfter: number;
}
```

Add to `RunTelemetry`:
- `bombGateDamageTotal: number`
- `bombGateDamageByGate: number[]` (5 entries for G1-G5)

### 2. `src/game/persistence.ts` -- Purchase log system

Uses a **separate localStorage key** (`coffee-rush-purchase-log`) to avoid bloating ProgressionData.

Add 3 helper functions:
- `logPurchase(event: PurchaseEvent)` -- appends to localStorage array
- `getPurchaseLog(): PurchaseEvent[]` -- reads the log
- `clearPurchaseLog(): void` -- empties the log

Modify each purchase function to call `logPurchase()` with before/after state:
- `purchasePowerPip` -- type `power_pip`, target `power`, beforeValue = old powerPips, afterValue = new powerPips
- `purchaseDamagePip` -- type `damage_pip`, target `damage`
- `purchaseBlockPip` -- type `block_pip`, target `block_{slotIndex}`
- `purchaseWeaponPip` -- type `weapon_pip`, target `weapon_{slotIndex}`
- `purchaseCargoBox` -- type `cargo_box`, target `blockCount`
- `saveEvoChoice` -- type `evo_choice`, target `{category}_{slotIndex}`, coinCost=0

### 3. `src/game/CoffeeRushGame.tsx` -- Bomb tracking + END flow gate

**New refs:**
- `bombGateDamageByGateRef = useRef<number[]>([0,0,0,0,0])`

**New state:**
- `showRunSummary` state (`useState(false)`)

**Changes:**
- `initGame()`: reset `bombGateDamageByGateRef` to `[0,0,0,0,0]`, call `clearPurchaseLog()` (safety: clears stale logs from previous run), set `showRunSummary = false`
- Bomb logic (line 644-646): also increment `bombGateDamageByGateRef.current[si]`
- `buildTelemetry()`: add `bombGateDamageTotal` (sum of array) and `bombGateDamageByGate` (copy of array)
- `handleGameOver` and `handleChapterClear`: set `showRunSummary = true` alongside `setGameState('END')`
- JSX (lines 1315-1322): when `gameState === 'END'`:
  - If `showRunSummary === true`: render `RunSummaryOverlay`
  - Else: render `EndScreen`
- RunSummaryOverlay "Continue" callback: `clearPurchaseLog()` then `setShowRunSummary(false)`

**Index mapping note:** `stageIndexRef.current` is 1-based (1-6). Bomb damage uses `si = stageIndexRef.current - 1`, already correct in existing code (line 645). The same pattern is used consistently for `gateDamageDealtRef` (line 1038). No change needed.

### 4. New: `src/game/RunSummaryOverlay.tsx`

Full-screen scrollable overlay with dark background, monospace font, 7 sections:

**Props:**
- `stats: GameStats` (includes telemetry)
- `purchaseLog: PurchaseEvent[]` (from `getPurchaseLog()`)
- `onContinue: () => void`

**Sections:**

**1. CORE RUN INFO**
```
Run ID: 1738956000000
Duration: 45.2s
Stage Reached: 2/6
Boss: not_spawned
```

**2. STAGE & GATE BREAKDOWN** (always show all 5 gates)
```
G1: HP 1000/1000 | Dealt: 312 (31.2%) | Time: 28.4s | Destroyed: NO
G2: HP 2000/2000 | Dealt: 0 (0.0%)    | Time: 0.0s  | [unreached]
G3: HP 3500/3500 | Dealt: 0 (0.0%)    | Time: 0.0s  | [unreached]
G4: HP 5000/5000 | Dealt: 0 (0.0%)    | Time: 0.0s  | [unreached]
G5: HP 7000/7000 | Dealt: 0 (0.0%)    | Time: 0.0s  | [unreached]
```

**3. LINE-OF-SIGHT & DAMAGE FLOW**
```
Shots: 87 fired, 61 hit (70.1%)
To Enemies: 55 | To Gate: 6
Bomb Gate Damage Total: 84
  G1: 84 | G2: 0 | G3: 0 | G4: 0 | G5: 0
```

**4. PRESSURE / SURVIVAL**
```
Max Latched: 4 peak | Time at max: 3.2s
Blocks Lost: 1 | First block lost: 18.3s
Bomb Uses: 2
```

**5. ECONOMY TRACE**
```
Coins Start (wallet): 0
+ Kills: 22
+ Gate Lumps: 0
+ Clear Bonus: 0
= Earned this run: 22
Coins End (wallet): 22
Delta: 0
```

**6. GARAGE / UPGRADE TRACE**
Shows all entries from `purchaseLog`. If empty: `[No upgrades purchased before this run]`
```
power_pip | power | pips: 0->1 | cost: 35 | wallet: 100->65
block_pip | block_0 | pips: 0->1 | cost: 30 | wallet: 65->35
Total Spent: 65
Remaining: 35
```

**7. CONFIG SNAPSHOT** (all stages up to stageReached, plus always Stage 1)
```
AUTO_ATTACK_INTERVAL: 520
PROJECTILE_DAMAGE: 12
POWER_START_REGEN: 0.20
BLOCK_MAX_HP: 300
LATCHED_TICK_DAMAGE: 4
LATCHED_TICK_INTERVAL: 0.5

Stage 1: gateHP=1000 spawn=900 hpMult=1.0 spdMult=1.0 drop=1 lump=40
Stage 2: gateHP=2000 spawn=800 hpMult=1.3 spdMult=1.05 drop=2 lump=80
```

**UI elements:**
- "Copy All" button at top -- copies entire summary as plain text
- "Continue" button at bottom -- fixed position, always visible
- No X button, no other close mechanism
- Dark semi-transparent background, white monospace text
- Scrollable content area

---

## Risk Mitigations

1. **Stale log prevention:** `clearPurchaseLog()` is called both in `initGame()` (safety) and on Continue click (primary). This ensures no log carryover even if the overlay is somehow bypassed.
2. **Gate index consistency:** All gate indexing uses the existing `stageIndexRef.current - 1` pattern already proven in the codebase (lines 645, 901, 1038).
3. **All 5 gates always shown:** Unreached gates display `[unreached]` marker rather than being hidden, providing full visibility for tuning.
4. **Numeric before/after values:** `PurchaseEvent` includes both `before`/`after` strings and `beforeValue`/`afterValue` numbers for future analysis.
5. **Economy separation:** The overlay clearly labels "wallet" coins (progression.totalCoins) vs "run" earnings to avoid confusion.
6. **Purchase log isolation:** Only `persistence.ts` purchase functions write to the log. Debug coin/energy functions do NOT log purchases, keeping the data clean.
