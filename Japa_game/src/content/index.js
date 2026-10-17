// @ts-check
// All game content for the MVP: one Archetype, one Route (UK Student Visa).

import { departureEvents, hustleEvents, paperworkEvents, settlingEvents, visaEvents } from './events.js';

/** @typedef {import('../game/types.js').Content} Content */
/** @typedef {import('../game/types.js').GameEvent} GameEvent */

/** @param {GameEvent[]} events */
const ids = (events) => events.map((e) => e.id);

/** @type {Content} */
export const content = {
  archetypes: {
    'fresh-graduate': {
      id: 'fresh-graduate',
      name: 'Fresh Graduate',
      blurb: 'Second Class Upper in Microbiology, NYSC done, two years of "we will get back to you".',
      startingMeters: { naira: 35, sanity: 70, family: 60, time: 100 },
    },
  },

  routes: {
    'uk-student': {
      id: 'uk-student',
      name: 'Student Visa',
      destination: 'United Kingdom',
      requiredCredentials: ['passport', 'english', 'cas', 'tb-test', 'funds'],
      stages: [
        { id: 'hustle', name: 'Hustle', mandatory: [], deck: ids(hustleEvents), draw: 3 },
        {
          id: 'paperwork',
          name: 'Paperwork',
          mandatory: ['pw-passport', 'pw-english', 'pw-cas', 'pw-tb-test', 'pw-funds'],
          deck: ['pw-agent', 'pw-appointment', 'pw-reference'],
          draw: 1,
        },
        { id: 'visa', name: 'Visa Interview', mandatory: ['visa-interview', 'visa-decision'], deck: [], draw: 0, ordered: true },
        { id: 'departure', name: 'Departure', mandatory: [], deck: ids(departureEvents), draw: 2 },
        { id: 'settling', name: 'Settling In', mandatory: [], deck: ids(settlingEvents), draw: 3 },
      ],
    },
  },

  events: Object.fromEntries(
    [...hustleEvents, ...paperworkEvents, ...visaEvents, ...departureEvents, ...settlingEvents].map((e) => [e.id, e]),
  ),

  credentials: {
    passport: { name: 'Passport' },
    english: { name: 'English proficiency' },
    cas: { name: 'CAS' },
    'tb-test': { name: 'TB test' },
    funds: { name: 'Proof of funds' },
  },

  endings: {
    settled: { id: 'settled', title: 'You Made It', text: 'First term done, first winter survived. You have japa-ed. Your mother tells everyone at church.', won: true },
    'gave-up': { id: 'gave-up', title: 'Staying in Lagos', text: 'You decided Lagos is home after all. The traffic welcomes you back like an old friend.', won: false },
    broke: { id: 'broke', title: 'Broke', text: 'The money ran out before the dream did.', won: false },
    burnout: { id: 'burnout', title: 'Burnout', text: 'You could not take one more form, queue or "please hold". You need to rest.', won: false },
    'family-gone': { id: 'family-gone', title: 'On Your Own', text: 'Nobody is picking up your calls. Without your family behind you, the plan collapses.', won: false },
    'out-of-time': { id: 'out-of-time', title: 'Out of Time', text: 'The intake deadline passed. Your offer letter is now a souvenir.', won: false },
    'visa-ban': { id: 'visa-ban', title: 'Refused Again', text: 'A second refusal. Your immigration history is now a thick file, and you need to rethink your plans.', won: false },
    scammed: { id: 'scammed', title: 'Scammed', text: 'The agent is gone and so is your money. You tell no one, out of shame.', won: false },
    'deception-ban': { id: 'deception-ban', title: 'Banned for Deception', text: 'Using false documents earned you a ten-year ban from the UK.', won: false },
  },
};
