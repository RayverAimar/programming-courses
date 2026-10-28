# Sesión 13 — Recursión

## El encargo

Tingo María, en la selva de Huánuco. A la entrada de la Cueva de las Lechuzas el aire huele a guano y desde adentro llega un chillido que pone los pelos de punta: son los guácharos, unas aves que viven a oscuras y que todo el mundo llama lechuzas aunque no lo sean. La bióloga Maritza Rengifo tiene que contar sus nidos antes de la temporada de lluvias, y su presupuesto alcanza para una sola semana.

El problema es la cueva. Cada galería se abre en otras galerías, que se abren en otras, y nadie sabe cuántos niveles hay. Un bucle necesita saber cuántas vueltas dar; aquí no se sabe. Pero la tarea se puede decir en una línea: **explorar una galería es contar sus nidos y explorar cada una de sus salidas**. Una función que se usa a sí misma para resolver un pedazo más chico del problema se llama **recursiva**.

```escena
theme: mina
level: 4
dir: E
api: [move, map, mark, report]
items: { n: nido }
caption: La primera cámara de la cueva. Chasqui la recorre con su lámpara de casilla en casilla, sin cruzar la roca, y marca lo que ya revisó. Cada **n** es un nido.
map: |
  ##########
  #..n#..n.#
  #.R.#.n..#
  #n..######
  ##..#..n.#
  #n..#n...#
  ##########
program: |
  const mapa = robot.mapa();
  const vistas = new Set();
  function explorar(x, y) {
    if (mapa[y][x] === "#" || vistas.has(`${x},${y}`)) return;
    vistas.add(`${x},${y}`);
    robot.marcar([x, y]);
    explorar(x + 1, y);
    explorar(x - 1, y);
    explorar(x, y + 1);
    explorar(x, y - 1);
  }
  explorar(2, 2);
```

## Lo mínimo

Una función **recursiva** se llama a sí misma con un problema más chico, hasta llegar a uno tan chico que se responde sin llamar a nadie: el **caso base**. Cada llamada espera a que termine la que hizo, en la **pila de llamadas**.

```js run
function nidos(galeria) {
  let total = galeria.nidos;
  for (const salida of galeria.salidas) {
    total += nidos(salida);
  }
  return total;
}
const entrada = { nidos: 2, salidas: [{ nidos: 3, salidas: [] }, { nidos: 1, salidas: [{ nidos: 4, salidas: [] }] }] };
console.log(nidos(entrada));
```

Aquí el caso base no se ve, pero está: una galería sin salidas no entra al `for` y devuelve sus nidos. Mira la pila en una versión más simple. Bajar desde el nivel 3 hasta el fondo: en cada nivel hay tantos nidos como su número.

Esa cueva, dibujada como un árbol, y la pila mientras `nidos` la recorre:

```figura
title: La cueva de nidos, como un árbol
panes:
  - { label: "Cada galería, con sus nidos entre paréntesis", text: "entrada (2)\n├─ A (3)\n└─ B (1)\n   └─ C (4)" }
caption: "Cada galería tiene sus nidos y, de ella, salen otras galerías. Las que no tienen salidas (A y C) son el caso base."
```

```anima
title: La pila baja por una rama y los resultados suben
code: |
  function nidos(galeria) {
    let total = galeria.nidos;
    for (const salida of galeria.salidas) {
      total += nidos(salida);
    }
    return total;
  }
steps:
  - { line: 2, vars: { total: 2 }, stack: [{ name: nidos, args: 'galeria = entrada' }], note: "Entra la galería `entrada`: 2 nidos propios y dos salidas, A y B." }
  - { line: 4, vars: { total: 3 }, stack: [{ name: nidos, args: 'galeria = entrada' }, { name: nidos, args: 'galeria = A' }], note: "Primera salida, A. La pila crece: `entrada` espera a que A le conteste." }
  - { line: 6, vars: { total: 3 }, stack: [{ name: nidos, args: 'galeria = entrada' }, { name: nidos, args: 'galeria = A', ret: "3" }], note: "A no tiene salidas: es un caso base. Devuelve 3 y su llamada se cierra." }
  - { line: 4, vars: { total: 1 }, stack: [{ name: nidos, args: 'galeria = entrada' }, { name: nidos, args: 'galeria = B' }], note: "De vuelta en `entrada`, su total ya es 2 + 3 = 5. Segunda salida, B: otra llamada, y la de A ya no está." }
  - { line: 4, vars: { total: 4 }, stack: [{ name: nidos, args: 'galeria = entrada' }, { name: nidos, args: 'galeria = B' }, { name: nidos, args: 'galeria = C' }], note: "B tiene una salida, C. La pila crece de nuevo, una rama más abajo." }
  - { line: 6, vars: { total: 4 }, stack: [{ name: nidos, args: 'galeria = entrada' }, { name: nidos, args: 'galeria = B' }, { name: nidos, args: 'galeria = C', ret: "4" }], note: "C tampoco tiene salidas: devuelve 4." }
  - { line: 6, vars: { total: 5 }, stack: [{ name: nidos, args: 'galeria = entrada' }, { name: nidos, args: 'galeria = B', ret: "5" }], note: "B suma lo suyo y lo que le dio C: 1 + 4 = 5, y devuelve 5." }
  - { line: 6, vars: { total: 10 }, stack: [{ name: nidos, args: 'galeria = entrada', ret: "10" }], note: "`entrada` suma sus 2 nidos más lo que devolvieron A (3) y B (5): 2 + 3 + 5 = 10. Cada galería se visita **una vez**, de una rama completa antes de pasar a la siguiente." }
```

