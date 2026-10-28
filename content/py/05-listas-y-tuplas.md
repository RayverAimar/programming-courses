# Sesión 5 — Listas y tuplas

## El encargo

Maru mandó a Quilla al norte, a Huanchaco, donde los pescadores todavía salen al mar en **caballitos de totora**, como hace dos mil años. La cooperativa de don Nicanor Ucañán tiene un problema moderno: cada mañana llegan diez, quince caballitos con su pesca, y nadie sabe en qué orden llegaron, cuánto trajo cada uno ni a quién le toca la siguiente caja de hielo.

Doña Felícita, la tesorera, apunta todo en un cuaderno con las hojas mojadas. Quilla ya sabe guardar un valor en una variable; hoy aprende a guardar **muchos en fila**: la lista de cajas, la fila de caballitos en la arena, los pares de kilos y pescador. Y aprende algo que doña Felícita aprendió a la mala: que dos nombres pueden apuntar al mismo cuaderno.

```escena
theme: barranco
level: 2
dir: E
caption: Quilla baja por el muelle de Huanchaco hasta la caseta de la cooperativa, donde la espera doña Felícita.
map: |
  ############
  #R....######
  #####.....D#
  ############
program: |
  robot.avanzar(4)
  robot.girar_derecha()
  robot.avanzar(1)
  robot.girar_izquierda()
  robot.avanzar(5)
  robot.decir("Traje una lista")
  robot.entregar("Cuaderno nuevo")
```

## Lo mínimo

Una **lista** guarda varios valores en orden, entre corchetes. Cada uno tiene una **posición** (su índice) que empieza en **0**. Los índices **negativos** cuentan desde el final: `-1` es el último. Y una **tajada** (`lista[a:b]`) copia el tramo que va desde `a` hasta **antes** de `b`; un tercer número, `lista[a:b:paso]`, salta de a varios.

```py run
caballitos = ["Nico", "Tato", "Lucho", "Pepe", "Moncho"]
print(caballitos[0], caballitos[-1], len(caballitos))
print(caballitos[1:3], caballitos[:2], caballitos[3:])
print(caballitos[::2], caballitos[::-1])
```

Mira la fila de caballitos: el recuadro resaltado es el que se está leyendo en cada paso.

```anima
title: Índices y tajadas
code: |
  fila = ["Nico", "Tato", "Lucho", "Pepe", "Moncho"]
  leido = fila[0]
  leido = fila[2]
  leido = fila[-1]
  leido = fila[-2]
  tramo = fila[1:4]
  pares = fila[::2]
cells: { of: fila, at: leido }
notes:
  2: "El índice 0 es el primero de la fila."
  3: "El índice 2 es el tercero: se cuenta desde 0."
  4: "-1 es el último, sin tener que saber cuántos hay."
  5: "-2 es el penúltimo."
  6: "fila[1:4] copia los índices 1, 2 y 3. El 4 no entra."
  7: "Con paso 2 toma uno sí y uno no, empezando por el 0."
```

Una lista **cambia**: se le agregan y se le quitan cosas.

- `append(x)` agrega al final; `insert(i, x)` mete `x` en la posición `i` y corre a los demás.
- `pop()` saca el último y lo devuelve; `pop(i)` saca el de la posición `i`. `remove(x)` borra el primer `x` que encuentre.
- `x in lista` pregunta si está: `True` o `False`.
- `len`, `sum`, `min` y `max` resumen una lista de números.
- `lista.sort()` **ordena la misma lista** y no devuelve nada; `sorted(lista)` **devuelve una lista nueva** ordenada y deja la original como estaba.

```py run
kilos = [12, 7, 20, 7]
kilos.append(15)
primera = kilos.pop(0)
print(primera, kilos, 20 in kilos)
print(sorted(kilos), kilos, sum(kilos), min(kilos), max(kilos))
```

> **Trampa común:** `kilos = kilos.sort()` deja `kilos` en `None`. `sort()` ordena la lista en su sitio y devuelve `None`, y esa línea guarda justamente ese `None`. Escribe `kilos.sort()` solo, o `ordenados = sorted(kilos)` si quieres conservar la original.

Ahora lo más importante de hoy, y es lo que ya viste en la sesión 1: un nombre es una etiqueta, no una caja. Con una lista se nota: la variable no **contiene** la lista, la **señala**. Si escribes `otra = cuaderno`, no sacas una fotocopia; le pegas un segundo nombre al mismo cuaderno. Para tener una lista aparte, cópiala con `.copy()`.

