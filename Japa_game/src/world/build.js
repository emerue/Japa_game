// @ts-check
// Builds the 3D World from zone data. Returns the scene parts plus what the
// game needs to know: colliders, things that can fade, and enterable rooms.
import * as THREE from 'three';
import { mat, box, cylinder, signboard } from './kit.js';
import { makeDanfo } from './danfo.js';

/** @typedef {import('./zone.js').Building} Building */

/**
 * @typedef {object} Fadeable Something that fades when it blocks the view.
 * @property {THREE.Object3D} group
 * @property {THREE.Box3} box
 * @property {number} opacity
 * @property {THREE.Box3} [inside] Footprint: fade fully while the player is in it.
 */

/**
 * @typedef {object} Built
 * @property {THREE.Group} group
 * @property {THREE.Box2[]} colliders Footprints the player can't walk through (x, z).
 * @property {Fadeable[]} fadeables
 */

const WALL_T = 0.2;
const DOOR_W = 1.1;

/**
 * @param {typeof import('./zone.js').zone} zone
 * @returns {Built}
 */
export function buildZone(zone) {
  const group = new THREE.Group();
  /** @type {THREE.Box2[]} */
  const colliders = [];
  /** @type {Fadeable[]} */
  const fadeables = [];
  const collide = (/** @type {number} */ x0, /** @type {number} */ z0, /** @type {number} */ x1, /** @type {number} */ z1) =>
    colliders.push(new THREE.Box2(new THREE.Vector2(Math.min(x0, x1), Math.min(z0, z1)), new THREE.Vector2(Math.max(x0, x1), Math.max(z0, z1))));

  buildGround(group, zone);
  for (const b of zone.buildings) buildBuilding(group, b, collide, fadeables);
  buildCompound(group, zone.compound, collide, fadeables);
  buildRoomInterior(group);
  buildStreetLife(group, zone, collide, fadeables);
  buildSkyline(group);
  return { group, colliders, fadeables };
}

/**
 * @param {THREE.Group} g
 * @param {typeof import('./zone.js').zone} zone
 */
function buildGround(g, zone) {
  const { halfWidth: hw, pavement: pv, length: L } = zone.street;
  const ground = box(g, [L * 1.6, 0.2, 90], [0, -0.1, 0], mat('#B7A283'));
  ground.castShadow = false;
  box(g, [L * 1.6, 0.04, hw * 2], [0, 0.02, 0], mat('#4A4A4E')).castShadow = false;
  for (const side of [-1, 1]) {
    // pavement, then an open gutter with plank crossings: very Lagos
    box(g, [L * 1.6, 0.06, pv], [0, 0.03, side * (hw + 0.45 + pv / 2)], mat('#C9B48E')).castShadow = false;
    box(g, [L * 1.6, 0.05, 0.5], [0, 0.0, side * (hw + 0.25)], mat('#2B2622')).castShadow = false;
    for (let x = -L / 2; x <= L / 2; x += 9) box(g, [1.2, 0.08, 0.7], [x + side * 2, 0.05, side * (hw + 0.25)], mat('#6B4A2E'));
  }
  for (let x = -L / 2; x <= L / 2; x += 6) box(g, [2.2, 0.03, 0.22], [x, 0.05, 0], mat('#E8E2D0')).castShadow = false;
}

/**
 * @param {THREE.Group} g
 * @param {Building} b
 * @param {(x0: number, z0: number, x1: number, z1: number) => void} collide
 * @param {Fadeable[]} fadeables
 */
