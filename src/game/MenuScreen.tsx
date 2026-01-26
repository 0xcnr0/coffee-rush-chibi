import React from 'react';
import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuScreenProps {
  onPlay: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onPlay }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-coffee-light to-coffee-medium p-6 z-20">
      {/* Logo/Title */}
      <div className="flex flex-col items-center mb-12 animate-pop-in">
        <div className="relative mb-4">
          <Coffee className="w-24 h-24 text-coffee-cream drop-shadow-lg" />
          <div className="absolute -top-2 -right-2 text-3xl animate-bounce">☕</div>
        </div>
        <h1 className="text-4xl font-bold text-coffee-cream text-center drop-shadow-lg">
          Coffee Rush
        </h1>
        <p className="text-xl text-coffee-foam mt-2 opacity-90">
          The Caffeine Engine
        </p>
      </div>
      
      {/* Tagline */}
      <p className="text-coffee-cream text-center mb-12 max-w-xs opacity-80">
        Serve sleepy customers before they overwhelm your cart!
      </p>
      
      {/* Play Button */}
      <Button
        onClick={onPlay}
        size="lg"
        className="bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-2xl px-12 py-8 rounded-2xl shadow-lg transform hover:scale-105 transition-transform"
      >
        ☕ Play
      </Button>
      
      {/* Instructions hint */}
      <div className="mt-12 text-coffee-cream/70 text-sm text-center">
        <p>Auto-attack serves customers</p>
        <p className="mt-1">Tap ⚡ for Tonic Bomb (costs 2 energy)</p>
      </div>
    </div>
  );
};
