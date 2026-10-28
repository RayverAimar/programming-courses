# Sesión 15 — Recursión

## El encargo

Chachapoyas, Amazonas. Tres horas de curvas sobre el Utcubamba y luego el teleférico hasta el cerro Barreta, donde está **Kuélap**: la fortaleza de los chachapoyas, con murallas de veinte metros, cuatrocientas casas redondas y frisos de rombos en la piedra. La arqueóloga **Elvira Zuta Culqui** dirige la restauración de sus terrazas, y tiene tres problemas: escaleras que nadie ha contado, cajas de hallazgos metidas dentro de otras cajas, y una cueva bajo el cerro que nadie se atreve a recorrer sin plano.

Maru mandó a Quilla con su **faro en la cabeza**. Los tres problemas tienen la misma forma: una cosa grande hecha de cosas iguales pero más chicas. Una escalera es un escalón más una escalera; una caja es piezas más cajas; una cueva es una casilla más las cuevas que salen de ella. Hoy Quilla aprende a resolver un problema **llamándose a sí misma** con un problema más chico: la **recursión**.

```escena
theme: mina
level: 3
dir: N
caption: La galería de entrada bajo Kuélap. Quilla sube, recoge los cristales del camino y avisa que hay más túneles adelante.
map: |
  ##########
  #...2.####
  ####..1..#
  ####.##R.#
  ##########
program: |
  robot.avanzar()
  robot.girar_izquierda()
  robot.avanzar()
  robot.recoger()
  robot.avanzar()
  robot.girar_derecha()
  robot.avanzar()
  robot.girar_izquierda()
  robot.avanzar()
  robot.recoger()
  robot.decir("Hay más túneles")
```

## Lo mínimo

Una función **recursiva** se llama a sí misma. Siempre tiene dos partes:

- el **caso base**: un problema tan chico que la respuesta se sabe sin pensar, y ahí se detiene;
- el **caso recursivo**: resuelve un pedacito y le pasa **un problema más chico** a otra llamada de sí misma.

```py run
def bajar(terraza):
    if terraza == 0:
        print("¡Plaza!")
        return
    print("Terraza", terraza)
    bajar(terraza - 1)

bajar(3)
```

Cada llamada que todavía no termina espera en la **pila de llamadas**, con sus propios parámetros. La pila crece hasta llegar al caso base y después se desarma: cada caja recibe lo que devolvió la de arriba, le suma su parte y lo entrega a la de abajo.

```anima
title: La pila crece hasta el caso base y luego se desarma
code: |
  def piedras(terraza):
      if terraza == 0:
          return 0
      return terraza * 10 + piedras(terraza - 1)

  total = piedras(3)
  print(total)
notes:
  6: "Se pide piedras(3): la terraza 3 lleva 30 piedras, más las de las terrazas de abajo."
  4: "Esta llamada no puede sumar todavía: espera a que la de abajo le conteste."
  3: "Caso base: la terraza 0 es la plaza, sin piedras. Aquí la pila deja de crecer."
  7: "Cada caja sumó su parte al volver: 10, luego 30, luego 60."
```

Si el caso base nunca llega, la pila crece sin fin. Python la corta a las mil llamadas, más o menos, con un **`RecursionError`**: *maximum recursion depth exceeded*. Casi siempre es un caso base que falta, o una llamada que no achica el problema (`bajar(terraza)` en vez de `bajar(terraza - 1)`), o uno que se salta el base (`n - 2` desde un impar nunca da 0).

La recursión brilla con datos **anidados**, que tienen la misma forma por dentro: una lista que contiene listas, un diccionario con diccionarios. Un bucle no sabe cuántos niveles hay; la función recursiva entra a cada nivel llamándose otra vez.

```py run
def contar(caja):
    total = 0
    for cosa in caja:
        total += contar(cosa) if isinstance(cosa, list) else 1
    return total

print(contar(["olla", ["tupu", ["cuenta", "cuenta"]], "huso"]))
```

Algunas recursiones repiten trabajo: `formas(n - 1)` y `formas(n - 2)` vuelven a pedir los mismos valores una y otra vez, y el número de llamadas se duplica con cada `n`. **`@cache`** (de `functools`, la viste en la sesión 11) guarda cada resultado según sus argumentos: la segunda vez que se pide, contesta de memoria. Eso es **memoización**. Sus argumentos tienen que ser hashables: números, textos, tuplas.

```py run
from functools import cache

@cache
def formas(n):
    if n <= 1:
        return 1
    return formas(n - 1) + formas(n - 2)

print(formas(90))
```

Sin `@cache`, `formas(90)` tardaría siglos. Con ella, son 91 llamadas.

**Backtracking** es recursión para probar todas las opciones: **elegir** algo, **explorar** lo que sigue con esa elección y **deshacerla** para probar la siguiente. Así salen todos los subconjuntos, todos los órdenes posibles o todos los caminos de un laberinto.

```py run
def elegir(cosas, i, elegidos):
    if i == len(cosas):
        print(elegidos)
        return
    elegidos.append(cosas[i])
    elegir(cosas, i + 1, elegidos)
    elegidos.pop()
    elegir(cosas, i + 1, elegidos)

elegir(["maíz", "papa", "oca"], 0, [])
```

