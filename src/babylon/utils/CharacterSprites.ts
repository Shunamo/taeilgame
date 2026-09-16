/**
 * CharacterSprites.ts
 * Billboard sprite characters drawn on canvas — chibi 2.5D style.
 *
 * Taeil (태일) — 160×240 canvas, BACK view
 *   Dark fluffy mushroom-cut hair, plaid flannel shirt over white tee,
 *   black backpack with bear keychain, charcoal wide-leg pants, gray sneakers.
 *
 * Teemo (티모) — 96×168 canvas, FRONT view
 *   Orange ginger cat, olive adventure hat, RED goggle pushed up on hat,
 *   blue plume, red neckerchief, brown leather vest, white belly.
 *
 * Both planes use Mesh.BILLBOARDMODE_Y.
 * Camera is behind Taeil → back-view art is correct.
 * Teemo always shows his face to the camera.
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  TransformNode,
  Mesh,
} from '@babylonjs/core';

// ── Canvas helper ──────────────────────────────────────────────────────────────

/** Rounded rect path — canvas compatible (no ctx.roundRect dependency). */
function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  const cr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.lineTo(x + w - cr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + cr);
  ctx.lineTo(x + w, y + h - cr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h);
  ctx.lineTo(x + cr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - cr);
  ctx.lineTo(x, y + cr);
  ctx.quadraticCurveTo(x, y, x + cr, y);
  ctx.closePath();
}

// ── Taeil — back-view sprite (160 × 240) ──────────────────────────────────────

