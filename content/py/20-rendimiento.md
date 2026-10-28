# Sesión 20 — Rendimiento

## El encargo

Gamarra, La Victoria, 20 de diciembre. Faltan cinco días para Navidad y el emporio textil no duerme: las galerías abren a las cinco de la mañana, los triciclos cargados de rollos de tela se abren paso entre la gente y en cada taller las remalladoras suenan como lluvia. **Doña Felícita Mamani**, de *Confecciones El Hilo de Oro*, tiene un pedido de cuarenta mil polos para una cadena de tiendas y un sistema de pedidos que alguien le escribió en Python.

El sistema funciona. El problema es que el reporte de cada noche, con todos los pedidos de la campaña, **tarda casi una hora**, y a esa hora doña Felícita ya debería estar cortando tela. Maru le mandó a Quilla, con su sirena para abrirse paso en el Jirón Gamarra, y una sola instrucción: "No adivines qué está lento. **Mídelo**". Hoy Quilla aprende a contar cuánto trabajo hace un programa cuando los datos crecen, y a cambiar el paso que crece mal.

```escena
theme: barranco
level: 2
dir: E
caption: El Jirón Gamarra a las seis de la mañana. Quilla se abre paso entre las galerías hasta el taller de doña Felícita (D) con el primer rollo de tela.
map: |
  ##############
  #R.......#...#
  #.######.#.#.#
  #......#...#D#
  ##############
program: |
  robot.decir("¡Permiso, tela!")
  robot.avanzar(7)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_izquierda()
  robot.avanzar(2)
  robot.girar_izquierda()
  robot.avanzar(2)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.entregar("rollo de tela")
```

## Lo mínimo

Un programa correcto puede ser inútil si tarda demasiado. Lo que importa no es cuánto tarda con diez pedidos, sino **cómo crece su trabajo** cuando los pedidos crecen. A eso se le llama su **complejidad**, y se escribe con la notación *O grande*: `O(n)` crece igual que los datos, `O(n²)` crece con el cuadrado.

```figura
title: Cuánto trabajo es cada complejidad con n = 100 000 pedidos
panes:
  - table:
      head: ["complejidad", "ejemplo", "pasos, más o menos"]
      rows:
        - ["O(1)", "x in un_set, d[clave]", "1"]
        - ["O(log n)", "bisect, heappush", "17"]
        - ["O(n)", "un for, x in una_lista", "100 000"]
        - ["O(n log n)", "sorted(lista)", "1 700 000"]
        - ["O(n²)", "un for dentro de otro", "10 000 000 000"]
caption: "Diez mil millones de pasos son minutos u horas. Duplicar los datos duplica el trabajo de un `O(n)`, pero lo **cuadruplica** en un `O(n²)`."
```

**Medir.** `time.perf_counter()` es un cronómetro de alta precisión: lo lees antes y después, y la resta son segundos. Mide con datos de dos tamaños; si al duplicar los datos el tiempo se multiplica por cuatro, hay un paso cuadrático.

```py
import time

inicio = time.perf_counter()
reporte = armar_reporte(pedidos)
print(f"{(time.perf_counter() - inicio) * 1000:.1f} ms")   # por ejemplo: 431.7 ms
```

**`in` en una lista o en un set.** `x in lista` recorre la lista hasta encontrarlo: `O(n)`. `x in conjunto` salta directo, como `d[clave]` en un diccionario: `O(1)`. Dentro de un bucle, la diferencia es la de la tabla de arriba. Este ejemplo lo mide (no imprime los tiempos, porque cambian en cada máquina, sino la comparación):

```py run
import time

def medir(funcion):
    inicio = time.perf_counter()
    funcion()
    return time.perf_counter() - inicio

codigos = list(range(300_000))
vistos = set(codigos)
en_lista = medir(lambda: [-1 in codigos for _ in range(20)])
en_set = medir(lambda: [-1 in vistos for _ in range(20)])
print(en_lista > 50 * en_set)
```

**Colas: `pop(0)` o `popleft()`.** `lista.pop(0)` saca el primero, pero luego corre todos los demás un lugar a la izquierda: `O(n)` cada vez. Una `collections.deque` (la de la sesión 10) saca por los dos extremos en `O(1)`:

```py
from collections import deque

cola = deque(pedidos)
while cola:
    pedido = cola.popleft()     # no cola.pop(0) sobre una lista
```

**`heapq`: siempre el menor, sin ordenar todo.** Un *heap* es una lista que Python mantiene a medio ordenar: el menor está siempre en la posición 0. `heappush` y `heappop` cuestan `O(log n)`. Sirve para dos cosas: los **k mejores** de una lista enorme y las **colas de prioridad**, donde siempre atiendes primero lo más urgente o lo más cercano (así funciona Dijkstra, el BFS para caminos con costos distintos: saca siempre la casilla más barata pendiente).

```py run
import heapq

precios = [18, 7, 25, 7, 12, 30, 9]
print(heapq.nsmallest(3, precios), heapq.nlargest(2, precios))
pendientes = []
heapq.heappush(pendientes, (5, "Galería Guizado"))
heapq.heappush(pendientes, (2, "Jirón Gamarra"))
heapq.heappush(pendientes, (8, "Parque Cánepa"))
print(heapq.heappop(pendientes))
```

Con tuplas, el heap compara primero el primer elemento: la prioridad va adelante.

**Textos: `join`, no `+=`.** Los textos son inmutables: `informe += linea` puede crear un texto nuevo y copiar todo lo anterior en cada vuelta. Junta las líneas en una lista y únelas al final con `"\n".join(lineas)`.

<!-- legacy: perf-counter -->

<!-- legacy: str-join -->

**Sumas por tramos: el prefijo.** Si te preguntan muchas veces "¿cuánto se vendió entre el minuto `a` y el `b`?", sumar el tramo cada vez es `O(n)` por pregunta. Mejor arma una vez la lista de **sumas acumuladas**, con un `0` adelante: `prefijo[i]` es lo vendido antes del minuto `i`. Cada pregunta es una resta.

