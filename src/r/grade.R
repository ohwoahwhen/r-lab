# ════════════════════════════════════════════════════════════════════
#  R Lab grading harness.
#
#  JS binds two globals before calling in:
#    .rlab_code     - the student's code, as text
#    .rlab_checker  - the mission's checker code, as text
#
#  rlab_eval()  runs the student's code in a fresh environment, prints
#               what the console would print, and stashes the value of
#               the last expression in .rlab_answer.
#  rlab_check() runs the checker. A checker is R code whose value is a
#               character vector of problems; length 0 means pass.
# ════════════════════════════════════════════════════════════════════

.rlab_answer <- NULL
.rlab_env <- new.env(parent = globalenv())

rlab_eval <- function(code) {
  .rlab_env <<- new.env(parent = globalenv())
  .rlab_answer <<- NULL

  exprs <- tryCatch(parse(text = code), error = function(e) e)
  if (inherits(exprs, "condition")) {
    msg <- conditionMessage(exprs)
    cat("R could not read your code:\n", msg, "\n", sep = "")
    return(c("parse", msg))
  }
  if (length(exprs) == 0) return(c("empty", "You haven't written any code yet."))

  status <- "ok"; emsg <- ""
  for (i in seq_along(exprs)) {
    res <- withCallingHandlers(
      tryCatch(withVisible(eval(exprs[[i]], envir = .rlab_env)),
               error = function(e) structure(list(msg = conditionMessage(e)),
                                             class = "rlab_err")),
      warning = function(w) {
        cat("Warning: ", conditionMessage(w), "\n", sep = "")
        invokeRestart("muffleWarning")
      },
      message = function(m) {
        cat(conditionMessage(m))
        invokeRestart("muffleMessage")
      }
    )
    if (inherits(res, "rlab_err")) {
      cat("Error: ", res$msg, "\n", sep = "")
      return(c("error", res$msg))
    }
    if (i == length(exprs)) {
      .rlab_answer <<- res$value
      if (isTRUE(res$visible)) print(res$value)
    } else if (isTRUE(res$visible)) {
      print(res$value)
    }
  }
  c(status, emsg)
}

rlab_check <- function(checker) {
  probs <- tryCatch(
    eval(parse(text = checker), envir = globalenv()),
    error = function(e) paste0("The grader tripped over itself: ",
                               conditionMessage(e),
                               ". That's a bug in R Lab, not in your code.")
  )
  probs <- as.character(probs)
  probs <- probs[!is.na(probs) & nzchar(probs)]
  if (length(probs) == 0) "PASS" else c("FAIL", probs)
}

# ── composition ──────────────────────────────────────────────────────
# Lazily evaluates each argument, returning the first that reports a
# problem. One clear message beats a wall of them.
rlab_seq <- function(...) {
  args <- as.list(substitute(list(...)))[-1]
  pf <- parent.frame()
  for (a in args) {
    v <- tryCatch(eval(a, pf), error = function(e)
      paste0("The grader could not inspect your answer (", conditionMessage(e),
             "). Check the Run output first."))
    v <- as.character(v)
    v <- v[!is.na(v) & nzchar(v)]
    if (length(v)) return(v)
  }
  character(0)
}

rlab_ok <- character(0)

# ── value / structure checks ─────────────────────────────────────────
rlab_desc <- function(x) {
  if (is.null(x)) return("nothing (NULL)")
  if (is.data.frame(x)) return(sprintf("a data frame with %d rows and %d columns",
                                       nrow(x), ncol(x)))
  if (rlab_is_gg(x)) return("a ggplot")
  if (is.function(x)) return("a function")
  if (is.list(x)) return(sprintf("a list of %d things", length(x)))
  sprintf("%s of length %d", class(x)[1], length(x))
}

rlab_want_df <- function(x, what = "your answer") {
  if (is.null(x)) return(paste0("I got nothing back. ", rlab_hint_lastline()))
  if (!is.data.frame(x))
    return(sprintf("%s should be a data frame, but it is %s.", what, rlab_desc(x)))
  character(0)
}

rlab_hint_lastline <- function() {
  "The thing you want graded has to be the *last* expression in your code — if you saved it with `<-`, add a line with just the object's name."
}

