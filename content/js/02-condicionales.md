# Sesión 2 — Condicionales

## El encargo

La Casa-Museo Sarmiento, en Pueblo Libre, guarda mantos de Paracas y un vigilante nocturno que se duerme a las once. La directora contrató a Loop para que Chasqui haga la ronda de noche. Le pusimos una sirena en la cabeza y un sensor que lee cada sala: si la puerta quedó abierta y si algo se mueve adentro.

El problema: cada noche es distinta. Un robot que repite siempre lo mismo cierra puertas que ya estaban cerradas y le suena la alarma al gato del vigilante. Chasqui tiene que **decidir**.

```escena
theme: museo
level: 2
dir: E
caption: La ronda de noche. En la primera sala la puerta quedó abierta y no hay nadie; en la segunda, algo se mueve.
map: |
  ########
  #R.....#
  ###O##P#
  ###.##m#
  ########
program: |
  robot.avanzar(2);
  robot.cerrarPuerta();
  robot.avanzar(3);
  robot.alarma();
```

## Lo mínimo

`if` ejecuta un bloque solo si una condición es verdadera. `else if` prueba otra si la primera falló, y `else` atrapa todo lo demás. Se evalúan de arriba abajo y **solo corre el primer bloque que cumple**.

```js run
const bateria = 18;
const hayMovimiento = true;
if (hayMovimiento && bateria > 10) {
  console.log("Voy a revisar");
} else if (hayMovimiento) {
  console.log("Pido refuerzos");
} else {
  console.log("Sigo la ronda");
}
```

Mira qué camino toma el programa con una lectura de las once de la noche: solo se ilumina el bloque que corre, y los otros dos se saltan.

```anima
title: El primer bloque que cumple, y ninguno más
code: |
  const hora = 23;
  const hayMovimiento = true;
  if (hayMovimiento && hora < 18) {
    console.log("Un visitante");
  } else if (hayMovimiento) {
    console.log("¡Intruso!");
  } else {
    console.log("Calma");
  }
notes:
  1: Son las once de la noche.
  5: La línea 3 no se cumplió (hay movimiento, pero no es de día), así que su bloque se saltó. Esta sí se cumple.
  6: Corre este bloque y la cadena termina; el else ni se mira.
```

Para comparar: `===` (igual), `!==` (distinto), `<`, `>`, `<=`, `>=`. Para combinar: `&&` (y), `||` (o), `!` (no).

Lo que JavaScript tiene de particular:

- **Usa siempre `===`**. El `==` antiguo convierte tipos antes de comparar, y entonces `"0" == 0` es `true`.
- **Truthy y falsy.** Un `if` acepta cualquier valor, no solo booleanos. Son *falsy* `false`, `0`, `""`, `null`, `undefined` y `NaN`; todo lo demás es *truthy*, incluso el texto `"0"`.
- **`null` y `undefined`.** `undefined` es "nunca tuvo valor" (una propiedad que no existe, una variable sin asignar). `null` es "vacío a propósito", lo pone alguien.
- **`??` y `?.`** para datos incompletos. `a ?? 18` da `18` solo si `a` es `null` o `undefined`. `camara?.movimiento` no se cae si `camara` no existe.

> **Trampa común:** `if (x = 5)` no compara, *asigna* 5 a `x`, y como 5 es truthy el bloque corre siempre. Comparar es `===`.

<!-- legacy: strict-equality -->

<!-- legacy: nullish -->

<!-- legacy: optional-chaining -->

<!-- mdn: if-else strict-equality truthy null-undefined nullish optional-chaining -->

## Práctica

