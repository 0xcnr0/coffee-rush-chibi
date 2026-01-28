import React, { useState, useEffect } from 'react';
import { Coffee, Trophy, Shield, Zap, Package, Play, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProgression, purchaseUpgrade, getUpgradeCost, getUpgradeMultiplier, setLastGameMode } from './persistence';
import { GAME_CONFIG } from './config';
import type { UpgradeInfo, GameMode } from './types';

interface GarageScreenProps {
  onPlay: (mode: GameMode) => void;
}

const UPGRADES: UpgradeInfo[] = [
  {
    key: 'towerHpLevel',
    name: 'Tower Reinforcement',
    description: 'Cart HP',
    icon: 'shield',
    bonusPerLevel: GAME_CONFIG.TOWER_HP_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.TOWER_HP_BASE_COST,
  },
  {
    key: 'espressoDamageLevel',
    name: 'Espresso Mastery',
    description: 'Shot Damage',
    icon: 'coffee',
    bonusPerLevel: GAME_CONFIG.ESPRESSO_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.ESPRESSO_BASE_COST,
  },
  {
    key: 'energyRegenLevel',
    name: 'Caffeine Flow',
    description: 'Energy Regen',
    icon: 'zap',
    bonusPerLevel: GAME_CONFIG.ENERGY_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.ENERGY_BASE_COST,
  },
  {
    key: 'blockCountLevel',
    name: 'Add Cargo Box',
    description: 'Extra HP Buffer',
    icon: 'package',
    bonusPerLevel: 1,
    baseCost: GAME_CONFIG.BLOCK_COUNT_BASE_COST,
    maxLevel: GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL,
    isCount: true,
  },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'shield': return Shield;
    case 'coffee': return Coffee;
    case 'zap': return Zap;
    case 'package': return Package;
    default: return Coffee;
  }
};

// Soft guidance: returns the key of the recommended upgrade
// Phase 1.8: Prioritize Add Cargo Box early, then Tower HP
const getRecommendedUpgrade = (levels: Record<string, number>): string | null => {
  // Early game: Cargo Box is most impactful for surviving first Rush
  if (levels.blockCountLevel === 0) return 'blockCountLevel';
  if (levels.towerHpLevel === 0) return 'towerHpLevel';
  if (levels.espressoDamageLevel === 0) return 'espressoDamageLevel';
  if (levels.energyRegenLevel === 0) return 'energyRegenLevel';
  return null;
};

