# Session 1 — Values, variables and print

## The job

Loop has opened a branch in Chucuito, in the Callao, a block from the pier, where everything smells of sea and fresh paint. The engineer **Maru Chumpitaz** has just opened the crate that came on the last ship: inside is **Quilla**, a brand-new delivery robot that only understands Python. It doesn't know its name, it doesn't know how much battery it has and it has never crossed a street.

And there's already an order. Don Teodoro, who has sold *alfajores de penca* in the Rímac for forty years, wants a box taken to his comadre, who lives across from the Alameda de los Descalzos. Maru takes Quilla to the shop in a mototaxi; from there on, Quilla walks alone. Today you teach it to keep what it knows and to say it out loud.

```scene
theme: barranco
level: 1
dir: E
caption: Quilla leaves Don Teodoro's shop (on the left) for the comadre's mailbox, across from the Alameda.
map: |
  ###########
  #R.....####
  ######.##D#
  ######....#
  ###########
program: |
  robot.forward(5)
  robot.turn_right()
  robot.forward(2)
  robot.turn_left()
  robot.forward(3)
  robot.turn_left()
  robot.forward(1)
  robot.deliver("Alfajores de penca")
```

## Why Python exists

```goals
- Tell who created Python, when, and what problem it was meant to solve
- Compare its strengths and weaknesses with JavaScript and C++
- Know where it's used today and why it fits there
```

Quilla only understands Python, and that's no factory whim. To see why the Callao branch picked that language, we have to travel to Amsterdam, at Christmas 1989. This lesson is background: if a word means nothing to you (GIL, JIT, PyPI), keep going; they all come back later with meaning.

### The problem in 1989

<!-- photo: guido-van-rossum-2006 -->

**Guido van Rossum** worked at **CWI**, a research institute for mathematics and computer science in the Netherlands. Earlier he had been on the team behind **ABC**, a language for teaching programming: wonderfully easy to read, but closed; you couldn't extend it and it didn't talk well to the operating system (files, processes, the network). Then he moved to the **Amoeba** project, a distributed operating system, and ran into the usual problem: writing admin tools in **C** took far too long, and terminal scripts (*shell*) fell short as soon as the task got complicated.

What does "talking to the operating system" mean? Your program doesn't touch the disk or the network by itself: it **asks** the operating system (Windows, Linux or, in Guido's case, Amoeba), which is the one in charge of the machine. Each request is called a **system call**: "open this file", "give me what it says", "start this other program". A language is only useful for running computers if it can make those calls, and the easier the better:

<!-- /photo -->

```network
title: Asking the system for something, in each language
nodes:
  - { id: prog, icon: program, label: Your program, sub: wants to read notes.txt }
  - { id: os, icon: os, label: Operating system, sub: "Amoeba, Unix…: in charge of the machine" }
  - { id: disk, icon: disk, label: The disk, sub: "where notes.txt is stored" }
links:
  - { id: call, label: system call, busy: can't reach }
  - { id: hw }
steps:
  - phase: What a system call is
    move: [prog, os]
    packet: { kind: up, label: '"open notes.txt"' }
    note: The program doesn't read the disk directly. It **asks** the operating system to open the file.
  - move: [os, disk]
    packet: { kind: up, label: '"open notes.txt"' }
    note: The operating system, which is in charge of the disk, finds the file.
  - move: [disk, prog]
    dur: 1400
    packet: { kind: down, label: what the file says }
    note: And it hands the contents back to the program. That's a system call, asking and receiving.
  - phase: ABC
    at: prog
    dim: [os, disk]
    busy: [call]
    tags: { prog: no door for that }
    note: "**ABC** read beautifully, but it lived shut inside its own world: it gave you no practical way to make those calls or to add new functions to it. For running a system, it was no use."
  - phase: C
    move: [prog, os]
    packet: { kind: up, label: '"open notes.txt"' }
    note: "**C** reaches everything, but you write every detail: open, check whether it failed, read in chunks, close. For a tiny tool, that's a lot of work."
    show:
      label: Printing a file, in C
      text: |
        #include <stdio.h>

        int main(void) {
            FILE *f = fopen("notes.txt", "r");
            if (f == NULL) return 1;
            char line[256];
            while (fgets(line, sizeof line, f))
                fputs(line, stdout);
            fclose(f);
            return 0;
        }
  - phase: Shell
    at: prog
    busy: [call]
    dim: [os, disk]
    tags: { prog: "cat notes.txt" }
    note: "**Shell** scripts (terminal commands) are short, and on Unix `cat notes.txt` is enough. But Amoeba had its own system calls and the shell couldn't reach them easily; and as soon as a task needed decisions and arithmetic, the script turned into a tangle."
  - phase: Python
    move: [prog, os]
    packet: { kind: up, label: '"open notes.txt"' }
    note: "**Python** wanted the best of both: to read almost like ABC and to reach the system like C. Two lines, and you can read them."
    show:
      label: Printing a file, in Python
      text: |
        with open("notes.txt") as file:
            print(file.read())
caption: The Amoeba and shell part comes from Python's own General FAQ, under "Why was Python created in the first place?".
```

