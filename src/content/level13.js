export default {
  id: 'l13',
  n: 13,
  needsStats: true,
  title: 'How Much Is Enough',
  blurb: 'Power, sample size, simulation, and testing for the absence of an effect.',
  story:
    "\"Last one, and it is the one I wish someone had taught me first.\" Dr. Finch closes the laptop.\n\n" +
    "\"Everything you have done so far happens *after* the data exists. This level happens before — " +
    "how many people do you need, and what could you have detected if you had them. And then the " +
    "question nobody taught me to ask: how do you show that two things are the *same*?\"",
  missions: [
    {
      id: 'l13m1',
      title: 'How many people',
      xp: 60,
      teach:
        "`pwr.t.test()` ties four things together: effect size, sample size, alpha and power. Give it " +
        "any three and it solves for the fourth. Leave `n` out and it tells you the sample size you need.",
      theory:
        "Power is the probability of detecting an effect that is really there. At 80% power — the " +
        "convention — you are accepting a one in five chance of missing a real effect, which is a " +
        "strikingly high failure rate once you say it out loud.\n\n" +
        "The four quantities are locked together, so fixing three determines the fourth. That is the " +
        "whole of power analysis; everything else is choosing sensible inputs.\n\n" +
        "And the input that matters is the effect size, which is also the one you do not know. This is " +
        "the uncomfortable centre of the whole exercise: you must assume the answer in order to design " +
        "the study that finds it. Everything in this level is about making that assumption honestly " +
        "rather than optimistically.",
      task:
        "How many participants **per group** would you need to detect a medium effect (*d* = 0.5) in a " +
        "two-sample t-test, with 80% power at α = .05? Return the `n` from the power analysis — the raw " +
        "number, not rounded.",
      datasets: [],
      starter: '',
      hints: [
        'Supply `d`, `power` and `sig.level`, and leave `n` out so it has something to solve for.',
        'The default `type` is already `"two.sample"`; the result is a list with an `n` element.',
        'pwr.t.test(d = 0.5, power = 0.80, sig.level = 0.05)$n',
      ],
      solution: 'pwr.t.test(d = 0.5, power = 0.80, sig.level = 0.05)$n',
      debrief:
        "63.77, so 64 per group and 128 in total — always round **up**, because 63 people would leave " +
        "you below 80%.\n\n" +
        "Worth knowing how fast this grows. A medium effect needs 64 per group; a small one (*d* = 0.2) " +
        "needs 394. Most of the underpowered literature is not careless, it is studies designed for " +
        "medium effects that turned out to be small.",
      check: `local({
  want <- pwr::pwr.t.test(d = 0.5, power = 0.80, sig.level = 0.05)$n
  got <- .rlab_answer
  rlab_seq(
    if (inherits(got, "power.htest"))
      "Nearly — that is the whole result object. Pull the sample size out of it with \`$n\`." else character(0),
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    if (rlab_near(got, 2 * want, 0.01))
      "That is the total across both groups. \`pwr.t.test()\` reports n *per group*." else character(0),
    rlab_want_value(got, want, "the required n per group", tol = 1e-4)
  )
})`,
    },
    {
      id: 'l13m2',
      title: 'The power you already had',
      xp: 60,
      teach:
        "`pwr.t2n.test()` handles unequal group sizes. Give it both group sizes and the effect size you " +
        "actually observed, and it returns the power the study had **for that effect**. This is called " +
        "observed or post-hoc power.",
      theory:
        "It is also, for the purpose people usually reach for it, useless. Observed power is computed " +
        "from the observed effect, which is computed from the same data as the p value — so it is a " +
        "deterministic function of p. A significant result always yields observed power above 50%; a " +
        "non-significant one always yields less. It cannot tell you anything the p value did not.\n\n" +
        "Which makes the standard move — getting p = .22, computing power, and writing \"the study was " +
        "underpowered, which explains the null result\" — circular. You have restated your p value in " +
        "different units and presented it as an explanation for itself.\n\n" +
        "Reviewers still ask for it. The right response is to give them a sensitivity analysis instead, " +
        "which is the next mission, and to say why.",
      task:
        "Take the Control vs Mindfulness comparison of `ses_total` from level 7. Using the two group " +
        "sizes and the **absolute** observed Cohen's *d*, return the observed power of that comparison.",
      datasets: ['wellbeing_scored'],
      starter:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'd_obs <- cohens_d(ses_total ~ group, data = two)$Cohens_d\n' +
        'n1 <- sum(two$group == "Control")\n' +
        'n2 <- sum(two$group == "Mindfulness")\n\n',
      hints: [
        '`pwr.t2n.test()` takes `n1`, `n2` and `d`, and returns a list with `power`.',
        'The observed d is negative. `pwr` gives the same answer either way, but `abs(d_obs)` says what you mean.',
        'pwr.t2n.test(n1 = n1, n2 = n2, d = abs(d_obs))$power',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'd_obs <- cohens_d(ses_total ~ group, data = two)$Cohens_d\n' +
        'n1 <- sum(two$group == "Control")\n' +
        'n2 <- sum(two$group == "Mindfulness")\n\n' +
        'pwr.t2n.test(n1 = n1, n2 = n2, d = abs(d_obs))$power',
      debrief:
        "65.5% — and the comparison was significant at p = .019. Those two numbers are not independent " +
        "pieces of evidence; the second is computable from the first.\n\n" +
        "So you have learned nothing you did not already know. That is the point of the mission: the " +
        "calculation runs perfectly, produces a plausible number, and answers no question worth asking.",
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  d_obs <- effectsize::cohens_d(ses_total ~ group, data = two)$Cohens_d
  n1 <- sum(two$group == "Control"); n2 <- sum(two$group == "Mindfulness")
  want <- pwr::pwr.t2n.test(n1 = n1, n2 = n2, d = abs(d_obs))$power
  got <- .rlab_answer
  rlab_seq(
    if (inherits(got, "power.htest"))
      "That is the whole result object — pull the number out with \`$power\`." else character(0),
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    rlab_want_value(got, want, "the observed power", tol = 1e-5)
  )
})`,
    },
    {
      id: 'l13m3',
      title: 'What could you have seen',
      xp: 65,
      teach:
        "A **sensitivity analysis** fixes the sample size you have and solves for the effect size " +
        "instead: given these groups, what is the smallest effect I would have caught 80% of the time? " +
        "Same function, different blank.",
      theory:
        "This is the question observed power was pretending to answer. It does not use your result at " +
        "all — only your design — so it is not circular, and it is informative whether or not anything " +
        "came out significant.\n\n" +
        "It converts a null result into something a reader can use. \"We found no effect\" is nearly " +
        "content-free. \"We had 80% power to detect *d* = 0.53, and found nothing\" tells them you have " +
        "ruled out a medium effect and left a small one entirely possible. Those are very different " +
        "papers.\n\n" +
        "It is also the honest reply when a reviewer asks for post-hoc power. Report the sensitivity " +
        "analysis, say what it rules out, and if you want to go further, test for equivalence — which " +
        "is where this level ends.",
      task:
        "With the same two group sizes, what is the smallest Cohen's *d* you could have detected with " +
        "80% power at α = .05? Return it.",
      datasets: ['wellbeing_scored'],
      starter:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n' +
        'n1 <- sum(two$group == "Control")\n' +
        'n2 <- sum(two$group == "Mindfulness")\n\n',
      hints: [
        'Same function as last time, but now `d` is the unknown and `power` is given.',
        'Leave `d` out entirely and pass `power = 0.80`.',
        'pwr.t2n.test(n1 = n1, n2 = n2, power = 0.80, sig.level = 0.05)$d',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n' +
        'n1 <- sum(two$group == "Control")\n' +
        'n2 <- sum(two$group == "Mindfulness")\n\n' +
        'pwr.t2n.test(n1 = n1, n2 = n2, power = 0.80, sig.level = 0.05)$d',
      debrief:
        "*d* = 0.53. With 57 and 56 people, anything smaller than a medium-sized effect was more likely " +
        "to be missed than found.\n\n" +
        "Notice that the observed effect, *d* = 0.45, is **below** that threshold. The study detected an " +
        "effect it was not reliably powered to detect — which happens, and is one reason published " +
        "effects tend to be larger than real ones. The next mission makes that concrete.",
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  n1 <- sum(two$group == "Control"); n2 <- sum(two$group == "Mindfulness")
  want <- pwr::pwr.t2n.test(n1 = n1, n2 = n2, power = 0.80, sig.level = 0.05)$d
  ph <- pwr::pwr.t2n.test(n1 = n1, n2 = n2,
          d = abs(effectsize::cohens_d(ses_total ~ group, data = two)$Cohens_d))$power
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    if (rlab_near(got, ph, 1e-5))
      "That is the observed power again. This mission fixes the power at .80 and solves for \`d\` instead." else character(0),
    rlab_want_value(got, want, "the smallest detectable d", tol = 1e-5)
  )
})`,
    },
    {
      id: 'l13m4',
      title: 'Powering the optimistic way',
      xp: 70,
      teach:
        "Planning a replication from a published effect size means taking that estimate at face value. " +
        "A **safeguard** power analysis uses the confidence bound nearest zero instead, so your design " +
        "survives the published effect being an overestimate.",
      theory:
        "Published effects are biased upwards, and not because anyone cheated. Significant results are " +
        "more likely to be published, and in an underpowered study the only results that reach " +
        "significance are the ones that overshoot. Filter a literature for *p* < .05 and you have " +
        "filtered it for overestimates.\n\n" +
        "So powering a replication on a published point estimate quietly guarantees you are " +
        "underpowered for the real effect. Safeguard power — using the lower bound of the original " +
        "confidence interval — is one defence. Specifying a **smallest effect size of interest** before " +
        "you look at anyone's results is another, and often better: it asks what effect would be large " +
        "enough to matter rather than what effect someone reported.\n\n" +
        "Either way, the honest conclusion is usually that you need far more participants than the " +
        "original study had. That is not a reason to distrust the method. It is the method working.",
      task:
        "Using the Control vs Mindfulness effect again, return a numeric vector of **two** sample sizes " +
        "per group, both rounded up with `ceiling()`:\n" +
        "1. the *n* needed for 80% power at the observed *d*\n" +
        "2. the *n* needed at the bound of its 95% CI that is **closest to zero**",
      datasets: ['wellbeing_scored'],
      starter:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'cd <- cohens_d(ses_total ~ group, data = two)\n' +
        'cd\n',
      hints: [
        'Run the starter: `cd` has `Cohens_d`, `CI_low` and `CI_high`. The effect is negative, so the bound nearest zero is `CI_high`.',
        'Power cares about magnitude, so take `abs()` of each before passing it as `d`.',
        'ceiling(c(pwr.t.test(d = abs(cd$Cohens_d), power = .80)$n, pwr.t.test(d = abs(cd$CI_high), power = .80)$n))',
      ],
      solution:
        'two <- wellbeing_scored |>\n' +
        '  filter(group %in% c("Control", "Mindfulness"))\n\n' +
        'cd <- cohens_d(ses_total ~ group, data = two)\n\n' +
        'ceiling(c(\n' +
        '  pwr.t.test(d = abs(cd$Cohens_d), power = 0.80)$n,\n' +
        '  pwr.t.test(d = abs(cd$CI_high), power = 0.80)$n\n' +
        '))',
      debrief:
        "80 per group if the published estimate is exactly right. **2,932** per group if the true effect " +
        "sits at the cautious end of its own confidence interval.\n\n" +
        "A factor of thirty-seven, from a single study's own uncertainty. This is the arithmetic behind " +
        "a decade of failed replications: the original estimate was not a lie, it was just the high end " +
        "of a wide interval, and everyone designed their follow-ups as though it were exact.",
      check: `local({
  two <- dplyr::filter(wellbeing_scored, group %in% c("Control", "Mindfulness"))
  cd <- effectsize::cohens_d(ses_total ~ group, data = two)
  want <- ceiling(c(pwr::pwr.t.test(d = abs(cd$Cohens_d), power = 0.80)$n,
                    pwr::pwr.t.test(d = abs(cd$CI_high), power = 0.80)$n))
  low <- ceiling(pwr::pwr.t.test(d = abs(cd$CI_low), power = 0.80)$n)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 2, "Your answer"),
    if (length(got) == 2 && rlab_near(got[2], low, 0.5))
      "You used the far bound of the CI. The effect is negative, so the bound *closest to zero* — the pessimistic one for power — is \`CI_high\`." else character(0),
    if (length(got) == 2 && rlab_near(sort(unname(got)), sort(want) + c(0, 0), 1) &&
        !identical(as.numeric(unname(got)), as.numeric(want)) && rlab_near(unname(got), rev(want), 0.5))
      "Right two numbers, wrong order: observed effect first, then the CI bound." else character(0),
    rlab_want_value(unname(got), want, "the two sample sizes", tol = 0.5)
  )
})`,
    },
    {
      id: 'l13m5',
      title: 'Power without a formula',
      xp: 70,
      teach:
        "When no formula exists for your design, you simulate: generate data where you know the answer, " +
        "run your analysis, and count how often it finds the effect. `replicate()` repeats an expression " +
        "many times and collects the results.",
      theory:
        "Analytic power formulas exist for a handful of standard tests and nothing else. The moment your " +
        "design has a random slope, a covariate, unequal cells or a non-standard outcome, the lookup " +
        "table runs out. Simulation does not.\n\n" +
        "The logic is mechanical. Build a world where the effect is exactly the size you care about, " +
        "draw a sample from it, run the exact analysis you plan to run, and record whether *p* < .05. Do " +
        "that a thousand times and the proportion of significant results *is* your power — no theory " +
        "required.\n\n" +
        "It also forces an unusual kind of honesty, because you have to write down what you believe the " +
        "world looks like: the effect, the noise, the structure. People often discover at this point " +
        "that they do not know what they are assuming. And because it is a sampling estimate, it has " +
        "its own error bars — a thousand runs puts you within roughly ±1.3 percentage points.",
      task:
        "Estimate the power of a two-sample t-test with **64 per group** and a true effect of " +
        "**d = 0.5**, by simulating 1,000 studies. Draw each group with `rnorm()`, use " +
        "`set.seed(99)` first, and return the proportion of simulated studies with *p* < .05.",
      datasets: [],
      starter:
        'set.seed(99)\n\n' +
        'sig <- replicate(1000, {\n' +
        '  group_a <- rnorm(64, mean = 0.5, sd = 1)\n' +
        '  group_b <- rnorm(64, mean = 0, sd = 1)\n' +
        '  \n' +
        '})\n\n',
      hints: [
        'Inside the braces, run the test and ask whether it was significant: `t.test(group_a, group_b)$p.value < .05`.',
        '`replicate()` returns a logical vector of 1,000 TRUE/FALSE values.',
        'The proportion of TRUEs in a logical vector is just `mean()` of it.',
      ],
      solution:
        'set.seed(99)\n\n' +
        'sig <- replicate(1000, {\n' +
        '  group_a <- rnorm(64, mean = 0.5, sd = 1)\n' +
        '  group_b <- rnorm(64, mean = 0, sd = 1)\n' +
        '  t.test(group_a, group_b)$p.value < .05\n' +
        '})\n\n' +
        'mean(sig)',
      debrief:
        "About .81, against the analytic answer of .8015 from mission 1. The simulation did not need to " +
        "know any formula — it just played the study a thousand times and counted.\n\n" +
        "That is the whole technique, and it scales to designs no table covers. Swap the t-test for a " +
        "mixed model and the same loop estimates power for that, which is what packages like `simr` do " +
        "underneath.",
      check: `local({
  analytic <- pwr::pwr.t.test(n = 64, d = 0.5, sig.level = 0.05)$power
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "numeric", "Your answer"),
    rlab_want_len(got, 1, "Your answer"),
    if (!is.na(got[1]) && (got[1] < 0 || got[1] > 1))
      sprintf("A power estimate has to be a proportion between 0 and 1, and yours is %s. Did you count the significant studies instead of averaging them?", rlab_fmt(got[1])) else character(0),
    if (!is.na(got[1]) && got[1] > 0.02 && got[1] < 0.1)
      "That is close to .05, which is what you get when the true effect is zero. Check that one group really is drawn with \`mean = 0.5\`." else character(0),
    if (!is.na(got[1]) && abs(got[1] - analytic) > 0.045)
      sprintf("Your estimate is %s, but 1,000 simulated studies at d = 0.5 with n = 64 should land near %s. Check the sample size, the effect and the alpha you compare against.",
              rlab_fmt(got[1], 3), rlab_fmt(analytic, 3)) else character(0)
  )
})`,
    },
    {
      id: 'l13m6',
      title: 'Showing there is nothing there',
      xp: 70,
      teach:
        "An **equivalence test** flips the null hypothesis. Instead of testing whether the difference is " +
        "zero, it tests whether the difference is smaller than a bound you specify. " +
        "`t_TOST(y ~ group, data = d, eqb = 2)` does two one-sided tests against ±2.",
      theory:
        "A non-significant result does not mean no effect — the course has said so three times now, and " +
        "this is the tool that lets you say something better.\n\n" +
        "TOST stands for two one-sided tests. You declare a region around zero that counts as " +
        "practically nothing — the equivalence bound — and test whether the effect is reliably inside " +
        "it. If both one-sided tests reject, you have evidence *for* the absence of a meaningful effect, " +
        "which an ordinary t-test can never give you however large your sample.\n\n" +
        "The bound is a judgement, not a statistic, and it has to be defensible and set in advance. Two " +
        "points on this wellbeing scale is the smallest change anyone would act on; pick ±10 and you " +
        "could declare almost anything equivalent. Stating the bound and why is the whole credibility " +
        "of the method.\n\n" +
        "Note the four possible outcomes, not two: significant and equivalent (a real but trivial " +
        "effect), significant and not equivalent (a real and meaningful one), non-significant and " +
        "equivalent (good evidence of nothing), and non-significant and not equivalent — which means " +
        "your study simply could not tell, and is the honest description of a great many null results.",
      task:
        "Level 8 found no difference between the Mindfulness and Exercise conditions. Test whether they " +
        "are statistically **equivalent** on `change` scores, using an equivalence bound of **±2 points**, " +
        "and return the result.",
      datasets: ['wellbeing_scored'],
      starter:
        'me <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre) |>\n' +
        '  filter(group %in% c("Mindfulness", "Exercise")) |>\n' +
        '  mutate(group = droplevels(group))\n\n',
      hints: [
        'The function is `t_TOST()` and it takes the same formula interface as `t.test()`.',
        'The equivalence bound is the `eqb` argument.',
        't_TOST(change ~ group, data = me, eqb = 2)',
      ],
      solution:
        'me <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre) |>\n' +
        '  filter(group %in% c("Mindfulness", "Exercise")) |>\n' +
        '  mutate(group = droplevels(group))\n\n' +
        't_TOST(change ~ group, data = me, eqb = 2)',
      debrief:
        "The ordinary test is non-significant, *p* = .96. The equivalence test **is** significant, " +
        "*p* = .018. So this is not \"we failed to find a difference\" — it is \"the difference is " +
        "reliably smaller than two points\", which is a positive finding you can write down.\n\n" +
        "Level 8 told you a non-significant pairwise comparison is not evidence that two groups are " +
        "equal. That was true. This is how you get the evidence.",
      check: `local({
  me <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre) |>
    dplyr::filter(group %in% c("Mindfulness", "Exercise")) |>
    dplyr::mutate(group = droplevels(group))
  want <- TOSTER::t_TOST(change ~ group, data = me, eqb = 2)
  got <- .rlab_answer
  rlab_seq(
    if (inherits(got, "htest"))
      "That is the ordinary t-test. An equivalence test needs \`t_TOST()\` and a bound." else character(0),
    if (!inherits(got, "TOSTt"))
      sprintf("Your answer should be the result of \`t_TOST()\`, but it is %s. %s", rlab_desc(got), rlab_hint_lastline()) else character(0),
    local({
      g <- tryCatch(as.numeric(got$eqb$high_eq[1]), error = function(e) NA_real_)
      if (!is.na(g) && !rlab_near(g, 2, 1e-6))
        sprintf("Your equivalence bound is ±%s, but the mission asks for ±2 points.", rlab_fmt(g)) else character(0)
    }),
    rlab_want_value(got$TOST$p.value[1], want$TOST$p.value[1], "the ordinary t-test p value", tol = 1e-5),
    rlab_want_value(max(got$TOST$p.value[2:3]), max(want$TOST$p.value[2:3]),
                    "the equivalence p value", tol = 1e-5)
  )
})`,
    },
    {
      id: 'l13boss',
      title: 'Boss: the study you would run next',
      boss: true,
      xp: 240,
      teach:
        "The final sentence of the course reports a result and the design that would follow from it: " +
        "what you can rule out now, and what it would take to do better.",
      theory:
        "Three numbers make a null result publishable, and most papers report none of them: the " +
        "equivalence test, the effect you could have detected, and the sample size the next study would " +
        "need. Together they turn \"we found nothing\" into a quantitative claim another researcher can " +
        "build on.\n\n" +
        "This is also the last thing worth saying about the whole course. The arithmetic has been the " +
        "easy part throughout. Every genuinely hard decision — which comparison was planned, what counts " +
        "as a meaningful difference, which model you fitted and why, what you excluded — is a judgement " +
        "you make and then disclose. R will run any of them without complaint.\n\n" +
        "Writing them down is the job.",
      task:
        "Return a single string in exactly this shape, about the Mindfulness versus Exercise comparison:\n\n" +
        "`The two active conditions were statistically equivalent within 0 points, t(000.00) = -0.00, " +
        "p = .000, while the conventional test was non-significant, p = .000. Detecting a difference of " +
        "d = 0.00 would require 000 participants per group.`\n\n" +
        "The rules:\n" +
        "- the equivalence bound is 2 points, and the equivalence statistics are the one-sided test with " +
        "the **larger** p value\n" +
        "- the degrees of freedom and both p values come from the `t_TOST` result; p values get three " +
        "decimals with no leading zero\n" +
        "- the final sentence is for a smallest effect of interest of *d* = 0.20, at 80% power, rounded " +
        "up with `ceiling()`",
      datasets: ['wellbeing_scored'],
      starter:
        'me <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre) |>\n' +
        '  filter(group %in% c("Mindfulness", "Exercise")) |>\n' +
        '  mutate(group = droplevels(group))\n\n' +
        'r <- t_TOST(change ~ group, data = me, eqb = 2)\n' +
        'r$TOST\n',
      hints: [
        'Run the starter: `r$TOST` has three rows — the ordinary test, then the two one-sided tests. You want the one of the latter two with the bigger p value.',
        '`i <- which.max(r$TOST$p.value[2:3]) + 1` finds that row, then use `r$TOST$t[i]`, `r$TOST$df[i]` and `r$TOST$p.value[i]`.',
        'The sample size is `ceiling(pwr.t.test(d = 0.2, power = 0.80)$n)`, and the p formatting is the same `sub("^0", "", sprintf("%.3f", p))` trick as always.',
      ],
      solution:
        'me <- wellbeing_scored |>\n' +
        '  drop_na(wellbeing_post) |>\n' +
        '  mutate(change = wellbeing_post - wellbeing_pre) |>\n' +
        '  filter(group %in% c("Mindfulness", "Exercise")) |>\n' +
        '  mutate(group = droplevels(group))\n\n' +
        'r <- t_TOST(change ~ group, data = me, eqb = 2)\n' +
        'i <- which.max(r$TOST$p.value[2:3]) + 1\n' +
        'pf <- function(p) sub("^0", "", sprintf("%.3f", p))\n' +
        'n_next <- ceiling(pwr.t.test(d = 0.2, power = 0.80)$n)\n\n' +
        'sprintf(\n' +
        '  "The two active conditions were statistically equivalent within %d points, t(%.2f) = %.2f, p = %s, while the conventional test was non-significant, p = %s. Detecting a difference of d = %.2f would require %d participants per group.",\n' +
        '  2, r$TOST$df[i], r$TOST$t[i], pf(r$TOST$p.value[i]),\n' +
        '  pf(r$TOST$p.value[1]), 0.20, n_next\n' +
        ')',
      debrief:
        "That is the end of the course.\n\n" +
        "You started by typing `pack_kg <- 18` into a box. You have just reported an equivalence test " +
        "with a justified bound and the sample size for the study that should follow it — in real R, " +
        "running in a browser tab, on data you cleaned yourself.\n\n" +
        "Dr. Finch would like to know when you can start.",
      check: `local({
  me <- wellbeing_scored |> tidyr::drop_na(wellbeing_post) |>
    dplyr::mutate(change = wellbeing_post - wellbeing_pre) |>
    dplyr::filter(group %in% c("Mindfulness", "Exercise")) |>
    dplyr::mutate(group = droplevels(group))
  r <- TOSTER::t_TOST(change ~ group, data = me, eqb = 2)
  i <- which.max(r$TOST$p.value[2:3]) + 1
  n_next <- ceiling(pwr::pwr.t.test(d = 0.2, power = 0.80)$n)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_string(got),
    rlab_want_apa_p_format(got),
    rlab_want_match(got, "^The two active conditions were statistically equivalent within ",
      "Start the sentence exactly as the template does."),
    rlab_want_match(got, "while the conventional test was non-significant",
      "The middle should read \\"while the conventional test was non-significant\\"."),
    rlab_want_match(got, "Detecting a difference of d = ",
      "The last sentence should start \\"Detecting a difference of d = \\"."),
    rlab_want_match(got, "participants per group\\\\.$",
      "The sentence should end \\"participants per group.\\""),
    if (grepl(sprintf("= %.2f, p", r$TOST$t[5 - i]), got))
      "You used the other one-sided test. TOST is decided by whichever of the two has the *larger* p value." else character(0),
    rlab_want_nums(got,
      c(2, r$TOST$df[i], r$TOST$t[i], r$TOST$p.value[i], r$TOST$p.value[1], 0.20, n_next),
      c("equivalence bound", "degrees of freedom", "equivalence t",
        "equivalence p value", "ordinary test p value", "smallest effect of interest",
        "required n per group"))
  )
})`,
    },
  ],
};
