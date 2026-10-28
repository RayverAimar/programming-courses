# Sesión 12 — Clases y módulos

## El encargo

Arequipa, una casona de sillar a dos cuadras de la Plaza de Armas. Ahí funciona Rapidito, una empresa de reparto que mañana alquila **tres** robots de Loop: Chasqui, Misti y Chachani. Valeria Zegarra, su jefa de tecnología, pidió ver el código antes de firmar. Lo abrió, bajó un poco, y nos mandó una captura sin comentarios: `bateria`, `bateria2`, `bateriaMistiNueva`, `posicionX_final_v3`.

El código se escribió para un solo robot y cada robot nuevo se agregó copiando y pegando. Con tres, cualquier cambio hay que hacerlo tres veces, y una variable equivocada descarga al robot que no era. Hoy ordenamos el cerebro de Chasqui: **un molde** (una clase) del que salen todos los robots que haga falta, cada uno con su propio estado, y **archivos** separados (módulos) para cada parte.

```escena
theme: barranco
level: 4
dir: E
api: [move, cargo, path]
items: { a: queso helado, b: rocoto relleno, c: adobo }
caption: El depósito de Rapidito. Chasqui toma los paquetes de la fila y deja cada uno en la puerta de su cliente.
map: |
  ############
  #Rabc......#
  #..........#
  #..........#
  #..........#
  ############
program: |
  robot.avanzar();
  robot.tomar();
  robot.avanzar();
  robot.tomar();
  robot.seguirRuta(["E", "E", "E", "E", "E", "S", "S", "S"]);
  robot.soltar("queso helado");
  robot.seguirRuta(["O", "O", "O", "O", "O", "O", "N"]);
  robot.soltar("rocoto relleno");
```

## Lo mínimo

Una **clase** es un molde. Con `new` sacas objetos de ese molde (**instancias**): todos tienen los mismos métodos, pero cada uno guarda sus propios datos.

```js run
class Robot {
  #bateria = 100;
  constructor(nombre) {
    this.nombre = nombre;
  }
  avanzar(pasos) {
    this.#bateria -= pasos * 2;
  }
  get bateria() {
    return this.#bateria;
  }
}

const chasqui = new Robot("Chasqui");
chasqui.avanzar(5);
console.log(chasqui.nombre, chasqui.bateria);
```

```anima
title: Un molde, dos robots, dos baterías
code: |
  class Robot {
    #bateria = 100;
    constructor(nombre) {
      this.nombre = nombre;
    }
    avanzar(pasos) {
      this.#bateria -= pasos * 2;
    }
    get bateria() {
      return this.#bateria;
    }
  }
  const chasqui = new Robot("Chasqui");
  const misti = new Robot("Misti");
  chasqui.avanzar(5);
  console.log(chasqui.bateria, misti.bateria);
steps:
  - { line: 1, vars: {}, note: "La clase es el molde. Todavía no existe ningún robot." }
  - { line: 13, vars: {}, stack: [{ name: "new Robot", args: 'nombre = "Chasqui"' }], note: "new crea un objeto nuevo y llama a su constructor." }
  - { line: 2, vars: { this: { "#bateria": 100 } }, stack: [{ name: "new Robot", args: 'nombre = "Chasqui"' }], note: "Cada objeto nuevo recibe su propia #bateria, en 100." }
  - { line: 4, vars: { this: { "#bateria": 100, nombre: "Chasqui" } }, stack: [{ name: "new Robot", args: 'nombre = "Chasqui"' }], note: "this es el objeto que se está creando." }
  - { line: 13, vars: { chasqui: { "#bateria": 100, nombre: "Chasqui" } }, note: "chasqui es ese objeto, ya terminado." }
  - { line: 14, vars: { chasqui: { "#bateria": 100, nombre: "Chasqui" }, misti: { "#bateria": 100, nombre: "Misti" } }, note: "El mismo molde da otro objeto, con otra batería." }
  - { line: 15, vars: { chasqui: { "#bateria": 100, nombre: "Chasqui" }, misti: { "#bateria": 100, nombre: "Misti" } }, stack: [{ name: "chasqui.avanzar", args: "pasos = 5" }] }
  - { line: 7, vars: { chasqui: { "#bateria": 90, nombre: "Chasqui" }, misti: { "#bateria": 100, nombre: "Misti" } }, stack: [{ name: "chasqui.avanzar", args: "pasos = 5" }], note: "Dentro del método, this es chasqui: solo baja su batería." }
  - { line: 10, vars: { chasqui: { "#bateria": 90, nombre: "Chasqui" }, misti: { "#bateria": 100, nombre: "Misti" } }, stack: [{ name: "get bateria", args: "", ret: "90" }], note: "Un getter se lee como una propiedad, sin paréntesis." }
  - { line: 16, vars: { chasqui: { "#bateria": 90, nombre: "Chasqui" }, misti: { "#bateria": 100, nombre: "Misti" } }, out: "90 100" }
```

