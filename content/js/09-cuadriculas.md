# Sesión 9 — Cuadrículas

## El encargo

Ate, zona industrial, lunes a las siete de la mañana. A la señora Gladys Huamán, dueña de Distribuidora Útiles Huamán, se le reventó una tubería durante el fin de semana. Su almacén está lleno de cajas de cuadernos para la campaña escolar, y papel con agua es engrudo. El perito del seguro llega a las seis de la tarde y quiere un plano: dónde hay agua, cuánta, y qué cajas corren peligro.

Le pusimos a Chasqui un sensor de piso que mide los centímetros de agua de cada casilla del almacén. Lo que devuelve no es una lista: es una **cuadrícula**, filas de casillas, como un tablero de ajedrez lleno de números. Hoy Chasqui aprende a recorrerla, a mirar las casillas vecinas y a no salirse del borde.

```escena
theme: museo
level: 4
dir: E
items: { a: caja }
caption: El almacén de la señora Gladys. Chasqui recorre los pasillos entre los estantes; cada caja (a) es una campaña escolar que no se puede mojar.
map: |
  ##########
  #R..a....#
  #.##.##a.#
  #a..a....#
  #..a..#a.#
  ##########
program: |
  robot.avanzar(3);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(4);
  robot.decir("aquí hay agua");
```

## Lo mínimo

Una cuadrícula es un **array de arrays**: cada elemento es una fila, y cada fila es un array de casillas. Se lee con dos índices: primero la fila (`y`), luego la columna (`x`).

```js run
const agua = [
  [0, 2, 5],
  [0, 0, 8],
];
console.log(agua[1][2]);
console.log(agua.length, agua[0].length);
console.log(agua[0].join(" "));
```

Para recorrerla entera hacen falta **dos bucles, uno dentro del otro**: el de afuera baja fila por fila y el de adentro recorre cada casilla de esa fila. Mira cómo Chasqui junta las casillas mojadas:

```anima
title: Dos bucles recorren la cuadrícula, fila por fila
code: |
  const agua = [[0, 3, 0], [2, 0, 4]];
  const mojadas = [];
  for (let y = 0; y < agua.length; y++) {
    for (let x = 0; x < agua[y].length; x++) {
      if (agua[y][x] > 0) {
        mojadas.push(`${x},${y}`);
      }
    }
  }
  console.log(mojadas.length);
grid: { map: [".3.", "2.4"], visited: mojadas }
show: [y, x, mojadas]
notes:
  3: "El bucle de afuera elige la fila y."
  4: "El de adentro recorre las columnas x de esa fila. Por cada y, x da la vuelta completa."
  5: "agua[y][x]: primero la fila, después la columna."
  6: "Una casilla mojada se anota con su clave \"x,y\" y se pinta en el plano."
```

Muchas veces no importa una casilla sola sino sus **vecinas**. Las cuatro vecinas de `(x, y)` están a un paso: derecha, izquierda, abajo y arriba. Una lista de desplazamientos evita escribir cuatro `if` casi iguales:

```js
const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [dx, dy] of PASOS) {
  const nx = x + dx;
  const ny = y + dy;
  if (ny >= 0 && ny < agua.length && nx >= 0 && nx < agua[ny].length) {
    // (nx, ny) es una vecina que existe
  }
}
```

```figura
title: Las vecinas de una casilla, en el centro y en la esquina
panes:
  - { label: "(2, 1) tiene 4 vecinas", grid: [".....", "..o..", "....."], marks: ["2,0", "1,1", "3,1", "2,2"] }
  - { label: "(0, 0) solo tiene 2: las otras caen fuera", grid: ["o....", ".....", "....."], marks: ["1,0", "0,1"] }
caption: "En el borde, algunas vecinas no existen. Por eso se revisa que `nx` y `ny` estén dentro antes de leer."
```

