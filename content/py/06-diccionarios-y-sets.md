# Sesión 6 — Diccionarios y sets

## El encargo

Túcume, Lambayeque: el valle de las pirámides. Veintiséis huacas de adobe se deshacen despacito al sol, y al pie de la Huaca Larga está el museo de sitio, donde la directora **Rosa Llontop** guarda miles de piezas: cuencos, tumis de cobre, orejeras, cuentas de spondylus y un perro sin pelo de cerámica que todos los escolares quieren tocar. El inventario está en un cuaderno de 1998 y en tres hojas de cálculo que no se ponen de acuerdo.

Maru le prestó a Quilla, que ya trae su sirena, para la ronda de noche y para ordenar el inventario. Pero buscar "¿en qué vitrina está el tumi T-114?" recorriendo una lista de cuatro mil piezas es lento y aburrido. Hoy Quilla aprende a guardar las cosas **por su nombre**: diccionarios, para preguntar "¿dónde está?" de un salto, y sets, para preguntar "¿quién está en los dos lados?".

```escena
theme: museo
level: 2
dir: E
caption: La ronda de Quilla por el pasillo del museo. Cierra la puerta abierta de la primera sala y hace sonar la sirena en la segunda, donde algo se mueve.
map: |
  ############
  #R.........#
  ###O###P##P#
  ###.###m##.#
  ############
program: |
  robot.avanzar(2)
  lectura = robot.sensor()
  if lectura["puerta"] == "abierta":
      robot.cerrar_puerta()
  robot.avanzar(4)
  if robot.sensor()["movimiento"]:
      robot.alarma()
```

## Lo mínimo

Un **diccionario** (`dict`) guarda pares **clave: valor**. En vez de buscar por posición, como en una lista, buscas por la clave: `vitrinas["tumi"]` va directo a la vitrina del tumi, tenga el museo diez piezas o diez mil.

```py run
vitrinas = {"tumi": "V3", "cuenco": "V1", "orejera": "V7"}
print(vitrinas["tumi"], vitrinas.get("ídolo", "sin vitrina"))
print("cuenco" in vitrinas, "V1" in vitrinas)
vitrinas["ídolo"] = "V2"
print(list(vitrinas))
```

- **Leer.** `d[clave]` da el valor, y si la clave no existe es un `KeyError`. `d.get(clave)` da `None` si no existe, y `d.get(clave, otro)` da `otro`.
- **Escribir.** `d[clave] = valor` agrega la clave o cambia su valor si ya estaba.
- **Preguntar.** `clave in d` mira **las claves**, nunca los valores.
- **Recorrer.** `for clave in d` da las claves; `d.keys()`, `d.values()` y `d.items()` dan las claves, los valores y los pares `(clave, valor)`: `for sala, visitas in d.items():`.
- **El orden** es el de inserción: las claves salen en el orden en que entraron. Cambiar el valor de una clave que ya estaba no la mueve de sitio.
- **Unir.** `base | cambios` crea un diccionario nuevo con las claves de los dos; si una se repite, gana la de la derecha.

El uso estrella de un diccionario es **contar**. `conteo.get(sala, 0)` da lo que llevas contado, o 0 la primera vez. Mira cómo se llena el diccionario:

```anima
title: Contar visitas con get
code: |
  visitas = ["Templo", "Huaca Larga", "Templo", "Las Balsas", "Templo"]
  conteo = {}
  for sala in visitas:
      conteo[sala] = conteo.get(sala, 0) + 1
  print(conteo)
cells: { of: visitas, at: sala }
notes:
  2: "Un diccionario vacío: todavía no hay ninguna sala."
  4: "Si la sala es nueva, get da 0 y queda en 1; si ya estaba, le suma 1 a lo que tenía."
  5: Las salas salen en el orden en que aparecieron por primera vez.
```

Un valor puede ser cualquier cosa, también una lista u otro diccionario: eso es un **diccionario anidado**, y se lee con dos corchetes seguidos. Para agrupar, `setdefault(clave, [])` devuelve la lista de esa clave y, si no había, la crea primero:

```py run
piezas = [("cuenco", "cerámica"), ("tumi", "cobre"), ("orejera", "cobre")]
por_material = {}
for pieza, material in piezas:
    por_material.setdefault(material, []).append(pieza)
print(por_material, por_material["cobre"][1])
```

Un **set** es una bolsa sin repeticiones y sin orden: sirve para preguntar "¿ya lo vi?" y para comparar grupos. Se escribe con llaves (`{"Ana", "Beto"}`), pero el set vacío es `set()`, porque `{}` es un diccionario vacío.

```py run
lunes = {"Rosa", "Teófilo", "Nilda"}
martes = {"Teófilo", "Wilmer"}
print(sorted(lunes | martes), sorted(lunes & martes), sorted(lunes - martes))
lunes.add("Wilmer")
print(len(lunes), "Wilmer" in lunes)
```

`|` junta los dos, `&` deja lo que está en ambos y `-` lo que está en el primero y no en el segundo. Como un set no tiene orden, aquí se imprime con `sorted()`.

**¿Qué puede ser clave?** Las claves de un diccionario y los elementos de un set tienen que ser **inmutables** (*hashables*): números, textos, tuplas. Una lista no, porque puede cambiar después de guardada. Por eso un cuadro de excavación se guarda como `hallazgos[(3, 4)]`, con tupla, y no como `hallazgos[[3, 4]]`, que da `TypeError: unhashable type: 'list'`.