```anima
title: Dos nombres, una sola lista
code: |
  cuaderno = [31, 17, 44]
  otra = cuaderno
  copia = cuaderno.copy()
  otra.append(52)
  print(cuaderno, copia)
  print(otra is cuaderno, copia is cuaderno)
show: [cuaderno, otra, copia]
refs: all
caption: "`is` pregunta si dos nombres llegan al mismo cuadro: si sus flechas terminan en el mismo objeto."
notes:
  1: "cuaderno señala una lista con tres números."
  2: "otra no es una lista nueva: es una segunda flecha al mismo cuaderno."
  3: "copia sí es una lista nueva, con los mismos valores y su propia flecha."
  4: "Se agrega por otra… y cuaderno cambia también, porque es la misma lista."
  6: "is pregunta si dos nombres señalan el mismo objeto: True para otra, False para copia."
```

Una **tupla** es como una lista que no cambia: va entre paréntesis (o solo con comas) y sirve para datos que viajan juntos, como `(kilos, pescador)`. Las tuplas y las listas se **desempaquetan**: cada valor va a su nombre, y un nombre con `*` se lleva lo que sobra. Así también se intercambian dos variables, sin una auxiliar.

```py run
pesada = (18, "Tato")
kilos, pescador = pesada
primero, *resto = [9, 4, 12, 6]
a, b = "Nico", "Lucho"
a, b = b, a
print(pescador, kilos, primero, resto, a, b)
```

<!-- legacy: list-copy -->

<!-- legacy: unpacking-star -->

<!-- legacy: sorted -->

<!-- mdn: list-copy unpacking-star sorted -->

## Práctica

```exercise
id: py5-predice-tajadas
type: predict
title: La fila en la arena
prompt: |
  Los caballitos quedan apoyados en la arena en el orden en que llegaron. ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: fila, cells: ["Nico", "Tato", "Lucho", "Pepe", "Moncho", "Chalo"] }
code: |
  fila = ["Nico", "Tato", "Lucho", "Pepe", "Moncho", "Chalo"]
  print(fila[-2], fila[2])
  print(fila[1:4])
  print(fila[::3])
options:
  - "Moncho Lucho\n['Tato', 'Lucho', 'Pepe']\n['Nico', 'Pepe']"
  - "Moncho Tato\n['Tato', 'Lucho', 'Pepe']\n['Nico', 'Pepe']"
  - "Moncho Lucho\n['Tato', 'Lucho', 'Pepe', 'Moncho']\n['Nico', 'Pepe']"
  - "Pepe Lucho\n['Tato', 'Lucho', 'Pepe']\n['Lucho', 'Chalo']"
answer: "Moncho Lucho\n['Tato', 'Lucho', 'Pepe']\n['Nico', 'Pepe']"
explain: |
  `-2` es el penúltimo (Moncho) y `2` es el tercero (Lucho), porque se cuenta desde 0. `[1:4]` toma los índices 1, 2 y 3: el 4 no entra. `[::3]` empieza en 0 y salta de tres en tres: índices 0 y 3.
```

```exercise
id: py5-predice-copia
type: predict
title: El cuaderno de doña Felícita
prompt: |
  Doña Felícita le pasa su lista de cajas a Quilla para que "trabaje sobre una copia". ¿Qué imprime?
code: |
  cajas = [31, 17, 44]
  de_quilla = cajas
  respaldo = cajas.copy()
  de_quilla.remove(17)
  respaldo.append(60)
  print(cajas)
  print(len(de_quilla), len(respaldo))
options:
  - "[31, 44]\n2 4"
  - "[31, 17, 44]\n2 4"
  - "[31, 44, 60]\n2 4"
  - "[31, 44]\n2 3"
answer: "[31, 44]\n2 4"
explain: |
  `de_quilla = cajas` no copia nada: son dos nombres para la misma lista, así que quitar el 17 por `de_quilla` lo quita del cuaderno de doña Felícita. `respaldo` sí es otra lista: el 60 solo le llega a ella, que queda con 4 cajas.
```

