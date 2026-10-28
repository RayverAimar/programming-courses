# Session 6 — Objects

## The job

Jorge Chávez Airport, Callao, the Lost and Found office in the arrivals hall. Miss Milagros Chumpitaz has 1,340 things in there: suitcases, charangos, a prop coffin (from a university *tuna* band), a set of dentures and 212 phone chargers. It's all in a spreadsheet where someone once sorted a single column, and ever since then every item's colour is somebody else's.

Milagros wants Chasqui to run the counter at night. But a lost item isn't a number or a list: it has **a kind, a colour, where and when it was found, and sometimes a tag with an owner**. Each piece of data with its name, all of them together. Today Chasqui learns to keep **things with properties**: objects.

```scene
theme: museo
level: 4
dir: E
items: { a: backpack, b: charango, c: umbrella, d: laptop, e: teddy bear }
api: [move, deliver, cargo]
caption: The Lost and Found storeroom. Chasqui leaves the counter (D), takes the charango from shelf 2 and brings it back to hand it over.
map: |
  #############
  #DR.........#
  ###a#b#c#d#e#
  #############
program: |
  robot.forward(3);
  robot.turnRight();
  robot.forward();
  robot.take();
  robot.turnRight();
  robot.turnRight();
  robot.forward();
  robot.turnLeft();
  robot.forward(4);
  robot.deliver("Ruth Mamani");
```

## The minimum

An **object** groups named values: each one is a **property**, `key: value`. You read it with a dot or with square brackets.

```js run
const item = { kind: "charango", color: "brown", found: { gate: 14, hour: 15 } };
console.log(item.kind, item["color"], item.found.gate);
console.log(Object.keys(item));
console.log(item.tag?.name ?? "no tag");
console.log(JSON.stringify(item.found));
```

Watch how an object is built, and how it's read with a key that comes in a variable:

```anim
title: An object is a record with named fields
code: |
  const kind = "backpack";
  const color = "black";
  const item = { kind, color, gate: 14 };
  const field = "color";
  const value = item[field];
  item.returned = true;
  const { gate, returned } = item;
  console.log(value, gate, returned);
notes:
  3: "{ kind, color } is short for { kind: kind, color: color }."
  5: "The key is in the variable field: with brackets it reads item[\"color\"]."
  6: "Assigning a new property adds it to the record."
  7: "Destructuring pulls properties out by name, into variables with that name."
```

- **Read**: `item.kind` when you know the name as you write the code; `item[field]` when the name is in a variable (or has spaces: `item["date in"]`). A property that doesn't exist gives `undefined`.
- **Shorthand**: `{ kind, color }` if the variables are named like the properties.
- **Nested**: an object can hold objects (and arrays): `item.found.gate`.
- **Walk through**: `Object.keys(o)` gives the keys and `Object.entries(o)` the `[key, value]` pairs, which you walk with `for (const [key, value] of Object.entries(o))`.
- **Destructure**: `const { kind, color } = item`, in parameters too, as in session 4.
- **Optional chaining**: `item.tag?.name` gives `undefined` instead of breaking when there's no tag (you saw it in session 2; here you'll really need it).
- **JSON**: the text format objects travel in between systems. `JSON.stringify(item)` turns it into text and `JSON.parse(text)` turns it back into an object.

```figure
title: The same data, as an object and as text
input: { label: Object in your program, cards: [{ title: reading, rows: [["distance", "40"], ["unit", "\"cm\""]] }] }
arrow: stringify → ← parse
output: { label: JSON text (what travels), text: "{\"distance\": 40, \"unit\": \"cm\"}" }
steps:
  - "JSON requires double quotes on the keys too; that's why `{distance: 40}` fails to parse (you'll see it in session 15)."
  - "Functions and `undefined` don't travel: `stringify` leaves them out."
```

Walking an object with `Object.entries`, step by step:

```anim
title: Object.entries gives the key-value pairs
code: |
  const byKind = { backpack: 3, charango: 1, umbrella: 7 };
  let total = 0;
  for (const [kind, count] of Object.entries(byKind)) {
    total += count;
  }
  console.log(total);
notes:
  3: "Each pass brings a pair: the key in kind, the value in count."
  6: "3 + 1 + 7: eleven items in all."
```

Like arrays, an object isn't copied with `=`: two names point to the same record. A copy is `{ ...item }`.

