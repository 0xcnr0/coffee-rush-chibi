import { GAME_CONFIG, COLORS } from './config';
import type { CartBlock, Enemy, EnemyKind, Projectile, TipDrop, Particle, DifficultyState, BossState } from './types';

export function drawGame(
  ctx: CanvasRenderingContext2D,
  blocks: CartBlock[],
  enemies: Enemy[],
  projectiles: Projectile[],
  tips: TipDrop[],
  particles: Particle[],
  difficulty: DifficultyState,
  screenShake: { x: number; y: number },
  bossState?: BossState,
  bossIncomingTimer?: number
) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  
  // Apply screen shake
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);
  
  // Draw background
  drawBackground(ctx);
  
  // Draw ground
  drawGround(ctx);
  
  // Draw cart blocks
  drawCart(ctx, blocks);
  
  // Draw barista on top
  drawBarista(ctx, blocks);
  
  // Draw enemies
  enemies.forEach(enemy => drawEnemy(ctx, enemy));
  
  // Draw projectiles
  projectiles.forEach(proj => drawProjectile(ctx, proj));
  
  // Draw particles
  particles.forEach(particle => drawParticle(ctx, particle));
  
  // Draw tip drops
  tips.forEach(tip => drawTip(ctx, tip));
  
  // Draw morning rush indicator and edge glow
  if (difficulty.isMorningRush && !bossState?.isActive) {
    drawRushEdgeGlow(ctx);
    drawRushIndicator(ctx);
  }
  
  // Phase 2B-2: Boss UI
  if (bossIncomingTimer && bossIncomingTimer > 0) {
    drawBossIncomingBanner(ctx);
  }
  
  if (bossState?.isActive) {
    drawBossEdgeGlow(ctx);
    drawBossHpBar(ctx, bossState);
  }
  
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
  gradient.addColorStop(0, 'hsl(30, 40%, 70%)'); // warm morning sky
  gradient.addColorStop(0.6, 'hsl(35, 50%, 80%)');
  gradient.addColorStop(1, 'hsl(40, 60%, 85%)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  
  // Draw some simple clouds
  ctx.fillStyle = 'hsla(0, 0%, 100%, 0.6)';
  drawCloud(ctx, 50, 80, 40);
  drawCloud(ctx, 200, 50, 30);
  drawCloud(ctx, 300, 100, 35);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D) {
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - 80;
  
  // Street/sidewalk
  ctx.fillStyle = COLORS.darkRoast;
  ctx.fillRect(0, groundY, GAME_CONFIG.CANVAS_WIDTH, 80);
  
  // Sidewalk line
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, groundY, GAME_CONFIG.CANVAS_WIDTH, 4);
}