```exercise
id: js2-predice-temperatura
type: predict
title: El termómetro de la sala de mantos
prompt: |
  La sala marca 31 grados. ¿Qué imprime?
code: |
  const temperatura = 31;
  if (temperatura > 40) {
    console.log("¡Incendio!");
  } else if (temperatura > 30) {
    console.log("Revisar el aire acondicionado");
  } else if (temperatura > 25) {
    console.log("Un poco de calor");
  } else {
    console.log("Todo normal");
  }
options:
  - Revisar el aire acondicionado
  - "Revisar el aire acondicionado\nUn poco de calor"
  - Un poco de calor
  - Todo normal
answer: Revisar el aire acondicionado
explain: |
  31 también es mayor que 25, pero la cadena se detiene en el primer bloque que cumple.
```

```exercise
id: js2-predice-falsy
type: predict
title: El código "0"
prompt: |
  El teclado de la bóveda manda lo que se tecleó como texto. Alguien tecleó un cero. ¿Qué imprime?
code: |
  const codigo = "0";
  if (codigo) {
    console.log("hay código");
  }
  if (codigo === 0) {
    console.log("es el número cero");
  }
  console.log(codigo == 0);
options:
  - "hay código\ntrue"
  - "es el número cero\ntrue"
  - "hay código\nes el número cero\ntrue"
  - "false"
answer: "hay código\ntrue"
explain: |
  `"0"` es un texto con un carácter, así que es truthy. No es `=== 0` porque es un string, no un número. Pero `==` lo convierte a número antes de comparar y dice `true`: por eso no se usa.
```

```exercise
id: js2-completa-puerta
type: complete
title: ¿Cierro o sigo?
prompt: |
  Completa los huecos para que `accion` sea `"cerrar"` si la puerta está abierta, y `"seguir"` si no.

  `lectura` viene del sensor, por ejemplo `{ puerta: "abierta", movimiento: false }`. Se prueba con dos lecturas distintas.
visual:
  figure:
    title: Lo que lee el sensor y lo que debe decidir
    table:
      head: ["lectura.puerta", "accion"]
      rows: [["\"abierta\"", "\"cerrar\""], ["\"cerrada\"", "\"seguir\""]]
starter: |
  let accion;
  if (lectura.puerta ___ "abierta") {
    accion = "cerrar";
  } ___ {
    accion = "seguir";
  }
  console.log(accion);
solution: |
  let accion;
  if (lectura.puerta === "abierta") {
    accion = "cerrar";
  } else {
    accion = "seguir";
  }
  console.log(accion);
hints:
  - El primer hueco es el operador de igualdad estricta.
  - El segundo es la palabra que atrapa "todo lo demás".
globals:
  lectura: { puerta: abierta, movimiento: false }
scenarios:
  - tests:
      - name: con la puerta abierta, cerrar
        expect: 'accion === "cerrar"'
  - globals: { lectura: { puerta: cerrada, movimiento: true } }
    tests:
      - name: con la puerta cerrada, seguir
        expect: 'accion === "seguir"'
tests:
  - name: usa ===
    source: '==='
```

```exercise
id: js2-arregla-asignacion
type: fix
title: La alarma que siempre sonaba
prompt: |
  El vigilante se queja: la alarma suena todas las noches, haya o no movimiento. Encuentra el bug.
starter: |
  let alerta = "ninguna";
  if (lectura.movimiento = true) {
    alerta = "intruso";
  }
  console.log(alerta);
solution: |
  let alerta = "ninguna";
  if (lectura.movimiento === true) {
    alerta = "intruso";
  }
  console.log(alerta);
hints:
  - Lee la condición en voz alta. ¿Compara o asigna?
globals:
  lectura: { puerta: cerrada, movimiento: false }
scenarios:
  - tests:
      - name: sin movimiento, "ninguna"
        output: ninguna
  - globals: { lectura: { puerta: cerrada, movimiento: true } }
    tests:
      - name: con movimiento, "intruso"
        output: intruso
```

