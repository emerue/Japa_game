// @ts-check
// Building blocks for the World: cached materials, boxes, painted signboards.
import * as THREE from 'three';

/** @type {Map<string, THREE.MeshLambertMaterial>} */
const materials = new Map();

/**
 * A shared flat-colour material. Pass `own` for one that can fade on its own.
 * @param {string} color
 * @param {{ own?: boolean, emissive?: string }} [opts]
 */
export function mat(color, opts = {}) {
  const key = `${color}|${opts.emissive ?? ''}`;
  if (opts.own) return new THREE.MeshLambertMaterial({ color, emissive: opts.emissive ?? '#000', transparent: true });
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive: opts.emissive ?? '#000' });
    materials.set(key, m);
  }
  return m;
}

/**
 * Adds a box to `parent`, positioned by its centre.
 * @param {THREE.Object3D} parent
 * @param {[number, number, number]} size
 * @param {[number, number, number]} pos
 * @param {THREE.Material} material
 * @param {number} [ry]
 */
export function box(parent, size, pos, material, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

/**
 * @param {THREE.Object3D} parent
 * @param {number} radiusTop
 * @param {number} radiusBottom
 * @param {number} height
 * @param {[number, number, number]} pos
 * @param {THREE.Material} material
 * @param {number} [segments]
 */
export function cylinder(parent, radiusTop, radiusBottom, height, pos, material, segments = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  m.position.set(...pos);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

/**
 * A hand-painted Lagos signboard as a canvas texture: bold lettering, a
 * thin border, slightly uneven like signwriter work.
 * @param {{ text: string, sub?: string, bg: string, fg: string, accent?: string, width: number, height: number }} s
 * @returns {THREE.Mesh}
 */
export function signboard(s) {
  const pxPerM = 128;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(s.width * pxPerM);
  canvas.height = Math.round(s.height * pxPerM);
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  g.fillStyle = s.bg;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.strokeStyle = s.accent ?? s.fg;
  g.lineWidth = 8;
  g.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  g.fillStyle = s.fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const mainSize = Math.min(canvas.height * (s.sub ? 0.42 : 0.6), (canvas.width * 0.9) / (s.text.length * 0.62));
  g.font = `${mainSize}px Bungee, Impact, sans-serif`;
  g.fillText(s.text, canvas.width / 2, canvas.height * (s.sub ? 0.4 : 0.52), canvas.width * 0.92);
  if (s.sub) {
    g.fillStyle = s.accent ?? s.fg;
    g.font = `700 ${canvas.height * 0.2}px Archivo, Arial, sans-serif`;
    g.fillText(s.sub, canvas.width / 2, canvas.height * 0.77, canvas.width * 0.9);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s.width, s.height), new THREE.MeshLambertMaterial({ map: texture, transparent: true }));
  mesh.castShadow = false;
  return mesh;
}
