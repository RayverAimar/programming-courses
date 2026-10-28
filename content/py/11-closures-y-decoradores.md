# Sesión 11 — Funciones de primera clase, closures y decoradores

## El encargo

Ayacucho, barrio de Santa Ana, a tres semanas de Semana Santa. En el taller de la maestra **Teodora Huamaní** se hacen retablos: cajones de madera de cedro con dos o tres pisos, y dentro, cabecitas de pasta de papa y yeso que se modelan una por una, se secan en la repisa y se pintan a mano. Teodora paga por cabecita, así que cada artesano lleva su cuenta en una tableta.

El problema llegó con la primera quincena: las cuentas no cuadran, el higrómetro del cuarto de secado a veces no da lectura y nadie sabe quién revisó la galería de noche. Maru mandó a Quilla, con su sirena, a ordenar todo eso. Hoy Quilla aprende que una función también es un **valor**: se guarda, se pasa, se devuelve, **recuerda** cosas entre llamadas y puede envolver a otra función para vigilarla.

```escena
theme: museo
level: 2
dir: E
caption: La galería del taller de Teodora, de noche. Quilla hace sonar la sirena donde algo se mueve y cierra la puerta que quedó abierta.
map: |
  ###########
  #R........#
  ###P###O#P#
  ###m###.#.#
  ###########
program: |
  robot.avanzar(2)
  if robot.sensor()["movimiento"]:
      robot.alarma()
  robot.avanzar(4)
  if robot.sensor()["puerta"] == "abierta":
      robot.cerrar_puerta()
  robot.avanzar(2)
```

## Lo mínimo

En Python una función es un valor como cualquier otro: un nombre que apunta a ella. Sin paréntesis **no la llamas**, la nombras; así puedes guardarla en una variable, en una lista o pasársela a otra función.

```py run
def lijar(figura):
    return f"{figura} lijado"

tarea = lijar                     # sin (): la función misma
print(tarea("toro"))
print([paso("llama") for paso in [lijar, str.upper]])
```

Una función puede **crear otra función y devolverla**. La de adentro se lleva las variables del lugar donde nació y las sigue usando aunque la de afuera ya terminó: eso es un **closure**. Para **reasignar** una de esas variables desde adentro, decláralo con `nonlocal`.

```anima
title: Cada llamada a la fábrica crea una cuenta propia
code: |
  def crear_contador():
      cuenta = 0
      def sumar():
          nonlocal cuenta
          cuenta += 1
          return cuenta
      return sumar

  contar = crear_contador()
  contar()
  print(contar())
  otro = crear_contador()
  print(otro())
show: [cuenta]
notes:
  2: "Nace una cuenta nueva, en 0, dentro de esta llamada."
  9: "crear_contador terminó, pero sumar se llevó su cuenta."
  5: "nonlocal: la cuenta que cambia es la de crear_contador, no una nueva."
  12: "Otra llamada a la fábrica, otra cuenta: empieza en 0."
```

Y la misma película, dibujando **dónde vive cada cosa**:

```alcance
title: Cada llamada a la fábrica abre su propio cuarto
speed: 3600
steps:
  - note: "Al empezar solo existe el cuarto global. Guarda la fábrica `crear_contador`: la receta, todavía sin ninguna `cuenta`."
    rooms:
      - { id: g, name: global, fns: [{ name: crear_contador }] }
  - note: "`contar = crear_contador()` abre un cuarto nuevo para esta llamada. Ahí nace `cuenta = 0`."
    rooms:
      - id: g
        name: global
        fns: [{ name: crear_contador }]
        rooms:
          - { id: c1, name: "crear_contador(), llamada 1", on: true, vars: { cuenta: 0 } }
  - note: "Dentro nace `sumar`. Se queda con una cuerda atada al cuarto donde nació (la flecha): ahí está su `cuenta`."
    rooms:
      - id: g
        name: global
        fns: [{ name: crear_contador }]
        rooms:
          - { id: c1, name: "crear_contador(), llamada 1", on: true, vars: { cuenta: 0 }, fns: [{ name: sumar, env: c1 }] }
  - note: "La fábrica devuelve `sumar` y se guarda como `contar`. La llamada terminó, pero la cuerda de `contar` mantiene vivo su cuarto con su `cuenta`. Sin esa cuerda, el cuarto se habría descartado."
    rooms:
      - id: g
        name: global
        fns: [{ name: crear_contador }, { name: contar, env: c1 }]
        rooms:
          - { id: c1, name: "crear_contador(), llamada 1", gone: true, vars: { cuenta: 0 } }
  - note: "Cada `contar()` sube la `cuenta` de su cuarto, aunque la llamada a la fábrica ya terminó. `nonlocal` es lo que permite **reasignarla** desde `sumar`. Después de dos llamadas vale 2."
    rooms:
      - id: g
        name: global
        fns: [{ name: crear_contador }, { name: contar, env: c1 }]
        rooms:
          - { id: c1, name: "crear_contador(), llamada 1", gone: true, on: true, vars: { cuenta: 2 } }
  - note: "`otro = crear_contador()` abre **otro** cuarto, con otra `cuenta` y otra función. `otro()` sube la suya a 1; la de `contar` sigue en 2. No comparten nada."
    rooms:
      - id: g
        name: global
        fns: [{ name: crear_contador }, { name: contar, env: c1 }, { name: otro, env: c2 }]
        rooms:
          - { id: c1, name: "crear_contador(), llamada 1", gone: true, vars: { cuenta: 2 } }
          - { id: c2, name: "crear_contador(), llamada 2", gone: true, on: true, vars: { cuenta: 1 } }
```

- **Fábrica**: una función que devuelve funciones. Cada llamada crea variables nuevas, así que cada función que entrega tiene **su propia memoria**.
- **`nonlocal cuenta`**: sin esa línea, `cuenta += 1` crearía una variable local y Python se quejaría de que la lees antes de darle valor (`UnboundLocalError`). Para **leerla** o para cambiar una lista por dentro (`.append`) no hace falta.
- **`lambda`**: una función de una sola expresión, sin nombre. `lambda x: x * factor` sirve para devolver funciones cortas desde una fábrica.

```py run
def por_figura(soles):
    return lambda figuras: figuras * soles

pintar = por_figura(2)
modelar = por_figura(3)
print(pintar(10), modelar(10))
```

<!-- legacy: nonlocal -->

