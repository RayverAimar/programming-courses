# Sesión 5 — Arrays

## El encargo

Gamarra, La Victoria, una semana antes de la campaña navideña. En el puesto 214 de la galería Los Telares, la señora Nélida Paucar vende polos por fardo a los mayoristas que bajan de Huancayo y de Huánuco. Su stock vive en su cabeza y en un cuaderno con manchas de café. Ayer vendió dos veces el mismo fardo de casacas y tuvo que devolver la plata con una sonrisa muy forzada.

Nélida no necesita un robot que cargue: tiene a su sobrino Brayan. Necesita uno que **lleve la cuenta**. Y el stock no es un número ni dos: es una fila de fardos que crece cuando llega mercadería y se achica con cada venta. Una variable por fardo no alcanza. Hoy Chasqui aprende a guardar **una lista entera** en una sola variable.

```escena
theme: barranco
level: 4
dir: E
items: { a: polo, b: jean, c: casaca, d: chompa }
api: [move, deliver, cargo]
caption: El pasillo de la galería Los Telares. Cada caja con letra es un fardo; Chasqui toma los del pedido y se los lleva a la combi del mayorista (el buzón del fondo).
map: |
  ##############
  #R.a.b.d.a.cD#
  ##############
program: |
  robot.avanzar(2);
  robot.tomar();
  robot.avanzar(8);
  robot.tomar();
  robot.avanzar();
  robot.entregar("2 prendas");
```

## Lo mínimo

Un **array** es una lista ordenada de valores en una sola variable. Cada valor tiene una posición, su **índice**, que empieza en **0**.

```js run
const fardos = ["polo", "jean", "casaca"];
console.log(fardos[0], fardos.length);
fardos.push("chompa");
console.log(fardos.includes("jean"), fardos.indexOf("gorro"));
const [primero, ...resto] = fardos;
console.log(primero, resto);
```

En el puesto, los fardos se apilan: el último que llega queda encima y es el primero que se vende. Eso es justo lo que hacen `push` y `pop` con el final del array. (En el dibujo de abajo el array es una fila; imagina el final como la cima de la pila.)

```anima
title: push pone al final, pop saca del final
code: |
  const pila = ["jean", "polo"];
  pila.push("casaca");
  pila.push("chompa");
  const vendido = pila.pop();
  const quedan = pila.length;
  console.log(vendido, quedan);
cells: { of: pila }
notes:
  2: "push agrega al final: la pila crece a 3."
  3: "Otro más encima: ahora son 4."
  4: "pop saca el último (la chompa) y lo devuelve."
  5: "length cuenta cuántos quedan: 3."
```

- **Crear y leer**: `const lista = [a, b, c]`, `lista[0]` es el primero, `lista[lista.length - 1]` el último. Un índice que no existe da `undefined`, no un error.
- **`push(x)`** agrega al final; **`pop()`** saca el último y lo devuelve (en un array vacío devuelve `undefined`).
- **Buscar**: `lista.includes(x)` dice `true` o `false`; `lista.indexOf(x)` da la posición, o **`-1`** si no está.
- **Recorrer**: `for (const fardo of fardos)` visita cada valor, en orden (lo viste en la sesión 3).
- **Desestructurar**: `const [a, b] = lista` saca las primeras posiciones; `const [primero, ...resto] = lista` separa el primero del resto.
- **Copiar**: `const copia = [...lista]` hace un array nuevo con los mismos valores.

Ese último punto importa más de lo que parece. Un array no se copia con `=`: el `=` le pone **otro nombre al mismo array**.

```anima
title: Dos nombres, un solo array
code: |
  const vitrina = ["polo", "jean"];
  const otroNombre = vitrina;
  const copia = [...vitrina];
  otroNombre.push("gorro");
  console.log(vitrina.length, copia.length);
refs: true
caption: "Un nombre con flecha no contiene el array: lo señala. Dos flechas al mismo cuadro son un solo array."
notes:
  1: "vitrina señala un array con dos prendas."
  2: "otroNombre no es una copia: es una segunda flecha al mismo array. No nació ningún array nuevo."
  3: "copia sí es un array nuevo, con los mismos valores; tiene su propia flecha."
  4: "Se agrega por otroNombre... y como es el mismo array, vitrina también lo ve."
  5: "vitrina tiene 3, la copia sigue con 2."
```

