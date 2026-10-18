// @ts-check
// Visit tracking: each step of a visit is a tiny ping to /t on our own server, which nginx
// writes to /var/log/nginx/japa-track.log (no third-party service, no cookies).
// tools/journeys.sh reads the log back as one timeline per visitor.
// The visitor id is a random string kept in localStorage; it says nothing about the person.

const ON = !['localhost', '127.0.0.1'].includes(location.hostname); // local testing stays out of the numbers
const started = Date.now();
const session = Math.random().toString(36).slice(2, 10);
let visitor = '';
try {
  visitor = localStorage.getItem('japa-visitor') ?? '';
  if (!visitor) { visitor = Math.random().toString(36).slice(2, 12); localStorage.setItem('japa-visitor', visitor); }
} catch { visitor = session; } // private mode: every visit looks new

/**
 * Record one step of the visit, e.g. track('scene', { to: 'office' }).
 * @param {string} event
 * @param {Record<string, string | number | boolean>} [data]
 */
export function track(event, data = {}) {
  if (!ON) return;
  const q = new URLSearchParams({ v: visitor, s: session, e: event, t: String(Math.round((Date.now() - started) / 1000)) });
  for (const [k, val] of Object.entries(data)) q.set(k, String(val));
  const url = `/t?${q}`;
  try { if (navigator.sendBeacon?.(url)) return; } catch { /* fall back */ }
  fetch(url, { method: 'POST', keepalive: true }).catch(() => { /* tracking never breaks the game */ });
}

// leaving: how long they stayed (pagehide also fires when a phone switches apps)
addEventListener('pagehide', () => track('leave'));
