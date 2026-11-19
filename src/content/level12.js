export default {
  id: 'l12',
  n: 12,
  needsStats: true,
  title: 'Right or Wrong',
  blurb: 'Logistic regression and generalised mixed models for binary outcomes.',
  story:
    "\"You have been analysing how *fast* people responded this whole time,\" says Dr. Finch, \"and " +
    "quietly throwing away whether they were *right*. Four hundred and twenty-one errors, deleted " +
    "every time you filtered to correct trials.\"\n\n" +
    "She pulls up `rt_acc` — the same cleaning, errors kept. \"The outcome is now a yes or a no. " +
    "Everything you know about regression still applies, but the straight line has to go.\"",
  missions: [
    {
      id: 'l12m1',
      title: 'A line will not do',
      xp: 60,
      teach:
        "For a 0/1 outcome, `glm(y ~ x, family = binomial)` fits a logistic regression. It models the " +
        "**log odds** of the outcome as a straight line, which keeps the predicted probability " +
        "between 0 and 1 no matter how far the predictor goes.",
      theory:
        "Fit an ordinary regression to a 0/1 outcome and three things break at once. It will happily " +
        "predict a probability of 1.3 or −0.2. Its residuals cannot be normal, because for any fitted " +
        "value there are only two possible residuals. And the variance of a coin flip depends on its " +
        "probability — biggest at .5, near zero at the extremes — so constant variance is impossible " +
        "by construction, not by bad luck.\n\n" +
        "The fix is to model a transformation. The **logit**, log(p / (1 − p)), stretches the interval " +
        "from 0 and 1 out to the whole number line, so a straight line in logit space is a sensible " +
        "S-shaped curve in probability space that can approach 0 and 1 without reaching them.\n\n" +
        "`family = binomial` is the part people forget. Leave it off and `glm()` silently fits an " +
        "ordinary linear model, because Gaussian is its default — no error, no warning, wrong model.",
      task:
        "Using `rt_acc`, fit a logistic regression predicting `correct` from `condition`, and return " +
        "the model.",
      datasets: ['rt_acc'],
      starter: '',
      hints: [
        'The formula is the same as `lm()`: `correct ~ condition`.',
        'What makes it logistic is the `family` argument: `family = binomial`.',
        'glm(correct ~ condition, data = rt_acc, family = binomial)',
      ],
      solution: 'glm(correct ~ condition, data = rt_acc, family = binomial)',
      debrief:
        "The coefficients are 3.52 and −1.22, and neither is a probability or a percentage. They are " +
        "log odds, which is why nobody reports them raw. The next mission makes them readable.",
      check: `local({
  want <- glm(correct ~ condition, data = rt_acc, family = binomial)
  got <- .rlab_answer
  rlab_seq(
    if (inherits(got, "lm") && !inherits(got, "glm"))
      "That is an ordinary \`lm()\`. A binary outcome needs \`glm()\` with \`family = binomial\`." else character(0),
    if (!inherits(got, "glm"))
      sprintf("Your answer should be the model from \`glm()\`, but it is %s. %s", rlab_desc(got), rlab_hint_lastline()) else character(0),
    if (!identical(tryCatch(got$family$family, error = function(e) ""), "binomial"))
      sprintf("Your model's family is \\"%s\\", not binomial — without \`family = binomial\` this is just a linear model in disguise.",
              tryCatch(got$family$family, error = function(e) "?")) else character(0),
    rlab_want_coef_names(got, c("(Intercept)", "conditionincongruent")),
    rlab_want_coef(got, "conditionincongruent", coef(want)[["conditionincongruent"]], tol = 1e-4)
  )
})`,
    },
    {
      id: 'l12m2',
      title: 'Odds, and what they are not',
      xp: 60,
      teach:
        "Exponentiating a logistic coefficient turns a log odds *difference* into an **odds ratio**: " +
        "`exp(coef(m))`. An odds ratio of 0.30 means the odds of being correct on an incongruent trial " +
        "are 0.30 times the odds on a congruent one.",
      theory:
        "Odds are not probability. A probability of .9 is odds of 9 to 1; a probability of .97 is odds " +
        "of about 32 to 1. The odds scale has no upper bound, which is exactly why it can be modelled " +
        "with a straight line.\n\n" +
        "The near-universal misreading is to report an odds ratio as \"three times more likely\". That " +
        "is a **risk ratio**, and it is a different number. The two are close when the outcome is rare " +
        "— under about 10% — and diverge badly when it is common. With accuracy around 95%, treating " +
        "an odds ratio as a risk ratio will mislead you substantially, and the paper will still read " +
        "fluently.\n\n" +
        "The other property worth internalising is that the odds ratio is constant while the " +
        "probability change is not. The same coefficient moves someone from .97 to .91, and would move " +
        "someone else from .50 to .23. One number, very different practical consequences, which is why " +
        "the next mission exists.",
      task:
        "Fit the same model and return the odds ratio for `conditionincongruent` — a single number.",
      datasets: ['rt_acc'],
      starter: 'm <- glm(correct ~ condition, data = rt_acc, family = binomial)\n\n',
      hints: [
        'The coefficients come out with `coef(m)`.',
        '`exp()` undoes the log, turning a log odds ratio into an odds ratio.',
        'exp(coef(m))[["conditionincongruent"]]',
      ],
      solution:
        'm <- glm(correct ~ condition, data = rt_acc, family = binomial)\n\n' +
        'exp(coef(m))[["conditionincongruent"]]',
      debrief:
        "0.296 — the odds of a correct response on an incongruent trial are about three tenths of the " +
        "odds on a congruent one. Flipped round, the odds of an *error* are about 3.4 times higher.\n\n" +
        "Note what that is not. Accuracy went from 97.1% to 90.9%, so the *probability* of being " +
        "correct fell by about 6 percentage points — nothing like a factor of three. Both statements " +
        "describe the same coefficient.",
      check: `local({
  m <- glm(correct ~ condition, data = rt_acc, family = binomial)
  want <- exp(coef(m))[["conditionincongruent"]]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    if (rlab_near(got, coef(m)[["conditionincongruent"]], 1e-6))
      "That is still the log odds. Exponentiate it with \`exp()\` to get an odds ratio." else character(0),
    if (rlab_near(got, 1 / want, 1e-4))
      "That is the odds ratio the other way round — the odds of an error. The mission asks for the odds of being *correct* on incongruent versus congruent trials." else character(0),
    rlab_want_value(got, want, "the odds ratio", tol = 1e-5)
  )
})`,
    },
    {
      id: 'l12m3',
      title: 'Back to something readable',
      xp: 60,
      teach:
        "`predict(model, newdata, type = \"response\")` converts the model's log odds back into " +
        "**probabilities**. Without `type = \"response\"` you get predictions on the logit scale, which " +
        "is almost never what you want to show anyone.",
      theory:
        "Probability is the only scale your reader thinks in. \"Accuracy fell from 97% to 91%\" lands; " +
        "\"the log odds fell by 1.22\" does not, and an odds ratio sits awkwardly in between.\n\n" +
        "The catch is that the probability effect is not one number. Because the curve is S-shaped, a " +
        "fixed shift in log odds has its biggest effect on probability near .5 and almost none out at " +
        "the extremes. So \"the effect of condition in percentage points\" only makes sense once you " +
        "say *from where*.\n\n" +
        "This is why reporting both is standard: the odds ratio because it is the model's actual " +
        "parameter and transfers across studies, and the predicted probabilities at meaningful values " +
        "because they are what the finding means. `emmeans(m, ~ condition, type = \"response\")` will " +
        "give you the same thing with confidence intervals attached.",
      task:
        "From the same model, return the predicted probability of a correct response for a " +
        "`congruent` trial and an `incongruent` trial, in that order, as two numbers.",
      datasets: ['rt_acc'],
      starter: 'm <- glm(correct ~ condition, data = rt_acc, family = binomial)\n\n',
      hints: [
        '`newdata` is a data frame whose column is named after the predictor: `data.frame(condition = c("congruent", "incongruent"))`.',
        'Without `type = "response"` you will get log odds — the giveaway is numbers like 3.5 instead of 0.97.',
        'predict(m, newdata = data.frame(condition = c("congruent", "incongruent")), type = "response")',
      ],
      solution:
        'm <- glm(correct ~ condition, data = rt_acc, family = binomial)\n\n' +
        'predict(m,\n' +
        '  newdata = data.frame(condition = c("congruent", "incongruent")),\n' +
        '  type = "response")',
      debrief:
        ".971 and .909. Those are exactly the raw accuracy rates in the two conditions, because a model " +
        "with one categorical predictor and nothing else cannot do anything but reproduce the group " +
        "means.\n\n" +
        "That is worth seeing once. The machinery only starts earning its keep when you add covariates, " +
        "or ask it about a combination that never occurred.",
      check: `local({
  m <- glm(correct ~ condition, data = rt_acc, family = binomial)
  want <- unname(predict(m, newdata = data.frame(condition = c("congruent", "incongruent")),
                         type = "response"))
  logit <- unname(predict(m, newdata = data.frame(condition = c("congruent", "incongruent"))))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 2, "Your answer"),
    if (rlab_near(unname(got), logit, 1e-5))
      "Those are log odds, not probabilities — add \`type = \\"response\\"\`." else character(0),
    if (rlab_near(unname(got), rev(want), 1e-6))
      "Right numbers, wrong order: congruent first, then incongruent." else character(0),
    rlab_want_value(unname(got), want, "the predicted probabilities", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l12m4',
      title: 'Deviance, not variance',
      xp: 60,
      teach:
        "Logistic models have no sums of squares, so nested models are compared by **deviance**: " +
        "`anova(m1, m2, test = \"Chisq\")` runs a likelihood ratio test on the drop in deviance.",
      theory:
        "Deviance is minus twice the log likelihood — a measure of misfit that plays the role residual " +
        "sums of squares play in ordinary regression. The difference in deviance between two nested " +
        "models is a chi-square statistic with as many degrees of freedom as the parameters you added. " +
        "It is the same likelihood ratio test you used on mixed models.\n\n" +
        "There is also no R². Several pseudo-R² measures exist — McFadden's, Nagelkerke's — and they " +
        "are not proportions of variance explained, do not agree with each other, and are not " +
        "comparable across datasets. Quote one if a reviewer insists, but do not build an argument on it.\n\n" +
        "A version note, because you will see this written both ways. Until R 4.4, comparing two GLMs with " +
        "`anova()` printed the deviance table and no p value unless you asked for \`test = \"Chisq\"\`. " +
        "Current R runs the test by default, so the argument is now redundant — but it is still correct, " +
        "still everywhere in tutorials, and still worth writing if your code might run on an older R.",
      task:
        "Fit a second model adding `block` as a predictor, compare it with the condition-only model " +
        "using a likelihood ratio test, and return the comparison.",
      datasets: ['rt_acc'],
      starter:
        'm1 <- glm(correct ~ condition, data = rt_acc, family = binomial)\n' +
        'm2 <- glm(correct ~ condition + block, data = rt_acc, family = binomial)\n\n',
      hints: [
        '`anova()` takes both models, simpler first.',
        'Current R runs the chi-square test automatically; adding `test = "Chisq"` is explicit and harmless.',
        'anova(m1, m2, test = "Chisq")',
      ],
      solution:
        'm1 <- glm(correct ~ condition, data = rt_acc, family = binomial)\n' +
        'm2 <- glm(correct ~ condition + block, data = rt_acc, family = binomial)\n\n' +
        'anova(m1, m2, test = "Chisq")',
      debrief:
        "χ²(1) = 1.00, p = .32. Block buys you nothing — people did not get more or less accurate as " +
        "the session went on, even though they did get faster.\n\n" +
        "Report it anyway. A predictor you tested and dropped is part of what you did, and leaving it " +
        "out of the write-up is how a reader ends up thinking you only ever fitted one model.",
      check: `local({
  m1 <- glm(correct ~ condition, data = rt_acc, family = binomial)
  m2 <- glm(correct ~ condition + block, data = rt_acc, family = binomial)
  want <- as.data.frame(anova(m1, m2, test = "Chisq"))
  got <- .rlab_answer
  gd <- tryCatch(as.data.frame(got), error = function(e) NULL)
  rlab_seq(
    if (is.null(gd))
      sprintf("Your answer should be the result of \`anova()\`, but it is %s. %s", rlab_desc(got), rlab_hint_lastline()) else character(0),
    if (nrow(gd) < 2)
      "That table has one row, so only one model went into it. Pass both: \`anova(m1, m2, test = \\"Chisq\\")\`." else character(0),
    if (!("Pr(>Chi)" %in% names(gd)))
      sprintf("No p value in your table (columns: %s). Add \`test = \\"Chisq\\"\` to run the likelihood ratio test.",
              paste0("\`", names(gd), "\`", collapse = ", ")) else character(0),
    rlab_want_value(gd[["Deviance"]][2], want[["Deviance"]][2], "the drop in deviance", tol = 1e-4),
    rlab_want_value(gd[["Pr(>Chi)"]][2], want[["Pr(>Chi)"]][2], "the p value", tol = 1e-6)
  )
})`,
    },
    {
      id: 'l12m5',
      title: 'Forty people again',
      xp: 70,
      teach:
        "`glmer()` is to `glm()` what `lmer()` was to `lm()`: add a random-effects term and it models " +
        "the clustering. Binary models are fitted by numerical approximation rather than algebra, so " +
        "expect this one to take a few seconds.",
      theory:
        "The clustering problem has not gone away just because the outcome changed. These are still " +
        "7,006 trials from 40 people, and per-person accuracy ranges from 80% to 99%.\n\n" +
        "Something happens here that does **not** happen in linear models, and it surprises people. " +
        "The condition coefficient gets *bigger* — from −1.218 to −1.260 — rather than just getting a " +
        "wider standard error. That is not a correction of bias; the two models are estimating " +
        "genuinely different things. `glm()` gives a **population-averaged** effect: what happens to " +
        "accuracy across the whole sample. `glmer()` gives a **subject-specific** effect: what happens " +
        "within a given person, holding their own ability fixed. For logistic models those two are not " +
        "equal, and the subject-specific one is always further from zero.\n\n" +
        "Which you want depends on the question. \"How much does congruency hurt a person?\" is " +
        "subject-specific. \"What is the overall error rate difference in this population?\" is " +
        "population-averaged. Most psychology questions are the first, and most papers do not say " +
        "which they mean.",
      task:
        "Fit a logistic mixed model on `rt_acc` predicting `correct` from `condition`, with a random " +
        "intercept for `pid`, and return the model.",
      datasets: ['rt_acc'],
      starter: '',
      hints: [
        'The function is `glmer()`, and it needs the same `family = binomial` as `glm()`.',
        'The random-effects term is the same one you used in level 10: `(1 | pid)`.',
        'glmer(correct ~ condition + (1 | pid), data = rt_acc, family = binomial)',
      ],
      solution:
        'glmer(correct ~ condition + (1 | pid), data = rt_acc, family = binomial)',
      debrief:
        "The by-participant SD is 0.76 on the log odds scale — a real spread in how accurate people " +
        "are, and not a singular fit.\n\n" +
        "If you ever see a random-effects SD of exactly zero and a \"boundary (singular) fit\" warning, " +
        "it means the model cannot find any between-cluster variation to estimate. Sometimes that is " +
        "true; more often the random-effects structure is too ambitious for the data.",
      check: `local({
  want <- lme4::glmer(correct ~ condition + (1 | pid), data = rt_acc, family = binomial)
  got <- .rlab_answer
  rlab_seq(
    if (inherits(got, "glm") && !rlab_is_mer(got))
      "That is \`glm()\` — it has no random effect, so it still treats all 7,006 trials as independent. Use \`glmer()\` with \`(1 | pid)\`." else character(0),
    rlab_want_mer(got, "the model from \`glmer()\`"),
    if (!identical(tryCatch(stats::family(got)$family, error = function(e) ""), "binomial"))
      "Your model is not binomial — \`glmer()\` also needs \`family = binomial\`." else character(0),
    rlab_want_random(got, "pid: (Intercept)"),
    rlab_want_fixef(got, "conditionincongruent", lme4::fixef(want)[["conditionincongruent"]], tol = 1e-3),
    rlab_want_vc_sd(got, "pid", "(Intercept)", rlab_vc_sd(want, "pid", "(Intercept)"),
                    "the by-participant SD")
  )
})`,
    },
    {
      id: 'l12m6',
      title: 'The shortcut everyone takes',
      xp: 65,
      teach:
        "The traditional alternative is to collapse each person to two proportions and run a paired " +
        "t-test on them. It is quick, it is familiar, and it is what most of the older literature did.",
      theory:
        "It is also worse, for three reasons that have nothing to do with fashion.\n\n" +
        "A proportion from 40 trials and a proportion from 160 trials get equal weight, even though " +
        "one is four times noisier. The outcome is bounded, so near ceiling the differences are " +
        "squashed and the normality assumption fails exactly where your data sit — 97% accuracy is " +
        "not a comfortable place for a t-test. And you cannot add trial-level predictors at all: " +
        "anything that varies within a condition has already been averaged away.\n\n" +
        "The old fix was an arcsine square-root transform. It is no longer recommended; the modern " +
        "argument, put most memorably by Warton and Hui, is that it distorts the scale without solving " +
        "the real problem, and that a model built for binary data is the better answer.\n\n" +
        "Run it here anyway, because you will read hundreds of papers that did, and you should know " +
        "both what it tells you and what it threw away.",
      task:
        "Collapse `rt_acc` to one accuracy proportion per `pid` per `condition`, then run a **paired** " +
        "t-test of incongruent against congruent accuracy, and return the test.",
      datasets: ['rt_acc'],
      starter:
        'agg <- rt_acc |>\n' +
        '  summarise(acc = mean(correct), .by = c(pid, condition)) |>\n' +
        '  pivot_wider(names_from = condition, values_from = acc)\n' +
        'agg\n',
      hints: [
        'Each row of `agg` is one person with two accuracy columns, so this is the paired test from level 11.',
        'Incongruent first, so the difference comes out negative.',
        't.test(agg$incongruent, agg$congruent, paired = TRUE)',
      ],
      solution:
        'agg <- rt_acc |>\n' +
        '  summarise(acc = mean(correct), .by = c(pid, condition)) |>\n' +
        '  pivot_wider(names_from = condition, values_from = acc)\n\n' +
        't.test(agg$incongruent, agg$congruent, paired = TRUE)',
      debrief:
        "t(39) = −6.85, p < .001, a drop of 6.2 percentage points. The same conclusion as the mixed " +
        "model, on 40 numbers instead of 7,006.\n\n" +
        "That is the usual outcome for a large, clean, balanced effect, and it is why the shortcut " +
        "survived so long. It fails when the effect is smaller, when trial counts differ between " +
        "people, or when you want to ask anything about individual trials — and by then you have " +
        "already thrown the data away.",
      check: `local({
  agg <- rt_acc |> dplyr::summarise(acc = mean(correct), .by = c(pid, condition)) |>
    tidyr::pivot_wider(names_from = condition, values_from = acc)
  want <- t.test(agg$incongruent, agg$congruent, paired = TRUE)
  indep <- t.test(agg$incongruent, agg$congruent)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_htest(got, "the result of \`t.test()\`"),
    if (!is.null(got$parameter) && rlab_near(unname(got$parameter)[1], unname(indep$parameter)[1], 1e-3))
      "That is the unpaired version — each row is one person measured twice, so add \`paired = TRUE\`." else character(0),
    rlab_want_method(got, "paired", "This needs the paired t-test."),
    rlab_want_field(got, "parameter", want$parameter, "the degrees of freedom"),
    if (rlab_near(unname(got$statistic)[1], -unname(want$statistic)[1], 1e-3))
      "Right magnitude, wrong sign: put incongruent first so the difference is negative." else character(0),
    rlab_want_field(got, "statistic", want$statistic, "the t statistic"),
    rlab_want_field(got, "p.value", want$p.value, "the p value", tol = 1e-8)
  )
})`,
    },
    {
      id: 'l12boss',
      title: 'Boss: the accuracy result',
      boss: true,
      xp: 220,
      teach:
        "Report a logistic model the way a reader can use it: the odds ratio because it is the " +
        "parameter, and the probabilities because they are the meaning. Everything comes from " +
        "`summary(m)$coefficients` and `exp()`.",
      theory:
        "A complete logistic result has three parts, and papers routinely give one. The coefficient " +
        "with its test tells the reader whether the effect is distinguishable from nothing. The odds " +
        "ratio makes it comparable with other studies. The predicted probabilities say what it means " +
        "in the units the experiment was run in.\n\n" +
        "Give only the odds ratio and your reader will quietly convert it to a risk ratio in their " +
        "head and be wrong. Give only the percentages and nobody can combine your result with anyone " +
        "else's. Both, and the write-up is checkable.\n\n" +
        "Say which model produced them, too. The odds ratio from `glm()` and the one from `glmer()` " +
        "answer different questions, and the only way a reader can tell which you fitted is if you " +
        "tell them.",
      task:
        "Using the **mixed** model (`correct ~ condition + (1 | pid)`, binomial), return a single " +
        "string in exactly this shape:\n\n" +
        "`Accuracy was lower on incongruent trials, b = -0.00, SE = 0.00, z = -0.00, p < .001, " +
        "odds ratio 0.00. Participants varied in overall accuracy (SD = 0.00 on the log odds scale).`\n\n" +
        "The rules:\n" +
        "- `b`, `SE`, `z`, the odds ratio and the SD are all to two decimals\n" +
        "- the first four come from the `conditionincongruent` row of `summary(m)$coefficients`\n" +
        "- the odds ratio is `exp()` of that coefficient\n" +
        "- the SD is the by-participant `(Intercept)` standard deviation from `VarCorr()`",
      datasets: ['rt_acc'],
      starter:
        'm <- glmer(correct ~ condition + (1 | pid), data = rt_acc, family = binomial)\n' +
        'row <- summary(m)$coefficients["conditionincongruent", ]\n' +
        'vc <- as.data.frame(VarCorr(m))\n\n',
      hints: [
        'The pieces of `row` are `row[["Estimate"]]`, `row[["Std. Error"]]` and `row[["z value"]]` — note it is z, not t, because there is no residual variance to estimate.',
        'The SD is `vc$sdcor[1]`, the only random-effects row in this model.',
        'sprintf("Accuracy was lower on incongruent trials, b = %.2f, SE = %.2f, z = %.2f, p < .001, odds ratio %.2f. Participants varied in overall accuracy (SD = %.2f on the log odds scale).", row[["Estimate"]], row[["Std. Error"]], row[["z value"]], exp(row[["Estimate"]]), vc$sdcor[1])',
      ],
      solution:
        'm <- glmer(correct ~ condition + (1 | pid), data = rt_acc, family = binomial)\n' +
        'row <- summary(m)$coefficients["conditionincongruent", ]\n' +
        'vc <- as.data.frame(VarCorr(m))\n\n' +
        'sprintf(\n' +
        '  "Accuracy was lower on incongruent trials, b = %.2f, SE = %.2f, z = %.2f, p < .001, odds ratio %.2f. Participants varied in overall accuracy (SD = %.2f on the log odds scale).",\n' +
        '  row[["Estimate"]], row[["Std. Error"]], row[["z value"]],\n' +
        '  exp(row[["Estimate"]]), vc$sdcor[1]\n' +
        ')',
      debrief:
        "That is the last sentence of the course. Between levels 7 and 12 you have reported a t-test, " +
        "an ANOVA with follow-ups, a mixed ANOVA, a regression, a linear mixed model and now a " +
        "generalised one — and every one of them in a form a sceptical reader can check.",
      check: `local({
  m <- lme4::glmer(correct ~ condition + (1 | pid), data = rt_acc, family = binomial)
  row <- summary(m)$coefficients["conditionincongruent", ]
  sd1 <- rlab_vc_sd(m, "pid", "(Intercept)")
  fixed <- glm(correct ~ condition, data = rt_acc, family = binomial)
  frow <- summary(fixed)$coefficients["conditionincongruent", ]
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^Accuracy was lower on incongruent trials, b = ",
      "Start the sentence exactly as the template does."),
    rlab_want_match(got, "odds ratio ", "The first sentence should end with \\"odds ratio ...\\"."),
    rlab_want_match(got, "Participants varied in overall accuracy \\\\(SD = ",
      "The second sentence should read \\"Participants varied in overall accuracy (SD = ...)\\"."),
    rlab_want_match(got, "on the log odds scale\\\\)\\\\.$",
      "The sentence should end \\"on the log odds scale).\\""),
    rlab_want_match(got, "p < \\\\.001", "The p value should be written \`p < .001\`."),
    if (grepl(sprintf("b = %.2f", frow[["Estimate"]]), got) &&
        !rlab_near(round(frow[["Estimate"]], 2), round(row[["Estimate"]], 2), 1e-9))
      "Those numbers are from the \`glm()\`, not the mixed model. Fit \`glmer()\` with \`(1 | pid)\`." else character(0),
    rlab_want_nums(gsub("< \\\\.001", "", got),
      c(row[["Estimate"]], row[["Std. Error"]], row[["z value"]],
        exp(row[["Estimate"]]), sd1),
      c("b", "standard error", "z statistic", "odds ratio", "by-participant SD"))
  )
})`,
    },
  ],
};