```exercise
id: py5-predice-ordenar
type: predict
title: Ordenar sin perder la lista
prompt: |
  Quilla quiere ver los kilos de menor a mayor. ¿Qué imprime?
code: |
  kilos = [14, 9, 22]
  ordenados = sorted(kilos)
  print(kilos, ordenados)
  resultado = kilos.sort()
  print(kilos, resultado)
options:
  - "[14, 9, 22] [9, 14, 22]\n[9, 14, 22] None"
  - "[9, 14, 22] [9, 14, 22]\n[9, 14, 22] [9, 14, 22]"
  - "[14, 9, 22] [9, 14, 22]\n[14, 9, 22] [9, 14, 22]"
  - "[14, 9, 22] [9, 14, 22]\n[9, 14, 22] [9, 14, 22]"
answer: "[14, 9, 22] [9, 14, 22]\n[9, 14, 22] None"
explain: |
  `sorted()` devuelve una lista nueva y no toca `kilos`. `kilos.sort()` sí la ordena en su sitio, pero devuelve `None`: por eso `resultado` queda vacío de valor.
```

```exercise
id: py5-completa-hielo
type: complete
title: La cola del hielo
prompt: |
  En la caseta hay una cola para las cajas de hielo. Completa los `___` para que pase esto, en orden:

  1. llega **Chalo** y se pone al final;
  2. a **Moncho**, que trae pesca para la escuela, lo meten adelante de todos (posición 0);
  3. se atiende al **primero** de la cola, que queda guardado en `atendido`;
  4. **Pepe** se cansa y se va de la cola.
visual:
  figure:
    input: { label: "cola al empezar", cells: ["Tato", "Pepe", "Lucho"] }
    arrow: "append, insert, pop(0), remove"
    output: { label: "cola al final", cells: ["Tato", "Lucho", "Chalo"] }
starter: |
  cola = ["Tato", "Pepe", "Lucho"]
  cola.___("Chalo")
  cola.insert(___, "Moncho")
  atendido = cola.___
  cola.___("Pepe")
  print(atendido, cola)
solution: |
  cola = ["Tato", "Pepe", "Lucho"]
  cola.append("Chalo")
  cola.insert(0, "Moncho")
  atendido = cola.pop(0)
  cola.remove("Pepe")
  print(atendido, cola)
hints:
  - "`pop()` sin nada saca el **último**; para sacar el primero, dile la posición: `pop(0)`."
  - "`remove` busca por **valor** (\"Pepe\"), no por posición."
tests:
  - name: atendieron a Moncho
    expect: 'atendido == "Moncho"'
  - name: la cola queda Tato, Lucho, Chalo
    expect: 'cola == ["Tato", "Lucho", "Chalo"]'
  - name: imprime al atendido y la cola
    output: "Moncho ['Tato', 'Lucho', 'Chalo']"
```

```exercise
id: py5-arregla-ultimo
type: fix
title: La última caja
prompt: |
  Quilla quiere anunciar cuántos kilos trajo **el último** caballito que llegó, y el programa se cae con un `IndexError`. Ejecútalo, lee el error y arréglalo para que funcione con cualquier cantidad de caballitos (no escribas `kilos[3]`).
starter: |
  kilos = [12, 7, 20, 15]
  ultimo = kilos[len(kilos)]
  print(f"El último trajo {ultimo} kilos")
solution: |
  kilos = [12, 7, 20, 15]
  ultimo = kilos[-1]
  print(f"El último trajo {ultimo} kilos")
hints:
  - "Con 4 elementos, los índices van de 0 a 3. `len(kilos)` es 4: una posición que no existe."
  - "El índice `-1` siempre es el último."
tests:
  - name: ultimo es 15
    expect: ultimo == 15
  - name: anuncia los kilos
    output: El último trajo 15 kilos
  - name: no usa un índice fijo
    sourceNot: 'kilos\[\s*3\s*\]'
    msg: Usa un índice que sirva para cualquier largo, como -1.
```

```exercise
id: py5-predice-desempaca
type: predict
title: La pesada del día
prompt: |
  Cada pesada llega como una tupla. ¿Qué imprime?
code: |
  pesada = ("Lucho", 9, 14, 6, 11)
  pescador, primera, *resto = pesada
  mayor, menor = max(resto), min(resto)
  mayor, menor = menor, mayor
  print(pescador, primera, resto, mayor)
options:
  - "Lucho 9 [14, 6, 11] 6"
  - "Lucho 9 [14, 6, 11] 14"
  - "Lucho 9 (14, 6, 11) 6"
  - "Lucho 9 14 6"
answer: "Lucho 9 [14, 6, 11] 6"
explain: |
  `pescador` toma el primero, `primera` el segundo, y `*resto` se lleva todo lo demás **como lista**, aunque venga de una tupla. Después `mayor, menor = menor, mayor` los intercambia: `mayor` termina valiendo 6.
```

