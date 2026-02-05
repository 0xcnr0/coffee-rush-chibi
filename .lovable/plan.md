
# Phase A: Segmented Chapter Flow - Final Implementation Plan

## Kullanıcının 4 Kritik Revizyonu Dahil Edildi

| Revizyon | Açıklama | Uygulama Stratejisi |
|----------|----------|---------------------|
| **R1** | BOSS phase'ında normal spawn yok (1v1) | Spawn guard: `FIGHT` sadece, `BOSS` ayrı |
| **R2** | TRAVEL'da countdown banner + kalan düşmanları fade-out | Travel başında despawn + UI countdown |
| **R3** | PICK için `setIsPaused(true)` yerine "simulation freeze" | `isSimulationFrozen` flag, loop çalışır |
| **R4** | Flag ON iken checkpoint progression boss logic'i etkilemez | `checkpointIndex` hesaplanmaz veya izole |

---

## A) Yeni Types (src/game/types.ts)

```typescript
// Phase 3A: PlayPhase for segmented chapter flow
export type PlayPhase = 'TRAVEL' | 'FIGHT' | 'PICK' | 'BOSS';

// Gate progress tracking
export interface GateState {
  index: number;           // 1, 2, 3
  targetKills: number;     // enemies to serve for this gate
  currentKills: number;    // enemies served this gate
  isCleared: boolean;
}

// Run-only buff system (temporary, reset after run)
export type RunBuffType = 'damage' | 'block_hp' | 'power_regen' | 'attack_speed' | 'repair' | 'bomb_charge';

export interface RunBuff {
  type: RunBuffType;
  name: string;
  icon: string;
  description: string;
  value: number;  // multiplier (1.15 = +15%) or flat value for repair/bomb
}

// Telemetry additions
export interface RunTelemetry {
  // ... existing fields ...
  
  // Phase 3A: Segment telemetry
  phaseAtDeath: PlayPhase | null;
  gatesCleared: number;
  gateIndexReached: number;
  runBuffsPicked: string[];
  timeInTravel: number;
  timeInFight: number;
  timeInPick: number;
  timeInBoss: number;
}
```

---

## B) Config Sabitleri (src/game/config.ts)

```typescript
// ─────────────────────────────────────────────────────────────
// PHASE 3A: SEGMENTED CHAPTER FLOW
// ─────────────────────────────────────────────────────────────
ENABLE_GATE_CHAPTER_FLOW: true,  // Feature flag (start with false for testing)

// Travel phase
TRAVEL_DURATION: 4,              // seconds between gates

// Gate kill targets (tunable)
GATE_1_KILL_TARGET: 15,
GATE_2_KILL_TARGET: 20,
GATE_3_KILL_TARGET: 25,

// Transition timing
TRAVEL_DESPAWN_DELAY: 0.5,       // seconds to fade-out remaining enemies

// Pick overlay
PICK_CARDS_OFFERED: 3,

// Run buff definitions
RUN_BUFF_POOL: [
  { type: 'damage', name: 'Hot Shot', icon: '🔥', description: '+15% damage', value: 1.15 },
  { type: 'block_hp', name: 'Steel Brew', icon: '🛡️', description: '+20% block HP', value: 1.20 },
  { type: 'power_regen', name: 'Quick Refill', icon: '⚡', description: '+25% power regen', value: 1.25 },
  { type: 'attack_speed', name: 'Caffeine Rush', icon: '☕', description: '+10% attack speed', value: 0.90 }, // 0.9 = faster interval
  { type: 'repair', name: 'Repair Kit', icon: '🔧', description: 'Heal 30% HP', value: 0.30 },
  { type: 'bomb_charge', name: 'Extra Shot', icon: '💣', description: '+1 bomb charge', value: 1 },
],
```

---

## C) State Machine Değişiklikleri (src/game/CoffeeRushGame.tsx)

### C1. Yeni State ve Refs (satır ~100 civarı, bossState yanına)

