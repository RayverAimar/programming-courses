# Sesión 10 — Búsqueda

## El encargo

Iquitos, marzo, plena creciente. El río Itaya subió tanto que en Belén Bajo las calles son canales: la gente va en canoa, las casas flotan sobre sus balsas y lo que queda en seco son los puentes de tablas que los vecinos clavan de casa en casa. La licenciada **Delia Tapullima**, enfermera del puesto de salud, espera una conservadora con vacunas que llegó en la lancha de Yurimaguas y que no puede pasar mucho rato fuera del frío.

Maru mandó a Quilla, que ya tiene sirena para abrirse paso, pero hay un problema: los puentes cambian cada semana (uno se pudre, otro lo clavan nuevo) y la batería alcanza **justo** para la ruta más corta. Probar tablas al azar no sirve. Hoy Quilla aprende a **buscar**: explorar el plano en ondas hasta dar con el camino más corto, y a buscar rápido en una lista ordenada.

```escena
theme: barranco
level: 2
dir: S
api: [move, deliver, path]
caption: Los puentes de Belén Bajo. Quilla sigue la ruta más corta, tabla por tabla, hasta el puesto de salud (D).
map: |
  ###########
  #R..#.....#
  #.#.#.###.#
  #.#...#...#
  #.#####.#.#
  #.......#D#
  ###########
program: |
  robot.seguir_ruta(["S"] * 4 + ["E"] * 6 + ["N"] * 2 + ["E"] * 2 + ["S"] * 2)
  robot.entregar("vacunas")
```

## Lo mínimo

La **búsqueda en anchura** (BFS, *breadth-first search*) explora como la onda de una piedra en el río: primero todas las casillas a 1 paso, luego todas las que están a 2, luego a 3… La primera vez que la onda toca la meta, llegó por el camino más corto. Necesita dos piezas:

- una **cola**, `collections.deque`: se agrega al final con `append` y se saca del inicio con `popleft`. La primera casilla que entra es la primera que sale;
- un **set** de casillas vistas, `vistos`, con tuplas `(x, y)`, para no meter dos veces la misma.

```py run
from collections import deque

cola = deque(["Delia", "Waldir"])
cola.append("Nilda")
print(cola.popleft(), cola)
```

La primera línea, `from collections import deque`, es la primera vez que usas un `import`. Python trae muchas herramientas ya instaladas, la **librería estándar**, pero no las carga hasta que las pides: `collections` es un **módulo** (un archivo de Python) y `from collections import deque` trae solo la pieza `deque`. Con `import collections` traerías todo el módulo y escribirías `collections.deque`. En la sesión 19 verás dónde busca Python y cómo hacer tus propios módulos.

Mira la onda sobre un plano de 3 × 3 con una casa en el centro: la cola (el borde) avanza y lo visto se pinta.

```anima
title: La onda de BFS
code: |
  from collections import deque
  plano = ["...", ".#.", "..."]
  cola = deque([(0, 0)])
  vistos = {(0, 0)}
  while cola:
      x, y = cola.popleft()
      for nx, ny in [(x + 1, y), (x, y + 1), (x - 1, y), (x, y - 1)]:
          dentro = 0 <= nx < 3 and 0 <= ny < 3
          if dentro and plano[ny][nx] == "." and (nx, ny) not in vistos:
              vistos.add((nx, ny))
              cola.append((nx, ny))
  print(len(vistos))
grid: { map: ["...", ".#.", "..."], visited: vistos, frontier: cola }
show: [x, y, cola, vistos]
speed: 700
steps:
  - {"line": 4, "vars": {"cola": ["0,0"], "vistos": ["0,0"]}, "reprs": {"cola": "deque([(0, 0)])", "vistos": "{(0, 0)}"}, "note": "La onda empieza en (0, 0): está en la cola y ya cuenta como vista."}
  - {"line": 6, "vars": {"cola": [], "vistos": ["0,0"], "x": 0, "y": 0}, "reprs": {"cola": "deque([])", "vistos": "{(0, 0)}", "x": "0", "y": "0"}, "note": "Sale de la cola la casilla que lleva más tiempo esperando."}
  - {"line": 11, "vars": {"cola": ["1,0"], "vistos": ["0,0", "1,0"], "x": 0, "y": 0}, "reprs": {"cola": "deque([(1, 0)])", "vistos": "{(0, 0), (1, 0)}", "x": "0", "y": "0"}, "note": "Vecina libre y nueva: se marca como vista al entrar a la cola, no al salir."}
  - {"line": 11, "vars": {"cola": ["1,0", "0,1"], "vistos": ["0,0", "1,0", "0,1"], "x": 0, "y": 0}, "reprs": {"cola": "deque([(1, 0), (0, 1)])", "vistos": "{(0, 0), (1, 0), (0, 1)}", "x": "0", "y": "0"}, "note": "Vecina libre y nueva: se marca como vista al entrar a la cola, no al salir."}
  - {"line": 6, "vars": {"cola": ["0,1"], "vistos": ["0,0", "1,0", "0,1"], "x": 1, "y": 0}, "reprs": {"cola": "deque([(0, 1)])", "vistos": "{(0, 0), (1, 0), (0, 1)}", "x": "1", "y": "0"}}
  - {"line": 11, "vars": {"cola": ["0,1", "2,0"], "vistos": ["0,0", "1,0", "2,0", "0,1"], "x": 1, "y": 0}, "reprs": {"cola": "deque([(0, 1), (2, 0)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1)}", "x": "1", "y": "0"}}
  - {"line": 6, "vars": {"cola": ["2,0"], "vistos": ["0,0", "1,0", "2,0", "0,1"], "x": 0, "y": 1}, "reprs": {"cola": "deque([(2, 0)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1)}", "x": "0", "y": "1"}}
  - {"line": 11, "vars": {"cola": ["2,0", "0,2"], "vistos": ["0,0", "1,0", "2,0", "0,1", "0,2"], "x": 0, "y": 1}, "reprs": {"cola": "deque([(2, 0), (0, 2)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (0, 2)}", "x": "0", "y": "1"}}
  - {"line": 6, "vars": {"cola": ["0,2"], "vistos": ["0,0", "1,0", "2,0", "0,1", "0,2"], "x": 2, "y": 0}, "reprs": {"cola": "deque([(0, 2)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (0, 2)}", "x": "2", "y": "0"}}
  - {"line": 11, "vars": {"cola": ["0,2", "2,1"], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2"], "x": 2, "y": 0}, "reprs": {"cola": "deque([(0, 2), (2, 1)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2)}", "x": "2", "y": "0"}}
  - {"line": 6, "vars": {"cola": ["2,1"], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2"], "x": 0, "y": 2}, "reprs": {"cola": "deque([(2, 1)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2)}", "x": "0", "y": "2"}}
  - {"line": 11, "vars": {"cola": ["2,1", "1,2"], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2"], "x": 0, "y": 2}, "reprs": {"cola": "deque([(2, 1), (1, 2)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2)}", "x": "0", "y": "2"}}
  - {"line": 6, "vars": {"cola": ["1,2"], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2"], "x": 2, "y": 1}, "reprs": {"cola": "deque([(1, 2)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2)}", "x": "2", "y": "1"}}
  - {"line": 11, "vars": {"cola": ["1,2", "2,2"], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 2, "y": 1}, "reprs": {"cola": "deque([(1, 2), (2, 2)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "2", "y": "1"}}
  - {"line": 6, "vars": {"cola": ["2,2"], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 1, "y": 2}, "reprs": {"cola": "deque([(2, 2)])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "1", "y": "2"}}
  - {"line": 6, "vars": {"cola": [], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 2, "y": 2}, "reprs": {"cola": "deque([])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "2", "y": "2"}}
  - {"line": 12, "vars": {"cola": [], "vistos": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 2, "y": 2}, "reprs": {"cola": "deque([])", "vistos": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "2", "y": "2"}, "note": "La onda cubrió las 8 casillas libres.", "out": "8"}
```

