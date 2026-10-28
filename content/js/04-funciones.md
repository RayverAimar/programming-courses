# Sesión 4 — Funciones

## El encargo

Sábado, una de la tarde, cevichería La Chalupa en Chorrillos. Hay cola hasta la playa, la señora Delia corta pescado como una máquina y el mozo se fue a ver el partido. Delia llamó a Loop: "Mándenme al robot ese, pero que no me haga perder platos".

Le pusimos a Chasqui un brazo con bandeja. El problema es que servir un plato son seis instrucciones, y un sábado son cuarenta platos. Escribir 240 líneas no es programar: es copiar. Hoy Chasqui aprende a **ponerle nombre a una rutina** y usarla las veces que haga falta.

```escena
theme: cocina
level: 4
dir: E
caption: La Chalupa a la una de la tarde. Chasqui prepara en la cocina (K), lleva el plato por el pasillo y lo sirve en la mesa de abajo.
map: |
  #############
  #K..........#
  ##1#2#3#4#5##
  #############
program: |
  robot.preparar("ceviche");
  robot.avanzar(3);
  robot.servir();
  robot.girarDerecha();
  robot.girarDerecha();
  robot.avanzar(3);
```

## Lo mínimo

Una función es un bloque de código con nombre. Recibe datos por sus **parámetros** y entrega un resultado con **`return`**.

```js run
function subtotal(precio, cantidad = 1) {
  return precio * cantidad;
}

const conIgv = (monto) => monto * 1.18;

console.log(subtotal(35, 2));
console.log(subtotal(8));
console.log(conIgv(100).toFixed(2));
```

Mira qué pasa cuando una función llama a otra: cada llamada abre una caja con sus datos de entrada, y al llegar al `return` la caja se cierra y entrega su resultado.

Las llamadas en curso se apilan en la **pila de llamadas**: arriba está la que corre ahora y las de abajo esperan su resultado. La de arriba termina primero.

```figura
title: La pila de llamadas, en el momento en que corre `subtotal`
panes:
  - { label: "Arriba: la que corre ahora", cards: [{ title: "subtotal(35, 2)", rows: [["precio", "35"], ["cantidad", "2"]] }] }
  - { label: "Debajo: espera a que la de arriba devuelva", cards: [{ title: "cuenta(35, 2, 5)", rows: [["precio", "35"], ["cantidad", "2"], ["propina", "5"]] }] }
caption: "Cuando `subtotal` devuelve 70, su tarjeta sale de la pila y `cuenta` sigue donde se quedó."
```

```anima
title: Una llamada es una caja con entradas y una salida
code: |
  function subtotal(precio, cantidad) {
    return precio * cantidad;
  }
  function cuenta(precio, cantidad, propina) {
    const base = subtotal(precio, cantidad);
    return base + propina;
  }
  const total = cuenta(35, 2, 5);
  console.log(total);
notes:
  4: "Se abre la caja de cuenta con sus tres entradas."
  1: "cuenta llamó a subtotal: la pila de llamadas crece."
  5: "base recibe lo que devolvió subtotal: 70."
  2: "subtotal devuelve 70 y su caja se cierra."
  6: "cuenta devuelve 75 a quien la llamó."
```

- **`function nombre(params) { … }`** declara una función con nombre. Es la forma natural para las piezas de tu programa.
- **Funciones flecha**: `(monto) => monto * 1.18`. Si el cuerpo es una sola expresión, se devuelve sola, sin `return`. Ideales para funciones cortas.
- **Parámetros por defecto**: `cantidad = 1` se usa cuando no te pasan ese argumento.
- **Desestructuración**: `function atender({ mesa, plato })` saca esas propiedades del objeto que te pasan. Y `...` reparte un array (`Math.max(...precios)`) o junta argumentos (`function sumar(...nums)`).
- **`return` termina la función.** Lo que imprime `console.log` se ve en la consola, pero no vuelve al programa: para usar un resultado, devuélvelo.

Cuando un programa crece, sus funciones se reparten en archivos (**módulos**). Uno exporta, otro importa:

```js
// cocina.js
export function atender(pedido) { /* … */ }

// main.js
import { atender } from "./cocina.js";
```

`export` pone un nombre a disposición de otros archivos; `import` lo pide, y el `./` significa «en la carpeta de este archivo». En los ejercicios todo vive en un solo archivo, pero así se ve un proyecto real. Cómo se encuentran los archivos y en qué orden corren lo verás dibujado en la sesión 12.

