# R Lab — plan

A free, browser-based, gamified R course for Owen (psych Honours grad, beginner at R).
Real R runs in the browser via webR (WebAssembly). No server, no install, static site on
GitHub Pages.

**Repo:** `ohwoahwhen/r-lab` (public) · **Live:** https://ohwoahwhen.github.io/r-lab/

---

## 1. Goals

| Goal | How it shows up in the app |
| --- | --- |
| Get fluent at slicing/organising data | Levels 1–4, dplyr + tidyr missions on messy data |
| Get fluent at visualising | Levels 5–6, including "recreate the chart" challenges |
| Psych stats with correct reporting | Levels 7–8, APA-style write-up checks |
| Feels like a game, not a reading | 2-sentence teach → write code immediately; XP, streaks, bosses, level map |
| Works on MacBook, Windows PC, phone | Responsive layout, touch-friendly editor, save codes to move progress |

Non-goals: no account system, no server, no analytics, no paid services.

---

## 2. Decisions made

| Decision | Choice | Why |
| --- | --- | --- |
| R runtime | webR 0.6.1 from `https://webr.r-wasm.org/v0.6.1/` | Pinned version; official CDN sets CORS correctly |
| webR channel | `ChannelType.PostMessage`, explicit | GitHub Pages cannot send COOP/COEP, so `SharedArrayBuffer` is unavailable. Explicit = dev behaves like prod |
| Consequence | No interrupt, no `readline()`/`menu()`/`browser()` | Ship a **Restart R** button instead of a stop button; never author a mission that needs stdin |
| Editor | CodeMirror 6 + `@codemirror/legacy-modes` R mode | Small, fast, real mobile support, keyboard-friendly |
| Build | Vite, plain ES modules (no TS, no framework) | One dependency tree, instant HMR, static output |
| Deploy | GitHub Actions → Pages (`actions/deploy-pages`) | No `gh-pages` branch to babysit |
| Styling | Hand-written CSS with design tokens | Three togglable themes; no Tailwind build weight |
| Datasets | Generated in R at boot from a seeded script | No CSV fetches, deterministic, reset-able per mission |
| Stats packages | Lazy-installed on entering levels 7–8 | Keeps first load lighter (~20 MB the first six levels never need) |
| Levels 6–8 data | Pre-tidied `hikes_clean`, `pavlov_long`, `rt_clean`, `wellbeing_scored` | They are exactly what the level 1–4 bosses produce, so the earlier work visibly pays off and the later levels are about plots and statistics, not re-cleaning |

### Package availability (checked against repo.r-wasm.org)

Core (eager): `dplyr 1.2.1`, `tidyr 1.3.2`, `ggplot2 4.0.3`, `readr 2.2.0`, `stringr 1.6.0`,
`forcats 1.0.1`, `tibble`, `purrr`.
Stats (lazy, level 7–8): `effectsize 1.0.3`, `psych 2.6.9`, `afex 1.5-1`, `emmeans 2.0.4`, `car 3.1-5`.

Both `afex` and `emmeans` exist as wasm builds and were verified end to end in the browser:
a 2×2 mixed ANOVA, a 2×2×8 three-way, `emmeans` simple effects and `effectsize` all run. The
base-R fallback sketched in the first draft of this plan was **not built** — shipping an
untested parallel content path would have been worse than the honest failure message the
loader now shows if the packages ever will not install.

> `emmeans` builds model terms from factor levels, and `CS+` is not a legal R name: it is
> silently mangled to `CS.`, with `CS-` becoming `CS..1`, so you cannot tell them apart.
> `pavlov_long` keeps the readable `CS+`/`CS-` for plotting in level 6, and level 8 teaches
> `fct_recode()` as the fix — a real lesson rather than a hidden workaround.

> ggplot2 is 4.0.x, where plot objects are S7. All `ggplot_build()` introspection used by the
> chart grader must be verified against 4.0 in a real browser, not assumed from ggplot2 3.x.

---

## 3. Architecture

```
index.html            app shell + loading screen
src/
  main.js             boot sequence, screen router
  r/engine.js         webR lifecycle: boot, install, eval, capture, restart
  r/boot.R            options, dataset generation, grading helpers  (string-embedded)
  r/datasets.R        seeded messy datasets                          (string-embedded)
  r/grade.R           rlab_grade(), plot introspection helpers        (string-embedded)
  game/state.js       progress, XP, levels, streak, localStorage (try/catch everywhere)
  game/savecode.js    export/import short save codes + validation + merge prompt
  game/grading.js     JS side of grading: run checker, shape feedback
  content/levels.js   level + mission registry
  content/level01.js … level08.js
  ui/screens/*.js     map, mission, console, settings, celebration
  ui/editor.js        CodeMirror 6 setup
  ui/plot.js          canvas rendering of ImageBitmap plot output
  ui/theme.js         three themes
styles/               tokens.css, themes.css, app.css
.github/workflows/deploy.yml
PLAN.md  TODO.md  README.md
```

### Screens

