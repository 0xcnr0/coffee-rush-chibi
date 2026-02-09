

# Coffee Rush -- TDS-Inspired Full Reboot: Phase 1 (v1.1 FINAL)

## Overview

This is a foundational architecture rewrite of Chapter 1. The current kill-based gate system with time-based difficulty ramps is replaced by HP-based Gate Buildings, distance-based progress, line-of-sight blocking, exponential economy, uncapped Power, and a Pip/EVO upgrade system with trait selection popups.

Everything stays within Chapter 1 scope. Phase 2 (weapon pattern expansion, trait pools, polish) is also Chapter 1 work.

---

## Current State vs Target

| System | Current | Target |
|--------|---------|--------|
| Gates | Kill X enemies (14/22/30) | Destroy Gate Building (HP objective) |
| Stages | 3 gates + boss | 5 gates + boss (6 stages) |
| Travel | Fixed 5s timer | Short visual transition (1.0-1.5s), skippable |
| Difficulty | Time-based ramp every 20s | Per-stage scaling (no time ramp) |
| Economy | Flat 2 coins/kill | Stage-based exponential + gate lump sums |
| Power | Capped at 4, regen 0.5/s | Uncapped pool (999 soft cap), regen 0.20/s |
| Upgrades | 3-level flat upgrades | Pip/EVO cycle with trait popup |
| Weapons | UI stubs only | Saw (full), Flame+Minigun (ability-only) |
| PickOverlay | 3-choice run buffs after each gate | DISABLED in Phase 1 (only EVO popups) |
| PlayPhase | TRAVEL / FIGHT / PICK / BOSS | TRAVEL / SIEGE / EVO_PICK / BOSS |
| Persistence | Simple upgrade levels (v9) | Chapter-bound pips + EVO choices (v10) |

---

## Key Design Decisions

1. **PickOverlay (run-only buffs) is DISABLED in Phase 1.** Only EVO trait popups appear after pip thresholds. PlayPhase renamed from `PICK` to `EVO_PICK` to avoid confusion with the old PickOverlay system.

2. **Gate HP is calibrated via telemetry, not speculation.** Initial placeholder values are implemented, then adjusted using: `Gate1HP = measuredGateDamageBeforeDeath / 0.20`.

3. **Morning Rush system is REMOVED.** Pressure comes from per-stage scaling + gate infinite stream.

4. **Travel is purely visual (1.0-1.5s).** No spawns, no damage, no economy.

5. **Boss stage (Stage 6) has NO gate building entity.** It uses its own spawn pattern, not the gate spawner.

6. **Economy: Stage 1 drops stay LOW (1-2 coins/kill).** Run 1 earning target (~70-100 coins) is reached via gate-related bonuses/lump sums, not inflated early drops.

---

## Implementation Steps (9 Steps)

### Step 1: Config + Types Foundation

**Files:** `config.ts`, `types.ts`

**Remove from config.ts:**
- `DIFFICULTY_INTERVAL`, `SPAWN_RATE_INCREASE`, `ENEMY_HP_INCREASE`, `ENEMY_SPEED_INCREASE` (time-based ramp)
- `GATE_1/2/3_KILL_TARGET`, `GATE_ENEMY_HP_MULT`, `GATE_ENEMY_SPEED_MULT`, `GATE_SPAWN_RATE_MULT` (kill-based gates)
- `CHECKPOINT_SECONDS`, `CHAPTER1_BOSS_CHECKPOINT` (legacy checkpoint)
- `MAX_POWER: 4` cap (replace with `POWER_POOL_SOFT_CAP: 999`)
- `RUSH_DURATION`, `RUSH_SPAWN_MULTIPLIER`, `RUSH_SPEED_MULTIPLIER` (Morning Rush)
- `POST_RUSH_*` configs
- `EARLY_GAME_SECONDS`, `EARLY_BASE_SPAWN_INTERVAL` (warmup)
- `TIP_VALUE: 2` flat drop
- `RUN_BUFF_POOL`, `PICK_CARDS_OFFERED`
- `ENABLE_GATE_CHAPTER_FLOW` (no longer needed, new system is the only system)