`const` no impide cambiar el contenido: impide que el nombre apunte a otro array. Por eso `const fardos = []` y luego `fardos.push(…)` está bien. En el dibujo, el candado está en la flecha, no en el cuadro:

```anima
title: const cierra la flecha, no el contenido
code: |
  const fardos = ["polo"];
  fardos.push("jean");
  fardos = ["gorro"];
refs: true
locked: [fardos]
notes:
  1: "fardos señala un array."
  2: "El contenido sí cambia: la flecha sigue siendo la misma."
  3: "Cambiar a qué señala el nombre es lo que `const` prohíbe: da error."
```

> **Trampa común:** `if (lista.indexOf(x))` para preguntar si `x` está. Si `x` está en la posición `0`, `indexOf` da `0`, que es *falsy*, y si no está da `-1`, que es *truthy*: el `if` funciona exactamente al revés en esos dos casos. Para preguntar "¿está?", usa `includes`.

<!-- legacy: array-includes -->

<!-- legacy: array-copy -->

<!-- mdn: arrays array-push array-pop array-includes array-indexof destructuring spread -->

## Práctica

```exercise
id: js5-predice-tallas
type: predict
title: La caja de tallas
prompt: |
  ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: tallas, cells: ["S", "M", "L", "XL"] }
code: |
  const tallas = ["S", "M", "L", "XL"];
  console.log(tallas[1], tallas.length, tallas[tallas.length - 1], tallas[4]);
options:
  - "M 4 XL undefined"
  - "S 4 XL undefined"
  - "M 3 L XL"
  - "M 4 XL Error"
answer: "M 4 XL undefined"
explain: |
  El índice empieza en 0, así que `tallas[1]` es la segunda: `"M"`. Hay 4 tallas, la última está en la posición `4 - 1 = 3`, y `tallas[4]` no existe: vale `undefined`, sin error.
```

```exercise
id: js5-predice-copia
type: predict
title: La vitrina de Brayan
prompt: |
  Brayan quiere probar cómo quedaría la vitrina con un gorro, "sin tocar la de verdad". ¿Qué imprime?
code: |
  const vitrina = ["polo", "jean"];
  const prueba = vitrina;
  prueba.push("gorro");
  console.log(vitrina.length);
options:
  - "2"
  - "3"
  - "undefined"
  - "Error"
answer: "3"
explain: |
  `prueba = vitrina` no copia: le da otro nombre al mismo array, así que el gorro entró a la vitrina de verdad. Para probar sin tocarla: `const prueba = [...vitrina];`.
```

```exercise
id: js5-completa-pila
type: complete
title: La pila del puesto
prompt: |
  Llega un fardo de chompas y se pone encima; luego un mayorista compra el de encima. Completa los huecos para que la pila y la venta queden bien.
visual:
  figure:
    input: { label: "pila al abrir", cells: ["jean", "polo", "casaca"] }
    arrow: "llega chompa, se vende el de encima"
    output: { label: "pila al cerrar", cells: ["jean", "polo", "casaca"] }
    steps:
      - "La chompa entra encima (al final) y sale en la venta: la pila vuelve a quedar igual."
starter: |
  const pila = ["jean", "polo", "casaca"];
  pila.___("chompa");
  const vendido = pila.___();
  console.log(`Se vendió: ${vendido}`);
  console.log(`Quedan ${pila.___} fardos; encima está ${pila[pila.length - ___]}`);
solution: |
  const pila = ["jean", "polo", "casaca"];
  pila.push("chompa");
  const vendido = pila.pop();
  console.log(`Se vendió: ${vendido}`);
  console.log(`Quedan ${pila.length} fardos; encima está ${pila[pila.length - 1]}`);
hints:
  - Agregar al final es `push`; sacar el último es `pop`.
  - El último elemento está en la posición `length - 1`.
tests:
  - name: se vende la chompa
    outputIncludes: "Se vendió: chompa"
  - name: quedan 3 y encima la casaca
    outputIncludes: "Quedan 3 fardos; encima está casaca"
```

