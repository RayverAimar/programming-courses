# Sesión 13 — El modelo de datos

## El encargo

Jirón de la Unión, a media cuadra de la Plaza San Martín. Entre una zapatería y una tienda de uniformes escolares hay una galería angosta, y al fondo, **Numismática y Filatelia Valdivieso**: tres vitrinas de monedas peruanas, un mostrador de estampillas con lupa de bronce y, detrás de una reja, las bóvedas de la casona donde doña **Hortensia Valdivieso** guarda lo que no se vende ni a su sobrino.

Hortensia ya pasó su inventario a Python, con una clase `Moneda` y una clase `Estampilla`. El problema es que sus objetos no se portan como los de Python: `sorted` no sabe ordenarlos, dos monedas idénticas no son "iguales", un `set` no los acepta y `len` de un álbum da error. Maru le mandó a Quilla, que ya trae linterna para las bóvedas, con una tarea: enseñarles a esas clases a hablar el idioma de Python, el de `==`, `<`, `len`, `in`, `for`, `+` y `with`.

```escena
theme: barranco
level: 3
dir: E
caption: Quilla sale de la galería del Jirón de la Unión con un sol de 1863 en la caja y lo entrega en la vitrina de la esquina.
map: |
  ############
  #R.....#####
  ######.###D#
  ######.....#
  ############
program: |
  robot.avanzar(5)
  robot.girar_derecha()
  robot.avanzar(2)
  robot.girar_izquierda()
  robot.avanzar(4)
  robot.girar_izquierda()
  robot.avanzar(1)
  robot.entregar("Sol de 1863")
```

## Lo mínimo

Cuando escribes `a < b`, Python no sabe nada de monedas: llama a un método de `a` con un nombre especial, `a.__lt__(b)`. Esos métodos con dos guiones bajos a cada lado se llaman **métodos dunder** (*double underscore*), y son el **modelo de datos** de Python: si tu clase los define, tus objetos funcionan con los operadores y las funciones de siempre.

| escribes | Python llama |
|---|---|
| `a == b`, `a < b` | `a.__eq__(b)`, `a.__lt__(b)` |
| `hash(a)`, `a` en un `set` o como clave | `a.__hash__()` |
| `len(a)`, `a[i]` | `a.__len__()`, `a.__getitem__(i)` |
| `for x in a`, `x in a` | `a.__iter__()`, `a.__contains__(x)` |
| `a + b`, `if a:` | `a.__add__(b)`, `a.__bool__()` |

**Comparar.** Sin `__eq__`, `==` solo es `True` si los dos nombres apuntan **al mismo objeto**. Con `__eq__` decides tú qué significa "igual". Para ordenar basta `__lt__` (`sorted`, `min` y `max` solo usan `<`), y si además quieres `<=`, `>` y `>=`, el decorador `functools.total_ordering` los arma a partir de `__eq__` y `__lt__`.

```py run
from functools import total_ordering

@total_ordering
class Moneda:
    def __init__(self, nombre, anio):
        self.nombre, self.anio = nombre, anio
    def __eq__(self, otra):
        return self.anio == otra.anio
    def __lt__(self, otra):
        return self.anio < otra.anio

sol, dinero = Moneda("sol", 1914), Moneda("dinero", 1863)
print(dinero < sol, sol >= dinero, sol == Moneda("peseta", 1914))
```

Mira a `sorted` trabajando: cada vez que necesita comparar dos monedas, llama a `__lt__`, y la llamada aparece en la pila.

```anima
title: sorted le pregunta a __lt__
code: |
  class Moneda:
      def __init__(self, nombre, anio):
          self.nombre = nombre
          self.anio = anio
      def __repr__(self):
          return f"{self.nombre} {self.anio}"
      def __lt__(self, otra):
          return self.anio < otra.anio

  bandeja = [Moneda("sol", 1914), Moneda("dinero", 1863)]
  vitrina = sorted(bandeja)
  print(vitrina)
notes:
  10: "Dos monedas en el orden en que llegaron: la de 1914 primero."
  8: "sorted no sabe qué es una moneda: llama a __lt__ y usa el True o False que le devuelve."
  11: "La moneda de 1863 quedó adelante. sorted devolvió una lista nueva."
  6: "print usa __repr__ para mostrar cada moneda."
```

**Hashear.** Un `set` o un diccionario guardan cada objeto según su `hash`, y exigen que dos objetos iguales tengan el mismo hash. Por eso, **si defines `__eq__`, Python borra el `__hash__` heredado** y tus objetos ya no entran en un `set`: tienes que escribir `__hash__` con los mismos datos que usa `__eq__`.

```py run
class Sello:
    def __init__(self, motivo, anio):
        self.motivo, self.anio = motivo, anio
    def __eq__(self, otro):
        return (self.motivo, self.anio) == (otro.motivo, otro.anio)
    def __hash__(self):
        return hash((self.motivo, self.anio))

lote = {Sello("llama", 1866), Sello("llama", 1866), Sello("escudo", 1858)}
print(len(lote), Sello("llama", 1866) in lote)
```

**Ser una colección.** Con `__len__` funciona `len`; con `__getitem__`, los corchetes (con índices negativos y rebanadas, si se los pasas a una lista); con `__iter__`, el `for`; con `__contains__`, el `in`; con `__add__`, el `+`; y con `__bool__`, el `if`. Sin `__bool__`, Python mira `__len__`: una colección vacía es falsa.

```py run
class Album:
    def __init__(self, sellos):
        self.sellos = list(sellos)
    def __len__(self):
        return len(self.sellos)
    def __getitem__(self, i):
        return self.sellos[i]
    def __iter__(self):
        return iter(self.sellos)
    def __contains__(self, sello):
        return sello.lower() in [s.lower() for s in self.sellos]
    def __add__(self, otro):
        return Album(self.sellos + otro.sellos)
    def __bool__(self):
        return len(self.sellos) > 0

album = Album(["Llama 1866", "Escudo 1858"]) + Album(["Paita 1857"])
print(len(album), album[-1], "llama 1866" in album, bool(Album([])))
```

**Duck typing.** A Python no le importa de qué clase es un objeto, sino qué sabe hacer: "si camina como pato y hace cuac como pato, es un pato". `def contar(coleccion): return len(coleccion)` sirve igual para una lista, un texto o un `Album`, porque los tres tienen `__len__`. Nadie tuvo que heredar de nada.

**Abrir y cerrar.** El `with` que usas con `open` también es modelo de datos: `with algo as x:` llama a `algo.__enter__()` al entrar (lo que devuelve va a `x`) y a `algo.__exit__(tipo, error, traza)` al salir, **aunque el bloque termine con un error**. Así una vitrina nunca queda abierta. Escribirlo como clase es lo clásico; `contextlib.contextmanager` lo hace con una función: lo que va antes del `yield` abre, lo que sale del `yield` va al `as`, y lo que va en el `finally` cierra pase lo que pase.

```py run
from contextlib import contextmanager

@contextmanager
def vitrina(numero):
    print("abre la vitrina", numero)
    try:
        yield numero
    finally:
        print("cierra la vitrina", numero)

with vitrina(4) as n:
    print("saca la peseta de la vitrina", n)
```

**Escribir el pato.** `typing.Protocol` pone por escrito el *duck typing*: describe qué métodos debe tener algo, y cualquier clase que los tenga encaja, sin heredar. Python no lo revisa al ejecutar; lo usan el editor y los verificadores de tipos para avisarte antes.

```py run
from typing import Protocol

class Tasable(Protocol):
    def tasar(self) -> int: ...

class Billete:
    def tasar(self) -> int:
        return 80

def valor_lote(piezas: list[Tasable]) -> int:
    return sum(pieza.tasar() for pieza in piezas)

print(valor_lote([Billete(), Billete()]))
```

