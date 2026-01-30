import React, { useState } from 'react';
import { Coffee, Trophy, Shield, Zap, Package, Play, Infinity, RotateCcw, Lock, Swords, ShoppingBag, User, Wrench, Castle, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProgression, purchaseUpgrade, getUpgradeCost, getUpgradeMultiplier, setLastGameMode, resetProgression } from './persistence';
import { GAME_CONFIG } from './config';
import { toast } from 'sonner';
import type { UpgradeInfo, GameMode } from './types';

interface GarageScreenProps {
  onPlay: (mode: GameMode) => void;
}

const UPGRADES: UpgradeInfo[] = [
  {
    key: 'towerHpLevel',
    name: 'Tower HP',
    description: 'Cart HP',
    icon: 'shield',
    bonusPerLevel: GAME_CONFIG.TOWER_HP_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.TOWER_HP_BASE_COST,
  },
  {
    key: 'espressoDamageLevel',
    name: 'Damage',
    description: 'Shot Damage',
    icon: 'coffee',
    bonusPerLevel: GAME_CONFIG.ESPRESSO_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.ESPRESSO_BASE_COST,
  },
  {
    key: 'energyRegenLevel',
    name: 'Power',
    description: 'Power Regen',
    icon: 'zap',
    bonusPerLevel: GAME_CONFIG.POWER_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.POWER_BASE_COST,
  },
  {
    key: 'blockCountLevel',
    name: 'Cargo',
    description: 'Extra HP Buffer',
    icon: 'package',
    bonusPerLevel: 1,
    baseCost: GAME_CONFIG.BLOCK_COUNT_BASE_COST,
    maxLevel: GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL,
    isCount: true,
  },
];

// Footer tabs configuration
const FOOTER_TABS = [
  { id: 'battle', label: 'Battle', icon: Swords, active: true },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, active: false },
  { id: 'hero', label: 'Hero', icon: User, active: false },
  { id: 'weapons', label: 'Weapons', icon: Wrench, active: false },
  { id: 'tower', label: 'Tower', icon: Castle, active: false },
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
const getRecommendedUpgrade = (levels: Record<string, number>): string | null => {
  if (levels.blockCountLevel === 0) return 'blockCountLevel';
  if (levels.towerHpLevel === 0) return 'towerHpLevel';
  if (levels.espressoDamageLevel === 0) return 'espressoDamageLevel';
  if (levels.energyRegenLevel === 0) return 'energyRegenLevel';
  return null;
};

