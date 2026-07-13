# English Word RPG — AI Instructions

## Project Overview

An English vocabulary learning RPG game (英语单词大冒险) for Chinese primary/secondary students. Vanilla JavaScript SPA with CSS Pixel Clay theme (warm fairy-tale colors + claymorphism panels + pixel fonts). Tablet + desktop responsive.

## Tech Stack

- No framework — vanilla JS (ES modules), CSS custom properties, HTML
- Static HTTP server (`python -m http.server 8080`)
- Git remotes: Gitee (origin) + GitHub (github)
- Pixel fonts: Press Start 2P, ZCOOL KuaiLe (Google Fonts)
- View Transitions API for SPA page transitions

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at root + `docs/adr/`. See `docs/agents/domain.md`.
