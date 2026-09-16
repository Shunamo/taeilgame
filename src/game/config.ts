/**
 * config.ts
 * Phaser.Game configuration factory.
 * Called client-side only (dynamic import in GameCanvas.tsx).
 */

// config.ts is always loaded after Phaser has been dynamically imported.
// We receive the Phaser namespace as a parameter so this file stays
// SSR-safe (no top-level Phaser import that would run on the server).

/** Target game resolution — iPhone 14 Pro proportions */
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export function createPhaserConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Phaser: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scenes: any[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0d0d2b',
    parent: 'game-container',
    scene: scenes,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    // Transparent background so React overlays can show through if needed
    transparent: false,
    // Disable right-click context menu on canvas
    disableContextMenu: true,
    // Audio config
    audio: {
      disableWebAudio: false,
    },
    input: {
      activePointers: 2, // allow two-finger gestures
    },
  };
}
