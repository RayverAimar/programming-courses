# Sesión 6 — Objetos

## El encargo

Aeropuerto Jorge Chávez, Callao, oficina de Objetos Perdidos del hall de llegadas. La señorita Milagros Chumpitaz tiene ahí 1 340 cosas: maletas, charangos, un ataúd de utilería (de una tuna universitaria), una dentadura y 212 cargadores de celular. Todo está en una hoja de cálculo donde alguien ordenó una sola columna y desde entonces el color de cada objeto es el de otro.

Milagros quiere que Chasqui atienda el mostrador de noche. Pero un objeto perdido no es un número ni una lista: tiene **tipo, color, dónde y a qué hora se encontró, y a veces una etiqueta con dueño**. Cada dato con su nombre, y todos juntos. Hoy Chasqui aprende a guardar **cosas con propiedades**: objetos.

```escena
theme: museo
level: 4
dir: E
items: { a: mochila, b: charango, c: paraguas, d: laptop, e: peluche }
api: [move, deliver, cargo]
caption: El depósito de Objetos Perdidos. Chasqui sale del mostrador (D), saca el charango del estante 2 y lo trae para entregarlo.
map: |
  #############
  #DR.........#
  ###a#b#c#d#e#
  #############
program: |
  robot.avanzar(3);
  robot.girarDerecha();
  robot.avanzar();
  robot.tomar();
  robot.girarDerecha();
  robot.girarDerecha();
  robot.avanzar();
  robot.girarIzquierda();
  robot.avanzar(4);
  robot.entregar("Ruth Mamani");
```

## Lo mínimo

Un **objeto** agrupa valores con nombre: cada uno es una **propiedad**, `clave: valor`. Se lee con punto o con corchetes.

```js run
const objeto = { tipo: "charango", color: "marrón", hallazgo: { puerta: 14, hora: 15 } };
console.log(objeto.tipo, objeto["color"], objeto.hallazgo.puerta);
console.log(Object.keys(objeto));
console.log(objeto.etiqueta?.nombre ?? "sin etiqueta");
console.log(JSON.stringify(objeto.hallazgo));
```

Mira cómo se arma un objeto y cómo se lee con una clave que viene en una variable:

```anima
title: Un objeto es una ficha con campos con nombre
code: |
  const tipo = "mochila";
  const color = "negra";
  const objeto = { tipo, color, puerta: 14 };
  const campo = "color";
  const valor = objeto[campo];
  objeto.entregado = true;
  const { puerta, entregado } = objeto;
  console.log(valor, puerta, entregado);
notes:
  3: "{ tipo, color } es la forma corta de { tipo: tipo, color: color }."
  5: "La clave está en la variable campo: con corchetes se lee objeto[\"color\"]."
  6: "Asignar una propiedad nueva la agrega a la ficha."
  7: "Desestructurar saca propiedades por su nombre, en variables con ese nombre."
```

- **Leer**: `objeto.tipo` cuando conoces el nombre al escribir el código; `objeto[campo]` cuando el nombre está en una variable (o tiene espacios: `objeto["fecha de ingreso"]`). Una propiedad que no existe da `undefined`.
- **Forma corta**: `{ tipo, color }` si las variables se llaman como las propiedades.
- **Anidados**: un objeto puede tener objetos (y arrays) adentro: `objeto.hallazgo.puerta`.
- **Recorrer**: `Object.keys(o)` da las claves y `Object.entries(o)` los pares `[clave, valor]`, que se recorren con `for (const [clave, valor] of Object.entries(o))`.
- **Desestructurar**: `const { tipo, color } = objeto`, también en parámetros, como en la sesión 4.
- **Encadenamiento opcional**: `objeto.etiqueta?.nombre` da `undefined` en vez de romperse si no hay etiqueta (lo viste en la sesión 2; aquí lo vas a necesitar de verdad).
- **JSON**: el formato de texto en que viajan los objetos entre sistemas. `JSON.stringify(objeto)` lo convierte en texto y `JSON.parse(texto)` lo devuelve a objeto.

```figura
title: El mismo dato, como objeto y como texto
input: { label: Objeto en tu programa, cards: [{ title: lectura, rows: [["distancia", "40"], ["unidad", "\"cm\""]] }] }
arrow: stringify → ← parse
output: { label: Texto JSON (lo que viaja), text: "{\"distancia\": 40, \"unidad\": \"cm\"}" }
steps:
  - "JSON exige comillas dobles también en las claves; por eso `{distancia: 40}` falla al leerlo (lo verás en la sesión 15)."
  - "Las funciones y los `undefined` no viajan: `stringify` los deja fuera."
```

