import React from 'react';
import { Clock, Coffee, Users, Home, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProgression } from './persistence';
import type { GameStats } from './types';

interface EndScreenProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onHome: () => void;
  onUpgrades: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ 
  stats, 
  onPlayAgain, 
  onHome, 
  onUpgrades 
}) => {
  const progression = loadProgression();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const shareText = `I survived ${formatTime(stats.timeSurvived)} and served ${stats.customersServed} customers ☕️ #CoffeeRush`;
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-coffee-dark/95 to-coffee-espresso/95 p-4 z-20">
      {/* Game Over Title */}
      <div className="mb-6 animate-pop-in">
        <h2 className="text-2xl font-bold text-coffee-cream text-center">
          Cart Overwhelmed! 😴
        </h2>
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
            {Math.floor(stats.timeSurvived / 20)}
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
      
      {/* Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          onClick={onPlayAgain}
          size="lg"
          className="bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-lg px-8 py-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform"
        >
          ☕ Play Again
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={onHome}
            variant="outline"
            size="default"
            className="flex-1 border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30 hover:text-coffee-foam rounded-lg"
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Button>
          
          <Button
            onClick={onUpgrades}
            variant="outline"
            size="default"
            className="flex-1 border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30 hover:text-coffee-foam rounded-lg"
          >
            <ArrowUp className="w-4 h-4 mr-1" />
            Upgrades
          </Button>
        </div>
      </div>
      
      {/* Share hint */}
      <p className="text-coffee-light/50 text-xs text-center max-w-xs mt-4">
        {shareText}
      </p>
    </div>
  );
};