- **Crear**: con el literal, como arriba, o vacía con `Array.from({ length: alto }, () => Array(ancho).fill(0))`.
- **Tamaño**: `agua.length` es el alto (cuántas filas) y `agua[0].length` el ancho (cuántas columnas).
- **Los textos también son filas**: un plano como `["#..", ".#."]` se lee igual, `plano[y][x]`, porque un texto se indexa como un array.
- **Las diagonales** se suman agregando `[1, 1]`, `[1, -1]`, `[-1, 1]` y `[-1, -1]` a la lista de pasos: ocho vecinas.
- **Fuera del borde**: `agua[0][9]` es `undefined`, pero `agua[-1][0]` **rompe el programa**, porque `agua[-1]` ya es `undefined` y no tiene posición `0`. Revisa los límites antes, o lee con `agua[ny]?.[nx]`, que da `undefined` sin romper.

> **Trampa común:** escribir `agua[x][y]`. La fila va primero: `agua[y][x]`. En una cuadrícula cuadrada el error no se nota hasta que lees una casilla equivocada; en una rectangular, sale `undefined`.

<!-- legacy: grid-copy -->

<!-- mdn: arrays for grid-copy -->

## Práctica

```exercise
id: js9-predice-fila
type: predict
title: Fila primero
prompt: |
  ¿Qué imprime?
code: |
  const agua = [
    [4, 0, 7],
    [1, 9, 2],
  ];
  console.log(agua[1][0]);
  console.log(agua[0].length);
  console.log(agua[1].join("-"));
options:
  - "1\n3\n1-9-2"
  - "0\n3\n1-9-2"
  - "1\n2\n1-9-2"
  - "4\n3\n4-0-7"
answer: "1\n3\n1-9-2"
explain: |
  `agua[1]` es la segunda fila, `[1, 9, 2]`, y su posición `0` es el 1. `agua[0].length` es el ancho de una fila: 3 columnas.
```

```exercise
id: js9-predice-copia
type: predict
title: La copia que no era copia
prompt: |
  Chasqui hace una copia del plano para dibujar encima sin malograr el original. ¿Qué imprime?
code: |
  const plano = [[0, 0], [0, 0]];
  const copia = [...plano];
  copia[0][0] = 9;
  console.log(plano[0][0]);
options:
  - "0"
  - "9"
  - "undefined"
  - Un error
answer: "9"
explain: |
  `[...plano]` hace un array nuevo, pero sus elementos son **las mismas filas**. Cambiar `copia[0][0]` cambia la fila que comparten. Para copiar de verdad: `plano.map((fila) => [...fila])` o `structuredClone(plano)`.
```

```exercise
id: js9-completa-total
type: complete
title: Cuánta agua hay
prompt: |
  Suma los centímetros de agua de todas las casillas y cuenta cuántas están mojadas (más de 0).
visual:
  figure:
    input:
      label: agua
      grid: ["0301", "2004", "0050"]
      marks: ["1,0", "3,0", "0,1", "3,1", "2,2"]
    arrow: dos bucles
    output: { label: imprime, text: "15\n5" }
starter: |
  const agua = [
    [0, 3, 0, 1],
    [2, 0, 0, 4],
    [0, 0, 5, 0],
  ];
  let total = 0;
  let mojadas = 0;
  for (let y = 0; y < agua.length; y++) {
    for (let x = 0; x < ___; x++) {
      total += ___;
      if (agua[y][x] > 0) {
        mojadas++;
      }
    }
  }
  console.log(total);
  console.log(mojadas);
solution: |
  const agua = [
    [0, 3, 0, 1],
    [2, 0, 0, 4],
    [0, 0, 5, 0],
  ];
  let total = 0;
  let mojadas = 0;
  for (let y = 0; y < agua.length; y++) {
    for (let x = 0; x < agua[y].length; x++) {
      total += agua[y][x];
      if (agua[y][x] > 0) {
        mojadas++;
      }
    }
  }
  console.log(total);
  console.log(mojadas);
hints:
  - El bucle de adentro recorre las columnas de la fila `y`. ¿Cuántas tiene esa fila?
  - La casilla se lee con la fila primero.
tests:
  - name: 15 cm en total y 5 casillas mojadas
    output: "15\n5"
```