**Add to config.ts:**
```text
STAGES: [
  { id: 1, gateHP: 1000,  spawnInterval: 900,  enemyHpMult: 1.0,  enemySpeedMult: 1.0,  enemyDropCoins: 1,   gateLumpSum: 40,  heavyEvery: 0 },
  { id: 2, gateHP: 2000,  spawnInterval: 800,  enemyHpMult: 1.3,  enemySpeedMult: 1.05, enemyDropCoins: 2,   gateLumpSum: 80,  heavyEvery: 10 },
  { id: 3, gateHP: 3500,  spawnInterval: 700,  enemyHpMult: 1.7,  enemySpeedMult: 1.10, enemyDropCoins: 5,   gateLumpSum: 180, heavyEvery: 8 },
  { id: 4, gateHP: 5000,  spawnInterval: 600,  enemyHpMult: 2.2,  enemySpeedMult: 1.15, enemyDropCoins: 10,  gateLumpSum: 400, heavyEvery: 6 },
  { id: 5, gateHP: 7000,  spawnInterval: 500,  enemyHpMult: 2.8,  enemySpeedMult: 1.20, enemyDropCoins: 20,  gateLumpSum: 800, heavyEvery: 5 },
  { id: 6, isBoss: true, bossHP: 10000, bossDropCoins: 50, clearBonus: 1500 }
]
GATE_HP_RATIOS: [1.0, 2.0, 3.5, 5.0, 7.0]  -- relative to Gate1, for easy calibration
TRAVEL_DURATION: 1.2
POWER_POOL_SOFT_CAP: 999
POWER_START_REGEN: 0.20
GATE_BREATHING_THRESHOLDS: [0.75, 0.50, 0.25]
GATE_BREATHING_SLOWDOWN_DURATION: 1.0
GATE_BREATHING_SPAWN_MULT: 1.5  -- spawn interval multiplied by this during breathing
MAX_ACTIVE_ENEMIES: 30
```

All HP values are placeholders. After first test run, `Gate1HP` will be recalibrated using telemetry.

**Changes to types.ts:**
- Add `StageDefinition` interface
- Add `GateBuilding` interface: { hp, maxHp, x, y, width, height, isDestroyed, stageIndex, breathingActive, breathingTimer }
- Rename `PlayPhase` values: `'TRAVEL' | 'SIEGE' | 'EVO_PICK' | 'BOSS'` (was FIGHT/PICK)
- Add `WeaponAbilityType`: 'saw_line' | 'flame_burst' | 'bullet_storm'
- Add `PipProgress`: { currentPips, maxPips, evoTier, evoChoices: string[] }
- Add `EvoTrait`: { id, name, description, effects }
- Remove: `GateState` (kill-based), `RunBuff`, `RunBuffType`

### Step 2: Core Game Loop Rewrite

**File:** `CoffeeRushGame.tsx` (~60% rewrite)

**A) New State Machine:**
```text
TRAVEL (1.0-1.5s visual) -> SIEGE (gate HP = 0) -> [EVO_PICK if pip threshold] -> TRAVEL -> ... -> BOSS
```

- Replace `gateStateRef` with `stageIndexRef` (1-6) and `gateBuildingRef`
- Remove all time-based difficulty ramp logic (lines ~1018-1065)
- Enemy stats come from `STAGES[stageIndex]` multipliers
- Remove Morning Rush system entirely
- Remove PickOverlay integration (disabled for Phase 1)
- Remove `ENABLE_GATE_CHAPTER_FLOW` flag -- new system is the only system

**B) SIEGE Phase Logic:**
- Gate Building entity at right side of screen (fixed X position, e.g., `CANVAS_WIDTH - 60`)
- Gate spawns enemies continuously while alive (infinite stream)
- `MAX_ACTIVE_ENEMIES` = 30 (kept)
- Projectile collision: if no enemy hit and projectile reaches gate X, damage the Gate Building
- Bomb AoE: check distance to gate as well as enemies (damages both)

