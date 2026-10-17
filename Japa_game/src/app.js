// @ts-check
// JAPA vertical slice: connects the simulation (src/sim), the World (src/world)
// and the interface (src/hud). The sim owns all game state; the World only
// shows it and sends Actions (tech spec "Engine contract").
import * as THREE from 'three';
import { createSim } from './sim/engine.js';
import { sliceContent } from './content/slice.js';
import { zone, agentOffice } from './world/zone.js';
import { buildZone, buildOffice } from './world/build.js';
import { makePerson, SKIN_TONES } from './world/people.js';
import { createLiteView, hasWebGL } from './world/lite.js';
import { createCameraRig } from './world/camera.js';
import { createInput, moveWithCollisions, WALK_SPEED } from './world/movement.js';
import { createHud } from './hud/hud.js';
import { shareReceipt } from './hud/receipt-image.js';
import { createAudio } from './audio.js';
import { naira, clockLabel } from './sim/engine.js';

/** @typedef {import('./sim/types.js').RunState} RunState */
/** @typedef {import('./sim/types.js').Action} Action */
/** @typedef {import('./world/people.js').Character} Character */

const params = new URLSearchParams(location.search);
const SAVE_KEY = `japa-slice-1${params.get('slot') ? `-${params.get('slot')}` : ''}`; // development: separate save slots
if (params.get('fresh') === '1') { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
const sim = createSim(sliceContent);
const hud = createHud();
const audio = createAudio();
hud.muteButton(audio.muted, () => audio.toggleMute());
// Tester feedback (Tally form q5ZzW2); the build and receipt stamp ride along as hidden fields.
const BUILD = 'slice-2';
const loadingScreen = hud.loading([
  'Traffic dey Ojuelegba. Lagos dey load…',
  'Mr Adewale don wake up. E dey wait.',
  'Generator don start for next compound.',
  'Danfo conductor: "Ojuelegba! Ojuelegba! Enter with your change!"',
]);
THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => loadingScreen.progress(loaded / total);

// ---------- renderer, scene, light ----------
// Lite mode (PRD Q25): phones without WebGL get the same game drawn top-down in 2D.
const LITE = params.get('lite') === '1' || !hasWebGL();
const FEEDBACK_URL = `https://tally.so/r/q5ZzW2?build=${BUILD}${LITE ? '-lite' : ''}`;
let lowGraphics = params.get('low') === '1';
/** @type {THREE.WebGLRenderer | null} */
const renderer = LITE ? null : new THREE.WebGLRenderer({ antialias: !lowGraphics, powerPreference: 'high-performance' });
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowGraphics ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = !lowGraphics;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.prepend(renderer.domElement);
}
const liteCanvas = document.createElement('canvas');
if (LITE) document.body.prepend(liteCanvas);

const scene = new THREE.Scene();
scene.background = skyTexture(); // harmattan morning haze
scene.fog = new THREE.Fog('#F3D9B6', 40, 115);

/** A vertical gradient sky: warm dust overhead, pale haze at the horizon. */
function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#D9A878');
  grad.addColorStop(0.55, '#EDC9A0');
  grad.addColorStop(1, '#F6E2C4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.3, 200);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer?.setSize(innerWidth, innerHeight);
});
scene.add(new THREE.HemisphereLight('#FFF4E0', '#8A6A4A', 1.5));
const sun = new THREE.DirectionalLight('#FFE2B8', 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 80 });
// faces stay readable at every skin tone: warm fill from the camera, rim from behind (PRD Q34)
const fill = new THREE.DirectionalLight('#FFD9B0', 0.8);
const rim = new THREE.DirectionalLight('#FFE8C8', 1.0);
scene.add(sun, sun.target, fill, fill.target, rim, rim.target);

// ---------- the World ----------
await Promise.all(['400 40px Bungee', '700 20px Archivo', '500 13px "IBM Plex Mono"'].map((f) => document.fonts.load(f).catch(() => null)));
const street = buildZone(zone);
const office = buildOffice(agentOffice);
scene.add(street.group, office.group);
const lite = LITE ? createLiteView(liteCanvas, zone, agentOffice) : null;
const roomLight = new THREE.PointLight('#FFD58A', 6, 6);
roomLight.position.set(-19.5, 2.6, 15.5);
scene.add(roomLight);

