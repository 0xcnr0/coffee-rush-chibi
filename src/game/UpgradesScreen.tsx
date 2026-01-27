import React from 'react';
import { ArrowLeft, Shield, Zap, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from './config';
import { 
  loadProgression, 
  purchaseUpgrade, 
  getUpgradeCost, 
  getUpgradeMultiplier,
  type ProgressionData 
} from './persistence';
import type { UpgradeInfo } from './types';

interface UpgradesScreenProps {
  onBack: () => void;
}

const UPGRADES: UpgradeInfo[] = [
  {
    key: 'towerHpLevel',
    name: 'Tower Reinforcement',
    description: 'Cart blocks have more HP',
    icon: 'shield',
    bonusPerLevel: GAME_CONFIG.TOWER_HP_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.TOWER_HP_BASE_COST,
  },
  {
    key: 'espressoDamageLevel',
    name: 'Espresso Mastery',
    description: 'Espresso shots deal more damage',
    icon: 'zap',
    bonusPerLevel: GAME_CONFIG.ESPRESSO_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.ESPRESSO_BASE_COST,
  },
  {
    key: 'energyRegenLevel',
    name: 'Caffeine Flow',
    description: 'Energy regenerates faster',
    icon: 'battery',
    bonusPerLevel: GAME_CONFIG.ENERGY_BONUS_PER_LEVEL,
    baseCost: GAME_CONFIG.ENERGY_BASE_COST,
  },
];

const IconComponent: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  switch (icon) {
    case 'shield': return <Shield className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'battery': return <Battery className={className} />;
    default: return null;
  }
};

export const UpgradesScreen: React.FC<UpgradesScreenProps> = ({ onBack }) => {
  const [progression, setProgression] = React.useState<ProgressionData>(loadProgression);
  
  const handleUpgrade = (upgrade: UpgradeInfo) => {
    const currentLevel = progression.upgradeLevels[upgrade.key];
    const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
    
    if (purchaseUpgrade(upgrade.key, cost)) {
      setProgression(loadProgression());
    }
  };
  
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-coffee-dark to-coffee-espresso p-4 z-20 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-xs flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-coffee-cream hover:text-coffee-foam hover:bg-coffee-medium/30"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        
        <div className="flex items-center gap-2 bg-coffee-medium/50 px-3 py-1.5 rounded-full">
          <span className="text-lg">🫘</span>
          <span className="text-gold font-bold">{progression.totalBeans}</span>
        </div>
      </div>
      
      {/* Title */}
      <h2 className="text-2xl font-bold text-coffee-cream mb-6">Upgrades</h2>
      
      {/* Upgrade Cards */}
      <div className="w-full max-w-xs space-y-4">
        {UPGRADES.map((upgrade) => {
          const currentLevel = progression.upgradeLevels[upgrade.key];
          const isMaxLevel = currentLevel >= GAME_CONFIG.UPGRADE_MAX_LEVEL;
          const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
          const canAfford = progression.totalBeans >= cost;
          const currentBonus = getUpgradeMultiplier(currentLevel, upgrade.bonusPerLevel);
          const nextBonus = getUpgradeMultiplier(currentLevel + 1, upgrade.bonusPerLevel);
          
          return (
            <div 
              key={upgrade.key}
              className="bg-coffee-medium/40 rounded-xl p-4 border border-coffee-light/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-coffee-dark/50 rounded-lg">
                  <IconComponent icon={upgrade.icon} className="w-6 h-6 text-gold" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-coffee-cream font-semibold">{upgrade.name}</h3>
                    <span className="text-coffee-light text-sm">
                      Lv.{currentLevel}/{GAME_CONFIG.UPGRADE_MAX_LEVEL}
                    </span>
                  </div>
                  
                  <p className="text-coffee-light/70 text-sm mt-1">{upgrade.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm">
                      {isMaxLevel ? (
                        <span className="text-gold">MAX</span>
                      ) : (
                        <span className="text-coffee-foam">
                          +{Math.round((currentBonus - 1) * 100)}% → 
                          <span className="text-secondary"> +{Math.round((nextBonus - 1) * 100)}%</span>
                        </span>
                      )}
                    </div>
                    
                    {!isMaxLevel && (
                      <Button
                        onClick={() => handleUpgrade(upgrade)}
                        disabled={!canAfford}
                        size="sm"
                        className={`
                          px-3 py-1 text-sm rounded-lg
                          ${canAfford 
                            ? 'bg-warm-orange hover:bg-warm-orange/90 text-coffee-foam' 
                            : 'bg-coffee-dark/50 text-coffee-light/50 cursor-not-allowed'
                          }
                        `}
                      >
                        🫘 {cost}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tip */}
      <p className="text-coffee-light/50 text-xs text-center mt-6 max-w-xs">
        Earn beans by collecting tips in runs. 1 tip = 1 bean!
      </p>
    </div>
  );
};
