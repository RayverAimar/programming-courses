# Sesión 2 — Condicionales

## El encargo

El Museo Larco, en Pueblo Libre, guarda miles de huacos, una sala entera de oro y plata y un jardín de buganvilias que de noche se queda a oscuras. Don Alipio, su vigilante nocturno de toda la vida, se jubila el viernes, y la directora llamó a Maru Chumpitaz: ¿podría Quilla hacer la ronda?

Maru le atornilló una **sirena** en la cabeza y un sensor que lee la puerta de cada sala: si quedó abierta y si algo se mueve adentro. Pero ninguna noche es igual a otra. Un robot que hace siempre lo mismo le cierra la puerta en la cara a la señora de la limpieza o deja pasar a un ladrón de huacos. Hoy Quilla aprende a **decidir**.

```escena
theme: museo
level: 2
dir: E
caption: La primera ronda de Quilla. La sala de textiles quedó abierta y vacía; en la de cerámica, algo se mueve.
map: |
  ###########
  #R........#
  ###O####P##
  ###.####m##
  ###########
program: |
  robot.avanzar(2)
  lectura = robot.sensor()
  if lectura["puerta"] == "abierta":
      robot.cerrar_puerta()
  robot.avanzar(5)
  lectura = robot.sensor()
  if lectura["movimiento"]:
      robot.alarma()
```

## Lo mínimo

`if` ejecuta un bloque solo si su condición es verdadera. `elif` (de *else if*) prueba otra condición si la anterior falló, y `else` atrapa todo lo demás. Python las revisa de arriba abajo y **solo corre el primer bloque que cumple**. El bloque es lo que va **con sangría** (cuatro espacios) después de los dos puntos.

```py run
humedad = 68
if humedad > 70:
    print("Encender el deshumedecedor")
elif 45 <= humedad <= 70:
    print("Humedad buena para los huacos")
else:
    print("Muy seca: cuidado con la madera")
```

Mira qué camino toma el programa con una lectura de las once de la noche: solo se ilumina el bloque que corre; los otros se saltan sin mirarlos.

```anima
title: El primer bloque que cumple, y ninguno más
code: |
  hora = 23
  movimiento = True
  if not movimiento:
      alerta = "calma"
  elif 9 <= hora < 18:
      alerta = "visitante"
  else:
      alerta = "intruso"
  sirena = "suena" if alerta == "intruso" else "apagada"
  print(alerta, sirena)
notes:
  3: not movimiento es False, porque sí hay movimiento. Este bloque se salta.
  5: "¿Está la hora entre 9 y 18? 23 no lo está: también se salta."
  8: Ninguna condición cumplió, así que corre el else.
  9: Una decisión en una sola línea, como valor de una variable.
```

Lo que necesitas para hoy:

- **Comparar:** `==` (igual), `!=` (distinto), `<`, `>`, `<=`, `>=`. Python las **encadena** como en matemáticas: `9 <= hora < 18` es "hora entre 9 y 18, sin incluir el 18".
- **Combinar** se escribe con palabras: `and` (las dos), `or` (al menos una), `not` (lo contrario).
- **Verdadero y falso sin booleanos.** Un `if` acepta cualquier valor. Cuentan como falsos (*falsy*) `False`, `0`, `0.0`, `""` (texto vacío), `[]` (lista vacía) y `None`; todo lo demás es verdadero, incluso los textos `"0"` y `"False"`.
- **`is None`.** `==` compara valores. `is` pregunta si es **el mismo objeto**, y solo lo usarás con `None`: `if lectura is None:`. Para todo lo demás, `==`.
- **Una decisión en una línea:** `a if condicion else b` vale `a` cuando se cumple y `b` cuando no: `estado = "abierta" if abierta else "cerrada"`.

```py run
visitantes = 0
guia = None
nota = "0"
print(bool(visitantes), bool(guia), bool(nota), bool(""), bool([]))
print("vacío" if not visitantes else "con gente", guia is None)
```

> **Trampa común:** en Python la sangría **es** el bloque. Una línea que se queda sin sangría ya no pertenece al `if` y corre siempre:
>
> ```py
> if movimiento:
>     robot.alarma()
> print("Avisé a Maru")  # sin sangría: se imprime haya o no movimiento
> ```
>
> Y si en un mismo bloque una línea tiene cuatro espacios y otra tres, el programa ni arranca: es un `IndentationError`.

<!-- legacy: chained-comparison -->

<!-- legacy: is-none -->

<!-- legacy: conditional-expression -->

