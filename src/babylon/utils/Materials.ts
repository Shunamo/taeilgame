/**
 * Materials.ts
 * Shared material factories for the anime/cel-shaded visual style.
 */

import {
  Scene,
  Color3,
  Color4,
  StandardMaterial,
  Mesh,
} from '@babylonjs/core';
import { CellMaterial } from '@babylonjs/materials';

// ── Cel-shading ───────────────────────────────────────────────────────────────

/**
 * Create a CellMaterial (toon-shaded) with the given hex color.
 * computeHighLevel=false → hard bands = more anime feel.
 */
export function createCelMaterial(
  scene: Scene,
  name: string,
  hexColor: string,
  options?: { highLevel?: boolean; disableLighting?: boolean }
): CellMaterial {
  const mat = new CellMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(hexColor);
  mat.computeHighLevel = options?.highLevel ?? false;
  if (options?.disableLighting) {
    mat.disableLighting = true;
  }
  return mat;
}

/**
 * Unlit (emissive-only) material — for glows, screens, particles.
 */
export function createUnlitMaterial(
  scene: Scene,
  name: string,
  hexColor: string,
  alpha = 1
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.emissiveColor = Color3.FromHexString(hexColor);
  mat.disableLighting = true;
  mat.alpha = alpha;
  return mat;
}

/**
 * Flat diffuse StandardMaterial (no specular) — simpler than CellMaterial,
 * useful for environment geometry.
 */
export function createFlatMaterial(
  scene: Scene,
  name: string,
  hexColor: string
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(hexColor);
  mat.specularColor = Color3.Black();
  return mat;
}

// ── Outline ───────────────────────────────────────────────────────────────────

/**
 * Add a black anime-style outline to a mesh via EdgesRenderer.
 * Should be called after the mesh is created and material applied.
 */
export function addOutline(mesh: Mesh, width = 1.0): void {
  mesh.enableEdgesRendering();
  mesh.edgesWidth = width;
  mesh.edgesColor = new Color4(0, 0, 0, 0.9);
}

// ── Common material presets ───────────────────────────────────────────────────

/** Reusable black material for silhouettes */
export function createBlackMat(scene: Scene, name = 'mat_black'): StandardMaterial {
  return createFlatMaterial(scene, name, '#000000');
}