function drawCart(ctx: CanvasRenderingContext2D, blocks: CartBlock[]) {
  const activeBlocks = blocks.filter(b => !b.destroyed);
  const { CART_X, CART_WIDTH, BLOCK_HEIGHT } = GAME_CONFIG;
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - 80;
  
  // Draw wheels
  const wheelY = groundY - 15;
  ctx.fillStyle = COLORS.espresso;
  ctx.beginPath();
  ctx.arc(CART_X + 20, wheelY, 15, 0, Math.PI * 2);
  ctx.arc(CART_X + CART_WIDTH - 20, wheelY, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw wheel centers
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.arc(CART_X + 20, wheelY, 5, 0, Math.PI * 2);
  ctx.arc(CART_X + CART_WIDTH - 20, wheelY, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw each active block
  activeBlocks.forEach((block, index) => {
    const blockY = groundY - 30 - (index + 1) * BLOCK_HEIGHT;
    
    // Phase 1.7: Block 0 is the chassis (thin bar), others are cargo boxes
    if (block.id === 0) {
      // CHASSIS - thin metallic bar
      const chassisHeight = Math.floor(BLOCK_HEIGHT * 0.4); // 40% of normal height
      const chassisY = groundY - 30 - chassisHeight; // Positioned at base
      
      // Chassis body (dark metallic)
      ctx.fillStyle = 'hsl(25, 30%, 18%)'; // Dark brown-gray
      ctx.beginPath();
      roundRect(ctx, CART_X - 3, chassisY, CART_WIDTH + 6, chassisHeight, 4);
      ctx.fill();
      
      // Chassis highlight (metallic shine)
      ctx.fillStyle = 'hsla(30, 20%, 40%, 0.4)';
      ctx.fillRect(CART_X, chassisY + 2, CART_WIDTH, 4);
      
      // HP bar for chassis
      const hpBarWidth = CART_WIDTH - 10;
      const hpBarHeight = 4;
      const hpBarX = CART_X + 5;
      const hpBarY = chassisY + chassisHeight - 8;
      
      ctx.fillStyle = COLORS.hpBarBg;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth, hpBarHeight, 2);
      ctx.fill();
      
      const hpPercent = block.hp / block.maxHp;
      ctx.fillStyle = hpPercent > 0.3 ? COLORS.energyBar : COLORS.hpBar;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 2);
      ctx.fill();
    } else {
      // CARGO BOX - normal box visual (stacks above chassis)
      const colors = [COLORS.darkRoast, COLORS.mediumRoast, COLORS.lightRoast];
      
      // Block body
      ctx.fillStyle = colors[block.id] || COLORS.mediumRoast;
      ctx.beginPath();
      roundRect(ctx, CART_X, blockY, CART_WIDTH, BLOCK_HEIGHT - 4, 8);
      ctx.fill();
      
      // Block highlight
      ctx.fillStyle = 'hsla(0, 0%, 100%, 0.2)';
      ctx.fillRect(CART_X + 5, blockY + 5, CART_WIDTH - 10, 8);
      
      // HP bar background
      const hpBarWidth = CART_WIDTH - 20;
      const hpBarHeight = 6;
      const hpBarX = CART_X + 10;
      const hpBarY = blockY + BLOCK_HEIGHT - 15;
      
      ctx.fillStyle = COLORS.hpBarBg;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth, hpBarHeight, 3);
      ctx.fill();
      
      // HP bar fill
      const hpPercent = block.hp / block.maxHp;
      ctx.fillStyle = hpPercent > 0.3 ? COLORS.energyBar : COLORS.hpBar;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 3);
      ctx.fill();
    }
  });
}