<!-- mdn: chained-comparison is-none conditional-expression -->

## Práctica

```exercise
id: py2-predice-humedad
type: predict
title: El higrómetro de la sala de textiles
prompt: |
  Los mantos de la sala de textiles sufren con la humedad. El sensor marca 82. ¿Qué imprime?
code: |
  humedad = 82
  if humedad > 60:
      print("Húmedo")
  elif humedad > 80:
      print("Muy húmedo: llamar a Maru")
  else:
      print("Bien")
  print("Fin de la lectura")
options:
  - "Húmedo\nFin de la lectura"
  - "Muy húmedo: llamar a Maru\nFin de la lectura"
  - "Húmedo\nMuy húmedo: llamar a Maru\nFin de la lectura"
  - "Húmedo"
answer: "Húmedo\nFin de la lectura"
explain: |
  82 cumple `humedad > 60`, así que corre ese bloque y la cadena termina: el `elif` ni se mira. Con este orden, "Muy húmedo" **nunca** podría imprimirse; la condición más exigente tiene que ir primero. La última línea no tiene sangría, así que corre siempre.
```

```exercise
id: py2-predice-falsy
type: predict
title: Lo que hay y lo que no
prompt: |
  Al cerrar el museo, Quilla revisa cuatro datos del día. ¿Qué imprime?
code: |
  visitantes = 0
  objetos_perdidos = []
  codigo = "0"
  guia = None
  if visitantes:
      print("hay visitantes")
  if not objetos_perdidos:
      print("nada perdido")
  if codigo:
      print("hay código")
  if guia is None:
      print("sin guía")
options:
  - "nada perdido\nhay código\nsin guía"
  - "nada perdido\nsin guía"
  - "hay visitantes\nnada perdido\nhay código\nsin guía"
  - "hay código"
answer: "nada perdido\nhay código\nsin guía"
explain: |
  `0` y la lista vacía `[]` son *falsy*: no hay visitantes, y `not []` es `True`. `"0"` es un texto con un carácter adentro, así que es *truthy* aunque parezca un cero. Y `guia` es `None`, que se pregunta con `is`.
```

```exercise
id: py2-completa-vitrina
type: complete
title: La vitrina de oro
prompt: |
  Completa los huecos para que `estado` sea `"en orden"` si la temperatura está **entre 18 y 24 grados, ambos incluidos**, y además el vidrio está `"intacto"`; si no, `"revisar"`.

  `temperatura` y `vidrio` te llegan del sensor de la vitrina, y se prueba con varias lecturas. Usa una comparación encadenada.
visual:
  figure:
    title: Cuándo está en orden la vitrina
    table:
      head: ["temperatura", "vidrio", "estado"]
      rows: [["21", "\"intacto\"", "\"en orden\""], ["18", "\"intacto\"", "\"en orden\""], ["25", "\"intacto\"", "\"revisar\""], ["21", "\"rajado\"", "\"revisar\""]]
starter: |
  if ___ <= temperatura <= ___ ___ vidrio == "intacto":
      estado = "en orden"
  ___:
      estado = "revisar"
  print(f"Vitrina de oro: {estado}")
solution: |
  if 18 <= temperatura <= 24 and vidrio == "intacto":
      estado = "en orden"
  else:
      estado = "revisar"
  print(f"Vitrina de oro: {estado}")
hints:
  - Los dos primeros huecos son los bordes del rango; el tercero junta las dos condiciones.
  - El último hueco es la palabra que atrapa "todo lo demás".
globals:
  temperatura: 21
  vidrio: intacto
scenarios:
  - tests:
      - name: 21 grados e intacto → en orden
        output: "Vitrina de oro: en orden"
  - globals: { temperatura: 25, vidrio: intacto }
    tests:
      - name: 25 grados → revisar
        output: "Vitrina de oro: revisar"
  - globals: { temperatura: 18, vidrio: intacto }
    tests:
      - name: 18 grados en punto → en orden
        output: "Vitrina de oro: en orden"
  - globals: { temperatura: 24, vidrio: intacto }
    tests:
      - name: 24 grados en punto → en orden
        output: "Vitrina de oro: en orden"
  - globals: { temperatura: 21, vidrio: rajado }
    tests:
      - name: vidrio rajado → revisar
        output: "Vitrina de oro: revisar"
tests:
  - name: usa una comparación encadenada
    source: '\d+\s*<=\s*temperatura\s*<=\s*\d+'
    msg: Escribe el rango como 18 <= temperatura <= 24.
```