Something was missing in between: as easy to read as ABC, but able to do everything C does by calling the system. Over the Christmas holidays of 1989 he started writing it as a hobby. He called it **Python** after *Monty Python's Flying Circus*, the British comedy show, not after the snake. In **February 1991** he published version 0.9.0 on Usenet (the internet forums of the day).

```figure
title: Python over time
panes:
  - timeline:
      - when: "1989"
        title: "CWI, Amsterdam"
        text: "Guido starts Python at Christmas, as a hobby"
      - when: "1991"
        title: "0.9.0"
        text: "First public release, on Usenet"
      - when: "2000"
        title: "Python 2"
        text: "List comprehensions; the community grows"
      - when: "2006–2008"
        title: "NumPy, pandas"
        text: "Python becomes a tool for science and data"
      - when: "2008"
        title: "Python 3"
        text: "Breaks compatibility to fix design mistakes"
      - when: "2015–2016"
        title: "TensorFlow, PyTorch"
        text: "Python becomes the language of AI"
      - when: "2020"
        title: "End of Python 2"
        text: "A move of almost twelve years is over"
      - when: "2024–2025"
        title: "3.13 and 3.14"
        text: "Python without the GIL arrives, still optional"
```

## The minimum

A program stores **values** in **variables** and uses them. Python has five basic types to start with: whole numbers (`int`), numbers with decimals (`float`), text (`str`, in quotes), booleans (`True` or `False`, capitalised) and `None`, which means "nothing yet". With `print` you look inside anything, and with `type` you ask what type it is.

