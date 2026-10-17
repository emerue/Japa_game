// Throwaway camera/UX test: the standard casual-game follow camera, real
// characters with Nigerian skin tones, and mock controls / choice panel.
// URL params: view=explore|talk  side=-1|1  yaw=<deg>
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const params = new URLSearchParams(location.search);
const VIEW = params.get('view') || 'explore';
const SIDE = Number(params.get('side') || -1);
const YAW = THREE.MathUtils.degToRad(Number(params.get('yaw') || 0));

const hud = document.getElementById('hud');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F2C99B');
scene.fog = new THREE.Fog('#F2C99B', 30, 80);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.3, 150);

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
for (const [x, z, ry] of [[9, -2.3, Math.PI], [-12, 2.2, 0], [16, 2.4, 0.04], [-24, -2.3, Math.PI], [-4, -2.4, Math.PI]]) {
  const d = makeDanfo(); d.position.set(x, 0, z); d.rotation.y = ry - Math.PI / 2 + Math.PI; scene.add(d); danfos.push(d);
}

// a few street props: POS umbrellas and a kiosk
for (const [x, z, c] of [[5, 5.2, '#F2C230'], [-7, 5.4, '#2F7D3B'], [12, -5.3, '#F2C230']]) {
  add(scene, new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), D.grey, x, 1.1, z);
  add(scene, new THREE.ConeGeometry(1.3, 0.6, 10), mat(c), x, 2.4, z);
  add(scene, B(0.9, 0.8, 0.6), mat('#3E6FA8'), x + 0.6, 0.4, z);
}

// ---------- lighting for characters (PRD Q34) ----------
const fill = new THREE.DirectionalLight('#FFD9B0', 0.9);   // follows the camera: faces never in shadow
const rim = new THREE.DirectionalLight('#FFE8C8', 1.1);    // from behind: separates heads from background
scene.add(fill, rim, fill.target, rim.target);

// ---------- characters: Quaternius base, Nigerian skin tones ----------
const TONES = ['#2A160D', '#3A1F12', '#4B2715', '#5C311A', '#6E3B1F', '#83492A', '#9A5A34'];
const loader = new GLTFLoader();
async function person(file, toneIndex, anim) {
  const gltf = await loader.loadAsync(`./assets/chars/q/${file}.gltf`);
  const root = gltf.scene;
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  root.scale.setScalar((file.startsWith('W_') ? 1.65 : 1.75) / size.y);
  const tone = new THREE.Color(TONES[toneIndex]);
  const glow = THREE.MathUtils.clamp(0.55 - tone.getHSL({}).l, 0.15, 0.42);
  root.traverse((o) => {
    if (o.name === 'Pistol') o.visible = false;
    if (!o.isMesh) return;
    o.castShadow = true;
    const n = o.material.name;
    if (n === 'Skin' || n === 'Skin_Darker') {
      o.material = o.material.clone();
      o.material.color.copy(tone).multiplyScalar(n === 'Skin' ? 1 : 0.75);
      o.material.roughness = 0.45; o.material.metalness = 0;
      o.material.emissive.copy(tone).multiplyScalar(glow);
    }
    if (/^Hair|^Eyebrows/.test(n)) { o.material = o.material.clone(); o.material.color.set('#15100C'); }
    if (n === 'Eye') { o.material = o.material.clone(); o.material.color.set('#050302'); o.material.roughness = 0.15; }
  });
  const mixer = new THREE.AnimationMixer(root);
  const actions = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
  actions[anim]?.play();
  scene.add(root);
  return { root, mixer, actions };
}
const [player, posLady, worker, waver, landlord] = await Promise.all([
  person('Casual_Hoodie', 1, VIEW === 'talk' ? 'Idle' : 'Walk'),
  person('W_Casual', 0, 'Idle'),
  person('Worker', 3, 'Walk'),
  person('W_Formal', 2, 'Wave'),
  person('Casual_2', 4, VIEW === 'talk' ? 'Interact' : 'Idle'),
]);
posLady.root.position.set(5.9, 0, SIDE * 5.0);
waver.root.position.set(-3.5, 0, SIDE * 6.9);
landlord.root.position.set(1.5, 0, SIDE * 7.0);
for (const p of [posLady, waver, landlord]) p.mixer.update(Math.random());