**C) Breathing Windows:**
- When gate HP crosses 75%, 50%, 25%: spawn interval multiplied by 1.5x for ~1s
- Track which thresholds have been crossed to avoid re-triggering

**D) Gate Destruction Flow:**
1. Gate HP reaches 0
2. "Victory pulse" particles + 0.8s cleanup fade
3. Remaining enemies fade out (not instant despawn)
4. Award lump sum coins from stage config
5. Check if pip threshold reached -> show EVO_PICK popup (freeze sim)
6. After EVO choice (or if no EVO needed), short TRAVEL to next stage

**E) BOSS Stage (Stage 6):**
- NO gate building entity
- Boss spawns directly (existing boss spawn logic, adapted)
- Spawn source is boss fight pattern, NOT gate spawner
- Progress bar shows "BOSS" mode indicator
- Gate spawner is completely off during BOSS phase

**F) Line-of-Sight:**
- Already implemented: projectiles stop at first enemy hit (lines 1286-1322)
- New: add gate building as collision target -- if projectile reaches gate X without hitting enemy, deal damage to gate
- Gate building collision comes AFTER enemy collision check

**G) Power System:**
- Remove `MAX_POWER: 4` cap reference (line 1068)
- Use `POWER_POOL_SOFT_CAP: 999`
- Start regen: 0.20/s
- Show numeric power value in HUD

### Step 3: Gate Building Renderer

**File:** `renderer.ts`

- New `drawGateBuilding()` function: building sprite at right side during SIEGE, with HP bar above
- Crumble animation on destroy (particle burst + shake + fade)
- Gate visually distinct per stage (color/size variation or simple stage number indicator)
- Update `drawGame()` signature to accept optional `GateBuilding` parameter
- Gate building is NOT drawn during BOSS phase (Stage 6)

### Step 4: Saw Weapon (Pierce Mechanic -- Soft-Lock Prevention)

**Files:** `CoffeeRushGame.tsx`, `renderer.ts`

The Saw weapon is critical for Phase 1 -- it solves the line-of-sight soft-lock.

- Saw fires pierce projectiles: pass through enemies, damage each, continue to gate
- Has its own fire rate (slower than espresso auto-attack) and damage values
- Fires from weapon slot on cargo box (if equipped)
- Power ability "Saw Line": costs 4 Power, fires a wide pierce slash
- Renderer: draw saw projectile as a spinning disc/blade visual
- New projectile property: `pierce: boolean` -- pierce projectiles skip the `release` on enemy hit

### Step 5: Flame + Minigun (Ability-Only)

**Files:** `CoffeeRushGame.tsx`, `GameHUD.tsx`

- No auto-fire patterns in Phase 1
- Flame Burst (7 Power): AoE damage to all enemies on screen + partial gate damage
- Bullet Storm (10 Power): rapid burst of 15 projectiles over 2s (auto-aim, standard collision rules)
- HUD buttons appear when weapons are unlocked (purchased in Garage)

### Step 6: Economy (Exponential)

**Files:** `config.ts` (in STAGES array), `CoffeeRushGame.tsx`

Initial placeholder table (adjusted via telemetry later):

| Stage | Enemy drop | Gate lump sum | Cumulative (est.) |
|-------|-----------|---------------|-------------------|
| 1 | 1 | 40 | ~70-100 |
| 2 | 2 | 80 | ~250 |
| 3 | 5 | 180 | ~600 |
| 4 | 10 | 400 | ~1500 |
| 5 | 20 | 800 | ~3500 |
| Boss | 50 | 1500 (clear) | ~5000+ |

- Run 1 target: die at Gate 1, earn ~70-100 coins total (enemy drops + partial gate bonuses/death reward)
- Stage 1 drops stay deliberately LOW (1 coin/kill); the lump sum and gate bonuses do the heavy lifting
- This ensures the "rich feeling" comes from progression, not from early farming

### Step 7: Pip + EVO Upgrade System

**Files:** new `evoData.ts`, `persistence.ts`, `CoffeeRushGame.tsx`

