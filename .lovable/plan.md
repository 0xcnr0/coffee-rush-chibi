

# Phase 2C: Balance & Feel Polish - Upgrade Impact Tuning

## Problem Summary

ChatGPT'nin video analizine gore: tum presetler (0-4) CP1 civarinda (20-40s) oluyor. Bu, L2-L3 upgrade'lerin dramatik sekilde daha guclu hissetmesi gerektigini gosteriyor.

| Preset | Gerceklesen | Hedef |
|--------|------------|-------|
| 0 | ~24s (CP1) | Rush1'de ol |
| 1 | ~28s (CP1) | Rush1 gecilebilir |
| 2 | ~32s (CP1) | CP2'ye ulasmali |
| 4 | ~38s (CP1) | Boss'a (60s) ulasmali |

## Cozum: Upgrade Etkisini Artir

### A) Upgrade Bonus Degerleri (config.ts satir 117-135)

**Mevcut -> Yeni:**

```text
ESPRESSO_BONUS_PER_LEVEL: 0.20 -> 0.25  (L3: +60% -> +75%)
TOWER_HP_BONUS_PER_LEVEL: 0.25 -> 0.30  (L3: +75% -> +90%)
ENERGY_BONUS_PER_LEVEL: 0.15 -> 0.22    (L3: +45% -> +66%)
```

### B) Multiplier Cap'leri Guncelle

Mevcut cap'ler cok dusuk, L3'un tam etkisini engelliyor:

```text
MAX_DAMAGE_MULTIPLIER: 1.65 -> 1.80     (L3 + base = 1.75 desteklensin)
MAX_BLOCK_HP_MULTIPLIER: 1.8 -> 2.0     (L3 + base = 1.90 desteklensin)
MAX_ENERGY_MULTIPLIER: 1.5 -> 1.70      (L3 + base = 1.66 desteklensin)
```

### C) Rush Yumusatma (Opsiyonel)

Eger hala CP1'de boguluyor olunursa:

```text
RUSH_SPAWN_MULTIPLIER: 2.8 -> 2.5
```

Bu degisikligi simdilik YAPMIYORUZ, once upgrade buff'i test edilecek.

## Degistirilecek Dosya

Sadece `src/game/config.ts` - 6 satir degerini degistir.

## Beklenen Sonuc

| Preset | Yeni Hedef |
|--------|-----------|
| L0 | Rush1'de ol veya zar zor gec |
| L1 (Cargo +1) | Rush1 gecilebilir, CP2 oncesi ol |
| L2 (Cargo max) | CP1 rahat, CP2'de zorlan |
| L3 (Dengeli) | CP2'ye ulas (40s+), boss'a yaklas |
| L4 (Full) | Boss'a kesin ulas (60s), clear sansi |

## Test Proseduru

1. Debug HUD ac -> Dev Tools -> L0 sec -> Oyna
2. Rush1'de ol veya zar zor gec
3. L2 sec -> Oyunu yeniden baslat
4. CP2'ye (40s) ulasabildigin dogrula
5. L4 sec -> Oyunu yeniden baslat
6. Boss spawn (60s) gorulecek mi kontrol et

## Risk

Cok dusuk - sadece 6 sayi degisikligi, mekanik degisikligi yok.

## Teknik Detaylar

### Degistirilecek Satirlar (config.ts)

**Satir 121:** `TOWER_HP_BONUS_PER_LEVEL: 0.25 -> 0.30`
**Satir 123:** `MAX_BLOCK_HP_MULTIPLIER: 1.8 -> 2.0`
**Satir 127:** `ESPRESSO_BONUS_PER_LEVEL: 0.20 -> 0.25`
**Satir 129:** `MAX_DAMAGE_MULTIPLIER: 1.65 -> 1.80`
**Satir 133:** `ENERGY_BONUS_PER_LEVEL: 0.15 -> 0.22`
**Satir 135:** `MAX_ENERGY_MULTIPLIER: 1.5 -> 1.70`

### Yorum Guncellemeleri

Her degisiklikte yorum satirlarini da guncelle (ornegin "+30% per level (Lv3 = +90%)").

