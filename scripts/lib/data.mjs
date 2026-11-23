// The year's contribution calendar and the language split, from GitHub's GraphQL API.
// Both are cached in data/, so the drawings can be rebuilt without a token, and so a token that
// cannot see private repositories (the Action's own) never overwrites a language split that could.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export const LOGIN = 'Nerhh';
const DATA = new URL('../../data/', import.meta.url);
const read = name => (existsSync(new URL(name, DATA)) ? JSON.parse(readFileSync(new URL(name, DATA), 'utf8')) : null);
const write = (name, value) => { mkdirSync(DATA, { recursive: true }); writeFileSync(new URL(name, DATA), JSON.stringify(value) + '\n'); };

const QUERY = `query($login:String!){
  viewer{login}
  user(login:$login){
    contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount weekday}}}}
    repositories(first:100,ownerAffiliations:OWNER,isFork:false){nodes{languages(first:20,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
  }
}`;

function token() {
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  try { return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
}

async function fetchFresh() {
  const tok = token();
  if (!tok) return null;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${tok}`, 'content-type': 'application/json', 'user-agent': 'profile-readme' },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

export async function load({ offline = false } = {}) {
  let fresh = null;
  if (!offline) {
    try { fresh = await fetchFresh(); } catch (e) { console.warn(`could not reach GitHub (${e.message}); drawing from data/`); }
  }
  if (fresh) {
    const cal = fresh.user.contributionsCollection.contributionCalendar;
    // a token that sees less than the owner does must not shrink the picture: the year's total moves by a day at a time
    const before = read('calendar.json');
    if (before && fresh.viewer.login !== LOGIN && cal.totalContributions < before.total / 2) console.warn(`this token sees ${cal.totalContributions} contributions where ${before.total} were drawn; keeping data/calendar.json`);
    else write('calendar.json', { total: cal.totalContributions, weeks: cal.weeks.map(w => w.contributionDays.map(d => [d.date, d.contributionCount, d.weekday])) });
    // only the owner's own token sees every repository; anyone else's would shrink the split to the public ones
    if (fresh.viewer.login === LOGIN) {
      const bytes = {};
      for (const repo of fresh.user.repositories.nodes) for (const e of repo.languages.edges) bytes[e.node.name] = (bytes[e.node.name] || 0) + e.size;
      const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
      write('languages.json', Object.entries(bytes).sort((a, b) => b[1] - a[1]).map(([name, size]) => [name, +((100 * size) / total).toFixed(2)]));
    }
  }
  const calendar = read('calendar.json'), languages = read('languages.json');
  if (!calendar || !languages) throw new Error('no data: run once with a token (GH_TOKEN, or `gh auth login`)');
  return { calendar, languages, stats: stats(calendar) };
}

function stats(calendar) {
  const days = calendar.weeks.flat().map(([date, count, weekday]) => ({ date, count, weekday }));
  let longest = 0, run = 0, longestEnd = '';
  let busiest = days[0];
  for (const d of days) {
    if (d.count > 0) { run++; if (run > longest) { longest = run; longestEnd = d.date; } } else run = 0;
    if (d.count > busiest.count) busiest = d;
  }
  return { total: calendar.total, active: days.filter(d => d.count > 0).length, longest, longestEnd, busiest, first: days[0].date, last: days.at(-1).date, max: busiest.count };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const month = iso => MONTHS[+iso.slice(5, 7) - 1];
export const dayMonth = iso => `${+iso.slice(8, 10)} ${month(iso)}`;
export const dayMonthYear = iso => `${dayMonth(iso)} ${iso.slice(0, 4)}`;