```anim
title: Two names, one record
code: |
  const card = { dish: "ceviche", price: 18 };
  const other = card;
  const copy = { ...card };
  other.price = 20;
  console.log(card.price, copy.price);
refs: true
notes:
  1: "card points to an object with two fields."
  2: "other is a second arrow to the same record. No new record was born."
  3: "{ ...card } builds a new record with the same fields; copy points to that one."
  4: "The price is changed through other... and card sees it, because it's the same record."
  5: "card.price is 20; copy.price is still 18."
```

> **Common trap:** writing `item.field` when the key is *in the variable* `field`. The dot looks for a property literally called `"field"`, which doesn't exist: it gives `undefined`. With a variable, brackets: `item[field]`.

<!-- legacy: object-shorthand -->

<!-- legacy: object-entries -->

<!-- legacy: json -->

<!-- mdn: objects object-shorthand object-entries optional-chaining destructuring json -->

## Practice

```exercise
id: js6-predice-campo
type: predict
title: The field that wouldn't show up
prompt: |
  What does it print?
visual:
  figure:
    panes:
      - { label: suitcase, cards: [{ title: suitcase, rows: [["color", "\"blue\""], ["kilos", "23"]] }] }
      - { label: field, value: "\"color\"" }
code: |
  const suitcase = { color: "blue", kilos: 23 };
  const field = "color";
  console.log(suitcase.field, suitcase[field], suitcase["kilos"]);
options:
  - "undefined blue 23"
  - "blue blue 23"
  - "color blue 23"
  - "undefined undefined 23"
answer: "undefined blue 23"
explain: |
  `suitcase.field` looks for a property called `"field"`, which doesn't exist. `suitcase[field]` uses what the variable *holds*, `"color"`, and finds `"blue"`.
```

```exercise
id: js6-predice-opcional
type: predict
title: Items with and without an owner
prompt: |
  Some items arrive with a tag and some don't. What does it print?
code: |
  const items = [
    { kind: "umbrella", tag: { name: "Ana" } },
    { kind: "teddy bear" },
  ];
  for (const item of items) {
    console.log(item.kind, item.tag?.name ?? "no owner");
  }
options:
  - "umbrella Ana\nteddy bear no owner"
  - "umbrella Ana\nteddy bear undefined"
  - "umbrella Ana\nError"
  - "umbrella Ana\nteddy bear null"
answer: "umbrella Ana\nteddy bear no owner"
explain: |
  The teddy bear has no `tag`, so `item.tag?.name` stops and gives `undefined` (without `?.` it would be an error). Then `??` swaps that `undefined` for `"no owner"`.
```

```exercise
id: js6-predice-misma-ficha
type: predict
title: The shared record
prompt: |
  Milagros marks an item as returned on the "copy" of its record. What does it print?
code: |
  const record = { code: "OP-204", returned: false };
  const copy = record;
  const other = { ...record };
  copy.returned = true;
  console.log(record.returned, other.returned);
options:
  - "true false"
  - "false false"
  - "true true"
  - "false true"
answer: "true false"
explain: |
  `copy = record` is the same record under another name, as with the arrays in session 5. `{ ...record }` really is a new object, which kept `returned: false`.
```

```exercise
id: js6-completa-ficha
type: complete
title: The charango's record
prompt: |
  Build the record for the charango found at gate 7. Use the **shorthand** for `code` and `kind`, and put `gate` inside `found`.
visual:
  figure:
    input: { label: variables, cards: [{ title: loose, rows: [["code", "\"OP-204\""], ["kind", "\"charango\""], ["gate", "7"]] }] }
    arrow: "{ code, kind, found: { gate } }"
    output: { label: item, cards: [{ title: item, rows: [["code", "\"OP-204\""], ["kind", "\"charango\""], ["found", "{ gate: 7 }"]] }] }
starter: |
  const code = "OP-204";
  const kind = "charango";
  const gate = 7;

  const item = { ___, ___, found: { ___ } };
  console.log(item.___.gate);
solution: |
  const code = "OP-204";
  const kind = "charango";
  const gate = 7;

  const item = { code, kind, found: { gate } };
  console.log(item.found.gate);
hints:
  - "Shorthand: if the variable is named like the property, its name is enough: `{ code }`."
  - To read the gate you first have to go into `found`.
tests:
  - name: the record is complete
    run: item
    equals: { code: OP-204, kind: charango, found: { gate: 7 } }
  - name: prints the gate
    output: "7"
  - name: uses the shorthand
    source: '\{\s*code\s*,\s*kind\s*,'
    msg: Write { code, kind, … } without repeating the names.
```