En un laberinto, Quilla **elige** una vecina, **explora** desde ahí y, si no llega a la salida, la **saca** del camino y prueba la siguiente. Mira el camino (resaltado) crecer y encogerse en el callejón sin salida:

```anima
title: Backtracking en un laberinto
code: |
  plano = ["######", "#R...#", "#.####", "#..D##", "######"]

  def buscar(x, y, vistos, camino):
      if plano[y][x] == "#" or (x, y) in vistos:
          return False
      vistos.add((x, y))
      camino.append((x, y))
      if plano[y][x] == "D":
          return True
      for dx, dy in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
          if buscar(x + dx, y + dy, vistos, camino):
              return True
      camino.pop()
      return False

  ruta = []
  print(buscar(1, 1, set(), ruta), ruta)
grid: { map: ["######", "#R...#", "#.####", "#..D##", "######"], visited: vistos, frontier: camino }
show: [x, y, camino]
speed: 500
notes:
  4: "Caso base: roca o casilla ya vista. No hay nada que explorar."
  8: "Caso base: llegó a la D. El True sube por toda la pila."
  13: "Callejón sin salida: saca la casilla del camino y vuelve atrás."
```

> **Trampa común:** escribir el caso base para un solo valor (`if n == 1:`) cuando la recursión también puede llegar a 0, o a un número negativo. Pregúntate: ¿qué valores pueden llegar a la función, y todos terminan en algún caso base?

<!-- mdn: recursion-limit -->

## Práctica

```exercise
id: py15-predice-subir
type: predict
title: Subir y bajar
prompt: |
  Quilla anuncia cada terraza al subir y al bajar. Antes de ejecutarlo: ¿qué imprime?
code: |
  def recorrer(terraza):
      if terraza == 0:
          print("plaza")
          return
      print("sube", terraza)
      recorrer(terraza - 1)
      print("baja", terraza)

  recorrer(2)
options:
  - "sube 2\nsube 1\nplaza\nbaja 1\nbaja 2"
  - "sube 2\nbaja 2\nsube 1\nbaja 1\nplaza"
  - "sube 2\nsube 1\nplaza\nbaja 2\nbaja 1"
  - "sube 2\nsube 1\nplaza"
answer: "sube 2\nsube 1\nplaza\nbaja 1\nbaja 2"
explain: |
  `recorrer(2)` imprime `sube 2` y se queda esperando a `recorrer(1)`, que imprime `sube 1` y espera a `recorrer(0)`: `plaza`. Recién entonces cada llamada termina su última línea, **de la más nueva a la más vieja**: `baja 1` y después `baja 2`. Lo que va después de la llamada recursiva sale al revés.
```

```exercise
id: py15-predice-cache
type: predict
title: ¿Cuántas veces se calculó?
prompt: |
  `llamadas` cuenta cuántas veces se ejecuta de verdad el cuerpo de `formas`. ¿Qué imprime?
code: |
  from functools import cache

  llamadas = 0

  @cache
  def formas(n):
      global llamadas
      llamadas += 1
      if n <= 1:
          return 1
      return formas(n - 1) + formas(n - 2)

  print(formas(5), llamadas)
  print(formas(5), llamadas)
options:
  - "8 6\n8 6"
  - "8 15\n8 30"
  - "8 6\n8 12"
  - "8 15\n8 15"
answer: "8 6\n8 6"
explain: |
  Con `@cache`, cada `n` se calcula **una sola vez**: 5, 4, 3, 2, 1 y 0, seis llamadas. Las demás se contestan de memoria sin entrar al cuerpo, y la segunda `formas(5)` ni siquiera entra. Sin `@cache` serían 15 llamadas la primera vez y 30 al final.
```

```exercise
id: py15-arregla-saltos
type: fix
title: La escalera de dos en dos
prompt: |
  Quilla sube las escaleras de Kuélap de dos en dos escalones. `saltos(escalones)` debería decir cuántos saltos da hasta llegar arriba (si queda un escalón suelto, también es un salto). Con 8 funciona, pero con 7 el programa se cae. Ejecútalo, lee el error y arregla el caso base.
visual:
  figure:
    input: { label: escalones, value: "7" }
    arrow: "7 → 5 → 3 → 1 → -1 → -3 → …"
    output: { label: "¿y el caso base?", text: "escalones == 0 nunca pasa con un impar" }
starter: |
  def saltos(escalones):
      if escalones == 0:
          return 0
      return 1 + saltos(escalones - 2)

  print(saltos(8))
  print(saltos(7))
solution: |
  def saltos(escalones):
      if escalones <= 0:
          return 0
      return 1 + saltos(escalones - 2)

  print(saltos(8))
  print(saltos(7))
hints:
  - "Desde 7 la cuenta va 5, 3, 1, -1, -3… y nunca pasa por 0: la pila crece hasta el `RecursionError`."
  - "Haz que el caso base atrape también los negativos: `if escalones <= 0:`."
tests:
  - name: saltos(8) es 4
    run: saltos(8)
    equals: 4
  - name: saltos(7) es 4
    run: saltos(7)
    equals: 4
  - name: saltos(1) es 1
    run: saltos(1)
    equals: 1
  - name: saltos(0) es 0
    run: saltos(0)
    equals: 0
  - name: imprime 4 y 4
    output: "4\n4"
  - name: sigue siendo recursiva
    source: 'return\s+1\s*\+\s*saltos\('
```

