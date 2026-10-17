// @ts-check
// The world simulation. Pure functions over an immutable RunState; content comes in as data.
// The renderer reads state and sends Actions; it never changes state itself.
// Same seed + content version + Actions = same outcome on any device.

/** @typedef {import('./types.js').Content} Content */
/** @typedef {import('./types.js').RunState} RunState */
/** @typedef {import('./types.js').Action} Action */
/** @typedef {import('./types.js').Effect} Effect */
/** @typedef {import('./types.js').Choice} Choice */
/** @typedef {import('./types.js').Requirement} Requirement */
/** @typedef {import('./types.js').Resource} Resource */
/** @typedef {import('./types.js').Resources} Resources */
/** @typedef {import('./types.js').ResourceDelta} ResourceDelta */
/** @typedef {import('./types.js').Interactable} Interactable */

/** @type {Resource[]} */
export const RESOURCES = ['funds', 'energy', 'readiness', 'homeTies', 'riskSense'];
const SCALE_MAX = 100;

/**
 * @param {Content} content
 */
export function createSim(content) {
  /**
   * @param {{ seed: number, backgroundId: string }} options
   * @returns {RunState}
   */
  function startRun({ seed, backgroundId }) {
    const background = content.backgrounds[backgroundId];
    if (!background) throw new Error(`Unknown background: ${backgroundId}`);
    return {
      contentVersion: content.version,
      seed: seed >>> 0,
      rng: seed >>> 0,
      backgroundId,
      resources: { ...background.resources },
      clock: background.clock,
      flags: [],
      used: [],
      quests: Object.fromEntries((background.quests ?? []).map((q) => [q, /** @type {const} */ ('active')])),
      openEvent: null,
      receipt: [],
      endingId: null,
      feedback: null,
      step: 0,
    };
  }

  /**
   * Interactables the player can use right now. Ones that are used up or whose
   * requirements aren't met are left out, so nothing marked interactable is dead.
   * @param {RunState} run
   * @returns {string[]}
   */
  function availableInteractables(run) {
    if (run.endingId || run.openEvent) return [];
    return Object.values(content.interactables)
      .filter((it) => !(it.once && run.used.includes(it.id)) && !unmet(run, it.requires))
      .map((it) => it.id);
  }

  /**
   * The open Event's Choices, each with whether it can be picked and why not.
   * @param {RunState} run
   */
  function choices(run) {
    if (!run.openEvent) return [];
    return content.events[run.openEvent].choices.map((choice, index) => {
      const reason = unmet(run, choice.requires) ?? unaffordable(run, choice);
      return { choice, index, available: !reason, reason };
    });
  }

  /**
   * The only way state changes.
   * @param {RunState} run
   * @param {Action} action
   * @returns {RunState}
   */
  function applyAction(run, action) {
    if (run.endingId) throw new Error('The Run has already ended');
    if (action.type === 'interact') {
      if (run.openEvent) throw new Error('An Event is open; pick a Choice first');
      const it = content.interactables[action.id];
      if (!it) throw new Error(`Unknown interactable: ${action.id}`);
      if (!availableInteractables(run).includes(it.id)) throw new Error(`Not available: ${it.id}`);
      const used = it.once ? [...run.used, it.id] : run.used;
      return { ...apply({ ...run, used }, it), step: run.step + 1 };
    }
    if (action.type === 'choose') {
      const option = choices(run)[action.index];
      if (!option) throw new RangeError(`No choice at index ${action.index}`);
      if (!option.available) throw new Error(`Choice unavailable: ${option.reason}`);
      return { ...apply({ ...run, openEvent: null }, option.choice), step: run.step + 1 };
    }
    throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }

  /**
   * @param {RunState} run
   * @param {Effect} effect
   * @returns {RunState}
   */
  function apply(run, effect) {
    const resources = applyDelta(run.resources, effect.delta ?? {});
    const flags = effect.setFlags ? [...new Set([...run.flags, ...effect.setFlags])].sort() : run.flags;
    const quests = { ...run.quests };
    if (effect.startQuest && !quests[effect.startQuest]) quests[effect.startQuest] = 'active';
    if (effect.completeQuest) quests[effect.completeQuest] = 'done';
    const receipt = effect.receipt ? [...run.receipt, effect.receipt] : run.receipt;
    const minutes = effect.minutes ?? 0;
    return {
      ...run,
      resources,
      flags,
      quests,
      receipt,
      clock: run.clock + minutes,
      openEvent: effect.event ?? null,
      endingId: effect.ending ?? null,
      feedback: { delta: diff(run.resources, resources), say: effect.say, stamp: effect.stamp, minutes },
    };
  }

  /**
   * @param {RunState} run
   * @param {Requirement | undefined} req
   * @returns {string | null} Why it can't be done, or null.
   */
  function unmet(run, req) {
    if (!req) return null;
    if (req.funds !== undefined && run.resources.funds < req.funds) return `You have ${naira(run.resources.funds)}`;
    if (req.flags?.some((f) => !run.flags.includes(f))) return 'Not yet';
    if (req.notFlags?.some((f) => run.flags.includes(f))) return 'Already done';
    return null;
  }

  /**
   * A Choice that would take Funds below zero can't be picked.
   * @param {RunState} run
   * @param {Choice} choice
   */
  function unaffordable(run, choice) {
    const cost = -(choice.delta?.funds ?? 0);
    return cost > run.resources.funds ? `You have ${naira(run.resources.funds)}` : null;
  }

  /**
   * @param {RunState} run
   */
  function ending(run) {
    return run.endingId ? content.endings[run.endingId] : null;
  }

  /**
   * @param {RunState} run
   */
  function redFlagsSpotted(run) {
    return content.redFlags.filter((f) => run.flags.includes(f)).length;
  }

  /**
   * Rebuilds a Run from its seed and Actions; used for save/resume and checking runs.
   * @param {{ seed: number, backgroundId: string, actions: Action[] }} log
   */
  function replay({ seed, backgroundId, actions }) {
    let run = startRun({ seed, backgroundId });
    for (const [i, action] of actions.entries()) {
      try {
        run = applyAction(run, action);
      } catch (error) {
        return { run, valid: false, error: `Action ${i}: ${/** @type {Error} */ (error).message}` };
      }
    }
    return { run, valid: true };
  }

  /**
   * The quest the strip shows: the first active one in content order.
   * @param {RunState} run
   */
  function currentQuest(run) {
    const id = Object.keys(content.quests).find((q) => run.quests[q] === 'active');
    return id ? content.quests[id] : null;
  }

  return { startRun, availableInteractables, choices, applyAction, ending, redFlagsSpotted, currentQuest, replay };
}

