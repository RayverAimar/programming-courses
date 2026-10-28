# Sesión 1 — Valores, variables y print

## El encargo

Loop abrió una sucursal en Chucuito, en el Callao, a una cuadra del muelle, donde todo huele a mar y a pintura fresca. La ingeniera **Maru Chumpitaz** acaba de abrir la caja que llegó en el último barco: adentro está **Quilla**, un robot repartidor nuevecito que solo entiende Python. No sabe cómo se llama, no sabe cuánta batería tiene y nunca ha cruzado una calle.

Y ya hay pedido. Don Teodoro, que vende alfajores de penca en el Rímac desde hace cuarenta años, quiere que le lleven una caja a su comadre, que vive frente a la Alameda de los Descalzos. Maru sube a Quilla a una mototaxi hasta la tienda; de ahí en adelante, Quilla camina solo. Hoy le enseñas a guardar lo que sabe y a decirlo en voz alta.

```escena
theme: barranco
level: 1
dir: E
caption: Quilla sale de la tienda de Don Teodoro (a la izquierda) hacia el buzón de la comadre, frente a la Alameda.
map: |
  ###########
  #R.....####
  ######.##D#
  ######....#
  ###########
program: |
  robot.avanzar(5)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_izquierda()
  robot.avanzar(3)
  robot.girar_izquierda()
  robot.avanzar(1)
  robot.entregar("Alfajores de penca")
```

## Por qué existe Python

```goals
- Contar quién creó Python, cuándo y qué problema quería resolver
- Comparar sus fortalezas y debilidades con JavaScript y C++
- Saber dónde se usa hoy y por qué encaja ahí
```

Quilla solo entiende Python, y no es capricho de fábrica. Para saber por qué la sucursal del Callao eligió ese idioma, hay que viajar a Ámsterdam, en la Navidad de 1989. Esta lección es contexto: si una palabra no te suena (GIL, JIT, PyPI), sigue de largo; todas vuelven más adelante con sentido.

### El problema de 1989

<!-- photo: guido-van-rossum-2006 -->

**Guido van Rossum** trabajaba en el **CWI**, un instituto de investigación en matemáticas e informática de los Países Bajos. Antes había sido parte del equipo de **ABC**, un lenguaje para enseñar a programar: clarísimo de leer, pero cerrado; no se podía extender ni hablaba bien con el sistema operativo (archivos, procesos, la red). Después pasó al proyecto **Amoeba**, un sistema operativo distribuido, y ahí chocó con el problema de siempre: escribir herramientas de administración en **C** tomaba demasiado tiempo, y los scripts de la terminal (*shell*) se quedaban cortos en cuanto la tarea se complicaba.

¿Qué es eso de "hablar con el sistema operativo"? Tu programa no toca el disco ni la red por su cuenta: se lo **pide** al sistema operativo (Windows, Linux o, en el caso de Guido, Amoeba), que es el que manda sobre la máquina. Cada pedido se llama una **llamada al sistema**: "abre este archivo", "dame lo que dice", "arranca este otro programa". Un lenguaje sirve para administrar computadoras solo si sabe hacer esas llamadas, y mientras más fácil, mejor:

<!-- /photo -->

```red
title: Pedirle algo al sistema, en cada lenguaje
nodes:
  - { id: prog, icon: program, label: Tu programa, sub: quiere leer notas.txt }
  - { id: os, icon: os, label: Sistema operativo, sub: "Amoeba, Unix…: manda sobre la máquina" }
  - { id: disk, icon: disk, label: El disco, sub: "donde está guardado notas.txt" }
links:
  - { id: call, label: llamada al sistema, busy: no llega }
  - { id: hw }
steps:
  - phase: Qué es una llamada al sistema
    move: [prog, os]
    packet: { kind: up, label: '"abre notas.txt"' }
    note: El programa no lee el disco directamente. Le **pide** al sistema operativo que abra el archivo.
  - move: [os, disk]
    packet: { kind: up, label: '"abre notas.txt"' }
    note: El sistema operativo, que sí manda sobre el disco, busca el archivo.
  - move: [disk, prog]
    dur: 1400
    packet: { kind: down, label: lo que dice el archivo }
    note: Y le devuelve el contenido al programa. Eso es una llamada al sistema, pedir y recibir.
  - phase: ABC
    at: prog
    dim: [os, disk]
    busy: [call]
    tags: { prog: sin esa puerta }
    note: "**ABC** se leía clarísimo, pero vivía encerrado en su propio mundo: no daba una forma práctica de hacer esas llamadas ni de agregarle funciones nuevas. Para administrar un sistema, no servía."
  - phase: C
    move: [prog, os]
    packet: { kind: up, label: '"abre notas.txt"' }
    note: "**C** llega a todo, pero hay que escribir cada detalle: abrir, revisar si falló, leer por pedazos, cerrar. Para una herramienta chiquita, mucho trabajo."
    show:
      label: Mostrar un archivo, en C
      text: |
        #include <stdio.h>

        int main(void) {
            FILE *f = fopen("notas.txt", "r");
            if (f == NULL) return 1;
            char linea[256];
            while (fgets(linea, sizeof linea, f))
                fputs(linea, stdout);
            fclose(f);
            return 0;
        }
  - phase: Shell
    at: prog
    busy: [call]
    dim: [os, disk]
    tags: { prog: "cat notas.txt" }
    note: Los scripts de **shell** (los comandos de la terminal) son cortos, y en Unix `cat notas.txt` basta. Pero Amoeba tenía sus propias llamadas al sistema y el shell no llegaba bien a ellas; además, en cuanto la tarea pedía decisiones y cálculos, el script se volvía un enredo.
  - phase: Python
    move: [prog, os]
    packet: { kind: up, label: '"abre notas.txt"' }
    note: "**Python** quería lo mejor de los dos: leerse casi como ABC y llegar al sistema como C. Dos líneas, y se entienden."
    show:
      label: Mostrar un archivo, en Python
      text: |
        with open("notas.txt") as archivo:
            print(archivo.read())
caption: Lo de Amoeba y el shell lo cuenta el propio Python en su FAQ general, en "¿Por qué se creó Python en primer lugar?".
```

