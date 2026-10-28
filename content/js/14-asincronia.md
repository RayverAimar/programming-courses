# Sesión 14 — Asincronía

## El encargo

Puno, cuatro de la tarde, a tres cuadras del muelle. Doña Teodora Mamani tiene Encomiendas Titicaca: recibe paquetes de Juliaca y los manda en lancha a las islas. Todo pasa por un servidor que vive al otro lado de una antena en el cerro Azoguini, y la antena funciona como el WhatsApp de su sobrino: contesta tarde, y a veces no contesta.

Doña Teodora contrató a Chasqui para llevar cada encomienda al muelle, pero primero tiene que **preguntarle al servidor** qué ruta seguir y qué etiqueta poner. Si Chasqui se queda congelado esperando cada respuesta, la lancha de las cinco zarpa sin el paquete. Hoy aprende a pedir algo, seguir con su vida mientras llega y reaccionar cuando el servidor falla.

```escena
theme: barranco
level: 4
dir: E
caption: La oficina de Encomiendas Titicaca (a la izquierda) y el buzón del muelle (D). La ruta y la etiqueta las sabe el servidor, no Chasqui.
map: |
  ##########
  #R...#...#
  ####.#.#.#
  ####...#D#
  ##########
program: |
  robot.decir("¿Ruta? ¿Etiqueta?");
  robot.avanzar(3);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(2);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.entregar("Encomienda 31 · Taquile");
```

## Lo mínimo

Hasta ahora cada línea terminaba antes de que empezara la siguiente. Pedirle algo a un servidor no es así: la respuesta tarda. JavaScript no se detiene a esperar; te da una **promesa**, como el ticket que te dan en la ventanilla de encomiendas: todavía no es tu paquete, pero dice que llegará (o que hubo un problema).

- **`async function`** declara una función que puede esperar. Siempre devuelve una promesa.
- **`await promesa`** pausa *esa* función hasta que la promesa se cumple, y te da su valor. El resto del programa sigue andando.
- Si la promesa se **rechaza** (el servidor falló), `await` lanza el error: lo atrapas con **`try { … } catch (error) { … }`**, como cualquier otro error.
- **`Promise.all([p1, p2])`** espera varias promesas **a la vez** y te da sus valores en el mismo orden. Dos pedidos en paralelo tardan lo que el más lento, no la suma.
- **`setTimeout(funcion, ms)`** es la forma antigua de "avísame después": recibe un *callback*, que es una función que el navegador deja en la cola de avisos cuando pasa el tiempo. Se envuelve en una promesa con `new Promise((resolve) => setTimeout(resolve, ms))`.

```exercise
id: js14-demo-encomienda
type: demo
async: true
starter: |
  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function traerEncomienda(codigo) {
    await esperar(200);
    return `${codigo}: 4 kilos`;
  }

  console.log("Pido la encomienda…");
  const respuesta = await traerEncomienda("P-101");
  console.log(respuesta);
```

(Un `await` suelto, fuera de una función, solo funciona en el Taller y en los módulos; dentro de cualquier otra función necesitas `async`.)

En los ejercicios de hoy, el servidor del Taller se llama `taller`: `await taller.pedir("ruta")` trae un recurso, y `taller.ahora()` dice cuántos milisegundos van. El tiempo es simulado: nada espera de verdad, pero las demoras y las fallas son las mismas cada vez que corres.

Antes de los dos pedidos, mira qué pasa con **tu código** mientras algo espera. Es la pregunta que casi todos se hacen: ¿quién espera, adónde va mi código y quién lo despierta?

