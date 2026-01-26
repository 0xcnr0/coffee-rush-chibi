// Game Configuration Constants for Coffee Rush

export const GAME_CONFIG = {
  // Canvas dimensions (9:16 portrait)
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 640,
  
  // Cart configuration
  CART_X: 60,
  CART_WIDTH: 80,
  BLOCK_HEIGHT: 50,
  BLOCK_MAX_HP: 100,
  BLOCK_COUNT: 3,
  
  // Enemy configuration
  ENEMY_WIDTH: 40,
  ENEMY_HEIGHT: 50,
  ENEMY_BASE_HP: 30,
  ENEMY_BASE_SPEED: 40, // pixels per second
  ENEMY_DAMAGE: 15, // damage to cart block
  MAX_ENEMIES: 30, // hard cap
  
  // Spawning
  BASE_SPAWN_INTERVAL: 2000, // ms between spawns
  MIN_SPAWN_INTERVAL: 400, // minimum interval
  
  // Combat
  AUTO_ATTACK_INTERVAL: 800, // ms between auto attacks
  PROJECTILE_SPEED: 300, // pixels per second
  PROJECTILE_DAMAGE: 12,
  PROJECTILE_RADIUS: 8,
  
  // Skill
  TONIC_BOMB_COST: 2,
  TONIC_BOMB_RADIUS: 100,
  TONIC_BOMB_DAMAGE: 25,
  MAX_ENERGY: 4,
  ENERGY_REGEN_RATE: 0.5, // energy per second
  
  // Difficulty ramp (every 30 seconds)
  DIFFICULTY_INTERVAL: 30, // seconds
  SPAWN_RATE_INCREASE: 0.10, // 10% faster spawning
  ENEMY_HP_INCREASE: 0.06, // 6% more HP
  ENEMY_SPEED_INCREASE: 0.03, // 3% faster
  
  // Morning Rush
  RUSH_DURATION: 7, // seconds
  RUSH_SPAWN_MULTIPLIER: 1.8,
  
  // Tips
  TIP_VALUE: 5,
  TIP_FLOAT_SPEED: 80, // pixels per second
  
  // Served enemy animation
  SERVED_EXIT_DURATION: 0.5, // seconds
  SERVED_EXIT_SPEED: 200, // pixels per second
  
  // Particles
  MAX_PARTICLES: 100,
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