```exercise
id: js6-arregla-json
type: fix
title: The notice that kept breaking
prompt: |
  The airline's system sends the owner's details as **JSON text**. The program wants to notify them, but it crashes saying it can't read `name` of `undefined`. Fix it with a single word... well, two.
visual:
  figure:
    input: { label: "response (a string)", text: "'{\"code\":\"OP-311\",\"kind\":\"laptop\",\"owner\":{\"name\":\"Kevin Ríos\"}}'" }
    arrow: "JSON.parse"
    output: { label: "an object", cards: [{ title: item, rows: [["code", "\"OP-311\""], ["kind", "\"laptop\""], ["owner", "{ name: \"Kevin Ríos\" }"]] }] }
starter: |
  const response = '{"code":"OP-311","kind":"laptop","owner":{"name":"Kevin Ríos"}}';

  const item = response;
  console.log(`Notify ${item.owner.name}: their ${item.kind} is at Lost and Found`);
solution: |
  const response = '{"code":"OP-311","kind":"laptop","owner":{"name":"Kevin Ríos"}}';

  const item = JSON.parse(response);
  console.log(`Notify ${item.owner.name}: their ${item.kind} is at Lost and Found`);
hints:
  - "`response` is a string, even though it has braces inside. A string has no `owner` property."
  - "`JSON.parse(text)` turns the text into a real object."
tests:
  - name: the notice comes out right
    output: "Notify Kevin Ríos: their laptop is at Lost and Found"
  - name: uses JSON.parse
    source: 'JSON\.parse\s*\('
```

```exercise
id: js6-escribe-ficha
type: write
title: The printed record
prompt: |
  Write `lines(item)`, which returns an array with one `"key: value"` line for each property of the object, in order.

  Milagros prints a record per item to stick on its bag, and every item has different properties. Use `Object.entries`.
visual:
  figure:
    input: { label: item, cards: [{ title: "{ kind, color, gate }", rows: [["kind", "\"backpack\""], ["color", "\"black\""], ["gate", "14"]] }] }
    arrow: Object.entries
    output: { label: returns, cells: ["kind: backpack", "color: black", "gate: 14"] }
starter: |
  function lines(item) {
  }

  console.log(lines({ kind: "backpack", color: "black", gate: 14 }));
solution: |
  function lines(item) {
    const result = [];
    for (const [key, value] of Object.entries(item)) {
      result.push(`${key}: ${value}`);
    }
    return result;
  }

  console.log(lines({ kind: "backpack", color: "black", gate: 14 }));
hints:
  - "`for (const [key, value] of Object.entries(item))` gives you each pair."
  - Collect the lines in an array with `push` and return it.
tests:
  - name: the backpack
    run: 'lines({ kind: "backpack", color: "black", gate: 14 })'
    equals: ["kind: backpack", "color: black", "gate: 14"]
  - name: another item, other keys
    run: 'lines({ kind: "charango", strings: 10 })'
    equals: ["kind: charango", "strings: 10"]
  - name: an empty object
    run: lines({})
    equals: []
  - name: uses Object.entries
    source: 'Object\.entries\s*\('
```

## The case