**Block upgrade cycle:**
- 3 pips (purchases) per EVO tier
- After 3 pips: EVO popup (EVO_PICK phase, simulation frozen) with 2 trait choices
- After 2nd EVO: block reaches MAX
- Initial trait pool (small):
  - EVO 1: Throne (+20% HP, +10% ATK) vs Repair (2% HP/5s heal)
  - EVO 2: Battery (+15% Power regen) vs Arsenal (+10% Weapon ATK)

**Weapon upgrade cycle:**
- 5 pips per EVO tier
- After 5 pips: EVO popup with 2 trait choices
- Cycle repeats (EV2, EV3...) -- cost scaling controls depth
- Initial trait pool (Saw): +1 projectile OR -25% ability cost

**New file `evoData.ts`:** Contains all trait definitions for blocks and weapons.

### Step 8: Persistence Rewrite

**File:** `persistence.ts`

- Bump `SAVE_VERSION` to 10
- New `ProgressionData` shape:
  - `chapterBound`: { coins, blockPips[], blockEvoChoices[][], weaponPips[], weaponEvoChoices[][], powerRegenPips }
  - `meta`: { diamonds: 0, backpackGold: 0, heroCards: [] } (placeholder for future)
- Migration from v9: reset progression (clean slate for the reboot -- old upgrade levels are incompatible with pip system)
- `CHAPTER_RESET_ENABLED: false` feature flag (ready for Chapter 2, not active now)
- Chapter-bound persistence is ON: upgrades persist across runs within Chapter 1

### Step 9: Garage UI Rewrite + HUD Updates

**Files:** `GarageOverlay.tsx` (complete rewrite), `GameHUD.tsx`, `EndScreen.tsx`, `DebugHUD.tsx`

**GarageOverlay (960+ lines, complete rewrite):**
- Block slots (visual): 3 slots with pip progress indicators (filled/empty dots) + EVO tier badges
- Weapon slots: weapon icon + pip bar + EVO tier display
- Power regen upgrade tile
- EVO Popup: Modal overlay with 2 trait cards, blocks until choice made
- Footer tabs remain for navigation
- PLAY button + energy system unchanged

**GameHUD:**
- Progress bar = stage-based distance segments (6 segments, colored by completion)
- Power display: numeric value (e.g., "23.4") instead of bar
- Gate HP indicator during SIEGE phase
- Weapon ability buttons (Saw Line / Flame Burst / Bullet Storm) with Power cost display

**EndScreen:**
- Stage-based summary (stage reached, gate damage dealt, coins breakdown by source)

**DebugHUD:**
- New fields: stageIndex, gateHP%, gateDamageDealt, power numeric
- Telemetry logging: `gateDamageDealtBeforeDeath` for HP calibration
- Remove: checkpoint index, rush timer, morning rush fields

---

## What Gets Deleted

- Time-based difficulty ramp (`DIFFICULTY_INTERVAL`, cumulative multipliers) -- lines 1018-1065 in CoffeeRushGame.tsx
- Morning Rush system (rush timer, rush multipliers, post-rush recovery) -- scattered across config + game loop
- Kill-based gate targets (`GATE_X_KILL_TARGET`, `GateState` type)
- `MAX_POWER: 4` cap
- Legacy checkpoint system (`CHECKPOINT_SECONDS`, `CHAPTER1_BOSS_CHECKPOINT`)
- `ENABLE_GATE_CHAPTER_FLOW` feature flag (new system is the only path)
- Old flat upgrade definitions in GarageOverlay (`UPGRADES` array, `CARGO_UPGRADE`)
- `PickOverlay.tsx` -- disabled/not imported in Phase 1
- Run buff system (`RunBuff`, `RunBuffType`, `RUN_BUFF_POOL`, `handleBuffSelect`)
- Warmup period logic (`EARLY_GAME_SECONDS`, `EARLY_BASE_SPAWN_INTERVAL`)

## What Survives