```exercise
id: js9-arregla-columnas
type: fix
title: Las columnas que faltaban
prompt: |
  El almacén tiene 2 filas y 4 columnas. Este código debía imprimir el agua de cada fila (`fila 0: 6` y `fila 1: 10`), pero imprime otra cosa. Hay **dos** errores.
starter: |
  const agua = [
    [1, 0, 2, 3],
    [4, 4, 0, 2],
  ];
  for (let y = 0; y < agua.length; y++) {
    let suma = 0;
    for (let x = 0; x < agua.length; x++) {
      suma += agua[x][y];
    }
    console.log(`fila ${y}: ${suma}`);
  }
solution: |
  const agua = [
    [1, 0, 2, 3],
    [4, 4, 0, 2],
  ];
  for (let y = 0; y < agua.length; y++) {
    let suma = 0;
    for (let x = 0; x < agua[y].length; x++) {
      suma += agua[y][x];
    }
    console.log(`fila ${y}: ${suma}`);
  }
hints:
  - "`agua.length` es cuántas filas hay. ¿Cuántas columnas tiene una fila?"
  - ¿Qué índice va primero, la fila o la columna?
tests:
  - name: el agua de cada fila
    output: "fila 0: 6\nfila 1: 10"
```

```exercise
id: js9-escribe-vecinos
type: write
title: Las vecinas mojadas
prompt: |
  Escribe `vecinasMojadas(agua, x, y)`, que devuelve cuántas de las **4 vecinas** de la casilla `(x, y)` tienen agua (más de 0). La casilla misma no cuenta, y en el borde no te salgas de la cuadrícula.
visual:
  figure:
    input:
      label: "vecinasMojadas(agua, 1, 1)"
      grid: ["050", "270", "301"]
      path: ["1,1"]
      marks: ["1,0", "0,1", "2,1", "1,2"]
    arrow: arriba 5, izquierda 2, derecha 0, abajo 0
    output: { label: devuelve, value: "2" }
starter: |
  function vecinasMojadas(agua, x, y) {
  }

  const agua = [
    [0, 5, 0],
    [2, 7, 0],
    [3, 0, 1],
  ];
  console.log(vecinasMojadas(agua, 1, 1));
solution: |
  const PASOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function vecinasMojadas(agua, x, y) {
    let cuenta = 0;
    for (const [dx, dy] of PASOS) {
      if ((agua[y + dy]?.[x + dx] ?? 0) > 0) {
        cuenta++;
      }
    }
    return cuenta;
  }

  const agua = [
    [0, 5, 0],
    [2, 7, 0],
    [3, 0, 1],
  ];
  console.log(vecinasMojadas(agua, 1, 1));
hints:
  - "Una lista `PASOS` con los cuatro desplazamientos y un `for...of` que la recorra."
  - "`agua[ny]?.[nx]` da `undefined` fuera del borde, y `undefined > 0` es `false`."
tests:
  - name: en el centro
    run: 'vecinasMojadas([[0, 5, 0], [2, 7, 0], [3, 0, 1]], 1, 1)'
    equals: 2
  - name: en la esquina de arriba a la izquierda
    run: 'vecinasMojadas([[0, 5, 0], [2, 7, 0], [3, 0, 1]], 0, 0)'
    equals: 2
  - name: en la esquina de abajo a la derecha
    run: 'vecinasMojadas([[0, 5, 0], [2, 7, 0], [3, 0, 1]], 2, 2)'
    equals: 0
  - name: en una sola fila
    run: 'vecinasMojadas([[4, 0, 6]], 1, 0)'
    equals: 2
  - name: la casilla misma no cuenta
    run: 'vecinasMojadas([[0, 0], [0, 9]], 1, 1)'
    equals: 0
```