```red
title: Quién espera y quién despierta a tu código
caption: "JavaScript hace **una sola cosa a la vez**: lo que corre está en la pila. Esperar no ocupa la pila; lo hace el navegador."
clockLabel: Desde el pedido
clockMax: 0.4
speed: 4200
nodes:
  - { id: code, icon: program, label: Tu código, sub: "`pedir()` y `console.log`" }
  - { id: stack, icon: box, label: Pila de llamadas, sub: lo que corre ahora }
  - { id: wait, icon: os, label: Zona de espera, sub: el navegador cuenta el tiempo y espera la red }
  - { id: queue, icon: record, label: Cola de avisos, sub: continuaciones listas para correr }
  - { id: loop, icon: engine, label: Bucle de eventos, sub: "¿la pila está vacía?" }
steps:
  - phase: "1. Pides algo lento"
    move: [code, stack]
    packet: { kind: local, label: "la llamada `pedir(\"ruta\")`" }
    clock: 0
    clockText: 0 ms
    note: "Tu código llama a `pedir`. La llamada entra a la **pila de llamadas**, que es donde corre lo que está corriendo."
    tags: { stack: "pedir() corriendo" }
  - move: [stack, wait]
    packet: { kind: up, label: "el pedido de la ruta" }
    clock: 0
    clockText: 0 ms
    note: "`pedir` **no se queda esperando**: entrega el pedido a la zona de espera y la llamada termina. La pila queda vacía."
    tags: { stack: "vacía", wait: "esperando la ruta" }
  - phase: "2. Mientras tanto"
    move: [code, stack]
    packet: { kind: local, label: "`console.log(\"sigo\")`" }
    clock: 0.05
    clockText: 50 ms
    note: "Como la pila está libre, tu código sigue con la línea de abajo: imprime `sigo`. El pedido viaja por su cuenta; nadie lo está mirando."
    tags: { stack: "console.log corriendo", wait: "esperando la ruta" }
  - phase: "3. Llega la respuesta"
    move: [wait, queue]
    packet: { kind: down, label: "la respuesta, lista" }
    clock: 0.12
    clockText: 120 ms
    note: "A los 120 ms llega la respuesta. La zona de espera **no corre nada**: deja un aviso en la cola, «cuando puedas, sigue después del `await`»."
    tags: { queue: "1 aviso", stack: "vacía" }
  - at: loop
    busy: [loop]
    clock: 0.12
    clockText: 120 ms
    note: "El **bucle de eventos** repite una sola pregunta: «¿la pila está vacía?». Si lo está y hay un aviso en la cola, toma el primero."
    tags: { queue: "1 aviso", stack: "vacía" }
  - move: [loop, stack]
    packet: { kind: local, label: "el aviso: sigue después del `await`" }
    dim: [wait, queue]
    clock: 0.12
    clockText: 120 ms
    note: "El aviso pasa a la pila y tu función **continúa justo después del `await`**, con la respuesta en la mano. Así \"despierta\" un `await`. Si tu código estuviera ocupado en un bucle larguísimo, el aviso esperaría: nada interrumpe lo que está corriendo."
    tags: { stack: "tu función continúa" }
```

Mira dos pedidos en paralelo. Cada uno sale como promesa pendiente; `await Promise.all` espera hasta que llegue el último.

```anima
title: Dos pedidos a la vez, un solo await
code: |
  const pRuta = taller.pedir("ruta");
  const pEtiqueta = taller.pedir("etiqueta");
  const [ruta, etiqueta] = await Promise.all([pRuta, pEtiqueta]);
  console.log(ruta.length, etiqueta);
steps:
  - { line: 1, vars: { reloj: "0 ms", pRuta: "⏳ pendiente" }, note: "pedir no espera: devuelve al toque una promesa pendiente." }
  - { line: 2, vars: { reloj: "0 ms", pRuta: "⏳ pendiente", pEtiqueta: "⏳ pendiente" }, note: "El segundo pedido también sale a los 0 ms: los dos viajan a la vez." }
  - { line: 3, vars: { reloj: "0 ms", pRuta: "⏳ pendiente", pEtiqueta: "⏳ pendiente" }, note: "await: el programa se queda en esta línea hasta que lleguen las dos." }
  - { line: 3, vars: { reloj: "120 ms", pRuta: "⏳ pendiente", pEtiqueta: "✓ Encomienda 31" }, note: "La etiqueta llega primero…" }
  - { line: 3, vars: { reloj: "260 ms", pRuta: "✓ 13 pasos", pEtiqueta: "✓ Encomienda 31", ruta: "[13 pasos]", etiqueta: "Encomienda 31" }, note: "…y con la última, Promise.all entrega las dos, en el orden en que las pediste." }
  - { line: 4, vars: { reloj: "260 ms", ruta: "[13 pasos]", etiqueta: "Encomienda 31" }, out: "13 Encomienda 31", note: "Total: 260 ms, lo que tardó la más lenta. Una tras otra habrían sido 120 + 260." }
```

```figura
title: Uno tras otro o a la vez
caption: Cada barra es un pedido viajando. Con `await` uno por uno, los tiempos se suman; con `Promise.all`, se superponen.
panes:
  - { label: "Uno tras otro: 260 + 120 = 380 ms", text: "          0    100  200  300  400\nruta      █████████████\netiqueta               ██████" }
  - { label: "Con Promise.all: 260 ms", text: "          0    100  200  300  400\nruta      █████████████\netiqueta  ██████" }
```

> **Trampa común:** olvidar el `await`. `const kilos = taller.pedir("P-101")` no guarda los kilos: guarda la promesa. Si después ves `[object Promise]` o un total que no cambia, busca el `await` que falta.

<!-- legacy: promises -->

<!-- legacy: async-await -->

<!-- mdn: promises async-await await promise-all set-timeout -->

## Práctica

```exercise
id: js14-predice-orden
type: predict
async: true
title: ¿Quién llega primero?
prompt: |
  `setTimeout` deja una función programada y el programa sigue. ¿Qué imprime?
