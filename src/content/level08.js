export default {
  id: 'l8',
  n: 8,
  needsStats: true,
  title: 'The Analysis',
  blurb: 'ANOVA, assumptions, post-hoc comparisons, mixed designs and interactions.',
  story:
    "\"Last thing,\" says Dr. Finch, which in this lab means the biggest thing. " +
    "\"Three conditions, not two — so no more t-tests. And then the conditioning study, which is a " +
    "mixed design: drug between animals, cue within them. If you can run that and explain the " +
    "interaction, you can run most of what this field publishes.\"",
  missions: [
    {
      id: 'l8m1',
      title: 'Three groups at once',
      xp: 55,
      teach:
        "With three groups, running three t-tests inflates your false positive rate. A one-way ANOVA asks " +
        "one question first — *is anything different anywhere?* — with `aov(outcome ~ group, data = d)`. " +
        "The model object is quiet; `summary()` is what shows you F and p.",
      task:
        "From `wellbeing_scored`: drop the people with no `wellbeing_post`, add a `change` column " +
        "(`wellbeing_post` − `wellbeing_pre`), then run a one-way ANOVA of `change` by `group` and return " +
        "the **summary** of the model.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post) |>\n  mutate(change = wellbeing_post - wellbeing_pre)\n\n',
      hints: [
        'The model is `aov(change ~ group, data = w)`.',
        'Printing the model alone shows sums of squares but no test — wrap it in `summary()`.',
        'm <- aov(change ~ group, data = w)\nsummary(m)',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n\n' +
        'm <- aov(change ~ group, data = w)\n' +
        'summary(m)',
      debrief:
        "F(2, 156) = 17.12, p < .001. Something differs — but ANOVA will not tell you *which* groups. " +
        "That is what mission 4 is for.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  want <- summary(aov(change ~ group, data = w))
  wf <- rlab_anova_col(rlab_anova_row(want, "group"), "F")
  got <- .rlab_answer
  row <- rlab_anova_row(got, "group")
  rlab_seq(
    if (inherits(got, "aov") && !inherits(got, "summary.aov"))
      "That is the model itself, which prints sums of squares but no test. Wrap it in \`summary()\`." else character(0),
    if (is.null(row))
      sprintf("I couldn't find a \`group\` row in your answer (it is %s). Expected the summary of an \`aov()\` model.", rlab_desc(got)) else character(0),
    rlab_want_value(rlab_anova_col(row, "df"), 2, "the degrees of freedom for group"),
    rlab_want_value(rlab_anova_col(row, "F"), wf, "the F statistic", tol = 1e-4),
    rlab_want_value(rlab_anova_col(row, "p"), rlab_anova_col(rlab_anova_row(want, "group"), "p"),
                    "the p value", tol = 1e-9)
  )
})`,
    },
    {
      id: 'l8m2',
      title: 'How much does the grouping explain?',
      xp: 50,
      teach:
        "Eta squared (η²) is the share of variance the grouping explains — the ANOVA equivalent of Cohen's " +
        "*d*. `effectsize::eta_squared()` takes the fitted model and returns it with a confidence interval.",
      task:
        "Compute eta squared for the same ANOVA of `change` by `group`, and return the result.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post) |>\n  mutate(change = wellbeing_post - wellbeing_pre)\nm <- aov(change ~ group, data = w)\n\n',
      hints: [
        'The function takes the model, not the summary: `eta_squared(m)`.',
        'It comes from effectsize, which is already loaded.',
        'eta_squared(m)',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'm <- aov(change ~ group, data = w)\n\n' +
        'eta_squared(m)',
      debrief:
        "η² = .18, so about 18% of the variation in change scores goes with condition. For a psychology " +
        "intervention that is a large effect — and the CI reminds you how uncertain it still is.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  want <- effectsize::eta_squared(aov(change ~ group, data = w))
  got <- .rlab_answer
  rlab_seq(
    if (!is.data.frame(got))
      sprintf("Your answer should be the result of \`eta_squared()\`, but it is %s. %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    rlab_want_cols(got, "Eta2"),
    rlab_want_value(got$Eta2[1], want$Eta2[1], "eta squared", tol = 1e-4)
  )
})`,
    },
    {
      id: 'l8m3',
      title: 'Check before you believe',
      xp: 55,
      teach:
        "ANOVA assumes the groups have roughly equal variances. Levene's test checks it, and here you *want* " +
        "a non-significant result: a large p means the assumption holds. `car::leveneTest()` takes the same " +
        "formula as the model.",
      task:
        "Run Levene's test on `change` by `group` for the same data, and return it.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post) |>\n  mutate(change = wellbeing_post - wellbeing_pre)\n\n',
      hints: [
        'It is `leveneTest()` from the car package — note the capital T.',
        'It takes a formula and `data =`, exactly like `aov()`.',
        'leveneTest(change ~ group, data = w)',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n\n' +
        'leveneTest(change ~ group, data = w)',
      debrief:
        "p = .85, so the variances are fine and the ANOVA stands. Had it come out significant, Welch's " +
        "ANOVA (`oneway.test()`) would have been the honest next step.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  want <- car::leveneTest(change ~ group, data = w)
  got <- .rlab_answer
  rlab_seq(
    if (!is.data.frame(got))
      sprintf("Your answer should be the result of \`leveneTest()\`, but it is %s. %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    rlab_want_cols(got, c("Df", "F value", "Pr(>F)")),
    rlab_want_value(got[["F value"]][1], want[["F value"]][1], "the F statistic", tol = 1e-4),
    rlab_want_value(got[["Pr(>F)"]][1], want[["Pr(>F)"]][1], "the p value", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l8m4',
      title: 'Which groups, though?',
      xp: 60,
      teach:
        "A significant ANOVA means *something* differs. `emmeans()` gets the estimated mean of each group " +
        "from the model, and `pairs()` compares every pair, correcting the p values for the number of " +
        "comparisons (Tukey, by default).",
      task:
        "For the same ANOVA model, get the estimated means for each `group` and return **all pairwise " +
        "comparisons** between them.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post) |>\n  mutate(change = wellbeing_post - wellbeing_pre)\nm <- aov(change ~ group, data = w)\n\n',
      hints: [
        '`emmeans(m, ~ group)` gives you the per-group estimates.',
        '`pairs()` turns those estimates into comparisons — you can pipe into it.',
        'emmeans(m, ~ group) |> pairs()',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'm <- aov(change ~ group, data = w)\n\n' +
        'emmeans(m, ~ group) |>\n' +
        '  pairs()',
      debrief:
        "Both interventions beat the control by about 4.5 points, and they do not differ from each other " +
        "(p = .999). That is three sentences of a results section, from one line of code.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  want <- as.data.frame(pairs(emmeans::emmeans(aov(change ~ group, data = w), ~ group)))
  got <- .rlab_answer
  gd <- tryCatch(as.data.frame(got), error = function(e) NULL)
  rlab_seq(
    if (is.null(gd))
      sprintf("Your answer should be the pairwise comparisons, but it is %s. %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    if (!"contrast" %in% names(gd))
      "I can't see a \`contrast\` column. \`emmeans()\` alone gives the group means — you need \`pairs()\` on top to compare them." else character(0),
    rlab_want_rows(gd, nrow(want), "Three groups make three pairwise comparisons."),
    rlab_want_set(gd$contrast, want$contrast, "The comparisons"),
    rlab_want_col_values(gd[order(gd$contrast), ], "estimate",
                         want$estimate[order(want$contrast)], tol = 1e-4),
    rlab_want_col_values(gd[order(gd$contrast), ], "p.value",
                         want$p.value[order(want$contrast)], tol = 1e-5)
  )
})`,
    },
    {
      id: 'l8m5',
      title: 'Between and within at once',
      xp: 65,
      teach:
        "In the conditioning study every animal gets **both** cues but only **one** drug: cue is within, " +
        "drug is between. `afex::aov_ez()` handles that, given the id column, the outcome, and which factors " +
        "are which. First, a trap: emmeans builds names from your factor levels, and `CS+` is not a legal R " +
        "name — it gets silently mangled to `CS.`, so rename the levels before you model anything.",
      task:
        "Run a mixed ANOVA on `pavlov_long` with `ratio` as the outcome, `subject` as the id, `drug` as the " +
        "between-subjects factor and `cue` as the within-subjects factor. Return the model.",
      datasets: ['pavlov_long'],
      starter:
        'pl <- pavlov_long |>\n  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n\n',
      hints: [
        'The function is `aov_ez()` and its first three arguments are `id`, `dv` and `data`.',
        'The factors are named with quoted strings: `between = "drug"`, `within = "cue"`.',
        'aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = "cue")',
      ],
      solution:
        'pl <- pavlov_long |>\n' +
        '  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n\n' +
        'aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = "cue")',
      debrief:
        "A huge main effect of cue (the animals learned), a smaller effect of drug, and — the interesting " +
        "one — a `drug:cue` interaction, F(1, 46) = 5.99, p = .018. The drug did not shift everything " +
        "equally; it did something specific to one cue.\n\n" +
        "The warning about *more than one observation per design cell* is afex telling you what it did: " +
        "you left `block` out of the model, so it averaged each animal's eight blocks into one number per " +
        "cue. That is the right thing here, and afex says so out loud rather than doing it silently.",
      check: `local({
  pl <- pavlov_long |> dplyr::mutate(cue = forcats::fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))
  want <- afex::aov_ez("subject", "ratio", data = pl, between = "drug", within = "cue")
  got <- .rlab_answer
  rlab_seq(
    if (!inherits(got, "afex_aov"))
      sprintf("Your answer should be the model from \`aov_ez()\`, but it is %s. %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    local({
      rn <- rownames(got$anova_table)
      if (!("drug:cue" %in% rn))
        sprintf("Your model has the terms %s. I expected \`drug\`, \`cue\` and \`drug:cue\` — check which factor you put in \`between\` and which in \`within\`.",
                paste0("\`", rn, "\`", collapse = ", ")) else character(0)
    }),
    rlab_want_value(rlab_anova_col(rlab_anova_row(got, "drug:cue"), "F"),
                    rlab_anova_col(rlab_anova_row(want, "drug:cue"), "F"),
                    "the F for the drug by cue interaction", tol = 1e-4),
    rlab_want_value(rlab_anova_col(rlab_anova_row(got, "cue"), "F"),
                    rlab_anova_col(rlab_anova_row(want, "cue"), "F"),
                    "the F for the main effect of cue", tol = 1e-4)
  )
})`,
    },
    {
      id: 'l8m6',
      title: 'Take the interaction apart',
      xp: 60,
      teach:
        "An interaction says the effect of one factor depends on the other, and nothing more — you have to " +
        "look to see how. `emmeans(model, ~ a | b)` splits the comparison: the bit before the bar is what " +
        "gets compared, the bit after is what it gets compared *within*.",
      task:
        "Take the mixed model from the last mission and compare the two **drugs within each cue**. " +
        "Return the comparisons.",
      datasets: ['pavlov_long'],
      starter:
        'pl <- pavlov_long |>\n' +
        '  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n' +
        'a <- aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = "cue")\n\n',
      hints: [
        'Drug is what you are comparing, cue is what you are comparing within: `~ drug | cue`.',
        'As before, `emmeans()` gives estimates and `pairs()` compares them.',
        'emmeans(a, ~ drug | cue) |> pairs()',
      ],
      solution:
        'pl <- pavlov_long |>\n' +
        '  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n' +
        'a <- aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = "cue")\n\n' +
        'emmeans(a, ~ drug | cue) |>\n' +
        '  pairs()',
      debrief:
        "There it is: the drug matters for the CS+ (p = .020) and does nothing for the CS− (p = .616). " +
        "Amphetamine did not blunt responding in general — it specifically weakened the suppression to the " +
        "cue that predicted something.",
      check: `local({
  pl <- pavlov_long |> dplyr::mutate(cue = forcats::fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))
  a <- afex::aov_ez("subject", "ratio", data = pl, between = "drug", within = "cue")
  want <- as.data.frame(pairs(emmeans::emmeans(a, ~ drug | cue)))
  got <- .rlab_answer
  gd <- tryCatch(as.data.frame(got), error = function(e) NULL)
  rlab_seq(
    if (is.null(gd))
      sprintf("Your answer should be the pairwise comparisons, but it is %s. %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    if (!"contrast" %in% names(gd))
      "No \`contrast\` column — add \`pairs()\` after \`emmeans()\`." else character(0),
    if (!"cue" %in% names(gd))
      "The comparisons aren't split by cue. The bar in \`~ drug | cue\` is what does the splitting." else character(0),
    rlab_want_rows(gd, nrow(want), "Two cues, one drug comparison within each."),
    rlab_want_set(gd$cue, want$cue, "The cue levels"),
    rlab_want_col_values(gd[order(gd$cue), ], "estimate", want$estimate[order(want$cue)], tol = 1e-5),
    rlab_want_col_values(gd[order(gd$cue), ], "p.value", want$p.value[order(want$cue)], tol = 1e-5)
  )
})`,
    },
    {
      id: 'l8boss',
      title: 'Boss: the result, in words',
      boss: true,
      xp: 180,
      teach:
        "The last thing anyone reads is the sentence. An interaction is reported with its F, its two degrees " +
        "of freedom and its p, and then the simple effects that explain it. You have computed every number " +
        "in this sentence already.",
      task:
        "Return a single string in exactly this shape, with the real numbers in it:\n\n" +
        "`The drug by cue interaction was significant, F(0, 00) = 0.00, p = .000. Amphetamine reduced " +
        "suppression to the CSplus, t(00) = -0.00, p = .000, but not to the CSminus, t(00) = 0.00, p = .000.`\n\n" +
        "The rules:\n" +
        "- the F, its numerator and denominator degrees of freedom and its p come from the `drug:cue` row " +
        "of the mixed ANOVA\n" +
        "- the two t values and p values come from comparing the drugs within each cue\n" +
        "- F, t to two decimals; degrees of freedom as whole numbers; every p to three decimals with no " +
        "leading zero",
      datasets: ['pavlov_long'],
      starter:
        'pl <- pavlov_long |>\n' +
        '  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n' +
        'a <- aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = "cue")\n\n' +
        'tab <- a$anova_table\n' +
        'simple <- as.data.frame(pairs(emmeans(a, ~ drug | cue)))\n\n',
      hints: [
        '`tab["drug:cue", ]` is the interaction row; the columns are called `num Df`, `den Df`, `F` and `Pr(>F)`.',
        'In `simple`, the row where `cue == "CSplus"` has the CS+ comparison. Its columns are `t.ratio`, `df` and `p.value`.',
        'Write a small helper first: `pf <- function(p) sub("^0", "", sprintf("%.3f", p))`, then one `sprintf()` with ten values in it.',
      ],
      solution:
        'pl <- pavlov_long |>\n' +
        '  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n' +
        'a <- aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = "cue")\n\n' +
        'tab <- a$anova_table\n' +
        'simple <- as.data.frame(pairs(emmeans(a, ~ drug | cue)))\n\n' +
        'int <- tab["drug:cue", ]\n' +
        'plus  <- simple[simple$cue == "CSplus", ]\n' +
        'minus <- simple[simple$cue == "CSminus", ]\n' +
        'pf <- function(p) if (p < .001) "< .001" else sub("^0", "", sprintf("%.3f", p))\n\n' +
        'sprintf(\n' +
        '  "The drug by cue interaction was significant, F(%d, %d) = %.2f, p = %s. Amphetamine reduced suppression to the CSplus, t(%d) = %.2f, p = %s, but not to the CSminus, t(%d) = %.2f, p = %s.",\n' +
        '  int[["num Df"]], int[["den Df"]], int[["F"]], pf(int[["Pr(>F)"]]),\n' +
        '  plus$df, plus$t.ratio, pf(plus$p.value),\n' +
        '  minus$df, minus$t.ratio, pf(minus$p.value)\n' +
        ')',
      check: `local({
  pl <- pavlov_long |> dplyr::mutate(cue = forcats::fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))
  a <- afex::aov_ez("subject", "ratio", data = pl, between = "drug", within = "cue")
  tab <- a$anova_table
  simple <- as.data.frame(pairs(emmeans::emmeans(a, ~ drug | cue)))
  int <- tab["drug:cue", ]
  plus  <- simple[simple$cue == "CSplus", ]
  minus <- simple[simple$cue == "CSminus", ]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^The drug by cue interaction was significant, F\\\\(",
      "Start the sentence exactly as the template does."),
    rlab_want_match(got, "Amphetamine reduced suppression to the CSplus",
      "The second sentence should start \\"Amphetamine reduced suppression to the CSplus\\"."),
    rlab_want_match(got, "but not to the CSminus",
      "The sentence should end with the CSminus comparison, introduced by \\"but not to the CSminus\\"."),
    rlab_want_match(got, "\\\\.$", "The sentence should end with a full stop."),
    rlab_want_match(got, "F\\\\([0-9]+, [0-9]+\\\\) = [0-9]+\\\\.[0-9]{2}",
      "The F should read like \`F(1, 46) = 5.99\` — both degrees of freedom, then two decimals."),
    rlab_want_nums(got,
      c(int[["num Df"]], int[["den Df"]], int[["F"]], int[["Pr(>F)"]],
        plus$df, plus$t.ratio, plus$p.value,
        minus$df, minus$t.ratio, minus$p.value),
      c("numerator df", "denominator df", "F statistic", "interaction p value",
        "CSplus df", "CSplus t", "CSplus p value",
        "CSminus df", "CSminus t", "CSminus p value"))
  )
})`,
    },
  ],
};