```anima
title: La pila crece hasta el caso base y luego se desarma
code: |
  function bajar(nivel) {
    if (nivel === 0) {
      return 0;
    }
    const debajo = bajar(nivel - 1);
    return debajo + nivel;
  }
  const total = bajar(3);
  console.log(total);
notes:
  2: "¿Ya es el fondo? Ese es el caso base."
  3: "El fondo responde 0 sin llamar a nadie: aquí la pila deja de crecer."
  5: "Para responder, este nivel necesita lo que hay debajo: llama y espera."
  6: "Ya llegó la respuesta de abajo: le suma lo suyo y responde hacia arriba."
```

Con la misma idea se **rellena** una región de un mapa: pinto mi casilla y le pido lo mismo a mis cuatro vecinas. El caso base es "es roca o ya la pinté".

```anima
title: Rellenar una cámara, casilla por casilla
code: |
  const vistas = new Set();
  function llenar(x, y) {
    if (mapa[y][x] === "#" || vistas.has(`${x},${y}`)) {
      return 0;
    }
    vistas.add(`${x},${y}`);
    return 1 + llenar(x + 1, y) + llenar(x - 1, y) + llenar(x, y + 1) + llenar(x, y - 1);
  }
  console.log(llenar(1, 1));
globals:
  mapa: ["######", "#...##", "#.#..#", "######"]
grid: { map: ["######", "#...##", "#.#..#", "######"], visited: vistas }
show: [x, y]
speed: 500
notes:
  4: "Roca o casilla ya pintada: devuelve 0 y no sigue."
  6: "Pinta esta casilla y pregunta a las cuatro vecinas."
```

```anima
title: Sin caso base, la pila llega al techo
code: |
  function sinFin(n) {
    return sinFin(n + 1);
  }
  sinFin(1);
steps:
  - { line: 2, vars: {}, stack: [{ name: sinFin, args: 'n = 1' }], note: "Cada llamada se apila sobre la anterior y espera a la que hizo." }
  - { line: 2, vars: {}, stack: [{ name: sinFin, args: 'n = 1' }, { name: sinFin, args: 'n = 2' }], note: "Ninguna llega a un caso base: no hay nada que las detenga." }
  - { line: 2, vars: {}, stack: [{ name: sinFin, args: 'n = 1' }, { name: sinFin, args: 'n = 2' }, { name: sinFin, args: 'n = 3' }, { name: sinFin, args: 'n = 4' }], note: "La pila sigue creciendo…" }
  - { line: 2, vars: {}, stack: [{ name: sinFin, args: 'n = 1' }, { name: sinFin, args: 'n = 2' }, { name: sinFin, args: 'n = 3' }, { name: sinFin, args: 'n = 4' }, { name: sinFin, args: 'n = 5' }, { name: sinFin, args: 'n = 6' }], note: "…pero la pila tiene un **techo**." }
  - { line: 4, vars: {}, stack: [], out: "RangeError: Maximum call stack size exceeded", note: "El motor corta todo y lanza el error: la función nunca devolvió nada." }
```

```figura
title: El orden de las llamadas de `llenar(1, 1)`
panes:
  - { label: "Una vecina completa antes de pasar a la siguiente", text: "llenar(1, 1)\n├─ este  (2, 1) → sus cuatro vecinas, y las de ellas…\n├─ oeste (0, 1) → roca: 0\n├─ sur   (1, 2) → casilla libre: sigue\n└─ norte (1, 0) → roca: 0" }
caption: "Hasta que no termina todo lo que sale del este, `llenar` no pregunta por el oeste."
```

- **Caso base**: el caso que se responde directo. Sin él (o si las llamadas nunca llegan a él), la función se llama para siempre y la pila se desborda: *Maximum call stack size exceeded*.
- **Paso recursivo**: la llamada a sí misma con algo **más chico**: un nivel menos, una sub-galería, una casilla vecina que todavía no se pintó.
- **Confía en la llamada**: al escribir `nidos(salida)`, no sigas mentalmente todo el árbol; asume que devuelve lo correcto para esa salida y solo junta los resultados.
- **¿Recursión o bucle?** Todo lo recursivo se puede hacer con un bucle y una pila propia, y un bucle simple se puede escribir recursivo. Usa recursión cuando el problema tiene forma de **árbol** (galerías dentro de galerías, regiones que se ramifican) y un bucle cuando es una **fila** (recorrer una lista). Para miles de niveles, el bucle es más seguro: la pila tiene límite.

