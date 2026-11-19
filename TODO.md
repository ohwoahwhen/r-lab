# TODO

Live: https://ohwoahwhen.github.io/r-lab/ · Plan: [PLAN.md](PLAN.md)

## Stage 1 — engine + levels 1–5 — DONE (19 Nov 2026)
- [x] Vite scaffold, index shell, three themes, router
- [x] webR engine (pinned 0.6.1, PostMessage channel, progress, restart)
- [x] CodeMirror 6 editor with R mode; Run → output + plot canvas
- [x] R-side: datasets.R (8 messy datasets, seeded), grade.R helpers
- [x] JS grading bridge + specific feedback shaping
- [x] State: XP, ranks, streak, localStorage via safeGet/safeSet
- [x] Save codes: export, import, checksum, merge-or-replace prompt
- [x] Screens: level map, mission list, mission, settings
- [x] Levels 1–5 (32 missions including 5 bosses and a recreate-the-chart)
- [x] Playtest harness: all 32 solutions pass, ~50 wrong answers fail with specific feedback
- [x] Unit tests for save codes, XP, hints, streaks, unlocking (`npm test`)
- [x] GitHub repo + Pages workflow + live link verified on the deployed site

## Stage 2 — levels 6–8 (next)
- [ ] Lazy install of effectsize/psych/afex/emmeans/car with its own progress UI
      (`ensureStatsPackages()` in `src/r/engine.js` is written but not yet called anywhere)
- [ ] Level 6 Polish — facets, themes, scales, colour, annotation; publication-figure boss
      - new helpers that exist and are untested: `rlab_want_facet`, `rlab_want_theme`, `rlab_want_scale`
- [ ] Level 7 Numbers That Mean Something — descriptives, `t.test`, `cor.test`, Cohen's d,
      APA strings (checker: `rlab_want_match` against an APA regex)
- [ ] Level 8 The Analysis — `aov`/`afex`, assumptions, `emmeans`, interactions.
      Both afex 1.5-1 and emmeans 2.0.4 exist as wasm builds; keep a base-R `aov` +
      `pairwise.t.test` fallback in case loading fails at runtime
- [ ] Add each new mission to `src/test/wrong.js` and rerun the playtest harness
- [ ] Remove the `COMING_SOON` entries from `src/content/levels.js` as each lands

## Backlog
- [ ] Level 9 regression; level 10 mixed models (lme4 2.0-6 is available as wasm)
- [ ] Free-play console screen with all datasets loaded
- [ ] Error-aware hints: match common R error text → targeted advice
      (e.g. "could not find function" → "did you forget the library, or misspell it?")
- [ ] PWA / offline cache so a cold phone visit is fast
- [ ] Review mode: replay passed missions for half XP
- [ ] Export a cheatsheet of everything learned so far
- [ ] Mission search / jump-to-mission

## How to add a level (for a future session)
1. Add `src/content/levelNN.js` exporting `{ id, n, title, blurb, story, missions: [...] }`.
2. Register it in `src/content/levels.js` — **append only**, since save codes are
   encoded against `missionOrder()`.
3. Mission shape and checker helpers are in PLAN.md §3. A checker is R code whose value is
   a character vector of problems; empty means pass. Compute the expected answer from the
   data inside the checker rather than hard-coding numbers, so it can never drift.
4. New data goes in `src/r/datasets.R` with its own `set.seed`, and into `rlab_build_data()`.
5. `npm run dev`, then open `/test.html` and confirm 0 failed / 0 weak before committing.
