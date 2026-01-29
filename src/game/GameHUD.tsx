import React, { useEffect, useState } from 'react';
import { Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GAME_CONFIG } from './config';
import type { GameMode, BossState } from './types';

interface GameHUDProps {
  timeSurvived: number;
  tips: number;
  energy: number;
  maxEnergy: number;
  isMorningRush: boolean;
  breatherTimer: number;
  onTonicBomb: () => void;
  canUseBomb: boolean;
  // Phase 2B-3: Chapter mode UI
  gameMode: GameMode;
  bossState: BossState;
  bossIncomingTimer: number;
  checkpointIndex: number;
}

const CHECKPOINT_INTERVAL = 20; // seconds per checkpoint (v3.3: more frequent milestones)
const TOTAL_CHECKPOINTS = 9;   // 3 minutes total display for endless

export const GameHUD: React.FC<GameHUDProps> = ({
  timeSurvived,
  tips,
  energy,
  maxEnergy,
  isMorningRush,
  breatherTimer,
  onTonicBomb,
  canUseBomb,
  gameMode,
  bossState,
  bossIncomingTimer,
  checkpointIndex,
}) => {
  // Phase 1.8: "Nice!" popup shows when breather starts (rush just ended)
  const [showNice, setShowNice] = useState(false);
  const [lastBreatherTimer, setLastBreatherTimer] = useState(0);
  
  useEffect(() => {
    // Detect when breather just started (timer went from 0 to > 0)
    if (breatherTimer > 0 && lastBreatherTimer === 0) {
      setShowNice(true);
      const timeout = setTimeout(() => setShowNice(false), 900);
      return () => clearTimeout(timeout);
    }
    setLastBreatherTimer(breatherTimer);
  }, [breatherTimer, lastBreatherTimer]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentCheckpoint = Math.floor(timeSurvived / CHECKPOINT_INTERVAL);
  const checkpointProgress = (timeSurvived % CHECKPOINT_INTERVAL) / CHECKPOINT_INTERVAL;

  // Chapter mode specific UI
  const isChapter = gameMode === 'CHAPTER';
  const bossCheckpoint = GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT;
  
  return (
    <>
      {/* BOSS INCOMING Banner */}
      {bossIncomingTimer > 0 && (
        <div className="absolute top-1/3 left-0 right-0 z-30 flex justify-center">
          <div className="bg-red-600/90 text-white px-8 py-4 rounded-xl text-2xl font-bold animate-pulse shadow-2xl border-2 border-red-400">
            👑 BOSS INCOMING! 👑
          </div>
        </div>
      )}
      
      {/* Boss HP Bar (when active) */}
      {bossState.isActive && (
        <div className="absolute top-14 left-3 right-3 z-20">
          <div className="bg-coffee-dark/90 rounded-lg p-2 border border-red-500/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-red-400 font-bold text-sm flex items-center gap-1">
                👑 BOSS
              </span>
              <span className="text-red-300 text-xs font-mono">
                {bossState.hp}/{bossState.maxHp}
              </span>
            </div>
            <div className="h-3 bg-hp-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-200 rounded-full"
                style={{ width: `${(bossState.hp / bossState.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 flex flex-col gap-2 p-3 z-10 ${isMorningRush && !bossState.isActive ? 'morning-rush-pulse bg-warm-orange/20' : ''} ${bossState.isActive ? 'bg-red-900/20' : ''}`}>
        {/* Chapter Mode: CP1/CP2/CP3/BOSS segment bar */}
        {isChapter ? (
          <div className="flex flex-col gap-1 px-1">
            {/* Chapter Progress Segments */}
            <div className="flex gap-1">
              {/* CP1, CP2, CP3 segments */}
              {[1, 2, 3].map((cp) => {
                const cpProgress = checkpointIndex >= cp ? 100 : 
                                   checkpointIndex === cp - 1 ? 
                                   ((timeSurvived % GAME_CONFIG.CHECKPOINT_SECONDS) / GAME_CONFIG.CHECKPOINT_SECONDS) * 100 : 0;
                return (
                  <div key={cp} className="flex-1 flex flex-col items-center">
                    <div className="w-full h-2 rounded-full overflow-hidden bg-coffee-dark/60">
                      <div 
                        className="h-full transition-all duration-300 bg-gold"
                        style={{ width: `${cpProgress}%` }}
                      />
                    </div>
                    <span className={`text-[10px] mt-0.5 ${checkpointIndex >= cp ? 'text-gold' : 'text-coffee-cream/40'}`}>
                      CP{cp}
                    </span>
                  </div>
                );
              })}
              {/* BOSS segment */}
              <div className="flex-1 flex flex-col items-center">
                <div className={`w-full h-2 rounded-full overflow-hidden bg-coffee-dark/60 ${bossIncomingTimer > 0 || bossState.isActive ? 'ring-1 ring-red-500 animate-pulse' : ''}`}>
                  <div 
                    className={`h-full transition-all duration-300 ${bossState.isActive ? 'bg-red-500' : 'bg-red-400'}`}
                    style={{ width: `${bossState.isActive ? (bossState.hp / bossState.maxHp) * 100 : (checkpointIndex >= bossCheckpoint ? 100 : 0)}%` }}
                  />
                </div>
                <span className={`text-[10px] mt-0.5 ${bossState.isActive ? 'text-red-400 font-bold animate-pulse' : checkpointIndex >= bossCheckpoint ? 'text-red-400' : 'text-coffee-cream/40'}`}>
                  👑BOSS
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Endless Mode: Original checkpoint bar */
          <div className="flex gap-1 px-1">
            {Array.from({ length: TOTAL_CHECKPOINTS }).map((_, i) => (
              <div 
                key={i}
                className="flex-1 h-2 rounded-full overflow-hidden bg-coffee-dark/60"
              >
                <div 
                  className={`h-full transition-all duration-300 ${
                    i < currentCheckpoint 
                      ? 'bg-gold' 
                      : i === currentCheckpoint 
                        ? 'bg-warm-orange' 
                        : 'bg-transparent'
                  }`}
                  style={{ 
                    width: i < currentCheckpoint 
                      ? '100%' 
                      : i === currentCheckpoint 
                        ? `${checkpointProgress * 100}%` 
                        : '0%' 
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Time and Tips Row */}
        <div className="flex justify-between items-center">
          {/* Time Survived */}
          <div className="flex items-center gap-2 bg-coffee-dark/80 rounded-lg px-3 py-2">
            <Clock className="w-5 h-5 text-coffee-cream" />
            <span className="text-lg font-bold text-coffee-cream font-mono">
              {formatTime(timeSurvived)}
            </span>
          </div>
          
          {/* Mode indicator + Rush/Boss Phase */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            {/* BOSS PHASE indicator (replaces Rush during boss) */}
            {bossState.isActive && (
              <div className="bg-red-600 text-coffee-foam px-4 py-1.5 rounded-full text-sm font-bold animate-pulse shadow-lg border border-red-400">
                👑 BOSS PHASE
              </div>
            )}
            
            {/* Morning Rush Indicator (not during boss) */}
            {isMorningRush && !bossState.isActive && (
              <div className="bg-warm-orange text-coffee-foam px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                ☕ RUSH!
              </div>
            )}
            
            {/* "Nice!" popup during breather */}
            {showNice && !bossState.isActive && (
              <div className="bg-energy/90 text-coffee-foam px-4 py-2 rounded-full text-sm font-bold animate-fade-in shadow-lg">
                ☕ Nice!
              </div>
            )}
          </div>
          
          {/* Tips Counter */}
          <div className="flex items-center gap-2 bg-coffee-dark/80 rounded-lg px-3 py-2">
            <span className="text-lg">💰</span>
            <span className="text-lg font-bold text-gold">
              ${tips}
            </span>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar - Energy & Skill */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="flex items-center gap-4">
          {/* Energy Bar */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-energy" />
              <span className="text-sm text-coffee-cream">Energy</span>
            </div>
            <div className="h-4 bg-hp-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-energy transition-all duration-200 rounded-full"
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              />
            </div>
            {/* Energy pips */}
            <div className="flex gap-1 mt-1">
              {Array.from({ length: maxEnergy }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i < energy ? 'bg-energy' : 'bg-hp-bg'}`}
                />
              ))}
            </div>
          </div>
          
          {/* Tonic Bomb Button - Phase 2D: Show capped bomb charges */}
          {(() => {
            const rawCharges = Math.floor(energy / GAME_CONFIG.TONIC_BOMB_COST);
            const bombCharges = Math.min(rawCharges, GAME_CONFIG.MAX_BOMB_CHARGES);
            return (
              <Button
                onClick={onTonicBomb}
                disabled={bombCharges === 0}
                className={`h-16 w-24 rounded-xl text-lg font-bold shadow-lg transition-all ${
                  bombCharges > 0
                    ? 'bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl">⚡</span>
                  <span className="text-xs font-bold">×{bombCharges}</span>
                </div>
              </Button>
            );
          })()}
        </div>
      </div>
    </>
  );
};