> **Trampa común:** un caso base que las llamadas se pueden saltar. `if (metros === 0)` nunca se cumple si bajas de 2 en 2 desde 7: 7, 5, 3, 1, −1… Usa `<=` para que el caso base atrape todo lo que ya terminó.

<!-- legacy: recursion -->

<!-- mdn: recursion functions -->

## Práctica

```exercise
id: js13-predice-baja-sube
type: predict
title: Bajar y subir
prompt: |
  Chasqui anuncia cada nivel al bajar y al volver a subir. ¿Qué imprime?
code: |
  function bajar(nivel) {
    if (nivel === 0) {
      return;
    }
    console.log("baja", nivel);
    bajar(nivel - 1);
    console.log("sube", nivel);
  }
  bajar(2);
options:
  - "baja 2\nbaja 1\nsube 1\nsube 2"
  - "baja 2\nsube 2\nbaja 1\nsube 1"
  - "baja 2\nbaja 1\nsube 2\nsube 1"
  - "baja 2\nbaja 1"
answer: "baja 2\nbaja 1\nsube 1\nsube 2"
explain: |
  `bajar(2)` imprime "baja 2" y llama a `bajar(1)`, que imprime "baja 1" y llama a `bajar(0)`, que vuelve de inmediato. Entonces `bajar(1)` sigue donde se quedó ("sube 1") y termina, y recién ahí `bajar(2)` imprime "sube 2". El último que entró es el primero que sale: eso es una pila.
```

```exercise
id: js13-predice-fondos
type: predict
title: ¿Cuántos fondos ciegos?
prompt: |
  Un fondo ciego es una galería sin salidas. ¿Qué imprime?
code: |
  function fondos(galeria) {
    if (galeria.salidas.length === 0) {
      return 1;
    }
    let total = 0;
    for (const salida of galeria.salidas) {
      total += fondos(salida);
    }
    return total;
  }
  const a1 = { salidas: [] };
  const a2 = { salidas: [] };
  const a = { salidas: [a1, a2] };
  const b = { salidas: [] };
  console.log(fondos({ salidas: [a, b] }));
options:
  - "2"
  - "3"
  - "4"
  - "5"
answer: "3"
explain: |
  La entrada tiene dos salidas, `a` y `b`. `b` no tiene salidas: es un fondo (1). `a` tiene dos, `a1` y `a2`, y cada una es un fondo (1 + 1). Total: 3. Las galerías con salidas no cuentan; solo suman lo de sus salidas.
```

```exercise
id: js13-completa-buscar
type: complete
title: ¿Dónde está el pozo del eco?
prompt: |
  Completa `buscar(galeria, nombre)`: devuelve `true` si esa galería, o cualquiera más adentro, se llama así.
visual:
  figure:
    title: La galería de prueba
    panes:
      - { label: "árbol", table: { head: ["nivel 1", "nivel 2", "nivel 3"], rows: [["Norte", "", ""], ["", "Norte 1", ""], ["", "Norte 2", ""], ["", "", "Pozo del eco"]] } }
      - { label: "buscar(norte, \"Pozo del eco\")", value: "true" }
starter: |
  function buscar(galeria, nombre) {
    if (galeria.nombre === nombre) {
      return ___;
    }
    for (const salida of galeria.salidas) {
      if (buscar(___, nombre)) {
        return true;
      }
    }
    return ___;
  }

  const norte = {
    nombre: "Norte",
    salidas: [
      { nombre: "Norte 1", salidas: [] },
      { nombre: "Norte 2", salidas: [{ nombre: "Pozo del eco", salidas: [] }] },
    ],
  };
  console.log(buscar(norte, "Pozo del eco"), buscar(norte, "Sur"));
solution: |
  function buscar(galeria, nombre) {
    if (galeria.nombre === nombre) {
      return true;
    }
    for (const salida of galeria.salidas) {
      if (buscar(salida, nombre)) {
        return true;
      }
    }
    return false;
  }

  const norte = {
    nombre: "Norte",
    salidas: [
      { nombre: "Norte 1", salidas: [] },
      { nombre: "Norte 2", salidas: [{ nombre: "Pozo del eco", salidas: [] }] },
    ],
  };
  console.log(buscar(norte, "Pozo del eco"), buscar(norte, "Sur"));
hints:
  - "La llamada recursiva busca dentro de cada salida, una por una."
  - Si ninguna salida lo tiene, no está.
tests:
  - name: encuentra el pozo y no encuentra el Sur
    output: true false
  - name: la galería misma cuenta
    expect: 'buscar({ nombre: "Sur", salidas: [] }, "Sur") === true'
```

