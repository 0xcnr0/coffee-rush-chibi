

# Coffee Rush: The Caffeine Engine - UPDATED Plan (Endless Survival)

## Key Change: From Timed Run → Endless Survival

**Before**: 90-second fixed timer, survive to win
**After**: No timer - survive as long as possible until cart is destroyed

---

## Core Game Loop (Unchanged)

**The Coffee Cart (Your Tower)**
- 3 vertically stacked blocks on the left side
- Each block has its own HP bar
- Chibi barista sits on top (decorative)
- When a block's HP reaches 0, it collapses - game ends when ALL blocks are destroyed

**Sleepy Customers (Enemies)**
- Spawn from right, walk left toward cart
- Gray/desaturated with "Zzz" icon
- Damage the lowest remaining block when they reach cart
- Transform to happy & colorful when served (HP=0), then exit

**Auto-Attack: Espresso Shot**
- Targets nearest customer at fixed fire rate
- Coffee cup/steam puff projectiles
- Sparkles/hearts on impact

**Tonic Bomb (Manual Skill)**
- Costs 2 energy, AoE burst near cart
- Screen shake + confetti/steam VFX

---

## NEW: Endless Survival System

**No Fixed Timer**
- Game runs indefinitely until cart is destroyed
- Top bar shows elapsed time (MM:SS format) instead of progress

**Difficulty Ramp (Every 30 Seconds)**
- Spawn rate increases by ~10%
- Enemy HP increases by ~6%
- Enemy speed increases by ~3% (subtle)
- Changes are cumulative but gentle

**Morning Rush (Every 30 Seconds)**
- Temporary spawn rate multiplier (1.8x) for 6-8 seconds
- UI indicator pulses/glows to warn player
- Returns to normal ramped difficulty after Rush ends

**Performance Safeguards**
- Hard cap: maximum 30 active enemies on screen
- If cap reached, spawning pauses until enemies are cleared
- Object pooling for all projectiles and enemies
- Efficient collision detection

---

## Game Flow

**Menu Screen**
- Game title "Coffee Rush: The Caffeine Engine"
- "Play" button to start

**Gameplay HUD**
- Top left: Time Survived (MM:SS)
- Top right: Tip Counter
- Bottom: Energy bar + Tonic Bomb button
- Cart blocks show HP bars
- Morning Rush indicator when active

**End Screen (When Cart Destroyed)**
- **Primary Score: Time Survived** (large, prominent)
- Customers Served count
- Total Tips collected
- "Play Again" button
- Shareable format: "I survived 4:12 and served 128 customers ☕️"

---

## Visual Style (Unchanged)

- Clean vector-like shapes with warm coffee palette
- Browns, creams, warm oranges
- Non-violent feedback: sparkles, hearts, happy transformations
- Morning Rush: subtle UI glow/pulse indicator

---

## Technical Architecture

**Performance Optimized for Mobile**
- requestAnimationFrame game loop
- Object pooling (enemies + projectiles)
- 30 enemy hard cap with spawn throttling
- Stable 60fps target

**Clean Code Structure**
- Separate systems: Spawner, Combat, UI, Effects, DifficultyManager
- State machine: MENU → PLAY → END
- Easy difficulty tuning via config constants

