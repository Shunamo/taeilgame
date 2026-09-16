/**
 * BedroomScene.ts
 * Scene 1: The protagonist is asleep. A portal opens under the bed.
 * He falls through and is transported to the fantasy meadow.
 *
 * Sequence:
 *  1. Dark bedroom — ambient star twinkle
 *  2. Narration dialogue ("조용한 밤이다...")
 *  3. Green glow grows under the bed
 *  4. Glow narration dialogue
 *  5. Screen shake + player slides off bed
 *  6. Flash white → fade to black
 *  7. Transition to MeadowScene
 */

import Phaser from 'phaser';
import { EventBridge } from '../EventBridge';
import { getGameState } from '@/state/GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const W = GAME_WIDTH;
const H = GAME_HEIGHT;

export class BedroomScene extends Phaser.Scene {
  // Scene layers
  private bgLayer!: Phaser.GameObjects.Graphics;
  private furnitureLayer!: Phaser.GameObjects.Graphics;
  private glowLayer!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Graphics;

  // Glow state
  private glowTween?: Phaser.Tweens.Tween;
  private glowParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private glowIntensity = 0;

  // Ambient star twinkle handles
  private starObjects: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'BedroomScene' });
  }

  create() {
    // Mark scene in global state
    getGameState().setCurrentScene('bedroom');

    this.drawBackground();
    this.drawFurniture();
    this.drawPlayer();
    this.addAmbientTwinkle();
    this.addAmbientDust();

    // Block Phaser input while dialogue is open
    EventBridge.on('phaser_input_blocked', (blocked) => {
      this.input.enabled = !blocked;
    });

    // Start the sequence after a brief pause so the scene fully renders
    this.time.delayedCall(800, () => this.startNarration());
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  private drawBackground() {
    this.bgLayer = this.add.graphics();

    // Sky through window (very dark blue night)
    this.bgLayer.fillStyle(0x050510, 1);
    this.bgLayer.fillRect(0, 0, W, H);

    // Room wall (slightly lighter)
    this.bgLayer.fillStyle(0x111128, 1);
    this.bgLayer.fillRect(0, H * 0.22, W, H * 0.78);

    // Floor boards
    this.bgLayer.fillStyle(0x1c100a, 1);
    this.bgLayer.fillRect(0, H * 0.74, W, H * 0.26);
    // Floor grain lines
    this.bgLayer.lineStyle(1, 0x2a1810, 0.6);
    for (let y = H * 0.74; y < H; y += 18) {
      this.bgLayer.lineBetween(0, y, W, y);
    }

    // Window frame
    const winX = W * 0.62;
    const winY = H * 0.08;
    const winW = W * 0.28;
    const winH = H * 0.14;

    // Window glass (night sky)
    this.bgLayer.fillStyle(0x070718, 1);
    this.bgLayer.fillRect(winX, winY, winW, winH);

    // Moon
    this.bgLayer.fillStyle(0xf0e8c0, 0.9);
    this.bgLayer.fillCircle(winX + winW * 0.7, winY + winH * 0.3, 11);
    // Moon crescent cutout
    this.bgLayer.fillStyle(0x070718, 1);
    this.bgLayer.fillCircle(winX + winW * 0.7 + 7, winY + winH * 0.3 - 3, 9);

    // Stars in window
    const starPositions = [
      [winX + 10, winY + 12], [winX + 30, winY + 25],
      [winX + winW * 0.3, winY + 8],  [winX + winW * 0.5, winY + winH * 0.6],
      [winX + winW * 0.15, winY + winH * 0.7], [winX + winW * 0.8, winY + winH * 0.8],
      [winX + winW * 0.6, winY + winH * 0.4],
    ];
    starPositions.forEach(([sx, sy]) => {
      this.bgLayer.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.4, 0.9));
      this.bgLayer.fillCircle(sx, sy, Phaser.Math.FloatBetween(0.8, 1.5));
    });

    // Window frame border
    this.bgLayer.lineStyle(3, 0x3a3050, 1);
    this.bgLayer.strokeRect(winX, winY, winW, winH);
    // Cross dividers
    this.bgLayer.lineBetween(winX + winW / 2, winY, winX + winW / 2, winY + winH);
    this.bgLayer.lineBetween(winX, winY + winH / 2, winX + winW, winY + winH / 2);

    // Curtains
    this.bgLayer.fillStyle(0x2a1a40, 0.85);
    // Left curtain
    this.bgLayer.fillTriangle(
      winX - 12, winY - 5,
      winX + winW * 0.28, winY - 5,
      winX - 2, winY + winH + 5
    );
    // Right curtain
    this.bgLayer.fillTriangle(
      winX + winW + 12, winY - 5,
      winX + winW * 0.72, winY - 5,
      winX + winW + 2, winY + winH + 5
    );

    // Desk (left side)
    this.bgLayer.fillStyle(0x2a1a0e, 1);
    this.bgLayer.fillRect(W * 0.05, H * 0.45, W * 0.22, H * 0.3);
    // Desk surface highlight
    this.bgLayer.fillStyle(0x3a2a1e, 1);
    this.bgLayer.fillRect(W * 0.05, H * 0.45, W * 0.22, H * 0.03);
    // Desk item (book)
    this.bgLayer.fillStyle(0x4a2a60, 1);
    this.bgLayer.fillRect(W * 0.07, H * 0.42, W * 0.08, H * 0.04);

    // Wall lamp glow (above desk)
    this.bgLayer.fillStyle(0xffcc66, 0.12);
    this.bgLayer.fillEllipse(W * 0.16, H * 0.35, 80, 60);
    this.bgLayer.fillStyle(0xaa7722, 1);
    this.bgLayer.fillRect(W * 0.13, H * 0.3, W * 0.06, H * 0.025);
  }

  private drawFurniture() {
    this.furnitureLayer = this.add.graphics();
    const g = this.furnitureLayer;

    // ── Bed frame ─────────────────────────────────────────────────────────────
    const bedX = W * 0.08;
    const bedY = H * 0.46;
    const bedW = W * 0.84;
    const bedH = H * 0.32;

    // Headboard
    g.fillStyle(0x2c180e, 1);
    g.fillRoundedRect(bedX, bedY - H * 0.05, bedW, H * 0.06, 4);

    // Bed frame sides
    g.fillStyle(0x241408, 1);
    g.fillRect(bedX, bedY, bedW, bedH);

    // Mattress
    g.fillStyle(0xb89870, 1);
    g.fillRoundedRect(bedX + 4, bedY + 2, bedW - 8, bedH - 12, 6);

    // Pillow
    g.fillStyle(0xeee8d8, 1);
    g.fillRoundedRect(bedX + W * 0.08, bedY + 6, W * 0.28, H * 0.072, 8);
    // Pillow crease
    g.lineStyle(1, 0xccccbb, 0.5);
    g.lineBetween(
      bedX + W * 0.22, bedY + 8,
      bedX + W * 0.22, bedY + H * 0.072
    );

    // Blanket / duvet
    g.fillStyle(0x3a5ea0, 1);
    g.fillRoundedRect(bedX + 4, bedY + H * 0.1, bedW - 8, bedH * 0.58, 6);
    // Blanket fold detail
    g.fillStyle(0x4a70b8, 0.6);
    g.fillRoundedRect(bedX + 4, bedY + H * 0.1, bedW - 8, H * 0.025, 3);
    // Blanket seam lines
    g.lineStyle(1, 0x2a4880, 0.4);
    g.lineBetween(bedX + bedW * 0.33, bedY + H * 0.12, bedX + bedW * 0.33, bedY + bedH * 0.55);
    g.lineBetween(bedX + bedW * 0.66, bedY + H * 0.12, bedX + bedW * 0.66, bedY + bedH * 0.55);

    // Footboard
    g.fillStyle(0x2c180e, 1);
    g.fillRect(bedX, bedY + bedH - 8, bedW, 10);

    // Bedside table (right)
    g.fillStyle(0x2a1a0e, 1);
    g.fillRect(W * 0.77, H * 0.5, W * 0.17, H * 0.22);
    g.fillStyle(0x3a2a1e, 1);
    g.fillRect(W * 0.77, H * 0.5, W * 0.17, H * 0.025);
    // Phone on table
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(W * 0.79, H * 0.498, W * 0.06, H * 0.03, 2);
    g.fillStyle(0x334466, 0.6);
    g.fillRoundedRect(W * 0.793, H * 0.5, W * 0.054, H * 0.025, 1);
  }

  private drawPlayer() {
    // Player sleeping figure — drawn relative to bed position
    const bedX = W * 0.08;
    const bedY = H * 0.46;
    const bedW = W * 0.84;

    this.playerSprite = this.add.graphics();
    const g = this.playerSprite;

    // Body under blanket (lump shape)
    g.fillStyle(0x4a70b8, 1);
    g.fillEllipse(bedX + bedW * 0.55, bedY + H * 0.2, bedW * 0.45, H * 0.072);

    // Head on pillow
    g.fillStyle(0xe8c090, 1);
    g.fillCircle(bedX + W * 0.22, bedY + H * 0.048, 18);

    // Hair (simple dark arc on top of head)
    g.fillStyle(0x1a1010, 1);
    g.fillEllipse(bedX + W * 0.22, bedY + H * 0.03, 34, 20);

    // Sleeping "zzz" — drawn as small text-like shapes
    // We use circles to simulate the z letters
    g.fillStyle(0xaaaacc, 0.5);
    g.fillCircle(bedX + W * 0.34, bedY + H * 0.0, 3);
    g.fillCircle(bedX + W * 0.37, bedY - H * 0.015, 4);
    g.fillCircle(bedX + W * 0.41, bedY - H * 0.03, 5);
  }

  private addAmbientTwinkle() {
    // Randomly twinkle the window stars
    for (let i = 0; i < 7; i++) {
      const star = this.add.graphics();
      const sx = Phaser.Math.Between(W * 0.64, W * 0.88);
      const sy = Phaser.Math.Between(H * 0.09, H * 0.21);
      const r  = Phaser.Math.FloatBetween(0.8, 1.5);
      star.fillStyle(0xffffff, 1);
      star.fillCircle(0, 0, r);
      star.setPosition(sx, sy);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
      this.starObjects.push(star);

      this.tweens.add({
        targets: star,
        alpha: { from: Phaser.Math.FloatBetween(0.1, 0.4), to: Phaser.Math.FloatBetween(0.6, 1) },
        duration: Phaser.Math.Between(1200, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut',
      });
    }
  }

  private addAmbientDust() {
    // Tiny floating dust particles in the room
    const particles = this.add.particles(0, 0, '__DEFAULT', {
      x: { min: 0, max: W },
      y: { min: H * 0.25, max: H * 0.75 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.15, end: 0 },
      tint: 0xaaaaff,
      lifespan: 4000,
      speed: { min: 2, max: 8 },
      angle: { min: -30, max: 30 },
      quantity: 1,
      frequency: 300,
    });
    particles.setDepth(50);
  }

  // ── Glow layer ─────────────────────────────────────────────────────────────

  private spawnGlow() {
    this.glowLayer = this.add.graphics();
    this.glowLayer.setDepth(10);

    // Portal under the bed
    const portalX = W / 2;
    const portalY = H * 0.76;
    const portalRX = W * 0.22;
    const portalRY = H * 0.04;

    // Multiple layered ellipses for glow
    const colors = [0x00ff88, 0x00cc66, 0x008844];
    const sizes  = [1.8, 1.3, 1.0];
    const alphas = [0.12, 0.2, 0.35];

    colors.forEach((color, i) => {
      this.glowLayer.fillStyle(color, alphas[i]);
      this.glowLayer.fillEllipse(portalX, portalY, portalRX * 2 * sizes[i], portalRY * 2 * sizes[i]);
    });

    // Pulsing tween on glow alpha
    this.glowTween = this.tweens.add({
      targets: this.glowLayer,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Secondary pulse
        this.tweens.add({
          targets: this.glowLayer,
          alpha: { from: 0.7, to: 1 },
          duration: 600,
          yoyo: true,
          repeat: 2,
          onComplete: () => this.triggerFall(),
        });
      },
    });

    // Green particle shower from portal
    this.glowParticles = this.add.particles(portalX, portalY, '__DEFAULT', {
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x00ff88, 0x44ffaa, 0x88ffcc],
      lifespan: 800,
      speed: { min: 20, max: 60 },
      angle: { min: -160, max: -20 },
      quantity: 3,
      frequency: 80,
    });
    this.glowParticles.setDepth(15);
  }

  // ── Sequence ───────────────────────────────────────────────────────────────

  private startNarration() {
    // Block Phaser input during dialogue
    EventBridge.emit('phaser_input_blocked', true);

    EventBridge.emit('show_dialogue', {
      sequenceId: 'bedroom_narration',
      onComplete: () => {
        // After narration, spawn the glow
        this.time.delayedCall(500, () => {
          this.spawnGlow();
          // Glow narration triggers after a short delay
          this.time.delayedCall(1200, () => {
            EventBridge.emit('show_dialogue', {
              sequenceId: 'bedroom_glow',
              onComplete: () => this.triggerFall(),
            });
          });
        });
      },
    });
  }

  private triggerFall() {
    EventBridge.emit('hide_dialogue', undefined as void);
    EventBridge.emit('phaser_input_blocked', false);

    this.time.delayedCall(300, () => {
      // Screen shake
      this.cameras.main.shake(600, 0.015);

      // Player slides off bed toward portal
      this.tweens.add({
        targets: this.playerSprite,
        y: H * 0.12,   // fall down toward portal
        alpha: 0,
        duration: 700,
        delay: 200,
        ease: 'Cubic.easeIn',
      });

      // Flash white
      this.time.delayedCall(900, () => {
        this.cameras.main.flash(400, 255, 255, 255);
        this.time.delayedCall(400, () => {
          this.cameras.main.fade(600, 0, 0, 0);
          this.time.delayedCall(650, () => {
            this.scene.start('MeadowScene');
          });
        });
      });
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  shutdown() {
    EventBridge.off('phaser_input_blocked');
    this.glowTween?.destroy();
    this.glowParticles?.destroy();
    this.starObjects = [];
  }
}
