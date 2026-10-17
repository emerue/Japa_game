// @ts-check
// The JAPA interface on top of the World: top bar, quest strip, joystick and
// action button, speech bubbles, the choice panel, the phone, stamps,
// floating changes and the JAPA Receipt. Plain DOM, no framework.
import { naira, clockLabel } from '../sim/engine.js';

/** @typedef {import('../sim/types.js').Choice} Choice */
/** @typedef {import('../sim/types.js').ResourceDelta} ResourceDelta */
/** @typedef {{ x: number, y: number } | null} ScreenPoint */

const ICONS = { Talk: '💬', Inspect: '🔍', Read: '📱', Use: '✋', Enter: '🚪', Buy: '₦', 'Pick Up': '✋' };

/**
 * @param {string} tag
 * @param {string} [cls]
 * @param {string} [html]
 */
function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

/**
 * The cost tags on a Choice: money first, then the biggest other change, then time.
 * @param {Choice} c
 * @returns {{ text: string, kind: 'cost' | 'gain' | 'time' }[]}
 */
export function choiceTags(c) {
  /** @type {{ text: string, kind: 'cost' | 'gain' | 'time' }[]} */
  const tags = [];
  const d = c.delta ?? {};
  if (d.funds) tags.push({ text: `${d.funds > 0 ? '+' : ''}${naira(d.funds)}`, kind: d.funds < 0 ? 'cost' : 'gain' });
  if (d.homeTies) tags.push({ text: `${d.homeTies < 0 ? '−' : '+'}Home ties`, kind: d.homeTies < 0 ? 'cost' : 'gain' });
  if (d.energy && d.energy < 0) tags.push({ text: `−${-d.energy} ⚡`, kind: 'cost' });
  if (d.riskSense && d.riskSense > 0 && tags.length === 0) tags.push({ text: '+Risk sense', kind: 'gain' });
  if ((c.minutes ?? 0) >= 60) tags.push({ text: `${c.minutes / 60} HR${c.minutes > 60 ? 'S' : ''}`, kind: 'time' });
  return tags.slice(0, 2);
}

/** @param {ResourceDelta} d */
function deltaChips(d) {
  /** @type {{ text: string, kind: string }[]} */
  const out = [];
  if (d.funds) out.push({ text: `${d.funds > 0 ? '+' : ''}${naira(d.funds)}`, kind: d.funds < 0 ? 'cost' : 'gain' });
  if (d.energy) out.push({ text: `${d.energy > 0 ? '+' : '−'}${Math.abs(d.energy)} ⚡`, kind: d.energy < 0 ? 'cost' : 'gain' });
  if (d.homeTies) out.push({ text: `${d.homeTies > 0 ? '+' : '−'}Home ties`, kind: d.homeTies < 0 ? 'cost' : 'gain' });
  if (d.riskSense) out.push({ text: `+${d.riskSense} Risk sense`, kind: 'gain' });
  if (d.readiness) out.push({ text: `+${d.readiness} Readiness`, kind: 'gain' });
  return out;
}