Para saber **la ruta**, y no solo hasta dónde llega la onda, cada casilla anota en un diccionario de qué casilla vino: su **padre**. El inicio tiene padre `None`. Ese diccionario hace también de "vistos": si una casilla ya tiene padre, ya entró a la cola. Al final se camina de la meta hacia atrás, de padre en padre, y se da la vuelta a la lista:

```anima
title: Reconstruir la ruta, de la meta hacia atrás
code: |
  padre = {(0, 0): None, (1, 0): (0, 0), (1, 1): (1, 0), (1, 2): (1, 1), (2, 2): (1, 2)}
  ruta = []
  casilla = (2, 2)
  while casilla is not None:
      ruta.append(casilla)
      casilla = padre[casilla]
  ruta.reverse()
  print(ruta)
cells: { of: ruta }
show: [casilla]
speed: 700
notes:
  3: "Se empieza por la meta, (2, 2)."
  6: "Se salta al padre: de dónde vino esta casilla."
  7: "El inicio tenía padre None: ahí para el bucle. La lista quedó al revés y se voltea."
```

Con la ruta en la mano, **`robot.seguir_ruta(ruta)`** la recorre: recibe una lista de casillas vecinas `(x, y)` y gira solo cuando hace falta (si la primera es la casilla donde está, se la salta). `robot.marcar(casillas)` pinta casillas en el mapa sin moverse, para ver lo que exploró tu búsqueda.

La otra búsqueda de hoy es en una **lista ordenada**. Para encontrar un valor no hace falta mirarla entera: miras el del medio y descartas la mitad donde no puede estar, otra vez y otra vez. Es la **búsqueda binaria**: en mil elementos, unas diez miradas.

```anima
title: Búsqueda binaria en las marcas del río
code: |
  niveles = [112, 115, 119, 124, 126, 131, 138, 142]
  buscado = 131
  izquierda, derecha = 0, len(niveles) - 1
  posicion = -1
  while izquierda <= derecha:
      medio = (izquierda + derecha) // 2
      if niveles[medio] == buscado:
          posicion = medio
          break
      elif niveles[medio] < buscado:
          izquierda = medio + 1
      else:
          derecha = medio - 1
  print(posicion)
cells: { of: niveles, at: medio }
show: [izquierda, derecha, medio, posicion]
speed: 900
notes:
  6: "Se mira la del medio del tramo que queda."
  11: "124 es menor que 131: todo lo de la izquierda también. Se descarta esa mitad."
  8: "Lo encontró en la posición 5 mirando solo 2 casillas de 8."
```

Python ya trae la búsqueda binaria en el módulo **`bisect`**. `bisect_left(lista, valor)` devuelve la primera posición donde podría ir `valor` sin desordenar la lista (antes de los iguales); `bisect_right`, la que va después de los iguales. Si la posición es `len(lista)`, el valor es mayor que todos.

```py run
from bisect import bisect_left, bisect_right

niveles = [110, 115, 115, 115, 122, 130]
print(bisect_left(niveles, 115), bisect_right(niveles, 115))
print(bisect_left(niveles, 120), bisect_left(niveles, 200))
```

> **Trampa común:** si sacas con `cola.pop()` en vez de `cola.popleft()`, sacas la **última** casilla que entró. Eso ya no es una cola sino una pila: la búsqueda se mete por un pasillo hasta el fondo antes de probar otro (búsqueda en profundidad), y la primera ruta que encuentra casi nunca es la más corta.

<!-- legacy: deque -->

<!-- mdn: deque bisect -->

## Práctica

