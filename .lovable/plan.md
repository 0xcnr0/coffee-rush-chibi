

# TDS-Style Panic System + ChatGPT Guardrails

## Overview
Transform enemy-cart interaction from "instant disappear" to "latched tick damage" system that creates visible panic buildup. This is the single most impactful change for TDS-like feel.

---

## Phase 1: Type System Updates

### `src/game/types.ts`
Add new fields to Enemy interface:
```typescript
export interface Enemy {
  // ... existing fields
  state: 'WALKING' | 'LATCHED' | 'QUEUED' | 'SERVED';
  latchedTimer: number;     // time until next tick damage
  queuePosition: number;    // X position when queued (behind latched enemies)
}
```

Add breather to DifficultyState:
```typescript
export interface DifficultyState {
  // ... existing fields
  breatherTimer: number;    // post-rush spawn pause
}
```

---

## Phase 2: Config Constants

### `src/game/config.ts`
Add latched/breather system constants:
```typescript
// LATCHED ENEMY SYSTEM (TDS-style panic)
MAX_LATCHED_ENEMIES: 5,        // normal max attackers
RUSH_LATCHED_BONUS: 2,         // extra slots during Rush (total 7)
LATCHED_TICK_INTERVAL: 0.5,    // seconds between damage ticks
LATCHED_TICK_DAMAGE: 4,        // damage per tick (stacks with multiple)
LATCHED_QUEUE_SPACING: 8,      // pixels between queued enemies

// BREATHER (post-rush pause)
BREATHER_DURATION: 2,          // seconds of no spawns after Rush
```

---

## Phase 3: Game Logic Changes

### `src/game/CoffeeRushGame.tsx`

**A) Track latched count:**
```typescript
const latchedCountRef = useRef(0);
```

**B) Update createEnemy factory:**
```typescript
const createEnemy = (id: number): Enemy => ({
  // ... existing
  state: 'WALKING',
  latchedTimer: 0,
  queuePosition: 0,
});
```

**C) New enemy update logic (replace lines 506-561):**

```typescript
// Calculate max latched slots
const maxLatched = difficulty.isMorningRush 
  ? GAME_CONFIG.MAX_LATCHED_ENEMIES + GAME_CONFIG.RUSH_LATCHED_BONUS
  : GAME_CONFIG.MAX_LATCHED_ENEMIES;

enemyPool.getActive().forEach(enemy => {
  // SERVED state (existing happy exit logic)
  if (enemy.state === 'SERVED') {
    enemy.servedTimer -= deltaTime;
    enemy.x += GAME_CONFIG.SERVED_EXIT_SPEED * deltaTime;
    if (enemy.servedTimer <= 0 || enemy.x > GAME_CONFIG.CANVAS_WIDTH + 50) {
      enemyPool.release(enemy);
    }
    return;
  }
  
  // Check if just served (HP <= 0)
  if (enemy.hp <= 0 && enemy.state !== 'SERVED') {
    // Was latched? Decrement count
    if (enemy.state === 'LATCHED') {
      latchedCountRef.current--;
    }
    
    enemy.state = 'SERVED';
    enemy.isServed = true;
    enemy.servedTimer = GAME_CONFIG.SERVED_EXIT_DURATION;
    customersServedRef.current++;
    
    spawnTip(enemy.x, enemy.y - enemy.height);
    spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'heart', 3);
    spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', 5);
    return;
  }
  
  // LATCHED state - tick damage
  if (enemy.state === 'LATCHED') {
    enemy.latchedTimer -= deltaTime;
    
    if (enemy.latchedTimer <= 0 && activeBlocks.length > 0) {
      // Deal tick damage to lowest block
      const lowestBlock = activeBlocks[0];
      lowestBlock.hp -= GAME_CONFIG.LATCHED_TICK_DAMAGE;
      enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
      
      // Small damage particles
      spawnParticles(lowestBlock.y, enemy.y, 'steam', 2);
      
      // Check block destruction
      if (lowestBlock.hp <= 0) {
        lowestBlock.destroyed = true;
        spawnParticles(CART_X + CART_WIDTH / 2, lowestBlock.y, 'steam', 15);
        
        // Check game over
        if (blocks.filter(b => !b.destroyed).length === 0) {
          handleGameOver();
        }
      }
    }
    return;
  }
  
  // QUEUED state - wait for latched slot
  if (enemy.state === 'QUEUED') {
    // Check if slot opened
    if (latchedCountRef.current < maxLatched) {
      enemy.state = 'LATCHED';
      enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
      enemy.x = cartRightEdge + enemy.width / 2; // snap to cart
      latchedCountRef.current++;
    }
    return;
  }
  
  // WALKING state - move toward cart
  const rushSpeedMultiplier = difficulty.isMorningRush ? GAME_CONFIG.RUSH_SPEED_MULTIPLIER : 1;
  enemy.x -= enemy.speed * rushSpeedMultiplier * deltaTime;
  
  // Check if reached cart edge
  if (enemy.x - enemy.width / 2 < cartRightEdge) {
    if (latchedCountRef.current < maxLatched) {
      // Become latched
      enemy.state = 'LATCHED';
      enemy.latchedTimer = GAME_CONFIG.LATCHED_TICK_INTERVAL;
      enemy.x = cartRightEdge + enemy.width / 2;
      latchedCountRef.current++;
    } else {
      // Queue behind - stop at queue position
      enemy.state = 'QUEUED';
      const queueIndex = /* count queued enemies */ 0;
      enemy.queuePosition = cartRightEdge + enemy.width / 2 + (queueIndex + 1) * GAME_CONFIG.LATCHED_QUEUE_SPACING;
      enemy.x = enemy.queuePosition;
    }
  }
});
```

