export default {
  id: 'l4',
  n: 4,
  title: 'Tidying Up',
  blurb: 'pivot_longer, pivot_wider, splitting columns, joins and missing data.',
  story:
    "\"The PhD student who collected this is in Berlin now and does not answer emails.\" " +
    "Dr. Finch slides over a spreadsheet with one column per testing block, a conditioning study stored " +
    "sideways, and a hiking log where durations are typed as `2h 45m`. " +
    "\"Everything you need is in there. It is just in the wrong shape.\"",
  missions: [
    {
      id: 'l4m1',
      title: 'Long is the useful shape',
      xp: 45,
      teach:
        "**Wide** data has one column per measurement; **long** data has one row per measurement. " +
        "ggplot2 and most statistics want long. `pivot_longer()` takes the columns to stack, a `names_to` " +
        "for the old column names and a `values_to` for the numbers.",
      task:
        "From `fitness`: drop the `run_2km_min` column (it has text in it, we'll deal with that later), " +
        "then stack the four remaining test columns into `test` and `value`, keeping `test_date` as the id.",
      datasets: ['fitness'],
      starter: 'fitness |>\n  select(-run_2km_min) |>\n  ',
      hints: [
        'A minus sign inside `select()` drops a column; the same trick works for the `cols` argument of `pivot_longer()`.',
        '`pivot_longer(-test_date, names_to = "test", values_to = "value")` means "stack everything except the date".',
        'fitness |> select(-run_2km_min) |> pivot_longer(-test_date, names_to = "test", values_to = "value")',
      ],
      solution:
        'fitness |>\n  select(-run_2km_min) |>\n  pivot_longer(-test_date, names_to = "test", values_to = "value")',
      check: `local({
  want <- fitness |> dplyr::select(-run_2km_min) |>
    tidyr::pivot_longer(-test_date, names_to = "test", values_to = "value")
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("test_date", "test", "value"), exact = TRUE),
    rlab_want_rows(got, nrow(want), "Four tests x 24 dates. Did \`run_2km_min\` get dropped first?"),
    rlab_want_set(got$test, want$test, "The values in \`test\`"),
    rlab_want_value(sum(got$value, na.rm = TRUE), sum(want$value, na.rm = TRUE), "the total of \`value\`", tol = 1e-8)
  )
})`,
    },
    {
      id: 'l4m2',
      title: 'Two things in one column name',
      xp: 55,
      teach:
        "`csplus_b3` packs two facts into one name: which cue, and which block. Give `names_to` **two** names " +
        "and a `names_pattern` with a capture group `( )` for each, and `pivot_longer()` splits them apart as it goes.",
      task:
        "Stack all sixteen `cs…` columns of `pavlov` into one `ratio` column, splitting the names into " +
        "`cue` (`plus` or `minus`) and `block` (the number).",
      datasets: ['pavlov'],
      starter:
        'pavlov |>\n  pivot_longer(\n    cols = starts_with("cs"),\n    names_to = c("cue", "block"),\n    names_pattern = "",\n    values_to = "ratio"\n  )',
      hints: [
        'The names look like `csplus_b1`. The pattern has to match the whole name, with brackets around the two parts you want to keep.',
        'In an R string, a backslash has to be doubled: `\\\\d+` means "one or more digits".',
        '`names_pattern = "cs(plus|minus)_b(\\\\d+)"`',
      ],
      solution:
        'pavlov |>\n  pivot_longer(\n    cols = starts_with("cs"),\n    names_to = c("cue", "block"),\n    names_pattern = "cs(plus|minus)_b(\\\\d+)",\n    values_to = "ratio"\n  )',
      check: `local({
  want <- tidyr::pivot_longer(pavlov, cols = dplyr::starts_with("cs"),
    names_to = c("cue", "block"), names_pattern = "cs(plus|minus)_b(\\\\d+)",
    values_to = "ratio")
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("subject", "drug", "sex", "cue", "block", "ratio"), exact = TRUE),
    rlab_want_rows(got, nrow(want), "48 animals x 2 cues x 8 blocks."),
    rlab_want_set(got$cue, c("plus", "minus"), "The values in \`cue\`"),
    rlab_want_set(got$block, as.character(1:8), "The values in \`block\`"),
    rlab_want_value(sum(got$ratio, na.rm = TRUE), sum(want$ratio, na.rm = TRUE), "the total of \`ratio\`", tol = 1e-8)
  )
})`,
    },
    {
      id: 'l4m3',
      title: 'And back again',
      xp: 50,
      teach:
        "`pivot_wider()` is the mirror image: `names_from` says which column becomes the new column names, " +
        "`values_from` says what fills them. You need it whenever a reader (or a paired t-test) wants one row per person.",
      task:
        "From `rt_task`: force `condition` to lowercase (the labels were typed inconsistently), keep trials " +
        "with `rt` between 150 and 2000, then give me **one row per participant** with a `congruent` and an " +
        "`incongruent` column holding that person's mean `rt`.",
      datasets: ['rt_task'],
      starter:
        'rt_task |>\n  mutate(condition = tolower(condition)) |>\n  filter(rt > 150, rt < 2000) |>\n  group_by(pid, condition) |>\n  summarise(mean_rt = mean(rt)) |>\n  ',
      hints: [
        'Summarise first to one number per participant per condition, then widen.',
        '`pivot_wider(names_from = condition, values_from = mean_rt)`',
        'Add `pivot_wider(names_from = condition, values_from = mean_rt)` to the end of the pipe.',
      ],
      solution:
        'rt_task |>\n  mutate(condition = tolower(condition)) |>\n  filter(rt > 150, rt < 2000) |>\n  group_by(pid, condition) |>\n  summarise(mean_rt = mean(rt)) |>\n  pivot_wider(names_from = condition, values_from = mean_rt)',
      check: `local({
  want <- rt_task |>
    dplyr::mutate(condition = tolower(condition)) |>
    dplyr::filter(rt > 150, rt < 2000) |>
    dplyr::group_by(pid, condition) |>
    dplyr::summarise(mean_rt = mean(rt), .groups = "drop") |>
    tidyr::pivot_wider(names_from = condition, values_from = mean_rt) |>
    dplyr::arrange(pid)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("pid", "congruent", "incongruent"), exact = TRUE),
    rlab_want_rows(got, 40, "One row per participant, and there are 40 of them."),
    rlab_want_col_values(dplyr::arrange(got, pid), "congruent", want$congruent, tol = 1e-8),
    rlab_want_col_values(dplyr::arrange(got, pid), "incongruent", want$incongruent, tol = 1e-8)
  )
})`,
    },
    {
      id: 'l4m4',
      title: 'Text that should be a number',
      xp: 55,
      teach:
        "`2h 45m` is text, and you cannot average text. `separate_wider_regex()` cuts a column into pieces " +
        "using a pattern: named pieces become new columns, unnamed pieces are thrown away.",
      task:
        "From `hikes`, split `duration` into `hours` and `mins`, then add a numeric column `total_min` " +
        "(hours × 60 + minutes) and return only `trail`, `distance_km` and `total_min`.",
      datasets: ['hikes'],
      starter:
        'hikes |>\n  separate_wider_regex(\n    duration,\n    patterns = c(hours = "", "", mins = "", "")\n  ) |>\n  ',
      hints: [
        'The pieces of `2h 45m` are: digits, then `h `, then digits, then `m`. Only the digit pieces get names.',
        'The split pieces come out as **text**, so wrap them in `as.numeric()` before doing arithmetic.',
        'patterns = c(hours = "\\\\d+", "h ", mins = "\\\\d+", "m") then `mutate(total_min = as.numeric(hours) * 60 + as.numeric(mins))`',
      ],
      solution:
        'hikes |>\n' +
        '  separate_wider_regex(\n' +
        '    duration,\n' +
        '    patterns = c(hours = "\\\\d+", "h ", mins = "\\\\d+", "m")\n' +
        '  ) |>\n' +
        '  mutate(total_min = as.numeric(hours) * 60 + as.numeric(mins)) |>\n' +
        '  select(trail, distance_km, total_min)',
      check: `local({
  want <- hikes |>
    tidyr::separate_wider_regex(duration,
      patterns = c(hours = "\\\\d+", "h ", mins = "\\\\d+", "m")) |>
    dplyr::mutate(total_min = as.numeric(hours) * 60 + as.numeric(mins)) |>
    dplyr::select(trail, distance_km, total_min)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("trail", "distance_km", "total_min"), exact = TRUE),
    rlab_want_rows(got, nrow(hikes)),
    rlab_want_class(got$total_min, "numeric", "\`total_min\`"),
    rlab_want_col_values(got, "total_min", want$total_min, tol = 1e-8)
  )
})`,
    },
    {
      id: 'l4m5',
      title: 'Joining a lookup table',
      xp: 55,
      teach:
        "`left_join()` glues columns from a second table onto the first, matching on a shared column, and " +
        "keeps **every** row of the left table. Rows with no match get `NA` — which is how you discover that " +
        "your text keys don't line up.",
      task:
        "Tidy the `trail` column of `hikes` with `str_trim()` and `str_to_title()`, join `trail_info` onto it, " +
        "then return one row with `n_unmatched`: how many hikes still have no `region`.",
      datasets: ['hikes', 'trail_info'],
      starter: 'hikes |>\n  mutate(trail = ) |>\n  ',
      hints: [
        'Clean in one `mutate()`: `trail = str_to_title(str_trim(trail))`. Trim before you re-case.',
        '`left_join(trail_info, by = "trail")` adds `region` and `grade`.',
        'Finish with `summarise(n_unmatched = sum(is.na(region)))`.',
      ],
      solution:
        'hikes |>\n' +
        '  mutate(trail = str_to_title(str_trim(trail))) |>\n' +
        '  left_join(trail_info, by = "trail") |>\n' +
        '  summarise(n_unmatched = sum(is.na(region)))',
      debrief:
        "Trimming and re-casing fixes most of it, but a few typed names (`Munt Solitary`, `Mount Solitaary`) " +
        "will never match a lookup table. In a real project that number is the first thing a reviewer asks about.",
      check: `local({
  want <- hikes |>
    dplyr::mutate(trail = stringr::str_to_title(stringr::str_trim(trail))) |>
    dplyr::left_join(trail_info, by = "trail") |>
    dplyr::summarise(n_unmatched = sum(is.na(region)))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, "n_unmatched"),
    rlab_want_rows(got, 1),
    if (rlab_near(got$n_unmatched[1], sum(is.na(dplyr::left_join(hikes, trail_info, by = "trail")$region)), 1e-9))
      "That is the count *without* cleaning the names first — trim the whitespace and fix the capitalisation before you join." else character(0),
    rlab_want_value(got$n_unmatched[1], want$n_unmatched[1], "\`n_unmatched\`")
  )
})`,
    },
    {
      id: 'l4m6',
      title: 'Labels a human typed',
      xp: 55,
      teach:
        "`case_when()` is a chain of tests: the first one that is `TRUE` wins, and `.default` catches the rest. " +
        "With `str_detect()` it will rescue a grouping column that four different people typed four different ways.",
      task:
        "Clean the `group` column of `wellbeing` down to exactly three labels — `Control`, `Mindfulness` and " +
        "`Exercise` — and return a count of each. (`Cntrol`, `control ` and `CONTROL` are all controls.)",
      datasets: ['wellbeing'],
      starter:
        'wellbeing |>\n  mutate(\n    group = case_when(\n      \n    )\n  ) |>\n  count(group)',
      hints: [
        'Lowercase everything first so you only have to write each test once: `str_to_lower(str_trim(group))`.',
        'Every control label starts with a `c`, every mindfulness label with an `m`. `str_detect(g, "^c")` tests "starts with c".',
        'case_when(str_detect(str_to_lower(str_trim(group)), "^c") ~ "Control", str_detect(str_to_lower(str_trim(group)), "^m") ~ "Mindfulness", .default = "Exercise")',
      ],
      solution:
        'wellbeing |>\n' +
        '  mutate(\n' +
        '    g = str_to_lower(str_trim(group)),\n' +
        '    group = case_when(\n' +
        '      str_detect(g, "^c") ~ "Control",\n' +
        '      str_detect(g, "^m") ~ "Mindfulness",\n' +
        '      .default = "Exercise"\n' +
        '    )\n' +
        '  ) |>\n' +
        '  count(group)',
      check: `local({
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("group", "n")),
    rlab_want_rows(got, 3, "Three conditions means three rows. Any label left over means a test didn't catch it."),
    rlab_want_set(got$group, c("Control", "Exercise", "Mindfulness"), "The cleaned labels"),
    rlab_want_value(sum(got$n), nrow(wellbeing), "the total count"),
    rlab_want_value(sort(got$n), c(60, 60, 60), "the three group sizes")
  )
})`,
    },
    {
      id: 'l4boss',
      title: 'Boss: the inherited spreadsheet',
      boss: true,
      xp: 150,
      teach:
        "Everything at once. `drop_na()` removes rows with missing values in the columns you name — and only " +
        "those columns. Watch the order of your steps: dropping before reverse-scoring and dropping after give " +
        "the same answer here, but widening before summarising does not.",
      task:
        "Turn `wellbeing` into the table Dr. Finch asked for:\n" +
        "1. clean `group` to `Control` / `Mindfulness` / `Exercise`\n" +
        "2. keep only people with **no missing item responses** across the ten `ses` columns\n" +
        "3. reverse-score items 2, 5, 6, 8 and 9\n" +
        "4. stack the ten items into one row per person per item (`item`, `score`)\n" +
        "5. return one row per group with `n_people` (how many people) and `mean_score` " +
        "(mean of every item score in that group, rounded to 2 dp)",
      datasets: ['wellbeing'],
      starter: 'wellbeing |>\n  ',
      hints: [
        '`drop_na(starts_with("ses"))` handles step 2 in one call.',
        'After pivoting longer, each person appears ten times — so `n_people` needs `n_distinct(id)`, not `n()`.',
        'summarise(n_people = n_distinct(id), mean_score = round(mean(score), 2), .by = group)',
      ],
      solution:
        'wellbeing |>\n' +
        '  mutate(\n' +
        '    g = str_to_lower(str_trim(group)),\n' +
        '    group = case_when(\n' +
        '      str_detect(g, "^c") ~ "Control",\n' +
        '      str_detect(g, "^m") ~ "Mindfulness",\n' +
        '      .default = "Exercise"\n' +
        '    )\n' +
        '  ) |>\n' +
        '  drop_na(starts_with("ses")) |>\n' +
        '  mutate(across(c(ses2, ses5, ses6, ses8, ses9), ~ 6 - .x)) |>\n' +
        '  pivot_longer(starts_with("ses"), names_to = "item", values_to = "score") |>\n' +
        '  group_by(group) |>\n' +
        '  summarise(n_people = n_distinct(id), mean_score = round(mean(score), 2))',
      check: `local({
  want <- wellbeing |>
    dplyr::mutate(g = stringr::str_to_lower(stringr::str_trim(group)),
      group = dplyr::case_when(
        stringr::str_detect(g, "^c") ~ "Control",
        stringr::str_detect(g, "^m") ~ "Mindfulness",
        .default = "Exercise")) |>
    tidyr::drop_na(dplyr::starts_with("ses")) |>
    dplyr::mutate(dplyr::across(c(ses2, ses5, ses6, ses8, ses9), ~ 6 - .x)) |>
    tidyr::pivot_longer(dplyr::starts_with("ses"), names_to = "item", values_to = "score") |>
    dplyr::group_by(group) |>
    dplyr::summarise(n_people = dplyr::n_distinct(id), mean_score = round(mean(score), 2)) |>
    dplyr::arrange(group)
  got <- .rlab_answer
  gs <- if (is.data.frame(got) && "group" %in% names(got)) dplyr::arrange(got, group) else got
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("group", "n_people", "mean_score"), exact = TRUE),
    rlab_want_rows(got, 3, "One row per cleaned group."),
    rlab_want_set(got$group, want$group, "The group labels"),
    if (any(gs$n_people > 100))
      "\`n_people\` looks like a row count, not a person count — after pivoting, each person has ten rows. Try \`n_distinct(id)\`." else character(0),
    rlab_want_col_values(gs, "n_people", want$n_people),
    rlab_want_col_values(gs, "mean_score", want$mean_score, tol = 1e-6)
  )
})`,
    },
  ],
};
