# ════════════════════════════════════════════════════════════════════
#  R Lab datasets — simulated, seeded, and deliberately messy.
#  Every dataset is rebuilt from scratch by rlab_build_data() so a
#  mission can always reset to a clean-messy starting point.
# ════════════════════════════════════════════════════════════════════

rlab_pick <- function(x, n, prob = NULL) sample(x, n, replace = TRUE, prob = prob)

rlab_sprinkle_na <- function(x, p, seed_bump = 0) {
  n <- length(x)
  k <- max(1L, round(n * p))
  idx <- sample.int(n, k)
  x[idx] <- NA
  x
}

# ── 1. wellbeing: questionnaire, wide, reverse-scored items ──────────
rlab_make_wellbeing <- function() {
  set.seed(1711)
  n <- 180
  id <- sprintf("P%03d", 1:n)
  grp_true <- rep(c("Control", "Mindfulness", "Exercise"), length.out = n)
  grp_true <- sample(grp_true)
  # typo-ify the group labels the way real RA data entry does
  messify <- function(g) {
    vapply(g, function(one) {
      variants <- switch(one,
        "Control"     = c("Control", "control", "Control ", "Cntrol", "CONTROL"),
        "Mindfulness" = c("Mindfulness", "mindfulness", "Mindfullness", " Mindfulness"),
        "Exercise"    = c("Exercise", "exercise", "Excercise", "Exercise "))
      sample(variants, 1, prob = c(0.72, rep(0.28 / (length(variants) - 1), length(variants) - 1)))
    }, character(1), USE.NAMES = FALSE)
  }
  group <- messify(grp_true)

  trait <- rnorm(n, 0, 1) + ifelse(grp_true == "Control", 0, 0.35)
  # 10 self-esteem items, 1-5; items 2,5,6,8,9 are negatively worded
  rev_items <- c(2, 5, 6, 8, 9)
  items <- matrix(NA_integer_, n, 10)
  for (j in 1:10) {
    base <- 3 + trait * 0.65 + rnorm(n, 0, 0.75)
    if (j %in% rev_items) base <- 6 - base
    items[, j] <- pmin(5L, pmax(1L, as.integer(round(base))))
  }
  colnames(items) <- sprintf("ses%d", 1:10)

  age_num <- round(rnorm(n, 24.5, 5.4))
  age_num[age_num < 17] <- 17
  age <- as.character(age_num)
  sloppy <- sample.int(n, 14)
  age[sloppy] <- paste(age_num[sloppy], "years")
  age[sample.int(n, 6)] <- NA

  pre  <- round(50 + trait * 7 + rnorm(n, 0, 6), 1)
  post <- round(pre + ifelse(grp_true == "Control", 0.4, 4.6) + rnorm(n, 0, 4.5), 1)
  post[sample.int(n, 11)] <- NA   # post-test drop-out

  d <- data.frame(
    id = id, group = group, age = age,
    gender = rlab_pick(c("female", "male", "non-binary", "Female", "Male"), n,
                       prob = c(.44, .38, .04, .08, .06)),
    items,
    wellbeing_pre = pre, wellbeing_post = post,
    stringsAsFactors = FALSE
  )
  # a handful of missing item responses
  for (j in sprintf("ses%d", 1:10)) {
    if (runif(1) < 0.7) d[sample.int(n, sample(1:4, 1)), j] <- NA
  }
  d
}

