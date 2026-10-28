# Sesión 3 — Bucles

## El encargo

La mina Santa Clotilde, a una hora de Huancayo subiendo hacia la puna, encontró una veta de cuarzo en un túnel viejo. Nadie sabe cuánto mide el túnel: los planos se mojaron en 1987. El ingeniero Ccori quiere que Chasqui lo recorra entero, recoja los cristales y reporte cuántos hay, sin chocar con la roca del fondo.

Le pusimos una lámpara en la cabeza. Lo que no le podemos poner es un número de pasos fijo, porque nadie lo sabe. Chasqui tiene que **repetir** hasta que el túnel se acabe.

```escena
theme: mina
level: 3
dir: E
caption: El túnel de Santa Clotilde. Chasqui repite lo mismo en cada casilla (avanzar, recoger) hasta que la roca le cierra el paso.
map: |
  ###########
  ###########
  #R.2..3.1.#
  ###########
  ###########
program: |
  let total = 0;
  while (!robot.hayPared()) {
    robot.avanzar();
    total += robot.recoger();
  }
  robot.reportar(total);
```

## Lo mínimo

Un bucle repite un bloque. Hay tres que vas a usar siempre:

```js run
const vetas = [3, 0, 5, 2];        // un array: una lista de valores

for (let i = 0; i < vetas.length; i++) {
  console.log(`veta ${i}: ${vetas[i]} cristales`);
}

let total = 0;
for (const veta of vetas) {
  total += veta;
}
console.log("total", total);

let lampara = 3;
while (lampara > 0) {
  lampara--;
}
console.log("lámpara", lampara);
```

- **`for` clásico** cuando necesitas el contador `i`: empieza en `0`, sigue *mientras* `i < vetas.length`, suma uno en cada vuelta.
- **`for...of`** cuando solo necesitas cada valor, uno tras otro. Es el más claro para recorrer un array.
- **`while`** cuando no sabes cuántas vueltas habrá: repite *mientras* la condición sea verdadera. Si nunca se vuelve falsa, el bucle no termina (aquí el Taller lo corta a los dos segundos).

Mira el `for` clásico paso a paso: el contador `i` avanza de casilla en casilla y `total` crece en cada vuelta.

```anima
title: Un bucle recorre la lista, una casilla por vuelta
code: |
  const vetas = [3, 0, 5, 2];
  let total = 0;
  for (let i = 0; i < vetas.length; i++) {
    total += vetas[i];
  }
  console.log(total);
cells: { of: vetas, at: i }
notes:
  3: "Una vuelta más: i apunta a la casilla que toca."
  4: "Se suma esa casilla a total."
  6: "i ya vale 4 y 4 < 4 es falso: el bucle terminó."
```

Los arrays empiezan a contar en **0**: el primer elemento es `vetas[0]` y el último es `vetas[vetas.length - 1]`. `total += veta` es una forma corta de `total = total + veta`, y `i++` de `i = i + 1`.

> **Trampa común:** el *off-by-one*. `i <= vetas.length` da una vuelta de más y lee `vetas[4]`, que no existe: vale `undefined`, y `total + undefined` es `NaN`.

<!-- legacy: for-of -->

<!-- mdn: arrays for for-of while -->

## Práctica

```exercise
id: js3-predice-suma
type: predict
title: Contando vagones
prompt: |
  ¿Qué imprime?
code: |
  let total = 0;
  for (let i = 1; i <= 4; i++) {
    total += i;
  }
  console.log(total);
options:
  - "10"
  - "4"
  - "6"
  - "15"
answer: "10"
explain: |
  `i` toma 1, 2, 3 y 4 (porque es `<=`), y se suman: 10.
```

```exercise
id: js3-predice-lampara
type: predict
title: La lámpara de carburo
prompt: |
  Cada viaje gasta 3 de batería y Chasqui solo sale si le quedan al menos 3. ¿Qué imprime?
code: |
  let bateria = 10;
  let viajes = 0;
  while (bateria >= 3) {
    bateria -= 3;
    viajes++;
  }
  console.log(viajes, bateria);
options:
  - "3 1"
  - "4 -2"
  - "3 0"
  - "10 3"
answer: "3 1"
explain: |
  10 → 7 → 4 → 1. Con 1 la condición `1 >= 3` es falsa y el bucle termina: 3 viajes, queda 1.
```