```exercise
id: js9-escribe-mapa
type: write
title: Cuántas cajas hay
prompt: |
  Cuenta las cajas del almacén leyendo el mapa, y haz que Chasqui diga el número con `robot.decir(n)`.

  `robot.mapa()` devuelve el almacén como una cuadrícula de casillas: `"#"` es estante o pared, `"."` es piso libre y `"a"` es una caja. Se lee como siempre, `mapa[y][x]`. Se prueba en dos almacenes.
starter: |
  const mapa = robot.mapa();
  console.log(mapa.length, "filas");
solution: |
  const mapa = robot.mapa();
  let cajas = 0;
  for (const fila of mapa) {
    for (const casilla of fila) {
      if (casilla === "a") {
        cajas++;
      }
    }
  }
  robot.decir(cajas);
hints:
  - "Aquí no necesitas los índices: `for (const fila of mapa)` y, adentro, `for (const casilla of fila)`."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, map]
  items: { a: caja }
  map: |
    ##########
    #R..a....#
    #.##.##a.#
    #a..a....#
    #..a..#a.#
    ##########
scenarios:
  - tests:
      - name: dice 6
        state: 'w.said.at(-1) === "6"'
        msg: En este almacén hay 6 cajas.
  - map: |
      #######
      #Ra.a.#
      #.#.#a#
      #######
    tests:
      - name: dice 3
        state: 'w.said.at(-1) === "3"'
        msg: En este almacén hay 3 cajas.
tests:
  - name: usa dos bucles, uno dentro del otro
    source: '\bfor\b[^{]*\{[\s\S]*\bfor\b'
    msg: Recorre las filas y, dentro, las casillas de cada fila.
```

## El caso

```exercise
id: js9-caso-tuberia
type: case
title: La tubería que reventó
prompt: |
  Para cada tubería, suma el agua de su casilla y de sus 8 vecinas, y encuentra la tubería con la suma más alta.

  Bajo el almacén pasan cinco tuberías, de la `A` a la `E`. El agua sale por la que reventó y se reparte alrededor, así que esa tubería tiene más agua en su zona (su casilla y las 8 que la rodean) que ninguna otra. No te fíes de un número suelto: donde el piso está hundido se junta un charco, aunque ahí no haya ninguna fuga.

  Cuidado con los bordes: una tubería en la orilla tiene menos vecinas. Imprime una línea por tubería, como `Tubería A: 17`.
visual:
  figure:
    title: El plano del sensor, en cm de agua; las tuberías están resaltadas
    panes:
      - { label: "agua[y][x]: 8 filas (y) × 12 columnas (x)", grid: ["930200454000", "231000585001", "023220443002", "036301212177", "022300000077", "110454000087", "001565020120", "220453000100"], path: ["0,0", "4,6", "11,4", "7,1", "2,3"], labels: { "0,0": A, "4,6": B, "11,4": C, "7,1": D, "2,3": E } }
      - { label: tuberías, table: { head: ["tubería", "x", "y"], rows: [["A", "0", "0"], ["B", "4", "6"], ["C", "11", "4"], ["D", "7", "1"], ["E", "2", "3"]] } }
    caption: "Ejemplo: la zona de **A**, en la esquina de arriba a la izquierda, tiene solo 4 casillas: 9 + 3 + 2 + 3 = **17**."
starter: |
  const agua = [
    [9, 3, 0, 2, 0, 0, 4, 5, 4, 0, 0, 0],
    [2, 3, 1, 0, 0, 0, 5, 8, 5, 0, 0, 1],
    [0, 2, 3, 2, 2, 0, 4, 4, 3, 0, 0, 2],
    [0, 3, 6, 3, 0, 1, 2, 1, 2, 1, 7, 7],
    [0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 7, 7],
    [1, 1, 0, 4, 5, 4, 0, 0, 0, 0, 8, 7],
    [0, 0, 1, 5, 6, 5, 0, 2, 0, 1, 2, 0],
    [2, 2, 0, 4, 5, 3, 0, 0, 0, 1, 0, 0],
  ];

  const tuberias = [
    { nombre: "A", x: 0, y: 0 },
    { nombre: "B", x: 4, y: 6 },
    { nombre: "C", x: 11, y: 4 },
    { nombre: "D", x: 7, y: 1 },
    { nombre: "E", x: 2, y: 3 },
  ];

  // Así se lee la casilla de una tubería (fila primero):
  const { nombre, x, y } = tuberias[0];
  console.log(`Tubería ${nombre}, en su propia casilla: ${agua[y][x]}`);

  // TODO: para cada tubería, suma su casilla y sus 8 vecinas (las que existan)
  // e imprime: Tubería A: 17
solution: |
  const agua = [
    [9, 3, 0, 2, 0, 0, 4, 5, 4, 0, 0, 0],
    [2, 3, 1, 0, 0, 0, 5, 8, 5, 0, 0, 1],
    [0, 2, 3, 2, 2, 0, 4, 4, 3, 0, 0, 2],
    [0, 3, 6, 3, 0, 1, 2, 1, 2, 1, 7, 7],
    [0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 7, 7],
    [1, 1, 0, 4, 5, 4, 0, 0, 0, 0, 8, 7],
    [0, 0, 1, 5, 6, 5, 0, 2, 0, 1, 2, 0],
    [2, 2, 0, 4, 5, 3, 0, 0, 0, 1, 0, 0],
  ];

  const tuberias = [
    { nombre: "A", x: 0, y: 0 },
    { nombre: "B", x: 4, y: 6 },
    { nombre: "C", x: 11, y: 4 },
    { nombre: "D", x: 7, y: 1 },
    { nombre: "E", x: 2, y: 3 },
  ];

  function aguaEnLaZona(x, y) {
    let suma = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        suma += agua[y + dy]?.[x + dx] ?? 0;
      }
    }
    return suma;
  }

  let peor = tuberias[0];
  for (const tuberia of tuberias) {
    const zona = aguaEnLaZona(tuberia.x, tuberia.y);
    console.log(`Tubería ${tuberia.nombre}: ${zona}`);
    if (zona > aguaEnLaZona(peor.x, peor.y)) {
      peor = tuberia;
    }
  }
  console.log(`Reventó la ${peor.nombre}`);
answer: C
answerLabel: ¿Qué tubería reventó? (solo la letra)
reveal: |
  La C, en el borde derecho: 43 cm en su zona, aunque en su casilla solo hay 7. Muy cerca están la D (42) y la B (41). La A tiene la casilla más alta de todo el plano (9), pero es un charco en una esquina hundida: su zona suma 17.
hints:
  - "Dos bucles de -1 a 1 (`dy` y `dx`) recorren la casilla y sus 8 vecinas."
  - "`agua[y + dy]?.[x + dx] ?? 0` vale 0 fuera del borde, así no se rompe en la esquina."
```