```exercise
id: py15-completa-aplanar
type: complete
title: Las cuentas en sus bolsitas
prompt: |
  En una chullpa salieron cuentas de collar guardadas en bolsitas, y algunas bolsitas dentro de otras. Completa los `___` para que `aplanar(bolsa)` devuelva todas las cuentas en una sola lista, en el orden en que aparecen.
visual:
  figure:
    input: { label: bolsa, text: "[\"spondylus\", [\"piedra\", [\"hueso\"]], \"cobre\"]" }
    arrow: entra a cada lista que encuentra
    output: { label: devuelve, cells: ["spondylus", "piedra", "hueso", "cobre"] }
starter: |
  def aplanar(bolsa):
      cuentas = []
      for cosa in bolsa:
          if isinstance(cosa, ___):
              cuentas.___(aplanar(___))
          else:
              cuentas.append(cosa)
      return cuentas

  print(aplanar(["spondylus", ["piedra", ["hueso"]], "cobre"]))
solution: |
  def aplanar(bolsa):
      cuentas = []
      for cosa in bolsa:
          if isinstance(cosa, list):
              cuentas.extend(aplanar(cosa))
          else:
              cuentas.append(cosa)
      return cuentas

  print(aplanar(["spondylus", ["piedra", ["hueso"]], "cobre"]))
hints:
  - "`isinstance(cosa, list)` pregunta si `cosa` es otra bolsita."
  - "`aplanar(cosa)` devuelve una lista; `extend` agrega sus elementos uno por uno (con `append` meterías la lista entera)."
tests:
  - name: el ejemplo del dibujo
    run: 'aplanar(["spondylus", ["piedra", ["hueso"]], "cobre"])'
    equals: ["spondylus", "piedra", "hueso", "cobre"]
  - name: bolsitas vacías
    run: 'aplanar([[], [[]], "cobre"])'
    equals: ["cobre"]
  - name: muy anidada
    run: 'aplanar([[[["oro"]]], "plata"])'
    equals: ["oro", "plata"]
  - name: imprime la lista
    output: "['spondylus', 'piedra', 'hueso', 'cobre']"
```

```exercise
id: py15-escribe-andenes
type: write
title: Los caminos por los andenes
prompt: |
  Escribe `caminos(filas, columnas)`, que cuenta de cuántas formas Quilla baja desde la esquina noroeste de un campo de andenes hasta la esquina sureste, **moviéndose solo al este o al sur**.

  Piensa en la última casilla: se llega desde la de arriba o desde la de la izquierda, así que `caminos(f, c) = caminos(f - 1, c) + caminos(f, c - 1)`. Con una sola fila o una sola columna hay un único camino. Elvira tiene un campo de 16 × 16: sin `@cache`, la cuenta no termina.
visual:
  figure:
    title: "caminos(3, 3) = 6; uno de ellos:"
    panes:
      - { label: "andenes 3 × 3", grid: ["R..", "...", "..D"], path: ["0,0", "1,0", "1,1", "1,2", "2,2"] }
      - { label: devuelve, value: "6" }
starter: |
  def caminos(filas, columnas):
      return 0

  print(caminos(3, 3))
solution: |
  from functools import cache


  @cache
  def caminos(filas, columnas):
      if filas == 1 or columnas == 1:
          return 1
      return caminos(filas - 1, columnas) + caminos(filas, columnas - 1)

  print(caminos(3, 3))
hints:
  - "El caso base: `if filas == 1 or columnas == 1: return 1`."
  - "Pon `@cache` (con `from functools import cache`) encima del `def`, y la función recuerda cada par `(filas, columnas)`."
tests:
  - name: caminos(3, 3) es 6
    run: caminos(3, 3)
    equals: 6
  - name: una sola fila
    run: caminos(1, 7)
    equals: 1
  - name: caminos(2, 5) es 5
    run: caminos(2, 5)
    equals: 5
  - name: el campo de 16 × 16, a tiempo
    run: caminos(16, 16)
    equals: 155117520
    msg: Si tarda demasiado, falta @cache.
  - name: es recursiva
    source: 'return\s+caminos\('
```

