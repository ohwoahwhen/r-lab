export default {
  id: 'l9',
  n: 9,
  needsStats: true,
  title: 'Lines Through Clouds',
  blurb: 'Regression: slopes, prediction, control variables, dummy coding and moderation.',
  story:
    "\"One more thing and then I will stop,\" says Dr. Finch, holding the door. \"Everything you have " +
    "done so far compares groups. Regression asks a different question: *how much* does one thing move " +
    "when another does? It is also the engine underneath the t-test and the ANOVA — once you see that, " +
    "the whole toolbox collapses into one idea.\"\n\n" +
    "She hands back the hiking log. \"Start with something you care about. How much does the pack cost you?\"",
  missions: [
    {
      id: 'l9m1',
      theory:
        "Regression draws the one straight line that misses the points by as little as possible \u2014 specifically, the line minimising the sum of the squared vertical distances to it. Squared, so that large misses hurt disproportionately and so that errors above and below the line cannot cancel each other out.\n\nThe two numbers it returns describe that line completely. The intercept is where it crosses zero; the slope is its steepness, in the units of your variables. \"Minutes per kilometre, per kilogram carried\" is a real quantity you can argue about and act on, which is often more useful than a correlation.\n\nTreat the intercept carefully when zero is impossible. A predicted reading score at age zero is arithmetic, not a finding.",
      title: 'A line through the cloud',
      xp: 55,
      teach:
        "`lm(outcome ~ predictor, data = d)` fits a straight line. The **intercept** is the predicted " +
        "outcome when the predictor is zero; the **slope** is how much the outcome changes for every " +
        "one-unit increase. Both come back from `coef()`.",
      task:
        "Using `hikes_clean`, fit a linear model predicting `pace_min_km` from `pack_kg`, and return " +
        "the model.",
      datasets: ['hikes_clean'],
      starter: '',
      hints: [
        'The formula reads "outcome explained by predictor": `pace_min_km ~ pack_kg`.',
        'The data goes in a named argument: `data = hikes_clean`.',
        'lm(pace_min_km ~ pack_kg, data = hikes_clean)',
      ],
      solution: 'lm(pace_min_km ~ pack_kg, data = hikes_clean)',
      debrief:
        "Pace = 12.30 + 0.31 × pack. Carrying nothing, you move at about 12 minutes 18 seconds per " +
        "kilometre, and every extra kilogram costs you roughly 19 seconds per kilometre. A 20 kg pack " +
        "adds over six minutes per kilometre — which is the sort of number that changes how you pack.",
      check: `local({
  want <- lm(pace_min_km ~ pack_kg, data = hikes_clean)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_lm(got),
    rlab_want_coef_names(got, c("(Intercept)", "pack_kg")),
    rlab_want_coef(got, "(Intercept)", coef(want)[["(Intercept)"]]),
    rlab_want_coef(got, "pack_kg", coef(want)[["pack_kg"]])
  )
})`,
    },
    {
      id: 'l9m2',
      theory:
        "R\u00b2 is the share of the outcome's variation that the line accounts for. The rest is everything the model does not know about.\n\nA high R\u00b2 is not automatically a good model and a low one is not automatically a bad one. Pace from pack weight reaches .62 because the physics is simple. Predicting who recovers from depression might top out at .15 and still be the most useful result anyone has found. The question is always \"compared to what?\".\n\nThe p value beside a slope tests whether that slope differs from zero. Not whether it is large, and not whether the model is right.",
      title: 'What the summary tells you',
      xp: 55,
      teach:
        "The model object prints only its coefficients. `summary()` adds the part you report: a standard " +
        "error, a t value and a p value for every term, plus **R²** — the share of the outcome's variance " +
        "the model accounts for.",
      task:
        "Return the `summary()` of that same model of `pace_min_km` from `pack_kg`.",
      datasets: ['hikes_clean'],
      starter: 'm <- lm(pace_min_km ~ pack_kg, data = hikes_clean)\n\n',
      hints: [
        'One function wrapped around the model.',
        'Do not retype the model — you already saved it as `m`.',
        'summary(m)',
      ],
      solution: 'm <- lm(pace_min_km ~ pack_kg, data = hikes_clean)\n\nsummary(m)',
      debrief:
        "R² = .62, so pack weight alone accounts for about 62% of how much your pace varies.\n\n" +
        "Look at the degrees of freedom: 103, so the model used 105 hikes. `hikes_clean` has 114 rows. " +
        "Nine hikes had no pack weight recorded and `lm()` dropped them **without saying a word**. That " +
        "silence is the single most common way people end up analysing a different dataset than they think.",
      check: `local({
  want <- summary(lm(pace_min_km ~ pack_kg, data = hikes_clean))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_summary_lm(got),
    rlab_want_r2(got, want$r.squared),
    rlab_want_coef(got, "pack_kg", want$coefficients[["pack_kg", "Estimate"]]),
    rlab_want_value(got$coefficients[["pack_kg", "Pr(>|t|)"]],
                    want$coefficients[["pack_kg", "Pr(>|t|)"]],
                    "the p value for the slope", tol = 1e-20)
  )
})`,
    },
    {
      id: 'l9m3',
      theory:
        "A fitted model is a function. Hand it values of the predictors and it returns the outcome it expects, including for combinations that never actually occurred.\n\nThis is also where models quietly go wrong. Predicting inside the range of your data is interpolation and reasonably safe. Predicting outside it \u2014 a 60 kg pack, an age of 90 when nobody over 40 was measured \u2014 is extrapolation, and a straight line will march confidently into territory it knows nothing about.",
      title: 'Ask it a question',
      xp: 55,
      teach:
        "A fitted model is a prediction machine. `predict(model, newdata = ...)` takes a data frame whose " +
        "columns are named after the predictors, and gives you the model's answer for each row — including " +
        "for combinations you never actually walked.",
      task:
        "Using the same model, predict the pace for packs of **0, 10 and 20 kg**, and return the three " +
        "predictions.",
      datasets: ['hikes_clean'],
      starter: 'm <- lm(pace_min_km ~ pack_kg, data = hikes_clean)\n\n',
      hints: [
        '`newdata` must be a data frame, and its column has to be called `pack_kg` — exactly the name the model knows.',
        '`data.frame(pack_kg = c(0, 10, 20))` builds it.',
        'predict(m, newdata = data.frame(pack_kg = c(0, 10, 20)))',
      ],
      solution:
        'm <- lm(pace_min_km ~ pack_kg, data = hikes_clean)\n\n' +
        'predict(m, newdata = data.frame(pack_kg = c(0, 10, 20)))',
      debrief:
        "12.30, 15.44, 18.58 minutes per kilometre. Note that the first one is the intercept — predicting " +
        "at zero is exactly what the intercept means.",
      check: `local({
  m <- lm(pace_min_km ~ pack_kg, data = hikes_clean)
  want <- unname(predict(m, newdata = data.frame(pack_kg = c(0, 10, 20))))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 3, "Your answer"),
    rlab_want_value(unname(got), want, "the predictions", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l9m4',
      theory:
        "\"Controlling for\" has a precise meaning here: the slope for pack weight is the relationship you would see among hikes that are identical in distance and climb. The model holds the others still and looks at what is left.\n\nThis is why regression dominates psychology. Almost nothing we care about can be randomised, so the alternative to statistical control is usually no control at all.\n\nBut control is not magic. It only removes the influence of variables you actually measured and included, and controlling for something measured with error leaves part of its influence behind. A coefficient that shifts sharply when you add a covariate is telling you the two predictors are entangled \u2014 that is information, not a nuisance.",
      title: 'More than one thing at a time',
      xp: 60,
      teach:
        "Add predictors with `+`. Each slope now means *holding the others constant* — the effect of this " +
        "predictor among hikes that are alike on everything else in the model. That phrase, \"controlling " +
        "for\", is what regression buys you.",
      task:
        "Fit a model of `pace_min_km` from `pack_kg`, `distance_km` **and** `elev_m` in `hikes_clean`, " +
        "and return the model.",
      datasets: ['hikes_clean'],
      starter: '',
      hints: [
        'Predictors are joined with `+` on the right of the tilde.',
        'The order you write them in does not change the fit.',
        'lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)',
      ],
      solution: 'lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)',
      debrief:
        "R² climbs from .62 to .78, and the pack slope barely moves (0.31 → 0.29) — so the pack effect was " +
        "not just longer hikes in disguise.\n\n" +
        "The surprise is `distance_km`: its slope is **negative**. Among hikes with the same pack and the " +
        "same climb, the longer ones are *faster per kilometre*. That is not magic, it is the fixed cost of " +
        "starting a walk being spread over more kilometres. A coefficient that flips sign when you add " +
        "controls is always worth a second look.",
      check: `local({
  want <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_lm(got),
    rlab_want_coef_names(got, c("(Intercept)", "pack_kg", "distance_km", "elev_m")),
    rlab_want_coef(got, "pack_kg", coef(want)[["pack_kg"]]),
    rlab_want_coef(got, "distance_km", coef(want)[["distance_km"]]),
    rlab_want_coef(got, "elev_m", coef(want)[["elev_m"]], tol = 1e-5),
    rlab_want_r2(got, summary(want)$r.squared)
  )
})`,
    },
    {
      id: 'l9m5',
      theory:
        "Adding a predictor can never lower R\u00b2, even if the predictor is random numbers. The line gains freedom to bend towards the points, and some of that improvement is just fitting noise.\n\nSo the question is never \"did R\u00b2 go up?\" but \"did it go up by more than chance hands me for free?\". The F test for nested models weighs the improvement in fit against the parameters it cost.\n\nNested means one model's terms are a subset of the other's, fitted on the same rows. If missing data quietly changes the sample size between the two models, the comparison is meaningless \u2014 which is the trap sitting underneath this entire level.",
      title: 'Was it worth adding them?',
      xp: 60,
      teach:
        "R² can only go up when you add predictors, so a bigger R² is not evidence of a better model. " +
        "`anova(small, big)` tests whether the extra terms earn their keep: a significant result means the " +
        "bigger model fits better than the extra parameters alone would explain.",
      task:
        "Compare the one-predictor model (`pack_kg` only) with the three-predictor model from the last " +
        "mission, and return the comparison.",
      datasets: ['hikes_clean'],
      starter:
        'm1 <- lm(pace_min_km ~ pack_kg, data = hikes_clean)\n' +
        'm2 <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)\n\n',
      hints: [
        '`anova()` takes both models, smaller one first.',
        'Both models must be fitted on the same rows for the comparison to be valid — they are here, because every hike with a pack weight also has a distance and a climb.',
        'anova(m1, m2)',
      ],
      solution:
        'm1 <- lm(pace_min_km ~ pack_kg, data = hikes_clean)\n' +
        'm2 <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)\n\n' +
        'anova(m1, m2)',
      debrief:
        "F(2, 101) = 38.14, p < .001. Distance and elevation together add something real. If this had come " +
        "back non-significant, the honest move would be to report the simpler model.",
      check: `local({
  m1 <- lm(pace_min_km ~ pack_kg, data = hikes_clean)
  m2 <- lm(pace_min_km ~ pack_kg + distance_km + elev_m, data = hikes_clean)
  want <- anova(m1, m2)
  rlab_want_model_comparison(.rlab_answer, want)
})`,
    },
    {
      id: 'l9m6',
      theory:
        "A regression needs numbers, so a three-level factor becomes two columns of 0s and 1s. Control gets neither flag, which makes it the reference, and its mean lives inside the intercept. Every other coefficient is a *difference from that reference*, not a group mean.\n\nTwo consequences. The meaning of each coefficient depends entirely on which level is the reference \u2014 change it and every number changes, though the model is identical. And there is no overall test of \"is there an effect of group\" here, only contrasts against one level; that is what the model's F test or a model comparison is for.\n\nThe deeper point: t-tests, ANOVA and regression are the same machinery with different defaults. Once you see that, you can stop memorising which test to run.",
      title: 'A predictor that is a word',
      xp: 60,
      teach:
        "Put a factor on the right of the tilde and R builds **dummy variables** for you: one level becomes " +
        "the reference, and every other level gets a coefficient meaning *the difference from that " +
        "reference*. The first level alphabetically — or of the factor — is the one that disappears.",
      task:
        "Using `wellbeing_scored` with the post-test dropouts removed, predict `wellbeing_post` from " +
        "`wellbeing_pre` **and** `group`, and return the model.",
      datasets: ['wellbeing_scored'],
      starter: 'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n\n',
      hints: [
        'This is the same `+` as last time; R notices `group` is a factor and handles the rest.',
        'You do not need to make dummy variables yourself — doing it by hand is a classic way to get the reference level wrong.',
        'lm(wellbeing_post ~ wellbeing_pre + group, data = w)',
      ],
      solution:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n\n' +
        'lm(wellbeing_post ~ wellbeing_pre + group, data = w)',
      debrief:
        "There is no `groupControl` coefficient, because Control *is* the reference — it is folded into the " +
        "intercept. `groupMindfulness = 4.50` means mindfulness participants ended 4.5 points above " +
        "controls **who started at the same baseline**.\n\n" +
        "This model is ANCOVA. You have now run the same analysis twice, in two languages.\n\n" +
        "One more thing: `lm()` would have dropped those eleven dropouts by itself, so the `drop_na()` " +
        "line changes nothing here. Write it anyway. Deciding your sample on purpose, where you can see " +
        "it, beats letting a function decide it quietly — which is exactly the trap from mission 2.",
      check: `local({
  w <- tidyr::drop_na(wellbeing_scored, wellbeing_post)
  want <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_lm(got),
    rlab_want_model_n(got, nrow(w)),
    rlab_want_coef_names(got, names(coef(want))),
    rlab_want_coef(got, "wellbeing_pre", coef(want)[["wellbeing_pre"]]),
    rlab_want_coef(got, "groupMindfulness", coef(want)[["groupMindfulness"]]),
    rlab_want_coef(got, "groupExercise", coef(want)[["groupExercise"]])
  )
})`,
    },
    {
      id: 'l9m7',
      theory:
        "A main effect says \"this helps, on average\". An interaction says \"how much it helps depends on something else\". In applied psychology the second is usually the question people actually care about \u2014 does the therapy work better for severe cases, does the drug behave differently in women.\n\nModeration is hard to detect. Interactions need considerably more data than main effects to reach the same power, so a non-significant interaction is very often an underpowered test rather than evidence that there is nothing there.\n\nWhich is why the honest write-up is \"we tested for moderation and did not find it\", not \"the effect was the same for everyone\".",
      title: 'Does it depend?',
      xp: 65,
      teach:
        "`a * b` in a formula means \"both, and their interaction\". In regression an interaction is " +
        "**moderation**: it asks whether the effect of the intervention depends on where someone started. " +
        "Fit it, then test it the way you test any extra terms — by comparing models.",
      task:
        "Fit a second model with `wellbeing_pre * group` instead of `wellbeing_pre + group`, compare it " +
        "with the additive model from the last mission, and return the comparison.",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n\n' +
        'additive <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)\n\n',
      hints: [
        'The moderated model is `lm(wellbeing_post ~ wellbeing_pre * group, data = w)`.',
        'You do not need to write the main effects separately — `*` includes them.',
        'moderated <- lm(wellbeing_post ~ wellbeing_pre * group, data = w)\nanova(additive, moderated)',
      ],
      solution:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n\n' +
        'additive <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)\n' +
        'moderated <- lm(wellbeing_post ~ wellbeing_pre * group, data = w)\n\n' +
        'anova(additive, moderated)',
      debrief:
        "F(2, 153) = 0.17, p = .85. No moderation: the interventions helped people who started low and " +
        "people who started high by about the same amount.\n\n" +
        "A null result is a result. Report the additive model, say you tested for moderation and did not " +
        "find it, and resist the urge to go hunting for a subgroup where it works.",
      check: `local({
  w <- tidyr::drop_na(wellbeing_scored, wellbeing_post)
  a <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)
  b <- lm(wellbeing_post ~ wellbeing_pre * group, data = w)
  want <- anova(a, b)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_model_comparison(got, want),
    rlab_want_value(got[["Df"]][2], want[["Df"]][2],
                    "the number of extra terms being tested")
  )
})`,
    },
    {
      id: 'l9boss',
      theory:
        "Everything in this level is one idea wearing different clothes. A t-test is a regression with a single dummy predictor. An ANOVA is a regression with a set of dummies. ANCOVA is that plus a covariate. Moderation is that plus a product term.\n\nYou now have the thing most people hope to have after a statistics course: not a flowchart of which test to run, but one model you understand well enough to extend.",
      title: 'Boss: the regression, reported',
      boss: true,
      xp: 190,
      teach:
        "A regression is reported with the model's overall test, its R², and then the coefficient you " +
        "actually care about with its standard error, t and p. `summary(m)$coefficients` is a matrix you " +
        "can index by row name and column name.",
      task:
        "Using the ANCOVA model (`wellbeing_post` from `wellbeing_pre + group`, dropouts removed), return " +
        "a single string in exactly this shape:\n\n" +
        "`Baseline wellbeing and condition explained most of the variance in post-test wellbeing, " +
        "R2 = .00, F(0, 000) = 000.00, p < .001. Controlling for baseline, the mindfulness condition " +
        "scored higher than control, b = 0.00, SE = 0.00, t(000) = 0.00, p < .001.`\n\n" +
        "The rules:\n" +
        "- `R2` to two decimals with no leading zero, like a p value\n" +
        "- the F, its two degrees of freedom and the model's residual degrees of freedom come from the summary\n" +
        "- `b`, `SE` and `t` are the `groupMindfulness` row, each to two decimals\n" +
        "- both p values really are below .001, so both are written `p < .001`",
      datasets: ['wellbeing_scored'],
      starter:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n' +
        'm <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)\n' +
        's <- summary(m)\n\n',
      hints: [
        '`s$fstatistic` is a vector of three numbers: the F, then its numerator and denominator degrees of freedom.',
        '`s$coefficients["groupMindfulness", "Estimate"]`, and the same row with `"Std. Error"` and `"t value"`.',
        'Strip the leading zero off R2 the same way as a p value: `sub("^0", "", sprintf("%.2f", s$r.squared))`.',
      ],
      solution:
        'w <- wellbeing_scored |>\n  drop_na(wellbeing_post)\n' +
        'm <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)\n' +
        's <- summary(m)\n\n' +
        'f <- s$fstatistic\n' +
        'row <- s$coefficients["groupMindfulness", ]\n' +
        'r2 <- sub("^0", "", sprintf("%.2f", s$r.squared))\n\n' +
        'sprintf(\n' +
        '  "Baseline wellbeing and condition explained most of the variance in post-test wellbeing, R2 = %s, F(%d, %d) = %.2f, p < .001. Controlling for baseline, the mindfulness condition scored higher than control, b = %.2f, SE = %.2f, t(%d) = %.2f, p < .001.",\n' +
        '  r2, f[["numdf"]], f[["dendf"]], f[["value"]],\n' +
        '  row[["Estimate"]], row[["Std. Error"]], df.residual(m), row[["t value"]]\n' +
        ')',
      check: `local({
  w <- tidyr::drop_na(wellbeing_scored, wellbeing_post)
  m <- lm(wellbeing_post ~ wellbeing_pre + group, data = w)
  s <- summary(m)
  f <- s$fstatistic
  row <- s$coefficients["groupMindfulness", ]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^Baseline wellbeing and condition explained most of the variance in post-test wellbeing, R2 = ",
      "Start the sentence exactly as the template does."),
    rlab_want_match(got, "Controlling for baseline, the mindfulness condition scored higher than control",
      "The second sentence should read \\"Controlling for baseline, the mindfulness condition scored higher than control\\"."),
    local({
      n <- length(gregexpr("p < \\\\.001", got)[[1]])
      if (!grepl("p < \\\\.001", got))
        "Both p values should be written \`p < .001\`." else
      if (n != 2) sprintf("I found %d \`p < .001\` but expected 2.", n) else character(0)
    }),
    rlab_want_match(got, "R2 = \\\\.[0-9]{2},",
      "R2 should be two decimals with no leading zero, like \`R2 = .81\`."),
    rlab_want_match(got, "\\\\.$", "The sentence should end with a full stop."),
    rlab_want_nums(gsub("R2|< \\\\.001", "", got),
      c(s$r.squared, f[["numdf"]], f[["dendf"]], f[["value"]],
        row[["Estimate"]], row[["Std. Error"]], stats::df.residual(m), row[["t value"]]),
      c("R squared", "numerator df", "denominator df", "F statistic",
        "coefficient b", "standard error", "t degrees of freedom", "t statistic"))
  )
})`,
    },
  ],
};