```anima
title: Sumas acumuladas, y un tramo con una resta
code: |
  ventas = [4, 1, 3, 5, 2]
  prefijo = [0]
  for venta in ventas:
      prefijo.append(prefijo[-1] + venta)
  desde, hasta = 1, 3
  print(prefijo[hasta + 1] - prefijo[desde])
cells: { of: ventas, at: venta }
notes:
  2: "El 0 de adelante: antes del minuto 0 no se vendió nada."
  4: "Cada casilla nueva es la anterior más la venta de este minuto."
  6: "Del minuto 1 al 3: lo vendido antes del 4 menos lo vendido antes del 1. 13 − 4 = 9."
```

**Dos punteros.** En una lista **ordenada**, para buscar un par que sume justo un monto no hacen falta dos bucles: un índice empieza a la izquierda y otro a la derecha. Si la suma se pasa, el de la derecha retrocede; si no llega, el de la izquierda avanza. Cada paso descarta un elemento: `O(n)`.

```anima
title: Dos punteros buscan un par que sume 25
code: |
  precios = [3, 5, 8, 11, 14, 20]
  izq, der = 0, len(precios) - 1
  while precios[izq] + precios[der] != 25:
      if precios[izq] + precios[der] < 25:
          izq += 1
      else:
          der -= 1
  print(precios[izq], precios[der])
cells: { of: precios, at: izq }
notes:
  3: "¿Suman 25 el más barato y el más caro que quedan?"
  5: "No llega: el más barato no llega a 25 ni con el más caro. Se descarta y avanza la izquierda."
  7: "Se pasa: el más caro se pasa hasta con el más barato. Se descarta y retrocede la derecha."
  8: "5 + 20 = 25, en dos vueltas y sin comparar todos con todos."
```

> **Trampa común:** un `in` sobre una lista dentro de un `for` es **un bucle dentro de otro**, aunque solo veas un `for`. Lo mismo `lista.pop(0)`, `lista.index(x)`, `lista.count(x)` y `lista.remove(x)`: cada uno recorre la lista. Con pocos datos no se nota; con cien mil, es el paso que tarda una hora.

<!-- mdn: perf-counter heapq str-join -->

## Práctica

```exercise
id: py20-predice-pasos
type: predict
title: Contar los pasos
prompt: |
  Antes de medir con reloj, cuenta. ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: "pares (i, j) con i < j entre 4 rollos", table: { head: ["i", "j que recorre"], rows: [["0", "1, 2, 3"], ["1", "2, 3"], ["2", "3"], ["3", "—"]] } }
code: |
  pasos = 0
  for i in range(4):
      for j in range(i + 1, 4):
          pasos += 1
  vistos = set()
  for codigo in [5, 3, 5, 8]:
      vistos.add(codigo)
  print(pasos, len(vistos))
options:
  - "6 3"
  - "16 4"
  - "6 4"
  - "12 3"
answer: "6 3"
explain: |
  Comparar cada uno con los que vienen después son `3 + 2 + 1 = 6` pasos: con `n` datos, `n × (n − 1) / 2`, que crece como `n²`. El set guarda cada código una sola vez: el 5 repetido no cuenta, quedan 3.
```

```exercise
id: py20-completa-cronometro
type: complete
title: El cronómetro de Quilla
prompt: |
  Completa `cronometrar(funcion, *args)`: llama a `funcion(*args)` y devuelve una tupla con lo que devolvió y **cuántos milisegundos** tardó, medidos con `time.perf_counter()`.
starter: |
  import time


  def cronometrar(funcion, *args):
      """Devuelve (resultado, milisegundos) de llamar a funcion(*args)."""
      inicio = time.___()
      resultado = funcion(*args)
      fin = time.___()
      return resultado, (fin - inicio) * ___


  resultado, ms = cronometrar(sorted, [30, 12, 25])
  print(resultado, ms >= 0)
solution: |
  import time


  def cronometrar(funcion, *args):
      """Devuelve (resultado, milisegundos) de llamar a funcion(*args)."""
      inicio = time.perf_counter()
      resultado = funcion(*args)
      fin = time.perf_counter()
      return resultado, (fin - inicio) * 1000


  resultado, ms = cronometrar(sorted, [30, 12, 25])
  print(resultado, ms >= 0)
hints:
  - "Las dos lecturas del reloj son `time.perf_counter()`; la resta da segundos."
  - "Un segundo son 1000 milisegundos."
tests:
  - name: devuelve el resultado de la función
    run: cronometrar(sorted, [30, 12, 25])[0]
    equals: [12, 25, 30]
  - name: pasa los argumentos
    run: cronometrar(max, 4, 9, 2)[0]
    equals: 9
  - name: el tiempo es un número que no es negativo
    expect: 'cronometrar(sum, [1, 2])[1] >= 0'
  - name: el tiempo va en milisegundos
    expect: 'cronometrar(sum, range(3_000_000))[1] > 1'
    msg: Sumar tres millones de números tarda varios milisegundos. ¿Multiplicaste los segundos por 1000?
  - name: usa perf_counter
    source: 'perf_counter\(\)[\s\S]*perf_counter\(\)'
```