```exercise
id: js13-arregla-cuerda
type: fix
title: La cuerda que nunca termina
prompt: |
  Para bajar a un pozo, Chasqui necesita tramos de cuerda de 2 metros. `tramos(metros)` debería decir cuántos. Con 8 metros funciona; con 7, el programa se cae con la pila desbordada. Arregla el caso base.
visual:
  figure:
    panes:
      - { table: { head: ["llamada", "tramos(7)", "tramos(5)", "tramos(3)", "tramos(1)", "tramos(-1)", "…"], rows: [["¿metros === 0?", "no", "no", "no", "no", "no", "nunca"]] } }
starter: |
  function tramos(metros) {
    if (metros === 0) {
      return 0;
    }
    return 1 + tramos(metros - 2);
  }

  console.log(tramos(8));
  console.log(tramos(7));
solution: |
  function tramos(metros) {
    if (metros <= 0) {
      return 0;
    }
    return 1 + tramos(metros - 2);
  }

  console.log(tramos(8));
  console.log(tramos(7));
hints:
  - Desde un número impar, restando de 2 en 2 nunca se llega a 0 exacto.
tests:
  - name: 8 metros, 4 tramos; 7 metros, también 4
    output: "4\n4"
  - name: 0 metros, ningún tramo
    expect: tramos(0) === 0
  - name: 1 metro necesita un tramo
    expect: tramos(1) === 1
```

```exercise
id: js13-escribe-profundidad
type: write
title: ¿Qué tan honda es?
prompt: |
  Escribe `profundidad(galeria)`: cuántos niveles tiene, contando la galería misma. Una galería sin salidas tiene profundidad 1; si no, es 1 más la profundidad de su salida **más honda**.
visual:
  figure:
    title: Un ejemplo de profundidad 3
    panes:
      - { label: "árbol", table: { head: ["nivel 1", "nivel 2", "nivel 3"], rows: [["Sur", "", ""], ["", "Sur 1", ""], ["", "", "Sur 1a"], ["", "Sur 2", ""]] } }
      - { label: "profundidad(sur)", value: "3" }
starter: |
  function profundidad(galeria) {
  }

  const sur = {
    salidas: [
      { salidas: [{ salidas: [] }] },
      { salidas: [] },
    ],
  };
  console.log(profundidad(sur));
solution: |
  function profundidad(galeria) {
    let masHonda = 0;
    for (const salida of galeria.salidas) {
      masHonda = Math.max(masHonda, profundidad(salida));
    }
    return 1 + masHonda;
  }

  const sur = {
    salidas: [
      { salidas: [{ salidas: [] }] },
      { salidas: [] },
    ],
  };
  console.log(profundidad(sur));
hints:
  - Empieza con `masHonda = 0`; para cada salida, quédate con el mayor entre lo que tenías y `profundidad(salida)`.
  - Sin salidas, `masHonda` se queda en 0 y devuelves 1. Ese es el caso base.
tests:
  - name: el ejemplo tiene profundidad 3
    run: profundidad(sur)
    equals: 3
  - name: una galería sola tiene profundidad 1
    run: 'profundidad({ salidas: [] })'
    equals: 1
  - name: un pasillo de 5 niveles
    run: 'profundidad({ salidas: [{ salidas: [{ salidas: [{ salidas: [{ salidas: [] }] }] }] }] })'
    equals: 5
  - name: profundidad se llama a sí misma
    source: 'function\s+profundidad\s*\([^)]*\)\s*\{(?:(?!\n\})[\s\S])*\bprofundidad\s*\('
    msg: Usa profundidad dentro de profundidad, una vez por salida.
```

```exercise
id: js13-escribe-lista-nidos
type: write
title: La lista para la bióloga
prompt: |
  Escribe `conNidos(galeria)`: devuelve la lista de **nombres** de las galerías con al menos un nido, en este orden: primero la galería misma, después lo que haya dentro de cada salida, de la primera a la última.
visual:
  figure:
    title: El orden de la lista
    panes:
      - { label: "árbol (nidos)", table: { head: ["nivel 1", "nivel 2", "nivel 3"], rows: [["Este (8)", "", ""], ["", "Este 1 (0)", ""], ["", "Este 2 (6)", ""], ["", "", "Este 2a (3)"]] } }
      - { label: "conNidos(este)", value: "[\"Este\", \"Este 2\", \"Este 2a\"]" }
starter: |
  function conNidos(galeria) {
    return [];
  }

  const este = {
    nombre: "Este", nidos: 8, salidas: [
      { nombre: "Este 1", nidos: 0, salidas: [] },
      { nombre: "Este 2", nidos: 6, salidas: [{ nombre: "Este 2a", nidos: 3, salidas: [] }] },
    ],
  };
  console.log(conNidos(este));
solution: |
  function conNidos(galeria) {
    const lista = galeria.nidos > 0 ? [galeria.nombre] : [];
    for (const salida of galeria.salidas) {
      lista.push(...conNidos(salida));
    }
    return lista;
  }

  const este = {
    nombre: "Este", nidos: 8, salidas: [
      { nombre: "Este 1", nidos: 0, salidas: [] },
      { nombre: "Este 2", nidos: 6, salidas: [{ nombre: "Este 2a", nidos: 3, salidas: [] }] },
    ],
  };
  console.log(conNidos(este));
hints:
  - "Empieza la lista con el nombre de esta galería (si tiene nidos) y agrega lo que devuelve `conNidos` de cada salida."
  - "`lista.push(...otra)` agrega todos los elementos de `otra`, no la lista entera como un solo elemento."
tests:
  - name: el ejemplo
    run: conNidos(este)
    equals: ["Este", "Este 2", "Este 2a"]
  - name: una galería vacía da una lista vacía
    run: 'conNidos({ nombre: "Seca", nidos: 0, salidas: [] })'
    equals: []
  - name: respeta el orden de las salidas
    run: 'conNidos({ nombre: "A", nidos: 0, salidas: [{ nombre: "B", nidos: 1, salidas: [{ nombre: "C", nidos: 2, salidas: [] }] }, { nombre: "D", nidos: 5, salidas: [] }] })'
    equals: ["B", "C", "D"]
```

