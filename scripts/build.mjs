// Draws everything on the profile. No dependencies: `node scripts/build.mjs`.
//   --offline   draw from data/ without asking GitHub
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, hex } from './lib/kit.mjs';
import { load } from './lib/data.mjs';
import { shadeOrb } from './lib/orb.mjs';
import { png1 } from './lib/png.mjs';
import { hero } from './draw/hero.mjs';
import { year } from './draw/year.mjs';
import { about, languages } from './draw/side.mjs';
import { PROJECTS, project } from './draw/projects.mjs';
import { LINKS, link } from './draw/links.mjs';

const OUT = new URL('../assets/', import.meta.url);
mkdirSync(OUT, { recursive: true });
let bytes = 0;
const put = (name, body) => { writeFileSync(new URL(name, OUT), body); bytes += body.length; };

const data = await load({ offline: process.argv.includes('--offline') });

for (const theme of Object.values(THEMES)) {
  const t = theme.name;
  put(`hero-${t}.svg`, hero(theme));
  put(`year-${t}.svg`, year(theme, data));
  put(`about-${t}.svg`, about(theme));
  put(`languages-${t}.svg`, languages(theme, data));
  for (const p of PROJECTS) put(`${p.key}-${t}.svg`, project(theme, p));
  for (const l of LINKS) put(`link-${l.key}-${t}.svg`, link(theme, l));

  // the sphere again, as a profile picture: 115 cells across, eight pixels a cell
  const lit = t === 'dark';
  const orb = shadeOrb(115, { rot: 0.5, lx: -0.6, ly: -0.55, lz: 0.7, grid: true, cy: 0.5, r: 0.46, floor: false }, { lit });
  put(`avatar-${t}.png`, png1(115, 115, orb, { on: hex(theme.ink), off: hex(theme.paper), scale: 8 }));
}

console.log(`drew ${data.stats.total} contributions across ${data.calendar.weeks.length} weeks; ${(bytes / 1024).toFixed(0)} KB in assets/`);
