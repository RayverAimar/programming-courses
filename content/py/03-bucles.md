# Sesión 3 — Bucles

## El encargo

En Cerro de Pasco, a más de cuatro mil metros, hace un frío que corta y la mina San Expedito acaba de reabrir un socavón que llevaba años cerrado. La capataz, **doña Eulalia Ticse**, llamó a Maru: necesita que alguien recorra las galerías, recoja los cristales de cuarzo que la roca fue soltando y diga cuántos hay. Nadie se acuerda de cuánto miden los túneles.

Maru le atornilló a Quilla una **lámpara en la cabeza** y lo subió al bus de Lima a Cerro. El problema no es la oscuridad: es que Quilla no sabe cuántos pasos dar. Hoy le enseñas a **repetir** sin contar a mano: "mientras no haya roca adelante, avanza y recoge".

```escena
theme: mina
level: 3
dir: E
caption: El primer socavón de San Expedito. Quilla repite lo mismo en cada casilla (avanzar, recoger) hasta que la roca le cierra el paso, y reporta el total.
map: |
  ############
  ############
  #R.3..2..4D#
  ############
  ############
program: |
  total = 0
  while not robot.hay_pared():
      robot.avanzar()
      total += robot.recoger()
  robot.reportar(total)
```

## Lo mínimo

Un **bucle** repite un bloque de código. Python tiene dos:

- **`while condición:`** repite *mientras* la condición sea verdadera. Sirve cuando no sabes cuántas vueltas habrá: "mientras no haya pared".
- **`for variable in …:`** da una vuelta por cada elemento de algo que se pueda recorrer: una lista, un texto, o un `range`, que es una secuencia de números.

```py run
for metros in range(0, 200, 50):
    print("Quilla baja a", metros, "m")
lampara = 3
while lampara > 0:
    print("Lámpara:", lampara)
    lampara -= 1
```

`range(a, b, paso)` cuenta desde `a` **hasta antes de `b`**, de `paso` en `paso`: `range(0, 200, 50)` da 0, 50, 100 y 150, pero no 200. Con un solo número, `range(5)` es 0, 1, 2, 3, 4; y el paso puede ser negativo: `range(10, 0, -3)` es 10, 7, 4, 1.

Dale a ▶ y mira cómo el `while` revisa la condición **antes** de cada vuelta:

```anima
title: Un while pregunta antes de cada vuelta
code: |
  bateria = 40
  viajes = 0
  while bateria >= 15:
      bateria -= 15
      viajes += 1
  print(viajes, bateria)
notes:
  3: Antes de cada vuelta, Python pregunta otra vez. Si es falso, salta al final.
  4: "bateria -= 15 es lo mismo que bateria = bateria - 15."
  5: Un contador suma uno en cada vuelta.
  6: Con 10 de batería, 10 >= 15 es falso y el bucle terminó.
```

Lo que necesitas para hoy:

- **Acumuladores y contadores.** Una variable que empieza en `0` antes del bucle y crece adentro: `total += veta` suma, `vacias += 1` cuenta. En Python no existe `++`.
- **`break`** sale del bucle en ese momento; **`continue`** salta lo que queda de esta vuelta y pasa a la siguiente.
- **`for … else`.** El `else` de un bucle corre solo si el bucle terminó **sin** `break`: "busqué y no encontré".
- **Bucles anidados.** Un bucle dentro de otro: por cada vuelta del de afuera, el de adentro da todas las suyas.

```anima
title: continue se salta una vuelta, break corta el bucle
code: |
  muestras = [6, 0, 9, 15, 4]
  plata = 0
  for muestra in muestras:
      if muestra == 0:
          continue
      if muestra > 12:
          break
      plata += muestra
  print(plata)
cells: { of: muestras, at: muestra }
notes:
  5: Una muestra vacía no se suma; continue pasa directo a la siguiente.
  7: Una muestra de más de 12 es otra veta; break sale del bucle y el 4 nunca se mira.
  8: "El acumulador: plata crece en cada vuelta que llega hasta aquí."
```