## El caso

```exercise
id: js13-caso-ramales
type: case
title: El ramal que no se terminó de explorar
prompt: |
  Escribe `nidos(galeria)`, que suma los nidos de una galería y de todo lo que hay dentro, y úsala para contar los nidos de cada ramal.

  Antes de que llegara Chasqui, Maritza mandó a tres asistentes, uno por ramal de la cueva. Cada uno reportó cuántos nidos había en todo su ramal. Uno no llegó hasta el fondo: le dio miedo, o se le acabó la pila de la linterna. ¿Quién?

  Imprime una línea por ramal, con quién lo exploró y el total al final: `Norte (Kevin): 20`. El tablero compara tu número con lo que reportó cada asistente.
visual:
  board:
    for: js13-caso-ramales
    title: Lo que reportó cada asistente
    task: Suma con recursión los nidos de cada ramal, hasta la última galería, y compáralos con los reportes.
    cards:
      - { name: "Kevin", kind: person, role: "Ramal Norte · reportó 20", clue: { find: "Norte", says: 20 } }
      - { name: "Lucía", kind: person, role: "Ramal Sur · reportó 21", culprit: true, clue: { find: "Sur", says: 21 } }
      - { name: "Abel", kind: person, role: "Ramal Este · reportó 18", clue: { find: "Este", says: 18 } }
    caption: "Si sumas solo un nivel de galerías, no cuadra nadie: el ramal sigue hasta donde siga."
starter: |
  const cueva = { nombre: "Entrada", nidos: 0, salidas: [
    { nombre: "Norte", nidos: 4, salidas: [
      { nombre: "Norte 1", nidos: 6, salidas: [] },
      { nombre: "Norte 2", nidos: 2, salidas: [
        { nombre: "Norte 2a", nidos: 5, salidas: [] },
        { nombre: "Norte 2b", nidos: 0, salidas: [
          { nombre: "Pozo del eco", nidos: 3, salidas: [] },
        ] },
      ] },
    ] },
    { nombre: "Sur", nidos: 3, salidas: [
      { nombre: "Sur 1", nidos: 7, salidas: [
        { nombre: "Sur 1a", nidos: 2, salidas: [
          { nombre: "Sur 1a i", nidos: 4, salidas: [
            { nombre: "Cámara del guácharo", nidos: 9, salidas: [] },
          ] },
        ] },
      ] },
      { nombre: "Sur 2", nidos: 5, salidas: [] },
    ] },
    { nombre: "Este", nidos: 8, salidas: [
      { nombre: "Este 1", nidos: 1, salidas: [] },
      { nombre: "Este 2", nidos: 6, salidas: [
        { nombre: "Este 2a", nidos: 3, salidas: [] },
      ] },
      { nombre: "Este 3", nidos: 0, salidas: [] },
    ] },
  ] };

  const asistentes = { Norte: "Kevin", Sur: "Lucía", Este: "Abel" };

  // Los ramales son las salidas de la entrada:
  for (const ramal of cueva.salidas) {
    console.log(ramal.nombre, "tiene", ramal.salidas.length, "salidas");
  }

  // TODO: escribe nidos(galeria): los nidos de esta galería más los de
  // cada una de sus salidas, hasta el fondo.

  // TODO: imprime una línea por ramal, así: Norte (Kevin): 20
solution: |
  const cueva = { nombre: "Entrada", nidos: 0, salidas: [
    { nombre: "Norte", nidos: 4, salidas: [
      { nombre: "Norte 1", nidos: 6, salidas: [] },
      { nombre: "Norte 2", nidos: 2, salidas: [
        { nombre: "Norte 2a", nidos: 5, salidas: [] },
        { nombre: "Norte 2b", nidos: 0, salidas: [
          { nombre: "Pozo del eco", nidos: 3, salidas: [] },
        ] },
      ] },
    ] },
    { nombre: "Sur", nidos: 3, salidas: [
      { nombre: "Sur 1", nidos: 7, salidas: [
        { nombre: "Sur 1a", nidos: 2, salidas: [
          { nombre: "Sur 1a i", nidos: 4, salidas: [
            { nombre: "Cámara del guácharo", nidos: 9, salidas: [] },
          ] },
        ] },
      ] },
      { nombre: "Sur 2", nidos: 5, salidas: [] },
    ] },
    { nombre: "Este", nidos: 8, salidas: [
      { nombre: "Este 1", nidos: 1, salidas: [] },
      { nombre: "Este 2", nidos: 6, salidas: [
        { nombre: "Este 2a", nidos: 3, salidas: [] },
      ] },
      { nombre: "Este 3", nidos: 0, salidas: [] },
    ] },
  ] };

  const asistentes = { Norte: "Kevin", Sur: "Lucía", Este: "Abel" };

  function nidos(galeria) {
    let total = galeria.nidos;
    for (const salida of galeria.salidas) {
      total += nidos(salida);
    }
    return total;
  }

  for (const ramal of cueva.salidas) {
    console.log(`${ramal.nombre} (${asistentes[ramal.nombre]}): ${nidos(ramal)}`);
  }
answer: Lucía
answerLabel: ¿Quién no llegó al fondo de su ramal?
reveal: |
  Lucía: el ramal Sur tiene 30 nidos y ella reportó 21. Le faltaron justo los 9 de la Cámara del guácharo, la galería más honda de la cueva (cinco niveles desde la entrada). Por eso un bucle de uno o dos niveles no alcanza.
hints:
  - Es la función de "Lo mínimo". El caso base está escondido en el `for`: una galería sin salidas devuelve solo sus nidos.
  - "No sumes la entrada: llama a `nidos(ramal)` para cada salida de `cueva`."
```