```exercise
id: js2-escribe-nivel
type: write
title: ¿Intruso o visitante?
prompt: |
  Guarda en `alerta` si el movimiento es de un visitante, de un intruso, o si no hay nada.

  El museo abre de **8 a 18**: de día el movimiento es de visitantes, de noche (desde las 18 y antes de las 8) es un intruso. `lectura` trae `movimiento` (booleano) y `hora` (0 a 23). Guarda en `alerta`:
  - `"calma"` si no hay movimiento,
  - `"visitante"` si hay movimiento y el museo está abierto,
  - `"intruso"` si hay movimiento y está cerrado.
visual:
  figure:
    title: Un día en el museo
    table:
      head: ["", "0 a 7", "8 a 17", "18 a 23"]
      rows: [["con movimiento", "intruso", "visitante", "intruso"], ["sin movimiento", "calma", "calma", "calma"]]
starter: |
  let alerta;

  console.log(alerta);
solution: |
  const cerrado = lectura.hora >= 18 || lectura.hora < 8;
  let alerta;
  if (!lectura.movimiento) {
    alerta = "calma";
  } else if (cerrado) {
    alerta = "intruso";
  } else {
    alerta = "visitante";
  }
  console.log(alerta);
hints:
  - "Guarda primero si el museo está cerrado: `const cerrado = lectura.hora >= 18 || lectura.hora < 8;`"
  - Empieza por el caso sin movimiento; así los otros dos ya saben que sí hay.
globals:
  lectura: { movimiento: true, hora: 23 }
scenarios:
  - tests:
      - name: 23:00 con movimiento → intruso
        expect: 'alerta === "intruso"'
  - globals: { lectura: { movimiento: true, hora: 10 } }
    tests:
      - name: 10:00 con movimiento → visitante
        expect: 'alerta === "visitante"'
  - globals: { lectura: { movimiento: false, hora: 3 } }
    tests:
      - name: 03:00 sin movimiento → calma
        expect: 'alerta === "calma"'
  - globals: { lectura: { movimiento: true, hora: 18 } }
    tests:
      - name: 18:00 en punto con movimiento → intruso
        expect: 'alerta === "intruso"'
  - globals: { lectura: { movimiento: true, hora: 8 } }
    tests:
      - name: 08:00 en punto con movimiento → visitante
        expect: 'alerta === "visitante"'
```

```exercise
id: js2-escribe-incompleta
type: write
title: La lectura a medias
prompt: |
  Arregla las dos líneas para que funcionen aunque falten datos: `temp` usa 18 solo si no llegó la temperatura, y `hayMovimiento` es `false` si no hay cámara.

  El sensor viejo de la sala 3 a veces no manda la temperatura, y la cámara a veces está apagada (`camara: null`). Pero cuando la sala está a **0 grados**, eso es un dato real, no un dato que falta.

  - `temp`: la temperatura, o **18** si no llegó.
  - `hayMovimiento`: `camara.movimiento`, o `false` si no hay cámara.
visual:
  figure:
    title: Un ejemplo, resuelto
    input: { label: lectura, cards: [{ title: "Sala 3", rows: [["temperatura", "0"], ["camara", "null"]] }] }
    arrow: "?? y ?."
    output: { label: Debe salir, text: "temp = 0\nhayMovimiento = false" }
starter: |
  const temp = lectura.temperatura || 18;
  const hayMovimiento = lectura.camara.movimiento;
  console.log(temp, hayMovimiento);
solution: |
  const temp = lectura.temperatura ?? 18;
  const hayMovimiento = lectura.camara?.movimiento ?? false;
  console.log(temp, hayMovimiento);
hints:
  - "`||` también reemplaza el 0. ¿Qué operador solo reemplaza null y undefined?"
  - "`lectura.camara?.movimiento` da undefined en vez de caerse cuando no hay cámara."
globals:
  lectura: { temperatura: 0, camara: { movimiento: true } }
scenarios:
  - tests:
      - name: a 0 grados, temp es 0
        expect: temp === 0
        msg: El 0 es una temperatura real. || lo cambió por 18.
      - name: la cámara ve movimiento
        expect: hayMovimiento === true
  - globals: { lectura: { camara: null } }
    tests:
      - name: sin temperatura, temp es 18
        expect: temp === 18
      - name: sin cámara, hayMovimiento es false
        expect: hayMovimiento === false
  - globals: { lectura: { temperatura: 24, camara: { movimiento: false } } }
    tests:
      - name: a 24 grados, temp es 24
        expect: temp === 24
      - name: la cámara no ve nada
        expect: hayMovimiento === false
```