```exercise
id: py5-escribe-resumen
type: write
title: El resumen del caballito
prompt: |
  Escribe `resumen(kilos)`, que recibe los kilos de cada caja de un caballito y **devuelve una tupla** `(cajas, total, mayor)`: cuántas cajas trajo, cuántos kilos suman y cuánto pesó la más pesada. Si no trajo nada, devuelve `(0, 0, 0)`.

  Después, desempaqueta el resultado de `resumen([12, 7, 20])` en tres variables e imprime `3 cajas, 39 kg, la mayor de 20`.
visual:
  figure:
    input: { label: kilos, cells: [12, 7, 20] }
    arrow: "len, sum, max"
    output: { label: devuelve, value: "(3, 39, 20)" }
starter: |
  def resumen(kilos):
      return 0

solution: |
  def resumen(kilos):
      if not kilos:
          return 0, 0, 0
      return len(kilos), sum(kilos), max(kilos)


  cajas, total, mayor = resumen([12, 7, 20])
  print(f"{cajas} cajas, {total} kg, la mayor de {mayor}")
hints:
  - "`return len(kilos), sum(kilos), max(kilos)` ya devuelve una tupla: las comas la arman."
  - "`max([])` da un error: pregunta antes si la lista está vacía (`if not kilos:`)."
tests:
  - name: tres cajas
    run: resumen([12, 7, 20])
    equals: [3, 39, 20]
  - name: una sola caja
    run: resumen([8])
    equals: [1, 8, 8]
  - name: sin pesca
    run: resumen([])
    equals: [0, 0, 0]
  - name: devuelve una tupla
    expect: type(resumen([5, 1])) == tuple
    msg: Devuelve los tres valores separados por comas, sin corchetes.
  - name: imprime el resumen
    output: 3 cajas, 39 kg, la mayor de 20
  - name: desempaqueta en tres variables
    source: '^\w+\s*,\s*\w+\s*,\s*\w+\s*=\s*resumen\('
```

## El caso

```exercise
id: py5-caso-caja
type: case
title: La caja que se movió
prompt: |
  **Después del trabajo de cada robot, imprime qué caja quedó primera en `registro` y compárala con lo que ese robot dice que vio.** Uno de ellos movió las cajas del registro original.

  En el `registro` de la cooperativa, las cajas del día van en el orden en que llegaron, y la primera, la **31**, es la de don Nicanor: la que se vende primero en el mercado. Al cerrar, la caja 31 ya no estaba primera y don Nicanor perdió su turno. Cuatro robots ayudantes usaron el registro esa mañana, uno tras otro, y todos juran que trabajaron sobre **su propia copia**.

  El código de cada robot está en el editor, tal como lo escribieron. Después de cada bloque imprime una línea que empiece con su nombre, como `print("Cojinova:", registro[0])`, y el tablero te dirá quién no cuadra. Si después de un robot sigues sin entender por qué, imprime el `registro` entero.
visual:
  board:
    for: py5-caso-caja
    task: "Después de cada bloque, imprime registro[0]. Lo que dice cada robot es lo que vio en el registro al terminar."
    cards:
      - name: Cojinova
        kind: robot
        role: Ordena las cajas para la balanza
        rows: [["Hizo", "su lista ordenada por número"], ["Dice que registro[0] quedó en", "31"]]
        clue: { find: "Cojinova", says: 31, saysLabel: Dice }
      - name: Lorna
        kind: robot
        culprit: true
        role: Arma la fila del mercado
        rows: [["Hizo", "subió la última caja adelante"], ["Dice que registro[0] quedó en", "31"]]
        clue: { find: "Lorna", says: 31, saysLabel: Dice }
      - name: Pejerrey
        kind: robot
        role: Revisa del final al principio
        rows: [["Hizo", "su lista al revés"], ["Dice que registro[0] quedó en", "28"], ["Comentó", "\"Cuando llegué, la 28 ya estaba primera\""]]
        clue: { find: "Pejerrey", says: 28, saysLabel: Dice }
      - name: Chita
        kind: robot
        role: Anota las cajas que llegan tarde
        rows: [["Hizo", "agregó la caja 60 a su lista"], ["Dice que registro[0] quedó en", "28"]]
        clue: { find: "Chita", says: 28, saysLabel: Dice }
      - name: Registro de la mañana
        kind: note
        role: Así lo dejó doña Felícita
        rows: [["Orden de llegada", "31, 17, 44, 52, 28"], ["Primera caja", "31 (don Nicanor)"]]
starter: |
  registro = [31, 17, 44, 52, 28]

  # Cojinova
  lista_cojinova = registro.copy()
  lista_cojinova.sort()
  # TODO: imprime "Cojinova:" y registro[0]

  # Lorna
  lista_lorna = registro
  ultima = lista_lorna.pop()
  lista_lorna.insert(0, ultima)
  # TODO: imprime "Lorna:" y registro[0]

  # Pejerrey
  lista_pejerrey = registro[:]
  lista_pejerrey.reverse()
  # TODO: imprime "Pejerrey:" y registro[0]

  # Chita
  lista_chita = list(registro)
  lista_chita.append(60)
  # TODO: imprime "Chita:" y registro[0]
solution: |
  registro = [31, 17, 44, 52, 28]

  lista_cojinova = registro.copy()
  lista_cojinova.sort()
  print("Cojinova:", registro[0])

  lista_lorna = registro
  ultima = lista_lorna.pop()
  lista_lorna.insert(0, ultima)
  print("Lorna:", registro[0])

  lista_pejerrey = registro[:]
  lista_pejerrey.reverse()
  print("Pejerrey:", registro[0])

  lista_chita = list(registro)
  lista_chita.append(60)
  print("Chita:", registro[0])
answer: Lorna
answerLabel: ¿Qué robot movió las cajas del registro?
reveal: |
  Lorna. `lista_lorna = registro` no copió nada: le puso otro nombre al mismo registro. Al sacar la caja 28 del final y meterla en la posición 0, la movió en el cuaderno de doña Felícita. Cojinova (`.copy()`), Pejerrey (`[:]`) y Chita (`list(...)`) sí trabajaron sobre copias; Pejerrey y Chita solo contaron lo que encontraron.
hints:
  - "Busca la línea de cada robot que crea su lista: `.copy()`, `[:]` y `list(...)` hacen una lista nueva; un `=` solo, no."
  - "Si imprimes `registro` completo después de Lorna verás `[28, 31, 17, 44, 52]`."
```

