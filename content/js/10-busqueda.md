# Sesión 10 — Búsqueda (BFS)

## El encargo

Centro de Lima, un domingo de octubre. Sale la procesión, el Jirón de la Unión es un mar morado, la mitad de las calles está cerrada con vallas y en las otras hay ambulantes vendiendo turrón. En la farmacia de la Plaza San Martín hay una conservadora de insulina que tiene que llegar a la emergencia del Hospital Dos de Mayo, y ninguna moto puede pasar.

La doctora Rocío Paredes llamó a Loop. Chasqui tiene sirena desde la sesión 2, pero la batería le alcanza **justo** para la ruta más corta: ni una cuadra de más. Probar calles al azar no sirve. Hoy Chasqui aprende a **buscar**: explorar el mapa en ondas, desde donde está, hasta encontrar el camino más corto, y después recorrerlo.

```escena
theme: barranco
level: 4
dir: E
caption: El Centro de Lima con calles cerradas. Chasqui busca la ruta más corta hasta la emergencia del hospital (D) y la sigue sin desviarse.
map: |
  #############
  #R....#.....#
  #.###.#.###.#
  #.#.....#...#
  #.#.###.#.#.#
  #...#...#.#D#
  ###.#.###.#.#
  #.....#.....#
  #############
program: |
  robot.avanzar(4);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(2);
  robot.girarDerecha();
  robot.avanzar(4);
  robot.girarDerecha();
  robot.avanzar(4);
```

## Lo mínimo

La **búsqueda en anchura** (BFS, por *breadth-first search*) explora como una onda en el agua: primero todas las casillas a 1 paso, luego todas las que están a 2, luego a 3… La primera vez que la onda toca la meta, la encontró por el camino más corto. Necesita tres piezas:

- una **cola**: la lista de casillas por explorar. Se agrega al final (`push`) y se saca del inicio (`shift`): la primera que entra es la primera que sale;
- un **`Set`** de casillas vistas, para no meter dos veces la misma;
- un **`Map`** para recordar algo de cada casilla: a cuántos pasos está, o de qué casilla vino.

```js run
const vistos = new Set(["1,1"]);
vistos.add("2,1");
console.log(vistos.has("2,1"), vistos.has("5,5"), vistos.size);
const padre = new Map([["2,1", "1,1"]]);
console.log(padre.get("2,1"), padre.has("9,9"));
```

Las casillas se guardan como texto, `"x,y"`, porque un `Set` compara arrays por identidad: `[2, 1]` y otro `[2, 1]` son dos arrays distintos. Mira la onda: la cola (en el borde) avanza y las casillas vistas se pintan.

```anima
title: La onda de BFS sobre un plano de 3 × 3
code: |
  const plano = ["...", ".#.", "..."];
  const pasos = [[1,0],[0,1],[-1,0],[0,-1]];
  const cola = [[0, 0]];
  const vistos = new Set(["0,0"]);
  while (cola.length > 0) {
    const [x, y] = cola.shift();
    for (const [dx, dy] of pasos) {
      const nx = x + dx;
      const ny = y + dy;
      const clave = `${nx},${ny}`;
      const ok = plano[ny]?.[nx] === ".";
      if (ok && !vistos.has(clave)) {
        vistos.add(clave);
        cola.push([nx, ny]);
      }
    }
  }
  console.log(vistos.size);
grid: { map: ["...", ".#.", "..."], visited: vistos, frontier: cola }
show: [x, y, clave]
speed: 500
notes:
  6: "Sale de la cola la casilla que lleva más tiempo esperando."
  7: "Se prueban sus 4 vecinas."
  12: "Una vecina sirve si es calle y nadie la vio antes."
  13: "Se marca como vista al meterla en la cola, no al sacarla."
  18: "La onda cubrió las 8 casillas de calle."
```

Para saber **la ruta**, y no solo la distancia, cada casilla anota en un `Map` de qué casilla llegó (su *padre*). Al final se camina hacia atrás desde la meta, de padre en padre, y se da la vuelta:

```js
function rutaMasCorta(plano, inicio, meta) {
  const cola = [inicio];
  const padre = new Map([[inicio, null]]);
  while (cola.length > 0) {
    const actual = cola.shift();
    if (actual === meta) break;
    const [x, y] = actual.split(",").map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const vecina = `${x + dx},${y + dy}`;
      if (plano[y + dy]?.[x + dx] === "." && !padre.has(vecina)) {
        padre.set(vecina, actual);
        cola.push(vecina);
      }
    }
  }
  if (!padre.has(meta)) return null;
  const ruta = [];
  for (let c = meta; c !== null; c = padre.get(c)) ruta.push(c);
  return ruta.reverse();
}
```

Aquí el `Map` de padres hace también de "vistos": si una casilla ya tiene padre, ya entró a la cola.