rlab_want_cols <- function(x, cols, exact = FALSE) {
  if (!is.data.frame(x)) return(character(0))
  have <- names(x)
  miss <- setdiff(cols, have)
  out <- character(0)
  if (length(miss))
    out <- c(out, sprintf("Missing column%s: %s. Your columns are: %s.",
                          if (length(miss) > 1) "s" else "",
                          paste0("`", miss, "`", collapse = ", "),
                          paste0("`", have, "`", collapse = ", ")))
  if (exact) {
    extra <- setdiff(have, cols)
    if (length(extra))
      out <- c(out, sprintf("Extra column%s I didn't ask for: %s. Keep only %s.",
                            if (length(extra) > 1) "s" else "",
                            paste0("`", extra, "`", collapse = ", "),
                            paste0("`", cols, "`", collapse = ", ")))
  }
  out
}

rlab_want_col_order <- function(x, cols) {
  if (!is.data.frame(x)) return(character(0))
  if (!identical(names(x), cols))
    return(sprintf("The columns are in the wrong order. I expected %s but got %s.",
                   paste0("`", cols, "`", collapse = ", "),
                   paste0("`", names(x), "`", collapse = ", ")))
  character(0)
}

rlab_want_rows <- function(x, n, why = NULL) {
  if (is.null(x)) return(character(0))
  got <- if (is.data.frame(x)) nrow(x) else length(x)
  if (!identical(as.integer(got), as.integer(n))) {
    msg <- sprintf("I expected %d row%s but got %d.", n,
                   if (n == 1) "" else "s", got)
    if (!is.null(why)) msg <- paste(msg, why)
    return(msg)
  }
  character(0)
}

rlab_want_len <- function(x, n, what = "your answer") {
  if (length(x) != n)
    return(sprintf("%s should have %d value%s, but it has %d.", what, n,
                   if (n == 1) "" else "s", length(x)))
  character(0)
}

rlab_want_class <- function(x, cls, what = "your answer") {
  ok <- switch(cls,
    numeric   = is.numeric(x),
    character = is.character(x),
    logical   = is.logical(x),
    factor    = is.factor(x),
    integer   = is.integer(x),
    inherits(x, cls))
  if (!ok)
    return(sprintf("%s should be %s, but it is %s.", what, cls, class(x)[1]))
  character(0)
}

rlab_near <- function(a, b, tol = 1e-6) {
  if (length(a) != length(b)) return(FALSE)
  a <- suppressWarnings(as.numeric(a)); b <- suppressWarnings(as.numeric(b))
  if (any(is.na(a) != is.na(b))) return(FALSE)
  ok <- is.na(a) | abs(a - b) <= tol * pmax(1, abs(b))
  all(ok)
}

rlab_fmt <- function(x, k = 3) {
  if (is.numeric(x)) {
    v <- trimws(ifelse(is.na(x), "NA", formatC(round(x, k), format = "fg", digits = 7)))
  } else v <- as.character(x)
  if (length(v) > 6) v <- c(v[1:6], "...")
  paste(v, collapse = ", ")
}

rlab_want_value <- function(got, expected, what = "the value", tol = 1e-6) {
  if (is.numeric(expected) || is.numeric(got)) {
    if (!rlab_near(got, expected, tol))
      return(sprintf("%s is off. I expected %s, your answer gives %s.",
                     what, rlab_fmt(expected), rlab_fmt(got)))
  } else {
    if (!identical(as.character(got), as.character(expected)))
      return(sprintf("%s is off. I expected %s, your answer gives %s.",
                     what, rlab_fmt(expected), rlab_fmt(got)))
  }
  character(0)
}

rlab_want_col_values <- function(x, col, expected, tol = 1e-6, sorted = FALSE) {
  if (!is.data.frame(x) || !col %in% names(x)) return(character(0))
  got <- x[[col]]
  if (sorted && is.numeric(got)) { got <- sort(got); expected <- sort(expected) }
  if (length(got) != length(expected))
    return(sprintf("Column `%s` has %d values, I expected %d.", col,
                   length(got), length(expected)))
  if (is.numeric(expected)) {
    if (!rlab_near(got, expected, tol))
      return(sprintf("Column `%s` has the wrong numbers. First few expected: %s. First few of yours: %s.",
                     col, rlab_fmt(utils::head(expected, 4)), rlab_fmt(utils::head(got, 4))))
  } else {
    if (!identical(as.character(got), as.character(expected)))
      return(sprintf("Column `%s` has the wrong values. Expected: %s. Yours: %s.",
                     col, rlab_fmt(utils::head(expected, 4)), rlab_fmt(utils::head(got, 4))))
  }
  character(0)
}

