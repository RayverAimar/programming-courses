# Sesión 1 — Valores, variables y console.log

## El encargo

Primer día en Loop, un local con olor a soldadura a dos cuadras del Puente de los Suspiros. Doña Rosa Quispe, de la panadería de la avenida Grau, pidió que le lleven una caja de alfajores a su casa, y el único robot libre es **Chasqui**: un repartidor de segunda mano al que nadie ha configurado todavía. No sabe su nombre, no sabe cuánta batería tiene y no sabe a dónde ir. Hoy le enseñas todo eso.

Si los alfajores llegan, Doña Rosa le pasa la voz a media Barranco. Si no, Loop se queda sin desayuno.

```escena
theme: barranco
level: 1
dir: E
caption: Chasqui sale de Loop (a la izquierda) hacia el buzón de Doña Rosa. Hoy aprende a llegar solo.
map: |
  ##########
  #R.......#
  #####.##D#
  ##########
program: |
  robot.avanzar(7);
  robot.girarDerecha();
  robot.avanzar(1);
  robot.entregar("Alfajores");
```

## Por qué existe JavaScript

```goals
- Contar quién creó JavaScript, cuándo y qué problema quería resolver
- Comparar sus fortalezas y debilidades con Python y Java
- Saber dónde se usa hoy y por qué encaja ahí
```

Antes de configurar a Chasqui, una pregunta justa: ¿por qué Loop le habla en JavaScript y no en otro idioma? La respuesta empieza en 1995, con un navegador y mucho apuro. Esta lección es contexto: si una palabra no te suena (hilo, *worker*, TypeScript), sigue de largo; todas vuelven más adelante con sentido.

### El problema de 1995

<!-- photo: internet-modem-1995 -->

Para entender por qué hacía falta JavaScript, primero hay que ver cómo funcionaba la web en 1995. Bastan tres palabras:

- Un **servidor** es una computadora prendida día y noche en algún lugar del mundo. Guarda las páginas de un sitio y se las entrega a quien las pida.
- Una **página** era un **archivo de texto** guardado en ese servidor, escrito en **HTML**: etiquetas que dicen "aquí va un título", "aquí una caja para escribir", "aquí un botón". El navegador lo descarga y lo dibuja, y ahí se acaba todo. La página no traía código propio: no podía revisar, calcular ni decidir nada.
- Un **pedido** (*request*) es el mensaje que tu navegador le manda al servidor: "dame tal página" o "aquí van los datos del formulario". La respuesta es una página entera, nueva.

Y todo eso viajaba por el teléfono. En casa no había wifi ni fibra: había un **módem** que llamaba, por la línea de la casa, a un **proveedor de internet**. Mientras estabas conectado, la línea estaba ocupada y nadie podía llamarte (de ahí el clásico "¡cuelga, que estoy esperando una llamada!"). Mira qué pasaba si te olvidabas de llenar una cajita:

<!-- /photo -->