- **`constructor`** se ejecuta con cada `new` y prepara el objeto. Dentro de la clase, **`this`** es el objeto con el que estás trabajando.
- **Métodos**: funciones del molde, como `avanzar(pasos)`. Se llaman con un punto: `chasqui.avanzar(5)`.
- **`#privado`**: un campo con `#` solo se puede tocar desde dentro de la clase. Nadie de afuera puede poner `chasqui.#bateria = 500`; es un error antes de correr. Así la regla de cómo se gasta la batería vive en un solo lugar.
- **`get`**: un método que se lee como propiedad (`chasqui.bateria`). Deja leer un dato privado sin dejar cambiarlo.
- **`extends`**: una clase hija hereda todo de su madre y agrega o cambia lo que necesita; `super(...)` llama al constructor de la madre y `super.metodo()` a su versión de un método.

```js
class Repartidor extends Robot {
  constructor(nombre, zona) {
    super(nombre);
    this.zona = zona;
  }
}
```

**Módulos.** Cuando el cerebro crece, cada clase va en su archivo. Un archivo **exporta** lo que ofrece y otro lo **importa**. En los ejercicios todo vive en un solo archivo, pero el proyecto de Rapidito queda así:

```figura
title: El cerebro de Chasqui, en tres archivos
panes:
  - { label: "bateria.js", cards: [{ title: "exporta", rows: [["export class", "Bateria"]] }] }
  - { label: "repartidor.js", cards: [{ title: "importa y exporta", rows: [["import", "{ Bateria } from \"./bateria.js\""], ["export class", "Repartidor"]] }] }
  - { label: "main.js", cards: [{ title: "usa", rows: [["import", "{ Repartidor } from \"./repartidor.js\""], ["const", "chasqui = new Repartidor(robot)"]] }] }
caption: "Cada archivo dice qué ofrece (`export`) y qué necesita (`import`). Si cambia la regla de la batería, se cambia en **un** archivo."
```

```js
// repartidor.js
import { Bateria } from "./bateria.js";
export class Repartidor { /* … */ }

// main.js
import { Repartidor } from "./repartidor.js";
```

Así los encuentra y los ejecuta el navegador (o Node). Fíjate en el **orden**: se piden de arriba hacia abajo, pero se ejecutan de abajo hacia arriba.

```red
title: Cómo se encuentran y en qué orden corren tres archivos
caption: "`./` significa «junto a este archivo». Cada archivo se ejecuta **una sola vez**, aunque otros diez lo importen."
speed: 4200
nodes:
  - { id: main, icon: file, label: main.js, sub: el archivo por donde arranca todo }
  - { id: rep, icon: file, label: repartidor.js, sub: usa la batería }
  - { id: bat, icon: file, label: bateria.js, sub: no importa nada }
steps:
  - phase: "1. Se pide, de arriba abajo"
    at: main
    note: "El navegador empieza por **un solo archivo**, el de entrada: `main.js`. Los demás los va encontrando por las líneas `import`."
    tags: { main: arranque }
  - move: [main, rep]
    packet: { kind: up, label: "pide \"./repartidor.js\"" }
    note: "Antes de ejecutar nada de `main.js`, lee sus `import`. El primero dice `\"./repartidor.js\"`: el `./` es **«en la carpeta de este archivo»**. Sin `./`, buscaría un paquete instalado."
    tags: { main: esperando a repartidor.js }
  - move: [rep, bat]
    packet: { kind: up, label: "pide \"./bateria.js\"" }
    note: "`repartidor.js` también tiene un `import`: pide `./bateria.js`. Se sigue pidiendo hasta llegar a un archivo que no importa nada."
    tags: { main: esperando a repartidor.js, rep: esperando a bateria.js }
  - phase: "2. Se ejecuta, de abajo arriba"
    at: bat
    packet: { kind: local, label: "se ejecuta `bateria.js`" }
    note: "`bateria.js` no necesita a nadie, así que **corre primero**, de arriba abajo. Su `export` deja `Bateria` a disposición de quien la pida."
    tags: { bat: "ejecutado · ofrece Bateria", rep: esperando a bateria.js }
  - move: [bat, rep]
    packet: { kind: down, label: "Bateria" }
    note: "`repartidor.js` recibe `Bateria`, el nombre que pidió entre llaves, y **recién entonces** corre. Si pidiera algo que `bateria.js` no exporta, daría error antes de ejecutar nada."
    tags: { bat: ejecutado, rep: "ejecutado · ofrece Repartidor", main: esperando a repartidor.js }
  - move: [rep, main]
    packet: { kind: down, label: "Repartidor" }
    note: "Por último `main.js` recibe `Repartidor` y corre su propio código. Si `bateria.js` volviera a importar a `repartidor.js`, sería un **ciclo**: casi siempre significa que dos archivos deberían ser uno, o que falta un tercero."
    tags: { main: ejecutado, rep: ejecutado, bat: ejecutado }
```

> **Trampa común:** dentro de un método, `bateria` a secas no es la batería del robot: es una variable que no existe. Siempre `this.#bateria` o `this.nombre`. Y sin `new`, `Robot("Chasqui")` es un error: una clase solo se usa con `new`.

<!-- legacy: classes -->

<!-- legacy: private-fields -->

<!-- legacy: modules -->