```exercise
id: py2-arregla-or
type: fix
title: La sirena que sonaba en todas las salas
prompt: |
  Arregla la condición para que la sirena suene **solo** si hay movimiento en la sala de **oro** o en la de **plata**, las únicas con el sensor nuevo.

  Anoche la sirena sonó en la sala de cerámica, y la noche anterior sonó sin que nada se moviera. `sala` y `movimiento` llegan del sensor; se prueba con cuatro lecturas.
starter: |
  if movimiento and sala == "oro" or "plata":
      alerta = "sirena"
  else:
      alerta = "silencio"
  print(alerta)
solution: |
  if movimiento and (sala == "oro" or sala == "plata"):
      alerta = "sirena"
  else:
      alerta = "silencio"
  print(alerta)
hints:
  - "`or \"plata\"` no compara nada: pregunta si el texto `\"plata\"` es verdadero, y un texto no vacío siempre lo es."
  - "Cada lado del `or` tiene que ser una comparación completa, y el `or` va entre paréntesis para que el `and` mire a los dos."
globals:
  sala: cerámica
  movimiento: true
scenarios:
  - tests:
      - name: movimiento en cerámica → silencio
        output: silencio
  - globals: { sala: oro, movimiento: true }
    tests:
      - name: movimiento en oro → sirena
        output: sirena
  - globals: { sala: plata, movimiento: false }
    tests:
      - name: plata sin movimiento → silencio
        output: silencio
  - globals: { sala: plata, movimiento: true }
    tests:
      - name: movimiento en plata → sirena
        output: sirena
```

```exercise
id: py2-arregla-torniquete
type: fix
title: El torniquete que no estaba malogrado
prompt: |
  Arregla la primera condición para que el aviso de "malogrado" salga **solo** cuando el torniquete no mandó nada (`None`), y no cuando entraron cero personas.

  El torniquete de la entrada cuenta los visitantes del día y se lo pasa a Quilla en `visitantes`. Cuando se malogra, manda `None`. El martes llovió todo el día, no vino nadie, y Quilla despertó a Maru a medianoche para decirle que el torniquete estaba malogrado.
starter: |
  if not visitantes:
      print("Torniquete malogrado: avisar a Maru")
  elif visitantes > 300:
      print(f"{visitantes} visitantes: día lleno")
  else:
      print(f"{visitantes} visitantes")
solution: |
  if visitantes is None:
      print("Torniquete malogrado: avisar a Maru")
  elif visitantes > 300:
      print(f"{visitantes} visitantes: día lleno")
  else:
      print(f"{visitantes} visitantes")
hints:
  - "`not visitantes` es `True` con `None`, pero también con `0`."
  - "Para preguntar por `None` y solo por `None`, se usa `is None`."
globals:
  visitantes: 0
scenarios:
  - tests:
      - name: cero visitantes no es una falla
        output: 0 visitantes
        msg: Con 0 visitantes el torniquete funciona; solo no vino nadie.
  - globals: { visitantes: null }
    tests:
      - name: None → malogrado
        output: "Torniquete malogrado: avisar a Maru"
  - globals: { visitantes: 412 }
    tests:
      - name: 412 → día lleno
        output: "412 visitantes: día lleno"
  - globals: { visitantes: 120 }
    tests:
      - name: 120 visitantes
        output: 120 visitantes
tests:
  - name: pregunta con is None
    source: '\bis\s+None\b'
    msg: Compara con None usando is None.
```

```exercise
id: py2-escribe-ronda
type: write
title: Antes de seguir la ronda
prompt: |
  Calcula dos decisiones de Quilla frente a una puerta: `accion` en **una sola línea** con `… if … else …`, y `aviso` con `if`/`elif`/`else`.

  - `accion` es `"cerrar"` si `puerta` es `"abierta"`, y `"seguir"` si no.
  - `aviso` depende de la `bateria`: menos de 15 es `"a cargar ya"`; de 15 a 39 es `"media ronda"`; de 40 en adelante, `"ronda completa"`.

  Al final, imprime `print(accion, aviso, sep=" · ")`. `puerta` y `bateria` cambian en cada prueba.
visual:
  figure:
    title: Las dos decisiones
    panes:
      - label: accion
        table:
          head: ["puerta", "accion"]
          rows: [["\"abierta\"", "\"cerrar\""], ["\"cerrada\"", "\"seguir\""]]
      - label: aviso
        table:
          head: ["bateria", "aviso"]
          rows: [["0 a 14", "\"a cargar ya\""], ["15 a 39", "\"media ronda\""], ["40 a 100", "\"ronda completa\""]]
