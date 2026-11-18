import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Deterministic brand asset generator.
 *
 * Produces the Open Graph card, PWA icons and the Apple touch icon without any
 * external image tooling. Shapes are rendered at 3x and box-filtered down for
 * antialiasing, then encoded as PNG with Node's zlib.
 *
 * Run with: npm run assets
 */

type Color = readonly [number, number, number, number];

const rgb = (r: number, g: number, b: number, a = 255): Color => [r, g, b, a] as const;

const palette = {
  page: rgb(247, 249, 252),
  sky: rgb(216, 238, 250),
  white: rgb(255, 255, 255),
  navy: rgb(23, 43, 77),
  muted: rgb(113, 128, 150),
  line: rgb(227, 236, 244),
  brand: rgb(34, 158, 217),
  brandDeep: rgb(22, 138, 192),
  brandLight: rgb(53, 182, 238),
  green: rgb(22, 163, 106),
  amber: rgb(233, 162, 59),
};

const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
};

const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;
const GLYPH_ADVANCE = 6;

class Canvas {
  private readonly pixels: Uint8Array;
  private readonly scale: number;

  constructor(
    readonly width: number,
    readonly height: number,
    scale = 3,
  ) {
    this.scale = scale;
    this.pixels = new Uint8Array(width * scale * height * scale * 4);
  }

  private blend(x: number, y: number, color: Color): void {
    const alpha = color[3] / 255;
    if (alpha <= 0) return;
    const index = (y * this.width * this.scale + x) * 4;
    if (alpha >= 1) {
      this.pixels[index] = color[0];
      this.pixels[index + 1] = color[1];
      this.pixels[index + 2] = color[2];
      this.pixels[index + 3] = 255;
      return;
    }
    const dstAlpha = (this.pixels[index + 3] ?? 0) / 255;
    const outAlpha = alpha + dstAlpha * (1 - alpha);
    if (outAlpha <= 0) return;
    this.pixels[index] = Math.round((color[0] * alpha + (this.pixels[index] ?? 0) * dstAlpha * (1 - alpha)) / outAlpha);
    this.pixels[index + 1] = Math.round(
      (color[1] * alpha + (this.pixels[index + 1] ?? 0) * dstAlpha * (1 - alpha)) / outAlpha,
    );
    this.pixels[index + 2] = Math.round(
      (color[2] * alpha + (this.pixels[index + 2] ?? 0) * dstAlpha * (1 - alpha)) / outAlpha,
    );
    this.pixels[index + 3] = Math.round(outAlpha * 255);
  }

  /** Paints every physical pixel whose logical center satisfies the test. */
  private paint(x: number, y: number, w: number, h: number, inside: (lx: number, ly: number) => boolean, color: Color) {
    const s = this.scale;
    const pw = this.width * s;
    const ph = this.height * s;
    const x0 = Math.max(0, Math.floor(x * s));
    const y0 = Math.max(0, Math.floor(y * s));
    const x1 = Math.min(pw, Math.ceil((x + w) * s));
    const y1 = Math.min(ph, Math.ceil((y + h) * s));
    for (let py = y0; py < y1; py += 1) {
      const ly = (py + 0.5) / s;
      for (let px = x0; px < x1; px += 1) {
        const lx = (px + 0.5) / s;
        if (inside(lx, ly)) this.blend(px, py, color);
      }
    }
  }

