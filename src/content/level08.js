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
      theory:
        "With three groups there are three possible pairwise comparisons, and each one carries its own 5% chance of a false positive. If they were independent the chance of at least one false alarm would be about 14%; they are not independent, because they reuse the same data, so the true figure is somewhat lower \u2014 but it is still well above the 5% you think you are running at. ANOVA exists so you can ask one question instead of three.\n\nThe F ratio is simpler than it looks: variance *between* the group means, divided by variance *within* the groups. If the groups really are all the same, both numbers are estimating the same noise and F lands near 1. If the means are further apart than within-group noise can account for, F climbs.\n\nWhat ANOVA cannot tell you is *which* groups differ. A significant F is a door opening, not an answer.",
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
      theory:
        "\u03b7\u00b2 is R\u00b2 wearing a different hat \u2014 the proportion of total variation in the outcome that goes with the grouping. \u03b7\u00b2 = .18 means condition accounts for roughly 18% of why people's change scores differ, and the other 82% is individual differences, measurement error and everything you did not measure.\n\nIn psychology 18% is a lot. You are predicting human behaviour from a single manipulation, and most of what makes people different was never in your design.\n\n\u03b7\u00b2 is biased upwards in small samples, because it describes *your* sample rather than the population. \u03c9\u00b2 and partial \u03b7\u00b2 are the usual corrections when the number has to carry weight.",
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
      theory:
        "ANOVA pools the within-group variability into one estimate of noise. That is only reasonable if the groups are about equally variable \u2014 otherwise the pooled estimate is too large for some groups and too small for others, and every test built on it is slightly wrong.\n\nLevene's test checks this by running an ANOVA on how far each score sits from its own group's centre. It is one of the rare occasions where you are hoping for a non-significant result.\n\nThe subtlety is power. Levene detects trivial differences in large samples and misses real ones in small samples \u2014 exactly when you most need the warning. Read the group SDs alongside the test, not instead of it.\n\nThe deeper problem is what people do next. Running Levene and *then* choosing your main test based on the result is conditional testing, and it quietly inflates your overall error rate above the 5% you are claiming \u2014 the published p value does not know that a screening test decided which analysis produced it. The modern advice is to decide in advance and pick the option that is robust either way, which for two groups means always using Welch, exactly as R already does by default.",
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
        "p = .85, and the three group SDs are close, so there is nothing here to worry about.\n\n" +
        "What you should *not* do is treat this as a gate \u2014 run Levene, and switch tests only if it " +
        "comes out significant. That decision rule is itself a hidden analysis step, and it makes your " +
        "final p value mean less than it claims. If you are worried about unequal variances, use the " +
        "robust option (`oneway.test()`, which is Welch's ANOVA) because you decided to in advance, not " +
        "because a screening test told you to.",
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
      theory:
        "Now you can ask which groups differ, and you are immediately back in the multiple-comparison problem that ANOVA was protecting you from. Tukey's correction widens the p values to account for how many comparisons you are making, so the error rate across the whole family stays at 5%.\n\n\"Estimated marginal means\" are means predicted *by the model* rather than raw group averages. In a simple one-way design they are identical. The moment you add a covariate or your cells are unbalanced they part company, and the model-based ones are what your test is actually about.\n\nA non-significant pairwise comparison is not evidence that two groups are the same. It is a failure to show that they differ.",
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
      theory:
        "Every animal contributes two numbers, one per cue, and those two numbers are not independent: an animal that suppresses a lot does so for both. Treating them as two unrelated observations throws away the pairing and inflates the error term.\n\nA within-subjects factor uses each subject as their own control, which is why repeated-measures designs are so much more sensitive than between-subjects ones. The cost is bookkeeping \u2014 the model has to know who is who, which is exactly what the `id` argument is for.\n\nMixed means both at once: cue varies within animals, drug varies between them. The interaction is usually the interesting term, because it asks whether the drug changed *what the animals learned*, rather than just how much they moved.",
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
      theory:
        "An interaction is a claim that one answer is not enough: the effect of the drug is one thing for the CS+ and a different thing for the CS\u2212. The interaction test tells you those two effects differ. It does not tell you what either of them is.\n\nSo you split it. Comparing the drugs within each cue separately turns one ambiguous result into two interpretable ones.\n\nThe discipline is to decide what you will split by *before* you look at the data. Simple effects chosen after seeing the pattern are a p-hacking machine, and nothing in the output lets a reader tell the difference.",
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
      theory:
        "The order of a results paragraph mirrors the logic of the analysis: the overall test that licensed you to look closer, then the comparisons that say what is going on. Leading with the comparison you liked best hides the fact that you were allowed to go looking.\n\nThe non-significant simple effect belongs in the same breath as the significant one. Here the *selectivity* is the finding \u2014 a drug that blunted everything equally would be a far less interesting drug.",
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
