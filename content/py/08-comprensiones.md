# Sesión 8 — Comprensiones y funciones de colección

## El encargo

Mercado de San Pedro, Cusco, siete de la mañana. Al fondo, pasando las juguerías y los puestos de pan chuta, está el comedor de **doña Paulina Quispe**: una cocina de leña, cuatro mesas largas y una pizarra con el menú del día. A las ocho ya hay cargadores pidiendo caldo de gallina, y a la una no queda ni una trucha frita.

Doña Paulina le pidió a Maru un ayudante que no se canse subiendo y bajando de la cocina, y Maru mandó a Quilla en el bus de Cruz del Sur con el **brazo con bandeja** bien ajustado. Pero en San Pedro lo difícil no es cargar platos: es **ordenar el día**. Hay que sacar de la lista de comandas las que se anularon, juntar las ventas por plato, ver cuál es el más picante, numerar el reporte. Todo eso Quilla ya lo sabe hacer con un `for` y un `append`… en seis líneas. Hoy aprende a decirlo en **una**.

```escena
theme: cocina
level: 4
dir: E
caption: El comedor de doña Paulina. Quilla prepara en la cocina (K) y sirve la mesa 1, que está a tres pasos.
map: |
  ###########
  #K........#
  ##2#1##3###
  ###########
program: |
  robot.preparar("caldo de gallina")
  robot.avanzar(3)
  robot.servir()
  robot.girar_derecha()
  robot.girar_derecha()
  robot.avanzar(3)
  robot.girar_derecha()
  robot.girar_derecha()
  robot.decir("¡Caldo para la mesa 1!")
```

## Lo mínimo

Una **comprensión** arma una lista nueva en una línea: *qué* quieres de cada elemento, *de dónde* sale y, si hace falta, *cuáles* entran. Se lee casi como una frase: «el precio con IGV, por cada precio de la carta, si el precio pasa de 10».

```py run
precios = [14, 25, 8, 18]
caros = [precio for precio in precios if precio > 10]
con_igv = [round(precio * 1.18, 2) for precio in caros]
print(caros)
print(con_igv)
```

Una comprensión hace lo mismo que el `for` con `append` de siempre. Mira las dos, paso a paso: el bucle llena `caros` de a uno; la comprensión de la última línea llega a la misma lista.

```anima
title: El bucle de siempre y la comprensión, lado a lado
code: |
  precios = [14, 25, 8, 18]
  caros = []
  for precio in precios:
      if precio > 10:
          caros.append(precio)
  mismo = [precio for precio in precios if precio > 10]
  print(caros == mismo)
cells: { of: precios, at: precio }
notes:
  2: "El bucle empieza con una lista vacía."
  4: "El if decide si este precio entra."
  5: "Solo los que pasan el filtro se agregan."
  6: "La comprensión dice lo mismo en una línea: qué, de dónde y cuáles."
  7: "Las dos listas son iguales: [14, 25, 18]."
```

Con llaves se arman **diccionarios** (`{clave: valor for …}`) y **sets** (`{valor for …}`). Y con paréntesis, o directamente dentro de una función como `sum`, sale una **expresión generadora**: no arma ninguna lista, entrega los valores de a uno a quien los pide. Para sumar o contar es lo justo.

```py run
carta = {"caldo": 14, "adobo": 18, "trucha": 22}
con_descuento = {plato: precio - 2 for plato, precio in carta.items() if precio > 15}
letras = {plato[0] for plato in carta}
print(con_descuento, sorted(letras))
print(sum(precio for precio in carta.values()))
```

Para recorrer varias cosas a la vez hay dos ayudantes:

- **`enumerate(lista, start=1)`** te da el número y el valor juntos, sin `range(len(…))`.
- **`zip(a, b)`** recorre dos (o más) listas en paralelo, par por par. Se detiene en la más corta; con `strict=True` avisa con un error si no miden lo mismo.

```anima
title: enumerate y zip, mesa por mesa
code: |
  platos = ["caldo", "adobo", "trucha"]
  precios = [14, 18, 22]
  for n, (plato, precio) in enumerate(zip(platos, precios), start=1):
      linea = f"{n}. {plato}: {precio}"
      print(linea)
cells: { of: platos, at: plato }
notes:
  3: "zip junta (plato, precio); enumerate le pone delante el número, desde 1."
  4: "Cada vuelta trae los tres datos ya desempaquetados."
```

Para **ordenar, buscar el mayor o el menor** según algo que no es el valor mismo, `sorted`, `min` y `max` aceptan **`key=`**: una función que dice *por qué* comparar. Lo más corto es una **`lambda`**, una función sin nombre de una sola expresión. `reverse=True` invierte el orden. Y **`any`** y **`all`** responden si *alguno* o *todos* cumplen algo.

```py run
platos = [("adobo", 3), ("caldo", 1), ("rocoto relleno", 5), ("chiriuchu", 2)]
print(max(platos, key=lambda plato: plato[1]))
print(sorted(platos, key=lambda plato: plato[1], reverse=True)[:2])
print(any(picante > 4 for _, picante in platos), all(picante > 0 for _, picante in platos))
```

En código ajeno verás también **`map(funcion, lista)`** y **`filter(funcion, lista)`**. Hacen lo mismo que una comprensión, pero con una `lambda` dentro de otra, y devuelven un iterador, no una lista. Casi siempre la comprensión se lee mejor:

