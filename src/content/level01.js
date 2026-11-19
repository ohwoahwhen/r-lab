export default {
  id: 'l1',
  n: 1,
  title: 'First Day',
  blurb: 'Objects, vectors, data frames and the pipe.',
  story:
    "**Dr. Marigold Finch** leans over your desk on your first morning in the Comparative Cognition Lab. " +
    "\"Before I let you near the real data, show me you can talk to R. Here's my hiking log — I use it to teach " +
    "everyone the basics, because I know every row of it by heart.\"",
  missions: [
    {
      id: 'l1m1',
      theory:
        "A name in R is a label tied to a value, not a box you put things in. `pack_kg <- 18` means \"from now on, the label `pack_kg` refers to 18\". Point the label somewhere else and the old value is simply gone \u2014 R has no undo, and no record that it ever existed.\n\nThe arrow is directional on purpose: it shows which way the value travels. R also accepts `=`, but almost nobody uses it for assignment, because the arrow makes the direction visible at a glance in a long script.\n\nNotice that assigning prints nothing. R separates *doing* something from *showing* you something, which is why your first hour can feel like nothing is happening. If you want to see a value, you have to ask.",
      title: 'Say it with an arrow',
      xp: 30,
      teach:
        "In R you store things in **objects** using the assignment arrow `<-`. `x <- 5` means " +
        "\"put 5 in a box called x\". Writing the object's name on its own line prints what's inside it.",
      task:
        "Make an object called `pack_kg` holding the number `18`, then write `pack_kg` on the next line so R prints it.",
      datasets: [],
      starter: '',
      hints: [
        'The arrow is a less-than sign followed by a dash: `<-`. In RStudio the shortcut is Alt+minus.',
        'Two lines: the first assigns, the second is just the name of the object.',
        'Line 1: `pack_kg <- 18`  ·  Line 2: `pack_kg`',
      ],
      solution: 'pack_kg <- 18\npack_kg',
      check: `rlab_seq(
  rlab_want_obj("pack_kg"),
  rlab_want_value(rlab_obj("pack_kg"), 18, "pack_kg"),
  rlab_want_value(.rlab_answer, 18, "the printed value")
)`,
    },
    {
      id: 'l1m2',
      theory:
        "R's basic unit is not a number, it is a **vector** \u2014 an ordered run of values. A lone `18` is just a vector of length one. That is not pedantry; it is the reason `mean(weights)` needs no loop, and why `weights * 2` doubles every element at once.\n\nComing from almost any other language, this is the adjustment. The instinct to write \"for each element, do X\" is usually wrong in R, and code written that way is both longer and slower.\n\nOne catch: a vector holds a single type. Put a word in a vector of numbers and R will quietly turn *every* number into text rather than complain. That silent conversion is behind a lot of \"why is my column character?\".",
      title: 'A vector of packs',
      xp: 35,
      teach:
        "A **vector** is several values of the same type in order, built with `c()` (for *combine*). " +
        "Functions like `mean()`, `sum()`, `length()` and `max()` take a whole vector at once — no loops needed.",
      task:
        "Store the pack weights `6, 10, 14, 18, 22` in an object called `weights`, then return their **mean** " +
        "as the last line of your code.",
      datasets: [],
      starter: 'weights <- ',
      hints: [
        'Build the vector with `c(6, 10, 14, 18, 22)` — commas between values.',
        'The last line should be a function call, not an assignment, so the answer gets printed.',
        '`weights <- c(6, 10, 14, 18, 22)` then `mean(weights)`',
      ],
      solution: 'weights <- c(6, 10, 14, 18, 22)\nmean(weights)',
      check: `rlab_seq(
  rlab_want_obj("weights"),
  rlab_want_len(rlab_obj("weights"), 5, "\`weights\`"),
  rlab_want_value(rlab_obj("weights"), c(6, 10, 14, 18, 22), "\`weights\`"),
  rlab_want_value(.rlab_answer, mean(c(6, 10, 14, 18, 22)), "the mean")
)`,
    },
    {
      id: 'l1m3',
      theory:
        "A data frame is a list of vectors forced to be the same length and stood side by side. That is why a column has a type and a row does not \u2014 a row cuts across several vectors at once.\n\nSo \"look at the data\" is not a nicety. `nrow()` is a hypothesis test with yourself: you expect roughly this many rows, and if the number is wrong you stop and find out why rather than analysing something you do not recognise.\n\nThe expensive mistakes in data analysis are almost never clever ones. They are a filter that removed more than you thought, a join that duplicated rows, a file that only half-loaded \u2014 and every one of them shows up as a row count that is not what you expected.",
      title: 'How big is this thing?',
      xp: 35,
      teach:
        "A **data frame** is a table: each column is a vector, all the same length. Before you analyse anything, " +
        "you look: `nrow()` counts rows, `ncol()` counts columns, `names()` lists column names and `head()` shows the top.",
      task: "Return the number of **rows** in the `hikes` data frame.",
      datasets: ['hikes'],
      starter: '',
      hints: [
        'The dataset is already loaded — you can just type its name, `hikes`.',
        'One function, one argument.',
        '`nrow(hikes)`',
      ],
      solution: 'nrow(hikes)',
      check: `rlab_seq(
  rlab_want_value(.rlab_answer, nrow(hikes), "the row count")
)`,
    },
    {
      id: 'l1m4',
      theory:
        "`NA` does not mean zero and it does not mean blank. It means *a value exists and I do not know what it is*. Once you read it that way, everything NA does makes sense: the mean of a set of numbers, one of which is unknown, is itself unknown. R returns `NA` rather than guessing.\n\nThat is a safety feature, not an inconvenience. A language that quietly skipped missing values would let you report a mean of 30 people as if it were a mean of 180.\n\n`na.rm = TRUE` is you overriding that, which makes it a decision rather than a default. You are saying \"analyse the people who answered\". Often that is right, but it changes your sample, and that change belongs in your write-up rather than buried in an argument.",
      title: 'One column, please',
      xp: 40,
      teach:
        "`df$column` pulls a single column out as a vector. Real data has gaps, and any gap poisons the " +
        "arithmetic: `mean()` on a column containing `NA` returns `NA` unless you add `na.rm = TRUE`.",
      task:
        "Return the mean of the `pack_kg` column of `hikes`. Some hikes have no pack weight recorded, so you " +
        "will need to ignore the missing values.",
      datasets: ['hikes'],
      starter: '',
      hints: [
        'Get the column with `hikes$pack_kg`.',
        'If your answer comes back as `NA`, that is the missing values talking.',
        '`mean(hikes$pack_kg, na.rm = TRUE)`',
      ],
      solution: 'mean(hikes$pack_kg, na.rm = TRUE)',
      check: `rlab_seq(
  if (length(.rlab_answer) == 1 && is.na(.rlab_answer))
    "Your answer is NA. That happens when missing values are left in — add \`na.rm = TRUE\`." else character(0),
  rlab_want_value(.rlab_answer, mean(hikes$pack_kg, na.rm = TRUE), "the mean pack weight")
)`,
    },
    {
      id: 'l1m5',
      theory:
        "`mean(sqrt(abs(x)))` is read inside out: your eye starts in the middle, where the data is, and works outwards. The pipe lets you write the same thing in the order the steps actually happen.\n\nThat is the entire point. The computer does not care \u2014 `x |> mean()` compiles to `mean(x)`. The pipe is a tool for the human reading it in six months, which is usually you.\n\nYou will meet two of them. `|>` is built into R itself; `%>%` comes from the magrittr package and is what most code written before 2021 uses. They behave the same for everyday work, and this course uses the native one because it needs no packages.",
      title: 'The pipe',
      xp: 45,
      teach:
        "The **pipe** `|>` sends whatever is on its left into the first argument of the function on its right. " +
        "`mean(x)` and `x |> mean()` are the same thing. It matters because it lets you read a long chain of steps " +
        "top to bottom instead of inside out.",
      task:
        "Using the pipe, return the **largest** distance in `hikes`. Start from `hikes$distance_km` and pipe it into `max()`.",
      datasets: ['hikes'],
      starter: 'hikes$distance_km |>\n  ',
      hints: [
        'The pipe is a vertical bar followed by a greater-than sign: `|>`.',
        'Nothing goes inside `max()` — the pipe is already filling its first argument.',
        '`hikes$distance_km |> max()`',
      ],
      solution: 'hikes$distance_km |> max()',
      check: `rlab_seq(
  rlab_code_has("\\\\|>|%>%", "This one is specifically about the pipe — use \`|>\` to feed the column into the function."),
  rlab_want_value(.rlab_answer, max(hikes$distance_km), "the longest hike")
)`,
    },
    {
      id: 'l1boss',
      theory:
        "The idiom at the centre of this mission is **logical subsetting**. `hikes$distance_km > 15` does not give you an answer; it gives you one TRUE or FALSE per row. Feed that vector into `[ ]` and you keep the TRUE ones.\n\nThis is also why `sum()` counts things. In R, `TRUE` is 1 and `FALSE` is 0, so adding up a vector of TRUE/FALSE counts how many were TRUE. `mean()` on the same vector gives you the proportion \u2014 a trick worth remembering.\n\nEverything dplyr does in the next few levels is this, wearing better clothes. `filter()` is logical subsetting with nicer syntax.",
      title: 'Boss: the first briefing',
      boss: true,
      xp: 120,
      teach:
        "Dr. Finch wants three numbers in one object. A **named vector** carries labels with its values: " +
        "`c(a = 1, b = 2)`. You can combine everything you've met so far — `$`, logical subsetting with `[ ]`, " +
        "`sum()`, `mean()`, `max()` and `na.rm`.",
      task:
        "Return a single named numeric vector with exactly these three names:\n" +
        "- `n` — how many hikes were longer than 15 km\n" +
        "- `mean_elev` — the mean `elev_m` of *those* hikes\n" +
        "- `max_pack` — the heaviest `pack_kg` in the whole log, ignoring missing values",
      datasets: ['hikes'],
      starter: '',
      hints: [
        'A logical test on a column gives TRUE/FALSE for every row: `hikes$distance_km > 15`. `sum()` of that counts the TRUEs.',
        'Use the same test inside square brackets to keep only those rows of another column: `hikes$elev_m[hikes$distance_km > 15]`.',
        'c(n = sum(hikes$distance_km > 15), mean_elev = mean(hikes$elev_m[hikes$distance_km > 15]), max_pack = max(hikes$pack_kg, na.rm = TRUE))',
      ],
      solution:
        'long <- hikes$distance_km > 15\nc(\n  n = sum(long),\n  mean_elev = mean(hikes$elev_m[long]),\n  max_pack = max(hikes$pack_kg, na.rm = TRUE)\n)',
      check: `local({
  long <- hikes$distance_km > 15
  want <- c(n = sum(long),
            mean_elev = mean(hikes$elev_m[long]),
            max_pack = max(hikes$pack_kg, na.rm = TRUE))
  a <- .rlab_answer
  rlab_seq(
    rlab_want_class(a, "numeric", "Your answer"),
    rlab_want_len(a, 3, "Your answer"),
    rlab_want_set(names(a), names(want), "The names on your vector"),
    rlab_want_value(a[["n"]], want[["n"]], "\`n\`"),
    rlab_want_value(a[["mean_elev"]], want[["mean_elev"]], "\`mean_elev\`", tol = 1e-6),
    rlab_want_value(a[["max_pack"]], want[["max_pack"]], "\`max_pack\`")
  )
})`,
    },
  ],
};