**How this runs.** You write text. A program called the **interpreter** (Python's) reads it line by line and does what it says. In Loop, the ▶ button hands your text to the interpreter, and what you send with `print` appears in the **console**, the panel below.

```py run
name = "Quilla"
battery = 100
battery = battery - 15
print(f"{name} has {battery}% battery")
print(type(name), type(battery), type(1.5), type(True), type(None))
```

A variable is a **name** you stick on a value, like a label. The value lives on its own and the name just **points to** it: with `=` you stick the label on, you read it whenever you like, and if you assign again, the label peels off and sticks to another value. Press ▶ and watch each label move line by line; values left without a name get discarded:

```anim
title: A name is a label stuck on a value
code: |
  name = "Quilla"
  battery = 100
  battery = battery - 15
  battery = battery - 30
  destination = None
  destination = "Rímac"
  print(f"{name} is heading to {destination} with {battery}%")
refs: all
notes:
  1: The label name is stuck on a text (str).
  2: The label battery is stuck on the number 100.
  3: 100 - 15 is computed and a new value comes out, 85. The label battery peels off the 100 and sticks to the 85.
  4: The same again; the 85 is left without a name.
  5: None means "no destination yet". It's a value too, and destination sticks to it.
  6: Reassigning moves the label to another value, even of another type. The type belongs to the value, not to the name.
  7: The f before the quotes drops the values into the text.
```

What you need for today:

- **Names in `snake_case`.** In Python, variables are lowercase with underscores: `price_per_kilo`, `has_cargo`. No `pricePerKilo`.
- **f-strings.** An `f` before the quotes, and every `{…}` inside is replaced by its value: `f"Order {number}"`.
- **`print` takes several things** separated by commas and prints them with a space in between. `sep=` changes that separator and `end=` changes what goes at the end (normally a line break).
- **Three divisions.** `/` always gives a `float` (`7 / 2` is `3.5`); `//` gives how many times it fits, without decimals (`7 // 2` is `3`); `%` gives what's left over (`7 % 2` is `1`).
- **Converting.** `int("12")` gives the number 12, `float("2.5")` gives 2.5 and `str(30)` gives the text `"30"`.

```py run
alfajor_count = 14
per_box = 4
print(alfajor_count / per_box, alfajor_count // per_box, alfajor_count % per_box, sep=" | ")
print("Full boxes:", alfajor_count // per_box, end="")
print(" (with", alfajor_count % per_box, "alfajores left over)")
```

> **Common trap:** in Python, `"3" + 2` is neither `"32"` nor `5`: it's a `TypeError`, because Python doesn't mix text and numbers on its own. If a number reaches you as text (from `input()`, from a sensor), convert it first: `int("3") + 2` gives `5`, and `"3" + str(2)` gives `"32"`.

<!-- legacy: fstrings -->

<!-- legacy: print-function -->

<!-- legacy: int-division -->

<!-- mdn: fstrings print-function int-division type-conversion -->

## For the curious

For the curious: why it reads this way, what it compares with and where it's used. If a word means nothing to you, keep going; it comes back later with meaning.

### Readable on purpose

Python's central idea is that code is read much more often than it is written. That's why **indentation is part of the language**: what's inside an `if` or a loop looks inside, because it sits further right, with no braces in the way. And that's why its keywords are English words (`and`, `or`, `not`, `in`) rather than symbols.

In 1999 Tim Peters summed up that philosophy in 19 aphorisms, the **Zen of Python** (today it's PEP 20). It's hidden inside the language itself: type `import this` in any Python and it appears in full. Three of its lines:

> *Beautiful is better than ugly.*
>
> *Readability counts.*
>
> *There should be one-- and preferably only one --obvious way to do it.*

In **2008** came **Python 3**, which broke compatibility on purpose to fix design mistakes: `print` became a function, text became Unicode (so ñ and accents wouldn't come out as gibberish) and `7 / 2` started giving `3.5`. The move was long: Python 2 only stopped being supported on **1 January 2020**. That's why, throughout the course, you'll see **"In older code you'll see…"** boxes: they teach you to recognise old Python and write today's.

```idea
Python was born to have the clarity of a teaching language with the power of a systems one: you write it so another person understands it.
```

### Strengths and weaknesses

The same task, adding up the prices of an order, in three languages:

**Python**

```py
prices = [18.5, 12, 6]
total = sum(prices)
print(total)
```

**JavaScript**

```js
const prices = [18.5, 12, 6];
const total = prices.reduce((a, b) => a + b, 0);
console.log(total);
```

**C++**

```
#include <iostream>
#include <numeric>
#include <vector>
int main() {
  std::vector<double> prices{18.5, 12, 6};
  double total = std::accumulate(
    prices.begin(), prices.end(), 0.0);
  std::cout << total << "\n";
}
```

Python says what it does and nothing more. C++ asks for more, but in return it runs much faster.

```figure
title: Python next to others
panes:
  - table:
      head: ["", "Python", "JavaScript", "C++"]
      rows:
        - ["Reading someone else's code", "**Easiest**", "Medium", "Hard"]
        - ["Speed in plain loops", "Slow", "Fast (JIT engine)", "**Fastest**"]
        - ["Standard library", "**Huge (\"batteries included\")**", "Small", "Medium"]
        - ["Data and AI", "**NumPy, pandas, PyTorch**", "Few options", "Underneath Python's libraries"]
        - ["Several cores at once", "Limited by the GIL (changing)", "One thread; workers on the side", "**Real threads**"]
        - ["Browser and phone", "Little (via WebAssembly)", "**Built into the browser**", "Via WebAssembly or native apps"]
```

**Strengths.**

- **It reads almost like pseudocode**: that's why it's the first language in so many schools and universities, and why Loop chose it for Quilla: Maru wants anyone on the team to understand what the robot will do before letting it loose on the street.
- **Batteries included**: without installing anything it can read CSV and JSON, handle dates, talk to an SQLite database, compress files and much more.
- **Libraries for data, AI and automation**: NumPy, pandas, scikit-learn, PyTorch, Jupyter. The trick is that Python acts as **glue**: the heavy work runs in C, C++ or on the graphics card, and you direct it with readable code.
- **Whole numbers with no ceiling**: an `int` grows as much as it needs to.

```exercise
id: py1-origen-potencia
type: predict
title: A huge number
prompt: |
  What does Python print for this very large power?
code: |
  print(2 ** 64)
options:
  - "18446744073709551616"
  - "1.8446744073709552e+19"
  - OverflowError
  - "0"
answer: "18446744073709551616"
explain: |
  Python's integers have no limit: the result comes out exact, digit by digit. In JavaScript, `2 ** 64` gives `18446744073709552000` (the last digits get lost), and in C++ a 64-bit integer overflows.
```

**Weaknesses.**

- **Speed**: the standard interpreter (CPython) goes instruction by instruction; in plain loops it's usually several times slower than JavaScript and much slower than C++. You make up for it with libraries written in C and by choosing the right data structures (you'll see it in the performance session).
- **The GIL**: in CPython, a global lock lets only one thread run Python code at a time, so more threads don't split a calculation across cores. Python 3.13 (2024) brought an experimental **GIL-free** build, and since 3.14 (2025) it's official but **optional**: as of 2026, the usual install still comes with the GIL.
- **Packaging**: pip, venv, conda, Poetry, uv… there are many ways to install libraries and isolate projects, and the classic "it works on my machine" comes from there.
- **Browser and phone**: the browser doesn't speak Python. This course runs it with **Pyodide** (Python compiled to WebAssembly), which is why Quilla takes a few seconds to wake up the first time. Hardly anyone uses it for mobile apps.

### Where it's used today

```figure
title: Where Python lives
panes:
  - table:
      head: ["Where", "Why it fits"]
      rows:
        - ["**Data and artificial intelligence**", "The key libraries (NumPy, pandas, PyTorch) are used from Python"]
        - ["**Science and research**", "Jupyter notebooks: code, charts and text in one place"]
        - ["**Automation and scripts**", "Batteries included: files, network and system with nothing to install"]
        - ["**Web servers**", "Django and FastAPI let you build an API quickly and clearly"]
        - ["**Teaching**", "It reads almost like pseudocode"]
```

Python fits wherever the programmer's time matters more than the machine's: exploring data, trying out an idea, automating a boring task, joining pieces written in other languages. The AI boom pushed it even further. In the **Stack Overflow 2025** survey its use rose 7 points in a year, to 57.9 % of respondents, and in **2026** it stood at 58.0 % (JavaScript, 62.0 %). In **GitHub Octoverse 2024** it overtook JavaScript as the most used language on GitHub; in **Octoverse 2025** it came second, behind TypeScript. These are snapshots of one year, not eternal truths: check the latest edition.

```recap
- Guido van Rossum started it at CWI in Amsterdam over Christmas 1989 and published it in 1991.
- He wanted ABC's clarity with C's power for running systems; the name comes from Monty Python.
- "Readability is its design goal: indentation as syntax and the Zen of Python (`import this`)."
- Python 3 (2008) broke compatibility to fix mistakes; Python 2 ended in 2020.
- "Strengths: readable, batteries included, data and AI libraries. Weaknesses: speed, the GIL (now optional), packaging, browser and phone."
```

**Sources**

- Guido van Rossum, [foreword to *Programming Python*](https://www.python.org/doc/essays/foreword/) (1996), and [The History of Python](https://python-history.blogspot.com/2009/01/introduction-and-overview.html) (2009).
- Python, [General FAQ](https://docs.python.org/3/faq/general.html) and [PEP 20, the Zen of Python](https://peps.python.org/pep-0020/).
- [PEP 373: Python 2.7](https://peps.python.org/pep-0373/) (end of support) and [Sunsetting Python 2](https://www.python.org/doc/sunset-python-2/).
- [PEP 703](https://peps.python.org/pep-0703/) and [PEP 779](https://peps.python.org/pep-0779/) (Python without the GIL), and [Python support for free threading](https://docs.python.org/3/howto/free-threading-python.html).
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology) and [2026](https://survey.stackoverflow.co/2026/technology).
- GitHub, [Octoverse 2024](https://github.blog/news-insights/octoverse/octoverse-2024/) and [Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).

## Practice

```exercise
id: py1-predice-bateria
type: predict
title: The first charge
prompt: |
  Before running it: what does it print?
code: |
  name = "Quilla"
  battery = 90
  battery = battery - 25
  print(name, battery, sep=": ", end="%\n")
options:
  - "Quilla: 65%"
  - "Quilla 65"
  - "Quilla: 90%"
  - "name: battery%"
answer: "Quilla: 65%"
explain: |
  `battery` starts at 90 and is reassigned to `90 - 25`. `sep=": "` goes between the values, and `end="%\n"` is written at the end instead of the usual line break.
```

```exercise
id: py1-predice-divisiones
type: predict
title: Alfajores per box
prompt: |
  Don Teodoro has 14 alfajores and each box holds 4. What does it print?
code: |
  alfajor_count = 14
  per_box = 4
  print(alfajor_count / per_box)
  print(alfajor_count // per_box, alfajor_count % per_box)
options:
  - "3.5\n3 2"
  - "3\n3 2"
  - "3.5\n3.5 2"
  - "3.5\n2 3"
answer: "3.5\n3 2"
explain: |
  `/` always gives a `float`: 3.5. `//` says how many boxes are filled completely (3) and `%` how many alfajores are left over (2), because `3 * 4 + 2` is 14.
```

```exercise
id: py1-predice-tipos
type: predict
title: The scale that speaks in text
prompt: |
  The shop's scale returns the weight as text. What does this program print?
code: |
  weight = "2.5"
  boxes = 3
  print(type(weight), type(boxes))
  print(float(weight) * boxes)
options:
  - "<class 'str'> <class 'int'>\n7.5"
  - "<class 'float'> <class 'int'>\n7.5"
  - "<class 'str'> <class 'int'>\n2.52.52.5"
  - "<class 'str'> <class 'int'>\n7"
answer: "<class 'str'> <class 'int'>\n7.5"
explain: |
  `weight` is a `str` even though it looks like a number: it has quotes. `float(weight)` turns it into 2.5 and then it really multiplies: 7.5. Without converting, `weight * 3` would repeat the text three times (`"2.52.52.5"`).
```

```exercise
id: py1-completa-ficha
type: complete
title: Quilla's profile
prompt: |
  Maru fills in the new robot's profile. Replace each `___`:

  - its name is **Quilla** (a text);
  - it moves **1.5** squares per second (a number with decimals);
  - it **is carrying cargo** (a boolean, true);
  - it **has no destination** yet (nothing).
starter: |
  name = ___
  battery = 100
  speed = ___
  has_cargo = ___
  destination = ___
  print(f"{name}: {battery}% battery, cargo: {has_cargo}, destination: {destination}")
  print(type(speed))
solution: |
  name = "Quilla"
  battery = 100
  speed = 1.5
  has_cargo = True
  destination = None
  print(f"{name}: {battery}% battery, cargo: {has_cargo}, destination: {destination}")
  print(type(speed))
hints:
  - Texts go in quotes. `True` and `None` go without quotes and with a capital first letter.
  - In Python, decimals are written with a point, not a comma.
tests:
  - name: name is the text "Quilla"
    expect: 'name == "Quilla"'
  - name: speed is the float 1.5
    expect: speed == 1.5 and type(speed) == float
    msg: speed must be 1.5, without quotes.
  - name: has_cargo is the boolean True
    expect: has_cargo is True
    msg: has_cargo must be True, without quotes and with a capital T.
  - name: destination is None
    expect: destination is None
    msg: '"Nothing yet" in Python is None, without quotes.'
  - name: the console shows the profile
    output: "Quilla: 100% battery, cargo: True, destination: None\n<class 'float'>"
```

```exercise
id: py1-arregla-sensor
type: fix
title: The cargo sensor
prompt: |
  Quilla's cargo sensor returns how many packages it carries, but **as text**. This program should add the 2 packages Don Teodoro added at the end, and it crashes. Run it, read the error and fix it by converting the sensor's value, without changing the sensor line.
starter: |
  packages = "3"  # that's how the sensor delivers it
  added = 2
  total = packages + added
  print("Packages in the box:", total)
solution: |
  packages = "3"  # that's how the sensor delivers it
  added = 2
  total = int(packages) + added
  print("Packages in the box:", total)
hints:
  - The error says you can't add a `str` and an `int`. Which of the two is the text?
  - "`int(\"3\")` gives the number 3."
tests:
  - name: total is the number 5
    expect: total == 5
  - name: prints the packages
    output: "Packages in the box: 5"
  - name: the sensor still delivers text
    source: '^packages\s*=\s*"3"'
    msg: Don't change the sensor line; convert its value with int() when adding.
```

```exercise
id: py1-escribe-costo
type: write
title: How much to charge
prompt: |
  Work out in `cost` how much it costs to deliver the alfajores and show it as `Delivery cost: S/ 13.0`.

  Loop charges a **4 soles** base fare plus **1.5 soles per kilometre**, and the comadre's house is **6 km** from the shop. Store those three numbers in three variables with `snake_case` names and compute the total with them. (The `.0` appears because `1.5` is a `float`, and everything it touches is one too.)
visual:
  figure:
    title: How the fare is built
    panes:
      - receipt:
          title: LOOP CHUCUITO · DELIVERY
          rows: [["Base fare", "4.00"], ["6 km × 1.5", "9.00"]]
          total: "13.00"
starter: |
  # Your three variables:

  # The total:
  cost = 0
  print(f"Delivery cost: S/ {cost}")
solution: |
  base_fare = 4
  price_per_km = 1.5
  distance_km = 6
  cost = base_fare + price_per_km * distance_km
  print(f"Delivery cost: S/ {cost}")
hints:
  - Multiplication goes before addition, just like at school.
  - "`cost = base_fare + price_per_km * distance_km`"
tests:
  - name: cost is 13
    expect: cost == 13
  - name: the console shows the cost
    output: "Delivery cost: S/ 13.0"
  - name: the total is computed from variables, not by hand
    source: '^cost\s*=\s*[a-z_]\w*\s*[+*]'
    msg: Compute cost from your variables; don't write 13 directly.
  - name: names in snake_case
    sourceNot: '^\s*[a-z]+[A-Z]\w*\s*='
    msg: In Python, names are snake_case, like base_fare, not baseFare.
```

```exercise
id: py1-escribe-salida
type: write
title: The first lap
prompt: |
  Take Quilla to the mailbox (D) and make it say `Hello, I'm Quilla` with `robot.say()`, building the text with an f-string and the variable `name`.

  It's the test lap along the pier. Quilla starts facing east.

  What Quilla understands today: `robot.forward(n)`, `robot.turn_left()`, `robot.turn_right()` and `robot.say(text)`. Press **Run** and watch the map.
starter: |
  name = "Quilla"
  robot.forward(1)
solution: |
  name = "Quilla"
  robot.forward(1)
  robot.turn_right()
  robot.forward(2)
  robot.turn_left()
  robot.forward(3)
  robot.say(f"Hello, I'm {name}")
hints:
  - Count the free squares of each stretch with your finger. Facing east, turning right leaves you facing south.
  - "`robot.say(f\"Hello, I'm {name}\")`"
world:
  theme: barranco
  level: 1
  dir: E
  map: |
    #######
    #R.####
    ##.####
    ##...D#
    #######
tests:
  - name: Quilla reaches the mailbox
    state: w.at_goal
    msg: Quilla didn't end on the mailbox.
  - name: says "Hello, I'm Quilla"
    state: '"Hello, I''m Quilla" in w.said'
    msg: Make it say exactly "Hello, I'm Quilla".
  - name: the greeting uses an f-string
    source: '\bf"[^"]*\{name\}'
    msg: Build the greeting with f"…{name}…".
```

## The case

```exercise
id: py1-caso-balanza
type: case
title: The market scale
prompt: |
  **Work out how much each robot should have charged (kilos × price per kilo) and compare it with what it charged.** The one that doesn't match is overcharging.

  In the Callao's Central Market, four stalls have robots that weigh and charge on their own. A regular customer complained to Maru: "they overcharged me". Each stall's scale prints the weight **as text** (`"2.5"`), so you'll have to convert it before multiplying.

  Print one line per robot starting with its name, for example `print("Tumi:", tumi_charge)`, and the board will tell you whether it matches.
visual:
  board:
    for: py1-caso-balanza
    task: "What it should have charged = kilos × price per kilo. Compare it with what each robot charged."
    cards:
      - name: Tumi
        kind: robot
        role: Fruit stall
        with: { name: Señora Elsa, kind: person, label: sold to Señora Elsa }
        rows: [["Product", "limes"], ["The scale showed", "2.5 kg"], ["Charged", "S/ 10"]]
        clue: { find: "Tumi", says: 10, saysLabel: Charged }
      - name: Chalaco
        kind: robot
        role: Fish stall
        with: { name: Don Beto, kind: person, label: sold to Don Beto }
        rows: [["Product", "bonito"], ["The scale showed", "1.5 kg"], ["Charged", "S/ 21"]]
        clue: { find: "Chalaco", says: 21, saysLabel: Charged }
      - name: Piqui
        kind: robot
        role: Potato stall
        culprit: true
        with: { name: Caserita Nelly, kind: person, label: sold to caserita Nelly }
        rows: [["Product", "yellow potatoes"], ["The scale showed", "4 kg"], ["Charged", "S/ 16"]]
        clue: { find: "Piqui", says: 16, saysLabel: Charged }
      - name: Ronco
        kind: robot
        role: Chili stall
        with: { name: Young Iván, kind: person, label: sold to young Iván }
        rows: [["Product", "ají amarillo"], ["The scale showed", "0.75 kg"], ["Charged", "S/ 9"]]
        clue: { find: "Ronco", says: 9, saysLabel: Charged }
      - name: Today's prices
        kind: note
        role: The market's blackboard
        rows: [["Limes (kilo)", "S/ 4"], ["Bonito (kilo)", "S/ 14"], ["Yellow potatoes (kilo)", "S/ 3.50"], ["Ají amarillo (kilo)", "S/ 12"]]
starter: |
  # What each stall's scale showed, in kilos (as text!)
  tumi_weight = "2.5"     # limes
  chalaco_weight = "1.5"  # bonito
  piqui_weight = "4"      # yellow potatoes
  ronco_weight = "0.75"   # ají amarillo

  # Price per kilo, in soles
  lime_price = 4
  bonito_price = 14
  potato_price = 3.5
  chili_price = 12

  # TODO: work out how much each robot should have charged
  # and print one line per robot, for example:
  # print("Tumi:", tumi_charge)
solution: |
  tumi_weight = "2.5"
  chalaco_weight = "1.5"
  piqui_weight = "4"
  ronco_weight = "0.75"

  lime_price = 4
  bonito_price = 14
  potato_price = 3.5
  chili_price = 12

  tumi_charge = float(tumi_weight) * lime_price
  chalaco_charge = float(chalaco_weight) * bonito_price
  piqui_charge = float(piqui_weight) * potato_price
  ronco_charge = float(ronco_weight) * chili_price
  print("Tumi:", tumi_charge)
  print("Chalaco:", chalaco_charge)
  print("Piqui:", piqui_charge)
  print("Ronco:", ronco_charge)
answer: Piqui
answerLabel: Which robot overcharged?
reveal: |
  Piqui. Four kilos of yellow potatoes at S/ 3.50 are `4.0 * 3.5 = 14.0`, and it charged 16: two soles too much. The other three match: 10, 21 and 9.
hints:
  - "The first one, as an example: `tumi_charge = float(tumi_weight) * lime_price` gives 10.0, the same as Tumi charged. Do the same with the other three."
  - Without `float()`, multiplying a text by a number doesn't do arithmetic: it repeats the text or raises a `TypeError`.
```

## The judge

A judge is like the ones in programming contests: your program **reads an input** and **writes an output**, and the judge tests it with the examples in the statement and with dozens of hidden cases. In Python you don't need special functions: you use the usual ones.

- `input()` reads **the next line** of the input and returns it **as text**, even if it holds a number. Each call reads a new line.
- To use it as a number, convert it: `int(input())` or `float(input())`.
- If a line holds several numbers separated by spaces, `input().split()` gives you the list of their texts; you'll use that later on.

The answer is written with `print`, in exactly the format the statement asks for: not one extra space or word.

```exercise
id: py1-juez-monedas
type: judge
title: Change in coins
prompt: |
  **Print how many 5-sol coins, how many 1-sol coins and how many céntimos are left, on a single line.**

  Don Teodoro gave Quilla a piggy bank for change, and he wants it always handed over with as few big coins as possible: first as many **5-sol** coins as it can, then **1-sol** coins, and whatever remains in céntimos. Quilla gets the change in céntimos (1 sol is 100 céntimos).

  **Input:** one line with an integer `C`: the change in céntimos.

  **Output:** one line with three integers separated by a space: the 5-sol coins, the 1-sol coins and the céntimos left over.

  **Constraints:** 0 ≤ C ≤ 100000.
starter: |
  cents = int(input())
  # work out the 5-sol coins, the 1-sol coins and what's left

  print(cents)
solution: |
  cents = int(input())
  five_sol_coins = cents // 500
  rest = cents % 500
  sol_coins = rest // 100
  left_over = rest % 100
  print(five_sol_coins, sol_coins, left_over)
hints:
  - A 5-sol coin is 500 céntimos. `cents // 500` says how many fit and `cents % 500` how much is left afterwards.
  - With what's left, do the same with 100 (a 1-sol coin). Whatever remains at the end are the céntimos.
visual:
  figure:
    title: Example 1, coin by coin
    panes:
      - label: Input
        text: "1287"
      - label: How it's split
        table:
          head: ["Coin", "Calculation", "How many"]
          rows: [["S/ 5", "1287 // 500", "2"], ["S/ 1", "287 // 100", "2"], ["céntimos", "287 % 100", "87"]]
      - label: Output
        text: "2 2 87"
    caption: "After the two 5-sol coins, `1287 % 500 = 287` céntimos are left to split."
samples:
  - input: "1287"
    output: "2 2 87"
    note: Two 5-sol coins (1000), two 1-sol coins (200) and 87 céntimos left over.
  - input: "350"
    output: "0 3 50"
    note: Not enough for a 5-sol coin.
edge:
  - input: "0"
    tag: when there is no change
  - input: "500"
    tag: with exactly one 5-sol coin
  - input: "499"
    tag: just short of a 5-sol coin
  - input: "99"
    tag: with only céntimos
  - input: "100000"
    tag: with the largest change
random:
  count: 40
  seed: 21
  tag: ""
  generate: |
    if rng.int(0, 1) == 0:
        return str(rng.int(0, 999))
    return str(rng.int(0, 100000))
wrong:
  - |
    cents = int(input())
    five_sol_coins = cents / 500
    rest = cents % 500
    sol_coins = rest / 100
    left_over = rest % 100
    print(five_sol_coins, sol_coins, left_over)
  - |
    cents = int(input())
    five_sol_coins = cents // 500
    sol_coins = cents // 100
    left_over = cents % 100
    print(five_sol_coins, sol_coins, left_over)
  - |
    cents = int(input())
    five_sol_coins = cents // 500
    sol_coins = cents % 500 // 100
    left_over = cents % 500
    print(five_sol_coins, sol_coins, left_over)
```

## Final mission

```exercise
id: py1-mision-alfajores
type: mission
title: The alfajores de penca
prompt: |
  **Build the order label and take Quilla to the mailbox of Don Teodoro's comadre to deliver it.**

  Quilla leaves the shop (top left) with **just enough battery: 14 squares**. The mailbox is across from the Alameda de los Descalzos. If it takes a detour, it runs out halfway.

  1. Build in `label` the text `Order 14: 2 boxes for Lucía Huamán` with an f-string and the variables `order`, `boxes` and `customer`.
  2. Take Quilla to the mailbox and deliver with `robot.deliver(label)`.

  Once it passes, together with the judge, session 2 unlocks.
starter: |
  customer = "Lucía Huamán"
  order = 14
  boxes = 2
  label = ""

  robot.forward(4)
solution: |
  customer = "Lucía Huamán"
  order = 14
  boxes = 2
  label = f"Order {order}: {boxes} boxes for {customer}"

  robot.forward(4)
  robot.turn_right()
  robot.forward(2)
  robot.turn_left()
  robot.forward(4)
  robot.turn_left()
  robot.forward(1)
  robot.turn_right()
  robot.forward(3)
  robot.deliver(label)
hints:
  - "Trace the path with your finger: east, south, east, north and east again. Count the squares of each stretch; the lower path is longer and the battery won't last."
  - Facing south, turning left leaves you facing east; facing east, turning left leaves you facing north.
world:
  theme: barranco
  level: 1
  dir: E
  battery: 14
  map: |
    ###############
    #R....#########
    #####.###...D##
    #####.....#.###
    #..##.###...###
    ###############
tests:
  - name: 'the label is "Order 14: 2 boxes for Lucía Huamán"'
    expect: 'label == "Order 14: 2 boxes for Lucía Huamán"'
  - name: the label is built with an f-string
    source: '\bf"[^"]*\{order\}[^"]*\{boxes\}[^"]*\{customer\}'
    msg: Use an f-string, f"…{order}…{boxes}…{customer}", to build the label.
  - name: Quilla reaches the mailbox
    state: w.at_goal
    msg: Quilla didn't end on the comadre's mailbox.
  - name: delivers the package with its label
    state: 'w.delivered == ["Order 14: 2 boxes for Lucía Huamán"]'
    msg: Missing robot.deliver(label) once, standing on the mailbox.
```

## Expert challenge

```exercise
id: py1-reto-reloj
type: challenge
title: Quilla's internal clock
visual:
  figure:
    title: From minutes to day and time
    input: { label: minutes, text: "4000" }
    arrow: "// 1440 for the day, then // 60 and % 60"
    output: { label: Output, value: "Day 3, 18:40" }
    steps:
      - "A day has 24 × 60 = 1440 minutes: `4000 // 1440` is 2 full days, so it's day 3."
      - "What's left of the day, `4000 % 1440`, is 1120 minutes: 18 hours and 40 minutes."
prompt: |
  **Print the internal clock's time as `Day N, HH:MM`.** For people who already code. Quilla has no calendar: it only counts the minutes since Maru switched it on, on day 1 at 00:00. Turn `minutes` into the day (starting at 1) and the time of day, with hours and minutes always two digits.

  With `minutes = 4000` it must print `Day 3, 18:40`; with `minutes = 125`, `Day 1, 02:05`. The variable `minutes` comes from the clock and changes on every test.
starter: |
  # minutes already exists
  print(minutes)
solution: |
  minutes_per_day = 24 * 60
  day = minutes // minutes_per_day + 1
  minute_of_day = minutes % minutes_per_day
  hours = minute_of_day // 60
  minute = minute_of_day % 60
  print(f"Day {day}, {hours:02d}:{minute:02d}")
hints:
  - "`//` and `%` do all the work: first with the minutes in a day, then with 60."
  - "Inside an f-string, `{hours:02d}` writes the integer with at least two digits, padding with zeros."
globals:
  minutes: 4000
scenarios:
  - tests:
      - name: 4000 minutes
        output: Day 3, 18:40
  - globals: { minutes: 125 }
    tests:
      - name: 125 minutes (with leading zeros)
        output: Day 1, 02:05
  - globals: { minutes: 0 }
    tests:
      - name: just switched on
        output: Day 1, 00:00
  - globals: { minutes: 1439 }
    tests:
      - name: the last minute of the first day
        output: Day 1, 23:59
  - globals: { minutes: 1440 }
    tests:
      - name: right at the start of day 2
        output: Day 2, 00:00
  - globals: { minutes: 10085 }
    tests:
      - name: a week later
        output: Day 8, 00:05
```
