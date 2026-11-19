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

## Stage 3 — level 9 + teaching layer — DONE (19 Nov 2026)
- [x] Level 9 Lines Through Clouds — `lm`, `summary`, `predict`, multiple predictors,
      nested model comparison, dummy coding, moderation, APA regression boss
- [x] `theory` field on **every one of the 61 missions**, rendered as a collapsible
      "The idea" card: the concept under the code, why the convention exists, the mistake it
      prevents. The card remembers whether you collapsed it.
- [x] RStudio keymap in the editor (`Alt+-`, `Cmd/Ctrl+Shift+M`, `Cmd/Ctrl+Shift+C`,
      `Cmd/Ctrl+D`, `Alt+↑/↓`, `Ctrl+L`, `Cmd/Ctrl+F`, selection-aware `Cmd/Ctrl+Enter`),
      a ⌨ panel above the editor and a reference table in Settings
- [x] Save codes packed to three bits per mission — 61 missions now fit in 70 characters
      instead of 141 — with format v1 still readable on import
- [x] All 61 missions replayed: 0 failed, 0 weak hints

## Stage 4 — level 10 — DONE (19 Nov 2026)
- [x] Level 10 Everyone Is Different — `lmer`, variance components and ICC, why lme4 omits
      p values and what lmerTest's Satterthwaite df mean, random slopes, likelihood ratio
      tests, per-participant effects from `coef()`, APA mixed-model boss
- [x] `lme4` and `lmerTest` added to the lazily-installed statistics set (~1 s extra, since
      Matrix and nlme already arrive with afex and car)
- [x] `rt_task` regenerated so each participant has their own congruency effect as well as
      their own baseline speed. Without it the random slopes were unidentifiable and the
      level had nothing to teach; individual effects now span −29 ms to +97 ms
- [x] All 68 missions replayed after the data change: 0 failed, 0 weak hints

## Stage 5 — level 11 + statistical audit — DONE (19 Nov 2026)
- [x] Audited levels 7–10 for coverage. Real gaps found: no paired test, post-hoc but no
      planned comparisons, no multiplicity correction, nothing on unequal n or Type I/II/III,
      sphericity corrections applied silently by afex, no regression diagnostics, no
      rank-based alternatives
- [x] Level 11 The Fine Print — paired t and *dz*, planned contrasts, `p.adjust` families,
      Type I/II/III with the `contr.sum` trap, sphericity and Greenhouse–Geisser, `vif()`
      and residual diagnostics, `wilcox.test`, pre-registered primary result boss
- [x] Corrected what earlier levels taught: level 8's Levene debrief recommended
      test-then-choose (now warns against it), the "14%" multiple-comparison figure assumed
      independence, level 7's two-of-three-groups t-test now states it is only legitimate as
      a planned comparison, and the Cronbach .7 cutoff is named as a convention
- [x] `rlab_eval()` resets `options(contrasts = ...)` per attempt so a mission cannot leak a
      global option into the next one
- [x] Save codes decoupled from level order via the frozen `MISSION_SLOTS` list, so missions
      can be inserted anywhere without invalidating a code; `npm test` enforces it
- [x] All 76 missions replayed: 0 failed, 0 weak hints

## Stage 6 — level 12 — DONE (20 Nov 2026)
- [x] Level 12 Right or Wrong — `glm(family = binomial)`, odds ratios and why they are not
      risk ratios, predicted probabilities, deviance and likelihood ratio tests, `glmer`,
      and why the traditional t-test on per-person proportions is worse
- [x] `rt_task` gained by-participant accuracy variation so `glmer`'s random intercept is
      estimable; level 10's quoted figures re-measured and updated as a result
- [x] New derived dataset `rt_acc` — same cleaning as `rt_clean`, errors kept
- [x] Corrected a factual error written into level 12's first draft: since R 4.4,
      `anova()` on two GLMs runs the chi-square test by default, so `test = "Chisq"` is
      no longer required. The theory now explains the version difference
- [x] All 83 missions replayed: 0 failed, 0 weak hints

## Stage 7 — level 13 — DONE (20 Nov 2026)
- [x] Level 13 How Much Is Enough — `pwr.t.test` for sample size, observed/post-hoc power
      taught explicitly as a fallacy, sensitivity analysis as its replacement, safeguard power
      against publication bias, power by simulation with `replicate()`, and `t_TOST`
      equivalence testing; boss reports an equivalence result plus the next study's n
- [x] `pwr` and `TOSTER` added to the lazily-installed statistics set
- [x] Two checker bugs found by the harness and fixed: `t_TOST`'s `eqb` is a data frame
      (so `unlist()` made it character and `abs()` failed), and `pwr.t2n.test` is symmetric
      in `d`, so a probe asserting that the signed value was wrong had to go
- [x] All 90 missions replayed: 0 failed, 0 weak hints

## Backlog
- [ ] Still not covered anywhere: chi-square and contingency tables, bootstrapping,
      Bayes factors, mediation, meta-analytic thinking, multiple imputation for missing data
- [ ] Free-play console screen with all datasets loaded
- [ ] Error-aware hints: match common R error text → targeted advice
      (e.g. "could not find function" → "did you forget the library, or misspell it?")
- [ ] PWA / offline cache so a cold phone visit is fast
- [ ] Review mode: replay passed missions for half XP
- [ ] Export a cheatsheet of everything learned so far
- [ ] Mission search / jump-to-mission
- [ ] Pre-warm the statistics packages in the background once level 6 is reached,
      so level 7 opens with no wait
- [ ] Let the shortcuts be remapped, for anyone who does not come from RStudio
- [ ] A "model zoo" summary screen: the same question answered by t-test, ANOVA, regression
      and a mixed model, side by side

## Known rough edges
- The statistics packages are re-downloaded into webR's virtual filesystem on every page
  load (the HTTP cache makes it quick, but it is not instant). A PWA cache would fix it.
- Mixed models take about a second to fit in WebAssembly, so levels 10 missions feel
  slightly slower to submit than the rest. That is honest work, not a bug.
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
   Add a `theory` field as well — `teach` says what to type, `theory` says what the idea is,
   why the convention exists and which mistake it prevents. Around 110 words, three short
   paragraphs, not a textbook. Every existing mission has one; keep that true.
4. New data goes in `src/r/datasets.R` with its own `set.seed`, and into `rlab_build_data()`.
   Anything derived from the messy originals belongs in `rlab_make_derived()`.
5. Add two or three plausible wrong answers per mission to `src/test/wrong.js`, each with a
   regex for what the feedback must mention.
6. `npm run dev`, open `/test.html` (or `/test.html?only=l9` for one level) and confirm
   0 failed / 0 weak before committing. `npm test` covers save codes and XP/streak logic.
