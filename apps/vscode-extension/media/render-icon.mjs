import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 256;
const SCALE = SIZE / 32;

function crc32(buffer) {
  let c = ~0;
  for (const byte of buffer) {
    c ^= byte;
    for (let i = 0; i < 8; i += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function mix(a, b, t) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
}

function gradient(x, y) {
  const dx = 22;
  const dy = 24;
  const t = Math.min(1, Math.max(0, ((x - 6) * dx + (y - 4) * dy) / (dx * dx + dy * dy)));
  const start = [201, 194, 255];
  const mid = [142, 182, 255];
  const end = [139, 124, 255];
  return t < 0.55 ? mix(start, mid, t / 0.55) : mix(mid, end, (t - 0.55) / 0.45);
}

function roundRect(px, py) {
  const radius = 9 * SCALE;
  const qx = Math.abs(px - SIZE / 2) - (SIZE / 2 - radius);
  const qy = Math.abs(py - SIZE / 2) - (SIZE / 2 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

function cubic(a, b, c, d, t) {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

const curve = [];
for (let step = 0; step <= 64; step += 1) {
  const [x, y] = cubic([7, 22], [11.2, 12], [20.8, 12], [25, 22], step / 64);
  curve.push([x * SCALE, y * SCALE]);
}

function curveDistance(px, py) {
  let best = Infinity;
  for (let index = 1; index < curve.length; index += 1) {
    const [x1, y1] = curve[index - 1];
    const [x2, y2] = curve[index];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = dx * dx + dy * dy || 1;
    const t = Math.min(1, Math.max(0, ((px - x1) * dx + (py - y1) * dy) / length));
    best = Math.min(best, Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t)));
  }
  return best;
}

const star = [
  [16, 8.5],
  [17.2, 11.9],
  [20.6, 13],
  [17.2, 14.1],
  [16, 17.5],
  [14.8, 14.1],
  [12.6, 13],
  [14.8, 11.9],
].map(([x, y]) => [x * SCALE, y * SCALE]);

function insideStar(px, py) {
  let inside = false;
  for (let i = 0, j = star.length - 1; i < star.length; j = i, i += 1) {
    const [xi, yi] = star[i];
    const [xj, yj] = star[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function sample(x, y) {
  const distance = roundRect(x, y);
  if (distance > 0.6) return [0, 0, 0, 0];
  const viewX = x / SCALE;
  const viewY = y / SCALE;
  if (insideStar(x, y) || curveDistance(x, y) <= 0.95 * SCALE) return [...gradient(viewX, viewY), 255];
  if (distance > -1.35 * SCALE) return [...gradient(viewX, viewY), 255];
  return [18, 22, 42, 255];
}

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y += 1) {
  const row = y * (SIZE * 4 + 1);
  raw[row] = 0;
  for (let x = 0; x < SIZE; x += 1) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;
    for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const pixel = sample(x + ox, y + oy);
      red += pixel[0];
      green += pixel[1];
      blue += pixel[2];
      alpha += pixel[3];
    }
    const offset = row + 1 + x * 4;
    raw[offset] = Math.round(red / 4);
    raw[offset + 1] = Math.round(green / 4);
    raw[offset + 2] = Math.round(blue / 4);
    raw[offset + 3] = Math.round(alpha / 4);
  }
}

const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 8;
header[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

const destination = path.join(path.dirname(fileURLToPath(import.meta.url)), "icon.png");
writeFileSync(destination, png);
console.log(`Wrote ${destination} (${png.length} bytes)`);
