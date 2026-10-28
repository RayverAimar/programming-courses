# Sesión 17 — Rendimiento

## El encargo

Terminal de buses de Yerbateros, 27 de julio, seis de la mañana. Media Lima quiere salir a provincias por Fiestas Patrias y la cola de Turismo Chaskiñan ya da la vuelta a la manzana. La señora Maruja, jefa de embarque, alquiló a Chasqui para la puerta de los andenes: lee el boleto de cada pasajero, dice si vale y lo manda a su andén.

El primer pasajero pasó bien. El décimo, también. Con el pasajero doscientos, Chasqui ya tardaba dos segundos en contestar, y alguien atrás empezó a cantar "¡que se vaya el robot!". El programa no estaba mal: daba la respuesta correcta. Era **lento**. Hoy Chasqui aprende a decidir **en menos de 50 milisegundos**, aunque el día tenga 30 000 boletos vendidos.

```escena
theme: barranco
level: 4
dir: E
caption: Los andenes de Chaskiñan. Chasqui lee el boleto en la puerta (izquierda), busca su andén y acompaña al pasajero por el pasillo hasta la bahía de abajo.
map: |
  #############
  #R..........#
  ##.#.#.#.#.##
  #############
program: |
  robot.decir("Boleto 240003: andén 3");
  robot.avanzar(5);
  robot.decir("Andén 3, ¡buen viaje!");
```

## Lo mínimo

Un programa correcto puede ser inútil si tarda demasiado. Lo que importa no es cuánto tarda con 10 datos, sino **cómo crece** su trabajo cuando los datos crecen. Cuenta operaciones:

```js run
const cola = Array.from({ length: 1000 }, (_, i) => i);
let conDosBucles = 0;
for (let i = 0; i < cola.length; i++) for (let j = 0; j < i; j++) conDosBucles++;
let conSet = 0;
const vistos = new Set();
for (const codigo of cola) { conSet++; vistos.add(codigo); }
console.log(conDosBucles, conSet);
```

Con mil pasajeros, comparar cada uno con todos los anteriores son casi **medio millón** de pasos; anotar cada uno en un `Set`, mil. Mira cómo se acumulan los pasos del bucle doble con solo cuatro boletos:

```anima
title: "Un bucle dentro de otro: cada boleto se compara con todos los anteriores"
code: |
  const cola = [7, 3, 7, 5];
  let ops = 0;
  let repetidos = 0;
  for (let i = 0; i < cola.length; i++) {
    for (let j = 0; j < i; j++) {
      ops++;
      if (cola[j] === cola[i]) repetidos++;
    }
  }
  console.log(ops, repetidos);
cells: { of: cola, at: i }
show: [i, j, ops, repetidos]
notes:
  4: "Llega un boleto nuevo: el i-ésimo."
  6: "Una comparación más con un boleto anterior."
  10: "4 boletos, 6 comparaciones. Con 30 000 serían 450 millones."
```

```figura
title: Cómo crece el trabajo
panes:
  - table:
      head: ["pasajeros", "un bucle", "bucle doble"]
      rows:
        - ["1 000", "1 000", "500 000 · 5 ms"]
        - ["10 000", "10 000", "50 millones · 0,5 s"]
        - ["30 000", "30 000", "450 millones · 4,5 s"]
caption: Pasos de trabajo, y el tiempo a unos 100 millones de pasos por segundo. Con el doble de datos, un bucle hace el doble de trabajo; un bucle doble, **el cuádruple**. A 4,5 s por turno, la cola se amotina.
```

- **Un bucle sobre n datos** crece igual que n. Un bucle dentro de otro crece como **n × n**: duplicar los datos cuadruplica el tiempo.
- **Bucles escondidos**: `includes`, `indexOf`, `find`, `filter`, `some`, `slice`, `[...lista]` y `new Set(lista)` recorren la lista. Dentro de un bucle, son un bucle dentro de otro.
- **`Set.has` y `Map.get`** encuentran una clave casi sin importar cuántas haya. Arma el `Set` o el `Map` **una vez**, fuera del bucle, y pregúntale todas las veces que quieras.
- **Salir temprano**: si ya tienes la respuesta, `return` o `break`. `some` y `find` paran solos en el primero que cumple.
- **Medir**: `performance.now()` da los milisegundos actuales, con decimales. Resta dos lecturas para saber cuánto tardó algo:

