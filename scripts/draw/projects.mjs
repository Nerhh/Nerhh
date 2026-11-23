// One window per project, each with a live miniature that is true to what the project does.
// The miniatures are the ones on marcus.gg, redrawn as stepped CSS timelines: same seeds, same numbers.
import { Doc, r, rng, wrap, hex, clamp } from '../lib/kit.mjs';
import { png1, dataUri } from '../lib/png.mjs';

const W = 410, H = 271, MW = 398, MH = 124;

/* ---------- Umbra: five sealed partitions; cookies bounce inside their own, never across ---------- */
function umbra(d) {
  const { ink, ink2, ink3 } = d.t, R = rng(7);
  const x0 = 14, x1 = 384, cw = 74, top = 30, bot = 90;
  d.kf('ux', `to{transform:translateX(${cw - 20}px)}`);
  d.kf('uy', `to{transform:translateY(${bot - top - 20}px)}`);
  let s = '', walls = `M${x0} ${top}h${x1 - x0}v1h${x0 - x1}zM${x0} ${bot}h${x1 - x0 + 1}v1h${x0 - x1 - 1}zM${x1} ${top}h1v${bot - top}h-1z`;
  ['GB', 'US', 'DE', 'AU', 'CA'].forEach((region, c) => {
    const cx = x0 + c * cw, mid = cx + cw / 2;
    s += d.rect(cx + 6, 9, cw - 12, 1, ink) + d.text(cx + 6, 22, `tab ${c + 1}`, { size: 10, fill: ink2 });
    for (let k = 0, n = 5 + ((R() * 3) | 0); k < n; k++) {
      const tx = 2.4 + R() * 2.6, ty = 1.9 + R() * 2.4;
      s += `<g class="mv" style="animation:ux ${r(tx)}s linear ${r(-R() * tx * 2)}s infinite alternate">`
        + d.rect(cx + 8, top + 8, 4, 4, ink, ` class="mv" style="animation:uy ${r(ty)}s linear ${r(-R() * ty * 2)}s infinite alternate"`) + '</g>';
    }
    walls += `M${cx} ${top}h1v${bot - top}h-1z` + (c ? `M${cx + 2} ${top}h1v${bot - top}h-1z` : '');
    let exit = '';
    for (let y = bot + 5; y < bot + 14; y += 3) exit += `M${mid} ${y}h1v1h-1z`;
    s += `<path d="${exit}" fill="${ink3}"/>` + d.text(mid + 0.5, bot + 27, region, { size: 11, anchor: 'middle' });
  });
  return s + `<path d="${walls}" fill="${ink}"/>`;
}

/* ---------- Vestra: the total steps to each day's snapshot while the history pans a day at a time ---------- */
function vestra(d) {
  const { ink, ink2, ink3 } = d.t, R = rng(11), days = [];
  let v = 112000;
  for (let i = 0; i < 100; i++) { v += (R() - 0.4) * 820; if (i % 47 === 30) v += 3800; days.push(v); }
  const WIN = 60, STEPS = 8, P = STEPS * 1.2, PITCH = 6, FROM = 12;
  const span = days.slice(FROM, FROM + WIN + STEPS - 1);
  const lo = Math.min(...span) - 900, hi = Math.max(...span) + 500;
  const top = 72, bot = 110, X = i => 16 + i * PITCH, Y = val => r(bot - (bot - top) * ((val - lo) / (hi - lo)));
  const gbp = n => '£' + Math.round(n).toLocaleString('en-GB');
  const steps = [];
  for (let k = 0; k < STEPS; k++) {
    const now = span[k + WIN - 1], delta = now - span[k];
    steps.push(d.text(16, 56, gbp(now), { size: 26 })
      + d.text(382, 56, `${delta >= 0 ? '+' : '−'}${gbp(Math.abs(delta))} over 60 days`, { size: 10.5, fill: ink2, anchor: 'end' })
      + d.rect(X(WIN - 1) - 2, Y(now) - 2, 5, 5, ink));
  }
  const pts = span.map((val, i) => `${X(i)},${Y(val)}`).join(' ');
  d.defs.set('vc', `<clipPath id="vc"><rect x="16" y="${top - 6}" width="${(WIN - 1) * PITCH + 1}" height="${bot - top + 6}"/></clipPath>`);
  d.kf('vp', `to{transform:translateX(${-STEPS * PITCH}px)}`);
  return d.text(16, 22, 'net worth · daily snapshot', { size: 10.5, fill: ink3 })
    + `<g clip-path="url(#vc)"><g class="st" style="animation:vp ${r(P)}s steps(${STEPS},end) infinite" shape-rendering="geometricPrecision">`
    + `<polygon points="${X(0)},${bot} ${pts} ${X(span.length - 1)},${bot}" fill="${d.pat(3)}"/>`
    + `<polyline points="${pts}" fill="none" stroke="${ink}" stroke-width="1.25"/></g></g>`
    + d.rect(16, bot, 366, 1, ink) + d.frames(steps, P);
}