export function createHud() {
  const root = el('div');
  root.id = 'hud';
  document.body.appendChild(root);

  const top = el('div', 'topbar');
  const money = el('div', 'sticker money');
  const energy = el('div', 'sticker');
  const time = el('div', 'sticker time');
  top.append(money, energy, time);
  const quest = el('div', 'quest');
  const flags = el('div', 'sticker flags');
  flags.style.display = 'none';
  const joy = el('div', 'joy', '<div class="knob"></div>');
  const act = el('div', 'act hidden');
  act.dataset.ui = '';
  const layer = el('div'); // bubbles, floats
  const fader = el('div', 'fade');
  root.append(top, quest, flags, joy, act, layer, fader);

  /** @type {(() => void) | null} */
  let onAct = null;
  act.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!act.classList.contains('hidden')) onAct?.(); });

  /** @type {{ bubble: HTMLElement, anchor: () => ScreenPoint, until: number }[]} */
  const bubbles = [];
  /** @type {HTMLElement | null} */
  let panel = null;
  let lastFunds = -1;
  let lastQuest = '';

  return {
    joy,
    knob: /** @type {HTMLElement} */ (joy.querySelector('.knob')),

    /** @param {{ funds: number, energy: number, clock: number }} s */
    setStats(s) {
      if (lastFunds >= 0 && s.funds !== lastFunds) { money.classList.remove('bump'); void money.offsetWidth; money.classList.add('bump'); }
      lastFunds = s.funds;
      money.textContent = naira(s.funds);
      energy.textContent = `⚡ ${s.energy}`;
      time.textContent = clockLabel(s.clock);
    },

    /** @param {{ title: string, hint: string } | null} q */
    setQuest(q) {
      quest.style.opacity = q ? '1' : '0';
      if (!q) return;
      quest.innerHTML = `<b>${esc(q.title)}</b>${esc(q.hint)}`;
      if (q.title !== lastQuest) { quest.classList.remove('new'); void quest.offsetWidth; quest.classList.add('new'); }
      lastQuest = q.title;
    },

    /** @param {number | null} spotted @param {number} total */
    setRedFlags(spotted, total) {
      flags.style.display = spotted === null ? 'none' : '';
      flags.textContent = `🚩 RED FLAGS ${spotted}/${total}`;
    },

    /** @param {{ verb: string, label: string } | null} target @param {() => void} handler */
    setAction(target, handler) {
      onAct = handler;
      act.classList.toggle('hidden', !target);
      if (target) {
        const icon = ICONS[/** @type {keyof typeof ICONS} */ (target.verb)] ?? '✋';
        act.innerHTML = `<div class="who">${esc(target.label)}</div><div><span>${icon}</span>${esc(target.verb.toUpperCase())}</div>`;
      }
    },

    /** @param {boolean} on */
    setMoving(on) {
      joy.classList.toggle('hidden', !on);
    },

    /**
     * A speech bubble that follows a person until it times out or the next one.
     * @param {string} text
     * @param {() => ScreenPoint} anchor
     * @param {number} [ms]
     */
    say(text, anchor, ms = 3800) {
      for (const b of bubbles.splice(0)) b.bubble.remove();
      const bubble = el('div', 'bubble', esc(text));
      layer.appendChild(bubble);
      bubbles.push({ bubble, anchor, until: performance.now() + ms });
    },

    clearBubbles() {
      for (const b of bubbles.splice(0)) b.bubble.remove();
    },

    /** Keeps bubbles on their speaker and on screen; call every frame. */
    track() {
      const now = performance.now();
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const p = b.anchor();
        if (now > b.until || !p) { b.bubble.remove(); bubbles.splice(i, 1); continue; }
        const half = b.bubble.offsetWidth / 2;
        const x = Math.min(Math.max(p.x, 16 + half), innerWidth - 16 - half);
        b.bubble.style.left = `${x}px`;
        b.bubble.style.top = `${Math.max(p.y, b.bubble.offsetHeight + 120)}px`;
        b.bubble.style.setProperty('--tail', `${50 + ((p.x - x) / (2 * half)) * 100}%`);
      }
    },

    /** @param {string} text @param {string} [title] @param {number} [ms] */
    caption(text, title, ms = 2600) {
      const c = el('div', 'caption', `${title ? `<b>${esc(title)}</b>` : ''}${esc(text)}`);
      layer.appendChild(c);
      setTimeout(() => c.remove(), ms);
    },

    /** @param {string} text @param {boolean} [good] */
    stamp(text, good = false) {
      const s = el('div', `stamp${good ? ' good' : ''}`, esc(text));
      layer.appendChild(s);
      navigator.vibrate?.(40);
      setTimeout(() => s.remove(), 1300);
    },

    /** @param {ResourceDelta} delta @param {ScreenPoint} at */
    floatDeltas(delta, at) {
      if (!at) return;
      deltaChips(delta).forEach((chip, i) => {
        const f = el('div', `float ${chip.kind}`, esc(chip.text));
        f.style.left = `${at.x}px`;
        f.style.top = `${at.y - i * 34}px`;
        f.style.animationDelay = `${i * 0.15}s`;
        layer.appendChild(f);
        setTimeout(() => f.remove(), 2200);
      });
    },

    /**
     * The choice panel. Unavailable choices stay visible with the reason.
     * @param {{ speaker: string, choices: { choice: Choice, available: boolean, reason: string | null }[] }} ev
     * @param {(index: number) => void} onChoose
     */
    showChoices(ev, onChoose) {
      panel?.remove();
      panel = el('div', 'sheet');
      panel.dataset.ui = '';
      panel.appendChild(el('span', 'sticker who', esc(ev.speaker.toUpperCase())));
      ev.choices.forEach((opt, i) => {
        const tags = choiceTags(opt.choice).map((t) => `<span class="tag ${t.kind}">${esc(t.text)}</span>`).join('');
        const row = el('div', `choice${opt.available ? '' : ' off'}`,
          `<span>${esc(opt.choice.label)}${opt.available ? '' : `<span class="why">${esc(opt.reason ?? '')}</span>`}</span><span class="tags">${tags}</span>`);
        row.dataset.k = 'ABCD'[i];
        if (opt.available) row.addEventListener('click', () => onChoose(i));
        panel?.appendChild(row);
      });
      root.appendChild(panel);
    },

    /**
     * The phone, for messages and voice notes. Tap play to hear (read) the note.
     * @param {{ title: string, messages: { from: string, text?: string, voice?: string, secs?: number }[] }} chat
     */
    showPhone(chat) {
      const phone = el('div', 'phone');
      phone.dataset.ui = '';
      const screen = el('div', 'screen', `<div class="head"><span>${esc(chat.title)}</span><span>▮▮▮ 4G</span></div>`);
      for (const m of chat.messages) {
        if (m.text) { screen.appendChild(el('div', 'msg', `<small>${esc(m.from)}</small>${esc(m.text)}`)); continue; }
        const bars = Array.from({ length: 26 }, (_, i) => `<i style="height:${6 + ((i * 37) % 19)}px"></i>`).join('');
        const vn = el('div', 'msg', `<small>${esc(m.from)}</small><div class="vn"><div class="play">▶</div><div class="wave">${bars}</div><b>0:${String(m.secs ?? 14).padStart(2, '0')}</b></div><div class="transcript"></div>`);
        const wave = /** @type {HTMLElement} */ (vn.querySelector('.wave'));
        const out = /** @type {HTMLElement} */ (vn.querySelector('.transcript'));
        /** @type {HTMLElement} */ (vn.querySelector('.play')).addEventListener('click', () => {
          if (wave.classList.contains('playing')) return;
          wave.classList.add('playing');
          const words = (m.voice ?? '').split(' ');
          let n = 0;
          const t = setInterval(() => {
            out.textContent = `“${words.slice(0, ++n).join(' ')}${n < words.length ? '' : '”'}`;
            if (n >= words.length) { clearInterval(t); wave.classList.remove('playing'); }
          }, 110);
        });
        screen.appendChild(vn);
      }
      screen.appendChild(el('div', 'crack'));
      phone.appendChild(screen);
      root.appendChild(phone);
      return {
        close: () => phone.remove(),
        play: () => /** @type {HTMLElement | null} */ (phone.querySelector('.play'))?.click(),
      };
    },

    hideChoices() {
      panel?.remove();
      panel = null;
    },

    /** @param {boolean} on */
    fade(on) {
      fader.classList.toggle('on', on);
      return new Promise((r) => setTimeout(r, 380));
    },

    /**
     * @param {{ stamp: string, good: boolean, lesson: string, rows: [string, string][], items: [string, string][], code: string }} r
     * @param {{ onShare: () => void, onRetry: () => void }} handlers
     */
    showReceipt(r, handlers) {
      const wrap = el('div');
      wrap.dataset.ui = '';
      const row = (/** @type {[string, string]} */ [a, b], big = false) => `<div class="row${big ? ' big' : ''}"><span>${esc(a)}</span><span>${esc(b)}</span></div>`;
      wrap.append(el('div', 'dim'), el('div', 'receipt', `
        <div class="logo">JAPA</div><div class="bar stripes"></div>
        ${r.rows.map((x) => row(x)).join('')}<hr>
        ${r.items.map((x) => row(x, true)).join('')}<hr>
        <div class="lesson">LESSON: ${esc(r.lesson)}</div>
        <div style="margin-top:8px;text-align:center">CAN YOU DO BETTER?<br>PLAY JAPA · CODE ${esc(r.code)}</div>
        <div class="rstamp${r.good ? ' good' : ''}">${esc(r.stamp)}</div>`));
      const actions = el('div', 'actions', '<div class="btn">SHARE RECEIPT</div><div class="btn alt">TRY AGAIN</div>');
      const [share, retry] = actions.children;
      share.addEventListener('click', handlers.onShare);
      retry.addEventListener('click', handlers.onRetry);
      wrap.appendChild(actions);
      root.appendChild(wrap);
      return () => wrap.remove();
    },

    /** @param {string} text */
    loading(text) {
      const l = el('div', 'loading', `<div>JAPA<div class="bar stripes"></div><p>${esc(text)}</p></div>`);
      root.appendChild(l);
      return () => l.remove();
    },
  };
}