Recorrer un objeto con `Object.entries`, paso a paso:

```anima
title: Object.entries da los pares clave-valor
code: |
  const porTipo = { mochila: 3, charango: 1, paraguas: 7 };
  let total = 0;
  for (const [tipo, cantidad] of Object.entries(porTipo)) {
    total += cantidad;
  }
  console.log(total);
notes:
  3: "Cada vuelta trae un par: la clave en tipo, el valor en cantidad."
  6: "3 + 1 + 7: once objetos en total."
```

Como los arrays, un objeto no se copia con `=`: dos nombres apuntan a la misma ficha. Una copia es `{ ...objeto }`.

```anima
title: Dos nombres, una sola ficha
code: |
  const ficha = { plato: "ceviche", precio: 18 };
  const otra = ficha;
  const copia = { ...ficha };
  otra.precio = 20;
  console.log(ficha.precio, copia.precio);
refs: true
notes:
  1: "ficha señala un objeto con dos campos."
  2: "otra es una segunda flecha a la misma ficha. No nació ninguna ficha nueva."
  3: "{ ...ficha } arma una ficha nueva con los mismos campos; copia señala esa."
  4: "Se cambia el precio por otra... y ficha lo ve, porque es la misma ficha."
  5: "ficha.precio vale 20; copia.precio sigue en 18."
```

> **Trampa común:** escribir `objeto.campo` cuando la clave está *en la variable* `campo`. El punto busca una propiedad que se llama literalmente `"campo"`, que no existe: da `undefined`. Con una variable, corchetes: `objeto[campo]`.

<!-- legacy: object-shorthand -->

<!-- legacy: object-entries -->

<!-- legacy: json -->

<!-- mdn: objects object-shorthand object-entries optional-chaining destructuring json -->

## Práctica

```exercise
id: js6-predice-campo
type: predict
title: El campo que no aparecía
prompt: |
  ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: maleta, cards: [{ title: maleta, rows: [["color", "\"azul\""], ["kilos", "23"]] }] }
      - { label: campo, value: "\"color\"" }
code: |
  const maleta = { color: "azul", kilos: 23 };
  const campo = "color";
  console.log(maleta.campo, maleta[campo], maleta["kilos"]);
options:
  - "undefined azul 23"
  - "azul azul 23"
  - "color azul 23"
  - "undefined undefined 23"
answer: "undefined azul 23"
explain: |
  `maleta.campo` busca una propiedad llamada `"campo"`, que no existe. `maleta[campo]` usa lo que *vale* la variable, `"color"`, y encuentra `"azul"`.
```

```exercise
id: js6-predice-opcional
type: predict
title: Objetos con y sin dueño
prompt: |
  Algunos objetos llegan con etiqueta y otros no. ¿Qué imprime?
code: |
  const objetos = [
    { tipo: "paraguas", etiqueta: { nombre: "Ana" } },
    { tipo: "peluche" },
  ];
  for (const objeto of objetos) {
    console.log(objeto.tipo, objeto.etiqueta?.nombre ?? "sin dueño");
  }
options:
  - "paraguas Ana\npeluche sin dueño"
  - "paraguas Ana\npeluche undefined"
  - "paraguas Ana\nError"
  - "paraguas Ana\npeluche null"
answer: "paraguas Ana\npeluche sin dueño"
explain: |
  El peluche no tiene `etiqueta`, así que `objeto.etiqueta?.nombre` se detiene y da `undefined` (sin `?.` sería un error). Luego `??` cambia ese `undefined` por `"sin dueño"`.
```

```exercise
id: js6-predice-misma-ficha
type: predict
title: La ficha compartida
prompt: |
  Milagros marca como entregado un objeto en la "copia" de la ficha. ¿Qué imprime?
code: |
  const ficha = { codigo: "OP-204", entregado: false };
  const copia = ficha;
  const otra = { ...ficha };
  copia.entregado = true;
  console.log(ficha.entregado, otra.entregado);
options:
  - "true false"
  - "false false"
  - "true true"
  - "false true"
answer: "true false"
explain: |
  `copia = ficha` es la misma ficha con otro nombre, como con los arrays de la sesión 5. `{ ...ficha }` sí es un objeto nuevo, que se quedó con `entregado: false`.
```