> **Trampa común:** agregaste `__eq__` a una clase que ya usabas en un `set` o como clave de un diccionario, y de pronto sale `TypeError: unhashable type`. No rompiste nada más: definir `__eq__` deja a la clase sin `__hash__`. Escribe `__hash__` con **los mismos campos** que compara `__eq__` (o usa `@dataclass(frozen=True)`, que hace las dos cosas).

<!-- legacy: total-ordering -->

<!-- legacy: contextmanager -->

<!-- legacy: protocol -->

<!-- mdn: total-ordering contextmanager protocol -->

## Práctica

```exercise
id: py13-predice-album
type: predict
title: El álbum sin __iter__
prompt: |
  Este `Album` solo tiene `__len__` y `__getitem__`: ni `__bool__`, ni `__contains__`, ni `__iter__`. ¿Qué imprime?
code: |
  class Album:
      def __init__(self, sellos):
          self.sellos = sellos

      def __len__(self):
          return len(self.sellos)

      def __getitem__(self, i):
          return self.sellos[i]

  vacio = Album([])
  lleno = Album(["Llama 1866", "Paita 1857", "Escudo 1858"])
  print(len(lleno), bool(vacio), lleno[-1])
  print("Paita 1857" in lleno)
  for sello in lleno[:2]:
      print(sello)
options:
  - "3 False Escudo 1858\nTrue\nLlama 1866\nPaita 1857"
  - "3 True Escudo 1858\nTrue\nLlama 1866\nPaita 1857"
  - "3 False Escudo 1858\nTypeError: argument of type 'Album' is not iterable"
  - "3 False Llama 1866\nTrue\nLlama 1866\nPaita 1857"
answer: "3 False Escudo 1858\nTrue\nLlama 1866\nPaita 1857"
explain: |
  Sin `__bool__`, `bool` usa `__len__`: el álbum vacío es `False`. `lleno[-1]` y `lleno[:2]` le pasan el `-1` y la rebanada a `__getitem__`, que se los pasa a la lista. Y sin `__iter__` ni `__contains__`, Python todavía puede recorrerlo: pide `lleno[0]`, `lleno[1]`… hasta que `__getitem__` lanza `IndexError`. Eso es *duck typing*: con poco, ya se porta como una secuencia.
```

```exercise
id: py13-completa-orden
type: complete
title: La vitrina por antigüedad
prompt: |
  Hortensia ordena sus monedas por año: la más antigua primero, y dos monedas del mismo año valen lo mismo en la vitrina. Completa los `___` para que `sorted`, `max` y también `>=` funcionen, escribiendo **solo** `__eq__` y `__lt__`.
visual:
  figure:
    input: { label: monedas, cells: ["sol (1914)", "dinero (1863)", "peseta (1880)"] }
    arrow: "sorted llama a __lt__"
    output: { label: sorted(monedas), cells: ["dinero (1863)", "peseta (1880)", "sol (1914)"] }
starter: |
  import functools


  @functools.___
  class Moneda:
      def __init__(self, nombre, anio):
          self.nombre = nombre
          self.anio = anio

      def __repr__(self):
          return f"{self.nombre} ({self.anio})"

      def ___(self, otra):
          return self.anio == otra.anio

      def ___(self, otra):
          return self.anio ___ otra.anio


  monedas = [Moneda("sol", 1914), Moneda("dinero", 1863), Moneda("peseta", 1880)]
  print(sorted(monedas))
  print(Moneda("sol", 1866) >= Moneda("medio sol", 1864))
solution: |
  import functools


  @functools.total_ordering
  class Moneda:
      def __init__(self, nombre, anio):
          self.nombre = nombre
          self.anio = anio

      def __repr__(self):
          return f"{self.nombre} ({self.anio})"

      def __eq__(self, otra):
          return self.anio == otra.anio

      def __lt__(self, otra):
          return self.anio < otra.anio


  monedas = [Moneda("sol", 1914), Moneda("dinero", 1863), Moneda("peseta", 1880)]
  print(sorted(monedas))
  print(Moneda("sol", 1866) >= Moneda("medio sol", 1864))
hints:
  - "El decorador que completa las comparaciones es `total_ordering`. Los dos métodos son `__eq__` (igual) y `__lt__` (*less than*, menor que)."
tests:
  - name: ordena de la más antigua a la más nueva
    output: "[dinero (1863), peseta (1880), sol (1914)]\nTrue"
  - name: max da la más nueva
    expect: max(monedas).anio == 1914
  - name: ">= funciona"
    expect: Moneda("sol", 1866) >= Moneda("medio sol", 1864)
  - name: "<= con el mismo año"
    expect: Moneda("sol", 1900) <= Moneda("peseta", 1900)
  - name: "> funciona"
    expect: not (Moneda("sol", 1864) > Moneda("peseta", 1880))
  - name: usa total_ordering
    source: '@functools\.total_ordering'
```

```exercise
id: py13-arregla-hash
type: fix
title: El lote que no entró al set
prompt: |
  Hortensia compró un lote de estampillas en un remate y quiere saber cuántas **distintas** hay. Su sobrino le agregó `__eq__` a la clase para que dos estampillas iguales cuenten como una, y desde entonces el programa se cae. Ejecútalo, lee el error y arréglalo agregando un método, sin tocar `__eq__`.
visual:
  figure:
    input: { label: lote, cells: ["Perú 1866 llama", "Perú 1858 escudo", "Perú 1866 llama", "Chile 1853 Colón"], highlight: [0, 2] }
    arrow: set(lote)
    output: { label: distintas, value: "3" }
starter: |
  class Estampilla:
      def __init__(self, pais, anio, motivo):
          self.pais = pais
          self.anio = anio
          self.motivo = motivo

      def __eq__(self, otra):
          return (self.pais, self.anio, self.motivo) == (otra.pais, otra.anio, otra.motivo)


  lote = [
      Estampilla("Perú", 1866, "llama"),
      Estampilla("Perú", 1858, "escudo"),
      Estampilla("Perú", 1866, "llama"),
      Estampilla("Chile", 1853, "Colón"),
  ]
  distintas = set(lote)
  print(len(distintas), "estampillas distintas")
solution: |
  class Estampilla:
      def __init__(self, pais, anio, motivo):
          self.pais = pais
          self.anio = anio
          self.motivo = motivo

      def __eq__(self, otra):
          return (self.pais, self.anio, self.motivo) == (otra.pais, otra.anio, otra.motivo)

      def __hash__(self):
          return hash((self.pais, self.anio, self.motivo))


  lote = [
      Estampilla("Perú", 1866, "llama"),
      Estampilla("Perú", 1858, "escudo"),
      Estampilla("Perú", 1866, "llama"),
      Estampilla("Chile", 1853, "Colón"),
  ]
  distintas = set(lote)
  print(len(distintas), "estampillas distintas")
hints:
  - "`unhashable type: 'Estampilla'`: al definir `__eq__`, la clase se quedó sin `__hash__`, y un `set` lo necesita."
  - "Escribe `__hash__` con los mismos tres campos que compara `__eq__`: `return hash((self.pais, self.anio, self.motivo))`."
tests:
  - name: cuenta 3 distintas
    output: 3 estampillas distintas
  - name: dos estampillas iguales tienen el mismo hash
    expect: hash(Estampilla("Perú", 1866, "llama")) == hash(Estampilla("Perú", 1866, "llama"))
  - name: estampillas distintas tienen hash distinto
    expect: len({hash(e) for e in lote}) == 3
    msg: Usa en el hash los mismos campos que en __eq__, no un número fijo.
  - name: una estampilla igual está en el set
    expect: Estampilla("Chile", 1853, "Colón") in distintas
  - name: define __hash__
    source: 'def\s+__hash__\s*\(\s*self\s*\)'
```