> **Trampa común:** el bucle que nunca termina. Si nada dentro del `while` cambia su condición, se repite para siempre: `while lampara > 0: print(lampara)` sin el `lampara -= 1` no para nunca. Lo mismo pasa si la línea que cambia la condición queda **sin sangría**, fuera del bloque. El Taller lo corta a los pocos segundos (y Quilla, a las 3000 acciones), pero en tu computadora el programa se queda colgado.

<!-- legacy: for-range -->

<!-- mdn: for-range for-else -->

## Práctica

```exercise
id: py3-predice-lampara
type: predict
title: La lámpara de carburo
prompt: |
  Cada vuelta por la galería gasta 12 de batería. ¿Qué imprime?
code: |
  bateria = 50
  vueltas = 0
  while bateria > 0:
      bateria -= 12
      vueltas += 1
  print(vueltas, bateria)
options:
  - "5 -10"
  - "4 2"
  - "5 2"
  - "4 -10"
answer: "5 -10"
explain: |
  La condición se revisa **antes** de cada vuelta, no a la mitad. 50 → 38 → 26 → 14 → 2: con 2, `2 > 0` todavía es verdadero, así que hay una quinta vuelta y la batería termina en -10. Recién entonces `-10 > 0` es falso.
```

```exercise
id: py3-predice-rango
type: predict
title: Los niveles del pique
prompt: |
  Quilla anota la profundidad de cada nivel que visita. ¿Qué imprime?
code: |
  total = 0
  for nivel in range(100, 400, 100):
      total += nivel
  print(total, nivel)
options:
  - "600 300"
  - "1000 400"
  - "600 400"
  - "1000 300"
answer: "600 300"
explain: |
  `range(100, 400, 100)` da 100, 200 y 300: el 400 no entra, porque el final de un `range` nunca se incluye. `total` acumula 100 + 200 + 300 = 600, y después del bucle `nivel` se queda con el último valor que tomó: 300.
```

```exercise
id: py3-completa-escalera
type: complete
title: Las paradas del ascensor
prompt: |
  El ascensor de la mina para **cada 40 metros**, desde los 40 m hasta los **200 m** (incluidos). Completa el bucle para que imprima cada parada y cuente cuántas son.
starter: |
  paradas = 0
  for metros in range(___, ___, ___):
      print(f"Parada a {metros} m")
      paradas ___ 1
  print("Paradas:", paradas)
solution: |
  paradas = 0
  for metros in range(40, 201, 40):
      print(f"Parada a {metros} m")
      paradas += 1
  print("Paradas:", paradas)
hints:
  - "`range(inicio, fin, paso)`: el fin nunca se incluye. Si quieres que 200 entre, el fin tiene que ser algo mayor que 200."
  - El contador crece de uno en uno con `+=`.
tests:
  - name: imprime las cinco paradas y el conteo
    output: "Parada a 40 m\nParada a 80 m\nParada a 120 m\nParada a 160 m\nParada a 200 m\nParadas: 5"
  - name: paradas vale 5
    expect: paradas == 5
  - name: usa range con paso
    source: 'range\(\s*40\s*,\s*\d+\s*,\s*40\s*\)'
    msg: Usa range(40, …, 40) para que el bucle cuente de 40 en 40.
```

```exercise
id: py3-predice-muestras
type: predict
title: La muestra de la veta rica
prompt: |
  Quilla revisa las muestras de roca en orden. Antes de ejecutarlo: ¿qué imprime?
code: |
  muestras = [3, 0, 7, 0, 12, 5]
  for muestra in muestras:
      if muestra == 0:
          continue
      if muestra > 10:
          print("¡Veta rica!", muestra)
          break
      print("muestra", muestra)
  else:
      print("sin veta rica")
options:
  - "muestra 3\nmuestra 7\n¡Veta rica! 12"
  - "muestra 3\nmuestra 7\n¡Veta rica! 12\nsin veta rica"
  - "muestra 3\nmuestra 0\nmuestra 7\nmuestra 0\n¡Veta rica! 12"
  - "muestra 3\nmuestra 7\n¡Veta rica! 12\nmuestra 5"
answer: "muestra 3\nmuestra 7\n¡Veta rica! 12"
explain: |
  Los ceros hacen `continue`: se saltan el resto de la vuelta y no se imprimen. Con el 12, `break` corta el bucle, así que el 5 nunca se mira. Y como el bucle terminó **con** `break`, el `else` no corre.
```