/* ---------- Dial: listings land on a price axis; the cheap outliers are cut; the lowest twenty are averaged ---------- */
function dial(d) {
  const { ink, ink2, ink3 } = d.t, R = rng(23), prices = [];
  for (let i = 0; i < 34; i++) prices.push(Math.round((3000 + (R() + R() + R() - 1.5) * 1400) / 10) * 10);
  prices.push(1450, 1620, 1780); // fakes and parts listings
  const sorted = prices.slice().sort((a, b) => a - b), mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const floor = median * 0.6, kept = sorted.filter(p => p >= floor), low = kept.slice(0, 20);
  const avg = low.reduce((a, b) => a + b, 0) / low.length, excluded = sorted.length - kept.length;
  const lo = 1200, hi = Math.max(...prices) + 300, BINS = 26, stackOf = {};
  const bin = p => Math.min(BINS - 1, Math.floor(((p - lo) / (hi - lo)) * BINS));
  const items = sorted.map((p, i) => { const b = bin(p); const k = (stackOf[b] = (stackOf[b] || 0) + 1); return { p, b, k: k - 1, drop: 120 + R() * 1100, low: i - excluded < 20 && p >= floor }; });
  const gbp = n => '£' + Math.round(n).toLocaleString('en-GB');

  const P = 9, END = 7.9, ax = 18, bx = 380, base = 84, bw = (bx - ax) / BINS, sq = 5;
  const X = p => ax + (bx - ax) * ((p - lo) / (hi - lo)), fx = Math.round(X(floor)), mx = Math.round(X(median));
  let s = d.text(ax, 18, 'Pulling market data…', { size: 11.5, extra: d.show(0, 3.5, P, true) })
    + d.text(ax, 18, `${gbp(low[0])} lowest comparable ask`, { size: 11.5, extra: d.show(3.5, END, P) });
  let axis = `M${ax} ${base}h${bx - ax}v1h${ax - bx}z`;
  for (let b = 0; b <= BINS; b += 2) axis += `M${Math.round(ax + b * bw)} ${base + 1}h1v3h-1z`;
  s += `<path d="${axis}" fill="${ink}"/>`;
  for (const it of items) {
    const x = Math.round(ax + it.b * bw + (bw - sq) / 2), y = base - 3 - (it.k + 1) * (sq + 2), t0 = it.drop / 1000;
    if (it.p < floor) {
      const cut = 2.4 + 0.8 * clamp((x - ax) / (fx - ax), 0, 1);
      s += d.rect(x, y, sq, sq, ink, d.show(t0, cut, P, true))
        + `<rect x="${x + 0.5}" y="${y + 0.5}" width="${sq - 1}" height="${sq - 1}" fill="none" stroke="${ink3}" stroke-dasharray="1 1"${d.show(cut, END, P)}/>`;
    } else if (it.low) s += d.rect(x, y, sq, sq, ink, d.show(t0, END, P));
    else s += d.rect(x, y, sq, sq, ink, d.show(t0, 3.5, P, true)) + d.rect(x, y, sq, sq, d.pat(7), d.show(3.5, END, P));
  }
  let dash = '';
  for (let y = 40; y < base; y += 4) dash += `M${mx} ${y}h1v2h-1z`;
  s += `<g${d.show(1.9, END, P)}><path d="${dash}" fill="${ink2}"/>` + d.text(mx + 6, 34, `median ${gbp(median)}`, { size: 10, fill: ink2 }) + '</g>';
  d.kf('dfl', `0%,26.67%{transform:translateX(${ax - fx}px)}35.56%,100%{transform:none}`);
  s += `<g${d.show(2.4, END, P)}>` + d.rect(fx, 34, 1, base - 34, ink, ` class="st" style="animation:dfl ${P}s steps(8,end) infinite"`) + '</g>';
  s += d.text(fx + 6, 43, `60% · ${excluded} excluded`, { size: 10, fill: ink2, extra: d.show(3.2, END, P) });
  const a = Math.round(X(low[0])), b = Math.round(X(low[low.length - 1])), y = base + 13;
  const label = `average of ${low.length} lowest · ${gbp(avg)}`, half = (label.length * 0.6 * 10.5) / 2;
  s += `<g${d.show(3.5, END, P)}><path d="M${a} ${y}h${b - a}v1h${a - b}zM${a} ${y - 4}h1v5h-1zM${b} ${y - 4}h1v5h-1z" fill="${ink}"/>`
    + d.text(clamp((a + b) / 2, ax + half, bx - half), y + 16, label, { size: 10.5, anchor: 'middle' }) + '</g>';
  return s;
}