```exercise
id: py15-escribe-ordenes
type: write
title: El orden de las visitas
prompt: |
  Escribe `ordenes(chullpas)`, que devuelve **todos los órdenes** posibles para visitar las chullpas de la lista, cada uno como una lista, sin usar `itertools`.

  El grupo de turistas puede ver las chullpas en cualquier orden, y Elvira quiere comparar todos. La idea recursiva: cada chullpa puede ir primera, y detrás va **cada orden posible de las que quedan**. Una lista vacía tiene un solo orden: `[[]]`. Para la lista sin la chullpa `i`: `chullpas[:i] + chullpas[i + 1:]`.
visual:
  figure:
    input: { label: chullpas, cells: ["A", "B", "C"] }
    arrow: cada una primera, y detrás los órdenes del resto
    output: { label: devuelve, table: { head: ["primera", "órdenes"], rows: [["A", "A B C · A C B"], ["B", "B A C · B C A"], ["C", "C A B · C B A"]] } }
starter: |
  def ordenes(chullpas):
      return []

  print(ordenes(["A", "B", "C"]))
solution: |
  def ordenes(chullpas):
      if not chullpas:
          return [[]]
      resultado = []
      for i, primera in enumerate(chullpas):
          resto = chullpas[:i] + chullpas[i + 1:]
          for orden in ordenes(resto):
              resultado.append([primera] + orden)
      return resultado

  print(ordenes(["A", "B", "C"]))
hints:
  - "Caso base: `if not chullpas: return [[]]`, una lista con un orden vacío dentro."
  - "Para cada `i, primera in enumerate(chullpas)`, recorre `ordenes(resto)` y agrega `[primera] + orden`."
tests:
  - name: tres chullpas
    run: 'ordenes(["A", "B", "C"])'
    equals: [["A", "B", "C"], ["A", "C", "B"], ["B", "A", "C"], ["B", "C", "A"], ["C", "A", "B"], ["C", "B", "A"]]
  - name: una sola
    run: 'ordenes(["Pueblo Alto"])'
    equals: [["Pueblo Alto"]]
  - name: ninguna
    run: ordenes([])
    equals: [[]]
  - name: cinco chullpas dan 120 órdenes distintos
    expect: 'len({tuple(o) for o in ordenes([1, 2, 3, 4, 5])}) == 120'
  - name: sin itertools
    sourceNot: '\bitertools\b|\bpermutations\b'
```

## El caso

```exercise
id: py15-caso-cajas
type: case
title: La caja dentro de la caja
prompt: |
  **Escribe `total_piezas(caja)`, que suma las piezas de una caja y de todas las cajas que lleva dentro, a cualquier profundidad, y compáralo con lo que reportó cada embalador.**

  Las piezas del sector Pueblo Alto viajaron a Chachapoyas en cuatro cajas grandes. Cada caja es un diccionario: `"piezas"` son las que van sueltas en ella y `"dentro"` es la lista de cajas más chicas que lleva, que a su vez pueden llevar otras. En el depósito faltan unas cuentas de collar, y alguien reportó menos piezas de las que había para que nadie lo notara.

  `cajas` ya está cargada. Imprime una línea por embalador que empiece con su nombre: `print("Nelly:", total_piezas(cajas[0]))`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py15-caso-cajas
    task: "Total de una caja = sus piezas sueltas + el total de cada caja que lleva dentro."
    cards:
      - name: Nelly
        kind: person
        role: Embaló la caja PA-1
        rows: [["Cajas adentro", "2 (una lleva otra)"], ["Reportó", "14 piezas"]]
        clue: { find: "Nelly", says: 14 }
      - name: Wilder
        kind: person
        culprit: true
        role: Embaló la caja PA-2
        rows: [["Cajas adentro", "2 (y más adentro, otras dos)"], ["Reportó", "12 piezas"]]
        clue: { find: "Wilder", says: 12 }
      - name: Rosmery
        kind: person
        role: Embaló la caja PA-3
        rows: [["Cajas adentro", "3"], ["Reportó", "11 piezas"]]
        clue: { find: "Rosmery", says: 11 }
      - name: Eber
        kind: person
        role: Embaló la caja PA-4
        rows: [["Cajas adentro", "ninguna"], ["Reportó", "8 piezas"]]
        clue: { find: "Eber", says: 8 }
    caption: "Si una caja te sale con menos piezas, revisa si tu función entra a **todas** las cajas de adentro."
globals:
  cajas:
    - etiqueta: PA-1
      piezas: 3
      dentro:
        - { etiqueta: PA-1a, piezas: 5, dentro: [] }
        - { etiqueta: PA-1b, piezas: 2, dentro: [{ etiqueta: PA-1b-i, piezas: 4, dentro: [] }] }
    - etiqueta: PA-2
      piezas: 6
      dentro:
        - etiqueta: PA-2a
          piezas: 1
          dentro:
            - etiqueta: PA-2a-i
              piezas: 2
              dentro: [{ etiqueta: PA-2a-i-x, piezas: 7, dentro: [] }]
        - { etiqueta: PA-2b, piezas: 3, dentro: [] }
    - etiqueta: PA-3
      piezas: 0
      dentro:
        - { etiqueta: PA-3a, piezas: 4, dentro: [] }
        - { etiqueta: PA-3b, piezas: 4, dentro: [] }
        - { etiqueta: PA-3c, piezas: 2, dentro: [{ etiqueta: PA-3c-i, piezas: 1, dentro: [] }] }
    - { etiqueta: PA-4, piezas: 8, dentro: [] }
starter: |
  # cajas: las cuatro cajas grandes, en el orden de Nelly, Wilder, Rosmery y Eber.
  # Cada una: {"etiqueta": "PA-4", "piezas": 8, "dentro": [...otras cajas...]}
  print(cajas[3])

  # TODO: escribe total_piezas(caja), recursiva, e imprime una línea por embalador:
  # print("Nelly:", total_piezas(cajas[0]))
solution: |
  def total_piezas(caja):
      total = caja["piezas"]
      for chica in caja["dentro"]:
          total += total_piezas(chica)
      return total


  embaladores = ["Nelly", "Wilder", "Rosmery", "Eber"]
  for nombre, caja in zip(embaladores, cajas):
      print(f"{nombre}: {total_piezas(caja)}")
answer: Wilder
answerLabel: ¿Quién reportó menos piezas de las que había?
reveal: |
  Wilder. Su caja PA-2 tiene `6 + 1 + 2 + 7 + 3 = 19` piezas, y reportó 12: contó tres niveles y se "olvidó" de la cajita PA-2a-i-x, la más honda, con sus 7 cuentas. Un bucle de dos o tres niveles se habría equivocado igual; la función recursiva entra a todas las cajas, estén a la profundidad que estén.
hints:
  - "El caso base no necesita `if`: una caja con `\"dentro\": []` no entra al `for` y devuelve solo sus piezas."
  - "`total = caja[\"piezas\"]`, y por cada `chica in caja[\"dentro\"]`, `total += total_piezas(chica)`."
