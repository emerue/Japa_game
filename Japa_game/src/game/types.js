// @ts-check
// Shared JSDoc types for the game engine and its content. No runtime code.

/** @typedef {'naira' | 'sanity' | 'family' | 'time'} Meter */
/** @typedef {Record<Meter, number>} Meters */
/** @typedef {Partial<Meters>} MeterDelta */

/**
 * @typedef {object} Requirement
 * @property {string[]} [credentials] Credential ids the player must hold.
 * @property {MeterDelta} [meters] Minimum meter values.
 */

/**
 * @typedef {object} Choice
 * @property {string} label
 * @property {string} outcome Text shown after the choice is made.
 * @property {MeterDelta} [effects]
 * @property {string[]} [grants] Credential ids gained.
 * @property {Requirement} [requires]
 * @property {string} [ending] Ending id; choosing this ends the Run.
 * @property {{ refusalOutcome: string }} [visaDecision]
 *   Marks the choice that resolves the visa. `outcome` is the approval text;
 *   `refusalOutcome` is shown when required Credentials are missing.
 */

/**
 * @typedef {object} GameEvent
 * @property {string} id
 * @property {string} title
 * @property {string} text
 * @property {string} [skipIfHeld] Credential id; the Event is skipped when already held.
 * @property {Choice[]} choices
 */

/**
 * @typedef {object} StagePlan
 * @property {string} id
 * @property {string} name
 * @property {string[]} mandatory Event ids always included (unless skipped).
 * @property {string[]} deck Event ids to draw randomly from.
 * @property {number} draw How many deck Events to draw.
 * @property {boolean} [ordered] Keep mandatory Events in listed order instead of shuffling.
 */

/**
 * @typedef {object} Route
 * @property {string} id
 * @property {string} name
 * @property {string} destination
 * @property {string[]} requiredCredentials
 * @property {StagePlan[]} stages
 */

/**
 * @typedef {object} Archetype
 * @property {string} id
 * @property {string} name
 * @property {string} blurb
 * @property {Meters} startingMeters
 */

/**
 * @typedef {object} Ending
 * @property {string} id
 * @property {string} title
 * @property {string} text
 * @property {boolean} won
 */

/**
 * @typedef {object} Content
 * @property {Record<string, Archetype>} archetypes
 * @property {Record<string, Route>} routes
 * @property {Record<string, GameEvent>} events
 * @property {Record<string, { name: string }>} credentials
 * @property {Record<string, Ending>} endings
 */

/**
 * @typedef {object} Outcome
 * @property {string} eventId
 * @property {string} text
 * @property {MeterDelta} delta Actual change applied, after clamping.
 * @property {string[]} granted
 */

/**
 * @typedef {object} RunState
 * @property {string} archetypeId
 * @property {string} routeId
 * @property {Meters} meters
 * @property {string[]} credentials
 * @property {number} stageIndex
 * @property {string[]} queue Remaining Event ids in the current Stage; head is current.
 * @property {number} refusals
 * @property {number} rngState
 * @property {string | null} endingId
 * @property {Outcome | null} lastOutcome
 */

/**
 * @typedef {object} ChoiceOption
 * @property {Choice} choice
 * @property {number} index
 * @property {boolean} available
 * @property {string} [reason] Why the choice is unavailable.
 */

export {};
