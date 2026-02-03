

# Energy Sistemi ve Shop Tab Implementasyonu

## Genel Bakis

ChatGPT ile yaptığın konuşmayı inceledim. İki ana özellik implement edilecek:
1. **Timestamp-based Energy Sistemi** - 10 energy, 30dk regen, akıllı geri sayım
2. **Shop Tab** - Footer'da gerçek bir ekran olarak açılacak

---

## 1. Energy Sistemi (Timestamp-Based Regen)

### Kurallar (ChatGPT ile belirlediğin gibi)
- Kullanıcı 10 Energy ile başlar (max 10)
- Her PLAY, 1 Energy harcar
- İlk harcamada tek bir 30dk regen timer başlar
- Timer resetlenmez, kullanıcı oynamaya devam edebilir
- 30dk sonunda +1 Energy eklenir (max 10)
- Energy 10'a ulaşınca timer kapanır
- Energy 0 ise oyun başlatılamaz

### Persistence Değişiklikleri (`persistence.ts`)
```text
SAVE_VERSION -> 8 (bump)

EnergyData interface:
- energy: number (0-10)
- regenAnchorTs: number | null (ms timestamp)

Yeni fonksiyonlar:
- applyRegenNow(): Her 30dk için +1 energy ekler, anchor'ı ilerletir
- consumeEnergy(): PLAY'de energy harcar, anchor başlatır
- getEnergyState(): Güncel energy + kalan süre döner
```

### UI Değişiklikleri (`GarageOverlay.tsx`)
- Top bar'da energy gösterimi: `10/10` veya `5/10 (+1 in 12:34)`
- Countdown için 1 saniyelik interval (sadece UI, gerçek regen applyRegenNow'dan)
- PLAY butonu:
  - Energy > 0: Oyunu başlat
  - Energy = 0: "Out of Energy - next in mm:ss" toast/modal göster

### Config Değişiklikleri (`config.ts`)
```text
ENERGY_MAX: 10
ENERGY_REGEN_MS: 1800000 (30 dakika)
```

---

## 2. Shop Tab (Placeholder Ekran)

### Yeni Bileşen: `ShopScreen.tsx`
TDS tarzı basit bir ekran:
- 3-6 placeholder kart:
  - "Energy Refill (Coming Soon)" 
  - "Bean Pack (Coming Soon)"
  - "Cosmetics (Coming Soon)"
- Geri dönüş butonu veya footer'dan Battle tab'ına tıklayarak

### GarageOverlay Değişiklikleri
- Yeni state: `activeTab: 'battle' | 'shop'`
- `activeTab === 'shop'` ise ShopScreen render edilir
- Garage state korunur (unmount yok)
- Footer tabs artık tıklanabilir (Battle ve Shop için)

---

## 3. Dokunulmayacak Alanlar

ChatGPT ve senin belirlediğin gibi:
- Weapon sistemi (kilitli kalacak)
- Garage preview / same-scene logic
- Mevcut layout/styling (minimal değişiklikler hariç)

---

## Teknik Detaylar

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|-----------|
| `src/game/config.ts` | `ENERGY_MAX`, `ENERGY_REGEN_MS` sabitleri |
| `src/game/persistence.ts` | Version bump, energy state, regen fonksiyonları |
| `src/game/GarageOverlay.tsx` | Energy countdown UI, tab navigation, PLAY blocking |
| `src/game/ShopScreen.tsx` | **YENİ** - Placeholder shop ekranı |

### Energy State Akışı

```text
App açılış:
  loadProgression() -> applyRegenNow() -> UI güncelle

PLAY'e basınca:
  applyRegenNow()
  if (energy <= 0) -> block + toast
  else -> consumeEnergy() -> oyunu başlat

Her saniye (UI timer):
  remaining = 30dk - ((now - anchor) % 30dk)
  display "+1 in MM:SS"
```

### applyRegenNow() Mantığı

```text
function applyRegenNow():
  if energy >= 10:
    energy = 10, anchor = null, return
  
  if anchor == null:
    anchor = now (safety)
  
  elapsed = now - anchor
  gains = floor(elapsed / 30dk)
  
  if gains > 0:
    energy = min(10, energy + gains)
    if energy == 10:
      anchor = null
    else:
      anchor = anchor + (gains * 30dk)  // Kalan süreyi koru
```

---

## Test Senaryoları

1. **İlk oyun**: 10 -> 9, timer başlar (+1 in 30:00)
2. **Art arda oyun**: 9 -> 8 -> 7, timer aynı ritimde devam
3. **Refresh**: State ve countdown doğru kalır
4. **30dk bekle**: Energy +1, timer devam (eğer hala < 10)
5. **Energy 0**: PLAY blocked, toast gösterilir
6. **Shop tab**: Ekran açılır, Battle'a dönünce state korunur

---

## Implementasyon Sırası

1. `config.ts` - Energy sabitleri ekle
2. `persistence.ts` - Version bump, energy state ve fonksiyonlar
3. `ShopScreen.tsx` - Yeni placeholder ekran
4. `GarageOverlay.tsx` - Energy UI, countdown, tab navigation, PLAY blocking