```py run
precios = [14, 25, 8, 18]
print(list(map(lambda p: p * 2, filter(lambda p: p > 10, precios))))
print([p * 2 for p in precios if p > 10])
```

> **Trampa común:** un generador, `map` o `filter` **se gasta**. Entregan sus valores una sola vez: si recorres el mismo `map` dos veces, la segunda sale vacía. Si vas a usar el resultado más de una vez, guárdalo en una lista (con una comprensión o con `list(…)`).

<!-- legacy: comprehensions -->

<!-- legacy: enumerate -->

<!-- legacy: zip -->

<!-- mdn: comprehensions enumerate zip lambda -->

## Práctica

```exercise
id: py8-predice-gastado
type: predict
title: La lista que se vació sola
prompt: |
  Wilber, el mozo, quiere ver dos veces los precios dobles de la promoción. ¿Qué imprime?
code: |
  precios = [12, 8, 15]
  dobles = map(lambda precio: precio * 2, precios)
  print(list(dobles))
  print(list(dobles))
options:
  - "[24, 16, 30]\n[]"
  - "[24, 16, 30]\n[24, 16, 30]"
  - "[24, 16, 30]\n[48, 32, 60]"
  - "<map object>\n[24, 16, 30]"
answer: "[24, 16, 30]\n[]"
explain: |
  `map` no arma una lista: entrega los valores de a uno, **una sola vez**. El primer `list(dobles)` se los lleva todos; el segundo encuentra el `map` ya gastado y arma una lista vacía. Con `dobles = [precio * 2 for precio in precios]` las dos líneas imprimirían lo mismo.
```

```exercise
id: py8-predice-cremallera
type: predict
title: El plato que se quedó sin mesa
prompt: |
  Yaneth junta las mesas con sus platos usando `zip`, pero anotó un plato de más. ¿Qué imprime?
code: |
  mesas = [3, 1, 4]
  platos = ["adobo", "caldo", "trucha", "chiriuchu"]
  pedido = dict(zip(mesas, platos))
  print(pedido)
  print(len(pedido), pedido[1])
options:
  - "{3: 'adobo', 1: 'caldo', 4: 'trucha'}\n3 caldo"
  - "{3: 'adobo', 1: 'caldo', 4: 'trucha', None: 'chiriuchu'}\n4 caldo"
  - "{3: 'adobo', 1: 'caldo', 4: 'trucha'}\n3 adobo"
  - "ValueError: las listas no miden lo mismo"
answer: "{3: 'adobo', 1: 'caldo', 4: 'trucha'}\n3 caldo"
explain: |
  `zip` se detiene en la lista más corta, sin avisar: el chiriuchu se queda afuera. `dict(...)` convierte los pares en un diccionario, y `pedido[1]` busca la **clave** 1 (la mesa), no la posición: es el caldo. Con `zip(mesas, platos, strict=True)` sí saltaría un `ValueError`.
```

```exercise
id: py8-predice-todos
type: predict
title: ¿Ya están todas las ollas?
prompt: |
  Doña Paulina pregunta si las ollas están listas. ¿Qué imprime?
code: |
  ollas = [("caldo", True), ("adobo", False), ("chiriuchu", True)]
  print(all(lista for _, lista in ollas))
  print(any(lista for _, lista in ollas))
  print(all(lista for _, lista in []))
options:
  - "False\nTrue\nTrue"
  - "False\nTrue\nFalse"
  - "True\nTrue\nTrue"
  - "False\nFalse\nFalse"
answer: "False\nTrue\nTrue"
explain: |
  `all` pide que **todas** cumplan: el adobo no está listo, así que `False`. `any` pide que **alguna** cumpla: el caldo basta, `True`. Y `all` de nada es `True`: no hay ninguna olla que lo contradiga. Si eso no es lo que quieres, pregunta antes si la lista está vacía.
```

```exercise
id: py8-completa-carta
type: complete
title: La pizarra del menú
prompt: |
  Doña Paulina dicta su menú en dos listas. Completa los `___` para armar:

  - `carta`: un **diccionario** `plato → precio` con `zip`.
  - `baratos`: una **lista** con los platos de menos de 15 soles, en el orden de la carta.
  - `iniciales`: un **set** con la primera letra de cada plato.
  - `por_precio`: los platos ordenados **del más caro al más barato**.
starter: |
  platos = ["caldo de gallina", "adobo", "trucha frita", "sopa de quinua", "chicha de jora"]
  precios = [14, 18, 22, 8, 5]

  carta = {plato: precio for plato, precio in ___(platos, precios)}
  baratos = [plato for plato, precio in carta.items() ___ precio < 15]
  iniciales = ___plato[0] for plato in platos___
  por_precio = sorted(platos, key=lambda plato: carta[plato], ___=True)

  print(carta)
  print(baratos, sorted(iniciales))
  print(por_precio)
solution: |
  platos = ["caldo de gallina", "adobo", "trucha frita", "sopa de quinua", "chicha de jora"]
  precios = [14, 18, 22, 8, 5]

  carta = {plato: precio for plato, precio in zip(platos, precios)}
  baratos = [plato for plato, precio in carta.items() if precio < 15]
  iniciales = {plato[0] for plato in platos}
  por_precio = sorted(platos, key=lambda plato: carta[plato], reverse=True)

  print(carta)
  print(baratos, sorted(iniciales))
  print(por_precio)
hints:
  - "Las llaves sin `:` arman un set: `{plato[0] for plato in platos}`."
  - "El filtro de una comprensión va al final, con `if`. Para invertir `sorted`, `reverse=True`."
tests:
  - name: carta junta cada plato con su precio
    expect: 'carta == {"caldo de gallina": 14, "adobo": 18, "trucha frita": 22, "sopa de quinua": 8, "chicha de jora": 5}'
  - name: baratos tiene los de menos de 15
    expect: 'baratos == ["caldo de gallina", "sopa de quinua", "chicha de jora"]'
  - name: iniciales es un set
    expect: 'iniciales == {"c", "a", "t", "s"}'
    msg: Usa llaves sin dos puntos para que salga un set.
  - name: por_precio va del más caro al más barato
    expect: 'por_precio == ["trucha frita", "adobo", "caldo de gallina", "sopa de quinua", "chicha de jora"]'
```

