// The two small windows that sit side by side: the spec list from the site's About band, and the
// language split across every repository, each language a different dither density.
import { Doc, r } from '../lib/kit.mjs';

const W = 410, H = 207;

const SPEC = [
  ['Based', 'United Kingdom'],
  ['Now', 'Umbra, in beta'],
  ['Work', 'Browser tooling, data apps'],
  ['Stack', 'TypeScript, Node, Go, Electron'],
  ['Off hours', 'LEGO, family'],
];

export function about(theme) {
  const { ink3, rule } = theme;
  const d = new Doc(W, H, theme, { label: 'About. ' + SPEC.map(([k, v]) => `${k}: ${v}.`).join(' ') });
  d.add(d.win(5, 5, 400, 195, 'About'));
  SPEC.forEach(([term, value], i) => {
    const y = 34 + i * 31;
    d.add(d.text(24, y + 20, term, { size: 12.5, fill: ink3 }), d.text(120, y + 20, value, { size: 12.5 }));
    if (i < SPEC.length - 1) d.add(d.rect(24, y + 31, 362, 1, rule, ' class="c"'));
    d.add(d.dz(24, y + 4, 362, 24, 0.3 + i * 0.14));
  });
  return d.toString();
}

const SHOWN = 5;
const DENSITY = [16, 8, 4, 12, 2, 0];   // neighbours are kept far apart, so a thin slice still reads

export function languages(theme, { languages: all }) {
  const { ink, ink2, ink3, paper } = theme;
  const top = all.slice(0, SHOWN);
  const rest = all.slice(SHOWN).reduce((a, [, p]) => a + p, 0);
  const rows = rest > 0.05 ? [...top, ['Other', rest]] : top;
  const pct = p => `${p.toFixed(1)}%`;
  const d = new Doc(W, H, theme, { label: 'Languages, by bytes across every repository. ' + rows.map(([n, p]) => `${n} ${pct(p)}`).join(', ') + '.' });
  d.add(d.win(5, 5, 400, 195, 'Languages'));
  d.add(d.text(24, 50, 'Every repository, by bytes', { size: 10.5, fill: ink3 }), d.dz(24, 38, 362, 18, 0.3));

  // the bar: every slice gets at least three pixels, the widest gives up the difference
  const bx = 24, by = 62, bw = 362, bh = 18, inner = bw - 2 - (rows.length - 1);
  const widths = rows.map(([, p]) => Math.max(3, Math.round((inner * p) / 100)));
  widths[0] += inner - widths.reduce((a, b) => a + b, 0);
  d.add(`<g class="c">` + d.rect(bx, by, bw, bh, ink) + d.rect(bx + 1, by + 1, bw - 2, bh - 2, paper) + `</g>`);
  let x = bx + 1;
  rows.forEach(([name, p], i) => {
    const fill = DENSITY[i] === 16 ? ink : DENSITY[i] === 0 ? paper : d.pat(DENSITY[i], ink, paper);
    const at = r(0.45 + i * 0.12);
    d.add(`<g class="t c" style="animation-delay:${at}s">` + d.rect(x, by + 1, widths[i], bh - 2, fill)
      + (i < rows.length - 1 ? d.rect(x + widths[i], by + 1, 1, bh - 2, ink) : '') + `</g>`);
    x += widths[i] + 1;

    const lx = 24 + (i % 2) * 188, ly = 104 + Math.floor(i / 2) * 27;
    d.add(`<g class="t" style="animation-delay:${at}s"><g class="c">` + d.rect(lx, ly, 11, 11, ink) + d.rect(lx + 1, ly + 1, 9, 9, fill) + `</g>`
      + d.text(lx + 20, ly + 10, name, { size: 12 }) + d.text(lx + 174, ly + 10, pct(p), { size: 12, fill: ink2, anchor: 'end' }) + `</g>`);
  });
  return d.toString();
}