```exercise
id: js6-caso-mochila
type: case
title: Ruth's backpack
prompt: |
  Find the code of the only item that matches everything Ruth describes.

  Ruth Mamani arrived from Cusco on the 14:00 flight and forgot her backpack. There are plenty of black backpacks in the storeroom. She describes hers like this:

  - it's a **black backpack**;
  - it has a **llama keychain** (it's in `details`);
  - it was found at **14 or later** (her flight landed at 14);
  - its tag fell off long ago: if an item **has a tag with another name**, it isn't hers.

  Careful: many items have no `tag`, and `item.tag.name` on one of them crashes the program.
visual:
  figure:
    title: How three items get ruled out (one column per item)
    panes:
      - { table: { head: ["", "OP-101", "OP-103", "OP-108"], rows: [["kind and colour", "black backpack ✓", "**blue** backpack ✗", "black backpack ✓"], ["llama keychain", "✓", "✓", "✓"], ["found.hour ≥ 14", "**9** ✗", "16 ✓", "**11** ✗"], ["tag", "**Jorge Ccama** ✗", "none ✓", "none ✓"], ["Ruth's?", "no", "no", "no"]] } }
      - { label: "look for the one with ✓ everywhere", value: "OP-???" }
starter: |
  const items = [
    { code: "OP-101", kind: "backpack", color: "black", found: { gate: 3, hour: 9 }, tag: { flight: "LA2041", name: "Jorge Ccama" }, details: ["llama keychain"] },
    { code: "OP-102", kind: "suitcase", color: "red", found: { gate: 14, hour: 15 }, tag: { flight: "LA2041", name: "Ruth Mamani" }, details: [] },
    { code: "OP-103", kind: "backpack", color: "blue", found: { gate: 14, hour: 16 }, details: ["llama keychain"] },
    { code: "OP-104", kind: "backpack", color: "black", found: { gate: 12, hour: 17 }, details: ["Machu Picchu patch"] },
    { code: "OP-105", kind: "charango", color: "brown", found: { gate: 14, hour: 14 }, details: ["broken string"] },
    { code: "OP-106", kind: "backpack", color: "black", found: { gate: 14, hour: 16 }, details: ["thermos", "llama keychain"] },
    { code: "OP-107", kind: "jacket", color: "black", found: { gate: 8, hour: 15 }, details: ["llama keychain"] },
    { code: "OP-108", kind: "backpack", color: "black", found: { gate: 14, hour: 11 }, details: ["llama keychain"] },
    { code: "OP-109", kind: "backpack", color: "black", found: { gate: 15, hour: 15 }, tag: { flight: "H2 5110", name: "Piero Salas" }, details: ["llama keychain"] },
    { code: "OP-110", kind: "umbrella", color: "black", found: { gate: 2, hour: 18 }, details: [] },
    { code: "OP-111", kind: "teddy bear", color: "white", found: { gate: 14, hour: 15 }, tag: { flight: "LA2041", name: "Thiago Mamani" }, details: ["alpaca"] },
    { code: "OP-112", kind: "backpack", color: "black", found: { gate: 9, hour: 19 }, tag: { flight: "LA2047", name: "Rut Quispe" }, details: [] },
  ];

  // This is how you read an object's properties:
  const first = items[0];
  console.log(first.code, first.kind, "found at", first.found.hour);

  // TODO: walk through items and print the code of those that meet all four conditions.
  // For the tag, which doesn't always exist: item.tag?.name
solution: |
  const items = [
    { code: "OP-101", kind: "backpack", color: "black", found: { gate: 3, hour: 9 }, tag: { flight: "LA2041", name: "Jorge Ccama" }, details: ["llama keychain"] },
    { code: "OP-102", kind: "suitcase", color: "red", found: { gate: 14, hour: 15 }, tag: { flight: "LA2041", name: "Ruth Mamani" }, details: [] },
    { code: "OP-103", kind: "backpack", color: "blue", found: { gate: 14, hour: 16 }, details: ["llama keychain"] },
    { code: "OP-104", kind: "backpack", color: "black", found: { gate: 12, hour: 17 }, details: ["Machu Picchu patch"] },
    { code: "OP-105", kind: "charango", color: "brown", found: { gate: 14, hour: 14 }, details: ["broken string"] },
    { code: "OP-106", kind: "backpack", color: "black", found: { gate: 14, hour: 16 }, details: ["thermos", "llama keychain"] },
    { code: "OP-107", kind: "jacket", color: "black", found: { gate: 8, hour: 15 }, details: ["llama keychain"] },
    { code: "OP-108", kind: "backpack", color: "black", found: { gate: 14, hour: 11 }, details: ["llama keychain"] },
    { code: "OP-109", kind: "backpack", color: "black", found: { gate: 15, hour: 15 }, tag: { flight: "H2 5110", name: "Piero Salas" }, details: ["llama keychain"] },
    { code: "OP-110", kind: "umbrella", color: "black", found: { gate: 2, hour: 18 }, details: [] },
    { code: "OP-111", kind: "teddy bear", color: "white", found: { gate: 14, hour: 15 }, tag: { flight: "LA2041", name: "Thiago Mamani" }, details: ["alpaca"] },
    { code: "OP-112", kind: "backpack", color: "black", found: { gate: 9, hour: 19 }, tag: { flight: "LA2047", name: "Rut Quispe" }, details: [] },
  ];

  for (const item of items) {
    const { code, kind, color, found, details } = item;
    const owner = item.tag?.name;
    const isHers = owner === undefined || owner === "Ruth Mamani";
    if (kind === "backpack" && color === "black" && details.includes("llama keychain") && found.hour >= 14 && isHers) {
      console.log("Ruth's:", code);
    }
  }
answer: OP-106
answerLabel: What's the code of Ruth's backpack?
reveal: |
  OP-106: a black backpack with a thermos and a llama keychain, found at 16 at gate 14, no tag. OP-109 looked a lot like it, but its tag says Piero Salas; OP-108 turned up at 11, before Ruth landed. And OP-102, the only one with her name, is a red suitcase: Ruth had lost that too, she just hadn't noticed.
hints:
  - "Inside the `for...of`, destructure what you need: `const { kind, color, found, details } = item;`."
  - "The tag: `const owner = item.tag?.name;` is `undefined` if there's no tag. It's hers if it's `undefined` or `\"Ruth Mamani\"`."