starter: |
  # puerta y bateria ya existen
  accion = ""
  aviso = ""
  print(accion, aviso, sep=" · ")
solution: |
  accion = "cerrar" if puerta == "abierta" else "seguir"
  if bateria < 15:
      aviso = "a cargar ya"
  elif bateria < 40:
      aviso = "media ronda"
  else:
      aviso = "ronda completa"
  print(accion, aviso, sep=" · ")
hints:
  - "`accion = \"cerrar\" if puerta == \"abierta\" else \"seguir\"`"
  - En el `elif` ya sabes que la batería no es menor que 15, porque si no habría entrado al primer bloque.
globals:
  puerta: abierta
  bateria: 80
scenarios:
  - tests:
      - name: abierta y 80 de batería
        output: cerrar · ronda completa
  - globals: { puerta: cerrada, bateria: 15 }
    tests:
      - name: cerrada y 15 de batería
        output: seguir · media ronda
  - globals: { puerta: abierta, bateria: 14 }
    tests:
      - name: abierta y 14 de batería
        output: cerrar · a cargar ya
  - globals: { puerta: cerrada, bateria: 39 }
    tests:
      - name: cerrada y 39 de batería
        output: seguir · media ronda
  - globals: { puerta: cerrada, bateria: 40 }
    tests:
      - name: cerrada y 40 de batería
        output: seguir · ronda completa
tests:
  - name: accion en una sola línea con if y else
    source: '^accion\s*=.+\bif\b.+\belse\b'
    msg: 'Escribe accion = "…" if … else "…" en una sola línea.'
```

## El caso

```exercise
id: py2-caso-turno
type: case
title: El turno que no cuadra
prompt: |
  **Aplica el protocolo a la lectura de cada vigilante, calcula el nivel que correspondía y compáralo con el que anotó.** El que no cuadra silenció una alarma que debía sonar.

  Antes de jubilarse, Don Alipio repartió la ronda entre cuatro vigilantes de prueba. A la mañana siguiente faltaba un huaco retrato del depósito, y en el cuaderno de turnos nadie había dejado sonar la sirena. La directora le pasó a Maru el cuaderno y el protocolo pegado en la caseta.

  Cada bloque del código es la lectura de un vigilante. Debajo de cada uno, calcula `nivel` con `if`/`elif`/`else` (`autorizado` es `None` cuando no había nadie autorizado en la sala) e imprime una línea que empiece con su nombre, por ejemplo `print("Fermín:", nivel)`; el tablero te dirá si cuadra.
visual:
  board:
    for: py2-caso-turno
    task: "Calcula el nivel de cada lectura con el protocolo y compáralo con el que anotó cada vigilante."
    cards:
      - name: Fermín
        kind: person
        role: Sala de oro y plata
        rows: [["Hora", "21:00"], ["Movimiento", "sí"], ["Autorizado", "Gladys (limpieza)"], ["Puerta", "cerrada"], ["Anotó", "nivel 1, silenció"]]
        clue: { find: "Fermín", says: 1, saysLabel: Anotó }
      - name: Yesenia
        kind: person
        role: Sala de textiles
        rows: [["Hora", "03:00"], ["Movimiento", "no"], ["Autorizado", "nadie"], ["Puerta", "abierta"], ["Anotó", "nivel 1, silenció"]]
        clue: { find: "Yesenia", says: 1, saysLabel: Anotó }
      - name: Rolando
        kind: person
        role: Depósito de huacos
        culprit: true
        rows: [["Hora", "22:00"], ["Movimiento", "sí"], ["Autorizado", "Lucho (limpieza)"], ["Puerta", "cerrada"], ["Anotó", "nivel 1, silenció"]]
        clue: { find: "Rolando", says: 1, saysLabel: Anotó }
      - name: Pilar
        kind: person
        role: Sala de cerámica
        rows: [["Hora", "04:00"], ["Movimiento", "sí"], ["Autorizado", "nadie"], ["Puerta", "abierta"], ["Anotó", "nivel 3, sonó la sirena"]]
        clue: { find: "Pilar", says: 3, saysLabel: Anotó }
      - name: Protocolo nocturno
        kind: note
        role: Pegado en la caseta
        rows: [["Sin movimiento", "nivel 0 (puerta cerrada) o 1 (abierta)"], ["Movimiento, nadie autorizado", "nivel 3"], ["Movimiento, autorizado, de 20:00 a 21:59", "nivel 1 (es la limpieza)"], ["Movimiento, autorizado, a otra hora", "nivel 2"], ["Nivel 2 o más", "la sirena tiene que sonar"]]
