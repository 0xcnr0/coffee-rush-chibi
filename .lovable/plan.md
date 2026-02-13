

# S2 Travel Suresi Kisaltma (Tek Degisiklik)

## Yaklasim
Sadece S2 travel suresini 14s'den 4s'ye dusur. Gate 2 HP'ye dokunma. Olc, sonra karar ver.

## Degisiklik

### Dosya: `src/game/config.ts`

**TRAVEL_DURATION_BY_STAGE dizisi (satir ~273):**
```
// Onceki:
export const TRAVEL_DURATION_BY_STAGE = [10, 14, 16, 18, 20] as const;

// Sonrasi:
export const TRAVEL_DURATION_BY_STAGE = [10, 4, 16, 18, 20] as const;
```

Yorum guncellenir:
```
// Per-stage travel duration (seconds) — Stage 1: 10s runner, Stage 2: 4s quick transit, Stage 3+: death-wall travel
```

## Dokunulmayan Degerler
- Gate 2 HP: 450 (degismez)
- Stage 1-2 spawn/hpMult/spdMult: degismez
- Stage 3+ config: degismez
- GATE_HP_RATIOS: degismez

## Beklenen Sonuc

| Faz | Onceki | Sonrasi |
|-----|--------|---------|
| S1 toplam | 35s | 35s |
| S2 travel | 14-15s | 4s |
| S2 siege | 32-41s | 32-41s (degismez) |
| S2 breather | 4s | 4s |
| **S1+S2 toplam** | **87-90s** | **~75s** |

S2 siege hala uzun olacak ama travel'dan 10s kazanc net gorunecek. Telemetri ile olcup HP icin ikinci adima geceriz.