> **Trampa común:** `d[clave]` con una clave que no existe no da `None`: detiene el programa con un `KeyError`. Si la clave puede faltar, pregunta antes con `in` o usa `d.get(clave, por_defecto)`.

<!-- legacy: dict-get -->

<!-- legacy: dict-has-key -->

<!-- legacy: dict-merge -->

<!-- legacy: set-literal -->

<!-- mdn: dict-get dict-has-key dict-merge set-literal -->

## Práctica

```exercise
id: py6-predice-get
type: predict
title: La orejera que no tenía vitrina
prompt: |
  Antes de ejecutarlo: ¿qué imprime?
visual:
  figure:
    panes:
      - { label: vitrinas, cards: [{ title: vitrinas, rows: [["\"tumi\"", "\"V3\""], ["\"cuenco\"", "\"V1\""]] }] }
code: |
  vitrinas = {"tumi": "V3", "cuenco": "V1"}
  print(vitrinas.get("orejera"))
  print(vitrinas.get("orejera", "depósito"))
  print("V3" in vitrinas, "tumi" in vitrinas)
  print(len(vitrinas))
options:
  - "None\ndepósito\nFalse True\n2"
  - "None\ndepósito\nTrue True\n2"
  - "depósito\ndepósito\nFalse True\n2"
  - "None\ndepósito\nFalse True\n4"
answer: "None\ndepósito\nFalse True\n2"
explain: |
  `get` sin valor por defecto da `None` cuando la clave falta; con él, da el valor por defecto. `in` busca entre las **claves**: `"V3"` es un valor, así que da `False`. Y `len` cuenta pares, no claves más valores: 2.
```

```exercise
id: py6-predice-horario
type: predict
title: El horario del feriado
prompt: |
  Rosa une el horario de siempre con los cambios del feriado y, después, cambia el lunes en el horario de siempre. ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: horario, cards: [{ title: horario, rows: [["lunes", "\"cerrado\""], ["martes", "\"9-17\""], ["domingo", "\"9-13\""]] }] }
      - { label: feriado, cards: [{ title: feriado, rows: [["martes", "\"cerrado\""], ["jueves", "\"9-13\""]] }] }
code: |
  horario = {"lunes": "cerrado", "martes": "9-17", "domingo": "9-13"}
  feriado = {"martes": "cerrado", "jueves": "9-13"}
  nuevo = horario | feriado
  horario["lunes"] = "10-16"
  print(list(nuevo))
  print(nuevo["martes"], nuevo["lunes"])
options:
  - "['lunes', 'martes', 'domingo', 'jueves']\ncerrado cerrado"
  - "['lunes', 'domingo', 'martes', 'jueves']\ncerrado cerrado"
  - "['lunes', 'martes', 'domingo', 'jueves']\n9-17 10-16"
  - "['lunes', 'martes', 'domingo', 'jueves']\ncerrado 10-16"
answer: "['lunes', 'martes', 'domingo', 'jueves']\ncerrado cerrado"
explain: |
  En `horario | feriado`, el `martes` repetido toma el valor de la derecha (`"cerrado"`) pero **no se mueve**: se queda en el lugar donde entró primero. `jueves` es nuevo y va al final. Y `nuevo` es un diccionario aparte: cambiar `horario` después no lo toca.
```

```exercise
id: py6-completa-conteo
type: complete
title: Lo que salió del cuadro 7
prompt: |
  Quilla ayudó a cernir la tierra del cuadro de excavación 7 y anotó el material de cada fragmento. Completa los `___` para contar cuántos fragmentos hay de cada material e imprimir una línea por material.
visual:
  figure:
    input: { label: hallazgos, cells: ["cerámica", "cobre", "cerámica", "concha", "cerámica", "cobre"] }
    arrow: "conteo[material] = conteo.get(material, 0) + 1"
    output: { label: conteo, cards: [{ title: conteo, rows: [["cerámica", "3"], ["cobre", "2"], ["concha", "1"]] }] }
starter: |
  hallazgos = ["cerámica", "cobre", "cerámica", "concha", "cerámica", "cobre"]
  conteo = ___
  for material in hallazgos:
      conteo[material] = conteo.___(material, ___) + 1
  for material, cantidad in conteo.___():
      print(f"{material}: {cantidad}")
solution: |
  hallazgos = ["cerámica", "cobre", "cerámica", "concha", "cerámica", "cobre"]
  conteo = {}
  for material in hallazgos:
      conteo[material] = conteo.get(material, 0) + 1
  for material, cantidad in conteo.items():
      print(f"{material}: {cantidad}")
hints:
  - El conteo empieza como un diccionario vacío.
  - "`get(material, 0)` da 0 la primera vez que aparece un material. Para recorrer los pares, `.items()`."
tests:
  - name: cuenta cada material
    run: conteo
    equals: { "cerámica": 3, "cobre": 2, "concha": 1 }
  - name: imprime en el orden en que aparecieron
    output: "cerámica: 3\ncobre: 2\nconcha: 1"
  - name: cuenta con get
    source: '\.get\(\s*material\s*,\s*0\s*\)'
```