code: |
  console.log("Chasqui pide la ruta");
  setTimeout(() => console.log("Llegó la ruta"), 300);
  setTimeout(() => console.log("Llegó la etiqueta"), 100);
  console.log("Chasqui ordena la oficina");
options:
  - "Chasqui pide la ruta\nLlegó la ruta\nLlegó la etiqueta\nChasqui ordena la oficina"
  - "Chasqui pide la ruta\nChasqui ordena la oficina\nLlegó la ruta\nLlegó la etiqueta"
  - "Chasqui pide la ruta\nChasqui ordena la oficina\nLlegó la etiqueta\nLlegó la ruta"
  - "Chasqui pide la ruta\nLlegó la etiqueta\nLlegó la ruta\nChasqui ordena la oficina"
answer: "Chasqui pide la ruta\nChasqui ordena la oficina\nLlegó la etiqueta\nLlegó la ruta"
explain: |
  Las dos funciones quedan programadas y el programa sigue: primero salen las dos líneas normales. Después, cada callback corre cuando le toca: la etiqueta a los 100 ms, la ruta a los 300 ms. El orden en el código no importa; importa el reloj.
```

```exercise
id: js14-predice-sin-await
type: predict
title: Los kilos que no eran kilos
prompt: |
  Una función `async` siempre devuelve una promesa. Aquí falta algo. ¿Qué imprime?
code: |
  async function pesar(codigo) {
    return 5;
  }
  const kilos = pesar("P-101");
  console.log(kilos + 1);
options:
  - "6"
  - "[object Promise]1"
  - "NaN"
  - "undefined1"
answer: "[object Promise]1"
explain: |
  `pesar` devuelve una promesa de 5, no un 5. Sumarle 1 convierte la promesa en texto, `"[object Promise]"`, y le pega el 1. Con `const kilos = await pesar("P-101");` imprimiría 6.
```

```exercise
id: js14-completa-zarpar
type: complete
async: true
title: Del callback a la promesa
prompt: |
  La sirena del muelle avisa con un callback, a la antigua. Envuelve `setTimeout` en una promesa para poder usar `await`, y completa `zarpar` para que espere 500 ms entre los dos mensajes.
visual:
  figure:
    input: { label: "callback", text: "setTimeout(funcion, 500)" }
    arrow: "new Promise((resolve) => …)"
    output: { label: "promesa", text: "await esperar(500)" }
starter: |
  const esperar = (ms) => new Promise((resolve) => ___(resolve, ms));

  ___ function zarpar() {
    console.log("Subiendo encomiendas");
    ___ esperar(500);
    console.log("¡Zarpamos!");
  }

  await zarpar();
solution: |
  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function zarpar() {
    console.log("Subiendo encomiendas");
    await esperar(500);
    console.log("¡Zarpamos!");
  }

  await zarpar();
hints:
  - El primer hueco es la función de siempre que llama a otra después de unos milisegundos.
  - Una función que usa `await` por dentro tiene que declararse `async`.
tests:
  - name: imprime los dos mensajes en orden
    output: "Subiendo encomiendas\n¡Zarpamos!"
  - name: espera 500 ms
    state: s.clock === 500
    msg: Entre los dos mensajes deben pasar 500 ms del reloj simulado.
```

```exercise
id: js14-arregla-foreach
type: fix
server: { seed: 3, latency: [100, 300], data: { "P-301": 4, "P-302": 9, "P-303": 5 } }
title: El total que siempre da cero
prompt: |
  Doña Teodora quiere el peso total de tres encomiendas, pero el programa imprime `Total: 0 kilos`. Cada pedido llega bien. ¿Por qué el total no se entera?
visual:
  figure:
    panes:
      - { label: "lo que dice el servidor", cards: [{ title: "P-301", rows: [["kilos", "4"]] }, { title: "P-302", rows: [["kilos", "9"]] }, { title: "P-303", rows: [["kilos", "5"]] }] }
      - { label: "total esperado", value: "18 kilos" }
starter: |
  const codigos = ["P-301", "P-302", "P-303"];
  let total = 0;

  codigos.forEach(async (codigo) => {
    total += await taller.pedir(codigo);
  });

  console.log(`Total: ${total} kilos`);
solution: |
  const codigos = ["P-301", "P-302", "P-303"];
  let total = 0;

  for (const codigo of codigos) {
    total += await taller.pedir(codigo);
  }

  console.log(`Total: ${total} kilos`);
hints:
  - "`forEach` llama a la función async y **no espera** su promesa: el `console.log` corre cuando todavía no llegó nada."
  - "Un `for...of` con `await` adentro sí espera cada vuelta. (Con `Promise.all` y `map` irían en paralelo.)"
