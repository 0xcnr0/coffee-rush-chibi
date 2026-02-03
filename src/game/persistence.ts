// Persistence helper for Coffee Rush progression data
// Safely handles localStorage read/write with defaults

import type { GameMode, WeaponType, WeaponSlot } from './types';

const STORAGE_KEY = 'coffee-rush-progress';
const SAVE_VERSION = 8; // Bump: Phase 4 Energy System

import { GAME_CONFIG } from './config';

export interface ProgressionData {
  version: number;
  bestTimeSurvivedSeconds: number;
  bestCustomersServed: number;
  totalBeans: number;
  upgradeLevels: {
    towerHpLevel: number;
    espressoDamageLevel: number;
    energyRegenLevel: number;
    blockCountLevel: number; // Phase 1.7: 0=1block, 1=2blocks, 2=3blocks
  };
  // Phase 2B-2: Chapter mode tracking
  chapter1Cleared: boolean;
  bestChapter1Time: number;
  lastGameMode: GameMode;
  // Phase 3: Weapon slots for each cargo box (max 2 weapons)
  weaponSlots: WeaponSlot[];
  // Phase 4: Energy (stamina) system
  energy: number;
  regenAnchorTs: number | null;
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
    blockCountLevel: 0,
  },
  chapter1Cleared: false,
  bestChapter1Time: 0,
  lastGameMode: 'CHAPTER',
  weaponSlots: [
    { weaponType: null, level: 0 },
    { weaponType: null, level: 0 },
  ],
  energy: GAME_CONFIG.ENERGY_MAX,
  regenAnchorTs: null,
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
      weaponSlots: parsed.weaponSlots ?? DEFAULT_PROGRESSION.weaponSlots,
      energy: parsed.energy ?? DEFAULT_PROGRESSION.energy,
      regenAnchorTs: parsed.regenAnchorTs ?? DEFAULT_PROGRESSION.regenAnchorTs,
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

// Phase 2B-2: Update chapter clear records
export const updateChapterClear = (
  timeSurvived: number,
  tipsEarned: number
): { beansEarned: number; isNewChapterRecord: boolean } => {
  const current = loadProgression();
  
  const isNewChapterRecord = !current.chapter1Cleared || timeSurvived < current.bestChapter1Time;
  const beansEarned = tipsEarned; // Base beans from tips (bonus added separately)
  
  const updated: ProgressionData = {
    ...current,
    version: SAVE_VERSION,
    chapter1Cleared: true,
    bestChapter1Time: current.bestChapter1Time > 0 
      ? Math.min(current.bestChapter1Time, timeSurvived) 
      : timeSurvived,
    totalBeans: current.totalBeans + beansEarned,
  };
  
  saveProgression(updated);
  
  return { beansEarned, isNewChapterRecord };
};

// Phase 2B-2: Save last game mode preference
export const setLastGameMode = (mode: GameMode): void => {
  const current = loadProgression();
  saveProgression({ ...current, lastGameMode: mode });
};

// Reset all progression to defaults (DEV tool)
export const resetProgression = (): void => {
  saveProgression({ ...DEFAULT_PROGRESSION });
};

// Phase 3: Select weapon for a cargo box slot
export const selectWeapon = (slotIndex: number, weaponType: WeaponType, cost: number): boolean => {
  const current = loadProgression();
  
  if (current.totalBeans < cost) return false;
  if (slotIndex < 0 || slotIndex >= current.weaponSlots.length) return false;
  if (current.weaponSlots[slotIndex].weaponType !== null) return false; // Already has weapon
  
  current.totalBeans -= cost;
  current.weaponSlots[slotIndex] = { weaponType, level: 1 };
  
  saveProgression(current);
  return true;
};