```exercise
id: py13-escribe-album
type: write
title: El álbum que se porta como lista
prompt: |
  Escribe la clase `Album`, que guarda una lista de sellos (textos) y se porta como una colección de Python:

  - `len(album)` da cuántos sellos tiene, y un álbum vacío es falso en un `if`;
  - `for sello in album` recorre los sellos en orden (`__iter__`);
  - `"llama 1866" in album` busca **sin importar mayúsculas** (`__contains__`): encuentra `"Llama 1866"`;
  - `album_a + album_b` devuelve un **álbum nuevo** con los sellos de `album_a` y después los de `album_b` que no estaban ya, sin cambiar ninguno de los dos.
visual:
  figure:
    input: { label: "Album([\"A\", \"B\"]) + Album([\"B\", \"C\"])", cells: ["A", "B", "B", "C"], highlight: [2] }
    arrow: "__add__ salta el sello repetido"
    output: { label: un álbum nuevo, cells: ["A", "B", "C"] }
starter: |
  class Album:
      def __init__(self, sellos):
          self.sellos = list(sellos)


  album = Album(["Llama 1866", "Escudo 1858"]) + Album(["Paita 1857", "Llama 1866"])
  print(len(album), "llama 1866" in album, list(album))
solution: |
  class Album:
      def __init__(self, sellos):
          self.sellos = list(sellos)

      def __len__(self):
          return len(self.sellos)

      def __iter__(self):
          return iter(self.sellos)

      def __contains__(self, sello):
          return sello.lower() in [s.lower() for s in self.sellos]

      def __add__(self, otro):
          nuevos = [s for s in otro.sellos if s not in self.sellos]
          return Album(self.sellos + nuevos)


  album = Album(["Llama 1866", "Escudo 1858"]) + Album(["Paita 1857", "Llama 1866"])
  print(len(album), "llama 1866" in album, list(album))
hints:
  - "`__iter__` puede devolver `iter(self.sellos)`. Para no importar mayúsculas, compara todo en `.lower()`."
  - "`__add__` arma la lista nueva y devuelve `Album(...)`: nunca toques `self.sellos` ni `otro.sellos`."
tests:
  - name: len cuenta los sellos
    expect: len(Album(["Llama 1866", "Escudo 1858"])) == 2
  - name: un álbum vacío es falso
    expect: not Album([])
  - name: for recorre los sellos en orden
    expect: 'list(Album(["X", "Y", "Z"])) == ["X", "Y", "Z"]'
  - name: in no distingue mayúsculas
    expect: '"llama 1866" in Album(["Llama 1866"]) and "PAITA" not in Album(["Llama 1866"])'
  - name: + junta sin repetir
    expect: 'list(Album(["A", "B"]) + Album(["B", "C"])) == ["A", "B", "C"]'
  - name: + devuelve un álbum
    expect: type(Album(["A"]) + Album(["B"])) == Album
  - name: + no cambia los álbumes originales
    expect: '(lambda a, b: (a + b, a.sellos, b.sellos)[1:])(Album(["A"]), Album(["B"])) == (["A"], ["B"])'
    msg: __add__ debe crear un álbum nuevo, sin agregarle nada a self ni a otro.
  - name: el ejemplo de abajo
    output: "3 True ['Llama 1866', 'Escudo 1858', 'Paita 1857']"
```

```exercise
id: py13-predice-with
type: predict
title: La lupa que se cayó
prompt: |
  Quilla saca una moneda de la vitrina 3 y, a mitad de camino, se le cae la lupa. ¿Qué imprime?
code: |
  class Vitrina:
      def __init__(self, numero):
          self.numero = numero

      def __enter__(self):
          print("abre", self.numero)
          return self

      def __exit__(self, tipo, error, traza):
          print("cierra", self.numero)


  try:
      with Vitrina(3) as v:
          print("saca la moneda de", v.numero)
          raise ValueError("se cayó la lupa")
          print("la devuelve")
  except ValueError as e:
      print("problema:", e)
options:
  - "abre 3\nsaca la moneda de 3\ncierra 3\nproblema: se cayó la lupa"
  - "abre 3\nsaca la moneda de 3\nproblema: se cayó la lupa"
  - "abre 3\nsaca la moneda de 3\nproblema: se cayó la lupa\ncierra 3"
  - "abre 3\nsaca la moneda de 3\nla devuelve\ncierra 3"
answer: "abre 3\nsaca la moneda de 3\ncierra 3\nproblema: se cayó la lupa"
explain: |
  El error corta el bloque (`la devuelve` nunca se imprime), pero **antes de que el error salga del `with`**, Python llama a `__exit__`: la vitrina se cierra. Recién después el error llega al `except`. Como `__exit__` no devuelve `True`, el error no se traga: sigue su camino.
```

```exercise
id: py13-escribe-prestamo
type: write
title: El préstamo a la lupa
prompt: |
  Escribe, con `@contextmanager`, `prestamo(registro, pieza)`: cuando una pieza sale de la vitrina para mirarla con lupa, anota en la lista `registro` el texto `"sale <pieza>"` al entrar, entrega la pieza al `as`, y anota `"vuelve <pieza>"` al salir, **aunque haya habido un error**.

  `probar(prestamo, con_error)` ya viene dada: usa tu `prestamo` en un `with`, con o sin un `ValueError` adentro, y devuelve lo que quedó anotado.
visual:
  figure:
    panes:
      - { label: "probar(prestamo, False)", cells: ["sale sol de 1863", "mira sol de 1863", "todo bien", "vuelve sol de 1863"] }
      - { label: "probar(prestamo, True)", cells: ["sale sol de 1863", "mira sol de 1863", "vuelve sol de 1863", "error"], highlight: [2] }
starter: |
  from contextlib import contextmanager


  @contextmanager
  def prestamo(registro, pieza):
      yield pieza


  print(probar(prestamo, False))
  print(probar(prestamo, True))
solution: |
  from contextlib import contextmanager


  @contextmanager
  def prestamo(registro, pieza):
      registro.append(f"sale {pieza}")
      try:
          yield pieza
      finally:
          registro.append(f"vuelve {pieza}")


  print(probar(prestamo, False))
  print(probar(prestamo, True))
hints:
  - Lo que va antes del `yield` se ejecuta al entrar al `with`; lo que va después, al salir.
  - "Si el bloque falla, el error aparece en el `yield`. Envuélvelo en `try:` … `finally:` para que lo de salida se ejecute siempre."
helpers:
  - name: probar
    sig: "probar(administrador, con_error) → list"
    doc: Usa administrador(registro, "sol de 1863") en un with, con o sin un ValueError adentro, y devuelve el registro.
    code: |
      def probar(administrador, con_error):
          registro = []
          try:
              with administrador(registro, "sol de 1863") as pieza:
                  registro.append(f"mira {pieza}")
                  if con_error:
                      raise ValueError("se cayó")
                  registro.append("todo bien")
          except ValueError:
              registro.append("error")
          return registro
tests:
  - name: sin error, anota la salida y la vuelta
    run: probar(prestamo, False)
    equals: ["sale sol de 1863", "mira sol de 1863", "todo bien", "vuelve sol de 1863"]
  - name: con error, la pieza vuelve igual
    run: probar(prestamo, True)
    equals: ["sale sol de 1863", "mira sol de 1863", "vuelve sol de 1863", "error"]
  - name: usa try y finally
    source: '\btry\s*:[\s\S]*\byield\b[\s\S]*\bfinally\s*:'
```