tests:
  - name: el total es 18
    output: "Total: 18 kilos"
  - name: no usa forEach con async
    sourceNot: 'forEach\s*\(\s*async'
    msg: forEach no espera promesas; usa for...of con await, o Promise.all.
```

```exercise
id: js14-escribe-reintento
type: write
server: { seed: 5, latency: [100, 300], failOn: [1, 2], data: { clima: viento suave } }
title: Pregúntale otra vez
prompt: |
  Escribe `pedirConReintento(recurso, intentos = 4)`: pide el recurso y, si el servidor falla, **espera 100 ms y vuelve a pedirlo**, hasta `intentos` veces en total. Si todas fallan, lanza el último error.

  El final del programa ya está escrito: imprime el clima del lago, o `Sin señal` con el status del error.
visual:
  figure:
    title: Un caso que sale bien al tercer intento
    panes:
      - { cards: [{ title: "intento 1", rows: [["responde", "503 ✗"], ["después", "espera 100 ms"]] }, { title: "intento 2", rows: [["responde", "503 ✗"], ["después", "espera 100 ms"]] }, { title: "intento 3", rows: [["responde", "\"viento suave\" ✓"], ["después", "lo devuelve"]] }] }
starter: |
  async function pedirConReintento(recurso, intentos = 4) {
    // TODO: un bucle de intentos; dentro, try { return await … } catch { … }
  }

  try {
    const clima = await pedirConReintento("clima");
    console.log(`Clima: ${clima}`);
  } catch (error) {
    console.log(`Sin señal: ${error.status}`);
  }
solution: |
  async function pedirConReintento(recurso, intentos = 4) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        return await taller.pedir(recurso);
      } catch (error) {
        if (intento === intentos) throw error;
        await taller.esperar(100);
      }
    }
  }

  try {
    const clima = await pedirConReintento("clima");
    console.log(`Clima: ${clima}`);
  } catch (error) {
    console.log(`Sin señal: ${error.status}`);
  }
hints:
  - "Un `for` de 1 a `intentos`. Dentro, `return await taller.pedir(recurso)` sale de la función apenas funciona."
  - "En el `catch`: si era el último intento, `throw error`; si no, `await taller.esperar(100)` y el bucle sigue."
tests:
  - name: pedirConReintento es async
    source: 'async\s+function\s+pedirConReintento'
scenarios:
  - tests:
      - name: falla dos veces y a la tercera trae el clima
        output: "Clima: viento suave"
      - name: pide exactamente 3 veces
        state: s.requests.length === 3
      - name: espera 100 ms antes de reintentar
        state: s.requests[1].start - s.requests[0].end === 100
        msg: Después de una falla, espera 100 ms con taller.esperar(100) antes de volver a pedir.
  - server: { failOn: [1, 2, 3, 4, 5, 6] }
    tests:
      - name: si el servidor está caído, se rinde con el error
        output: "Sin señal: 503"
      - name: lo intenta 4 veces, ni una más
        state: s.requests.length === 4
  - server: { failOn: [] }
    tests:
      - name: si responde a la primera, pide una sola vez
        state: s.requests.length === 1
```

```exercise
id: js14-arregla-paralelo
type: fix
server: { seed: 8, latency: [100, 300], data: { clima: despejado, ruta: [E, E, S], etiqueta: Encomienda 12 } }
title: La lancha no espera
prompt: |
  La lancha zarpa a los **400 ms** y Chasqui necesita tres datos del servidor. Este programa los pide uno tras otro y llega tarde. Haz que pida los tres **a la vez**.
visual:
  figure:
    panes:
      - { label: "uno tras otro: 131 + 160 + 217 = 508 ms", text: "          0    100  200  300  400  500\nclima     ███████\nruta             ████████\netiqueta                 ██████████" }
      - { label: "la lancha", value: "zarpa a los 400 ms" }
starter: |
  const inicio = taller.ahora();
  const clima = await taller.pedir("clima");
  const ruta = await taller.pedir("ruta");
  const etiqueta = await taller.pedir("etiqueta");

  console.log(`${etiqueta}: ${ruta.length} pasos, ${clima}`);
  console.log(`Listo a los ${taller.ahora() - inicio} ms`);
solution: |
  const inicio = taller.ahora();
  const [clima, ruta, etiqueta] = await Promise.all([
    taller.pedir("clima"),
    taller.pedir("ruta"),
    taller.pedir("etiqueta"),
  ]);

  console.log(`${etiqueta}: ${ruta.length} pasos, ${clima}`);
  console.log(`Listo a los ${taller.ahora() - inicio} ms`);