<!-- mdn: classes private-fields modules -->

## Práctica

```exercise
id: js12-predice-mochilas
type: predict
title: Dos mochilas
prompt: |
  ¿Qué imprime?
code: |
  class Mochila {
    #paquetes = [];
    meter(paquete) {
      this.#paquetes.push(paquete);
    }
    get cuantos() {
      return this.#paquetes.length;
    }
  }
  const chasqui = new Mochila();
  const misti = new Mochila();
  chasqui.meter("queso helado");
  chasqui.meter("rocoto relleno");
  misti.meter("adobo");
  console.log(chasqui.cuantos, misti.cuantos);
options:
  - "3 3"
  - "2 1"
  - "2 2"
  - "undefined undefined"
answer: "2 1"
explain: |
  Cada `new Mochila()` crea su propio array `#paquetes`. Y `cuantos` es un getter: se lee sin paréntesis y devuelve un número.
```

```exercise
id: js12-predice-super
type: predict
title: El repartidor saluda
prompt: |
  `Repartidor` hereda de `Robot` y cambia el saludo. ¿Qué imprime?
code: |
  class Robot {
    constructor(nombre) {
      this.nombre = nombre;
    }
    saludar() {
      return `Soy ${this.nombre}`;
    }
  }
  class Repartidor extends Robot {
    saludar() {
      return `${super.saludar()} y traigo tu pedido`;
    }
  }
  const chasqui = new Repartidor("Chasqui");
  console.log(chasqui.saludar());
options:
  - Soy Chasqui
  - Soy Chasqui y traigo tu pedido
  - Soy undefined y traigo tu pedido
  - y traigo tu pedido
answer: Soy Chasqui y traigo tu pedido
explain: |
  `Repartidor` no tiene constructor, así que usa el de `Robot` y `nombre` queda guardado. Su `saludar` reemplaza al de la madre, pero `super.saludar()` todavía puede llamar a la versión original.
```

```exercise
id: js12-completa-paquete
type: complete
title: El molde del paquete
prompt: |
  Un paquete de Rapidito tiene `destino` y `peso` (en kilos). Su costo es 5 soles más 2 por kilo. Completa la clase y crea el paquete del queso helado.
visual:
  figure:
    input: { label: 'new Paquete("Yanahuara", 3)', cards: [{ title: paquete, rows: [["destino", "\"Yanahuara\""], ["peso", "3"]] }] }
    arrow: 5 + 2 × 3
    output: { label: "paquete.costo()", value: "11" }
starter: |
  class Paquete {
    ___(destino, peso) {
      this.destino = destino;
      ___.peso = peso;
    }
    costo() {
      return 5 + 2 * this.peso;
    }
  }

  const quesoHelado = ___ Paquete("Yanahuara", 3);
  console.log(quesoHelado.destino, quesoHelado.costo());
solution: |
  class Paquete {
    constructor(destino, peso) {
      this.destino = destino;
      this.peso = peso;
    }
    costo() {
      return 5 + 2 * this.peso;
    }
  }

  const quesoHelado = new Paquete("Yanahuara", 3);
  console.log(quesoHelado.destino, quesoHelado.costo());
hints:
  - El método que prepara cada objeto nuevo tiene un nombre fijo.
  - Dentro de la clase, el objeto que se está creando se llama `this`.
tests:
  - name: imprime destino y costo
    output: Yanahuara 11
  - name: un paquete de 10 kilos cuesta 25
    expect: new Paquete("Cayma", 10).costo() === 25
```

```exercise
id: js12-arregla-this
type: fix
title: La batería que no existe
prompt: |
  Misti avanza y el programa se cae con "`carga` no existe". La clase sí tiene la carga. Arréglalo sin sacarla de la clase.
starter: |
  class Bateria {
    #carga = 100;
    gastar(cuanto) {
      carga -= cuanto;
    }
    get carga() {
      return this.#carga;
    }
  }

  const deMisti = new Bateria();
  deMisti.gastar(30);
  console.log("Misti tiene", deMisti.carga);
solution: |
  class Bateria {
    #carga = 100;
    gastar(cuanto) {
      this.#carga -= cuanto;
    }
    get carga() {
      return this.#carga;
    }
  }

  const deMisti = new Bateria();
  deMisti.gastar(30);
  console.log("Misti tiene", deMisti.carga);
hints:
  - Dentro de un método, los datos del objeto se alcanzan a través de `this`.
tests:
  - name: Misti tiene 70
    output: Misti tiene 70
  - name: la carga sigue siendo privada
    source: 'this\.#carga\s*-='
    msg: Resta sobre el campo privado, this.#carga.
```

```exercise
id: js12-arregla-tope
type: fix
title: La batería al 130 %
prompt: |
  Después de recargar, Chachani dice tener 130 % de batería. La regla de Rapidito: **nunca más de 100**. Como la carga es privada, basta arreglarlo en un solo lugar: el método `recargar`.
visual:
  figure:
    panes:
      - { table: { head: ["paso", "empieza", "gastar(20)", "recargar(50)", "recargar(50)"], rows: [["carga", "100", "80", "100 (no 130)", "100"]] } }