starter: |
  # Fermín, sala de oro y plata
  hora = 21
  movimiento = True
  autorizado = "Gladys (limpieza)"
  puerta = "cerrada"
  # TODO: calcula nivel con if/elif/else e imprime print("Fermín:", nivel)

  # Yesenia, sala de textiles
  hora = 3
  movimiento = False
  autorizado = None
  puerta = "abierta"
  # TODO: lo mismo para Yesenia

  # Rolando, depósito de huacos
  hora = 22
  movimiento = True
  autorizado = "Lucho (limpieza)"
  puerta = "cerrada"
  # TODO: lo mismo para Rolando

  # Pilar, sala de cerámica
  hora = 4
  movimiento = True
  autorizado = None
  puerta = "abierta"
  # TODO: lo mismo para Pilar
solution: |
  hora = 21
  movimiento = True
  autorizado = "Gladys (limpieza)"
  puerta = "cerrada"
  if not movimiento:
      nivel = 1 if puerta == "abierta" else 0
  elif autorizado is None:
      nivel = 3
  elif 20 <= hora < 22:
      nivel = 1
  else:
      nivel = 2
  print("Fermín:", nivel)

  hora = 3
  movimiento = False
  autorizado = None
  puerta = "abierta"
  if not movimiento:
      nivel = 1 if puerta == "abierta" else 0
  elif autorizado is None:
      nivel = 3
  elif 20 <= hora < 22:
      nivel = 1
  else:
      nivel = 2
  print("Yesenia:", nivel)

  hora = 22
  movimiento = True
  autorizado = "Lucho (limpieza)"
  puerta = "cerrada"
  if not movimiento:
      nivel = 1 if puerta == "abierta" else 0
  elif autorizado is None:
      nivel = 3
  elif 20 <= hora < 22:
      nivel = 1
  else:
      nivel = 2
  print("Rolando:", nivel)

  hora = 4
  movimiento = True
  autorizado = None
  puerta = "abierta"
  if not movimiento:
      nivel = 1 if puerta == "abierta" else 0
  elif autorizado is None:
      nivel = 3
  elif 20 <= hora < 22:
      nivel = 1
  else:
      nivel = 2
  print("Pilar:", nivel)
answer: Rolando
answerLabel: ¿Qué vigilante silenció una alarma que debía sonar?
reveal: |
  Rolando. A las 22:00 la limpieza ya había terminado: el horario es `20 <= hora < 22`, y el 22 queda fuera. Movimiento con alguien autorizado fuera de ese horario es nivel 2, y la sirena tenía que sonar. Rolando anotó nivel 1 ("era Lucho, el de limpieza") y la silenció. Fermín, Yesenia y Pilar cuadran: 1, 1 y 3.
hints:
  - "Escribe la cadena una vez, para Fermín, empezando por el caso sin movimiento: `if not movimiento:` y adentro `nivel = 1 if puerta == \"abierta\" else 0`. Luego cópiala debajo de cada bloque."
  - "El horario de limpieza es `20 <= hora < 22`: el 22 ya no entra."
```

## El juez

Lee la entrada con `input()` y conviértela con `int()`, como en la sesión 1; responde con `print`.

```exercise
id: py2-juez-tarifa
type: judge
title: La tarifa del Larco
prompt: |
  **Imprime cuánto paga una persona por su entrada al Museo Larco, según su edad, el día y si trae carné universitario.**

  Quilla atiende la boletería mientras Maru almuerza. La tarifa, pegada en la ventanilla:

  - Menores de **5** años: gratis (**0**).
  - De **5 a 17** años: **15** soles, y **gratis** los miércoles (día 3), que son de colegios.
  - De **65** años en adelante: **18** soles, cualquier día.
  - De **18 a 25** años **con carné** universitario: **20** soles, cualquier día.
  - El resto paga **35** soles de lunes a viernes, y **40** el sábado y el domingo (días 6 y 7).

  **Entrada:** tres líneas: la edad `E`; el día `D` (1 es lunes, 7 es domingo); y `C`, que es `1` si trae carné universitario y `0` si no.

  **Salida:** una línea con el precio en soles.

  **Restricciones:** 0 ≤ E ≤ 100 · 1 ≤ D ≤ 7 · C es 0 o 1.
