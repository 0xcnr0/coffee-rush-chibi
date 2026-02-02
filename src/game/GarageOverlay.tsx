import React, { useState } from 'react';
import { Trophy, Shield, Zap, Package, Coffee, Lock, Swords, ShoppingBag, User, Wrench, Castle, ChevronDown, Check, Award, Battery, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProgression, purchaseUpgrade, getUpgradeCost, setLastGameMode, resetProgression } from './persistence';
import { GAME_CONFIG } from './config';
import { toast } from 'sonner';
import type { UpgradeInfo, GameMode } from './types';

interface GarageOverlayProps {
  onPlay: (mode: GameMode) => void;
  blockCount: number;
  onProgressionChange?: () => void;
}

// Upgrade definitions
const UPGRADES: UpgradeInfo[] = [
  {
    key: 'towerHpLevel',
    name: 'Cart HP',
    description: 'Increases cart durability',
    icon: 'shield',
    bonusPerLevel: GAME_CONFIG.TOWER_HP_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.TOWER_HP_BASE_COST,
  },
  {
    key: 'espressoDamageLevel',
    name: 'Damage',
    description: 'Shot damage',
    icon: 'coffee',
    bonusPerLevel: GAME_CONFIG.ESPRESSO_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.ESPRESSO_BASE_COST,
  },
  {
    key: 'energyRegenLevel',
    name: 'Power',
    description: 'Power regen speed',
    icon: 'zap',
    bonusPerLevel: GAME_CONFIG.POWER_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.POWER_BASE_COST,
  },
];

const CARGO_UPGRADE: UpgradeInfo = {
  key: 'blockCountLevel',
  name: '+1 Cargo',
  description: 'Add cargo box',
  icon: 'package',
  bonusPerLevel: 1,
  baseCost: GAME_CONFIG.BLOCK_COUNT_BASE_COST,
  maxLevel: GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL,
  isCount: true,
};

// Footer tabs
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

// Chapter names for more TDS-like feel
const CHAPTER_NAMES: Record<string, string> = {
  'CHAPTER': '☕ Dawn Rush',
  'ENDLESS': '∞ Endless',
};

