// Fig. 1 — the sphere from marcus.gg: shaded per pixel (diffuse, specular, a rim on the unlit side,
// a turning globe grid), then reduced to one bit with an 8×8 Bayer dither. Ported from the site's core.js.
import { B8 } from './kit.mjs';

/**
 * Returns N*N bits. On paper a set bit is ink, so it marks the dark pixels. With `lit` the sphere is
 * drawn for a dark ground instead: a set bit is a lit pixel, and there is no floor shadow to cast.
 */
export function shadeOrb(N, s, { lit = false } = {}) {
  const bits = new Uint8Array(N * N);
  const ln = Math.hypot(s.lx, s.ly, s.lz) || 1;
  const lx = s.lx / ln, ly = s.ly / ln, lz = s.lz / ln;
  let hx = lx, hy = ly, hz = lz + 1;
  const hn = Math.hypot(hx, hy, hz) || 1; hx /= hn; hy /= hn; hz /= hn;
  const cx = N * 0.5, cy = N * (s.cy || 0.44), R = N * (s.r || 0.33);
  const T = 0.38, cT = Math.cos(T), sT = Math.sin(T), TAU = Math.PI * 2;
  const floor = s.floor !== false && !lit;
  const shx = cx - lx * R * 0.55, shy = cy + R * 1.16, srx = R * 0.95, sry = R * 0.2;
  for (let y = 0, i = 0; y < N; y++) {
    const row = (y & 7) << 3;
    const dy = (y + 0.5 - cy) / R;
    for (let x = 0; x < N; x++, i++) {
      const dx = (x + 0.5 - cx) / R;
      const r2 = dx * dx + dy * dy;
      let I = 1;
      if (r2 <= 1) {
        const nz = Math.sqrt(1 - r2);
        const diff = Math.max(0, dx * lx + dy * ly + nz * lz);
        const sp = Math.max(0, dx * hx + dy * hy + nz * hz);
        I = 0.1 + 0.82 * diff + 0.6 * Math.pow(sp, 36);
        if (s.grid) {
          // a tilted globe: twelve meridians and five parallels turning with the sphere
          const yy = dy * cT - nz * sT, zz = dy * sT + nz * cT;
          const lat = Math.asin(Math.max(-1, Math.min(1, -yy)));
          let fm = ((Math.atan2(dx, zz) + s.rot) / TAU) * 12; fm -= Math.floor(fm);
          let fp = (lat / Math.PI + 0.5) * 6; fp -= Math.floor(fp);
          const on = ((fm < 0.018 || fm > 0.982) && Math.abs(lat) < 1.3) || ((fp < 0.024 || fp > 0.976) && Math.abs(lat) < 1.4);
          if (on) I = diff > 0.18 ? I * 0.38 : 0.36;
        }
        if (diff < 0.2) I += Math.pow(1 - nz, 4) * 0.35;
      } else if (lit) {
        continue;
      } else if (floor) {
        const ex = (x + 0.5 - shx) / srx, ey = (y + 0.5 - shy) / sry, e2 = ex * ex + ey * ey;
        if (e2 < 1) I = 0.52 + 0.48 * e2;
      }
      const dark = I < (B8[row + (x & 7)] + 0.5) / 64;
      bits[i] = lit ? (dark ? 0 : 1) : (dark ? 1 : 0);
    }
  }
  return bits;
}