const [ox, oz] = agentOffice.origin;
/**
 * Lite mode skips the 3D models (and their download): a stand-in with a position.
 * @param {Parameters<typeof makePerson>[0]} spec
 * @returns {Promise<Character>}
 */
const person = async (spec) => {
  if (!LITE) return makePerson(spec);
  const stand = { root: new THREE.Object3D(), mixer: /** @type {THREE.AnimationMixer} */ (/** @type {unknown} */ ({ update() {} })), current: spec.anim,
    play(/** @type {string} */ name) { stand.current = name; } };
  return stand;
};
const player = await person({ model: 'Casual_Hoodie', tone: 1, anim: 'Idle' });
scene.add(player.root);
/** @type {{ spec: import('./world/zone.js').Person, char: Character, office: boolean }[]} */
const people = await Promise.all([
  ...zone.people.map(async (spec) => ({ spec, char: await person(spec), office: false })),
  ...agentOffice.people.map(async (spec) => ({ spec, char: await person(spec), office: true })),
]);
for (const p of people) {
  const [x, z] = p.office ? [ox + p.spec.at[0], oz + p.spec.at[1]] : p.spec.at;
  p.char.root.position.set(x, 0, z);
  p.char.root.rotation.y = p.spec.facing;
  scene.add(p.char.root);
}

// ---------- the Run ----------
/** @type {{ seed: number, actions: Action[], scene: 'street' | 'office', pos: [number, number] } | null} */
let saved = null;
try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null'); } catch { saved = null; }
const seed = saved?.seed ?? (Math.random() * 2 ** 32) >>> 0;
/** @type {Action[]} */
const actions = saved?.actions ?? [];
let run = sim.replay({ seed, backgroundId: 'fresh-graduate', actions }).run;
let where = /** @type {'street' | 'office'} */ (saved?.scene ?? 'street');
const pos = player.root.position;
const at = params.get('at')?.split(',').map(Number); // development: start somewhere else
if (at?.length === 2) pos.set(at[0], 0, at[1]);
else if (saved?.pos) pos.set(saved.pos[0], 0, saved.pos[1]);
else pos.set(zone.playerStart[0], 0, zone.playerStart[1]);
player.root.rotation.y = zone.playerFacing;
const save = () => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ seed, actions, scene: where, pos: [pos.x, pos.z] })); } catch { /* private mode */ }
};

const input = createInput(hud.joy, hud.knob);
const cam = createCameraRig(camera);
cam.rig.interior = where === 'office';
cam.rig.roomCentre = new THREE.Vector3(ox, 0, oz + 0.6);
cam.snap(where === 'office' ? cam.rig.roomCentre : pos);

/** @type {Character | null} Who the player is talking to. */
let talkingTo = null;
/** @type {{ close: () => void } | null} */
let phone = null;
let busy = false; // an Event, transition or receipt is on screen

/** @param {THREE.Vector3} v @returns {import('./hud/hud.js').ScreenPoint} */
function toScreen(v) {
  if (lite) return lite.project(v);
  const p = v.clone().project(camera);
  if (p.z > 1) return null;
  return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
}
const headOf = (/** @type {Character} */ c, up = 2.05) => () => toScreen(c.root.position.clone().add(new THREE.Vector3(0, up, 0)));

function refreshHud() {
  hud.setStats({ funds: run.resources.funds, energy: run.resources.energy, clock: run.clock });
  // in Dr. Bayo's office, the strip shows the quest that brought you there
  const quest = where === 'office' && run.quests['voice-note'] === 'active' ? sliceContent.quests['voice-note'] : sim.currentQuest(run);
  hud.setQuest(run.endingId ? null : quest);
  hud.setRedFlags(where === 'office' ? sim.redFlagsSpotted(run) : null, sliceContent.redFlags.length);
}

