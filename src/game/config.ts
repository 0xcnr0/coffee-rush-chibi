// Game Configuration Constants for Coffee Rush
// All speeds are in pixels/second, intervals are in milliseconds (ms)

export const GAME_CONFIG = {
  // ─────────────────────────────────────────────────────────────
  // CANVAS
  // ─────────────────────────────────────────────────────────────
  CANVAS_WIDTH: 360,           // pixels (9:16 portrait)
  CANVAS_HEIGHT: 640,          // pixels
  
  // ─────────────────────────────────────────────────────────────
  // CART (player tower)
  // ─────────────────────────────────────────────────────────────
  CART_X: 60,                  // pixels from left edge
  CART_WIDTH: 80,              // pixels
  BLOCK_HEIGHT: 50,            // pixels per block
  BLOCK_MAX_HP: 100,           // HP per block
  BLOCK_COUNT: 3,              // number of stacked blocks
  
  // ─────────────────────────────────────────────────────────────
  // ENEMIES
  // ─────────────────────────────────────────────────────────────
  ENEMY_WIDTH: 40,             // pixels
  ENEMY_HEIGHT: 50,            // pixels
  ENEMY_BASE_HP: 30,           // HP at difficulty level 0
  ENEMY_BASE_SPEED: 70,        // pixels/second (+75% from 40, snappier early game)
  ENEMY_DAMAGE: 15,            // damage dealt to cart block on contact
  MAX_ENEMIES: 30,             // hard cap for performance
  
  // ─────────────────────────────────────────────────────────────
  // SPAWNING
  // ─────────────────────────────────────────────────────────────
  BASE_SPAWN_INTERVAL: 1400,   // ms between spawns (faster early pressure)
  MIN_SPAWN_INTERVAL: 400,     // ms - floor to prevent overload
  
  // ─────────────────────────────────────────────────────────────
  // COMBAT (auto-attack)
  // ─────────────────────────────────────────────────────────────
  AUTO_ATTACK_INTERVAL: 640,   // ms between espresso shots (~20% faster)
  PROJECTILE_SPEED: 420,       // pixels/second (+40% from 300)
  PROJECTILE_DAMAGE: 12,       // damage per hit
  PROJECTILE_RADIUS: 8,        // pixels - hitbox radius
  
  // ─────────────────────────────────────────────────────────────
  // SKILL: Tonic Bomb
  // ─────────────────────────────────────────────────────────────
  TONIC_BOMB_COST: 2,          // energy cost
  TONIC_BOMB_RADIUS: 100,      // pixels - AoE radius
  TONIC_BOMB_DAMAGE: 25,       // damage to enemies in radius
  MAX_ENERGY: 4,               // maximum energy capacity
  ENERGY_REGEN_RATE: 0.5,      // energy/second
  
  // ─────────────────────────────────────────────────────────────
  // DIFFICULTY RAMP (every 30 seconds, cumulative)
  // ─────────────────────────────────────────────────────────────
  DIFFICULTY_INTERVAL: 30,     // seconds between ramp-ups
  SPAWN_RATE_INCREASE: 0.08,   // +8% faster spawning per level
  ENEMY_HP_INCREASE: 0.05,     // +5% more HP per level
  ENEMY_SPEED_INCREASE: 0.01,  // +1% faster movement per level (subtle)
  
  // ─────────────────────────────────────────────────────────────
  // MORNING RUSH (temporary spawn spike)
  // ─────────────────────────────────────────────────────────────
  RUSH_DURATION: 6,            // seconds
  RUSH_SPAWN_MULTIPLIER: 1.8,  // spawn rate multiplier during rush
  
  // ─────────────────────────────────────────────────────────────
  // TIPS & REWARDS
  // ─────────────────────────────────────────────────────────────
  TIP_VALUE: 5,                // points per tip
  TIP_FLOAT_SPEED: 80,         // pixels/second - float animation
  
  // ─────────────────────────────────────────────────────────────
  // SERVED ENEMY ANIMATION
  // ─────────────────────────────────────────────────────────────
  SERVED_EXIT_DURATION: 0.5,   // seconds before despawn
  SERVED_EXIT_SPEED: 200,      // pixels/second - happy exit speed
  
  // ─────────────────────────────────────────────────────────────
  // PARTICLES & VFX
  // ─────────────────────────────────────────────────────────────
  MAX_PARTICLES: 100,          // hard cap for performance
  
  // ─────────────────────────────────────────────────────────────
  // UPGRADES (Phase 1 Progression)
  // ─────────────────────────────────────────────────────────────
  UPGRADE_MAX_LEVEL: 20,       // max level for each upgrade
  
  // Tower Reinforcement - increases BLOCK_MAX_HP
  TOWER_HP_BONUS_PER_LEVEL: 0.06,  // +6% per level (max +120%)
  TOWER_HP_BASE_COST: 10,          // beans
  
  // Espresso Mastery - increases PROJECTILE_DAMAGE
  ESPRESSO_BONUS_PER_LEVEL: 0.05,  // +5% per level (max +100%)
  ESPRESSO_BASE_COST: 15,          // beans
  
  // Caffeine Flow - increases ENERGY_REGEN_RATE
  ENERGY_BONUS_PER_LEVEL: 0.05,    // +5% per level (max +100%)
  ENERGY_BASE_COST: 12,            // beans
} as const;

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
  sleepy: 'hsl(220, 10%, 60%)', // desaturated gray
  awake: 'hsl(35, 70%, 60%)', // warm happy color
  
  // Effects
  sparkle: 'hsl(50, 100%, 70%)',
  heart: 'hsl(350, 80%, 60%)',
  steam: 'hsl(0, 0%, 90%)',
} as const;
