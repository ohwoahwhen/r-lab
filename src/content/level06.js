export default {
  id: 'l6',
  n: 6,
  title: 'Polish',
  blurb: 'Facets, scales, colour, themes and annotation — turning a plot into a figure.',
  story:
    "The conference abstract was accepted. \"Now they want the actual figure,\" Dr. Finch says, " +
    "\"and the reviewers at this conference are the kind who measure your axis labels.\" " +
    "She has tidied the datasets for you — `hikes_clean`, `rt_clean` and `pavlov_long` are the " +
    "outputs of everything you built in levels 1 to 4. \"You've earned those. Use them.\"",
  missions: [
    {
      id: 'l6m1',
      theory:
        "Faceting makes **small multiples**: the same plot, repeated across groups, on shared axes. Tufte's argument for them is that once a reader learns how to read one panel, every other panel is free.\n\nThe shared axes are the point. Comparison across panels is honest because nothing moved. The moment each panel gets its own scale, differences between panels stop being readable, which is why `scales = \"free\"` should be a deliberate choice rather than a reflex.\n\nThe alternative \u2014 four groups overplotted in one panel in four colours \u2014 is usually worse. Colour is a weak channel for comparing shapes, and overlap hides exactly the dense regions you most want to see.",
      title: 'Small multiples',
      xp: 50,
      teach:
        "`facet_wrap(~ column)` splits one plot into a panel per group, all sharing the same axes. " +
        "It is almost always better than cramming four groups into one panel with four colours.",
      task:
        "Plot `hikes_clean` with `distance_km` on x and `elev_m` on y as points, then split it into " +
        "one panel per `region`.",
      datasets: ['hikes_clean'],
      starter: 'ggplot(hikes_clean, aes(x = distance_km, y = elev_m)) +\n  geom_point() +\n  ',
      hints: [
        'The facet goes on with a `+`, like a geom.',
        'The column name goes after a tilde: `~ region`.',
        '`facet_wrap(~ region)`',
      ],
      solution:
        'ggplot(hikes_clean, aes(x = distance_km, y = elev_m)) +\n  geom_point() +\n  facet_wrap(~ region)',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, "point"),
  rlab_want_aes(.rlab_answer, x = "distance_km", y = "elev_m"),
  rlab_want_facet(.rlab_answer, "region", kind = "wrap")
)`,
    },
    {
      id: 'l6m2',
      theory:
        "`facet_wrap()` takes one variable and flows the panels like text. `facet_grid()` crosses two, so a panel's position tells you its values: read along a row to hold sex constant, down a column to hold drug constant.\n\nThat positional meaning is the reason to pay for the extra ink. A grid makes a two-way design visible as a shape, and an interaction in a two-by-two grid is something you can often see before you test it.\n\nUse wrap when panels are just a list. Use grid when the crossing itself is the structure you want read.",
      title: 'A grid of panels',
      xp: 55,
      teach:
        "`facet_grid(rows ~ cols)` crosses **two** variables: rows for one, columns for the other. " +
        "Use it when both splits matter at once and you want to read along a row and down a column.",
      task:
        "Summarise `pavlov_long` to the mean `ratio` for each combination of `drug`, `sex`, `cue` and " +
        "`block`, call it `mean_ratio`, then plot `block` against `mean_ratio` as lines coloured by `cue`, " +
        "with **rows for `sex`** and **columns for `drug`**.",
      datasets: ['pavlov_long'],
      starter:
        'pavlov_long |>\n  summarise(mean_ratio = mean(ratio), .by = c(drug, sex, cue, block)) |>\n  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n  geom_line() +\n  ',
      hints: [
        'The rows variable goes on the left of the tilde, the columns variable on the right.',
        'It is `facet_grid(sex ~ drug)`, not `facet_grid(drug ~ sex)` — rows first.',
        '`facet_grid(sex ~ drug)`',
      ],
      solution:
        'pavlov_long |>\n' +
        '  summarise(mean_ratio = mean(ratio), .by = c(drug, sex, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n' +
        '  geom_line() +\n' +
        '  facet_grid(sex ~ drug)',
      check: `local({
  p <- .rlab_answer
  rlab_seq(
    rlab_want_gg(p),
    rlab_want_geom(p, "line"),
    rlab_want_aes(p, x = "block", y = "mean_ratio", colour = "cue"),
    rlab_want_facet(p, c("sex", "drug"), kind = "grid"),
    local({
      f <- rlab_prop(p, "facet")
      rows <- names(tryCatch(f$params$rows, error = function(e) NULL))
      if (length(rows) && rows[1] != "sex")
        sprintf("\`%s\` is on the rows, but \`sex\` should be. Rows go on the left of the tilde.", rows[1])
      else character(0)
    }),
    rlab_want_plot_rows(p, nrow(dplyr::summarise(pavlov_long, m = mean(ratio),
                                                 .by = c(drug, sex, cue, block))))
  )
})`,
    },
    {
      id: 'l6m3',
      theory:
        "Axis limits are an editorial decision and they are the easiest way to mislead with a true chart. Truncating a y-axis magnifies a trivial difference into a dramatic one; the technique is so reliable that news graphics departments use it on purpose.\n\nThe honest default depends on the measure. Bar charts encode value by length, so they need to start at zero or the lengths lie. Line charts of temperature or IQ do not, because zero is not a meaningful anchor there.\n\nOne trap specific to ggplot: `scale_*_continuous(limits = ...)` **removes** data outside the range before anything is computed, which can change a trend line or a boxplot. `coord_cartesian(ylim = ...)` zooms instead, keeping all the data. If setting limits changed your summary layer, that is why.",
      title: 'Take control of an axis',
      xp: 55,
      teach:
        "`scale_y_continuous()` controls an axis: `limits` sets where it starts and stops, `breaks` sets " +
        "where the labelled ticks go. Setting both stops ggplot from quietly choosing a range that flatters " +
        "your data.",
      task:
        "Draw `hikes_clean` as points, `pack_kg` on x and `pace_min_km` on y, and force the y axis to run " +
        "from **5 to 20** with ticks every **2.5** (that is 5, 7.5, 10 … 20).",
      datasets: ['hikes_clean'],
      starter:
        'ggplot(hikes_clean, aes(x = pack_kg, y = pace_min_km)) +\n  geom_point() +\n  scale_y_continuous(\n    \n  )',
      hints: [
        '`limits` takes two numbers: `limits = c(5, 20)`.',
        '`seq(5, 20, by = 2.5)` builds the breaks without typing them all.',
        '`scale_y_continuous(limits = c(5, 20), breaks = seq(5, 20, by = 2.5))`',
      ],
      solution:
        'ggplot(hikes_clean, aes(x = pack_kg, y = pace_min_km)) +\n' +
        '  geom_point() +\n' +
        '  scale_y_continuous(limits = c(5, 20), breaks = seq(5, 20, by = 2.5))',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, "point"),
  rlab_want_aes(.rlab_answer, x = "pack_kg", y = "pace_min_km"),
  rlab_want_limits(.rlab_answer, "y", c(5, 20)),
  rlab_want_breaks(.rlab_answer, "y", seq(5, 20, by = 2.5))
)`,
    },
    {
      id: 'l6m4',
      theory:
        "Colour is a data encoding, not decoration, and it has a budget. Most people can reliably track about six or seven categorical colours at once; beyond that a legend becomes a lookup table and the reader gives up.\n\nChoosing your own serves two purposes. It lets colour carry meaning \u2014 red for the cue that predicts something, grey for the one that does not \u2014 and it lets you pick a palette that survives colour vision deficiency and greyscale printing.\n\nNaming values by level, rather than giving a bare list, is a correctness issue rather than a style one. An unnamed list is matched in factor order, so the day someone reorders a factor, your colours swap and your figure now says the opposite thing, silently.",
      title: 'Colours you chose',
      xp: 55,
      teach:
        "`scale_colour_manual(values = ...)` replaces ggplot's default palette with yours. Name the values " +
        "after the levels — `c(\"CS+\" = \"#ef4444\", ...)` — and the mapping is explicit, so it cannot " +
        "silently swap when the factor order changes.",
      task:
        "Summarise `pavlov_long` to the mean `ratio` per `drug`, `cue` and `block` as `mean_ratio`, plot it " +
        "as lines of `block` against `mean_ratio` coloured by `cue`, faceted by `drug`, and set the colours " +
        "so that **CS+ is `#ef4444`** and **CS− is `#94a3b8`**.",
      datasets: ['pavlov_long'],
      starter:
        'pavlov_long |>\n  summarise(mean_ratio = mean(ratio), .by = c(drug, cue, block)) |>\n  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n  geom_line() +\n  facet_wrap(~ drug) +\n  ',
      hints: [
        'The function is `scale_colour_manual()` and it takes one argument, `values`.',
        'Name each colour after the level it belongs to, so the order cannot bite you.',
        '`scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8"))`',
      ],
      solution:
        'pavlov_long |>\n' +
        '  summarise(mean_ratio = mean(ratio), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n' +
        '  geom_line() +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8"))',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, "line"),
  rlab_want_aes(.rlab_answer, x = "block", y = "mean_ratio", colour = "cue"),
  rlab_want_facet(.rlab_answer, "drug", kind = "wrap"),
  rlab_want_manual_colours(.rlab_answer, "colour",
    c("CS+" = "#ef4444", "CS-" = "#94a3b8"))
)`,
    },
    {
      id: 'l6m5',
      theory:
        "A theme controls everything that is not data: fonts, gridlines, background, legend position. That separation is the useful part \u2014 you can restyle a figure for a thesis, a slide and a poster without touching the analysis.\n\nOrder matters because a complete theme like `theme_minimal()` replaces every setting at once. Put it after your `theme()` tweaks and it overwrites them. Complete theme first, adjustments second.\n\nMost defaults exist to be changed. The grey panel ggplot ships with was chosen so that light-coloured points stay visible; if your points are dark, it is just ink. And legends on the right steal horizontal space from the data, which is why moving them to the bottom often makes a figure breathe.",
      title: 'Dress it down',
      xp: 50,
      teach:
        "A complete theme like `theme_minimal()` replaces every visual setting at once. `theme()` on top of " +
        "it tweaks single pieces — `legend.position`, `axis.text`, `strip.text`. Put the complete theme first, " +
        "or it will wipe out your tweaks.",
      task:
        "Take the same faceted, hand-coloured plot and give it `theme_minimal()`, then move the legend to " +
        "the **bottom**.",
      datasets: ['pavlov_long'],
      starter:
        'pavlov_long |>\n' +
        '  summarise(mean_ratio = mean(ratio), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n' +
        '  geom_line() +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8")) +\n  ',
      hints: [
        'Two more things on the pipe of `+`: the complete theme, then the tweak.',
        '`theme(legend.position = "bottom")` — the value is a quoted string.',
        '`theme_minimal() + theme(legend.position = "bottom")`',
      ],
      solution:
        'pavlov_long |>\n' +
        '  summarise(mean_ratio = mean(ratio), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n' +
        '  geom_line() +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8")) +\n' +
        '  theme_minimal() +\n' +
        '  theme(legend.position = "bottom")',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_facet(.rlab_answer, "drug", kind = "wrap"),
  rlab_want_theme_fn(.rlab_answer, "theme_minimal"),
  rlab_want_theme_arg(.rlab_answer, "legend.position", "bottom")
)`,
    },
    {
      id: 'l6m6',
      theory:
        "Half the work of a figure is telling the reader where to look. A suppression ratio of 0.5 means the cue changed nothing \u2014 that is the line everything is measured against, so drawing it saves the reader doing arithmetic in their head.\n\nAnnotation is also where authorship shows. A plot that marks the baseline, labels the interesting region and names the comparison is an argument. One that leaves the reader to infer all of that is a data dump.\n\n`annotate()` and `geom_text()` differ in a way worth knowing. `geom_text()` draws once per row of your data, so a label on a 500-row dataset gets drawn 500 times in the same place \u2014 which is why it looks oddly bold or blurry. `annotate()` draws once.",
      title: 'Point at the thing that matters',
      xp: 55,
      teach:
        "A suppression ratio of **0.5** means the cue changed nothing. That number is the whole point of the " +
        "figure, so draw it: `geom_hline()` puts a reference line across every panel, and `annotate()` adds " +
        "one piece of text without needing a data frame.",
      task:
        "Add to the same plot:\n" +
        "- a dashed horizontal line at **0.5**\n" +
        "- the text **`no suppression`** at `x = 6`, `y = 0.54`",
      datasets: ['pavlov_long'],
      starter:
        'pavlov_long |>\n' +
        '  summarise(mean_ratio = mean(ratio), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n' +
        '  geom_line() +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8")) +\n' +
        '  theme_minimal() +\n  ',
      hints: [
        '`geom_hline(yintercept = 0.5)` draws the line; `linetype = "dashed"` goes beside it, outside any `aes()`.',
        '`annotate()` takes the geom name first, in quotes: `annotate("text", x = ..., y = ..., label = ...)`.',
        'geom_hline(yintercept = 0.5, linetype = "dashed") + annotate("text", x = 6, y = 0.54, label = "no suppression")',
      ],
      solution:
        'pavlov_long |>\n' +
        '  summarise(mean_ratio = mean(ratio), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = mean_ratio, colour = cue)) +\n' +
        '  geom_line() +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8")) +\n' +
        '  theme_minimal() +\n' +
        '  geom_hline(yintercept = 0.5, linetype = "dashed") +\n' +
        '  annotate("text", x = 6, y = 0.54, label = "no suppression")',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, c("line", "hline", "text")),
  rlab_want_hline(.rlab_answer, 0.5, linetype = "dashed"),
  rlab_want_annotation(.rlab_answer, "no suppression"),
  rlab_want_facet(.rlab_answer, "drug", kind = "wrap")
)`,
    },
    {
      id: 'l6boss',
      theory:
        "Error bars are the most misread element in psychology figures, because they can be three different things and the picture gives no clue which.\n\nStandard deviation describes the spread of the data. Standard error describes the uncertainty of the mean, and is always smaller. A 95% confidence interval is about twice the standard error. Choosing the smallest one makes your result look most precise, which is exactly why the caption must say which you used.\n\nAnd the thing almost everyone gets wrong: overlapping error bars do not mean \"not significant\". Two means with overlapping standard-error bars can differ significantly; non-overlapping 95% intervals usually do, but it is a rule of thumb, not a test. Bars show uncertainty. They do not perform the comparison for you.",
      title: 'Boss: the figure for the paper',
      boss: true,
      kind: 'plot',
      xp: 160,
      teach:
        "Error bars need a number for the spread, and the standard error is `sd(x) / sqrt(length(x))`. " +
        "`geom_errorbar()` takes `ymin` and `ymax` inside `aes()`. Layers are drawn in the order you add " +
        "them, so the reference line goes on first and the points go on last.",
      task:
        "Rebuild the figure on the right. It comes from `pavlov_long`, summarised per `drug`, `cue` and " +
        "`block` into:\n" +
        "- `m` — the mean `ratio`\n" +
        "- `se` — `sd(ratio) / sqrt(n())`\n\n" +
        "Then, in this order: the dashed reference line at 0.5, error bars from `m - se` to `m + se` with " +
        "`width = 0.2`, lines, and points at `size = 2`. Faceted by `drug`, `theme_minimal()`, legend at the " +
        "bottom, the same two colours as before, and the labels you can read in the picture.",
      datasets: ['pavlov_long'],
      starter: 'pavlov_long |>\n  summarise(\n    \n  ) |>\n  ',
      target:
        'pavlov_long |>\n' +
        '  summarise(m = mean(ratio), se = sd(ratio) / sqrt(n()), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = m, colour = cue)) +\n' +
        '  geom_hline(yintercept = 0.5, linetype = "dashed") +\n' +
        '  geom_errorbar(aes(ymin = m - se, ymax = m + se), width = 0.2) +\n' +
        '  geom_line() +\n' +
        '  geom_point(size = 2) +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8")) +\n' +
        '  labs(\n' +
        '    title = "Conditioned suppression across training",\n' +
        '    x = "Block",\n' +
        '    y = "Suppression ratio",\n' +
        '    colour = "Cue"\n' +
        '  ) +\n' +
        '  theme_minimal() +\n' +
        '  theme(legend.position = "bottom")',
      hints: [
        'The summarise is `summarise(m = mean(ratio), se = sd(ratio) / sqrt(n()), .by = c(drug, cue, block))`.',
        '`geom_errorbar(aes(ymin = m - se, ymax = m + se), width = 0.2)` — `ymin`/`ymax` are mappings so they go inside `aes()`, but `width` is a fixed setting so it stays outside.',
        'Four layers in this order: geom_hline(yintercept = 0.5, linetype = "dashed"), geom_errorbar(aes(ymin = m - se, ymax = m + se), width = 0.2), geom_line(), geom_point(size = 2).',
      ],
      solution:
        'pavlov_long |>\n' +
        '  summarise(m = mean(ratio), se = sd(ratio) / sqrt(n()), .by = c(drug, cue, block)) |>\n' +
        '  ggplot(aes(x = block, y = m, colour = cue)) +\n' +
        '  geom_hline(yintercept = 0.5, linetype = "dashed") +\n' +
        '  geom_errorbar(aes(ymin = m - se, ymax = m + se), width = 0.2) +\n' +
        '  geom_line() +\n' +
        '  geom_point(size = 2) +\n' +
        '  facet_wrap(~ drug) +\n' +
        '  scale_colour_manual(values = c("CS+" = "#ef4444", "CS-" = "#94a3b8")) +\n' +
        '  labs(\n' +
        '    title = "Conditioned suppression across training",\n' +
        '    x = "Block",\n' +
        '    y = "Suppression ratio",\n' +
        '    colour = "Cue"\n' +
        '  ) +\n' +
        '  theme_minimal() +\n' +
        '  theme(legend.position = "bottom")',
      check: `local({
  p <- .rlab_answer
  want_rows <- nrow(dplyr::summarise(pavlov_long, m = mean(ratio), .by = c(drug, cue, block)))
  rlab_seq(
    rlab_want_gg(p),
    rlab_want_geom(p, c("hline", "errorbar", "line", "point")),
    rlab_want_n_layers(p, 4),
    rlab_want_aes(p, x = "block", y = "m", colour = "cue"),
    rlab_want_plot_rows(p, want_rows),
    local({
      i <- rlab_geom_index(p, "errorbar")
      if (is.na(i)) character(0) else rlab_seq(
        rlab_want_aes(p, ymin = "m - se", ymax = "m + se", layer = i),
        local({
          w <- rlab_layer_param(p, i, "width")
          if (is.null(w) || !rlab_near(w, 0.2, 1e-9))
            sprintf("The error bar caps are %s wide, the target uses \`width = 0.2\`.",
                    if (is.null(w)) "the default" else rlab_fmt(w)) else character(0)
        })
      )
    }),
    local({
      i <- rlab_geom_index(p, "point")
      s <- rlab_layer_param(p, i, "size")
      if (is.null(s) || !rlab_near(s, 2, 1e-9))
        sprintf("The points are %s; the target uses \`size = 2\`.",
                if (is.null(s)) "the default size" else rlab_fmt(s)) else character(0)
    }),
    rlab_want_hline(p, 0.5, linetype = "dashed"),
    rlab_want_facet(p, "drug", kind = "wrap"),
    rlab_want_manual_colours(p, "colour", c("CS+" = "#ef4444", "CS-" = "#94a3b8")),
    rlab_want_theme_fn(p, "theme_minimal"),
    rlab_want_theme_arg(p, "legend.position", "bottom"),
    rlab_want_labs(p,
      title = "Conditioned suppression across training",
      x = "Block",
      y = "Suppression ratio",
      colour = "Cue")
  )
})`,
    },
  ],
};
