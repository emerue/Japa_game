// @ts-check
// Shared JSDoc types for the world simulation (PRD §0, tech spec "Engine contract").
// No runtime code.

/** @typedef {'funds' | 'energy' | 'readiness' | 'homeTies' | 'riskSense'} Resource */
/** Funds are integer kobo; the other Resources are 0–100. */
/** @typedef {Record<Resource, number>} Resources */
/** @typedef {Partial<Resources>} ResourceDelta */

/**
 * @typedef {object} Requirement
 * @property {number} [funds] Minimum Funds in kobo.
 * @property {string[]} [flags] Flags that must be set.
 * @property {string[]} [notFlags] Flags that must not be set.
 */

/**
 * What happens when a Choice is picked or an Interactable is used.
 * @typedef {object} Effect
 * @property {ResourceDelta} [delta]
 * @property {number} [minutes] In-game time it takes.
 * @property {string[]} [setFlags]
 * @property {string} [startQuest]
 * @property {string} [completeQuest]
 * @property {string} [event] Opens this Event next.
 * @property {string} [ending] Ends the Run with this Ending.
 * @property {string} [say] Line shown after the action (speech or caption).
 * @property {string} [stamp] A stamp shown in the world, e.g. "RED FLAG".
 * @property {ReceiptLine} [receipt] A line added to the JAPA Receipt.
 */

/**
 * @typedef {object} ReceiptLine
 * @property {string} text
 * @property {number} [kobo] Money moved, negative when spent.
 */

/**
 * @typedef {Effect & { label: string, requires?: Requirement }} Choice
 */

/**
 * A situation the player responds to, opened by a place, NPC, object or the phone.
 * @typedef {object} GameEvent
 * @property {string} id
 * @property {string} speaker Who is talking (shown on the name tag).
 * @property {string} line What they say.
 * @property {Choice[]} choices Two to four Choices.
 */

/**
 * A person, door, object or service in the World the player can act on.
 * @typedef {Effect & {
 *   id: string,
 *   label: string,
 *   verb: 'Talk' | 'Inspect' | 'Use' | 'Enter' | 'Buy' | 'Pick Up' | 'Read',
 *   requires?: Requirement,
 *   once?: boolean,
 * }} Interactable
 */

/**
 * @typedef {object} Ending
 * @property {string} id
 * @property {string} stamp The rubber stamp on the JAPA Receipt.
 * @property {string} lesson One line, in the player's language.
 */

/**
 * @typedef {object} Quest
 * @property {string} id
 * @property {string} title
 * @property {string} hint What to do next, shown in the quest strip.
 */

/**
 * @typedef {object} Background
 * @property {string} id
 * @property {string} name
 * @property {Resources} resources
 * @property {number} clock Starting time, minutes since Monday 00:00.
 * @property {string[]} [quests] Quests active from the start.
 */

/**
 * @typedef {object} Content
 * @property {string} version
 * @property {Record<string, Background>} backgrounds
 * @property {Record<string, Interactable>} interactables
 * @property {Record<string, GameEvent>} events
 * @property {Record<string, Quest>} quests
 * @property {Record<string, Ending>} endings
 * @property {string[]} redFlags Flag ids that count as spotted red flags.
 */

/**
 * @typedef {{ type: 'interact', id: string } | { type: 'choose', index: number }} Action
 */

/**
 * @typedef {object} Feedback What the last action did, for the world and the UI to show.
 * @property {ResourceDelta} delta
 * @property {string} [say]
 * @property {string} [stamp]
 * @property {number} minutes
 */

/**
 * @typedef {object} RunState
 * @property {string} contentVersion
 * @property {number} seed
 * @property {number} rng
 * @property {string} backgroundId
 * @property {Resources} resources
 * @property {number} clock Minutes since Monday 00:00.
 * @property {string[]} flags
 * @property {string[]} used Interactables already used (for `once`).
 * @property {Record<string, 'active' | 'done'>} quests
 * @property {string | null} openEvent The Event waiting for a Choice.
 * @property {ReceiptLine[]} receipt
 * @property {string | null} endingId
 * @property {Feedback | null} feedback
 * @property {number} step Number of actions applied.
 */

export {};