```js
const inicio = performance.now();
const anden = andenDe(240003);
const tardo = performance.now() - inicio;
if (tardo > 50) console.log(`¡Muy lento! ${tardo.toFixed(1)} ms`);
```

Mide antes de optimizar: muchas veces lo lento no es donde crees. Y no persigas microsegundos: cambiar un bucle doble por un `Set` gana mucho más que cualquier truco.

> **Trampa común:** `lista.includes(x)` dentro de un `for` parece una línea inocente, pero es un bucle dentro de otro. Con 30 000 boletos son cientos de millones de comparaciones. Pásalo a `const conjunto = new Set(lista)` **antes** del bucle y usa `conjunto.has(x)`.

<!-- legacy: performance-now -->

<!-- mdn: set-vs-object map-vs-object performance-now -->

## Práctica

```exercise
id: js17-predice-pares
type: predict
title: Cuántas comparaciones
prompt: |
  ¿Qué imprime?
code: |
  let todos = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) todos++;
  }
  let pares = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) pares++;
  }
  console.log(todos, pares);
options:
  - "16 6"
  - "8 4"
  - "16 16"
  - "16 8"
answer: "16 6"
explain: |
  El primero hace 4 × 4 = 16. El segundo compara cada par una sola vez: 3 + 2 + 1 + 0 = 6, que es 4 × 3 / 2. La mitad, pero sigue creciendo como n × n.
```

```exercise
id: js17-predice-some
type: predict
title: El que para a tiempo
prompt: |
  Chasqui busca el boleto 2 en la cola y cuenta cuántos miró. ¿Qué imprime?
code: |
  const cola = [5, 8, 2, 9, 4, 2];
  let mirados = 0;
  const esta = cola.some((codigo) => {
    mirados++;
    return codigo === 2;
  });
  console.log(esta, mirados);
options:
  - "true 3"
  - "true 6"
  - "true 2"
  - "false 6"
answer: "true 3"
explain: |
  `some` para en cuanto la función devuelve `true`: miró 5, 8 y 2, y ya no siguió. `filter` o `forEach` habrían mirado los seis.
```

```exercise
id: js17-completa-set
type: complete
title: Del cuaderno al Set
prompt: |
  `esValido(codigo)` dice si un boleto fue vendido. Hoy se vendieron 30 000 (`boletosVendidos()` te los da), y la puerta tiene que revisar 30 000 escaneos en **menos de 50 ms en total**. Arma un `Set` una vez y pregúntale.
visual:
  figure:
    input: { label: "vendidos (30 000)", cells: [100004, 100013, 100015, "…", 309993] }
    arrow: "new Set(vendidos), una sola vez"
    output: { label: "esValido(100013)", value: "true, al instante" }
starter: |
  const vendidos = boletosVendidos();
  const vendidosSet = new ___(vendidos);

  function esValido(codigo) {
    return vendidosSet.___(codigo);
  }

  console.log(esValido(vendidos[0]), esValido(42));
solution: |
  const vendidos = boletosVendidos();
  const vendidosSet = new Set(vendidos);

  function esValido(codigo) {
    return vendidosSet.has(codigo);
  }

  console.log(esValido(vendidos[0]), esValido(42));
hints:
  - "`new Set(lista)` arma el conjunto; `.has(x)` pregunta si está."
helpers:
  - name: boletosVendidos
    sig: "boletosVendidos() → number[]"
    doc: Los 30 000 códigos de boleto vendidos hoy.
    code: "() => { const lista = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; lista.push(100000 + i * 7 + (x % 7)); } return lista; }"
tests:
  - name: un boleto vendido es válido
    expect: esValido(vendidos[123]) === true
  - name: un código inventado no
    expect: esValido(100001) === false
  - name: 30 000 escaneos en menos de 50 ms
    expect: '(() => { const t0 = performance.now(); for (const c of vendidos) esValido(c + 1); return performance.now() - t0 < 50; })()'
    msg: Revisar los 30 000 escaneos tardó más de 50 ms.
```

