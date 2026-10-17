// @ts-check
// Lite mode (PRD Q25): the same World drawn top-down in 2D Canvas, for phones
// without WebGL. Same zone data, simulation, controls, collisions and
// interface as the 3D view; only the drawing changes. North is up.

/** @typedef {typeof import('./zone.js').zone} Zone */
/** @typedef {typeof import('./zone.js').agentOffice} Office */

/**
 * @typedef {object} LitePerson
 * @property {number} x
 * @property {number} z
 * @property {string} skin
 * @property {string} outfit
 * @property {string} [label] Shown for people you can talk to.
 */

/**
 * @typedef {object} LiteFrame
 * @property {{ x: number, z: number }} focus Where the view is centred.
 * @property {'street' | 'office'} where
 * @property {{ x: number, z: number, heading: number }} player
 * @property {LitePerson[]} people
 * @property {{ x: number, z: number }[]} markers
 * @property {boolean} insideRoom
 * @property {number} time Seconds, for small animations.
 */

const INK = '#191B1E', DANFO = '#F2B705';
const PX_PER_M = 26;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Zone} zone
 * @param {Office} office
 */
export function createLiteView(canvas, zone, office) {
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let dpr = 1, W = 0, H = 0;
  let fx = 0, fz = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
  }
  resize();
  addEventListener('resize', resize);

  /** World (x, z) to screen pixels (CSS px). `up` lifts a point towards the top of the screen. */
  const sx = (/** @type {number} */ x) => W / 2 + (x - fx) * PX_PER_M;
  const sy = (/** @type {number} */ z, up = 0) => H * 0.56 + (z - fz) * PX_PER_M - up * PX_PER_M * 0.6;

  /** @param {number} x0 @param {number} z0 @param {number} w @param {number} d @param {string} fill @param {string} [stroke] */
  function rect(x0, z0, w, d, fill, stroke) {
    g.fillStyle = fill;
    g.fillRect(sx(x0), sy(z0), w * PX_PER_M, d * PX_PER_M);
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.strokeRect(sx(x0), sy(z0), w * PX_PER_M, d * PX_PER_M); }
  }

  /** A sticker label: text on a filled tag. */
  function tag(/** @type {string} */ text, /** @type {number} */ x, /** @type {number} */ y, bg = '#fff', fg = INK, font = '800 11px Archivo, sans-serif') {
    g.font = font;
    const w = g.measureText(text).width + 10;
    g.fillStyle = bg;
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.beginPath(); g.roundRect(x - w / 2, y - 9, w, 18, 5); g.fill(); g.stroke();
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, x, y + 0.5);
  }

  function drawStreet(/** @type {LiteFrame} */ f) {
    const { halfWidth: hw, pavement: pv } = zone.street;
    g.fillStyle = '#B7A283';
    g.fillRect(0, 0, W, H);
    rect(-60, -hw, 120, hw * 2, '#4C4945');
    g.fillStyle = '#E2D9C2';
    for (let x = -60; x < 60; x += 6) g.fillRect(sx(x), sy(-0.1), 2.2 * PX_PER_M, 0.2 * PX_PER_M);
    for (const side of [-1, 1]) {
      const z0 = side > 0 ? hw + 0.45 : -hw - 0.45 - pv;
      rect(-60, z0, 120, pv, '#B4AC9D');
      rect(-60, side > 0 ? hw : -hw - 0.5, 120, 0.5, '#2B2622');
    }
    // the compound: walls with the gate gap, yard, rooms
    const c = zone.compound;
    rect(c.x0, c.z0, c.x1 - c.x0, c.z1 - c.z0, '#C9B48E');
    g.strokeStyle = '#8E8576'; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(sx(c.gate[0]), sy(c.z0)); g.lineTo(sx(c.x0), sy(c.z0)); g.lineTo(sx(c.x0), sy(c.z1));
    g.lineTo(sx(c.x1), sy(c.z1)); g.lineTo(sx(c.x1), sy(c.z0)); g.lineTo(sx(c.gate[1]), sy(c.z0));
    g.stroke();
    for (const b of zone.buildings) {
      const x0 = b.x - b.w / 2, z0 = b.z - b.d / 2;
      if (b.enterable && f.insideRoom) {
        rect(x0, z0, b.w, b.d, '#8C6A4A', INK);
        rect(b.x - 2.15, b.z - 0.25, 1.9, 2.1, '#E8E2D0'); // mattress
        rect(b.x - 2.15, b.z + 0.8, 1.9, 1.0, '#C74742');
        rect(b.x + 0.95, b.z + 1.1, 0.9, 0.6, '#F4EBDD', INK); // table
      } else {
        rect(x0, z0, b.w, b.d, b.wall, INK);
        rect(x0 + 0.3, z0 + 0.3, b.w - 0.6, b.d - 0.6, b.roof ?? '#7A3B2E');
      }
      // the door on the street face
      const faceZ = b.face > 0 ? b.z + b.d / 2 : b.z - b.d / 2;
      g.fillStyle = '#5B3A24';
      g.fillRect(sx(b.x + (b.doorX ?? 0) - 0.55), sy(faceZ) - 3, 1.1 * PX_PER_M, 6);
      // the signboard, on the pavement side of the street face
      const sign = b.signs?.[0];
      if (sign) tag(sign.text, sx(b.x), sy(faceZ) + (b.face > 0 ? 14 : -14), sign.bg, sign.fg, '400 11px Bungee, Impact, sans-serif');
      if (b.signs?.[1]) tag(b.signs[1].text, sx(b.x), sy(faceZ) + (b.face > 0 ? 34 : -34), b.signs[1].bg, b.signs[1].fg, '400 10px Bungee, Impact, sans-serif');
    }
    // the stairs up to Dr. Bayo's office
    g.fillStyle = '#9C8F86';
    for (let i = 0; i < 8; i++) g.fillRect(sx(14.65), sy(-7.8 - i * 0.45), 1.1 * PX_PER_M, 0.3 * PX_PER_M);
    // POS umbrella, bus stop, keke, danfos
    const p = zone.posStand;
    g.fillStyle = DANFO; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(sx(p.x), sy(p.z), 1.5 * PX_PER_M, 0, Math.PI * 2); g.fill(); g.stroke();
    const s = zone.busStop;
    rect(s.x - 2.9, s.z - 1.3, 5.8, 1.8, '#176B6B', INK);
    tag(s.sign, sx(s.x), sy(s.z - 0.4), '#176B6B', '#FFF8E7', '400 11px Bungee, Impact, sans-serif');
    rect(s.x - 5.6, s.z + 1.0, 2.2, 1.2, DANFO, INK); // keke
    for (const d of zone.danfos) danfo(d.at[0], d.at[1], d.facing);
  }

  function danfo(/** @type {number} */ x, /** @type {number} */ z, /** @type {number} */ facing) {
    g.save();
    g.translate(sx(x), sy(z));
    g.rotate(-facing);
    const L = 4.7 * PX_PER_M, Wd = 1.85 * PX_PER_M;
    g.fillStyle = DANFO; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-Wd / 2, -L / 2, Wd, L, 6); g.fill(); g.stroke();
    g.fillStyle = INK;
    g.fillRect(-Wd / 2, -L / 2 + 6, 3, L - 12);
    g.fillRect(Wd / 2 - 3, -L / 2 + 6, 3, L - 12);
    g.fillStyle = '#22313A';
    g.fillRect(-Wd / 2 + 6, L / 2 - 18, Wd - 12, 10); // windscreen
    g.restore();
  }

  function drawOffice() {
    const [ox, oz] = office.origin;
    const { w, d } = office.size;
    g.fillStyle = '#3A2A20';
    g.fillRect(0, 0, W, H);
    rect(ox - w / 2, oz - d / 2, w, d, '#7A5A3E', INK);
    rect(ox - 1.2, oz - 2.3, 2.4, 1, '#5B3A24', INK); // desk
    tag('100% VISA GUARANTEED', sx(ox - 2.2), sy(oz - d / 2) + 12, '#C74742', '#fff', '400 10px Bungee, Impact, sans-serif');
    tag('CERTIFIED AGENT', sx(ox + 2.4), sy(oz - d / 2) + 12, '#FFF8E7', INK, '400 10px Bungee, Impact, sans-serif');
    tag('PAY TODAY ONLY', sx(ox + w / 2) - 44, sy(oz + 0.3), DANFO, INK, '400 10px Bungee, Impact, sans-serif');
    g.fillStyle = '#5B3A24';
    g.fillRect(sx(ox - 0.6), sy(oz + d / 2) - 3, 1.2 * PX_PER_M, 6);
  }

  /** @param {LitePerson} p @param {number} [heading] */
  function person(p, heading) {
    const x = sx(p.x), y = sy(p.z);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath(); g.ellipse(x, y + 5, 11, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = p.outfit; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = p.skin;
    g.beginPath(); g.arc(x, y - 2, 6, 0, Math.PI * 2); g.fill(); g.stroke();
    if (heading !== undefined) {
      g.fillStyle = INK;
      g.beginPath();
      g.arc(x + Math.sin(heading) * 13, y + Math.cos(heading) * 13, 3, 0, Math.PI * 2);
      g.fill();
    }
    if (p.label) tag(p.label, x, y - 24);
  }

  function diamond(/** @type {number} */ x, /** @type {number} */ y) {
    g.fillStyle = DANFO; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 7, y); g.lineTo(x, y + 9); g.lineTo(x - 7, y); g.closePath(); g.fill(); g.stroke();
  }

  return {
    /** World point to screen (CSS px), for speech bubbles and the arrow. @param {{ x: number, y: number, z: number }} v */
    project(v) {
      return { x: sx(v.x), y: sy(v.z, v.y) };
    },

    /** @param {LiteFrame} f */
    render(f) {
      fx += (f.focus.x - fx) * 0.15;
      fz += (f.focus.z - fz) * 0.15;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (f.where === 'street') drawStreet(f); else drawOffice();
      for (const p of f.people) person(p);
      person({ x: f.player.x, z: f.player.z, skin: '#3A1F12', outfit: '#5B3A7A' }, f.player.heading);
      for (const m of f.markers) diamond(sx(m.x), sy(m.z) - 34 + Math.sin(f.time * 3 + m.x) * 3);
    },

    /** Jump the view to a point without easing. @param {{ x: number, z: number }} p */
    snap(p) { fx = p.x; fz = p.z; },
  };
}

/** True when this browser can draw the 3D World (Three.js r170 needs WebGL 2). */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free it; the renderer makes its own
    return Boolean(gl);
  } catch {
    return false;
  }
}