starter: |
  class Bateria {
    #carga = 100;
    gastar(cuanto) {
      this.#carga -= cuanto;
    }
    recargar(cuanto) {
      this.#carga += cuanto;
    }
    get carga() {
      return this.#carga;
    }
  }

  const deChachani = new Bateria();
  deChachani.gastar(20);
  deChachani.recargar(50);
  console.log("Chachani tiene", deChachani.carga);
solution: |
  class Bateria {
    #carga = 100;
    gastar(cuanto) {
      this.#carga -= cuanto;
    }
    recargar(cuanto) {
      this.#carga = Math.min(100, this.#carga + cuanto);
    }
    get carga() {
      return this.#carga;
    }
  }

  const deChachani = new Bateria();
  deChachani.gastar(20);
  deChachani.recargar(50);
  console.log("Chachani tiene", deChachani.carga);
hints:
  - "`Math.min(100, algo)` nunca pasa de 100."
tests:
  - name: Chachani tiene 100
    output: Chachani tiene 100
  - name: recargar por debajo del tope suma normal
    expect: '(() => { const b = new Bateria(); b.gastar(60); b.recargar(30); return b.carga; })() === 70'
```

```exercise
id: js12-escribe-bitacora
type: write
title: La bitácora del robot
prompt: |
  Escribe la clase `Bitacora`: guarda en un campo **privado** los textos que le anotan y ofrece:

  - `anotar(texto)`: agrega el texto al final.
  - `get total`: cuántas entradas hay.
  - `ultima()`: la última entrada, o `null` si está vacía.

  Valeria quiere una bitácora por robot, y que nadie pueda borrarla desde afuera.
visual:
  figure:
    title: Una bitácora después de dos anotaciones
    panes:
      - { label: "entradas (privado)", cells: ["\"salí del depósito\"", "\"entregué en Cayma\""] }
      - { label: "se lee así", table: { head: ["expresión", "da"], rows: [["bitacora.total", "2"], ["bitacora.ultima()", "\"entregué en Cayma\""]] } }
starter: |
  class Bitacora {
  }

  const deChasqui = new Bitacora();
  deChasqui.anotar("salí del depósito");
  console.log(deChasqui.total);
solution: |
  class Bitacora {
    #entradas = [];
    anotar(texto) {
      this.#entradas.push(texto);
    }
    get total() {
      return this.#entradas.length;
    }
    ultima() {
      return this.#entradas.at(-1) ?? null;
    }
  }

  const deChasqui = new Bitacora();
  deChasqui.anotar("salí del depósito");
  console.log(deChasqui.total);
hints:
  - "Empieza con `#entradas = [];` dentro de la clase."
  - "`lista.at(-1)` es el último elemento (o `undefined` si está vacía); `?? null` cambia ese `undefined` por `null`."
tests:
  - name: total cuenta las entradas
    expect: '(() => { const b = new Bitacora(); b.anotar("a"); b.anotar("b"); return b.total; })() === 2'
  - name: ultima da la última
    expect: '(() => { const b = new Bitacora(); b.anotar("salí"); b.anotar("entregué en Cayma"); return b.ultima(); })() === "entregué en Cayma"'
  - name: vacía, ultima da null
    expect: new Bitacora().ultima() === null
  - name: dos bitácoras no se mezclan
    expect: '(() => { const a = new Bitacora(); const b = new Bitacora(); a.anotar("x"); return b.total; })() === 0'
  - name: las entradas son privadas
    source: '#\w+'
    msg: "Guarda las entradas en un campo privado, con #."
```

## El caso

```exercise
id: js12-caso-baterias
type: case
title: El contador malogrado
prompt: |
  Escribe la clase `Robot` con su batería privada, crea un robot por nombre, repite la bitácora del día y compara la batería final de cada uno con lo que mostró su pantalla.

  Ayer Rapidito probó cuatro robots. Cada uno empieza con 100 de batería y gasta así:

  - `avanzar` n casillas: 2 por casilla.
  - `girar`: 1.
  - `cargar` un paquete: 5.
  - `recargar`: suma 30, pero **nunca pasa de 100**.

  Al final del día, cada robot mostró su batería en pantalla. El contador de uno está malogrado. ¿Cuál? Imprime una línea por robot con la batería al final: `Misti: 69`.
visual:
  board:
    for: js12-caso-baterias
    title: Lo que mostró cada pantalla
    task: Repite la bitácora con un objeto Robot por nombre y compara la batería final con su pantalla.
    cards:
      - { name: "Misti", kind: robot, role: "Pantalla: 69", clue: { find: "Misti", says: 69, saysLabel: "Mostró" } }
      - { name: "Chachani", kind: robot, role: "Pantalla: 91", clue: { find: "Chachani", says: 91, saysLabel: "Mostró" } }
      - { name: "Chasqui", kind: robot, role: "Pantalla: 80", clue: { find: "Chasqui", says: 80, saysLabel: "Mostró" } }
      - { name: "Pichu", kind: robot, role: "Pantalla: 88", culprit: true, clue: { find: "Pichu", says: 88, saysLabel: "Mostró" } }
    caption: "Si **dos** pantallas no cuadran, revisa tu `recargar`: la batería nunca pasa de 100."