/* ---------- Tessera: every listing falls into its zone; each zone becomes low, typical, high ---------- */
function tessera(d) {
  const { ink, ink2, paper, rule } = d.t, R = rng(5);
  const zones = [{ name: 'Floor', base: 240 }, { name: 'Lower', base: 160 }, { name: 'Club', base: 190 }, { name: 'Upper', base: 95 }, { name: 'Balcony', base: 70 }];
  const dots = [];
  zones.forEach((z, zi) => {
    const n = 14 + ((R() * 8) | 0);
    z.prices = [];
    for (let i = 0; i < n; i++) { const p = Math.round(z.base * (0.75 + R() * 0.6)); z.prices.push(p); dots.push({ zi, p, x0: R(), delay: R() * 1400 }); }
  });
  zones[0].prices.push(900);
  zones.forEach(z => {
    const sorted = z.prices.slice().sort((a, b) => a - b);
    const q = f => sorted[Math.floor((sorted.length - 1) * f)];
    const q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
    const inl = sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
    z.min = sorted[0]; z.max = sorted[sorted.length - 1]; z.avg = inl.reduce((a, b) => a + b, 0) / inl.length; z.trim = inl.length < sorted.length;
  });

  const P = 8.5, END = 7.5, lx = 88, rx = 380, top = 12, laneH = (MH - top - 12) / zones.length, lo = 40, hi = 420;
  const X = p => lx + (rx - lx) * clamp((p - lo) / (hi - lo), 0, 1);
  d.kf('tgrow', '0%,37.65%{transform:scaleX(0)}45.88%,100%{transform:none}');
  d.css('.tg{transform-box:fill-box;transform-origin:0 50%}');
  let s = '';
  zones.forEach((z, zi) => {
    const cy = Math.round(top + laneH * (zi + 0.5));
    // each zone keeps its own dither density, shown in a swatch beside its name
    s += d.rect(11, cy - 5, 10, 10, ink) + d.rect(12, cy - 4, 8, 8, d.pat(Math.round((0.2 + zi * 0.15) * 16), ink, paper))
      + d.text(26, cy + 3.5, z.name, { size: 10.5, fill: ink2 }) + d.rect(lx, Math.round(cy + laneH * 0.34), rx - lx, 1, rule);
    const a = Math.round(X(z.min)), b = Math.round(X(Math.min(z.max, hi))), m = Math.round(X(z.avg));
    s += `<g${d.show(3.2, END, P)}>` + d.rect(a, cy, b - a, 1, ink, ` class="st tg" style="animation:tgrow ${P}s steps(7,end) infinite"`) + d.rect(a, cy - 4, 1, 9, ink) + '</g>';
    s += `<g${d.show(3.9, END, P)}>` + d.rect(b, cy - 4, 1, 9, ink) + d.rect(m - 2, cy - 3, 5, 7, ink) + (z.trim ? d.text(m + 5, cy - 2, '*', { size: 11 }) : '') + '</g>';
  });
  // the dots land in their lanes, then thin out as the lanes collapse
  for (const dot of dots) {
    const cy = Math.round(top + laneH * (dot.zi + 0.5));
    const gone = 3.2 + 0.7 * (1 - ((dot.p + dot.zi) % 3) / 3);
    s += d.rect(Math.round(X(dot.p)) - 1, cy + ((dot.p * 7) % 9) - 5, 3, 3, ink, d.show(dot.delay / 1000, gone, P, true));
  }
  s += d.rect(rx - 5, top + 1, 3, 3, ink, d.show(1.5, END, P)) + d.text(rx - 10, top + 6, 'outlier', { size: 9.5, fill: ink2, anchor: 'end', extra: d.show(3.9, END, P) });
  return s;
}