// Phase 3: Upgrade weapon in a slot
export const upgradeWeapon = (slotIndex: number, cost: number): boolean => {
  const current = loadProgression();
  
  if (current.totalBeans < cost) return false;
  if (slotIndex < 0 || slotIndex >= current.weaponSlots.length) return false;
  if (current.weaponSlots[slotIndex].weaponType === null) return false; // No weapon
  if (current.weaponSlots[slotIndex].level >= 5) return false; // Max level
  
  current.totalBeans -= cost;
  current.weaponSlots[slotIndex].level += 1;
  
  saveProgression(current);
  return true;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY (STAMINA) SYSTEM - Phase 4
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply pending energy regeneration based on elapsed time since anchor.
 * Should be called on app load, garage open, and before consuming energy.
 * Does NOT save automatically - returns the updated progression data.
 */
export const applyRegenNow = (): ProgressionData => {
  const prog = loadProgression();
  const now = Date.now();
  
  // If energy is full, clear anchor and return
  if (prog.energy >= GAME_CONFIG.ENERGY_MAX) {
    prog.energy = GAME_CONFIG.ENERGY_MAX;
    prog.regenAnchorTs = null;
    saveProgression(prog);
    return prog;
  }
  
  // If no anchor exists (safety), set it now
  if (prog.regenAnchorTs === null) {
    prog.regenAnchorTs = now;
    saveProgression(prog);
    return prog;
  }
  
  // Calculate how many full regen intervals have passed
  const elapsed = now - prog.regenAnchorTs;
  const gains = Math.floor(elapsed / GAME_CONFIG.ENERGY_REGEN_MS);
  
  if (gains > 0) {
    prog.energy = Math.min(GAME_CONFIG.ENERGY_MAX, prog.energy + gains);
    
    if (prog.energy >= GAME_CONFIG.ENERGY_MAX) {
      // Energy is full, clear anchor
      prog.energy = GAME_CONFIG.ENERGY_MAX;
      prog.regenAnchorTs = null;
    } else {
      // Advance anchor by gains (preserve remaining time)
      prog.regenAnchorTs = prog.regenAnchorTs + (gains * GAME_CONFIG.ENERGY_REGEN_MS);
    }
    
    saveProgression(prog);
  }
  
  return prog;
};

/**
 * Consume 1 energy for a play session.
 * Returns true if successful, false if no energy available.
 * Starts the regen timer if this is the first spend.
 */
export const consumeEnergy = (): { success: boolean; newEnergy: number } => {
  const prog = applyRegenNow(); // Always apply pending regen first
  
  if (prog.energy <= 0) {
    return { success: false, newEnergy: 0 };
  }
  
  prog.energy -= 1;
  
  // If energy just dropped below max and no anchor exists, start timer
  if (prog.energy < GAME_CONFIG.ENERGY_MAX && prog.regenAnchorTs === null) {
    prog.regenAnchorTs = Date.now();
  }
  
  saveProgression(prog);
  return { success: true, newEnergy: prog.energy };
};

/**
 * Get current energy state including countdown info.
 * Does NOT consume energy, just reads current state.
 */
export const getEnergyState = (): {
  energy: number;
  maxEnergy: number;
  isRegenerating: boolean;
  remainingMs: number; // Time until next +1 energy
} => {
  const prog = applyRegenNow();
  const now = Date.now();
  
  let remainingMs = 0;
  const isRegenerating = prog.energy < GAME_CONFIG.ENERGY_MAX && prog.regenAnchorTs !== null;
  
  if (isRegenerating && prog.regenAnchorTs !== null) {
    const elapsed = now - prog.regenAnchorTs;
    remainingMs = GAME_CONFIG.ENERGY_REGEN_MS - (elapsed % GAME_CONFIG.ENERGY_REGEN_MS);
  }
  
  return {
    energy: prog.energy,
    maxEnergy: GAME_CONFIG.ENERGY_MAX,
    isRegenerating,
    remainingMs,
  };
};

/**
 * Format milliseconds to MM:SS display string.
 */
export const formatTimeRemaining = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
