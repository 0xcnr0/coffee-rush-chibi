

# Phase 2C.6: Chapter 1 + Home/Garage "TDS UI Feel"

Bu plan, Chapter 2'ye gecmeden once Chapter 1 ve Garage deneyimini Tower Defense Simulator (TDS) hissiyatina yaklastirmayi amacliyor.

---

## Overview

4 ana kategori altinda degisiklikler yapilacak:

1. **Core Rules (A)**: Heavy disable, LIFO block damage, Boss 1v1 garantisi, Power/Charge sistemi
2. **Flow (B)**: Same-scene transition, Pause menu, Leave reward kurallari
3. **Garage UI (C)**: Compact upgrade tiles, Footer tabs (locked), Chapter map/modal
4. **Optional (D)**: Ticket sistemi placeholder (ileride aktif edilecek)

---

## A) Core Rules - Mekanik Degisiklikleri

### A1. Heavy Enemies Chapter 1'de %100 Kapali

**Mevcut Durum**: Kod zaten `heavyDisabledInChapter` kontrol ediyor (satir 467-468) - calisiyor.

**Yapilacak**: Kod incelemeleri sonucu bu zaten implement edilmis. Sadece dogrulama gerekiyor.

---

### A2. LIFO Block Damage (Son Eklenen Ilk Kirilir)

**Mevcut Durum**: Kod zaten `activeBlocks[activeBlocks.length - 1]` kullaniyor (satir 983).

**Yapilacak**: Bu da zaten implement edilmis. Tick damage top block'a gidiyor.

---

### A3. Boss Fight 1v1 Hard Guarantee

**Mevcut Durum**: 
- `BOSS_ADD_SPAWN_INTERVAL: 0` (satir 168)
- `canSpawn = bossIncomingRef.current <= 0 && !bossStateRef.current.isActive` (satir 805)

**Yapilacak**: Zaten implement edilmis. Boss aktifken spawn yok.

---

### A4. Power/Charge Sistemi (TDS Tarzı)

**Mevcut Durum**: 
- "Energy" adi kullaniliyor
- `bombCharges = Math.min(floor(energy/2), 3)` zaten var (GameHUD satir 242-243)
- Enerji 0'dan basliyor

**Yapilacak Degisiklikler**:

| Dosya | Degisiklik |
|-------|------------|
| `config.ts` | `MAX_ENERGY` -> `MAX_POWER` rename, yorum guncelle |
| `GameHUD.tsx` | "Energy" -> "Power" label, bar + charge icon UI |
| `CoffeeRushGame.tsx` | Variable isimleri energy -> power (opsiyonel, internal) |

**UI Tasarim**:
```
+-------------------------+   +-------+
| [====----] Power        |   | ⚡ x2 |
+-------------------------+   +-------+
```

---

## B) Flow - Oyun Akisi Degisiklikleri

### B1. Same-Scene Play Transition

**Mevcut Durum**: 
- `GarageScreen` tamamen state degisince gozukuyor/kayboluyor
- State: `MENU` -> `PLAY` anlik gecis

**Yapilacak**:
1. GarageScreen'e fade-out animasyonu ekle
2. Play tiklaninca:
   - `isTransitioning` state true yap
   - 300ms fade-out animasyonu
   - Sonra `onPlay(mode)` cagir
3. CSS: `animate-fade-out` class ekle

**Teknik Uygulama**:

```tsx
// GarageScreen.tsx - yeni state
const [isTransitioning, setIsTransitioning] = useState(false);

const handlePlay = () => {
  setIsTransitioning(true);
  setLastGameMode(selectedMode);
  setTimeout(() => onPlay(selectedMode), 300);
};

// JSX'de:
<div className={`... ${isTransitioning ? 'animate-fade-out' : ''}`}>
```

---

### B2. Pause Menu

**Yapilacak**:
1. Yeni component: `PauseMenu.tsx`
2. `CoffeeRushGame.tsx`'e pause state ekle
3. GameHUD'a pause butonu ekle
4. Pause overlay: Continue / Leave butonlari

**Pause Menu Tasarim**:
```
+---------------------------+
|         PAUSED            |
|                           |
|     [   Continue   ]      |
|     [   Leave      ]      |
|                           |
|   Tips so far: $45        |
+---------------------------+
```

**Leave Reward Kurallari**:
- Tips/beans o ana kadar kazanilanlar verilir
- Chapter clear bonus verilmez
- Best time guncellenmez
- Boss defeated sayilmaz

**Teknik Uygulama**:

```tsx
// CoffeeRushGame.tsx
const [isPaused, setIsPaused] = useState(false);

// useGameLoop hook'una pause kontrolu ekle
useGameLoop(gameLoop, gameState === 'PLAY' && !isPaused);

// handleLeave fonksiyonu
const handleLeave = useCallback(() => {
  // Award tips earned so far (no bonus, no records)
  const beansEarned = tipsRef.current;
  const current = loadProgression();
  saveProgression({
    ...current,
    totalBeans: current.totalBeans + beansEarned,
  });
  setIsPaused(false);
  setGameState('MENU');
}, []);
```

