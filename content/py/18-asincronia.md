# Sesión 18 — Asincronía con asyncio

## El encargo

Callao, seis de la mañana, Muelle Sur. El *Mama Ocllo*, un portacontenedores que viene de Valparaíso, ya está amarrado, y **Gladys Huamán**, la coordinadora de grúas del terminal, tiene que decidir qué contenedor baja primero. El horario de cada grúa pórtico lo sabe un servidor viejo de la torre de control, que contesta cuando quiere: a veces en un parpadeo, a veces cuando ya se enfrió el café, y a veces con un `503`.

Maru mandó a Quilla desde Chucuito con la sirena puesta y una advertencia: "Si le preguntas a la torre grúa por grúa y te quedas parado esperando cada respuesta, el barco zarpa con la carga adentro". Hoy Quilla aprende a **pedir varias cosas a la vez**, a no esperar para siempre y a insistir con paciencia cuando el servidor falla.

```escena
theme: barranco
level: 2
dir: E
caption: El Muelle Sur. Quilla espera el horario de la torre, recorre el muelle y deja cada contenedor en el punto de carga (D), en el orden de su turno.
map: |
  ############
  #R.........#
  #########.##
  #########D##
  ############
program: |
  robot.decir("¿Turnos, torre?")
  robot.avanzar(8)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.entregar("CMAU-118 07:40")
  robot.entregar("MSKU-204 08:15")
```

## Lo mínimo

Hasta ahora cada línea terminaba antes de que empezara la siguiente. Preguntarle algo a un servidor no es así: la respuesta **tarda**, y mientras tanto el programa podría estar haciendo otra cosa, como pedir lo siguiente.

- **`async def`** define una **función de corrutina**. Llamarla no ejecuta nada todavía: devuelve una **corrutina**, una receta lista para correr.
- **`await corrutina`** la ejecuta y espera su resultado. Mientras espera, el **bucle de eventos** (el que reparte el turno entre corrutinas, una a la vez) atiende a otras. `await` solo se puede escribir dentro de un `async def`.
- **`asyncio.run(principal())`** arranca el bucle de eventos, corre la corrutina principal hasta el final y lo cierra. Es la puerta de entrada: se llama una vez, desde código normal.

```py run
import asyncio

async def pedir_turno(grua):
    await asyncio.sleep(0.2)  # la torre tarda 0.2 s en contestar
    return f"{grua}: 07:40"

async def principal():
    print("Pido el turno…")
    print(await pedir_turno("STS-3"))

asyncio.run(principal())
```

En los ejercicios con servidor, la torre se llama `taller`: `await taller.pedir("STS-1")` trae un recurso y `taller.ahora()` dice cuántos milisegundos van. Si falla, lanza `ErrorServidor`, con el código en `error.status` (`503` si no contestó, `404` si no existe). El tiempo es **simulado**: nada espera de verdad, pero las demoras y las fallas son las mismas cada vez que corres. Sin servidor, `asyncio.get_running_loop().time()` da el reloj en segundos.

**Uno tras otro o a la vez.** Dos `await` seguidos esperan el primero completo antes de pedir el segundo: los tiempos se suman. **`asyncio.gather(c1, c2, …)`** lanza todas las corrutinas a la vez y devuelve sus resultados **en el orden en que las pasaste**, no en el que llegaron.

Antes del código, mira **quién hace qué** cuando hay dos pedidos en el aire. El **bucle de eventos** es el que reparte el turno: en cada momento corre **una sola** corrutina, y cuando esa dice `await`, el bucle le da el turno a otra.

```red
title: Quién corre y quién espera con gather
caption: "Dos pedidos a la torre; el bucle de eventos solo reparte el turno. Nadie se queda parado esperando."
clockLabel: Desde el pedido
clockMax: 0.4
speed: 4200
nodes:
  - { id: code, icon: program, label: "Tu código: `principal()`", sub: la corrutina principal }
  - { id: loop, icon: engine, label: Bucle de eventos, sub: reparte el turno, una corrutina a la vez }
  - { id: tasks, icon: box, label: Tareas, sub: "una por pedido: STS-1 y STS-2" }
  - { id: tower, icon: server, label: La torre, sub: tarda 230 ms y 310 ms en contestar }
steps:
  - phase: "1. Arranca el bucle"
    move: [code, loop]
    packet: { kind: local, label: "`principal()`" }
    clock: 0
    clockText: 0 ms
    note: "`asyncio.run(principal())` le entrega `principal` al bucle de eventos. Desde aquí, el bucle decide quién corre."
    tags: { code: corriendo }
  - move: [loop, tasks]
    packet: { kind: local, label: "dos tareas" }
    clock: 0
    clockText: 0 ms
    note: "`gather` convierte las dos corrutinas en **tareas** y se las da al bucle. `principal` queda esperando hasta que terminen las dos."
    tags: { code: "esperando en gather", tasks: "STS-1 y STS-2 listas" }
  - phase: "2. Salen los pedidos"
    move: [tasks, tower]
    packet: { kind: up, label: "pedido de STS-1" }
    clock: 0
    clockText: 0 ms
    note: "La tarea 1 envía su pedido y dice `await`: «espero». El bucle **no se queda parado**: le da el turno a la tarea 2."
    tags: { tasks: "STS-1 espera · STS-2 corre" }
  - move: [tasks, tower]
    packet: { kind: up, label: "pedido de STS-2" }
    clock: 0
    clockText: 0 ms
    note: "La tarea 2 envía el suyo y también espera. Los dos pedidos viajan a la vez."
    tags: { tasks: "las dos esperan" }
  - at: tower
    busy: [tower]
    clock: 0.1
    clockText: 100 ms
    note: "Ahora no hay nada que correr: el bucle queda libre y los pedidos avanzan en la torre. Esa espera es de la torre, no de tu programa."
    tags: { loop: "nada que correr", tasks: "las dos esperan" }
  - phase: "3. Llegan las respuestas"
    move: [tower, tasks]
    packet: { kind: down, label: "turno de STS-2" }
    clock: 0.23
    clockText: 230 ms
    note: "A los 230 ms contesta STS-2. El bucle despierta a su tarea, que termina."
    tags: { tasks: "STS-2 lista · STS-1 espera" }
  - move: [tower, tasks]
    packet: { kind: down, label: "turno de STS-1" }
    clock: 0.31
    clockText: 310 ms
    note: "A los 310 ms contesta STS-1 y su tarea también termina."
    tags: { tasks: "las dos listas" }
  - move: [tasks, loop]
    packet: { kind: local, label: "las dos terminaron" }
    clock: 0.31
    clockText: 310 ms
    note: "Con las dos tareas terminadas, el bucle puede despertar a `principal`."
  - move: [loop, code]
    packet: { kind: local, label: "[turno_1, turno_2]" }
    clock: 0.31
    clockText: 310 ms
    note: "`gather` entrega los resultados en el orden en que pediste, no en el que llegaron, y el programa sigue. Total: 310 ms, no 540."
    tags: { code: continúa }
```

