

# Ekonomi Telemetri + Dengeli Rebalance (Balanced-B) - Güncellenmiş Plan

## Genel Bakis

Bu plan ChatGPT'nin 2 kritik önerisini de içeriyor:
1. **Telemetri** - beansStart/beansEnd delta kontrolü ile double-award bug yakalama
2. **Boss reward standardizasyonu** - formülün net olması
3. **Balanced-B Rebalance** - ~25 run hedefli dengeli ekonomi

---

## Aşama 1: Ekonomi Telemetrisi (Anti-Bug)

### ChatGPT Önerisi 1: beansStart/beansEnd Delta Kontrolü

Mevcut RunSummary sadece "served x tip + bonus" hesaplıyor ama bu double-award bug'ları yakalamaz.

**Yeni Yaklaşım:**
1. Run başlangıcında `beansStart = totalBeans` kaydet (ref olarak)
2. Run sonunda `beansEnd = totalBeans` al (save sonrası)
3. `beansEarnedActual = beansEnd - beansStart`
4. Breakdown hesapla: `beansTotalBreakdown = tipsFromServed + bossRewardBeans + clearBonusBeans`
5. `delta = beansEarnedActual - beansTotalBreakdown`
6. Eğer `delta !== 0` ise uyarı göster: "⚠️ Economy mismatch (delta = X)"

**Yeni Telemetri Alanları (types.ts):**
```
beansStart: number          // run başında totalBeans
beansEnd: number            // run sonunda totalBeans  
beansEarnedActual: number   // beansEnd - beansStart
tipsFromServed: number      // served count × TIP_VALUE
bossRewardBeans: number     // BOSS_TIP_MULTIPLIER × TIP_VALUE
clearBonusBeans: number     // CHAPTER_CLEAR_BONUS_BEANS (0 if failed)
beansTotalBreakdown: number // tipsFromServed + bossRewardBeans + clearBonusBeans
economyDelta: number        // actual - breakdown (should be 0)
```

### ChatGPT Önerisi 2: Boss Reward Standardizasyonu

Mevcut sistemde boss için tip drop mantığı:
```typescript
// Line 1018: Boss drops multiple tips
const tipCount = enemy.kind === 'BOSS' ? GAME_CONFIG.BOSS_TIP_MULTIPLIER : 1;
for (let i = 0; i < tipCount; i++) {
  spawnTip(enemy.x + (i - 2) * 15, enemy.y - enemy.height);
}
```

Bu şu anlama geliyor:
- Boss defeat = BOSS_TIP_MULTIPLIER (3) adet tip drop
- Her tip = TIP_VALUE (3) beans
- **Boss Reward = 3 × 3 = 9 beans**

Formül net, ama telemetri bunu göstermeli:
```
Boss Reward: 9 beans (3 tips × 3 beans/tip)
```

### Config Debug Gösterimi

RunSummary'da küçük debug satırı:
```
TIP=3 | BOSS=3x | BONUS=20 | SCALE=1.45
```

---

## Aşama 2: CoffeeRushGame.tsx Değişiklikleri

### beansStart Ref Ekleme

```typescript
const beansStartRef = useRef(0);

// startGame içinde (run başlarken):
beansStartRef.current = loadProgression().totalBeans;
```

### buildTelemetry Güncelleme

```typescript
const buildTelemetry = useCallback((): RunTelemetry => {
  const prog = loadProgression();
  const beansEnd = prog.totalBeans;
  const beansStart = beansStartRef.current;
  const beansEarnedActual = beansEnd - beansStart;
  
  // Breakdown hesabı
  const normalTips = telemetryRef.current.enemiesKilled.normal * GAME_CONFIG.TIP_VALUE;
  const heavyTips = telemetryRef.current.enemiesKilled.heavy * GAME_CONFIG.TIP_VALUE;
  const bossTips = telemetryRef.current.enemiesKilled.boss * GAME_CONFIG.BOSS_TIP_MULTIPLIER * GAME_CONFIG.TIP_VALUE;
  const tipsFromServed = normalTips + heavyTips + bossTips;
  
  return {
    // ... mevcut alanlar
    beansStart,
    beansEnd,
    beansEarnedActual,
    tipsFromServed,
    bossRewardBeans: bossTips,
    clearBonusBeans: 0, // handleChapterClear'da set edilecek
    beansTotalBreakdown: tipsFromServed,
    economyDelta: 0, // hesaplanacak
  };
}, []);
```

### handleChapterClear Güncelleme