## El caso

```exercise
id: js2-caso-vitrina
type: case
title: El código de la vitrina
prompt: |
  **Encuentra cuál de los ocho códigos cumple las tres pistas del vigilante.**

  A las seis de la mañana la vitrina del manto grande amaneció cerrada con un código nuevo que nadie recuerda haber puesto. El vigilante dejó tres pistas en un papelito y la directora anotó los códigos que suelen usar:

  **318, 427, 294, 568, 746, 836, 952, 583**

  Pistas: el código es **par**; la **suma de sus tres cifras es mayor que 15**; y la cifra de las **centenas es menor que la de las unidades**.

  Escribe la condición con las tres pistas y prueba cada candidato cambiando `candidato`. (En la sesión 3 harás esto sin cambiar el número a mano.)
visual:
  - board:
      cards:
        - name: Don Eusebio
          kind: person
          role: El vigilante, y su papelito
          rows: [["Pista 1", "es par"], ["Pista 2", "sus 3 cifras suman más de 15"], ["Pista 3", "centenas < unidades"]]
        - name: La directora
          kind: person
          role: Los códigos de siempre
          rows: [["Candidatos", "318 · 427 · 294 · 568"], ["", "746 · 836 · 952 · 583"]]
  - figure:
      title: Un candidato probado a mano
      input: { label: "318, cifra por cifra", cells: [3, 1, 8], index: false }
      arrow: las tres pistas
      output: { label: Resultado, text: "par: sí\n3 + 1 + 8 = 12 > 15: no\n3 < 8: sí\n→ no abre" }
starter: |
  const candidato = 318;

  const centenas = Math.floor(candidato / 100);
  const decenas = Math.floor(candidato / 10) % 10;
  const unidades = candidato % 10;
  console.log(centenas, decenas, unidades);

  // TODO: guarda cada pista en una constante (true o false),
  // júntalas en un if y muestra si el candidato abre la vitrina:
  // if (...) { console.log(candidato, "abre la vitrina"); }
solution: |
  const candidato = 568;

  const centenas = Math.floor(candidato / 100);
  const decenas = Math.floor(candidato / 10) % 10;
  const unidades = candidato % 10;

  const esPar = candidato % 2 === 0;
  const sumaAlta = centenas + decenas + unidades > 15;
  const creciente = centenas < unidades;
  if (esPar && sumaAlta && creciente) {
    console.log(candidato, "abre la vitrina");
  } else {
    console.log(candidato, "no");
  }
answer: "568"
answerLabel: ¿Cuál es el código?
reveal: |
  568: es par, 5 + 6 + 8 = 19, y 5 < 8. El 746 y el 836 cumplen las dos primeras pistas pero no la tercera; el 294 suma justo 15, que no es *mayor* que 15.
hints:
  - "`candidato % 2 === 0` dice si es par."
  - Guarda cada pista en una constante con nombre (`esPar`, `sumaAlta`…) y júntalas con &&.
```

## El juez

Lee con `leerNumero()` como en la sesión 1 y responde con `console.log`.

