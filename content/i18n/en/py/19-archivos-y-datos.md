# Session 19 — Files, modules and data

## The job

Chiclayo, seven in the morning. The **Mercado Modelo** already smells of coriander, of pato en olla and of the healers' herbs in the back passage. In the food court on the second floor, four stalls share a single cash register: Catalina with her King Kong, Wálter with his arroz con pato, Rocío with the cabrito and Hermes with the tortilla de raya. The stallholders' association manager, **don Segundo Puicón**, has a receipt audit tomorrow and a mountain of papers, notebooks and files that don't add up.

Maru sent Quilla on the night bus, with its waiter's arm. Until today, everything Quilla knew was forgotten when the program ended. Today it learns to **read and write files**: the till's log as CSV, the price list as JSON, a plain text notebook. And to split its code into **modules**, like a real program.

```scene
theme: cocina
level: 4
dir: E
caption: The food court of the Mercado Modelo. Quilla reads the order, cooks in the kitchen (K) and serves tables 2 and 4.
map: |
  ############
  #K.........#
  ##1#2#3#4#5#
  ############
program: |
  robot.cook("arroz con pato")
  robot.forward(3)
  robot.serve()
  robot.turn_right()
  robot.turn_right()
  robot.forward(3)
  robot.turn_right()
  robot.turn_right()
  robot.cook("King Kong")
  robot.forward(7)
  robot.serve()
```

## The minimum

A **text file** is text saved under a name. You open it with `open(path, mode, encoding="utf-8")` inside a `with`, which **closes it by itself** when the block ends, even if there's an error halfway. Mode `"r"` (the default) reads, `"w"` creates the file or **wipes it and rewrites it**, and `"a"` appends to the end.

```py
with open("till.txt", encoding="utf-8") as file:
    for line in file:                # every line keeps its "\n" at the end
        print(line.strip())

with open("summary.txt", "w", encoding="utf-8") as out:
    out.write("Total: 132.50\n")     # write doesn't add the line break
```

`file.read()` gives the whole content as one text, and looping over the file gives one line per turn. **Why `encoding`?** A file stores bytes, not letters: `ñ` and accented letters take two bytes in UTF-8, and if you read them with another encoding you get gibberish:

```py run
name = "Chapoñán"
data = name.encode("utf-8")
print(len(name), len(data))
print(data.decode("latin-1"))
```

**`pathlib.Path`** is a path with methods: `/` joins parts, `.name`, `.stem` and `.suffix` take it apart, `.exists()` asks whether it exists, `.read_text()` and `.write_text()` read and write in one go, and `.glob("*.csv")` lists the files in a folder.

```py run
from pathlib import Path
path = Path("sales") / "october" / "stall-48.csv"
print(path)
print(path.name, path.stem, path.suffix)
print(path.parent)
```

A **CSV** is a table as text: one row per line, columns separated by commas, and the first row is the header. If a value contains a comma it goes in quotes, which is why you never split it with `split(",")`: the **`csv`** module does it right. `csv.DictReader` gives you each row as a dictionary, keyed by the header. When you open a CSV, pass `newline=""`. Here, `io.StringIO(text)` plays the file: it works just like what `open` returns.

```py run
import csv
import io
text = 'stall,dish,amount\nWálter,"Arroz con pato, doble",45.00\n'
for row in csv.DictReader(io.StringIO(text)):
    print(row["dish"], "|", float(row["amount"]) * 2)
```

To write one, `csv.writer(file).writerow(["Wálter", "Arroz con pato, doble", 45])` adds quotes where they're needed. And to add up by group, `collections.defaultdict(float)` creates each key at `0.0` the first time you touch it:

```anim
title: Adding up a CSV by stall
code: |
  import csv
  import io
  from collections import defaultdict
  text = "stall,amount\nWálter,26.00\nHermes,22.00\nWálter,45.00\n"
  totals = defaultdict(float)
  for row in csv.DictReader(io.StringIO(text)):
      totals[row["stall"]] += float(row["amount"])
  print(dict(totals))
show: [row, totals]
notes:
  5: "A defaultdict(float): a key that doesn't exist starts at 0.0."
  6: "DictReader skips the header and uses it as the keys of every row."
  7: "row[\"amount\"] is the text \"26.00\": without float, it can't be added."
  8: "Wálter adds up 26 + 45; the order is that of first appearance."
```

**JSON** is dictionaries and lists written as text. `json.loads(text)` turns it into Python data and `json.dumps(data)` does the opposite; with files, `json.load(file)` and `json.dump(data, file)`. `true` becomes `True` and `null`, `None`. Without `ensure_ascii=False`, accented letters come out as codes:

```py run
import json
data = json.loads('{"stall": "Chapoñán", "dishes": ["King Kong", "cocadas"], "open": true}')
print(data["dishes"][0], data["open"])
print(json.dumps(data, ensure_ascii=False))
print(json.dumps({"owner": "Ñique"}))
```

Two tools from `collections` and a sort with several keys: `Counter` counts a list in one go, `defaultdict(list)` groups without `setdefault`, and a **tuple as the `key`** sorts by several things at once (the `-` puts numbers from largest to smallest):

```py run
from collections import Counter, defaultdict
print(Counter(["pato", "raya", "pato", "cabrito", "raya", "pato"]).most_common(2))
by_table = defaultdict(list)
by_table[3].append("pato")
print(dict(by_table), by_table[7])
print(sorted([("Rocío", 72.0), ("Wálter", 97.0), ("Hermes", 72.0)], key=lambda p: (-p[1], p[0])))
```

**Modules.** Every `.py` file is a module: if there's a `market.py` next to your program, `import market` runs it once and gives you its names as `market.with_tax`, and `from market import with_tax` brings one in directly. Just like `import csv`. Inside a module, `__name__` holds its name (`"market"`), but in the file you run it's `"__main__"`. That's why a module's test code goes like this, and doesn't run when someone else imports it:

```py
def with_tax(amount):
    return round(amount * 1.18, 2)

if __name__ == "__main__":
    print("Testing:", with_tax(100))
```

This is how Python looks when you write `import`, step by step:

