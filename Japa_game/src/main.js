// @ts-check
// Browser entry point: owns screen state and renders the engine's RunState.

import { content } from './content/index.js';
import { createEngine, METERS, meterName } from './game/engine.js';
import { h } from './ui/dom.js';

/** @typedef {import('./game/types.js').RunState} RunState */
/** @typedef {import('./game/types.js').MeterDelta} MeterDelta */

const ARCHETYPE_ID = 'fresh-graduate';
const ROUTE_ID = 'uk-student';
const LOW_METER = 25;

const engine = createEngine(content);
const archetype = content.archetypes[ARCHETYPE_ID];
const route = content.routes[ROUTE_ID];

/** @type {{ screen: 'start' } | { screen: 'play', run: RunState, showingOutcome: boolean }} */
let state = { screen: 'start' };

const app = /** @type {HTMLElement} */ (document.getElementById('app'));

/** @param {typeof state} next */
function setState(next) {
  state = next;
  app.replaceChildren(view());
  // Move focus to the new screen's heading so keyboard and screen-reader users follow along.
  /** @type {HTMLElement | null} */ (app.querySelector('h1, h2'))?.focus();
}

function view() {
  if (state.screen === 'start') return startView();
  if (state.run.endingId) return endView(state.run);
  return playView(state.run, state.showingOutcome);
}

function startView() {
  const start = () => {
    const seed = Math.floor(Math.random() * 2 ** 32);
    setState({ screen: 'play', run: engine.startRun({ archetypeId: ARCHETYPE_ID, routeId: ROUTE_ID, seed }), showingOutcome: false });
  };
  return h(
    'main',
    { class: 'screen start' },
    h('p', { class: 'eyebrow' }, 'A game about leaving'),
    h('h1', { tabindex: -1 }, 'JAPA'),
    h('p', { class: 'lede' }, 'Save the money. Survive the paperwork. Pass the visa. Settle in. Keep your sanity and your family on side, and do it before time runs out.'),
    h(
      'section',
      { class: 'card' },
      h('p', { class: 'eyebrow' }, 'You are'),
      h('h2', {}, archetype.name),
      h('p', {}, archetype.blurb),
      h('p', { class: 'route' }, `${route.destination} · ${route.name}`),
    ),
    h('button', { class: 'primary', onclick: start }, 'Start your japa'),
  );
}

/**
 * @param {RunState} run
 * @param {boolean} showingOutcome
 */
function playView(run, showingOutcome) {
  const stage = engine.currentStage(run);
  const giveUp = () => {
    if (confirm('Give up and stay in Lagos?')) setState({ screen: 'play', run: engine.giveUp(run), showingOutcome: false });
  };
  return h(
    'main',
    { class: 'screen play' },
    h(
      'header',
      { class: 'topbar' },
      h('p', { class: 'eyebrow' }, `Stage ${run.stageIndex + 1} of ${route.stages.length} · ${stage.name}`),
      h('button', { class: 'link', onclick: giveUp }, 'Give up'),
    ),
    metersView(run),
    credentialsView(run),
    showingOutcome && run.lastOutcome ? outcomeView(run) : eventView(run),
  );
}

/** @param {RunState} run */
function eventView(run) {
  const event = engine.currentEvent(run);
  if (!event) throw new Error('Playing a Run with no current Event');
  const choose = (/** @type {number} */ index) => setState({ screen: 'play', run: engine.choose(run, index), showingOutcome: true });
  return h(
    'section',
    { class: 'card event' },
    h('h2', { tabindex: -1 }, event.title),
    h('p', {}, event.text),
    h(
      'div',
      { class: 'choices' },
      engine.choiceOptions(run).map(({ choice, index, available, reason }) =>
        h(
          'button',
          { class: 'choice', disabled: !available, onclick: () => choose(index) },
          h('span', {}, choice.label),
          reason ? h('small', {}, reason) : null,
        ),
      ),
    ),
  );
}

/** @param {RunState} run */
function outcomeView(run) {
  const outcome = /** @type {NonNullable<RunState['lastOutcome']>} */ (run.lastOutcome);
  return h(
    'section',
    { class: 'card outcome' },
    h('h2', { tabindex: -1 }, content.events[outcome.eventId].title),
    h('p', {}, outcome.text),
    changesView(outcome.delta, outcome.granted),
    h('button', { class: 'primary', onclick: () => setState({ screen: 'play', run, showingOutcome: false }) }, 'Continue'),
  );
}

/** @param {RunState} run */
function endView(run) {
  const ending = content.endings[/** @type {string} */ (run.endingId)];
  const outcome = run.lastOutcome;
  return h(
    'main',
    { class: `screen end ${ending.won ? 'won' : 'lost'}` },
    outcome
      ? h('section', { class: 'card outcome' }, h('p', {}, outcome.text), changesView(outcome.delta, outcome.granted))
      : null,
    h('p', { class: 'eyebrow' }, ending.won ? 'You won' : 'Run over'),
    h('h1', { tabindex: -1 }, ending.title),
    h('p', { class: 'lede' }, ending.text),
    metersView(run),
    h('button', { class: 'primary', onclick: () => setState({ screen: 'start' }) }, 'Play again'),
  );
}

/** @param {RunState} run */
function metersView(run) {
  return h(
    'section',
    { class: 'meters', 'aria-label': 'Meters' },
    METERS.map((m) => {
      const value = run.meters[m];
      return h(
        'div',
        { class: `meter ${value <= LOW_METER ? 'low' : ''}` },
        h('span', { class: 'meter-label' }, meterName(m)),
        h(
          'div',
          { class: 'bar', role: 'meter', 'aria-label': meterName(m), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': value },
          h('div', { class: 'fill', style: `width: ${value}%` }),
        ),
        h('span', { class: 'meter-value' }, value),
      );
    }),
  );
}

/** @param {RunState} run */
function credentialsView(run) {
  return h(
    'ul',
    { class: 'credentials', 'aria-label': 'Credentials' },
    route.requiredCredentials.map((id) => {
      const held = run.credentials.includes(id);
      return h('li', { class: held ? 'held' : '' }, `${held ? '✓' : '○'} ${content.credentials[id].name}`);
    }),
  );
}

/**
 * @param {MeterDelta} delta
 * @param {string[]} granted
 */
function changesView(delta, granted) {
  const items = [
    ...METERS.filter((m) => delta[m]).map((m) => {
      const d = /** @type {number} */ (delta[m]);
      return h('li', { class: d > 0 ? 'up' : 'down' }, `${d > 0 ? '+' : '−'}${Math.abs(d)} ${meterName(m)}`);
    }),
    ...granted.map((c) => h('li', { class: 'up' }, `✓ ${content.credentials[c].name}`)),
  ];
  return items.length ? h('ul', { class: 'changes' }, items) : null;
}

setState(state);