# ── 2. rt_task: reaction-time experiment, long ───────────────────────
rlab_make_rt <- function() {
  set.seed(2608)
  pids <- sprintf("s%02d", 1:40)
  conds <- c("congruent", "incongruent")
  grid <- expand.grid(pid = pids, condition = conds, block = 1:3,
                      trial = 1:30, stringsAsFactors = FALSE)
  grid <- grid[order(grid$pid, grid$block, grid$trial), ]
  n <- nrow(grid)
  # Each person has their own overall speed AND their own susceptibility to
  # interference. Both are real, and together they are what a mixed model with
  # random intercepts and random slopes is for.
  pskill <- setNames(rnorm(40, 0, 45), pids)
  peffect <- setNames(rnorm(40, 0, 24), pids)
  base <- 470 + pskill[grid$pid] +
    ifelse(grid$condition == "incongruent", 58 + peffect[grid$pid], 0) -
    (grid$block - 1) * 11
  rt <- round(base + rgamma(n, 2, 0.02) - 60)
  rt[rt < 180] <- round(runif(sum(rt < 180), 190, 260))
  # anticipations and lapses, the real reason you learn to filter
  anti <- sample.int(n, 46);  rt[anti]  <- round(runif(length(anti), 80, 149))
  laps <- sample.int(n, 58);  rt[laps]  <- round(runif(length(laps), 2100, 5400))

  # Accuracy varies by person too, on the log-odds scale, so a binary mixed
  # model has a random intercept worth estimating rather than a singular fit.
  pacc <- setNames(rnorm(40, 0, 0.55), pids)
  p_correct <- plogis(
    qlogis(ifelse(grid$condition == "incongruent", 0.91, 0.97)) + pacc[grid$pid]
  )
  correct <- rbinom(n, 1, p_correct)
  correct[sample.int(n, 90)] <- NA

  # condition label case drift between testing sessions
  cond <- grid$condition
  flip <- sample.int(n, round(n * 0.08))
  cond[flip] <- toupper(substring(cond[flip], 1, 1)) |>
    paste0(substring(cond[flip], 2))

  data.frame(
    pid = grid$pid, condition = cond, block = grid$block, trial = grid$trial,
    rt = rt, correct = correct, stringsAsFactors = FALSE
  )
}

# ── 3. pavlov: conditioning study, wide blocks ───────────────────────
rlab_make_pavlov <- function() {
  set.seed(915)
  n <- 48
  subject <- sprintf("R%02d", 1:n)
  drug <- rep(c("saline", "amphetamine"), each = n / 2)
  sex  <- rep(c("M", "F"), times = n / 2)
  learner <- rnorm(n, 0, 0.06)
  out <- data.frame(subject = subject, drug = drug, sex = sex,
                    stringsAsFactors = FALSE)
  for (b in 1:8) {
    # suppression ratio: 0.5 = no learning, towards 0 = conditioned suppression
    plus <- 0.5 - (b - 1) * ifelse(drug == "saline", 0.045, 0.028) + learner + rnorm(n, 0, 0.05)
    minus <- 0.5 - (b - 1) * 0.004 + rnorm(n, 0, 0.05)
    out[[sprintf("csplus_b%d", b)]]  <- round(pmin(1, pmax(0, plus)), 3)
    out[[sprintf("csminus_b%d", b)]] <- round(pmin(1, pmax(0, minus)), 3)
  }
  # two animals dropped out after block 5
  dropped <- c(7, 31)
  for (b in 6:8) {
    out[dropped, sprintf("csplus_b%d", b)]  <- NA
    out[dropped, sprintf("csminus_b%d", b)] <- NA
  }
  out
}

# ── 4. hikes: weighted hiking log ────────────────────────────────────
rlab_make_hikes <- function() {
  set.seed(4412)
  n <- 120
  trails_clean <- c("Mount Solitary", "Kedumba Valley", "Govetts Leap",
                    "Bouddi Coastal", "Barrenjoey Head", "Mount Banks",
                    "Grand Canyon Track", "Berowra Waters")
  trail <- rlab_pick(trails_clean, n)
  mess <- sample.int(n, 34)
  trail[mess] <- vapply(trail[mess], function(t) {
    sample(c(paste0(t, " "), paste0(" ", t), tolower(t), toupper(t),
             sub("ou", "u", t), sub("a", "aa", t)), 1)
  }, character(1), USE.NAMES = FALSE)

  dates <- sort(as.Date("2025-01-04") + sample(0:320, n, replace = FALSE))
  distance_km <- round(runif(n, 5, 23), 1)
  elev_m <- round(distance_km * runif(n, 25, 95))
  pack_kg <- round(rlab_pick(c(0, 6, 10, 14, 18, 22), n, prob = c(.1, .2, .25, .2, .15, .1)) +
                     rnorm(n, 0, 1.2), 1)
  pack_kg[pack_kg < 0] <- 0
  pack_kg[sample.int(n, 9)] <- NA      # forgot to write it down
  mins <- round(distance_km * (9.5 + ifelse(is.na(pack_kg), 0, pack_kg) * 0.33) +
                  elev_m * 0.045 + rnorm(n, 0, 12))
  duration <- sprintf("%dh %02dm", mins %/% 60, mins %% 60)
  avg_hr <- round(rnorm(n, 141, 12))
  avg_hr[sample.int(n, 7)] <- NA

  data.frame(date = as.character(dates), trail = trail,
             distance_km = distance_km, elev_m = elev_m, pack_kg = pack_kg,
             duration = duration, avg_hr = avg_hr, stringsAsFactors = FALSE)
}

