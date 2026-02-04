
# Ekonomi Delta Düzeltme + Tam Telemetri Planı

## Tespit Edilen Problemler

### Problem 1: Clear Bonus Save Edilmiyor (BUG!)
`handleChapterClear` içinde `CHAPTER_CLEAR_BONUS_BEANS` (10 beans) hesaplanıyor ama hiçbir yere kaydedilmiyor.

**Mevcut Kod (satır 471-507):**
```typescript
const handleChapterClear = useCallback(() => {
  const { beansEarned } = updateChapterClear(..., tipsRef.current);
  const clearBonus = GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS;
  const totalBeans = beansEarned + clearBonus;
  // ... telemetry hesaplama
  // ❌ clearBonus hiç save edilmiyor!
});
```

`updateChapterClear` fonksiyonu (persistence.ts satır 144-166) sadece `tipsEarned` ekliyor:
```typescript
totalBeans: current.totalBeans + beansEarned, // beansEarned = tipsEarned
```

**Sonuç:** Clear bonusu UI'da gösteriliyor ama gerçekte eklenmemiyor. Bu negatif delta'nın bir kaynağı.

### Problem 2: Breakdown tipsRef Yerine enemiesKilled Kullanıyor
Telemetri breakdown'ı şu formülü kullanıyor (satır 427-430):
```typescript
const normalTips = t.enemiesKilled.normal * GAME_CONFIG.TIP_VALUE;
const heavyTips = t.enemiesKilled.heavy * GAME_CONFIG.TIP_VALUE;
const bossTips = t.enemiesKilled.boss * GAME_CONFIG.BOSS_TIP_MULTIPLIER * GAME_CONFIG.TIP_VALUE;
```

Ama gerçekte save edilen değer `tipsRef.current` - bu farklı olabilir çünkü:
- Tip'ler float edip ekrandan çıkınca `tipsRef` artıyor
- Bazı tip'ler henüz toplanmamış olabilir
- `enemiesKilled` ve gerçek tip sayısı uyuşmayabilir

**Doğru Yaklaşım:** Breakdown'ı `tipsRef.current` (gerçek toplanan tip'ler) üzerinden hesapla.

### Problem 3: Boss Reward Breakdown'da Yanlış
Boss için `enemiesKilled.boss * BOSS_TIP_MULTIPLIER * TIP_VALUE` hesaplanıyor. Ama aslında boss öldüğünde `BOSS_TIP_MULTIPLIER` adet tip drop oluyor ve her biri `TIP_VALUE` değerinde. Yani:
- Boss'tan gelen beans = `BOSS_TIP_MULTIPLIER * TIP_VALUE` = 3 × 2 = 6
- Bu zaten `tipsRef.current` içinde!

Breakdown'da boss'u ayrı saymak çift sayıma yol açar.

---

## Çözüm Planı

### 1. Clear Bonus'u Gerçekten Save Et
`handleChapterClear` içinde clearBonus'u persistence'a ekle.

**Değişiklik (CoffeeRushGame.tsx satır 471-507):**
```typescript
const handleChapterClear = useCallback(() => {
  const { beansEarned } = updateChapterClear(
    timeRef.current,
    tipsRef.current
  );
  
  const clearBonus = GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS;
  
  // ✅ Clear bonus'u gerçekten save et
  const prog = loadProgression();
  saveProgression({
    ...prog,
    totalBeans: prog.totalBeans + clearBonus,
  });
  
  // Build telemetry...
});
```

### 2. Telemetriyi tipsRef Bazlı Yap
Breakdown'ı `enemiesKilled` yerine `tipsRef.current` üzerinden hesapla. Çünkü save edilen değer budur.

**Yeni Telemetri Hesabı:**
```typescript
// tipsRef.current = served düşmanlardan gelen tüm tip'ler
// Bu değer normal + heavy + boss tip'lerini içeriyor
const tipsFromServed = tipsRef.current;

// Boss reward zaten tipsFromServed içinde! Ayrıca sayma.
// Ama telemetride göstermek istiyorsak:
const bossRewardBeans = t.enemiesKilled.boss * GAME_CONFIG.BOSS_TIP_MULTIPLIER * GAME_CONFIG.TIP_VALUE;

// Breakdown = tips (boss dahil) + clear bonus
const beansTotalBreakdown = tipsFromServed + clearBonus;
```

### 3. types.ts Güncelleme
`RunTelemetry` interface'inde açıklama ekle:

```typescript
// Economy telemetry (Phase 2E: Anti-bug delta control)
beansStart: number;          // totalBeans at run start
beansEnd: number;            // totalBeans after save
beansEarnedActual: number;   // beansEnd - beansStart
tipsFromServed: number;      // tipsRef.current (includes normal + heavy + boss tips)
bossRewardBeans: number;     // Display only: BOSS_TIP_MULTIPLIER × TIP_VALUE (already in tipsFromServed)
clearBonusBeans: number;     // CHAPTER_CLEAR_BONUS_BEANS (0 if failed)
beansTotalBreakdown: number; // tipsFromServed + clearBonusBeans
economyDelta: number;        // actual - breakdown (should be 0)
```

