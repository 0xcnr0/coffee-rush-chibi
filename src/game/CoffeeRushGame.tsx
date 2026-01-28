import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GAME_CONFIG, COLORS } from './config';
import { drawGame } from './renderer';
import { useGameLoop } from './useGameLoop';
import { useObjectPool } from './useObjectPool';
import { GarageScreen } from './GarageScreen';
import { EndScreen } from './EndScreen';
import { GameHUD } from './GameHUD';
import { DebugHUD } from './DebugHUD';
import { 
  loadProgression, 
  updateBestRecords, 
  getUpgradeMultiplier 
} from './persistence';
import type { 
  GameState, 
  CartBlock, 
  Enemy, 
  Projectile, 
  TipDrop, 
  Particle, 
  GameStats,
  DifficultyState 
} from './types';

const createEnemy = (id: number): Enemy => ({
  id,
  x: 0,
  y: 0,
  hp: GAME_CONFIG.ENEMY_BASE_HP,
  maxHp: GAME_CONFIG.ENEMY_BASE_HP,
  speed: GAME_CONFIG.ENEMY_BASE_SPEED,
  width: GAME_CONFIG.ENEMY_WIDTH,
  height: GAME_CONFIG.ENEMY_HEIGHT,
  active: false,
  isServed: false,
  servedTimer: 0,
  animationFrame: 0,
  state: 'WALKING',
  latchedTimer: 0,
  queuePosition: 0,
});

const createProjectile = (id: number): Projectile => ({
  id,
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  speed: GAME_CONFIG.PROJECTILE_SPEED,
  damage: GAME_CONFIG.PROJECTILE_DAMAGE,
  active: false,
  radius: GAME_CONFIG.PROJECTILE_RADIUS,
});

const createTip = (id: number): TipDrop => ({
  id,
  x: 0,
  y: 0,
  targetY: 0,
  value: GAME_CONFIG.TIP_VALUE,
  active: false,
  opacity: 1,
});

const createParticle = (id: number): Particle => ({
  id,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  maxLife: 1,
  color: COLORS.sparkle,
  size: 5,
  type: 'sparkle',
  active: false,
});