```anima
title: Dos pedidos a la vez con gather
code: |
  async def principal():
      pedido_1 = taller.pedir("STS-1")
      pedido_2 = taller.pedir("STS-2")
      turno_1, turno_2 = await asyncio.gather(pedido_1, pedido_2)
      print(turno_1, turno_2, taller.ahora())

  asyncio.run(principal())
steps:
  - { line: 7, vars: { reloj: "0 ms" }, note: "asyncio.run arranca el bucle de eventos y corre principal()." }
  - { line: 2, vars: { reloj: "0 ms", pedido_1: "<corrutina>" }, stack: [{ name: principal, args: "" }], note: "Llamar a taller.pedir no pide nada todavía: solo arma la corrutina." }
  - { line: 3, vars: { reloj: "0 ms", pedido_1: "<corrutina>", pedido_2: "<corrutina>" }, stack: [{ name: principal, args: "" }], note: "La segunda receta. La torre aún no sabe nada de nosotros." }
  - { line: 4, vars: { reloj: "0 ms", pedido_1: "⏳ salió", pedido_2: "⏳ salió" }, stack: [{ name: principal, args: "" }], note: "gather convierte cada corrutina en una tarea: las dos salen a los 0 ms y principal se queda esperando." }
  - { line: 4, vars: { reloj: "230 ms", pedido_1: "⏳ salió", pedido_2: "✓ \"06:45\"" }, stack: [{ name: principal, args: "" }], note: "STS-2 contesta primero…" }
  - { line: 4, vars: { reloj: "310 ms", turno_1: "\"06:10\"", turno_2: "\"06:45\"" }, stack: [{ name: principal, args: "" }], note: "…y con STS-1 llegan las dos, en el orden en que las pediste." }
  - { line: 5, vars: { reloj: "310 ms", turno_1: "\"06:10\"", turno_2: "\"06:45\"" }, stack: [{ name: principal, args: "" }], out: "06:10 06:45 310", note: "Total: 310 ms, lo de la más lenta. Una tras otra habrían sido 310 + 230 = 540." }
```

```figura
title: Uno tras otro o a la vez
caption: Cada barra es un pedido viajando. Con dos `await` seguidos, los tiempos se suman; con `gather`, se superponen.
panes:
  - { label: "dos await: 310 + 230 = 540 ms", text: "        0   100  200  300  400  500\nSTS-1   ████████████████\nSTS-2                   ███████████" }
  - { label: "con gather: 310 ms", text: "        0   100  200  300  400  500\nSTS-1   ████████████████\nSTS-2   ███████████" }
```

**Tareas.** `asyncio.create_task(corrutina)` la pone a correr **ya**, en segundo plano, y te da una tarea; más tarde, `await tarea` recoge su resultado. Para lanzar varias y esperarlas todas, **`async with asyncio.TaskGroup() as grupo:`** es lo moderno: creas las tareas con `grupo.create_task(…)` y, al salir del bloque, todas terminaron. Si una falla, el grupo cancela las demás y te entrega el error.

```py run
import asyncio

async def bajar(contenedor, segundos):
    await asyncio.sleep(segundos)
    print("bajó", contenedor)
    return contenedor

async def principal():
    async with asyncio.TaskGroup() as grupo:
        tareas = [grupo.create_task(bajar(c, s)) for c, s in [("MSKU", 0.3), ("CMAU", 0.1)]]
    print([tarea.result() for tarea in tareas])

asyncio.run(principal())
```

**Plazos.** `async with asyncio.timeout(segundos):` le pone un límite a todo lo que esperes dentro del bloque. Si se vence, cancela lo que estaba esperando y lanza `TimeoutError`, que atrapas con `try`/`except` como cualquier error.

```py run
import asyncio

async def principal():
    try:
        async with asyncio.timeout(0.2):
            await asyncio.sleep(0.5)  # una torre que tarda medio segundo
            print("llegó el turno")
    except TimeoutError:
        print("sin turno: se venció el plazo")

asyncio.run(principal())
```

> **Trampa común:** olvidar el `await`. `turno = taller.pedir("STS-1")` no guarda el turno: guarda una corrutina que nunca corrió, y Python avisa *coroutine was never awaited*. Si ves `<coroutine object …>` donde esperabas un dato, busca el `await` que falta.

<!-- legacy: async-await -->

<!-- legacy: asyncio-run -->

<!-- legacy: taskgroup -->

<!-- legacy: asyncio-timeout -->

<!-- mdn: async-await asyncio-run taskgroup asyncio-timeout -->

## Práctica

```exercise
id: py18-predice-tarea
type: predict
title: La grúa que no esperó a nadie
prompt: |
  `create_task` pone la corrutina a correr en segundo plano y el programa sigue. ¿Qué imprime?
code: |
  import asyncio

  async def grua(nombre, segundos):
      await asyncio.sleep(segundos)
      print(nombre, "lista")

  async def principal():
      tarea = asyncio.create_task(grua("STS-2", 0.2))
      print("Gladys pide café")
      await grua("STS-1", 0.3)
      print("Fin del turno")
      await tarea

  asyncio.run(principal())
options:
  - "Gladys pide café\nSTS-2 lista\nSTS-1 lista\nFin del turno"
  - "STS-2 lista\nGladys pide café\nSTS-1 lista\nFin del turno"
  - "Gladys pide café\nSTS-1 lista\nFin del turno\nSTS-2 lista"
  - "Gladys pide café\nSTS-1 lista\nSTS-2 lista\nFin del turno"
answer: "Gladys pide café\nSTS-2 lista\nSTS-1 lista\nFin del turno"
explain: |
  La tarea de STS-2 queda programada, pero no corre hasta que `principal` suelte el control: primero sale el café. En `await grua("STS-1", 0.3)`, `principal` espera, y mientras tanto STS-2 avanza y termina a los 0.2 s. STS-1 termina a los 0.3 s y recién ahí sigue `principal`. El `await tarea` del final ya encuentra la tarea terminada.
```

