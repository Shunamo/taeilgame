/**
 * PreloadScene.ts
 * Loads all assets before the game begins.
 * Shows a loading bar. Falls back gracefully if assets are missing.
 *
 * All player-facing strings below are in Korean.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.drawLoadingScreen();

    // ── Characters (with graceful missing-asset fallback) ────────────────────
    const chars = [
      'player', 'teemo', 'clerk', 'shopkeeper', 'elder',
      'npc1', 'cinnamoroll', 'tahm_kench', 'guest_c',
    ];
    chars.forEach((c) => {
      this.load.image(`sprite_${c}`, `/assets/characters/${c}.png`);
      this.load.image(`portrait_${c}`, `/assets/characters/portrait_${c}.png`);
    });

    // ── Backgrounds ──────────────────────────────────────────────────────────
    [
      'bedroom_bg', 'meadow_bg', 'village_bg',
      'forest_bg', 'mansion_bg',
    ].forEach((bg) => {
      this.load.image(bg, `/assets/backgrounds/${bg}.png`);
    });

    // ── UI ───────────────────────────────────────────────────────────────────
    [
      'dialogue_box', 'card_template', 'lottery_bg',
      'chest_closed', 'chest_open',
    ].forEach((ui) => {
      this.load.image(ui, `/assets/ui/${ui}.png`);
    });

    // ── Items ────────────────────────────────────────────────────────────────
    [
      'item_car_key', 'item_ticket', 'item_star',
      'item_photo', 'item_letter',
      'item_resident_card', 'item_lottery',
    ].forEach((item) => {
      this.load.image(item, `/assets/ui/items/${item}.png`);
    });

    // ── Audio ────────────────────────────────────────────────────────────────
    // Commented out until audio files are in place.
    // this.load.audio('bgm_bedroom', '/assets/audio/bgm_bedroom.mp3');
    // this.load.audio('bgm_meadow',  '/assets/audio/bgm_meadow.mp3');
    // this.load.audio('sfx_portal',  '/assets/audio/sfx_portal.mp3');

    // ── Progress bar ─────────────────────────────────────────────────────────
    this.load.on('progress', this.updateProgressBar, this);
    this.load.on('complete', this.onLoadComplete, this);

    // Don't fail the whole preload on a 404 — just warn
    this.load.on('loaderror', (file: { key: string }) => {
      console.warn(`[Preload] Asset missing: ${file.key} — using placeholder`);
    });
  }

  create() {
    // All placeholders are generated in each scene via Graphics API.
    // Transition to the first real scene.
    this.scene.start('BedroomScene');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private barGraphics?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;

  private drawLoadingScreen() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d2b, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    for (let i = 0; i < 60; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.6));
      bg.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT * 0.7),
        Phaser.Math.FloatBetween(0.5, 1.5)
      );
    }

    // Title
    this.add.text(cx, cy - 80, '별빛 마을 어드벤처', {
      fontFamily: "'Noto Sans KR', sans-serif",
      fontSize: '22px',
      color: '#f0eee8',
      stroke: '#0d0d2b',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Progress bar track
    const trackW = 200;
    const trackH = 8;
    const trackX = cx - trackW / 2;
    const trackY = cy - 20;

    const track = this.add.graphics();
    track.fillStyle(0x1a1a45, 1);
    track.fillRoundedRect(trackX, trackY, trackW, trackH, 4);

    // Progress bar fill
    this.barGraphics = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(cx, cy + 10, '불러오는 중...', {
      fontFamily: "'Noto Sans KR', sans-serif",
      fontSize: '13px',
      color: '#8888aa',
    }).setOrigin(0.5);
  }

  private updateProgressBar(value: number) {
    if (!this.barGraphics) return;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const trackW = 200;
    const trackH = 8;
    const trackX = cx - trackW / 2;
    const trackY = cy - 20;

    this.barGraphics.clear();
    this.barGraphics.fillStyle(0x4a9eff, 1);
    this.barGraphics.fillRoundedRect(
      trackX, trackY, trackW * value, trackH, 4
    );
  }

  private onLoadComplete() {
    if (this.loadingText) {
      this.loadingText.setText('완료!');
    }
  }
}