## El juez

Igual que en las sesiones anteriores, el juez llama a tu función y compara lo que devuelve.

```exercise
id: js13-juez-camaras
type: judge
mode: function
function: camaras
title: Las cámaras de la cueva
prompt: |
  Escribe `camaras(mapa)`, que devuelve `[cantidad, mayor]`: cuántas cámaras hay en el mapa y cuántas casillas tiene la más grande.

  El mapa es una lista de filas de texto: `"#"` es roca y `"."` es piso. Una **cámara** es un grupo de casillas de piso unidas por los **cuatro lados** (arriba, abajo, izquierda, derecha); en diagonal no se pasa. Fuera del mapa, todo es roca. Si no hay piso, devuelve `[0, 0]`.

  **Restricciones:** el mapa tiene de 1 a 30 filas, todas del mismo largo, de 1 a 30 casillas.
visual:
  figure:
    title: El ejemplo 1, con sus dos cámaras
    input: { label: "mapa", grid: ["..#..", "..#.#", "###..", "#...#"], path: ["0,0", "1,0", "0,1", "1,1"], marks: ["3,0", "4,0", "3,1", "3,2", "4,2", "1,3", "2,3", "3,3"] }
    arrow: rellena cada cámara y cuenta sus casillas
    output: { label: devuelve, table: { head: ["cámara", "casillas"], rows: [["la verde", "4"], ["la marcada", "8"], ["**devuelve**", "[2, 8]"]] } }
    steps:
      - "Recorre todas las casillas; cuando encuentres piso que todavía no pintaste, es una cámara nueva: rellénala."
      - "La casilla (4, 2) toca a (4, 1), que es roca, pero llega a (3, 2) por la izquierda."
starter: |
  function camaras(mapa) {
    return [0, 0];
  }
solution: |
  function camaras(mapa) {
    const vistas = new Set();
    function llenar(x, y) {
      if (y < 0 || y >= mapa.length || x < 0 || x >= mapa[y].length) {
        return 0;
      }
      if (mapa[y][x] === "#" || vistas.has(`${x},${y}`)) {
        return 0;
      }
      vistas.add(`${x},${y}`);
      return 1 + llenar(x + 1, y) + llenar(x - 1, y) + llenar(x, y + 1) + llenar(x, y - 1);
    }
    let cantidad = 0;
    let mayor = 0;
    for (let y = 0; y < mapa.length; y++) {
      for (let x = 0; x < mapa[y].length; x++) {
        const tamano = llenar(x, y);
        if (tamano > 0) {
          cantidad++;
          mayor = Math.max(mayor, tamano);
        }
      }
    }
    return [cantidad, mayor];
  }
hints:
  - "Una función `llenar(x, y)` dentro de `camaras` que devuelva cuántas casillas pintó: 0 si está fuera del mapa, es roca o ya estaba pintada; si no, 1 más lo que pinten sus cuatro vecinas."
  - "Llama a `llenar` desde cada casilla del mapa: si devuelve más de 0, encontraste una cámara nueva."
samples:
  - args: [["..#..", "..#.#", "###..", "#...#"]]
    returns: [2, 8]
  - args: [[".#.", "#.#", ".#."]]
    returns: [5, 1]
    note: En diagonal no se pasa, así que cada casilla es su propia cámara.
edge:
  - args: [["###", "###"]]
    tag: sin piso
  - args: [["."]]
    tag: con una sola casilla
  - args: [["....", "....", "...."]]
    tag: con todo el mapa de piso
  - args: [["......", "#####.", "......", ".#####", "......"]]
    tag: con un pasillo en zigzag
  - args: [["..........", "##########", ".........."]]
    tag: con dos cámaras del mismo tamaño
random:
  count: 40
  seed: 131
  generate: |
    const h = rng.int(1, 30);
    const w = rng.int(1, 30);
    const roca = rng.next() * 0.6 + 0.2;
    return [Array.from({ length: h }, () => Array.from({ length: w }, () => (rng.next() < roca ? "#" : ".")).join(""))];
wrong:
  - |
    function camaras(mapa) {
      const vistas = new Set();
      function llenar(x, y) {
        if (y < 0 || y >= mapa.length || x < 0 || x >= mapa[y].length) return 0;
        if (mapa[y][x] === "#" || vistas.has(`${x},${y}`)) return 0;
        vistas.add(`${x},${y}`);
        let n = 1;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += llenar(x + dx, y + dy);
        return n;
      }
      let cantidad = 0, mayor = 0;
      for (let y = 0; y < mapa.length; y++) for (let x = 0; x < mapa[y].length; x++) {
        const t = llenar(x, y);
        if (t > 0) { cantidad++; mayor = Math.max(mayor, t); }
      }
      return [cantidad, mayor];
    }
  - |
    function camaras(mapa) {
      const vistas = new Set();
      function llenar(x, y) {
        if (mapa[y][x] === "#" || vistas.has(`${x},${y}`)) return 0;
        vistas.add(`${x},${y}`);
        return 1 + llenar(x + 1, y) + llenar(x - 1, y) + llenar(x, y + 1) + llenar(x, y - 1);
      }
      let cantidad = 0, mayor = 0;
      for (let y = 0; y < mapa.length; y++) for (let x = 0; x < mapa[y].length; x++) {
        const t = llenar(x, y);
        if (t > 0) { cantidad++; mayor = Math.max(mayor, t); }
      }
      return [cantidad, mayor];
    }
  - |
    function camaras(mapa) {
      const vistas = new Set();
      function llenar(x, y) {
        if (y < 0 || y >= mapa.length || x < 0 || x >= mapa[y].length) return 0;
        if (mapa[y][x] === "#" || vistas.has(`${x},${y}`)) return 0;
        vistas.add(`${x},${y}`);
        return 1 + llenar(x + 1, y) + llenar(x - 1, y) + llenar(x, y + 1) + llenar(x, y - 1);
      }
      let cantidad = 0, ultima = 0;
      for (let y = 0; y < mapa.length; y++) for (let x = 0; x < mapa[y].length; x++) {
        const t = llenar(x, y);
        if (t > 0) { cantidad++; ultima = t; }
      }
      return [cantidad, ultima];
    }
```

