import React from 'react';
import { Clock, Coffee, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameStats } from './types';

interface EndScreenProps {
  stats: GameStats;
  onPlayAgain: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ stats, onPlayAgain }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const shareText = `I survived ${formatTime(stats.timeSurvived)} and served ${stats.customersServed} customers ☕️ #CoffeeRush`;
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-coffee-dark/95 to-coffee-espresso/95 p-6 z-20">
      {/* Game Over Title */}
      <div className="mb-8 animate-pop-in">
        <h2 className="text-3xl font-bold text-coffee-cream text-center">
          Cart Overwhelmed! 😴
        </h2>
        <p className="text-coffee-light text-center mt-2">
          The sleepy horde was too much...
        </p>
      </div>
      
      {/* Primary Score - Time Survived */}
      <div className="bg-coffee-medium/50 rounded-2xl p-6 mb-6 w-full max-w-xs animate-pop-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Clock className="w-8 h-8 text-gold" />
          <span className="text-coffee-cream text-lg">Time Survived</span>
        </div>
        <div className="text-5xl font-bold text-gold text-center">
          {formatTime(stats.timeSurvived)}
        </div>
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
        <div className="bg-coffee-dark/50 rounded-xl p-4 text-center animate-pop-in">
          <Users className="w-6 h-6 text-secondary mx-auto mb-1" />
          <div className="text-2xl font-bold text-coffee-cream">
            {stats.customersServed}
          </div>
          <div className="text-sm text-coffee-light">Served</div>
        </div>
        
        <div className="bg-coffee-dark/50 rounded-xl p-4 text-center animate-pop-in">
          <Coffee className="w-6 h-6 text-gold mx-auto mb-1" />
          <div className="text-2xl font-bold text-gold">
            ${stats.totalTips}
          </div>
          <div className="text-sm text-coffee-light">Tips</div>
        </div>
      </div>
      
      {/* Play Again Button */}
      <Button
        onClick={onPlayAgain}
        size="lg"
        className="bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-xl px-10 py-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform mb-4"
      >
        ☕ Play Again
      </Button>
      
      {/* Share hint */}
      <p className="text-coffee-light/60 text-xs text-center max-w-xs">
        {shareText}
      </p>
    </div>
  );
};