```exercise
id: js5-arregla-indexof
type: fix
title: El polo que "no había"
prompt: |
  Un mayorista pidió polos y el programa del puesto dijo que no había, con un fardo de polos ahí mismo. Pidió chompas, que no hay, y dijo que sí. Arregla la condición.
visual:
  figure:
    input: { label: stock, cells: ["polo", "jean", "casaca"] }
    arrow: "stock.indexOf(...)"
    output: { label: "lo que devuelve", table: { head: ["pregunta", "indexOf", "el if lo lee como"], rows: [["polo", "0", "falso (¡pero sí hay!)"], ["chompa", "-1", "verdadero (¡pero no hay!)"]] } }
starter: |
  const stock = ["polo", "jean", "casaca"];

  function hay(prenda) {
    if (stock.indexOf(prenda)) {
      return "sí hay";
    }
    return "no hay";
  }

  console.log("polo:", hay("polo"));
  console.log("chompa:", hay("chompa"));
solution: |
  const stock = ["polo", "jean", "casaca"];

  function hay(prenda) {
    if (stock.includes(prenda)) {
      return "sí hay";
    }
    return "no hay";
  }

  console.log("polo:", hay("polo"));
  console.log("chompa:", hay("chompa"));
hints:
  - "`indexOf` devuelve una posición, no un sí o un no. ¿Qué método responde exactamente \"¿está?\"?"
tests:
  - name: hay polo
    run: hay("polo")
    equals: sí hay
  - name: no hay chompa
    run: hay("chompa")
    equals: no hay
  - name: hay casaca
    run: hay("casaca")
    equals: sí hay
```

```exercise
id: js5-predice-desestructura
type: predict
title: El primero a la vitrina
prompt: |
  Los fardos llegan en orden de llegada. El primero va a la vitrina y el resto a la trastienda. ¿Qué imprime?
code: |
  const llegada = ["casaca", "polo", "jean", "chompa"];
  const [vitrina, ...trastienda] = llegada;
  console.log(vitrina, trastienda.length, llegada.length);
options:
  - "casaca 3 4"
  - "casaca 3 1"
  - "[casaca] 3 4"
  - "chompa 3 4"
answer: "casaca 3 4"
explain: |
  `[vitrina, ...trastienda]` toma la primera posición y junta las demás en un array **nuevo**. `llegada` no cambia: sigue con 4.
```

```exercise
id: js5-escribe-sin-repetir
type: write
title: La lista sin repetidos
prompt: |
  Escribe `sinRepetidos(pedidos)`, que devuelve un array **nuevo** con cada prenda una sola vez, en el orden en que apareció por primera vez.

  Los mayoristas mandan su pedido por WhatsApp, a pedazos, y repiten cosas. Brayan necesita la lista limpia para buscar los fardos. No modifiques el array que recibes.
visual:
  figure:
    input: { label: pedidos, cells: ["polo", "jean", "polo", "casaca", "jean"], highlight: [2, 4] }
    arrow: "las marcadas ya habían salido"
    output: { label: devuelve, cells: ["polo", "jean", "casaca"] }
starter: |
  function sinRepetidos(pedidos) {
  }

  console.log(sinRepetidos(["polo", "jean", "polo", "casaca", "jean"]));
solution: |
  function sinRepetidos(pedidos) {
    const limpia = [];
    for (const prenda of pedidos) {
      if (!limpia.includes(prenda)) {
        limpia.push(prenda);
      }
    }
    return limpia;
  }

  console.log(sinRepetidos(["polo", "jean", "polo", "casaca", "jean"]));
hints:
  - Empieza con un array vacío y recorre `pedidos` con `for...of`.
  - "Agrega una prenda solo si tu lista nueva todavía no la incluye: `!limpia.includes(prenda)`."
tests:
  - name: el ejemplo
    run: 'sinRepetidos(["polo", "jean", "polo", "casaca", "jean"])'
    equals: ["polo", "jean", "casaca"]
  - name: todos iguales
    run: 'sinRepetidos(["gorro", "gorro", "gorro"])'
    equals: ["gorro"]
  - name: lista vacía
    run: sinRepetidos([])
    equals: []
  - name: no modifica el original
    expect: '(() => { const p = ["polo", "polo"]; sinRepetidos(p); return p.length === 2; })()'
    msg: Arma un array nuevo con push; no borres nada del que recibes.
```