hints:
  - "`Promise.all([...])` recibe las tres promesas y devuelve una sola, que trae los tres valores."
  - "Desestructura el resultado en el mismo orden: `const [clima, ruta, etiqueta] = await Promise.all([…]);`"
tests:
  - name: imprime los tres datos
    outputIncludes: "Encomienda 12: 3 pasos, despejado"
  - name: los tres pedidos salen a los 0 ms
    state: s.requests.length === 3 && s.requests.every((r) => r.start === 0)
    msg: Los tres pedidos deben salir juntos, sin esperar uno al otro.
  - name: listo antes de que zarpe la lancha
    state: s.clock <= 400
    msg: Con los tres a la vez, el tiempo total es el del más lento.
```

## El caso

```exercise
id: js14-caso-lancha
type: case
server: { seed: 14, latency: [80, 260], failOn: [4, 9, 14], data: { manifiesto: [{ codigo: P-301, isla: Taquile }, { codigo: P-302, isla: Amantaní }, { codigo: P-303, isla: Uros }, { codigo: P-304, isla: Anapia }, { codigo: P-305, isla: Taquile }, { codigo: P-306, isla: Amantaní }, { codigo: P-307, isla: Uros }, { codigo: P-308, isla: Anapia }, { codigo: P-309, isla: Taquile }, { codigo: P-310, isla: Amantaní }, { codigo: P-311, isla: Uros }, { codigo: P-312, isla: Anapia }], "P-301": 4, "P-302": 5, "P-303": 7, "P-304": 6, "P-305": 6, "P-306": 8, "P-307": 12, "P-308": 4, "P-309": 3, "P-310": 2, "P-311": 5, "P-312": 9 } }
title: La lancha que pesaba de más
prompt: |
  Pide al servidor el peso de cada encomienda, suma los kilos que lleva cada isla e imprime una línea por isla para compararla con lo que declaró su lanchero.

  En el muelle se paga peaje por kilo. Cada lanchero declaró cuántos kilos llevaba, y uno declaró menos para pagar menos. El manifiesto (qué encomienda va a qué isla) y el peso de cada encomienda están en el servidor: `taller.pedir("manifiesto")` y `taller.pedir("P-301")` → kilos. El servidor falla de vez en cuando, así que **reintenta** cuando falle.

  Imprime cada isla con sus kilos al final, por ejemplo `Taquile: 13`. El tablero compara tu número con lo que declaró el lanchero de esa isla.
visual:
  board:
    for: js14-caso-lancha
    title: Lo que declaró cada lanchero en el muelle
    task: Suma los kilos reales de cada isla con lo que traes del servidor y compáralos con lo declarado.
    cards:
      - { name: Hilario, kind: person, role: "Lancha a Taquile", rows: [["Declaró", "13 kg"]], clue: { find: "Taquile", says: 13, saysLabel: "Declaró" } }
      - { name: Marcelina, kind: person, role: "Lancha a Amantaní", rows: [["Declaró", "15 kg"]], clue: { find: "Amantaní", says: 15, saysLabel: "Declaró" } }
      - { name: Wilber, kind: person, role: "Lancha a Uros", culprit: true, rows: [["Declaró", "17 kg"]], clue: { find: "Uros", says: 17, saysLabel: "Declaró" } }
      - { name: Nayda, kind: person, role: "Lancha a Anapia", rows: [["Declaró", "19 kg"]], clue: { find: "Anapia", says: 19, saysLabel: "Declaró" } }
    caption: "**Cuadra**: declaró justo lo que lleva. Si no cuadra, alguien pagó menos peaje."
starter: |
  // El manifiesto está en el servidor. Así se pide algo (esta vez respondió a la primera):
  const manifiesto = await taller.pedir("manifiesto");
  console.log(`El manifiesto tiene ${manifiesto.length} encomiendas, y cada una trae: ${Object.keys(manifiesto[0]).join(", ")}`);

  // TODO: escribe pedirConReintento(recurso): si el servidor falla, espera 100 ms y vuelve a pedir.

  // TODO: pide el peso de todas las encomiendas a la vez (Promise.all con map).
  // Cada código es un recurso: taller.pedir("P-301") → 4

  // TODO: suma los kilos por isla e imprime una línea por isla: Taquile: 13
solution: |
  async function pedirConReintento(recurso, intentos = 4) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        return await taller.pedir(recurso);
      } catch (error) {
        if (intento === intentos) throw error;
        await taller.esperar(100);
      }
    }
  }

  const manifiesto = await pedirConReintento("manifiesto");
  const pesos = await Promise.all(manifiesto.map(({ codigo }) => pedirConReintento(codigo)));

  const kilosPorIsla = {};
  manifiesto.forEach(({ isla }, i) => {
    kilosPorIsla[isla] = (kilosPorIsla[isla] ?? 0) + pesos[i];
  });

  for (const [isla, kilos] of Object.entries(kilosPorIsla)) {
    console.log(`${isla}: ${kilos}`);
  }