```figura
title: Reconstruir la ruta, de la meta hacia atrás
panes:
  - { label: "la onda llegó a H; cada casilla sabe de dónde vino", grid: ["A..", "#.#", "..H"], marks: ["0,0", "1,0", "2,0", "1,1", "0,2", "1,2", "2,2"], path: ["0,0", "1,0", "1,1", "1,2", "2,2"] }
  - { label: padre, table: { head: ["casilla", "vino de"], rows: [["2,2 (H)", "1,2"], ["1,2", "1,1"], ["1,1", "1,0"], ["1,0", "0,0"], ["0,0 (A)", "null"]] } }
  - { label: "al revés", value: "0,0 → 1,0 → 1,1 → 1,2 → 2,2" }
```

> **Trampa común:** marcar una casilla como vista cuando *sale* de la cola en lugar de cuando *entra*. La misma casilla entra varias veces, desde cada vecina, y en un mapa grande la cola crece sin control. Márcala al hacer `push`.

`shift()` es cómodo pero lento con colas enormes (corre todo el array un lugar). Con miles de casillas, recorre la cola con un índice: `for (let i = 0; i < cola.length; i++) { const actual = cola[i]; … }`.

<!-- legacy: set-vs-object -->

<!-- legacy: map-vs-object -->

<!-- mdn: set-vs-object map-vs-object -->

## Práctica

```exercise
id: js10-predice-cola
type: predict
title: El orden de la cola
prompt: |
  ¿Qué imprime?
code: |
  const cola = ["Plaza San Martín"];
  cola.push("Jr. Ica", "Jr. Huancavelica");
  const primero = cola.shift();
  cola.push("Av. Abancay");
  console.log(primero);
  console.log(cola.join(" | "));
options:
  - "Plaza San Martín\nJr. Ica | Jr. Huancavelica | Av. Abancay"
  - "Av. Abancay\nPlaza San Martín | Jr. Ica | Jr. Huancavelica"
  - "Plaza San Martín\nAv. Abancay | Jr. Ica | Jr. Huancavelica"
  - "Jr. Huancavelica\nPlaza San Martín | Jr. Ica | Av. Abancay"
answer: "Plaza San Martín\nJr. Ica | Jr. Huancavelica | Av. Abancay"
explain: |
  `push` agrega al final y `shift` saca del inicio: sale el que llegó primero, como en la cola de un banco. Con `pop` saldría el último (eso es una pila, no una cola).
```

```exercise
id: js10-predice-set
type: predict
title: La misma casilla, dos veces
prompt: |
  ¿Qué imprime?
code: |
  const vistos = new Set();
  vistos.add([2, 3]);
  vistos.add("2,3");
  vistos.add("2,3");
  console.log(vistos.size, vistos.has([2, 3]), vistos.has("2,3"));
options:
  - "1 true true"
  - "2 false true"
  - "3 false true"
  - "2 true true"
answer: "2 false true"
explain: |
  Un `Set` no repite valores: el segundo `"2,3"` no entra. Pero dos arrays son iguales solo si son **el mismo** array; el `[2, 3]` del `has` es otro, recién creado. Por eso las casillas se guardan como texto.
```

```exercise
id: js10-completa-vecinas
type: complete
title: Las calles abiertas alrededor
prompt: |
  Completa `vecinasLibres(plano, x, y)`: devuelve las vecinas (arriba, abajo, izquierda, derecha) que existen y no son `"#"`, como arrays `[x, y]`, en el orden de `PASOS`.
visual:
  figure:
    input: { label: "vecinasLibres(plano, 1, 0)", grid: [".o#", ".#."], path: ["1,0"] }
    arrow: "derecha es #, abajo es #, arriba no existe"
    output: { label: devuelve, value: "[[0, 0]]" }
starter: |
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function vecinasLibres(plano, x, y) {
    const libres = [];
    for (const [dx, dy] of ___) {
      const casilla = plano[y + dy]?.[___];
      if (casilla !== undefined && casilla !== ___) {
        libres.push([x + dx, y + dy]);
      }
    }
    return libres;
  }

  console.log(vecinasLibres([".o#", ".#."], 1, 0));
solution: |
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function vecinasLibres(plano, x, y) {
    const libres = [];
    for (const [dx, dy] of PASOS) {
      const casilla = plano[y + dy]?.[x + dx];
      if (casilla !== undefined && casilla !== "#") {
        libres.push([x + dx, y + dy]);
      }
    }
    return libres;
  }

  console.log(vecinasLibres([".o#", ".#."], 1, 0));
hints:
  - "La fila es `y + dy` y la columna es `x + dx`."
  - "`undefined` es fuera del mapa; además, hay que descartar las paredes."
tests:
  - name: en el borde de arriba
    run: 'vecinasLibres([".o#", ".#."], 1, 0)'
    equals: [[0, 0]]
  - name: en el centro de un plano abierto
    run: 'vecinasLibres(["...", "...", "..."], 1, 1)'
    equals: [[2, 1], [0, 1], [1, 2], [1, 0]]
  - name: encerrada
    run: 'vecinasLibres(["#.#", "#.#"], 1, 1)'
    equals: [[1, 0]]
```

