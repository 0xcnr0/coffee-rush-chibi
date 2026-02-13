

# Gate 2 Hizlandirma: HP Dusurme + Star Throw Buff

## Problem
Gate 2'yi gecmek 88.5 saniye suruyor. Star Throw'un 6 atistan sadece 2'si gate'e isabet ediyor (dusuk hiz ve kisa omur nedeniyle). Toplam gate hasari yeterli ama cok yavas birikiyor.

## Degisiklikler

### Dosya: `src/game/config.ts`

**1. Gate 2 HP dusur**
- `STAGES[1].gateHP`: 650 --> 450
- Daha az hasar gerekecek, ~40-50s civarinda gecilebilir hale gelir

**2. Star Throw hiz ve omur artir**
- `SAW_THROW_SPEED`: 200 --> 260 px/s (daha hizli ucarak gate'e ulasma sansi artar)
- `SAW_THROW_LIFETIME`: 0.7 --> 0.9 saniye (daha uzaga gider, gate'e isabet penceresi genisler)
- Menzil artisi: 200*0.7 = 140px --> 260*0.9 = 234px (~%67 daha fazla menzil)

## Beklenen Etki
- Gate 2 HP 450 ile: mevcut ~7.4 DPS'de ~60s civarinda gecilebilir
- Star Throw'un gate isabet orani artacak (234px menzil ile gate'e daha sik ulasir)
- Kombinasyon ile hedef: Gate 2'yi ~40-50s'de gecmek

## Teknik Detay
Tek dosya degisikligi: `src/game/config.ts`, 3 satir.