```exercise
id: py3-escribe-veta-rica
type: write
title: La primera veta rica
prompt: |
  Busca en `muestras` la **primera** con 100 gramos de plata o más e imprime `Veta rica en la muestra N` (contando desde 1), o `Sin veta rica` si ninguna llega.

  Doña Eulalia solo quiere saber dónde empezar a picar: apenas encuentres una, deja de buscar con `break`. Usa el `else` del `for` para el caso en que no hubo ninguna. La lista cambia en cada prueba.
visual:
  figure:
    input: { label: "muestras (ejemplo)", cells: [40, 85, 120, 300], highlight: [2] }
    arrow: la primera con 100 o más
    output: { label: Salida, text: "Veta rica en la muestra 3" }
starter: |
  # muestras ya existe
  numero = 0
  print(muestras)
solution: |
  numero = 0
  for muestra in muestras:
      numero += 1
      if muestra >= 100:
          print(f"Veta rica en la muestra {numero}")
          break
  else:
      print("Sin veta rica")
hints:
  - Un contador `numero` que sube en cada vuelta te dice en qué muestra vas.
  - "El `else` va a la misma altura que el `for`, no que el `if`: corre solo si el bucle llegó al final sin `break`."
globals:
  muestras: [40, 85, 120, 300]
scenarios:
  - tests:
      - name: "[40, 85, 120, 300] → la 3"
        output: Veta rica en la muestra 3
  - globals: { muestras: [10, 20, 30] }
    tests:
      - name: "[10, 20, 30] → ninguna"
        output: Sin veta rica
  - globals: { muestras: [150] }
    tests:
      - name: "[150] → la 1"
        output: Veta rica en la muestra 1
  - globals: { muestras: [99, 100, 500] }
    tests:
      - name: "[99, 100, 500] → la 2 (100 ya cuenta)"
        output: Veta rica en la muestra 2
tests:
  - name: deja de buscar con break
    source: '\bbreak\b'
    msg: Apenas la encuentres, sal del bucle con break.
```

```exercise
id: py3-escribe-pilares
type: write
title: Los pilares de cada nivel
prompt: |
  Imprime una línea por nivel con el código de cada cámara de ese nivel: `N1-C1 N1-C2 N1-C3`, y así.

  Antes de entrar, Quilla revisa los pilares de todas las cámaras. La mina tiene `niveles` niveles y cada nivel tiene `camaras` cámaras, contando desde 1; los dos números cambian en cada prueba. Usa un bucle dentro de otro: el de afuera recorre los niveles, el de adentro las cámaras. Para que las cámaras queden en la misma línea, imprímelas con `end=" "` y termina cada nivel con un `print()` vacío.
visual:
  figure:
    input: { label: "niveles = 2, camaras = 3", text: "niveles = 2\ncamaras = 3" }
    arrow: un for dentro de otro
    output: { label: Salida, text: "N1-C1 N1-C2 N1-C3\nN2-C1 N2-C2 N2-C3" }
starter: |
  # niveles y camaras ya existen
  print("N1-C1")
solution: |
  for nivel in range(1, niveles + 1):
      for camara in range(1, camaras + 1):
          print(f"N{nivel}-C{camara}", end=" ")
      print()
hints:
  - "`range(1, niveles + 1)` cuenta 1, 2, …, niveles."
  - "El `print()` vacío va dentro del `for` de los niveles pero fuera del de las cámaras: con la misma sangría que el `for` de adentro."
globals:
  niveles: 2
  camaras: 3
scenarios:
  - tests:
      - name: 2 niveles × 3 cámaras
        output: "N1-C1 N1-C2 N1-C3\nN2-C1 N2-C2 N2-C3"
  - globals: { niveles: 3, camaras: 2 }
    tests:
      - name: 3 niveles × 2 cámaras
        output: "N1-C1 N1-C2\nN2-C1 N2-C2\nN3-C1 N3-C2"
  - globals: { niveles: 1, camaras: 4 }
    tests:
      - name: 1 nivel × 4 cámaras
        output: N1-C1 N1-C2 N1-C3 N1-C4
tests:
  - name: un for dentro de otro
    source: '\bfor\b[^\n]*\n\s+for\b'
    msg: Pon el for de las cámaras dentro del for de los niveles.
```

