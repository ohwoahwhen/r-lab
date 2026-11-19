export default {
  id: 'l5',
  n: 5,
  title: 'First Light',
  blurb: 'ggplot2 from scratch: aes, geoms, distributions and labels.',
  story:
    "\"Numbers in a table are for me. Pictures are for everyone else.\" " +
    "Dr. Finch turns her monitor around: a conference deadline is in eleven days and she has no figures. " +
    "\"Every plot is the same three things. Data, a mapping from columns to things you can see, and a layer " +
    "that draws it. Build them in that order and you will never be stuck.\"",
  missions: [
    {
      id: 'l5m1',
      title: 'Three ingredients',
      xp: 45,
      teach:
        "`ggplot(data, aes(x = …, y = …))` sets up the canvas and says which column drives which axis. " +
        "Nothing appears until you add a layer with `+`. `geom_point()` draws one dot per row.",
      task:
        "Plot `hikes` with `distance_km` on the x axis and `elev_m` on the y axis, as points.",
      datasets: ['hikes'],
      starter: 'ggplot(hikes, aes(x = , y = )) +\n  ',
      hints: [
        'The layer goes on a new line after a `+` at the end of the previous line.',
        'The `+` must end the line — if you start a line with `+`, R thinks the plot was finished.',
        '`ggplot(hikes, aes(x = distance_km, y = elev_m)) + geom_point()`',
      ],
      solution: 'ggplot(hikes, aes(x = distance_km, y = elev_m)) +\n  geom_point()',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_n_layers(.rlab_answer, 1),
  rlab_want_geom(.rlab_answer, "point"),
  rlab_want_aes(.rlab_answer, x = "distance_km", y = "elev_m"),
  rlab_want_plot_rows(.rlab_answer, nrow(hikes))
)`,
    },
    {
      id: 'l5m2',
      title: 'A third variable, for free',
      xp: 50,
      teach:
        "Anything inside `aes()` is a **mapping** from data to a visual channel: `colour`, `size`, `shape`, " +
        "`alpha`. Anything outside `aes()` is a fixed setting. `colour = pack_kg` colours by the data; " +
        "`colour = \"red\"` paints everything red.",
      task:
        "Same scatter plot of `hikes` (`distance_km` by `elev_m`), but colour the points by `pack_kg`.",
      datasets: ['hikes'],
      starter: 'ggplot(hikes, aes(x = distance_km, y = elev_m)) +\n  ',
      hints: [
        '`colour` belongs inside `aes()`, next to x and y.',
        'British or American spelling both work — `colour` and `color` are the same argument.',
        '`ggplot(hikes, aes(x = distance_km, y = elev_m, colour = pack_kg)) + geom_point()`',
      ],
      solution:
        'ggplot(hikes, aes(x = distance_km, y = elev_m, colour = pack_kg)) +\n  geom_point()',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, "point"),
  rlab_want_aes(.rlab_answer, x = "distance_km", y = "elev_m", colour = "pack_kg")
)`,
    },
    {
      id: 'l5m3',
      title: 'Bars of numbers you already have',
      xp: 50,
      teach:
        "Two bar geoms, and the difference matters: `geom_bar()` **counts rows** for you, while `geom_col()` " +
        "draws bars at the height you give it in `y`. If you have already summarised, you want `geom_col()`.",
      task:
        "From `rt_task`, keep trials with `rt` between 150 and 2000, get the mean `rt` per `block`, then draw " +
        "one bar per block with `factor(block)` on x and the mean on y.",
      datasets: ['rt_task'],
      starter:
        'rt_task |>\n  filter(rt > 150, rt < 2000) |>\n  summarise(mean_rt = mean(rt), .by = block) |>\n  ggplot(aes(x = , y = )) +\n  ',
      hints: [
        'The pipe can feed `ggplot()` too — the summarised table becomes the plot data.',
        'Wrapping x in `factor()` stops ggplot treating block 1, 2, 3 as a continuous number line.',
        '`ggplot(aes(x = factor(block), y = mean_rt)) + geom_col()`',
      ],
      solution:
        'rt_task |>\n' +
        '  filter(rt > 150, rt < 2000) |>\n' +
        '  summarise(mean_rt = mean(rt), .by = block) |>\n' +
        '  ggplot(aes(x = factor(block), y = mean_rt)) +\n' +
        '  geom_col()',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_n_layers(.rlab_answer, 1),
  if (identical(rlab_geoms(.rlab_answer), "bar"))
    "\`geom_bar()\` counts rows, so your bars are all height 1. You already have the heights — use \`geom_col()\`." else character(0),
  rlab_want_geom(.rlab_answer, "col"),
  rlab_want_aes(.rlab_answer,
    x = c("factor(block)", "as.factor(block)", "as.character(block)", "factor(block, levels = 1:3)"),
    y = "mean_rt"),
  rlab_want_plot_rows(.rlab_answer, 3),
  rlab_want_built_rows(.rlab_answer, 3)
)`,
    },
    {
      id: 'l5m4',
      title: 'The shape of a distribution',
      xp: 50,
      teach:
        "A histogram slices one continuous variable into bins and counts what falls in each. There is no `y` " +
        "— ggplot computes it. Always set `bins` (or `binwidth`) yourself; the default of 30 is a placeholder, " +
        "not a recommendation.",
      task:
        "Draw a histogram of every `rt` in `rt_task` with **40 bins**. Leave the anticipations and lapses in — " +
        "you want to see them.",
      datasets: ['rt_task'],
      starter: 'ggplot(rt_task, aes(x = )) +\n  ',
      hints: [
        'Only `x` goes in `aes()` for a histogram.',
        '`bins` is an argument of the geom, not of `aes()`.',
        '`ggplot(rt_task, aes(x = rt)) + geom_histogram(bins = 40)`',
      ],
      solution: 'ggplot(rt_task, aes(x = rt)) +\n  geom_histogram(bins = 40)',
      debrief:
        "That long tail on the right is the lapses, and the little spike near zero is the anticipations. " +
        "This is why reaction-time papers always report their exclusion rules.",
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_n_layers(.rlab_answer, 1),
  rlab_want_aes(.rlab_answer, x = "rt"),
  rlab_want_no_aes(.rlab_answer, "y"),
  rlab_want_stat(.rlab_answer, "bin"),
  rlab_want_built_rows(.rlab_answer, 40)
)`,
    },
    {
      id: 'l5m5',
      title: 'Boxes by group',
      xp: 50,
      teach:
        "A boxplot compares distributions side by side: the box is the middle half of the data, the line is the " +
        "median, the dots are outliers. Put the grouping variable on `x` and the number on `y`.",
      task:
        "From `rt_task`, keep trials with `rt` between 150 and 2000, lowercase the `condition` labels, then " +
        "draw a boxplot with `condition` on x and `rt` on y.",
      datasets: ['rt_task'],
      starter:
        'rt_task |>\n  filter(rt > 150, rt < 2000) |>\n  mutate(condition = tolower(condition)) |>\n  ',
      hints: [
        'Pipe into `ggplot()` and then add the layer.',
        'The geom is `geom_boxplot()`, and it needs both x and y mapped.',
        '`ggplot(aes(x = condition, y = rt)) + geom_boxplot()`',
      ],
      solution:
        'rt_task |>\n' +
        '  filter(rt > 150, rt < 2000) |>\n' +
        '  mutate(condition = tolower(condition)) |>\n' +
        '  ggplot(aes(x = condition, y = rt)) +\n' +
        '  geom_boxplot()',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, "boxplot"),
  rlab_want_aes(.rlab_answer, x = "condition", y = "rt"),
  local({
    d <- rlab_plot_data(.rlab_answer)
    if (!is.data.frame(d)) "The plot has no data attached." else
    if (length(unique(d$condition)) != 2)
      sprintf("The plot data has %d different condition labels, not 2 — lowercase them before plotting.",
              length(unique(d$condition))) else character(0)
  }),
  rlab_want_built_rows(.rlab_answer, 2)
)`,
    },
    {
      id: 'l5m6',
      title: 'Say what it is',
      xp: 50,
      teach:
        "A figure with no labels is not a figure. `labs()` sets `title`, `subtitle`, `x`, `y`, `caption` and the " +
        "legend title (named after the aesthetic, e.g. `colour =`). Axis labels default to the column name, " +
        "which no reader should ever have to read.",
      task:
        "Take the coloured scatter plot of `hikes` again (`distance_km` by `elev_m`, coloured by `pack_kg`) and " +
        "label it:\n" +
        "- title `Elevation gain by distance`\n" +
        "- x `Distance (km)`\n" +
        "- y `Elevation gain (m)`\n" +
        "- legend `Pack (kg)`",
      datasets: ['hikes'],
      starter:
        'ggplot(hikes, aes(x = distance_km, y = elev_m, colour = pack_kg)) +\n  geom_point() +\n  labs(\n    \n  )',
      hints: [
        'Each label is an argument of `labs()`, separated by commas, with the text in quotes.',
        'The legend title uses the name of the aesthetic it belongs to: `colour = "Pack (kg)"`.',
        'labs(title = "Elevation gain by distance", x = "Distance (km)", y = "Elevation gain (m)", colour = "Pack (kg)")',
      ],
      solution:
        'ggplot(hikes, aes(x = distance_km, y = elev_m, colour = pack_kg)) +\n' +
        '  geom_point() +\n' +
        '  labs(\n' +
        '    title = "Elevation gain by distance",\n' +
        '    x = "Distance (km)",\n' +
        '    y = "Elevation gain (m)",\n' +
        '    colour = "Pack (kg)"\n' +
        '  )',
      check: `rlab_seq(
  rlab_want_gg(.rlab_answer),
  rlab_want_geom(.rlab_answer, "point"),
  rlab_want_aes(.rlab_answer, x = "distance_km", y = "elev_m", colour = "pack_kg"),
  rlab_want_labs(.rlab_answer,
    title = "Elevation gain by distance",
    x = "Distance (km)",
    y = "Elevation gain (m)",
    colour = "Pack (kg)")
)`,
    },
    {
      id: 'l5boss',
      title: 'Boss: recreate the chart',
      boss: true,
      kind: 'plot',
      xp: 150,
      teach:
        "No code this time, just the finished figure. Read it: what is on each axis, what the colours mean, " +
        "how many points there are, and what the labels say. Then build it.",
      task:
        "Rebuild the chart on the right **exactly**.\n" +
        "What you need to know, and nothing more:\n" +
        "- it starts from `hikes`, with `trail` cleaned by `str_to_title(str_trim(trail))` and joined to `trail_info`\n" +
        "- hikes whose trail name never matched the lookup table are **dropped**\n" +
        "- the points are `size = 2`\n" +
        "- everything else you can see in the picture",
      datasets: ['hikes', 'trail_info'],
      starter: 'hikes |>\n  ',
      target:
        'hikes |>\n' +
        '  mutate(trail = str_to_title(str_trim(trail))) |>\n' +
        '  left_join(trail_info, by = "trail") |>\n' +
        '  filter(!is.na(region)) |>\n' +
        '  ggplot(aes(x = distance_km, y = elev_m, colour = region)) +\n' +
        '  geom_point(size = 2) +\n' +
        '  labs(\n' +
        '    title = "Elevation gain by distance",\n' +
        '    x = "Distance (km)",\n' +
        '    y = "Elevation gain (m)",\n' +
        '    colour = "Region"\n' +
        '  )',
      hints: [
        'The pipeline is the one from level 4: clean the trail names, `left_join(trail_info, by = "trail")`, then drop the rows with no region.',
        'The colours are a *category*, so something categorical is mapped to `colour` — look at the legend title for which column.',
        'ggplot(aes(x = distance_km, y = elev_m, colour = region)) + geom_point(size = 2) + labs(title = "Elevation gain by distance", x = "Distance (km)", y = "Elevation gain (m)", colour = "Region")',
      ],
      solution:
        'hikes |>\n' +
        '  mutate(trail = str_to_title(str_trim(trail))) |>\n' +
        '  left_join(trail_info, by = "trail") |>\n' +
        '  filter(!is.na(region)) |>\n' +
        '  ggplot(aes(x = distance_km, y = elev_m, colour = region)) +\n' +
        '  geom_point(size = 2) +\n' +
        '  labs(\n' +
        '    title = "Elevation gain by distance",\n' +
        '    x = "Distance (km)",\n' +
        '    y = "Elevation gain (m)",\n' +
        '    colour = "Region"\n' +
        '  )',
      check: `local({
  n_ok <- hikes |>
    dplyr::mutate(trail = stringr::str_to_title(stringr::str_trim(trail))) |>
    dplyr::left_join(trail_info, by = "trail") |>
    dplyr::filter(!is.na(region)) |>
    nrow()
  p <- .rlab_answer
  rlab_seq(
    rlab_want_gg(p),
    rlab_want_n_layers(p, 1),
    rlab_want_geom(p, "point"),
    rlab_want_aes(p, x = "distance_km", y = "elev_m", colour = "region"),
    rlab_want_plot_rows(p, n_ok),
    local({
      d <- rlab_built(p)
      if (is.null(d)) character(0) else
      if (!("size" %in% names(d))) character(0) else
      if (!rlab_near(unique(d$size)[1], 2, 1e-9))
        sprintf("The points are size %s; the target uses \`size = 2\`.", rlab_fmt(unique(d$size)[1])) else character(0)
    }),
    rlab_want_labs(p,
      title = "Elevation gain by distance",
      x = "Distance (km)",
      y = "Elevation gain (m)",
      colour = "Region")
  )
})`,
    },
  ],
};
