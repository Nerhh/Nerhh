// The first window: who, what, and Fig. 1 — the sphere, booting from coarse blocks to fine dither,
// then turning under a slowly swinging light. Eighty one-bit frames, each a few hundred bytes.
import { Doc, CH, hex } from '../lib/kit.mjs';
import { shadeOrb } from '../lib/orb.mjs';
import { png1, dataUri } from '../lib/png.mjs';

const W = 820, H = 342;
const S = 252, CELL = 3, N = S / CELL;          // the figure: 84 × 84 cells of 3px
const FRAMES = 80, DT = 0.12, LOOP = FRAMES * DT;
const TAU = Math.PI * 2;

// one loop swings the light once and turns the globe by four of its twelve meridians, so it closes on itself
const state = i => ({
  rot: 0.9 - (i / FRAMES) * (TAU / 3),
  lx: -0.55 + 0.35 * Math.sin((i / FRAMES) * TAU),
  ly: -0.42 + 0.22 * Math.cos((i / FRAMES) * TAU),
  lz: 0.8, grid: true, r: 0.4, cy: 0.45,
});

export function hero(theme) {
  const { ink, ink2, ink3, paper, rule } = theme, lit = theme.name === 'dark';
  const d = new Doc(W, H, theme, {
    weights: [400, 500],
    label: 'Marcus. Software developer, UK. I build tools that take care of the boring work. Currently building Umbra. Fig. 1: a sphere drawn in one-bit dither.',
  });
  d.add(d.win(5, 5, 810, 330, 'README.md'));

  /* ---------- the words ---------- */
  const x = 46;
  d.add(d.typed(x, 130, 'Marcus', { size: 66, weight: 500, at: 0.22, cps: 13 }));
  d.add(d.typed(x, 164, 'Software developer, UK', { size: 13, fill: ink2, at: 0.98, cps: 26 }));
  d.add(d.text(x, 208, 'I build tools that take care', { size: 16 }), d.text(x, 234, 'of the boring work.', { size: 16 }));
  d.add(d.dz(x - 2, 192, 280, 50, 1.64));
  const lead = 'Currently building ', ux = x + lead.length * CH * 13, uw = 5 * CH * 13;
  d.add(d.text(x, 278, lead, { size: 13, fill: ink2 }), d.text(ux, 278, 'Umbra', { size: 13, fill: ink2 }));
  d.add(d.rect(ux, 281, uw, 1, ink2, ' class="c"'), d.rect(ux + uw + 4, 265.5, 8, 15.5, ink, ' class="caret"'));
  d.add(d.dz(x - 2, 264, 220, 20, 1.98));

  /* ---------- Fig. 1 ---------- */
  const fx = 522, fy = 43, on = hex(ink);
  const img = (png, extra) => `<image class="px${extra.cls || ''}" x="${fx}" y="${fy}" width="${S}" height="${S}" href="${dataUri(png)}"${extra.style ? ` style="${extra.style}"` : ''}/>`;
  d.css('.px{image-rendering:pixelated}');
  d.kf('fr', `0%{visibility:visible}${100 / FRAMES}%,100%{visibility:hidden}`);
  d.css(`.f{visibility:hidden;animation:fr ${LOOP}s steps(1) infinite}`);
  d.css('@media (prefers-reduced-motion:reduce){.f{animation:none!important}.f0{visibility:visible}}');
  for (let i = 0; i < FRAMES; i++) {
    const png = png1(N, N, shadeOrb(N, state(i), { lit }), { on, scale: 6 });
    d.add(img(png, { cls: i ? ' f' : ' f f0', style: `animation-delay:${+(i * DT).toFixed(2)}s` }));
  }
  // boot: coarse blocks first, each lifted off in turn until the fine dither underneath is showing
  [18, 12, 9, 6, 4].forEach((cell, i) => {
    const n = S / cell;
    const png = png1(n, n, shadeOrb(n, state(0), { lit }), { on, off: hex(paper), scale: cell * 2 });
    d.out.splice(d.out.length - i, 0, img(png, { cls: ' o', style: `animation-duration:${(0.38 + i * 0.13).toFixed(2)}s` }));
  });
  d.add(d.rect(fx, 302, S, 1, rule, ' class="c"'));
  d.add(d.text(fx, 319, 'Fig. 1 — sphere, 1-bit', { size: 11, fill: ink3 }), d.text(fx + S, 319, `${N} × ${N}`, { size: 11, fill: ink3, anchor: 'end' }));
  d.add(d.dz(fx, 305, S, 20, 1.4));
  return d.toString();
}
