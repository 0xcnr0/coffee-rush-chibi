import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from './config';
import type { RunBuff } from './types';

interface PickOverlayProps {
  gateIndex: number;
  onSelect: (buff: RunBuff) => void;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(arr: readonly T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const PickOverlay: React.FC<PickOverlayProps> = ({ gateIndex, onSelect }) => {
  const options = useMemo(() => 
    shuffleArray(GAME_CONFIG.RUN_BUFF_POOL).slice(0, GAME_CONFIG.PICK_CARDS_OFFERED) as RunBuff[],
    []
  );
  
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-coffee-dark rounded-2xl p-6 max-w-sm w-full border-2 border-gold/50 shadow-2xl">
        <h2 className="text-2xl font-bold text-gold text-center mb-2">
          ⭐ Gate {gateIndex} Cleared!
        </h2>
        <p className="text-coffee-cream text-center mb-6 text-sm">
          Choose a buff for this run:
        </p>
        
        <div className="flex flex-col gap-3">
          {options.map((buff) => (
            <Button
              key={buff.type}
              onClick={() => onSelect(buff)}
              className="h-auto py-4 px-4 bg-coffee-medium hover:bg-coffee-light border border-coffee-light/30 flex items-center gap-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-3xl">{buff.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-coffee-foam">{buff.name}</div>
                <div className="text-sm text-coffee-cream/80">{buff.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
