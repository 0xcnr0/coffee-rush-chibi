
# Phase 2C.7: Fix Leave + Viewport Fit (Scale-to-Fit)

## Tespit Edilen Sorunlar

### 1. KRITIK BUG: handleLeave calismama
**Konum:** `src/game/CoffeeRushGame.tsx` satir 362-368

**Problem:** 
- `require('./persistence')` dinamik import kullanilmis - ESM/Vite'da calismaz
- Dahasi, `saveProgression` hic import edilmemis! Satir 11-16'da sadece `loadProgression`, `updateBestRecords`, `updateChapterClear`, `getUpgradeMultiplier` var

**Cozum:** `saveProgression`'i import listesine ekle ve `require()` satirini kaldir

### 2. Viewport Bosluk Problemi
**Konum:** 
- `src/pages/Index.tsx` satir 5: `flex items-center justify-center`
- `src/index.css` satir 117: `.game-container` icinde ayni ortalama

**Problem:** Dikey ortalama ust/alt bosluk yaratiyor

### 3. Container Boyutlandirma
**Konum:** `src/game/CoffeeRushGame.tsx` satir 1191-1197

**Problem:** `min(100vh, 640px)` kisitlama bazi ekranlarda bosluk birakiyor

---

## Uygulama Plani

### Adim 1: saveProgression import fix
**Dosya:** `src/game/CoffeeRushGame.tsx`

```tsx
// Satir 11-16'yi guncelle:
import { 
  loadProgression, 
  saveProgression,  // <-- EKLE
  updateBestRecords,
  updateChapterClear,
  getUpgradeMultiplier 
} from './persistence';
```

### Adim 2: handleLeave require() kaldir
**Dosya:** `src/game/CoffeeRushGame.tsx`

```tsx
// Satir 357-373 - require satirini kaldir:
const handleLeave = useCallback(() => {
  const beansEarned = tipsRef.current;
  if (beansEarned > 0) {
    // require satiri KALDIRILDI - artik ust-level import kullaniliyor
    const current = loadProgression();
    saveProgression({
      ...current,
      totalBeans: current.totalBeans + beansEarned,
    });
  }
  setIsPaused(false);
  setGameState('MENU');
}, []);
```

### Adim 3: Index.tsx viewport fix
**Dosya:** `src/pages/Index.tsx`

```tsx
import { CoffeeRushGame } from '@/game/CoffeeRushGame';

const Index = () => {
  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-coffee-espresso">
      <CoffeeRushGame />
    </div>
  );
};

export default Index;
```

### Adim 4: game-container ortalama kaldir
**Dosya:** `src/index.css`

```css
.game-container {
  @apply w-full h-full overflow-hidden;
  /* flex items-center justify-center KALDIRILDI */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

### Adim 5: CSS base styles + safe-area
**Dosya:** `src/index.css`

```css
/* @layer base icine ekle */
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

@supports (height: 100dvh) {
  #root {
    height: 100dvh;
  }
}
```

### Adim 6: Scale-to-fit wrapper
**Dosya:** `src/game/CoffeeRushGame.tsx`

Component icine scale state ve effect ekle:

```tsx
// Component basinda (useState'lerden sonra):
const [scale, setScale] = useState(1);

useEffect(() => {
  const computeScale = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(
      vw / GAME_CONFIG.CANVAS_WIDTH,
      vh / GAME_CONFIG.CANVAS_HEIGHT
    );
    setScale(Math.max(0.5, Math.min(s, 2)));
  };
  
  computeScale();
  window.addEventListener('resize', computeScale);
  window.addEventListener('orientationchange', computeScale);
  return () => {
    window.removeEventListener('resize', computeScale);
    window.removeEventListener('orientationchange', computeScale);
  };
}, []);
```

Return blogu:

```tsx
return (
  <div className="cr-viewport">
    <div 
      className="cr-stage"
      style={{
        width: GAME_CONFIG.CANVAS_WIDTH,
        height: GAME_CONFIG.CANVAS_HEIGHT,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <canvas ... />
      {/* GarageOverlay, GameHUD, PauseMenu, EndScreen hepsi burda */}
    </div>
  </div>
);
```

### Adim 7: cr-viewport ve cr-stage CSS
**Dosya:** `src/index.css`

```css
.cr-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: hsl(var(--coffee-espresso));
}

.cr-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
}
```

---

## Dosya Degisiklikleri Ozeti

| Dosya | Degisiklik |
|-------|------------|
| `src/game/CoffeeRushGame.tsx` | saveProgression import, handleLeave fix, scale wrapper |
| `src/pages/Index.tsx` | Ortalama class'lari kaldir, h-[100dvh] |
| `src/index.css` | game-container fix, cr-viewport/cr-stage, base styles |

---

## Kabul Kriterleri

- [ ] Leave tiklaninca Garage'a donuyor
- [ ] Leave tiklaninca tips/beans kaydediliyor
- [ ] Oyun alani viewport'u dolduruyor (ust/alt bosluk yok)
- [ ] Oyun aspect ratio bozmadan ekrana sigiyor
- [ ] Canvas + HUD + PauseMenu + EndScreen ayni stage'de ölçekleniyor

---

## Risk Degerlendirmesi

| Fix | Risk | Aciklama |
|-----|------|----------|
| saveProgression import | Dusuk | Eksik import ekleniyor |
| handleLeave require() | Dusuk | Hatali satir kaldiriliyor |
| Viewport dvh | Dusuk | Modern tarayici destegi iyi |
| Scale wrapper | Orta | Layout degisikligi, UI koordinatlari etkilenmez (pointer-events stage icinde) |

---

## Onemli Not: Touch Events

Scale transform kullandigimizda CSS pointer-events otomatik olarak dogru koordinatlari hesaplar. Canvas uzerinde ozel touch handling varsa `scale` degiskeni ile koordinat donusumu gerekebilir, ama mevcut kodda canvas tiklamalari kullanilmiyor (butona tiklamalar HUD'da) bu yuzden sorun olmamali.
