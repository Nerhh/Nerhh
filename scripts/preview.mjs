// Writes the README as GitHub lays it out on a profile, with the pictures read from assets/:
//   preview.html         follows the system's light or dark setting, as GitHub does
//   preview-dark.html    always dark
//   preview-light.html   always light
import { readFileSync, writeFileSync } from 'node:fs';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
  .replaceAll('https://raw.githubusercontent.com/Nerhh/Nerhh/main/', './');

const LIGHT = '--bg: #fff; --fg: #1f2328; --line: #d1d9e0; --link: #0969da;';
const DARK = '--bg: #0d1117; --fg: #f0f6fc; --line: #3d444d; --link: #4493f8;';

const page = (vars, body) => `<!doctype html>
<meta charset="utf-8"><title>Profile preview</title>
<style>
  ${vars}
  body { margin: 0; padding: 32px 0; background: var(--bg); color: var(--fg); font: 16px/1.5 -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
  article { box-sizing: content-box; width: min(846px, 100vw - 82px); margin: 0 auto; padding: 24px; border: 1px solid var(--line); border-radius: 6px; }
  p { margin: 0 0 16px; } p:last-child { margin-bottom: 0; }
  img { max-width: 100%; box-sizing: content-box; border-style: none; }
  a { color: var(--link); text-decoration: none; } sub { font-size: 12px; }
</style>
<article>${body}</article>
`;

// one fixed theme: drop the <picture> wrappers and point each image at that theme's drawing
const fixed = theme => readme.replace(/<picture><source[^>]*>(<img[^>]*>)<\/picture>/g, '$1').replaceAll('-light.svg', `-${theme}.svg`);

writeFileSync(new URL('../preview.html', import.meta.url), page(`:root { color-scheme: light dark; ${LIGHT} } @media (prefers-color-scheme: dark) { :root { ${DARK} } }`, readme));
writeFileSync(new URL('../preview-dark.html', import.meta.url), page(`:root { color-scheme: dark; ${DARK} }`, fixed('dark')));
writeFileSync(new URL('../preview-light.html', import.meta.url), page(`:root { color-scheme: light; ${LIGHT} }`, fixed('light')));
console.log('wrote preview.html, preview-dark.html, preview-light.html');
