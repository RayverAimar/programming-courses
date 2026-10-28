# Sesión 11 — Closures y estado

## El encargo

Machu Picchu, cinco y cuarenta de la mañana. La neblina sube del río Urubamba y tapa los andenes; desde un andén no se ve el de abajo. Yeny Huillca, guardaparque del santuario, tiene un problema con nombre de animal: el veterinario sube hoy a desparasitar a las llamas y va a traer **exactamente** tantas dosis como llamas le reporten.

El año pasado lo hizo un robot de otra empresa. Reportó 47 llamas. En Machu Picchu viven doce. El robot veía una llama, daba un paso, la volvía a ver entre la niebla y la volvía a contar. Hoy Chasqui tiene que **recordar lo que ya vio** de un turno al siguiente, y esa memoria tiene que ser suya, no de cualquiera que pase por el código.

```escena
theme: museo
level: 4
dir: E
fog: true
vision: 1
items: { l: llama }
caption: Los andenes en la neblina. Chasqui solo ve una casilla a su alrededor; cada **l** es una llama, y la ve varias veces mientras pasa a su lado.
map: |
  ###########
  #R........#
  #...l.l...#
  #######...#
  #.........#
  #.l.......#
  ###########
program: |
  robot.avanzar(8);
  robot.girarDerecha();
  robot.avanzar(3);
  robot.girarDerecha();
  robot.avanzar(8);
```

## Lo mínimo

Una variable vive en el bloque `{ }` donde se declaró: eso es su **alcance** (*scope*). El código de adentro ve las variables de afuera; el de afuera no ve las de adentro. Piensa en cuartos: cada bloque es un cuarto, y desde uno puedes asomarte a los cuartos que lo rodean, nunca a los que están dentro de él.

```alcance
title: Cada bloque es un cuarto
rooms:
  - id: g
    name: global
    vars: { tarifa: 4 }
    rooms:
      - id: f
        name: "dentro de la función"
        vars: { km: 3 }
        up: "Si falta un nombre, lo busca en el cuarto de afuera: global."
note: "Desde adentro lees `tarifa`, que vive afuera. Desde global, `km` no existe: su cuarto es solo de la función."
```

Una función creada dentro de otra se lleva consigo las variables del lugar donde nació, y las sigue usando aunque esa otra función ya terminó. Esa mochila de variables se llama **closure**. Sirve para darle a una función **memoria entre llamadas**:

```js run
function crearContador() {
  let cuenta = 0;
  return () => {
    cuenta++;
    return cuenta;
  };
}

const contarLlamas = crearContador();
contarLlamas();
console.log(contarLlamas());
console.log(crearContador()());
```

`crearContador` es una **fábrica**: cada vez que la llamas, nace una `cuenta` nueva y una función que es la única que puede tocarla. Mira la animación, y debajo la misma película dibujando **dónde vive cada cosa**.

```anima
title: Cada fábrica entrega una memoria propia
code: |
  function crearContador() {
    let cuenta = 0;
    function sumar() {
      cuenta++;
      return cuenta;
    }
    return sumar;
  }
  const contar = crearContador();
  console.log(contar());
  console.log(contar());
  const otro = crearContador();
  console.log(otro());
show: [cuenta]
notes:
  2: "Nace una cuenta nueva, en 0."
  9: "crearContador ya terminó, pero sumar se llevó su cuenta."
  4: "sumar cambia la cuenta que nació con ella."
  12: "Otra fábrica, otra cuenta: empieza en 0."
```

