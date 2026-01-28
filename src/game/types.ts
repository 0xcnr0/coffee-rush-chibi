// Game Types for Coffee Rush

export type GameState = 'MENU' | 'PLAY' | 'END' | 'CHAPTER_CLEAR'; // Phase 2B-2: Added CHAPTER_CLEAR
export type GameMode = 'ENDLESS' | 'CHAPTER'; // Phase 2B-2: Game mode selection

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
export type EnemyKind = 'NORMAL' | 'HEAVY' | 'BOSS'; // Phase 2B-2: Added BOSS

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
  isServed: boolean; // true when HP reaches 0, triggers happy animation
  servedTimer: number; // countdown for exit animation
  animationFrame: number;
  state: EnemyState; // TDS-style state machine
  latchedTimer: number; // time until next tick damage
  queuePosition: number; // X position when queued (behind latched enemies)
  kind: EnemyKind; // Phase 2B-1: NORMAL or HEAVY, Phase 2B-2: BOSS
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
  type: 'sparkle' | 'heart' | 'steam' | 'confetti';
  active: boolean;
}

export interface GameStats {
  timeSurvived: number; // in seconds
  customersServed: number;
  totalTips: number;
  beansEarned: number;
  isNewRecord: boolean;
  isChapterClear?: boolean; // Phase 2B-2: Chapter clear flag
  checkpointsCleared?: number; // Phase 2B-2
}

export interface DifficultyState {
  level: number;
  spawnRateMultiplier: number;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  isMorningRush: boolean;
  rushTimer: number;
  breatherTimer: number; // post-rush spawn pause
}

// Phase 2B-2: Boss state tracking
export interface BossState {
  isActive: boolean;
  hp: number;
  maxHp: number;
  spawnedAt: number; // time when boss spawned
  addSpawnTimer: number; // timer for spawning adds during boss fight
}

export interface UpgradeInfo {
  key: 'towerHpLevel' | 'espressoDamageLevel' | 'energyRegenLevel' | 'blockCountLevel';
  name: string;
  description: string;
  icon: string;
  bonusPerLevel: number;
  baseCost: number;
  maxLevel?: number; // Optional override (defaults to UPGRADE_MAX_LEVEL)
  isCount?: boolean; // For block count - shows "+1" instead of percentage
}
