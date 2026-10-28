# Sesión 15 — Errores y pruebas

## El encargo

Arequipa, 15 de agosto, aniversario de la ciudad. La municipalidad invitó a Loop a la Plaza de Armas: Chasqui debía cruzar la plaza y entregarle un queso helado a la alcaldesa, delante de dos mil personas y de la tele local. Avanzó cuatro casillas, se detuvo en seco y se quedó ahí, quieto bajo el sol, mientras el queso helado se derretía. En la pantalla de Loop decía: `TypeError: Reduce of empty array with no initial value`.

Nadie se hizo daño, pero el video ya tiene más vistas que el himno de Arequipa. El domingo hay revancha en el Mirador de Yanahuara. Antes, toca hacer lo que hacen los equipos serios después de un choque: un **post-mortem**. Encontrar qué falló, hacer que el programa **avise con errores claros** en vez de congelarse, y escribir **pruebas** para que ese bug no vuelva nunca.

```escena
theme: barranco
level: 4
dir: E
caption: La Plaza de Armas de Arequipa. Chasqui debía llegar a la alcaldesa (D) y se congeló a medio camino.
map: |
  ###########
  #R........#
  #.###.###.#
  #........D#
  ###########
program: |
  robot.avanzar(4);
  robot.decir("¡TypeError!");
```

## Lo mínimo

Un error no es una tragedia: es un mensaje. Lo grave es que el programa se caiga sin decir nada útil, o que siga como si nada con datos malos.

- **`throw new Error("mensaje")`** detiene la función en esa línea y lanza el error hacia quien la llamó. Hay tipos de error que ya vienen: `TypeError` (un valor del tipo equivocado), `RangeError` (un número fuera de rango), `SyntaxError`…
- **`try { … } catch (error) { … }`** atrapa el error: si algo dentro del `try` lanza, el programa salta al `catch` y sigue desde ahí. `error.name` y `error.message` dicen qué pasó.
- **`finally { … }`** corre siempre, haya error o no: el lugar para dejar al robot en modo seguro.
- **Validar la entrada**: revisa los datos *antes* de usarlos y lanza un error claro si están mal. Mejor "Comando inválido: F0" en la oficina que un robot congelado en la plaza.
- **Tus propios errores**: `class ErrorDeComando extends Error { … }` crea un tipo nuevo; con `error instanceof ErrorDeComando` el `catch` sabe si es un error que esperabas o un bug de verdad.
- **Una prueba** es código que llama a tu función con un dato conocido y lanza un error si el resultado no es el esperado. Antes de entregar, las corres todas: te avisan, en un segundo, qué rompiste.

```js run
try {
  const lectura = JSON.parse("{distancia: 40}");
  console.log(lectura);
} catch (error) {
  console.log(`${error.name}: no pude leer el sensor`);
} finally {
  console.log("Chasqui en modo seguro");
}
```

Mira el camino de un error: sale del `throw`, se salta todo lo que faltaba en el `try` y aterriza en el `catch`. El `finally` corre al final, pase lo que pase.

```anima
title: Un error salta directo al catch
code: |
  function pasosDe(comando) {
    const pasos = Number(comando.slice(1));
    if (pasos < 1) throw new Error(`Comando inválido: "${comando}"`);
    return pasos;
  }
  try {
    console.log(pasosDe("F3"));
    console.log(pasosDe("F0"));
    console.log("esto nunca sale");
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("Chasqui en modo seguro");
  }
steps:
  - { line: 7, vars: {}, stack: [{ name: pasosDe, args: 'comando = "F3"' }], note: "Dentro del try se llama a pasosDe con F3." }
  - { line: 2, vars: { pasos: 3 }, stack: [{ name: pasosDe, args: 'comando = "F3"' }] }
  - { line: 4, vars: { pasos: 3 }, stack: [{ name: pasosDe, args: 'comando = "F3"', ret: "3" }], note: "3 es un número de pasos válido: return." }
  - { line: 7, vars: {}, stack: [], out: "3" }
  - { line: 8, vars: {}, stack: [{ name: pasosDe, args: 'comando = "F0"' }], note: "Ahora con F0." }
  - { line: 2, vars: { pasos: 0 }, stack: [{ name: pasosDe, args: 'comando = "F0"' }], out: "3" }
  - { line: 3, vars: { pasos: 0 }, stack: [{ name: pasosDe, args: 'comando = "F0"', ret: "💥 Error" }], out: "3", note: "0 pasos no es válido: throw. La función se corta aquí, sin llegar al return." }
  - { line: 11, vars: { error: 'Error: Comando inválido: "F0"' }, stack: [], out: "3\nComando inválido: \"F0\"", note: "El error salta directo al catch. La línea 9 nunca se ejecuta." }
  - { line: 13, vars: { error: 'Error: Comando inválido: "F0"' }, stack: [], out: "3\nComando inválido: \"F0\"\nChasqui en modo seguro", note: "finally corre siempre, con error o sin él." }
```

Un error no se queda donde nace: **sale de la llamada y sube**, llamada por llamada, hasta que alguien lo atrapa. Mira cómo cruza tres llamadas hasta el `try` de `main`, y qué pasa si no hay ninguno:

