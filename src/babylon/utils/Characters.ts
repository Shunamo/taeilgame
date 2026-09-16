/**
 * Characters.ts
 * Anime-styled humanoid builders using Babylon.js primitives + CellMaterial.
 * Taeil has signature round glasses.
 * Companion has red mushroom cap + amber scout goggles.
 * Replace buildHumanoid body with SceneLoader.ImportMesh() when GLBs arrive.
 */

import {
  Scene,
  MeshBuilder,
  Vector3,
  TransformNode,
  Mesh,
} from '@babylonjs/core';
import { createCelMaterial, createFlatMaterial, createUnlitMaterial, addOutline } from './Materials';
import type { CharacterColorConfig } from '../assets/AssetRegistry';

// ── Capsule helper ─────────────────────────────────────────────────────────────

function cap(name: string, r: number, h: number, scene: Scene): Mesh {
  return MeshBuilder.CreateCapsule(name, {
    radius: r,
    height: Math.max(h, r * 2 + 0.01),
    tessellation: 10,
    subdivisions: 1,
    capSubdivisions: 4,
  }, scene);
}

// ── Eye detail ─────────────────────────────────────────────────────────────────
// Each eye: white sclera sphere + flat-black pupil pressed forward.

function addEyes(
  scene: Scene,
  id: string,
  headGrp: TransformNode,
  scale: number,
  irisHex: string,
): void {
  const s = (n: number) => n * scale;
  const scleraMat = createFlatMaterial(scene, id + '_sclera', '#f4f0e8');
  const irisMat   = createCelMaterial(scene,  id + '_iris',   irisHex);
  const pupilMat  = createFlatMaterial(scene, id + '_pupil',  '#0a0806');

  for (const side of [-1, 1] as const) {
    const bx = s(0.10) * side;
    const by = s(0.02);
    const bz = s(0.170);

    // Sclera (white)
    const sc = MeshBuilder.CreateSphere(id + '_sc' + side, { diameter: s(0.085), segments: 8 }, scene);
    sc.material = scleraMat;
    sc.position  = new Vector3(bx, by, bz);
    sc.parent    = headGrp;

    // Iris (coloured ring)
    const ir = MeshBuilder.CreateSphere(id + '_ir' + side, { diameter: s(0.062), segments: 8 }, scene);
    ir.material = irisMat;
    ir.position  = new Vector3(bx, by, bz + s(0.022));
    ir.parent    = headGrp;

    // Pupil (dark dot)
    const pu = MeshBuilder.CreateSphere(id + '_pu' + side, { diameter: s(0.040), segments: 6 }, scene);
    pu.material = pupilMat;
    pu.position  = new Vector3(bx, by, bz + s(0.038));
    pu.parent    = headGrp;

    // White specular highlight — small top-left dot
    const hi = MeshBuilder.CreateSphere(id + '_hi' + side, { diameter: s(0.018), segments: 5 }, scene);
    hi.material = createFlatMaterial(scene, id + '_hi_m' + side, '#ffffff');
    hi.position  = new Vector3(bx - s(0.015), by + s(0.018), bz + s(0.048));
    hi.parent    = headGrp;
  }
}

// ── Taeil's large round glasses ────────────────────────────────────────────────

function addGlasses(scene: Scene, id: string, headGrp: TransformNode, scale: number): void {
  const s      = (n: number) => n * scale;
  const glMat  = createFlatMaterial(scene, id + '_glass_mat', '#0d0d0d');

  for (const side of [-1, 1] as const) {
    // Round lens frame (torus in XZ plane, rotated to face front)
    const frame = MeshBuilder.CreateTorus(id + '_glf' + side, {
      diameter:     s(0.155),  // outer ring size
      thickness:    s(0.018),  // wire thickness
      tessellation: 24,
    }, scene);
    frame.material  = glMat;
    frame.rotation.x = Math.PI / 2;   // stand it upright facing -Z
    frame.position   = new Vector3(s(0.105) * side, s(0.02), s(0.190));
    frame.parent     = headGrp;
    addOutline(frame, 0.5);
  }

  // Bridge connecting the two frames
  const bridge = MeshBuilder.CreateCylinder(id + '_glbridge', {
    height: s(0.075), diameter: s(0.012), tessellation: 6,
  }, scene);
  bridge.material = glMat;
  bridge.rotation.z = Math.PI / 2;
  bridge.position   = new Vector3(0, s(0.022), s(0.192));
  bridge.parent     = headGrp;

  // Temple arms (go back toward ears)
  for (const side of [-1, 1] as const) {
    const arm = MeshBuilder.CreateCylinder(id + '_glarm' + side, {
      height: s(0.16), diameter: s(0.010), tessellation: 5,
    }, scene);
    arm.material  = glMat;
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = (Math.PI / 10) * side;
    arm.position   = new Vector3(s(0.185) * side, s(0.022), s(0.130));
    arm.parent     = headGrp;
  }
}