export const GarageScreen: React.FC<GarageScreenProps> = ({ onPlay }) => {
  const [progression, setProgression] = useState(loadProgression());
  const [selectedMode, setSelectedMode] = useState<GameMode>(progression.lastGameMode || 'CHAPTER');
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePurchase = (upgrade: UpgradeInfo) => {
    const currentLevel = progression.upgradeLevels[upgrade.key];
    const maxLevel = upgrade.maxLevel ?? GAME_CONFIG.UPGRADE_MAX_LEVEL;
    if (currentLevel >= maxLevel) return;
    
    const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
    if (purchaseUpgrade(upgrade.key, cost)) {
      setProgression(loadProgression());
    }
  };
  
  const handlePlay = () => {
    setLastGameMode(selectedMode);
    onPlay(selectedMode);
  };
  
  const recommendedKey = getRecommendedUpgrade(progression.upgradeLevels);
  
  // Calculate block count for cart preview
  const blockCount = 1 + progression.upgradeLevels.blockCountLevel;
  
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-coffee-light to-coffee-medium p-4 z-20 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-4 animate-pop-in">
        <div className="relative mb-2">
          <Coffee className="w-12 h-12 text-coffee-cream drop-shadow-lg" />
          <div className="absolute -top-1 -right-1 text-xl animate-bounce">☕</div>
        </div>
        <h1 className="text-2xl font-bold text-coffee-cream text-center drop-shadow-lg">
          Coffee Rush
        </h1>
      </div>
      
      {/* Stats Bar */}
      <div className="flex items-center gap-3 mb-4">
        {progression.bestTimeSurvivedSeconds > 0 && (
          <div className="flex items-center gap-1.5 bg-coffee-dark/30 px-2.5 py-1.5 rounded-full">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-coffee-cream text-sm font-medium">
              {formatTime(progression.bestTimeSurvivedSeconds)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 bg-coffee-dark/30 px-2.5 py-1.5 rounded-full">
          <span className="text-base">🫘</span>
          <span className="text-gold font-bold">{progression.totalBeans}</span>
        </div>
      </div>
      
      {/* Cart Preview */}
      <div className="w-full max-w-xs bg-coffee-dark/20 rounded-xl p-4 mb-4">
        <div className="relative h-24 flex items-end justify-center">
          {/* Wheels */}
          <div className="absolute bottom-0 left-1/4 w-6 h-6 rounded-full bg-coffee-espresso border-2 border-coffee-dark" />
          <div className="absolute bottom-0 right-1/4 w-6 h-6 rounded-full bg-coffee-espresso border-2 border-coffee-dark" />
          
          {/* Chassis (always visible, base block) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-3 bg-coffee-espresso rounded-sm border border-coffee-dark" />
          
          {/* Cargo boxes (block count - 1) */}
          {Array.from({ length: blockCount - 1 }, (_, i) => (
            <div 
              key={i}
              className="absolute left-1/2 -translate-x-1/2 w-20 h-8 bg-coffee-medium rounded-lg border-2 border-coffee-dark shadow-md"
              style={{ bottom: 9 + 12 + (i * 10) + 'px' }}
            >
              <div className="absolute inset-1 bg-coffee-light/20 rounded" />
            </div>
          ))}
          
          {/* Barista head */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-coffee-cream rounded-full border-2 border-coffee-dark"
            style={{ bottom: blockCount > 1 ? 9 + 12 + ((blockCount - 1) * 10) + 8 : 9 + 12 + 8 + 'px' }}
          >
            <div className="absolute top-2 left-1 w-1.5 h-1.5 rounded-full bg-coffee-dark" />
            <div className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-coffee-dark" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-1 rounded-full bg-coffee-dark/50" />
          </div>
        </div>
        <p className="text-center text-coffee-cream/70 text-xs mt-2">
          {blockCount === 1 ? 'Chassis Only' : `+${blockCount - 1} Cargo Box${blockCount > 2 ? 'es' : ''}`}
        </p>
      </div>
      
      {/* Upgrades Section */}
      <div className="w-full max-w-xs mb-4">
        <h2 className="text-coffee-cream/80 text-sm font-semibold mb-2 uppercase tracking-wide">Upgrades</h2>
        <div className="flex flex-col gap-2">
          {UPGRADES.map((upgrade) => {
            const currentLevel = progression.upgradeLevels[upgrade.key];
            const maxLevel = upgrade.maxLevel ?? GAME_CONFIG.UPGRADE_MAX_LEVEL;
            const isMaxed = currentLevel >= maxLevel;
            const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
            const canAfford = progression.totalBeans >= cost;
            const isRecommended = upgrade.key === recommendedKey;
            const Icon = getIcon(upgrade.icon);
            
            // Display bonus
            const bonusDisplay = upgrade.isCount
              ? `+${currentLevel} box${currentLevel !== 1 ? 'es' : ''}`
              : `+${Math.round(getUpgradeMultiplier(currentLevel, upgrade.bonusPerLevel) * 100 - 100)}%`;
            
            return (
              <div 
                key={upgrade.key}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isRecommended 
                    ? 'bg-warm-orange/20 border-warm-orange/50' 
                    : 'bg-coffee-dark/30 border-coffee-dark/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${isRecommended ? 'bg-warm-orange/30' : 'bg-coffee-dark/50'}`}>
                  <Icon className={`w-5 h-5 ${isRecommended ? 'text-warm-orange' : 'text-coffee-cream'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-coffee-cream font-medium text-sm truncate">
                      {upgrade.name}
                    </span>
                    {isRecommended && (
                      <span className="text-xs bg-warm-orange/80 text-coffee-foam px-1.5 py-0.5 rounded-full">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-coffee-light/70">
                      Lv {currentLevel}/{maxLevel}
                    </span>
                    <span className="text-gold">{bonusDisplay}</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handlePurchase(upgrade)}
                  disabled={isMaxed || !canAfford}
                  size="sm"
                  className={`min-w-16 ${
                    isMaxed 
                      ? 'bg-coffee-dark/50 text-coffee-light/50' 
                      : canAfford 
                        ? 'bg-gold hover:bg-gold/90 text-coffee-espresso' 
                        : 'bg-coffee-dark/50 text-coffee-light/70'
                  }`}
                >
                  {isMaxed ? 'MAX' : `🫘${cost}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Game Mode Toggle */}
      <div className="w-full max-w-xs mb-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setSelectedMode('CHAPTER')}
            variant={selectedMode === 'CHAPTER' ? 'default' : 'outline'}
            className={`flex-1 ${
              selectedMode === 'CHAPTER' 
                ? 'bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam' 
                : 'border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30'
            }`}
          >
            <Play className="w-4 h-4 mr-1" />
            Chapter 1
          </Button>
          <Button
            onClick={() => setSelectedMode('ENDLESS')}
            variant={selectedMode === 'ENDLESS' ? 'default' : 'outline'}
            className={`flex-1 ${
              selectedMode === 'ENDLESS' 
                ? 'bg-gold hover:bg-gold/90 text-coffee-espresso' 
                : 'border-coffee-cream/30 text-coffee-cream hover:bg-coffee-dark/30'
            }`}
          >
            <Infinity className="w-4 h-4 mr-1" />
            Endless
          </Button>
        </div>
        <p className="text-coffee-cream/60 text-xs text-center mt-2">
          {selectedMode === 'CHAPTER' 
            ? '☕ Beat the Boss to clear Chapter 1!' 
            : '♾️ Survive as long as you can!'}
        </p>
        {selectedMode === 'CHAPTER' && progression.chapter1Cleared && (
          <p className="text-gold text-xs text-center mt-1">
            🏆 Best Clear: {formatTime(progression.bestChapter1Time)}
          </p>
        )}
      </div>
      
      {/* Play Button */}
      <Button
        onClick={handlePlay}
        size="lg"
        className="w-full max-w-xs bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-xl px-10 py-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform mb-4"
      >
        ☕ Play {selectedMode === 'CHAPTER' ? 'Chapter 1' : 'Endless'}
      </Button>
      
      {/* Instructions hint */}
      <div className="text-coffee-cream/60 text-xs text-center">
        <p>Auto-attack serves customers</p>
        <p className="mt-0.5">Tap ⚡ for Tonic Bomb (costs 2 energy)</p>
      </div>
    </div>
  );
};
