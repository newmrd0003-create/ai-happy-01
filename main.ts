// A Happy Moment — ai-happy-01 entry.
//
// Node 22, standard library only. Draws one original joyful scene as a PNG:
// a small child laughing while flying a handmade kite over a golden-hour hill,
// a happy dog chasing after, birds overhead, warm light. Fully deterministic:
// no Date, no Math.random, no timestamps — two runs write byte-identical files.
//
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = 800;
const H = 600;
const px = new Uint8Array(W * H * 3);

type RGB = [number, number, number];

function put(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function blend(x: number, y: number, c: RGB, a: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = Math.round(px[i] * (1 - a) + c[0] * a);
  px[i + 1] = Math.round(px[i + 1] * (1 - a) + c[1] * a);
  px[i + 2] = Math.round(px[i + 2] * (1 - a) + c[2] * a);
}

function disc(cx: number, cy: number, r: number, c: RGB): void {
  ellipse(cx, cy, r, r, c);
}

function discA(cx: number, cy: number, r: number, c: RGB, a: number): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) blend(x, y, c, a);
    }
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const dx = rx * Math.sqrt(1 - dy * dy);
    for (let x = Math.ceil(cx - dx); x <= Math.floor(cx + dx); x++) put(x, y, c);
  }
}

function poly(pts: number[][], c: RGB): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    xs.sort((x, y) => x - y);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.ceil(xs[i]); x <= Math.floor(xs[i + 1]); x++) put(x, y, c);
    }
  }
}

// Thick line: stamp discs along the segment.
function line(x0: number, y0: number, x1: number, y1: number, w: number, c: RGB): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2, c);
  }
}