```exercise
id: js17-arregla-adentro
type: fix
title: El Set que se armaba cada vez
prompt: |
  Ahora `esValido` usa un `Set`, pero sigue lento: 300 consultas tardan muchísimo más de 50 ms. Las respuestas son correctas. ¿Dónde se va el tiempo? Arréglalo.
starter: |
  const vendidos = boletosVendidos();

  function esValido(codigo) {
    const vendidosSet = new Set(vendidos);
    return vendidosSet.has(codigo);
  }

  console.log(esValido(vendidos[0]), esValido(42));
solution: |
  const vendidos = boletosVendidos();
  const vendidosSet = new Set(vendidos);

  function esValido(codigo) {
    return vendidosSet.has(codigo);
  }

  console.log(esValido(vendidos[0]), esValido(42));
hints:
  - "`new Set(vendidos)` recorre los 30 000 boletos. ¿Cuántas veces se ejecuta esa línea?"
  - Sácala de la función, para que se arme una sola vez.
helpers:
  - name: boletosVendidos
    sig: "boletosVendidos() → number[]"
    doc: Los 30 000 códigos de boleto vendidos hoy.
    code: "() => { const lista = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; lista.push(100000 + i * 7 + (x % 7)); } return lista; }"
tests:
  - name: sigue respondiendo bien
    expect: esValido(vendidos[500]) === true && esValido(100001) === false
  - name: 300 consultas en menos de 50 ms
    expect: '(() => { const t0 = performance.now(); for (let i = 0; i < 300; i++) esValido(vendidos[i] + 1); return performance.now() - t0 < 50; })()'
    msg: Las 300 consultas tardaron más de 50 ms. ¿Qué se hace de nuevo en cada llamada?
```

```exercise
id: js17-escribe-repetido
type: write
title: El primer boleto clonado
prompt: |
  Escribe `primerClonado(cola)`: el primer código que aparece **por segunda vez** en la cola de escaneos, o `null` si ninguno se repite.

  Para en cuanto lo encuentres: no hace falta mirar el resto de la cola. Con 20 000 escaneos debe contestar en menos de 50 ms.

  `primerClonado([4, 8, 1, 8, 4])` → `8`: el 8 se repite en la posición 3, antes que el 4.
visual:
  figure:
    input: { label: cola, cells: [4, 8, 1, 8, 4], highlight: [3] }
    arrow: "un Set de lo ya visto; paro en el primero que ya estaba"
    output: { label: devuelve, value: "8" }
starter: |
  function primerClonado(cola) {
  }

  console.log(primerClonado([4, 8, 1, 8, 4]));
solution: |
  function primerClonado(cola) {
    const vistos = new Set();
    for (const codigo of cola) {
      if (vistos.has(codigo)) {
        return codigo;
      }
      vistos.add(codigo);
    }
    return null;
  }

  console.log(primerClonado([4, 8, 1, 8, 4]));
hints:
  - "Recorre la cola guardando en un `Set` lo que ya pasó. Si el código ya está en el `Set`, ese es."
  - "`return` dentro del bucle sale de la función en ese momento. Si el bucle termina, no hubo clonados: `null`."
tests:
  - name: el ejemplo da 8
    run: primerClonado([4, 8, 1, 8, 4])
    equals: 8
  - name: sin repetidos, null
    run: primerClonado([1, 2, 3])
    equals: null
  - name: cola vacía, null
    run: primerClonado([])
    equals: null
  - name: dos iguales seguidos
    run: primerClonado([6, 6])
    equals: 6
  - name: 20 000 escaneos en menos de 50 ms
    expect: '(() => { const cola = Array.from({ length: 20000 }, (_, i) => 100000 + i); cola.push(119999); const t0 = performance.now(); const r = primerClonado(cola); return r === 119999 && performance.now() - t0 < 50; })()'
    msg: Con 20 000 escaneos tardó más de 50 ms (o no encontró el clonado del final). ¿Hay un bucle escondido, como includes, dentro del for?
```