1. **Loading** — progress bar with real stages (fetch webR → start R → install core pkgs → build datasets → ready).
2. **Map** — 8 level nodes: completed / current / locked, XP bar, streak flame, theme switcher.
3. **Mission** — story + teach panel, task, editor, Run, Submit, hints, output/plot pane.
4. **Boss** — same chrome, less guidance, multi-step brief, no starter code.
5. **Settings** — theme, export/import save code, reset progress, restart R.

### Mission data shape

```js
{
  id: 'l2m3',
  title: 'Filter the sample',
  story: '…supervisor dialogue…',
  teach: '…two sentences…',
  task: '…what to produce…',
  dataset: 'wellbeing',            // which dataset(s) to preload
  starter: 'wellbeing |> \n  ',
  hints: ['…', '…', '…'],          // costs XP, revealed one at a time
  solution: '…',
  xp: 40,
  check: { kind: 'value', r: '…R checker code…' }   // or kind: 'plot'
}
```

### Grading

Everything is graded in R, not by matching strings, so any correct code passes.

1. Student code is evaluated in a fresh env whose parent holds the datasets.
2. The value of the last expression becomes `.answer`.
3. A mission checker runs in R and returns a character vector:
   `c("PASS")` or `c("FAIL", "<specific message>", …)`.
4. Checkers use shared helpers: `rlab_need_cols()`, `rlab_need_rows()`, `rlab_need_values()`,
   `rlab_need_type()`, `rlab_near()`. These produce the specific feedback
   ("you have 180 rows, I expected 142 — did the `is.na` filter run?").

**Plot grading** (`kind: 'plot'`) compares the student's plot to the target via `ggplot_build()`:
geoms per layer, aesthetic mappings (deparsed), stat/position, facet spec, `labs`, scale types,
and the computed layer data. Reports differences in words, never pixel diffing.

### XP, levels, streak

- Mission XP 30–60, boss XP 120–150. Hint cost: 5 XP, 10 XP, 15 XP (never below 1 XP earned).
- Player level = thresholds on total XP, shown as a rank ("Volunteer RA" → "Lab Manager").
- Streak = consecutive calendar days with ≥1 mission passed; stored as `lastPlayed` + `streak`.
- Level N+1 unlocks when level N's boss is passed.

### Save codes

`RLAB1-` followed by Crockford base32, grouped in dashes for readability. Crockford rather than
base64url because its alphabet contains no `-`, so the readability dashes can never be confused
with data, and because O/0 and I/1/L mix-ups are forgiven on import.

The payload is a fixed header (XP, streak, best streak, last-played day, slot count) and then
**three bits per mission** — one for passed, two for hints revealed — so the code grows by about
one character per three missions rather than one per mission. 61 missions fit in 70 characters.
Format v1, which used a whole byte per mission, is still read on import.

Import validates the prefix, the canonical encoding and a checksum, then compares total XP and
mission count against local progress. If the incoming code is *worse*, it asks before replacing,
and offers a merge that keeps the best of both. Never silent.

All `localStorage` access goes through `safeGet`/`safeSet` with try/catch, so private
windows and blocked storage degrade to in-memory progress with a visible notice.

---

## 4. Content map

Story: Owen joins Dr. Marigold Finch's behavioural lab as a new RA. Each level is a set of
tasks from her, with a light arc (a dataset she "inherited from a departing PhD student",
a conference deadline, a reviewer who wants effect sizes).

| Lvl | Title | Teaches | Datasets | Boss |
| --- | --- | --- | --- | --- |
| 1 | First Day | objects, vectors, data frames, `\|>` | `hikes`, `wellbeing` | Three-step pipe summary |
| 2 | The Filter Room | `select`, helpers, `filter`, `arrange` | `sydney_property`, `wellbeing` | Multi-condition property query |
| 3 | Making Numbers | `mutate`, `across`, `summarise`, `group_by`, `count` | `hikes`, `wellbeing`, `fitness` | Reverse-score + scale score |
| 4 | Tidying Up | `pivot_longer/wider`, `separate_wider_delim`, joins, NA handling | `fitness`, `rt_task`, `yt` | Messy wide → tidy long pipeline |
| 5 | First Light | `ggplot`, `aes`, geoms, `labs` | `hikes`, `rt_task` | Recreate the chart |
| 6 | Polish | facets, scales, colour, themes, annotation | `hikes_clean`, `pavlov_long` | Recreate a publication figure with error bars |
| 7 | Numbers That Mean Something | descriptives, Cronbach's alpha, `t.test`, `cor.test`, Cohen's d, APA strings | `wellbeing_scored` | Full APA results sentence |
| 8 | The Analysis | `aov`, eta squared, Levene, `emmeans`, `afex` mixed ANOVA, simple effects | `wellbeing_scored`, `pavlov_long` | Interaction reported in APA words |
| 9 | Lines Through Clouds | `lm`, `predict`, control variables, `anova()` model comparison, dummy coding, moderation | `hikes_clean`, `wellbeing_scored` | Regression reported in APA words |

5–7 missions + 1 boss per level, **61 challenges** in total.

### Teaching, not just syntax

