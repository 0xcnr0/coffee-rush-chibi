

# Stage 1 Gate HP + Enemy HP Geri Al + Star Throw Ayarı

## Degisiklikler

### 1. Stage 1 enemyHpMult: 0.8 -> 1.0 (geri al)
Dusmanlar tekrar normal canlarinda olacak.

### 2. Stage 1 gateHP: 350 -> 300
Gate daha hizli yikilacak, kuşatma suresi kisalacak.

### 3. Star Throw Damage: 5 -> 35
- Stage 1 enemy HP = 32 (base 32 x 1.0 mult)
- 35 hasar ile normal dusmanlari tek atar
- Gate'e de ayni 35 hasar verir
- Stage 2+ dusmanlar (HP 42+) tek olmaz, dengeyi korur

## Teknik Detaylar

Tek dosya: `src/game/config.ts`

- STAGES[0].enemyHpMult: 0.8 -> 1.0
- STAGES[0].gateHP: 350 -> 300
- SAW_THROW_DAMAGE: 5 -> 35
- GATE_HP_RATIOS[0] ayni kalir (1.0), diger oranlar Gate1=300 baz alinarak guncellenir: [1.0, 2.67, 6.67, 11.67, 16.67]

