import React, { useState } from 'react';
import { Shield, Zap, Package, Coffee, Lock, Swords, ShoppingBag, User, Wrench, Castle, ChevronDown, Check, Award, BatteryFull, RotateCcw, Play } from 'lucide-react';
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
    name: 'HP',
    description: 'Increases cart durability',
    icon: 'shield',
    bonusPerLevel: GAME_CONFIG.TOWER_HP_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.TOWER_HP_BASE_COST,
  },
  {
    key: 'espressoDamageLevel',
    name: 'Espresso',
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
  'CHAPTER': 'Dawn Rush',
  'ENDLESS': 'Endless',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HORIZONTAL UPGRADE TILE (Power, Damage - bottom row)
// ═══════════════════════════════════════════════════════════════════════════════
interface HorizontalUpgradeTileProps {
  upgrade: UpgradeInfo;
  currentLevel: number;
  beans: number;
  onPurchase: () => void;
}

const HorizontalUpgradeTile: React.FC<HorizontalUpgradeTileProps> = ({
  upgrade,
  currentLevel,
  beans,
  onPurchase,
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
      className={`
        flex-1 flex items-center gap-2 p-2 rounded-xl border-2 
        transition-all duration-200
        ${isMaxed 
          ? 'bg-coffee-dark/60 border-coffee-medium/30 opacity-60' 
          : canAfford
            ? 'bg-coffee-dark/80 border-warm-orange/50 hover:border-warm-orange active:scale-95'
            : 'bg-coffee-dark/60 border-coffee-medium/30 opacity-70'
        }
      `}
    >
      {/* Icon */}
      <div className={`p-1.5 rounded-lg ${isMaxed ? 'bg-coffee-medium/20' : 'bg-warm-orange/20'}`}>
        <Icon className={`w-5 h-5 ${isMaxed ? 'text-coffee-cream/50' : 'text-warm-orange'}`} />
      </div>
      
      {/* Name + Level pips */}
      <div className="flex-1 text-left">
        <span className="text-xs text-coffee-cream/80">{upgrade.name}</span>
        <div className="flex gap-0.5 mt-0.5">
          {Array.from({ length: maxLevel }, (_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < currentLevel ? 'bg-warm-orange' : 'bg-coffee-medium/40'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Cost */}
      {isMaxed ? (
        <div className="flex items-center gap-0.5">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">MAX</span>
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          <span className="text-sm">🪙</span>
          <span className={`text-sm font-bold ${canAfford ? 'text-gold' : 'text-coffee-cream/50'}`}>
            {cost}
          </span>
        </div>
      )}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMALL HP TILE (next to cargo boxes - left side)
// ═══════════════════════════════════════════════════════════════════════════════
interface SmallHPTileProps {
  currentLevel: number;
  beans: number;
  onPurchase: () => void;
  baseCost: number;
}

const SmallHPTile: React.FC<SmallHPTileProps> = ({
  currentLevel,
  beans,
  onPurchase,
  baseCost,
}) => {
  const maxLevel = GAME_CONFIG.UPGRADE_MAX_LEVEL;
  const isMaxed = currentLevel >= maxLevel;
  const cost = getUpgradeCost(currentLevel, baseCost);
  const canAfford = beans >= cost;

  return (
    <button
      onClick={onPurchase}
      disabled={isMaxed || !canAfford}
      className={`
        flex flex-col items-center justify-center p-1 rounded-md border min-w-[32px] h-[38px]
        transition-all duration-200
        ${isMaxed 
          ? 'bg-coffee-dark/60 border-coffee-medium/30 opacity-60' 
          : canAfford
            ? 'bg-coffee-dark/80 border-warm-orange/50 hover:border-warm-orange active:scale-95'
            : 'bg-coffee-dark/60 border-coffee-medium/30 opacity-70'
        }
      `}
    >
      <Shield className={`w-3.5 h-3.5 ${isMaxed ? 'text-coffee-cream/50' : 'text-warm-orange'}`} />
      <div className="flex gap-px mt-0.5">
        {Array.from({ length: maxLevel }, (_, i) => (
          <div 
            key={i}
            className={`w-1 h-1 rounded-full ${
              i < currentLevel ? 'bg-warm-orange' : 'bg-coffee-medium/40'
            }`}
          />
        ))}
      </div>
      {isMaxed ? (
        <span className="text-[6px] text-green-400 mt-0.5">MAX</span>
      ) : (
        <span className={`text-[7px] mt-0.5 ${canAfford ? 'text-gold' : 'text-coffee-cream/50'}`}>
          🪙{cost}
        </span>
      )}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARGO UPGRADE TILE (+1 Cargo - top right of cart)
// ═══════════════════════════════════════════════════════════════════════════════
interface CargoTileProps {
  currentLevel: number;
  beans: number;
  onPurchase: () => void;
  baseCost: number;
}

const CargoTile: React.FC<CargoTileProps> = ({
  currentLevel,
  beans,
  onPurchase,
  baseCost,
}) => {
  const maxLevel = GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL;
  const isMaxed = currentLevel >= maxLevel;
  const cost = getUpgradeCost(currentLevel, baseCost);
  const canAfford = beans >= cost;

  return (
    <button
      onClick={onPurchase}
      disabled={isMaxed || !canAfford}
      className={`
        flex flex-col items-center p-2 rounded-xl border-2 min-w-[56px]
        transition-all duration-200
        ${isMaxed 
          ? 'bg-coffee-dark/60 border-coffee-medium/30 opacity-60' 
          : canAfford
            ? 'bg-coffee-dark/80 border-warm-orange/50 hover:border-warm-orange active:scale-95'
            : 'bg-coffee-dark/60 border-coffee-medium/30 opacity-70'
        }
      `}
    >
      <Package className={`w-5 h-5 ${isMaxed ? 'text-coffee-cream/50' : 'text-warm-orange'}`} />
      <span className="text-[10px] text-coffee-cream/80 mt-0.5">+1 Cargo</span>
      <div className="flex gap-0.5 my-0.5">
        {Array.from({ length: maxLevel }, (_, i) => (
          <div 
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < currentLevel ? 'bg-warm-orange' : 'bg-coffee-medium/40'
            }`}
          />
        ))}
      </div>
      {isMaxed ? (
        <span className="text-[9px] text-green-400">MAX</span>
      ) : (
        <span className={`text-[9px] ${canAfford ? 'text-gold' : 'text-coffee-cream/50'}`}>
          🪙{cost}
        </span>
      )}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GARAGE OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
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
      onProgressionChange?.();
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

  const handleReset = () => {
    if (confirm('Reset all progress? This cannot be undone!')) {
      resetProgression();
      setProgression(loadProgression());
      onProgressionChange?.();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CANVAS POSITION CALCULATIONS (must match renderer.ts exactly!)
  // ═══════════════════════════════════════════════════════════════════════════════
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
  
  // Chassis positioning (matches renderer.ts)
  const chassisHeight = Math.floor(GAME_CONFIG.BLOCK_HEIGHT * 0.4);
  const chassisY = groundY - 30 - chassisHeight;
  const boxHeight = GAME_CONFIG.BLOCK_HEIGHT - 4;
  
  // Get Y position for cargo box (matching renderer exactly)
  // Box stacks directly on chassis, then on each other
  const getCargoBoxY = (boxId: number) => {
    // boxId: 1 = first cargo box, 2 = second cargo box, etc.
    const boxIndex = boxId - 1; // 0 for first cargo box, 1 for second
    // Must match renderer: blockY = chassisY - (boxIndex + 1) * boxHeight
    return chassisY - (boxIndex + 1) * boxHeight;
  };

  // Barista position (matches renderer.ts)
  const cargoBlockCount = blockCount - 1; // Exclude chassis
  const topY = chassisY - (cargoBlockCount * boxHeight);
  const baristaY = topY - 25;
  
  // Cart right edge for cargo button
  const cartRightEdge = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH;

  // Upgrade states
  const hpLevel = progression.upgradeLevels.towerHpLevel ?? 0;
  const cargoLevel = progression.upgradeLevels.blockCountLevel ?? 0;
  const cargoMaxed = cargoLevel >= GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL;

  return (
    <div className={`absolute inset-0 flex flex-col z-20 transition-all duration-300 ${isTransitioning ? 'animate-fade-out' : ''}`}>
      {/* ═══════════════════════════════════════════════════════════════════════
          TOP BAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="px-3 py-2">
        {/* Row 1: Level, Energy, Coins, Quest */}
        <div className="flex items-center justify-between">
          {/* Left: Profile */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-coffee-dark/60 flex items-center justify-center border border-coffee-medium/30">
              <User className="w-5 h-5 text-coffee-cream/70" />
            </div>
            <div className="text-xs text-coffee-cream/60">
              <span className="text-coffee-cream font-semibold">Lv.1</span>
            </div>
          </div>

          {/* Right: Energy + Coins + Quests */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-coffee-dark/40 rounded-full px-2 py-1">
              <BatteryFull className="w-3.5 h-3.5 text-energy" />
              <span className="text-energy text-xs font-bold">10</span>
              <span className="text-coffee-cream/40 text-xs">/10</span>
            </div>
            
            <div className="flex items-center gap-1 bg-coffee-dark/40 rounded-full px-2 py-1">
              <span className="text-sm">🪙</span>
              <span className="text-gold font-bold text-xs">{progression.totalBeans}</span>
            </div>

            <button
              onClick={() => setShowQuestsModal(true)}
              className="w-8 h-8 rounded-lg bg-coffee-dark/40 hover:bg-coffee-dark/60 flex items-center justify-center transition-colors"
            >
              <Award className="w-4 h-4 text-warm-orange" />
            </button>
          </div>
        </div>

        {/* Row 2: Chapter Dropdown - below top bar, right aligned */}
        <button
          onClick={() => setShowModeModal(true)}
          className="mt-2 flex items-center gap-1 bg-coffee-dark/40 hover:bg-coffee-dark/60 rounded-full py-1 px-3 ml-auto transition-colors"
        >
          <span className="text-sm">☕</span>
          <span className="text-xs text-coffee-cream">
            {CHAPTER_NAMES[selectedMode] || 'Dawn Rush'}
          </span>
          <ChevronDown className="w-3 h-3 text-coffee-cream/60" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          UPGRADE TILES - Absolute positioned relative to cart
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none">
        {/* HP Upgrade Tiles - Only for cargo boxes (not chassis) */}
        {/* Chassis (index 0) has fixed HP, only cargo boxes (index 1+) get HP upgrades */}
        {blockCount > 1 && Array.from({ length: blockCount - 1 }, (_, i) => {
          const boxNumber = i + 1; // 1 = first cargo box, 2 = second, etc.
          const boxY = getCargoBoxY(boxNumber);
          const hpTileTop = boxY + Math.round(boxHeight / 2) - 19; // center on box (tile is ~38px tall)
          return (
            <div 
              key={boxNumber}
              className="absolute pointer-events-auto"
              style={{ 
                top: hpTileTop,
                left: GAME_CONFIG.CART_X - 36, // Tight to box left edge
              }}
            >
              <SmallHPTile
                currentLevel={hpLevel}
                beans={progression.totalBeans}
                onPurchase={() => handlePurchase(UPGRADES[0])}
                baseCost={UPGRADES[0].baseCost}
              />
            </div>
          );
        })}

        {/* +1 Cargo Tile - Top right of cart (barista level) */}
        <div 
          className="absolute pointer-events-auto"
          style={{ 
            top: baristaY - 10,
            left: cartRightEdge + 15,
          }}
        >
          <CargoTile
            currentLevel={cargoLevel}
            beans={progression.totalBeans}
            onPurchase={() => handlePurchase(CARGO_UPGRADE)}
            baseCost={CARGO_UPGRADE.baseCost}
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM PANEL - 3 Rows above footer
          Row 3: Power + Damage (horizontal)
          Row 2: PLAY (wide) + Reset (narrow)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="pb-16 px-4 flex flex-col gap-2">
        {/* Row 3: Power + Damage (horizontal tiles) */}
        <div className="flex gap-2">
          <HorizontalUpgradeTile
            upgrade={UPGRADES[2]} // Power
            currentLevel={progression.upgradeLevels.energyRegenLevel ?? 0}
            beans={progression.totalBeans}
            onPurchase={() => handlePurchase(UPGRADES[2])}
          />
          <HorizontalUpgradeTile
            upgrade={UPGRADES[1]} // Espresso/Damage
            currentLevel={progression.upgradeLevels.espressoDamageLevel ?? 0}
            beans={progression.totalBeans}
            onPurchase={() => handlePurchase(UPGRADES[1])}
          />
        </div>
        
        {/* Row 2: PLAY (wide) + Reset (narrow) */}
        <div className="flex gap-2">
          <Button
            onClick={handlePlay}
            className="relative flex-1 py-5 text-lg font-bold bg-warm-orange hover:bg-warm-orange/90 text-white rounded-xl shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" fill="currentColor" />
            PLAY
            {/* Energy cost badge */}
            <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-coffee-dark/60 rounded-md px-1.5 py-0.5">
              <BatteryFull className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-bold text-white">x1</span>
            </div>
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-12 py-5 border-2 border-coffee-medium/50 bg-coffee-dark/60 hover:bg-coffee-dark/80 rounded-xl"
          >
            <RotateCcw className="w-4 h-4 text-coffee-cream/70" />
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER TABS (Row 1 - absolute bottom)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 bg-coffee-dark/90 border-t border-coffee-medium/30">
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
            
            <div className="flex gap-1 mb-4">
              <button className="flex-1 bg-warm-orange/20 text-warm-orange text-xs font-bold py-2 rounded-lg">Daily</button>
              <button className="flex-1 bg-coffee-dark/30 text-coffee-cream/50 text-xs font-bold py-2 rounded-lg">Weekly</button>
              <button className="flex-1 bg-coffee-dark/30 text-coffee-cream/50 text-xs font-bold py-2 rounded-lg">Achievements</button>
            </div>
            
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
