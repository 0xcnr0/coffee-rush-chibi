import React from 'react';
import { Coffee, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProgression } from './persistence';

interface MenuScreenProps {
  onPlay: () => void;
  onUpgrades: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onPlay, onUpgrades }) => {
  const progression = loadProgression();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-coffee-light to-coffee-medium p-6 z-20">
      {/* Logo/Title */}
      <div className="flex flex-col items-center mb-8 animate-pop-in">
        <div className="relative mb-4">
          <Coffee className="w-20 h-20 text-coffee-cream drop-shadow-lg" />
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">☕</div>
        </div>
        <h1 className="text-3xl font-bold text-coffee-cream text-center drop-shadow-lg">
          Coffee Rush
        </h1>
        <p className="text-lg text-coffee-foam mt-1 opacity-90">
          The Caffeine Engine
        </p>
      </div>
      
      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Best Time */}
        {progression.bestTimeSurvivedSeconds > 0 && (
          <div className="flex items-center gap-2 bg-coffee-dark/30 px-3 py-2 rounded-full">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-coffee-cream text-sm font-medium">
              {formatTime(progression.bestTimeSurvivedSeconds)}
            </span>
          </div>
        )}
        
        {/* Total Beans */}
        <div className="flex items-center gap-2 bg-coffee-dark/30 px-3 py-2 rounded-full">
          <span className="text-lg">🫘</span>
          <span className="text-gold font-bold">{progression.totalBeans}</span>
        </div>
      </div>
      
      {/* Tagline */}
      <p className="text-coffee-cream text-center mb-8 max-w-xs opacity-80 text-sm">
        Serve sleepy customers before they overwhelm your cart!
      </p>
      
      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onPlay}
          size="lg"
          className="bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-xl px-10 py-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform"
        >
          ☕ Play
        </Button>
        
        <Button
          onClick={onUpgrades}
          variant="outline"
          size="lg"
          className="border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30 hover:text-coffee-foam text-lg px-8 py-5 rounded-xl"
        >
          ⚙️ Upgrades
        </Button>
      </div>
      
      {/* Instructions hint */}
      <div className="mt-8 text-coffee-cream/60 text-xs text-center">
        <p>Auto-attack serves customers</p>
        <p className="mt-1">Tap ⚡ for Tonic Bomb (costs 2 energy)</p>
      </div>
    </div>
  );
};
