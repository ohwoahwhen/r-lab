export default {
  id: 'l3',
  n: 3,
  title: 'Making Numbers',
  blurb: 'mutate, summarise, group_by and count — turning rows into results.',
  story:
    "\"Filtering is just tidying. Now make me a number I can put in a paper.\" " +
    "Dr. Finch pulls up a chair. \"The questionnaire has reverse-scored items, so half of it is backwards. " +
    "The reaction-time data has anticipations and lapses in it. Welcome to psychology.\"",
  missions: [
    {
      id: 'l3m1',
      theory:
        "`mutate()` works on whole columns at once. `elev_m / distance_km` is not a loop over rows \u2014 it is one division applied to two vectors, element by element, in one go.\n\nThis is why dplyr code is so short. The row-by-row thinking you might bring from Excel, where you write a formula in one cell and drag it down, is already built in.\n\nA useful detail: inside a single `mutate()` you can use a column you created a line earlier. The steps run in order, so you can build up a calculation in readable pieces instead of one unreadable expression.",
      title: 'Add a column',
      xp: 40,
      teach:
        "`mutate()` adds or changes columns and keeps everything else. The new column is computed row by row, " +
        "so you can write arithmetic with other columns straight into it.",
      task:
        "Add a column to `hikes` called `elev_per_km`, equal to `elev_m` divided by `distance_km`.",
      datasets: ['hikes'],
      starter: 'hikes |>\n  ',
      hints: [
        'The pattern is `mutate(new_name = some_calculation)`.',
        'Inside `mutate()` you refer to columns by their bare names, no `hikes$` needed.',
        '`hikes |> mutate(elev_per_km = elev_m / distance_km)`',
      ],
      solution: 'hikes |>\n  mutate(elev_per_km = elev_m / distance_km)',
      check: `local({
  want <- dplyr::mutate(hikes, elev_per_km = elev_m / distance_km)
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, c(names(hikes), "elev_per_km"), exact = TRUE),
    rlab_want_rows(.rlab_answer, nrow(hikes), "mutate() never drops rows."),
    rlab_want_col_values(.rlab_answer, "elev_per_km", want$elev_per_km, tol = 1e-8)
  )
})`,
    },
    {
      id: 'l3m2',
      theory:
        "Reverse-worded items exist to catch people who stop reading. If every question points the same way, someone can tick \"agree\" down the whole page and produce a perfect-looking score. Mixing the direction makes that pattern visible.\n\nThe cost is that the raw numbers no longer mean the same thing. On a 1\u20135 scale, agreeing strongly with \"I am no good at all\" is a 5 that means *low* self-esteem. Reversing with `6 - x` puts every item back on the same footing, so higher always means more.\n\nForget this step and nothing breaks. No error, no warning. You just get a scale whose items disagree with each other, a reliability figure in the floor, and a null result you cannot explain. It is probably the single most common analysis error in undergraduate psychology.",
      title: 'Reverse-scored items',
      xp: 45,
      teach:
        "On a 1–5 scale, a negatively worded item is reversed with `6 - x` (that's *max + min − x*). " +
        "Item 2 of this scale reads \"At times I think I am no good at all\", so a high raw score means **low** self-esteem.",
      task:
        "From `wellbeing`, return just two columns: `id` and a new column `ses2_r` holding the reverse-scored " +
        "version of `ses2`.",
      datasets: ['wellbeing'],
      starter: 'wellbeing |>\n  ',
      hints: [
        'Two steps on the pipe: make the column with `mutate()`, then cut down with `select()`.',
        'Reversing a 1–5 item is `6 - ses2`.',
        '`wellbeing |> mutate(ses2_r = 6 - ses2) |> select(id, ses2_r)`',
      ],
      solution: 'wellbeing |>\n  mutate(ses2_r = 6 - ses2) |>\n  select(id, ses2_r)',
      check: `local({
  want <- wellbeing |> dplyr::mutate(ses2_r = 6 - ses2) |> dplyr::select(id, ses2_r)
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, c("id", "ses2_r"), exact = TRUE),
    rlab_want_col_order(.rlab_answer, c("id", "ses2_r")),
    rlab_want_rows(.rlab_answer, nrow(wellbeing)),
    if (isTRUE(all.equal(as.numeric(.rlab_answer$ses2_r), as.numeric(wellbeing$ses2))))
      "That is the original item, not the reversed one. On a 1–5 scale, reverse it with \`6 - ses2\`." else character(0),
    rlab_want_col_values(.rlab_answer, "ses2_r", want$ses2_r)
  )
})`,
    },
    {
      id: 'l3m3',
      theory:
        "The question that decides which verb you want is: *how many rows should come out?*\n\n`mutate()` keeps the shape \u2014 120 rows in, 120 rows out, with a new column. `summarise()` collapses it \u2014 many rows in, one row out. Everything else in dplyr is a variation on those two.\n\nOnce you can see that shape change coming, most \"why did I get 120 rows when I wanted one\" confusion disappears.",
      title: 'Squash it to one row',
      xp: 45,
      teach:
        "`summarise()` collapses many rows into one. Inside it, `n()` counts rows and `mean()`, `sd()`, " +
        "`median()` do what you'd expect. This is also where `na.rm = TRUE` earns its keep.",
      task:
        "From `rt_task`, return **one row** with two columns: `n` (the number of trials) and `mean_rt` " +
        "(the mean of `rt`).",
      datasets: ['rt_task'],
      starter: 'rt_task |>\n  ',
      hints: [
        'Both columns are created inside a single `summarise()`, separated by a comma.',
        '`n()` takes no arguments — it just counts the rows it is given.',
        '`rt_task |> summarise(n = n(), mean_rt = mean(rt))`',
      ],
      solution: 'rt_task |>\n  summarise(n = n(), mean_rt = mean(rt))',
      check: `local({
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, c("n", "mean_rt"), exact = TRUE),
    rlab_want_rows(.rlab_answer, 1, "summarise() with no groups gives exactly one row."),
    rlab_want_value(.rlab_answer$n[1], nrow(rt_task), "\`n\`"),
    rlab_want_value(.rlab_answer$mean_rt[1], mean(rt_task$rt), "\`mean_rt\`", tol = 1e-8)
  )
})`,
    },
    {
      id: 'l3m4',
      theory:
        "`group_by()` computes nothing. It attaches a note to the data frame saying \"treat these as separate piles from here on\", and the *next* verb behaves differently because of it.\n\nThe pattern has a name \u2014 split, apply, combine \u2014 and it is everywhere in data work: break the data into groups, do the same thing to each, stack the answers back up.\n\nThe classic bug is forgetting the grouping is still attached. `summarise()` peels off one level of grouping and leaves the rest, so a later `mutate()` can quietly operate per-group when you meant it to operate on everything. `.by =` avoids this entirely by grouping for exactly one operation, which is why it is worth the new habit.",
      title: 'One row per group',
      xp: 50,
      teach:
        "`group_by()` doesn't change the data, it changes what the *next* verb does. `group_by()` then " +
        "`summarise()` gives one row per group. Modern dplyr lets you skip it with `summarise(.by = col)`, " +
        "but you will read `group_by()` in everyone else's code forever.",
      task:
        "In `rt_task`, keep only plausible trials (`rt` above 150 and below 2000), then return the mean " +
        "`rt` for **each block**, in a column called `mean_rt`, with one row per `block`.",
      datasets: ['rt_task'],
      starter: 'rt_task |>\n  filter(\n    \n  ) |>\n  ',
      hints: [
        'Three steps: `filter()` the trials, `group_by(block)`, then `summarise()`.',
        '"Above 150 and below 2000" is two conditions: `rt > 150, rt < 2000`.',
        'rt_task |> filter(rt > 150, rt < 2000) |> group_by(block) |> summarise(mean_rt = mean(rt))',
      ],
      solution:
        'rt_task |>\n  filter(rt > 150, rt < 2000) |>\n  group_by(block) |>\n  summarise(mean_rt = mean(rt))',
      check: `local({
  want <- rt_task |>
    dplyr::filter(rt > 150, rt < 2000) |>
    dplyr::group_by(block) |>
    dplyr::summarise(mean_rt = mean(rt)) |>
    dplyr::arrange(block)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("block", "mean_rt"), exact = TRUE),
    rlab_want_rows(got, 3, "There are three blocks, so three rows — did \`group_by(block)\` run?"),
    rlab_want_col_values(dplyr::arrange(got, block), "mean_rt", want$mean_rt, tol = 1e-8)
  )
})`,
    },
    {
      id: 'l3m5',
      theory:
        "Counting a column is the cheapest data check there is, and the one most often skipped.\n\nYou are not really after the counts. You are asking: are the categories what I think they are? Three conditions should give three labels. If it gives twelve, you have just saved yourself from an analysis that would have silently treated `\"Control\"` and `\"control \"` as different experimental groups and reported the result with a straight face.\n\nRun `count()` on every grouping variable before you trust it, every time. It costs one line and it has caught more errors than any clever technique.",
      title: 'Count things',
      xp: 40,
      teach:
        "`count(col)` is `group_by()` plus `summarise(n = n())` in one word. Add `sort = TRUE` to put the " +
        "biggest group first. It is the fastest way to find out what is actually *in* a column.",
      task:
        "Count the `group` column of `wellbeing`, biggest first. Look at the result when it comes back — " +
        "you are about to learn something unpleasant about this dataset.",
      datasets: ['wellbeing'],
      starter: 'wellbeing |>\n  ',
      hints: [
        'The whole thing is one `count()` call with the column name inside it.',
        '`sort = TRUE` is an argument of `count()`.',
        '`wellbeing |> count(group, sort = TRUE)`',
      ],
      solution: 'wellbeing |>\n  count(group, sort = TRUE)',
      debrief:
        "Three conditions, but far more than three labels. `\"Control\"`, `\"control\"`, `\"Control \"` and " +
        "`\"Cntrol\"` are four different values to R. You will clean this up in the next level — and you will " +
        "never again trust a grouping column you haven't counted.",
      check: `local({
  want <- dplyr::count(wellbeing, group, sort = TRUE)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("group", "n"), exact = TRUE),
    rlab_want_rows(got, nrow(want),
      "Count every distinct label, including the misspelled ones — don't clean anything yet."),
    if (!identical(got$n, sort(got$n, decreasing = TRUE)))
      "Nearly — add \`sort = TRUE\` so the biggest group comes first." else character(0),
    rlab_want_value(sum(got$n), nrow(wellbeing), "the total of the \`n\` column")
  )
})`,
    },
    {
      id: 'l3boss',
      theory:
        "R is column-oriented. Nearly everything is a vertical operation down a column, which is why `across()` exists: it says \"do this same thing to each of these columns\", and replaces ten copy-pasted lines.\n\nThat matters beyond convenience. Ten hand-written lines are ten chances for a typo, and a typo that reverse-scores `ses3` twice will not error. One `across()` either works for all ten or fails for all ten.\n\n`rowSums()` is the rarer sideways operation, going across a row. For a scale score that is exactly right: a person's total is a fact about that person, not about the column. Note too that leaving `na.rm` off means anyone who skipped an item gets `NA` instead of an artificially low total \u2014 a deliberate choice, not an oversight.",
      title: 'Boss: score the scale',
      boss: true,
      xp: 140,
      teach:
        "To reverse-score several items at once, `across()` applies one function to many columns: " +
        "`mutate(across(c(a, b), ~ 6 - .x))`. The `~ 6 - .x` is a little throwaway function, where `.x` " +
        "stands for each column in turn. `rowSums()` then adds across a row rather than down a column.",
      task:
        "Score the self-esteem scale from `wellbeing`:\n" +
        "1. reverse-score items `ses2`, `ses5`, `ses6`, `ses8`, `ses9` (that is `6 - x`)\n" +
        "2. add a column `ses_total` that sums all ten items for each person — people with any missing item " +
        "should end up as `NA`, so do **not** use `na.rm` here\n" +
        "3. return **one row** with `n` (how many people have a non-missing `ses_total`), `mean_total` and " +
        "`sd_total`, each rounded to 2 decimal places",
      datasets: ['wellbeing'],
      starter: 'wellbeing |>\n  mutate(across(\n    \n  )) |>\n  ',
      hints: [
        'Step 1: `mutate(across(c(ses2, ses5, ses6, ses8, ses9), ~ 6 - .x))`.',
        'Step 2: `mutate(ses_total = rowSums(across(starts_with("ses"))))`. Wrapping `across()` inside `rowSums()` hands it those ten columns as a little data frame.',
        'Step 3: `summarise(n = sum(!is.na(ses_total)), mean_total = round(mean(ses_total, na.rm = TRUE), 2), sd_total = round(sd(ses_total, na.rm = TRUE), 2))`',
      ],
      solution:
        'wellbeing |>\n' +
        '  mutate(across(c(ses2, ses5, ses6, ses8, ses9), ~ 6 - .x)) |>\n' +
        '  mutate(ses_total = rowSums(across(starts_with("ses")))) |>\n' +
        '  summarise(\n' +
        '    n = sum(!is.na(ses_total)),\n' +
        '    mean_total = round(mean(ses_total, na.rm = TRUE), 2),\n' +
        '    sd_total = round(sd(ses_total, na.rm = TRUE), 2)\n' +
        '  )',
      check: `local({
  want <- wellbeing |>
    dplyr::mutate(dplyr::across(c(ses2, ses5, ses6, ses8, ses9), ~ 6 - .x)) |>
    dplyr::mutate(ses_total = rowSums(dplyr::across(dplyr::starts_with("ses")))) |>
    dplyr::summarise(n = sum(!is.na(ses_total)),
                     mean_total = round(mean(ses_total, na.rm = TRUE), 2),
                     sd_total = round(sd(ses_total, na.rm = TRUE), 2))
  raw <- wellbeing |>
    dplyr::mutate(ses_total = rowSums(dplyr::across(dplyr::starts_with("ses")))) |>
    dplyr::summarise(m = round(mean(ses_total, na.rm = TRUE), 2))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("n", "mean_total", "sd_total"), exact = TRUE),
    rlab_want_rows(got, 1, "This should collapse to a single summary row."),
    rlab_want_value(got$n[1], want$n[1], "\`n\`"),
    if (rlab_near(got$mean_total[1], raw$m[1], 1e-6))
      "That is the mean of the *unreversed* scale. Reverse items 2, 5, 6, 8 and 9 first." else character(0),
    rlab_want_value(got$mean_total[1], want$mean_total[1], "\`mean_total\`", tol = 1e-6),
    rlab_want_value(got$sd_total[1], want$sd_total[1], "\`sd_total\`", tol = 1e-6)
  )
})`,
    },
  ],
};