```exercise
id: js3-completa-vetas
type: complete
title: El inventario de la mañana
prompt: |
  Completa el bucle para sumar todos los cristales de `vetas`.
starter: |
  const vetas = [3, 0, 5, 2, 7];
  let total = 0;
  for (let i = 0; i < ___; i++) {
    total += ___;
  }
  console.log(total);
solution: |
  const vetas = [3, 0, 5, 2, 7];
  let total = 0;
  for (let i = 0; i < vetas.length; i++) {
    total += vetas[i];
  }
  console.log(total);
hints:
  - El bucle sigue mientras `i` sea menor que la cantidad de elementos.
  - El elemento número `i` se lee con corchetes.
tests:
  - name: suma 17
    output: "17"
  - name: no escribe el 5 a mano
    source: '\.length'
    msg: Usa vetas.length, así el bucle sirve para cualquier lista.
```

```exercise
id: js3-arregla-nan
type: fix
title: El total que salía NaN
prompt: |
  El ayudante del ingeniero escribió esto y la pizarra de la mina dice `NaN`. Hay **dos** errores en la misma línea.
starter: |
  const vetas = [4, 1, 6, 3];
  let total = 0;
  for (let i = 1; i <= vetas.length; i++) {
    total += vetas[i];
  }
  console.log(total);
solution: |
  const vetas = [4, 1, 6, 3];
  let total = 0;
  for (let i = 0; i < vetas.length; i++) {
    total += vetas[i];
  }
  console.log(total);
hints:
  - ¿En qué número empiezan los índices de un array?
  - "`vetas[4]` no existe. ¿Qué condición evita llegar a 4?"
tests:
  - name: suma 14
    output: "14"
```

```exercise
id: js3-escribe-pared
type: write
title: Hasta el fondo
prompt: |
  Haz que Chasqui avance hasta quedar frente a la pared del fondo, sin chocar.

  El túnel tiene un largo desconocido. `robot.hayPared()` devuelve `true` si la casilla de enfrente es roca. Se prueba en tres túneles.
starter: |
  robot.avanzar();
solution: |
  while (!robot.hayPared()) {
    robot.avanzar();
  }
hints:
  - "Repite mientras NO haya pared: `while (!robot.hayPared())`."
world:
  theme: mina
  level: 3
  dir: E
  map: |
    ########
    #R.....#
    ########
scenarios:
  - {}
  - map: |
      #############
      #R..........#
      #############
  - map: |
      ####
      #R.#
      ####
tests:
  - name: termina frente a la pared
    state: w.wallAhead
    msg: Chasqui se detuvo antes del fondo.
  - name: sin chocar
    state: '!w.crashed'
  - name: usa while
    source: '\bwhile\s*\('
```

```exercise
id: js3-escribe-vacias
type: write
title: Vetas vacías
prompt: |
  Cuenta cuántas vetas tienen 0 cristales y guarda ese número en `vacias`. Recorre `vetas` con `for...of`; la lista cambia en cada prueba.
visual:
  figure:
    input: { label: "vetas (ejemplo)", cells: [3, 0, 5, 0, 0, 2], highlight: [1, 3, 4] }
    arrow: cuenta los ceros
    output: { label: vacias, value: "3" }
starter: |
  let vacias = 0;

  console.log(vacias);
solution: |
  let vacias = 0;
  for (const veta of vetas) {
    if (veta === 0) {
      vacias++;
    }
  }
  console.log(vacias);
hints:
  - Dentro del bucle, un if que sume uno solo cuando la veta es 0.
globals:
  vetas: [3, 0, 5, 0, 0, 2]
scenarios:
  - tests:
      - name: "[3, 0, 5, 0, 0, 2] → 3"
        expect: vacias === 3
  - globals: { vetas: [1, 2, 3] }
    tests:
      - name: "[1, 2, 3] → 0"
        expect: vacias === 0
  - globals: { vetas: [0] }
    tests:
      - name: "[0] → 1"
        expect: vacias === 1
tests:
  - name: usa for...of
    source: '\bfor\s*\(\s*(const|let)\s+\w+\s+of\b'
    msg: Recorre vetas con for (const veta of vetas).
```

## El caso