```

## El juez

```exercise
id: py15-juez-escalera
type: judge
mode: function
function: formas_de_subir
title: La escalera a Pueblo Alto
prompt: |
  **Escribe `formas_de_subir(n, saltos, rotos)`, que devuelve de cuántas formas distintas Quilla sube del escalón 0 al escalón `n`.**

  La escalera que sube al sector Pueblo Alto tiene `n` escalones. En cada movimiento, Quilla sube tantos escalones como diga algún número de la lista `saltos` (si `saltos` es `[1, 2]`, de uno en uno o de dos en dos). Algunos escalones están flojos, y sus números vienen en `rotos`: Quilla **no puede pisarlos**, aunque sí saltarlos por encima. Tiene que terminar **exactamente** en el escalón `n`, no pasarse.

  Piensa desde arriba: para llegar al escalón `k` el último salto vino de `k - s`, para cada `s` en `saltos`. Con `n` hasta 50, sin memoización no termina; como las listas no son hashables, pon la función recursiva con `@cache` **dentro** de `formas_de_subir`.

  **Restricciones:** 0 ≤ `n` ≤ 50 · `saltos` tiene de 1 a 3 números distintos, entre 1 y 5 · `rotos` son escalones entre 1 y `n - 1`, sin repetir (el piso y el último nunca están flojos).
starter: |
  def formas_de_subir(n, saltos, rotos):
      return 0
solution: |
  from functools import cache


  def formas_de_subir(n, saltos, rotos):
      flojos = set(rotos)

      @cache
      def formas(escalon):
          if escalon < 0 or escalon in flojos:
              return 0
          if escalon == 0:
              return 1
          return sum(formas(escalon - salto) for salto in saltos)

      return formas(n)
hints:
  - "Dos casos base: si `escalon < 0` o está flojo, 0 formas; si `escalon == 0`, 1 forma (ya llegaste al piso)."
  - "Caso recursivo: `sum(formas(escalon - salto) for salto in saltos)`. Con `@cache` encima del `def formas`, cada escalón se cuenta una sola vez."
visual:
  figure:
    title: El ejemplo 1, escalón por escalón
    input: { label: "formas_de_subir(4, [1, 2], [])", table: { head: ["escalón", "0", "1", "2", "3", "4"], rows: [["formas", "1", "1", "2", "3", "5"]] } }
    arrow: "formas(k) = formas(k − 1) + formas(k − 2)"
    output: { label: devuelve, value: "5" }
    steps:
      - "Al escalón 0 se llega de una forma: sin moverse."
      - "Al 4 se llega desde el 3 (3 formas) o desde el 2 (2 formas): 5."
samples:
  - args: [4, [1, 2], []]
    returns: 5
    note: "1+1+1+1, 1+1+2, 1+2+1, 2+1+1 y 2+2."
  - args: [6, [1, 3], [2]]
    returns: 3
    note: "Sin pisar el escalón 2: 3+3, 3+1+1+1 y 1+3+1+1. 1+1+… pisa el 2."
edge:
  - args: [0, [1, 2], []]
    tag: con una escalera de cero escalones
  - args: [1, [2], []]
    tag: cuando el único salto es más largo que la escalera
  - args: [7, [2], []]
    tag: cuando los saltos no cuadran con el total
  - args: [5, [1, 2], [2, 3]]
    tag: cuando dos escalones flojos seguidos cortan el paso
  - args: [12, [1, 2], [11]]
    tag: con el penúltimo escalón flojo
  - args: [10, [3, 4], []]
    tag: sin saltos de uno
  - args: [50, [1, 2, 3], []]
    tag: con la escalera más larga
  - args: [50, [4, 5], [4, 5, 9, 10]]
    tag: con escalones flojos al principio