```network
title: How Python looks for a module when you import
caption: "First your folder, then the installed libraries. A module runs **once**."
speed: 4200
nodes:
  - { id: prog, icon: program, label: "Your program", sub: "the file you run" }
  - { id: mer, icon: file, label: "market.py", sub: "in the same folder" }
  - { id: std, icon: box, label: "Standard library", sub: "csv, json, collections…" }
steps:
  - phase: "1. Your own module"
    move: [prog, mer]
    packet: { kind: up, label: "is there a market?" }
    note: "`import market`: Python looks first **next to your program**, in the same folder. It finds `market.py`."
  - at: mer
    packet: { kind: local, label: "runs once" }
    note: "It **runs once**, top to bottom. Here it only defines `with_tax`."
    tags: { mer: "ran" }
    show: { label: market.py, text: "def with_tax(amount):\n    return round(amount * 1.18, 2)" }
  - move: [mer, prog]
    packet: { kind: down, label: "market.with_tax" }
    note: "Its names come back to your program, kept inside `market`: `market.with_tax(100)`. With `from market import with_tax` only that name arrives, with no prefix."
  - phase: "2. Again"
    at: mer
    note: "A second `import market`, in your program or in another module, **doesn't run it again**: Python already has it in memory and hands over the same thing."
    tags: { mer: "already loaded: doesn't run again" }
  - phase: "3. Standard library"
    move: [prog, std]
    packet: { kind: up, label: "is there a csv?" }
    dim: [mer]
    note: "`import csv`: there's no `csv.py` next to your program, so Python goes on to the **standard library**, the modules that come installed. That's why your file shouldn't be named like a library: it would hide the real one."
  - phase: "4. If it isn't there"
    move: [prog, std]
    packet: { kind: up, label: "is there an inventado?" }
    dim: [mer]
    note: "If the module isn't next to your program or in the installed libraries, Python stops."
  - at: prog
    tags: { prog: ModuleNotFoundError }
    note: "The message is `ModuleNotFoundError: No module named 'inventado'`. It's almost always a typo or a file in another folder."
  - phase: "5. Who runs the file"
    at: prog
    note: "Inside a module, `__name__` says how it's being used: if you run it directly it's `\"__main__\"` and the test block runs; if another module imports it, it holds its name and the test block doesn't run."
    show: { label: "__name__", text: "python market.py → \"__main__\"\nimport market    → \"market\"" }
```

> **Common trap:** everything that comes out of a file is **text**. `"10" + "9"` gives `"109"`, `"10" > "9"` is `False` (it compares letter by letter) and `sorted(["9", "45", "120"])` gives `['120', '45', '9']`. Convert with `int()` or `float()` as soon as you read each row.

<!-- legacy: with-open -->

<!-- legacy: pathlib -->

<!-- mdn: with-open pathlib csv-dictreader json main-guard -->

## Practice

```exercise
id: py19-completa-caja
type: complete
title: Catalina's notebook
prompt: |
  Catalina writes down her sales in `till.txt`, one per line: `dish,amount`. Fill in the `___` to **read** the file, add up the amounts and **write** the total to `summary.txt`, in the format `Total: 132.50` with a line break at the end.
visual:
  figure:
    input: { label: till.txt, text: "arroz con pato,32.50\ncabrito,28.00\ntortilla de raya,22.00\nespesado,18.00\nKing Kong de piña,32.00" }
    arrow: "with open(...) → sum → write"
    output: { label: summary.txt, text: "Total: 132.50" }
files:
  till.txt: |
    arroz con pato,32.50
    cabrito,28.00
    tortilla de raya,22.00
    espesado,18.00
    King Kong de piña,32.00
starter: |
  total = 0
  with ___("till.txt", encoding="utf-8") as file:
      for line in file:
          dish, amount = line.___().split(",")
          total += ___(amount)

  with open("summary.txt", "___", encoding="utf-8") as out:
      out.___(f"Total: {total:.2f}\n")
  print(f"Total: {total:.2f}")
solution: |
  total = 0
  with open("till.txt", encoding="utf-8") as file:
      for line in file:
          dish, amount = line.strip().split(",")
          total += float(amount)

  with open("summary.txt", "w", encoding="utf-8") as out:
      out.write(f"Total: {total:.2f}\n")
  print(f"Total: {total:.2f}")
hints:
  - "Every line has a `\"\\n\"` at the end: `strip()` removes it. And the amount arrives as text."
  - "To write, the mode is `\"w\"` and the method is `write`."
tests:
  - name: adds up the five amounts
    expect: total == 132.5
  - name: writes summary.txt
    expect: 'open("summary.txt", encoding="utf-8").read() == "Total: 132.50\n"'
    msg: 'The file must hold exactly "Total: 132.50" and a line break.'
  - name: the console says so
    output: "Total: 132.50"
```

```exercise
id: py19-escribe-carpeta
type: write
title: One folder, one file per day
prompt: |
  Write `daily_totals(folder)`, which reads **every `.txt` file** in the folder and returns a dictionary `file name without extension → sum of its amounts`, with the days in the order of their names.

  Hermes keeps each day's receipts in `sales/2026-10-20.txt`, `sales/2026-10-21.txt`…, one amount per line. The folder also holds a `README.md`, which isn't sales, and a day when he sold nothing (the file is empty). Use `Path(folder).glob("*.txt")`, `path.stem` and `path.read_text(encoding="utf-8").split()`.
visual:
  figure:
    input: { label: sales/, table: { head: ["file", "contents"], rows: [["2026-10-20.txt", "32.50 · 28.00 · 22.00"], ["2026-10-21.txt", "45.00 · 18.50"], ["2026-10-22.txt", "(empty)"], ["README.md", "(not .txt)"]] } }
    arrow: "glob(\"*.txt\") → stem → sum"
    output: { label: returns, cards: [{ title: totals, rows: [["2026-10-20", "82.5"], ["2026-10-21", "63.5"], ["2026-10-22", "0"]] }] }
files:
  sales/2026-10-21.txt: "45.00\n18.50\n"
  sales/2026-10-20.txt: "32.50\n28.00\n22.00\n"
  sales/2026-10-22.txt: ""
  sales/README.md: "One amount per line, in soles.\n"
  fair/saturday.txt: "12.00\n8.50\n"
starter: |
  from pathlib import Path


  def daily_totals(folder):
      return {}


  print(daily_totals("sales"))
solution: |
  from pathlib import Path


  def daily_totals(folder):
      totals = {}
      for path in sorted(Path(folder).glob("*.txt")):
          amounts = path.read_text(encoding="utf-8").split()
          totals[path.stem] = sum(float(amount) for amount in amounts)
      return totals


  print(daily_totals("sales"))
hints:
  - "`sorted(Path(folder).glob(\"*.txt\"))` gives the paths of the `.txt` files in name order."
  - "`split()` with no arguments cuts at line breaks and leaves no empty texts; an empty file gives `[]`, and the `sum` of nothing is 0."