# ── 5. fitness: test battery, wide, with "DNF" ───────────────────────
rlab_make_fitness <- function() {
  set.seed(777)
  n <- 24
  test_date <- as.character(seq(as.Date("2024-08-05"), by = "3 weeks", length.out = n))
  trend <- seq(0, 1, length.out = n)
  pushups   <- round(28 + trend * 19 + rnorm(n, 0, 2.6))
  plank_sec <- round(78 + trend * 86 + rnorm(n, 0, 9))
  grip_kg   <- round(44 + trend * 7 + rnorm(n, 0, 1.8), 1)
  vo2max    <- round(44 + trend * 8 + rnorm(n, 0, 1.3), 1)
  run_2km   <- as.character(round(9.4 - trend * 1.3 + rnorm(n, 0, 0.22), 2))
  run_2km[c(5, 17)] <- "DNF"          # rolled an ankle
  vo2max[c(9, 20)] <- NA
  data.frame(test_date = test_date, pushups = pushups, plank_sec = plank_sec,
             run_2km_min = run_2km, grip_kg = grip_kg, vo2max = vo2max,
             stringsAsFactors = FALSE)
}

# ── 6. sydney_property: sales records ────────────────────────────────
rlab_make_property <- function() {
  set.seed(2065)
  n <- 400
  subs <- c("Marrickville", "Newtown", "Randwick", "Chatswood", "Parramatta",
            "Manly", "Bondi", "Penrith", "Hurstville", "Ryde")
  base_price <- c(1.62, 1.78, 2.35, 2.05, 1.12, 3.1, 2.85, 0.92, 1.35, 1.72)
  names(base_price) <- subs
  suburb_true <- rlab_pick(subs, n)
  suburb <- suburb_true
  mess <- sample.int(n, 70)
  suburb[mess] <- vapply(suburb[mess], function(s) {
    sample(c(toupper(s), tolower(s), paste0(s, " "), paste0(s, " NSW"),
             sub("ck", "k", s)), 1)
  }, character(1), USE.NAMES = FALSE)

  type <- rlab_pick(c("House", "Unit", "Townhouse", "house", "unit"), n,
                    prob = c(.42, .34, .1, .08, .06))
  type_true <- tolower(type)
  beds <- ifelse(type_true == "unit", rlab_pick(1:3, n), rlab_pick(2:5, n))
  baths <- pmax(1, beds - rlab_pick(0:1, n))
  parking <- rlab_pick(0:2, n)
  parking[sample.int(n, 38)] <- NA

  mult <- ifelse(type_true == "unit", 0.62, ifelse(type_true == "townhouse", 0.82, 1))
  raw <- base_price[suburb_true] * mult * (0.78 + beds * 0.09) * rlnorm(n, 0, 0.13)
  price_num <- round(raw * 1e6, -3)
  price <- paste0("$", formatC(price_num, format = "d", big.mark = ","))
  sold_date <- as.character(as.Date("2024-06-01") + sample(0:520, n, replace = TRUE))

  data.frame(suburb = suburb, type = type, beds = beds, baths = baths,
             parking = parking, price = price, sold_date = sold_date,
             stringsAsFactors = FALSE)
}