```exercise
id: js17-escribe-cronometro
type: write
title: El cronómetro de la puerta
prompt: |
  Escribe `cronometra(tarea)`: ejecuta la función `tarea` y devuelve **cuántos milisegundos tardó**, medidos con `performance.now()`.

  Después escribe `cabe(tarea, presupuesto)`, que devuelve `true` si la tarea tardó como mucho `presupuesto` milisegundos. Úsala para avisar cuando una decisión de Chasqui se pasa de 50 ms.
visual:
  figure:
    input: { label: "cronometra(tarea)", table: { head: ["paso", "valor"], rows: [["inicio = performance.now()", "1200.0"], ["tarea()", "…"], ["fin = performance.now()", "1230.4"]] } }
    arrow: fin − inicio
    output: { label: devuelve, value: "30.4" }
starter: |
  function cronometra(tarea) {
  }

  function cabe(tarea, presupuesto) {
  }

  console.log(cabe(() => {}, 50));
solution: |
  function cronometra(tarea) {
    const inicio = performance.now();
    tarea();
    return performance.now() - inicio;
  }

  function cabe(tarea, presupuesto) {
    return cronometra(tarea) <= presupuesto;
  }

  console.log(cabe(() => {}, 50));
hints:
  - "Lee `performance.now()` antes y después de llamar `tarea()`, y devuelve la resta."
  - "`cabe` puede usar `cronometra`: compara lo que devuelve con el presupuesto."
tests:
  - name: cronometra devuelve un número
    expect: typeof cronometra(() => {}) === "number"
  - name: una tarea de 30 ms mide al menos 30
    expect: 'cronometra(() => { const t = performance.now(); while (performance.now() - t < 30) {} }) >= 30'
  - name: una tarea vacía cabe en 50 ms
    expect: cabe(() => {}, 50) === true
  - name: una tarea de 30 ms no cabe en 5
    expect: 'cabe(() => { const t = performance.now(); while (performance.now() - t < 30) {} }, 5) === false'
  - name: cronometra ejecuta la tarea
    expect: '(() => { let veces = 0; cronometra(() => { veces++; }); return veces === 1; })()'
```

## El caso