```exercise
id: js10-arregla-pila
type: fix
title: La ruta que salía larguísima
prompt: |
  Esta función debía dar los pasos de la ruta más corta, pero en un plano abierto de 3 × 3, de `"0,0"` a `"2,0"`, dice 6 en vez de 2. Hay **una** palabra equivocada.
visual:
  figure:
    panes:
      - { label: "lo que hace ahora: 6 pasos", grid: ["A.H", "...", "..."], path: ["0,0", "0,1", "0,2", "1,2", "2,2", "2,1", "2,0"] }
      - { label: "lo que debe hacer: 2 pasos", grid: ["A.H", "...", "..."], path: ["0,0", "1,0", "2,0"] }
starter: |
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function distancia(plano, inicio, meta) {
    const cola = [inicio];
    const pasos = new Map([[inicio, 0]]);
    while (cola.length > 0) {
      const actual = cola.pop();
      if (actual === meta) {
        return pasos.get(actual);
      }
      const [x, y] = actual.split(",").map(Number);
      for (const [dx, dy] of PASOS) {
        const vecina = `${x + dx},${y + dy}`;
        if (plano[y + dy]?.[x + dx] === "." && !pasos.has(vecina)) {
          pasos.set(vecina, pasos.get(actual) + 1);
          cola.push(vecina);
        }
      }
    }
    return -1;
  }

  console.log(distancia(["...", "...", "..."], "0,0", "2,0"));
solution: |
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function distancia(plano, inicio, meta) {
    const cola = [inicio];
    const pasos = new Map([[inicio, 0]]);
    while (cola.length > 0) {
      const actual = cola.shift();
      if (actual === meta) {
        return pasos.get(actual);
      }
      const [x, y] = actual.split(",").map(Number);
      for (const [dx, dy] of PASOS) {
        const vecina = `${x + dx},${y + dy}`;
        if (plano[y + dy]?.[x + dx] === "." && !pasos.has(vecina)) {
          pasos.set(vecina, pasos.get(actual) + 1);
          cola.push(vecina);
        }
      }
    }
    return -1;
  }

  console.log(distancia(["...", "...", "..."], "0,0", "2,0"));
hints:
  - "¿De qué lado de la lista sale la siguiente casilla? Una cola atiende primero a la que llegó primero."
tests:
  - name: plano abierto, 2 pasos
    run: 'distancia(["...", "...", "..."], "0,0", "2,0")'
    equals: 2
  - name: con una pared en medio
    run: 'distancia(["....", ".##.", "...."], "0,0", "3,2")'
    equals: 5
  - name: sin salida
    run: 'distancia([".#.", "##."], "0,0", "2,1")'
    equals: -1
```

```exercise
id: js10-escribe-reconstruir
type: write
title: De la meta hacia atrás
prompt: |
  Escribe `reconstruir(padre, meta)`, que devuelve la ruta desde el inicio hasta `meta` como un array de claves `"x,y"`.

  `padre` es el `Map` que dejó una búsqueda: a cada casilla le asigna la casilla de la que vino, y al inicio le asigna `null`. Empieza en `meta`, sigue de padre en padre hasta llegar a `null` y da la vuelta a la lista.
visual:
  figure:
    input: { label: padre, table: { head: ["casilla", "vino de"], rows: [["\"0,0\"", "null"], ["\"1,0\"", "\"0,0\""], ["\"1,1\"", "\"1,0\""], ["\"1,2\"", "\"1,1\""]] } }
    arrow: "desde \"1,2\" hacia atrás, y al revés"
    output: { label: "reconstruir(padre, \"1,2\")", cells: ["\"0,0\"", "\"1,0\"", "\"1,1\"", "\"1,2\""] }
starter: |
  function reconstruir(padre, meta) {
  }

  const padre = new Map([["0,0", null], ["1,0", "0,0"], ["1,1", "1,0"], ["1,2", "1,1"]]);
  console.log(reconstruir(padre, "1,2"));
solution: |
  function reconstruir(padre, meta) {
    const ruta = [];
    let casilla = meta;
    while (casilla !== null) {
      ruta.push(casilla);
      casilla = padre.get(casilla);
    }
    return ruta.reverse();
  }

  const padre = new Map([["0,0", null], ["1,0", "0,0"], ["1,1", "1,0"], ["1,2", "1,1"]]);
  console.log(reconstruir(padre, "1,2"));
hints:
  - "Un `while (casilla !== null)` que agregue la casilla y pase a `padre.get(casilla)`."
  - "La lista sale de la meta al inicio: `reverse()` la da vuelta."
tests:
  - name: una ruta de 4 casillas
    run: 'reconstruir(new Map([["0,0", null], ["1,0", "0,0"], ["1,1", "1,0"], ["1,2", "1,1"]]), "1,2")'
    equals: ["0,0", "1,0", "1,1", "1,2"]
  - name: la meta es el inicio
    run: 'reconstruir(new Map([["4,4", null]]), "4,4")'
    equals: ["4,4"]
  - name: solo sigue el camino de la meta, no otras ramas
    run: 'reconstruir(new Map([["0,0", null], ["1,0", "0,0"], ["0,1", "0,0"], ["0,2", "0,1"]]), "0,2")'
    equals: ["0,0", "0,1", "0,2"]
```

