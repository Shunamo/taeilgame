/**
 * VillageScene.ts
 * Scene 3 — Starwind Village.
 * Cinematic arrival → NPC greetings → lottery number selection → onComplete
 */

import {
  Scene,
  Engine,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  FreeCamera,
  MeshBuilder,
  TransformNode,
  Animation,
} from '@babylonjs/core';

import { EventBridge } from '@/game/EventBridge';
import { getGameState } from '@/state/GameState';
import { CHARACTER_COLORS } from '../assets/AssetRegistry';
import { createCelMaterial, createFlatMaterial, createUnlitMaterial, addOutline } from '../utils/Materials';
import { buildTaeil, buildTeemo } from '../utils/Characters';

export class VillageScene {
  private scene: Scene;
  private camera!: FreeCamera;
  private taeilRoot!: TransformNode;
  private teemoRoot!: TransformNode;
  private onComplete: () => void;
  private _unsubDlg!: () => void;
  private _unsubLottery!: () => void;
  private _phase: 'arrive' | 'lottery' | 'done' = 'arrive';

  constructor(engine: Engine, onComplete: () => void) {
    this.onComplete = onComplete;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.55, 0.78, 0.95, 1);
  }

  async build(): Promise<void> {
    this._setupCamera();
    this._setupLights();
    this._buildEnvironment();
    this._buildCharacters();
    this._subscribeEvents();

    this.scene.getEngine().runRenderLoop(() => {
      if (this.scene) this.scene.render();
    });

    setTimeout(() => this._beginArrival(), 500);
  }

  private _setupCamera(): void {
    this.camera = new FreeCamera('vil_cam', new Vector3(0, 3.5, -12), this.scene);
    this.camera.setTarget(new Vector3(0, 1.2, 0));
    this.camera.minZ = 0.1;
  }

  private _setupLights(): void {
    const ambient = new HemisphericLight('vil_amb', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 1.0;
    ambient.diffuse = new Color3(0.95, 0.88, 0.72);
    ambient.groundColor = new Color3(0.5, 0.6, 0.4);

    const sun = new DirectionalLight('vil_sun', new Vector3(-0.5, -1, 0.3), this.scene);
    sun.intensity = 1.2;
    sun.diffuse = new Color3(1.0, 0.9, 0.7);
  }

  private _buildEnvironment(): void {
    // Ground
    const groundMat = createCelMaterial(this.scene, 'vil_ground', '#7aaa55');
    const ground = MeshBuilder.CreateGround('vil_ground', { width: 40, height: 40 }, this.scene);
    ground.material = groundMat;

    // Stone path
    const pathMat = createFlatMaterial(this.scene, 'vil_path', '#b0a090');
    for (let i = -3; i < 3; i++) {
      const stone = MeshBuilder.CreateBox('path' + i, { width: 2.4, depth: 1.0, height: 0.08 }, this.scene);
      stone.material = pathMat;
      stone.position = new Vector3(0, 0.04, i * 1.2);
    }

    // Village gate arch
    const gateMatColor = createCelMaterial(this.scene, 'vil_gate', '#8b6240');
    const gateL = MeshBuilder.CreateBox('gate_l', { width: 0.4, depth: 0.4, height: 3.5 }, this.scene);
    gateL.material = gateMatColor;
    gateL.position = new Vector3(-1.5, 1.75, 3);
    addOutline(gateL, 0.8);
    const gateR = gateL.clone('gate_r');
    gateR.position.x = 1.5;
    const gateTop = MeshBuilder.CreateBox('gate_top', { width: 3.6, depth: 0.4, height: 0.45 }, this.scene);
    gateTop.material = gateMatColor;
    gateTop.position = new Vector3(0, 3.5, 3);
    addOutline(gateTop, 0.8);

    // Gate banner
    const bannerMat = createUnlitMaterial(this.scene, 'vil_banner', '#e84040', 0.95);
    const banner = MeshBuilder.CreateBox('gate_banner', { width: 2.6, depth: 0.06, height: 0.55 }, this.scene);
    banner.material = bannerMat;
    banner.position = new Vector3(0, 3.1, 3.1);

    // Houses (3 simple ones)
    const houseColors = ['#d4a87a', '#b0c8e0', '#c8d4a0'];
    const roofColors  = ['#884422', '#446688', '#558833'];
    for (let i = 0; i < 3; i++) {
      const hx = (i - 1) * 7;
      const houseBody = MeshBuilder.CreateBox('house' + i, { width: 3, depth: 3, height: 2.2 }, this.scene);
      houseBody.material = createCelMaterial(this.scene, 'house_m' + i, houseColors[i]);
      houseBody.position = new Vector3(hx, 1.1, 8);
      addOutline(houseBody, 0.7);

      const roofPts = [
        new Vector3(-1.7, 0, -1.7), new Vector3(1.7, 0, -1.7),
        new Vector3(1.7, 0,  1.7), new Vector3(-1.7, 0,  1.7),
        new Vector3(0, 1.5, 0),
      ];
      const roof = MeshBuilder.CreatePolyhedron('roof' + i, {
        custom: {
          vertex: roofPts.map(p => [p.x, p.y, p.z]),
          face: [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,1,2,3]],
        },
      }, this.scene);
      roof.material = createCelMaterial(this.scene, 'roof_m' + i, roofColors[i]);
      roof.position = new Vector3(hx, 2.2, 8);
      addOutline(roof, 0.6);
    }

    // Trees
    const treeTrunkMat = createFlatMaterial(this.scene, 'vil_trunk', '#6b3c1a');
    const treeCrownMat = createCelMaterial(this.scene, 'vil_crown', '#3a7a30');
    const treePos = [[-6, 5], [6, 5], [-8, 10], [8, 10], [-5, 15], [5, 15]];
    for (let i = 0; i < treePos.length; i++) {
      const [tx, tz] = treePos[i];
      const trunk = MeshBuilder.CreateCylinder('tr_trunk' + i, { height: 2.0, diameter: 0.35, tessellation: 7 }, this.scene);
      trunk.material = treeTrunkMat;
      trunk.position = new Vector3(tx, 1.0, tz);
      const crown = MeshBuilder.CreateSphere('tr_crown' + i, { diameter: 2.5, segments: 7 }, this.scene);
      crown.material = treeCrownMat;
      crown.scaling = new Vector3(1, 0.88, 1);
      crown.position = new Vector3(tx, 2.8, tz);
      addOutline(crown, 0.6);
    }

    // Village notice board
    const boardMat = createCelMaterial(this.scene, 'vil_board', '#c8a060');
    const board = MeshBuilder.CreateBox('notice_board', { width: 1.4, depth: 0.08, height: 1.0 }, this.scene);
    board.material = boardMat;
    board.position = new Vector3(-3.5, 0.9, 1.5);
    const boardPost = MeshBuilder.CreateCylinder('board_post', { height: 1.0, diameter: 0.1, tessellation: 7 }, this.scene);
    boardPost.material = treeTrunkMat;
    boardPost.position = new Vector3(-3.5, 0.5, 1.5);

    // Lottery booth
    const boothMat = createCelMaterial(this.scene, 'vil_booth', '#e0c888');
    const booth = MeshBuilder.CreateBox('lottery_booth', { width: 2.5, depth: 1.5, height: 1.6 }, this.scene);
    booth.material = boothMat;
    booth.position = new Vector3(4, 0.8, 1.5);
    addOutline(booth, 0.8);
    const boothRoof = MeshBuilder.CreateBox('booth_roof', { width: 2.8, depth: 1.8, height: 0.15 }, this.scene);
    boothRoof.material = createCelMaterial(this.scene, 'vil_booth_roof', '#c04030');
    boothRoof.position = new Vector3(4, 1.68, 1.5);
    addOutline(boothRoof, 0.6);
  }

  private _buildCharacters(): void {
    this.taeilRoot = buildTaeil(this.scene, CHARACTER_COLORS.taeil);
    this.taeilRoot.position = new Vector3(-1.0, 0, -6);
    this.taeilRoot.rotation.y = 0;

    this.teemoRoot = buildTeemo(this.scene, CHARACTER_COLORS.teemo);
    this.teemoRoot.position = new Vector3(0.8, 0, -6);
    this.teemoRoot.rotation.y = 0;
  }

  private _subscribeEvents(): void {
    this._unsubDlg = EventBridge.on('dialogue_complete', ({ sequenceId }) => {
      this._onDialogueComplete(sequenceId);
    });
    this._unsubLottery = EventBridge.on('lottery_picked', ({ number }) => {
      getGameState().setLotteryNumber(number);
      this._phase = 'done';
      setTimeout(() => {
        EventBridge.emit('show_dialogue', {
          sequenceId: 'village_lottery_done',
          onComplete: () => this._beginQuestIntro(),
        });
      }, 400);
    });
  }

  private _onDialogueComplete(seqId: string): void {
    switch (seqId) {
      case 'village_arrive':
        this._walkToGate();
        break;
      case 'village_register':
        this._showLotteryUI();
        break;
      case 'village_quests_done':
        this._fadeAndComplete();
        break;
    }
  }

  private _beginArrival(): void {
    // Camera pan down from sky
    const camAnim = new Animation('vil_cam_arrive', 'position.y', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    camAnim.setKeys([
      { frame: 0, value: 3.5 },
      { frame: 90, value: 2.2 },
    ]);
    this.camera.animations = [camAnim];
    this.scene.beginAnimation(this.camera, 0, 90, false, 1, () => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'village_arrive',
      });
    });
  }

  private _walkToGate(): void {
    // Animate characters walking to gate
    const walk = new Animation('vil_walk', 'position.z', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    walk.setKeys([
      { frame: 0, value: -6 },
      { frame: 120, value: 0 },
    ]);
    this.taeilRoot.animations = [walk];
    this.teemoRoot.animations = [walk.clone()];
    this.scene.beginAnimation(this.taeilRoot, 0, 120, false, 1);
    this.scene.beginAnimation(this.teemoRoot, 0, 120, false, 1, () => {
      EventBridge.emit('show_dialogue', {
        sequenceId: 'village_register',
      });
    });
  }

  private _showLotteryUI(): void {
    this._phase = 'lottery';
    EventBridge.emit('show_lottery_ui', undefined as unknown as void);
  }

  private _beginQuestIntro(): void {
    EventBridge.emit('show_dialogue', {
      sequenceId: 'village_quests_done',
    });
  }

  private _fadeAndComplete(): void {
    let op = 0;
    const iv = setInterval(() => {
      op += 0.04;
      this.scene.clearColor = new Color4(0, 0, 0, Math.min(op, 1));
      if (op >= 1) { clearInterval(iv); this.onComplete(); }
    }, 16);
  }

  dispose(): void {
    this._unsubDlg?.();
    this._unsubLottery?.();
    this.scene?.dispose();
  }
}