rlab_want_set <- function(got, expected, what = "the values") {
  g <- sort(unique(as.character(got))); e <- sort(unique(as.character(expected)))
  if (!identical(g, e)) {
    miss <- setdiff(e, g); extra <- setdiff(g, e)
    bits <- character(0)
    if (length(miss))  bits <- c(bits, paste("missing", rlab_fmt(miss)))
    if (length(extra)) bits <- c(bits, paste("unexpected", rlab_fmt(extra)))
    return(sprintf("%s aren't right: %s.", what, paste(bits, collapse = "; ")))
  }
  character(0)
}

rlab_want_no_na <- function(x, col) {
  if (!is.data.frame(x) || !col %in% names(x)) return(character(0))
  k <- sum(is.na(x[[col]]))
  if (k > 0)
    return(sprintf("Column `%s` still has %d missing value%s. Did you drop or handle the NAs?",
                   col, k, if (k == 1) "" else "s"))
  character(0)
}

rlab_want_match <- function(x, pattern, msg) {
  if (!is.character(x) || length(x) != 1)
    return("I expected a single piece of text (a character string of length 1).")
  if (!grepl(pattern, x, perl = TRUE)) return(msg)
  character(0)
}

rlab_want_obj <- function(name) {
  if (!exists(name, envir = .rlab_env, inherits = FALSE))
    return(sprintf("I couldn't find an object called `%s`. Create it with `%s <- ...`.",
                   name, name))
  character(0)
}

rlab_obj <- function(name) get(name, envir = .rlab_env, inherits = FALSE)

rlab_code_has <- function(pattern, msg) {
  if (!grepl(pattern, .rlab_code, perl = TRUE)) return(msg)
  character(0)
}

# ── ggplot introspection ─────────────────────────────────────────────
rlab_is_gg <- function(x) inherits(x, "ggplot") || inherits(x, "gg")

rlab_prop <- function(p, name) {
  v <- tryCatch(p[[name]], error = function(e) NULL)
  if (is.null(v)) v <- tryCatch(attr(p, name), error = function(e) NULL)
  v
}

rlab_want_gg <- function(x) {
  if (!rlab_is_gg(x))
    return(sprintf("Your answer should be a ggplot, but it is %s. %s",
                   rlab_desc(x), rlab_hint_lastline()))
  character(0)
}

rlab_layers <- function(p) {
  l <- rlab_prop(p, "layers")
  if (is.null(l)) l <- list()
  l
}

rlab_geoms <- function(p) {
  ls <- rlab_layers(p)
  if (!length(ls)) return(character(0))
  g <- vapply(ls, function(l) {
    cl <- tryCatch(class(l$geom)[1], error = function(e) NA_character_)
    if (is.na(cl)) cl <- tryCatch(class(l@geom)[1], error = function(e) NA_character_)
    cl
  }, character(1))
  tolower(sub("^Geom", "", g))
}

rlab_stats <- function(p) {
  ls <- rlab_layers(p)
  if (!length(ls)) return(character(0))
  tolower(sub("^Stat", "", vapply(ls, function(l)
    tryCatch(class(l$stat)[1], error = function(e) NA_character_), character(1))))
}

rlab_aes_map <- function(p, layer = NULL) {
  base <- rlab_prop(p, "mapping")
  m <- if (is.null(base)) list() else as.list(base)
  if (!is.null(layer)) {
    ls <- rlab_layers(p)
    if (length(ls) >= layer) {
      lm <- tryCatch(as.list(ls[[layer]]$mapping), error = function(e) list())
      m[names(lm)] <- lm
    }
  }
  if (!length(m)) return(character(0))
  out <- vapply(m, function(q) paste(deparse(rlang_q(q)), collapse = " "), character(1))
  names(out) <- rlab_aes_alias(names(m))
  out
}

