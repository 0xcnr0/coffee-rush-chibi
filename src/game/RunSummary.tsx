import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from './config';
import type { RunTelemetry } from './types';

interface RunSummaryProps {
  telemetry: RunTelemetry;
  timeSurvived: number;
}

export const RunSummary: React.FC<RunSummaryProps> = ({ telemetry, timeSurvived }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getSummaryJSON = () => {
    return JSON.stringify({
      // Run result
      gameMode: telemetry.gameMode,
      timeSurvived: Math.round(timeSurvived * 10) / 10,
      checkpointsReached: telemetry.checkpointsReached,
      reachedBoss: telemetry.reachedBoss,
      bossOutcome: telemetry.bossOutcome,
      bossHpPercent: telemetry.bossHpPercent,
      
      // Economy
      beansStart: telemetry.beansStart,
      beansEnd: telemetry.beansEnd,
      beansActual: telemetry.beansEarnedActual,
      beansBreakdown: telemetry.beansTotalBreakdown,
      economyDelta: telemetry.economyDelta,
      tipsFromServed: telemetry.tipsFromServed,
      bossReward: telemetry.bossRewardBeans,
      clearBonus: telemetry.clearBonusBeans,
      
      // Upgrades
      upgrades: telemetry.upgradeLevels,
      multipliers: {
        dmg: Math.round(telemetry.effectiveMultipliers.damage * 100) / 100,
        hp: Math.round(telemetry.effectiveMultipliers.blockHp * 100) / 100,
        energy: Math.round(telemetry.effectiveMultipliers.energy * 100) / 100,
      },
      
      // Combat
      shots: `${telemetry.shotsHit}/${telemetry.shotsFired}`,
      hitRate: `${telemetry.hitRate}%`,
      
      // Pressure
      maxLatched: telemetry.maxLatchedPeak,
      timeAtMaxLatched: Math.round(telemetry.timeAtMaxLatched * 10) / 10,
      rushCount: telemetry.rushCount,
      rushDuration: Math.round(telemetry.totalRushDuration * 10) / 10,
      
      // Survivability
      blocksLost: telemetry.blocksLost,
      firstBlockLostAt: telemetry.timeToFirstBlockLost >= 0 
        ? Math.round(telemetry.timeToFirstBlockLost * 10) / 10 
        : 'never',
      bombUses: telemetry.tonicBombUses,
      
      // Pacing telemetry
      recoveryTime: Math.round(telemetry.recoveryTimeTotal * 10) / 10,
      bossAdds: telemetry.bossAddsSpawned,
      
      // Spawns
      spawned: telemetry.enemiesSpawned,
      killed: telemetry.enemiesKilled,
    }, null, 2);
  };
  
  const getCompactSummary = () => {
    const { upgradeLevels: u, effectiveMultipliers: m } = telemetry;
    return `[${telemetry.gameMode}] ${formatTime(timeSurvived)} CP${telemetry.checkpointsReached} | Boss:${telemetry.bossOutcome}${telemetry.bossHpPercent > 0 ? `(${telemetry.bossHpPercent}%)` : ''} | Beans:${telemetry.beansEarnedActual}(B:${telemetry.beansTotalBreakdown}/D:${telemetry.economyDelta}) | Upgrades:B${u.blockCountLevel}/H${u.towerHpLevel}/D${u.espressoDamageLevel}/E${u.energyRegenLevel} | Mult:${m.damage.toFixed(2)}x/${m.blockHp.toFixed(2)}x/${m.energy.toFixed(2)}x | Hit:${telemetry.hitRate}% (${telemetry.shotsHit}/${telemetry.shotsFired}) | Latched:${telemetry.maxLatchedPeak}peak/${telemetry.timeAtMaxLatched.toFixed(1)}s | Rush:${telemetry.rushCount}x/${telemetry.totalRushDuration.toFixed(1)}s | Recovery:${telemetry.recoveryTimeTotal.toFixed(1)}s | BossAdds:${telemetry.bossAddsSpawned} | Blocks:-${telemetry.blocksLost} | Bombs:${telemetry.tonicBombUses}`;
  };
  
  const handleCopy = async (format: 'json' | 'compact') => {
    const text = format === 'json' ? getSummaryJSON() : getCompactSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };
  
  return (
    <div className="bg-coffee-dark/70 border border-coffee-medium/30 rounded-xl overflow-hidden w-full max-w-xs">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-coffee-medium/20 transition-colors"
      >
        <span className="text-coffee-cream text-sm font-medium">📊 Run Summary</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-coffee-light" />
        ) : (
          <ChevronDown className="w-4 h-4 text-coffee-light" />
        )}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-4 text-coffee-cream/90 mb-3">
            {/* Run Result */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-1">Run Result</div>
            <div>Mode: <span className="text-gold">{telemetry.gameMode}</span></div>
            <div>CP: <span className="text-warm-orange">{telemetry.checkpointsReached}</span></div>
            <div>Boss: <span className={telemetry.bossOutcome === 'defeated' ? 'text-green-400' : 'text-coffee-light'}>{telemetry.bossOutcome}</span></div>
            {telemetry.bossHpPercent > 0 && (
              <div>Boss HP: <span className="text-red-400">{telemetry.bossHpPercent}%</span></div>
            )}
            
            {/* Economy Section */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Economy</div>
            <div className="col-span-2">Tips: <span className="text-gold">{telemetry.tipsFromServed}</span> beans</div>
            {telemetry.bossRewardBeans > 0 && (
              <div className="col-span-2 text-coffee-light/50 text-[10px]">
                └ Boss reward: {telemetry.bossRewardBeans} <span className="text-coffee-light/40">(included)</span>
              </div>
            )}
            {telemetry.clearBonusBeans > 0 && (
              <div className="col-span-2">Clear Bonus: <span className="text-green-400">+{telemetry.clearBonusBeans}</span></div>
            )}
            <div className="col-span-2 bg-coffee-medium/30 rounded px-2 py-1 mt-1">
              <div className="flex justify-between">
                <span>Breakdown:</span>
                <span className="text-gold font-bold">{telemetry.beansTotalBreakdown} beans</span>
              </div>
              <div className="flex justify-between">
                <span>Actual:</span>
                <span className="text-gold font-bold">{telemetry.beansEarnedActual} beans</span>
              </div>
              <div className="flex justify-between">
                <span>Delta:</span>
                <span className={telemetry.economyDelta === 0 ? 'text-green-400' : 'text-red-400 font-bold'}>
                  {telemetry.economyDelta === 0 ? '0 ✓' : `⚠️ ${telemetry.economyDelta > 0 ? '+' : ''}${telemetry.economyDelta}`}
                </span>
              </div>
            </div>
            
            {/* Upgrades with Multipliers */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Build (Upgrade Levels)</div>
            <div className="col-span-2 bg-coffee-medium/30 rounded px-2 py-1">
              <div className="grid grid-cols-4 gap-1 text-center">
                <div>
                  <div className="text-coffee-light/50 text-[9px]">Box</div>
                  <div className="text-gold font-bold">L{telemetry.upgradeLevels.blockCountLevel}</div>
                </div>
                <div>
                  <div className="text-coffee-light/50 text-[9px]">HP</div>
                  <div className="text-gold font-bold">L{telemetry.upgradeLevels.towerHpLevel}</div>
                  <div className="text-secondary text-[9px]">{telemetry.effectiveMultipliers.blockHp.toFixed(2)}×</div>
                </div>
                <div>
                  <div className="text-coffee-light/50 text-[9px]">DMG</div>
                  <div className="text-gold font-bold">L{telemetry.upgradeLevels.espressoDamageLevel}</div>
                  <div className="text-secondary text-[9px]">{telemetry.effectiveMultipliers.damage.toFixed(2)}×</div>
                </div>
                <div>
                  <div className="text-coffee-light/50 text-[9px]">Energy</div>
                  <div className="text-gold font-bold">L{telemetry.upgradeLevels.energyRegenLevel}</div>
                  <div className="text-secondary text-[9px]">{telemetry.effectiveMultipliers.energy.toFixed(2)}×</div>
                </div>
              </div>
            </div>
            
            {/* Combat */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Combat</div>
            <div>Shots: {telemetry.shotsHit}/{telemetry.shotsFired}</div>
            <div>Hit Rate: <span className={telemetry.hitRate >= 80 ? 'text-green-400' : telemetry.hitRate >= 50 ? 'text-warm-orange' : 'text-red-400'}>{telemetry.hitRate}%</span></div>
            
            {/* Pressure */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Pressure</div>
            <div>Max Latched: <span className="text-warm-orange">{telemetry.maxLatchedPeak}</span></div>
            <div>@MaxLatched: {telemetry.timeAtMaxLatched.toFixed(1)}s</div>
            <div>Rush Count: {telemetry.rushCount}</div>
            <div>Rush Total: {telemetry.totalRushDuration.toFixed(1)}s</div>
            
            {/* Pacing (Phase 2D telemetry) */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Pacing</div>
            <div>Recovery: <span className="text-cyan-400">{telemetry.recoveryTimeTotal.toFixed(1)}s</span></div>
            <div>Boss Adds: <span className={telemetry.bossAddsSpawned === 0 ? 'text-green-400' : 'text-red-400'}>{telemetry.bossAddsSpawned}</span></div>
            
            {/* Survivability */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Survivability</div>
            <div>Blocks Lost: <span className={telemetry.blocksLost > 0 ? 'text-red-400' : 'text-green-400'}>{telemetry.blocksLost}</span></div>
            <div>1st Block @: {telemetry.timeToFirstBlockLost >= 0 ? `${telemetry.timeToFirstBlockLost.toFixed(1)}s` : '—'}</div>
            <div className="col-span-2">Bombs Used: {telemetry.tonicBombUses}</div>
            
            {/* Spawn Distribution */}
            <div className="col-span-2 text-coffee-light/60 text-[10px] uppercase mt-2">Enemies</div>
            <div>Spawned: N{telemetry.enemiesSpawned.normal}/H{telemetry.enemiesSpawned.heavy}/B{telemetry.enemiesSpawned.boss}</div>
            <div>Killed: N{telemetry.enemiesKilled.normal}/H{telemetry.enemiesKilled.heavy}/B{telemetry.enemiesKilled.boss}</div>
            
            {/* Config Debug (small, muted) */}
            <div className="col-span-2 text-coffee-light/40 text-[9px] mt-2 text-center">
              TIP={GAME_CONFIG.TIP_VALUE} | BOSS={GAME_CONFIG.BOSS_TIP_MULTIPLIER}x | BONUS={GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS} | SCALE={GAME_CONFIG.UPGRADE_COST_SCALING}
            </div>
          </div>
          
          {/* Copy Buttons */}
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => handleCopy('compact')}
              size="sm"
              variant="outline"
              className="flex-1 text-[10px] h-7 border-coffee-medium/50 text-coffee-cream hover:bg-coffee-medium/30"
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copy Line
            </Button>
            <Button
              onClick={() => handleCopy('json')}
              size="sm"
              variant="outline"
              className="flex-1 text-[10px] h-7 border-coffee-medium/50 text-coffee-cream hover:bg-coffee-medium/30"
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copy JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
