# Sesión 8 — Textos

## El encargo

Muelle de pescadores de Chucuito, en el Callao, cinco de la mañana. Don Eusebio Chumpitaz lleva cuarenta años en la radio del muelle: los botes le avisan por dónde andan, qué pescaron y a qué hora vuelven, y él lo apunta en una pizarra. Esta semana la radio vieja empezó a meter estática: los mensajes llegan con `~` por todas partes, con espacios de sobra y mitad en mayúsculas, mitad en minúsculas. Y Don Eusebio no encuentra sus lentes desde el martes.

Loop le prestó a Chasqui. Lo que llega por la radio es **texto**, y hoy Chasqui aprende a limpiarlo, cortarlo, buscar dentro de él y armar uno nuevo. Al final llevará él mismo las órdenes de la radio hasta el muelle.

```escena
theme: barranco
level: 4
dir: E
caption: Chucuito al amanecer. La radio dice "av-4 / der / av-2 / izq / av-3 / entrega" y Chasqui lleva el mensaje hasta el buzón del muelle (D).
map: |
  ###########
  #R....#####
  #####.#####
  #####...D##
  ###########
program: |
  robot.avanzar(4);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(3);
  robot.entregar("VIRGEN DEL CARMEN");
```

## Lo mínimo

Un texto (en inglés, *string*) es una fila de caracteres. Como un array, tiene `length` y se lee por posición desde **0**. Sus métodos **no lo cambian**: devuelven un texto nuevo.

```js run
const llegada = "  mayday~ VIRGEN del carmen~  ";
const limpio = llegada.replaceAll("~", "").trim().toUpperCase();
console.log(limpio);
console.log(limpio.length, limpio[0], limpio.includes("CARMEN"));
console.log(`Llegó a las ${String(7).padStart(2, "0")}:05`);
```

Mira cómo Chasqui lee una orden de la radio: la parte en trozos con `split`, revisa con qué empieza cada trozo y saca el número con `slice`.

```anima
title: Partir un mensaje y leer cada trozo
code: |
  const mensaje = "av-3/der/AV-2";
  const partes = mensaje.split("/");
  let pasos = 0;
  for (const parte of partes) {
    const orden = parte.toUpperCase();
    if (orden.startsWith("AV")) {
      pasos += Number(orden.slice(3));
    }
  }
  console.log(pasos);
cells: { of: partes, at: parte }
notes:
  2: "split corta el texto en cada / y devuelve un array de textos."
  5: "toUpperCase devuelve una copia en mayúsculas: av-3 y AV-3 se leen igual."
  6: "startsWith pregunta con qué empieza. der no empieza con AV, así que no suma."
  7: "slice(3) es el texto desde la posición 3 hasta el final: \"3\". Number lo vuelve número."
```

- **Leer**: `texto.length`, `texto[0]`, `texto.at(-1)` (el último).
- **Cortar**: `texto.slice(inicio, fin)` va desde `inicio` hasta *antes* de `fin`; sin `fin`, hasta el final; con negativos, cuenta desde atrás: `"MAYDAY".slice(-3)` es `"DAY"`.
- **Partir y unir**: `"a/b/c".split("/")` da `["a", "b", "c"]`; `partes.join(" ")` hace lo contrario.
- **Limpiar**: `trim()` quita los espacios de los extremos (no los de adentro); `replaceAll("~", "")` cambia todas las apariciones; `toUpperCase()` y `toLowerCase()`.
- **Preguntar**: `includes("x")`, `startsWith("x")`, `endsWith("x")` devuelven `true` o `false`.
- **Rellenar**: `"7".padStart(2, "0")` da `"07"`. Ideal para horas y códigos.
- **Armar**: las *template literals* (`` `Bote ${nombre}: ${cajas} cajas` ``) aceptan cualquier expresión dentro de `${ }`.

Para patrones que un texto fijo no alcanza, JavaScript tiene **expresiones regulares**, escritas entre barras. Tres que vas a usar mucho: `/\d+/g` (cada grupo de dígitos), `/\s+/` (uno o más espacios) y `/^SOS/i` (empieza con SOS, sin importar mayúsculas).