```typescript
// Phase 3A: PlayPhase state (CHAPTER only)
const [playPhase, setPlayPhase] = useState<PlayPhase>('TRAVEL');
const playPhaseRef = useRef<PlayPhase>('TRAVEL');

// Gate tracking
const [gateState, setGateState] = useState<GateState>({
  index: 1, targetKills: GAME_CONFIG.GATE_1_KILL_TARGET, currentKills: 0, isCleared: false
});
const gateStateRef = useRef<GateState>({ ... });

// Run buffs (temporary for this run only)
const runBuffsRef = useRef<RunBuff[]>([]);

// Travel timer
const travelTimerRef = useRef(0);

// R3: Simulation freeze (different from pause - loop runs but sim stopped)
const isSimulationFrozenRef = useRef(false);

// Phase time tracking for telemetry
const phaseTimersRef = useRef({ travel: 0, fight: 0, pick: 0, boss: 0 });
```

### C2. initGame Reset (satır ~315 civarı)

```typescript
// Reset Phase 3A state
if (gameMode === 'CHAPTER' && GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW) {
  playPhaseRef.current = 'TRAVEL';
  setPlayPhase('TRAVEL');
  travelTimerRef.current = GAME_CONFIG.TRAVEL_DURATION;
  gateStateRef.current = { 
    index: 1, 
    targetKills: GAME_CONFIG.GATE_1_KILL_TARGET, 
    currentKills: 0, 
    isCleared: false 
  };
  setGateState(gateStateRef.current);
  runBuffsRef.current = [];
  isSimulationFrozenRef.current = false;
  phaseTimersRef.current = { travel: 0, fight: 0, pick: 0, boss: 0 };
}

// R4: Reset checkpoint-related refs if flag ON (prevent accidental boss trigger)
if (GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW) {
  // checkpointIndex will NOT be used for boss logic when flag ON
}
```

### C3. Game Loop - PlayPhase Handler (satır ~700 civarı, difficulty update sonrası)

```typescript
// Phase 3A: PlayPhase management (CHAPTER only, flag ON)
if (gameMode === 'CHAPTER' && GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW) {
  const phase = playPhaseRef.current;
  
  // Track time per phase (telemetry)
  phaseTimersRef.current[phase.toLowerCase()] += deltaTime;
  
  // R3: If simulation frozen (PICK phase), skip all sim updates
  if (isSimulationFrozenRef.current) {
    // Only render, no sim updates
    // Continue to draw call but skip enemy/projectile updates
    // (handled by early return or skip flags below)
  }
  
  // TRAVEL phase handler
  if (phase === 'TRAVEL') {
    travelTimerRef.current -= deltaTime;
    
    // R2: Despawn remaining enemies during travel
    enemyPool.getActive().forEach(enemy => {
      enemy.hp = 0; // Force serve → despawn
      enemy.state = 'SERVED';
      enemy.isServed = true;
      enemy.servedTimer = GAME_CONFIG.TRAVEL_DESPAWN_DELAY;
    });
    
    // Transition to FIGHT when travel ends
    if (travelTimerRef.current <= 0) {
      playPhaseRef.current = 'FIGHT';
      setPlayPhase('FIGHT');
      lastSpawnRef.current = performance.now() / 1000; // Reset spawn timer
    }
  }
  
  // BOSS phase entry (after Gate 3)
  if (phase === 'BOSS' && !bossStateRef.current.isActive && bossEnemyRef.current === null) {
    // Trigger boss spawn (use existing boss spawn logic)
    // ... (existing boss spawn code, lines 861-894)
  }
}
```

### C4. Spawn Guard Güncelleme (satır 926)

**Mevcut:**
```typescript
const canSpawn = bossIncomingRef.current <= 0 && !bossStateRef.current.isActive;
```

**Yeni (R1 + R3 dahil):**
```typescript
// Phase 3A: Spawn guard with PlayPhase
let canSpawn = true;

if (gameMode === 'CHAPTER' && GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW) {
  // R1: Only spawn during FIGHT phase (not TRAVEL, PICK, or BOSS)
  // R3: Not during simulation freeze
  canSpawn = playPhaseRef.current === 'FIGHT' 
    && !isSimulationFrozenRef.current
    && bossIncomingRef.current <= 0;
} else {
  // Legacy behavior (flag OFF or ENDLESS mode)
  canSpawn = bossIncomingRef.current <= 0 && !bossStateRef.current.isActive;
}
```

