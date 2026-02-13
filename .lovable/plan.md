

# Gate 2 Hızlandırma + Banner Bug Fix

## Sorun Analizi

Gate 2'nin 57 saniye surmesinin asil sebebi kodda gate'e atesi aktif olarak engelleyen iki mekanizma:

1. **Gate Pressure Limiter** (satir 1330-1336): Gate'e toplam atis orani %8'i gectiginde, silahi zorla "front" moduna aliyor. Yani gate'e ne kadar cok vurursan, o kadar az vurmana izin veriyor. Bu tamamen ters etki yapiyor.

2. **Dusuk gate hedefleme agirliklari**: Normal durumda gate sansı %8, crowded durumda %5. Dusman varken gate neredeyse hic hedeflenmiyor.

3. **Banner bug**: useEffect cleanup'i playPhase her degistiginde (VICTORY -> BREATHER) timeout'u iptal ediyor, banner hic kaybolmuyor.

## Degisiklikler

### Dosya 1: `src/game/CoffeeRushGame.tsx`

**1. Gate Pressure Limiter'i kaldir (satir 1330-1336)**
Bu 7 satirlik blogu tamamen sil. Gate'e atis oranini yapay olarak kisitlayan bu mekanizma gate gecis suresini uzatiyor.

**2. Gate hedefleme agirliklarini artir**
Bu degisiklik config.ts'de yapilacak (asagida).

### Dosya 2: `src/game/config.ts`

**Gate targeting weight'lerini artir:**
- `TARGET_WEIGHTS_CROWDED`: `[0.70, 0.20, 0.05, 0.05]` --> `[0.55, 0.20, 0.05, 0.20]`
- `TARGET_WEIGHTS_NORMAL`: `[0.50, 0.25, 0.17, 0.08]` --> `[0.40, 0.20, 0.15, 0.25]`

Gate hedefleme sansi: crowded'da %5'ten %20'ye, normal'de %8'den %25'e cikar. Boylece dusman varken bile silah gate'e daha sik ates eder.

### Dosya 3: `src/game/GameHUD.tsx`

**Banner timeout fix (satir 36-44)**
Mevcut useEffect'te cleanup fonksiyonu playPhase her degistiginde timeout'u iptal ediyor. Cozum: cleanup'ta timeout'u iptal etme, sadece yeni VICTORY tetiklendiginde eski timeout'u temizle.

Mevcut:
```
return () => { if (gateClearedTimerRef.current) clearTimeout(gateClearedTimerRef.current); };
```

Yeni: Cleanup satirini kaldir. Timeout zaten satir 39'da yeni VICTORY'de temizleniyor, component unmount icin ayri ref cleanup yeterli.

## Beklenen Etki
- Gate'e giden atis orani %8'den ~%20-25'e cikacak
- Pressure limiter kalktigi icin gate hasari birikmesi engellenmeyecek
- 57s olan Gate 2 suresi tahminen 25-35s'e inecek
- Banner 2 saniye sonra duzenli kaybolacak

## Teknik Detay
3 dosya, toplam ~10 satir degisiklik.