random:
  count: 40
  seed: 1515
  generate: |
    n = rng.int(0, 50)
    saltos = sorted(rng.shuffle([1, 2, 3, 4, 5])[:rng.int(1, 3)])
    rotos = sorted({rng.int(1, n - 1) for _ in range(rng.int(0, 5))}) if n > 1 else []
    return [n, saltos, rotos]
wrong:
  - |
    from functools import cache
    def formas_de_subir(n, saltos, rotos):
        flojos = set(rotos)
        @cache
        def formas(escalon):
            if escalon <= 0 or escalon in flojos:
                return 0
            if escalon == 1:
                return 1
            return sum(formas(escalon - salto) for salto in saltos)
        return formas(n)
  - |
    from functools import cache
    def formas_de_subir(n, saltos, rotos):
        flojos = set(rotos)
        @cache
        def desde(escalon):
            if escalon in flojos:
                return 0
            if escalon >= n:
                return 1
            return sum(desde(escalon + salto) for salto in saltos)
        return desde(0)
```

```exercise
id: py15-juez-cargas
type: judge
mode: function
function: cargas_exactas
title: Las piedras para la muralla
prompt: |
  **Escribe `cargas_exactas(pesos, objetivo)`, que devuelve todas las formas de elegir piedras cuyo peso sume exactamente `objetivo`, cada una como la lista de las posiciones de las piedras elegidas.**

  Para rellenar una grieta de la muralla, Elvira necesita subir **exactamente** `objetivo` kilos de piedra, ni uno más. Las piedras numeradas esperan en fila; `pesos[i]` es el peso de la piedra `i`. Cada piedra se puede elegir **una sola vez**.

  - Cada forma es la lista de posiciones elegidas, de menor a mayor: `[0, 4]`.
  - La lista de formas va ordenada de menor a mayor, como la ordena `sorted` (si recorres las piedras de izquierda a derecha y pruebas primero elegir, ya salen en ese orden).
  - Si `objetivo` es 0, la única forma es no elegir ninguna: `[[]]`. Si no hay ninguna forma, devuelve `[]`.

  Es backtracking: para cada piedra desde la posición `i`, **elígela**, sigue buscando desde la siguiente y **deshaz** la elección.

  **Restricciones:** 0 ≤ `len(pesos)` ≤ 14 · cada peso entre 1 y 30 · 0 ≤ `objetivo` ≤ 200.
starter: |
  def cargas_exactas(pesos, objetivo):
      return []
solution: |
  def cargas_exactas(pesos, objetivo):
      formas = []

      def armar(desde, elegidas, suma):
          if suma == objetivo:
              formas.append(list(elegidas))
              return
          for i in range(desde, len(pesos)):
              if suma + pesos[i] <= objetivo:
                  elegidas.append(i)
                  armar(i + 1, elegidas, suma + pesos[i])
                  elegidas.pop()

      armar(0, [], 0)
      return formas
hints:
  - "Una función interna `armar(desde, elegidas, suma)`: si `suma == objetivo`, guarda una **copia** (`list(elegidas)`) y vuelve."
  - "Si no, para cada `i` desde `desde`: `elegidas.append(i)`, `armar(i + 1, …)`, `elegidas.pop()`. Con `i + 1` cada piedra se usa una vez."
visual:
  figure:
    title: El ejemplo 1
    input: { label: "pesos (objetivo: 10)", cells: [5, 3, 2, 8, 5] }
    arrow: elegir, seguir, deshacer
    output: { label: devuelve, table: { head: ["posiciones", "pesos"], rows: [["[0, 1, 2]", "5 + 3 + 2"], ["[0, 4]", "5 + 5"], ["[1, 2, 4]", "3 + 2 + 5"], ["[2, 3]", "2 + 8"]] } }
    caption: "Las piedras 0 y 4 pesan lo mismo, pero son piedras distintas: `[0, 1, 2]` y `[1, 2, 4]` son formas distintas."
samples:
  - args: [[5, 3, 2, 8, 5], 10]
    returns: [[0, 1, 2], [0, 4], [1, 2, 4], [2, 3]]
    note: El dibujo de arriba.
  - args: [[4, 6], 5]
    returns: []
    note: Ninguna combinación pesa 5.
edge:
  - args: [[], 0]
    tag: sin piedras y objetivo cero
  - args: [[7, 2], 0]
    tag: con objetivo cero
  - args: [[], 5]
    tag: sin piedras
  - args: [[6], 6]
    tag: con una sola piedra justa
  - args: [[3], 6]
    tag: cuando una piedra tendría que usarse dos veces
  - args: [[2, 2, 2, 2], 4]
    tag: con todas las piedras iguales
  - args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 105]
    tag: cuando hay que elegir todas
  - args: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 7]
    tag: con muchísimas formas
