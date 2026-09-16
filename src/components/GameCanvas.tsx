/**
 * GameCanvas.tsx
 * Mounts the Babylon.js engine into a canvas element.
 * Babylon.js is dynamically imported (client-side only — no SSR).
 * The engine instance is stored in a ref and destroyed on unmount.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { inputManager } from '@/game/InputManager';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<import('@babylonjs/core').Engine | null>(null);

  useEffect(() => {
    if (engineRef.current) return; // already mounted

    let destroyed = false;

    (async () => {
      const { Engine } = await import('@babylonjs/core');
      const { BabylonGame } = await import('@/babylon/BabylonGame');

      if (destroyed || !canvasRef.current) return;

      const engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        adaptToDeviceRatio: true,
      });

      engineRef.current = engine;

      // Attach keyboard + mouse input listeners for desktop controls
      inputManager.attach();

      const game = new BabylonGame(engine);
      game.start();

      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);

      // Store game ref on canvas for potential external access
      (canvasRef.current as HTMLCanvasElement & { _gameRef?: unknown })._gameRef = game;
    })();

    return () => {
      destroyed = true;
      inputManager.detach();
      if (engineRef.current) {
        engineRef.current.stopRenderLoop();
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
        outline: 'none',
      }}
    />
  );
}
