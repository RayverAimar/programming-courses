# Sesión 14 — Iteradores y generadores

## El encargo

Samegua, Moquegua, en plena vendimia. La bodega **El Tinajón** de doña **Herminia Zapata** destila pisco desde que su abuelo trajo las tinajas de barro de Ilo en burro: quebranta, italia y un acholado que en la feria de Moquegua se acaba antes del mediodía. Este año Herminia compró una **faja transportadora** de segunda mano: las botellas salen de la llenadora, pasan por la encorchadora y llegan a la etiquetadora, una detrás de otra, todo el día.

Maru le mandó a Quilla, con su linterna de casco, para manejar la faja y bajar a la cava de las tinajas. El problema: la faja no termina nunca. No puedes hacer "la lista de todas las botellas del día" antes de empezar, porque todavía no existen. Hoy Quilla aprende a trabajar **una cosa a la vez**: iteradores, que dan el siguiente cuando se los pides, y generadores, funciones que se pausan después de entregar cada valor.

```escena
theme: mina
level: 3
dir: E
caption: La cava de El Tinajón. Quilla baja por el pasillo de las tinajas recogiendo las botellas (los números) que quedaron en el piso.
map: |
  #########
  #R.2..1.#
  #######.#
  #D..3...#
  #########
program: |
  for _ in range(6):
      robot.avanzar()
      robot.recoger()
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_derecha()
  for _ in range(6):
      robot.avanzar()
      robot.recoger()
```

## Lo mínimo

Un `for` no recorre una lista directamente: primero le pide un **iterador** con `iter(lista)` y después le pide el siguiente valor con `next(...)`, una y otra vez, hasta que el iterador avisa que se acabó lanzando `StopIteration`. Ese es el **protocolo de iteración**, y puedes usarlo a mano:

```py run
botellas = ["quebranta", "italia", "acholado"]
faja = iter(botellas)
print(next(faja))
print(next(faja), next(faja))
print(next(faja, "faja vacía"))
```

Sin el segundo argumento, ese último `next` lanzaría `StopIteration`. El `for` lo atrapa por ti y termina en silencio.

Cualquier objeto que cumpla el protocolo sirve en un `for`: necesita `__iter__` (devuelve el iterador, normalmente él mismo) y `__next__` (devuelve el siguiente valor, o lanza `StopIteration`).

```py run
class Faja:
    def __init__(self, botellas):
        self.botellas = botellas
        self.posicion = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.posicion == len(self.botellas):
            raise StopIteration
        botella = self.botellas[self.posicion]
        self.posicion += 1
        return botella

for botella in Faja(["Q-401", "I-210"]):
    print("pasa", botella)
```

Escribir esa clase cada vez cansa. Un **generador** hace lo mismo con una función: basta con que tenga **`yield`**. Llamarla no ejecuta nada; devuelve un generador. Cada `next` corre el cuerpo hasta el siguiente `yield`, entrega ese valor y **se pausa ahí**, con sus variables intactas, hasta el próximo `next`.

```anima
title: Un generador se pausa en cada yield
code: |
  def faja(botellas):
      for botella in botellas:
          yield botella.upper()

  salida = faja(["quebranta", "italia"])
  print(next(salida))
  print(next(salida))
  print(next(salida, "vacía"))
notes:
  5: "Llamar a faja no corre ni una línea de su cuerpo: solo crea el generador."
  6: "El primer next entra a faja y corre hasta el yield."
  3: "yield entrega el valor y pausa la función aquí, con botella intacta."
  8: "El for de adentro se terminó: la función acaba y next devuelve el valor por defecto."
```

Y la misma película mirando **el marco** de la función: corre, se pausa con sus variables y despierta donde se quedó.

```anima
title: "El marco de un generador: corre, se pausa, despierta"
code: |
  def faja(botellas):
      for botella in botellas:
          yield botella.upper()

  salida = faja(["quebranta", "italia"])
  print(next(salida))
  print(next(salida))
  print(next(salida, "vacía"))
steps:
  - { line: 5, vars: { salida: "<generador>", estado: "sin empezar: ningún renglón del cuerpo corrió" }, stack: [], note: "Llamar a la función no corre nada: solo crea el generador, con su marco vacío." }
  - { line: 6, vars: { botella: "quebranta", estado: "▶ corriendo" }, stack: [{ name: faja, args: 'botellas = [...]' }], note: "El primer `next` lo despierta: la función corre desde el principio." }
  - { line: 3, vars: { botella: "quebranta", estado: "⏸ pausada en el yield" }, stack: [], out: "QUEBRANTA", note: "Llega al `yield`: entrega `QUEBRANTA` hacia afuera y se **pausa**, con `botella` intacta." }
  - { line: 7, vars: { botella: "italia", estado: "▶ corriendo" }, stack: [{ name: faja, args: 'botellas = [...]' }], out: "QUEBRANTA", note: "El segundo `next` la despierta justo donde se quedó, no desde el principio." }
  - { line: 3, vars: { botella: "italia", estado: "⏸ pausada en el yield" }, stack: [], out: "QUEBRANTA\nITALIA", note: "Otro `yield`: entrega `ITALIA` y se pausa de nuevo." }
  - { line: 8, vars: { botella: "italia", estado: "▶ corriendo" }, stack: [{ name: faja, args: 'botellas = [...]' }], out: "QUEBRANTA\nITALIA", note: "El tercer `next` la despierta: el `for` ya no tiene más botellas." }
  - { line: 8, vars: { botella: "italia", estado: "terminada" }, stack: [], out: "QUEBRANTA\nITALIA\nvacía", note: "La función termina: su marco desaparece y `next` devuelve el valor por defecto." }
```


Como cada valor se fabrica recién cuando se pide, puedes encadenar generadores en una **tubería perezosa**: cada botella atraviesa todas las estaciones antes de que la siguiente entre a la faja. Nada se guarda en listas intermedias.