## El juez

Como en la sesión 4, el juez **llama a tu función** con distintos argumentos y compara lo que devuelve. Las listas que recibe tu función llegan como listas de Python; si el juez espera una tupla, una lista con los mismos valores también vale.

```exercise
id: py5-juez-rotar
type: judge
mode: function
function: correr_fila
title: La marea corre la fila
prompt: |
  **Escribe `correr_fila(fila, k)`, que devuelve cómo queda la fila de caballitos después de `k` mareas.**

  En la playa de Huanchaco los caballitos se apoyan en fila contra el muro. Cada vez que sube la marea, los pescadores corren la fila **un puesto a la derecha**: todos avanzan uno, y el de la punta derecha da la vuelta y queda primero a la izquierda. `fila` va de izquierda a derecha.

  Devuelve una lista nueva; no cambies la que recibes. `k` puede ser más grande que la cantidad de caballitos, y la playa puede estar vacía.

  **Restricciones:** 0 a 30 caballitos · 0 ≤ k ≤ 1000.
visual:
  figure:
    title: El ejemplo 1, marea por marea
    panes:
      - { label: "fila al amanecer", cells: ["Nico", "Tato", "Lucho", "Pepe"] }
      - { label: "después de 1 marea", cells: ["Pepe", "Nico", "Tato", "Lucho"] }
      - { label: "después de 2 mareas: correr_fila devuelve", cells: ["Lucho", "Pepe", "Nico", "Tato"] }
    caption: "Con 4 caballitos, 4 mareas dejan la fila igual: correr 6 es lo mismo que correr `6 % 4 = 2`."
starter: |
  def correr_fila(fila, k):
      return fila
solution: |
  def correr_fila(fila, k):
      if not fila:
          return []
      k = k % len(fila)
      if k == 0:
          return fila.copy()
      return fila[-k:] + fila[:-k]
hints:
  - "Correr `len(fila)` veces deja todo igual, así que basta con `k % len(fila)`. Cuidado: con la fila vacía, `% 0` es un error."
  - "Los últimos `k` pasan adelante: `fila[-k:]` son esos, y `fila[:-k]` todos los demás. Ojo con `k == 0`: `fila[-0:]` es la fila entera."
samples:
  - args: [["Nico", "Tato", "Lucho", "Pepe"], 2]
    returns: ["Lucho", "Pepe", "Nico", "Tato"]
    note: El dibujo de arriba.
  - args: [["Nico", "Tato", "Lucho", "Pepe"], 6]
    returns: ["Lucho", "Pepe", "Nico", "Tato"]
    note: Seis mareas con cuatro caballitos son como dos.
  - args: [["Moncho", "Chalo", "Pepe"], 1]
    returns: ["Pepe", "Moncho", "Chalo"]
edge:
  - args: [[], 5]
    tag: con la playa vacía
  - args: [["Nico", "Tato", "Lucho"], 0]
    tag: cuando no sube la marea
  - args: [["Nico", "Tato", "Lucho"], 3]
    tag: cuando k es igual al largo de la fila
  - args: [["Tato"], 999]
    tag: con un solo caballito
  - args: [["Nico", "Tato", "Lucho", "Pepe", "Moncho"], 7]
    tag: cuando k es más grande que la fila
random:
  count: 40
  seed: 51
  generate: |
    nombres = ["Nico", "Tato", "Lucho", "Pepe", "Moncho", "Chalo", "Beto", "Juancho", "Lalo", "Cucho"]
    n = rng.int(0, 30)
    fila = [rng.pick(nombres) + str(i) for i in range(n)]
    k = rng.int(0, 3 * n + 2) if rng.int(0, 1) == 0 else rng.int(0, 1000)
    return [fila, k]
wrong:
  - |
    def correr_fila(fila, k):
        if not fila:
            return []
        k = k % len(fila)
        return fila[k:] + fila[:k]
  - |
    def correr_fila(fila, k):
        if not fila or k == 0:
            return list(fila)
        return fila[-k:] + fila[:-k]
  - |
    def correr_fila(fila, k):
        k = k % len(fila)
        return fila[-k:] + fila[:-k]
```

