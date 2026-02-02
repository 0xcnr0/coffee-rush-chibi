

# Phase 2C.8: True Same-Scene + TDS Layout Parity (Only Remaining Issues)

Bu plan zaten yapilmis isi tekrarlamamak icin sadece kalan sorunlara odaklaniyor.

---

## Mevcut Durum Analizi

### Zaten Calisiyor (degistirilmeyecek):
- Top Info Bar (profile, chapter selector, energy/coins) 
- Footer tabs (Battle aktif, digerler locked)
- Energy vs Power ayirimi (Battery vs Lightning)
- Canvas scale-to-fit wrapper (cr-viewport/cr-stage)
- Same-scene cart rendering (drawMenuScene ve drawGame ayni fonksiyonlari kullaniyor)
- GarageOverlay fade-out animasyonu

### Kalan Sorunlar:

| Sorun | Konum | Aciklama |
|-------|-------|----------|
| 1. Garage'da Power HUD gorunuyor | GameHUD her zaman render | GameHUD sadece PLAY'de olmali |
| 2. PLAY butonu lane'e biniyor | GarageOverlay layout | Bottom panel lane sinirini gecmemeli |
| 3. Same-scene'de kucuk kayma | Scale hesaplama | Max 1.0 clamp eksik, upscaling yapiyor |
| 4. Upgrade preview guncellenmesi | GarageOverlay state | Alis sonrasi aninda reflesh olmali |

---

## Detayli Inceleme

### Sorun 1: Garage'da Power Bar + Bomb Butonu Gorunuyor

**Konum**: `src/game/CoffeeRushGame.tsx` satir 1232-1249

```tsx
{/* Game HUD */}
{gameState === 'PLAY' && !isPaused && (
  <GameHUD ... />
)}
```

**Durum**: GameHUD zaten `gameState === 'PLAY'` kontrolu var. Eger Garage'da gorunuyorsa farkli bir kaynak olmali.

**Kontrol**: GarageOverlay icindeki "Damage + Power tiles" (satir 240-255) karisiklik yaratmis olabilir. Bunlar upgrade tile'lari, Power BAR degil.

**Sonuc**: Bu sorun MEVCUT DEGIL gibi gorunuyor. GameHUD sadece PLAY'de render ediliyor.

---

### Sorun 2: PLAY Butonu Lane'e Biniyor

**Konum**: 
- `renderer.ts` satir 127: `groundY = CANVAS_HEIGHT - 80` (yani 640 - 80 = 560)
- `GarageOverlay.tsx` satir 261: Bottom info panel (`pb-16 pt-4` + footer)

**Problem**:
- Lane/ground y = 560 (canvas koordinatlari)
- Bottom panel Tailwind: `pb-16` = 64px padding-bottom (footer icin)
- Footer: `py-2 px-1` = 8px + 8px = ~16px yukseklik
- Play button: `py-6` = 24px + 24px = ~48px yukseklik
- Toplam bottom alan: ~128-160px