```exercise
id: py13-predice-protocolo
type: predict
title: ¿Quién es tasable?
prompt: |
  `Tasable` describe algo que tiene un método `tasar`. Ninguna clase hereda de él. `@runtime_checkable` deja que `isinstance` revise esa forma. ¿Qué imprime?
code: |
  from typing import Protocol, runtime_checkable


  @runtime_checkable
  class Tasable(Protocol):
      def tasar(self) -> int: ...


  class Moneda:
      def tasar(self):
          return 120


  class Postal:
      def describir(self):
          return "Plaza San Martín, 1925"


  def total(piezas: list[Tasable]) -> int:
      return sum(p.tasar() for p in piezas)


  print(isinstance(Moneda(), Tasable), isinstance(Postal(), Tasable))
  print(total([Moneda(), Moneda()]))
options:
  - "True False\n240"
  - "False False\n240"
  - "True True\n240"
  - "False False\nTypeError"
answer: "True False\n240"
explain: |
  Un `Protocol` mira la **forma**, no la herencia: `Moneda` tiene `tasar`, así que encaja; `Postal` no. Y la anotación `list[Tasable]` no detiene nada al ejecutar: `total` funciona porque cada moneda sabe `tasar()`, puro *duck typing*.
```

## El caso

```exercise
id: py13-caso-vitrinas
type: case
title: La colección que se ordenó mal
prompt: |
  **Escribe `__eq__` y `__lt__` para `Moneda` con la regla de Hortensia, ordena cada bandeja con `sorted` y busca en qué puesto queda el medio sol de 1864. Compáralo con lo que reportó cada ayudante.**

  La regla de Hortensia para sus vitrinas: **la más antigua primero; si dos son del mismo año, la de menor valor primero** (el valor va en céntimos). Dos monedas con el mismo año y el mismo valor cuentan como iguales.

  Cada uno de sus tres ayudantes arregló una vitrina con su propia clase `Moneda` y le contó a Hortensia en qué puesto (contando desde 1) quedó el **medio sol de 1864**, que cada vitrina tiene uno. Uno de los tres escribió mal su `__lt__` y su vitrina quedó desordenada.

  Imprime una línea por ayudante que empiece con su nombre: `print("Brenda:", vitrina.index(marcada) + 1)`. `index` busca con `==`, así que necesita tu `__eq__`.
visual:
  board:
    for: py13-caso-vitrinas
    task: "Ordena cada bandeja: año, y si empatan, valor. ¿En qué puesto queda el medio sol de 1864?"
    cards:
      - name: Brenda
        kind: person
        role: Vitrina 1
        rows: [["Monedas", "6"], ["Su __lt__", "\"año y luego valor\""], ["Medio sol de 1864", "puesto 2"]]
        clue: { find: "Brenda", says: 2 }
      - name: Ulises
        kind: person
        role: Vitrina 2
        rows: [["Monedas", "6, dos de 1864"], ["Su __lt__", "\"año y luego valor\""], ["Medio sol de 1864", "puesto 2"]]
        clue: { find: "Ulises", says: 2 }
      - name: Toribio
        kind: person
        role: Vitrina 3
        culprit: true
        rows: [["Monedas", "6"], ["Su __lt__", "\"año o valor, da igual\""], ["Medio sol de 1864", "puesto 4"]]
        clue: { find: "Toribio", says: 4 }
      - name: Los valores
        kind: note
        role: En céntimos de sol
        rows: [["medio dinero", "5"], ["dinero", "10"], ["peseta", "20"], ["medio sol", "50"], ["sol", "100"]]
    caption: "Si en la vitrina de Ulises te sale el puesto 3, revisa el desempate: en 1864 hay un sol y un medio sol."
starter: |
  from functools import total_ordering

  # bandejas ya viene dada: ayudante → lista de [nombre, año, valor en céntimos]
  print(bandejas["Brenda"][0])


  # TODO: ponle @total_ordering a la clase (cuando ya tenga __lt__)
  class Moneda:
      def __init__(self, nombre, anio, valor):
          self.nombre = nombre
          self.anio = anio
          self.valor = valor

      def __repr__(self):
          return f"{self.nombre} {self.anio}"

      # TODO: __eq__ y __lt__ con la regla de Hortensia


  marcada = Moneda("medio sol", 1864, 50)
  # TODO: para cada ayudante, arma sus monedas, ordénalas con sorted e imprime
  # print("Brenda:", vitrina.index(marcada) + 1)
solution: |
  from functools import total_ordering


  @total_ordering
  class Moneda:
      def __init__(self, nombre, anio, valor):
          self.nombre = nombre
          self.anio = anio
          self.valor = valor

      def __repr__(self):
          return f"{self.nombre} {self.anio}"

      def __eq__(self, otra):
          return (self.anio, self.valor) == (otra.anio, otra.valor)

      def __lt__(self, otra):
          return (self.anio, self.valor) < (otra.anio, otra.valor)


  marcada = Moneda("medio sol", 1864, 50)
  for ayudante, bandeja in bandejas.items():
      vitrina = sorted(Moneda(*datos) for datos in bandeja)
      print(f"{ayudante}: {vitrina} {vitrina.index(marcada) + 1}")
globals:
  bandejas:
    Brenda: [[sol, 1914, 100], [medio sol, 1864, 50], [dinero, 1863, 10], [peseta, 1880, 20], [sol, 1866, 100], [medio dinero, 1914, 5]]
    Ulises: [[peseta, 1917, 20], [dinero, 1875, 10], [sol, 1864, 100], [medio sol, 1864, 50], [medio dinero, 1863, 5], [sol, 1923, 100]]
    Toribio: [[medio sol, 1864, 50], [sol, 1870, 100], [dinero, 1918, 10], [peseta, 1866, 20], [sol, 1916, 100], [medio dinero, 1879, 5]]
answer: Toribio
answerLabel: ¿Quién escribió mal su __lt__?
reveal: |
  Toribio. En su vitrina el medio sol de 1864 es la moneda más antigua y va **primero**, pero él reportó el puesto 4. Su `__lt__` era `self.anio < otra.anio or self.valor < otra.valor`: con ese `or`, el medio dinero de 1879 resulta "menor" que el medio sol de 1864 solo por valer menos, y el orden queda revuelto. Comparar tuplas, `(self.anio, self.valor) < (otra.anio, otra.valor)`, mira el valor **solo** cuando los años empatan.
hints:
  - "Las tuplas se comparan campo por campo: `(self.anio, self.valor) < (otra.anio, otra.valor)` ya es la regla entera. Lo mismo con `==` para `__eq__`."
  - "`Moneda(*datos)` arma una moneda desde una lista `[nombre, año, valor]`. Ordena con `sorted(...)` y busca con `vitrina.index(marcada)`."
```

## El juez

Como desde la sesión 4, el juez llama a una función y compara lo que devuelve. Aquí esa función ya viene escrita en el editor: arma objetos de **tu** clase, los suma, los compara, los mete en un `set`… Lo que juzga de verdad son tus métodos dunder.