```exercise
id: js6-completa-ficha
type: complete
title: La ficha del charango
prompt: |
  Arma la ficha del charango que encontraron en la puerta 7. Usa la **forma corta** para `codigo` y `tipo`, y pon `puerta` dentro de `hallazgo`.
visual:
  figure:
    input: { label: variables, cards: [{ title: sueltas, rows: [["codigo", "\"OP-204\""], ["tipo", "\"charango\""], ["puerta", "7"]] }] }
    arrow: "{ codigo, tipo, hallazgo: { puerta } }"
    output: { label: objeto, cards: [{ title: objeto, rows: [["codigo", "\"OP-204\""], ["tipo", "\"charango\""], ["hallazgo", "{ puerta: 7 }"]] }] }
starter: |
  const codigo = "OP-204";
  const tipo = "charango";
  const puerta = 7;

  const objeto = { ___, ___, hallazgo: { ___ } };
  console.log(objeto.___.puerta);
solution: |
  const codigo = "OP-204";
  const tipo = "charango";
  const puerta = 7;

  const objeto = { codigo, tipo, hallazgo: { puerta } };
  console.log(objeto.hallazgo.puerta);
hints:
  - "Forma corta: si la variable se llama como la propiedad, basta su nombre: `{ codigo }`."
  - Para leer la puerta hay que entrar primero a `hallazgo`.
tests:
  - name: la ficha está completa
    run: objeto
    equals: { codigo: OP-204, tipo: charango, hallazgo: { puerta: 7 } }
  - name: imprime la puerta
    output: "7"
  - name: usa la forma corta
    source: '\{\s*codigo\s*,\s*tipo\s*,'
    msg: Escribe { codigo, tipo, … } sin repetir los nombres.
```

```exercise
id: js6-arregla-json
type: fix
title: El aviso que se rompía
prompt: |
  El sistema de la aerolínea manda los datos del dueño como **texto JSON**. El programa quiere avisarle, pero se cae diciendo que no puede leer `nombre` de `undefined`. Arréglalo con una sola palabra... bueno, con dos.
visual:
  figure:
    input: { label: "respuesta (un texto)", text: "'{\"codigo\":\"OP-311\",\"tipo\":\"laptop\",\"dueño\":{\"nombre\":\"Kevin Ríos\"}}'" }
    arrow: "JSON.parse"
    output: { label: "un objeto", cards: [{ title: objeto, rows: [["codigo", "\"OP-311\""], ["tipo", "\"laptop\""], ["dueño", "{ nombre: \"Kevin Ríos\" }"]] }] }
starter: |
  const respuesta = '{"codigo":"OP-311","tipo":"laptop","dueño":{"nombre":"Kevin Ríos"}}';

  const objeto = respuesta;
  console.log(`Avisar a ${objeto.dueño.nombre}: su ${objeto.tipo} está en Objetos Perdidos`);
solution: |
  const respuesta = '{"codigo":"OP-311","tipo":"laptop","dueño":{"nombre":"Kevin Ríos"}}';

  const objeto = JSON.parse(respuesta);
  console.log(`Avisar a ${objeto.dueño.nombre}: su ${objeto.tipo} está en Objetos Perdidos`);
hints:
  - "`respuesta` es un texto, aunque tenga llaves adentro. Un texto no tiene propiedad `dueño`."
  - "`JSON.parse(texto)` convierte el texto en un objeto de verdad."
tests:
  - name: el aviso sale bien
    output: "Avisar a Kevin Ríos: su laptop está en Objetos Perdidos"
  - name: usa JSON.parse
    source: 'JSON\.parse\s*\('
```

```exercise
id: js6-escribe-ficha
type: write
title: La ficha impresa
prompt: |
  Escribe `lineas(objeto)`, que devuelve un array con una línea `"clave: valor"` por cada propiedad del objeto, en orden.

  Milagros imprime una ficha por objeto para pegarla en la bolsa, y cada objeto tiene propiedades distintas. Usa `Object.entries`.
visual:
  figure:
    input: { label: objeto, cards: [{ title: "{ tipo, color, puerta }", rows: [["tipo", "\"mochila\""], ["color", "\"negra\""], ["puerta", "14"]] }] }
    arrow: Object.entries
    output: { label: devuelve, cells: ["tipo: mochila", "color: negra", "puerta: 14"] }
starter: |
  function lineas(objeto) {
  }

  console.log(lineas({ tipo: "mochila", color: "negra", puerta: 14 }));
solution: |
  function lineas(objeto) {
    const resultado = [];
    for (const [clave, valor] of Object.entries(objeto)) {
      resultado.push(`${clave}: ${valor}`);
    }
    return resultado;
  }

  console.log(lineas({ tipo: "mochila", color: "negra", puerta: 14 }));
hints:
  - "`for (const [clave, valor] of Object.entries(objeto))` te da cada par."
  - Acumula las líneas en un array con `push` y devuélvelo.
tests:
  - name: la mochila
    run: 'lineas({ tipo: "mochila", color: "negra", puerta: 14 })'
    equals: ["tipo: mochila", "color: negra", "puerta: 14"]
  - name: otro objeto, otras claves
    run: 'lineas({ tipo: "charango", cuerdas: 10 })'
    equals: ["tipo: charango", "cuerdas: 10"]
  - name: un objeto vacío
    run: lineas({})
    equals: []
  - name: usa Object.entries
    source: 'Object\.entries\s*\('
```