```py run
def llenar(codigos):
    for codigo in codigos:
        print("lleno", codigo)
        yield codigo

def encorchar(botellas):
    for botella in botellas:
        print("  encorcho", botella)
        yield botella + "*"

for terminada in encorchar(llenar(["Q-401", "Q-402"])):
    print("    sale", terminada)
```

Esa mezcla de líneas impresas es justo lo que pasa cuando cada función se pausa y despierta. Mira quién le pide qué a quién:

```red
title: Quién le pide qué a quién, y en qué orden
caption: "Cada `next()` baja pidiendo un valor y cada `yield` sube entregándolo. Cada función se pausa donde está y sigue desde ahí."
speed: 4200
nodes:
  - { id: for, icon: program, label: "El `for`", sub: "pide la siguiente botella" }
  - { id: cork, icon: engine, label: "encorchar", sub: "pide una botella y la tapa" }
  - { id: fill, icon: box, label: "llenar", sub: "pide un código y llena" }
steps:
  - phase: "Pide uno, y cada estación se despierta"
    move: [for, cork]
    packet: { kind: up, label: next() }
    note: "Todo empieza en el `for`: le pide la primera botella a `encorchar`. Hasta aquí no se ha corrido **ni una línea** de `llenar` ni de `encorchar`: llamarlas solo creó los generadores."
  - move: [cork, fill]
    packet: { kind: up, label: next() }
    note: "`encorchar` despierta, entra a su `for` y necesita una botella: se la pide a `llenar`."
  - at: fill
    note: "`llenar` corre hasta su primer `yield`: imprime `lleno Q-401` y se **pausa ahí**, con `codigo = \"Q-401\"` guardado."
    tags: { fill: "pausada en el yield" }
    show: { label: "Lo que imprime", text: "lleno Q-401" }
  - move: [fill, cork]
    packet: { kind: down, label: "Q-401" }
    note: "El `yield` entrega `Q-401` hacia arriba, a `encorchar`."
    tags: { fill: "pausada" }
    show: { label: "Lo que imprime", text: "lleno Q-401" }
  - at: cork
    note: "`encorchar` imprime `encorcho Q-401` y llega a su `yield`: entrega `Q-401*` y también se pausa."
    tags: { fill: "pausada", cork: "pausada en el yield" }
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401" }
  - move: [cork, for]
    packet: { kind: down, label: "Q-401*" }
    note: "`Q-401*` llega al `for`."
    tags: { fill: "pausada", cork: "pausada" }
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401" }
  - at: for
    note: "El cuerpo del `for` imprime `sale Q-401`. **Recién ahora** se pide la segunda botella: la primera ya salió de la faja completa."
    tags: { fill: "pausada", cork: "pausada" }
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401\n    sale Q-401" }
  - move: [for, cork]
    packet: { kind: up, label: next() }
    note: "El `for` pide la siguiente. `encorchar` despierta **justo donde se pausó**, vuelve a su `for` y le pide otra botella a `llenar`, que despierta también."
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401\n    sale Q-401" }
  - at: fill
    note: "`llenar` sigue desde su `yield`, vuelve a su `for` e imprime `lleno Q-402`."
    tags: { fill: "pausada en el yield" }
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401\n    sale Q-401\nlleno Q-402" }
  - at: cork
    note: "La botella sube a `encorchar`, que imprime `encorcho Q-402` y entrega `Q-402*`."
    tags: { cork: "pausada en el yield" }
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401\n    sale Q-401\nlleno Q-402\n  encorcho Q-402" }
  - at: for
    note: "El `for` imprime `sale Q-402`. Por eso el orden impreso mezcla las tres funciones: **cada botella cruza todas las estaciones antes de que la siguiente entre**."
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401\n    sale Q-401\nlleno Q-402\n  encorcho Q-402\n    sale Q-402" }
  - move: [for, cork]
    packet: { kind: up, label: next() }
    note: "El `for` pide una más. `llenar` se queda sin códigos y termina: avisa con `StopIteration` hacia arriba, `encorchar` termina también y el `for` acaba **en silencio**."
    tags: { fill: "terminó", cork: "terminó" }
    show: { label: "Lo que imprime", text: "lleno Q-401\n  encorcho Q-401\n    sale Q-401\nlleno Q-402\n  encorcho Q-402\n    sale Q-402" }
```

Un generador puede ser **infinito**: un `while True` con un `yield` dentro no se cuelga, porque solo avanza cuando alguien pide. `itertools.count(101)` cuenta 101, 102, 103… para siempre, e `islice(iterable, n)` toma solo los primeros `n`.

```py run
from itertools import count, islice

def precintos():
    for numero in count(101):
        yield f"P-{numero}"

print(list(islice(precintos(), 3)))
```

`yield from otro` entrega, uno por uno, todos los valores de otro iterable o generador. Es el `for` con `yield` adentro, en una línea:

```py run
def toda_la_faja(cajas):
    for caja in cajas:
        yield from caja

