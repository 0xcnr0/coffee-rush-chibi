

# Balance Fix: Run 1 Too Short (13s vs Target 25-35s)

## Problem

BLOCK_MAX_HP (180) + LATCHED_TICK_DAMAGE (5) + EARLY_GAME_SECONDS (15) combined to make Run 1 last only 13 seconds. Players never see the first rush and earn too few coins (8-12) to buy anything.

## Fix: 3 Parameter Changes in config.ts

| Parameter | Current | New | Why |
|-----------|---------|-----|-----|
| `BLOCK_MAX_HP` | 180 | 300 | More HP buffer. Player feels overwhelmed by enemies, not fragile. |
| `LATCHED_TICK_DAMAGE` | 5 | 4 | Revert to previous value. 5 was too aggressive combined with lower HP. |
| `EARLY_GAME_SECONDS` | 15 | 18 | Rush arrives a bit later, giving player time to experience the game before dying. |

## Expected Run 1 (0 upgrades, 1 block, 300 HP)

- 0-18s: Warmup spawns (1100ms interval), enemies latch gradually
- ~12-15s: 5 latched enemies reached
- DPS at 5 latched: 5 x 4 / 0.5 = 40 DPS
- 300 HP / 40 = 7.5s at max latch
- Total survival: ~25-30s
- Kills: ~20-25 enemies = 40-50 coins
- Can buy: 1 cargo box (30 coins) + small savings

## Files Changed

| File | Change |
|------|--------|
| `config.ts` | 3 values: BLOCK_MAX_HP, LATCHED_TICK_DAMAGE, EARLY_GAME_SECONDS |