**Canvas koordinatlarinda**: 
- Ground y = 560 (canvas'in 640px yuksekliginin 80px yukarisinda)
- Cart tekerlekleri: groundY - 15 = 545
- Canvas'in alt 160px'i UI tarafindan kapli olmali

**Cozum**: 
Ground pozisyonunu yukari cekerek UI ile cakismayi onlemek:
- Yeni: `groundY = CANVAS_HEIGHT - 180` (lane 80px yerine 180px yukarida)
- Boylece lane y = 460, UI alani 460-640 arasi bos kalir

---

### Sorun 3: Scale Hesaplamasi Max 1.0 Olmali

**Konum**: `CoffeeRushGame.tsx` satir 112

```tsx
setScale(Math.max(0.5, Math.min(s, 2)));  // Max 2x yapabilir!
```

**Problem**: Buyuk ekranlarda 360x640 canvas 2x'e kadar scale ediliyor, bu:
- Piksel blur yaratir
- Stage viewport'u dolduramaz (ortalanir, cevresinde bosluk kalir)

**Cozum**:
```tsx
setScale(Math.min(s, 1));  // Asla upscale yapma, sadece shrink
```

Veya daha iyi: Eger viewport canvas'tan buyukse, canvas viewport'u dolduracak sekilde scale edebilir ama max 1.5 ile sinirla:
```tsx
setScale(Math.max(0.5, Math.min(s, 1.2)));  // Hafif upscale OK
```

---

### Sorun 4: Upgrade Sonrasi Garage Preview Guncellenmesi

**Konum**: `GarageOverlay.tsx` satir 91-93

```tsx
if (purchaseUpgrade(upgrade.key, cost)) {
  setProgression(loadProgression());  // State guncelleniyor
}
```

**Problem**: State guncelleniyor ama canvas redraw tetiklenmiyormu?

**Inceleme**: `CoffeeRushGame.tsx` satir 1201-1206:
```tsx
if (gameState === 'MENU') {
  const progression = loadProgression();
  const blockCount = 1 + (progression.upgradeLevels.blockCountLevel ?? 0);
  drawMenuScene(ctx, blockCount);
}
```

Bu kod `menuRenderEffect` useEffect icinde ve dependency olarak `[gameState]` var. Yani sadece gameState degisince calisir, progression degisince degil!

**Cozum**: 
1. GarageOverlay'dan parent'a progression degistigini bildirmek icin callback ekle
2. Veya CoffeeRushGame'de progression state tutup dependency olarak ekle
3. En basit: `blockCount` prop'u GarageOverlay'dan gelsin, degisince parent re-render olsun

---

## Dosya Degisiklikleri

### 1. `src/game/config.ts` - UI Safe Area Sabiti

```typescript
// Yeni sabit ekle (satir ~20 civari)
UI_SAFE_BOTTOM_PX: 160,  // Bottom panel + footer icin ayrilan alan
GROUND_Y_OFFSET: 180,    // Canvas altindan ground/lane mesafesi
```

### 2. `src/game/renderer.ts` - Lane Pozisyonunu Yukari Cek

```typescript
// Satir 85 ve 127'yi guncelle:
const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
// Eski: CANVAS_HEIGHT - 80 = 560
// Yeni: CANVAS_HEIGHT - 180 = 460
```

Bu degisiklik:
- `drawMenuScene`: satir 85
- `drawGround`: satir 127
- `drawCart`: groundY reference kullaniyor
- Diger fonksiyonlar da groundY'yi fonksiyon icinde hesapliyor

**Dikkat**: Tum groundY hesaplamalarini merkezi sabite cevirmek gerekiyor.

### 3. `src/game/CoffeeRushGame.tsx` - Scale Clamp + Progression Refresh

**Scale clamp** (satir 112):
```tsx
// ONCE:
setScale(Math.max(0.5, Math.min(s, 2)));

// SONRA:
setScale(Math.max(0.5, Math.min(s, 1)));  // Upscale yok
```

**Progression trigger** icin yeni state:
```tsx
// Component basinda:
const [progressionVersion, setProgressionVersion] = useState(0);

// GarageOverlay'a onProgressionChange callback ver:
<GarageOverlay 
  onPlay={handlePlay} 
  blockCount={...}
  onProgressionChange={() => setProgressionVersion(v => v + 1)}
/>

// menuRenderEffect'e dependency ekle:
useEffect(() => {
  // ... draw logic
}, [gameState, progressionVersion]);  // progressionVersion eklendi
```

### 4. `src/game/GarageOverlay.tsx` - Callback Ekle

```tsx
interface GarageOverlayProps {
  onPlay: (mode: GameMode) => void;
  blockCount: number;
  onProgressionChange?: () => void;  // Yeni
}

// handlePurchase icinde:
if (purchaseUpgrade(upgrade.key, cost)) {
  setProgression(loadProgression());
  onProgressionChange?.();  // Parent'i bilgilendir
}
```

### 5. `src/game/GarageOverlay.tsx` - Bottom Panel Lane Cakismasini Onle

Upgrade tile'larinin pozisyonlarini ayarla (satir 241):
```tsx
// ONCE:
<div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2">

// SONRA: Daha yukarida, lane'in uzerinde
<div className="absolute bottom-44 left-1/2 -translate-x-1/2 flex gap-2">
```

---

## Uygulama Sirasi

1. **config.ts**: UI_SAFE_BOTTOM_PX ve GROUND_Y_OFFSET sabitleri ekle
2. **renderer.ts**: Tum groundY hesaplamalarini merkezi sabite cevir
3. **CoffeeRushGame.tsx**: Scale clamp + progressionVersion state
4. **GarageOverlay.tsx**: onProgressionChange callback + bottom pozisyon ayari

---

## Kabul Kriterleri

- [ ] Garage'da Power bar ve Bomb butonu GORUNMUYOR (zaten oyle olmali)
- [ ] PLAY butonu ve footer, lane/road cizgisinin ALTINDA
- [ ] Cart/enemies lane'in uzerinde, UI tarafindan kapatilmiyor
- [ ] Press PLAY: cart pozisyon/scale degismiyor (true same-scene)
- [ ] Cargo upgrade sonrasi Garage'da aninda box artisi gorunuyor
- [ ] Buyuk ekranlarda gereksiz bosluk yok (scale max 1.0)

---

## Risk Degerlendirmesi

| Alan | Risk | Aciklama |
|------|------|----------|
| Ground Y degisikligi | Orta | Tum enemy spawn, projectile, cart pozisyonlarini etkiler |
| Scale clamp | Dusuk | Sadece max degeri azaltiliyor |
| Progression callback | Dusuk | Basit state tetikleyici |
| Bottom pozisyon | Dusuk | Tailwind class degisikligi |

---

## Onemli Uyari: Ground Y Degisikligi

Ground/lane pozisyonunu degistirmek TUM oyun mekaniklerini etkiler:
- Enemy spawn y pozisyonu
- Projectile hedefleme
- Collision detection
- Cart ve barista cizimi

Bu degisikligi yaparken:
1. Tum dosyalarda `CANVAS_HEIGHT - 80` aramasi yap
2. Hepsini `GAME_CONFIG.GROUND_Y_OFFSET` kullanimina cevir
3. Test: Oyun basladiginda cart, enemies, projectiles hepsi dogru pozisyonda olmali

---

## Alternatif Yaklasim (Daha Guvenli)

Ground pozisyonunu degistirmek yerine, UI panelini daha transparan/minimal yapabiliriz:
- Bottom gradient'i azalt
- Footer'i daha compact yap
- PLAY butonunu kucult

Bu yaklasim gameplay'i bozmaz ama TDS layout parity'den odun verir.

**Oneri**: Eger ground Y degisikligi cok riskli bulunursa, once sadece scale clamp ve progression refresh yapilsin, layout ayari sonraki faza birakilsin.

