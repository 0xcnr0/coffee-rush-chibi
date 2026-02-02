
# Phase 2C.8.1: Upgrade Tile'ları Canvas Koordinatlarına Kilitle + Scale Ayarı

## Problem Analizi

Senin tasarımında upgrade butonları cart'ın hemen yanında, ama mevcut kodda butonlar farklı yerlerde çıkıyor. Nedeni:

- **GarageOverlay** bir `flex flex-col` container kullanıyor
- Butonlar `top-20`, `bottom-56` gibi Tailwind sınıfları ile konumlandırılıyor
- Bu değerler **flex container'ın ortadaki boş alanına** göre hesaplanıyor
- Ama cart, **canvas'ta sabit koordinatlarda** çiziliyor (groundY = 460px)

Bu yüzden butonlar cart'a "yapışmıyor" - farklı koordinat sistemleri kullanılıyor.

## Tasarımındaki Cart ve Upgrade Pozisyonları

Canvas boyutu: 360x640 px

| Eleman | Canvas Y Pozisyonu |
|--------|-------------------|
| Ground/Lane | 460 (640 - 180) |
| Cart tekerlekleri | 445 |
| Chassis (block 0) | ~425-445 |
| 1. Cargo Box | ~380-425 |
| 2. Cargo Box | ~335-380 |
| Cart üstü (barista) | ~290-335 |

Senin tasarımında:
- **+1 Cargo**: Cart'ın sağ üst köşesinde, yaklaşık y=300-350 civarı
- **HP Upgrade**: Cart'ın sol tarafında, yaklaşık y=380 civarı
- **Damage + Power**: Lane'in hemen üstünde, yaklaşık y=400-430 civarı

## Çözüm: Mutlak Piksel Pozisyonlama

GarageOverlay'daki upgrade butonlarını **canvas koordinatlarına göre** konumlandıracağız.

### Dosya: `src/game/GarageOverlay.tsx`

**1. Flex-1 ortasındaki relative container'ı kaldır**

Şu an butonlar `flex-1 relative` içinde ve Tailwind sınıflarıyla konumlandırılıyor. Bunun yerine `absolute inset-0` bir container içinde mutlak px değerleri kullanacağız.

```tsx
// ONCE (satır 191-247):
<div className="flex-1 relative">
  <div className="absolute top-20 right-8">...+1 Cargo...</div>
  <div className="absolute left-4 top-1/3">...HP...</div>
  <div className="absolute bottom-56 left-1/2 -translate-x-1/2">...Damage+Power...</div>
</div>

// SONRA:
<div className="absolute inset-0 pointer-events-none">
  {/* +1 Cargo: Cart'ın sağ üst köşesi (CART_X + CART_WIDTH + gap, cart üstü) */}
  <div 
    className="absolute pointer-events-auto"
    style={{ top: 290, right: 20 }}
  >
    ...+1 Cargo button...
  </div>
  
  {/* HP Upgrade: Cart'ın sol tarafı (blockCount > 1 ise) */}
  {blockCount > 1 && (
    <div 
      className="absolute pointer-events-auto"
      style={{ top: 350, left: 110 }}
    >
      ...HP tile...
    </div>
  )}
  
  {/* Damage + Power: Lane'in hemen üstünde, ortada */}
  <div 
    className="absolute pointer-events-auto flex gap-3"
    style={{ top: 400, left: '50%', transform: 'translateX(-50%)' }}
  >
    ...Damage + Power tiles...
  </div>
</div>
```

**2. Flex yapısını sadeleştir**

Top bar ve bottom panel için flex gerekli, ama ortadaki "game area" için flex-1 gereksiz. Sadece transparent bir overlay olacak.

```tsx
// Ana container:
<div className="absolute inset-0 flex flex-col z-20">
  {/* TOP BAR - flexbox'ta yer kaplar */}
  <div className="px-3 py-2">...</div>
  
  {/* UPGRADE TILES - absolute, flex dışında */}
  <div className="absolute inset-0 pointer-events-none">
    {/* Butonlar burada, canvas koordinatlarıyla */}
  </div>
  
  {/* BOTTOM PANEL - flexbox'ta yer kaplar */}
  <div className="mt-auto pb-16 pt-4 px-4">...</div>
  
  {/* FOOTER - absolute bottom */}
  <div className="absolute bottom-0 left-0 right-0">...</div>
</div>
```

### Dosya: `src/game/CoffeeRushGame.tsx`

**Scale limiti 1.2'ye çıkar**

```tsx
// Satır 113:
// ONCE:
setScale(Math.max(0.5, Math.min(s, 1)));

// SONRA:
setScale(Math.max(0.5, Math.min(s, 1.2))); // Hafif upscale OK
```

### Dosya: `src/game/config.ts`

Upgrade pozisyonları için yeni sabitler (opsiyonel, daha temiz):

```typescript
// Layout - Upgrade Button Positions (canvas coordinates)
UPGRADE_CARGO_POS: { x: 280, y: 290 },  // +1 Cargo, cart sağ üstü
UPGRADE_HP_POS: { x: 110, y: 350 },      // HP, cart sol tarafı  
UPGRADE_STATS_Y: 400,                     // Damage/Power, lane üstü
```

## Pozisyon Hesaplama Mantığı

Canvas sabitlerinden türetilen değerler:

```
CANVAS_HEIGHT = 640
GROUND_Y_OFFSET = 180
groundY = 640 - 180 = 460

CART_X = 30
CART_WIDTH = 75
BLOCK_HEIGHT = 45

Cart sağ kenarı = CART_X + CART_WIDTH = 105
Cart üstü (1 box ile) = groundY - 30 - 2*BLOCK_HEIGHT = 460 - 30 - 90 = 340

+1 Cargo butonu:
  - x: 105 + 15 = 120 (cart sağ kenarından 15px gap) VEYA right: 20 (sağdan 20px)
  - y: 290 (barista hizası, cart'ın en üstü)

HP butonu:
  - x: 110 (cart sağ kenarı + 5px)
  - y: 350 (1. cargo box hizası)

Damage + Power:
  - x: centered (left: 50%, transform)
  - y: 400 (lane'in 60px üstü)
```

## Kabul Kriterleri

- [ ] +1 Cargo butonu cart'ın sağ üst köşesinde (barista hizasında)
- [ ] HP butonu cart'ın sağ tarafında, 1. cargo box hizasında
- [ ] Damage + Power butonları lane'in hemen üstünde, ortada
- [ ] PLAY butonu lane'in altında (y > 460)
- [ ] Scale max 1.2, büyük ekranlarda daha az boşluk
- [ ] Box satın alınca pozisyonlar mantıklı şekilde kayar

## Risk

| Alan | Risk | Açıklama |
|------|------|----------|
| Mutlak px | Orta | Farklı scale'lerde görünümü test etmeli |
| pointer-events | Düşük | none/auto ile tıklanabilirlik korunur |
| Flex kaldırma | Düşük | Top/bottom panel hala flexbox ile yönetilir |

## Önemli Not

Bu değişiklik upgrade butonlarını senin tasarımındaki gibi cart'a "yapıştıracak". Box sayısı arttıkça cart yükselir ve butonlar da buna göre ayarlanabilir (blockCount'a göre dinamik y hesaplaması).
