# Sesión 9 — Cuadrículas

## El encargo

Puno, cerca de Ananea, a casi cinco mil metros de altura. En la mina **Santa Rosalía** el deshielo de la semana pasada se metió por una grieta y dejó la galería principal con agua hasta los tobillos en unas partes y hasta las rodillas en otras. Don Ciriaco Mamani, el capataz, no quiere mandar a nadie hasta saber dónde hay agua, cuánta, y qué cristales de cuarzo hay que sacar antes de que suba más.

Maru le montó a Quilla un **faro en la cabeza** y un sensor que mide los centímetros de agua de cada casilla. Lo que devuelve no es una lista de números: es una **cuadrícula**, filas de casillas, como la hoja cuadriculada de un cuaderno. Hoy Quilla aprende a leerla por fila y columna, a mirar las casillas vecinas sin salirse del borde y a leer el plano entero de la mina.

```escena
theme: mina
level: 3
dir: E
caption: La galería principal de Santa Rosalía. Quilla recoge el cuarzo de la entrada y llega al montacargas (D) antes de que suba el agua.
map: |
  ##########
  #R..2.####
  ####..1..#
  ####.##.D#
  ##########
program: |
  robot.avanzar(3)
  robot.recoger()
  robot.girar_derecha()
  robot.avanzar(1)
  robot.girar_izquierda()
  robot.avanzar(2)
  robot.recoger()
  robot.avanzar(2)
  robot.girar_derecha()
  robot.avanzar(1)
  robot.decir("Galería revisada")
```

## Lo mínimo

Una cuadrícula es una **lista de listas**: cada elemento es una fila, y cada fila es una lista de casillas. Se lee con dos índices, **primero la fila y después la columna**: `agua[fila][columna]`. En un plano, la columna es la `x` (crece hacia el este) y la fila es la `y` (crece hacia el sur), así que la casilla `(x, y)` se lee `agua[y][x]`, al revés de como se dice.

```py run
agua = [
    [0, 2, 5],
    [0, 0, 8],
]
x, y = 2, 1
print(agua[y][x], len(agua), len(agua[0]))
print(agua[0])
```

Para recorrerla entera hacen falta **dos bucles, uno dentro del otro**: el de afuera baja por las filas y el de adentro recorre cada casilla de esa fila. Con `enumerate` tienes el índice y el valor a la vez. Mira cómo Quilla anota las casillas mojadas:

```anima
title: Dos bucles recorren la cuadrícula, fila por fila
code: |
  agua = [[0, 3, 0], [2, 0, 4]]
  mojadas = []
  for y, fila in enumerate(agua):
      for x, nivel in enumerate(fila):
          if nivel > 0:
              mojadas.append((x, y))
  print(mojadas)
grid: { map: [".3.", "2.4"], frontier: mojadas }
show: [y, x, nivel, mojadas]
notes:
  3: "El bucle de afuera elige la fila y; fila es la lista entera de esa fila."
  4: "El de adentro recorre las columnas x de esa fila. Por cada y, x da la vuelta completa."
  6: "Una casilla mojada se anota como la tupla (x, y) y se pinta en el plano."
  7: "Primero toda la fila 0, después toda la fila 1."
```

> **Trampa común:** `[[0] * 3] * 2` parece una cuadrícula de 2 × 3, pero repite **la misma fila** dos veces: cambiar una casilla las cambia en las dos filas. Crea cada fila por separado con una comprensión: `[[0] * 3 for _ in range(2)]`.

```py run
malo = [[0] * 3] * 2
bueno = [[0] * 3 for _ in range(2)]
malo[0][1] = 7
bueno[0][1] = 7
print(malo, bueno)
```

Míralo como lo ve Python: dos nombres, y cuántas filas hay **de verdad**.

```anima
title: Dos flechas a la misma fila, o una fila por flecha
code: |
  malo = [[0] * 3] * 2
  bueno = [[0] * 3 for _ in range(2)]
  malo[0][1] = 7
  bueno[0][1] = 7
refs: all
show: [malo, bueno]
notes:
  1: "El `* 2` copia la **flecha**, no la fila: las dos casillas de `malo` señalan la misma fila."
  2: "La comprensión arma una fila nueva en cada vuelta: `bueno` tiene dos filas distintas."
  3: "Se cambia la fila que comparten las dos casillas: `malo` muestra el 7 en las dos filas."
  4: "Aquí cada fila es suya: solo cambia la de arriba."
```

Muchas veces no importa una casilla sola sino sus **vecinas**. Las cuatro vecinas de `(x, y)` están a un paso al este, al oeste, al sur y al norte. Una lista de desplazamientos evita escribir cuatro `if` casi iguales, y para las ocho (con diagonales) basta con agregar cuatro tuplas más:

```py
PASOS = [(1, 0), (-1, 0), (0, 1), (0, -1)]
for dx, dy in PASOS:
    nx, ny = x + dx, y + dy
    if 0 <= nx < ancho and 0 <= ny < alto:
        print("vecina:", agua[ny][nx])
```

```figura
title: Las vecinas de una casilla, en medio y en el borde
panes:
  - { label: "(3, 1) tiene 4 vecinas", grid: ["......", "...o..", "......"], marks: ["3,0", "2,1", "4,1", "3,2"] }
  - { label: "(5, 2) solo tiene 2", grid: ["......", "......", ".....o"], marks: ["5,1", "4,2"] }
  - { label: "con diagonales, (1, 1) tiene 8", grid: ["....", ".o..", "...."], marks: ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"] }
caption: "En el borde, algunas vecinas caen fuera. Por eso se revisa `0 <= nx < ancho and 0 <= ny < alto` **antes** de leer."
```