## El caso

```exercise
id: js6-caso-mochila
type: case
title: La mochila de Ruth
prompt: |
  Encuentra el código del único objeto que cumple todo lo que describe Ruth.

  Ruth Mamani llegó de Cusco en el vuelo de las 14:00 y olvidó su mochila. En el depósito hay muchas mochilas negras. Ella la describe así:

  - es una **mochila negra**;
  - tiene un **llavero de llama** (está en `detalles`);
  - la encontraron a las **14 o después** (su vuelo aterrizó a las 14);
  - la etiqueta se le cayó hace tiempo: si un objeto **tiene etiqueta con otro nombre**, no es suyo.

  Cuidado: muchos objetos no tienen `etiqueta`, y `objeto.etiqueta.nombre` en uno de ellos rompe el programa.
visual:
  figure:
    title: Así se descartan tres objetos (una columna por objeto)
    panes:
      - { table: { head: ["", "OP-101", "OP-103", "OP-108"], rows: [["tipo y color", "mochila negra ✓", "mochila **azul** ✗", "mochila negra ✓"], ["llavero de llama", "✓", "✓", "✓"], ["hallazgo.hora ≥ 14", "**9** ✗", "16 ✓", "**11** ✗"], ["etiqueta", "**Jorge Ccama** ✗", "no tiene ✓", "no tiene ✓"], ["¿es de Ruth?", "no", "no", "no"]] } }
      - { label: "busca el que tiene ✓ en todo", value: "OP-???" }
starter: |
  const objetos = [
    { codigo: "OP-101", tipo: "mochila", color: "negra", hallazgo: { puerta: 3, hora: 9 }, etiqueta: { vuelo: "LA2041", nombre: "Jorge Ccama" }, detalles: ["llavero de llama"] },
    { codigo: "OP-102", tipo: "maleta", color: "roja", hallazgo: { puerta: 14, hora: 15 }, etiqueta: { vuelo: "LA2041", nombre: "Ruth Mamani" }, detalles: [] },
    { codigo: "OP-103", tipo: "mochila", color: "azul", hallazgo: { puerta: 14, hora: 16 }, detalles: ["llavero de llama"] },
    { codigo: "OP-104", tipo: "mochila", color: "negra", hallazgo: { puerta: 12, hora: 17 }, detalles: ["parche de Machu Picchu"] },
    { codigo: "OP-105", tipo: "charango", color: "marrón", hallazgo: { puerta: 14, hora: 14 }, detalles: ["cuerda rota"] },
    { codigo: "OP-106", tipo: "mochila", color: "negra", hallazgo: { puerta: 14, hora: 16 }, detalles: ["termo", "llavero de llama"] },
    { codigo: "OP-107", tipo: "casaca", color: "negra", hallazgo: { puerta: 8, hora: 15 }, detalles: ["llavero de llama"] },
    { codigo: "OP-108", tipo: "mochila", color: "negra", hallazgo: { puerta: 14, hora: 11 }, detalles: ["llavero de llama"] },
    { codigo: "OP-109", tipo: "mochila", color: "negra", hallazgo: { puerta: 15, hora: 15 }, etiqueta: { vuelo: "H2 5110", nombre: "Piero Salas" }, detalles: ["llavero de llama"] },
    { codigo: "OP-110", tipo: "paraguas", color: "negro", hallazgo: { puerta: 2, hora: 18 }, detalles: [] },
    { codigo: "OP-111", tipo: "peluche", color: "blanco", hallazgo: { puerta: 14, hora: 15 }, etiqueta: { vuelo: "LA2041", nombre: "Thiago Mamani" }, detalles: ["alpaca"] },
    { codigo: "OP-112", tipo: "mochila", color: "negra", hallazgo: { puerta: 9, hora: 19 }, etiqueta: { vuelo: "LA2047", nombre: "Rut Quispe" }, detalles: [] },
  ];

  // Así se leen las propiedades de un objeto:
  const primero = objetos[0];
  console.log(primero.codigo, primero.tipo, "encontrado a las", primero.hallazgo.hora);

  // TODO: recorre objetos e imprime el código de los que cumplen las cuatro condiciones.
  // Para la etiqueta, que no siempre existe: objeto.etiqueta?.nombre
solution: |
  const objetos = [
    { codigo: "OP-101", tipo: "mochila", color: "negra", hallazgo: { puerta: 3, hora: 9 }, etiqueta: { vuelo: "LA2041", nombre: "Jorge Ccama" }, detalles: ["llavero de llama"] },
    { codigo: "OP-102", tipo: "maleta", color: "roja", hallazgo: { puerta: 14, hora: 15 }, etiqueta: { vuelo: "LA2041", nombre: "Ruth Mamani" }, detalles: [] },
    { codigo: "OP-103", tipo: "mochila", color: "azul", hallazgo: { puerta: 14, hora: 16 }, detalles: ["llavero de llama"] },
    { codigo: "OP-104", tipo: "mochila", color: "negra", hallazgo: { puerta: 12, hora: 17 }, detalles: ["parche de Machu Picchu"] },
    { codigo: "OP-105", tipo: "charango", color: "marrón", hallazgo: { puerta: 14, hora: 14 }, detalles: ["cuerda rota"] },
    { codigo: "OP-106", tipo: "mochila", color: "negra", hallazgo: { puerta: 14, hora: 16 }, detalles: ["termo", "llavero de llama"] },
    { codigo: "OP-107", tipo: "casaca", color: "negra", hallazgo: { puerta: 8, hora: 15 }, detalles: ["llavero de llama"] },
    { codigo: "OP-108", tipo: "mochila", color: "negra", hallazgo: { puerta: 14, hora: 11 }, detalles: ["llavero de llama"] },
    { codigo: "OP-109", tipo: "mochila", color: "negra", hallazgo: { puerta: 15, hora: 15 }, etiqueta: { vuelo: "H2 5110", nombre: "Piero Salas" }, detalles: ["llavero de llama"] },
    { codigo: "OP-110", tipo: "paraguas", color: "negro", hallazgo: { puerta: 2, hora: 18 }, detalles: [] },
    { codigo: "OP-111", tipo: "peluche", color: "blanco", hallazgo: { puerta: 14, hora: 15 }, etiqueta: { vuelo: "LA2041", nombre: "Thiago Mamani" }, detalles: ["alpaca"] },
    { codigo: "OP-112", tipo: "mochila", color: "negra", hallazgo: { puerta: 9, hora: 19 }, etiqueta: { vuelo: "LA2047", nombre: "Rut Quispe" }, detalles: [] },
  ];

  for (const objeto of objetos) {
    const { codigo, tipo, color, hallazgo, detalles } = objeto;
    const dueño = objeto.etiqueta?.nombre;
    const esSuya = dueño === undefined || dueño === "Ruth Mamani";
    if (tipo === "mochila" && color === "negra" && detalles.includes("llavero de llama") && hallazgo.hora >= 14 && esSuya) {
      console.log("Es de Ruth:", codigo);
    }
  }
answer: OP-106
answerLabel: ¿Cuál es el código de la mochila de Ruth?
reveal: |
  La OP-106: mochila negra, con termo y llavero de llama, encontrada a las 16 en la puerta 14, sin etiqueta. La OP-109 se le parecía mucho, pero su etiqueta dice Piero Salas; la OP-108 apareció a las 11, antes de que Ruth aterrizara. Y la OP-102, la única con su nombre, es una maleta roja: Ruth también la había perdido, pero no se había dado cuenta.
hints:
  - "Dentro del `for...of`, desestructura lo que necesitas: `const { tipo, color, hallazgo, detalles } = objeto;`."
  - "La etiqueta: `const dueño = objeto.etiqueta?.nombre;` vale `undefined` si no hay etiqueta. Es suya si es `undefined` o si es `\"Ruth Mamani\"`."
