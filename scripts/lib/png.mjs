// A one-bit PNG writer: a two-colour palette, one bit a pixel. Enough to carry a dithered frame inside an SVG.
import { deflateSync } from 'node:zlib';

const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * bits: w*h values, 1 where the `on` colour goes. `off` null leaves those pixels transparent.
 * `scale` repeats each pixel, so the picture stays sharp however the viewer resamples it.
 */
export function png1(w, h, bits, { on, off = null, scale = 1 }) {
  const W = w * scale, H = h * scale, stride = Math.ceil(W / 8);
  const raw = Buffer.alloc((stride + 1) * H);
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(stride);
    for (let x = 0; x < w; x++) {
      if (!bits[y * w + x]) continue;
      for (let s = 0; s < scale; s++) { const X = x * scale + s; row[X >> 3] |= 0x80 >> (X & 7); }
    }
    for (let s = 0; s < scale; s++) {
      const o = (y * scale + s) * (stride + 1);
      if (s === 0) row.copy(raw, o + 1);   // filter 0: the row itself
      else raw[o] = 2;                     // filter 2: same as the row above, so all zeros
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 1; ihdr[9] = 3;
  const parts = [chunk('IHDR', ihdr), chunk('PLTE', Buffer.from([...(off || [0, 0, 0]), ...on]))];
  if (!off) parts.push(chunk('tRNS', Buffer.from([0, 255])));
  parts.push(chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...parts]);
}

export const dataUri = png => `data:image/png;base64,${png.toString('base64')}`;
