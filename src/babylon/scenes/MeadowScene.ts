/**
 * MeadowScene.ts
 * Scene 1C — Fantasy meadow: Taeil lands on Teemo, conversation, world reveal.
 *
 * Phase order:
 *   ARRIVAL → CRASH → WHERE_AM_I → LIGHT_BODY →
 *   WORLD_REVEAL → PARTY_HOOK → OBJECTIVE → DONE
 */

import {
  Scene,
  Engine,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  UniversalCamera,
  MeshBuilder,
  Mesh,
  TransformNode,
  Animation,
  AnimationGroup,
  ParticleSystem,
  StandardMaterial,
} from '@babylonjs/core';
import { SkyMaterial } from '@babylonjs/materials';

import { EventBridge } from '@/game/EventBridge';
import { getGameState } from '@/state/GameState';
import { MEADOW_CONFIG, CHARACTER_COLORS } from '../assets/AssetRegistry';
import {
  createCelMaterial,
  createFlatMaterial,
  createUnlitMaterial,
  addOutline,
} from '../utils/Materials';
import { buildTaeil, buildTeemo } from '../utils/Characters';

enum Phase {
  ARRIVAL = 'arrival',
  CRASH = 'crash',
  WHERE_AM_I = 'where_am_i',
  LIGHT_BODY = 'light_body',
  WORLD_REVEAL = 'world_reveal',
  PARTY_HOOK = 'party_hook',
  OBJECTIVE = 'objective',
  DONE = 'done',
}

export class MeadowScene {
  private scene: Scene;
  private camera!: UniversalCamera;
  private phase: Phase = Phase.ARRIVAL;
  private taeilRoot!: TransformNode;
  private teemoRoot!: TransformNode;
  private onComplete: () => void;
  private unsubDialogue!: () => void;

  constructor(engine: Engine, onComplete: () => void) {
    this.onComplete = onComplete;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.42, 0.74, 1.0, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.010;
    this.scene.fogColor = new Color3(0.68, 0.86, 1.0);
  }

  async build(): Promise<void> {
    this._setupCamera();
    this._setupLights();
    this._buildSky();
    this._buildTerrain();
    this._buildVegetation();
    this._buildMountains();
    this._buildVillageSilhouette();
    this._buildCharacters();
    this._buildAtmosphere();
    this._subscribeEvents();

    this.scene.getEngine().runRenderLoop(() => {
      if (this.scene) this.scene.render();
    });

    // Fade in from white then begin arrival
    this.scene.clearColor = new Color4(1, 1, 1, 1);
    this._fadeIn(600, () => {
      setTimeout(() => this._beginArrival(), 400);
    });
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  private _setupCamera(): void {
    // Start facing the sky
    this.camera = new UniversalCamera('meadow_cam', new Vector3(0, 1.2, -4), this.scene);
    this.camera.setTarget(new Vector3(0, 4, 0)); // looking up at sky
    this.camera.minZ = 0.1;
    this.camera.fov = 1.1;
  }

  // ── Lights ─────────────────────────────────────────────────────────────────

  private _setupLights(): void {
    // Vivid daytime hemisphere — bluer sky bounce, greener ground bounce
    const sky = new HemisphericLight('meadow_sky', new Vector3(0, 1, 0), this.scene);
    sky.intensity = 1.15;
    sky.diffuse = new Color3(0.88, 0.96, 1.0);
    sky.groundColor = new Color3(0.35, 0.72, 0.28);

    // Warm golden sun — strong key light
    const sun = new DirectionalLight('sun', new Vector3(-0.4, -1, 0.55), this.scene);
    sun.intensity = 1.8;
    sun.diffuse = new Color3(1.0, 0.96, 0.78);
    sun.position = new Vector3(10, 25, -12);
  }

  // ── Sky ────────────────────────────────────────────────────────────────────

  private _buildSky(): void {
    try {
      const skyMat = new SkyMaterial('sky_mat', this.scene);
      skyMat.backFaceCulling = false;
      skyMat.luminance = 1.05;
      skyMat.turbidity = 4;      // clearer sky = more vivid blue
      skyMat.rayleigh = 3.8;     // strong Rayleigh scattering = deep blue
      skyMat.mieCoefficient = 0.002;
      skyMat.mieDirectionalG = 0.97;
      skyMat.distance = 600;
      skyMat.inclination = 0.30; // higher sun = brighter sky
      skyMat.azimuth = 0.22;

      const skybox = MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);
      skybox.material = skyMat;
      skybox.infiniteDistance = true;
    } catch {
      // Fallback: just use the clear color (sky blue)
      this.scene.clearColor = new Color4(0.55, 0.8, 1.0, 1);
    }
  }

