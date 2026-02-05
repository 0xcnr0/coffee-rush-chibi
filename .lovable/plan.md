
# Phase A Final Tuning — 15-Run Boss Clear Hedefi

## Mevcut Durum Analizi

| Parametre | Şu Anki Değer | Sorun |
|-----------|---------------|-------|
| Gate hedefleri | 20/30/40 | Boss'a 8-10 run'da ulaşılıyor (çok hızlı) |
| TIP_VALUE | 2 | Coin kazanımı yüksek |
| Upgrade costs | 100/100/80/100 | İlk upgrade'ler çok kolay |
| UPGRADE_COST_SCALING | 1.55 | Scaling düşük |
| BOSS_HP | 1100 | Orta (şimdilik dokunmuyoruz) |
| Repair Kit | 18% | Gate'leri trivialize ediyor |
| Duplicate buffs | ✅ Engelleniyor | OK |

---

## Yapılacak Değişiklikler (Sadece config.ts)

### 1. Gate Progression — Boss'a ulaşmayı yavaşlat

```text
GATE_1_KILL_TARGET: 20 → 24
GATE_2_KILL_TARGET: 30 → 34
GATE_3_KILL_TARGET: 40 → 44
TRAVEL_DURATION: 4 → 5  (küçük pacing artışı)
```

**Etki:** Her run ~15-20% daha uzun sürer, boss'a ulaşmak için daha fazla pratik gerekir.

---

### 2. Economy — Upgrade almak daha uzun sürsün

```text
TIP_VALUE: 2 → 2  (şimdilik değiştirme, önce upgrade costs test)

TOWER_HP_BASE_COST: 100 → 150  (+50%)
ESPRESSO_BASE_COST: 100 → 150  (+50%)
POWER_BASE_COST: 80 → 120      (+50%)
BLOCK_COUNT_BASE_COST: 100 → 150  (+50%)

UPGRADE_COST_SCALING: 1.55 → 1.65  (+0.10)

CHAPTER_CLEAR_BONUS_BEANS: 10 → 5  (yarıya indir)
```

**Yeni maliyet tablosu (örnek Tower HP):**
- Level 1: 150 beans (eskiden 100)
- Level 2: 248 beans (eskiden 155)
- Level 3: 409 beans (eskiden 240)
- **Toplam max:** 807 beans (eskiden 495)

**Etki:** İlk upgrade için ~3-4 run, full build için ~18-25 run gerekir.

---

### 3. Repair Buff Nerf — Gate'leri trivialize etmesin

```text
RUN_BUFF_POOL içinde Repair Kit:
value: 0.18 → 0.12  (12% heal)
description: 'Heal 18% HP' → 'Heal 12% HP'
```

**Etki:** Repair artık "run kurtarıcı" değil, "biraz nefes aldırıcı" olur.

---

### 4. Boss HP — Şimdilik dokunmuyoruz

BOSS_HP: 1100 (değişmez)

**Neden:** Önce economy + gate pacing test edilmeli. Boss zaten 1v1 ve yeterince uzun sürüyor. Eğer test sonrası hala kolay gelirse +10-15% ekleriz.

---

## Değişiklik Özeti (Tek Dosya: config.ts)

| Satır | Eski | Yeni |
|-------|------|------|
| 137 | `UPGRADE_COST_SCALING: 1.55` | `UPGRADE_COST_SCALING: 1.65` |
| 142 | `TOWER_HP_BASE_COST: 100` | `TOWER_HP_BASE_COST: 150` |
| 148 | `ESPRESSO_BASE_COST: 100` | `ESPRESSO_BASE_COST: 150` |
| 154 | `POWER_BASE_COST: 80` | `POWER_BASE_COST: 120` |
| 160 | `BLOCK_COUNT_BASE_COST: 100` | `BLOCK_COUNT_BASE_COST: 150` |
| 184 | `TRAVEL_DURATION: 4` | `TRAVEL_DURATION: 5` |
| 188 | `GATE_1_KILL_TARGET: 20` | `GATE_1_KILL_TARGET: 24` |
| 189 | `GATE_2_KILL_TARGET: 30` | `GATE_2_KILL_TARGET: 34` |
| 190 | `GATE_3_KILL_TARGET: 40` | `GATE_3_KILL_TARGET: 44` |
| 202 | `value: 0.18` | `value: 0.12` |
| 202 | `description: 'Heal 18% HP'` | `description: 'Heal 12% HP'` |
| 213 | `CHAPTER_CLEAR_BONUS_BEANS: 10` | `CHAPTER_CLEAR_BONUS_BEANS: 5` |

---

## Hedef Metrikler (Test Sonrası Beklenti)

| Run Aralığı | Beklenen Durum |
|-------------|----------------|
| Run 1-3 | Gate 1-2 civarında ölüm, ilk upgrade'e yaklaşma (~80-120 beans) |
| Run 4-8 | Gate 2-3'ü görme, 1-2 upgrade alma, boss'ta ölüm |
| Run 12-18 | Boss clear |

---

## Test Checklist

Değişiklik sonrası 5 run at ve summary'leri paylaş:
1. Fresh save (0 upgrade) — Gate nereye kadar?
2. 1-2 upgrade ile — Gate 3'e ulaşıldı mı?
3. Boss'a ulaşılan run — Boss'ta ölüm mü, clear mı?
4. Economy delta kontrolü — D:0 veya ±1 mi?

---

## Neden Bu Yaklaşım Minimum Maliyet?

- **Tek dosya değişikliği** (config.ts)
- **Yeni sistem yok** — sadece sayılar
- **Refactor yok** — mevcut yapı korunuyor
- **Test hızlı** — 5 run ile doğrulanır