```exercise
id: js10-escribe-onda
type: write
title: Hasta dónde llega la onda
prompt: |
  Marca en el mapa todas las casillas a las que Chasqui puede llegar desde donde está, sin moverse: `robot.marcar(lista)` con una lista de `[x, y]`.

  `robot.mapa()` da el plano (`"#"` es casa o valla) y `robot.posicion` es `{ x, y }`. Algunas calles quedaron encerradas por la procesión: esas no se marcan. Se prueba en dos planos.
visual:
  figure:
    input: { label: "el primer plano", grid: ["#########", "#R..#...#", "#.#.#.#.#", "#...#...#", "#########"] }
    arrow: BFS desde R
    output: { label: "8 casillas marcadas; la derecha está cerrada", grid: ["#########", "#R..#...#", "#.#.#.#.#", "#...#...#", "#########"], marks: ["1,1", "2,1", "3,1", "1,2", "3,2", "1,3", "2,3", "3,3"] }
starter: |
  const mapa = robot.mapa();
  const { x, y } = robot.posicion;
  console.log("Chasqui está en", x, y);
solution: |
  const mapa = robot.mapa();
  const { x, y } = robot.posicion;
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const cola = [[x, y]];
  const vistos = new Set([`${x},${y}`]);
  while (cola.length > 0) {
    const [cx, cy] = cola.shift();
    for (const [dx, dy] of PASOS) {
      const nx = cx + dx;
      const ny = cy + dy;
      const clave = `${nx},${ny}`;
      if (mapa[ny]?.[nx] !== undefined && mapa[ny][nx] !== "#" && !vistos.has(clave)) {
        vistos.add(clave);
        cola.push([nx, ny]);
      }
    }
  }
  robot.marcar([...vistos].map((k) => k.split(",").map(Number)));
hints:
  - "Es la onda de *Lo mínimo*, empezando en `robot.posicion`, con `\"#\"` como lo único que no se pisa."
  - "Al final, convierte cada clave `\"x,y\"` de vuelta a `[x, y]` y márcalas todas de una vez."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, map, path]
  map: |
    #########
    #R..#...#
    #.#.#.#.#
    #...#...#
    #########
scenarios:
  - tests:
      - name: marca las 8 casillas alcanzables
        state: 'w.marks.length === 8 && w.marks.includes("1,1") && !w.marks.includes("5,1")'
        msg: Deben quedar marcadas las 8 casillas de la izquierda (incluida la de Chasqui), y ninguna de la derecha.
  - map: |
      #######
      #R.#..#
      ##.#.##
      #..#..#
      #######
    tests:
      - name: marca las 5 casillas alcanzables
        state: 'w.marks.length === 5 && w.marks.includes("1,3") && !w.marks.includes("4,1")'
        msg: Deben quedar marcadas las 5 casillas de la izquierda, y ninguna de la derecha.
tests:
  - name: usa un Set
    source: 'new\s+Set\b'
```

## El caso

```exercise
id: js10-caso-ambulancias
type: case
title: La ambulancia que mintió
prompt: |
  Calcula cuántas cuadras le toma de verdad a cada ambulancia llegar hasta el paciente y compáralo con lo que dijo por radio.

  Un señor se desmayó en plena procesión (`+` en el plano). La central preguntó por radio a las seis ambulancias robot cuántas cuadras les faltaban, y mandó a la que dijo estar más cerca. Llegó tardísimo. Las calles cerradas (`#`) no se pueden cruzar, y una ambulancia avanza una casilla por cuadra, sin diagonales. Todas dijeron la verdad menos una, que calculó "a vuelo de pájaro", como si las vallas no existieran. ¿Cuál?

  Imprime una línea por ambulancia con su nombre y las cuadras reales al final: `Gaspar: 25`. Una pista: una sola búsqueda **desde el paciente** te da la distancia a todas.
