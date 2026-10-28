# Session 16 — Errors and exceptions

## The job

Paita, Piura, five in the afternoon. In the port's customs warehouse, containers of mango, frozen jumbo squid, scallops and coffee from Jaén are stacked up waiting for their ship. Don **Eleodoro Querevalú**, head of the warehouse since the days of carbon paper, has a problem: the program that reads the manifests never crashes. Never. And that, Maru explained to him over the phone, is exactly what's wrong.

Someone put an `except: pass` in it "so it doesn't get in the way", and ever since then every odd line vanishes without a trace: a mistyped weight, a product that isn't in the rate list, a whole container. Maru sent Quilla, with its freshly calibrated siren, to do things properly: errors should **be seen**, each one should have its own name, and the program should know which ones it can fix and which it can't.

```scene
theme: barranco
level: 2
dir: E
items: { c: container }
caption: The Paita warehouse's dock. Quilla weighs each container with the crane (sometimes busy) and takes the list of released ones to the office (D).
map: |
  ##############
  #R..........D#
  ###c##c##c####
  ##############
program: |
  robot.forward(2)
  robot.say("MSKU-4410: 18400 kg")
  robot.forward(3)
  robot.say("Crane busy… again")
  robot.say("HLXU-7702: 21000 kg")
  robot.forward(6)
  robot.deliver("Released: MSKU-4410, HLXU-7702")
```

## The minimum

When something goes wrong, Python **raises an exception**: an object with a type (`ValueError`, `KeyError`…) and a message. If nobody catches it, the program stops. With **`try` / `except`** you catch it and decide what to do:

```py run
for text in ["18400", "12,5"]:
    try:
        weight = int(text)
    except ValueError as error:
        print("flagged:", error)
    else:
        print("weighed:", weight)
    finally:
        print("scale free")
```

- **`try`**: the code that may fail. Keep it short: only what can really raise.
- **`except Type as error`**: runs if the code above raised that type (or one that **inherits** from it). Several types go in a tuple: `except (ValueError, KeyError):`.
- **`else`**: runs only if there was **no** error. **`finally`**: runs **always**, whether there was an error, a `return` or anything else: the place to release the crane or close the gate.

Watch the jump: when `int` fails inside `weigh`, the function stops at that line, its box leaves the stack and the program lands in the `except` of whoever called it.

```anim
title: An exception jumps to the except
code: |
  def weigh(text):
      return int(text)

  readings = ["18400", "12,5", "9000"]
  total = 0
  for text in readings:
      try:
          total += weigh(text)
      except ValueError:
          print("flagged:", text)
  print(total)
cells: { of: readings, at: text }
notes:
  2: "With \"12,5\", int raises ValueError right here: there's no return."
  9: "The error came up from weigh and this except catches it. The loop goes on with the next reading."
  11: "Only the two good readings were added."
```

An exception doesn't stay where it's born: it **leaves the call and climbs up**, call by call, until someone catches it. Watch it cross three calls up to the `try` in `main`, and what happens if there is none:

```anim
title: An exception crosses several calls until it finds an except
code: |
  def read(text):
      return int(text)

  def weigh(text):
      return read(text) * 2

  def main():
      try:
          print(weigh("12,5"))
      except ValueError as error:
          print("noted:", error)

  main()
steps:
  - { line: 13, vars: {}, stack: [{ name: main, args: '' }], note: "`main` starts. It has a `try`: an exception raised further down can be caught here." }
  - { line: 9, vars: {}, stack: [{ name: main, args: '' }, { name: weigh, args: 'text = "12,5"' }], note: "`main` calls `weigh`: two calls stacked up." }
  - { line: 5, vars: {}, stack: [{ name: main, args: '' }, { name: weigh, args: 'text = "12,5"' }, { name: read, args: 'text = "12,5"' }], note: "`weigh` calls `read`: now there are three. The top one is the one running." }
  - { line: 2, vars: {}, stack: [{ name: main, args: '' }, { name: weigh, args: 'text = "12,5"' }, { name: read, args: 'text = "12,5"', err: 'ValueError' }], note: "`int('12,5')` raises `ValueError`: the call to `read` stops here, without returning anything. It looks for an `except` in the same function: there is none." }
  - { line: 5, vars: {}, stack: [{ name: main, args: '' }, { name: weigh, args: 'text = "12,5"', err: 'keeps rising' }], note: "With no `except`, the exception **leaves the call** and goes up to whoever made it: `weigh`. There is no `except` there either: its `* 2` never runs and it stops too." }
  - { line: 10, vars: { error: "ValueError: invalid literal for int() with base 10: '12,5'" }, stack: [{ name: main, args: '' }], note: "Climbing up to `main`, the exception finds the `try`: it jumps straight to `except ValueError`. `weigh` and `read` no longer exist." }
  - { line: 11, vars: { error: "ValueError: invalid literal for int() with base 10: '12,5'" }, stack: [{ name: main, args: '' }], out: "noted: invalid literal for int() with base 10: '12,5'", note: "The `except` handles it and the program carries on normally." }
```

```anim
title: With no except, the exception reaches the top and the program stops
code: |
  def read(text):
      return int(text)

  def weigh(text):
      return read(text) * 2

  print(weigh("12,5"))
  print("this never prints")
steps:
  - { line: 7, vars: {}, stack: [{ name: weigh, args: 'text = "12,5"' }, { name: read, args: 'text = "12,5"' }], note: "The same calls, but this time nobody wraps them in a `try`." }
  - { line: 2, vars: {}, stack: [{ name: weigh, args: 'text = "12,5"' }, { name: read, args: 'text = "12,5"', err: 'ValueError' }], note: "`int('12,5')` raises `ValueError`." }
  - { line: 5, vars: {}, stack: [{ name: weigh, args: 'text = "12,5"', err: 'keeps rising' }], note: "It climbs to `weigh`, which does not catch it either." }
  - { line: 7, vars: {}, stack: [], out: "Traceback (most recent call last):\n  File \"program.py\", line 7, in <module>\n  File \"program.py\", line 5, in weigh\n  File \"program.py\", line 2, in read\nValueError: invalid literal for int() with base 10: '12,5'", note: "The stack emptied without finding an `except`: the program **stops** and the traceback lists the calls the exception went through, from the first to the last. Line 8 never runs." }
```

