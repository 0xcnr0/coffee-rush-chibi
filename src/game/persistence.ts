// Persistence helper for Coffee Rush progression data
// Safely handles localStorage read/write with defaults

const STORAGE_KEY = 'coffee-rush-progress';
const SAVE_VERSION = 2; // Bump this to reset all player progression

export interface ProgressionData {
  version: number;
  bestTimeSurvivedSeconds: number;
  bestCustomersServed: number;
  totalBeans: number;
  upgradeLevels: {
    towerHpLevel: number;
    espressoDamageLevel: number;
    energyRegenLevel: number;
  };
}

const DEFAULT_PROGRESSION: ProgressionData = {
  version: SAVE_VERSION,
  bestTimeSurvivedSeconds: 0,
  bestCustomersServed: 0,
  totalBeans: 0,
  upgradeLevels: {
    towerHpLevel: 0,
    espressoDamageLevel: 0,
    energyRegenLevel: 0,
  },
};

export const loadProgression = (): ProgressionData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PROGRESSION };
    
    const parsed = JSON.parse(stored);
    
    // Version check - reset if version mismatch (hard reset all players)
    if (!parsed.version || parsed.version !== SAVE_VERSION) {
      console.info(`Save version mismatch (${parsed.version} !== ${SAVE_VERSION}), resetting progression`);
      saveProgression({ ...DEFAULT_PROGRESSION });
      return { ...DEFAULT_PROGRESSION };
    }
    
    // Merge with defaults to handle missing fields in old saves
    return {
      ...DEFAULT_PROGRESSION,
      ...parsed,
      upgradeLevels: {
        ...DEFAULT_PROGRESSION.upgradeLevels,
        ...parsed.upgradeLevels,
      },
    };
  } catch {
    console.warn('Failed to load progression, using defaults');
    return { ...DEFAULT_PROGRESSION };
  }
};

export const saveProgression = (data: ProgressionData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save progression');
  }
};

export const updateBestRecords = (
  timeSurvived: number,
  customersServed: number,
  tipsEarned: number
): { isNewTimeRecord: boolean; beansEarned: number } => {
  const current = loadProgression();
  
  const isNewTimeRecord = timeSurvived > current.bestTimeSurvivedSeconds;
  const beansEarned = tipsEarned; // 1 tip = 1 bean
  
  const updated: ProgressionData = {
    ...current,
    version: SAVE_VERSION,
    bestTimeSurvivedSeconds: Math.max(current.bestTimeSurvivedSeconds, timeSurvived),
    bestCustomersServed: Math.max(current.bestCustomersServed, customersServed),
    totalBeans: current.totalBeans + beansEarned,
  };
  
  saveProgression(updated);
  
  return { isNewTimeRecord, beansEarned };
};

export const purchaseUpgrade = (
  upgradeKey: keyof ProgressionData['upgradeLevels'],
  cost: number
): boolean => {
  const current = loadProgression();
  
  if (current.totalBeans < cost) return false;
  if (current.upgradeLevels[upgradeKey] >= 20) return false;
  
  current.totalBeans -= cost;
  current.upgradeLevels[upgradeKey] += 1;
  
  saveProgression(current);
  return true;
};

export const getUpgradeCost = (level: number, baseCost: number): number => {
  return Math.floor(baseCost * Math.pow(1.25, level));
};

// Calculate effective multiplier for an upgrade
export const getUpgradeMultiplier = (level: number, bonusPerLevel: number): number => {
  return 1 + bonusPerLevel * level;
};

// Reset all progression to defaults (DEV tool)
export const resetProgression = (): void => {
  saveProgression({ ...DEFAULT_PROGRESSION });
};
