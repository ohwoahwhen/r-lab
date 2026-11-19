export default {
  id: 'l2',
  n: 2,
  title: 'The Filter Room',
  blurb: 'select, filter and arrange — cutting a table down to what you need.',
  story:
    "\"Good. Now the real work.\" Dr. Finch drops two datasets on you: a self-esteem questionnaire from a " +
    "departing PhD student, and a scrape of Sydney property sales she insists is \"for a paper about " +
    "financial stress, not because I'm house hunting\". " +
    "\"Give me only the bits I ask for. Nobody reads a 400-row table.\"",
  missions: [
    {
      id: 'l2m1',
      theory:
        "dplyr is built as a small set of verbs that all obey the same contract: a data frame goes in, a data frame comes out, and the data is always the first argument. That is what makes them chain.\n\nBecause the shape of the output is predictable, you can read a pipeline you have never seen and know what each step did to the table. Compare that with a spreadsheet, where the operations happened in some order nobody recorded and the only evidence is the final file.\n\nTwo of the verbs are about shape: `select()` changes which columns you have, `filter()` changes which rows. Almost everything else is a variation on those two axes.",
      title: 'Keep the columns you want',
      xp: 35,
      teach:
        "`select()` keeps columns. You name them, unquoted, in the order you want them back. " +
        "Everything in dplyr takes the data frame first, which is exactly what the pipe hands it.",
      task:
        "From `hikes`, keep only `trail`, `distance_km` and `pack_kg`, in that order.",
      datasets: ['hikes'],
      starter: 'hikes |>\n  ',
      hints: [
        'The function is `select()` and the column names go inside it, separated by commas.',
        'No quotes needed around column names in dplyr.',
        '`hikes |> select(trail, distance_km, pack_kg)`',
      ],
      solution: 'hikes |>\n  select(trail, distance_km, pack_kg)',
      check: `local({
  want <- c("trail", "distance_km", "pack_kg")
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, want, exact = TRUE),
    rlab_want_col_order(.rlab_answer, want),
    rlab_want_rows(.rlab_answer, nrow(hikes), "select() keeps every row — it only drops columns.")
  )
})`,
    },
    {
      id: 'l2m2',
      theory:
        "`starts_with()` and friends are a small language for naming columns, called tidyselect. It exists because real questionnaires have `ses1` through `ses10`, and nobody should type all ten.\n\nThe alternative is selecting by position \u2014 `df[, 2:11]` \u2014 and that is a trap. It is correct exactly until someone inserts a column, at which point it silently selects the wrong eleven columns and nothing errors. Selecting by name fails loudly instead, which is what you want.\n\nThe habit generalises: prefer describing *what you want* over *where it currently is*. Data moves.",
      title: 'Select without typing ten names',
      xp: 40,
      teach:
        "Questionnaires have columns like `ses1 … ses10`. `select()` takes **helpers** so you don't type them all: " +
        "`starts_with()`, `ends_with()`, `contains()` and `num_range()`.",
      task:
        "From `wellbeing`, keep `id` and all ten self-esteem item columns (they all start with `ses`). " +
        "That's 11 columns, with `id` first.",
      datasets: ['wellbeing'],
      starter: 'wellbeing |>\n  ',
      hints: [
        'The helper takes the prefix as a quoted string: `starts_with("ses")`.',
        'You can mix a plain column name and a helper in the same `select()`.',
        '`wellbeing |> select(id, starts_with("ses"))`',
      ],
      solution: 'wellbeing |>\n  select(id, starts_with("ses"))',
      check: `local({
  want <- c("id", sprintf("ses%d", 1:10))
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, want, exact = TRUE),
    rlab_want_col_order(.rlab_answer, want)
  )
})`,
    },
    {
      id: 'l2m3',
      theory:
        "`filter()` keeps the rows where your condition is `TRUE`. That sounds obvious until you remember the third possibility.\n\nA condition can come back `TRUE`, `FALSE`, or `NA` \u2014 and `NA` is not `TRUE`, so those rows are dropped. Filter on `age > 18` in a dataset where some ages are missing and those people vanish, with no warning and no error. It is the most common way a sample quietly shrinks.\n\nAnd the double equals: `=` assigns, `==` compares. R is one of the friendlier languages here, because it will usually refuse rather than silently assign inside a function call.",
      title: 'Keep the rows you want',
      xp: 40,
      teach:
        "`filter()` keeps **rows** that make a condition `TRUE`. The comparison operators are " +
        "`>`, `<`, `>=`, `<=`, `==` for equal and `!=` for not equal. Note the double equals — a single `=` is assignment.",
      task: "From `sydney_property`, keep only the sales with 4 or more bedrooms.",
      datasets: ['sydney_property'],
      starter: 'sydney_property |>\n  ',
      hints: [
        'The column is `beds`, and "4 or more" is `>=`.',
        'Row filtering is `filter()`, not `select()`.',
        '`sydney_property |> filter(beds >= 4)`',
      ],
      solution: 'sydney_property |>\n  filter(beds >= 4)',
      check: `local({
  want <- dplyr::filter(sydney_property, beds >= 4)
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, names(sydney_property), exact = TRUE),
    rlab_want_rows(.rlab_answer, nrow(want),
      if (nrow(.rlab_answer) > nrow(want)) "Did you use > instead of >=, or forget the condition?" else "Did you use > instead of >=?"),
    rlab_want_value(sum(.rlab_answer$beds), sum(want$beds), "the total bedrooms in your result")
  )
})`,
    },
    {
      id: 'l2m4',
      theory:
        "A comma inside `filter()` means **and**, and `|` means or. English is the opposite way round from logic here \u2014 \"participants in the control and mindfulness groups\" is, to a computer, `group == \"Control\" | group == \"Mindfulness\"`. Nobody is in both.\n\n`%in%` exists because chaining `|` gets unreadable fast, and because it says what you mean: is this value one of these?\n\n`is.na()` is a separate function rather than a comparison for a good reason. `x == NA` asks \"is this unknown value equal to some other unknown value?\", and the only honest answer is `NA`. So the test never selects anything, and you get an empty result instead of an error.",
      title: 'Several conditions at once',
      xp: 45,
      teach:
        "Commas inside `filter()` mean **and**. Use `|` for or, `%in%` to test membership of a set, and " +
        "`is.na()` to find gaps — put `!` in front to keep the rows that are *not* missing.",
      task:
        "From `sydney_property`, keep the sales that have **3 or more bedrooms**, **at least 3 bathrooms**, " +
        "and a parking value that is **not missing**.",
      datasets: ['sydney_property'],
      starter: 'sydney_property |>\n  filter(\n    \n  )',
      hints: [
        'Three conditions, separated by commas, all inside one `filter()`.',
        '"Not missing" is `!is.na(parking)`. You cannot test it with `parking != NA` — that always gives NA.',
        '`sydney_property |> filter(beds >= 3, baths >= 3, !is.na(parking))`',
      ],
      solution: 'sydney_property |>\n  filter(beds >= 3, baths >= 3, !is.na(parking))',
      check: `local({
  want <- dplyr::filter(sydney_property, beds >= 3, baths >= 3, !is.na(parking))
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_no_na(.rlab_answer, "parking"),
    rlab_want_rows(.rlab_answer, nrow(want),
      "Check all three conditions are there, including the one about missing parking."),
    rlab_want_value(min(.rlab_answer$beds), 3, "the smallest number of bedrooms you kept"),
    rlab_want_value(min(.rlab_answer$baths), 3, "the smallest number of bathrooms you kept")
  )
})`,
    },
    {
      id: 'l2m5',
      theory:
        "Sorting changes nothing about your data \u2014 same rows, same values, different order. It is purely for reading.\n\nTwo details worth knowing. `arrange()` is **stable**: rows that tie keep their original relative order, so the same code gives the same table every time, which matters if you are pasting results into a paper.\n\nAnd `NA` always sorts to the bottom, whether you ask for ascending or descending. R refuses to pretend it knows where an unknown value belongs. So \"the top 5\" quietly means \"the top 5 of the ones we know about\".",
      title: 'Put it in order',
      xp: 40,
      teach:
        "`arrange()` sorts rows, smallest first. Wrap a column in `desc()` to flip it. Give it two columns and " +
        "the second breaks ties in the first. `head(n)` then takes the top n rows.",
      task:
        "From `hikes`, return the **5 hikes with the most elevation gain**, highest first, keeping all columns.",
      datasets: ['hikes'],
      starter: 'hikes |>\n  ',
      hints: [
        'Sort on `elev_m`, but biggest first — that needs `desc()`.',
        'Chain a third step onto the pipe to keep only the top 5.',
        '`hikes |> arrange(desc(elev_m)) |> head(5)`',
      ],
      solution: 'hikes |>\n  arrange(desc(elev_m)) |>\n  head(5)',
      check: `local({
  want <- head(dplyr::arrange(hikes, dplyr::desc(elev_m)), 5)
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_rows(.rlab_answer, 5, "Trim it to the top five with \`head(5)\`."),
    if (identical(.rlab_answer$elev_m, head(sort(hikes$elev_m), 5)))
      "You sorted smallest-first. Wrap the column in \`desc()\` to go the other way." else character(0),
    rlab_want_col_values(.rlab_answer, "elev_m", want$elev_m)
  )
})`,
    },
    {
      id: 'l2boss',
      theory:
        "Order matters in a pipeline, for two different reasons.\n\nPractically: filter early. Every later step then works on less data, which on a real dataset is the difference between instant and a coffee break.\n\nLogically: each step sees only what the previous one left. Select away a column and you cannot filter on it afterwards. Sort before filtering and you did the sorting for nothing.\n\nThe deeper value is that the pipeline *is* the record. Anyone, including you next year, can read exactly which rows were excluded and why. That is reproducibility \u2014 not a virtue you add at the end, just a side effect of writing the steps down.",
      title: 'Boss: the inspection shortlist',
      boss: true,
      xp: 130,
      teach:
        "No new ideas here — just put three verbs in the right order. Remember that `select()` after a sort " +
        "keeps the sort, and that the order of your pipe steps is the order R does them.",
      task:
        "Build Dr. Finch's shortlist from `sydney_property`:\n" +
        "- only sales with **4 or more bedrooms** and **4 or more bathrooms**\n" +
        "- only rows where `parking` was recorded\n" +
        "- sorted by **bedrooms, most first**, then by **bathrooms, most first**\n" +
        "- keeping only `suburb`, `type`, `beds`, `baths`, `parking`, in that order",
      datasets: ['sydney_property'],
      starter: 'sydney_property |>\n  ',
      hints: [
        'Four steps: `filter()`, then `arrange()`, then `select()`. Filtering first keeps the later steps cheap.',
        '`arrange(desc(beds), desc(baths))` sorts by the first column and breaks ties with the second.',
        'sydney_property |> filter(beds >= 4, baths >= 4, !is.na(parking)) |> arrange(desc(beds), desc(baths)) |> select(suburb, type, beds, baths, parking)',
      ],
      solution:
        'sydney_property |>\n  filter(beds >= 4, baths >= 4, !is.na(parking)) |>\n  arrange(desc(beds), desc(baths)) |>\n  select(suburb, type, beds, baths, parking)',
      check: `local({
  want <- sydney_property |>
    dplyr::filter(beds >= 4, baths >= 4, !is.na(parking)) |>
    dplyr::arrange(dplyr::desc(beds), dplyr::desc(baths)) |>
    dplyr::select(suburb, type, beds, baths, parking)
  cols <- c("suburb", "type", "beds", "baths", "parking")
  rlab_seq(
    rlab_want_df(.rlab_answer),
    rlab_want_cols(.rlab_answer, cols, exact = TRUE),
    rlab_want_col_order(.rlab_answer, cols),
    rlab_want_rows(.rlab_answer, nrow(want), "Check all three filter conditions."),
    rlab_want_no_na(.rlab_answer, "parking"),
    rlab_want_col_values(.rlab_answer, "beds", want$beds),
    rlab_want_col_values(.rlab_answer, "baths", want$baths),
    rlab_want_col_values(.rlab_answer, "suburb", want$suburb)
  )
})`,
    },
  ],
};