## Misión final

```exercise
id: js13-mision-camara
type: mission
title: Los nidos de la cámara
prompt: |
  Marca todas las casillas de la cámara donde está Chasqui y reporta cuántos nidos hay en ella, con una función recursiva.

  Chasqui no se mueve: ilumina la cámara con su lámpara y la revisa con el mapa. `robot.mapa()` da el mapa completo (`mapa[y][x]`: `"#"` roca, `"n"` un nido, `"."` piso) y `robot.posicion` dice dónde está. Escribe `explorar(x, y)`, que:

  - si la casilla es roca o ya la revisó, devuelve 0 (el caso base);
  - si no, la marca con `robot.marcar([x, y])`, y devuelve 1 si tiene nido (0 si no) **más** lo que devuelvan sus cuatro vecinas.

  Al final, `robot.reportar(...)` con el total. Los nidos de **otras** cámaras, al otro lado de la roca, no cuentan. El mapa siempre está rodeado de roca, y cambia en cada prueba.
visual:
  figure:
    title: Qué cuenta y qué no
    panes:
      - { label: "prueba 2: la cámara de Chasqui, marcada", grid: ["##########", "#..n#..n.#", "#.R.#.n..#", "#n..######", "##..#..n.#", "#n..#n...#", "##########"], marks: ["1,1", "2,1", "3,1", "1,2", "2,2", "3,2", "1,3", "2,3", "3,3", "2,4", "3,4", "1,5", "2,5", "3,5"], path: ["5,1", "6,1", "7,1", "8,1", "5,2", "6,2", "7,2", "8,2", "5,4", "6,4", "7,4", "8,4", "5,5", "6,5", "7,5", "8,5"] }
      - { label: "reporta", table: { head: ["", "nidos"], rows: [["en la cámara de Chasqui (marcada)", "3"], ["al otro lado de la roca (en verde)", "4 (no cuentan)"]] } }
starter: |
  const mapa = robot.mapa();
  const { x, y } = robot.posicion;
  console.log("Chasqui está en", x, y, "sobre", mapa[y][x]);

  // TODO: escribe explorar(x, y) recursiva: caso base (roca o ya revisada),
  // marca la casilla, cuenta su nido y suma lo de sus cuatro vecinas.

  // TODO: robot.reportar(...) con los nidos de la cámara.
solution: |
  const mapa = robot.mapa();
  const vistas = new Set();

  function explorar(x, y) {
    const clave = `${x},${y}`;
    if (mapa[y][x] === "#" || vistas.has(clave)) {
      return 0;
    }
    vistas.add(clave);
    robot.marcar([x, y]);
    const aqui = mapa[y][x] === "n" ? 1 : 0;
    return aqui + explorar(x + 1, y) + explorar(x - 1, y) + explorar(x, y + 1) + explorar(x, y - 1);
  }

  const { x, y } = robot.posicion;
  robot.reportar(explorar(x, y));
hints:
  - "Guarda las casillas revisadas en un `Set` de claves `\"x,y\"`, fuera de la función: si estuviera adentro, cada llamada empezaría con uno vacío."
  - "Sin el `Set`, dos vecinas se piden la una a la otra para siempre y la pila se desborda."