// ---------- the arrow to your next goal ----------
/** @returns {THREE.Vector3 | null} */
function questTargetPosition() {
  if (run.endingId || busy) return null;
  const quest = where === 'office' && run.quests['voice-note'] === 'active' ? sliceContent.quests['voice-note'] : sim.currentQuest(run);
  const t = quest && zone.questTargets[quest.id]?.[where];
  if (!t) return null;
  if ('person' in t && t.person) {
    const p = people.find((q) => q.spec.id === t.person);
    return p ? p.char.root.position.clone().setY(1.6) : null;
  }
  const spot = 'spot' in t && t.spot ? zone.spots.find((sp) => sp.id === t.spot) : null;
  return spot ? new THREE.Vector3(spot.at[0], 1, spot.at[1]) : null;
}

// ---------- interactions ----------
/**
 * Everything the player could act on right now in this scene.
 * @returns {{ id: string, at: THREE.Vector3, radius: number, verb: string, label: string, person?: Character }[]}
 */
function targets() {
  if (run.endingId) return [];
  const avail = new Set(sim.availableInteractables(run));
  const list = [];
  const spots = where === 'street' ? zone.spots : agentOffice.spots;
  const base = where === 'street' ? [0, 0] : agentOffice.origin;
  for (const s of spots) {
    const at = new THREE.Vector3(base[0] + s.at[0], 0, base[1] + s.at[1]);
    if (s.id === 'pharmacy-stairs') list.push({ id: s.id, at, radius: s.radius ?? 1.4, verb: 'Enter', label: 'Upstairs' });
    else if (s.id === 'office-exit') list.push({ id: s.id, at, radius: s.radius ?? 1.2, verb: 'Enter', label: 'Back to the street' });
    else if (avail.has(s.id)) {
      const it = sliceContent.interactables[s.id];
      list.push({ id: s.id, at, radius: s.radius ?? 1.4, verb: it.verb, label: it.label });
    }
  }
  for (const p of people) {
    if (p.office !== (where === 'office')) continue;
    const id = [p.spec.interactable, ...(p.spec.also ?? [])].find((i) => i && avail.has(i));
    if (!id) continue;
    const it = sliceContent.interactables[id];
    list.push({ id, at: p.char.root.position, radius: 1.9, verb: it.verb, label: it.label, person: p.char });
  }
  return list;
}

// Markers: a bobbing danfo-yellow diamond over everything you can act on now.
const markerGeo = new THREE.OctahedronGeometry(0.22);
const markerMat = new THREE.MeshBasicMaterial({ color: '#F2B705' });
const markerEdge = new THREE.LineBasicMaterial({ color: '#191B1E' });
/** @type {Map<string, THREE.Object3D>} */
const markers = new Map();
/** @param {ReturnType<typeof targets>} list @param {number} t */
function syncMarkers(list, t) {
  const live = new Set();
  for (const target of list) {
    live.add(target.id);
    let m = markers.get(target.id);
    if (!m) {
      m = new THREE.Mesh(markerGeo, markerMat);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(markerGeo), markerEdge));
      m.scale.y = 1.5;
      scene.add(m);
      markers.set(target.id, m);
    }
    const lift = target.person ? 2.35 : 1.1;
    m.position.set(target.at.x, lift + Math.sin(t * 3 + target.at.x) * 0.08, target.at.z);
    m.rotation.y = t * 1.5;
    m.visible = !busy;
  }
  for (const [id, m] of markers) if (!live.has(id)) { scene.remove(m); markers.delete(id); }
}

/** @param {Action} action @param {Character | null} who */
function act(action, who) {
  run = sim.applyAction(run, action);
  actions.push(action);
  save();
  afterAction(who);
}

/** @param {Character | null} who */
function afterAction(who) {
  refreshHud();
  const fb = run.feedback;
  if (fb?.stamp) audio.stamp();
  else if (fb?.delta.funds) audio.cash();
  if (fb) {
    hud.floatDeltas(fb.delta, headOf(player, 2.3)());
    if (fb.stamp) hud.stamp(fb.stamp, fb.stamp !== 'RED FLAG');
    if (fb.say) {
      if (who && !fb.stamp) hud.say(fb.say, headOf(who));
      else { hud.clearBubbles(); hud.caption(fb.say, undefined, 3800); }
    }
  }
  if (run.openEvent) return openEvent(who);
  if (talkingTo && !fb?.say) hud.clearBubbles();
  talkingTo = null;
  closeEventUi();
  if (run.endingId) {
    busy = true;
    setTimeout(showReceipt, 2600);
  }
}

