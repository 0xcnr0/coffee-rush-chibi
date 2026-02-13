

# Muzzle Pozisyonunu Yukari Alma

## Mevcut Durum
- `groundY` = 640 - 180 = **460px**
- Tek blokla `topBlock.y` = 460 - 30 - 45 = **385px**
- `MUZZLE_Y_OFFSET: 75` ile muzzle pozisyonu = 385 + 75 = **460px** (tam yer seviyesi!)
- Gate binasi: ust kenar **300px**, alt kenar **460px**
- Sonuc: Mermiler yerden atildigi icin gate'in alt kenarini ancak sikiyorlar, ust kismi hic hedeflenmiyor

## Degisiklik

### Dosya: `src/game/config.ts`

**MUZZLE_Y_OFFSET: 75 --> 20**

Yeni muzzle pozisyonu = 385 + 20 = **405px** (sasi hizasi, gate'in ortasina dogru atis yapilir)

Kasa alindikca topBlock.y yukari cikar (340, 295...), muzzle otomatik olarak daha da yukari tasinir. Boylece upgrade'li oyuncular gate'in ustune dogru bile ates edebilir.

## Beklenen Etki
- Mermiler gate'in alt ucundan degil, ortalarindan gecmeye baslar
- Shotgun spread'i gate'in daha genis bir alanini kaplar (isabet artar)
- Kasa upgrade'leri ile muzzle dogal olarak yukari cikar, progresyon hissi verir
- Gate 2 gecis suresi daha da kisalir

## Teknik Detay
1 dosya, 1 satir degisiklik.