## El caso

```exercise
id: js5-caso-fardo
type: case
title: El fardo que se esfumó
prompt: |
  Encuentra el código del fardo que estaba en la mañana, no se vendió y en la noche ya no estaba.

  Nélida salió a almorzar y dejó a Brayan a cargo. En la mañana anotó los 24 fardos del puesto; Brayan anotó lo que vendió, y en la noche contaron de nuevo. Falta uno. Ojo: a mediodía llegó un fardo nuevo, así que en la noche hay uno que en la mañana no estaba; ese no es misterio.

  Para cada fardo de la mañana, pregunta dos cosas: ¿se vendió? ¿está en la noche? El que responda "no" y "no" es el que buscas.
visual:
  figure:
    title: El método, en un ejemplo chico (una columna por fardo de la mañana)
    panes:
      - { label: "mañana: A, B, C, D · vendidos: B · noche: A, D", table: { head: ["fardo de la mañana", "A", "B", "C", "D"], rows: [["¿se vendió?", "no", "sí", "no", "no"], ["¿está en la noche?", "sí", "—", "no", "sí"], ["¿falta?", "", "", "**sí**", ""]] } }
      - { label: "en el ejemplo chico, falta", value: "C" }
starter: |
  const manana = ["P-101", "P-102", "J-210", "C-305", "P-103", "CH-401", "J-211", "P-104",
    "C-306", "CH-402", "J-212", "P-105", "C-307", "P-106", "CH-403", "J-213", "C-308", "P-107",
    "J-214", "CH-404", "P-108", "C-309", "J-215", "P-109"];
  const vendidos = ["P-102", "J-211", "C-306", "P-105", "CH-403", "J-214", "P-108", "C-309", "P-101"];
  const noche = ["J-210", "C-305", "P-103", "CH-401", "P-104", "CH-402", "J-212", "C-307", "P-106",
    "J-213", "C-308", "P-107", "CH-404", "J-216", "P-109"];

  console.log(`Mañana: ${manana.length} · vendidos: ${vendidos.length} · noche: ${noche.length}`);

  // TODO: recorre manana y, para cada fardo, mira si vendidos lo incluye
  // y si noche lo incluye. Imprime el que no está en ninguna de las dos.
solution: |
  const manana = ["P-101", "P-102", "J-210", "C-305", "P-103", "CH-401", "J-211", "P-104",
    "C-306", "CH-402", "J-212", "P-105", "C-307", "P-106", "CH-403", "J-213", "C-308", "P-107",
    "J-214", "CH-404", "P-108", "C-309", "J-215", "P-109"];
  const vendidos = ["P-102", "J-211", "C-306", "P-105", "CH-403", "J-214", "P-108", "C-309", "P-101"];
  const noche = ["J-210", "C-305", "P-103", "CH-401", "P-104", "CH-402", "J-212", "C-307", "P-106",
    "J-213", "C-308", "P-107", "CH-404", "J-216", "P-109"];

  for (const fardo of manana) {
    if (!vendidos.includes(fardo) && !noche.includes(fardo)) {
      console.log("Falta:", fardo);
    }
  }
answer: J-215
answerLabel: ¿Qué fardo falta? (su código)
reveal: |
  El J-215, un fardo de jeans. Las cuentas cuadran: 24 en la mañana − 9 vendidos = 15, y en la noche hay 15... pero uno de esos 15 es el J-216 que llegó a mediodía. Contar no bastaba: había que comparar las listas. (Brayan juró que no sabía nada. A la semana apareció con jeans nuevos.)
hints:
  - "Un `for...of` sobre `manana`, y dentro un `if` con dos preguntas unidas por `&&`."
  - "\"No está en vendidos\" se escribe `!vendidos.includes(fardo)`."
```

