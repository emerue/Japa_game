// @ts-check
// The game rules. Pure functions over an immutable RunState; all content comes in as data.

import { shuffle } from './rng.js';

/** @typedef {import('./types.js').Content} Content */
/** @typedef {import('./types.js').RunState} RunState */
/** @typedef {import('./types.js').Meter} Meter */
/** @typedef {import('./types.js').Meters} Meters */
/** @typedef {import('./types.js').MeterDelta} MeterDelta */
/** @typedef {import('./types.js').Choice} Choice */
/** @typedef {import('./types.js').ChoiceOption} ChoiceOption */
/** @typedef {import('./types.js').Outcome} Outcome */

/** Every Event costs Time, which guarantees a Run cannot go on forever. */
export const TIME_PER_EVENT = 4;
/** The second visa refusal ends the Run. */
export const MAX_REFUSALS = 2;
/** @type {MeterDelta} */
export const REFUSAL_COST = { naira: -10, sanity: -15 };

/** @type {Meter[]} */
export const METERS = ['naira', 'sanity', 'family', 'time'];
const METER_MAX = 100;

/** Endings the engine itself triggers; content must define all of them. */
export const ENGINE_ENDINGS = /** @type {const} */ ({
  settled: 'settled',
  gaveUp: 'gave-up',
  visaBan: 'visa-ban',
});

/** @type {Record<Meter, string>} */
export const LOSS_ENDING_BY_METER = {
  naira: 'broke',
  sanity: 'burnout',
  family: 'family-gone',
  time: 'out-of-time',
};

/**
 * @param {Content} content
 */