starter: |
  edad = int(input())
  dia = int(input())
  carne = int(input())
  print(35)
solution: |
  edad = int(input())
  dia = int(input())
  carne = int(input())
  if edad < 5:
      precio = 0
  elif edad <= 17:
      precio = 0 if dia == 3 else 15
  elif edad >= 65:
      precio = 18
  elif edad <= 25 and carne == 1:
      precio = 20
  elif dia >= 6:
      precio = 40
  else:
      precio = 35
  print(precio)
hints:
  - Ordena la cadena de lo más específico a lo más general y revisa los bordes (5, 17, 18, 25, 65). En cada `elif` ya sabes que las condiciones de arriba fallaron.
  - "`input()` devuelve texto, y el texto `\"0\"` es verdadero. Convierte el carné con `int()` antes de preguntar por él."
visual:
  - figure:
      title: El ejemplo 1, en la ventanilla
      input: { label: Entrada, text: "22\n6\n1" }
      arrow: 22 años, sábado, con carné
      output: { label: Salida, value: "20" }
      steps:
        - "No es menor de 18 ni tiene 65 o más."
        - "Tiene entre 18 y 25 y trae carné: paga 20, aunque sea sábado."
  - figure:
      title: La tarifa
      table:
        head: ["Edad", "Lunes a viernes", "Sábado y domingo"]
        rows: [["0 a 4", "0", "0"], ["5 a 17", "15 (miércoles: 0)", "15"], ["18 a 25 con carné", "20", "20"], ["18 a 64, el resto", "35", "40"], ["65 o más", "18", "18"]]
samples:
  - input: "22\n6\n1"
    output: "20"
    note: Con carné, el universitario paga 20 también el sábado.
  - input: "22\n6\n0"
    output: "40"
    note: Sin carné es un adulto más, y es sábado.
  - input: "10\n3\n0"
    output: "0"
    note: Miércoles de colegios.
edge:
  - input: "4\n1\n0"
    tag: en el borde de los 5 años
  - input: "5\n1\n0"
    tag: en el borde de los 5 años
  - input: "5\n3\n0"
    tag: con un niño de 5 años un miércoles
  - input: "17\n7\n1"
    tag: en el borde de los 18 años, con carné
  - input: "18\n7\n1"
    tag: en el borde de los 18 años, con carné
  - input: "25\n6\n1"
    tag: en el borde de los 25 años, con carné
  - input: "26\n6\n1"
    tag: en el borde de los 25 años, con carné
  - input: "26\n2\n1"
    tag: con carné pero más de 25 años
  - input: "30\n3\n0"
    tag: con un adulto un miércoles
  - input: "64\n5\n0"
    tag: en el borde de los 65 años
  - input: "65\n6\n1"
    tag: en el borde de los 65 años
  - input: "0\n7\n0"
    tag: con un bebé recién nacido
  - input: "100\n7\n0"
    tag: con la edad máxima
  - input: "20\n2\n0"
    tag: con un joven sin carné
random:
  count: 45
  seed: 22
  tag: ""
  generate: |
    if rng.int(0, 2) == 0:
        edad = rng.pick([4, 5, 17, 18, 25, 26, 64, 65])
    else:
        edad = rng.int(0, 100)
    return f"{edad}\n{rng.int(1, 7)}\n{rng.int(0, 1)}"
wrong:
  - |
    edad = int(input())
    dia = int(input())
    carne = int(input())
    if edad <= 5:
        precio = 0
    elif edad <= 17:
        precio = 0 if dia == 3 else 15
    elif edad >= 65:
        precio = 18
    elif edad <= 25 and carne == 1:
        precio = 20
    elif dia >= 6:
        precio = 40
    else:
        precio = 35
    print(precio)
  - |
    edad = int(input())
    dia = int(input())
    carne = int(input())
    if edad < 5:
        precio = 0
    elif edad <= 17:
        precio = 0 if dia == 3 else 15
    elif edad >= 65:
        precio = 18
    elif dia >= 6:
        precio = 40
    elif edad <= 25 and carne == 1:
        precio = 20
    else:
        precio = 35
    print(precio)
  - |
    edad = int(input())
    dia = int(input())
    carne = input()
    if edad < 5:
        precio = 0
    elif edad <= 17:
        precio = 0 if dia == 3 else 15
    elif edad >= 65:
        precio = 18
    elif edad <= 25 and carne:
        precio = 20
    elif dia >= 6:
        precio = 40
    else:
        precio = 35
    print(precio)
