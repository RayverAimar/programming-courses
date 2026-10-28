# Sesión 17 — Tipos, enums y match

## El encargo

Nazca, siete de la mañana. En el aeródromo María Reiche, las avionetas calientan motores para llevar turistas sobre el Colibrí, el Mono y la Ballena, figuras de trescientos metros que solo se entienden desde el aire. La torre de control es una caseta de dos pisos con una radio, un ventilador y **Eusebio Ccahuana**, el controlador, que lleva treinta años diciendo "OB-1622, mantenga trescientos" sin perder la paciencia.

Ahora a la torre le llegan mensajes de todo tipo: posiciones con altura, avisos de radio, pedidos de pista, drones de los turistas que no deberían estar ahí. Maru le prestó a Quilla, con su sirena, para que los clasifique y, de noche, haga la ronda del museo de la casa de María Reiche. Hoy Quilla aprende a **decir qué forma tienen sus datos** (tipos), a nombrar estados fijos (`Enum`) y a **reconocer la forma de un mensaje** con `match`.

```escena
theme: museo
level: 2
dir: E
caption: La ronda de noche en el museo María Reiche. Quilla recibe las órdenes como texto y `match` decide qué hacer con cada una.
map: |
  ###########
  #R........#
  ####P##O###
  ####m##.###
  ###########
program: |
  for orden in ["avanzar 3", "revisar", "avanzar 3", "revisar"]:
      match orden.split():
          case ["avanzar", pasos]:
              robot.avanzar(int(pasos))
          case ["revisar"]:
              lectura = robot.sensor()
              if lectura["puerta"] == "abierta":
                  robot.cerrar_puerta()
              if lectura["movimiento"]:
                  robot.alarma()
```

## Lo mínimo

Una **anotación de tipo** dice qué espera una función y qué devuelve: `alturas: list[int]` es "una lista de enteros" y `-> float` es "devuelve un decimal". Los tipos de siempre aceptan corchetes: `list[int]`, `dict[str, float]`, `tuple[int, int]`, `set[str]`.

```py run
def promedio(alturas: list[int]) -> float:
    return sum(alturas) / len(alturas)

minimos: dict[str, float] = {"Colibrí": 300.0, "Mono": 350.0}
print(promedio([300, 450, 600]), minimos["Mono"])
```

- **`X | None`** es "un `X` o nada": `def buscar(matricula: str) -> int | None:` puede devolver `None`. `int | str` es "uno u otro".
- **`Callable[[int], int]`** (de `collections.abc`) es "una función que recibe un `int` y devuelve un `int`".
- **Python no revisa las anotaciones al ejecutar.** Son documentación que leen las personas, el editor y herramientas como `mypy`; `promedio((1, 2))` funciona aunque diga `list[int]`.

```py run
from collections.abc import Callable

def corregir(alturas: list[int], regla: Callable[[int], int]) -> list[int]:
    return [regla(altura) for altura in alturas]

print(corregir([250, 400], lambda altura: max(altura, 300)), corregir("ab", str.upper))
```

Para diccionarios con claves fijas está **`TypedDict`**, y para decir "cualquier cosa que tenga este método" está **`Protocol`** (el *duck typing* de la sesión 13, con nombre). Los dos son solo tipos: en tiempo de ejecución un `TypedDict` es un `dict` común.

```py run
from typing import TypedDict

class Vuelo(TypedDict):
    matricula: str
    minutos: int

vuelo: Vuelo = {"matricula": "OB-1714", "minutos": 35}
print(vuelo["minutos"], type(vuelo).__name__)
```

```py
class ConReporte(Protocol):
    def reporte(self) -> str: ...

def avisar(cosa: ConReporte) -> str:   # vale cualquier objeto con reporte()
    return "Torre: " + cosa.reporte()
```

Una función **genérica** declara su parámetro de tipo entre corchetes, `def f[T](…)`: `T` es "el mismo tipo, sea cual sea". `primero` devuelve un `str` si le das textos y un `int` si le das números.

```py run
def primero[T](elementos: list[T], si_no_hay: T) -> T:
    return elementos[0] if elementos else si_no_hay

print(primero(["Colibrí", "Mono"], "ninguna"), primero([], 0))
```

Un **`Enum`** reúne un conjunto fijo de valores con nombre. `Pista.CERRADA` no se puede escribir mal sin que Python avise, cosa que un texto `"cerada"` sí permite.

```py run
from enum import Enum

class Pista(Enum):
    LIBRE = "libre"
    CERRADA = "cerrada"

estado = Pista("cerrada")
print(estado.name, estado.value, estado is Pista.CERRADA, [p.name for p in Pista])
```

Y ahora la estrella: **`match`** compara un valor con varios **patrones**, de arriba abajo, y ejecuta el **primer** `case` que encaja. Un patrón no solo compara: también **saca las partes** a variables. Mira cómo la torre lee tres mensajes:

```anima
title: El primer case que encaja gana
code: |
  def atender(mensaje):
      match mensaje.split():
          case ["pista"]:
              return "pista libre"
          case ["subir", metros] if metros.isdigit():
              return f"suba {metros} m"
          case ["aterrizar" | "bajar", *resto]:
              return f"autorizado {len(resto)}"
          case _:
              return "repita"

  for mensaje in ["subir 200", "bajar ya", "subir mucho"]:
      print(atender(mensaje))
notes:
  2: "mensaje.split() da una lista de palabras; match prueba los case en orden."
  5: "Encaja si es una lista de dos y la primera es \"subir\". metros atrapa la segunda, y el if (la guarda) pide que sea un número."
  7: "\"aterrizar\" | \"bajar\" acepta cualquiera de los dos; *resto atrapa las palabras que sobran."
  9: "_ encaja con todo: es el caso por defecto."
```

Los patrones que vas a usar:

| patrón | encaja con |
|---|---|
| `"pista"`, `300`, `None` | ese valor exacto (literal) |
| `Pista.CERRADA` | esa constante: un nombre **con punto** se compara |
| `["subir", metros]`, `[primero, *resto]` | una lista o tupla de esa forma; los nombres sueltos atrapan |
| `{"tipo": "radio", "texto": texto}` | un diccionario con esas claves (puede tener más) |
| `Avioneta(matricula=m, altura=a)`, `int(n)`, `str()` | un objeto de esa clase; saca sus atributos |
| `patron if condicion` | el patrón, y además la guarda |
| `"v" \| "V"`, `(">" \| "<") as lado` | cualquiera de varios; `as` guarda cuál fue |
| `_` | cualquier cosa, sin guardarla |