Le faltaba algo en medio: tan fácil de leer como ABC, pero capaz de hacer todo lo que hace C llamando al sistema. En las vacaciones de Navidad de 1989 empezó a escribirlo como pasatiempo. Le puso **Python** por *Monty Python's Flying Circus*, el programa de comedia británico, no por la serpiente. En **febrero de 1991** publicó la versión 0.9.0 en Usenet (los foros de internet de la época).

```figura
title: Python en el tiempo
panes:
  - timeline:
      - when: "1989"
        title: "CWI, Ámsterdam"
        text: "Guido empieza Python en Navidad, como pasatiempo"
      - when: "1991"
        title: "0.9.0"
        text: "Primera versión pública, en Usenet"
      - when: "2000"
        title: "Python 2"
        text: "Comprensiones de listas; la comunidad crece"
      - when: "2006–2008"
        title: "NumPy, pandas"
        text: "Python se vuelve herramienta de ciencia y datos"
      - when: "2008"
        title: "Python 3"
        text: "Rompe compatibilidad para corregir errores de diseño"
      - when: "2015–2016"
        title: "TensorFlow, PyTorch"
        text: "Python se vuelve el idioma de la IA"
      - when: "2020"
        title: "Fin de Python 2"
        text: "Se termina una mudanza de casi doce años"
      - when: "2024–2025"
        title: "3.13 y 3.14"
        text: "Llega Python sin GIL, todavía opcional"
```

## Lo mínimo

Un programa guarda **valores** en **variables** y los usa. Python tiene cinco tipos básicos para empezar: números enteros (`int`), números con decimales (`float`), textos (`str`, entre comillas), booleanos (`True` o `False`, con mayúscula) y `None`, que significa "nada todavía". Con `print` miras qué hay dentro de cualquier cosa, y con `type` preguntas de qué tipo es.

**Cómo se ejecuta esto.** Tú escribes texto. Un programa llamado **intérprete** (el de Python) lo lee línea por línea y hace lo que dice. En Loop, el botón ▶ le entrega tu texto al intérprete, y lo que mandas con `print` aparece en la **consola**, el panel de abajo.

```py run
nombre = "Quilla"
bateria = 100
bateria = bateria - 15
print(f"{nombre} tiene {bateria}% de batería")
print(type(nombre), type(bateria), type(1.5), type(True), type(None))
```

Una variable es un **nombre** que le pegas a un valor, como una etiqueta. El valor vive aparte y el nombre solo lo **señala**: con `=` pegas la etiqueta, la lees cuando quieras, y si asignas otra vez, la etiqueta se despega y se pega a otro valor. Dale a ▶ y mira moverse cada etiqueta línea por línea; los valores que se quedan sin nombre se descartan:

```anima
title: Un nombre es una etiqueta pegada a un valor
code: |
  nombre = "Quilla"
  bateria = 100
  bateria = bateria - 15
  bateria = bateria - 30
  destino = None
  destino = "Rímac"
  print(f"{nombre} va al {destino} con {bateria}%")
refs: all
notes:
  1: La etiqueta nombre queda pegada a un texto (str).
  2: La etiqueta bateria queda pegada al número 100.
  3: Se calcula 100 - 15 y sale un valor nuevo, el 85. La etiqueta bateria se despega del 100 y se pega al 85.
  4: Lo mismo otra vez; el 85 se queda sin nombre.
  5: None quiere decir "todavía no hay destino". También es un valor, y destino se pega a él.
  6: Reasignar mueve la etiqueta a otro valor, aunque sea de otro tipo. El tipo es del valor, no del nombre.
  7: La f delante de las comillas mete los valores dentro del texto.
```

Lo que necesitas para hoy:

- **Nombres en `snake_case`.** En Python las variables van en minúsculas con guion bajo: `precio_por_kilo`, `lleva_carga`. Nada de `precioPorKilo`.
- **f-strings.** Una `f` antes de las comillas y cada `{…}` adentro se reemplaza por su valor: `f"Pedido {numero}"`.
- **`print` acepta varias cosas** separadas por comas y las imprime con un espacio en medio. `sep=` cambia ese separador y `end=` cambia lo que va al final (normalmente, un salto de línea).
- **Tres divisiones.** `/` siempre da un `float` (`7 / 2` es `3.5`); `//` da cuántas veces cabe, sin decimales (`7 // 2` es `3`); `%` da lo que sobra (`7 % 2` es `1`).
- **Convertir.** `int("12")` da el número 12, `float("2.5")` da 2.5 y `str(30)` da el texto `"30"`.

