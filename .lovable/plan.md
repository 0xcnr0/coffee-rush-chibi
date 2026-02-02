# Phase 2C.8.1: Upgrade Tile'ları Canvas Koordinatlarına Kilitle + Scale Ayarı

## ✅ COMPLETED

### Yapılan Değişiklikler

1. **GarageOverlay.tsx**: Upgrade tile'ları canvas koordinatlarına göre mutlak px pozisyonlarla yerleştirildi:
   - +1 Cargo: `top: 290, right: 20` (cart sağ üst köşesi, barista hizası)
   - HP Upgrade: `top: 350, left: 110` (cart sağ tarafı, 1. cargo box hizası)
   - Damage + Power: `top: 400, left: 50%, transform: translateX(-50%)` (lane üstü, ortada)

2. **CoffeeRushGame.tsx**: Scale limiti 1.0 → 1.2 olarak güncellendi (hafif upscale OK)

3. **Flex yapısı korundu**: Top bar ve bottom panel için flexbox devam ediyor, sadece upgrade tile'ları absolute overlay içinde.

### Pozisyon Mantığı

```
Canvas: 360x640
groundY = 640 - 180 = 460 (lane)

+1 Cargo: y=290 (barista hizası)
HP: y=350 (1. cargo box hizası)  
Damage/Power: y=400 (lane'in 60px üstü)
PLAY: pb-16 (lane'in altında)
```