  // ── Terrain ────────────────────────────────────────────────────────────────

  private _buildTerrain(): void {
    // Main ground — vivid lush green
    const groundMat = createCelMaterial(this.scene, 'ground_mat', '#4cb84a');
    const ground = MeshBuilder.CreateGround('ground', {
      width: MEADOW_CONFIG.groundSize,
      height: MEADOW_CONFIG.groundSize,
      subdivisions: 8,
    }, this.scene);
    ground.material = groundMat;
    ground.position.y = 0;

    // Rolling terrain mounds for depth/layering
    const hillMat = createCelMaterial(this.scene, 'hill_mat', '#42a840');
    for (let i = 0; i < 7; i++) {
      const mound = MeshBuilder.CreateSphere('mound' + i, {
        diameter: 4 + Math.random() * 4,
        segments: 7,
      }, this.scene);
      mound.material = i % 2 === 0 ? groundMat : hillMat;
      mound.scaling.y = 0.15 + Math.random() * 0.10;
      mound.position = new Vector3(
        (Math.random() - 0.5) * 40,
        0.05,
        6 + Math.random() * 26,
      );
    }

    // Path leading toward village — warm sandy dirt
    const pathMat = createCelMaterial(this.scene, 'path_mat', '#d4b472');
    const path = MeshBuilder.CreateGround('path', { width: 2.2, height: 30, subdivisions: 1 }, this.scene);
    path.material = pathMat;
    path.position = new Vector3(4, 0.01, 16);
    path.rotation.y = 0.15;

    // Wide river — vivid blue with slight shimmer
    const riverMat = createUnlitMaterial(this.scene, 'river_mat', '#2e8ae0', 0.80);
    const river = MeshBuilder.CreateGround('river', { width: 6.5, height: 28, subdivisions: 1 }, this.scene);
    river.material = riverMat;
    river.position = new Vector3(-12, 0.02, 12);
    river.rotation.y = 0.28;

    // River highlight band (lighter shimmer strip)
    const riverShine = createUnlitMaterial(this.scene, 'river_shine', '#70c0ff', 0.45);
    const riverH = MeshBuilder.CreateGround('riverH', { width: 1.2, height: 24, subdivisions: 1 }, this.scene);
    riverH.material = riverShine;
    riverH.position = new Vector3(-11.5, 0.03, 11);
    riverH.rotation.y = 0.28;

    // Small pond near foreground
    const pondMat = createUnlitMaterial(this.scene, 'pond_mat', '#3090d8', 0.75);
    const pond = MeshBuilder.CreateGround('pond', { width: 4, height: 5, subdivisions: 1 }, this.scene);
    pond.material = pondMat;
    pond.position = new Vector3(-5, 0.02, 5);
  }

  // ── Vegetation ─────────────────────────────────────────────────────────────