```

## El juez

```exercise
id: js6-juez-turnos
type: judge
mode: function
function: juntarTurnos
title: Lo que sale a provincias
prompt: |
  Escribe `juntarTurnos(a, b)`, que suma por destino lo que mandaron dos turnos, y `destinoMayor(conteo)`, que devuelve el destino que recibe más objetos.

  Los objetos que se olvidan en Lima pero son de pasajeros de otras ciudades se mandan al aeropuerto de destino. Cada turno de Objetos Perdidos anota un objeto como `{ CUZ: 3, AQP: 1 }`: código del aeropuerto y cuántos objetos van para allá.

  - `juntarTurnos(a, b)` devuelve un objeto **nuevo** con cada destino que aparece en `a` o en `b` y la suma de los dos (si un destino solo está en uno, es lo de ese turno; si suma 0, igual aparece).
  - `destinoMayor(conteo)` devuelve el código con más objetos. Si hay empate, el que va primero en orden alfabético. Si el objeto está vacío, `null`.

  **Restricciones:** cada turno tiene de 0 a 8 destinos · de 0 a 9 objetos por destino.
visual:
  figure:
    title: El ejemplo 1, destino por destino (una columna por destino)
    panes:
      - { table: { head: ["", "CUZ", "AQP", "PIU"], rows: [["turno a", "3", "1", "—"], ["turno b", "2", "—", "4"], ["**juntos**", "**5**", "**1**", "**4**"]] } }
      - { label: "juntarTurnos devuelve", cards: [{ title: "objeto nuevo", rows: [["CUZ", "5"], ["AQP", "1"], ["PIU", "4"]] }] }
      - { label: "destinoMayor de eso", value: "\"CUZ\"" }
