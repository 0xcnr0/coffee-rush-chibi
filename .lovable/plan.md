
# Chapter 1 Balance Tuning + Travel Badge Removal

## Hedef Metrikler

| Milestone | Hedef Run | Beklenen Upgrade Durumu |
|-----------|-----------|-------------------------|
| G1 Clear | Run 3-4 | 1 upgrade (E1 veya H1) |
| G2 Clear | Run 7-9 | 2-3 upgrade |
| G3 Clear | Run 10-12 | 3-4 upgrade |
| Boss Kill | Run 13-16 | Near-max (B2/H2-3/D2-3/E2) |

## Yapilacak Degisiklikler

### 1. Travel Badge Tamamen Kaldir

**Dosya:** `src/game/GameHUD.tsx` (satir 80-96)

Mevcut "🚶 TRAVEL" badge overlay'i tamamen silinecek. TRAVEL fazinda:
- Parallax animasyonu devam edecek
- Tekerlek donecek
- Hicbir UI elementi gosterilmeyecek (saf hareket hissi)

### 2. Economy Boost - Upgrade Maliyetlerini Dusur

**Dosya:** `src/game/config.ts`

| Parametre | Eski | Yeni | Etki |
|-----------|------|------|------|
| `TOWER_HP_BASE_COST` | 150 | 80 | Ilk HP upgrade 2 run'da alinabilir |
| `ESPRESSO_BASE_COST` | 150 | 80 | Ilk DPS upgrade 2 run'da alinabilir |
| `POWER_BASE_COST` | 120 | 70 | En ucuz, bomb spam icin |
| `BLOCK_COUNT_BASE_COST` | 150 | 100 | Cargo box biraz daha pahali (cunku cok guclu) |
| `UPGRADE_COST_SCALING` | 1.65 | 1.50 | Sonraki seviyeler daha erisilebilir |

**Yeni maliyet tablosu (ornek Tower HP):**
- Level 1: 80 beans (~2 run)
- Level 2: 120 beans (~3 run)
- Level 3: 180 beans (~4-5 run)
- Toplam max: 380 beans (~10-12 run)

### 3. Gate Hedeflerini Dusur (Daha Hizli Ilerleme)

**Dosya:** `src/game/config.ts`

| Parametre | Eski | Yeni | Etki |
|-----------|------|------|------|
| `GATE_1_KILL_TARGET` | 24 | 18 | G1 daha hizli clear |
| `GATE_2_KILL_TARGET` | 34 | 26 | G2 daha erisilebilir |
| `GATE_3_KILL_TARGET` | 44 | 34 | G3 hala challenge ama asiri degil |

### 4. 0-Upgrade Survivability Artir

**Dosya:** `src/game/config.ts`

| Parametre | Eski | Yeni | Etki |
|-----------|------|------|------|
| `BLOCK_MAX_HP` | 330 | 380 | +15% HP, 0-upgrade biraz daha uzun yasasin |
| `EARLY_GAME_SECONDS` | 18 | 22 | Warmup biraz uzun, rahat baslangic |

## Degismeyecek Seyler

- `TIP_VALUE`: 2 (coin kazanimi ayni)
- `BOSS_HP`: 990 (boss zorlugu ayni)
- `RUSH_SPAWN_MULTIPLIER`: 2.3 (rush intensity ayni)
- Latch sistemi, bomb mekanigi, run buff pool

## Beklenen Sonuc

```text
Run 1-2: 35-40 beans → Ilk upgrade alinabilir (80 bean)
Run 3-4: G1 clear (1-2 upgrade ile)
Run 5-8: G2 clear (3-4 upgrade ile)
Run 9-12: G3 + Boss gorulebilir
Run 13-16: Boss kill (near-max upgrades)
```

## Teknik Detaylar

### GameHUD.tsx Degisikligi
Satirlar 80-96 arasindaki TRAVEL badge blogu tamamen silinecek:
```tsx
// SILINECEK BLOK:
{isGateFlow && playPhase === 'TRAVEL' && (
  <div className="absolute top-1/2 ...">
    ...TRAVEL badge...
  </div>
)}
```

### config.ts Degisiklikleri (Tek dosya, 10 satir)
```text
Satir 25:  BLOCK_MAX_HP: 330 → 380
Satir 45:  EARLY_GAME_SECONDS: 18 → 22
Satir 137: UPGRADE_COST_SCALING: 1.65 → 1.50
Satir 142: TOWER_HP_BASE_COST: 150 → 80
Satir 148: ESPRESSO_BASE_COST: 150 → 80
Satir 154: POWER_BASE_COST: 120 → 70
Satir 160: BLOCK_COUNT_BASE_COST: 150 → 100
Satir 188: GATE_1_KILL_TARGET: 24 → 18
Satir 189: GATE_2_KILL_TARGET: 34 → 26
Satir 190: GATE_3_KILL_TARGET: 44 → 34
```

## Test Plani

Degisiklik sonrasi 5 run at (fresh save, 0 upgrade):
1. Run 1-2: Kac bean kazanildi? Ilk upgrade alinabildi mi?
2. Run 3-4: G1 gecildi mi?
3. Run 7-9: G2 gecildi mi?
4. Run 13+: Boss kill oldu mu?

Basari kriteri: Boss kill 13-16 run arasinda olmali.