// ---------- the standard follow camera ----------
// Fixed yaw (never swings behind the player), ~45° down, mid distance.
// Soft follow with a dead zone, slight lead in the walking direction,
// player framed a little below centre in portrait to leave room for controls.
const cam = {
  pitch: THREE.MathUtils.degToRad(45),
  yaw: YAW,
  distPortrait: 10,
  distLandscape: 12.5,
  deadZone: 0.35,
  lead: 1.2,
  frameBelow: 1.4,        // metres "up-screen" the camera aims past the player (portrait)
  focus: new THREE.Vector3(),
  wallPitch: THREE.MathUtils.degToRad(62),  // tilt down when a wall is close up-screen
  wallRange: 6,
  tilt: 0,                                   // 0 = normal, 1 = fully tilted
};
const ray = new THREE.Ray(), hit = new THREE.Vector3();
const occluders = [
  ...buildings,
  ...danfos.map((d) => {
    d.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
    return { group: d, box: new THREE.Box3().setFromObject(d), opacity: 1 };
  }),
];
function fadeOccluders(dt, target) {
  ray.origin.copy(camera.position); ray.direction.copy(target).sub(camera.position).normalize();
  const maxD = camera.position.distanceTo(target);
  for (const b of occluders) {
    const blocks = (ray.intersectBox(b.box, hit) && camera.position.distanceTo(hit) < maxD) || b.box.containsPoint(camera.position);
    b.opacity += ((blocks ? 0.06 : 1) - b.opacity) * (1 - Math.exp(-10 * dt));
    b.group.traverse((o) => { if (o.isMesh) { o.material.opacity = b.opacity; o.material.depthWrite = b.opacity > 0.95; } });
  }
}
const camDir = () => new THREE.Vector3(Math.sin(cam.yaw), 0, Math.cos(cam.yaw)); // ground direction toward the camera
function exploreCamera(dt, moveDir) {
  const portrait = innerHeight > innerWidth;
  const want = player.root.position.clone().addScaledVector(moveDir, cam.lead);
  want.addScaledVector(camDir(), portrait ? -cam.frameBelow * (1 - cam.tilt) : 0);
  const off = want.clone().sub(cam.focus); off.y = 0;
  if (off.length() > cam.deadZone) cam.focus.addScaledVector(off.setLength(off.length() - cam.deadZone), 1 - Math.exp(-6 * dt));
  // is a building wall close in front of the player, up-screen? then look down more
  const probe = new THREE.Ray(player.root.position.clone().setY(1.0), camDir().negate());
  let wallNear = false;
  for (const b of buildings) if (probe.intersectBox(b.box, hit) && hit.distanceTo(probe.origin) < cam.wallRange) wallNear = true;
  cam.tilt += ((wallNear ? 1 : 0) - cam.tilt) * (1 - Math.exp(-3 * dt));
  const pitch = THREE.MathUtils.lerp(cam.pitch, cam.wallPitch, cam.tilt);
  const dist = (portrait ? cam.distPortrait : cam.distLandscape) * (1 - 0.1 * cam.tilt);
  camera.position.copy(cam.focus).addScaledVector(camDir(), Math.cos(pitch) * dist);
  camera.position.y = cam.focus.y + 1.0 + Math.sin(pitch) * dist;
  camera.lookAt(cam.focus.x, 1.0, cam.focus.z);
}
// Conversation close-up: both faces in the top half, above the choice panel.
function talkCamera() {
  const a = player.root.position, b = landlord.root.position;
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const across = b.clone().sub(a).normalize();
  const side = new THREE.Vector3(-across.z, 0, across.x);
  if (side.dot(camDir()) < 0) side.negate();
  camera.position.copy(mid).addScaledVector(side, 4.0).add(new THREE.Vector3(0, 2.3, 0));
  camera.lookAt(mid.x, 0.95, mid.z);
}