/* ---------- Admit: the code changes on a ten-second clock; beside it, the door's log fills in ---------- */
function admit(d) {
  const { ink, ink2, ink3, paper, rule } = d.t, N = 21;
  // a code is a 21×21 one-bit matrix: three finder squares and the rest drawn from the step
  const matrix = step => {
    const R = rng(step * 2654435761), m = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) m[i] = R() < 0.5 ? 1 : 0;
    const finder = (ox, oy) => {
      for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) {
        const X = ox + x, Y = oy + y;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        m[Y * N + X] = ring === 3 || ring <= 1 ? 1 : 0;
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    return m;
  };
  const tx = 14, ty = 12, tw = 190, th = 100, qx = tx + 10, qy = ty + 18, side = N * 3, cx = qx + side + 9, cw = tx + tw - 10 - cx;
  let s = d.rect(tx, ty, tw, th, ink) + d.rect(tx + 1, ty + 1, tw - 2, th - 2, paper);
  s += d.frames([1, 2, 3].map(step => `<image x="${qx}" y="${qy}" width="${side}" height="${side}" style="image-rendering:pixelated" href="${dataUri(png1(N, N, matrix(step), { on: hex(ink), scale: 12 }))}"/>`), 30);
  s += d.text(cx, qy + 9, '7K2Q-M9XR-P4TD', { size: 10, fill: ink3 });
  // the security strip: ink, a sweeping line, a square blinking once a second
  d.kf('asw', `to{transform:translateX(${cw - 5}px)}`);
  s += d.rect(cx, qy + 18, cw, 22, ink) + d.rect(cx + 2, qy + 21, 1, 16, paper, ' class="mv" style="animation:asw 2.4s linear infinite"')
    + d.rect(cx + 6, qy + 26, 6, 6, paper, ' class="st" style="animation:blink 1s steps(1) infinite"') + d.text(cx + cw - 6, qy + 33, 'live', { size: 10.5, fill: paper, anchor: 'end' });
  s += d.frames(Array.from({ length: 10 }, (_, i) => d.text(cx, qy + 56, `New code in ${10 - i} s`, { size: 10, fill: ink2 })), 10);
  for (let i = 0; i < 10; i++) s += d.rect(cx + i * (cw / 10), qy + 62, cw / 10 - 2, 3, ink, d.show(0, 10 - i, 10));

  // the door's log, newest first
  const ATTEMPTS = [
    { what: 'live code', ok: true, res: 'Admitted' },
    { what: 'screenshot, 38 s old', ok: false, res: 'Code expired' },
    { what: 'scanned again', ok: false, res: 'Already scanned' },
    { what: 'old owner, after a transfer', ok: false, res: 'Old ticket code' },
  ];
  const P = 13, END = 12, FIRST = 0.7, EVERY = 2.6, lx = tx + tw + 18, lw = MW - lx - 14, rowH = 40;
  const at = e => FIRST + e * EVERY;
  s += d.text(lx, ty + 12, 'Main door', { size: 11 }) + d.text(lx + lw, ty + 12, '1 in', { size: 10, fill: ink3, anchor: 'end', extra: d.show(FIRST, END, P) })
    + d.rect(lx, ty + 18, lw, 1, ink) + d.text(lx, ty + 37, 'Waiting for the first scan…', { size: 10, fill: ink3, extra: d.show(0, FIRST, P, true) });
  const entry = (a, row) => {
    const y = ty + 26 + row * rowH, label = `${a.ok ? '✓' : '×'} ${a.res}`, bw = Math.ceil(label.length * 6.6) + 14;
    return d.text(lx, y + 11, a.what, { size: 10, fill: ink3 })
      + (a.ok ? d.rect(lx, y + 16, bw, 17, ink) : d.rect(lx, y + 16, bw, 17, ink) + d.rect(lx + 1, y + 17, bw - 2, 15, paper))
      + d.text(lx + 7, y + 28.5, label, { size: 11, fill: a.ok ? paper : ink });
  };
  ATTEMPTS.forEach((a, e) => {
    const last = e === ATTEMPTS.length - 1, t1 = last ? END : at(e + 1), t2 = e >= ATTEMPTS.length - 2 ? END : at(e + 2);
    s += `<g${d.show(at(e), t1, P, !last)}>${entry(a, 0)}</g>`;
    if (!last) s += `<g${d.show(t1, t2, P, t2 !== END)}>${entry(a, 1)}</g>`;
  });
  s += d.rect(lx, ty + 26 + rowH - 3, lw, 1, rule, d.show(at(1), END, P));
  return s;
}