## El juez

```exercise
id: js9-juez-alerta
type: judge
mode: function
function: alertaInundacion
title: El tablero de alerta
prompt: |
  Escribe `alertaInundacion(plano)`, que devuelve el plano con un número en cada casilla seca: cuántas de sus 8 vecinas tienen agua.

  El perito quiere un tablero que avise qué tan cerca del agua está cada casilla seca. En el plano, `"~"` es una casilla con agua y `"."` una seca. En el resultado, las casillas con agua se quedan como `"~"` y cada casilla seca se cambia por la cantidad de vecinas con agua (contando las diagonales), de `"0"` a `"8"`.

  **Entrada:** `plano`, un array de textos del mismo largo; cada texto es una fila.

  **Salida:** un array de textos del mismo tamaño.

  **Restricciones:** de 1 a 40 filas · de 1 a 40 columnas.
visual:
  figure:
    title: El ejemplo 1
    input: { label: plano, grid: ["~..", "...", "..~"], marks: ["0,0", "2,2"] }
    arrow: cuenta las 8 vecinas con agua
    output: { label: devuelve, grid: ["~10", "121", "01~"], marks: ["0,0", "2,2"], path: ["1,1"] }
    steps:
      - "La casilla del centro, `(1, 1)`, tiene agua en dos diagonales: vale 2."
      - "La casilla `(2, 0)` no toca ningún `~`: vale 0."
starter: |
  function alertaInundacion(plano) {
    return plano;
  }
solution: |
  function alertaInundacion(plano) {
    const resultado = [];
    for (let y = 0; y < plano.length; y++) {
      let fila = "";
      for (let x = 0; x < plano[y].length; x++) {
        if (plano[y][x] === "~") {
          fila += "~";
          continue;
        }
        let cuenta = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (plano[y + dy]?.[x + dx] === "~") {
              cuenta++;
            }
          }
        }
        fila += cuenta;
      }
      resultado.push(fila);
    }
    return resultado;
  }
hints:
  - "Arma cada fila del resultado como un texto que vas alargando, y al final de la fila haz `push`."
  - "Las 8 vecinas son los `dx` y `dy` de -1 a 1; la casilla misma es seca, así que no suma."
samples:
  - args: [["~..", "...", "..~"]]
    returns: ["~10", "121", "01~"]
  - args: [["~~.~", ".~..", "...."]]
    returns: ["~~3~", "3~31", "1110"]
    note: Una fila de 4 columnas y 3 filas; no es cuadrado.
edge:
  - args: [["~"]]
    tag: con una sola casilla con agua
  - args: [["."]]
    tag: con una sola casilla seca
  - args: [[".~..~."]]
    tag: con una sola fila
  - args: [["~", ".", ".", "~"]]
    tag: con una sola columna
  - args: [["~~~", "~.~", "~~~"]]
    tag: con una casilla rodeada de agua
  - args: [["....", "....", "...."]]
    tag: sin nada de agua
random:
  count: 30
  seed: 99
  generate: |
    const alto = rng.int(1, 40), ancho = rng.int(1, 40);
    const p = rng.int(5, 50) / 100;
    return [Array.from({ length: alto }, () => Array.from({ length: ancho }, () => (rng.next() < p ? "~" : ".")).join(""))];
wrong:
  - |
    function alertaInundacion(plano) {
      return plano.map((fila, y) => [...fila].map((c, x) => {
        if (c === "~") return "~";
        let n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (plano[y + dy]?.[x + dx] === "~") n++;
        return n;
      }).join(""));
    }
  - |
    function alertaInundacion(plano) {
      return plano.map((fila, y) => [...fila].map((c, x) => {
        if (c === "~") return "~";
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (plano[y + dy][x + dx] === "~") n++;
        return n;
      }).join(""));
    }
  - |
    function alertaInundacion(plano) {
      return plano.map((fila, y) => [...fila].map((c, x) => {
        if (c === "~") return "~";
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (plano[x + dx]?.[y + dy] === "~") n++;
        return n;
      }).join(""));
    }
```

