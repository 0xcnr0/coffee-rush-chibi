import { GAME_CONFIG, COLORS } from './config';
import type { CartBlock, Enemy, Projectile, TipDrop, Particle, DifficultyState } from './types';

export function drawGame(
  ctx: CanvasRenderingContext2D,
  blocks: CartBlock[],
  enemies: Enemy[],
  projectiles: Projectile[],
  tips: TipDrop[],
  particles: Particle[],
  difficulty: DifficultyState,
  screenShake: { x: number; y: number }
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
  if (difficulty.isMorningRush) {
    drawRushEdgeGlow(ctx);
    drawRushIndicator(ctx);
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
  const { x, y, width, height, isServed, hp, maxHp, state } = enemy;
  
  // Calculate shake for latched enemies
  const isLatched = state === 'LATCHED';
  const shakeX = isLatched ? Math.sin(Date.now() / 50) * 2 : 0;
  const shakeY = isLatched ? Math.cos(Date.now() / 70) * 1 : 0;
  
  const drawX = x + shakeX;
  const drawY = y + shakeY;
  
  if (isServed || state === 'SERVED') {
    // Happy served customer - colorful!
    ctx.fillStyle = COLORS.awake;
    
    // Body
    ctx.beginPath();
    roundRect(ctx, drawX - width/2, drawY - height, width, height, 10);
    ctx.fill();
    
    // Happy face
    ctx.fillStyle = COLORS.espresso;
    ctx.beginPath();
    ctx.arc(drawX - 8, drawY - height + 20, 4, 0, Math.PI * 2);
    ctx.arc(drawX + 8, drawY - height + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Big smile
    ctx.strokeStyle = COLORS.espresso;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(drawX, drawY - height + 30, 10, 0.3, Math.PI - 0.3);
    ctx.stroke();
    
    // Coffee cup in hand
    ctx.fillStyle = COLORS.foam;
    ctx.fillRect(drawX + width/2 - 5, drawY - height + 25, 12, 15);
    ctx.fillStyle = COLORS.mediumRoast;
    ctx.fillRect(drawX + width/2 - 3, drawY - height + 27, 8, 8);
    
  } else if (isLatched) {
    // LATCHED enemy - angry/attacking, red tint
    ctx.fillStyle = 'hsl(0, 50%, 55%)'; // Red tint
    
    // Body
    ctx.beginPath();
    roundRect(ctx, drawX - width/2, drawY - height, width, height, 10);
    ctx.fill();
    
    // Angry eyes (open, aggressive)
    ctx.fillStyle = 'hsl(0, 70%, 30%)';
    ctx.beginPath();
    ctx.arc(drawX - 8, drawY - height + 20, 5, 0, Math.PI * 2);
    ctx.arc(drawX + 8, drawY - height + 20, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.strokeStyle = 'hsl(0, 70%, 30%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX - 14, drawY - height + 12);
    ctx.lineTo(drawX - 4, drawY - height + 16);
    ctx.moveTo(drawX + 14, drawY - height + 12);
    ctx.lineTo(drawX + 4, drawY - height + 16);
    ctx.stroke();
    
    // Aggressive mouth
    ctx.beginPath();
    ctx.arc(drawX, drawY - height + 38, 6, Math.PI + 0.5, -0.5);
    ctx.stroke();
    
    // Exclamation mark
    ctx.fillStyle = 'hsl(0, 80%, 50%)';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('!', drawX - 4, drawY - height - 5);
    
    // HP indicator
    const hpPercent = hp / maxHp;
    if (hpPercent < 1) {
      const barWidth = width - 10;
      ctx.fillStyle = COLORS.hpBarBg;
      ctx.fillRect(drawX - barWidth/2, drawY - height - 16, barWidth, 4);
      ctx.fillStyle = 'hsl(0, 70%, 55%)';
      ctx.fillRect(drawX - barWidth/2, drawY - height - 16, barWidth * hpPercent, 4);
    }
    
  } else {
    // Sleepy customer (WALKING or QUEUED) - desaturated
    const isQueued = state === 'QUEUED';
    ctx.fillStyle = isQueued ? 'hsl(220, 15%, 55%)' : COLORS.sleepy;
    
    // Body
    ctx.beginPath();
    roundRect(ctx, drawX - width/2, drawY - height, width, height, 10);
    ctx.fill();
    
    // Tired eyes (closed lines)
    ctx.strokeStyle = 'hsl(220, 10%, 40%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX - 12, drawY - height + 20);
    ctx.lineTo(drawX - 4, drawY - height + 20);
    ctx.moveTo(drawX + 4, drawY - height + 20);
    ctx.lineTo(drawX + 12, drawY - height + 20);
    ctx.stroke();
    
    // Frown
    ctx.beginPath();
    ctx.arc(drawX, drawY - height + 38, 8, Math.PI + 0.3, -0.3);
    ctx.stroke();
    
    // Zzz icon (only for walking, not queued)
    if (!isQueued) {
      ctx.fillStyle = 'hsl(220, 30%, 70%)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('💤', drawX - 8, drawY - height - 5);
    }
    
    // HP indicator (small bar above)
    const hpPercent = hp / maxHp;
    if (hpPercent < 1) {
      const barWidth = width - 10;
      ctx.fillStyle = COLORS.hpBarBg;
      ctx.fillRect(drawX - barWidth/2, drawY - height - 12, barWidth, 4);
      ctx.fillStyle = COLORS.hpBar;
      ctx.fillRect(drawX - barWidth/2, drawY - height - 12, barWidth * hpPercent, 4);
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