```anima
title: Un error cruza varias llamadas hasta encontrar un catch
code: |
  function pasosDe(comando) {
    if (comando === "F0") throw new Error("Comando inválido");
    return 3;
  }
  function atender(pedido) {
    return pasosDe(pedido) + 1;
  }
  function main() {
    try {
      atender("F0");
    } catch (error) {
      console.log(error.message);
    }
  }
  main();
steps:
  - { line: 15, vars: {}, stack: [{ name: main, args: '' }], note: "`main` empieza. Dentro hay un `try`: quien lance un error más abajo puede ser atrapado aquí." }
  - { line: 10, vars: {}, stack: [{ name: main, args: '' }, { name: atender, args: 'pedido = "F0"' }], note: "`main` llama a `atender`: dos llamadas apiladas." }
  - { line: 6, vars: {}, stack: [{ name: main, args: '' }, { name: atender, args: 'pedido = "F0"' }, { name: pasosDe, args: 'comando = "F0"' }], note: "`atender` llama a `pasosDe`: ya son tres. La de arriba es la que corre." }
  - { line: 2, vars: {}, stack: [{ name: main, args: '' }, { name: atender, args: 'pedido = "F0"' }, { name: pasosDe, args: 'comando = "F0"', err: 'throw' }], note: "`pasosDe` hace `throw`: su llamada se corta aquí, sin llegar al `return`. Busca un `catch` en la misma función: no hay." }
  - { line: 6, vars: {}, stack: [{ name: main, args: '' }, { name: atender, args: 'pedido = "F0"', err: 'sigue subiendo' }], note: "Sin `catch`, el error **sale de la llamada** y sube a quien la hizo: `atender`. Ahí tampoco hay `catch`: su `+ 1` nunca corre y también se corta." }
  - { line: 11, vars: { error: 'Error: Comando inválido' }, stack: [{ name: main, args: '' }], note: "Al subir a `main`, el error encuentra el `try`: salta directo al `catch`. `atender` y `pasosDe` ya no existen." }
  - { line: 12, vars: { error: 'Error: Comando inválido' }, stack: [{ name: main, args: '' }], out: "Comando inválido", note: "El `catch` maneja el error y el programa sigue con normalidad." }
```

```anima
title: Sin catch, el error llega hasta arriba y el programa se detiene
code: |
  function pasosDe(comando) {
    if (comando === "F0") throw new Error("Comando inválido");
    return 3;
  }
  function atender(pedido) {
    return pasosDe(pedido) + 1;
  }
  atender("F0");
  console.log("esto nunca sale");
steps:
  - { line: 8, vars: {}, stack: [{ name: atender, args: 'pedido = "F0"' }, { name: pasosDe, args: 'comando = "F0"' }], note: "Mismas llamadas, pero esta vez nadie las rodea con un `try`." }
  - { line: 2, vars: {}, stack: [{ name: atender, args: 'pedido = "F0"' }, { name: pasosDe, args: 'comando = "F0"', err: 'throw' }], note: "`pasosDe` lanza el error." }
  - { line: 6, vars: {}, stack: [{ name: atender, args: 'pedido = "F0"', err: 'sigue subiendo' }], note: "Sube a `atender`, que tampoco lo atrapa." }
  - { line: 8, vars: {}, stack: [], out: "Uncaught Error: Comando inválido\n    at pasosDe\n    at atender", note: "La pila se vació sin encontrar un `catch`: el programa **se detiene** y el mensaje de error lista las llamadas por las que pasó el error. La línea 9 nunca corre." }
```

Y así se ve una prueba hecha a mano. No necesitas una librería para empezar: una función que compara y lanza.

```js
function afirmarIgual(real, esperado) {
  if (real !== esperado) {
    throw new Error(`salió ${real}, se esperaba ${esperado}`);
  }
}

afirmarIgual(pasosDe("F3"), 3); // pasa en silencio
afirmarIgual(pasosDe("F9"), 9); // si falla, te dice qué salió
```

> **Trampa común:** el `catch` vacío. `try { … } catch {}` hace desaparecer el error, y con él la pista: el programa sigue con datos malos y falla más lejos, donde ya no se entiende por qué. Atrapa solo lo que sabes manejar; lo demás, déjalo subir (o vuelve a lanzarlo con `throw error`).

<!-- legacy: throw-error -->

<!-- legacy: try-catch -->

<!-- legacy: custom-errors -->

<!-- mdn: throw-error try-catch custom-errors -->

## Práctica

```exercise
id: js15-predice-finally
type: predict
title: La bandeja que siempre se cierra
prompt: |
  `finally` corre incluso cuando el `try` hace `return`. ¿Qué imprime?
code: |
  function servir() {
    try {
      console.log("abro la bandeja");
      return "queso helado";
    } finally {
      console.log("cierro la bandeja");
    }
  }
  console.log(servir());
options:
  - "abro la bandeja\nqueso helado"
  - "abro la bandeja\nqueso helado\ncierro la bandeja"
  - "abro la bandeja\ncierro la bandeja\nqueso helado"
  - "cierro la bandeja\nabro la bandeja\nqueso helado"
answer: "abro la bandeja\ncierro la bandeja\nqueso helado"
explain: |
  El `return` prepara el valor, pero antes de salir de la función corre el `finally`. Recién después `console.log` recibe "queso helado" y lo imprime.
```

