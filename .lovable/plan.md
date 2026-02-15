

# Fix: Brew Box Origin + Destroy-on-Box-Death

## Problem Summary

Two bugs are causing Brew to misbehave:

1. **Wrong box lookup (off-by-one)**: The code looks for `block.id === foamBoxIndex + 1`, but blocks are created with `id: i` (0-indexed). So if Brew is on box 0, it searches for block id 1 (the wrong box). This is why Brew appears to fire from the wrong position.

2. **Brew keeps firing after its box is destroyed**: Neither the passive cannon nor the burst checks whether the equipped box has been destroyed. Star has the same gap, but the user specifically wants Brew to stop when its box dies.

## Changes

### File 1: `src/game/CoffeeRushGame.tsx`

**A) Fix block ID lookup in passive cannon (line 1516)**
- Change `b.id === foamBoxIndexRef.current + 1` to `b.id === foamBoxIndexRef.current`

**B) Stop foam when equipped box is destroyed (line 1506)**
- Before the existing `if (hasFoamRef.current)` passive block, add a runtime check:
  - Look up the foam block: `blocksRef.current.find(b => b.id === foamBoxIndexRef.current)`
  - If that block is destroyed (`block.destroyed === true`), set `hasFoamRef.current = false` and skip all foam logic
- This ensures both passive firing and burst button disable when the box dies

**C) Add same guard to `handleFoamBurst` (line 821-822)**
- After the `if (!hasFoamRef.current) return;` check, also verify the equipped block is not destroyed
- If destroyed, return early (no burst)

### File 2: `src/game/renderer.ts`

**A) Fix block ID lookup in drawFoamZone (line 235)**
- Change `b.id === foamBoxIndex + 1` to `b.id === foamBoxIndex`

**B) If the foam block is destroyed, skip drawing the foam zone entirely**
- The existing `if (!foamBlock)` fallback draws at a default Y — instead, return early when the specific block is destroyed

## What This Fixes

- Brew passive cannon will originate from the correct box (the one you purchased it on)
- When that box's HP hits 0, Brew stops firing and the burst button becomes unusable
- Visual foam zone also anchors to the correct box and disappears when it dies

## NOT Touched
- Gate HP, spawn logic, travel durations, Star mechanics, EVO system, economy values
