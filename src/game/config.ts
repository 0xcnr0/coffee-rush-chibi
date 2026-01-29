// Game Configuration Constants for Coffee Rush
// All speeds are in pixels/second, intervals are in milliseconds (ms)

export const GAME_CONFIG = {
  // ─────────────────────────────────────────────────────────────
  // CANVAS
  // ─────────────────────────────────────────────────────────────
  CANVAS_WIDTH: 360,           // pixels (9:16 portrait)
  CANVAS_HEIGHT: 640,          // pixels
  
  // ─────────────────────────────────────────────────────────────
  // LAYOUT TUNING (Phase 1.8: placeholders for Phase 2 tweaks)
  // ─────────────────────────────────────────────────────────────
  CART_X_OFFSET: 0,            // pixels - adjust cart position (Phase 2)
  ENEMY_SCALE: 1,              // multiplier - enemy size scaling (Phase 2)
  
  // ─────────────────────────────────────────────────────────────
  // CART (player tower)
  // ─────────────────────────────────────────────────────────────
  CART_X: 30,                  // pixels from left edge (v3.3: moved left for longer approach)
  CART_WIDTH: 75,              // pixels (v3.3: slightly smaller)
  BLOCK_HEIGHT: 45,            // pixels per block (v3.3: proportional)
  BLOCK_MAX_HP: 330,           // HP per block (v3.2: +10% for single block survivability)
  BLOCK_COUNT: 1,              // number of stacked blocks (v3.1: start with 1)
  
  // ─────────────────────────────────────────────────────────────
  // ENEMIES
  // ─────────────────────────────────────────────────────────────
  ENEMY_WIDTH: 36,             // pixels (v3.3: -10% for crowd feel)
  ENEMY_HEIGHT: 45,            // pixels (v3.3: -10% for crowd feel)
  ENEMY_BASE_HP: 32,           // HP at difficulty level 0 (v3.1: reduced for single block)
  ENEMY_BASE_SPEED: 95,        // pixels/second (v3: very aggressive)
  ENEMY_DAMAGE: 18,            // damage dealt to cart block on contact (v3.2: reduced for fairness)
  MAX_ENEMIES: 30,             // hard cap for performance
  
  // ─────────────────────────────────────────────────────────────
  // SPAWNING
  // ─────────────────────────────────────────────────────────────
  BASE_SPAWN_INTERVAL: 650,    // ms between spawns (v3: heavy post-warmup)
  MIN_SPAWN_INTERVAL: 260,     // ms - floor to prevent overload
  
  // v3.2: Warmup period before first Rush
  EARLY_GAME_SECONDS: 18,      // warmup duration in seconds
  EARLY_BASE_SPAWN_INTERVAL: 950, // ms - relaxed spawning during warmup
  
  // ─────────────────────────────────────────────────────────────
  // COMBAT (auto-attack)
  // ─────────────────────────────────────────────────────────────
  AUTO_ATTACK_INTERVAL: 520,   // ms between espresso shots (v3: ~10% faster)
  PROJECTILE_SPEED: 420,       // pixels/second (+40% from 300)
  PROJECTILE_DAMAGE: 12,       // damage per hit
  PROJECTILE_RADIUS: 8,        // pixels - hitbox radius
  
  // ─────────────────────────────────────────────────────────────
  // SKILL: Tonic Bomb
  // ─────────────────────────────────────────────────────────────
  TONIC_BOMB_COST: 2,          // energy cost
  TONIC_BOMB_RADIUS: 110,      // pixels - AoE radius (v3: +10%)
  TONIC_BOMB_DAMAGE: 28,       // damage to enemies in radius (v3: +10%)
  MAX_ENERGY: 4,               // maximum energy capacity
  ENERGY_REGEN_RATE: 0.5,      // energy/second
  MAX_BOMB_CHARGES: 3,         // cap bomb stacking to prevent spam (Phase 2D)
  
  // ─────────────────────────────────────────────────────────────
  // DIFFICULTY RAMP (every 20 seconds, cumulative - v3 aggressive)
  // ─────────────────────────────────────────────────────────────
  DIFFICULTY_INTERVAL: 20,     // seconds between ramp-ups
  SPAWN_RATE_INCREASE: 0.22,   // +22% faster spawning per level
  ENEMY_HP_INCREASE: 0.14,     // +14% more HP per level
  ENEMY_SPEED_INCREASE: 0.08,  // +8% faster movement per level
  
  // ─────────────────────────────────────────────────────────────
  // MORNING RUSH (v3: real panic mode)
  // ─────────────────────────────────────────────────────────────
  RUSH_DURATION: 9,            // seconds (longer panic window)
  RUSH_SPAWN_MULTIPLIER: 2.8,  // spawn rate multiplier during rush
  RUSH_SPEED_MULTIPLIER: 1.25, // +25% enemy speed during rush (v3)
  
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
  // LATCHED ENEMY SYSTEM (TDS-style panic)
  // ─────────────────────────────────────────────────────────────
  MAX_LATCHED_ENEMIES: 5,        // normal max attackers at cart
  RUSH_LATCHED_BONUS: 2,         // extra slots during Rush (total 7)
  LATCHED_TICK_INTERVAL: 0.5,    // seconds between damage ticks
  LATCHED_TICK_DAMAGE: 4,        // damage per tick (stacks with multiple)
  LATCHED_QUEUE_SPACING: 12,     // pixels between queued enemies (v3.3: clearer queue)
  
  // ─────────────────────────────────────────────────────────────
  // POST-RUSH RECOVERY (gradual ramp-up instead of hard pause)
  // ─────────────────────────────────────────────────────────────
  POST_RUSH_RECOVERY_DURATION: 8, // seconds of gradual spawn ramp-up after Rush
  POST_RUSH_SPAWN_MULT_START: 0.3, // spawn rate multiplier at start of recovery (30%)
  POST_RUSH_SPAWN_MULT_END: 1.0,   // spawn rate multiplier at end of recovery (100%)
  
  // ─────────────────────────────────────────────────────────────
  // PARTICLES & VFX
  // ─────────────────────────────────────────────────────────────
  MAX_PARTICLES: 100,          // hard cap for performance
  
  // ─────────────────────────────────────────────────────────────
  // UPGRADES (Phase 2B-3: TDS-like balance - short caps, meaningful bonuses)
  // ─────────────────────────────────────────────────────────────
  // Balance Targets:
  // - 0 upgrades: Rush1 is barely survivable / often fail
  // - With Cargo Box L1 OR TowerHP L1: Rush1 is consistently survivable
  // - Chapter boss clear requires ~Box L2 + (HP or Damage) L2
  // ─────────────────────────────────────────────────────────────
  UPGRADE_MAX_LEVEL: 3,            // max level for each upgrade (TDS-style)
  
  // Tower Reinforcement - increases BLOCK_MAX_HP
  // Meaningful: +30% per level (Lv3 = +90%)
  TOWER_HP_BONUS_PER_LEVEL: 0.30,  // +30% per level
  TOWER_HP_BASE_COST: 35,          // beans (L1: 35, L2: ~44, L3: ~55)
  MAX_BLOCK_HP_MULTIPLIER: 2.0,    // cap for blockHpMultiplier
  
  // Espresso Mastery - increases PROJECTILE_DAMAGE
  // Meaningful: +25% per level (Lv3 = +75%)
  ESPRESSO_BONUS_PER_LEVEL: 0.25,  // +25% per level
  ESPRESSO_BASE_COST: 35,          // beans (L1: 35, L2: ~44, L3: ~55)
  MAX_DAMAGE_MULTIPLIER: 1.80,     // cap for damageMultiplier
  
  // Caffeine Flow - increases ENERGY_REGEN_RATE
  // Noticeable: +22% per level (Lv3 = +66%)
  ENERGY_BONUS_PER_LEVEL: 0.22,    // +22% per level
  ENERGY_BASE_COST: 25,            // beans (L1: 25, L2: ~31, L3: ~39)
  MAX_ENERGY_MULTIPLIER: 1.70,     // cap for energyRegenMultiplier
  
  // ─────────────────────────────────────────────────────────────
  // BLOCK PROGRESSION (Phase 1.7) - First recommended upgrade
  // ─────────────────────────────────────────────────────────────
  BLOCK_COUNT_MAX_LEVEL: 2,        // 0→1→2 (gives 1→2→3 blocks)
  BLOCK_COUNT_BASE_COST: 30,       // beans (L1: 30, L2: ~38) - affordable after 1-2 short runs
  
  // ─────────────────────────────────────────────────────────────
  // HEAVY ENEMY (Phase 2B-1: mini-boss style)
  // ─────────────────────────────────────────────────────────────
  HEAVY_SPAWN_EVERY: 7,            // every 7 spawns, 1 heavy
  HEAVY_RUSH_SPAWN_EVERY: 4,       // during Rush, every 4 spawns, 1 heavy
  HEAVY_HP_MULT: 3.0,              // 3x HP of normal enemies
  HEAVY_SPEED_MULT: 0.75,          // 75% speed of normal enemies
  HEAVY_TICK_DAMAGE_MULT: 2.0,     // 2x latched tick damage
  HEAVY_SIZE_MULT: 1.15,           // 15% larger visually
  
  // ─────────────────────────────────────────────────────────────
  // CHAPTER MODE + BOSS (Phase 2B-2: TDS-style win condition)
  // ─────────────────────────────────────────────────────────────
  CHAPTER1_BOSS_CHECKPOINT: 3,     // Boss spawns after 3 checkpoints (60s)
  CHECKPOINT_SECONDS: 20,          // Seconds per checkpoint segment
  
  // Boss stats
  BOSS_HP: 600,                    // High HP pool (tunable)
  BOSS_SPEED_MULT: 0.6,            // 60% of normal speed
  BOSS_SIZE_MULT: 1.4,             // 40% larger than normal
  BOSS_TICK_DAMAGE_MULT: 3.0,      // 3x latched tick damage
  BOSS_LATCH_SLOTS: 2,             // Counts as 2 latched slots
  BOSS_ADD_SPAWN_INTERVAL: 0,      // No add spawns during Chapter 1 boss (1v1 fight)
  BOSS_INCOMING_BANNER_DURATION: 1.5, // Seconds to show "BOSS INCOMING" banner
  CHAPTER_CLEAR_BONUS_BEANS: 50,   // Bonus beans for clearing chapter
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
