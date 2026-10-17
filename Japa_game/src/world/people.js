// @ts-check
// Characters: the Quaternius base models (CC0) made into Lagos people
// (PRD Q32–Q34): Nigerian skin tones, black hair, Lagos outfits, readable faces.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/** Deepest to lightest, warm red-brown undertones (PRD Q33). */
export const SKIN_TONES = ['#2A160D', '#3A1F12', '#4B2715', '#5C311A', '#6E3B1F', '#83492A', '#9A5A34'];
const HAIR = '#15100C';
const BASE = './assets/characters/';

const loader = new GLTFLoader();
/** @type {Map<string, Promise<import('three/addons/loaders/GLTFLoader.js').GLTF>>} */
const cache = new Map();

/** @param {string} model */
function load(model) {
  let p = cache.get(model);
  if (!p) {
    p = loader.loadAsync(`${BASE}${model}.glb`); // packed by tools/pack_characters.py
    cache.set(model, p);
  }
  return p;
}

/**
 * @typedef {object} Character
 * @property {THREE.Object3D} root
 * @property {THREE.AnimationMixer} mixer
 * @property {(name: string, fade?: number) => void} play Cross-fades to an animation.
 * @property {string} current
 */

/**
 * @param {{ model: string, tone: number, anim: string, look?: { hair?: string, outfit?: Record<string, string> } }} spec
 * @returns {Promise<Character>}
 */
export async function makePerson(spec) {
  const gltf = await load(spec.model);
  const root = SkeletonUtils.clone(gltf.scene);
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  root.scale.setScalar((spec.model.startsWith('W_') ? 1.65 : 1.75) / size.y);

  const tone = new THREE.Color(SKIN_TONES[spec.tone]);
  // A warm glow from within, stronger for deeper tones, so faces keep their shape (Q34).
  const glow = THREE.MathUtils.clamp(0.55 - tone.getHSL({ h: 0, s: 0, l: 0 }).l, 0.15, 0.42);
  const hair = new THREE.Color(spec.look?.hair && spec.look.hair !== 'none' ? spec.look.hair : HAIR);

  /** @type {THREE.SkinnedMesh[]} */
  const eyeWhites = [];
  root.traverse((o) => {
    if (o.name === 'Pistol') o.visible = false; // the Suit model ships holding one
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.frustumCulled = false; // skinned meshes can pop out at screen edges
    const m = /** @type {THREE.MeshStandardMaterial} */ (o.material);
    const name = m.name;
    const own = /** @type {THREE.MeshStandardMaterial} */ (m.clone());
    if (name === 'Skin' || name === 'Skin_Darker') {
      own.color.copy(tone).multiplyScalar(name === 'Skin' ? 1 : 0.75);
      own.roughness = 0.45;
      own.metalness = 0;
      own.emissive.copy(tone).multiplyScalar(glow);
    } else if (/^Hair|^Eyebrows/.test(name)) {
      own.color.copy(name.startsWith('Eyebrows') ? new THREE.Color(HAIR) : hair);
      if (spec.look?.hair === 'none' && name.startsWith('Hair')) o.visible = false; // clean-shaven head
    } else if (name === 'Eye') {
      own.color.set('#050302');
      own.roughness = 0.15;
      if (o instanceof THREE.SkinnedMesh) eyeWhites.push(o);
    } else if (spec.look?.outfit?.[name]) {
      own.color.set(spec.look.outfit[name]);
    }
    o.material = own;
  });

  for (const eye of eyeWhites) addEyeWhites(eye);

  const mixer = new THREE.AnimationMixer(root);
  /** @type {Record<string, THREE.AnimationAction>} */
  const actions = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
  /** @type {Character} */
  const person = {
    root,
    mixer,
    current: '',
    play(name, fade = 0.25) {
      if (name === person.current || !actions[name]) return;
      const next = actions[name];
      next.reset().play();
      if (person.current) actions[person.current].crossFadeTo(next, fade, false);
      person.current = name;
    },
  };
  person.play(spec.anim, 0);
  mixer.update(Math.random() * 2); // so a crowd doesn't move in step
  return person;
}

const WHITE = new THREE.MeshStandardMaterial({ color: '#F2EEE6', roughness: 0.35, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });

/**
 * The base models' eyes are dark pupils only, which vanish on the deepest skin
 * tones. Add a slightly larger white behind each pupil, skinned to the same
 * bones so it follows the head (PRD Q34).
 * @param {THREE.SkinnedMesh} eye
 */
function addEyeWhites(eye) {
  const geo = eye.geometry.clone();
  const posAttr = geo.getAttribute('position');
  // the two eyes sit either side of the face's centre line (local x)
  const sides = [{ n: 0, c: new THREE.Vector3(), min: new THREE.Vector3(Infinity, Infinity, Infinity), max: new THREE.Vector3(-Infinity, -Infinity, -Infinity) },
    { n: 0, c: new THREE.Vector3(), min: new THREE.Vector3(Infinity, Infinity, Infinity), max: new THREE.Vector3(-Infinity, -Infinity, -Infinity) }];
  const v = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const s = sides[v.x < 0 ? 0 : 1];
    s.n++; s.c.add(v); s.min.min(v); s.max.max(v);
  }
  for (const s of sides) if (s.n) s.c.divideScalar(s.n);
  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const s = sides[v.x < 0 ? 0 : 1];
    const depth = s.max.z - s.min.z;
    v.set(s.c.x + (v.x - s.c.x) * 1.7, s.c.y + (v.y - s.c.y) * 1.3, v.z - depth * 0.35);
    posAttr.setXYZ(i, v.x, v.y, v.z);
  }
  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
  const white = new THREE.SkinnedMesh(geo, WHITE);
  white.frustumCulled = false;
  white.castShadow = false;
  eye.parent?.add(white);
  white.position.copy(eye.position);
  white.quaternion.copy(eye.quaternion);
  white.scale.copy(eye.scale);
  white.bind(eye.skeleton, eye.bindMatrix);
}