// ---------- mock UI: joystick, context button, speech bubble, choice panel ----------
const ui = document.createElement('div');
ui.innerHTML = `
<style>
  .joy { position: fixed; left: 28px; bottom: 34px; width: 116px; height: 116px; border-radius: 50%;
    background: rgba(25,27,30,.18); border: 2px solid rgba(255,255,255,.55); }
  .joy::after { content: ''; position: absolute; left: 34px; top: 34px; width: 48px; height: 48px; border-radius: 50%;
    background: rgba(255,255,255,.85); box-shadow: 0 2px 6px rgba(0,0,0,.3); }
  .act { position: fixed; right: 28px; bottom: 52px; width: 84px; height: 84px; border-radius: 50%;
    background: #176B6B; color: #fff; font: 600 16px system-ui; display: grid; place-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,.3); border: 3px solid #F4EBDD; }
  .bubble { position: fixed; transform: translate(-50%, -100%); width: max-content; max-width: min(250px, calc(100vw - 32px)); background: #fff; color: #191B1E;
    font: 15px/1.3 system-ui; padding: 9px 12px; border-radius: 14px; box-shadow: 0 3px 10px rgba(0,0,0,.25); }
  .bubble::after { content: ''; position: absolute; left: 50%; bottom: -8px; margin-left: -8px;
    border: 8px solid transparent; border-bottom: 0; border-top-color: #fff; }
  .sheet { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(244,235,221,.97); color: #191B1E;
    border-radius: 20px 20px 0 0; padding: 14px 16px 22px; box-shadow: 0 -4px 18px rgba(0,0,0,.25); font: 15px system-ui; }
  .sheet h3 { margin: 0 0 10px; font-size: 15px; font-weight: 600; }
  .choice { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #fff;
    border-radius: 12px; padding: 12px 14px; margin-top: 8px; border: 1.5px solid #E0D5C3; }
  .cost { font: 600 13px system-ui; color: #C74742; white-space: nowrap; }
  .cost.good { color: #176B6B; }
  .hudbar { position: fixed; left: 12px; right: 12px; top: 12px; display: flex; gap: 8px; font: 600 14px system-ui; }
  .pill { background: rgba(244,235,221,.92); border-radius: 999px; padding: 6px 12px; color: #191B1E; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
</style>`;
document.body.appendChild(ui);
hud.style.display = 'none';
const el = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; ui.appendChild(d); return d; };
el('hudbar', '<span class="pill">₦48,500</span><span class="pill">⚡ 72</span><span class="pill">Mon 6:58 am</span>');
let bubble = null;
if (VIEW === 'talk') {
  bubble = el('bubble', 'Oga, your rent don due since Friday o. I no fit wait again.');
  el('sheet', `<h3>Mr Adewale, the landlord</h3>
    <div class="choice"><span>Pay the full rent now</span><span class="cost">−₦150,000</span></div>
    <div class="choice"><span>Beg for two more weeks</span><span class="cost">−Home ties</span></div>
    <div class="choice"><span>Offer half now, half Friday</span><span class="cost">−₦75,000</span></div>`);
} else {
  el('joy', ''); el('act', 'Talk');
}

// ---------- run ----------
const path = [new THREE.Vector3(-18, 0, SIDE * 6.2), new THREE.Vector3(18, 0, SIDE * 6.2)];
let t = 0.42, dir = 1;
if (VIEW === 'talk') {
  player.root.position.set(0.2, 0, SIDE * 7.0);
  player.root.lookAt(landlord.root.position); landlord.root.lookAt(player.root.position);
}
cam.focus.copy(player.root.position);
const clock = new THREE.Clock();
const tmpV = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const moveDir = new THREE.Vector3();
  if (VIEW !== 'talk') {
    t += (dir * 1.5 * dt) / path[0].distanceTo(path[1]);
    if (t > 1 || t < 0) { dir *= -1; t = THREE.MathUtils.clamp(t, 0, 1); }
    player.root.position.lerpVectors(path[0], path[1], t);
    moveDir.set(dir, 0, 0);
    player.root.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    worker.root.position.set(-6 + ((clock.elapsedTime * 1.2) % 24), 0, SIDE * 5.6);
    worker.root.rotation.y = Math.PI / 2;
    exploreCamera(dt, moveDir);
  } else {
    talkCamera();
  }
  for (const p of [player, posLady, worker, waver, landlord]) p.mixer.update(dt);
  // fill light from the camera side, rim light from behind the subject
  const subject = player.root.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  fill.position.copy(camera.position).add(new THREE.Vector3(-2, 1, 0)); fill.target.position.copy(subject);
  rim.position.copy(subject).add(subject.clone().sub(camera.position).setY(0).setLength(6)).add(new THREE.Vector3(0, 4, 0)); rim.target.position.copy(subject);
  sun.position.copy(subject).add(new THREE.Vector3(14, 26, 8)); sun.target.position.copy(subject);
  fadeOccluders(dt, subject);
  if (bubble) {
    tmpV.copy(landlord.root.position).add(new THREE.Vector3(0, 2.0, 0)).project(camera);
    const half = bubble.offsetWidth / 2;
    bubble.style.left = `${THREE.MathUtils.clamp((tmpV.x * 0.5 + 0.5) * innerWidth, 16 + half, innerWidth - 16 - half)}px`;
    bubble.style.top = `${(-tmpV.y * 0.5 + 0.5) * innerHeight}px`;
  }
  renderer.render(scene, camera);
});