starter: |
  function juntarTurnos(a, b) {
  }

  function destinoMayor(conteo) {
  }
solution: |
  function juntarTurnos(a, b) {
    const juntos = { ...a };
    for (const [destino, cantidad] of Object.entries(b)) {
      juntos[destino] = (juntos[destino] ?? 0) + cantidad;
    }
    return juntos;
  }

  function destinoMayor(conteo) {
    let mejor = null;
    for (const [destino, cantidad] of Object.entries(conteo)) {
      if (mejor === null || cantidad > conteo[mejor] || (cantidad === conteo[mejor] && destino < mejor)) {
        mejor = destino;
      }
    }
    return mejor;
  }
hints:
  - "Empieza con una copia de `a` (`{ ...a }`) y suma encima cada par de `b`. `juntos[destino] ?? 0` da 0 si ese destino aún no estaba."
  - "En `destinoMayor`, guarda el mejor código visto; cámbialo si el nuevo tiene más, o si empata y su código es menor (`\"AQP\" < \"CUZ\"` es `true`)."
samples:
  - args: [{ CUZ: 3, AQP: 1 }, { CUZ: 2, PIU: 4 }]
    returns: { CUZ: 5, AQP: 1, PIU: 4 }
    note: La tabla de arriba.
  - fn: destinoMayor
    args: [{ CUZ: 5, AQP: 1, PIU: 4 }]
    returns: CUZ
  - fn: destinoMayor
    args: [{ TRU: 2, IQT: 2 }]
    returns: IQT
    note: Empate en 2; IQT va antes que TRU en el alfabeto.
edge:
  - args: [{}, {}]
    tag: con dos turnos vacíos
  - args: [{}, { JUL: 2 }]
    tag: cuando el primer turno está vacío
  - args: [{ TPP: 0 }, { TPP: 0, CIX: 3 }]
    tag: con un destino que suma 0
  - fn: destinoMayor
    args: [{}]
    tag: en destinoMayor, con un conteo vacío
  - fn: destinoMayor
    args: [{ PIU: 4, CUZ: 4, AQP: 4 }]
    tag: en destinoMayor, con un empate de tres
  - fn: destinoMayor
    args: [{ TRU: 0 }]
    tag: en destinoMayor, con un solo destino en 0
random:
  count: 40
  seed: 66
  generate: |
    const codigos = ["AQP", "CUZ", "IQT", "PIU", "TRU", "JUL", "TPP", "CIX"];
    const turno = () => {
      const t = {};
      for (let i = rng.int(0, 8); i > 0; i--) t[rng.pick(codigos)] = rng.int(0, 9);
      return t;
    };
    return [turno(), turno()];
