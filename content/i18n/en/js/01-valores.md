# Session 1 — Values, variables and console.log

## The job

Your first day at Loop, a shop that smells of solder two blocks from the Puente de los Suspiros. Doña Rosa Quispe, from the bakery on Grau Avenue, wants a box of alfajores delivered to her house, and the only free robot is **Chasqui**: a second-hand delivery bot nobody has set up yet. It doesn't know its name, how much battery it has, or where to go. Today you teach it all of that.

If the alfajores arrive, Doña Rosa will tell half of Barranco. If they don't, Loop goes without breakfast.

```scene
theme: barranco
level: 1
dir: E
caption: Chasqui leaves Loop (on the left) for Doña Rosa's mailbox. Today it learns to get there on its own.
map: |
  ##########
  #R.......#
  #####.##D#
  ##########
program: |
  robot.forward(7);
  robot.turnRight();
  robot.forward(1);
  robot.deliver("Alfajores");
```

## Why JavaScript exists

```goals
- Tell who created JavaScript, when, and what problem it was meant to solve
- Compare its strengths and weaknesses with Python and Java
- Know where it's used today and why it fits there
```

Before you set up Chasqui, a fair question: why does Loop talk to it in JavaScript and not in some other language? The answer starts in 1995, with a browser and a very tight deadline. This lesson is background: if a word means nothing to you (thread, worker, TypeScript), keep going; they all come back later with meaning.

### The problem in 1995

<!-- photo: internet-modem-1995 -->

To see why JavaScript was needed, first look at how the web worked in 1995. Three words are enough:

- A **server** is a computer switched on day and night somewhere in the world. It stores a site's pages and hands them to whoever asks.
- A **page** was a **text file** stored on that server, written in **HTML**: tags that say "a title goes here", "a box to type in goes here", "a button goes here". The browser downloads it and draws it, and that's the end of it. The page carried no code of its own: it couldn't check, calculate or decide anything.
- A **request** is the message your browser sends to the server: "give me this page" or "here's what was typed in the form". The answer is a whole new page.

And all of it travelled over the phone. There was no wifi or fibre at home: there was a **modem** that dialled, over the house phone line, an **internet provider**. While you were online the line was busy and nobody could call you (hence the classic "get off the internet, I'm expecting a call!"). Here's what happened if you forgot to fill in one little box:

<!-- /photo -->