- Canvas rendering pipeline (drawBackground, drawGround, drawCart, drawBarista, drawEnemy, drawProjectile, drawParticle, drawTip)
- Object pooling system (`useObjectPool.ts`) -- unchanged
- Game loop infrastructure (`useGameLoop.ts`) -- unchanged
- Enemy entity base structure (x, y, hp, state machine: WALKING/LATCHED/QUEUED/SERVED)
- Projectile collision logic (enhanced with gate target + pierce flag)
- Scale-to-fit viewport logic
- Pause/Leave flow
- Energy (stamina) system for gating play sessions
- Particle/tip visual systems
- Bomb mechanic (enhanced to also damage gate)
- Heavy enemy type (scheduling moves to per-stage config)

---

## Telemetry for Balance Calibration

After first playable build, the following MUST be logged in DebugHUD/console:

- `gateDamageDealt`: total damage dealt to Gate 1 before death (Run 1, 0 upgrades)
- `timeAtGate`: seconds spent at each gate
- `shotsToGate` vs `shotsToEnemies`: ratio of gate hits vs enemy hits
- `stageReached`: furthest stage index

Then calibrate: `Gate1HP = gateDamageDealt / 0.20`
Gate 2-5 HP = Gate1HP * ratio from `GATE_HP_RATIOS` array.

---

## File Change Summary

| File | Action | Scope |
|------|--------|-------|
| `config.ts` | Major rewrite | STAGES array, remove time-ramp/rush/warmup, uncap power |
| `types.ts` | Major rewrite | GateBuilding, StageDefinition, PipProgress, EvoTrait, PlayPhase rename, remove GateState/RunBuff |
| `CoffeeRushGame.tsx` | Major rewrite (~60%) | New state machine, siege loop, gate collision, weapon abilities, remove rush/ramp |
| `renderer.ts` | Major additions | Gate Building drawing, crumble animation, saw projectile VFX |
| `persistence.ts` | Major rewrite | Schema v10, pip/EVO storage, chapter-bound structure |
| `GarageOverlay.tsx` | Complete rewrite | Pip tiles, EVO popup, weapon slots |
| `GameHUD.tsx` | Medium changes | Distance progress bar, power numeric, weapon buttons, gate HP |
| `EndScreen.tsx` | Medium changes | Stage-based summary |
| `PickOverlay.tsx` | Disabled/removed | Not used in Phase 1 |
| `DebugHUD.tsx` | Medium changes | New calibration fields, remove rush fields |
| New: `evoData.ts` | New file | Trait definitions for blocks and weapons |

---

## Implementation Order

Due to scope, implementation will be done in sub-steps within this plan:

1. **Config + Types** -- Foundation (no visible change yet)
2. **Core loop + Gate Building** -- 6-stage cycle with HP-based gates playable
3. **Renderer** -- Gate Building visuals, crumble animation
4. **Economy + Power** -- Exponential drops, uncapped power pool
5. **Saw weapon** -- Pierce mechanic solving line-of-sight soft-lock
6. **Flame + Minigun abilities** -- Power-cost buttons in HUD
7. **Pip/EVO system + Persistence** -- Upgrade cycle with trait popup
8. **Garage UI** -- Full rewrite with pip tiles and EVO display
9. **Telemetry + Polish** -- Updated summary format, calibration debug tools

---

## Risk Mitigations

1. **Soft-lock:** Bomb always damages gate + Saw pierce weapon + breathing windows at HP thresholds + MAX_ACTIVE cap
2. **HP calibration:** Telemetry-first. Gate HP derived from measured damage, not speculation. All values in config.
3. **Save migration:** Version bump v9 to v10 -- clean reset (old upgrade system is incompatible with pip/EVO)
4. **Performance:** Gate Building is 1 entity (negligible). Enemy cap stays at 30.
5. **Complexity:** Phase 1 trait pool intentionally small (2 choices per EVO). Expandable in Phase 2.
6. **Boss stage isolation:** Stage 6 explicitly has NO gate building -- prevents accidental gate spawner activation during boss.
7. **PlayPhase naming:** EVO_PICK clearly distinct from old PickOverlay, preventing Lovable from re-enabling disabled run buffs.