```exercise
id: py6-escribe-rutas
type: write
title: Dos colegios, una mañana
prompt: |
  Escribe `comparar(ruta_a, ruta_b)`, que devuelve tres sets: las huacas que visitaron **los dos** colegios, las que visitó **solo el primero** y las que visitó **solo el segundo**, en ese orden.

  Dos colegios de Chiclayo vinieron el mismo día, y cada guía anotó las huacas que visitó su grupo (a veces la misma dos veces, porque volvieron por la gorra de alguien). Rosa quiere saber dónde se cruzaron. Convierte cada lista en set y usa `&` y `-`.
visual:
  figure:
    panes:
      - { label: ruta_a, cells: ["Huaca Larga", "Templo", "Huaca 1", "Templo"] }
      - { label: ruta_b, cells: ["Las Balsas", "Templo", "Huaca Larga"] }
      - { label: devuelve, table: { head: ["en las dos", "solo a", "solo b"], rows: [["Huaca Larga, Templo", "Huaca 1", "Las Balsas"]] } }
starter: |
  def comparar(ruta_a, ruta_b):
      return set(), set(), set()

  print(comparar(["Huaca Larga", "Templo", "Huaca 1", "Templo"], ["Las Balsas", "Templo", "Huaca Larga"]))
solution: |
  def comparar(ruta_a, ruta_b):
      visitas_a = set(ruta_a)
      visitas_b = set(ruta_b)
      return visitas_a & visitas_b, visitas_a - visitas_b, visitas_b - visitas_a

  print(comparar(["Huaca Larga", "Templo", "Huaca 1", "Templo"], ["Las Balsas", "Templo", "Huaca Larga"]))
hints:
  - "`set(ruta_a)` quita las repeticiones de la lista."
  - "Lo que está en los dos es `a & b`; lo que está solo en `a` es `a - b`."
tests:
  - name: el ejemplo del dibujo
    run: 'comparar(["Huaca Larga", "Templo", "Huaca 1", "Templo"], ["Las Balsas", "Templo", "Huaca Larga"])'
    equals: [["Huaca Larga", "Templo"], ["Huaca 1"], ["Las Balsas"]]
  - name: sin huacas en común
    run: 'comparar(["Huaca 1"], ["Las Balsas", "Las Balsas"])'
    equals: [[], ["Huaca 1"], ["Las Balsas"]]
  - name: un colegio que no salió del museo
    run: 'comparar([], ["Templo"])'
    equals: [[], [], ["Templo"]]
  - name: devuelve sets
    expect: 'type(comparar(["Templo"], ["Templo"])[0]) == set'
    msg: Devuelve sets (con & y -), no listas.
  - name: usa & y -
    source: '&[\s\S]*-|-[\s\S]*&'
```

```exercise
id: py6-arregla-cuadricula
type: fix
title: El plano de la excavación
prompt: |
  Quilla guarda qué encontró en cada cuadro de la excavación usando las coordenadas como clave. El programa se cae en la segunda línea. Ejecútalo, lee el error y arréglalo para que imprima `En (2, 5) hay un cuenco`.
visual:
  figure:
    panes:
      - { label: cuadros, grid: ["......", "......", "......", "......", "......", "......"], marks: ["2,5", "4,1"] }
      - { label: hallazgos, cards: [{ title: hallazgos, rows: [["(2, 5)", "\"cuenco\""], ["(4, 1)", "\"tumi\""]] }] }
starter: |
  hallazgos = {}
  hallazgos[[2, 5]] = "cuenco"
  hallazgos[[4, 1]] = "tumi"
  cuadro = [2, 5]
  print("En", cuadro, "hay un", hallazgos[cuadro])
solution: |
  hallazgos = {}
  hallazgos[(2, 5)] = "cuenco"
  hallazgos[(4, 1)] = "tumi"
  cuadro = (2, 5)
  print("En", cuadro, "hay un", hallazgos[cuadro])
hints:
  - "`unhashable type: 'list'` quiere decir que una lista no puede ser clave: podría cambiar después de guardada."
  - Una tupla, con paréntesis, no cambia nunca. Cambia las tres listas por tuplas.
tests:
  - name: imprime el hallazgo del cuadro
    output: En (2, 5) hay un cuenco
  - name: el tumi también quedó guardado
    expect: 'hallazgos[(4, 1)] == "tumi"'
  - name: las claves son tuplas
    expect: all(type(clave) == tuple for clave in hallazgos)
```