```exercise
id: js3-caso-tramo
type: case
title: El tramo saqueado
prompt: |
  Calcula cuántos cristales faltan en cada tramo (ayer − hoy) y encuentra el tramo donde faltan más.

  El túnel está dividido en 20 tramos. Ayer por la tarde Chasqui contó los cristales de cada uno; hoy en la mañana volvió a contar. Alguien entró de noche. Los tramos donde hoy hay *más* que ayer no son misterio: la roca se desprende y aparecen cristales nuevos.

  Ojo con la numeración: el tramo 1 es la posición `0` de cada lista.
visual:
  figure:
    title: Las dos cuentas, tramo por tramo
    table: { head: ["tramo", "posición", "ayer", "hoy", "faltan"], rows: [["1", "0", "18", "17", "**1** (18 − 17)"], ["2", "1", "25", "25", "?"], ["3", "2", "31", "24", "?"], ["4", "3", "12", "13", "?"], ["5", "4", "40", "36", "?"], ["6", "5", "22", "22", "?"], ["7", "6", "27", "20", "?"], ["8", "7", "35", "35", "?"], ["9", "8", "19", "19", "?"], ["10", "9", "44", "31", "?"], ["11", "10", "16", "16", "?"], ["12", "11", "29", "28", "?"], ["13", "12", "38", "26", "?"], ["14", "13", "21", "21", "?"], ["15", "14", "33", "33", "?"], ["16", "15", "26", "15", "?"], ["17", "16", "14", "14", "?"], ["18", "17", "41", "39", "?"], ["19", "18", "30", "30", "?"], ["20", "19", "24", "24", "?"]] }
starter: |
  const ayer = [18, 25, 31, 12, 40, 22, 27, 35, 19, 44, 16, 29, 38, 21, 33, 26, 14, 41, 30, 24];
  const hoy  = [17, 25, 24, 13, 36, 22, 20, 35, 19, 31, 16, 28, 26, 21, 33, 15, 14, 39, 30, 24];

  // Así se calcula un tramo: el tramo 1 está en la posición 0.
  console.log("Tramo 1: faltan", ayer[0] - hoy[0]);

  // TODO: recorre los 20 tramos, calcula ayer[i] - hoy[i] en cada uno
  // y quédate con el tramo donde faltan más. Imprímelo así: Tramo 7: faltan 5
solution: |
  const ayer = [18, 25, 31, 12, 40, 22, 27, 35, 19, 44, 16, 29, 38, 21, 33, 26, 14, 41, 30, 24];
  const hoy  = [17, 25, 24, 13, 36, 22, 20, 35, 19, 31, 16, 28, 26, 21, 33, 15, 14, 39, 30, 24];

  let peorTramo = 0;
  let mayorPerdida = 0;
  for (let i = 0; i < ayer.length; i++) {
    const perdida = ayer[i] - hoy[i];
    if (perdida > mayorPerdida) {
      mayorPerdida = perdida;
      peorTramo = i + 1;
    }
  }
  console.log(`Tramo ${peorTramo}: faltan ${mayorPerdida}`);
answer: "10"
answerLabel: ¿Qué tramo perdió más? (solo el número)
reveal: |
  El tramo 10: de 44 a 31, faltan 13. Muy cerca están el tramo 13 (faltan 12) y el 16 (faltan 11), por eso a ojo es fácil equivocarse. Y ojo con el índice: el tramo 10 es `ayer[9]`.
hints:
  - Necesitas el índice para leer el mismo tramo en los dos arrays, así que aquí va el `for` clásico.
  - Guarda en dos variables la mayor pérdida vista hasta ahora y en qué tramo fue; cámbialas solo cuando aparezca una mayor. El tramo es `i + 1`.
```

## El juez

Lee con `leerNumero()` y `leerNumeros()` como en la sesión 1.

```exercise
id: js3-juez-vagonetas
type: judge
title: El parte de las vagonetas
prompt: |
  Imprime tres números: el total de cristales, cuántas vagonetas salieron vacías y la carga más grande.

  Al final del turno, las vagonetas salen de la mina en fila y el ingeniero Ccori quiere el parte del día.

  **Entrada:** una línea con `N`, el número de vagonetas; otra con las `N` cargas separadas por espacios (vacía si `N` es 0).

  **Salida:** tres líneas: el total, la cantidad de vagonetas vacías (carga 0) y la carga máxima (0 si no hubo vagonetas).

  **Restricciones:** 0 ≤ N ≤ 1000 · cada carga entre 0 y 100.
visual:
  figure:
    title: El ejemplo 1, dibujado
    input: { label: "Entrada: 5 / 3 0 7 0 2", cells: [3, 0, 7, 0, 2], highlight: [1, 3] }
    arrow: un solo bucle
    output: { label: "Salida", table: { head: ["línea", "qué es", "valor"], rows: [["1", "total: 3 + 0 + 7 + 0 + 2", "12"], ["2", "vagonetas vacías (las de 0)", "2"], ["3", "carga más grande", "7"]] } }
    steps:
      - "La primera línea dice cuántas vagonetas vienen: 5."
      - "La segunda trae las cargas, una por vagoneta."
starter: |
  const n = leerNumero();
  const cargas = leerNumeros();
  console.log(cargas[0]);
solution: |
  const n = leerNumero();
  const cargas = leerNumeros();
  let total = 0;
  let vacias = 0;
  let maximo = 0;
  for (const carga of cargas) {
    total += carga;
    if (carga === 0) {
      vacias++;
    }
    if (carga > maximo) {
      maximo = carga;
    }
  }
  console.log(total);
  console.log(vacias);
  console.log(maximo);
hints:
  - Tres acumuladores que empiezan en 0 y un solo bucle que los actualiza.
  - "¿Qué pasa si no hay ninguna vagoneta? Prueba con la entrada `0` y una línea vacía."
samples:
  - input: "5\n3 0 7 0 2"
    output: "12\n2\n7"
  - input: "1\n0"
    output: "0\n1\n0"
    note: Una sola vagoneta, vacía.
edge:
  - input: "0\n"
    tag: sin ninguna vagoneta
  - input: "3\n0 0 0"
    tag: con todas las vagonetas vacías
  - input: "4\n100 100 100 100"
    tag: con todas llenas al máximo
  - input: "2\n5 9"
    tag: cuando la carga máxima es la última
random:
  count: 30
  seed: 33
  generate: |
    const n = rng.int(1, 1000);
    return `${n}\n${rng.list(n, 0, 100).map((v) => (v < 15 ? 0 : v)).join(" ")}`;
wrong:
  - |
    const n = leerNumero();
    const cargas = leerNumeros();
    let total = 0, vacias = 0, maximo = 0;
    for (let i = 1; i < n; i++) {
      total += cargas[i];
      if (cargas[i] === 0) vacias++;
      if (cargas[i] > maximo) maximo = cargas[i];
    }
    console.log(total);
    console.log(vacias);
    console.log(maximo);
  - |
    const n = leerNumero();
    const cargas = leerNumeros();
    let total = 0, vacias = 0, maximo = cargas[0];
    for (const c of cargas) {
      total += c;
      if (c === 0) vacias++;
      if (c > maximo) maximo = c;
    }
    console.log(total);
    console.log(vacias);
    console.log(maximo);
```