```exercise
id: py10-predice-deque
type: predict
title: La cola del muelle
prompt: |
  En el muelle de Belén las canoas esperan su turno en una `deque`. ¿Qué imprime?
code: |
  from collections import deque

  canoas = deque([1, 2])
  canoas.append(3)
  canoas.appendleft(0)
  primera = canoas.popleft()
  ultima = canoas.pop()
  print(primera, ultima, list(canoas))
options:
  - "0 3 [1, 2]"
  - "1 3 [0, 2]"
  - "0 2 [1, 3]"
  - "3 0 [1, 2]"
answer: "0 3 [1, 2]"
explain: |
  `appendleft(0)` mete el 0 adelante: `[0, 1, 2, 3]`. `popleft()` saca el de adelante (0) y `pop()` el de atrás (3). Quedan `[1, 2]`. BFS usa `append` y `popleft`: entra por atrás, sale por adelante.
```

```exercise
id: py10-predice-bisect
type: predict
title: Las tres marcas
prompt: |
  Delia anotó en una lista ordenada a qué altura llegó el río cada día. ¿Qué imprime?
code: |
  from bisect import bisect_left, bisect_right

  alturas = [2, 4, 4, 4, 7]
  print(bisect_left(alturas, 4), bisect_right(alturas, 4), bisect_left(alturas, 5))
options:
  - "1 4 4"
  - "1 3 4"
  - "2 4 5"
  - "1 4 5"
answer: "1 4 4"
explain: |
  `bisect_left` da la posición **antes** de los 4 (la 1) y `bisect_right` la posición **después** del último 4 (la 4). El 5 no está: iría donde está el 7, en la posición 4.
```

```exercise
id: py10-arregla-padre
type: fix
title: La ruta que se cayó al final
prompt: |
  `ruta_mas_corta` busca bien, pero se cae justo al reconstruir la ruta. Ejecútalo y lee el error: ¿qué casilla no tiene padre?

  Arréglalo para que devuelva la ruta completa, del inicio a la meta, ambos incluidos.
visual:
  figure:
    input: { label: "plano, de (0, 0) a (2, 2)", grid: ["..#", "#..", "..."], path: ["0,0"] }
    arrow: BFS y padres
    output: { label: "[(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)]", grid: ["..#", "#..", "..."], path: ["0,0", "1,0", "1,1", "2,1", "2,2"] }
starter: |
  from collections import deque


  def ruta_mas_corta(plano, inicio, meta):
      padre = {}
      vistos = {inicio}
      cola = deque([inicio])
      while cola:
          x, y = cola.popleft()
          for vecina in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              vx, vy = vecina
              dentro = 0 <= vy < len(plano) and 0 <= vx < len(plano[0])
              if dentro and plano[vy][vx] == "." and vecina not in vistos:
                  vistos.add(vecina)
                  padre[vecina] = (x, y)
                  cola.append(vecina)
      ruta = []
      casilla = meta
      while casilla is not None:
          ruta.append(casilla)
          casilla = padre[casilla]
      ruta.reverse()
      return ruta


  print(ruta_mas_corta(["..#", "#..", "..."], (0, 0), (2, 2)))
solution: |
  from collections import deque


  def ruta_mas_corta(plano, inicio, meta):
      padre = {inicio: None}
      cola = deque([inicio])
      while cola:
          x, y = cola.popleft()
          for vecina in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              vx, vy = vecina
              dentro = 0 <= vy < len(plano) and 0 <= vx < len(plano[0])
              if dentro and plano[vy][vx] == "." and vecina not in padre:
                  padre[vecina] = (x, y)
                  cola.append(vecina)
      ruta = []
      casilla = meta
      while casilla is not None:
          ruta.append(casilla)
          casilla = padre[casilla]
      ruta.reverse()
      return ruta


  print(ruta_mas_corta(["..#", "#..", "..."], (0, 0), (2, 2)))
hints:
  - "El bucle de atrás para cuando llega a una casilla cuyo padre es `None`. ¿Quién debería tener ese padre?"
  - "Empieza con `padre = {inicio: None}`. Así, de paso, `padre` sirve como vistos."
tests:
  - name: la ruta del dibujo
    run: 'ruta_mas_corta(["..#", "#..", "..."], (0, 0), (2, 2))'
    equals: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]
  - name: empieza en el inicio y termina en la meta
    run: 'ruta_mas_corta(["....", ".##.", "...."], (0, 2), (3, 0))[::5]'
    equals: [[0, 2], [3, 0]]
  - name: la más corta tiene 6 casillas
    run: 'len(ruta_mas_corta(["....", ".##.", "...."], (0, 2), (3, 0)))'
    equals: 6
  - name: si inicio y meta son la misma, una casilla
    run: 'ruta_mas_corta(["..."], (1, 0), (1, 0))'
    equals: [[1, 0]]
```

```exercise
id: py10-escribe-binaria
type: write
title: ¿Sale una lancha a esa hora?
prompt: |
  Escribe `buscar_salida(salidas, hora)`, que devuelve **en qué posición** de `salidas` está `hora`, o `-1` si a esa hora no sale ninguna lancha.

  `salidas` son las horas de salida de las lanchas del puerto de Belén, en minutos desde la medianoche, **ordenadas y sin repetir** (`375` son las 6:15). Hazlo con búsqueda binaria a mano, como en *Lo mínimo*: sin recorrer la lista, sin `in`, sin `.index` y sin `bisect`.
visual:
  figure:
    input: { label: "buscar_salida(salidas, 600)", cells: [375, 420, 480, 600, 690, 780, 900] }
    arrow: "medio 3: 600 · ¡es esa!"
    output: { label: devuelve, value: "3" }
starter: |
  def buscar_salida(salidas, hora):
      return -1


  print(buscar_salida([375, 420, 480, 600, 690, 780, 900], 600))
solution: |
  def buscar_salida(salidas, hora):
      """Posición de hora en salidas (ordenada), o -1."""
      izquierda, derecha = 0, len(salidas) - 1
      while izquierda <= derecha:
          medio = (izquierda + derecha) // 2
          if salidas[medio] == hora:
              return medio
          if salidas[medio] < hora:
              izquierda = medio + 1
          else:
              derecha = medio - 1
      return -1


  print(buscar_salida([375, 420, 480, 600, 690, 780, 900], 600))
hints:
  - "Lleva dos bordes, `izquierda` y `derecha`, y mira `medio = (izquierda + derecha) // 2` mientras `izquierda <= derecha`."
  - "Si el del medio es menor que `hora`, la hora solo puede estar a la derecha: `izquierda = medio + 1`."