// ── Scout goggles (Teemo-style) ────────────────────────────────────────────────
// Amber-lensed, dark-framed goggles worn on the forehead in scout/explorer style.

function addGoggles(scene: Scene, id: string, headGrp: TransformNode, scale: number): void {
  const s        = (n: number) => n * scale;
  const frameMat = createFlatMaterial(scene, id + '_gogf', '#2e1a00');
  const lensMat  = createUnlitMaterial(scene, id + '_gogl', '#c47808', 0.82);
  const strapMat = createFlatMaterial(scene, id + '_gogs', '#3a2200');

  const by = s(0.07);   // y on headGrp — upper face / forehead
  const bz = s(0.173);  // z — forward-facing (same depth as eyes)

  for (const side of [-1, 1] as const) {
    const bx = s(0.091) * side;

    // Outer goggle rim (torus facing front)
    const rim = MeshBuilder.CreateTorus(id + '_grim' + side, {
      diameter:     s(0.108),
      thickness:    s(0.023),
      tessellation: 22,
    }, scene);
    rim.material  = frameMat;
    rim.rotation.x = Math.PI / 2;
    rim.position   = new Vector3(bx, by, bz);
    rim.parent     = headGrp;
    addOutline(rim, 0.6);

    // Inner rim (slightly smaller, same color — gives depth)
    const rimInner = MeshBuilder.CreateTorus(id + '_grimi' + side, {
      diameter:     s(0.090),
      thickness:    s(0.010),
      tessellation: 18,
    }, scene);
    rimInner.material  = strapMat;
    rimInner.rotation.x = Math.PI / 2;
    rimInner.position   = new Vector3(bx, by, bz + s(0.005));
    rimInner.parent     = headGrp;

    // Amber lens (flattened sphere)
    const lens = MeshBuilder.CreateSphere(id + '_glens' + side, {
      diameter: s(0.086), segments: 8,
    }, scene);
    lens.material = lensMat;
    lens.scaling.z = 0.26;   // flatten to a disc
    lens.position  = new Vector3(bx, by, bz + s(0.010));
    lens.parent    = headGrp;

    // Small reflection highlight on lens
    const refMat = createFlatMaterial(scene, id + '_gref' + side, '#ffe090');
    const ref = MeshBuilder.CreateSphere(id + '_gref_m' + side, { diameter: s(0.022), segments: 4 }, scene);
    ref.material = refMat;
    ref.position = new Vector3(bx - s(0.018), by + s(0.020), bz + s(0.012));
    ref.parent   = headGrp;
  }

  // Bridge between the two goggle rims
  const bridge = MeshBuilder.CreateCylinder(id + '_gbridge', {
    height: s(0.052), diameter: s(0.016), tessellation: 6,
  }, scene);
  bridge.material  = frameMat;
  bridge.rotation.z = Math.PI / 2;
  bridge.position   = new Vector3(0, by, bz);
  bridge.parent     = headGrp;

  // Strap band — runs across the back of the head
  const strap = MeshBuilder.CreateBox(id + '_gstrap', {
    width: s(0.50), height: s(0.028), depth: s(0.016),
  }, scene);
  strap.material = strapMat;
  strap.position  = new Vector3(0, by, s(0.02));
  strap.parent    = headGrp;
}

// ── Nose dot ──────────────────────────────────────────────────────────────────

function addNose(scene: Scene, id: string, headGrp: TransformNode, scale: number, skinHex: string): void {
  const s    = (n: number) => n * scale;
  const nose = MeshBuilder.CreateSphere(id + '_nose', { diameter: s(0.028), segments: 5 }, scene);
  nose.material = createFlatMaterial(scene, id + '_nose_m', skinHex);
  nose.position  = new Vector3(0, -s(0.028), s(0.183));
  nose.parent    = headGrp;
}