random:
  count: 40
  seed: 1516
  generate: |
    n = rng.int(0, 14)
    pesos = [rng.int(1, rng.pick([5, 12, 30])) for _ in range(n)]
    if rng.int(0, 5) == 0:
        return [pesos, rng.int(0, 60)]
    elegidas = [p for p in pesos if rng.int(0, 2) == 0]
    return [pesos, sum(elegidas)]
wrong:
  - |
    def cargas_exactas(pesos, objetivo):
        formas = []
        def armar(desde, elegidas, suma):
            if suma == objetivo:
                formas.append(list(elegidas))
                return
            for i in range(desde, len(pesos)):
                if suma + pesos[i] <= objetivo:
                    elegidas.append(i)
                    armar(i, elegidas, suma + pesos[i])
                    elegidas.pop()
        armar(0, [], 0)
        return formas
  - |
    def cargas_exactas(pesos, objetivo):
        formas = []
        def armar(desde, elegidas, suma):
            for i in range(desde, len(pesos)):
                elegidas.append(i)
                if suma + pesos[i] == objetivo:
                    formas.append(list(elegidas))
                elif suma + pesos[i] < objetivo:
                    armar(i + 1, elegidas, suma + pesos[i])
                elegidas.pop()
        armar(0, [], 0)
        return formas
```

## Misión final

```exercise
id: py15-mision-quiocta
type: mission
title: La caverna de Quiocta
prompt: |
  **Escribe `explorar()`, recursiva: Quilla recorre toda la cueva, recoge cada cristal, vuelve al punto de partida y devuelve cuántos cristales juntó. Al final, `robot.reportar(...)` con ese total.**

  Bajo Lamud, cerca de Kuélap, la caverna de Quiocta se ramifica en túneles que se cruzan. No hay plano: con el faro, Quilla solo ve las paredes de al lado. Y la batería alcanza **exactamente** para entrar por cada túnel nuevo una vez y volver por él una vez. Nada de pasear de más.

  La receta de `explorar()`, parada en una casilla:

  1. anota la casilla en `visitadas` y recoge lo que haya (`robot.recoger()` devuelve cuántos cristales);
  2. para cada rumbo de `RUMBOS`: si la vecina no está en `visitadas`, `mirar(rumbo)`; si no hay pared al frente, **avanza, explora desde ahí** sumando lo que devuelva, y **regresa**: mira al rumbo contrario y avanza uno;
  3. devuelve lo que juntó en esta casilla y en todo lo que exploró desde ella.

  `robot.posicion` da `(x, y)`; `robot.hay_pared("frente")` mira la casilla de adelante. La cueva cambia en cada prueba, y Quilla no siempre mira al mismo lado al empezar. Cuando pase, junto con los jueces, se desbloquea la sesión 16.
visual:
  figure:
    title: La primera cueva (batería 62)
    panes:
      - { label: "caverna (Quilla no la ve entera)", grid: ["###########", "#R..2#...3#", "#.##.#.#..#", "#..1...#.##", "##.###.1..#", "#2...#..#4#", "###########"] }
      - { label: "explorar(), por cada vecina nueva", text: "elegir: avanzar\nexplorar desde ahí\ndeshacer: volver" }
      - { label: al terminar, table: { head: ["", ""], rows: [["dónde", "en la R"], ["reporta", "13"]] } }
starter: |
  RUMBOS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "O": (-1, 0)}
  CONTRARIO = {"N": "S", "S": "N", "E": "O", "O": "E"}


  def mirar(rumbo):
      """Gira a la derecha hasta quedar mirando a rumbo."""
      while robot.direccion != rumbo:
          robot.girar_derecha()


  visitadas = set()


  def explorar():
      """Recorre todo lo que no ha visto desde aquí, vuelve aquí y devuelve los cristales."""
      return 0


  robot.reportar(explorar())
solution: |
  RUMBOS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "O": (-1, 0)}
  CONTRARIO = {"N": "S", "S": "N", "E": "O", "O": "E"}


  def mirar(rumbo):
      """Gira a la derecha hasta quedar mirando a rumbo."""
      while robot.direccion != rumbo:
          robot.girar_derecha()


  visitadas = set()


  def explorar():
      """Recorre todo lo que no ha visto desde aquí, vuelve aquí y devuelve los cristales."""
      x, y = robot.posicion
      visitadas.add((x, y))
      cristales = robot.recoger()
      for rumbo, (dx, dy) in RUMBOS.items():
          if (x + dx, y + dy) in visitadas:
              continue
          mirar(rumbo)
          if robot.hay_pared("frente"):
              continue
          robot.avanzar()
          cristales += explorar()
          mirar(CONTRARIO[rumbo])
          robot.avanzar()
      return cristales


  robot.reportar(explorar())
hints:
  - "Lee la posición al **empezar** `explorar()` y guárdala en `x, y`: después de volver de una vecina, Quilla está otra vez ahí."
  - "Pregunta por `visitadas` justo antes de cada vecina, no antes del bucle: una llamada más honda pudo haberla visitado mientras tanto. Si no lo haces, Quilla entra dos veces y la batería no alcanza."
