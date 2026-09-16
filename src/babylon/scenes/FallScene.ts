/**
 * FallScene.ts
 * Scene 1B — Surreal falling tunnel between reality and fantasy.
 *
 * Visual elements:
 *  - Dark void background
 *  - Floating paper fragments, room debris
 *  - Green-blue portal light trails
 *  - Star-like particles
 *  - Color palette transitions: navy → emerald/cyan → white → sky blue
 *  - Taeil character spinning/falling
 *
 * Runs for a fixed duration (≈ 4s) then calls onComplete.
 */

import {
  Scene,
  Engine,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  FreeCamera,
  MeshBuilder,
  TransformNode,
  Animation,
  ParticleSystem,
  StandardMaterial,
} from '@babylonjs/core';

import { EventBridge } from '@/game/EventBridge';
import { createUnlitMaterial, createFlatMaterial } from '../utils/Materials';
import { buildTaeil } from '../utils/Characters';
import { CHARACTER_COLORS } from '../assets/AssetRegistry';

// Duration in milliseconds
const FALL_DURATION = 4200;

export class FallScene {
  private scene: Scene;
  private camera!: FreeCamera;
  private taeilRoot!: TransformNode;
  private onComplete: () => void;

  constructor(engine: Engine, onComplete: () => void) {
    this.onComplete = onComplete;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.0, 0.0, 0.06, 1);
  }

  async build(): Promise<void> {
    this._setupCamera();
    this._setupLights();
    this._buildTaeil();
    this._buildParticles();
    this._buildDebris();
    this._animate();

    this.scene.getEngine().runRenderLoop(() => {
      if (this.scene) this.scene.render();
    });
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  private _setupCamera(): void {
    this.camera = new FreeCamera('fall_cam', new Vector3(0, 0, -4), this.scene);
    this.camera.setTarget(new Vector3(0, 0, 0));
    this.camera.minZ = 0.01;
  }

  // ── Lights ─────────────────────────────────────────────────────────────────

  private _setupLights(): void {
    const amb = new HemisphericLight('fall_amb', new Vector3(0, 1, 0), this.scene);
    amb.intensity = 0.1;
    amb.diffuse = new Color3(0.2, 0.9, 0.6);
    amb.groundColor = new Color3(0.0, 0.1, 0.3);
  }

  // ── Taeil falling ──────────────────────────────────────────────────────────

  private _buildTaeil(): void {
    this.taeilRoot = buildTaeil(this.scene, CHARACTER_COLORS.taeil);
    this.taeilRoot.position = new Vector3(0, 0, 0);

    // Spin + fall animation
    const spinAnim = new Animation('taeilSpin', 'rotation.z', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    spinAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 60, value: Math.PI * 2 },
    ]);

    const fallAnim = new Animation('taeilFall', 'position.y', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    fallAnim.setKeys([
      { frame: 0, value: 1.2 },
      { frame: 252, value: -1.2 },
    ]);

    // Slight drift
    const driftAnim = new Animation('taeilDrift', 'position.x', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    driftAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 60, value: 0.3 },
      { frame: 120, value: -0.2 },
      { frame: 180, value: 0.1 },
      { frame: 240, value: 0 },
    ]);

    this.taeilRoot.animations = [spinAnim, fallAnim, driftAnim];
    this.scene.beginAnimation(this.taeilRoot, 0, 252, false, 1);

    // Camera slowly rotates around Taeil
    const camRotAnim = new Animation('camRot', 'rotation.z', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camRotAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 252, value: Math.PI * 0.5 },
    ]);
    this.camera.animations = [camRotAnim];
    this.scene.beginAnimation(this.camera, 0, 252, false, 1);
  }

  // ── Background color transition ────────────────────────────────────────────

  private _animate(): void {
    const startTime = Date.now();
    let done = false;

    const renderFn = () => {
      if (done) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / FALL_DURATION, 1);

      // Color palette: dark navy → emerald → cyan → white → sky blue
      let r: number, g: number, b: number;
      if (t < 0.3) {
        const p = t / 0.3;
        r = 0.02 * p;
        g = 0.5 * p;
        b = 0.06 + 0.24 * p;
      } else if (t < 0.6) {
        const p = (t - 0.3) / 0.3;
        r = 0.02 + 0.03 * p;
        g = 0.5 + 0.35 * p;
        b = 0.3 + 0.6 * p;
      } else if (t < 0.85) {
        const p = (t - 0.6) / 0.25;
        r = 0.05 + 0.95 * p;
        g = 0.85 + 0.15 * p;
        b = 0.9 + 0.1 * p;
      } else {
        const p = (t - 0.85) / 0.15;
        r = 1.0 - 0.45 * p;
        g = 1.0 - 0.2 * p;
        b = 1.0;
      }

      this.scene.clearColor = new Color4(r, g, b, 1);

      if (elapsed >= FALL_DURATION) {
        done = true;
        this.scene.unregisterBeforeRender(renderFn);
        this._fadeToWhite();
      }
    };

    this.scene.registerBeforeRender(renderFn);
  }

  private _fadeToWhite(): void {
    this._fadeOut(400, () => this.onComplete());
  }

  private _fadeOut(durationMs: number, onDone: () => void): void {
    let opacity = 0;
    const step = 1 / (durationMs / 16);
    const iv = setInterval(() => {
      opacity += step;
      this.scene.clearColor = new Color4(1, 1, 1, Math.min(opacity, 1));
      if (opacity >= 1) { clearInterval(iv); onDone(); }
    }, 16);
  }

  // ── Particles ──────────────────────────────────────────────────────────────

  private _buildParticles(): void {
    // Star/glitter particles
    const stars = new ParticleSystem('fall_stars', 300, this.scene);
    stars.emitter = new Vector3(0, 0, -1);
    stars.minSize = 0.015;
    stars.maxSize = 0.06;
    stars.minLifeTime = 0.8;
    stars.maxLifeTime = 2.0;
    stars.emitRate = 80;
    stars.minEmitPower = 1.0;
    stars.maxEmitPower = 3.5;
    stars.color1 = new Color4(0.3, 1.0, 0.7, 1);
    stars.color2 = new Color4(0.5, 0.8, 1.0, 1);
    stars.colorDead = new Color4(0.8, 0.8, 0.8, 0);
    stars.direction1 = new Vector3(-2, -2, 2);
    stars.direction2 = new Vector3(2, 2, 2);
    stars.minAngularSpeed = -2;
    stars.maxAngularSpeed = 2;
    stars.start();

    // Light trail streaks
    const streaks = new ParticleSystem('fall_streaks', 100, this.scene);
    streaks.emitter = new Vector3(0, 0, -0.5);
    streaks.minSize = 0.03;
    streaks.maxSize = 0.12;
    streaks.minLifeTime = 0.4;
    streaks.maxLifeTime = 1.2;
    streaks.emitRate = 30;
    streaks.minEmitPower = 2;
    streaks.maxEmitPower = 5;
    streaks.color1 = new Color4(0.2, 0.9, 0.6, 0.8);
    streaks.color2 = new Color4(0.1, 0.7, 1.0, 0.8);
    streaks.colorDead = new Color4(1, 1, 1, 0);
    streaks.direction1 = new Vector3(-3, -1, 1);
    streaks.direction2 = new Vector3(3, 1, 1);
    streaks.start();
  }

  // ── Paper / room debris ────────────────────────────────────────────────────

  private _buildDebris(): void {
    const paperMat = createUnlitMaterial(this.scene, 'fall_paper', '#f5f0e0', 0.85);
    const darkPaperMat = createFlatMaterial(this.scene, 'fall_dark_paper', '#c0b890');

    for (let i = 0; i < 12; i++) {
      const paper = MeshBuilder.CreateBox('fp' + i, {
        width: 0.12 + Math.random() * 0.1,
        depth: 0.004,
        height: 0.18 + Math.random() * 0.08,
      }, this.scene);
      paper.material = i % 3 === 0 ? darkPaperMat : paperMat;

      // Random starting position spread around viewport
      paper.position = new Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        -0.5 + Math.random() * 2,
      );
      paper.rotation = new Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );

      // Drift animation
      const driftAnim = new Animation('drift' + i, 'position.y', 60,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      const startY = paper.position.y;
      driftAnim.setKeys([
        { frame: 0, value: startY },
        { frame: 60 + Math.random() * 40, value: startY - 0.6 - Math.random() * 0.5 },
        { frame: 120 + Math.random() * 30, value: startY - 1.2 },
      ]);
      const rotAnim = new Animation('rot' + i, 'rotation.z', 60,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      rotAnim.setKeys([
        { frame: 0, value: paper.rotation.z },
        { frame: 120, value: paper.rotation.z + Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1) },
      ]);
      paper.animations = [driftAnim, rotAnim];
      this.scene.beginAnimation(paper, 0, 120, true, 0.4 + Math.random() * 0.6);
    }
  }

  dispose(): void {
    this.scene?.dispose();
  }
}