Un **decorador** es una función que recibe una función y devuelve otra que la **envuelve**: hace algo antes o después y llama a la original. `@bitacora` encima de un `def` es lo mismo que escribir `tallar = bitacora(tallar)` después.

```anima
title: La envoltura llama a la original
code: |
  def bitacora(funcion):
      def envoltura(*args):
          print("Empieza", funcion.__name__)
          resultado = funcion(*args)
          print("Termina", funcion.__name__)
          return resultado
      return envoltura

  @bitacora
  def tallar(figuras):
      return figuras * 4

  minutos = tallar(5)
  print(minutos)
notes:
  13: "tallar ya no es la original: es la envoltura que devolvió bitacora."
  4: "La envoltura llama a la tallar original, que guardó en funcion."
  6: "Si la envoltura no devuelve resultado, minutos quedaría en None."
```

El truco está en las etiquetas: antes de decorar, `tallar` señala la función original; después, señala la envoltura, que guarda la original en `funcion`.

```anima
title: "@bitacora le cambia la etiqueta a tallar"
code: |
  def tallar(figuras):
      return figuras * 4

  tallar = bitacora(tallar)
refs: all
steps:
  - line: 1
    vars: {}
    refs: { tallar: { r: f1 } }
    heap: { f1: { k: val, p: "función tallar (la original)" } }
    note: "`def tallar` pega la etiqueta `tallar` a una función."
  - line: 4
    vars: {}
    refs: { tallar: { r: f2 } }
    heap:
      f1: { k: val, p: "función tallar (la original)" }
      f2: { k: obj, cls: envoltura, items: [[funcion, { r: f1 }]] }
    note: "`bitacora(tallar)` devuelve una **envoltura** que guarda la original en `funcion`. La etiqueta `tallar` se mueve a la envoltura. `@bitacora` encima del `def` es exactamente esta línea."
  - line: 4
    vars: {}
    refs: { tallar: { r: f2 } }
    heap:
      f1: { k: val, p: "función tallar (la original)" }
      f2: { k: obj, cls: envoltura, items: [[funcion, { r: f1 }]] }
    out: "Empieza tallar\nTermina tallar"
    note: "Cuando llamas a `tallar(5)` entras, sin saberlo, a la envoltura: imprime «Empieza», llama a la original por `funcion` e imprime «Termina»."
```

- **`*args, **kwargs`** en la envoltura recogen cualquier argumento, y `funcion(*args, **kwargs)` se los pasa tal cual: así el decorador sirve para cualquier función.
- **`@functools.wraps(funcion)`** encima de la envoltura le copia el nombre y el docstring de la original. Sin eso, todas tus funciones decoradas se llaman `envoltura`.
- **Decorador con argumentos**: `@repetir(3)` primero llama a `repetir(3)`, que **devuelve** el decorador. Son tres funciones, una dentro de otra:

```py
def repetir(veces):
    def decorador(funcion):
        @functools.wraps(funcion)
        def envoltura(*args, **kwargs):
            return [funcion(*args, **kwargs) for _ in range(veces)]
        return envoltura
    return decorador
```

Mira las tres capas de `@repetir(3)` en el orden en que Python las ejecuta:

```anima
title: "@repetir(3) son tres capas, en orden"
code: |
  @repetir(3)
  def tallar(figuras):
      return figuras * 4
refs: all
steps:
  - line: 1
    vars: {}
    refs: { "repetir(3)": { r: d1 } }
    heap: { d1: { k: obj, cls: decorador, items: [[veces, { p: "3" }]] } }
    note: "Primero Python llama a `repetir(3)`. Esa llamada **devuelve** el decorador, que recuerda `veces = 3`."
  - line: 1
    vars: {}
    refs: { "repetir(3)": { r: d1 }, "decorador(tallar)": { r: w1 } }
    heap:
      d1: { k: obj, cls: decorador, items: [[veces, { p: "3" }]] }
      f1: { k: val, p: "función tallar (la original)" }
      w1: { k: obj, cls: envoltura, items: [[funcion, { r: f1 }], [veces, { p: "3" }]] }
    note: "Luego llama a ese decorador con la función de abajo: `decorador(tallar)`. Devuelve la **envoltura**, que guarda la original y el 3."
  - line: 2
    vars: {}
    refs: { tallar: { r: w1 } }
    heap:
      f1: { k: val, p: "función tallar (la original)" }
      w1: { k: obj, cls: envoltura, items: [[funcion, { r: f1 }], [veces, { p: "3" }]] }
    note: "Por último la etiqueta `tallar` queda pegada a la envoltura. Cada capa tiene un solo trabajo: `repetir` recuerda el 3, `decorador` recibe la función, `envoltura` la llama tres veces."
```

<!-- legacy: functools-wraps -->

`functools` trae dos herramientas listas. **`partial`** fija algunos argumentos de una función y te da otra más corta; **`@cache`** guarda cada resultado según sus argumentos y no lo vuelve a calcular.

```py run
import functools

@functools.cache
def secado(figuras):
    print("calculando", figuras)
    return figuras * 2 + 6

secar_diez = functools.partial(secado, 10)
print(secar_diez(), secar_diez(), secado(3))
```

> **Trampa común:** una `lambda` creada en un bucle no guarda el valor de la variable en ese momento, sino **la variable**. Cuando por fin la llamas, el bucle ya terminó y todas ven el último valor. Si necesitas el de cada vuelta, pásalo como valor por defecto: `lambda g=grosor: g * 10`, o usa una fábrica.

<!-- legacy: functools-cache -->

<!-- mdn: nonlocal functools-wraps functools-cache -->

## Práctica

```exercise
id: py11-predice-pinceles
type: predict
title: Los tres pinceles
prompt: |
  Quilla prepara tres pinceles, cada uno con su grosor. ¿Qué imprime?
code: |
  pinceles = []
  for grosor in [1, 2, 3]:
      pinceles.append(lambda: grosor * 10)

  print([pincel() for pincel in pinceles])
options:
  - "[10, 20, 30]"
  - "[30, 30, 30]"
  - "[10, 10, 10]"
  - "Un NameError: grosor ya no existe"
answer: "[30, 30, 30]"
explain: |
  Cada `lambda` recuerda la **variable** `grosor`, no el número que tenía al crearse. Cuando por fin se llaman, el bucle ya terminó y `grosor` vale 3 para las tres. Con `lambda g=grosor: g * 10` cada una se queda con su valor, porque el valor por defecto se calcula al crear la función.
```

