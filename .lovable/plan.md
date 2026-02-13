

# Star Throw Hasarini Artirma

## Problem
Gate 2'yi gectik ama 77.5 saniye surdu. Star throw pierce oldugu icin hem dusmanlari hem gate'i vuruyor, ancak 6 atisdan sadece 3'u gate'e isabet etti (travel sirasinda atilan diger 3 bos gecti). Mevcut 50 hasar ile gate'e toplam 150 hasar yapildi.

## Cozum
`SAW_THROW_DAMAGE` degerini 50'den 80'e cikarmak. Bu sayede:
- Her gate isabeti 50 yerine 80 hasar verir
- 3 gate isabeti = 240 hasar (su anki 150 yerine)
- Dusmanlara da daha etkili olur, lane temizligi hizlanir
- Baska mekanik degismiyor

## Teknik Detay

### Dosya: `src/game/config.ts`
- `SAW_THROW_DAMAGE`: 50 → 80

Tek satirlik degisiklik, baska dosya etkilenmiyor.