```

## The judge

```exercise
id: js6-juez-turnos
type: judge
mode: function
function: mergeShifts
title: What goes out to the provinces
prompt: |
  Write `mergeShifts(a, b)`, which adds up by destination what two shifts sent, and `topDestination(counts)`, which returns the destination that receives the most items.

  Items forgotten in Lima that belong to passengers from other cities are sent to the destination airport. Each Lost and Found shift writes an object like `{ CUZ: 3, AQP: 1 }`: the airport code and how many items go there.

  - `mergeShifts(a, b)` returns a **new** object with every destination that appears in `a` or in `b` and the sum of both (if a destination is only in one, it's that shift's number; if it adds up to 0, it still appears).
  - `topDestination(counts)` returns the code with the most items. On a tie, the one that comes first alphabetically. If the object is empty, `null`.

  **Constraints:** each shift has 0 to 8 destinations · 0 to 9 items per destination.
visual:
  figure:
    title: Sample 1, destination by destination (one column per destination)
    panes:
      - { table: { head: ["", "CUZ", "AQP", "PIU"], rows: [["shift a", "3", "1", "—"], ["shift b", "2", "—", "4"], ["**merged**", "**5**", "**1**", "**4**"]] } }
      - { label: "mergeShifts returns", cards: [{ title: "new object", rows: [["CUZ", "5"], ["AQP", "1"], ["PIU", "4"]] }] }
      - { label: "topDestination of that", value: "\"CUZ\"" }
starter: |
  function mergeShifts(a, b) {
  }

  function topDestination(counts) {
  }
solution: |
  function mergeShifts(a, b) {
    const merged = { ...a };
    for (const [destination, count] of Object.entries(b)) {
      merged[destination] = (merged[destination] ?? 0) + count;
    }
    return merged;
  }

  function topDestination(counts) {
    let best = null;
    for (const [destination, count] of Object.entries(counts)) {
      if (best === null || count > counts[best] || (count === counts[best] && destination < best)) {
        best = destination;
      }
    }
    return best;
  }
hints:
  - "Start with a copy of `a` (`{ ...a }`) and add each pair of `b` on top. `merged[destination] ?? 0` gives 0 if that destination wasn't there yet."
  - "In `topDestination`, keep the best code seen so far; replace it if the new one has more, or if it ties and its code is smaller (`\"AQP\" < \"CUZ\"` is `true`)."
samples:
  - args: [{ CUZ: 3, AQP: 1 }, { CUZ: 2, PIU: 4 }]
    returns: { CUZ: 5, AQP: 1, PIU: 4 }
    note: The table above.
  - fn: topDestination
    args: [{ CUZ: 5, AQP: 1, PIU: 4 }]
    returns: CUZ
  - fn: topDestination
    args: [{ TRU: 2, IQT: 2 }]
    returns: IQT
    note: A tie at 2; IQT comes before TRU in the alphabet.
edge:
  - args: [{}, {}]
    tag: with two empty shifts
  - args: [{}, { JUL: 2 }]
    tag: when the first shift is empty
  - args: [{ TPP: 0 }, { TPP: 0, CIX: 3 }]
    tag: with a destination that adds up to 0
  - fn: topDestination
    args: [{}]
    tag: in topDestination, with empty counts
  - fn: topDestination
    args: [{ PIU: 4, CUZ: 4, AQP: 4 }]
    tag: in topDestination, with a three-way tie
  - fn: topDestination
    args: [{ TRU: 0 }]
    tag: in topDestination, with a single destination at 0