## Misión final

```exercise
id: js3-mision-tunel
type: mission
title: El túnel de Santa Clotilde
prompt: |
  Recoge todos los cristales del túnel y, al llegar al fondo, reporta el total con `robot.reportar(total)`.

  Recorre el túnel hasta el fondo, **recoge en cada casilla** y **reporta una sola vez**, al final. `robot.recoger()` levanta los cristales de la casilla donde está Chasqui y devuelve cuántos levantó (0 si no había). Se prueba en tres túneles de largo distinto.
starter: |
  let total = 0;

  robot.avanzar();
  total += robot.recoger();

  robot.reportar(total);
solution: |
  let total = 0;
  while (!robot.hayPared()) {
    robot.avanzar();
    total += robot.recoger();
  }
  robot.reportar(total);
hints:
  - Es el bucle de "Hasta el fondo" con una línea más adentro.
  - Recoge después de avanzar, en cada casilla.
world:
  theme: mina
  level: 3
  dir: E
  map: |
    ##############
    ##############
    #R.3..1.2..4.#
    ##############
    ##############
scenarios:
  - {}
  - map: |
      ########
      ########
      #R1.5.2#
      ########
      ########
  - map: |
      ##################
      ##################
      #R..2...6..1...3.#
      ##################
      ##################
tests:
  - name: no quedan cristales en el túnel
    state: w.crystalsLeft === 0
    msg: Quedaron cristales sin recoger.
  - name: reporta el total exacto, una vez
    state: w.reports.length === 1 && w.reports[0] === w.crystalsTotal
    msg: El número reportado no es el total del túnel (o se reportó más de una vez).
  - name: Chasqui no choca
    state: '!w.crashed'
  - name: usa un bucle
    source: '\b(while|for)\s*\('
```

## Reto experto

```exercise
id: js3-reto-curvas
type: challenge
title: El túnel con curvas
prompt: |
  El túnel de servicio dobla sin aviso hacia un lado u otro, sin bifurcaciones. Lleva a Chasqui hasta el ascensor del fondo (donde ya no puede seguir). `robot.hayPared("izquierda")` y `robot.hayPared("derecha")` miran a los costados. Se prueba en dos túneles.
starter: |
  while (!robot.hayPared()) {
    robot.avanzar();
  }
solution: |
  const encerrado = () =>
    robot.hayPared() && robot.hayPared("izquierda") && robot.hayPared("derecha");

  while (!encerrado()) {
    if (!robot.hayPared()) {
      robot.avanzar();
    } else if (!robot.hayPared("izquierda")) {
      robot.girarIzquierda();
    } else {
      robot.girarDerecha();
    }
  }
hints:
  - El túnel termina cuando hay pared adelante y a los dos lados.
  - "Dentro del bucle: si puedes, avanza; si no, gira hacia el lado libre."
world:
  theme: mina
  level: 3
  dir: E
  map: |
    #######
    #R..###
    ###.###
    ###..D#
    #######
scenarios:
  - {}
  - map: |
      #########
      #R..#####
      ###.#..D#
      ###...###
      #########
tests:
  - name: llega al ascensor
    state: w.atGoal
    msg: Chasqui no terminó en el ascensor.
  - name: sin chocar
    state: '!w.crashed'
```