```exercise
id: py3-arregla-tunel
type: fix
title: El túnel que no se acababa
prompt: |
  Un ayudante escribió este programa para que Quilla recorra el túnel recogiendo en cada casilla a la que llega y, al final, reporte el total. Ejecútalo: Quilla se queda recogiendo en el mismo sitio hasta que el Taller lo para. Arréglalo para que avance, recoja en **cada** casilla (la última también) y reporte una sola vez. Se prueba en dos túneles.
starter: |
  total = 0
  while not robot.hay_pared():
      total += robot.recoger()
  robot.avanzar()
  robot.reportar(total)
solution: |
  total = 0
  while not robot.hay_pared():
      robot.avanzar()
      total += robot.recoger()
  robot.reportar(total)
hints:
  - "¿Qué línea cambia lo que pregunta el `while`? Si está fuera del bloque, la condición nunca cambia."
  - Primero se avanza y después se recoge, para que la última casilla también cuente.
world:
  theme: mina
  level: 3
  dir: E
  map: |
    ##########
    ##########
    #R.2.1..3#
    ##########
    ##########
scenarios:
  - {}
  - map: |
      #######
      #######
      #R4..2#
      #######
      #######
tests:
  - name: no quedan cristales
    state: w.crystals_left == 0
    msg: Quedaron cristales en el túnel. ¿Recoges también en la última casilla?
  - name: reporta el total, una vez
    state: w.reports == [w.crystals_total]
    msg: Reporta una sola vez, después del bucle, el total de lo recogido.
  - name: sin chocar
    state: not w.crashed
```

## El caso

