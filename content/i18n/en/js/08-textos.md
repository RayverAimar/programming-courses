# Session 8 — Strings

## The job

The fishermen's pier at Chucuito, in Callao, five in the morning. Don Eusebio Chumpitaz has run the pier's radio for forty years: the boats tell him where they are, what they caught and when they're coming back, and he writes it on a board. This week the old radio started adding static: messages arrive with `~` everywhere, extra spaces, half in capitals and half in lowercase. And Don Eusebio hasn't found his glasses since Tuesday.

Loop lent him Chasqui. What comes over the radio is **text**, and today Chasqui learns to clean it, cut it, search inside it and build new text. At the end he'll carry the radio's orders to the pier himself.

```scene
theme: barranco
level: 4
dir: E
caption: Chucuito at dawn. The radio says "fwd-4 / right / fwd-2 / left / fwd-3 / deliver" and Chasqui carries the message to the pier's mailbox (D).
map: |
  ###########
  #R....#####
  #####.#####
  #####...D##
  ###########
program: |
  robot.forward(4);
  robot.turnRight();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(3);
  robot.deliver("VIRGEN DEL CARMEN");
```

## The minimum

A string is a row of characters. Like an array, it has a `length` and is read by position from **0**. Its methods **don't change it**: they return a new string.

```js run
const incoming = "  mayday~ VIRGEN del carmen~  ";
const clean = incoming.replaceAll("~", "").trim().toUpperCase();
console.log(clean);
console.log(clean.length, clean[0], clean.includes("CARMEN"));
console.log(`Arrived at ${String(7).padStart(2, "0")}:05`);
```

Watch how Chasqui reads a radio order: he splits it into pieces with `split`, checks what each piece starts with and takes the number out with `slice`.

```anim
title: Splitting a message and reading each piece
code: |
  const message = "fwd-3/right/FWD-2";
  const parts = message.split("/");
  let steps = 0;
  for (const part of parts) {
    const order = part.toUpperCase();
    if (order.startsWith("FWD")) {
      steps += Number(order.slice(4));
    }
  }
  console.log(steps);
cells: { of: parts, at: part }
notes:
  2: "split cuts the string at every / and returns an array of strings."
  5: "toUpperCase returns an uppercase copy: fwd-3 and FWD-3 read the same."
  6: "startsWith asks what it begins with. right doesn't begin with FWD, so it adds nothing."
  7: "slice(4) is the string from position 4 to the end: \"3\". Number turns it into a number."
```

- **Read**: `text.length`, `text[0]`, `text.at(-1)` (the last one).
- **Cut**: `text.slice(start, end)` goes from `start` up to *before* `end`; without `end`, to the end; negatives count from the back: `"MAYDAY".slice(-3)` is `"DAY"`.
- **Split and join**: `"a/b/c".split("/")` gives `["a", "b", "c"]`; `parts.join(" ")` does the opposite.
- **Clean**: `trim()` removes the spaces at the ends (not the ones inside); `replaceAll("~", "")` replaces every occurrence; `toUpperCase()` and `toLowerCase()`.
- **Ask**: `includes("x")`, `startsWith("x")`, `endsWith("x")` return `true` or `false`.
- **Pad**: `"7".padStart(2, "0")` gives `"07"`. Ideal for times and codes.
- **Build**: *template literals* (`` `Boat ${name}: ${crates} crates` ``) take any expression inside `${ }`.

For patterns a fixed string can't capture, JavaScript has **regular expressions**, written between slashes. Three you'll use a lot: `/\d+/g` (every group of digits), `/\s+/` (one or more spaces) and `/^SOS/i` (starts with SOS, in any case).

```js run
const note = "heading 270,   at 12 knots";
console.log(note.match(/\d+/g));
console.log(note.split(/\s+/).length);
console.log(/^sos/i.test("SOS by the island"));
```

> **Common trap:** `message.toUpperCase();` on a line of its own does nothing. Strings don't change: the method returns a new one and, if you don't keep it (`message = message.toUpperCase()` or in another variable), it's lost.

<!-- legacy: string-includes -->

<!-- legacy: string-replaceall -->

<!-- legacy: string-padstart -->

<!-- legacy: string-slice -->

<!-- mdn: strings template-literals string-slice string-includes string-replaceall string-padstart regexp -->

## Practice