```exercise
id: js15-predice-sigue
type: predict
title: Un comando malo no detiene el desfile
prompt: |
  El `try` está **dentro** del bucle. ¿Qué imprime?
code: |
  const comandos = ["F2", "X", "F1"];
  for (const comando of comandos) {
    try {
      if (comando[0] !== "F") throw new Error(`no entiendo ${comando}`);
      console.log(`avanzo ${comando.slice(1)}`);
    } catch (error) {
      console.log(error.message);
    }
  }
options:
  - "avanzo 2\nno entiendo X"
  - "avanzo 2\nno entiendo X\navanzo 1"
  - "avanzo 2\navanzo X\navanzo 1"
  - "no entiendo X"
answer: "avanzo 2\nno entiendo X\navanzo 1"
explain: |
  Cada vuelta tiene su propio `try`. El error de "X" se atrapa en su vuelta y el bucle sigue con "F1". Si el `try` envolviera todo el bucle, el error lo cortaría y "avanzo 1" no saldría.
```

```exercise
id: js15-completa-velocidad
type: complete
title: Una velocidad que tenga sentido
prompt: |
  La velocidad de Chasqui va de 0 a 3. Completa `validarVelocidad`: lanza un `TypeError` si no es un número y un `RangeError` si está fuera de 0–3; si está bien, la devuelve.
visual:
  figure:
    panes:
      - { cards: [{ title: "validarVelocidad(2)", rows: [["→", "devuelve 2"]] }, { title: "validarVelocidad(5)", rows: [["→", "lanza RangeError"]] }, { title: "validarVelocidad(\"rápido\")", rows: [["→", "lanza TypeError"]] }] }
starter: |
  function validarVelocidad(v) {
    if (typeof v ___ "number" || Number.isNaN(v)) {
      ___ new TypeError(`La velocidad debe ser un número: ${v}`);
    }
    if (v < 0 || v > 3) {
      throw new ___(`Velocidad fuera de rango: ${v}`);
    }
    return v;
  }

  console.log(validarVelocidad(2));
solution: |
  function validarVelocidad(v) {
    if (typeof v !== "number" || Number.isNaN(v)) {
      throw new TypeError(`La velocidad debe ser un número: ${v}`);
    }
    if (v < 0 || v > 3) {
      throw new RangeError(`Velocidad fuera de rango: ${v}`);
    }
    return v;
  }

  console.log(validarVelocidad(2));
hints:
  - El primer hueco es "distinto de", en su versión estricta.
  - Un número fuera de los límites permitidos tiene su propio tipo de error ya hecho.
tests:
  - name: 2 es válida y se devuelve
    run: validarVelocidad(2)
    equals: 2
  - name: 5 lanza un RangeError
    run: '(() => { try { validarVelocidad(5); return "no lanzó nada"; } catch (error) { return error.name; } })()'
    equals: RangeError
  - name: '"rápido" lanza un TypeError'
    run: '(() => { try { validarVelocidad("rápido"); return "no lanzó nada"; } catch (error) { return error.name; } })()'
    equals: TypeError
  - name: el 3 todavía vale
    run: validarVelocidad(3)
    equals: 3
```

```exercise
id: js15-arregla-texto
type: fix
title: "Falla: undefined"
prompt: |
  En el registro del día del desfile, cada falla de batería aparece como `Falla: undefined`. Así nadie sabe qué pasó. Haz que diga `Falla: batería baja`.
starter: |
  function revisarBateria(bateria) {
    if (bateria < 10) {
      throw "batería baja";
    }
    return "ok";
  }

  try {
    revisarBateria(4);
  } catch (error) {
    console.log(`Falla: ${error.message}`);
  }
solution: |
  function revisarBateria(bateria) {
    if (bateria < 10) {
      throw new Error("batería baja");
    }
    return "ok";
  }

  try {
    revisarBateria(4);
  } catch (error) {
    console.log(`Falla: ${error.message}`);
  }
hints:
  - Se lanzó un texto suelto. ¿Un texto tiene la propiedad `message`?
tests:
  - name: el registro dice qué pasó
    output: "Falla: batería baja"
  - name: lanza un Error de verdad
    source: 'throw\s+new\s+Error\s*\('
    msg: Lanza new Error("batería baja"), no un texto.
```

```exercise
id: js15-escribe-clase
type: write
title: Un error con apellido
prompt: |
  Escribe `class ErrorDeBateria extends Error`: su constructor recibe `faltan` (cuánta batería falta), pone el mensaje `"Faltan N de batería"`, el `name` `"ErrorDeBateria"` y guarda `faltan` en el error.

  Luego escribe `exigirBateria(bateria, pasos)`: si alcanza, devuelve la batería que queda; si no, lanza un `ErrorDeBateria` con lo que falta.
visual:
  figure:
    panes:
      - { label: "exigirBateria(10, 4)", value: "devuelve 6" }
      - { label: "exigirBateria(2, 5)", cards: [{ title: "lanza ErrorDeBateria", rows: [["name", "\"ErrorDeBateria\""], ["message", "\"Faltan 3 de batería\""], ["faltan", "3"]] }] }
starter: |
  class ErrorDeBateria extends Error {
  }

  function exigirBateria(bateria, pasos) {
  }
solution: |
  class ErrorDeBateria extends Error {
    constructor(faltan) {
      super(`Faltan ${faltan} de batería`);
      this.name = "ErrorDeBateria";
      this.faltan = faltan;
    }
  }

  function exigirBateria(bateria, pasos) {
    if (pasos > bateria) throw new ErrorDeBateria(pasos - bateria);
    return bateria - pasos;
  }
hints:
  - "En el constructor, lo primero es `super(mensaje)`: así `Error` arma el `message` y la pila."
  - "Después de `super`, ya puedes usar `this.name = …` y `this.faltan = …`."
tests:
  - name: es un Error
    expect: new ErrorDeBateria(3) instanceof Error
  - name: su mensaje
    run: new ErrorDeBateria(3).message
    equals: Faltan 3 de batería
  - name: su nombre
    run: new ErrorDeBateria(3).name
    equals: ErrorDeBateria
  - name: guarda lo que falta
    run: new ErrorDeBateria(3).faltan
    equals: 3
  - name: si alcanza, devuelve lo que queda
    run: exigirBateria(10, 4)
    equals: 6
  - name: si no alcanza, lanza ErrorDeBateria con lo que falta
    run: '(() => { try { exigirBateria(2, 5); return "no lanzó nada"; } catch (error) { return [error instanceof ErrorDeBateria, error.faltan]; } })()'
    equals: [true, 3]
```

