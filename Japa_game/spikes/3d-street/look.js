// Throwaway look test: camera framing, occluder fading and a real danfo.
// Not game code. Characters are still the CC0 robot placeholder.
//
// URL params: pitch=<deg> dist=<m> fov=<deg> ahead=<m> view=danfo
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const params = new URLSearchParams(location.search);
const PITCH = THREE.MathUtils.degToRad(Number(params.get('pitch') || 32));
const DIST = Number(params.get('dist') || 9);
const FOV = Number(params.get('fov') || 55);
const AHEAD = Number(params.get('ahead') || 1);
const SIDE = Number(params.get('side') || -1); // -1 north pavement (facing shopfronts), 1 south
const DANFO_VIEW = params.get('view') === 'danfo';

const hud = document.getElementById('hud');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F2C99B');
scene.fog = new THREE.Fog('#F2C99B', 30, 80);
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.3, 150);

scene.add(new THREE.HemisphereLight('#FFF4E0', '#8A6A4A', 1.5));
const sun = new THREE.DirectionalLight('#FFE2B8', 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
scene.add(sun, sun.target);

const mat = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });
function add(parent, geo, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ---------- ground and roads ----------
const M = {
  ground: mat('#C2AE8E'), road: mat('#4A4A4E'), line: mat('#E8E2D0'), kerb: mat('#D9D2C3'),
  window: mat('#2E4A5C'), door: mat('#5B3A24'), roof: mat('#7A3B2E'), roofTin: mat('#9AA3A8'),
};
add(scene, B(140, 0.2, 140), M.ground, 0, -0.1, 0);
add(scene, B(140, 0.05, 9), M.road, 0, 0.02, 0);
add(scene, B(9, 0.05, 140), M.road, 0, 0.021, 0);
for (let i = -60; i <= 60; i += 6) if (Math.abs(i) > 7) add(scene, B(2.2, 0.06, 0.25), M.line, i, 0.05, 0);
add(scene, new THREE.CylinderGeometry(5.5, 5.5, 0.3, 24), M.kerb, 0, 0.15, 0);
add(scene, new THREE.CylinderGeometry(4.8, 4.8, 0.32, 24), mat('#6F9A4E'), 0, 0.17, 0);

// ---------- buildings (each with its own materials so it can fade) ----------
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const WALL = ['#E8D9B5', '#D98E5F', '#7FA6B5', '#C9B27C', '#A8C69F', '#E3C8A8', '#B85C4A', '#D4D0C4'];
const buildings = [];
function building(x, z, w, d, faceX, faceZ) {
  const h = 3.5 + Math.floor(rand() * 3) * 3;
  const g = new THREE.Group();
  const own = (m) => { const c = m.clone(); c.transparent = true; return c; };
  add(g, B(w, h, d), own(mat(WALL[Math.floor(rand() * WALL.length)])), 0, h / 2, 0);
  add(g, B(w + 0.6, 0.3, d + 0.6), own(rand() < 0.5 ? M.roof : M.roofTin), 0, h + 0.15, 0);
  const fx = faceX * (w / 2 + 0.06), fz = faceZ * (d / 2 + 0.06);
  const win = own(M.window), door = own(M.door);
  for (let f = 0; f < Math.round(h / 3); f++) for (const off of [-1, 1]) {
    const span = (faceZ ? w : d) / 4;
    add(g, B(faceZ ? 1.2 : 0.1, 1.0, faceZ ? 0.1 : 1.2), win, fx + (faceZ ? off * span : 0), 1.6 + f * 3, fz + (faceZ ? 0 : off * span));
  }
  add(g, B(faceZ ? 1.2 : 0.1, 2.1, faceZ ? 0.1 : 1.2), door, fx, 1.05, fz);
  g.position.set(x, 0, z);
  scene.add(g);
  const box = new THREE.Box3().setFromObject(g);
  buildings.push({ group: g, box, opacity: 1 });
}
for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
  for (let j = 0; j < 3; j++) { const w = 6 + rand() * 2, d = 7 + rand() * 3; building(sx * (11 + j * 9), sz * (8 + d / 2), w, d, 0, -sz); }
  for (let j = 0; j < 2; j++) { const w = 7 + rand() * 3, d = 6 + rand() * 2; building(sx * (8 + w / 2), sz * (24 + j * 9), w, d, -sx, 0); }
}