print(list(toda_la_faja([["Q-401", "Q-402"], [], ["I-210"]])))
```

Una **expresión generadora** es una comprensión con paréntesis: `(ml for ml in medidas)`. No arma una lista; produce los valores a medida que `sum`, `max` o un `for` los piden. Dentro de una llamada basta con los paréntesis de la llamada:

```py run
litros = [0.5, 0.75, 0.5, 1.0]
print(sum(int(litro * 1000) for litro in litros))
print(max(len(variedad) for variedad in ["italia", "quebranta"]))
```

Y `itertools` trae piezas perezosas listas para armar recorridos:

```py run
from itertools import accumulate, batched, chain, groupby, pairwise
por_hora = [120, 95, 130, 80]
print(list(accumulate(por_hora)), list(pairwise(por_hora))[:2])
print(list(batched(["Q-1", "Q-2", "Q-3", "Q-4", "Q-5"], 2)))
print(list(chain(["Q-1"], ["I-1", "I-2"])))
print([(variedad, len(list(tanda))) for variedad, tanda in groupby("QQIIIQ")])
```

- `accumulate`: los totales acumulados. `pairwise`: cada valor con el siguiente, `(a, b)`, `(b, c)`…
- `batched(xs, n)`: tuplas de `n` en `n`; la última puede salir más corta.
- `chain(a, b)`: uno detrás del otro. `groupby`: junta los valores iguales **consecutivos**; si quieres un grupo por valor, ordénalos antes.

> **Trampa común:** un generador (y cualquier iterador) se recorre **una sola vez**. La segunda vuelta no da error: simplemente no entrega nada, así que un `for` no hace ni una vuelta y `sum` da 0. El iterador es como un marcador de página que ya llegó al final: no vuelve solo al principio. Si necesitas recorrer los datos dos veces, guárdalos en una lista (`list(gen)`) o llama de nuevo a la función generadora.

<!-- mdn: yield-from itertools -->

## Práctica

```exercise
id: py14-predice-pausa
type: predict
title: La faja que arranca tarde
prompt: |
  Herminia prende la faja y le pide a Quilla las dos primeras botellas. Antes de ejecutarlo: ¿qué imprime?
code: |
  def faja():
      print("arranca")
      yield "Q-401"
      print("sigue")
      yield "Q-402"

  salida = faja()
  print("listo")
  print(next(salida))
  print(next(salida))
options:
  - "listo\narranca\nQ-401\nsigue\nQ-402"
  - "arranca\nlisto\nQ-401\nsigue\nQ-402"
  - "arranca\nsigue\nlisto\nQ-401\nQ-402"
  - "listo\nQ-401\nQ-402"
answer: "listo\narranca\nQ-401\nsigue\nQ-402"
explain: |
  `faja()` no corre el cuerpo: solo crea el generador, así que primero sale `listo`. El primer `next` corre desde el principio hasta el primer `yield` (imprime `arranca` y entrega `Q-401`); el segundo sigue **desde donde se pausó** hasta el siguiente `yield`.
```

```exercise
id: py14-completa-lote
type: complete
title: Los códigos del lote
prompt: |
  Completa los `___` para que `Lote` sea un iterador: `Lote("Q", 7, 10)` entrega `"Q-7"`, `"Q-8"`, `"Q-9"` y `"Q-10"`, y después se acaba.
visual:
  figure:
    input: { label: "Lote(\"Q\", 7, 10)", cards: [{ title: Lote, rows: [["prefijo", "\"Q\""], ["actual", "7"], ["ultimo", "10"]] }] }
    arrow: "cada next() devuelve un código y suma 1"
    output: { label: "list(...)", cells: ["Q-7", "Q-8", "Q-9", "Q-10"] }
starter: |
  class Lote:
      def __init__(self, prefijo, primero, ultimo):
          self.prefijo = prefijo
          self.actual = primero
          self.ultimo = ultimo

      def ___(self):
          return ___

      def __next__(self):
          if self.actual > self.ultimo:
              raise ___
          codigo = f"{self.prefijo}-{self.actual}"
          self.actual += ___
          return codigo


  print(list(Lote("Q", 7, 10)))
solution: |
  class Lote:
      def __init__(self, prefijo, primero, ultimo):
          self.prefijo = prefijo
          self.actual = primero
          self.ultimo = ultimo

      def __iter__(self):
          return self

      def __next__(self):
          if self.actual > self.ultimo:
              raise StopIteration
          codigo = f"{self.prefijo}-{self.actual}"
          self.actual += 1
          return codigo


  print(list(Lote("Q", 7, 10)))
hints:
  - "El método que pide `for` (y `iter()`) se llama `__iter__`, y un iterador se devuelve a sí mismo: `self`."
  - "Para avisar que se acabó se lanza `StopIteration`."
tests:
  - name: entrega el lote completo
    run: list(Lote("Q", 7, 10))
    equals: ["Q-7", "Q-8", "Q-9", "Q-10"]
  - name: imprime la lista
    output: "['Q-7', 'Q-8', 'Q-9', 'Q-10']"
  - name: un lote de una botella
    run: list(Lote("A", 3, 3))
    equals: ["A-3"]
  - name: un lote vacío no entrega nada
    run: list(Lote("I", 5, 4))
    equals: []
  - name: next funciona a mano
    expect: 'next(Lote("I", 20, 25)) == "I-20"'
```

```exercise
id: py14-arregla-etiquetas
type: fix
title: Las etiquetas letra por letra
prompt: |
  La etiquetadora debía imprimir una etiqueta por cada botella de 38 grados o más, pero imprime **una letra por línea** y solo de la primera botella. Ejecútalo, mira la salida y arréglalo para que imprima:

  ```
  Q-401 · 42°
  Q-403 · 41°
  ```
visual:
  figure:
    input: { label: lote, table: { head: ["código", "grado"], rows: [["Q-401", "42"], ["Q-402", "37"], ["Q-403", "41"]] } }
    arrow: "solo las de 38° o más"
    output: { label: imprime, cells: ["Q-401 · 42°", "Q-403 · 41°"] }
starter: |
  def etiquetas(botellas, grado_minimo):
      for codigo, grado in botellas:
          if grado >= grado_minimo:
              return f"{codigo} · {grado}°"


  lote = [("Q-401", 42), ("Q-402", 37), ("Q-403", 41)]
  for etiqueta in etiquetas(lote, 38):
      print(etiqueta)
solution: |
  def etiquetas(botellas, grado_minimo):
      for codigo, grado in botellas:
          if grado >= grado_minimo:
              yield f"{codigo} · {grado}°"


  lote = [("Q-401", 42), ("Q-402", 37), ("Q-403", 41)]
  for etiqueta in etiquetas(lote, 38):
      print(etiqueta)