starter: |
  const bitacora = [
    ["Misti", "avanzar", 6], ["Chachani", "cargar"], ["Chasqui", "avanzar", 4], ["Pichu", "girar"],
    ["Misti", "girar"], ["Chasqui", "cargar"], ["Chachani", "avanzar", 9], ["Pichu", "avanzar", 12],
    ["Misti", "recargar"], ["Chasqui", "avanzar", 7], ["Chachani", "girar"], ["Pichu", "cargar"],
    ["Misti", "avanzar", 10], ["Chachani", "avanzar", 5], ["Chasqui", "girar"], ["Pichu", "avanzar", 8],
    ["Chachani", "recargar"], ["Misti", "cargar"], ["Chasqui", "avanzar", 11], ["Pichu", "recargar"],
    ["Chachani", "cargar"], ["Misti", "avanzar", 3], ["Chasqui", "recargar"], ["Pichu", "girar"],
  ];

  // Así se lee una línea de la bitácora (cargar, girar y recargar no traen número):
  const [nombre, accion, casillas] = bitacora[0];
  console.log(nombre, "hizo", accion, casillas);

  // TODO: escribe class Robot con #bateria = 100 y un método por acción:
  // avanzar(casillas), girar(), cargar(), recargar(), y get bateria.

  // TODO: crea un Robot por nombre (Misti, Chachani, Chasqui, Pichu),
  // repite la bitácora e imprime así: Misti: 69
solution: |
  const bitacora = [
    ["Misti", "avanzar", 6], ["Chachani", "cargar"], ["Chasqui", "avanzar", 4], ["Pichu", "girar"],
    ["Misti", "girar"], ["Chasqui", "cargar"], ["Chachani", "avanzar", 9], ["Pichu", "avanzar", 12],
    ["Misti", "recargar"], ["Chasqui", "avanzar", 7], ["Chachani", "girar"], ["Pichu", "cargar"],
    ["Misti", "avanzar", 10], ["Chachani", "avanzar", 5], ["Chasqui", "girar"], ["Pichu", "avanzar", 8],
    ["Chachani", "recargar"], ["Misti", "cargar"], ["Chasqui", "avanzar", 11], ["Pichu", "recargar"],
    ["Chachani", "cargar"], ["Misti", "avanzar", 3], ["Chasqui", "recargar"], ["Pichu", "girar"],
  ];

  class Robot {
    #bateria = 100;
    avanzar(casillas) {
      this.#bateria -= 2 * casillas;
    }
    girar() {
      this.#bateria -= 1;
    }
    cargar() {
      this.#bateria -= 5;
    }
    recargar() {
      this.#bateria = Math.min(100, this.#bateria + 30);
    }
    get bateria() {
      return this.#bateria;
    }
  }

  const robots = {};
  for (const nombre of ["Misti", "Chachani", "Chasqui", "Pichu"]) {
    robots[nombre] = new Robot();
  }
  for (const [nombre, accion, casillas] of bitacora) {
    robots[nombre][accion](casillas);
  }
  for (const [nombre, robot] of Object.entries(robots)) {
    console.log(`${nombre}: ${robot.bateria}`);
  }
answer: Pichu
answerLabel: ¿Qué robot tiene el contador malogrado?
reveal: |
  Pichu terminó con 83 y su pantalla mostró 88: su contador no descuenta los 5 de cargar un paquete. Misti es la trampa: recargó con 87 y quedó en 100, no en 117. Si tu `recargar` no tenía tope, Misti tampoco cuadraba.
hints:
  - "Si los métodos se llaman igual que las acciones, `robots[nombre][accion](casillas)` llama al método correcto (los que no usan `casillas` lo ignoran)."
  - "El tope va en `recargar`: `Math.min(100, this.#bateria + 30)`."
```

## El juez

Otra vez un problema de **diseño**: tú escribes la clase y el juez la usa con `atenderMostrador`, que ya viene escrita. Las operaciones llegan como símbolos para que los casos sean los mismos en cualquier idioma: `["+", paquete]` guarda, `["-", número]` retira y `["?"]` pregunta cuántos casilleros quedan libres.

```exercise
id: js12-juez-consigna
type: judge
mode: function
function: atenderMostrador
title: La consigna de paquetes
prompt: |
  Escribe la clase `Consigna`: guarda paquetes en casilleros numerados y responde cada operación del mostrador.

  Rapidito tiene en la entrada una consigna con `n` casilleros, numerados del 1 al `n`. Escribe `class Consigna` con:

  - `constructor(n)`: todos los casilleros empiezan vacíos.
  - `guardar(paquete)`: lo pone en el casillero libre **de número más bajo** y devuelve ese número; si no hay ninguno libre, devuelve **-1**.
  - `retirar(numero)`: saca el paquete de ese casillero, lo deja libre y **devuelve el paquete**; si está vacío o no existe, devuelve **null**.
  - `get libres`: cuántos casilleros están vacíos.

  `atenderMostrador(n, operaciones)` crea la consigna, aplica las operaciones en orden y devuelve la lista de respuestas. No la cambies.

  **Restricciones:** 1 ≤ n ≤ 10 · hasta 60 operaciones · un número a retirar puede estar fuera de 1…n.
