# How the profile is drawn

Everything under `assets/` is written by `scripts/build.mjs`. It has no dependencies; Node 20 or newer is enough.

```sh
npm run build            # ask GitHub for the year's contributions and the language split, then draw
npm run build:offline    # draw from data/ without asking GitHub
npm run preview          # write preview.html (follows the system theme), preview-dark.html and preview-light.html
```

| Path | What it holds |
| --- | --- |
| `scripts/lib/kit.mjs` | The drawing kit: themes, the 4×4 and 8×8 Bayer matrices, windows, typed text, dithered dissolves, loops |
| `scripts/lib/orb.mjs`, `png.mjs` | Fig. 1, the sphere from marcus.gg, and the one-bit PNG writer that carries its frames |
| `scripts/lib/data.mjs` | The GraphQL query, and the cache in `data/` that lets a drawing be rebuilt without a token |
| `scripts/draw/*.mjs` | One file per picture: hero, year, projects, side (About and Languages), links |
| `fonts/` | IBM Plex Mono, embedded in each drawing because an image in a README cannot load a font |

## Two things worth knowing

- **The language split needs the owner's token.** It is counted across every repository, private ones included. The
  daily `Draw` workflow runs with the Actions token, which cannot see private repositories, so `data/languages.json` is
  only rewritten when the signed-in account is `Nerhh`. Run `npm run build` here, signed in with `gh`, to refresh it.
- **A drawing is plain SVG.** A README image runs no script, so every animation is a CSS timeline, and every drawing
  settles to a still frame under `prefers-reduced-motion`.