world:
  theme: mina
  level: 4
  dir: E
  api: [move, map, mark, report]
  items: { n: nido }
  map: |
    ##############
    #R..n#...n...#
    #.##.#.###.#.#
    #n...#.#n..#n#
    ######.#####.#
    #..n.#...n...#
    #.n..#########
    ##############
scenarios:
  - tests:
      - name: marca las 10 casillas de la cámara
        state: w.marks.length === 10
        msg: Las casillas marcadas no son exactamente las de la cámara de Chasqui.
      - name: reporta 2 nidos
        state: w.reports.length === 1 && w.reports[0] === 2
        msg: El número reportado no es el de nidos de esta cámara (o se reportó más de una vez).
  - map: |
      ##########
      #..n#..n.#
      #.R.#.n..#
      #n..######
      ##..#..n.#
      #n..#n...#
      ##########
    tests:
      - name: marca las 14 casillas de la cámara
        state: w.marks.length === 14
        msg: Las casillas marcadas no son exactamente las de la cámara de Chasqui.
      - name: reporta 3 nidos
        state: w.reports.length === 1 && w.reports[0] === 3
        msg: El número reportado no es el de nidos de esta cámara (o se reportó más de una vez).
  - map: |
      ################
      #n..#....n#...n#
      #.#.#.##..#.#..#
      #.#...#n..#.#n.#
      #.#####.###.#.##
      #..n...R..#..n.#
      #########n#.####
      #n.....#.....#.#
      ################
    tests:
      - name: marca las 54 casillas de la cámara
        state: w.marks.length === 54
        msg: Las casillas marcadas no son exactamente las de la cámara de Chasqui.
      - name: reporta 8 nidos
        state: w.reports.length === 1 && w.reports[0] === 8
        msg: El número reportado no es el de nidos de esta cámara (o se reportó más de una vez).
tests:
  - name: explorar se llama a sí misma
    source: 'function\s+explorar\s*\([^)]*\)\s*\{(?:(?!\n\})[\s\S])*\bexplorar\s*\('
    msg: Escribe explorar como función recursiva, que se llame para las cuatro vecinas.
  - name: sin chocar
    state: '!w.crashed'
```

## Reto experto

```exercise
id: js13-reto-ruta
type: challenge
title: El camino hasta la cámara
prompt: |
  Escribe `rutaHasta(galeria, nombre)`: devuelve la lista de nombres desde esta galería hasta la que se llama `nombre`, ambas incluidas, o `null` si no está. Maritza quiere imprimir el camino para el próximo equipo.

  `rutaHasta(cueva, "Pozo del eco")` → `["Entrada", "Norte", "Norte 2", "Pozo del eco"]`
starter: |
  function rutaHasta(galeria, nombre) {
    return null;
  }

  const cueva = { nombre: "Entrada", salidas: [
    { nombre: "Norte", salidas: [{ nombre: "Norte 2", salidas: [{ nombre: "Pozo del eco", salidas: [] }] }] },
    { nombre: "Sur", salidas: [] },
  ] };
  console.log(rutaHasta(cueva, "Pozo del eco"));
solution: |
  function rutaHasta(galeria, nombre) {
    if (galeria.nombre === nombre) {
      return [galeria.nombre];
    }
    for (const salida of galeria.salidas) {
      const resto = rutaHasta(salida, nombre);
      if (resto !== null) {
        return [galeria.nombre, ...resto];
      }
    }
    return null;
  }

  const cueva = { nombre: "Entrada", salidas: [
    { nombre: "Norte", salidas: [{ nombre: "Norte 2", salidas: [{ nombre: "Pozo del eco", salidas: [] }] }] },
    { nombre: "Sur", salidas: [] },
  ] };
  console.log(rutaHasta(cueva, "Pozo del eco"));
hints:
  - Si alguna salida tiene un camino hasta el nombre, el tuyo es tu nombre seguido de ese camino.
tests:
  - name: el camino al pozo
    run: 'rutaHasta(cueva, "Pozo del eco")'
    equals: ["Entrada", "Norte", "Norte 2", "Pozo del eco"]
  - name: la galería misma
    run: 'rutaHasta(cueva, "Entrada")'
    equals: ["Entrada"]
  - name: un nombre que no está
    run: 'rutaHasta(cueva, "Cámara secreta")'
    equals: null
  - name: busca en la segunda salida si la primera no lo tiene
    run: 'rutaHasta(cueva, "Sur")'
    equals: ["Entrada", "Sur"]
```