```exercise
id: py11-completa-caja-chica
type: complete
title: La caja chica de cada artesano
prompt: |
  Teodora le da a cada artesano una caja chica para pintura. `abrir_caja(fondo)` devuelve una función `gastar(monto)`: si alcanza, descuenta el monto; si no, no hace nada. En los dos casos devuelve el saldo. Y `pintura` es una función corta que dice cuántos soles de pintura lleva un número de figuras (2 por figura).

  Completa los `___`.
starter: |
  def abrir_caja(fondo):
      """Una caja chica con su propio saldo."""
      saldo = fondo
      def gastar(monto):
          ___ saldo
          if monto <= saldo:
              saldo -= monto
          return saldo
      return gastar


  pintura = ___ figuras: figuras * 2

  caja_teodora = abrir_caja(50)
  caja_wilber = abrir_caja(20)
  print(caja_teodora(pintura(8)), caja_wilber(pintura(15)), caja_teodora(10))
solution: |
  def abrir_caja(fondo):
      """Una caja chica con su propio saldo."""
      saldo = fondo
      def gastar(monto):
          nonlocal saldo
          if monto <= saldo:
              saldo -= monto
          return saldo
      return gastar


  pintura = lambda figuras: figuras * 2

  caja_teodora = abrir_caja(50)
  caja_wilber = abrir_caja(20)
  print(caja_teodora(pintura(8)), caja_wilber(pintura(15)), caja_teodora(10))
hints:
  - "`gastar` le asigna a `saldo`, que nació en `abrir_caja`: hay que decírselo a Python con una palabra."
  - "Una función de una sola expresión y sin nombre empieza con `lambda`."
tests:
  - name: pintura(4) son 8 soles
    run: pintura(4)
    equals: 8
  - name: una caja recuerda lo gastado y no se sobregira
    run: '(lambda c: [c(5), c(30), c(10)])(abrir_caja(20))'
    equals: [15, 15, 5]
  - name: cada caja tiene su propio saldo
    run: '(lambda a, b: [a(3), b(4), a(3)])(abrir_caja(10), abrir_caja(10))'
    equals: [7, 6, 4]
  - name: la consola
    output: "34 20 24"
  - name: usa nonlocal
    source: '\bnonlocal\s+saldo\b'
```

```exercise
id: py11-arregla-decorador-mudo
type: fix
title: El decorador que se tragó el precio
prompt: |
  Wilber escribió `@anunciar` para que Quilla diga en voz alta qué está calculando. Desde entonces la cotización de dos retablos se cae. Ejecútalo, lee el error y arréglalo.

  De paso, haz que `precio_retablo.__name__` siga diciendo `"precio_retablo"` (hoy dice `"envoltura"`) con `@functools.wraps`.
starter: |
  import functools


  def anunciar(funcion):
      def envoltura(*args, **kwargs):
          print("Quilla calcula:", funcion.__name__)
          funcion(*args, **kwargs)
      return envoltura


  @anunciar
  def precio_retablo(pisos, figuras):
      """Soles: 120 por piso y 8 por figura."""
      return pisos * 120 + figuras * 8


  total = precio_retablo(2, 15) + precio_retablo(1, 6)
  print("Total:", total)
solution: |
  import functools


  def anunciar(funcion):
      @functools.wraps(funcion)
      def envoltura(*args, **kwargs):
          print("Quilla calcula:", funcion.__name__)
          return funcion(*args, **kwargs)
      return envoltura


  @anunciar
  def precio_retablo(pisos, figuras):
      """Soles: 120 por piso y 8 por figura."""
      return pisos * 120 + figuras * 8


  total = precio_retablo(2, 15) + precio_retablo(1, 6)
  print("Total:", total)
hints:
  - "La envoltura llama a la original, pero ¿qué hace con lo que esta devuelve? Una función sin `return` devuelve `None`."
  - "Pon `@functools.wraps(funcion)` justo encima de `def envoltura`."
tests:
  - name: precio_retablo(2, 15) devuelve 360
    run: precio_retablo(2, 15)
    equals: 360
  - name: el total es 528
    expect: total == 528
  - name: la consola
    output: "Quilla calcula: precio_retablo\nQuilla calcula: precio_retablo\nTotal: 528"
  - name: conserva el nombre
    expect: precio_retablo.__name__ == "precio_retablo"
    msg: Usa @functools.wraps(funcion) sobre la envoltura.
  - name: conserva el docstring
    expect: 'precio_retablo.__doc__ == "Soles: 120 por piso y 8 por figura."'
```

```exercise
id: py11-escribe-contar-llamadas
type: write
title: ¿Cuántas veces se lijó?
prompt: |
  Escribe el decorador `contar_llamadas(funcion)`: la función decorada hace lo mismo que antes (recibe los mismos argumentos y devuelve lo mismo), pero lleva la cuenta de cuántas veces la llamaron en el atributo `llamadas`.

  Las funciones son objetos, así que puedes ponerles atributos: escribe `envoltura.llamadas = 0` antes de devolverla y súmale 1 en cada llamada. Usa `@functools.wraps` para que conserve su nombre.
visual:
  figure:
    title: Lo que se ve desde afuera
    input: { label: llamadas, text: "lijar(\"toro\")\nlijar(\"llama\", minutos=8)" }
    arrow: "@contar_llamadas"
    output: { label: después, cards: [{ title: lijar, rows: [["__name__", "\"lijar\""], ["llamadas", "2"]] }] }
starter: |
  import functools


  def contar_llamadas(funcion):
      pass


  @contar_llamadas
  def lijar(figura, minutos=5):
      return f"{figura} lijado en {minutos} min"


  print(lijar("toro"))
  print(lijar("llama", minutos=8))
  print(lijar.llamadas)
solution: |
  import functools


  def contar_llamadas(funcion):
      @functools.wraps(funcion)
      def envoltura(*args, **kwargs):
          envoltura.llamadas += 1
          return funcion(*args, **kwargs)
      envoltura.llamadas = 0
      return envoltura


  @contar_llamadas
  def lijar(figura, minutos=5):
      return f"{figura} lijado en {minutos} min"


  print(lijar("toro"))
  print(lijar("llama", minutos=8))
  print(lijar.llamadas)
hints:
  - "Dentro de `contar_llamadas`, define `envoltura(*args, **kwargs)`, ponle `envoltura.llamadas = 0` y devuélvela."
  - "En cada llamada: `envoltura.llamadas += 1` y `return funcion(*args, **kwargs)`."
tests:
  - name: lijar sigue devolviendo lo mismo
    run: 'lijar("retablo", minutos=12)'
    equals: retablo lijado en 12 min
  - name: cuenta las llamadas
    run: '(lambda f: [f(2), f(3), f.llamadas])(contar_llamadas(lambda x: x * x))'
    equals: [4, 9, 2]
  - name: cada función decorada cuenta lo suyo
    run: '(lambda a, b: [a(), a(), b(), a.llamadas, b.llamadas])(contar_llamadas(lambda: 1), contar_llamadas(lambda: 2))'
    equals: [1, 1, 2, 2, 1]
  - name: conserva el nombre
    expect: lijar.__name__ == "lijar"
  - name: la consola
    output: "toro lijado en 5 min\nllama lijado en 8 min\n2"
```

