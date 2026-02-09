// Game Types for Coffee Rush
// TDS-Inspired Reboot: Phase 1 v1.1

export type GameState = 'MENU' | 'PLAY' | 'END';
export type GameMode = 'ENDLESS' | 'CHAPTER';

// Phase 1 v1.1: Renamed phases for TDS-style gate flow
// SIEGE replaces FIGHT, EVO_PICK replaces PICK (PickOverlay disabled)
export type PlayPhase = 'TRAVEL' | 'SIEGE' | 'EVO_PICK' | 'BOSS';

// ═══════════════════════════════════════════════════════════════════════════════
// GATE BUILDING (HP-based objective)
// ═══════════════════════════════════════════════════════════════════════════════
export interface GateBuilding {
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isDestroyed: boolean;
  stageIndex: number;        // 1-5 (no gate for boss stage 6)
  breathingActive: boolean;
  breathingTimer: number;
  crossedThresholds: number[];  // track which HP% thresholds triggered breathing
  crumbleTimer: number;         // cleanup animation timer after destruction
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
export type WeaponType = 'saw' | 'flame' | 'minigun' | null;
export type WeaponAbilityType = 'saw_line' | 'flame_burst' | 'bullet_storm';

export interface WeaponSlot {
  weaponType: WeaponType;
  level: number;
}

export interface WeaponInfo {
  type: WeaponType;
  name: string;
  icon: string;
  description: string;
  baseCost: number;
  upgradeCost: number;
  maxLevel: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIP / EVO UPGRADE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
export interface PipProgress {
  currentPips: number;
  maxPips: number;       // pips per EVO tier
  evoTier: number;       // current EVO tier (0 = no EVO yet)
  evoChoices: string[];  // IDs of chosen traits
}

export interface EvoTrait {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'block' | 'weapon' | 'power' | 'damage';
  effects: EvoEffect[];
}

export interface EvoEffect {
  type: 'hp_mult' | 'atk_mult' | 'regen_mult' | 'heal_percent' | 'weapon_atk_mult' | 
        'projectile_count' | 'ability_cost_mult' | 'power_regen_mult' | 'damage_mult';
  value: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENTITIES
// ═══════════════════════════════════════════════════════════════════════════════
export interface Vector2 {
  x: number;
  y: number;
}

export interface CartBlock {
  id: number;
  hp: number;
  maxHp: number;
  y: number;
  height: number;
  destroyed: boolean;
}

export type EnemyState = 'WALKING' | 'LATCHED' | 'QUEUED' | 'SERVED';
export type EnemyKind = 'NORMAL' | 'HEAVY' | 'BOSS';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  width: number;
  height: number;
  active: boolean;
  isServed: boolean;
  servedTimer: number;
  animationFrame: number;
  state: EnemyState;
  latchedTimer: number;
  queuePosition: number;
  kind: EnemyKind;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  active: boolean;
  radius: number;
  pierce: boolean;          // Pierce projectiles pass through enemies
  isSaw: boolean;           // Visual: render as saw blade
}

export interface TipDrop {
  id: number;
  x: number;
  y: number;
  targetY: number;
  value: number;
  active: boolean;
  opacity: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'sparkle' | 'heart' | 'steam' | 'confetti' | 'crumble';
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATS & TELEMETRY
// ═══════════════════════════════════════════════════════════════════════════════
export interface GameStats {
  timeSurvived: number;
  customersServed: number;
  totalTips: number;
  coinsEarned: number;
  isNewRecord: boolean;
  isChapterClear?: boolean;
  stageReached?: number;
  telemetry?: RunTelemetry;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE EVENT LOG (Garage upgrade trace)
// ═══════════════════════════════════════════════════════════════════════════════
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

export interface RunTelemetry {
  // Debug identity
  runId: number;
  telemetryBuiltAt: number;
  
  // Run result
  gameMode: GameMode;
  stageReached: number;
  reachedBoss: boolean;
  bossOutcome: 'not_spawned' | 'spawned' | 'defeated' | 'died_during_boss';
  bossHpPercent: number;
  
  // Upgrade snapshot
  pipLevels: {
    blockPips: number[];
    weaponPips: number[];
    powerPips: number;
    damagePips: number;
    blockCount: number;
  };
  
  // Combat data
  shotsFired: number;
  shotsHit: number;
  hitRate: number;
  
  // Pressure
  maxLatchedPeak: number;
  timeAtMaxLatched: number;
  
  // Survivability
  blocksLost: number;
  timeToFirstBlockLost: number;
  tonicBombUses: number;
  
  // Gate telemetry
  gateDamageDealt: number[];
  gateTimeSpent: number[];
  shotsToGate: number;
  shotsToEnemies: number;
  bombGateDamageTotal: number;
  bombGateDamageByGate: number[];
  gateDestroyedByGate: boolean[];
  
  // Phase timing
  phaseAtDeath: PlayPhase | null;
  timeInTravel: number;
  timeInSiege: number;
  timeInEvoPick: number;
  timeInBoss: number;
  
  // Spawn distribution
  enemiesSpawned: { normal: number; heavy: number; boss: number };
  enemiesKilled: { normal: number; heavy: number; boss: number };
  
  // Economy
  coinsStart: number;
  coinsEnd: number;
  coinsEarnedActual: number;
  coinsFromKills: number;
  coinsFromGateLumps: number;
  clearBonusCoins: number;
  coinsTotalBreakdown: number;
  economyDelta: number;
  deltaExplanation: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOSS STATE
// ═══════════════════════════════════════════════════════════════════════════════
export interface BossState {
  isActive: boolean;
  hp: number;
  maxHp: number;
  spawnedAt: number;
  addSpawnTimer: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPGRADE INFO (for UI display)
// ═══════════════════════════════════════════════════════════════════════════════
export interface UpgradeInfo {
  key: string;
  name: string;
  description: string;
  icon: string;
  pipsPerEvo: number;
  baseCost: number;
  costScaling: number;
  maxEvos?: number;
}
