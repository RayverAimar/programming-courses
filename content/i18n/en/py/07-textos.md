# Session 7 — Text

## The job

Catacaos, in the Bajo Piura, half a block from Calle Comercio, where the filigree shops glitter from the pavement. There, on a second floor that smells of café de olla, **Radio La Filigrana** is on the air: the voice of doña **Hermelinda Sosa** wakes the town at five with announcements, greetings and dedications. People call, dictate their message and the intern writes it down as best he can: with extra spaces, all in capitals or all in lowercase, sometimes in code.

Hermelinda asked Maru for "a robot that reads nicely", and Quilla was sent by bus all the way to Piura. The messages are **text**, and today Quilla learns to clean them, cut them, search inside them and format them. At the end of the day it will carry the orders dictated over the radio, house by house.

```scene
theme: barranco
level: 1
dir: E
caption: Quilla comes down from the radio station (on the left) and takes the day's first dedication to tía Chabuca's mailbox (D).
map: |
  #########
  #R.######
  ##.....D#
  #########
program: |
  robot.forward(1)
  robot.turn_right()
  robot.forward(1)
  robot.turn_left()
  robot.forward(5)
  robot.deliver("Greetings for tía Chabuca")
```

## The minimum

A text (`str`) is a row of characters. Python comes with dozens of **methods** for working with them: you call them with a dot, `text.method()`, and **each one returns a new text**.

```py run
message = "  Greetings for AUNT Chabuca, from Wilmer  "
clean = message.strip()
print(clean.lower())
print(clean.split(", "))
print(clean.startswith("Greetings"), clean.find("Chabuca"), clean.count("a"))
print(clean.replace("Wilmer", "her nephew Wilmer"))
```