> **Trampa común:** una función sin `return` devuelve `undefined`. Si ves `undefined` donde esperabas un número, busca el `return` que falta.

<!-- legacy: arrow-functions -->

<!-- legacy: default-parameters -->

<!-- legacy: destructuring -->

<!-- legacy: modules -->

<!-- mdn: functions arrow-functions default-parameters destructuring spread modules -->

## Práctica

```exercise
id: js4-predice-propina
type: predict
title: La propina que faltó
prompt: |
  ¿Qué imprime?
code: |
  function cobrar(total, propina) {
    return total + propina;
  }
  console.log(cobrar(40, 5));
  console.log(cobrar(40));
options:
  - "45\n40"
  - "45\nNaN"
  - "45\nundefined"
  - "45\nError"
answer: "45\nNaN"
explain: |
  Un argumento que no se pasa llega como `undefined`, y `40 + undefined` es `NaN`. Con `propina = 0` en la firma, la segunda línea daría 40.
```

```exercise
id: js4-completa-limones
type: complete
title: Limones y subtotales
prompt: |
  Cada ceviche lleva 6 limones. Completa la función flecha `limonesPara` y la declaración de `subtotal`.
starter: |
  const limonesPara = (platos) => ___;

  function ___(precio, cantidad) {
    ___ precio * cantidad;
  }

  console.log(limonesPara(4));
  console.log(subtotal(32, 3));
solution: |
  const limonesPara = (platos) => platos * 6;

  function subtotal(precio, cantidad) {
    return precio * cantidad;
  }

  console.log(limonesPara(4));
  console.log(subtotal(32, 3));
hints:
  - En una flecha de una sola expresión, la expresión es lo que se devuelve.
  - El nombre de la función es el que se usa abajo en el console.log.
tests:
  - name: limonesPara(4) es 24
    run: limonesPara(4)
    equals: 24
  - name: limonesPara(0) es 0
    run: limonesPara(0)
    equals: 0
  - name: subtotal(32, 3) es 96
    run: subtotal(32, 3)
    equals: 96
```

```exercise
id: js4-arregla-cuenta
type: fix
title: La cuenta undefined
prompt: |
  La mesa 2 pidió la cuenta y el ticket dice `La cuenta es S/ undefined`. La suma está bien. ¿Qué falta?
starter: |
  function totalPedido(platos) {
    let total = 0;
    for (const { precio } of platos) {
      total += precio;
    }
    console.log(total);
  }

  const cuenta = totalPedido([
    { nombre: "ceviche", precio: 35 },
    { nombre: "chicha", precio: 8 },
  ]);
  console.log(`La cuenta es S/ ${cuenta}`);
solution: |
  function totalPedido(platos) {
    let total = 0;
    for (const { precio } of platos) {
      total += precio;
    }
    return total;
  }

  const cuenta = totalPedido([
    { nombre: "ceviche", precio: 35 },
    { nombre: "chicha", precio: 8 },
  ]);
  console.log(`La cuenta es S/ ${cuenta}`);
hints:
  - console.log muestra el total, pero ¿la función lo entrega a quien la llamó?
tests:
  - name: totalPedido devuelve la suma
    run: 'totalPedido([{ nombre: "causa", precio: 22 }, { nombre: "chicha", precio: 8 }])'
    equals: 30
  - name: el ticket sale bien
    output: La cuenta es S/ 43
```

```exercise
id: js4-escribe-ticket
type: write
title: La línea del ticket
prompt: |
  Escribe la función `lineaTicket(item, cantidad)`, que devuelve la línea del ticket como texto. `item` es un objeto como `{ plato: "ceviche", precio: 35 }`; `cantidad` es **1 si no te la pasan**. Devuelve un texto así:

  `lineaTicket({ plato: "ceviche", precio: 35 }, 2)` → `"2 x ceviche: S/ 70"`

  Desestructura `item` en los parámetros.
visual:
  figure:
    input: { label: "lineaTicket(item, 2)", cards: [{ title: item, rows: [["plato", "\"ceviche\""], ["precio", "35"]] }] }
    arrow: 2 × 35 = 70
    output: { label: devuelve, value: "\"2 x ceviche: S/ 70\"" }
starter: |
  function lineaTicket(item, cantidad) {
  }

  console.log(lineaTicket({ plato: "ceviche", precio: 35 }, 2));
solution: |
  function lineaTicket({ plato, precio }, cantidad = 1) {
    return `${cantidad} x ${plato}: S/ ${precio * cantidad}`;
  }

  console.log(lineaTicket({ plato: "ceviche", precio: 35 }, 2));
hints:
  - "La firma puede ser `function lineaTicket({ plato, precio }, cantidad = 1)`."
tests:
  - name: dos ceviches
    run: 'lineaTicket({ plato: "ceviche", precio: 35 }, 2)'
    equals: "2 x ceviche: S/ 70"
  - name: una chicha, sin pasar la cantidad
    run: 'lineaTicket({ plato: "chicha", precio: 8 })'
    equals: "1 x chicha: S/ 8"
  - name: desestructura en los parámetros
    source: 'function\s+lineaTicket\s*\(\s*\{'
    msg: Escribe { plato, precio } directamente en los parámetros.
```

