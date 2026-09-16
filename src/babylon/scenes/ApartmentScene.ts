/**
 * ApartmentScene.ts
 * Scene 1A — Taeil's late-night studio apartment.
 * Fully cinematic: no free movement, only timed sequences + optional inspects.
 *
 * Phase order:
 *   DESK_CINEMATIC → DESK_INSPECT → SLEEP_TRANSITION →
 *   SNORING → PORTAL_APPEAR → PORTAL_EXPAND → FALLING
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
  FreeCamera,
  MeshBuilder,
  Mesh,
  TransformNode,
  Animation,
  ActionManager,
  ExecuteCodeAction,
  ParticleSystem,
  Texture,
  StandardMaterial,
  HighlightLayer,
} from '@babylonjs/core';

import { EventBridge } from '@/game/EventBridge';
import { getGameState } from '@/state/GameState';
import { APARTMENT_CONFIG, CHARACTER_COLORS } from '../assets/AssetRegistry';
import { createCelMaterial, createFlatMaterial, createUnlitMaterial, addOutline } from '../utils/Materials';
import { buildTaeil, buildYongbin } from '../utils/Characters';
import { inputManager } from '@/game/InputManager';

// ── Phase enum ────────────────────────────────────────────────────────────────

enum Phase {
  DESK_CINEMATIC = 'desk_cinematic',
  DESK_INSPECT = 'desk_inspect',
  SLEEP_TRANSITION = 'sleep_transition',
  SNORING = 'snoring',
  PORTAL_APPEAR = 'portal_appear',
  PORTAL_EXPAND = 'portal_expand',
  FALLING = 'falling',
}

// ── Main class ────────────────────────────────────────────────────────────────

export class ApartmentScene {
  private scene: Scene;
  private camera!: FreeCamera;
  private phase: Phase = Phase.DESK_CINEMATIC;
  private lampLight!: PointLight;
  private monitorLight!: PointLight;
  private portalLight!: PointLight;
  private portalMesh!: Mesh;
  private portalParticles!: ParticleSystem;
  private taeilRoot!: TransformNode;
  private yongbinRoot!: TransformNode;
  private highlightLayer!: HighlightLayer;
  private onComplete: () => void;
  private unsubDialogue!: () => void;
  private unsubInteract!: () => void;
  private _unsubShowDlg!: () => void;
  private paperParticles!: ParticleSystem;

  // ── Exploration movement state ─────────────────────────────────────────────
  private _movementEnabled = false;
  private _dialogueActive  = false;
  private _nearBed         = false;
  private _updateFn: (() => void) | null = null;

  constructor(engine: Engine, onComplete: () => void) {
    this.onComplete = onComplete;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.03, 0.03, 0.1, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.08;
    this.scene.fogColor = new Color3(0.02, 0.02, 0.08);
  }

  async build(): Promise<void> {
    this._setupCamera();
    this._setupLights();
    this._buildRoom();
    this._buildFurniture();
    this._buildCharacters();
    this._buildPortalSlot();
    this._setupHighlights();
    this._subscribeEvents();

    // Start the render loop
    this.scene.getEngine().runRenderLoop(() => {
      if (this.scene) this.scene.render();
    });

    // Begin cinematic after short delay
    setTimeout(() => this._beginDeskCinematic(), 600);
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  private _setupCamera(): void {
    this.camera = new FreeCamera('apt_cam', new Vector3(-0.5, 1.55, -2.8), this.scene);
    this.camera.setTarget(new Vector3(-1.2, 1.3, 0.5));
    this.camera.minZ = 0.1;
  }

  // ── Lights ─────────────────────────────────────────────────────────────────

  private _setupLights(): void {
    // Dark blue ambient (night)
    const ambient = new HemisphericLight('apt_ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.08;
    ambient.diffuse = new Color3(0.3, 0.4, 0.8);
    ambient.groundColor = new Color3(0.02, 0.02, 0.05);

    // Window / moonlight (cool blue, very dim)
    const moon = new DirectionalLight('moon', new Vector3(0.3, -0.6, 0.7), this.scene);
    moon.intensity = 0.12;
    moon.diffuse = new Color3(0.4, 0.5, 0.9);

    // Desk lamp (warm yellow)
    this.lampLight = new PointLight('lamp', new Vector3(-1.5, 1.5, 0.4), this.scene);
    this.lampLight.intensity = 1.2;
    this.lampLight.diffuse = new Color3(1.0, 0.75, 0.35);
    this.lampLight.range = 3.5;

    // Monitor glow (cool white-blue)
    this.monitorLight = new PointLight('monitor', new Vector3(-1.6, 1.15, 0.35), this.scene);
    this.monitorLight.intensity = 0.5;
    this.monitorLight.diffuse = new Color3(0.55, 0.65, 0.95);
    this.monitorLight.range = 2.0;

    // Portal light (starts invisible)
    this.portalLight = new PointLight('portal', new Vector3(1.2, 0.05, 0.0), this.scene);
    this.portalLight.intensity = 0;
    this.portalLight.diffuse = new Color3(0.2, 0.9, 0.6);
    this.portalLight.range = 2.5;
  }

  // ── Room geometry ──────────────────────────────────────────────────────────

  private _buildRoom(): void {
    const cfg = APARTMENT_CONFIG.room;

    // Floor — dark wood planks
    const floorMat = createCelMaterial(this.scene, 'floor_mat', '#2a1a0e');
    const floor = MeshBuilder.CreateBox('floor', { width: cfg.width, depth: cfg.depth, height: 0.04 }, this.scene);
    floor.material = floorMat;
    floor.position.y = 0;

    // Back wall
    const wallMat = createCelMaterial(this.scene, 'wall_mat', '#d8d0c0');
    const backWall = MeshBuilder.CreateBox('wall_back', { width: cfg.width, depth: 0.08, height: cfg.height }, this.scene);
    backWall.material = wallMat;
    backWall.position = new Vector3(0, cfg.height / 2, cfg.depth / 2);

    // Left wall
    const leftWall = MeshBuilder.CreateBox('wall_left', { width: 0.08, depth: cfg.depth, height: cfg.height }, this.scene);
    leftWall.material = wallMat;
    leftWall.position = new Vector3(-cfg.width / 2, cfg.height / 2, 0);

    // Right wall
    const rightWall = MeshBuilder.CreateBox('wall_right', { width: 0.08, depth: cfg.depth, height: cfg.height }, this.scene);
    rightWall.material = wallMat;
    rightWall.position = new Vector3(cfg.width / 2, cfg.height / 2, 0);

    // Ceiling
    const ceilMat = createCelMaterial(this.scene, 'ceil_mat', '#c8c0b0');
    const ceil = MeshBuilder.CreateBox('ceiling', { width: cfg.width, depth: cfg.depth, height: 0.04 }, this.scene);
    ceil.material = ceilMat;
    ceil.position.y = cfg.height;

    // Window in back wall — glowing rectangle
    const windowGlowMat = createUnlitMaterial(this.scene, 'win_glow', '#0a1040', 0.7);
    const window = MeshBuilder.CreateBox('window', { width: 1.4, depth: 0.12, height: 1.1 }, this.scene);
    window.material = windowGlowMat;
    window.position = new Vector3(-1.0, 1.6, cfg.depth / 2 - 0.02);

    // Window frame
    const frameMat = createFlatMaterial(this.scene, 'win_frame', '#555550');
    const frameH = MeshBuilder.CreateBox('win_frame_h', { width: 1.5, depth: 0.1, height: 0.06 }, this.scene);
    frameH.material = frameMat;
    frameH.position = new Vector3(-1.0, 2.16, cfg.depth / 2 - 0.01);
    const frameH2 = frameH.clone('win_frame_h2');
    frameH2.position.y = 1.04;

    // Stars outside window (emissive dots)
    const starMat = createUnlitMaterial(this.scene, 'star_mat', '#ffffff', 0.9);
    for (let i = 0; i < 8; i++) {
      const star = MeshBuilder.CreateSphere('star' + i, { diameter: 0.02, segments: 4 }, this.scene);
      star.material = starMat;
      star.position = new Vector3(-1.0 + (Math.random() - 0.5) * 1.2, 1.5 + Math.random() * 0.7, cfg.depth / 2 - 0.04);
    }
  }

  // ── Furniture ──────────────────────────────────────────────────────────────

  private _buildFurniture(): void {
    // ── Desk ──────────────────────────────────────────────────────────────────
    const deskMat = createCelMaterial(this.scene, 'desk_mat', '#3a2010');
    const desk = MeshBuilder.CreateBox('desk', { width: 1.4, depth: 0.7, height: 0.05 }, this.scene);
    desk.material = deskMat;
    desk.position = new Vector3(-1.5, 0.74, 0.5);
    desk.metadata = { inspectable: true, actionId: 'inspect_desk' };

    // Desk legs
    const legMat = createFlatMaterial(this.scene, 'leg_mat', '#2a1808');
    for (const [dx, dz] of [[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]]) {
      const leg = MeshBuilder.CreateBox('dleg', { width: 0.05, depth: 0.05, height: 0.74 }, this.scene);
      leg.material = legMat;
      leg.position = new Vector3(-1.5 + dx, 0.37, 0.5 + dz);
    }

    // ── Laptop ────────────────────────────────────────────────────────────────
    const laptopBodyMat = createFlatMaterial(this.scene, 'lap_body', '#222222');
    const lapBase = MeshBuilder.CreateBox('lap_base', { width: 0.38, depth: 0.27, height: 0.015 }, this.scene);
    lapBase.material = laptopBodyMat;
    lapBase.position = new Vector3(-1.55, 0.78, 0.45);
    lapBase.metadata = { inspectable: true, actionId: 'inspect_laptop' };

    // Screen (slightly open, emissive)
    const screenMat = createUnlitMaterial(this.scene, 'screen_mat', '#1a2050', 1.0);
    const screen = MeshBuilder.CreateBox('lap_screen', { width: 0.36, depth: 0.006, height: 0.24 }, this.scene);
    screen.material = screenMat;
    screen.position = new Vector3(-1.55, 0.91, 0.32);
    screen.rotation.x = -0.35; // slightly tilted back

    // Screen content lines (lighter stripes on screen)
    const linesMat = createUnlitMaterial(this.scene, 'screen_lines', '#3a4580', 0.8);
    for (let i = 0; i < 5; i++) {
      const line = MeshBuilder.CreateBox('sline' + i, { width: 0.26, depth: 0.007, height: 0.012 }, this.scene);
      line.material = linesMat;
      line.position = new Vector3(-1.55, 0.98 - i * 0.03, 0.30 - (i * 0.006));
      line.rotation.x = -0.35;
    }

    // ── Papers on desk ────────────────────────────────────────────────────────
    const paperMat = createUnlitMaterial(this.scene, 'paper_mat', '#f5f0e0', 0.95);
    const paperRedMat = createUnlitMaterial(this.scene, 'paper_red', '#ff6655', 0.7);
    for (let i = 0; i < 4; i++) {
      const paper = MeshBuilder.CreateBox('paper' + i, {
        width: 0.21 + Math.random() * 0.04,
        depth: 0.007,
        height: 0.29 + Math.random() * 0.03,
      }, this.scene);
      paper.material = i === 2 ? paperRedMat : paperMat;
      paper.position = new Vector3(
        -1.38 + (Math.random() - 0.5) * 0.25,
        0.775,
        0.6 + (Math.random() - 0.5) * 0.2
      );
      paper.rotation.y = (Math.random() - 0.5) * 0.5;
      paper.metadata = { inspectable: true, actionId: 'inspect_papers' };
    }

    // ── Notes / sticky notes ──────────────────────────────────────────────────
    const noteMat = createUnlitMaterial(this.scene, 'note_mat', '#ffe066', 0.9);
    for (let i = 0; i < 3; i++) {
      const note = MeshBuilder.CreateBox('note' + i, { width: 0.09, depth: 0.005, height: 0.09 }, this.scene);
      note.material = noteMat;
      note.position = new Vector3(
        -1.8 + i * 0.12,
        0.778,
        0.65
      );
      note.metadata = { inspectable: true, actionId: 'inspect_notes' };
    }

    // ── Desk lamp ──────────────────────────────────────────────────────────────
    const lampMat = createFlatMaterial(this.scene, 'lamp_mat', '#888888');
    const lampBase = MeshBuilder.CreateCylinder('lamp_base', { height: 0.04, diameter: 0.12, tessellation: 12 }, this.scene);
    lampBase.material = lampMat;
    lampBase.position = new Vector3(-1.0, 0.77, 0.28);

    const lampPole = MeshBuilder.CreateCylinder('lamp_pole', { height: 0.55, diameter: 0.02, tessellation: 8 }, this.scene);
    lampPole.material = lampMat;
    lampPole.position = new Vector3(-1.0, 1.065, 0.28);

    const lampHeadMat = createUnlitMaterial(this.scene, 'lamp_head', '#ffd080', 0.9);
    const lampHead = MeshBuilder.CreateCylinder('lamp_head', {
      height: 0.14, diameterTop: 0.08, diameterBottom: 0.22, tessellation: 10,
    }, this.scene);
    lampHead.material = lampHeadMat;
    lampHead.position = new Vector3(-1.0, 1.45, 0.28);

    // ── Chair ──────────────────────────────────────────────────────────────────
    const chairMat = createCelMaterial(this.scene, 'chair_mat', '#1a1a30');
    const seat = MeshBuilder.CreateBox('chair_seat', { width: 0.52, depth: 0.5, height: 0.06 }, this.scene);
    seat.material = chairMat;
    seat.position = new Vector3(-1.5, 0.48, -0.05);

    const backrest = MeshBuilder.CreateBox('chair_back', { width: 0.52, depth: 0.06, height: 0.5 }, this.scene);
    backrest.material = chairMat;
    backrest.position = new Vector3(-1.5, 0.73, -0.28);

    // ── Bed ────────────────────────────────────────────────────────────────────
    const bedFrameMat = createCelMaterial(this.scene, 'bed_frame', '#2a1808');
    const bedFrame = MeshBuilder.CreateBox('bed_frame', { width: 1.0, depth: 2.1, height: 0.16 }, this.scene);
    bedFrame.material = bedFrameMat;
    bedFrame.position = new Vector3(1.5, 0.08, -0.2);

    const mattressMat = createCelMaterial(this.scene, 'mattress_mat', '#d8d0c8');
    const mattress = MeshBuilder.CreateBox('mattress', { width: 0.96, depth: 2.0, height: 0.18 }, this.scene);
    mattress.material = mattressMat;
    mattress.position = new Vector3(1.5, 0.25, -0.2);

    const pillow = MeshBuilder.CreateBox('pillow', { width: 0.78, depth: 0.42, height: 0.12 }, this.scene);
    pillow.material = createCelMaterial(this.scene, 'pillow_mat', '#f8f4ee');
    pillow.position = new Vector3(1.5, 0.38, -1.12);

    const blanketMat = createCelMaterial(this.scene, 'blanket_mat', '#4a5a9a');
    const blanket = MeshBuilder.CreateBox('blanket', { width: 0.95, depth: 1.55, height: 0.1 }, this.scene);
    blanket.material = blanketMat;
    blanket.position = new Vector3(1.5, 0.37, 0.1);

    // Headboard
    const headboard = MeshBuilder.CreateBox('headboard', { width: 1.05, depth: 0.12, height: 0.55 }, this.scene);
    headboard.material = bedFrameMat;
    headboard.position = new Vector3(1.5, 0.44, -1.25);
    headboard.metadata = { inspectable: true, actionId: 'inspect_bed' };

    // Make the whole bed area tappable (via blanket mesh + frame)
    blanket.metadata = { inspectable: true, actionId: 'inspect_bed' };
    mattress.metadata = { inspectable: true, actionId: 'inspect_bed' };

    // ── Yongbin floor bedding ──────────────────────────────────────────────────
    const yongBeddingMat = createCelMaterial(this.scene, 'ybedding_mat', '#3a4a7a');
    const yongBedding = MeshBuilder.CreateBox('yongbin_bedding', { width: 0.92, depth: 1.85, height: 0.08 }, this.scene);
    yongBedding.material = yongBeddingMat;
    yongBedding.position = new Vector3(0.75, 0.04, -0.1);
    yongBedding.metadata = { inspectable: true, actionId: 'inspect_yongbin' };

    // ── Shelf on wall ──────────────────────────────────────────────────────────
    const shelfMat = createCelMaterial(this.scene, 'shelf_mat', '#3a2010');
    const shelf = MeshBuilder.CreateBox('shelf', { width: 0.9, depth: 0.22, height: 0.04 }, this.scene);
    shelf.material = shelfMat;
    shelf.position = new Vector3(-1.8, 1.8, 2.4);

    // Books on shelf
    const bookColors = ['#aa2222', '#2244aa', '#22aa44', '#aa7722', '#8822aa'];
    for (let i = 0; i < 5; i++) {
      const book = MeshBuilder.CreateBox('book' + i, { width: 0.06 + Math.random() * 0.03, depth: 0.18, height: 0.2 }, this.scene);
      book.material = createFlatMaterial(this.scene, 'book_mat' + i, bookColors[i % bookColors.length]);
      book.position = new Vector3(-2.1 + i * 0.15, 1.92, 2.4);
    }

    // ── Cup / bottle on desk ──────────────────────────────────────────────────
    const cupMat = createFlatMaterial(this.scene, 'cup_mat', '#668866');
    const cup = MeshBuilder.CreateCylinder('cup', { height: 0.1, diameterBottom: 0.055, diameterTop: 0.065, tessellation: 10 }, this.scene);
    cup.material = cupMat;
    cup.position = new Vector3(-1.18, 0.82, 0.3);

    // Water bottle
    const bottleMat = createFlatMaterial(this.scene, 'bottle_mat', '#aaccee');
    const bottle = MeshBuilder.CreateCylinder('bottle', { height: 0.22, diameter: 0.07, tessellation: 10 }, this.scene);
    bottle.material = bottleMat;
    bottle.position = new Vector3(-1.95, 0.88, 0.45);

    // ── Phone on desk ──────────────────────────────────────────────────────────
    const phoneMat = createFlatMaterial(this.scene, 'phone_mat', '#111111');
    const phone = MeshBuilder.CreateBox('phone', { width: 0.075, depth: 0.012, height: 0.155 }, this.scene);
    phone.material = phoneMat;
    phone.position = new Vector3(-1.85, 0.778, 0.3);
    phone.rotation.y = 0.2;
  }

  // ── Characters ─────────────────────────────────────────────────────────────

  private _buildCharacters(): void {
    // Taeil sitting at desk
    this.taeilRoot = buildTaeil(this.scene, CHARACTER_COLORS.taeil);
    this.taeilRoot.position = new Vector3(-1.5, 0.48, -0.05);
    this.taeilRoot.rotation.y = Math.PI * 0.05;
    // Bend forward slightly (sitting at desk)
    const taeilTorsoRef = this.scene.getMeshByName('taeil_torso');
    if (taeilTorsoRef) taeilTorsoRef.rotation.x = 0.18;

    // Yongbin sleeping on floor
    this.yongbinRoot = buildYongbin(this.scene, CHARACTER_COLORS.yongbin);
    this.yongbinRoot.position = new Vector3(0.75, 0.35, -0.1);
    this.yongbinRoot.rotation.y = Math.PI * 0.5;
  }

  // ── Portal slot ────────────────────────────────────────────────────────────

  private _buildPortalSlot(): void {
    // Portal disc (starts invisible)
    const portalMat = createUnlitMaterial(this.scene, 'portal_mat', '#00cc88', 0);
    this.portalMesh = MeshBuilder.CreateCylinder('portal_disc', {
      height: 0.04,
      diameter: 0.01,
      tessellation: 32,
    }, this.scene);
    this.portalMesh.material = portalMat;
    this.portalMesh.position = new Vector3(1.5, 0.0, -0.2);

    // Particle system for portal
    this.portalParticles = new ParticleSystem('portal_particles', 400, this.scene);
    this.portalParticles.emitter = this.portalMesh;
    this.portalParticles.minSize = 0.02;
    this.portalParticles.maxSize = 0.08;
    this.portalParticles.minLifeTime = 0.5;
    this.portalParticles.maxLifeTime = 1.5;
    this.portalParticles.emitRate = 0;
    this.portalParticles.minEmitPower = 0.3;
    this.portalParticles.maxEmitPower = 1.0;
    this.portalParticles.color1 = new Color4(0.1, 1.0, 0.6, 1);
    this.portalParticles.color2 = new Color4(0.0, 0.8, 1.0, 1);
    this.portalParticles.colorDead = new Color4(0.1, 0.5, 0.3, 0);
    this.portalParticles.direction1 = new Vector3(-0.5, 0.5, -0.5);
    this.portalParticles.direction2 = new Vector3(0.5, 1.5, 0.5);
    this.portalParticles.start();

    // Paper particles (for portal suction — starts stopped)
    this.paperParticles = new ParticleSystem('paper_particles', 60, this.scene);
    this.paperParticles.emitter = new Vector3(0, 0.8, 0);
    this.paperParticles.minSize = 0.05;
    this.paperParticles.maxSize = 0.18;
    this.paperParticles.minLifeTime = 0.8;
    this.paperParticles.maxLifeTime = 1.6;
    this.paperParticles.emitRate = 0;
    this.paperParticles.color1 = new Color4(0.95, 0.92, 0.85, 0.9);
    this.paperParticles.color2 = new Color4(0.85, 0.82, 0.75, 0.7);
    this.paperParticles.colorDead = new Color4(0.8, 0.8, 0.7, 0);
    this.paperParticles.direction1 = new Vector3(-1, -0.5, -0.5);
    this.paperParticles.direction2 = new Vector3(1, 0.5, 0.5);
    this.paperParticles.gravity = new Vector3(0, -2, 0);
    this.paperParticles.start();
  }

  // ── Highlight layer for inspectable objects ────────────────────────────────

  private _setupHighlights(): void {
    this.highlightLayer = new HighlightLayer('hl', this.scene);
    this.highlightLayer.innerGlow = false;
  }

  // ── EventBridge subscriptions ──────────────────────────────────────────────

  private _subscribeEvents(): void {
    this._unsubShowDlg = EventBridge.on('show_dialogue', () => {
      this._dialogueActive = true;
    });
    this.unsubDialogue = EventBridge.on('dialogue_complete', ({ sequenceId }) => {
      this._dialogueActive = false;
      this._onDialogueComplete(sequenceId);
    });
    this.unsubInteract = EventBridge.on('interact_confirm', ({ actionId }) => {
      this._onInteract(actionId);
    });
  }

  // ── Phase: Desk cinematic ──────────────────────────────────────────────────

  private _beginDeskCinematic(): void {
    this.phase = Phase.DESK_CINEMATIC;

    // Slow push-in camera animation (3s)
    const camAnim = new Animation('camPush', 'position.z', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camAnim.setKeys([
      { frame: 0, value: -2.8 },
      { frame: 180, value: -1.9 },
    ]);
    this.camera.animations = [camAnim];
    this.scene.beginAnimation(this.camera, 0, 180, false, 1, () => {
      // After push-in, show opening dialogue
      EventBridge.emit('show_dialogue', {
        sequenceId: 'apartment_desk_monologue',
        onComplete: () => this._beginDeskInspect(),
      });
    });
  }

  // ── Phase: Inspect ─────────────────────────────────────────────────────────

  private _beginDeskInspect(): void {
    this.phase = Phase.DESK_INSPECT;

    // Stand Taeil up from the chair
    this.taeilRoot.position = new Vector3(-1.5, 0, -0.05);
    this.taeilRoot.rotation.y = 0;
    const torso = this.scene.getMeshByName('taeil_torso');
    if (torso) torso.rotation.x = 0;

    // Enable free movement + per-frame update
    this._movementEnabled = true;
    this._updateFn = () => this._updateExploration();
    this.scene.registerBeforeRender(this._updateFn);

    // Show objective
    EventBridge.emit('show_interact_prompt', {
      text: '→ 침대로 가서 쉬자',
      actionId: 'objective_bed',
    });

    // Still allow click-to-inspect on optional objects
    this.scene.meshes.forEach((mesh) => {
      if (mesh.metadata?.inspectable) {
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            if (this.phase !== Phase.DESK_INSPECT) return;
            EventBridge.emit('interact_confirm', { actionId: mesh.metadata.actionId });
          })
        );
      }
    });
  }

  // ── Per-frame exploration logic ────────────────────────────────────────────

  private _updateExploration(): void {
    if (this.phase !== Phase.DESK_INSPECT || !this._movementEnabled || this._dialogueActive) return;

    const dt     = this.scene.getEngine().getDeltaTime() / 1000;
    const SPEED  = 2.2;
    const BED_C  = new Vector3(1.5, 0, -0.2);
    const THRESH = 1.1;

    // ── Movement ──
    const { x, y } = inputManager.getMovementVector();
    if (x !== 0 || y !== 0) {
      const dx =  x * SPEED * dt;
      const dz = -y * SPEED * dt;
      this.taeilRoot.position.x = Math.max(-2.6, Math.min(2.6, this.taeilRoot.position.x + dx));
      this.taeilRoot.position.z = Math.max(-2.2, Math.min(2.2, this.taeilRoot.position.z + dz));

      // Face movement direction
      const tgt = Math.atan2(dx, dz);
      let diff = tgt - this.taeilRoot.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.taeilRoot.rotation.y += diff * Math.min(dt * 14, 1);

      // Walk bob
      this.taeilRoot.position.y = Math.abs(Math.sin(performance.now() * 0.007)) * 0.03;
    }

    // ── Camera follow ──
    this._followCamRoom();

    // ── Bed proximity ──
    const dist    = Vector3.Distance(
      new Vector3(this.taeilRoot.position.x, 0, this.taeilRoot.position.z),
      BED_C,
    );
    const nearBed = dist < THRESH;
    if (nearBed !== this._nearBed) {
      this._nearBed = nearBed;
      EventBridge.emit('show_interact_prompt', nearBed
        ? { text: '쉬기  [E]', actionId: 'inspect_bed' }
        : { text: '→ 침대로 가서 쉬자', actionId: 'objective_bed' },
      );
    }

    // ── E key / interact button while near bed ──
    if (nearBed && inputManager.consumeJustPressed('interact')) {
      this._onInteract('inspect_bed');
    }
  }

  private _followCamRoom(): void {
    const p   = this.taeilRoot.position;
    const des = new Vector3(p.x * 0.35, p.y + 1.75, p.z - 1.9);
    this.camera.position = Vector3.Lerp(this.camera.position, des, 0.06);
    this.camera.setTarget(
      Vector3.Lerp(this.camera.target, new Vector3(p.x, p.y + 0.85, p.z + 0.2), 0.08),
    );
  }

  private _onInteract(actionId: string): void {
    if (this.phase !== Phase.DESK_INSPECT) return;

    if (actionId === 'inspect_bed') {
      // Lock movement before sleep transition
      this._movementEnabled = false;
      if (this._updateFn) {
        this.scene.unregisterBeforeRender(this._updateFn);
        this._updateFn = null;
      }
      // Primary progression action
      EventBridge.emit('hide_interact_prompt', undefined as unknown as void);
      EventBridge.emit('show_dialogue', {
        sequenceId: 'apartment_inspect_bed',
        onComplete: () => this._beginSleepTransition(),
      });
    } else if (actionId === 'inspect_laptop') {
      EventBridge.emit('show_dialogue', { sequenceId: 'apartment_inspect_laptop' });
    } else if (actionId === 'inspect_papers') {
      EventBridge.emit('show_dialogue', { sequenceId: 'apartment_inspect_papers' });
    } else if (actionId === 'inspect_notes') {
      EventBridge.emit('show_dialogue', { sequenceId: 'apartment_inspect_notes' });
    } else if (actionId === 'inspect_yongbin') {
      EventBridge.emit('show_dialogue', { sequenceId: 'apartment_inspect_yongbin' });
    }
  }

  // ── Phase: Sleep transition ────────────────────────────────────────────────

  private _beginSleepTransition(): void {
    this.phase = Phase.SLEEP_TRANSITION;

    // Move Taeil to bed position
    this.taeilRoot.position = new Vector3(1.5, 0.4, -0.2);
    this.taeilRoot.rotation.y = Math.PI;
    // Lay flat
    this.taeilRoot.rotation.z = Math.PI / 2;

    // Move camera to bedside angle
    const camTargetAnim = new Animation('camSide', 'position', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camTargetAnim.setKeys([
      { frame: 0, value: this.camera.position.clone() },
      { frame: 90, value: new Vector3(0.2, 1.35, -1.5) },
    ]);
    this.camera.animations = [camTargetAnim];
    this.scene.beginAnimation(this.camera, 0, 90, false, 1);

    // Dim desk lamp
    const lampAnim = new Animation('lampDim', 'intensity', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    lampAnim.setKeys([
      { frame: 0, value: 1.2 },
      { frame: 90, value: 0.0 },
    ]);
    this.lampLight.animations = [lampAnim];
    this.monitorLight.animations = [lampAnim.clone()];
    this.scene.beginAnimation(this.lampLight, 0, 90, false, 1);
    this.scene.beginAnimation(this.monitorLight, 0, 90, false, 1);

    // After camera settles, begin snoring
    setTimeout(() => this._beginSnoring(), 2500);
  }

  // ── Phase: Snoring ─────────────────────────────────────────────────────────

  private _beginSnoring(): void {
    this.phase = Phase.SNORING;

    EventBridge.emit('show_dialogue', {
      sequenceId: 'apartment_snoring',
      onComplete: () => this._beginPortalAppear(),
    });

    // Camera shake grows with snoring (timed to dialogue lines)
    setTimeout(() => this._cameraShake(0.006, 300), 2000);
    setTimeout(() => this._cameraShake(0.018, 500), 5500);
    setTimeout(() => this._cameraShake(0.04, 800), 9000);
  }

  private _cameraShake(intensity: number, durationMs: number): void {
    const origin = this.camera.position.clone();
    const steps = Math.floor(durationMs / 16);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps) {
        clearInterval(interval);
        this.camera.position.copyFrom(origin);
        return;
      }
      this.camera.position.x = origin.x + (Math.random() - 0.5) * intensity;
      this.camera.position.y = origin.y + (Math.random() - 0.5) * intensity;
      i++;
    }, 16);
  }

  // ── Phase: Portal appear ───────────────────────────────────────────────────

  private _beginPortalAppear(): void {
    this.phase = Phase.PORTAL_APPEAR;

    // Animate portal disc growing
    const discAnim = new Animation('portalGrow', 'scaling', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    discAnim.setKeys([
      { frame: 0, value: new Vector3(0.01, 1, 0.01) },
      { frame: 90, value: new Vector3(0.6, 1, 0.6) },
    ]);
    this.portalMesh.animations = [discAnim];
    this.scene.beginAnimation(this.portalMesh, 0, 90, false, 1);

    // Fade portal material in
    const mat = this.portalMesh.material as StandardMaterial;
    let t = 0;
    const fadeIn = setInterval(() => {
      t += 0.04;
      if (mat) mat.alpha = Math.min(t, 0.85);
      this.portalLight.intensity = Math.min(t * 1.5, 1.8);
      if (t >= 1) clearInterval(fadeIn);
    }, 50);

    // Start particles
    this.portalParticles.emitRate = 60;

    // Portal notice dialogue after short delay
    setTimeout(() => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'apartment_portal_notice',
        onComplete: () => this._beginPortalExpand(),
      });
    }, 1800);
  }

  // ── Phase: Portal expand ───────────────────────────────────────────────────

  private _beginPortalExpand(): void {
    this.phase = Phase.PORTAL_EXPAND;

    // Portal rapidly expands
    const expandAnim = new Animation('portalExpand', 'scaling', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    expandAnim.setKeys([
      { frame: 0, value: this.portalMesh.scaling.clone() },
      { frame: 30, value: new Vector3(2.0, 1, 2.0) },
    ]);
    this.portalMesh.animations = [expandAnim];
    this.scene.beginAnimation(this.portalMesh, 0, 30, false, 1);

    this.portalParticles.emitRate = 200;
    this.paperParticles.emitRate = 40;

    // Strong camera shake
    this._cameraShake(0.06, 1200);

    EventBridge.emit('show_dialogue', {
      sequenceId: 'apartment_portal_fall',
      onComplete: () => this._beginFalling(),
    });
  }

  // ── Phase: Falling ─────────────────────────────────────────────────────────

  private _beginFalling(): void {
    this.phase = Phase.FALLING;

    // Move Taeil toward portal (suction)
    const pullAnim = new Animation('taeilPull', 'position', 60,
      Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    pullAnim.setKeys([
      { frame: 0, value: this.taeilRoot.position.clone() },
      { frame: 40, value: new Vector3(1.5, -0.3, -0.2) },
    ]);
    this.taeilRoot.animations = [pullAnim];
    this.scene.beginAnimation(this.taeilRoot, 0, 40, false, 1);

    // Fade to black
    this._fadeOut(800, () => this.onComplete());
  }

  // ── Utility: fade to black ─────────────────────────────────────────────────

  private _fadeOut(durationMs: number, onDone: () => void): void {
    let opacity = 0;
    const steps = durationMs / 16;
    const step = 1 / steps;
    const iv = setInterval(() => {
      opacity += step;
      this.scene.clearColor = new Color4(0, 0, 0, Math.min(opacity, 1));
      if (opacity >= 1) {
        clearInterval(iv);
        onDone();
      }
    }, 16);
  }

  // ── Dialogue completion routing ────────────────────────────────────────────

  private _onDialogueComplete(sequenceId: string): void {
    // Handled by inline onComplete callbacks above
    void sequenceId;
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  dispose(): void {
    if (this._updateFn) this.scene.unregisterBeforeRender(this._updateFn);
    this._unsubShowDlg?.();
    this.unsubDialogue?.();
    this.unsubInteract?.();
    this.portalParticles?.dispose();
    this.paperParticles?.dispose();
    this.highlightLayer?.dispose();
    this.scene?.dispose();
  }
}
