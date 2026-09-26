# caesar-cipher — web frontend

A static, dependency-free web UI for the `caesar-cipher` CLI. It mirrors the
logic in `src/caesar_cipher/cipher.py` and `analyzer.py` exactly (case-aware
shifting, chi-squared frequency ranking) but runs entirely in the browser —
no backend, no build step.

- `index.html` — layout (encrypt / decrypt / crack tabs)
- `style.css` — terminal-inspired theme
- `script.js` — CaesarCipher + FrequencyAnalyzer ported to JS

These live at the **repo root** (not in a subfolder) on purpose — see the
note below on why.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deploy to Vercel

```bash
npm i -g vercel   # one-time
vercel             # preview deploy
vercel --prod      # production deploy
```

Or via the Vercel dashboard: **New Project → Import this repo**. No
framework preset or build command needed — Vercel serves the static files
straight from the repo root.

### Why the frontend files sit at the repo root

Vercel's zero-config static detection expects `index.html` at the project
root when there's no `package.json`/build step. Pointing `vercel.json` at a
subfolder via `outputDirectory` without a build command is unreliable and
can 404. Keeping `index.html`, `style.css`, and `script.js` at the root
(alongside the unrelated Python `src/`, `tests/`, etc., which Vercel simply
ignores) is the reliable zero-config setup.
