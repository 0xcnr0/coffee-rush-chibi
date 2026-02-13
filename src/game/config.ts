// Game Configuration Constants for Coffee Rush
// TDS-Inspired Reboot: Phase 1 v1.1
// All speeds are in pixels/second, intervals are in milliseconds (ms)

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE DEFINITIONS (HP-based Gate Buildings)
// HP values are PLACEHOLDERS — calibrate via telemetry after first playable build
// Gate1HP = measuredGateDamageBeforeDeath / 0.20
// Gate2-5 HP = Gate1HP * GATE_HP_RATIOS[i]
// ═══════════════════════════════════════════════════════════════════════════════
export interface StageConfig {
  id: number;
  isBoss?: boolean;
  gateHP?: number;          // Gate Building HP (not used for boss stage)
  spawnInterval: number;     // ms between enemy spawns
  enemyHpMult: number;       // enemy HP multiplier for this stage
  enemySpeedMult: number;    // enemy speed multiplier for this stage
  enemyDropCoins: number;    // coins dropped per enemy kill
  gateLumpSum: number;       // coins awarded when gate is destroyed
  heavyEvery: number;        // spawn a heavy every N enemies (0 = no heavies)
  // Boss-specific
  bossHP?: number;
  bossDropCoins?: number;
  clearBonus?: number;
}

export const STAGES: readonly StageConfig[] = [
  { id: 1, gateHP: 300,   spawnInterval: 900,  enemyHpMult: 1.0,  enemySpeedMult: 1.0,  enemyDropCoins: 1,   gateLumpSum: 40,   heavyEvery: 0 },
  { id: 2, gateHP: 650,   spawnInterval: 800,  enemyHpMult: 1.15, enemySpeedMult: 1.05, enemyDropCoins: 2,   gateLumpSum: 80,   heavyEvery: 0 },
  { id: 3, gateHP: 2000,  spawnInterval: 700,  enemyHpMult: 1.7,  enemySpeedMult: 1.10, enemyDropCoins: 5,   gateLumpSum: 180,  heavyEvery: 8 },
  { id: 4, gateHP: 3500,  spawnInterval: 600,  enemyHpMult: 2.2,  enemySpeedMult: 1.15, enemyDropCoins: 10,  gateLumpSum: 400,  heavyEvery: 6 },
  { id: 5, gateHP: 5000,  spawnInterval: 500,  enemyHpMult: 2.8,  enemySpeedMult: 1.20, enemyDropCoins: 20,  gateLumpSum: 800,  heavyEvery: 5 },
  { id: 6, isBoss: true,  spawnInterval: 0,    enemyHpMult: 1.0,  enemySpeedMult: 1.0,  enemyDropCoins: 50,  gateLumpSum: 0,    heavyEvery: 0, bossHP: 10000, bossDropCoins: 50, clearBonus: 1500 },
] as const;

// Gate HP ratios relative to Gate 1 (for easy calibration)
export const GATE_HP_RATIOS = [1.0, 2.67, 6.67, 11.67, 16.67] as const;