function closeEventUi() {
  hud.hideChoices();
  phone?.close();
  phone = null;
  busy = false;
}

/** @param {Character | null} who */
function openEvent(who) {
  busy = true;
  const ev = sliceContent.events[/** @type {string} */ (run.openEvent)];
  const options = sim.choices(run);
  const choose = (/** @type {number} */ i) => { audio.tap(); act({ type: 'choose', index: i }, talkingTo); };
  if (ev.id === 'voice-note') {
    audio.buzz();
    phone?.close();
    const p = hud.showPhone({
      title: 'FAMILY & FRIENDS',
      messages: [
        { from: 'Mummy', text: 'Good morning my son. Mr Adewale called me about the rent o. Please settle him today.' },
        { from: 'Tobi (cousin)', voice: ev.line, secs: 14 },
      ],
    });
    phone = p;
    setTimeout(() => p.play(), 700);
    setTimeout(() => { if (run.openEvent === ev.id) hud.showChoices({ speaker: 'Reply to Tobi', choices: options }, choose); }, 900);
    return;
  }
  talkingTo = who;
  if (who) {
    who.root.lookAt(pos.x, 0, pos.z);
    player.root.lookAt(who.root.position.x, 0, who.root.position.z);
    hud.say(ev.line, headOf(who), 120000);
  } else {
    hud.caption(ev.line, ev.speaker, 6000);
  }
  hud.showChoices({ speaker: ev.speaker, choices: options }, choose);
}

/** @param {{ id: string, person?: Character }} t */
async function interact(t) {
  if (busy) return;
  audio.tap();
  if (t.id === 'pharmacy-stairs') {
    if (!run.flags.includes('know_agent')) { hud.say('Na office upstairs. You no get business there yet.', headOf(player)); return; }
    return goTo('office');
  }
  if (t.id === 'office-exit') return goTo('street');
  act({ type: 'interact', id: t.id }, t.person ?? null);
}

/** @param {'street' | 'office'} next */
async function goTo(next) {
  busy = true;
  await hud.fade(true);
  where = next;
  cam.rig.interior = next === 'office';
  audio.setIndoors(next === 'office');
  if (next === 'office') pos.set(ox + agentOffice.playerStart[0], 0, oz + agentOffice.playerStart[1]);
  else pos.set(15.4, 0, -5.6);
  player.root.rotation.y = Math.PI;
  cam.snap(next === 'office' && cam.rig.roomCentre ? cam.rig.roomCentre : pos);
  lite?.snap(pos);
  refreshHud();
  save();
  await hud.fade(false);
  busy = false;
  if (next === 'office' && sim.redFlagsSpotted(run) === 0) hud.caption('Look around before you talk. Wetin no sure here?', 'DR. BAYO VISA CONSULT', 3800);
}

// ---------- the JAPA Receipt ----------
function showReceipt() {
  const ending = sim.ending(run);
  if (!ending) return;
  audio.receipt();
  const code = seed.toString(36).slice(-4).toUpperCase();
  /** @type {[string, string][]} */
  const items = run.receipt.map((l) => [l.text, l.kobo === undefined ? '' : naira(l.kobo)]);
  items.push(['RED FLAGS SPOTTED', `${sim.redFlagsSpotted(run)} / ${sliceContent.redFlags.length}`]);
  if (ending.id === 'scammed') items.push(['VISA DELIVERED', '0'], ['AGENT PICKING CALLS', 'NO']);
  else items.push(['MONEY SAVED FROM AGENT', '₦300,000']);
  items.push(['MONEY LEFT', naira(run.resources.funds)]);
  hud.setQuest(null);
  const receipt = {
    stamp: ending.stamp,
    good: ending.id !== 'scammed',
    lesson: ending.lesson,
    rows: /** @type {[string, string][]} */ ([['CUSTOMER', 'YOU'], ['DATE', clockLabel(run.clock)], ['MERCHANT', 'DR. BAYO VISA CONSULT']]),
    items,
    code,
  };
  hud.showReceipt(receipt, {
    onShare: async () => {
      const link = location.origin + location.pathname;
      const text = `My JAPA Receipt: ${ending.stamp}. Red flags spotted: ${sim.redFlagsSpotted(run)}/3. Can you do better? ${link}`;
      const result = await shareReceipt({ ...receipt, url: location.host }, text);
      if (result === 'saved') hud.caption('Receipt saved to your phone. Post am for your status.');
    },
    onFeedback: () => open(`${FEEDBACK_URL}&stamp=${encodeURIComponent(ending.stamp)}`, '_blank', 'noopener'),
    onRetry: () => {
      try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
      location.reload();
    },
  });
}