answer: Uros
answerLabel: ¿La lancha de qué isla declaró de menos?
reveal: |
  Wilber: su lancha a Uros lleva 24 kilos (7 + 12 + 5) y declaró 17. Los 7 kilos que faltan son, según él, "queso de Juliaca para mi tía, eso no cuenta". Sí cuenta.
hints:
  - "Con `manifiesto.map(({ codigo }) => pedirConReintento(codigo))` tienes una lista de promesas; `await Promise.all(…)` te da la lista de pesos en el mismo orden."
  - "Recorre el manifiesto con su índice: el peso de `manifiesto[i]` es `pesos[i]`. Acumula en un objeto `{ isla: kilos }`."
```

## El juez

Este juez llama a una función `async`: espera su promesa y compara lo que entrega. Cada caso tiene su propio servidor, con las mismas fallas: **siempre fallan los pedidos número 1, 2, 4 y 7** de cada caso, cuente quien cuente.

```exercise
id: js14-juez-peso
type: judge
mode: function
function: pesoTotal
server: { seed: 41, latency: [50, 250], failOn: [1, 2, 4, 7], data: { "P-101": 4, "P-102": 7, "P-103": 2, "P-104": 9, "P-105": 5, "P-106": 3, "P-107": 8, "P-108": 6, "P-109": 1, "P-110": 10, "P-111": 4, "P-112": 7 } }
title: El peso de la carga
prompt: |
  Escribe `pesoTotal(codigos)`, que pide al servidor el peso de cada encomienda y devuelve `[kilos, faltan]`: la suma de los kilos y la lista de códigos que el servidor **no tiene**.

  Doña Teodora pesa la carga antes de subirla a la lancha. Cada código es un recurso del servidor: `await taller.pedir("P-104")` → `9`. El servidor contesta de dos maneras malas, y cada una se trata distinto (el error trae su número en `error.status`):

  - **503**, no respondió: vuelve a pedirlo. Con 4 intentos por código alcanza.
  - **404**, no existe ese código: no reintentes; ese código va a la lista `faltan`, en el orden de `codigos`.

  Escribe también `pedirConReintento(codigo)`: devuelve los kilos, o `null` si el código no existe. El juez la prueba sola.

  **Restricciones:** de 0 a 8 códigos, sin repetir · los kilos son enteros de 1 a 10.
visual:
  figure:
    title: El ejemplo 1, código por código
    input: { label: 'pesoTotal(["P-101", "P-150", "P-104"])', cards: [{ title: "P-101", rows: [["1.er pedido", "503 ✗"], ["2.º pedido", "4 ✓"], ["aporta", "4 kg"]] }, { title: "P-150", rows: [["1.er pedido", "503 ✗"], ["2.º pedido", "503 ✗"], ["3.er pedido", "404: no existe"], ["aporta", "va a faltan"]] }, { title: "P-104", rows: [["1.er pedido", "9 ✓"], ["aporta", "9 kg"]] }] }
    arrow: suma 4 + 9, y P-150 falta
    output: { label: devuelve, value: '[13, ["P-150"]]' }
    steps:
      - "Un 503 no dice nada del código: solo que el servidor no contestó. Por eso se reintenta."
      - "Un 404 sí dice algo: ese código no existe. Reintentarlo no sirve."
starter: |
  async function pedirConReintento(codigo) {
  }

  async function pesoTotal(codigos) {
  }
solution: |
  async function pedirConReintento(codigo, intentos = 4) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        return await taller.pedir(codigo);
      } catch (error) {
        if (error.status === 404) return null;
        if (intento === intentos) throw error;
      }
    }
  }

  async function pesoTotal(codigos) {
    const pesos = await Promise.all(codigos.map((codigo) => pedirConReintento(codigo)));
    let kilos = 0;
    const faltan = [];
    pesos.forEach((peso, i) => {
      if (peso === null) faltan.push(codigos[i]);
      else kilos += peso;
    });
    return [kilos, faltan];
  }
hints:
  - "En el `catch`, mira `error.status`: si es 404, `return null`; si es 503, deja que el bucle vuelva a intentar."
  - "`await Promise.all(codigos.map((codigo) => pedirConReintento(codigo)))` te da los pesos en el orden de `codigos`; los `null` son los que faltan."
samples:
  - args: [["P-101", "P-150", "P-104"]]
    returns: [13, ["P-150"]]
    note: "P-101 y P-150 fallan con 503 y se reintentan; cuando el servidor por fin contesta, dice que P-150 no existe (404)."
  - args: [["P-110", "P-107"]]
    returns: [18, []]
  - fn: pedirConReintento
    args: ["P-104"]
    returns: 9
    note: "Falla dos veces (pedidos 1 y 2) y a la tercera trae los 9 kilos."
