import React, { useState } from 'react';
import { GAME_CONFIG } from './config';
import { loadProgression, saveProgression, addDebugCoins } from './persistence';
import type { BossState, GameMode } from './types';

interface DebugHUDProps {
  fps: number;
  minFps: number;
  activeEnemies: number;
  maxEnemies: number;
  maxActiveEnemiesSeen: number;
  effectiveSpawnInterval: number;
  isMorningRush: boolean;
  damageMultiplier: number;
  energyRegenMultiplier: number;
  effectiveBlockHp: number;
  isVisible: boolean;
  isStressTest: boolean;
  latchedCount: number;
  breatherTimer: number;
  currentTargetId: number | null;
  currentTargetX: number | null;
  lastAttackDelta: number;
  activeProjectiles: number;
  shotsFired: number;
  shotsHit: number;
  heavyCount: number;
  gameMode: GameMode;
  bossState: BossState;
  checkpointIndex: number;
  onToggle: () => void;
  onStressTestToggle: () => void;
}

export const DebugHUD: React.FC<DebugHUDProps> = ({
  fps,
  minFps,
  activeEnemies,
  maxEnemies,
  maxActiveEnemiesSeen,
  effectiveSpawnInterval,
  isMorningRush,
  damageMultiplier,
  energyRegenMultiplier,
  effectiveBlockHp,
  isVisible,
  isStressTest,
  latchedCount,
  breatherTimer,
  currentTargetId,
  currentTargetX,
  lastAttackDelta,
  activeProjectiles,
  shotsFired,
  shotsHit,
  heavyCount,
  gameMode,
  bossState,
  checkpointIndex,
  onToggle,
  onStressTestToggle,
}) => {
  const [isCompact, setIsCompact] = useState(true);
  const [showDevTools, setShowDevTools] = useState(false);
  
  const maxLatched = isMorningRush 
    ? GAME_CONFIG.MAX_LATCHED_ENEMIES + GAME_CONFIG.RUSH_LATCHED_BONUS
    : GAME_CONFIG.MAX_LATCHED_ENEMIES;

  // Dev tool handlers
  const handleAddCoins = () => {
    const newTotal = addDebugCoins(200);
    alert(`+200 coins! Total: ${newTotal}`);
  };
  
  const handleSetUpgradePreset = (level: number) => {
    const prog = loadProgression();
    prog.upgradeLevels = {
      espressoDamageLevel: Math.min(level, GAME_CONFIG.UPGRADE_MAX_LEVEL),
      energyRegenLevel: Math.min(level, GAME_CONFIG.UPGRADE_MAX_LEVEL),
      blockCountLevel: Math.min(level, GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL),
    };
    prog.cargoBoxHpLevels = prog.cargoBoxHpLevels.map(() => Math.min(level, GAME_CONFIG.UPGRADE_MAX_LEVEL));
    saveProgression(prog);
    alert(`Upgrades set to level ${level}. Restart game to apply.`);
  };

  // FPS color helper
  const getFpsColor = (value: number) => {
    if (value < 30) return 'text-red-400';
    if (value < 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className="fixed top-2 left-2 z-50 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono backdrop-blur-sm"
      >
        {isVisible ? '🐛 Hide' : '🐛 Debug'}
      </button>

      {/* Compact Debug Panel */}
      {isVisible && (
        <div 
          className="fixed top-10 left-2 z-50 w-[92vw] max-w-[420px] max-h-[35vh] 
                     rounded-xl bg-black/75 text-white text-[11px] leading-4 
                     backdrop-blur-sm px-3 py-2 overflow-y-auto pointer-events-auto"
        >
          {/* Header with mode toggle */}
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/20">
            <span className="font-bold text-gold">DEBUG</span>
            <div className="flex gap-1">
              <button
                onClick={() => setIsCompact(!isCompact)}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px]"
              >
                {isCompact ? '📖 Full' : '📑 Compact'}
              </button>
              <button
                onClick={onStressTestToggle}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  isStressTest 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isStressTest ? '🔥' : '⚡'}
              </button>
            </div>
          </div>

          {/* Core Metrics Grid - Always visible */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {/* FPS */}
            <div className={getFpsColor(fps)}>FPS: {fps.toFixed(0)}</div>
            <div className={getFpsColor(minFps)}>Min: {minFps.toFixed(0)}</div>
            
            {/* Enemies */}
            <div className={activeEnemies > maxEnemies ? 'text-red-400 font-bold' : ''}>
              Enemies: {activeEnemies}/{maxEnemies}
            </div>
            <div className="text-amber-400">Heavy: {heavyCount}</div>
            
            {/* Latched & Rush */}
            <div className={latchedCount >= maxLatched ? 'text-red-400 font-bold' : 'text-orange-300'}>
              Latched: {latchedCount}/{maxLatched}
            </div>
            {/* Phase 2D: Explicit Rush/Boss flags side by side */}
            <div className="flex gap-2">
              <span className={isMorningRush ? 'text-warm-orange font-bold' : 'text-gray-500'}>
                R:{isMorningRush ? '✓' : '✗'}
              </span>
              <span className={bossState.isActive ? 'text-red-400 font-bold animate-pulse' : 'text-gray-500'}>
                B:{bossState.isActive ? '✓' : '✗'}
              </span>
            </div>
            
            {/* Shots */}
            <div className="text-cyan-300">
              Shots: {shotsFired}/{shotsHit}
            </div>
            <div className="text-cyan-300">Proj: {activeProjectiles}</div>
            
            {/* Chapter */}
            <div className="text-purple-300">CP: {checkpointIndex}/{GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT}</div>
            <div className="text-purple-300">Mode: {gameMode}</div>
            
            {/* Boss HP - spans 2 cols when active */}
            {bossState.isActive && (
              <div className="col-span-2 text-red-400 font-bold animate-pulse">
                🔥 Boss HP: {bossState.hp}/{bossState.maxHp} ({Math.round(bossState.hp / bossState.maxHp * 100)}%)
              </div>
            )}
          </div>

          {/* Expandable Full Mode */}
          {!isCompact && (
            <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
              {/* Extended Stats */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300">
                <div>Max Seen: {maxActiveEnemiesSeen}</div>
                <div>Spawn: {effectiveSpawnInterval.toFixed(0)}ms</div>
                <div>DMG×: {damageMultiplier.toFixed(2)}</div>
                <div>Energy×: {energyRegenMultiplier.toFixed(2)}</div>
                <div>Block HP: {effectiveBlockHp}</div>
                <div>Last Atk Δ: {lastAttackDelta.toFixed(2)}s</div>
                <div>Target: {currentTargetId !== null ? `#${currentTargetId}` : 'none'}</div>
                {breatherTimer > 0 && (
                  <div className="text-cyan-400">Recovery: {breatherTimer.toFixed(1)}s</div>
                )}
              </div>

              {/* Dev Tools Section */}
              <div className="pt-2 border-t border-white/20">
                <button
                  onClick={() => setShowDevTools(!showDevTools)}
                  className="w-full py-1 px-2 rounded text-[10px] font-bold bg-purple-600/80 text-white mb-2"
                >
                  {showDevTools ? '🛠️ Hide Dev Tools' : '🛠️ Dev Tools'}
                </button>
                
                {showDevTools && (
                  <div className="space-y-2 border border-purple-500/50 rounded p-2 bg-purple-900/30">
                    <button
                      onClick={handleAddCoins}
                      className="w-full py-1 px-2 rounded text-[10px] bg-gold text-coffee-espresso font-bold"
                    >
                      💰 +200 Coins
                    </button>
                    
                    <div className="text-[10px] text-purple-300">Set All Upgrades:</div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(level => (
                        <button
                          key={level}
                          onClick={() => handleSetUpgradePreset(level)}
                          className="flex-1 py-1 rounded text-[10px] bg-purple-700 text-white font-bold hover:bg-purple-600"
                        >
                          L{level}
                        </button>
                      ))}
                    </div>
                    
                    <div className="text-[9px] text-purple-200 mt-1 border-t border-purple-500/30 pt-1">
                      <div className="font-bold mb-0.5">Test Targets:</div>
                      <div>• L0: Die @ Rush1</div>
                      <div>• L2: Reach CP2</div>
                      <div>• L4: Beat Boss</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