```exercise
id: py13-juez-fraccion
type: judge
mode: function
function: resumen
title: Las partes del remate
prompt: |
  **Escribe la clase `Fraccion` con `__eq__`, `__lt__`, `__hash__`, `__add__` y `__bool__`, para que `resumen(partes)` (ya escrita) funcione.**

  Hortensia compra lotes en remate con sus socios y anota la parte de cada uno como fracción: `[1, 4]` es un cuarto. Las anota como le salen: sin simplificar (`[2, 4]`), con el signo abajo (`[1, -2]`, una devolución) o en cero (`[0, 3]`, un socio que no puso nada).

  `Fraccion(num, den)` debe quedar siempre **simplificada** y con el denominador **positivo**, en sus atributos `num` y `den`: `Fraccion(2, -4)` guarda `num = -1`, `den = 2`, y `Fraccion(0, 3)` guarda `0` y `1`. `math.gcd(a, b)` da el máximo común divisor (siempre positivo).

  - `a + b` devuelve una `Fraccion` nueva: `a/b + c/d = (a·d + c·b) / (b·d)`.
  - `a == b` y `a < b` comparan el **valor**: `Fraccion(1, 2) == Fraccion(2, 4)`, y `Fraccion(2, 5) < Fraccion(1, 2)`.
  - Dos fracciones iguales tienen el mismo `hash`, y una fracción es falsa solo si vale 0.

  `resumen` devuelve `[suma, cuántas distintas, todas ordenadas de menor a mayor, cuántas no son cero]`, con cada fracción como `[num, den]`.

  **Restricciones:** de 0 a 12 partes · numeradores de −36 a 36 · denominadores de −36 a 36, nunca 0.
visual:
  figure:
    title: El ejemplo 1
    input: { label: partes, cells: ["1/2", "1/4", "2/4", "0/3"] }
    arrow: "Fraccion simplifica: 2/4 → 1/2, 0/3 → 0/1"
    output: { label: devuelve, table: { head: ["suma", "distintas", "ordenadas", "no cero"], rows: [["5/4", "3", "0/1, 1/4, 1/2, 1/2", "3"]] } }
    steps:
      - "La suma es 1/2 + 1/4 + 1/2 + 0 = 5/4."
      - "Distintas: {1/2, 1/4, 0}, porque 2/4 es igual a 1/2 y tiene su mismo hash."
starter: |
  from functools import total_ordering
  from math import gcd


  @total_ordering
  class Fraccion:
      def __init__(self, num, den):
          self.num = num
          self.den = den

      def __repr__(self):
          return f"{self.num}/{self.den}"


  def resumen(partes):
      fracciones = [Fraccion(num, den) for num, den in partes]
      suma = sum(fracciones, Fraccion(0, 1))
      ordenadas = [[f.num, f.den] for f in sorted(fracciones)]
      return [[suma.num, suma.den], len(set(fracciones)), ordenadas, len([f for f in fracciones if f])]
solution: |
  from functools import total_ordering
  from math import gcd


  @total_ordering
  class Fraccion:
      def __init__(self, num, den):
          if den < 0:
              num, den = -num, -den
          divisor = gcd(num, den)
          self.num = num // divisor
          self.den = den // divisor

      def __repr__(self):
          return f"{self.num}/{self.den}"

      def __eq__(self, otra):
          return (self.num, self.den) == (otra.num, otra.den)

      def __hash__(self):
          return hash((self.num, self.den))

      def __lt__(self, otra):
          return self.num * otra.den < otra.num * self.den

      def __add__(self, otra):
          return Fraccion(self.num * otra.den + otra.num * self.den, self.den * otra.den)

      def __bool__(self):
          return self.num != 0


  def resumen(partes):
      fracciones = [Fraccion(num, den) for num, den in partes]
      suma = sum(fracciones, Fraccion(0, 1))
      ordenadas = [[f.num, f.den] for f in sorted(fracciones)]
      return [[suma.num, suma.den], len(set(fracciones)), ordenadas, len([f for f in fracciones if f])]
hints:
  - "Simplifica en `__init__`: si `den < 0`, cámbiales el signo a los dos; luego divide los dos entre `gcd(num, den)`. Ya simplificadas, dos fracciones son iguales si tienen el mismo `(num, den)`."
  - "Para `<` no dividas: con denominadores positivos, `a/b < c/d` es lo mismo que `a·d < c·b`."
samples:
  - args: [[[1, 2], [1, 4], [2, 4], [0, 3]]]
    returns: [[5, 4], 3, [[0, 1], [1, 4], [1, 2], [1, 2]], 3]
    note: El dibujo de arriba.
  - args: [[[3, -6], [1, 3], [-1, 2]]]
    returns: [[-2, 3], 2, [[-1, 2], [-1, 2], [1, 3]], 3]
    note: "`[3, -6]` es −1/2, igual que `[-1, 2]`."
edge:
  - args: [[]]
    tag: sin partes
  - args: [[[0, 5]]]
    tag: con una sola parte en cero
  - args: [[[6, 3]]]
    tag: con una fracción que es un entero
  - args: [[[-2, -4]]]
    tag: con los dos signos negativos
  - args: [[[1, 2], [2, 5]]]
    tag: cuando el numerador menor no es la fracción menor
  - args: [[[1, 3], [2, 6], [3, 9], [4, 12]]]
    tag: con cuatro formas de escribir lo mismo
  - args: [[[5, 1], [-5, 1]]]
    tag: cuando la suma da cero
  - args: [[[1, -2], [1, 2], [0, -7]]]
    tag: con el signo en el denominador
  - args: [[[7, 12], [7, 12], [1, 12], [11, 12], [5, 6]]]
    tag: con doceavos
random:
  count: 40
  seed: 1303
  generate: |
    partes, simples = [], []
    for _ in range(rng.int(0, 12)):
        if simples and rng.int(0, 2) == 0:
            num, den = rng.pick(simples)
            k = rng.pick([2, 3, -1, -2])
            partes.append([num * k, den * k])
        else:
            simples.append([rng.int(-12, 12), rng.pick([1, 2, 3, 4, 5, 6, 8, 12, -2, -3, -4])])
            partes.append(simples[-1])
    return [partes]
wrong:
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraccion:
        def __init__(self, num, den):
            signo = -1 if den < 0 else 1
            self.num, self.den = num * signo, den * signo
        def __eq__(self, otra): return (self.num, self.den) == (otra.num, otra.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, otra): return self.num * otra.den < otra.num * self.den
        def __add__(self, otra): return Fraccion(self.num * otra.den + otra.num * self.den, self.den * otra.den)
        def __bool__(self): return self.num != 0


    def resumen(partes):
        fracciones = [Fraccion(num, den) for num, den in partes]
        suma = sum(fracciones, Fraccion(0, 1))
        ordenadas = [[f.num, f.den] for f in sorted(fracciones)]
        return [[suma.num, suma.den], len(set(fracciones)), ordenadas, len([f for f in fracciones if f])]
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraccion:
        def __init__(self, num, den):
            signo = -1 if den < 0 else 1
            divisor = gcd(num, den) * signo
            self.num, self.den = num // divisor, den // divisor
        def __eq__(self, otra): return (self.num, self.den) == (otra.num, otra.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, otra): return (self.num, self.den) < (otra.num, otra.den)
        def __add__(self, otra): return Fraccion(self.num * otra.den + otra.num * self.den, self.den * otra.den)
        def __bool__(self): return self.num != 0


    def resumen(partes):
        fracciones = [Fraccion(num, den) for num, den in partes]
        suma = sum(fracciones, Fraccion(0, 1))
        ordenadas = [[f.num, f.den] for f in sorted(fracciones)]
        return [[suma.num, suma.den], len(set(fracciones)), ordenadas, len([f for f in fracciones if f])]
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraccion:
        def __init__(self, num, den):
            signo = -1 if den < 0 else 1
            divisor = gcd(num, den) * signo
            self.num, self.den = num // divisor, den // divisor
        def __eq__(self, otra): return (self.num, self.den) == (otra.num, otra.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, otra): return self.num * otra.den < otra.num * self.den
        def __add__(self, otra): return Fraccion(self.num + otra.num, self.den + otra.den)
        def __bool__(self): return self.num != 0


    def resumen(partes):
        fracciones = [Fraccion(num, den) for num, den in partes]
        suma = sum(fracciones, Fraccion(0, 1))
        ordenadas = [[f.num, f.den] for f in sorted(fracciones)]
        return [[suma.num, suma.den], len(set(fracciones)), ordenadas, len([f for f in fracciones if f])]
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraccion:
        def __init__(self, num, den):
            signo = -1 if den < 0 else 1
            divisor = gcd(num, den) * signo
            self.num, self.den = num // divisor, den // divisor
        def __eq__(self, otra): return (self.num, self.den) == (otra.num, otra.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, otra): return self.num * otra.den < otra.num * self.den
        def __add__(self, otra): return Fraccion(self.num * otra.den + otra.num * self.den, self.den * otra.den)


    def resumen(partes):
        fracciones = [Fraccion(num, den) for num, den in partes]
        suma = sum(fracciones, Fraccion(0, 1))
        ordenadas = [[f.num, f.den] for f in sorted(fracciones)]
        return [[suma.num, suma.den], len(set(fracciones)), ordenadas, len([f for f in fracciones if f])]
tests:
  - name: Fraccion define __lt__
    source: 'def\s+__lt__'
  - name: Fraccion define __add__
    source: 'def\s+__add__'
```