// ── Core humanoid builder ──────────────────────────────────────────────────────

export function buildHumanoid(
  scene: Scene,
  id: string,
  colors: CharacterColorConfig,
  scale = 1.0,
  irisHex = '#1a1010',
): TransformNode {
  const root    = new TransformNode(id + '_root', scene);
  const s       = (n: number) => n * scale;

  const skinMat = createCelMaterial(scene, id + '_skin', colors.skin);
  const hairMat = createFlatMaterial(scene, id + '_hair', colors.hair);
  const topMat  = createCelMaterial(scene, id + '_top',  colors.top);
  const botMat  = createCelMaterial(scene, id + '_bot',  colors.bottom);

  // ── Legs ──
  for (const side of [-1, 1] as const) {
    const leg = cap(id + '_leg' + side, s(0.085), s(0.58), scene);
    leg.material = botMat;
    leg.position  = new Vector3(s(0.11) * side, s(0.29), 0);
    leg.parent    = root;
    addOutline(leg, 0.8);
  }

  // ── Feet (small capsules give shoe silhouette) ──
  for (const side of [-1, 1] as const) {
    const foot = MeshBuilder.CreateSphere(id + '_foot' + side, { diameter: s(0.11), segments: 6 }, scene);
    foot.scaling.z  = 1.5;
    foot.scaling.y  = 0.55;
    foot.material   = createFlatMaterial(scene, id + '_shoe' + side, '#1a1510');
    foot.position   = new Vector3(s(0.11) * side, s(0.02), s(0.04));
    foot.parent     = root;
    addOutline(foot, 0.6);
  }

  // ── Torso ──
  const torso = cap(id + '_torso', s(0.175), s(0.66), scene);
  torso.material = topMat;
  torso.position  = new Vector3(0, s(0.77), 0);
  torso.parent    = root;
  addOutline(torso, 0.8);

  // ── Arms ──
  for (const side of [-1, 1] as const) {
    const arm = cap(id + '_arm' + side, s(0.068), s(0.50), scene);
    arm.material  = topMat;
    arm.position   = new Vector3(s(0.255) * side, s(0.76), 0);
    arm.rotation.z = (Math.PI / 10) * side;
    arm.parent     = root;
    addOutline(arm, 0.6);

    // Hand sphere
    const hand = MeshBuilder.CreateSphere(id + '_hand' + side, { diameter: s(0.085), segments: 6 }, scene);
    hand.material = skinMat;
    hand.position  = new Vector3(s(0.295) * side, s(0.52), 0);
    hand.parent    = root;
    addOutline(hand, 0.5);
  }

  // ── Neck ──
  const neck = cap(id + '_neck', s(0.055), s(0.12), scene);
  neck.material = skinMat;
  neck.position  = new Vector3(0, s(1.09), 0);
  neck.parent    = root;

  // ── Head group ──
  const headGrp = new TransformNode(id + '_head_grp', scene);
  headGrp.position = new Vector3(0, s(1.22), 0);
  headGrp.parent   = root;

  // Head (slightly wider than tall for chibi look)
  const head = MeshBuilder.CreateSphere(id + '_head', { diameter: s(0.40), segments: 12 }, scene);
  head.material   = skinMat;
  head.scaling.x  = 1.08;
  head.scaling.y  = 0.95;
  head.position   = new Vector3(0, 0, 0);
  head.parent     = headGrp;
  addOutline(head, 0.9);

  // Hair top
  const hair = MeshBuilder.CreateSphere(id + '_hair_top', { diameter: s(0.44), segments: 10 }, scene);
  hair.material  = hairMat;
  hair.scaling   = new Vector3(1.06, 0.72, 1.0);
  hair.position  = new Vector3(0, s(0.05), 0);
  hair.parent    = headGrp;

  // Hair back volume
  const hairBack = MeshBuilder.CreateSphere(id + '_hair_back', { diameter: s(0.38), segments: 8 }, scene);
  hairBack.material = hairMat;
  hairBack.scaling  = new Vector3(0.92, 0.82, 1.22);
  hairBack.position = new Vector3(0, s(-0.01), s(-0.08));
  hairBack.parent   = headGrp;

  // Hair sides (slight drape over ears)
  for (const side of [-1, 1] as const) {
    const hs = MeshBuilder.CreateSphere(id + '_hside' + side, { diameter: s(0.28), segments: 6 }, scene);
    hs.material  = hairMat;
    hs.scaling   = new Vector3(0.55, 0.80, 0.70);
    hs.position  = new Vector3(s(0.18) * side, s(-0.04), s(-0.02));
    hs.parent    = headGrp;
  }

  // Ears
  for (const side of [-1, 1] as const) {
    const ear = MeshBuilder.CreateSphere(id + '_ear' + side, { diameter: s(0.065), segments: 6 }, scene);
    ear.material  = skinMat;
    ear.scaling.z = 0.45;
    ear.position  = new Vector3(s(0.20) * side, -s(0.01), 0);
    ear.parent    = headGrp;
    addOutline(ear, 0.5);
  }

  // Eyes
  addEyes(scene, id, headGrp, scale, irisHex);

  // Nose
  addNose(scene, id, headGrp, scale, colors.skin);

  // Hat / accent (mushroom cap for Teemo-style characters)
  if (colors.accent) {
    const accentMat  = createCelMaterial(scene, id + '_accent',  colors.accent);
    const accentDark = createFlatMaterial(scene, id + '_accentd', colors.accent);

    // Mushroom cap dome — bigger than head for that iconic look
    const mushroomCap = MeshBuilder.CreateSphere(id + '_mushcap', { diameter: s(0.56), segments: 12 }, scene);
    mushroomCap.material = accentMat;
    mushroomCap.scaling  = new Vector3(1.28, 0.60, 1.28);
    mushroomCap.position = new Vector3(0, s(0.22), s(-0.02));
    mushroomCap.parent   = headGrp;
    addOutline(mushroomCap, 0.8);

    // White spots on mushroom cap (slightly raised)
    const spotPositions: [number, number, number][] = [
      [-s(0.11),  s(0.27),  s(0.14)],
      [ s(0.12),  s(0.25),  s(0.09)],
      [ s(0.01),  s(0.28), -s(0.12)],
      [-s(0.04),  s(0.26),  s(0.04)],
    ];
    const spotMat = createFlatMaterial(scene, id + '_spot', '#f5f0e8');
    for (let i = 0; i < spotPositions.length; i++) {
      const spot = MeshBuilder.CreateSphere(id + '_spot' + i, { diameter: s(0.068), segments: 6 }, scene);
      spot.material = spotMat;
      spot.scaling.z = 0.32;
      spot.position  = new Vector3(...spotPositions[i]);
      spot.parent    = headGrp;
    }

    // Brim (flat disc) — slightly wider for better silhouette
    const brim = MeshBuilder.CreateCylinder(id + '_brim', {
      height: s(0.028), diameter: s(0.64), tessellation: 20,
    }, scene);
    brim.material = accentDark;
    brim.position  = new Vector3(0, s(0.11), 0);
    brim.parent    = headGrp;
    addOutline(brim, 0.7);
  }

  return root;
}

