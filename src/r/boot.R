# ════════════════════════════════════════════════════════════════════
#  R Lab boot: console options, package loading, tidy error text.
# ════════════════════════════════════════════════════════════════════

options(
  width = 76,                 # keeps console output inside the pane
  digits = 7,
  warn = 1,
  cli.num_colors = 1,         # no ANSI escapes in the output pane
  lmerTest.limit = 10000,     # let Satterthwaite df be computed on trial-level data
  cli.unicode = FALSE,
  crayon.enabled = FALSE,
  pillar.bold = FALSE,
  pillar.subtle = FALSE,
  pillar.neg = FALSE,
  tibble.print_min = 10,
  tibble.print_max = 12,
  dplyr.summarise.inform = FALSE,
  useFancyQuotes = FALSE,
  OutDec = "."
)
Sys.setenv(NO_COLOR = "1", TESTTHAT = "false", LANG = "en_US.UTF-8")

rlab_load <- function(pkgs) {
  bad <- character(0)
  for (p in pkgs) {
    ok <- suppressWarnings(suppressMessages(
      requireNamespace(p, quietly = TRUE)))
    if (ok) {
      suppressWarnings(suppressMessages(
        library(p, character.only = TRUE, warn.conflicts = FALSE, quietly = TRUE)))
    } else bad <- c(bad, p)
  }
  if (length(bad)) bad else "OK"
}

rlab_version_report <- function() {
  pkgs <- c("dplyr", "tidyr", "ggplot2", "readr", "stringr", "forcats", "purrr", "tibble")
  have <- vapply(pkgs, function(p)
    tryCatch(as.character(utils::packageVersion(p)), error = function(e) "-"),
    character(1))
  paste0(pkgs, " ", have, collapse = " | ")
}

# A quick self-test the loading screen runs before handing over.
rlab_selftest <- function() {
  out <- character(0)
  t1 <- tryCatch({
    d <- dplyr::filter(hikes, distance_km > 10)
    d <- dplyr::summarise(dplyr::group_by(d, trail), n = dplyr::n())
    if (nrow(d) > 0) "dplyr ok" else "dplyr returned nothing"
  }, error = function(e) paste("dplyr failed:", conditionMessage(e)))
  t2 <- tryCatch({
    p <- ggplot2::ggplot(hikes, ggplot2::aes(distance_km, elev_m)) +
      ggplot2::geom_point()
    b <- ggplot2::ggplot_build(p)
    nr <- nrow(rlab_built(p))
    if (!is.null(nr) && nr > 0) "ggplot ok" else "ggplot built nothing"
  }, error = function(e) paste("ggplot failed:", conditionMessage(e)))
  t3 <- tryCatch({
    long <- tidyr::pivot_longer(pavlov, cols = dplyr::starts_with("cs"),
                               names_to = "k", values_to = "v")
    if (nrow(long) > 0) "tidyr ok" else "tidyr returned nothing"
  }, error = function(e) paste("tidyr failed:", conditionMessage(e)))
  c(t1, t2, t3)
}