```exercise
id: py6-escribe-inventario
type: write
title: El inventario por sala y vitrina
prompt: |
  Escribe `inventariar(piezas)`, que recibe una lista de tuplas `(codigo, sala, vitrina)` y devuelve un diccionario anidado: `inventario[sala][vitrina]` es la lista de códigos de esa vitrina, en el orden en que llegaron.

  Es el cuaderno de 1998 pasado en limpio. Usa `setdefault` dos veces: una para la sala (que empieza como `{}`) y otra para la vitrina (que empieza como `[]`).
visual:
  figure:
    input: { label: piezas, table: { head: ["código", "sala", "vitrina"], rows: [["T-114", "Huaca Larga", "V3"], ["C-020", "Templo", "V1"], ["T-115", "Huaca Larga", "V3"], ["O-007", "Huaca Larga", "V5"]] } }
    arrow: "setdefault(sala, {}).setdefault(vitrina, [])"
    output: { label: devuelve, cards: [{ title: "Huaca Larga", rows: [["V3", "[\"T-114\", \"T-115\"]"], ["V5", "[\"O-007\"]"]] }, { title: "Templo", rows: [["V1", "[\"C-020\"]"]] }] }
starter: |
  def inventariar(piezas):
      inventario = {}
      return inventario

  print(inventariar([("T-114", "Huaca Larga", "V3"), ("C-020", "Templo", "V1")]))
solution: |
  def inventariar(piezas):
      inventario = {}
      for codigo, sala, vitrina in piezas:
          inventario.setdefault(sala, {}).setdefault(vitrina, []).append(codigo)
      return inventario

  print(inventariar([("T-114", "Huaca Larga", "V3"), ("C-020", "Templo", "V1")]))
hints:
  - "`for codigo, sala, vitrina in piezas:` desempaca cada tupla."
  - "`inventario.setdefault(sala, {})` devuelve el diccionario de esa sala; sobre él, `.setdefault(vitrina, [])` devuelve la lista de la vitrina, lista para `.append(codigo)`."
tests:
  - name: el ejemplo del dibujo
    run: 'inventariar([("T-114", "Huaca Larga", "V3"), ("C-020", "Templo", "V1"), ("T-115", "Huaca Larga", "V3"), ("O-007", "Huaca Larga", "V5")])'
    equals: { "Huaca Larga": { V3: ["T-114", "T-115"], V5: ["O-007"] }, Templo: { V1: ["C-020"] } }
  - name: una sola pieza
    run: 'inventariar([("P-001", "Las Balsas", "V2")])'
    equals: { "Las Balsas": { V2: ["P-001"] } }
  - name: sin piezas
    run: inventariar([])
    equals: {}
  - name: las salas salen en el orden en que aparecen
    expect: 'list(inventariar([("A", "Templo", "V1"), ("B", "Huaca 1", "V1")])) == ["Templo", "Huaca 1"]'
```

## El caso

```exercise
id: py6-caso-pieza
type: case
title: La pieza duplicada
prompt: |
  **Para cada sala, cuenta cuántas piezas escaneadas no son de esa sala según el catálogo, y compáralo con lo que reportó su robot. Después encuentra la pieza que aparece en dos salas a la vez.**

  Anoche, los tres robots de vigilancia del museo escanearon sus salas. El total salió con una pieza de más, y eso no puede ser: una de las dos es una réplica que alguien dejó para llevarse la original. Cada robot reportó cuántas piezas **ajenas** (de otra sala) tenía la suya. Ojo: un escáner a veces lee la misma pieza dos veces, y eso no es ninguna pieza duplicada.

  Imprime una línea por robot que empiece con su nombre, por ejemplo `print("Ñusta:", len(ajenas))`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py6-caso-pieza
    task: "Piezas ajenas = lo que escaneó el robot menos las piezas que el catálogo pone en su sala."
    cards:
      - name: Ñusta
        kind: robot
        role: Vigila la sala Huaca Larga
        culprit: true
        rows: [["Escaneó", "7 lecturas"], ["Dijo", "\"solo la TP-03, que vino a restauración\""], ["Reportó ajenas", "1"]]
        clue: { find: "Ñusta", says: 1, saysLabel: Reportó }
      - name: Pacha
        kind: robot
        role: Vigila la sala Templo de la Piedra
        rows: [["Escaneó", "4 lecturas"], ["Dijo", "\"la HL-04, para la vitrina temporal\""], ["Reportó ajenas", "1"]]
        clue: { find: "Pacha", says: 1, saysLabel: Reportó }
      - name: Yunga
        kind: robot
        role: Vigila la sala Las Balsas
        rows: [["Escaneó", "5 lecturas"], ["Dijo", "\"todo en su sitio\""], ["Reportó ajenas", "0"]]
        clue: { find: "Yunga", says: 0, saysLabel: Reportó }
      - name: El catálogo
        kind: note
        role: El cuaderno de Rosa
        rows: [["HL-01 a HL-05", "Huaca Larga"], ["TP-01 a TP-04", "Templo de la Piedra"], ["HB-01 a HB-04", "Las Balsas"]]
starter: |
  # Dónde va cada pieza, según el catálogo
  catalogo = {
      "HL-01": "Huaca Larga", "HL-02": "Huaca Larga", "HL-03": "Huaca Larga",
      "HL-04": "Huaca Larga", "HL-05": "Huaca Larga",
      "TP-01": "Templo de la Piedra", "TP-02": "Templo de la Piedra",
      "TP-03": "Templo de la Piedra", "TP-04": "Templo de la Piedra",
      "HB-01": "Las Balsas", "HB-02": "Las Balsas", "HB-03": "Las Balsas", "HB-04": "Las Balsas",
  }

  # Lo que escaneó anoche el robot de cada sala, lectura por lectura
  escaneos = {
      "Huaca Larga": ["HL-01", "HL-02", "HL-03", "HL-05", "HL-02", "TP-03", "HB-02"],
      "Templo de la Piedra": ["TP-01", "TP-02", "TP-04", "HL-04"],
      "Las Balsas": ["HB-03", "HB-01", "HB-02", "HB-04", "HB-03"],
  }
  vigilantes = {"Huaca Larga": "Ñusta", "Templo de la Piedra": "Pacha", "Las Balsas": "Yunga"}

  # TODO: para cada sala, arma el set de sus piezas según el catálogo,
  # réstaselo al set de lo escaneado e imprime una línea por robot:
  # print("Ñusta:", len(ajenas))
  # Luego busca la pieza que aparece en dos salas.
solution: |
  catalogo = {
      "HL-01": "Huaca Larga", "HL-02": "Huaca Larga", "HL-03": "Huaca Larga",
      "HL-04": "Huaca Larga", "HL-05": "Huaca Larga",
      "TP-01": "Templo de la Piedra", "TP-02": "Templo de la Piedra",
      "TP-03": "Templo de la Piedra", "TP-04": "Templo de la Piedra",
      "HB-01": "Las Balsas", "HB-02": "Las Balsas", "HB-03": "Las Balsas", "HB-04": "Las Balsas",
  }
  escaneos = {
      "Huaca Larga": ["HL-01", "HL-02", "HL-03", "HL-05", "HL-02", "TP-03", "HB-02"],
      "Templo de la Piedra": ["TP-01", "TP-02", "TP-04", "HL-04"],
      "Las Balsas": ["HB-03", "HB-01", "HB-02", "HB-04", "HB-03"],
  }
  vigilantes = {"Huaca Larga": "Ñusta", "Templo de la Piedra": "Pacha", "Las Balsas": "Yunga"}

  for sala, lecturas in escaneos.items():
      propias = set()
      for codigo, casa in catalogo.items():
          if casa == sala:
              propias.add(codigo)
      ajenas = set(lecturas) - propias
      print(f"{vigilantes[sala]}: {sorted(ajenas)} {len(ajenas)}")

  vistas = set()
  for sala, lecturas in escaneos.items():
      en_dos_salas = vistas & set(lecturas)
      if en_dos_salas:
          print("En dos salas a la vez:", sorted(en_dos_salas))
      vistas |= set(lecturas)
answer: HB-02
answerLabel: ¿Qué pieza aparece en dos salas a la vez?
reveal: |
  La HB-02, un cuenco de Las Balsas que también aparece en la Huaca Larga: `set(escaneos["Huaca Larga"]) & set(escaneos["Las Balsas"])` es `{"HB-02"}`. Ñusta tenía **dos** piezas ajenas y reportó una; la que calló era la réplica. La HL-02 también sale dos veces, pero en la misma lista: el escáner la leyó dos veces, y el set se lo quita de encima. La TP-03 y la HL-04 solo están cambiadas de sala, cada una en un solo lugar.
hints:
  - "Las piezas de una sala: recorre `catalogo.items()` y agrega a un `set()` los códigos cuya sala coincide. Las ajenas son `set(lecturas) - propias`."
  - "Para la duplicada, junta en un set `vistas` lo de las salas anteriores; `vistas & set(lecturas)` dice qué se repite en la sala actual."
```

