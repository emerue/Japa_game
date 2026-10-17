// @ts-check
// The JAPA Receipt as a picture to share (1080 × 1350, the portrait size
// WhatsApp status and Instagram use): the POS slip on danfo yellow.

/**
 * @typedef {object} ReceiptData
 * @property {string} stamp
 * @property {boolean} good
 * @property {string} lesson
 * @property {[string, string][]} rows
 * @property {[string, string][]} items
 * @property {string} code
 * @property {string} url Where to play, without https://.
 */

const INK = '#191B1E', DANFO = '#F2B705', RED = '#C74742', TEAL = '#176B6B', SLIP = '#FBFAF6';

/**
 * Wraps text to a width, returning the lines.
 * @param {CanvasRenderingContext2D} g @param {string} text @param {number} width
 */
function wrap(g, text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** @param {ReceiptData} r @returns {HTMLCanvasElement} */
export function drawReceipt(r) {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));

  // danfo yellow with the double stripe along the bottom
  g.fillStyle = DANFO;
  g.fillRect(0, 0, W, H);
  g.fillStyle = INK;
  g.fillRect(0, H - 120, W, 16);
  g.fillRect(0, H - 92, W, 16);

  // the slip, slightly tilted, with torn top and bottom edges
  const sw = 760, sx = (W - sw) / 2, sy = 120;
  g.font = '500 30px "IBM Plex Mono", monospace';
  const lineH = 46;
  const lesson = wrap(g, `LESSON: ${r.lesson}`, sw - 100);
  const sh = 300 + (r.rows.length + r.items.length) * lineH + lesson.length * lineH + 170;
  g.save();
  g.translate(W / 2, sy + sh / 2);
  g.rotate(-0.025);
  g.translate(-W / 2, -(sy + sh / 2));
  g.shadowColor = 'rgba(0,0,0,0.35)';
  g.shadowBlur = 30;
  g.shadowOffsetY = 14;
  g.fillStyle = SLIP;
  g.beginPath();
  const tooth = 24;
  g.moveTo(sx, sy);
  for (let x = sx; x < sx + sw; x += tooth) { g.lineTo(x + tooth / 2, sy - 14); g.lineTo(x + tooth, sy); }
  g.lineTo(sx + sw, sy + sh);
  for (let x = sx + sw; x > sx; x -= tooth) { g.lineTo(x - tooth / 2, sy + sh + 14); g.lineTo(x - tooth, sy + sh); }
  g.closePath();
  g.fill();
  g.shadowColor = 'transparent';

  // logo and stripes
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.font = '400 96px Bungee, Impact, sans-serif';
  g.fillText('JAPA', W / 2, sy + 120);
  const bx = sx + 50, bw = sw - 100;
  [[0, DANFO, 14], [14, INK, 7], [21, DANFO, 7], [28, INK, 7]].forEach(([dy, col, h]) => {
    g.fillStyle = /** @type {string} */ (col);
    g.fillRect(bx, sy + 150 + /** @type {number} */ (dy), bw, /** @type {number} */ (h));
  });

  // rows and items
  let y = sy + 250;
  const row = (/** @type {[string, string]} */ [a, b], bold = false) => {
    g.font = `${bold ? 700 : 500} 30px "IBM Plex Mono", monospace`;
    g.fillStyle = '#222';
    g.textAlign = 'left';
    g.fillText(a, bx, y);
    g.textAlign = 'right';
    g.fillText(b, bx + bw, y);
    y += lineH;
  };
  const dashes = () => {
    g.strokeStyle = '#999';
    g.setLineDash([10, 8]);
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(bx, y - 22); g.lineTo(bx + bw, y - 22); g.stroke();
    g.setLineDash([]);
    y += 18;
  };
  r.rows.forEach((x) => row(x));
  dashes();
  r.items.forEach((x) => row(x, true));
  dashes();
  g.font = '700 30px "IBM Plex Mono", monospace';
  g.textAlign = 'left';
  g.fillStyle = '#222';
  for (const l of lesson) { g.fillText(l, bx, y); y += lineH; }
  y += 20;
  g.textAlign = 'center';
  g.font = '500 30px "IBM Plex Mono", monospace';
  g.fillText('CAN YOU DO BETTER?', W / 2, y);
  g.fillText(`CODE ${r.code}`, W / 2, y + lineH);

  // the rubber stamp
  g.save();
  g.translate(sx + sw - 170, sy + 110);
  g.rotate(-0.22);
  g.strokeStyle = g.fillStyle = r.good ? TEAL : RED;
  g.globalAlpha = 0.9;
  g.lineWidth = 8;
  g.font = '400 58px Bungee, Impact, sans-serif';
  const tw = g.measureText(r.stamp).width;
  g.strokeRect(-tw / 2 - 22, -52, tw + 44, 88);
  g.fillText(r.stamp, 0, 12);
  g.restore();
  g.restore();

  // where to play
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.font = '400 40px Bungee, Impact, sans-serif';
  g.fillText('PLAY JAPA FREE', W / 2, H - 205);
  g.font = '700 32px Archivo, sans-serif';
  g.fillText(r.url, W / 2, H - 158);
  return c;
}

/**
 * Shares the receipt picture, or saves it when the phone can't share files.
 * @param {ReceiptData} r
 * @param {string} text Caption to share with it.
 * @returns {Promise<'shared' | 'saved' | 'cancelled'>}
 */
export async function shareReceipt(r, text) {
  const canvas = drawReceipt(r);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const file = new File([/** @type {Blob} */ (blob)], 'japa-receipt.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'saved';
}