```exercise
id: py20-arregla-remalladoras
type: fix
title: La cola de las remalladoras
prompt: |
  En el taller, cada pedido pasa por la remalladora **de a 10 docenas por turno**: si le faltan más, vuelve al final de la cola con lo que le falta. `orden_de_salida(pedidos)` devuelve los nombres en el orden en que terminan.

  Da la respuesta correcta, pero con los dos mil pedidos de la campaña se arrastra: cada `pop(0)` corre toda la lista. Cámbiala por una `deque` con `popleft()`, sin cambiar lo que devuelve.
visual:
  figure:
    title: 'orden_de_salida([["Rosa", 25], ["Jhon", 8], ["Milka", 12]])'
    input: { label: cola, cells: ["Rosa 25", "Jhon 8", "Milka 12"] }
    arrow: "turnos de 10: Rosa 25→15 · Jhon termina · Milka 12→2 · Rosa 15→5 · Milka termina · Rosa termina"
    output: { label: devuelve, value: "['Jhon', 'Milka', 'Rosa']" }
starter: |
  def orden_de_salida(pedidos):
      """Nombres en el orden en que terminan, a 10 docenas por turno."""
      cola = [(nombre, docenas) for nombre, docenas in pedidos]
      terminados = []
      while cola:
          nombre, docenas = cola.pop(0)
          if docenas > 10:
              cola.append((nombre, docenas - 10))
          else:
              terminados.append(nombre)
      return terminados


  print(orden_de_salida([["Rosa", 25], ["Jhon", 8], ["Milka", 12]]))
solution: |
  from collections import deque


  def orden_de_salida(pedidos):
      """Nombres en el orden en que terminan, a 10 docenas por turno."""
      cola = deque((nombre, docenas) for nombre, docenas in pedidos)
      terminados = []
      while cola:
          nombre, docenas = cola.popleft()
          if docenas > 10:
              cola.append((nombre, docenas - 10))
          else:
              terminados.append(nombre)
      return terminados


  print(orden_de_salida([["Rosa", 25], ["Jhon", 8], ["Milka", 12]]))
hints:
  - "`from collections import deque` y `cola = deque(...)` con lo mismo que tenía la lista."
  - "`append` sigue igual; solo `pop(0)` cambia a `popleft()`."
tests:
  - name: el ejemplo
    run: 'orden_de_salida([["Rosa", 25], ["Jhon", 8], ["Milka", 12]])'
    equals: [Jhon, Milka, Rosa]
  - name: sin pedidos
    run: orden_de_salida([])
    equals: []
  - name: justo 10 docenas terminan en un turno
    run: 'orden_de_salida([["Ana", 20], ["Luz", 10]])'
    equals: [Luz, Ana]
  - name: usa una deque con popleft
    source: '\bdeque\b[\s\S]*\.popleft\(\)'
  - name: ya no hay pop(0)
    sourceNot: '\.pop\(\s*0\s*\)'
    msg: Cada pop(0) corre toda la lista un lugar. Con una deque, popleft() es instantáneo.
```

```exercise
id: py20-predice-heap
type: predict
title: El más cercano primero
prompt: |
  Quilla guarda en un heap los encargos pendientes con su distancia en cuadras. ¿Qué imprime?
code: |
  import heapq

  pendientes = []
  heapq.heappush(pendientes, (3, "buzos"))
  heapq.heappush(pendientes, (1, "polos"))
  heapq.heappush(pendientes, (2, "casacas"))
  print(heapq.heappop(pendientes)[1])
  print(pendientes[0])
  print(heapq.nsmallest(2, [9, 4, 7, 4]))
options:
  - "polos\n(2, 'casacas')\n[4, 4]"
  - "buzos\n(1, 'polos')\n[4, 7]"
  - "polos\n(3, 'buzos')\n[4, 4]"
  - "polos\n(2, 'casacas')\n[4, 7]"
answer: "polos\n(2, 'casacas')\n[4, 4]"
explain: |
  `heappop` saca el menor sin importar el orden en que entraron: la tupla `(1, "polos")`. Después, el menor que queda está en la posición 0: `(2, "casacas")`. `nsmallest` respeta las repeticiones: los dos menores de `[9, 4, 7, 4]` son 4 y 4.
```

```exercise
id: py20-completa-guia
type: complete
title: La guía de remisión
prompt: |
  `guia(pedidos)` arma el texto de la guía: una primera línea `GUÍA: n pedidos` y luego una línea `cliente: docenas doc.` por pedido, separadas por saltos de línea, **sin salto al final**. La versión vieja usaba `+=` en un bucle; completa la nueva, que junta las líneas en una lista y las une con `join`.
starter: |
  def guia(pedidos):
      """El texto de la guía de remisión, línea por línea."""
      lineas = [f"GUÍA: {len(pedidos)} pedidos"]
      lineas.extend(f"{cliente}: {docenas} doc." for cliente, docenas in ___)
      return ___.join(___)


  print(guia([["Tiendas Sol", 40], ["Bazar Lucy", 12]]))
solution: |
  def guia(pedidos):
      """El texto de la guía de remisión, línea por línea."""
      lineas = [f"GUÍA: {len(pedidos)} pedidos"]
      lineas.extend(f"{cliente}: {docenas} doc." for cliente, docenas in pedidos)
      return "\n".join(lineas)


  print(guia([["Tiendas Sol", 40], ["Bazar Lucy", 12]]))
hints:
  - "El separador va antes del punto: `\"\\n\".join(lineas)`."
tests:
  - name: dos pedidos
    run: 'guia([["Tiendas Sol", 40], ["Bazar Lucy", 12]])'
    equals: "GUÍA: 2 pedidos\nTiendas Sol: 40 doc.\nBazar Lucy: 12 doc."
  - name: sin pedidos, solo el título
    run: guia([])
    equals: "GUÍA: 0 pedidos"
  - name: diez mil pedidos de una vez
    expect: 'guia([["C", 1]] * 10_000).count("\n") == 10_000'
  - name: sin += en el texto
    sourceNot: '\+='
  - name: usa join
    source: '\.join\('
```

```exercise
id: py20-escribe-punteros
type: write
title: Dos prendas por el presupuesto
prompt: |
  Un cliente quiere llevar **dos prendas distintas** sin pasarse de su presupuesto. Escribe `pares_que_alcanzan(precios, presupuesto)`, que cuenta cuántos pares `i < j` cumplen `precios[i] + precios[j] <= presupuesto`. `precios` ya viene **ordenada de menor a mayor**.

  Hazlo con dos punteros: si el más barato (`izq`) y el más caro (`der`) alcanzan, también alcanzan el más barato con **cualquiera** de los que están entre ellos (`der - izq` pares), y `izq` avanza; si no alcanzan, `der` retrocede. Una de las pruebas tiene treinta mil precios: dos bucles anidados no terminan a tiempo.