```exercise
id: js15-escribe-pruebas
type: write
title: Pruebas hechas en casa
prompt: |
  Escribe dos funciones para probar código: `afirmarIgual(real, esperado)` lanza un `Error` con el mensaje `"salió X, se esperaba Y"` si son distintos, y `probar(nombre, prueba)` corre la prueba e imprime `✓ nombre` si pasa o `✗ nombre: mensaje` si lanza.

  Las tres pruebas de abajo ya están escritas, y la función `pasosDe` tiene un bug. Tus pruebas lo van a encontrar.
visual:
  figure:
    title: Lo que deben imprimir las tres pruebas
    panes:
      - { cards: [{ title: "F3 son 3 pasos", rows: [["pasosDe da", "3"], ["se espera", "3"], ["imprime", "✓ F3 son 3 pasos"]] }, { title: "F10 son 10 pasos", rows: [["pasosDe da", "1"], ["se espera", "10"], ["imprime", "✗ F10 son 10 pasos: salió 1, se esperaba 10"]] }, { title: "L no avanza", rows: [["pasosDe da", "0"], ["se espera", "0"], ["imprime", "✓ L no avanza"]] }] }
starter: |
  // La función que vamos a probar (tiene un bug):
  const pasosDe = (comando) => (comando === "L" || comando === "R" ? 0 : Number(comando[1]));

  function afirmarIgual(real, esperado) {
    // TODO: si son distintos, lanza un Error: "salió X, se esperaba Y"
  }

  function probar(nombre, prueba) {
    // TODO: corre prueba() dentro de un try/catch e imprime ✓ o ✗
  }

  probar("F3 son 3 pasos", () => afirmarIgual(pasosDe("F3"), 3));
  probar("F10 son 10 pasos", () => afirmarIgual(pasosDe("F10"), 10));
  probar("L no avanza", () => afirmarIgual(pasosDe("L"), 0));
solution: |
  const pasosDe = (comando) => (comando === "L" || comando === "R" ? 0 : Number(comando[1]));

  function afirmarIgual(real, esperado) {
    if (real !== esperado) {
      throw new Error(`salió ${real}, se esperaba ${esperado}`);
    }
  }

  function probar(nombre, prueba) {
    try {
      prueba();
      console.log(`✓ ${nombre}`);
    } catch (error) {
      console.log(`✗ ${nombre}: ${error.message}`);
    }
  }

  probar("F3 son 3 pasos", () => afirmarIgual(pasosDe("F3"), 3));
  probar("F10 son 10 pasos", () => afirmarIgual(pasosDe("F10"), 10));
  probar("L no avanza", () => afirmarIgual(pasosDe("L"), 0));
hints:
  - "`probar` recibe la prueba como función: dentro del `try`, llámala con `prueba()`. Si no lanzó, imprime el ✓."
  - "En el `catch`, `error.message` trae lo que armó `afirmarIgual`."
tests:
  - name: imprime el resultado de las tres pruebas
    output: "✓ F3 son 3 pasos\n✗ F10 son 10 pasos: salió 1, se esperaba 10\n✓ L no avanza"
  - name: afirmarIgual lanza con el mensaje pedido
    run: '(() => { try { afirmarIgual(1, 2); return "no lanzó nada"; } catch (error) { return error.message; } })()'
    equals: salió 1, se esperaba 2
  - name: afirmarIgual calla si son iguales
    run: '(() => { afirmarIgual(2, 2); return "calló"; })()'
    equals: calló
```

## El caso

