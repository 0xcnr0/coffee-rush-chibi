// Game Configuration Constants for Coffee Rush
// All speeds are in pixels/second, intervals are in milliseconds (ms)

export const GAME_CONFIG = {
  // ─────────────────────────────────────────────────────────────
  // CANVAS
  // ─────────────────────────────────────────────────────────────
  CANVAS_WIDTH: 360,           // pixels (9:16 portrait)
  CANVAS_HEIGHT: 640,          // pixels
  
  // ─────────────────────────────────────────────────────────────
  // LAYOUT TUNING (Phase 2C.8: ground/lane positioning)
  // ─────────────────────────────────────────────────────────────
  CART_X_OFFSET: 0,            // pixels - adjust cart position (Phase 2)
  ENEMY_SCALE: 1,              // multiplier - enemy size scaling (Phase 2)
  GROUND_Y_OFFSET: 180,        // pixels from canvas bottom to ground line (lane)
  UI_SAFE_BOTTOM_PX: 160,      // pixels reserved for bottom UI (PLAY button, footer)
  
  // ─────────────────────────────────────────────────────────────
  // CART (player tower)
  // ─────────────────────────────────────────────────────────────
  CART_X: 70,                  // pixels from left edge (Phase 2C.8.2: moved right for HP tiles)
  CART_WIDTH: 75,              // pixels (v3.3: slightly smaller)
  BLOCK_HEIGHT: 45,            // pixels per block (v3.3: proportional)
  BLOCK_MAX_HP: 380,           // HP per block (Phase B: +15% for 0-upgrade survivability)
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
  BASE_SPAWN_INTERVAL: 750,    // ms between spawns (Phase A.2: +15% for lighter pressure)
  MIN_SPAWN_INTERVAL: 300,     // ms - floor to prevent overload (Phase A.2: +15%)
  
  // v3.2: Warmup period before first Rush
  EARLY_GAME_SECONDS: 22,      // warmup duration in seconds (Phase B: extended for comfort)
  EARLY_BASE_SPAWN_INTERVAL: 1100, // ms - relaxed spawning during warmup (Phase A.2: +15%)
  
  // ─────────────────────────────────────────────────────────────
  // COMBAT (auto-attack)
  // ─────────────────────────────────────────────────────────────
  AUTO_ATTACK_INTERVAL: 520,   // ms between espresso shots (v3: ~10% faster)
  PROJECTILE_SPEED: 420,       // pixels/second (+40% from 300)
  PROJECTILE_DAMAGE: 12,       // damage per hit
  PROJECTILE_RADIUS: 8,        // pixels - hitbox radius
  
  // ─────────────────────────────────────────────────────────────
  // SKILL: Tonic Bomb + Power System (TDS-style)
  // Power meter fills over time; skills consume Power charges
  // ─────────────────────────────────────────────────────────────
  TONIC_BOMB_COST: 3,          // power cost per bomb (Phase A tuning: +1 to reduce bomb spam)
  TONIC_BOMB_RADIUS: 110,      // pixels - AoE radius (v3: +10%)
  TONIC_BOMB_DAMAGE: 28,       // damage to enemies in radius (v3: +10%)
  MAX_POWER: 4,                // maximum power capacity (was MAX_ENERGY)
  POWER_REGEN_RATE: 0.5,       // power/second (was ENERGY_REGEN_RATE)
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
  RUSH_SPAWN_MULTIPLIER: 2.3,  // spawn rate multiplier during rush (Phase A.2: 2.8→2.3)
  RUSH_SPEED_MULTIPLIER: 1.25, // +25% enemy speed during rush (v3)
  
  // ─────────────────────────────────────────────────────────────
  // TIPS & REWARDS (Phase 2E: Economy balancing)
  // ─────────────────────────────────────────────────────────────
  // ECONOMY TARGETS (documentation):
  // - Early death (CP1, ~25-35s): 50-80 beans
  // - CP2 reached: 120-170 beans
  // - Boss reached but died: 180-240 beans
  // - Boss defeated: 220-300 beans
  // - Boss clear in ~6-10 runs, full max in ~12-18 runs
  // ─────────────────────────────────────────────────────────────
  TIP_VALUE: 2,                // beans per tip (v5: Balanced-B)
  BOSS_TIP_MULTIPLIER: 3,      // boss drops 3 tips × 2 beans = 6 beans
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
  // STAMINA SYSTEM (Energy - gates play sessions)
  // ─────────────────────────────────────────────────────────────
  ENERGY_MAX: 10,                  // Maximum stamina
  ENERGY_REGEN_MS: 1800000,        // 30 minutes in milliseconds
  
  // ─────────────────────────────────────────────────────────────
  // UPGRADES (Phase 2B-3: TDS-like balance - short caps, meaningful bonuses)
  // ─────────────────────────────────────────────────────────────
  // Balance Targets:
  // - 0 upgrades: Rush1 is barely survivable / often fail
  // - With Cargo Box L1 OR TowerHP L1: Rush1 is consistently survivable
  // - Chapter boss clear requires ~Box L2 + (HP or Damage) L2
  // ─────────────────────────────────────────────────────────────
  UPGRADE_MAX_LEVEL: 3,            // max level for each upgrade (TDS-style)
  UPGRADE_COST_SCALING: 1.50,      // cost multiplier per level (Phase B: smoother progression)
  
  // Tower Reinforcement - increases BLOCK_MAX_HP
  // Meaningful: +30% per level (Lv3 = +90%)
  TOWER_HP_BONUS_PER_LEVEL: 0.30,  // +30% per level
  TOWER_HP_BASE_COST: 80,          // beans (Phase B: first upgrade in ~2 runs)
  MAX_BLOCK_HP_MULTIPLIER: 2.0,    // cap for blockHpMultiplier
  
  // Espresso Mastery - increases PROJECTILE_DAMAGE
  // Meaningful: +25% per level (Lv3 = +75%)
  ESPRESSO_BONUS_PER_LEVEL: 0.25,  // +25% per level
  ESPRESSO_BASE_COST: 80,          // beans (Phase B: first upgrade in ~2 runs)
  MAX_DAMAGE_MULTIPLIER: 1.80,     // cap for damageMultiplier
  
  // Caffeine Flow - increases POWER_REGEN_RATE
  // Noticeable: +22% per level (Lv3 = +66%)
  POWER_BONUS_PER_LEVEL: 0.22,     // +22% per level (was ENERGY_BONUS_PER_LEVEL)
  POWER_BASE_COST: 70,             // beans (Phase B: cheapest for bomb spam)
  MAX_POWER_MULTIPLIER: 1.70,      // cap for powerRegenMultiplier
  // ─────────────────────────────────────────────────────────────
  // BLOCK PROGRESSION (Phase 1.7) - First recommended upgrade
  // ─────────────────────────────────────────────────────────────
  BLOCK_COUNT_MAX_LEVEL: 2,        // 0→1→2 (gives 1→2→3 blocks)
  BLOCK_COUNT_BASE_COST: 100,      // beans (Phase B: cargo box slightly pricier)
  
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
  CHAPTER1_BOSS_CHECKPOINT: 3,     // Boss spawns after 3 checkpoints (60s) - LEGACY (used when ENABLE_GATE_CHAPTER_FLOW = false)
  CHECKPOINT_SECONDS: 20,          // Seconds per checkpoint segment
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 3A: SEGMENTED CHAPTER FLOW (TDS-style TRAVEL → FIGHT → PICK → BOSS)
  // ─────────────────────────────────────────────────────────────
  ENABLE_GATE_CHAPTER_FLOW: true,  // Feature flag (set to false to use legacy time-based system)
  
  // Travel phase
  TRAVEL_DURATION: 5,              // seconds between gates (Phase A tuning: +1s pacing)
  TRAVEL_DESPAWN_DELAY: 0.5,       // seconds to fade-out remaining enemies during travel
  
  // Gate kill targets (Phase A tuning: 15-run boss clear target)
  GATE_1_KILL_TARGET: 18,          // Phase B: faster G1 clear
  GATE_2_KILL_TARGET: 26,          // Phase B: more accessible G2
  GATE_3_KILL_TARGET: 34,          // Phase B: challenge but not extreme
  
  // Pick overlay
  PICK_CARDS_OFFERED: 3,
  
  // Run buff definitions (run-only, reset after each run)
  // Phase A tuning: Hot Shot 1.10, Repair nerfed 30%→18%, bomb_charge removed
  RUN_BUFF_POOL: [
    { type: 'damage', name: 'Hot Shot', icon: '🔥', description: '+10% damage', value: 1.10 },
    { type: 'block_hp', name: 'Steel Brew', icon: '🛡️', description: '+20% block HP', value: 1.20 },
    { type: 'power_regen', name: 'Quick Refill', icon: '⚡', description: '+25% power regen', value: 1.25 },
    { type: 'attack_speed', name: 'Caffeine Rush', icon: '☕', description: '+10% attack speed', value: 0.90 },
    { type: 'repair', name: 'Repair Kit', icon: '🔧', description: 'Heal 12% HP', value: 0.12 },
  ] as const,
  
  // Boss stats
  BOSS_HP: 990,                    // High HP pool (Phase A tuning: -10% for faster kill @ run 11-12)
  BOSS_SPEED_MULT: 0.6,            // 60% of normal speed
  BOSS_SIZE_MULT: 1.4,             // 40% larger than normal
  BOSS_TICK_DAMAGE_MULT: 3.0,      // 3x latched tick damage
  BOSS_LATCH_SLOTS: 2,             // Counts as 2 latched slots
  BOSS_ADD_SPAWN_INTERVAL: 0,      // No add spawns during Chapter 1 boss (1v1 fight)
  BOSS_INCOMING_BANNER_DURATION: 1.5, // Seconds to show "BOSS INCOMING" banner
  CHAPTER_CLEAR_BONUS_BEANS: 5,    // Bonus beans for clearing chapter (Phase A tuning: halved)
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
