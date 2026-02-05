import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Users, Home, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProgression } from './persistence';
import { GAME_CONFIG } from './config';
import { RunSummary } from './RunSummary';
import type { GameStats, GameMode } from './types';

interface EndScreenProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onHome: () => void;
  gameMode: GameMode;
}

// Input lockout duration to prevent accidental taps
const INPUT_LOCKOUT_MS = 400;

export const EndScreen: React.FC<EndScreenProps> = ({ 
  stats, 
  onPlayAgain, 
  onHome,
  gameMode,
}) => {
  const progression = loadProgression();
  const isChapterClear = stats.isChapterClear;
  
  // Input lockout state - ignore taps for first 400ms
  const [isLocked, setIsLocked] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLocked(false), INPUT_LOCKOUT_MS);
    return () => clearTimeout(timer);
  }, []);
  
  // Guarded handlers
  const handlePlayAgain = () => {
    if (isLocked) return;
    onPlayAgain();
  };
  
  const handleHome = () => {
    if (isLocked) return;
    onHome();
  };
  
  // Phase 1.8: Show hint after first death if no cargo box purchased
  const showCargoHint = !isChapterClear && progression.upgradeLevels.blockCountLevel === 0;
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const shareText = isChapterClear
    ? `I cleared Chapter 1 in ${formatTime(stats.timeSurvived)}! ☕️🏆 #CoffeeRush`
    : `I survived ${formatTime(stats.timeSurvived)} and served ${stats.customersServed} customers ☕️ #CoffeeRush`;
  
  // Chapter Clear Screen
  if (isChapterClear) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto bg-gradient-to-b from-gold/20 to-coffee-espresso/95 p-4 pt-8 z-20">
        {/* Victory Title */}
        <div className="mb-4 animate-pop-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-8 h-8 text-gold animate-pulse" />
            <h2 className="text-3xl font-bold text-gold text-center">
              Chapter 1 Clear!
            </h2>
            <Star className="w-8 h-8 text-gold animate-pulse" />
          </div>
          <p className="text-coffee-cream text-center text-lg">
            ☕ The Boss has been served! ☕
          </p>
        </div>
        
        {/* Primary Score - Time */}
        <div className="bg-gold/20 border-2 border-gold rounded-2xl p-4 mb-3 w-full max-w-xs animate-pop-in">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="text-coffee-cream text-sm">Clear Time</span>
          </div>
          <div className="text-3xl font-bold text-gold text-center">
            {formatTime(stats.timeSurvived)}
          </div>
          {progression.bestChapter1Time > 0 && progression.bestChapter1Time < stats.timeSurvived && (
            <div className="text-coffee-light/60 text-xs text-center mt-1">
              Best: {formatTime(progression.bestChapter1Time)}
            </div>
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-3">
          <div className="bg-coffee-dark/50 rounded-xl p-2 text-center animate-pop-in">
            <Users className="w-4 h-4 text-secondary mx-auto mb-1" />
            <div className="text-lg font-bold text-coffee-cream">
              {stats.customersServed}
            </div>
            <div className="text-[10px] text-coffee-light">Served</div>
          </div>
          
          <div className="bg-coffee-dark/50 rounded-xl p-2 text-center animate-pop-in">
            <span className="text-base block mb-1">🏁</span>
            <div className="text-lg font-bold text-warm-orange">
              {stats.checkpointsCleared || Math.floor(stats.timeSurvived / GAME_CONFIG.CHECKPOINT_SECONDS)}
            </div>
            <div className="text-[10px] text-coffee-light">Checkpoints</div>
          </div>
        </div>
        
        {/* Beans Earned (with bonus) */}
        <div className="bg-gold/30 border border-gold/50 rounded-xl p-3 w-full max-w-xs mb-3 animate-pop-in">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl">🫘</span>
            <div className="text-center">
              <div className="text-xl font-bold text-gold">
                +{stats.beansEarned}
              </div>
              <div className="text-[10px] text-coffee-cream/70">
                (Tips + {GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS} Clear Bonus)
              </div>
            </div>
          </div>
        </div>
        
        {/* Chapter 2 Teaser */}
        <div className="bg-coffee-dark/60 border border-coffee-cream/20 rounded-xl p-3 w-full max-w-xs mb-4 animate-pop-in">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🔒</span>
            <div className="text-center">
              <div className="text-sm font-bold text-coffee-cream/70">
                Chapter 2
              </div>
              <div className="text-[10px] text-coffee-cream/50">
                Coming Soon...
              </div>
            </div>
          </div>
        </div>
        
        {/* Buttons - Horizontal layout with spacing to prevent mis-taps */}
        <div className="flex flex-row gap-4 w-full max-w-xs justify-center items-center mt-2 mb-4">
          <Button
            onClick={handleHome}
            variant="outline"
            size="default"
            disabled={isLocked}
            className="border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30 hover:text-coffee-foam rounded-lg px-4 py-3 disabled:opacity-50"
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Button>
          
          <Button
            onClick={handlePlayAgain}
            size="lg"
            disabled={isLocked}
            className="bg-gold hover:bg-gold/90 text-coffee-espresso text-lg px-6 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform disabled:opacity-50"
          >
            🏆 Play Again
          </Button>
        </div>

        {/* Run Summary Telemetry */}
        {stats.telemetry && (
          <div className="w-full max-w-xs mt-2">
            <RunSummary telemetry={stats.telemetry} timeSurvived={stats.timeSurvived} />
          </div>
        )}
        
        {/* Share hint */}
        <p className="text-coffee-light/50 text-xs text-center max-w-xs mt-4 pb-4">
          {shareText}
        </p>
      </div>
    );
  }
  
  // Calculate checkpoints reached for failed Chapter
  const checkpointsReached = Math.floor(stats.timeSurvived / GAME_CONFIG.CHECKPOINT_SECONDS);
  const bossCheckpoint = GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT;
  
  // Normal Game Over Screen (Endless or failed Chapter)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto bg-gradient-to-b from-coffee-dark/95 to-coffee-espresso/95 p-4 pt-8 z-20">
      {/* Game Over Title */}
      <div className="mb-6 animate-pop-in">
        {gameMode === 'CHAPTER' ? (
          <>
          <h2 className="text-2xl font-bold text-destructive text-center">
              Chapter Failed! 😴
            </h2>
            <p className="text-coffee-cream/70 text-center mt-2">
              Reached CP <span className="text-gold font-bold">{checkpointsReached}</span>/{bossCheckpoint}
            </p>
          </>
        ) : (
          <h2 className="text-2xl font-bold text-coffee-cream text-center">
            Game Over! 😴
          </h2>
        )}
        {stats.isNewRecord && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-gold text-lg font-bold animate-pulse">🏆 NEW RECORD!</span>
          </div>
        )}
      </div>
      
      {/* Primary Score - Time Survived */}
      <div className="bg-coffee-medium/50 rounded-2xl p-5 mb-4 w-full max-w-xs animate-pop-in">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-6 h-6 text-gold" />
          <span className="text-coffee-cream">Time Survived</span>
        </div>
        <div className="text-4xl font-bold text-gold text-center">
          {formatTime(stats.timeSurvived)}
        </div>
        {progression.bestTimeSurvivedSeconds > stats.timeSurvived && (
          <div className="text-coffee-light/60 text-sm text-center mt-1">
            Best: {formatTime(progression.bestTimeSurvivedSeconds)}
          </div>
        )}
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-4">
        <div className="bg-coffee-dark/50 rounded-xl p-3 text-center animate-pop-in">
          <Users className="w-5 h-5 text-secondary mx-auto mb-1" />
          <div className="text-xl font-bold text-coffee-cream">
            {stats.customersServed}
          </div>
          <div className="text-xs text-coffee-light">Served</div>
        </div>
        
        <div className="bg-coffee-dark/50 rounded-xl p-3 text-center animate-pop-in">
          <Coffee className="w-5 h-5 text-gold mx-auto mb-1" />
          <div className="text-xl font-bold text-gold">
            ${stats.totalTips}
          </div>
          <div className="text-xs text-coffee-light">Tips</div>
        </div>
      </div>
      
      {/* Checkpoints & Beans Row */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
        <div className="bg-coffee-dark/50 rounded-xl p-3 text-center animate-pop-in">
          <span className="text-lg block mb-1">🏁</span>
          <div className="text-xl font-bold text-warm-orange">
            {Math.floor(stats.timeSurvived / GAME_CONFIG.CHECKPOINT_SECONDS)}
          </div>
          <div className="text-xs text-coffee-light">Checkpoints</div>
        </div>
        
        <div className="bg-coffee-dark/50 rounded-xl p-3 text-center animate-pop-in">
          <span className="text-lg block mb-1">🫘</span>
          <div className="text-xl font-bold text-secondary">
            +{stats.beansEarned}
          </div>
          <div className="text-xs text-coffee-light">Beans</div>
        </div>
      </div>
      
      {/* Buttons - Horizontal layout with spacing to prevent mis-taps */}
      <div className="flex flex-row gap-4 w-full max-w-xs justify-center items-center mt-4 mb-4">
        <Button
          onClick={handleHome}
          variant="outline"
          size="default"
          disabled={isLocked}
          className="border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30 hover:text-coffee-foam rounded-lg px-4 py-3 disabled:opacity-50"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Button>
        
        <Button
          onClick={handlePlayAgain}
          size="lg"
          disabled={isLocked}
          className="bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-lg px-6 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform disabled:opacity-50"
        >
          ☕ Play Again
        </Button>
      </div>

      {/* Run Summary Telemetry */}
      {stats.telemetry && (
        <div className="w-full max-w-xs mt-2">
          <RunSummary telemetry={stats.telemetry} timeSurvived={stats.timeSurvived} />
        </div>
      )}

      {/* Phase 1.8: Hint tooltip for first-time players */}
      {showCargoHint && (
        <div className="bg-warm-orange/20 border border-warm-orange/40 rounded-lg px-3 py-2 mt-4 max-w-xs">
          <p className="text-warm-orange text-xs text-center">
            💡 Tip: Buy your first <strong>Cargo Box</strong> to survive the first Rush!
          </p>
        </div>
      )}
      
      {/* Share hint */}
      <p className="text-coffee-light/50 text-xs text-center max-w-xs mt-4 pb-8">
        {shareText}
      </p>
    </div>
  );
};