```exercise
id: js15-caso-version
type: case
title: La versión que llegó a la plaza
prompt: |
  Escribe `contarFallas(version)`, que corre todas las `pruebas` sobre una versión y cuenta cuántas falla (dar otro resultado **o** lanzar un error cuenta como falla), e imprime una línea por técnico.

  Durante la semana, cuatro técnicos de Loop escribieron su versión de `velocidadSegura(lecturas)`, la función que decide qué tan rápido va Chasqui según lo que ve su sensor. Una de esas versiones fue la que llegó a la plaza. Los cuatro juran que la suya "pasa todas las pruebas". En la plaza, la gente rodeó al robot y tapó el sensor: llegó una lista **vacía** de lecturas.

  Imprime cada técnico con sus fallas al final, por ejemplo `Yolanda: 0 fallas`. El tablero compara tu número con lo que dijo cada uno.
visual:
  board:
    for: js15-caso-version
    title: Lo que juró cada técnico
    task: Corre las seis pruebas sobre cada versión, atrapando los errores, y cuenta las fallas.
    cards:
      - { name: Yolanda, kind: person, role: "Técnica de sensores", rows: [["Dijo", "\"pasa todas\""]], clue: { find: "Yolanda", says: 0, saysLabel: "Fallas que dijo" } }
      - { name: Percy, kind: person, role: "Técnico de motores", rows: [["Dijo", "\"pasa todas\""]], clue: { find: "Percy", says: 0, saysLabel: "Fallas que dijo" } }
      - { name: Brayan, kind: person, role: "Practicante", culprit: true, rows: [["Dijo", "\"pasa todas\""]], clue: { find: "Brayan", says: 0, saysLabel: "Fallas que dijo" } }
      - { name: Rocío, kind: person, role: "Jefa de taller", rows: [["Dijo", "\"pasa todas\""]], clue: { find: "Rocío", says: 0, saysLabel: "Fallas que dijo" } }
      - { name: Las pruebas, kind: note, rows: [["[300, 200]", "2"], ["[300, 120]", "1"], ["[40, 500]", "0"], ["[150]", "2"], ["[50]", "1"], ["[ ] (sensor tapado)", "0"]] }
    caption: "**Cuadra**: su versión pasa las seis pruebas. Una versión que lanza un error en una prueba también falla esa prueba."
starter: |
  // La regla: manda la lectura más cercana (en cm).
  // Menos de 50 → 0 (frena). Menos de 150 → 1. Si no → 2. Sin lecturas → 0.
  const pruebas = [
    { lecturas: [300, 200], esperado: 2 },
    { lecturas: [300, 120], esperado: 1 },
    { lecturas: [40, 500], esperado: 0 },
    { lecturas: [150], esperado: 2 },
    { lecturas: [50], esperado: 1 },
    { lecturas: [], esperado: 0 },
  ];

  const versiones = {
    Yolanda: (lecturas) => {
      if (lecturas.length === 0) return 0;
      const cercana = Math.min(...lecturas);
      if (cercana < 50) return 0;
      if (cercana < 150) return 1;
      return 2;
    },
    Percy: (lecturas) => {
      const cercana = lecturas.reduce((menor, d) => Math.min(menor, d), Infinity);
      if (cercana === Infinity || cercana < 50) return 0;
      return cercana < 150 ? 1 : 2;
    },
    Brayan: (lecturas) => {
      const cercana = lecturas.reduce((menor, d) => Math.min(menor, d));
      if (cercana <= 50) return 0;
      return cercana < 150 ? 1 : 2;
    },
    Rocío: (lecturas) => {
      let cercana = Infinity;
      for (const d of lecturas) {
        if (d < cercana) cercana = d;
      }
      if (lecturas.length === 0) return 0;
      return cercana < 50 ? 0 : cercana < 150 ? 1 : 2;
    },
  };

  // Así se corre una versión con una prueba:
  const ejemplo = versiones.Yolanda([300, 200]);
  console.log("Una versión con [300, 200] da", ejemplo);

  // TODO: escribe contarFallas(version): recorre las pruebas y cuenta
  // las que dan otro resultado o lanzan un error (try/catch).

  // TODO: imprime una línea por técnico: Yolanda: 0 fallas
solution: |
  const pruebas = [
    { lecturas: [300, 200], esperado: 2 },
    { lecturas: [300, 120], esperado: 1 },
    { lecturas: [40, 500], esperado: 0 },
    { lecturas: [150], esperado: 2 },
    { lecturas: [50], esperado: 1 },
    { lecturas: [], esperado: 0 },
  ];

  const versiones = {
    Yolanda: (lecturas) => {
      if (lecturas.length === 0) return 0;
      const cercana = Math.min(...lecturas);
      if (cercana < 50) return 0;
      if (cercana < 150) return 1;
      return 2;
    },
    Percy: (lecturas) => {
      const cercana = lecturas.reduce((menor, d) => Math.min(menor, d), Infinity);
      if (cercana === Infinity || cercana < 50) return 0;
      return cercana < 150 ? 1 : 2;
    },
    Brayan: (lecturas) => {
      const cercana = lecturas.reduce((menor, d) => Math.min(menor, d));
      if (cercana <= 50) return 0;
      return cercana < 150 ? 1 : 2;
    },
    Rocío: (lecturas) => {
      let cercana = Infinity;
      for (const d of lecturas) {
        if (d < cercana) cercana = d;
      }
      if (lecturas.length === 0) return 0;
      return cercana < 50 ? 0 : cercana < 150 ? 1 : 2;
    },
  };

  function contarFallas(version) {
    let fallas = 0;
    for (const { lecturas, esperado } of pruebas) {
      try {
        if (version(lecturas) !== esperado) fallas++;
      } catch (error) {
        console.log(`  (lanzó ${error.name} con [${lecturas}])`);
        fallas++;
      }
    }
    return fallas;
  }

  for (const [tecnico, version] of Object.entries(versiones)) {
    console.log(`${tecnico}: ${contarFallas(version)} fallas`);
  }
answer: Brayan
answerLabel: ¿De quién era la versión que llegó a la plaza?
reveal: |
  La de Brayan: falla 2 de 6. Con la lista vacía, su `reduce` sin valor inicial lanza justo el `TypeError` de la plaza, y además frena con 50 cm cuando la regla dice "menos de 50". Brayan jura que lo probó; lo probó, pero solo con lecturas normales. Las pruebas de los bordes (lista vacía, el 50 exacto) son las que valen.
hints:
  - "Dentro de `contarFallas`, un `for...of` sobre `pruebas`. Envuelve la llamada `version(lecturas)` en un `try`: si lanza, el `catch` suma una falla."
  - "Para recorrer las versiones con su nombre: `for (const [tecnico, version] of Object.entries(versiones))`."
```

## El juez