edge:
  - args: [[]]
    tag: sin ninguna encomienda
  - args: [["P-999", "P-000"]]
    tag: con todos los códigos inexistentes
  - fn: pedirConReintento
    args: ["P-404"]
    tag: en pedirConReintento, con un código que no existe
  - args: [["P-101", "P-102", "P-103", "P-104", "P-105", "P-106", "P-107", "P-108"]]
    tag: con la carga máxima
  - args: [["P-109"]]
    tag: con una sola encomienda
random:
  count: 40
  seed: 14
  generate: |
    const pool = ["P-101", "P-102", "P-103", "P-104", "P-105", "P-106", "P-107", "P-108", "P-109", "P-110", "P-111", "P-112", "P-150", "P-199", "P-000", "P-777"];
    const n = rng.int(0, 8);
    const out = [];
    while (out.length < n) {
      const c = rng.pick(pool);
      if (!out.includes(c)) out.push(c);
    }
    return [out];
wrong:
  - |
    async function pedirConReintento(codigo) {
      try {
        return await taller.pedir(codigo);
      } catch (error) {
        return null;
      }
    }
    async function pesoTotal(codigos) {
      const pesos = await Promise.all(codigos.map((codigo) => pedirConReintento(codigo)));
      let kilos = 0;
      const faltan = [];
      pesos.forEach((peso, i) => {
        if (peso === null) faltan.push(codigos[i]);
        else kilos += peso;
      });
      return [kilos, faltan];
    }
  - |
    async function pedirConReintento(codigo) {
      return await taller.pedir(codigo);
    }
    async function pesoTotal(codigos) {
      let kilos = 0;
      for (const codigo of codigos) kilos += await pedirConReintento(codigo);
      return [kilos, []];
    }
  - |
    async function pedirConReintento(codigo, intentos = 4) {
      for (let intento = 1; intento <= intentos; intento++) {
        try {
          return await taller.pedir(codigo);
        } catch (error) {
          if (error.status === 404) return null;
          if (intento === intentos) throw error;
        }
      }
    }
    async function pesoTotal(codigos) {
      let kilos = 0;
      const faltan = [];
      codigos.forEach(async (codigo) => {
        const peso = await pedirConReintento(codigo);
        if (peso === null) faltan.push(codigo);
        else kilos += peso;
      });
      return [kilos, faltan];
    }
  - |
    async function pedirConReintento(codigo, intentos = 4) {
      for (let intento = 1; intento <= intentos; intento++) {
        try {
          return await taller.pedir(codigo);
        } catch (error) {
          if (error.status === 404) return 0;
          if (intento === intentos) throw error;
        }
      }
    }
    async function pesoTotal(codigos) {
      const pesos = await Promise.all(codigos.map((codigo) => pedirConReintento(codigo)));
      return [pesos.reduce((a, b) => a + b, 0), []];
    }
```

## Misión final

```exercise
id: js14-mision-muelle
type: mission
title: La lancha de las cinco
prompt: |
  Pide al servidor la `ruta` y la `etiqueta` **a la vez**, reintentando si falla, y lleva la encomienda al muelle.

  - `await taller.pedir("ruta")` → una lista de direcciones, como `["E", "E", "S"]`
  - `await taller.pedir("etiqueta")` → el texto que va en el paquete
  - `robot.seguirRuta(ruta)` recorre la ruta; `robot.entregar(etiqueta)` deja el paquete en el buzón (D)

  Si un pedido falla, espera 100 ms y reinténtalo, hasta 4 intentos. Si aun así no responde, **no salgas a ciegas**: Chasqui dice `"Sin señal"` y se queda en la oficina. La ruta, la etiqueta y las fallas cambian en cada prueba.
visual:
  figure:
    title: Lo que pasa en la primera prueba
    panes:
      - { label: "pedidos", table: { head: ["", "ruta", "etiqueta"], rows: [["sale a los", "0 ms", "0 ms"], ["1.er intento", "503 ✗", "✓"], ["2.º intento", "✓", ""]] } }
      - { label: "después", cards: [{ title: "Chasqui", rows: [["seguirRuta", "ruta"], ["entregar", "etiqueta"]] }] }
starter: |
  async function pedirConReintento(recurso) {
    // TODO: pide; si falla, espera 100 ms y vuelve a pedir (hasta 4 intentos)
  }

  // TODO: pide la ruta y la etiqueta a la vez (Promise.all),
  // luego sigue la ruta y entrega. Si no hay señal: robot.decir("Sin señal")