# ── 7. yt: channel analytics export ──────────────────────────────────
rlab_make_yt <- function() {
  set.seed(31337)
  n <- 150
  w1 <- c("How I", "Why You Should", "The Truth About", "I Tried", "Rating",
          "Everything Wrong With", "Testing", "My Honest Take On")
  w2 <- c("Rucking 20kg", "Sydney Rent", "R for Psychology", "Cold Plunges",
          "Honours Thesis Season", "Blue Mountains Day Hikes", "VO2 Max Testing",
          "Statistics Anxiety", "Protein Maths", "Sleep Tracking")
  title <- paste(rlab_pick(w1, n), rlab_pick(w2, n))
  cats_clean <- c("Fitness", "Psychology", "Hiking", "Tech")
  category <- rlab_pick(cats_clean, n, prob = c(.34, .3, .2, .16))
  mess <- sample.int(n, 32)
  category[mess] <- vapply(category[mess], function(c) {
    sample(switch(c,
      "Fitness"    = c("fitness", "Fitnes", "FITNESS"),
      "Psychology" = c("psychology", "Psycology", "Psych"),
      "Hiking"     = c("hiking", "Hikeing"),
      "Tech"       = c("tech", "Techology")), 1)
  }, character(1), USE.NAMES = FALSE)

  published <- as.character(sort(as.Date("2023-02-11") + sample(0:1000, n)))
  secs <- round(rlnorm(n, log(430), 0.65))
  duration <- sprintf("PT%dM%02dS", secs %/% 60, secs %% 60)
  v <- round(rlnorm(n, log(5200), 1.25) * ifelse(category %in% c("Fitness", "fitness"), 1.6, 1))
  views <- vapply(v, function(x) {
    if (x >= 1e6) paste0(round(x / 1e6, 1), "M")
    else if (x >= 1000) paste0(round(x / 1000, 1), "K")
    else as.character(x)
  }, character(1))
  likes <- round(v * runif(n, 0.02, 0.08))
  comments <- round(likes * runif(n, 0.03, 0.15))
  comments[sample.int(n, 12)] <- NA

  data.frame(video_id = sprintf("vid_%03d", 1:n), title = title,
             category = category, published = published, duration = duration,
             views = views, likes = likes, comments = comments,
             stringsAsFactors = FALSE)
}


# ── 8. trail_info: a small lookup table to join against ──────────────
rlab_make_trail_info <- function() {
  data.frame(
    trail = c("Mount Solitary", "Kedumba Valley", "Govetts Leap",
              "Bouddi Coastal", "Barrenjoey Head", "Mount Banks",
              "Grand Canyon Track", "Berowra Waters"),
    region = c("Blue Mountains", "Blue Mountains", "Blue Mountains",
               "Central Coast", "Northern Beaches", "Blue Mountains",
               "Blue Mountains", "Hornsby"),
    grade = c(5L, 4L, 3L, 3L, 2L, 4L, 4L, 3L),
    stringsAsFactors = FALSE
  )
}


# ── derived: the tidy versions the level 1-5 bosses build ────────────
# Levels 6-8 are about plotting and statistics, not re-doing the cleaning,
# so these are handed over ready-made. Each one is exactly what the matching
# boss mission produces.

rlab_make_derived <- function(env) {
  g <- function(n) get(n, envir = env)

  hikes_clean <- g("hikes") |>
    dplyr::mutate(trail = stringr::str_to_title(stringr::str_trim(trail))) |>
    dplyr::left_join(g("trail_info"), by = "trail") |>
    dplyr::filter(!is.na(region)) |>
    tidyr::separate_wider_regex(duration,
      patterns = c(hours = "\\d+", "h ", mins = "\\d+", "m")) |>
    dplyr::mutate(
      total_min = as.numeric(hours) * 60 + as.numeric(mins),
      pace_min_km = round(total_min / distance_km, 2)
    ) |>
    dplyr::select(date, trail, region, grade, distance_km, elev_m, pack_kg,
                  total_min, pace_min_km, avg_hr)

  pavlov_long <- g("pavlov") |>
    tidyr::pivot_longer(dplyr::starts_with("cs"),
      names_to = c("cue", "block"), names_pattern = "cs(plus|minus)_b(\\d+)",
      values_to = "ratio") |>
    dplyr::mutate(
      cue = factor(ifelse(cue == "plus", "CS+", "CS-"), levels = c("CS+", "CS-")),
      block = as.integer(block),
      drug = factor(drug, levels = c("saline", "amphetamine"))
    ) |>
    tidyr::drop_na(ratio)

  rt_clean <- g("rt_task") |>
    dplyr::mutate(condition = tolower(condition)) |>
    dplyr::filter(rt > 150, rt < 2000, !is.na(correct), correct == 1)

  # Same cleaning, but errors kept: the outcome for level 12 is whether the
  # response was correct, so filtering to correct trials would delete it.
  rt_acc <- g("rt_task") |>
    dplyr::mutate(condition = tolower(condition)) |>
    dplyr::filter(rt > 150, rt < 2000, !is.na(correct))

  wellbeing_scored <- g("wellbeing") |>
    dplyr::mutate(
      .g = stringr::str_to_lower(stringr::str_trim(group)),
      group = dplyr::case_when(
        stringr::str_detect(.g, "^c") ~ "Control",
        stringr::str_detect(.g, "^m") ~ "Mindfulness",
        .default = "Exercise")
    ) |>
    dplyr::select(-.g) |>
    tidyr::drop_na(dplyr::starts_with("ses")) |>
    dplyr::mutate(dplyr::across(c(ses2, ses5, ses6, ses8, ses9), ~ 6 - .x)) |>
    dplyr::mutate(ses_total = rowSums(dplyr::across(dplyr::starts_with("ses")))) |>
    dplyr::mutate(group = factor(group, levels = c("Control", "Mindfulness", "Exercise")))

  assign("hikes_clean", hikes_clean, envir = env)
  assign("pavlov_long", pavlov_long, envir = env)
  assign("rt_clean", rt_clean, envir = env)
  assign("rt_acc", rt_acc, envir = env)
  assign("wellbeing_scored", wellbeing_scored, envir = env)
}