visual:
  figure:
    title: pares_que_alcanzan([2, 3, 5, 8, 13], 10)
    input: { label: precios, cells: [2, 3, 5, 8, 13] }
    arrow: "2+13 no · 2+8 sí: 3 pares · 3+8 no · 3+5 sí: 1 par"
    output: { label: devuelve, value: "4" }
starter: |
  def pares_que_alcanzan(precios, presupuesto):
      return 0


  print(pares_que_alcanzan([2, 3, 5, 8, 13], 10))
solution: |
  def pares_que_alcanzan(precios, presupuesto):
      """Pares i < j que suman a lo más el presupuesto, en una lista ordenada."""
      izq, der = 0, len(precios) - 1
      pares = 0
      while izq < der:
          if precios[izq] + precios[der] <= presupuesto:
              pares += der - izq
              izq += 1
          else:
              der -= 1
      return pares


  print(pares_que_alcanzan([2, 3, 5, 8, 13], 10))
hints:
  - "Empieza con `izq, der = 0, len(precios) - 1` y repite mientras `izq < der`."
  - "Cuando alcanzan, suma `der - izq` de una vez: son el más barato con cada uno de los que están entre los dos."
tests:
  - name: el ejemplo
    run: pares_que_alcanzan([2, 3, 5, 8, 13], 10)
    equals: 4
  - name: precios iguales
    run: pares_que_alcanzan([4, 4, 4], 8)
    equals: 3
  - name: ninguno alcanza
    run: pares_que_alcanzan([6, 7, 9], 12)
    equals: 0
  - name: sin precios
    run: pares_que_alcanzan([], 5)
    equals: 0
  - name: un solo precio no hace par
    run: pares_que_alcanzan([9], 20)
    equals: 0
  - name: treinta mil precios, a tiempo
    run: pares_que_alcanzan(list(range(30_000)), 30_000)
    equals: 225014999
    msg: Con dos bucles anidados son 450 millones de sumas. Usa los dos punteros.
  - name: usa un while
    source: '\bwhile\b'
```

## El caso

```exercise
id: py20-caso-reporte
type: case
title: El reporte que tardaba una hora
prompt: |
  **Mide cada paso del reporte con 2000 y con 4000 pedidos y encuentra el que es cuadrático: al duplicar los pedidos, su tiempo se multiplica por cuatro.**

  El reporte de doña Felícita tiene cuatro pasos, y cada uno lo escribió un sobrino distinto. Con los pedidos de un día tarda un segundo; con el millón de pedidos de la campaña, casi una hora. Los cuatro juran que su paso "es rapidísimo". Edwin, además, está seguro de que el culpable es el `+=` de `redactar`.

  Escribe `medir(paso, pedidos)`, que devuelve los milisegundos que tarda `paso(pedidos)`, e imprime una línea por paso que empiece con su nombre: `print(f"{paso.__name__}: {ms_2000:.1f} ms → {ms_4000:.1f} ms")`. Los tiempos cambian en cada máquina; la forma en que crecen, no.
visual:
  board:
    for: py20-caso-reporte
    task: "Mide cada paso con 2000 y 4000 pedidos. El que se multiplica por cuatro es cuadrático."
    cards:
      - name: Yovana
        kind: person
        rows: [["Paso", "limpiar"], ["Dice", "\"Una pasada y listo.\""]]
        clue: { find: "limpiar" }
      - name: Kevin
        kind: person
        culprit: true
        rows: [["Paso", "clientes_unicos"], ["Dice", "\"Solo reviso si ya lo anoté.\""]]
        clue: { find: "clientes_unicos" }
      - name: Lucía
        kind: person
        rows: [["Paso", "ordenar_por_docenas"], ["Dice", "\"Uso sorted, que es de Python.\""]]
        clue: { find: "ordenar_por_docenas" }
      - name: Edwin
        kind: person
        rows: [["Paso", "redactar"], ["Dice", "\"El lento es mi +=, seguro.\""]]
        clue: { find: "redactar" }
    caption: "Si dudas entre dos, mira cuánto crece cada uno al duplicar los pedidos, no cuál parece más feo."
starter: |
  import time


  def pedidos_del_dia(n):
      """n pedidos inventados, siempre los mismos: (cliente, prenda, docenas)."""
      prendas = ["Polo", "Buzo", "Short", "Casaca", "Chompa"]
      clientes = n * 3 // 4 + 1
      return [(f" C{(i * 7919) % clientes} ", prendas[i % 5], 1 + i % 12) for i in range(n)]


  # Los cuatro pasos del reporte, tal como los escribieron los sobrinos
  def limpiar(pedidos):
      return [(cliente.strip(), prenda.lower(), docenas) for cliente, prenda, docenas in pedidos]


  def clientes_unicos(pedidos):
      unicos = []
      for cliente, _, _ in pedidos:
          if cliente not in unicos:
              unicos.append(cliente)
      return unicos


  def ordenar_por_docenas(pedidos):
      return sorted(pedidos, key=lambda pedido: pedido[2], reverse=True)


  def redactar(pedidos):
      informe = ""
      for cliente, prenda, docenas in pedidos:
          informe += f"{cliente}: {docenas} doc. de {prenda}\n"
      return informe


  pasos = [limpiar, clientes_unicos, ordenar_por_docenas, redactar]
  chicos = pedidos_del_dia(2000)
  grandes = pedidos_del_dia(4000)
  print(len(chicos), "y", len(grandes), "pedidos listos para medir")

  # TODO: escribe medir(paso, pedidos), que devuelve milisegundos con time.perf_counter()
  # TODO: para cada paso, mídelo con chicos y con grandes e imprime una línea que empiece con su nombre