```exercise
id: py18-arregla-grupo
type: fix
title: La ventana de la grúa
server: { seed: 9, latency: [200, 450], data: { "STS-1": "07:10", "STS-2": "07:35", "STS-3": "08:00" } }
prompt: |
  **Haz que los tres pedidos salgan a la vez, con un `TaskGroup`, para que Quilla tenga los turnos antes de los 500 ms.**

  La grúa del *Mama Ocllo* cierra su ventana de programación a los 500 ms. Este programa le pregunta a la torre por las tres grúas una tras otra y llega tarde. Ejecútalo y mira cuánto tarda.
visual:
  figure:
    panes:
      - { label: "uno tras otro: 250 + 235 + 381 = 866 ms", text: "        0    250  500  750  1000\nSTS-1   █████\nSTS-2        █████\nSTS-3             ████████" }
      - { label: "la ventana", value: "cierra a los 500 ms" }
starter: |
  import asyncio

  async def principal():
      inicio = taller.ahora()
      turnos = []
      for grua in ["STS-1", "STS-2", "STS-3"]:
          turnos.append(await taller.pedir(grua))
      print(turnos)
      print(f"Listo en {taller.ahora() - inicio} ms")

  asyncio.run(principal())
solution: |
  import asyncio

  async def principal():
      inicio = taller.ahora()
      async with asyncio.TaskGroup() as grupo:
          tareas = [grupo.create_task(taller.pedir(grua)) for grua in ["STS-1", "STS-2", "STS-3"]]
      turnos = [tarea.result() for tarea in tareas]
      print(turnos)
      print(f"Listo en {taller.ahora() - inicio} ms")

  asyncio.run(principal())
hints:
  - "Dentro de `async with asyncio.TaskGroup() as grupo:`, crea una tarea por grúa con `grupo.create_task(taller.pedir(grua))` y guárdalas en una lista."
  - "Al salir del bloque todas terminaron: `[tarea.result() for tarea in tareas]` da los turnos en orden."
tests:
  - name: imprime los tres turnos en orden
    outputIncludes: "['07:10', '07:35', '08:00']"
  - name: los tres pedidos salen a los 0 ms
    state: len(s.requests) == 3 and all(r.start == 0 for r in s.requests)
    msg: Los tres pedidos deben salir juntos, sin esperar uno al otro.
  - name: listo antes de que cierre la ventana
    state: max(r.end for r in s.requests) <= 500
  - name: usa TaskGroup
    source: 'TaskGroup\(\)'
```

```exercise
id: py18-escribe-reintento
type: write
title: Paciencia con la Capitanía
server: { seed: 6, latency: [80, 200], failOn: [1, 2], data: { oleaje: moderado } }
prompt: |
  **Escribe `pedir_con_reintento(recurso, intentos=4)`: si el servidor falla con `503`, espera y vuelve a pedir, cada vez el doble de tiempo (100 ms, 200 ms, 400 ms…), hasta `intentos` pedidos en total.**

  El oleaje lo informa la Capitanía de Puerto, y su servidor se cae justo cuando hay más consultas. Reintentar en el acto lo empeora: todos los robots del puerto le caen encima a la vez. Por eso se espera, y cada vez más: eso es **retroceso exponencial** (*backoff*).

  - Un `503` se reintenta. Si el último intento también falla, lanza ese error (`raise`).
  - Un `404` dice que el recurso no existe: reintentar no sirve, lánzalo de inmediato.

  El final del programa ya está escrito.
visual:
  figure:
    title: Falla dos veces, a la tercera contesta
    panes:
      - { cards: [{ title: "intento 1", rows: [["responde", "503 ✗"], ["después", "espera 100 ms"]] }, { title: "intento 2", rows: [["responde", "503 ✗"], ["después", "espera 200 ms"]] }, { title: "intento 3", rows: [["responde", "\"moderado\" ✓"], ["después", "lo devuelve"]] }] }
starter: |
  import asyncio

  async def pedir_con_reintento(recurso, intentos=4):
      return await taller.pedir(recurso)

  async def principal():
      try:
          oleaje = await pedir_con_reintento("oleaje")
          print(f"Oleaje: {oleaje}")
      except ErrorServidor as error:
          print(f"Sin dato: {error.status}")

  asyncio.run(principal())
solution: |
  import asyncio

  async def pedir_con_reintento(recurso, intentos=4):
      espera = 0.1
      for intento in range(1, intentos + 1):
          try:
              return await taller.pedir(recurso)
          except ErrorServidor as error:
              if error.status == 404 or intento == intentos:
                  raise
              await asyncio.sleep(espera)
              espera *= 2

  async def principal():
      try:
          oleaje = await pedir_con_reintento("oleaje")
          print(f"Oleaje: {oleaje}")
      except ErrorServidor as error:
          print(f"Sin dato: {error.status}")

  asyncio.run(principal())
hints:
  - "Un `for intento in range(1, intentos + 1):` con `try: return await taller.pedir(recurso)` adentro: sale apenas funciona."
  - "En el `except ErrorServidor as error:`, `raise` si es `404` o el último intento; si no, `await asyncio.sleep(espera)` y duplica `espera`."
tests:
  - name: espera el doble cada vez
    state: all(s.requests[i].start - s.requests[i - 1].end == 100 * 2 ** (i - 1) for i in range(1, len(s.requests)))
    msg: Tras la primera falla espera 100 ms; tras la segunda, 200; luego 400.
scenarios:
  - tests:
      - name: falla dos veces y a la tercera trae el oleaje
        output: "Oleaje: moderado"
      - name: pide exactamente 3 veces
        state: len(s.requests) == 3
  - server: { failOn: [1, 2, 3, 4, 5, 6, 7] }
    tests:
      - name: con la Capitanía caída, se rinde con el error
        output: "Sin dato: 503"
      - name: lo intenta 4 veces, ni una más
        state: len(s.requests) == 4
  - server: { failOn: [], data: { marea: baja } }
    tests:
      - name: un recurso que no existe no se reintenta
        output: "Sin dato: 404"
      - name: pide una sola vez
        state: len(s.requests) == 1
```