## El caso

```exercise
id: js4-caso-mesa
type: case
title: La mesa que se fue sin pagar completo
prompt: |
  Escribe `totalDeMesa(mesa)`, que suma lo que consumió una mesa, e imprime una línea por mesa para compararla con lo que pagó.

  Al cerrar, la caja de La Chalupa no cuadra: falta plata. Delia tiene la carta, la lista de lo que pidió cada mesa (en el orden en que salió de la cocina) y lo que pagó cada una. Una mesa dejó propina, así que pagar *más* no es sospechoso. ¿Qué mesa pagó **menos** de lo que consumió?

  Imprime cada mesa así, con el consumo al final: `Mesa 1: consumió 51`. El tablero compara tu número con lo que pagó esa mesa.
visual:
  board:
    for: js4-caso-mesa
    title: Lo que pagó cada mesa
    task: Calcula el consumo de cada mesa con tu función y compáralo con su pago.
    cards:
      - { name: "Mesa 1", kind: person, role: "Pagó S/ 51", clue: { find: "Mesa 1:", says: 51, saysLabel: "Pagó" } }
      - { name: "Mesa 2", kind: person, role: "Pagó S/ 60", clue: { find: "Mesa 2:", says: 60, saysLabel: "Pagó" } }
      - { name: "Mesa 3", kind: person, role: "Pagó S/ 100", clue: { find: "Mesa 3:", says: 100, saysLabel: "Pagó" } }
      - { name: "Mesa 4", kind: person, role: "Pagó S/ 40", clue: { find: "Mesa 4:", says: 40, saysLabel: "Pagó" } }
      - { name: "Mesa 5", kind: person, role: "Pagó S/ 86", culprit: true, clue: { find: "Mesa 5:", says: 86, saysLabel: "Pagó" } }
      - { name: "Mesa 6", kind: person, role: "Pagó S/ 67", clue: { find: "Mesa 6:", says: 67, saysLabel: "Pagó" } }
    caption: "**Cuadra**: pagó justo lo que consumió. Si no cuadra, mira hacia qué lado: pagar de más es propina."
starter: |
  const carta = {
    "ceviche": 35,
    "chicharrón": 32,
    "leche de tigre": 18,
    "chicha": 8,
    "arroz con mariscos": 38,
    "causa": 22,
  };

  const pedidos = [
    { mesa: 3, plato: "ceviche" }, { mesa: 1, plato: "ceviche" }, { mesa: 5, plato: "causa" },
    { mesa: 2, plato: "arroz con mariscos" }, { mesa: 3, plato: "ceviche" }, { mesa: 6, plato: "ceviche" },
    { mesa: 1, plato: "chicha" }, { mesa: 5, plato: "leche de tigre" }, { mesa: 4, plato: "chicharrón" },
    { mesa: 3, plato: "causa" }, { mesa: 5, plato: "arroz con mariscos" }, { mesa: 2, plato: "leche de tigre" },
    { mesa: 6, plato: "chicharrón" }, { mesa: 1, plato: "chicha" }, { mesa: 5, plato: "chicha" },
    { mesa: 4, plato: "chicha" }, { mesa: 3, plato: "chicha" }, { mesa: 5, plato: "chicha" },
  ];

  const pagos = { 1: 51, 2: 60, 3: 100, 4: 40, 5: 86, 6: 67 };

  // Así se lee un pedido y su precio:
  const primero = pedidos[0];
  console.log("Primer pedido: mesa", primero.mesa, "pidió", primero.plato, "que cuesta", carta[primero.plato]);

  // TODO: escribe totalDeMesa(mesa): recorre pedidos y suma el precio
  // de los que son de esa mesa. Devuelve la suma.

  // TODO: imprime una línea por mesa (de la 1 a la 6), así: Mesa 1: consumió 51
solution: |
  const carta = {
    "ceviche": 35,
    "chicharrón": 32,
    "leche de tigre": 18,
    "chicha": 8,
    "arroz con mariscos": 38,
    "causa": 22,
  };

  const pedidos = [
    { mesa: 3, plato: "ceviche" }, { mesa: 1, plato: "ceviche" }, { mesa: 5, plato: "causa" },
    { mesa: 2, plato: "arroz con mariscos" }, { mesa: 3, plato: "ceviche" }, { mesa: 6, plato: "ceviche" },
    { mesa: 1, plato: "chicha" }, { mesa: 5, plato: "leche de tigre" }, { mesa: 4, plato: "chicharrón" },
    { mesa: 3, plato: "causa" }, { mesa: 5, plato: "arroz con mariscos" }, { mesa: 2, plato: "leche de tigre" },
    { mesa: 6, plato: "chicharrón" }, { mesa: 1, plato: "chicha" }, { mesa: 5, plato: "chicha" },
    { mesa: 4, plato: "chicha" }, { mesa: 3, plato: "chicha" }, { mesa: 5, plato: "chicha" },
  ];

  const pagos = { 1: 51, 2: 60, 3: 100, 4: 40, 5: 86, 6: 67 };

  function totalDeMesa(mesa) {
    let total = 0;
    for (const pedido of pedidos) {
      if (pedido.mesa === mesa) {
        total += carta[pedido.plato];
      }
    }
    return total;
  }

  for (let mesa = 1; mesa <= 6; mesa++) {
    const diferencia = pagos[mesa] - totalDeMesa(mesa);
    console.log(`Mesa ${mesa}: pagó ${pagos[mesa]}, diferencia ${diferencia}, consumió ${totalDeMesa(mesa)}`);
  }
answer: "5"
answerLabel: ¿Qué mesa pagó de menos? (solo el número)
reveal: |
  La mesa 5: consumió 94 (causa, leche de tigre, arroz con mariscos y dos chichas) y pagó 86. La mesa 2 pagó 4 soles más: esa fue la propina.
hints:
  - "Para leer el precio de un plato: `carta[pedido.plato]`. Los corchetes sirven con nombres que tienen espacios."
  - Dentro de la función, un `for...of` sobre `pedidos` con un `if` que sume solo los de la mesa que te pasaron.
```