tests:
  - name: la del medio
    run: buscar_salida([375, 420, 480, 600, 690, 780, 900], 600)
    equals: 3
  - name: la primera
    run: buscar_salida([375, 420, 480, 600, 690, 780, 900], 375)
    equals: 0
  - name: la última
    run: buscar_salida([375, 420, 480, 600, 690, 780, 900], 900)
    equals: 6
  - name: una hora sin lancha
    run: buscar_salida([375, 420, 480, 600, 690, 780, 900], 610)
    equals: -1
  - name: antes de la primera y después de la última
    run: '[buscar_salida([375, 420], 100), buscar_salida([375, 420], 999)]'
    equals: [-1, -1]
  - name: sin lanchas
    run: buscar_salida([], 600)
    equals: -1
  - name: en una lista larga
    run: buscar_salida(list(range(0, 3000, 3)), 2097)
    equals: 699
  - name: búsqueda binaria a mano
    sourceNot: '\bin\b|\.index\s*\(|\bbisect\b'
    msg: Sin in, sin .index y sin bisect. Parte el tramo por la mitad con un while.
```

```exercise
id: py10-escribe-alcance
type: write
title: Hasta dónde alcanza la batería
prompt: |
  Marca en el mapa todas las casillas a las que Quilla puede llegar dando **como mucho `alcance` pasos**, sin moverse: `robot.marcar(lista)` con una lista de `(x, y)`.

  `robot.mapa()` da el plano (`"#"` es agua), `robot.posicion` es `(x, y)` y `alcance` ya existe. Su casilla cuenta (está a 0 pasos). Guarda en un diccionario a cuántos pasos está cada casilla y no metas a la cola las que estén más lejos de `alcance`. Se prueba en dos planos.
visual:
  figure:
    input: { label: "el primer plano, alcance = 3", grid: ["#########", "#..#....#", "#.R..##.#", "#.#.#...#", "#...#.#.#", "#########"] }
    arrow: BFS con distancias
    output: { label: "11 casillas a 3 pasos o menos", grid: ["#########", "#..#....#", "#.R..##.#", "#.#.#...#", "#...#.#.#", "#########"], marks: ["1,1", "1,2", "1,3", "1,4", "2,1", "2,2", "3,2", "3,3", "3,4", "4,1", "4,2"] }
starter: |
  mapa = robot.mapa()
  x, y = robot.posicion
  print("Quilla está en", x, y, "y alcanza", alcance, "pasos")
solution: |
  from collections import deque

  mapa = robot.mapa()
  inicio = (robot.posicion.x, robot.posicion.y)
  distancia = {inicio: 0}
  cola = deque([inicio])
  while cola:
      x, y = cola.popleft()
      if distancia[(x, y)] == alcance:
          continue
      for vecina in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
          vx, vy = vecina
          if mapa[vy][vx] != "#" and vecina not in distancia:
              distancia[vecina] = distancia[(x, y)] + 1
              cola.append(vecina)
  robot.marcar(list(distancia))
hints:
  - "Es la onda de *Lo mínimo* con `distancia = {inicio: 0}` en vez de `vistos`: cada vecina nueva está a un paso más que la casilla de la que salió."
  - "Si una casilla ya está a `alcance` pasos, no sigas desde ella (`continue`). Al final, `robot.marcar(list(distancia))`."
world:
  theme: barranco
  level: 2
  dir: E
  api: [move, map, path]
  map: |
    #########
    #..#....#
    #.R..##.#
    #.#.#...#
    #...#.#.#
    #########
globals:
  alcance: 3
scenarios:
  - tests:
      - name: marca las 11 casillas a 3 pasos o menos
        state: 'sorted(w.marks) == ["1,1", "1,2", "1,3", "1,4", "2,1", "2,2", "3,2", "3,3", "3,4", "4,1", "4,2"]'
        msg: Deben quedar marcadas las 11 casillas a 3 pasos o menos (la de Quilla incluida), y ninguna más lejos.
  - map: |
      #######
      #R..#.#
      #.#...#
      #...#.#
      #######
    globals: { alcance: 4 }
    tests:
      - name: marca las 9 casillas a 4 pasos o menos
        state: 'sorted(w.marks) == ["1,1", "1,2", "1,3", "2,1", "2,3", "3,1", "3,2", "3,3", "4,2"]'
        msg: Deben quedar marcadas las 9 casillas a 4 pasos o menos. La de (5, 1) está a 6 pasos.
tests:
  - name: usa una deque
    source: '\bdeque\b'
```

## El caso

```exercise
id: py10-caso-atajo
type: case
title: El atajo que no existía
prompt: |
  **Recorre la ruta que reportó cada botero, paso a paso, y encuentra la que es imposible.**

  Antes de que llegara Quilla, cuatro boteros trajeron conservadoras del puerto al puesto de salud (`P`, en la esquina de arriba a la izquierda). Una de las cuatro llegó caliente y esas vacunas se perdieron. Delia les pidió por escrito la ruta que siguió cada uno: una letra por paso (`N`, `S`, `E`, `O`). Tres dijeron la verdad; uno inventó un atajo que pasa por encima de una casa (`#`), y eso no se puede hacer en canoa ni a pie.

  Escribe `primer_paso_imposible(inicio, ruta)`, que devuelve el número del primer paso (desde 1) que cae en una casa o fuera del plano, o `0` si toda la ruta es posible. Imprime una línea por botero: `print(f"{nombre}:", primer_paso_imposible(inicio, ruta))`.