```alcance
title: Cada llamada a la fábrica abre su propio cuarto
speed: 3600
steps:
  - note: "Al empezar solo existe el cuarto `global`. Guarda la fábrica `crearContador`: la receta, todavía sin ninguna `cuenta`."
    rooms:
      - { id: g, name: global, fns: [{ name: crearContador }] }
  - note: "`const contar = crearContador()` abre un cuarto nuevo para esta llamada. Ahí nace `cuenta = 0`."
    rooms:
      - id: g
        name: global
        fns: [{ name: crearContador }]
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", on: true, vars: { cuenta: 0 } }
  - note: "Dentro nace `sumar`. Se queda con una cuerda atada al cuarto donde nació (la flecha): ahí está su `cuenta`."
    rooms:
      - id: g
        name: global
        fns: [{ name: crearContador }]
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", on: true, vars: { cuenta: 0 }, fns: [{ name: sumar, env: c1 }] }
  - note: "La fábrica devuelve `sumar` y se guarda como `contar`. La llamada terminó, pero la cuerda de `contar` mantiene vivo su cuarto con su `cuenta`. Sin esa cuerda, el cuarto se habría descartado."
    rooms:
      - id: g
        name: global
        fns: [{ name: crearContador }, { name: contar, env: c1 }]
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", gone: true, vars: { cuenta: 0 } }
  - note: "Cada `contar()` sube la `cuenta` de su cuarto, aunque la llamada a la fábrica ya terminó. Después de dos llamadas vale 2."
    rooms:
      - id: g
        name: global
        fns: [{ name: crearContador }, { name: contar, env: c1 }]
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", gone: true, on: true, vars: { cuenta: 2 } }
  - note: "`const otro = crearContador()` abre **otro** cuarto, con otra `cuenta` y otra función. `otro()` sube la suya a 1; la de `contar` sigue en 2. No comparten nada."
    rooms:
      - id: g
        name: global
        fns: [{ name: crearContador }, { name: contar, env: c1 }, { name: otro, env: c2 }]
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", gone: true, vars: { cuenta: 2 } }
          - { id: c2, name: "crearContador(), llamada 2", gone: true, on: true, vars: { cuenta: 1 } }
```

- **Alcance de bloque**: `let` y `const` viven dentro de su `{ }`. Fuera del bloque, el nombre no existe.
- **Closure**: una función recuerda las variables de donde fue creada, no de donde la llamas.
- **Fábricas**: una función que devuelve otra función (u objeto con funciones). Cada llamada a la fábrica crea **estado nuevo y privado**: nadie más puede cambiar esa `cuenta`.
- **Varias funciones, una memoria**: la fábrica puede devolver un objeto `{ anotar, total }` cuyas dos funciones comparten las mismas variables.

```js
function crearBitacora() {
  const notas = [];
  return {
    anotar: (texto) => notas.push(texto),
    total: () => notas.length,
  };
}
```

El mismo mecanismo explica el bug más famoso de los bucles. Cada aviso es una función que recuerda **el cuarto donde nació**; lo que cambia es cuántos cuartos hay:

```alcance
title: Una `i` para todos, o una `i` por vuelta
speed: 4200
steps:
  - note: "Con `var` hay **una sola** `i`, en el cuarto de afuera. Los tres avisos señalan ese mismo cuarto, y cuando se ejecutan el bucle ya terminó: `i` vale 4 para todos."
    rooms:
      - id: g
        name: "global, con var"
        vars: { i: 4 }
        fns: [{ name: aviso 1, env: g }, { name: aviso 2, env: g }, { name: aviso 3, env: g }]
  - note: "Con `let` cada vuelta abre su propio cuarto con su propia `i`. Cada aviso se queda con el suyo: 1, 2 y 3."
    rooms:
      - id: g
        name: "global, con let"
        fns: [{ name: aviso 1, env: v1 }, { name: aviso 2, env: v2 }, { name: aviso 3, env: v3 }]
        rooms:
          - { id: v1, name: vuelta 1, gone: true, vars: { i: 1 } }
          - { id: v2, name: vuelta 2, gone: true, vars: { i: 2 } }
          - { id: v3, name: vuelta 3, gone: true, vars: { i: 3 } }
```

<!-- legacy: var-loop-closure -->

> **Trampa común:** `crearContador()()` crea un contador nuevo cada vez, así que siempre da 1. La memoria vive en el contador que **guardaste** (`const contar = crearContador()`); llama a la fábrica una vez y usa lo que te dio todas las veces que quieras.

<!-- legacy: closures -->

<!-- mdn: closures var-loop-closure let -->

## Práctica

```exercise
id: js11-predice-dos-contadores
type: predict
title: Dos guardaparques, dos libretas
prompt: |
  Yeny y Wilber cuentan con contadores distintos. ¿Qué imprime?
code: |
  function crearContador() {
    let cuenta = 0;
    return () => {
      cuenta++;
      return cuenta;
    };
  }
  const yeny = crearContador();
  const wilber = crearContador();
  yeny();
  yeny();
  wilber();
  console.log(yeny(), wilber());
options:
  - "3 2"
  - "5 5"
  - "3 1"
  - "2 2"
answer: "3 2"
explain: |
  Cada llamada a `crearContador` crea su propia `cuenta`. La de Yeny suma tres veces (dos sueltas y una dentro del `console.log`) y la de Wilber dos. No se mezclan.
```