```exercise
id: js17-caso-rutinas
type: case
title: La rutina que no aguanta la cola
prompt: |
  Cuenta cuántas operaciones hace cada rutina con 1000 y con 2000 pasajeros, y calcula el factor: cuántas veces más trabajo hizo con el doble de gente.

  Cuatro proveedores le ofrecieron a la señora Maruja una rutina para detectar boletos clonados. Los cuatro juran lo mismo: "con el doble de pasajeros, mi rutina hace el doble de trabajo". Con 30 000 pasajeros, la que mienta va a parar la cola. Loop ya les puso un contador `ops` a las cuatro. ¿Qué proveedor mintió?

  Imprime una línea por rutina con el factor redondeado al final: `Saeta: factor 2`. El tablero lo compara con lo que prometió.
visual:
  board:
    for: js17-caso-rutinas
    title: Lo que prometió cada proveedor
    task: "Todos prometen factor 2: el doble de pasajeros, el doble de trabajo. Mide ops con 1000 y con 2000; el factor es ops(2000) / ops(1000)."
    cards:
      - { name: Saeta, kind: robot, rows: [["Promete", "factor 2"]], clue: { find: "Saeta", says: 2, saysLabel: "Prometió" } }
      - { name: Relámpago, kind: robot, rows: [["Promete", "factor 2"]], clue: { find: "Relámpago", says: 2, saysLabel: "Prometió" } }
      - { name: Zumbido, kind: robot, culprit: true, rows: [["Promete", "factor 2"]], clue: { find: "Zumbido", says: 2, saysLabel: "Prometió" } }
      - { name: Pique, kind: robot, rows: [["Promete", "factor 2"]], clue: { find: "Pique", says: 2, saysLabel: "Prometió" } }
    caption: "Factor 2: el trabajo crece igual que la cola. Factor 4: crece como n × n, y con 30 000 pasajeros es una catástrofe."
starter: |
  let ops = 0;

  // n pasajeros con códigos distintos
  const colaDe = (n) => Array.from({ length: n }, (_, i) => 500000 + ((i * 7919) % 1000003));

  function yaPaso(cola, i) {
    for (let j = 0; j < i; j++) {
      ops++;
      if (cola[j] === cola[i]) return true;
    }
    return false;
  }

  // Cada rutina devuelve cuántos boletos clonados hay en la cola.
  const rutinas = {
    "Saeta": (cola) => {
      const vistos = new Set();
      let clonados = 0;
      for (const codigo of cola) {
        ops++;
        if (vistos.has(codigo)) clonados++;
        else vistos.add(codigo);
      }
      return clonados;
    },
    "Relámpago": (cola) => {
      const veces = new Map();
      for (const codigo of cola) {
        ops++;
        veces.set(codigo, (veces.get(codigo) ?? 0) + 1);
      }
      let clonados = 0;
      for (const v of veces.values()) {
        ops++;
        clonados += v - 1;
      }
      return clonados;
    },
    "Zumbido": (cola) => {
      let clonados = 0;
      for (let i = 0; i < cola.length; i++) {
        if (yaPaso(cola, i)) clonados++;
      }
      return clonados;
    },
    "Pique": (cola) => {
      const visto = {};
      let clonados = 0;
      for (const codigo of cola) {
        ops += 2;
        if (visto[codigo]) clonados++;
        visto[codigo] = true;
      }
      return clonados;
    },
  };

  // Así se mide una rutina: se pone ops en 0, se ejecuta y se lee ops.
  ops = 0;
  rutinas["Saeta"](colaDe(5));
  console.log("Saeta con 5 pasajeros:", ops, "operaciones");

  // TODO: para cada rutina, mide ops con colaDe(1000) y con colaDe(2000)
  // e imprime: Saeta: factor 2   (ops con 2000 / ops con 1000, redondeado)
solution: |
  let ops = 0;

  const colaDe = (n) => Array.from({ length: n }, (_, i) => 500000 + ((i * 7919) % 1000003));

  function yaPaso(cola, i) {
    for (let j = 0; j < i; j++) {
      ops++;
      if (cola[j] === cola[i]) return true;
    }
    return false;
  }

  const rutinas = {
    "Saeta": (cola) => {
      const vistos = new Set();
      let clonados = 0;
      for (const codigo of cola) {
        ops++;
        if (vistos.has(codigo)) clonados++;
        else vistos.add(codigo);
      }
      return clonados;
    },
    "Relámpago": (cola) => {
      const veces = new Map();
      for (const codigo of cola) {
        ops++;
        veces.set(codigo, (veces.get(codigo) ?? 0) + 1);
      }
      let clonados = 0;
      for (const v of veces.values()) {
        ops++;
        clonados += v - 1;
      }
      return clonados;
    },
    "Zumbido": (cola) => {
      let clonados = 0;
      for (let i = 0; i < cola.length; i++) {
        if (yaPaso(cola, i)) clonados++;
      }
      return clonados;
    },
    "Pique": (cola) => {
      const visto = {};
      let clonados = 0;
      for (const codigo of cola) {
        ops += 2;
        if (visto[codigo]) clonados++;
        visto[codigo] = true;
      }
      return clonados;
    },
  };

  function medir(rutina, n) {
    ops = 0;
    rutina(colaDe(n));
    return ops;
  }

  for (const [nombre, rutina] of Object.entries(rutinas)) {
    const chica = medir(rutina, 1000);
    const grande = medir(rutina, 2000);
    console.log(`${nombre}: ${chica} → ${grande} ops, factor ${Math.round(grande / chica)}`);
  }
answer: Zumbido
answerLabel: ¿Qué proveedor mintió? (su nombre)
reveal: |
  Zumbido. Con 1000 pasajeros hace 499 500 operaciones y con 2000, 1 999 000: factor 4. Tiene un solo `for` a la vista, pero llama a `yaPaso`, que recorre todos los anteriores: un bucle dentro de otro, escondido en una función. Pique hace el doble de operaciones que Saeta y aun así cumple: lo que importa es cómo crece, no el número exacto.
hints:
  - "Escribe `medir(rutina, n)`: pone `ops = 0`, llama `rutina(colaDe(n))` y devuelve `ops`."
  - "Recorre las rutinas con `for (const [nombre, rutina] of Object.entries(rutinas))` y divide lo de 2000 entre lo de 1000."
```

## El juez

Este juez mide el tiempo: cada llamada tiene **50 ms**. Si te pasas, el veredicto es *Tiempo límite excedido*, aunque la respuesta sea correcta.