rlang_q <- function(q) {
  r <- tryCatch(rlang::quo_get_expr(q), error = function(e) NULL)
  if (is.null(r)) r <- q
  r
}

# colour/color and other synonyms collapse to one spelling
rlab_aes_alias <- function(n) {
  n <- tolower(n)
  n[n == "color"] <- "colour"
  n[n == "col"] <- "colour"
  n
}

rlab_want_geom <- function(p, geoms) {
  if (!rlab_is_gg(p)) return(character(0))
  got <- rlab_geoms(p)
  if (!length(got))
    return("Your plot has no layers yet — add a `geom_*()` with `+`.")
  miss <- setdiff(geoms, got)
  out <- character(0)
  if (length(miss))
    out <- c(out, sprintf("I expected a %s layer. Your plot has: %s.",
                          paste0("`geom_", miss, "()`", collapse = " and a "),
                          paste0("`geom_", got, "()`", collapse = ", ")))
  out
}

rlab_want_n_layers <- function(p, n) {
  if (!rlab_is_gg(p)) return(character(0))
  got <- length(rlab_layers(p))
  if (got != n)
    return(sprintf("I expected %d layer%s but found %d (%s).", n,
                   if (n == 1) "" else "s", got,
                   paste0("geom_", rlab_geoms(p), collapse = " + ")))
  character(0)
}

rlab_want_aes <- function(p, ..., layer = NULL) {
  if (!rlab_is_gg(p)) return(character(0))
  want <- list(...)
  got <- rlab_aes_map(p, layer)
  if (!length(got) && length(want))
    return("Your plot has no aesthetic mappings — you need `aes()`.")
  out <- character(0)
  for (nm in names(want)) {
    key <- rlab_aes_alias(nm)
    expect <- want[[nm]]
    if (!key %in% names(got)) {
      out <- c(out, sprintf("Nothing is mapped to `%s`. You mapped: %s.", key,
                            paste(sprintf("%s = %s", names(got), got), collapse = ", ")))
    } else if (!got[[key]] %in% expect) {
      out <- c(out, sprintf("`%s` is mapped to `%s`, but it should be `%s`.",
                            key, got[[key]], expect[1]))
    }
  }
  out
}

rlab_want_no_aes <- function(p, keys) {
  if (!rlab_is_gg(p)) return(character(0))
  got <- names(rlab_aes_map(p, layer = 1))
  bad <- intersect(rlab_aes_alias(keys), got)
  if (length(bad))
    return(sprintf("Nothing should be mapped to `%s` here.", paste(bad, collapse = "`, `")))
  character(0)
}

rlab_labs <- function(p) {
  l <- tryCatch(ggplot2::get_labs(p), error = function(e) NULL)
  if (is.null(l)) l <- rlab_prop(p, "labels")
  if (is.null(l)) return(list())
  l <- lapply(l, function(v) if (is.null(v)) NA_character_ else
    paste(as.character(v), collapse = " "))
  names(l) <- rlab_aes_alias(names(l))
  l
}

rlab_want_labs <- function(p, ...) {
  if (!rlab_is_gg(p)) return(character(0))
  want <- list(...)
  got <- rlab_labs(p)
  out <- character(0)
  for (nm in names(want)) {
    key <- rlab_aes_alias(nm)
    g <- if (key %in% names(got)) got[[key]] else NA_character_
    expect <- want[[nm]]
    hit <- !is.na(g) && any(tolower(trimws(g)) == tolower(trimws(expect)))
    if (!hit)
      out <- c(out, sprintf("The `%s` label should be \"%s\"%s. Set it with `labs(%s = \"%s\")`.",
                            key, expect[1],
                            if (is.na(g)) " but isn't set" else sprintf(", not \"%s\"", g),
                            key, expect[1]))
  }
  out
}

rlab_facet_kind <- function(p) {
  f <- rlab_prop(p, "facet")
  if (is.null(f)) return("none")
  cl <- class(f)[1]
  if (cl == "FacetNull") "none" else tolower(sub("^Facet", "", cl))
}

