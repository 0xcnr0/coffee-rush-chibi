import { GAME_CONFIG, COLORS } from './config';
import type { CartBlock, Enemy, Projectile, TipDrop, Particle, BossState, PlayPhase, GateBuilding } from './types';

// Parallax state
let parallaxOffset1 = 0;
let parallaxOffset2 = 0;
let wheelRotation = 0;
let starRotation = 0;

export function drawGame(
  ctx: CanvasRenderingContext2D,
  blocks: CartBlock[],
  enemies: Enemy[],
  projectiles: Projectile[],
  tips: TipDrop[],
  particles: Particle[],
  screenShake: { x: number; y: number },
  bossState?: BossState,
  bossIncomingTimer?: number,
  playPhase?: PlayPhase,
  deltaTime?: number,
  gateBuilding?: GateBuilding | null,
  currentTime?: number,
  hasSaw?: boolean,
) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  const isTraveling = playPhase === 'TRAVEL' || playPhase === 'BREATHER';
  const isApproaching = playPhase === 'APPROACH';
  
  // Star always spins
  if (deltaTime) {
    starRotation += 3 * deltaTime;
  }
  
  if (isTraveling && deltaTime) {
    parallaxOffset1 = (parallaxOffset1 + 30 * deltaTime) % 120;
    parallaxOffset2 = (parallaxOffset2 + 80 * deltaTime) % 60;
    wheelRotation += 8 * deltaTime;
  } else if (isApproaching && deltaTime) {
    parallaxOffset1 = (parallaxOffset1 + 15 * deltaTime) % 120;
    parallaxOffset2 = (parallaxOffset2 + 40 * deltaTime) % 60;
    wheelRotation += 4 * deltaTime;
  }
  
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);
  
  drawBackground(ctx, isTraveling || isApproaching);
  drawGround(ctx, isTraveling || isApproaching);
  
  // Draw gate building (before enemies so enemies appear in front)
  if (gateBuilding && !gateBuilding.isDestroyed) {
    drawGateBuilding(ctx, gateBuilding, currentTime);
  }
  
  drawCart(ctx, blocks, isTraveling || isApproaching);
  drawBarista(ctx, blocks);
  
  // Draw passive star zone (only if unlocked)
  if (hasSaw) drawStarZone(ctx, blocks);
  
  enemies.forEach(enemy => drawEnemy(ctx, enemy));
  projectiles.forEach(proj => drawProjectile(ctx, proj));
  particles.forEach(particle => drawParticle(ctx, particle));
  tips.forEach(tip => drawTip(ctx, tip));
  
  if (bossIncomingTimer && bossIncomingTimer > 0) {
    drawBossIncomingBanner(ctx);
  }
  if (bossState?.isActive) {
    drawBossEdgeGlow(ctx);
    drawBossHpBar(ctx, bossState);
  }
  
  // Debug: state label overlay
  if (playPhase) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(playPhase, 8, 14);
  }
  
  ctx.restore();
}
export function drawMenuScene(ctx: CanvasRenderingContext2D, blockCount: number) {
  const { CANVAS_HEIGHT, BLOCK_HEIGHT, BLOCK_MAX_HP } = GAME_CONFIG;
  drawBackground(ctx);
  drawGround(ctx);
  const groundY = CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
  const blocks: CartBlock[] = Array.from({ length: blockCount }, (_, i) => ({
    id: i, hp: BLOCK_MAX_HP, maxHp: BLOCK_MAX_HP,
    y: groundY - 30 - (i + 1) * BLOCK_HEIGHT,
    height: BLOCK_HEIGHT, destroyed: false,
  }));
  drawCart(ctx, blocks);
  drawBarista(ctx, blocks);
}

