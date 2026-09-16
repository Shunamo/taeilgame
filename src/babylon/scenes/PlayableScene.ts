/**
 * PlayableScene.ts
 * Scene 2 — Meadow / Village-entrance exploration area.
 * Player controls Taeil with WASD/↑↓←→ (desktop) or virtual joystick (mobile).
 *
 * Controls:
 *   Move   : WASD / Arrow keys  |  virtual joystick
 *   Interact: E / left click    |  상호작용 button
 *   Attack : J / left click     |  공격 button
 *   Skill  : K / right click    |  바람스킬 button
 *   Pause  : ESC                |  (no mobile pause button — use OS swipe)
 */

import {
  Scene,
  Engine,
  UniversalCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  TransformNode,
  ParticleSystem,
} from '@babylonjs/core';
import { createCelMaterial, createFlatMaterial, addOutline } from '@/babylon/utils/Materials';
import { buildTaeil, buildTeemo } from '@/babylon/utils/Characters';
import { CHARACTER_COLORS } from '@/babylon/assets/AssetRegistry';
import { inputManager } from '@/game/InputManager';
import { EventBridge } from '@/game/EventBridge';

const SPEED         = 4.2;   // units · s⁻¹
const INTERACT_DIST = 2.4;   // metres

type Phase = 'playing' | 'dialogue' | 'paused';

export class PlayableScene {
  readonly scene: Scene;
  private readonly _engine: Engine;

  private _camera!: UniversalCamera;
  private _player!: TransformNode;
  private _teemo!: TransformNode;

  private _phase: Phase = 'playing';
  private _disposed = false;

  private _attackCool = 0;
  private _skillCool  = 0;

  private _atkPS?: ParticleSystem;
  private _wndPS?: ParticleSystem;

  private _offShow?:     () => void;
  private _offHide?:     () => void;
  private _offComplete?: () => void;
  private _onComplete?: () => void;

  constructor(engine: Engine, onComplete?: () => void) {
    this._engine = engine;
    this._onComplete = onComplete;
    this.scene   = new Scene(engine);
    this.scene.clearColor = new Color4(0.42, 0.74, 1.0, 1);
  }

  async start(): Promise<void> {
    this._buildLights();
    this._buildTerrain();
    await this._buildCharacters();
    this._buildCamera();
    this._buildParticles();
    this._wireEvents();

    // Game logic runs before each render; scene.render() drives the display.
    this.scene.registerBeforeRender(this._update);
    this._engine.runRenderLoop(() => {
      if (!this._disposed) this.scene.render();
    });
  }

  // ── Lights ────────────────────────────────────────────────────────────────

  private _buildLights(): void {
    const sky = new HemisphericLight('sky', Vector3.Up(), this.scene);
    sky.intensity   = 1.10;
    sky.diffuse     = new Color3(0.88, 0.96, 1.0);
    sky.groundColor = new Color3(0.32, 0.70, 0.26);

    const sun = new DirectionalLight('sun', new Vector3(-0.45, -1, 0.38), this.scene);
    sun.intensity = 1.6;
    sun.diffuse   = new Color3(1.0, 0.95, 0.76);
  }

  // ── Terrain ───────────────────────────────────────────────────────────────