## El juez

Este juez no lee ni imprime: **llama a tus funciones** y compara lo que devuelven, como en LeetCode. Por eso puede juzgar cada función por separado.

```exercise
id: js4-juez-cuenta
type: judge
mode: function
function: cuentaMesa
title: La cuenta de cada mesa
prompt: |
  Escribe `cuentaMesa(pedidos, propina)`, que devuelve cuánto paga una mesa, y sus dos ayudantes `precioDe` y `subtotal`.

  Delia quiere que Chasqui cobre. La carta: ceviche 35, chicharron 32, causa 22, chicha 8. Un pedido es un par `[plato, cantidad]`, por ejemplo `["ceviche", 2]`.

  Escribe tres funciones, y el juez probará las tres:

  - `precioDe(plato)`: el precio de un plato; **0** si no está en la carta.
  - `subtotal(pedido)`: el precio del plato por la cantidad.
  - `cuentaMesa(pedidos, propina)`: la suma de los subtotales más la propina, que es un **porcentaje** de esa suma redondeado con `Math.round`. Si no te pasan la propina, es 0.

  **Restricciones:** hasta 6 pedidos por mesa · cantidades de 0 a 10 · propina de 0 a 20.
visual:
  figure:
    title: El ejemplo 1, como cuenta
    input: { label: 'cuentaMesa([["ceviche", 2], ["chicha", 3]], 10)', receipt: { title: LA CHALUPA, rows: [["2 × ceviche", "35 × 2", "70"], ["3 × chicha", "8 × 3", "24"]], totalLabel: "Suma de subtotales", total: "94" } }
    arrow: "+ 10 % de propina: 9.4 → Math.round → 9"
    output: { label: devuelve, value: "103" }
    steps:
      - "`subtotal([\"ceviche\", 2])` usa `precioDe(\"ceviche\")` = 35 y devuelve 70."
      - "`cuentaMesa` suma los subtotales y agrega la propina redondeada."
starter: |
  function precioDe(plato) {
  }

  function subtotal(pedido) {
  }

  function cuentaMesa(pedidos, propina) {
  }
solution: |
  const CARTA = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };

  function precioDe(plato) {
    return CARTA[plato] ?? 0;
  }

  function subtotal([plato, cantidad]) {
    return precioDe(plato) * cantidad;
  }

  function cuentaMesa(pedidos, propina = 0) {
    let suma = 0;
    for (const pedido of pedidos) {
      suma += subtotal(pedido);
    }
    return suma + Math.round((suma * propina) / 100);
  }
hints:
  - "Desestructura el pedido en los parámetros: `function subtotal([plato, cantidad])`."
  - "`cuentaMesa` no necesita saber precios: que use `subtotal`, y `subtotal` que use `precioDe`."
samples:
  - args: [[["ceviche", 2], ["chicha", 3]], 10]
    returns: 103
    note: "94 de consumo más el 10 % (9.4, redondeado a 9)."
  - args: [[["causa", 1]]]
    returns: 22
    note: Sin propina; un parámetro por defecto resuelve el caso.
  - fn: precioDe
    args: ["chicharron"]
    returns: 32
    note: Las funciones de ayuda también se juzgan solas.
edge:
  - args: [[]]
    tag: con una mesa sin pedidos
  - args: [[["pulpo", 2], ["ceviche", 1]], 0]
    tag: con un plato que no está en la carta
  - fn: precioDe
    args: ["pulpo"]
    tag: en precioDe, con un plato que no está en la carta
  - fn: subtotal
    args: [["chicha", 0]]
    tag: en subtotal, con cantidad cero
  - fn: subtotal
    args: [["causa", 4]]
    tag: en subtotal, usada por sí sola
  - args: [[["ceviche", 10], ["chicharron", 10], ["causa", 10], ["chicha", 10]], 20]
    tag: con la propina máxima
random:
  count: 40
  seed: 44
  generate: |
    const platos = ["ceviche", "chicharron", "causa", "chicha"];
    const pedidos = Array.from({ length: rng.int(0, 6) }, () => [rng.pick(platos), rng.int(1, 10)]);
    return [pedidos, rng.int(0, 20)];
wrong:
  - |
    const CARTA = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };
    const precioDe = (plato) => CARTA[plato] ?? 0;
    const subtotal = ([plato, cantidad]) => precioDe(plato) * cantidad;
    function cuentaMesa(pedidos, propina) {
      let suma = 0;
      for (const p of pedidos) suma += subtotal(p);
      return suma + Math.round((suma * propina) / 100);
    }
  - |
    const CARTA = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };
    const precioDe = (plato) => CARTA[plato];
    const subtotal = ([plato, cantidad]) => precioDe(plato) * cantidad;
    function cuentaMesa(pedidos, propina = 0) {
      let suma = 0;
      for (const p of pedidos) suma += subtotal(p);
      return suma + Math.round((suma * propina) / 100);
    }
  - |
    function cuentaMesa(pedidos, propina = 0) {
      const carta = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };
      let suma = 0;
      for (const [plato, cantidad] of pedidos) suma += (carta[plato] ?? 0) * cantidad;
      return suma + Math.round((suma * propina) / 100);
    }