```exercise
id: py11-completa-cotizador
type: complete
title: El aserradero que contesta lento
prompt: |
  Para cotizar, Quilla le pregunta el precio de la madera al aserradero de la avenida Mariscal Cáceres, que tarda en contestar. `consultas` cuenta cuántas veces le preguntó.

  Completa los `___`: que `precio_madera` **no pregunte dos veces lo mismo**, y que `cotizar_cedro` sea `cotizar` con la madera ya fijada en `"cedro"`. Con los cinco pedidos, Quilla debe consultar solo **dos** veces.
starter: |
  import functools

  consultas = 0


  @functools.___
  def precio_madera(madera):
      """Soles por piso, según el aserradero."""
      global consultas
      consultas += 1
      return {"cedro": 30, "aliso": 18, "pino": 12}[madera]


  def cotizar(madera, pisos, figuras):
      return pisos * precio_madera(madera) + figuras * 5


  cotizar_cedro = functools.___(cotizar, "cedro")

  for pisos, figuras in [(2, 10), (3, 4), (1, 20), (2, 6)]:
      print(cotizar_cedro(pisos, figuras))
  print(cotizar("pino", 1, 3))
  print("Consultas:", consultas)
solution: |
  import functools

  consultas = 0


  @functools.cache
  def precio_madera(madera):
      """Soles por piso, según el aserradero."""
      global consultas
      consultas += 1
      return {"cedro": 30, "aliso": 18, "pino": 12}[madera]


  def cotizar(madera, pisos, figuras):
      return pisos * precio_madera(madera) + figuras * 5


  cotizar_cedro = functools.partial(cotizar, "cedro")

  for pisos, figuras in [(2, 10), (3, 4), (1, 20), (2, 6)]:
      print(cotizar_cedro(pisos, figuras))
  print(cotizar("pino", 1, 3))
  print("Consultas:", consultas)
hints:
  - "El decorador que recuerda resultados por argumento es `functools.cache`."
  - "`functools.partial(cotizar, \"cedro\")` deja fijo el primer argumento."
tests:
  - name: solo dos consultas al aserradero
    expect: consultas == 2
    msg: Con @functools.cache, el cedro se consulta una vez y el pino otra.
  - name: cotizar_cedro(4, 0) son 120
    run: cotizar_cedro(4, 0)
    equals: 120
  - name: la consola
    output: "110\n110\n130\n90\n27\nConsultas: 2"
```

## El caso

```exercise
id: py11-caso-contador
type: case
title: El contador compartido
prompt: |
  **Escribe `crear_contador()`, que devuelve una función `contar(cantidad)` con memoria propia, crea un contador por artesano, pásale el registro de la repisa y compara cada total con lo que cobró cada uno.**

  La repisa de secado tiene una cámara que anota quién deja cada tanda de cabecitas y cuántas son. Teodora paga 1 sol por cabecita, y esta quincena cuatro artesanos le pasaron sus cuentas. Uno cobró de más; dice que su tableta lo contó solo.

  `contar(cantidad)` suma `cantidad` a la cuenta **de ese contador** y devuelve el total que lleva. Imprime una línea por artesano que empiece con su nombre: `print("Teodora:", total)`. El tablero la compara con lo que cobró.
visual:
  board:
    for: py11-caso-contador
    task: "Un contador por artesano: cada tanda de la repisa suma solo en el de quien la dejó. Compara con lo que cobró."
    cards:
      - name: Teodora
        kind: person
        role: La maestra
        rows: [["Cuenta en", "su cuaderno"], ["Cobró", "15 cabecitas"]]
        clue: { find: "Teodora", says: 15, saysLabel: Cobró }
      - name: Yolanda
        kind: person
        rows: [["Cuenta en", "su tableta"], ["Cobró", "12 cabecitas"]]
        clue: { find: "Yolanda", says: 12, saysLabel: Cobró }
      - name: Wilber
        kind: person
        role: El aprendiz
        culprit: true
        rows: [["Cuenta en", "una app que él mismo hizo"], ["Cobró", "38 cabecitas"]]
        clue: { find: "Wilber", says: 38, saysLabel: Cobró }
      - name: Efraín
        kind: person
        rows: [["Cuenta en", "su tableta"], ["Cobró", "12 cabecitas"]]
        clue: { find: "Efraín", says: 12, saysLabel: Cobró }
      - name: La repisa
        kind: note
        role: Registro de la cámara
        rows: [["Tandas", "20"], ["Cabecitas", "45 en total"]]
    caption: "Si los cuatro totales suman 45, ningún contador se mezcló con otro."
starter: |
  # Cada tanda que entró a la repisa: [artesano, cabecitas]
  repisa = [
      ["Teodora", 3], ["Yolanda", 2], ["Wilber", 1], ["Efraín", 4], ["Teodora", 2],
      ["Teodora", 3], ["Yolanda", 1], ["Efraín", 2], ["Wilber", 2], ["Teodora", 4],
      ["Yolanda", 3], ["Efraín", 1], ["Wilber", 1], ["Teodora", 2], ["Yolanda", 2],
      ["Efraín", 3], ["Wilber", 2], ["Teodora", 1], ["Yolanda", 4], ["Efraín", 2],
  ]
  artesanos = ["Teodora", "Yolanda", "Wilber", "Efraín"]

  # TODO: escribe crear_contador(): devuelve contar(cantidad), con su propia cuenta

  # TODO: un contador por artesano, por ejemplo en un diccionario
  # TODO: recorre la repisa y guarda el último total de cada uno
  # TODO: print("Teodora:", total) para cada artesano
solution: |
  repisa = [
      ["Teodora", 3], ["Yolanda", 2], ["Wilber", 1], ["Efraín", 4], ["Teodora", 2],
      ["Teodora", 3], ["Yolanda", 1], ["Efraín", 2], ["Wilber", 2], ["Teodora", 4],
      ["Yolanda", 3], ["Efraín", 1], ["Wilber", 1], ["Teodora", 2], ["Yolanda", 2],
      ["Efraín", 3], ["Wilber", 2], ["Teodora", 1], ["Yolanda", 4], ["Efraín", 2],
  ]
  artesanos = ["Teodora", "Yolanda", "Wilber", "Efraín"]


  def crear_contador():
      cuenta = 0
      def contar(cantidad):
          nonlocal cuenta
          cuenta += cantidad
          return cuenta
      return contar


  contadores = {nombre: crear_contador() for nombre in artesanos}
  totales = {nombre: 0 for nombre in artesanos}
  for nombre, cantidad in repisa:
      totales[nombre] = contadores[nombre](cantidad)

  for nombre in artesanos:
      print(f"{nombre}:", totales[nombre])
answer: Wilber
answerLabel: ¿Quién cobró de más?
reveal: |
  Wilber. Dejó cuatro tandas (1 + 2 + 1 + 2 = 6 cabecitas) y cobró 38. Y 38 es justo lo que llevaba **toda la repisa** cuando él dejó su última tanda: en su app, la `cuenta` vivía fuera de la fábrica, así que todos los contadores compartían una sola y sumaban lo de todos. No fue mala fe, fue un closure que no lo era.
hints:
  - "Dentro de `crear_contador`: `cuenta = 0`, y en `contar`, `nonlocal cuenta` antes de sumarle."
  - "`contadores = {nombre: crear_contador() for nombre in artesanos}` crea uno por artesano; luego `contadores[nombre](cantidad)` suma en el que toca."
```

## El juez

Como desde la sesión 4, el juez **llama a tu función** y compara lo que devuelve. Una función no se puede comparar, así que estos problemas traen una función `probar` ya escrita: usa lo que tú construyes y devuelve números y textos que el juez sí puede comparar. No la cambies.

```exercise
id: py11-juez-contador
type: judge
mode: function
function: probar
title: Los moldes de cabecitas
prompt: |
  **Escribe `crear_contador(inicio=0, paso=1)`, que devuelve una función `contar(veces=1)` con su propia cuenta.**

  Cada mesa del taller tiene un molde que saca `paso` cabecitas de un golpe, y empieza el día con `inicio` cabecitas que quedaron de ayer. `contar(veces)` aprieta el molde `veces` veces (suma `paso × veces`) y devuelve cuántas cabecitas lleva esa mesa. Con `veces = 0` no suma nada y solo dice el total.

  `probar(ops)` ya está escrita. Recibe una lista de órdenes:

  - `["nuevo", mesa, inicio, paso]` o `["nuevo", mesa]` crea un contador para esa mesa (si ya tenía uno, lo reemplaza por uno nuevo);
  - `["contar", mesa, veces]` o `["contar", mesa]` lo usa y anota lo que devuelve.

  Devuelve la lista de lo anotado. Cada mesa tiene que recordar **solo lo suyo**.

  **Restricciones:** hasta 60 órdenes · hasta 4 mesas · `inicio` de 0 a 50 · `paso` de 1 a 6 · `veces` de 0 a 4. Nunca se cuenta en una mesa sin contador.
visual:
  figure:
    title: El ejemplo 1, orden por orden
    panes:
      - { table: { head: ["orden", "Luz", "Abel", "anota"], rows: [["nuevo Luz 10 3", "10", "—", ""], ["contar Luz 2", "16", "—", "16"], ["nuevo Abel", "16", "0", ""], ["contar Abel", "16", "1", "1"], ["contar Luz 1", "19", "1", "19"], ["contar Abel 4", "19", "5", "5"]] } }
    caption: "La cuenta de Abel no se mezcla con la de Luz: cada contador tiene la suya."
starter: |
  def crear_contador(inicio=0, paso=1):
      pass


  def probar(ops):
      """El juez llama a esta función. No la cambies."""
      contadores = {}
      anotado = []
      for orden, mesa, *datos in ops:
          if orden == "nuevo":
              contadores[mesa] = crear_contador(*datos)
          else:
              anotado.append(contadores[mesa](*datos))
      return anotado
solution: |
  def crear_contador(inicio=0, paso=1):
      """Un contador de cabecitas con su propia cuenta."""
      cuenta = inicio

      def contar(veces=1):
          nonlocal cuenta
          cuenta += paso * veces
          return cuenta

      return contar


  def probar(ops):
      """El juez llama a esta función. No la cambies."""
      contadores = {}
      anotado = []
      for orden, mesa, *datos in ops:
          if orden == "nuevo":
              contadores[mesa] = crear_contador(*datos)
          else:
              anotado.append(contadores[mesa](*datos))
      return anotado
hints:
  - "La cuenta vive dentro de `crear_contador`, empezando en `inicio`; `contar` la cambia con `nonlocal`."
  - "Si la cuenta viviera fuera de la fábrica, todas las mesas compartirían una. Prueba el ejemplo 1 a mano."
samples:
  - args: [[["nuevo", "Luz", 10, 3], ["contar", "Luz", 2], ["nuevo", "Abel"], ["contar", "Abel"], ["contar", "Luz", 1], ["contar", "Abel", 4]]]
    returns: [16, 1, 19, 5]
    note: Luz empieza en 10 y suma de 3 en 3; Abel usa los valores por defecto.
  - args: [[["nuevo", "Nilda", 0, 2], ["contar", "Nilda", 3], ["nuevo", "Nilda", 5, 1], ["contar", "Nilda", 0]]]
    returns: [6, 5]
    note: Un contador nuevo para la misma mesa empieza de cero, y `veces = 0` solo lee.
edge:
  - args: [[]]
    tag: sin órdenes
  - args: [[["nuevo", "Luz", 7, 2]]]
    tag: con un contador que nunca se usa
  - args: [[["nuevo", "Luz"], ["contar", "Luz", 0], ["contar", "Luz", 0]]]
    tag: contando cero veces
  - args: [[["nuevo", "Luz", 0, 1], ["nuevo", "Abel", 0, 1], ["contar", "Luz", 1], ["contar", "Abel", 1], ["contar", "Luz", 1], ["contar", "Abel", 1]]]
    tag: con dos mesas iguales alternadas
  - args: [[["nuevo", "Elmer", 50, 6], ["contar", "Elmer", 4], ["contar", "Elmer", 4], ["contar", "Elmer"]]]
    tag: con el inicio y el paso más altos
  - args: [[["nuevo", "Nilda", 3, 2], ["contar", "Nilda", 2], ["nuevo", "Abel", 0, 5], ["nuevo", "Nilda", 3, 2], ["contar", "Nilda"], ["contar", "Abel", 1]]]
    tag: reemplazando un contador
random:
  count: 40
  seed: 1111
  generate: |
    mesas = ["Luz", "Elmer", "Nilda", "Abel"][:rng.int(1, 4)]
    ops = []
    creadas = []
    for _ in range(rng.int(1, 60)):
        if not creadas or rng.next() < 0.15:
            mesa = rng.pick(mesas)
            if rng.next() < 0.25:
                ops.append(["nuevo", mesa])
            else:
                ops.append(["nuevo", mesa, rng.int(0, 50), rng.int(1, 6)])
            if mesa not in creadas:
                creadas.append(mesa)
        else:
            mesa = rng.pick(creadas)
            if rng.next() < 0.25:
                ops.append(["contar", mesa])
            else:
                ops.append(["contar", mesa, rng.int(0, 4)])
    return [ops]
wrong:
  - |
    cuenta = 0
    def crear_contador(inicio=0, paso=1):
        global cuenta
        cuenta = inicio
        def contar(veces=1):
            global cuenta
            cuenta += paso * veces
            return cuenta
        return contar
    def probar(ops):
        contadores, anotado = {}, []
        for orden, mesa, *datos in ops:
            if orden == "nuevo":
                contadores[mesa] = crear_contador(*datos)
            else:
                anotado.append(contadores[mesa](*datos))
        return anotado
  - |
    def crear_contador(inicio=0, paso=1):
        cuenta = inicio
        def contar(veces=1):
            nonlocal cuenta
            cuenta += paso
            return cuenta
        return contar
    def probar(ops):
        contadores, anotado = {}, []
        for orden, mesa, *datos in ops:
            if orden == "nuevo":
                contadores[mesa] = crear_contador(*datos)
            else:
                anotado.append(contadores[mesa](*datos))
        return anotado
```

```exercise
id: py11-juez-reintentar
type: judge
mode: function
function: probar
title: El higrómetro que a veces no contesta
prompt: |
  **Escribe el decorador con argumento `reintentar(veces)`: la función decorada se llama hasta `veces` veces seguidas, hasta que devuelva algo que no sea `None`.**

  Las cabecitas recién modeladas no pueden secarse con demasiada humedad, y el higrómetro del cuarto de secado a veces devuelve `None` en lugar de una lectura. Con `@reintentar(3)`, cada vez que alguien pide una lectura:

  - se llama a la función original; si devuelve algo distinto de `None` (**también `0`**, que es una lectura válida), eso se devuelve y se deja de intentar;
  - si devuelve `None`, se vuelve a intentar, hasta `veces` intentos **en esa llamada**;
  - si todos los intentos dieron `None`, devuelve `None`.

  Usa `@functools.wraps`: la función decorada tiene que seguir llamándose como la original.

  `probar(lecturas, veces, consultas)` ya está escrita: decora un higrómetro falso que va soltando las `lecturas` en orden (y `None` cuando se acaban), le pide `consultas` lecturas y devuelve `[lo que devolvió cada consulta, intentos en total, nombre de la función]`.

  **Restricciones:** hasta 25 lecturas, cada una `None` o un número de 0 a 100 · `veces` de 1 a 5 · `consultas` de 1 a 8.
visual:
  figure:
    title: El ejemplo 1, con @reintentar(3)
    panes:
      - { label: lecturas, cells: ["None", "None", "41", "0", "None", "37"] }
      - { table: { head: ["consulta", "intentos", "ve", "devuelve"], rows: [["1", "3", "None, None, 41", "41"], ["2", "1", "0", "0"], ["3", "2", "None, 37", "37"]] } }
      - { label: probar devuelve, text: "[[41, 0, 37], 6, \"leer_humedad\"]" }
    caption: "El 0 es una lectura de verdad: no se reintenta."
starter: |
  import functools


  def reintentar(veces):
      pass


  def probar(lecturas, veces, consultas):
      """El juez llama a esta función. No la cambies."""
      pendientes = list(lecturas)
      intentos = []

      @reintentar(veces)
      def leer_humedad():
          """Una lectura del higrómetro: un número, o None si falló."""
          intentos.append(1)
          return pendientes.pop(0) if pendientes else None

      resultados = [leer_humedad() for _ in range(consultas)]
      return [resultados, len(intentos), leer_humedad.__name__]
solution: |
  import functools


  def reintentar(veces):
      """Reintenta la función hasta `veces` veces mientras devuelva None."""
      def decorador(funcion):
          @functools.wraps(funcion)
          def envoltura(*args, **kwargs):
              for _ in range(veces):
                  resultado = funcion(*args, **kwargs)
                  if resultado is not None:
                      return resultado
              return None
          return envoltura
      return decorador


  def probar(lecturas, veces, consultas):
      """El juez llama a esta función. No la cambies."""
      pendientes = list(lecturas)
      intentos = []

      @reintentar(veces)
      def leer_humedad():
          """Una lectura del higrómetro: un número, o None si falló."""
          intentos.append(1)
          return pendientes.pop(0) if pendientes else None

      resultados = [leer_humedad() for _ in range(consultas)]
      return [resultados, len(intentos), leer_humedad.__name__]
hints:
  - "Son tres funciones: `reintentar(veces)` devuelve `decorador(funcion)`, que devuelve `envoltura(*args, **kwargs)`."
  - "En la envoltura, un `for _ in range(veces):` que devuelve en cuanto `resultado is not None`. Ojo: `if resultado:` trataría el 0 como un fallo."
samples:
  - args: [[null, null, 41, 0, null, 37], 3, 3]
    returns: [[41, 0, 37], 6, leer_humedad]
    note: El 0 se devuelve al primer intento.
  - args: [[null, null, null, null, 55], 2, 3]
    returns: [[null, null, 55], 5, leer_humedad]
    note: Con 2 intentos por consulta, las dos primeras se rinden; los intentos no se acumulan entre consultas.
edge:
  - args: [[], 3, 2]
    tag: sin ninguna lectura
  - args: [[0, 0, 0], 1, 3]
    tag: con lecturas en cero
  - args: [[12, 13, 14], 5, 3]
    tag: sin ningún fallo
  - args: [[null, 70], 1, 2]
    tag: con un solo intento por consulta
  - args: [[null, null, null, null, 9], 5, 1]
    tag: acertando en el último intento
  - args: [[null, null, null, null, null, 9], 5, 2]
    tag: cuando se agotan los intentos justo antes
random:
  count: 40
  seed: 1112
  generate: |
    lecturas = []
    for _ in range(rng.int(0, 25)):
        if rng.next() < 0.45:
            lecturas.append(None)
        elif rng.next() < 0.25:
            lecturas.append(0)
        else:
            lecturas.append(rng.int(1, 100))
    return [lecturas, rng.int(1, 5), rng.int(1, 8)]
wrong:
  - |
    import functools
    def reintentar(veces):
        def decorador(funcion):
            @functools.wraps(funcion)
            def envoltura(*args, **kwargs):
                for _ in range(veces):
                    resultado = funcion(*args, **kwargs)
                    if resultado:
                        return resultado
                return None
            return envoltura
        return decorador
    def probar(lecturas, veces, consultas):
        pendientes, intentos = list(lecturas), []
        @reintentar(veces)
        def leer_humedad():
            intentos.append(1)
            return pendientes.pop(0) if pendientes else None
        resultados = [leer_humedad() for _ in range(consultas)]
        return [resultados, len(intentos), leer_humedad.__name__]
  - |
    def reintentar(veces):
        def decorador(funcion):
            def envoltura(*args, **kwargs):
                for _ in range(veces):
                    resultado = funcion(*args, **kwargs)
                    if resultado is not None:
                        return resultado
                return None
            return envoltura
        return decorador
    def probar(lecturas, veces, consultas):
        pendientes, intentos = list(lecturas), []
        @reintentar(veces)
        def leer_humedad():
            intentos.append(1)
            return pendientes.pop(0) if pendientes else None
        resultados = [leer_humedad() for _ in range(consultas)]
        return [resultados, len(intentos), leer_humedad.__name__]
  - |
    import functools
    def reintentar(veces):
        def decorador(funcion):
            intentos_hechos = 0
            @functools.wraps(funcion)
            def envoltura(*args, **kwargs):
                nonlocal intentos_hechos
                while intentos_hechos < veces:
                    intentos_hechos += 1
                    resultado = funcion(*args, **kwargs)
                    if resultado is not None:
                        return resultado
                return None
            return envoltura
        return decorador
    def probar(lecturas, veces, consultas):
        pendientes, intentos = list(lecturas), []
        @reintentar(veces)
        def leer_humedad():
            intentos.append(1)
            return pendientes.pop(0) if pendientes else None
        resultados = [leer_humedad() for _ in range(consultas)]
        return [resultados, len(intentos), leer_humedad.__name__]
```

## Misión final

```exercise
id: py11-mision-bitacora
type: mission
title: La ronda con bitácora
prompt: |
  **Escribe el decorador `bitacora`, ponlo sobre `ir_a` y `revisar`, y arma el informe de la noche leyendo solo lo que quedó anotado.**

  Teodora quiere saber qué hizo Quilla en la galería cada noche, paso por paso. La ronda ya está escrita: `ir_a(columna)` lleva a Quilla hasta una puerta y `revisar()` lee el sensor, cierra la puerta si está abierta, hace sonar la sirena si hay movimiento y **devuelve** `"intruso"` o `"en calma"`.

  1. Escribe `bitacora(funcion)`: la función decorada hace lo mismo que la original (y **devuelve lo mismo**), y además agrega a la lista `registro` una tupla `(nombre, args, resultado)`: el nombre de la función, la tupla de argumentos con que la llamaron y lo que devolvió. Usa `@functools.wraps`.
  2. Pon `@bitacora` sobre `ir_a` y sobre `revisar`.
  3. Al final, arma `informe`: la lista de lo que devolvió cada `revisar`, **sacada de `registro`**, y haz que Quilla diga `Intrusos: 2` (con el número de esa noche) con `robot.decir`.

  `puertas` (las columnas de las puertas, de oeste a este) y la galería cambian en cada prueba.
visual:
  figure:
    title: El registro de la primera noche
    panes:
      - { label: puertas, cells: ["3", "6", "8", "11"] }
      - { table: { head: ["nombre", "args", "resultado"], rows: [["\"ir_a\"", "(3,)", "None"], ["\"revisar\"", "()", "\"intruso\""], ["\"ir_a\"", "(6,)", "None"], ["\"revisar\"", "()", "\"en calma\""], ["…", "…", "…"]] } }
      - { label: informe, cells: ["intruso", "en calma", "en calma", "intruso"] }
starter: |
  import functools

  registro = []


  # TODO: escribe el decorador bitacora(funcion)


  def ir_a(columna):
      """Avanza por el pasillo hasta la puerta de esa columna."""
      robot.avanzar(columna - robot.posicion.x)


  def revisar():
      """Revisa la puerta de abajo y dice cómo estaba la sala."""
      lectura = robot.sensor()
      if lectura["puerta"] == "abierta":
          robot.cerrar_puerta()
      if lectura["movimiento"]:
          robot.alarma()
          return "intruso"
      return "en calma"


  for columna in puertas:
      ir_a(columna)
      revisar()

  # TODO: informe, sacado de registro, y robot.decir(...)
solution: |
  import functools

  registro = []


  def bitacora(funcion):
      @functools.wraps(funcion)
      def envoltura(*args, **kwargs):
          resultado = funcion(*args, **kwargs)
          registro.append((funcion.__name__, args, resultado))
          return resultado
      return envoltura


  @bitacora
  def ir_a(columna):
      """Avanza por el pasillo hasta la puerta de esa columna."""
      robot.avanzar(columna - robot.posicion.x)


  @bitacora
  def revisar():
      """Revisa la puerta de abajo y dice cómo estaba la sala."""
      lectura = robot.sensor()
      if lectura["puerta"] == "abierta":
          robot.cerrar_puerta()
      if lectura["movimiento"]:
          robot.alarma()
          return "intruso"
      return "en calma"


  for columna in puertas:
      ir_a(columna)
      revisar()

  informe = [resultado for nombre, args, resultado in registro if nombre == "revisar"]
  robot.decir(f"Intrusos: {informe.count('intruso')}")
hints:
  - "La envoltura llama a la original, guarda `resultado`, hace `registro.append((funcion.__name__, args, resultado))` y devuelve `resultado`."
  - "`informe = [resultado for nombre, args, resultado in registro if nombre == \"revisar\"]`; luego `informe.count(\"intruso\")`."
world:
  theme: museo
  level: 2
  dir: E
  map: |
    #############
    #R..........#
    ###O##P#O##P#
    ###m##.#.##m#
    #############
globals:
  puertas: [3, 6, 8, 11]
scenarios:
  - tests:
      - name: el informe de la primera noche
        expect: 'informe == ["intruso", "en calma", "en calma", "intruso"]'
  - map: |
      ##########
      #R.......#
      ##O##P#P##
      ##m##m#.##
      ##########
    globals:
      puertas: [2, 5, 7]
    tests:
      - name: el informe de la segunda noche
        expect: 'informe == ["intruso", "intruso", "en calma"]'
  - map: |
      ########
      #R.....#
      #####O##
      #####.##
      ########
    globals:
      puertas: [5]
    tests:
      - name: el informe de una noche tranquila
        expect: 'informe == ["en calma"]'
tests:
  - name: dos entradas por puerta en la bitácora
    expect: len(registro) == 2 * len(puertas)
    msg: Cada ir_a y cada revisar deja una entrada; ¿pusiste @bitacora sobre las dos?
  - name: cada viaje queda anotado con su columna
    expect: '[e for e in registro if e[0] == "ir_a"] == [("ir_a", (c,), None) for c in puertas]'
    msg: "Cada entrada es la tupla (funcion.__name__, args, resultado)."
  - name: las funciones decoradas conservan su nombre
    expect: '[ir_a.__name__, revisar.__name__] == ["ir_a", "revisar"]'
    msg: Usa @functools.wraps(funcion) sobre la envoltura.
  - name: todas las puertas quedan cerradas
    state: w.open_doors == 0
  - name: la sirena suena solo donde hay movimiento
    state: w.alarms == w.motion_doors
  - name: Quilla dice cuántos intrusos hubo
    state: 'f"Intrusos: {len(w.motion_doors)}" in w.said'
    msg: "Al final, robot.decir(f\"Intrusos: {informe.count('intruso')}\")."
  - name: usa @bitacora
    source: '@bitacora\s+def\s+ir_a[\s\S]*@bitacora\s+def\s+revisar|@bitacora\s+def\s+revisar[\s\S]*@bitacora\s+def\s+ir_a'
  - name: sin chocar
    state: not w.crashed
```

## Reto experto

```exercise
id: py11-reto-memoria-corta
type: challenge
title: Una memoria que olvida
visual:
  figure:
    title: con_memoria(2), llamada por llamada
    panes:
      - { table: { head: ["llamada", "f(1)", "f(2)", "f(1)", "f(3)", "f(2)"], rows: [["¿calcula?", "sí", "sí", "no", "sí", "sí"], ["recuerda", "1", "1, 2", "2, 1", "1, 3", "3, 2"]] } }
    caption: "Al llenarse, olvida el argumento que lleva **más tiempo sin usarse**: por eso f(3) saca al 2, no al 1."
prompt: |
  **Escribe el decorador con argumento `con_memoria(capacidad)`: como `@functools.cache`, pero recuerda como máximo `capacidad` resultados.** Para quien ya programa.

  - La clave es la tupla de argumentos posicionales (solo se usan esos).
  - Si la clave está en la memoria, devuelve el resultado guardado sin llamar a la función, y esa clave pasa a ser **la más reciente**.
  - Si no está, llama a la función, guarda el resultado y, si la memoria pasa de `capacidad`, olvida la clave **usada hace más tiempo**. Con `capacidad = 0` nunca guarda nada.
  - La función decorada tiene un atributo `calculos`: cuántas veces se llamó de verdad a la original. Conserva su nombre con `@functools.wraps`, y cada función decorada tiene su propia memoria.

  Un diccionario recuerda el orden en que se insertaron sus claves: sacar una clave con `pop` y volver a ponerla la manda al final.
starter: |
  import functools


  def con_memoria(capacidad):
      pass


  @con_memoria(2)
  def secado(figuras):
      return figuras * 2 + 6


  print([secado(n) for n in [1, 2, 1, 3, 2]], secado.calculos)
solution: |
  import functools


  def con_memoria(capacidad):
      """Como functools.cache, pero recuerda a lo más `capacidad` resultados."""
      def decorador(funcion):
          memoria = {}

          @functools.wraps(funcion)
          def envoltura(*args):
              if args in memoria:
                  memoria[args] = memoria.pop(args)
                  return memoria[args]
              envoltura.calculos += 1
              resultado = funcion(*args)
              memoria[args] = resultado
              if len(memoria) > capacidad:
                  del memoria[next(iter(memoria))]
              return resultado

          envoltura.calculos = 0
          return envoltura
      return decorador


  @con_memoria(2)
  def secado(figuras):
      return figuras * 2 + 6


  print([secado(n) for n in [1, 2, 1, 3, 2]], secado.calculos)
hints:
  - "Tres funciones anidadas, y la memoria (un diccionario) vive en `decorador`, para que cada función decorada tenga la suya."
  - "Para refrescar una clave: `memoria[args] = memoria.pop(args)`. La más vieja es `next(iter(memoria))`."
tests:
  - name: olvida la menos usada, no la primera que entró
    run: '(lambda f: [[f(1), f(2), f(1), f(3), f(2)], f.calculos])(con_memoria(2)(lambda x: x * 10))'
    equals: [[10, 20, 10, 30, 20], 4]
  - name: con espacio de sobra calcula una vez cada argumento
    run: '(lambda f: [[f(4), f(5), f(4), f(5)], f.calculos])(con_memoria(5)(lambda x: x + 1))'
    equals: [[5, 6, 5, 6], 2]
  - name: con capacidad 0 siempre calcula
    run: '(lambda f: [[f(2), f(2), f(2)], f.calculos])(con_memoria(0)(lambda x: x * x))'
    equals: [[4, 4, 4], 3]
  - name: varios argumentos forman la clave
    run: '(lambda f: [[f(2, 3), f(3, 2), f(2, 3)], f.calculos])(con_memoria(3)(pow))'
    equals: [[8, 9, 8], 2]
  - name: cada función decorada tiene su propia memoria
    run: '(lambda a, b: [a(1), b(1), a.calculos, b.calculos])(con_memoria(2)(lambda x: x), con_memoria(2)(lambda x: -x))'
    equals: [1, -1, 1, 1]
  - name: conserva el nombre
    expect: secado.__name__ == "secado"
  - name: la consola
    output: "[8, 10, 8, 12, 10] 4"
```