```exercise
id: py18-arregla-semaforo
type: fix
title: La antena que se quedó sin cupo
server: { seed: 12, latency: [100, 300], data: { "STS-1": "06:10", "STS-2": "06:45", "STS-3": "07:20", "STS-4": "07:55", "STS-5": "08:30" } }
globals:
  gruas: ["STS-1", "STS-2", "STS-3", "STS-4", "STS-5"]
prompt: |
  **Arregla `consultar` para que el programa termine, con nunca más de 2 consultas a la vez.**

  La antena de la torre solo aguanta dos consultas simultáneas. Para eso existe **`asyncio.Semaphore(2)`**: un contador de cupos. `await cupo.acquire()` toma un cupo (o espera a que se libere uno) y `cupo.release()` lo devuelve. Este programa saca las dos primeras respuestas y se queda colgado para siempre. Ejecútalo y lee el mensaje.
visual:
  figure:
    panes:
      - { label: "cupos de la antena", cells: ["STS-1", "STS-2"], index: false }
      - { label: "esperando cupo", cells: ["STS-3", "STS-4", "STS-5"], index: false }
    caption: Si nadie devuelve su cupo, las tres de la derecha esperan para siempre.
starter: |
  import asyncio

  async def consultar(grua, cupo):
      await cupo.acquire()
      turno = await taller.pedir(grua)
      return turno

  async def principal():
      cupo = asyncio.Semaphore(2)
      turnos = await asyncio.gather(*(consultar(grua, cupo) for grua in gruas))
      print(turnos)

  asyncio.run(principal())
solution: |
  import asyncio

  async def consultar(grua, cupo):
      async with cupo:
          return await taller.pedir(grua)

  async def principal():
      cupo = asyncio.Semaphore(2)
      turnos = await asyncio.gather(*(consultar(grua, cupo) for grua in gruas))
      print(turnos)

  asyncio.run(principal())
hints:
  - Cada `acquire()` necesita su `release()`, o el cupo no vuelve nunca.
  - "`async with cupo:` toma el cupo al entrar y lo devuelve al salir, aunque haya un error o un `return`."
tests:
  - name: imprime los cinco turnos
    output: "['06:10', '06:45', '07:20', '07:55', '08:30']"
  - name: nunca más de 2 consultas a la vez
    state: max(sum(1 for o in s.requests if o.start <= r.start < o.end) for r in s.requests) == 2
    msg: La antena aguanta dos consultas simultáneas, ni una más.
```

```exercise
id: py18-completa-cola
type: complete
title: El camión y las dos grúas
prompt: |
  **Completa los `___` para que un camión deje contenedores en una cola y dos grúas los vayan bajando, cada una a su ritmo.**

  Una **`asyncio.Queue`** conecta a quien produce con quien consume: `await cola.put(x)` deja algo, `await cola.get()` lo saca (o espera a que haya), `cola.task_done()` avisa que ese ya se terminó y `await cola.join()` espera hasta que **todo** lo que entró esté terminado. Llega un contenedor cada 100 ms, y cada grúa tarda 250 ms en bajar uno.
visual:
  figure:
    input: { label: "el camión trae", cells: ["MSKU-1", "CMAU-2", "HLXU-3", "TGHU-4", "MRKU-5"] }
    arrow: "cola → la grúa que esté libre"
    output: { label: descargados, table: { head: ["ms", "grúa", "contenedor"], rows: [["350", "STS-1", "MSKU-1"], ["450", "STS-2", "CMAU-2"], ["600", "STS-1", "HLXU-3"], ["…", "…", "…"]] } }
starter: |
  import asyncio

  async def camion(cola, contenedores):
      for codigo in contenedores:
          await asyncio.sleep(0.1)
          await cola.___(codigo)

  async def grua(nombre, cola, descargados):
      while True:
          codigo = await cola.___()
          await asyncio.sleep(0.25)
          descargados.append(f"{nombre} {codigo}")
          cola.___()

  async def principal():
      cola = asyncio.Queue()
      descargados = []
      gruas = [asyncio.create_task(grua(nombre, cola, descargados)) for nombre in ["STS-1", "STS-2"]]
      await camion(cola, ["MSKU-1", "CMAU-2", "HLXU-3", "TGHU-4", "MRKU-5"])
      await cola.___()
      for tarea in gruas:
          tarea.cancel()
      return descargados

  descargados = asyncio.run(principal())
  print(descargados)
solution: |
  import asyncio

  async def camion(cola, contenedores):
      for codigo in contenedores:
          await asyncio.sleep(0.1)
          await cola.put(codigo)

  async def grua(nombre, cola, descargados):
      while True:
          codigo = await cola.get()
          await asyncio.sleep(0.25)
          descargados.append(f"{nombre} {codigo}")
          cola.task_done()

  async def principal():
      cola = asyncio.Queue()
      descargados = []
      gruas = [asyncio.create_task(grua(nombre, cola, descargados)) for nombre in ["STS-1", "STS-2"]]
      await camion(cola, ["MSKU-1", "CMAU-2", "HLXU-3", "TGHU-4", "MRKU-5"])
      await cola.join()
      for tarea in gruas:
          tarea.cancel()
      return descargados

  descargados = asyncio.run(principal())
  print(descargados)
hints:
  - "El camión **pone** (`put`) y la grúa **saca** (`get`)."
  - "Sin `task_done()`, `join()` nunca sabe que el contenedor ya bajó, y el programa se queda esperando."
tests:
  - name: las dos grúas se reparten los cinco contenedores
    run: descargados
    equals: ["STS-1 MSKU-1", "STS-2 CMAU-2", "STS-1 HLXU-3", "STS-2 TGHU-4", "STS-1 MRKU-5"]
  - name: espera la cola con join
    source: 'await\s+cola\.join\(\)'
```

## El caso

