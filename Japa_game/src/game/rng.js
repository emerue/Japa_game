// @ts-check
// Seeded RNG (mulberry32). State is a plain uint32 so a Run can store and replay it.

/**
 * @param {number} state
 * @returns {[number, number]} [value in [0, 1), next state]
 */
export function nextRandom(state) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/**
 * Fisher–Yates shuffle that does not mutate its input.
 * @template T
 * @param {readonly T[]} items
 * @param {number} state
 * @returns {[T[], number]}
 */
export function shuffle(items, state) {
  const result = [...items];
  let rng = state;
  for (let i = result.length - 1; i > 0; i--) {
    let r;
    [r, rng] = nextRandom(rng);
    const j = Math.floor(r * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return [result, rng];
}