```exercise
id: js8-predice-inmutable
type: predict
title: The capitals that never arrived
prompt: |
  What does it print?
code: |
  let boat = "virgen del carmen";
  boat.toUpperCase();
  console.log(boat);
  boat = boat.toUpperCase();
  console.log(boat.slice(0, 6));
options:
  - "VIRGEN DEL CARMEN\nVIRGEN"
  - "virgen del carmen\nVIRGEN"
  - "virgen del carmen\nvirgen"
  - "virgen del carmen\nVIRGEN "
answer: "virgen del carmen\nVIRGEN"
explain: |
  Line 2 computes the uppercase string and throws it away: `boat` stays the same. Line 4 does keep it. `slice(0, 6)` takes positions 0 to 5: `"VIRGEN"`, without the space at position 6.
```

```exercise
id: js8-predice-split
type: predict
title: The space that slipped in
prompt: |
  What does it print? The brackets in the `console.log` are there so you can see the spaces.
code: |
  const parts = "  FWD-3 / RIGHT ".trim().split("/");
  console.log(parts.length);
  console.log(`[${parts[1]}]`);
options:
  - "2\n[RIGHT]"
  - "2\n[ RIGHT]"
  - "3\n[ RIGHT ]"
  - "2\n[ RIGHT ]"
answer: "2\n[ RIGHT]"
explain: |
  `trim` removed the spaces at the **ends** of the whole string, not the ones around the `/`. So the second piece is `" RIGHT"`, with a space in front. That's why, after splitting, you `trim()` each piece.
```