- **El borde en Python no avisa por abajo.** `agua[5][0]` en una cuadrícula de 2 filas da `IndexError`, pero `agua[-1][0]` **no falla**: lee la última fila, porque los índices negativos cuentan desde el final. Una vecina "de arriba" de la fila 0 se convierte en silencio en una casilla del otro extremo. La revisión `0 <= ny` es la que la frena.
- **Tuplas como claves.** Una tupla `(x, y)` puede ser clave de un diccionario (una lista no): `profundidad = {(3, 2): 12}` guarda solo las casillas que importan, y `profundidad.get((x, y), 0)` lee cualquier casilla sin salirse de nada.
- **Los textos también son filas.** Un plano como `["#..", ".#."]` se lee igual, `plano[y][x]`, porque un texto se indexa como una lista.
- **`robot.mapa()`** devuelve el plano completo como una lista de filas, y cada fila es una lista de caracteres de una letra: `robot.mapa()[y][x]`. `"#"` es roca, `"."` piso, `"1"`–`"9"` cristales y `"D"` el montacargas. Con `robot.posicion.x` y `robot.posicion.y` sabes dónde está Quilla en ese plano.
- **`robot.escanear()`** devuelve solo lo que alumbra el faro: una cuadrícula de 3 × 3 con Quilla en el centro, `vista[1][1]`. La casilla de su norte es `vista[0][1]`; la de su este, `vista[1][2]`.

<!-- mdn: nested-lists -->

## Práctica

```exercise
id: py9-predice-fila
type: predict
title: Fila primero
prompt: |
  Antes de ejecutarlo: ¿qué imprime?
code: |
  agua = [
      [0, 4, 7],
      [2, 0, 9],
  ]
  x, y = 2, 0
  print(agua[y][x], agua[1][0])
  print(len(agua), len(agua[0]))
options:
  - "7 2\n2 3"
  - "9 4\n2 3"
  - "7 2\n3 2"
  - "2 7\n2 3"
answer: "7 2\n2 3"
explain: |
  `agua[y]` es la fila 0, `[0, 4, 7]`, y su columna 2 es el 7. `agua[1][0]` es la fila 1, columna 0: el 2. `len(agua)` cuenta filas (2, el alto) y `len(agua[0])` cuenta columnas de una fila (3, el ancho).
```

```exercise
id: py9-predice-alias
type: predict
title: El plano que se copió solo
prompt: |
  Don Ciriaco arma dos planos vacíos de 2 filas por 3 columnas y marca una casilla en cada uno. ¿Qué imprime?
code: |
  plano_a = [[0] * 3] * 2
  plano_b = [[0] * 3 for _ in range(2)]
  plano_a[0][1] = 5
  plano_b[0][1] = 5
  print(plano_a)
  print(plano_b)
options:
  - "[[0, 5, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 0, 0]]"
  - "[[0, 5, 0], [0, 0, 0]]\n[[0, 5, 0], [0, 0, 0]]"
  - "[[0, 5, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 5, 0]]"
  - "[[0, 0, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 0, 0]]"
answer: "[[0, 5, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 0, 0]]"
explain: |
  `* 2` sobre una lista que contiene una lista no copia la fila: repite **la misma** fila dos veces. `plano_a[0]` y `plano_a[1]` son dos nombres para una sola lista, así que el 5 aparece en las dos. La comprensión ejecuta `[0] * 3` en cada vuelta y crea filas distintas.
```

```exercise
id: py9-completa-vecinas
type: complete
title: Las vecinas mojadas
prompt: |
  Completa `vecinas_mojadas(agua, x, y)`, que cuenta cuántas de las **4 vecinas** de la casilla `(x, y)` tienen agua (nivel mayor que 0). Las vecinas que caen fuera de la galería no cuentan.
visual:
  figure:
    title: vecinas_mojadas(agua, 1, 0)
    input: { label: agua, table: { head: ["", "x=0", "x=1", "x=2"], rows: [["y=0", "3", "0", "1"], ["y=1", "0", "6", "0"]] } }
    arrow: "este 1 · oeste 3 · sur 6 · el norte cae fuera"
    output: { label: devuelve, value: "3" }
starter: |
  PASOS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


  def vecinas_mojadas(agua, x, y):
      """Cuántas de las 4 vecinas de (x, y) tienen agua."""
      alto = len(agua)
      ancho = len(agua[0])
      cuenta = 0
      for dx, dy in ___:
          nx, ny = x + dx, y + dy
          if 0 <= nx < ___ and 0 <= ny < ___ and agua[___][___] > 0:
              cuenta += 1
      return cuenta


  agua = [[3, 0, 1], [0, 6, 0]]
  print(vecinas_mojadas(agua, 1, 0))
solution: |
  PASOS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


  def vecinas_mojadas(agua, x, y):
      """Cuántas de las 4 vecinas de (x, y) tienen agua."""
      alto = len(agua)
      ancho = len(agua[0])
      cuenta = 0
      for dx, dy in PASOS:
          nx, ny = x + dx, y + dy
          if 0 <= nx < ancho and 0 <= ny < alto and agua[ny][nx] > 0:
              cuenta += 1
      return cuenta


  agua = [[3, 0, 1], [0, 6, 0]]
  print(vecinas_mojadas(agua, 1, 0))
hints:
  - "La `x` se compara con el ancho y la `y` con el alto."
  - "Para leer la vecina, la fila va primero: `agua[ny][nx]`."
tests:
  - name: en el borde de arriba
    run: vecinas_mojadas([[3, 0, 1], [0, 6, 0]], 1, 0)
    equals: 3
  - name: en una esquina
    run: vecinas_mojadas([[3, 0, 1], [0, 6, 0]], 0, 1)
    equals: 2
  - name: en una galería más alta que ancha
    run: vecinas_mojadas([[1], [0], [4], [2]], 0, 1)
    equals: 2
  - name: rodeada de piso seco
    run: vecinas_mojadas([[0, 0, 0], [0, 9, 0], [0, 0, 0]], 1, 1)
    equals: 0
  - name: la consola muestra 3
    output: "3"
```