random:
  count: 40
  seed: 66
  generate: |
    const codes = ["AQP", "CUZ", "IQT", "PIU", "TRU", "JUL", "TPP", "CIX"];
    const shift = () => {
      const t = {};
      for (let i = rng.int(0, 8); i > 0; i--) t[rng.pick(codes)] = rng.int(0, 9);
      return t;
    };
    return [shift(), shift()];
wrong:
  - |
    function mergeShifts(a, b) {
      const merged = {};
      for (const [destination, count] of Object.entries(a)) merged[destination] = count + (b[destination] ?? 0);
      return merged;
    }
    function topDestination(counts) {
      let best = null;
      for (const [d, c] of Object.entries(counts)) if (best === null || c > counts[best] || (c === counts[best] && d < best)) best = d;
      return best;
    }
  - |
    function mergeShifts(a, b) {
      return { ...a, ...b };
    }
    function topDestination(counts) {
      let best = null;
      for (const [d, c] of Object.entries(counts)) if (best === null || c > counts[best] || (c === counts[best] && d < best)) best = d;
      return best;
    }
  - |
    function mergeShifts(a, b) {
      const merged = { ...a };
      for (const [d, c] of Object.entries(b)) merged[d] = (merged[d] ?? 0) + c;
      return merged;
    }
    function topDestination(counts) {
      let best = null;
      for (const [d, c] of Object.entries(counts)) if (best === null || c > counts[best]) best = d;
      return best;
    }
  - |
    function mergeShifts(a, b) {
      const merged = { ...a };
      for (const [d, c] of Object.entries(b)) merged[d] = merged[d] + c;
      return merged;
    }
    function topDestination(counts) {
      let best = null;
      for (const [d, c] of Object.entries(counts)) if (best === null || c > counts[best] || (c === counts[best] && d < best)) best = d;
      return best;
    }
```

## Final mission

```exercise
id: js6-mision-deposito
type: mission
title: The night shift
prompt: |
  Handle the `claims` in order: look up each ticket in `storeroom`, bring the item from its shelf and hand it over at the counter with the **passenger's name** as the label.

  Each claim is an object like `{ ticket: "A-17", passenger: { name: "Ruth Mamani" } }`. The `storeroom` is an object whose keys are the tickets: `storeroom["A-17"]` is `{ item: "charango", shelf: 2 }`.

  - You already have `bring(shelf)`: Chasqui goes to the shelf, takes the item and comes back standing on the counter (D).
  - After `robot.deliver(name)`, call `backToPost()` so it returns to its spot.
  - If a ticket **isn't** in the storeroom, Chasqui doesn't move: it says `` `${ticket}: not here` `` with `robot.say`.

  The claims change in each test.
visual:
  figure:
    title: One claim, from the record to the shelf
    input: { label: "a claim", cards: [{ title: claim, rows: [["ticket", "\"A-17\""], ["passenger", "{ name: \"Ruth Mamani\" }"]] }] }
    arrow: "storeroom[ticket]"
    output: { label: "what Chasqui does", cards: [{ title: "{ item: \"charango\", shelf: 2 }", rows: [["bring", "2"], ["deliver", "\"Ruth Mamani\""], ["backToPost", "()"]] }, { title: "ticket \"Z-99\" (not here)", rows: [["say", "\"Z-99: not here\""]] }] }
starter: |
  // storeroom: { "A-17": { item: "charango", shelf: 2 }, ... }
  // claims: [{ ticket: "B-02", passenger: { name: "Kevin Ríos" } }, ...]

  const uTurn = () => {
    robot.turnRight();
    robot.turnRight();
  };

  // Goes to the shelf, takes the item and ends up on the counter (D).
  function bring(shelf) {
    const steps = 2 * shelf - 1;
    robot.forward(steps);
    robot.turnRight();
    robot.forward();
    robot.take();
    uTurn();
    robot.forward();
    robot.turnLeft();
    robot.forward(steps + 1);
  }

  // From the counter, back to its spot facing east.
  function backToPost() {
    uTurn();
    robot.forward();
  }

  // TODO: handle each claim