export const GAME_CONFIG = {
  // ─────────────────────────────────────────────────────────────
  // CANVAS
  // ─────────────────────────────────────────────────────────────
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 640,
  
  // ─────────────────────────────────────────────────────────────
  // LAYOUT TUNING
  // ─────────────────────────────────────────────────────────────
  CART_X_OFFSET: 0,
  ENEMY_SCALE: 1,
  GROUND_Y_OFFSET: 180,
  UI_SAFE_BOTTOM_PX: 160,
  
  // ─────────────────────────────────────────────────────────────
  // CART (player tower)
  // ─────────────────────────────────────────────────────────────
  CART_X: 70,
  CART_WIDTH: 75,
  BLOCK_HEIGHT: 45,
  BLOCK_MAX_HP: 300,
  BLOCK_COUNT: 1,
  
  // ─────────────────────────────────────────────────────────────
  // ENEMIES
  // ─────────────────────────────────────────────────────────────
  ENEMY_WIDTH: 36,
  ENEMY_HEIGHT: 45,
  ENEMY_BASE_HP: 32,
  ENEMY_BASE_SPEED: 95,
  ENEMY_DAMAGE: 18,
  MAX_ENEMIES: 30,
  
  // ─────────────────────────────────────────────────────────────
  // SPAWNING (stage-based, no time ramp)
  // ─────────────────────────────────────────────────────────────
  MAX_ACTIVE_ENEMIES: 30,
  MIN_SPAWN_INTERVAL: 300,
  
  // ─────────────────────────────────────────────────────────────
  // COMBAT (auto-attack)
  // ─────────────────────────────────────────────────────────────
  AUTO_ATTACK_INTERVAL: 520,
  PROJECTILE_SPEED: 420,
  PROJECTILE_DAMAGE: 12,
  PROJECTILE_RADIUS: 2,
  
  // ─────────────────────────────────────────────────────────────
  // SKILL: Tonic Bomb + Power System (Uncapped)
  // ─────────────────────────────────────────────────────────────
  TONIC_BOMB_COST: 3,
  TONIC_BOMB_RADIUS: 110,
  TONIC_BOMB_DAMAGE: 28,
  POWER_POOL_SOFT_CAP: 999,       // Uncapped power pool
  POWER_START_REGEN: 0.20,         // Power/second base regen
  MAX_BOMB_CHARGES: 3,
  
  // ─────────────────────────────────────────────────────────────
  // GATE BUILDING SYSTEM (TDS-style HP objectives)
  // ─────────────────────────────────────────────────────────────
  GATE_BUILDING_X_OFFSET: 60,     // pixels from right edge of canvas
  GATE_BUILDING_WIDTH: 50,
  GATE_BUILDING_HEIGHT: 160,
  GATE_BREATHING_THRESHOLDS: [0.75, 0.50, 0.25] as readonly number[],
  GATE_BREATHING_SLOWDOWN_DURATION: 1.0,  // seconds
  GATE_BREATHING_SPAWN_MULT: 1.5,         // spawn interval multiplied during breathing
  GATE_CLEANUP_DURATION: 0.8,             // seconds for victory pulse + enemy fade
  
  // Post-Victory Breather (pacing window between gates)
  POST_VICTORY_BREATHER_DURATION: 4.0,    // seconds of running before next TRAVEL
  BREATHER_SPAWN_REDUCTION: 0.40,         // spawn at 40% rate (60% reduction)
  
  // ─────────────────────────────────────────────────────────────
  // TRAVEL (purely visual transition)
  // ─────────────────────────────────────────────────────────────
  TRAVEL_DURATION: 1.2,           // seconds (short, skippable)
  TRAVEL_DESPAWN_DELAY: 0.5,
  
  // ─────────────────────────────────────────────────────────────
  // TIPS & REWARDS (stage-based exponential)
  // ─────────────────────────────────────────────────────────────
  TIP_FLOAT_SPEED: 80,
  
  // ─────────────────────────────────────────────────────────────
  // SERVED ENEMY ANIMATION
  // ─────────────────────────────────────────────────────────────
  SERVED_EXIT_DURATION: 0.5,
  SERVED_EXIT_SPEED: 200,
  
  // ─────────────────────────────────────────────────────────────
  // LATCHED ENEMY SYSTEM (TDS-style panic)
  // ─────────────────────────────────────────────────────────────
  MAX_LATCHED_ENEMIES: 5,
  LATCHED_TICK_INTERVAL: 0.5,
  LATCHED_TICK_DAMAGE: 4,
  LATCHED_QUEUE_SPACING: 12,
  
  // ─────────────────────────────────────────────────────────────
  // PARTICLES & VFX
  // ─────────────────────────────────────────────────────────────
  MAX_PARTICLES: 100,
  
  // ─────────────────────────────────────────────────────────────
  // STAMINA SYSTEM (Energy - gates play sessions)
  // ─────────────────────────────────────────────────────────────
  ENERGY_MAX: 10,
  ENERGY_REGEN_MS: 1800000,
  
  // ─────────────────────────────────────────────────────────────
  // PIP / EVO UPGRADE SYSTEM (Phase 1)
  // ─────────────────────────────────────────────────────────────
  // Block upgrades: 3 pips → EVO choice, 2 EVOs → MAX
  BLOCK_PIP_PER_EVO: 3,
  BLOCK_MAX_EVOS: 2,
  BLOCK_PIP_BASE_COST: 30,        // cost for first pip
  BLOCK_PIP_COST_SCALING: 1.4,    // cost multiplier per pip
  
  // Weapon upgrades: 5 pips → EVO choice, repeating
  WEAPON_PIP_PER_EVO: 5,
  WEAPON_PIP_BASE_COST: 40,
  WEAPON_PIP_COST_SCALING: 1.3,
  
  // Star weapon upgrades: 5 pips → EVO, max E2 for Chapter 1 (10 pips total)
  STAR_PIP_PER_EVO: 5,
  STAR_PIP_BASE_COST: 250,
  STAR_PIP_COST_SCALING: 1.35,
  STAR_MAX_EVOS_CH1: 2,             // Chapter 1 cap: E2 (10 pips)
  STAR_DAMAGE_BONUS_PER_PIP: 0.10,  // +10% passive & throw damage per pip
  
  // Power regen upgrade pips
  POWER_PIP_PER_EVO: 3,
  POWER_PIP_BASE_COST: 35,
  POWER_PIP_COST_SCALING: 1.4,
  POWER_REGEN_BONUS_PER_PIP: 0.15,  // +15% per pip
  
  // Damage upgrade pips
  DAMAGE_PIP_PER_EVO: 3,
  DAMAGE_PIP_BASE_COST: 40,
  DAMAGE_PIP_COST_SCALING: 1.4,
  DAMAGE_BONUS_PER_PIP: 0.12,       // +12% per pip
  
  // Block count (cargo boxes)
  BLOCK_COUNT_MAX_LEVEL: 3,
  BLOCK_COUNT_BASE_COST: 30,
  
  // ─────────────────────────────────────────────────────────────
  // HEAVY ENEMY
  // ─────────────────────────────────────────────────────────────
  HEAVY_HP_MULT: 3.0,
  HEAVY_SPEED_MULT: 0.75,
  HEAVY_TICK_DAMAGE_MULT: 2.0,
  HEAVY_SIZE_MULT: 1.15,
  
  // ─────────────────────────────────────────────────────────────
  // BOSS (Phase 1: uses STAGES[5].bossHP)
  // ─────────────────────────────────────────────────────────────
  BOSS_SPEED_MULT: 0.6,
  BOSS_SIZE_MULT: 1.4,
  BOSS_TICK_DAMAGE_MULT: 3.0,
  BOSS_LATCH_SLOTS: 2,
  BOSS_ADD_SPAWN_INTERVAL: 0,
  BOSS_INCOMING_BANNER_DURATION: 1.5,
  
  // ─────────────────────────────────────────────────────────────
  // WEAPON ABILITIES (Phase 1: Saw full, Flame+Minigun ability-only)
  // ─────────────────────────────────────────────────────────────
  // Passive Saw (melee zone)
  SAW_PASSIVE_RADIUS: 65,          // px from cart front
  SAW_PASSIVE_TICK_INTERVAL: 0.40, // seconds between ticks (nerfed from 0.25)
  SAW_PASSIVE_TICK_DAMAGE: 2,      // damage per tick per enemy (nerfed from 5)
  
  // Active Saw Throw (power skill)
  SAW_THROW_COST: 5,               // Power cost
  SAW_THROW_DAMAGE: 80,            // damage per enemy hit (buffed from 50 for faster gate kills)
  SAW_THROW_SPEED: 200,            // px/s (nerfed from 240)
  SAW_THROW_LIFETIME: 0.7,         // seconds before despawn (nerfed from 0.9)
  SAW_THROW_RADIUS: 12,            // projectile hitbox radius
  
  // Star per-box (Garage purchase)
  STAR_PER_BOX_COST: 140,          // coins to unlock star per cargo box
  SAW_UNLOCK_COST: 140,            // legacy alias
  
  // Legacy (kept for compatibility)
  SAW_FIRE_RATE: 1200,
  SAW_DAMAGE: 8,
  SAW_ABILITY_COST: 4,
  SAW_ABILITY_DAMAGE: 25,
  
  FLAME_ABILITY_COST: 7,          // Power cost for Flame Burst
  FLAME_ABILITY_DAMAGE: 20,       // damage to all enemies on screen
  FLAME_GATE_DAMAGE_MULT: 0.5,   // partial gate damage (50%)
  
  MINIGUN_ABILITY_COST: 10,       // Power cost for Bullet Storm
  MINIGUN_BURST_COUNT: 15,        // projectiles in burst
  MINIGUN_BURST_DURATION: 2.0,    // seconds for full burst
  
  // ─────────────────────────────────────────────────────────────
  // WEAPON FIRING MODE (A/B: 'single' | 'shotgun')
  // ─────────────────────────────────────────────────────────────
  WEAPON_MODE: 'shotgun' as 'single' | 'shotgun',
  SHOTGUN_PELLETS: 6,
  SHOTGUN_SPREAD_DEG: 22,           // total cone in degrees (TDS-wide)
  SHOTGUN_SPREAD_DEG_MIN: 16,
  SHOTGUN_SPREAD_DEG_MAX: 32,
  SHOTGUN_SPREAD_DISTANCE_SCALE: 0.35, // spread widens with distance
  MUZZLE_Y_OFFSET: 75,                // px down from topBlock.y → flatter TDS-style shots
  SHOTGUN_DAMAGE_SPLIT: 'weighted_center' as 'equal' | 'weighted_center',
  
  // ─────────────────────────────────────────────────────────────
  // AIM VARIATION (TDS-style jitter + smart target selection)
  // ─────────────────────────────────────────────────────────────
  AIM_Y_JITTER: 10,                 // px random Y offset per burst
  AIM_Y_TILT: -2,                   // slight upward tilt (negative = up)
  CROWDING_THRESHOLD: 6,            // enemies near cart = "crowded"
  CROWDING_RANGE: 220,              // px from cart to count crowding
  // Target mode weights: [front, mid, back, gate]
  TARGET_WEIGHTS_CROWDED: [0.70, 0.20, 0.05, 0.05] as readonly number[],
  TARGET_WEIGHTS_NORMAL:  [0.50, 0.25, 0.17, 0.08] as readonly number[],
  
  // ─────────────────────────────────────────────────────────────
  // CHAPTER PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  CHAPTER_RESET_ENABLED: false,   // Feature flag for Chapter 2 reset (not active now)
  
  // ─────────────────────────────────────────────────────────────
  // TDS LOOP (generalized across all stages)
  // ─────────────────────────────────────────────────────────────
  APPROACH_DURATION: 1.0,               // gate slide-in time (all stages)
  GATE_START_X: 500,                    // off-screen right start position
  STAGE1_WAVE_SIZE: 3,                  // enemies per wave during siege (Stage 1 only)
  STAGE1_WAVE_BREATHER: 1.0,           // seconds pause between waves (Stage 1 only)
  STAGE2_WAVE_SIZE: 3,                  // enemies per wave during siege (Stage 2)
  STAGE2_WAVE_BREATHER: 0.8,           // seconds pause between waves (Stage 2)
} as const;