visual:
  - figure:
      title: El plano del Centro (+ el paciente; letras, las ambulancias)
      panes:
        - grid: ["G.............T", ".#.#.###.#.#.#.", "...#R..........", ".#.#.#.#.###.#.", "##.#######.####", ".#...#.....#..W", ".#.#.#.+.#.#.#.", "F#.#.#####.#.#.", ".#.............", ".#.###.#.#.#.#.", "............C.."]
          path: ["7,6"]
  - board:
      for: js10-caso-ambulancias
      title: Lo que dijo cada ambulancia
      task: Calcula las cuadras reales de cada una y compáralas con lo que dijo.
      cards:
        - { name: Gaspar, kind: robot, role: "Dijo 25 cuadras", clue: { find: "Gaspar", says: 25, saysLabel: "Dijo" } }
        - { name: Tomasa, kind: robot, role: "Dijo 35 cuadras", clue: { find: "Tomasa", says: 35, saysLabel: "Dijo" } }
        - { name: Ruperto, kind: robot, role: "Dijo 27 cuadras", clue: { find: "Ruperto", says: 27, saysLabel: "Dijo" } }
        - { name: Clotilde, kind: robot, role: "Dijo 11 cuadras", clue: { find: "Clotilde", says: 11, saysLabel: "Dijo" } }
        - { name: Fermín, kind: robot, role: "Dijo 22 cuadras", clue: { find: "Fermín", says: 22, saysLabel: "Dijo" } }
        - { name: Wilmer, kind: robot, role: "Dijo 8 cuadras", culprit: true, clue: { find: "Wilmer", says: 8, saysLabel: "Dijo" } }
      caption: "**Cuadra**: dijo la verdad. Si no cuadra, la central mandó a quien no debía."
starter: |
  const plano = [
    "...............",
    ".#.#.###.#.#.#.",
    "...#...........",
    ".#.#.#.#.###.#.",
    "##.#######.####",
    ".#...#.....#...",
    ".#.#.#.+.#.#.#.",
    ".#.#.#####.#.#.",
    ".#.............",
    ".#.###.#.#.#.#.",
    "...............",
  ];

  const ambulancias = [
    { nombre: "Gaspar", x: 0, y: 0, dijo: 25 },
    { nombre: "Tomasa", x: 14, y: 0, dijo: 35 },
    { nombre: "Ruperto", x: 4, y: 2, dijo: 27 },
    { nombre: "Clotilde", x: 12, y: 10, dijo: 11 },
    { nombre: "Fermín", x: 0, y: 7, dijo: 22 },
    { nombre: "Wilmer", x: 14, y: 5, dijo: 8 },
  ];

  // El paciente está en la casilla "+":
  const fila = plano.findIndex((f) => f.includes("+"));
  console.log("Paciente en", plano[fila].indexOf("+"), fila);

  // TODO: haz una búsqueda (BFS) desde el paciente que guarde en un Map
  // los pasos hasta cada casilla. Imprime una línea por ambulancia: Gaspar: 25
solution: |
  const plano = [
    "...............",
    ".#.#.###.#.#.#.",
    "...#...........",
    ".#.#.#.#.###.#.",
    "##.#######.####",
    ".#...#.....#...",
    ".#.#.#.+.#.#.#.",
    ".#.#.#####.#.#.",
    ".#.............",
    ".#.###.#.#.#.#.",
    "...............",
  ];

  const ambulancias = [
    { nombre: "Gaspar", x: 0, y: 0, dijo: 25 },
    { nombre: "Tomasa", x: 14, y: 0, dijo: 35 },
    { nombre: "Ruperto", x: 4, y: 2, dijo: 27 },
    { nombre: "Clotilde", x: 12, y: 10, dijo: 11 },
    { nombre: "Fermín", x: 0, y: 7, dijo: 22 },
    { nombre: "Wilmer", x: 14, y: 5, dijo: 8 },
  ];

  const fila = plano.findIndex((f) => f.includes("+"));
  const inicio = [plano[fila].indexOf("+"), fila];

  const pasos = new Map([[inicio.join(","), 0]]);
  const cola = [inicio];
  for (let i = 0; i < cola.length; i++) {
    const [x, y] = cola[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const clave = `${x + dx},${y + dy}`;
      const casilla = plano[y + dy]?.[x + dx];
      if (casilla !== undefined && casilla !== "#" && !pasos.has(clave)) {
        pasos.set(clave, pasos.get(`${x},${y}`) + 1);
        cola.push([x + dx, y + dy]);
      }
    }
  }

  for (const { nombre, x, y, dijo } of ambulancias) {
    const reales = pasos.get(`${x},${y}`);
    console.log(`${nombre}: dijo ${dijo}, ${reales === dijo ? "verdad" : "MINTIÓ"}, reales ${reales}`);
  }
answer: Wilmer
answerLabel: ¿Qué ambulancia mintió?
reveal: |
  Wilmer dijo 8 cuadras: es la distancia a vuelo de pájaro desde la esquina derecha, pero con las vallas de la procesión necesita 14. Por eso la central lo mandó a él y no a Clotilde, que de verdad estaba a 11.