```exercise
id: js15-juez-comandos
type: judge
mode: function
function: primerError
title: Revisar antes de salir
prompt: |
  Escribe `primerError(programa, bateria)`, que revisa un programa de comandos **antes** de que el robot se mueva y devuelve `[posición, código]` del primer comando con problemas, o `[-1, 0]` si todo está bien.

  El programa llega de la tablet de la municipalidad como una lista de textos. Los comandos válidos son:

  - `"L"` y `"R"`: girar. No gastan batería.
  - `"F"` seguido **solo de dígitos**, con un número de 1 a 9: avanzar esos pasos. Cada paso gasta 1 de batería.

  Los códigos de error:

  | código | cuándo | ejemplos |
  |---|---|---|
  | 1 | el comando no tiene el formato | `"X"`, `"F"`, `"F3x"`, `"f2"`, `"F-1"`, `""` |
  | 2 | es `F` con dígitos, pero el número no está entre 1 y 9 | `"F0"`, `"F10"`, `"F12"` |
  | 3 | es válido, pero con él los pasos acumulados superan la `bateria` | |

  Escribe también `revisarComando(comando)`, que devuelve los pasos de un comando (0 para `L` y `R`) o **lanza** un error propio (`class … extends Error`) con su código. `primerError` la usa dentro de un `try/catch`. El juez prueba `revisarComando` sola con comandos válidos.

  **Restricciones:** de 0 a 12 comandos · batería de 0 a 45.
visual:
  figure:
    title: El ejemplo 3, comando por comando
    input: { label: 'primerError(["F4", "R", "F2", "L", "F3"], 8)', cells: ["F4 → 4", "R → 4", "F2 → 6", "L → 6", "F3 → 9"], highlight: [4] }
    arrow: "cada casilla: comando → pasos acumulados. En la posición 4 son 9 > 8: código 3"
    output: { label: devuelve, value: "[4, 3]" }
starter: |
  function revisarComando(comando) {
  }

  function primerError(programa, bateria) {
  }
solution: |
  class ErrorDeComando extends Error {
    constructor(mensaje, codigo) {
      super(mensaje);
      this.name = "ErrorDeComando";
      this.codigo = codigo;
    }
  }

  function revisarComando(comando) {
    if (comando === "L" || comando === "R") return 0;
    if (!/^F\d+$/.test(comando)) throw new ErrorDeComando(`No entiendo "${comando}"`, 1);
    const pasos = Number(comando.slice(1));
    if (pasos < 1 || pasos > 9) throw new ErrorDeComando(`Fuera de rango: "${comando}"`, 2);
    return pasos;
  }

  function primerError(programa, bateria) {
    let usados = 0;
    for (const [i, comando] of programa.entries()) {
      try {
        usados += revisarComando(comando);
        if (usados > bateria) throw new ErrorDeComando(`Sin batería en "${comando}"`, 3);
      } catch (error) {
        if (error instanceof ErrorDeComando) return [i, error.codigo];
        throw error;
      }
    }
    return [-1, 0];
  }
hints:
  - "La expresión regular `/^F\\d+$/` dice \"una F y luego solo dígitos, nada más\". `Number(comando.slice(1))` da el número."
  - "En el `catch` de `primerError`, pregunta `error instanceof ErrorDeComando`: si es tuyo, devuelve `[i, error.codigo]`; si no, es un bug, y se vuelve a lanzar."
samples:
  - args: [["F3", "R", "F2", "L", "F4"], 20]
    returns: [-1, 0]
    note: Todo válido y alcanza la batería (9 pasos de 20).
  - args: [["F3", "R", "F0", "L", "F4"], 20]
    returns: [2, 2]
    note: "F0 tiene el formato, pero 0 pasos está fuera de rango."
  - args: [["F4", "R", "F2", "L", "F3"], 8]
    returns: [4, 3]
  - fn: revisarComando
    args: ["F7"]
    returns: 7
edge:
  - args: [[], 0]
    tag: con un programa vacío
  - args: [["X"], 10]
    tag: con un comando desconocido
  - args: [["F9"], 9]
    tag: con la batería justa
  - args: [["F1"], 0]
    tag: con la batería en cero
  - args: [["L", "R", "L"], 0]
    tag: con solo giros y sin batería
  - args: [["F3x"], 10]
    tag: con letras después del número
  - args: [["f2"], 10]
    tag: con la f en minúscula
  - args: [["F10", "F2"], 20]
    tag: con un 10
  - args: [["F-1"], 10]
    tag: con un número negativo
  - args: [["F2", ""], 10]
    tag: con un comando vacío
  - args: [["F2", "F"], 10]
    tag: con una F sola
  - fn: revisarComando
    args: ["L"]
    tag: en revisarComando, con un giro
random:
  count: 50
  seed: 15
  generate: |
    const good = ["L", "R", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"];
    const bad = ["F0", "F10", "F12", "X", "F", "F3x", "f2", "F-1", "", "F 3", "FF2"];
    const n = rng.int(0, 12);
    const program = Array.from({ length: n }, () => (rng.next() < 0.12 ? rng.pick(bad) : rng.pick(good)));
    return [program, rng.int(0, 45)];
wrong:
  - |
    class ErrorDeComando extends Error {
      constructor(mensaje, codigo) {
        super(mensaje);
        this.codigo = codigo;
      }
    }
    function revisarComando(comando) {
      if (comando === "L" || comando === "R") return 0;
      if (!/^F\d+$/.test(comando)) throw new ErrorDeComando("formato", 1);
      const pasos = Number(comando.slice(1));
      if (pasos < 1 || pasos > 10) throw new ErrorDeComando("rango", 2);
      return pasos;
    }
    function primerError(programa, bateria) {
      let usados = 0;
      for (const [i, comando] of programa.entries()) {
        try {
          usados += revisarComando(comando);
          if (usados > bateria) throw new ErrorDeComando("batería", 3);
        } catch (error) {
          return [i, error.codigo];
        }
      }
      return [-1, 0];
    }
  - |
    class ErrorDeComando extends Error {
      constructor(mensaje, codigo) {
        super(mensaje);
        this.codigo = codigo;
      }
    }
    function revisarComando(comando) {
      if (comando === "L" || comando === "R") return 0;
      const pasos = parseInt(comando.slice(1));
      if (comando[0] !== "F" || Number.isNaN(pasos)) throw new ErrorDeComando("formato", 1);
      if (pasos < 1 || pasos > 9) throw new ErrorDeComando("rango", 2);
      return pasos;
    }
    function primerError(programa, bateria) {
      let usados = 0;
      for (const [i, comando] of programa.entries()) {
        try {
          usados += revisarComando(comando);
          if (usados > bateria) throw new ErrorDeComando("batería", 3);
        } catch (error) {
          return [i, error.codigo];
        }
      }
      return [-1, 0];
    }
  - |
    class ErrorDeComando extends Error {
      constructor(mensaje, codigo) {
        super(mensaje);
        this.codigo = codigo;
      }
    }
    function revisarComando(comando) {
      if (comando === "L" || comando === "R") return 0;
      if (!/^F\d+$/.test(comando)) throw new ErrorDeComando("formato", 1);
      const pasos = Number(comando.slice(1));
      if (pasos < 1 || pasos > 9) throw new ErrorDeComando("rango", 2);
      return pasos;
    }
    function primerError(programa, bateria) {
      let usados = 0;
      for (const [i, comando] of programa.entries()) {
        try {
          usados += revisarComando(comando);
          if (usados >= bateria) throw new ErrorDeComando("batería", 3);
        } catch (error) {
          return [i, error.codigo];
        }
      }
      return [-1, 0];
    }
  - |
    function revisarComando(comando) {
      if (comando === "L" || comando === "R") return 0;
      if (!/^F\d+$/.test(comando)) throw new Error("formato");
      const pasos = Number(comando.slice(1));
      if (pasos < 1 || pasos > 9) throw new Error("rango");
      return pasos;
    }
    function primerError(programa, bateria) {
      let usados = 0;
      for (const comando of programa) usados += revisarComando(comando);
      return usados > bateria ? [programa.length - 1, 3] : [-1, 0];
    }
tests:
  - name: crea su propio error con extends Error
    source: 'class\s+\w+\s+extends\s+Error'
    msg: Crea un error propio, por ejemplo class ErrorDeComando extends Error.
  - name: usa try/catch
    source: '\bcatch\b'
```

