

# Ekonomi Dengeleme - Option A (Dengeli)

## Problem Özeti

Şu anda 2-3 Chapter 1 clear ile tüm upgrade'leri alabiliyor oyuncu:
- Run başına kazanç: ~100-150 beans (clear için)
- Toplam upgrade maliyeti: ~430 beans
- Sonuç: 3 run'da full build → Oyun çok hızlı bitiyor

## Hedef Pacing

| Milestone | Hedef Run Sayısı |
|-----------|------------------|
| İlk upgrade | 1-2 run |
| Chapter 1 Boss clear | 5-8 run |
| Stabil clear | 12-20 run |
| Full upgrade | 25-40 run |

---

## Değişiklikler

### 1. Kazanç Azaltma

| Değer | Eski | Yeni | Değişim |
|-------|------|------|---------|
| `TIP_VALUE` | 5 | 3 | -40% |
| Boss tip multiplier | 5x | 3x | -40% |
| `CHAPTER_CLEAR_BONUS_BEANS` | 50 | 20 | -60% |

**Yeni Run Başına Kazanç Tahmini:**
- Fail run (20s): ~15-25 beans (önceden 25-40)
- Clear run: ~60-80 beans (önceden 100-150)

### 2. Maliyet Artırma

| Upgrade | Eski Base | Yeni Base | Değişim |
|---------|-----------|-----------|---------|
| Tower HP | 35 | 60 | +71% |
| Espresso Damage | 35 | 60 | +71% |
| Power Regen | 25 | 45 | +80% |
| Add Cargo Box | 30 | 55 | +83% |

### 3. Cost Scaling Artırma

| Değer | Eski | Yeni |
|-------|------|------|
| Cost multiplier | 1.25 | 1.45 |

**Yeni Upgrade Maliyetleri (Level bazlı):**

| Upgrade | L1 | L2 | L3 | Toplam |
|---------|-----|-----|-----|--------|
| Tower HP | 60 | 87 | 126 | 273 |
| Espresso | 60 | 87 | 126 | 273 |
| Power | 45 | 65 | 95 | 205 |
| Cargo L1 | 55 | 80 | - | 135 |
| **TOPLAM** | | | | **~886 beans** |

---

## Teknik Değişiklikler

### Dosya: `src/game/config.ts`

```
TIP_VALUE: 5 → 3
CHAPTER_CLEAR_BONUS_BEANS: 50 → 20
TOWER_HP_BASE_COST: 35 → 60
ESPRESSO_BASE_COST: 35 → 60
POWER_BASE_COST: 25 → 45
BLOCK_COUNT_BASE_COST: 30 → 55

(YENİ) BOSS_TIP_MULTIPLIER: 3  // Boss'un tip çarpanı
(YENİ) UPGRADE_COST_SCALING: 1.45  // Cost scaling multiplier
```

### Dosya: `src/game/persistence.ts`

```typescript
// Line 135: Hardcoded 1.25 → config'den al
export const getUpgradeCost = (level: number, baseCost: number): number => {
  return Math.floor(baseCost * Math.pow(GAME_CONFIG.UPGRADE_COST_SCALING, level));
};
```

### Dosya: `src/game/CoffeeRushGame.tsx`

```typescript
// Line 1018: Hardcoded 5 → config'den al
const tipCount = enemy.kind === 'BOSS' ? GAME_CONFIG.BOSS_TIP_MULTIPLIER : 1;
```

---

## Beklenen Sonuçlar

| Metrik | Eski | Yeni |
|--------|------|------|
| Clear başına beans | ~120 | ~70 |
| Fail run beans | ~35 | ~20 |
| Toplam upgrade maliyeti | ~430 | ~886 |
| Full upgrade için run sayısı | 3-4 | ~15-20 |
| İlk upgrade için run sayısı | 1 | 1-2 |

---

## Implementasyon Sırası

1. `config.ts` - Tüm ekonomi sabitlerini güncelle + 2 yeni sabit ekle
2. `persistence.ts` - Cost scaling'i config'den oku
3. `CoffeeRushGame.tsx` - Boss tip multiplier'ı config'den oku