## Misión final

```exercise
id: js9-mision-cajas
type: mission
title: Las cajas en peligro
prompt: |
  Marca en el mapa cada caja en peligro con `robot.marcar([x, y])` y haz que Chasqui diga cuántas son: `robot.decir(n)`.

  Una caja está **en peligro** si su casilla tiene agua o si la tiene alguna de sus **4 vecinas** (las diagonales no cuentan: el agua no pasa entre dos estantes). Tienes dos cuadrículas del mismo tamaño:

  - `robot.mapa()`: dónde están las cajas (`"a"`), los estantes (`"#"`) y el piso (`"."`);
  - `agua`: los centímetros que midió el sensor en cada casilla, `agua[y][x]`.

  El almacén y el agua cambian en cada prueba; en una, ninguna caja corre peligro.
visual:
  figure:
    title: La primera prueba, dibujada
    input: { label: "mapa (a = caja) y agua (casillas pintadas)", grid: ["##########", "#R..a....#", "#.##.##a.#", "#a..a....#", "#..a..#a.#", "##########"], marks: ["6,1", "7,1", "8,1", "8,2", "8,3", "7,3", "6,3", "8,4", "5,4"] }
    arrow: la caja o una de sus 4 vecinas tiene agua
    output: { label: "en peligro: 2 cajas", grid: ["##########", "#...a....#", "#.##.##a.#", "#a..a....#", "#..a..#a.#", "##########"], path: ["7,2", "7,4"] }
    steps:
      - "La caja `(7, 2)` está seca, pero arriba y abajo hay agua: en peligro."
      - "La caja `(4, 3)` solo toca agua en diagonal, en `(5, 4)`: no corre peligro."
starter: |
  const mapa = robot.mapa();
  console.log("agua en (8, 4):", agua[4][8]);
  // TODO: recorre el mapa; para cada caja, mira su casilla y sus 4 vecinas en agua
solution: |
  const mapa = robot.mapa();
  const PASOS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  let enPeligro = 0;
  for (let y = 0; y < mapa.length; y++) {
    for (let x = 0; x < mapa[y].length; x++) {
      if (mapa[y][x] !== "a") {
        continue;
      }
      const mojada = PASOS.some(([dx, dy]) => (agua[y + dy]?.[x + dx] ?? 0) > 0);
      if (mojada) {
        robot.marcar([x, y]);
        enPeligro++;
      }
    }
  }
  robot.decir(enPeligro);
hints:
  - "Agrega `[0, 0]` a la lista de pasos y así la caja misma se revisa junto con sus vecinas."
  - "`PASOS.some(...)` responde si al menos un paso cae en una casilla con agua."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, map, path]
  items: { a: caja }
  map: |
    ##########
    #R..a....#
    #.##.##a.#
    #a..a....#
    #..a..#a.#
    ##########
globals:
  agua:
    - [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    - [0, 0, 0, 0, 0, 0, 8, 12, 15, 0]
    - [0, 0, 0, 0, 0, 0, 0, 0, 18, 0]
    - [0, 0, 0, 0, 0, 0, 9, 14, 20, 0]
    - [0, 0, 0, 0, 0, 2, 0, 0, 22, 0]
    - [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
scenarios:
  - {}
  - map: |
      ########
      #R.a.a.#
      #.#..#.#
      #a..a..#
      ########
    globals:
      agua:
        - [0, 0, 0, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 1, 0]
        - [0, 0, 0, 0, 5, 0, 0, 0]
        - [0, 6, 3, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0, 0]
  - map: |
      #######
      #Ra...#
      #..a..#
      #....a#
      #######
    globals:
      agua:
        - [0, 0, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0]
        - [0, 4, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0]
tests:
  - name: marca justo las cajas en peligro
    state: 'JSON.stringify([...w.marks].sort()) === JSON.stringify(Object.keys(w.items).filter((k) => { const [x, y] = k.split(",").map(Number); return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (g.agua[y + dy]?.[x + dx] ?? 0) > 0); }).sort())'
    msg: Las casillas marcadas no son exactamente las cajas en peligro. Revisa las vecinas y los bordes.
  - name: dice cuántas son
    state: 'w.said.at(-1) === String(w.marks.length)'
    msg: Chasqui debe decir el número de cajas en peligro, al final.
  - name: recorre la cuadrícula con dos bucles
    source: '\bfor\b[^{]*\{[\s\S]*\bfor\b'
```