### C5. Gate Clear Check (düşman served olduktan sonra, satır ~1082 civarı)

```typescript
// Phase 3A: Update gate progress on enemy served
if (gameMode === 'CHAPTER' && GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW 
    && playPhaseRef.current === 'FIGHT') {
  gateStateRef.current.currentKills++;
  setGateState({ ...gateStateRef.current });
  
  // Check gate clear
  if (gateStateRef.current.currentKills >= gateStateRef.current.targetKills) {
    gateStateRef.current.isCleared = true;
    
    if (gateStateRef.current.index >= 3) {
      // All gates cleared → BOSS phase
      playPhaseRef.current = 'BOSS';
      setPlayPhase('BOSS');
      // Boss will spawn via existing logic (modified trigger below)
    } else {
      // Show pick overlay → freeze simulation (R3)
      playPhaseRef.current = 'PICK';
      setPlayPhase('PICK');
      isSimulationFrozenRef.current = true; // R3: Freeze, don't pause loop
    }
  }
}
```

### C6. Boss Trigger Migration (R4, satır 845)

**Mevcut:**
```typescript
const shouldSpawnBoss = gameMode === 'CHAPTER' 
  && checkpointIndex >= GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT 
  && !bossStateRef.current.isActive 
  && bossEnemyRef.current === null;
```

**Yeni (R4 dahil):**
```typescript
let shouldSpawnBoss = false;

if (gameMode === 'CHAPTER') {
  if (GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW) {
    // R4: Gate-based trigger (checkpoint logic completely bypassed)
    shouldSpawnBoss = playPhaseRef.current === 'BOSS'
      && !bossStateRef.current.isActive 
      && bossEnemyRef.current === null;
  } else {
    // Legacy: Time-based trigger
    const checkpointIndex = Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS);
    shouldSpawnBoss = checkpointIndex >= GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT 
      && !bossStateRef.current.isActive 
      && bossEnemyRef.current === null;
  }
}
```

---

## D) Pick Overlay Component (Yeni: src/game/PickOverlay.tsx)