```

## Misión final

```exercise
id: js4-mision-chalupa
type: mission
title: Hora punta en La Chalupa
prompt: |
  Escribe `atender(pedido)`, que lleva un plato a su mesa y regresa, y úsala para atender todos los `pedidos` en orden.

  Chasqui está en la cocina (K) mirando al este. Las mesas están debajo del pasillo: la mesa `n` queda debajo de la casilla a `2 × n − 1` pasos de la cocina.

  - `robot.preparar(plato)` en la cocina pone el plato en la bandeja (solo cabe uno)
  - `robot.servir()` deja el plato en la mesa de abajo

  `atender` prepara el plato, lo lleva, lo sirve y **vuelve a la cocina mirando al este**. La lista `pedidos` cambia en cada prueba.
visual:
  figure:
    title: Cuántos pasos hay hasta cada mesa
    panes:
      - { table: { head: ["mesa", "pasos desde la cocina (2 × mesa − 1)"], rows: [["1", "1"], ["2", "3"], ["3", "5"], ["4", "7"], ["5", "9"]] } }
      - { label: "Un pedido", cards: [{ title: "{ mesa: 3, plato: \"ceviche\" }", rows: [["preparar", "\"ceviche\""], ["avanzar", "5"], ["servir", "mesa 3"], ["volver", "5 pasos y mirar al este"]] }] }