```exercise
id: py9-arregla-borde
type: fix
title: El agua que venía del otro lado
prompt: |
  `suma_alrededor(agua, x, y)` debería sumar los centímetros de agua de las 4 vecinas de `(x, y)`. Para la esquina `(0, 0)` las vecinas son `(1, 0)` con 1 cm y `(0, 1)` con 3 cm: el total es **4**. El programa no se cae, pero imprime 15.

  El error está en `nivel_en`: el `try` atrapa las casillas que se pasan por la derecha o por abajo, pero no las de la izquierda ni las de arriba. Arréglalo revisando los límites antes de leer, sin `try`.
visual:
  figure:
    title: Lo que lee de verdad
    panes:
      - label: "agua (la esquina es (0, 0))"
        table: { head: ["", "x=0", "x=1", "x=2"], rows: [["y=0", "0", "1", "5"], ["y=1", "3", "0", "0"], ["y=2", "6", "0", "8"]] }
      - label: lo que lee nivel_en
        table: { head: ["vecina", "debería", "lee"], rows: [["(1, 0)", "1", "1"], ["(0, 1)", "3", "3"], ["(-1, 0)", "fuera: 0", "agua[0][-1] = 5"], ["(0, -1)", "fuera: 0", "agua[-1][0] = 6"]] }
starter: |
  def nivel_en(agua, x, y):
      """El nivel de agua de (x, y), o 0 si cae fuera de la galería."""
      try:
          return agua[y][x]
      except IndexError:
          return 0


  def suma_alrededor(agua, x, y):
      """Suma el agua de las 4 vecinas de (x, y)."""
      total = 0
      for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
          total += nivel_en(agua, x + dx, y + dy)
      return total


  agua = [[0, 1, 5], [3, 0, 0], [6, 0, 8]]
  print(suma_alrededor(agua, 0, 0))
solution: |
  def nivel_en(agua, x, y):
      """El nivel de agua de (x, y), o 0 si cae fuera de la galería."""
      if 0 <= y < len(agua) and 0 <= x < len(agua[0]):
          return agua[y][x]
      return 0


  def suma_alrededor(agua, x, y):
      """Suma el agua de las 4 vecinas de (x, y)."""
      total = 0
      for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
          total += nivel_en(agua, x + dx, y + dy)
      return total


  agua = [[0, 1, 5], [3, 0, 0], [6, 0, 8]]
  print(suma_alrededor(agua, 0, 0))
hints:
  - "`agua[-1]` no es un error en Python: es la última fila. Por eso el `except IndexError` nunca se entera."
  - "Pregunta antes de leer: `if 0 <= y < len(agua) and 0 <= x < len(agua[0]):`."
tests:
  - name: a la izquierda del borde es 0
    run: nivel_en([[0, 1, 5], [3, 0, 0], [6, 0, 8]], -1, 0)
    equals: 0
  - name: arriba del borde es 0
    run: nivel_en([[0, 1, 5], [3, 0, 0], [6, 0, 8]], 0, -1)
    equals: 0
  - name: por la derecha y por abajo sigue siendo 0
    run: '[nivel_en([[0, 1], [3, 0]], 2, 0), nivel_en([[0, 1], [3, 0]], 0, 2)]'
    equals: [0, 0]
  - name: dentro lee la casilla
    run: nivel_en([[0, 1, 5], [3, 0, 0], [6, 0, 8]], 2, 2)
    equals: 8
  - name: la esquina suma 4
    output: "4"
  - name: sin try
    sourceNot: '\btry\b'
    msg: Revisa los límites con 0 <= x < ancho y 0 <= y < alto en lugar de atrapar el error.
```

