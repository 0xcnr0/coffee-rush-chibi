// Persistence helper for Coffee Rush progression data
// TDS-Inspired Reboot: Phase 1 v1.1 — Schema v10 (Chapter-bound pips + EVO)

import type { GameMode, WeaponType, WeaponSlot } from './types';
import { GAME_CONFIG } from './config';

const STORAGE_KEY = 'coffee-rush-progress';
const SAVE_VERSION = 10; // Reboot: Pip/EVO system, clean reset from v9

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESSION DATA SCHEMA (v10)
// ═══════════════════════════════════════════════════════════════════════════════
export interface ProgressionData {
  version: number;
  totalCoins: number;
  blockPips: number[];
  blockEvoChoices: string[][];
  weaponSlots: WeaponSlot[];
  weaponPips: number[];
  weaponEvoChoices: string[][];
  powerPips: number;
  powerEvoChoices: string[];
  damagePips: number;
  damageEvoChoices: string[];
  blockCountLevel: number;
  bestTimeSurvivedSeconds: number;
  bestCustomersServed: number;
  chapter1Cleared: boolean;
  bestChapter1Time: number;
  bestStageReached: number;
  lastGameMode: GameMode;
  energy: number;
  regenAnchorTs: number | null;
  chapterResetEnabled: boolean;
  meta: {
    diamonds: number;
    backpackGold: number;
    heroCards: string[];
  };
  // Deprecated fields needed for backward compat if any old code references them
  upgradeLevels: {
    blockCountLevel: number;
    espressoDamageLevel: number;
    energyRegenLevel: number;
  };
  cargoBoxHpLevels: number[];
}

const DEFAULT_PROGRESSION: ProgressionData = {
  version: SAVE_VERSION,
  totalCoins: 0,
  blockPips: [0, 0, 0],
  blockEvoChoices: [[], [], []],
  weaponSlots: [{ weaponType: null, level: 0 }, { weaponType: null, level: 0 }],
  weaponPips: [0, 0],
  weaponEvoChoices: [[], []],
  powerPips: 0,
  powerEvoChoices: [],
  damagePips: 0,
  damageEvoChoices: [],
  blockCountLevel: 0,
  bestTimeSurvivedSeconds: 0,
  bestCustomersServed: 0,
  chapter1Cleared: false,
  bestChapter1Time: 0,
  bestStageReached: 0,
  lastGameMode: 'CHAPTER',
  energy: GAME_CONFIG.ENERGY_MAX,
  regenAnchorTs: null,
  chapterResetEnabled: false,
  meta: { diamonds: 0, backpackGold: 0, heroCards: [] },
  upgradeLevels: { blockCountLevel: 0, espressoDamageLevel: 0, energyRegenLevel: 0 },
  cargoBoxHpLevels: [0, 0, 0],
};

export const loadProgression = (): ProgressionData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PROGRESSION };
    const parsed = JSON.parse(stored);
    if (!parsed.version || parsed.version !== SAVE_VERSION) {
      console.info(`Save version mismatch (${parsed.version} !== ${SAVE_VERSION}), resetting progression for TDS reboot`);
      saveProgression({ ...DEFAULT_PROGRESSION });
      return { ...DEFAULT_PROGRESSION };
    }
    return {
      ...DEFAULT_PROGRESSION,
      ...parsed,
      meta: { ...DEFAULT_PROGRESSION.meta, ...parsed.meta },
    };
  } catch {
    console.warn('Failed to load progression, using defaults');
    return { ...DEFAULT_PROGRESSION };
  }
};

export const saveProgression = (data: ProgressionData): void => {
  try {
    // Sync legacy fields for safety
    data.upgradeLevels = {
      blockCountLevel: data.blockCountLevel,
      espressoDamageLevel: data.damagePips,
      energyRegenLevel: data.powerPips,
    };
    data.cargoBoxHpLevels = data.blockPips; // approx mapping
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save progression');
  }
};

export const getPipCost = (currentPips: number, baseCost: number, costScaling: number): number => {
  return Math.floor(baseCost * Math.pow(costScaling, currentPips));
};

export const purchasePowerPip = (cost: number): boolean => {
  const current = loadProgression();
  if (current.totalCoins < cost) return false;
  current.totalCoins -= cost;
  current.powerPips += 1;
  saveProgression(current);
  return true;
};

export const purchaseDamagePip = (cost: number): boolean => {
  const current = loadProgression();
  if (current.totalCoins < cost) return false;
  current.totalCoins -= cost;
  current.damagePips += 1;
  saveProgression(current);
  return true;
};

export const purchaseBlockPip = (slotIndex: number, cost: number): boolean => {
  const current = loadProgression();
  if (current.totalCoins < cost) return false;
  if (slotIndex < 0 || slotIndex >= current.blockPips.length) return false;
  current.totalCoins -= cost;
  current.blockPips[slotIndex] += 1;
  saveProgression(current);
  return true;
};

export const purchaseWeaponPip = (slotIndex: number, cost: number): boolean => {
  const current = loadProgression();
  if (current.totalCoins < cost) return false;
  if (slotIndex < 0 || slotIndex >= current.weaponPips.length) return false;
  current.totalCoins -= cost;
  current.weaponPips[slotIndex] += 1;
  saveProgression(current);
  return true;
};