rlab_facet_vars <- function(p) {
  f <- rlab_prop(p, "facet")
  if (is.null(f)) return(character(0))
  pr <- tryCatch(f$params, error = function(e) NULL)
  if (is.null(pr)) return(character(0))
  v <- c(names(pr$facets), names(pr$rows), names(pr$cols))
  unique(v[nzchar(v)])
}

rlab_want_facet <- function(p, vars, kind = NULL) {
  if (!rlab_is_gg(p)) return(character(0))
  k <- rlab_facet_kind(p)
  if (k == "none")
    return(sprintf("The plot isn't faceted. Add `facet_wrap(~%s)`.", vars[1]))
  if (!is.null(kind) && k != kind)
    return(sprintf("I expected `facet_%s()` but you used `facet_%s()`.", kind, k))
  got <- rlab_facet_vars(p)
  if (!identical(sort(got), sort(vars)))
    return(sprintf("Faceting should be by %s, but it is by %s.",
                   paste0("`", vars, "`", collapse = " and "),
                   if (length(got)) paste0("`", got, "`", collapse = " and ") else "nothing"))
  character(0)
}

rlab_built <- function(p, layer = 1) {
  b <- tryCatch(ggplot2::ggplot_build(p), error = function(e) NULL)
  if (is.null(b)) return(NULL)
  d <- tryCatch(b$data, error = function(e) NULL)
  if (is.null(d)) d <- tryCatch(b@data, error = function(e) NULL)
  if (is.null(d) || length(d) < layer) return(NULL)
  d[[layer]]
}

rlab_want_built_rows <- function(p, n, layer = 1) {
  if (!rlab_is_gg(p)) return(character(0))
  d <- rlab_built(p, layer)
  if (is.null(d)) return("I couldn't build your plot — does it draw without an error?")
  if (nrow(d) != n)
    return(sprintf("The plot draws %d marks, I expected %d. Check which rows of data you passed in.",
                   nrow(d), n))
  character(0)
}

rlab_plot_data <- function(p) {
  d <- rlab_prop(p, "data")
  if (is.null(d)) return(NULL)
  d
}

rlab_want_plot_rows <- function(p, n) {
  if (!rlab_is_gg(p)) return(character(0))
  d <- rlab_plot_data(p)
  if (!is.data.frame(d))
    return("The plot doesn't seem to have a data frame attached.")
  if (nrow(d) != n)
    return(sprintf("The data going into the plot has %d rows, I expected %d.",
                   nrow(d), n))
  character(0)
}

rlab_scale_names <- function(p) {
  s <- rlab_prop(p, "scales")
  sc <- tryCatch(s$scales, error = function(e) NULL)
  if (is.null(sc)) return(character(0))
  vapply(sc, function(one) paste(class(one)[1], collapse = ""), character(1))
}

rlab_want_theme <- function(p, fn) {
  if (!rlab_is_gg(p)) return(character(0))
  th <- rlab_prop(p, "theme")
  if (is.null(th) || !length(th))
    return(sprintf("No theme is set. Add `%s()`.", fn))
  character(0)
}

rlab_want_stat <- function(p, stats) {
  if (!rlab_is_gg(p)) return(character(0))
  got <- rlab_stats(p)
  miss <- setdiff(stats, got)
  if (length(miss))
    return(sprintf("I expected a layer computed with %s. Your layer%s use%s %s.",
                   paste0("`stat_", miss, "()`", collapse = " and "),
                   if (length(got) == 1) "" else "s", if (length(got) == 1) "s" else "",
                   paste0("`stat_", got, "()`", collapse = ", ")))
  character(0)
}

# Named-colour / manual palette check for level 6.
rlab_want_scale <- function(p, pattern, msg) {
  if (!rlab_is_gg(p)) return(character(0))
  sc <- rlab_scale_names(p)
  if (!any(grepl(pattern, sc, ignore.case = TRUE))) return(msg)
  character(0)
}

# ── level 6: scales, themes, annotations, coords ─────────────────────

rlab_scale_list <- function(p) {
  s <- rlab_prop(p, "scales")
  sc <- tryCatch(s$scales, error = function(e) NULL)
  if (is.null(sc)) list() else sc
}

rlab_scale_for <- function(p, aes) {
  for (s in rlab_scale_list(p)) {
    a <- tryCatch(s$aesthetics, error = function(e) character(0))
    if (aes %in% a) return(s)
  }
  NULL
}