export const GarageOverlay: React.FC<GarageOverlayProps> = ({ onPlay, blockCount, onProgressionChange }) => {
  const [progression, setProgression] = useState(loadProgression());
  const [selectedMode, setSelectedMode] = useState<GameMode>(progression.lastGameMode || 'CHAPTER');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);

  const handlePurchase = (upgrade: UpgradeInfo) => {
    const currentLevel = progression.upgradeLevels[upgrade.key];
    const maxLevel = upgrade.maxLevel ?? GAME_CONFIG.UPGRADE_MAX_LEVEL;
    if (currentLevel >= maxLevel) return;
    
    const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
    if (purchaseUpgrade(upgrade.key, cost)) {
      setProgression(loadProgression());
      onProgressionChange?.(); // Trigger canvas redraw in parent
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

  // Calculate upgrade states
  const cargoLevel = progression.upgradeLevels.blockCountLevel ?? 0;
  const cargoMaxed = cargoLevel >= GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL;
  const cargoCost = getUpgradeCost(cargoLevel, CARGO_UPGRADE.baseCost);
  const canAffordCargo = progression.totalBeans >= cargoCost;

  return (
    <div className={`absolute inset-0 flex flex-col z-20 transition-all duration-300 ${isTransitioning ? 'animate-fade-out' : ''}`}>
      {/* ═══════════════════════════════════════════════════════════════════════
          TOP INFO BAR (TDS-style)
          Left: Profile/Level | Center: Chapter Name | Right: Energy + Coins
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-coffee-espresso/95 backdrop-blur-sm border-b border-coffee-dark/50 px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Profile placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-coffee-dark/60 flex items-center justify-center border border-coffee-medium/30">
              <User className="w-5 h-5 text-coffee-cream/70" />
            </div>
            <div className="text-xs text-coffee-cream/60">
              <span className="text-coffee-cream font-semibold">Lv.1</span>
            </div>
          </div>

          {/* Center: Chapter name (clickable) */}
          <button
            onClick={() => setShowModeModal(true)}
            className="flex items-center gap-1 bg-coffee-dark/40 hover:bg-coffee-dark/60 rounded-full py-1.5 px-3 transition-colors"
          >
            <span className="text-coffee-cream font-semibold text-sm">
              {CHAPTER_NAMES[selectedMode] || '☕ Dawn Rush'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-coffee-cream/70" />
          </button>

          {/* Right: Energy + Coins + Quests */}
          <div className="flex items-center gap-2">
            {/* Energy (daily stamina) - NOT power */}
            <div className="flex items-center gap-1 bg-coffee-dark/40 rounded-full px-2 py-1">
              <Battery className="w-3.5 h-3.5 text-energy" />
              <span className="text-energy text-xs font-bold">10</span>
              <span className="text-coffee-cream/40 text-xs">/10</span>
            </div>
            
            {/* Coins */}
            <div className="flex items-center gap-1 bg-coffee-dark/40 rounded-full px-2 py-1">
              <span className="text-sm">🪙</span>
              <span className="text-gold font-bold text-xs">{progression.totalBeans}</span>
            </div>

            {/* Quests/Daily button */}
            <button
              onClick={() => setShowQuestsModal(true)}
              className="w-8 h-8 rounded-lg bg-coffee-dark/40 hover:bg-coffee-dark/60 flex items-center justify-center transition-colors"
            >
              <Award className="w-4 h-4 text-warm-orange" />
            </button>
          </div>
        </div>

        {/* Best time badge (if exists) */}
        {progression.bestTimeSurvivedSeconds > 0 && (
          <div className="flex justify-center mt-1">
            <div className="flex items-center gap-1 bg-gold/10 px-2 py-0.5 rounded-full">
              <Trophy className="w-3 h-3 text-gold" />
              <span className="text-gold text-[10px] font-medium">
                Best: {Math.floor(progression.bestTimeSurvivedSeconds / 60)}:{String(Math.floor(progression.bestTimeSurvivedSeconds % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GAME AREA (transparent - canvas shows through)
          Contextual upgrade tiles positioned around the cart
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative">
        {/* +1 Cargo tile (top-right of cart area) */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => handlePurchase(CARGO_UPGRADE)}
            disabled={cargoMaxed || !canAffordCargo}
            className={`flex flex-col items-center p-2 rounded-xl border-2 shadow-lg transition-all ${
              cargoMaxed 
                ? 'bg-coffee-dark/60 border-coffee-dark/30 opacity-60' 
                : canAffordCargo
                  ? 'bg-warm-orange/90 border-warm-orange hover:scale-105 active:scale-95'
                  : 'bg-coffee-dark/60 border-coffee-dark/30 opacity-70'
            }`}
          >
            <div className="text-2xl mb-0.5">📦</div>
            <div className="text-[10px] font-bold text-coffee-foam">+1</div>
            {!cargoMaxed && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="text-sm">🪙</span>
                <span className="text-[10px] font-bold text-coffee-foam">{cargoCost}</span>
              </div>
            )}
            {cargoMaxed && (
              <span className="text-[10px] text-coffee-cream/50 font-bold">MAX</span>
            )}
          </button>
        </div>

        {/* HP Upgrade tile (left side, only if cargo exists) */}
        {blockCount > 1 && (
          <div className="absolute left-3 top-1/3">
            <ContextualUpgradeTile
              upgrade={UPGRADES[0]}
              currentLevel={progression.upgradeLevels.towerHpLevel}
              beans={progression.totalBeans}
              onPurchase={() => handlePurchase(UPGRADES[0])}
            />
          </div>
        )}

        {/* Damage + Power tiles (bottom area, compact row) */}
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 flex gap-2">
          {UPGRADES.slice(1).map((upgrade) => {
            const currentLevel = progression.upgradeLevels[upgrade.key];
            return (
              <ContextualUpgradeTile
                key={upgrade.key}
                upgrade={upgrade}
                currentLevel={currentLevel}
                beans={progression.totalBeans}
                onPurchase={() => handlePurchase(upgrade)}
                compact
              />
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM INFO (Play button area)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-t from-coffee-espresso/95 via-coffee-espresso/80 to-transparent pb-16 pt-4 px-4">
        {/* Play Button */}
        <Button
          onClick={handlePlay}
          size="lg"
          className="w-full bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam text-xl font-bold py-6 rounded-2xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          ▶ PLAY
        </Button>

        {/* Reset button (small) */}
        <div className="flex justify-center mt-2">
          <Button
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone!')) {
                resetProgression();
                setProgression(loadProgression());
              }
            }}
            variant="ghost"
            size="sm"
            className="text-coffee-cream/30 hover:text-red-400 hover:bg-red-400/10 text-[10px]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER TABS (TDS-style navigation)
          ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODE SELECTION MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
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
                  <p className="text-coffee-cream font-semibold">☕ Dawn Rush</p>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          QUESTS MODAL (Placeholder)
          ═══════════════════════════════════════════════════════════════════════ */}
      {showQuestsModal && (
        <div 
          className="absolute inset-0 bg-coffee-espresso/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setShowQuestsModal(false)}
        >
          <div 
            className="bg-coffee-dark/95 rounded-2xl p-5 max-w-xs w-full mx-4 shadow-2xl border border-coffee-medium/50"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-coffee-cream text-center mb-4">
              📋 Quests
            </h2>
            
            {/* Tabs placeholder */}
            <div className="flex gap-1 mb-4">
              <button className="flex-1 bg-warm-orange/20 text-warm-orange text-xs font-bold py-2 rounded-lg">Daily</button>
              <button className="flex-1 bg-coffee-dark/30 text-coffee-cream/50 text-xs font-bold py-2 rounded-lg">Weekly</button>
              <button className="flex-1 bg-coffee-dark/30 text-coffee-cream/50 text-xs font-bold py-2 rounded-lg">Achievements</button>
            </div>
            
            {/* Placeholder content */}
            <div className="bg-coffee-espresso/50 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-coffee-cream/60 text-sm">Coming Soon!</p>
              <p className="text-coffee-cream/40 text-xs mt-1">Daily quests and achievements will be added in a future update.</p>
            </div>
            
            <button
              onClick={() => setShowQuestsModal(false)}
              className="w-full mt-4 bg-coffee-dark/50 hover:bg-coffee-dark/70 text-coffee-cream py-2 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL UPGRADE TILE (TDS-style small floating upgrade button)
// ═══════════════════════════════════════════════════════════════════════════════
interface ContextualUpgradeTileProps {
  upgrade: UpgradeInfo;
  currentLevel: number;
  beans: number;
  onPurchase: () => void;
  compact?: boolean;
}

const ContextualUpgradeTile: React.FC<ContextualUpgradeTileProps> = ({
  upgrade,
  currentLevel,
  beans,
  onPurchase,
  compact = false,
}) => {
  const maxLevel = upgrade.maxLevel ?? GAME_CONFIG.UPGRADE_MAX_LEVEL;
  const isMaxed = currentLevel >= maxLevel;
  const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
  const canAfford = beans >= cost;
  const Icon = getIcon(upgrade.icon);

  return (
    <button
      onClick={onPurchase}
      disabled={isMaxed || !canAfford}
      className={`flex flex-col items-center rounded-xl border-2 shadow-lg transition-all ${
        compact ? 'p-1.5 min-w-[52px]' : 'p-2 min-w-[60px]'
      } ${
        isMaxed 
          ? 'bg-coffee-dark/70 border-coffee-dark/40 opacity-60' 
          : canAfford
            ? 'bg-coffee-dark/80 border-coffee-medium/50 hover:scale-105 hover:border-warm-orange/50 active:scale-95'
            : 'bg-coffee-dark/70 border-coffee-dark/40 opacity-70'
      }`}
    >
      {/* Icon */}
      <div className={`rounded-lg ${compact ? 'p-1' : 'p-1.5'} ${canAfford && !isMaxed ? 'bg-warm-orange/20' : 'bg-coffee-dark/50'}`}>
        <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${canAfford && !isMaxed ? 'text-warm-orange' : 'text-coffee-cream/60'}`} />
      </div>
      
      {/* Level pips */}
      <div className="flex gap-0.5 my-1">
        {Array.from({ length: maxLevel }, (_, i) => (
          <div 
            key={i}
            className={`w-1.5 h-1 rounded-full ${i < currentLevel ? 'bg-gold' : 'bg-coffee-dark/60'}`}
          />
        ))}
      </div>
      
      {/* Cost or MAX */}
      <div className={`flex items-center gap-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        {isMaxed ? (
          <span className="text-coffee-cream/50 font-bold">MAX</span>
        ) : (
          <>
            <span className="text-xs">🪙</span>
            <span className="text-gold font-bold">{cost}</span>
          </>
        )}
      </div>
    </button>
  );
};