```exercise
id: py13-juez-mazo
type: judge
mode: function
function: operar_mazo
title: El mazo de postales
prompt: |
  **Escribe la clase `Mazo` con `__len__`, `__getitem__`, `__iter__`, `__contains__` y `__add__`, para que `operar_mazo(postales, ordenes)` (ya escrita) funcione.**

  Hortensia vende postales antiguas de Lima en mazos. Un coleccionista nunca quiere dos iguales, así que **un mazo no repite postales**: `Mazo(postales)` se queda con la primera aparición de cada una, en orden.

  - `len(mazo)` da cuántas postales tiene, y `postal in mazo` dice si está.
  - `mazo[i]` da la postal en la posición `i` (la 0 es la de arriba; `-1`, la de abajo).
  - `mazo[a:b]` da un **`Mazo` nuevo** con ese tramo, no una lista.
  - `mazo + otro` da un **`Mazo` nuevo**: las postales de `mazo` y después las de `otro` que no estaban, y `for postal in mazo` las recorre en orden.

  `operar_mazo` recibe las órdenes como listas: `["largo"]` anota `len(mazo)`, `["ver", i]` anota `mazo[i]`, `["tiene", postal]` anota si está, `["cortar", k]` pasa las `k` de arriba al fondo (`mazo[k:] + mazo[:k]`) y `["juntar", postales]` le agrega un mazo nuevo. Al final anota `list(mazo)`.

  **Restricciones:** de 0 a 8 postales al empezar · de 1 a 12 órdenes · `ver` siempre pide una posición que existe · en `cortar`, 0 ≤ `k` ≤ `len(mazo)`.
visual:
  figure:
    title: El ejemplo 1, orden por orden
    panes:
      - { label: "Mazo([\"Rímac\", \"Callao\", \"Rímac\", \"Colón\"])", cells: ["Rímac", "Callao", "Colón"] }
      - { label: "[\"cortar\", 1]", cells: ["Callao", "Colón", "Rímac"] }
      - { label: "[\"juntar\", [\"Colón\", \"La Punta\"]]", cells: ["Callao", "Colón", "Rímac", "La Punta"], highlight: [3] }
      - { label: devuelve, value: "[3, 'Rímac', 'La Punta', True, [...]]" }
    caption: "El `Rímac` repetido no entra al mazo, y del `juntar` solo entra `La Punta`."
starter: |
  class Mazo:
      def __init__(self, postales=()):
          self.postales = list(postales)


  def operar_mazo(postales, ordenes):
      mazo = Mazo(postales)
      resultados = []
      for orden, *dato in ordenes:
          if orden == "largo":
              resultados.append(len(mazo))
          elif orden == "ver":
              resultados.append(mazo[dato[0]])
          elif orden == "tiene":
              resultados.append(dato[0] in mazo)
          elif orden == "cortar":
              mazo = mazo[dato[0]:] + mazo[:dato[0]]
          else:
              mazo = mazo + Mazo(dato[0])
      return resultados + [list(mazo)]
solution: |
  class Mazo:
      def __init__(self, postales=()):
          self.postales = []
          for postal in postales:
              if postal not in self.postales:
                  self.postales.append(postal)

      def __len__(self):
          return len(self.postales)

      def __getitem__(self, i):
          if isinstance(i, slice):
              return Mazo(self.postales[i])
          return self.postales[i]

      def __iter__(self):
          return iter(self.postales)

      def __contains__(self, postal):
          return postal in self.postales

      def __add__(self, otro):
          return Mazo(self.postales + otro.postales)


  def operar_mazo(postales, ordenes):
      mazo = Mazo(postales)
      resultados = []
      for orden, *dato in ordenes:
          if orden == "largo":
              resultados.append(len(mazo))
          elif orden == "ver":
              resultados.append(mazo[dato[0]])
          elif orden == "tiene":
              resultados.append(dato[0] in mazo)
          elif orden == "cortar":
              mazo = mazo[dato[0]:] + mazo[:dato[0]]
          else:
              mazo = mazo + Mazo(dato[0])
      return resultados + [list(mazo)]
hints:
  - "Quita las repetidas en `__init__`: así `__add__` puede ser solo `Mazo(self.postales + otro.postales)` y el constructor hace el resto."
  - "`__getitem__` recibe un número o un objeto `slice`. `isinstance(i, slice)` los distingue: con un `slice`, devuelve `Mazo(self.postales[i])`."
samples:
  - args: [["Rímac", "Callao", "Rímac", "Colón"], [["largo"], ["ver", 0], ["cortar", 1], ["juntar", ["Colón", "La Punta"]], ["ver", -1], ["tiene", "Rímac"]]]
    returns: [3, "Rímac", "La Punta", true, ["Callao", "Colón", "Rímac", "La Punta"]]
    note: El dibujo de arriba.
  - args: [["Catedral", "Barranco"], [["cortar", 2], ["tiene", "Callao"], ["ver", 1]]]
    returns: [false, "Barranco", ["Catedral", "Barranco"]]
    note: Cortar todas las postales deja el mazo como estaba.
edge:
  - args: [[], [["largo"]]]
    tag: con un mazo vacío
  - args: [[], [["juntar", ["Callao", "Callao"]], ["largo"]]]
    tag: al juntar postales repetidas a un mazo vacío
  - args: [["Colón", "Colón", "Colón"], [["largo"], ["ver", -1]]]
    tag: con la misma postal tres veces
  - args: [["Rímac", "Callao", "Colón"], [["cortar", 0], ["cortar", 3], ["ver", 0]]]
    tag: cortando cero y todas
  - args: [["Rímac", "Callao", "Colón"], [["cortar", 2], ["juntar", ["Rímac", "Barranco"]], ["ver", -2]]]
    tag: al cortar y luego juntar
  - args: [["Rímac"], [["juntar", ["Rímac"]], ["largo"], ["tiene", "Rímac"]]]
    tag: al juntar una postal que ya estaba
  - args: [["La Punta", "Barranco", "Chorrillos"], [["ver", -3], ["ver", 2], ["tiene", "Callao"]]]
    tag: con índices negativos
random:
  count: 40
  seed: 1313
  generate: |
    nombres = ["Catedral", "Desamparados", "San Martín", "Colón", "Rímac", "Callao",
               "Barranco", "Chorrillos", "La Punta", "Teatro Segura"]
    postales = [rng.pick(nombres) for _ in range(rng.int(0, 8))]
    mazo = list(dict.fromkeys(postales))
    ordenes = []
    for _ in range(rng.int(1, 12)):
        tipo = rng.pick(["largo", "ver", "ver", "tiene", "cortar", "cortar", "juntar"])
        if tipo == "ver" and mazo:
            ordenes.append(["ver", rng.int(-len(mazo), len(mazo) - 1)])
        elif tipo == "tiene":
            ordenes.append(["tiene", rng.pick(nombres)])
        elif tipo == "cortar":
            k = rng.int(0, len(mazo))
            ordenes.append(["cortar", k])
            mazo = mazo[k:] + mazo[:k]
        elif tipo == "juntar":
            otras = [rng.pick(nombres) for _ in range(rng.int(0, 4))]
            ordenes.append(["juntar", otras])
            mazo = list(dict.fromkeys(mazo + otras))
        else:
            ordenes.append(["largo"])
    return [postales, ordenes]
wrong:
  - |
    class Mazo:
        def __init__(self, postales=()): self.postales = list(postales)
        def __len__(self): return len(self.postales)
        def __getitem__(self, i): return Mazo(self.postales[i]) if isinstance(i, slice) else self.postales[i]
        def __iter__(self): return iter(self.postales)
        def __contains__(self, postal): return postal in self.postales
        def __add__(self, otro): return Mazo(self.postales + otro.postales)


    def operar_mazo(postales, ordenes):
        mazo = Mazo(postales)
        resultados = []
        for orden, *dato in ordenes:
            if orden == "largo":
                resultados.append(len(mazo))
            elif orden == "ver":
                resultados.append(mazo[dato[0]])
            elif orden == "tiene":
                resultados.append(dato[0] in mazo)
            elif orden == "cortar":
                mazo = mazo[dato[0]:] + mazo[:dato[0]]
            else:
                mazo = mazo + Mazo(dato[0])
        return resultados + [list(mazo)]
  - |
    class Mazo:
        def __init__(self, postales=()): self.postales = list(dict.fromkeys(postales))
        def __len__(self): return len(self.postales)
        def __getitem__(self, i): return self.postales[i]
        def __iter__(self): return iter(self.postales)
        def __contains__(self, postal): return postal in self.postales
        def __add__(self, otro): return Mazo(self.postales + otro.postales)


    def operar_mazo(postales, ordenes):
        mazo = Mazo(postales)
        resultados = []
        for orden, *dato in ordenes:
            if orden == "largo":
                resultados.append(len(mazo))
            elif orden == "ver":
                resultados.append(mazo[dato[0]])
            elif orden == "tiene":
                resultados.append(dato[0] in mazo)
            elif orden == "cortar":
                mazo = mazo[dato[0]:] + mazo[:dato[0]]
            else:
                mazo = mazo + Mazo(dato[0])
        return resultados + [list(mazo)]
  - |
    class Mazo:
        def __init__(self, postales=()): self.postales = list(postales)
        def __len__(self): return len(self.postales)
        def __getitem__(self, i): return Mazo(self.postales[i]) if isinstance(i, slice) else self.postales[i]
        def __iter__(self): return iter(self.postales)
        def __contains__(self, postal): return postal in self.postales
        def __add__(self, otro): return Mazo(self.postales + [p for p in otro.postales if p not in self.postales])


    def operar_mazo(postales, ordenes):
        mazo = Mazo(postales)
        resultados = []
        for orden, *dato in ordenes:
            if orden == "largo":
                resultados.append(len(mazo))
            elif orden == "ver":
                resultados.append(mazo[dato[0]])
            elif orden == "tiene":
                resultados.append(dato[0] in mazo)
            elif orden == "cortar":
                mazo = mazo[dato[0]:] + mazo[:dato[0]]
            else:
                mazo = mazo + Mazo(dato[0])
        return resultados + [list(mazo)]
```

