// @ts-check
// The danfo: Lagos's yellow minibus, built from boxes in code (no model file).
// Boxy van, short sloped nose, two black side stripes, window band, open
// sliding door on the kerb side, roof rack with luggage, dented bumpers.
import * as THREE from 'three';
import { signboard } from './kit.js';

const mat = (/** @type {string} */ c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });
/** @param {THREE.Object3D} parent @param {THREE.BufferGeometry} geo @param {THREE.Material} material */
function add(parent, geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
const B = (/** @type {number} */ w, /** @type {number} */ h, /** @type {number} */ d) => new THREE.BoxGeometry(w, h, d);

// Lagos yellow bus: boxy van, short sloped nose, two black side stripes, window
// band, open sliding door on the kerb side, roof rack, dented bumpers.
const D = {
  yellow: mat('#F2B705'), yellowDark: mat('#D99A00'), black: mat('#151515'), glass: mat('#22313A'),
  grey: mat('#6B6B6B'), chrome: mat('#BFC3C6'), light: mat('#FFF6D6', { emissive: '#665F40' }),
  red: mat('#B3261E'), interior: mat('#2A2420'), seat: mat('#5A3A2A'), rust: mat('#8C5A2B'),
  bag: mat('#3F5E8C'), sack: mat('#C9B48A'),
};
/** Builds one danfo, about 4.7 m long, facing +z. */
export function makeDanfo() {
  const g = new THREE.Group();
  const L = 4.7, W = 1.85, H = 2.05, nose = 0.55;           // length (z), width (x), height
  const zBack = -L / 2, zFront = L / 2;
  // lower body (to the window line) runs the full length
  add(g, B(W, 0.95, L), D.yellow, 0, 0.75, 0);
  // upper body stops short of the nose; sloped windscreen fills the gap
  const upperLen = L - nose;
  add(g, B(W, 0.85, upperLen), D.yellow, 0, 1.65, -nose / 2);
  add(g, B(W - 0.1, 0.95, 0.06), D.glass, 0, 1.62, zFront - nose / 2 - 0.02, -0.5, 0, 0);
  // bonnet slope
  add(g, B(W, 0.08, nose + 0.1), D.yellow, 0, 1.24, zFront - nose / 2, 0.22, 0, 0);
  // roof (slightly lighter) and roof rack with luggage
  add(g, B(W - 0.04, 0.08, upperLen + 0.02), D.yellowDark, 0, 2.1, -nose / 2);
  for (const z of [-1.5, -0.5, 0.5]) add(g, B(W - 0.2, 0.05, 0.05), D.grey, 0, 2.28, z);
  for (const x of [-(W / 2 - 0.12), W / 2 - 0.12]) add(g, B(0.05, 0.05, 2.4), D.grey, x, 2.3, -0.5);
  add(g, B(0.9, 0.4, 0.7), D.sack, -0.2, 2.5, -1.0, 0, 0.2, 0);
  add(g, B(0.6, 0.35, 0.5), D.bag, 0.4, 2.48, 0.1, 0, -0.3, 0);
  // window band both sides (inset dark glass) and pillars
  for (const s of [-1, 1]) {
    add(g, B(0.04, 0.55, upperLen - 0.3), D.glass, s * (W / 2 + 0.005), 1.7, -nose / 2);
    for (const z of [-1.6, -0.6, 0.4]) add(g, B(0.06, 0.6, 0.12), D.yellow, s * (W / 2 + 0.01), 1.7, z);
    // the two black stripes
    add(g, B(0.03, 0.09, L - 0.05), D.black, s * (W / 2 + 0.01), 1.2, 0);
    add(g, B(0.03, 0.09, L - 0.05), D.black, s * (W / 2 + 0.01), 0.98, 0);
    // tail and wheel-arch shadows
    add(g, B(0.03, 0.08, 0.5), D.rust, s * (W / 2 + 0.012), 0.5, zBack + 0.5);
  }
  // open sliding door on the kerb (right, +x) side: a dark opening with seats inside
  add(g, B(0.05, 1.45, 1.05), D.interior, W / 2 + 0.015, 1.05, 0.55);
  add(g, B(0.6, 0.45, 0.25), D.seat, W / 2 - 0.35, 0.9, 0.2);
  add(g, B(0.6, 0.45, 0.25), D.seat, W / 2 - 0.35, 0.9, 0.95);
  // the slid-back door panel sits outside, over the rear window
  add(g, B(0.04, 1.4, 1.0), D.yellow, W / 2 + 0.07, 1.1, -0.55);
  add(g, B(0.04, 0.09, 1.0), D.black, W / 2 + 0.095, 1.2, -0.55);
  // front: grille, headlights, bumper (slightly bent), number plate
  add(g, B(1.2, 0.3, 0.05), D.black, 0, 0.75, zFront + 0.01);
  for (const x of [-0.7, 0.7]) add(g, new THREE.CylinderGeometry(0.13, 0.13, 0.06, 12), D.light, x, 0.78, zFront + 0.02, Math.PI / 2, 0, 0);
  add(g, B(W + 0.05, 0.16, 0.14), D.grey, 0, 0.38, zFront + 0.06, 0, 0, 0.04);
  add(g, B(0.5, 0.14, 0.02), D.chrome, 0, 0.55, zFront + 0.03);
  // back: rear window, tail lights, bumper
  add(g, B(W - 0.3, 0.5, 0.04), D.glass, 0, 1.7, zBack - 0.01);
  for (const x of [-0.8, 0.8]) add(g, B(0.15, 0.3, 0.04), D.red, x, 0.85, zBack - 0.01);
  add(g, B(W + 0.05, 0.16, 0.14), D.grey, 0, 0.38, zBack - 0.06, 0, 0, -0.05);
  // wheels with hubs
  for (const [x, z] of [[-W / 2, 1.45], [W / 2, 1.45], [-W / 2, -1.45], [W / 2, -1.45]]) {
    add(g, new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), D.black, x, 0.36, z, 0, 0, Math.PI / 2);
    add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.3, 10), D.grey, x, 0.36, z, 0, 0, Math.PI / 2);
  }
  // the rounded nose of the old Volkswagen bus
  add(g, new THREE.CylinderGeometry(0.42, 0.42, W, 16, 1, false, 0, Math.PI / 2), D.yellow, 0, 0.8, zFront - 0.41, 0, 0, Math.PI / 2);
  // a painted slogan on the back
  const slogan = signboard({ text: 'NO FOOD FOR LAZY MAN', bg: '#F2B705', fg: '#191B1E', accent: '#F2B705', width: 1.5, height: 0.32 });
  slogan.position.set(0, 1.2, zBack - 0.035);
  slogan.rotation.y = Math.PI;
  g.add(slogan);
  // side mirrors
  for (const s of [-1, 1]) add(g, B(0.12, 0.18, 0.06), D.black, s * (W / 2 + 0.12), 1.45, zFront - nose - 0.05);
  return g;
}