  private _buildTerrain(): void {
    const S = this.scene;

    // Ground
    const ground = MeshBuilder.CreateGround('ground', { width: 64, height: 64, subdivisions: 2 }, S);
    ground.material = createCelMaterial(S, 'gnd', '#52b040');

    // Central dirt path toward village
    const path = MeshBuilder.CreateGround('path', { width: 3.0, height: 30 }, S);
    path.material = createCelMaterial(S, 'pth', '#d4b468');
    path.position.set(0, 0.01, 6);

    // Village gate posts
    const gH = 3.2;
    for (const sx of [-2.4, 2.4]) {
      const p = MeshBuilder.CreateCylinder('gpost' + sx, { height: gH, diameter: 0.28 }, S);
      p.position.set(sx, gH / 2, 22);
      p.material = createCelMaterial(S, 'gpostm' + sx, '#9a6030');
      addOutline(p);
    }
    const bar = MeshBuilder.CreateBox('gbar', { width: 5.2, height: 0.24, depth: 0.24 }, S);
    bar.position.set(0, gH, 22);
    bar.material = createCelMaterial(S, 'gbarm', '#9a6030');
    addOutline(bar);

    // Sign board
    const sign = MeshBuilder.CreateBox('gsign', { width: 2.8, height: 0.82, depth: 0.14 }, S);
    sign.position.set(0, gH + 0.55, 22);
    sign.material = createCelMaterial(S, 'gsignm', '#f0d060');
    addOutline(sign);

    // Trees arranged in a loose boundary circle
    const trunkColors = ['#6a3c14', '#5a2e10', '#703818'];
    const canopyColors = ['#32a030', '#3aaa38', '#289828'];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 20 + (i % 3) * 2.8;
      const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      const th = 2.4 + (i % 3) * 0.7;

      const trunk = MeshBuilder.CreateCylinder('tr' + i, {
        height: th, diameterTop: 0.24, diameterBottom: 0.46,
      }, S);
      trunk.position.set(tx, th / 2, tz);
      trunk.material = createCelMaterial(S, 'trm' + i, trunkColors[i % 3]);
      addOutline(trunk);

      const canopy = MeshBuilder.CreateSphere('cn' + i, { diameter: 3.0 + (i % 2) * 0.4 }, S);
      canopy.position.set(tx, th + 1.1, tz);
      canopy.scaling.y = 0.78;
      canopy.material = createCelMaterial(S, 'cnm' + i, canopyColors[i % 3]);
      addOutline(canopy);
    }

    // Rocks
    for (let i = 0; i < 12; i++) {
      const r = MeshBuilder.CreateSphere('rock' + i, { diameter: 0.45 + (i % 3) * 0.25 }, S);
      r.scaling.y = 0.55;
      r.position.set(
        (i < 6 ? 4 : -4) + (Math.random() - 0.5) * 14,
        0.13,
        -2 + Math.random() * 20,
      );
      r.material = createCelMaterial(S, 'rockm' + i, ['#7a8878', '#8a8a7a', '#6a7870'][i % 3]);
      addOutline(r);
    }

    // Flowers scattered across field
    const fColors = ['#ff3366', '#ffcc11', '#cc44ff', '#22ddff', '#ff5500', '#ffffff', '#ffaacc'];
    for (let i = 0; i < 110; i++) {
      const h = 0.30 + Math.random() * 0.14;
      const stem = MeshBuilder.CreateCylinder('fs' + i, { height: h, diameter: 0.035 }, S);
      stem.position.set((Math.random() - 0.5) * 52, h / 2, (Math.random() - 0.5) * 48);
      stem.material = createFlatMaterial(S, 'fsm' + i, '#2eb030');

      const bloom = MeshBuilder.CreateSphere('fb' + i, { diameter: 0.18 + Math.random() * 0.06 }, S);
      bloom.position.copyFrom(stem.position);
      bloom.position.y += h / 2 + 0.10;
      bloom.material = createFlatMaterial(S, 'fbm' + i, fColors[i % fColors.length]);
    }