function drawTaeilBack(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const cx = W / 2;
  ctx.clearRect(0, 0, W, H);

  // ── Gray sneakers ──
  ctx.fillStyle = '#a0a2a2';
  ctx.beginPath(); ctx.ellipse(cx - 20, H - 10, 20, 11, -0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, H - 10, 20, 11,  0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#787878'; // sole
  ctx.beginPath(); ctx.ellipse(cx - 20, H - 5,  20, 6, -0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, H - 5,  20, 6,  0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8c8c8'; // toe highlight
  ctx.beginPath(); ctx.ellipse(cx - 28, H - 14, 9, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 12, H - 14, 9, 4,  0.3, 0, Math.PI * 2); ctx.fill();

  // ── Charcoal wide-leg pants ──
  ctx.fillStyle = '#2c2c2e';
  rr(ctx, cx - 38, H - 96, 34, 84, 7); ctx.fill(); // left leg
  rr(ctx, cx +  4, H - 96, 34, 84, 7); ctx.fill(); // right leg
  ctx.fillRect(cx - 38, H - 96, 76, 26); // crotch gap
  ctx.fillStyle = '#3a3a3e'; // subtle seam
  ctx.fillRect(cx - 34, H - 90, 5, 72);
  ctx.fillRect(cx + 29, H - 90, 5, 72);

  // ── Brown plaid flannel shirt ──
  ctx.fillStyle = '#9a7240';
  rr(ctx, cx - 47, H - 190, 94, 100, 10); ctx.fill();
  // Plaid grid (clipped)
  ctx.save();
  rr(ctx, cx - 47, H - 190, 94, 100, 10); ctx.clip();
  ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 2.8;
  for (let i = 0; i <= 5; i++) { // vertical stripes
    ctx.beginPath(); ctx.moveTo(cx - 47 + i * 19, H - 190); ctx.lineTo(cx - 47 + i * 19, H - 90); ctx.stroke();
  }
  for (let i = 0; i <= 6; i++) { // horizontal stripes
    ctx.beginPath(); ctx.moveTo(cx - 47, H - 190 + i * 17); ctx.lineTo(cx + 47, H - 190 + i * 17); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(210,160,80,0.32)'; ctx.lineWidth = 1.1;
  for (let i = 0; i <= 11; i++) { // fine cross-hatch
    ctx.beginPath(); ctx.moveTo(cx - 47 + i * 8.5, H - 190); ctx.lineTo(cx - 47 + i * 8.5, H - 90); ctx.stroke();
  }
  ctx.restore();

  // White T-shirt collar peek
  ctx.fillStyle = '#f0ece4';
  rr(ctx, cx - 16, H - 192, 32, 14, 7); ctx.fill();

  // ── Arms (plaid sleeves) ──
  ctx.fillStyle = '#9a7240';
  rr(ctx, cx - 68, H - 188, 24, 84, 11); ctx.fill(); // left
  rr(ctx, cx + 44, H - 188, 24, 84, 11); ctx.fill(); // right
  ctx.save(); rr(ctx, cx - 68, H - 188, 24, 84, 11); ctx.clip();
  ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 2.5;
  for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 68, H - 188 + i * 17); ctx.lineTo(cx - 44, H - 188 + i * 17); ctx.stroke(); }
  ctx.restore();
  ctx.save(); rr(ctx, cx + 44, H - 188, 24, 84, 11); ctx.clip();
  ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 2.5;
  for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(cx + 44, H - 188 + i * 17); ctx.lineTo(cx + 68, H - 188 + i * 17); ctx.stroke(); }
  ctx.restore();
  // Hands
  ctx.fillStyle = '#d8a880';
  ctx.beginPath(); ctx.ellipse(cx - 56, H - 108, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 56, H - 108, 12, 12, 0, 0, Math.PI * 2); ctx.fill();

  // ── Black backpack ──
  ctx.fillStyle = '#1c1c1e';
  rr(ctx, cx - 29, H - 186, 58, 90, 9); ctx.fill(); // main body
  ctx.fillStyle = '#111114';
  rr(ctx, cx - 27, H - 184, 15, 82, 6); ctx.fill(); // left shadow
  // Front pocket
  ctx.fillStyle = '#252528';
  rr(ctx, cx - 21, H - 136, 42, 34, 7); ctx.fill();
  ctx.strokeStyle = '#3c3c40'; ctx.lineWidth = 1.2;
  rr(ctx, cx - 21, H - 136, 42, 34, 7); ctx.stroke();
  // Pocket zipper
  ctx.strokeStyle = '#646464'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(cx - 16, H - 122); ctx.lineTo(cx + 16, H - 122); ctx.stroke();
  ctx.fillStyle = '#909090';
  ctx.beginPath(); ctx.arc(cx, H - 122, 3.5, 0, Math.PI * 2); ctx.fill();
  // Top handle
  ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 8, H - 186); ctx.quadraticCurveTo(cx, H - 198, cx + 8, H - 186); ctx.stroke();
  // Shoulder straps
  ctx.strokeStyle = '#282830'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 25, H - 184); ctx.quadraticCurveTo(cx - 32, H - 150, cx - 32, H - 104); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 25, H - 184); ctx.quadraticCurveTo(cx + 32, H - 150, cx + 32, H - 104); ctx.stroke();
  // Strap buckles
  ctx.fillStyle = '#727272';
  rr(ctx, cx - 35, H - 140, 8, 10, 2); ctx.fill();
  rr(ctx, cx + 27, H - 140, 8, 10, 2); ctx.fill();

  // ── Bear keychain (hanging from backpack) ──
  const bx = cx + 23;
  ctx.strokeStyle = '#909090'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx, H - 96); ctx.lineTo(bx, H - 80); ctx.stroke();
  ctx.fillStyle = '#e8d8b8'; // cream bear
  ctx.beginPath(); ctx.ellipse(bx, H - 70, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); // body
  ctx.beginPath(); ctx.ellipse(bx, H - 82, 8, 8, 0, 0, Math.PI * 2); ctx.fill(); // head
  ctx.beginPath(); ctx.ellipse(bx - 6, H - 88, 4, 4, 0, 0, Math.PI * 2); ctx.fill(); // left ear
  ctx.beginPath(); ctx.ellipse(bx + 6, H - 88, 4, 4, 0, 0, Math.PI * 2); ctx.fill(); // right ear
  ctx.fillStyle = '#eabaaa'; // inner ear
  ctx.beginPath(); ctx.ellipse(bx - 6, H - 88, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx + 6, H - 88, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1a0a'; // bear eyes
  ctx.beginPath(); ctx.ellipse(bx - 2.5, H - 82, 1.8, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx + 2.5, H - 82, 1.8, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a40'; // bear nose
  ctx.beginPath(); ctx.ellipse(bx, H - 78, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();

  // ── Glasses temples (barely visible from back sides) ──
  ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 32, H - 218); ctx.lineTo(cx - 38, H - 216); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 32, H - 218); ctx.lineTo(cx + 38, H - 216); ctx.stroke();

  // ── FLUFFY dark brown hair ──
  const hc = '#3a2416'; const hl = '#5c3c28';
  // Base — lower back hair
  ctx.fillStyle = hc;
  ctx.beginPath(); ctx.ellipse(cx, H - 204, 30, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 32, H - 216, 16, 26, -0.3, 0, Math.PI * 2); ctx.fill(); // left side
  ctx.beginPath(); ctx.ellipse(cx + 32, H - 216, 16, 26,  0.3, 0, Math.PI * 2); ctx.fill(); // right side
  // Main hair mass
  ctx.beginPath(); ctx.ellipse(cx, H - 226, 38, 32, 0, 0, Math.PI * 2); ctx.fill();
  // Top fluffy clumps (overlapping blobs = natural fluffy texture)
  const clumps: [number, number, number, number, number][] = [
    [cx - 18, H - 244, 15, 18, -0.1],
    [cx,      H - 252, 16, 20, 0],
    [cx + 18, H - 244, 15, 18,  0.1],
    [cx - 28, H - 234, 13, 17, -0.2],
    [cx + 28, H - 234, 13, 17,  0.2],
    [cx - 8,  H - 248, 12, 17, -0.05],
    [cx + 8,  H - 248, 12, 16,  0.05],
    [cx - 4,  H - 238, 14, 15,  0],
    [cx + 12, H - 240, 10, 13,  0.15],
    [cx - 12, H - 240, 10, 13, -0.15],
  ];
  ctx.fillStyle = hc;
  for (const [hx, hy, rw, rh, rot] of clumps) {
    ctx.beginPath(); ctx.ellipse(hx, hy, rw, rh, rot, 0, Math.PI * 2); ctx.fill();
  }
  // Hair highlights
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.ellipse(cx - 11, H - 238, 12, 10, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 6,  H - 248, 10, 9,  0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 24, H - 228, 8,  9, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, H - 240, 8,  9,  0.2, 0, Math.PI * 2); ctx.fill();
}