```exercise
id: py9-escribe-charcos
type: write
title: El cuaderno de los charcos
prompt: |
  Escribe dos funciones:

  - `charcos(agua)`: devuelve un **diccionario** cuyas claves son las tuplas `(x, y)` de las casillas con agua (nivel mayor que 0) y cuyos valores son sus niveles. Las casillas secas no van.
  - `nivel(charcos_de_galeria, x, y)`: recibe ese diccionario y devuelve el nivel de `(x, y)`, o **0** si no está (seca, o fuera de la galería).

  Una comprensión de diccionario con dos `for` arma `charcos` en una línea, pero dos bucles también valen.
visual:
  figure:
    title: charcos([[0, 4], [2, 0]])
    input: { label: agua, table: { head: ["", "x=0", "x=1"], rows: [["y=0", "0", "4"], ["y=1", "2", "0"]] } }
    arrow: solo las casillas mojadas, con su (x, y)
    output: { label: devuelve, text: "{(1, 0): 4, (0, 1): 2}" }
starter: |
  def charcos(agua):
      pass


  def nivel(charcos_de_galeria, x, y):
      pass


  print(charcos([[0, 4], [2, 0]]))
solution: |
  def charcos(agua):
      """Las casillas con agua, como {(x, y): nivel}."""
      return {
          (x, y): cm
          for y, fila in enumerate(agua)
          for x, cm in enumerate(fila)
          if cm > 0
      }


  def nivel(charcos_de_galeria, x, y):
      """El nivel de (x, y), o 0 si no hay agua ahí."""
      return charcos_de_galeria.get((x, y), 0)


  print(charcos([[0, 4], [2, 0]]))
hints:
  - "`{(x, y): cm for y, fila in enumerate(agua) for x, cm in enumerate(fila) if cm > 0}`: el `for` de las filas va primero, igual que en dos bucles anidados."
  - "`.get((x, y), 0)`: los dobles paréntesis son la llamada y la tupla."
tests:
  - name: el ejemplo
    expect: 'charcos([[0, 4], [2, 0]]) == {(1, 0): 4, (0, 1): 2}'
  - name: una galería seca no tiene charcos
    expect: 'charcos([[0, 0, 0]]) == {}'
  - name: una galería de una columna
    expect: 'charcos([[5], [0], [1]]) == {(0, 0): 5, (0, 2): 1}'
  - name: nivel de una casilla mojada
    run: 'nivel({(1, 0): 4, (0, 1): 2}, 1, 0)'
    equals: 4
  - name: nivel de una casilla seca o de afuera
    run: '[nivel({(1, 0): 4}, 0, 0), nivel({(1, 0): 4}, -3, 9)]'
    equals: [0, 0]
  - name: nivel no se confunde de orden
    run: 'nivel({(1, 0): 4, (0, 1): 2}, 0, 1)'
    equals: 2
```

```exercise
id: py9-escribe-faro
type: write
title: El faro en el cruce
prompt: |
  Quilla está en un cruce oscuro. Lee con `robot.escanear()` las casillas que alumbra el faro y haz que diga, con `robot.decir`, **los rumbos libres** (los que no son roca `"#"`) en el orden `N E S O`, separados por un espacio: por ejemplo `"E S"`.

  `escanear()` devuelve una cuadrícula de 3 × 3 con Quilla en el centro, `vista[1][1]`. Usa el diccionario `PASOS`, que ya dice cuánto se mueve `x` e `y` hacia cada rumbo; Quilla no necesita moverse. El programa se prueba en tres cruces distintos.
visual:
  figure:
    title: Lo que ve el faro en el primer cruce
    panes:
      - { label: "vista (Quilla en el centro)", grid: ["###", "#..", "#.#"], marks: ["1,1"] }
      - { label: "rumbo → casilla", table: { head: ["rumbo", "(dx, dy)", "vista[1 + dy][1 + dx]"], rows: [["N", "(0, -1)", "#"], ["E", "(1, 0)", "."], ["S", "(0, 1)", "."], ["O", "(-1, 0)", "#"]] } }
      - { label: dice, value: "E S" }
starter: |
  PASOS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "O": (-1, 0)}

  vista = robot.escanear()
  print(vista)
solution: |
  PASOS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "O": (-1, 0)}

  vista = robot.escanear()
  libres = [rumbo for rumbo, (dx, dy) in PASOS.items() if vista[1 + dy][1 + dx] != "#"]
  robot.decir(" ".join(libres))
hints:
  - "Recorre `PASOS.items()`: cada rumbo trae su `(dx, dy)`, y la casilla de ese lado es `vista[1 + dy][1 + dx]`."
  - "`\" \".join(libres)` une la lista con espacios."
world:
  theme: mina
  level: 3
  dir: E
  api: [move, scan]
  fog: true
  vision: 1
  map: |
    #####
    #R..#
    #.###
    #####
scenarios:
  - tests:
      - name: dice "E S"
        state: 'w.said == ["E S"]'
  - map: |
      #####
      ##.##
      #.R.#
      #####
    tests:
      - name: dice "N E O"
        state: 'w.said == ["N E O"]'
  - map: |
      #####
      #..##
      #.R##
      ##.##
      #####
    tests:
      - name: dice "N S O"
        state: 'w.said == ["N S O"]'
tests:
  - name: lee el faro
    source: 'robot\.escanear\(\)'
```

## El caso

```exercise
id: py9-caso-bombas
type: case
title: La celda que se inundó primero
prompt: |
  **Cuenta cuántas de las 4 vecinas de cada bomba tienen agua y compáralo con lo que anotó su operador.** El que no cuadra no revisó su bomba, y ahí empezó la inundación.

  En la galería de Santa Rosalía hay cuatro bombas de agua, cada una en una casilla, con un operador. Al final de cada turno, el operador anota en el cuaderno cuántas de las **4 casillas vecinas** de su bomba (norte, sur, este y oeste) tienen agua. Esa noche alguien no bajó a mirar, escribió un número cualquiera, y su bomba se quedó trabada. Ahora el sensor de Quilla dio el plano del agua (en centímetros) y Don Ciriaco quiere saber quién fue.

  Ojo: dos bombas están en el borde. Una vecina fuera de la galería no existe, y en Python `agua[-1]` no avisa: lee la última fila.

  Imprime una línea por operador que empiece con su nombre, por ejemplo `print("Yolanda:", cuenta)`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py9-caso-bombas
    task: "Vecinas mojadas = cuántas de las 4 casillas alrededor de la bomba tienen más de 0 cm. Compáralo con lo anotado."
    cards:
      - name: Yolanda
        kind: person
        culprit: true
        role: Bomba del centro
        rows: [["Bomba en", "(3, 2)"], ["Anotó", "1 vecina mojada"]]
        clue: { find: "Yolanda", says: 1, saysLabel: Anotó }
      - name: Wilber
        kind: person
        role: Bomba del rincón
        rows: [["Bomba en", "(0, 4)"], ["Anotó", "2 vecinas mojadas"]]
        clue: { find: "Wilber", says: 2, saysLabel: Anotó }
      - name: Rosa
        kind: person
        role: Bomba del ramal este
        rows: [["Bomba en", "(5, 1)"], ["Anotó", "2 vecinas mojadas"]]
        clue: { find: "Rosa", says: 2, saysLabel: Anotó }
      - name: Fredy
        kind: person
        role: Bomba de la entrada
        rows: [["Bomba en", "(1, 0)"], ["Anotó", "2 vecinas mojadas"]]
        clue: { find: "Fredy", says: 2, saysLabel: Anotó }
      - name: El plano del agua
        kind: note
        role: Centímetros por casilla (fila y, columnas x = 0…6)
        rows: [["y = 0", "0 0 3 5 0 0 0"], ["y = 1", "0 2 8 9 4 0 0"], ["y = 2", "0 0 6 12 7 1 0"], ["y = 3", "1 0 0 5 3 0 0"], ["y = 4", "4 2 0 0 0 0 2"]]
    caption: "Si Wilber o Fredy no te cuadran, revisa si estás leyendo vecinas fuera del borde."
