# TODO

Live: https://ohwoahwhen.github.io/r-lab/ · Plan: [PLAN.md](PLAN.md)

## Stage 1 — engine + levels 1–5
- [ ] Vite scaffold, index shell, three themes, router
- [ ] webR engine (pinned 0.6.1, PostMessage channel, progress, restart)
- [ ] CodeMirror 6 editor with R mode; Run → output + plot canvas
- [ ] R-side: datasets.R (7 messy datasets, seeded), grade.R helpers
- [ ] JS grading bridge + specific feedback shaping
- [ ] State: XP, ranks, streak, localStorage via safeGet/safeSet
- [ ] Save codes: export, import, checksum, "worse progress" confirm
- [ ] Screens: level map, mission, boss, settings
- [ ] Level 1 First Day (5 + boss)
- [ ] Level 2 The Filter Room (5 + boss)
- [ ] Level 3 Making Numbers (5 + boss)
- [ ] Level 4 Tidying Up (5 + boss)
- [ ] Level 5 First Light (5 + boss, incl. recreate-the-chart)
- [ ] Playtest all 30 in browser (solution passes, 2 wrong answers each give specific hints)
- [ ] GitHub repo + Pages workflow + live link verified

## Stage 2 — levels 6–8
- [ ] Lazy install of effectsize/psych/afex/emmeans/car with its own progress UI
- [ ] Level 6 Polish (facets, themes, scales, annotation; publication-figure boss)
- [ ] Level 7 Numbers That Mean Something (descriptives, t-tests, cor, Cohen's d, APA strings)
- [ ] Level 8 The Analysis (aov/afex, emmeans, interactions; base-R fallback path)
- [ ] Playtest all 18; redeploy

## Backlog
- [ ] Level 9: regression; Level 10: mixed models (lme4 is available as wasm)
- [ ] Free-play console screen with all datasets loaded
- [ ] Error-aware hints: match common R error text → targeted advice
- [ ] PWA / offline cache so a cold phone visit is fast
- [ ] "Review mode": replay passed missions for half XP
- [ ] Export a cheatsheet of everything learned so far

## How to add a level (for a future session)
1. Add `src/content/levelNN.js` exporting `{ id, title, story, missions: [...] }`.
2. Register it in `src/content/levels.js`.
3. Mission shape and checker helpers are documented in PLAN.md §3; checkers return
   `c("PASS")` or `c("FAIL", "<message>", ...)`.
4. If the level needs new data, add it to `src/r/datasets.R` with its own `set.seed`.
5. Run `npm run dev`, play every mission including wrong answers, then tick the box here.
