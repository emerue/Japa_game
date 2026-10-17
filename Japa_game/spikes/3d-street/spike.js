// Throwaway performance spike (PRD §0 Q4, ADR 0001): can a low-poly Lagos
// street block run at 30+ fps on the test phone? Not game code.
//
// URL params: shadows=1, pr=<max pixel ratio>, merge=1 (merge static meshes)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const params = new URLSearchParams(location.search);
const SHADOWS = params.get('shadows') === '1';
const MAX_PR = Number(params.get('pr') || 1.5);
const MERGE = params.get('merge') === '1';
const STRESS = params.get('cam') === 'stress'; // whole junction in view: worst case
const NPC_COUNT = 5;
const MEASURE_AFTER_S = 3;
const MEASURE_FOR_S = 10;

const hud = document.getElementById('hud');

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MAX_PR));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = SHADOWS;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F2C99B'); // hazy Lagos morning
scene.fog = new THREE.Fog('#F2C99B', 45, 110);

const camera = new THREE.PerspectiveCamera(STRESS ? 60 : 55, innerWidth / innerHeight, 0.5, 200);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.HemisphereLight('#FFF4E0', '#8A6A4A', 1.6));
const sun = new THREE.DirectionalLight('#FFE2B8', 2.2);
sun.position.set(20, 35, 12);
sun.castShadow = SHADOWS;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
scene.add(sun, sun.target);

// ---------- static world ----------
const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
const M = {
  ground: mat('#B8A78C'), road: mat('#4A4A4E'), kerb: mat('#D9D2C3'), line: mat('#E8E2D0'),
  roof: mat('#7A3B2E'), roofTin: mat('#9AA3A8'), window: mat('#2E4A5C'), door: mat('#5B3A24'),
  danfo: mat('#F2C230'), danfoStripe: mat('#1C1C1C'), tyre: mat('#1C1C1C'),
  umbrellaA: mat('#F2C230'), umbrellaB: mat('#2F7D3B'), pole: mat('#6E6E6E'),
  skyline: mat('#9C8F86'),
};
const WALLS = ['#E8D9B5', '#D98E5F', '#7FA6B5', '#C9B27C', '#A8C69F', '#E3C8A8', '#B85C4A', '#D4D0C4'].map(mat);
const statics = []; // [geometry, material, matrix]

const tmp = new THREE.Object3D();
function box(w, h, d, x, y, z, material, ry = 0) {
  tmp.position.set(x, y, z); tmp.rotation.set(0, ry, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix();
  statics.push([new THREE.BoxGeometry(w, h, d), material, tmp.matrix.clone()]);
}
function cyl(rt, rb, h, x, y, z, material, seg = 8) {
  tmp.position.set(x, y, z); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
  statics.push([new THREE.CylinderGeometry(rt, rb, h, seg), material, tmp.matrix.clone()]);
}

// ground, a crossroads with a roundabout (Ojuelegba-style junction)
box(120, 0.2, 120, 0, -0.1, 0, M.ground);
box(120, 0.05, 9, 0, 0.02, 0, M.road);
box(9, 0.05, 120, 0, 0.021, 0, M.road);
cyl(5.5, 5.5, 0.3, 0, 0.15, 0, M.kerb, 20);
cyl(4.8, 4.8, 0.32, 0, 0.17, 0, mat('#6F9A4E'), 20);
for (let i = -50; i <= 50; i += 6) {
  if (Math.abs(i) < 8) continue;
  box(2.2, 0.06, 0.25, i, 0.05, 0, M.line);
  box(0.25, 0.06, 2.2, 0, 0.05, i, M.line);
}

// 20 buildings lining both roads, fronts 8 m from the road centre line
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const buildings = [];
function building(x, z, w, d, faceX, faceZ) {
  const h = 3.5 + Math.floor(rand() * 3) * 3;
  buildings.push({ x, z, w, d, h });
  box(w, h, d, x, h / 2, z, WALLS[Math.floor(rand() * WALLS.length)]);
  box(w + 0.6, 0.3, d + 0.6, x, h + 0.15, z, rand() < 0.5 ? M.roof : M.roofTin);
  // windows and a door on the face that looks at the road
  const fx = x + faceX * (w / 2 + 0.06), fz = z + faceZ * (d / 2 + 0.06);
  const along = faceZ ? [1, 0] : [0, 1];
  const floors = Math.round(h / 3);
  for (let f = 0; f < floors; f++) {
    for (const off of [-1, 1]) {
      const span = (faceZ ? w : d) / 4;
      box(faceZ ? 1.2 : 0.1, 1.0, faceZ ? 0.1 : 1.2, fx + along[0] * off * span, 1.6 + f * 3, fz + along[1] * off * span, M.window);
    }
  }
  box(faceZ ? 1.2 : 0.1, 2.1, faceZ ? 0.1 : 1.2, fx, 1.05, fz, M.door);
}
for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
  for (let j = 0; j < 3; j++) { // facing the east-west road
    const w = 6 + rand() * 2, d = 7 + rand() * 3;
    building(sx * (11 + j * 9), sz * (8 + d / 2), w, d, 0, -sz);
  }
  for (let j = 0; j < 2; j++) { // facing the north-south road
    const w = 7 + rand() * 3, d = 6 + rand() * 2;
    building(sx * (8 + w / 2), sz * (24 + j * 9), w, d, -sx, 0);
  }
}