starter: |
  // pedidos llega de la caja, por ejemplo:
  // [{ mesa: 3, plato: "ceviche" }, { mesa: 1, plato: "chicharrón" }]

  const mediaVuelta = () => {
    robot.girarDerecha();
    robot.girarDerecha();
  };

  function atender(pedido) {
    // prepara, ve, sirve, vuelve
  }
solution: |
  const mediaVuelta = () => {
    robot.girarDerecha();
    robot.girarDerecha();
  };

  function atender({ mesa, plato }) {
    const pasos = 2 * mesa - 1;
    robot.preparar(plato);
    robot.avanzar(pasos);
    robot.servir();
    mediaVuelta();
    robot.avanzar(pasos);
    mediaVuelta();
  }

  for (const pedido of pedidos) {
    atender(pedido);
  }
hints:
  - "Dentro de `atender`, calcula los pasos una vez: `const pasos = 2 * mesa - 1;`"
  - "Fuera de la función, un `for...of` sobre `pedidos` que llame a `atender`."
world:
  theme: cocina
  level: 4
  dir: E
  map: |
    #############
    #K..........#
    ##1#2#3#4#5##
    #############
globals:
  pedidos:
    - { mesa: 3, plato: ceviche }
    - { mesa: 1, plato: chicharrón }
    - { mesa: 5, plato: causa }
scenarios:
  - {}
  - globals:
      pedidos:
        - { mesa: 2, plato: leche de tigre }
        - { mesa: 2, plato: chicha }
        - { mesa: 4, plato: arroz con mariscos }
        - { mesa: 1, plato: ceviche }
        - { mesa: 5, plato: ceviche }
  - globals:
      pedidos:
        - { mesa: 4, plato: chicha }
tests:
  - name: atender es una función
    expect: typeof atender === "function"
  - name: cada pedido llega a su mesa, en orden
    state: 'w.served.length === g.pedidos.length && w.served.every((s, i) => s.table === g.pedidos[i].mesa && s.dish === g.pedidos[i].plato)'
    msg: Los platos servidos no coinciden con los pedidos (mesa, plato u orden).
  - name: termina en la cocina mirando al este
    state: 'w.atKitchen && w.dir === "E"'
  - name: sin chocar
    state: '!w.crashed'
  - name: usa atender dentro de un bucle
    source: '\b(for|while)\b[\s\S]*\batender\s*\('
    msg: Llama a atender desde un bucle que recorra pedidos.
```

## Reto experto

```exercise
id: js4-reto-agrupar
type: challenge
title: El resumen para la cocina
prompt: |
  Delia quiere saber cuántos platos de cada tipo salieron. Escribe `contarPlatos(pedidos)` que devuelva un objeto `{ plato: cantidad }`, sin modificar el array que recibe. Puntos extra si lo haces con `reduce`.
starter: |
  function contarPlatos(pedidos) {
    return {};
  }

  console.log(contarPlatos([{ mesa: 1, plato: "ceviche" }, { mesa: 2, plato: "ceviche" }]));
solution: |
  const contarPlatos = (pedidos) =>
    pedidos.reduce((cuenta, { plato }) => ({ ...cuenta, [plato]: (cuenta[plato] ?? 0) + 1 }), {});

  console.log(contarPlatos([{ mesa: 1, plato: "ceviche" }, { mesa: 2, plato: "ceviche" }]));
hints:
  - "`cuenta[plato] ?? 0` da 0 la primera vez que aparece un plato."
tests:
  - name: dos ceviches y una chicha
    run: 'contarPlatos([{ mesa: 1, plato: "ceviche" }, { mesa: 2, plato: "chicha" }, { mesa: 3, plato: "ceviche" }])'
    equals: { ceviche: 2, chicha: 1 }
  - name: sin pedidos, objeto vacío
    run: contarPlatos([])
    equals: {}
  - name: no modifica la lista
    expect: '(() => { const p = [{ mesa: 1, plato: "causa" }]; contarPlatos(p); return p.length === 1 && Object.keys(p[0]).length === 2; })()'
```