```red
title: Un formulario en 1995, y el mismo con JavaScript
clockLabel: Desde el clic
clockMax: 12
nodes:
  - { id: pc, icon: computer, label: Tu computadora, sub: el navegador Netscape }
  - { id: modem, icon: modem, label: Módem, sub: convierte los datos en sonido }
  - { id: isp, icon: isp, label: Proveedor de internet, sub: al que llama tu módem }
  - { id: net, icon: internet, label: Internet, sub: redes unidas entre sí }
  - { id: server, icon: server, label: Servidor web, sub: la computadora de la tienda }
links:
  - { id: cable, label: cable }
  - { id: phone, kind: phone, label: "línea telefónica, 28.8 kbps", busy: ocupada }
  - { id: l3 }
  - { id: l4 }
steps:
  - phase: "1995: sin JavaScript"
    at: server
    tags: { server: pedido.html }
    note: Una página es un **archivo** que vive en el servidor. Este es el de Discos Lucho, una tienda que manda su catálogo a quien lo pida. Es puro HTML, solo dice qué dibujar; la página no trae ningún programa.
    show:
      label: pedido.html, tal como está guardado
      text: |
        <h1>Discos Lucho</h1>
        <form action="/cgi-bin/pedido.cgi"
              method="post">
          Nombre: <input name="nombre">
          Correo: <input name="correo">
          <input type="submit" value="Enviar">
        </form>
  - at: pc
    tags: { pc: aprieta Enviar }
    note: Rosa abre la página, escribe su nombre, se olvida del correo y aprieta **Enviar**. El navegador no sabe revisar nada; solo empaqueta lo que hay en las cajas.
    show:
      label: Lo que ve Rosa
      form: { title: Discos Lucho, fields: [[Nombre, Rosa Quispe], [Correo, ""]], button: Enviar }
  - at: pc
    packet: { kind: up, label: "pedido HTTP, ~0.5 KB" }
    note: Ese paquete es el **pedido**, unas líneas de texto que dicen a qué programa va y qué escribió Rosa. Fíjate en `correo=` al final; está vacío, pero viaja igual.
    show:
      label: El pedido, letra por letra
      text: |
        POST /cgi-bin/pedido.cgi HTTP/1.0
        Content-Type: application/x-www-form-urlencoded
        Content-Length: 26

        nombre=Rosa+Quispe&correo=
  - move: [pc, isp]
    packet: { kind: up, label: "pedido HTTP, ~0.5 KB" }
    busy: [modem, phone]
    clock: 0.3
    tags: { modem: "piiii… krrrr…" }
    note: El módem convierte el pedido en **sonidos** (sí, esos chillidos) y los manda por la línea del teléfono hasta el proveedor. Mientras tanto, si alguien llama a tu casa, escucha ocupado.
  - move: [isp, server]
    packet: { kind: up, label: "pedido HTTP, ~0.5 KB" }
    busy: [modem, phone]
    clock: 0.6
    note: El proveedor lo pasa a internet, que lo lleva de red en red hasta el **servidor** de la tienda.
  - at: server
    packet: { kind: up, label: "pedido HTTP, ~0.5 KB" }
    busy: [modem, phone]
    clock: 1
    tags: { server: "correo vacío → error" }
    note: El servidor le pasa los datos a un programa **CGI**, la forma estándar de entonces de conectar una página con un programa. El programa revisa, ve el correo vacío y escribe una página **nueva y completa** solo para decir eso.
    show:
      label: pedido.cgi, en palabras
      text: |
        si el correo está vacío:
            escribir una página entera
            que diga "Te faltó el correo"
        si no:
            guardar el pedido
  - move: [server, pc]
    dur: 2800
    packet: { kind: down, label: "página HTML, ~35 KB" }
    busy: [modem, phone]
    clock: 11
    note: "La respuesta hace el viaje de vuelta, y el tramo lento es la línea telefónica: 35 KB son 35 × 1024 × 8 = 286 720 bits, y a 28 800 bits por segundo eso toma **unos 10 segundos**, en el mejor de los casos."
  - at: pc
    packet: { kind: down, label: "página HTML, ~35 KB" }
    busy: [modem, phone]
    clock: 11
    tags: { pc: dibuja la página otra vez }
    note: Unos 11 segundos después del clic, Rosa ve la página de nuevo, ahora con un aviso arriba. Y por cada error, otro viaje completo.
    show:
      label: Lo que ve Rosa
      form: { title: Discos Lucho, message: Te faltó el correo, fields: [[Nombre, Rosa Quispe], [Correo, ""]], button: Enviar }
  - phase: Con JavaScript
    at: server
    clock: 0
    tags: { server: pedido.html }
    note: Ahora la página trae un **programa chiquito adentro**, escrito en JavaScript. Va en el mismo archivo, así que llega junto con la página la primera vez que la abres.
    show:
      label: pedido.html, con su script
      text: |
        <form action="/cgi-bin/pedido.cgi"
              method="post"
              onsubmit="return revisar(this)">
          …las mismas cajas y el botón…
        </form>
        <script>
          function revisar(form) {
            if (form.correo.value === "") {
              alert("Te faltó el correo");
              return false;
            }
            return true;
          }
        </script>
  - at: pc
    clock: 0
    dim: [modem, isp, net, server]
    dimLinks: [cable, phone, l3, l4]
    tags: { pc: "correo vacío → aviso" }
    note: Rosa aprieta **Enviar** y la revisión corre **dentro de su navegador**. Nada viaja, la línea queda libre y el aviso sale al instante.
    show:
      label: Lo que ve Rosa
      form: { title: Discos Lucho, message: Te faltó el correo, fields: [[Nombre, Rosa Quispe], [Correo, ""]], button: Enviar }
  - at: pc
    clock: 0
    note: Cuando el formulario sí está completo, igual viaja al servidor, pero una sola vez y con los datos bien. Eso quería Netscape, que la página pudiera decidir cosas pequeñas sin preguntarle a nadie.
    show:
      - { label: "Sin JavaScript: un viaje por cada error", value: "≈ 11 s" }
      - { label: "Con JavaScript: el navegador revisa", value: al instante }
caption: "Las cuentas suponen un módem de 28.8 kbps rindiendo al máximo (en la práctica, menos; y muchos eran de 14.4, el doble de lentos), una respuesta de unos 35 KB entre HTML e imágenes, y alrededor de un segundo para el resto del camino y el programa del servidor."
```

Once segundos y la línea ocupada, todo por una cajita vacía. La otra forma que existía de poner un programa en una página eran los **applets de Java**, y ligeros no eran:

```red
title: Cómo arrancaba un applet de Java
nodes:
  - { id: page, icon: file, label: La página, sub: HTML con un recuadro reservado }
  - { id: cls, icon: program, label: El applet, sub: "un programa compilado (.class), aparte" }
  - { id: jvm, icon: engine, label: Máquina virtual de Java, sub: un programa grande que corre los applets }
  - { id: box, icon: box, label: El recuadro, sub: donde el applet dibuja }
links:
  - { id: a1, label: se descarga }
  - { id: a2, label: hay que encenderla }
  - { id: a3 }
steps:
  - at: page
    note: La página dice "aquí va un applet" y le reserva un rectángulo. Mientras tanto, ves un cuadro gris.
  - move: [page, cls]
    packet: { kind: down, label: el applet compilado }
    note: El navegador descarga el applet, que es otro archivo y viene aparte de la página. Por módem, eso era más espera.
  - at: jvm
    packet: { kind: down, label: el applet compilado }
    tags: { jvm: arrancando… }
    note: Antes de correr nada hay que encender la **máquina virtual de Java**. Netscape la traía incorporada desde 1996; otros navegadores pedían un plugin aparte. Arrancarla podía tomar varios segundos y dejar el navegador congelado un rato.
  - move: [jvm, box]
    packet: { kind: down, label: el applet compilado }
    note: Al fin el applet corre, pero encerrado en su recuadro, como una ventanita aparte. Servía para un juego o un gráfico, no tanto para revisar una cajita del formulario. Y para escribirlo había que saber Java, con sus clases, sus tipos y su compilación.
```