  private _buildVegetation(): void {
    const grassColors = ['#38a040', '#3cb044', '#44b84a', '#30983a', '#4ac050'];
    const flowerColors = ['#ff4488', '#ffdd22', '#cc55ff', '#22ccff', '#ff5522', '#ffffff', '#ffaacc'];

    // Grass tufts — denser, taller, more vivid
    for (let i = 0; i < 280; i++) {
      const h = 0.18 + Math.random() * 0.32;
      const grass = MeshBuilder.CreateBox('gr' + i, { width: 0.07, depth: 0.01, height: h }, this.scene);
      const gMat = createFlatMaterial(this.scene, 'gmat' + i, grassColors[i % grassColors.length]);
      gMat.backFaceCulling = false;
      grass.material = gMat;
      const r = 1.0 + Math.random() * 32;
      const angle = Math.random() * Math.PI * 2;
      grass.position = new Vector3(
        Math.cos(angle) * r,
        h / 2,
        Math.sin(angle) * r,
      );
      grass.rotation.y = Math.random() * Math.PI;
      grass.rotation.z = (Math.random() - 0.5) * 0.18;
    }

    // Flowers — more plentiful, more vivid, larger blooms
    for (let i = 0; i < 130; i++) {
      const fColor = flowerColors[i % flowerColors.length];
      const stemMat = createFlatMaterial(this.scene, 'stem' + i, '#2ea832');
      const flowerMat = createFlatMaterial(this.scene, 'fl' + i, fColor);

      const h = 0.24 + Math.random() * 0.12;
      const stem = MeshBuilder.CreateCylinder('stem' + i, { height: h, diameter: 0.025, tessellation: 5 }, this.scene);
      stem.material = stemMat;
      const r = 0.8 + Math.random() * 26;
      const angle = Math.random() * Math.PI * 2;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;
      stem.position = new Vector3(px, h / 2, pz);

      const bloom = MeshBuilder.CreateSphere('fl' + i, { diameter: 0.14 + Math.random() * 0.06, segments: 6 }, this.scene);
      bloom.material = flowerMat;
      bloom.position = new Vector3(px, h + 0.06, pz);

      // Petal ring (slightly wider flattened sphere for richer flower shape)
      if (i % 3 === 0) {
        const petalMat = createFlatMaterial(this.scene, 'petal' + i, fColor);
        const petals = MeshBuilder.CreateSphere('petal_m' + i, { diameter: 0.22, segments: 5 }, this.scene);
        petals.material = petalMat;
        petals.scaling.y = 0.22;
        petals.position = new Vector3(px, h + 0.04, pz);
      }
    }

    // Trees — tall, lush, layered canopies for rich depth
    const trunkMat = createCelMaterial(this.scene, 'trunk_mat', '#6a4020');
    const leafMats = [
      createCelMaterial(this.scene, 'leaf_mat1', '#2ea830'),
      createCelMaterial(this.scene, 'leaf_mat2', '#38c040'),
      createCelMaterial(this.scene, 'leaf_mat3', '#246820'),
      createCelMaterial(this.scene, 'leaf_mat4', '#48b838'),
    ];

    const treePositions: [number, number][] = [
      [-12, 8], [-14, 14], [-8, 20], [-16, 22], [-20, 10],
      [12, 10], [16, 16], [20, 12], [22, 24], [26, 18],
      [-6, 30], [8, 28], [14, 32], [-18, 32],
    ];

    for (const [tx, tz] of treePositions) {
      const th = 3.0 + Math.random() * 1.5;
      const trunk = MeshBuilder.CreateCylinder('trunk_' + tx, {
        height: th,
        diameterTop: 0.22,
        diameterBottom: 0.44 + Math.random() * 0.18,
        tessellation: 7,
      }, this.scene);
      trunk.material = trunkMat;
      trunk.position = new Vector3(tx, th / 2, tz);
      addOutline(trunk, 0.6);

      // Lower canopy (wider, darker)
      const lc = MeshBuilder.CreateSphere('lcanopy_' + tx, {
        diameter: 3.2 + Math.random() * 1.2,
        segments: 8,
      }, this.scene);
      lc.material = leafMats[Math.floor(Math.random() * 2) + 2];
      lc.scaling.y = 0.72;
      lc.position = new Vector3(tx, th + 0.6, tz);
      addOutline(lc, 0.5);

      // Upper canopy (smaller, brighter)
      const uc = MeshBuilder.CreateSphere('ucanopy_' + tx, {
        diameter: 2.4 + Math.random() * 0.8,
        segments: 7,
      }, this.scene);
      uc.material = leafMats[Math.floor(Math.random() * 2)];
      uc.scaling.y = 0.80;
      uc.position = new Vector3(tx + (Math.random() - 0.5) * 0.5, th + 1.6, tz + (Math.random() - 0.5) * 0.4);
      addOutline(uc, 0.4);
    }
  }