```network
title: A form in 1995, and the same form with JavaScript
clockLabel: Since the click
clockMax: 12
nodes:
  - { id: pc, icon: computer, label: Your computer, sub: the Netscape browser }
  - { id: modem, icon: modem, label: Modem, sub: turns data into sound }
  - { id: isp, icon: isp, label: Internet provider, sub: the one your modem dials }
  - { id: net, icon: internet, label: Internet, sub: networks joined together }
  - { id: server, icon: server, label: Web server, sub: the shop's computer }
links:
  - { id: cable, label: cable }
  - { id: phone, kind: phone, label: "phone line, 28.8 kbps", busy: busy }
  - { id: l3 }
  - { id: l4 }
steps:
  - phase: "1995: no JavaScript"
    at: server
    tags: { server: order.html }
    note: A page is a **file** that lives on the server. This one belongs to Discos Lucho, a record shop that posts its catalogue to anyone who asks. It's plain HTML that only says what to draw; the page carries no program at all.
    show:
      label: order.html, exactly as stored
      text: |
        <h1>Discos Lucho</h1>
        <form action="/cgi-bin/order.cgi"
              method="post">
          Name: <input name="name">
          Email: <input name="email">
          <input type="submit" value="Send">
        </form>
  - at: pc
    tags: { pc: clicks Send }
    note: Rosa opens the page, types her name, forgets her email and clicks **Send**. The browser can't check anything; it just packs up whatever is in the boxes.
    show:
      label: What Rosa sees
      form: { title: Discos Lucho, fields: [[Name, Rosa Quispe], [Email, ""]], button: Send }
  - at: pc
    packet: { kind: up, label: "HTTP request, ~0.5 KB" }
    note: That packet is the **request**, a few lines of text saying which program it's for and what Rosa typed. Look at `email=` at the end; it's empty, but it travels anyway.
    show:
      label: The request, letter by letter
      text: |
        POST /cgi-bin/order.cgi HTTP/1.0
        Content-Type: application/x-www-form-urlencoded
        Content-Length: 23

        name=Rosa+Quispe&email=
  - move: [pc, isp]
    packet: { kind: up, label: "HTTP request, ~0.5 KB" }
    busy: [modem, phone]
    clock: 0.3
    tags: { modem: "eeeee… krrrr…" }
    note: The modem turns the request into **sounds** (yes, those screeches) and sends them down the phone line to the provider. Meanwhile, anyone calling your house gets a busy tone.
  - move: [isp, server]
    packet: { kind: up, label: "HTTP request, ~0.5 KB" }
    busy: [modem, phone]
    clock: 0.6
    note: The provider hands it to the internet, which carries it from network to network until it reaches the shop's **server**.
  - at: server
    packet: { kind: up, label: "HTTP request, ~0.5 KB" }
    busy: [modem, phone]
    clock: 1
    tags: { server: "email empty → error" }
    note: The server passes the data to a **CGI** program, the standard way back then to connect a page to a program. The program checks, sees the empty email and writes a **whole new page** just to say so.
    show:
      label: order.cgi, in words
      text: |
        if the email is empty:
            write a whole page
            that says "You forgot your email"
        otherwise:
            save the order
  - move: [server, pc]
    dur: 2800
    packet: { kind: down, label: "HTML page, ~35 KB" }
    busy: [modem, phone]
    clock: 11
    note: "The answer makes the trip back, and the slow stretch is the phone line: 35 KB is 35 × 1024 × 8 = 286,720 bits, and at 28,800 bits per second that takes **about 10 seconds**, at best."
  - at: pc
    packet: { kind: down, label: "HTML page, ~35 KB" }
    busy: [modem, phone]
    clock: 11
    tags: { pc: draws the page again }
    note: About 11 seconds after the click, Rosa sees the page again, now with a warning at the top. And every mistake costs another full trip.
    show:
      label: What Rosa sees
      form: { title: Discos Lucho, message: You forgot your email, fields: [[Name, Rosa Quispe], [Email, ""]], button: Send }
  - phase: With JavaScript
    at: server
    clock: 0
    tags: { server: order.html }
    note: Now the page carries a **tiny program inside**, written in JavaScript. It's in the same file, so it arrives with the page the first time you open it.
    show:
      label: order.html, with its script
      text: |
        <form action="/cgi-bin/order.cgi"
              method="post"
              onsubmit="return check(this)">
          …the same boxes and button…
        </form>
        <script>
          function check(form) {
            if (form.email.value === "") {
              alert("You forgot your email");
              return false;
            }
            return true;
          }
        </script>
  - at: pc
    clock: 0
    dim: [modem, isp, net, server]
    dimLinks: [cable, phone, l3, l4]
    tags: { pc: "email empty → warning" }
    note: Rosa clicks **Send** and the check runs **inside her browser**. Nothing travels, the line stays free and the warning shows up instantly.
    show:
      label: What Rosa sees
      form: { title: Discos Lucho, message: You forgot your email, fields: [[Name, Rosa Quispe], [Email, ""]], button: Send }
  - at: pc
    clock: 0
    note: When the form is complete it still goes to the server, but only once and with the right data. That's what Netscape wanted, a page that could decide small things without asking anyone.
    show:
      - { label: "Without JavaScript: a trip per mistake", value: "≈ 11 s" }
      - { label: "With JavaScript: the browser checks", value: instantly }
caption: "The sums assume a 28.8 kbps modem running at full speed (in practice, less; and many were 14.4, twice as slow), an answer of about 35 KB of HTML and images, and around a second for the rest of the trip and the server's program."
```

Eleven seconds and a busy line, all for one empty box. The other way to put a program in a page was a **Java applet**, and light it wasn't:

```network
title: How a Java applet started
nodes:
  - { id: page, icon: file, label: The page, sub: HTML with a box set aside }
  - { id: cls, icon: program, label: The applet, sub: "a compiled program (.class), separate" }
  - { id: jvm, icon: engine, label: Java virtual machine, sub: a big program that runs applets }
  - { id: box, icon: box, label: The box, sub: where the applet draws }
links:
  - { id: a1, label: downloaded }
  - { id: a2, label: has to start up }
  - { id: a3 }
steps:
  - at: page
    note: The page says "an applet goes here" and sets aside a rectangle for it. Meanwhile, you stare at a grey box.
  - move: [page, cls]
    packet: { kind: down, label: the compiled applet }
    note: The browser downloads the applet, which is another file that comes separately from the page. Over a modem, that meant more waiting.
  - at: jvm
    packet: { kind: down, label: the compiled applet }
    tags: { jvm: starting… }
    note: Before anything runs, the **Java virtual machine** has to start. Netscape built it in from 1996; other browsers needed a separate plugin. Starting it could take several seconds and freeze the browser for a while.
  - move: [jvm, box]
    packet: { kind: down, label: the compiled applet }
    note: At last the applet runs, but shut inside its box, like a little separate window. Good for a game or a chart, not so much for checking one box in a form. And writing it meant knowing Java, with its classes, types and compiling.
```