tests:
  - name: Hermes's three days, in order
    expect: 'daily_totals("sales") == {"2026-10-20": 82.5, "2026-10-21": 63.5, "2026-10-22": 0}'
  - name: the days come out in the order of their names
    expect: 'list(daily_totals("sales")) == ["2026-10-20", "2026-10-21", "2026-10-22"]'
  - name: another folder
    expect: 'daily_totals("fair") == {"saturday": 20.5}'
  - name: uses Path
    source: '\bPath\s*\('
```

```exercise
id: py19-predice-coma
type: predict
title: The comma inside the dish
prompt: |
  One row of the till's log, split in two ways. What does it print?
code: |
  import csv
  import io
  line = 'Stall 12,"Pato, arroz y cabrito",45\n'
  print(len(line.strip().split(",")))
  row = next(csv.reader(io.StringIO(line)))
  print(len(row), row[1])
  print(row[2] * 2)
options:
  - "4\n3 Pato, arroz y cabrito\n4545"
  - "3\n3 Pato, arroz y cabrito\n90"
  - "4\n3 Pato, arroz y cabrito\n90"
  - "4\n4 \"Pato\n4545"
answer: "4\n3 Pato, arroz y cabrito\n4545"
explain: |
  `split(",")` knows nothing about quotes: it also cuts at the dish's comma and gives 4 pieces. `csv.reader` respects the quotes and gives 3 columns, without the quotes. And `row[2]` is the **text** `"45"`: times 2, it repeats.
