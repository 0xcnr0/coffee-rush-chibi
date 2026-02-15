

## Garage Gorunus Duzeltmesi

### Sorun
Ekran goruntusunde goruldugu gibi, Power/Damage upgrade butonlari ile BATTLE/Reset butonlari arasindaki pozisyon kaymis. Bunun iki sebebi var:

1. **Save version 15'ten 16'ya atlayinca tum ilerleme silindi** — Foam-to-Brew rename sirasinda `SAVE_VERSION` arttirildi ama eski save'i donusturecek migration kodu yazilmadi. Oyuncu sifirdan baslamis gibi gorunuyor (0 coin, 0 cargo box).

2. **Cart (araba) alt UI'nin ustune biniyor** — `GROUND_Y_OFFSET: 180` degeri ile cart, Power/Damage tile'larinin oldugu alana iniyor. Bu yuzden butonlar birbirine karisiyor.

### Cozum

#### 1. Save Migration (persistence.ts)
`loadProgression()` fonksiyonunda version mismatch kontrolunden once v15 save'leri tespit edip v16'ya donustur:
- `foamPerBox` alanini `brewPerBox` olarak rename et
- `version`'i 16 yap ve kaydet
- Boylece oyuncunun coin'leri, upgrade'leri ve ilerlemesi korunur

#### 2. Layout Duzeltmesi (config.ts)
- `GROUND_Y_OFFSET`: 180 --> 220 (cart'i yukari tasir, alt butonlarla cakismayi onler)
- `UI_SAFE_BOTTOM_PX`: 160 --> 200 (uyumlu kalsin)

#### 3. Renderer parametre temizligi (renderer.ts)
- `hasFoam` parametresini `hasBrew` olarak guncelle (zaten config'te BREW_ olarak degistirildi ama fonksiyon imzasinda kalmis olabilir)

---

### Teknik Detaylar

**persistence.ts** - `loadProgression()` icinde su ekleme yapilacak:
```text
if (parsed.version === 15) {
  // v15 -> v16 migration: rename foamPerBox -> brewPerBox
  parsed.brewPerBox = parsed.foamPerBox || [false, false, false];
  delete parsed.foamPerBox;
  parsed.version = 16;
  saveProgression(parsed);
  return { ...DEFAULT_PROGRESSION, ...parsed };
}
```

**config.ts** - Iki sabit degisecek:
```text
GROUND_Y_OFFSET: 180 -> 220
UI_SAFE_BOTTOM_PX: 160 -> 200
```

**renderer.ts** - Fonksiyon imzasindaki `hasFoam`/`foamBoxIndex` parametreleri `hasBrew`/`brewBoxIndex` olarak guncellenecek (tutarlilik icin).

Bu uc degisiklik sonrasi garage'da cart yukari oturacak, alt butonlar duzgun siralanacak ve eski save verileri korunacak.