wrong:
  - |
    function juntarTurnos(a, b) {
      const juntos = {};
      for (const [destino, cantidad] of Object.entries(a)) juntos[destino] = cantidad + (b[destino] ?? 0);
      return juntos;
    }
    function destinoMayor(conteo) {
      let mejor = null;
      for (const [d, c] of Object.entries(conteo)) if (mejor === null || c > conteo[mejor] || (c === conteo[mejor] && d < mejor)) mejor = d;
      return mejor;
    }
  - |
    function juntarTurnos(a, b) {
      return { ...a, ...b };
    }
    function destinoMayor(conteo) {
      let mejor = null;
      for (const [d, c] of Object.entries(conteo)) if (mejor === null || c > conteo[mejor] || (c === conteo[mejor] && d < mejor)) mejor = d;
      return mejor;
    }
  - |
    function juntarTurnos(a, b) {
      const juntos = { ...a };
      for (const [d, c] of Object.entries(b)) juntos[d] = (juntos[d] ?? 0) + c;
      return juntos;
    }
    function destinoMayor(conteo) {
      let mejor = null;
      for (const [d, c] of Object.entries(conteo)) if (mejor === null || c > conteo[mejor]) mejor = d;
      return mejor;
    }
  - |
    function juntarTurnos(a, b) {
      const juntos = { ...a };
      for (const [d, c] of Object.entries(b)) juntos[d] = juntos[d] + c;
      return juntos;
    }
    function destinoMayor(conteo) {
      let mejor = null;
      for (const [d, c] of Object.entries(conteo)) if (mejor === null || c > conteo[mejor] || (c === conteo[mejor] && d < mejor)) mejor = d;
      return mejor;
    }
```

## Misión final

```exercise
id: js6-mision-deposito
type: mission
title: El turno de noche
prompt: |
  Atiende los `reclamos` en orden: busca cada ticket en `deposito`, trae el objeto de su estante y entrégalo en el mostrador con el **nombre del pasajero** como etiqueta.

  Cada reclamo es un objeto como `{ ticket: "A-17", pasajero: { nombre: "Ruth Mamani" } }`. El `deposito` es un objeto cuyas claves son los tickets: `deposito["A-17"]` es `{ objeto: "charango", estante: 2 }`.

  - Ya tienes `traer(estante)`: Chasqui va al estante, toma el objeto y vuelve parado sobre el mostrador (D).
  - Después de `robot.entregar(nombre)`, llama a `alPuesto()` para que vuelva a su sitio.
  - Si un ticket **no está** en el depósito, Chasqui no se mueve: dice `` `${ticket}: no está` `` con `robot.decir`.

  Los reclamos cambian en cada prueba.
visual:
  figure:
    title: Un reclamo, de la ficha al estante
    input: { label: "un reclamo", cards: [{ title: reclamo, rows: [["ticket", "\"A-17\""], ["pasajero", "{ nombre: \"Ruth Mamani\" }"]] }] }
    arrow: "deposito[ticket]"
    output: { label: "lo que hace Chasqui", cards: [{ title: "{ objeto: \"charango\", estante: 2 }", rows: [["traer", "2"], ["entregar", "\"Ruth Mamani\""], ["alPuesto", "()"]] }, { title: "ticket \"Z-99\" (no está)", rows: [["decir", "\"Z-99: no está\""]] }] }
starter: |
  // deposito: { "A-17": { objeto: "charango", estante: 2 }, ... }
  // reclamos: [{ ticket: "B-02", pasajero: { nombre: "Kevin Ríos" } }, ...]

  const mediaVuelta = () => {
    robot.girarDerecha();
    robot.girarDerecha();
  };

  // Va al estante, toma el objeto y queda sobre el mostrador (D).
  function traer(estante) {
    const pasos = 2 * estante - 1;
    robot.avanzar(pasos);
    robot.girarDerecha();
    robot.avanzar();
    robot.tomar();
    mediaVuelta();
    robot.avanzar();
    robot.girarIzquierda();
    robot.avanzar(pasos + 1);
  }

  // Del mostrador, de vuelta a su sitio mirando al este.
  function alPuesto() {
    mediaVuelta();
    robot.avanzar();
  }

  // TODO: atiende cada reclamo
solution: |
  const mediaVuelta = () => {
    robot.girarDerecha();
    robot.girarDerecha();
  };

  function traer(estante) {
    const pasos = 2 * estante - 1;
    robot.avanzar(pasos);
    robot.girarDerecha();
    robot.avanzar();
    robot.tomar();
    mediaVuelta();
    robot.avanzar();
    robot.girarIzquierda();
    robot.avanzar(pasos + 1);
  }

  function alPuesto() {
    mediaVuelta();
    robot.avanzar();
  }

  for (const { ticket, pasajero } of reclamos) {
    const guardado = deposito[ticket];
    if (guardado === undefined) {
      robot.decir(`${ticket}: no está`);
      continue;
    }
    traer(guardado.estante);
    robot.entregar(pasajero.nombre);
    alPuesto();
  }