```exercise
id: py3-caso-vagoneta
type: case
title: La vagoneta corta
prompt: |
  **Suma los kilos de cada turno, sin contar las vagonetas en mantenimiento, y compáralo con lo que reportó cada robot.** Uno de ellos reportó una vagoneta que nunca salió.

  En San Expedito trabajan cuatro turnos, y cada uno tiene un robot que anota en su libreta los kilos de cada vagoneta que sale. Al final de la semana, la balanza de la planta pesó menos mineral del que sumaban los reportes: falta casi una vagoneta entera. En las libretas, un `0` es una vagoneta que salió vacía y un `-1` es una que estaba en **mantenimiento** y no salió: esa no se suma (`continue`).

  Imprime una línea por robot que empiece con su nombre, por ejemplo `print("Tunki:", total_tunki)`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py3-caso-vagoneta
    task: "Total del turno = la suma de sus vagonetas, sin los -1. Compáralo con lo que reportó cada robot."
    cards:
      - name: Tunki
        kind: robot
        role: Turno mañana
        with: { name: Don Fortunato, kind: person, label: jefe de turno }
        rows: [["Vagonetas en la libreta", "10"], ["Reportó", "568 kg"]]
        clue: { find: "Tunki", says: 568, saysLabel: Reportó }
      - name: Chaska
        kind: robot
        role: Turno tarde
        with: { name: Señora Yolanda, kind: person, label: jefa de turno }
        rows: [["Vagonetas en la libreta", "10"], ["Reportó", "712 kg"]]
        clue: { find: "Chaska", says: 712, saysLabel: Reportó }
      - name: Wayra
        kind: robot
        role: Turno noche
        culprit: true
        with: { name: Don Saturnino, kind: person, label: jefe de turno }
        rows: [["Vagonetas en la libreta", "10"], ["Reportó", "557 kg"]]
        clue: { find: "Wayra", says: 557, saysLabel: Reportó }
      - name: Pallqa
        kind: robot
        role: Turno madrugada
        with: { name: Joven Edith, kind: person, label: jefa de turno }
        rows: [["Vagonetas en la libreta", "10"], ["Reportó", "573 kg"]]
        clue: { find: "Pallqa", says: 573, saysLabel: Reportó }
      - name: Cómo se lee la libreta
        kind: note
        role: Instrucciones de doña Eulalia
        rows: [["Un número", "kilos de esa vagoneta"], ["0", "salió vacía"], ["-1", "en mantenimiento: no salió, no se suma"]]
starter: |
  # La libreta de cada turno: los kilos de cada vagoneta, en el orden en que salieron.
  # 0 = salió vacía · -1 = estaba en mantenimiento y no salió (no se suma)
  turno_tunki = [82, 75, 0, 91, -1, 68, 77, 85, 0, 90]
  turno_chaska = [88, 64, 79, 93, 71, 0, 86, 62, 95, 74]
  turno_wayra = [70, -1, 83, 0, 92, 66, -1, 81, 78, 0]
  turno_pallqa = [-1, 94, 87, 0, 73, 69, 90, -1, 84, 76]

  # TODO: suma los kilos de cada turno, saltándote los -1,
  # e imprime una línea por robot, por ejemplo:
  # print("Tunki:", total_tunki)
solution: |
  turno_tunki = [82, 75, 0, 91, -1, 68, 77, 85, 0, 90]
  turno_chaska = [88, 64, 79, 93, 71, 0, 86, 62, 95, 74]
  turno_wayra = [70, -1, 83, 0, 92, 66, -1, 81, 78, 0]
  turno_pallqa = [-1, 94, 87, 0, 73, 69, 90, -1, 84, 76]

  total_tunki = 0
  for kilos in turno_tunki:
      if kilos == -1:
          continue
      total_tunki += kilos

  total_chaska = 0
  for kilos in turno_chaska:
      if kilos == -1:
          continue
      total_chaska += kilos

  total_wayra = 0
  for kilos in turno_wayra:
      if kilos == -1:
          continue
      total_wayra += kilos

  total_pallqa = 0
  for kilos in turno_pallqa:
      if kilos == -1:
          continue
      total_pallqa += kilos

  print("Tunki:", total_tunki)
  print("Chaska:", total_chaska)
  print("Wayra:", total_wayra)
  print("Pallqa:", total_pallqa)
answer: Wayra
answerLabel: ¿Qué robot reportó una vagoneta de más?
reveal: |
  Wayra. Su libreta suma `70 + 83 + 0 + 92 + 66 + 81 + 78 + 0 = 470` kilos, sin contar los dos `-1`, y reportó 557: 87 kilos de más, una vagoneta que nunca salió. Los otros tres cuadran: 568, 712 y 573. Si sumas los `-1`, Tunki, Wayra y Pallqa parecen no cuadrar por uno o dos kilos: por eso hay que saltarlos.
hints:
  - "Un acumulador por turno que empieza en 0, y un `for kilos in turno_tunki:` que le suma cada vagoneta."
  - "Dentro del bucle, `if kilos == -1: continue` se salta la vagoneta en mantenimiento antes de sumarla."
```

## El juez

Lee la entrada con `input()` como en la sesión 1. Cuando una línea trae varios números, `input().split()` te da la lista de sus textos y puedes recorrerla con un `for`; cada texto se convierte con `int(...)` antes de comparar.