// street furniture: danfos, POS umbrellas, poles
function danfo(x, z, ry) {
  box(2.0, 1.9, 4.6, x, 1.35, z, M.danfo, ry);
  box(2.02, 0.25, 4.62, x, 1.05, z, M.danfoStripe, ry);
  for (const [dx, dz] of [[0.9, 1.5], [-0.9, 1.5], [0.9, -1.5], [-0.9, -1.5]]) {
    const c = Math.cos(ry), s = Math.sin(ry);
    box(0.3, 0.7, 0.7, x + dx * c + dz * s, 0.35, z - dx * s + dz * c, M.tyre, ry);
  }
}
danfo(-2.2, 18, 0); danfo(2.2, -24, 0); danfo(20, 2.2, Math.PI / 2); danfo(-30, -2.2, Math.PI / 2);
for (const [x, z, m] of [[6, 7, M.umbrellaA], [-6.5, 7.5, M.umbrellaB], [7, -6.5, M.umbrellaA], [-15, 6.5, M.umbrellaA]]) {
  cyl(0.05, 0.05, 2.2, x, 1.1, z, M.pole, 6);
  cyl(0, 1.3, 0.6, x, 2.3, z, m, 10);
}
for (let i = -40; i <= 40; i += 16) cyl(0.08, 0.1, 6, i, 3, 5.2, M.pole, 6);

// distant skyline (Lekki/VI on the horizon)
for (let i = 0; i < 14; i++) box(5 + rand() * 4, 12 + rand() * 25, 5, -60 + i * 9, 10, -95, M.skyline);

let staticMeshes = 0;
if (MERGE) {
  const byMat = new Map();
  for (const [g, m, mx] of statics) {
    g.applyMatrix4(mx);
    if (!byMat.has(m)) byMat.set(m, []);
    byMat.get(m).push(g.index ? g.toNonIndexed() : g);
  }
  for (const [m, gs] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(gs), m);
    mesh.castShadow = mesh.receiveShadow = SHADOWS;
    scene.add(mesh); staticMeshes++;
  }
} else {
  for (const [g, m, mx] of statics) {
    const mesh = new THREE.Mesh(g, m);
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(mx);
    mesh.castShadow = mesh.receiveShadow = SHADOWS;
    scene.add(mesh); staticMeshes++;
  }
}

// ---------- characters ----------
const gltf = await new GLTFLoader().loadAsync('./assets/RobotExpressive.glb');
const base = gltf.scene;
const size = new THREE.Box3().setFromObject(base).getSize(new THREE.Vector3());
const charScale = 1.8 / size.y;
const clip = (name) => THREE.AnimationClip.findByName(gltf.animations, name);

function makeCharacter(tint, anim) {
  const root = SkeletonUtils.clone(base);
  root.scale.setScalar(charScale);
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = SHADOWS;
      if (tint && o.material.name === 'Main') { o.material = o.material.clone(); o.material.color.set(tint); }
    }
  });
  const mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(clip(anim)).play();
  scene.add(root);
  return { root, mixer };
}

