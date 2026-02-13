

# Star Throw: Gate Yokken Kullanımı Engelle

## Problem
5 Star Throw'dan sadece 2'si gate'e isabet etti (160 hasar). Diger 3'u TRAVEL veya BREATHER fazinda atildi, bu fazlarda gate binasi bulunmuyor. Dolayisiyla mermi bos ucuyor ve power israf ediliyor.

Not: Throw hiz/omur ayarlari sorun degil. Mermi zaten ekranin sonuna kadar uciyor (lifetime kodu aslinda aktif degil). Sorun, gate olmadigi anda atilan throwlar.

## Cozum
Star Throw butonunu sadece SIEGE fazinda (gate varken) aktif yapmak. Boylece her throw kesinlikle gate'e vurur.

## Teknik Detay

### Dosya: `src/game/CoffeeRushGame.tsx`

**1. `canUseSaw` kosuluna faz kontrolu ekle (~satir 1735)**

Mevcut:
```
canUseSaw={hasSawRef.current && powerRef.current >= GAME_CONFIG.SAW_THROW_COST}
```

Yeni:
```
canUseSaw={hasSawRef.current && powerRef.current >= GAME_CONFIG.SAW_THROW_COST && playPhase === 'SIEGE'}
```

**2. `handleSawThrow` fonksiyonuna da guvenlik kontrolu ekle (~satir 753)**

Fonksiyonun basina ekle:
```
if (playPhaseRef.current !== 'SIEGE') return;
```

Bu sayede buton hem deaktif gorunur hem de klavye/hizli tiklama ile bypass edilemez.

## Beklenen Etki
- Her Star Throw kesinlikle gate'e isabet eder (SIEGE fazinda gate her zaman mevcut)
- Power israfi sifirlanir
- 5 throw x 80 hasar = 400 hasar gate'e (simdi sadece 160)
- Gate 2 (450 HP) neredeyse sadece Star Throw ile kirilebilir hale gelir

## Ek Not
`SAW_THROW_LIFETIME` config degeri kodda hic kullanilmiyor. Ileride temizlenebilir ama simdilik islevsel bir etkisi yok.