rlab_scale_call <- function(s) {
  txt <- tryCatch(paste(deparse(s$call), collapse = " "), error = function(e) "")
  if (is.null(txt) || !nzchar(txt)) "a scale" else txt
}

rlab_scale_trans <- function(s) {
  n <- tryCatch(s$trans$name, error = function(e) NULL)
  if (is.null(n)) n <- tryCatch(s$transform$name, error = function(e) NULL)
  if (is.null(n)) "identity" else n
}

rlab_want_scale_for <- function(p, aes, what) {
  if (!rlab_is_gg(p)) return(character(0))
  if (is.null(rlab_scale_for(p, aes)))
    return(sprintf("Nothing sets the `%s` scale. %s", aes, what))
  character(0)
}

rlab_want_trans <- function(p, aes, trans) {
  if (!rlab_is_gg(p)) return(character(0))
  s <- rlab_scale_for(p, aes)
  if (is.null(s))
    return(sprintf("The `%s` axis is still on its default scale — it needs a `scale_%s_%s()`.",
                   aes, aes, if (trans == "log-10") "log10" else "continuous"))
  got <- rlab_scale_trans(s)
  if (!identical(got, trans))
    return(sprintf("The `%s` axis uses the \"%s\" transform, I expected \"%s\". You wrote `%s`.",
                   aes, got, trans, rlab_scale_call(s)))
  character(0)
}

rlab_want_limits <- function(p, aes, limits) {
  if (!rlab_is_gg(p)) return(character(0))
  s <- rlab_scale_for(p, aes)
  if (is.null(s))
    return(sprintf("Nothing limits the `%s` axis. Set it with `scale_%s_continuous(limits = c(%s))`.",
                   aes, aes, paste(limits, collapse = ", ")))
  got <- tryCatch(s$limits, error = function(e) NULL)
  if (is.null(got) || !rlab_near(got, limits, 1e-9))
    return(sprintf("The `%s` limits are %s, I expected %s.", aes,
                   if (is.null(got)) "not set" else paste0("c(", rlab_fmt(got), ")"),
                   paste0("c(", paste(limits, collapse = ", "), ")")))
  character(0)
}

rlab_want_breaks <- function(p, aes, breaks) {
  if (!rlab_is_gg(p)) return(character(0))
  s <- rlab_scale_for(p, aes)
  got <- tryCatch(s$breaks, error = function(e) NULL)
  if (is.null(s) || is.null(got) || is.function(got))
    return(sprintf("The `%s` axis is still choosing its own breaks. Set `breaks = c(%s)`.",
                   aes, paste(breaks, collapse = ", ")))
  if (!rlab_near(sort(got), sort(breaks), 1e-9))
    return(sprintf("The `%s` breaks are %s, I expected %s.", aes, rlab_fmt(got), rlab_fmt(breaks)))
  character(0)
}

# `values` must be named by level, e.g. c("CS+" = "#ef4444", "CS-" = "#94a3b8").
# The scale is cloned and trained on those levels, so the student may supply
# their colours named or positional, in any order, and still be graded on the
# mapping that actually ends up on the plot.
rlab_want_manual_colours <- function(p, aes, values) {
  if (!rlab_is_gg(p)) return(character(0))
  s <- rlab_scale_for(p, aes)
  if (is.null(s))
    return(sprintf("Nothing sets the `%s` scale \u2014 add `scale_%s_manual(values = ...)`.", aes, aes))
  lv <- names(values)
  got <- tryCatch({
    s2 <- s$clone()
    s2$train(factor(lv, levels = lv))
    s2$map(lv)
  }, error = function(e) NULL)
  if (is.null(got))
    return(sprintf("The `%s` scale isn't a manual one. You wrote `%s`.", aes, rlab_scale_call(s)))
  norm <- function(x) tolower(gsub("[[:space:]]", "", as.character(x)))
  bad <- which(norm(got) != norm(unname(values)))
  if (length(bad))
    return(sprintf("%s is drawn in %s, it should be %s.",
                   paste0("`", lv[bad[1]], "`"),
                   if (is.na(got[bad[1]])) "the default colour" else paste0("\"", got[bad[1]], "\""),
                   paste0("\"", unname(values)[bad[1]], "\"")))
  character(0)
}