export const CoffeeRushGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>({ timeSurvived: 0, customersServed: 0, totalTips: 0, beansEarned: 0, isNewRecord: false });
  const [energy, setEnergy] = useState<number>(0); // Phase 1.6A: Start at 0 (TDS pacing)
  const [tips, setTips] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [isStressTest, setIsStressTest] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    fps: number;
    minFps: number;
    activeEnemies: number;
    maxActiveEnemiesSeen: number;
    effectiveSpawnInterval: number;
    effectiveBlockHp: number;
    latchedCount: number;
    breatherTimer: number;
  }>({
    fps: 60,
    minFps: 60,
    activeEnemies: 0,
    maxActiveEnemiesSeen: 0,
    effectiveSpawnInterval: GAME_CONFIG.BASE_SPAWN_INTERVAL,
    effectiveBlockHp: GAME_CONFIG.BLOCK_MAX_HP,
    latchedCount: 0,
    breatherTimer: 0,
  });
  
  // Stress test tracking refs
  const minFpsRef = useRef(60);
  const fpsHistoryRef = useRef<number[]>([]);
  const maxActiveEnemiesSeenRef = useRef(0);
  // Game state refs (for game loop access without re-renders)
  const blocksRef = useRef<CartBlock[]>([]);
  const difficultyRef = useRef<DifficultyState>({
    level: 0,
    spawnRateMultiplier: 1,
    enemyHpMultiplier: 1,
    enemySpeedMultiplier: 1,
    isMorningRush: false,
    rushTimer: 0,
    breatherTimer: 0,
  });
  const latchedCountRef = useRef(0); // Track latched enemies for TDS panic system
  const screenShakeRef = useRef({ x: 0, y: 0, duration: 0 });
  const lastAttackRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const energyRef = useRef<number>(0); // Phase 1.6A: Start at 0 (TDS pacing)
  const timeRef = useRef(0);
  const tipsRef = useRef(0);
  const customersServedRef = useRef(0);
  const damageMultiplierRef = useRef(1);
  const energyRegenMultiplierRef = useRef(1);
  const hudAccumulatorRef = useRef(0); // HUD throttle accumulator
  const fpsRef = useRef(60); // Smoothed FPS
  const effectiveBlockHpRef = useRef<number>(GAME_CONFIG.BLOCK_MAX_HP); // Store for debug
  // Object pools
  const enemyPool = useObjectPool(createEnemy, GAME_CONFIG.MAX_ENEMIES);
  const projectilePool = useObjectPool(createProjectile, 50);
  const tipPool = useObjectPool(createTip, 30);
  const particlePool = useObjectPool(createParticle, GAME_CONFIG.MAX_PARTICLES);
  
  const initGame = useCallback(() => {
    // Load progression and apply upgrade multipliers
    const progression = loadProgression();
    const { upgradeLevels } = progression;
    
    // Calculate multipliers with caps (v3: prevent infinite runs)
    const blockHpMultiplier = Math.min(
      getUpgradeMultiplier(upgradeLevels.towerHpLevel, GAME_CONFIG.TOWER_HP_BONUS_PER_LEVEL),
      GAME_CONFIG.MAX_BLOCK_HP_MULTIPLIER
    );
    const damageMultiplier = Math.min(
      getUpgradeMultiplier(upgradeLevels.espressoDamageLevel, GAME_CONFIG.ESPRESSO_BONUS_PER_LEVEL),
      GAME_CONFIG.MAX_DAMAGE_MULTIPLIER
    );
    const energyRegenMultiplier = Math.min(
      getUpgradeMultiplier(upgradeLevels.energyRegenLevel, GAME_CONFIG.ENERGY_BONUS_PER_LEVEL),
      GAME_CONFIG.MAX_ENERGY_MULTIPLIER
    );
    
    // Apply multipliers to effective values (stored in refs)
    const effectiveBlockHp = Math.floor(GAME_CONFIG.BLOCK_MAX_HP * blockHpMultiplier);
    effectiveBlockHpRef.current = effectiveBlockHp; // Store for debug
    
    // Phase 1.7: Calculate block count from upgrade level
    const blockCount = 1 + (upgradeLevels.blockCountLevel ?? 0); // 1, 2, or 3
    
    // Reset blocks with upgraded HP
    const groundY = GAME_CONFIG.CANVAS_HEIGHT - 80;
    blocksRef.current = Array.from({ length: blockCount }, (_, i) => ({
      id: i,
      hp: effectiveBlockHp,
      maxHp: effectiveBlockHp,
      y: groundY - 30 - (i + 1) * GAME_CONFIG.BLOCK_HEIGHT,
      height: GAME_CONFIG.BLOCK_HEIGHT,
      destroyed: false,
    }));
    
    // Store multipliers for use in game loop
    damageMultiplierRef.current = damageMultiplier;
    energyRegenMultiplierRef.current = energyRegenMultiplier;
    
    // Reset difficulty
    difficultyRef.current = {
      level: 0,
      spawnRateMultiplier: 1,
      enemyHpMultiplier: 1,
      enemySpeedMultiplier: 1,
      isMorningRush: false,
      rushTimer: 0,
      breatherTimer: 0,
    };
    
    // Reset latched count
    latchedCountRef.current = 0;
    
    // Reset refs
    screenShakeRef.current = { x: 0, y: 0, duration: 0 };
    lastAttackRef.current = 0;
    lastSpawnRef.current = 0;
    energyRef.current = 0; // Phase 1.6A: Start at 0 (TDS pacing)
    timeRef.current = 0;
    tipsRef.current = 0;
    customersServedRef.current = 0;
    
    // Reset stress test tracking
    minFpsRef.current = 60;
    fpsHistoryRef.current = [];
    maxActiveEnemiesSeenRef.current = 0;
    
    // Clear pools
    enemyPool.clear();
    projectilePool.clear();
    tipPool.clear();
    particlePool.clear();
    
    // Reset state
    setEnergy(0); // Phase 1.6A: Start at 0 (TDS pacing)
    setTips(0);
    setTimeSurvived(0);
  }, [enemyPool, projectilePool, tipPool, particlePool]);
  
  const handlePlay = useCallback(() => {
    initGame();
    setGameState('PLAY');
  }, [initGame]);
  
  const handleGameOver = useCallback(() => {
    // Update records and earn beans
    const { isNewTimeRecord, beansEarned } = updateBestRecords(
      timeRef.current,
      customersServedRef.current,
      tipsRef.current
    );
    
    setStats({
      timeSurvived: timeRef.current,
      customersServed: customersServedRef.current,
      totalTips: tipsRef.current,
      beansEarned,
      isNewRecord: isNewTimeRecord,
    });
    setGameState('END');
  }, []);
  
  const handleHome = useCallback(() => {
    setGameState('MENU');
  }, []);
  
  // Phase 1.6B: handleUpgrades removed - upgrades now on GarageScreen
  
  const spawnEnemy = useCallback(() => {
    const activeCount = enemyPool.getActive().length;
    if (activeCount >= GAME_CONFIG.MAX_ENEMIES) return;
    
    const enemy = enemyPool.acquire();
    if (!enemy) return;
    
    const difficulty = difficultyRef.current;
    const groundY = GAME_CONFIG.CANVAS_HEIGHT - 80;
    
    enemy.x = GAME_CONFIG.CANVAS_WIDTH + 30;
    enemy.y = groundY;
    enemy.maxHp = Math.floor(GAME_CONFIG.ENEMY_BASE_HP * difficulty.enemyHpMultiplier);
    enemy.hp = enemy.maxHp;
    enemy.speed = GAME_CONFIG.ENEMY_BASE_SPEED * difficulty.enemySpeedMultiplier;
    enemy.isServed = false;
    enemy.servedTimer = 0;
    enemy.state = 'WALKING';
    enemy.latchedTimer = 0;
    enemy.queuePosition = 0;
  }, [enemyPool]);
  
  const fireProjectile = useCallback((targetEnemy: Enemy) => {
    const proj = projectilePool.acquire();
    if (!proj) return;
    
    const activeBlocks = blocksRef.current.filter(b => !b.destroyed);
    if (activeBlocks.length === 0) return;
    
    // Fire from top of cart
    const topBlock = activeBlocks[activeBlocks.length - 1];
    proj.x = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
    proj.y = topBlock.y;
    proj.targetX = targetEnemy.x;
    proj.targetY = targetEnemy.y - targetEnemy.height / 2;
    // Stress test reduces damage to 0.4x to allow enemy accumulation
    const stressMultiplier = isStressTest ? 0.4 : 1;
    proj.damage = Math.floor(GAME_CONFIG.PROJECTILE_DAMAGE * damageMultiplierRef.current * stressMultiplier);
  }, [projectilePool]);
  
  const spawnParticles = useCallback((x: number, y: number, type: Particle['type'], count: number) => {
    for (let i = 0; i < count; i++) {
      const p = particlePool.acquire();
      if (!p) break;
      
      p.x = x;
      p.y = y;
      p.type = type;
      p.life = 0.5 + Math.random() * 0.5;
      p.maxLife = p.life;
      p.size = 4 + Math.random() * 6;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 50;
      
      if (type === 'confetti') {
        const colors = ['hsl(25, 80%, 55%)', 'hsl(45, 90%, 55%)', 'hsl(350, 80%, 60%)', 'hsl(0, 0%, 95%)'];
        p.color = colors[Math.floor(Math.random() * colors.length)];
      }
    }
  }, [particlePool]);
  
  const spawnTip = useCallback((x: number, y: number) => {
    const tip = tipPool.acquire();
    if (!tip) return;
    
    tip.x = x;
    tip.y = y;
    tip.targetY = 60; // Float to top
    tip.opacity = 1;
    tip.value = GAME_CONFIG.TIP_VALUE;
  }, [tipPool]);
  
  const handleTonicBomb = useCallback(() => {
    if (energyRef.current < GAME_CONFIG.TONIC_BOMB_COST) return;
    
    energyRef.current -= GAME_CONFIG.TONIC_BOMB_COST;
    setEnergy(energyRef.current);
    
    // Screen shake
    screenShakeRef.current = { x: 0, y: 0, duration: 0.3 };
    
    // Damage enemies in radius
    const bombX = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH + 50;
    const bombY = GAME_CONFIG.CANVAS_HEIGHT - 150;
    
    // Spawn VFX
    spawnParticles(bombX, bombY, 'confetti', 20);
    spawnParticles(bombX, bombY, 'steam', 10);
    
    enemyPool.getActive().forEach(enemy => {
      if (enemy.state === 'SERVED' || enemy.isServed) return;
      
      const dx = enemy.x - bombX;
      const dy = (enemy.y - enemy.height / 2) - bombY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < GAME_CONFIG.TONIC_BOMB_RADIUS) {
        enemy.hp -= GAME_CONFIG.TONIC_BOMB_DAMAGE;
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', 3);
        
        // If killed and was latched, decrement count
        if (enemy.hp <= 0 && enemy.state === 'LATCHED') {
          latchedCountRef.current = Math.max(0, latchedCountRef.current - 1);
        }
      }
    });
  }, [enemyPool, spawnParticles]);
  
  // Main game loop
  const gameLoop = useCallback((deltaTime: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const difficulty = difficultyRef.current;
    const blocks = blocksRef.current;
    const currentTime = timeRef.current;
    
    // Update time
    timeRef.current += deltaTime;
    
    // Smooth FPS calculation
    const instantFps = 1 / deltaTime;
    fpsRef.current = fpsRef.current * 0.9 + instantFps * 0.1; // Exponential smoothing
    
    // Track FPS history for min FPS calculation (last 10 seconds)
    fpsHistoryRef.current.push(fpsRef.current);
    if (fpsHistoryRef.current.length > 100) { // ~10s at 10Hz updates
      fpsHistoryRef.current.shift();
    }
    minFpsRef.current = Math.min(...fpsHistoryRef.current);
    
    // Track max active enemies seen
    const currentActiveCount = enemyPool.getActive().length;
    if (currentActiveCount > maxActiveEnemiesSeenRef.current) {
      maxActiveEnemiesSeenRef.current = currentActiveCount;
    }
    
    // Throttle HUD updates to 10 Hz for mobile performance
    hudAccumulatorRef.current += deltaTime;
    const shouldUpdateHUD = hudAccumulatorRef.current >= 0.1;
    if (shouldUpdateHUD) {
      hudAccumulatorRef.current = 0;
      setTimeSurvived(timeRef.current);
      
      // Calculate effective spawn interval (considering stress test)
      const baseInterval = isStressTest ? 300 : GAME_CONFIG.BASE_SPAWN_INTERVAL;
      const rushMultiplier = difficulty.isMorningRush ? (isStressTest ? 1.2 : GAME_CONFIG.RUSH_SPAWN_MULTIPLIER) : 1;
      const effectiveInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL, 
        (baseInterval / difficulty.spawnRateMultiplier) / rushMultiplier
      );
      
      setDebugInfo({
        fps: fpsRef.current,
        minFps: minFpsRef.current,
        activeEnemies: currentActiveCount,
        maxActiveEnemiesSeen: maxActiveEnemiesSeenRef.current,
        effectiveSpawnInterval: effectiveInterval,
        effectiveBlockHp: effectiveBlockHpRef.current,
        latchedCount: latchedCountRef.current,
        breatherTimer: difficulty.breatherTimer,
      });
    }
    
    // Update difficulty every 30 seconds
    const newLevel = Math.floor(timeRef.current / GAME_CONFIG.DIFFICULTY_INTERVAL);
    if (newLevel > difficulty.level) {
      difficulty.level = newLevel;
      difficulty.spawnRateMultiplier *= (1 + GAME_CONFIG.SPAWN_RATE_INCREASE);
      difficulty.enemyHpMultiplier *= (1 + GAME_CONFIG.ENEMY_HP_INCREASE);
      difficulty.enemySpeedMultiplier *= (1 + GAME_CONFIG.ENEMY_SPEED_INCREASE);
      
      // Start morning rush
      difficulty.isMorningRush = true;
      difficulty.rushTimer = GAME_CONFIG.RUSH_DURATION;
    }
    
    // Update morning rush timer (stress test uses 12s duration)
    if (difficulty.isMorningRush) {
      difficulty.rushTimer -= deltaTime;
      if (difficulty.rushTimer <= 0) {
        difficulty.isMorningRush = false;
        // Start breather period - pause spawns after Rush
        difficulty.breatherTimer = GAME_CONFIG.BREATHER_DURATION;
      }
    }
    
    // Update breather timer
    if (difficulty.breatherTimer > 0) {
      difficulty.breatherTimer -= deltaTime;
    }
    
    // Start rush with extended duration in stress test
    if (newLevel > (difficulty.level - 1) && isStressTest) {
      difficulty.rushTimer = 12; // 12s rush in stress test
    }
    
    // Energy regeneration (with upgrade multiplier)
    if (energyRef.current < GAME_CONFIG.MAX_ENERGY) {
      const effectiveRegenRate = GAME_CONFIG.ENERGY_REGEN_RATE * energyRegenMultiplierRef.current;
      energyRef.current = Math.min(
        GAME_CONFIG.MAX_ENERGY,
        energyRef.current + effectiveRegenRate * deltaTime
      );
      if (shouldUpdateHUD) {
        setEnergy(energyRef.current);
      }
    }
    
    // Spawn enemies (v3.2: warmup pre-rush uses slower spawn rate)
    // Block spawning during breather period
    const canSpawn = difficulty.breatherTimer <= 0;
    
    const isWarmup = timeRef.current < GAME_CONFIG.EARLY_GAME_SECONDS 
      && difficulty.level === 0 
      && !difficulty.isMorningRush;
    
    const baseSpawnInterval = isStressTest 
      ? 300 
      : (isWarmup ? GAME_CONFIG.EARLY_BASE_SPAWN_INTERVAL : GAME_CONFIG.BASE_SPAWN_INTERVAL);
    
    const spawnInterval = baseSpawnInterval / difficulty.spawnRateMultiplier;
    const stressRushMultiplier = isStressTest ? 1.2 : GAME_CONFIG.RUSH_SPAWN_MULTIPLIER;
    const rushMultiplier = difficulty.isMorningRush ? stressRushMultiplier : 1;
    const effectiveInterval = Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, spawnInterval / rushMultiplier);
    
    if (canSpawn && currentTime - lastSpawnRef.current > effectiveInterval / 1000) {
      spawnEnemy();
      lastSpawnRef.current = currentTime;
    }
    
    // Auto-attack
    const enemies = enemyPool.getActive().filter(e => !e.isServed);
    if (enemies.length > 0 && currentTime - lastAttackRef.current > GAME_CONFIG.AUTO_ATTACK_INTERVAL / 1000) {
      // Find nearest enemy
      const cartX = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
      let nearest = enemies[0];
      let minDist = Math.abs(enemies[0].x - cartX);
      
      enemies.forEach(e => {
        const dist = Math.abs(e.x - cartX);
        if (dist < minDist) {
          minDist = dist;
          nearest = e;
        }
      });
      
      fireProjectile(nearest);
      lastAttackRef.current = currentTime;
    }
    
    // Update projectiles
    projectilePool.getActive().forEach(proj => {
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 10) {
        // Check collision with enemies
        enemyPool.getActive().forEach(enemy => {
          if (enemy.isServed) return;
          
          const ex = enemy.x;
          const ey = enemy.y - enemy.height / 2;
          const hitDist = Math.sqrt((proj.x - ex) ** 2 + (proj.y - ey) ** 2);
          
          if (hitDist < enemy.width / 2 + proj.radius) {
            enemy.hp -= proj.damage;
            spawnParticles(proj.x, proj.y, 'sparkle', 3);
            projectilePool.release(proj);
          }
        });
        
        if (proj.active) {
          projectilePool.release(proj);
        }
      } else {
        const speed = proj.speed * deltaTime;
        proj.x += (dx / dist) * speed;
        proj.y += (dy / dist) * speed;
      }
    });
    
    // Update enemies - TDS-style latched system
    const activeBlocks = blocks.filter(b => !b.destroyed);
    const cartRightEdge = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
    
    // Calculate max latched slots (more during Rush)
    const maxLatched = difficulty.isMorningRush 
      ? GAME_CONFIG.MAX_LATCHED_ENEMIES + GAME_CONFIG.RUSH_LATCHED_BONUS
      : GAME_CONFIG.MAX_LATCHED_ENEMIES;
    
    // Count queued enemies for proper positioning
    let queuedCount = 0;
    
    enemyPool.getActive().forEach(enemy => {
      // SERVED state - happy exit animation
      if (enemy.state === 'SERVED' || enemy.isServed) {
        enemy.servedTimer -= deltaTime;
        enemy.x += GAME_CONFIG.SERVED_EXIT_SPEED * deltaTime;
        
        if (enemy.servedTimer <= 0 || enemy.x > GAME_CONFIG.CANVAS_WIDTH + 50) {
          enemyPool.release(enemy);
        }
        return;
      }
      
      // Check if just served (HP <= 0)
      if (enemy.hp <= 0) {
        // Was latched? Decrement count
        if (enemy.state === 'LATCHED') {
          latchedCountRef.current = Math.max(0, latchedCountRef.current - 1);
        }
        
        enemy.state = 'SERVED';
        enemy.isServed = true;
        enemy.servedTimer = GAME_CONFIG.SERVED_EXIT_DURATION;
        customersServedRef.current++;
        
        // Drop tip
        spawnTip(enemy.x, enemy.y - enemy.height);
        
        // Celebration particles
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'heart', 3);
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', 5);
        return;
      }
      
      // LATCHED state - tick damage to cart
      if (enemy.state === 'LATCHED') {
        enemy.latchedTimer -= deltaTime;
        
        if (enemy.latchedTimer <= 0 && activeBlocks.length > 0) {
          // Deal tick damage to lowest block
          const lowestBlock = activeBlocks[0];
          lowestBlock.hp -= GAME_CONFIG.LATCHED_TICK_DAMAGE;
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          
          // Small damage particles
          spawnParticles(cartRightEdge, lowestBlock.y + GAME_CONFIG.BLOCK_HEIGHT / 2, 'steam', 2);
          
          // Check block destruction
          if (lowestBlock.hp <= 0) {
            lowestBlock.destroyed = true;
            spawnParticles(
              GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH / 2,
              lowestBlock.y,
              'steam',
              15
            );
            
            // Check game over
            if (blocks.filter(b => !b.destroyed).length === 0) {
              handleGameOver();
            }
          }
        }
        return;
      }
      
      // QUEUED state - wait for latched slot to open
      if (enemy.state === 'QUEUED') {
        // Check if slot opened
        if (latchedCountRef.current < maxLatched) {
          enemy.state = 'LATCHED';
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          enemy.x = cartRightEdge + enemy.width / 2;
          latchedCountRef.current++;
        } else {
          // Walk slowly toward queue position (TDS-style visible line)
          queuedCount++;
          const targetX = cartRightEdge + enemy.width / 2 + queuedCount * (enemy.width + GAME_CONFIG.LATCHED_QUEUE_SPACING);
          if (enemy.x > targetX) {
            // Walk toward queue position (slower than normal)
            enemy.x -= enemy.speed * 0.3 * deltaTime;
            enemy.x = Math.max(enemy.x, targetX);
          }
        }
        return;
      }
      
      // WALKING state - move toward cart
      const rushSpeedMultiplier = difficulty.isMorningRush ? GAME_CONFIG.RUSH_SPEED_MULTIPLIER : 1;
      enemy.x -= enemy.speed * rushSpeedMultiplier * deltaTime;
      
      // Check if reached cart edge
      if (enemy.x - enemy.width / 2 < cartRightEdge) {
        if (latchedCountRef.current < maxLatched && activeBlocks.length > 0) {
          // Become latched
          enemy.state = 'LATCHED';
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          enemy.x = cartRightEdge + enemy.width / 2;
          latchedCountRef.current++;
        } else if (activeBlocks.length > 0) {
          // Queue behind - enter queue state (TDS-style line formation)
          enemy.state = 'QUEUED';
          // Will walk to proper position in QUEUED state update
        } else {
          // No blocks left - game over already handled
        }
      }
    });
    
    // Update tips
    tipPool.getActive().forEach(tip => {
      tip.y -= GAME_CONFIG.TIP_FLOAT_SPEED * deltaTime;
      tip.opacity = Math.max(0, tip.opacity - deltaTime * 0.5);
      
      if (tip.y < tip.targetY || tip.opacity <= 0) {
        tipsRef.current += tip.value;
        if (shouldUpdateHUD) {
          setTips(tipsRef.current);
        }
        tipPool.release(tip);
      }
    });
    
    // Update particles
    particlePool.getActive().forEach(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 100 * deltaTime; // gravity
      p.life -= deltaTime;
      
      if (p.life <= 0) {
        particlePool.release(p);
      }
    });
    
    // Update screen shake
    if (screenShakeRef.current.duration > 0) {
      screenShakeRef.current.duration -= deltaTime;
      screenShakeRef.current.x = (Math.random() - 0.5) * 10;
      screenShakeRef.current.y = (Math.random() - 0.5) * 10;
    } else {
      screenShakeRef.current.x = 0;
      screenShakeRef.current.y = 0;
    }
    
    // Render
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    drawGame(
      ctx,
      blocks,
      enemyPool.getActive(),
      projectilePool.getActive(),
      tipPool.getActive(),
      particlePool.getActive(),
      difficulty,
      screenShakeRef.current
    );
  }, [
    enemyPool, 
    projectilePool, 
    tipPool, 
    particlePool, 
    spawnEnemy, 
    fireProjectile, 
    spawnParticles, 
    spawnTip, 
    handleGameOver
  ]);
  
  useGameLoop(gameLoop, gameState === 'PLAY');
  
  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    
    // Initial draw for menu
    if (gameState === 'MENU') {
      drawGame(
        ctx,
        [],
        [],
        [],
        [],
        [],
        difficultyRef.current,
        { x: 0, y: 0 }
      );
    }
  }, [gameState]);
  
  const canUseBomb = energyRef.current >= GAME_CONFIG.TONIC_BOMB_COST;

  return (
    <div className="game-container relative w-full h-full bg-coffee-espresso">
      {/* Canvas Container - maintains 9:16 aspect ratio */}
      <div 
        className="relative"
        style={{
          width: `min(100vw, ${GAME_CONFIG.CANVAS_WIDTH}px)`,
          height: `min(100vh, ${GAME_CONFIG.CANVAS_HEIGHT}px)`,
          maxWidth: '100vw',
          maxHeight: '100vh',
          aspectRatio: '9/16',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Garage Screen (Menu + Upgrades combined) */}
        {gameState === 'MENU' && (
          <GarageScreen onPlay={handlePlay} />
        )}
        
        {/* Game HUD */}
        {gameState === 'PLAY' && (
          <GameHUD
            timeSurvived={timeSurvived}
            tips={tips}
            energy={energy}
            maxEnergy={GAME_CONFIG.MAX_ENERGY}
            isMorningRush={difficultyRef.current.isMorningRush}
            onTonicBomb={handleTonicBomb}
            canUseBomb={canUseBomb}
          />
        )}
        
        {/* Debug HUD (optional) */}
        {gameState === 'PLAY' && (
          <DebugHUD
            fps={debugInfo.fps}
            minFps={debugInfo.minFps}
            activeEnemies={debugInfo.activeEnemies}
            maxEnemies={GAME_CONFIG.MAX_ENEMIES}
            maxActiveEnemiesSeen={debugInfo.maxActiveEnemiesSeen}
            effectiveSpawnInterval={debugInfo.effectiveSpawnInterval}
            isMorningRush={difficultyRef.current.isMorningRush}
            damageMultiplier={isStressTest ? damageMultiplierRef.current * 0.4 : damageMultiplierRef.current}
            energyRegenMultiplier={energyRegenMultiplierRef.current}
            effectiveBlockHp={debugInfo.effectiveBlockHp}
            isVisible={showDebug}
            isStressTest={isStressTest}
            latchedCount={debugInfo.latchedCount}
            breatherTimer={debugInfo.breatherTimer}
            onToggle={() => setShowDebug(prev => !prev)}
            onStressTestToggle={() => setIsStressTest(prev => !prev)}
          />
        )}
        
        {/* End Screen */}
        {gameState === 'END' && (
          <EndScreen 
            stats={stats} 
            onPlayAgain={handlePlay} 
            onHome={handleHome}
          />
        )}
      </div>
    </div>
  );
};