```exercise
id: js11-predice-var
type: predict
title: Los avisos de las mesas
prompt: |
  Este código viejo prepara un aviso por mesa. Fíjate en el `var`. ¿Qué imprime?
code: |
  const avisos = [];
  for (var i = 1; i <= 3; i++) {
    avisos.push(() => `Mesa ${i} lista`);
  }
  console.log(avisos[0]());
options:
  - Mesa 1 lista
  - Mesa 3 lista
  - Mesa 4 lista
  - Mesa undefined lista
answer: Mesa 4 lista
explain: |
  Con `var` hay una sola `i` para todo el bucle. Las funciones la leen cuando se ejecutan, y para entonces el bucle ya terminó con `i` en 4. Cambia `var` por `let` y cada vuelta tiene su propia `i`: saldría "Mesa 1 lista".
```

```exercise
id: js11-predice-let-afuera
type: predict
title: El bug de var, con let
prompt: |
  Ya viste que `var` en un bucle comparte una sola variable. Este código usa `let`… pero la declara **antes** del bucle. ¿Qué imprime?
code: |
  const avisos = [];
  let andén;
  for (andén = 1; andén <= 3; andén++) {
    avisos.push(() => `andén ${andén}`);
  }
  console.log(avisos.map((aviso) => aviso()).join(", "));
options:
  - andén 1, andén 2, andén 3
  - andén 4, andén 4, andén 4
  - andén 3, andén 3, andén 3
  - andén undefined, andén undefined, andén undefined
answer: andén 4, andén 4, andén 4
explain: |
  Hay una sola variable `andén`, declarada afuera, y las tres funciones la recuerdan a ella, no a su valor. Cuando se ejecutan, el bucle ya terminó y vale 4. Lo que importa no es la palabra `let`, sino **cuántas variables existen**: con `for (let andén = 1; …)` cada vuelta tiene la suya y saldría "andén 1, andén 2, andén 3".
```

```exercise
id: js11-completa-torniquete
type: complete
title: El torniquete del circuito 2
prompt: |
  En el circuito 2 caben solo `cupo` personas a la vez. Completa la fábrica `crearTorniquete(cupo)`: devuelve una función `entrar()` que responde `"pasa"` mientras queden sitios y `"lleno"` cuando ya no.
visual:
  figure:
    title: Un torniquete con cupo 2
    panes:
      - { table: { head: ["llamada", "1.ª", "2.ª", "3.ª", "4.ª"], rows: [["dentro (antes)", "0", "1", "2", "2"], ["devuelve", "\"pasa\"", "\"pasa\"", "\"lleno\"", "\"lleno\""]] } }
starter: |
  function crearTorniquete(cupo) {
    let dentro = ___;
    return () => {
      if (dentro ___ cupo) {
        return "lleno";
      }
      dentro++;
      return "pasa";
    };
  }

  const circuito2 = crearTorniquete(2);
  console.log(circuito2(), circuito2(), circuito2());
solution: |
  function crearTorniquete(cupo) {
    let dentro = 0;
    return () => {
      if (dentro >= cupo) {
        return "lleno";
      }
      dentro++;
      return "pasa";
    };
  }

  const circuito2 = crearTorniquete(2);
  console.log(circuito2(), circuito2(), circuito2());
hints:
  - Al crear el torniquete todavía no ha entrado nadie.
  - Está lleno cuando los de adentro ya llegaron al cupo (o lo pasaron).
tests:
  - name: con cupo 2, pasan dos y el tercero no
    output: pasa pasa lleno
  - name: dos torniquetes no comparten la cuenta
    expect: '(() => { const a = crearTorniquete(1); const b = crearTorniquete(1); a(); return b(); })() === "pasa"'
  - name: con cupo 0 no pasa nadie
    expect: crearTorniquete(0)() === "lleno"
```

```exercise
id: js11-arregla-memoria-compartida
type: fix
title: La libreta compartida
prompt: |
  Cada guardaparque debería tener su propia libreta de aretes vistos. Pero cuando Wilber empieza su ronda, su libreta ya dice que vio llamas que nunca vio. Arregla `crearLibreta` para que cada una tenga su memoria.
starter: |
  const vistos = [];

  function crearLibreta() {
    return (arete) => {
      if (!vistos.includes(arete)) {
        vistos.push(arete);
      }
      return vistos.length;
    };
  }

  const yeny = crearLibreta();
  yeny("MP-04");
  yeny("MP-09");
  const wilber = crearLibreta();
  console.log("Wilber lleva", wilber("MP-11"));
solution: |
  function crearLibreta() {
    const vistos = [];
    return (arete) => {
      if (!vistos.includes(arete)) {
        vistos.push(arete);
      }
      return vistos.length;
    };
  }

  const yeny = crearLibreta();
  yeny("MP-04");
  yeny("MP-09");
  const wilber = crearLibreta();
  console.log("Wilber lleva", wilber("MP-11"));
hints:
  - "¿Cuántos arrays `vistos` existen en este programa? ¿Y cuántos debería haber?"
  - Lo que cada libreta debe tener propio va **dentro** de la fábrica.
tests:
  - name: Wilber lleva 1
    output: Wilber lleva 1
  - name: una libreta no cuenta dos veces el mismo arete
    expect: '(() => { const a = crearLibreta(); a("MP-01"); return a("MP-01"); })() === 1'
  - name: dos libretas no se mezclan
    expect: '(() => { const a = crearLibreta(); const b = crearLibreta(); a("MP-01"); a("MP-02"); return b("MP-03"); })() === 1'
```