- **`strip()`** removes the spaces (and line breaks) at both ends; **`lower()`** / **`upper()`** switch to lowercase / uppercase.
- **`split(sep)`** cuts the text into a list of pieces; **with no argument**, it cuts on any number of spaces and drops the empty pieces. **`sep.join(list)`** does the opposite: it glues the pieces together with `sep` in between. `" ".join(text.split())` leaves a single space between words.
- **`replace(old, new)`** changes every occurrence; **`startswith`** / **`endswith`** ask about the beginning and the end; **`find`** tells you at which position something appears (or `-1` if it isn't there); **`count`** counts how many times it appears.

Each character has a **position**, starting at 0. With square brackets you take one, or a **slice** `[start:stop:step]`, just like with lists: `stop` is not included and negatives count from the end.

```figure
title: An order's code, letter by letter
panes:
  - label: "code = \"CAT-0417\""
    cells: ["C", "A", "T", "-", "0", "4", "1", "7"]
    highlight: [4, 5, 6, 7]
caption: "`code[4:8]` is `\"0417\"`, `code[:3]` is `\"CAT\"` and `code[-1]` is `\"7\"`."
```

```py run
code = "CAT-0417-STRAWHAT"
print(code[0], code[-1], code[4:8], code[9:])
print(code[::-1])
print("STRAWHAT" in code, len(code))
```

A `for` walks through a text **character by character**, and `in` asks whether a character (or a piece) is inside another text. Watch Quilla count the vowels in a greeting:

```anim
title: Walking through a text, letter by letter
code: |
  greeting = "Hello Catacaos"
  vowels = 0
  for letter in greeting.lower():
      if letter in "aeiou":
          vowels += 1
  print(vowels, "vowels")
notes:
  3: "greeting.lower() is a new text; the for walks through it one character at a time."
  4: "in asks whether the letter is inside \"aeiou\"."
  6: "The space and the consonants added nothing."
```

**Formatting inside f-strings.** After `:` goes how to write the value: `{x:>8}` aligns it to the right in 8 spaces (`<` to the left, `^` centred), `{x:.2f}` with two decimals, `{x:,}` with a thousands separator and `{x:05d}` padded with zeros up to 5 digits. They combine: `{x:>10,.2f}`.

```py run
customer = "Petronila"
total = 1309.5
print(f"[{customer:<12}][{customer:>12}][{customer:^12}]")
print(f"S/ {total:>10,.2f}  Order {7:05d}")
```

**Characters are numbers.** `ord("A")` gives the letter's code (65) and `chr(65)` goes the way back. Since the letters from `A` to `Z` have consecutive codes, with `ord` and `chr` you can "move" a letter: `chr(ord("A") + 2)` is `"C"`.

```py run
print(ord("A"), ord("B"), ord("Z"))
print(chr(ord("H") + 1), chr(ord("a") - 32))
```

> **Common trap:** texts **can't be changed**. `message.upper()` on its own does nothing visible: it returns a new text that is lost unless you store it (`message = message.upper()`). And `message[0] = "S"` is a `TypeError`: to "change" a character, build a new text.

<!-- legacy: format-spec -->

<!-- legacy: removeprefix -->

<!-- mdn: str-methods format-spec removeprefix -->

## Practice

```exercise
id: py7-predice-inmutable
type: predict
title: The greeting that didn't get fixed
prompt: |
  The intern wants the greeting clean and in capitals before reading it on air. What does it print?
code: |
  greeting = "  greetings for aunt chabuca  "
  greeting.strip()
  greeting.upper()
  print(f"[{greeting}]")
  greeting = greeting.strip().upper()
  print(f"[{greeting}]")
options:
  - "[  greetings for aunt chabuca  ]\n[GREETINGS FOR AUNT CHABUCA]"
  - "[GREETINGS FOR AUNT CHABUCA]\n[GREETINGS FOR AUNT CHABUCA]"
  - "[greetings for aunt chabuca]\n[GREETINGS FOR AUNT CHABUCA]"
  - "[  GREETINGS FOR AUNT CHABUCA  ]\n[GREETINGS FOR AUNT CHABUCA]"
answer: "[  greetings for aunt chabuca  ]\n[GREETINGS FOR AUNT CHABUCA]"
explain: |
  Lines 2 and 3 compute new texts and throw them away: nobody stores them. `greeting` stays the same until line 5, which stores the result of `strip().upper()` in the same variable.
```

```exercise
id: py7-predice-cortes
type: predict
title: The order code
prompt: |
  Every order for the hat shop comes with a code. What does this program print?
code: |
  code = "CAT-0417-STRAWHAT"
  print(code[:3], code[4:8], code[-8:])
  print(code.find("-"), code.find("x"), code.count("A"))
options:
  - "CAT 0417 STRAWHAT\n3 -1 3"
  - "CAT- 0417- STRAWHAT\n3 -1 3"
  - "CAT 0417 STRAWHAT\n3 None 3"
  - "CAT 417- STRAWHAT\n4 -1 2"
answer: "CAT 0417 STRAWHAT\n3 -1 3"
explain: |
  In a slice, the number on the right **is not included**: `[:3]` is positions 0, 1 and 2, and `[4:8]` goes from 4 to 7. `[-8:]` is the last 8. `find` gives the **first** position of the hyphen (3) and `-1` when it finds nothing; `count("A")` counts the capital A's: there are three, one in CAT and two in STRAWHAT.
```

```exercise
id: py7-predice-ord
type: predict
title: Letters that are numbers
prompt: |
  Quilla looks inside the letters. What does it print?
code: |
  print(ord("A"), ord("D"), chr(ord("a") + 2), chr(72) + chr(105))
options:
  - "65 68 c Hi"
  - "65 68 a2 Hi"
  - "1 4 c Hi"
  - "65 68 c 177"
answer: "65 68 c Hi"
explain: |
  `ord("A")` is 65, and since the letters are consecutive, `D` is 68. `ord("a") + 2` is a number; `chr` turns it back into a letter: `c`. `chr(72)` is `H` and `chr(105)` is `i`, and two texts joined with `+` stick together.
```

```exercise
id: py7-completa-cartelera
type: complete
title: The announcements board
prompt: |
  Hermelinda charges announcements by the second and pins the list on the booth wall. Fill in the `___` with formats so it comes out **exactly** like this:

  ```
  Sheet No. 00042
  Yarlequé Hat Shop       30s  S/     45.00
  Picantería La Chayo     45s  S/     67.50
  Ipanaqué Filigree      120s  S/  1,180.00
  ```

  - the sheet number **padded with zeros** up to 5 digits;
  - the customer **on the left** in 22 spaces;
  - the seconds **on the right** in 4;
  - the price **on the right** in 9, with a **thousands separator** and **2 decimals**.
starter: |
  sheet = 42
  ads = [("Yarlequé Hat Shop", 30, 45.0), ("Picantería La Chayo", 45, 67.5), ("Ipanaqué Filigree", 120, 1180.0)]

  print(f"Sheet No. {sheet:___}")
  for customer, seconds, price in ads:
      print(f"{customer:___}{seconds:___}s  S/ {price:___}")
solution: |
  sheet = 42
  ads = [("Yarlequé Hat Shop", 30, 45.0), ("Picantería La Chayo", 45, 67.5), ("Ipanaqué Filigree", 120, 1180.0)]

  print(f"Sheet No. {sheet:05d}")
  for customer, seconds, price in ads:
      print(f"{customer:<22}{seconds:>4}s  S/ {price:>9,.2f}")
hints:
  - "Zeros on the left: `05d`. Aligning: `<22` and `>4`."
  - "The price puts three things together in this order: alignment and width, the comma, the decimals: `>9,.2f`."
tests:
  - name: the board comes out exact
    output: "Sheet No. 00042\nYarlequé Hat Shop       30s  S/     45.00\nPicantería La Chayo     45s  S/     67.50\nIpanaqué Filigree      120s  S/  1,180.00"
  - name: uses formats, not hand-typed spaces
    source: '\{sheet:05d\}'
    msg: Write the sheet number with {sheet:05d}.
```

```exercise
id: py7-arregla-telefono
type: fix
title: The phone number on air
prompt: |
  Phone numbers aren't read out on the radio: `hide_digits` should change **every digit into an asterisk** and return the covered message. It crashes. Run it, read the error and fix it by **walking through the message character by character** (`for char in message`) and building a new text.
starter: |
  def hide_digits(message):
      """Changes every digit into an asterisk."""
      for i in range(len(message)):
          if message[i] in "0123456789":
              message[i] = "*"
      return message


  print(hide_digits("Call Pancho on 969 123 456"))
solution: |
  def hide_digits(message):
      """Changes every digit into an asterisk."""
      covered = ""
      for char in message:
          if char in "0123456789":
              covered += "*"
          else:
              covered += char
      return covered


  print(hide_digits("Call Pancho on 969 123 456"))
hints:
  - "The error says a `str` doesn't support assigning to a position: texts can't be changed."
  - "Start with `covered = \"\"` and, on each pass, add `\"*\"` or the character as it is."
tests:
  - name: covers the phone number
    run: hide_digits("Call Pancho on 969 123 456")
    equals: "Call Pancho on *** *** ***"
  - name: without digits, nothing changes
    run: hide_digits("Greetings to Catacaos")
    equals: Greetings to Catacaos
  - name: an empty message
    run: hide_digits("")
    equals: ""
  - name: the console shows it
    output: Call Pancho on *** *** ***
  - name: walks through the characters with for … in
    source: '\bfor\s+\w+\s+in\s+message\b'
    msg: Walk through the text directly, for char in message, without range(len(…)).
```

```exercise
id: py7-escribe-siglas
type: write
title: The association's initials
prompt: |
  Write `initials(name)`, which returns the **capitalised initials** of the words in the name, **leaving out** the short Spanish words `de`, `del`, `la`, `las`, `los`, `el` and `y` (however they're written).

  On the radio, long names are announced by their initials: `"Asociación de Artesanos de Catacaos"` (the Catacaos Craftsmen's Association) is `"AAC"`. The name may come with extra spaces.
visual:
  figure:
    title: initials("Asociación  de Artesanos de Catacaos")
    input: { label: words, cells: ["Asociación", "de", "Artesanos", "de", "Catacaos"], index: false }
    arrow: "without the short words, the first letter of each one"
    output: { label: returns, value: "\"AAC\"" }
starter: |
  def initials(name):
      pass


  print(initials("Asociación  de Artesanos de Catacaos"))
solution: |
  SHORT_WORDS = {"de", "del", "la", "las", "los", "el", "y"}


  def initials(name):
      """The capitalised initials of the words that aren't short."""
      letters = ""
      for word in name.split():
          if word.lower() not in SHORT_WORDS:
              letters += word[0].upper()
      return letters


  print(initials("Asociación  de Artesanos de Catacaos"))
hints:
  - "`name.split()` with no argument cuts on any number of spaces. `word[0]` is the first letter."
  - "Compare `word.lower()` with the short words, so that `DE` and `De` are skipped too."
tests:
  - name: the association
    run: initials("Asociación  de Artesanos de Catacaos")
    equals: AAC
  - name: with mixed capitals and lowercase
    run: initials("radio LA filigrana DEL bajo piura")
    equals: RFBP
  - name: with spaces at the ends
    run: initials("   feria y fiesta   ")
    equals: FF
  - name: an empty name
    run: initials("")
    equals: ""
  - name: with accents
    run: initials("úrsula ñique")
    equals: ÚÑ
```

```exercise
id: py7-escribe-dedicatoria
type: write
title: The dedication slip
prompt: |
  Write `read_dedication(slip)`, which returns the sentence Hermelinda reads on air: `Wilmer dedicates “Cholo soy” to aunt Chabuca`.

  The intern fills in one slip per call, with three fields separated by `|`: `FROM:`, `TO:` and `SONG:`, **in any order** and with extra spaces around them. Go through the fields, clean them and recognise each one by how it starts (`startswith`), removing its label with `removeprefix`.
visual:
  figure:
    title: A slip, field by field
    input: { label: slip, text: " TO:  aunt Chabuca |FROM: Wilmer| SONG: Cholo soy " }
    arrow: "split(\"|\"), strip, removeprefix"
    output: { label: returns, text: "Wilmer dedicates “Cholo soy” to aunt Chabuca" }
starter: |
  def read_dedication(slip):
      pass


  print(read_dedication(" TO:  aunt Chabuca |FROM: Wilmer| SONG: Cholo soy "))
solution: |
  def read_dedication(slip):
      """The sentence for the air, from the slip's three fields."""
      sender, recipient, song = "", "", ""
      for field in slip.split("|"):
          field = field.strip()
          if field.startswith("FROM:"):
              sender = field.removeprefix("FROM:").strip()
          elif field.startswith("TO:"):
              recipient = field.removeprefix("TO:").strip()
          elif field.startswith("SONG:"):
              song = field.removeprefix("SONG:").strip()
      return f"{sender} dedicates “{song}” to {recipient}"


  print(read_dedication(" TO:  aunt Chabuca |FROM: Wilmer| SONG: Cholo soy "))
hints:
  - "`slip.split(\"|\")` gives the three fields. After `strip()`, each one starts with its label."
  - "`field.removeprefix(\"FROM:\").strip()` leaves only the value."
tests:
  - name: the slip in the picture
    run: 'read_dedication(" TO:  aunt Chabuca |FROM: Wilmer| SONG: Cholo soy ")'
    equals: "Wilmer dedicates “Cholo soy” to aunt Chabuca"
  - name: in another order
    run: 'read_dedication("SONG: Mi Piurana|FROM: doña Rosa|TO: her compadre Pancho")'
    equals: "doña Rosa dedicates “Mi Piurana” to her compadre Pancho"
  - name: with spaces inside the value that are kept
    run: 'read_dedication("FROM:Eulalia |  TO:   the folks at the market  |SONG:   Tondero de mi tierra")'
    equals: "Eulalia dedicates “Tondero de mi tierra” to the folks at the market"
  - name: recognises each field by how it starts
    source: '\.startswith\s*\('
    msg: Use startswith to tell which field is which; the order changes.
```

## The case

```exercise
id: py7-caso-cifrado
type: case
title: The coded message
prompt: |
  **Decode each customer's order with their key and compare the number of hats with the one the intern wrote down.**

  Doña Petronila Yarlequé, the best hat maker in Catacaos, gets her orders over the radio, but **in code**, so that the competition across the street doesn't find out who buys from her. Each customer has a secret number `k` and moves every letter `k` places forward in the alphabet (A to Z; after Z it wraps back to A). Numbers and spaces are left alone. Kevin, the intern, decoded the four orders in his head and wrote down the quantities… and one customer got the wrong quantity.

  To decode, move each letter `k` places **backwards**: `chr((ord(letter) - ord("A") - k) % 26 + ord("A"))`. The `% 26` is what makes Z come before A.

  Print one line per customer with their name and the decoded message: `print("Eulalia:", decoded)`. The board takes the number in the message and compares it with what Kevin wrote down.
visual:
  board:
    for: py7-caso-cifrado
    task: "Decode each message with its key and compare the quantity with the one Kevin wrote down."
    cards:
      - name: Eulalia
        kind: person
        rows: [["Key", "3"], ["Received", "L ZDQW 12 HAWUD ILQH VWUDZ KDWV"], ["Kevin wrote", "12 hats"]]
        clue: { find: "Eulalia", says: 12, saysLabel: Kevin wrote }
      - name: Pancho
        kind: person
        rows: [["Key", "8"], ["Received", "AMVL 4 PIBA NWZ BPM XZWKMAAQWV"], ["Kevin wrote", "4 hats"]]
        clue: { find: "Pancho", says: 4, saysLabel: Kevin wrote }
      - name: Rosa
        kind: person
        rows: [["Key", "11"], ["Received", "TE TD 7 SLED QZC ESP HPOOTYR"], ["Kevin wrote", "7 hats"]]
        clue: { find: "Rosa", says: 7, saysLabel: Kevin wrote }
      - name: Wilmer
        kind: person
        culprit: true
        rows: [["Key", "5"], ["Received", "N SJJI 15 MFYX GJKTWJ XFYZWIFD"], ["Kevin wrote", "5 hats"]]
        clue: { find: "Wilmer", says: 5, saysLabel: Kevin wrote }
      - name: The key rule
        kind: note
        role: Stuck up in the booth
        rows: [["With key 3", "A → D, B → E, X → A"], ["To read", "each letter, 3 back"], ["Numbers and spaces", "don't change"]]
starter: |
  # What came over the radio, with each customer's key
  eulalia_order = "L ZDQW 12 HAWUD ILQH VWUDZ KDWV"      # key 3
  pancho_order = "AMVL 4 PIBA NWZ BPM XZWKMAAQWV"        # key 8
  rosa_order = "TE TD 7 SLED QZC ESP HPOOTYR"            # key 11
  wilmer_order = "N SJJI 15 MFYX GJKTWJ XFYZWIFD"        # key 5

  # TODO: write decode(message, key), which returns the decoded message
  # and print one line per customer, for example:
  # print("Eulalia:", decode(eulalia_order, 3))
solution: |
  eulalia_order = "L ZDQW 12 HAWUD ILQH VWUDZ KDWV"
  pancho_order = "AMVL 4 PIBA NWZ BPM XZWKMAAQWV"
  rosa_order = "TE TD 7 SLED QZC ESP HPOOTYR"
  wilmer_order = "N SJJI 15 MFYX GJKTWJ XFYZWIFD"


  def decode(message, key):
      """Moves each capital letter `key` places backwards."""
      plain = ""
      for char in message:
          if "A" <= char <= "Z":
              plain += chr((ord(char) - ord("A") - key) % 26 + ord("A"))
          else:
              plain += char
      return plain


  print("Eulalia:", decode(eulalia_order, 3))
  print("Pancho:", decode(pancho_order, 8))
  print("Rosa:", decode(rosa_order, 11))
  print("Wilmer:", decode(wilmer_order, 5))
answer: Wilmer
answerLabel: Which customer's order was written down wrong?
reveal: |
  Wilmer. His message says `I NEED 15 HATS BEFORE SATURDAY` and Kevin wrote down 5: he dropped the 1. The other three match: `I WANT 12 EXTRA FINE STRAW HATS`, `SEND 4 HATS FOR THE PROCESSION` and `IT IS 7 HATS FOR THE WEDDING`.
hints:
  - "Walk through the message with `for char in message:` and build a new text. Only letters move: ask `\"A\" <= char <= \"Z\"`."
  - "With key 3, the `L` (position 11) goes to `(11 - 3) % 26 = 8`, which is `I`. The `A` goes to `(0 - 3) % 26 = 23`, the `X`."
```

## The judge

Today's two judges are in function mode, as they have been since session 4: the judge calls your functions and compares what they **return**.

```exercise
id: py7-juez-nombres
type: judge
mode: function
function: normalize_name
title: Names for the air
prompt: |
  **Write `normalize_name(name)`, which returns the clean name: no extra spaces, each word with a capital first letter and the rest in lowercase, except for the particles.**

  Kevin writes the listeners' names down as they're dictated: `"  maría   DE LOS  ángeles  SERNAQUÉ "`. Hermelinda wants to read them properly written: `"María de los Ángeles Sernaqué"`.

  - Words are separated by **a single space**, with no spaces at the ends.
  - Each word has its **first letter in capitals** and the rest in lowercase.
  - The **particles** of Spanish names, `de`, `del`, `la`, `las`, `los` and `y`, go **all in lowercase**… unless they are the **first** word, which always gets a capital: `"DEL carpio"` is `"Del Carpio"`.

  `word.capitalize()` leaves the first letter in capitals and the rest in lowercase, accents included.

  **Constraints:** up to 10 words of letters (with accents and ñ), separated by one or more spaces · an empty name, or one with only spaces, returns `""`.
visual:
  figure:
    title: Example 1, word by word
    input: { label: name, text: "\"  maría   DE LOS  ángeles  SERNAQUÉ \"" }
    arrow: "split() · capitalize() except the particles · \" \".join"
    output: { label: returns, cells: ["María", "de", "los", "Ángeles", "Sernaqué"], index: false }
    steps:
      - "`split()` with no argument swallows all the spaces: 5 words are left."
      - "`de` and `los` are particles and aren't the first word: they go in lowercase."
      - "At the end they're joined with a single space: `\"María de los Ángeles Sernaqué\"`."
starter: |
  def normalize_name(name):
      return name
solution: |
  PARTICLES = {"de", "del", "la", "las", "los", "y"}


  def normalize_name(name):
      """The name with one space between words, capital initials and particles in lowercase."""
      words = []
      for word in name.split():
          word = word.lower()
          if words and word in PARTICLES:
              words.append(word)
          else:
              words.append(word.capitalize())
      return " ".join(words)
hints:
  - "`name.split()` (with no argument) gives you the words without any empty space; `\" \".join(words)` glues them back together."
  - "A word is the first one if the list you're building is still empty."
samples:
  - args: ["  maría   DE LOS  ángeles  SERNAQUÉ "]
    returns: María de los Ángeles Sernaqué
  - args: ["DEL carpio   wilmer"]
    returns: Del Carpio Wilmer
    note: The first word always gets a capital, even if it's a particle.
  - args: ["pancho y   rosa"]
    returns: Pancho y Rosa
edge:
  - args: [""]
    tag: with an empty name
  - args: ["     "]
    tag: with a name that has only spaces
  - args: ["eulalia"]
    tag: with a single word
  - args: ["   ÚRSULA    "]
    tag: with a single word in capitals and spaces
  - args: ["la   LA la"]
    tag: with repeated particles
  - args: ["de la cruz"]
    tag: with a name that starts with two particles
  - args: ["ñique   yarlequé DE   la   ROSA"]
    tag: with ñ and accents
  - args: ["y"]
    tag: with a lone particle
random:
  count: 40
  seed: 707
  generate: |
    first_names = ["maría", "josé", "eulalia", "pancho", "rosa", "wilmer", "hermelinda", "petronila", "ángel", "úrsula", "yesenia", "kevin", "chabuca", "ñique"]
    surnames = ["chunga", "ipanaqué", "sernaqué", "yarlequé", "vílchez", "sosa", "purizaca", "cruz", "carpio", "santos", "flores", "zapata"]
    particles = ["de", "del", "de la", "de los", "y", "la", "de las"]
    parts = []
    if rng.int(0, 3) == 0:
        parts.append(rng.pick(["de", "del", "la", "de los"]))
    for _ in range(rng.int(1, 2)):
        parts.append(rng.pick(first_names))
    for _ in range(rng.int(1, 3)):
        if rng.int(0, 2) == 0:
            parts.append(rng.pick(particles))
        parts.append(rng.pick(surnames))
    text = " " * rng.int(0, 3)
    for i, word in enumerate(" ".join(parts).split()):
        style = rng.int(0, 3)
        if style == 0:
            word = word.upper()
        elif style == 1:
            word = word.capitalize()
        elif style == 2:
            mixed = ""
            for letter in word:
                mixed += letter.upper() if rng.int(0, 1) else letter
            word = mixed
        if i > 0:
            text += " " * rng.int(1, 3)
        text += word
    text += " " * rng.int(0, 3)
    return [text]
wrong:
  - |
    def normalize_name(name):
        return " ".join(name.split()).title()
  - |
    PARTICLES = {"de", "del", "la", "las", "los", "y"}


    def normalize_name(name):
        words = []
        for word in name.strip().split(" "):
            word = word.lower()
            if words and word in PARTICLES:
                words.append(word)
            else:
                words.append(word.capitalize())
        return " ".join(words)
  - |
    PARTICLES = {"de", "del", "la", "las", "los", "y"}


    def normalize_name(name):
        words = []
        for word in name.split():
            word = word.lower()
            if word in PARTICLES:
                words.append(word)
            else:
                words.append(word.capitalize())
        return " ".join(words)
```

```exercise
id: py7-juez-comprimir
type: judge
mode: function
function: compress
title: The thrifty telegram
prompt: |
  **Write `compress(text)`, which turns each run of identical consecutive characters into `count + character`, and `decompress(code)`, which goes the way back.**

  A text-message announcement costs the radio per character, and in Catacaos people write `"SIIIIII LLEGAMOS"`. A run of a character repeated `n` times in a row is written as `n` and the character: `"AAAABBBCCD"` is `"4A3B2CD"`. A run of **a single** character goes without a number (`D`, not `1D`). The number can have several digits: twelve `A`s are `"12A"`.

  The judge tests both functions. In `decompress`, `char.isdigit()` tells you whether a character is a digit; collect consecutive digits before converting them with `int`.

  **Constraints:** the text has 0 to 200 characters, only capital letters and spaces (never digits) · the codes `decompress` gets are the ones `compress` would produce.
visual:
  figure:
    title: Example 1, run by run
    input: { label: text, cells: ["A", "A", "A", "A", "B", "B", "B", "C", "C", "D"], index: false }
    arrow: "each run → count + character"
    output: { label: returns, cells: ["4A", "3B", "2C", "D"], index: false }
    steps:
      - "Four A's in a row are `4A`; three B's, `3B`; two C's, `2C`."
      - "The D is alone: it goes without a number."
      - "They're glued into a single text: `\"4A3B2CD\"`."
starter: |
  def compress(text):
      return text


  def decompress(code):
      return code
solution: |
  def block(times, char):
      """A run written as count and character; with no count if it's 1."""
      if times == 1:
          return char
      return f"{times}{char}"


  def compress(text):
      """Each run of identical characters, as count + character."""
      if text == "":
          return ""
      parts = []
      current = text[0]
      times = 0
      for char in text:
          if char == current:
              times += 1
          else:
              parts.append(block(times, current))
              current = char
              times = 1
      parts.append(block(times, current))
      return "".join(parts)


  def decompress(code):
      """Repeats each character as many times as the digits before it say."""
      result = []
      digits = ""
      for char in code:
          if char.isdigit():
              digits += char
          else:
              times = int(digits) if digits else 1
              result.append(char * times)
              digits = ""
      return "".join(result)
hints:
  - "In `compress`, keep the current run's character and how many times it has appeared. When a different one arrives, close the run; when the `for` ends, close the last one."
  - "In `decompress`, collect the digits in a text (`\"12\"`) until you reach a letter or a space; that character is repeated `int(digits)` times, or once if there were no digits. `\"A\" * 3` is `\"AAA\"`."
samples:
  - args: ["AAAABBBCCD"]
    returns: 4A3B2CD
  - args: ["SIIIIII LLEGAMOS"]
    returns: S6I 2LEGAMOS
    note: The space is a character too; here it's alone, so it goes without a number.
  - fn: decompress
    args: ["12A3B"]
    returns: AAAAAAAAAAAABBB
    note: Twelve A's and three B's.
edge:
  - args: [""]
    tag: with an empty text
  - args: ["Z"]
    tag: with a single character
  - args: ["ABAB"]
    tag: with letters that repeat but not in a row
  - args: ["AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"]
    tag: with a single long run
  - args: ["HOLA   CATACAOS"]
    tag: with a run of spaces
  - args: ["ABBB"]
    tag: with the last run long
  - fn: decompress
    args: [""]
    tag: in decompress, with an empty code
  - fn: decompress
    args: ["4A3B2CD"]
    tag: in decompress, with one-digit runs
  - fn: decompress
    args: ["S6I 2LEGAMOS"]
    tag: in decompress, with a space
  - fn: decompress
    args: ["15Z2 X"]
    tag: in decompress, with a two-digit count
  - fn: decompress
    args: ["ABC"]
    tag: in decompress, without any number
random:
  count: 40
  seed: 77
  generate: |
    letters = rng.pick(["AB", "ABC", "SILO ", "CATAOS ", "ABCDEFGHIJKLMNOPQRSTUVWXYZ "])
    text = ""
    for _ in range(rng.int(1, 15)):
        text += rng.pick(list(letters)) * rng.pick([1, 1, 2, 3, 4, rng.int(5, 12)])
    return [text[:200]]
wrong:
  - |
    def compress(text):
        if text == "":
            return ""
        parts = []
        current = text[0]
        times = 0
        for char in text:
            if char == current:
                times += 1
            else:
                parts.append(f"{times}{current}")
                current = char
                times = 1
        parts.append(f"{times}{current}")
        return "".join(parts)


    def decompress(code):
        result, digits = "", ""
        for char in code:
            if char.isdigit():
                digits += char
            else:
                result += char * int(digits or 1)
                digits = ""
        return result
  - |
    def compress(text):
        parts = []
        current = text[:1]
        times = 0
        for char in text:
            if char == current:
                times += 1
            else:
                parts.append(f"{times}{current}" if times > 1 else current)
                current = char
                times = 1
        return "".join(parts)


    def decompress(code):
        result, digits = "", ""
        for char in code:
            if char.isdigit():
                digits += char
            else:
                result += char * int(digits or 1)
                digits = ""
        return result
  - |
    def compress(text):
        if text == "":
            return ""
        parts = []
        current = text[0]
        times = 0
        for char in text:
            if char == current:
                times += 1
            else:
                parts.append(f"{times}{current}" if times > 1 else current)
                current = char
                times = 1
        parts.append(f"{times}{current}" if times > 1 else current)
        return "".join(parts)


    def decompress(code):
        result = ""
        previous = ""
        for char in code:
            if char.isdigit():
                previous = char
            else:
                result += char * (int(previous) if previous else 1)
                previous = ""
        return result
```

## Final mission

```exercise
id: py7-mision-encargos
type: mission
title: The radio's errands
prompt: |
  **Read the radio's dictation line by line, build each errand's label and deliver it to its mailbox.**

  At noon, Hermelinda reads out the errands for Calle Comercio and Kevin types them into `dictation`, a single text with **one errand per line**: `steps | name | product`. `steps` is how many squares to move forward **from the previous mailbox** (or from the radio station, for the first one). Quilla starts facing east and its battery is just enough for the street.

  Kevin types however it comes out: extra spaces everywhere, capitals wherever they fall and **the odd blank line** that has to be skipped. Each errand's label is `First Last: product`:

  - the name with one space between words and each one with a capital first letter (`.title()` works: there are no particles today);
  - the product in lowercase, also with one space between words.

  `"  3 | eulalia   CHUNGA | Straw HAT  "` → move forward 3 and deliver `"Eulalia Chunga: straw hat"`. The dictation and the street change in each test.

  Once it passes, together with the judges, session 8 unlocks.
visual:
  figure:
    title: The first line, taken apart
    input: { label: line, text: "  3 | eulalia   CHUNGA | Straw HAT  " }
    arrow: "split(\"|\") · strip · title / lower"
    output: { label: Quilla does, text: "robot.forward(3)\nrobot.deliver(\"Eulalia Chunga: straw hat\")" }
starter: |
  # dictation comes from the booth, for example:
  # "  3 | eulalia   CHUNGA | Straw HAT  \n5|pancho ipanaqué|SILVER filigree\n..."
  print(dictation)
  # TODO: go through the lines, build each label and deliver it
solution: |
  def tidy(text):
      """A single space between words and nothing at the ends."""
      return " ".join(text.split())


  for line in dictation.splitlines():
      if line.strip() == "":
          continue
      steps, name, product = line.split("|")
      label = f"{tidy(name).title()}: {tidy(product).lower()}"
      robot.forward(int(steps))
      robot.deliver(label)
hints:
  - "`dictation.splitlines()` gives the list of lines. Skip the ones that are empty once the spaces are gone (`continue`)."
  - "`steps, name, product = line.split(\"|\")` separates the three fields. `int(\"  3 \")` works even with spaces around it."
world:
  theme: barranco
  level: 1
  dir: E
  battery: 13
  map: |
    ################
    #R..D....D.D..D#
    ################
globals:
  dictation: "  3 | eulalia   CHUNGA | Straw HAT  \n5|pancho ipanaqué|SILVER filigree\n\n 2 | ROSA sernaqué | chicha  de jora \n3 |  wilmer  vílchez  |  algarrobina"
scenarios:
  - tests:
      - name: delivers the four labels, in order
        state: 'w.delivered == ["Eulalia Chunga: straw hat", "Pancho Ipanaqué: silver filigree", "Rosa Sernaqué: chicha de jora", "Wilmer Vílchez: algarrobina"]'
        msg: Some label didn't come out clean or in order. Check spaces, capitals and lowercase.
  - map: |
      ##############
      #R.D......D.D#
      ##############
    world: { battery: 11 }
    globals:
      dictation: "\n2|  úrsula PURIZACA |pottery from Simbilá\n   \n 7 | HERMELINDA    sosa| Embroidered  BLANKET  \n2|yesenia zapata|NATILLAS\n"
    tests:
      - name: skips the blank lines
        state: 'w.delivered == ["Úrsula Purizaca: pottery from simbilá", "Hermelinda Sosa: embroidered blanket", "Yesenia Zapata: natillas"]'
        msg: Blank lines (or lines with only spaces) aren't errands; skip them.
  - map: |
      ##############
      #R..........D#
      ##############
    world: { battery: 11 }
    globals:
      dictation: "  11 |MAMÁ  ENCARNACIÓN  | Colourful SCARVES"
    tests:
      - name: a single errand, far away
        state: 'w.delivered == ["Mamá Encarnación: colourful scarves"]'
tests:
  - name: ends on the last mailbox
    state: w.at_goal
  - name: without crashing or running out of battery
    state: not w.crashed
  - name: cuts the text with split
    source: '\.split\s*\('
    msg: Cut each line with split("|"); the dictation changes in each test.
```

## Expert challenge

```exercise
id: py7-reto-pantalla
type: challenge
title: The announcer's screen
visual:
  figure:
    title: "wrap(\"ice cold chicha de jora for sale\", 12)"
    input: { label: width, value: "12" }
    arrow: "word by word, while it fits"
    output: { label: returns, cells: ["ice cold", "chicha de", "jora for", "sale"], index: false }
    steps:
      - "`ice cold chicha` would have 15 characters: `chicha` drops to the next line."
      - "`chicha de jora` would have 14: `jora` drops."
prompt: |
  **Write `wrap(text, width)`, which splits the announcement into lines of at most `width` characters and returns the list of lines.** For people who already code.

  Hermelinda reads the announcements on a narrow little screen. The words go in order, separated by one space, and each line holds **every word that fits**: if the next one no longer fits (counting the space that separates it), a new line starts. Extra spaces in the text don't count. No word is longer than `width`. A text with no words gives `[]`.
starter: |
  def wrap(text, width):
      return []


  print(wrap("ice cold chicha de jora for sale", 12))
solution: |
  def wrap(text, width):
      """The words spread over lines of at most `width` characters."""
      lines = []
      current = ""
      for word in text.split():
          if current == "":
              current = word
          elif len(current) + 1 + len(word) <= width:
              current += " " + word
          else:
              lines.append(current)
              current = word
      if current:
          lines.append(current)
      return lines


  print(wrap("ice cold chicha de jora for sale", 12))
hints:
  - "Keep the line you're building. A word fits if `len(current) + 1 + len(word) <= width`."
  - "When you finish, the last line is still in `current`: don't forget to add it."
tests:
  - name: the example in the picture
    run: wrap("ice cold chicha de jora for sale", 12)
    equals: ["ice cold", "chicha de", "jora for", "sale"]
  - name: everything fits on one line
    run: wrap("hello Catacaos", 20)
    equals: ["hello Catacaos"]
  - name: right at the width
    run: wrap("abc def ghi", 7)
    equals: ["abc def", "ghi"]
  - name: one word per line
    run: wrap("silver filigree", 8)
    equals: ["silver", "filigree"]
  - name: with extra spaces
    run: wrap("   mass   at   six  sharp ", 6)
    equals: ["mass", "at six", "sharp"]
  - name: no words
    run: wrap("    ", 10)
    equals: []
  - name: no line goes over the width
    expect: 'all(len(line) <= 5 for line in wrap("a bb ccc dddd eeeee f gg", 5))'
```
