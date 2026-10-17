// Throwaway character lineup: which CC0 pack can look like Nigerian people?
// URL params: set=q|rg  from=<index>  n=<count>  skin=0|1 (darken Quaternius skin)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const params = new URLSearchParams(location.search);
const SET = params.get('set') || 'q';
const FROM = Number(params.get('from') || 0);
const N = Number(params.get('n') || 5);
const DARKEN = params.get('skin') !== '0';
const FACE_LIGHT = params.get('light') !== '0';

const Q = (params.get('who') || 'Casual_2,W_Casual,Casual_Hoodie,W_Formal,Suit,W_Suit,Worker,W_Worker,Beach').split(',');
const RG = ['Character_1_2_2', 'Character_2_1_3', 'Character_3_2_3', 'Character_4_1_1', 'Character_5_2_3',
  'Character_5_3_1', 'Character_6_2_2', 'Character_8_3_1', 'Character_9_3_4', 'Character_9_5_7',
  'Character_10_4_3', 'Character_11_3_1', 'Character_B_1', 'Character_Z_4', 'Character_Z_9', 'PoliceMan_A_4_1'];
// Nigerian skin tones, deepest first, all with warm red-brown undertones
const TONES = ['#2A160D', '#3A1F12', '#4B2715', '#5C311A', '#6E3B1F', '#83492A', '#9A5A34'];
const TONE_FROM = Number(params.get('tone') || 0);
const SKIN = TONES.slice(TONE_FROM).concat(TONES.slice(0, TONE_FROM));
const HAIR = '#15100C';

const hud = document.getElementById('hud');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F2C99B');
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 4.6);
camera.lookAt(0, 1.1, 0);

scene.add(new THREE.HemisphereLight('#FFF4E0', '#8A6A4A', 1.6));
const sun = new THREE.DirectionalLight('#FFE2B8', 2.2);
sun.position.set(4, 8, 6); sun.castShadow = true;
scene.add(sun);
if (FACE_LIGHT) {
  // Lighting for dark skin: a warm fill from the camera side so faces never sit
  // in shadow, and a soft back light that separates heads from the background.
  const fill = new THREE.DirectionalLight('#FFD9B0', 1.1);
  fill.position.set(-1.5, 2.2, 6);
  const rim = new THREE.DirectionalLight('#FFE8C8', 1.4);
  rim.position.set(-3, 4, -6);
  scene.add(fill, rim);
}

const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
add(new THREE.BoxGeometry(30, 0.2, 30), mat('#C9B48E'), 0, -0.1, 0);              // pavement
add(new THREE.BoxGeometry(30, 0.05, 6), mat('#4A4A4E'), 0, 0.0, 4.5);              // road in front
add(new THREE.BoxGeometry(30, 6, 0.4), mat('#D98E5F'), 0, 3, -2.2);                // shopfront wall behind
add(new THREE.BoxGeometry(1.4, 2.2, 0.1), mat('#5B3A24'), -1.8, 1.1, -1.98);       // door
add(new THREE.BoxGeometry(2.4, 1.2, 0.1), mat('#2E4A5C'), 1.6, 1.7, -1.98);        // window
add(new THREE.BoxGeometry(6, 0.7, 0.1), mat('#F2C230'), 0, 3.6, -1.95);           // signboard

const loader = new GLTFLoader();
const names = (SET === 'q' ? Q : RG).slice(FROM, FROM + N);
let rgClips = null;
if (SET === 'rg') rgClips = (await loader.loadAsync('./assets/chars/rg/_Animations.glb')).animations;

const mixers = [];
const spacing = 0.8;
for (const [i, name] of names.entries()) {
  const url = SET === 'q' ? `./assets/chars/q/${name}.gltf` : `./assets/chars/rg/${name}.glb`;
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const height = name.startsWith('W_') ? 1.65 : 1.75;
  root.scale.setScalar(height / size.y);
  root.position.set((i - (names.length - 1) / 2) * spacing, 0, 0);
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    if (SET === 'q' && DARKEN) {
      const n = o.material.name;
      // a little sheen: dark skin in Lagos sun shows highlights, not flat matte grey
      const tone = new THREE.Color(SKIN[i % SKIN.length]);
      if (n === 'Skin' || n === 'Skin_Darker') {
        o.material = o.material.clone();
        o.material.color.copy(tone).multiplyScalar(n === 'Skin' ? 1 : 0.75);
        o.material.roughness = 0.45; o.material.metalness = 0;
        // warm glow from within, stronger for deeper tones, so faces keep their
        // shape instead of going muddy (lightness ~0.1 for #1, ~0.4 for #7)
        if (FACE_LIGHT) {
          const l = tone.getHSL({}).l;
          o.material.emissive.copy(tone).multiplyScalar(THREE.MathUtils.clamp(0.55 - l, 0.15, 0.42));
        }
      }
      // pupils stay truly dark and glossy so they contrast with the face
      if (n === 'Eye' && FACE_LIGHT) { o.material = o.material.clone(); o.material.color.set('#050302'); o.material.roughness = 0.15; }
      if (/^Hair|^Eyebrows/.test(n)) { o.material = o.material.clone(); o.material.color.set(HAIR); }
    }
  });
  scene.add(root);
  const mixer = new THREE.AnimationMixer(root);
  const clips = SET === 'q' ? gltf.animations : rgClips;
  const pick = SET === 'q' ? ['Idle', 'Wave', 'Idle_Neutral', 'Interact', 'Idle'][i % 5] : ['Idle_A', 'LookingAround', 'Idle_B', 'Idle_A', 'LookingAround'][i % 5];
  const clip = THREE.AnimationClip.findByName(clips, pick) || clips[0];
  mixer.clipAction(clip).play();
  mixer.update(i * 0.37);
  mixers.push(mixer);
}
hud.textContent = SET === 'q' && DARKEN
  ? `skin tones, left to right: ${names.map((_, i) => '#' + (((TONE_FROM + i) % TONES.length) + 1)).join('  ')} · face light ${FACE_LIGHT ? 'on' : 'off'}`
  : `${SET === 'q' ? 'Quaternius' : 'RG Poly'} · ${names.join(' · ')}`;

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  for (const m of mixers) m.update(dt);
  renderer.render(scene, camera);
});
