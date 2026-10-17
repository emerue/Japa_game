// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSim, naira, clockLabel } from './engine.js';
import { sliceContent } from '../content/slice.js';

/** @typedef {import('./types.js').Action} Action */
/** @typedef {import('./types.js').RunState} RunState */

const sim = createSim(sliceContent);
const start = () => sim.startRun({ seed: 42, backgroundId: 'fresh-graduate' });
/** @param {string} id @returns {Action} */
const use = (id) => ({ type: 'interact', id });
/** @param {number} index @returns {Action} */
const pick = (index) => ({ type: 'choose', index });
/** @param {RunState} run @param {Action[]} actions */
const play = (run, actions) => actions.reduce((r, a) => sim.applyAction(r, a), run);

test('a Fresh Graduate starts Monday 6:43 with ₦48,500 and two quests', () => {
  const run = start();
  assert.equal(naira(run.resources.funds), '₦48,500');
  assert.equal(clockLabel(run.clock), 'MON 6:43AM');
  assert.equal(sim.currentQuest(run)?.id, 'morning');
  assert.deepEqual(run.quests, { morning: 'active', 'rent-due': 'active' });
});

test('reading the phone plays the voice note and starts the agent quest', () => {
  let run = play(start(), [use('room-phone')]);
  assert.equal(run.openEvent, 'voice-note');
  assert.deepEqual(sim.availableInteractables(run), [], 'nothing else while an Event is open');
  run = play(run, [pick(0)]);
  assert.ok(run.flags.includes('know_agent'));
  assert.equal(run.quests.morning, 'done');
  assert.equal(sim.currentQuest(run)?.id, 'rent-due');
  assert.ok(!sim.availableInteractables(run).includes('room-phone'), 'the phone is used up');
});

test('Dr. Bayo only appears once you know about him', () => {
  assert.ok(!sim.availableInteractables(start()).includes('dr-bayo'));
  const run = play(start(), [use('room-phone'), pick(0)]);
  assert.ok(sim.availableInteractables(run).includes('dr-bayo'));
});

test('paying part of the rent leaves too little for the deposit, and says why', () => {
  const run = play(start(), [use('room-phone'), pick(0), use('landlord'), pick(0), use('dr-bayo')]);
  assert.equal(naira(run.resources.funds), '₦8,500');
  const [deposit, ask, walk] = sim.choices(run);
  assert.equal(deposit.available, false);
  assert.equal(deposit.reason, 'You have ₦8,500');
  assert.ok(ask.available && walk.available);
});

test('begging the landlord then paying the agent ends SCAMMED, on the receipt', () => {
  const run = play(start(), [use('room-phone'), pick(0), use('landlord'), pick(1), use('dr-bayo'), pick(0)]);
  assert.equal(run.endingId, 'scammed');
  assert.equal(sim.ending(run)?.stamp, 'SCAMMED');
  assert.equal(naira(run.resources.funds), '₦28,500');
  assert.deepEqual(run.receipt.map((l) => l.text), ['RENT: BEGGED FOR 2 WEEKS', '"GUARANTEED" UK VISA DEPOSIT']);
  assert.throws(() => sim.applyAction(run, use('room-wallet')), /already ended/);
});

test('you can only expose the agent after checking him online', () => {
  const base = [use('room-phone'), pick(0), use('dr-bayo'), pick(1)];
  const unchecked = play(start(), base);
  assert.equal(sim.choices(unchecked)[1].available, false);
  const checked = play(start(), [use('room-phone'), pick(0), use('oga-femi'), pick(0), use('dr-bayo'), pick(1), pick(1)]);
  assert.equal(checked.endingId, 'exposed');
  assert.equal(checked.feedback?.say, 'He switches off the fan. "Who send you?"');
});

test('red flags count once each and raise Risk sense', () => {
  let run = play(start(), [use('room-phone'), pick(0), use('flag-banner'), use('flag-certificate')]);
  assert.equal(sim.redFlagsSpotted(run), 2);
  assert.equal(run.feedback?.stamp, 'RED FLAG');
  assert.equal(run.resources.riskSense, 30);
  assert.throws(() => sim.applyAction(run, use('flag-banner')), /Not available/);
  run = play(run, [use('flag-payment')]);
  assert.equal(sim.redFlagsSpotted(run), 3);
});

test('time moves only with actions', () => {
  const run = play(start(), [use('room-wallet'), use('oga-femi'), pick(1)]);
  assert.equal(clockLabel(run.clock), 'MON 8:43AM');
  assert.equal(run.resources.energy, 57);
});

test('replay rebuilds the same run, and rejects impossible actions', () => {
  const actions = [use('room-phone'), pick(1), use('mama-chidi-warn'), pick(0), use('landlord'), pick(2), use('dr-bayo'), pick(2)];
  const direct = play(start(), actions);
  const { run, valid } = sim.replay({ seed: 42, backgroundId: 'fresh-graduate', actions });
  assert.ok(valid);
  assert.deepEqual(run, direct);
  const bad = sim.replay({ seed: 42, backgroundId: 'fresh-graduate', actions: [use('dr-bayo')] });
  assert.equal(bad.valid, false);
  assert.match(String(bad.error), /Action 0: Not available: dr-bayo/);
});

test('content is consistent: every reference exists and every Event has 2–4 Choices', () => {
  const { events, interactables, endings, quests } = sliceContent;
  const effects = [...Object.values(interactables), ...Object.values(events).flatMap((e) => e.choices)];
  for (const e of effects) {
    if (e.event) assert.ok(events[e.event], `missing event ${e.event}`);
    if (e.ending) assert.ok(endings[e.ending], `missing ending ${e.ending}`);
    for (const q of [e.startQuest, e.completeQuest]) if (q) assert.ok(quests[q], `missing quest ${q}`);
  }
  for (const ev of Object.values(events)) {
    assert.ok(ev.choices.length >= 2 && ev.choices.length <= 4, `${ev.id} has ${ev.choices.length} choices`);
  }
});

test('every Ending is reachable through normal play', () => {
  const reached = new Set();
  const seen = new Set();
  /** @type {RunState[]} */
  let frontier = [start()];
  for (let depth = 0; depth < 30 && frontier.length; depth++) {
    /** @type {RunState[]} */
    const next = [];
    for (const run of frontier) {
      if (run.endingId) { reached.add(run.endingId); continue; }
      const key = JSON.stringify([run.flags, run.used, run.quests, run.openEvent, run.resources.funds]);
      if (seen.has(key)) continue;
      seen.add(key);
      /** @type {Action[]} */
      const actions = run.openEvent
        ? sim.choices(run).filter((c) => c.available).map((c) => pick(c.index))
        : sim.availableInteractables(run).map(use);
      for (const a of actions) next.push(sim.applyAction(run, a));
    }
    frontier = next;
  }
  assert.deepEqual([...reached].sort(), Object.keys(sliceContent.endings).sort());
});
