// Elsewhere: each link drawn the way the site draws a hovered one — a selection, ink behind and paper in front.
import { Doc, CH } from '../lib/kit.mjs';

export const LINKS = [
  { key: 'site', label: 'marcus.gg', href: 'https://marcus.gg' },
  { key: 'x', label: 'X · @nerhhx', href: 'https://x.com/nerhhx' },
];

export function link(theme, l) {
  const { ink, paper } = theme, size = 12.5, tw = (l.label.length + 2) * CH * size;
  const w = Math.ceil(tw) + 28, d = new Doc(w + 10, 40, theme, { label: l.label });
  d.kf('up', '0%,76%{transform:none}88%{transform:translate(2px,-2px)}100%{transform:none}');
  d.add(d.rect(5, 5, w, 30, ink, ' class="c"'), d.text(19, 24.5, l.label, { size, fill: paper }));
  d.add(`<g class="st" style="animation:up 3s steps(3,end) 1.4s infinite">` + d.text(5 + w - 14, 24.5, '↗', { size, fill: paper, anchor: 'end' }) + '</g>');
  return d.toString();
}