**Raising your own errors.** `raise ValueError("message")` stops the function and warns whoever called it. For your business's errors, create a **hierarchy** of classes that inherit from `Exception`: that way an `except` can catch just one of them or a whole family.

```py run
class CustomsError(Exception):
    """Any problem with a container."""

class BrokenSeal(CustomsError):
    """The container's seal isn't intact."""

try:
    raise BrokenSeal("MSKU-4410")
except CustomsError as error:
    print(type(error).__name__, error, isinstance(error, BrokenSeal))
```

**`raise … from`.** When you translate a technical error into one of your business's, chain them: `raise MissingManifest(code) from error` keeps the original `KeyError` in `__cause__`, and the traceback shows both.

**Asking forgiveness or asking permission.** *LBYL* (look before you leap) asks first: `if code in manifests:`. *EAFP* (it's easier to ask forgiveness than permission) tries it and catches the error: `try: manifests[code]` / `except KeyError:`. Python prefers EAFP when the odd case is rare, because it doesn't repeat the lookup and nothing slips through between the question and the use. For the robot it's the other way round: its errors (hitting a wall, running out of battery) **aren't `Exception`s**, not even `except Exception` hides them, and a crash is a crash. There, look first with `robot.wall_ahead()`.

**`assert condition, "message"`** checks something that **your own code** guarantees (`assert total >= 0`); if it fails, it's your bug and it raises `AssertionError`. It doesn't validate outside data: Python can run with the `assert`s switched off.

**Many errors at once.** So as not to stop at the first one, gather them in an **`ExceptionGroup`** and handle them with **`except*`**: each `except*` gets a group with the ones of its type, and several can run.

```py run
try:
    raise ExceptionGroup("HLXU-7702", [ValueError("kilos"), KeyError("squid"), ValueError("date")])
except* ValueError as group:
    print("bad values:", len(group.exceptions))
except* KeyError as group:
    print("missing keys:", group.exceptions)
```

> **Common trap:** a bare `except:`, or `except Exception: pass`, catches **everything**: the mistyped weight you expected, but also your `NameError` from a misspelled name, your `KeyError` from a product nobody registered, any bug. The program "doesn't crash" and nobody finds out what happened. Catch only the types you know how to handle, and if you catch something, **write it down**.

<!-- legacy: exception-as -->

<!-- legacy: raise-from -->

<!-- mdn: exception-as raise-from except-star -->

## Practice

```exercise
id: py16-predice-finally
type: predict
title: The scale that always gets released
prompt: |
  `weigh` has `try`, `except`, `else` and `finally`, and two of them `return`. Before running it: what does it print?
code: |
  def weigh(text):
      try:
          weight = int(text)
      except ValueError:
          print("flagged")
          return 0
      else:
          print("weighed")
          return weight
      finally:
          print("scale free")

  print(weigh("18400") + weigh("12,5"))
options:
  - "weighed\nscale free\nflagged\nscale free\n18400"
  - "weighed\nflagged\n18400"
  - "weighed\nscale free\nflagged\n18400"
  - "weighed\nflagged\nscale free\n18400"
answer: "weighed\nscale free\nflagged\nscale free\n18400"
explain: |
  Every call goes through its `finally`, even with a `return` already on its way: the `return` waits for `finally` to finish. The first call prints `weighed` (there was no error, `else` runs), the second `flagged`, and both release the scale. At the end `18400 + 0` is added up.
```

```exercise
id: py16-predice-jerarquia
type: predict
title: The except that got there first
prompt: |
  `BrokenSeal` inherits from `CustomsError`. Python tries the `except`s from top to bottom and enters the **first** one that fits. What does it print?
visual:
  figure:
    panes:
      - { label: the family, table: { head: ["class", "inherits from"], rows: [["CustomsError", "Exception"], ["BrokenSeal", "CustomsError"]] } }
code: |
  class CustomsError(Exception):
      pass

  class BrokenSeal(CustomsError):
      pass

  def check(seal):
      if seal != "intact":
          raise BrokenSeal(seal)
      return "ok"

  for seal in ["intact", "cut"]:
      try:
          print(check(seal))
      except CustomsError:
          print("customs")
      except BrokenSeal:
          print("seal")
options:
  - "ok\ncustoms"
  - "ok\nseal"
  - "ok\ncustoms\nseal"
  - "customs\nseal"
answer: "ok\ncustoms"
explain: |
  A `BrokenSeal` **is also** a `CustomsError`, so the first `except` catches it and the second never gets to run. Always put the most specific types at the top and the whole family at the bottom.
```

```exercise
id: py16-completa-manifiesto
type: complete
title: The container with no manifest
prompt: |
  `declared_weight(code)` looks up the weight in the manifests dictionary EAFP-style: it tries and, if the key isn't there, translates the `KeyError` into a warehouse error, **chained** with `from` so the cause isn't lost. Fill in the `___`.
starter: |
  class CustomsError(Exception):
      """Any problem with a container."""

  class MissingManifest(___):
      """The container has no manifest."""

  manifests = {"MSKU-4410": 18400, "HLXU-7702": 21000}

  def declared_weight(code):
      try:
          return manifests[code]
      except ___ as error:
          ___ MissingManifest(f"{code} has no manifest") ___ error

  try:
      declared_weight("SUDU-5150")
  except CustomsError as error:
      print("Held:", error, "| cause:", repr(error.__cause__))
solution: |
  class CustomsError(Exception):
      """Any problem with a container."""

  class MissingManifest(CustomsError):
      """The container has no manifest."""

  manifests = {"MSKU-4410": 18400, "HLXU-7702": 21000}

  def declared_weight(code):
      try:
          return manifests[code]
      except KeyError as error:
          raise MissingManifest(f"{code} has no manifest") from error

  try:
      declared_weight("SUDU-5150")
  except CustomsError as error:
      print("Held:", error, "| cause:", repr(error.__cause__))
hints:
  - "`MissingManifest` is part of the `CustomsError` family. A dictionary without the key raises `KeyError`."
  - "The whole line is `raise MissingManifest(...) from error`."
tests:
  - name: prints the error and its cause
    output: "Held: SUDU-5150 has no manifest | cause: KeyError('SUDU-5150')"
  - name: MissingManifest is a CustomsError
    expect: issubclass(MissingManifest, CustomsError)
  - name: a code with a manifest returns its kilos
    run: declared_weight("MSKU-4410")
    equals: 18400
  - name: chains with from
    source: 'raise\s+MissingManifest\([\s\S]*\)\s*from\s+error'
```

```exercise
id: py16-arregla-porton
type: fix
title: The gate that was left open
prompt: |
  `pass_truck` opens the gate, logs the truck's weight and closes it. When the weight is mistyped, `int` raises `ValueError`, the outside program catches it… and the gate stays **open** all night. Run it.

  Fix it **inside `pass_truck`**: the gate always closes, error or not, and the error **keeps going up** to the outside `except` (don't catch it inside).
visual:
  figure:
    panes:
      - { label: trucks, table: { head: ["plate", "kilos"], rows: [["P1A-234", "\"28000\""], ["T2B-871", "\"31000\""], ["M4D-502", "\"twenty thousand\""]] } }
      - { label: should end, value: "Gate closed" }
starter: |
  gate = {"state": "closed"}
  log = []

  def pass_truck(plate, weight_text):
      gate["state"] = "open"
      log.append((plate, int(weight_text)))
      gate["state"] = "closed"

  for plate, weight in [("P1A-234", "28000"), ("T2B-871", "31000"), ("M4D-502", "twenty thousand")]:
      try:
          pass_truck(plate, weight)
      except ValueError:
          print("Flagged:", plate)
  print("Gate", gate["state"])
solution: |
  gate = {"state": "closed"}
  log = []

  def pass_truck(plate, weight_text):
      gate["state"] = "open"
      try:
          log.append((plate, int(weight_text)))
      finally:
          gate["state"] = "closed"

  for plate, weight in [("P1A-234", "28000"), ("T2B-871", "31000"), ("M4D-502", "twenty thousand")]:
      try:
          pass_truck(plate, weight)
      except ValueError:
          print("Flagged:", plate)
  print("Gate", gate["state"])
hints:
  - When `int` fails, the line that closes the gate never gets to run.
  - "`try:` around the `log.append(...)` and `finally:` with the line that closes it. No `except`: the error has to keep going up."
tests:
  - name: the flagged truck and the gate closed
    output: "Flagged: M4D-502\nGate closed"
  - name: the two good trucks were logged
    expect: 'log == [("P1A-234", 28000), ("T2B-871", 31000)]'
  - name: uses finally
    source: '\bfinally\s*:'
  - name: doesn't catch the error inside pass_truck
    sourceNot: 'def\s+pass_truck[\s\S]*?except[\s\S]*?\nfor\b'
    msg: Let the ValueError go up; the outside except is the one that writes it down.
```

```exercise
id: py16-escribe-precinto
type: write
title: The well-written seal
prompt: |
  Every container travels with a numbered seal. Write:

  - `class CustomsError(Exception)` and `class InvalidSeal(CustomsError)`, each with its docstring;
  - `validate_seal(text)`: strip the spaces at the edges and convert to uppercase; if the result is `"PE-"` followed by **exactly 6 digits**, return it; if not, **raise** `InvalidSeal` with the original text as the message.

  `attempt` is already written: it returns the seal, or the name of the error you raised.
visual:
  figure:
    panes:
      - { label: goes in, cells: ["\" pe-004512 \"", "\"PE-12\"", "\"XX-004512\""] }
      - { label: attempt returns, cells: ["\"PE-004512\"", "\"InvalidSeal\"", "\"InvalidSeal\""] }
starter: |
  # write CustomsError, InvalidSeal and validate_seal here


  def attempt(text):
      """The validated seal, or the name of the error it raised."""
      try:
          return validate_seal(text)
      except CustomsError as error:
          return type(error).__name__

  print(attempt(" pe-004512 "), attempt("PE-12"))
solution: |
  class CustomsError(Exception):
      """Any problem with a container."""

  class InvalidSeal(CustomsError):
      """The seal doesn't have the form PE-123456."""

  def validate_seal(text):
      seal = text.strip().upper()
      number = seal[3:]
      if not seal.startswith("PE-") or len(number) != 6 or not number.isdigit():
          raise InvalidSeal(text)
      return seal


  def attempt(text):
      """The validated seal, or the name of the error it raised."""
      try:
          return validate_seal(text)
      except CustomsError as error:
          return type(error).__name__

  print(attempt(" pe-004512 "), attempt("PE-12"))
hints:
  - "`seal[3:]` is what comes after `PE-`; `.isdigit()` says whether they're all digits."
  - "If something doesn't fit: `raise InvalidSeal(text)`. If everything fits, `return seal`."
tests:
  - name: cleans and returns a good seal
    run: attempt(" pe-004512 ")
    equals: PE-004512
  - name: too short
    run: attempt("PE-12")
    equals: InvalidSeal
  - name: another prefix
    run: attempt("XX-004512")
    equals: InvalidSeal
  - name: letters where digits go
    run: attempt("PE-00451A")
    equals: InvalidSeal
  - name: seven digits
    run: attempt("PE-0045123")
    equals: InvalidSeal
  - name: the message is the original text
    expect: 'str(InvalidSeal("pe-1")) == "pe-1" and issubclass(InvalidSeal, CustomsError)'
  - name: raises the error with raise
    source: 'raise\s+InvalidSeal\('
```

```exercise
id: py16-predice-grupo
type: predict
title: Three problems in a single container
prompt: |
  The inspection of container HLXU-7702 didn't stop at the first problem: it gathered them all in an `ExceptionGroup`. What does it print?
code: |
  errors = [ValueError("kilos"), KeyError("squid"), ValueError("date")]
  try:
      raise ExceptionGroup("HLXU-7702", errors)
  except* KeyError as group:
      print("keys:", len(group.exceptions))
  except* ValueError as group:
      print("values:", len(group.exceptions))
  print("done")
options:
  - "keys: 1\nvalues: 2\ndone"
  - "keys: 1\ndone"
  - "values: 2\nkeys: 1\ndone"
  - "keys: 3\ndone"
answer: "keys: 1\nvalues: 2\ndone"
explain: |
  Unlike `except`, **every** `except*` that fits runs, in the order they're written: the first one takes the `KeyError`, the second the two `ValueError`s. Since no error was left unhandled, the program carries on and reaches `done`.
```

## The case

```exercise
id: py16-caso-escondido
type: case
title: The error someone hid
prompt: |
  **Recount how many lines with a typing error each clerk had, catching only `ValueError`, and find the container that the `except: pass` made disappear.**

  Each manifest line is `code;product;kilos`. The old program did this with each one, and Don Eleodoro found out that a container left the warehouse without paying:

  ```py
  try:
      code, product, kilos = line.split(";")
      total += rates[product] * int(kilos)
  except:
      pass
  ```

  A **typing error** is a line whose kilos aren't a number or that has too few fields: both raise `ValueError`, and those lines get checked by hand later. Each clerk reported how many their shift had. But `except:` swallowed something else too.

  Catch `ValueError` on one side and the other error on the other, and print one line per clerk that starts with their name, for example `print("Yovana:", len(typos))`.
visual:
  board:
    for: py16-caso-escondido
    task: "Typing errors = lines that raise ValueError. Whatever raises something else isn't a typing error."
    cards:
      - name: Yovana
        kind: person
        role: Morning shift clerk
        rows: [["Lines", "4"], ["Reported as typos", "1"]]
        clue: { find: "Yovana", says: 1 }
      - name: Wilder
        kind: person
        role: Afternoon shift clerk
        culprit: true
        rows: [["Lines", "4"], ["Said", "\"two of them came out wrong, I'll fix them\""], ["Reported as typos", "2"]]
        clue: { find: "Wilder", says: 2 }
      - name: Lucy
        kind: person
        role: Night shift clerk
        rows: [["Lines", "4"], ["Reported as typos", "2"]]
        clue: { find: "Lucy", says: 2 }
      - name: The rates
        kind: note
        role: Céntimos per kilo
        rows: [["mango", "3"], ["lime", "2"], ["banana", "1"], ["squid", "7"], ["scallops", "15"], ["coffee", "9"]]
starter: |
  rates = {"mango": 3, "lime": 2, "banana": 1, "squid": 7, "scallops": 15, "coffee": 9}

  shifts = {
      "Yovana": ["MSKU-4410;mango;18400", "TGHU-2207;lime;12,5",
                 "MSKU-4413;mango;19100", "CMAU-0981;banana;20500"],
      "Wilder": ["HLXU-7702;squid;21000", "HLXU-7703;squid;2l000",
                 "SUDU-5150;prawns;22300", "HLXU-7705;scallops;8000"],
      "Lucy": ["CMAU-1120;coffee;15000", "CMAU-1121;coffee",
               "TGHU-2290;banana;20 400", "CMAU-1122;coffee;14800"],
  }

  # TODO: for each clerk, go through their lines with try:
  #   except ValueError  → it's a typing error, write it down
  #   except KeyError    → it's not a typo: print it to see it
  # and at the end of each shift: print("Yovana:", len(typos))
solution: |
  rates = {"mango": 3, "lime": 2, "banana": 1, "squid": 7, "scallops": 15, "coffee": 9}

  shifts = {
      "Yovana": ["MSKU-4410;mango;18400", "TGHU-2207;lime;12,5",
                 "MSKU-4413;mango;19100", "CMAU-0981;banana;20500"],
      "Wilder": ["HLXU-7702;squid;21000", "HLXU-7703;squid;2l000",
                 "SUDU-5150;prawns;22300", "HLXU-7705;scallops;8000"],
      "Lucy": ["CMAU-1120;coffee;15000", "CMAU-1121;coffee",
               "TGHU-2290;banana;20 400", "CMAU-1122;coffee;14800"],
  }

  for clerk, lines in shifts.items():
      typos = []
      for line in lines:
          try:
              code, product, kilos = line.split(";")
              charge = rates[product] * int(kilos)
          except ValueError:
              typos.append(line)
          except KeyError as error:
              print("No rate:", line, repr(error))
      print(f"{clerk}: {len(typos)}")
answer: SUDU-5150
answerLabel: Which container did the except hide?
reveal: |
  SUDU-5150. Its product, `prawns`, isn't in the rate list: `rates["prawns"]` raises `KeyError`, not `ValueError`. The old program's `except:` treated it just like a typing error and wiped it from the bill, so the container left without paying. Wilder counted it among his "two mistyped lines", but he only had one typo, the `2l000` with an L. With `except ValueError` on one side and `except KeyError` on the other, the prawns show up all by themselves.
hints:
  - "Inside the `try`, `code, product, kilos = line.split(\";\")` and `rates[product] * int(kilos)`. A line with two fields already fails on the first one."
  - "Use two `except`s: `ValueError` goes to the `typos` list; `KeyError` you print with the line to see which container it is."
```

## The judge

As since session 4, the judge calls your function and compares what it **returns**. An exception that escapes your function is a runtime error: here errors are **returned as data**.

```exercise
id: py16-juez-manifiesto
type: judge
mode: function
function: check_manifest
title: The manifest line by line
prompt: |
  **Write `check_manifest(lines, rates)`, which returns `(total, errors)`: what is charged for the good lines, in céntimos, and the list of bad lines as `(line_number, error_name)` pairs.**

  Each line is `code;product;kilos` and is charged `rates[product] * kilos`. Check it in this order, which is exactly what happens if you write the code in that order:

  1. `code, product, kilos = line.split(";")`: if there aren't exactly 3 fields, it's `ValueError`.
  2. `rates[product]`: if the product isn't there, it's `KeyError`.
  3. `int(kilos)`: if it isn't an integer, it's `ValueError`; and if it's 0 or negative, **raise it yourself**: `raise ValueError(...)`.

  Lines are numbered **from 1**. A bad line doesn't stop the check: write down `(number, type(error).__name__)` and go on with the next one. Catch **only** `ValueError` and `KeyError`.

  **Constraints:** 0 to 12 lines · rates from 1 to 15 céntimos per kilo.
visual:
  figure:
    title: Example 1, line by line
    input: { label: lines, table: { head: ["#", "line", "result"], rows: [["1", "MSKU-4410;mango;18400", "18400 × 3"], ["2", "TGHU-2207;limón;12,5", "ValueError"], ["3", "SUDU-5150;langostino;300", "KeyError"], ["4", "CMAU-1120;café;-50", "ValueError (you raise it)"], ["5", "HLXU-7702;pota;1000", "1000 × 7"]] } }
    arrow: adds up the good ones, writes down the bad ones
    output: { label: returns, text: "(62200, [(2, \"ValueError\"), (3, \"KeyError\"), (4, \"ValueError\")])" }
starter: |
  def check_manifest(lines, rates):
      return (0, [])
solution: |
  def charge_line(line, rates):
      """What is charged for one line; raises ValueError or KeyError if it's bad."""
      code, product, weight = line.split(";")
      rate = rates[product]
      weight = int(weight)
      if weight <= 0:
          raise ValueError(f"{code}: {weight} kilos")
      return rate * weight


  def check_manifest(lines, rates):
      total = 0
      errors = []
      for number, line in enumerate(lines, start=1):
          try:
              total += charge_line(line, rates)
          except (ValueError, KeyError) as error:
              errors.append((number, type(error).__name__))
      return (total, errors)
hints:
  - "Write a helper `charge_line(line, rates)` that does the three steps and raises; `check_manifest` just calls it inside a `try`."
  - "`for number, line in enumerate(lines, start=1):` gives you the line number from 1."
samples:
  - args: [["MSKU-4410;mango;18400", "TGHU-2207;limón;12,5", "SUDU-5150;langostino;300", "CMAU-1120;café;-50", "HLXU-7702;pota;1000"], { mango: 3, "limón": 2, "café": 9, pota: 7 }]
    returns: [62200, [[2, ValueError], [3, KeyError], [4, ValueError]]]
    note: The picture above.
  - args: [["CMAU-1121;café", "CMAU-1122;café;100;extra"], { "café": 9 }]
    returns: [0, [[1, ValueError], [2, ValueError]]]
    note: With too few or too many fields, the unpacking raises ValueError.
edge:
  - args: [[], { mango: 3 }]
    tag: with no lines
  - args: [["MSKU-1000;mango;0"], { mango: 3 }]
    tag: with zero kilos
  - args: [["MSKU-1000;uva;12,5"], { mango: 3 }]
    tag: with an unknown product and mistyped kilos on the same line
  - args: [["MSKU-1000;mango;10", "MSKU-1001;uva;10", "MSKU-1002;mango;x", "MSKU-1003;mango;20"], { mango: 3 }]
    tag: with good lines after the bad ones
  - args: [["A;mango;1", "B;mango;1", "C;mango;1"], { mango: 15 }]
    tag: with every line good
  - args: [["A;mango", "B;limón;", "C;café;-1", "D;pota;1.5"], { mango: 3, "limón": 2, "café": 9, pota: 7 }]
    tag: with every line bad
random:
  count: 40
  seed: 1616
  generate: |
    products = ["mango", "limón", "pota", "banano", "café", "langostino", "uva"]
    rates = {"mango": 3, "limón": 2, "pota": 7, "banano": 1, "café": 9}
    lines = []
    for _ in range(rng.int(0, 12)):
        good = str(rng.int(1, 30000))
        weight = rng.pick([good, good, good, good, "0", f"-{rng.int(1, 900)}", "12,5", "2l000", ""])
        parts = [f"MSKU-{rng.int(1000, 9999)}", rng.pick(products), weight]
        shape = rng.int(0, 9)
        if shape == 0:
            parts = parts[:2]
        elif shape == 1:
            parts.append("extra")
        lines.append(";".join(parts))
    return [lines, rates]
wrong:
  - |
    def check_manifest(lines, rates):
        total = 0
        for number, line in enumerate(lines, start=1):
            try:
                code, product, weight = line.split(";")
                weight = int(weight)
                if weight <= 0:
                    raise ValueError(code)
                total += rates[product] * weight
            except (ValueError, KeyError) as error:
                return (total, [(number, type(error).__name__)])
        return (total, [])
  - |
    def check_manifest(lines, rates):
        total = 0
        errors = []
        for number, line in enumerate(lines, start=1):
            try:
                code, product, weight = line.split(";")
                rate = rates[product]
                weight = int(weight)
                if weight <= 0:
                    raise ValueError(code)
                total += rate * weight
            except Exception:
                errors.append((number, "ValueError"))
        return (total, errors)
  - |
    def check_manifest(lines, rates):
        total = 0
        errors = []
        for number, line in enumerate(lines, start=1):
            try:
                code, product, weight = line.split(";")
                weight = int(weight)
                if weight <= 0:
                    raise ValueError(code)
                total += rates[product] * weight
            except (ValueError, KeyError) as error:
                errors.append((number, type(error).__name__))
        return (total, errors)
```

```exercise
id: py16-juez-despacho
type: judge
mode: function
function: dispatch
title: Release, hold or reject
prompt: |
  **Write `dispatch(containers)`, which sorts the codes into three lists, `[released, held, rejected]`, using a family of exceptions of your own.**

  Each container is `[code, declared_kilos, scale_kilos, seal_intact]`. Write `inspect_container(container)`, which returns the code if everything is fine and **raises** if not, checking in this order:

  1. The code must be 4 uppercase letters, a hyphen and 4 digits (`MSKU-4410`); if not, `InvalidCode`.
  2. If the seal isn't intact, `BrokenSeal`.
  3. If the scale differs from what was declared by **more than 5 %** (`abs(scale - declared) * 100 > declared * 5`), `WeightMismatch`.

  The family: `CustomsError` is the base; `DocumentError` (`InvalidCode` inherits from it) means **reject**, and `CargoError` (`BrokenSeal` and `WeightMismatch` inherit from it) means **hold**. `dispatch` catches `CargoError` and `DocumentError` separately; each list keeps the order of arrival.

  `re.fullmatch(r"[A-Z]{4}-\d{4}", code)` checks the code (with `import re` at the top).

  **Constraints:** 0 to 10 containers · declared kilos from 1000 to 30000.
visual:
  figure:
    title: The family and example 1
    panes:
      - label: the family
        table: { head: ["class", "inherits from", "what dispatch does"], rows: [["CustomsError", "Exception", "—"], ["DocumentError", "CustomsError", "rejects"], ["InvalidCode", "DocumentError", "rejects"], ["CargoError", "CustomsError", "holds"], ["BrokenSeal", "CargoError", "holds"], ["WeightMismatch", "CargoError", "holds"]] }
      - label: example 1
        table: { head: ["container", "result"], rows: [["MSKU-4410, 18400, 18900, yes", "released (2.7 %)"], ["HLXU-7702, 21000, 21000, no", "BrokenSeal → held"], ["msku-4413, 19100, 19100, yes", "InvalidCode → rejected"], ["CMAU-1120, 15000, 16000, yes", "WeightMismatch (6.7 %) → held"]] }
starter: |
  import re


  def dispatch(containers):
      return [[], [], []]
solution: |
  import re


  class CustomsError(Exception):
      """Any problem with a container."""

  class DocumentError(CustomsError):
      """The papers are wrong: the container is rejected."""

  class CargoError(CustomsError):
      """The cargo doesn't add up: the container is held."""

  class InvalidCode(DocumentError): pass
  class BrokenSeal(CargoError): pass
  class WeightMismatch(CargoError): pass


  def inspect_container(container):
      code, declared, scale, seal = container
      if not re.fullmatch(r"[A-Z]{4}-\d{4}", code):
          raise InvalidCode(code)
      if not seal:
          raise BrokenSeal(code)
      if abs(scale - declared) * 100 > declared * 5:
          raise WeightMismatch(f"{code}: {declared} declared, {scale} on the scale")
      return code


  def dispatch(containers):
      released, held, rejected = [], [], []
      for container in containers:
          try:
              code = inspect_container(container)
          except CargoError:
              held.append(container[0])
          except DocumentError:
              rejected.append(container[0])
          else:
              released.append(code)
      return [released, held, rejected]
hints:
  - "Six short classes: `class BrokenSeal(CargoError): pass` is enough."
  - "In `dispatch`: `try: code = inspect_container(container)`, one `except` per family and `else: released.append(code)`."
samples:
  - args: [[["MSKU-4410", 18400, 18900, true], ["HLXU-7702", 21000, 21000, false], ["msku-4413", 19100, 19100, true], ["CMAU-1120", 15000, 16000, true]]]
    returns: [["MSKU-4410"], ["HLXU-7702", "CMAU-1120"], ["msku-4413"]]
    note: The table above.
  - args: [[["TGHU-2207", 20000, 21000, true], ["TGHU-2208", 20000, 18999, true]]]
    returns: [["TGHU-2207"], ["TGHU-2208"], []]
    note: 1000 kilos is exactly 5 % of 20000, and that still passes; 1001 doesn't.
edge:
  - args: [[]]
    tag: with no containers
  - args: [[["MSK-4410", 18000, 30000, false]]]
    tag: with a bad code that also has bad cargo
  - args: [[["CMAU-0981", 10000, 9500, true], ["CMAU-0982", 10000, 10500, true]]]
    tag: with differences of exactly 5 %
  - args: [[["CMAU-0981", 10000, 9000, true]]]
    tag: with the scale below what was declared
  - args: [[["HLXU-7702", 21000, 21000, false], ["HLXU-7703", 21000, 21000, false]]]
    tag: with all of them held
  - args: [[["MSKU_4410", 18400, 18400, true], ["MSKU-441", 18400, 18400, true], ["MSKU-44100", 18400, 18400, true]]]
    tag: with almost-right codes
random:
  count: 40
  seed: 1617
  generate: |
    batch = []
    for _ in range(rng.int(0, 10)):
        prefix = rng.pick(["MSKU", "HLXU", "CMAU", "TGHU", "SUDU", "msku", "MSK", "HLX7"])
        code = prefix + rng.pick(["-", "-", "-", "", "_"]) + str(rng.int(100, 9999))
        declared = rng.int(50, 1500) * 20
        scale = declared + rng.pick([0, 0, rng.int(-declared // 10, declared // 10), declared // 20, -(declared // 20), declared // 20 + 1])
        batch.append([code, declared, scale, rng.int(0, 4) > 0])
    return [batch]
wrong:
  - |
    import re

    def inspect_container(container):
        code, declared, scale, seal = container
        if not re.fullmatch(r"[A-Z]{4}-\d{4}", code):
            raise ValueError(code)
        if not seal or abs(scale - declared) * 100 > declared * 5:
            raise ValueError(code)
        return code

    def dispatch(containers):
        released, held = [], []
        for container in containers:
            try:
                released.append(inspect_container(container))
            except Exception:
                held.append(container[0])
        return [released, held, []]
  - |
    import re

    def dispatch(containers):
        result = [[], [], []]
        for code, declared, scale, seal in containers:
            if not seal or abs(scale - declared) * 100 > declared * 5:
                result[1].append(code)
            elif not re.fullmatch(r"[A-Z]{4}-\d{4}", code):
                result[2].append(code)
            else:
                result[0].append(code)
        return result
  - |
    import re

    def dispatch(containers):
        result = [[], [], []]
        for code, declared, scale, seal in containers:
            if not re.fullmatch(r"[A-Z]{4}-\d{4}", code):
                result[2].append(code)
            elif not seal or (scale - declared) * 100 >= declared * 5:
                result[1].append(code)
            else:
                result[0].append(code)
        return result
tests:
  - name: uses a family of exceptions of its own
    source: 'class\s+\w+\(\s*CargoError\s*\)'
    msg: BrokenSeal and WeightMismatch inherit from CargoError.
  - name: inspect_container raises the errors
    source: '\braise\s+\w+'
```

## Final mission

```exercise
id: py16-mision-grua
type: mission
title: The busy crane
prompt: |
  **Walk along the dock lifting each container with `crane(code)`: if the crane is busy, retry up to 3 times in total; if the container is stuck, don't insist. At the end deliver the list of released ones at the office (D).**

  Quilla starts in column 1 facing east. `containers` is a list of `[column, code]` pairs, in order; to reach each one, `robot.forward(column - robot.position.x)`.

  `crane(code)` is already written: it returns the container's kilos, or raises a `CraneError` of one of two kinds:

  - `CraneBusy`: temporary; **call it again**, up to 3 attempts in total per container;
  - `ContainerStuck`: retrying doesn't help; that container is held on the first attempt.

  1. Write `lift(code, attempts=3)`: it returns the kilos, retries only on `CraneBusy` and, if it runs out of attempts, raises `CraneBusy` again.
  2. In `report[code]` write down the kilos, or `"held"` if `lift` raised any `CraneError`.
  3. Walk to the far wall (the office) and deliver `"Released: "` with the released codes separated by `", "`, in order.

  No `except:` and no `except Exception`: an error that isn't the crane's has to be seen. The data changes in every test.
visual:
  figure:
    title: The first afternoon
    panes:
      - label: containers
        table: { head: ["column", "code", "the crane"], rows: [["3", "MSKU-4410", "lifts it"], ["6", "HLXU-7702", "busy twice, lifts it on the 3rd attempt"], ["9", "CMAU-1120", "lifts it"]] }
      - { label: delivers, value: "Released: MSKU-4410, HLXU-7702, CMAU-1120" }
starter: |
  # containers: [[3, "MSKU-4410"], ...]   column and code, in order
  class CraneError(Exception): pass
  class CraneBusy(CraneError): pass        # temporary: try again
  class ContainerStuck(CraneError): pass  # retrying doesn't help

  calls = []

  def crane(code):
      """Lifts the container and returns its kilos."""
      calls.append(code)
      if code in stuck:
          raise ContainerStuck(code)
      if calls.count(code) <= busy.get(code, 0):
          raise CraneBusy(code)
      return weights[code]


  def lift(code, attempts=3):
      pass


  report = {}
  # TODO: go through containers, fill report, walk to the office and deliver
solution: |
  class CraneError(Exception): pass
  class CraneBusy(CraneError): pass        # temporary: try again
  class ContainerStuck(CraneError): pass  # retrying doesn't help

  calls = []

  def crane(code):
      """Lifts the container and returns its kilos."""
      calls.append(code)
      if code in stuck:
          raise ContainerStuck(code)
      if calls.count(code) <= busy.get(code, 0):
          raise CraneBusy(code)
      return weights[code]


  def lift(code, attempts=3):
      for _ in range(attempts - 1):
          try:
              return crane(code)
          except CraneBusy:
              pass
      return crane(code)


  report = {}
  for column, code in containers:
      robot.forward(column - robot.position.x)
      try:
          weight = lift(code)
      except CraneError:
          report[code] = "held"
      else:
          report[code] = weight
          robot.say(f"{code}: {weight} kg")

  while not robot.wall_ahead():
      robot.forward()
  released = [code for code, weight in report.items() if weight != "held"]
  robot.deliver("Released: " + ", ".join(released))
hints:
  - "In `lift`, the first attempts go in a `try` with `except CraneBusy: pass`; the last attempt goes without a `try`, so its error goes up by itself."
  - "Outside, `try: weight = lift(code)` with `except CraneError:` (the whole family) and `else:` to write down the kilos. To reach the office: `while not robot.wall_ahead(): robot.forward()`."
world:
  theme: barranco
  level: 2
  dir: E
  items: { c: container }
  map: |
    ##############
    #R..........D#
    ###c##c##c####
    ##############
globals:
  containers: [[3, MSKU-4410], [6, HLXU-7702], [9, CMAU-1120]]
  weights: { MSKU-4410: 18400, HLXU-7702: 21000, CMAU-1120: 15000 }
  busy: { HLXU-7702: 2 }
  stuck: []
scenarios:
  - tests:
      - name: the first afternoon's report
        expect: 'report == {"MSKU-4410": 18400, "HLXU-7702": 21000, "CMAU-1120": 15000}'
      - name: three attempts for the one that found the crane busy
        expect: 'calls == ["MSKU-4410", "HLXU-7702", "HLXU-7702", "HLXU-7702", "CMAU-1120"]'
  - map: |
      #############
      #R.........D#
      ##c##c#c#c###
      #############
    globals:
      containers: [[2, TGHU-2207], [5, SUDU-5150], [7, HLXU-7705], [9, CMAU-0981]]
      weights: { TGHU-2207: 12500, SUDU-5150: 22300, HLXU-7705: 8000, CMAU-0981: 20500 }
      busy: { TGHU-2207: 3, HLXU-7705: 1 }
      stuck: [SUDU-5150]
    tests:
      - name: the second afternoon's report
        expect: 'report == {"TGHU-2207": "held", "SUDU-5150": "held", "HLXU-7705": 8000, "CMAU-0981": 20500}'
      - name: not one attempt too many
        expect: 'calls == ["TGHU-2207"] * 3 + ["SUDU-5150"] + ["HLXU-7705"] * 2 + ["CMAU-0981"]'
        msg: With CraneBusy it tries up to 3 times in total; with ContainerStuck, just once.
  - map: |
      ###########
      #R.......D#
      ####c#c####
      ###########
    globals:
      containers: [[4, CMAU-1121], [6, MSKU-4490]]
      weights: { CMAU-1121: 14800, MSKU-4490: 19900 }
      busy: { CMAU-1121: 4 }
      stuck: [MSKU-4490]
    tests:
      - name: the report of a hard afternoon
        expect: 'report == {"CMAU-1121": "held", "MSKU-4490": "held"}'
      - name: the crane gave up in time
        expect: 'calls == ["CMAU-1121"] * 3 + ["MSKU-4490"]'
tests:
  - name: delivers the list of released ones at the office
    state: 'w.delivered == ["Released: " + ", ".join(c for _, c in g["containers"] if c not in g["stuck"] and g["busy"].get(c, 0) < 3)]'
    msg: 'Deliver a single label: "Released: " and the released codes separated by ", ", in order.'
  - name: ends at the office without crashing
    state: w.at_goal and not w.crashed
  - name: lift is a function
    expect: callable(lift)
  - name: retries only on CraneBusy
    source: 'except\s+CraneBusy'
  - name: no catch-all except
    sourceNot: 'except\s*(:|Exception\b|BaseException\b)'
    msg: "An except: or an except Exception hides any bug. Catch CraneBusy and CraneError."
```

## Expert challenge

```exercise
id: py16-reto-auditoria
type: challenge
title: The audit that doesn't stop
visual:
  figure:
    title: One container, all its problems
    input: { label: container, text: "[\"msku-1\", 1000, 1300, False]" }
    arrow: runs the three checks and gathers whatever fails
    output: { label: raises, text: "ExceptionGroup(\"msku-1\", [\n  InvalidCode, BrokenSeal, WeightMismatch\n])" }
prompt: |
  **Write `full_inspection(container)` and `audit(batch)`.** For people who already code.

  The end-of-month audit doesn't stop at the first problem: it wants **all of them**. The three checks are already written and each one raises its own error.

  - `full_inspection(container)` runs the three functions in `checks`, in order, gathers every exception they raise and, if there's at least one, raises `ExceptionGroup(code, errors)`. If not, it returns the code.
  - `audit(batch)` returns a dictionary with four lists of codes, in order of arrival: `"code"`, `"seal"`, `"weight"` (the containers with that problem; one can be in several) and `"clean"`. Handle the group with one `except*` per error type.

  `errors_of` is already written and is there for testing.
starter: |
  import re

  class InvalidCode(Exception): pass
  class BrokenSeal(Exception): pass
  class WeightMismatch(Exception): pass


  def check_code(container):
      if not re.fullmatch(r"[A-Z]{4}-\d{4}", container[0]):
          raise InvalidCode(container[0])

  def check_seal(container):
      if not container[3]:
          raise BrokenSeal(container[0])

  def check_weight(container):
      code, declared, scale, _ = container
      if abs(scale - declared) * 100 > declared * 5:
          raise WeightMismatch(code)

  checks = [check_code, check_seal, check_weight]


  def full_inspection(container):
      pass


  def audit(batch):
      return {"code": [], "seal": [], "weight": [], "clean": []}


  def errors_of(container):
      """The names of the errors in the group, in alphabetical order."""
      try:
          full_inspection(container)
      except ExceptionGroup as group:
          return sorted(type(error).__name__ for error in group.exceptions)
      return []

  print(errors_of(["msku-1", 1000, 1300, False]))
solution: |
  import re

  class InvalidCode(Exception): pass
  class BrokenSeal(Exception): pass
  class WeightMismatch(Exception): pass


  def check_code(container):
      if not re.fullmatch(r"[A-Z]{4}-\d{4}", container[0]):
          raise InvalidCode(container[0])

  def check_seal(container):
      if not container[3]:
          raise BrokenSeal(container[0])

  def check_weight(container):
      code, declared, scale, _ = container
      if abs(scale - declared) * 100 > declared * 5:
          raise WeightMismatch(code)

  checks = [check_code, check_seal, check_weight]


  def full_inspection(container):
      errors = []
      for check in checks:
          try:
              check(container)
          except (InvalidCode, BrokenSeal, WeightMismatch) as error:
              errors.append(error)
      if errors:
          raise ExceptionGroup(container[0], errors)
      return container[0]


  def audit(batch):
      report = {"code": [], "seal": [], "weight": [], "clean": []}
      for container in batch:
          code = container[0]
          try:
              full_inspection(container)
          except* InvalidCode:
              report["code"].append(code)
          except* BrokenSeal:
              report["seal"].append(code)
          except* WeightMismatch:
              report["weight"].append(code)
          else:
              report["clean"].append(code)
      return report


  def errors_of(container):
      """The names of the errors in the group, in alphabetical order."""
      try:
          full_inspection(container)
      except ExceptionGroup as group:
          return sorted(type(error).__name__ for error in group.exceptions)
      return []

  print(errors_of(["msku-1", 1000, 1300, False]))
hints:
  - "In `full_inspection`, a `try` inside the `for` that goes through `checks`; the `except` adds the error to a list and the loop carries on."
  - "In `audit`, `try` / `except* InvalidCode:` / `except* BrokenSeal:` / `except* WeightMismatch:` / `else:`. `continue` isn't allowed inside an `except*`, so use `else` for the clean ones."
tests:
  - name: gathers the three problems
    run: 'errors_of(["msku-1", 1000, 1300, False])'
    equals: [BrokenSeal, InvalidCode, WeightMismatch]
  - name: a single one also goes in a group
    run: 'errors_of(["MSKU-4410", 18400, 18400, False])'
    equals: [BrokenSeal]
  - name: a clean container returns its code
    run: 'full_inspection(["MSKU-4410", 18400, 18500, True])'
    equals: MSKU-4410
  - name: a container with no problems doesn't raise
    run: 'errors_of(["HLXU-7702", 21000, 21000, True])'
    equals: []
  - name: the audit of a batch
    run: 'audit([["MSKU-4410", 18400, 18500, True], ["msku-1", 1000, 1300, False], ["HLXU-7702", 20000, 21001, True], ["CMAU-1120", 15000, 15000, False]])'
    equals: { code: [msku-1], seal: [msku-1, CMAU-1120], weight: [msku-1, HLXU-7702], clean: [MSKU-4410] }
  - name: an empty batch
    run: audit([])
    equals: { code: [], seal: [], weight: [], clean: [] }
  - name: raises an ExceptionGroup and handles it with except*
    source: 'ExceptionGroup\([\s\S]*except\*'
```