// ── Teemo (티모) — front-view CAT sprite (96 × 168) ─────────────────────────
// Orange ginger cat, olive adventure hat, red goggles, blue plume, red scarf.

function drawTeemoFront(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const cx = W / 2;
  ctx.clearRect(0, 0, W, H);

  // ── Paws / feet ──
  ctx.fillStyle = '#e09040';
  ctx.beginPath(); ctx.ellipse(cx - 14, H - 8,  14, 8, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 14, H - 8,  14, 8,  0.1, 0, Math.PI * 2); ctx.fill();
  // Toe pads
  ctx.fillStyle = '#c07030';
  ctx.beginPath(); ctx.ellipse(cx - 18, H - 10,  4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 11, H -  7,  4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 11, H - 10,  4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 18, H -  7,  4, 3, 0, 0, Math.PI * 2); ctx.fill();

  // ── Body (round, fluffy) ──
  ctx.fillStyle = '#d07828';
  ctx.beginPath(); ctx.ellipse(cx, H - 52, 32, 46, 0, 0, Math.PI * 2); ctx.fill();
  // Brown leather vest/jacket
  ctx.fillStyle = '#6a4820';
  ctx.beginPath(); ctx.ellipse(cx, H - 54, 26, 38, 0, 0, Math.PI * 2); ctx.fill();
  // Vest center seam
  ctx.strokeStyle = '#4a3010'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, H - 90); ctx.lineTo(cx, H - 22); ctx.stroke();
  // White belly
  ctx.fillStyle = '#f8ece0';
  ctx.beginPath(); ctx.ellipse(cx, H - 50, 15, 26, 0, 0, Math.PI * 2); ctx.fill();
  // Belt
  ctx.fillStyle = '#c89040';
  rr(ctx, cx - 18, H - 32, 36, 10, 2); ctx.fill();
  ctx.fillStyle = '#a07030';
  rr(ctx, cx - 4, H - 30, 8, 7, 1); ctx.fill();
  // Adventure pouches / buckles
  ctx.fillStyle = '#c89040';
  ctx.beginPath(); ctx.ellipse(cx - 20, H - 64, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, H - 64, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a07030';
  ctx.beginPath(); ctx.ellipse(cx - 20, H - 64, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, H - 64, 3, 3, 0, 0, Math.PI * 2); ctx.fill();

  // ── Arms (orange fur) ──
  ctx.fillStyle = '#e09040';
  ctx.beginPath(); ctx.ellipse(cx - 36, H - 64, 11, 24, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 36, H - 64, 11, 24,  0.2, 0, Math.PI * 2); ctx.fill();
  // Paw hands
  ctx.beginPath(); ctx.ellipse(cx - 38, H - 42, 11, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 38, H - 42, 11, 11, 0, 0, Math.PI * 2); ctx.fill();

  // ── Red neckerchief / scarf ──
  ctx.fillStyle = '#d02020';
  ctx.beginPath(); ctx.ellipse(cx, H - 96, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ee3535'; // knot
  ctx.beginPath(); ctx.ellipse(cx - 5, H - 92, 8, 9, 0.2, 0, Math.PI * 2); ctx.fill();
  // Scarf tails
  ctx.fillStyle = '#d02020';
  ctx.beginPath();
  ctx.moveTo(cx - 5, H - 88);
  ctx.quadraticCurveTo(cx - 12, H - 72, cx - 16, H - 66);
  ctx.quadraticCurveTo(cx - 8, H - 68, cx + 2, H - 80);
  ctx.fill();

  // ── Orange cat head ──
  ctx.fillStyle = '#e09040';
  ctx.beginPath(); ctx.ellipse(cx, H - 110, 32, 30, 0, 0, Math.PI * 2); ctx.fill();
  // White muzzle area
  ctx.fillStyle = '#f8ece0';
  ctx.beginPath(); ctx.ellipse(cx, H - 103, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
  // Head shading (depth)
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath(); ctx.ellipse(cx + 16, H - 112, 14, 24, 0.2, 0, Math.PI * 2); ctx.fill();

  // ── Cat ears (triangle, partially behind hat brim) ──
  ctx.fillStyle = '#e09040';
  ctx.beginPath(); ctx.moveTo(cx - 26, H - 128); ctx.lineTo(cx - 38, H - 150); ctx.lineTo(cx - 14, H - 136); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 26, H - 128); ctx.lineTo(cx + 38, H - 150); ctx.lineTo(cx + 14, H - 136); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8a0a0'; // inner ear pink
  ctx.beginPath(); ctx.moveTo(cx - 26, H - 130); ctx.lineTo(cx - 34, H - 146); ctx.lineTo(cx - 16, H - 136); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 26, H - 130); ctx.lineTo(cx + 34, H - 146); ctx.lineTo(cx + 16, H - 136); ctx.closePath(); ctx.fill();

  // ── Eyes (big, cute — brown iris, vertical slit pupil) ──
  ctx.fillStyle = '#f4f0e8'; // whites
  ctx.beginPath(); ctx.ellipse(cx - 11, H - 112, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 11, H - 112, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4820'; // brown iris
  ctx.beginPath(); ctx.ellipse(cx - 11, H - 112, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 11, H - 112, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0a0806'; // pupils (vertical slit)
  ctx.beginPath(); ctx.ellipse(cx - 11, H - 112, 2.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 11, H - 112, 2.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; // eye shine
  ctx.beginPath(); ctx.ellipse(cx - 14, H - 116, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 8,  H - 116, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

  // ── Cat nose (pink triangle) ──
  ctx.fillStyle = '#e86080';
  ctx.beginPath(); ctx.moveTo(cx, H - 100); ctx.lineTo(cx - 4, H - 95); ctx.lineTo(cx + 4, H - 95); ctx.closePath(); ctx.fill();

  // ── Cat smile (W-shape) ──
  ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, H - 90);
  ctx.quadraticCurveTo(cx - 3, H - 86, cx, H - 88);
  ctx.quadraticCurveTo(cx + 3, H - 86, cx + 8, H - 90);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = 'rgba(200,180,160,0.65)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 6, H - 96); ctx.lineTo(cx - 24, H - 94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 6, H - 99); ctx.lineTo(cx - 24, H - 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 6, H - 96); ctx.lineTo(cx + 24, H - 94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 6, H - 99); ctx.lineTo(cx + 24, H - 100); ctx.stroke();

  // Cheek blush
  ctx.fillStyle = 'rgba(220,100,80,0.18)';
  ctx.beginPath(); ctx.ellipse(cx - 22, H - 105, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 22, H - 105, 9, 6, 0, 0, Math.PI * 2); ctx.fill();

  // ── Hat brim (olive green, sits on head) ──
  ctx.fillStyle = '#5a6e28';
  ctx.beginPath(); ctx.ellipse(cx, H - 130, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#485820'; // brim underside
  ctx.beginPath(); ctx.ellipse(cx, H - 130, 40, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a4818'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(cx, H - 130, 40, 10, 0, 0, Math.PI * 2); ctx.stroke();

  // ── Red goggles (pushed up on hat, between brim and dome) ──
  // Left goggle
  ctx.fillStyle = 'rgba(145, 28, 18, 0.92)';
  ctx.beginPath(); ctx.ellipse(cx - 13, H - 142, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#280808'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(cx - 13, H - 142, 11, 8, 0, 0, Math.PI * 2); ctx.stroke();
  // Right goggle
  ctx.fillStyle = 'rgba(145, 28, 18, 0.92)';
  ctx.beginPath(); ctx.ellipse(cx + 13, H - 142, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#280808';
  ctx.beginPath(); ctx.ellipse(cx + 13, H - 142, 11, 8, 0, 0, Math.PI * 2); ctx.stroke();
  // Lens inner tint (slightly lighter center)
  ctx.fillStyle = 'rgba(200, 60, 40, 0.45)';
  ctx.beginPath(); ctx.ellipse(cx - 13, H - 142, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 13, H - 142, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Bridge
  ctx.strokeStyle = '#280808'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 2, H - 142); ctx.lineTo(cx + 2, H - 142); ctx.stroke();
  // Goggle strap
  ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 24, H - 140); ctx.lineTo(cx - 38, H - 136); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 24, H - 140); ctx.lineTo(cx + 38, H - 136); ctx.stroke();
  // Goggle lens reflections
  ctx.fillStyle = 'rgba(255,200,180,0.38)';
  ctx.beginPath(); ctx.ellipse(cx - 17, H - 146, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 9,  H - 146, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

  // ── Hat dome (olive green, half-ellipse above brim) ──
  ctx.fillStyle = '#6a8030';
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, H - 130, 36, 32, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Hat band (darker strip just above brim)
  ctx.fillStyle = '#4e5e1e';
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, H - 132, 35, 9, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Dome shading (right side)
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx + 18, H - 132, 16, 26, 0.3, Math.PI, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Dome highlight (left)
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx - 12, H - 140, 12, 18, -0.2, Math.PI, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Dome outline
  ctx.strokeStyle = '#3a4818'; ctx.lineWidth = 1.5;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, H - 130, 36, 32, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // ── Blue plume / feather ──
  // Back petal (darker)
  ctx.fillStyle = '#2050c8';
  ctx.beginPath();
  ctx.moveTo(cx - 3, H - 152);
  ctx.quadraticCurveTo(cx - 12, H - 168, cx - 7, H - 184);
  ctx.quadraticCurveTo(cx - 2, H - 170, cx + 5, H - 154);
  ctx.closePath(); ctx.fill();
  // Front petal (brighter)
  ctx.fillStyle = '#3870e0';
  ctx.beginPath();
  ctx.moveTo(cx, H - 152);
  ctx.quadraticCurveTo(cx + 8, H - 166, cx + 5, H - 182);
  ctx.quadraticCurveTo(cx + 2, H - 168, cx - 3, H - 154);
  ctx.closePath(); ctx.fill();
  // Plume highlight
  ctx.fillStyle = '#70a8ff';
  ctx.beginPath();
  ctx.moveTo(cx + 1, H - 154);
  ctx.quadraticCurveTo(cx + 5, H - 166, cx + 4, H - 178);
  ctx.quadraticCurveTo(cx + 1, H - 166, cx - 1, H - 156);
  ctx.closePath(); ctx.fill();
  // Quill
  ctx.strokeStyle = '#1840a0'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx + 1, H - 152); ctx.lineTo(cx + 3, H - 180); ctx.stroke();
}

// ── Texture factory ─────────────────────────────────────────────────────────────

function makeCanvasTexture(
  scene: Scene,
  name: string,
  W: number,
  H: number,
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void,
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, W, H);
  const dataUrl = canvas.toDataURL('image/png');
  const tex = new Texture(dataUrl, scene, false, true, Texture.BILINEAR_SAMPLINGMODE);
  tex.hasAlpha = true;
  return tex;
}

// ── Billboard plane factory ─────────────────────────────────────────────────────

function makeBillboardPlane(
  scene: Scene,
  name: string,
  width: number,
  height: number,
  tex: Texture,
  yCenter: number,
): Mesh {
  const mat = new StandardMaterial(name + '_mat', scene);
  mat.diffuseTexture = tex;
  mat.emissiveColor  = new Color3(0.92, 0.92, 0.92); // pre-lit
  mat.specularColor  = new Color3(0, 0, 0);
  mat.useAlphaFromDiffuseTexture = true;
  mat.backFaceCulling = false;

  const plane = MeshBuilder.CreatePlane(name, { width, height, sideOrientation: Mesh.FRONTSIDE }, scene);
  plane.material     = mat;
  plane.billboardMode = Mesh.BILLBOARDMODE_Y;
  plane.position.y   = yCenter;
  return plane;
}

// ── Shadow disc ────────────────────────────────────────────────────────────────

function makeShadow(scene: Scene, name: string, radius: number): Mesh {
  const mat = new StandardMaterial(name + '_shd_mat', scene);
  mat.diffuseColor = new Color3(0, 0, 0);
  mat.alpha        = 0.20;
  const disc = MeshBuilder.CreateDisc(name + '_shadow', { radius, tessellation: 24 }, scene);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 0.01;
  disc.material   = mat;
  return disc;
}

// ── Public builders ────────────────────────────────────────────────────────────

/**
 * Taeil billboard — back-view chibi sprite.
 * Plane 1.4 × 2.1 world units (feet at root y = 0).
 * Canvas aspect 160:240 = 2:3 matches plane aspect 1.4:2.1 = 2:3.
 */
export function buildTaeilSprite(scene: Scene): TransformNode {
  const root   = new TransformNode('taeil_sprite_root', scene);
  const planeH = 2.1;

  const tex   = makeCanvasTexture(scene, 'taeil_tex', 160, 240, drawTaeilBack);
  const plane = makeBillboardPlane(scene, 'taeil_plane', 1.4, planeH, tex, planeH / 2);
  plane.parent = root;

  const shadow = makeShadow(scene, 'taeil', 0.44);
  shadow.parent = root;

  return root;
}

/**
 * Teemo (티모) billboard — front-view cat sprite.
 * ≈ 35 % of Taeil's height (knee-level companion).
 * Plane 0.42 × 0.74 world units.
 * Canvas aspect 96:168 = 4:7 matches plane aspect 0.42:0.735 ≈ 4:7.
 */
export function buildCompanionSprite(scene: Scene): TransformNode {
  const root   = new TransformNode('companion_sprite_root', scene);
  const planeH = 0.74;

  const tex   = makeCanvasTexture(scene, 'companion_tex', 96, 168, drawTeemoFront);
  const plane = makeBillboardPlane(scene, 'companion_plane', 0.42, planeH, tex, planeH / 2);
  plane.parent = root;

  const shadow = makeShadow(scene, 'companion', 0.18);
  shadow.parent = root;

  return root;
}