```exercise
id: js17-juez-embarque
type: judge
mode: function
function: validarEmbarque
limit: 50
title: El torniquete de hora punta
prompt: |
  Devuelve `[aceptados, repetidos, falsos]`: cuántos escaneos dejaron pasar, cuántos eran un boleto que ya había pasado y cuántos eran un boleto que nunca se vendió.

  `validarEmbarque(vendidos, escaneos)` recibe los códigos vendidos (todos distintos) y los escaneos de la puerta, en orden. Cada escaneo es uno de tres:

  - **falso**: su código no está en `vendidos`;
  - **repetido**: está vendido, pero ese boleto ya fue aceptado antes;
  - **aceptado**: está vendido y es la primera vez que pasa.

  **Restricciones:** hasta 60 000 vendidos y 60 000 escaneos · **50 ms por llamada**. El último caso oculto es la hora punta, con 60 000 y 60 000.
visual:
  figure:
    title: El ejemplo 1, escaneo por escaneo
    input: { label: "vendidos: 11, 25, 30, 47", table: { head: ["escaneo", "vendido / ya pasó", "veredicto"], rows: [["11", "sí / no", "aceptado"], ["99", "no", "falso"], ["25", "sí / no", "aceptado"], ["11", "sí / sí", "repetido"], ["47", "sí / no", "aceptado"], ["99", "no", "falso"]] } }
    arrow: contar cada veredicto
    output: { label: devuelve, value: "[3, 1, 2]" }
    steps:
      - "El 99 no se vendió: es falso las dos veces (un falso nunca es \"repetido\")."
      - "El segundo 11 ya había pasado: repetido."
starter: |
  function validarEmbarque(vendidos, escaneos) {
    return [0, 0, 0];
  }
solution: |
  function validarEmbarque(vendidos, escaneos) {
    const vendidosSet = new Set(vendidos);
    const pasaron = new Set();
    let aceptados = 0;
    let repetidos = 0;
    let falsos = 0;
    for (const codigo of escaneos) {
      if (!vendidosSet.has(codigo)) {
        falsos++;
      } else if (pasaron.has(codigo)) {
        repetidos++;
      } else {
        pasaron.add(codigo);
        aceptados++;
      }
    }
    return [aceptados, repetidos, falsos];
  }
hints:
  - "Dos `Set`: uno con los vendidos, armado una vez, y otro con los que ya pasaron."
  - "Pregunta primero si es falso; solo un boleto vendido puede ser repetido."
samples:
  - args: [[11, 25, 30, 47], [11, 99, 25, 11, 47, 99]]
    returns: [3, 1, 2]
    note: El 99 es falso las dos veces; el segundo 11 es repetido.
  - args: [[5], []]
    returns: [0, 0, 0]
    note: Nadie pasó todavía.
edge:
  - args: [[], [1, 2, 1]]
    tag: sin boletos vendidos
  - args: [[7, 8], [7, 7, 7, 8, 8]]
    tag: con el mismo boleto escaneado muchas veces
  - args: [[10, 20, 30], [30, 20, 10]]
    tag: con todos los boletos pasando una vez
random:
  count: 20
  seed: 17
  generate: |
    // El último caso es la hora punta: 60 000 vendidos y 60 000 escaneos.
    rng.vez = (rng.vez ?? 0) + 1;
    const grande = rng.vez === 20;
    const n = grande ? 60000 : rng.int(1, 300);
    const m = grande ? 60000 : rng.int(0, 300);
    const vendidos = [];
    let codigo = rng.int(10000, 10100);
    for (let i = 0; i < n; i++) {
      codigo += rng.int(1, 3);
      vendidos.push(codigo);
    }
    for (let i = n - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [vendidos[i], vendidos[j]] = [vendidos[j], vendidos[i]];
    }
    const escaneos = [];
    for (let i = 0; i < m; i++) {
      const r = rng.next();
      if (r < 0.1) escaneos.push(rng.int(10000, codigo + 10));
      else if (r < 0.2 && escaneos.length) escaneos.push(rng.pick(escaneos));
      else escaneos.push(vendidos[i % n]);
    }
    return [vendidos, escaneos];
wrong:
  - |
    function validarEmbarque(vendidos, escaneos) {
      const pasaron = [];
      let aceptados = 0, repetidos = 0, falsos = 0;
      for (const codigo of escaneos) {
        if (!vendidos.includes(codigo)) falsos++;
        else if (pasaron.includes(codigo)) repetidos++;
        else { pasaron.push(codigo); aceptados++; }
      }
      return [aceptados, repetidos, falsos];
    }
  - |
    function validarEmbarque(vendidos, escaneos) {
      const vendidosSet = new Set(vendidos);
      const pasaron = [];
      let aceptados = 0, repetidos = 0, falsos = 0;
      for (const codigo of escaneos) {
        if (!vendidosSet.has(codigo)) falsos++;
        else if (pasaron.includes(codigo)) repetidos++;
        else { pasaron.push(codigo); aceptados++; }
      }
      return [aceptados, repetidos, falsos];
    }
  - |
    function validarEmbarque(vendidos, escaneos) {
      const vendidosSet = new Set(vendidos);
      const vistos = new Set();
      let aceptados = 0, repetidos = 0, falsos = 0;
      for (const codigo of escaneos) {
        if (vistos.has(codigo)) repetidos++;
        else if (!vendidosSet.has(codigo)) falsos++;
        else aceptados++;
        vistos.add(codigo);
      }
      return [aceptados, repetidos, falsos];
    }
```