```exercise
id: js2-juez-entrada
type: judge
title: La boletería del museo
prompt: |
  **Imprime cuánto paga una persona por su entrada, según su edad y el día.**

  La Casa-Museo cobra la entrada según la edad: los menores de 3 años entran gratis, de 3 a 11 años pagan 10 soles, desde los 65 pagan 8, y el resto paga 20. Los **domingos** (día 7) ese resto paga la mitad, 10 soles. Chasqui atiende la boletería.

  **Entrada:** dos líneas: la edad `A` y el día de la semana `D` (1 es lunes, 7 es domingo).

  **Salida:** una línea con el precio en soles.

  **Restricciones:** 0 ≤ A ≤ 120 · 1 ≤ D ≤ 7.
starter: |
  const edad = leerNumero();
  const dia = leerNumero();
  console.log(20);
solution: |
  const edad = leerNumero();
  const dia = leerNumero();
  let precio;
  if (edad < 3) {
    precio = 0;
  } else if (edad <= 11) {
    precio = 10;
  } else if (edad >= 65) {
    precio = 8;
  } else if (dia === 7) {
    precio = 10;
  } else {
    precio = 20;
  }
  console.log(precio);
hints:
  - Ordena las condiciones de la más específica a la más general, y mira bien los bordes (3, 11, 65).
  - El descuento del domingo solo es para quienes pagarían 20.
visual:
  - figure:
      title: El ejemplo 1, en la boletería
      input: { label: Entrada, text: "30\n2" }
      arrow: 30 años, un martes
      output: { label: Salida, value: "20" }
  - figure:
      title: La tarifa
      table:
        head: ["Edad", "Lunes a sábado", "Domingo (7)"]
        rows: [["0 a 2", "0", "0"], ["3 a 11", "10", "10"], ["12 a 64", "20", "**10**"], ["65 o más", "8", "8"]]
samples:
  - input: "30\n2"
    output: "20"
  - input: "30\n7"
    output: "10"
    note: Es domingo y es adulto, así que paga la mitad.
  - input: "70\n7"
    output: "8"
    note: Desde los 65 se paga 8 cualquier día, también el domingo.
edge:
  - input: "2\n1"
    tag: en el borde de los 3 años
  - input: "3\n4"
    tag: en el borde de los 3 años
  - input: "11\n7"
    tag: en el borde de los 12 años
  - input: "12\n7"
    tag: en el borde de los 12 años
  - input: "64\n3"
    tag: en el borde de los 65 años
  - input: "65\n1"
    tag: en el borde de los 65 años
  - input: "0\n7"
    tag: con un bebé recién nacido
  - input: "120\n5"
    tag: con la edad máxima
random:
  count: 50
  seed: 22
  generate: |
    return `${rng.int(0, 120)}\n${rng.int(1, 7)}`;
wrong:
  - |
    const edad = leerNumero();
    const dia = leerNumero();
    let precio = 20;
    if (edad <= 3) precio = 0;
    else if (edad <= 11) precio = 10;
    else if (edad >= 65) precio = 8;
    else if (dia === 7) precio = 10;
    console.log(precio);
  - |
    const edad = leerNumero();
    const dia = leerNumero();
    let precio = 20;
    if (dia === 7) precio = 10;
    else if (edad < 3) precio = 0;
    else if (edad <= 11) precio = 10;
    else if (edad >= 65) precio = 8;
    console.log(precio);
```

## Misión final