## El juez

Como en la sesión 4, el juez **llama a tus funciones** y compara lo que devuelven.

```exercise
id: js5-juez-pila
type: judge
mode: function
function: pilaFinal
title: La pila al cerrar
prompt: |
  Escribe `pilaFinal(pila, ops)`, que devuelve cómo queda la pila de fardos después de todas las operaciones, y `ventas(pila, ops)`, que devuelve lo que se vendió, en orden.

  En el puesto los fardos se apilan por talla (`"S"`, `"M"`, `"L"`, `"XL"`). `pila` es la pila al abrir, de abajo hacia arriba (el último es el de encima). `ops` es la lista de lo que pasó en el día, en orden:

  - `["+", talla]`: llega un fardo de esa talla y se pone **encima**.
  - `["-"]`: un mayorista compra el fardo de **encima**. Si la pila está vacía, no pasa nada (y no se vende nada).

  No modifiques el array `pila` que recibes: trabaja sobre una copia.

  **Restricciones:** la pila empieza con 0 a 10 fardos · 0 a 40 operaciones.
visual:
  figure:
    title: El ejemplo 1, operación por operación
    panes:
      - { table: { head: ["operación", "pila después (de abajo hacia arriba)", "vendido"], rows: [["al abrir", "M", ""], ["[\"+\", \"L\"]", "M, L", ""], ["[\"+\", \"S\"]", "M, L, S", ""], ["[\"-\"]", "M, L", "S"], ["[\"+\", \"XL\"]", "M, L, XL", ""], ["[\"-\"]", "M, L", "XL"], ["[\"-\"]", "M", "L"]] } }
      - { label: "pilaFinal devuelve", cells: ["M"] }
      - { label: "ventas devuelve", cells: ["S", "XL", "L"] }
starter: |
  function pilaFinal(pila, ops) {
  }

  function ventas(pila, ops) {
  }
solution: |
  function pilaFinal(pila, ops) {
    const copia = [...pila];
    for (const [tipo, talla] of ops) {
      if (tipo === "+") {
        copia.push(talla);
      } else {
        copia.pop();
      }
    }
    return copia;
  }

  function ventas(pila, ops) {
    const copia = [...pila];
    const vendidas = [];
    for (const [tipo, talla] of ops) {
      if (tipo === "+") {
        copia.push(talla);
      } else if (copia.length > 0) {
        vendidas.push(copia.pop());
      }
    }
    return vendidas;
  }
hints:
  - "Desestructura cada operación en el `for...of`: `for (const [tipo, talla] of ops)`. En `[\"-\"]`, `talla` queda `undefined` y no importa."
  - "En `ventas`, antes de `pop`, pregunta si la pila tiene algo: `pop` de una pila vacía devuelve `undefined`, y eso no es una venta."
samples:
  - args: [["M"], [["+", "L"], ["+", "S"], ["-"], ["+", "XL"], ["-"], ["-"]]]
    returns: ["M"]
    note: La tabla de arriba, paso a paso.
  - fn: ventas
    args: [["M"], [["+", "L"], ["+", "S"], ["-"], ["+", "XL"], ["-"], ["-"]]]
    returns: ["S", "XL", "L"]
    note: El mismo día, ahora lo vendido. El juez prueba las dos funciones.
  - args: [["S", "S"], []]
    returns: ["S", "S"]
    note: Un día sin movimiento.
edge:
  - args: [[], [["-"], ["-"]]]
    tag: cuando piden vender con la pila vacía
  - fn: ventas
    args: [[], [["-"], ["+", "M"], ["-"], ["-"]]]
    tag: en ventas, cuando a ratos la pila está vacía
  - fn: ventas
    args: [["L", "XL"], [["-"], ["-"], ["-"]]]
    tag: en ventas, vendiendo la pila entera y uno más
  - args: [["XL", "S", "M"], [["+", "L"], ["+", "L"]]]
    tag: cuando solo llegan fardos
  - fn: ventas
    args: [["XL", "S", "M"], [["+", "L"]]]
    tag: en ventas, un día sin ventas
random:
  count: 40
  seed: 55
  generate: |
    const tallas = ["S", "M", "L", "XL"];
    const pila = Array.from({ length: rng.int(0, 10) }, () => rng.pick(tallas));
    const ops = Array.from({ length: rng.int(0, 40) }, () => (rng.int(0, 1) === 0 ? ["-"] : ["+", rng.pick(tallas)]));
    return [pila, ops];
wrong:
  - |
    function pilaFinal(pila, ops) {
      const copia = [...pila];
      for (const [tipo, talla] of ops) {
        if (tipo === "+") copia.push(talla);
        else copia.shift();
      }
      return copia;
    }
    function ventas(pila, ops) {
      const copia = [...pila];
      const vendidas = [];
      for (const [tipo, talla] of ops) {
        if (tipo === "+") copia.push(talla);
        else if (copia.length > 0) vendidas.push(copia.shift());
      }
      return vendidas;
    }
  - |
    function pilaFinal(pila, ops) {
      const copia = [...pila];
      for (const [tipo, talla] of ops) {
        if (tipo === "+") copia.push(talla);
        else copia.pop();
      }
      return copia;
    }
    function ventas(pila, ops) {
      const copia = [...pila];
      const vendidas = [];
      for (const [tipo, talla] of ops) {
        if (tipo === "+") copia.push(talla);
        else vendidas.push(copia.pop());
      }
      return vendidas;
    }
  - |
    function pilaFinal(pila, ops) {
      const copia = [];
      for (const [tipo, talla] of ops) {
        if (tipo === "+") copia.push(talla);
        else copia.pop();
      }
      return copia;
    }
    function ventas(pila, ops) {
      const copia = [];
      const vendidas = [];
      for (const [tipo, talla] of ops) {
        if (tipo === "+") copia.push(talla);
        else if (copia.length > 0) vendidas.push(copia.pop());
      }
      return vendidas;
    }
```

## Misión final

```exercise
id: js5-mision-gamarra
type: mission
title: El pedido de Huancayo
prompt: |
  Recorre el pasillo, quédate con **una** prenda de cada tipo del `pedido` y entrégalas en la combi del fondo (D) con la etiqueta `` `${cuantas} prendas` ``.

  Chasqui empieza mirando al este. En el pasillo hay fardos (las cajas con letra). En cada casilla:

  - `robot.tomar()` levanta el fardo de esa casilla y devuelve su nombre (`"polo"`, `"jean"`…), o `null` si no había nada.
  - Si esa prenda **no está en el pedido**, o **ya llevas una igual**, devuélvela con `robot.soltar(prenda)`.

  Lleva tu propio array con lo que te quedaste. Al llegar al fondo, `robot.entregar(...)` con la cantidad: `"2 prendas"`. El pasillo y el pedido cambian en cada prueba.
visual:
  figure:
    title: "El primer pasillo, con el pedido [\"polo\", \"casaca\"] (una columna por casilla)"
    panes:
      - { table: { head: ["casilla", "a", "b", "d", "a", "c"], rows: [["prenda", "polo", "jean", "chompa", "polo", "casaca"], ["¿en el pedido?", "sí", "no", "no", "sí", "sí"], ["¿ya llevo una?", "no", "", "", "**sí**", "no"], ["Chasqui", "se la queda", "la suelta", "la suelta", "la suelta", "se la queda"]] } }
      - { label: "al llegar a D", value: "entregar(\"2 prendas\")" }
starter: |
  // pedido llega por WhatsApp, por ejemplo: ["polo", "casaca"]
  const llevo = [];

  robot.avanzar();
  const prenda = robot.tomar();
  console.log(prenda);
solution: |
  const llevo = [];

  while (!robot.hayPared()) {
    robot.avanzar();
    const prenda = robot.tomar();
    if (prenda !== null) {
      if (pedido.includes(prenda) && !llevo.includes(prenda)) {
        llevo.push(prenda);
      } else {
        robot.soltar(prenda);
      }
    }
  }
  robot.entregar(`${llevo.length} prendas`);
hints:
  - "El recorrido es el de la sesión 3: `while (!robot.hayPared())`, avanzar y luego mirar la casilla."
  - "Te la quedas si `pedido.includes(prenda) && !llevo.includes(prenda)`; si no, `robot.soltar(prenda)`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, deliver, cargo]
  items: { a: polo, b: jean, c: casaca, d: chompa }
  map: |
    ##############
    #R.a.b.d.a.cD#
    ##############
globals:
  pedido: ["polo", "casaca"]
scenarios:
  - {}
  - map: |
      ###################
      #R.d.c.c.b.ab.d.aD#
      ###################
    globals: { pedido: ["jean", "chompa", "polo"] }
  - map: |
      ########
      #R.bb.D#
      ########
    globals: { pedido: ["jean"] }
tests:
  - name: lleva una prenda de cada tipo del pedido
    state: 'JSON.stringify([...w.inventory].sort()) === JSON.stringify([...g.pedido].sort())'
    msg: Lo que lleva Chasqui no es el pedido (sobra, falta o hay repetidas). Mira la tabla de arriba.
  - name: llega a la combi y entrega una vez, con la cantidad
    state: 'w.atGoal && w.delivered.length === 1 && w.delivered[0] === `${g.pedido.length} prendas`'
    msg: Entrega una sola vez, en D, con una etiqueta como "2 prendas".
  - name: sin chocar
    state: '!w.crashed'
  - name: usa includes
    source: '\.includes\s*\('
```

## Reto experto

```exercise
id: js5-reto-rotar
type: challenge
title: La vitrina que rota
prompt: |
  Nélida rota los maniquíes de la vitrina: cada día, el primero pasa al final. Escribe `rotar(vitrina, dias)`, que devuelve la vitrina después de `dias` días, **sin modificar** la que recibe. `dias` puede ser más grande que la cantidad de maniquíes (y la vitrina puede estar vacía).
starter: |
  function rotar(vitrina, dias) {
    return vitrina;
  }

  console.log(rotar(["polo", "jean", "casaca"], 1));
solution: |
  function rotar(vitrina, dias) {
    if (vitrina.length === 0) {
      return [];
    }
    const k = dias % vitrina.length;
    return [...vitrina.slice(k), ...vitrina.slice(0, k)];
  }

  console.log(rotar(["polo", "jean", "casaca"], 1));
hints:
  - "Rotar `vitrina.length` días deja todo igual: con `dias % vitrina.length` basta."
  - "`lista.slice(desde, hasta)` copia un tramo; junta dos tramos con `[...a, ...b]`."
tests:
  - name: un día
    run: 'rotar(["polo", "jean", "casaca"], 1)'
    equals: ["jean", "casaca", "polo"]
  - name: siete días con tres maniquíes
    run: 'rotar(["polo", "jean", "casaca"], 7)'
    equals: ["jean", "casaca", "polo"]
  - name: cero días
    run: 'rotar(["polo", "jean"], 0)'
    equals: ["polo", "jean"]
  - name: vitrina vacía
    run: rotar([], 3)
    equals: []
  - name: no modifica la vitrina original
    expect: '(() => { const v = ["a", "b", "c"]; rotar(v, 1); return v[0] === "a" && v.length === 3; })()'
```