```exercise
id: js11-arregla-fabrica-en-bucle
type: fix
title: El contador que siempre dice 1
prompt: |
  Chasqui recorre cinco andenes y debería contar cuántos tienen llamas. Siempre reporta 1. El contador está bien escrito; el problema es **dónde** se crea.
visual:
  figure:
    panes:
      - { label: "llamasPorAndén", cells: [2, 0, 1, 3, 0], highlight: [0, 2, 3] }
      - { label: "debería imprimir", value: "Andenes con llamas: 3" }
starter: |
  function crearContador() {
    let cuenta = 0;
    return () => {
      cuenta++;
      return cuenta;
    };
  }

  const llamasPorAndén = [2, 0, 1, 3, 0];
  let conLlamas = 0;
  for (const llamas of llamasPorAndén) {
    const contar = crearContador();
    if (llamas > 0) {
      conLlamas = contar();
    }
  }
  console.log("Andenes con llamas:", conLlamas);
solution: |
  function crearContador() {
    let cuenta = 0;
    return () => {
      cuenta++;
      return cuenta;
    };
  }

  const llamasPorAndén = [2, 0, 1, 3, 0];
  let conLlamas = 0;
  const contar = crearContador();
  for (const llamas of llamasPorAndén) {
    if (llamas > 0) {
      conLlamas = contar();
    }
  }
  console.log("Andenes con llamas:", conLlamas);
hints:
  - "¿Cuántos contadores se crean en el bucle? Cada uno empieza en 0."
tests:
  - name: cuenta 3 andenes
    output: "Andenes con llamas: 3"
  - name: la fábrica se llama una sola vez, fuera del bucle
    source: 'const\s+contar\s*=\s*crearContador\(\)[\s\S]*\bfor\s*\('
    msg: Crea el contador una vez, antes del for, y úsalo dentro.
```

```exercise
id: js11-escribe-avisador
type: write
title: Avisa solo cuando cambia
prompt: |
  Escribe `crearAvisador()`, que devuelve una función `avisar(lectura)`: responde `true` si la lectura es **distinta de la anterior** y `false` si es la misma. La primera lectura siempre es un cambio.

  El sensor de neblina manda una lectura por turno (`"despejado"`, `"neblina"`…) y Yeny no quiere que la radio repita lo mismo cada minuto.
visual:
  figure:
    title: Un avisador, turno a turno
    panes:
      - { table: { head: ["turno", "1", "2", "3", "4", "5"], rows: [["lectura", "neblina", "neblina", "despejado", "neblina", "neblina"], ["devuelve", "true", "false", "true", "true", "false"]] } }
starter: |
  function crearAvisador() {
  }

  const avisar = crearAvisador();
  console.log(avisar("neblina"), avisar("neblina"), avisar("despejado"));
solution: |
  function crearAvisador() {
    let anterior = null;
    return (lectura) => {
      const cambio = lectura !== anterior;
      anterior = lectura;
      return cambio;
    };
  }

  const avisar = crearAvisador();
  console.log(avisar("neblina"), avisar("neblina"), avisar("despejado"));
hints:
  - Guarda la lectura anterior en una variable de la fábrica. Empieza en `null`, que no es igual a ninguna lectura.
  - "Compara primero y actualiza después: si actualizas antes, siempre serán iguales."
tests:
  - name: la secuencia del dibujo
    run: '(() => { const a = crearAvisador(); return ["neblina", "neblina", "despejado", "neblina", "neblina"].map(a); })()'
    equals: [true, false, true, true, false]
  - name: la primera lectura avisa
    expect: crearAvisador()("despejado") === true
  - name: dos avisadores no comparten la lectura anterior
    expect: '(() => { const a = crearAvisador(); const b = crearAvisador(); a("neblina"); return b("neblina"); })() === true'
```