```js run
const parte = "rumbo 270,   a 12 nudos";
console.log(parte.match(/\d+/g));
console.log(parte.split(/\s+/).length);
console.log(/^sos/i.test("SOS en la isla"));
```

> **Trampa común:** `mensaje.toUpperCase();` solo en una línea no hace nada. Los textos no se modifican: el método devuelve uno nuevo y, si no lo guardas (`mensaje = mensaje.toUpperCase()` o en otra variable), se pierde.

<!-- legacy: string-includes -->

<!-- legacy: string-replaceall -->

<!-- legacy: string-padstart -->

<!-- legacy: string-slice -->

<!-- mdn: strings template-literals string-slice string-includes string-replaceall string-padstart regexp -->

## Práctica

```exercise
id: js8-predice-inmutable
type: predict
title: Las mayúsculas que no llegaron
prompt: |
  ¿Qué imprime?
code: |
  let bote = "virgen del carmen";
  bote.toUpperCase();
  console.log(bote);
  bote = bote.toUpperCase();
  console.log(bote.slice(0, 6));
options:
  - "VIRGEN DEL CARMEN\nVIRGEN"
  - "virgen del carmen\nVIRGEN"
  - "virgen del carmen\nvirgen"
  - "virgen del carmen\nVIRGEN "
answer: "virgen del carmen\nVIRGEN"
explain: |
  La línea 2 calcula el texto en mayúsculas y lo bota: `bote` sigue igual. En la línea 4 sí se guarda. `slice(0, 6)` toma las posiciones 0 a 5: `"VIRGEN"`, sin el espacio de la posición 6.
```

```exercise
id: js8-predice-split
type: predict
title: El espacio que se coló
prompt: |
  ¿Qué imprime? Los corchetes del `console.log` están para que veas los espacios.
code: |
  const partes = "  AV-3 / DER ".trim().split("/");
  console.log(partes.length);
  console.log(`[${partes[1]}]`);
options:
  - "2\n[DER]"
  - "2\n[ DER]"
  - "3\n[ DER ]"
  - "2\n[ DER ]"
answer: "2\n[ DER]"
explain: |
  `trim` quitó los espacios de los **extremos** del texto entero, no los que rodean a la `/`. Así que el segundo trozo es `" DER"`, con un espacio delante. Por eso, después de partir, se hace `trim()` a cada trozo.
```