visual:
  figure:
    title: El ejemplo 1, operación por operación (consigna de 2 casilleros)
    panes:
      - { table: { head: ["operación", "[\"+\", \"queso\"]", "[\"+\", \"rocoto\"]", "[\"+\", \"adobo\"]", "[\"-\", 1]", "[\"?\"]", "[\"+\", \"adobo\"]"], rows: [["casillero 1", "queso", "queso", "queso", "—", "—", "adobo"], ["casillero 2", "—", "rocoto", "rocoto", "rocoto", "rocoto", "rocoto"], ["devuelve", "1", "2", "-1", "\"queso\"", "1", "1"]] } }
    caption: "El adobo no entra cuando las dos están llenas (**-1**). Al retirar el queso, el casillero 1 queda libre y es el primero que se vuelve a usar."
starter: |
  class Consigna {
    // TODO: constructor(n), guardar(paquete), retirar(numero), get libres
  }

  // El juez llama a esta función. No la cambies.
  function atenderMostrador(n, operaciones) {
    const consigna = new Consigna(n);
    return operaciones.map(([op, dato]) => {
      if (op === "+") return consigna.guardar(dato);
      if (op === "-") return consigna.retirar(dato);
      return consigna.libres;
    });
  }
solution: |
  class Consigna {
    #casilleros;
    constructor(n) {
      this.#casilleros = Array(n).fill(null);
    }
    guardar(paquete) {
      const libre = this.#casilleros.indexOf(null);
      if (libre === -1) {
        return -1;
      }
      this.#casilleros[libre] = paquete;
      return libre + 1;
    }
    retirar(numero) {
      const paquete = this.#casilleros[numero - 1] ?? null;
      if (paquete !== null) {
        this.#casilleros[numero - 1] = null;
      }
      return paquete;
    }
    get libres() {
      return this.#casilleros.filter((c) => c === null).length;
    }
  }

  // El juez llama a esta función. No la cambies.
  function atenderMostrador(n, operaciones) {
    const consigna = new Consigna(n);
    return operaciones.map(([op, dato]) => {
      if (op === "+") return consigna.guardar(dato);
      if (op === "-") return consigna.retirar(dato);
      return consigna.libres;
    });
  }
hints:
  - "Un array privado de `n` posiciones, con `null` en las vacías: `Array(n).fill(null)`. El casillero `k` es la posición `k - 1`."
  - "`indexOf(null)` encuentra el primer casillero libre. Para un número fuera de rango, `this.#casilleros[numero - 1]` es `undefined`: conviértelo en `null`."
samples:
  - args: [2, [["+", "queso"], ["+", "rocoto"], ["+", "adobo"], ["-", 1], ["?"], ["+", "adobo"]]]
    returns: [1, 2, -1, "queso", 1, 1]
    note: El casillero 1 se libera y se vuelve a usar.
  - args: [3, [["-", 2], ["?"], ["-", 7]]]
    returns: [null, 3, null]
    note: Retirar de un casillero vacío, o que no existe, da null.
edge:
  - args: [1, [["+", "queso"], ["+", "rocoto"], ["-", 1], ["-", 1], ["+", "rocoto"]]]
    tag: con un solo casillero
  - args: [4, [["+", "a"], ["+", "b"], ["+", "c"], ["-", 2], ["-", 1], ["+", "d"], ["+", "e"], ["?"]]]
    tag: cuando se liberan casilleros del medio
  - args: [5, [["-", 0], ["-", 6], ["?"]]]
    tag: con números fuera de rango
  - args: [3, []]
    tag: sin operaciones
  - args: [2, [["+", "x"], ["+", "y"], ["?"], ["-", 2], ["?"], ["-", 2], ["?"]]]
    tag: retirando dos veces el mismo casillero
random:
  count: 40
  seed: 121
  generate: |
    const n = rng.int(1, 10);
    const paquetes = ["queso", "rocoto", "adobo", "chupe", "solterito", "pastel", "colación"];
    const ops = Array.from({ length: rng.int(1, 60) }, () => {
      const r = rng.next();
      if (r < 0.5) return ["+", rng.pick(paquetes)];
      if (r < 0.85) return ["-", rng.int(0, n + 1)];
      return ["?"];
    });
    return [n, ops];