```py run
from dataclasses import dataclass

@dataclass
class Avioneta:
    matricula: str
    altura: int

def revisar(dato):
    match dato:
        case {"tipo": "radio", "texto": str(texto)}:
            return f"radio: {texto}"
        case Avioneta(matricula=matricula, altura=altura) if altura < 300:
            return f"{matricula} vuela bajo"
        case Avioneta(matricula=matricula):
            return f"{matricula} ok"
        case _:
            return "?"

print(revisar({"tipo": "radio", "texto": "sin novedad", "hora": 9}))
print(revisar(Avioneta("OB-1501", 250)), revisar(Avioneta("OB-1622", 500)))
```

Fíjate en el orden: el `case` con guarda (`altura < 300`) va **antes** que el general. Al revés, el general atraparía todas las avionetas y el específico no se ejecutaría nunca.

> **Trampa común:** un nombre suelto en un patrón **no compara, atrapa**. `case ["aterrizar", CERRADA]:` no pregunta si el segundo elemento vale `CERRADA`: crea una variable `CERRADA` con lo que venga, y encaja siempre. (Un `case CERRADA:` solo, antes de otros, ya es un `SyntaxError`: *name capture makes remaining patterns unreachable*.) Para comparar con una constante, ponla con punto (`Pista.CERRADA`) o escribe el literal.

<!-- legacy: builtin-generics -->

<!-- legacy: union-pipe -->

<!-- legacy: type-params -->

<!-- legacy: match -->

<!-- mdn: builtin-generics union-pipe type-params enum match -->

## Práctica

```exercise
id: py17-predice-anotaciones
type: predict
title: La anotación que nadie revisa
prompt: |
  Eusebio anotó los tipos de `subir` con cuidado. Después alguien la llamó con otras cosas. ¿Qué imprime?
code: |
  def subir(altura: int, metros: int) -> int:
      return altura + metros

  print(subir(300, 150))
  print(subir("300", "150"))
  print(subir([3], [1]))
options:
  - "450\n300150\n[3, 1]"
  - "450\n450\n[4]"
  - "450\nTypeError: se esperaba int"
  - "450\n300150\n[4]"
answer: "450\n300150\n[3, 1]"
explain: |
  Las anotaciones no se revisan al ejecutar: Python solo hace `altura + metros` con lo que le llegue. Dos textos se pegan y dos listas se juntan. Un editor o `mypy` sí te habrían marcado esas dos llamadas antes de ejecutar.
```

```exercise
id: py17-predice-orden
type: predict
title: Cinco llamadas a la torre
prompt: |
  ¿Qué responde la torre a cada mensaje? Recuerda: gana el **primer** `case` que encaja.
code: |
  def leer(mensaje):
      match mensaje.split():
          case ["torre"]:
              return "escucho"
          case ["torre", *resto] if len(resto) > 2:
              return "hable más corto"
          case ["torre", palabra] | [palabra, "torre"]:
              return f"recibido {palabra}"
          case [_, *_]:
              return "¿quién llama?"
          case _:
              return "silencio"

  for mensaje in ["torre", "aterrizo torre", "torre pista dos libre", "hola", ""]:
      print(leer(mensaje))
options:
  - "escucho\nrecibido aterrizo\nhable más corto\n¿quién llama?\nsilencio"
  - "escucho\nrecibido aterrizo\nrecibido pista\n¿quién llama?\nsilencio"
  - "escucho\n¿quién llama?\nhable más corto\n¿quién llama?\n¿quién llama?"
  - "escucho\nrecibido torre\nhable más corto\n¿quién llama?\nsilencio"
answer: "escucho\nrecibido aterrizo\nhable más corto\n¿quién llama?\nsilencio"
explain: |
  `"aterrizo torre"` encaja con la segunda mitad del `|`, y `palabra` atrapa `"aterrizo"`. `"torre pista dos libre"` tiene tres palabras después de `torre`, así que la guarda `len(resto) > 2` se cumple. `[_, *_]` pide **al menos un** elemento: la lista vacía de `""` no encaja y cae en `_`.
```