/* ---------- TFT Copilot: a roll-down at level 8 with 30 gold for one 4-cost, beside the exact odds ---------- */
function tft(d) {
  const { ink, ink2, ink3, paper } = d.t;
  // Set 18: level-8 shop odds, a 4-cost pool of 10 copies across 14 champions; you hold 2, 20 other 4-costs are out
  const ODDS = [0.15, 0.2, 0.32, 0.3, 0.03];
  const remaining = 10 - 2, tierRemaining = 10 * 14 - 2 - 20;
  const q = (ODDS[3] * remaining) / tierRemaining;      // one slot shows the target
  const SHOPS = 14;                                     // the free shop, then 13 rolls at 2 gold, keeping 4 to buy
  const exact = k => 1 - Math.pow(1 - q, 5 * k);         // hit by the k-th shop
  const runOf = c => {
    const R = rng(1000 + c * 7919), shops = [];
    let hit = -1;
    for (let sh = 0; sh < SHOPS && hit < 0; sh++) {
      const slots = [];
      for (let i = 0; i < 5; i++) {
        let u = R(), tier = 0;
        while (tier < 4 && u > ODDS[tier]) { u -= ODDS[tier]; tier++; }
        const target = tier === 3 && R() < remaining / tierRemaining;
        slots.push({ cost: tier + 1, target });
        if (target && hit < 0) hit = sh;
      }
      shops.push(slots);
    }
    return { shops, hit };
  };
  // the first of the site's runs that takes a while to find it, so the staircase gets climbed
  let run = runOf(0);
  for (let c = 0; c < 400 && !(run.hit >= 7 && run.hit <= 11); c++) run = runOf(c);

  const n = run.shops.length, SHOP = 0.48, P = n * SHOP + 2.6, x0 = 16, x1 = 382;
  const during = s => [s * SHOP, s === n - 1 ? P : (s + 1) * SHOP, P, s !== n - 1];   // the last shop stays on the table
  let s = d.text(x0, 18, 'level 8 · one 4-cost · you hold 2', { size: 10.5, fill: ink3 });

  // the shop: five slots, each a cost tier drawn as a dither density; the target is inked in
  const sy = 28, sh = 28, sw = 68, pitch = (x1 - x0 - sw) / 4;
  for (let i = 0; i < 5; i++) { const x = Math.round(x0 + i * pitch); s += d.rect(x, sy, sw, sh, ink) + d.rect(x + 1, sy + 1, sw - 2, sh - 2, paper); }
  // the exact odds: chance of having found it by each shop, a staircase to the last affordable roll
  const cy0 = 76, cy1 = 102, X = k => x0 + (x1 - x0) * (k / SHOPS), Y = p => r(cy1 - (cy1 - cy0) * p);
  let stair = '';
  for (let k = 1; k <= SHOPS; k++) stair += ` ${r(X(k - 1))},${Y(exact(k))} ${r(X(k))},${Y(exact(k))}`;
  s += `<g shape-rendering="geometricPrecision"><polygon points="${x0},${cy1}${stair} ${x1},${cy1}" fill="${d.pat(3)}"/><polyline points="${stair.trim()}" fill="none" stroke="${ink}" stroke-width="1.25"/></g>`;
  let axis = `M${x0} ${cy1}h${x1 - x0}v1h${x0 - x1}z`;
  for (let k = 0; k <= SHOPS; k++) axis += `M${Math.round(X(k))} ${cy1 + 1}h1v${k % 7 === 0 ? 4 : 2}h-1z`;
  s += `<path d="${axis}" fill="${ink}"/>` + d.text(x1, cy0 - 7, `${(exact(SHOPS) * 100).toFixed(1)}% exact`, { size: 11, anchor: 'end' });

  run.shops.forEach((slots, sIdx) => {
    let g = '';
    slots.forEach((sl, i) => {
      const x = Math.round(x0 + i * pitch);
      if (sl.target) g += d.rect(x, sy, sw, sh, ink) + d.text(x + sw / 2, sy + 18, '✓ hit', { size: 11, fill: paper, anchor: 'middle' });
      else g += d.rect(x + 3, sy + 3, sw - 6, sh - 6, d.pat(Math.round((0.06 + sl.cost * 0.1) * 16))) + d.rect(x + 4, sy + 4, 16, 14, paper) + d.text(x + 12, sy + 15, String(sl.cost), { size: 10, anchor: 'middle' });
    });
    // where this roll-down is now
    const mk = sIdx + 1, mx = Math.round((X(mk - 1) + X(mk)) / 2), my = Math.round(Y(exact(mk)));
    let dots = '';
    for (let y = cy0 - 4; y < cy1; y += 3) dots += `M${mx} ${y}h1v1h-1z`;
    g += `<path d="${dots}" fill="${ink}"/>` + d.rect(mx - 2, my - 2, 5, 5, ink);
    s += `<g${d.show(...during(sIdx))}>${g}</g>`;
    s += `<g${d.show(sIdx * SHOP, (sIdx + 1) * SHOP, P, true)}>` + d.text(x1, 18, `${30 - sIdx * 2} gold`, { size: 12, anchor: 'end' })
      + d.text(x0, MH - 6, `shop ${mk} of ${SHOPS} · ${(exact(mk) * 100).toFixed(1)}% by now`, { size: 10.5, fill: ink2 }) + '</g>';
  });
  const gold = 30 - (n - 1) * 2 - (run.hit >= 0 ? 4 : 0);
  s += `<g${d.show(n * SHOP, P, P)}>` + d.text(x1, 18, `${gold} gold`, { size: 12, anchor: 'end' })
    + d.text(x0, MH - 6, run.hit >= 0 ? `this run: found on shop ${run.hit + 1}, ${gold} gold left` : `this run: missed, ${gold} gold left`, { size: 10.5, fill: ink2 }) + '</g>';
  return s;
}