    // Invisible boundary so player can't walk off edge
    for (const [wx, wz, ww, wd] of [
      [-32, 0, 0.5, 64], [32, 0, 0.5, 64],
      [0, -32, 64, 0.5], [0,  32, 64, 0.5],
    ] as [number, number, number, number][]) {
      const bnd = MeshBuilder.CreateBox('bnd' + wx, { width: ww, height: 2, depth: wd }, S);
      bnd.position.set(wx, 1, wz);
      bnd.visibility = 0;
    }
  }

  // ── Characters ────────────────────────────────────────────────────────────

  private async _buildCharacters(): Promise<void> {
    this._player = buildTaeil(this.scene, CHARACTER_COLORS.taeil);
    this._player.position.set(0, 0, -7);

    this._teemo = buildTeemo(this.scene, CHARACTER_COLORS.teemo);
    this._teemo.position.set(1.4, 0, -3);

    // Companion idle bob
    let t = 0;
    this.scene.registerBeforeRender(() => {
      if (this._disposed) return;
      t += this.scene.getEngine().getDeltaTime() * 0.0022;
      this._teemo.position.y = Math.abs(Math.sin(t)) * 0.05;
    });
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  private _buildCamera(): void {
    this._camera = new UniversalCamera('cam', new Vector3(0, 5.5, -9), this.scene);
    this._camera.setTarget(new Vector3(0, 1.2, 2));
    this._camera.fov  = 0.95;   // slightly wide for the 3/4 behind-view
    this._camera.minZ = 0.5;
    this._camera.maxZ = 200;
    this._camera.inputs.clear(); // disable built-in keyboard so InputManager takes over
  }

  // ── Particles ─────────────────────────────────────────────────────────────

  private _buildParticles(): void {
    // Attack sparks — short-lived, warm orange/red
    this._atkPS = new ParticleSystem('atk', 50, this.scene);
    this._atkPS.emitter     = Vector3.Zero();
    this._atkPS.color1      = new Color4(1.0, 0.75, 0.2, 1);
    this._atkPS.color2      = new Color4(1.0, 0.30, 0.1, 0.9);
    this._atkPS.colorDead   = new Color4(0.6, 0.10, 0.0, 0);
    this._atkPS.minSize     = 0.04;
    this._atkPS.maxSize     = 0.20;
    this._atkPS.minLifeTime = 0.10;
    this._atkPS.maxLifeTime = 0.30;
    this._atkPS.emitRate    = 0;
    this._atkPS.minEmitPower = 4;
    this._atkPS.maxEmitPower = 9;
    this._atkPS.direction1  = new Vector3(-1,  0.8, -1);
    this._atkPS.direction2  = new Vector3( 1,  2.2,  1);
    this._atkPS.gravity     = new Vector3( 0, -12,   0);
    this._atkPS.start();

    // Wind skill swirl — longer, green-cyan
    this._wndPS = new ParticleSystem('wnd', 90, this.scene);
    this._wndPS.emitter     = Vector3.Zero();
    this._wndPS.color1      = new Color4(0.35, 0.90, 0.55, 0.85);
    this._wndPS.color2      = new Color4(0.20, 0.65, 0.95, 0.70);
    this._wndPS.colorDead   = new Color4(0.10, 0.40, 0.60, 0);
    this._wndPS.minSize     = 0.06;
    this._wndPS.maxSize     = 0.30;
    this._wndPS.minLifeTime = 0.45;
    this._wndPS.maxLifeTime = 1.10;
    this._wndPS.emitRate    = 0;
    this._wndPS.minEmitPower = 3;
    this._wndPS.maxEmitPower = 8;
    this._wndPS.direction1  = new Vector3(-2,  0.6, -2);
    this._wndPS.direction2  = new Vector3( 2,  1.6,  2);
    this._wndPS.gravity     = new Vector3( 0, -1.2,  0);
    this._wndPS.start();
  }

  // ── EventBridge ───────────────────────────────────────────────────────────

  private _wireEvents(): void {
    this._offShow = EventBridge.on('show_dialogue', () => {
      this._phase = 'dialogue';
    });
    this._offHide = EventBridge.on('hide_dialogue', () => {
      if (this._phase === 'dialogue') this._phase = 'playing';
    });
    this._offComplete = EventBridge.on('dialogue_complete', () => {
      if (this._phase === 'dialogue') this._phase = 'playing';
    });
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  private _update = () => {
    if (this._disposed) return;
    const dt = this.scene.getEngine().getDeltaTime() / 1000;

    this._attackCool = Math.max(0, this._attackCool - dt);
    this._skillCool  = Math.max(0, this._skillCool  - dt);

    if (this._phase === 'playing') {
      this._move(dt);
      this._actions();
    }

    this._followCam();
  };

  // ── Movement ──────────────────────────────────────────────────────────────

  private _move(dt: number): void {
    const { x, y } = inputManager.getMovementVector();
    if (x === 0 && y === 0) return;

    const dx =  x * SPEED * dt;
    const dz = -y * SPEED * dt;   // forward (+y) → −Z in BJS world

    const nx = Math.max(-30, Math.min(30, this._player.position.x + dx));
    const nz = Math.max(-30, Math.min(24, this._player.position.z + dz));
    this._player.position.x = nx;
    this._player.position.z = nz;

    // Village gate trigger: walk through the gate
    if (nz > 22 && this._onComplete) {
      this._phase = 'dialogue';
      this._onComplete();
      this._onComplete = undefined;
    }

    // Face movement direction (smooth)
    if (Math.abs(dx) + Math.abs(dz) > 0.001) {
      const target = Math.atan2(dx, dz);
      let diff = target - this._player.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this._player.rotation.y += diff * Math.min(dt * 14, 1);
    }

    // Subtle walk bob (sprite parent nudges up/down slightly)
    const bob = performance.now() * 0.007;
    this._player.position.y = Math.abs(Math.sin(bob)) * 0.035;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  private _actions(): void {
    // ── Interact (E / virtual button) ──
    if (inputManager.consumeJustPressed('interact')) {
      const d = Vector3.Distance(this._player.position, this._teemo.position);
      if (d < INTERACT_DIST) {
        EventBridge.emit('show_dialogue', {
          sequenceId: 'teemo_village_hint',
          onComplete: () => {},
        });
      } else {
        EventBridge.emit('show_interact_prompt', {
          text: d < INTERACT_DIST * 2.8 ? '티모에게 더 가까이' : 'E — 상호작용',
          actionId: 'approach_teemo',
        });
        setTimeout(() => {
          EventBridge.emit('hide_interact_prompt', (undefined as unknown) as void);
        }, 1800);
      }
    }

    // ── Attack (J / left click) ──
    if (inputManager.consumeJustPressed('attack') && this._attackCool <= 0) {
      this._attackCool = 0.55;
      if (this._atkPS) {
        const pos = this._player.position.add(new Vector3(
          Math.sin(this._player.rotation.y) * 0.7,
          0.9,
          Math.cos(this._player.rotation.y) * 0.7,
        ));
        (this._atkPS.emitter as Vector3).copyFrom(pos);
        this._atkPS.manualEmitCount = 32;
      }
    }

    // ── Wind skill (K / right click) ──
    if (inputManager.consumeJustPressed('skill') && this._skillCool <= 0) {
      this._skillCool = 1.8;
      if (this._wndPS) {
        (this._wndPS.emitter as Vector3).copyFrom(
          this._player.position.add(new Vector3(0, 0.8, 0)),
        );
        this._wndPS.manualEmitCount = 70;
      }
    }

    // ── Pause (ESC) ──
    if (inputManager.consumeJustPressed('pause')) {
      if (this._phase === 'paused') {
        this._phase = 'playing';
        EventBridge.emit('hide_interact_prompt', (undefined as unknown) as void);
      } else {
        this._phase = 'paused';
        EventBridge.emit('show_interact_prompt', {
          text: '일시 정지 — 탭하여 재개',
          actionId: 'resume',
        });
      }
    }
  }

  // ── Camera follow ─────────────────────────────────────────────────────────

  private _followCam(): void {
    const t   = this._player.position.clone();
    // Camera offset: behind and slightly above for 3/4 perspective view
    const des = t.add(new Vector3(0, 5.5, -9));
    this._camera.position = Vector3.Lerp(this._camera.position, des, 0.07);
    // Look at a point slightly ahead of and above the player
    const look = t.add(new Vector3(0, 1.2, 2));
    this._camera.setTarget(Vector3.Lerp(this._camera.target, look, 0.08));
  }

  // ── Dispose ───────────────────────────────────────────────────────────────

  dispose(): void {
    this._disposed = true;
    this._offShow?.();
    this._offHide?.();
    this._offComplete?.();
    this._engine.stopRenderLoop();
    this.scene.unregisterBeforeRender(this._update);
    this._atkPS?.dispose();
    this._wndPS?.dispose();
    this.scene.dispose();
  }
}
