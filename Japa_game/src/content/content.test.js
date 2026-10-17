// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEngine } from '../game/engine.js';
import { nextRandom } from '../game/rng.js';
import { validateContent } from '../game/validate.js';
import { content } from './index.js';

const engine = createEngine(content);
const MAX_STEPS = 200;

/**
 * Plays a Run to the end by picking random available choices.
 * @param {number} seed
 */
function playout(seed) {
  let run = engine.startRun({ archetypeId: 'fresh-graduate', routeId: 'uk-student', seed });
  let rng = seed;
  let steps = 0;
  while (!run.endingId) {
    if (++steps > MAX_STEPS) throw new Error(`Seed ${seed} did not finish in ${MAX_STEPS} steps`);
    const options = engine.choiceOptions(run).filter((o) => o.available);
    let r;
    [r, rng] = nextRandom(rng);
    run = engine.choose(run, options[Math.floor(r * options.length)].index);
  }
  return run;
}

describe('MVP content', () => {
  it('passes validation', () => {
    assert.deepEqual(validateContent(content), []);
  });

  it('every Run ends with a defined ending', () => {
    for (let seed = 0; seed < 500; seed++) {
      const run = playout(seed);
      assert.ok(run.endingId && run.endingId in content.endings, `seed ${seed} ended with ${run.endingId}`);
    }
  });

  it('is winnable, and losable more than one way', () => {
    const endings = new Set(Array.from({ length: 500 }, (_, seed) => playout(seed).endingId));
    assert.ok(endings.has('settled'), `endings seen: ${[...endings]}`);
    assert.ok(endings.size >= 3, `endings seen: ${[...endings]}`);
  });

  it('is deterministic for a given seed', () => {
    assert.deepEqual(playout(42), playout(42));
  });
});