// ═══════════════════════════════════════════════════════════════════════
// GATE BUILDING
// ═══════════════════════════════════════════════════════════════════════
function drawGateBuilding(ctx: CanvasRenderingContext2D, gate: GateBuilding, currentTime?: number) {
  const hpPercent = gate.hp / gate.maxHp;
  
  // Building body (gets redder as HP drops)
  const r = Math.floor(140 + (1 - hpPercent) * 60);
  const g = Math.floor(60 - (1 - hpPercent) * 30);
  const b = Math.floor(50 - (1 - hpPercent) * 20);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  roundRect(ctx, gate.x, gate.y, gate.width, gate.height, 6);
  ctx.fill();
  
  // Hit flash effect
  if (currentTime !== undefined && gate.lastHitTime && (currentTime - gate.lastHitTime) < 0.15) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    roundRect(ctx, gate.x, gate.y, gate.width, gate.height, 6);
    ctx.fill();
  }
  
  // Stage number
  ctx.fillStyle = 'hsla(0, 0%, 100%, 0.8)';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`G${gate.stageIndex}`, gate.x + gate.width / 2, gate.y + gate.height / 2 - 10);
  
  // Cracks (more cracks as HP drops)
  if (hpPercent < 0.75) {
    ctx.strokeStyle = 'hsla(0, 0%, 20%, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gate.x + 10, gate.y + 20);
    ctx.lineTo(gate.x + gate.width / 2, gate.y + gate.height / 3);
    ctx.stroke();
  }
  if (hpPercent < 0.50) {
    ctx.beginPath();
    ctx.moveTo(gate.x + gate.width - 10, gate.y + 10);
    ctx.lineTo(gate.x + gate.width / 2, gate.y + gate.height / 2);
    ctx.stroke();
  }
  if (hpPercent < 0.25) {
    ctx.beginPath();
    ctx.moveTo(gate.x + 15, gate.y + gate.height - 15);
    ctx.lineTo(gate.x + gate.width - 15, gate.y + 15);
    ctx.stroke();
  }
  
  // HP bar above building
  const barWidth = gate.width + 10;
  const barHeight = 6;
  const barX = gate.x - 5;
  const barY = gate.y - 12;
  
  ctx.fillStyle = COLORS.hpBarBg;
  roundRect(ctx, barX, barY, barWidth, barHeight, 3);
  ctx.fill();
  
  ctx.fillStyle = hpPercent > 0.5 ? 'hsl(0, 70%, 50%)' : hpPercent > 0.25 ? 'hsl(30, 80%, 50%)' : 'hsl(45, 90%, 55%)';
  roundRect(ctx, barX, barY, barWidth * hpPercent, barHeight, 3);
  ctx.fill();
  
  // HP text
  ctx.fillStyle = 'hsl(0, 0%, 100%)';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${gate.hp}`, gate.x + gate.width / 2, barY - 3);
  
  // Breathing indicator
  if (gate.breathingActive) {
    ctx.fillStyle = 'hsla(145, 60%, 45%, 0.3)';
    ctx.beginPath();
    ctx.arc(gate.x + gate.width / 2, gate.y - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'hsl(145, 60%, 45%)';
    ctx.font = '10px sans-serif';
    ctx.fillText('💨', gate.x + gate.width / 2 - 5, gate.y - 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PASSIVE STAR ZONE (visual)
// ═══════════════════════════════════════════════════════════════════════
function drawStarZone(ctx: CanvasRenderingContext2D, blocks: CartBlock[]) {
  const activeBlocks = blocks.filter(b => !b.destroyed);
  if (activeBlocks.length === 0) return;
  
  const sawCenterX = GAME_CONFIG.CART_X + GAME_CONFIG.CART_WIDTH + GAME_CONFIG.STAR_PASSIVE_RADIUS * 0.5;
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
  const sawCenterY = groundY - 60;
  const radius = GAME_CONFIG.STAR_PASSIVE_RADIUS;
  
  // Faint danger zone circle
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = 'hsl(200, 60%, 50%)';
  ctx.beginPath();
  ctx.arc(sawCenterX, sawCenterY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Rotating star (5-pointed, blue, spins like wheels)
  ctx.save();
  ctx.translate(sawCenterX, sawCenterY);
  ctx.rotate(starRotation);
  const starRadius = 18;
  const innerRadius = 8;
  const points = 5;
  ctx.fillStyle = 'hsla(200, 50%, 60%, 0.7)';
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? starRadius : innerRadius;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  // Center dot
  ctx.fillStyle = 'hsla(200, 40%, 40%, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════
// BACKGROUND, GROUND, CART, BARISTA (preserved from old renderer)
// ═══════════════════════════════════════════════════════════════════════
function drawBackground(ctx: CanvasRenderingContext2D, isTraveling = false) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
  gradient.addColorStop(0, 'hsl(30, 40%, 70%)');
  gradient.addColorStop(0.6, 'hsl(35, 50%, 80%)');
  gradient.addColorStop(1, 'hsl(40, 60%, 85%)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  
  ctx.fillStyle = 'hsla(0, 0%, 100%, 0.6)';
  const cloudOffset = isTraveling ? parallaxOffset1 : 0;
  drawCloud(ctx, (50 + cloudOffset) % (GAME_CONFIG.CANVAS_WIDTH + 80) - 40, 80, 40);
  drawCloud(ctx, (200 + cloudOffset * 0.7) % (GAME_CONFIG.CANVAS_WIDTH + 60) - 30, 50, 30);
  drawCloud(ctx, (300 + cloudOffset * 0.5) % (GAME_CONFIG.CANVAS_WIDTH + 70) - 35, 100, 35);
  
  if (isTraveling) {
    ctx.fillStyle = 'hsla(35, 40%, 70%, 0.15)';
    for (let i = 0; i < 5; i++) {
      const streakX = ((i * 80 + parallaxOffset2 * 3) % (GAME_CONFIG.CANVAS_WIDTH + 40)) - 20;
      const streakY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET - 30 - (i * 15);
      ctx.fillRect(streakX, streakY, 35, 3);
    }
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, isTraveling = false) {
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
  ctx.fillStyle = COLORS.darkRoast;
  ctx.fillRect(0, groundY, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.GROUND_Y_OFFSET);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, groundY, GAME_CONFIG.CANVAS_WIDTH, 4);
  
  if (isTraveling) {
    ctx.fillStyle = 'hsla(40, 50%, 80%, 0.4)';
    for (let i = 0; i < 6; i++) {
      const lineX = ((i * 70 + parallaxOffset2 * 4) % (GAME_CONFIG.CANVAS_WIDTH + 50)) - 25;
      ctx.fillRect(lineX, groundY + 20 + (i * 12), 40, 2);
    }
  }
}

function drawCart(ctx: CanvasRenderingContext2D, blocks: CartBlock[], isTraveling = false) {
  const activeBlocks = blocks.filter(b => !b.destroyed).sort((a, b) => a.id - b.id);
  const { CART_X, CART_WIDTH, BLOCK_HEIGHT } = GAME_CONFIG;
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
  
  const wheelY = groundY - 15;
  ctx.fillStyle = COLORS.espresso;
  
  [CART_X + 20, CART_X + CART_WIDTH - 20].forEach(wx => {
    ctx.save();
    ctx.translate(wx, wheelY);
    ctx.rotate(isTraveling ? wheelRotation : 0);
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.cream;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    if (isTraveling) {
      ctx.strokeStyle = COLORS.cream; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
      ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = COLORS.espresso;
  });
  
  const chassisHeight = Math.floor(BLOCK_HEIGHT * 0.4);
  const chassisY = groundY - 30 - chassisHeight;
  const boxHeight = BLOCK_HEIGHT - 4;
  
  activeBlocks.forEach((block) => {
    if (block.id === 0) {
      ctx.fillStyle = 'hsl(25, 30%, 18%)';
      ctx.beginPath(); roundRect(ctx, CART_X - 3, chassisY, CART_WIDTH + 6, chassisHeight, 4); ctx.fill();
      ctx.fillStyle = 'hsla(30, 20%, 40%, 0.4)';
      ctx.fillRect(CART_X, chassisY + 2, CART_WIDTH, 4);
      const hpBarWidth = CART_WIDTH - 10, hpBarHeight = 4;
      const hpBarX = CART_X + 5, hpBarY = chassisY + chassisHeight - 8;
      ctx.fillStyle = COLORS.hpBarBg;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth, hpBarHeight, 2); ctx.fill();
      const hpPercent = block.hp / block.maxHp;
      ctx.fillStyle = hpPercent > 0.3 ? COLORS.energyBar : COLORS.hpBar;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 2); ctx.fill();
    } else {
      const boxIndex = block.id - 1;
      const blockY = chassisY - (boxIndex + 1) * boxHeight;
      const colors = [COLORS.darkRoast, COLORS.mediumRoast, COLORS.lightRoast];
      ctx.fillStyle = colors[block.id] || COLORS.mediumRoast;
      ctx.beginPath(); roundRect(ctx, CART_X, blockY, CART_WIDTH, boxHeight, 8); ctx.fill();
      ctx.fillStyle = 'hsla(0, 0%, 100%, 0.2)';
      ctx.fillRect(CART_X + 5, blockY + 5, CART_WIDTH - 10, 8);
      const hpBarWidth = CART_WIDTH - 20, hpBarHeight = 6;
      const hpBarX = CART_X + 10, hpBarY = blockY + boxHeight - 11;
      ctx.fillStyle = COLORS.hpBarBg;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth, hpBarHeight, 3); ctx.fill();
      const hpPercent = block.hp / block.maxHp;
      ctx.fillStyle = hpPercent > 0.3 ? COLORS.energyBar : COLORS.hpBar;
      roundRect(ctx, hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 3); ctx.fill();
    }
  });
}

function drawBarista(ctx: CanvasRenderingContext2D, blocks: CartBlock[]) {
  const activeBlocks = blocks.filter(b => !b.destroyed);
  if (activeBlocks.length === 0) return;
  const { CART_X, CART_WIDTH, BLOCK_HEIGHT } = GAME_CONFIG;
  const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y_OFFSET;
  const chassisHeight = Math.floor(BLOCK_HEIGHT * 0.4);
  const chassisY = groundY - 30 - chassisHeight;
  const boxHeight = BLOCK_HEIGHT - 4;
  const cargoBlockCount = activeBlocks.filter(b => b.id > 0).length;
  const topY = chassisY - (cargoBlockCount * boxHeight);
  const baristaX = CART_X + CART_WIDTH / 2;
  const baristaY = topY - 25;
  
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath(); ctx.arc(baristaX, baristaY, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.warmOrange;
  ctx.beginPath();
  ctx.moveTo(baristaX - 12, baristaY - 10); ctx.lineTo(baristaX + 12, baristaY - 10);
  ctx.lineTo(baristaX + 8, baristaY - 25); ctx.lineTo(baristaX - 8, baristaY - 25);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = COLORS.espresso;
  ctx.beginPath();
  ctx.arc(baristaX - 5, baristaY - 2, 3, 0, Math.PI * 2);
  ctx.arc(baristaX + 5, baristaY - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(baristaX, baristaY + 2, 6, 0.2, Math.PI - 0.2); ctx.stroke();
}

// ═══════════════════════════════════════════════════════════════════════
// ENEMY, PROJECTILE, PARTICLE, TIP (preserved with saw projectile VFX)
// ═══════════════════════════════════════════════════════════════════════
function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { x, y, width, height, isServed, hp, maxHp, state, kind } = enemy;
  const isLatched = state === 'LATCHED';
  const shakeIntensity = kind === 'BOSS' ? 4 : 2;
  const shakeX = isLatched ? Math.sin(Date.now() / 50) * shakeIntensity : 0;
  const shakeY = isLatched ? Math.cos(Date.now() / 70) * (shakeIntensity * 0.5) : 0;
  const drawX = x + shakeX, drawY = y + shakeY;
  const isHeavy = kind === 'HEAVY', isBoss = kind === 'BOSS';
  
  if (isServed || state === 'SERVED') {
    ctx.fillStyle = isBoss ? 'hsl(50, 90%, 55%)' : isHeavy ? 'hsl(40, 70%, 55%)' : COLORS.awake;
    ctx.beginPath(); roundRect(ctx, drawX - width/2, drawY - height, width, height, isBoss ? 15 : 10); ctx.fill();
    ctx.fillStyle = COLORS.espresso;
    ctx.beginPath();
    ctx.arc(drawX - (isBoss ? 12 : 8), drawY - height + 20, isBoss ? 6 : 4, 0, Math.PI * 2);
    ctx.arc(drawX + (isBoss ? 12 : 8), drawY - height + 20, isBoss ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.espresso; ctx.lineWidth = isBoss ? 4 : 3;
    ctx.beginPath(); ctx.arc(drawX, drawY - height + 30, isBoss ? 15 : 10, 0.3, Math.PI - 0.3); ctx.stroke();
    if (isBoss) { ctx.font = 'bold 20px sans-serif'; ctx.fillText('👑', drawX - 12, drawY - height - 5); }
  } else if (isLatched) {
    ctx.fillStyle = isBoss ? 'hsl(0, 70%, 30%)' : isHeavy ? 'hsl(0, 60%, 40%)' : 'hsl(0, 50%, 55%)';
    ctx.beginPath(); roundRect(ctx, drawX - width/2, drawY - height, width, height, isBoss ? 15 : 10); ctx.fill();
    if (isBoss) { ctx.fillStyle = 'hsl(0, 80%, 50%)'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('👑', drawX - 14, drawY - height - 20); }
    else if (isHeavy) { ctx.fillStyle = 'hsl(45, 90%, 55%)'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('⚠️', drawX - 10, drawY - height - 18); }
    ctx.fillStyle = isBoss ? 'hsl(0, 90%, 20%)' : isHeavy ? 'hsl(0, 80%, 20%)' : 'hsl(0, 70%, 30%)';
    const eyeR = isBoss ? 8 : isHeavy ? 6 : 5;
    ctx.beginPath();
    ctx.arc(drawX - (isBoss ? 12 : 8), drawY - height + 20, eyeR, 0, Math.PI * 2);
    ctx.arc(drawX + (isBoss ? 12 : 8), drawY - height + 20, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle as string; ctx.lineWidth = isBoss ? 4 : isHeavy ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(drawX - (isBoss ? 20 : 14), drawY - height + 12); ctx.lineTo(drawX - 4, drawY - height + 16);
    ctx.moveTo(drawX + (isBoss ? 20 : 14), drawY - height + 12); ctx.lineTo(drawX + 4, drawY - height + 16);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(drawX, drawY - height + 38, isBoss ? 10 : 6, Math.PI + 0.5, -0.5); ctx.stroke();
    ctx.fillStyle = isBoss ? 'hsl(0, 100%, 50%)' : isHeavy ? 'hsl(0, 90%, 45%)' : 'hsl(0, 80%, 50%)';
    ctx.font = `bold ${isBoss ? 20 : 16}px sans-serif`;
    ctx.fillText(isBoss ? '!!!' : isHeavy ? '!!' : '!', drawX - (isBoss ? 15 : isHeavy ? 8 : 4), drawY - height - 5);
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
    const isQueued = state === 'QUEUED';
    ctx.fillStyle = isBoss ? (isQueued ? 'hsl(220, 25%, 35%)' : 'hsl(220, 20%, 40%)') 
      : isHeavy ? (isQueued ? 'hsl(220, 20%, 45%)' : 'hsl(220, 15%, 50%)') 
      : (isQueued ? 'hsl(220, 15%, 55%)' : COLORS.sleepy);
    ctx.beginPath(); roundRect(ctx, drawX - width/2, drawY - height, width, height, isBoss ? 15 : 10); ctx.fill();
    if (isBoss) { ctx.fillStyle = 'hsl(220, 40%, 60%)'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('👑', drawX - 14, drawY - height - 8); }
    else if (isHeavy) { ctx.fillStyle = 'hsl(220, 40%, 70%)'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('⚠️', drawX - 8, drawY - height - 5); }
    ctx.strokeStyle = isBoss ? 'hsl(220, 20%, 20%)' : isHeavy ? 'hsl(220, 15%, 30%)' : 'hsl(220, 10%, 40%)';
    ctx.lineWidth = isBoss ? 4 : isHeavy ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(drawX - (isBoss ? 16 : 12), drawY - height + 20); ctx.lineTo(drawX - 4, drawY - height + 20);
    ctx.moveTo(drawX + 4, drawY - height + 20); ctx.lineTo(drawX + (isBoss ? 16 : 12), drawY - height + 20);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(drawX, drawY - height + 38, isBoss ? 12 : 8, Math.PI + 0.3, -0.3); ctx.stroke();
    if (!isQueued && !isHeavy && !isBoss) {
      ctx.fillStyle = 'hsl(220, 30%, 70%)'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('💤', drawX - 8, drawY - height - 5);
    }
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
  const { x, y, radius, isStar } = proj;
  
  if (isStar) {
    // Saw blade visual
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Date.now() / 100); // spinning
    ctx.fillStyle = 'hsl(200, 50%, 60%)';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? radius * 1.2 : radius * 0.6;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Coffee pellet projectile (scales with radius)
    ctx.fillStyle = COLORS.mediumRoast;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    // Highlight dot
    ctx.fillStyle = COLORS.foam;
    ctx.beginPath(); ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2); ctx.fill();
  }
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
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
      break;
    case 'confetti':
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size * 1.5);
      break;
    case 'crumble':
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      break;
  }
  ctx.restore();
}

function drawTip(ctx: CanvasRenderingContext2D, tip: TipDrop) {
  ctx.save();
  ctx.globalAlpha = tip.opacity;
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath(); ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'hsla(50, 100%, 80%, 0.6)';
  ctx.beginPath(); ctx.arc(tip.x - 3, tip.y - 3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.espresso;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`+${tip.value}`, tip.x, tip.y);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════
// BOSS UI
// ═══════════════════════════════════════════════════════════════════════
function drawBossIncomingBanner(ctx: CanvasRenderingContext2D) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  ctx.save();
  ctx.fillStyle = 'hsla(0, 0%, 0%, 0.4)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 60, CANVAS_WIDTH, 120);
  ctx.fillStyle = 'hsla(0, 70%, 40%, 0.9)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 40, CANVAS_WIDTH, 80);
  ctx.fillStyle = 'hsl(45, 100%, 60%)';
  ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('☕ BOSS INCOMING! ☕', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.fillStyle = 'hsl(0, 0%, 95%)'; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Prepare your Tonic Bombs!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  ctx.restore();
}

function drawBossEdgeGlow(ctx: CanvasRenderingContext2D) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;
  const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.2;
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.7);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, `hsla(0, 80%, 45%, ${pulse})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawBossHpBar(ctx: CanvasRenderingContext2D, bossState: BossState) {
  const { CANVAS_WIDTH } = GAME_CONFIG;
  ctx.save();
  const barWidth = CANVAS_WIDTH - 40, barHeight = 16, barX = 20, barY = 55;
  ctx.fillStyle = 'hsla(0, 0%, 0%, 0.7)';
  roundRect(ctx, barX - 2, barY - 2, barWidth + 4, barHeight + 4, 6); ctx.fill();
  ctx.fillStyle = 'hsl(0, 30%, 25%)';
  roundRect(ctx, barX, barY, barWidth, barHeight, 4); ctx.fill();
  const hpPercent = Math.max(0, bossState.hp / bossState.maxHp);
  ctx.fillStyle = hpPercent > 0.5 ? 'hsl(0, 70%, 50%)' : hpPercent > 0.25 ? 'hsl(30, 80%, 50%)' : 'hsl(45, 90%, 55%)';
  roundRect(ctx, barX, barY, barWidth * hpPercent, barHeight, 4); ctx.fill();
  ctx.fillStyle = 'hsl(45, 100%, 60%)'; ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('👑 BOSS 👑', CANVAS_WIDTH / 2, barY - 4);
  ctx.fillStyle = 'hsl(0, 0%, 100%)'; ctx.font = 'bold 11px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${bossState.hp} / ${bossState.maxHp}`, CANVAS_WIDTH / 2, barY + barHeight / 2);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius); rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius); rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
