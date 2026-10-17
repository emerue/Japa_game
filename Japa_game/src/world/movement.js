// @ts-check
// Player input and movement: a floating touch joystick (left side of the
// screen), WASD/arrow keys on desktop, and collision against footprints.
import * as THREE from 'three';

export const WALK_SPEED = 3.2; // m/s
const RADIUS = 0.35;

/**
 * Reads the stick and keys. Up on the stick is always up the screen (PRD Q21).
 * @param {HTMLElement} joyBase
 * @param {HTMLElement} joyKnob
 */
export function createInput(joyBase, joyKnob) {
  const stick = new THREE.Vector2();
  const keys = new Set();
  /** @type {number | null} */
  let touchId = null;
  const origin = new THREE.Vector2();
  const maxR = 48;
  let enabled = true;
  let interactPressed = false;

  addEventListener('keydown', (e) => {
    keys.add(e.key.toLowerCase());
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') interactPressed = true;
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  const placeJoy = (/** @type {number} */ x, /** @type {number} */ y) => {
    joyBase.style.left = `${x}px`;
    joyBase.style.top = `${y}px`;
  };
  addEventListener('pointerdown', (e) => {
    if (!enabled || touchId !== null) return;
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.closest('[data-ui]')) return; // buttons, panels
    if (e.clientX > innerWidth * 0.62 || e.clientY < 110) return;
    touchId = e.pointerId;
    origin.set(e.clientX, e.clientY);
    placeJoy(e.clientX, e.clientY);
    joyBase.classList.add('active');
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerId !== touchId) return;
    const d = new THREE.Vector2(e.clientX - origin.x, e.clientY - origin.y);
    if (d.length() > maxR) d.setLength(maxR);
    joyKnob.style.transform = `translate(${d.x}px, ${d.y}px)`;
    stick.set(d.x / maxR, d.y / maxR);
  });
  const release = (/** @type {PointerEvent} */ e) => {
    if (e.pointerId !== touchId) return;
    touchId = null;
    stick.set(0, 0);
    joyKnob.style.transform = '';
    joyBase.classList.remove('active');
    placeJoy(NaN, NaN);
    joyBase.style.left = joyBase.style.top = '';
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  return {
    /** Movement on the ground plane (x, z), length 0–1. */
    direction() {
      if (!enabled) return new THREE.Vector3();
      const k = new THREE.Vector2(
        (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0),
        (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0),
      );
      const v = k.lengthSq() > 0 ? k.normalize() : stick.clone();
      if (v.length() < 0.15) return new THREE.Vector3();
      return new THREE.Vector3(v.x, 0, v.y).clampLength(0, 1);
    },
    /** True once per key press of E / Space. */
    takeInteract() {
      const p = interactPressed;
      interactPressed = false;
      return p;
    },
    /** @param {boolean} on */
    setEnabled(on) {
      enabled = on;
      if (!on) { stick.set(0, 0); joyKnob.style.transform = ''; touchId = null; joyBase.classList.remove('active'); }
    },
  };
}

/**
 * Moves a circle through the world, sliding along footprints it hits.
 * @param {THREE.Vector3} pos Updated in place.
 * @param {THREE.Vector3} step
 * @param {THREE.Box2[]} colliders
 */
export function moveWithCollisions(pos, step, colliders) {
  pos.x += step.x;
  pos.z += step.z;
  for (let pass = 0; pass < 2; pass++) {
    for (const b of colliders) {
      const cx = THREE.MathUtils.clamp(pos.x, b.min.x, b.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, b.min.y, b.max.y);
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= RADIUS * RADIUS) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        pos.x += (dx / d) * (RADIUS - d);
        pos.z += (dz / d) * (RADIUS - d);
      } else {
        // centre inside the box: push out the shortest way
        const exits = [b.min.x - RADIUS - pos.x, b.max.x + RADIUS - pos.x, b.min.y - RADIUS - pos.z, b.max.y + RADIUS - pos.z];
        const i = exits.reduce((best, v, j) => (Math.abs(v) < Math.abs(exits[best]) ? j : best), 0);
        if (i < 2) pos.x += exits[i]; else pos.z += exits[i];
      }
    }
  }
}