// walkers follow rectangular loops along the pavements
// pavement loops: along the east-west road on both sides, crossing at the ends
const loop = (r, len = 34) => [[len, r], [-len, r], [-len, -r], [len, -r]].map(([x, z]) => new THREE.Vector3(x, 0, z));
function walker(path, speed, tint, phase = 0) {
  const c = makeCharacter(tint, 'Walking');
  return { ...c, path, speed, seg: 0, t: phase };
}
const player = walker(loop(6.3), 2.2, null);
const npcs = [
  walker(loop(6.8, 30), 1.6, '#C74742', 0.5),
  walker(loop(5.9, 26), 1.4, '#355D93', 0.2),
  walker(loop(7.1, 20), 1.8, '#176B6B', 0.8),
  { ...makeCharacter('#EA973B', 'Idle'), still: [6.6, 6.2] },
  { ...makeCharacter('#6F4E9A', 'Wave'), still: [-6.2, 7.0] },
].slice(0, NPC_COUNT);
for (const n of npcs) if (n.still) n.root.position.set(n.still[0], 0, n.still[1]);

function stepWalker(w, dt) {
  let a = w.path[w.seg], b = w.path[(w.seg + 1) % w.path.length];
  w.t += (w.speed * dt) / a.distanceTo(b);
  while (w.t >= 1) { w.t -= 1; w.seg = (w.seg + 1) % w.path.length; a = w.path[w.seg]; b = w.path[(w.seg + 1) % w.path.length]; }
  w.root.position.lerpVectors(a, b, w.t);
  w.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
}

// ---------- camera: elevated third-person follow, ~50° down ----------
const CAM_DIST = STRESS ? 70 : 18, CAM_PITCH = THREE.MathUtils.degToRad(50);
const camOffset = new THREE.Vector3(0, Math.sin(CAM_PITCH) * CAM_DIST, Math.cos(CAM_PITCH) * CAM_DIST);
const camTarget = new THREE.Vector3();
function updateCamera(dt) {
  if (STRESS) camTarget.set(0, 0, 0); else camTarget.lerp(player.root.position, 1 - Math.exp(-6 * dt));
  camera.position.copy(camTarget).add(camOffset);
  camera.lookAt(camTarget.x, camTarget.y + 1, camTarget.z);
  sun.position.copy(camTarget).add(new THREE.Vector3(20, 35, 12));
  sun.target.position.copy(camTarget);
}
camTarget.copy(player.root.position);

// ---------- measurement ----------
const clock = new THREE.Clock();
const frames = [];
let elapsed = 0, result = null;
function report() {
  const info = renderer.info.render;
  const live = frames.length ? frames : [16.7];
  const avg = live.reduce((s, x) => s + x, 0) / live.length;
  const sorted = [...live].sort((p, q) => p - q);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const pr = renderer.getPixelRatio();
  const line = (s) => s;
  hud.innerHTML = [
    line(`cam=${STRESS ? 'stress' : 'follow'}  shadows=${SHADOWS ? 'on' : 'off'}  merge=${MERGE ? 'on' : 'off'}  pixelRatio=${pr.toFixed(2)} (device ${devicePixelRatio})`),
    line(`canvas ${renderer.domElement.width}x${renderer.domElement.height}  buildings=${buildings.length}  characters=${1 + npcs.length}`),
    line(`draw calls=${info.calls}  triangles=${info.triangles}  static meshes=${staticMeshes}`),
    result
      ? `<b>RESULT</b> avg ${result.fps.toFixed(1)} fps · p95 frame ${result.p95.toFixed(1)} ms · ${result.n} frames`
      : elapsed < MEASURE_AFTER_S ? `warming up… ${elapsed.toFixed(1)}s`
      : `measuring… ${(elapsed - MEASURE_AFTER_S).toFixed(1)}/${MEASURE_FOR_S}s  live ${(1000 / avg).toFixed(1)} fps  p95 ${p95.toFixed(1)} ms`,
  ].join('\n');
  if (!result && elapsed >= MEASURE_AFTER_S + MEASURE_FOR_S) {
    result = { fps: 1000 / avg, p95, n: frames.length };
    document.title = `RESULT ${result.fps.toFixed(1)}fps`;
  }
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  elapsed += dt;
  if (elapsed > MEASURE_AFTER_S && !result) frames.push(dt * 1000);
  stepWalker(player, dt); player.mixer.update(dt);
  for (const n of npcs) { if (n.path) stepWalker(n, dt); n.mixer.update(dt); }
  updateCamera(dt);
  renderer.render(scene, camera);
  report();
});