  // ── Mountains ──────────────────────────────────────────────────────────────

  private _buildMountains(): void {
    const mountainMats = [
      createCelMaterial(this.scene, 'mt1', '#6888b8'),   // vivid periwinkle
      createCelMaterial(this.scene, 'mt2', '#5070a8'),   // deeper blue
      createCelMaterial(this.scene, 'mt3', '#7898c0'),   // lighter sky-blue
      createCelMaterial(this.scene, 'mt4', '#486098'),   // dark navy-blue
    ];
    const snowMat    = createFlatMaterial(this.scene, 'snow_mat', '#f0f4fc');
    const snowShade  = createFlatMaterial(this.scene, 'snow_shade', '#d8e4f4');

    for (let i = 0; i < MEADOW_CONFIG.mountainPositions.length; i++) {
      const { x, z, height } = MEADOW_CONFIG.mountainPositions[i];

      // Mountain cone — more faceted for stylised look
      const mt = MeshBuilder.CreateCylinder('mt' + i, {
        height: height * 1.15,
        diameterTop: 0.2,
        diameterBottom: height * 0.80,
        tessellation: 6,
      }, this.scene);
      mt.material = mountainMats[i % mountainMats.length];
      mt.position = new Vector3(x, (height * 1.15) / 2, z);
      addOutline(mt, 0.5);

      // Layered snow cap — two layers for depth
      const snow = MeshBuilder.CreateCylinder('snow' + i, {
        height: height * 0.30,
        diameterTop: 0.0,
        diameterBottom: height * 0.24,
        tessellation: 6,
      }, this.scene);
      snow.material = snowMat;
      snow.position = new Vector3(x, height * 1.15 - height * 0.06, z);

      const snowMid = MeshBuilder.CreateCylinder('snowM' + i, {
        height: height * 0.15,
        diameterTop: height * 0.26,
        diameterBottom: height * 0.36,
        tessellation: 6,
      }, this.scene);
      snowMid.material = snowShade;
      snowMid.position = new Vector3(x, height * 1.15 - height * 0.24, z);
    }

    // Additional distant background ridge — purely atmospheric
    const ridgeMat = createCelMaterial(this.scene, 'ridge_mat', '#8aa8c8');
    const ridge = MeshBuilder.CreateCylinder('ridge', {
      height: 12, diameterTop: 0.1, diameterBottom: 60, tessellation: 5,
    }, this.scene);
    ridge.material = ridgeMat;
    ridge.position = new Vector3(0, 6, 55);
    ridge.visibility = 0.65;
  }

  // ── Village silhouette ─────────────────────────────────────────────────────