**D) Breather logic (post-rush spawn pause):**
```typescript
// When Rush ends
if (difficulty.isMorningRush && difficulty.rushTimer <= 0) {
  difficulty.isMorningRush = false;
  difficulty.breatherTimer = GAME_CONFIG.BREATHER_DURATION;
}

// Block spawning during breather
if (difficulty.breatherTimer > 0) {
  difficulty.breatherTimer -= deltaTime;
} else {
  // Normal spawn logic
}
```

**E) Tonic Bomb clears latched enemies (satisfaction!):**
```typescript
enemyPool.getActive().forEach(enemy => {
  if (enemy.state === 'SERVED') return;
  
  const dx = enemy.x - bombX;
  const dy = (enemy.y - enemy.height / 2) - bombY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < GAME_CONFIG.TONIC_BOMB_RADIUS) {
    enemy.hp -= GAME_CONFIG.TONIC_BOMB_DAMAGE;
    spawnParticles(enemy.x, enemy.y - enemy.height / 2, 'sparkle', 3);
    
    // If killed and was latched, decrement count
    if (enemy.hp <= 0 && enemy.state === 'LATCHED') {
      latchedCountRef.current--;
    }
  }
});
```

---

## Phase 4: Visual Updates

### `src/game/renderer.ts`

**Latched enemy visual (angry/attacking):**
```typescript
function drawEnemy(ctx, enemy) {
  if (enemy.state === 'LATCHED') {
    // Red tint overlay
    ctx.fillStyle = 'hsl(0, 60%, 50%)';
    // Slight shake animation
    const shake = Math.sin(Date.now() / 50) * 2;
    // Draw with offset
  }
  // ... existing draw logic
}
```

**Rush edge glow:**
```typescript
if (difficulty.isMorningRush) {
  const gradient = ctx.createRadialGradient(...);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, 'hsla(25, 80%, 55%, 0.15)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
```

---

## Phase 5: HUD Updates

### `src/game/GameHUD.tsx`
**Checkpoint progress bar (6 segments, 30s each):**
```typescript
const CHECKPOINT_INTERVAL = 30;
const TOTAL_CHECKPOINTS = 6;
const currentCheckpoint = Math.floor(timeSurvived / CHECKPOINT_INTERVAL);
const progress = (timeSurvived % CHECKPOINT_INTERVAL) / CHECKPOINT_INTERVAL;

// Render 6-segment bar at top
```

### `src/game/EndScreen.tsx`
Add checkpoints cleared to stats display.

### `src/game/DebugHUD.tsx`
Add latched info:
```typescript
Latched: {latchedCount}/{maxLatched}
Breather: {breatherTimer.toFixed(1)}s
```

---

## Phase 6: Persistence Reset

### `src/game/persistence.ts`
Bump version to force reset:
```typescript
const SAVE_VERSION = 3;
```

---

## Balance Targets

| Scenario | Target Survival |
|----------|-----------------|
| No upgrades | 45-75 seconds |
| First Rush (20s) | Survivable but stressful |
| Lv9 upgrades | 90-150 seconds |
| Never infinite | Ramp always wins eventually |

---

## Files to Modify

1. `src/game/types.ts` - Add state, latchedTimer, queuePosition, breatherTimer
2. `src/game/config.ts` - Add latched/breather constants
3. `src/game/CoffeeRushGame.tsx` - Complete enemy state machine rewrite
4. `src/game/renderer.ts` - Latched visuals, Rush glow
5. `src/game/GameHUD.tsx` - Checkpoint bar
6. `src/game/EndScreen.tsx` - Show checkpoints
7. `src/game/DebugHUD.tsx` - Latched count display
8. `src/game/persistence.ts` - Bump SAVE_VERSION to 3

---

## Test Checklist (No Video Needed)

After implementation, verify:
1. Latched count builds up to 5 (7 during Rush)?
2. Tick damage visible in Debug HUD?
3. Tonic Bomb clears latched enemies (relief feeling)?
4. Breather pause (2s) after Rush ends?
5. Checkpoint bar fills correctly?
6. No double-damage bug (old collision + tick)?

