import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GAME_CONFIG, COLORS, STAGES } from './config';
import { drawGame, drawMenuScene } from './renderer';
import { useGameLoop } from './useGameLoop';
import { useObjectPool } from './useObjectPool';
import { GarageOverlay } from './GarageOverlay';
import { EndScreen } from './EndScreen';
import { RunSummaryOverlay } from './RunSummaryOverlay';
import { GameHUD } from './GameHUD';
import { DebugHUD } from './DebugHUD';
import { PauseMenu } from './PauseMenu';
import { EvoPopup } from './EvoPopup';
import { 
  loadProgression,
  saveProgression,
  updateRecords,
  updateChapterClear,
  getPipCost,
  getPurchaseLog,
  clearPurchaseLog,
} from './persistence';
import type { 
  GameState, 
  GameMode,
  PlayPhase,
  GateBuilding,
  CartBlock, 
  Enemy, 
  EnemyKind,
  Projectile, 
  TipDrop, 
  Particle, 
  GameStats,
  BossState,
  RunTelemetry,
  EvoTrait,
  PurchaseEvent,
} from './types';

const createEnemy = (id: number): Enemy => ({
  id,
  x: 0, y: 0,
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
  kind: 'NORMAL',
});

const createProjectile = (id: number): Projectile => ({
  id,
  x: 0, y: 0,
  targetX: 0, targetY: 0,
  speed: GAME_CONFIG.PROJECTILE_SPEED,
  damage: GAME_CONFIG.PROJECTILE_DAMAGE,
  active: false,
  radius: GAME_CONFIG.PROJECTILE_RADIUS,
  pierce: false,
  isSaw: false,
});

const createTip = (id: number): TipDrop => ({
  id,
  x: 0, y: 0,
  targetY: 0,
  value: 1,
  active: false,
  opacity: 1,
});

const createParticle = (id: number): Particle => ({
  id,
  x: 0, y: 0,
  vx: 0, vy: 0,
  life: 0, maxLife: 1,
  color: COLORS.sparkle,
  size: 5,
  type: 'sparkle',
  active: false,
});

// Get stage config (1-indexed)
const getStage = (index: number) => STAGES[Math.min(index - 1, STAGES.length - 1)];

