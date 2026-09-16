/**
 * MeadowScene.ts
 * Scene 2: Fantasy Meadow — meets Teemo.
 * STUB — full implementation in Milestone 2.
 *
 * Currently: fades in, shows placeholder meadow, triggers Teemo crash dialogue.
 */

import Phaser from 'phaser';
import { EventBridge } from '../EventBridge';
import { getGameState } from '@/state/GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const W = GAME_WIDTH;
const H = GAME_HEIGHT;

export class MeadowScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MeadowScene' });
  }

  create() {
    getGameState().setCurrentScene('meadow');

    // Fade in from black
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.drawPlaceholderMeadow();

    this.time.delayedCall(1000, () => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'meadow_landing',
        onComplete: () => {
          this.time.delayedCall(300, () => {
            EventBridge.emit('show_dialogue', {
              sequenceId: 'meadow_crash',
              onComplete: () => {
                EventBridge.emit('show_dialogue', {
                  sequenceId: 'meadow_party_invite',
                  onComplete: () => {
                    // Quest: get resident card
                    getGameState().setQuest('get_resident_card', 'active');
                    EventBridge.emit('show_quest_popup', { questId: 'get_resident_card' });
                  },
                });
              },
            });
          });
        },
      });
    });
  }

  private drawPlaceholderMeadow() {
    const g = this.add.graphics();

    // Sky gradient (approximate with rectangles)
    g.fillStyle(0x87ceeb, 1);
    g.fillRect(0, 0, W, H * 0.55);

    // Sun
    g.fillStyle(0xfff0a0, 1);
    g.fillCircle(W * 0.75, H * 0.12, 28);
    // Sun glow
    g.fillStyle(0xfff0a0, 0.2);
    g.fillCircle(W * 0.75, H * 0.12, 48);

    // Distant mountains
    g.fillStyle(0x9ab0c8, 0.6);
    g.fillTriangle(0, H * 0.5, W * 0.2, H * 0.22, W * 0.4, H * 0.5);
    g.fillTriangle(W * 0.2, H * 0.5, W * 0.45, H * 0.18, W * 0.7, H * 0.5);
    g.fillTriangle(W * 0.5, H * 0.5, W * 0.78, H * 0.25, W, H * 0.5);

    // Ground
    g.fillStyle(0x4a9e4a, 1);
    g.fillRect(0, H * 0.52, W, H * 0.48);

    // Meadow highlight (lighter green strip)
    g.fillStyle(0x5ab85a, 1);
    g.fillRect(0, H * 0.52, W, H * 0.06);

    // Simple flowers (colored dots)
    const flowerColors = [0xff6b9d, 0xffcc44, 0xff8844, 0xffffff, 0xcc88ff];
    for (let i = 0; i < 30; i++) {
      const fc = flowerColors[i % flowerColors.length];
      const fx = Phaser.Math.Between(0, W);
      const fy = Phaser.Math.Between(H * 0.53, H * 0.7);
      g.fillStyle(fc, 0.8);
      g.fillCircle(fx, fy, Phaser.Math.FloatBetween(2, 5));
    }

    // Placeholder: "Teemo" character (green circle)
    g.fillStyle(0x2ecc40, 1);
    g.fillCircle(W * 0.55, H * 0.58, 18);
    // Hat
    g.fillStyle(0xff2222, 1);
    g.fillEllipse(W * 0.55, H * 0.565, 30, 12);
    g.fillRect(W * 0.547, H * 0.54, 6, H * 0.025);

    // Placeholder: player character (blue circle, just landed)
    g.fillStyle(0x4a9eff, 1);
    g.fillCircle(W * 0.42, H * 0.58, 18);
    // Hair
    g.fillStyle(0x1a1010, 1);
    g.fillEllipse(W * 0.42, H * 0.567, 30, 14);

    // Stars in sky
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 0.7));
      g.fillCircle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(10, H * 0.15),
        1
      );
    }

    // Label (dev helper, remove in production)
    this.add.text(W / 2, H * 0.1, '[임시 화면 — 초원]', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#ffffff44',
    }).setOrigin(0.5);
  }
}
