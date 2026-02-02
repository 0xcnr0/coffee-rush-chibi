
# Phase 2C.8 — Garage Layout Parity (My Design) + True Same-Scene + Lane/Play Fix

## Mevcut Durum Analizi

Kullanicinin yükledigi görsel incelendi:
- **Kullanicinin tasarimi**: Transparent top bar (arka plan yok), upgrade butonlari cart'in etrafinda konumlanmis, PLAY butonu alt kisimda lane'in altinda
- **Mevcut hali**: Top bar'da kahverengi arka plan var (`bg-coffee-espresso/95`), "Best" badge görünüyor, upgrade tile'lari tam pozisyonlanmamis

---

## Yapilacak Degisiklikler

### 1. Top Bar: Kahverengi Arka Plan Kaldirma
**Dosya:** `src/game/GarageOverlay.tsx`

Top bar'daki solid arka plan yerine tamamen transparent yapilacak:

```tsx
// ONCE (satir 137):
<div className="bg-coffee-espresso/95 backdrop-blur-sm border-b border-coffee-dark/50 px-3 py-2">

// SONRA:
<div className="px-3 py-2">
```

Butonlar/itemler canvas üzerinde asil arka planin önünde görünecek.

### 2. "Best" Badge Kaldirma
**Dosya:** `src/game/GarageOverlay.tsx`

Satir 185-195'teki Best badge blogu tamamen kaldirilacak:

```tsx
// KALDIRILACAK:
{progression.bestTimeSurvivedSeconds > 0 && (
  <div className="flex justify-center mt-1">
    <div className="flex items-center gap-1 bg-gold/10 px-2 py-0.5 rounded-full">
      <Trophy className="w-3 h-3 text-gold" />
      <span className="text-gold text-[10px] font-medium">
        Best: ...
      </span>
    </div>
  </div>
)}
```

### 3. Upgrade Tile Pozisyonlari (My Design Layout)
**Dosya:** `src/game/GarageOverlay.tsx`

Kullanicinin tasarimina göre yeni yerlesim:

| Upgrade | Pozisyon |
|---------|----------|
| +1 Cargo (📦) | Sag üst, cart yaninda |
| Cart HP (🛡️) | Sol taraf, cart'in solunda (blockCount > 1 ise) |
| Damage (☕) + Power (⚡) | Alt kisim, lane'in üstünde ama PLAY'in üzerinde |

```tsx
// +1 Cargo: Saga kaydır (top-4 right-4 → top-20 right-8)
<div className="absolute top-20 right-8">

// HP Upgrade: Sola (left-3 top-1/3 → left-4 top-1/3)
<div className="absolute left-4 top-1/3">

// Damage + Power: Daha yukarı (bottom-48 → bottom-56)
<div className="absolute bottom-56 left-1/2 -translate-x-1/2 flex gap-3">
```

### 4. Bottom Panel: Arka Plan Kaldirma (Transparent)
**Dosya:** `src/game/GarageOverlay.tsx`

PLAY butonu alani da transparent yapilacak:

```tsx
// ONCE (satir 263):
<div className="bg-gradient-to-t from-coffee-espresso/95 via-coffee-espresso/80 to-transparent pb-16 pt-4 px-4">

// SONRA:
<div className="pb-16 pt-4 px-4">
```

PLAY butonu kendi arka planini koruyacak (bg-warm-orange).

### 5. Footer Tabs: Arka Plan Kaldirma
**Dosya:** `src/game/GarageOverlay.tsx`

Footer da transparent:

```tsx
// ONCE (satir 295):
<div className="absolute bottom-0 left-0 right-0 bg-coffee-espresso/95 border-t border-coffee-dark/50 backdrop-blur-sm">

// SONRA:
<div className="absolute bottom-0 left-0 right-0">
```

### 6. Upgrade Preview Aninda Yansima (Zaten Calisir)
Satir 1207'de `progressionVersion` dependency eklenmis durumda. Bu calisiyor olmali. Eger calismiyorsa kontrol edilecek.

---

## Teknik Detaylar

### Dosya: `src/game/GarageOverlay.tsx`

| Satir | Degisiklik |
|-------|------------|
| 137 | Top bar bg kaldır |
| 185-195 | Best badge blogu sil |
| 204 | +1 Cargo pozisyon güncelle |
| 232 | HP tile pozisyon güncelle |
| 243 | Damage/Power tiles pozisyon güncelle |
| 263 | Bottom panel bg kaldır |
| 295 | Footer bg kaldır |

### CSS Eklentisi (Opsiyonel)
Eger buton/ikon görünürlügü icin gölge gerekirse:

```css
.garage-ui-item {
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
```

---

## Kabul Kriterleri

- [ ] Top bar'da kahverengi arka plan YOK - butonlar canvas üzerinde görünüyor
- [ ] "Best" badge Garage'da görünmüyor
- [ ] +1 Cargo butonu sag üstte, cart'a yakin
- [ ] HP upgrade sola, cart'in yaninda (blockCount > 1 ise)
- [ ] Damage + Power tile'lari ortada, lane'in üstünde ama PLAY'in uzerinde
- [ ] Bottom panel transparent - PLAY butonu kendi arka planini koruyor
- [ ] Footer transparent - tab ikonlari canvas üzerinde
- [ ] Upgrade satin alinca preview aninda güncelleniyor

---

## Önemli Notlar

1. **Lane/PLAY cakismasi**: Phase 2C.8'de `GROUND_Y_OFFSET: 180` ayarlandi, bu lane'i yukari cekti. Simdi PLAY butonu lane'e binmemeli.

2. **Same-scene**: Zaten ayni canvas kullaniliyor. Arka planlari kaldirmak "same-scene" hissini güclendirece - UI sadece canvas üzerine binmis overlay olarak görünecek.

3. **Upgrade tile stil**: Mevcut `ContextualUpgradeTile` componenti korunacak, sadece pozisyonlar degisecek.
