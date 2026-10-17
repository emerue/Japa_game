// @ts-check
// Checks content against the rules the engine relies on. Returns a list of problems.

import { ENGINE_ENDINGS, LOSS_ENDING_BY_METER, METERS } from './engine.js';

/** @typedef {import('./types.js').Content} Content */

/**
 * @param {Content} content
 * @returns {string[]}
 */
export function validateContent(content) {
  /** @type {string[]} */
  const problems = [];
  const hasEnding = (/** @type {string} */ id) => id in content.endings;
  const hasCredential = (/** @type {string} */ id) => id in content.credentials;

  for (const id of [...Object.values(ENGINE_ENDINGS), ...Object.values(LOSS_ENDING_BY_METER)]) {
    if (!hasEnding(id)) problems.push(`Engine ending "${id}" is not defined`);
  }

  for (const archetype of Object.values(content.archetypes)) {
    for (const m of METERS) {
      const v = archetype.startingMeters[m];
      if (!(v > 0 && v <= 100)) problems.push(`Archetype "${archetype.id}" starts with ${m}=${v}`);
    }
  }

  for (const event of Object.values(content.events)) {
    const where = `Event "${event.id}"`;
    if (event.choices.length === 0) problems.push(`${where} has no choices`);
    // A player must never be stuck on an Event.
    if (!event.choices.some((c) => !c.requires)) problems.push(`${where} has no always-available choice`);
    if (event.skipIfHeld && !hasCredential(event.skipIfHeld)) problems.push(`${where} skips on unknown credential`);
    for (const choice of event.choices) {
      if (choice.ending && !hasEnding(choice.ending)) problems.push(`${where} uses unknown ending "${choice.ending}"`);
      for (const c of [...(choice.grants ?? []), ...(choice.requires?.credentials ?? [])]) {
        if (!hasCredential(c)) problems.push(`${where} references unknown credential "${c}"`);
      }
    }
  }

  for (const route of Object.values(content.routes)) {
    const where = `Route "${route.id}"`;
    /** @type {Set<string>} */
    const grantable = new Set();
    let hasDecision = false;
    for (const stage of route.stages) {
      if (stage.draw > stage.deck.length) problems.push(`${where} stage "${stage.id}" draws more than its deck`);
      for (const id of [...stage.mandatory, ...stage.deck]) {
        const event = content.events[id];
        if (!event) {
          problems.push(`${where} stage "${stage.id}" references unknown event "${id}"`);
          continue;
        }
        const isDecision = event.choices.some((c) => c.visaDecision);
        if (isDecision) hasDecision = true;
        // Credentials only count if they can be earned before the decision, from Events that always appear.
        if (!hasDecision && stage.mandatory.includes(id)) event.choices.forEach((c) => c.grants?.forEach((g) => grantable.add(g)));
      }
    }
    if (!hasDecision) problems.push(`${where} has no visa decision`);
    for (const c of route.requiredCredentials) {
      if (!hasCredential(c)) problems.push(`${where} requires unknown credential "${c}"`);
      else if (!grantable.has(c)) problems.push(`${where} requires "${c}" but no mandatory Event before the decision grants it`);
    }
  }

  return problems;
}