## Misión final

```exercise
id: js17-mision-andenes
type: mission
title: Hora punta en Yerbateros
prompt: |
  Escribe `andenDe(codigo)`, que dice el andén de un boleto en un instante, y lleva a cada pasajero de `pasajeros` a su andén.

  `boletosDelDia()` devuelve los 30 000 boletos del día, cada uno `{ codigo, anden }`, y `pasajeros` es la fila de códigos que espera en la puerta. Para cada pasajero, en orden:

  1. averigua su andén con `andenDe(codigo)`;
  2. camina por el pasillo hasta la bahía del andén: el andén `n` queda debajo de la columna `x = 2 × n`;
  3. `robot.marcar({ x: 2 * anden, y: 2 })` y `robot.decir(`Andén ${anden}`)`.

  Además, cada turno llega una ola de **3000 pasajeros**: `andenDe` tiene que atenderlos a todos en **menos de 50 ms**. El `find` del inicio da bien, pero tarda medio segundo. Se prueba con tres filas distintas.
visual:
  figure:
    title: Del boleto al andén
    panes:
      - { label: "boletosDelDia() (30 000)", cards: [{ title: "{ codigo, anden }", rows: [["240003", "3"], ["249148", "1"], ["…", "…"]] }] }
      - { label: "andén n → columna 2 × n", grid: ["#############", "#R..........#", "##.#.#.#.#.##", "#############"], marks: ["6,2"] }
      - { label: "presupuesto", table: { head: ["ola", "límite"], rows: [["3000 pasajeros", "50 ms en total"]] } }
starter: |
  const boletos = boletosDelDia();

  // Funciona, pero recorre los 30 000 boletos en cada consulta.
  function andenDe(codigo) {
    return boletos.find((b) => b.codigo === codigo).anden;
  }

  function caminarHasta(x) {
    const pasos = x - robot.posicion.x;
    robot.seguirRuta(Array(Math.abs(pasos)).fill(pasos > 0 ? "E" : "O"));
  }

  // TODO: haz que andenDe sea instantáneo
  // TODO: lleva a cada pasajero a su andén, márcalo y anúncialo
solution: |
  const boletos = boletosDelDia();
  const andenes = new Map();
  for (const { codigo, anden } of boletos) {
    andenes.set(codigo, anden);
  }

  function andenDe(codigo) {
    return andenes.get(codigo);
  }

  function caminarHasta(x) {
    const pasos = x - robot.posicion.x;
    robot.seguirRuta(Array(Math.abs(pasos)).fill(pasos > 0 ? "E" : "O"));
  }

  for (const codigo of pasajeros) {
    const anden = andenDe(codigo);
    caminarHasta(2 * anden);
    robot.marcar({ x: 2 * anden, y: 2 });
    robot.decir(`Andén ${anden}`);
  }
hints:
  - "Arma un `Map` de código → andén **una vez**, fuera de la función; `andenDe` solo hace `get`."
  - "Para los pasajeros: `for (const codigo of pasajeros)`, y dentro `caminarHasta(2 * anden)`, `marcar` y `decir`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, path]
  map: |
    #############
    #R..........#
    ##.#.#.#.#.##
    #############
helpers:
  - name: boletosDelDia
    sig: "boletosDelDia() → { codigo, anden }[]"
    doc: Los 30 000 boletos del día, cada uno con su código y su andén (1 a 5).
    code: "() => { const lista = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; lista.push({ codigo: 100000 + i * 7 + (x % 7), anden: 1 + (x % 5) }); } return lista; }"
  - name: olaDePasajeros
    sig: "olaDePasajeros() → number[]"
    doc: Los 3000 códigos de una ola de hora punta, para medir andenDe.
    code: "() => { const codigos = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; codigos.push(100000 + i * 7 + (x % 7)); } const ola = []; let y = 7; for (let i = 0; i < 3000; i++) { y = (y * 48271) % 2147483647; ola.push(codigos[y % 30000]); } return ola; }"
  - name: pasajeros
    sig: "pasajeros: number[]"
    doc: Los códigos de los pasajeros que esperan en la puerta, en orden.
globals:
  pasajeros: [240003, 249148, 258252, 267399]
scenarios:
  - tests:
      - name: anuncia los andenes 3, 1, 5 y 2, en orden
        state: 'w.said.join(" | ") === "Andén 3 | Andén 1 | Andén 5 | Andén 2"'
      - name: marca esas cuatro bahías
        state: 'w.marks.length === 4 && ["6,2", "2,2", "10,2", "4,2"].every((k) => w.marks.includes(k))'
      - name: atiende una ola de 3000 en menos de 50 ms
        expect: '(() => { const ola = olaDePasajeros(); const t0 = performance.now(); for (const c of ola) andenDe(c); return performance.now() - t0 < 50; })()'
        msg: La ola de 3000 pasajeros tardó más de 50 ms. ¿andenDe recorre la lista en cada consulta?
  - globals:
      pasajeros: [177020, 186131]
    tests:
      - name: anuncia los andenes 4 y 2
        state: 'w.said.join(" | ") === "Andén 4 | Andén 2"'
      - name: marca esas dos bahías
        state: 'w.marks.length === 2 && ["8,2", "4,2"].every((k) => w.marks.includes(k))'
  - globals:
      pasajeros: [121018, 130126, 139244, 148396, 157502]
    tests:
      - name: anuncia los andenes 2, 5, 1, 4 y 3
        state: 'w.said.join(" | ") === "Andén 2 | Andén 5 | Andén 1 | Andén 4 | Andén 3"'
      - name: marca esas cinco bahías
        state: 'w.marks.length === 5 && ["4,2", "10,2", "2,2", "8,2", "6,2"].every((k) => w.marks.includes(k))'
tests:
  - name: andenDe da el andén de un boleto
    expect: andenDe(240003) === 3
  - name: usa un Map o un Set
    source: 'new (Map|Set)\b'
  - name: sin chocar
    state: '!w.crashed'
```