## El caso

```exercise
id: js11-caso-libretas
type: case
title: La libreta que no cuadra
prompt: |
  Escribe `crearLibreta()`, dale una libreta a cada guardaparque, pásales sus avistamientos en orden y cuenta las llamas **distintas** que vio cada uno.

  Antes de que llegara Chasqui, cuatro guardaparques contaron llamas por radio toda la mañana. Cada avistamiento es `[guardaparque, arete]`, en el orden en que llegó por radio. En la niebla, todos vieron la misma llama varias veces; eso no es error. Al final, cada uno reportó cuántas llamas **distintas** vio. Una de esas libretas no cuadra. ¿De quién?

  Imprime una línea por guardaparque, con la cuenta al final: `Yeny: 4`. El tablero compara tu número con lo que reportó cada uno.
visual:
  board:
    for: js11-caso-libretas
    title: Lo que reportó cada guardaparque
    task: Cuenta las llamas distintas de cada guardaparque con su propia libreta y compáralas con su reporte.
    cards:
      - { name: "Yeny", kind: person, role: "Reportó 4 llamas", clue: { find: "Yeny", says: 4 } }
      - { name: "Wilber", kind: person, role: "Reportó 3 llamas", clue: { find: "Wilber", says: 3 } }
      - { name: "Rosaura", kind: person, role: "Reportó 5 llamas", culprit: true, clue: { find: "Rosaura", says: 5 } }
      - { name: "Fidel", kind: person, role: "Reportó 3 llamas", clue: { find: "Fidel", says: 3 } }
    caption: "Ver la misma llama varias veces es normal en la neblina: cuenta solo aretes **distintos**."
starter: |
  const avistamientos = [
    ["Yeny", "MP-04"], ["Wilber", "MP-11"], ["Rosaura", "MP-02"], ["Fidel", "MP-07"],
    ["Yeny", "MP-09"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Yeny", "MP-04"],
    ["Fidel", "MP-12"], ["Rosaura", "MP-05"], ["Wilber", "MP-03"], ["Yeny", "MP-01"],
    ["Rosaura", "MP-08"], ["Fidel", "MP-07"], ["Wilber", "MP-06"], ["Rosaura", "MP-05"],
    ["Yeny", "MP-09"], ["Wilber", "MP-03"], ["Rosaura", "MP-10"], ["Fidel", "MP-12"],
    ["Yeny", "MP-06"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Fidel", "MP-04"],
    ["Rosaura", "MP-08"], ["Yeny", "MP-01"],
  ];

  const guardaparques = ["Yeny", "Wilber", "Rosaura", "Fidel"];

  // Así se lee un avistamiento:
  const [quien, arete] = avistamientos[0];
  console.log(quien, "vio la llama", arete);

  // TODO: escribe crearLibreta(): devuelve una función anotar(arete) que
  // recuerda los aretes ya vistos y devuelve cuántos distintos lleva.

  // TODO: crea una libreta por guardaparque, recorre los avistamientos
  // y anota cada uno en la libreta de quien lo vio.

  // TODO: imprime una línea por guardaparque, así: Yeny: 4
solution: |
  const avistamientos = [
    ["Yeny", "MP-04"], ["Wilber", "MP-11"], ["Rosaura", "MP-02"], ["Fidel", "MP-07"],
    ["Yeny", "MP-09"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Yeny", "MP-04"],
    ["Fidel", "MP-12"], ["Rosaura", "MP-05"], ["Wilber", "MP-03"], ["Yeny", "MP-01"],
    ["Rosaura", "MP-08"], ["Fidel", "MP-07"], ["Wilber", "MP-06"], ["Rosaura", "MP-05"],
    ["Yeny", "MP-09"], ["Wilber", "MP-03"], ["Rosaura", "MP-10"], ["Fidel", "MP-12"],
    ["Yeny", "MP-06"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Fidel", "MP-04"],
    ["Rosaura", "MP-08"], ["Yeny", "MP-01"],
  ];

  const guardaparques = ["Yeny", "Wilber", "Rosaura", "Fidel"];

  function crearLibreta() {
    const vistos = [];
    return (arete) => {
      if (!vistos.includes(arete)) {
        vistos.push(arete);
      }
      return vistos.length;
    };
  }

  const libretas = {};
  const cuentas = {};
  for (const nombre of guardaparques) {
    libretas[nombre] = crearLibreta();
    cuentas[nombre] = 0;
  }
  for (const [quien, arete] of avistamientos) {
    cuentas[quien] = libretas[quien](arete);
  }
  for (const nombre of guardaparques) {
    console.log(`${nombre}: ${cuentas[nombre]}`);
  }
answer: Rosaura
answerLabel: ¿De quién es la libreta que no cuadra?
reveal: |
  Rosaura vio 4 llamas distintas (MP-02, MP-05, MP-08 y MP-10) y reportó 5. Tuvo 8 avistamientos: la MP-02 la vio tres veces. Si contaste avistamientos en vez de aretes distintos, no cuadraba nadie.
hints:
  - "Guarda las libretas en un objeto: `libretas[nombre] = crearLibreta()`. Así `libretas[quien](arete)` anota en la de quien vio la llama."
  - La libreta devuelve cuántos distintos lleva; quédate con el último valor de cada guardaparque.
```