## Misión final

```exercise
id: py13-mision-bovedas
type: mission
title: Las bóvedas de la casona
prompt: |
  **Escribe el administrador de contexto `boveda_abierta()`, que abre la puerta de una bóveda al entrar y la cierra al salir pase lo que pase, y úsalo para sacar la pieza de cada bóveda de la lista `bovedas`.**

  Detrás de la galería hay un pasillo, y debajo de él, las bóvedas de la casona, cada una con su puerta cerrada. `bovedas` es la lista de **columnas** de las puertas que hay que visitar, de oeste a este; `ir_a(columna)` ya está escrita y deja a Quilla en el pasillo, encima de esa puerta, mirando al este.

  `boveda_abierta()`, con `@contextmanager` o con una clase con `__enter__` y `__exit__`:

  - **al entrar**: gira hacia la puerta (al sur), la abre con `robot.abrir_puerta()` (abre la que tiene en frente) y avanza 2 casillas, hasta el fondo de la bóveda;
  - **al salir, aunque haya habido un error**: da media vuelta, avanza 2 hasta el pasillo, cierra con `robot.cerrar_puerta()` (cierra la que tiene debajo) y queda mirando al este.

  Dentro del `with`, `robot.tomar()` levanta la pieza y devuelve su nombre, o `None` si la bóveda está vacía. Si está vacía, lanza `BovedaVacia(columna)`; atrápala **fuera** del `with` y anota la columna en `faltantes`. Una bóveda vacía no puede dejar la puerta abierta: Hortensia tiene alarma.
visual:
  figure:
    title: Una bóveda, paso a paso
    panes:
      - { label: el pasillo y las bóvedas, grid: ["############", "#R.........#", "###P###P#P##", "###a###.#b##", "############"], marks: ["3,2", "7,2", "9,2"] }
      - { label: con boveda_abierta(), table: { head: ["momento", "Quilla"], rows: [["al entrar", "gira al sur, abre, avanza 2"], ["dentro", "tomar(); si es None, raise BovedaVacia"], ["al salir (siempre)", "media vuelta, avanza 2, cierra, mira al este"]] } }
starter: |
  from contextlib import contextmanager


  class BovedaVacia(Exception):
      """Una bóveda que debía tener una pieza estaba vacía."""


  def ir_a(columna):
      """Camina por el pasillo hasta quedar encima de esa puerta, mirando al este."""
      robot.avanzar(columna - robot.posicion.x)


  faltantes = []

  # TODO: escribe boveda_abierta()

  # TODO: para cada columna de bovedas: ir_a, y dentro de un try, el with
solution: |
  from contextlib import contextmanager


  class BovedaVacia(Exception):
      """Una bóveda que debía tener una pieza estaba vacía."""


  def ir_a(columna):
      """Camina por el pasillo hasta quedar encima de esa puerta, mirando al este."""
      robot.avanzar(columna - robot.posicion.x)


  @contextmanager
  def boveda_abierta():
      robot.girar_derecha()
      robot.abrir_puerta()
      robot.avanzar(2)
      try:
          yield
      finally:
          robot.girar_derecha()
          robot.girar_derecha()
          robot.avanzar(2)
          robot.cerrar_puerta()
          robot.girar_derecha()


  faltantes = []
  for columna in bovedas:
      ir_a(columna)
      try:
          with boveda_abierta():
              if robot.tomar() is None:
                  raise BovedaVacia(columna)
      except BovedaVacia:
          faltantes.append(columna)
hints:
  - "Mirando al este, `girar_derecha()` te deja mirando al sur, hacia la puerta. Al volver al pasillo miras al norte: otro `girar_derecha()` te deja mirando al este."
  - "Pon lo de salida en el `finally` de un `try:` que envuelva el `yield`. Si no, el `raise BovedaVacia` salta por encima y Quilla se queda encerrada con la puerta abierta."
world:
  theme: barranco
  level: 3
  dir: E
  api: [move, cargo, openDoor, closeDoor]
  items: { a: sol de 1863, b: llama de 1866, c: medio sol de 1864, d: peseta de 1880 }
  map: |
    ############
    #R.........#
    ###P###P#P##
    ###a###.#b##
    ############
globals:
  bovedas: [3, 7, 9]
scenarios:
  - tests:
      - name: saca el sol y la llama
        state: 'w.inventory == ["sol de 1863", "llama de 1866"]'
      - name: anota la bóveda vacía
        expect: faltantes == [7]
  - map: |
      #############
      #R..........#
      ##P#P###P#P##
      ##c#.###a#b##
      #############
    globals:
      bovedas: [2, 4, 8, 10]
    tests:
      - name: saca las tres piezas en orden
        state: 'w.inventory == ["medio sol de 1864", "sol de 1863", "llama de 1866"]'
      - name: anota la bóveda vacía
        expect: faltantes == [4]
  - map: |
      ############
      #R.........#
      ####P#P#P###
      ####.#.#d###
      ############
    globals:
      bovedas: [4, 6, 8]
    tests:
      - name: saca la peseta
        state: 'w.inventory == ["peseta de 1880"]'
      - name: anota las dos bóvedas vacías seguidas
        expect: faltantes == [4, 6]
tests:
  - name: todas las puertas quedan cerradas
    state: w.open_doors == 0
    msg: Alguna bóveda quedó abierta. ¿El cierre está en un finally, para que corra aunque haya un BovedaVacia?
  - name: termina en el pasillo mirando al este
    state: 'w.y == 1 and w.dir == "E"'
  - name: sin chocar
    state: not w.crashed
  - name: usa un administrador de contexto
    source: '@contextmanager|def\s+__enter__'
  - name: entra con with boveda_abierta()
    source: '\bwith\s+boveda_abierta\s*\('
  - name: el cierre no depende de que todo salga bien
    source: '\bfinally\s*:|def\s+__exit__'
```

