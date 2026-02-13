

# RunSummaryOverlay'e Star Throw Telemetri Verisi Ekleme

## Problem
Star throw hasarı `sawTelemetryRef` ile dogru sekilde kaydediliyor ancak RunSummaryOverlay (kopyalanabilen dev paneli) bu verileri gostermiyor. Gate hasar dagiliminda sadece "bullets" ve "bomb" var, star throw ayri gorunmuyor.

## Degisiklikler

### Dosya: `src/game/RunSummaryOverlay.tsx`

**1. Gate Breakdown'da star throw hasarini ayir (Bolum 2)**
- Mevcut: `[bullets: X, bomb: Y]`
- Yeni: `[bullets: X, bomb: Y, star: Z]`
- `bulletDmg = dealt - bombDmg - starDmg` olarak hesaplanacak

**2. Bolum 3'e Star Throw istatistikleri ekle**
- Star Throw Uses (kac kez atildi)
- Star Throw Damage to Enemies
- Star Throw Damage to Gate

**3. Bolum 4'e Star Throw bilgisi ekle**
- "Bomb Uses" satirinin yanina "Star Throws: X" ekle

## Teknik Detaylar

Telemetride zaten mevcut olan veriler:
- `t.sawThrowUses` - kac kez atildi
- `t.sawThrowDamageToEnemies` - dusmanlara verilen hasar
- `t.sawThrowDamageToGate` - gate'e verilen hasar
- `t.sawPassiveDamageDealt` - pasif alan hasari

Gate basina star throw hasari icin per-gate breakdown mevcut degil (sadece toplam var). Gate breakdown'da toplam star throw gate hasarini gosterecegiz, per-gate ayrimini ise mevcut `gateDamageDealt` ve `bombGateDamage` farkindan cikaracagiz.

Tek dosya degisikligi: `src/game/RunSummaryOverlay.tsx`

