// ============================================================
//  g2d_draw.ts  –  All procedural drawing functions
// ============================================================

type Ctx = CanvasRenderingContext2D;

// ── Utility helpers ──────────────────────────────────────────

export function px(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

export function circ(ctx: Ctx, x: number, y: number, r: number, c: string) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function shadow(ctx: Ctx, x: number, y: number, rx: number, ry: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Taeil (height ~56 px from feet to hair top) ──────────────

export function drawTaeil(ctx: Ctx, x: number, y: number, t: number,
  state: 'idle'|'walk'|'attack'|'hit'|'wind' = 'idle', facingLeft = false) {

  ctx.save();
  if (facingLeft) { ctx.scale(-1, 1); x = -x; }

  const bob   = Math.sin(t * 2.2) * (state === 'idle' ? 1.2 : 0);
  const walkT = Math.sin(t * 9);
  const legL  = state === 'walk' ? walkT * 5 : 0;
  const legR  = state === 'walk' ? -walkT * 5 : 0;
  const armL  = state === 'walk' ? -walkT * 6 : (state === 'attack' ? -14 : 0);
  const armR  = state === 'walk' ? walkT * 6 : (state === 'attack' ? 14 : 0);
  const hitFlash = state === 'hit' ? 'rgba(255,80,80,0.5)' : null;

  const B = bob; // Base offset

  shadow(ctx, x, y + 2, 13, 4);

  // Sneakers
  px(ctx, x - 13, y - 2 + legL + B, 11, 5, '#e0e0e0');
  px(ctx, x + 2, y - 2 + legR + B, 11, 5, '#e0e0e0');
  px(ctx, x - 13, y + 1 + legL + B, 11, 2, '#cc4444');
  px(ctx, x + 2, y + 1 + legR + B, 11, 2, '#cc4444');

  // Dark pants
  px(ctx, x - 12, y - 18 + legL + B, 10, 17, '#2a2a3a');
  px(ctx, x + 2, y - 18 + legR + B, 10, 17, '#2a2a3a');

  // Brown plaid shirt (torso)
  px(ctx, x - 14, y - 36 + B, 28, 20, '#8b5a2b');
  // Plaid lines
  px(ctx, x - 14, y - 30 + B, 28, 2, '#5a3010');
  px(ctx, x - 14, y - 24 + B, 28, 2, '#5a3010');
  px(ctx, x - 5, y - 36 + B, 2, 20, '#5a3010');
  px(ctx, x + 3, y - 36 + B, 2, 20, '#5a3010');
  // Inner light shirt at collar
  px(ctx, x - 4, y - 36 + B, 8, 10, '#f5f5f5');
  px(ctx, x - 4, y - 36 + B, 8, 2, '#dddddd');

  // Arms
  px(ctx, x - 22, y - 36 + armL + B, 8, 18, '#8b5a2b');
  px(ctx, x + 14, y - 36 + armR + B, 8, 18, '#8b5a2b');
  // Hands
  px(ctx, x - 22, y - 18 + armL + B, 8, 6, '#f5c5a0');
  px(ctx, x + 14, y - 18 + armR + B, 8, 6, '#f5c5a0');

  // Backpack
  px(ctx, x + 14, y - 38 + B, 11, 22, '#1a1a2a');
  px(ctx, x + 15, y - 34 + B, 9, 11, '#2a2a3a');
  px(ctx, x + 16, y - 30 + B, 7, 4, '#3a3a5a');

  // Neck
  px(ctx, x - 4, y - 40 + B, 8, 5, '#f0b898');

  // Head (skin)
  px(ctx, x - 12, y - 56 + B, 24, 20, '#f5c5a0');

  // Ears
  px(ctx, x - 14, y - 52 + B, 3, 8, '#f0b090');
  px(ctx, x + 11, y - 52 + B, 3, 8, '#f0b090');

  // Brown hair – fluffy dark
  px(ctx, x - 14, y - 60 + B, 28, 6, '#2a1508');
  px(ctx, x - 14, y - 56 + B, 4, 6, '#2a1508');
  px(ctx, x + 10, y - 56 + B, 4, 6, '#2a1508');
  px(ctx, x - 10, y - 63 + B, 8, 5, '#3a2010');
  px(ctx, x + 2, y - 65 + B, 10, 5, '#3a2010');
  px(ctx, x - 12, y - 62 + B, 4, 4, '#3a2010');

  // Thick black glasses (two square frames)
  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x - 11, y - 50 + B, 9, 9);
  ctx.strokeRect(x + 2, y - 50 + B, 9, 9);
  // Bridge
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 46 + B);
  ctx.lineTo(x + 2, y - 46 + B);
  ctx.stroke();
  // Temples
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 46 + B);
  ctx.lineTo(x - 14, y - 45 + B);
  ctx.moveTo(x + 11, y - 46 + B);
  ctx.lineTo(x + 14, y - 45 + B);
  ctx.stroke();

  // Eyes (pupils behind glasses)
  px(ctx, x - 8, y - 47 + B, 3, 4, '#1a0800');
  px(ctx, x + 5, y - 47 + B, 3, 4, '#1a0800');
  // Eye shine
  px(ctx, x - 7, y - 47 + B, 1, 1, '#ffffff');
  px(ctx, x + 6, y - 47 + B, 1, 1, '#ffffff');

  // Eyebrows
  px(ctx, x - 10, y - 52 + B, 6, 2, '#2a1508');
  px(ctx, x + 4, y - 52 + B, 6, 2, '#2a1508');

  // Attack sword flash
  if (state === 'attack') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,200,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 30, y - 30 + B, 20, -0.8, 0.8);
    ctx.stroke();
    // Sword
    px(ctx, x + 14, y - 36 + B, 3, 28, '#c0c0c0');
    px(ctx, x + 14, y - 36 + B, 10, 3, '#8b6a20');
    ctx.restore();
  }

  // Wind skill ring
  if (state === 'wind') {
    ctx.save();
    for (let r = 20; r <= 60; r += 20) {
      ctx.strokeStyle = `rgba(60,220,200,${0.8 - r / 100})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 25 + B, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hit flash overlay
  if (hitFlash) {
    ctx.save();
    ctx.fillStyle = hitFlash;
    ctx.fillRect(x - 22, y - 66 + B, 45, 72);
    ctx.restore();
  }

  ctx.restore();
}

// ── Teemo (knee-height scout, ~22 px) ───────────────────────

export function drawTeemo(ctx: Ctx, x: number, y: number, t: number, state: 'idle'|'walk'|'dance' = 'idle') {
  ctx.save();

  const bob    = Math.sin(t * 3) * (state === 'idle' ? 1.5 : 0);
  const walkT  = Math.sin(t * 10);
  const dance  = state === 'dance' ? Math.sin(t * 6) * 8 : 0;

  shadow(ctx, x, y + 1, 8, 3);

  // Tiny legs
  px(ctx, x - 6, y - 10 + (state === 'walk' ? walkT * 3 : 0) + bob + dance, 4, 10, '#6b4423');
  px(ctx, x + 2, y - 10 + (state === 'walk' ? -walkT * 3 : 0) + bob + dance, 4, 10, '#6b4423');
  // Feet
  px(ctx, x - 7, y - 2 + bob + dance, 5, 3, '#3a1f00');
  px(ctx, x + 2, y - 2 + bob + dance, 5, 3, '#3a1f00');

  // Beige furry body
  circ(ctx, x, y - 15 + bob + dance, 9, '#d4a86a');
  px(ctx, x - 8, y - 21 + bob + dance, 16, 10, '#d4a86a');

  // Red scarf
  px(ctx, x - 7, y - 20 + bob + dance, 14, 3, '#cc2222');

  // Green scout hat
  px(ctx, x - 10, y - 29 + bob + dance, 20, 3, '#1a5c2a');
  circ(ctx, x, y - 34 + bob + dance, 10, '#2d6a4f');
  // Hat detail
  px(ctx, x - 3, y - 38 + bob + dance, 6, 4, '#3d8a5f');
  // Hat feather / plume
  px(ctx, x + 7, y - 42 + bob + dance, 3, 12, '#4444cc');

  // Face (on body)
  circ(ctx, x, y - 18 + bob + dance, 7, '#e8c890');
  // Eyes
  px(ctx, x - 4, y - 20 + bob + dance, 2, 2, '#1a0a00');
  px(ctx, x + 2, y - 20 + bob + dance, 2, 2, '#1a0a00');
  // Rosy cheeks
  circ(ctx, x - 4, y - 17 + bob + dance, 2, 'rgba(230,100,100,0.5)');
  circ(ctx, x + 4, y - 17 + bob + dance, 2, 'rgba(230,100,100,0.5)');

  // Amber goggles (on forehead)
  ctx.save();
  ctx.fillStyle = '#c47808';
  ctx.globalAlpha = 0.85;
  ctx.fillRect(x - 8, y - 26 + bob + dance, 5, 4);
  ctx.fillRect(x + 3, y - 26 + bob + dance, 5, 4);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#3a1a00';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 8, y - 26 + bob + dance, 5, 4);
  ctx.strokeRect(x + 3, y - 26 + bob + dance, 5, 4);
  ctx.restore();

  // Tiny backpack
  px(ctx, x + 8, y - 22 + bob + dance, 6, 12, '#1a2a1a');
  px(ctx, x + 9, y - 20 + bob + dance, 4, 5, '#2a4a2a');

  ctx.restore();
}

// ── Yongbin (sleeping on floor) ──────────────────────────────

export function drawYongbin(ctx: Ctx, x: number, y: number, t: number) {
  const breathe = Math.sin(t * 1.8) * 1.5;

  // Floor bedding
  px(ctx, x - 55, y - 10, 110, 30, '#3a5a8a');
  // Blanket top (rises slightly with breathing)
  px(ctx, x - 55, y - 14 + breathe, 110, 16, '#4a6a9a');
  px(ctx, x - 55, y - 14 + breathe, 110, 3, '#5a7aaa');

  // Head (slightly visible)
  px(ctx, x - 12, y - 22, 22, 18, '#f5c5a0');
  // Black hair – squarish
  px(ctx, x - 14, y - 26, 28, 8, '#0a0a0a');
  px(ctx, x - 14, y - 22, 4, 10, '#0a0a0a');
  px(ctx, x + 10, y - 22, 4, 10, '#0a0a0a');
  // Small face details
  px(ctx, x - 5, y - 16, 4, 3, '#0a0a0a'); // closed eyes
  px(ctx, x + 1, y - 16, 4, 3, '#0a0a0a');
}

// ── Hilichurl ─────────────────────────────────────────────────

export function drawHilichurl(ctx: Ctx, x: number, y: number, t: number,
  state: 'idle'|'walk'|'attack'|'hit'|'dead' = 'idle', scale = 1.0, hp = 1, maxHp = 1) {

  ctx.save();
  ctx.scale(scale, scale);
  const sx = x / scale;
  const sy = y / scale;

  const hop   = Math.sin(t * 5) * (state === 'idle' ? 2 : 0);
  const walkT = Math.sin(t * 8);
  const legL  = state === 'walk' ? walkT * 4 : 0;
  const legR  = state === 'walk' ? -walkT * 4 : 0;
  const atk   = state === 'attack' ? Math.sin(t * 12) * 8 : 0;
  const squash = state === 'dead' ? 0.3 : 1.0;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, squash);

  shadow(ctx, 0, 2 / squash, 12, 4);

  // Legs
  px(ctx, -10, -18 + legL + hop, 8, 18, '#2a1a10');
  px(ctx, 2, -18 + legR + hop, 8, 18, '#2a1a10');
  // Feet
  px(ctx, -11, -2 + hop, 9, 4, '#1a0a00');
  px(ctx, 2, -2 + hop, 9, 4, '#1a0a00');

  // Dark body
  px(ctx, -12, -36 + hop, 24, 20, '#3a2010');
  // Body detail stripes
  px(ctx, -12, -30 + hop, 24, 2, '#5a3018');
  px(ctx, -12, -24 + hop, 24, 2, '#5a3018');

  // Wooden club (right hand)
  const clubAngle = state === 'attack' ? Math.sin(t * 10) * 0.6 - 0.8 : -0.3;
  ctx.save();
  ctx.translate(14 + atk, -28 + hop);
  ctx.rotate(clubAngle);
  px(ctx, 0, -20, 7, 28, '#8b6940');
  px(ctx, -2, -20, 10, 5, '#6b4f28'); // grip
  px(ctx, -2, -20, 10, 2, '#9a7a44');
  ctx.restore();

  // Arms
  px(ctx, -20, -36 + hop, 8, 16, '#3a2010');
  px(ctx, 12, -36 + hop, 8, 16, '#3a2010');

  // Pale tribal mask
  px(ctx, -10, -52 + hop, 20, 18, '#f0ede0');
  // Mask markings
  px(ctx, -8, -46 + hop, 5, 4, '#cc2222'); // left eye hole
  px(ctx, 3, -46 + hop, 5, 4, '#cc2222'); // right eye hole
  px(ctx, -4, -40 + hop, 8, 2, '#cc2222'); // nose stripe
  // Mask eye glow
  circ(ctx, -5, -44 + hop, 2, '#ff4444');
  circ(ctx, 5, -44 + hop, 2, '#ff4444');

  // Horns (on mask)
  px(ctx, -8, -58 + hop, 5, 8, '#e8d5a0');
  px(ctx, 3, -58 + hop, 5, 8, '#e8d5a0');
  px(ctx, -6, -62 + hop, 3, 4, '#c8b580');
  px(ctx, 3, -62 + hop, 3, 4, '#c8b580');

  // Hit flash
  if (state === 'hit') {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-12, -60, 24, 62);
    ctx.restore();
  }

  // Death puff
  if (state === 'dead') {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const d = 20;
      circ(ctx, Math.cos(angle) * d, Math.sin(angle) * d - 20, 4, `rgba(120,100,80,${0.6 - i * 0.05})`);
    }
  }

  ctx.restore(); // squash restore

  // HP bar (screen space)
  const bw = 40 * scale;
  const bh = 5;
  const bx = x - bw / 2;
  const by = y - 72 * scale;
  ctx.restore(); // scale restore
  ctx.fillStyle = '#550000';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = hp > maxHp * 0.5 ? '#22dd44' : hp > maxHp * 0.25 ? '#ffaa00' : '#ff2222';
  ctx.fillRect(bx, by, bw * (hp / maxHp), bh);

  return; // already restored
}

// ── Poro (fluffy bouncing critter) ───────────────────────────

export function drawPoro(ctx: Ctx, x: number, y: number, t: number) {
  const bounce = Math.abs(Math.sin(t * 4)) * 8;
  const blink  = (Math.sin(t * 1.5) > 0.94) ? 1 : 0;

  shadow(ctx, x, y + 2, 14, 5);

  // White fluffy body
  circ(ctx, x, y - 14 + bounce, 16, '#f0f0f0');
  // Fluff details
  circ(ctx, x - 10, y - 8 + bounce, 9, '#f8f8f8');
  circ(ctx, x + 10, y - 8 + bounce, 9, '#f8f8f8');
  circ(ctx, x, y - 4 + bounce, 10, '#f0f0f0');

  // Tiny horns
  ctx.save();
  ctx.fillStyle = '#d4c080';
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 28 + bounce);
  ctx.lineTo(x - 9, y - 36 + bounce);
  ctx.lineTo(x - 2, y - 28 + bounce);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 28 + bounce);
  ctx.lineTo(x + 9, y - 36 + bounce);
  ctx.lineTo(x + 2, y - 28 + bounce);
  ctx.fill();
  ctx.restore();

  // Eyes
  if (blink) {
    px(ctx, x - 5, y - 16 + bounce, 6, 2, '#222');
    px(ctx, x + 3, y - 16 + bounce, 6, 2, '#222');
  } else {
    circ(ctx, x - 5, y - 15 + bounce, 3, '#2a1000');
    circ(ctx, x + 5, y - 15 + bounce, 3, '#2a1000');
    circ(ctx, x - 4, y - 16 + bounce, 1, '#fff');
    circ(ctx, x + 6, y - 16 + bounce, 1, '#fff');
  }

  // Pink tongue
  circ(ctx, x, y - 8 + bounce, 5, '#ff9a9a');
  circ(ctx, x, y - 6 + bounce, 4, '#ff7a7a');

  // Tiny feet
  circ(ctx, x - 7, y + 1, 5, '#e0e0e0');
  circ(ctx, x + 7, y + 1, 5, '#e0e0e0');
}

// ── Cinnamoroll (white, long floppy ears) ────────────────────

export function drawCinnamoroll(ctx: Ctx, x: number, y: number, t: number) {
  const bob = Math.sin(t * 2.5) * 1.5;
  const earBob = Math.sin(t * 2.5 + 0.5) * 3;

  shadow(ctx, x, y + 2, 16, 5);

  // Long floppy ears (behind head)
  ctx.save();
  ctx.fillStyle = '#f0f0ff';
  // Left ear
  ctx.beginPath();
  ctx.ellipse(x - 14, y - 28 + bob + earBob, 8, 22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.ellipse(x + 14, y - 28 + bob + earBob, 8, 22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Ear inner pink
  ctx.fillStyle = 'rgba(255,180,200,0.4)';
  ctx.beginPath();
  ctx.ellipse(x - 14, y - 28 + bob + earBob, 4, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 14, y - 28 + bob + earBob, 4, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Fluffy white body
  circ(ctx, x, y - 10 + bob, 14, '#f5f5ff');
  // Head
  circ(ctx, x, y - 26 + bob, 16, '#f5f5ff');

  // Curly tail
  ctx.save();
  ctx.strokeStyle = '#e0e0f0';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x + 12, y - 5 + bob, 8, -0.5, Math.PI * 1.2);
  ctx.stroke();
  ctx.restore();

  // Blue eyes
  circ(ctx, x - 5, y - 27 + bob, 4, '#4a8ad4');
  circ(ctx, x + 5, y - 27 + bob, 4, '#4a8ad4');
  // Pupils
  circ(ctx, x - 5, y - 27 + bob, 2, '#0a2060');
  circ(ctx, x + 5, y - 27 + bob, 2, '#0a2060');
  // Eye shine
  circ(ctx, x - 4, y - 28 + bob, 1, '#ffffff');
  circ(ctx, x + 6, y - 28 + bob, 1, '#ffffff');

  // Pink cheeks
  circ(ctx, x - 9, y - 23 + bob, 4, 'rgba(255,160,180,0.6)');
  circ(ctx, x + 9, y - 23 + bob, 4, 'rgba(255,160,180,0.6)');

  // Small nose
  circ(ctx, x, y - 22 + bob, 2, '#ffaacc');
}

// ── Tahm Kench (huge blue-green) ─────────────────────────────

export function drawTahm(ctx: Ctx, x: number, y: number, t: number) {
  const bellyBob = Math.sin(t * 1.8) * 3;
  const mouthOpen = Math.abs(Math.sin(t * 1.2)) * 8;

  shadow(ctx, x, y + 4, 35, 10);

  // Huge body (blue-green)
  circ(ctx, x, y - 30 + bellyBob, 38, '#1a6b5a');
  circ(ctx, x, y - 20 + bellyBob, 32, '#24806a');
  circ(ctx, x, y - 40 + bellyBob, 30, '#1a7060');

  // Belly (lighter)
  circ(ctx, x, y - 22 + bellyBob, 22, '#2da87a');

  // Legs (big stubby)
  circ(ctx, x - 24, y + bellyBob, 16, '#1a6b5a');
  circ(ctx, x + 24, y + bellyBob, 16, '#1a6b5a');
  // Feet webbed
  px(ctx, x - 35, y + 6 + bellyBob, 22, 10, '#156050');
  px(ctx, x + 13, y + 6 + bellyBob, 22, 10, '#156050');

  // Dark vest / coat hints
  px(ctx, x - 20, y - 42 + bellyBob, 40, 12, '#0a2018');
  px(ctx, x - 18, y - 42 + bellyBob, 36, 3, '#1a4030');
  // Gold buttons
  circ(ctx, x - 6, y - 38 + bellyBob, 3, '#d4a840');
  circ(ctx, x, y - 38 + bellyBob, 3, '#d4a840');
  circ(ctx, x + 6, y - 38 + bellyBob, 3, '#d4a840');

  // Enormous mouth
  ctx.save();
  ctx.fillStyle = '#0a4030';
  ctx.beginPath();
  ctx.ellipse(x, y - 20 + bellyBob, 30, 14 + mouthOpen, 0, 0, Math.PI);
  ctx.fill();
  // Tongue
  ctx.fillStyle = '#cc3366';
  ctx.beginPath();
  ctx.ellipse(x, y - 16 + bellyBob, 18, 6, 0, 0, Math.PI);
  ctx.fill();
  // Teeth
  ctx.fillStyle = '#fffde0';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(x + i * 10 - 4, y - 32 + bellyBob, 7, 8 + mouthOpen * 0.5);
  }
  ctx.restore();

  // Small beady eyes
  circ(ctx, x - 16, y - 46 + bellyBob, 6, '#f0f0d0');
  circ(ctx, x + 16, y - 46 + bellyBob, 6, '#f0f0d0');
  circ(ctx, x - 16, y - 46 + bellyBob, 4, '#1a1a00');
  circ(ctx, x + 16, y - 46 + bellyBob, 4, '#1a1a00');
  circ(ctx, x - 15, y - 47 + bellyBob, 2, '#ffffff');
  circ(ctx, x + 17, y - 47 + bellyBob, 2, '#ffffff');

  // Hat (fancy)
  px(ctx, x - 22, y - 58 + bellyBob, 44, 6, '#0a0a18');
  px(ctx, x - 16, y - 74 + bellyBob, 32, 18, '#0a0a18');
  // Hat band
  px(ctx, x - 16, y - 58 + bellyBob, 32, 4, '#d4a840');
}

// ── Suhyeon (2D pixel character) ─────────────────────────────

export function drawSuhyeon(ctx: Ctx, x: number, y: number, t: number, state: 'behind'|'turning'|'facing' = 'facing') {
  const bob = Math.sin(t * 1.5) * 0.8;

  shadow(ctx, x, y + 2, 12, 4);

  if (state === 'behind') {
    // Seen from behind
    // Hair (dark brown)
    px(ctx, x - 14, y - 62 + bob, 28, 24, '#2a1206');
    px(ctx, x - 12, y - 40 + bob, 24, 14, '#2a1206');
    // Body
    px(ctx, x - 14, y - 38 + bob, 28, 22, '#e8e0f0');
    // Legs
    px(ctx, x - 10, y - 18 + bob, 8, 18, '#2a2a3a');
    px(ctx, x + 2, y - 18 + bob, 8, 18, '#2a2a3a');
    return;
  }

  // Facing / turning
  const flip = state === 'turning';
  if (flip) ctx.save(), ctx.scale(-1, 1), (x = -x);

  // Legs
  px(ctx, x - 10, y - 18 + bob, 8, 18, '#2a2a3a');
  px(ctx, x + 2, y - 18 + bob, 8, 18, '#2a2a3a');
  // Shoes
  px(ctx, x - 11, y - 2 + bob, 10, 5, '#6a4030');
  px(ctx, x + 1, y - 2 + bob, 10, 5, '#6a4030');

  // Light top (sleeveless)
  px(ctx, x - 13, y - 38 + bob, 26, 22, '#f0eaf8');
  // Neckline
  px(ctx, x - 4, y - 38 + bob, 8, 6, '#f5c5a0');

  // Arms
  px(ctx, x - 20, y - 36 + bob, 7, 16, '#f5c5a0');
  px(ctx, x + 13, y - 36 + bob, 7, 16, '#f5c5a0');

  // Silver necklace
  ctx.save();
  ctx.strokeStyle = '#c0c8d8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y - 34 + bob, 7, -2.2, -0.9);
  ctx.stroke();
  // Small pendant
  circ(ctx, x, y - 28 + bob, 2, '#a0b0c8');
  ctx.restore();

  // Neck
  px(ctx, x - 4, y - 42 + bob, 8, 5, '#f5c5a0');

  // Head
  px(ctx, x - 12, y - 58 + bob, 24, 20, '#f5c5a0');

  // Dark brown hair (tied back / softly styled)
  px(ctx, x - 14, y - 64 + bob, 28, 8, '#2a1206');
  px(ctx, x - 14, y - 58 + bob, 4, 8, '#2a1206');
  px(ctx, x + 10, y - 58 + bob, 4, 8, '#2a1206');
  // Soft styled top
  px(ctx, x - 8, y - 66 + bob, 16, 5, '#3a1a08');
  px(ctx, x - 12, y - 64 + bob, 6, 6, '#3a1a08');
  // Hair tie
  circ(ctx, x + 12, y - 58 + bob, 3, '#8a5a3a');
  px(ctx, x + 9, y - 62 + bob, 8, 6, '#2a1206');

  // Eyes (warm, gentle)
  px(ctx, x - 7, y - 50 + bob, 4, 4, '#2a1000');
  px(ctx, x + 3, y - 50 + bob, 4, 4, '#2a1000');
  // Eye shine
  px(ctx, x - 6, y - 50 + bob, 1, 1, '#ffffff');
  px(ctx, x + 4, y - 50 + bob, 1, 1, '#ffffff');
  // Eyebrows (soft)
  px(ctx, x - 8, y - 54 + bob, 5, 2, '#2a1206');
  px(ctx, x + 3, y - 54 + bob, 5, 2, '#2a1206');

  // Gentle smile
  ctx.save();
  ctx.strokeStyle = '#c06060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 44 + bob, 5, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.restore();

  // Ears
  px(ctx, x - 14, y - 54 + bob, 3, 7, '#f0b090');
  px(ctx, x + 11, y - 54 + bob, 3, 7, '#f0b090');

  if (flip) ctx.restore();
}

// ── NPC generic wanderer ─────────────────────────────────────

export function drawNPC(ctx: Ctx, x: number, y: number, t: number, bodyColor: string, hairColor: string, hatColor?: string) {
  const bob = Math.sin(t * 2.5) * 1;

  shadow(ctx, x, y + 2, 9, 3);

  // Legs
  const lw = Math.sin(t * 7);
  px(ctx, x - 9, y - 16 + lw * 3 + bob, 7, 16, '#2a2a3a');
  px(ctx, x + 2, y - 16 - lw * 3 + bob, 7, 16, '#2a2a3a');
  // Shoes
  px(ctx, x - 10, y - 2 + bob, 8, 4, '#3a2010');
  px(ctx, x + 2, y - 2 + bob, 8, 4, '#3a2010');

  // Body
  px(ctx, x - 11, y - 32 + bob, 22, 18, bodyColor);
  // Arms
  px(ctx, x - 18, y - 30 + lw * 4 + bob, 7, 14, bodyColor);
  px(ctx, x + 11, y - 30 - lw * 4 + bob, 7, 14, bodyColor);

  // Head
  px(ctx, x - 9, y - 46 + bob, 18, 16, '#f5c5a0');
  // Hair
  px(ctx, x - 11, y - 50 + bob, 22, 7, hairColor);
  px(ctx, x - 11, y - 46 + bob, 3, 6, hairColor);
  px(ctx, x + 8, y - 46 + bob, 3, 6, hairColor);

  // Eyes
  px(ctx, x - 5, y - 40 + bob, 3, 3, '#1a0a00');
  px(ctx, x + 2, y - 40 + bob, 3, 3, '#1a0a00');

  // Hat (optional)
  if (hatColor) {
    px(ctx, x - 11, y - 52 + bob, 22, 4, hatColor);
    px(ctx, x - 8, y - 60 + bob, 16, 10, hatColor);
  }
}

// ── Scene environment drawing functions ──────────────────────

export function drawTree(ctx: Ctx, x: number, y: number, h = 60, trunkColor = '#6b3c1a', crownColor = '#2d8a3e') {
  const tw = 12;
  px(ctx, x - tw / 2, y - h * 0.45, tw, h * 0.45, trunkColor);
  // Crown (layered circles)
  circ(ctx, x, y - h * 0.55, h * 0.3, crownColor);
  circ(ctx, x - h * 0.14, y - h * 0.45, h * 0.22, crownColor);
  circ(ctx, x + h * 0.14, y - h * 0.45, h * 0.22, crownColor);
  // Highlight
  circ(ctx, x - h * 0.06, y - h * 0.62, h * 0.14, shiftColor(crownColor, 30));
}

export function drawBush(ctx: Ctx, x: number, y: number, r = 14, color = '#2a7a30') {
  circ(ctx, x - r * 0.4, y - r * 0.3, r * 0.7, color);
  circ(ctx, x + r * 0.4, y - r * 0.3, r * 0.7, color);
  circ(ctx, x, y - r * 0.6, r * 0.65, shiftColor(color, 15));
}

export function drawFlower(ctx: Ctx, x: number, y: number, t: number, petalColor = '#ff6688', stemColor = '#3a8830') {
  const sway = Math.sin(t * 1.5 + x * 0.1) * 1.5;
  // Stem
  px(ctx, x - 1, y - 12 + sway, 2, 12, stemColor);
  // Petals
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    circ(ctx, x + Math.cos(angle) * 5 + sway * 0.3, y - 14 + Math.sin(angle) * 4 + sway, 3, petalColor);
  }
  circ(ctx, x + sway * 0.3, y - 14 + sway, 3, '#ffdd44');
}

export function drawFence(ctx: Ctx, x1: number, y: number, x2: number, postColor = '#9a7a40', railColor = '#b89050') {
  const spacing = 18;
  for (let fx = x1; fx < x2; fx += spacing) {
    px(ctx, fx, y - 22, 5, 22, postColor);
  }
  px(ctx, x1, y - 16, x2 - x1, 3, railColor);
  px(ctx, x1, y - 8, x2 - x1, 3, railColor);
}

export function drawBarrel(ctx: Ctx, x: number, y: number) {
  px(ctx, x - 9, y - 22, 18, 22, '#8b6a30');
  px(ctx, x - 10, y - 22, 20, 3, '#6b4a18');
  px(ctx, x - 10, y - 12, 20, 3, '#6b4a18');
  px(ctx, x - 10, y - 2, 20, 3, '#6b4a18');
  px(ctx, x - 11, y - 20, 22, 4, '#7a5a28');
}

export function drawLantern(ctx: Ctx, x: number, y: number, t: number) {
  // Pole
  px(ctx, x - 2, y - 60, 4, 60, '#4a3820');
  // Lamp box
  px(ctx, x - 8, y - 68, 16, 14, '#6a5030');
  // Glow (pulsing)
  const glow = 0.7 + Math.sin(t * 2) * 0.3;
  ctx.save();
  ctx.globalAlpha = glow;
  circ(ctx, x, y - 62, 10, '#ffeeaa');
  ctx.globalAlpha = glow * 0.4;
  circ(ctx, x, y - 62, 18, '#ffcc44');
  ctx.globalAlpha = 1;
  ctx.restore();
  px(ctx, x - 6, y - 76, 12, 4, '#4a3820'); // cap
}

export function drawWindmill(ctx: Ctx, x: number, y: number, angle: number) {
  // Tower
  px(ctx, x - 12, y - 100, 24, 100, '#c8b090');
  px(ctx, x - 8, y - 100, 16, 100, '#d8c0a0');
  // Blades (4)
  ctx.save();
  ctx.translate(x, y - 95);
  ctx.rotate(angle);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#f0e0c0';
    ctx.fillRect(-4, 0, 8, 40);
    ctx.fillStyle = '#d8c0a0';
    ctx.fillRect(-3, 0, 6, 38);
  }
  ctx.restore();
  // Hub
  circ(ctx, x, y - 95, 7, '#8b7040');
}

export function drawFountain(ctx: Ctx, x: number, y: number, t: number) {
  // Basin
  ctx.save();
  ctx.fillStyle = '#a0a8b0';
  ctx.beginPath();
  ctx.ellipse(x, y, 40, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6888aa';
  ctx.beginPath();
  ctx.ellipse(x, y - 3, 32, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Water ripples
  const ripple = (t * 2) % 1;
  ctx.strokeStyle = `rgba(120,180,255,${0.8 - ripple * 0.8})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 32 * ripple, 9 * ripple, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Spout
  px(ctx, x - 3, y - 36, 6, 30, '#8a9aaa');
  // Water spray (animated arcs)
  for (let i = 0; i < 5; i++) {
    const angle = (-0.6 + i * 0.3) + Math.sin(t * 3 + i) * 0.15;
    const len = 16 + i * 2;
    ctx.strokeStyle = `rgba(100,180,255,${0.6 + Math.sin(t * 4 + i) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 36);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * len,
      y - 36 + Math.sin(angle - 0.5) * 10 - 10,
      x + Math.cos(angle) * len * 1.4,
      y - 36 + 8
    );
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHouse(ctx: Ctx, x: number, y: number, w: number, h: number, wallColor: string, roofColor: string, hasChimney = false) {
  // Wall
  px(ctx, x, y - h, w, h, wallColor);
  // Window
  px(ctx, x + 8, y - h + 12, 16, 14, '#aaccee');
  px(ctx, x + 14, y - h + 12, 3, 14, '#7a99bb'); // vertical divider
  px(ctx, x + 8, y - h + 18, 16, 2, '#7a99bb'); // horizontal divider
  // Window frame
  ctx.save();
  ctx.strokeStyle = '#c8a060';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 7, y - h + 11, 18, 16);
  ctx.restore();
  // Door
  px(ctx, x + w / 2 - 8, y - 24, 16, 24, '#8b6040');
  px(ctx, x + w / 2 - 8, y - 24, 16, 4, '#6b4020');
  // Door knob
  circ(ctx, x + w / 2 + 4, y - 14, 2, '#d4a840');
  // Roof
  ctx.save();
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - h);
  ctx.lineTo(x + w / 2, y - h - 30);
  ctx.lineTo(x + w + 6, y - h);
  ctx.fill();
  // Roof shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - h - 30);
  ctx.lineTo(x + w + 6, y - h);
  ctx.lineTo(x + w / 2 + 2, y - h);
  ctx.fill();
  ctx.restore();
  // Chimney
  if (hasChimney) {
    px(ctx, x + w - 22, y - h - 20, 12, 24, '#8a6a50');
  }
}

// Smoke particle helper
export function drawSmoke(ctx: Ctx, x: number, y: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.5 + i * 0.8) % 3;
    const sy = y - phase * 18;
    const sx = x + Math.sin(phase * 2 + i) * 5;
    const alpha = 1 - phase / 3;
    const r = 4 + phase * 3;
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    circ(ctx, sx, sy, r, '#c0b0a0');
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── Color utility ─────────────────────────────────────────────

function shiftColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
}

// ── Gradient sky helper ───────────────────────────────────────

export function drawSky(ctx: Ctx, stops: [number, string][]) {
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  stops.forEach(([pos, color]) => grad.addColorStop(pos, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);
}

// ── Stars (for night scenes) ──────────────────────────────────

export function drawStars(ctx: Ctx, t: number, count = 60) {
  for (let i = 0; i < count; i++) {
    const sx = (i * 157.3) % 960;
    const sy = (i * 97.7) % 220;
    const twinkle = 0.5 + Math.sin(t * 2 + i * 0.8) * 0.5;
    ctx.save();
    ctx.globalAlpha = twinkle * 0.9;
    circ(ctx, sx, sy, 1 + (i % 3 === 0 ? 1 : 0), '#ffffff');
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── Cloud ─────────────────────────────────────────────────────

export function drawCloud(ctx: Ctx, x: number, y: number, w: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  circ(ctx, x, y, w * 0.3, 'rgba(255,255,255,0.92)');
  circ(ctx, x + w * 0.25, y - w * 0.1, w * 0.38, 'rgba(255,255,255,0.92)');
  circ(ctx, x + w * 0.55, y + w * 0.03, w * 0.3, 'rgba(255,255,255,0.92)');
  circ(ctx, x + w * 0.8, y + w * 0.06, w * 0.22, 'rgba(255,255,255,0.92)');
  ctx.restore();
}

// ── Mountain silhouette ───────────────────────────────────────

export function drawMountain(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.fill();
  // Snow cap
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.12, y - h * 0.75);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w * 0.12, y - h * 0.75);
  ctx.fill();
}

// ── Confetti particle draw ────────────────────────────────────

export function drawConfetti(ctx: Ctx, particles: Array<{x:number;y:number;c:string;r:number;vy:number;vx:number}>) {
  particles.forEach(p => {
    ctx.save();
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - 4, p.y - 3, 8, 5);
    ctx.restore();
  });
}

// ── Item icon drawing ─────────────────────────────────────────

export function drawItemIcon(ctx: Ctx, id: string, x: number, y: number, size = 24) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  switch (id) {
    case 'sunset_fruit':
      circ(ctx, 0, 0, 10, '#e63946');
      circ(ctx, -3, -4, 4, '#cc2233');
      px(ctx, -1, -12, 2, 5, '#2d6a4f');
      break;
    case 'memory_mushroom':
      px(ctx, -3, 0, 6, 10, '#d4a870');
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath(); ctx.arc(0, 0, 11, Math.PI, 0); ctx.fill();
      circ(ctx, -4, -4, 2, '#ffffff');
      circ(ctx, 4, -2, 2, '#ffffff');
      break;
    case 'focus_mint':
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        ctx.fillStyle = `hsl(${130 + i * 10},70%,40%)`;
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * 7, Math.sin(angle) * 7, 4, 7, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'editor_feather':
      ctx.save();
      ctx.strokeStyle = '#c0c8d0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const fy = -10 + i * 4;
        ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(8 - i, fy - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(-8 + i, fy - 4); ctx.stroke();
      }
      px(ctx, -1, -10, 2, 22, '#a0a8b0');
      ctx.restore();
      break;
    case 'sealing_grail':
      px(ctx, -6, -2, 12, 14, '#c8a040');
      px(ctx, -4, -14, 8, 14, '#d4b050');
      px(ctx, -8, 10, 16, 4, '#b89030');
      circ(ctx, 0, -8, 5, '#ffdd80');
      break;
    case 'car_key':
      circ(ctx, -5, 5, 6, '#8a8888');
      ctx.save();
      ctx.strokeStyle = '#6a6868';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-5, 5, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      px(ctx, -2, -8, 4, 14, '#a0a0a0');
      px(ctx, 2, -4, 4, 2, '#a0a0a0');
      px(ctx, 2, 0, 4, 2, '#a0a0a0');
      // Cinnamoroll dangling
      circ(ctx, 6, 10, 5, '#f5f5ff');
      circ(ctx, 4, 6, 3, '#f5f5ff');
      circ(ctx, 8, 6, 3, '#f5f5ff');
      circ(ctx, 8, 12, 2, '#ffaabb');
      circ(ctx, 4, 12, 2, '#ffaabb');
      break;
    case 'small_ticket':
      px(ctx, -11, -7, 22, 14, '#3a78c8');
      px(ctx, -9, -5, 18, 10, '#5a98e8');
      for (let i = 0; i < 4; i++) {
        px(ctx, -7 + i * 5, -3, 3, 2, '#ffffff');
        px(ctx, -7 + i * 5, 1, 3, 2, '#ffffff');
      }
      break;
    case 'familiar_piece':
      circ(ctx, 0, 0, 10, '#e8d5b7');
      circ(ctx, -3, -3, 4, '#f0e0c8');
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        circ(ctx, Math.cos(angle) * 8, Math.sin(angle) * 8, 2, '#ffd080');
      }
      break;
    default:
      circ(ctx, 0, 0, 10, '#888');
  }
  ctx.restore();
}