## Misión final

```exercise
id: js15-mision-yanahuara
type: mission
title: Revancha en Yanahuara
prompt: |
  Revisa el `programa` completo **antes** de mover a Chasqui; si está bien, ejecútalo y entrega el queso helado, y si no, que Chasqui diga el error sin moverse. Pase lo que pase, al final dice `"¡Gracias, Arequipa!"`.

  Chasqui está en la entrada del mirador mirando al este. `programa` llega de la tablet, con los comandos del juez: `"L"`, `"R"` y `"F1"`…`"F9"`.

  - Usa las mismas reglas del juez, con la batería del robot: `robot.bateria`.
  - Si algo está mal: `robot.decir(error.message)`, y el mensaje debe **nombrar el comando** que falló (por ejemplo `Fuera de rango: "F0"`).
  - Si todo está bien: `L` → `robot.girarIzquierda()`, `R` → `robot.girarDerecha()`, `Fn` → `robot.avanzar(n)`, y al final `robot.entregar("Queso helado")`.
  - El último globo, siempre: `robot.decir("¡Gracias, Arequipa!")`. Para eso existe `finally`.

  El programa, el mapa y la batería cambian en cada prueba.
visual:
  figure:
    title: Revisar primero, moverse después
    panes:
      - { label: "programa con error (el F0 está fuera de rango)", cells: ["F4", "R", "F2", "F0", "L", "F3"], highlight: [3] }
      - { label: "entonces Chasqui", cards: [{ title: "no se mueve", rows: [["dice", "Fuera de rango: \"F0\""], ["y al final", "¡Gracias, Arequipa!"]] }] }
starter: |
  // programa llega de la tablet, por ejemplo: ["F4", "R", "F2", "L", "F3"]

  class ErrorDeComando extends Error {
    constructor(mensaje, codigo) {
      super(mensaje);
      this.name = "ErrorDeComando";
      this.codigo = codigo;
    }
  }

  // TODO: revisarComando(comando): devuelve los pasos (0 para L y R) o lanza un ErrorDeComando

  // TODO: try: revisa todo el programa (y la batería) antes de mover una rueda;
  //       luego ejecútalo y entrega "Queso helado".
  //       catch: robot.decir(error.message)
  //       finally: robot.decir("¡Gracias, Arequipa!")
solution: |
  class ErrorDeComando extends Error {
    constructor(mensaje, codigo) {
      super(mensaje);
      this.name = "ErrorDeComando";
      this.codigo = codigo;
    }
  }

  function revisarComando(comando) {
    if (comando === "L" || comando === "R") return 0;
    if (!/^F\d+$/.test(comando)) throw new ErrorDeComando(`No entiendo "${comando}"`, 1);
    const pasos = Number(comando.slice(1));
    if (pasos < 1 || pasos > 9) throw new ErrorDeComando(`Fuera de rango: "${comando}"`, 2);
    return pasos;
  }

  function revisarPrograma(programa, bateria) {
    let usados = 0;
    for (const comando of programa) {
      usados += revisarComando(comando);
      if (usados > bateria) throw new ErrorDeComando(`Sin batería en "${comando}"`, 3);
    }
  }

  try {
    revisarPrograma(programa, robot.bateria);
    for (const comando of programa) {
      if (comando === "L") robot.girarIzquierda();
      else if (comando === "R") robot.girarDerecha();
      else robot.avanzar(revisarComando(comando));
    }
    robot.entregar("Queso helado");
  } catch (error) {
    if (!(error instanceof ErrorDeComando)) throw error;
    robot.decir(error.message);
  } finally {
    robot.decir("¡Gracias, Arequipa!");
  }
hints:
  - "Separa en dos vueltas: la primera solo revisa (y lanza si algo está mal); la segunda mueve. Así un error nunca deja al robot a medio camino."
  - "Pon las dos vueltas y la entrega dentro de un `try`; el `catch` dice `error.message` y el `finally` da las gracias."
world:
  theme: barranco
  level: 4
  dir: E
  battery: 20
  map: |
    ##########
    #R....#..#
    #####.#..#
    #####...D#
    ##########
globals:
  programa: ["F4", "R", "F2", "L", "F3"]
scenarios:
  - tests:
      - name: entrega el queso helado
        state: 'w.atGoal && w.delivered.includes("Queso helado")'
  - globals: { programa: ["F4", "R", "F2", "F0", "L", "F3"] }
    tests:
      - name: con F0, no se mueve
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
        msg: Si el programa tiene un error, Chasqui no debe dar ni un paso.
      - name: dice qué comando falló
        state: 'w.said.some((t) => t.includes("F0"))'
        msg: 'El mensaje del error debe nombrar el comando, por ejemplo: Fuera de rango "F0".'
  - world: { battery: 8 }
    tests:
      - name: sin batería suficiente, no sale
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
        msg: Con 8 de batería no alcanza para 9 pasos; hay que darse cuenta antes de salir.
      - name: dice en qué comando se acaba la batería
        state: 'w.said.some((t) => t.includes("F3"))'
  - map: |
      #########
      #R..#...#
      ###.#.#.#
      ###...#D#
      #########
    globals: { programa: ["F2", "R", "F2", "L", "F2", "L", "F2", "R", "F2", "R", "F2"] }
    tests:
      - name: en otro mapa, también entrega
        state: 'w.atGoal && w.delivered.includes("Queso helado")'
  - globals: { programa: ["F4", "R", "F2", "L", "F3x"] }
    tests:
      - name: con F3x, no se mueve
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
      - name: dice qué comando falló
        state: 'w.said.some((t) => t.includes("F3x"))'
tests:
  - name: el último globo es el agradecimiento
    state: 'w.said.at(-1) === "¡Gracias, Arequipa!"'
    msg: Pase lo que pase, lo último que dice Chasqui es "¡Gracias, Arequipa!". Usa finally.
  - name: sin chocar
    state: '!w.crashed'
  - name: usa try, catch y finally
    source: '\btry\b[\s\S]*\bcatch\b[\s\S]*\bfinally\b'
  - name: lanza sus propios errores
    source: 'throw\s+new\s+ErrorDeComando'
```

