export default {
  id: 'l11',
  n: 11,
  needsStats: true,
  title: 'The Fine Print',
  blurb: 'Paired designs, planned contrasts, multiplicity, unequal n, sphericity, diagnostics.',
  story:
    "Dr. Finch hands you a reviewer report on someone else's paper. \"Read it, then read their " +
    "analysis. They did everything in the right order and still got it wrong.\"\n\n" +
    "\"Everything up to now was *which test*. This level is the fine print: what you decided before " +
    "you looked, what you corrected for, what your software did without telling you. Most of what " +
    "gets retracted lives in here, and almost none of it is fraud.\"",
  missions: [
    {
      id: 'l11m1',
      title: 'The same people, twice',
      xp: 60,
      teach:
        "When each row contributes two measurements, the comparison is **paired**: " +
        "`t.test(after, before, paired = TRUE)` works on the differences rather than treating the two " +
        "columns as separate samples. Its effect size is Cohen's *dz*, computed on those differences.",
      theory:
        "A paired test is not a convenience, it is a different question. An independent test asks " +
        "whether two groups of people differ. A paired test asks whether each person changed — and " +
        "because every participant is their own control, everything stable about them cancels out.\n\n" +
        "That is why it is so much more powerful. All the variance from some people simply being " +
        "higher scorers disappears from the denominator, leaving only the variability of the changes.\n\n" +
        "Run the independent-samples test on paired data by mistake and nothing will complain: you " +
        "get a valid-looking t, a sensible df, and far too little power. The giveaway is the degrees " +
        "of freedom — paired gives you *n* − 1, independent gives roughly 2*n* − 2. If your df " +
        "doubled, you have thrown your design away.",
      task:
        "In `wellbeing_scored`, drop the people with no `wellbeing_post`, then test whether " +
        "`wellbeing_post` differs from `wellbeing_pre` **within person**, and return the test.",
      datasets: ['wellbeing_scored'],
      starter: 'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n\n',
      hints: [
        '`t.test()` takes the two vectors, not a formula: `t.test(w$wellbeing_post, w$wellbeing_pre, ...)`.',
        'The argument that makes it paired is `paired = TRUE`.',
        't.test(w$wellbeing_post, w$wellbeing_pre, paired = TRUE)',
      ],
      solution:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n\n' +
        't.test(w$wellbeing_post, w$wellbeing_pre, paired = TRUE)',
      debrief:
        "t(158) = 7.81, p < .001, a mean improvement of 3.11 points. Note the df: 158, which is " +
        "159 people minus one — not 316.\n\n" +
        "Be careful what you conclude from it. Everyone improved on average, but this test pools all " +
        "three conditions together, so it cannot tell you the *interventions* did anything. Controls " +
        "improved too. A pre-post test with no control group is the single most over-interpreted " +
        "analysis in applied psychology.",
      check: `local({
  w <- tidyr::drop_na(wellbeing_scored, wellbeing_post)
  want <- t.test(w$wellbeing_post, w$wellbeing_pre, paired = TRUE)
  indep <- t.test(w$wellbeing_post, w$wellbeing_pre)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_htest(got, "the result of \`t.test()\`"),
    if (!is.null(got$parameter) && rlab_near(unname(got$parameter)[1], unname(indep$parameter)[1], 1e-3))
      "That is the independent-samples test — look at the degrees of freedom. Add \`paired = TRUE\` so it works on each person's change." else character(0),
    rlab_want_method(got, "paired", "This needs to be the paired version of the test."),
    rlab_want_field(got, "statistic", want$statistic, "the t statistic"),
    rlab_want_field(got, "parameter", want$parameter, "the degrees of freedom"),
    rlab_want_field(got, "p.value", want$p.value, "the p value", tol = 1e-10)
  )
})`,
    },
    {
      id: 'l11m2',
      title: 'The comparison you promised',
      xp: 65,
      teach:
        "A **planned contrast** is a specific comparison you committed to before collecting data. " +
        "`contrast()` takes a set of weights over the groups that sum to zero: " +
        "`c(-1, 0.5, 0.5)` is \"the control mean against the average of the other two\".",
      theory:
        "Post-hoc comparisons ask \"what differs?\" after the fact and pay a correction for looking " +
        "everywhere. A planned contrast asks one question that was already in the protocol, so there " +
        "is nothing to correct for — you only ever looked once.\n\n" +
        "They are also more powerful and often better aligned with the actual hypothesis. \"Does " +
        "*any* active intervention beat doing nothing?\" is one contrast, not three pairwise tests, " +
        "and it is usually what the study was designed to answer.\n\n" +
        "The weights encode the question: positive on one side, negative on the other, summing to " +
        "zero so the contrast measures a difference rather than an overall level. The honesty " +
        "condition is simply that *planned* must mean planned. A contrast chosen after seeing the " +
        "means is a post-hoc test wearing a better suit, and only you know which it was — which is " +
        "exactly why pre-registration exists.",
      task:
        "Fit the one-way ANOVA of `change` by `group` again, then test the planned contrast comparing " +
        "**Control against the average of Mindfulness and Exercise**. Name the contrast " +
        "`treatments vs control` and return the result.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'm <- aov(change ~ group, data = w)\n' +
        'em <- emmeans(m, ~ group)\n' +
        'em\n',
      hints: [
        'Run the starter first: the order the groups come out in is the order your weights must follow.',
        'The weights go in a named list: `list("treatments vs control" = c(-1, 0.5, 0.5))`.',
        'contrast(em, method = list("treatments vs control" = c(-1, 0.5, 0.5)))',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'm <- aov(change ~ group, data = w)\n' +
        'em <- emmeans(m, ~ group)\n\n' +
        'contrast(em, method = list("treatments vs control" = c(-1, 0.5, 0.5)))',
      debrief:
        "The two interventions together sit 4.49 points above control, t(156) = 5.85, p < .001 — one " +
        "test, no correction, because it was the question the study was built to answer.\n\n" +
        "Weights of `c(-1, 0.5, 0.5)` put the estimate in the original units: it is the control mean " +
        "subtracted from the average of the two treatment means. Using `c(-2, 1, 1)` tests exactly the " +
        "same hypothesis with the same p value, but doubles the estimate, which is why the scaling " +
        "convention matters when you report it.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  em <- emmeans::emmeans(aov(change ~ group, data = w), ~ group)
  want <- as.data.frame(emmeans::contrast(em,
    method = list("treatments vs control" = c(-1, 0.5, 0.5))))
  got <- .rlab_answer
  gd <- tryCatch(as.data.frame(got), error = function(e) NULL)
  rlab_seq(
    if (is.null(gd))
      sprintf("Your answer should be the contrast, but it is %s. %s", rlab_desc(got), rlab_hint_lastline()) else character(0),
    if (!"contrast" %in% names(gd))
      "I can't see a \`contrast\` column — \`emmeans()\` on its own gives the group means, not a comparison." else character(0),
    rlab_want_rows(gd, 1, "One planned contrast means one row. \`pairs()\` would give you three."),
    rlab_want_set(gd$contrast, want$contrast, "The contrast name"),
    if (rlab_near(abs(gd$estimate[1]), abs(want$estimate[1]) * 2, 1e-3))
      "Right hypothesis, wrong scaling: weights of \`c(-2, 1, 1)\` double the estimate. Use \`c(-1, 0.5, 0.5)\` so it reads in the original units." else character(0),
    rlab_want_value(gd$estimate[1], want$estimate[1], "the contrast estimate", tol = 1e-4),
    rlab_want_value(gd$p.value[1], want$p.value[1], "the p value", tol = 1e-8)
  )
})`,
    },
    {
      id: 'l11m3',
      title: 'Paying for looking',
      xp: 60,
      teach:
        "`p.adjust(p, method)` corrects a set of p values for multiple testing. `\"bonferroni\"` " +
        "multiplies each by the number of tests, `\"holm\"` does the same thing in a smarter order, " +
        "and `\"BH\"` controls the false discovery rate instead.",
      theory:
        "Correction is not a ritual, it is a choice about which error you are willing to make.\n\n" +
        "Bonferroni and Holm control the **family-wise** error rate: the chance of *any* false positive " +
        "among your tests. Holm is uniformly better — it is never less powerful and controls the same " +
        "thing — so there is no statistical reason to prefer plain Bonferroni, only familiarity. " +
        "Benjamini–Hochberg controls the **false discovery rate**: the expected proportion of your " +
        "significant findings that are wrong. For a screen across hundreds of outcomes that is usually " +
        "the question you care about; for three confirmatory tests it is not.\n\n" +
        "The judgement nobody can make for you is what counts as a family. Correcting across every " +
        "test in a thesis would be absurd; correcting across none of them is how a paper ends up " +
        "reporting the one comparison in twenty that worked. The defensible position is to decide the " +
        "family in advance, state it, and apply it consistently — which is also why a planned contrast " +
        "needs no correction at all.",
      task:
        "Get the three uncorrected pairwise p values from the one-way ANOVA of `change` by `group` " +
        "(use `adjust = \"none\"`), then return them corrected by **Holm**, as a numeric vector of 3.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'em <- emmeans(aov(change ~ group, data = w), ~ group)\n' +
        'raw <- as.data.frame(pairs(em, adjust = "none"))$p.value\n' +
        'raw\n',
      hints: [
        '`p.adjust()` takes the vector of p values and a `method`.',
        'The method name is the string `"holm"`.',
        'p.adjust(raw, method = "holm")',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'em <- emmeans(aov(change ~ group, data = w), ~ group)\n' +
        'raw <- as.data.frame(pairs(em, adjust = "none"))$p.value\n\n' +
        'p.adjust(raw, method = "holm")',
      debrief:
        "Both treatment-versus-control comparisons survive easily; the treatment-versus-treatment one " +
        "was never close. Holm leaves the largest p value untouched, which is exactly why it beats " +
        "Bonferroni — Bonferroni would have multiplied it by three for nothing.\n\n" +
        "Compare this with the previous mission. One planned contrast answered the study's question " +
        "with no correction at all. Three post-hoc tests answered a vaguer question and had to pay.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  em <- emmeans::emmeans(aov(change ~ group, data = w), ~ group)
  raw <- as.data.frame(pairs(em, adjust = "none"))$p.value
  want <- p.adjust(raw, method = "holm")
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 3, "Your answer"),
    if (rlab_near(sort(unname(got)), sort(p.adjust(raw, "bonferroni")), 1e-9))
      "That is the Bonferroni correction. Holm gives the same protection with more power — use \`method = \\"holm\\"\`." else character(0),
    if (rlab_near(sort(unname(got)), sort(raw), 1e-12))
      "Those are still the uncorrected p values. Pass them through \`p.adjust()\`." else character(0),
    rlab_want_value(sort(unname(got)), sort(want), "the corrected p values", tol = 1e-9)
  )
})`,
    },
    {
      id: 'l11m4',
      title: 'When the cells are uneven',
      xp: 70,
      teach:
        "With unequal cell sizes, factors share variance and the order you enter them changes the " +
        "answer. `anova()` gives **Type I** (sequential) sums of squares; `car::Anova()` gives " +
        "**Type II** or **Type III**, which do not depend on order.",
      theory:
        "In a balanced design all three types agree exactly, which is why many people never learn the " +
        "difference. The moment your cells are uneven, the factors overlap, and the overlapping " +
        "variance has to be assigned to someone.\n\n" +
        "Type I gives it to whichever factor you typed first — so `y ~ a * b` and `y ~ b * a` give " +
        "different answers, which is rarely what anyone wants. Type II credits each factor only with " +
        "what it uniquely explains, ignoring the interaction. Type III does the same but tests each " +
        "term with the interaction in the model, which is the default in SPSS and therefore what most " +
        "of the psychology literature reports.\n\n" +
        "Here is the trap, and it is genuinely common in published work: **Type III sums of squares " +
        "are only meaningful with sum-to-zero contrasts.** Run `car::Anova(m, type = 3)` on a model " +
        "fitted with R's default treatment contrasts and the main-effect rows are testing something " +
        "nobody wants — the effect of one factor *at the reference level of the other*, mislabelled " +
        "as a main effect. The numbers come out, no warning appears, and they are wrong. This is also " +
        "why `afex` sets the contrasts for you.",
      task:
        "Using the `change` scores, add a `sex` column (`female` / `male`, dropping everyone else), " +
        "then fit `change ~ group * sex` **with sum-to-zero contrasts** and return the Type III " +
        "ANOVA table.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(\n' +
        '    change = wellbeing_post - wellbeing_pre,\n' +
        '    sex = case_when(\n' +
        '      str_detect(str_to_lower(gender), "^f") ~ "female",\n' +
        '      str_detect(str_to_lower(gender), "^m") ~ "male",\n' +
        '      .default = NA_character_\n' +
        '    )\n' +
        '  ) |>\n' +
        '  drop_na(sex) |>\n' +
        '  mutate(sex = factor(sex))\n\n' +
        'table(w$group, w$sex)\n',
      hints: [
        'Set the contrasts *before* you fit: `options(contrasts = c("contr.sum", "contr.poly"))`.',
        'Then fit the model and ask car for type 3: `Anova(m, type = 3)`.',
        'options(contrasts = c("contr.sum", "contr.poly"))\nm <- lm(change ~ group * sex, data = w)\nAnova(m, type = 3)',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(\n' +
        '    change = wellbeing_post - wellbeing_pre,\n' +
        '    sex = case_when(\n' +
        '      str_detect(str_to_lower(gender), "^f") ~ "female",\n' +
        '      str_detect(str_to_lower(gender), "^m") ~ "male",\n' +
        '      .default = NA_character_\n' +
        '    )\n' +
        '  ) |>\n' +
        '  drop_na(sex) |>\n' +
        '  mutate(sex = factor(sex))\n\n' +
        'options(contrasts = c("contr.sum", "contr.poly"))\n' +
        'm <- lm(change ~ group * sex, data = w)\n' +
        'Anova(m, type = 3)',
      debrief:
        "Group: F(2, 141) = 16.19. Fit the same model with R's default treatment contrasts and Type III " +
        "reports **F = 9.16** for the same data — a result that is simply wrong, printed without a " +
        "murmur.\n\n" +
        "Type II here gives F = 16.29, and Type I gives 16.22 or 16.29 depending on which factor you " +
        "typed first. With no interaction worth speaking of, Type II is arguably the better choice; the " +
        "important thing is that you can say which you used and why.\n\n" +
        "Also worth noticing: dropping the seven participants who were neither `female` nor `male` was a " +
        "decision, not a technicality. Too few for a cell of their own, so they cannot be in a factorial " +
        "— and that exclusion belongs in the write-up, not silently in the code.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre,
      sex = dplyr::case_when(
        stringr::str_detect(stringr::str_to_lower(gender), "^f") ~ "female",
        stringr::str_detect(stringr::str_to_lower(gender), "^m") ~ "male",
        .default = NA_character_)) |>
    tidyr::drop_na(sex) |> dplyr::mutate(sex = factor(sex))
  # Both reference fits force their own contrasts: the student's code sets the
  # option globally and it is still in effect while this checker runs.
  old <- options(contrasts = c("contr.sum", "contr.poly"))
  want <- car::Anova(lm(change ~ group * sex, data = w), type = 3)
  options(contrasts = c("contr.treatment", "contr.poly"))
  bad <- car::Anova(lm(change ~ group * sex, data = w), type = 3)
  options(old)
  got <- .rlab_answer
  gd <- tryCatch(as.data.frame(got), error = function(e) NULL)
  rlab_seq(
    if (is.null(gd))
      sprintf("Your answer should be an ANOVA table, but it is %s. %s", rlab_desc(got), rlab_hint_lastline()) else character(0),
    if (!"group" %in% trimws(rownames(gd)))
      sprintf("I can't find a \`group\` row. Your table has: %s.", paste0("\`", trimws(rownames(gd)), "\`", collapse = ", ")) else character(0),
    if (!("(Intercept)" %in% trimws(rownames(gd))))
      "That looks like a Type I or Type II table — a Type III table includes an \`(Intercept)\` row. Use \`Anova(m, type = 3)\`." else character(0),
    local({
      g <- rlab_anova_col(rlab_anova_row(gd, "group"), "F")
      b <- rlab_anova_col(rlab_anova_row(bad, "group"), "F")
      if (!is.null(g) && rlab_near(g, b, 1e-4))
        sprintf("That is Type III computed on treatment contrasts, which gives F = %s for \`group\` instead of %s. Set \`options(contrasts = c(\\"contr.sum\\", \\"contr.poly\\"))\` *before* fitting the model.",
                rlab_fmt(b, 2), rlab_fmt(rlab_anova_col(rlab_anova_row(want, "group"), "F"), 2)) else character(0)
    }),
    rlab_want_value(rlab_anova_col(rlab_anova_row(gd, "group"), "F"),
                    rlab_anova_col(rlab_anova_row(want, "group"), "F"),
                    "the F for group", tol = 1e-3),
    rlab_want_value(rlab_anova_col(rlab_anova_row(gd, "group:sex"), "F"),
                    rlab_anova_col(rlab_anova_row(want, "group:sex"), "F"),
                    "the F for the interaction", tol = 1e-3)
  )
})`,
    },
    {
      id: 'l11m5',
      title: 'The correction you did not ask for',
      xp: 65,
      teach:
        "Repeated-measures ANOVA assumes **sphericity**: that the variances of all the pairwise " +
        "differences between levels are equal. With more than two levels this usually fails a little, " +
        "so `afex` applies a Greenhouse–Geisser correction by default and reports fractional degrees " +
        "of freedom.",
      theory:
        "Those odd decimal degrees of freedom — 6.22 instead of 7 — are the correction at work. " +
        "Greenhouse–Geisser estimates how far the data depart from sphericity as a number ε between " +
        "1/(k−1) and 1, and multiplies both degrees of freedom by it. Less sphericity, fewer effective " +
        "df, a harder test.\n\n" +
        "Mauchly's test checks sphericity formally, and here it comes back non-significant — yet afex " +
        "corrects anyway. That is deliberate and correct. Mauchly is badly underpowered in small " +
        "samples, so it reliably fails to detect violations exactly when they matter most, and " +
        "\"correct only if Mauchly is significant\" is the same conditional-testing error you met with " +
        "Levene in level 8.\n\n" +
        "Since ε ≈ 1 costs almost nothing when sphericity does hold, always correcting is the better " +
        "rule. The literature is full of papers that ran Mauchly, got p > .05, reported uncorrected " +
        "degrees of freedom, and were a little too confident.",
      task:
        "Fit the full mixed ANOVA on `pavlov_long` (`drug` between; `cue` and `block` within) **without** " +
        "any sphericity correction, and return the model. Use `anova_table = list(correction = \"none\")`.",
      datasets: ['pavlov_long'],
      starter:
        'pl <- pavlov_long |>\n  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n\n',
      hints: [
        'This is `aov_ez()` again, but `within` takes two factors: `within = c("cue", "block")`.',
        'The correction is switched off with the `anova_table` argument.',
        'aov_ez(id = "subject", dv = "ratio", data = pl, between = "drug", within = c("cue", "block"), anova_table = list(correction = "none"))',
      ],
      solution:
        'pl <- pavlov_long |>\n' +
        '  mutate(cue = fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))\n\n' +
        'aov_ez(\n' +
        '  id = "subject", dv = "ratio", data = pl,\n' +
        '  between = "drug", within = c("cue", "block"),\n' +
        '  anova_table = list(correction = "none")\n' +
        ')',
      debrief:
        "Now the `block` degrees of freedom are a clean 7 and 308, and the `drug:block` p value reads " +
        "3.59 × 10⁻⁴ instead of the corrected 6.71 × 10⁻⁴. Both are significant here, so nothing turns " +
        "on it — but the uncorrected one is the more flattering number, and that is precisely the " +
        "situation in which it is tempting.\n\n" +
        "Run `summary()` on an afex model and you get Mauchly's tests and the GG and HF corrections " +
        "side by side, which is what you report when a reviewer asks.",
      check: `local({
  pl <- pavlov_long |> dplyr::mutate(cue = forcats::fct_recode(cue, CSplus = "CS+", CSminus = "CS-"))
  want <- afex::aov_ez("subject", "ratio", data = pl, between = "drug",
                       within = c("cue", "block"), anova_table = list(correction = "none"))
  gg <- afex::aov_ez("subject", "ratio", data = pl, between = "drug", within = c("cue", "block"))
  got <- .rlab_answer
  rlab_seq(
    if (!inherits(got, "afex_aov"))
      sprintf("Your answer should be the model from \`aov_ez()\`, but it is %s. %s", rlab_desc(got), rlab_hint_lastline()) else character(0),
    local({
      rn <- rownames(got$anova_table)
      if (!("drug:cue:block" %in% rn))
        sprintf("I expected a three-way design (drug, cue and block). Your model has: %s.",
                paste0("\`", rn, "\`", collapse = ", ")) else character(0)
    }),
    local({
      d <- rlab_anova_col(rlab_anova_row(got, "block"), "df")
      if (!is.null(d) && !rlab_near(d, 7, 1e-6))
        sprintf("The \`block\` numerator df is %s, so a sphericity correction is still being applied. Switch it off with \`anova_table = list(correction = \\"none\\")\`.", rlab_fmt(d, 2)) else character(0)
    }),
    rlab_want_value(rlab_anova_col(rlab_anova_row(got, "drug:block"), "p"),
                    rlab_anova_col(rlab_anova_row(want, "drug:block"), "p"),
                    "the p value for drug:block", tol = 1e-9)
  )
})`,
    },
    {
      id: 'l11m6',
      title: 'Does the model deserve belief?',
      xp: 60,
      teach:
        "A regression makes promises about its residuals: roughly constant spread, roughly normal, no " +
        "pattern against the fitted values. `residuals()` and `fitted()` hand you both, and " +
        "`car::vif()` checks whether your predictors are too tangled to interpret separately.",
      theory:
        "Diagnostics are about whether the *standard errors* can be believed. The coefficients " +
        "themselves are usually fine; it is the uncertainty around them that assumptions buy you.\n\n" +
        "The most useful plot is residuals against fitted values, because three different failures " +
        "show up in it at once: curvature means the relationship is not linear, a widening fan means " +
        "the variance is not constant, and isolated points far from the rest are worth identifying by " +
        "name. Normality of residuals matters least of the three, and matters less the more data you " +
        "have.\n\n" +
        "Variance inflation is a different kind of problem. High VIF does not bias anything — the " +
        "model still predicts well — but it means two predictors carry nearly the same information, so " +
        "neither gets credit and both standard errors balloon. The usual rules of thumb (above 5, " +
        "above 10) are conventions; the real question is whether you can still answer your question, " +
        "and if two predictors are nearly the same thing, no amount of arithmetic will separate them.\n\n" +
        "Resist the urge to run a significance test on every assumption. Shapiro–Wilk on 10,000 " +
        "residuals will reject normality over a deviation too small to matter, and on 20 residuals it " +
        "will miss one that matters a lot. Look at the picture.",
      task:
        "Fit the three-predictor model of `pace_min_km` from `pack_kg`, `distance_km` and `elev_m` on " +
        "`hikes_clean`, then return its variance inflation factors.",
      datasets: ['hikes_clean'],
      starter: 'm <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)\n\n',
      hints: [
        'The function is `vif()`, from the car package, and it takes the model.',
        'It returns one number per predictor — no intercept.',
        'vif(m)',
      ],
      solution:
        'm <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)\n\nvif(m)',
      debrief:
        "1.03, 2.14 and 2.16 — all comfortable. Distance and elevation are correlated, as you would " +
        "expect from a hiking log, but not so tightly that the model cannot tell them apart.\n\n" +
        "For completeness this model's residuals also behave: no pattern against the fitted values, and " +
        "Shapiro–Wilk gives W = .978, p = .081. Which is a fine thing to know and a poor thing to " +
        "decide anything by.",
      check: `local({
  m <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)
  want <- car::vif(m)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 3, "Your answer (one VIF per predictor, and the intercept doesn't get one)"),
    rlab_want_set(names(got), names(want), "The predictor names"),
    rlab_want_value(unname(got[order(names(got))]), unname(want[order(names(want))]),
                    "the variance inflation factors", tol = 1e-4)
  )
})`,
    },
    {
      id: 'l11m7',
      title: 'When the assumptions will not hold',
      xp: 60,
      teach:
        "`wilcox.test()` and `kruskal.test()` are the rank-based alternatives to the t-test and " +
        "one-way ANOVA. They work on the order of the values rather than the values themselves, so a " +
        "single wild observation moves them far less.",
      theory:
        "\"Non-parametric\" does not mean assumption-free. The Wilcoxon rank-sum test still assumes the " +
        "two distributions have the same shape, and under that assumption it compares medians; without " +
        "it, it tests the vaguer claim that a randomly chosen value from one group tends to exceed one " +
        "from the other. That is a real hypothesis, but it is not the one most people think they are " +
        "testing.\n\n" +
        "They are also not automatically the safe choice. They cost power when the parametric " +
        "assumptions do hold, they do not produce an interpretable effect size or confidence interval " +
        "in the original units, and they do not extend gracefully to the covariates and interactions " +
        "you usually need.\n\n" +
        "And the familiar move — run the t-test, dislike the result, try the Wilcoxon instead — is " +
        "p-hacking, whatever the motivation. If robustness is the concern, decide in advance, or use a " +
        "method designed for it such as a bootstrap or a robust regression. Modern practice leans " +
        "towards fixing the model rather than abandoning it: log-transform skewed reaction times, or " +
        "model the skew directly.",
      task:
        "Run the rank-based version of the Control vs Mindfulness comparison of `ses_total` from " +
        "level 7, and return the test.",
      datasets: ['wellbeing_scored'],
      starter:
        'two <- wellbeing_scored |>\n  filter(group %in% c("Control", "Mindfulness"))\n\n',
      hints: [
        'The function takes the same formula interface as `t.test()`.',
        'For two independent groups it is `wilcox.test()`.',
        'wilcox.test(ses_total ~ group, data = two)',
      ],
      solution:
        'two <- wellbeing_scored |>\n  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'wilcox.test(ses_total ~ group, data = two)',
      debrief:
        "W = 1206, p = .025, against the t-test's p = .019. Almost the same answer, which is the usual " +
        "outcome when the data are not badly behaved in the first place — these scale scores are sums " +
        "of ten items and close enough to normal.\n\n" +
        "Note what you have lost, though: no mean difference, no confidence interval, no Cohen's *d*. " +
        "A reviewer asking \"how big is the effect?\" cannot be answered from this output.",
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  want <- suppressWarnings(wilcox.test(ses_total ~ group, data = two))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_htest(got, "the result of \`wilcox.test()\`"),
    rlab_want_method(got, "Wilcoxon|Mann-Whitney",
      "That is not the rank-based test — this mission wants \`wilcox.test()\`."),
    rlab_want_field(got, "statistic", want$statistic, "the W statistic"),
    rlab_want_field(got, "p.value", want$p.value, "the p value", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l11boss',
      title: 'Boss: the reviewer',
      boss: true,
      xp: 210,
      teach:
        "You have every piece. The job now is to do the analysis the study actually called for, and " +
        "report it in a way a sceptical reader can check.",
      theory:
        "Nearly everything in this level comes down to one question: was this decision made before or " +
        "after you saw the data? The arithmetic cannot tell the difference, and neither can a reader. " +
        "Only the write-up can.\n\n" +
        "That is why the modern conventions — pre-registration, stating your correction family, naming " +
        "your contrasts in advance, reporting the analyses that did not work — exist. They are not " +
        "bureaucracy. They are the only mechanism that distinguishes a confirmatory result from an " +
        "exploratory one, because the numbers look identical either way.\n\n" +
        "The last habit worth taking with you: when an analysis has several defensible versions, run " +
        "them all and say so. If the conclusion survives Type II and Type III, corrected and " +
        "uncorrected, parametric and rank-based, you have something. If it only survives one, you have " +
        "learned something more useful than a p value.",
      task:
        "The study's pre-registered primary hypothesis was that **the active interventions would " +
        "improve wellbeing more than the control**. Using `change` scores, test that planned contrast " +
        "and return a single string in exactly this shape:\n\n" +
        "`The active conditions improved more than control, a planned contrast of 0.00 points, " +
        "t(000) = 0.00, p < .001. Condition explained 00.0% of the variance in change scores, " +
        "F(0, 000) = 00.00, p < .001.`\n\n" +
        "The rules:\n" +
        "- the contrast is Control against the average of the other two, weighted `c(-1, 0.5, 0.5)`\n" +
        "- the percentage is eta squared × 100, to **one** decimal\n" +
        "- the F and its two degrees of freedom come from the one-way ANOVA of `change` by `group`\n" +
        "- everything else is to two decimals, and both p values are below .001",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'm <- aov(change ~ group, data = w)\n\n' +
        'ct <- as.data.frame(contrast(emmeans(m, ~ group),\n' +
        '                             method = list("t" = c(-1, 0.5, 0.5))))\n' +
        'tab <- summary(m)[[1]]\n' +
        'e2 <- eta_squared(m)\n\n',
      hints: [
        '`ct$estimate`, `ct$df`, `ct$t.ratio` give you the contrast; `e2$Eta2[1]` gives the effect size.',
        'From `tab`, the F is `tab[["F value"]][1]` and the degrees of freedom are `tab$Df[1]` and `tab$Df[2]`.',
        'sprintf("The active conditions improved more than control, a planned contrast of %.2f points, t(%d) = %.2f, p < .001. Condition explained %.1f%% of the variance in change scores, F(%d, %d) = %.2f, p < .001.", ct$estimate, ct$df, ct$t.ratio, e2$Eta2[1] * 100, tab$Df[1], tab$Df[2], tab[["F value"]][1])',
      ],
      solution:
        'w <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre)\n' +
        'm <- aov(change ~ group, data = w)\n\n' +
        'ct <- as.data.frame(contrast(emmeans(m, ~ group),\n' +
        '                             method = list("t" = c(-1, 0.5, 0.5))))\n' +
        'tab <- summary(m)[[1]]\n' +
        'e2 <- eta_squared(m)\n\n' +
        'sprintf(\n' +
        '  "The active conditions improved more than control, a planned contrast of %.2f points, t(%d) = %.2f, p < .001. Condition explained %.1f%% of the variance in change scores, F(%d, %d) = %.2f, p < .001.",\n' +
        '  ct$estimate, ct$df, ct$t.ratio,\n' +
        '  e2$Eta2[1] * 100,\n' +
        '  tab$Df[1], tab$Df[2], tab[["F value"]][1]\n' +
        ')',
      debrief:
        "That is a complete, checkable primary result: the planned comparison the study promised, with " +
        "its size, and the omnibus effect for context. No correction was needed, because only one " +
        "comparison was ever planned — and you can say that out loud.",
      check: `local({
  w <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre)
  m <- aov(change ~ group, data = w)
  ct <- as.data.frame(emmeans::contrast(emmeans::emmeans(m, ~ group),
                                        method = list("t" = c(-1, 0.5, 0.5))))
  tab <- summary(m)[[1]]
  e2 <- effectsize::eta_squared(m)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^The active conditions improved more than control, a planned contrast of ",
      "Start the sentence exactly as the template does."),
    rlab_want_match(got, "Condition explained ",
      "The second sentence should start \\"Condition explained\\"."),
    rlab_want_match(got, "of the variance in change scores",
      "The second sentence should say \\"of the variance in change scores\\"."),
    rlab_want_match(got, "%", "The percentage needs a % sign. In \`sprintf()\` you write it as \`%%\`."),
    rlab_want_match(got, "\\\\.$", "The sentence should end with a full stop."),
    local({
      n <- length(gregexpr("p < \\\\.001", got)[[1]])
      if (!grepl("p < \\\\.001", got)) "Both p values should be written \`p < .001\`." else
      if (n != 2) sprintf("I found %d \`p < .001\` but expected 2.", n) else character(0)
    }),
    rlab_want_nums(gsub("< \\\\.001", "", got),
      c(ct$estimate[1], ct$df[1], ct$t.ratio[1],
        e2$Eta2[1] * 100, tab$Df[1], tab$Df[2], tab[["F value"]][1]),
      c("contrast estimate", "contrast degrees of freedom", "contrast t",
        "percentage of variance", "numerator df", "denominator df", "F statistic"),
      tol = 0.06)
  )
})`,
    },
  ],
};
