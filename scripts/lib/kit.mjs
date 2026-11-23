// The drawing kit: paper and ink, one typeface, windows, and motion borrowed from older machines.
// Everything here writes plain SVG with CSS animation, because a README image runs no script.
import { readFileSync } from 'node:fs';

export const THEMES = {
  light: { name: 'light', paper: '#fbfbf9', ink: '#151515', ink2: '#4a4a46', ink3: '#6c6c67', rule: '#d6d6d1', rule2: '#bfbfb9' },
  dark: { name: 'dark', paper: '#151515', ink: '#f2f2ef', ink2: '#b9b9b3', ink3: '#8f8f89', rule: '#33332f', rule2: '#4c4c47' },
};

/** IBM Plex Mono's advance width, in em. Every glyph is placed by it, so nothing depends on the viewer's fonts. */
export const CH = 0.6;

export const r = v => +(+v).toFixed(2);
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- ordered dither ---------- */

export function bayer(n) {
  let m = [[0, 2], [3, 1]];
  while (m.length < n) {
    const s = m.length, o = [];
    for (let y = 0; y < s * 2; y++) {
      o.push([]);
      for (let x = 0; x < s * 2; x++) o[y].push(4 * m[y % s][x % s] + [[0, 2], [3, 1]][(y / s) | 0][(x / s) | 0]);
    }
    m = o;
  }
  return m.flat();
}
export const B4 = bayer(4), B8 = bayer(8);

/** Seeded randomness, the same generator the site uses, so a miniature here matches the one there. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Greedy word wrap to a column count. */
export function wrap(str, cols) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    if (line && (line + ' ' + word).length > cols) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------- the typeface, carried inside each drawing ---------- */

const FONT_DIR = new URL('../../fonts/', import.meta.url);
const faces = new Map();
function face(weight, symbols) {
  const key = weight + (symbols ? 's' : '');
  if (!faces.has(key)) {
    const b64 = readFileSync(new URL(`ibm-plex-mono-${weight}${symbols ? '-symbols' : ''}.woff2`, FONT_DIR)).toString('base64');
    faces.set(key, `@font-face{font-family:Plex;font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2")${symbols ? ';unicode-range:U+2190-2193,U+2197,U+2713' : ''}}`);
  }
  return faces.get(key);
}

/* ---------- one drawing ---------- */

export class Doc {
  constructor(w, h, theme, { weights = [400], label = '' } = {}) {
    this.w = w; this.h = h; this.t = theme; this.weights = weights; this.label = label;
    this.kfs = new Map(); this.rules = new Set(); this.defs = new Map(); this.out = []; this.uid = 0;
  }

  add(...parts) { this.out.push(...parts); return this; }
  kf(name, body) { this.kfs.set(name, body); return name; }
  css(rule) { this.rules.add(rule); return this; }

  /** A one-bit ordered-dither fill, 2px cells: `level` of 16. `bg` makes the tile opaque. */
  pat(level, color = this.t.ink, bg = null) {
    const k = clamp(Math.round(level), 0, 16);
    const id = `p${k}${color === this.t.ink ? '' : color === this.t.paper ? 'p' : color.slice(1)}${bg ? 'o' : ''}`;
    if (!this.defs.has(id)) {
      let d = '';
      for (let i = 0; i < 16; i++) if (B4[i] < k) d += `M${(i & 3) * 2} ${(i >> 2) * 2}h2v2h-2z`;
      this.defs.set(id, `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">${bg ? `<rect width="8" height="8" fill="${bg}"/>` : ''}<path d="${d}" fill="${color}" shape-rendering="crispEdges"/></pattern>`);
    }
    return `url(#${id})`;
  }

  rect(x, y, w, h, fill, extra = '') {
    return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${fill}"${extra}/>`;
  }

  text(x, y, str, { size = 13, weight = 400, fill = this.t.ink, anchor, ls, extra = '' } = {}) {
    return `<text x="${r(x)}" y="${r(y)}" font-size="${size}"${weight !== 400 ? ` font-weight="${weight}"` : ''} fill="${fill}"${anchor ? ` text-anchor="${anchor}"` : ''}${ls ? ` letter-spacing="${ls}"` : ''}${extra}>${esc(str)}</text>`;
  }

