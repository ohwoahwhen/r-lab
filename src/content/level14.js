export default {
  id: 'l14',
  n: 14,
  title: 'Your Own Data',
  blurb: 'Files, paths, your own functions, many files at once, and reading an error.',
  story:
    "Dr. Finch slides a USB stick across the desk, which is somehow the most 1990s thing that has " +
    "happened all year. \"Everything so far, I handed you a data frame that already existed. " +
    "Nobody will ever do that again.\"\n\n" +
    "\"There is a folder called `lab/` in your R session. Three exports and a readme, exactly as the " +
    "instruments wrote them. Get them into R, get them clean, and get them back out. That is the " +
    "job — the statistics were the easy part.\"",
  missions: [
    {
      id: 'l14m1',
      title: 'What is even in here',
      xp: 55,
      teach:
        "R has a working directory — the folder it treats as \"here\" — which `getwd()` reports. " +
        "`list.files(\"lab\")` lists a folder relative to it, and `pattern` filters by a regular " +
        "expression so you can ask for only the CSVs.",
      theory:
        "A path is either **absolute** (`/home/web_user/lab/x.csv`, starting from the root) or " +
        "**relative** (`lab/x.csv`, starting from wherever R currently is). Relative paths are what " +
        "you want in a script, because absolute ones only work on the machine that wrote them. " +
        "`\"C:/Users/owen/Desktop/thesis/data.csv\"` is a line that breaks the moment anyone else runs " +
        "your code, including you on a different laptop.\n\n" +
        "The usual fix is an RStudio **Project**: the working directory becomes the project folder, so " +
        "`data/raw.csv` means the same thing for everyone. It is also why `setwd()` at the top of a " +
        "script is a bad habit — it hard-codes one computer's layout into your analysis.\n\n" +
        "`pattern` takes a regular expression, not a wildcard. `\"*.csv\"` is a shell idea and does not " +
        "mean what you expect here; `\"[.]csv$\"` says \"a literal dot, then csv, then the end\".",
      task:
        "Return the names of the **CSV files** in the `lab` folder — not the readme — as a character vector.",
      datasets: [],
      starter: 'getwd()\nlist.files("lab")\n',
      hints: [
        'Run the starter first to see what is actually there.',
        '`list.files()` takes a `pattern` argument, and the pattern is a regular expression.',
        'list.files("lab", pattern = "[.]csv$")',
      ],
      solution: 'list.files("lab", pattern = "[.]csv$")',
      debrief:
        "Three exports and a `README.txt` that you correctly left behind. Filtering by pattern rather " +
        "than by eye is what lets the next mission handle a folder of forty files without you editing " +
        "anything.",
      check: `local({
  want <- list.files("lab", pattern = "[.]csv$")
  got <- .rlab_answer
  rlab_seq(
    rlab_want_class(got, "character", "Your answer"),
    if (any(grepl("README", got)))
      "That includes \`README.txt\`, which is not a CSV. Filter with \`pattern\`." else character(0),
    if (length(got) && all(grepl("^lab/", got)))
      "Those are full paths. Without \`full.names = TRUE\` you get just the names \u2014 which is what this mission wants." else character(0),
    rlab_want_len(got, length(want), "Your answer"),
    rlab_want_set(got, want, "The file names")
  )
})`,
    },
    {
      id: 'l14m2',
      title: 'Into R',
      xp: 55,
      teach:
        "`read_csv(\"lab/file.csv\")` from readr reads a comma-separated file into a tibble. It prints a " +
        "message telling you the type it guessed for every column, which is not noise — it is the most " +
        "useful thing it says.",
      theory:
        "There are two functions and they are not the same. `read.csv()` is base R; `read_csv()` is " +
        "readr. The readr one is faster, never turns text into factors behind your back, keeps odd " +
        "column names instead of mangling them, and reports what it guessed. Use it.\n\n" +
        "That guessing is the part to understand. readr looks at the first 1,000 rows of each column " +
        "and picks a type. If row 1,200 is the first one containing `\"n/a\"`, the column was already " +
        "declared numeric and that value becomes `NA` with a parsing warning — or, if the guess goes " +
        "the other way, your whole numeric column silently arrives as text.\n\n" +
        "So the ritual is: read the file, look at the types it reports, and check they are what you " +
        "expected. Two seconds, and it catches a class of bug that otherwise surfaces three analyses " +
        "later as an inexplicable error.",
      task:
        "Read `lab/fitness_2024.csv` with readr's `read_csv()` and return it.",
      datasets: [],
      starter: '',
      hints: [
        'The path is relative to the working directory, and it needs quotes.',
        '`read_csv()` takes the path as its only required argument.',
        'read_csv("lab/fitness_2024.csv")',
      ],
      solution: 'read_csv("lab/fitness_2024.csv")',
      debrief:
        "Eight rows, and look at what it says about `run_2km_min`: **character**. Every other test " +
        "column came through as a number, but that one has `\"DNF\"` in it from the two sessions you " +
        "pulled out of, so readr decided the whole column was text.\n\n" +
        "This is exactly the silent failure the theory warned about. You cannot average it, and nothing " +
        "will tell you so until you try.",
      check: `local({
  want <- readr::read_csv("lab/fitness_2024.csv", show_col_types = FALSE)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    if (is.data.frame(got) && ncol(got) == 1)
      "One column means the separator was not what the reader expected. This is a comma-separated file \u2014 \`read_csv()\` handles it." else character(0),
    if (is.data.frame(got) && !inherits(got, "tbl_df"))
      "That is base R's \`read.csv()\`. It works, but this level is about readr: \`read_csv()\` returns a tibble, prints the column types it guessed, and never converts text to factors behind your back." else character(0),
    rlab_want_cols(got, names(want), exact = TRUE),
    rlab_want_rows(got, nrow(want), "That is the 2024 export, not both of them."),
    rlab_want_col_values(got, "pushups", want$pushups)
  )
})`,
    },
    {
      id: 'l14m3',
      title: 'Tell it what missing looks like',
      xp: 60,
      teach:
        "`read_csv(path, na = c(\"\", \"NA\", \"DNF\"))` tells the reader which strings mean *missing* " +
        "before it guesses any types. Once `\"DNF\"` counts as missing, the column is numeric with two " +
        "`NA`s in it.",
      theory:
        "Fixing this at read time is better than fixing it afterwards, and the difference matters. " +
        "Convert later with `as.numeric()` and R coerces `\"DNF\"` to `NA` with a warning you will " +
        "probably ignore — and if some other junk value is lurking in row 900, it disappears the same " +
        "silent way. Declaring your missing codes up front means anything *unexpected* still shows up " +
        "as a parsing problem.\n\n" +
        "Real exports are full of these. `-999`, `n/a`, `.`, `missing`, a single space, `#NULL!` from " +
        "SPSS. Each one is someone's convention, and none of them is R's.\n\n" +
        "The stronger version is `col_types`, where you state every column's type explicitly rather " +
        "than letting the file decide. It is more typing, and it means your script fails loudly when " +
        "next month's export has an extra column, instead of quietly analysing something else.",
      task:
        "Read `lab/fitness_2024.csv` again, this time treating `\"DNF\"` as missing as well as the usual " +
        "empty string and `\"NA\"`, and return it.",
      datasets: [],
      starter: '',
      hints: [
        'The argument is `na`, and it takes a character vector of all the strings that mean missing.',
        'Keep the usual ones too: `c("", "NA", "DNF")`.',
        'read_csv("lab/fitness_2024.csv", na = c("", "NA", "DNF"))',
      ],
      solution: 'read_csv("lab/fitness_2024.csv", na = c("", "NA", "DNF"))',
      debrief:
        "`run_2km_min` is numeric now, with one `NA` where the DNF was. You can average it, plot it, " +
        "and model it — and the missing session is visible as missing rather than hidden inside a word.",
      check: `local({
  want <- readr::read_csv("lab/fitness_2024.csv", na = c("", "NA", "DNF"), show_col_types = FALSE)
  raw <- readr::read_csv("lab/fitness_2024.csv", show_col_types = FALSE)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, names(want), exact = TRUE),
    rlab_want_rows(got, nrow(want)),
    if (is.character(got$run_2km_min))
      "\`run_2km_min\` is still text. Tell the reader that \\"DNF\\" means missing, using the \`na\` argument." else character(0),
    rlab_want_class(got$run_2km_min, "numeric", "\`run_2km_min\`"),
    rlab_want_value(sum(is.na(got$run_2km_min)), sum(is.na(want$run_2km_min)),
                    "the number of missing run times")
  )
})`,
    },
    {
      id: 'l14m4',
      title: 'The file that is not only a table',
      xp: 60,
      teach:
        "Plenty of instruments write a few lines of preamble above the actual data. `comment = \"#\"` " +
        "tells the reader to ignore any line starting with that character; `skip = 2` ignores a fixed " +
        "number of lines instead.",
      theory:
        "Read such a file without telling the reader about the preamble and you get something that " +
        "*looks* like a failure but is not an error: a single column, named after the first comment " +
        "line, with everything crammed into it. R did exactly what you asked — it just was not a " +
        "rectangle.\n\n" +
        "`comment` is usually the better of the two, because it survives the vendor adding a third line " +
        "of preamble next month. `skip` hard-codes a count that will eventually be wrong.\n\n" +
        "The habit worth taking from this: when a read goes wrong, look at the raw text before you " +
        "start changing arguments. `readLines(path, n = 5)` shows you the first five lines exactly as " +
        "they are, and almost always makes the problem obvious in a way the parsed result does not.",
      task:
        "Read `lab/hikes_export.csv` properly, ignoring its comment lines, and return it.",
      datasets: [],
      starter: 'readLines("lab/hikes_export.csv", n = 4)\n',
      hints: [
        'Run the starter to see what is at the top of the file.',
        'Both comment lines start with `#`, so one argument handles any number of them.',
        'read_csv("lab/hikes_export.csv", comment = "#")',
      ],
      solution: 'read_csv("lab/hikes_export.csv", comment = "#")',
      debrief:
        "120 rows and seven proper columns. Without that argument you get one column called " +
        "`# TrailLog export v2.1` — no error, no warning, just a data frame that is wrong in a way " +
        "that will confuse you for twenty minutes.",
      check: `local({
  want <- readr::read_csv("lab/hikes_export.csv", comment = "#", show_col_types = FALSE)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    if (is.data.frame(got) && ncol(got) == 1)
      "One column, named after the first comment line \u2014 the preamble is being read as data. Use \`comment = \\"#\\"\` or \`skip = 2\`." else character(0),
    rlab_want_cols(got, names(want), exact = TRUE),
    rlab_want_rows(got, nrow(want)),
    rlab_want_col_values(got, "distance_km", want$distance_km, tol = 1e-8)
  )
})`,
    },
    {
      id: 'l14m5',
      title: 'Write it once',
      xp: 65,
      teach:
        "A function packages up a bit of work so you can reuse it: " +
        "`name <- function(arg) { ... }`. The last expression in the body is what it returns, and " +
        "the argument is a placeholder for whatever you pass in.",
      theory:
        "The rule of thumb is to write a function once you have copied and pasted something twice. " +
        "Not because repetition is ugly, but because copies drift: you fix the missing-value handling " +
        "in one place and forget the other two, and now two of your three files were cleaned " +
        "differently and nothing anywhere says so.\n\n" +
        "A function also names the operation. `read_fitness(path)` tells a reader what is happening in " +
        "a way that three lines of arguments do not, and it gives you one place to change your mind " +
        "about what counts as missing.\n\n" +
        "One thing to watch in R: a function can see variables from outside itself, so a body that " +
        "quietly refers to something you defined in the console will work today and fail when you run " +
        "the script fresh. Anything the function needs should come in through an argument.",
      task:
        "Write a function called `read_fitness` that takes one argument, a file path, and returns that " +
        "file read in with `\"DNF\"` treated as missing. Then call it on `lab/fitness_2025.csv` and " +
        "return the result.",
      datasets: [],
      starter: 'read_fitness <- function(path) {\n  \n}\n\n',
      hints: [
        'The body is one line: read the file the same way as the last mission, but using `path` instead of a literal filename.',
        'Do not quote `path` inside the function — it is already the string you were given.',
        'read_fitness <- function(path) {\n  read_csv(path, na = c("", "NA", "DNF"))\n}\n\nread_fitness("lab/fitness_2025.csv")',
      ],
      solution:
        'read_fitness <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n\n' +
        'read_fitness("lab/fitness_2025.csv")',
      debrief:
        "Sixteen rows, and the cleaning rule now lives in exactly one place. That is the whole point: " +
        "when you discover next week that this instrument also writes `\"--\"` for missing, you change " +
        "one line and every file you ever read is fixed.",
      check: `local({
  want <- readr::read_csv("lab/fitness_2025.csv", na = c("", "NA", "DNF"), show_col_types = FALSE)
  got <- .rlab_answer
  rlab_seq(
    rlab_want_obj("read_fitness"),
    if (!is.function(rlab_obj("read_fitness")))
      "\`read_fitness\` exists but is not a function \u2014 it needs \`function(path) { ... }\`." else character(0),
    local({
      f <- rlab_obj("read_fitness")
      if (length(formals(f)) != 1)
        sprintf("Your function takes %d arguments; it should take exactly one, the path.", length(formals(f))) else character(0)
    }),
    local({
      f <- rlab_obj("read_fitness")
      other <- tryCatch(suppressWarnings(f("lab/fitness_2024.csv")),
                        error = function(e) structure(conditionMessage(e), class = "rlab_fnerr"))
      if (inherits(other, "rlab_fnerr"))
        sprintf("Your function works on the file you called it with, but fails on another path (%s). Make sure the body uses \`path\`, not a hard-coded filename.", as.character(other))
      else if (!is.data.frame(other) || nrow(other) != 8)
        "Your function does not seem to read whatever path it is given \u2014 check that the body uses the \`path\` argument." else character(0)
    }),
    rlab_want_df(got),
    rlab_want_rows(got, nrow(want), "Call your function on the 2025 file."),
    rlab_want_class(got$run_2km_min, "numeric", "\`run_2km_min\` in the result")
  )
})`,
    },
    {
      id: 'l14m6',
      title: 'All of them, without copy-paste',
      xp: 70,
      teach:
        "`map(x, f)` applies a function to every element of a vector and returns a list of results. " +
        "`list_rbind()` then stacks a list of data frames into one. Together with " +
        "`list.files(full.names = TRUE)`, that reads a whole folder in one line.",
      theory:
        "This is the payoff for having written a function. The loop does not care whether the folder " +
        "holds two files or two hundred, and there is no copy-pasted block to fall out of step.\n\n" +
        "`full.names = TRUE` matters more than it looks. Without it you get bare filenames, which R " +
        "will dutifully look for in the working directory rather than in `lab/`, and the error says " +
        "the file does not exist when you are staring at it in the folder listing.\n\n" +
        "One habit worth adopting when you do this for real: record where each row came from. " +
        "`map()` has a sibling that keeps the names, or you can add a column inside your own reading " +
        "function. Once forty files are stacked into one table, \"which export was this row in?\" " +
        "becomes unanswerable unless you wrote it down at the time.",
      task:
        "Using the function from the last mission, read **both** fitness exports and combine them into " +
        "one data frame. Pick the files up with `list.files()` rather than typing their names.",
      datasets: [],
      starter:
        'read_fitness <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n\n' +
        'paths <- list.files("lab", pattern = "^fitness_.*[.]csv$", full.names = TRUE)\n' +
        'paths\n',
      hints: [
        'Run the starter and check `paths` — they should start with `lab/`.',
        '`map(paths, read_fitness)` gives you a list of two data frames.',
        'map(paths, read_fitness) |> list_rbind()',
      ],
      solution:
        'read_fitness <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n\n' +
        'paths <- list.files("lab", pattern = "^fitness_.*[.]csv$", full.names = TRUE)\n\n' +
        'map(paths, read_fitness) |>\n' +
        '  list_rbind()',
      debrief:
        "Twenty-four rows from two files, and the same line would have handled twenty files. Note that " +
        "the pattern excluded `hikes_export.csv` — stacking that in would have produced a table with " +
        "every column of both, mostly full of `NA`, and no error at all.",
      check: `local({
  rf <- function(p) readr::read_csv(p, na = c("", "NA", "DNF"), show_col_types = FALSE)
  paths <- list.files("lab", pattern = "^fitness_.*[.]csv$", full.names = TRUE)
  want <- dplyr::bind_rows(lapply(paths, rf))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    if (is.data.frame(got) && "trail" %in% names(got))
      "The hikes export got stacked in too \u2014 note the extra columns full of NA. Narrow the \`pattern\` so only the fitness files match." else character(0),
    rlab_want_cols(got, names(want), exact = TRUE),
    rlab_want_rows(got, nrow(want), "Both exports together: 8 rows plus 16."),
    rlab_want_class(got$run_2km_min, "numeric", "\`run_2km_min\`"),
    rlab_want_value(sum(got$pushups), sum(want$pushups), "the total of \`pushups\`")
  )
})`,
    },
    {
      id: 'l14m7',
      title: 'And back out again',
      xp: 60,
      // Clear the file first, so a previous attempt's output cannot make a
      // later answer that never writes anything look correct.
      setup: 'unlink("lab/fitness_clean.csv")',
      teach:
        "`write_csv(data, \"lab/clean.csv\")` writes a data frame out as a CSV. Reading it straight back " +
        "with `read_csv()` is the cheapest way to confirm it actually contains what you think.",
      theory:
        "The rule that saves people: **never write over your raw data.** The export from the " +
        "instrument is the one artefact you cannot regenerate, and every cleaning step should read it " +
        "and write somewhere else. A `raw/` folder nothing ever writes to, and a `clean/` folder " +
        "nothing is ever hand-edited in, is the whole system.\n\n" +
        "CSV is a lossy format and it is worth knowing how. Factor levels, column types, dates as " +
        "dates, and anything you set as an attribute all become text on the way out and have to be " +
        "guessed again on the way in. For handing data to another person or another program it is " +
        "still the right choice, because everything can read it. For saving an intermediate step in " +
        "your own pipeline, `saveRDS()` keeps the object exactly as it was.\n\n" +
        "The deeper point is that a cleaned file is an *output*, not a source. If you lost every clean " +
        "file you own, the script should rebuild them from the raw exports without you remembering " +
        "anything.",
      task:
        "Build the combined fitness data again, write it to `lab/fitness_clean.csv`, then read that new " +
        "file back in and return it.",
      datasets: [],
      starter:
        'read_fitness <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n' +
        'paths <- list.files("lab", pattern = "^fitness_[0-9]+[.]csv$", full.names = TRUE)\n' +
        'combined <- map(paths, read_fitness) |> list_rbind()\n\n',
      hints: [
        '`write_csv()` takes the data first and the path second.',
        'Writing returns the data invisibly, so read the file back as a separate step to prove it worked.',
        'write_csv(combined, "lab/fitness_clean.csv")\nread_csv("lab/fitness_clean.csv")',
      ],
      solution:
        'read_fitness <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n' +
        'paths <- list.files("lab", pattern = "^fitness_[0-9]+[.]csv$", full.names = TRUE)\n' +
        'combined <- map(paths, read_fitness) |> list_rbind()\n\n' +
        'write_csv(combined, "lab/fitness_clean.csv")\n' +
        'read_csv("lab/fitness_clean.csv")',
      debrief:
        "The round trip is the test. Twenty-four rows went out and twenty-four came back, with " +
        "`run_2km_min` still numeric because the `NA`s were written as empty fields rather than the " +
        "word `DNF`.\n\n" +
        "The raw exports are untouched. Delete your clean file and the three lines above rebuild it " +
        "exactly — which is what reproducible means in practice, with no ceremony attached.",
      check: `local({
  rf <- function(p) readr::read_csv(p, na = c("", "NA", "DNF"), show_col_types = FALSE)
  paths <- list.files("lab", pattern = "^fitness_[0-9]+[.]csv$", full.names = TRUE)
  want <- dplyr::bind_rows(lapply(paths, rf))
  got <- .rlab_answer
  rlab_seq(
    if (!file.exists("lab/fitness_clean.csv"))
      "I can't find \`lab/fitness_clean.csv\`. Write the combined data out with \`write_csv()\` before reading it back." else character(0),
    rlab_want_df(got),
    rlab_want_cols(got, names(want), exact = TRUE),
    rlab_want_rows(got, nrow(want)),
    rlab_want_class(got$run_2km_min, "numeric", "\`run_2km_min\` in the file you read back"),
    local({
      disk <- readr::read_csv("lab/fitness_clean.csv", show_col_types = FALSE)
      rlab_want_value(nrow(disk), nrow(want), "the number of rows in the file on disk")
    }),
    rlab_want_value(sum(got$plank_sec), sum(want$plank_sec), "the total of \`plank_sec\`")
  )
})`,
    },
    {
      id: 'l14boss',
      title: 'Boss: the script that does not work',
      boss: true,
      xp: 200,
      teach:
        "R's error messages are terse but they are not cryptic. *could not find function* means a typo " +
        "or a missing package. *object not found* means you used a name R has never seen. " +
        "*does not exist in current working directory* means a path problem, every time.",
      theory:
        "Debugging is a procedure, not a talent. Read the error, find the line it names, and run the " +
        "pipeline one step at a time until the output stops being what you expected — the bug is " +
        "always in the step where that changes.\n\n" +
        "The errors worth recognising on sight:\n\n" +
        "- *could not find function \"read_csvv\"* — a typo, or a library you did not load.\n" +
        "- *object 'lab' not found* — you used a bare word where a string belonged. R looked for a " +
        "variable called `lab` and there isn't one.\n" +
        "- *'lab/x.csv' does not exist in current working directory* — believe it. Check `getwd()` and " +
        "`list.files()` rather than the filename.\n" +
        "- *object 'VO2max' not found* inside dplyr — a column name, with the wrong capitals. R is " +
        "case sensitive and always will be.\n" +
        "- *argument is not numeric or logical* — something you think is a number is text.\n\n" +
        "None of these mean you are bad at R. They are the five things everybody gets wrong, forever.",
      task:
        "The script in the editor is meant to read both fitness exports, combine them, and report how " +
        "many sessions have a VO2 max recorded along with the mean. It has **three** bugs. Fix them " +
        "and return the one-row summary, with columns `n` and `mean_vo2` (rounded to 2 dp).\n\n" +
        "Nothing about the approach is wrong — only the details.",
      datasets: [],
      starter:
        'read_one <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n\n' +
        'paths <- list.files(lab, pattern = "^fitness_[0-9]+[.]csv$")\n\n' +
        'combined <- map(paths, read_one) |> list_rbind()\n\n' +
        'combined |>\n' +
        '  filter(!is.na(VO2max)) |>\n' +
        '  summarise(n = n(), mean_vo2 = round(mean(vo2max), 2))',
      hints: [
        'Run it and read the first error. R tells you which name it could not find — and `lab` is a folder, not a variable.',
        'Once it gets past that, `list.files()` returns bare filenames by default, so R looks for them in the working directory rather than in the folder.',
        'The last bug is a column name. R is case sensitive, and the column in the file is `vo2max`.',
      ],
      solution:
        'read_one <- function(path) {\n' +
        '  read_csv(path, na = c("", "NA", "DNF"))\n' +
        '}\n\n' +
        'paths <- list.files("lab", pattern = "^fitness_[0-9]+[.]csv$", full.names = TRUE)\n\n' +
        'combined <- map(paths, read_one) |> list_rbind()\n\n' +
        'combined |>\n' +
        '  filter(!is.na(vo2max)) |>\n' +
        '  summarise(n = n(), mean_vo2 = round(mean(vo2max), 2))',
      debrief:
        "22 sessions with a VO2 max recorded, averaging 47.63.\n\n" +
        "Three bugs, three different error messages, and none of them required understanding the " +
        "analysis. That is what most debugging is: a bare word that needed quotes, a path that was not " +
        "really a path, and a capital letter.\n\n" +
        "You now have everything you need to open RStudio with your own folder of exports and start " +
        "from line one. Which was the point of all ninety-eight of these.",
      check: `local({
  rf <- function(p) readr::read_csv(p, na = c("", "NA", "DNF"), show_col_types = FALSE)
  paths <- list.files("lab", pattern = "^fitness_[0-9]+[.]csv$", full.names = TRUE)
  comb <- dplyr::bind_rows(lapply(paths, rf))
  want <- comb |> dplyr::filter(!is.na(vo2max)) |>
    dplyr::summarise(n = dplyr::n(), mean_vo2 = round(mean(vo2max), 2))
  got <- .rlab_answer
  rlab_seq(
    rlab_want_df(got),
    rlab_want_cols(got, c("n", "mean_vo2"), exact = TRUE),
    rlab_want_rows(got, 1, "One summary row."),
    if (rlab_near(got$n[1], nrow(comb), 1e-9))
      "That counted every session, including the two with no VO2 max. The filter needs to drop them." else character(0),
    rlab_want_value(got$n[1], want$n[1], "\`n\`"),
    rlab_want_value(got$mean_vo2[1], want$mean_vo2[1], "\`mean_vo2\`", tol = 1e-6)
  )
})`,
    },
  ],
};