<!-- photo: netscape-navigator-2 -->

Lo que había no alcanzaba: el HTML no puede decidir nada, los applets eran pesados y pensados para programadores profesionales, y los programas del servidor obligaban a ir y volver por cada cosita.

**Netscape**, la empresa del navegador más usado de entonces, quería un lenguaje pequeño que viviera *dentro* de la página, para diseñadores y aficionados: validar un formulario, calcular un total, reaccionar a un clic sin preguntarle nada al servidor. En mayo de 1995 le encargaron el trabajo a **Brendan Eich**, que escribió el primer prototipo en unos **diez días**. La condición de la gerencia: que *se pareciera* a Java, el lenguaje de moda. Por eso tiene llaves y punto y coma; por dentro, en cambio, Eich tomó ideas de **Scheme** (funciones que se pasan como cualquier valor) y de **Self** (objetos que heredan de otros objetos).

Se llamó **Mocha**, luego **LiveScript** y, en diciembre de 1995, **JavaScript**, por un acuerdo de marketing con Sun, la dueña de Java. Java y JavaScript se parecen tanto como *papa* y *papaya*: comparten letras, no receta.

<!-- /photo -->

```figura
title: JavaScript en el tiempo
panes:
  - timeline:
      - when: "1995"
        title: "Netscape"
        text: "Eich crea Mocha → LiveScript → JavaScript"
      - when: "1996–97"
        title: "Guerra de navegadores"
        text: "Microsoft lanza JScript; nace el estándar ECMAScript"
      - when: "2005"
        title: "Ajax"
        text: "Gmail y Google Maps cargan datos sin recargar la página"
      - when: "2009"
        title: "Node.js"
        text: "JavaScript sale del navegador y llega a los servidores"
      - when: "2012"
        title: "TypeScript"
        text: "Microsoft le suma tipos que se revisan antes de ejecutar"
      - when: "2015"
        title: "ES2015"
        text: "let, const, clases, módulos: el JavaScript de este curso"
caption: Desde 2015 sale una edición nueva del estándar cada año (ES2016, ES2017…).
```

## Lo mínimo

Un programa guarda **valores** en **variables** y los usa. Los valores básicos son textos (*strings*, entre comillas), números y booleanos (`true` o `false`). Con `console.log` miras qué hay dentro de cualquier cosa.

**Cómo se ejecuta esto.** Tú escribes texto. Un programa llamado **motor** (el de JavaScript vive en tu navegador y en Node) lo lee línea por línea y hace lo que dice. En Loop, el botón ▶ le entrega tu texto al motor, y lo que mandas con `console.log` aparece en la **consola**, el panel de abajo. `typeof` pregunta de qué tipo es un valor.

```js run
const nombre = "Chasqui";
let bateria = 100;
bateria = bateria - 12;
console.log(`${nombre} tiene ${bateria}% de batería`);
console.log(typeof nombre, typeof bateria, typeof true);
```

Una variable es una **caja con nombre**: guardas un valor, lo lees cuando quieras y, si la declaraste con `let`, le cambias el contenido. (Con arrays y objetos la caja guarda una flecha hacia el contenido: lo verás en la sesión 5.) Dale a ▶ y mira cómo cambia cada caja línea por línea:

```anima
title: Variables como cajas
code: |
  const nombre = "Chasqui";
  let bateria = 100;
  bateria = bateria - 12;
  bateria = bateria - 30;
  console.log(`${nombre}: ${bateria}%`);
notes:
  1: Una caja con nombre que no cambiará (const).
  3: bateria cambia, por eso se declaró con let.
  5: El template literal mete los valores dentro del texto.
```

Tres ideas, y con eso basta para hoy:

- **`const` por defecto.** Declara con `const` todo lo que no va a cambiar. Si el valor cambia, como la batería, usa `let`. Si intentas cambiar una `const`, JavaScript te avisa con un error (`TypeError: Assignment to constant variable.`), y eso es bueno: te protege de cambios que no querías.
- **Template literals.** Entre comillas invertidas (`` ` ``) puedes meter cualquier valor con `${…}`. Así armas textos sin pelearte con los espacios.
- **`console.log` acepta varias cosas** separadas por comas y las imprime separadas por un espacio.

> **Trampa común:** `+` suma números pero *pega* textos. `"3" + 2` da `"32"`, no `5`. Si un número te llega como texto (de un formulario, de un sensor), conviértelo primero con `Number("3")`.

<!-- legacy: let-const -->

<!-- legacy: template-literals -->

<!-- mdn: let-const let template-literals console-log typeof -->

## Para curiosos

Para curiosos: cómo creció, con qué se compara y dónde se usa. Si una palabra no te suena, sigue de largo; vuelve más adelante con sentido.

### De juguete a lenguaje de todo

En la **guerra de navegadores**, Microsoft hizo su propia copia, **JScript**, para Internet Explorer (1996). Dos versiones que se portaban distinto eran una pesadilla, así que Netscape llevó el lenguaje a Ecma International para estandarizarlo: el estándar se llama **ECMAScript** (ECMA-262, primera edición en 1997) y lo mantiene un comité, el **TC39**, donde hoy se sientan los fabricantes de navegadores y otras empresas.

Durante años JavaScript fue "el lenguaje de los efectitos". Cambió en 2004–2005, cuando **Gmail** y **Google Maps** mostraron páginas que piden datos al servidor sin recargarse; Jesse James Garrett le puso nombre a la técnica: **Ajax**. En 2008, el motor **V8** de Chrome lo hizo mucho más rápido, y en 2009 Ryan Dahl lo usó para crear **Node.js**: JavaScript fuera del navegador, en servidores. En 2015, **ES2015** trajo `let`, `const`, funciones flecha, clases y módulos, que es lo que aprendes aquí.

```idea
JavaScript nació para que una página reaccione sin ir al servidor, y como no se puede "romper la web", carga para siempre con sus errores de juventud.
```

### Fortalezas y debilidades

Diez días de apuro dejaron rarezas, como `==`, que convierte tipos por su cuenta, o `var`, que ignora los bloques. No se pueden arreglar: millones de páginas dependen de que funcionen así, y un navegador que las cambie rompe esas páginas. La salida fue **agregar** formas nuevas (`===`, `let`, `const`) y dejar las viejas. Por eso, a lo largo del curso, verás cajas **"En código viejo verás…"**: te enseñan a reconocer lo antiguo y a escribir lo moderno.

```exercise
id: js1-origen-igualdad
type: predict
title: Una rareza de 1995
prompt: |
  `==` es de los diez días; `===` llegó después para arreglarlo. ¿Qué imprime?
code: |
  console.log("5" == 5, "5" === 5);
options:
  - true false
  - false false
  - true true
  - false true
answer: true false
explain: |
  `==` convierte el texto `"5"` en número antes de comparar, así que da `true`. `===` compara también el tipo, y un texto no es un número: `false`. En este curso usamos siempre `===`.
```

La misma tarea, sumar los precios de un pedido, en tres lenguajes:

**JavaScript**

```js
const precios = [18.5, 12, 6];
const total = precios.reduce((a, b) => a + b, 0);
console.log(total);
```

**Python**

```py
precios = [18.5, 12, 6]
total = sum(precios)
print(total)
```

**Java**

```
double[] precios = {18.5, 12, 6};
double total = 0;
for (double p : precios) total += p;
System.out.println(total);
// …dentro de una clase y un main
```

Python es el más corto; Java pide declarar tipos y una clase; JavaScript corre tal cual en la consola de cualquier navegador.

```figura
title: JavaScript frente a otros
panes:
  - table:
      head: ["", "JavaScript", "Python", "Java"]
      rows:
        - ["Dónde corre sin instalar nada", "**En todo navegador**", "No", "No"]
        - ["Tipos", "Dinámicos (TypeScript los añade)", "Dinámicos (con anotaciones opcionales)", "Estáticos, revisados al compilar"]
        - ["Esperar red o archivos", "**Asíncrono de nacimiento**", "Posible (asyncio)", "Con hilos"]
        - ["Cálculo pesado en varios núcleos", "Un hilo; workers aparte", "Limitado por el GIL", "**Hilos de verdad**"]
        - ["Rarezas heredadas", "Muchas (`==`, `var`)", "Pocas", "Pocas"]
        - ["Paquetes", "npm, enorme", "PyPI, enorme", "Maven, enorme"]
```

**Fortalezas.**

- **Corre donde haya un navegador**: celular, laptop, la computadora de tu tía. Nadie instala nada. Por eso Loop programa a Chasqui en JavaScript: el simulador y tu código corren aquí mismo, en esta página.
- **Un solo lenguaje adelante y atrás**: con Node.js, la página y el servidor se escriben en el mismo idioma y comparten código.
- **Ecosistema gigante**: npm es uno de los registros de paquetes más grandes que existen; casi siempre alguien ya resolvió tu problema.
- **Asincronía**: mientras espera la red o un archivo, no se queda congelado; sigue atendiendo otras cosas (lo verás en la sesión de asincronía).

**Debilidades.**

- **Rarezas heredadas** como `==` y `var`, que hay que conocer para leer código viejo.
- **Un solo hilo para tu código**: un cálculo pesado congela la página hasta que termina. Existen los *workers* para repartir trabajo, pero son trabajo extra.
- **Tipos dinámicos a gran escala**: muchos errores aparecen recién al ejecutar. Por eso tantos equipos grandes escriben en **TypeScript**, que revisa los tipos antes.
- **Dependencias en cadena**: un proyecto chico puede arrastrar cientos de paquetes. En 2016, retirar `left-pad`, un paquete de 11 líneas, rompió la instalación de miles de proyectos.

### Dónde se usa hoy

```figura
title: Dónde vive JavaScript
panes:
  - table:
      head: ["Dónde", "Por qué encaja"]
      rows:
        - ["**Páginas y apps web**", "Es el único lenguaje que todo navegador ejecuta de fábrica"]
        - ["**Servidores y APIs**", "Node.js atiende muchas conexiones a la vez sin bloquearse"]
        - ["**Apps de escritorio**", "Electron empaqueta una web como app (VS Code; también este curso)"]
        - ["**Apps móviles**", "React Native reutiliza lo que el equipo ya sabe de la web"]
```

Su terreno natural es la web, porque ahí no tiene competencia: el navegador habla JavaScript (y WebAssembly, para casos especiales) y nada más. De ahí se extendió a todo lo que una persona que ya sabe web quiere construir. En la encuesta de desarrolladores de **Stack Overflow 2026**, JavaScript volvió a ser el lenguaje más usado (62.0 % de quienes respondieron, con Python en 58.0 %). En **GitHub Octoverse 2025**, el primer lugar por número de contribuidores fue para **TypeScript**, es decir, JavaScript con tipos. Son fotos de un año, no verdades eternas: revisa la edición más reciente.

```recap
- Brendan Eich lo creó en Netscape en 1995, en unos diez días, para que las páginas reaccionaran sin ir al servidor.
- El nombre "JavaScript" fue marketing; el estándar se llama ECMAScript y lo cuida el comité TC39.
- Ajax (2005), Node.js (2009), ES2015 y TypeScript lo llevaron de los efectitos a todas partes.
- "Fortalezas: corre en todo navegador, mismo lenguaje adelante y atrás, ecosistema enorme, asincronía."
- "Debilidades: rarezas como `==` y `var`, un solo hilo, tipos dinámicos a gran escala, dependencias en cadena."
```

**Fuentes**

- Allen Wirfs-Brock y Brendan Eich, [«JavaScript: The First 20 Years»](https://dl.acm.org/doi/10.1145/3386327), HOPL IV, ACM, 2020.
- Ecma International, [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/), y [TC39](https://tc39.es/).
- MDN, [JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript).
- T. Berners-Lee, R. Fielding y H. Frystyk, [RFC 1945: HTTP/1.0](https://www.rfc-editor.org/rfc/rfc1945), 1996, cómo viajan los pedidos y las páginas.
- Jesse James Garrett, [«Ajax: A New Approach to Web Applications»](https://web.archive.org/web/20050305001607/http://www.adaptivepath.com/publications/essays/archives/000385.php), 2005.
- [Node.js: About](https://nodejs.org/en/about) y [TypeScript](https://www.typescriptlang.org/).
- [Stack Overflow Developer Survey 2026: Technology](https://survey.stackoverflow.co/2026/technology).
- GitHub, [Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).

## Práctica

```exercise
id: js1-predice-bateria
type: predict
title: La primera carga
prompt: |
  Antes de ejecutarlo: ¿qué imprime?
code: |
  const nombre = "Chasqui";
  let bateria = 80;
  bateria = bateria - 15;
  console.log(nombre, bateria);
options:
  - Chasqui 65
  - Chasqui 80
  - nombre bateria
  - Chasqui65
answer: Chasqui 65
explain: |
  `let` permite cambiar `bateria`: primero vale 80 y luego `80 - 15`. `console.log` separa sus argumentos con un espacio.
```

```exercise
id: js1-predice-paquetes
type: predict
title: El sensor que habla en texto
prompt: |
  El sensor de carga de Chasqui devuelve el número de paquetes como texto. ¿Qué imprimen estas dos líneas?
code: |
  const paquetes = "3";
  console.log(paquetes + 2);
  console.log(Number(paquetes) + 2);
options:
  - "5\n5"
  - "32\n5"
  - "32\n32"
  - "5\n32"
answer: "32\n5"
explain: |
  Con un texto de por medio, `+` pega: `"3" + 2` es `"32"`. `Number("3")` lo convierte en el número 3, y entonces sí suma.
```

```exercise
id: js1-completa-config
type: complete
title: La ficha de Chasqui
prompt: |
  Configura al robot: se llama **Chasqui**, empieza con **100** de batería (que irá bajando) y **lleva carga** (`true`). Reemplaza cada `___`.
starter: |
  const nombre = ___;
  ___ bateria = 100;
  const llevaCarga = ___;
  console.log(`${nombre} listo con ${bateria}% de batería`);
solution: |
  const nombre = "Chasqui";
  let bateria = 100;
  const llevaCarga = true;
  console.log(`${nombre} listo con ${bateria}% de batería`);
hints:
  - Los textos van entre comillas. `true` no lleva comillas, es un booleano.
  - La batería va a cambiar durante el reparto, así que no puede ser `const`.
tests:
  - name: nombre es el texto "Chasqui"
    expect: 'nombre === "Chasqui"'
  - name: bateria empieza en 100 y se declara con let
    source: '\blet\s+bateria\b'
    msg: La batería cambiará durante el día. Declárala con let.
  - name: llevaCarga es el booleano true
    expect: llevaCarga === true
    msg: llevaCarga debe ser true, sin comillas.
  - name: la consola anuncia al robot
    output: Chasqui listo con 100% de batería
```

```exercise
id: js1-arregla-const
type: fix
title: La batería que no bajaba
prompt: |
  Este programa debería mostrar la batería después de una entrega, pero se cae. Ejecútalo, lee el error y arréglalo cambiando lo mínimo.
starter: |
  const bateria = 100;
  const gastoPorEntrega = 30;
  bateria = bateria - gastoPorEntrega;
  console.log("Batería tras la entrega:", bateria);
solution: |
  let bateria = 100;
  const gastoPorEntrega = 30;
  bateria = bateria - gastoPorEntrega;
  console.log("Batería tras la entrega:", bateria);
hints:
  - El error dice que intentaste cambiar una constante. ¿Cuál de las dos cambia?
tests:
  - name: imprime la batería que queda
    output: "Batería tras la entrega: 70"
  - name: gastoPorEntrega sigue siendo const
    source: '\bconst\s+gastoPorEntrega\b'
    msg: El gasto por entrega no cambia, déjalo como const.
  - name: sin var
    sourceNot: '\bvar\b'
    msg: Usa let, no var.
```

```exercise
id: js1-escribe-costo
type: write
title: Cuánto cobrar
prompt: |
  Calcula en `costo` lo que cuesta el envío a la casa de Doña Rosa y muéstralo como `Costo: S/ 11`.

  Loop cobra **5 soles** de base más **1.5 soles por kilómetro**, y la casa está a **4 km**. Guarda esos tres datos en tres constantes y calcula el total con ellas.
visual:
  figure:
    title: Así se arma la tarifa
    panes:
      - receipt:
          title: LOOP · ENVÍO
          rows: [["Tarifa base", "5.00"], ["4 km × 1.5", "6.00"]]
          total: "11.00"
starter: |
  // Tus tres constantes:

  // El total:
  const costo = 0;
  console.log(`Costo: S/ ${costo}`);
solution: |
  const tarifaBase = 5;
  const precioPorKm = 1.5;
  const distanciaKm = 4;
  const costo = tarifaBase + precioPorKm * distanciaKm;
  console.log(`Costo: S/ ${costo}`);
hints:
  - En JavaScript la multiplicación va antes que la suma, como en el colegio.
  - "`const costo = tarifaBase + precioPorKm * distanciaKm;`"
tests:
  - name: costo vale 11
    expect: costo === 11
  - name: la consola muestra el costo
    output: "Costo: S/ 11"
  - name: el total se calcula con variables, no a mano
    source: '\bcosto\s*=\s*[A-Za-z_$][\w$]*\s*[+*]'
    msg: Calcula costo a partir de tus constantes, no escribas 11 directamente.
```

```exercise
id: js1-escribe-salida
type: write
title: Salir de Loop
prompt: |
  Lleva a Chasqui hasta el buzón (D) y haz que diga `Soy Chasqui` con `robot.decir()`.

  Es la primera vuelta de prueba y Chasqui empieza mirando al este.

  Lo que Chasqui entiende hoy: `robot.avanzar(n)`, `robot.girarIzquierda()`, `robot.girarDerecha()` y `robot.decir(texto)`. Pulsa **Probar** y mira el mapa.
starter: |
  const nombre = "Chasqui";
  robot.avanzar(1);
solution: |
  const nombre = "Chasqui";
  robot.avanzar(2);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.decir(`Soy ${nombre}`);
hints:
  - Cuenta las casillas libres hacia la derecha hasta la pared, luego gira.
  - Girar a la derecha cuando miras al este te deja mirando al sur.
world:
  theme: barranco
  level: 1
  dir: E
  map: |
    #######
    #R..###
    ###.###
    ###D###
    #######
tests:
  - name: Chasqui llega al buzón
    state: w.atGoal
    msg: Chasqui no terminó sobre el buzón.
  - name: dice "Soy Chasqui"
    state: 'w.said.includes("Soy Chasqui")'
    msg: Haz que diga exactamente "Soy Chasqui", con un template literal.
```

## El caso

```exercise
id: js1-caso-vuelto
type: case
title: El vuelto que no cuadra
prompt: |
  **Calcula el vuelto correcto de cada pedido y compáralo con lo que reportó cada robot.** El que no cuadra se quedó con la plata.

  El sábado cuatro robots llevaron pedidos de la panadería y por la noche la caja tenía **2 soles menos**. En el tablero está quién llevó qué, cuánto pagó cada cliente y cuánto vuelto dijo cada robot que entregó. Imprime una línea por robot que empiece con su nombre, por ejemplo `console.log("Chasqui:", vueltoRosa)`, y el tablero te dirá si cuadra.
visual:
  board:
    for: js1-caso-vuelto
    task: "Vuelto correcto = lo que pagó − lo que costó el pedido. Compáralo con lo que reportó el robot."
    cards:
      - name: Chasqui
        kind: robot
        role: Repartidor
        with: { name: Rosa, kind: person, label: llevó el pedido de Rosa }
        rows: [["Pedido", "2 cajas de alfajores"], ["Pagó", "S/ 50"], ["Reportó de vuelto", "S/ 13"]]
        clue: { find: "Chasqui", says: 13 }
      - name: Wayra
        kind: robot
        role: Repartidor
        with: { name: Don Lucho, kind: person, label: llevó el pedido de Don Lucho }
        rows: [["Pedido", "3 docenas de picarones"], ["Pagó", "S/ 40"], ["Reportó de vuelto", "S/ 4"]]
        clue: { find: "Wayra", says: 4 }
      - name: Pituco
        kind: robot
        role: Repartidor
        culprit: true
        with: { name: Abuela Tere, kind: person, label: llevó el pedido de la abuela Tere }
        rows: [["Pedido", "4 vasos de suspiro"], ["Pagó", "S/ 50"], ["Reportó de vuelto", "S/ 10"]]
        clue: { find: "Pituco", says: 10 }
      - name: Tuki
        kind: robot
        role: Repartidor
        with: { name: Señor Kenji, kind: person, label: llevó el pedido del señor Kenji }
        rows: [["Pedido", "1 caja de alfajores + 1 suspiro"], ["Pagó", "S/ 30"], ["Reportó de vuelto", "S/ 2"]]
        clue: { find: "Tuki", says: 2 }
      - name: Doña Rosa
        kind: note
        role: Lista de precios de la panadería
        rows: [["Alfajores (caja)", "S/ 18.50"], ["Picarones (docena)", "S/ 12"], ["Suspiro (vaso)", "S/ 9.50"]]
starter: |
  // Precios de la panadería, en soles
  const precioAlfajores = 18.5; // caja
  const precioPicarones = 12;   // docena
  const precioSuspiro = 9.5;    // vaso

  // Lo que pagó cada cliente
  const pagoRosa = 50;   // 2 cajas de alfajores, lo llevó Chasqui
  const pagoLucho = 40;  // 3 docenas de picarones, lo llevó Wayra
  const pagoTere = 50;   // 4 vasos de suspiro, lo llevó Pituco
  const pagoKenji = 30;  // 1 caja de alfajores y 1 suspiro, lo llevó Tuki

  // TODO: calcula el vuelto correcto de cada pedido
  // e imprime una línea por robot, por ejemplo:
  // console.log("Chasqui:", vueltoRosa);
solution: |
  const precioAlfajores = 18.5;
  const precioPicarones = 12;
  const precioSuspiro = 9.5;

  const pagoRosa = 50;
  const pagoLucho = 40;
  const pagoTere = 50;
  const pagoKenji = 30;

  const vueltoRosa = pagoRosa - 2 * precioAlfajores;
  const vueltoLucho = pagoLucho - 3 * precioPicarones;
  const vueltoTere = pagoTere - 4 * precioSuspiro;
  const vueltoKenji = pagoKenji - (precioAlfajores + precioSuspiro);
  console.log("Chasqui:", vueltoRosa);
  console.log("Wayra:", vueltoLucho);
  console.log("Pituco:", vueltoTere);
  console.log("Tuki:", vueltoKenji);
answer: Pituco
answerLabel: ¿Qué robot se quedó con los 2 soles?
reveal: |
  Pituco. El vuelto de la abuela Tere era `50 - 4 * 9.5 = 12`, y él reportó 10. Los otros tres cuadran: 13, 4 y 2.
hints:
  - "El primero, de ejemplo: `const vueltoRosa = pagoRosa - 2 * precioAlfajores;` da 13, igual que lo que reportó Chasqui. Haz lo mismo con los otros tres."
  - En el pedido de Kenji, primero suma los dos productos y luego réstalo de lo que pagó. Los paréntesis mandan.
```

## El juez

Un juez es como los de las competencias de programación: tu programa **lee una entrada** y **escribe una salida**, y el juez lo prueba con los ejemplos del enunciado y con decenas de casos ocultos. Para leer, el Taller te da tres funciones que usarás en todas las sesiones:

- `leerLinea()` devuelve la siguiente línea de la entrada, como texto;
- `leerNumero()` devuelve la siguiente línea convertida en número;
- `leerNumeros()` devuelve la siguiente línea como una lista de números (separados por espacios).

La respuesta se escribe con `console.log`, exactamente con el formato que pide el enunciado.

```exercise
id: js1-juez-cuenta
type: judge
title: La cuenta de la panadería
prompt: |
  **Imprime el total de la cuenta y, en la línea siguiente, el vuelto.**

  Doña Rosa quiere que Chasqui calcule cada cuenta antes de salir: el precio de un producto por la cantidad, más el costo de envío (el delivery). Luego, con lo que paga el cliente, el vuelto.

  **Entrada:** cuatro líneas con un entero cada una: el precio `P`, la cantidad `Q`, el envío `D` y lo que paga el cliente `M`.

  **Salida:** dos líneas: el total `P × Q + D` y el vuelto `M − total`.

  **Restricciones:** 1 ≤ P ≤ 200 · 1 ≤ Q ≤ 20 · 0 ≤ D ≤ 15 · total ≤ M ≤ 5000.
starter: |
  const precio = leerNumero();
  // lee también la cantidad, el envío y el pago

  console.log(precio);
solution: |
  const precio = leerNumero();
  const cantidad = leerNumero();
  const envio = leerNumero();
  const pago = leerNumero();
  const total = precio * cantidad + envio;
  console.log(total);
  console.log(pago - total);
hints:
  - Usa `leerNumero()`, no `leerLinea()`. Con textos, `+` pega en vez de sumar.
visual:
  figure:
    title: El ejemplo 1, como una boleta
    input: { label: Entrada, text: "18\n2\n5\n50" }
    arrow: precio × cantidad + envío
    output:
      label: Salida
      receipt:
        title: PANADERÍA ROSA
        rows: [["2 × S/ 18", "36"], ["Envío", "5"], ["**Total**", "**41**"], ["Paga", "50"]]
        totalLabel: Vuelto
        total: "9"
    steps:
      - "La entrada trae, en orden: precio 18, cantidad 2, envío 5 y pago 50."
      - "Primera línea de la salida: el total, 18 × 2 + 5 = 41."
      - "Segunda línea: el vuelto, 50 − 41 = 9."
samples:
  - input: "18\n2\n5\n50"
    output: "41\n9"
  - input: "12\n3\n0\n36"
    output: "36\n0"
    note: Delivery gratis y pago exacto, así que el vuelto es 0.
edge:
  - input: "1\n1\n0\n1"
    tag: con los valores mínimos
  - input: "200\n20\n15\n5000"
    tag: con los valores máximos
  - input: "7\n3\n15\n36"
    tag: cuando el pago es exacto
random:
  count: 40
  seed: 11
  tag: ""
  generate: |
    const p = rng.int(1, 200), q = rng.int(1, 20), d = rng.int(0, 15);
    const total = p * q + d;
    return `${p}\n${q}\n${d}\n${rng.int(total, 5000)}`;
wrong:
  - |
    const precio = leerLinea();
    const cantidad = leerLinea();
    const envio = leerLinea();
    const pago = leerLinea();
    const total = precio * cantidad + envio;
    console.log(total);
    console.log(pago - total);
  - |
    const precio = leerNumero();
    const cantidad = leerNumero();
    const envio = leerNumero();
    const pago = leerNumero();
    console.log(precio * cantidad + envio);
    console.log(pago - precio * cantidad);
```

## Misión final

```exercise
id: js1-mision-alfajores
type: mission
title: Los alfajores de Doña Rosa
prompt: |
  **Arma la etiqueta del pedido y lleva a Chasqui hasta el buzón de Doña Rosa para entregarla.**

  Chasqui sale de Loop (arriba a la izquierda) con la **batería justa: 11 casillas**. La casa de Doña Rosa es la del buzón. Un camino equivocado y se queda a medio camino.

  1. Arma en `etiqueta` el texto `Pedido 27 para Rosa Quispe` con un template literal y las variables `pedido` y `cliente`.
  2. Lleva a Chasqui hasta el buzón y entrega con `robot.entregar(etiqueta)`.

  Cuando pase, se desbloquea la sesión 2.
starter: |
  const cliente = "Rosa Quispe";
  const pedido = 27;
  const etiqueta = "";

  robot.avanzar(3);
solution: |
  const cliente = "Rosa Quispe";
  const pedido = 27;
  const etiqueta = `Pedido ${pedido} para ${cliente}`;

  robot.avanzar(3);
  robot.girarDerecha();
  robot.avanzar(2);
  robot.girarIzquierda();
  robot.avanzar(5);
  robot.girarIzquierda();
  robot.avanzar(1);
  robot.entregar(etiqueta);
hints:
  - "Recorre el camino con el dedo en el mapa: este, sur, este, norte. Cuenta las casillas de cada tramo."
  - Si Chasqui mira al sur y giras a la izquierda, queda mirando al este.
world:
  theme: barranco
  level: 1
  dir: E
  battery: 11
  map: |
    ##############
    #R...#########
    ####.####D####
    ####......#..#
    #..#.##.....##
    ##############
tests:
  - name: la etiqueta es "Pedido 27 para Rosa Quispe"
    expect: 'etiqueta === "Pedido 27 para Rosa Quispe"'
  - name: la etiqueta se arma con un template literal
    source: '`[^`]*\$\{[^`]*`'
    msg: Usa comillas invertidas y ${…} para armar la etiqueta.
  - name: Chasqui llega al buzón
    state: w.atGoal
    msg: Chasqui no terminó sobre el buzón de Doña Rosa.
  - name: entrega el paquete con su etiqueta
    state: 'w.delivered.length === 1 && w.delivered[0] === "Pedido 27 para Rosa Quispe"'
    msg: Falta robot.entregar(etiqueta) una vez, parado sobre el buzón.
```

## Reto experto

```exercise
id: js1-reto-ticket
type: challenge
title: El ticket alineado
visual:
  figure:
    title: Las columnas del ticket
    panes:
      - label: 16 columnas para el producto, luego "S/ " y 6 para el total
        text: "Ceviche x3......S/  22.50\n|<--- 16 ----->|   |<-6>|"
prompt: |
  **Imprime la línea del ticket con el producto alineado.** Para quien ya programa. La impresora de tickets de Loop tiene 16 columnas para el producto. Imprime una línea con el producto y la cantidad rellenados con puntos hasta 16 caracteres, luego `S/ ` y el total con dos decimales, alineado a la derecha en 6 caracteres.

  Con `plato = "Ceviche"`, `precio = 7.5` y `cantidad = 3` debe salir `Ceviche x3......S/  22.50`. Las tres variables te llegan de la caja y cambian en cada prueba.
starter: |
  // plato, precio y cantidad ya existen
  console.log(plato, precio, cantidad);
solution: |
  const producto = `${plato} x${cantidad}`.padEnd(16, ".");
  const total = (precio * cantidad).toFixed(2).padStart(6);
  console.log(`${producto}S/ ${total}`);
hints:
  - Mira `padEnd`, `padStart` y `toFixed` en MDN.
globals:
  plato: Ceviche
  precio: 7.5
  cantidad: 3
scenarios:
  - tests:
      - name: Ceviche x3
        output: Ceviche x3......S/  22.50
  - globals: { plato: Chicha morada, precio: 4, cantidad: 2 }
    tests:
      - name: Chicha morada x2 (justo 16 caracteres)
        output: Chicha morada x2S/   8.00
  - globals: { plato: Causa, precio: 12.9, cantidad: 1 }
    tests:
      - name: Causa x1
        output: Causa x1........S/  12.90
```