  /** A window: a hairline frame with a one-pixel shadow, a pinstriped title bar and a close box. */
  win(x, y, w, h, title) {
    const { ink, paper } = this.t;
    const tw = Math.ceil(title.length * CH * 11.5) + 18, cx = x + w / 2;
    let stripes = '';
    for (let i = 0; i < 6; i++) stripes += `M${x + 4} ${y + 5 + i * 2}h${w - 8}v1h${-(w - 8)}z`;
    return `<g class="c">`
      + this.rect(x + 1, y + 1, w, h, ink) + this.rect(x, y, w, h, ink) + this.rect(x + 1, y + 1, w - 2, h - 2, paper)
      + `<path d="${stripes}" fill="${ink}"/>` + this.rect(x + 1, y + 21, w - 2, 1, ink)
      + this.rect(x + 8, y + 3, 15, 15, paper) + this.rect(x + 10, y + 5, 11, 11, ink) + this.rect(x + 11, y + 6, 9, 9, paper)
      + this.rect(Math.round(cx - tw / 2), y + 2, tw, 18, paper)
      + `</g>` + this.text(cx, y + 15, title, { size: 11.5, anchor: 'middle' });
  }

  /** Text that types itself in behind a block caret. `at` in seconds, `cps` characters a second. */
  typed(x, y, str, { size = 13, weight = 400, fill = this.t.ink, at = 0, cps = 30 } = {}) {
    const cw = CH * size, chars = [...str];
    let s = `<text y="${r(y)}" font-size="${size}"${weight !== 400 ? ` font-weight="${weight}"` : ''} fill="${fill}">`;
    chars.forEach((c, i) => {
      if (c !== ' ') s += `<tspan x="${r(x + i * cw)}" class="t" style="animation-delay:${r(at + (i + 1) / cps)}s">${esc(c)}</tspan>`;
    });
    s += '</text>';
    const name = this.kf(`c${this.uid++}`, `from{visibility:visible;transform:translateX(0)}to{visibility:visible;transform:translateX(${r(chars.length * cw)}px)}`);
    s += `<rect class="tc" x="${r(x)}" y="${r(y - size * 0.92)}" width="${r(cw)}" height="${r(size * 1.16)}" fill="${this.t.ink}" style="animation:${name} ${r(chars.length / cps)}s steps(${chars.length},end) ${r(at)}s"/>`;
    return s;
  }

  /** A dithered dissolve: four Bayer masks of paper lifted off whatever lies beneath, in steps. */
  dz(x, y, w, h, at, step = 0.07) {
    const { paper } = this.t;
    return [4, 8, 12, 16].map((k, i) =>
      this.rect(x, y, w, h, k === 16 ? paper : this.pat(k, paper), ` class="o" style="animation-duration:${r(at + (3 - i) * step)}s"`)).join('');
  }

  /**
   * Attributes that keep an element visible from t0 to t1 of a loop P seconds long.
   * The settled drawing (reduced motion) shows it, unless `tmp` marks it as passing.
   */
  show(t0, t1, P, tmp = false) {
    if (t0 <= 0 && t1 >= P) return tmp ? ' class="tmp"' : '';
    const pct = r(((t1 - t0) / P) * 100);
    const name = this.kf(`v${String(pct).replace('.', '_')}`, `0%{visibility:visible}${pct}%,100%{visibility:hidden}`);
    return ` class="an${tmp ? ' tmp' : ''}" style="animation:${name} ${r(P)}s steps(1) ${r(t0 - P)}s infinite"`;
  }

  /** Children shown one at a time, each for an equal share of the loop. The first is the settled one. */
  frames(items, P, wrapEach = s => s) {
    const dt = P / items.length;
    return items.map((it, i) => `<g${this.show(i * dt, (i + 1) * dt, P, i > 0)}>${wrapEach(it)}</g>`).join('');
  }

  toString() {
    const css = [
      ...this.weights.map(w => face(w)), face(400, true),
      'text{font-family:Plex,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.c{shape-rendering:crispEdges}',
      '@keyframes hid{from{opacity:0}to{opacity:0}}@keyframes vis{from{visibility:visible}to{visibility:visible}}@keyframes blink{50%{opacity:0}}',
      '.t{animation:hid 1ms linear backwards}.o{visibility:hidden;animation:vis linear}.tc{visibility:hidden}.caret{animation:blink 1.06s steps(1) infinite}',
      ...[...this.kfs].map(([name, body]) => `@keyframes ${name}{${body}}`),
      ...this.rules,
      '@media (prefers-reduced-motion:reduce){.t,.o,.tc,.caret,.an,.st{animation:none!important}.mv{animation-play-state:paused!important}.tmp{display:none}}',
    ].join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}" role="img" aria-label="${esc(this.label)}">`
      + `<title>${esc(this.label)}</title><style>${css}</style>`
      + (this.defs.size ? `<defs>${[...this.defs.values()].join('')}</defs>` : '')
      + this.out.join('') + '</svg>\n';
  }
}