  private _buildVillageSilhouette(): void {
    const vp = MEADOW_CONFIG.villagePos;
    const buildingMat = createCelMaterial(this.scene, 'village_mat', '#f0d898');
    const roofMat = createCelMaterial(this.scene, 'roof_mat', '#e04828');
    const roofAlt = createCelMaterial(this.scene, 'roof_mat2', '#5870c8');
    const wallDarkMat = createCelMaterial(this.scene, 'village_dark', '#d4b870');

    const buildings = [
      { x: vp.x - 2, z: vp.z, w: 3, h: 3.5 },
      { x: vp.x + 1, z: vp.z + 1, w: 2, h: 4.5 },
      { x: vp.x + 3.5, z: vp.z - 0.5, w: 2.5, h: 3.0 },
      { x: vp.x - 4, z: vp.z + 1, w: 2, h: 2.5 },
    ];

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      // Body
      const body = MeshBuilder.CreateBox('vbody' + i, { width: b.w, depth: b.w * 0.8, height: b.h }, this.scene);
      body.material = i % 2 === 0 ? buildingMat : wallDarkMat;
      body.position = new Vector3(b.x, b.h / 2, b.z);
      addOutline(body, 0.4);

      // Roof — alternate colours for variety
      const roof = MeshBuilder.CreateCylinder('vroof' + i, {
        height: b.h * 0.50,
        diameterTop: 0.08,
        diameterBottom: b.w * 1.3,
        tessellation: 4,
      }, this.scene);
      roof.material = i % 3 === 2 ? roofAlt : roofMat;
      roof.position = new Vector3(b.x, b.h + b.h * 0.22, b.z);
      roof.rotation.y = Math.PI / 4;
      addOutline(roof, 0.4);
    }

    // Windmill
    const wmx = vp.x + 7, wmz = vp.z - 2;
    const wmBody = MeshBuilder.CreateCylinder('wm_body', { height: 5, diameterTop: 0.8, diameterBottom: 1.4, tessellation: 8 }, this.scene);
    wmBody.material = buildingMat;
    wmBody.position = new Vector3(wmx, 2.5, wmz);