solution: |
  const uTurn = () => {
    robot.turnRight();
    robot.turnRight();
  };

  function bring(shelf) {
    const steps = 2 * shelf - 1;
    robot.forward(steps);
    robot.turnRight();
    robot.forward();
    robot.take();
    uTurn();
    robot.forward();
    robot.turnLeft();
    robot.forward(steps + 1);
  }

  function backToPost() {
    uTurn();
    robot.forward();
  }

  for (const { ticket, passenger } of claims) {
    const stored = storeroom[ticket];
    if (stored === undefined) {
      robot.say(`${ticket}: not here`);
      continue;
    }
    bring(stored.shelf);
    robot.deliver(passenger.name);
    backToPost();
  }
hints:
  - "Walk through `claims` destructuring: `for (const { ticket, passenger } of claims)`."
  - "The key is in the variable `ticket`, so it goes in brackets: `storeroom[ticket]`. If that's `undefined`, the ticket isn't there."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, deliver, cargo]
  items: { a: backpack, b: charango, c: umbrella, d: laptop, e: teddy bear }
  map: |
    #############
    #DR.........#
    ###a#b#c#d#e#
    #############
globals:
  storeroom:
    "A-17": { item: charango, shelf: 2 }
    "B-02": { item: laptop, shelf: 4 }
    "C-33": { item: backpack, shelf: 1 }
    "D-08": { item: teddy bear, shelf: 5 }
    "E-21": { item: umbrella, shelf: 3 }
  claims:
    - { ticket: "B-02", passenger: { name: Kevin Ríos } }
    - { ticket: "Z-99", passenger: { name: Mister Mystery } }
    - { ticket: "A-17", passenger: { name: Ruth Mamani } }
scenarios:
  - {}
  - globals:
      claims:
        - { ticket: "D-08", passenger: { name: Grandma Nati } }
        - { ticket: "C-33", passenger: { name: Piero Salas } }
        - { ticket: "E-21", passenger: { name: Milagros Chumpitaz } }
  - globals:
      claims:
        - { ticket: "X-01", passenger: { name: Nobody } }
tests:
  - name: delivers to each passenger with a valid ticket, in order
    state: 'JSON.stringify(w.delivered) === JSON.stringify(g.claims.filter((c) => g.storeroom[c.ticket]).map((c) => c.passenger.name))'
    msg: The deliveries don't match the claims (name, order, or you delivered one that wasn't there).
  - name: brings each ticket's item
    state: 'JSON.stringify([...w.inventory].sort()) === JSON.stringify(g.claims.filter((c) => g.storeroom[c.ticket]).map((c) => g.storeroom[c.ticket].item).sort())'
    msg: Chasqui didn't bring exactly the items of the claimed tickets.
  - name: announces the tickets that aren't there
    state: 'JSON.stringify(w.said) === JSON.stringify(g.claims.filter((c) => !g.storeroom[c.ticket]).map((c) => `${c.ticket}: not here`))'
    msg: 'For each ticket that isn''t there, robot.say(`${ticket}: not here`), and nothing else.'
  - name: no crash
    state: '!w.crashed'
```

## Expert challenge

```exercise
id: js6-reto-diferencias
type: challenge
title: Who touched the record?
prompt: |
  Somebody edited records on the sly. Write `changes(before, after)`, which returns the keys (sorted alphabetically) whose value changed, that were added or that were removed. Values are strings, numbers or `true`/`false`, never objects.
starter: |
  function changes(before, after) {
    return [];
  }

  console.log(changes({ color: "black", gate: 14 }, { color: "blue", gate: 14 }));
solution: |
  function changes(before, after) {
    const keys = [...Object.keys(before), ...Object.keys(after)];
    const different = [];
    for (const key of keys) {
      const changed = !(key in before) || !(key in after) || before[key] !== after[key];
      if (changed && !different.includes(key)) {
        different.push(key);
      }
    }
    return different.sort();
  }

  console.log(changes({ color: "black", gate: 14 }, { color: "blue", gate: 14 }));
hints:
  - "Gather the keys of both objects and check each one only once."
  - "`key in object` says whether the property exists, even if it's `undefined` or `false`."
tests:
  - name: the colour changed
    run: 'changes({ color: "black", gate: 14 }, { color: "blue", gate: 14 })'
    equals: ["color"]
  - name: added and removed
    run: 'changes({ kind: "laptop", returned: false }, { kind: "laptop", owner: "Kevin" })'
    equals: ["owner", "returned"]
  - name: no changes
    run: 'changes({ a: 1 }, { a: 1 })'
    equals: []
  - name: a false that stops existing
    run: 'changes({ returned: false }, {})'
    equals: ["returned"]
```