```exercise
id: py18-caso-grua
type: case
title: La grúa que esperó de más
prompt: |
  **Calcula cuánto tenía que esperar cada robot de terminal por sus turnos, pidiéndolos a la vez dentro de lo que aguanta su antena, e imprime una línea por robot para compararla con lo que reportó.**

  El *Mama Ocllo* zarpó con media hora de retraso, y la naviera quiere saber por qué. Cuatro robots de terminal le pidieron a la torre los turnos de sus grúas, y los cuatro juran que pidieron todo **a la vez**, con tantas consultas simultáneas como aguanta su antena (`cupo`). La torre dejó anotado cuánto tardó en contestar por cada grúa. Uno de ellos en realidad preguntó grúa por grúa, y su reporte lo delata.

  `consultar(grua)` ya está escrita: espera lo que tardó la torre con esa grúa. Simula a cada robot con un `Semaphore(cupo)` y `gather`, mide el tiempo con el reloj del bucle e imprime, por ejemplo, `print(f"Ancla: {ms} ms")`.
visual:
  board:
    for: py18-caso-grua
    title: Lo que reportó cada robot de terminal
    task: Simula los pedidos de cada robot a la vez, con el cupo de su antena, y compara el tiempo con su reporte.
    cards:
      - { name: Ancla, kind: robot, role: "Terminal 1", rows: [["Grúas", "STS-1, STS-2, STS-3"], ["Antena", "3 a la vez"], ["Reportó", "410 ms"]], clue: { find: "Ancla", says: 410 } }
      - { name: Boya, kind: robot, role: "Terminal 2", rows: [["Grúas", "STS-4, STS-5, STS-6, STS-7"], ["Antena", "1 a la vez"], ["Reportó", "1010 ms"]], clue: { find: "Boya", says: 1010 } }
      - { name: Faro, kind: robot, role: "Terminal 3", rows: [["Grúas", "STS-2, STS-5, STS-8, STS-9, STS-3"], ["Antena", "2 a la vez"], ["Reportó", "730 ms"]], clue: { find: "Faro", says: 730 } }
      - { name: Gaviota, kind: robot, role: "Terminal 4", culprit: true, rows: [["Grúas", "STS-6, STS-1, STS-9, STS-4"], ["Antena", "4 a la vez"], ["Reportó", "1160 ms"]], clue: { find: "Gaviota", says: 1160 } }
      - { name: La torre, kind: note, role: "Cuánto tardó con cada grúa", rows: [["STS-1", "320 ms"], ["STS-2", "180 ms"], ["STS-3", "410 ms"], ["STS-4", "150 ms"], ["STS-5", "260 ms"], ["STS-6", "390 ms"], ["STS-7", "210 ms"], ["STS-8", "140 ms"], ["STS-9", "300 ms"]] }
    caption: "**Cuadra**: el reporte es lo que tarda pedir a la vez. Si no cuadra, ese robot esperó de más."
globals:
  demoras: { "STS-1": 320, "STS-2": 180, "STS-3": 410, "STS-4": 150, "STS-5": 260, "STS-6": 390, "STS-7": 210, "STS-8": 140, "STS-9": 300 }
  robots:
    Ancla: { gruas: ["STS-1", "STS-2", "STS-3"], cupo: 3 }
    Boya: { gruas: ["STS-4", "STS-5", "STS-6", "STS-7"], cupo: 1 }
    Faro: { gruas: ["STS-2", "STS-5", "STS-8", "STS-9", "STS-3"], cupo: 2 }
    Gaviota: { gruas: ["STS-6", "STS-1", "STS-9", "STS-4"], cupo: 4 }
starter: |
  import asyncio

  # demoras: {"STS-1": 320, ...}  ms que tardó la torre con cada grúa
  # robots: {"Ancla": {"gruas": ["STS-1", ...], "cupo": 3}, ...}
  async def consultar(grua):
      await asyncio.sleep(demoras[grua] / 1000)

  # TODO: una corrutina que, para un robot, pida todas sus grúas a la vez
  # (gather) sin pasar de su cupo (Semaphore) y devuelva cuántos ms tardó:
  # bucle = asyncio.get_running_loop(); inicio = bucle.time() ...
  # Luego, por cada robot: print(f"{nombre}: {ms} ms")
solution: |
  import asyncio

  async def consultar(grua):
      await asyncio.sleep(demoras[grua] / 1000)

  async def con_cupo(grua, cupo):
      async with cupo:
          await consultar(grua)

  async def tiempo_de(gruas, cupo):
      bucle = asyncio.get_running_loop()
      inicio = bucle.time()
      semaforo = asyncio.Semaphore(cupo)
      await asyncio.gather(*(con_cupo(grua, semaforo) for grua in gruas))
      return round((bucle.time() - inicio) * 1000)

  for nombre, datos in robots.items():
      ms = asyncio.run(tiempo_de(datos["gruas"], datos["cupo"]))
      print(f"{nombre}: {ms} ms")
answer: Gaviota
answerLabel: ¿Qué robot esperó de más?
reveal: |
  Gaviota. Con su antena de 4 cupos, pedir sus cuatro grúas a la vez tarda lo de la más lenta, STS-6: **390 ms**. Reportó 1160, que es 390 + 320 + 300 + 150: la suma, grúa por grúa. Boya también tardó la suma, pero su antena aguanta una consulta a la vez: ella no podía hacer otra cosa. Y Faro, con 2 cupos, no tarda ni la suma (1290) ni la más lenta (410): 730, lo que da la simulación.
hints:
  - "Una corrutina `con_cupo(grua, semaforo)` con `async with semaforo: await consultar(grua)`, y `await asyncio.gather(*(con_cupo(g, semaforo) for g in gruas))` lanza todas."
  - "Mide con `bucle.time()` antes y después, y `round((fin - inicio) * 1000)` lo pasa a milisegundos. Llama `asyncio.run(...)` una vez por robot."
```

## El juez

Estos jueces llaman a funciones `async`: el juez corre la corrutina y compara lo que devuelve. Cada caso tiene su propia torre, con el reloj en 0 y las mismas demoras y fallas: **el pedido número n de cada caso siempre tarda lo mismo**, pida quien pida. Por eso devuelves también `taller.ahora()`: si pides de más o esperas de más, se nota.