## Reto experto

```exercise
id: py13-reto-serie
type: challenge
title: La serie de años
visual:
  figure:
    title: Serie(1860, 1931, 10), como un range hecho a mano
    input: { label: Serie(1860, 1931, 10), cells: ["1860", "1870", "1880", "1890", "1900", "1910", "1920", "1930"] }
    arrow: "len, [i], [a:b:c], in, ==, hash"
    output: { label: "serie[2:6:2]", cells: ["1880", "1900"] }
prompt: |
  **Escribe la clase `Serie(inicio, fin, paso)`, que se porta como `range` (con `paso` positivo) sin usar `range` ni guardar los números en una lista.** Para quien ya programa.

  Hortensia cataloga sus monedas por series de años: de 1860 a 1930, de 10 en 10. Una `Serie` debe:

  - dar su largo con `len` y ser falsa si está vacía (`Serie(5, 1, 2)` lo está);
  - responder `serie[i]` con índices negativos, y lanzar `IndexError` fuera de rango;
  - responder `serie[a:b:c]` (con `c` positivo o sin `c`) con **otra `Serie`**;
  - recorrerse con `for` y responder `x in serie` **sin recorrerla** (`10**12 in Serie(0, 10**13, 2)` tiene que ser instantáneo);
  - ser igual a otra si tiene los mismos números (`Serie(1, 2, 5) == Serie(1, 3, 7)`, las dos son solo `1`), con el mismo `hash` en ese caso.

  `slice.indices(n)` convierte una rebanada en `(inicio, fin, paso)` para una secuencia de largo `n`.
starter: |
  class Serie:
      def __init__(self, inicio, fin, paso=1):
          self.inicio = inicio
          self.fin = fin
          self.paso = paso


  serie = Serie(1860, 1931, 10)
  print(len(serie), serie[-1], 1900 in serie, list(serie[2:6:2]))
solution: |
  class Serie:
      def __init__(self, inicio, fin, paso=1):
          self.inicio = inicio
          self.fin = fin
          self.paso = paso

      def __len__(self):
          return max(0, (self.fin - self.inicio + self.paso - 1) // self.paso)

      def __getitem__(self, i):
          if isinstance(i, slice):
              desde, hasta, salto = i.indices(len(self))
              cuantos = max(0, (hasta - desde + salto - 1) // salto)
              primero = self.inicio + desde * self.paso
              return Serie(primero, primero + cuantos * salto * self.paso, salto * self.paso)
          if i < 0:
              i += len(self)
          if not 0 <= i < len(self):
              raise IndexError("fuera de la serie")
          return self.inicio + i * self.paso

      def __iter__(self):
          actual = self.inicio
          while actual < self.fin:
              yield actual
              actual += self.paso

      def __contains__(self, x):
          return self.inicio <= x < self.fin and (x - self.inicio) % self.paso == 0

      def _clave(self):
          largo = len(self)
          if largo == 0:
              return (0,)
          if largo == 1:
              return (1, self.inicio)
          return (largo, self.inicio, self.paso)

      def __eq__(self, otra):
          return self._clave() == otra._clave()

      def __hash__(self):
          return hash(self._clave())


  serie = Serie(1860, 1931, 10)
  print(len(serie), serie[-1], 1900 in serie, list(serie[2:6:2]))
hints:
  - "El largo es cuántos pasos caben: `max(0, (fin - inicio + paso - 1) // paso)`. Con eso, `serie[i]` es `inicio + i * paso`."
  - "Dos series son iguales si tienen el mismo largo y, cuando no están vacías, el mismo primero y (si tienen más de uno) el mismo paso. Usa esa misma tupla para `__hash__`."
tests:
  - name: se recorre como range
    expect: list(Serie(1860, 1931, 10)) == list(range(1860, 1931, 10))
  - name: len
    expect: len(Serie(1860, 1931, 10)) == 8 and len(Serie(0, 10, 3)) == 4
  - name: vacía es falsa
    expect: not Serie(5, 1, 2) and not Serie(5, 5) and Serie(5, 6)
  - name: índices, también negativos
    expect: Serie(1860, 1931, 10)[0] == 1860 and Serie(1860, 1931, 10)[-1] == 1930 and Serie(1860, 1931, 10)[-8] == 1860
  - name: fuera de rango es IndexError
    expect: 'len(list(__import__("itertools").islice(type("Vista", (), {"__getitem__": lambda self, i: Serie(0, 8)[i]})(), 20))) == 8'
    msg: "Con un índice fuera de rango, lanza IndexError: así es como for, list e in saben dónde termina una secuencia."
  - name: in sin recorrer
    expect: 1900 in Serie(1860, 1931, 10) and 1905 not in Serie(1860, 1931, 10) and 1940 not in Serie(1860, 1931, 10) and 10**12 in Serie(0, 10**13, 2)
  - name: una rebanada es otra Serie
    expect: type(Serie(0, 10)[1:3]) == Serie
  - name: rebanadas como las de range
    expect: 'all(list(Serie(3, 50, 4)[a:b:c]) == list(range(3, 50, 4)[a:b:c]) for a in [None, 0, 2, -3, 20] for b in [None, 5, -1, 40] for c in [None, 1, 2, 5])'
  - name: igualdad por los números
    expect: Serie(1, 2, 5) == Serie(1, 3, 7) and Serie(0, 0) == Serie(5, 5, 2) and Serie(0, 10, 2) != Serie(0, 10, 3)
  - name: iguales tienen el mismo hash
    expect: hash(Serie(1, 2, 5)) == hash(Serie(1, 3, 7)) and hash(Serie(0, 9, 3)) == hash(Serie(0, 7, 3)) and len({Serie(0, 0), Serie(4, 2)}) == 1
  - name: sin range
    sourceNot: '\brange\s*\('
```
