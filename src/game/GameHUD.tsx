import React from 'react';
import { Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from './config';

interface GameHUDProps {
  timeSurvived: number;
  tips: number;
  energy: number;
  maxEnergy: number;
  isMorningRush: boolean;
  onTonicBomb: () => void;
  canUseBomb: boolean;
}

const CHECKPOINT_INTERVAL = 20; // seconds per checkpoint (v3.3: more frequent milestones)
const TOTAL_CHECKPOINTS = 9;   // 3 minutes total display

export const GameHUD: React.FC<GameHUDProps> = ({
  timeSurvived,
  tips,
  energy,
  maxEnergy,
  isMorningRush,
  onTonicBomb,
  canUseBomb,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentCheckpoint = Math.floor(timeSurvived / CHECKPOINT_INTERVAL);
  const checkpointProgress = (timeSurvived % CHECKPOINT_INTERVAL) / CHECKPOINT_INTERVAL;

  return (
    <>
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 flex flex-col gap-2 p-3 z-10 ${isMorningRush ? 'morning-rush-pulse bg-warm-orange/20' : ''}`}>
        {/* Checkpoint Progress Bar */}
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
        
        {/* Time and Tips Row */}
        <div className="flex justify-between items-center">
          {/* Time Survived */}
          <div className="flex items-center gap-2 bg-coffee-dark/80 rounded-lg px-3 py-2">
            <Clock className="w-5 h-5 text-coffee-cream" />
            <span className="text-lg font-bold text-coffee-cream font-mono">
              {formatTime(timeSurvived)}
            </span>
          </div>
          
          {/* Morning Rush Indicator */}
          {isMorningRush && (
            <div className="absolute left-1/2 -translate-x-1/2 bg-warm-orange text-coffee-foam px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              ☕ RUSH!
            </div>
          )}
          
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
          
          {/* Tonic Bomb Button */}
          <Button
            onClick={onTonicBomb}
            disabled={!canUseBomb}
            className={`h-16 w-24 rounded-xl text-lg font-bold shadow-lg transition-all ${
              canUseBomb 
                ? 'bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl">⚡</span>
              <span className="text-xs">-{GAME_CONFIG.TONIC_BOMB_COST}</span>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
};