// ── Public character builders ──────────────────────────────────────────────────

/** Taeil — brown checkered shirt, large round glasses, dark brown hair. */
export function buildTaeil(scene: Scene, colors: CharacterColorConfig): TransformNode {
  const root = buildHumanoid(scene, 'taeil', colors, 1.0, '#3a2010');

  // Signature large round glasses — added on top of the base humanoid
  const headGrp = scene.getNodeByName('taeil_head_grp') as TransformNode | null;
  if (headGrp) addGlasses(scene, 'taeil', headGrp, 1.0);

  return root;
}

/** Companion — red mushroom cap, amber scout goggles, forest green tunic. */
export function buildTeemo(scene: Scene, colors: CharacterColorConfig): TransformNode {
  // Scale 0.76: chibi proportions with a more prominent head
  const root = buildHumanoid(scene, 'teemo', colors, 0.76, '#2a6a20');

  // Signature scout goggles — amber-lensed, forehead-mounted
  const headGrp = scene.getNodeByName('teemo_head_grp') as TransformNode | null;
  if (headGrp) addGoggles(scene, 'teemo', headGrp, 0.76);

  return root;
}

/** Yongbin — sleeping flat on the ground. */
export function buildYongbin(scene: Scene, colors: CharacterColorConfig): TransformNode {
  const root = buildHumanoid(scene, 'yongbin', colors, 0.98, '#1a1010');
  root.rotation.z = Math.PI / 2;
  root.position.y += 0.12;
  return root;
}