// Per-stage travel duration (seconds) — Stage 1 keeps 10s runner, others get 3.5-4.0s
export const TRAVEL_DURATION_BY_STAGE = [10, 14, 16, 18, 20] as const;

// Mini-rush config (Stage 2+ travel only)
// A burst of faster spawning mid-travel to create pressure spikes
export const MINI_RUSH_CONFIG = {
  ENABLED_FROM_STAGE: 2,        // mini-rush starts from stage 2 travel
  DURATION: 4.0,                // seconds of 2x spawn rate
  SPAWN_MULT: 0.5,              // spawn interval multiplied (0.5 = 2x faster)
  START_RATIO: 0.4,             // starts at 40% through travel (middle section)
} as const;

// Per-stage bomb silence duration (seconds) during SIEGE
export const BOMB_SILENCE_BY_STAGE = [1.5, 1.0, 0.6, 0.6, 0.6] as const;

// Colors (HSL values matching index.css)
export const COLORS = {
  // Coffee palette
  espresso: 'hsl(25, 50%, 20%)',
  darkRoast: 'hsl(25, 45%, 30%)',
  mediumRoast: 'hsl(30, 50%, 45%)',
  lightRoast: 'hsl(35, 55%, 60%)',
  cream: 'hsl(40, 60%, 85%)',
  foam: 'hsl(45, 50%, 95%)',
  
  // Accent
  warmOrange: 'hsl(25, 80%, 55%)',
  gold: 'hsl(45, 90%, 55%)',
  
  // UI
  energyBar: 'hsl(145, 60%, 45%)',
  hpBar: 'hsl(0, 70%, 55%)',
  hpBarBg: 'hsl(0, 20%, 30%)',
  
  // Enemy states
  sleepy: 'hsl(220, 10%, 60%)',
  awake: 'hsl(35, 70%, 60%)',
  
  // Effects
  sparkle: 'hsl(50, 100%, 70%)',
  heart: 'hsl(350, 80%, 60%)',
  steam: 'hsl(0, 0%, 90%)',
  
  // Gate Building
  gateBase: 'hsl(0, 40%, 35%)',
  gateDamaged: 'hsl(0, 50%, 45%)',
  gateCrumble: 'hsl(25, 30%, 50%)',
} as const;