visual:
  - figure:
      title: Belén Bajo en creciente (P, el puesto; marcadas, las salidas de cada botero)
      panes:
        - grid: ["P....#.....", ".##.##.###.", ".#.......#.", "...##.##...", ".#.#...#.#.", ".#...#...#.", "...#...#..."]
          marks: ["10,0", "4,6", "6,4", "8,5"]
  - board:
      for: py10-caso-atajo
      title: Lo que declaró cada botero
      task: Recorre cada ruta y di en qué paso se vuelve imposible (0 si nunca).
      cards:
        - { name: Waldir, kind: person, rows: [["Salió de", "(10, 0)"], ["Ruta", "OOOOSSOOONNOOO"]], clue: { find: "Waldir", says: 0, saysLabel: "Pasos imposibles" } }
        - { name: Nilda, kind: person, rows: [["Salió de", "(4, 6)"], ["Ruta", "NOONNOONNN"]], clue: { find: "Nilda", says: 0, saysLabel: "Pasos imposibles" } }
        - { name: Shirley, kind: person, rows: [["Salió de", "(6, 4)"], ["Ruta", "ONNOONNOOO"]], clue: { find: "Shirley", says: 0, saysLabel: "Pasos imposibles" } }
        - { name: Elmer, kind: person, culprit: true, rows: [["Salió de", "(8, 5)"], ["Ruta", "OONNNNNOOOOOO"]], clue: { find: "Elmer", says: 0, saysLabel: "Pasos imposibles" } }
      caption: "**Cuadra**: la ruta se puede hacer. Si no cuadra, alguien cruzó por donde no hay puente."
starter: |
  plano = [
      "P....#.....",
      ".##.##.###.",
      ".#.......#.",
      "...##.##...",
      ".#.#...#.#.",
      ".#...#...#.",
      "...#...#...",
  ]

  MOVIMIENTOS = {"N": (0, -1), "S": (0, 1), "E": (1, 0), "O": (-1, 0)}

  boteros = [
      ("Waldir", (10, 0), "OOOOSSOOONNOOO"),
      ("Nilda", (4, 6), "NOONNOONNN"),
      ("Shirley", (6, 4), "ONNOONNOOO"),
      ("Elmer", (8, 5), "OONNNNNOOOOOO"),
  ]

  print("La casilla (5, 0) es:", plano[0][5])

  # TODO: escribe primer_paso_imposible(inicio, ruta)
  # TODO: imprime una línea por botero
solution: |
  plano = [
      "P....#.....",
      ".##.##.###.",
      ".#.......#.",
      "...##.##...",
      ".#.#...#.#.",
      ".#...#...#.",
      "...#...#...",
  ]

  MOVIMIENTOS = {"N": (0, -1), "S": (0, 1), "E": (1, 0), "O": (-1, 0)}

  boteros = [
      ("Waldir", (10, 0), "OOOOSSOOONNOOO"),
      ("Nilda", (4, 6), "NOONNOONNN"),
      ("Shirley", (6, 4), "ONNOONNOOO"),
      ("Elmer", (8, 5), "OONNNNNOOOOOO"),
  ]


  def primer_paso_imposible(inicio, ruta):
      x, y = inicio
      for numero, letra in enumerate(ruta, start=1):
          dx, dy = MOVIMIENTOS[letra]
          x, y = x + dx, y + dy
          dentro = 0 <= y < len(plano) and 0 <= x < len(plano[0])
          if not dentro or plano[y][x] == "#":
              return numero
      return 0


  for nombre, inicio, ruta in boteros:
      print(f"{nombre}:", primer_paso_imposible(inicio, ruta))
answer: Elmer
answerLabel: ¿Quién inventó el atajo?
reveal: |
  Elmer. Sale de (8, 5), va dos al oeste hasta (6, 5), sube a (6, 4) y en el **paso 4** pasa por (6, 3), que es una casa. Las otras tres rutas se pueden hacer, y además son las más cortas posibles: un BFS desde el puesto da 14 pasos para Waldir y 10 para Nilda y Shirley. Desde (8, 5), lo más corto que se puede es 13 pasos dando la vuelta por (8, 2), los mismos que dijo Elmer, pero por otro lado.
hints:
  - "Lleva `x, y` desde el inicio y súmales el `(dx, dy)` de cada letra. Revisa la casilla nueva después de cada paso."
  - "`enumerate(ruta, start=1)` te da el número de paso junto con la letra."
```

## El juez

Los dos problemas de hoy se juzgan en modo función, como desde la sesión 4: el juez llama a tu función y compara lo que **devuelve**.

```exercise
id: py10-juez-pasos
type: judge
mode: function
function: pasos_minimos
title: Los pasos hasta el puesto
prompt: |
  **Escribe `pasos_minimos(plano, inicio, meta)`, que devuelve cuántos pasos tiene la ruta más corta de `inicio` a `meta`, o `-1` si no hay ninguna.**

  Delia quiere saber cuánto tarda cada vacuna en llegar desde cualquier casa de Belén. `plano` es una lista de textos del mismo largo: `"."` es puente, `"#"` es agua o casa. `inicio` y `meta` son listas `[x, y]`: `x` es la columna y `y` la fila, así que la casilla es `plano[y][x]`. Un paso es moverse a la casilla de arriba, abajo, izquierda o derecha, sin salir del plano.

  **Restricciones:** de 1 a 20 filas · de 1 a 20 columnas · `inicio` y `meta` son casillas `"."` (pueden ser la misma).
