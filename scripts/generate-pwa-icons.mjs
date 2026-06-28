/**
 * Generates the PWA icon set from a single drawing routine, in pure Node
 * (zlib only) so the build has no binary image dependency. Brand palette is
 * taken from public/favicon.svg: slate-900 background (#0f172a) and the
 * Palo-Alto orange accent (#ea580c).
 *
 * Outputs to public/icons/: pwa-192.png, pwa-512.png, pwa-maskable-512.png,
 * and apple-touch-icon.png (180, no transparency, full-bleed for iOS).
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');

const BG = [15, 23, 42, 255]; // #0f172a slate-900
const ACCENT = [234, 88, 12, 255]; // #ea580c orange-600
const WHITE = [248, 250, 252, 255]; // slate-50

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // add filter byte (0) per row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function blend(buf, i, color) {
  // simple source-over with the icon being opaque-ish; color may have alpha
  const a = color[3] / 255;
  buf[i] = Math.round(color[0] * a + buf[i] * (1 - a));
  buf[i + 1] = Math.round(color[1] * a + buf[i + 1] * (1 - a));
  buf[i + 2] = Math.round(color[2] * a + buf[i + 2] * (1 - a));
  buf[i + 3] = 255;
}

/**
 * Draws a shield with an interior checkmark, scaled to the canvas.
 * `inset` (0..1) shrinks the artwork toward the centre so the maskable
 * variant keeps the shield inside the safe zone.
 */
function drawIcon(size, { transparentBg = false, inset = 0 } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < buf.length; i += 4) {
    if (transparentBg) {
      buf[i] = 0;
      buf[i + 1] = 0;
      buf[i + 2] = 0;
      buf[i + 3] = 0;
    } else {
      buf[i] = BG[0];
      buf[i + 1] = BG[1];
      buf[i + 2] = BG[2];
      buf[i + 3] = 255;
    }
  }

  const cx = size / 2;
  const margin = size * (0.16 + inset * 0.12);
  const top = margin;
  const bottom = size - margin;
  const halfW = (size - 2 * margin) / 2;
  const h = bottom - top;

  // Shield outline: top flat-ish, sides straight, tapering to a point.
  // Use a parametric test: for each pixel decide if inside the shield.
  function insideShield(x, y) {
    if (y < top || y > bottom) return false;
    const t = (y - top) / h; // 0 at top, 1 at point
    // width factor: full near top, narrows to 0 at bottom point
    let wf;
    if (t < 0.6) wf = 1 - 0.15 * (t / 0.6);
    else wf = (0.85) * (1 - (t - 0.6) / 0.4);
    const w = halfW * Math.max(wf, 0);
    return Math.abs(x - cx) <= w;
  }

  // Checkmark stroke geometry (relative to shield box)
  const stroke = size * 0.07;
  // points of the check
  const p1 = [cx - halfW * 0.45, top + h * 0.46];
  const p2 = [cx - halfW * 0.08, top + h * 0.62];
  const p3 = [cx + halfW * 0.5, top + h * 0.3];

  function distToSeg(px, py, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    let t = l2 === 0 ? 0 : ((px - a[0]) * dx + (py - a[1]) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const qx = a[0] + t * dx;
    const qy = a[1] + t * dy;
    return Math.hypot(px - qx, py - qy);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!insideShield(x + 0.5, y + 0.5)) continue;
      // shield fill (accent)
      blend(buf, i, ACCENT);
      // checkmark in white on top
      const d = Math.min(
        distToSeg(x + 0.5, y + 0.5, p1, p2),
        distToSeg(x + 0.5, y + 0.5, p2, p3)
      );
      if (d <= stroke / 2) {
        blend(buf, i, WHITE);
      }
    }
  }
  return encodePng(size, size, buf);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'pwa-192.png'), drawIcon(192));
writeFileSync(join(OUT_DIR, 'pwa-512.png'), drawIcon(512));
writeFileSync(join(OUT_DIR, 'pwa-maskable-512.png'), drawIcon(512, { inset: 1 }));
writeFileSync(join(OUT_DIR, 'apple-touch-icon.png'), drawIcon(180));
console.log('PWA icons written to', OUT_DIR);
