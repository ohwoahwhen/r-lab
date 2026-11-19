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
- [x] Levels 1–5 (32 missions) and the playtest harness
- [x] GitHub repo + Pages workflow + live link verified

## Stage 2 — levels 6–8 — DONE (19 Nov 2026)
- [x] Lazy install of effectsize/psych/car/afex/emmeans, gated per level, with progress,
      a shared promise so it runs once, and a retry path if it fails
- [x] Derived tidy datasets (`hikes_clean`, `pavlov_long`, `rt_clean`, `wellbeing_scored`)
      built from the messy originals — the outputs of the level 1–4 bosses
- [x] Level 6 Polish — facets, scales, manual colours, themes, annotation; publication figure boss
- [x] Level 7 Numbers That Mean Something — descriptives, Cronbach's alpha, Welch t-test,
      Cohen's d, correlation, APA sentence boss
- [x] Level 8 The Analysis — one-way ANOVA, eta squared, Levene, emmeans post-hocs,
      afex mixed ANOVA, simple effects, APA interaction boss
- [x] 53 missions playtested in the browser: every solution passes, ~100 wrong answers
      fail with feedback that names the real problem

## Backlog
- [ ] Level 9 regression; level 10 mixed models (lme4 2.0-6 is available as wasm)
- [ ] Free-play console screen with all datasets loaded
- [ ] Error-aware hints: match common R error text → targeted advice
      (e.g. "could not find function" → "did you forget the library, or misspell it?")
- [ ] PWA / offline cache so a cold phone visit is fast
- [ ] Review mode: replay passed missions for half XP
- [ ] Export a cheatsheet of everything learned so far
- [ ] Mission search / jump-to-mission
- [ ] Pre-warm the statistics packages in the background once level 6 is reached,
      so level 7 opens with no wait

## Known rough edges
- The statistics packages are re-downloaded into webR's virtual filesystem on every page
  load (the HTTP cache makes it quick, but it is not instant). A PWA cache would fix it.
- There is no base-R fallback for levels 7–8 if afex/emmeans fail to install. They were
  verified working; if that ever changes, the loader says so plainly instead of pretending.
- `rlab_want_nums()` compares the numbers in an APA sentence positionally, so a student who
  writes the right numbers in a different order gets told which position is wrong, not that
  they reordered it.

## How to add a level (for a future session)
1. Add `src/content/levelNN.js` exporting `{ id, n, title, blurb, story, missions: [...] }`.
   Set `needsStats: true` on the level if its missions need afex/emmeans/psych/car/effectsize.
2. Register it in `src/content/levels.js` — **append only**, since save codes are encoded
   against `missionOrder()`.
3. Mission shape and checker helpers are in PLAN.md §3. A checker is R code whose value is
   a character vector of problems; empty means pass. Compute the expected answer from the
   data inside the checker rather than hard-coding numbers, so it can never drift.
4. New data goes in `src/r/datasets.R` with its own `set.seed`, and into `rlab_build_data()`.
   Anything derived from the messy originals belongs in `rlab_make_derived()`.
5. Add two or three plausible wrong answers per mission to `src/test/wrong.js`, each with a
   regex for what the feedback must mention.
6. `npm run dev`, open `/test.html` (or `/test.html?only=l9` for one level) and confirm
   0 failed / 0 weak before committing. `npm test` covers save codes and XP/streak logic.