    // Windmill blades (4 arms)
    const bladeMat = createFlatMaterial(this.scene, 'blade_mat', '#c8aa80');
    for (let i = 0; i < 4; i++) {
      const blade = MeshBuilder.CreateBox('wblade' + i, { width: 0.15, depth: 0.05, height: 2.0 }, this.scene);
      blade.material = bladeMat;
      blade.position = new Vector3(wmx, 5.0, wmz - 0.05);
      blade.rotation.z = (Math.PI / 2) * i;
    }
  }

  // ── Characters ──────────────────────────────────────────────────────────────

  private _buildCharacters(): void {
    // Companion with scout goggles + mushroom cap
    this.teemoRoot = buildTeemo(this.scene, CHARACTER_COLORS.teemo);
    this.teemoRoot.position = new Vector3(
      MEADOW_CONFIG.teemoStartPos.x,
      0,
      MEADOW_CONFIG.teemoStartPos.z,
    );
    this.teemoRoot.rotation.y = Math.PI * 0.8;

    // Mushrooms near Teemo
    const mushMat = createCelMaterial(this.scene, 'mush_mat', '#dd4444');
    const mushStemMat = createCelMaterial(this.scene, 'mush_stem', '#f0e8d8');
    for (let i = 0; i < 3; i++) {
      const stem = MeshBuilder.CreateCylinder('mush_stem' + i, { height: 0.18, diameterBottom: 0.07, diameterTop: 0.05, tessellation: 8 }, this.scene);
      stem.material = mushStemMat;
      stem.position = new Vector3(1.8 + i * 0.22, 0.09, 2.2);

      const cap = MeshBuilder.CreateSphere('mush_cap' + i, { diameter: 0.28, segments: 6 }, this.scene);
      cap.material = mushMat;
      cap.scaling.y = 0.6;
      cap.position = new Vector3(1.8 + i * 0.22, 0.25, 2.2);
    }

    // Taeil starts off-screen above (will fall in)
    this.taeilRoot = buildTaeil(this.scene, CHARACTER_COLORS.taeil);
    this.taeilRoot.position = new Vector3(MEADOW_CONFIG.taeilLandPos.x, 12, MEADOW_CONFIG.taeilLandPos.z);
    this.taeilRoot.rotation.z = Math.PI; // upside down while falling
  }

  // ── Atmosphere particles ───────────────────────────────────────────────────

  private _buildAtmosphere(): void {
    // Floating pollen / sparkle — more abundant
    const pollen = new ParticleSystem('pollen', 350, this.scene);
    pollen.emitter = new Vector3(0, 0.6, 5);
    pollen.minSize = 0.025;
    pollen.maxSize = 0.08;
    pollen.minLifeTime = 3.5;
    pollen.maxLifeTime = 7;
    pollen.emitRate = 40;
    pollen.minEmitPower = 0.06;
    pollen.maxEmitPower = 0.28;
    pollen.color1 = new Color4(1.0, 0.98, 0.80, 1.0);
    pollen.color2 = new Color4(0.85, 1.0, 0.75, 0.85);
    pollen.colorDead = new Color4(1, 1, 0.9, 0);
    pollen.direction1 = new Vector3(-0.4, 0.5, -0.4);
    pollen.direction2 = new Vector3(0.4, 1.0, 0.4);
    pollen.gravity = new Vector3(0, 0.04, 0);
    pollen.start();

    // Pink flower petals drifting — vivid pink/white
    const petals = new ParticleSystem('petals', 100, this.scene);
    petals.emitter = new Vector3(3, 0.4, 8);
    petals.minSize = 0.06;
    petals.maxSize = 0.16;
    petals.minLifeTime = 2.5;
    petals.maxLifeTime = 6;
    petals.emitRate = 14;
    petals.minEmitPower = 0.10;
    petals.maxEmitPower = 0.35;
    petals.color1 = new Color4(1.0, 0.55, 0.75, 0.95);
    petals.color2 = new Color4(1.0, 0.90, 0.95, 0.90);
    petals.colorDead = new Color4(1, 0.8, 0.9, 0);
    petals.direction1 = new Vector3(-0.5, 0.4, -0.3);
    petals.direction2 = new Vector3(0.5, 1.0, 0.5);
    petals.gravity = new Vector3(0, -0.12, 0);
    petals.start();

    // Magical sparkle motes — blue-white for fantasy feel
    const sparkle = new ParticleSystem('sparkle', 80, this.scene);
    sparkle.emitter = new Vector3(-4, 1.0, 6);
    sparkle.minSize = 0.015;
    sparkle.maxSize = 0.055;
    sparkle.minLifeTime = 1.5;
    sparkle.maxLifeTime = 4.0;
    sparkle.emitRate = 12;
    sparkle.minEmitPower = 0.08;
    sparkle.maxEmitPower = 0.30;
    sparkle.color1 = new Color4(0.7, 0.9, 1.0, 1.0);
    sparkle.color2 = new Color4(1.0, 1.0, 0.8, 0.85);
    sparkle.colorDead = new Color4(0.8, 0.9, 1, 0);
    sparkle.direction1 = new Vector3(-0.2, 0.6, -0.2);
    sparkle.direction2 = new Vector3(0.2, 1.2, 0.2);
    sparkle.gravity = new Vector3(0, 0.08, 0);
    sparkle.start();
  }

  // ── EventBridge ────────────────────────────────────────────────────────────

  private _subscribeEvents(): void {
    this.unsubDialogue = EventBridge.on('dialogue_complete', ({ sequenceId }) => {
      this._onDialogueComplete(sequenceId);
    });
  }

  private _onDialogueComplete(id: string): void {
    void id; // handled via onComplete callbacks
  }

  // ── Phase: Arrival (sky shot, tilt down) ──────────────────────────────────

  private _beginArrival(): void {
    this.phase = Phase.ARRIVAL;

    // Camera: start looking up, tilt down to reveal world
    const camTiltAnim = new Animation('camTilt', 'target', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camTiltAnim.setKeys([
      { frame: 0, value: new Vector3(0, 4, 0) },
      { frame: 150, value: new Vector3(0, 1.0, 5) },
    ]);
    this.camera.animations = [camTiltAnim];
    this.scene.beginAnimation(this.camera, 0, 150, false, 1, () => {
      // World is revealed — drop Taeil in
      setTimeout(() => this._beginCrash(), 300);
    });
  }

  // ── Phase: Crash ───────────────────────────────────────────────────────────

  private _beginCrash(): void {
    this.phase = Phase.CRASH;

    // Taeil screams while falling
    EventBridge.emit('show_dialogue', {
      sequenceId: 'meadow_taeil_scream',
      onComplete: () => {
        // Play fall animation
        this._taeilFallAnimation(() => {
          // Impact
          this._crashEffect();
          setTimeout(() => {
            EventBridge.emit('show_dialogue', {
              sequenceId: 'meadow_crash',
              onComplete: () => this._beginWhereAmI(),
            });
          }, 400);
        });
      },
    });
  }

  private _taeilFallAnimation(onLand: () => void): void {
    // Taeil flips and lands
    const fallAnim = new Animation('taeilFall', 'position.y', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    fallAnim.setKeys([
      { frame: 0, value: 12 },
      { frame: 45, value: 0.0 },
    ]);
    const spinAnim = new Animation('taeilSpin', 'rotation.z', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    spinAnim.setKeys([
      { frame: 0, value: Math.PI },
      { frame: 45, value: 0 },
    ]);
    this.taeilRoot.animations = [fallAnim, spinAnim];
    this.scene.beginAnimation(this.taeilRoot, 0, 45, false, 1, () => {
      this.taeilRoot.position.y = 0;
      onLand();
    });
  }

  private _crashEffect(): void {
    // Small camera bump
    const bumpAnim = new Animation('camBump', 'position.y', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    bumpAnim.setKeys([
      { frame: 0, value: this.camera.position.y },
      { frame: 4, value: this.camera.position.y + 0.15 },
      { frame: 10, value: this.camera.position.y - 0.05 },
      { frame: 16, value: this.camera.position.y },
    ]);
    this.camera.animations = [bumpAnim];
    this.scene.beginAnimation(this.camera, 0, 16, false, 1);

    // Dust burst particle
    const dust = new ParticleSystem('dust', 80, this.scene);
    dust.emitter = new Vector3(0, 0, 2);
    dust.minSize = 0.1;
    dust.maxSize = 0.35;
    dust.minLifeTime = 0.3;
    dust.maxLifeTime = 0.8;
    dust.emitRate = 0;
    dust.manualEmitCount = 80;
    dust.color1 = new Color4(0.85, 0.82, 0.7, 0.8);
    dust.color2 = new Color4(0.7, 0.68, 0.55, 0.5);
    dust.colorDead = new Color4(0.8, 0.8, 0.7, 0);
    dust.direction1 = new Vector3(-2, 1, -2);
    dust.direction2 = new Vector3(2, 2.5, 2);
    dust.gravity = new Vector3(0, -3, 0);
    dust.start();
    setTimeout(() => dust.dispose(), 2000);
  }

  // ── Phase: Where am I ──────────────────────────────────────────────────────

  private _beginWhereAmI(): void {
    this.phase = Phase.WHERE_AM_I;

    // Camera settles to two-shot framing
    const camMoveAnim = new Animation('camWhere', 'position', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camMoveAnim.setKeys([
      { frame: 0, value: this.camera.position.clone() },
      { frame: 60, value: new Vector3(-0.5, 1.4, -2.0) },
    ]);
    const camTargetAnim = new Animation('camWhereT', 'target', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camTargetAnim.setKeys([
      { frame: 0, value: new Vector3(0, 1.0, 5) },
      { frame: 60, value: new Vector3(0.8, 0.9, 2.0) },
    ]);
    this.camera.animations = [camMoveAnim, camTargetAnim];
    this.scene.beginAnimation(this.camera, 0, 60, false, 1, () => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'meadow_where_am_i',
        onComplete: () => this._beginLightBody(),
      });
    });
  }

  // ── Phase: Light body ──────────────────────────────────────────────────────

  private _beginLightBody(): void {
    this.phase = Phase.LIGHT_BODY;

    EventBridge.emit('show_dialogue', {
      sequenceId: 'meadow_light_body',
      onComplete: () => this._beginWorldReveal(),
    });
  }

  // ── Phase: World reveal ────────────────────────────────────────────────────

  private _beginWorldReveal(): void {
    this.phase = Phase.WORLD_REVEAL;

    // Camera pulls back wide to show full landscape
    const pullAnim = new Animation('camPull', 'position', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    pullAnim.setKeys([
      { frame: 0, value: this.camera.position.clone() },
      { frame: 180, value: new Vector3(-3, 3.5, -8) },
    ]);
    const targetAnim = new Animation('camPullT', 'target', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    targetAnim.setKeys([
      { frame: 0, value: new Vector3(0.8, 0.9, 2.0) },
      { frame: 180, value: new Vector3(8, 1.5, 20) },
    ]);
    this.camera.animations = [pullAnim, targetAnim];
    this.scene.beginAnimation(this.camera, 0, 180, false, 1, () => {
      // Hold the wide shot for a moment
      setTimeout(() => this._beginPartyHook(), 1200);
    });
  }

  // ── Phase: Party hook ──────────────────────────────────────────────────────

  private _beginPartyHook(): void {
    this.phase = Phase.PARTY_HOOK;

    // Camera moves back to a two-shot as dialogue begins
    const camBackAnim = new Animation('camBack', 'position', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camBackAnim.setKeys([
      { frame: 0, value: this.camera.position.clone() },
      { frame: 90, value: new Vector3(-0.5, 1.6, -2.8) },
    ]);
    const camTargetBackAnim = new Animation('camBackT', 'target', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camTargetBackAnim.setKeys([
      { frame: 0, value: new Vector3(8, 1.5, 20) },
      { frame: 90, value: new Vector3(0.8, 0.9, 2.0) },
    ]);
    this.camera.animations = [camBackAnim, camTargetBackAnim];
    this.scene.beginAnimation(this.camera, 0, 90, false, 1, () => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'meadow_party_hook',
        onComplete: () => this._beginObjective(),
      });
    });
  }

  // ── Phase: Objective ───────────────────────────────────────────────────────

  private _beginObjective(): void {
    this.phase = Phase.OBJECTIVE;

    // Final camera: Taeil + Teemo facing village
    const camFinalAnim = new Animation('camFinal', 'position', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camFinalAnim.setKeys([
      { frame: 0, value: this.camera.position.clone() },
      { frame: 120, value: new Vector3(2, 2.2, -3.5) },
    ]);
    const camFinalTargetAnim = new Animation('camFinalT', 'target', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camFinalTargetAnim.setKeys([
      { frame: 0, value: new Vector3(0.8, 0.9, 2.0) },
      { frame: 120, value: new Vector3(10, 1.2, 22) },
    ]);
    this.camera.animations = [camFinalAnim, camFinalTargetAnim];
    this.scene.beginAnimation(this.camera, 0, 120, false, 1, () => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'meadow_objective',
        onComplete: () => this._end(),
      });
    });
  }

  // ── End ────────────────────────────────────────────────────────────────────

  private _end(): void {
    this.phase = Phase.DONE;

    // Update game state
    getGameState().setCurrentScene('meadow_intro');

    // Short hold then call onComplete (Scene 2 hook)
    setTimeout(() => {
      this._fadeOut(1200, () => this.onComplete());
    }, 1000);
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  private _fadeIn(durationMs: number, onDone: () => void): void {
    let opacity = 1;
    const step = 1 / (durationMs / 16);
    const iv = setInterval(() => {
      opacity -= step;
      this.scene.clearColor = new Color4(1, 1, 1, Math.max(opacity, 0));
      if (opacity <= 0) { clearInterval(iv); onDone(); }
    }, 16);
  }

  private _fadeOut(durationMs: number, onDone: () => void): void {
    let opacity = 0;
    const step = 1 / (durationMs / 16);
    const iv = setInterval(() => {
      opacity += step;
      this.scene.clearColor = new Color4(0, 0, 0, Math.min(opacity, 1));
      if (opacity >= 1) { clearInterval(iv); onDone(); }
    }, 16);
  }

  dispose(): void {
    this.unsubDialogue?.();
    this.scene?.dispose();
  }
}
