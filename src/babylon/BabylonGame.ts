/**
 * BabylonGame.ts
 * Top-level game controller.
 * Full scene sequence: Apartment → Fall → Meadow → Playable → Village →
 *   Poro → Cinnamoroll → Tahm → Forest → Sunset → Party → Return → Clear
 *
 * Debug skip keys 1-9 (desktop only):
 *   1=Apartment  2=Fall  3=Meadow  4=Playable  5=Village
 *   6=Poro  7=Cinnamoroll  8=Tahm  9=Forest
 */

import { Engine } from '@babylonjs/core';
import { getGameState } from '@/state/GameState';

type SceneId =
  | 'apartment' | 'fall' | 'meadow' | 'playable'
  | 'village' | 'poro' | 'cinnamoroll' | 'tahm'
  | 'forest' | 'sunset' | 'party' | 'return' | 'clear';

export class BabylonGame {
  private engine: Engine;
  private currentScene: { dispose: () => void } | null = null;
  private _skipHandler?: (e: KeyboardEvent) => void;

  constructor(engine: Engine) {
    this.engine = engine;
    this._setupSkipKeys();
  }

  start(): void {
    this._goTo('apartment');
  }

  // ── Debug skip keys ────────────────────────────────────────────────────────

  private _setupSkipKeys(): void {
    const skipMap: Record<string, SceneId> = {
      '1': 'apartment', '2': 'fall', '3': 'meadow', '4': 'playable',
      '5': 'village', '6': 'poro', '7': 'cinnamoroll', '8': 'tahm',
      '9': 'forest',
    };
    this._skipHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const id = skipMap[e.key];
      if (id) this._goTo(id);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._skipHandler);
    }
  }

  // ── Scene router ──────────────────────────────────────────────────────────

  private _goTo(id: SceneId): void {
    this.currentScene?.dispose();
    this.currentScene = null;
    switch (id) {
      case 'apartment':   this._startApartment(); break;
      case 'fall':        this._startFall(); break;
      case 'meadow':      this._startMeadow(); break;
      case 'playable':    this._startPlayable(); break;
      case 'village':     this._startVillage(); break;
      case 'poro':        this._startPoro(); break;
      case 'cinnamoroll': this._startCinnamoroll(); break;
      case 'tahm':        this._startTahm(); break;
      case 'forest':      this._startForest(); break;
      case 'sunset':      this._startSunset(); break;
      case 'party':       this._startParty(); break;
      case 'return':      this._startReturn(); break;
      case 'clear':       this._startClear(); break;
    }
  }

  // ── Scene 1A: Apartment ───────────────────────────────────────────────────

  private async _startApartment(): Promise<void> {
    const { ApartmentScene } = await import('./scenes/ApartmentScene');
    const scene = new ApartmentScene(this.engine, () => this._goTo('fall'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('apartment');
  }

  // ── Scene 1B: Falling transition ──────────────────────────────────────────

  private async _startFall(): Promise<void> {
    const { FallScene } = await import('./scenes/FallScene');
    const scene = new FallScene(this.engine, () => this._goTo('meadow'));
    this.currentScene = scene;
    await scene.build();
  }

  // ── Scene 1C: Meadow ──────────────────────────────────────────────────────

  private async _startMeadow(): Promise<void> {
    const { MeadowScene } = await import('./scenes/MeadowScene');
    const scene = new MeadowScene(this.engine, () => this._goTo('playable'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('meadow');
  }

  // ── Scene 2: Playable meadow/village-entrance ─────────────────────────────

  private async _startPlayable(): Promise<void> {
    const { PlayableScene } = await import('./scenes/PlayableScene');
    const scene = new PlayableScene(this.engine, () => this._goTo('village'));
    this.currentScene = scene;
    await scene.start();
    getGameState().setCurrentScene('playable');
  }

  // ── Scene 3: Starwind Village ─────────────────────────────────────────────

  private async _startVillage(): Promise<void> {
    const { VillageScene } = await import('./scenes/VillageScene');
    const scene = new VillageScene(this.engine, () => this._goTo('poro'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('village');
  }

  // ── Scene 4: Poro rescue (Combat #1) ─────────────────────────────────────

  private async _startPoro(): Promise<void> {
    const { PoroScene } = await import('./scenes/PoroScene');
    const scene = new PoroScene(this.engine, () => this._goTo('cinnamoroll'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('poro');
  }

  // ── Scene 5: Cinnamoroll quest (Combat #2) ────────────────────────────────

  private async _startCinnamoroll(): Promise<void> {
    const { CinnamorollScene } = await import('./scenes/CinnamorollScene');
    const scene = new CinnamorollScene(this.engine, () => this._goTo('tahm'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('cinnamoroll');
  }

  // ── Scene 6: Tahm Kench bridge (Combat #3 boss) ───────────────────────────

  private async _startTahm(): Promise<void> {
    const { TahmScene } = await import('./scenes/TahmScene');
    const scene = new TahmScene(this.engine, () => this._goTo('forest'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('tahm');
  }

  // ── Scene 7: Memory Forest ────────────────────────────────────────────────

  private async _startForest(): Promise<void> {
    const { ForestScene } = await import('./scenes/ForestScene');
    const scene = new ForestScene(this.engine, () => this._goTo('sunset'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('forest');
  }

  // ── Scene 8: Sunset Hill ──────────────────────────────────────────────────

  private async _startSunset(): Promise<void> {
    const { SunsetScene } = await import('./scenes/SunsetScene');
    const scene = new SunsetScene(this.engine, () => this._goTo('party'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('sunset');
  }

  // ── Scene 9: Birthday Party ───────────────────────────────────────────────

  private async _startParty(): Promise<void> {
    const { PartyScene } = await import('./scenes/PartyScene');
    const scene = new PartyScene(this.engine, () => this._goTo('return'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('party');
  }

  // ── Scene 10: Return home ─────────────────────────────────────────────────

  private async _startReturn(): Promise<void> {
    const { ReturnScene } = await import('./scenes/ReturnScene');
    const scene = new ReturnScene(this.engine, () => this._goTo('clear'));
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('return');
  }

  // ── Scene 11: CLEAR ───────────────────────────────────────────────────────

  private async _startClear(): Promise<void> {
    const { ClearScene } = await import('./scenes/ClearScene');
    const scene = new ClearScene(this.engine, () => {});
    this.currentScene = scene;
    await scene.build();
    getGameState().setCurrentScene('clear');
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._skipHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._skipHandler);
    }
    this.currentScene?.dispose();
    this.currentScene = null;
  }
}