---

## C) Garage UI Sadeleştirme

### C1. Compact Upgrade Tiles

**Mevcut Durum**: Upgrade kartlari genis, text agirlikli

**Yeni Tasarim**:
```
+--------+ +--------+ +--------+ +--------+
|   🛡️   | |   ☕   | |   ⚡   | |   📦   |
| Lv 2/3 | | Lv 1/3 | | Lv 0/3 | | Lv 1/2 |
| [🫘35] | | [🫘44] | | [🫘25] | | [MAX]  |
+--------+ +--------+ +--------+ +--------+
```

**Degisiklikler**:
- Grid layout (2x2 veya 4x1)
- Sadece icon + level pips + cost
- Uzun aciklama metinleri kaldirildi
- Tooltip: hover/long-press ile detay

---

### C2. Bottom Footer Tabs (Locked Placeholders)

**Tasarim**:
```
+-------+-------+-------+-------+-------+
| Battle| Shop  | Hero  |Weapons| Tower |
| (now) | 🔒    | 🔒    | 🔒    | 🔒    |
+-------+-------+-------+-------+-------+
```

**Yapilacak**:
- GarageScreen altina footer tabs ekle
- Sadece "Battle" aktif (mevcut ekran)
- Diger 4'u locked, tiklayinca "Coming Soon" toast

---

### C3. Chapter Header -> Map/Modal

**Mevcut Durum**: Chapter 1 / Endless toggle butonlari

**Yeni Tasarim**:
- Ust kisimda "☕ Chapter 1" tiklanabilir baslik
- Tiklaninca modal acilir:
  ```
  +------------------------+
  |     SELECT MODE        |
  |                        |
  |  [✓] Chapter 1         |
  |  [🔒] Chapter 2        |
  |       Coming Soon...   |
  |                        |
  |  [∞] Endless Mode      |
  +------------------------+
  ```

---

## D) Optional - Ticket Sistemi Placeholder

**Not**: Simdilik sadece UI gosterilecek, enforcement kapalı kalacak.

```
+------------------+
| 🎫 10/10 Plays   |
| ↻ Full in 30m    |
+------------------+
```

Config flag: `TICKET_ENFORCEMENT_ENABLED: false`

---

## Dosya Degisiklikleri Ozeti

| Dosya | Degisiklik Tipi |
|-------|-----------------|
| `src/game/config.ts` | MAX_ENERGY -> MAX_POWER rename, yeni sabitler |
| `src/game/GameHUD.tsx` | Power label, Pause butonu, charge UI |
| `src/game/GarageScreen.tsx` | Compact tiles, footer tabs, chapter modal, fade transition |
| `src/game/CoffeeRushGame.tsx` | Pause state, handleLeave, pause kontrolu |
| `src/game/PauseMenu.tsx` | **YENi** - Pause overlay component |
| `src/index.css` | animate-fade-out keyframe |

---

## Uygulama Sirasi (Onerilen)

1. **Commit 1**: Power rename + charge UI guncellemesi
2. **Commit 2**: Same-scene transition (fade-out)
3. **Commit 3**: Pause menu + Leave fonksiyonu
4. **Commit 4**: Garage UI overhaul (tiles + footer + modal)
5. **Commit 5**: Optional ticket placeholder

---

## Kabul Kriterleri

- [ ] Chapter 1 run: Heavy spawn yok (zaten var)
- [ ] B2 upgrade ile top box ilk kırılıyor (zaten var)
- [ ] Boss fight sırasında sıfır add spawn (zaten var)
- [ ] Power 0'dan basliyor, charge sayaci doluyorken artiyor
- [ ] Play tiklaninca fade-out + ayni ekran hissi
- [ ] Pause calisiyor, Leave garage'a donduruyor ve tips veriyor
- [ ] Garage: Compact tiles, footer tabs (locked), chapter modal

---

## Risk Degerlendirmesi

| Alan | Risk | Neden |
|------|------|-------|
| Core Rules (A) | ✅ Dusuk | Cogu zaten implement edilmis |
| Power Rename | ✅ Dusuk | Sadece UI label degisikligi |
| Same-scene Transition | ✅ Dusuk | CSS animasyon, state timing |
| Pause Menu | 🟡 Orta | Game loop pause, reward logic |
| Garage UI | 🟡 Orta | Layout overhaul, modal logic |
| Ticket System | ✅ Dusuk | Placeholder only |

---

## Notlar

- "Energy" -> "Power" sadece UI'da degisiyor, kod icinde energy variable ismi kalabilir (breaking change onlemek icin)
- Leave reward: Tips verilir ama chapter bonus ve record guncellenmez - bu exploit'i onler
- Footer tabs simdiden eklenmesi "buyuk oyun" hissi veriyor, Chapter 2 ile birlikte bazi acilabilir