function buildBuilding(g, b, collide, fadeables) {
  const shell = new THREE.Group();
  const wall = mat(b.wall, { own: true });
  const roof = mat(b.roof ?? '#7A3B2E', { own: true });
  const faceZ = b.face * (b.d / 2);
  const doorX = b.doorX ?? 0;

  if (b.enterable) {
    // four walls with a doorway, so the room shows once the roof fades
    const left = doorX - DOOR_W / 2, right = doorX + DOOR_W / 2;
    box(shell, [b.w / 2 + left, b.h, WALL_T], [(-b.w / 2 + left) / 2, b.h / 2, faceZ], wall);
    box(shell, [b.w / 2 - right, b.h, WALL_T], [(b.w / 2 + right) / 2, b.h / 2, faceZ], wall);
    box(shell, [DOOR_W, b.h - 2.2, WALL_T], [doorX, 2.2 + (b.h - 2.2) / 2, faceZ], wall);
    box(shell, [b.w, b.h, WALL_T], [0, b.h / 2, -faceZ], wall);
    for (const sx of [-1, 1]) box(shell, [WALL_T, b.h, b.d], [sx * b.w / 2, b.h / 2, 0], wall);
    // colliders: the walls, leaving the doorway open
    const fz = b.z + faceZ, bz = b.z - faceZ;
    collide(b.x - b.w / 2, fz - WALL_T, b.x + left, fz + WALL_T);
    collide(b.x + right, fz - WALL_T, b.x + b.w / 2, fz + WALL_T);
    collide(b.x - b.w / 2, bz - WALL_T, b.x + b.w / 2, bz + WALL_T);
    collide(b.x - b.w / 2 - WALL_T, b.z - b.d / 2, b.x - b.w / 2 + WALL_T, b.z + b.d / 2);
    collide(b.x + b.w / 2 - WALL_T, b.z - b.d / 2, b.x + b.w / 2 + WALL_T, b.z + b.d / 2);
    box(shell, [0.08, 2.1, DOOR_W * 0.95], [doorX + DOOR_W / 2, 1.05, faceZ + b.face * 0.5], mat('#5B3A24'), Math.PI / 2 - 0.7);
  } else {
    box(shell, [b.w, b.h, b.d], [0, b.h / 2, 0], wall);
    collide(b.x - b.w / 2, b.z - b.d / 2, b.x + b.w / 2, b.z + b.d / 2);
    box(shell, [DOOR_W + 0.3, 2.3, 0.08], [doorX, 1.15, faceZ + b.face * 0.04], mat('#3A2A20', { own: true }));
  }
  box(shell, [b.w + 0.7, 0.25, b.d + 0.7], [0, b.h + 0.12, 0], roof);

  // windows on the street face, avoiding the door
  const win = mat('#22313A', { own: true });
  const floors = Math.max(1, Math.round(b.h / 3.1));
  for (let f = 0; f < floors; f++) {
    for (const off of [-b.w / 3, b.w / 3]) {
      if (f === 0 && Math.abs(off - doorX) < 1.6) continue;
      box(shell, [1.3, 1.0, 0.08], [off, 1.7 + f * 3, faceZ + b.face * 0.05], win);
      box(shell, [1.5, 0.1, 0.25], [off, 1.15 + f * 3, faceZ + b.face * 0.12], wall);
    }
  }
  for (const s of b.signs ?? []) {
    const w = s.w ?? Math.min(b.w - 1, 7.5);
    const sign = signboard({ ...s, width: w, height: s.sub ? 1.3 : 0.9 });
    sign.position.set(0, s.y ?? b.h - 0.75, faceZ + b.face * 0.08);
    if (b.face < 0) sign.rotation.y = Math.PI;
    shell.add(sign);
  }
  if (b.paint) {
    const paint = signboard({ text: b.paint, bg: b.wall, fg: '#B3261E', accent: b.wall, width: Math.min(b.w - 1, 6), height: 0.7 });
    paint.position.set(0, 1.4, faceZ + b.face * 0.06);
    if (b.face < 0) paint.rotation.y = Math.PI;
    shell.add(paint);
  }

  shell.position.set(b.x, 0, b.z);
  g.add(shell);
  const footprint = new THREE.Box3(new THREE.Vector3(b.x - b.w / 2, 0, b.z - b.d / 2), new THREE.Vector3(b.x + b.w / 2, b.h + 0.4, b.z + b.d / 2));
  fadeables.push({ group: shell, box: footprint, opacity: 1, inside: b.enterable ? footprint : undefined });
}