```exercise
id: py3-juez-racha
type: judge
title: La racha más larga
prompt: |
  **Imprime cuántos días dura la racha más larga de días seguidos con producción mayor que el umbral, y en qué día empieza.**

  Doña Eulalia anota cada día cuántas toneladas sacó la mina. A fin de mes quiere premiar al equipo por su mejor racha: los días **seguidos** en que la producción fue **mayor** (no igual) que la meta. Si hay varias rachas igual de largas, gana la **primera**.

  **Entrada:** una línea con dos enteros, `N` (los días) y `U` (el umbral); otra con las `N` producciones, separadas por espacios. Los días se numeran desde 1.

  **Salida:** una línea con dos enteros separados por un espacio: el largo de la racha más larga y el día en que empieza. Si ningún día supera el umbral, imprime `0 0`.

  **Restricciones:** 1 ≤ N ≤ 1000 · 0 ≤ U ≤ 200 · cada producción entre 0 y 300.
visual:
  figure:
    title: El ejemplo 1, día por día
    panes:
      - label: Entrada
        text: "10 50\n48 55 61 50 70 72 75 20 51 52"
      - label: "Producción de los días 1 a 10 (la racha más larga, resaltada)"
        cells: [48, 55, 61, 50, 70, 72, 75, 20, 51, 52]
        highlight: [4, 5, 6]
        index: false
      - label: Salida
        text: "3 5"
    caption: "Hay tres rachas por encima de 50: días 2–3, días 5–7 y días 9–10. El día 4 produjo **exactamente** 50, así que corta la primera racha."
starter: |
  partes = input().split()
  umbral = int(partes[1])
  produccion = input().split()
  # recorre los días y mide cada racha por encima del umbral

  print(0, 0)
solution: |
  partes = input().split()
  umbral = int(partes[1])
  produccion = input().split()
  mejor = 0
  inicio_mejor = 0
  racha = 0
  dia = 0
  for texto in produccion:
      dia += 1
      if int(texto) > umbral:
          racha += 1
          if racha > mejor:
              mejor = racha
              inicio_mejor = dia - racha + 1
      else:
          racha = 0
  print(mejor, inicio_mejor)
hints:
  - "Un contador `racha` sube en cada día por encima del umbral y vuelve a 0 en cuanto un día no llega. Al lado, guarda la mejor racha vista y dónde empezó."
  - "Compara con la mejor **en cada día** de la racha, no solo cuando se corta: la racha más larga puede terminar justo el último día. Y usa `>` estricto para que, en un empate, se quede la primera."
samples:
  - input: "10 50\n48 55 61 50 70 72 75 20 51 52"
    output: "3 5"
    note: "La racha de los días 5, 6 y 7 (70, 72, 75) es la más larga. El día 4 (50) no supera el umbral."
  - input: "5 100\n100 90 80 100 95"
    output: "0 0"
    note: Ningún día supera 100; llegar justo a 100 no cuenta.
edge:
  - input: "1 0\n1"
    tag: con un solo día que supera el umbral
  - input: "1 9\n3"
    tag: con un solo día que no llega
  - input: "4 10\n11 12 13 14"
    tag: cuando todos los días superan el umbral
  - input: "6 5\n9 1 7 8 9 10"
    tag: cuando la racha más larga termina el último día
  - input: "7 5\n6 7 1 8 9 2 3"
    tag: con dos rachas igual de largas
  - input: "3 5\n5 5 5"
    tag: cuando todos los días quedan justo en el umbral
  - input: "8 0\n0 1 0 1 1 0 0 2"
    tag: con umbral 0
random:
  count: 40
  seed: 33
  tag: ""
  generate: |
    n = rng.pick([rng.int(1, 15), rng.int(20, 200), rng.int(500, 1000)])
    umbral = rng.int(10, 200)
    dias = []
    for _ in range(n):
        if rng.int(0, 4) == 0:
            dias.append(umbral)
        else:
            dias.append(min(300, max(0, umbral + rng.int(-20, 25))))
    return f"{n} {umbral}\n{' '.join(map(str, dias))}"
wrong:
  - |
    partes = input().split()
    umbral = int(partes[1])
    produccion = input().split()
    mejor = 0
    inicio_mejor = 0
    racha = 0
    dia = 0
    for texto in produccion:
        dia += 1
        if int(texto) >= umbral:
            racha += 1
            if racha > mejor:
                mejor = racha
                inicio_mejor = dia - racha + 1
        else:
            racha = 0
    print(mejor, inicio_mejor)
  - |
    partes = input().split()
    umbral = int(partes[1])
    produccion = input().split()
    mejor = 0
    inicio_mejor = 0
    racha = 0
    dia = 0
    for texto in produccion:
        dia += 1
        if int(texto) > umbral:
            racha += 1
        else:
            if racha > mejor:
                mejor = racha
                inicio_mejor = dia - racha
            racha = 0
    print(mejor, inicio_mejor)
  - |
    partes = input().split()
    umbral = int(partes[1])
    produccion = input().split()
    mejor = 0
    inicio_mejor = 0
    racha = 0
    dia = 0
    for texto in produccion:
        dia += 1
        if int(texto) > umbral:
            racha += 1
            if racha >= mejor:
                mejor = racha
                inicio_mejor = dia - racha + 1
        else:
            racha = 0
    print(mejor, inicio_mejor)
```

