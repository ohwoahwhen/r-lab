export default {
  id: 'l7',
  n: 7,
  needsStats: true,
  title: 'Numbers That Mean Something',
  blurb: 'Descriptives, reliability, t-tests, correlations, effect sizes and APA reporting.',
  story:
    "The figure went down well. Now a reviewer has written the sentence every psychology student " +
    "eventually meets: *\"The authors report a significant difference but provide no effect size.\"* " +
    "Dr. Finch forwards it to you without comment. " +
    "\"`wellbeing_scored` is the clean, reverse-scored version. Three conditions, a pre and post " +
    "measure, and a reviewer who can count decimal places.\"",
  missions: [
    {
      id: 'l7m1',
      theory:
        "A mean is a bet. If you had to guess one person's score knowing nothing else about them, the mean is your best single guess \u2014 and the standard deviation is how wrong that guess typically is.\n\nThat is why the two always travel together. A mean of 33 means something completely different when SD = 1 (everyone is basically the same) than when SD = 12 (the group is all over the place). A mean on its own is half a finding.\n\nThe habit worth building is to look at the group sizes first. Unequal *n* is not a problem in itself, but it changes which tests are safe, and it is often the first sign that something went wrong further upstream in your cleaning.",
      title: 'Describe before you test',
      xp: 50,
      teach:
        "Every results section starts with means and standard deviations, not p values. If you cannot " +
        "describe the groups, you cannot interpret a test of them — and a weird mean is the fastest way " +
        "to catch a coding mistake.",
      task:
        "From `wellbeing_scored`, return one row per `group` with `n` (how many people), `mean_ses` and " +
        "`sd_ses` (the mean and SD of `ses_total`, each rounded to 2 decimal places).",
      datasets: ['wellbeing_scored'],
      starter: 'wellbeing_scored |>\n  ',
      hints: [
        'This is level 3 again: `summarise()` with `.by = group`, or `group_by()` then `summarise()`.',
        '`n()` counts, and `round(x, 2)` goes around each of the other two.',
        'summarise(n = n(), mean_ses = round(mean(ses_total), 2), sd_ses = round(sd(ses_total), 2), .by = group)',
      ],
      solution:
        'wellbeing_scored |>\n' +
        '  summarise(\n' +
        '    n = n(),\n' +
        '    mean_ses = round(mean(ses_total), 2),\n' +
        '    sd_ses = round(sd(ses_total), 2),\n' +
        '    .by = group\n' +
        '  )',
      check: `local({
  want <- dplyr::summarise(wellbeing_scored, n = dplyr::n(),
    mean_ses = round(mean(ses_total), 2), sd_ses = round(sd(ses_total), 2),
    .by = group) |> dplyr::arrange(group)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("group", "n", "mean_ses", "sd_ses"), exact = TRUE),
    rlab_want_rows(got, 3, "Three conditions, three rows."),
    rlab_want_col_values(dplyr::arrange(got, group), "n", want$n),
    rlab_want_col_values(dplyr::arrange(got, group), "mean_ses", want$mean_ses, tol = 1e-6),
    rlab_want_col_values(dplyr::arrange(got, group), "sd_ses", want$sd_ses, tol = 1e-6)
  )
})`,
    },
    {
      id: 'l7m2',
      theory:
        "Ten questions about self-esteem are ten noisy attempts to measure one invisible thing. Alpha asks whether they agree with each other enough to be treated as a single scale.\n\nThe logic is consistency. If the people who agree with item 1 also tend to agree with items 2 through 10, the items are picking up a shared signal. If their answers are unrelated, you do not have a scale \u2014 you have ten unrelated questions that you are about to average together, which is worse than useless.\n\nTwo cautions. Alpha rises as you add items, so a long mediocre scale can still score well. And alpha tells you nothing about *what* is being measured, only that something consistent is: a scale can be perfectly reliable and measure the wrong construct.\n\nThe familiar \".7 is acceptable\" cutoff is a convention, not a fact. It traces back to an offhand suggestion of Nunnally's and hardened into a gate. What counts as adequate depends on the use: .7 is thin for a decision about an individual and ample for a group comparison. Report the number and let it be read, rather than labelling it pass or fail.",
      title: 'Does the scale hang together?',
      xp: 55,
      teach:
        "Cronbach's alpha asks whether ten items are measuring one thing. `psych::alpha()` wants a data " +
        "frame of **already reverse-scored** items — run it on raw items and the reversed ones drag alpha " +
        "down, which is the single most common way to report a scale as broken when it isn't.",
      task:
        "Compute Cronbach's alpha for the ten `ses` items in `wellbeing_scored` and return the raw alpha " +
        "as a single number, rounded to 3 decimal places.",
      datasets: ['wellbeing_scored'],
      starter: 'items <- wellbeing_scored |>\n  select(num_range("ses", 1:10))\n\n',
      hints: [
        '`psych::alpha(items)` returns a big list. The number you want is in `$total$raw_alpha`.',
        'psych wants a plain data frame, so wrap the items in `as.data.frame()`.',
        'round(psych::alpha(as.data.frame(items))$total$raw_alpha, 3)',
      ],
      solution:
        'items <- wellbeing_scored |>\n' +
        '  select(num_range("ses", 1:10))\n\n' +
        'round(psych::alpha(as.data.frame(items))$total$raw_alpha, 3)',
      debrief:
        "α = .84, which is solid for a group-level comparison like this one. Try it again on the *unscored* " +
        "`wellbeing` and watch it collapse — that is what a reverse-scoring mistake looks like from the outside.",
      check: `local({
  items <- as.data.frame(dplyr::select(wellbeing_scored, dplyr::num_range("ses", 1:10)))
  want <- round(suppressWarnings(psych::alpha(items)$total$raw_alpha), 3)
  raw <- as.data.frame(dplyr::select(wellbeing, dplyr::num_range("ses", 1:10)))
  wrong <- round(suppressWarnings(psych::alpha(raw, warnings = FALSE)$total$raw_alpha), 3)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    if (rlab_near(got, wrong, 0.02))
      "That is alpha on the *raw* items, before reverse-scoring. Use \`wellbeing_scored\`, where items 2, 5, 6, 8 and 9 have already been flipped." else character(0),
    rlab_want_value(got, want, "alpha", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l7m3',
      theory:
        "The t-test asks one question. Is the gap between these two means bigger than the gap you would expect from sampling noise alone?\n\n*t* is a ratio: the difference between the means, divided by how much the means themselves bounce around from sample to sample. A *t* of 2 means the gap is twice the size of typical noise. That is also why larger samples detect smaller effects \u2014 more data shrinks the denominator, not the difference.\n\nWelch's version does not assume the two groups have equal spread. It costs almost nothing when they do and saves you when they do not, which is why R makes it the default, and why your degrees of freedom come out as 110.70 rather than a whole number.\n\nOne thing to be honest about here: the study has **three** groups and you are testing two of them. That is legitimate only because this comparison was planned before anyone saw the data \u2014 control versus the mindfulness arm is the study's primary question. Picking whichever two groups happened to differ most and *then* running a t-test is one of the most common forms of p-hacking in psychology, and the output looks identical either way. Level 11 covers how to do this properly.",
      title: 'Two groups, one test',
      xp: 55,
      teach:
        "`t.test(outcome ~ group, data = d)` compares two groups. R defaults to **Welch's** t-test, which " +
        "does not assume the groups have equal variances — that is the right default, and why your degrees " +
        "of freedom come out with decimals.",
      task:
        "Compare `ses_total` between the **Control** and **Mindfulness** groups of `wellbeing_scored` with " +
        "a t-test, and return the test itself (not just one number).",
      datasets: ['wellbeing_scored'],
      starter: 'wellbeing_scored |>\n  filter(group %in% c("Control", "Mindfulness")) |>\n  ',
      hints: [
        '`t.test()` takes the data as a named argument, so from a pipe it is `t.test(ses_total ~ group, data = _)` — or save the filtered data first and call `t.test()` on it.',
        'The grouping column must have exactly two levels left, which the filter takes care of.',
        'two <- filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))\nt.test(ses_total ~ group, data = two)',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        't.test(ses_total ~ group, data = two)',
      debrief:
        "The t is negative because R compares the groups in factor order: Control minus Mindfulness. " +
        "The sign is information, not a mistake — it tells you which way round the difference goes.",
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  want <- t.test(ses_total ~ group, data = two)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_htest(got, "the result of \`t.test()\`"),
    rlab_want_method(got, "t-test", "That is a test, but not a t-test."),
    rlab_want_method(got, "Welch", "That is a Student's t-test. Leave \`var.equal\` alone so R uses Welch's, which is the default and the safer choice."),
    rlab_want_field(got, "statistic", want$statistic, "the t statistic"),
    rlab_want_field(got, "parameter", want$parameter, "the degrees of freedom"),
    rlab_want_field(got, "p.value", want$p.value, "the p value", tol = 1e-5)
  )
})`,
    },
    {
      id: 'l7m4',
      theory:
        "*p* answers \"could this be noise?\". *d* answers \"is it big?\". They are different questions, and a large enough sample will hand you a tiny *p* for an effect nobody would care about.\n\n*d* puts the difference in standard deviation units, so *d* = 0.5 means the groups sit half a standard deviation apart. Cohen's landmarks of .2, .5 and .8 were offered as a last resort for fields with no better yardstick \u2014 where you know the literature, compare against what others have found instead.\n\nThe interval matters more than the point estimate. From \u22120.82 to \u22120.07 says the data are consistent with a sizeable effect and also with one that barely exists. That uncertainty is real, and reporting it is the honest move.",
      title: 'How big is it, though',
      xp: 55,
      teach:
        "A p value tells you whether an effect is distinguishable from zero; it says nothing about size. " +
        "Cohen's *d* is the difference in standard deviation units. `effectsize::cohens_d()` takes the same " +
        "formula as `t.test()` and gives you a confidence interval with it.",
      task:
        "Compute Cohen's *d* for the same Control vs Mindfulness comparison of `ses_total`, and return the " +
        "result.",
      datasets: ['wellbeing_scored'],
      starter: 'two <- wellbeing_scored |>\n  filter(group %in% c("Control", "Mindfulness"))\n\n',
      hints: [
        'The call looks exactly like the t-test: `cohens_d(ses_total ~ group, data = two)`.',
        'The package is `effectsize` and it is already loaded, so you do not need the `effectsize::` prefix.',
        'cohens_d(ses_total ~ group, data = two)',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'cohens_d(ses_total ~ group, data = two)',
      debrief:
        "d = −0.45 with a CI from −0.82 to −0.07. Cohen would call that small-to-medium — and the interval " +
        "tells you the data are also compatible with an effect near zero. That is the sentence the reviewer wanted.",
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  want <- effectsize::cohens_d(ses_total ~ group, data = two)
  got <- .rlab_answer
  rlab_seq(
    if (inherits(got, "htest"))
      "That is the t-test again. This mission wants the effect size — \`cohens_d()\`." else character(0),
    if (!is.data.frame(got))
      sprintf("Your answer should be the result of \`cohens_d()\`, but it is %s. %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    rlab_want_cols(got, "Cohens_d"),
    rlab_want_value(got$Cohens_d[1], want$Cohens_d[1], "Cohen's d", tol = 1e-4),
    rlab_want_value(got$CI_low[1], want$CI_low[1], "the lower bound of the CI", tol = 1e-3)
  )
})`,
    },
    {
      id: 'l7m5',
      theory:
        "*r* measures how tightly two variables move together, from \u22121 through 0 to 1. It is scale-free: it does not care whether you measured in points, centimetres or dollars.\n\nSquare it and it becomes interpretable. *r* = .64 gives *r\u00b2* = .41, so about 41% of the variation in one variable lines up with the other, and the remaining 59% is everything else.\n\nTwo traps. *r* only sees straight-line relationships, so a perfect U-shape can produce an *r* near zero. And a correlation between two measures taken at the same time, from the same person, in the same questionnaire, is partly just shared method \u2014 not a discovery.",
      title: 'Two things that move together',
      xp: 50,
      teach:
        "`cor.test(x, y)` gives you Pearson's *r*, its confidence interval, degrees of freedom and a p value " +
        "in one object. Degrees of freedom for a correlation are *n* − 2, which is how a reader checks how " +
        "much data you actually had.",
      task:
        "Test the correlation between `wellbeing_pre` and `ses_total` in `wellbeing_scored`, and return the " +
        "test.",
      datasets: ['wellbeing_scored'],
      starter: '',
      hints: [
        '`cor.test()` takes two vectors, not a formula — pull the columns out with `$`.',
        'Order does not matter for a correlation.',
        'cor.test(wellbeing_scored$wellbeing_pre, wellbeing_scored$ses_total)',
      ],
      solution: 'cor.test(wellbeing_scored$wellbeing_pre, wellbeing_scored$ses_total)',
      check: `local({
  want <- cor.test(wellbeing_scored$wellbeing_pre, wellbeing_scored$ses_total)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_htest(got, "the result of \`cor.test()\`"),
    rlab_want_method(got, "correlation", "That is a test, but not a correlation test."),
    rlab_want_field(got, "estimate", want$estimate, "r", tol = 1e-4),
    rlab_want_field(got, "parameter", want$parameter, "the degrees of freedom"),
    rlab_want_field(got, "p.value", want$p.value, "the p value", tol = 1e-20)
  )
})`,
    },
    {
      id: 'l7m6',
      theory:
        "The formatting rules are not fussiness for its own sake. Each one exists to stop a specific misreading.\n\nThe leading zero is dropped from *p* because *p* can never exceed 1 \u2014 the space in front of the decimal point can never be used, so removing it signals \"this is a probability\". And *p* is never reported as .000, because that claims an impossible certainty. What you actually mean is \"smaller than my rounding can show\", which is written *p* < .001.\n\nDegrees of freedom sit in the brackets because they tell the reader how much data stood behind the number. Two studies both reporting *t* = 2.38 are not equally convincing if one has df = 10 and the other df = 500.",
      title: 'Write it the way APA wants it',
      xp: 60,
      teach:
        "APA has rules and reviewers enforce them: *t* and *d* to two decimals, *p* to three with **no " +
        "leading zero** (p can never exceed 1), and anything below .001 reported as `p < .001`. " +
        "`sprintf()` builds the string: `%.2f` is a two-decimal number, `%s` drops in text.",
      task:
        "Run the Control vs Mindfulness t-test again and return **exactly** this sentence as a single " +
        "string, with the real numbers in it:\n\n" +
        "`t(110.70) = -2.38, p = .019`\n\n" +
        "Build it with `sprintf()` rather than typing the numbers — the whole point is that it updates " +
        "itself when the data change.",
      datasets: ['wellbeing_scored'],
      starter:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n' +
        'tt <- t.test(ses_total ~ group, data = two)\n\n' +
        'sprintf(\n  \n)',
      hints: [
        'The pieces you need are `tt$parameter` (df), `tt$statistic` (t) and `tt$p.value`.',
        'Strip the leading zero off the p value with `sub("^0", "", sprintf("%.3f", tt$p.value))`.',
        'sprintf("t(%.2f) = %.2f, p = %s", tt$parameter, tt$statistic, sub("^0", "", sprintf("%.3f", tt$p.value)))',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n' +
        'tt <- t.test(ses_total ~ group, data = two)\n\n' +
        'sprintf(\n' +
        '  "t(%.2f) = %.2f, p = %s",\n' +
        '  tt$parameter,\n' +
        '  tt$statistic,\n' +
        '  sub("^0", "", sprintf("%.3f", tt$p.value))\n' +
        ')',
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  tt <- t.test(ses_total ~ group, data = two)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^t\\\\(-?[0-9]+\\\\.[0-9]{2}\\\\) = -?[0-9]+\\\\.[0-9]{2}, p [=<] \\\\.?[0-9]+$",
      sprintf("The shape isn't right. I expected something like \`t(110.70) = -2.38, p = .019\` and got \`%s\`. Check the brackets, the commas and the number of decimal places.", got)),
    rlab_want_nums(got, c(tt$parameter, tt$statistic, tt$p.value),
      c("degrees of freedom", "t statistic", "p value"))
  )
})`,
    },
    {
      id: 'l7boss',
      theory:
        "A results sentence is a self-contained argument: here is what the groups looked like, here is the test, here is how big the difference was. A reader should be able to check your arithmetic, compute an effect size you did not report, or drop your study into a meta-analysis, without emailing you.\n\nThat is why the descriptives come first. A test statistic without the means is a verdict with no evidence attached.",
      title: 'Boss: the paragraph the reviewer wanted',
      boss: true,
      xp: 170,
      teach:
        "A results sentence carries the descriptives, the test and the effect size, in that order, so the " +
        "reader never has to go looking. Everything you need you have already computed once.",
      task:
        "Return a single string in exactly this shape, with the real numbers filled in:\n\n" +
        "`Control participants scored lower on self-esteem (M = 00.00, SD = 0.00) than those in the " +
        "mindfulness condition (M = 00.00, SD = 0.00), t(000.00) = -0.00, p = .000, d = -0.00.`\n\n" +
        "The rules:\n" +
        "- means and SDs are of `ses_total`, two decimals each, Control first\n" +
        "- the t-test and Cohen's *d* are the Control vs Mindfulness comparison, as R returns them\n" +
        "- *p* gets three decimals with no leading zero (`.019`), or `< .001` if it is smaller than that\n" +
        "- the sentence ends with a full stop",
      datasets: ['wellbeing_scored'],
      starter:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'tt <- t.test(ses_total ~ group, data = two)\n' +
        'd  <- cohens_d(ses_total ~ group, data = two)\n\n',
      hints: [
        'Pull each group\'s numbers out with something like `ctrl <- filter(two, group == "Control")$ses_total`, then `mean(ctrl)` and `sd(ctrl)`.',
        'Cohen\'s d is in `d$Cohens_d`. The p value formatting is the same `sub("^0", "", sprintf("%.3f", ...))` trick as last mission.',
        'sprintf("Control participants scored lower on self-esteem (M = %.2f, SD = %.2f) than those in the mindfulness condition (M = %.2f, SD = %.2f), t(%.2f) = %.2f, p = %s, d = %.2f.", mean(ctrl), sd(ctrl), mean(mind), sd(mind), tt$parameter, tt$statistic, p_txt, d$Cohens_d)',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'tt <- t.test(ses_total ~ group, data = two)\n' +
        'd  <- cohens_d(ses_total ~ group, data = two)\n\n' +
        'ctrl <- two$ses_total[two$group == "Control"]\n' +
        'mind <- two$ses_total[two$group == "Mindfulness"]\n' +
        'p_txt <- if (tt$p.value < .001) "< .001" else sub("^0", "", sprintf("%.3f", tt$p.value))\n\n' +
        'sprintf(\n' +
        '  "Control participants scored lower on self-esteem (M = %.2f, SD = %.2f) than those in the mindfulness condition (M = %.2f, SD = %.2f), t(%.2f) = %.2f, p = %s, d = %.2f.",\n' +
        '  mean(ctrl), sd(ctrl), mean(mind), sd(mind),\n' +
        '  tt$parameter, tt$statistic, p_txt, d$Cohens_d\n' +
        ')',
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  tt <- t.test(ses_total ~ group, data = two)
  dd <- effectsize::cohens_d(ses_total ~ group, data = two)
  ctrl <- two$ses_total[two$group == "Control"]
  mind <- two$ses_total[two$group == "Mindfulness"]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^Control participants scored lower on self-esteem \\\\(M = ",
      "Start the sentence exactly as the template does, from \\"Control participants scored lower\\"."),
    rlab_want_match(got, "\\\\.$", "The sentence should end with a full stop."),
    rlab_want_match(got, "than those in the mindfulness condition",
      "The middle of the sentence should read \\"than those in the mindfulness condition\\"."),
    rlab_want_match(got, "t\\\\([0-9]+\\\\.[0-9]{2}\\\\) = -?[0-9]+\\\\.[0-9]{2}, p [=<] \\\\.?[0-9]+, d = -?[0-9]+\\\\.[0-9]{2}\\\\.$",
      "The statistics at the end should read like \`t(110.70) = -2.38, p = .019, d = -0.45.\` — check the decimal places."),
    rlab_want_nums(got,
      c(mean(ctrl), sd(ctrl), mean(mind), sd(mind), tt$parameter, tt$statistic, tt$p.value, dd$Cohens_d[1]),
      c("Control mean", "Control SD", "Mindfulness mean", "Mindfulness SD",
        "degrees of freedom", "t statistic", "p value", "Cohen's d"))
  )
})`,
    },
  ],
};