solution: |
  import time


  def pedidos_del_dia(n):
      """n pedidos inventados, siempre los mismos: (cliente, prenda, docenas)."""
      prendas = ["Polo", "Buzo", "Short", "Casaca", "Chompa"]
      clientes = n * 3 // 4 + 1
      return [(f" C{(i * 7919) % clientes} ", prendas[i % 5], 1 + i % 12) for i in range(n)]


  def limpiar(pedidos):
      return [(cliente.strip(), prenda.lower(), docenas) for cliente, prenda, docenas in pedidos]


  def clientes_unicos(pedidos):
      unicos = []
      for cliente, _, _ in pedidos:
          if cliente not in unicos:
              unicos.append(cliente)
      return unicos


  def ordenar_por_docenas(pedidos):
      return sorted(pedidos, key=lambda pedido: pedido[2], reverse=True)


  def redactar(pedidos):
      informe = ""
      for cliente, prenda, docenas in pedidos:
          informe += f"{cliente}: {docenas} doc. de {prenda}\n"
      return informe


  pasos = [limpiar, clientes_unicos, ordenar_por_docenas, redactar]
  chicos = pedidos_del_dia(2000)
  grandes = pedidos_del_dia(4000)


  def medir(paso, pedidos):
      """Milisegundos que tarda paso(pedidos)."""
      inicio = time.perf_counter()
      paso(pedidos)
      return (time.perf_counter() - inicio) * 1000


  for paso in pasos:
      ms_2000 = medir(paso, chicos)
      ms_4000 = medir(paso, grandes)
      print(f"{paso.__name__}: {ms_2000:.1f} ms → {ms_4000:.1f} ms")
answer: clientes_unicos
answerLabel: ¿Qué paso es cuadrático?
reveal: |
  `clientes_unicos`. Su `if cliente not in unicos` recorre la lista `unicos` en cada pedido: es un bucle dentro de otro, y con 4000 pedidos tarda unas cuatro veces lo que con 2000 (y decenas de veces más que los otros pasos). Con un set, `vistos = set()` y `if cliente not in vistos`, baja a un paso por pedido; si además importa el orden, `list(dict.fromkeys(clientes))` lo conserva.

  Edwin se equivocó de culpable: su `+=` es el estilo viejo, pero CPython suele estirar el texto en su sitio y aquí casi no se nota. Por eso se mide antes de cambiar nada. `sorted` es `O(n log n)`: crece un poco más que el doble, nunca el cuádruple.
hints:
  - "`medir` lee `time.perf_counter()` antes y después de llamar a `paso(pedidos)`, y multiplica la resta por 1000."
  - "`for paso in pasos:` recorre las funciones; `paso.__name__` es su nombre como texto."
```

## El juez

Estos jueces miden el tiempo: cada llamada tiene **200 ms**. Si te pasas, el veredicto es *Tiempo límite excedido* aunque la respuesta sea correcta. Los últimos casos ocultos son la hora punta, con miles de datos: ahí es donde dos bucles anidados no llegan.

```exercise
id: py20-juez-parejas
type: judge
mode: function
function: contar_parejas
limit: 200
title: Dos retazos, un pedido
prompt: |
  **Escribe `contar_parejas(retazos, metros)`, que devuelve cuántos pares de retazos distintos (`i < j`) suman exactamente `metros`.**

  En la galería, doña Felícita tiene una caja de retazos de tela, cada uno con su largo en metros. Un pedido chico se arma uniendo **dos** retazos que sumen justo lo que pide el cliente. Quiere saber cuántas maneras tiene. Dos retazos del mismo largo son retazos distintos: con `[3, 3, 3]` y 6 metros hay 3 parejas.

  Recorre los retazos una vez y lleva en un diccionario **cuántos de cada largo ya viste**: cada retazo forma pareja con todos los que ya viste de largo `metros - largo`.

  **Restricciones:** hasta 10 000 retazos · largos de 1 a 200 · `metros` de 2 a 400 · **200 ms por llamada**.
visual:
  figure:
    title: El ejemplo 1, retazo por retazo
    input: { label: "retazos, metros = 7", table: { head: ["largo", "busca", "ya vistos de ese largo", "parejas"], rows: [["3", "4", "0", "0"], ["4", "3", "1", "1"], ["2", "5", "0", "1"], ["4", "3", "1", "2"], ["5", "2", "1", "3"]] } }
    arrow: sumar lo que ya viste del largo que falta
    output: { label: devuelve, value: "3" }
    steps:
      - "El primer 4 forma pareja con el 3; el segundo 4, también con ese 3."
      - "El 5 forma pareja con el 2. Total: 3."
starter: |
  def contar_parejas(retazos, metros):
      return 0
solution: |
  def contar_parejas(retazos, metros):
      """Pares i < j de retazos que suman exactamente metros."""
      vistos = {}
      parejas = 0
      for largo in retazos:
          parejas += vistos.get(metros - largo, 0)
          vistos[largo] = vistos.get(largo, 0) + 1
      return parejas
hints:
  - "Pregunta primero cuántos viste de `metros - largo` y **después** anota el retazo actual: así nunca lo emparejas consigo mismo."
  - "`vistos.get(clave, 0)` da 0 la primera vez."
samples:
  - args: [[3, 4, 2, 4, 5], 7]
    returns: 3
    note: "3+4, 3+4 (el otro 4) y 2+5."
  - args: [[3, 3, 3], 6]
    returns: 3
    note: Tres retazos iguales forman tres parejas, ninguno consigo mismo.
edge:
  - args: [[], 10]
    tag: sin retazos
  - args: [[5], 10]
    tag: con un solo retazo que sería su propia pareja
  - args: [[1, 2, 3], 100]
    tag: sin ninguna pareja
  - args: [[4, 4, 4, 4, 4, 4, 4, 4, 4, 4], 8]
    tag: con todos los retazos iguales
  - args: [[200, 200, 1, 199], 400]
    tag: con los largos más grandes
random:
  count: 40
  seed: 2020
  generate: |
    # Los últimos cinco casos son la hora punta: 10 000 retazos.
    rng.vez = getattr(rng, "vez", 0) + 1
    grande = rng.vez > 35
    tope = rng.pick([10, 60, 200])
    n = 10_000 if grande else rng.int(0, 80)
    return [rng.list(n, 1, tope), rng.int(2, 2 * tope)]