hints:
  - "`return` termina la función en la primera botella y devuelve un texto. Un `for` sobre un texto recorre sus letras."
  - "Para entregar una etiqueta por botella y seguir con la siguiente, cambia `return` por `yield`."
tests:
  - name: imprime las dos etiquetas
    output: "Q-401 · 42°\nQ-403 · 41°"
  - name: etiquetas es un generador
    source: '\byield\b'
  - name: funciona con otro lote
    run: 'list(etiquetas([("A-150", 40), ("A-151", 39), ("I-210", 36)], 39))'
    equals: ["A-150 · 40°", "A-151 · 39°"]
```

```exercise
id: py14-escribe-precintos
type: write
title: Precintos para siempre
prompt: |
  Escribe el generador infinito `precintos(prefijo, inicio=1)`, que entrega `"MOQ-0001"`, `"MOQ-0002"`… sin parar: el prefijo, un guion y el número con 4 cifras (`f"{numero:04d}"`).

  Cada botella que sale de El Tinajón lleva un precinto de la Denominación de Origen con un número correlativo. Nadie sabe cuántas botellas saldrán en la vendimia, así que la máquina no debe tener fin: quien la use tomará los que necesite con `islice`.
visual:
  figure:
    input: { label: "precintos(\"MOQ\", 998)", text: "un generador sin fin" }
    arrow: "islice(..., 4)"
    output: { label: "list(...)", cells: ["MOQ-0998", "MOQ-0999", "MOQ-1000", "MOQ-1001"] }
starter: |
  from itertools import count, islice


  def precintos(prefijo, inicio=1):
      pass


  print(list(islice(precintos("MOQ"), 3)))
solution: |
  from itertools import count, islice


  def precintos(prefijo, inicio=1):
      for numero in count(inicio):
          yield f"{prefijo}-{numero:04d}"


  print(list(islice(precintos("MOQ"), 3)))
hints:
  - "`for numero in count(inicio):` es un bucle que no termina nunca, y está bien: el `yield` lo pausa en cada vuelta."
  - "Con 4 cifras: `f\"{prefijo}-{numero:04d}\"`."
tests:
  - name: los tres primeros
    run: list(islice(precintos("MOQ"), 3))
    equals: ["MOQ-0001", "MOQ-0002", "MOQ-0003"]
  - name: desde otro inicio, pasando de 999
    run: list(islice(precintos("MOQ", 998), 4))
    equals: ["MOQ-0998", "MOQ-0999", "MOQ-1000", "MOQ-1001"]
  - name: no se acaba
    expect: 'list(islice(precintos("ILO"), 5000))[-1] == "ILO-5000"'
  - name: es un generador
    expect: 'next(precintos("Q", 7)) == "Q-0007"'
  - name: usa yield
    source: '\byield\b'
```

```exercise
id: py14-escribe-turnos
type: write
title: El parte de los tres turnos
prompt: |
  Completa la tubería que suma los litros de las tinajas a lo largo de los tres turnos:

  - `lineas_de(turnos)`: un generador que entrega todas las líneas de todos los turnos, en orden, con `yield from`.
  - `lecturas(turnos)`: un generador que recorre `lineas_de(turnos)`, separa cada línea en tinaja y litros, **salta** las que dicen `---` (el sensor no leyó) y entrega `(tinaja, litros)` con los litros como `int`.
  - `total_litros(turnos)`: la suma de los litros, con `sum` y una expresión generadora sobre `lecturas(turnos)`.

  Cada turno de la cava anota sus lecturas en una lista aparte, como `"T-12 340"`.
visual:
  figure:
    input: { label: turnos, table: { head: ["mañana", "tarde", "noche"], rows: [["T-12 340", "T-07 ---", "T-12 280"], ["T-07 150", "T-03 410", ""]] } }
    arrow: "lineas_de → lecturas → sum"
    output: { label: "total_litros(turnos)", value: "1180" }
starter: |
  def lineas_de(turnos):
      pass


  def lecturas(turnos):
      pass


  def total_litros(turnos):
      return 0


  turnos = [["T-12 340", "T-07 150"], ["T-07 ---", "T-03 410"], ["T-12 280"]]
  print(total_litros(turnos))
solution: |
  def lineas_de(turnos):
      for turno in turnos:
          yield from turno


  def lecturas(turnos):
      for linea in lineas_de(turnos):
          tinaja, litros = linea.split()
          if litros != "---":
              yield tinaja, int(litros)


  def total_litros(turnos):
      return sum(litros for _, litros in lecturas(turnos))


  turnos = [["T-12 340", "T-07 150"], ["T-07 ---", "T-03 410"], ["T-12 280"]]
  print(total_litros(turnos))
hints:
  - "`lineas_de` es un `for turno in turnos:` con `yield from turno` adentro. `lecturas` recorre `lineas_de(turnos)` y usa `linea.split()`."
  - "`sum(litros for _, litros in lecturas(turnos))` desempaca cada tupla y suma solo los litros."
tests:
  - name: el ejemplo del dibujo
    run: total_litros([["T-12 340", "T-07 150"], ["T-07 ---", "T-03 410"], ["T-12 280"]])
    equals: 1180
  - name: lineas_de junta los turnos en orden
    run: 'list(lineas_de([["a"], [], ["b", "c"]]))'
    equals: ["a", "b", "c"]
  - name: lecturas salta las que no leyó el sensor
    run: 'list(lecturas([["T-01 ---", "T-02 90"], ["T-03 ---"]]))'
    equals: [["T-02", 90]]
  - name: sin turnos
    run: total_litros([])
    equals: 0
  - name: usa yield from
    source: '\byield\s+from\b'
  - name: suma con una expresión generadora
    source: 'sum\(\s*\w+\s+for\b'
    msg: "Suma con sum(... for ... in lecturas(turnos)), sin armar una lista."