wrong:
  - |
    class Consigna {
      #casilleros;
      #siguiente = 0;
      constructor(n) { this.#casilleros = Array(n).fill(null); }
      guardar(paquete) {
        if (this.#siguiente >= this.#casilleros.length) return -1;
        this.#casilleros[this.#siguiente] = paquete;
        this.#siguiente++;
        return this.#siguiente;
      }
      retirar(numero) {
        const paquete = this.#casilleros[numero - 1] ?? null;
        if (paquete !== null) this.#casilleros[numero - 1] = null;
        return paquete;
      }
      get libres() { return this.#casilleros.filter((c) => c === null).length; }
    }
    function atenderMostrador(n, operaciones) {
      const consigna = new Consigna(n);
      return operaciones.map(([op, dato]) => (op === "+" ? consigna.guardar(dato) : op === "-" ? consigna.retirar(dato) : consigna.libres));
    }
  - |
    class Consigna {
      #casilleros;
      constructor(n) { this.#casilleros = Array(n).fill(null); }
      guardar(paquete) {
        const libre = this.#casilleros.indexOf(null);
        if (libre === -1) return -1;
        this.#casilleros[libre] = paquete;
        return libre + 1;
      }
      retirar(numero) {
        return this.#casilleros[numero - 1] ?? null;
      }
      get libres() { return this.#casilleros.filter((c) => c === null).length; }
    }
    function atenderMostrador(n, operaciones) {
      const consigna = new Consigna(n);
      return operaciones.map(([op, dato]) => (op === "+" ? consigna.guardar(dato) : op === "-" ? consigna.retirar(dato) : consigna.libres));
    }
  - |
    class Consigna {
      #casilleros;
      constructor(n) { this.#casilleros = Array(n).fill(null); }
      guardar(paquete) {
        const libre = this.#casilleros.indexOf(null);
        if (libre === -1) return -1;
        this.#casilleros[libre] = paquete;
        return libre + 1;
      }
      retirar(numero) {
        const paquete = this.#casilleros[numero - 1];
        this.#casilleros[numero - 1] = null;
        return paquete;
      }
      get libres() { return this.#casilleros.filter((c) => c === null).length; }
    }
    function atenderMostrador(n, operaciones) {
      const consigna = new Consigna(n);
      return operaciones.map(([op, dato]) => (op === "+" ? consigna.guardar(dato) : op === "-" ? consigna.retirar(dato) : consigna.libres));
    }
tests:
  - name: usa una clase Consigna
    source: 'class\s+Consigna\b'
  - name: guarda los casilleros en un campo privado
    source: '#\w+'
    msg: "Los casilleros van en un campo privado, con #, para que nadie los cambie desde afuera."
  - name: libres es un getter
    source: 'get\s+libres\s*\('
```

## Misión final

```exercise
id: js12-mision-rapidito
type: mission
title: El primer día de Rapidito
prompt: |
  Escribe la clase `Repartidor` y úsala para dejar cada paquete de `encargos` en su destino, en orden; al final, Chasqui dice cuántas entregas hizo.

  Chasqui ya toma los paquetes del depósito (esas líneas vienen escritas). La plaza no tiene obstáculos, así que para llegar a una casilla basta ir primero en horizontal y después en vertical. Tu clase:

  - guarda el robot en un campo **privado** `#robot` (se lo pasas al crearla: `new Repartidor(robot)`) y cuenta sus entregas en otro, `#entregas`;
  - `irA(destino)`: lleva al robot a `{ x, y }` con `robot.seguirRuta(pasos)`, donde `pasos` es una lista como `["E", "E", "S"]` (`"O"` es oeste);
  - `entregar(paquete, destino)`: va al destino y suelta ese paquete con `robot.soltar(paquete)`;
  - `get entregas`: cuántas lleva.

  Al terminar: `robot.decir(`${repartidor.entregas} entregas`)`. Los encargos cambian en cada prueba.
visual:
  figure:
    title: Cómo llegar a un destino
    panes:
      - { label: "de (4, 1) a (9, 4)", grid: ["############", "#...R......#", "#..........#", "#..........#", "#..........#", "############"], path: ["4,1", "5,1", "6,1", "7,1", "8,1", "9,1", "9,2", "9,3", "9,4"] }
      - { label: "pasos", table: { head: ["eje", "diferencia", "pasos"], rows: [["x", "9 − 4 = 5", "\"E\" × 5"], ["y", "4 − 1 = 3", "\"S\" × 3"]] } }
starter: |
  // encargos: [{ paquete: "queso helado", destino: { x: 9, y: 4 } }, …]
  // Los paquetes esperan en fila a la derecha de Chasqui: tómalos.
  for (let i = 0; i < encargos.length; i++) {
    robot.avanzar();
    robot.tomar();
  }

  class Repartidor {
    // TODO: #robot y #entregas privados, constructor(robot),
    // irA(destino), entregar(paquete, destino) y get entregas
  }

  // TODO: crea un Repartidor, entrega cada encargo en orden
  // y haz que Chasqui diga cuántas entregas hizo.
solution: |
  for (let i = 0; i < encargos.length; i++) {
    robot.avanzar();
    robot.tomar();
  }

  class Repartidor {
    #robot;
    #entregas = 0;
    constructor(robot) {
      this.#robot = robot;
    }
    irA({ x, y }) {
      const { posicion } = this.#robot;
      const dx = x - posicion.x;
      const dy = y - posicion.y;
      const pasos = [];
      for (let i = 0; i < Math.abs(dx); i++) {
        pasos.push(dx > 0 ? "E" : "O");
      }
      for (let i = 0; i < Math.abs(dy); i++) {
        pasos.push(dy > 0 ? "S" : "N");
      }
      this.#robot.seguirRuta(pasos);
    }
    entregar(paquete, destino) {
      this.irA(destino);
      this.#robot.soltar(paquete);
      this.#entregas++;
    }
    get entregas() {
      return this.#entregas;
    }
  }

  const repartidor = new Repartidor(robot);
  for (const { paquete, destino } of encargos) {
    repartidor.entregar(paquete, destino);
  }
  robot.decir(`${repartidor.entregas} entregas`);
hints:
  - "En `irA`, lee `this.#robot.posicion`, calcula `dx` y `dy`, y arma la lista: `dx` pasos `\"E\"` (u `\"O\"` si es negativo) y luego `dy` pasos `\"S\"` (o `\"N\"`)."
  - "`entregar` usa `this.irA(destino)`; un método puede llamar a otro del mismo objeto con `this`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, cargo, path]
  items: { a: queso helado, b: rocoto relleno, c: adobo, d: chupe }
  map: |
    ############
    #Rabc......#
    #..........#
    #..........#
    #..........#
    ############
globals:
  encargos:
    - { paquete: queso helado, destino: { x: 9, y: 4 } }
    - { paquete: rocoto relleno, destino: { x: 2, y: 3 } }
    - { paquete: adobo, destino: { x: 6, y: 2 } }
scenarios:
  - {}
  - map: |
      ##########
      #Rab.....#
      #........#
      #........#
      ##########
    globals:
      encargos:
        - { paquete: rocoto relleno, destino: { x: 8, y: 1 } }
        - { paquete: queso helado, destino: { x: 1, y: 3 } }
  - map: |
      #############
      #Rabcd......#
      #...........#
      #...........#
      #...........#
      #...........#
      #############
    globals:
      encargos:
        - { paquete: chupe, destino: { x: 11, y: 5 } }
        - { paquete: adobo, destino: { x: 3, y: 5 } }
        - { paquete: queso helado, destino: { x: 7, y: 3 } }
        - { paquete: rocoto relleno, destino: { x: 1, y: 2 } }
tests:
  - name: hay una clase Repartidor
    source: 'class\s+Repartidor\b'
  - name: un Repartidor nuevo tiene 0 entregas
    expect: new Repartidor(robot).entregas === 0
  - name: el robot y las entregas son privados
    source: '#robot\b[\s\S]*#entregas\b|#entregas\b[\s\S]*#robot\b'
    msg: "Guarda el robot en #robot y la cuenta en #entregas."
  - name: entregas es un getter
    source: 'get\s+entregas\s*\('
  - name: cada paquete queda en su destino, en orden
    state: 'w.dropped.length === g.encargos.length && w.dropped.every((d, i) => d.item === g.encargos[i].paquete && d.x === g.encargos[i].destino.x && d.y === g.encargos[i].destino.y)'
    msg: Algún paquete no quedó en su destino (o no en el orden de encargos).
  - name: Chasqui dice cuántas entregas hizo
    state: 'w.said.includes(`${g.encargos.length} entregas`)'
  - name: sin chocar
    state: '!w.crashed'
```

## Reto experto

```exercise
id: js12-reto-ruta
type: challenge
title: Una ruta que se recorre con for...of
prompt: |
  Escribe la clase `Ruta`, que guarda tramos como `{ pasos: 3, dir: "E" }`, con:

  - `static desdeTexto(texto)`: crea una ruta desde un texto como `"3E 2S 1O"`.
  - `get largo`: el total de pasos.
  - que se pueda recorrer **paso a paso** con `for...of` (`[...ruta]` da `["E", "E", "E", "S", "S", "O"]`).

  Pista de experto: un método `*[Symbol.iterator]()` con `yield`.
starter: |
  class Ruta {
  }

  const ruta = Ruta.desdeTexto("3E 2S 1O");
  console.log(ruta.largo, [...ruta].join(""));
solution: |
  class Ruta {
    #tramos;
    constructor(tramos) {
      this.#tramos = tramos;
    }
    static desdeTexto(texto) {
      const tramos = texto.split(" ").map((t) => ({ pasos: Number(t.slice(0, -1)), dir: t.at(-1) }));
      return new Ruta(tramos);
    }
    get largo() {
      return this.#tramos.reduce((suma, t) => suma + t.pasos, 0);
    }
    *[Symbol.iterator]() {
      for (const { pasos, dir } of this.#tramos) {
        for (let i = 0; i < pasos; i++) {
          yield dir;
        }
      }
    }
  }

  const ruta = Ruta.desdeTexto("3E 2S 1O");
  console.log(ruta.largo, [...ruta].join(""));
hints:
  - "`static` hace que el método se llame sobre la clase (`Ruta.desdeTexto`), no sobre una ruta."
  - Cada tramo es un número y una letra al final; `slice(0, -1)` y `at(-1)` los separan.
tests:
  - name: el ejemplo
    output: 6 EEESSO
  - name: tramos de dos cifras
    run: '[...Ruta.desdeTexto("12N 1E")].length'
    equals: 13
  - name: se recorre con for...of
    run: '(() => { const pasos = []; for (const p of Ruta.desdeTexto("2S 1E")) pasos.push(p); return pasos; })()'
    equals: ["S", "S", "E"]
```