```exercise
id: py17-completa-pista
type: complete
title: El estado de la pista
prompt: |
  Por radio, la pista llega como texto (`"ocupada"`). Completa los `___` para convertirlo en un `Pista`, responder con `match` según el estado y listar los valores posibles.
visual:
  figure:
    input: { label: reporte, value: "\"ocupada\"" }
    arrow: "Pista(reporte) y match"
    output: { label: imprime, text: "OCUPADA espere en circuito\n['libre', 'ocupada', 'cerrada']" }
starter: |
  from enum import Enum

  class Pista(___):
      LIBRE = "libre"
      OCUPADA = "ocupada"
      CERRADA = "cerrada"

  def permiso(estado: Pista) -> str:
      match estado:
          case Pista.LIBRE:
              return "autorizado a aterrizar"
          case Pista.___:
              return "espere en circuito"
          case Pista.CERRADA:
              return "desvíe a Ica"
      return "repita"

  reporte = "ocupada"
  estado = ___(reporte)
  print(estado.name, permiso(estado))
  print([p.___ for p in Pista])
solution: |
  from enum import Enum

  class Pista(Enum):
      LIBRE = "libre"
      OCUPADA = "ocupada"
      CERRADA = "cerrada"

  def permiso(estado: Pista) -> str:
      match estado:
          case Pista.LIBRE:
              return "autorizado a aterrizar"
          case Pista.OCUPADA:
              return "espere en circuito"
          case Pista.CERRADA:
              return "desvíe a Ica"
      return "repita"

  reporte = "ocupada"
  estado = Pista(reporte)
  print(estado.name, permiso(estado))
  print([p.value for p in Pista])
hints:
  - "Una enumeración hereda de `Enum`. Llamar a la clase con un valor, `Pista(\"ocupada\")`, devuelve el miembro que tiene ese valor."
  - "Cada miembro tiene `.name` (`\"OCUPADA\"`) y `.value` (`\"ocupada\"`)."
tests:
  - name: imprime el estado y la lista
    output: "OCUPADA espere en circuito\n['libre', 'ocupada', 'cerrada']"
  - name: estado es un miembro de Pista
    expect: estado is Pista.OCUPADA
  - name: la pista cerrada desvía a Ica
    expect: 'permiso(Pista.CERRADA) == "desvíe a Ica"'
```

```exercise
id: py17-arregla-captura
type: fix
title: La pista que siempre estaba cerrada
prompt: |
  La torre desvía a Ica **todas** las avionetas, también cuando la pista está libre. El problema está en un `case`. Arréglalo para que imprima `autorizado` y después `desvíe a Ica`.
visual:
  figure:
    panes:
      - { label: "pedido", cards: [{ title: "[\"aterrizar\", Pista.LIBRE]", rows: [["se esperaba", "\"autorizado\""], ["sale", "\"desvíe a Ica\""]] }] }
starter: |
  from enum import Enum

  class Pista(Enum):
      LIBRE = "libre"
      CERRADA = "cerrada"

  CERRADA = Pista.CERRADA

  def responder(pedido):
      match pedido:
          case ["aterrizar", CERRADA]:
              return "desvíe a Ica"
          case ["aterrizar", Pista.LIBRE]:
              return "autorizado"
          case _:
              return "repita"

  print(responder(["aterrizar", Pista.LIBRE]))
  print(responder(["aterrizar", Pista.CERRADA]))
solution: |
  from enum import Enum

  class Pista(Enum):
      LIBRE = "libre"
      CERRADA = "cerrada"

  CERRADA = Pista.CERRADA

  def responder(pedido):
      match pedido:
          case ["aterrizar", Pista.CERRADA]:
              return "desvíe a Ica"
          case ["aterrizar", Pista.LIBRE]:
              return "autorizado"
          case _:
              return "repita"

  print(responder(["aterrizar", Pista.LIBRE]))
  print(responder(["aterrizar", Pista.CERRADA]))
hints:
  - "En `case [\"aterrizar\", CERRADA]`, `CERRADA` es un nombre suelto: no compara, atrapa lo que venga en la segunda posición."
  - "Un nombre con punto sí se compara: `Pista.CERRADA`."
tests:
  - name: autoriza con pista libre y desvía con pista cerrada
    output: "autorizado\ndesvíe a Ica"
  - name: un texto no es un estado de pista
    expect: 'responder(["aterrizar", "libre"]) == "repita"'
    msg: El texto "libre" no es Pista.LIBRE; debe caer en "repita".
  - name: compara con la constante con punto
    source: 'case\s*\[\s*"aterrizar"\s*,\s*Pista\.CERRADA\s*\]'
```

```exercise
id: py17-escribe-agrupar
type: write
title: Agrupar con cualquier criterio
prompt: |
  Escribe la función genérica `agrupar[T, K](elementos: list[T], clave: Callable[[T], K]) -> dict[K, list[T]]`, que junta los elementos según lo que devuelve `clave` para cada uno, en el orden en que aparecen.

  Eusebio la quiere para todo: los vuelos por avioneta, las alturas en "bajas" y "altas", las figuras por su inicial. `clave` es una función: `agrupar(figuras, len)` agrupa por largo.
visual:
  figure:
    input: { label: "agrupar([250, 450, 280, 600], lambda altura: altura >= 300)", cells: [250, 450, 280, 600] }
    arrow: "clave(elemento) decide el grupo"
    output: { label: devuelve, cards: [{ title: dict, rows: [["False", "[250, 280]"], ["True", "[450, 600]"]] }] }
starter: |
  from collections.abc import Callable

  def agrupar(elementos, clave):
      return {}

  print(agrupar([250, 450, 280, 600], lambda altura: altura >= 300))
solution: |
  from collections.abc import Callable

  def agrupar[T, K](elementos: list[T], clave: Callable[[T], K]) -> dict[K, list[T]]:
      grupos: dict[K, list[T]] = {}
      for elemento in elementos:
          grupos.setdefault(clave(elemento), []).append(elemento)
      return grupos

  print(agrupar([250, 450, 280, 600], lambda altura: altura >= 300))
hints:
  - "La firma completa: `def agrupar[T, K](elementos: list[T], clave: Callable[[T], K]) -> dict[K, list[T]]:`."
  - "Dentro, lo de la sesión 6: `grupos.setdefault(clave(elemento), []).append(elemento)`."
tests:
  - name: el ejemplo del dibujo
    expect: 'agrupar([250, 450, 280, 600], lambda altura: altura >= 300) == {False: [250, 280], True: [450, 600]}'
  - name: figuras por su inicial
    expect: 'agrupar(["Mono", "Colibrí", "Manos", "Cóndor"], lambda figura: figura[0]) == {"M": ["Mono", "Manos"], "C": ["Colibrí", "Cóndor"]}'
  - name: con len como clave
    expect: 'agrupar(["Mono", "Árbol", "Loro"], len) == {4: ["Mono", "Loro"], 5: ["Árbol"]}'
  - name: sin elementos
    expect: agrupar([], len) == {}
  - name: declara los parámetros de tipo
    source: 'def\s+agrupar\s*\[\s*T\s*,\s*K\s*\]'
  - name: anota la clave con Callable
    source: 'clave\s*:\s*Callable\['
```

```exercise
id: py17-escribe-aeronaves
type: write
title: Lo que hay en el cielo
prompt: |
  Escribe `instruccion(aeronave) -> str`, que usa `match` con **patrones de clase** para decirle a cada aeronave qué hacer.

  | aeronave | instrucción |
  |---|---|
  | `Avioneta` a menos de 300 m | `"OB-1501: suba ya"` (su matrícula) |
  | cualquier otra `Avioneta` | `"OB-1501: siga"` |
  | `Dron` a más de 120 m | `"dron de Yolanda: baje a 120"` (su operador) |
  | cualquier otro `Dron` | `"dron de Yolanda: ok"` |
  | cualquier otra cosa | `"no identificado"` |
visual:
  figure:
    input: { label: aeronaves, cards: [{ title: "Avioneta", rows: [["matricula", "\"OB-1501\""], ["altura", "250"]] }, { title: "Dron", rows: [["operador", "\"Yolanda\""], ["altura", "150"]] }] }
    arrow: "match con Avioneta(…) if … y Dron(…)"
    output: { label: devuelve, text: "OB-1501: suba ya\ndron de Yolanda: baje a 120" }
starter: |
  from dataclasses import dataclass

  @dataclass
  class Avioneta:
      matricula: str
      altura: int

  @dataclass
  class Dron:
      operador: str
      altura: int

  def instruccion(aeronave: Avioneta | Dron) -> str:
      return "no identificado"

  print(instruccion(Avioneta("OB-1501", 250)))
  print(instruccion(Dron("Yolanda", 150)))
solution: |
  from dataclasses import dataclass

  @dataclass
  class Avioneta:
      matricula: str
      altura: int

  @dataclass
  class Dron:
      operador: str
      altura: int

  def instruccion(aeronave: Avioneta | Dron) -> str:
      match aeronave:
          case Avioneta(matricula=matricula, altura=altura) if altura < 300:
              return f"{matricula}: suba ya"
          case Avioneta(matricula=matricula):
              return f"{matricula}: siga"
          case Dron(operador=operador, altura=altura) if altura > 120:
              return f"dron de {operador}: baje a 120"
          case Dron(operador=operador):
              return f"dron de {operador}: ok"
          case _:
              return "no identificado"

  print(instruccion(Avioneta("OB-1501", 250)))
  print(instruccion(Dron("Yolanda", 150)))
hints:
  - "`case Avioneta(matricula=matricula, altura=altura) if altura < 300:` encaja con una avioneta baja y saca sus dos atributos."
  - "Los casos con guarda van antes que los generales de la misma clase."
tests:
  - name: una avioneta baja
    run: 'instruccion(Avioneta("OB-1501", 250))'
    equals: "OB-1501: suba ya"
  - name: una avioneta justo a 300
    run: 'instruccion(Avioneta("OB-1622", 300))'
    equals: "OB-1622: siga"
  - name: un dron alto
    run: 'instruccion(Dron("Yolanda", 150))'
    equals: "dron de Yolanda: baje a 120"
  - name: un dron justo a 120
    run: 'instruccion(Dron("Fermín", 120))'
    equals: "dron de Fermín: ok"
  - name: otra cosa
    run: 'instruccion("cóndor")'
    equals: no identificado
  - name: usa patrones de clase
    source: 'case\s+Avioneta\('
```

## El caso

```exercise
id: py17-caso-mensaje
type: case
title: El mensaje mal clasificado
prompt: |
  **Ordena bien los `case` de `clasificar` y cuenta cuántas `"alerta"` tuvo cada piloto. Compáralo con lo que anotó en su bitácora y encuentra la avioneta que voló bajo y lo ocultó.**

  Un guardián del Ministerio de Cultura vio una avioneta pasar casi rozando el Astronauta, y eso está prohibido: sobre las figuras se vuela a **300 m o más**, salvo los vuelos de fotografía con permiso. El informe de la torre dice "0 alertas" para todos. Eusebio sospecha del clasificador que escribió el practicante: tiene los casos en mal orden.

  Imprime una línea por piloto que empiece con su nombre, por ejemplo `print("Tito:", alertas)`, y el tablero te dirá si cuadra.
visual:
  board:
    for: py17-caso-mensaje
    task: "Una posición por debajo de 300 m sin permiso es una alerta. Cuenta las alertas de cada avioneta."
    cards:
      - name: Rocío
        kind: person
        role: Piloto de la OB-1501
        rows: [["Dijo", "\"bajé una vez sobre la Ballena, ya lo reporté\""], ["Bitácora", "1 alerta"]]
        clue: { find: "Rocío", says: 1, saysLabel: Anotó }
      - name: Tito
        kind: person
        role: Piloto de la OB-1622
        culprit: true
        rows: [["Dijo", "\"siempre arriba de 300, como manda la torre\""], ["Bitácora", "0 alertas"]]
        clue: { find: "Tito", says: 0, saysLabel: Anotó }
      - name: Gladys
        kind: person
        role: Piloto de la OB-1740
        rows: [["Dijo", "\"bajé sobre la Araña, pero con permiso de foto\""], ["Bitácora", "0 alertas"]]
        clue: { find: "Gladys", says: 0, saysLabel: Anotó }
      - name: El informe de la torre
        kind: note
        role: Lo que dio el clasificador
        rows: [["Alertas", "0"], ["Emergencias", "1"], ["Mensajes", "12"]]
starter: |
  from typing import TypedDict

  class Mensaje(TypedDict, total=False):
      tipo: str
      avion: str
      figura: str
      altura: int
      permiso: bool
      texto: str

  ALTURA_MINIMA = 300
  # mensajes: los 12 mensajes de la mañana (ya existe); cada uno tiene la forma de Mensaje
  # pilotos: {"OB-1501": "Rocío", ...}

  # El clasificador del practicante: los case están en mal orden
  def clasificar(mensaje: Mensaje) -> str:
      match mensaje:
          case {"tipo": "emergencia"}:
              return "emergencia"
          case {"tipo": "posicion"}:
              return "rutina"
          case {"tipo": "posicion", "permiso": True}:
              return "rutina"
          case {"tipo": "posicion", "altura": altura} if altura < ALTURA_MINIMA:
              return "alerta"
          case _:
              return "rutina"

  # TODO: ordena los case y cuenta las alertas de cada avión.
  # print("Tito:", alertas)
solution: |
  from typing import TypedDict

  class Mensaje(TypedDict, total=False):
      tipo: str
      avion: str
      figura: str
      altura: int
      permiso: bool
      texto: str

  ALTURA_MINIMA = 300

  def clasificar(mensaje: Mensaje) -> str:
      match mensaje:
          case {"tipo": "emergencia"}:
              return "emergencia"
          case {"tipo": "posicion", "permiso": True}:
              return "rutina"
          case {"tipo": "posicion", "altura": altura} if altura < ALTURA_MINIMA:
              return "alerta"
          case {"tipo": "posicion"}:
              return "rutina"
          case _:
              return "rutina"

  alertas = {avion: 0 for avion in pilotos}
  for mensaje in mensajes:
      if clasificar(mensaje) == "alerta":
          alertas[mensaje["avion"]] += 1

  for avion, piloto in pilotos.items():
      print(f"{piloto}: {avion} {alertas[avion]}")
globals:
  pilotos: { "OB-1501": Rocío, "OB-1622": Tito, "OB-1740": Gladys }
  mensajes:
    - {"tipo": "posicion", "avion": "OB-1501", "figura": "Colibrí", "altura": 450}
    - {"tipo": "posicion", "avion": "OB-1622", "figura": "Mono", "altura": 280}
    - {"tipo": "radio", "avion": "OB-1740", "texto": "pasajera mareada, todo bien"}
    - {"tipo": "posicion", "avion": "OB-1740", "figura": "Araña", "altura": 240, "permiso": true}
    - {"tipo": "posicion", "avion": "OB-1501", "figura": "Ballena", "altura": 290}
    - {"tipo": "emergencia", "avion": "OB-1622", "texto": "ave cerca de la hélice"}
    - {"tipo": "posicion", "avion": "OB-1622", "figura": "Colibrí", "altura": 310}
    - {"tipo": "posicion", "avion": "OB-1622", "figura": "Astronauta", "altura": 260}
    - {"tipo": "posicion", "avion": "OB-1740", "figura": "Perro", "altura": 520}
    - {"tipo": "posicion", "avion": "OB-1622", "figura": "Árbol", "altura": 300}
    - {"tipo": "radio", "avion": "OB-1501", "texto": "regreso a base"}
    - {"tipo": "posicion", "avion": "OB-1740", "figura": "Manos", "altura": 330, "permiso": false}
answer: OB-1622
answerLabel: ¿Qué avioneta voló bajo y lo ocultó? (matrícula)
reveal: |
  La OB-1622 de Tito: bajó a 280 m sobre el Mono y a 260 m sobre el Astronauta, y anotó cero. El clasificador del practicante tenía `case {"tipo": "posicion"}` en segundo lugar: un patrón de diccionario encaja aunque el mensaje tenga **más** claves, así que atrapaba todas las posiciones y los dos `case` de abajo nunca se ejecutaban. El orden correcto va de lo específico a lo general: primero el permiso (Gladys bajó a 240 m con permiso de foto), después la altura baja, al final cualquier posición. Si pones la alerta antes que el permiso, Gladys aparece con una alerta que no es tal.
hints:
  - "Un patrón de diccionario encaja aunque sobren claves: `{\"tipo\": \"posicion\"}` encaja con **todas** las posiciones. Ponlo después de los más específicos."
  - "Empieza con `alertas = {avion: 0 for avion in pilotos}` y suma 1 a `alertas[mensaje[\"avion\"]]` cuando `clasificar(mensaje) == \"alerta\"`."
```

## El juez

Los dos jueces son en modo función: el juez llama a tu función con cada caso y compara lo que devuelve.

```exercise
id: py17-juez-piloto
type: judge
mode: function
function: pilotear
title: El piloto automático de la torre
prompt: |
  **Escribe `pilotear(comandos: list[str]) -> list[str]`, que ejecuta los comandos de una avioneta de práctica, uno por uno, y devuelve qué respondió cada uno.**

  El simulador de la torre manda comandos cortos, como en un tablero. La avioneta empieza **en tierra** (altura 0) con **rumbo 0**. Separa cada comando con `split()` y usa `match`:

  | comando | hace | solo si |
  |---|---|---|
  | `"^"` | despega: altura 300 | está en tierra |
  | `"v"` | aterriza: altura 0 | está en el aire a 300 m o menos |
  | `"+ m"` | sube `m` metros | está en el aire, `m` son dígitos y no pasa de 3000 |
  | `"- m"` | baja `m` metros | `m` son dígitos y no baja de 100 |
  | `">"` / `"<"` | gira 90° a la derecha / izquierda (el rumbo va de 0 a 270) | siempre |

  Si el comando se puede, la respuesta es el estado nuevo, `f"{altura} {rumbo}"`. Si no (no se cumple la condición, o es cualquier otra cosa: `"x"`, `"+"`, `"+ alto"`, `"> 90"`, `""`), la respuesta es `"error"` y el estado no cambia.

  **Restricciones:** hasta 25 comandos.
visual:
  figure:
    title: El ejemplo 1, comando por comando
    panes:
      - { table: { head: ["comando", "altura", "rumbo", "responde"], rows: [["\"^\"", "300", "0", "\"300 0\""], ["\"+ 400\"", "700", "0", "\"700 0\""], ["\">\"", "700", "90", "\"700 90\""], ["\"- 650\"", "700 (bajaría a 50)", "90", "\"error\""], ["\"- 400\"", "300", "90", "\"300 90\""], ["\"v\"", "0", "90", "\"0 90\""], ["\"v\"", "0 (ya en tierra)", "90", "\"error\""]] } }
    caption: "Un comando que no se puede no cambia nada: la altura sigue en lo que estaba."
starter: |
  def pilotear(comandos: list[str]) -> list[str]:
      altura, rumbo = 0, 0
      resultados: list[str] = []
      return resultados
solution: |
  TECHO, PISO = 3000, 100

  def pilotear(comandos: list[str]) -> list[str]:
      altura, rumbo = 0, 0
      resultados: list[str] = []
      for comando in comandos:
          match comando.split():
              case ["^"] if altura == 0:
                  altura = 300
              case ["v"] if 0 < altura <= 300:
                  altura = 0
              case ["+", metros] if altura > 0 and metros.isdigit() and altura + int(metros) <= TECHO:
                  altura += int(metros)
              case ["-", metros] if metros.isdigit() and altura - int(metros) >= PISO:
                  altura -= int(metros)
              case [(">" | "<") as lado]:
                  rumbo = (rumbo + (90 if lado == ">" else 270)) % 360
              case _:
                  resultados.append("error")
                  continue
          resultados.append(f"{altura} {rumbo}")
      return resultados
hints:
  - "`match comando.split():` y un `case` por comando, con la condición como guarda: `case [\"+\", metros] if altura > 0 and metros.isdigit() and …:`. Si la guarda falla, `match` sigue probando, y al final `case _:` responde `\"error\"`."
  - "Para girar, `(rumbo + 90) % 360` a la derecha y `(rumbo + 270) % 360` a la izquierda. `case [(\">\" | \"<\") as lado]:` atrapa los dos."
samples:
  - args: [["^", "+ 400", ">", "- 650", "- 400", "v", "v"]]
    returns: ["300 0", "700 0", "700 90", "error", "300 90", "0 90", "error"]
    note: El dibujo de arriba.
  - args: [["v", "+ 200", "<", "^", "^", "+ 2800", "+ 2700", "> 90", "+ alto", "x"]]
    returns: ["error", "error", "0 270", "300 270", "error", "error", "3000 270", "error", "error", "error"]
    note: "En tierra no se aterriza ni se sube; 300 + 2800 pasaría el techo de 3000."
edge:
  - args: [[]]
    tag: sin comandos
  - args: [["", "+", "- 1 2", "^ 300"]]
    tag: con comandos vacíos o con palabras de más
  - args: [["^", "- 200", "- 201", "v"]]
    tag: bajando justo hasta 100
  - args: [["^", "+ 0", "- 0", "v"]]
    tag: con cero metros
  - args: [[">", ">", ">", ">", "<", "<"]]
    tag: dando la vuelta completa en tierra
  - args: [["^", "+ 100", "v", "- 100", "v"]]
    tag: aterrizando desde más de 300
  - args: [["^", "* 100", "= 200", "subir 100"]]
    tag: con órdenes que no existen
random:
  count: 40
  seed: 1717
  generate: |
    def comando():
        r = rng.int(0, 19)
        if r < 3:
            return "^"
        if r < 6:
            return "v"
        if r < 9:
            return rng.pick([">", "<"])
        if r < 13:
            return f"+ {rng.int(0, 30) * 50}"
        if r < 17:
            return f"- {rng.int(0, 12) * 50}"
        return rng.pick(["", "x", "+", "- 1 2", "+ alto", "> 90", "* 100", "^ 300", "v ya", "= 200", "- -50"])
    return [[comando() for _ in range(rng.int(0, 25))]]
wrong:
  - |
    SUBIR, BAJAR = "+", "-"

    def pilotear(comandos):
        altura, rumbo = 0, 0
        resultados = []
        for comando in comandos:
            match comando.split():
                case ["^"] if altura == 0:
                    altura = 300
                case ["v"] if 0 < altura <= 300:
                    altura = 0
                case [SUBIR, metros] if altura > 0 and metros.isdigit() and altura + int(metros) <= 3000:
                    altura += int(metros)
                case [BAJAR, metros] if metros.isdigit() and altura - int(metros) >= 100:
                    altura -= int(metros)
                case [(">" | "<") as lado]:
                    rumbo = (rumbo + (90 if lado == ">" else 270)) % 360
                case _:
                    resultados.append("error")
                    continue
            resultados.append(f"{altura} {rumbo}")
        return resultados
  - |
    def pilotear(comandos):
        altura, rumbo = 0, 0
        resultados = []
        for comando in comandos:
            match comando.split():
                case ["^"] if altura == 0:
                    altura = 300
                case ["v"] if altura > 0:
                    altura = 0
                case ["+", metros] if altura > 0 and metros.isdigit() and altura + int(metros) <= 3000:
                    altura += int(metros)
                case ["-", metros] if altura > 0 and metros.isdigit() and altura - int(metros) >= 100:
                    altura -= int(metros)
                case [(">" | "<") as lado]:
                    rumbo = (rumbo + (90 if lado == ">" else 270)) % 360
                case _:
                    resultados.append("error")
                    continue
            resultados.append(f"{altura} {rumbo}")
        return resultados
```

```exercise
id: py17-juez-forma
type: judge
mode: function
function: validar
title: El plan de vuelo con la forma correcta
prompt: |
  **Escribe `validar(valor, esquema) -> list[str]`, que compara un dato con un esquema y devuelve la ruta de cada parte que no tiene la forma pedida.**

  Los planes de vuelo llegan como JSON y algunos vienen mal armados: un número escrito como texto, una lista que falta. Eusebio describe la forma esperada con un **esquema**:

  - `"int"`, `"str"`, `"bool"`: un valor de ese tipo. Ojo: `True` **no** cuenta como `"int"`, aunque en Python `bool` sea un tipo de `int`.
  - `[sub]`: una lista cuyos elementos cumplen `sub` (puede estar vacía).
  - `{"clave": sub, …}`: un diccionario con esas claves, cada una con su forma. Las claves de más no importan. Una clave que termina en `?` (`"foto?"`) es **opcional**: puede faltar, pero si está, se valida con su nombre sin el `?`.

  Las rutas empiezan en `"$"`: `"$.tramos[1].alt"` es la clave `alt` del elemento 1 de la lista `tramos`. Una parte con el tipo equivocado o una clave obligatoria que falta da su ruta y no se mira por dentro. Devuelve las rutas en orden: las claves en el orden del esquema y los elementos de una lista en el suyo. Si todo está bien, `[]`.

  **Restricciones:** esquemas de hasta 3 niveles · listas de hasta 3 elementos.
visual:
  figure:
    title: El ejemplo 2, revisado contra el esquema
    panes:
      - { label: esquema, text: "{\"id\": \"str\", \"pax\": \"int\",\n \"tramos\": [{\"fig\": \"str\", \"alt\": \"int\", \"foto?\": \"bool\"}]}" }
      - { label: valor, text: "{\"id\": 1714, \"pax\": true,\n \"tramos\": [{\"fig\": \"Colibrí\"},\n            {\"fig\": \"Mono\", \"alt\": \"380\", \"foto\": \"sí\"}]}" }
      - { label: devuelve, cells: ["$.id", "$.pax", "$.tramos[0].alt", "$.tramos[1].alt", "$.tramos[1].foto"], index: false }
    caption: "`$.tramos[0].alt` falta; `$.tramos[1].alt` es texto; `foto` es opcional, pero vino y no es `bool`."
starter: |
  def validar(valor, esquema) -> list[str]:
      return []
solution: |
  def validar(valor, esquema, ruta: str = "$") -> list[str]:
      match esquema, valor:
          case "int", bool():
              return [ruta]
          case ("int", int()) | ("str", str()) | ("bool", bool()):
              return []
          case [sub], list():
              errores = []
              for i, elemento in enumerate(valor):
                  errores += validar(elemento, sub, f"{ruta}[{i}]")
              return errores
          case dict(), dict():
              errores = []
              for clave, sub in esquema.items():
                  nombre = clave.removesuffix("?")
                  if nombre in valor:
                      errores += validar(valor[nombre], sub, f"{ruta}.{nombre}")
                  elif not clave.endswith("?"):
                      errores.append(f"{ruta}.{nombre}")
              return errores
          case _:
              return [ruta]
hints:
  - "Haz `match esquema, valor:` (una tupla) y usa patrones de clase para el tipo: `case \"str\", str():`. Pon `case \"int\", bool():` **antes** que `case \"int\", int():`. Lo que no encaje con nada, `case _:`, es un error en `ruta`."
  - "Agrega un parámetro `ruta=\"$\"` y llama a `validar` otra vez para cada elemento (`f\"{ruta}[{i}]\"`) y cada clave (`f\"{ruta}.{nombre}\"`), sumando las listas de errores."
samples:
  - args: [{ "id": "OB-1714", "pax": 4, "tramos": [{ "fig": "Colibrí", "alt": 450 }, { "fig": "Mono", "alt": 380, "foto": true }] }, { "id": "str", "pax": "int", "tramos": [{ "fig": "str", "alt": "int", "foto?": "bool" }] }]
    returns: []
    note: Todo en orden; el primer tramo no trae foto y no pasa nada, porque es opcional.
  - args: [{ "id": 1714, "pax": true, "tramos": [{ "fig": "Colibrí" }, { "fig": "Mono", "alt": "380", "foto": "sí" }] }, { "id": "str", "pax": "int", "tramos": [{ "fig": "str", "alt": "int", "foto?": "bool" }] }]
    returns: ["$.id", "$.pax", "$.tramos[0].alt", "$.tramos[1].alt", "$.tramos[1].foto"]
    note: El dibujo de arriba.
edge:
  - args: [[], { "id": "str" }]
    tag: cuando el plan entero no es un diccionario
  - args: [true, "int"]
    tag: con un booleano donde va un entero
  - args: [false, "bool"]
    tag: con un booleano donde va un booleano
  - args: [7, "bool"]
    tag: con un entero donde va un booleano
  - args: [[], ["int"]]
    tag: con una lista vacía
  - args: ["123", ["str"]]
    tag: con un texto donde va una lista
  - args: [{}, { "a?": "int", "b?": ["str"] }]
    tag: con todas las claves opcionales ausentes
  - args: [{ "a": [[1, "2"], [], [3, true]] }, { "a": [["int"]] }]
    tag: con listas dentro de listas
  - args: [{ "id": "OB-1", "extra": 5 }, { "id": "str" }]
    tag: con una clave de más
random:
  count: 45
  seed: 1718
  generate: |
    def esquema_al_azar(nivel):
        r = rng.int(0, 9)
        if nivel >= 2 or r < 4:
            return rng.pick(["int", "str", "bool"])
        if r < 6:
            return [esquema_al_azar(nivel + 1)]
        claves = rng.shuffle(["id", "alt", "pax", "fig", "lat", "ok"])[:rng.int(1, 4)]
        return {clave + ("?" if rng.int(0, 2) == 0 else ""): esquema_al_azar(nivel + 1) for clave in claves}

    def valor_para(esquema):
        if rng.int(0, 6) == 0:
            return rng.pick([0, 7, -3, "OB-1714", "", True, False, [], {}, [1, 2], {"id": 1}])
        if esquema == "int":
            return rng.int(-5, 3000)
        if esquema == "str":
            return rng.pick(["Colibrí", "Mono", "OB-1622", "", "300"])
        if esquema == "bool":
            return rng.pick([True, False])
        if isinstance(esquema, list):
            return [valor_para(esquema[0]) for _ in range(rng.int(0, 3))]
        valor = {}
        for clave, sub in esquema.items():
            if rng.int(0, 4) > 0:
                valor[clave.removesuffix("?")] = valor_para(sub)
        if rng.int(0, 3) == 0:
            valor["nota"] = "extra"
        return valor

    esquema = esquema_al_azar(0)
    return [valor_para(esquema), esquema]
wrong:
  - |
    def validar(valor, esquema, ruta="$"):
        match esquema, valor:
            case ("int", int()) | ("str", str()) | ("bool", bool()):
                return []
            case [sub], list():
                errores = []
                for i, elemento in enumerate(valor):
                    errores += validar(elemento, sub, f"{ruta}[{i}]")
                return errores
            case dict(), dict():
                errores = []
                for clave, sub in esquema.items():
                    nombre = clave.removesuffix("?")
                    if nombre in valor:
                        errores += validar(valor[nombre], sub, f"{ruta}.{nombre}")
                    elif not clave.endswith("?"):
                        errores.append(f"{ruta}.{nombre}")
                return errores
            case _:
                return [ruta]
  - |
    def validar(valor, esquema, ruta="$"):
        match esquema, valor:
            case "int", bool():
                return [ruta]
            case ("int", int()) | ("str", str()) | ("bool", bool()):
                return []
            case [sub], list():
                errores = []
                for i, elemento in enumerate(valor):
                    errores += validar(elemento, sub, f"{ruta}[{i}]")
                return errores
            case dict(), dict():
                errores = []
                for clave, sub in esquema.items():
                    if clave.endswith("?"):
                        continue
                    if clave in valor:
                        errores += validar(valor[clave], sub, f"{ruta}.{clave}")
                    else:
                        errores.append(f"{ruta}.{clave}")
                return errores
            case _:
                return [ruta]
tests:
  - name: usa match
    source: '\bmatch\b'
```

## Misión final

```exercise
id: py17-mision-ronda
type: mission
title: La ronda dictada por radio
prompt: |
  **Recorre la lista `ordenes` y ejecuta cada una con `match`. Las que no entiendas, no las ejecutes: guárdalas, tal cual, en la lista `ignoradas`.**

  De noche, Eusebio dicta la ronda del museo por radio y Quilla la recibe como texto. Separa cada orden con `split()`:

  | orden | Quilla hace |
  |---|---|
  | `"avanzar 3"` | `robot.avanzar(3)`, solo si el número son dígitos |
  | `"girar izquierda"` o `"girar izq"` | `robot.girar_izquierda()` |
  | `"girar derecha"` o `"girar der"` | `robot.girar_derecha()` |
  | `"revisar"` | lee `robot.sensor()` de la puerta de abajo: si está `"abierta"`, `robot.cerrar_puerta()`; si hay `"movimiento"`, `robot.alarma()` |
  | `"decir ronda terminada"` | `robot.decir("ronda terminada")`: todas las palabras después de `decir`, al menos una |

  Por la radio se cuela de todo (`"girar"`, `"avanzar -2"`, `"café con leche"`): eso va a `ignoradas`. Las órdenes y el museo cambian en cada prueba.
visual:
  figure:
    title: Las órdenes de la primera noche
    panes:
      - { label: ordenes, cells: ["avanzar 2", "revisar", "avanzar 5", "revisar", "girar", "avanzar 2", "girar derecha", "avanzar 3", "avanzar -2", "girar der", "…"] }
      - { label: ignoradas, cells: ["girar", "avanzar -2"] }
starter: |
  # ordenes: ["avanzar 2", "revisar", ...]   lo que dictó Eusebio
  ignoradas: list[str] = []

  for orden in ordenes:
      # TODO: match orden.split():
      pass
solution: |
  ignoradas: list[str] = []

  for orden in ordenes:
      match orden.split():
          case ["avanzar", pasos] if pasos.isdigit():
              robot.avanzar(int(pasos))
          case ["girar", "izquierda" | "izq"]:
              robot.girar_izquierda()
          case ["girar", "derecha" | "der"]:
              robot.girar_derecha()
          case ["revisar"]:
              lectura = robot.sensor()
              if lectura["puerta"] == "abierta":
                  robot.cerrar_puerta()
              if lectura["movimiento"]:
                  robot.alarma()
          case ["decir", *palabras] if palabras:
              robot.decir(" ".join(palabras))
          case _:
              ignoradas.append(orden)
hints:
  - "`case [\"avanzar\", pasos] if pasos.isdigit():` y `case [\"girar\", \"izquierda\" | \"izq\"]:`. Lo que no encaje con ninguno cae en `case _:`, que lo agrega a `ignoradas`."
  - "Para `decir`, `case [\"decir\", *palabras] if palabras:` atrapa todas las palabras que siguen; `\" \".join(palabras)` las vuelve a juntar."
globals:
  ordenes: ["avanzar 2", "revisar", "avanzar 5", "revisar", "girar", "avanzar 2", "girar derecha", "avanzar 3", "avanzar -2", "girar der", "avanzar 2", "revisar", "avanzar 2", "revisar", "decir ronda terminada"]
world:
  theme: museo
  level: 2
  dir: E
  map: |
    ############
    #R.........#
    ###P####O#.#
    ###m####.#.#
    ######.....#
    ######O#P###
    ######.#m###
    ############
scenarios:
  - tests:
      - name: ignora lo que no entiende
        expect: 'ignoradas == ["girar", "avanzar -2"]'
      - name: avisa que terminó
        state: 'w.said == ["ronda terminada"]'
  - globals:
      ordenes: ["avanzar 1", "revisar", "girar atrás", "avanzar 3", "revisar", "avanzar tres", "avanzar 3", "revisar", "decir todo en orden"]
    world: { dir: W }
    map: |
      ###########
      #........R#
      ##P##O##P##
      ##m##.##.##
      ###########
    tests:
      - name: ignora lo que no entiende
        expect: 'ignoradas == ["girar atrás", "avanzar tres"]'
      - name: avisa que terminó
        state: 'w.said == ["todo en orden"]'
  - globals:
      ordenes: ["avanzar 2", "girar izq", "avanzar 2", "revisar", "café con leche", "avanzar 2", "revisar", "avanzar 2", "revisar", "decir", "decir fin de la ronda"]
    world: { dir: S }
    map: |
      #########
      #R#######
      #.#######
      #.......#
      ###P#O#P#
      ###m#.#m#
      #########
    tests:
      - name: ignora lo que no entiende
        expect: 'ignoradas == ["café con leche", "decir"]'
      - name: avisa que terminó
        state: 'w.said == ["fin de la ronda"]'
tests:
  - name: todas las puertas quedan cerradas
    state: w.open_doors == 0
    msg: Quedó una puerta abierta. ¿"revisar" cierra la puerta cuando está abierta?
  - name: la alarma suena donde hay movimiento
    state: w.alarms == w.motion_doors
  - name: lee las órdenes con match
    source: 'match\s+orden\.split\(\)'
  - name: usa | para las dos formas de girar
    source: '"izquierda"\s*\|\s*"izq"|"izq"\s*\|\s*"izquierda"'
  - name: sin chocar
    state: not w.crashed
```

## Reto experto

```exercise
id: py17-reto-combustible
type: challenge
title: La fórmula del combustible
visual:
  figure:
    title: Una expresión es un árbol de tuplas
    input: { label: "expr", text: "(\"+\", (\"*\", \"minutos\", 2), 15)" }
    arrow: "con entorno = {\"minutos\": 40}"
    output: { label: devuelve, value: "95" }
prompt: |
  **Escribe `evaluar(expr: Expr, entorno: dict[str, int]) -> int`, que calcula una fórmula escrita como tuplas anidadas.** Para quien ya programa.

  Eusebio guarda las fórmulas de combustible como árboles, para poder cambiarlas sin tocar el programa. Declara el tipo con un alias recursivo, `type Expr = int | str | tuple[...]` (la sentencia `type`, prima de `def f[T]`), y resuélvelo con un solo `match`:

  - un `int` vale lo que es; un `str` es una variable y vale `entorno[nombre]`;
  - `("+", a, b)`, `("-", a, b)`, `("*", a, b)`: la operación con los dos lados evaluados;
  - `("-", a)`: menos `a`;
  - `("max", a, b, …)` y `("min", a, b, …)`: el mayor o el menor de uno o más argumentos;
  - cualquier otra forma lanza `ValueError`.
starter: |
  def evaluar(expr, entorno):
      return 0

  print(evaluar(("+", ("*", "minutos", 2), 15), {"minutos": 40}))
solution: |
  type Expr = int | str | tuple[str, *tuple[Expr, ...]]

  def evaluar(expr: Expr, entorno: dict[str, int]) -> int:
      match expr:
          case bool():
              raise ValueError(f"no es una expresión: {expr!r}")
          case int(numero):
              return numero
          case str(nombre):
              return entorno[nombre]
          case ("-", a):
              return -evaluar(a, entorno)
          case (("+" | "-" | "*") as operador, a, b):
              izquierda, derecha = evaluar(a, entorno), evaluar(b, entorno)
              match operador:
                  case "+":
                      return izquierda + derecha
                  case "-":
                      return izquierda - derecha
                  case _:
                      return izquierda * derecha
          case (("max" | "min") as operador, primero, *resto):
              valores = [evaluar(parte, entorno) for parte in (primero, *resto)]
              return max(valores) if operador == "max" else min(valores)
          case _:
              raise ValueError(f"no es una expresión: {expr!r}")

  print(evaluar(("+", ("*", "minutos", 2), 15), {"minutos": 40}))
hints:
  - "El orden importa: `(\"-\", a)` y `(\"-\", a, b)` son patrones distintos por su largo, y `case ((\"max\" | \"min\") as operador, primero, *resto):` pide al menos un argumento."
  - "Cada parte de una tupla es otra `Expr`: llama a `evaluar` sobre ella (recursión, sesión 15)."
tests:
  - name: la fórmula del dibujo
    run: 'evaluar(("+", ("*", "minutos", 2), 15), {"minutos": 40})'
    equals: 95
  - name: una variable sola
    run: 'evaluar("reserva", {"reserva": 20})'
    equals: 20
  - name: resta y menos
    run: 'evaluar(("-", ("-", 10), ("-", 3, 8)), {})'
    equals: -5
  - name: max con varios argumentos
    run: 'evaluar(("max", 30, ("*", "pax", 6), "minimo"), {"pax": 4, "minimo": 25})'
    equals: 30
  - name: min con uno solo
    run: 'evaluar(("min", 7), {})'
    equals: 7
  - name: declara el alias con type
    source: '^type\s+Expr\s*='
```
