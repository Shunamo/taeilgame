/**
 * AssetRegistry.ts
 * Central registry for all game assets.
 * Null model paths = procedural placeholder is used.
 * Replace paths with GLB/GLTF paths when real assets are ready.
 */

export interface CharacterColorConfig {
  skin: string;
  hair: string;
  top: string;    // shirt / jacket
  bottom: string; // pants
  accent?: string;
}

export const CHARACTER_COLORS: Record<string, CharacterColorConfig> = {
  taeil: {
    skin: '#f5c5a0',
    hair: '#1a1010',
    top: '#7a4c28',     // warm brown checkered shirt (matches portrait)
    bottom: '#2a2a3a',  // dark pants
  },
  teemo: {
    skin: '#e8c890',
    hair: '#3a1a00',
    top: '#2a5a30',     // forest green tunic
    bottom: '#4a3020',  // brown pants
    accent: '#c83020',  // red mushroom hat (matches portrait)
  },
  yongbin: {
    skin: '#f0c090',
    hair: '#0a0a0a',
    top: '#2a2a2a',     // dark sleep clothes
    bottom: '#1a1a2a',
  },
};

/** Paths to GLB model files — null means use procedural placeholder */
export const MODEL_PATHS: Record<string, string | null> = {
  taeil: null,   // '/assets/models/taeil.glb' when available
  teemo: null,   // '/assets/models/teemo.glb' when available
  yongbin: null,
};

/** Apartment prop configs */
export const APARTMENT_CONFIG = {
  room: { width: 6, depth: 5, height: 2.6 },
  deskPos: { x: -1.5, y: 0, z: 0.5 },
  bedPos: { x: 1.2, y: 0, z: 0 },
  yongbinPos: { x: 0.8, y: 0, z: 1.2 },
  taeilDeskPos: { x: -1.5, y: 0, z: 0 },
  taeilBedPos: { x: 1.2, y: 0.5, z: 0 },
};

/** Meadow environment configs */
export const MEADOW_CONFIG = {
  groundSize: 80,
  mountainPositions: [
    { x: -25, z: 30, height: 18 },
    { x: -10, z: 40, height: 24 },
    { x: 15, z: 35, height: 20 },
    { x: 30, z: 30, height: 16 },
  ],
  villagePos: { x: 18, y: 0, z: 28 },
  teemoStartPos: { x: 1.5, y: 0, z: 2 },
  taeilLandPos: { x: 0, y: 0, z: 2 },
};
