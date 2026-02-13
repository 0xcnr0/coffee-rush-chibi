

# Stage 3 Olum Duvari - Uygulama

## Degisiklikler (1 dosya, 3 bolge)

### `src/game/config.ts`

**1. Stage 3 dusman parametreleri (satir 30):**
```
spawnInterval: 700 --> 500
enemyHpMult: 1.7 --> 2.2
enemySpeedMult: 1.10 --> 1.25
heavyEvery: 8 --> 5
```

**2. Breather spawn orani (satir 110):**
```
BREATHER_SPAWN_REDUCTION: 0.40 --> 0.60
```

**3. Mini-Rush config (satir 280-284):**
```
DURATION: 4.0 --> 5.0
SPAWN_MULT: 0.5 --> 0.35
START_RATIO: 0.4 --> 0.25
```

## Fallback (kullanicinin belirttigi)
Eger 2 kasa + 1 star ile de gecilemezse:
- `heavyEvery`: 5 --> 6
- `BREATHER_SPAWN_REDUCTION`: 0.60 --> 0.55