```py run
alfajores = 14
por_caja = 4
print(alfajores / por_caja, alfajores // por_caja, alfajores % por_caja, sep=" | ")
print("Cajas llenas:", alfajores // por_caja, end="")
print(" (y sobran", alfajores % por_caja, "alfajores)")
```

> **Trampa común:** en Python, `"3" + 2` no da `"32"` ni `5`: es un `TypeError`, porque Python no mezcla textos con números por su cuenta. Si un número te llega como texto (de `input()`, de un sensor), conviértelo primero: `int("3") + 2` da `5`, y `"3" + str(2)` da `"32"`.

<!-- legacy: fstrings -->

<!-- legacy: print-function -->

<!-- legacy: int-division -->

<!-- mdn: fstrings print-function int-division type-conversion -->

## Para curiosos

Para curiosos: por qué se lee así, con qué se compara y dónde se usa. Si una palabra no te suena, sigue de largo; vuelve más adelante con sentido.

### Legible a propósito

La idea central de Python es que el código se lee mucho más de lo que se escribe. Por eso la **sangría es parte del lenguaje**: lo que está adentro de un `if` o de un bucle se ve adentro, porque está más a la derecha, sin llaves de por medio. Y por eso las palabras clave son palabras en inglés (`and`, `or`, `not`, `in`) en lugar de símbolos.

En 1999, Tim Peters resumió esa filosofía en 19 aforismos, el **Zen de Python** (hoy es el PEP 20). Viene escondido dentro del propio lenguaje: escribe `import this` en cualquier Python y aparece completo. Tres de sus líneas:

> *Beautiful is better than ugly.* (Lo bello es mejor que lo feo.)
>
> *Readability counts.* (La legibilidad cuenta.)
>
> *There should be one-- and preferably only one --obvious way to do it.* (Debería haber una forma obvia de hacerlo, y de preferencia solo una.)

En **2008** llegó **Python 3**, que rompió compatibilidad a propósito para corregir errores de diseño: `print` pasó a ser una función, los textos pasaron a ser Unicode (para que la ñ y las tildes no salieran como garabatos) y `7 / 2` empezó a dar `3.5`. La mudanza fue larga: Python 2 recién dejó de recibir soporte el **1 de enero de 2020**. Por eso, a lo largo del curso, verás cajas **"En código viejo verás…"**: te enseñan a reconocer el Python antiguo y a escribir el de hoy.

```idea
Python nació para tener la claridad de un lenguaje de enseñanza con el poder de uno de sistemas: se escribe para que otra persona lo entienda.
```

### Fortalezas y debilidades

La misma tarea, sumar los precios de un pedido, en tres lenguajes:

**Python**

```py
precios = [18.5, 12, 6]
total = sum(precios)
print(total)
```

**JavaScript**

```js
const precios = [18.5, 12, 6];
const total = precios.reduce((a, b) => a + b, 0);
console.log(total);
```

**C++**

```
#include <iostream>
#include <numeric>
#include <vector>
int main() {
  std::vector<double> precios{18.5, 12, 6};
  double total = std::accumulate(
    precios.begin(), precios.end(), 0.0);
  std::cout << total << "\n";
}
```

Python dice lo que hace y nada más. C++ pide más, pero a cambio corre mucho más rápido.

```figura
title: Python frente a otros
panes:
  - table:
      head: ["", "Python", "JavaScript", "C++"]
      rows:
        - ["Leer código ajeno", "**Lo más fácil**", "Medio", "Difícil"]
        - ["Velocidad en bucles puros", "Lenta", "Rápida (motor JIT)", "**La más rápida**"]
        - ["Biblioteca estándar", "**Enorme (\"pilas incluidas\")**", "Pequeña", "Mediana"]
        - ["Datos e IA", "**NumPy, pandas, PyTorch**", "Pocas opciones", "Por debajo de las librerías de Python"]
        - ["Varios núcleos a la vez", "Limitado por el GIL (cambiando)", "Un hilo; workers aparte", "**Hilos de verdad**"]
        - ["Navegador y celular", "Poco (vía WebAssembly)", "**De fábrica en el navegador**", "Vía WebAssembly o apps nativas"]
```

**Fortalezas.**

- **Se lee casi como pseudocódigo**: por eso es el primer lenguaje en tantos colegios y universidades, y por eso Loop lo eligió para Quilla: Maru quiere que cualquiera del equipo entienda lo que el robot va a hacer antes de soltarlo en la calle.
- **Pilas incluidas** (*batteries included*): sin instalar nada trae para leer CSV y JSON, manejar fechas, hablar con una base de datos SQLite, comprimir archivos y mucho más.
- **Librerías para datos, IA y automatización**: NumPy, pandas, scikit-learn, PyTorch, Jupyter. El truco es que Python hace de **pegamento**: el trabajo pesado corre en C, C++ o en la tarjeta gráfica, y tú lo diriges con código legible.
- **Números enteros sin techo**: un `int` crece todo lo que haga falta.

```exercise
id: py1-origen-potencia
type: predict
title: Un número enorme
prompt: |
  ¿Qué imprime Python con esta potencia tan grande?
code: |
  print(2 ** 64)
options:
  - "18446744073709551616"
  - "1.8446744073709552e+19"
  - OverflowError
  - "0"
answer: "18446744073709551616"
explain: |
  Los enteros de Python no tienen tope: el resultado sale exacto, dígito por dígito. En JavaScript, `2 ** 64` da `18446744073709552000` (los últimos dígitos se pierden), y en C++ un entero de 64 bits se desborda.
```