```

```exercise
id: py19-arregla-pesadas
type: fix
title: Weighing the limes
prompt: |
  Rocío weighs what she buys at the wholesale market and writes it down in `weighings.csv`. This program should add up the kilos of each product, but it crashes on the first turn. Run it and read the error.

  Fix it by reading the file with **`csv.DictReader`** (so the header doesn't count as data) and turning the kilos into a number.
visual:
  figure:
    input: { label: weighings.csv, table: { head: ["product", "kilos"], rows: [["lime", "2.5"], ["ají amarillo", "1.25"], ["lime", "3"], ["red onion", "4"], ["ají amarillo", "0.75"]] } }
    output: { label: kilos, cards: [{ title: kilos, rows: [["lime", "5.5"], ["ají amarillo", "2.0"], ["red onion", "4.0"]] }] }
files:
  weighings.csv: |
    product,kilos
    lime,2.5
    ají amarillo,1.25
    lime,3
    red onion,4
    ají amarillo,0.75
starter: |
  import csv

  kilos = {}
  with open("weighings.csv", encoding="utf-8", newline="") as file:
      for row in csv.reader(file):
          product = row[0]
          kilos[product] = kilos.get(product, 0) + row[1]
  print(kilos)
solution: |
  import csv
  from collections import defaultdict

  kilos = defaultdict(float)
  with open("weighings.csv", encoding="utf-8", newline="") as file:
      for row in csv.DictReader(file):
          kilos[row["product"]] += float(row["kilos"])
  print(dict(kilos))
hints:
  - "The first row is `[\"product\", \"kilos\"]`, and `0 + \"kilos\"` is a `TypeError`. Even if you skip that row, `\"2.5\"` is still text."
  - "With `csv.DictReader(file)` every row is `{\"product\": \"lime\", \"kilos\": \"2.5\"}`. Add `float(row[\"kilos\"])`."
tests:
  - name: adds up the kilos of each product
    expect: 'dict(kilos) == {"lime": 5.5, "ají amarillo": 2.0, "red onion": 4.0}'
  - name: the header isn't a product
    expect: '"product" not in kilos'
  - name: uses DictReader
    source: '\bDictReader\s*\('
```

```exercise
id: py19-escribe-json
type: write
title: The price rise
prompt: |
  Write `raise_prices(source, target, increase)`, which reads the menu from a JSON file, adds `increase` soles to every price, **saves** the new menu to the `target` file and returns it.

  Wálter raised everything because duck is expensive. The menu is in `prices.json`. Save the new one with `json.dump(menu, file, ensure_ascii=False, indent=2)`: that way accented letters stay as they are and the file can be read by eye.
visual:
  figure:
    input: { label: prices.json, cards: [{ title: menu, rows: [["arroz con pato", "26.0"], ["cabrito", "24.0"], ["pepián de pavo", "20.0"], ["chinguirito", "16.0"]] }] }
    arrow: "json.load → + 2 → json.dump"
    output: { label: new_prices.json, text: "{\n  \"arroz con pato\": 28.0,\n  \"cabrito\": 26.0,\n  \"pepián de pavo\": 22.0,\n  \"chinguirito\": 18.0\n}" }
files:
  prices.json: '{"arroz con pato": 26.0, "cabrito": 24.0, "pepián de pavo": 20.0, "chinguirito": 16.0}'
starter: |
  import json


  def raise_prices(source, target, increase):
      return {}


  print(raise_prices("prices.json", "new_prices.json", 2))
solution: |
  import json


  def raise_prices(source, target, increase):
      with open(source, encoding="utf-8") as file:
          menu = json.load(file)
      new_menu = {dish: price + increase for dish, price in menu.items()}
      with open(target, "w", encoding="utf-8") as file:
          json.dump(new_menu, file, ensure_ascii=False, indent=2)
      return new_menu


  print(raise_prices("prices.json", "new_prices.json", 2))
hints:
  - "`json.load(file)` reads an open file (no final s); `json.loads(text)` reads a text."
  - "A dictionary comprehension builds the new menu: `{dish: price + increase for dish, price in menu.items()}`."
tests:
  - name: returns the new menu
    expect: 'raise_prices("prices.json", "new_prices.json", 2) == {"arroz con pato": 28.0, "cabrito": 26.0, "pepián de pavo": 22.0, "chinguirito": 18.0}'
  - name: the new file has the new menu
    expect: 'json.load(open("new_prices.json", encoding="utf-8")) == {"arroz con pato": 28.0, "cabrito": 26.0, "pepián de pavo": 22.0, "chinguirito": 18.0}'
  - name: accented letters stay as they are
    expect: '"pepián" in open("new_prices.json", encoding="utf-8").read()'
    msg: Use ensure_ascii=False in json.dump.
  - name: indented with two spaces
    expect: 'open("new_prices.json", encoding="utf-8").read().startswith("{\n  \"")'
    msg: Use indent=2 in json.dump.
  - name: leaves prices.json alone
    expect: 'json.load(open("prices.json", encoding="utf-8"))["cabrito"] == 24.0'
```

```exercise
id: py19-predice-ranking
type: predict
title: The most ordered dish
prompt: |
  Don Segundo counts the morning's orders and builds the ranking. What does it print?
code: |
  from collections import Counter
  orders = ["pato", "raya", "cabrito", "raya", "pato", "espesado", "cabrito"]
  count = Counter(orders)
  print(count["pato"], count["chinguirito"])
  ranking = sorted(count.items(), key=lambda pair: (-pair[1], pair[0]))
  print(ranking[:3])
  print(sorted(["9", "45", "120"]))
options:
  - "2 0\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['120', '45', '9']"
  - "2 0\n[('pato', 2), ('raya', 2), ('cabrito', 2)]\n['120', '45', '9']"
  - "2 0\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['9', '45', '120']"
  - "2 None\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['120', '45', '9']"
answer: "2 0\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['120', '45', '9']"
explain: |
  A `Counter` gives 0 for what it never saw, with no `KeyError`. The key `(-quantity, name)` sorts first by quantity from largest to smallest and, in the three-way tie of dishes with 2, by name. And texts are compared letter by letter: `"1"` comes before `"4"` and before `"9"`.
```

```exercise
id: py19-escribe-modulo
type: write
title: The association's module
prompt: |
  The folder holds a module, `market.py`, that the association uses at every stall. **Import `with_tax` and `in_soles` from it** (don't copy them) and write `main()`, which prints one line per dish in `dishes` with its price including IGV, Peru's 18 % sales tax: `arroz con pato: S/ 30.68`. Call `main()` inside an `if __name__ == "__main__":`.

  Notice: `market.py` also prints something when you run it directly, but importing it prints nothing.
visual:
  figure:
    input: { label: market.py, text: "SALES_TAX = 0.18\n\ndef with_tax(amount): ...\ndef in_soles(amount): ...\n\nif __name__ == \"__main__\":\n    print(\"Testing market.py:\", ...)" }
    arrow: "from market import with_tax, in_soles"
    output: { label: console, text: "arroz con pato: S/ 30.68\ncabrito: S/ 28.32" }
files:
  market.py: |
    """Accounts for the Mercado Modelo food court."""

    SALES_TAX = 0.18


    def with_tax(amount):
        """The amount with IGV, rounded to céntimos."""
        return round(amount * (1 + SALES_TAX), 2)


    def in_soles(amount):
        """The amount as it goes on a receipt: S/ 12.50."""
        return f"S/ {amount:.2f}"


    if __name__ == "__main__":
        print("Testing market.py:", in_soles(with_tax(100)))
starter: |
  dishes = [("arroz con pato", 26.0), ("cabrito", 24.0)]


  def main():
      pass
solution: |
  from market import with_tax, in_soles

  dishes = [("arroz con pato", 26.0), ("cabrito", 24.0)]


  def main():
      for dish, price in dishes:
          print(f"{dish}: {in_soles(with_tax(price))}")


  if __name__ == "__main__":
      main()
hints:
  - "`from market import with_tax, in_soles` goes at the top, like `import csv`."
  - "Inside `main`: `print(f\"{dish}: {in_soles(with_tax(price))}\")`. At the end, `if __name__ == \"__main__\":` and `main()` indented."
tests:
  - name: prints both dishes with IGV
    output: "arroz con pato: S/ 30.68\ncabrito: S/ 28.32"
    msg: "If you see \"Testing market.py\", you're running the module instead of importing it."
  - name: imports from the module
    source: '\bfrom\s+market\s+import\b|\bimport\s+market\b'
  - name: doesn't copy the functions
    sourceNot: '\bdef\s+(with_tax|in_soles)\b'
  - name: calls main from the __main__ block
    source: 'if\s+__name__\s*==\s*["'']__main__["'']\s*:\s*\n\s+main\(\)'
```

## The case

```exercise
id: py19-caso-boleta
type: case
title: The receipt that isn't in the file
prompt: |
  **Add up, per stall, the issued receipts in the till's file and compare that with what each stall's paper copies add up to. Then find the copy that isn't in the file.**

  Don Segundo gathered the receipt books of the four stalls (the paper copy of every receipt) and the file the cash register exports, `till_export.csv`. The audit is tomorrow, and every receipt handed to a customer has to be in the file. Watch out for two things: some dishes contain commas, and one receipt in the file is **void** (it was issued by mistake and doesn't count as a sale).

  Print one line per stall that starts with its name, with the file's total at the end: `print("Catalina:", total)`. The board compares it with what its copies add up to.
visual:
  board:
    for: py19-caso-boleta
    task: "File total = the sum of the amounts of its issued receipts. Compare it with the sum of its paper copies."
    cards:
      - name: Catalina
        kind: person
        role: King Kong and sweets
        rows: [["Copies", "3 receipts"], ["Add up to", "S/ 85.50"]]
        clue: { find: "Catalina", says: 85.5, saysLabel: Copies }
      - name: Hermes
        kind: person
        role: Tortilla de raya and espesado
        rows: [["Copies", "4 receipts"], ["Add up to", "S/ 78.00"]]
        clue: { find: "Hermes", says: 78, saysLabel: Copies }
      - name: Rocío
        kind: person
        role: Cabrito
        culprit: true
        rows: [["Copies", "4 receipts"], ["Add up to", "S/ 110.00"], ["Said", "\"that afternoon the till froze for a little while\""]]
        clue: { find: "Rocío", says: 110, saysLabel: Copies }
      - name: Wálter
        kind: person
        role: Arroz con pato
        rows: [["Copies", "3 receipts"], ["Add up to", "S/ 87.00"]]
        clue: { find: "Wálter", says: 87, saysLabel: Copies }
      - name: till_export.csv
        kind: note
        role: What the till exported
        rows: [["Columns", "receipt, stall, item, amount, status"], ["Rows", "14, grouped by stall"]]
    caption: "If Wálter doesn't add up, check whether you counted the void receipt."
files:
  till_export.csv: |
    receipt,stall,item,amount,status
    B-1031,Catalina,King Kong de manjar,32.00,issued
    B-1036,Catalina,"Alfajores, maná y cocadas",18.50,issued
    B-1041,Catalina,King Kong de piña,35.00,issued
    B-1034,Hermes,Tortilla de raya,22.00,issued
    B-1037,Hermes,"Espesado, con yuca",19.00,issued
    B-1040,Hermes,Causa ferreñafana,15.00,issued
    B-1042,Hermes,Tortilla de raya,22.00,issued
    B-1033,Rocío,Cabrito con frejoles,28.50,issued
    B-1038,Rocío,Cabrito,24.00,issued
    B-1044,Rocío,"Seco de cabrito, para llevar",30.00,issued
    B-1032,Wálter,"Arroz con pato, doble",45.00,issued
    B-1035,Wálter,Arroz con pato,26.00,void
    B-1039,Wálter,Arroz con pato,26.00,issued
    B-1045,Wálter,Chinguirito,16.00,issued
starter: |
  import csv

  # The paper copies each stall handed to don Segundo
  copies = {
      "Catalina": ["B-1031", "B-1036", "B-1041"],
      "Hermes": ["B-1034", "B-1037", "B-1040", "B-1042"],
      "Rocío": ["B-1033", "B-1038", "B-1043", "B-1044"],
      "Wálter": ["B-1032", "B-1039", "B-1045"],
  }

  # The till's file is in the folder. Its first line:
  with open("till_export.csv", encoding="utf-8", newline="") as file:
      print(file.readline().strip())

  # TODO: go through the file with csv.DictReader, add up per stall the amounts of the
  # issued receipts and keep in a set the receipt numbers that appear.
  # TODO: print one line per stall: print("Catalina:", total)
  # TODO: find which copies aren't in the file (a set difference)
solution: |
  import csv
  from collections import defaultdict

  copies = {
      "Catalina": ["B-1031", "B-1036", "B-1041"],
      "Hermes": ["B-1034", "B-1037", "B-1040", "B-1042"],
      "Rocío": ["B-1033", "B-1038", "B-1043", "B-1044"],
      "Wálter": ["B-1032", "B-1039", "B-1045"],
  }

  totals = defaultdict(float)
  in_file = set()
  with open("till_export.csv", encoding="utf-8", newline="") as file:
      for row in csv.DictReader(file):
          in_file.add(row["receipt"])
          if row["status"] == "issued":
              totals[row["stall"]] += float(row["amount"])

  for stall, numbers in copies.items():
      print(f"{stall}: {totals[stall]:.2f}")
      for receipt in sorted(set(numbers) - in_file):
          print("  Not in the file:", receipt)
answer: B-1043
answerLabel: Which receipt isn't in the file?
reveal: |
  B-1043, from Rocío's stall. Her copies add up to 110 soles, but the file only has 82.50: the 27.50 of that receipt are missing, because it was handed over on paper and never went into the till. Wálter only adds up if you leave out B-1035, which is void; and whoever split the rows with `split(",")` tripped over the dishes that contain a comma.
hints:
  - "On every turn of `csv.DictReader`, `row[\"receipt\"]` goes into the set and, if `row[\"status\"] == \"issued\"`, `float(row[\"amount\"])` is added to the total of `row[\"stall\"]`."
  - "The missing copies are `set(copies[stall]) - in_file`."
```

## The judge

As since session 4, the judge calls your functions and compares what they return. Here the files arrive **as text**: wrap it in `io.StringIO(text)` so that `csv` reads it as if it were an open file.

```exercise
id: py19-juez-resumen
type: judge
mode: function
function: sales_summary
title: The food court summary
prompt: |
  **Write `sales_summary(text)`, which receives a sales CSV and returns a list `[stall, units, total]` per stall, from the one that sold the most to the one that sold the least.**

  The CSV comes straight from the market's till, so its header is in Spanish: `puesto,producto,cantidad,precio` (stall, product, quantity, price). Each row sold `cantidad` units at `precio` soles each. Per stall, `units` is the sum of the quantities and `total` the sum of `cantidad × precio`.

  - Sort by `total`, from largest to smallest; if two stalls tie, by stall name, from A to Z.
  - Some products contain commas and come in quotes.
  - A CSV with only the header returns `[]`.

  **Constraints:** 0 to 25 rows · quantities from 1 to 6 · prices are multiples of 0.5, from 1 to 45.
visual:
  figure:
    title: Example 1
    input: { label: text, text: "puesto,producto,cantidad,precio\nWálter,Arroz con pato,2,26.00\nCatalina,King Kong de manjar,1,32.00\nWálter,\"Arroz con pato, doble\",1,45.00\nRocío,Cabrito,3,24.00\nCatalina,\"Alfajores, maná y cocadas\",2,18.50" }
    arrow: "DictReader → sum per stall → sorted(key=(-total, stall))"
    output: { label: returns, table: { head: ["stall", "units", "total"], rows: [["Wálter", "3", "97.0"], ["Rocío", "3", "72.0"], ["Catalina", "3", "69.0"]] } }
starter: |
  import csv
  import io


  def sales_summary(text):
      return []
solution: |
  import csv
  import io
  from collections import defaultdict


  def sales_summary(text):
      units = defaultdict(int)
      totals = defaultdict(float)
      for row in csv.DictReader(io.StringIO(text)):
          quantity = int(row["cantidad"])
          units[row["puesto"]] += quantity
          totals[row["puesto"]] += quantity * float(row["precio"])
      summary = [[stall, units[stall], totals[stall]] for stall in totals]
      return sorted(summary, key=lambda r: (-r[2], r[0]))
hints:
  - "`csv.DictReader(io.StringIO(text))` gives you each row as a dictionary; `cantidad` and `precio` arrive as text."
  - "With two `defaultdict`s you add up units and totals; sort with `key=lambda r: (-r[2], r[0])`."
samples:
  - args: ["puesto,producto,cantidad,precio\nWálter,Arroz con pato,2,26.00\nCatalina,King Kong de manjar,1,32.00\nWálter,\"Arroz con pato, doble\",1,45.00\nRocío,Cabrito,3,24.00\nCatalina,\"Alfajores, maná y cocadas\",2,18.50\n"]
    returns: [["Wálter", 3, 97.0], ["Rocío", 3, 72.0], ["Catalina", 3, 69.0]]
    note: "Wálter: 2 × 26 + 45 = 97. Catalina: 32 + 2 × 18.50 = 69."
  - args: ["puesto,producto,cantidad,precio\nSegundo,Espesado,2,19.00\nHermes,Tortilla de raya,1,22.00\nHermes,Chinguirito,1,16.00\n"]
    returns: [["Hermes", 2, 38.0], ["Segundo", 2, 38.0]]
    note: They tie at 38; Hermes goes first by name.
edge:
  - args: ["puesto,producto,cantidad,precio\n"]
    tag: with only the header
  - args: ["puesto,producto,cantidad,precio\nHermes,Espesado,1,19.00"]
    tag: with a single sale and no line break at the end
  - args: ["puesto,producto,cantidad,precio\nWálter,Chinguirito,2,16.00\nCatalina,King Kong,1,32.00\n"]
    tag: with a tie where the first to appear goes second
  - args: ["puesto,producto,cantidad,precio\nRocío,\"Cabrito, con frejoles\",2,28.50\nRocío,\"Seco, para llevar\",1,30.00\n"]
    tag: with commas inside the products
  - args: ["puesto,producto,cantidad,precio\nSegundo,Raya,1,10.00\nHermes,Pato,2,5.00\nEufemia,Cocadas,4,2.50\n"]
    tag: with three stalls tied
  - args: ["puesto,producto,cantidad,precio\nHermes,Espesado,1,9.00\nCatalina,King Kong,4,30.00\nWálter,Pato,1,45.00\n"]
    tag: with totals of different numbers of digits
random:
  count: 40
  seed: 1919
  generate: |
    import csv
    import io
    stalls = ["Catalina", "Hermes", "Rocío", "Wálter", "Eufemia", "Segundo"]
    products = ["King Kong", "Arroz con pato", "Cabrito, con frejoles", "Tortilla de raya",
                "Espesado", "Pato, arroz y yuca", "Chinguirito"]
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(["puesto", "producto", "cantidad", "precio"])
    k = rng.int(1, 6)
    for _ in range(rng.int(0, 25)):
        price = rng.int(1, 18) * 2.5
        writer.writerow([rng.pick(stalls[:k]), rng.pick(products), rng.int(1, 6), f"{price:.2f}"])
    return [out.getvalue()]
wrong:
  - |
    def sales_summary(text):
        data = {}
        for line in text.strip().split("\n")[1:]:
            stall, product, quantity, price = line.split(",")
            u, t = data.get(stall, (0, 0))
            data[stall] = (u + int(quantity), t + int(quantity) * float(price))
        return sorted(([p, u, t] for p, (u, t) in data.items()), key=lambda r: (-r[2], r[0]))
  - |
    import csv
    import io


    def sales_summary(text):
        data = {}
        for row in csv.DictReader(io.StringIO(text)):
            u, t = data.get(row["puesto"], (0, 0))
            data[row["puesto"]] = (u + int(row["cantidad"]), t + int(row["cantidad"]) * float(row["precio"]))
        return sorted(([p, u, t] for p, (u, t) in data.items()), key=lambda r: r[2], reverse=True)
  - |
    import csv
    import io


    def sales_summary(text):
        data = {}
        for row in csv.DictReader(io.StringIO(text)):
            u, t = data.get(row["puesto"], (0, 0))
            data[row["puesto"]] = (u + int(row["cantidad"]), t + int(row["cantidad"]) * float(row["precio"]))
        return sorted(([p, u, t] for p, (u, t) in data.items()), key=lambda r: (r[2], r[0]), reverse=True)
  - |
    import csv
    import io


    def sales_summary(text):
        data = {}
        for stall, product, quantity, price in csv.reader(io.StringIO(text)):
            u, t = data.get(stall, (0, 0))
            data[stall] = (u + int(quantity), t + int(quantity) * float(price))
        return sorted(([p, u, t] for p, (u, t) in data.items()), key=lambda r: (-r[2], r[0]))
```

```exercise
id: py19-juez-fiados
type: judge
mode: function
function: merge_tabs
title: The tabs from the two tills
prompt: |
  **Write `merge_tabs(till_a, till_b)`, which merges the tabs from two tills and returns, as JSON text, how much each customer still owes.**

  In the food court there are regulars who eat today and pay on Friday. The market's two tills write down those tabs and each exports a JSON text: a list of records like `{"boleta": "F-2", "cliente": "Puicón", "monto": 30.0, "pagado": false}` (the till speaks Spanish: receipt, customer, amount, paid).

  - A receipt can be **in both tills** (they sync): count it only once, and if the records don't match, the one in `till_b`, the newer one, wins.
  - A customer's debt is the sum of the `monto` of their unpaid receipts. Customers who owe nothing don't appear.
  - Return exactly `json.dumps(debts, ensure_ascii=False, sort_keys=True)`.

  **Constraints:** 0 to 14 different receipts · amounts are multiples of 0.5, from 1 to 20.
visual:
  figure:
    title: Example 1
    panes:
      - { label: till_a, table: { head: ["boleta", "cliente", "monto", "pagado"], rows: [["F-1", "Ñique", "12.5", "false"], ["F-2", "Puicón", "30.0", "false"]] } }
      - { label: till_b, table: { head: ["boleta", "cliente", "monto", "pagado"], rows: [["F-2", "Puicón", "30.0", "true"], ["F-3", "Ñique", "8.0", "false"], ["F-4", "Chapoñán", "15.5", "false"]] } }
      - { label: returns, value: "{\"Chapoñán\": 15.5, \"Ñique\": 20.5}" }
    caption: "F-2 is in both tills and the one in `till_b` wins: Puicón has already paid."
starter: |
  import json


  def merge_tabs(till_a, till_b):
      return "{}"
solution: |
  import json


  def merge_tabs(till_a, till_b):
      receipts = {}
      for record in json.loads(till_a) + json.loads(till_b):
          receipts[record["boleta"]] = record
      debts = {}
      for record in receipts.values():
          if not record["pagado"]:
              customer = record["cliente"]
              debts[customer] = debts.get(customer, 0) + record["monto"]
      return json.dumps(debts, ensure_ascii=False, sort_keys=True)
hints:
  - "A dictionary `receipt → record` removes the repeats: if you go through `till_a` first and then `till_b`, the one from `till_b` overwrites the one from `till_a`."
  - "Without `ensure_ascii=False`, `Ñique` comes out as `\\u00d1ique` and the text is no longer the same."
samples:
  - args: ['[{"boleta": "F-1", "cliente": "Ñique", "monto": 12.5, "pagado": false}, {"boleta": "F-2", "cliente": "Puicón", "monto": 30.0, "pagado": false}]', '[{"boleta": "F-2", "cliente": "Puicón", "monto": 30.0, "pagado": true}, {"boleta": "F-3", "cliente": "Ñique", "monto": 8.0, "pagado": false}, {"boleta": "F-4", "cliente": "Chapoñán", "monto": 15.5, "pagado": false}]']
    returns: '{"Chapoñán": 15.5, "Ñique": 20.5}'
    note: The picture above.
  - args: ['[{"boleta": "F-7", "cliente": "Tantaleán", "monto": 22.5, "pagado": false}]', '[{"boleta": "F-7", "cliente": "Tantaleán", "monto": 22.5, "pagado": false}]']
    returns: '{"Tantaleán": 22.5}'
    note: The same receipt in both tills counts once.
edge:
  - args: ["[]", "[]"]
    tag: with both tills empty
  - args: ['[{"boleta": "F-1", "cliente": "Vallejos", "monto": 10.0, "pagado": true}]', "[]"]
    tag: when everything is paid
  - args: ["[]", '[{"boleta": "F-2", "cliente": "Ñique", "monto": 4.0, "pagado": false}, {"boleta": "F-3", "cliente": "Ñique", "monto": 6.5, "pagado": false}]']
    tag: with everything in the second till
  - args: ['[{"boleta": "F-9", "cliente": "Saavedra", "monto": 3.5, "pagado": false}]', '[{"boleta": "F-9", "cliente": "Saavedra", "monto": 3.5, "pagado": true}]']
    tag: when the second till already recorded the payment
  - args: ['[{"boleta": "F-1", "cliente": "Vallejos", "monto": 2.0, "pagado": false}, {"boleta": "F-2", "cliente": "Acosta", "monto": 5.0, "pagado": false}]', '[{"boleta": "F-3", "cliente": "Puicón", "monto": 1.5, "pagado": false}]']
    tag: with customers that need sorting
random:
  count: 40
  seed: 1920
  generate: |
    import json
    customers = ["Ñique", "Tantaleán", "Chapoñán", "Puicón", "Vallejos", "Saavedra"]
    till_a, till_b = [], []
    for n in range(rng.int(0, 14)):
        record = {"boleta": f"F-{n + 1}", "cliente": rng.pick(customers),
                  "monto": rng.int(2, 40) / 2, "pagado": rng.int(0, 3) == 0}
        place = rng.int(0, 3)
        if place == 0:
            till_a.append(record)
        elif place == 1:
            till_b.append(record)
        else:
            till_a.append(record)
            duplicate = dict(record)
            if rng.int(0, 1) == 0:
                duplicate["pagado"] = True
            till_b.append(duplicate)
    return [json.dumps(till_a, ensure_ascii=False), json.dumps(rng.shuffle(till_b), ensure_ascii=False)]
wrong:
  - |
    import json


    def merge_tabs(till_a, till_b):
        receipts = {r["boleta"]: r for r in json.loads(till_a) + json.loads(till_b)}
        debts = {}
        for r in receipts.values():
            if not r["pagado"]:
                debts[r["cliente"]] = debts.get(r["cliente"], 0) + r["monto"]
        return json.dumps(debts, sort_keys=True)
  - |
    import json


    def merge_tabs(till_a, till_b):
        debts = {}
        for r in json.loads(till_a) + json.loads(till_b):
            if not r["pagado"]:
                debts[r["cliente"]] = debts.get(r["cliente"], 0) + r["monto"]
        return json.dumps(debts, ensure_ascii=False, sort_keys=True)
  - |
    import json


    def merge_tabs(till_a, till_b):
        receipts = {r["boleta"]: r for r in json.loads(till_b) + json.loads(till_a)}
        debts = {}
        for r in receipts.values():
            if not r["pagado"]:
                debts[r["cliente"]] = debts.get(r["cliente"], 0) + r["monto"]
        return json.dumps(debts, ensure_ascii=False, sort_keys=True)
```

## Final mission

```exercise
id: py19-mision-comandas
type: mission
title: The orders from the file
prompt: |
  **Read `orders.csv`, serve the orders that aren't void in order of time and write each one down in `served.txt`.**

  The till no longer shouts out the orders: it leaves them in `orders.csv`, with the columns `time,table,dish,status`. Quilla starts in the kitchen (K) facing east, and `take_to(table, dish)` is already written: it cooks, serves and comes back to the kitchen.

  1. Read the file with `csv.DictReader` and keep the rows whose `status` isn't `"void"`. Careful: `table` arrives as text.
  2. Sort them by `time` and, if two have the same time, the lower-numbered table first (a tuple as the `key`).
  3. Serve each one and write one line per served order to `served.txt`: `12:05 table 1: Tortilla de raya`.

  The file changes in every test. When it passes, together with the judges, session 20 unlocks.
visual:
  figure:
    title: The orders.csv of the first test
    input: { label: orders.csv, table: { head: ["time", "table", "dish", "status"], rows: [["12:40", "3", "Arroz con pato, sin culantro", "ready"], ["12:05", "1", "Tortilla de raya", "ready"], ["12:20", "5", "Cabrito", "void"], ["12:40", "2", "Espesado", "ready"], ["12:15", "4", "King Kong de manjar", "ready"]] } }
    arrow: "no void ones · sorted(key=(time, table))"
    output: { label: served.txt, text: "12:05 table 1: Tortilla de raya\n12:15 table 4: King Kong de manjar\n12:40 table 2: Espesado\n12:40 table 3: Arroz con pato, sin culantro" }
files:
  orders.csv: |
    time,table,dish,status
    12:40,3,"Arroz con pato, sin culantro",ready
    12:05,1,Tortilla de raya,ready
    12:20,5,Cabrito,void
    12:40,2,Espesado,ready
    12:15,4,King Kong de manjar,ready
starter: |
  import csv


  def half_turn():
      robot.turn_right()
      robot.turn_right()


  def take_to(table, dish):
      """Cooks the dish, serves it at its table and comes back to the kitchen facing east."""
      steps = 2 * table - 1
      robot.cook(dish)
      robot.forward(steps)
      robot.serve()
      half_turn()
      robot.forward(steps)
      half_turn()


  # TODO: read orders.csv with csv.DictReader and drop the void ones
  # TODO: sort by time and, on a tie, by table number
  # TODO: serve each order and write it down in served.txt
solution: |
  import csv


  def half_turn():
      robot.turn_right()
      robot.turn_right()


  def take_to(table, dish):
      """Cooks the dish, serves it at its table and comes back to the kitchen facing east."""
      steps = 2 * table - 1
      robot.cook(dish)
      robot.forward(steps)
      robot.serve()
      half_turn()
      robot.forward(steps)
      half_turn()


  with open("orders.csv", encoding="utf-8", newline="") as file:
      orders = [row for row in csv.DictReader(file) if row["status"] != "void"]
  orders.sort(key=lambda o: (o["time"], int(o["table"])))

  with open("served.txt", "w", encoding="utf-8") as log:
      for order in orders:
          take_to(int(order["table"]), order["dish"])
          log.write(f"{order['time']} table {order['table']}: {order['dish']}\n")
hints:
  - "`[row for row in csv.DictReader(file) if row[\"status\"] != \"void\"]` reads and filters in one go. For `take_to`, the table goes in as `int(row[\"table\"])`."
  - "`orders.sort(key=lambda o: (o[\"time\"], int(o[\"table\"])))`: times like `\"12:05\"` sort correctly as text because they all have two digits."
world:
  theme: cocina
  level: 4
  dir: E
  map: |
    ############
    #K.........#
    ##1#2#3#4#5#
    ############
scenarios:
  - tests:
      - name: serves the four orders in order
        state: '[(s.table, s.dish) for s in w.served] == [(1, "Tortilla de raya"), (4, "King Kong de manjar"), (2, "Espesado"), (3, "Arroz con pato, sin culantro")]'
        msg: The dishes served don't match (table, dish or order). Did you drop the void one and sort by time and table?
      - name: writes the four down in served.txt
        expect: 'open("served.txt", encoding="utf-8").read().splitlines() == ["12:05 table 1: Tortilla de raya", "12:15 table 4: King Kong de manjar", "12:40 table 2: Espesado", "12:40 table 3: Arroz con pato, sin culantro"]'
  - files:
      orders.csv: |
        time,table,dish,status
        13:10,5,"Pepián de pavo, con arroz",ready
        13:02,5,Chinguirito,ready
        13:30,1,Arroz con pato,void
        13:25,2,Causa ferreñafana,ready
    tests:
      - name: serves the afternoon orders
        state: '[(s.table, s.dish) for s in w.served] == [(5, "Chinguirito"), (5, "Pepián de pavo, con arroz"), (2, "Causa ferreñafana")]'
      - name: writes down the afternoon ones
        expect: 'open("served.txt", encoding="utf-8").read().splitlines() == ["13:02 table 5: Chinguirito", "13:10 table 5: Pepián de pavo, con arroz", "13:25 table 2: Causa ferreñafana"]'
  - files:
      orders.csv: |
        time,table,dish,status
        11:55,4,Cabrito,void
        11:45,3,Seco de cabrito,ready
    tests:
      - name: serves only the one that wasn't voided
        state: '[(s.table, s.dish) for s in w.served] == [(3, "Seco de cabrito")]'
      - name: writes down just one
        expect: 'open("served.txt", encoding="utf-8").read() == "11:45 table 3: Seco de cabrito\n"'
tests:
  - name: ends in the kitchen facing east
    state: 'w.at_kitchen and w.dir == "E"'
  - name: without crashing
    state: not w.crashed
  - name: reads with DictReader inside a with
    source: '\bwith\s+open\s*\([\s\S]*\bDictReader\s*\('
  - name: sorts with a tuple as the key
    source: 'key\s*=\s*lambda\s+\w+\s*:\s*\('
```

## Expert challenge

```exercise
id: py19-reto-reporte
type: challenge
title: The report for the audit
visual:
  figure:
    title: day_sales, grouped and written
    input: { label: day_sales, table: { head: ["stall", "product", "quantity", "price"], rows: [["Wálter", "Arroz con pato, doble", "1", "45.0"], ["Catalina", "King Kong", "2", "32.0"], ["Wálter", "Chinguirito", "3", "16.0"], ["Wálter", "Arroz con pato, doble", "1", "45.0"]] } }
    arrow: "group · sort · csv.writer"
    output: { label: returns, text: "stall,product,quantity,amount\nCatalina,King Kong,2,64.00\nWálter,\"Arroz con pato, doble\",2,90.00\nWálter,Chinguirito,3,48.00\nTOTAL,,7,202.00" }
prompt: |
  **Write `csv_report(sales)`, which returns the text of the CSV that don Segundo hands to the auditor.** For people who already code.

  `sales` is a list of dictionaries with `stall`, `product`, `quantity` and `price` (numbers).

  - Merge the rows with the same stall and product: add up `quantity` and `amount` (`quantity × price`).
  - Header `stall,product,quantity,amount`. Rows sorted by stall (A to Z), then by amount (largest to smallest), then by product.
  - At the end, `TOTAL,,<units>,<total amount>`. Amounts with two decimals.
  - Write it with `csv.writer` over an `io.StringIO`, with `lineterminator="\n"`: that way products with commas come out in quotes.
globals:
  day_sales:
    - { stall: Wálter, product: "Arroz con pato, doble", quantity: 1, price: 45.0 }
    - { stall: Catalina, product: King Kong, quantity: 2, price: 32.0 }
    - { stall: Wálter, product: Chinguirito, quantity: 3, price: 16.0 }
    - { stall: Wálter, product: "Arroz con pato, doble", quantity: 1, price: 45.0 }
starter: |
  import csv
  import io


  def csv_report(sales):
      return ""


  print(csv_report(day_sales))
solution: |
  import csv
  import io
  from collections import defaultdict


  def csv_report(sales):
      quantities = defaultdict(int)
      amounts = defaultdict(float)
      for sale in sales:
          key = (sale["stall"], sale["product"])
          quantities[key] += sale["quantity"]
          amounts[key] += sale["quantity"] * sale["price"]
      order = sorted(amounts, key=lambda k: (k[0], -amounts[k], k[1]))
      out = io.StringIO()
      writer = csv.writer(out, lineterminator="\n")
      writer.writerow(["stall", "product", "quantity", "amount"])
      for stall, product in order:
          key = (stall, product)
          writer.writerow([stall, product, quantities[key], f"{amounts[key]:.2f}"])
      writer.writerow(["TOTAL", "", sum(quantities.values()), f"{sum(amounts.values()):.2f}"])
      return out.getvalue()


  print(csv_report(day_sales))
hints:
  - "A tuple `(stall, product)` works as the key to group with `defaultdict`."
  - "`csv.writer(out, lineterminator=\"\\n\")` and at the end `out.getvalue()`."
tests:
  - name: the report in the picture
    run: csv_report(day_sales)
    equals: "stall,product,quantity,amount\nCatalina,King Kong,2,64.00\nWálter,\"Arroz con pato, doble\",2,90.00\nWálter,Chinguirito,3,48.00\nTOTAL,,7,202.00\n"
  - name: with no sales
    run: csv_report([])
    equals: "stall,product,quantity,amount\nTOTAL,,0,0.00\n"
  - name: tied amounts, by product
    run: 'csv_report([{"stall": "Rocío", "product": "Seco", "quantity": 1, "price": 30.0}, {"stall": "Rocío", "product": "Cabrito", "quantity": 2, "price": 15.0}, {"stall": "Hermes", "product": "Raya", "quantity": 1, "price": 22.5}])'
    equals: "stall,product,quantity,amount\nHermes,Raya,1,22.50\nRocío,Cabrito,2,30.00\nRocío,Seco,1,30.00\nTOTAL,,4,82.50\n"
  - name: reads back with csv
    expect: 'list(csv.reader(io.StringIO(csv_report(day_sales))))[2] == ["Wálter", "Arroz con pato, doble", "2", "90.00"]'
  - name: uses csv.writer
    source: '\bcsv\.writer\s*\('
```