// ---------- the opening beat (new runs only) ----------
function opening() {
  busy = true;
  hud.caption('₦48,500 for your name. Rent: ₦150,000.', 'MONDAY · 6:43AM', 3200);
  setTimeout(() => { roomLight.intensity = 0; hud.caption('NEPA don take light.', undefined, 2200); }, 3400);
  setTimeout(() => { hud.caption('Somebody don on generator. Your phone dey buzz.', undefined, 2600); audio.startGenerator(); audio.buzz(); busy = false; }, 5800);
}

// ---------- the frame loop ----------
refreshHud();
loadingScreen.done();
if (actions.length > 0) roomLight.intensity = 0;
// Title screen over the live street; the camera drifts along it until you start.
let attract = !run.endingId;
let coachDone = actions.length > 0;
/** @type {(() => void) | null} */
let hideCoach = null;
const begin = () => {
  audio.start();
  if (actions.length > 0) audio.startGenerator();
  audio.setIndoors(where === 'office');
  attract = false;
  document.getElementById('hud')?.classList.remove('attract');
  cam.rig.interior = where === 'office';
  cam.snap(where === 'office' && cam.rig.roomCentre ? cam.rig.roomCentre : pos);
  if (FEEDBACK_URL) hud.feedbackButton(FEEDBACK_URL);
  if (actions.length === 0) {
    opening();
    setTimeout(() => { if (!coachDone) hideCoach = hud.coach(); }, 6200);
  } else if (run.openEvent) openEvent(null);
};
if (run.endingId) showReceipt();
else {
  busy = true;
  document.getElementById('hud')?.classList.add('attract');
  hud.showTitle({
    resume: actions.length > 0,
    feedbackUrl: FEEDBACK_URL,
    onStart: () => { busy = false; begin(); },
    onRestart: () => { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } location.search = ''; },
  });
  if (params.get('start') === '1') document.querySelector('#hud .title .go')?.dispatchEvent(new MouseEvent('click')); // development: skip the title
}

