
# Phase 2C.8.2: Garage Layout Yeniden Düzenleme (My Design Layout)

## Hedef Layout (Aşağıdan Yukarıya)

```text
┌─────────────────────────────────────────┐
│  TOP BAR: Lv.1 | [Dawn Rush ▼] | ⚡10/10 🪙XX 🎯 │
│  ─────────────────────────────────────  │
│  [☕ Dawn Rush ▼] ← Chapter dropdown burada │
├─────────────────────────────────────────┤
│                                         │
│       📦+1 Cargo                        │
│          ↗                              │
│      ┌──────┐   (sağ üst köşe)         │
│      │BARISTA│                          │
│      ├──────┤                           │
│  🛡️→ │ BOX 2 │ ← her box'a HP upgrade   │
│  🛡️→ │ BOX 1 │                          │
│  🛡️→ │CHASSIS│                          │
│      └──🛞──┘                           │
│                                         │
│  ═══════════ LANE/ROAD ════════════════ │
│                                         │
├─────────────────────────────────────────┤
│  ROW 3: [⚡ Power]  [☕ Damage]  (yatay) │
├─────────────────────────────────────────┤
│  ROW 2: [▶ PLAY (geniş)]  [🔄 Reset]    │
├─────────────────────────────────────────┤
│  ROW 1: [Battle] [Shop] [Hero] [Weapons] [Tower] │
└─────────────────────────────────────────┘
```

---

## Değişiklik Özeti

### 1. Cart'ı Sağa Kaydır
**Dosya:** `src/game/config.ts`

```typescript
CART_X: 30 → 70  // 40px sağa kaydır, HP upgrade butonlarına yer aç
```

### 2. Bottom Layout (3 Satır - Flexbox)
**Dosya:** `src/game/GarageOverlay.tsx`

Bottom panel'i 3 satırlı flexbox yapısına dönüştür:

**Row 1 (en alt):** Footer tabs - mevcut haliyle kalır
**Row 2:** PLAY (flex-1/geniş) + Reset (küçük/dar) - yan yana
**Row 3:** Power upgrade + Damage upgrade - yatay, eşit boyutlu

```tsx
{/* BOTTOM PANEL - 3 Rows */}
<div className="pb-14 px-4 flex flex-col gap-2">
  {/* Row 3: Power + Damage (yatay tile'lar) */}
  <div className="flex gap-2">
    <HorizontalUpgradeTile upgrade={UPGRADES.power} ... />
    <HorizontalUpgradeTile upgrade={UPGRADES.damage} ... />
  </div>
  
  {/* Row 2: PLAY + Reset */}
  <div className="flex gap-2">
    <Button className="flex-1 py-5">▶ PLAY</Button>
    <Button className="w-12 py-5">🔄</Button>
  </div>
</div>

{/* Row 1: Footer tabs (absolute bottom) */}
<div className="absolute bottom-0 ...">...</div>
```

### 3. HP Upgrade Butonları - Box'ların Solunda
**Dosya:** `src/game/GarageOverlay.tsx`

Her block için bir HP upgrade tile'ı, box'un soluna hizalı:

```tsx
{/* HP Upgrades - Canvas koordinatlarında, box'ların solunda */}
<div className="absolute inset-0 pointer-events-none">
  {/* Her block için HP tile */}
  {Array.from({ length: blockCount }, (_, i) => {
    const blockY = groundY - 30 - (i + 1) * BLOCK_HEIGHT;
    return (
      <div 
        key={i}
        className="absolute pointer-events-auto"
        style={{ 
          top: blockY + 5,  // Box'un ortasına hizalı
          left: 8           // Solda, cart'ın solunda
        }}
      >
        <SmallHPTile level={hpLevel} maxLevel={3} cost={hpCost} />
      </div>
    );
  })}
</div>
```

### 4. +1 Cargo Butonu - Sağ Üst Köşe (Barista Hizası)
**Dosya:** `src/game/GarageOverlay.tsx`

```tsx
{/* +1 Cargo - Cart'ın sağ üst köşesi */}
<div 
  className="absolute pointer-events-auto"
  style={{ 
    top: baristaY - 20,           // Barista'nın hizasında
    left: CART_X + CART_WIDTH + 15 // Cart'ın sağ kenarından 15px gap
  }}
>
  <CargoUpgradeTile ... />
</div>
```

### 5. Chapter Dropdown - Top Bar Altına
**Dosya:** `src/game/GarageOverlay.tsx`

Top bar'ın altına, 10/10 ve coin'in hemen altında:

```tsx
{/* TOP BAR */}
<div className="px-3 py-2">
  <div className="flex items-center justify-between">
    {/* Lv.1 | Chapter | Energy + Coins + Quest */}
    ...
  </div>
  
  {/* Chapter dropdown - tek satırda, sağ tarafa yaslanmış */}
  <button 
    onClick={() => setShowModeModal(true)}
    className="mt-2 flex items-center gap-1 bg-coffee-dark/40 rounded-full py-1 px-3 ml-auto"
  >
    <span className="text-sm">☕ Dawn Rush</span>
    <ChevronDown className="w-3 h-3" />
  </button>
</div>
```