**Debilidades.**

- **Velocidad**: el intérprete normal (CPython) va instrucción por instrucción; en bucles puros suele ser varias veces más lento que JavaScript y mucho más que C++. Se compensa usando librerías escritas en C y eligiendo bien las estructuras de datos (lo verás en la sesión de rendimiento).
- **El GIL**: en CPython, un candado global deja que un solo hilo ejecute código Python a la vez, así que más hilos no reparten un cálculo entre núcleos. Python 3.13 (2024) trajo una versión **sin GIL** experimental, y desde 3.14 (2025) es oficial pero **opcional**: a 2026, la instalación de siempre sigue trayendo el GIL.
- **Empaquetado**: pip, venv, conda, Poetry, uv… hay muchas formas de instalar librerías y aislar proyectos, y el clásico "en mi máquina sí funciona" sale de ahí.
- **Navegador y celular**: el navegador no habla Python. Este curso lo corre con **Pyodide** (Python compilado a WebAssembly), y por eso la primera vez Quilla tarda unos segundos en despertar. Para apps móviles casi nadie lo usa.

### Dónde se usa hoy

```figura
title: Dónde vive Python
panes:
  - table:
      head: ["Dónde", "Por qué encaja"]
      rows:
        - ["**Datos e inteligencia artificial**", "Las librerías clave (NumPy, pandas, PyTorch) se usan desde Python"]
        - ["**Ciencia e investigación**", "Notebooks de Jupyter: código, gráficos y texto en un mismo lugar"]
        - ["**Automatización y scripts**", "Pilas incluidas: archivos, red y sistema sin instalar nada"]
        - ["**Servidores web**", "Django y FastAPI permiten armar una API rápido y claro"]
        - ["**Enseñanza**", "Se lee casi como pseudocódigo"]
```

Python encaja donde importa más el tiempo de quien programa que el de la máquina: explorar datos, probar una idea, automatizar una tarea aburrida, unir piezas escritas en otros lenguajes. El boom de la IA lo empujó todavía más. En la encuesta de **Stack Overflow 2025**, su uso subió 7 puntos en un año, hasta 57.9 % de quienes respondieron, y en la de **2026** marcó 58.0 % (JavaScript, 62.0 %). En **GitHub Octoverse 2024** pasó a JavaScript como el lenguaje más usado en GitHub; en **Octoverse 2025** quedó segundo, detrás de TypeScript. Son fotos de un año, no verdades eternas: revisa la edición más reciente.

```recap
- Guido van Rossum lo empezó en el CWI de Ámsterdam en la Navidad de 1989 y lo publicó en 1991.
- Quería la claridad de ABC con el poder de C para administrar sistemas; el nombre viene de Monty Python.
- "La legibilidad es su meta de diseño: sangría como sintaxis y el Zen de Python (`import this`)."
- Python 3 (2008) rompió compatibilidad para corregir errores; Python 2 terminó en 2020.
- "Fortalezas: legible, pilas incluidas, librerías de datos e IA. Debilidades: velocidad, el GIL (ahora opcional), empaquetado, navegador y celular."
```

**Fuentes**