```

## Misión final

```exercise
id: py2-mision-ronda
type: mission
title: La ronda del Larco
prompt: |
  **En cada una de las tres salas, cierra la puerta si está abierta y haz sonar la sirena si hay movimiento; al final, entrega el informe en la caseta (D).**

  La ronda tiene forma de U: Quilla recorre el pasillo de arriba hacia el este, baja por el jardín y vuelve por el pasillo de abajo hasta la caseta del vigilante. La **batería es justa: 24 casillas**, ni una de más. Parado sobre el pasillo, con la puerta de una sala justo debajo:

  - `robot.sensor()` devuelve un **diccionario**, por ejemplo `{"puerta": "abierta", "movimiento": True}`. Guárdalo en una variable y lee cada dato con corchetes: `lectura["puerta"]`, `lectura["movimiento"]`.
  - `robot.cerrar_puerta()` la cierra y `robot.alarma()` hace sonar la sirena en esa sala.

  Cuenta las alarmas en `alarmas` (`alarmas = alarmas + 1`) y arma `informe` en **una línea** con `… if … else …`: `"Sin novedad"` si no sonó ninguna, o `"Alarmas: N"` si sonaron N. Entrégalo con `robot.entregar(informe)`. Se prueba con cuatro noches distintas.

  Cuando pase, junto con el juez, se desbloquea la sesión 3.
visual:
  figure:
    title: Qué hacer en cada puerta
    table:
      head: ["El sensor dice", "Quilla hace"]
      rows: [["\"puerta\": \"abierta\"", "`robot.cerrar_puerta()`"], ["\"movimiento\": True", "`robot.alarma()` y suma 1 a `alarmas`"], ["las dos cosas", "las dos"], ["cerrada y sin movimiento", "nada, sigue"]]
starter: |
  alarmas = 0

  # Sala 1: textiles
  robot.avanzar(2)
  lectura = robot.sensor()
  print("Sala 1:", lectura)

  # Sala 2: cerámica

  # Sala 3: depósito, en el pasillo de abajo

  # El informe, en la caseta
solution: |
  alarmas = 0

  robot.avanzar(2)
  lectura = robot.sensor()
  if lectura["puerta"] == "abierta":
      robot.cerrar_puerta()
  if lectura["movimiento"]:
      robot.alarma()
      alarmas = alarmas + 1

  robot.avanzar(5)
  lectura = robot.sensor()
  if lectura["puerta"] == "abierta":
      robot.cerrar_puerta()
  if lectura["movimiento"]:
      robot.alarma()
      alarmas = alarmas + 1

  robot.avanzar(3)
  robot.girar_derecha()
  robot.avanzar(4)
  robot.girar_derecha()
  robot.avanzar(6)
  lectura = robot.sensor()
  if lectura["puerta"] == "abierta":
      robot.cerrar_puerta()
  if lectura["movimiento"]:
      robot.alarma()
      alarmas = alarmas + 1

  robot.avanzar(4)
  informe = "Sin novedad" if alarmas == 0 else f"Alarmas: {alarmas}"
  robot.entregar(informe)
hints:
  - Cerrar y hacer sonar son dos decisiones independientes, así que son dos `if` separados, no un `if`/`else`. Te tocará repetir el bloque tres veces; en la sesión 3 eso desaparece.
  - "El camino: 2 al este, 5 al este, 3 al este; gira a la derecha y baja 4; gira a la derecha otra vez y avanza 6 hasta la tercera puerta, y 4 más hasta la caseta."
world:
  theme: museo
  level: 2
  dir: E
  battery: 24
  api: [move, museum, deliver]
  map: |
    #############
    #R..........#
    ###P####O##.#
    ###.####m##.#
    ###########.#
    #D..........#
    #####P#######
    #####.#######
    #############