```exercise
id: py5-juez-juntar
type: judge
mode: function
function: juntar_pesadas
title: Las dos balanzas
prompt: |
  **Escribe `juntar_pesadas(manana, tarde)`, que junta las pesadas de las dos balanzas en una sola lista ordenada por kilos, de menor a mayor.**

  La cooperativa tiene dos balanzas, y cada una entrega su lista de pesadas **ya ordenada por kilos**. Cada pesada es un par `[kilos, pescador]`. Doña Felícita quiere una sola lista para el mercado, y tiene una regla para los empates: si dos pesadas tienen los mismos kilos, **va primero la de la balanza de la mañana**, y dentro de una misma balanza se respeta el orden en que vinieron (aunque el nombre del pescador no esté en orden alfabético).

  Devuelve una lista de pares (listas o tuplas, da igual).

  **Restricciones:** cada balanza tiene de 0 a 20 pesadas · 1 ≤ kilos ≤ 30.
visual:
  figure:
    title: El ejemplo 1, par por par
    panes:
      - { label: manana, cells: ["(5, Tato)", "(9, Nico)", "(9, Beto)"] }
      - { label: tarde, cells: ["(4, Pepe)", "(9, Ana)", "(12, Lucho)"] }
      - { label: "juntar_pesadas devuelve", cells: ["(4, Pepe)", "(5, Tato)", "(9, Nico)", "(9, Beto)", "(9, Ana)", "(12, Lucho)"], highlight: [2, 3, 4] }
    caption: "Tres pesadas de 9 kilos: primero las dos de la mañana, en su orden (Nico antes que Beto), y después la de la tarde. Ana no va primero aunque su nombre lo esté."
starter: |
  def juntar_pesadas(manana, tarde):
      return manana
solution: |
  def juntar_pesadas(manana, tarde):
      juntas = []
      i = j = 0
      while i < len(manana) and j < len(tarde):
          if manana[i][0] <= tarde[j][0]:
              juntas.append(manana[i])
              i += 1
          else:
              juntas.append(tarde[j])
              j += 1
      juntas.extend(manana[i:])
      juntas.extend(tarde[j:])
      return juntas
hints:
  - "Lleva un dedo en cada lista (`i` y `j`). Compara los kilos de las dos pesadas que señalan, agrega la menor y avanza ese dedo."
  - "En el empate gana la mañana: usa `<=`. Cuando una lista se acaba, lo que queda de la otra va tal cual: `manana[i:]`."
  - "Atajo válido: `sorted(manana + tarde, key=lambda par: par[0])` respeta el orden de los empates. Sin `key`, ordenaría también por nombre."
samples:
  - args: [[[5, "Tato"], [9, "Nico"], [9, "Beto"]], [[4, "Pepe"], [9, "Ana"], [12, "Lucho"]]]
    returns: [[4, "Pepe"], [5, "Tato"], [9, "Nico"], [9, "Beto"], [9, "Ana"], [12, "Lucho"]]
    note: El dibujo de arriba.
  - args: [[[3, "Chalo"], [20, "Moncho"]], [[7, "Lalo"]]]
    returns: [[3, "Chalo"], [7, "Lalo"], [20, "Moncho"]]
edge:
  - args: [[], []]
    tag: sin pesadas en ninguna balanza
  - args: [[], [[2, "Pepe"], [8, "Ana"]]]
    tag: cuando la balanza de la mañana no pesó nada
  - args: [[[6, "Tato"], [6, "Nico"]], []]
    tag: cuando la balanza de la tarde no pesó nada
  - args: [[[10, "Zoila"]], [[10, "Ana"]]]
    tag: con un empate en que el nombre de la tarde va antes en el alfabeto
  - args: [[[1, "Beto"], [2, "Cucho"]], [[25, "Ana"], [30, "Lalo"]]]
    tag: cuando todas las de la mañana pesan menos
random:
  count: 45
  seed: 52
  generate: |
    nombres = ["Ana", "Beto", "Chalo", "Cucho", "Lalo", "Lucho", "Moncho", "Nico", "Pepe", "Tato", "Zoila"]
    tope = rng.pick([5, 10, 30])
    manana = [[k, rng.pick(nombres)] for k in sorted(rng.list(rng.int(0, 20), 1, tope))]
    tarde = [[k, rng.pick(nombres)] for k in sorted(rng.list(rng.int(0, 20), 1, tope))]
    return [manana, tarde]
wrong:
  - |
    def juntar_pesadas(manana, tarde):
        return sorted(manana + tarde)
  - |
    def juntar_pesadas(manana, tarde):
        juntas = []
        i = j = 0
        while i < len(manana) and j < len(tarde):
            if manana[i][0] < tarde[j][0]:
                juntas.append(manana[i])
                i += 1
            else:
                juntas.append(tarde[j])
                j += 1
        juntas.extend(manana[i:])
        juntas.extend(tarde[j:])
        return juntas
  - |
    def juntar_pesadas(manana, tarde):
        juntas = []
        i = j = 0
        while i < len(manana) and j < len(tarde):
            if manana[i][0] <= tarde[j][0]:
                juntas.append(manana[i])
                i += 1
            else:
                juntas.append(tarde[j])
                j += 1
        return juntas
```