## Reto experto

```exercise
id: js17-reto-parejas
type: challenge
title: Asientos dobles
prompt: |
  El bus cama tiene asientos dobles, y la señora Maruja junta parejas de pasajeros cuyas maletas pesan **exactamente** `bodega` kilos entre las dos. Escribe `parejas(pesos, bodega)`: cuántos pares `i < j` cumplen `pesos[i] + pesos[j] === bodega`. Con 50 000 pasajeros tiene que contestar en menos de 50 ms: nada de bucle doble. Pista: al llegar a cada maleta, ¿cuántas de las anteriores la completan?
starter: |
  function parejas(pesos, bodega) {
    let total = 0;
    for (let i = 0; i < pesos.length; i++) {
      for (let j = i + 1; j < pesos.length; j++) {
        if (pesos[i] + pesos[j] === bodega) total++;
      }
    }
    return total;
  }

  console.log(parejas([10, 20, 10, 20, 15, 15], 30));
solution: |
  function parejas(pesos, bodega) {
    const vistas = new Map();
    let total = 0;
    for (const peso of pesos) {
      total += vistas.get(bodega - peso) ?? 0;
      vistas.set(peso, (vistas.get(peso) ?? 0) + 1);
    }
    return total;
  }

  console.log(parejas([10, 20, 10, 20, 15, 15], 30));
hints:
  - "Lleva un `Map` de peso → cuántas maletas con ese peso ya pasaron. La maleta nueva hace pareja con todas las que pesan `bodega - peso`."
tests:
  - name: el ejemplo da 5
    run: parejas([10, 20, 10, 20, 15, 15], 30)
    equals: 5
  - name: sin pasajeros, 0
    run: parejas([], 30)
    equals: 0
  - name: una maleta sola no hace pareja consigo misma
    run: parejas([15], 30)
    equals: 0
  - name: 50 000 pasajeros en menos de 50 ms
    expect: '(() => { const p = Array.from({ length: 50000 }, (_, i) => (i * 37) % 41); const t0 = performance.now(); const r = parejas(p, 40); return r > 0 && performance.now() - t0 < 50; })()'
    msg: Con 50 000 pasajeros tardó más de 50 ms. ¿Queda un bucle dentro de otro?
```
