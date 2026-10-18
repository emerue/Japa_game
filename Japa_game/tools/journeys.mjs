// Prints visitor journeys from the tracking log (see src/track.js).
// Usage: node tools/journeys.mjs [days] < japa-track.log   (tools/journeys.sh fetches the log)
// Each log line, from nginx: time \t ip \t query string \t user agent
import { readFileSync } from 'node:fs';

const days = Number(process.argv[2] ?? 7);
const since = Date.now() - days * 86400e3;
const lines = readFileSync(0, 'utf8').split('\n').filter(Boolean);

/** @type {Map<string, { ip: string, ua: string, sessions: Map<string, { at: Date, steps: Record<string, string>[] }> }>} */
const visitors = new Map();
for (const line of lines) {
  const [time, ip, args, ua = ''] = line.split('\t');
  const at = new Date(time);
  if (!(at.getTime() >= since)) continue;
  const q = Object.fromEntries(new URLSearchParams(args));
  if (!q.v || !q.s || !q.e) continue;
  if (!visitors.has(q.v)) visitors.set(q.v, { ip, ua, sessions: new Map() });
  const v = /** @type {NonNullable<ReturnType<typeof visitors.get>>} */ (visitors.get(q.v));
  if (!v.sessions.has(q.s)) v.sessions.set(q.s, { at, steps: [] });
  v.sessions.get(q.s)?.steps.push(q);
}

const device = (/** @type {string} */ ua) => {
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'other';
  const app = /FBAN|FBAV|Instagram/.test(ua) ? 'Facebook/IG app' : /WhatsApp/.test(ua) ? 'WhatsApp' : /SamsungBrowser/.test(ua) ? 'Samsung' : /OPR|Opera/.test(ua) ? 'Opera' : /Edg/.test(ua) ? 'Edge' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'browser';
  return `${os} ${app}`;
};
const secs = (/** @type {string} */ t) => { const n = Number(t); return n < 60 ? `${n}s` : `${Math.floor(n / 60)}m${String(n % 60).padStart(2, '0')}s`; };
const step = (/** @type {Record<string, string>} */ q) => {
  switch (q.e) {
    case 'visit': return `arrived (${q.run}, ${q.view}${q.from ? `, from ${q.from}` : ''}, ${q.screen})`;
    case 'interact': return `talk/use ${q.id}`;
    case 'choose': return `chose #${Number(q.option) + 1} on ${q.event}`;
    case 'scene': return `went to ${q.to}`;
    case 'place': return `walked to ${q.name}`;
    case 'ending': return `ENDING ${q.stamp} (${q.flags} red flags)`;
    case 'feedback': return `feedback ${q.vibe}`;
    case 'leave': return `left after ${secs(q.t)}`;
    default: return q.e;
  }
};
const when = (/** @type {Date} */ d) => d.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// funnel: how many sessions reached each step
const all = [...visitors.values()].flatMap((v) => [...v.sessions.values()]);
const reached = (/** @type {(q: Record<string, string>) => boolean} */ test) => all.filter((s) => s.steps.some(test)).length;
console.log(`Last ${days} day(s): ${visitors.size} visitors, ${all.length} visits (times are Lagos time)\n`);
console.log('Funnel (visits that got this far):');
for (const [label, test] of /** @type {[string, (q: Record<string, string>) => boolean][]} */ ([
  ['opened the game', (q) => q.e === 'visit'],
  ['pressed start', (q) => q.e === 'start'],
  ['accepted the mission', (q) => q.e === 'mission'],
  ['went to the agent office', (q) => q.e === 'scene' && q.to === 'office'],
  ['reached an ending', (q) => q.e === 'ending'],
  ['shared the receipt', (q) => q.e === 'share'],
  ['gave feedback', (q) => q.e === 'feedback'],
])) console.log(`  ${String(reached(test)).padStart(4)}  ${label}`);

const ordered = [...visitors.entries()].sort(([, a], [, b]) => Math.max(...[...b.sessions.values()].map((s) => +s.at)) - Math.max(...[...a.sessions.values()].map((s) => +s.at)));
for (const [id, v] of ordered) {
  console.log(`\n■ visitor ${id} · ${device(v.ua)} · ${v.ip} · ${v.sessions.size} visit(s)`);
  for (const s of [...v.sessions.values()].sort((a, b) => +a.at - +b.at)) {
    console.log(`  ${when(s.at)}`);
    for (const q of s.steps) console.log(`    +${secs(q.t).padEnd(7)} ${step(q)}`);
  }
}