```exercise
id: js8-completa-pizarra
type: complete
title: One line for the board
prompt: |
  The radio says `"virgen del carmen;  isla san lorenzo ;7"`: boat, place and hour, separated by `;`. Fill in the gaps so it prints the board's line:

  `07 | VIRGEN DEL CARMEN | ISLA SAN LORENZO`
visual:
  figure:
    input: { label: radio, value: "\"virgen del carmen;  isla san lorenzo ;7\"" }
    arrow: split, trim, toUpperCase, padStart
    output: { label: board, value: "07 | VIRGEN DEL CARMEN | ISLA SAN LORENZO" }
starter: |
  const radio = "virgen del carmen;  isla san lorenzo ;7";
  const parts = radio.___(";");
  const boat = parts[0].trim().toUpperCase();
  const place = parts[1].___().toUpperCase();
  const hour = parts[2].___(2, "0");
  console.log(`${hour} | ${boat} | ${___}`);
solution: |
  const radio = "virgen del carmen;  isla san lorenzo ;7";
  const parts = radio.split(";");
  const boat = parts[0].trim().toUpperCase();
  const place = parts[1].trim().toUpperCase();
  const hour = parts[2].padStart(2, "0");
  console.log(`${hour} | ${boat} | ${place}`);
hints:
  - The first gap splits the string; the second removes the spaces at the ends.
  - "`padStart(2, \"0\")` fills with zeros on the left until there are 2 characters."
tests:
  - name: the board's line
    output: "07 | VIRGEN DEL CARMEN | ISLA SAN LORENZO"
```

```exercise
id: js8-arregla-estatica
type: fix
title: The static that wouldn't go
prompt: |
  This code was supposed to remove all the static (`~`) from the message, but some still shows up on the board. What's missing?
starter: |
  const message = "Thick~ fog~ by the~ island";
  const clean = message.replace("~", "");
  console.log(clean);
solution: |
  const message = "Thick~ fog~ by the~ island";
  const clean = message.replaceAll("~", "");
  console.log(clean);
hints:
  - "`replace` with a string changes only the **first** occurrence. There's a method that changes them all."
tests:
  - name: no static
    output: Thick fog by the island
```

```exercise
id: js8-escribe-socorro
type: write
title: Is it a call for help?
prompt: |
  Write `isMayday(message)`, which returns `true` if the message is a call for help and `false` if not.

  It's a call for help if it **contains** the word `mayday` or **starts** with `sos`, in capitals or lowercase, ignoring the spaces at the ends.
visual:
  figure:
    panes:
      - { table: { head: ["message", "isMayday"], rows: [["\"Mayday, engine dead\"", "true"], ["\"  sos by the island\"", "true"], ["\"All fine, no sos at all\"", "false"], ["\"Back at 7\"", "false"]] } }
starter: |
  function isMayday(message) {
  }

  console.log(isMayday("Mayday, engine dead"));
solution: |
  function isMayday(message) {
    const text = message.trim().toLowerCase();
    return text.includes("mayday") || text.startsWith("sos");
  }

  console.log(isMayday("Mayday, engine dead"));
hints:
  - First normalise once, into a variable: no spaces at the ends and all lowercase.
  - "Then `includes` for mayday and `startsWith` for sos, joined with `||`."
tests:
  - name: Mayday at the start
    run: 'isMayday("Mayday, engine dead")'
    equals: true
  - name: mayday in the middle, in capitals
    run: 'isMayday("Don Lucho here: MAYDAY MAYDAY")'
    equals: true
  - name: sos with spaces in front
    run: 'isMayday("   sos by the island")'
    equals: true
  - name: sos that isn't at the start
    run: 'isMayday("All fine, no sos at all")'
    equals: false
  - name: a calm message
    run: 'isMayday("Back at 7")'
    equals: false
```

```exercise
id: js8-escribe-numeros
type: write
title: The numbers in the report
prompt: |
  Write `numbersIn(text)`, which returns an array with every number in the text, already converted to numbers. If there are none, return `[]`.

  Use the regular expression `/\d+/g`: `text.match(/\d+/g)` returns the groups of digits as strings, or `null` if there are none.
visual:
  figure:
    input: { label: text, value: "\"Heading 270, at 12 knots, 3 crew\"" }
    arrow: match(/\d+/g), then to numbers
    output: { label: returns, cells: [270, 12, 3] }
starter: |
  function numbersIn(text) {
  }

  console.log(numbersIn("Heading 270, at 12 knots, 3 crew"));
solution: |
  function numbersIn(text) {
    const groups = text.match(/\d+/g) ?? [];
    return groups.map(Number);
  }

  console.log(numbersIn("Heading 270, at 12 knots, 3 crew"));
hints:
  - "`?? []` swaps the `null` for an empty array."
  - "`groups.map(Number)` turns each string into a number."
tests:
  - name: three numbers
    run: 'numbersIn("Heading 270, at 12 knots, 3 crew")'
    equals: [270, 12, 3]
  - name: no numbers
    run: 'numbersIn("Thick fog")'
    equals: []
  - name: numbers stuck to letters
    run: 'numbersIn("anchor2 and boat14")'
    equals: [2, 14]
  - name: uses a regular expression
    source: '/\\d\+?/'
    msg: Use the regular expression /\d+/g.
```

## The case

```exercise
id: js8-caso-radio
type: case
title: The message someone touched
prompt: |
  Clean each transmission, measure how many characters its message has and compare it with the length the boat declared.

  On the Callao radio, every boat ends its transmission with the length of its message, so the pier knows whether it arrived whole. A transmission has three parts separated by `|`: the **boat**, the **message** and the **declared length**. The length counts the message **without the static** (`~`) and **without the spaces at the ends**.

  Last night someone intercepted a message and changed it to send the other boats away from the shoal. Which boat sent the altered message?

  Print one line per boat, with its name in capitals and the real length at the end: `VIRGEN DEL CARMEN: 25`. The board compares it with what was declared.
visual:
  - figure:
      title: One transmission, taken apart
      input: { label: "transmissions[0]", text: "~ virgen del CARMEN~ |  Bonito shoal~ off~ La Punta ~|25" }
      arrow: split("|"), no ~, trim
      output:
        label: its three parts
        table:
          head: ["part", "clean", "length"]
          rows: [["boat", "VIRGEN DEL CARMEN", ""], ["message", "Bonito shoal off La Punta", "**25**"], ["declared", "25", ""]]
  - board:
      for: js8-caso-radio
      title: What each boat declared
      task: Measure each boat's clean message and compare it with its declared length.
      cards:
        - { name: "Virgen del Carmen", kind: person, role: "Declared 25", clue: { find: "VIRGEN DEL CARMEN", says: 25, saysLabel: "Declared" } }
        - { name: "Don Lucho", kind: person, role: "Declared 39", clue: { find: "DON LUCHO", says: 39, saysLabel: "Declared" } }
        - { name: "Santa Rosita", kind: person, role: "Declared 31", clue: { find: "SANTA ROSITA", says: 31, saysLabel: "Declared" } }
        - { name: "Mi Chabelita", kind: person, role: "Declared 30", culprit: true, clue: { find: "MI CHABELITA", says: 30, saysLabel: "Declared" } }
        - { name: "Señor de Luren", kind: person, role: "Declared 32", clue: { find: "SEÑOR DE LUREN", says: 32, saysLabel: "Declared" } }
        - { name: "Doña Pochita", kind: person, role: "Declared 23", clue: { find: "DOÑA POCHITA", says: 23, saysLabel: "Declared" } }
        - { name: "El Bravo", kind: person, role: "Declared 28", clue: { find: "EL BRAVO", says: 28, saysLabel: "Declared" } }
      caption: "**Matches**: the message arrived whole. If it doesn't, someone tampered with it on the way."
starter: |
  const transmissions = [
    "~ virgen del CARMEN~ |  Bonito shoal~ off~ La Punta ~|25",
    "  don LUCHO~|  Heading back~ to the pier with 40 crates ~|39",
    "~santa rosita  |  Thick~ fog by~ San Lorenzo island ~|31",
    " MI chabelita~ |  Plenty of~ anchoveta near~ Pucusana~ and Cerro Azul ~|30",
    "~~señor de LUREN |  Engine~ failing, we~ request a tow ~|32",
    " doña POCHITA~|  All quiet~, back~ at dawn ~|23",
    "el BRAVO~ |  Net~ torn, heading~ back early ~|28",
  ];

  // This is how a transmission splits into its three pieces:
  const pieces = transmissions[0].split("|");
  console.log("Pieces in the first one:", pieces.length);

  // TODO: for each transmission, clean the boat and the message (no ~ and no spaces
  // at the ends) and measure the message with length.
  // Print one line per boat, like this: VIRGEN DEL CARMEN: 25
solution: |
  const transmissions = [
    "~ virgen del CARMEN~ |  Bonito shoal~ off~ La Punta ~|25",
    "  don LUCHO~|  Heading back~ to the pier with 40 crates ~|39",
    "~santa rosita  |  Thick~ fog by~ San Lorenzo island ~|31",
    " MI chabelita~ |  Plenty of~ anchoveta near~ Pucusana~ and Cerro Azul ~|30",
    "~~señor de LUREN |  Engine~ failing, we~ request a tow ~|32",
    " doña POCHITA~|  All quiet~, back~ at dawn ~|23",
    "el BRAVO~ |  Net~ torn, heading~ back early ~|28",
  ];

  const clean = (text) => text.replaceAll("~", "").trim();

  for (const transmission of transmissions) {
    const [boat, message, declared] = transmission.split("|");
    const length = clean(message).length;
    const flag = length === Number(declared) ? "" : "  <- doesn't match, declared " + declared;
    console.log(`${clean(boat).toUpperCase()}: ${length}${flag}`);
  }
answer: MI CHABELITA
answerLabel: Which boat sent the altered message?
reveal: |
  Mi Chabelita declared 30 characters, but its clean message has 48. The original said "Plenty of anchoveta near Ancón" (30): someone swapped Ancón for "Pucusana and Cerro Azul" to send the other boats south, away from the shoal.
hints:
  - "Destructure the three pieces: `const [boat, message, declared] = transmission.split(\"|\");`"
  - "First `replaceAll(\"~\", \"\")` and then `trim()`: the static can also sit at the ends."
```

## The judge

Two problems: the first reads its input line by line with `readLine()` and prints, as in sessions 1 to 3; the second is a function, as in session 4.

```exercise
id: js8-juez-pizarra
type: judge
title: The arrivals board
prompt: |
  Print each arrival in the board's format: `HH:MM NAME`, with the time in two digits each and the boat's name in capitals, with a single space between words.

  Don Eusebio reads out the arrivals over the radio however they come: `7:5   virgen del CARMEN`. The pier's board, on the other hand, is strict: `07:05 VIRGEN DEL CARMEN`.

  **Input:** a line with `N`, the number of arrivals. Then `N` lines, each with a time `H:M` (no leading zeros) and the boat's name. There may be extra spaces at the start, at the end and between words.

  **Output:** `N` lines in the same order, each `HH:MM NAME`.

  **Constraints:** 0 ≤ N ≤ 200 · 0 ≤ H ≤ 23 · 0 ≤ M ≤ 59 · names of 1 to 4 words, letters only.
visual:
  figure:
    title: Sample 1, line by line
    panes:
      - { table: { head: ["", "input (· is a space)", "output"], rows: [["1", "`7:5···virgen·del·CARMEN`", "`07:05 VIRGEN DEL CARMEN`"], ["2", "`13:40·don·lucho`", "`13:40 DON LUCHO`"], ["3", "`··9:0··santa···rosita·`", "`09:00 SANTA ROSITA`"]] } }
    caption: "The time goes through `padStart`, the name through `toUpperCase`, and repeated spaces vanish when you split on `/\\s+/`."
starter: |
  const n = readNumber();
  for (let i = 0; i < n; i++) {
    const line = readLine();
    console.log(line);
  }
solution: |
  const n = readNumber();
  for (let i = 0; i < n; i++) {
    const [time, ...words] = readLine().trim().split(/\s+/);
    const [h, m] = time.split(":");
    const name = words.join(" ").toUpperCase();
    console.log(`${h.padStart(2, "0")}:${m.padStart(2, "0")} ${name}`);
  }
hints:
  - "`line.trim().split(/\\s+/)` leaves the words with no empty pieces in between; the first one is the time."
  - "`const [time, ...words] = …` separates the time from the rest, and `words.join(\" \")` rebuilds the name."
samples:
  - input: "3\n7:5   virgen del CARMEN\n13:40 don lucho\n  9:0  santa   rosita "
    output: "07:05 VIRGEN DEL CARMEN\n13:40 DON LUCHO\n09:00 SANTA ROSITA"
  - input: "1\n0:0 bravo"
    output: "00:00 BRAVO"
    note: Midnight, and a one-word name.
edge:
  - input: "0\n"
    tag: with no arrivals at all
  - input: "2\n23:59 MI CHABELITA\n12:30 Don Lucho"
    tag: with times that already have two digits
  - input: "1\n   5:7       el      bravo     "
    tag: with lots of spaces everywhere
  - input: "1\n10:3 dona pochita"
    tag: with single-digit minutes
random:
  count: 30
  seed: 88
  generate: |
    const words = ["virgen", "del", "carmen", "don", "lucho", "santa", "rosita", "mi", "chabelita", "bravo", "senor", "luren", "dona", "pochita", "gaviota", "pelicano", "estrella", "callao"];
    const mixCase = (w) => [...w].map((c) => (rng.next() < 0.5 ? c.toUpperCase() : c)).join("");
    const gap = () => " ".repeat(rng.int(1, 3));
    const n = rng.int(1, 200);
    const lines = [];
    for (let i = 0; i < n; i++) {
      const name = Array.from({ length: rng.int(1, 4) }, () => mixCase(rng.pick(words))).join(gap());
      lines.push(`${" ".repeat(rng.int(0, 2))}${rng.int(0, 23)}:${rng.int(0, 59)}${gap()}${name}${" ".repeat(rng.int(0, 2))}`);
    }
    return `${n}\n${lines.join("\n")}`;
wrong:
  - |
    const n = readNumber();
    for (let i = 0; i < n; i++) {
      const [time, ...words] = readLine().trim().split(" ");
      const [h, m] = time.split(":");
      console.log(`${h.padStart(2, "0")}:${m.padStart(2, "0")} ${words.join(" ").toUpperCase()}`);
    }
  - |
    const n = readNumber();
    for (let i = 0; i < n; i++) {
      const [time, ...words] = readLine().trim().split(/\s+/);
      const [h, m] = time.split(":");
      console.log(`${h.padStart(2, "0")}:${m} ${words.join(" ").toUpperCase()}`);
    }
  - |
    const n = readNumber();
    for (let i = 0; i < n; i++) {
      const [time, ...words] = readLine().split(/\s+/);
      const [h, m] = time.split(":");
      console.log(`${h.padStart(2, "0")}:${m.padStart(2, "0")} ${words.join(" ").toUpperCase()}`);
    }
```

```exercise
id: js8-juez-deletreo
type: judge
mode: function
function: spellOut
title: Spelling over the radio
prompt: |
  Write `spellOut(message)`, which returns what the boat spelled: the first letter of each word, in capitals.

  With static, a single word gets lost, so at sea people spell with the phonetic alphabet: `charlie alfa lima lima alfa oscar` is `CALLAO`. The word `stop` (in capitals or lowercase) isn't a letter: it's a **space**.

  **Input:** `message`, words separated by one or more spaces, possibly with spaces at the ends and with mixed capitals and lowercase.

  **Output:** the spelled text.

  **Constraints:** up to 300 words · `stop` is never the first or last word and never comes twice in a row · an empty message or one with only spaces returns `""`.
visual:
  figure:
    title: Sample 1, word by word
    panes:
      - { table: { head: ["word", "gives"], rows: [["lima", "L"], ["INDIA", "I"], ["Stop", "(space)"], ["sierra", "S"], ["uniform", "U"], ["romeo", "R"]] } }
      - { label: returns, value: "\"LI SUR\"" }
starter: |
  function spellOut(message) {
    return message;
  }
solution: |
  function spellOut(message) {
    const trimmed = message.trim();
    if (trimmed === "") {
      return "";
    }
    let result = "";
    for (const word of trimmed.split(/\s+/)) {
      result += word.toLowerCase() === "stop" ? " " : word[0].toUpperCase();
    }
    return result;
  }
hints:
  - "Split on `/\\s+/` after `trim()`, so no empty words appear."
  - "Compare `word.toLowerCase() === \"stop\"` so that `STOP`, `Stop` and `stop` all count."
samples:
  - args: ["lima INDIA Stop sierra uniform romeo"]
    returns: "LI SUR"
    note: "`Stop` is a space, and case doesn't matter: INDIA gives I just like india."
  - args: ["  charlie   alfa lima LIMA alfa oscar "]
    returns: "CALLAO"
    note: Extra spaces at the start, in the middle and at the end.
edge:
  - args: [""]
    tag: with an empty message
  - args: ["     "]
    tag: with a message of only spaces
  - args: ["sierra"]
    tag: with a single word
  - args: ["sierra oscar sierra STOP alfa stop bravo"]
    tag: with STOP in capitals
  - args: ["Papa   ECHO   romeo   uniform"]
    tag: with lots of spaces between words
random:
  count: 40
  seed: 81
  generate: |
    const alphabet = ["alfa", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliett", "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", "yankee", "zulu"];
    const mixCase = (w) => [...w].map((c) => (rng.next() < 0.3 ? c.toUpperCase() : c)).join("");
    const n = rng.int(1, 300);
    const words = [];
    for (let i = 0; i < n; i++) {
      const canStop = i > 0 && i < n - 1 && words[i - 1].toLowerCase() !== "stop";
      words.push(canStop && rng.next() < 0.15 ? mixCase("stop") : mixCase(rng.pick(alphabet)));
    }
    return [" ".repeat(rng.int(0, 2)) + words.map((w, i) => (i ? " ".repeat(rng.int(1, 3)) : "") + w).join("") + " ".repeat(rng.int(0, 2))];
wrong:
  - |
    function spellOut(message) {
      let result = "";
      for (const word of message.trim().split(" ")) {
        result += word.toLowerCase() === "stop" ? " " : word[0].toUpperCase();
      }
      return result;
    }
  - |
    function spellOut(message) {
      const trimmed = message.trim();
      if (trimmed === "") return "";
      let result = "";
      for (const word of trimmed.split(/\s+/)) {
        result += word === "stop" ? " " : word[0].toUpperCase();
      }
      return result;
    }
  - |
    function spellOut(message) {
      const trimmed = message.trim();
      if (trimmed === "") return "";
      let result = "";
      for (const word of trimmed.split(/\s+/)) {
        result += word.toLowerCase() === "stop" ? " " : word[0];
      }
      return result;
    }
```

## Final mission

```exercise
id: js8-mision-radio
type: mission
title: The radio's orders
prompt: |
  Read the order that came over the radio, make Chasqui follow it step by step and deliver the boat's name, in capitals, at the pier's mailbox (D).

  The order is in `radio`, in pieces separated by `/`. Each piece, in capitals or lowercase and with extra spaces:

  - `fwd-N`: move forward `N` tiles;
  - `right` / `left`: turn right / left;
  - `deliver: name`: the last piece; deliver `name` in capitals, with no spaces at the ends.

  The order and the map change in every test, so don't copy it by hand: **read it with code**.
visual:
  figure:
    title: The first test's order, piece by piece
    panes:
      - { label: radio, text: "  fwd-3 / RIGHT /Fwd-2/ left / FWD-4 / deliver: virgen del carmen  " }
      - { table: { head: ["clean piece", "Chasqui does"], rows: [["`FWD-3`", "`robot.forward(3)`"], ["`RIGHT`", "`robot.turnRight()`"], ["`FWD-2`", "`robot.forward(2)`"], ["`LEFT`", "`robot.turnLeft()`"], ["`FWD-4`", "`robot.forward(4)`"], ["`DELIVER: VIRGEN DEL CARMEN`", "`robot.deliver(\"VIRGEN DEL CARMEN\")`"]] } }
starter: |
  // radio comes from the pier, for example:
  // "  fwd-3 / RIGHT /Fwd-2/ left / FWD-4 / deliver: virgen del carmen  "

  console.log(radio);
  // TODO: split the order into pieces and do what each one says
solution: |
  for (const piece of radio.split("/")) {
    const order = piece.trim().toUpperCase();
    if (order.startsWith("FWD")) {
      robot.forward(Number(order.split("-")[1]));
    } else if (order === "RIGHT") {
      robot.turnRight();
    } else if (order === "LEFT") {
      robot.turnLeft();
    } else if (order.startsWith("DELIVER")) {
      robot.deliver(order.split(":")[1].trim());
    }
  }
hints:
  - "Loop over `radio.split(\"/\")` with `for...of` and normalise each piece: `piece.trim().toUpperCase()`."
  - "For `FWD-3`, the number is what comes after the dash: `order.split(\"-\")[1]`, converted with `Number`."
world:
  theme: barranco
  level: 4
  dir: E
  map: |
    ###########
    #R...######
    ####.##..##
    #.#.....D.#
    ###########
globals:
  radio: "  fwd-3 / RIGHT /Fwd-2/ left / FWD-4 / deliver: virgen del carmen  "
scenarios:
  - {}
  - map: |
      #########
      ###....##
      #.#.##D.#
      #R...####
      #########
    globals:
      radio: "fwd-2/ LEFT / fwd-2 / right/FWD-3/ Right / fwd-1 /DELIVER:Don Lucho"
  - map: |
      #########
      ##.R.####
      ###.#####
      ##....D.#
      #########
    world: { dir: S }
    globals:
      radio: " FWD-2 /  left/fwd-3 / Deliver:   santa rosita "
tests:
  - name: reaches the pier's mailbox
    state: w.atGoal
    msg: Chasqui didn't end on the mailbox (D). Check each piece of the order.
  - name: delivers the boat's name in capitals
    state: 'w.delivered.length === 1 && w.delivered[0] === g.radio.split(":")[1].trim().toUpperCase()'
    msg: The delivered name isn't the boat's, in capitals and with no spaces at the ends.
  - name: no crashes
    state: '!w.crashed'
  - name: reads the order with split
    source: '\.split\s*\('
    msg: Split the order with split instead of copying it by hand.
```

## Expert challenge

```exercise
id: js8-reto-morse
type: challenge
title: Morse in the fog
prompt: |
  When voice doesn't get through, boats use Morse. Write `morse(signal)`, which translates a signal: letters are separated by one space and words by ` / `. The table is in `MORSE`. A letter that isn't in the table translates as `?`.

  `morse("-.-. .- .-.. .-.. .- --- / ... ..- .-.")` → `"CALLAO SUR"`
starter: |
  const MORSE = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G",
    "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N",
    "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U",
    "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
  };

  function morse(signal) {
    return "";
  }

  console.log(morse("-.-. .- .-.. .-.. .- --- / ... ..- .-."));
solution: |
  const MORSE = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G",
    "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N",
    "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U",
    "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
  };

  const morse = (signal) =>
    signal
      .trim()
      .split(" / ")
      .map((word) => word.split(" ").map((letter) => MORSE[letter] ?? "?").join(""))
      .join(" ");

  console.log(morse("-.-. .- .-.. .-.. .- --- / ... ..- .-."));
hints:
  - Split into words first (`" / "`) and each word into letters (`" "`).
tests:
  - name: CALLAO SUR
    run: 'morse("-.-. .- .-.. .-.. .- --- / ... ..- .-.")'
    equals: CALLAO SUR
  - name: a single letter
    run: 'morse("...")'
    equals: S
  - name: SOS
    run: 'morse("... --- ...")'
    equals: SOS
  - name: unknown letter
    run: 'morse(".-.- --- ...")'
    equals: "?OS"
```