hints:
  - "Recorre `reclamos` desestructurando: `for (const { ticket, pasajero } of reclamos)`."
  - "La clave está en la variable `ticket`, así que va con corchetes: `deposito[ticket]`. Si da `undefined`, ese ticket no está."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, deliver, cargo]
  items: { a: mochila, b: charango, c: paraguas, d: laptop, e: peluche }
  map: |
    #############
    #DR.........#
    ###a#b#c#d#e#
    #############
globals:
  deposito:
    "A-17": { objeto: charango, estante: 2 }
    "B-02": { objeto: laptop, estante: 4 }
    "C-33": { objeto: mochila, estante: 1 }
    "D-08": { objeto: peluche, estante: 5 }
    "E-21": { objeto: paraguas, estante: 3 }
  reclamos:
    - { ticket: "B-02", pasajero: { nombre: Kevin Ríos } }
    - { ticket: "Z-99", pasajero: { nombre: Señor Misterio } }
    - { ticket: "A-17", pasajero: { nombre: Ruth Mamani } }
scenarios:
  - {}
  - globals:
      reclamos:
        - { ticket: "D-08", pasajero: { nombre: Abuela Nati } }
        - { ticket: "C-33", pasajero: { nombre: Piero Salas } }
        - { ticket: "E-21", pasajero: { nombre: Milagros Chumpitaz } }
  - globals:
      reclamos:
        - { ticket: "X-01", pasajero: { nombre: Nadie } }
tests:
  - name: entrega a cada pasajero con ticket válido, en orden
    state: 'JSON.stringify(w.delivered) === JSON.stringify(g.reclamos.filter((r) => g.deposito[r.ticket]).map((r) => r.pasajero.nombre))'
    msg: Las entregas no coinciden con los reclamos (nombre, orden, o entregaste uno que no estaba).
  - name: trae el objeto de cada ticket
    state: 'JSON.stringify([...w.inventory].sort()) === JSON.stringify(g.reclamos.filter((r) => g.deposito[r.ticket]).map((r) => g.deposito[r.ticket].objeto).sort())'
    msg: Chasqui no trajo justo los objetos de los tickets reclamados.
  - name: avisa los tickets que no están
    state: 'JSON.stringify(w.said) === JSON.stringify(g.reclamos.filter((r) => !g.deposito[r.ticket]).map((r) => `${r.ticket}: no está`))'
    msg: 'Por cada ticket que no está, robot.decir(`${ticket}: no está`), y nada más.'
  - name: sin chocar
    state: '!w.crashed'
```

## Reto experto

```exercise
id: js6-reto-diferencias
type: challenge
title: ¿Quién tocó la ficha?
prompt: |
  Alguien editó fichas a escondidas. Escribe `cambios(antes, despues)`, que devuelve las claves (ordenadas alfabéticamente) cuyo valor cambió, que se agregaron o que se borraron. Los valores son textos, números o `true`/`false`, nunca objetos.
starter: |
  function cambios(antes, despues) {
    return [];
  }

  console.log(cambios({ color: "negra", puerta: 14 }, { color: "azul", puerta: 14 }));
solution: |
  function cambios(antes, despues) {
    const claves = [...Object.keys(antes), ...Object.keys(despues)];
    const distintas = [];
    for (const clave of claves) {
      const cambio = !(clave in antes) || !(clave in despues) || antes[clave] !== despues[clave];
      if (cambio && !distintas.includes(clave)) {
        distintas.push(clave);
      }
    }
    return distintas.sort();
  }

  console.log(cambios({ color: "negra", puerta: 14 }, { color: "azul", puerta: 14 }));
hints:
  - "Junta las claves de los dos objetos y revisa cada una una sola vez."
  - "`clave in objeto` dice si la propiedad existe, aunque valga `undefined` o `false`."
tests:
  - name: cambió el color
    run: 'cambios({ color: "negra", puerta: 14 }, { color: "azul", puerta: 14 })'
    equals: ["color"]
  - name: agregada y borrada
    run: 'cambios({ tipo: "laptop", entregado: false }, { tipo: "laptop", dueño: "Kevin" })'
    equals: ["dueño", "entregado"]
  - name: sin cambios
    run: 'cambios({ a: 1 }, { a: 1 })'
    equals: []
  - name: false que pasa a no existir
    run: 'cambios({ entregado: false }, {})'
    equals: ["entregado"]
```