// Arc of a circle, angles in radians, screen coords (y grows downward).
function arc(cx: number, cy: number, r: number, a0: number, a1: number, w: number, c: RGB): void {
  const steps = 40;
  let px0 = cx + r * Math.cos(a0);
  let py0 = cy + r * Math.sin(a0);
  for (let i = 1; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    line(px0, py0, x, y, w, c);
    px0 = x;
    py0 = y;
  }
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpC(c0: RGB, c1: RGB, t: number): RGB {
  return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
}

// ---------- sky: warm golden-hour gradient ----------
const SKY_TOP: RGB = [246, 164, 92];
const SKY_MID: RGB = [252, 210, 150];
const SKY_LOW: RGB = [255, 236, 200];
for (let y = 0; y < H; y++) {
  const t = y / 420;
  const c = t < 0.55 ? lerpC(SKY_TOP, SKY_MID, t / 0.55) : lerpC(SKY_MID, SKY_LOW, (t - 0.55) / 0.45);
  for (let x = 0; x < W; x++) put(x, y, c);
}

// ---------- sun with a soft glow ----------
discA(630, 140, 130, [255, 190, 90], 0.22);
discA(630, 140, 100, [255, 200, 110], 0.3);
disc(630, 140, 62, [255, 158, 61]);
disc(630, 140, 50, [255, 178, 84]);

// ---------- clouds ----------
function cloud(cx: number, cy: number, s: number): void {
  const c: RGB = [255, 248, 236];
  ellipse(cx, cy, 52 * s, 20 * s, c);
  ellipse(cx - 34 * s, cy + 8 * s, 34 * s, 15 * s, c);
  ellipse(cx + 36 * s, cy + 8 * s, 36 * s, 16 * s, c);
  ellipse(cx, cy - 12 * s, 30 * s, 15 * s, c);
}
cloud(140, 105, 1);
cloud(330, 70, 0.8);
cloud(520, 215, 0.7);

// ---------- birds ----------
function bird(cx: number, cy: number, s: number): void {
  const c: RGB = [91, 58, 41];
  line(cx - 10 * s, cy, cx, cy - 6 * s, 3, c);
  line(cx, cy - 6 * s, cx + 10 * s, cy, 3, c);
}
bird(160, 190, 1);
bird(215, 165, 0.8);
bird(560, 95, 0.9);

// ---------- rolling hills ----------
poly([[0, 430], [180, 395], [380, 425], [560, 395], [800, 430], [800, 600], [0, 600]], [224, 170, 110]);
poly([[0, 480], [200, 450], [420, 485], [620, 455], [800, 490], [800, 600], [0, 600]], [147, 178, 94]);
poly([[0, 540], [260, 505], [520, 545], [800, 515], [800, 600], [0, 600]], [127, 166, 83]);

// ---------- the kite: handmade diamond, red and gold ----------
const KITE: RGB = [228, 87, 46];
const KITE_IN: RGB = [244, 162, 89];
poly([[440, 92], [498, 152], [440, 212], [382, 152]], KITE);
poly([[440, 118], [476, 152], [440, 186], [404, 152]], KITE_IN);
line(440, 92, 440, 212, 3, [122, 46, 14]);
line(382, 152, 498, 152, 3, [122, 46, 14]);
disc(440, 152, 8, [42, 157, 143]);

// Kite tail: a curving string with little bows.
let tx = 440;
let ty = 212;
const tailPts: [number, number][] = [[470, 245], [452, 278], [478, 310], [460, 342]];
for (const [nx, ny] of tailPts) {
  line(tx, ty, nx, ny, 2, [122, 46, 14]);
  poly([[nx, ny - 9], [nx + 8, ny], [nx, ny + 9], [nx - 8, ny]], [42, 157, 143]);
  tx = nx;
  ty = ny;
}

// ---------- kite string down to the child's hand ----------
{
  const p0: [number, number] = [440, 212];
  const p1: [number, number] = [392, 300];
  const p2: [number, number] = [348, 356];
  const p3: [number, number] = [316, 402];
  let sx = p0[0];
  let sy = p0[1];
  for (let i = 1; i <= 48; i++) {
    const t = i / 48;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    line(sx, sy, x, y, 2, [91, 58, 41]);
    sx = x;
    sy = y;
  }
}

// ---------- the child: laughing, one arm up to the string ----------
// Legs (running).
line(296, 462, 282, 516, 11, [51, 80, 107]);
line(306, 462, 322, 514, 11, [51, 80, 107]);
// Shoes.
ellipse(280, 518, 12, 6, [228, 87, 46]);
ellipse(324, 516, 12, 6, [228, 87, 46]);
// Body: red shirt.
poly([[282, 402], [318, 402], [314, 468], [286, 468]], [228, 87, 46]);
disc(300, 402, 18, [228, 87, 46]);
// Arms: left arm waving out, right arm up holding the string.
line(286, 412, 258, 436, 9, [228, 87, 46]);
disc(256, 438, 6, [242, 194, 151]);
line(314, 412, 316, 402, 9, [228, 87, 46]);
disc(316, 400, 6, [242, 194, 151]);
// Head.
disc(300, 376, 25, [242, 194, 151]);
// Hair: dark cap + tuft.
arc(300, 374, 25, Math.PI, Math.PI * 2, 10, [107, 66, 38]);
disc(300, 352, 6, [107, 66, 38]);
// Face: eyes, big open smile, rosy cheeks.
disc(291, 372, 3, [43, 43, 43]);
disc(309, 372, 3, [43, 43, 43]);
arc(300, 380, 11, Math.PI * 0.15, Math.PI * 0.85, 4, [43, 43, 43]);
disc(284, 384, 5, [242, 139, 130]);
disc(316, 384, 5, [242, 139, 130]);

// ---------- a little heart of joy floating up from the child ----------
disc(352, 332, 8, [228, 87, 46]);
disc(366, 332, 8, [228, 87, 46]);
poly([[346, 336], [372, 336], [359, 352]], [228, 87, 46]);

// ---------- the dog: chasing after, tail up ----------
// Body and head.
ellipse(438, 522, 36, 17, [176, 125, 79]);
disc(472, 506, 14, [176, 125, 79]);
// Floppy ear, snout, nose.
ellipse(464, 496, 7, 11, [138, 90, 50]);
ellipse(484, 510, 9, 6, [176, 125, 79]);
disc(491, 508, 3, [43, 43, 43]);
// Legs mid-run.
line(414, 534, 402, 556, 7, [138, 90, 50]);
line(428, 536, 424, 558, 7, [138, 90, 50]);
line(452, 536, 462, 556, 7, [138, 90, 50]);
line(464, 534, 476, 552, 7, [138, 90, 50]);
// Tail up, wagging.
arc(404, 512, 14, Math.PI * 0.9, Math.PI * 1.9, 6, [138, 90, 50]);
// Happy tongue.
poly([[486, 516], [494, 516], [492, 526], [488, 526]], [242, 139, 130]);

// ---------- flowers on the hill ----------
function flower(cx: number, cy: number, petal: RGB): void {
  line(cx, cy, cx, cy + 12, 3, [90, 130, 70]);
  for (let k = 0; k < 5; k++) {
    const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
    disc(cx + 6 * Math.cos(a), cy + 6 * Math.sin(a), 4, petal);
  }
  disc(cx, cy, 4, [255, 214, 90]);
}
flower(120, 545, [255, 255, 255]);
flower(180, 568, [255, 214, 150]);
flower(650, 552, [255, 255, 255]);
flower(705, 570, [255, 214, 150]);
flower(90, 578, [255, 214, 150]);
flower(590, 575, [255, 255, 255]);
flower(555, 582, [255, 255, 255]);
flower(500, 588, [255, 214, 150]);

// ---------- butterflies ----------
function butterfly(cx: number, cy: number, c: RGB): void {
  ellipse(cx - 6, cy - 4, 7, 5, c);
  ellipse(cx + 6, cy - 4, 7, 5, c);
  ellipse(cx - 5, cy + 5, 5, 4, c);
  ellipse(cx + 5, cy + 5, 5, 4, c);
  line(cx, cy - 7, cx, cy + 8, 2, [43, 43, 43]);
}
butterfly(520, 330, [244, 162, 89]);
butterfly(585, 295, [42, 157, 143]);

// ---------- grass tufts ----------
function tuft(cx: number, cy: number): void {
  const c: RGB = [110, 150, 70];
  line(cx - 6, cy, cx - 3, cy - 12, 3, c);
  line(cx, cy, cx, cy - 14, 3, c);
  line(cx + 6, cy, cx + 3, cy - 12, 3, c);
}
tuft(240, 560);
tuft(360, 580);
tuft(520, 560);
tuft(680, 590);
tuft(60, 545);

// ---------- minimal PNG encoder (zlib is stdlib) ----------
const CRC_TABLE = ((): Uint32Array => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', deflateSync(raw, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`wrote entry.png: ${png.length} bytes, ${W}x${H}`);