starter: |
  # Centímetros de agua en cada casilla: agua[y][x]
  agua = [
      [0, 0, 3, 5, 0, 0, 0],
      [0, 2, 8, 9, 4, 0, 0],
      [0, 0, 6, 12, 7, 1, 0],
      [1, 0, 0, 5, 3, 0, 0],
      [4, 2, 0, 0, 0, 0, 2],
  ]

  # Dónde está la bomba de cada operador, como (x, y)
  bombas = {
      "Yolanda": (3, 2),
      "Wilber": (0, 4),
      "Rosa": (5, 1),
      "Fredy": (1, 0),
  }

  PASOS = [(1, 0), (-1, 0), (0, 1), (0, -1)]

  # TODO: cuenta las vecinas mojadas de cada bomba
  # e imprime una línea por operador, por ejemplo:
  # print("Yolanda:", cuenta)
solution: |
  agua = [
      [0, 0, 3, 5, 0, 0, 0],
      [0, 2, 8, 9, 4, 0, 0],
      [0, 0, 6, 12, 7, 1, 0],
      [1, 0, 0, 5, 3, 0, 0],
      [4, 2, 0, 0, 0, 0, 2],
  ]

  bombas = {
      "Yolanda": (3, 2),
      "Wilber": (0, 4),
      "Rosa": (5, 1),
      "Fredy": (1, 0),
  }

  PASOS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


  def vecinas_mojadas(x, y):
      """Cuántas de las 4 vecinas de (x, y) tienen agua."""
      cuenta = 0
      for dx, dy in PASOS:
          nx, ny = x + dx, y + dy
          if 0 <= nx < len(agua[0]) and 0 <= ny < len(agua) and agua[ny][nx] > 0:
              cuenta += 1
      return cuenta


  for operador, (x, y) in bombas.items():
      print(f"{operador}:", vecinas_mojadas(x, y))
answer: Yolanda
answerLabel: ¿Quién no revisó su bomba?
reveal: |
  Yolanda. Su bomba está en `(3, 2)`, la casilla más honda (12 cm), y sus cuatro vecinas tienen agua: 9 al norte, 5 al sur, 6 al oeste y 7 al este. Anotó 1. Las bombas de Wilber `(0, 4)` y Fredy `(1, 0)` están en el borde: si se cuentan las "vecinas" de `agua[-1]` o de la columna `-1`, sale un número de más y parece que ellos mintieron.
hints:
  - "`for operador, (x, y) in bombas.items():` saca el nombre y la tupla de cada bomba de una vez."
  - "Por cada `(dx, dy)` de `PASOS`, revisa `0 <= nx < len(agua[0]) and 0 <= ny < len(agua)` antes de leer `agua[ny][nx]`."
```

## El juez

Como desde la sesión 4, el juez **llama a tus funciones** y compara lo que devuelven. Hoy los argumentos son cuadrículas: una lista de textos (un plano) o una lista de listas de números.

```exercise
id: py9-juez-filtraciones
type: judge
mode: function
function: revisar_galeria
title: Dónde descansar
prompt: |
  **Escribe `revisar_galeria(plano)`, que devuelve `[seguras, peor]`: cuántas casillas de piso no tienen ninguna filtración alrededor, y cuántas filtraciones tiene alrededor la peor casilla de piso. Y su ayudante `filtraciones_cerca(plano, x, y)`.**

  Don Ciriaco quiere saber dónde pueden descansar los mineros. El plano es una lista de textos, todos del mismo largo: `"."` es piso, `"#"` es roca y `"~"` es una **filtración** (por ahí entra el agua). Alrededor de una casilla cuentan sus **8 vecinas**, diagonales incluidas, siempre que estén dentro del plano.

  - `filtraciones_cerca(plano, x, y)`: cuántas de las 8 vecinas de `(x, y)` son `"~"`. La casilla misma no cuenta.
  - `revisar_galeria(plano)`: mirando **solo las casillas de piso** `"."`, `seguras` es cuántas tienen 0 filtraciones cerca y `peor` es el mayor número de filtraciones cerca de una de ellas. Si no hay ninguna casilla de piso, devuelve `[0, 0]`.

  **Restricciones:** de 1 a 12 filas · de 1 a 12 columnas · solo `.`, `#` y `~`.