// ---------- the danfo ----------
// Lagos yellow bus: boxy van, short sloped nose, two black side stripes, window
// band, open sliding door on the kerb side, roof rack, dented bumpers.
const D = {
  yellow: mat('#F2B705'), yellowDark: mat('#D99A00'), black: mat('#151515'), glass: mat('#22313A'),
  grey: mat('#6B6B6B'), chrome: mat('#BFC3C6'), light: mat('#FFF6D6', { emissive: '#665F40' }),
  red: mat('#B3261E'), interior: mat('#2A2420'), seat: mat('#5A3A2A'), rust: mat('#8C5A2B'),
  bag: mat('#3F5E8C'), sack: mat('#C9B48A'),
};
function makeDanfo() {
  const g = new THREE.Group();
  const L = 4.7, W = 1.85, H = 2.05, nose = 0.55;           // length (z), width (x), height
  const zBack = -L / 2, zFront = L / 2;
  // lower body (to the window line) runs the full length
  add(g, B(W, 0.95, L), D.yellow, 0, 0.75, 0);
  // upper body stops short of the nose; sloped windscreen fills the gap
  const upperLen = L - nose;
  add(g, B(W, 0.85, upperLen), D.yellow, 0, 1.65, -nose / 2);
  const ws = add(g, B(W - 0.1, 0.95, 0.06), D.glass, 0, 1.62, zFront - nose / 2 - 0.02, -0.5, 0, 0);
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
  // side mirrors
  for (const s of [-1, 1]) add(g, B(0.12, 0.18, 0.06), D.black, s * (W / 2 + 0.12), 1.45, zFront - nose - 0.05);
  return g;
}
const danfos = [];
for (const [x, z, ry] of [[9, -2.3, Math.PI], [-12, 2.2, 0], [16, 2.4, 0.04], [-24, -2.3, Math.PI]]) {
  const d = makeDanfo(); d.position.set(x, 0, z); d.rotation.y = ry - Math.PI / 2 + Math.PI; scene.add(d); danfos.push(d);
}

// a few street props: POS umbrellas and a kiosk
for (const [x, z, c] of [[5, 5.2, '#F2C230'], [-7, 5.4, '#2F7D3B'], [12, -5.3, '#F2C230']]) {
  add(scene, new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), D.grey, x, 1.1, z);
  add(scene, new THREE.ConeGeometry(1.3, 0.6, 10), mat(c), x, 2.4, z);
  add(scene, B(0.9, 0.8, 0.6), mat('#3E6FA8'), x + 0.6, 0.4, z);
}

// ---------- placeholder characters ----------
const gltf = await new GLTFLoader().loadAsync('./assets/RobotExpressive.glb');
const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
const clip = (n) => THREE.AnimationClip.findByName(gltf.animations, n);
function character(anim, tint) {
  const root = SkeletonUtils.clone(gltf.scene);
  root.scale.setScalar(1.75 / size.y);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; if (tint && o.material.name === 'Main') { o.material = o.material.clone(); o.material.color.set(tint); } } });
  const mixer = new THREE.AnimationMixer(root); mixer.clipAction(clip(anim)).play();
  scene.add(root);
  return { root, mixer };
}
const player = character('Walking');
const others = [character('Idle', '#C74742'), character('Wave', '#355D93'), character('Walking', '#176B6B')];
others[0].root.position.set(5.6, 0, SIDE * 5.0);
others[1].root.position.set(-3, 0, SIDE * 6.6);
const path = [new THREE.Vector3(-20, 0, SIDE * 6.2), new THREE.Vector3(20, 0, SIDE * 6.2)];
let t = 0.45, dir = 1;

// ---------- camera: lower, closer, looking ahead of the player ----------
const offset = new THREE.Vector3(0, Math.sin(PITCH) * DIST, Math.cos(PITCH) * DIST);
const focus = new THREE.Vector3();
const ray = new THREE.Ray();
const hit = new THREE.Vector3();
function updateCamera(dt, heading) {
  const want = player.root.position.clone().add(new THREE.Vector3(Math.sin(heading) * AHEAD, 1.2, Math.cos(heading) * AHEAD));
  if (DANFO_VIEW) want.set(9, 1.0, -1.2);
  focus.lerp(want, 1 - Math.exp(-5 * dt));
  camera.position.copy(focus).add(DANFO_VIEW ? new THREE.Vector3(5.5, 2.2, 5.5) : offset);
  camera.lookAt(focus);
  sun.position.copy(focus).add(new THREE.Vector3(14, 26, 8)); sun.target.position.copy(focus);
  // fade any building between the camera and the player (Q22)
  const head = player.root.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  ray.origin.copy(camera.position); ray.direction.copy(head).sub(camera.position).normalize();
  const maxD = camera.position.distanceTo(head);
  for (const b of buildings) {
    const blocks = ray.intersectBox(b.box, hit) && camera.position.distanceTo(hit) < maxD;
    const inside = b.box.containsPoint(camera.position);
    const target = blocks || inside ? 0.05 : 1;
    b.opacity += (target - b.opacity) * (1 - Math.exp(-10 * dt));
    b.group.traverse((o) => { if (o.isMesh) { o.material.opacity = b.opacity; o.material.depthWrite = b.opacity > 0.95; } });
  }
}

const clock = new THREE.Clock();
let frames = 0, acc = 0, fps = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  t += (dir * 1.6 * dt) / path[0].distanceTo(path[1]);
  if (t > 1 || t < 0) { dir *= -1; t = THREE.MathUtils.clamp(t, 0, 1); }
  player.root.position.lerpVectors(path[0], path[1], t);
  const heading = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  player.root.rotation.y = heading;
  player.mixer.update(dt); for (const o of others) o.mixer.update(dt);
  updateCamera(dt, heading);
  renderer.render(scene, camera);
  frames++; acc += dt; if (acc > 1) { fps = frames / acc; frames = 0; acc = 0; }
  hud.textContent = `look test · pitch ${(PITCH * 180 / Math.PI).toFixed(0)}° dist ${DIST}m fov ${FOV} · ${fps.toFixed(0)} fps · robot = placeholder`;
});