visual:
  figure:
    title: El ejemplo 1
    input: { label: "plano, de [0, 0] a [4, 3]", grid: ["..#..", ".#..#", "...#.", "#...."], path: ["0,0"] }
    arrow: BFS desde el inicio
    output: { label: "devuelve 7", grid: ["..#..", ".#..#", "...#.", "#...."], path: ["0,0", "0,1", "0,2", "1,2", "2,2", "2,3", "3,3", "4,3"] }
    steps:
      - "La onda sale de (0, 0); por arriba, la casa de (2, 0) cierra el paso."
      - "Baja por la columna 0, cruza la fila 2 y termina por la fila 3: 7 pasos."
starter: |
  def pasos_minimos(plano, inicio, meta):
      return -1
solution: |
  from collections import deque


  def pasos_minimos(plano, inicio, meta):
      """Pasos de la ruta más corta de inicio a meta, o -1 si no hay."""
      alto, ancho = len(plano), len(plano[0])
      inicio, meta = tuple(inicio), tuple(meta)
      distancia = {inicio: 0}
      cola = deque([inicio])
      while cola:
          x, y = cola.popleft()
          if (x, y) == meta:
              return distancia[(x, y)]
          for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              if 0 <= nx < ancho and 0 <= ny < alto and plano[ny][nx] != "#" and (nx, ny) not in distancia:
                  distancia[(nx, ny)] = distancia[(x, y)] + 1
                  cola.append((nx, ny))
      return -1
hints:
  - "Guarda en un diccionario `distancia` a cuántos pasos está cada casilla: la vecina nueva está a uno más que la casilla de la que salió."
  - "Cuidado con los bordes: en Python `plano[0][-1]` no da error, da la última columna. Revisa `0 <= nx < ancho` antes de mirar la casilla."
samples:
  - args: [["..#..", ".#..#", "...#.", "#...."], [0, 0], [4, 3]]
    returns: 7
    note: El camino del dibujo.
  - args: [[".#.", ".#.", ".#."], [0, 0], [2, 2]]
    returns: -1
    note: La columna de agua parte el plano en dos.
edge:
  - args: [["."], [0, 0], [0, 0]]
    tag: con una sola casilla
  - args: [["...", "...", "..."], [1, 1], [1, 1]]
    tag: con inicio y meta en la misma casilla
  - args: [[".#.", "#..", "..."], [0, 0], [0, 2]]
    tag: con el inicio encerrado junto al borde
  - args: [["..#..", "...#."], [0, 1], [4, 1]]
    tag: con la meta del otro lado de una pared
  - args: [[".", ".", ".", ".", "."], [0, 4], [0, 0]]
    tag: con una sola columna
  - args: [["....................", "###################.", "....................", ".###################", "....................", "###################.", "....................", ".###################", "...................."], [0, 0], [19, 8]]
    tag: con un camino en zigzag largo
  - args: [["....#...", ".##.#.#.", ".#..#.#.", ".#.##.#.", "...#..#.", ".#...##.", ".#.#....", "...#.#.."], [0, 0], [7, 0]]
    tag: con un laberinto con varios caminos
random:
  count: 40
  seed: 1010
  generate: |
    alto = rng.int(1, 20)
    ancho = rng.int(1, 20)
    densidad = rng.pick([10, 25, 35, 45])
    filas = ["".join("#" if rng.int(1, 100) <= densidad else "." for _ in range(ancho)) for _ in range(alto)]
    libres = [[x, y] for y in range(alto) for x in range(ancho) if filas[y][x] == "."]
    if not libres:
        filas[0] = "." + filas[0][1:]
        libres = [[0, 0]]
    return [filas, rng.pick(libres), rng.pick(libres)]
wrong:
  - |
    def pasos_minimos(plano, inicio, meta):
        pila = [(tuple(inicio), 0)]
        vistos = {tuple(inicio)}
        while pila:
            (x, y), pasos = pila.pop()
            if (x, y) == tuple(meta):
                return pasos
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                if 0 <= nx < len(plano[0]) and 0 <= ny < len(plano) and plano[ny][nx] != "#" and (nx, ny) not in vistos:
                    vistos.add((nx, ny))
                    pila.append(((nx, ny), pasos + 1))
        return -1
  - |
    from collections import deque


    def pasos_minimos(plano, inicio, meta):
        distancia = {tuple(inicio): 0}
        cola = deque([tuple(inicio)])
        while cola:
            x, y = cola.popleft()
            if (x, y) == tuple(meta):
                return distancia[(x, y)]
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                try:
                    libre = plano[ny][nx] != "#"
                except IndexError:
                    libre = False
                if libre and (nx, ny) not in distancia:
                    distancia[(nx, ny)] = distancia[(x, y)] + 1
                    cola.append((nx, ny))
        return -1
  - |
    from collections import deque


    def pasos_minimos(plano, inicio, meta):
        distancia = {tuple(inicio): 0}
        cola = deque([tuple(inicio)])
        while cola:
            x, y = cola.popleft()
            if (x, y) == tuple(meta):
                return distancia[(x, y)]
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                if 0 <= nx < len(plano[0]) and 0 <= ny < len(plano) and plano[nx][ny] != "#" and (nx, ny) not in distancia:
                    distancia[(nx, ny)] = distancia[(x, y)] + 1
                    cola.append((nx, ny))
        return -1
```

```exercise
id: py10-juez-creciente
type: judge
mode: function
function: dias_de_alerta
title: El día que el río entró a la casa
prompt: |
  **Escribe `dias_de_alerta(niveles, pisos)`, que devuelve, para cada piso, el primer día en que el río lo supera, o `0` si no lo supera nunca.**

  Durante la creciente el Itaya solo sube: cada mañana Delia anota su nivel en centímetros, así que `niveles` está **ordenada de menor a mayor** (puede repetirse si un día no subió). `niveles[0]` es el día 1. Cada familia le dio la altura del piso de su casa, en la lista `pisos`. El día que el nivel del río es **mayor** que el piso, el agua entró y la familia sube a su barbacoa. Devuelve una lista con un número de día por cada piso, en el mismo orden.

  `bisect` te ahorra el trabajo. Piensa bien cuál de los dos: si el río llega justo a la altura del piso, todavía no entró.

  **Restricciones:** de 1 a 300 días · de 1 a 30 pisos · niveles y pisos de 90 a 1800.