# ── files on disk: level 14 works with the virtual filesystem ────────
# webR gives R a real (virtual) filesystem, so these behave exactly like
# files on a laptop: list.files() finds them, read_csv() reads them, and
# they are as awkward as the exports instruments actually produce.

rlab_make_files <- function(env) {
  dir.create("/home/web_user/lab", showWarnings = FALSE, recursive = TRUE)
  fit <- as.data.frame(get("fitness", envir = env))
  yr <- substr(fit$test_date, 1, 4)
  readr::write_csv(fit[yr == "2024", ], "/home/web_user/lab/fitness_2024.csv")
  readr::write_csv(fit[yr == "2025", ], "/home/web_user/lab/fitness_2025.csv")

  # An export with a preamble, the way a lot of instrument software writes.
  hk <- as.data.frame(get("hikes", envir = env))
  tmp <- tempfile(fileext = ".csv")
  readr::write_csv(hk, tmp)
  writeLines(
    c("# TrailLog export v2.1",
      "# generated 2025-11-20 - do not edit by hand",
      readLines(tmp)),
    "/home/web_user/lab/hikes_export.csv"
  )
  unlink(tmp)

  writeLines(
    c("Lab notebook", "", "Raw exports live in this folder.",
      "Never edit them by hand - clean them in code so the cleaning is repeatable."),
    "/home/web_user/lab/README.txt"
  )
  invisible(TRUE)
}

# ── builder ──────────────────────────────────────────────────────────
rlab_build_data <- function(env = globalenv()) {
  mk <- list(
    wellbeing       = rlab_make_wellbeing,
    rt_task         = rlab_make_rt,
    pavlov          = rlab_make_pavlov,
    hikes           = rlab_make_hikes,
    fitness         = rlab_make_fitness,
    sydney_property = rlab_make_property,
    yt              = rlab_make_yt,
    trail_info      = rlab_make_trail_info
  )
  for (nm in names(mk)) {
    d <- mk[[nm]]()
    if (requireNamespace("tibble", quietly = TRUE)) d <- tibble::as_tibble(d)
    assign(nm, d, envir = env)
  }
  rlab_make_derived(env)
  rlab_make_files(env)
  invisible(names(mk))
}

rlab_datasets <- c("wellbeing", "rt_task", "pavlov", "hikes", "fitness",
                   "sydney_property", "yt", "trail_info",
                   "hikes_clean", "pavlov_long", "rt_clean", "rt_acc",
                   "wellbeing_scored")

# A compact peek used by the mission brief panel.
rlab_peek <- function(name, n = 6) {
  d <- get(name, envir = globalenv())
  out <- utils::capture.output(print(utils::head(as.data.frame(d), n)))
  paste(out, collapse = "\n")
}

rlab_shape <- function(name) {
  d <- get(name, envir = globalenv())
  paste0(nrow(d), " rows x ", ncol(d), " cols")
}