world:
  theme: mina
  level: 3
  dir: E
  api: [move, mine]
  fog: true
  battery: 62
  map: |
    ###########
    #R..2#...3#
    #.##.#.#..#
    #..1...#.##
    ##.###.1..#
    #2...#..#4#
    ###########
scenarios:
  - tests:
      - name: vuelve al punto de partida
        state: '(w.x, w.y) == (1, 1)'
        msg: Quilla no terminó donde empezó. ¿Regresa después de cada vecina?
  - world: { battery: 50, dir: N }
    map: |
      #########
      #3..#..2#
      #.#.#.#.#
      #...R...#
      #.###.#1#
      #4..#...#
      #########
    tests:
      - name: vuelve al punto de partida
        state: '(w.x, w.y) == (4, 3)'
        msg: Quilla no terminó donde empezó. ¿Regresa después de cada vecina?
  - world: { battery: 90, dir: W }
    map: |
      ############
      #5.....#..2#
      #.####.#.#.#
      #..#1..#.#.#
      ##.#.###...#
      #..#..R..#3#
      #.##.#####.#
      #1.........#
      ############
    tests:
      - name: vuelve al punto de partida
        state: '(w.x, w.y) == (6, 5)'
        msg: Quilla no terminó donde empezó. ¿Regresa después de cada vecina?
tests:
  - name: no quedan cristales en la cueva
    state: w.crystals_left == 0
    msg: Quedaron cristales. ¿Explora todas las vecinas de cada casilla?
  - name: reporta el total exacto, una vez
    state: w.reports == [w.crystals_total]
    msg: El número reportado no es el total de la cueva (o se reportó más de una vez). ¿explorar() suma lo que devuelven sus llamadas?
  - name: explorar se llama a sí misma
    source: 'def\s+explorar\s*\([^)]*\):\n(?:[ \t]+.*\n|[ \t]*\n)*?[ \t]+.*\bexplorar\s*\('
    msg: Escribe explorar como función recursiva, que se llame desde cada vecina nueva.
  - name: sin chocar ni quedarse sin batería
    state: not w.crashed
```

## Reto experto

```exercise
id: py15-reto-ruta-larga
type: challenge
title: El paseo más largo
visual:
  figure:
    title: "ruta_mas_larga(plano) para el segundo plano de las pruebas"
    input: { label: plano, grid: ["######", "#R...#", "#.##.#", "#...D#", "######"] }
    arrow: prueba todos los caminos sin repetir casillas
    output: { label: devuelve, value: "5" }
    caption: "El camino corto tiene 5 pasos y el largo, por el otro lado, también 5: devuelve el máximo."
prompt: |
  **Escribe `ruta_mas_larga(plano)`, que devuelve cuántos pasos tiene el camino más largo de la `R` a la `D` sin pisar dos veces la misma casilla, o `-1` si no se puede llegar.** Para quien ya programa.

  Los guías de Kuélap quieren un paseo que muestre lo más posible sin volver sobre sus pasos. `plano` es una lista de textos (`"#"` muralla, `"."` piso), rodeada de muralla. Los pasos van entre casillas vecinas (norte, sur, este, oeste), y el camino termina al llegar a la `D`. El camino más corto lo da un BFS; el más largo exige probar todos: backtracking.
starter: |
  def ruta_mas_larga(plano):
      return -1

  print(ruta_mas_larga(["#####", "#R.D#", "#####"]))
solution: |
  def ruta_mas_larga(plano):
      inicio = next((x, y) for y, fila in enumerate(plano) for x, c in enumerate(fila) if c == "R")
      vistas = set()

      def mas_larga(x, y):
          if plano[y][x] == "#" or (x, y) in vistas:
              return -1
          if plano[y][x] == "D":
              return 0
          vistas.add((x, y))
          mejor = -1
          for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
              resto = mas_larga(x + dx, y + dy)
              if resto >= 0:
                  mejor = max(mejor, resto + 1)
          vistas.remove((x, y))
          return mejor

      return mas_larga(*inicio)

  print(ruta_mas_larga(["#####", "#R.D#", "#####"]))
hints:
  - "Una función interna `mas_larga(x, y)` que devuelve los pasos del camino más largo desde ahí hasta la `D`, o `-1`."
  - "Marca la casilla antes de explorar sus vecinas y **desmárcala** al terminar: otro camino puede querer pasar por ella."
tests:
  - name: un pasillo recto
    run: 'ruta_mas_larga(["#####", "#R.D#", "#####"])'
    equals: 2
  - name: un anillo
    run: 'ruta_mas_larga(["######", "#R...#", "#.##.#", "#...D#", "######"])'
    equals: 5
  - name: una plaza con columnas
    run: 'ruta_mas_larga(["#######", "#R....#", "#.#.#.#", "#.....#", "#.#.#D#", "#######"])'
    equals: 11
  - name: con un desvío que no lleva a ningún lado
    run: 'ruta_mas_larga(["#######", "#R..#.#", "#.#...#", "#...#D#", "#######"])'
    equals: 8
  - name: sin salida
    run: 'ruta_mas_larga(["#####", "#R#D#", "#####"])'
    equals: -1
```