visual:
  figure:
    title: El ejemplo 1, para el piso de 121
    input: { label: "niveles (día 1 en la posición 0)", cells: [118, 121, 121, 126, 130, 130, 134], highlight: [3] }
    arrow: "bisect_right(niveles, 121) = 3 · día 3 + 1"
    output: { label: "piso 121 → día", value: "4" }
    steps:
      - "Los días 2 y 3 el río llegó a 121: justo al ras del piso, sin entrar."
      - "El día 4 marcó 126: ese día el agua entró."
starter: |
  def dias_de_alerta(niveles, pisos):
      return []
solution: |
  from bisect import bisect_right


  def dias_de_alerta(niveles, pisos):
      """Para cada piso, el primer día (desde 1) en que el río lo supera, o 0."""
      respuesta = []
      for piso in pisos:
          posicion = bisect_right(niveles, piso)
          respuesta.append(posicion + 1 if posicion < len(niveles) else 0)
      return respuesta
hints:
  - "`bisect_right(niveles, piso)` es la posición del primer nivel **mayor** que el piso. La posición 0 es el día 1."
  - "Si la posición es `len(niveles)`, ningún día lo superó: va un 0."
samples:
  - args: [[118, 121, 121, 126, 130, 130, 134], [120, 121, 130, 140, 100]]
    returns: [2, 4, 7, 0, 1]
    note: "El piso de 121 se moja el día 4; el de 140 nunca; el de 100 ya estaba bajo el agua el día 1."
  - args: [[95, 95, 95], [95, 94]]
    returns: [0, 1]
edge:
  - args: [[500], [499, 500, 501]]
    tag: con un solo día
  - args: [[200, 200, 200, 200], [200]]
    tag: con el río todos los días al ras del piso
  - args: [[100, 150, 200], [99, 100, 149, 150, 199, 200]]
    tag: con pisos justo debajo y justo a la altura de cada nivel
  - args: [[90, 1800], [90, 1799, 1800]]
    tag: con los niveles en los extremos
  - args: [[300, 310, 320, 330], [330, 300, 315]]
    tag: con los pisos desordenados
random:
  count: 40
  seed: 1011
  generate: |
    nivel = rng.int(90, 300)
    niveles = []
    for _ in range(rng.int(1, 300)):
        nivel += rng.pick([0, 0, 1, 2, 5])
        niveles.append(nivel)
    pisos = [rng.pick(niveles) if rng.int(0, 1) else rng.int(90, niveles[-1] + 10) for _ in range(rng.int(1, 30))]
    return [niveles, pisos]
wrong:
  - |
    from bisect import bisect_left


    def dias_de_alerta(niveles, pisos):
        respuesta = []
        for piso in pisos:
            posicion = bisect_left(niveles, piso)
            respuesta.append(posicion + 1 if posicion < len(niveles) else 0)
        return respuesta
  - |
    from bisect import bisect_right


    def dias_de_alerta(niveles, pisos):
        respuesta = []
        for piso in pisos:
            posicion = bisect_right(niveles, piso)
            respuesta.append(posicion if posicion < len(niveles) else 0)
        return respuesta
  - |
    from bisect import bisect_right


    def dias_de_alerta(niveles, pisos):
        return [bisect_right(niveles, piso) + 1 for piso in pisos]
```

## Misión final

```exercise
id: py10-mision-vacunas
type: mission
title: Las vacunas llegan frías
prompt: |
  **Busca con BFS la ruta más corta hasta el puesto de salud (D), haz que Quilla la recorra con `robot.seguir_ruta(ruta)` y entrega `"vacunas"` al llegar.**

  La batería alcanza **exactamente** para la ruta más corta: un paso de más y Quilla se queda varada sobre las tablas. Tienes:

  - `robot.mapa()`: el plano como lista de textos; `"#"` es agua o casa, `"D"` es el puesto. El borde es todo `"#"`, así que no te sales del plano;
  - `robot.posicion`: dónde está Quilla, `(x, y)`;
  - `robot.seguir_ruta(ruta)`: recorre una lista de casillas vecinas `(x, y)`, girando sola (la primera puede ser la casilla actual);
  - `robot.marcar(casillas)`, si quieres ver lo que exploró tu búsqueda.

  Los puentes cambian en cada prueba. Cuando pase, junto con los jueces, se desbloquea la sesión 11.
visual:
  figure:
    title: La primera prueba
    input: { label: "plano (batería: 18)", grid: ["#############", "#R..#.......#", "#.#.#.#####.#", "#.#...#...#.#", "#.###.#.#.#.#", "#...#...#..D#", "###.#####.#.#", "#.......#...#", "#############"] }
    arrow: BFS, padres, ruta al revés
    output: { label: "una ruta de 18 pasos", grid: ["#############", "#R..#.......#", "#.#.#.#####.#", "#.#...#...#.#", "#.###.#.#.#.#", "#...#...#..D#", "###.#####.#.#", "#.......#...#", "#############"], path: ["1,1", "2,1", "3,1", "3,2", "3,3", "4,3", "5,3", "5,4", "5,5", "6,5", "7,5", "7,4", "7,3", "8,3", "9,3", "9,4", "9,5", "10,5", "11,5"] }
starter: |
  mapa = robot.mapa()
  x, y = robot.posicion
  print("Salgo de", x, y, "con batería", robot.bateria)
  # TODO: BFS desde (x, y) hasta la casilla "D", guardando el padre de cada casilla.
  # Luego reconstruye la ruta, síguela y entrega las vacunas.