hints:
  - "Empieza la búsqueda en el `+` y guarda en un `Map` los pasos: la vecina tiene uno más que la casilla de la que salió."
  - "Cuando la cola se vacía, `pasos.get(\"14,5\")` ya es la distancia real de Wilmer, y así con todas."
```

## El juez

```exercise
id: js10-juez-pasos
type: judge
mode: function
function: pasosMinimos
title: La ruta más corta al hospital
prompt: |
  Escribe `pasosMinimos(plano)`, que devuelve cuántos pasos tiene la ruta más corta de `A` a `H`, o `-1` si no hay ninguna.

  La central de emergencias recibe planos del Centro con la ambulancia (`A`), el hospital (`H`), calles libres (`.`) y calles cerradas (`#`). Un paso es moverse a una casilla vecina: arriba, abajo, izquierda o derecha.

  **Entrada:** `plano`, un array de textos del mismo largo, con exactamente una `A` y una `H`.

  **Salida:** el número mínimo de pasos, o `-1`.

  **Restricciones:** de 1 a 60 filas · de 1 a 60 columnas.
visual:
  figure:
    title: El ejemplo 1
    input: { label: plano, grid: ["A.#.", ".##.", "...H"] }
    arrow: BFS desde A
    output: { label: "devuelve 5", grid: ["A.#.", ".##.", "...H"], path: ["0,0", "0,1", "0,2", "1,2", "2,2", "3,2"] }
    steps:
      - "La pared obliga a bajar por la izquierda: 2 pasos hacia abajo y 3 a la derecha."
starter: |
  function pasosMinimos(plano) {
    return 0;
  }
solution: |
  function pasosMinimos(plano) {
    let inicio;
    for (let y = 0; y < plano.length; y++) {
      const x = plano[y].indexOf("A");
      if (x !== -1) {
        inicio = [x, y];
      }
    }
    const pasos = new Map([[inicio.join(","), 0]]);
    const cola = [inicio];
    for (let i = 0; i < cola.length; i++) {
      const [x, y] = cola[i];
      if (plano[y][x] === "H") {
        return pasos.get(`${x},${y}`);
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const clave = `${x + dx},${y + dy}`;
        const casilla = plano[y + dy]?.[x + dx];
        if (casilla !== undefined && casilla !== "#" && !pasos.has(clave)) {
          pasos.set(clave, pasos.get(`${x},${y}`) + 1);
          cola.push([x + dx, y + dy]);
        }
      }
    }
    return -1;
  }
hints:
  - "Primero busca la `A` recorriendo las filas con `indexOf`."
  - "Guarda los pasos en un `Map`; cuando saques la `H` de la cola, ya tienes la respuesta. Si la cola se vacía sin verla, es `-1`."
samples:
  - args: [["A.#.", ".##.", "...H"]]
    returns: 5
  - args: [["A#H"]]
    returns: -1
    note: La única calle está cerrada.
  - args: [["AH"]]
    returns: 1
edge:
  - args: [["H..", "...", "..A"]]
    tag: cuando la A está abajo a la derecha
  - args: [["A.#..", "..#..", "###..", "....H"]]
    tag: cuando la A está encerrada
  - args: [["A", ".", ".", "#", "H"]]
    tag: con una sola columna cortada
  - args: [["A....", "####.", "H....", ".####", "....."]]
    tag: con un camino en zigzag
  - args: [["A...#....", ".##...##.", ".#..#..#.", "...##.#H.", ".#....#.."]]
    tag: cuando la ruta más corta no va directo
random:
  count: 40
  seed: 1010
  generate: |
    const alto = rng.int(1, 60), ancho = rng.int(2, 60);
    let filas;
    if (rng.next() < 0.3 && alto >= 3) {
      filas = Array.from({ length: alto }, (_, y) => {
        if (y % 2 === 0) return ".".repeat(ancho);
        const hueco = (y % 4 === 1) ? ancho - 1 : 0;
        return Array.from({ length: ancho }, (_, x) => (x === hueco ? "." : "#")).join("");
      });
    } else {
      const p = rng.int(0, 40) / 100;
      filas = Array.from({ length: alto }, () => Array.from({ length: ancho }, () => (rng.next() < p ? "#" : ".")).join(""));
    }
    const celdas = filas.map((f) => [...f]);
    const libre = () => {
      for (;;) {
        const x = rng.int(0, ancho - 1), y = rng.int(0, alto - 1);
        if (celdas[y][x] === ".") return [x, y];
        celdas[y][x] = ".";
      }
    };
    const [ax, ay] = libre();
    celdas[ay][ax] = "A";
    const [hx, hy] = libre();
    celdas[hy][hx] = "H";
    return [celdas.map((f) => f.join(""))];
