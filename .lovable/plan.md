

## Stage 3 TRAVEL Mini-Rush Suresi Kisaltmasi

### Degisiklik
`src/game/config.ts` dosyasinda tek bir deger degisecek:

```
MINI_RUSH_CONFIG.DURATION: 5.0 → 2.5
```

### Etki
- Mini-Rush spike'i 5 saniyeden 2.5 saniyeye iner
- Spawn interval, yogunluk (SPAWN_MULT: 0.35), baslangic zamani (START_RATIO: 0.25) ve SIEGE davranisi aynen kalir
- Stage 3 TRAVEL'da toplam spawn sayisi azalir cunku yogun faz yariya duser
- Oyuncunun Gate3'e ulasma sansi artar

### Teknik Detay

**Dosya:** `src/game/config.ts` (satir ~188)

Mevcut:
```
DURATION: 5.0,
```

Yeni:
```
DURATION: 2.5,
```

Tek sabit, tek dosya. Baska hicbir seye dokunulmayacak.