## El juez

Como en la sesión 4, el juez **llama a tu función** y compara lo que devuelve. Esta vez el problema es de **diseño**, como los de LeetCode: tú escribes la fábrica y el juez la usa a través de `patrullar`, que ya viene escrita.

```exercise
id: js11-juez-neblina
type: judge
mode: function
function: patrullar
title: La racha de neblina
prompt: |
  Escribe `crearVigia()`, que devuelve una función `vigia(visibilidad)`: cada turno recibe la visibilidad y devuelve **cuántos turnos seguidos** lleva ese robot en neblina, contando este.

  Hay neblina cuando la visibilidad es **menor que 30**. Con 30 o más, la racha vuelve a 0 (y devuelve 0).

  Varios robots patrullan a la vez y sus turnos llegan mezclados. `patrullar(turnos)` ya está escrita: recibe una lista de `[robot, visibilidad]`, crea **un vigía por robot** la primera vez que lo ve, y devuelve la lista de respuestas. No la cambies: cada vigía tiene que recordar **su** racha.

  **Restricciones:** hasta 200 turnos · hasta 5 robots · visibilidad de 0 a 100.
visual:
  figure:
    title: El ejemplo 1, turno a turno
    panes:
      - { table: { head: ["turno", "1", "2", "3", "4", "5", "6", "7"], rows: [["robot", "A", "A", "A", "B", "A", "A", "B"], ["visibilidad", "80", "20", "10", "5", "25", "60", "12"], ["¿neblina? (< 30)", "no", "sí", "sí", "sí", "sí", "no", "sí"], ["devuelve", "0", "1", "2", "1", "3", "0", "2"]] } }
    caption: "La racha de B no se mezcla con la de A: en el turno 4, B lleva 1 aunque A llevaba 2."
starter: |
  function crearVigia() {
    // TODO: devuelve una función vigia(visibilidad)
  }

  // El juez llama a esta función. No la cambies.
  function patrullar(turnos) {
    const vigias = {};
    return turnos.map(([robot, visibilidad]) => {
      if (vigias[robot] === undefined) {
        vigias[robot] = crearVigia();
      }
      return vigias[robot](visibilidad);
    });
  }
solution: |
  function crearVigia() {
    let racha = 0;
    return (visibilidad) => {
      if (visibilidad < 30) {
        racha++;
      } else {
        racha = 0;
      }
      return racha;
    };
  }

  // El juez llama a esta función. No la cambies.
  function patrullar(turnos) {
    const vigias = {};
    return turnos.map(([robot, visibilidad]) => {
      if (vigias[robot] === undefined) {
        vigias[robot] = crearVigia();
      }
      return vigias[robot](visibilidad);
    });
  }
hints:
  - "La racha vive dentro de `crearVigia`, en un `let` que empieza en 0."
  - Si la racha estuviera fuera de la fábrica, todos los robots compartirían una sola. Prueba el ejemplo 1 a mano.
samples:
  - args: [[["A", 80], ["A", 20], ["A", 10], ["B", 5], ["A", 25], ["A", 60], ["B", 12]]]
    returns: [0, 1, 2, 1, 3, 0, 2]
    note: La racha de cada robot es suya.
  - args: [[["C", 29], ["C", 30], ["C", 29]]]
    returns: [1, 0, 1]
    note: 30 ya no es neblina.
edge:
  - args: [[]]
    tag: sin turnos
  - args: [[["A", 0], ["A", 0], ["A", 0], ["A", 0], ["A", 0]]]
    tag: con neblina en todos los turnos
  - args: [[["A", 10], ["B", 10], ["A", 10], ["B", 90], ["A", 10], ["B", 10]]]
    tag: con dos robots alternados
  - args: [[["A", 100], ["B", 100], ["C", 100]]]
    tag: con el cielo despejado
random:
  count: 40
  seed: 111
  generate: |
    const robots = ["A", "B", "C", "D", "E"].slice(0, rng.int(1, 5));
    const n = rng.int(1, 200);
    return [Array.from({ length: n }, () => [rng.pick(robots), rng.next() < 0.6 ? rng.int(0, 29) : rng.int(30, 100)])];
wrong:
  - |
    let racha = 0;
    function crearVigia() {
      return (visibilidad) => {
        racha = visibilidad < 30 ? racha + 1 : 0;
        return racha;
      };
    }
    function patrullar(turnos) {
      const vigias = {};
      return turnos.map(([robot, visibilidad]) => {
        if (vigias[robot] === undefined) vigias[robot] = crearVigia();
        return vigias[robot](visibilidad);
      });
    }
  - |
    function crearVigia() {
      let racha = 0;
      return (visibilidad) => {
        racha = visibilidad <= 30 ? racha + 1 : 0;
        return racha;
      };
    }
    function patrullar(turnos) {
      const vigias = {};
      return turnos.map(([robot, visibilidad]) => {
        if (vigias[robot] === undefined) vigias[robot] = crearVigia();
        return vigias[robot](visibilidad);
      });
    }
  - |
    function crearVigia() {
      let turnosConNeblina = 0;
      return (visibilidad) => {
        if (visibilidad < 30) turnosConNeblina++;
        return visibilidad < 30 ? turnosConNeblina : 0;
      };
    }
    function patrullar(turnos) {
      const vigias = {};
      return turnos.map(([robot, visibilidad]) => {
        if (vigias[robot] === undefined) vigias[robot] = crearVigia();
        return vigias[robot](visibilidad);
      });
    }
```