- Guido van Rossum, [prólogo de *Programming Python*](https://www.python.org/doc/essays/foreword/) (1996), y [The History of Python](https://python-history.blogspot.com/2009/01/introduction-and-overview.html) (2009).
- Python, [preguntas frecuentes generales](https://docs.python.org/es/3/faq/general.html) y [PEP 20, el Zen de Python](https://peps.python.org/pep-0020/).
- [PEP 373: Python 2.7](https://peps.python.org/pep-0373/) (fin de soporte) y [Sunsetting Python 2](https://www.python.org/doc/sunset-python-2/).
- [PEP 703](https://peps.python.org/pep-0703/) y [PEP 779](https://peps.python.org/pep-0779/) (Python sin GIL), y [Python support for free threading](https://docs.python.org/3/howto/free-threading-python.html).
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology) y [2026](https://survey.stackoverflow.co/2026/technology).
- GitHub, [Octoverse 2024](https://github.blog/news-insights/octoverse/octoverse-2024/) y [Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).

## Práctica

```exercise
id: py1-predice-bateria
type: predict
title: La primera carga
prompt: |
  Antes de ejecutarlo: ¿qué imprime?
code: |
  nombre = "Quilla"
  bateria = 90
  bateria = bateria - 25
  print(nombre, bateria, sep=": ", end="%\n")
options:
  - "Quilla: 65%"
  - "Quilla 65"
  - "Quilla: 90%"
  - "nombre: bateria%"
answer: "Quilla: 65%"
explain: |
  `bateria` empieza en 90 y se reasigna a `90 - 25`. `sep=": "` va entre los valores, y `end="%\n"` se escribe al final en lugar del salto de línea de siempre.
```

```exercise
id: py1-predice-divisiones
type: predict
title: Alfajores por caja
prompt: |
  Don Teodoro tiene 14 alfajores y en cada caja entran 4. ¿Qué imprime?
code: |
  alfajores = 14
  por_caja = 4
  print(alfajores / por_caja)
  print(alfajores // por_caja, alfajores % por_caja)
options:
  - "3.5\n3 2"
  - "3\n3 2"
  - "3.5\n3.5 2"
  - "3.5\n2 3"
answer: "3.5\n3 2"
explain: |
  `/` siempre da un `float`: 3.5. `//` dice cuántas cajas se llenan enteras (3) y `%` cuántos alfajores sobran (2), porque `3 * 4 + 2` es 14.
```

```exercise
id: py1-predice-tipos
type: predict
title: La balanza que habla en texto
prompt: |
  La balanza de la tienda devuelve el peso como texto. ¿Qué imprime este programa?
code: |
  peso = "2.5"
  cajas = 3
  print(type(peso), type(cajas))
  print(float(peso) * cajas)
options:
  - "<class 'str'> <class 'int'>\n7.5"
  - "<class 'float'> <class 'int'>\n7.5"
  - "<class 'str'> <class 'int'>\n2.52.52.5"
  - "<class 'str'> <class 'int'>\n7"
answer: "<class 'str'> <class 'int'>\n7.5"
explain: |
  `peso` es un `str` aunque parezca número: tiene comillas. `float(peso)` lo convierte en 2.5 y entonces sí se multiplica: 7.5. Sin convertir, `peso * 3` repetiría el texto tres veces (`"2.52.52.5"`).
```

```exercise
id: py1-completa-ficha
type: complete
title: La ficha de Quilla
prompt: |
  Maru llena la ficha del robot nuevo. Reemplaza cada `___`:

  - se llama **Quilla** (un texto);
  - avanza a **1.5** casillas por segundo (un número con decimales);
  - **lleva carga** (un booleano, verdadero);
  - todavía **no tiene destino** (nada).
starter: |
  nombre = ___
  bateria = 100
  velocidad = ___
  lleva_carga = ___
  destino = ___
  print(f"{nombre}: {bateria}% de batería, carga: {lleva_carga}, destino: {destino}")
  print(type(velocidad))
solution: |
  nombre = "Quilla"
  bateria = 100
  velocidad = 1.5
  lleva_carga = True
  destino = None
  print(f"{nombre}: {bateria}% de batería, carga: {lleva_carga}, destino: {destino}")
  print(type(velocidad))
hints:
  - Los textos van entre comillas. `True` y `None` van sin comillas y con la primera letra en mayúscula.
  - En Python, el decimal se escribe con punto, no con coma.
tests:
  - name: nombre es el texto "Quilla"
    expect: 'nombre == "Quilla"'
  - name: velocidad es el float 1.5
    expect: velocidad == 1.5 and type(velocidad) == float
    msg: velocidad debe ser 1.5, sin comillas.
  - name: lleva_carga es el booleano True
    expect: lleva_carga is True
    msg: lleva_carga debe ser True, sin comillas y con T mayúscula.
  - name: destino es None
    expect: destino is None
    msg: '"Nada todavía" en Python es None, sin comillas.'
  - name: la consola muestra la ficha
    output: "Quilla: 100% de batería, carga: True, destino: None\n<class 'float'>"
```

```exercise
id: py1-arregla-sensor
type: fix
title: El sensor de carga
prompt: |
  El sensor de carga de Quilla devuelve cuántos paquetes lleva, pero **como texto**. Este programa debería sumar los 2 paquetes que Don Teodoro agregó al final, y se cae. Ejecútalo, lee el error y arréglalo convirtiendo el valor del sensor, sin cambiar la línea del sensor.
starter: |
  paquetes = "3"  # así lo entrega el sensor
  agregados = 2
  total = paquetes + agregados
  print("Paquetes en la caja:", total)
solution: |
  paquetes = "3"  # así lo entrega el sensor
  agregados = 2
  total = int(paquetes) + agregados
  print("Paquetes en la caja:", total)
hints:
  - El error dice que no se puede sumar un `str` con un `int`. ¿Cuál de los dos es el texto?
  - "`int(\"3\")` da el número 3."
tests:
  - name: total es el número 5
    expect: total == 5
  - name: imprime los paquetes
    output: "Paquetes en la caja: 5"
  - name: el sensor sigue entregando texto
    source: '^paquetes\s*=\s*"3"'
    msg: No cambies la línea del sensor; convierte su valor con int() al sumar.
```

```exercise
id: py1-escribe-costo
type: write
title: Cuánto cobrar
prompt: |
  Calcula en `costo` lo que cuesta llevar los alfajores y muéstralo como `Costo del envío: S/ 13.0`.

  Loop cobra **4 soles** de base más **1.5 soles por kilómetro**, y la casa de la comadre está a **6 km** de la tienda. Guarda esos tres datos en tres variables con nombres en `snake_case` y calcula el total con ellas. (El `.0` sale porque `1.5` es un `float`, y todo lo que lo toca también lo es.)
visual:
  figure:
    title: Así se arma la tarifa
    panes:
      - receipt:
          title: LOOP CHUCUITO · ENVÍO
          rows: [["Tarifa base", "4.00"], ["6 km × 1.5", "9.00"]]
          total: "13.00"
starter: |
  # Tus tres variables:

  # El total:
  costo = 0
  print(f"Costo del envío: S/ {costo}")
solution: |
  tarifa_base = 4
  precio_por_km = 1.5
  distancia_km = 6
  costo = tarifa_base + precio_por_km * distancia_km
  print(f"Costo del envío: S/ {costo}")
hints:
  - La multiplicación va antes que la suma, como en el colegio.
  - "`costo = tarifa_base + precio_por_km * distancia_km`"
tests:
  - name: costo vale 13
    expect: costo == 13
  - name: la consola muestra el costo
    output: "Costo del envío: S/ 13.0"
  - name: el total se calcula con variables, no a mano
    source: '^costo\s*=\s*[a-z_]\w*\s*[+*]'
    msg: Calcula costo a partir de tus variables, no escribas 13 directamente.
  - name: nombres en snake_case
    sourceNot: '^\s*[a-z]+[A-Z]\w*\s*='
    msg: En Python los nombres van en snake_case, como tarifa_base, no tarifaBase.
```

```exercise
id: py1-escribe-salida
type: write
title: La primera vuelta
prompt: |
  Lleva a Quilla hasta el buzón (D) y haz que diga `Hola, soy Quilla` con `robot.decir()`, armando el texto con una f-string y la variable `nombre`.

  Es la vuelta de prueba por el muelle. Quilla empieza mirando al este.

  Lo que Quilla entiende hoy: `robot.avanzar(n)`, `robot.girar_izquierda()`, `robot.girar_derecha()` y `robot.decir(texto)`. Pulsa **Probar** y mira el mapa.
starter: |
  nombre = "Quilla"
  robot.avanzar(1)
solution: |
  nombre = "Quilla"
  robot.avanzar(1)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_izquierda()
  robot.avanzar(3)
  robot.decir(f"Hola, soy {nombre}")
hints:
  - Cuenta las casillas libres de cada tramo con el dedo. Mirando al este, girar a la derecha te deja mirando al sur.
  - "`robot.decir(f\"Hola, soy {nombre}\")`"
world:
  theme: barranco
  level: 1
  dir: E
  map: |
    #######
    #R.####
    ##.####
    ##...D#
    #######
tests:
  - name: Quilla llega al buzón
    state: w.at_goal
    msg: Quilla no terminó sobre el buzón.
  - name: dice "Hola, soy Quilla"
    state: '"Hola, soy Quilla" in w.said'
    msg: Haz que diga exactamente "Hola, soy Quilla".
  - name: el saludo usa una f-string
    source: '\bf"[^"]*\{nombre\}'
    msg: Arma el saludo con f"…{nombre}…".
```

## El caso

```exercise
id: py1-caso-balanza
type: case
title: La balanza del mercado
prompt: |
  **Calcula cuánto debió cobrar cada robot (kilos × precio por kilo) y compáralo con lo que cobró.** El que no cuadra está cobrando de más.

  En el Mercado Central del Callao, cuatro puestos tienen robots que pesan y cobran solos. Una caserita se quejó con Maru: "a mí me cobraron de más". La balanza de cada puesto imprime el peso **como texto** (`"2.5"`), así que antes de multiplicar tendrás que convertirlo.

  Imprime una línea por robot que empiece con su nombre, por ejemplo `print("Tumi:", cobro_tumi)`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py1-caso-balanza
    task: "Lo que debió cobrar = kilos × precio por kilo. Compáralo con lo que cobró cada robot."
    cards:
      - name: Tumi
        kind: robot
        role: Puesto de frutas
        with: { name: Señora Elsa, kind: person, label: le vendió a la señora Elsa }
        rows: [["Producto", "limón"], ["La balanza marcó", "2.5 kg"], ["Cobró", "S/ 10"]]
        clue: { find: "Tumi", says: 10, saysLabel: Cobró }
      - name: Chalaco
        kind: robot
        role: Puesto de pescado
        with: { name: Don Beto, kind: person, label: le vendió a Don Beto }
        rows: [["Producto", "bonito"], ["La balanza marcó", "1.5 kg"], ["Cobró", "S/ 21"]]
        clue: { find: "Chalaco", says: 21, saysLabel: Cobró }
      - name: Piqui
        kind: robot
        role: Puesto de tubérculos
        culprit: true
        with: { name: Caserita Nelly, kind: person, label: le vendió a la caserita Nelly }
        rows: [["Producto", "papa amarilla"], ["La balanza marcó", "4 kg"], ["Cobró", "S/ 16"]]
        clue: { find: "Piqui", says: 16, saysLabel: Cobró }
      - name: Ronco
        kind: robot
        role: Puesto de ajíes
        with: { name: Joven Iván, kind: person, label: le vendió al joven Iván }
        rows: [["Producto", "ají amarillo"], ["La balanza marcó", "0.75 kg"], ["Cobró", "S/ 9"]]
        clue: { find: "Ronco", says: 9, saysLabel: Cobró }
      - name: Precios del día
        kind: note
        role: La pizarra del mercado
        rows: [["Limón (kilo)", "S/ 4"], ["Bonito (kilo)", "S/ 14"], ["Papa amarilla (kilo)", "S/ 3.50"], ["Ají amarillo (kilo)", "S/ 12"]]
starter: |
  # Lo que marcó la balanza de cada puesto, en kilos (¡como texto!)
  peso_tumi = "2.5"     # limón
  peso_chalaco = "1.5"  # bonito
  peso_piqui = "4"      # papa amarilla
  peso_ronco = "0.75"   # ají amarillo

  # Precio por kilo, en soles
  precio_limon = 4
  precio_bonito = 14
  precio_papa = 3.5
  precio_aji = 12

  # TODO: calcula cuánto debió cobrar cada robot
  # e imprime una línea por robot, por ejemplo:
  # print("Tumi:", cobro_tumi)
solution: |
  peso_tumi = "2.5"
  peso_chalaco = "1.5"
  peso_piqui = "4"
  peso_ronco = "0.75"

  precio_limon = 4
  precio_bonito = 14
  precio_papa = 3.5
  precio_aji = 12

  cobro_tumi = float(peso_tumi) * precio_limon
  cobro_chalaco = float(peso_chalaco) * precio_bonito
  cobro_piqui = float(peso_piqui) * precio_papa
  cobro_ronco = float(peso_ronco) * precio_aji
  print("Tumi:", cobro_tumi)
  print("Chalaco:", cobro_chalaco)
  print("Piqui:", cobro_piqui)
  print("Ronco:", cobro_ronco)
answer: Piqui
answerLabel: ¿Qué robot cobró de más?
reveal: |
  Piqui. Cuatro kilos de papa amarilla a S/ 3.50 son `4.0 * 3.5 = 14.0`, y cobró 16: dos soles de más. Los otros tres cuadran: 10, 21 y 9.
hints:
  - "El primero, de ejemplo: `cobro_tumi = float(peso_tumi) * precio_limon` da 10.0, igual que lo que cobró Tumi. Haz lo mismo con los otros tres."
  - Sin `float()`, multiplicar un texto por un número no hace cuentas: lo repite o da un `TypeError`.
```

## El juez

Un juez es como los de las competencias de programación: tu programa **lee una entrada** y **escribe una salida**, y el juez lo prueba con los ejemplos del enunciado y con decenas de casos ocultos. En Python no hacen falta funciones especiales: se usan las de siempre.

- `input()` lee **la siguiente línea** de la entrada y la devuelve **como texto**, aunque traiga un número. Cada llamada lee una línea nueva.
- Para usarla como número, conviértela: `int(input())` o `float(input())`.
- Si una línea trae varios números separados por espacios, `input().split()` te da la lista de sus textos; eso lo usarás más adelante.

La respuesta se escribe con `print`, exactamente con el formato que pide el enunciado: ni un espacio ni una palabra de más.

```exercise
id: py1-juez-monedas
type: judge
title: El vuelto en monedas
prompt: |
  **Imprime cuántas monedas de 5 soles, cuántas de 1 sol y cuántos céntimos sobran, en una sola línea.**

  Don Teodoro le dio a Quilla una alcancía para el vuelto, y quiere que siempre lo entregue con la menor cantidad de monedas grandes: primero todas las de **5 soles** que se pueda, luego las de **1 sol**, y lo que quede en céntimos. Quilla recibe el vuelto en céntimos (1 sol son 100 céntimos).

  **Entrada:** una línea con un entero `C`: el vuelto en céntimos.

  **Salida:** una línea con tres enteros separados por un espacio: las monedas de 5 soles, las monedas de 1 sol y los céntimos que sobran.

  **Restricciones:** 0 ≤ C ≤ 100000.
starter: |
  centimos = int(input())
  # calcula las monedas de 5 soles, las de 1 sol y lo que sobra

  print(centimos)
solution: |
  centimos = int(input())
  monedas_cinco = centimos // 500
  resto = centimos % 500
  monedas_sol = resto // 100
  sobran = resto % 100
  print(monedas_cinco, monedas_sol, sobran)
hints:
  - Una moneda de 5 soles son 500 céntimos. `centimos // 500` dice cuántas caben y `centimos % 500` cuánto queda después.
  - Con lo que quedó, haz lo mismo con 100 (una moneda de 1 sol). Lo que sobre al final son los céntimos.
visual:
  figure:
    title: El ejemplo 1, moneda por moneda
    panes:
      - label: Entrada
        text: "1287"
      - label: Cómo se reparte
        table:
          head: ["Moneda", "Cuenta", "Cuántas"]
          rows: [["S/ 5", "1287 // 500", "2"], ["S/ 1", "287 // 100", "2"], ["céntimos", "287 % 100", "87"]]
      - label: Salida
        text: "2 2 87"
    caption: "Después de las dos monedas de 5 soles quedan `1287 % 500 = 287` céntimos para repartir."
samples:
  - input: "1287"
    output: "2 2 87"
    note: Dos monedas de 5 soles (1000), dos de 1 sol (200) y sobran 87 céntimos.
  - input: "350"
    output: "0 3 50"
    note: No alcanza para una de 5 soles.
edge:
  - input: "0"
    tag: cuando no hay vuelto
  - input: "500"
    tag: con una moneda de 5 soles exacta
  - input: "499"
    tag: justo antes de una moneda de 5 soles
  - input: "99"
    tag: con solo céntimos
  - input: "100000"
    tag: con el vuelto más grande
random:
  count: 40
  seed: 21
  tag: ""
  generate: |
    if rng.int(0, 1) == 0:
        return str(rng.int(0, 999))
    return str(rng.int(0, 100000))
wrong:
  - |
    centimos = int(input())
    monedas_cinco = centimos / 500
    resto = centimos % 500
    monedas_sol = resto / 100
    sobran = resto % 100
    print(monedas_cinco, monedas_sol, sobran)
  - |
    centimos = int(input())
    monedas_cinco = centimos // 500
    monedas_sol = centimos // 100
    sobran = centimos % 100
    print(monedas_cinco, monedas_sol, sobran)
  - |
    centimos = int(input())
    monedas_cinco = centimos // 500
    monedas_sol = centimos % 500 // 100
    sobran = centimos % 500
    print(monedas_cinco, monedas_sol, sobran)
```

## Misión final

```exercise
id: py1-mision-alfajores
type: mission
title: Los alfajores de penca
prompt: |
  **Arma la etiqueta del pedido y lleva a Quilla hasta el buzón de la comadre de Don Teodoro para entregarla.**

  Quilla sale de la tienda (arriba a la izquierda) con la **batería justa: 14 casillas**. El buzón está frente a la Alameda de los Descalzos. Si toma un desvío, se queda a medio camino.

  1. Arma en `etiqueta` el texto `Pedido 14: 2 cajas para Lucía Huamán` con una f-string y las variables `pedido`, `cajas` y `cliente`.
  2. Lleva a Quilla hasta el buzón y entrega con `robot.entregar(etiqueta)`.

  Cuando pase, junto con el juez, se desbloquea la sesión 2.
starter: |
  cliente = "Lucía Huamán"
  pedido = 14
  cajas = 2
  etiqueta = ""

  robot.avanzar(4)
solution: |
  cliente = "Lucía Huamán"
  pedido = 14
  cajas = 2
  etiqueta = f"Pedido {pedido}: {cajas} cajas para {cliente}"

  robot.avanzar(4)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_izquierda()
  robot.avanzar(4)
  robot.girar_izquierda()
  robot.avanzar(1)
  robot.girar_derecha()
  robot.avanzar(3)
  robot.entregar(etiqueta)
hints:
  - "Recorre el camino con el dedo: este, sur, este, norte y otra vez este. Cuenta las casillas de cada tramo; el camino de abajo es más largo y la batería no alcanza."
  - Mirando al sur, girar a la izquierda te deja mirando al este; mirando al este, girar a la izquierda te deja mirando al norte.
world:
  theme: barranco
  level: 1
  dir: E
  battery: 14
  map: |
    ###############
    #R....#########
    #####.###...D##
    #####.....#.###
    #..##.###...###
    ###############
tests:
  - name: 'la etiqueta es "Pedido 14: 2 cajas para Lucía Huamán"'
    expect: 'etiqueta == "Pedido 14: 2 cajas para Lucía Huamán"'
  - name: la etiqueta se arma con una f-string
    source: '\bf"[^"]*\{pedido\}[^"]*\{cajas\}[^"]*\{cliente\}'
    msg: Usa una f-string, f"…{pedido}…{cajas}…{cliente}", para armar la etiqueta.
  - name: Quilla llega al buzón
    state: w.at_goal
    msg: Quilla no terminó sobre el buzón de la comadre.
  - name: entrega el paquete con su etiqueta
    state: 'w.delivered == ["Pedido 14: 2 cajas para Lucía Huamán"]'
    msg: Falta robot.entregar(etiqueta) una vez, parado sobre el buzón.
```

## Reto experto

```exercise
id: py1-reto-reloj
type: challenge
title: El reloj interno de Quilla
visual:
  figure:
    title: De minutos a día y hora
    input: { label: minutos, text: "4000" }
    arrow: "// 1440 para el día, luego // 60 y % 60"
    output: { label: Salida, value: "Día 3, 18:40" }
    steps:
      - "Un día tiene 24 × 60 = 1440 minutos: `4000 // 1440` es 2 días completos, así que es el día 3."
      - "Lo que queda del día, `4000 % 1440`, son 1120 minutos: 18 horas y 40 minutos."
prompt: |
  **Imprime la hora del reloj interno como `Día N, HH:MM`.** Para quien ya programa. Quilla no tiene calendario: solo cuenta los minutos desde que Maru lo prendió, el día 1 a las 00:00. Convierte `minutos` en el día (empezando en 1) y la hora del día, con las horas y los minutos siempre a dos dígitos.

  Con `minutos = 4000` debe salir `Día 3, 18:40`; con `minutos = 125`, `Día 1, 02:05`. La variable `minutos` te llega del reloj y cambia en cada prueba.
starter: |
  # minutos ya existe
  print(minutos)
solution: |
  minutos_por_dia = 24 * 60
  dia = minutos // minutos_por_dia + 1
  minuto_del_dia = minutos % minutos_por_dia
  horas = minuto_del_dia // 60
  minuto = minuto_del_dia % 60
  print(f"Día {dia}, {horas:02d}:{minuto:02d}")
hints:
  - "`//` y `%` hacen todo el trabajo: primero con los minutos de un día, luego con 60."
  - "Dentro de una f-string, `{horas:02d}` escribe el entero con al menos dos dígitos, rellenando con ceros."
globals:
  minutos: 4000
scenarios:
  - tests:
      - name: 4000 minutos
        output: Día 3, 18:40
  - globals: { minutos: 125 }
    tests:
      - name: 125 minutos (con ceros a la izquierda)
        output: Día 1, 02:05
  - globals: { minutos: 0 }
    tests:
      - name: recién prendido
        output: Día 1, 00:00
  - globals: { minutos: 1439 }
    tests:
      - name: el último minuto del primer día
        output: Día 1, 23:59
  - globals: { minutos: 1440 }
    tests:
      - name: justo al empezar el día 2
        output: Día 2, 00:00
  - globals: { minutos: 10085 }
    tests:
      - name: una semana después
        output: Día 8, 00:05
```