```typescript
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from './config';
import type { RunBuff } from './types';

interface PickOverlayProps {
  gateIndex: number;
  onSelect: (buff: RunBuff) => void;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const PickOverlay: React.FC<PickOverlayProps> = ({ gateIndex, onSelect }) => {
  const options = useMemo(() => 
    shuffleArray(GAME_CONFIG.RUN_BUFF_POOL).slice(0, GAME_CONFIG.PICK_CARDS_OFFERED),
    []
  );
  
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-coffee-dark rounded-2xl p-6 max-w-sm w-full border-2 border-gold/50">
        <h2 className="text-2xl font-bold text-gold text-center mb-2">
          ⭐ Gate {gateIndex} Cleared!
        </h2>
        <p className="text-coffee-cream text-center mb-6 text-sm">
          Choose a buff for this run:
        </p>
        
        <div className="flex flex-col gap-3">
          {options.map((buff, idx) => (
            <Button
              key={buff.type}
              onClick={() => onSelect(buff)}
              className="h-auto py-4 px-4 bg-coffee-medium hover:bg-coffee-light border border-coffee-light/30 flex items-center gap-4 text-left"
            >
              <span className="text-3xl">{buff.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-coffee-foam">{buff.name}</div>
                <div className="text-sm text-coffee-cream/80">{buff.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## E) Buff Selection Handler (CoffeeRushGame.tsx)

```typescript
const handleBuffSelect = useCallback((buff: RunBuff) => {
  // Add to run buffs list
  runBuffsRef.current.push(buff);
  
  // Apply buff effect
  switch (buff.type) {
    case 'damage':
      damageMultiplierRef.current *= buff.value;
      break;
    case 'block_hp':
      // Increase max HP of all blocks (doesn't heal, just cap)
      blocksRef.current.forEach(block => {
        block.maxHp = Math.floor(block.maxHp * buff.value);
      });
      break;
    case 'power_regen':
      energyRegenMultiplierRef.current *= buff.value;
      break;
    case 'attack_speed':
      // Store in ref for attack interval calculation
      attackSpeedMultiplierRef.current = (attackSpeedMultiplierRef.current ?? 1) * buff.value;
      break;
    case 'repair':
      // Instant repair: heal all blocks by X%
      blocksRef.current.forEach(block => {
        if (!block.destroyed) {
          block.hp = Math.min(block.maxHp, block.hp + Math.floor(block.maxHp * buff.value));
        }
      });
      break;
    case 'bomb_charge':
      // Add bomb charge (needs new ref if not exists)
      // For Phase A: just increase energy by cost equivalent
      energyRef.current = Math.min(GAME_CONFIG.MAX_POWER, energyRef.current + GAME_CONFIG.TONIC_BOMB_COST);
      break;
  }
  
  // Telemetry: track picked buff
  telemetryRef.current.runBuffsPicked = telemetryRef.current.runBuffsPicked || [];
  telemetryRef.current.runBuffsPicked.push(buff.name);
  
  // Advance to next gate
  const nextIndex = gateStateRef.current.index + 1;
  const targetKills = nextIndex === 2 
    ? GAME_CONFIG.GATE_2_KILL_TARGET 
    : GAME_CONFIG.GATE_3_KILL_TARGET;
  
  gateStateRef.current = {
    index: nextIndex,
    targetKills,
    currentKills: 0,
    isCleared: false
  };
  setGateState(gateStateRef.current);
  
  // R3: Unfreeze simulation and start travel
  isSimulationFrozenRef.current = false;
  travelTimerRef.current = GAME_CONFIG.TRAVEL_DURATION;
  playPhaseRef.current = 'TRAVEL';
  setPlayPhase('TRAVEL');
}, []);
```

---

## F) GameHUD Güncellemeleri (src/game/GameHUD.tsx)

### F1. Props Ekleme

```typescript
interface GameHUDProps {
  // ... existing props ...
  playPhase?: PlayPhase;
  gateState?: GateState;
  travelTimer?: number;
}
```

### F2. Gate Progress Bar (Chapter mode + flag ON)

```typescript
{/* R2: Phase indicator + Travel countdown */}
{playPhase === 'TRAVEL' && travelTimer > 0 && (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
    <div className="bg-coffee-dark/90 text-coffee-cream px-6 py-3 rounded-xl text-lg font-bold animate-pulse border border-coffee-medium">
      🚶 TRAVEL... {Math.ceil(travelTimer)}
    </div>
  </div>
)}

{/* Gate progress (replaces checkpoint bar when flag ON) */}
{GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW && gateState && isChapter && !bossState.isActive && (
  <div className="flex flex-col gap-1 px-1">
    <div className="flex justify-between text-xs text-coffee-cream/70 mb-1">
      <span>Gate {gateState.index}/3</span>
      <span>{gateState.currentKills}/{gateState.targetKills}</span>
    </div>
    <div className="h-2 rounded-full overflow-hidden bg-coffee-dark/60">
      <div 
        className="h-full transition-all duration-200 bg-gold"
        style={{ width: `${(gateState.currentKills / gateState.targetKills) * 100}%` }}
      />
    </div>
  </div>
)}

{/* Phase badge */}
{playPhase === 'FIGHT' && !bossState.isActive && (
  <div className="bg-warm-orange text-coffee-foam px-3 py-1 rounded-full text-xs font-bold">
    ⚔️ FIGHT
  </div>
)}
```

---

## G) Telemetry Güncellemeleri

### handleGameOver ve handleChapterClear içinde:

```typescript
// Phase 3A: Add segment telemetry
telemetry.phaseAtDeath = playPhaseRef.current;
telemetry.gatesCleared = gateStateRef.current.index - (gateStateRef.current.isCleared ? 0 : 1);
telemetry.gateIndexReached = gateStateRef.current.index;
telemetry.runBuffsPicked = runBuffsRef.current.map(b => b.name);
telemetry.timeInTravel = phaseTimersRef.current.travel;
telemetry.timeInFight = phaseTimersRef.current.fight;
telemetry.timeInPick = phaseTimersRef.current.pick;
telemetry.timeInBoss = phaseTimersRef.current.boss;
```

---

## H) Dosya Değişiklikleri Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/game/types.ts` | PlayPhase, GateState, RunBuff types + telemetry fields |
| `src/game/config.ts` | Feature flag + gate targets + buff pool + travel duration |
| `src/game/CoffeeRushGame.tsx` | PlayPhase state machine, spawn guard, gate tracking, buff handler, boss trigger |
| `src/game/PickOverlay.tsx` | **YENİ** - 3-card selection overlay |
| `src/game/GameHUD.tsx` | Gate progress bar, phase indicator, travel countdown |
| `src/game/RunSummary.tsx` | New telemetry display (gatesCleared, buffs picked, phase times) |