wrong:
  - |
    function pasosMinimos(plano) {
      let inicio;
      plano.forEach((f, y) => { if (f.includes("A")) inicio = [f.indexOf("A"), y]; });
      const pasos = new Map([[inicio.join(","), 0]]);
      const pila = [inicio];
      while (pila.length) {
        const [x, y] = pila.pop();
        if (plano[y][x] === "H") return pasos.get(`${x},${y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`, c = plano[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !pasos.has(k)) { pasos.set(k, pasos.get(`${x},${y}`) + 1); pila.push([x + dx, y + dy]); }
        }
      }
      return -1;
    }
  - |
    function pasosMinimos(plano) {
      let inicio;
      plano.forEach((f, y) => { if (f.includes("A")) inicio = [f.indexOf("A"), y]; });
      const pasos = new Map([[inicio.join(","), 1]]);
      const cola = [inicio];
      for (let i = 0; i < cola.length; i++) {
        const [x, y] = cola[i];
        if (plano[y][x] === "H") return pasos.get(`${x},${y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`, c = plano[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !pasos.has(k)) { pasos.set(k, pasos.get(`${x},${y}`) + 1); cola.push([x + dx, y + dy]); }
        }
      }
      return -1;
    }
  - |
    function pasosMinimos(plano) {
      let inicio;
      plano.forEach((f, y) => { if (f.includes("A")) inicio = [f.indexOf("A"), y]; });
      const pasos = new Map([[inicio.join(","), 0]]);
      const cola = [inicio];
      for (let i = 0; i < cola.length; i++) {
        const [x, y] = cola[i];
        if (plano[y][x] === "H") return pasos.get(`${x},${y}`);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const k = `${x + dx},${y + dy}`, c = plano[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !pasos.has(k)) { pasos.set(k, pasos.get(`${x},${y}`) + 1); cola.push([x + dx, y + dy]); }
        }
      }
      return -1;
    }
  - |
    function pasosMinimos(plano) {
      let inicio;
      plano.forEach((f, y) => { if (f.includes("A")) inicio = [f.indexOf("A"), y]; });
      const pasos = new Map([[inicio.join(","), 0]]);
      const cola = [inicio];
      for (let i = 0; i < cola.length; i++) {
        const [x, y] = cola[i];
        if (plano[y][x] === "H") return pasos.get(`${x},${y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`, c = plano[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !pasos.has(k)) { pasos.set(k, pasos.get(`${x},${y}`) + 1); cola.push([x + dx, y + dy]); }
        }
      }
      return 0;
    }
```

## Misión final

```exercise
id: js10-mision-insulina
type: mission
title: La insulina llega a tiempo
prompt: |
  Busca la ruta más corta hasta la emergencia (D), haz que Chasqui la recorra con `robot.seguirRuta(ruta)` y entrega `"insulina"` al llegar.

  La batería alcanza **exactamente** para la ruta más corta: un paso de más y Chasqui se queda en la calle. Tienes:

  - `robot.mapa()`: el plano; `"#"` es casa o calle cerrada, `"D"` es la emergencia;
  - `robot.posicion`: dónde está Chasqui, `{ x, y }`;
  - `robot.seguirRuta(ruta)`: recorre una lista de casillas vecinas `[x, y]`, girando solo (la primera puede ser la casilla actual);
  - `robot.marcar(casillas)`, si quieres ver en el mapa lo que exploró tu búsqueda.

  El plano cambia en cada prueba.
visual:
  figure:
    title: La primera prueba
    input: { label: "plano (batería: 18)", grid: ["#############", "#R....#.....#", "#.###.#.###.#", "#.#.....#...#", "#.#.###.#.#.#", "#...#...#.#D#", "###.#.###.#.#", "#.....#.....#", "#############"] }
    arrow: BFS, padres, ruta al revés
    output: { label: "una ruta de 18 pasos", grid: ["#############", "#R....#.....#", "#.###.#.###.#", "#.#.....#...#", "#.#.###.#.#.#", "#...#...#.#D#", "###.#.###.#.#", "#.....#.....#", "#############"], path: ["1,1", "2,1", "3,1", "4,1", "5,1", "5,2", "5,3", "6,3", "7,3", "7,2", "7,1", "8,1", "9,1", "10,1", "11,1", "11,2", "11,3", "11,4", "11,5"] }
starter: |
  const mapa = robot.mapa();
  const { x, y } = robot.posicion;
  console.log("Salgo de", x, y, "con batería", robot.bateria);
  // TODO: BFS desde (x, y) hasta la casilla "D", guardando de dónde vino cada casilla.
  // Luego reconstruye la ruta, síguela y entrega la insulina.