visual:
  figure:
    title: El ejemplo 1, casilla por casilla
    input: { label: plano, grid: ["~..#", "....", "#.~."], marks: ["0,0", "2,2"] }
    arrow: filtraciones cerca de cada casilla de piso
    output: { label: "devuelve [1, 2]", table: { head: ["", "x=0", "x=1", "x=2", "x=3"], rows: [["y=0", "~", "1", "0", "#"], ["y=1", "1", "2", "1", "1"], ["y=2", "#", "1", "~", "1"]] } }
    steps:
      - "La única casilla de piso con 0 es `(2, 0)`: seguras = 1."
      - "La peor es `(1, 1)`, que toca las dos filtraciones en diagonal: peor = 2."
starter: |
  def filtraciones_cerca(plano, x, y):
      pass


  def revisar_galeria(plano):
      pass
solution: |
  VECINAS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


  def filtraciones_cerca(plano, x, y):
      """Cuántas de las 8 vecinas de (x, y) son filtraciones."""
      alto, ancho = len(plano), len(plano[0])
      total = 0
      for dx, dy in VECINAS:
          nx, ny = x + dx, y + dy
          if 0 <= nx < ancho and 0 <= ny < alto and plano[ny][nx] == "~":
              total += 1
      return total


  def revisar_galeria(plano):
      """[casillas de piso sin filtraciones cerca, filtraciones de la peor casilla de piso]."""
      cuentas = [
          filtraciones_cerca(plano, x, y)
          for y, fila in enumerate(plano)
          for x, casilla in enumerate(fila)
          if casilla == "."
      ]
      return [cuentas.count(0), max(cuentas, default=0)]
hints:
  - "Las 8 vecinas son todas las combinaciones de `dx` y `dy` entre -1 y 1, menos `(0, 0)`. Escríbelas en una lista de tuplas."
  - "Junta en una lista las cuentas de las casillas `\".\"`; luego `cuentas.count(0)` y `max(cuentas, default=0)`."
samples:
  - args: [["~..#", "....", "#.~."]]
    returns: [1, 2]
    note: Una sola casilla de piso sin filtraciones cerca; la peor toca dos.
  - args: [["...", ".~.", "..."]]
    returns: [0, 1]
    note: La filtración del centro toca a las 8 casillas de piso.
  - fn: filtraciones_cerca
    args: [["~~~", "~.~", "~~~"], 1, 1]
    returns: 8
    note: La ayudante también se juzga sola.
edge:
  - args: [["."]]
    tag: con una sola casilla de piso
  - args: [["~"]]
    tag: con una sola filtración y nada de piso
  - args: [["#~#", "~#~"]]
    tag: sin casillas de piso
  - args: [["~.........~"]]
    tag: con una sola fila
  - args: [["~", ".", ".", ".", "~"]]
    tag: con una sola columna
  - args: [["~~~~", "~..~", "~~~~"]]
    tag: con el piso rodeado de filtraciones
  - args: [["....~", ".....", ".....", "~...."]]
    tag: con filtraciones en esquinas opuestas
  - fn: filtraciones_cerca
    args: [["..~", "...", "~.."], 0, 0]
    tag: en filtraciones_cerca, en una esquina con filtraciones al otro lado
  - fn: filtraciones_cerca
    args: [["~.", ".~"], 0, 0]
    tag: en filtraciones_cerca, sin contar la casilla misma
random:
  count: 40
  seed: 909
  generate: |
    alto = rng.int(1, 12)
    ancho = rng.int(1, 12)
    densidad = rng.pick([5, 12, 25, 45])
    plano = []
    for _ in range(alto):
        fila = ""
        for _ in range(ancho):
            r = rng.int(1, 100)
            fila += "~" if r <= densidad else "#" if r <= densidad + 15 else "."
        plano.append(fila)
    return [plano]
wrong:
  - |
    VECINAS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


    def filtraciones_cerca(plano, x, y):
        alto, ancho = len(plano), len(plano[0])
        total = 0
        for dx, dy in VECINAS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < ancho and 0 <= ny < alto and plano[ny][nx] == "~":
                total += 1
        return total


    def revisar_galeria(plano):
        cuentas = [filtraciones_cerca(plano, x, y) for y, fila in enumerate(plano) for x, c in enumerate(fila) if c == "."]
        return [cuentas.count(0), max(cuentas, default=0)]
  - |
    VECINAS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


    def filtraciones_cerca(plano, x, y):
        total = 0
        for dx, dy in VECINAS:
            try:
                if plano[y + dy][x + dx] == "~":
                    total += 1
            except IndexError:
                pass
        return total


    def revisar_galeria(plano):
        cuentas = [filtraciones_cerca(plano, x, y) for y, fila in enumerate(plano) for x, c in enumerate(fila) if c == "."]
        return [cuentas.count(0), max(cuentas, default=0)]
  - |
    VECINAS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


    def filtraciones_cerca(plano, x, y):
        alto, ancho = len(plano), len(plano[0])
        total = 0
        for dx, dy in VECINAS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < alto and 0 <= ny < ancho and plano[nx][ny] == "~":
                total += 1
        return total


    def revisar_galeria(plano):
        cuentas = [filtraciones_cerca(plano, x, y) for y, fila in enumerate(plano) for x, c in enumerate(fila) if c == "."]
        return [cuentas.count(0), max(cuentas, default=0)]
```

```exercise
id: py9-juez-camara
type: judge
mode: function
function: girar_camara
title: La cámara de costado
prompt: |
  **Escribe `girar_camara(foto)`, que devuelve la foto girada 90° en el sentido de las agujas del reloj.**

  La cámara térmica que Maru le puso a Quilla quedó atornillada de costado: cada foto sale acostada. Una foto es una lista de filas de números (la temperatura de cada punto), todas del mismo largo. Girarla a la derecha hace que **la primera columna, leída de abajo hacia arriba, sea la primera fila**. Una foto de `alto` filas y `ancho` columnas queda de `ancho` filas y `alto` columnas.

  Devuelve una lista de listas nueva; no hace falta cambiar `foto`.

  **Restricciones:** de 1 a 8 filas · de 1 a 8 columnas · números de 0 a 99.