/**
 * @param {Resources} resources
 * @param {ResourceDelta} delta
 * @returns {Resources}
 */
function applyDelta(resources, delta) {
  const next = { ...resources };
  for (const r of RESOURCES) {
    const value = resources[r] + (delta[r] ?? 0);
    next[r] = r === 'funds' ? Math.max(0, value) : Math.min(SCALE_MAX, Math.max(0, value));
  }
  return next;
}

/**
 * @param {Resources} before
 * @param {Resources} after
 * @returns {ResourceDelta}
 */
function diff(before, after) {
  /** @type {ResourceDelta} */
  const delta = {};
  for (const r of RESOURCES) if (after[r] !== before[r]) delta[r] = after[r] - before[r];
  return delta;
}

/**
 * Formats kobo as naira, e.g. 4850000 → "₦48,500".
 * @param {number} kobo
 */
export function naira(kobo) {
  const sign = kobo < 0 ? '−' : '';
  return `${sign}₦${Math.round(Math.abs(kobo) / 100).toLocaleString('en-NG')}`;
}

/**
 * Formats the clock, e.g. 403 → "MON 6:43AM".
 * @param {number} minutes Minutes since Monday 00:00.
 */
export function clockLabel(minutes) {
  const day = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][Math.floor(minutes / 1440) % 7];
  const m = minutes % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${day} ${((h + 11) % 12) + 1}:${mm}${h < 12 ? 'AM' : 'PM'}`;
}
