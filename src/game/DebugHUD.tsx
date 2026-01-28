import React from 'react';
import { GAME_CONFIG } from './config';

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
  // Phase 1.8: Combat debug info
  currentTargetId: number | null;
  currentTargetX: number | null;
  lastAttackDelta: number;
  activeProjectiles: number;
  // Phase 2A: Shot counters
  shotsFired: number;
  shotsHit: number;
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
  onToggle,
  onStressTestToggle,
}) => {
  const isOverCap = activeEnemies > maxEnemies;
  const maxLatched = isMorningRush 
    ? GAME_CONFIG.MAX_LATCHED_ENEMIES + GAME_CONFIG.RUSH_LATCHED_BONUS
    : GAME_CONFIG.MAX_LATCHED_ENEMIES;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute top-20 left-3 z-20 bg-coffee-dark/80 text-coffee-cream px-2 py-1 rounded text-xs font-mono"
      >
        {isVisible ? '🐛 Hide' : '🐛 Debug'}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute top-28 left-3 z-20 bg-coffee-dark/90 text-coffee-cream p-3 rounded-lg text-xs font-mono space-y-1 min-w-[220px]">
          <div className="text-gold font-bold mb-2">DEBUG INFO</div>
          
          {/* Stress Test Toggle */}
          <button
            onClick={onStressTestToggle}
            className={`w-full py-1 px-2 rounded text-xs font-bold mb-2 ${
              isStressTest 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            {isStressTest ? '🔥 STRESS TEST ON' : '⚡ Enable Stress Test'}
          </button>
          
          {/* FPS */}
          <div className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
            FPS: {fps.toFixed(1)}
          </div>
          <div className={minFps < 30 ? 'text-red-400' : minFps < 50 ? 'text-yellow-400' : 'text-gray-400'}>
            Min FPS (10s): {minFps.toFixed(1)}
          </div>
          
          {/* Enemy Count */}
          <div className={isOverCap ? 'text-red-400 font-bold animate-pulse' : ''}>
            Enemies: {activeEnemies} / {maxEnemies}
            {isOverCap && ' ⚠️ OVER CAP!'}
          </div>
          <div className="text-purple-300">
            Max Seen: {maxActiveEnemiesSeen}
          </div>
          
          <div className="border-t border-coffee-cream/20 my-2" />
          
          {/* Latched Info (TDS Panic) */}
          <div className={latchedCount >= maxLatched ? 'text-red-400 font-bold' : 'text-orange-300'}>
            Latched: {latchedCount}/{maxLatched} {latchedCount >= maxLatched && '🔥'}
          </div>
          <div className="text-gray-400">
            Tick DMG: {GAME_CONFIG.LATCHED_TICK_DAMAGE} / {GAME_CONFIG.LATCHED_TICK_INTERVAL}s
          </div>
          {breatherTimer > 0 && (
            <div className="text-green-400">
              Breather: {breatherTimer.toFixed(1)}s ☕
            </div>
          )}
          
          <div className="border-t border-coffee-cream/20 my-2" />
          
          {/* Spawn Info */}
          <div>
            Spawn: {effectiveSpawnInterval.toFixed(0)}ms
            {isMorningRush && <span className="text-warm-orange ml-1">☕ RUSH</span>}
          </div>
          
          <div className="border-t border-coffee-cream/20 my-2" />
          
          {/* Phase 1.8: Combat Debug */}
          <div className="text-gold font-bold mb-1">COMBAT</div>
          <div className="text-cyan-300">
            Target: {currentTargetId !== null ? `#${currentTargetId} @ ${currentTargetX?.toFixed(0)}px` : 'none'}
          </div>
          <div className="text-cyan-300">
            Last Atk Δ: {lastAttackDelta.toFixed(2)}s
          </div>
          <div className="text-cyan-300">
            Projectiles: {activeProjectiles}
          </div>
          <div className={shotsHit > 0 ? 'text-green-300' : 'text-red-400'}>
            Shots: {shotsFired} fired / {shotsHit} hit
          </div>
          
          <div className="border-t border-coffee-cream/20 my-2" />
          
          {/* Multipliers */}
          <div className={isStressTest ? 'text-red-300' : 'text-sky-300'}>
            DMG×: {damageMultiplier.toFixed(2)} {isStressTest && '(stress)'}
          </div>
          <div className="text-sky-300">
            Energy×: {energyRegenMultiplier.toFixed(2)}
          </div>
          <div className="text-sky-300">
            Block HP: {effectiveBlockHp}
          </div>
          
          {isStressTest && (
            <div className="mt-2 text-red-400 text-[10px] border-t border-red-500/50 pt-2">
              ⚠️ Stress mode: DMG↓ Spawn↑ Rush↑
            </div>
          )}
        </div>
      )}
    </>
  );
};
