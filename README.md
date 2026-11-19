# R Lab

A free, browser-based, gamified way to learn R — tidyverse, ggplot2 and psych stats —
by writing real R that really runs. No server, no install, no account.

**Play: https://ohwoahwhen.github.io/r-lab/**

Real R runs in your browser through [webR](https://docs.r-wasm.org/webr/latest/)
(R compiled to WebAssembly). dplyr, tidyr, ggplot2, readr, stringr and forcats are loaded
from the webR package repository on first visit and cached by your browser afterwards.

## How it works

- **Story missions.** You are a new research assistant in Dr. Marigold Finch's lab. Each
  level is a set of tasks from her, two sentences of teaching and then straight into code.
- **Graded by running your code, not by matching text.** Your answer is evaluated in R and
  compared to the expected result — columns, row counts, values, types. Any correct code passes.
- **Chart challenges are graded on structure.** `ggplot_build()` is used to compare layers,
  aesthetic mappings, facets, scales and labels, so the feedback can say *what* is different
  rather than "wrong".
- **Specific feedback.** Three hints per mission, revealed one at a time for a little XP.
- **Theory, not just syntax.** Every mission opens with *The idea* — the concept under the
  code, why the convention exists, and the mistake it is there to prevent. Why `filter()`
  silently drops `NA` rows. Why reverse-scoring failures produce no error at all. Why
  truncating a y-axis is the easiest way to mislead with a true chart. Why overlapping error
  bars do not mean "not significant". Collapse the card once and it stays collapsed.
- **RStudio's keyboard shortcuts**, so the habits transfer both ways: `Alt+-` for `<-`,
  `Cmd/Ctrl+Shift+M` for the pipe, `Cmd/Ctrl+Shift+C` to comment, `Cmd/Ctrl+Enter` to run the
  selection, and the rest. The full list is in Settings, or the ⌨ button above the editor.
- **XP, ranks, daily streak, boss challenges** at the end of each level.
- **Save codes** move your progress between devices with no account: export a short code on
  one device, paste it on another. Importing never silently overwrites better progress.

## Levels

| # | Title | What it teaches |
|---|-------|-----------------|
| 1 | First Day | objects, vectors, data frames, the pipe |
| 2 | The Filter Room | `select`, `filter`, `arrange`, select helpers |
| 3 | Making Numbers | `mutate`, `across`, `summarise`, `group_by`, `count` |
| 4 | Tidying Up | `pivot_longer`/`wider`, splitting columns, joins, missing data |
| 5 | First Light | `ggplot`, `aes`, geoms, distributions, labels |
| 6 | Polish | facets, scales, manual colours, themes, annotation |
| 7 | Numbers That Mean Something | descriptives, Cronbach's alpha, t-tests, correlations, Cohen's d, APA reporting |
| 8 | The Analysis | one-way ANOVA, eta squared, Levene's test, `emmeans` post-hocs, mixed ANOVA with `afex`, simple effects |
| 9 | Lines Through Clouds | regression, prediction, control variables, model comparison, dummy coding, moderation |
| 10 | Everyone Is Different | mixed-effects models: random intercepts, ICC, Satterthwaite p values, random slopes, individual differences |
| 11 | The Fine Print | paired designs, planned contrasts, multiplicity corrections, unequal n and Type I/II/III, sphericity, diagnostics, rank-based tests |
| 12 | Right or Wrong | logistic regression, odds ratios, predicted probabilities, deviance tests, generalised mixed models |
| 13 | How Much Is Enough | power and sample size, the post-hoc power fallacy, sensitivity analysis, safeguard power, simulation, equivalence testing |

90 missions in all, including thirteen boss challenges and two recreate-the-chart tasks.
Levels 7 to 13 fetch `effectsize`, `psych`, `car`, `afex`, `emmeans`, `lme4`, `lmerTest`, `pwr` and `TOSTER`
the first time you open one — about 20 MB that the earlier levels never download.

The datasets are simulated but deliberately messy — typo'd category labels, missing values,
wide formats, numbers stored as text — because that is what real data looks like. Levels 6–8
hand you tidied versions of them, which are exactly what the level 1–4 boss missions build.

## Running it locally

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

- `npm test` — unit tests for save codes, XP, hints, streaks and level unlocking.
- `npm run build` — static site into `dist/`.
- `http://127.0.0.1:5173/test.html` — the playtest harness: runs every mission's model
  solution (all must pass) and a set of deliberately wrong answers (all must fail with
  feedback that names the real problem). Dev only; not part of the deployed site.

## Adding levels

See [PLAN.md](PLAN.md) for the architecture and [TODO.md](TODO.md) for what's next.
Mission shape and the checker helpers are documented in PLAN.md §3.

## Notes

GitHub Pages cannot send the `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`
headers that webR's `SharedArrayBuffer` channel needs, so webR runs on its PostMessage
channel. That means R cannot be interrupted mid-run — hence **Restart R** in settings rather
than a stop button — and missions never use `readline()`, `menu()` or `browser()`.