```

```exercise
id: py14-predice-itertools
type: predict
title: Las tandas de la faja
prompt: |
  Quilla resume una faja corta con `itertools`. ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: faja, cells: ["Q", "Q", "I", "Q"] }
code: |
  from itertools import accumulate, groupby, pairwise
  faja = ["Q", "Q", "I", "Q"]
  print([variedad for variedad, _ in groupby(faja)])
  print(list(accumulate([3, 1, 2])))
  print(len(list(pairwise(faja))))
options:
  - "['Q', 'I', 'Q']\n[3, 4, 6]\n3"
  - "['Q', 'I']\n[3, 4, 6]\n3"
  - "['Q', 'I', 'Q']\n[3, 1, 2]\n2"
  - "['Q', 'I', 'Q']\n[3, 4, 6]\n2"
answer: "['Q', 'I', 'Q']\n[3, 4, 6]\n3"
explain: |
  `groupby` junta solo los iguales **seguidos**: la `Q` del final es otra tanda, así que sale dos veces. `accumulate` da los totales acumulados: 3, 3+1, 3+1+2. Y `pairwise` de 4 valores da 3 pares: `(Q, Q)`, `(Q, I)`, `(I, Q)`.
```

## El caso

```exercise
id: py14-caso-botella
type: case
title: La botella que nunca salió
prompt: |
  **Cuenta, para cada variedad, cuántas botellas llenadas salieron de verdad por el final de la faja, compáralo con lo que reportó su robot y encuentra la botella que entró y nunca salió.**

  Al cerrar el turno, el lector de la llenadora registró 25 botellas y el de la salida, una menos. Cada variedad tiene su robot encargado, y cada uno juró que todas las suyas salieron. El script del turno noche no ayudó: dijo que de italia y de acholado **no había salido ninguna**. Era este:

  ```py
  salidas = leer(registro_salida)
  for variedad in encargados:
      salieron = [codigo for codigo, v in salidas if v == variedad]
  ```

  La primera vuelta se gastó el generador `salidas`, y las otras dos lo encontraron vacío. Ojo también: el lector de la salida a veces lee dos veces la misma botella.

  Imprime una línea por robot que empiece con su nombre, por ejemplo `print("Chala:", salieron)`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py14-caso-botella
    task: "Botellas que salieron = las llenadas cuyo código aparece en el registro de salida (sin contar dos veces una lectura repetida)."
    cards:
      - name: Chala
        kind: robot
        role: Encargado de la quebranta
        rows: [["Llenó", "10 botellas"], ["Dijo", "\"salieron todas\""], ["Reportó", "10"]]
        clue: { find: "Chala", says: 10 }
      - name: Uvina
        kind: robot
        role: Encargada de la italia
        rows: [["Llenó", "7 botellas"], ["Dijo", "\"ni una se quedó\""], ["Reportó", "7"]]
        clue: { find: "Uvina", says: 7 }
      - name: Mosto
        kind: robot
        role: Encargado del acholado
        culprit: true
        rows: [["Llenó", "8 botellas"], ["Dijo", "\"las vi salir a todas\""], ["Reportó", "8"]]
        clue: { find: "Mosto", says: 8 }
      - name: El turno noche
        kind: note
        role: El script que reusó el generador
        rows: [["quebranta", "10"], ["italia", "0"], ["acholado", "0"]]
globals:
  registro_llenado: ["Q-401 quebranta", "Q-402 quebranta", "I-210 italia", "Q-403 quebranta", "A-150 acholado", "A-151 acholado", "I-211 italia", "Q-404 quebranta", "Q-405 quebranta", "A-152 acholado", "I-212 italia", "I-213 italia", "Q-406 quebranta", "A-153 acholado", "A-154 acholado", "Q-407 quebranta", "I-214 italia", "A-155 acholado", "Q-408 quebranta", "I-215 italia", "A-156 acholado", "Q-409 quebranta", "A-157 acholado", "I-216 italia", "Q-410 quebranta"]
  registro_salida: ["Q-401 quebranta", "Q-402 quebranta", "I-210 italia", "Q-403 quebranta", "A-150 acholado", "A-151 acholado", "I-211 italia", "Q-404 quebranta", "Q-405 quebranta", "Q-405 quebranta", "A-152 acholado", "I-212 italia", "I-213 italia", "Q-406 quebranta", "A-153 acholado", "Q-407 quebranta", "I-214 italia", "A-155 acholado", "Q-408 quebranta", "I-215 italia", "A-156 acholado", "Q-409 quebranta", "A-157 acholado", "I-216 italia", "Q-410 quebranta"]
  encargados: { quebranta: Chala, italia: Uvina, acholado: Mosto }
starter: |
  # registro_llenado y registro_salida ya existen: listas de líneas como "Q-401 quebranta"
  # encargados: {"quebranta": "Chala", "italia": "Uvina", "acholado": "Mosto"}

  def leer(registro):
      for linea in registro:
          codigo, variedad = linea.split()
          yield codigo, variedad


  llenadas = leer(registro_llenado)
  salidas = leer(registro_salida)

  # TODO: recorre salidas UNA sola vez y guarda sus códigos en un set.
  # Después recorre llenadas: cuenta por variedad las que salieron
  # y anota las que no. Imprime una línea por robot:
  # print("Chala:", salieron)
solution: |
  def leer(registro):
      for linea in registro:
          codigo, variedad = linea.split()
          yield codigo, variedad


  llenadas = leer(registro_llenado)
  salidas = leer(registro_salida)

  salieron_codigos = {codigo for codigo, _ in salidas}
  por_variedad = {}
  no_salieron = []
  for codigo, variedad in llenadas:
      if codigo in salieron_codigos:
          por_variedad[variedad] = por_variedad.get(variedad, 0) + 1
      else:
          no_salieron.append(codigo)

  for variedad, robot_encargado in encargados.items():
      print(f"{robot_encargado}: {por_variedad.get(variedad, 0)}")
  print("No salió:", no_salieron)