## El juez

Desde la sesión 4, los jueces prueban **funciones**: escribes la función que pide el enunciado y el juez la llama con cada caso y compara lo que devuelve. Una tupla cuenta como lista.

```exercise
id: py6-juez-repetido
type: judge
mode: function
function: primer_repetido
title: El boleto que entró dos veces
prompt: |
  **Escribe `primer_repetido(entradas)`, que devuelve el primer nombre que pasa el torniquete por segunda vez, como `(nombre, primera, segunda)`, o una tupla vacía `()` si nadie repitió.**

  Rosa sospecha que alguien está reusando su boleto. El torniquete anota el nombre de cada visitante en el orden en que entra. Recórrelo y detente en la primera entrada de alguien que ya había pasado: devuelve su nombre, la posición de su primera entrada y la de esta segunda, contando **desde 1**.

  "Primero" quiere decir la segunda entrada que ocurre antes: en `Rosa, Teófilo, Nilda, Teófilo, Rosa`, Rosa llegó antes que nadie, pero Teófilo repite primero.

  **Restricciones:** 0 ≤ `len(entradas)` ≤ 40.
starter: |
  def primer_repetido(entradas):
      return ()
solution: |
  def primer_repetido(entradas):
      primera_vez = {}
      posicion = 0
      for nombre in entradas:
          posicion += 1
          if nombre in primera_vez:
              return (nombre, primera_vez[nombre], posicion)
          primera_vez[nombre] = posicion
      return ()
hints:
  - "Guarda en un diccionario la posición donde viste a cada nombre por primera vez: `primera_vez[nombre] = posicion`."
  - "Antes de guardar, pregunta `nombre in primera_vez`: si ya estaba, es la respuesta y puedes hacer `return` ahí mismo."
visual:
  figure:
    title: El ejemplo 1, entrada por entrada
    panes:
      - { label: entradas, cells: ["Rosa", "Teófilo", "Nilda", "Teófilo", "Rosa"], highlight: [1, 3] }
      - { label: "primera_vez al llegar a la 4.ª entrada", cards: [{ title: primera_vez, rows: [["Rosa", "1"], ["Teófilo", "2"], ["Nilda", "3"]] }] }
      - { label: devuelve, value: "(\"Teófilo\", 2, 4)" }
    caption: "En la 4.ª entrada, `\"Teófilo\" in primera_vez` ya es `True`: ahí se termina, aunque Rosa también vaya a repetir."
