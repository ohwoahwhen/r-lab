export default {
  id: 'l10',
  n: 10,
  needsStats: true,
  title: 'Everyone Is Different',
  blurb: 'Mixed-effects models: random intercepts, random slopes and individual differences.',
  story:
    "Dr. Finch has stopped pretending this is your last task. \"The reaction-time data. " +
    "Six and a half thousand trials from forty people — and every analysis you have run so far " +
    "would either throw away the trials or pretend they came from six and a half thousand " +
    "strangers.\"\n\n" +
    "She writes two words on the whiteboard and underlines them. *Mixed models.* " +
    "\"This is the one that will still be useful to you in ten years.\"",
  missions: [
    {
      id: 'l10m1',
      title: 'Trials are not strangers',
      xp: 60,
      teach:
        "`lmer()` is `lm()` with one addition: a term in brackets describing how the data is " +
        "grouped. `(1 | pid)` means \"let each participant have their own intercept\" — their own " +
        "baseline speed — while everyone shares one estimate of the congruency effect.",
      theory:
        "Every test you have run so far assumes your observations are independent. These are not. " +
        "Trials from the same person resemble each other, because some people are simply faster, and " +
        "no amount of data collection makes those 165 trials into 165 independent facts.\n\n" +
        "Psychology's traditional fix is to average: one mean per person per condition, then a t-test " +
        "on 40 numbers. That works, but it throws away everything about variability within a person " +
        "and silently claims a participant with 20 usable trials is as precisely measured as one with " +
        "165.\n\n" +
        "A mixed model keeps every trial and models the nesting instead of averaging it away. The " +
        "\"mixed\" is the two kinds of effect living together: **fixed** effects, the things you want " +
        "to estimate and would expect to replicate, and **random** effects, the differences between " +
        "the particular people you happened to recruit.",
      task:
        "Fit a mixed model on `rt_clean` predicting `rt` from `condition`, letting each `pid` have " +
        "their own intercept, and return the model.",
      datasets: ['rt_clean'],
      starter: '',
      hints: [
        'The fixed part looks exactly like `lm()`: `rt ~ condition`.',
        'The random part is added with `+` and lives in brackets: `(1 | pid)`. The `1` means an intercept, the bar means "grouped by".',
        'lmer(rt ~ condition + (1 | pid), data = rt_clean)',
      ],
      solution: 'lmer(rt ~ condition + (1 | pid), data = rt_clean)',
      debrief:
        "Intercept 494 ms, and incongruent trials cost about 55 ms more. The fixed effects read " +
        "exactly like a regression — because that is what they are.",
      check: `local({
  want <- lmerTest::lmer(rt ~ condition + (1 | pid), data = rt_clean)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_mer(got),
    rlab_want_random(got, "pid: (Intercept)"),
    rlab_want_fixef(got, "(Intercept)", lme4::fixef(want)[["(Intercept)"]]),
    rlab_want_fixef(got, "conditionincongruent", lme4::fixef(want)[["conditionincongruent"]])
  )
})`,
    },
    {
      id: 'l10m2',
      title: 'Where does the variance live?',
      xp: 60,
      teach:
        "A mixed model splits the leftover variation in two: how much people differ from each other, " +
        "and how much trials differ within a person. `VarCorr()` reports both. The **intraclass " +
        "correlation** is the first divided by the total.",
      theory:
        "This is the number that tells you whether you needed the model at all.\n\n" +
        "An ICC near 0 says people are interchangeable — nearly all the variation is trial-to-trial " +
        "noise, and ignoring the grouping would barely have hurt. An ICC near 1 says almost everything " +
        "is stable differences between people, and your effective sample size is closer to the number " +
        "of participants than the number of trials.\n\n" +
        "It is also a reliability figure in disguise. ICC is the proportion of variance that is " +
        "consistent within a person, which is exactly what test-retest reliability measures. The same " +
        "quantity shows up in psychometrics, in cluster-randomised trials, and in the design effect " +
        "that tells you how much a clustered sample costs you.",
      task:
        "Fit the same random-intercept model and return the ICC: the participant variance divided by " +
        "the total of the participant and residual variances, rounded to 3 decimal places.",
      datasets: ['rt_clean'],
      starter:
        'm <- lmer(rt ~ condition + (1 | pid), data = rt_clean)\n\nvc <- as.data.frame(VarCorr(m))\nvc\n',
      hints: [
        'Run the starter first and look at `vc`. The column you want is `vcov`, which holds the variances.',
        'Row 1 is the participant variance and row 2 is the residual.',
        'round(vc$vcov[1] / sum(vc$vcov), 3)',
      ],
      solution:
        'm <- lmer(rt ~ condition + (1 | pid), data = rt_clean)\n\n' +
        'vc <- as.data.frame(VarCorr(m))\n' +
        'round(vc$vcov[1] / sum(vc$vcov), 3)',
      debrief:
        "ICC = .285, so a bit over a quarter of the leftover variation is stable differences in how " +
        "fast people are. Three quarters is trial-to-trial noise — which is reaction time for you.",
      check: `local({
  m <- lmerTest::lmer(rt ~ condition + (1 | pid), data = rt_clean)
  vc <- as.data.frame(lme4::VarCorr(m))
  want <- round(vc$vcov[1] / sum(vc$vcov), 3)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    if (rlab_near(got, round(vc$sdcor[1] / sum(vc$sdcor), 3), 1e-9))
      "That is built from the standard deviations. The ICC uses the *variances* — the \`vcov\` column, not \`sdcor\`." else character(0),
    rlab_want_value(got, want, "the ICC", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l10m3',
      title: 'The missing p values',
      xp: 60,
      teach:
        "Print an `lmer()` summary from plain lme4 and the coefficient table has no p values. That is " +
        "deliberate, not an oversight. Loading **lmerTest** adds them, using the Satterthwaite " +
        "approximation to work out denominator degrees of freedom.",
      theory:
        "In an ordinary regression the denominator degrees of freedom are a count: observations minus " +
        "parameters. In a mixed model there is no such number. Your 6,587 trials are worth somewhere " +
        "between 40 and 6,587 independent observations, and exactly where depends on how strongly the " +
        "trials cluster.\n\n" +
        "lme4's author left p values out rather than print one that is confidently wrong. It is an " +
        "unusually honest piece of software design, and it is why so many people meet mixed models as " +
        "\"the thing that won't give me a p value\".\n\n" +
        "Satterthwaite's approximation estimates those degrees of freedom from the variance structure. " +
        "Watch the df column rather than the p: it tells you how much independent information each " +
        "effect really has, and it is often startlingly smaller than your row count.",
      task:
        "Return the `summary()` of the random-intercept model, so the coefficient table shows degrees " +
        "of freedom and p values. (lmerTest is already loaded, so `lmer()` gives you them.)",
      datasets: ['rt_clean'],
      starter: 'm <- lmer(rt ~ condition + (1 | pid), data = rt_clean)\n\n',
      hints: [
        'One function around the model.',
        'If your table has only Estimate, Std. Error and t value, lmerTest did not attach — but in R Lab it always is, so check you are summarising the `lmer()` model.',
        'summary(m)',
      ],
      solution:
        'm <- lmer(rt ~ condition + (1 | pid), data = rt_clean)\n\nsummary(m)',
      debrief:
        "The condition effect gets df = 6546 — nearly the trial count — because with only a random " +
        "intercept the model believes every trial is near-independent evidence about the effect. " +
        "Hold that number in mind for two missions' time.",
      check: `local({
  m <- lmerTest::lmer(rt ~ condition + (1 | pid), data = rt_clean)
  want <- summary(m)$coefficients
  got <- .rlab_answer
  tab <- rlab_mer_coeftab(got)
  rlab_seq(
    if (rlab_is_mer(got))
      "That is the model itself. Wrap it in \`summary()\` to see the coefficient table." else character(0),
    if (is.null(tab))
      sprintf("I couldn't find a coefficient table in your answer (it is %s). %s",
              rlab_desc(got), rlab_hint_lastline()) else character(0),
    rlab_want_satterthwaite(got),
    rlab_want_value(tab[["conditionincongruent", "Estimate"]],
                    want[["conditionincongruent", "Estimate"]], "the condition estimate"),
    rlab_want_value(tab[["conditionincongruent", "df"]],
                    want[["conditionincongruent", "df"]], "the degrees of freedom", tol = 1e-2)
  )
})`,
    },
    {
      id: 'l10m4',
      title: 'Let the effect vary too',
      xp: 65,
      teach:
        "`(1 | pid)` lets people differ in overall speed. `(1 + condition | pid)` also lets them differ " +
        "in **how much** the condition affects them — their own intercept and their own slope.",
      theory:
        "A random intercept says people start in different places. A random slope says the thing you " +
        "are studying is a different size in different people. In psychology that second claim is " +
        "usually the more plausible one: interference effects, priming, drug responses and treatment " +
        "benefits all vary between individuals.\n\n" +
        "There is a long argument in the literature about how much structure to include. \"Keep it " +
        "maximal\" says fit every random slope your design justifies, because leaving out a real one " +
        "makes your p values too small. The counter-argument is that maximal models often fail to " +
        "converge or fit variances of zero, and a model that did not converge tells you nothing.\n\n" +
        "The practical position most people land on: start maximal, and simplify only when the model " +
        "will not fit — reporting that you did.",
      task:
        "Fit the same model again, but let each participant have their own intercept **and** their own " +
        "`condition` slope. Return the model.",
      datasets: ['rt_clean'],
      starter: '',
      hints: [
        'Only the bracketed part changes.',
        'Both terms go on the left of the bar: `(1 + condition | pid)`.',
        'lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)',
      ],
      solution: 'lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)',
      debrief:
        "Look at the standard error for `conditionincongruent`: it has gone from 1.77 to 4.36, and the " +
        "degrees of freedom from 6546 to 39. Nothing about the data changed. The first model was simply " +
        "too confident, because it assumed everyone had the same effect and counted every trial as " +
        "evidence about one shared number.\n\n" +
        "That gap is the single best argument for fitting random slopes.",
      check: `local({
  want <- lmerTest::lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_mer(got),
    rlab_want_random(got, c("pid: (Intercept)", "pid: conditionincongruent")),
    rlab_want_fixef(got, "conditionincongruent", lme4::fixef(want)[["conditionincongruent"]]),
    rlab_want_vc_sd(got, "pid", "conditionincongruent",
                    rlab_vc_sd(want, "pid", "conditionincongruent"),
                    "the SD of the by-participant slopes")
  )
})`,
    },
    {
      id: 'l10m5',
      title: 'Did you need them?',
      xp: 65,
      teach:
        "`anova()` on two mixed models runs a **likelihood ratio test**: twice the difference in " +
        "log-likelihood, compared against a chi-square distribution with as many degrees of freedom as " +
        "the parameters you added.",
      theory:
        "The logic is the same as comparing nested regressions, but the currency is likelihood rather " +
        "than variance explained. A bigger model always fits at least as well; the test asks whether it " +
        "fits *enough* better to justify the extra parameters.\n\n" +
        "Two caveats worth carrying. Mixed models are fitted by REML by default, which is better for " +
        "estimating variances but makes likelihoods incomparable when the fixed effects differ — so " +
        "`anova()` quietly refits both with ML when it needs to. That is fine here, where only the " +
        "random part changes.\n\n" +
        "And testing whether a variance is zero is a test at the **boundary** of the parameter space, " +
        "because a variance cannot go negative. The usual chi-square is conservative there, so a " +
        "significant result is trustworthy and a marginal one is more promising than it looks.",
      task:
        "Compare the random-intercept model with the random-slopes model, and return the comparison.",
      datasets: ['rt_clean'],
      starter:
        'm1 <- lmer(rt ~ condition + (1 | pid), data = rt_clean)\n' +
        'm2 <- lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)\n\n',
      hints: [
        'The same function you used to compare regressions.',
        'Simpler model first: `anova(m1, m2)`.',
        'anova(m1, m2)',
      ],
      solution:
        'm1 <- lmer(rt ~ condition + (1 | pid), data = rt_clean)\n' +
        'm2 <- lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)\n\n' +
        'anova(m1, m2)',
      debrief:
        "χ²(2) = 132.31, p < .001. The random slopes are not optional here — people genuinely differ in " +
        "how much congruency costs them, and a model that denies it is misrepresenting the data.",
      check: `local({
  m1 <- lmerTest::lmer(rt ~ condition + (1 | pid), data = rt_clean)
  m2 <- lmerTest::lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)
  want <- as.data.frame(anova(m1, m2))
  got <- .rlab_answer
  rlab_want_lrt(tryCatch(as.data.frame(got), error = function(e) got), want)
})`,
    },
    {
      id: 'l10m6',
      title: 'Meet the forty of them',
      xp: 65,
      teach:
        "`coef(model)$pid` gives each participant's own fitted intercept and slope — the fixed effect " +
        "plus that person's random deviation from it. It is a data frame with one row per participant.",
      theory:
        "This is where mixed models stop being bookkeeping and start being interesting. You asked for " +
        "one number, the average congruency effect, and got forty of them for free.\n\n" +
        "Those forty are not raw per-person estimates. They are **shrunk** towards the group mean, by " +
        "an amount that depends on how noisy each person's data is. Someone with few trials and wild " +
        "variability gets pulled hard towards the average; someone with clean data barely moves. The " +
        "model is deciding how much to believe each individual, which is exactly what you would do by " +
        "hand if you had the patience.\n\n" +
        "That is also why these estimates behave better than running a separate regression per person " +
        "and comparing the coefficients: the extreme values in that approach are usually just the " +
        "noisiest participants.",
      task:
        "From the random-slopes model, return each participant's own congruency effect — the " +
        "`conditionincongruent` column of `coef(m)$pid` — as a numeric vector of 40 values.",
      datasets: ['rt_clean'],
      starter:
        'm <- lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)\n\nper_person <- coef(m)$pid\nhead(per_person)\n',
      hints: [
        'Run the starter and look at what `per_person` holds — two columns, forty rows.',
        'Pull a column out of a data frame with `$` or `[[ ]]`.',
        'per_person$conditionincongruent',
      ],
      solution:
        'm <- lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)\n\n' +
        'per_person <- coef(m)$pid\n' +
        'per_person$conditionincongruent',
      debrief:
        "They run from about −29 ms to +97 ms. One participant is reliably **faster** on incongruent " +
        "trials, and another pays nearly a tenth of a second. The group mean of 55 ms is a real " +
        "description of the average and a poor description of almost everybody.\n\n" +
        "This is what a paper means when it reports an effect \"in the sample\" and someone asks whether " +
        "it holds for individuals. Now you can answer.",
      check: `local({
  m <- lmerTest::lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)
  want <- coef(m)$pid[["conditionincongruent"]]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 40, "Your answer"),
    if (rlab_near(mean(got), 0, 1e-2) && !rlab_near(mean(want), 0, 1e-2))
      "Those are centred on zero, so they are the \`ranef()\` deviations. \`coef()\` adds the fixed effect back on, giving each person's actual effect." else character(0),
    rlab_want_value(sort(got), sort(want), "the per-participant effects", tol = 1e-4)
  )
})`,
    },
    {
      id: 'l10boss',
      title: 'Boss: the last paragraph',
      boss: true,
      xp: 200,
      teach:
        "A mixed model is reported with the fixed effect and its test, and then the random effects, " +
        "because the variability *is* a finding. Everything you need is in `summary(m)$coefficients` " +
        "and `VarCorr(m)`.",
      theory:
        "Journals increasingly ask for the random-effects structure to be stated in full, and for good " +
        "reason: `(1 | pid)` and `(1 + condition | pid)` can give the same estimate with wildly " +
        "different standard errors, so a reader cannot evaluate your p value without knowing which you " +
        "fitted. \"We fitted a linear mixed model\" is not a method; the formula is.\n\n" +
        "Reporting the by-participant SD alongside the fixed effect also changes what the sentence " +
        "claims. A 55 ms effect with an SD of 25 ms is not \"everyone slows by 55 ms\" — it is a " +
        "distribution of effects whose average happens to be 55. Say the first and you have overclaimed; " +
        "say the second and you have described your data.",
      task:
        "Using the **random-slopes** model, return a single string in exactly this shape:\n\n" +
        "`Responses were slower on incongruent trials, b = 00.00 ms, SE = 0.00, t(00.00) = 00.00, " +
        "p < .001. The size of the effect varied across participants (SD = 00.00 ms).`\n\n" +
        "The rules:\n" +
        "- `b`, `SE`, `t` and the SD are to two decimals; the degrees of freedom are to two decimals too\n" +
        "- all four statistics come from the `conditionincongruent` row of `summary(m)$coefficients`\n" +
        "- the SD is the by-participant `conditionincongruent` standard deviation from `VarCorr()`\n" +
        "- the p value really is below .001, so it is written `p < .001`",
      datasets: ['rt_clean'],
      starter:
        'm <- lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)\n' +
        'row <- summary(m)$coefficients["conditionincongruent", ]\n' +
        'vc <- as.data.frame(VarCorr(m))\n\n',
      hints: [
        'The pieces of `row` are `row[["Estimate"]]`, `row[["Std. Error"]]`, `row[["df"]]` and `row[["t value"]]`.',
        'In `vc`, the row you want has `grp == "pid"` and `var1 == "conditionincongruent"`, and the number is in the `sdcor` column.',
        'sd_slope <- vc$sdcor[vc$grp == "pid" & vc$var1 == "conditionincongruent" & is.na(vc$var2)]',
      ],
      solution:
        'm <- lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)\n' +
        'row <- summary(m)$coefficients["conditionincongruent", ]\n' +
        'vc <- as.data.frame(VarCorr(m))\n\n' +
        'sd_slope <- vc$sdcor[vc$grp == "pid" &\n' +
        '                     vc$var1 == "conditionincongruent" &\n' +
        '                     is.na(vc$var2)]\n\n' +
        'sprintf(\n' +
        '  "Responses were slower on incongruent trials, b = %.2f ms, SE = %.2f, t(%.2f) = %.2f, p < .001. The size of the effect varied across participants (SD = %.2f ms).",\n' +
        '  row[["Estimate"]], row[["Std. Error"]], row[["df"]], row[["t value"]], sd_slope\n' +
        ')',
      check: `local({
  m <- lmerTest::lmer(rt ~ condition + (1 + condition | pid), data = rt_clean)
  row <- summary(m)$coefficients["conditionincongruent", ]
  sd_slope <- rlab_vc_sd(m, "pid", "conditionincongruent")
  ri <- lmerTest::lmer(rt ~ condition + (1 | pid), data = rt_clean)
  rirow <- summary(ri)$coefficients["conditionincongruent", ]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^Responses were slower on incongruent trials, b = ",
      "Start the sentence exactly as the template does."),
    rlab_want_match(got, "The size of the effect varied across participants \\\\(SD = ",
      "The second sentence should read \\"The size of the effect varied across participants (SD = ...)\\"."),
    rlab_want_match(got, "\\\\.$", "The sentence should end with a full stop."),
    rlab_want_match(got, "p < \\\\.001", "The p value should be written \`p < .001\`."),
    if (grepl(sprintf("t\\\\(%.2f\\\\)", rirow[["df"]]), got))
      "Those statistics come from the random-intercept model. The sentence should report the random-slopes model — the one you justified in mission 5." else character(0),
    rlab_want_nums(gsub("< \\\\.001", "", got),
      c(row[["Estimate"]], row[["Std. Error"]], row[["df"]], row[["t value"]], sd_slope),
      c("b", "standard error", "degrees of freedom", "t statistic",
        "SD of the by-participant effects"))
  )
})`,
    },
  ],
};
