// @ts-check
// The standard casual-game follow camera (PRD Q21): fixed direction, ~45° down,
// soft follow with a dead zone and a slight lead, a tilt near walls, faded
// occluders, and a two-shot close-up for conversations.
import * as THREE from 'three';

/** @typedef {import('./build.js').Fadeable} Fadeable */

export function createCameraRig(/** @type {THREE.PerspectiveCamera} */ camera) {
  const rig = {
    pitch: THREE.MathUtils.degToRad(41),
    wallPitch: THREE.MathUtils.degToRad(60),
    yaw: 0,
    distPortrait: 10,
    distLandscape: 12.5,
    distInterior: 9,
    /** In a small room the camera frames the whole room instead of following. */
    roomCentre: /** @type {THREE.Vector3 | null} */ (null),
    deadZone: 0.35,
    lead: 1.2,
    frameBelow: 2.2,
    focus: new THREE.Vector3(),
    tilt: 0,
    /** 0 = follow, 1 = conversation close-up */
    talk: 0,
    interior: false,
  };
  const toCamera = () => new THREE.Vector3(Math.sin(rig.yaw), 0, Math.cos(rig.yaw));
  const ray = new THREE.Ray();
  const hit = new THREE.Vector3();
  const followPos = new THREE.Vector3(), followLook = new THREE.Vector3();
  const talkPos = new THREE.Vector3(), talkLook = new THREE.Vector3();

  /** @param {THREE.Vector3} at */
  function snap(at) {
    rig.focus.copy(at);
  }

  /**
   * @param {number} dt
   * @param {{ player: THREE.Vector3, moveDir: THREE.Vector3, speaker: THREE.Vector3 | null, walls: THREE.Box3[] }} p
   */
  function update(dt, p) {
    const portrait = innerHeight > innerWidth;
    const want = p.player.clone().addScaledVector(p.moveDir, rig.interior ? 0.4 : rig.lead);
    if (portrait && !rig.interior) want.addScaledVector(toCamera(), -rig.frameBelow * (1 - rig.tilt));
    const off = want.clone().sub(rig.focus);
    off.y = 0;
    if (off.length() > rig.deadZone) rig.focus.addScaledVector(off.setLength(off.length() - rig.deadZone), 1 - Math.exp(-6 * dt));

    // tilt down when a wall is close in front of the player (up-screen)
    const probe = new THREE.Ray(p.player.clone().setY(1), toCamera().negate());
    let wallNear = false;
    for (const b of p.walls) if (probe.intersectBox(b, hit) && hit.distanceTo(probe.origin) < 6) { wallNear = true; break; }
    rig.tilt += ((wallNear && !rig.interior ? 1 : 0) - rig.tilt) * (1 - Math.exp(-3 * dt));

    if (rig.interior && rig.roomCentre) rig.focus.lerp(rig.roomCentre.clone().lerp(p.player, 0.25), 1 - Math.exp(-4 * dt));
    const pitch = rig.interior ? THREE.MathUtils.degToRad(56) : THREE.MathUtils.lerp(rig.pitch, rig.wallPitch, rig.tilt);
    const dist = rig.interior ? rig.distInterior : (portrait ? rig.distPortrait : rig.distLandscape) * (1 - 0.1 * rig.tilt);
    followPos.copy(rig.focus).addScaledVector(toCamera(), Math.cos(pitch) * dist);
    followPos.y = 1 + Math.sin(pitch) * dist;
    followLook.set(rig.focus.x, 1, rig.focus.z);

    // conversation close-up: side-on two-shot, faces above the choice panel
    rig.talk += ((p.speaker ? 1 : 0) - rig.talk) * (1 - Math.exp(-4 * dt));
    if (p.speaker) {
      const mid = p.player.clone().add(p.speaker).multiplyScalar(0.5);
      const across = p.speaker.clone().sub(p.player).setY(0).normalize();
      const side = new THREE.Vector3(-across.z, 0, across.x);
      if (side.dot(toCamera()) < 0) side.negate();
      talkPos.copy(mid).addScaledVector(side, 4).setY(2.3);
      talkLook.set(mid.x, 0.95, mid.z);
    }
    const t = rig.talk * rig.talk * (3 - 2 * rig.talk);
    camera.position.lerpVectors(followPos, talkPos, p.speaker || rig.talk > 0.01 ? t : 0);
    camera.lookAt(new THREE.Vector3().lerpVectors(followLook, talkLook, p.speaker || rig.talk > 0.01 ? t : 0));
  }

  /**
   * Fades anything between the camera and the player; enterable buildings
   * fade fully while the player is inside them (PRD Q22).
   * @param {number} dt
   * @param {Fadeable[]} fadeables
   * @param {THREE.Vector3} target The player's head.
   */
  function fade(dt, fadeables, target) {
    ray.origin.copy(camera.position);
    ray.direction.copy(target).sub(camera.position).normalize();
    const maxD = camera.position.distanceTo(target);
    for (const f of fadeables) {
      const inside = f.inside?.containsPoint(target.clone().setY(1)) ?? false;
      const inCorridor = f.box.max.y > 1.5 && f.box.min.z > target.z + 0.5 && f.box.min.z < camera.position.z
        && f.box.max.x > target.x - 4 && f.box.min.x < target.x + 4;
      const blocks = inside || inCorridor || (ray.intersectBox(f.box, hit) !== null && camera.position.distanceTo(hit) < maxD) || f.box.containsPoint(camera.position);
      const goal = inside ? 0.08 : blocks ? 0.12 : 1;
      if (Math.abs(goal - f.opacity) < 0.005) continue;
      f.opacity += (goal - f.opacity) * (1 - Math.exp(-10 * dt));
      const solid = f.opacity > 0.97;
      f.group.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const m = /** @type {THREE.Material} */ (o.material);
        m.opacity = solid ? 1 : f.opacity;
        m.depthWrite = solid;
        o.castShadow = solid;
      });
    }
  }

  return { rig, update, fade, snap };
}