/**
 * The compound wall around the rooms, with a gate gap onto the street.
 * @param {THREE.Group} g
 * @param {typeof import('./zone.js').zone.compound} c
 * @param {(x0: number, z0: number, x1: number, z1: number) => void} collide
 * @param {Fadeable[]} fadeables
 */
function buildCompound(g, c, collide, fadeables) {
  const front = new THREE.Group(); // the street wall, gate and pillars
  const back = new THREE.Group(); // the back and side walls
  const yard = new THREE.Group(); // never fades
  const seg = (/** @type {THREE.Group} */ to, /** @type {number} */ x0, /** @type {number} */ z0, /** @type {number} */ x1, /** @type {number} */ z1) => {
    const w = Math.max(Math.abs(x1 - x0), WALL_T), d = Math.max(Math.abs(z1 - z0), WALL_T);
    box(to, [w, c.height, d], [(x0 + x1) / 2, c.height / 2, (z0 + z1) / 2], mat(c.color, { own: true }));
    collide(x0 - WALL_T / 2, z0 - WALL_T / 2, x1 + WALL_T / 2, z1 + WALL_T / 2);
  };
  seg(front, c.x0, c.z0, c.gate[0], c.z0);
  seg(front, c.gate[1], c.z0, c.x1, c.z0);
  seg(back, c.x0, c.z1, c.x1, c.z1);
  seg(back, c.x0, c.z0, c.x0, c.z1);
  seg(back, c.x1, c.z0, c.x1, c.z1);
  // gate pillars and an open painted gate
  for (const x of c.gate) box(front, [0.5, c.height + 0.5, 0.5], [x, (c.height + 0.5) / 2, c.z0], mat('#B85C4A', { own: true }));
  box(front, [0.06, 1.9, 1.3], [c.gate[0] + 0.3, 0.95, c.z0 + 0.7], mat('#2F5D8C', { own: true }), 0.15);
  // the yard: water drum, a generator, a clothes line
  cylinder(yard, 0.4, 0.4, 0.9, [-6.4, 0.45, 9.0], mat('#355D93'));
  box(yard, [0.9, 0.6, 0.6], [-7.6, 0.3, 9.2], mat('#C74742'));
  for (const x of [-22.5, -15]) cylinder(yard, 0.04, 0.04, 2, [x, 1, 9.5], mat('#6B6B6B'), 6);
  box(yard, [7.5, 0.02, 0.02], [-18.75, 1.95, 9.5], mat('#333333'));
  for (const [x, col] of /** @type {[number, string][]} */ ([[-21, '#C74742'], [-19.8, '#F2B705'], [-18.4, '#176B6B'], [-16.9, '#FFFFFF']])) {
    box(yard, [0.9, 0.8, 0.04], [x, 1.5, 9.5], mat(col));
  }
  g.add(front, back, yard);
  fadeables.push({ group: front, box: new THREE.Box3(new THREE.Vector3(c.x0, 0, c.z0 - 0.3), new THREE.Vector3(c.x1, c.height + 0.5, c.z0 + 0.3)), opacity: 1 });
  fadeables.push({ group: back, box: new THREE.Box3(new THREE.Vector3(c.x0, 0, c.z1 - 0.3), new THREE.Vector3(c.x1, c.height, c.z1 + 0.3)), opacity: 1 });
}

/** Your room: a mattress on the floor, a plastic table, a standing fan, a bucket. */
function buildRoomInterior(/** @type {THREE.Group} */ g) {
  const r = new THREE.Group();
  box(r, [4.6, 0.02, 4.2], [0, 0.01, 0], mat('#8C6A4A'));
  box(r, [1.9, 0.25, 2.1], [-1.2, 0.13, 0.8], mat('#E8E2D0'));
  box(r, [1.9, 0.08, 1.0], [-1.2, 0.29, 1.3], mat('#C74742'));
  box(r, [0.9, 0.7, 0.6], [1.4, 0.35, 1.4], mat('#F4EBDD'));
  box(r, [0.16, 0.02, 0.3], [-1.4, 0.3, 1.1], mat('#191B1E')); // the phone, on the mattress
  box(r, [0.18, 0.04, 0.12], [1.4, 0.72, 1.4], mat('#5B3A24')); // the wallet, on the table
  cylinder(r, 0.03, 0.03, 1.2, [1.9, 0.6, -0.6], mat('#6B6B6B'), 6);
  cylinder(r, 0.32, 0.32, 0.08, [1.9, 1.25, -0.6], mat('#E8E2D0'), 14).rotation.x = Math.PI / 2;
  cylinder(r, 0.25, 0.2, 0.4, [-1.9, 0.2, -1.6], mat('#2F7D3B'), 12);
  r.position.set(-19.5, 0, 15.5);
  g.add(r);
}