function drawBarista(ctx: CanvasRenderingContext2D, blocks: CartBlock[]) {
  const activeBlocks = blocks.filter(b => !b.destroyed);
  if (activeBlocks.length === 0) return;
  
  const { CART_X, CART_WIDTH, BLOCK_HEIGHT } = GAME_CONFIG;
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - 80;
  
  // Phase 1.7: Calculate barista position based on block structure
  // Block 0 is chassis (40% height), blocks 1+ are cargo boxes
  const chassisHeight = Math.floor(BLOCK_HEIGHT * 0.4);
  const cargoBlockCount = activeBlocks.filter(b => b.id > 0).length;
  const topY = groundY - 30 - chassisHeight - (cargoBlockCount * BLOCK_HEIGHT);
  
  const baristaX = CART_X + CART_WIDTH / 2;
  const baristaY = topY - 25;
  
  // Body
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.arc(baristaX, baristaY, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat (coffee cup style)
  ctx.fillStyle = COLORS.warmOrange;
  ctx.beginPath();
  ctx.moveTo(baristaX - 12, baristaY - 10);
  ctx.lineTo(baristaX + 12, baristaY - 10);
  ctx.lineTo(baristaX + 8, baristaY - 25);
  ctx.lineTo(baristaX - 8, baristaY - 25);
  ctx.closePath();
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = COLORS.espresso;
  ctx.beginPath();
  ctx.arc(baristaX - 5, baristaY - 2, 3, 0, Math.PI * 2);
  ctx.arc(baristaX + 5, baristaY - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Smile
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(baristaX, baristaY + 2, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { x, y, width, height, isServed, hp, maxHp, state, kind } = enemy;
  
  // Calculate shake for latched enemies (more for boss)
  const isLatched = state === 'LATCHED';
  const shakeIntensity = kind === 'BOSS' ? 4 : 2;
  const shakeX = isLatched ? Math.sin(Date.now() / 50) * shakeIntensity : 0;
  const shakeY = isLatched ? Math.cos(Date.now() / 70) * (shakeIntensity * 0.5) : 0;
  
  const drawX = x + shakeX;
  const drawY = y + shakeY;
  
  // Phase 2B-1/2: Enemy type visual adjustments
  const isHeavy = kind === 'HEAVY';
  const isBoss = kind === 'BOSS';
  
  if (isServed || state === 'SERVED') {
    // Happy served customer - colorful!
    ctx.fillStyle = isBoss ? 'hsl(50, 90%, 55%)' : isHeavy ? 'hsl(40, 70%, 55%)' : COLORS.awake;
    
    // Body
    ctx.beginPath();
    roundRect(ctx, drawX - width/2, drawY - height, width, height, isBoss ? 15 : 10);
    ctx.fill();
    
    // Happy face
    ctx.fillStyle = COLORS.espresso;
    ctx.beginPath();
    const eyeSize = isBoss ? 6 : 4;
    ctx.arc(drawX - (isBoss ? 12 : 8), drawY - height + 20, eyeSize, 0, Math.PI * 2);
    ctx.arc(drawX + (isBoss ? 12 : 8), drawY - height + 20, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Big smile
    ctx.strokeStyle = COLORS.espresso;
    ctx.lineWidth = isBoss ? 4 : 3;
    ctx.beginPath();
    ctx.arc(drawX, drawY - height + 30, isBoss ? 15 : 10, 0.3, Math.PI - 0.3);
    ctx.stroke();
    
    // Coffee cup in hand (bigger for boss)
    ctx.fillStyle = COLORS.foam;
    ctx.fillRect(drawX + width/2 - (isBoss ? 8 : 5), drawY - height + 25, isBoss ? 18 : 12, isBoss ? 22 : 15);
    ctx.fillStyle = COLORS.mediumRoast;
    ctx.fillRect(drawX + width/2 - (isBoss ? 5 : 3), drawY - height + 27, isBoss ? 12 : 8, isBoss ? 12 : 8);
    
    // Boss crown on served
    if (isBoss) {
      ctx.fillStyle = 'hsl(45, 100%, 50%)';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('👑', drawX - 12, drawY - height - 5);
    }
    
  } else if (isLatched) {
    // LATCHED enemy - angry/attacking (red tint, darker for heavy/boss)
    if (isBoss) {
      ctx.fillStyle = 'hsl(0, 70%, 30%)';
    } else if (isHeavy) {
      ctx.fillStyle = 'hsl(0, 60%, 40%)';
    } else {
      ctx.fillStyle = 'hsl(0, 50%, 55%)';
    }
    
    // Body
    ctx.beginPath();
    roundRect(ctx, drawX - width/2, drawY - height, width, height, isBoss ? 15 : 10);
    ctx.fill();
    
    // Boss crown
    if (isBoss) {
      ctx.fillStyle = 'hsl(0, 80%, 50%)';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('👑', drawX - 14, drawY - height - 20);
    } else if (isHeavy) {
      // Heavy badge
      ctx.fillStyle = 'hsl(45, 90%, 55%)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('⚠️', drawX - 10, drawY - height - 18);
    }
    
    // Angry eyes
    const eyeColor = isBoss ? 'hsl(0, 90%, 20%)' : isHeavy ? 'hsl(0, 80%, 20%)' : 'hsl(0, 70%, 30%)';
    const eyeRadius = isBoss ? 8 : isHeavy ? 6 : 5;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(drawX - (isBoss ? 12 : 8), drawY - height + 20, eyeRadius, 0, Math.PI * 2);
    ctx.arc(drawX + (isBoss ? 12 : 8), drawY - height + 20, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = isBoss ? 4 : isHeavy ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(drawX - (isBoss ? 20 : 14), drawY - height + 12);
    ctx.lineTo(drawX - 4, drawY - height + 16);
    ctx.moveTo(drawX + (isBoss ? 20 : 14), drawY - height + 12);
    ctx.lineTo(drawX + 4, drawY - height + 16);
    ctx.stroke();
    
    // Aggressive mouth
    ctx.beginPath();
    ctx.arc(drawX, drawY - height + 38, isBoss ? 10 : 6, Math.PI + 0.5, -0.5);
    ctx.stroke();
    
    // Exclamation marks
    ctx.fillStyle = isBoss ? 'hsl(0, 100%, 50%)' : isHeavy ? 'hsl(0, 90%, 45%)' : 'hsl(0, 80%, 50%)';
    ctx.font = `bold ${isBoss ? 20 : 16}px sans-serif`;
    ctx.fillText(isBoss ? '!!!' : isHeavy ? '!!' : '!', drawX - (isBoss ? 15 : isHeavy ? 8 : 4), drawY - height - 5);
    
    // HP indicator (not for boss - has separate HP bar)
    if (!isBoss) {
      const hpPercent = hp / maxHp;
      if (hpPercent < 1) {
        const barWidth = width - 10;
        ctx.fillStyle = COLORS.hpBarBg;
        ctx.fillRect(drawX - barWidth/2, drawY - height - 16, barWidth, isHeavy ? 6 : 4);
        ctx.fillStyle = isHeavy ? 'hsl(25, 80%, 50%)' : 'hsl(0, 70%, 55%)';
        ctx.fillRect(drawX - barWidth/2, drawY - height - 16, barWidth * hpPercent, isHeavy ? 6 : 4);
      }
    }
    
  } else {
    // Sleepy customer (WALKING or QUEUED) - desaturated
    const isQueued = state === 'QUEUED';
    if (isBoss) {
      ctx.fillStyle = isQueued ? 'hsl(220, 25%, 35%)' : 'hsl(220, 20%, 40%)';
    } else if (isHeavy) {
      ctx.fillStyle = isQueued ? 'hsl(220, 20%, 45%)' : 'hsl(220, 15%, 50%)';
    } else {
      ctx.fillStyle = isQueued ? 'hsl(220, 15%, 55%)' : COLORS.sleepy;
    }
    
    // Body
    ctx.beginPath();
    roundRect(ctx, drawX - width/2, drawY - height, width, height, isBoss ? 15 : 10);
    ctx.fill();
    
    // Boss crown (sleepy)
    if (isBoss) {
      ctx.fillStyle = 'hsl(220, 40%, 60%)';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('👑', drawX - 14, drawY - height - 8);
    } else if (isHeavy) {
      // Heavy badge for walking/queued
      ctx.fillStyle = 'hsl(220, 40%, 70%)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚠️', drawX - 8, drawY - height - 5);
    }
    
    // Tired eyes (closed lines)
    ctx.strokeStyle = isBoss ? 'hsl(220, 20%, 20%)' : isHeavy ? 'hsl(220, 15%, 30%)' : 'hsl(220, 10%, 40%)';
    ctx.lineWidth = isBoss ? 4 : isHeavy ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(drawX - (isBoss ? 16 : 12), drawY - height + 20);
    ctx.lineTo(drawX - 4, drawY - height + 20);
    ctx.moveTo(drawX + 4, drawY - height + 20);
    ctx.lineTo(drawX + (isBoss ? 16 : 12), drawY - height + 20);
    ctx.stroke();
    
    // Frown
    ctx.beginPath();
    ctx.arc(drawX, drawY - height + 38, isBoss ? 12 : 8, Math.PI + 0.3, -0.3);
    ctx.stroke();
    
    // Zzz icon (only for walking normal enemies)
    if (!isQueued && !isHeavy && !isBoss) {
      ctx.fillStyle = 'hsl(220, 30%, 70%)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('💤', drawX - 8, drawY - height - 5);
    }
    
    // HP indicator (not for boss)
    if (!isBoss) {
      const hpPercent = hp / maxHp;
      if (hpPercent < 1) {
        const barWidth = width - 10;
        ctx.fillStyle = COLORS.hpBarBg;
        ctx.fillRect(drawX - barWidth/2, drawY - height - 12, barWidth, isHeavy ? 6 : 4);
        ctx.fillStyle = isHeavy ? 'hsl(25, 70%, 50%)' : COLORS.hpBar;
        ctx.fillRect(drawX - barWidth/2, drawY - height - 12, barWidth * hpPercent, isHeavy ? 6 : 4);
      }
    }
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  const { x, y, radius } = proj;
  
  // Coffee cup projectile
  ctx.fillStyle = COLORS.foam;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Coffee inside
  ctx.fillStyle = COLORS.mediumRoast;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  // Steam trail
  ctx.fillStyle = 'hsla(0, 0%, 100%, 0.5)';
  ctx.beginPath();
  ctx.arc(x - 8, y - 3, 4, 0, Math.PI * 2);
  ctx.arc(x - 14, y + 2, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  const alpha = particle.life / particle.maxLife;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  switch (particle.type) {
    case 'sparkle':
      ctx.fillStyle = COLORS.sparkle;
      drawStar(ctx, particle.x, particle.y, 4, particle.size, particle.size * 0.5);
      break;
    case 'heart':
      ctx.fillStyle = COLORS.heart;
      ctx.font = `${particle.size * 2}px sans-serif`;
      ctx.fillText('❤️', particle.x - particle.size, particle.y);
      break;
    case 'steam':
      ctx.fillStyle = COLORS.steam;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'confetti':
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size * 1.5);
      break;
  }
  
  ctx.restore();
}

function drawTip(ctx: CanvasRenderingContext2D, tip: TipDrop) {
  ctx.save();
  ctx.globalAlpha = tip.opacity;
  
  // Gold coin
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Coin shine
  ctx.fillStyle = 'hsla(50, 100%, 80%, 0.6)';
  ctx.beginPath();
  ctx.arc(tip.x - 3, tip.y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // $ symbol
  ctx.fillStyle = COLORS.espresso;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', tip.x, tip.y);
  
  ctx.restore();
}

function drawRushIndicator(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = 'hsla(25, 80%, 55%, 0.4)';
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, 50);
  
  ctx.fillStyle = COLORS.warmOrange;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('☕ MORNING RUSH! ☕', GAME_CONFIG.CANVAS_WIDTH / 2, 32);
  ctx.restore();
}

function drawRushEdgeGlow(ctx: CanvasRenderingContext2D) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  
  // Create radial gradient for edge glow
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.35,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.7
  );
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, 'hsla(25, 80%, 55%, 0.15)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Phase 2B-2: Boss UI functions
function drawBossIncomingBanner(ctx: CanvasRenderingContext2D) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  
  ctx.save();
  
  // Dark overlay
  ctx.fillStyle = 'hsla(0, 0%, 0%, 0.4)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 60, CANVAS_WIDTH, 120);
  
  // Banner background
  ctx.fillStyle = 'hsla(0, 70%, 40%, 0.9)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 40, CANVAS_WIDTH, 80);
  
  // Text
  ctx.fillStyle = 'hsl(45, 100%, 60%)';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☕ BOSS INCOMING! ☕', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Subtitle
  ctx.fillStyle = 'hsl(0, 0%, 95%)';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Prepare your Tonic Bombs!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  
  ctx.restore();
}

function drawBossEdgeGlow(ctx: CanvasRenderingContext2D) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  
  // Create pulsing red edge glow
  const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.2;
  
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.7
  );
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, `hsla(0, 80%, 45%, ${pulse})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawBossHpBar(ctx: CanvasRenderingContext2D, bossState: BossState) {
  const { CANVAS_WIDTH } = GAME_CONFIG;
  
  ctx.save();
  
  // Background bar
  const barWidth = CANVAS_WIDTH - 40;
  const barHeight = 16;
  const barX = 20;
  const barY = 55;
  
  ctx.fillStyle = 'hsla(0, 0%, 0%, 0.7)';
  roundRect(ctx, barX - 2, barY - 2, barWidth + 4, barHeight + 4, 6);
  ctx.fill();
  
  // HP bar background
  ctx.fillStyle = 'hsl(0, 30%, 25%)';
  roundRect(ctx, barX, barY, barWidth, barHeight, 4);
  ctx.fill();
  
  // HP bar fill
  const hpPercent = Math.max(0, bossState.hp / bossState.maxHp);
  const hpColor = hpPercent > 0.5 ? 'hsl(0, 70%, 50%)' : hpPercent > 0.25 ? 'hsl(30, 80%, 50%)' : 'hsl(45, 90%, 55%)';
  ctx.fillStyle = hpColor;
  roundRect(ctx, barX, barY, barWidth * hpPercent, barHeight, 4);
  ctx.fill();
  
  // Boss label
  ctx.fillStyle = 'hsl(45, 100%, 60%)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('👑 BOSS 👑', CANVAS_WIDTH / 2, barY - 4);
  
  // HP text
  ctx.fillStyle = 'hsl(0, 0%, 100%)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${bossState.hp} / ${bossState.maxHp}`, CANVAS_WIDTH / 2, barY + barHeight / 2);
  
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