answer: A-154
answerLabel: ¿Qué botella entró a la faja y nunca salió?
reveal: |
  La A-154, un acholado. Salieron 10 de quebranta y 7 de italia, como dijeron Chala y Uvina, pero de acholado solo 7 de 8: Mosto reportó 8 sin mirar. Si cuentas las **líneas** de la salida en vez de los códigos, la Q-405 (leída dos veces) te da 11 de quebranta: el set se lo quita de encima. Y el turno noche vio 0 en italia y acholado porque recorrió el mismo generador tres veces: después de la primera vuelta ya no le quedaba nada que entregar.
hints:
  - "Gasta `salidas` una sola vez: `salieron_codigos = {codigo for codigo, _ in salidas}`. Un set ya ignora la Q-405 repetida."
  - "Después, en `for codigo, variedad in llenadas:`, pregunta `codigo in salieron_codigos` y cuenta con un diccionario por variedad; lo que no esté, anótalo aparte."
```

## El juez

Como desde la sesión 4, el juez llama a una función y compara lo que **devuelve**. Un generador no es un valor que se pueda comparar, así que en estos problemas la función juzgada **consume** tu generador y devuelve una lista: esa parte ya viene escrita en el código inicial.

```exercise
id: py14-juez-ventanas
type: judge
mode: function
function: sumas_moviles
title: Los atascos de la etiquetadora
prompt: |
  **Escribe el generador `ventanas(lecturas, k)`, que entrega la suma de cada tramo de `k` minutos seguidos, del primero al último.**

  El contador de la etiquetadora anota cuántas botellas pasaron en cada minuto. Herminia quiere ver los tramos de `k` minutos: si un tramo suma poco, ahí hubo un atasco. El primer tramo son los minutos 1 a `k`, el segundo los minutos 2 a `k + 1`, y así hasta que el tramo toca el último minuto. Si hay menos de `k` minutos, no hay ningún tramo.

  `sumas_moviles(lecturas, k)` ya está escrita: devuelve `list(ventanas(lecturas, k))`, y es la que llama el juez.

  **Restricciones:** 0 ≤ `len(lecturas)` ≤ 60 · 1 ≤ `k` ≤ 12 · cada lectura entre 0 y 40.
starter: |
  def ventanas(lecturas, k):
      yield 0


  def sumas_moviles(lecturas, k):
      return list(ventanas(lecturas, k))
solution: |
  def ventanas(lecturas, k):
      suma = 0
      for i, botellas in enumerate(lecturas):
          suma += botellas
          if i >= k:
              suma -= lecturas[i - k]
          if i >= k - 1:
              yield suma


  def sumas_moviles(lecturas, k):
      return list(ventanas(lecturas, k))
hints:
  - "Lo más directo: `for inicio in range(len(lecturas) - k + 1): yield sum(lecturas[inicio:inicio + k])`. Cuenta cuántos tramos hay con 5 minutos y `k = 3`: son 3, no 2."
  - "Sin volver a sumar todo: lleva una `suma` que agrega el minuto que entra y resta el que sale (`lecturas[i - k]`), y entrega desde que `i >= k - 1`."
visual:
  figure:
    title: El ejemplo 1, tramo por tramo
    panes:
      - { label: "lecturas, k = 3", cells: [12, 15, 3, 0, 14, 16], highlight: [2, 3] }
      - { label: tramos, table: { head: ["minutos", "suma"], rows: [["1–3", "12 + 15 + 3 = 30"], ["2–4", "15 + 3 + 0 = 18"], ["3–5", "3 + 0 + 14 = 17"], ["4–6", "0 + 14 + 16 = 30"]] } }
      - { label: devuelve, value: "[30, 18, 17, 30]" }
    caption: "Seis minutos dan **cuatro** tramos de 3: `len(lecturas) - k + 1`. Los minutos 3 y 4 fueron el atasco."
samples:
  - args: [[12, 15, 3, 0, 14, 16], 3]
    returns: [30, 18, 17, 30]
    note: El dibujo de arriba.
  - args: [[8, 9], 3]
    returns: []
    note: Dos minutos no alcanzan para un tramo de tres.
edge:
  - args: [[], 1]
    tag: sin lecturas
  - args: [[7], 1]
    tag: con un solo minuto y tramos de uno
  - args: [[5, 6, 7], 3]
    tag: cuando el tramo es todo el turno
  - args: [[4, 0, 9, 2], 1]
    tag: con tramos de un minuto
  - args: [[0, 0, 0, 0, 0], 2]
    tag: con la faja parada todo el rato
  - args: [[3, 1, 4, 1], 5]
    tag: cuando k es más grande que el turno
random:
  count: 40
  seed: 1414
  generate: |
    n = rng.int(0, 60)
    k = rng.int(1, 12)
    return [rng.list(n, 0, 40), k]
wrong:
  - |
    def ventanas(lecturas, k):
        for inicio in range(len(lecturas) - k):
            yield sum(lecturas[inicio:inicio + k])


    def sumas_moviles(lecturas, k):
        return list(ventanas(lecturas, k))
  - |
    def ventanas(lecturas, k):
        suma = 0
        for i, botellas in enumerate(lecturas):
            suma += botellas
            if i >= k:
                suma -= lecturas[i - k]
            yield suma


    def sumas_moviles(lecturas, k):
        return list(ventanas(lecturas, k))
  - |
    def ventanas(lecturas, k):
        suma = 0
        for i, botellas in enumerate(lecturas):
            suma += botellas
            if i > k:
                suma -= lecturas[i - k]
            if i >= k - 1:
                yield suma


    def sumas_moviles(lecturas, k):
        return list(ventanas(lecturas, k))