---

## I) Acceptance Criteria

### 1. PlayPhase State Machine
- [ ] TRAVEL: 4 saniye, spawn yok, countdown banner görünür
- [ ] TRAVEL'da mevcut düşmanlar despawn/fade-out (R2)
- [ ] FIGHT: Normal spawn, gate progress artıyor
- [ ] PICK: Simulation freeze (loop çalışır ama sim durur) (R3)
- [ ] BOSS: Gate 3 sonrası tetiklenir, normal spawn yok (R1)

### 2. Gate Sistemi
- [ ] Gate 1: 15 kill
- [ ] Gate 2: 20 kill  
- [ ] Gate 3: 25 kill
- [ ] Her gate sonrası PICK overlay açılır

### 3. Pick Overlay
- [ ] 3 random buff gösterilir
- [ ] Seçim yapılınca buff uygulanır
- [ ] Sonraki TRAVEL başlar
- [ ] Simulation freeze, pause değil (R3)

### 4. Feature Flag & Isolation
- [ ] `ENABLE_GATE_CHAPTER_FLOW = false` → Eski time-based sistem
- [ ] `ENABLE_GATE_CHAPTER_FLOW = true` → Yeni gate sistemi
- [ ] ENDLESS mode hiç etkilenmez
- [ ] Flag ON iken checkpoint logic boss'u tetiklemez (R4)

### 5. Boss Trigger
- [ ] Gate 3 clear → BOSS phase
- [ ] BOSS phase'da normal spawn yok (R1)
- [ ] Boss asla Gate 3'ten önce spawn etmez

### 6. Telemetry
- [ ] `gatesCleared` doğru sayılır
- [ ] `phaseAtDeath` kayıt edilir
- [ ] `runBuffsPicked` listesi dolu
- [ ] Phase time'lar kayıt edilir

---

## J) Test Senaryoları

| # | Senaryo | Beklenen Sonuç |
|---|---------|----------------|
| 1 | Flag OFF + Chapter | Eski behavior (60s → boss) |
| 2 | Flag ON + TRAVEL başlangıç | 4s countdown, spawn yok |
| 3 | Flag ON + TRAVEL'da eski düşman | Despawn/fade-out (R2) |
| 4 | Flag ON + Gate 1 clear | PICK overlay açılır, sim freeze (R3) |
| 5 | Flag ON + PICK seçimi | Buff uygulanır, TRAVEL başlar |
| 6 | Flag ON + Gate 3 clear | BOSS phase, normal spawn yok (R1) |
| 7 | Flag ON + BOSS öldür | Chapter clear |
| 8 | Flag ON + Ölüm TRAVEL'da | Telemetry: `phaseAtDeath: TRAVEL` |
| 9 | Flag ON + ENDLESS mode | Hiçbir gate/phase logic çalışmaz |
| 10 | Flag ON + Boss spawn timing | Boss asla Gate 3 önce spawn etmez (R4) |

---

## K) Implementation Order

1. **types.ts** - Yeni types ekle
2. **config.ts** - Feature flag (OFF başla) + constants
3. **PickOverlay.tsx** - Yeni component oluştur
4. **CoffeeRushGame.tsx** - State, refs, handlers
5. **GameHUD.tsx** - UI güncellemeleri
6. **RunSummary.tsx** - Telemetry display
7. Flag'i ON yap ve test et
