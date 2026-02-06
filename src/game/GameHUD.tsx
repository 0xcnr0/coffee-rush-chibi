import React, { useEffect, useState } from 'react';
import { Clock, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from './config';
import type { GameMode, BossState, PlayPhase, GateState } from './types';

interface GameHUDProps {
  timeSurvived: number;
  tips: number;
  power: number;
  maxPower: number;
  isMorningRush: boolean;
  breatherTimer: number;
  onTonicBomb: () => void;
  canUseBomb: boolean;
  onPause: () => void;
  gameMode: GameMode;
  bossState: BossState;
  bossIncomingTimer: number;
  checkpointIndex: number;
  // Phase 3A: New props for gate flow
  playPhase?: PlayPhase;
  gateState?: GateState;
  travelTimer?: number;
}

const CHECKPOINT_INTERVAL = 20;
const TOTAL_CHECKPOINTS = 9;

export const GameHUD: React.FC<GameHUDProps> = ({
  timeSurvived,
  tips,
  power,
  maxPower,
  isMorningRush,
  breatherTimer,
  onTonicBomb,
  canUseBomb,
  onPause,
  gameMode,
  bossState,
  bossIncomingTimer,
  checkpointIndex,
  playPhase,
  gateState,
  travelTimer,
}) => {
  const [showNice, setShowNice] = useState(false);
  const [lastBreatherTimer, setLastBreatherTimer] = useState(0);
  
  useEffect(() => {
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

  const isChapter = gameMode === 'CHAPTER';
  const bossCheckpoint = GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT;
  const isGateFlow = GAME_CONFIG.ENABLE_GATE_CHAPTER_FLOW && isChapter;

  // Calculate power as numeric + bar percentage
  const powerPercent = (power / maxPower) * 100;
  const skillCost = GAME_CONFIG.TONIC_BOMB_COST;
  const canUseSkill = power >= skillCost;
  
  return (
    <>
      {/* Phase 3A: Travel badge (no countdown number) */}
      {isGateFlow && playPhase === 'TRAVEL' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-coffee-dark/90 text-coffee-cream px-6 py-3 rounded-xl text-lg font-bold animate-pulse border border-coffee-medium shadow-xl flex items-center gap-3">
            <span>🚶 TRAVEL</span>
            {/* Mini progress bar */}
            {travelTimer !== undefined && (
              <div className="w-16 h-2 bg-coffee-medium/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warm-orange transition-all duration-200"
                  style={{ width: `${((GAME_CONFIG.TRAVEL_DURATION - travelTimer) / GAME_CONFIG.TRAVEL_DURATION) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
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
        {/* Chapter/Endless Progress Bar */}
        {isChapter ? (
          isGateFlow && gateState ? (
            // Phase 3A: Gate-based progress bar
            <div className="flex flex-col gap-1 px-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((gate) => {
                  const gateProgress = gateState.index > gate ? 100 : 
                                       gateState.index === gate ? 
                                       (gateState.currentKills / gateState.targetKills) * 100 : 0;
                  const isCurrent = gateState.index === gate;
                  const isCleared = gateState.index > gate;
                  return (
                    <div key={gate} className="flex-1 flex flex-col items-center">
                      <div className={`w-full h-2 rounded-full overflow-hidden bg-coffee-dark/60 ${isCurrent && playPhase === 'FIGHT' ? 'ring-1 ring-warm-orange' : ''}`}>
                        <div 
                          className={`h-full transition-all duration-300 ${isCleared ? 'bg-gold' : 'bg-warm-orange'}`}
                          style={{ width: `${gateProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className={`text-[10px] mt-0.5 ${isCleared ? 'text-gold' : isCurrent ? 'text-warm-orange' : 'text-coffee-cream/40'}`}>
                          G{gate}
                        </span>
                        {isCurrent && playPhase === 'FIGHT' && (
                          <span className="text-[9px] text-coffee-cream/60">{gateState.currentKills}/{gateState.targetKills}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex-1 flex flex-col items-center">
                  <div className={`w-full h-2 rounded-full overflow-hidden bg-coffee-dark/60 ${bossIncomingTimer > 0 || bossState.isActive ? 'ring-1 ring-destructive animate-pulse' : ''}`}>
                    <div 
                      className={`h-full transition-all duration-300 ${bossState.isActive ? 'bg-destructive' : playPhase === 'BOSS' ? 'bg-destructive/70' : 'bg-transparent'}`}
                      style={{ width: `${bossState.isActive ? (bossState.hp / bossState.maxHp) * 100 : (playPhase === 'BOSS' ? 100 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] mt-0.5 ${bossState.isActive ? 'text-destructive font-bold animate-pulse' : playPhase === 'BOSS' ? 'text-destructive' : 'text-coffee-cream/40'}`}>
                    👑BOSS
                  </span>
                </div>
              </div>
              {/* Phase indicator badge */}
              {playPhase === 'FIGHT' && !bossState.isActive && (
                <div className="flex justify-center">
                  <span className="bg-warm-orange/80 text-coffee-foam px-2 py-0.5 rounded-full text-[10px] font-bold">
                    ⚔️ FIGHT
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Legacy: Time-based checkpoint progress bar
            <div className="flex flex-col gap-1 px-1">
              <div className="flex gap-1">
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
                <div className="flex-1 flex flex-col items-center">
                  <div className={`w-full h-2 rounded-full overflow-hidden bg-coffee-dark/60 ${bossIncomingTimer > 0 || bossState.isActive ? 'ring-1 ring-destructive animate-pulse' : ''}`}>
                    <div 
                      className={`h-full transition-all duration-300 ${bossState.isActive ? 'bg-destructive' : 'bg-destructive/70'}`}
                      style={{ width: `${bossState.isActive ? (bossState.hp / bossState.maxHp) * 100 : (checkpointIndex >= bossCheckpoint ? 100 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] mt-0.5 ${bossState.isActive ? 'text-destructive font-bold animate-pulse' : checkpointIndex >= bossCheckpoint ? 'text-destructive' : 'text-coffee-cream/40'}`}>
                    👑BOSS
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
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
          <div className="flex items-center gap-2 bg-coffee-dark/80 rounded-lg px-3 py-2">
            <Clock className="w-5 h-5 text-coffee-cream" />
            <span className="text-lg font-bold text-coffee-cream font-mono">
              {formatTime(timeSurvived)}
            </span>
          </div>
          
          {/* Rush/Boss indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            {bossState.isActive && (
              <div className="bg-red-600 text-coffee-foam px-4 py-1.5 rounded-full text-sm font-bold animate-pulse shadow-lg border border-red-400">
                👑 BOSS PHASE
              </div>
            )}
            
            {isMorningRush && !bossState.isActive && (
              <div className="bg-warm-orange text-coffee-foam px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                ☕ RUSH!
              </div>
            )}
            
            {showNice && !bossState.isActive && (
              <div className="bg-energy/90 text-coffee-foam px-4 py-2 rounded-full text-sm font-bold animate-fade-in shadow-lg">
                ☕ Nice!
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-coffee-dark/80 rounded-lg px-3 py-2">
            <span className="text-lg">💰</span>
            <span className="text-lg font-bold text-gold">
              ${tips}
            </span>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM BAR - TDS-style Power Bar + Skill Button
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-coffee-espresso/80 to-transparent">
        <div className="flex items-center gap-3">
          {/* Pause Button */}
          <Button
            onClick={onPause}
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-xl bg-coffee-dark/70 hover:bg-coffee-dark/90 text-coffee-cream border border-coffee-medium/30"
          >
            <Pause className="w-6 h-6" />
          </Button>
          
          {/* Power Bar (TDS-style: single bar with numeric) */}
          <div className="flex-1 bg-coffee-dark/80 rounded-xl p-2 border border-coffee-medium/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚡</span>
              <span className="text-sm text-coffee-cream font-semibold">Power</span>
              <span className="text-sm text-energy font-bold ml-auto">{power.toFixed(1)}</span>
            </div>
            <div className="h-3 bg-hp-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-energy transition-all duration-200 rounded-full"
                style={{ width: `${powerPercent}%` }}
              />
            </div>
          </div>
          
          {/* Skill Button (Tonic Bomb) - TDS-style with cost badge */}
          <Button
            onClick={onTonicBomb}
            disabled={!canUseSkill}
            className={`relative h-16 w-16 rounded-xl text-lg font-bold shadow-lg transition-all border-2 ${
              canUseSkill
                ? 'bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam border-warm-orange/50 hover:scale-105 active:scale-95' 
                : 'bg-coffee-dark/60 text-coffee-cream/40 border-coffee-dark/30'
            }`}
          >
            {/* Skill icon (grenade/bomb) */}
            <span className="text-2xl">💣</span>
            
            {/* Cost badge */}
            <div className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              canUseSkill ? 'bg-energy text-coffee-espresso' : 'bg-coffee-dark/60 text-coffee-cream/40'
            }`}>
              {skillCost}⚡
            </div>
          </Button>
        </div>
      </div>
    </>
  );
};
