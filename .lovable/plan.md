

## Dort Duzeltme: Star Gorseli + Brew Rengi Maviye Cevir

### 1. Yildiz Gorseli Geri Getir

**Dosya:** `src/game/renderer.ts`

`drawStarZone` fonksiyonundan sadece donen yildiz sprite kodunu (satir 198-218 civari) ayri bir `drawStarSprite` fonksiyonuna tasi. Mavi seffaf daire cizimi kaldirilmis olarak kalsin. Ana `drawGame` fonksiyonunda `if (hasStar) drawStarSprite(ctx, blocks);` cagrisini ekle.

### 2. Brew Efektlerini Maviye Cevir

Uc ayri yerde renk degisikligi yapilacak, hepsi `src/game/renderer.ts` icinde:

**a) Foam Zone Beam (satir 257):**
- Mevcut: `hsl(38, 65%, 85%)` (krem/beyaz)
- Yeni: `hsl(200, 70%, 75%)` (acik mavi)

**b) Foam Zone Arc (satir 273):**
- Mevcut: `hsl(38, 65%, 80%)`
- Yeni: `hsl(200, 65%, 70%)`

**c) Foam Particles - Outer glow (satir 306):**
- Mevcut: `hsla(38, 50%, 90%, ...)`
- Yeni: `hsla(200, 55%, 85%, ...)`

**d) Foam Particles - Main blob (satir 311):**
- Mevcut: `hsl(40, 45-70%, 86-94%)`
- Yeni: `hsl(200, 50-70%, 80-90%)`

**e) Brew Projectile - Outer glow (satir 555):**
- Mevcut: `hsla(38, 55%, 88%, 0.5)`
- Yeni: `hsla(200, 60%, 80%, 0.5)`

**f) Brew Projectile - Main blob (satir 560):**
- Mevcut: `hsl(40, 60%, 90%)`
- Yeni: `hsl(200, 65%, 75%)`

**g) Brew Projectile - Inner highlight (satir 565):**
- Mevcut: `hsl(45, 50%, 97%)`
- Yeni: `hsl(200, 40%, 92%)`

### 3. Diger Degerler

Gate HP, spawn degerleri, Brew mekanikleri, Star mekanikleri, config sabitleri degismez. Sadece `renderer.ts` dosyasinda gorsel degisiklikler yapilir.

### Teknik Ozet

**Tek dosya:** `src/game/renderer.ts`
- `drawStarSprite` fonksiyonu olustur (daire olmadan sadece donen yildiz)
- 7 renk degeri krem/beyazdan maviye cevrilir
- Baska dosyaya dokunulmaz