/**
 * @param {THREE.Group} g
 * @param {typeof import('./zone.js').zone} zone
 * @param {(x0: number, z0: number, x1: number, z1: number) => void} collide
 * @param {Fadeable[]} fadeables
 */
function buildStreetLife(g, zone, collide, fadeables) {
  for (const d of zone.danfos) {
    const bus = makeDanfo();
    bus.traverse((o) => { if (o instanceof THREE.Mesh) { o.material = o.material.clone(); o.material.transparent = true; } });
    bus.position.set(d.at[0], 0, d.at[1]);
    bus.rotation.y = d.facing;
    g.add(bus);
    const b3 = new THREE.Box3().setFromObject(bus);
    fadeables.push({ group: bus, box: b3, opacity: 1 });
    collide(b3.min.x, b3.min.z, b3.max.x, b3.max.z);
  }
  // Mama Chidi's POS stand: striped umbrella, table, the POS machine
  const p = zone.posStand;
  cylinder(g, 0.04, 0.04, 2.3, [p.x, 1.15, p.z], mat('#6B6B6B'), 6);
  const umb = cylinder(g, 0, 1.5, 0.6, [p.x, 2.45, p.z], mat('#F2B705'), 12);
  umb.castShadow = true;
  cylinder(g, 0, 1.52, 0.18, [p.x, 2.2, p.z], mat('#191B1E'), 12);
  box(g, [1.1, 0.75, 0.6], [p.x + 0.4, 0.375, p.z + 0.2], mat('#2F5D8C'));
  box(g, [0.18, 0.06, 0.28], [p.x + 0.4, 0.78, p.z + 0.2], mat('#191B1E'));
  collide(p.x - 0.2, p.z - 0.15, p.x + 1.0, p.z + 0.55);
  // bus stop with the OJUELEGBA sign
  const s = zone.busStop;
  for (const dx of [-2.5, 2.5]) cylinder(g, 0.06, 0.06, 2.6, [s.x + dx, 1.3, s.z - 0.6], mat('#6B6B6B'), 6);
  box(g, [5.8, 0.12, 1.8], [s.x, 2.65, s.z - 0.4], mat('#176B6B'));
  box(g, [4.5, 0.12, 0.4], [s.x, 0.45, s.z - 0.8], mat('#9AA3A8'));
  const sign = signboard({ text: s.sign, sub: 'BUS STOP', bg: '#176B6B', fg: '#FFF8E7', accent: '#F2B705', width: 2.6, height: 1.1 });
  sign.position.set(s.x + 3.6, 2.6, s.z + 0.1);
  g.add(sign);
  cylinder(g, 0.05, 0.05, 2.1, [s.x + 3.6, 1.05, s.z], mat('#6B6B6B'), 6);
  // light poles with sagging wires along the south pavement
  for (let x = -34; x <= 34; x += 12) cylinder(g, 0.07, 0.09, 6.5, [x, 3.25, 6.8], mat('#7A7A7A'), 6);
  // the stairs up to Dr. Bayo's office, on the pharmacy's east side
  for (let i = 0; i < 8; i++) box(g, [1.1, 0.2, 0.45], [15.2, 0.2 + i * 0.38, -7.6 - i * 0.45], mat('#9C8F86'));
  box(g, [0.06, 1.0, 3.8], [15.8, 2.1, -9.1], mat('#5B3A24'));
  collide(14.6, -11.3, 15.8, -7.9);
}