```exercise
id: py18-juez-plazo
type: judge
mode: function
function: turnos_de_gruas
server: { seed: 18, latency: [120, 480], data: { "STS-1": "06:10", "STS-2": "06:45", "STS-3": "07:20", "STS-4": "07:55", "STS-5": "08:30", "STS-6": "09:05", "STS-7": "09:40", "STS-8": "10:15" } }
title: Los turnos antes del plazo
prompt: |
  **Escribe `async def turnos_de_gruas(gruas, plazo, cupo)`, que pide a la torre el turno de cada grúa, a la vez y sin pasar de `cupo` consultas simultáneas, y devuelve `[turnos, ms]`.**

  - `turnos` tiene, en el orden de `gruas`, el turno de cada una (`await taller.pedir("STS-3")` → `"07:20"`), o `"tarde"` si la torre no contestó dentro de `plazo` milisegundos.
  - El plazo corre **desde que sale la consulta**, no mientras espera un cupo de la antena.
  - `ms` es `taller.ahora()` cuando ya tienes todos los turnos.

  Gladys necesita el horario rápido: una consulta lenta no puede tener esperando a las demás.

  **Restricciones:** de 0 a 8 grúas, sin repetir · 150 ≤ `plazo` ≤ 500 · 1 ≤ `cupo` ≤ 4 · la torre tarda entre 120 y 480 ms por consulta.
visual:
  figure:
    title: El ejemplo 1, consulta por consulta
    input: { label: 'turnos_de_gruas(["STS-1", "STS-2", "STS-3"], 400, 2)', text: "           0    100  200  300  400  500  600\nSTS-1      █████████████▌               263 ms ✓\nSTS-2      ███████████████▌             309 ms ✓\nSTS-3                   ████████████████████|  sale a los 263, se corta a los 663" }
    arrow: la tercera espera un cupo y después se pasa del plazo
    output: { label: devuelve, value: '[["06:10", "06:45", "tarde"], 663]' }
    steps:
      - "Con cupo 2 salen STS-1 y STS-2. STS-3 sale cuando STS-1 devuelve su cupo, a los 263 ms."
      - "La torre tardaría 409 ms con STS-3: se pasa del plazo de 400, que se corta a los 263 + 400 = 663."
starter: |
  import asyncio

  async def turnos_de_gruas(gruas, plazo, cupo):
      return [[], 0]
solution: |
  import asyncio

  async def turno_a_tiempo(grua, plazo, semaforo):
      async with semaforo:
          try:
              async with asyncio.timeout(plazo / 1000):
                  return await taller.pedir(grua)
          except TimeoutError:
              return "tarde"

  async def turnos_de_gruas(gruas, plazo, cupo):
      semaforo = asyncio.Semaphore(cupo)
      turnos = await asyncio.gather(*(turno_a_tiempo(grua, plazo, semaforo) for grua in gruas))
      return [turnos, taller.ahora()]
hints:
  - "Una corrutina por grúa: `async with semaforo:` por fuera y, adentro, `async with asyncio.timeout(plazo / 1000):` alrededor del `await taller.pedir(grua)`."
  - "Atrapa el `TimeoutError` dentro de esa corrutina y devuelve `\"tarde\"`: así un pedido lento no tumba a los demás. Luego, `await asyncio.gather(*(…))`."
samples:
  - args: [["STS-1", "STS-2", "STS-3"], 400, 2]
    note: "El dibujo de arriba."
  - args: [["STS-5", "STS-2", "STS-8", "STS-1"], 300, 4]
    note: "Las cuatro salen a los 0 ms. La torre tarda 263, 309, 409 y 377 ms: solo la primera llega dentro de 300."
edge:
  - args: [[], 300, 2]
    tag: sin grúas
  - args: [["STS-4"], 500, 1]
    tag: con una sola grúa
  - args: [["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6", "STS-7", "STS-8"], 150, 4]
    tag: cuando ninguna llega a tiempo
  - args: [["STS-8", "STS-7", "STS-6", "STS-5", "STS-4", "STS-3", "STS-2", "STS-1"], 500, 1]
    tag: con cupo 1, una por una
  - args: [["STS-2", "STS-6", "STS-3"], 450, 4]
    tag: con más cupos que grúas
random:
  count: 40
  seed: 81
  generate: |
    gruas = rng.shuffle(["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6", "STS-7", "STS-8"])[:rng.int(1, 8)]
    return [gruas, rng.pick([150, 200, 250, 300, 350, 400, 450, 500]), rng.int(1, 4)]
wrong:
  - |
    import asyncio
    async def turnos_de_gruas(gruas, plazo, cupo):
        turnos = []
        for grua in gruas:
            try:
                async with asyncio.timeout(plazo / 1000):
                    turnos.append(await taller.pedir(grua))
            except TimeoutError:
                turnos.append("tarde")
        return [turnos, taller.ahora()]
  - |
    import asyncio
    async def turno_a_tiempo(grua, plazo, semaforo):
        await semaforo.acquire()
        try:
            async with asyncio.timeout(plazo / 1000):
                return await taller.pedir(grua)
        except TimeoutError:
            return "tarde"
    async def turnos_de_gruas(gruas, plazo, cupo):
        semaforo = asyncio.Semaphore(cupo)
        turnos = await asyncio.gather(*(turno_a_tiempo(grua, plazo, semaforo) for grua in gruas))
        return [turnos, taller.ahora()]
```

```exercise
id: py18-juez-paciencia
type: judge
mode: function
function: turnos_con_paciencia
server: { seed: 23, latency: [80, 260], failRate: 0.4, data: { "STS-1": "06:10", "STS-2": "06:45", "STS-3": "07:20", "STS-4": "07:55", "STS-5": "08:30", "STS-6": "09:05", "STS-7": "09:40", "STS-8": "10:15" } }
title: Una por una, con paciencia
prompt: |
  **Escribe `async def turnos_con_paciencia(gruas, intentos)`, que pide el turno de cada grúa, una por una, reintentando con retroceso exponencial, y devuelve `[turnos, ms]`.**

  Hoy la torre está de malas: falla seguido, y la antena solo deja una consulta a la vez. Por cada grúa, en el orden de `gruas`:

  - **503**: espera y vuelve a pedirla. La primera espera es de 100 ms y cada una dobla la anterior (100, 200, 400…), y vuelve a empezar en 100 con la grúa siguiente. Como máximo `intentos` pedidos por grúa; si todos fallan, su turno es `"sin señal"`.
  - **404**: esa grúa no existe, no reintentes. Su turno es `"no existe"`.

  `ms` es `taller.ahora()` al terminar. La grúa siguiente se pide apenas termina la anterior.

  **Restricciones:** de 0 a 6 grúas · 1 ≤ `intentos` ≤ 5.