  gradient(from: Color, to: Color): void {
    const s = this.scale;
    const pw = this.width * s;
    const ph = this.height * s;
    for (let py = 0; py < ph; py += 1) {
      for (let px = 0; px < pw; px += 1) {
        const t = (px / pw + py / ph) / 2;
        const color = rgb(
          Math.round(from[0] + (to[0] - from[0]) * t),
          Math.round(from[1] + (to[1] - from[1]) * t),
          Math.round(from[2] + (to[2] - from[2]) * t),
          255,
        );
        this.pixels[(py * pw + px) * 4] = color[0];
        this.pixels[(py * pw + px) * 4 + 1] = color[1];
        this.pixels[(py * pw + px) * 4 + 2] = color[2];
        this.pixels[(py * pw + px) * 4 + 3] = 255;
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, color: Color): void {
    this.paint(x, y, w, h, (lx, ly) => lx >= x && lx < x + w && ly >= y && ly < y + h, color);
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, color: Color): void {
    this.paint(
      x,
      y,
      w,
      h,
      (lx, ly) => {
        if (lx < x || lx > x + w || ly < y || ly > y + h) return false;
        const radius = Math.min(r, w / 2, h / 2);
        const cx = Math.min(Math.max(lx, x + radius), x + w - radius);
        const cy = Math.min(Math.max(ly, y + radius), y + h - radius);
        const dx = lx - cx;
        const dy = ly - cy;
        return dx * dx + dy * dy <= radius * radius;
      },
      color,
    );
  }

  circle(cx: number, cy: number, r: number, color: Color): void {
    this.paint(cx - r, cy - r, r * 2, r * 2, (lx, ly) => {
      const dx = lx - cx;
      const dy = ly - cy;
      return dx * dx + dy * dy <= r * r;
    }, color);
  }

  /** Clears everything outside a rounded rectangle (used for icon corners). */
  eraseOutsideRoundRect(x: number, y: number, w: number, h: number, r: number): void {
    const s = this.scale;
    const pw = this.width * s;
    const ph = this.height * s;
    for (let py = 0; py < ph; py += 1) {
      const ly = (py + 0.5) / s;
      for (let px = 0; px < pw; px += 1) {
        const lx = (px + 0.5) / s;
        const radius = Math.min(r, w / 2, h / 2);
        const cx = Math.min(Math.max(lx, x + radius), x + w - radius);
        const cy = Math.min(Math.max(ly, y + radius), y + h - radius);
        const dx = lx - cx;
        const dy = ly - cy;
        const inside = lx >= x && lx <= x + w && ly >= y && ly <= y + h && dx * dx + dy * dy <= radius * radius;
        if (!inside) {
          const index = (py * pw + px) * 4;
          this.pixels[index] = 0;
          this.pixels[index + 1] = 0;
          this.pixels[index + 2] = 0;
          this.pixels[index + 3] = 0;
        }
      }
    }
  }

  /** Top-half arc, like a broadcast signal. Angles are measured clockwise from 3 o'clock. */
  arc(cx: number, cy: number, r: number, thickness: number, color: Color): void {
    const outer = r + thickness / 2;
    this.paint(cx - outer, cy - outer, outer * 2, outer * 2, (lx, ly) => {
      const dx = lx - cx;
      const dy = ly - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < r - thickness / 2 || distance > outer) return false;
      const angle = Math.atan2(dy, dx);
      return angle <= -0.12 && angle >= -Math.PI + 0.12;
    }, color);
  }

  polygon(points: ReadonlyArray<readonly [number, number]>, color: Color): void {
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    this.paint(minX, minY, maxX - minX, maxY - minY, (lx, ly) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i]!;
        const [xj, yj] = points[j]!;
        if (yi > ly !== yj > ly && lx < ((xj - xi) * (ly - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, color);
  }

  measure(text: string, px: number): number {
    let width = 0;
    for (const character of text) width += (character === ' ' ? 3 : GLYPH_ADVANCE) * px;
    return width;
  }

  text(text: string, x: number, y: number, px: number, color: Color): number {
    let cursor = x;
    for (const character of text) {
      if (character === ' ') {
        cursor += 3 * px;
        continue;
      }
      const glyph = FONT[character];
      if (!glyph) {
        cursor += GLYPH_ADVANCE * px;
        continue;
      }
      for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
        for (let column = 0; column < GLYPH_WIDTH; column += 1) {
          if (glyph[row]?.[column] === '1') {
            this.rect(cursor + column * px, y + row * px, px, px, color);
          }
        }
      }
      cursor += GLYPH_ADVANCE * px;
    }
    return cursor;
  }

  png(): Buffer {
    const s = this.scale;
    const pw = this.width;
    const ph = this.height;
    const sourceWidth = this.width * s;
    const raw = Buffer.alloc(ph * (pw * 4 + 1));
    for (let y = 0; y < ph; y += 1) {
      raw[y * (pw * 4 + 1)] = 0;
      for (let x = 0; x < pw; x += 1) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        for (let sy = 0; sy < s; sy += 1) {
          for (let sx = 0; sx < s; sx += 1) {
            const index = (((y * s + sy) * sourceWidth + (x * s + sx)) * 4);
            r += this.pixels[index] ?? 0;
            g += this.pixels[index + 1] ?? 0;
            b += this.pixels[index + 2] ?? 0;
            a += this.pixels[index + 3] ?? 0;
          }
        }
        const count = s * s;
        const offset = y * (pw * 4 + 1) + 1 + x * 4;
        raw[offset] = Math.round(r / count);
        raw[offset + 1] = Math.round(g / count);
        raw[offset + 2] = Math.round(b / count);
        raw[offset + 3] = Math.round(a / count);
      }
    }
    return encodePng(this.width, this.height, raw);
  }
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width: number, height: number, raw: Buffer): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawSignal(canvas: Canvas, cx: number, cy: number, unit: number): void {
  canvas.arc(cx, cy, unit * 0.62, unit * 0.22, rgb(255, 255, 255, 245));
  canvas.arc(cx, cy, unit * 1.08, unit * 0.2, rgb(255, 255, 255, 180));
  canvas.circle(cx, cy + unit * 0.98, unit * 0.19, palette.white);
}

function roundedIcon(size: number, padding: number): Canvas {
  const canvas = new Canvas(size, size);
  canvas.gradient(palette.brandLight, palette.brandDeep);
  canvas.eraseOutsideRoundRect(padding, padding, size - padding * 2, size - padding * 2, size * 0.22);
  drawSignal(canvas, size / 2, size * 0.43, size * 0.2);
  return canvas;
}

/** Full-bleed square icon with a generous safe zone (maskable). */
function squareIcon(size: number): Canvas {
  const canvas = new Canvas(size, size);
  canvas.gradient(palette.brandLight, palette.brandDeep);
  drawSignal(canvas, size / 2, size * 0.43, size * 0.17);
  return canvas;
}

function ogCard(): Canvas {
  const canvas = new Canvas(1200, 630);
  canvas.gradient(palette.page, palette.sky);

  canvas.circle(1120, 60, 240, rgb(34, 158, 217, 24));
  canvas.circle(1160, 560, 200, rgb(22, 163, 106, 18));
  canvas.circle(40, 610, 220, rgb(34, 158, 217, 16));

  canvas.roundRect(66, 78, 1068, 464, 34, rgb(23, 43, 77, 16));
  canvas.roundRect(64, 88, 1072, 440, 34, palette.white);

  canvas.roundRect(112, 132, 104, 104, 28, palette.brand);
  drawSignal(canvas, 164, 172, 26);
  canvas.circle(164, 220, 4, rgb(255, 255, 255, 160));

  canvas.text('TELEGRAM', 244, 140, 7, palette.navy);
  const afterFirst = canvas.text('PROXY ', 244, 202, 7, palette.navy);
  canvas.text('HUB', afterFirst, 202, 7, palette.brand);
  canvas.text('MTPROTO PROXY DIRECTORY', 244, 280, 3, palette.muted);

  canvas.rect(112, 334, 976, 1.5, palette.line);

  const cards: Array<{ label: string; value: string; color: Color }> = [
    { label: 'STATUS', value: 'LIVE DATA', color: palette.green },
    { label: 'PROTOCOL', value: 'MTPROTO', color: palette.brand },
    { label: 'CHECKS', value: 'AUTOMATED', color: palette.amber },
  ];
  cards.forEach((card, index) => {
    const x = 112 + index * 332;
    const y = 362;
    canvas.roundRect(x, y, 312, 94, 18, palette.line);
    canvas.roundRect(x + 1, y + 1, 310, 92, 17, rgb(250, 252, 254));
    canvas.circle(x + 28, y + 32, 7, card.color);
    canvas.text(card.label, x + 48, y + 22, 3, palette.muted);
    canvas.text(card.value, x + 20, y + 55, 4, palette.navy);
  });

  canvas.circle(120, 578, 5, palette.brand);
  canvas.text('TELEGRAM-PROXY-HUB.PAGES.DEV', 136, 568, 3, rgb(23, 43, 77, 168));

  return canvas;
}

const publicDir = resolve(import.meta.dirname, '..', 'public');
const iconsDir = resolve(publicDir, 'icons');
mkdirSync(iconsDir, { recursive: true });

writeFileSync(resolve(publicDir, 'og-image.png'), ogCard().png());
writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), squareIcon(180).png());
writeFileSync(resolve(iconsDir, 'icon-192.png'), roundedIcon(192, 10).png());
writeFileSync(resolve(iconsDir, 'icon-512.png'), roundedIcon(512, 26).png());
writeFileSync(resolve(iconsDir, 'maskable-512.png'), squareIcon(512).png());

console.log('[assets] Wrote og-image.png, apple-touch-icon.png and PWA icons.');