const clock = new THREE.Clock();
let slowFrames = 0;
let lastSave = 0;
const facing = new THREE.Quaternion();
const frame = () => {
  const dt = Math.min(clock.getDelta(), 0.1);

  // move the player (no walking while talking or reading)
  input.setEnabled(!busy);
  hud.setMoving(!busy);
  const dir = input.direction();
  if (dir.lengthSq() > 0 && !coachDone) { coachDone = true; hideCoach?.(); }
  if (dir.lengthSq() > 0) {
    moveWithCollisions(pos, dir.clone().multiplyScalar(WALK_SPEED * dt), where === 'street' ? street.colliders : office.colliders);
    facing.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(dir.x, dir.z));
    player.root.quaternion.slerp(facing, 1 - Math.exp(-12 * dt));
    player.play('Walk');
  } else if (player.current === 'Walk') player.play('Idle');

  // the one action button: the nearest thing you can act on
  const all = targets();
  syncMarkers(all, clock.elapsedTime);
  const near = busy ? null : all
    .map((t) => ({ t, d: Math.hypot(t.at.x - pos.x, t.at.z - pos.z) }))
    .filter(({ t, d }) => d < t.radius)
    .sort((a, b) => a.d - b.d)[0]?.t ?? null;
  hud.setAction(near && { verb: near.verb, label: near.label }, () => near && interact(near));
  if (input.takeInteract() && near) interact(near);

  // street life: walkers pace the pavements
  for (const p of people) {
    if (p.spec.anim === 'Walk' && !p.office) {
      const span = 26, t = (clock.elapsedTime * 1.1 + p.spec.at[0]) % (span * 2);
      const x = p.spec.at[0] + (t < span ? t : span * 2 - t) - span / 2;
      const r = p.char.root;
      r.rotation.y = t < span ? Math.PI / 2 : -Math.PI / 2;
      r.position.x = x;
    }
    p.char.mixer.update(dt);
  }
  player.mixer.update(dt);

  // camera, fades, light that follows the player
  const drift = new THREE.Vector3(-18 + ((clock.elapsedTime * 1.4) % 40), 0, -1.5);
  const head = (attract ? drift : pos).clone().setY(1.2);
  cam.update(dt, {
    player: attract ? drift : pos,
    moveDir: attract ? new THREE.Vector3(1, 0, 0) : dir,
    speaker: talkingTo ? talkingTo.root.position : null,
    walls: where === 'street' ? street.fadeables.map((f) => f.box) : [],
  });
  if (where === 'street' && !lite) cam.fade(dt, street.fadeables, head);
  if (attract) {
    // establishing shot: drift along the street, looking at the shopfronts and their signs
    const x = -22 + ((clock.elapsedTime * 1.2) % 44);
    camera.position.set(x, 3.8, 10.5);
    camera.lookAt(x + 1.2, 0.6, -9);
  }
  fill.position.copy(camera.position).add(new THREE.Vector3(-2, 1, 0));
  fill.target.position.copy(head);
  rim.position.copy(head).add(head.clone().sub(camera.position).setY(0).setLength(6)).add(new THREE.Vector3(0, 4, 0));
  rim.target.position.copy(head);
  sun.position.copy(head).add(new THREE.Vector3(14, 26, 8));
  sun.target.position.copy(head);
  hud.track();
  const goal = attract ? null : questTargetPosition();
  if (goal) {
    const p = toScreen(goal);
    const onScreen = p !== null && p.x > 40 && p.x < innerWidth - 40 && p.y > 160 && p.y < innerHeight - 200;
    hud.setPointer({ dx: goal.x - pos.x, dz: goal.z - pos.z, metres: Math.hypot(goal.x - pos.x, goal.z - pos.z), onScreen });
  } else hud.setPointer(null);
  if (renderer) renderer.render(scene, camera);
  else lite?.render(liteFrame(all, attract ? drift : pos));

  // drop to low graphics on weak phones (keeps movement and interaction)
  if (renderer && !lowGraphics && dt > 1 / 24) { if (++slowFrames > 90) { lowGraphics = true; renderer.shadowMap.enabled = false; renderer.setPixelRatio(1); } }
  else slowFrames = Math.max(0, slowFrames - 1);
  if (clock.elapsedTime - lastSave > 3) { lastSave = clock.elapsedTime; save(); }
};
if (renderer) renderer.setAnimationLoop(frame);
else (function tick() { frame(); requestAnimationFrame(tick); })();

/**
 * What the lite view draws this frame.
 * @param {ReturnType<typeof targets>} all @param {THREE.Vector3} focus
 * @returns {import('./world/lite.js').LiteFrame}
 */
function liteFrame(all, focus) {
  const avail = new Set(all.map((t) => t.id));
  const inRoom = zone.buildings.find((b) => b.enterable && Math.abs(pos.x - b.x) < b.w / 2 && Math.abs(pos.z - b.z) < b.d / 2);
  return {
    focus: where === 'office' ? { x: ox, z: oz + 0.6 } : { x: focus.x, z: focus.z },
    where,
    player: { x: pos.x, z: pos.z, heading: player.root.rotation.y },
    people: people.filter((p) => p.office === (where === 'office')).map((p) => {
      const id = [p.spec.interactable, ...(p.spec.also ?? [])].find((i) => i && avail.has(i));
      return {
        x: p.char.root.position.x, z: p.char.root.position.z,
        skin: SKIN_TONES[p.spec.tone],
        outfit: Object.values(p.spec.look?.outfit ?? {})[0] ?? '#6B6B6B',
        label: id ? sliceContent.interactables[id].label : undefined,
      };
    }),
    markers: busy ? [] : all.filter((t) => !t.person).map((t) => ({ x: t.at.x, z: t.at.z })),
    insideRoom: Boolean(inRoom),
    time: clock.elapsedTime,
  };
}