wrong:
  - |
    def contar_parejas(retazos, metros):
        parejas = 0
        for i in range(len(retazos)):
            for j in range(i + 1, len(retazos)):
                if retazos[i] + retazos[j] == metros:
                    parejas += 1
        return parejas
  - |
    def contar_parejas(retazos, metros):
        vistos = set()
        parejas = 0
        for largo in retazos:
            if metros - largo in vistos:
                parejas += 1
            vistos.add(largo)
        return parejas
  - |
    def contar_parejas(retazos, metros):
        cuantos = {}
        for largo in retazos:
            cuantos[largo] = cuantos.get(largo, 0) + 1
        total = 0
        for largo in retazos:
            total += cuantos.get(metros - largo, 0)
        return total // 2
```

```exercise
id: py20-juez-baratos
type: judge
mode: function
function: mas_baratos
limit: 200
title: El remate de fin de campaña
prompt: |
  **Escribe `mas_baratos(precios, k)`, que devuelve los `k` precios más bajos de la lista, de menor a mayor, con sus repeticiones.**

  El 26 de diciembre, en Gamarra todo se remata. Un comprador de Huancayo quiere llevarse los `k` polos más baratos de un lote enorme, y Quilla tiene que decirle cuáles son antes de que otro se los gane. Si dos polos cuestan lo mismo, son dos polos: aparecen los dos.

  `heapq.nsmallest(k, precios)` hace justo esto sin ordenar el lote entero. Ojo: buscar el mínimo y sacarlo, `k` veces, recorre el lote `k` veces.

  **Restricciones:** hasta 30 000 precios · precios de 1 a 500 · `0 ≤ k ≤ len(precios)` · **200 ms por llamada**.
visual:
  figure:
    title: El ejemplo 1
    input: { label: "precios, k = 3", cells: [15, 8, 22, 8, 30, 12] }
    arrow: los 3 menores, en orden
    output: { label: devuelve, cells: [8, 8, 12] }
    steps:
      - "Los dos polos de 8 soles cuentan por separado."
starter: |
  def mas_baratos(precios, k):
      return []
solution: |
  import heapq


  def mas_baratos(precios, k):
      """Los k precios más bajos, de menor a mayor."""
      return heapq.nsmallest(k, precios)
hints:
  - "`import heapq` y una sola línea: `heapq.nsmallest(k, precios)`."
  - "Si quieres hacerlo a mano: un heap con los `k` mejores hasta ahora, guardados en negativo para que `heappop` saque el más caro de ellos."
samples:
  - args: [[15, 8, 22, 8, 30, 12], 3]
    returns: [8, 8, 12]
    note: Los dos de 8 aparecen los dos.
  - args: [[40, 10, 20], 0]
    returns: []
    note: Con k = 0 no se lleva nada.
edge:
  - args: [[], 0]
    tag: con un lote vacío
  - args: [[7, 7, 7, 7], 2]
    tag: con todos los precios iguales
  - args: [[9, 3, 6], 3]
    tag: con k igual al tamaño del lote
  - args: [[500, 1], 1]
    tag: con el más barato al final
random:
  count: 40
  seed: 1226
  generate: |
    # Los últimos cinco casos son el lote completo: 30 000 polos.
    rng.vez = getattr(rng, "vez", 0) + 1
    grande = rng.vez > 35
    n = 30_000 if grande else rng.int(0, 100)
    precios = rng.list(n, 1, rng.pick([20, 500]))
    k = rng.int(800, 1500) if grande else rng.int(0, n)
    return [precios, k]
wrong:
  - |
    def mas_baratos(precios, k):
        lote = list(precios)
        elegidos = []
        for _ in range(k):
            menor = min(lote)
            lote.remove(menor)
            elegidos.append(menor)
        return elegidos
  - |
    import heapq


    def mas_baratos(precios, k):
        heapq.heapify(precios)
        return precios[:k]
  - |
    def mas_baratos(precios, k):
        return sorted(set(precios))[:k]
```

```exercise
id: py20-juez-tramos
type: judge
mode: function
function: ventas_por_tramo
limit: 200
title: Las ventas por tramo
prompt: |
  **Escribe `ventas_por_tramo(ventas, tramos)`, que devuelve una lista con lo vendido en cada tramo, en el mismo orden.**

  `ventas[i]` son los polos que vendió el puesto de doña Felícita en el minuto `i` del día. Su contador le hace muchas preguntas: cada tramo es un par `[desde, hasta]` y pregunta cuánto se vendió del minuto `desde` al `hasta`, **los dos incluidos**.

  Arma una sola vez la lista de sumas acumuladas con un `0` adelante; cada tramo es una resta.

  **Restricciones:** hasta 15 000 minutos y 15 000 tramos · ventas de 0 a 50 · `0 ≤ desde ≤ hasta < len(ventas)` · **200 ms por llamada**.
visual:
  figure:
    title: El ejemplo 1, con sus sumas acumuladas
    input: { label: "ventas y su prefijo", table: { head: ["i", "0", "1", "2", "3", "4", "5"], rows: [["ventas[i]", "4", "1", "3", "5", "2", ""], ["prefijo[i]", "0", "4", "5", "8", "13", "15"]] } }
    arrow: "[1, 3] → prefijo[4] − prefijo[1] = 13 − 4 · [0, 4] → 15 − 0 · [2, 2] → 8 − 5"
    output: { label: devuelve, value: "[9, 15, 3]" }
    steps:
      - "El prefijo empieza en 0: `prefijo[i]` es lo vendido **antes** del minuto `i`."
      - "Del minuto `desde` al `hasta`: `prefijo[hasta + 1] - prefijo[desde]`."
starter: |
  def ventas_por_tramo(ventas, tramos):
      return []
solution: |
  def ventas_por_tramo(ventas, tramos):
      """Lo vendido en cada tramo [desde, hasta], los dos incluidos."""
      prefijo = [0]
      for venta in ventas:
          prefijo.append(prefijo[-1] + venta)
      return [prefijo[hasta + 1] - prefijo[desde] for desde, hasta in tramos]