visual:
  figure:
    title: El ejemplo 1, girado
    input: { label: "foto (2 filas × 3 columnas)", table: { head: ["", "x=0", "x=1", "x=2"], rows: [["y=0", "1", "2", "3"], ["y=1", "4", "5", "6"]] } }
    arrow: 90° a la derecha
    output: { label: "devuelve (3 filas × 2 columnas)", table: { head: ["", "x=0", "x=1"], rows: [["y=0", "4", "1"], ["y=1", "5", "2"], ["y=2", "6", "3"]] } }
    steps:
      - "La columna 0 de abajo hacia arriba es `4, 1`: esa es la nueva fila 0."
      - "En general, la nueva fila `x` es la columna `x` leída desde la última fila hasta la primera."
starter: |
  def girar_camara(foto):
      pass
solution: |
  def girar_camara(foto):
      """La foto girada 90° en el sentido de las agujas del reloj."""
      alto, ancho = len(foto), len(foto[0])
      return [[foto[alto - 1 - y][x] for y in range(alto)] for x in range(ancho)]
hints:
  - "La nueva cuadrícula tiene una fila por cada columna `x` de la foto, y esa fila recorre la columna desde la última fila (`alto - 1`) hasta la 0."
  - "`[[foto[alto - 1 - y][x] for y in range(alto)] for x in range(ancho)]`. Otra forma: `zip(*foto[::-1])` junta las columnas de la foto dada vuelta."
samples:
  - args: [[[1, 2, 3], [4, 5, 6]]]
    returns: [[4, 1], [5, 2], [6, 3]]
    note: Dos filas de tres quedan como tres filas de dos.
  - args: [[[7, 8], [9, 10]]]
    returns: [[9, 7], [10, 8]]
edge:
  - args: [[[42]]]
    tag: con un solo punto
  - args: [[[1, 2, 3, 4]]]
    tag: con una sola fila
  - args: [[[1], [2], [3], [4]]]
    tag: con una sola columna
  - args: [[[0, 0, 0], [0, 0, 0], [0, 0, 1]]]
    tag: con un punto caliente en la esquina
  - args: [[[5, 6], [7, 8], [9, 10], [11, 12], [13, 14]]]
    tag: con una foto más alta que ancha
random:
  count: 40
  seed: 90
  generate: |
    alto = rng.int(1, 8)
    ancho = rng.int(1, 8)
    return [[rng.list(ancho, 0, 99) for _ in range(alto)]]
wrong:
  - |
    def girar_camara(foto):
        return [list(columna) for columna in zip(*foto)]
  - |
    def girar_camara(foto):
        return [list(columna) for columna in zip(*foto)][::-1]
  - |
    def girar_camara(foto):
        n = len(foto)
        return [[foto[n - 1 - y][x] for y in range(n)] for x in range(n)]
  - |
    def girar_camara(foto):
        return [list(columna)[::-1] for columna in zip(*foto[::-1])]
```

## Misión final

```exercise
id: py9-mision-cuarzo
type: mission
title: El cuarzo antes del agua
prompt: |
  **Lee el plano con `robot.mapa()`, anota dónde está cada cristal en un diccionario `cristales` de `(x, y)` a cantidad, ve a recoger todos y reporta el total una sola vez.**

  La cámara del fondo de Santa Rosalía se está llenando y no hay tiempo de barrerla casilla por casilla: Quilla lleva **la batería justa para ir de cristal en cristal**. La cámara no tiene rocas por dentro, así que se puede ir de una casilla a otra caminando primero por la fila y después por la columna.

  1. `plano = robot.mapa()` y arma `cristales` con una comprensión: las casillas cuyo carácter es un dígito (`c.isdigit()`), con `int(c)` como valor.
  2. Completa `ir_a(x, y)`. `mirar(rumbo)` ya está escrita: gira hasta mirar a `"N"`, `"E"`, `"S"` u `"O"`. `robot.posicion.x` y `robot.posicion.y` dicen dónde está Quilla.
  3. Recorre `sorted(cristales)`, ve a cada uno, `robot.recoger()`, suma, y al final `robot.reportar(total)`.

  Se prueba en tres cámaras distintas, y Quilla no siempre empieza en el mismo lugar ni mirando al mismo lado. Cuando pase, junto con los jueces, se desbloquea la sesión 10.
starter: |
  def mirar(rumbo):
      """Gira a la derecha hasta quedar mirando a rumbo: "N", "E", "S" u "O"."""
      while robot.direccion != rumbo:
          robot.girar_derecha()


  def ir_a(x, y):
      """Camina hasta (x, y): primero por la fila, después por la columna."""
      pass


  plano = robot.mapa()
  cristales = {}
  total = 0

  robot.reportar(total)
solution: |
  def mirar(rumbo):
      """Gira a la derecha hasta quedar mirando a rumbo: "N", "E", "S" u "O"."""
      while robot.direccion != rumbo:
          robot.girar_derecha()


  def ir_a(x, y):
      """Camina hasta (x, y): primero por la fila, después por la columna."""
      dx = x - robot.posicion.x
      if dx != 0:
          mirar("E" if dx > 0 else "O")
          robot.avanzar(abs(dx))
      dy = y - robot.posicion.y
      if dy != 0:
          mirar("S" if dy > 0 else "N")
          robot.avanzar(abs(dy))


  plano = robot.mapa()
  cristales = {
      (x, y): int(c)
      for y, fila in enumerate(plano)
      for x, c in enumerate(fila)
      if c.isdigit()
  }
  total = 0
  for x, y in sorted(cristales):
      ir_a(x, y)
      total += robot.recoger()

  robot.reportar(total)