### 4. buildTelemetry Düzeltmesi

```typescript
const buildTelemetry = useCallback((): RunTelemetry => {
  // ... mevcut kod ...
  
  // Phase 2E: Economy telemetry - tipsRef.current bazlı
  const tipsFromServed = tipsRef.current; // Gerçek toplanan tip'ler
  
  // Boss reward sadece display için (zaten tipsFromServed içinde)
  const bossRewardDisplay = t.enemiesKilled.boss * GAME_CONFIG.BOSS_TIP_MULTIPLIER * GAME_CONFIG.TIP_VALUE;
  
  return {
    // ... diğer alanlar ...
    tipsFromServed,
    bossRewardBeans: bossRewardDisplay, // Display only
    clearBonusBeans: 0, // handleChapterClear'da set edilecek
    beansTotalBreakdown: tipsFromServed, // clearBonus sonra eklenecek
    economyDelta: 0, // Save sonrası hesaplanacak
  };
}, [gameMode]);
```

### 5. handleChapterClear Tam Düzeltme

```typescript
const handleChapterClear = useCallback(() => {
  // 1. Tips'i save et
  const { beansEarned } = updateChapterClear(
    timeRef.current,
    tipsRef.current
  );
  
  // 2. Clear bonus'u save et
  const clearBonus = GAME_CONFIG.CHAPTER_CLEAR_BONUS_BEANS;
  const progAfterTips = loadProgression();
  saveProgression({
    ...progAfterTips,
    totalBeans: progAfterTips.totalBeans + clearBonus,
  });
  
  // 3. Telemetri oluştur
  const telemetry = buildTelemetry();
  telemetry.bossOutcome = 'defeated';
  telemetry.bossHpPercent = 0;
  telemetry.clearBonusBeans = clearBonus;
  telemetry.beansTotalBreakdown = telemetry.tipsFromServed + clearBonus;
  
  // 4. Save sonrası actual değeri al
  const finalProg = loadProgression();
  telemetry.beansEnd = finalProg.totalBeans;
  telemetry.beansEarnedActual = finalProg.totalBeans - telemetry.beansStart;
  telemetry.economyDelta = telemetry.beansEarnedActual - telemetry.beansTotalBreakdown;
  
  // 5. Stats'ı set et
  const totalBeans = beansEarned + clearBonus;
  setStats({
    timeSurvived: timeRef.current,
    customersServed: customersServedRef.current,
    totalTips: tipsRef.current,
    beansEarned: totalBeans,
    isNewRecord: false,
    isChapterClear: true,
    checkpointsCleared: GAME_CONFIG.CHAPTER1_BOSS_CHECKPOINT,
    telemetry,
  });
  setGameState('END');
}, [buildTelemetry]);
```

### 6. RunSummary UI Güncelleme
Economy bölümünde boss reward'ın "display only" olduğunu belirt:

```
Economy bölümü:
├── Tips: 62 beans (31 served)
├── Boss: 6 beans (included above)  ← Açıklama ekle
├── Clear Bonus: +10 beans
├── ────────────
├── Breakdown: 72 beans
├── Actual: 72 beans
├── Delta: 0 ✓
```

---

## Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|-----------|
| `src/game/CoffeeRushGame.tsx` | buildTelemetry: tipsRef bazlı hesap; handleChapterClear: clearBonus save |
| `src/game/types.ts` | RunTelemetry yorumları güncelle |
| `src/game/RunSummary.tsx` | Economy bölümünde boss "included in tips" notu |

---

## Beklenen Sonuç

Bu değişikliklerden sonra:
1. **Delta her zaman 0 olmalı** (veya çok küçük edge case'lerde ±1-2)
2. **Clear bonus gerçekten ekleniyor** (şu an 10 beans kayıp!)
3. **Breakdown doğru hesaplanıyor** (çift sayım yok)

Test senaryoları:
- Normal fail run: Delta = 0
- Chapter clear: Delta = 0
- Leave (pause menüden çıkış): Delta = 0

---

## Teknik Özet

**Root Cause:** 
1. `clearBonus` hesaplanıyor ama save edilmiyor
2. Telemetri `enemiesKilled` kullanıyor, `tipsRef` değil
3. Boss tip'ler hem ayrı sayılıyor hem `tipsFromServed`'de

**Fix:**
1. `handleChapterClear`'da clearBonus'u ayrıca save et
2. `buildTelemetry`'de `tipsRef.current` kullan
3. Boss reward'ı "display only" olarak işaretle (zaten tips içinde)