hints:
  - "`prefijo` tiene un elemento más que `ventas`: `prefijo[i]` es la suma de `ventas[0]` a `ventas[i - 1]`."
  - "Del minuto `desde` al `hasta`, incluidos: `prefijo[hasta + 1] - prefijo[desde]`."
samples:
  - args: [[4, 1, 3, 5, 2], [[1, 3], [0, 4], [2, 2]]]
    returns: [9, 15, 3]
    note: "1 + 3 + 5 = 9; todo el día, 15; solo el minuto 2, 3."
edge:
  - args: [[7], [[0, 0]]]
    tag: con un solo minuto
  - args: [[3, 0, 2], []]
    tag: sin ninguna pregunta
  - args: [[5, 6, 7, 8], [[0, 0], [0, 3], [3, 3]]]
    tag: con tramos que tocan los dos bordes
  - args: [[0, 0, 0], [[0, 2], [1, 1]]]
    tag: con un día sin ventas
random:
  count: 40
  seed: 1220
  generate: |
    # Los últimos cinco casos son el día entero: 15 000 minutos y 15 000 preguntas.
    rng.vez = getattr(rng, "vez", 0) + 1
    grande = rng.vez > 35
    n = 15_000 if grande else rng.int(1, 60)
    ventas = rng.list(n, 0, 50)
    tramos = []
    for _ in range(15_000 if grande else rng.int(0, 30)):
        a, b = rng.int(0, n - 1), rng.int(0, n - 1)
        tramos.append([min(a, b), max(a, b)])
    return [ventas, tramos]
wrong:
  - |
    def ventas_por_tramo(ventas, tramos):
        return [sum(ventas[desde:hasta + 1]) for desde, hasta in tramos]
  - |
    def ventas_por_tramo(ventas, tramos):
        prefijo = [0]
        for venta in ventas:
            prefijo.append(prefijo[-1] + venta)
        return [prefijo[hasta] - prefijo[desde] for desde, hasta in tramos]
  - |
    def ventas_por_tramo(ventas, tramos):
        acumulado = []
        total = 0
        for venta in ventas:
            total += venta
            acumulado.append(total)
        return [acumulado[hasta] - acumulado[desde - 1] for desde, hasta in tramos]
```

## Misión final

```exercise
id: py20-mision-gamarra
type: mission
title: El último encargo de la campaña
prompt: |
  **Busca con BFS el camino más corto a la tela (`a`), luego a los botones (`b`) y luego al taller de doña Felícita (`D`); recógelos con `robot.tomar()` y entrega `"tela y botones"`.**

  Es la noche del 23 de diciembre y las galerías de Gamarra son un laberinto de pasillos, escaleras y puestos cerrados. La batería alcanza **exactamente** para los tres tramos más cortos, ni un paso más: un camino a tientas, siguiendo la pared, se queda varado a medio pasillo. Tienes:

  - `robot.mapa()`: el plano como lista de textos, `mapa[y][x]`; `"#"` es pared, y el borde es todo pared;
  - `robot.posicion`: dónde está Quilla, `(x, y)`;
  - `robot.seguir_ruta(ruta)`: recorre una lista de casillas vecinas `(x, y)` (la primera puede ser la casilla actual);
  - `robot.tomar()`: levanta lo que hay en la casilla y devuelve su nombre;
  - `robot.marcar(casillas)`, si quieres ver lo que exploró tu búsqueda.

  Escribe la búsqueda **una vez**, como función que recibe desde dónde sale y qué letra busca, y úsala tres veces. El plano cambia en cada prueba.

  Es la última misión del curso.
visual:
  figure:
    title: La primera prueba
    input: { label: "plano (batería: 100)", grid: ["#########################", "#R....#................a#", "###.#.#.###.#####.#####.#", "#...#.#.#.......#...#.#.#", "#.#...#.#.###.#.###.#...#", "#.#...#.#.....#...#.#...#", "#.#######.###.###.....###", "#.......#.#...#...#.#.#.#", "#.##..#.###.###.###.#...#", "#.....#.....#.#.#...#.#.#", "########.##.#.#.###...#.#", "#b.....................D#", "#########################"] }
    arrow: "tres BFS: R → a (46) · a → b (32) · b → D (22)"
    output: { label: "batería justa", value: "46 + 32 + 22 = 100" }
starter: |
  mapa = robot.mapa()
  x, y = robot.posicion
  print("Salgo de", x, y, "con batería", robot.bateria)
  # TODO: def ruta_mas_corta(mapa, inicio, letra): BFS desde inicio hasta la casilla con esa letra,
  #       con una deque y un diccionario de padres; devuelve la ruta como lista de (x, y).
  # TODO: a por la tela ("a"), tomar(); a por los botones ("b"), tomar(); al taller ("D"), entregar.
solution: |
  from collections import deque


  def ruta_mas_corta(mapa, inicio, letra):
      """La ruta más corta de inicio a la casilla con esa letra, como lista de (x, y)."""
      padre = {inicio: None}
      cola = deque([inicio])
      while cola:
          x, y = cola.popleft()
          if mapa[y][x] == letra:
              ruta = []
              casilla = (x, y)
              while casilla is not None:
                  ruta.append(casilla)
                  casilla = padre[casilla]
              return ruta[::-1]
          for vecina in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              vx, vy = vecina
              if mapa[vy][vx] != "#" and vecina not in padre:
                  padre[vecina] = (x, y)
                  cola.append(vecina)
      return []


  mapa = robot.mapa()
  for letra in ["a", "b", "D"]:
      ruta = ruta_mas_corta(mapa, tuple(robot.posicion), letra)
      robot.marcar(ruta)
      robot.seguir_ruta(ruta)
      if letra != "D":
          robot.tomar()
  robot.entregar("tela y botones")
hints:
  - "Es el BFS con `padre` de la sesión 10, dentro de un `def`: en vez de una meta fija, para cuando la casilla que sale de la cola tenga la `letra` buscada."
  - "Después de cada tramo, Quilla está donde terminó la ruta: la siguiente búsqueda sale de `tuple(robot.posicion)`."