```

```exercise
id: py14-juez-intercalar
type: judge
mode: function
function: unir_lineas
title: Dos llenadoras, una faja
prompt: |
  **Escribe el generador `intercalar(linea_a, linea_b)`, que recibe dos generadores y entrega sus botellas alternadas: una de A, una de B, una de A… Cuando uno se acaba, sigue con todo lo que le quede al otro.**

  En la vendimia, El Tinajón prende sus dos llenadoras y las dos desembocan en la misma faja, que las va tomando por turnos. Ninguna botella puede quedarse en una llenadora: si A ya terminó, la faja sigue tomando de B hasta vaciarla.

  Ojo: `linea_a` y `linea_b` son **generadores**, no listas. No tienen `len` ni posiciones; solo puedes pedirles el siguiente con `next(linea, None)`, que da `None` cuando ya no queda nada (ninguna botella es `None`).

  `unir_lineas(a, b)` ya está escrita: convierte las dos listas en generadores, llama a tu `intercalar` y devuelve la lista de lo que entregó.

  **Restricciones:** cada línea trae de 0 a 15 botellas.
starter: |
  def intercalar(linea_a, linea_b):
      yield from linea_a


  def unir_lineas(a, b):
      return list(intercalar((botella for botella in a), (botella for botella in b)))
solution: |
  def intercalar(linea_a, linea_b):
      while True:
          botella_a = next(linea_a, None)
          botella_b = next(linea_b, None)
          if botella_a is None and botella_b is None:
              return
          if botella_a is not None:
              yield botella_a
          if botella_b is not None:
              yield botella_b


  def unir_lineas(a, b):
      return list(intercalar((botella for botella in a), (botella for botella in b)))
hints:
  - "En un `while True`, pide una botella a cada línea con `next(linea_a, None)` y `next(linea_b, None)`. Entrega la que no sea `None`."
  - "Cuando las dos dan `None`, ya no queda nada: `return` termina el generador. No uses `zip`: se detiene en la línea más corta y deja botellas en la otra."
visual:
  figure:
    title: El ejemplo 1, por turnos
    panes:
      - { label: linea_a, cells: ["A-1", "A-2", "A-3", "A-4"] }
      - { label: linea_b, cells: ["B-1", "B-2"] }
      - { label: faja, cells: ["A-1", "B-1", "A-2", "B-2", "A-3", "A-4"], highlight: [4, 5] }
    caption: "B se acabó después de `B-2`; `A-3` y `A-4` igual suben a la faja, una detrás de la otra."
samples:
  - args: [["A-1", "A-2", "A-3", "A-4"], ["B-1", "B-2"]]
    returns: ["A-1", "B-1", "A-2", "B-2", "A-3", "A-4"]
    note: El dibujo de arriba.
  - args: [["A-1"], ["B-1", "B-2", "B-3"]]
    returns: ["A-1", "B-1", "B-2", "B-3"]
    note: Ahora la que sobra es B.
edge:
  - args: [[], []]
    tag: con las dos llenadoras vacías
  - args: [[], ["B-1", "B-2"]]
    tag: cuando A no llenó nada
  - args: [["A-1", "A-2"], []]
    tag: cuando B no llenó nada
  - args: [["A-1", "A-2", "A-3"], ["B-1", "B-2", "B-3"]]
    tag: con las dos del mismo largo
  - args: [["A-1"], ["B-1"]]
    tag: con una botella en cada una
random:
  count: 40
  seed: 1415
  generate: |
    a = [f"A-{i}" for i in range(1, rng.int(0, 15) + 1)]
    b = [f"B-{i}" for i in range(1, rng.int(0, 15) + 1)]
    return [a, b]
wrong:
  - |
    def intercalar(linea_a, linea_b):
        for botella_a, botella_b in zip(linea_a, linea_b):
            yield botella_a
            yield botella_b


    def unir_lineas(a, b):
        return list(intercalar((botella for botella in a), (botella for botella in b)))
  - |
    def intercalar(linea_a, linea_b):
        for botella_a in linea_a:
            yield botella_a
            botella_b = next(linea_b, None)
            if botella_b is not None:
                yield botella_b


    def unir_lineas(a, b):
        return list(intercalar((botella for botella in a), (botella for botella in b)))
  - |
    def intercalar(linea_a, linea_b):
        while True:
            botella_a = next(linea_a, None)
            botella_b = next(linea_b, None)
            if botella_a is None or botella_b is None:
                return
            yield botella_a
            yield botella_b


    def unir_lineas(a, b):
        return list(intercalar((botella for botella in a), (botella for botella in b)))
  - |
    def intercalar(linea_a, linea_b):
        yield from linea_a
        yield from linea_b


    def unir_lineas(a, b):
        return list(intercalar((botella for botella in a), (botella for botella in b)))
```

## Misión final

```exercise
id: py14-mision-cava
type: mission
title: La ruta de la cava
prompt: |
  **Escribe el generador `pasos(ruta)`, que convierte la ruta de Herminia en pasos sueltos, y haz que Quilla los consuma uno por uno: mirar hacia ese rumbo, avanzar una casilla y recoger. Al final, en la bodega de despacho (D), reporta el total una sola vez.**

  Después de la vendimia quedan botellas tiradas por la cava. Herminia le dicta a Quilla la ruta en tramos, como `"E3 S2 E3 S2"`: tres casillas al este, dos al sur, etc. (`N`, `E`, `S`, `O`). `pasos("E3 S2")` debe entregar `"E"`, `"E"`, `"E"`, `"S"`, `"S"`, uno por cada casilla.

  - Para cada tramo de `ruta.split()`, el rumbo es `tramo[0]` y las casillas son `int(tramo[1:])`.
  - `mirar(rumbo)` ya está escrita: gira hasta mirar a ese rumbo.
  - Recorre `for rumbo in pasos(ruta):` y en cada paso `mirar`, `robot.avanzar()` y suma `robot.recoger()`.

  Quilla lleva **la batería justa**, y se prueba en tres cavas con rutas distintas. Cuando pase, junto con los jueces, se desbloquea la sesión 15.