export function createEngine(content) {
  /**
   * @param {{ archetypeId: string, routeId: string, seed: number }} options
   * @returns {RunState}
   */
  function startRun({ archetypeId, routeId, seed }) {
    const archetype = content.archetypes[archetypeId];
    const route = content.routes[routeId];
    if (!archetype) throw new Error(`Unknown archetype: ${archetypeId}`);
    if (!route) throw new Error(`Unknown route: ${routeId}`);

    /** @type {RunState} */
    const run = {
      archetypeId,
      routeId,
      meters: { ...archetype.startingMeters },
      credentials: [],
      stageIndex: 0,
      queue: [],
      refusals: 0,
      rngState: seed >>> 0,
      endingId: null,
      lastOutcome: null,
    };
    return enterStage(run, 0);
  }

  /** @param {RunState} run */
  function currentEvent(run) {
    if (run.endingId || run.queue.length === 0) return null;
    return content.events[run.queue[0]];
  }

  /** @param {RunState} run */
  function currentStage(run) {
    return content.routes[run.routeId].stages[run.stageIndex];
  }

  /**
   * @param {RunState} run
   * @returns {ChoiceOption[]}
   */
  function choiceOptions(run) {
    const event = currentEvent(run);
    if (!event) return [];
    return event.choices.map((choice, index) => {
      const reason = unmetRequirement(run, choice);
      return reason ? { choice, index, available: false, reason } : { choice, index, available: true };
    });
  }

  /**
   * @param {RunState} run
   * @param {number} index
   * @returns {RunState}
   */
  function choose(run, index) {
    if (run.endingId) throw new Error('The Run has already ended');
    const event = currentEvent(run);
    if (!event) throw new Error('No current Event');
    const choice = event.choices[index];
    if (!choice) throw new RangeError(`No choice at index ${index}`);
    const unmet = unmetRequirement(run, choice);
    if (unmet) throw new Error(`Choice unavailable: ${unmet}`);

    const effects = { ...choice.effects, time: (choice.effects?.time ?? 0) - TIME_PER_EVENT };
    let meters = applyDelta(run.meters, effects);
    const granted = (choice.grants ?? []).filter((c) => !run.credentials.includes(c));
    const credentials = [...run.credentials, ...granted];
    let text = choice.outcome;
    let refusals = run.refusals;
    let refused = false;

    if (choice.visaDecision) {
      const route = content.routes[run.routeId];
      const missing = route.requiredCredentials.filter((c) => !credentials.includes(c));
      if (missing.length > 0) {
        refused = true;
        refusals += 1;
        meters = applyDelta(meters, REFUSAL_COST);
        const names = missing.map((c) => content.credentials[c]?.name ?? c).join(', ');
        text = `${choice.visaDecision.refusalOutcome} Missing: ${names}.`;
      }
    }

    /** @type {Outcome} */
    const lastOutcome = { eventId: event.id, text, delta: diff(run.meters, meters), granted };
    /** @type {RunState} */
    const next = { ...run, meters, credentials, refusals, queue: run.queue.slice(1), lastOutcome };

    // Precedence: an explicit ending beats a visa ban, which beats running a meter dry.
    if (choice.ending) return end(next, choice.ending);
    if (refusals >= MAX_REFUSALS) return end(next, ENGINE_ENDINGS.visaBan);
    const emptyMeter = METERS.find((m) => meters[m] <= 0);
    if (emptyMeter) return end(next, LOSS_ENDING_BY_METER[emptyMeter]);

    // A refusal sends the player back to the Stage before the decision to fix their papers.
    if (refused) return enterStage(next, Math.max(0, run.stageIndex - 1));
    if (next.queue.length === 0) return enterStage(next, run.stageIndex + 1);
    return next;
  }

  /**
   * @param {RunState} run
   * @returns {RunState}
   */
  function giveUp(run) {
    if (run.endingId) throw new Error('The Run has already ended');
    return end({ ...run, lastOutcome: null }, ENGINE_ENDINGS.gaveUp);
  }

  /**
   * Draws the Stage's Events. Skips forward over Stages with nothing to play;
   * moving past the last Stage means the player has settled.
   * @param {RunState} run
   * @param {number} stageIndex
   * @returns {RunState}
   */
  function enterStage(run, stageIndex) {
    const stages = content.routes[run.routeId].stages;
    let rngState = run.rngState;
    for (let i = stageIndex; i < stages.length; i++) {
      const plan = stages[i];
      const mandatory = plan.mandatory.filter((id) => {
        const held = content.events[id].skipIfHeld;
        return !held || !run.credentials.includes(held);
      });
      let deck;
      [deck, rngState] = shuffle(plan.deck, rngState);
      const drawn = deck.slice(0, plan.draw);
      let queue = [...mandatory, ...drawn];
      if (!plan.ordered) [queue, rngState] = shuffle(queue, rngState);
      if (queue.length > 0) return { ...run, stageIndex: i, queue, rngState };
    }
    return end({ ...run, rngState }, ENGINE_ENDINGS.settled);
  }

  /**
   * @param {RunState} run
   * @param {Choice} choice
   * @returns {string | null} Reason the choice is unavailable, or null.
   */
  function unmetRequirement(run, choice) {
    const req = choice.requires;
    if (!req) return null;
    const missing = (req.credentials ?? []).filter((c) => !run.credentials.includes(c));
    if (missing.length > 0) {
      return `Needs ${missing.map((c) => content.credentials[c]?.name ?? c).join(', ')}`;
    }
    for (const meter of METERS) {
      const min = req.meters?.[meter];
      if (min !== undefined && run.meters[meter] < min) return `Needs ${meterName(meter)} ≥ ${min}`;
    }
    return null;
  }

  return { startRun, currentEvent, currentStage, choiceOptions, choose, giveUp };
}

/** @param {Meter} meter */
export function meterName(meter) {
  return { naira: 'Naira', sanity: 'Sanity', family: 'Family Support', time: 'Time' }[meter];
}

/**
 * @param {RunState} run
 * @param {string} endingId
 * @returns {RunState}
 */
function end(run, endingId) {
  return { ...run, queue: [], endingId };
}

/**
 * @param {Meters} meters
 * @param {MeterDelta} delta
 * @returns {Meters}
 */
function applyDelta(meters, delta) {
  const result = { ...meters };
  for (const m of METERS) {
    result[m] = Math.min(METER_MAX, Math.max(0, meters[m] + (delta[m] ?? 0)));
  }
  return result;
}

/**
 * @param {Meters} before
 * @param {Meters} after
 * @returns {MeterDelta}
 */
function diff(before, after) {
  /** @type {MeterDelta} */
  const delta = {};
  for (const m of METERS) if (after[m] !== before[m]) delta[m] = after[m] - before[m];
  return delta;
}