hints:
  - "En `ir_a`, `dx = x - robot.posicion.x` dice cuánto y hacia dónde: positivo es al este, negativo al oeste. `abs(dx)` son los pasos. Lo mismo con `dy`: positivo es al sur."
  - "No llames a `robot.avanzar(0)` ni gires si ya estás en la columna o la fila: pregunta `if dx != 0:` antes."
world:
  theme: mina
  level: 3
  dir: E
  battery: 28
  api: [move, mine, map]
  map: |
    ###########
    #R...3....#
    #..2....1.#
    #.....4...#
    #.1.......#
    #......2..#
    ###########
scenarios:
  - {}
  - world: { battery: 18, dir: N }
    map: |
      #########
      #.....5.#
      #.2.....#
      #....R..#
      #3....1.#
      #########
  - world: { battery: 53, dir: W }
    map: |
      #############
      #.4.......2.#
      #.....9.....#
      #...........#
      #1.......3..#
      #.....R.....#
      #..7......1.#
      #############
tests:
  - name: lee el plano con robot.mapa()
    source: 'robot\.mapa\(\)'
  - name: cristales tiene tuplas (x, y) como claves
    expect: 'len(cristales) > 0 and all(isinstance(k, tuple) and len(k) == 2 for k in cristales)'
    msg: "cristales debe ser un diccionario {(x, y): cantidad} con un elemento por casilla con cristales."
  - name: no quedan cristales en la cámara
    state: w.crystals_left == 0
    msg: Quedaron cristales. ¿ir_a llega a la casilla exacta? Recuerda que la fila es y y la columna es x.
  - name: reporta el total exacto, una vez
    state: w.reports == [w.crystals_total]
    msg: El número reportado no es el total de la cámara (o se reportó más de una vez).
  - name: Quilla no choca ni se queda sin batería
    state: not w.crashed
```

## Reto experto

```exercise
id: py9-reto-espiral
type: challenge
title: La ronda en espiral
visual:
  figure:
    title: espiral de una cámara de 3 × 4
    input: { label: grilla, table: { head: ["", "x=0", "x=1", "x=2", "x=3"], rows: [["y=0", "1", "2", "3", "4"], ["y=1", "10", "11", "12", "5"], ["y=2", "9", "8", "7", "6"]] } }
    arrow: borde de afuera hacia adentro, en el sentido del reloj
    output: { label: devuelve, cells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], index: false }
prompt: |
  **Escribe `espiral(grilla)`, que devuelve en una lista los valores de la cuadrícula recorridos en espiral: la fila de arriba hacia el este, la columna derecha hacia el sur, la fila de abajo hacia el oeste, la columna izquierda hacia el norte, y otra vuelta más adentro hasta pasar por todas.** Para quien ya programa.

  Es la ronda que hace Quilla para revisar una cámara sin pisar dos veces la misma casilla. La cuadrícula puede ser rectangular, de una sola fila o columna, o estar vacía (`[]`). No modifiques `grilla`.
starter: |
  def espiral(grilla):
      return []


  print(espiral([[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]]))
solution: |
  def espiral(grilla):
      """Los valores de la cuadrícula en espiral, del borde hacia adentro."""
      if not grilla:
          return []
      arriba, abajo = 0, len(grilla) - 1
      izquierda, derecha = 0, len(grilla[0]) - 1
      ronda = []
      while arriba <= abajo and izquierda <= derecha:
          ronda += [grilla[arriba][x] for x in range(izquierda, derecha + 1)]
          ronda += [grilla[y][derecha] for y in range(arriba + 1, abajo + 1)]
          if arriba < abajo:
              ronda += [grilla[abajo][x] for x in range(derecha - 1, izquierda - 1, -1)]
          if izquierda < derecha:
              ronda += [grilla[y][izquierda] for y in range(abajo - 1, arriba, -1)]
          arriba, abajo = arriba + 1, abajo - 1
          izquierda, derecha = izquierda + 1, derecha - 1
      return ronda


  print(espiral([[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]]))
hints:
  - "Lleva cuatro límites: `arriba`, `abajo`, `izquierda`, `derecha`. Cada vuelta recorre los cuatro lados y los cierra un paso hacia adentro."
  - "Cuidado con la última vuelta cuando queda una sola fila o una sola columna: no la recorras dos veces."
tests:
  - name: la cámara del dibujo
    run: espiral([[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]])
    equals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  - name: una cuadrada de 3 × 3
    run: espiral([[1, 2, 3], [8, 9, 4], [7, 6, 5]])
    equals: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  - name: una más alta que ancha
    run: espiral([[1, 2], [8, 3], [7, 4], [6, 5]])
    equals: [1, 2, 3, 4, 5, 6, 7, 8]
  - name: una sola fila
    run: espiral([[4, 5, 6]])
    equals: [4, 5, 6]
  - name: una sola columna
    run: espiral([[4], [5], [6]])
    equals: [4, 5, 6]
  - name: un solo valor y una vacía
    run: '[espiral([[7]]), espiral([])]'
    equals: [[7], []]
  - name: no modifica la grilla
    expect: '(lambda g: (espiral(g), g)[1])([[1, 2], [4, 3]]) == [[1, 2], [4, 3]]'
```
