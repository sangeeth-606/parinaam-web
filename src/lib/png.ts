// Deterministic PNG generator for mock test-strip photos.
// Hand-rolls a minimal PNG encoder (truecolor, 8-bit) so we don't need any
// native image dependency. Output is a function of `seed`, i.e. byte-stable.

import { createHash } from "crypto";
import { deflateSync } from "zlib";

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const WIDTH = 400;
const HEIGHT = 300;

export function renderStripPng(seed: string): Buffer {
  const hash = createHash("sha256").update(seed).digest();

  // helper to derive deterministic byte from hash + salt
  const byteAt = (i: number) => hash[i % hash.length];

  // palette: background, strip body, control line, test line
  const bg = [230, 228, 222];
  const strip = [248, 246, 240];

  const rows: Buffer[] = [];
  const stride = WIDTH * 3 + 1; // +1 filter byte

  for (let y = 0; y < HEIGHT; y++) {
    const row = Buffer.alloc(stride);
    row[0] = 0; // filter: none
    for (let x = 0; x < WIDTH; x++) {
      let px: number[];
      const inStrip = x >= 60 && x < 340 && y >= 40 && y < 260;
      if (!inStrip) {
        px = bg;
      } else {
        px = strip;
        // absorbent pad shading
        if (x >= 70 && x < 130) px = [226, 222, 210]; // sample pad
        if (x >= 300 && x < 335) px = [214, 210, 200]; // absorbent end
        // control line (always present)
        if (x >= 160 && x < 172 && y >= 120 && y < 168) px = [190, 30, 45];
        // test line — present unless "negative" (derived from seed)
        const testLine = byteAt(0) % 5 !== 0;
        if (testLine && x >= 220 && x < 232 && y >= 120 && y < 168) {
          px = byteAt(1) % 3 === 0 ? [30, 90, 170] : [20, 120, 60];
        }
        // subtle noise for realism
        const n = byteAt((x * 7 + y * 13) % hash.length) % 12;
        px = [px[0] - n, px[1] - n, px[2] - n];
      }
      const off = 1 + x * 3;
      row[off] = Math.max(0, Math.min(255, px[0]));
      row[off + 1] = Math.max(0, Math.min(255, px[1]));
      row[off + 2] = Math.max(0, Math.min(255, px[2]));
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