export const GarageScreen: React.FC<GarageScreenProps> = ({ onPlay }) => {
  const [progression, setProgression] = useState(loadProgression());
  const [selectedMode, setSelectedMode] = useState<GameMode>(progression.lastGameMode || 'CHAPTER');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  
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
    setIsTransitioning(true);
    setLastGameMode(selectedMode);
    setTimeout(() => onPlay(selectedMode), 300);
  };
  
  const handleTabClick = (tabId: string, isActive: boolean) => {
    if (!isActive) {
      toast('Coming Soon!', {
        description: 'This feature will be available in a future update.',
        icon: '🔒',
      });
    }
  };
  
  const handleSelectMode = (mode: GameMode | 'CHAPTER2') => {
    if (mode === 'CHAPTER2') {
      toast('Coming Soon!', {
        description: 'Chapter 2 will be available after you master Chapter 1!',
        icon: '🔒',
      });
      return;
    }
    setSelectedMode(mode);
    setShowModeModal(false);
  };
  
  const recommendedKey = getRecommendedUpgrade(progression.upgradeLevels);
  const blockCount = 1 + progression.upgradeLevels.blockCountLevel;
  
  return (
    <div className={`absolute inset-0 flex flex-col bg-gradient-to-b from-coffee-light to-coffee-medium z-20 transition-all duration-300 ${isTransitioning ? 'animate-fade-out' : ''}`}>
      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Header */}
        <div className="flex flex-col items-center mb-3 animate-pop-in">
          <div className="relative mb-1">
            <Coffee className="w-10 h-10 text-coffee-cream drop-shadow-lg" />
          </div>
          <h1 className="text-xl font-bold text-coffee-cream text-center drop-shadow-lg">
            Coffee Rush
          </h1>
        </div>
        
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {progression.bestTimeSurvivedSeconds > 0 && (
            <div className="flex items-center gap-1 bg-coffee-dark/30 px-2 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span className="text-coffee-cream text-xs font-medium">
                {formatTime(progression.bestTimeSurvivedSeconds)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-coffee-dark/30 px-2 py-1 rounded-full">
            <span className="text-sm">🫘</span>
            <span className="text-gold font-bold text-sm">{progression.totalBeans}</span>
          </div>
        </div>
        
        {/* Chapter/Mode Selector Header */}
        <button
          onClick={() => setShowModeModal(true)}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-coffee-dark/40 hover:bg-coffee-dark/60 rounded-xl py-2 px-4 mb-3 transition-colors"
        >
          <span className="text-coffee-cream font-semibold">
            {selectedMode === 'CHAPTER' ? '☕ Chapter 1' : '∞ Endless Mode'}
          </span>
          <ChevronDown className="w-4 h-4 text-coffee-cream/70" />
        </button>
        
        {/* Cart Preview - Compact */}
        <div className="w-full max-w-xs mx-auto bg-coffee-dark/20 rounded-xl p-3 mb-3">
          <div className="relative h-20 flex items-end justify-center">
            {/* Wheels */}
            <div className="absolute bottom-0 left-1/4 w-5 h-5 rounded-full bg-coffee-espresso border-2 border-coffee-dark" />
            <div className="absolute bottom-0 right-1/4 w-5 h-5 rounded-full bg-coffee-espresso border-2 border-coffee-dark" />
            
            {/* Chassis */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-20 h-2.5 bg-coffee-espresso rounded-sm border border-coffee-dark" />
            
            {/* Cargo boxes */}
            {Array.from({ length: blockCount - 1 }, (_, i) => (
              <div 
                key={i}
                className="absolute left-1/2 -translate-x-1/2 w-16 h-6 bg-coffee-medium rounded-lg border-2 border-coffee-dark shadow-md"
                style={{ bottom: 7 + 10 + (i * 8) + 'px' }}
              >
                <div className="absolute inset-0.5 bg-coffee-light/20 rounded" />
              </div>
            ))}
            
            {/* Barista head */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-7 h-7 bg-coffee-cream rounded-full border-2 border-coffee-dark"
              style={{ bottom: blockCount > 1 ? 7 + 10 + ((blockCount - 1) * 8) + 6 : 7 + 10 + 6 + 'px' }}
            >
              <div className="absolute top-1.5 left-1 w-1 h-1 rounded-full bg-coffee-dark" />
              <div className="absolute top-1.5 right-1 w-1 h-1 rounded-full bg-coffee-dark" />
            </div>
          </div>
        </div>
        
        {/* Compact Upgrade Tiles - 2x2 Grid */}
        <div className="w-full max-w-xs mx-auto mb-4">
          <div className="grid grid-cols-4 gap-2">
            {UPGRADES.map((upgrade) => {
              const currentLevel = progression.upgradeLevels[upgrade.key];
              const maxLevel = upgrade.maxLevel ?? GAME_CONFIG.UPGRADE_MAX_LEVEL;
              const isMaxed = currentLevel >= maxLevel;
              const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
              const canAfford = progression.totalBeans >= cost;
              const isRecommended = upgrade.key === recommendedKey;
              const Icon = getIcon(upgrade.icon);
              
              return (
                <button
                  key={upgrade.key}
                  onClick={() => handlePurchase(upgrade)}
                  disabled={isMaxed || !canAfford}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                    isRecommended 
                      ? 'bg-warm-orange/20 border-warm-orange/50 ring-1 ring-warm-orange/30' 
                      : 'bg-coffee-dark/30 border-coffee-dark/50'
                  } ${!isMaxed && canAfford ? 'hover:scale-105 active:scale-95' : 'opacity-70'}`}
                >
                  {/* Icon */}
                  <div className={`p-1.5 rounded-lg mb-1 ${isRecommended ? 'bg-warm-orange/30' : 'bg-coffee-dark/50'}`}>
                    <Icon className={`w-5 h-5 ${isRecommended ? 'text-warm-orange' : 'text-coffee-cream'}`} />
                  </div>
                  
                  {/* Level pips */}
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: maxLevel }, (_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-1 rounded-full ${i < currentLevel ? 'bg-gold' : 'bg-coffee-dark/50'}`}
                      />
                    ))}
                  </div>
                  
                  {/* Cost or MAX */}
                  <div className={`text-[10px] font-bold ${isMaxed ? 'text-coffee-cream/50' : 'text-gold'}`}>
                    {isMaxed ? 'MAX' : `🫘${cost}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Play Button */}
        <Button
          onClick={handlePlay}
          size="lg"
          className="w-full max-w-xs mx-auto block bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-xl px-8 py-5 rounded-2xl shadow-lg transform hover:scale-105 transition-transform mb-3"
        >
          ☕ Play {selectedMode === 'CHAPTER' ? 'Chapter 1' : 'Endless'}
        </Button>
        
        {/* Chapter clear badge */}
        {selectedMode === 'CHAPTER' && progression.chapter1Cleared && (
          <p className="text-gold text-xs text-center">
            🏆 Best Clear: {formatTime(progression.bestChapter1Time)}
          </p>
        )}
        
        {/* Reset Button */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => {
              if (confirm('Reset all upgrades and beans? This cannot be undone!')) {
                resetProgression();
                setProgression(loadProgression());
              }
            }}
            variant="ghost"
            size="sm"
            className="text-coffee-cream/40 hover:text-red-400 hover:bg-red-400/10 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Footer Tabs - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-coffee-espresso/95 border-t border-coffee-dark/50 backdrop-blur-sm">
        <div className="flex justify-around py-2 px-1">
          {FOOTER_TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.active)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  tab.active 
                    ? 'text-warm-orange' 
                    : 'text-coffee-cream/40 hover:text-coffee-cream/60'
                }`}
              >
                <div className="relative">
                  <TabIcon className="w-5 h-5" />
                  {!tab.active && (
                    <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-coffee-cream/50" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Mode Selection Modal */}
      {showModeModal && (
        <div 
          className="absolute inset-0 bg-coffee-espresso/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setShowModeModal(false)}
        >
          <div 
            className="bg-coffee-dark/95 rounded-2xl p-5 max-w-xs w-full mx-4 shadow-2xl border border-coffee-medium/50"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-coffee-cream text-center mb-4">
              Select Mode
            </h2>
            
            <div className="flex flex-col gap-2">
              {/* Chapter 1 */}
              <button
                onClick={() => handleSelectMode('CHAPTER')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedMode === 'CHAPTER'
                    ? 'bg-warm-orange/20 border-warm-orange'
                    : 'bg-coffee-dark/30 border-coffee-dark/50 hover:bg-coffee-dark/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedMode === 'CHAPTER' ? 'bg-warm-orange' : 'bg-coffee-dark/50'
                }`}>
                  {selectedMode === 'CHAPTER' && <Check className="w-4 h-4 text-coffee-foam" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-coffee-cream font-semibold">☕ Chapter 1</p>
                  <p className="text-coffee-cream/60 text-xs">Beat the Boss to clear!</p>
                </div>
              </button>
              
              {/* Chapter 2 - Locked */}
              <button
                onClick={() => handleSelectMode('CHAPTER2')}
                className="flex items-center gap-3 p-3 rounded-xl border border-coffee-dark/30 bg-coffee-dark/20 opacity-60"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-coffee-dark/50">
                  <Lock className="w-3 h-3 text-coffee-cream/50" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-coffee-cream/70 font-semibold">🔒 Chapter 2</p>
                  <p className="text-coffee-cream/40 text-xs">Coming Soon...</p>
                </div>
              </button>
              
              {/* Endless */}
              <button
                onClick={() => handleSelectMode('ENDLESS')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedMode === 'ENDLESS'
                    ? 'bg-gold/20 border-gold'
                    : 'bg-coffee-dark/30 border-coffee-dark/50 hover:bg-coffee-dark/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedMode === 'ENDLESS' ? 'bg-gold' : 'bg-coffee-dark/50'
                }`}>
                  {selectedMode === 'ENDLESS' && <Check className="w-4 h-4 text-coffee-espresso" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-coffee-cream font-semibold">∞ Endless Mode</p>
                  <p className="text-coffee-cream/60 text-xs">Survive as long as you can!</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