```exercise
id: js2-mision-ronda
type: mission
title: La ronda nocturna
prompt: |
  **En cada una de las tres puertas, ciérrala si está abierta y haz sonar la alarma si hay movimiento.**

  Chasqui recorre el pasillo de la Casa-Museo, que tiene **tres salas**. Llega a la puerta de la sala 1 avanzando 2 casillas, y cada puerta está 3 casillas más allá de la anterior. Parado encima de una puerta:

  - `robot.sensor()` devuelve `{ puerta: "abierta" | "cerrada", movimiento: true | false }`
  - `robot.cerrarPuerta()` la cierra
  - `robot.alarma()` hace sonar la sirena en esa sala

  Al terminar, **todas las puertas deben quedar cerradas** y la alarma debe haber sonado **solo** en las salas donde hubo movimiento. Se prueba con cuatro noches distintas.
visual:
  figure:
    title: Qué hacer en cada puerta
    table:
      head: ["El sensor dice", "Chasqui hace"]
      rows: [["puerta: \"abierta\"", "`robot.cerrarPuerta()`"], ["movimiento: true", "`robot.alarma()`"], ["las dos cosas", "las dos acciones"], ["puerta cerrada y sin movimiento", "nada, sigue"]]
starter: |
  // Sala 1
  robot.avanzar(2);
  const sala1 = robot.sensor();
  console.log("Sala 1:", sala1);

  // Sala 2

  // Sala 3
solution: |
  robot.avanzar(2);
  const sala1 = robot.sensor();
  if (sala1.puerta === "abierta") {
    robot.cerrarPuerta();
  }
  if (sala1.movimiento) {
    robot.alarma();
  }

  robot.avanzar(3);
  const sala2 = robot.sensor();
  if (sala2.puerta === "abierta") {
    robot.cerrarPuerta();
  }
  if (sala2.movimiento) {
    robot.alarma();
  }

  robot.avanzar(3);
  const sala3 = robot.sensor();
  if (sala3.puerta === "abierta") {
    robot.cerrarPuerta();
  }
  if (sala3.movimiento) {
    robot.alarma();
  }
hints:
  - Son dos decisiones independientes por sala, así que son dos if separados, no un if/else.
  - Te va a tocar copiar el bloque tres veces. Fíjate en lo que cambia y lo que no: en la sesión 3 eso desaparece.
world:
  theme: museo
  level: 2
  dir: E
  map: |
    ###########
    #R........#
    ###P##O##P#
    ###.##m##.#
    ###########
scenarios:
  - {}
  - map: |
      ###########
      #R........#
      ###O##P##O#
      ###m##.##.#
      ###########
  - map: |
      ###########
      #R........#
      ###P##P##P#
      ###.##.##.#
      ###########
  - map: |
      ###########
      #R........#
      ###O##O##P#
      ###.##.##m#
      ###########
tests:
  - name: todas las puertas quedan cerradas
    state: w.openDoors === 0
    msg: Quedó al menos una puerta abierta.
  - name: la alarma suena solo donde hubo movimiento
    state: JSON.stringify(w.alarms) === JSON.stringify(w.motionDoors)
    msg: La alarma no coincide con las salas donde hubo movimiento.
  - name: Chasqui no choca
    state: '!w.crashed'
  - name: decide con if
    source: '\bif\s*\('
    msg: Esta misión se resuelve decidiendo con if.
```

## Reto experto

```exercise
id: js2-reto-bisiesto
type: challenge
title: El calendario del museo
visual:
  figure:
    title: La regla, con ejemplos
    table:
      head: ["Año", "÷ 4", "÷ 100", "÷ 400", "¿Bisiesto?"]
      rows: [["2024", "sí", "no", "no", "sí"], ["1900", "sí", "sí", "no", "no"], ["2000", "sí", "sí", "sí", "sí"]]
prompt: |
  **Guarda en `esBisiesto` si el año es bisiesto, con una sola expresión.** El sistema de turnos se confunde con febrero. Guarda en `esBisiesto` si `anio` es bisiesto: divisible por 4, salvo los divisibles por 100, que solo lo son si además son divisibles por 400. **Una sola expresión, sin if.**
starter: |
  const esBisiesto = false;
  console.log(anio, esBisiesto);
solution: |
  const esBisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
  console.log(anio, esBisiesto);
hints:
  - Combina con && y ||, y usa paréntesis para que se lea bien.
globals:
  anio: 2024
scenarios:
  - tests:
      - name: "2024: sí"
        expect: esBisiesto === true
  - globals: { anio: 1900 }
    tests:
      - name: "1900: no"
        expect: esBisiesto === false
  - globals: { anio: 2000 }
    tests:
      - name: "2000: sí"
        expect: esBisiesto === true
  - globals: { anio: 2027 }
    tests:
      - name: "2027: no"
        expect: esBisiesto === false
tests:
  - name: sin if
    sourceNot: '\bif\b'
    msg: Resuélvelo con una expresión booleana, sin if.
```