```exercise
id: js8-completa-pizarra
type: complete
title: Una línea para la pizarra
prompt: |
  La radio dice `"virgen del carmen;  isla san lorenzo ;7"`: bote, lugar y hora, separados por `;`. Completa para que imprima la línea de la pizarra:

  `07 | VIRGEN DEL CARMEN | ISLA SAN LORENZO`
visual:
  figure:
    input: { label: radio, value: "\"virgen del carmen;  isla san lorenzo ;7\"" }
    arrow: split, trim, toUpperCase, padStart
    output: { label: pizarra, value: "07 | VIRGEN DEL CARMEN | ISLA SAN LORENZO" }
starter: |
  const radio = "virgen del carmen;  isla san lorenzo ;7";
  const partes = radio.___(";");
  const bote = partes[0].trim().toUpperCase();
  const lugar = partes[1].___().toUpperCase();
  const hora = partes[2].___(2, "0");
  console.log(`${hora} | ${bote} | ${___}`);
solution: |
  const radio = "virgen del carmen;  isla san lorenzo ;7";
  const partes = radio.split(";");
  const bote = partes[0].trim().toUpperCase();
  const lugar = partes[1].trim().toUpperCase();
  const hora = partes[2].padStart(2, "0");
  console.log(`${hora} | ${bote} | ${lugar}`);
hints:
  - El primer hueco parte el texto; el segundo quita los espacios de los extremos.
  - "`padStart(2, \"0\")` rellena con ceros por la izquierda hasta tener 2 caracteres."
tests:
  - name: la línea de la pizarra
    output: "07 | VIRGEN DEL CARMEN | ISLA SAN LORENZO"
```

```exercise
id: js8-arregla-estatica
type: fix
title: La estática que no se iba
prompt: |
  Este código debía quitar toda la estática (`~`) del mensaje, pero en la pizarra todavía aparecen. ¿Qué falta?
starter: |
  const mensaje = "Niebla~ cerrada~ en la~ isla";
  const limpio = mensaje.replace("~", "");
  console.log(limpio);
solution: |
  const mensaje = "Niebla~ cerrada~ en la~ isla";
  const limpio = mensaje.replaceAll("~", "");
  console.log(limpio);
hints:
  - "`replace` con un texto cambia solo la **primera** aparición. Hay un método que las cambia todas."
tests:
  - name: sin estática
    output: Niebla cerrada en la isla
```

```exercise
id: js8-escribe-socorro
type: write
title: ¿Es un pedido de auxilio?
prompt: |
  Escribe `esSocorro(mensaje)`, que devuelve `true` si el mensaje es de auxilio y `false` si no.

  Es de auxilio si **contiene** la palabra `mayday` o si **empieza** con `sos`, escritas en mayúsculas o minúsculas, y sin contar los espacios de los extremos.
visual:
  figure:
    panes:
      - { table: { head: ["mensaje", "esSocorro"], rows: [["\"Mayday, motor apagado\"", "true"], ["\"  sos en la isla\"", "true"], ["\"Todo bien, sin sos ni nada\"", "false"], ["\"Volvemos a las 7\"", "false"]] } }
starter: |
  function esSocorro(mensaje) {
  }

  console.log(esSocorro("Mayday, motor apagado"));
solution: |
  function esSocorro(mensaje) {
    const texto = mensaje.trim().toLowerCase();
    return texto.includes("mayday") || texto.startsWith("sos");
  }

  console.log(esSocorro("Mayday, motor apagado"));
hints:
  - Primero normaliza una sola vez, en una variable: sin espacios en los extremos y todo en minúsculas.
  - "Luego `includes` para mayday y `startsWith` para sos, unidos con `||`."
tests:
  - name: Mayday al inicio
    run: 'esSocorro("Mayday, motor apagado")'
    equals: true
  - name: mayday en medio y en mayúsculas
    run: 'esSocorro("Aquí el Don Lucho: MAYDAY MAYDAY")'
    equals: true
  - name: sos con espacios delante
    run: 'esSocorro("   sos en la isla")'
    equals: true
  - name: sos que no está al inicio
    run: 'esSocorro("Todo bien, sin sos ni nada")'
    equals: false
  - name: un mensaje tranquilo
    run: 'esSocorro("Volvemos a las 7")'
    equals: false
```

```exercise
id: js8-escribe-numeros
type: write
title: Los números del parte
prompt: |
  Escribe `numerosDe(texto)`, que devuelve un array con todos los números que aparecen en el texto, ya convertidos a número. Si no hay ninguno, devuelve `[]`.

  Usa la expresión regular `/\d+/g`: `texto.match(/\d+/g)` devuelve los grupos de dígitos como textos, o `null` si no hay ninguno.
visual:
  figure:
    input: { label: texto, value: "\"Rumbo 270, a 12 nudos, 3 tripulantes\"" }
    arrow: match(/\d+/g), luego a número
    output: { label: devuelve, cells: [270, 12, 3] }
starter: |
  function numerosDe(texto) {
  }

  console.log(numerosDe("Rumbo 270, a 12 nudos, 3 tripulantes"));
solution: |
  function numerosDe(texto) {
    const grupos = texto.match(/\d+/g) ?? [];
    return grupos.map(Number);
  }

  console.log(numerosDe("Rumbo 270, a 12 nudos, 3 tripulantes"));
hints:
  - "`?? []` cambia el `null` por un array vacío."
  - "`grupos.map(Number)` convierte cada texto en número."
tests:
  - name: tres números
    run: 'numerosDe("Rumbo 270, a 12 nudos, 3 tripulantes")'
    equals: [270, 12, 3]
  - name: sin números
    run: 'numerosDe("Niebla cerrada")'
    equals: []
  - name: números pegados a letras
    run: 'numerosDe("ancla2 y bote14")'
    equals: [2, 14]
  - name: usa una expresión regular
    source: '/\\d\+?/'
    msg: Usa la expresión regular /\d+/g.
```

## El caso

```exercise
id: js8-caso-radio
type: case
title: El mensaje que alguien tocó
prompt: |
  Limpia cada transmisión, mide cuántos caracteres tiene el mensaje y compáralo con el largo que declaró el bote.

  En la radio del Callao, cada bote termina su transmisión con el largo de su mensaje, para que el muelle sepa si llegó completo. Una transmisión tiene tres partes separadas por `|`: el **bote**, el **mensaje** y el **largo declarado**. El largo cuenta el mensaje **sin la estática** (`~`) y **sin los espacios de los extremos**.

  Anoche, alguien interceptó un mensaje y lo cambió para mandar a los demás botes lejos del cardumen. ¿Qué bote envió el mensaje alterado?

  Imprime una línea por bote, con su nombre en mayúsculas y el largo real al final: `VIRGEN DEL CARMEN: 36`. El tablero lo compara con lo que declaró.
visual:
  - figure:
      title: Una transmisión, desarmada
      input: { label: "transmisiones[0]", text: "~ virgen del CARMEN~ |  Cardumen de~ bonito frente a~ La Punta ~|36" }
      arrow: split("|"), sin ~, trim
      output:
        label: sus tres partes
        table:
          head: ["parte", "limpia", "largo"]
          rows: [["bote", "VIRGEN DEL CARMEN", ""], ["mensaje", "Cardumen de bonito frente a La Punta", "**36**"], ["declarado", "36", ""]]
  - board:
      for: js8-caso-radio
      title: Lo que declaró cada bote
      task: Mide el mensaje limpio de cada bote y compáralo con su largo declarado.
      cards:
        - { name: "Virgen del Carmen", kind: person, role: "Declaró 36", clue: { find: "VIRGEN DEL CARMEN", says: 36, saysLabel: "Declaró" } }
        - { name: "Don Lucho", kind: person, role: "Declaró 31", clue: { find: "DON LUCHO", says: 31, saysLabel: "Declaró" } }
        - { name: "Santa Rosita", kind: person, role: "Declaró 37", clue: { find: "SANTA ROSITA", says: 37, saysLabel: "Declaró" } }
        - { name: "Mi Chabelita", kind: person, role: "Declaró 34", culprit: true, clue: { find: "MI CHABELITA", says: 34, saysLabel: "Declaró" } }
        - { name: "Señor de Luren", kind: person, role: "Declaró 32", clue: { find: "SEÑOR DE LUREN", says: 32, saysLabel: "Declaró" } }
        - { name: "Doña Pochita", kind: person, role: "Declaró 38", clue: { find: "DOÑA POCHITA", says: 38, saysLabel: "Declaró" } }
        - { name: "El Bravo", kind: person, role: "Declaró 27", clue: { find: "EL BRAVO", says: 27, saysLabel: "Declaró" } }
      caption: "**Cuadra**: el mensaje llegó entero. Si no cuadra, alguien le metió mano en el camino."
starter: |
  const transmisiones = [
    "~ virgen del CARMEN~ |  Cardumen de~ bonito frente a~ La Punta ~|36",
    "  don LUCHO~|  Volvemos al muelle~ con 40 cajas ~|31",
    "~santa rosita  |  Niebla~ cerrada en la isla~ San Lorenzo ~|37",
    " MI chabelita~ |  Anchoveta~ abundante cerca de~ Pucusana~ y Cerro Azul ~|34",
    "~~señor de LUREN |  Motor~ fallando, pedimos~ remolque ~|32",
    " doña POCHITA~|  Todo tranquilo~, regresamos~ al amanecer ~|38",
    "el BRAVO~ |  Red~ rota, volvemos~ temprano ~|27",
  ];

  // Así se parte una transmisión en sus tres trozos:
  const trozos = transmisiones[0].split("|");
  console.log("Trozos de la primera:", trozos.length);

  // TODO: para cada transmisión, limpia el bote y el mensaje (sin ~ y sin espacios
  // en los extremos) y mide el mensaje con length.
  // Imprime una línea por bote, así: VIRGEN DEL CARMEN: 36
solution: |
  const transmisiones = [
    "~ virgen del CARMEN~ |  Cardumen de~ bonito frente a~ La Punta ~|36",
    "  don LUCHO~|  Volvemos al muelle~ con 40 cajas ~|31",
    "~santa rosita  |  Niebla~ cerrada en la isla~ San Lorenzo ~|37",
    " MI chabelita~ |  Anchoveta~ abundante cerca de~ Pucusana~ y Cerro Azul ~|34",
    "~~señor de LUREN |  Motor~ fallando, pedimos~ remolque ~|32",
    " doña POCHITA~|  Todo tranquilo~, regresamos~ al amanecer ~|38",
    "el BRAVO~ |  Red~ rota, volvemos~ temprano ~|27",
  ];

  const limpiar = (texto) => texto.replaceAll("~", "").trim();

  for (const transmision of transmisiones) {
    const [bote, mensaje, declarado] = transmision.split("|");
    const largo = limpiar(mensaje).length;
    const marca = largo === Number(declarado) ? "" : "  <- no cuadra, declaró " + declarado;
    console.log(`${limpiar(bote).toUpperCase()}: ${largo}${marca}`);
  }
answer: MI CHABELITA
answerLabel: ¿Qué bote envió el mensaje alterado?
reveal: |
  El Mi Chabelita declaró 34 caracteres, pero su mensaje limpio tiene 50. Su original decía "Anchoveta abundante cerca de Ancón" (34): alguien cambió Ancón por "Pucusana y Cerro Azul" para mandar a los demás botes al sur, lejos del cardumen.
hints:
  - "Desestructura los tres trozos: `const [bote, mensaje, declarado] = transmision.split(\"|\");`"
  - "Primero `replaceAll(\"~\", \"\")` y después `trim()`: la estática también puede estar en los extremos."
```

## El juez

Dos problemas: el primero lee la entrada línea por línea con `leerLinea()` e imprime, como en las sesiones 1 a 3; el segundo es una función, como en la sesión 4.

```exercise
id: js8-juez-pizarra
type: judge
title: La pizarra de llegadas
prompt: |
  Imprime cada llegada en el formato de la pizarra: `HH:MM NOMBRE`, con la hora en dos dígitos y el nombre del bote en mayúsculas, con un solo espacio entre palabras.

  Don Eusebio dicta las llegadas por la radio como le sale: `7:5   virgen del CARMEN`. La pizarra del muelle, en cambio, es estricta: `07:05 VIRGEN DEL CARMEN`.

  **Entrada:** una línea con `N`, el número de llegadas. Luego `N` líneas, cada una con una hora `H:M` (sin ceros a la izquierda) y el nombre del bote. Puede haber espacios de más al inicio, al final y entre las palabras.

  **Salida:** `N` líneas en el mismo orden, cada una `HH:MM NOMBRE`.

  **Restricciones:** 0 ≤ N ≤ 200 · 0 ≤ H ≤ 23 · 0 ≤ M ≤ 59 · nombres de 1 a 4 palabras, solo letras.
visual:
  figure:
    title: El ejemplo 1, línea por línea
    panes:
      - { table: { head: ["", "entrada (· es un espacio)", "salida"], rows: [["1", "`7:5···virgen·del·CARMEN`", "`07:05 VIRGEN DEL CARMEN`"], ["2", "`13:40·don·lucho`", "`13:40 DON LUCHO`"], ["3", "`··9:0··santa···rosita·`", "`09:00 SANTA ROSITA`"]] } }
    caption: "La hora va con `padStart`, el nombre con `toUpperCase` y los espacios repetidos desaparecen al partir con `/\\s+/`."
starter: |
  const n = leerNumero();
  for (let i = 0; i < n; i++) {
    const linea = leerLinea();
    console.log(linea);
  }
solution: |
  const n = leerNumero();
  for (let i = 0; i < n; i++) {
    const [hora, ...palabras] = leerLinea().trim().split(/\s+/);
    const [h, m] = hora.split(":");
    const nombre = palabras.join(" ").toUpperCase();
    console.log(`${h.padStart(2, "0")}:${m.padStart(2, "0")} ${nombre}`);
  }
hints:
  - "`linea.trim().split(/\\s+/)` deja las palabras sin espacios vacíos de por medio; la primera es la hora."
  - "`const [hora, ...palabras] = …` separa la hora del resto, y `palabras.join(\" \")` vuelve a armar el nombre."
samples:
  - input: "3\n7:5   virgen del CARMEN\n13:40 don lucho\n  9:0  santa   rosita "
    output: "07:05 VIRGEN DEL CARMEN\n13:40 DON LUCHO\n09:00 SANTA ROSITA"
  - input: "1\n0:0 bravo"
    output: "00:00 BRAVO"
    note: Medianoche, y un nombre de una sola palabra.
edge:
  - input: "0\n"
    tag: sin ninguna llegada
  - input: "2\n23:59 MI CHABELITA\n12:30 Don Lucho"
    tag: con horas que ya tienen dos dígitos
  - input: "1\n   5:7       el      bravo     "
    tag: con muchos espacios por todas partes
  - input: "1\n10:3 dona pochita"
    tag: con minutos de un dígito
random:
  count: 30
  seed: 88
  generate: |
    const palabras = ["virgen", "del", "carmen", "don", "lucho", "santa", "rosita", "mi", "chabelita", "bravo", "senor", "luren", "dona", "pochita", "gaviota", "pelicano", "estrella", "callao"];
    const caso = (p) => [...p].map((c) => (rng.next() < 0.5 ? c.toUpperCase() : c)).join("");
    const esp = () => " ".repeat(rng.int(1, 3));
    const n = rng.int(1, 200);
    const lineas = [];
    for (let i = 0; i < n; i++) {
      const nombre = Array.from({ length: rng.int(1, 4) }, () => caso(rng.pick(palabras))).join(esp());
      lineas.push(`${" ".repeat(rng.int(0, 2))}${rng.int(0, 23)}:${rng.int(0, 59)}${esp()}${nombre}${" ".repeat(rng.int(0, 2))}`);
    }
    return `${n}\n${lineas.join("\n")}`;
wrong:
  - |
    const n = leerNumero();
    for (let i = 0; i < n; i++) {
      const [hora, ...palabras] = leerLinea().trim().split(" ");
      const [h, m] = hora.split(":");
      console.log(`${h.padStart(2, "0")}:${m.padStart(2, "0")} ${palabras.join(" ").toUpperCase()}`);
    }
  - |
    const n = leerNumero();
    for (let i = 0; i < n; i++) {
      const [hora, ...palabras] = leerLinea().trim().split(/\s+/);
      const [h, m] = hora.split(":");
      console.log(`${h.padStart(2, "0")}:${m} ${palabras.join(" ").toUpperCase()}`);
    }
  - |
    const n = leerNumero();
    for (let i = 0; i < n; i++) {
      const [hora, ...palabras] = leerLinea().split(/\s+/);
      const [h, m] = hora.split(":");
      console.log(`${h.padStart(2, "0")}:${m.padStart(2, "0")} ${palabras.join(" ").toUpperCase()}`);
    }
```

```exercise
id: js8-juez-deletreo
type: judge
mode: function
function: deletreo
title: El deletreo de la radio
prompt: |
  Escribe `deletreo(mensaje)`, que devuelve el texto que el bote deletreó: la primera letra de cada palabra, en mayúsculas.

  Con estática, una palabra suelta no se entiende, así que en el mar se deletrea con el alfabeto fonético: `charlie alfa lima lima alfa oscar` es `CALLAO`. La palabra `stop` (en mayúsculas o minúsculas) no es una letra: es un **espacio**.

  **Entrada:** `mensaje`, palabras separadas por uno o más espacios, con posibles espacios en los extremos y mayúsculas y minúsculas mezcladas.

  **Salida:** el texto deletreado.

  **Restricciones:** hasta 300 palabras · `stop` nunca es la primera ni la última palabra ni va dos veces seguidas · un mensaje vacío o solo con espacios devuelve `""`.
visual:
  figure:
    title: El ejemplo 1, palabra por palabra
    panes:
      - { table: { head: ["palabra", "da"], rows: [["lima", "L"], ["INDIA", "I"], ["Stop", "(espacio)"], ["sierra", "S"], ["uniform", "U"], ["romeo", "R"]] } }
      - { label: devuelve, value: "\"LI SUR\"" }
starter: |
  function deletreo(mensaje) {
    return mensaje;
  }
solution: |
  function deletreo(mensaje) {
    const limpio = mensaje.trim();
    if (limpio === "") {
      return "";
    }
    let resultado = "";
    for (const palabra of limpio.split(/\s+/)) {
      resultado += palabra.toLowerCase() === "stop" ? " " : palabra[0].toUpperCase();
    }
    return resultado;
  }
hints:
  - "Parte con `/\\s+/` después de `trim()`, así no aparecen palabras vacías."
  - "Compara `palabra.toLowerCase() === \"stop\"` para que `STOP`, `Stop` y `stop` cuenten igual."
samples:
  - args: ["lima INDIA Stop sierra uniform romeo"]
    returns: "LI SUR"
    note: "`Stop` es un espacio, y las mayúsculas no importan: INDIA da I igual que india."
  - args: ["  charlie   alfa lima LIMA alfa oscar "]
    returns: "CALLAO"
    note: Espacios de más al inicio, en medio y al final.
edge:
  - args: [""]
    tag: con un mensaje vacío
  - args: ["     "]
    tag: con un mensaje de solo espacios
  - args: ["sierra"]
    tag: con una sola palabra
  - args: ["sierra oscar sierra STOP alfa stop bravo"]
    tag: con STOP en mayúsculas
  - args: ["Papa   ECHO   romeo   uniform"]
    tag: con muchos espacios entre palabras
random:
  count: 40
  seed: 81
  generate: |
    const alfabeto = ["alfa", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliett", "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", "yankee", "zulu"];
    const caso = (p) => [...p].map((c) => (rng.next() < 0.3 ? c.toUpperCase() : c)).join("");
    const n = rng.int(1, 300);
    const palabras = [];
    for (let i = 0; i < n; i++) {
      const puedeStop = i > 0 && i < n - 1 && palabras[i - 1].toLowerCase() !== "stop";
      palabras.push(puedeStop && rng.next() < 0.15 ? caso("stop") : caso(rng.pick(alfabeto)));
    }
    return [" ".repeat(rng.int(0, 2)) + palabras.map((p, i) => (i ? " ".repeat(rng.int(1, 3)) : "") + p).join("") + " ".repeat(rng.int(0, 2))];
wrong:
  - |
    function deletreo(mensaje) {
      let resultado = "";
      for (const palabra of mensaje.trim().split(" ")) {
        resultado += palabra.toLowerCase() === "stop" ? " " : palabra[0].toUpperCase();
      }
      return resultado;
    }
  - |
    function deletreo(mensaje) {
      const limpio = mensaje.trim();
      if (limpio === "") return "";
      let resultado = "";
      for (const palabra of limpio.split(/\s+/)) {
        resultado += palabra === "stop" ? " " : palabra[0].toUpperCase();
      }
      return resultado;
    }
  - |
    function deletreo(mensaje) {
      const limpio = mensaje.trim();
      if (limpio === "") return "";
      let resultado = "";
      for (const palabra of limpio.split(/\s+/)) {
        resultado += palabra.toLowerCase() === "stop" ? " " : palabra[0];
      }
      return resultado;
    }
```

## Misión final

```exercise
id: js8-mision-radio
type: mission
title: Las órdenes de la radio
prompt: |
  Lee la orden que llegó por la radio, haz que Chasqui la siga paso a paso y entrega el nombre del bote, en mayúsculas, en el buzón del muelle (D).

  La orden está en `radio`, con trozos separados por `/`. Cada trozo, en mayúsculas o minúsculas y con espacios de más:

  - `av-N`: avanzar `N` casillas;
  - `der` / `izq`: girar a la derecha / a la izquierda;
  - `entrega: nombre`: el último trozo; entrega `nombre` en mayúsculas y sin espacios en los extremos.

  La orden y el mapa cambian en cada prueba, así que no la copies a mano: **léela con código**.
visual:
  figure:
    title: La orden de la primera prueba, trozo por trozo
    panes:
      - { label: radio, text: "  av-3 / DER /Av-2/ izq / AV-4 / entrega: virgen del carmen  " }
      - { table: { head: ["trozo limpio", "Chasqui hace"], rows: [["`AV-3`", "`robot.avanzar(3)`"], ["`DER`", "`robot.girarDerecha()`"], ["`AV-2`", "`robot.avanzar(2)`"], ["`IZQ`", "`robot.girarIzquierda()`"], ["`AV-4`", "`robot.avanzar(4)`"], ["`ENTREGA: VIRGEN DEL CARMEN`", "`robot.entregar(\"VIRGEN DEL CARMEN\")`"]] } }
starter: |
  // radio llega del muelle, por ejemplo:
  // "  av-3 / DER /Av-2/ izq / AV-4 / entrega: virgen del carmen  "

  console.log(radio);
  // TODO: parte la orden en trozos y haz lo que dice cada uno
solution: |
  for (const trozo of radio.split("/")) {
    const orden = trozo.trim().toUpperCase();
    if (orden.startsWith("AV")) {
      robot.avanzar(Number(orden.split("-")[1]));
    } else if (orden === "DER") {
      robot.girarDerecha();
    } else if (orden === "IZQ") {
      robot.girarIzquierda();
    } else if (orden.startsWith("ENTREGA")) {
      robot.entregar(orden.split(":")[1].trim());
    }
  }
hints:
  - "Recorre `radio.split(\"/\")` con `for...of` y normaliza cada trozo: `trozo.trim().toUpperCase()`."
  - "Para `AV-3`, el número es lo que viene después del guion: `orden.split(\"-\")[1]`, convertido con `Number`."
world:
  theme: barranco
  level: 4
  dir: E
  map: |
    ###########
    #R...######
    ####.##..##
    #.#.....D.#
    ###########
globals:
  radio: "  av-3 / DER /Av-2/ izq / AV-4 / entrega: virgen del carmen  "
scenarios:
  - {}
  - map: |
      #########
      ###....##
      #.#.##D.#
      #R...####
      #########
    globals:
      radio: "av-2/ IZQ / av-2 / der/AV-3/ Der / av-1 /ENTREGA:Don Lucho"
  - map: |
      #########
      ##.R.####
      ###.#####
      ##....D.#
      #########
    world: { dir: S }
    globals:
      radio: " AV-2 /  izq/av-3 / Entrega:   santa rosita "
tests:
  - name: llega al buzón del muelle
    state: w.atGoal
    msg: Chasqui no terminó en el buzón (D). Revisa cada trozo de la orden.
  - name: entrega el nombre del bote en mayúsculas
    state: 'w.delivered.length === 1 && w.delivered[0] === g.radio.split(":")[1].trim().toUpperCase()'
    msg: El nombre entregado no es el del bote, en mayúsculas y sin espacios en los extremos.
  - name: sin chocar
    state: '!w.crashed'
  - name: lee la orden con split
    source: '\.split\s*\('
    msg: Parte la orden con split en lugar de copiarla a mano.
```

## Reto experto

```exercise
id: js8-reto-morse
type: challenge
title: Morse en la niebla
prompt: |
  Cuando la voz no pasa, los botes usan Morse. Escribe `morse(senal)`, que traduce una señal: las letras van separadas por un espacio y las palabras por ` / `. La tabla está en `MORSE`. Una letra que no está en la tabla se traduce como `?`.

  `morse("-.-. .- .-.. .-.. .- --- / ... ..- .-.")` → `"CALLAO SUR"`
starter: |
  const MORSE = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G",
    "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N",
    "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U",
    "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
  };

  function morse(senal) {
    return "";
  }

  console.log(morse("-.-. .- .-.. .-.. .- --- / ... ..- .-."));
solution: |
  const MORSE = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G",
    "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N",
    "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U",
    "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
  };

  const morse = (senal) =>
    senal
      .trim()
      .split(" / ")
      .map((palabra) => palabra.split(" ").map((letra) => MORSE[letra] ?? "?").join(""))
      .join(" ");

  console.log(morse("-.-. .- .-.. .-.. .- --- / ... ..- .-."));
hints:
  - Parte primero en palabras (`" / "`) y cada palabra en letras (`" "`).
tests:
  - name: CALLAO SUR
    run: 'morse("-.-. .- .-.. .-.. .- --- / ... ..- .-.")'
    equals: CALLAO SUR
  - name: una sola letra
    run: 'morse("...")'
    equals: S
  - name: SOS
    run: 'morse("... --- ...")'
    equals: SOS
  - name: letra desconocida
    run: 'morse(".-.- --- ...")'
    equals: "?OS"
```