starter: |
  def mirar(rumbo):
      """Gira a la derecha hasta quedar mirando a rumbo: "N", "E", "S" u "O"."""
      while robot.direccion != rumbo:
          robot.girar_derecha()


  def pasos(ruta):
      """Entrega un rumbo por cada casilla de la ruta: "E2 S1" → "E", "E", "S"."""
      pass


  # ruta ya existe, por ejemplo "E3 S2 E3 S2"
  total = 0

  robot.reportar(total)
solution: |
  def mirar(rumbo):
      """Gira a la derecha hasta quedar mirando a rumbo: "N", "E", "S" u "O"."""
      while robot.direccion != rumbo:
          robot.girar_derecha()


  def pasos(ruta):
      """Entrega un rumbo por cada casilla de la ruta: "E2 S1" → "E", "E", "S"."""
      for tramo in ruta.split():
          rumbo = tramo[0]
          for _ in range(int(tramo[1:])):
              yield rumbo


  total = 0
  for rumbo in pasos(ruta):
      mirar(rumbo)
      robot.avanzar()
      total += robot.recoger()

  robot.reportar(total)
hints:
  - "En `pasos`, un `for tramo in ruta.split():` y, dentro, otro `for` que repite `yield rumbo` tantas veces como diga `int(tramo[1:])`."
  - "Afuera, `for rumbo in pasos(ruta):` pide un paso a la vez. `robot.recoger()` devuelve 0 en una casilla vacía, así que puedes recoger en todas."
globals:
  ruta: "E3 S2 E3 S2"
world:
  theme: mina
  level: 3
  dir: E
  battery: 10
  map: |
    ##########
    #R.2.#####
    ####1#####
    ####.3..##
    #######2##
    #######D##
    ##########
scenarios:
  - {}
  - globals: { ruta: "O5 S2 E5 S2" }
    world: { battery: 14, dir: N }
    map: |
      #########
      #.....R.#
      #.#######
      #.4..1..#
      ######3.#
      ######D.#
      #########
  - globals: { ruta: "O4 N2 E5 N2 O5" }
    world: { battery: 18, dir: W }
    map: |
      ########
      #D.....#
      ######.#
      #.5..2.#
      #.######
      #.1..R.#
      ########
tests:
  - name: pasos entrega un rumbo por casilla
    expect: 'list(pasos("E2 S1 O3")) == ["E", "E", "S", "O", "O", "O"]'
    msg: 'pasos("E2 S1 O3") debe entregar E, E, S, O, O, O.'
  - name: pasos es un generador
    source: '\byield\b'
  - name: Quilla consume los pasos de a uno
    source: 'for\s+\w+\s+in\s+pasos\('
  - name: no quedan botellas en la cava
    state: w.crystals_left == 0
    msg: Quedaron botellas. ¿Recoges en cada casilla del camino?
  - name: termina en el despacho
    state: w.at_goal
    msg: Quilla no terminó en la D. ¿pasos entrega todas las casillas de cada tramo?
  - name: reporta el total exacto, una vez
    state: w.reports == [w.crystals_total]
  - name: Quilla no choca ni se queda sin batería
    state: not w.crashed
```

## Reto experto

```exercise
id: py14-reto-tandas
type: challenge
title: Tu propio batched
visual:
  figure:
    title: De a tres, sin mirar el final
    input: { label: "en_tandas(count(1), 3)", text: "1, 2, 3, 4, 5, 6, 7, …" }
    arrow: "islice(..., 2)"
    output: { label: devuelve, cells: ["(1, 2, 3)", "(4, 5, 6)"] }
prompt: |
  **Escribe el generador `en_tandas(iterable, n)`, que entrega tuplas de `n` elementos en orden; la última puede ser más corta y nunca sale una tupla vacía.** Para quien ya programa.

  Es lo que hace `itertools.batched`, pero aquí no puedes usarlo. Las cajas de El Tinajón llevan `n` botellas, y la faja no termina nunca: tu generador debe funcionar con un iterable **infinito** y no pedir ni un elemento más de los que necesita para la tanda que está entregando. Recibe cualquier iterable (una lista, un texto, otro generador), no solo listas.
starter: |
  from itertools import count, islice


  def en_tandas(iterable, n):
      pass


  print(list(en_tandas("QQIAQ", 2)))
solution: |
  from itertools import count, islice


  def en_tandas(iterable, n):
      iterador = iter(iterable)
      while tanda := tuple(islice(iterador, n)):
          yield tanda


  print(list(en_tandas("QQIAQ", 2)))
hints:
  - "Saca un solo iterador con `iter(iterable)` y pídele `islice(iterador, n)` en cada vuelta: como es el mismo iterador, cada `islice` sigue donde quedó el anterior."
  - "Cuando la tupla sale vacía, se acabó: `while tanda := tuple(islice(iterador, n)):`."
tests:
  - name: un texto de a dos
    run: list(en_tandas("QQIAQ", 2))
    equals: [["Q", "Q"], ["I", "A"], ["Q"]]
  - name: justas, sin tupla vacía al final
    run: list(en_tandas([1, 2, 3, 4], 2))
    equals: [[1, 2], [3, 4]]
  - name: entrega tuplas
    expect: 'next(en_tandas([1, 2, 3], 2)) == (1, 2)'
  - name: nada que empacar
    run: list(en_tandas([], 3))
    equals: []
  - name: funciona con una faja infinita
    run: list(islice(en_tandas(count(1), 3), 2))
    equals: [[1, 2, 3], [4, 5, 6]]
  - name: no pide más de lo que necesita
    run: 'next(en_tandas((botella if botella else 1 / 0 for botella in [7, 8, 9, 0]), 3))'
    equals: [7, 8, 9]
    msg: Para la primera tanda solo debes pedir 3 elementos; el cuarto rompe la faja.
  - name: sin itertools.batched
    sourceNot: '\bbatched\b'
```
