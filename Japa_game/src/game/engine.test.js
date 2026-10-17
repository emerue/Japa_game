// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEngine, MAX_REFUSALS, REFUSAL_COST, TIME_PER_EVENT } from './engine.js';

/** @typedef {import('./types.js').Content} Content */

/** A small, fully predictable world: every stage has exactly one Event. */
function fixture() {
  /** @type {Content} */
  const content = {
    archetypes: {
      tester: { id: 'tester', name: 'Tester', blurb: '', startingMeters: { naira: 50, sanity: 50, family: 50, time: 100 } },
    },
    routes: {
      r: {
        id: 'r',
        name: 'Route',
        destination: 'Testland',
        requiredCredentials: ['doc', 'stamp'],
        stages: [
          { id: 'prep', name: 'Prep', mandatory: ['get-doc', 'get-stamp'], deck: [], draw: 0, ordered: true },
          { id: 'visa', name: 'Visa', mandatory: ['decision'], deck: [], draw: 0 },
          { id: 'go', name: 'Go', mandatory: ['leave'], deck: [], draw: 0 },
        ],
      },
    },
    events: {
      'get-doc': {
        id: 'get-doc',
        title: 'Doc',
        text: '',
        skipIfHeld: 'doc',
        choices: [
          { label: 'Get it', outcome: 'got', effects: { naira: -10 }, grants: ['doc'] },
          { label: 'Skip', outcome: 'skipped' },
          { label: 'Rich option', outcome: 'rich', requires: { meters: { naira: 90 } } },
          { label: 'Scam', outcome: 'scammed', ending: 'scammed' },
          { label: 'Overspend', outcome: 'oops', effects: { naira: -500 } },
        ],
      },
      'get-stamp': {
        id: 'get-stamp',
        title: 'Stamp',
        text: '',
        skipIfHeld: 'stamp',
        choices: [
          { label: 'Get it', outcome: 'stamped', grants: ['stamp'] },
          { label: 'Skip', outcome: 'skipped' },
        ],
      },
      decision: {
        id: 'decision',
        title: 'Decision',
        text: '',
        choices: [{ label: 'Open', outcome: 'approved', visaDecision: { refusalOutcome: 'Refused.' } }],
      },
      leave: { id: 'leave', title: 'Leave', text: '', choices: [{ label: 'Go', outcome: 'gone' }] },
    },
    credentials: { doc: { name: 'Document' }, stamp: { name: 'Stamp' } },
    endings: Object.fromEntries(
      ['settled', 'gave-up', 'visa-ban', 'broke', 'burnout', 'family-gone', 'out-of-time', 'scammed'].map((id) => [
        id,
        { id, title: id, text: '', won: id === 'settled' },
      ]),
    ),
  };
  const engine = createEngine(content);
  return { engine, run: engine.startRun({ archetypeId: 'tester', routeId: 'r', seed: 1 }) };
}

describe('starting a Run', () => {
  it('uses the archetype meters and opens the first Stage', () => {
    const { engine, run } = fixture();
    assert.deepEqual(run.meters, { naira: 50, sanity: 50, family: 50, time: 100 });
    assert.equal(engine.currentEvent(run)?.id, 'get-doc');
    assert.equal(run.endingId, null);
  });

  it('rejects unknown archetypes and routes', () => {
    const { engine } = fixture();
    assert.throws(() => engine.startRun({ archetypeId: 'nope', routeId: 'r', seed: 1 }));
    assert.throws(() => engine.startRun({ archetypeId: 'tester', routeId: 'nope', seed: 1 }));
  });
});

describe('making a choice', () => {
  it('applies effects, charges Time and grants credentials', () => {
    const { engine, run } = fixture();
    const next = engine.choose(run, 0);
    assert.equal(next.meters.naira, 40);
    assert.equal(next.meters.time, 100 - TIME_PER_EVENT);
    assert.deepEqual(next.credentials, ['doc']);
    assert.deepEqual(next.lastOutcome, {
      eventId: 'get-doc',
      text: 'got',
      delta: { naira: -10, time: -TIME_PER_EVENT },
      granted: ['doc'],
    });
    assert.equal(engine.currentEvent(next)?.id, 'get-stamp');
  });

  it('does not mutate the previous state', () => {
    const { engine, run } = fixture();
    const before = structuredClone(run);
    engine.choose(run, 0);
    assert.deepEqual(run, before);
  });

  it('marks unmet requirements unavailable and refuses them', () => {
    const { engine, run } = fixture();
    const rich = engine.choiceOptions(run)[2];
    assert.equal(rich.available, false);
    assert.equal(rich.reason, 'Needs Naira ≥ 90');
    assert.throws(() => engine.choose(run, 2), /unavailable/);
    assert.throws(() => engine.choose(run, 99), RangeError);
  });

  it('ends the Run when a choice names an ending', () => {
    const { engine, run } = fixture();
    const next = engine.choose(run, 3);
    assert.equal(next.endingId, 'scammed');
    assert.equal(engine.currentEvent(next), null);
    assert.throws(() => engine.choose(next, 0), /ended/);
  });

  it('ends the Run when a meter hits zero, clamping it at zero', () => {
    const { engine, run } = fixture();
    const next = engine.choose(run, 4);
    assert.equal(next.endingId, 'broke');
    assert.equal(next.meters.naira, 0);
  });
});

describe('the visa decision', () => {
  /** @param {ReturnType<typeof fixture>} f @param {number[]} picks */
  const play = ({ engine, run }, picks) => picks.reduce((state, i) => engine.choose(state, i), run);

  it('approves when all required credentials are held', () => {
    const f = fixture();
    const next = play(f, [0, 0, 0]);
    assert.equal(next.lastOutcome?.text, 'approved');
    assert.equal(f.engine.currentStage(next).id, 'go');
  });

  it('refuses when credentials are missing, charges the refusal and returns to the previous Stage', () => {
    const f = fixture();
    const atDecision = play(f, [1, 1]);
    const next = f.engine.choose(atDecision, 0);
    assert.equal(next.refusals, 1);
    assert.equal(next.lastOutcome?.text, 'Refused. Missing: Document, Stamp.');
    assert.equal(next.meters.sanity, atDecision.meters.sanity + (REFUSAL_COST.sanity ?? 0));
    assert.equal(f.engine.currentStage(next).id, 'prep');
  });

  it('skips Events for credentials already held when a Stage is replayed', () => {
    const refused = play(fixture(), [0, 1, 0]);
    assert.deepEqual(refused.queue, ['get-stamp']);
  });

  it(`ends the Run on refusal number ${MAX_REFUSALS}`, () => {
    const picks = Array.from({ length: MAX_REFUSALS }, () => [1, 1, 0]).flat();
    assert.equal(play(fixture(), picks).endingId, 'visa-ban');
  });
});

describe('finishing a Run', () => {
  it('settles the player after the last Stage', () => {
    const { engine, run } = fixture();
    const done = [0, 0, 0, 0].reduce((state, i) => engine.choose(state, i), run);
    assert.equal(done.endingId, 'settled');
  });

  it('lets the player give up at any point, but not after the end', () => {
    const { engine, run } = fixture();
    const quit = engine.giveUp(run);
    assert.equal(quit.endingId, 'gave-up');
    assert.throws(() => engine.giveUp(quit));
  });
});