```typescript
const handleChapterClear = useCallback(() => {
  const { beansEarned } = updateChapterClear(
    timeRef.current,
    tipsRef.current
  );
  
  // Add chapter clear bonus
  const clearBonus = GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS;
  const totalBeans = beansEarned + clearBonus;
  
  // Build telemetry with boss defeated
  const telemetry = buildTelemetry();
  telemetry.bossOutcome = 'defeated';
  telemetry.bossHpPercent = 0;
  telemetry.clearBonusBeans = clearBonus;
  telemetry.beansTotalBreakdown = telemetry.tipsFromServed + clearBonus;
  
  // Reload to get actual beansEnd after save
  const beansEnd = loadProgression().totalBeans + clearBonus;
  telemetry.beansEnd = beansEnd;
  telemetry.beansEarnedActual = beansEnd - telemetry.beansStart;
  telemetry.economyDelta = telemetry.beansEarnedActual - telemetry.beansTotalBreakdown;
  
  // ... rest of function
}, [buildTelemetry]);
```

---

## Aşama 3: RunSummary.tsx Güncelleme

### Yeni Economy Bölümü

```
Economy bölümü:
├── Served: 25
├── Tips: 75 beans (25 × 3)
├── Boss Reward: 9 beans (3 tips × 3)
├── Clear Bonus: 20 beans
├── ────────────
├── Breakdown: 104 beans
├── Actual: 104 beans
├── Delta: 0 ✓  (veya "⚠️ +X" eğer mismatch)
```

### Config Debug Satırı

```
[TIP=3 | BOSS=3x | BONUS=20 | SCALE=1.45]
```
(Küçük, silik renkte, en altta)

### Compact Format Güncelleme

```
... | Beans:104(B:104/A:104/D:0) | ...
```

---

## Aşama 4: Balanced-B Ekonomi Rebalance

### Mevcut vs Yeni Değerler

| Parametre | Mevcut | Balanced-B |
|-----------|--------|------------|
| TIP_VALUE | 3 | 2 |
| BOSS_TIP_MULTIPLIER | 3 | 3 (aynı) |
| CHAPTER_CLEAR_BONUS_BEANS | 20 | 10 |
| TOWER_HP_BASE_COST | 60 | 100 |
| ESPRESSO_BASE_COST | 60 | 100 |
| POWER_BASE_COST | 45 | 80 |
| BLOCK_COUNT_BASE_COST | 55 | 100 |
| UPGRADE_COST_SCALING | 1.45 | 1.55 |

### Yeni Upgrade Maliyetleri

| Upgrade | L1 | L2 | L3 | Toplam |
|---------|-----|-----|-----|--------|
| Tower HP | 100 | 155 | 240 | 495 |
| Espresso | 100 | 155 | 240 | 495 |
| Power | 80 | 124 | 192 | 396 |
| Cargo | 100 | 155 | - | 255 |
| **TOPLAM** | | | | **~1641** |

### Yeni Kazanç Hesabı

- Served × TIP_VALUE: 25 × 2 = 50 beans
- Boss Reward: 3 × 2 = 6 beans
- Clear Bonus: 10 beans
- **Chapter Clear Total: ~66 beans**

### Beklenen Pacing

| Milestone | Run Sayısı |
|-----------|------------|
| İlk upgrade (L1 Power: 80) | 2-3 run |
| Chapter 1 Boss clear | 6-10 run |
| Full upgrade (~1641) | 25-30 run |

---

## Teknik Özet

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|-----------|
| `src/game/types.ts` | RunTelemetry'ye 8 yeni alan ekle |
| `src/game/config.ts` | Balanced-B değerlerini uygula |
| `src/game/CoffeeRushGame.tsx` | beansStartRef, buildTelemetry, handleChapterClear güncellemesi |
| `src/game/RunSummary.tsx` | Economy bölümü, config debug satırı, compact format |

### Implementasyon Sırası

1. `types.ts` - Yeni telemetri alanları
2. `config.ts` - Balanced-B ekonomi değerleri
3. `CoffeeRushGame.tsx` - beansStart tracking + telemetri hesaplama
4. `RunSummary.tsx` - Economy UI + debug satırı

---

## Test Senaryoları

1. **Telemetri doğrulama**: Run sonunda "Breakdown" ve "Actual" aynı mı?
2. **Delta kontrolü**: delta = 0 gösteriyor mu? (mismatch yoksa)
3. **Config debug**: TIP=2, BONUS=10, SCALE=1.55 doğru mu?
4. **İlk upgrade**: 2-3 run sonra L1 Power (80 beans) alınabiliyor mu?
5. **Double-award test**: Aynı run'da Leave + GameOver durumunda delta uyarısı var mı?