scenarios:
  - tests:
      - name: 'informe "Alarmas: 1"'
        state: 'w.delivered == ["Alarmas: 1"]'
        msg: 'Esta noche sonó una alarma: el informe debe ser "Alarmas: 1".'
  - map: |
      #############
      #R..........#
      ###O####P##.#
      ###m####.##.#
      ###########.#
      #D..........#
      #####O#######
      #####m#######
      #############
    tests:
      - name: 'informe "Alarmas: 2"'
        state: 'w.delivered == ["Alarmas: 2"]'
        msg: 'Esta noche sonaron dos alarmas: el informe debe ser "Alarmas: 2".'
  - map: |
      #############
      #R..........#
      ###P####P##.#
      ###.####.##.#
      ###########.#
      #D..........#
      #####P#######
      #####.#######
      #############
    tests:
      - name: informe "Sin novedad"
        state: 'w.delivered == ["Sin novedad"]'
        msg: Esta noche no sonó ninguna alarma; el informe debe ser "Sin novedad".
  - map: |
      #############
      #R..........#
      ###P####O##.#
      ###m####m##.#
      ###########.#
      #D..........#
      #####O#######
      #####m#######
      #############
    tests:
      - name: 'informe "Alarmas: 3"'
        state: 'w.delivered == ["Alarmas: 3"]'
        msg: 'Esta noche sonaron tres alarmas: el informe debe ser "Alarmas: 3".'
tests:
  - name: todas las puertas quedan cerradas
    state: w.open_doors == 0
    msg: Quedó al menos una puerta abierta.
  - name: la sirena suena solo donde hubo movimiento
    state: w.alarms == w.motion_doors
    msg: La sirena no coincide con las salas donde hubo movimiento.
  - name: Quilla no choca
    state: not w.crashed
  - name: Quilla termina en la caseta
    state: w.at_goal
    msg: Quilla no llegó a la caseta del vigilante (D).
  - name: decide con if
    source: '\bif\b'
    msg: Esta misión se resuelve decidiendo con if.
  - name: el informe se arma en una línea con if y else
    source: '^informe\s*=.+\bif\b.+\belse\b'
    msg: 'Escribe informe = "Sin novedad" if … else f"Alarmas: {alarmas}" en una sola línea.'
```

## Reto experto

```exercise
id: py2-reto-mediana
type: challenge
title: El termómetro que miente
visual:
  figure:
    title: Tres termómetros, uno malogrado
    input: { label: "a, b, c", cells: [21, 35, 22], index: false }
    arrow: el del medio
    output: { label: Salida, text: "Temperatura de la sala: 22" }
    steps:
      - "Ordenados serían 21, 22, 35: el del medio es 22."
      - "El de 35 se volvió loco, y la mediana no le hace caso."
prompt: |
  **Imprime la mediana de tres lecturas, `Temperatura de la sala: N`, sin ordenar.** Para quien ya programa. La sala de oro tiene tres termómetros, `a`, `b` y `c`, y a veces uno se malogra y marca cualquier cosa. Maru decidió creerle siempre al **del medio**: el que no es ni el mayor ni el menor (si hay empates, cualquiera de los repetidos sirve).

  Resuélvelo solo con comparaciones: **sin `sorted`, `sort`, `min` ni `max`**. Las comparaciones encadenadas te ahorran la mitad del trabajo.
starter: |
  # a, b y c ya existen
  print(a, b, c)
solution: |
  if a <= b <= c or c <= b <= a:
      mediana = b
  elif b <= a <= c or c <= a <= b:
      mediana = a
  else:
      mediana = c
  print(f"Temperatura de la sala: {mediana}")
hints:
  - "`b` es la mediana si está entre los otros dos, en cualquiera de los dos sentidos: `a <= b <= c or c <= b <= a`."
  - Si no es `b`, prueba lo mismo con `a`; si tampoco, solo queda `c`.
globals:
  a: 21
  b: 35
  c: 22
scenarios:
  - tests:
      - name: 21, 35, 22
        output: "Temperatura de la sala: 22"
  - globals: { a: 23, b: 20, c: 18 }
    tests:
      - name: 23, 20, 18 (de mayor a menor)
        output: "Temperatura de la sala: 20"
  - globals: { a: 18, b: 25, c: 21 }
    tests:
      - name: 18, 25, 21
        output: "Temperatura de la sala: 21"
  - globals: { a: 19, b: 19, c: 40 }
    tests:
      - name: 19, 19, 40 (un empate)
        output: "Temperatura de la sala: 19"
  - globals: { a: 30, b: 21, c: 24 }
    tests:
      - name: 30, 21, 24
        output: "Temperatura de la sala: 24"
  - globals: { a: 22, b: 22, c: 22 }
    tests:
      - name: los tres iguales
        output: "Temperatura de la sala: 22"
  - globals: { a: -5, b: 20, c: 21 }
    tests:
      - name: -5, 20, 21 (uno congelado)
        output: "Temperatura de la sala: 20"
tests:
  - name: sin ordenar
    sourceNot: '\b(sorted|sort|min|max)\b'
    msg: Resuélvelo con comparaciones, sin sorted, sort, min ni max.
```