export const saveEvoChoice = (category: string, slotIndex: number, traitId: string): void => {
  const current = loadProgression();
  if (category === 'block') {
    if (!current.blockEvoChoices[slotIndex]) current.blockEvoChoices[slotIndex] = [];
    current.blockEvoChoices[slotIndex].push(traitId);
  } else if (category === 'weapon') {
    if (!current.weaponEvoChoices[slotIndex]) current.weaponEvoChoices[slotIndex] = [];
    current.weaponEvoChoices[slotIndex].push(traitId);
  } else if (category === 'power') {
    current.powerEvoChoices.push(traitId);
  } else if (category === 'damage') {
    current.damageEvoChoices.push(traitId);
  }
  saveProgression(current);
};

export const purchaseCargoBox = (cost: number): boolean => {
  const current = loadProgression();
  if (current.totalCoins < cost) return false;
  if (current.blockCountLevel >= GAME_CONFIG.BLOCK_COUNT_MAX_LEVEL) return false;
  current.totalCoins -= cost;
  current.blockCountLevel += 1;
  saveProgression(current);
  return true;
};

export const getCargoBoxCost = (level: number): number => {
  return Math.floor(GAME_CONFIG.BLOCK_COUNT_BASE_COST * Math.pow(1.5, level));
};

export const setLastGameMode = (mode: GameMode): void => {
  const current = loadProgression();
  saveProgression({ ...current, lastGameMode: mode });
};

export const updateRecords = (
  timeSurvived: number,
  customersServed: number,
  stageReached: number,
  coinsEarned: number,
): { isNewTimeRecord: boolean } => {
  const current = loadProgression();
  const isNewTimeRecord = timeSurvived > current.bestTimeSurvivedSeconds;
  saveProgression({
    ...current,
    bestTimeSurvivedSeconds: Math.max(current.bestTimeSurvivedSeconds, timeSurvived),
    bestCustomersServed: Math.max(current.bestCustomersServed, customersServed),
    bestStageReached: Math.max(current.bestStageReached, stageReached),
    totalCoins: current.totalCoins + coinsEarned,
  });
  return { isNewTimeRecord };
};

export const updateChapterClear = (timeSurvived: number, coinsEarned: number): { isNewChapterRecord: boolean } => {
  const current = loadProgression();
  const isNewChapterRecord = !current.chapter1Cleared || timeSurvived < current.bestChapter1Time;
  saveProgression({
    ...current,
    chapter1Cleared: true,
    bestChapter1Time: current.bestChapter1Time > 0 ? Math.min(current.bestChapter1Time, timeSurvived) : timeSurvived,
    totalCoins: current.totalCoins + coinsEarned,
  });
  return { isNewChapterRecord };
};

export const resetProgression = (): void => {
  saveProgression({ ...DEFAULT_PROGRESSION });
};

export const applyRegenNow = (): ProgressionData => {
  const prog = loadProgression();
  const now = Date.now();
  if (prog.energy >= GAME_CONFIG.ENERGY_MAX) {
    prog.energy = GAME_CONFIG.ENERGY_MAX;
    prog.regenAnchorTs = null;
    saveProgression(prog);
    return prog;
  }
  if (prog.regenAnchorTs === null) {
    prog.regenAnchorTs = now;
    saveProgression(prog);
    return prog;
  }
  const elapsed = now - prog.regenAnchorTs;
  const gains = Math.floor(elapsed / GAME_CONFIG.ENERGY_REGEN_MS);
  if (gains > 0) {
    prog.energy = Math.min(GAME_CONFIG.ENERGY_MAX, prog.energy + gains);
    if (prog.energy >= GAME_CONFIG.ENERGY_MAX) {
      prog.energy = GAME_CONFIG.ENERGY_MAX;
      prog.regenAnchorTs = null;
    } else {
      prog.regenAnchorTs = prog.regenAnchorTs + (gains * GAME_CONFIG.ENERGY_REGEN_MS);
    }
    saveProgression(prog);
  }
  return prog;
};

export const consumeEnergy = (): { success: boolean; newEnergy: number } => {
  const prog = applyRegenNow();
  if (prog.energy <= 0) return { success: false, newEnergy: 0 };
  prog.energy -= 1;
  if (prog.energy < GAME_CONFIG.ENERGY_MAX && prog.regenAnchorTs === null) {
    prog.regenAnchorTs = Date.now();
  }
  saveProgression(prog);
  return { success: true, newEnergy: prog.energy };
};

export const getEnergyState = (): { energy: number; maxEnergy: number; isRegenerating: boolean; remainingMs: number } => {
  const prog = applyRegenNow();
  const now = Date.now();
  let remainingMs = 0;
  const isRegenerating = prog.energy < GAME_CONFIG.ENERGY_MAX && prog.regenAnchorTs !== null;
  if (isRegenerating && prog.regenAnchorTs !== null) {
    const elapsed = now - prog.regenAnchorTs;
    remainingMs = GAME_CONFIG.ENERGY_REGEN_MS - (elapsed % GAME_CONFIG.ENERGY_REGEN_MS);
  }
  return { energy: prog.energy, maxEnergy: GAME_CONFIG.ENERGY_MAX, isRegenerating, remainingMs };
};

export const formatTimeRemaining = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const addDebugEnergy = (amount: number = 10): number => {
  const prog = loadProgression();
  prog.energy += amount;
  saveProgression(prog);
  return prog.energy;
};

export const addDebugCoins = (amount: number = 200): number => {
  const prog = loadProgression();
  prog.totalCoins += amount;
  saveProgression(prog);
  return prog.totalCoins;
};