solution: |
  const mapa = robot.mapa();
  const { x, y } = robot.posicion;
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const inicio = `${x},${y}`;
  const padre = new Map([[inicio, null]]);
  const cola = [inicio];
  let meta = null;
  for (let i = 0; i < cola.length; i++) {
    const actual = cola[i];
    const [cx, cy] = actual.split(",").map(Number);
    if (mapa[cy][cx] === "D") {
      meta = actual;
      break;
    }
    for (const [dx, dy] of PASOS) {
      const vecina = `${cx + dx},${cy + dy}`;
      const casilla = mapa[cy + dy]?.[cx + dx];
      if (casilla !== undefined && casilla !== "#" && !padre.has(vecina)) {
        padre.set(vecina, actual);
        cola.push(vecina);
      }
    }
  }
  robot.marcar([...padre.keys()].map((k) => k.split(",").map(Number)));

  const ruta = [];
  for (let c = meta; c !== null; c = padre.get(c)) {
    ruta.push(c.split(",").map(Number));
  }
  robot.seguirRuta(ruta.reverse());
  robot.entregar("insulina");
hints:
  - "Es `rutaMasCorta` de *Lo mínimo*, buscando la casilla `\"D\"` en vez de una meta fija."
  - "`seguirRuta` quiere arrays `[x, y]`: convierte cada clave con `clave.split(\",\").map(Number)`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, deliver, map, path]
  battery: 18
  map: |
    #############
    #R....#.....#
    #.###.#.###.#
    #.#.....#...#
    #.#.###.#.#.#
    #...#...#.#D#
    ###.#.###.#.#
    #.....#.....#
    #############
scenarios:
  - {}
  - map: |
      ###########
      #R........#
      #.#######.#
      #.#.....#.#
      #.#.###.#.#
      #...#D..#.#
      #####.###.#
      #.........#
      ###########
    world: { battery: 16 }
  - map: |
      #########
      #...#..D#
      #.#.#.#.#
      #R#...#.#
      #.#####.#
      #.......#
      #########
    world: { dir: N, battery: 12 }
tests:
  - name: llega a la emergencia
    state: w.atGoal
    msg: Chasqui no llegó a la D. Si se quedó sin batería, la ruta no era la más corta.
  - name: entrega la insulina
    state: 'w.delivered.length === 1 && w.delivered[0] === "insulina"'
  - name: sin chocar
    state: '!w.crashed'
  - name: busca con un Map o un Set
    source: 'new\s+(Map|Set)\b'
    msg: Guarda lo explorado en un Map (o un Set) para no repetir casillas.
```

## Reto experto

```exercise
id: js10-reto-farmacia
type: challenge
title: Pasar por la farmacia
prompt: |
  Esta vez la ambulancia tiene que recoger el medicamento en la farmacia (`F`) antes de ir al hospital (`H`). Escribe `conFarmacia(plano)`, que devuelve los pasos de la ruta más corta `A → F → H`, o `-1` si alguna de las dos partes es imposible. Puede pasar por cualquier casilla más de una vez.
starter: |
  function conFarmacia(plano) {
    return -1;
  }

  console.log(conFarmacia(["A.F", "...", "H.."]));
solution: |
  function buscar(plano, letra) {
    for (let y = 0; y < plano.length; y++) {
      const x = plano[y].indexOf(letra);
      if (x !== -1) return [x, y];
    }
  }

  function distancia(plano, desde, hasta) {
    const pasos = new Map([[desde.join(","), 0]]);
    const cola = [desde];
    for (let i = 0; i < cola.length; i++) {
      const [x, y] = cola[i];
      if (x === hasta[0] && y === hasta[1]) return pasos.get(`${x},${y}`);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const clave = `${x + dx},${y + dy}`;
        const casilla = plano[y + dy]?.[x + dx];
        if (casilla !== undefined && casilla !== "#" && !pasos.has(clave)) {
          pasos.set(clave, pasos.get(`${x},${y}`) + 1);
          cola.push([x + dx, y + dy]);
        }
      }
    }
    return -1;
  }

  function conFarmacia(plano) {
    const [a, f, h] = ["A", "F", "H"].map((letra) => buscar(plano, letra));
    const ida = distancia(plano, a, f);
    const vuelta = distancia(plano, f, h);
    return ida === -1 || vuelta === -1 ? -1 : ida + vuelta;
  }

  console.log(conFarmacia(["A.F", "...", "H.."]));
hints:
  - Son dos búsquedas independientes. Escribe `distancia(plano, desde, hasta)` una vez y úsala dos veces.
tests:
  - name: ida y vuelta en un plano abierto
    run: 'conFarmacia(["A.F", "...", "H.."])'
    equals: 6
  - name: la farmacia está en el camino
    run: 'conFarmacia(["A.F.H"])'
    equals: 4
  - name: farmacia encerrada
    run: 'conFarmacia(["A.#F", "..##", "H..."])'
    equals: -1
  - name: con un rodeo
    run: 'conFarmacia(["A#F", ".#.", "..H"])'
    equals: 8
```