samples:
  - args: [["Rosa", "Teófilo", "Nilda", "Teófilo", "Rosa"]]
    returns: ["Teófilo", 2, 4]
    note: El dibujo de arriba.
  - args: [["Doris", "Wilmer", "Flor"]]
    returns: []
    note: Nadie repitió.
edge:
  - args: [[]]
    tag: con el torniquete vacío
  - args: [["Abel"]]
    tag: con una sola entrada
  - args: [["Zoila", "Zoila"]]
    tag: con dos entradas seguidas de la misma persona
  - args: [["Rosa", "Nilda", "Elmer", "Flor", "Rosa"]]
    tag: cuando la repetición es la última entrada
  - args: [["Elmer", "Flor", "Flor", "Elmer", "Elmer"]]
    tag: cuando una persona repite muchas veces
random:
  count: 40
  seed: 61
  generate: |
    nombres = ["Eulogio", "Rosa", "Nilda", "Teófilo", "Yesenia", "Wilmer", "Doris", "Segundo",
               "Maritza", "Hipólito", "Flor", "Cayetano", "Zoila", "Abel", "Elmer"]
    if rng.int(0, 4) == 0:
        return [rng.shuffle(nombres)[:rng.int(0, 15)]]
    k = rng.int(2, 15)
    n = rng.int(1, 40)
    return [[rng.pick(nombres[:k]) for _ in range(n)]]
wrong:
  - |
    def primer_repetido(entradas):
        primera_vez = {}
        for i in range(len(entradas)):
            nombre = entradas[i]
            if nombre in primera_vez:
                return (nombre, primera_vez[nombre], i)
            primera_vez[nombre] = i
        return ()
  - |
    def primer_repetido(entradas):
        for i in range(len(entradas)):
            for j in range(i + 1, len(entradas)):
                if entradas[i] == entradas[j]:
                    return (entradas[i], i + 1, j + 1)
        return ()
  - |
    def primer_repetido(entradas):
        primera_vez = {}
        respuesta = ()
        posicion = 0
        for nombre in entradas:
            posicion += 1
            if nombre in primera_vez:
                respuesta = (nombre, primera_vez[nombre], posicion)
            else:
                primera_vez[nombre] = posicion
        return respuesta
```

```exercise
id: py6-juez-etiquetas
type: judge
mode: function
function: agrupar_etiquetas
title: La impresora de etiquetas revuelta
prompt: |
  **Escribe `agrupar_etiquetas(etiquetas)`, que junta las etiquetas hechas con exactamente las mismas letras y devuelve la lista de grupos.**

  La impresora vieja del depósito imprime las letras de cada etiqueta en cualquier orden: `TUMI` puede salir `MITU` o `IMUT`. Para saber qué cajas son de la misma pieza, Rosa necesita juntar las etiquetas que usan **las mismas letras, la misma cantidad de veces** (`ANA` y `NAA` van juntas; `NNA` no).

  - Cada grupo es una lista con sus etiquetas en el orden en que aparecen, repetidas incluidas.
  - Los grupos van en el orden en que aparece su primera etiqueta.

  Una pista para la clave del diccionario: dos etiquetas van juntas si `sorted(etiqueta)` da lo mismo. Pero `sorted` devuelve una lista, y una lista no puede ser clave.

  **Restricciones:** 0 ≤ `len(etiquetas)` ≤ 25 · cada etiqueta tiene de 1 a 6 letras mayúsculas.
starter: |
  def agrupar_etiquetas(etiquetas):
      return []
solution: |
  def agrupar_etiquetas(etiquetas):
      grupos = {}
      for etiqueta in etiquetas:
          clave = tuple(sorted(etiqueta))
          grupos.setdefault(clave, []).append(etiqueta)
      return list(grupos.values())
hints:
  - "`tuple(sorted(etiqueta))` es igual para `\"TUMI\"` y `\"MITU\"`: `('I', 'M', 'T', 'U')`. Úsala como clave de un diccionario."
  - "`grupos.setdefault(clave, []).append(etiqueta)` agrupa, y `list(grupos.values())` ya sale en el orden de la primera aparición."
visual:
  figure:
    title: El ejemplo 1, agrupado
    input: { label: etiquetas, cells: ["TUMI", "MITU", "VASO", "IMUT", "SOVA"] }
    arrow: "clave = tuple(sorted(etiqueta))"
    output: { label: grupos, table: { head: ["clave", "grupo"], rows: [["I M T U", "TUMI, MITU, IMUT"], ["A O S V", "VASO, SOVA"]] } }
    steps:
      - Las cinco etiquetas dan solo dos claves distintas.
      - El grupo de TUMI va primero porque TUMI apareció antes que VASO.
samples:
  - args: [["TUMI", "MITU", "VASO", "IMUT", "SOVA"]]
    returns: [["TUMI", "MITU", "IMUT"], ["VASO", "SOVA"]]
    note: El dibujo de arriba.
  - args: [["ANA", "NAA", "NNA"]]
    returns: [["ANA", "NAA"], ["NNA"]]
    note: NNA tiene las mismas letras distintas, pero no la misma cantidad de cada una.