/* ---------- the windows ---------- */

export const PROJECTS = [
  { key: 'umbra', name: 'Umbra', href: 'https://marcus.gg/umbra/', mini: umbra, meta: 'Desktop · Electron, Go · In beta',
    line: 'A desktop browser where every tab is its own sealed browser — its own cookies, its own exit IP, its own consistent device.' },
  { key: 'vestra', name: 'Vestra', href: 'https://marcus.gg/vestra/', mini: vestra, meta: 'Web app · NestJS, React · In development',
    line: 'Your entire net worth in one considered view, priced live and added up honestly — deposits never counted as gains.' },
  { key: 'dial', name: 'Dial', href: 'https://marcus.gg/dial/', mini: dial, meta: 'Mobile · Expo, Node · Prototype',
    line: 'Photograph a watch and see what the cheap end of the market is really asking, with the suspiciously cheap listings thrown out first.' },
  { key: 'tessera', name: 'Tessera', href: 'https://marcus.gg/tessera/', mini: tessera, meta: 'Chrome extension · JavaScript · Working build',
    line: 'A Chrome extension that reads every listing on a StubHub event at once and shows the low, typical and high price for each zone and section.' },
  { key: 'admit', name: 'Admit', href: 'https://marcus.gg/admit/', mini: admit, meta: 'Ticketing platform · Node, React, Postgres · Pre-launch',
    line: 'Tickets that can’t be copied. The fan’s phone signs a fresh code every ten seconds with a key that never leaves it, and one scan lets one person in.' },
  { key: 'tft-copilot', name: 'TFT Copilot', href: 'https://marcus.gg/tft-copilot/', mini: tft, meta: 'Web app · React, TypeScript · Working build',
    line: 'A decision engine for Teamfight Tactics: exact roll-down odds, comp picks that account for who else is playing them, and a coach that reviews real lobbies.' },
];

export function project(theme, p) {
  const { ink, ink2, ink3 } = theme;
  const d = new Doc(W, H, theme, { label: `${p.name}. ${p.line} ${p.meta}.` });
  d.add(d.win(5, 5, 400, 259, p.name));
  d.defs.set('m', `<clipPath id="m"><rect x="6" y="27" width="${MW}" height="${MH}"/></clipPath>`);
  d.add(`<g clip-path="url(#m)"><g transform="translate(6 27)" shape-rendering="crispEdges">${p.mini(d)}</g></g>`);
  d.add(d.rect(6, 151, MW, 1, ink, ' class="c"'));
  wrap(p.line, 51).forEach((line, i) => {
    d.add(d.text(22, 173 + i * 18, line, { size: 12, fill: ink2 }), d.dz(22, 160 + i * 18, 370, 18, 0.5 + i * 0.1));
  });
  d.add(d.text(22, 250, p.meta.toUpperCase(), { size: 9.5, fill: ink3, ls: 0.5 }), d.dz(22, 239, 346, 16, 1));
  d.kf('go', '0%,70%{transform:none}85%{transform:translateX(6px)}100%{transform:none}');
  d.add(`<g class="st" style="animation:go 3.2s steps(3,end) 2s infinite">` + d.text(382, 250, '→', { size: 12, anchor: 'end' }) + '</g>');
  return d.toString();
}