visual:
  figure:
    title: El ejemplo 1, pedido por pedido
    input: { label: 'turnos_con_paciencia(["STS-2", "STS-9"], 4)', table: { head: ["pedido", "grúa", "tarda", "responde", "después"], rows: [["1", "STS-2", "97", "503", "espera 100"], ["2", "STS-2", "194", "503", "espera 200"], ["3", "STS-2", "138", "503", "espera 400"], ["4", "STS-2", "172", "\"06:45\"", "siguiente"], ["5", "STS-9", "229", "503", "espera 100"], ["6", "STS-9", "208", "503", "espera 200"], ["7", "STS-9", "96", "404", "no existe"]] } }
    arrow: suma tiempos y esperas
    output: { label: devuelve, value: '[["06:45", "no existe"], 2134]' }
starter: |
  import asyncio

  async def turnos_con_paciencia(gruas, intentos):
      return [[], 0]
solution: |
  import asyncio

  async def turno_de(grua, intentos):
      espera = 0.1
      for intento in range(1, intentos + 1):
          try:
              return await taller.pedir(grua)
          except ErrorServidor as error:
              if error.status == 404:
                  return "no existe"
              if intento < intentos:
                  await asyncio.sleep(espera)
                  espera *= 2
      return "sin señal"

  async def turnos_con_paciencia(gruas, intentos):
      turnos = []
      for grua in gruas:
          turnos.append(await turno_de(grua, intentos))
      return [turnos, taller.ahora()]
hints:
  - "Escribe `turno_de(grua, intentos)` con un `for` de intentos y `try: return await taller.pedir(grua)`; en el `except ErrorServidor as error:`, mira `error.status`."
  - "Después del último intento fallido no se espera: devuelve `\"sin señal\"` de inmediato. Y la espera empieza en `0.1` dentro de `turno_de`, para que cada grúa arranque de nuevo."
samples:
  - args: [["STS-2", "STS-9"], 4]
    note: "STS-9 no existe, pero los dos primeros pedidos fallan con 503 antes de que la torre lo diga."
  - args: [["STS-5", "STS-1", "STS-3"], 2]
    note: "STS-5 falla dos veces: con 2 intentos, se queda en sin señal."
edge:
  - args: [[], 3]
    tag: sin grúas
  - args: [["STS-4"], 1]
    tag: con un solo intento
  - args: [["STS-12", "STS-9"], 5]
    tag: con grúas que no existen
  - args: [["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6"], 5]
    tag: con muchas grúas y paciencia
  - args: [["STS-7", "STS-7", "STS-8"], 3]
    tag: con una grúa repetida
random:
  count: 40
  seed: 88
  generate: |
    pool = ["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6", "STS-7", "STS-8", "STS-9", "STS-12"]
    return [rng.shuffle(pool)[:rng.int(1, 6)], rng.int(1, 5)]
wrong:
  - |
    import asyncio
    async def turno_de(grua, intentos):
        for intento in range(1, intentos + 1):
            try:
                return await taller.pedir(grua)
            except ErrorServidor as error:
                if error.status == 404:
                    return "no existe"
                await asyncio.sleep(0.1 if intento < intentos else 0)
        return "sin señal"
    async def turnos_con_paciencia(gruas, intentos):
        return [[await turno_de(grua, intentos) for grua in gruas], taller.ahora()]
  - |
    import asyncio
    async def turno_de(grua):
        espera = 0.1
        while True:
            try:
                return await taller.pedir(grua)
            except ErrorServidor as error:
                if error.status == 404:
                    return "no existe"
                await asyncio.sleep(espera)
                espera *= 2
    async def turnos_con_paciencia(gruas, intentos):
        return [[await turno_de(grua) for grua in gruas], taller.ahora()]
  - |
    import asyncio
    async def turno_de(grua, intentos):
        espera = 0.1
        for intento in range(1, intentos + 1):
            try:
                return await taller.pedir(grua)
            except ErrorServidor:
                if intento < intentos:
                    await asyncio.sleep(espera)
                    espera *= 2
        return "sin señal"
    async def turnos_con_paciencia(gruas, intentos):
        return [[await turno_de(grua, intentos) for grua in gruas], taller.ahora()]
```

## Misión final

```exercise
id: py18-mision-muelle
type: mission
title: El orden de la carga
prompt: |
  **Pide a la torre la lista de contenedores y, a la vez, el turno de cada uno; después lleva a Quilla al punto de carga (D) y entrega los contenedores en el orden de su turno.**

  - `await taller.pedir("pedidos")` → la lista de códigos, como `["MSKU-204", "CMAU-118"]`.
  - `await taller.pedir("MSKU-204")` → su turno, como `"08:15"`. Los turnos `"HH:MM"` se ordenan bien como texto.
  - Un `404` quiere decir que ese contenedor está **retenido en aduanas**: no se entrega, y Quilla avisa con `robot.decir(f"Retenido: {codigo}")`.
  - La torre falla seguido: ante un `503`, reintenta con retroceso exponencial (100 ms, 200 ms, 400 ms…), hasta 5 intentos.
  - Para llegar a D: avanza hasta la pared, gira a la derecha y avanza hasta la pared. La etiqueta de cada entrega es `f"{codigo} {turno}"`.

  Los contenedores, los turnos, las fallas y el muelle cambian en cada prueba.
visual:
  figure:
    title: La primera prueba
    panes:
      - { label: "pedidos", cells: ["MSKU-204", "CMAU-118", "HLXU-771"] }
      - { label: "turnos (pedidos a la vez)", cards: [{ title: turnos, rows: [["MSKU-204", "\"08:15\""], ["CMAU-118", "\"07:40\""], ["HLXU-771", "\"09:05\""]] }] }
      - { label: "entregas, por turno", cells: ["CMAU-118 07:40", "MSKU-204 08:15", "HLXU-771 09:05"] }
starter: |
  import asyncio

  async def pedir_con_reintento(recurso, intentos=5):
      # TODO: reintenta los 503 esperando 100, 200, 400… ms; un 404 se lanza de inmediato
      return await taller.pedir(recurso)

  async def principal():
      codigos = await pedir_con_reintento("pedidos")
      # TODO: pide el turno de todos los códigos a la vez (TaskGroup o gather)
      # TODO: camina hasta D y entrega en orden de turno; los retenidos se avisan

  asyncio.run(principal())