solution: |
  async function pedirConReintento(recurso, intentos = 4) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        return await taller.pedir(recurso);
      } catch (error) {
        if (intento === intentos) throw error;
        await taller.esperar(100);
      }
    }
  }

  try {
    const [ruta, etiqueta] = await Promise.all([
      pedirConReintento("ruta"),
      pedirConReintento("etiqueta"),
    ]);
    robot.seguirRuta(ruta);
    robot.entregar(etiqueta);
  } catch (error) {
    robot.decir("Sin señal");
  }
hints:
  - "Arma `pedirConReintento` como en la práctica: un `for` de intentos con `try { return await … } catch { … }`."
  - "Envuelve el `await Promise.all([...])` y el viaje en un `try`; en su `catch`, `robot.decir(\"Sin señal\")`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, deliver, path]
  map: |
    ##########
    #R...#...#
    ####.#.#.#
    ####...#D#
    ##########
server:
  seed: 31
  latency: [100, 300]
  failOn: [1]
  data:
    ruta: [E, E, E, S, S, E, E, N, N, E, E, S, S]
    etiqueta: "Encomienda 31 · Taquile"
scenarios:
  - tests:
      - name: entrega la encomienda 31
        state: 'w.delivered.length === 1 && w.delivered[0] === "Encomienda 31 · Taquile"'
        msg: El buzón debe recibir el paquete con la etiqueta que dio el servidor.
  - map: |
      #########
      #R......#
      #######.#
      #D......#
      #########
    server:
      failOn: [2, 3]
      data:
        ruta: [E, E, E, E, E, E, S, S, O, O, O, O, O, O]
        etiqueta: "Encomienda 47 · Amantaní"
    tests:
      - name: la etiqueta falla dos veces y aun así entrega la 47
        state: 'w.delivered.length === 1 && w.delivered[0] === "Encomienda 47 · Amantaní"'
  - server:
      failOn: [1, 2, 3, 4, 5, 6, 7, 8]
    tests:
      - name: sin señal, no sale de la oficina
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
        msg: Si el servidor nunca responde, Chasqui no debe moverse.
      - name: dice "Sin señal"
        state: 'w.said.includes("Sin señal")'
tests:
  - name: pide la ruta y la etiqueta a la vez
    state: 's.requests.length >= 2 && s.requests[0].start === 0 && s.requests[1].start === 0'
    msg: Los dos primeros pedidos deben salir a los 0 ms, juntos (Promise.all).
  - name: espera 100 ms antes de reintentar
    state: '["ruta", "etiqueta"].every((k) => { const q = s.requests.filter((r) => r.resource === k); return q.length <= 4 && q.every((r, i) => i === 0 || r.start === q[i - 1].end + 100); })'
    msg: Tras cada falla, espera 100 ms y vuelve a pedir el mismo recurso, hasta 4 intentos.
  - name: sin chocar
    state: '!w.crashed'
  - name: usa Promise.all
    source: 'Promise\.all\s*\('
```

## Reto experto

```exercise
id: js14-reto-limite
type: challenge
async: true
title: No esperes para siempre
prompt: |
  Escribe `conLimite(promesa, ms)`: devuelve una promesa que se cumple con el valor de `promesa` si llega antes de `ms` milisegundos, y si no, se rechaza con un `Error` cuyo mensaje es `"Tiempo agotado"`. Pista de nombre: `Promise.race`. Puntos extra si limpias el temporizador con `clearTimeout` cuando la promesa gana.
starter: |
  const esperar = (ms, valor) => new Promise((resolve) => setTimeout(() => resolve(valor), ms));

  function conLimite(promesa, ms) {
  }

  console.log(await conLimite(esperar(100, "ruta lista"), 300));
  try {
    await conLimite(esperar(900, "ruta tardía"), 300);
  } catch (error) {
    console.log(error.message);
  }
solution: |
  const esperar = (ms, valor) => new Promise((resolve) => setTimeout(() => resolve(valor), ms));

  function conLimite(promesa, ms) {
    let id;
    const reloj = new Promise((_, reject) => {
      id = setTimeout(() => reject(new Error("Tiempo agotado")), ms);
    });
    return Promise.race([promesa, reloj]).finally(() => clearTimeout(id));
  }

  console.log(await conLimite(esperar(100, "ruta lista"), 300));
  try {
    await conLimite(esperar(900, "ruta tardía"), 300);
  } catch (error) {
    console.log(error.message);
  }
hints:
  - "Crea una segunda promesa que se rechace con `setTimeout` a los `ms`, y haz que compita con la original en `Promise.race`."
tests:
  - name: la que llega a tiempo gana, la tardía se corta
    output: "ruta lista\nTiempo agotado"
  - name: usa Promise.race
    source: 'Promise\.race\s*\('
```