## Reto experto

```exercise
id: js15-reto-lanza
type: challenge
title: Probar que algo falla
prompt: |
  Una buena batería de pruebas también comprueba que el código **falle bien**. Escribe `afirmarLanza(fn, Clase)`: llama a `fn`; si lanza un error de esa clase, lo devuelve. Si no lanza nada, lanza un `Error` con el mensaje `"No lanzó nada"`. Si lanza otro tipo de error, lanza un `Error` con el mensaje `"Lanzó X, se esperaba Y"` (los `name` de cada uno).
starter: |
  function afirmarLanza(fn, Clase) {
  }

  const error = afirmarLanza(() => { throw new RangeError("F0"); }, RangeError);
  console.log(error.message);
solution: |
  function afirmarLanza(fn, Clase) {
    try {
      fn();
    } catch (error) {
      if (error instanceof Clase) return error;
      throw new Error(`Lanzó ${error.name}, se esperaba ${Clase.name}`);
    }
    throw new Error("No lanzó nada");
  }

  const error = afirmarLanza(() => { throw new RangeError("F0"); }, RangeError);
  console.log(error.message);
hints:
  - "El `throw` de \"No lanzó nada\" va **después** del `try/catch`: si estuviera dentro del `try`, tu propio `catch` lo atraparía."
tests:
  - name: devuelve el error esperado
    run: 'afirmarLanza(() => { throw new RangeError("F0"); }, RangeError).message'
    equals: F0
  - name: acepta subclases (un TypeError es un Error)
    run: 'afirmarLanza(() => null.x, Error).name'
    equals: TypeError
  - name: si no lanza nada, avisa
    run: '(() => { try { afirmarLanza(() => 1, Error); return "calló"; } catch (e) { return e.message; } })()'
    equals: No lanzó nada
  - name: si lanza otro tipo, avisa
    run: '(() => { try { afirmarLanza(() => { throw new TypeError("x"); }, RangeError); return "calló"; } catch (e) { return e.message; } })()'
    equals: Lanzó TypeError, se esperaba RangeError
```