edge:
  - args: [[]]
    tag: sin etiquetas
  - args: [["OLLA"]]
    tag: con una sola etiqueta
  - args: [["OLLA", "OLLA"]]
    tag: con la misma etiqueta dos veces
  - args: [["AB", "BA", "AAB", "ABB", "BAB"]]
    tag: con letras repetidas en distinta cantidad
  - args: [["Z", "Y", "Z", "X"]]
    tag: con etiquetas de una letra
  - args: [["VASO", "COBRE", "TUMI"]]
    tag: cuando ningún par va junto
random:
  count: 40
  seed: 62
  generate: |
    bases = ["TUMI", "VASO", "OLLA", "CUENCO", "COBRE", "PLATO", "CONCHA", "ARETE", "MANTO", "AMA", "LORO"]
    k = rng.int(1, len(bases))
    etiquetas = []
    for _ in range(rng.int(0, 25)):
        letras = rng.shuffle(rng.pick(bases[:k]))
        if rng.int(0, 3) == 0:
            letras[rng.int(0, len(letras) - 1)] = rng.pick(letras)
        etiquetas.append("".join(letras))
    return [etiquetas]
wrong:
  - |
    def agrupar_etiquetas(etiquetas):
        grupos = {}
        for etiqueta in etiquetas:
            clave = frozenset(etiqueta)
            grupos.setdefault(clave, []).append(etiqueta)
        return list(grupos.values())
  - |
    def agrupar_etiquetas(etiquetas):
        grupos = {}
        for etiqueta in etiquetas:
            clave = "".join(sorted(etiqueta))
            grupos.setdefault(clave, []).append(etiqueta)
        return sorted(grupos.values())
  - |
    def agrupar_etiquetas(etiquetas):
        grupos = {}
        for etiqueta in etiquetas:
            clave = sorted(etiqueta)
            grupos.setdefault(clave, []).append(etiqueta)
        return list(grupos.values())
```

## Misión final

```exercise
id: py6-mision-ronda
type: mission
title: La ronda por las salas
prompt: |
  **Recorre las salas en el orden del diccionario `salas`: en cada puerta cierra si está abierta, haz sonar la alarma si hay movimiento, y anota en `informe` cómo estaba cada sala.**

  Rosa le dejó a Quilla el plano del pasillo como diccionario: `salas["Sala Huaca Larga"]` es la **columna** donde está la puerta de esa sala, y las salas están en el diccionario en el mismo orden que en el pasillo. Quilla empieza en la columna 1 mirando al este, y `robot.posicion.x` le dice en qué columna está, así que para llegar a una puerta avanza `columna - robot.posicion.x`.

  En las salas de la lista `mantenimiento` hay restauradores trabajando de noche: el movimiento es de ellos. Ahí Quilla **no usa el sensor ni la alarma**; solo anota la sala como `"mantenimiento"`. En las demás, parado sobre la puerta:

  - `robot.sensor()` devuelve un diccionario como `{"puerta": "abierta", "movimiento": True}`;
  - `robot.cerrar_puerta()` la cierra y `robot.alarma()` hace sonar la sirena;
  - en `informe[nombre]` anota `"intruso"` si hubo movimiento y `"en calma"` si no.

  El plano, las salas y el mantenimiento cambian en cada prueba.
visual:
  figure:
    title: El plano de la primera noche
    panes:
      - { label: salas, cards: [{ title: salas, rows: [["\"Sala Huaca Larga\"", "3"], ["\"Sala Templo de la Piedra\"", "6"], ["\"Sala Las Balsas\"", "8"], ["\"Sala Huaca 1\"", "12"]] }] }
      - { label: mantenimiento, cells: ["Sala Las Balsas"] }
      - { label: "informe al terminar", cards: [{ title: informe, rows: [["Sala Huaca Larga", "\"intruso\""], ["Sala Templo de la Piedra", "\"en calma\""], ["Sala Las Balsas", "\"mantenimiento\""], ["Sala Huaca 1", "\"en calma\""]] }] }
starter: |
  # salas: {"Sala Huaca Larga": 3, ...}   nombre de la sala → columna de su puerta
  # mantenimiento: ["Sala Las Balsas"]    salas que no se tocan esta noche
  en_mantenimiento = set(mantenimiento)
  informe = {}

  # TODO: recorre salas.items() en orden
solution: |
  en_mantenimiento = set(mantenimiento)
  informe = {}

  for nombre, columna in salas.items():
      robot.avanzar(columna - robot.posicion.x)
      if nombre in en_mantenimiento:
          informe[nombre] = "mantenimiento"
          continue
      lectura = robot.sensor()
      if lectura["puerta"] == "abierta":
          robot.cerrar_puerta()
      if lectura["movimiento"]:
          robot.alarma()
          informe[nombre] = "intruso"
      else:
          informe[nombre] = "en calma"
hints:
  - "`for nombre, columna in salas.items():` te da cada sala en el orden del pasillo; lo primero en cada vuelta es `robot.avanzar(columna - robot.posicion.x)`."
  - "Si `nombre in en_mantenimiento`, anota y pasa a la siguiente con `continue`. Si no, lee el sensor una vez y guárdalo: `lectura[\"puerta\"]` y `lectura[\"movimiento\"]`."