export const CoffeeRushGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('CHAPTER');
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<GameStats>({ timeSurvived: 0, customersServed: 0, totalTips: 0, coinsEarned: 0, isNewRecord: false });
  const [power, setPower] = useState<number>(0);
  const [tips, setTips] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [isStressTest, setIsStressTest] = useState(false);
  const [progressionVersion, setProgressionVersion] = useState(0);
  const [scale, setScale] = useState(1);
  
  // PlayPhase state
  const [playPhase, setPlayPhase] = useState<PlayPhase>('TRAVEL');
  const playPhaseRef = useRef<PlayPhase>('TRAVEL');
  
  // Stage tracking
  const stageIndexRef = useRef(1);
  const [stageIndex, setStageIndex] = useState(1);
  
  // Gate Building
  const gateBuildingRef = useRef<GateBuilding | null>(null);
  const [gateBuildingState, setGateBuildingState] = useState<GateBuilding | null>(null);
  
  // Boss state
  const [bossState, setBossState] = useState<BossState>({
    isActive: false, hp: 0, maxHp: 0, spawnedAt: 0, addSpawnTimer: 0,
  });
  const bossStateRef = useRef<BossState>({
    isActive: false, hp: 0, maxHp: 0, spawnedAt: 0, addSpawnTimer: 0,
  });
  const bossIncomingRef = useRef<number>(0);
  const bossEnemyRef = useRef<Enemy | null>(null);
  
  // EVO popup state
  const [evoPopupData, setEvoPopupData] = useState<{
    options: EvoTrait[];
    category: string;
    slotIndex: number;
  } | null>(null);
  
  // Travel timer
  const travelTimerRef = useRef<number>(0);
  
  // Simulation freeze
  const isSimulationFrozenRef = useRef<boolean>(false);
  
  // Phase time tracking
  const phaseTimersRef = useRef({ travel: 0, siege: 0, evoPick: 0, boss: 0 });
  
  // Coins earned from kills and gates this run
  const coinsFromKillsRef = useRef(0);
  const coinsFromGateLumpsRef = useRef(0);
  
  // Gate damage tracking for telemetry
  const gateDamageDealtRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const gateTimeSpentRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const shotsToGateRef = useRef(0);
  const shotsToEnemiesRef = useRef(0);
  const bombGateDamageByGateRef = useRef<number[]>([0, 0, 0, 0, 0]);
  
  // Run summary overlay
  const [showRunSummary, setShowRunSummary] = useState(false);
  const runIdRef = useRef(0);
  const gateDestroyedRef = useRef<boolean[]>([false, false, false, false, false]);
  const burstsTriggeredRef = useRef(0);
  const targetModeCountsRef = useRef({ front: 0, mid: 0, back: 0, gate: 0 });
  // Gate cleanup state (victory pulse before transition)
  const gateCleanupTimerRef = useRef(0);
  
  const [debugInfo, setDebugInfo] = useState<{
    fps: number;
    activeEnemies: number;
    effectiveSpawnInterval: number;
    latchedCount: number;
    shotsFired: number;
    shotsHit: number;
    heavyCount: number;
    activeProjectiles: number;
    power: number;
    stageIndex: number;
    gateHpPercent: number;
    gateDamageDealt: number;
  }>({
    fps: 60, activeEnemies: 0, effectiveSpawnInterval: 900,
    latchedCount: 0, shotsFired: 0, shotsHit: 0, heavyCount: 0,
    activeProjectiles: 0, power: 0, stageIndex: 1, gateHpPercent: 100,
    gateDamageDealt: 0,
  });
  
  // Game state refs
  const blocksRef = useRef<CartBlock[]>([]);
  const latchedCountRef = useRef(0);
  const screenShakeRef = useRef({ x: 0, y: 0, duration: 0 });
  const lastAttackRef = useRef(-999);
  const lastSpawnRef = useRef(-999);
  const powerRef = useRef<number>(0);
  const timeRef = useRef(0);
  const tipsRef = useRef(0);
  const shotsFiredRef = useRef(0);
  const shotsHitRef = useRef(0);
  const spawnIndexRef = useRef(0);
  const customersServedRef = useRef(0);
  const damageMultiplierRef = useRef(1);
  const powerRegenMultiplierRef = useRef(1);
  const coinsStartRef = useRef(0);
  const endHandledRef = useRef(false);
  const endReasonRef = useRef<'gameover' | 'clear' | null>(null);
  const hudAccumulatorRef = useRef(0);
  const fpsRef = useRef(60);
  
  // Saw weapon state
  const lastSawAttackRef = useRef(-999);
  const hasSawRef = useRef(false);
  
  // Telemetry
  const telemetryRef = useRef({
    maxLatchedPeak: 0,
    timeAtMaxLatched: 0,
    blocksLost: 0,
    timeToFirstBlockLost: -1,
    tonicBombUses: 0,
    enemiesSpawned: { normal: 0, heavy: 0, boss: 0 },
    enemiesKilled: { normal: 0, heavy: 0, boss: 0 },
  });
  
  // Scale-to-fit
  useEffect(() => {
    const computeScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / GAME_CONFIG.CANVAS_WIDTH, vh / GAME_CONFIG.CANVAS_HEIGHT);
      setScale(Math.max(0.5, Math.min(s, 1.2)));
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    window.addEventListener('orientationchange', computeScale);
    return () => {
      window.removeEventListener('resize', computeScale);
      window.removeEventListener('orientationchange', computeScale);
    };
  }, []);
  
  // Object pools
  const enemyPool = useObjectPool(createEnemy, GAME_CONFIG.MAX_ENEMIES);
  const projectilePool = useObjectPool(createProjectile, 80);
  const tipPool = useObjectPool(createTip, 30);
  const particlePool = useObjectPool(createParticle, GAME_CONFIG.MAX_PARTICLES);
  
  const initGame = useCallback(() => {
    const progression = loadProgression();
    
    endHandledRef.current = false;
    endReasonRef.current = null;
    coinsStartRef.current = progression.totalCoins;
    
    // Calculate multipliers from pips
    const damageMultiplier = 1 + progression.damagePips * GAME_CONFIG.DAMAGE_BONUS_PER_PIP;
    const powerRegenMult = 1 + progression.powerPips * GAME_CONFIG.POWER_REGEN_BONUS_PER_PIP;
    
    // Block count from blockCountLevel
    const blockCount = 1 + progression.blockCountLevel;
    
    // Initialize blocks
    const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
    const baseHp = GAME_CONFIG.BLOCK_MAX_HP;
    blocksRef.current = Array.from({ length: blockCount }, (_, i) => {
      // TODO: Apply block pip/EVO HP bonuses per slot
      const blockHp = i === 0 ? baseHp : Math.floor(baseHp * (1 + (progression.blockPips[i - 1] ?? 0) * 0.10));
      return {
        id: i,
        hp: blockHp,
        maxHp: blockHp,
        y: groundY - 30 - (i + 1) * GAME_CONFIG.BLOCK_HEIGHT,
        height: GAME_CONFIG.BLOCK_HEIGHT,
        destroyed: false,
      };
    });
    
    damageMultiplierRef.current = damageMultiplier;
    powerRegenMultiplierRef.current = powerRegenMult;
    
    // Check for saw weapon
    hasSawRef.current = progression.weaponSlots.some(s => s.weaponType === 'saw');
    
    // Reset all refs
    latchedCountRef.current = 0;
    screenShakeRef.current = { x: 0, y: 0, duration: 0 };
    lastAttackRef.current = -999;
    lastSpawnRef.current = -999;
    lastSawAttackRef.current = -999;
    powerRef.current = 0;
    timeRef.current = 0;
    tipsRef.current = 0;
    customersServedRef.current = 0;
    shotsFiredRef.current = 0;
    shotsHitRef.current = 0;
    spawnIndexRef.current = 0;
    coinsFromKillsRef.current = 0;
    coinsFromGateLumpsRef.current = 0;
    gateDamageDealtRef.current = [0, 0, 0, 0, 0];
    gateTimeSpentRef.current = [0, 0, 0, 0, 0];
    shotsToGateRef.current = 0;
    shotsToEnemiesRef.current = 0;
    bombGateDamageByGateRef.current = [0, 0, 0, 0, 0];
    gateCleanupTimerRef.current = 0;
    runIdRef.current = Date.now();
    gateDestroyedRef.current = [false, false, false, false, false];
    burstsTriggeredRef.current = 0;
    targetModeCountsRef.current = { front: 0, mid: 0, back: 0, gate: 0 };
    clearPurchaseLog();
    setShowRunSummary(false);
    
    telemetryRef.current = {
      maxLatchedPeak: 0, timeAtMaxLatched: 0,
      blocksLost: 0, timeToFirstBlockLost: -1,
      tonicBombUses: 0,
      enemiesSpawned: { normal: 0, heavy: 0, boss: 0 },
      enemiesKilled: { normal: 0, heavy: 0, boss: 0 },
    };
    
    // Clear pools
    enemyPool.clear();
    projectilePool.clear();
    tipPool.clear();
    particlePool.clear();
    
    // Reset state
    setPower(0);
    setTips(0);
    setTimeSurvived(0);
    
    // Boss reset
    bossStateRef.current = { isActive: false, hp: 0, maxHp: 0, spawnedAt: 0, addSpawnTimer: 0 };
    setBossState(bossStateRef.current);
    bossIncomingRef.current = 0;
    bossEnemyRef.current = null;
    
    // Stage/phase reset
    stageIndexRef.current = 1;
    setStageIndex(1);
    playPhaseRef.current = 'TRAVEL';
    setPlayPhase('TRAVEL');
    travelTimerRef.current = GAME_CONFIG.TRAVEL_DURATION;
    isSimulationFrozenRef.current = false;
    phaseTimersRef.current = { travel: 0, siege: 0, evoPick: 0, boss: 0 };
    gateBuildingRef.current = null;
    setGateBuildingState(null);
    setEvoPopupData(null);
  }, [enemyPool, projectilePool, tipPool, particlePool]);
  
  const handlePlay = useCallback((mode: GameMode) => {
    setGameMode(mode);
    initGame();
    setIsPaused(false);
    setGameState('PLAY');
  }, [initGame]);
  
  const handlePause = useCallback(() => setIsPaused(true), []);
  const handleContinue = useCallback(() => setIsPaused(false), []);
  
  const handleLeave = useCallback(() => {
    const coinsEarned = coinsFromKillsRef.current + coinsFromGateLumpsRef.current;
    if (coinsEarned > 0) {
      const current = loadProgression();
      saveProgression({ ...current, totalCoins: current.totalCoins + coinsEarned });
    }
    setIsPaused(false);
    setGameState('MENU');
  }, []);
  
  const buildTelemetry = useCallback((): RunTelemetry => {
    const t = telemetryRef.current;
    const hitRate = shotsFiredRef.current > 0 
      ? Math.round((shotsHitRef.current / shotsFiredRef.current) * 100) : 0;
    
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
    
    const prog = loadProgression();
    const coinsFromKills = coinsFromKillsRef.current;
    const coinsFromGateLumps = coinsFromGateLumpsRef.current;
    
    return {
      runId: runIdRef.current,
      telemetryBuiltAt: Date.now(),
      gameMode,
      stageReached: stageIndexRef.current,
      reachedBoss: bossStateRef.current.isActive || bossEnemyRef.current !== null || bossOutcome === 'defeated',
      bossOutcome, bossHpPercent,
      pipLevels: {
        blockPips: [...prog.blockPips],
        weaponPips: [...prog.weaponPips],
        powerPips: prog.powerPips,
        damagePips: prog.damagePips,
        blockCount: prog.blockCountLevel,
      },
      shotsFired: shotsFiredRef.current,
      shotsHit: shotsHitRef.current,
      hitRate,
      maxLatchedPeak: t.maxLatchedPeak,
      timeAtMaxLatched: t.timeAtMaxLatched,
      blocksLost: t.blocksLost,
      timeToFirstBlockLost: t.timeToFirstBlockLost,
      tonicBombUses: t.tonicBombUses,
      gateDamageDealt: [...gateDamageDealtRef.current],
      gateTimeSpent: [...gateTimeSpentRef.current],
      gateHpRemainingByGate: (() => {
        const result: number[] = [];
        for (let i = 0; i < 5; i++) {
          const stageReached = stageIndexRef.current;
          if (i < stageReached - 1) {
            // Previous stages: destroyed → 0, else shouldn't happen
            result.push(0);
          } else if (i === stageReached - 1) {
            // Current stage: read live gate HP
            const g = gateBuildingRef.current;
            result.push(g ? Math.max(0, g.hp) : (STAGES[i].gateHP ?? 0));
          } else {
            // Unreached: full HP
            result.push(STAGES[i].gateHP ?? 0);
          }
        }
        return result;
      })(),
      shotsToGate: shotsToGateRef.current,
      shotsToEnemies: shotsToEnemiesRef.current,
      bombGateDamageTotal: bombGateDamageByGateRef.current.reduce((a, b) => a + b, 0),
      bombGateDamageByGate: [...bombGateDamageByGateRef.current],
      gateDestroyedByGate: [...gateDestroyedRef.current],
      burstsTriggered: burstsTriggeredRef.current,
      targetModeCounts: { ...targetModeCountsRef.current },
      phaseAtDeath: playPhaseRef.current,
      timeInTravel: phaseTimersRef.current.travel,
      timeInSiege: phaseTimersRef.current.siege,
      timeInEvoPick: phaseTimersRef.current.evoPick,
      timeInBoss: phaseTimersRef.current.boss,
      enemiesSpawned: { ...t.enemiesSpawned },
      enemiesKilled: { ...t.enemiesKilled },
      coinsStart: coinsStartRef.current,
      coinsEnd: 0,
      coinsEarnedActual: 0,
      coinsFromKills,
      coinsFromGateLumps,
      clearBonusCoins: 0,
      coinsTotalBreakdown: coinsFromKills + coinsFromGateLumps,
      economyDelta: 0,
      deltaExplanation: '',
    };
  }, [gameMode]);
  
  const handleChapterClear = useCallback(() => {
    if (endHandledRef.current) return;
    endHandledRef.current = true;
    endReasonRef.current = 'clear';
    isSimulationFrozenRef.current = true;
    
    const capturedCoinsStart = coinsStartRef.current;
    const bossStage = getStage(6);
    const clearBonus = bossStage.clearBonus ?? 0;
    const killCoins = coinsFromKillsRef.current;
    const gateCoins = coinsFromGateLumpsRef.current;
    const totalToAdd = killCoins + gateCoins + clearBonus;
    
    const current = loadProgression();
    const newTotal = current.totalCoins + totalToAdd;
    
    saveProgression({
      ...current,
      chapter1Cleared: true,
      bestChapter1Time: current.bestChapter1Time > 0 
        ? Math.min(current.bestChapter1Time, timeRef.current) : timeRef.current,
      totalCoins: newTotal,
      bestStageReached: Math.max(current.bestStageReached, 6),
    });
    
    const telemetry = buildTelemetry();
    telemetry.bossOutcome = 'defeated';
    telemetry.bossHpPercent = 0;
    telemetry.clearBonusCoins = clearBonus;
    telemetry.coinsTotalBreakdown = killCoins + gateCoins + clearBonus;
    telemetry.coinsStart = capturedCoinsStart;
    telemetry.coinsEnd = newTotal;
    telemetry.coinsEarnedActual = newTotal - capturedCoinsStart;
    telemetry.economyDelta = telemetry.coinsEarnedActual - telemetry.coinsTotalBreakdown;
    
    if (Math.abs(telemetry.economyDelta) > 1) {
      telemetry.deltaExplanation = `Start:${capturedCoinsStart} End:${newTotal} Kills:${killCoins} Gates:${gateCoins} Clear:${clearBonus} → Δ=${telemetry.economyDelta}`;
    }
    
    setStats({
      timeSurvived: timeRef.current,
      customersServed: customersServedRef.current,
      totalTips: killCoins + gateCoins,
      coinsEarned: totalToAdd,
      isNewRecord: false,
      isChapterClear: true,
      stageReached: 6,
      telemetry,
    });
    setGameState('END');
    setShowRunSummary(true);
  }, [buildTelemetry]);
  
  const handleGameOver = useCallback(() => {
    if (endHandledRef.current) return;
    endHandledRef.current = true;
    endReasonRef.current = 'gameover';
    isSimulationFrozenRef.current = true;
    
    const capturedCoinsStart = coinsStartRef.current;
    const killCoins = coinsFromKillsRef.current;
    const gateCoins = coinsFromGateLumpsRef.current;
    const totalToAdd = killCoins + gateCoins;
    
    const current = loadProgression();
    const newTotal = current.totalCoins + totalToAdd;
    const isNewTimeRecord = timeRef.current > current.bestTimeSurvivedSeconds;
    
    saveProgression({
      ...current,
      bestTimeSurvivedSeconds: Math.max(current.bestTimeSurvivedSeconds, timeRef.current),
      bestCustomersServed: Math.max(current.bestCustomersServed, customersServedRef.current),
      totalCoins: newTotal,
      bestStageReached: Math.max(current.bestStageReached, stageIndexRef.current),
    });
    
    const telemetry = buildTelemetry();
    telemetry.coinsStart = capturedCoinsStart;
    telemetry.coinsEnd = newTotal;
    telemetry.coinsEarnedActual = newTotal - capturedCoinsStart;
    telemetry.coinsTotalBreakdown = totalToAdd;
    telemetry.economyDelta = telemetry.coinsEarnedActual - telemetry.coinsTotalBreakdown;
    
    if (Math.abs(telemetry.economyDelta) > 1) {
      telemetry.deltaExplanation = `Start:${capturedCoinsStart} End:${newTotal} Kills:${killCoins} Gates:${gateCoins} → Δ=${telemetry.economyDelta}`;
    }
    
    setStats({
      timeSurvived: timeRef.current,
      customersServed: customersServedRef.current,
      totalTips: killCoins + gateCoins,
      coinsEarned: totalToAdd,
      isNewRecord: isNewTimeRecord,
      stageReached: stageIndexRef.current,
      telemetry,
    });
    setGameState('END');
    setShowRunSummary(true);
  }, [buildTelemetry]);
  
  const handleHome = useCallback(() => setGameState('MENU'), []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // SPAWN ENEMY
  // ═══════════════════════════════════════════════════════════════════════
  const spawnEnemy = useCallback(() => {
    const activeCount = enemyPool.getActive().length;
    if (activeCount >= GAME_CONFIG.MAX_ENEMIES) return;
    
    const enemy = enemyPool.acquire();
    if (!enemy) return;
    
    const stage = getStage(stageIndexRef.current);
    const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
    
    // Heavy scheduling from stage config
    spawnIndexRef.current++;
    const isHeavy = stage.heavyEvery > 0 && (spawnIndexRef.current % stage.heavyEvery === 0);
    
    enemy.kind = isHeavy ? 'HEAVY' : 'NORMAL';
    
    if (isHeavy) telemetryRef.current.enemiesSpawned.heavy++;
    else telemetryRef.current.enemiesSpawned.normal++;
    
    const hpMult = isHeavy ? GAME_CONFIG.HEAVY_HP_MULT : 1;
    const speedMult = isHeavy ? GAME_CONFIG.HEAVY_SPEED_MULT : 1;
    const sizeMult = isHeavy ? GAME_CONFIG.HEAVY_SIZE_MULT : 1;
    
    enemy.x = GAME_CONFIG.CANVAS_WIDTH + 30;
    enemy.y = groundY;
    enemy.maxHp = Math.floor(GAME_CONFIG.ENEMY_BASE_HP * stage.enemyHpMult * hpMult);
    enemy.hp = enemy.maxHp;
    enemy.speed = GAME_CONFIG.ENEMY_BASE_SPEED * stage.enemySpeedMult * speedMult;
    enemy.width = Math.floor(GAME_CONFIG.ENEMY_WIDTH * sizeMult);
    enemy.height = Math.floor(GAME_CONFIG.ENEMY_HEIGHT * sizeMult);
    enemy.isServed = false;
    enemy.servedTimer = 0;
    enemy.state = 'WALKING';
    enemy.latchedTimer = 0;
    enemy.queuePosition = 0;
  }, [enemyPool]);
  
  const fireProjectile = useCallback((targetEnemy: Enemy, pierce = false, isSaw = false) => {
    const proj = projectilePool.acquire();
    if (!proj) return;
    
    const activeBlocks = blocksRef.current.filter(b => !b.destroyed);
    if (activeBlocks.length === 0) return;
    
    const topBlock = activeBlocks[activeBlocks.length - 1];
    proj.x = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
    proj.y = topBlock.y + GAME_CONFIG.MUZZLE_Y_OFFSET;
    proj.targetX = targetEnemy.x;
    proj.targetY = targetEnemy.y - targetEnemy.height / 2;
    const stressMultiplier = isStressTest ? 0.4 : 1;
    proj.damage = Math.floor((isSaw ? GAME_CONFIG.SAW_DAMAGE : GAME_CONFIG.PROJECTILE_DAMAGE) * damageMultiplierRef.current * stressMultiplier);
    proj.pierce = pierce;
    proj.isSaw = isSaw;
  }, [projectilePool, isStressTest]);
  
  // Fire projectile at raw coordinates (for shotgun/burst spread)
  const fireProjectileAt = useCallback((targetX: number, targetY: number, customDamage?: number, pierce = false, isSaw = false) => {
    const proj = projectilePool.acquire();
    if (!proj) return;
    
    const activeBlocks = blocksRef.current.filter(b => !b.destroyed);
    if (activeBlocks.length === 0) return;
    
    const topBlock = activeBlocks[activeBlocks.length - 1];
    proj.x = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
    proj.y = topBlock.y + GAME_CONFIG.MUZZLE_Y_OFFSET;
    proj.targetX = targetX;
    proj.targetY = targetY;
    proj.radius = GAME_CONFIG.PROJECTILE_RADIUS;
    const stressMultiplier = isStressTest ? 0.4 : 1;
    proj.damage = customDamage ?? Math.floor(GAME_CONFIG.PROJECTILE_DAMAGE * damageMultiplierRef.current * stressMultiplier);
    proj.pierce = pierce;
    proj.isSaw = isSaw;
  }, [projectilePool, isStressTest]);
  
  const spawnParticles = useCallback((x: number, y: number, type: Particle['type'], count: number) => {
    for (let i = 0; i < count; i++) {
      const p = particlePool.acquire();
      if (!p) break;
      p.x = x; p.y = y;
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
      } else if (type === 'crumble') {
        p.color = COLORS.gateCrumble;
        p.size = 6 + Math.random() * 8;
      }
    }
  }, [particlePool]);
  
  const spawnTip = useCallback((x: number, y: number, value: number) => {
    const tip = tipPool.acquire();
    if (!tip) return;
    tip.x = x; tip.y = y;
    tip.targetY = 60;
    tip.opacity = 1;
    tip.value = value;
  }, [tipPool]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // TONIC BOMB (damages enemies + gate)
  // ═══════════════════════════════════════════════════════════════════════
  const handleTonicBomb = useCallback(() => {
    if (powerRef.current < GAME_CONFIG.TONIC_BOMB_COST) return;
    
    telemetryRef.current.tonicBombUses++;
    powerRef.current -= GAME_CONFIG.TONIC_BOMB_COST;
    setPower(powerRef.current);
    
    screenShakeRef.current = { x: 0, y: 0, duration: 0.3 };
    
    const bombX = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH + 50;
    const bombY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET - 30;
    
    spawnParticles(bombX, bombY, 'confetti', 20);
    spawnParticles(bombX, bombY, 'steam', 10);
    
    // Damage enemies
    enemyPool.getActive().forEach(enemy => {
      if (enemy.state === 'SERVED' || enemy.isServed) return;
      const dx = enemy.x - bombX;
      const dy = (enemy.y - enemy.height / 2) - bombY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < GAME_CONFIG.TONIC_BOMB_RADIUS) {
        enemy.hp -= GAME_CONFIG.TONIC_BOMB_DAMAGE;
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', 3);
        if (enemy.hp <= 0 && enemy.state === 'LATCHED') {
          latchedCountRef.current = Math.max(0, latchedCountRef.current - 1);
        }
      }
    });
    
    // Damage gate building (bomb always damages gate)
    const gate = gateBuildingRef.current;
    if (gate && !gate.isDestroyed) {
      const gdx = gate.x + gate.width / 2 - bombX;
      const gdy = gate.y + gate.height / 2 - bombY;
      const gDist = Math.sqrt(gdx * gdx + gdy * gdy);
      if (gDist < GAME_CONFIG.TONIC_BOMB_RADIUS + gate.width) {
        gate.hp -= GAME_CONFIG.TONIC_BOMB_DAMAGE;
        const si = stageIndexRef.current - 1;
        if (si >= 0 && si < 5) {
          gateDamageDealtRef.current[si] += GAME_CONFIG.TONIC_BOMB_DAMAGE;
          bombGateDamageByGateRef.current[si] += GAME_CONFIG.TONIC_BOMB_DAMAGE;
        }
        spawnParticles(gate.x + gate.width / 2, gate.y, 'sparkle', 5);
      }
    }
  }, [enemyPool, spawnParticles]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // EVO CHOICE HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  const handleEvoChoice = useCallback((trait: EvoTrait) => {
    // Apply trait effects (run-persistent via persistence)
    // For now, just save the choice and unfreeze
    setEvoPopupData(null);
    isSimulationFrozenRef.current = false;
    
    // Advance to next stage or boss
    const currentStage = stageIndexRef.current;
    if (currentStage >= 5) {
      // After Stage 5, go to Boss
      stageIndexRef.current = 6;
      setStageIndex(6);
      playPhaseRef.current = 'BOSS';
      setPlayPhase('BOSS');
    } else {
      // Next gate
      stageIndexRef.current = currentStage + 1;
      setStageIndex(currentStage + 1);
      travelTimerRef.current = GAME_CONFIG.TRAVEL_DURATION;
      playPhaseRef.current = 'TRAVEL';
      setPlayPhase('TRAVEL');
    }
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // CREATE GATE BUILDING
  // ═══════════════════════════════════════════════════════════════════════
  const createGateBuilding = useCallback((si: number) => {
    const stage = getStage(si);
    if (stage.isBoss || !stage.gateHP) return null;
    
    const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
    const gate: GateBuilding = {
      hp: stage.gateHP,
      maxHp: stage.gateHP,
      x: GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.GATE_BUILDING_X_OFFSET,
      y: groundY - GAME_CONFIG.GATE_BUILDING_HEIGHT,
      width: GAME_CONFIG.GATE_BUILDING_WIDTH,
      height: GAME_CONFIG.GATE_BUILDING_HEIGHT,
      isDestroyed: false,
      stageIndex: si,
      breathingActive: false,
      breathingTimer: 0,
      crossedThresholds: [],
      crumbleTimer: 0,
    };
    return gate;
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════
  const gameLoop = useCallback((deltaTime: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const blocks = blocksRef.current;
    const currentTime = timeRef.current;
    
    // Phase time tracking
    const phaseKey = playPhaseRef.current === 'EVO_PICK' ? 'evoPick' 
      : playPhaseRef.current.toLowerCase() as 'travel' | 'siege' | 'boss';
    phaseTimersRef.current[phaseKey] += deltaTime;
    
    // Simulation freeze (EVO popup)
    if (isSimulationFrozenRef.current) {
      ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      drawGame(ctx, blocks, enemyPool.getActive(), projectilePool.getActive(),
        tipPool.getActive(), particlePool.getActive(), screenShakeRef.current,
        bossStateRef.current, bossIncomingRef.current, playPhaseRef.current,
        deltaTime, gateBuildingRef.current);
      return;
    }
    
    // ── Time + HUD Throttle ──
    timeRef.current += deltaTime;
    hudAccumulatorRef.current += deltaTime;
    const shouldUpdateHUD = hudAccumulatorRef.current >= 0.1;
    if (shouldUpdateHUD) {
      hudAccumulatorRef.current = 0;
      setTimeSurvived(timeRef.current);
      fpsRef.current = 0.9 * fpsRef.current + 0.1 * (1 / deltaTime);
      
      setDebugInfo({
        fps: fpsRef.current,
        activeEnemies: enemyPool.getActive().length,
        effectiveSpawnInterval: getStage(stageIndexRef.current).spawnInterval,
        latchedCount: latchedCountRef.current,
        shotsFired: shotsFiredRef.current,
        shotsHit: shotsHitRef.current,
        heavyCount: enemyPool.getActive().filter(e => e.kind === 'HEAVY' && !e.isServed).length,
        activeProjectiles: projectilePool.getActive().length,
        power: powerRef.current,
        stageIndex: stageIndexRef.current,
        gateHpPercent: gateBuildingRef.current ? Math.round((gateBuildingRef.current.hp / gateBuildingRef.current.maxHp) * 100) : 0,
        gateDamageDealt: gateDamageDealtRef.current[Math.max(0, stageIndexRef.current - 1)] ?? 0,
      });
      setBossState({ ...bossStateRef.current });
      setGateBuildingState(gateBuildingRef.current ? { ...gateBuildingRef.current } : null);
    }
    
    // ── Power regeneration (uncapped) ──
    if (powerRef.current < GAME_CONFIG.POWER_POOL_SOFT_CAP) {
      const effectiveRegen = GAME_CONFIG.POWER_START_REGEN * powerRegenMultiplierRef.current;
      powerRef.current = Math.min(GAME_CONFIG.POWER_POOL_SOFT_CAP, powerRef.current + effectiveRegen * deltaTime);
      if (shouldUpdateHUD) setPower(powerRef.current);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TRAVEL PHASE
    // ═══════════════════════════════════════════════════════════════════
    if (playPhaseRef.current === 'TRAVEL') {
      travelTimerRef.current -= deltaTime;
      
      // Despawn remaining enemies during travel
      enemyPool.getActive().forEach(enemy => {
        if (enemy.state !== 'SERVED' && !enemy.isServed) {
          enemy.hp = 0;
          enemy.state = 'SERVED';
          enemy.isServed = true;
          enemy.servedTimer = GAME_CONFIG.TRAVEL_DESPAWN_DELAY;
        }
      });
      
      if (travelTimerRef.current <= 0) {
        const si = stageIndexRef.current;
        const stage = getStage(si);
        
        if (stage.isBoss) {
          playPhaseRef.current = 'BOSS';
          setPlayPhase('BOSS');
        } else {
          // Create gate building for this stage
          gateBuildingRef.current = createGateBuilding(si);
          setGateBuildingState(gateBuildingRef.current);
          playPhaseRef.current = 'SIEGE';
          setPlayPhase('SIEGE');
          lastSpawnRef.current = timeRef.current;
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // GATE CLEANUP (victory pulse after gate destruction)
    // ═══════════════════════════════════════════════════════════════════
    if (gateCleanupTimerRef.current > 0) {
      gateCleanupTimerRef.current -= deltaTime;
      
      // Fade remaining enemies
      enemyPool.getActive().forEach(enemy => {
        if (enemy.state !== 'SERVED' && !enemy.isServed) {
          enemy.hp = 0;
          enemy.state = 'SERVED';
          enemy.isServed = true;
          enemy.servedTimer = 0.3;
        }
      });
      
      if (gateCleanupTimerRef.current <= 0) {
        // Gate clear complete — show EVO_PICK if applicable, else travel
        // For Phase 1, we go directly to travel (EVO popups triggered from Garage)
        // Simple: award lump sum and advance
        const si = stageIndexRef.current;
        if (si >= 5) {
          // After Stage 5 gate, go to boss
          stageIndexRef.current = 6;
          setStageIndex(6);
          travelTimerRef.current = GAME_CONFIG.TRAVEL_DURATION;
          playPhaseRef.current = 'TRAVEL';
          setPlayPhase('TRAVEL');
        } else {
          stageIndexRef.current = si + 1;
          setStageIndex(si + 1);
          travelTimerRef.current = GAME_CONFIG.TRAVEL_DURATION;
          playPhaseRef.current = 'TRAVEL';
          setPlayPhase('TRAVEL');
        }
        
        gateBuildingRef.current = null;
        setGateBuildingState(null);
      }
      
      // Skip rest of sim during cleanup
      ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      drawGame(ctx, blocks, enemyPool.getActive(), projectilePool.getActive(),
        tipPool.getActive(), particlePool.getActive(), screenShakeRef.current,
        bossStateRef.current, bossIncomingRef.current, playPhaseRef.current,
        deltaTime, gateBuildingRef.current);
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // BOSS SPAWN LOGIC
    // ═══════════════════════════════════════════════════════════════════
    if (playPhaseRef.current === 'BOSS') {
      if (bossIncomingRef.current > 0) {
        bossIncomingRef.current -= deltaTime;
        if (bossIncomingRef.current <= 0) {
          bossIncomingRef.current = -1;
          const bossEnemy = enemyPool.acquire();
          if (bossEnemy) {
            const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
            const bossHP = getStage(6).bossHP ?? 10000;
            bossEnemy.kind = 'BOSS';
            bossEnemy.x = GAME_CONFIG.CANVAS_WIDTH + 50;
            bossEnemy.y = groundY;
            bossEnemy.maxHp = bossHP;
            bossEnemy.hp = bossHP;
            bossEnemy.speed = GAME_CONFIG.ENEMY_BASE_SPEED * GAME_CONFIG.BOSS_SPEED_MULT;
            bossEnemy.width = Math.floor(GAME_CONFIG.ENEMY_WIDTH * GAME_CONFIG.BOSS_SIZE_MULT);
            bossEnemy.height = Math.floor(GAME_CONFIG.ENEMY_HEIGHT * GAME_CONFIG.BOSS_SIZE_MULT);
            bossEnemy.isServed = false;
            bossEnemy.servedTimer = 0;
            bossEnemy.state = 'WALKING';
            bossEnemy.latchedTimer = 0;
            bossEnemyRef.current = bossEnemy;
            bossStateRef.current = {
              isActive: true, hp: bossHP, maxHp: bossHP,
              spawnedAt: currentTime, addSpawnTimer: 0,
            };
            telemetryRef.current.enemiesSpawned.boss++;
          }
        }
      } else if (!bossStateRef.current.isActive && bossEnemyRef.current === null && bossIncomingRef.current === 0) {
        bossIncomingRef.current = GAME_CONFIG.BOSS_INCOMING_BANNER_DURATION;
      }
      
      // Update boss state
      if (bossStateRef.current.isActive && bossEnemyRef.current) {
        bossStateRef.current.hp = bossEnemyRef.current.hp;
        if (bossEnemyRef.current.hp <= 0 || bossEnemyRef.current.isServed) {
          bossStateRef.current.isActive = false;
          bossEnemyRef.current = null;
          handleChapterClear();
          return;
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SIEGE: Gate breathing windows
    // ═══════════════════════════════════════════════════════════════════
    const gate = gateBuildingRef.current;
    if (gate && !gate.isDestroyed && playPhaseRef.current === 'SIEGE') {
      // Track time at gate
      const si = stageIndexRef.current - 1;
      if (si >= 0 && si < 5) gateTimeSpentRef.current[si] += deltaTime;
      
      // Check breathing thresholds
      const hpPercent = gate.hp / gate.maxHp;
      for (const threshold of GAME_CONFIG.GATE_BREATHING_THRESHOLDS) {
        if (hpPercent <= threshold && !gate.crossedThresholds.includes(threshold)) {
          gate.crossedThresholds.push(threshold);
          gate.breathingActive = true;
          gate.breathingTimer = GAME_CONFIG.GATE_BREATHING_SLOWDOWN_DURATION;
        }
      }
      
      if (gate.breathingActive) {
        gate.breathingTimer -= deltaTime;
        if (gate.breathingTimer <= 0) {
          gate.breathingActive = false;
        }
      }
      
      // Check gate destruction
      if (gate.hp <= 0) {
        gate.isDestroyed = true;
        gateDestroyedRef.current[stageIndexRef.current - 1] = true;
        
        // Award lump sum
        const stage = getStage(stageIndexRef.current);
        coinsFromGateLumpsRef.current += stage.gateLumpSum;
        tipsRef.current += stage.gateLumpSum;
        if (shouldUpdateHUD) setTips(tipsRef.current);
        
        // Victory pulse
        spawnParticles(gate.x + gate.width / 2, gate.y, 'crumble', 15);
        spawnParticles(gate.x + gate.width / 2, gate.y + gate.height / 2, 'confetti', 20);
        screenShakeRef.current = { x: 0, y: 0, duration: 0.5 };
        
        // Start cleanup timer
        gateCleanupTimerRef.current = GAME_CONFIG.GATE_CLEANUP_DURATION;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SPAWNING (only during SIEGE phase)
    // ═══════════════════════════════════════════════════════════════════
    const canSpawn = playPhaseRef.current === 'SIEGE' && gate && !gate.isDestroyed;
    
    if (canSpawn) {
      const stage = getStage(stageIndexRef.current);
      let spawnInterval = stage.spawnInterval;
      
      // Breathing window: slower spawns
      if (gate!.breathingActive) {
        spawnInterval *= GAME_CONFIG.GATE_BREATHING_SPAWN_MULT;
      }
      
      const effectiveInterval = Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, spawnInterval);
      
      if (currentTime - lastSpawnRef.current > effectiveInterval / 1000) {
        spawnEnemy();
        lastSpawnRef.current = currentTime;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // AUTO-ATTACK
    // ═══════════════════════════════════════════════════════════════════
    const enemies = enemyPool.getActive().filter(e => !e.isServed && e.state !== 'SERVED');
    
    if (enemies.length > 0 && currentTime - lastAttackRef.current > GAME_CONFIG.AUTO_ATTACK_INTERVAL / 1000) {
      const cartX = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
      
      // Find nearest enemy (always needed as fallback)
      let nearest = enemies[0];
      let minDist = Math.abs(enemies[0].x - cartX);
      enemies.forEach(e => {
        const dist = Math.abs(e.x - cartX);
        if (dist < minDist) { minDist = dist; nearest = e; }
      });
      
      if (GAME_CONFIG.WEAPON_MODE === 'shotgun') {
        const activeBlocks = blocksRef.current.filter(b => !b.destroyed);
        if (activeBlocks.length > 0) {
          const originX = cartX;
          const topBlock = activeBlocks[activeBlocks.length - 1];
          const originY = topBlock.y + GAME_CONFIG.MUZZLE_Y_OFFSET;
          
          // ── Smart target selection (TDS-style variety) ──
          const crowding = enemies.filter(e => e.x < cartX + GAME_CONFIG.CROWDING_RANGE).length;
          const weights = crowding >= GAME_CONFIG.CROWDING_THRESHOLD
            ? GAME_CONFIG.TARGET_WEIGHTS_CROWDED
            : GAME_CONFIG.TARGET_WEIGHTS_NORMAL;
          
          // Weighted random pick
          const roll = Math.random();
          let cumulative = 0;
          let targetMode: 'front' | 'mid' | 'back' | 'gate' = 'front';
          const modes: Array<'front' | 'mid' | 'back' | 'gate'> = ['front', 'mid', 'back', 'gate'];
          for (let m = 0; m < 4; m++) {
            cumulative += weights[m];
            if (roll < cumulative) { targetMode = modes[m]; break; }
          }
          
          // Determine aim target based on mode
          let aimTarget: { x: number; y: number };
          const sorted = [...enemies].sort((a, b) => a.x - b.x);
          
          if (targetMode === 'mid' && sorted.length >= 3) {
            const midStart = Math.floor(sorted.length * 0.3);
            const midEnd = Math.floor(sorted.length * 0.7);
            const midEnemies = sorted.slice(midStart, Math.max(midEnd, midStart + 1));
            const pick = midEnemies[Math.floor(Math.random() * midEnemies.length)];
            aimTarget = { x: pick.x, y: pick.y - pick.height / 2 };
          } else if (targetMode === 'back' && sorted.length >= 2) {
            const backStart = Math.floor(sorted.length * 0.7);
            const backEnemies = sorted.slice(backStart);
            const pick = backEnemies[Math.floor(Math.random() * backEnemies.length)];
            aimTarget = { x: pick.x, y: pick.y - pick.height / 2 };
          } else if (targetMode === 'gate' && gateBuildingRef.current && !gateBuildingRef.current.isDestroyed) {
            const g = gateBuildingRef.current;
            aimTarget = { x: g.x - 40, y: originY + (Math.random() * 70 - 35) };
          } else {
            // front (default / fallback)
            targetMode = 'front';
            aimTarget = { x: nearest.x, y: nearest.y - nearest.height / 2 };
          }
          
          targetModeCountsRef.current[targetMode]++;
          
          // Apply Y jitter + tilt (TDS feel)
          const jitteredY = aimTarget.y + GAME_CONFIG.AIM_Y_TILT + (Math.random() * 2 - 1) * GAME_CONFIG.AIM_Y_JITTER;
          
          const baseAngle = Math.atan2(jitteredY - originY, aimTarget.x - originX);
          const distance = Math.sqrt((aimTarget.x - originX) ** 2 + (jitteredY - originY) ** 2);
          
          // Dynamic spread: wider when target is further
          const distanceFactor = 1 + (distance / 300) * GAME_CONFIG.SHOTGUN_SPREAD_DISTANCE_SCALE;
          const effectiveSpreadDeg = Math.min(
            Math.max(GAME_CONFIG.SHOTGUN_SPREAD_DEG * distanceFactor, GAME_CONFIG.SHOTGUN_SPREAD_DEG_MIN),
            GAME_CONFIG.SHOTGUN_SPREAD_DEG_MAX
          );
          const spreadRad = effectiveSpreadDeg * (Math.PI / 180);
          
          const count = Math.min(GAME_CONFIG.SHOTGUN_PELLETS, 6);
          
          // Compute per-pellet damage (DPS preserved)
          const stressMultiplier = isStressTest ? 0.4 : 1;
          const baseDamage = Math.floor(GAME_CONFIG.PROJECTILE_DAMAGE * damageMultiplierRef.current * stressMultiplier);
          let pelletDamages: number[];
          if (GAME_CONFIG.SHOTGUN_DAMAGE_SPLIT === 'weighted_center') {
            const rawWeights = Array.from({ length: count }, (_, i) => {
              const center = (count - 1) / 2;
              return 1 + (1 - Math.abs(i - center) / Math.max(center, 1));
            });
            const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
            pelletDamages = rawWeights.map(w => Math.max(1, Math.round((w / totalWeight) * baseDamage)));
          } else {
            pelletDamages = Array(count).fill(Math.max(1, Math.round(baseDamage / count)));
          }
          
          for (let i = 0; i < count; i++) {
            const offset = spreadRad * (i - (count - 1) / 2) / Math.max(count - 1, 1);
            const angle = baseAngle + offset;
            const projTargetX = originX + Math.cos(angle) * distance;
            const projTargetY = originY + Math.sin(angle) * distance;
            fireProjectileAt(projTargetX, projTargetY, pelletDamages[i]);
          }
          shotsFiredRef.current += count;
          burstsTriggeredRef.current++;
        }
      } else {
        // Single mode: current behavior
        fireProjectile(nearest);
        shotsFiredRef.current++;
      }
      lastAttackRef.current = currentTime;
    }
    
    // Saw auto-attack (if equipped)
    if (hasSawRef.current && enemies.length > 0 && currentTime - lastSawAttackRef.current > GAME_CONFIG.SAW_FIRE_RATE / 1000) {
      const cartX = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
      let nearest = enemies[0];
      let minDist = Math.abs(enemies[0].x - cartX);
      enemies.forEach(e => {
        const dist = Math.abs(e.x - cartX);
        if (dist < minDist) { minDist = dist; nearest = e; }
      });
      
      fireProjectile(nearest, true, true); // pierce + saw
      lastSawAttackRef.current = currentTime;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UPDATE PROJECTILES (with LoS + gate collision)
    // ═══════════════════════════════════════════════════════════════════
    projectilePool.getActive().forEach(proj => {
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        const speed = proj.speed * deltaTime;
        proj.x += (dx / dist) * speed;
        proj.y += (dy / dist) * speed;
      }
      
      // Check enemy collision
      let hitEnemy = false;
      enemyPool.getActive().forEach(enemy => {
        if (hitEnemy && !proj.pierce) return;
        if (enemy.isServed || enemy.state === 'SERVED') return;
        
        const ex = enemy.x;
        const ey = enemy.y - enemy.height / 2;
        const hitDist = Math.sqrt((proj.x - ex) ** 2 + (proj.y - ey) ** 2);
        
        if (hitDist < enemy.width / 2 + proj.radius + 5) {
          enemy.hp -= proj.damage;
          shotsHitRef.current++;
          shotsToEnemiesRef.current++;
          spawnParticles(proj.x, proj.y, 'sparkle', 3);
          hitEnemy = true;
          if (!proj.pierce) {
            projectilePool.release(proj);
          }
        }
      });
      
      // Gate collision (only if projectile wasn't stopped by enemy)
      if (!hitEnemy || proj.pierce) {
        const g = gateBuildingRef.current;
        if (g && !g.isDestroyed && proj.x >= g.x && proj.x <= g.x + g.width &&
            proj.y >= g.y && proj.y <= g.y + g.height) {
          g.hp -= proj.damage;
          const si = stageIndexRef.current - 1;
          if (si >= 0 && si < 5) gateDamageDealtRef.current[si] += proj.damage;
          shotsToGateRef.current++;
          spawnParticles(proj.x, proj.y, 'sparkle', 2);
          projectilePool.release(proj);
          return;
        }
      }
      
      // Out of bounds
      if (!hitEnemy && (proj.x > GAME_CONFIG.CANVAS_WIDTH + 50 || dist <= 1)) {
        projectilePool.release(proj);
      }
    });
    
    // ═══════════════════════════════════════════════════════════════════
    // UPDATE ENEMIES
    // ═══════════════════════════════════════════════════════════════════
    const activeBlocks = blocks.filter(b => !b.destroyed);
    const cartRightEdge = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;
    const maxLatched = GAME_CONFIG.MAX_LATCHED_ENEMIES;
    
    if (latchedCountRef.current > telemetryRef.current.maxLatchedPeak) {
      telemetryRef.current.maxLatchedPeak = latchedCountRef.current;
    }
    if (latchedCountRef.current >= maxLatched) {
      telemetryRef.current.timeAtMaxLatched += deltaTime;
    }
    
    let queuedCount = 0;
    
    enemyPool.getActive().forEach(enemy => {
      // SERVED state
      if (enemy.state === 'SERVED' || enemy.isServed) {
        enemy.servedTimer -= deltaTime;
        enemy.x += GAME_CONFIG.SERVED_EXIT_SPEED * deltaTime;
        if (enemy.servedTimer <= 0 || enemy.x > GAME_CONFIG.CANVAS_WIDTH + 50) {
          enemyPool.release(enemy);
        }
        return;
      }
      
      // Check if just killed (HP <= 0)
      if (enemy.hp <= 0) {
        if (enemy.state === 'LATCHED') {
          const slotsUsed = enemy.kind === 'BOSS' ? GAME_CONFIG.BOSS_LATCH_SLOTS : 1;
          latchedCountRef.current = Math.max(0, latchedCountRef.current - slotsUsed);
        }
        
        enemy.state = 'SERVED';
        enemy.isServed = true;
        enemy.servedTimer = GAME_CONFIG.SERVED_EXIT_DURATION;
        customersServedRef.current++;
        
        // Track kills
        if (enemy.kind === 'BOSS') telemetryRef.current.enemiesKilled.boss++;
        else if (enemy.kind === 'HEAVY') telemetryRef.current.enemiesKilled.heavy++;
        else telemetryRef.current.enemiesKilled.normal++;
        
        // Drop coins (stage-based)
        const stage = getStage(stageIndexRef.current);
        const coinDrop = enemy.kind === 'BOSS' ? (stage.bossDropCoins ?? stage.enemyDropCoins) : stage.enemyDropCoins;
        coinsFromKillsRef.current += coinDrop;
        tipsRef.current += coinDrop;
        if (shouldUpdateHUD) setTips(tipsRef.current);
        
        // Spawn tip visual
        spawnTip(enemy.x, enemy.y - enemy.height, coinDrop);
        
        // Celebration particles
        const pCount = enemy.kind === 'BOSS' ? 10 : 3;
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'heart', pCount);
        spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', pCount + 2);
        if (enemy.kind === 'BOSS') spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'confetti', 20);
        return;
      }
      
      // LATCHED state
      if (enemy.state === 'LATCHED') {
        enemy.latchedTimer -= deltaTime;
        if (enemy.latchedTimer <= 0 && activeBlocks.length > 0) {
          const targetBlock = activeBlocks[activeBlocks.length - 1];
          let tickDamage = GAME_CONFIG.LATCHED_TICK_DAMAGE;
          if (enemy.kind === 'BOSS') tickDamage *= GAME_CONFIG.BOSS_TICK_DAMAGE_MULT;
          else if (enemy.kind === 'HEAVY') tickDamage *= GAME_CONFIG.HEAVY_TICK_DAMAGE_MULT;
          targetBlock.hp -= tickDamage;
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          
          spawnParticles(cartRightEdge, targetBlock.y + GAME_CONFIG.BLOCK_HEIGHT / 2, 'steam', enemy.kind === 'BOSS' ? 5 : 2);
          
          if (targetBlock.hp <= 0) {
            targetBlock.destroyed = true;
            telemetryRef.current.blocksLost++;
            if (telemetryRef.current.timeToFirstBlockLost < 0) {
              telemetryRef.current.timeToFirstBlockLost = timeRef.current;
            }
            spawnParticles(GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH / 2, targetBlock.y, 'steam', 15);
            if (blocks.filter(b => !b.destroyed).length === 0) {
              handleGameOver();
            }
          }
        }
        return;
      }
      
      // QUEUED state
      if (enemy.state === 'QUEUED') {
        if (latchedCountRef.current < maxLatched) {
          enemy.state = 'LATCHED';
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          enemy.x = cartRightEdge + enemy.width / 2;
          latchedCountRef.current++;
        } else {
          queuedCount++;
          const targetX = cartRightEdge + enemy.width / 2 + queuedCount * (enemy.width + GAME_CONFIG.LATCHED_QUEUE_SPACING);
          if (enemy.x > targetX) {
            enemy.x -= enemy.speed * 0.3 * deltaTime;
            enemy.x = Math.max(enemy.x, targetX);
          }
        }
        return;
      }
      
      // WALKING state
      enemy.x -= enemy.speed * deltaTime;
      
      if (enemy.x - enemy.width / 2 < cartRightEdge) {
        const slotsNeeded = enemy.kind === 'BOSS' ? GAME_CONFIG.BOSS_LATCH_SLOTS : 1;
        if (latchedCountRef.current + slotsNeeded <= maxLatched && activeBlocks.length > 0) {
          enemy.state = 'LATCHED';
          enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
          enemy.x = cartRightEdge + enemy.width / 2;
          latchedCountRef.current += slotsNeeded;
        } else if (activeBlocks.length > 0) {
          enemy.state = 'QUEUED';
        }
      }
    });
    
    // Update tips
    tipPool.getActive().forEach(tip => {
      tip.y -= GAME_CONFIG.TIP_FLOAT_SPEED * deltaTime;
      tip.opacity = Math.max(0, tip.opacity - deltaTime * 0.5);
      if (tip.y < tip.targetY || tip.opacity <= 0) {
        tipPool.release(tip);
      }
    });
    
    // Update particles
    particlePool.getActive().forEach(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 100 * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) particlePool.release(p);
    });
    
    // Screen shake
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
    drawGame(ctx, blocks, enemyPool.getActive(), projectilePool.getActive(),
      tipPool.getActive(), particlePool.getActive(), screenShakeRef.current,
      bossStateRef.current, bossIncomingRef.current, playPhaseRef.current,
      deltaTime, gateBuildingRef.current);
  }, [
    enemyPool, projectilePool, tipPool, particlePool,
    spawnEnemy, fireProjectile, spawnParticles, spawnTip,
    handleGameOver, handleChapterClear, createGateBuilding,
  ]);
  
  useGameLoop(gameLoop, gameState === 'PLAY' && !isPaused);
  
  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    if (gameState === 'MENU') {
      const progression = loadProgression();
      const blockCount = 1 + progression.blockCountLevel;
      drawMenuScene(ctx, blockCount);
    }
  }, [gameState, progressionVersion]);
  
  const canUseBomb = powerRef.current >= GAME_CONFIG.TONIC_BOMB_COST;
  
  return (
    <div className="cr-viewport">
      <div 
        className="cr-stage"
        style={{
          width: GAME_CONFIG.CANVAS_WIDTH,
          height: GAME_CONFIG.CANVAS_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {gameState === 'MENU' && (
          <GarageOverlay 
            onPlay={handlePlay} 
            blockCount={1 + loadProgression().blockCountLevel}
            onProgressionChange={() => setProgressionVersion(v => v + 1)}
          />
        )}
        
        {gameState === 'PLAY' && !isPaused && (
          <GameHUD
            timeSurvived={timeSurvived}
            tips={tips}
            power={power}
            onTonicBomb={handleTonicBomb}
            canUseBomb={canUseBomb}
            onPause={handlePause}
            gameMode={gameMode}
            bossState={bossState}
            bossIncomingTimer={bossIncomingRef.current}
            playPhase={playPhase}
            stageIndex={stageIndex}
            gateBuilding={gateBuildingState}
          />
        )}
        
        {/* EVO Popup */}
        {gameState === 'PLAY' && evoPopupData && (
          <EvoPopup
            options={evoPopupData.options}
            onSelect={handleEvoChoice}
          />
        )}
        
        {gameState === 'PLAY' && isPaused && (
          <PauseMenu
            tipsSoFar={tipsRef.current}
            onContinue={handleContinue}
            onLeave={handleLeave}
          />
        )}
        
        {gameState === 'PLAY' && !isPaused && (
          <DebugHUD
            fps={debugInfo.fps}
            activeEnemies={debugInfo.activeEnemies}
            maxEnemies={GAME_CONFIG.MAX_ENEMIES}
            latchedCount={debugInfo.latchedCount}
            shotsFired={debugInfo.shotsFired}
            shotsHit={debugInfo.shotsHit}
            heavyCount={debugInfo.heavyCount}
            activeProjectiles={debugInfo.activeProjectiles}
            power={debugInfo.power}
            stageIndex={debugInfo.stageIndex}
            gateHpPercent={debugInfo.gateHpPercent}
            gateDamageDealt={debugInfo.gateDamageDealt}
            gameMode={gameMode}
            bossState={bossState}
            isVisible={showDebug}
            isStressTest={isStressTest}
            onToggle={() => setShowDebug(prev => !prev)}
            onStressTestToggle={() => setIsStressTest(prev => !prev)}
          />
        )}
        
        {gameState === 'END' && showRunSummary && (
          <RunSummaryOverlay
            stats={stats}
            purchaseLog={getPurchaseLog()}
            onContinue={() => {
              clearPurchaseLog();
              setShowRunSummary(false);
            }}
          />
        )}
        
        {gameState === 'END' && !showRunSummary && (
          <EndScreen 
            stats={stats}
            onPlayAgain={() => handlePlay(gameMode)} 
            onHome={handleHome}
            gameMode={gameMode}
          />
        )}
      </div>
    </div>
  );
};