solution: |
  from collections import deque

  mapa = robot.mapa()
  inicio = (robot.posicion.x, robot.posicion.y)
  padre = {inicio: None}
  cola = deque([inicio])
  meta = None
  while cola:
      x, y = cola.popleft()
      if mapa[y][x] == "D":
          meta = (x, y)
          break
      for vecina in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
          vx, vy = vecina
          if mapa[vy][vx] != "#" and vecina not in padre:
              padre[vecina] = (x, y)
              cola.append(vecina)
  robot.marcar(list(padre))

  ruta = []
  casilla = meta
  while casilla is not None:
      ruta.append(casilla)
      casilla = padre[casilla]
  ruta.reverse()
  robot.seguir_ruta(ruta)
  robot.entregar("vacunas")
hints:
  - "Es el BFS con `padre` de *Lo mínimo*: en vez de una meta fija, para cuando la casilla que sale de la cola sea `\"D\"`."
  - "Reconstruye de la meta hacia atrás con `padre`, voltea la lista con `ruta.reverse()` y pásasela a `robot.seguir_ruta`."
world:
  theme: barranco
  level: 2
  dir: E
  api: [move, deliver, map, path]
  battery: 18
  map: |
    #############
    #R..#.......#
    #.#.#.#####.#
    #.#...#...#.#
    #.###.#.#.#.#
    #...#...#..D#
    ###.#####.#.#
    #.......#...#
    #############
scenarios:
  - {}
  - map: |
      ###########
      #.....#..D#
      #.###.#.#.#
      #.#R..#.#.#
      #.#####.#.#
      #.......#.#
      #.#####...#
      #.........#
      ###########
    world: { dir: S, battery: 24 }
  - map: |
      ##########
      #D.#.....#
      #..#.###.#
      #.##.#R#.#
      #.#..#.#.#
      #.#.##.#.#
      #......#.#
      ##########
    world: { dir: N, battery: 13 }
tests:
  - name: llega al puesto de salud
    state: w.at_goal
    msg: Quilla no llegó a la D. Si se quedó sin batería, la ruta no era la más corta.
  - name: entrega las vacunas
    state: 'w.delivered == ["vacunas"]'
  - name: sin chocar
    state: not w.crashed
  - name: busca con una deque
    source: '\bdeque\b'
    msg: Usa una deque como cola, con append y popleft.
  - name: recorre la ruta con seguir_ruta
    source: 'robot\.seguir_ruta\s*\('
```

## Reto experto

```exercise
id: py10-reto-nivel
type: challenge
title: ¿Hasta dónde puede subir el río?
prompt: |
  **Escribe `nivel_maximo(alturas)`, que devuelve el nivel más alto del río con el que todavía hay un camino seco de la esquina de arriba a la izquierda a la de abajo a la derecha.** Para quien ya programa.

  `alturas` es una lista de textos de dígitos: cada casilla dice a qué altura está el piso de esa tabla, de `0` a `9`. Con el río a nivel `r`, se inunda toda casilla de altura **menor o igual** a `r`. Un camino seco va de vecina en vecina (arriba, abajo, izquierda, derecha) solo por casillas que no se inundaron, incluidas la de salida y la de llegada.

  Devuelve el mayor `r` entre `0` y `9` con camino seco, o `-1` si con el río en `0` ya no hay camino. Si hay camino con `r`, también lo hay con cualquier nivel menor: busca `r` con búsqueda binaria y comprueba cada nivel con un BFS.
visual:
  figure:
    input: { label: "alturas", text: "4736\n1592\n8264" }
    arrow: "el mejor camino: 4 → 7 → 5 → 9 → 6 → 4"
    output: { label: "su casilla más baja es 4 · devuelve", value: "3" }
starter: |
  def nivel_maximo(alturas):
      return -1


  print(nivel_maximo(["4736", "1592", "8264"]))
solution: |
  from collections import deque


  def hay_camino(alturas, nivel):
      """¿Hay camino seco con el río a este nivel?"""
      alto, ancho = len(alturas), len(alturas[0])
      if int(alturas[0][0]) <= nivel:
          return False
      vistos = {(0, 0)}
      cola = deque([(0, 0)])
      while cola:
          x, y = cola.popleft()
          if (x, y) == (ancho - 1, alto - 1):
              return True
          for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              dentro = 0 <= nx < ancho and 0 <= ny < alto
              if dentro and (nx, ny) not in vistos and int(alturas[ny][nx]) > nivel:
                  vistos.add((nx, ny))
                  cola.append((nx, ny))
      return False


  def nivel_maximo(alturas):
      """El nivel más alto del río que deja un camino seco."""
      seco, mojado = -1, 9
      while mojado - seco > 1:
          medio = (seco + mojado) // 2
          if hay_camino(alturas, medio):
              seco = medio
          else:
              mojado = medio
      return seco


  print(nivel_maximo(["4736", "1592", "8264"]))
hints:
  - "Con `r = -1` siempre hay camino y con `r = 9` nunca. Mantén esos dos bordes y acércalos partiendo por la mitad."
  - "`hay_camino(alturas, nivel)` es un BFS que solo pisa casillas con `int(alturas[y][x]) > nivel`."
tests:
  - name: el ejemplo
    run: 'nivel_maximo(["4736", "1592", "8264"])'
    equals: 3
  - name: una sola casilla
    run: 'nivel_maximo(["5"])'
    equals: 4
  - name: una sola casilla en el suelo
    run: 'nivel_maximo(["0"])'
    equals: -1
  - name: rodeando el pozo
    run: 'nivel_maximo(["555", "515", "555"])'
    equals: 4
  - name: dos caminos, gana el más alto
    run: 'nivel_maximo(["38", "27"])'
    equals: 2
  - name: la salida está en el suelo
    run: 'nivel_maximo(["91", "09"])'
    equals: 0
  - name: el desvío largo
    run: 'nivel_maximo(["2223", "9993", "3333"])'
    equals: 1
  - name: usa una deque
    source: '\bdeque\b'
```