## Misión final

```exercise
id: js11-mision-censo
type: mission
title: El censo de llamas en la neblina
prompt: |
  Escribe `crearCenso()` y úsala para que Chasqui recorra los andenes y reporte **una vez, al final**, cuántas llamas distintas vio.

  La niebla no deja ver más que una casilla alrededor. En cada paso, Chasqui mira con `robot.escanear()`; la ayudante `casillasCon(grilla, robot.posicion, "l")` convierte lo que vio en las casillas del mapa donde hay una llama, como `["4,2", "6,2"]`. La misma llama aparece en varios pasos seguidos, así que sumarlas todas cuenta de más.

  `crearCenso()` devuelve una función `anotar(casillas)` que **recuerda** las casillas ya vistas y devuelve cuántas llamas distintas lleva. `ruta` es un texto con un paso por letra (`"E"`, `"S"`, `"O"`, `"N"`) y cambia en cada prueba.
visual:
  figure:
    title: La misma llama, vista desde tres pasos
    panes:
      - { label: "paso 2: Chasqui en (3, 1)", grid: ["...", ".R.", "..l"], path: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "0,2", "1,2"], marks: ["2,2"] }
      - { label: "paso 3: en (4, 1)", grid: ["...", ".R.", ".l."], path: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "0,2", "2,2"], marks: ["1,2"] }
      - { label: "paso 4: en (5, 1)", grid: ["...", ".R.", "l.."], path: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "1,2", "2,2"], marks: ["0,2"] }
      - { label: "lo que da cada forma", table: { head: ["paso", "2", "3", "4"], rows: [["casillasCon(…)", "[\"4,2\"]", "[\"4,2\"]", "[\"4,2\"]"], ["sumando todo", "1", "2", "3"], ["anotar (con memoria)", "1", "1", "1"]] } }
starter: |
  // ruta: cada letra es un paso ("E", "S", "O", "N").
  let total = 0;
  for (const paso of ruta) {
    robot.seguirRuta([paso]);
    const llamas = casillasCon(robot.escanear(), robot.posicion, "l");
    total += llamas.length; // cuenta la misma llama varias veces
  }
  robot.reportar(total);

  // TODO: escribe crearCenso(): devuelve una función anotar(casillas)
  // que recuerda las casillas ya vistas y devuelve cuántas distintas lleva.
solution: |
  function crearCenso() {
    const vistas = [];
    return (casillas) => {
      for (const casilla of casillas) {
        if (!vistas.includes(casilla)) {
          vistas.push(casilla);
        }
      }
      return vistas.length;
    };
  }

  const anotar = crearCenso();
  let total = 0;
  for (const paso of ruta) {
    robot.seguirRuta([paso]);
    total = anotar(casillasCon(robot.escanear(), robot.posicion, "l"));
  }
  robot.reportar(total);
hints:
  - "Dentro de la fábrica, un array `vistas`; `anotar` agrega solo las casillas que no estén (`includes`) y devuelve `vistas.length`."
  - Crea el censo una vez, antes del bucle. En el bucle, `total` es lo que devuelve `anotar`, no una suma.
helpers:
  - name: casillasCon
    sig: "casillasCon(grilla, posicion, letra) → string[]"
    doc: Las casillas del mapa ("x,y") donde la grilla de escanear() muestra esa letra.
    code: "(grilla, posicion, letra) => { const r = (grilla.length - 1) / 2; return grilla.flatMap((fila, f) => fila.flatMap((c, k) => (c === letra ? [`${posicion.x + k - r},${posicion.y + f - r}`] : []))); }"
world:
  theme: museo
  level: 4
  dir: E
  fog: true
  vision: 1
  api: [move, scan, path, report]
  items: { l: llama }
  map: |
    ###############
    #R............#
    #..l.....l....#
    ###########...#
    #.............#
    #..l...l....l.#
    #...###########
    #.............#
    #....l....l...#
    ###############
globals:
  ruta: EEEEEEEEEEEESSSOOOOOOOOOOOOSSSEEEEEEEEEEEE
scenarios:
  - {}
  - map: |
      ###########
      #R........#
      #...l.l...#
      #######...#
      #.........#
      #.l.......#
      ###########
    globals:
      ruta: EEEEEEEESSSOOOOOOOO
  - map: |
      #################
      #R..............#
      #...l.....l...l.#
      #############...#
      #...............#
      #..l.......l....#
      #...#############
      #...............#
      #.l...l.....l...#
      #############...#
      #...............#
      #......l........#
      #################
    globals:
      ruta: EEEEEEEEEEEEEESSSOOOOOOOOOOOOOOSSSEEEEEEEEEEEEEESSSOOOOOOOOOOOOOO
tests:
  - name: crearCenso es una función
    expect: typeof crearCenso === "function"
  - name: anotar no cuenta dos veces la misma casilla
    expect: '(() => { const anotar = crearCenso(); anotar(["4,2"]); return anotar(["4,2", "6,2"]); })() === 2'
  - name: cada censo tiene su propia memoria
    expect: '(() => { const a = crearCenso(); const b = crearCenso(); a(["1,1", "2,2"]); return b(["1,1"]); })() === 1'
  - name: reporta una vez el número de llamas
    state: w.reports.length === 1 && w.reports[0] === w.itemsLeft
    msg: El número reportado no es el de llamas distintas (o se reportó más de una vez).
  - name: sin chocar
    state: '!w.crashed'
```