rlab_theme <- function(p) rlab_prop(p, "theme")

rlab_want_theme_fn <- function(p, fn) {
  if (!rlab_is_gg(p)) return(character(0))
  th <- rlab_theme(p)
  if (is.null(th) || !length(th))
    return(sprintf("No theme is set — add `%s()`.", fn))
  if (!isTRUE(attr(th, "complete")))
    return(sprintf("You have tweaked the theme with `theme(...)`, but not replaced it. Add `%s()` as well.", fn))
  ref <- tryCatch(do.call(fn, list()), error = function(e) NULL)
  if (is.null(ref)) return(character(0))
  keys <- c("panel.border", "panel.background", "panel.grid.major",
            "panel.grid.minor", "axis.line", "legend.key", "strip.background")
  same <- vapply(keys, function(k)
    identical(class(th[[k]])[1], class(ref[[k]])[1]), logical(1))
  if (!all(same))
    return(sprintf("A complete theme is set, but it isn't `%s()`.", fn))
  character(0)
}

rlab_want_theme_arg <- function(p, arg, value) {
  if (!rlab_is_gg(p)) return(character(0))
  th <- rlab_theme(p)
  got <- tryCatch(th[[arg]], error = function(e) NULL)
  if (is.null(got))
    return(sprintf("`%s` isn't set. Add `theme(%s = \"%s\")`.", arg, arg, value))
  if (!identical(as.character(got)[1], as.character(value)[1]))
    return(sprintf("`%s` is \"%s\", I expected \"%s\".", arg, paste(as.character(got), collapse = " "), value))
  character(0)
}

rlab_layer_param <- function(p, layer, param) {
  ls <- rlab_layers(p)
  if (length(ls) < layer) return(NULL)
  v <- tryCatch(ls[[layer]]$aes_params[[param]], error = function(e) NULL)
  v
}

rlab_geom_index <- function(p, geom) {
  g <- rlab_geoms(p)
  w <- which(g == geom)
  if (!length(w)) NA_integer_ else w[1]
}

rlab_want_hline <- function(p, yintercept, linetype = NULL) {
  if (!rlab_is_gg(p)) return(character(0))
  i <- rlab_geom_index(p, "hline")
  if (is.na(i))
    return(sprintf("There is no reference line. Add `geom_hline(yintercept = %s)`.", yintercept))
  got <- tryCatch(rlab_layers(p)[[i]]$data$yintercept, error = function(e) NULL)
  if (is.null(got) || !rlab_near(got[1], yintercept, 1e-9))
    return(sprintf("The reference line is at %s, it should be at %s.",
                   if (is.null(got)) "an unknown height" else rlab_fmt(got[1]), yintercept))
  if (!is.null(linetype)) {
    lt <- rlab_layer_param(p, i, "linetype")
    if (is.null(lt) || !identical(as.character(lt)[1], linetype))
      return(sprintf("The reference line is %s, it should be `linetype = \"%s\"`.",
                     if (is.null(lt)) "solid" else paste0("\"", lt, "\""), linetype))
  }
  character(0)
}

rlab_want_annotation <- function(p, label) {
  if (!rlab_is_gg(p)) return(character(0))
  i <- rlab_geom_index(p, "text")
  if (is.na(i))
    return(sprintf("There is no text on the plot. Add `annotate(\"text\", x = ..., y = ..., label = \"%s\")`.", label))
  got <- rlab_layer_param(p, i, "label")
  if (is.null(got)) {
    got <- tryCatch(rlab_layers(p)[[i]]$data$label, error = function(e) NULL)
  }
  if (is.null(got) || !any(tolower(trimws(as.character(got))) == tolower(trimws(label))))
    return(sprintf("The annotation says %s, it should say \"%s\".",
                   if (is.null(got)) "nothing I can read" else paste0("\"", got[1], "\""), label))
  character(0)
}

rlab_want_coord <- function(p, cls) {
  if (!rlab_is_gg(p)) return(character(0))
  got <- class(rlab_prop(p, "coordinates"))[1]
  if (!identical(got, cls))
    return(sprintf("The coordinate system is `%s`, I expected `%s`.", got, cls))
  character(0)
}