## Misión final

```exercise
id: py3-mision-galerias
type: mission
title: Las galerías de San Expedito
prompt: |
  **Recorre todas las galerías del socavón recogiendo los cristales de cada casilla, termina en el ascensor (D) y reporta el total una sola vez.**

  El socavón baja en zigzag: una galería hacia el este, un pasaje de **2 casillas** hacia abajo, otra galería hacia el oeste, otro pasaje, y así. Los pasajes no tienen cristales. Doña Eulalia te dice cuántas galerías hay en `galerias`; el largo de cada una no lo sabe nadie. El ascensor está al final de la última galería.

  - Para recorrer una galería entera, usa el `while` de la escena del encargo.
  - Para repetirlo en cada galería, mételo dentro de un `for` con `range`.
  - Después de una galería impar (la 1, la 3…) se baja girando a la **derecha**; después de una par, girando a la **izquierda**. Después de la última no se baja: `break`.

  Quilla lleva la **batería justa** y se prueba en tres socavones distintos. Cuando pase, junto con el juez, se desbloquea la sesión 4.
starter: |
  total = 0
  # galerias ya existe: cuántas galerías tiene este socavón

  while not robot.hay_pared():
      robot.avanzar()
      total += robot.recoger()

  robot.reportar(total)
solution: |
  total = 0
  for galeria in range(1, galerias + 1):
      while not robot.hay_pared():
          robot.avanzar()
          total += robot.recoger()
      if galeria == galerias:
          break
      if galeria % 2 == 1:
          robot.girar_derecha()
          robot.avanzar(2)
          robot.girar_derecha()
      else:
          robot.girar_izquierda()
          robot.avanzar(2)
          robot.girar_izquierda()
  robot.reportar(total)
hints:
  - "El `while` que recorre una galería va **dentro** del `for galeria in range(1, galerias + 1):`."
  - "`galeria % 2 == 1` es verdadero en las galerías impares. Mirando al este, dos giros a la derecha (con el pasaje en medio) te dejan mirando al oeste; mirando al oeste, dos giros a la izquierda te dejan mirando al este."
globals:
  galerias: 3
world:
  theme: mina
  level: 3
  dir: E
  battery: 28
  map: |
    ###########
    #R.2...1..#
    #########.#
    #.3..2....#
    #.#########
    #...4.1..D#
    ###########
scenarios:
  - {}
  - globals: { galerias: 2 }
    world: { battery: 12 }
    map: |
      ########
      #R1..3.#
      ######.#
      #D.4...#
      ########
  - globals: { galerias: 4 }
    world: { battery: 42 }
    map: |
      ############
      #R..5.....2#
      ##########.#
      #.1.....3..#
      #.##########
      #..2..6....#
      ##########.#
      #D....4..1.#
      ############
tests:
  - name: no quedan cristales en el socavón
    state: w.crystals_left == 0
    msg: Quedaron cristales sin recoger. ¿Recoges en cada casilla de cada galería?
  - name: termina en el ascensor
    state: w.at_goal
    msg: Quilla no terminó en el ascensor (D), al final de la última galería.
  - name: reporta el total exacto, una vez
    state: w.reports == [w.crystals_total]
    msg: El número reportado no es el total del socavón (o se reportó más de una vez).
  - name: Quilla no choca
    state: not w.crashed
  - name: un while dentro de un for con range
    source: '\bfor\s+\w+\s+in\s+range\([^\n]*\n(?:[^\n]*\n)*?\s+while\b'
    msg: Repite el while de cada galería dentro de un for con range.
```

