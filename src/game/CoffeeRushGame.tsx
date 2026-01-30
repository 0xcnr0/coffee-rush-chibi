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
  updateChapterClear,
  getUpgradeMultiplier 
} from './persistence';
import type { 
  GameState, 
  GameMode,
  CartBlock, 
  Enemy, 
  EnemyKind,
  Projectile, 
  TipDrop, 
  Particle, 
  GameStats,
  DifficultyState,
  BossState,
  RunTelemetry
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
  kind: 'NORMAL', // Phase 2B-1: Default to normal
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
  const [gameMode, setGameMode] = useState<GameMode>('CHAPTER');
  const [stats, setStats] = useState<GameStats>({ timeSurvived: 0, customersServed: 0, totalTips: 0, beansEarned: 0, isNewRecord: false });
  const [energy, setEnergy] = useState<number>(0); // Phase 1.6A: Start at 0 (TDS pacing)
  const [tips, setTips] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [isStressTest, setIsStressTest] = useState(false);
  
  // Phase 2B-2: Boss state
  const [bossState, setBossState] = useState<BossState>({
    isActive: false,
    hp: 0,
    maxHp: GAME_CONFIG.BOSS_HP,
    spawnedAt: 0,
    addSpawnTimer: 0,
  });
  const bossStateRef = useRef<BossState>({
    isActive: false,
    hp: 0,
    maxHp: GAME_CONFIG.BOSS_HP,
    spawnedAt: 0,
    addSpawnTimer: 0,
  });
  const bossIncomingRef = useRef<number>(0); // Timer for "BOSS INCOMING" banner
  const bossEnemyRef = useRef<Enemy | null>(null); // Track the boss enemy entity
  
  const [debugInfo, setDebugInfo] = useState<{
    fps: number;
    minFps: number;
    activeEnemies: number;
    maxActiveEnemiesSeen: number;
    effectiveSpawnInterval: number;
    effectiveBlockHp: number;
    latchedCount: number;
    breatherTimer: number;
    // Phase 1.8: Combat debug
    currentTargetId: number | null;
    currentTargetX: number | null;
    lastAttackDelta: number;
    activeProjectiles: number;
    // Phase 2A: Shot counters
    shotsFired: number;
    shotsHit: number;
    // Phase 2B-1: Heavy enemy count
    heavyCount: number;
    // Phase 2B-2: Checkpoint index
    checkpointIndex: number;
  }>({
    fps: 60,
    minFps: 60,
    activeEnemies: 0,
    maxActiveEnemiesSeen: 0,
    effectiveSpawnInterval: GAME_CONFIG.BASE_SPAWN_INTERVAL,
    effectiveBlockHp: GAME_CONFIG.BLOCK_MAX_HP,
    latchedCount: 0,
    breatherTimer: 0,
    currentTargetId: null,
    currentTargetX: null,
    lastAttackDelta: 0,
    activeProjectiles: 0,
    shotsFired: 0,
    shotsHit: 0,
    heavyCount: 0,
    checkpointIndex: 0,
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
  const lastAttackRef = useRef(-999); // Start negative to allow immediate first shot
  const lastSpawnRef = useRef(-999); // Start negative to allow immediate first spawn
  const energyRef = useRef<number>(0); // Phase 1.6A: Start at 0 (TDS pacing)
  const timeRef = useRef(0);
  const tipsRef = useRef(0);
  // Phase 2A: Shot debug counters
  const shotsFiredRef = useRef(0);
  const shotsHitRef = useRef(0);
  // Phase 2B-1: Spawn counter for heavy enemy scheduling
  const spawnIndexRef = useRef(0);
  const customersServedRef = useRef(0);
  const damageMultiplierRef = useRef(1);
  const energyRegenMultiplierRef = useRef(1);
  const blockHpMultiplierRef = useRef(1); // Phase 2C: Track for telemetry
  const hudAccumulatorRef = useRef(0); // HUD throttle accumulator
  const fpsRef = useRef(60); // Smoothed FPS
  const effectiveBlockHpRef = useRef<number>(GAME_CONFIG.BLOCK_MAX_HP); // Store for debug
  // Phase 1.8: Combat debug tracking refs
  const currentTargetRef = useRef<{ id: number; x: number } | null>(null);
  
  // Phase 2C: Telemetry tracking refs
  const telemetryRef = useRef({
    maxLatchedPeak: 0,
    timeAtMaxLatched: 0,
    rushCount: 0,
    totalRushDuration: 0,
    blocksLost: 0,
    timeToFirstBlockLost: -1,
    tonicBombUses: 0,
    recoveryTimeTotal: 0,
    bossAddsSpawned: 0,
    enemiesSpawned: { normal: 0, heavy: 0, boss: 0 },
    enemiesKilled: { normal: 0, heavy: 0, boss: 0 },
    wasInRush: false, // Track rush state transitions
    upgradeLevels: { blockCountLevel: 0, towerHpLevel: 0, espressoDamageLevel: 0, energyRegenLevel: 0 },
  });
  
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
    blockHpMultiplierRef.current = blockHpMultiplier; // Phase 2C: Store for telemetry
    
    // Phase 2C: Store upgrade levels for telemetry
    telemetryRef.current.upgradeLevels = {
      blockCountLevel: upgradeLevels.blockCountLevel ?? 0,
      towerHpLevel: upgradeLevels.towerHpLevel,
      espressoDamageLevel: upgradeLevels.espressoDamageLevel,
      energyRegenLevel: upgradeLevels.energyRegenLevel,
    };
    
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
    lastAttackRef.current = -999; // Negative to allow immediate first shot
    lastSpawnRef.current = -999; // Negative to allow immediate first spawn
    energyRef.current = 0; // Phase 1.6A: Start at 0 (TDS pacing)
    timeRef.current = 0;
    tipsRef.current = 0;
    customersServedRef.current = 0;
    // Reset shot counters
    shotsFiredRef.current = 0;
    shotsHitRef.current = 0;
    // Reset spawn index for heavy scheduling
    spawnIndexRef.current = 0;
    
    // Reset stress test tracking
    minFpsRef.current = 60;
    fpsHistoryRef.current = [];
    maxActiveEnemiesSeenRef.current = 0;
    
    // Phase 2C: Reset telemetry
    telemetryRef.current = {
      maxLatchedPeak: 0,
      timeAtMaxLatched: 0,
      rushCount: 0,
      totalRushDuration: 0,
      blocksLost: 0,
      timeToFirstBlockLost: -1,
      tonicBombUses: 0,
      recoveryTimeTotal: 0,
      bossAddsSpawned: 0,
      enemiesSpawned: { normal: 0, heavy: 0, boss: 0 },
      enemiesKilled: { normal: 0, heavy: 0, boss: 0 },
      wasInRush: false,
      upgradeLevels: telemetryRef.current.upgradeLevels, // Keep upgrade levels
    };
    
    // Clear pools
    enemyPool.clear();
    projectilePool.clear();
    tipPool.clear();
    particlePool.clear();
    
    // Reset state
    setEnergy(0); // Phase 1.6A: Start at 0 (TDS pacing)
    setTips(0);
    setTimeSurvived(0);
    
    // Phase 2B-2: Reset boss state
    bossStateRef.current = {
      isActive: false,
      hp: 0,
      maxHp: GAME_CONFIG.BOSS_HP,
      spawnedAt: 0,
      addSpawnTimer: 0,
    };
    setBossState(bossStateRef.current);
    bossIncomingRef.current = 0;
    bossEnemyRef.current = null;
  }, [enemyPool, projectilePool, tipPool, particlePool]);
  
  const handlePlay = useCallback((mode: GameMode) => {
    setGameMode(mode);
    initGame();
    setGameState('PLAY');
  }, [initGame]);
  
  // Phase 2C: Build telemetry object for EndScreen
  const buildTelemetry = useCallback((): RunTelemetry => {
    const t = telemetryRef.current;
    const hitRate = shotsFiredRef.current > 0 
      ? Math.round((shotsHitRef.current / shotsFiredRef.current) * 100) 
      : 0;
    
    // Determine boss outcome
    let bossOutcome: RunTelemetry['bossOutcome'] = 'not_spawned';
    let bossHpPercent = 0;
    if (bossStateRef.current.isActive || bossEnemyRef.current) {
      const boss = bossEnemyRef.current;
      if (boss && boss.hp <= 0) {
        bossOutcome = 'defeated';
      } else if (boss) {
        bossOutcome = 'died_during_boss';
        bossHpPercent = Math.round((boss.hp / boss.maxHp) * 100);
      } else {
        bossOutcome = 'spawned';
      }
    }
    
    return {
      gameMode,
      checkpointsReached: Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS),
      reachedBoss: bossStateRef.current.isActive || bossEnemyRef.current !== null || bossOutcome === 'defeated',
      bossOutcome,
      bossHpPercent,
      upgradeLevels: t.upgradeLevels,
      effectiveMultipliers: {
        damage: damageMultiplierRef.current,
        blockHp: blockHpMultiplierRef.current,
        energy: energyRegenMultiplierRef.current,
      },
      shotsFired: shotsFiredRef.current,
      shotsHit: shotsHitRef.current,
      hitRate,
      maxLatchedPeak: t.maxLatchedPeak,
      timeAtMaxLatched: t.timeAtMaxLatched,
      rushCount: t.rushCount,
      totalRushDuration: t.totalRushDuration,
      blocksLost: t.blocksLost,
      timeToFirstBlockLost: t.timeToFirstBlockLost,
      tonicBombUses: t.tonicBombUses,
      recoveryTimeTotal: t.recoveryTimeTotal,
      bossAddsSpawned: t.bossAddsSpawned,
      enemiesSpawned: { ...t.enemiesSpawned },
      enemiesKilled: { ...t.enemiesKilled },
    };
  }, [gameMode]);

  // Phase 2B-2: Chapter Clear handler
  const handleChapterClear = useCallback(() => {
    const { beansEarned } = updateChapterClear(
      timeRef.current,
      tipsRef.current
    );
    
    // Add chapter clear bonus
    const totalBeans = beansEarned + GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS;
    
    // Build telemetry with boss defeated
    const telemetry = buildTelemetry();
    telemetry.bossOutcome = 'defeated';
    telemetry.bossHpPercent = 0;
    
    setStats({
      timeSurvived: timeRef.current,
      customersServed: customersServedRef.current,
      totalTips: tipsRef.current,
      beansEarned: totalBeans,
      isNewRecord: false,
      isChapterClear: true,
      checkpointsCleared: GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT,
      telemetry,
    });
    setGameState('END');
  }, [buildTelemetry]);
  
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
      telemetry: buildTelemetry(),
    });
    setGameState('END');
  }, [buildTelemetry]);
  
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
    
    // Phase 2C: Determine if this spawn is a Heavy enemy
    // Disable HEAVY in Chapter 1 before boss (only Endless or after boss checkpoint)
    spawnIndexRef.current++;
    const spawnIndex = spawnIndexRef.current;
    const spawnEvery = difficulty.isMorningRush 
      ? GAME_CONFIG.HEAVY_RUSH_SPAWN_EVERY 
      : GAME_CONFIG.HEAVY_SPAWN_EVERY;
    const checkpointIndex = Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS);
    const heavyDisabledInChapter = gameMode === 'CHAPTER' && checkpointIndex < GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT;
    const isHeavy = !heavyDisabledInChapter && (spawnIndex % spawnEvery === 0);
    
    // Set enemy kind and apply multipliers
    enemy.kind = isHeavy ? 'HEAVY' : 'NORMAL';
    
    // Phase 2C: Track spawns for telemetry
    if (isHeavy) {
      telemetryRef.current.enemiesSpawned.heavy++;
    } else {
      telemetryRef.current.enemiesSpawned.normal++;
    }
    
    const hpMult = isHeavy ? GAME_CONFIG.HEAVY_HP_MULT : 1;
    const speedMult = isHeavy ? GAME_CONFIG.HEAVY_SPEED_MULT : 1;
    const sizeMult = isHeavy ? GAME_CONFIG.HEAVY_SIZE_MULT : 1;
    
    enemy.x = GAME_CONFIG.CANVAS_WIDTH + 30;
    enemy.y = groundY;
    enemy.maxHp = Math.floor(GAME_CONFIG.ENEMY_BASE_HP * difficulty.enemyHpMultiplier * hpMult);
    enemy.hp = enemy.maxHp;
    enemy.speed = GAME_CONFIG.ENEMY_BASE_SPEED * difficulty.enemySpeedMultiplier * speedMult;
    enemy.width = Math.floor(GAME_CONFIG.ENEMY_WIDTH * sizeMult);
    enemy.height = Math.floor(GAME_CONFIG.ENEMY_HEIGHT * sizeMult);
    enemy.isServed = false;
    enemy.servedTimer = 0;
    enemy.state = 'WALKING';
    enemy.latchedTimer = 0;
    enemy.queuePosition = 0;
  }, [enemyPool, gameMode]);
  
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
    
    // Phase 2C: Track bomb usage
    telemetryRef.current.tonicBombUses++;
    
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
        // Phase 1.8: Combat debug
        currentTargetId: currentTargetRef.current?.id ?? null,
        currentTargetX: currentTargetRef.current?.x ?? null,
        lastAttackDelta: currentTime - lastAttackRef.current,
        activeProjectiles: projectilePool.getActive().length,
        // Phase 2A: Shot counters
        shotsFired: shotsFiredRef.current,
        shotsHit: shotsHitRef.current,
        // Phase 2B-1: Heavy count
        heavyCount: enemyPool.getActive().filter(e => e.kind === 'HEAVY' && !e.isServed && e.state !== 'SERVED').length,
        // Phase 2B-2: Checkpoint index
        checkpointIndex: Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS),
      });
      
      // Phase 2B-2: Update boss state for UI
      setBossState({ ...bossStateRef.current });
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
      
      // Phase 2C: Track rush count
      telemetryRef.current.rushCount++;
    }
    
    // Update morning rush timer (stress test uses 12s duration)
    // Phase 2D: Pause rush timer during boss fight - boss is its own pressure source
    if (difficulty.isMorningRush && !bossStateRef.current.isActive) {
      difficulty.rushTimer -= deltaTime;
      
      // Phase 2C: Track rush duration
      telemetryRef.current.totalRushDuration += deltaTime;
      
      if (difficulty.rushTimer <= 0) {
        difficulty.isMorningRush = false;
        // Start post-rush recovery period - gradual spawn ramp-up
        difficulty.breatherTimer = GAME_CONFIG.POST_RUSH_RECOVERY_DURATION;
      }
    }
    
    // Phase 2D: Force rush off when boss becomes active
    if (bossStateRef.current.isActive && difficulty.isMorningRush) {
      difficulty.isMorningRush = false;
      difficulty.rushTimer = 0;
      // Don't start recovery during boss - boss fight has its own pacing
    }
    
    // Update recovery timer (gradual ramp-up) and track total recovery time
    if (difficulty.breatherTimer > 0) {
      telemetryRef.current.recoveryTimeTotal += deltaTime;
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
    
    // Phase 2B-2: Boss spawn logic (Chapter mode only)
    const checkpointIndex = Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS);
    const shouldSpawnBoss = gameMode === 'CHAPTER' 
      && checkpointIndex >= GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT 
      && !bossStateRef.current.isActive 
      && bossEnemyRef.current === null;
    
    // Boss incoming banner countdown
    if (bossIncomingRef.current > 0) {
      bossIncomingRef.current -= deltaTime;
    }
    
    if (shouldSpawnBoss && bossIncomingRef.current <= 0) {
      // Start boss incoming banner
      if (bossIncomingRef.current === 0) {
        bossIncomingRef.current = GAME_CONFIG.BOSS_INCOMING_BANNER_DURATION;
      } else {
        // Spawn the boss
        const bossEnemy = enemyPool.acquire();
        if (bossEnemy) {
          const groundY = GAME_CONFIG.CANVAS_HEIGHT - 80;
          bossEnemy.kind = 'BOSS';
          bossEnemy.x = GAME_CONFIG.CANVAS_WIDTH + 50;
          bossEnemy.y = groundY;
          bossEnemy.maxHp = GAME_CONFIG.BOSS_HP;
          bossEnemy.hp = GAME_CONFIG.BOSS_HP;
          bossEnemy.speed = GAME_CONFIG.ENEMY_BASE_SPEED * GAME_CONFIG.BOSS_SPEED_MULT;
          bossEnemy.width = Math.floor(GAME_CONFIG.ENEMY_WIDTH * GAME_CONFIG.BOSS_SIZE_MULT);
          bossEnemy.height = Math.floor(GAME_CONFIG.ENEMY_HEIGHT * GAME_CONFIG.BOSS_SIZE_MULT);
          bossEnemy.isServed = false;
          bossEnemy.servedTimer = 0;
          bossEnemy.state = 'WALKING';
          bossEnemy.latchedTimer = 0;
          bossEnemy.queuePosition = 0;
          
          bossEnemyRef.current = bossEnemy;
          bossStateRef.current = {
            isActive: true,
            hp: GAME_CONFIG.BOSS_HP,
            maxHp: GAME_CONFIG.BOSS_HP,
            spawnedAt: currentTime,
            addSpawnTimer: GAME_CONFIG.BOSS_ADD_SPAWN_INTERVAL,
          };
          
          // Phase 2C: Track boss spawn for telemetry
          telemetryRef.current.enemiesSpawned.boss++;
          
          // Trigger rush during boss fight
          difficulty.isMorningRush = true;
          difficulty.rushTimer = 999; // Boss fight is continuous rush
        }
      }
    }
    
    // Update boss state if boss is active
    if (bossStateRef.current.isActive && bossEnemyRef.current) {
      const boss = bossEnemyRef.current;
      
      // Sync boss HP
      bossStateRef.current.hp = boss.hp;
      
      // Check boss defeat (Chapter Clear!)
      if (boss.hp <= 0 || boss.isServed || boss.state === 'SERVED') {
        bossStateRef.current.isActive = false;
        bossEnemyRef.current = null;
        difficulty.isMorningRush = false;
        handleChapterClear();
        return; // Exit game loop - chapter complete
      }
      
      // Chapter 1 boss is 1v1 - no add spawns (BOSS_ADD_SPAWN_INTERVAL = 0)
      // Only spawn adds if interval > 0 (for future Chapter 2+ bosses)
      if (GAME_CONFIG.BOSS_ADD_SPAWN_INTERVAL > 0) {
        bossStateRef.current.addSpawnTimer -= deltaTime;
        if (bossStateRef.current.addSpawnTimer <= 0 && enemyPool.getActive().length < GAME_CONFIG.MAX_ENEMIES - 1) {
          spawnEnemy();
          bossStateRef.current.addSpawnTimer = GAME_CONFIG.BOSS_ADD_SPAWN_INTERVAL;
        }
      }
    }
    
    // Spawn enemies (v3.2: warmup pre-rush uses slower spawn rate)
    // Block spawning when boss incoming banner is showing or boss is active (1v1 fight)
    const canSpawn = bossIncomingRef.current <= 0 && !bossStateRef.current.isActive;
    
    const isWarmup = timeRef.current < GAME_CONFIG.EARLY_GAME_SECONDS 
      && difficulty.level === 0 
      && !difficulty.isMorningRush;
    
    const baseSpawnInterval = isStressTest 
      ? 300 
      : (isWarmup ? GAME_CONFIG.EARLY_BASE_SPAWN_INTERVAL : GAME_CONFIG.BASE_SPAWN_INTERVAL);
    
    const spawnInterval = baseSpawnInterval / difficulty.spawnRateMultiplier;
    // Phase 2C: Chapter pre-boss uses softer rush spawn multiplier (2.5 vs 2.8)
    const checkpointForSpawn = Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS);
    const isChapterPreBossSpawn = gameMode === 'CHAPTER' && checkpointForSpawn < GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT;
    const chapterRushMult = isChapterPreBossSpawn ? 2.5 : GAME_CONFIG.RUSH_SPAWN_MULTIPLIER;
    const stressRushMultiplier = isStressTest ? 1.2 : chapterRushMult;
    const rushMultiplier = difficulty.isMorningRush ? stressRushMultiplier : 1;
    
    // Post-rush recovery: gradual spawn rate ramp-up (30% → 100% over recovery duration)
    let recoveryMultiplier = 1;
    if (difficulty.breatherTimer > 0 && !difficulty.isMorningRush) {
      const recoveryProgress = 1 - (difficulty.breatherTimer / GAME_CONFIG.POST_RUSH_RECOVERY_DURATION);
      const startMult = GAME_CONFIG.POST_RUSH_SPAWN_MULT_START;
      const endMult = GAME_CONFIG.POST_RUSH_SPAWN_MULT_END;
      recoveryMultiplier = startMult + (endMult - startMult) * recoveryProgress;
    }
    
    const effectiveInterval = Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, spawnInterval / rushMultiplier / recoveryMultiplier);
    
    if (canSpawn && currentTime - lastSpawnRef.current > effectiveInterval / 1000) {
      spawnEnemy();
      lastSpawnRef.current = currentTime;
    }
    
    // Auto-attack
    const enemies = enemyPool.getActive().filter(e => !e.isServed && e.state !== 'SERVED');
    if (enemies.length > 0 && currentTime - lastAttackRef.current > GAME_CONFIG.AUTO_ATTACK_INTERVAL / 1000) {
      // Find nearest enemy (lowest x = closest to cart)
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
      
      // Phase 1.8: Track current target for debug
      currentTargetRef.current = { id: nearest.id, x: nearest.x };
      
      fireProjectile(nearest);
      shotsFiredRef.current++; // Phase 2A: Track shots fired
      lastAttackRef.current = currentTime;
    } else if (enemies.length === 0) {
      currentTargetRef.current = null;
    }
    
    // Update projectiles - FIX: Check collision continuously during flight, not just at destination
    projectilePool.getActive().forEach(proj => {
      // Move projectile toward target
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Move projectile
      if (dist > 1) {
        const speed = proj.speed * deltaTime;
        proj.x += (dx / dist) * speed;
        proj.y += (dy / dist) * speed;
      }
      
      // Check collision with ALL active enemies (not just at destination)
      let hitEnemy = false;
      enemyPool.getActive().forEach(enemy => {
        if (hitEnemy || enemy.isServed || enemy.state === 'SERVED') return;
        
        const ex = enemy.x;
        const ey = enemy.y - enemy.height / 2;
        const hitDist = Math.sqrt((proj.x - ex) ** 2 + (proj.y - ey) ** 2);
        
        // Larger hit radius for reliable collision
        if (hitDist < enemy.width / 2 + proj.radius + 5) {
          enemy.hp -= proj.damage;
          shotsHitRef.current++; // Phase 2A: Track shots hit
          spawnParticles(proj.x, proj.y, 'sparkle', 3);
          projectilePool.release(proj);
          hitEnemy = true;
        }
      });
      
      // Release if past screen right edge OR reached destination without hitting
      if (!hitEnemy && (proj.x > GAME_CONFIG.CANVAS_WIDTH + 50 || dist <= 1)) {
        projectilePool.release(proj);
      }
    });
    
    // Update enemies - TDS-style latched system
    const activeBlocks = blocks.filter(b => !b.destroyed);
    const cartRightEdge = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
    
    // Calculate max latched slots (more during Rush)
    // Phase 2C: Chapter mode pre-boss uses reduced latch bonus (+1 instead of +2)
    const checkpointIndexForLatch = Math.floor(timeRef.current / GAME_CONFIG.CHECKPOINT_SECONDS);
    const isChapterPreBoss = gameMode === 'CHAPTER' && checkpointIndexForLatch < GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT;
    const rushLatchBonus = isChapterPreBoss ? 1 : GAME_CONFIG.RUSH_LATCHED_BONUS; // +1 for Chapter pre-boss, +2 for Endless/boss
    const maxLatched = difficulty.isMorningRush 
      ? GAME_CONFIG.MAX_LATCHED_ENEMIES + rushLatchBonus
      : GAME_CONFIG.MAX_LATCHED_ENEMIES;
    
    // Phase 2C: Track latched telemetry
    if (latchedCountRef.current > telemetryRef.current.maxLatchedPeak) {
      telemetryRef.current.maxLatchedPeak = latchedCountRef.current;
    }
    if (latchedCountRef.current >= maxLatched) {
      telemetryRef.current.timeAtMaxLatched += deltaTime;
    }
    
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
        // Was latched? Decrement count (Boss counts as 2 slots)
        if (enemy.state === 'LATCHED') {
          const slotsUsed = enemy.kind === 'BOSS' ? GAME_CONFIG.BOSS_LATCH_SLOTS : 1;
          latchedCountRef.current = Math.max(0, latchedCountRef.current - slotsUsed);
        }
        
        enemy.state = 'SERVED';
        enemy.isServed = true;
        enemy.servedTimer = GAME_CONFIG.SERVED_EXIT_DURATION;
        customersServedRef.current++;
        
        // Phase 2C: Track kills for telemetry
        if (enemy.kind === 'BOSS') {
          telemetryRef.current.enemiesKilled.boss++;
        } else if (enemy.kind === 'HEAVY') {
          telemetryRef.current.enemiesKilled.heavy++;
        } else {
          telemetryRef.current.enemiesKilled.normal++;
        }
        
        // Drop tip (boss drops bigger tip)
        const tipCount = enemy.kind === 'BOSS' ? 5 : 1;
        for (let i = 0; i < tipCount; i++) {
          spawnTip(enemy.x + (i - 2) * 15, enemy.y - enemy.height);
        }
        
        // Celebration particles (more for boss)
        const particleCount = enemy.kind === 'BOSS' ? 10 : 3;
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'heart', particleCount);
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', particleCount + 2);
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'confetti', enemy.kind === 'BOSS' ? 20 : 0);
        return;
      }
      
      // LATCHED state - tick damage to cart
      if (enemy.state === 'LATCHED') {
        enemy.latchedTimer -= deltaTime;
        
        if (enemy.latchedTimer <= 0 && activeBlocks.length > 0) {
          // Phase 2C: Deal tick damage to TOP block (last-added = buffer logic)
          // This makes newly purchased blocks act as shields, TDS-style
          const targetBlock = activeBlocks[activeBlocks.length - 1];
          let tickDamage = GAME_CONFIG.LATCHED_TICK_DAMAGE;
          if (enemy.kind === 'BOSS') {
            tickDamage *= GAME_CONFIG.BOSS_TICK_DAMAGE_MULT;
          } else if (enemy.kind === 'HEAVY') {
            tickDamage *= GAME_CONFIG.HEAVY_TICK_DAMAGE_MULT;
          }
          targetBlock.hp -= tickDamage;
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          
          // Small damage particles (more for boss)
          spawnParticles(cartRightEdge, targetBlock.y + GAME_CONFIG.BLOCK_HEIGHT / 2, 'steam', enemy.kind === 'BOSS' ? 5 : 2);
          
          // Check block destruction
          if (targetBlock.hp <= 0) {
            targetBlock.destroyed = true;
            
            // Phase 2C: Track block loss telemetry
            telemetryRef.current.blocksLost++;
            if (telemetryRef.current.timeToFirstBlockLost < 0) {
              telemetryRef.current.timeToFirstBlockLost = timeRef.current;
            }
            
            spawnParticles(
              GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH / 2,
              targetBlock.y,
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
        // Boss counts as 2 latched slots
        const slotsNeeded = enemy.kind === 'BOSS' ? GAME_CONFIG.BOSS_LATCH_SLOTS : 1;
        
        if (latchedCountRef.current + slotsNeeded <= maxLatched && activeBlocks.length > 0) {
          // Become latched
          enemy.state = 'LATCHED';
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          enemy.x = cartRightEdge + enemy.width / 2;
          latchedCountRef.current += slotsNeeded;
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
      screenShakeRef.current,
      bossStateRef.current,
      bossIncomingRef.current
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
    handleGameOver,
    handleChapterClear,
    gameMode
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
        { x: 0, y: 0 },
        undefined,
        0
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
            breatherTimer={difficultyRef.current.breatherTimer}
            onTonicBomb={handleTonicBomb}
            canUseBomb={canUseBomb}
            gameMode={gameMode}
            bossState={bossState}
            bossIncomingTimer={bossIncomingRef.current}
            checkpointIndex={debugInfo.checkpointIndex}
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
            currentTargetId={debugInfo.currentTargetId}
            currentTargetX={debugInfo.currentTargetX}
            lastAttackDelta={debugInfo.lastAttackDelta}
            activeProjectiles={debugInfo.activeProjectiles}
            shotsFired={debugInfo.shotsFired}
            shotsHit={debugInfo.shotsHit}
            heavyCount={debugInfo.heavyCount}
            gameMode={gameMode}
            bossState={bossState}
            checkpointIndex={debugInfo.checkpointIndex}
            onToggle={() => setShowDebug(prev => !prev)}
            onStressTestToggle={() => setIsStressTest(prev => !prev)}
          />
        )}
        
        {/* End Screen */}
        {gameState === 'END' && (
          <EndScreen 
            stats={stats.telemetry ? stats : { ...stats, telemetry: buildTelemetry() }} 
            onPlayAgain={() => handlePlay(gameMode)} 
            onHome={handleHome}
            gameMode={gameMode}
          />
        )}
      </div>
    </div>
  );
};