world:
  theme: barranco
  level: 2
  dir: E
  api: [move, deliver, map, path, cargo]
  items: { a: tela, b: botones }
  battery: 100
  map: |
    #########################
    #R....#................a#
    ###.#.#.###.#####.#####.#
    #...#.#.#.......#...#.#.#
    #.#...#.#.###.#.###.#...#
    #.#...#.#.....#...#.#...#
    #.#######.###.###.....###
    #.......#.#...#...#.#.#.#
    #.##..#.###.###.###.#...#
    #.....#.....#.#.#...#.#.#
    ########.##.#.#.###...#.#
    #b.....................D#
    #########################
scenarios:
  - {}
  - map: |
      #########################
      #...#...............#..b#
      ###.#.##.######.#...###.#
      #.............#...#.....#
      #.####.####.#.###.#.###.#
      #..........R#...#...#...#
      ########.######.#.#.###.#
      #...#.......#D..#.#.....#
      #.###.#...###.#######.#.#
      #.#...#.......#.......#.#
      #.#.#.#.###.#####.#####.#
      #a................#.....#
      #########################
    world: { dir: W, battery: 76 }
  - map: |
      #########################
      #D..#...#....a......#...#
      ###.#...##.#..#####.#.#.#
      #.#.#...#.........#...#.#
      #.#.#.#.#.#####.#######.#
      #.........#.....#.......#
      #.#.#.#######.#.#.#######
      #...#.......#.#.#.......#
      #.#.#.#####...#.######..#
      #b#.#.....#.#.#...#.....#
      #.#.#######......##.#####
      #...........#.#........R#
      #########################
    world: { dir: N, battery: 52 }
tests:
  - name: recoge la tela y luego los botones
    state: 'w.inventory == ["tela", "botones"]'
    msg: Quilla tiene que tomar la tela (a) primero y los botones (b) después.
  - name: llega al taller y entrega
    state: 'w.at_goal and w.delivered == ["tela y botones"]'
    msg: Si se quedó sin batería, algún tramo no era el más corto.
  - name: sin chocar
    state: not w.crashed
  - name: busca con una deque
    source: '\bdeque\b'
  - name: la búsqueda es una función
    source: '\bdef\s+\w+\s*\('
    msg: Escribe la búsqueda una sola vez, en un def, y llámala para cada tramo.
```

## Reto experto

```exercise
id: py20-reto-dijkstra
type: challenge
title: El camino con menos gente
prompt: |
  **Escribe `camino_mas_barato(galeria)`, que devuelve el menor costo total para ir de la esquina de arriba a la izquierda a la de abajo a la derecha.** Para quien ya programa.

  `galeria` es una lista de textos de dígitos del `1` al `9`: cuánta gente hay en cada casilla, que es lo que **cuesta entrar** en ella. La casilla de salida no se cobra. Se camina a las vecinas de arriba, abajo, izquierda y derecha.

  Un BFS encuentra el camino con menos pasos, no el más barato. Usa Dijkstra: un heap de `(costo, x, y)` del que siempre sacas la casilla pendiente más barata. Una de las pruebas es una galería de 80 × 80.
visual:
  figure:
    input: { label: galeria, text: "131\n191\n111" }
    arrow: "abajo, abajo, derecha, derecha: 1 + 1 + 1 + 1"
    output: { label: devuelve, value: "4" }
starter: |
  def camino_mas_barato(galeria):
      return 0


  print(camino_mas_barato(["131", "191", "111"]))
solution: |
  import heapq


  def camino_mas_barato(galeria):
      """El menor costo de la esquina de arriba a la izquierda a la de abajo a la derecha."""
      alto, ancho = len(galeria), len(galeria[0])
      mejor = {(0, 0): 0}
      pendientes = [(0, 0, 0)]
      while pendientes:
          costo, x, y = heapq.heappop(pendientes)
          if (x, y) == (ancho - 1, alto - 1):
              return costo
          if costo > mejor[(x, y)]:
              continue
          for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              if 0 <= nx < ancho and 0 <= ny < alto:
                  nuevo = costo + int(galeria[ny][nx])
                  if nuevo < mejor.get((nx, ny), nuevo + 1):
                      mejor[(nx, ny)] = nuevo
                      heapq.heappush(pendientes, (nuevo, nx, ny))
      return -1


  print(camino_mas_barato(["131", "191", "111"]))
hints:
  - "Guarda en `mejor` el menor costo conocido de cada casilla; cuando sacas del heap una entrada más cara que `mejor`, es vieja: sáltala."
  - "La primera vez que sale del heap la esquina final, su costo ya es el menor."
tests:
  - name: el ejemplo
    run: 'camino_mas_barato(["131", "191", "111"])'
    equals: 4
  - name: una sola casilla no cuesta nada
    run: 'camino_mas_barato(["7"])'
    equals: 0
  - name: el camino corto no es el barato
    run: 'camino_mas_barato(["19", "11"])'
    equals: 2
  - name: un rodeo largo
    run: 'camino_mas_barato(["1999", "1919", "1119", "9911"])'
    equals: 6
  - name: dos caminos parecidos
    run: 'camino_mas_barato(["12", "34"])'
    equals: 6
  - name: la galería grande
    run: 'camino_mas_barato(["".join(str((x * 7 + y * 3) % 9 + 1) for x in range(80)) for y in range(80)])'
    equals: 505
  - name: usa heapq
    source: '\bheapq\b'
```

Esa misma noche, el reporte de doña Felícita terminó en cuatro segundos. Ella no entendió qué era un set, pero entendió que a las cinco de la mañana ya estaba cortando tela, y le regaló a Quilla un polo bordado con su nombre.

De vuelta en Chucuito, Maru encontró a Quilla mirando el mar desde la puerta de Loop. Veinte sesiones atrás era un robot recién salido de la caja que solo sabía avanzar y entregar alfajores; ahora lee archivos, espera servidores, atrapa errores y mide lo que hace. "Ya no necesitas que te diga qué escribir", le dijo Maru. "Ahora te toca a ti decidir qué programa vale la pena". Quilla encendió su sirena, una sola vez, bajito. **Fin del curso de Python.**