## Reto experto

```exercise
id: py3-reto-vigas
type: challenge
title: Las vigas que no se reparten
visual:
  figure:
    title: Qué vigas sirven de poste
    input: { label: "desde = 10, hasta = 30", cells: [11, 13, 17, 19, 23, 29], index: false }
    arrow: sin divisores entre 2 y el largo − 1
    output: { label: Salida, text: "11\n13\n17\n19\n23\n29\nTotal: 6" }
    steps:
      - "Una viga de 12 m se puede cortar en piezas iguales de 2, 3, 4 o 6 m: no sirve de poste."
      - "Una de 13 m no se puede repartir en piezas enteras iguales: sí sirve."
prompt: |
  **Imprime, uno por línea, los largos entre `desde` y `hasta` (incluidos) que no se pueden cortar en piezas enteras iguales, y al final `Total: N`.** Para quien ya programa.

  En el almacén de la mina hay vigas de todos los largos enteros, en metros. Una viga de largo L se puede repartir si algún largo de pieza entre 2 y L − 1 la divide exacto; las que no se pueden repartir (con L de al menos 2) se usan enteras como postes. Resuélvelo con un bucle dentro de otro y el `else` del `for` de adentro, sin variables bandera. `desde` y `hasta` cambian en cada prueba.
starter: |
  # desde y hasta ya existen
  total = 0
  print(f"Total: {total}")
solution: |
  total = 0
  for largo in range(max(desde, 2), hasta + 1):
      divisor = 2
      while divisor * divisor <= largo:
          if largo % divisor == 0:
              break
          divisor += 1
      else:
          print(largo)
          total += 1
  print(f"Total: {total}")
hints:
  - "Para cada largo, prueba divisores en un bucle; si uno divide exacto (`largo % divisor == 0`), `break`. El `else` de ese bucle corre solo si ningún divisor sirvió."
  - "Basta con probar divisores mientras `divisor * divisor <= largo`: si L tuviera un divisor más grande, también tendría uno más chico. Y 1 no es un largo válido."
globals:
  desde: 10
  hasta: 30
scenarios:
  - tests:
      - name: de 10 a 30
        output: "11\n13\n17\n19\n23\n29\nTotal: 6"
  - globals: { desde: 1, hasta: 10 }
    tests:
      - name: de 1 a 10 (el 1 no cuenta)
        output: "2\n3\n5\n7\nTotal: 4"
  - globals: { desde: 24, hasta: 28 }
    tests:
      - name: de 24 a 28, ninguna
        output: "Total: 0"
  - globals: { desde: 2, hasta: 2 }
    tests:
      - name: solo la de 2 m
        output: "2\nTotal: 1"
  - globals: { desde: 90, hasta: 110 }
    tests:
      - name: de 90 a 110
        output: "97\n101\n103\n107\n109\nTotal: 5"
tests:
  - name: corta la búsqueda con break
    source: '\bbreak\b'
    msg: Apenas encuentres un divisor, sal del bucle con break y deja que el else haga el resto.
```
