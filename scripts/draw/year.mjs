// Fig. 2 — a year of contributions as a skyline: one block a day, seven rows deep, drawn in one bit.
// Height is the day's count (square-rooted, so a quiet day still stands up); the face darkens with it.
import { Doc, r } from '../lib/kit.mjs';
import { dayMonth, dayMonthYear, month } from '../lib/data.mjs';

const W = 820, H = 326;
const X0 = 44, YF = 190;      // the front row's left end, on the ground
const CW = 13, RD = 6;        // a week's pitch along the street; a row's step back
const tile = (x, y) => `M${x} ${y}l4 -4h9l-4 4z`;

export function year(theme, { calendar, stats }) {
  const { ink, ink3, paper, rule, rule2 } = theme;
  const d = new Doc(W, H, theme, {
    weights: [400, 500],
    label: `Fig. 2: ${stats.total.toLocaleString('en-GB')} contributions in the last year, drawn as a one-bit skyline. ${stats.active} active days, a longest streak of ${stats.longest} days, and a busiest day of ${stats.busiest.count} on ${dayMonth(stats.busiest.date)}.`,
  });
  d.add(d.win(5, 5, 810, 314, 'Contributions'));

  const weeks = calendar.weeks;
  const pos = (w, wd) => [X0 + w * CW + (6 - wd) * RD + 0.5, YF - (6 - wd) * RD + 0.5];
  const height = c => Math.round(6 + 90 * Math.sqrt(c / stats.max));
  const counts = weeks.flat().map(x => x[1]).filter(Boolean).sort((a, b) => a - b);
  const q = f => counts[Math.floor((counts.length - 1) * f)] || 0;
  const level = c => (c > q(0.75) ? 11 : c > q(0.5) ? 8 : c > q(0.25) ? 5 : 3);

  // painter's order: the far row first, each row left to right
  let ground = '', blocks = '';
  for (let wd = 0; wd < 7; wd++) {
    weeks.forEach((week, w) => {
      const day = week.find(x => x[2] === wd);
      if (!day) return;
      const [x, y] = pos(w, wd), c = day[1];
      ground += tile(x, y);
      if (!c) return;
      const h = height(c);
      blocks += `<g class="t" style="animation-delay:${r(0.3 + w * 0.035)}s">`
        + `<path d="M${x} ${y}v${-h}h9v${h}z" fill="${d.pat(level(c), ink, paper)}"/>`
        + `<path d="${tile(x, y - h)}" fill="${paper}"/>`
        + `<path d="M${x + 9} ${y}l4 -4v${-h}l-4 4z" fill="${ink}"/></g>`;
    });
  }
  d.add(`<path d="${ground}" fill="none" stroke="${rule2}"/>`);
  d.add(`<g stroke="${ink}" stroke-linejoin="round">${blocks}</g>`);

  // tomorrow's plot, blinking like a caret
  const last = weeks.at(-1).at(-1);
  const [nx, ny] = last[2] === 6 ? pos(weeks.length, 0) : pos(weeks.length - 1, last[2] + 1);
  d.add(`<path class="caret" d="${tile(nx, ny)}" fill="${ink}" stroke="${ink}"/>`);

  // months along the kerb; a label gives way when the next one would crowd it
  let labels = [];
  weeks.forEach((week, w) => { if (!w || month(week[0][0]) !== month(weeks[w - 1][0][0])) labels.push({ w, m: month(week[0][0]) }); });
  labels = labels.filter((l, i) => !labels[i + 1] || labels[i + 1].w - l.w >= 3);
  for (const l of labels) d.add(d.text(X0 + l.w * CW, YF + 17, l.m, { size: 10.5, fill: ink3 }));

  d.add(d.rect(30, 220, 760, 1, rule, ' class="c"'));
  d.add(d.text(30, 237, 'Fig. 2 — one year of commits, 1-bit', { size: 11, fill: ink3 }));
  d.add(d.text(790, 237, `${dayMonthYear(stats.first)} — ${dayMonthYear(stats.last)}`, { size: 11, fill: ink3, anchor: 'end' }));
  d.add(d.dz(30, 223, 760, 20, 0.3));

  const figures = [
    [stats.total.toLocaleString('en-GB'), 'contributions'],
    [String(stats.active), 'active days'],
    [`${stats.longest} days`, 'longest streak'],
    [String(stats.busiest.count), `busiest day · ${dayMonth(stats.busiest.date)}`],
  ];
  figures.forEach(([figure, label], i) => {
    const x = 30 + i * 190, at = 2.3 + i * 0.22;
    d.add(d.typed(x, 277, figure, { size: 26, weight: 500, at, cps: 24 }));
    d.add(d.text(x, 297, label.toUpperCase(), { size: 10, fill: ink3, ls: 0.8 }), d.dz(x - 1, 286, 186, 16, at + 0.25));
  });
  return d.toString();
}
