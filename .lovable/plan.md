
# Sprint 0: Beans to Coins Full Rename + Polish

## Ozet

Bu sprint, tum projedeki "beans" terminolojisini "coins" olarak degistirecek ve localStorage backward compatibility saglayacak. Ayrica config yorumlarindaki "beans" referanslarini guncelleyecek.

## Etkilenen Dosyalar (9 dosya)

| Dosya | Degisiklik Tipi |
|-------|-----------------|
| `src/game/persistence.ts` | Interface, variable names, migration function |
| `src/game/types.ts` | Interface field names |
| `src/game/config.ts` | Constant name + comment strings |
| `src/game/CoffeeRushGame.tsx` | Variable refs, telemetry fields |
| `src/game/EndScreen.tsx` | UI labels |
| `src/game/RunSummary.tsx` | UI labels, telemetry fields |
| `src/game/GarageOverlay.tsx` | Variable name (beans -> coins) |
| `src/game/DebugHUD.tsx` | Debug tool labels |
| `src/game/ShopScreen.tsx` | UI labels (totalBeans -> totalCoins) |

## Detayli Degisiklikler

### 1. persistence.ts (Ana dosya)

**Interface degisiklikleri:**
```text
totalBeans → totalCoins
```

**Fonksiyon return type degisiklikleri:**
```text
beansEarned → coinsEarned (updateBestRecords, updateChapterClear)
```

**Migration fonksiyonu ekleme:**
```typescript
// loadProgression icinde eski save'leri migrate et:
// Eger parsed.totalBeans varsa ve parsed.totalCoins yoksa:
// parsed.totalCoins = parsed.totalBeans
// delete parsed.totalBeans
```

**Tum fonksiyonlardaki variable name degisiklikleri:**
- `current.totalBeans` → `current.totalCoins`
- `beansEarned` → `coinsEarned`

### 2. types.ts

**GameStats interface:**
```text
beansEarned: number → coinsEarned: number
```

**RunTelemetry interface:**
```text
beansStart → coinsStart
beansEnd → coinsEnd
beansEarnedActual → coinsEarnedActual
bossRewardBeans → bossRewardCoins
clearBonusBeans → clearBonusCoins
normalKillBeans → normalKillCoins
heavyKillBeans → heavyKillCoins
bossKillBeans → bossKillCoins
beansTotalBreakdown → coinsTotalBreakdown
```

### 3. config.ts

**Constant rename:**
```text
CHAPTER_CLEAR_BONUS_BEANS → CHAPTER_CLEAR_BONUS_COINS
```

**Comment string degisiklikleri (8 satir):**
- "beans per tip" → "coins per tip"
- "50-80 beans" → "50-80 coins"
- vb.

### 4. CoffeeRushGame.tsx

Bu dosyada telemetry objesi olusturuluyor. Tum field isimleri guncellenecek:
- `beansStart` → `coinsStart`
- `beansEnd` → `coinsEnd`
- `beansEarnedActual` → `coinsEarnedActual`
- `beansTotalBreakdown` → `coinsTotalBreakdown`
- `bossRewardBeans` → `bossRewardCoins`
- `clearBonusBeans` → `clearBonusCoins`
- `normalKillBeans` → `normalKillCoins`
- `heavyKillBeans` → `heavyKillCoins`
- `bossKillBeans` → `bossKillCoins`
- `beansEarned` → `coinsEarned` (stats objesi)

### 5. EndScreen.tsx

**UI label degisiklikleri:**
- `+{stats.beansEarned}` → `+{stats.coinsEarned}`
- "Beans" label → "Coins"
- Bean emoji yerine coin emoji (zaten 🫘 var, 🪙 yapilabilir)

### 6. RunSummary.tsx

**Telemetry field degisiklikleri:**
- `telemetry.beansStart` → `telemetry.coinsStart`
- `telemetry.beansEnd` → `telemetry.coinsEnd`
- vb.

**UI string degisiklikleri:**
- "beans" → "coins" (tum label'lar)
- Compact summary string'de `Beans:` → `Coins:`

### 7. GarageOverlay.tsx

**Variable name:**
- `beans` parameter name'leri `coins` olabilir ama component prop olarak gecirildigi icin internal variable ismi degistirmek opsiyonel. Progression'dan gelen `totalBeans` → `totalCoins` olacak.

### 8. DebugHUD.tsx

**Dev tool degisiklikleri:**
- `handleAddBeans` → `handleAddCoins`
- `prog.totalBeans` → `prog.totalCoins`
- Alert message: "beans" → "coins"

### 9. ShopScreen.tsx

**Props interface:**
- `totalBeans` → `totalCoins`

## Migration Stratejisi

```typescript
// persistence.ts icinde loadProgression fonksiyonuna eklenecek:
export const loadProgression = (): ProgressionData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PROGRESSION };
    
    const parsed = JSON.parse(stored);
    
    // MIGRATION: beans → coins (backward compatibility)
    if (parsed.totalBeans !== undefined && parsed.totalCoins === undefined) {
      parsed.totalCoins = parsed.totalBeans;
      delete parsed.totalBeans;
    }
    
    // Version check...
    // ...rest of function
  }
}
```

Bu migration sayesinde:
- Eski save'ler otomatik olarak coins'e donusur
- Yeni save'ler direkt coins kullanir
- Version bump gerekmez (soft migration)

## Degistirilmeyecek Seyler

- Travel badge zaten onceki sprint'te kaldirildi
- Gate3 → PICK → BOSS flow zaten implement edilmis (currentGateIndex >= 3 kontrolu mevcut)
- Storage key (`coffee-rush-progress`) degismeyecek
- Save version (8) degismeyecek (soft migration)

## Icon Tercihi

| Eski | Yeni |
|------|------|
| 🫘 (bean) | 🪙 (coin) |

Tum UI'da bean emoji yerine coin emoji kullanilacak.

## Acceptance Criteria

1. Oyun icinde hicbir yerde "bean/beans" kelimesi gormeyeceksin (hem UI hem code yorumlari)
2. Eski progression sifirlanmayacak - eski beans bakiyesi coins olarak tasiyacak
3. Telemetry compact string'de "Coins:" yazacak
4. EndScreen'de "+X Coins" yazacak
5. Emoji 🫘 yerine 🪙 kullanilacak
6. Gate3 → PICK → BOSS flow zaten calisiyor (dokunulmayacak)
7. Travel badge zaten kaldirildi (dokunulmayacak)

## Dosya Bazli Degisiklik Sayisi

| Dosya | Tahmini Satir Degisikligi |
|-------|---------------------------|
| persistence.ts | ~25 satir |
| types.ts | ~15 satir |
| config.ts | ~12 satir |
| CoffeeRushGame.tsx | ~20 satir |
| EndScreen.tsx | ~5 satir |
| RunSummary.tsx | ~25 satir |
| GarageOverlay.tsx | ~3 satir |
| DebugHUD.tsx | ~5 satir |
| ShopScreen.tsx | ~2 satir |
| **Toplam** | **~112 satir** |

## Test Sonrasi Beklenen Telemetry Format

```text
[CHAPTER] 1:23 CP4 | Gates:3/3@BOSS | Boss:defeated | Coins:180(B:180/D:0) | ...
```

(Beans yerine Coins yazacak)