# ── levels 7-8: statistics objects and APA strings ───────────────────

# Every number in a string, including APA p values written as ".019".
rlab_nums <- function(x) {
  m <- regmatches(x, gregexpr("-?[0-9]*\\.?[0-9]+(e[-+]?[0-9]+)?", x, perl = TRUE))[[1]]
  suppressWarnings(as.numeric(m))
}

rlab_want_htest <- function(x, what = "a hypothesis test") {
  if (!inherits(x, "htest"))
    return(sprintf("Your answer should be %s, but it is %s. %s",
                   what, rlab_desc(x), rlab_hint_lastline()))
  character(0)
}

rlab_want_method <- function(x, pattern, msg) {
  m <- tryCatch(x$method, error = function(e) "")
  if (!length(m) || !grepl(pattern, m, ignore.case = TRUE)) return(msg)
  character(0)
}

rlab_want_field <- function(x, field, expected, label, tol = 1e-3) {
  got <- tryCatch(x[[field]], error = function(e) NULL)
  if (is.null(got))
    return(sprintf("I couldn't find %s in your answer.", label))
  rlab_want_value(unname(got)[1], unname(expected)[1], label, tol = tol)
}

# APA: three decimals, no leading zero, and "< .001" when it is tiny.
rlab_apa_p <- function(p) {
  if (p < .001) "< .001" else sub("^0", "", sprintf("%.3f", p))
}

rlab_want_apa_p_format <- function(s) {
  if (grepl("p\\s*[=<]\\s*0\\.", s))
    return("APA drops the leading zero on a p value, because p can never be bigger than 1. Write `p = .019`, not `p = 0.019`.")
  if (grepl("p\\s*=\\s*0*\\.000", s))
    return("A p value that rounds to .000 is reported as `p < .001`, never `p = .000`.")
  character(0)
}

rlab_want_string <- function(x) {
  if (!is.character(x) || length(x) != 1)
    return(sprintf("Your answer should be a single piece of text, but it is %s. %s",
                   rlab_desc(x), rlab_hint_lastline()))
  if (!nzchar(trimws(x))) return("Your answer is an empty string.")
  character(0)
}

# Compares the numbers in a sentence, in order, to the numbers that are true.
rlab_want_nums <- function(s, expected, labels, tol = 0.006) {
  got <- rlab_nums(s)
  if (length(got) != length(expected))
    return(sprintf("I found %d number%s in your sentence but expected %d (%s). Check the template.",
                   length(got), if (length(got) == 1) "" else "s", length(expected),
                   paste(labels, collapse = ", ")))
  bad <- which(!vapply(seq_along(got), function(i)
    rlab_near(got[i], expected[i], 0) || abs(got[i] - expected[i]) <= tol, logical(1)))
  if (length(bad))
    return(sprintf("The %s is %s in your sentence, it should be %s.",
                   labels[bad[1]], rlab_fmt(got[bad[1]]), rlab_fmt(expected[bad[1]])))
  character(0)
}

rlab_anova_row <- function(x, term) {
  tab <- NULL
  if (inherits(x, "afex_aov")) tab <- as.data.frame(x$anova_table)
  else if (inherits(x, "summary.aov") || is.list(x) && inherits(x[[1]], "anova"))
    tab <- as.data.frame(x[[1]])
  else if (inherits(x, "aov")) tab <- as.data.frame(summary(x)[[1]])
  else if (inherits(x, "anova") || is.data.frame(x)) tab <- as.data.frame(x)
  if (is.null(tab)) return(NULL)
  rn <- trimws(rownames(tab))
  i <- which(rn == term)
  if (!length(i)) return(NULL)
  tab[i[1], , drop = FALSE]
}

rlab_anova_col <- function(row, which) {
  if (is.null(row)) return(NULL)
  nm <- colnames(row)
  hit <- switch(which,
    F = nm[grepl("^F( value)?$", nm)],
    p = nm[grepl("^(Pr\\(>F\\)|p\\.value|p)$", nm)],
    df = nm[grepl("^(num Df|Df)$", nm)],
    character(0))
  if (!length(hit)) return(NULL)
  unname(row[[hit[1]]])
}