solution: |
  import asyncio

  async def pedir_con_reintento(recurso, intentos=5):
      espera = 0.1
      for intento in range(1, intentos + 1):
          try:
              return await taller.pedir(recurso)
          except ErrorServidor as error:
              if error.status == 404 or intento == intentos:
                  raise
              await asyncio.sleep(espera)
              espera *= 2

  async def turno_o_retenido(codigo):
      try:
          return await pedir_con_reintento(codigo)
      except ErrorServidor as error:
          if error.status == 404:
              return None
          raise

  def caminar_hasta_la_pared():
      while not robot.hay_pared("frente"):
          robot.avanzar()

  async def principal():
      codigos = await pedir_con_reintento("pedidos")
      turnos = await asyncio.gather(*(turno_o_retenido(codigo) for codigo in codigos))
      carga = []
      for codigo, turno in zip(codigos, turnos):
          if turno is None:
              robot.decir(f"Retenido: {codigo}")
          else:
              carga.append((turno, codigo))
      caminar_hasta_la_pared()
      robot.girar_derecha()
      caminar_hasta_la_pared()
      for turno, codigo in sorted(carga):
          robot.entregar(f"{codigo} {turno}")

  asyncio.run(principal())
hints:
  - "Una corrutina `turno_o_retenido(codigo)` que llame a `pedir_con_reintento` y, si atrapa un `ErrorServidor` con `status == 404`, devuelva `None`. Lánzalas todas con `asyncio.gather(*(…))`."
  - "Junta `(turno, codigo)` de los que no son `None` y recórrelos con `sorted(...)`: ordena por turno."
world:
  theme: barranco
  level: 2
  dir: E
  map: |
    ############
    #R........##
    #########.##
    #########D##
    ############
server:
  seed: 31
  latency: [100, 300]
  failOn: [1, 3]
  data:
    pedidos: ["MSKU-204", "CMAU-118", "HLXU-771"]
    "MSKU-204": "08:15"
    "CMAU-118": "07:40"
    "HLXU-771": "09:05"
scenarios:
  - tests:
      - name: entrega los tres contenedores en orden de turno
        state: 'w.delivered == ["CMAU-118 07:40", "MSKU-204 08:15", "HLXU-771 09:05"]'
        msg: Entrega cada contenedor con su turno, del más temprano al más tarde.
  - map: |
      #########
      #R....###
      #####.###
      #####.###
      #####D###
      #########
    server:
      failOn: [2, 3, 6]
      data:
        pedidos: ["TGHU-330", "MRKU-512", "SEGU-907", "CAIU-246"]
        "TGHU-330": "06:50"
        "SEGU-907": "06:20"
        "CAIU-246": "10:30"
    tests:
      - name: entrega tres y deja el retenido
        state: 'w.delivered == ["SEGU-907 06:20", "TGHU-330 06:50", "CAIU-246 10:30"]'
      - name: avisa del contenedor retenido
        state: '"Retenido: MRKU-512" in w.said'
tests:
  - name: pide los turnos a la vez
    state: 'len({min(r.start for r in s.requests if r.resource == c) for c in {r.resource for r in s.requests} - {"pedidos"}}) == 1'
    msg: El primer pedido de cada turno debe salir en el mismo instante, apenas llega la lista.
  - name: reintenta con retroceso exponencial
    state: 'all(q[i].start - q[i - 1].end == 100 * 2 ** (i - 1) for c in {r.resource for r in s.requests} for q in [[r for r in s.requests if r.resource == c]] for i in range(1, len(q)))'
    msg: Tras cada 503, espera 100 ms, luego 200, luego 400, antes de volver a pedir lo mismo.
  - name: sin chocar
    state: not w.crashed
  - name: usa gather o TaskGroup
    source: 'gather\(|TaskGroup\(\)'
```

## Reto experto

```exercise
id: py18-reto-gruas
type: challenge
title: ¿Cuántas grúas hacen falta?
prompt: |
  **Escribe `async def tiempo_total(duraciones, k)`, que simula `k` grúas sacando contenedores de una misma `asyncio.Queue` y devuelve en cuántos ms terminan, y `gruas_necesarias(duraciones, limite)`, que devuelve la menor cantidad de grúas que terminan en `limite` ms o menos, o `-1` si ni con una grúa por contenedor alcanza.** Para quien ya programa.

  Todos los contenedores están en la cola desde el ms 0, en el orden de `duraciones`; `duraciones[i]` es lo que tarda en bajar el contenedor `i`. Cada grúa toma el siguiente apenas se libera. `gruas_necesarias` no es `async`: llama a `asyncio.run` por cada `k` que pruebe.
starter: |
  import asyncio

  async def tiempo_total(duraciones, k):
      return 0

  def gruas_necesarias(duraciones, limite):
      return -1

  print(gruas_necesarias([300, 200, 400, 100], 600))
solution: |
  import asyncio

  async def grua(cola):
      while True:
          ms = await cola.get()
          await asyncio.sleep(ms / 1000)
          cola.task_done()

  async def tiempo_total(duraciones, k):
      bucle = asyncio.get_running_loop()
      inicio = bucle.time()
      cola = asyncio.Queue()
      for ms in duraciones:
          cola.put_nowait(ms)
      gruas = [asyncio.create_task(grua(cola)) for _ in range(k)]
      await cola.join()
      for tarea in gruas:
          tarea.cancel()
      return round((bucle.time() - inicio) * 1000)

  def gruas_necesarias(duraciones, limite):
      for k in range(1, len(duraciones) + 1):
          if asyncio.run(tiempo_total(duraciones, k)) <= limite:
              return k
      return -1

  print(gruas_necesarias([300, 200, 400, 100], 600))
hints:
  - "`tiempo_total`: llena la cola con `put_nowait`, crea `k` tareas que hagan `get`, `sleep` y `task_done` en un bucle, y espera con `await cola.join()`. No olvides cancelar las tareas al final."
tests:
  - name: dos grúas para el ejemplo
    run: gruas_necesarias([300, 200, 400, 100], 600)
    equals: 2
  - name: el tiempo con dos grúas
    run: asyncio.run(tiempo_total([300, 200, 400, 100], 2))
    equals: 600
  - name: el orden de la cola importa
    run: asyncio.run(tiempo_total([100, 100, 500, 500], 2))
    equals: 600
  - name: imposible si un contenedor solo ya se pasa
    run: gruas_necesarias([200, 700], 600)
    equals: -1
  - name: sin contenedores no hace falta esperar
    run: asyncio.run(tiempo_total([], 3))
    equals: 0
  - name: usa una asyncio.Queue
    source: 'asyncio\.Queue\('
```