Every one of the 61 missions carries a `theory` field, rendered as a collapsible **The idea**
card above the task. It is deliberately not a restatement of the `teach` line: `teach` says
what to type, `theory` says what the idea *is*, why the convention exists, and which mistake
it exists to prevent. Around 110 words each; the card remembers whether the reader collapsed it.

The early levels need this as much as the statistics ones, because that is where the silent
failure modes live — `filter()` dropping `NA` rows without a warning, a vector coercing to
character the moment one word lands in it, reverse-scoring errors that produce no error at all,
`scale_y_continuous(limits = ...)` deleting data before a summary layer sees it.

### Editor shortcuts

The editor implements RStudio's keymap so the habits transfer in both directions: `Alt+-`
inserts `<-`, `Cmd/Ctrl+Shift+M` inserts `|>`, `Cmd/Ctrl+Shift+C` toggles comments,
`Cmd/Ctrl+D` deletes a line, `Alt+↑/↓` moves one, `Ctrl+L` clears the output, `Cmd/Ctrl+F`
searches. `Cmd/Ctrl+Enter` runs the selection if there is one and the whole script otherwise,
exactly as RStudio does. Submit (`Cmd/Ctrl+Shift+Enter`) is the one binding with no RStudio
equivalent. The list lives in one place, `SHORTCUTS` in `src/ui/editor.js`, and both the
settings page and the ⌨ panel render from it.

### Datasets (all seeded, all deliberately messy)

| Name | Shape | Built-in mess |
| --- | --- | --- |
| `wellbeing` | 180 × questionnaire, wide | 10 self-esteem items incl. reverse-scored, `group` typos (`"Control"`,`"control "`,`"Cntrol"`), scattered NAs, age as character with `"32 years"` |
| `rt_task` | ~7,200 trials, long | RT outliers (anticipations <150 ms, lapses >2 s), missing accuracy, condition case mix |
| `pavlov` | 48 subjects × 8 blocks | CS+/CS− suppression ratios, 2 dropped subjects mid-study, wide block columns |
| `hikes` | 120 hikes | `trail` name typos/whitespace, `pack_kg` sometimes 0 vs NA, `duration` as `"2h 45m"` |
| `fitness` | 24 test dates, wide | one column per test, `"DNF"` strings in numeric columns, date as text |
| `sydney_property` | 400 sales | suburb spelling variants, `price` with `"$"` and commas, missing `parking` |
| `yt` | 150 videos | category typos, `duration` as `"PT4M13S"`, `views` with `"K"`/`"M"` suffixes |

---

## 5. Stages

**Stage 1 — engine + levels 1–5 (this pass)**
1. Scaffold: Vite project, shell, themes, routing.
2. webR engine: boot, progress, pinned version, PostMessage channel, core packages, restart.
3. Editor + Run: CodeMirror 6 with R mode, output pane, plot canvas.
4. Datasets + grading harness in R; JS grading bridge.
5. State: XP, levels, streak, localStorage, save codes with merge prompt.
6. Screens: map, mission, boss, settings.
7. Content: levels 1–5 (30 challenges).
8. Playtest every challenge in a real browser; fix.
9. Repo + Pages deploy; verify live link on desktop and phone widths.

**Stage 3 — level 9 — done**
13. Regression: `lm`, `summary`, `predict`, multiple predictors, nested model comparison,
    dummy coding, moderation, and an APA regression sentence.
14. The theory layer across levels 7–9, and the RStudio keymap.

**Stage 2 — levels 6–8 — done**
10. Lazy stats package install, gated per level with its own progress UI and a retry path.
11. Levels 6, 7, 8 (21 challenges) incl. APA-string checkers and a mixed ANOVA with afex/emmeans.
12. Playtest; deploy.

**Later (TODO.md keeps these)**
Level 10+ (mixed models), a sandbox console with all datasets, mission search,
"explain my error" hints keyed to R error text, keyboard-only play, PWA offline cache.

### APA string grading

Sentence missions are graded twice over: a regex for the *shape* (brackets, commas, decimal
places, no leading zero on p) and then `rlab_want_nums()`, which pulls every number out of the
sentence and compares it, in order, to the value recomputed from the data. So the feedback can
say "the Control mean is 33.50 in your sentence, it should be 30.77" rather than "wrong".

---

## 6. Quality gate (must pass before Owen sees it)

Run in the real browser, not assumed:
- [ ] webR boots on a cold cache; loading progress is honest about stages.
- [ ] `library()` succeeds for every eager package; a ggplot renders to canvas.
- [ ] Every mission: the model solution passes.
- [ ] Every mission: at least two plausible wrong answers produce a *specific* message.
- [ ] Hints reveal one at a time and deduct XP once each.
- [ ] Plot missions grade on structure; a deliberately wrong geom is named in the feedback.
- [ ] Save code round-trips across a storage wipe; worse-progress import asks first.
- [ ] Streak increments across a simulated day change, and resets after a gap.
- [ ] Layout works at 390 px and 1440 px; editor usable with a touch keyboard.
- [ ] Second visit is faster than the first (HTTP cache on package tarballs).