world:
  theme: museo
  level: 2
  dir: E
  map: |
    ##############
    #R...........#
    ###P##O#P###O#
    ###m##.#m###.#
    ##############
globals:
  salas: { "Sala Huaca Larga": 3, "Sala Templo de la Piedra": 6, "Sala Las Balsas": 8, "Sala Huaca 1": 12 }
  mantenimiento: ["Sala Las Balsas"]
scenarios:
  - tests:
      - name: el informe de la primera noche
        expect: 'informe == {"Sala Huaca Larga": "intruso", "Sala Templo de la Piedra": "en calma", "Sala Las Balsas": "mantenimiento", "Sala Huaca 1": "en calma"}'
  - map: |
      ##############
      #R...........#
      ##O###P#O##P##
      ##.###m#m##.##
      ##############
    globals:
      salas: { "Sala Huaca 1": 2, "Sala del Tumi": 6, "Sala Las Balsas": 8, "Sala Huaca Larga": 11 }
      mantenimiento: ["Sala del Tumi"]
    tests:
      - name: el informe de la segunda noche
        expect: 'informe == {"Sala Huaca 1": "en calma", "Sala del Tumi": "mantenimiento", "Sala Las Balsas": "intruso", "Sala Huaca Larga": "en calma"}'
  - map: |
      ###########
      #R........#
      ####O##P#O#
      ####m##m#.#
      ###########
    globals:
      salas: { "Sala Huaca Larga": 4, "Sala Las Balsas": 7, "Sala Huaca 1": 9 }
      mantenimiento: []
    tests:
      - name: el informe de una noche sin mantenimiento
        expect: 'informe == {"Sala Huaca Larga": "intruso", "Sala Las Balsas": "intruso", "Sala Huaca 1": "en calma"}'
tests:
  - name: todas las puertas quedan cerradas
    state: w.open_doors == 0
    msg: Quedó al menos una puerta abierta.
  - name: la alarma suena solo donde hay intrusos
    state: 'w.alarms == sorted(k for k in w.motion_doors if k not in [str(g["salas"][n]) + ",2" for n in g["mantenimiento"]])'
    msg: La alarma va donde hay movimiento, salvo en las salas en mantenimiento.
  - name: el informe tiene las salas en el orden del pasillo
    expect: list(informe) == list(salas)
    msg: Anota todas las salas en informe, también las de mantenimiento, en el orden de salas.
  - name: recorre el diccionario con items()
    source: '\bsalas\.items\(\)'
  - name: sin chocar
    state: not w.crashed
```

## Reto experto

```exercise
id: py6-reto-renombres
type: challenge
title: Los códigos que cambiaron de nombre
visual:
  figure:
    title: Seguir cada código hasta el final
    input: { label: renombres, cards: [{ title: renombres, rows: [["T-1", "T-7"], ["T-7", "TC-3"], ["X-1", "X-2"], ["X-2", "X-1"]] }] }
    arrow: sigue la cadena; si da la vuelta, None
    output: { label: devuelve, cards: [{ title: finales, rows: [["T-1", "TC-3"], ["T-7", "TC-3"], ["X-1", "None"], ["X-2", "None"]] }] }
prompt: |
  **Escribe `resolver(renombres)`, que devuelve un diccionario con el código final de cada código viejo.** Para quien ya programa.

  Cada vez que el museo reorganizó el depósito, renumeró piezas: `renombres["T-1"] == "T-7"` quiere decir que la T-1 pasó a llamarse T-7, y quizá la T-7 después pasó a ser TC-3. El código final es el primero de la cadena que ya no se renombró. Si una cadena da la vuelta y vuelve a un código ya visto (un error de algún practicante), el final es `None`. Devuelve una clave por cada clave de `renombres`.
starter: |
  def resolver(renombres):
      return {}

  print(resolver({"T-1": "T-7", "T-7": "TC-3"}))
solution: |
  def resolver(renombres):
      finales = {}
      for codigo in renombres:
          vistos = {codigo}
          actual = renombres[codigo]
          while actual in renombres and actual not in vistos:
              vistos.add(actual)
              actual = renombres[actual]
          finales[codigo] = None if actual in renombres else actual
      return finales

  print(resolver({"T-1": "T-7", "T-7": "TC-3"}))
hints:
  - Sigue la cadena con un `while actual in renombres`, y lleva un set de los códigos ya vistos para no dar vueltas para siempre.
  - Si el bucle se detuvo porque `actual` ya estaba en `vistos`, la cadena es un círculo.
tests:
  - name: una cadena de dos pasos
    run: 'resolver({"T-1": "T-7", "T-7": "TC-3"})'
    equals: { "T-1": TC-3, "T-7": TC-3 }
  - name: un círculo
    run: 'resolver({"X-1": "X-2", "X-2": "X-1", "B-2": "B-9"})'
    equals: { "X-1": null, "X-2": null, "B-2": B-9 }
  - name: una cadena que cae en un círculo
    run: 'resolver({"Y": "X-1", "X-1": "X-2", "X-2": "X-1"})'
    equals: { "Y": null, "X-1": null, "X-2": null }
  - name: un código renombrado a sí mismo
    run: 'resolver({"Z": "Z"})'
    equals: { "Z": null }
  - name: sin renombres
    run: resolver({})
    equals: {}
```