<!-- photo: netscape-navigator-2 -->

What existed wasn't enough: HTML can't decide anything, applets were heavy and aimed at professional programmers, and server programs meant a round trip for every little thing.

**Netscape**, the company behind the most used browser of the time, wanted a small language that lived *inside* the page, for designers and hobbyists: check a form, work out a total, react to a click without asking the server. In May 1995 the job went to **Brendan Eich**, who wrote the first prototype in about **ten days**. Management's condition: it had to *look like* Java, the fashionable language. That's why it has braces and semicolons; on the inside, though, Eich borrowed ideas from **Scheme** (functions you pass around like any other value) and **Self** (objects that inherit from other objects).

It was called **Mocha**, then **LiveScript** and, in December 1995, **JavaScript**, thanks to a marketing deal with Sun, the owner of Java. Java and JavaScript are about as related as *car* and *carpet*: they share letters, not a recipe.

<!-- /photo -->

```figure
title: JavaScript over time
panes:
  - timeline:
      - when: "1995"
        title: "Netscape"
        text: "Eich creates Mocha → LiveScript → JavaScript"
      - when: "1996–97"
        title: "Browser wars"
        text: "Microsoft ships JScript; the ECMAScript standard is born"
      - when: "2005"
        title: "Ajax"
        text: "Gmail and Google Maps load data without reloading the page"
      - when: "2009"
        title: "Node.js"
        text: "JavaScript leaves the browser and reaches servers"
      - when: "2012"
        title: "TypeScript"
        text: "Microsoft adds types that are checked before running"
      - when: "2015"
        title: "ES2015"
        text: "let, const, classes, modules: the JavaScript of this course"
caption: Since 2015 a new edition of the standard comes out every year (ES2016, ES2017…).
```

## The minimum

A program stores **values** in **variables** and uses them. The basic values are text (*strings*, in quotes), numbers and booleans (`true` or `false`). With `console.log` you can look inside anything.

**How this runs.** You write text. A program called the **engine** (JavaScript's lives in your browser and in Node) reads it line by line and does what it says. In Loop, the ▶ button hands your text to the engine, and what you send with `console.log` appears in the **console**, the panel below. `typeof` asks what type a value is.

```js run
const name = "Chasqui";
let battery = 100;
battery = battery - 12;
console.log(`${name} has ${battery}% battery`);
console.log(typeof name, typeof battery, typeof true);
```

A variable is a **labelled box**: you store a value, read it whenever you like and, if you declared it with `let`, change what's inside. (With arrays and objects the box holds an arrow to the contents: you'll see it in session 5.) Press ▶ and watch each box change line by line:

```anim
title: Variables as boxes
code: |
  const name = "Chasqui";
  let battery = 100;
  battery = battery - 12;
  battery = battery - 30;
  console.log(`${name}: ${battery}%`);
notes:
  1: A labelled box that won't change (const).
  3: battery changes, that's why it was declared with let.
  5: The template literal drops the values into the text.
```

Three ideas, and that's enough for today:

- **`const` by default.** Declare with `const` everything that won't change. If the value changes, like the battery, use `let`. If you try to change a `const`, JavaScript stops you with an error (`TypeError: Assignment to constant variable.`), and that's good: it protects you from changes you didn't mean.
- **Template literals.** Inside backticks (`` ` ``) you can drop in any value with `${…}`. That's how you build text without fighting over spaces.
- **`console.log` takes several things** separated by commas and prints them separated by a space.

> **Common trap:** `+` adds numbers but *glues* strings. `"3" + 2` is `"32"`, not `5`. If a number reaches you as text (from a form, from a sensor), convert it first with `Number("3")`.

<!-- legacy: let-const -->

<!-- legacy: template-literals -->

<!-- mdn: let-const let template-literals console-log typeof -->

## For the curious

For the curious: how it grew, what it compares with and where it's used. If a word means nothing to you, keep going; it comes back later with meaning.

### From toy to everything

During the **browser wars**, Microsoft made its own copy, **JScript**, for Internet Explorer (1996). Two versions that behaved differently were a nightmare, so Netscape took the language to Ecma International to standardise it: the standard is called **ECMAScript** (ECMA-262, first edition in 1997) and a committee, **TC39**, looks after it; browser makers and other companies sit on it today.

For years JavaScript was "the language for little effects". That changed in 2004–2005, when **Gmail** and **Google Maps** showed pages that ask the server for data without reloading; Jesse James Garrett gave the technique a name: **Ajax**. In 2008 Chrome's **V8** engine made it much faster, and in 2009 Ryan Dahl used it to build **Node.js**: JavaScript outside the browser, on servers. In 2015, **ES2015** brought `let`, `const`, arrow functions, classes and modules, which is what you learn here.

```idea
JavaScript was born so a page could react without going to the server, and since you can't "break the web", it carries its youthful mistakes forever.
```

### Strengths and weaknesses

Ten rushed days left some oddities, such as `==`, which converts types on its own, or `var`, which ignores blocks. They can't be fixed: millions of pages depend on them working that way, and a browser that changed them would break those pages. The way out was to **add** new forms (`===`, `let`, `const`) and keep the old ones. That's why, throughout the course, you'll see **"In older code you'll see…"** boxes: they teach you to recognise the old and write the modern.

```exercise
id: js1-origen-igualdad
type: predict
title: An oddity from 1995
prompt: |
  `==` dates from the ten days; `===` came later to fix it. What does this print?
code: |
  console.log("5" == 5, "5" === 5);
options:
  - true false
  - false false
  - true true
  - false true
answer: true false
explain: |
  `==` turns the text `"5"` into a number before comparing, so it gives `true`. `===` also compares the type, and a text isn't a number: `false`. In this course we always use `===`.
```

The same task, adding up the prices of an order, in three languages:

**JavaScript**

```js
const prices = [18.5, 12, 6];
const total = prices.reduce((a, b) => a + b, 0);
console.log(total);
```

**Python**

```py
prices = [18.5, 12, 6]
total = sum(prices)
print(total)
```

**Java**

```
double[] prices = {18.5, 12, 6};
double total = 0;
for (double p : prices) total += p;
System.out.println(total);
// …inside a class and a main
```

Python is the shortest; Java asks for types and a class; JavaScript runs as is in any browser's console.

```figure
title: JavaScript next to others
panes:
  - table:
      head: ["", "JavaScript", "Python", "Java"]
      rows:
        - ["Runs with nothing to install", "**In every browser**", "No", "No"]
        - ["Types", "Dynamic (TypeScript adds them)", "Dynamic (optional annotations)", "Static, checked when compiling"]
        - ["Waiting for network or files", "**Async from birth**", "Possible (asyncio)", "With threads"]
        - ["Heavy work on several cores", "One thread; workers on the side", "Limited by the GIL", "**Real threads**"]
        - ["Inherited oddities", "Many (`==`, `var`)", "Few", "Few"]
        - ["Packages", "npm, huge", "PyPI, huge", "Maven, huge"]
```

**Strengths.**

- **It runs wherever there's a browser**: a phone, a laptop, your aunt's computer. Nobody installs anything. That's why Loop programs Chasqui in JavaScript: the simulator and your code run right here, on this page.
- **One language front and back**: with Node.js, the page and the server are written in the same language and share code.
- **A giant ecosystem**: npm is one of the largest package registries there is; someone has almost always solved your problem already.
- **Async**: while it waits for the network or a file, it doesn't freeze; it keeps handling other things (you'll see it in the async session).

**Weaknesses.**

- **Inherited oddities** such as `==` and `var`, which you need to know to read old code.
- **One thread for your code**: a heavy calculation freezes the page until it's done. *Workers* exist to share out the work, but they're extra work.
- **Dynamic types at scale**: many errors only show up when the code runs. That's why so many large teams write **TypeScript**, which checks types beforehand.
- **Chains of dependencies**: a small project can pull in hundreds of packages. In 2016, removing `left-pad`, an 11-line package, broke the install of thousands of projects.

### Where it's used today

```figure
title: Where JavaScript lives
panes:
  - table:
      head: ["Where", "Why it fits"]
      rows:
        - ["**Web pages and apps**", "It's the only language every browser runs out of the box"]
        - ["**Servers and APIs**", "Node.js handles many connections at once without blocking"]
        - ["**Desktop apps**", "Electron packages a website as an app (VS Code; this course too)"]
        - ["**Mobile apps**", "React Native reuses what the team already knows from the web"]
```

Its home ground is the web, because there it has no competition: the browser speaks JavaScript (and WebAssembly, for special cases) and nothing else. From there it spread to everything someone who already knows the web wants to build. In the **Stack Overflow 2026** developer survey, JavaScript was again the most used language (62.0 % of respondents, with Python at 58.0 %). In **GitHub Octoverse 2025**, first place by number of contributors went to **TypeScript**, that is, JavaScript with types. These are snapshots of one year, not eternal truths: check the latest edition.

```recap
- Brendan Eich created it at Netscape in 1995, in about ten days, so pages could react without going to the server.
- The name "JavaScript" was marketing; the standard is called ECMAScript and the TC39 committee looks after it.
- Ajax (2005), Node.js (2009), ES2015 and TypeScript took it from little effects to everywhere.
- "Strengths: runs in every browser, same language front and back, huge ecosystem, async."
- "Weaknesses: oddities like `==` and `var`, one thread, dynamic types at scale, chains of dependencies."
```

**Sources**

- Allen Wirfs-Brock and Brendan Eich, ["JavaScript: The First 20 Years"](https://dl.acm.org/doi/10.1145/3386327), HOPL IV, ACM, 2020.
- Ecma International, [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/), and [TC39](https://tc39.es/).
- MDN, [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript).
- T. Berners-Lee, R. Fielding and H. Frystyk, [RFC 1945: HTTP/1.0](https://www.rfc-editor.org/rfc/rfc1945), 1996, how requests and pages travel.
- Jesse James Garrett, ["Ajax: A New Approach to Web Applications"](https://web.archive.org/web/20050305001607/http://www.adaptivepath.com/publications/essays/archives/000385.php), 2005.
- [Node.js: About](https://nodejs.org/en/about) and [TypeScript](https://www.typescriptlang.org/).
- [Stack Overflow Developer Survey 2026: Technology](https://survey.stackoverflow.co/2026/technology).
- GitHub, [Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).

## Practice

```exercise
id: js1-predice-bateria
type: predict
title: The first charge
prompt: |
  Before running it: what does it print?
code: |
  const name = "Chasqui";
  let battery = 80;
  battery = battery - 15;
  console.log(name, battery);
options:
  - Chasqui 65
  - Chasqui 80
  - name battery
  - Chasqui65
answer: Chasqui 65
explain: |
  `let` lets `battery` change: first it's 80, then `80 - 15`. `console.log` separates its arguments with a space.
```

```exercise
id: js1-predice-paquetes
type: predict
title: The sensor that speaks in text
prompt: |
  Chasqui's load sensor returns the number of packages as text. What do these two lines print?
code: |
  const packages = "3";
  console.log(packages + 2);
  console.log(Number(packages) + 2);
options:
  - "5\n5"
  - "32\n5"
  - "32\n32"
  - "5\n32"
answer: "32\n5"
explain: |
  With a string involved, `+` glues: `"3" + 2` is `"32"`. `Number("3")` turns it into the number 3, and then it really adds.
```

```exercise
id: js1-completa-config
type: complete
title: Chasqui's profile
prompt: |
  Set up the robot: its name is **Chasqui**, it starts with **100** battery (which will go down) and it **is carrying cargo** (`true`). Replace each `___`.
starter: |
  const name = ___;
  ___ battery = 100;
  const hasCargo = ___;
  console.log(`${name} ready with ${battery}% battery`);
solution: |
  const name = "Chasqui";
  let battery = 100;
  const hasCargo = true;
  console.log(`${name} ready with ${battery}% battery`);
hints:
  - Strings go in quotes. `true` has no quotes, it's a boolean.
  - The battery will change during the delivery, so it can't be `const`.
tests:
  - name: name is the string "Chasqui"
    expect: 'name === "Chasqui"'
  - name: battery starts at 100 and is declared with let
    source: '\blet\s+battery\b'
    msg: The battery will change during the day. Declare it with let.
  - name: hasCargo is the boolean true
    expect: hasCargo === true
    msg: hasCargo must be true, without quotes.
  - name: the console announces the robot
    output: Chasqui ready with 100% battery
```

```exercise
id: js1-arregla-const
type: fix
title: The battery that wouldn't go down
prompt: |
  This program should show the battery after a delivery, but it crashes. Run it, read the error and fix it with the smallest change.
starter: |
  const battery = 100;
  const costPerDelivery = 30;
  battery = battery - costPerDelivery;
  console.log("Battery after the delivery:", battery);
solution: |
  let battery = 100;
  const costPerDelivery = 30;
  battery = battery - costPerDelivery;
  console.log("Battery after the delivery:", battery);
hints:
  - The error says you tried to change a constant. Which of the two changes?
tests:
  - name: prints the battery left
    output: "Battery after the delivery: 70"
  - name: costPerDelivery is still const
    source: '\bconst\s+costPerDelivery\b'
    msg: The cost per delivery doesn't change, keep it const.
  - name: no var
    sourceNot: '\bvar\b'
    msg: Use let, not var.
```

```exercise
id: js1-escribe-costo
type: write
title: What to charge
prompt: |
  Compute in `cost` what the delivery to Doña Rosa's house costs and show it as `Cost: S/ 11`.

  Loop charges a **5 soles** base fee plus **1.5 soles per kilometre**, and the house is **4 km** away. Store those three numbers in three constants and compute the total from them.
visual:
  figure:
    title: How the fee adds up
    panes:
      - receipt:
          title: LOOP · DELIVERY
          rows: [["Base fee", "5.00"], ["4 km × 1.5", "6.00"]]
          total: "11.00"
starter: |
  // Your three constants:

  // The total:
  const cost = 0;
  console.log(`Cost: S/ ${cost}`);
solution: |
  const baseFee = 5;
  const pricePerKm = 1.5;
  const distanceKm = 4;
  const cost = baseFee + pricePerKm * distanceKm;
  console.log(`Cost: S/ ${cost}`);
hints:
  - In JavaScript multiplication happens before addition, just like at school.
  - "`const cost = baseFee + pricePerKm * distanceKm;`"
tests:
  - name: cost is 11
    expect: cost === 11
  - name: the console shows the cost
    output: "Cost: S/ 11"
  - name: the total is computed from variables, not by hand
    source: '\bcost\s*=\s*[A-Za-z_$][\w$]*\s*[+*]'
    msg: Compute cost from your constants, don't write 11 directly.
```

```exercise
id: js1-escribe-salida
type: write
title: Leaving Loop
prompt: |
  Take Chasqui to the mailbox (D) and make it say `I'm Chasqui` with `robot.say()`.

  It's the first test lap, and Chasqui starts facing east.

  What Chasqui understands today: `robot.forward(n)`, `robot.turnLeft()`, `robot.turnRight()` and `robot.say(text)`. Press **Test** and watch the map.
starter: |
  const name = "Chasqui";
  robot.forward(1);
solution: |
  const name = "Chasqui";
  robot.forward(2);
  robot.turnRight();
  robot.forward(2);
  robot.say(`I'm ${name}`);
hints:
  - Count the free tiles to the right up to the wall, then turn.
  - Turning right while facing east leaves you facing south.
world:
  theme: barranco
  level: 1
  dir: E
  map: |
    #######
    #R..###
    ###.###
    ###D###
    #######
tests:
  - name: Chasqui reaches the mailbox
    state: w.atGoal
    msg: Chasqui didn't end up on the mailbox.
  - name: says "I'm Chasqui"
    state: 'w.said.includes("I''m Chasqui")'
    msg: Make it say exactly "I'm Chasqui", with a template literal.
```

## The case

```exercise
id: js1-caso-vuelto
type: case
title: The change that doesn't add up
prompt: |
  **Work out the correct change for each order and compare it with what each robot reported.** The one that doesn't match kept the money.

  On Saturday four robots delivered bakery orders, and that night the till was **2 soles short**. The board shows who delivered what, how much each customer paid and how much change each robot says it handed over. Print one line per robot starting with its name, for example `console.log("Chasqui:", rosaChange)`, and the board will tell you whether it matches.
visual:
  board:
    for: js1-caso-vuelto
    task: "Correct change = what they paid − what the order cost. Compare it with what the robot reported."
    cards:
      - name: Chasqui
        kind: robot
        role: Delivery bot
        with: { name: Rosa, kind: person, label: delivered Rosa's order }
        rows: [["Order", "2 boxes of alfajores"], ["Paid", "S/ 50"], ["Reported change", "S/ 13"]]
        clue: { find: "Chasqui", says: 13 }
      - name: Wayra
        kind: robot
        role: Delivery bot
        with: { name: Don Lucho, kind: person, label: delivered Don Lucho's order }
        rows: [["Order", "3 dozen picarones"], ["Paid", "S/ 40"], ["Reported change", "S/ 4"]]
        clue: { find: "Wayra", says: 4 }
      - name: Pituco
        kind: robot
        role: Delivery bot
        culprit: true
        with: { name: Grandma Tere, kind: person, label: delivered Grandma Tere's order }
        rows: [["Order", "4 cups of suspiro"], ["Paid", "S/ 50"], ["Reported change", "S/ 10"]]
        clue: { find: "Pituco", says: 10 }
      - name: Tuki
        kind: robot
        role: Delivery bot
        with: { name: Mr. Kenji, kind: person, label: delivered Mr. Kenji's order }
        rows: [["Order", "1 box of alfajores + 1 suspiro"], ["Paid", "S/ 30"], ["Reported change", "S/ 2"]]
        clue: { find: "Tuki", says: 2 }
      - name: Doña Rosa
        kind: note
        role: The bakery's price list
        rows: [["Alfajores (box)", "S/ 18.50"], ["Picarones (dozen)", "S/ 12"], ["Suspiro (cup)", "S/ 9.50"]]
starter: |
  // Bakery prices, in soles
  const alfajorBoxPrice = 18.5;  // box
  const picaronDozenPrice = 12;  // dozen
  const suspiroCupPrice = 9.5;   // cup

  // What each customer paid
  const rosaPaid = 50;   // 2 boxes of alfajores, delivered by Chasqui
  const luchoPaid = 40;  // 3 dozen picarones, delivered by Wayra
  const terePaid = 50;   // 4 cups of suspiro, delivered by Pituco
  const kenjiPaid = 30;  // 1 box of alfajores and 1 suspiro, delivered by Tuki

  // TODO: work out the correct change for each order
  // and print one line per robot, for example:
  // console.log("Chasqui:", rosaChange);
solution: |
  const alfajorBoxPrice = 18.5;
  const picaronDozenPrice = 12;
  const suspiroCupPrice = 9.5;

  const rosaPaid = 50;
  const luchoPaid = 40;
  const terePaid = 50;
  const kenjiPaid = 30;

  const rosaChange = rosaPaid - 2 * alfajorBoxPrice;
  const luchoChange = luchoPaid - 3 * picaronDozenPrice;
  const tereChange = terePaid - 4 * suspiroCupPrice;
  const kenjiChange = kenjiPaid - (alfajorBoxPrice + suspiroCupPrice);
  console.log("Chasqui:", rosaChange);
  console.log("Wayra:", luchoChange);
  console.log("Pituco:", tereChange);
  console.log("Tuki:", kenjiChange);
answer: Pituco
answerLabel: Which robot kept the 2 soles?
reveal: |
  Pituco. Grandma Tere's change was `50 - 4 * 9.5 = 12`, and it reported 10. The other three add up: 13, 4 and 2.
hints:
  - "The first one, as an example: `const rosaChange = rosaPaid - 2 * alfajorBoxPrice;` gives 13, the same as Chasqui reported. Do the same for the other three."
  - For Kenji's order, add the two items first and then subtract that from what he paid. Parentheses rule.
```

## The judge

A judge works like the ones in programming contests: your program **reads an input** and **writes an output**, and the judge tests it on the statement's examples and on dozens of hidden cases. To read, the Workshop gives you three functions you'll use in every session:

- `readLine()` returns the next line of the input, as text;
- `readNumber()` returns the next line converted to a number;
- `readNumbers()` returns the next line as a list of numbers (separated by spaces).

Write the answer with `console.log`, in exactly the format the statement asks for.

```exercise
id: js1-juez-cuenta
type: judge
title: The bakery bill
prompt: |
  **Print the bill's total and, on the next line, the change.**

  Doña Rosa wants Chasqui to work out each bill before leaving: a product's price times the quantity, plus delivery. Then, from what the customer pays, the change.

  **Input:** four lines with one integer each: the price `P`, the quantity `Q`, the delivery fee `D` and what the customer pays `M`.

  **Output:** two lines: the total `P × Q + D` and the change `M − total`.

  **Constraints:** 1 ≤ P ≤ 200 · 1 ≤ Q ≤ 20 · 0 ≤ D ≤ 15 · total ≤ M ≤ 5000.
starter: |
  const price = readNumber();
  // also read the quantity, the delivery fee and the payment

  console.log(price);
solution: |
  const price = readNumber();
  const quantity = readNumber();
  const delivery = readNumber();
  const paid = readNumber();
  const total = price * quantity + delivery;
  console.log(total);
  console.log(paid - total);
hints:
  - Use `readNumber()`, not `readLine()`. With text, `+` joins instead of adding.
visual:
  figure:
    title: Sample 1, as a receipt
    input: { label: Input, text: "18\n2\n5\n50" }
    arrow: price × quantity + delivery
    output:
      label: Output
      receipt:
        title: ROSA'S BAKERY
        rows: [["2 × S/ 18", "36"], ["Delivery", "5"], ["**Total**", "**41**"], ["Paid", "50"]]
        totalLabel: Change
        total: "9"
    steps:
      - "The input brings, in order: price 18, quantity 2, delivery 5 and payment 50."
      - "First output line: the total, 18 × 2 + 5 = 41."
      - "Second line: the change, 50 − 41 = 9."
samples:
  - input: "18\n2\n5\n50"
    output: "41\n9"
  - input: "12\n3\n0\n36"
    output: "36\n0"
    note: Free delivery and exact payment, so the change is 0.
edge:
  - input: "1\n1\n0\n1"
    tag: with the minimum values
  - input: "200\n20\n15\n5000"
    tag: with the maximum values
  - input: "7\n3\n15\n36"
    tag: when the payment is exact
random:
  count: 40
  seed: 11
  tag: ""
  generate: |
    const p = rng.int(1, 200), q = rng.int(1, 20), d = rng.int(0, 15);
    const total = p * q + d;
    return `${p}\n${q}\n${d}\n${rng.int(total, 5000)}`;
wrong:
  - |
    const price = readLine();
    const quantity = readLine();
    const delivery = readLine();
    const paid = readLine();
    const total = price * quantity + delivery;
    console.log(total);
    console.log(paid - total);
  - |
    const price = readNumber();
    const quantity = readNumber();
    const delivery = readNumber();
    const paid = readNumber();
    console.log(price * quantity + delivery);
    console.log(paid - price * quantity);
```

## Final mission

```exercise
id: js1-mision-alfajores
type: mission
title: Doña Rosa's alfajores
prompt: |
  **Build the order's label and take Chasqui to Doña Rosa's mailbox to deliver it.**

  Chasqui leaves Loop (top left) with **just enough battery: 11 tiles**. Doña Rosa's house is the one with the mailbox. One wrong turn and it runs dry halfway.

  1. Build in `label` the text `Order 27 for Rosa Quispe` with a template literal and the variables `order` and `customer`.
  2. Take Chasqui to the mailbox and deliver with `robot.deliver(label)`.

  When it passes, session 2 unlocks.
starter: |
  const customer = "Rosa Quispe";
  const order = 27;
  const label = "";

  robot.forward(3);
solution: |
  const customer = "Rosa Quispe";
  const order = 27;
  const label = `Order ${order} for ${customer}`;

  robot.forward(3);
  robot.turnRight();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(5);
  robot.turnLeft();
  robot.forward(1);
  robot.deliver(label);
hints:
  - "Trace the route with your finger on the map: east, south, east, north. Count the tiles of each stretch."
  - If Chasqui faces south and you turn left, it ends up facing east.
world:
  theme: barranco
  level: 1
  dir: E
  battery: 11
  map: |
    ##############
    #R...#########
    ####.####D####
    ####......#..#
    #..#.##.....##
    ##############
tests:
  - name: the label is "Order 27 for Rosa Quispe"
    expect: 'label === "Order 27 for Rosa Quispe"'
  - name: the label is built with a template literal
    source: '`[^`]*\$\{[^`]*`'
    msg: Use backticks and ${…} to build the label.
  - name: Chasqui reaches the mailbox
    state: w.atGoal
    msg: Chasqui didn't end up on Doña Rosa's mailbox.
  - name: delivers the package with its label
    state: 'w.delivered.length === 1 && w.delivered[0] === "Order 27 for Rosa Quispe"'
    msg: Missing robot.deliver(label) once, standing on the mailbox.
```

## Expert challenge

```exercise
id: js1-reto-ticket
type: challenge
title: The aligned receipt
visual:
  figure:
    title: The receipt's columns
    panes:
      - label: 16 columns for the item, then "S/ " and 6 for the total
        text: "Ceviche x3......S/  22.50\n|<--- 16 ----->|   |<-6>|"
prompt: |
  **Print the receipt line with the item aligned.** For people who already code. Loop's receipt printer has 16 columns for the item. Print one line with the item and quantity padded with dots to 16 characters, then `S/ ` and the total with two decimals, right-aligned in 6 characters.

  With `dish = "Ceviche"`, `price = 7.5` and `quantity = 3` it must print `Ceviche x3......S/  22.50`. The three variables come from the till and change on every test.
starter: |
  // dish, price and quantity already exist
  console.log(dish, price, quantity);
solution: |
  const item = `${dish} x${quantity}`.padEnd(16, ".");
  const total = (price * quantity).toFixed(2).padStart(6);
  console.log(`${item}S/ ${total}`);
hints:
  - Look up `padEnd`, `padStart` and `toFixed` on MDN.
globals:
  dish: Ceviche
  price: 7.5
  quantity: 3
scenarios:
  - tests:
      - name: Ceviche x3
        output: Ceviche x3......S/  22.50
  - globals: { dish: Chicha morada, price: 4, quantity: 2 }
    tests:
      - name: Chicha morada x2 (exactly 16 characters)
        output: Chicha morada x2S/   8.00
  - globals: { dish: Causa, price: 12.9, quantity: 1 }
    tests:
      - name: Causa x1
        output: Causa x1........S/  12.90
```