### 6. Yatay Upgrade Tile Component
**Dosya:** `src/game/GarageOverlay.tsx`

Power ve Damage için yatay format:

```tsx
const HorizontalUpgradeTile: React.FC<Props> = ({ upgrade, ... }) => {
  return (
    <button className="flex-1 flex items-center gap-2 p-2 rounded-xl border-2 bg-coffee-dark/80">
      {/* Sol: İkon */}
      <div className="p-1.5 rounded-lg bg-warm-orange/20">
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Orta: Level pips + isim */}
      <div className="flex-1">
        <span className="text-xs text-coffee-cream">{upgrade.name}</span>
        <div className="flex gap-0.5">
          {/* Level dots */}
        </div>
      </div>
      
      {/* Sağ: Cost */}
      <div className="flex items-center gap-0.5">
        <span>🪙</span>
        <span className="text-gold font-bold">{cost}</span>
      </div>
    </button>
  );
};
```

### 7. Küçük HP Tile Component (Box Yanı)
**Dosya:** `src/game/GarageOverlay.tsx`

Box'ların soluna yerleşen kompakt HP upgrade:

```tsx
const SmallHPTile: React.FC<Props> = ({ level, maxLevel, cost, onPurchase }) => {
  return (
    <button 
      onClick={onPurchase}
      className="flex flex-col items-center p-1.5 rounded-lg border bg-coffee-dark/80 min-w-[40px]"
    >
      <Shield className="w-4 h-4 text-warm-orange" />
      <div className="flex gap-0.5 my-0.5">
        {/* Level dots */}
      </div>
      <span className="text-[8px] text-gold">🪙{cost}</span>
    </button>
  );
};
```

---

## Pozisyon Hesaplamaları

### Canvas Koordinatları
```
CANVAS: 360 x 640 px

groundY = 640 - 180 = 460  (lane)
CART_X = 70  (yeni, 30'dan 70'e kaydı)
CART_WIDTH = 75
BLOCK_HEIGHT = 45
chassisHeight = 18 (45 * 0.4)

Block 0 (chassis): y = 460 - 30 - 18 = 412-430
Block 1 (box 1):   y = 412 - 45 = 367-412
Block 2 (box 2):   y = 367 - 45 = 322-367
Barista:           y ≈ 300-320

+1 Cargo: left = 70 + 75 + 15 = 160, top = 280
HP tiles: left = 8, top = blockY + 10
```

### UI Bottom Area
```
Footer tabs:  py-2 ≈ 44px
PLAY + Reset: py-5 ≈ 52px + gap
Power/Damage: py-3 ≈ 48px + gap

Toplam: ~160px (UI_SAFE_BOTTOM_PX = 160 ile uyumlu)
```

---

## Dosya Değişiklikleri

### `src/game/config.ts`
| Satır | Değişiklik |
|-------|------------|
| 22 | `CART_X: 30` → `CART_X: 70` |

### `src/game/GarageOverlay.tsx`
| Bölüm | Değişiklik |
|-------|------------|
| Upgrade Tiles Container | Flex-1 → absolute inset-0 (HP tiles için) |
| Bottom Panel | 1 satır → 3 satır yapısı |
| +1 Cargo tile | Sağ üst köşe, cart'a bağlı koordinat |
| HP tiles | Her block için sol tarafta küçük tile |
| Power/Damage | Yeni HorizontalUpgradeTile component |
| Chapter dropdown | Top bar'ın altına, sağa yaslanmış |
| PLAY + Reset | Yan yana, PLAY geniş, Reset dar |

---

## Kabul Kriterleri

- [ ] Cart ekranın biraz sağında (HP tile'larına yer var)
- [ ] Her cargo box'un solunda 🛡️ HP upgrade tile'ı
- [ ] +1 Cargo butonu cart'ın sağ üst köşesinde (barista hizası)
- [ ] Bottom'da 3 satır: Footer → PLAY+Reset → Power+Damage
- [ ] PLAY geniş, Reset dar (yan yana)
- [ ] Power ve Damage yatay tile formatında
- [ ] Chapter dropdown top bar altında, tek satır yazı
- [ ] PLAY butonu lane'e binmiyor

---

## Teknik Notlar

1. **CART_X değişikliği**: Cart sağa kayınca tüm enemy hedefleme ve gameplay aynı kalır, sadece görsel pozisyon değişir.

2. **HP upgrade logic**: Her block için ayrı tile görünse de, tüm block'lar aynı HP multiplier'ı kullanır (mevcut sistem). Görsel olarak block başına tile, ama tek bir upgrade seviyesi.

3. **Scale ile uyum**: Tile pozisyonları canvas koordinatlarında olduğu için scale değişse de cart'a göre sabit kalır.

4. **Reset butonu**: Live'a alınca kaldırılacak - şimdilik küçük tutuyoruz.