## Reto experto

```exercise
id: js9-reto-rotar
type: challenge
title: La foto del dron, de costado
prompt: |
  El dron del seguro tomó la foto del almacén girada. Escribe `rotar(plano)`, que devuelve una cuadrícula **nueva** girada 90° en sentido horario, sin modificar la original. Funciona con cuadrículas rectangulares: una de 2 filas y 3 columnas da una de 3 filas y 2 columnas.

  `rotar([[1, 2, 3], [4, 5, 6]])` → `[[4, 1], [5, 2], [6, 3]]`
starter: |
  function rotar(plano) {
    return plano;
  }

  console.log(rotar([[1, 2, 3], [4, 5, 6]]));
solution: |
  const rotar = (plano) =>
    plano[0].map((_, x) => plano.map((fila) => fila[x]).reverse());

  console.log(rotar([[1, 2, 3], [4, 5, 6]]));
hints:
  - La fila nueva número `x` está hecha con la columna `x` de la original, leída de abajo hacia arriba.
tests:
  - name: 2 × 3 se vuelve 3 × 2
    run: 'rotar([[1, 2, 3], [4, 5, 6]])'
    equals: [[4, 1], [5, 2], [6, 3]]
  - name: una sola casilla
    run: 'rotar([[7]])'
    equals: [[7]]
  - name: cuatro giros vuelven al inicio
    run: 'rotar(rotar(rotar(rotar([[1, 2], [3, 4], [5, 6]]))))'
    equals: [[1, 2], [3, 4], [5, 6]]
  - name: no modifica la original
    expect: '(() => { const p = [[1, 2], [3, 4]]; rotar(p); return JSON.stringify(p) === "[[1,2],[3,4]]"; })()'
```