## Misión final

```exercise
id: py5-mision-malecon
type: mission
title: Las entregas del malecón
prompt: |
  **Entrega cada pedido en su buzón, recorriendo el malecón una sola vez de oeste a este.**

  Las cevicherías del malecón de Huanchaco le compraron pescado a la cooperativa. Doña Felícita le dio a Quilla la lista `pedidos`, pero la apuntó en el orden en que le **pagaron**, no en el orden de la calle. Cada pedido es un par `[casilla, etiqueta]`: `casilla` es la columna del buzón (la `x` en el mapa) y `etiqueta` lo que hay que entregar.

  Quilla empieza en la casilla `x = 1` mirando al este, y la **batería alcanza justo** para ir hasta el último buzón sin volver. Así que:

  1. ordena los pedidos por casilla (como la casilla va primero en cada par, ordenar los pares ya los ordena por casilla);
  2. recórrelos desempaquetando cada par: `for casilla, etiqueta in …`;
  3. en cada uno, avanza lo que falta hasta esa casilla (`robot.posicion.x` dice dónde estás) y `robot.entregar(etiqueta)`.

  La lista y el malecón cambian en cada prueba.
starter: |
  # pedidos ya existe, por ejemplo:
  # [[10, "Lisa para La Tablita"], [4, "Pejerrey para Don Rafo"], ...]
  print(pedidos)
  robot.avanzar(3)
solution: |
  for casilla, etiqueta in sorted(pedidos):
      robot.avanzar(casilla - robot.posicion.x)
      robot.entregar(etiqueta)
hints:
  - "`sorted(pedidos)` compara los pares por su primer valor, la casilla. No cambia `pedidos`: devuelve una lista nueva."
  - "Si estás en `x = 4` y el buzón está en la casilla 8, hay que avanzar `8 - 4` casillas."
world:
  theme: barranco
  level: 2
  dir: E
  battery: 13
  map: |
    ################
    #R..D...D.D...D#
    ################
globals:
  pedidos: [[10, "Lisa para La Tablita"], [4, "Pejerrey para Don Rafo"], [14, "Lenguado para El Muelle"], [8, "Cachema para Doña Chabuca"]]
scenarios:
  - {}
  - map: |
      ############
      #R.D.....DD#
      ############
    world: { battery: 9 }
    globals: { pedidos: [[9, "Caballa para Mi Choza"], [10, "Bonito para El Caracol"], [3, "Chita para La Ola"]] }
  - map: |
      ##########
      #R......D#
      ##########
    world: { battery: 7 }
    globals: { pedidos: [[8, "Cojinova para Big Ben"]] }
tests:
  - name: entrega todos los pedidos, en el orden de la calle
    state: 'w.delivered == [etiqueta for _, etiqueta in sorted(g["pedidos"])]'
    msg: Las entregas no salieron en orden de casilla. Ordena los pedidos antes de recorrerlos.
  - name: termina en el último buzón
    state: w.at_goal
  - name: sin chocar ni quedarse sin batería
    state: not w.crashed
  - name: ordena con sorted() o sort()
    source: '\bsorted\s*\(|\.sort\s*\('
  - name: desempaqueta cada par en el for
    source: '\bfor\s+\w+\s*,\s*\w+\s+in\b'
    msg: Recorre con for casilla, etiqueta in …, desempaquetando cada par.
```

