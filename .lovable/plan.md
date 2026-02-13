

# Star Pip Maliyet Artisi + Gate HP Dusurme + Star Throw Nerf

## Degisiklikler

### 1. Star Pip Base Cost: 80 -> 250
140 coin'e alinan bir ozelligin upgrade'i 80 coin cok ucuz. Ilk pip 250, sonrakiler 1.35x scaling ile artacak (250, 337, 455, 614, 830...).

### 2. Block (Kasa) Ilk Upgrade Maliyeti: 30 -> 28
Ikinci run sonrasi direkt upgrade edebilmek icin (Run 1 + Run 2 = ~28 coin).

### 3. Gate HP Dusurme
Run 6 telemetrisi: Star ile G1 16.7s'de yikildi, G2'de 34.8s'de %43 hasar. Star firlatma gate'lere cok etkili. Gate HP'leri dusurulerek daha hizli ilerleme saglanacak:

| Gate | Eski HP | Yeni HP |
|------|---------|---------|
| G1 | 350 | 350 |
| G2 | 1400 | 800 |
| G3 | 3500 | 2000 |
| G4 | 5000 | 3500 |
| G5 | 7000 | 5000 |

### 4. Star Throw Nerf
Star firlatma hala cok guclu (tek basina gate kesiyor). Hasari dusurulecek:

| Parametre | Eski | Yeni |
|-----------|------|------|
| SAW_THROW_DAMAGE | 8 | 5 |
| SAW_THROW_SPEED | 240 | 200 |
| SAW_THROW_LIFETIME | 0.9 | 0.7 |

## Teknik Detaylar

Tek dosya degisikligi: `src/game/config.ts`

- STAGES dizisinde G2-G5 gateHP degerleri guncellenir
- GATE_HP_RATIOS orantili olarak guncellenir
- BLOCK_COUNT_BASE_COST: 30 -> 28
- STAR_PIP_BASE_COST: 80 -> 250
- SAW_THROW_DAMAGE: 8 -> 5
- SAW_THROW_SPEED: 240 -> 200
- SAW_THROW_LIFETIME: 0.9 -> 0.7

