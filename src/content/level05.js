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
      theory:
        "ggplot is not a collection of chart functions. It is a grammar: you name the data, say which columns map to which visual properties, and add layers that draw something. A scatter plot is not a thing in ggplot \u2014 it is points, positioned by two variables.\n\nThat is why you can build a figure nobody wrote a function for. Once position, colour, size and shape are all just channels you can map data to, new chart types are sentences you compose rather than functions you hope exist.\n\nThe `+` instead of `|>` is a historical accident \u2014 ggplot predates the pipe. Think of it as \"and then add\", and remember it has to end the line, because R reads a line ending in `+` as unfinished and a line starting with `+` as finished-then-nonsense.",
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
      theory:
        "Everything confusing about ggplot comes back to one line: inside `aes()` means *from the data*, outside means *a fixed value*.\n\n`colour = pack_kg` says \"let the data decide each point's colour\", so ggplot builds a scale and a legend. `colour = \"red\"` outside `aes()` says \"make them all red\". Put `colour = \"red\"` *inside* `aes()` and you get something surprising but perfectly logical: a variable with one value called \"red\", a legend, and points in ggplot's default first colour, which is not red.\n\nWhen a plot comes out with an unwanted legend, this is nearly always why.",
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
      theory:
        "Every layer quietly runs a statistical transformation before drawing. Usually it is `identity` \u2014 draw the numbers as given. Sometimes it is not.\n\n`geom_bar()` defaults to counting rows, which is why it needs only an x. `geom_col()` draws the heights you supply. Same picture, completely different question: one asks \"how many?\", the other \"how much?\".\n\nKnowing which geoms do maths for you is what stops the classic bug of summarising your data carefully and then handing it to a geom that summarises it again.",
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
      theory:
        "A histogram has a parameter in it, and that parameter changes the story. Wide bins smooth a distribution into a single hump; narrow bins shatter it into spikes. Neither is the truth \u2014 both are views.\n\nSo the number of bins is a decision you are making about what to show, which is why ggplot prints that slightly nagging message about picking a better value. It is reminding you that it guessed.\n\nLook at more than one bin width before you believe a shape. Bimodality in particular can appear and vanish depending entirely on where the bin edges fall.",
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
      theory:
        "The box spans the middle half of the data, the line is the median, and the whiskers reach the furthest point within 1.5 times the box height. Anything beyond is drawn individually. That convention is Tukey's and it is arbitrary, which is worth knowing before you call those points \"outliers\" as though the plot had tested something.\n\nA boxplot is a five-number summary, so it hides everything a summary hides. Two groups with identical boxplots can have completely different distributions \u2014 one flat, one strongly bimodal.\n\nFor small samples, show the points. A boxplot of six observations has the authority of a statistical graphic and the information content of a shrug.",
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
      theory:
        "Default axis labels are column names, and column names are written for the computer: lowercase, no spaces, no units. `elev_m` is fine in code and not fine in a figure caption.\n\nFigures travel. Yours will end up on a slide, in a thesis, screenshotted into a group chat \u2014 always separated from the paragraph that explained it. A figure has to survive on its own.\n\nWhile you are there: units belong in the axis label, and meaning should never ride on colour alone. Roughly one man in twelve has some form of red-green colour deficiency, and they are reading your poster too.",
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
      theory:
        "Rebuilding someone else's figure is the fastest way to learn to read figures. You stop seeing a picture and start seeing decisions: what is on each axis, what the colours encode, which rows made it in, what got dropped.\n\nIt is also a real test of a methods section. If you cannot reproduce a figure from the description given, the description was incomplete \u2014 and that is exactly the exercise reviewers and replication teams perform on published work.\n\nNote what is being checked here. Not pixels \u2014 the *structure*: layers, mappings, data, labels. Two plots can look identical and be built from different data, and only one of them is right.",
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