## Reto experto

```exercise
id: py5-reto-viajes
type: challenge
title: Los viajes del caballito
visual:
  figure:
    title: "cajas = [4, 3, 5, 2, 6], capacidad = 8"
    input: { label: cajas, cells: [4, 3, 5, 2, 6] }
    arrow: "carga en orden hasta que la siguiente no entra"
    output: { label: devuelve, value: "[(2, 7), (2, 7), (1, 6)]" }
    steps:
      - "Viaje 1: 4 + 3 = 7; la caja de 5 ya no entra (serían 12)."
      - "Viaje 2: 5 + 2 = 7; la de 6 no entra."
      - "Viaje 3: solo la de 6."
prompt: |
  **Escribe `viajes(cajas, capacidad)`, que devuelve una lista de tuplas `(cantidad, kilos)`, una por viaje.** Para quien ya programa.

  Un caballito de totora lleva a lo más `capacidad` kilos. Las cajas se cargan **en el orden de la lista**: se suben mientras quepan; cuando la siguiente no entra, el caballito sale con lo que lleva y la siguiente empieza el viaje que sigue. Ninguna caja pesa más que `capacidad`. Sin cajas, no hay viajes. No modifiques la lista que recibes.
starter: |
  def viajes(cajas, capacidad):
      return []


  print(viajes([4, 3, 5, 2, 6], 8))
solution: |
  def viajes(cajas, capacidad):
      salidas = []
      cantidad, kilos = 0, 0
      for caja in cajas:
          if kilos + caja > capacidad:
              salidas.append((cantidad, kilos))
              cantidad, kilos = 0, 0
          cantidad, kilos = cantidad + 1, kilos + caja
      if cantidad:
          salidas.append((cantidad, kilos))
      return salidas


  print(viajes([4, 3, 5, 2, 6], 8))
hints:
  - "Lleva el viaje en curso como dos valores, `cantidad, kilos`, y ciérralo (append de la tupla) cuando la caja que viene no entra."
  - "Al terminar el `for`, el último viaje sigue abierto: agrégalo si llevaba algo."
tests:
  - name: el ejemplo del dibujo
    run: viajes([4, 3, 5, 2, 6], 8)
    equals: [[2, 7], [2, 7], [1, 6]]
  - name: todo entra en un viaje
    run: viajes([1, 2, 3], 10)
    equals: [[3, 6]]
  - name: cajas que llenan justo
    run: viajes([5, 5, 10, 3], 10)
    equals: [[2, 10], [1, 10], [1, 3]]
  - name: sin cajas
    run: viajes([], 8)
    equals: []
  - name: una caja por viaje
    run: viajes([7, 7, 7], 7)
    equals: [[1, 7], [1, 7], [1, 7]]
  - name: devuelve tuplas
    expect: 'all(type(v) == tuple for v in viajes([2, 9, 4], 10))'
    msg: Cada viaje es una tupla (cantidad, kilos), no una lista.
  - name: no modifica la lista que recibe
    expect: '(lambda c: (viajes(c, 5), c)[1] == [3, 3, 1])([3, 3, 1])'
```