/** Lekki/VI towers and Third Mainland Bridge on the horizon, not walkable. */
function buildSkyline(/** @type {THREE.Group} */ g) {
  const m = mat('#B4A79B');
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 16; i++) box(g, [5 + rand() * 5, 14 + rand() * 30, 6], [-80 + i * 11, 12, -110], m).castShadow = false;
  const bridge = box(g, [220, 1.2, 3], [0, 6, -95], mat('#A89A8C'));
  bridge.castShadow = false;
  for (let x = -100; x <= 100; x += 14) box(g, [1.2, 6, 1.2], [x, 3, -95], mat('#A89A8C')).castShadow = false;
}

/**
 * Dr. Bayo's office upstairs: a small room with the three red flags on display.
 * @param {typeof import('./zone.js').agentOffice} office
 * @returns {Built}
 */
export function buildOffice(office) {
  const group = new THREE.Group();
  const { w, d, h } = office.size;
  /** @type {THREE.Box2[]} */
  const colliders = [];
  const collide = (/** @type {number} */ x0, /** @type {number} */ z0, /** @type {number} */ x1, /** @type {number} */ z1) =>
    colliders.push(new THREE.Box2(new THREE.Vector2(x0, z0), new THREE.Vector2(x1, z1)));
  const [ox, oz] = office.origin;
  const room = new THREE.Group();
  box(room, [w, 0.1, d], [0, -0.05, 0], mat('#7A5A3E'));
  box(room, [w, h, 0.2], [0, h / 2, -d / 2], mat('#D9C9A3'));
  for (const sx of [-1, 1]) box(room, [0.2, h, d], [sx * w / 2, h / 2, 0], mat('#CDBB93'));
  box(room, [w, 0.9, 0.2], [0, 0.45, d / 2], mat('#CDBB93')); // low front wall so the camera sees in
  // desk, chair, fan
  box(room, [2.4, 0.8, 1], [0, 0.4, -1.8], mat('#5B3A24'));
  box(room, [0.7, 1.2, 0.7], [0, 0.6, -2.5], mat('#191B1E'));
  cylinder(room, 0.03, 0.03, 1.3, [-3, 0.65, -2.4], mat('#6B6B6B'), 6);
  // the red flags: a banner, a framed "certificate", a payment notice
  const banner = signboard({ text: '100% VISA GUARANTEED', sub: 'UK · CANADA · USA · 2 WEEKS', bg: '#C74742', fg: '#FFFFFF', accent: '#F2B705', width: 3.2, height: 1.1 });
  banner.position.set(-1.6, 2.1, -d / 2 + 0.12);
  room.add(banner);
  const cert = signboard({ text: 'CERTIFIED AGENT', sub: 'Approved by the Brittish High Commision', bg: '#FFF8E7', fg: '#191B1E', accent: '#B8860B', width: 1.8, height: 1.2 });
  cert.position.set(2.2, 1.9, -d / 2 + 0.12);
  room.add(cert);
  const notice = signboard({ text: 'PAY TODAY ONLY', sub: 'Personal account · Offer ends today', bg: '#F2B705', fg: '#191B1E', accent: '#191B1E', width: 1.4, height: 1.0 });
  notice.position.set(w / 2 - 0.12, 1.6, 0.3);
  notice.rotation.y = -Math.PI / 2;
  room.add(notice);
  room.position.set(ox, 0, oz);
  group.add(room);
  collide(ox - w / 2 - 1, oz - d / 2 - 1, ox + w / 2 + 1, oz - d / 2 + 0.1);
  collide(ox - w / 2 - 1, oz - d / 2, ox - w / 2 + 0.1, oz + d / 2);
  collide(ox + w / 2 - 0.1, oz - d / 2, ox + w / 2 + 1, oz + d / 2);
  collide(ox - w / 2, oz + d / 2 - 0.1, ox + w / 2, oz + d / 2 + 1);
  collide(ox - 1.2, oz - 2.3, ox + 1.2, oz - 1.3);
  return { group, colliders, fadeables: [] };
}