```exercise
id: py8-arregla-picante
type: fix
title: El rocoto que no se dejó comparar
prompt: |
  Rocío quiere colgar en la pizarra el plato **más picante** y el **más barato**. El programa se cae: ejecútalo y lee el error.

  Arréglalo sin escribir bucles: `max` y `min` tienen que saber **por qué** comparar cada plato.
visual:
  figure:
    title: Lo que hay que encontrar
    panes:
      - label: platos
        table: { head: ["nombre", "picante", "precio"], rows: [["adobo", "3", "18"], ["rocoto relleno", "5", "16"], ["caldo de gallina", "1", "14"], ["chiriuchu", "2", "25"]] }
      - label: en la pizarra
        cards: [{ title: más picante, rows: [["plato", "rocoto relleno"]] }, { title: más barato, rows: [["plato", "caldo de gallina"]] }]
starter: |
  platos = [
      {"nombre": "adobo", "picante": 3, "precio": 18},
      {"nombre": "rocoto relleno", "picante": 5, "precio": 16},
      {"nombre": "caldo de gallina", "picante": 1, "precio": 14},
      {"nombre": "chiriuchu", "picante": 2, "precio": 25},
  ]

  mas_picante = max(platos)
  mas_barato = min(platos)
  print("Más picante:", mas_picante["nombre"])
  print("Más barato:", mas_barato["nombre"])
solution: |
  platos = [
      {"nombre": "adobo", "picante": 3, "precio": 18},
      {"nombre": "rocoto relleno", "picante": 5, "precio": 16},
      {"nombre": "caldo de gallina", "picante": 1, "precio": 14},
      {"nombre": "chiriuchu", "picante": 2, "precio": 25},
  ]

  mas_picante = max(platos, key=lambda plato: plato["picante"])
  mas_barato = min(platos, key=lambda plato: plato["precio"])
  print("Más picante:", mas_picante["nombre"])
  print("Más barato:", mas_barato["nombre"])
hints:
  - "Python no sabe si un diccionario es «mayor» que otro: por eso el `TypeError` con `>`."
  - "`max(platos, key=lambda plato: plato[\"picante\"])` compara solo el picante de cada uno, y devuelve el plato entero."
tests:
  - name: el más picante es el rocoto relleno
    expect: 'mas_picante["nombre"] == "rocoto relleno"'
  - name: el más barato es el caldo de gallina
    expect: 'mas_barato["nombre"] == "caldo de gallina"'
  - name: max y min usan key
    source: 'max\([^)]*key\s*=[\s\S]*min\([^)]*key\s*=|min\([^)]*key\s*=[\s\S]*max\([^)]*key\s*='
    msg: Dale a max y a min un key= que diga qué comparar.
  - name: sin bucles
    sourceNot: '\bfor\b|\bwhile\b'
  - name: la consola lo dice
    output: "Más picante: rocoto relleno\nMás barato: caldo de gallina"
```

```exercise
id: py8-escribe-despensa
type: write
title: La despensa de los lunes
prompt: |
  Los lunes Quilla revisa la despensa antes de que llegue la papa de Anta. Cada insumo es un diccionario con su `nombre`, los `kilos` que hay y el `minimo` que debe haber. Escribe tres funciones, **cada una en una línea de `return`**:

  - `kilos_totales(insumos)`: cuántos kilos hay en total. Usa una **expresión generadora** dentro de `sum`.
  - `por_comprar(insumos)`: la lista de nombres de los insumos que tienen **menos** kilos que su mínimo, en el mismo orden.
  - `falta_algo(insumos)`: `True` si **algún** insumo está por debajo de su mínimo.
visual:
  figure:
    title: La despensa de ejemplo
    input:
      label: insumos
      table: { head: ["nombre", "kilos", "minimo"], rows: [["papa", "12", "10"], ["maíz", "3", "5"], ["quinua", "4", "4"], ["cebolla", "1", "6"]] }
    arrow: tres preguntas
    output:
      label: devuelven
      cards: [{ title: respuestas, rows: [["kilos_totales", "20"], ["por_comprar", "['maíz', 'cebolla']"], ["falta_algo", "True"]] }]
starter: |
  def kilos_totales(insumos):
      pass


  def por_comprar(insumos):
      pass


  def falta_algo(insumos):
      pass


  # despensa ya existe: la del dibujo
  print(kilos_totales(despensa), por_comprar(despensa), falta_algo(despensa))
solution: |
  def kilos_totales(insumos):
      """Los kilos de toda la despensa."""
      return sum(insumo["kilos"] for insumo in insumos)


  def por_comprar(insumos):
      """Los nombres de lo que está por debajo de su mínimo."""
      return [insumo["nombre"] for insumo in insumos if insumo["kilos"] < insumo["minimo"]]


  def falta_algo(insumos):
      """True si algún insumo está por debajo de su mínimo."""
      return any(insumo["kilos"] < insumo["minimo"] for insumo in insumos)


  print(kilos_totales(despensa), por_comprar(despensa), falta_algo(despensa))
globals:
  despensa:
    - { nombre: papa, kilos: 12, minimo: 10 }
    - { nombre: maíz, kilos: 3, minimo: 5 }
    - { nombre: quinua, kilos: 4, minimo: 4 }
    - { nombre: cebolla, kilos: 1, minimo: 6 }
hints:
  - "`sum(insumo[\"kilos\"] for insumo in insumos)`: sin corchetes, no se arma ninguna lista."
  - "`falta_algo` es la misma pregunta que el filtro de `por_comprar`, dentro de `any(...)`."
tests:
  - name: kilos_totales de la despensa
    run: kilos_totales(despensa)
    equals: 20
  - name: kilos_totales de una despensa vacía
    run: kilos_totales([])
    equals: 0
  - name: por_comprar, en orden
    run: por_comprar(despensa)
    equals: ["maíz", "cebolla"]
  - name: justo en el mínimo no se compra
    run: 'por_comprar([{"nombre": "quinua", "kilos": 4, "minimo": 4}])'
    equals: []
  - name: falta_algo con la despensa del ejemplo
    run: falta_algo(despensa)
    equals: true
  - name: falta_algo cuando todo alcanza
    run: 'falta_algo([{"nombre": "papa", "kilos": 12, "minimo": 10}])'
    equals: false
  - name: usa any
    source: '\bany\s*\('
  - name: sum recibe una expresión generadora
    source: '\bsum\s*\(\s*\w[^\n]*\bfor\b'
    msg: "Escribe sum(... for insumo in insumos), sin armar una lista ni un bucle aparte."
  - name: sin append
    sourceNot: '\.append\s*\('
    msg: Con una comprensión no hace falta append.
```

## El caso

```exercise
id: py8-caso-menu
type: case
title: El menú que alguien infló
prompt: |
  **Calcula cuánto cobró de verdad cada mozo, sin contar las comandas anuladas, y compáralo con lo que reportó.**

  Al cierre del sábado, la caja de doña Paulina no cuadra: los mozos reportaron más plata de la que entró. Cada comanda es una lista `[mozo, plato, cantidad, anulada]`; las anuladas se devolvieron a la cocina y **no se cobran**. Los precios están en `carta`.

  Imprime una línea por mozo que empiece con su nombre y termine con su total: `print("Wilber:", total)`. El tablero la compara con lo que reportó. Un diccionario por comprensión con una suma generadora dentro lo hace todo de una vez.
visual:
  board:
    for: py8-caso-menu
    task: "Total de cada mozo = suma de precio × cantidad de sus comandas no anuladas. Compáralo con lo que reportó."
    cards:
      - name: Wilber
        kind: person
        rows: [["Comandas", "4 (1 anulada)"], ["Reportó", "S/ 66"]]
        clue: { find: "Wilber", says: 66 }
      - name: Yaneth
        kind: person
        rows: [["Comandas", "3"], ["Reportó", "S/ 85"]]
        clue: { find: "Yaneth", says: 85 }
      - name: Edwin
        kind: person
        culprit: true
        rows: [["Comandas", "4 (1 anulada)"], ["Reportó", "S/ 89"]]
        clue: { find: "Edwin", says: 89 }
      - name: Rocío
        kind: person
        rows: [["Comandas", "3 (1 anulada)"], ["Reportó", "S/ 68"]]
        clue: { find: "Rocío", says: 68 }
      - name: La pizarra
        kind: note
        role: El menú de doña Paulina
        rows: [["Caldo de gallina", "S/ 14"], ["Chiriuchu", "S/ 25"], ["Adobo", "S/ 18"], ["Rocoto relleno", "S/ 16"], ["Trucha frita", "S/ 22"], ["Sopa de quinua", "S/ 8"], ["Chicha de jora", "S/ 5"]]
    caption: "Si tres mozos no cuadran, revisa si estás cobrando las comandas anuladas."
globals:
  carta: { caldo de gallina: 14, chiriuchu: 25, adobo: 18, rocoto relleno: 16, trucha frita: 22, sopa de quinua: 8, chicha de jora: 5 }
  comandas:
    - [Wilber, caldo de gallina, 2, false]
    - [Yaneth, adobo, 3, false]
    - [Edwin, chiriuchu, 1, false]
    - [Rocío, trucha frita, 2, false]
    - [Wilber, chicha de jora, 4, false]
    - [Edwin, rocoto relleno, 2, true]
    - [Yaneth, sopa de quinua, 2, false]
    - [Rocío, chiriuchu, 1, true]
    - [Edwin, trucha frita, 1, false]
    - [Wilber, adobo, 1, false]
    - [Yaneth, chicha de jora, 3, false]
    - [Edwin, chicha de jora, 2, false]
    - [Rocío, sopa de quinua, 3, false]
    - [Wilber, rocoto relleno, 1, true]
starter: |
  # carta (plato → precio) y comandas ya existen. Cada comanda es
  # [mozo, plato, cantidad, anulada]:
  print(comandas[0])
  print(carta["caldo de gallina"])

  mozos = ["Wilber", "Yaneth", "Edwin", "Rocío"]

  # TODO: el total de cada mozo, sin las comandas anuladas
  # TODO: imprime una línea por mozo, por ejemplo: print("Wilber:", total)
solution: |
  mozos = ["Wilber", "Yaneth", "Edwin", "Rocío"]

  totales = {
      mozo: sum(carta[plato] * cantidad for quien, plato, cantidad, anulada in comandas if quien == mozo and not anulada)
      for mozo in mozos
  }
  for mozo, total in totales.items():
      print(f"{mozo}:", total)
answer: Edwin
answerLabel: ¿Qué mozo infló su total?
reveal: |
  Edwin. Cobró de verdad `25 + 22 + 2 × 5 = 57`, pero reportó 89: le sumó los dos rocotos rellenos (32 soles) que se devolvieron a la cocina. Wilber y Rocío también tienen comandas anuladas, pero no las contaron.
hints:
  - "Para un mozo: `sum(carta[plato] * cantidad for quien, plato, cantidad, anulada in comandas if quien == mozo and not anulada)`."
  - "Envuélvelo en `{mozo: … for mozo in mozos}` y recorre el diccionario con `.items()` para imprimir."
```

## El juez

Como desde la sesión 4, el juez **llama a tus funciones** y compara lo que devuelven. Las dos de hoy se pueden escribir con comprensiones, `sorted` con `key` y `zip`; el juez no lo exige, pero vas a escribir mucho menos.

```exercise
id: py8-juez-vendidos
type: judge
mode: function
function: mas_vendidos
title: Los más pedidos de San Pedro
prompt: |
  **Escribe `mas_vendidos(ventas, k)`, que devuelve los nombres de los `k` platos que más porciones vendieron.**

  Doña Paulina quiere colgar en la pizarra el «top» del día. `ventas` es la lista de lo que salió de la cocina, en el orden en que salió: pares `[plato, porciones]`. **Un mismo plato aparece muchas veces** (cada mesa lo pide aparte), así que primero hay que juntar sus porciones.

  - Ordena del que más porciones vendió al que menos.
  - Si dos platos empatan, va primero el que viene antes **en orden alfabético**.
  - Si hay menos de `k` platos distintos, devuelve todos.

  **Restricciones:** 0 a 25 ventas · porciones de 1 a 6 · 1 ≤ k ≤ 5.
visual:
  figure:
    title: El ejemplo 1, juntado y ordenado
    input:
      label: ventas
      table: { head: ["plato", "porciones"], rows: [["caldo", "2"], ["adobo", "3"], ["trucha", "1"], ["caldo", "1"], ["trucha", "2"], ["chiriuchu", "1"]] }
    arrow: "juntar → caldo 3, adobo 3, trucha 3, chiriuchu 1 → ordenar"
    output: { label: "mas_vendidos(ventas, 2)", cells: ["adobo", "caldo"] }
    steps:
      - "Caldo, adobo y trucha suman 3 porciones cada uno: empatan."
      - "En el empate manda el abecedario: adobo, caldo, trucha."
      - "Con k = 2 se quedan los dos primeros."
starter: |
  def mas_vendidos(ventas, k):
      pass
solution: |
  def mas_vendidos(ventas, k):
      """Los k platos con más porciones; los empates, por nombre."""
      porciones = {}
      for plato, cantidad in ventas:
          porciones[plato] = porciones.get(plato, 0) + cantidad
      ordenados = sorted(porciones, key=lambda plato: (-porciones[plato], plato))
      return ordenados[:k]
hints:
  - "Primero junta: un diccionario `plato → porciones` con `porciones.get(plato, 0) + cantidad`."
  - "`key=lambda plato: (-porciones[plato], plato)` ordena por porciones de mayor a menor (por el signo menos) y, si empatan, por nombre."
samples:
  - args: [[["caldo", 2], ["adobo", 3], ["trucha", 1], ["caldo", 1], ["trucha", 2], ["chiriuchu", 1]], 2]
    returns: ["adobo", "caldo"]
    note: El dibujo de arriba.
  - args: [[["chiriuchu", 4], ["adobo", 1], ["chiriuchu", 2]], 3]
    returns: ["chiriuchu", "adobo"]
    note: Solo hay dos platos distintos, así que se devuelven los dos.
  - args: [[["sopa de quinua", 5], ["lechón", 6]], 1]
    returns: ["lechón"]
edge:
  - args: [[], 3]
    tag: sin ventas
  - args: [[["emoliente", 2]], 5]
    tag: con un solo plato
  - args: [[["trucha", 2], ["caldo", 2], ["adobo", 2], ["lechón", 2]], 3]
    tag: con todos empatados
  - args: [[["adobo", 1], ["adobo", 1], ["adobo", 1], ["caldo", 2]], 1]
    tag: cuando un plato gana sumando porciones chicas
  - args: [[["trucha", 5], ["adobo", 6], ["adobo", 1], ["caldo", 3], ["caldo", 4]], 2]
    tag: con empates que solo aparecen al sumar
random:
  count: 40
  seed: 808
  generate: |
    nombres = ["adobo", "caldo de gallina", "chiriuchu", "trucha frita", "rocoto relleno",
               "sopa de quinua", "chicha de jora", "lechón", "emoliente", "cuy chactado"]
    surtido = rng.shuffle(nombres)[:rng.int(1, 10)]
    ventas = [[rng.pick(surtido), rng.int(1, 6)] for _ in range(rng.int(0, 25))]
    return [ventas, rng.int(1, 5)]
wrong:
  - |
    def mas_vendidos(ventas, k):
        porciones = {}
        for plato, cantidad in ventas:
            porciones[plato] = porciones.get(plato, 0) + cantidad
        return sorted(porciones, key=lambda plato: porciones[plato], reverse=True)[:k]
  - |
    def mas_vendidos(ventas, k):
        porciones = {}
        for plato, cantidad in ventas:
            porciones[plato] = porciones.get(plato, 0) + cantidad
        return sorted(porciones, key=lambda plato: (porciones[plato], plato), reverse=True)[:k]
  - |
    def mas_vendidos(ventas, k):
        porciones = {plato: cantidad for plato, cantidad in ventas}
        return sorted(porciones, key=lambda plato: (-porciones[plato], plato))[:k]
```

```exercise
id: py8-juez-reporte
type: judge
mode: function
function: reporte_del_dia
title: El reporte numerado
prompt: |
  **Escribe `reporte_del_dia(platos, precios, vendidos)`, que devuelve las líneas del reporte de la noche, y `total_del_dia(platos, precios, vendidos)`, que devuelve cuánto se vendió en soles.**

  Doña Paulina guarda tres listas del mismo largo: en la posición `i` están el nombre de un plato, su precio y cuántas porciones se vendieron. Para el reporte quiere **una línea por plato que vendió algo** (los de 0 porciones no van), numeradas desde 1 **sin saltarse números**, con este formato exacto:

  `1. chiriuchu: 3 x 25 = 75`

  Es decir: número, punto, espacio, plato, dos puntos, porciones, ` x `, precio, ` = ` y el subtotal. Las líneas van en el orden de las listas. El juez también prueba `total_del_dia` sola.

  **Restricciones:** 0 a 8 platos · precios de 3 a 30 · porciones de 0 a 5.
visual:
  figure:
    title: El ejemplo 1, como papel
    input:
      label: tres listas
      table: { head: ["platos", "precios", "vendidos"], rows: [["chiriuchu", "25", "3"], ["adobo", "18", "0"], ["trucha frita", "22", "2"]] }
    arrow: "zip las junta · el adobo no vendió · enumerate numera desde 1"
    output: { label: devuelve, text: "1. chiriuchu: 3 x 25 = 75\n2. trucha frita: 2 x 22 = 44" }
    steps:
      - "El adobo no vendió nada: no tiene línea."
      - "La trucha es la **2**, no la 3: se numeran solo las líneas que quedan."
      - "`total_del_dia` de estas listas es 75 + 44 = 119."
starter: |
  def reporte_del_dia(platos, precios, vendidos):
      pass


  def total_del_dia(platos, precios, vendidos):
      pass
solution: |
  def reporte_del_dia(platos, precios, vendidos):
      """Una línea numerada por cada plato que vendió algo."""
      con_venta = [(plato, precio, cantidad) for plato, precio, cantidad in zip(platos, precios, vendidos) if cantidad > 0]
      return [
          f"{n}. {plato}: {cantidad} x {precio} = {cantidad * precio}"
          for n, (plato, precio, cantidad) in enumerate(con_venta, start=1)
      ]


  def total_del_dia(platos, precios, vendidos):
      """Lo vendido en soles."""
      return sum(precio * cantidad for precio, cantidad in zip(precios, vendidos))
hints:
  - "Primero filtra con una comprensión sobre `zip(platos, precios, vendidos)`; después numera con `enumerate(…, start=1)`. Al revés, los números se saltan."
  - "`total_del_dia` es una suma generadora sobre `zip(precios, vendidos)`."
samples:
  - args: [["chiriuchu", "adobo", "trucha frita"], [25, 18, 22], [3, 0, 2]]
    returns: ["1. chiriuchu: 3 x 25 = 75", "2. trucha frita: 2 x 22 = 44"]
    note: El dibujo de arriba.
  - args: [["caldo de gallina", "emoliente"], [14, 3], [1, 4]]
    returns: ["1. caldo de gallina: 1 x 14 = 14", "2. emoliente: 4 x 3 = 12"]
  - fn: total_del_dia
    args: [["chiriuchu", "adobo", "trucha frita"], [25, 18, 22], [3, 0, 2]]
    returns: 119
edge:
  - args: [[], [], []]
    tag: sin platos
  - args: [["adobo", "lechón"], [18, 20], [0, 0]]
    tag: cuando no se vendió nada
  - args: [["adobo", "lechón", "caldo de gallina", "emoliente"], [18, 20, 14, 3], [0, 0, 0, 5]]
    tag: cuando solo vende el último
  - args: [["cuy chactado"], [30], [5]]
    tag: con un solo plato
  - fn: total_del_dia
    args: [[], [], []]
    tag: en total_del_dia, sin platos
  - fn: total_del_dia
    args: [["adobo", "lechón"], [18, 20], [0, 0]]
    tag: en total_del_dia, sin ventas
random:
  count: 40
  seed: 88
  generate: |
    nombres = ["adobo", "caldo de gallina", "chiriuchu", "trucha frita", "rocoto relleno",
               "sopa de quinua", "chicha de jora", "lechón", "emoliente", "cuy chactado"]
    n = rng.int(0, 8)
    return [rng.shuffle(nombres)[:n], rng.list(n, 3, 30), rng.list(n, 0, 5)]
wrong:
  - |
    def reporte_del_dia(platos, precios, vendidos):
        return [
            f"{n}. {plato}: {cantidad} x {precio} = {cantidad * precio}"
            for n, (plato, precio, cantidad) in enumerate(zip(platos, precios, vendidos), start=1)
            if cantidad > 0
        ]


    def total_del_dia(platos, precios, vendidos):
        return sum(precio * cantidad for precio, cantidad in zip(precios, vendidos))
  - |
    def reporte_del_dia(platos, precios, vendidos):
        con_venta = [(p, pr, c) for p, pr, c in zip(platos, precios, vendidos) if c > 0]
        return [f"{n}. {p}: {c} x {pr} = {c * pr}" for n, (p, pr, c) in enumerate(con_venta)]


    def total_del_dia(platos, precios, vendidos):
        return sum(pr * c for pr, c in zip(precios, vendidos))
```

## Misión final

```exercise
id: py8-mision-comedor
type: mission
title: El almuerzo de doña Paulina
prompt: |
  **Sirve todas las comandas que no se anularon, en orden de número de mesa, y vuelve a la cocina.**

  Quilla empieza en la cocina (K) mirando al este, en el pasillo. Las mesas están en la fila de abajo, **desordenadas** y en otro sitio en cada prueba, así que hay que leerlas del mapa: `robot.mapa()` devuelve las filas del comedor como textos, y en la fila `2` cada mesa es un dígito en su columna.

  1. Arma `columna_de`, un **diccionario por comprensión** `número de mesa → columna`, recorriendo `robot.mapa()[2]` con `enumerate`. `celda.isdigit()` dice si una celda es una mesa.
  2. Arma `por_servir`: los pares `(mesa, plato)` de las `comandas` **no anuladas**, con una comprensión, ordenados por número de mesa con `sorted(…, key=lambda …)`. Si una mesa tiene dos comandas, van en el orden en que llegaron (`sorted` respeta ese orden en los empates).
  3. Por cada par: `robot.preparar(plato)` en la cocina, avanza hasta la columna de la mesa (la cocina está en la columna 1), `robot.servir()` y vuelve a la cocina mirando al este. `media_vuelta` ya está escrita.

  Cuando pase, junto con los jueces, se desbloquea la sesión 9.
visual:
  figure:
    title: El comedor de la primera prueba, leído
    panes:
      - { label: "robot.mapa()", grid: ["############", "#K.........#", "##3#1##4#2##", "############"], marks: ["2,2", "4,2", "7,2", "9,2"] }
      - { label: columna_de, table: { head: ["mesa", "columna"], rows: [["3", "2"], ["1", "4"], ["4", "7"], ["2", "9"]] } }
starter: |
  # comandas llega de la caja, por ejemplo:
  # [{"mesa": 4, "plato": "adobo", "anulado": False}, ...]

  def media_vuelta():
      robot.girar_derecha()
      robot.girar_derecha()


  fila_de_mesas = robot.mapa()[2]
  print(fila_de_mesas)
  # TODO: columna_de = {… for … in enumerate(fila_de_mesas) if …}
  # TODO: por_servir = sorted([… for c in comandas if …], key=lambda …)
  # TODO: sirve cada par y vuelve a la cocina
solution: |
  def media_vuelta():
      robot.girar_derecha()
      robot.girar_derecha()


  fila_de_mesas = robot.mapa()[2]
  columna_de = {int(celda): x for x, celda in enumerate(fila_de_mesas) if celda.isdigit()}
  pendientes = [(c["mesa"], c["plato"]) for c in comandas if not c["anulado"]]
  por_servir = sorted(pendientes, key=lambda par: par[0])

  for mesa, plato in por_servir:
      pasos = columna_de[mesa] - 1
      robot.preparar(plato)
      robot.avanzar(pasos)
      robot.servir()
      media_vuelta()
      robot.avanzar(pasos)
      media_vuelta()
hints:
  - "`{int(celda): x for x, celda in enumerate(fila_de_mesas) if celda.isdigit()}`: `enumerate` da la columna `x` de cada celda."
  - "Ordenar las tuplas sin `key` también compara el plato cuando la mesa empata, y cambia el orden de llegada. Con `key=lambda par: par[0]` solo cuenta la mesa."
world:
  theme: cocina
  level: 4
  dir: E
  api: [move, kitchen, map]
  map: |
    ############
    #K.........#
    ##3#1##4#2##
    ############
globals:
  comandas:
    - { mesa: 4, plato: adobo, anulado: false }
    - { mesa: 1, plato: chiriuchu, anulado: false }
    - { mesa: 4, plato: chicha de jora, anulado: false }
    - { mesa: 2, plato: trucha frita, anulado: true }
    - { mesa: 3, plato: caldo de gallina, anulado: false }
scenarios:
  - {}
  - map: |
      ##########
      #K.......#
      ###2#4#1##
      ##########
    globals:
      comandas:
        - { mesa: 4, plato: trucha frita, anulado: false }
        - { mesa: 2, plato: sopa de quinua, anulado: false }
        - { mesa: 1, plato: adobo, anulado: true }
        - { mesa: 2, plato: chicha de jora, anulado: false }
        - { mesa: 4, plato: emoliente, anulado: false }
        - { mesa: 1, plato: caldo de gallina, anulado: false }
  - map: |
      #######
      #K....#
      ####5##
      #######
    globals:
      comandas:
        - { mesa: 5, plato: rocoto relleno, anulado: false }
        - { mesa: 5, plato: lechón, anulado: true }
tests:
  - name: sirve las no anuladas, por número de mesa
    state: '[(s.table, s.dish) for s in w.served] == [(c["mesa"], c["plato"]) for c in sorted(g["comandas"], key=lambda c: c["mesa"]) if not c["anulado"]]'
    msg: Los platos servidos no coinciden (mesa, plato u orden). ¿Quitaste las anuladas y ordenaste solo por mesa?
  - name: termina en la cocina mirando al este
    state: 'w.at_kitchen and w.dir == "E"'
  - name: sin chocar
    state: not w.crashed
  - name: lee las mesas con un diccionario por comprensión
    source: '\{[^{}\n]*:[^{}\n]*\bfor\b[^{}\n]*\benumerate\s*\('
    msg: "Arma columna_de con {… : … for x, celda in enumerate(…) if …}."
  - name: filtra las comandas con una comprensión
    source: '\[[^\n]*\bfor\b[^\n]*\bif\b'
  - name: ordena con key
    source: '\bsorted\s*\([\s\S]*key\s*='
```

## Reto experto

```exercise
id: py8-reto-menu
type: challenge
title: El menú que alcanza
visual:
  figure:
    title: Un ejemplo
    input:
      label: recetas y despensa
      cards:
        - { title: adobo, rows: [["chancho", "300"], ["chicha de jora", "200"]] }
        - { title: caldo de gallina, rows: [["gallina", "250"], ["papa", "200"]] }
        - { title: despensa, rows: [["chancho", "1000"], ["chicha de jora", "500"], ["gallina", "1000"], ["papa", "300"]] }
    arrow: "porciones = el ingrediente que se acaba primero"
    output: { label: devuelve, text: "[('adobo', 2), ('caldo de gallina', 1)]" }
prompt: |
  **Escribe `menu_posible(recetas, despensa)`, que devuelve qué platos se pueden cocinar hoy y cuántas porciones de cada uno.** Para quien ya programa.

  `recetas` es un diccionario `plato → {ingrediente: gramos por porción}` y `despensa` un diccionario `ingrediente → gramos que hay`. Cada plato se calcula **por separado**, como si fuera el único (no se reparten los ingredientes entre platos).

  - Las porciones de un plato son las que permite el ingrediente que se acaba primero. Un ingrediente que no está en la despensa cuenta como 0 gramos.
  - Devuelve una lista de tuplas `(plato, porciones)`, solo de los platos con al menos una porción.
  - Ordénala de más porciones a menos; en un empate, por nombre.

  Intenta escribirla con una comprensión, una expresión generadora dentro de `min` y un `sorted` con `key`.
starter: |
  def menu_posible(recetas, despensa):
      return []


  # recetas y despensa ya existen: las del dibujo
  print(menu_posible(recetas, despensa))
solution: |
  def menu_posible(recetas, despensa):
      """Platos posibles con sus porciones, de más a menos."""
      porciones = {
          plato: min(despensa.get(insumo, 0) // gramos for insumo, gramos in receta.items())
          for plato, receta in recetas.items()
      }
      posibles = [(plato, cuantas) for plato, cuantas in porciones.items() if cuantas > 0]
      return sorted(posibles, key=lambda par: (-par[1], par[0]))


  # recetas y despensa ya existen: las del dibujo
  print(menu_posible(recetas, despensa))
globals:
  recetas:
    adobo: { chancho: 300, chicha de jora: 200 }
    caldo de gallina: { gallina: 250, papa: 200 }
  despensa: { chancho: 1000, chicha de jora: 500, gallina: 1000, papa: 300 }
hints:
  - "Para un plato: `min(despensa.get(insumo, 0) // gramos for insumo, gramos in receta.items())`."
  - "`key=lambda par: (-par[1], par[0])` ordena por porciones de mayor a menor y luego por nombre."
tests:
  - name: el ejemplo
    run: menu_posible(recetas, despensa)
    equals: [["adobo", 2], ["caldo de gallina", 1]]
  - name: un ingrediente que falta deja el plato afuera
    run: 'menu_posible({"cuy chactado": {"cuy": 1, "papa": 150}, "sopa de quinua": {"quinua": 80}}, {"papa": 900, "quinua": 400})'
    equals: [["sopa de quinua", 5]]
  - name: los empates van por nombre
    run: 'menu_posible({"trucha frita": {"trucha": 200}, "chiriuchu": {"cuy": 1, "gallina": 200}, "lechón": {"chancho": 500}}, {"trucha": 600, "cuy": 3, "gallina": 600, "chancho": 1000})'
    equals: [["chiriuchu", 3], ["trucha frita", 3], ["lechón", 2]]
  - name: con la despensa vacía no sale nada
    run: 'menu_posible({"adobo": {"chancho": 300}}, {})'
    equals: []
  - name: sin recetas
    run: 'menu_posible({}, {"papa": 500})'
    equals: []
  - name: cada plato se calcula por separado
    run: 'menu_posible({"adobo": {"chancho": 300}, "lechón": {"chancho": 500}}, {"chancho": 1000})'
    equals: [["adobo", 3], ["lechón", 2]]
```