## Reto experto

```exercise
id: js11-reto-memorizar
type: challenge
title: No vuelvas a calcular lo mismo
prompt: |
  Calcular la ruta entre dos andenes es lento. Escribe `memorizar(fn)`, que devuelve una función nueva que hace lo mismo que `fn` pero **recuerda** cada resultado por su argumento: si le piden otra vez el mismo, responde sin llamar a `fn`. Cada función memorizada tiene su propia memoria.
starter: |
  function memorizar(fn) {
    return fn;
  }

  let llamadas = 0;
  const lenta = (n) => {
    llamadas++;
    return n * 2;
  };
  const rapida = memorizar(lenta);
  console.log(rapida(4), rapida(4), llamadas);
solution: |
  function memorizar(fn) {
    const memoria = new Map();
    return (argumento) => {
      if (!memoria.has(argumento)) {
        memoria.set(argumento, fn(argumento));
      }
      return memoria.get(argumento);
    };
  }

  let llamadas = 0;
  const lenta = (n) => {
    llamadas++;
    return n * 2;
  };
  const rapida = memorizar(lenta);
  console.log(rapida(4), rapida(4), llamadas);
hints:
  - "Un `Map` dentro de `memorizar` guarda argumento → resultado."
  - "Usa `has`, no `get(...) === undefined`: una función puede devolver `undefined` de verdad."
tests:
  - name: el segundo pedido no llama a fn
    output: 8 8 1
  - name: argumentos distintos sí la llaman
    expect: '(() => { let n = 0; const f = memorizar((x) => { n++; return x + 1; }); f(1); f(2); f(1); return n; })() === 2'
  - name: recuerda también un undefined
    expect: '(() => { let n = 0; const f = memorizar(() => { n++; return undefined; }); f(1); f(1); return n; })() === 1'
  - name: cada función memorizada tiene su memoria
    expect: '(() => { const a = memorizar((x) => x * 2); const b = memorizar((x) => x * 3); a(5); return b(5); })() === 15'
```
