# Sesión 16 — Errores y excepciones

## El encargo

Paita, Piura, cinco de la tarde. En el almacén aduanero del puerto se apilan contenedores de mango, pota congelada, conchas de abanico y café de Jaén esperando su barco. Don **Eleodoro Querevalú**, jefe del almacén desde que los papeles eran de carbón, tiene un problema: el programa que lee los manifiestos nunca se cae. Nunca. Y eso, le explicó Maru por teléfono, es justamente lo malo.

Alguien le puso un `except: pass` "para que no moleste", y desde entonces cada línea rara desaparece sin dejar rastro: un peso mal tipeado, un producto que no está en la tarifa, un contenedor entero. Maru mandó a Quilla, con su sirena recién calibrada, a hacer las cosas bien: que los errores **se vean**, que cada uno tenga su nombre y que el programa sepa cuáles puede arreglar y cuáles no.

```escena
theme: barranco
level: 2
dir: E
items: { c: contenedor }
caption: El muelle del almacén de Paita. Quilla pesa cada contenedor con la grúa (a veces ocupada) y lleva la lista de liberados a la oficina (D).
map: |
  ##############
  #R..........D#
  ###c##c##c####
  ##############
program: |
  robot.avanzar(2)
  robot.decir("MSKU-4410: 18400 kg")
  robot.avanzar(3)
  robot.decir("Grúa ocupada… otra vez")
  robot.decir("HLXU-7702: 21000 kg")
  robot.avanzar(6)
  robot.entregar("Liberados: MSKU-4410, HLXU-7702")
```

## Lo mínimo

Cuando algo sale mal, Python **lanza una excepción**: un objeto con un tipo (`ValueError`, `KeyError`…) y un mensaje. Si nadie la atrapa, el programa se detiene. Con **`try` / `except`** la atrapas y decides qué hacer:

```py run
for texto in ["18400", "12,5"]:
    try:
        kilos = int(texto)
    except ValueError as error:
        print("observado:", error)
    else:
        print("pesado:", kilos)
    finally:
        print("balanza libre")
```

- **`try`**: el código que puede fallar. Mantenlo corto: solo lo que de verdad puede lanzar.
- **`except Tipo as error`**: corre si lo de arriba lanzó ese tipo (o uno que **hereda** de él). Varios tipos van en una tupla: `except (ValueError, KeyError):`.
- **`else`**: corre solo si **no** hubo error. **`finally`**: corre **siempre**, haya error, `return` o lo que sea: el lugar para soltar la grúa o cerrar el portón.

Mira el salto: cuando `int` falla dentro de `kilos`, la función se corta en esa línea, su caja sale de la pila y el programa aterriza en el `except` de quien la llamó.

```anima
title: Una excepción salta hasta el except
code: |
  def kilos(texto):
      return int(texto)

  lecturas = ["18400", "12,5", "9000"]
  total = 0
  for texto in lecturas:
      try:
          total += kilos(texto)
      except ValueError:
          print("observado:", texto)
  print(total)
cells: { of: lecturas, at: texto }
notes:
  2: "Con \"12,5\", int lanza ValueError aquí mismo: no hay return."
  9: "El error subió desde kilos y lo atrapa este except. El bucle sigue con la siguiente lectura."
  11: "Se sumaron solo las dos lecturas buenas."
```

Una excepción no se queda donde nace: **sale de la llamada y sube**, llamada por llamada, hasta que alguien la atrapa. Mira cómo cruza tres llamadas hasta el `try` de `principal`, y qué pasa si no hay ninguno:

```anima
title: Una excepción cruza varias llamadas hasta encontrar un except
code: |
  def leer(text):
      return int(text)

  def pesar(text):
      return leer(text) * 2

  def principal():
      try:
          print(pesar("12,5"))
      except ValueError as error:
          print("observado:", error)

  principal()
steps:
  - { line: 13, vars: {}, stack: [{ name: principal, args: '' }], note: "`principal` empieza. Tiene un `try`: una excepción lanzada más abajo puede ser atrapada aquí." }
  - { line: 9, vars: {}, stack: [{ name: principal, args: '' }, { name: pesar, args: 'text = "12,5"' }], note: "`principal` llama a `pesar`: dos llamadas apiladas." }
  - { line: 5, vars: {}, stack: [{ name: principal, args: '' }, { name: pesar, args: 'text = "12,5"' }, { name: leer, args: 'text = "12,5"' }], note: "`pesar` llama a `leer`: ya son tres. La de arriba es la que corre." }
  - { line: 2, vars: {}, stack: [{ name: principal, args: '' }, { name: pesar, args: 'text = "12,5"' }, { name: leer, args: 'text = "12,5"', err: 'ValueError' }], note: "`int('12,5')` lanza `ValueError`: la llamada a `leer` se corta aquí, sin llegar a devolver nada. Busca un `except` en la misma función: no hay." }
  - { line: 5, vars: {}, stack: [{ name: principal, args: '' }, { name: pesar, args: 'text = "12,5"', err: 'sigue subiendo' }], note: "Sin `except`, la excepción **sale de la llamada** y sube a quien la hizo: `pesar`. Ahí tampoco hay `except`: su `* 2` nunca corre y también se corta." }
  - { line: 10, vars: { error: "ValueError: invalid literal for int() with base 10: '12,5'" }, stack: [{ name: principal, args: '' }], note: "Al subir a `principal`, la excepción encuentra el `try`: salta directo al `except ValueError`. `pesar` y `leer` ya no existen." }
  - { line: 11, vars: { error: "ValueError: invalid literal for int() with base 10: '12,5'" }, stack: [{ name: principal, args: '' }], out: "observado: invalid literal for int() with base 10: '12,5'", note: "El `except` la maneja y el programa sigue con normalidad." }
```

```anima
title: Sin except, la excepción llega hasta arriba y el programa se detiene
code: |
  def leer(text):
      return int(text)

  def pesar(text):
      return leer(text) * 2

  print(pesar("12,5"))
  print("esto nunca sale")
steps:
  - { line: 7, vars: {}, stack: [{ name: pesar, args: 'text = "12,5"' }, { name: leer, args: 'text = "12,5"' }], note: "Las mismas llamadas, pero esta vez nadie las rodea con un `try`." }
  - { line: 2, vars: {}, stack: [{ name: pesar, args: 'text = "12,5"' }, { name: leer, args: 'text = "12,5"', err: 'ValueError' }], note: "`int('12,5')` lanza `ValueError`." }
  - { line: 5, vars: {}, stack: [{ name: pesar, args: 'text = "12,5"', err: 'sigue subiendo' }], note: "Sube a `pesar`, que tampoco la atrapa." }
  - { line: 7, vars: {}, stack: [], out: "Traceback (most recent call last):\n  File \"program.py\", line 7, in <module>\n  File \"program.py\", line 5, in pesar\n  File \"program.py\", line 2, in leer\nValueError: invalid literal for int() with base 10: '12,5'", note: "La pila se vació sin encontrar un `except`: el programa **se detiene** y el traceback lista las llamadas por las que pasó la excepción, de la primera a la última. La línea 8 nunca corre." }
```

**Lanzar tus propios errores.** `raise ValueError("mensaje")` detiene la función y avisa a quien la llamó. Para errores de tu negocio, crea una **jerarquía** de clases que heredan de `Exception`: así un `except` puede atrapar uno solo o toda una familia.

```py run
class ErrorAduana(Exception):
    """Cualquier problema de un contenedor."""

class PrecintoRoto(ErrorAduana):
    """El sello del contenedor no está intacto."""

try:
    raise PrecintoRoto("MSKU-4410")
except ErrorAduana as error:
    print(type(error).__name__, error, isinstance(error, PrecintoRoto))
```

**`raise … from`.** Cuando traduces un error técnico a uno de tu negocio, encadénalos: `raise SinManifiesto(codigo) from error` guarda el `KeyError` original en `__cause__`, y el traceback muestra los dos.

**Pedir perdón o pedir permiso.** *LBYL* (mira antes de saltar) pregunta primero: `if codigo in manifiestos:`. *EAFP* (es más fácil pedir perdón) lo intenta y atrapa el error: `try: manifiestos[codigo]` / `except KeyError:`. En Python se prefiere EAFP cuando el caso raro es raro, porque no repite la búsqueda y no se le escapa nada entre la pregunta y el uso. Para el robot es al revés: sus errores (chocar con una pared, quedarse sin batería) **no son `Exception`**, ni `except Exception` los esconde, y un choque es un choque. Ahí mira antes con `robot.hay_pared()`.

**`assert condicion, "mensaje"`** comprueba algo que **tu propio código** garantiza (`assert total >= 0`); si falla, es un bug tuyo y lanza `AssertionError`. No valida datos de afuera: Python puede ejecutarse con los `assert` apagados.

**Muchos errores a la vez.** Para no detenerte en el primero, júntalos en un **`ExceptionGroup`** y atiéndelos con **`except*`**: cada `except*` recibe un grupo con los de su tipo, y pueden correr varios.

```py run
try:
    raise ExceptionGroup("HLXU-7702", [ValueError("kilos"), KeyError("pota"), ValueError("fecha")])
except* ValueError as grupo:
    print("valores malos:", len(grupo.exceptions))
except* KeyError as grupo:
    print("claves que faltan:", grupo.exceptions)
```

> **Trampa común:** `except:` solo, o `except Exception: pass`, atrapa **todo**: el peso mal tipeado que esperabas, pero también tu `NameError` por un nombre mal escrito, tu `KeyError` por un producto que nadie registró, cualquier bug. El programa "no se cae" y nadie se entera de lo que pasó. Atrapa solo los tipos que sabes manejar, y si atrapas algo, **déjalo anotado**.

<!-- legacy: exception-as -->

<!-- legacy: raise-from -->

<!-- mdn: exception-as raise-from except-star -->

## Práctica

```exercise
id: py16-predice-finally
type: predict
title: La balanza que siempre se suelta
prompt: |
  `pesar` tiene `try`, `except`, `else` y `finally`, y dos de ellos hacen `return`. Antes de ejecutarlo: ¿qué imprime?
code: |
  def pesar(texto):
      try:
          kilos = int(texto)
      except ValueError:
          print("observado")
          return 0
      else:
          print("pesado")
          return kilos
      finally:
          print("balanza libre")

  print(pesar("18400") + pesar("12,5"))
options:
  - "pesado\nbalanza libre\nobservado\nbalanza libre\n18400"
  - "pesado\nobservado\n18400"
  - "pesado\nbalanza libre\nobservado\n18400"
  - "pesado\nobservado\nbalanza libre\n18400"
answer: "pesado\nbalanza libre\nobservado\nbalanza libre\n18400"
explain: |
  Cada llamada pasa por su `finally`, aunque ya haya un `return` en camino: el `return` espera a que `finally` termine. La primera llamada imprime `pesado` (no hubo error, corre `else`), la segunda `observado`, y las dos sueltan la balanza. Al final se suma `18400 + 0`.
```

```exercise
id: py16-predice-jerarquia
type: predict
title: El except que llegó primero
prompt: |
  `PrecintoRoto` hereda de `ErrorAduana`. Python prueba los `except` de arriba hacia abajo y entra en el **primero** que calza. ¿Qué imprime?
visual:
  figure:
    panes:
      - { label: la familia, table: { head: ["clase", "hereda de"], rows: [["ErrorAduana", "Exception"], ["PrecintoRoto", "ErrorAduana"]] } }
code: |
  class ErrorAduana(Exception):
      pass

  class PrecintoRoto(ErrorAduana):
      pass

  def revisar(precinto):
      if precinto != "intacto":
          raise PrecintoRoto(precinto)
      return "ok"

  for precinto in ["intacto", "cortado"]:
      try:
          print(revisar(precinto))
      except ErrorAduana:
          print("aduana")
      except PrecintoRoto:
          print("precinto")
options:
  - "ok\naduana"
  - "ok\nprecinto"
  - "ok\naduana\nprecinto"
  - "aduana\nprecinto"
answer: "ok\naduana"
explain: |
  Un `PrecintoRoto` **también es** un `ErrorAduana`, así que el primer `except` lo atrapa y el segundo no llega a correr nunca. Pon siempre los tipos más específicos arriba y la familia completa abajo.
```

```exercise
id: py16-completa-manifiesto
type: complete
title: El contenedor sin manifiesto
prompt: |
  `kilos_declarados(codigo)` busca el peso en el diccionario de manifiestos al estilo EAFP: lo intenta y, si la clave no está, traduce el `KeyError` a un error del almacén, **encadenado** con `from` para no perder la causa. Completa los `___`.
starter: |
  class ErrorAduana(Exception):
      """Cualquier problema de un contenedor."""

  class SinManifiesto(___):
      """El contenedor no tiene manifiesto."""

  manifiestos = {"MSKU-4410": 18400, "HLXU-7702": 21000}

  def kilos_declarados(codigo):
      try:
          return manifiestos[codigo]
      except ___ as error:
          ___ SinManifiesto(f"{codigo} no tiene manifiesto") ___ error

  try:
      kilos_declarados("SUDU-5150")
  except ErrorAduana as error:
      print("Retenido:", error, "| causa:", repr(error.__cause__))
solution: |
  class ErrorAduana(Exception):
      """Cualquier problema de un contenedor."""

  class SinManifiesto(ErrorAduana):
      """El contenedor no tiene manifiesto."""

  manifiestos = {"MSKU-4410": 18400, "HLXU-7702": 21000}

  def kilos_declarados(codigo):
      try:
          return manifiestos[codigo]
      except KeyError as error:
          raise SinManifiesto(f"{codigo} no tiene manifiesto") from error

  try:
      kilos_declarados("SUDU-5150")
  except ErrorAduana as error:
      print("Retenido:", error, "| causa:", repr(error.__cause__))
hints:
  - "`SinManifiesto` es parte de la familia `ErrorAduana`. Un diccionario sin la clave lanza `KeyError`."
  - "La línea completa es `raise SinManifiesto(...) from error`."
tests:
  - name: imprime el error y su causa
    output: "Retenido: SUDU-5150 no tiene manifiesto | causa: KeyError('SUDU-5150')"
  - name: SinManifiesto es un ErrorAduana
    expect: issubclass(SinManifiesto, ErrorAduana)
  - name: un código con manifiesto devuelve sus kilos
    run: kilos_declarados("MSKU-4410")
    equals: 18400
  - name: encadena con from
    source: 'raise\s+SinManifiesto\([\s\S]*\)\s*from\s+error'
```

```exercise
id: py16-arregla-porton
type: fix
title: El portón que quedó abierto
prompt: |
  `pasar_camion` abre el portón, anota el peso del camión y cierra. Cuando el peso viene mal escrito, `int` lanza `ValueError`, el programa de afuera lo atrapa… y el portón se queda **abierto** toda la noche. Ejecútalo.

  Arréglalo **dentro de `pasar_camion`**: el portón se cierra siempre, haya error o no, y el error **sigue subiendo** hasta el `except` de afuera (no lo atrapes dentro).
visual:
  figure:
    panes:
      - { label: camiones, table: { head: ["placa", "kilos"], rows: [["P1A-234", "\"28000\""], ["T2B-871", "\"31000\""], ["M4D-502", "\"veinte mil\""]] } }
      - { label: debe quedar, value: "Portón cerrado" }
starter: |
  porton = {"estado": "cerrado"}
  registro = []

  def pasar_camion(placa, kilos_texto):
      porton["estado"] = "abierto"
      registro.append((placa, int(kilos_texto)))
      porton["estado"] = "cerrado"

  for placa, kilos in [("P1A-234", "28000"), ("T2B-871", "31000"), ("M4D-502", "veinte mil")]:
      try:
          pasar_camion(placa, kilos)
      except ValueError:
          print("Observado:", placa)
  print("Portón", porton["estado"])
solution: |
  porton = {"estado": "cerrado"}
  registro = []

  def pasar_camion(placa, kilos_texto):
      porton["estado"] = "abierto"
      try:
          registro.append((placa, int(kilos_texto)))
      finally:
          porton["estado"] = "cerrado"

  for placa, kilos in [("P1A-234", "28000"), ("T2B-871", "31000"), ("M4D-502", "veinte mil")]:
      try:
          pasar_camion(placa, kilos)
      except ValueError:
          print("Observado:", placa)
  print("Portón", porton["estado"])
hints:
  - Cuando `int` falla, la línea que cierra el portón nunca llega a correr.
  - "`try:` alrededor del `registro.append(...)` y `finally:` con la línea que cierra. Sin `except`: el error tiene que seguir subiendo."
tests:
  - name: el camión observado y el portón cerrado
    output: "Observado: M4D-502\nPortón cerrado"
  - name: se registraron los dos camiones buenos
    expect: 'registro == [("P1A-234", 28000), ("T2B-871", 31000)]'
  - name: usa finally
    source: '\bfinally\s*:'
  - name: no atrapa el error dentro de pasar_camion
    sourceNot: 'def\s+pasar_camion[\s\S]*?except[\s\S]*?\nfor\b'
    msg: Deja que el ValueError suba; el except de afuera es el que lo anota.
```

```exercise
id: py16-escribe-precinto
type: write
title: El precinto bien escrito
prompt: |
  Cada contenedor viaja con un precinto numerado. Escribe:

  - `class ErrorAduana(Exception)` y `class PrecintoInvalido(ErrorAduana)`, cada una con su docstring;
  - `validar_precinto(texto)`: quita los espacios de los bordes y pasa a mayúsculas; si el resultado es `"PE-"` seguido de **exactamente 6 dígitos**, lo devuelve; si no, **lanza** `PrecintoInvalido` con el texto original como mensaje.

  `probar` ya está escrita: devuelve el precinto, o el nombre del error que lanzaste.
visual:
  figure:
    panes:
      - { label: entra, cells: ["\" pe-004512 \"", "\"PE-12\"", "\"XX-004512\""] }
      - { label: probar devuelve, cells: ["\"PE-004512\"", "\"PrecintoInvalido\"", "\"PrecintoInvalido\""] }
starter: |
  # escribe aquí ErrorAduana, PrecintoInvalido y validar_precinto


  def probar(texto):
      """El precinto validado, o el nombre del error que lanzó."""
      try:
          return validar_precinto(texto)
      except ErrorAduana as error:
          return type(error).__name__

  print(probar(" pe-004512 "), probar("PE-12"))
solution: |
  class ErrorAduana(Exception):
      """Cualquier problema de un contenedor."""

  class PrecintoInvalido(ErrorAduana):
      """El precinto no tiene la forma PE-123456."""

  def validar_precinto(texto):
      precinto = texto.strip().upper()
      numero = precinto[3:]
      if not precinto.startswith("PE-") or len(numero) != 6 or not numero.isdigit():
          raise PrecintoInvalido(texto)
      return precinto


  def probar(texto):
      """El precinto validado, o el nombre del error que lanzó."""
      try:
          return validar_precinto(texto)
      except ErrorAduana as error:
          return type(error).__name__

  print(probar(" pe-004512 "), probar("PE-12"))
hints:
  - "`precinto[3:]` es lo que viene después de `PE-`; `.isdigit()` dice si son todos dígitos."
  - "Si algo no calza: `raise PrecintoInvalido(texto)`. Si todo calza, `return precinto`."
tests:
  - name: limpia y devuelve un precinto bueno
    run: probar(" pe-004512 ")
    equals: PE-004512
  - name: muy corto
    run: probar("PE-12")
    equals: PrecintoInvalido
  - name: otro prefijo
    run: probar("XX-004512")
    equals: PrecintoInvalido
  - name: letras donde van dígitos
    run: probar("PE-00451A")
    equals: PrecintoInvalido
  - name: siete dígitos
    run: probar("PE-0045123")
    equals: PrecintoInvalido
  - name: el mensaje es el texto original
    expect: 'str(PrecintoInvalido("pe-1")) == "pe-1" and issubclass(PrecintoInvalido, ErrorAduana)'
  - name: lanza el error con raise
    source: 'raise\s+PrecintoInvalido\('
```

```exercise
id: py16-predice-grupo
type: predict
title: Tres problemas en un solo contenedor
prompt: |
  La inspección del contenedor HLXU-7702 no se detuvo en el primer problema: los juntó todos en un `ExceptionGroup`. ¿Qué imprime?
code: |
  errores = [ValueError("kilos"), KeyError("pota"), ValueError("fecha")]
  try:
      raise ExceptionGroup("HLXU-7702", errores)
  except* KeyError as grupo:
      print("claves:", len(grupo.exceptions))
  except* ValueError as grupo:
      print("valores:", len(grupo.exceptions))
  print("listo")
options:
  - "claves: 1\nvalores: 2\nlisto"
  - "claves: 1\nlisto"
  - "valores: 2\nclaves: 1\nlisto"
  - "claves: 3\nlisto"
answer: "claves: 1\nvalores: 2\nlisto"
explain: |
  A diferencia de `except`, **cada** `except*` que calza corre, en el orden en que están escritos: el primero se lleva el `KeyError`, el segundo los dos `ValueError`. Como no quedó ningún error sin atender, el programa sigue y llega a `listo`.
```

## El caso

```exercise
id: py16-caso-escondido
type: case
title: El error que alguien escondió
prompt: |
  **Recalcula cuántas líneas con error de tipeo tuvo cada digitador, atrapando solo `ValueError`, y encuentra el contenedor que el `except: pass` hizo desaparecer.**

  Cada línea de manifiesto es `codigo;producto;kilos`. El programa viejo hacía esto con cada una, y Don Eleodoro descubrió que un contenedor salió del almacén sin pagar:

  ```py
  try:
      codigo, producto, kilos = linea.split(";")
      total += tarifas[producto] * int(kilos)
  except:
      pass
  ```

  Un **error de tipeo** es una línea con kilos que no son un número o con campos de menos: las dos cosas lanzan `ValueError`, y esas líneas se revisan a mano después. Cada digitador reportó cuántas tuvo su turno. Pero `except:` también se tragó otra cosa.

  Atrapa `ValueError` por un lado y el otro error por otro, e imprime una línea por digitador que empiece con su nombre, por ejemplo `print("Yovana:", len(tipeo))`.
visual:
  board:
    for: py16-caso-escondido
    task: "Errores de tipeo = líneas que lanzan ValueError. Lo que lance otra cosa no es un error de tipeo."
    cards:
      - name: Yovana
        kind: person
        role: Digitadora del turno mañana
        rows: [["Líneas", "4"], ["Reportó de tipeo", "1"]]
        clue: { find: "Yovana", says: 1 }
      - name: Wilder
        kind: person
        role: Digitador del turno tarde
        culprit: true
        rows: [["Líneas", "4"], ["Dijo", "\"dos se me fueron mal, ya las corrijo\""], ["Reportó de tipeo", "2"]]
        clue: { find: "Wilder", says: 2 }
      - name: Lucy
        kind: person
        role: Digitadora del turno noche
        rows: [["Líneas", "4"], ["Reportó de tipeo", "2"]]
        clue: { find: "Lucy", says: 2 }
      - name: La tarifa
        kind: note
        role: Céntimos por kilo
        rows: [["mango", "3"], ["limón", "2"], ["banano", "1"], ["pota", "7"], ["conchas de abanico", "15"], ["café", "9"]]
starter: |
  tarifas = {"mango": 3, "limón": 2, "banano": 1, "pota": 7, "conchas de abanico": 15, "café": 9}

  turnos = {
      "Yovana": ["MSKU-4410;mango;18400", "TGHU-2207;limón;12,5",
                 "MSKU-4413;mango;19100", "CMAU-0981;banano;20500"],
      "Wilder": ["HLXU-7702;pota;21000", "HLXU-7703;pota;2l000",
                 "SUDU-5150;langostino;22300", "HLXU-7705;conchas de abanico;8000"],
      "Lucy": ["CMAU-1120;café;15000", "CMAU-1121;café",
               "TGHU-2290;banano;20 400", "CMAU-1122;café;14800"],
  }

  # TODO: para cada digitador, recorre sus líneas con try:
  #   except ValueError  → es un error de tipeo, anótalo
  #   except KeyError    → no es de tipeo: imprímelo para verlo
  # y al final de cada turno: print("Yovana:", len(tipeo))
solution: |
  tarifas = {"mango": 3, "limón": 2, "banano": 1, "pota": 7, "conchas de abanico": 15, "café": 9}

  turnos = {
      "Yovana": ["MSKU-4410;mango;18400", "TGHU-2207;limón;12,5",
                 "MSKU-4413;mango;19100", "CMAU-0981;banano;20500"],
      "Wilder": ["HLXU-7702;pota;21000", "HLXU-7703;pota;2l000",
                 "SUDU-5150;langostino;22300", "HLXU-7705;conchas de abanico;8000"],
      "Lucy": ["CMAU-1120;café;15000", "CMAU-1121;café",
               "TGHU-2290;banano;20 400", "CMAU-1122;café;14800"],
  }

  for digitador, lineas in turnos.items():
      tipeo = []
      for linea in lineas:
          try:
              codigo, producto, kilos = linea.split(";")
              cobro = tarifas[producto] * int(kilos)
          except ValueError:
              tipeo.append(linea)
          except KeyError as error:
              print("Sin tarifa:", linea, repr(error))
      print(f"{digitador}: {len(tipeo)}")
answer: SUDU-5150
answerLabel: ¿Qué contenedor escondió el except?
reveal: |
  El SUDU-5150. Su producto, `langostino`, no está en la tarifa: `tarifas["langostino"]` lanza `KeyError`, no `ValueError`. El `except:` del programa viejo lo trató igual que un error de tipeo y lo borró del cobro, así que el contenedor salió sin pagar. Wilder lo contó entre sus "dos líneas mal tipeadas", pero de tipeo solo tuvo una, la `2l000` con ele. Con `except ValueError` por un lado y `except KeyError` por otro, el langostino aparece solito.
hints:
  - "Dentro del `try`, `codigo, producto, kilos = linea.split(\";\")` y `tarifas[producto] * int(kilos)`. Una línea con dos campos ya falla en la primera."
  - "Pon dos `except`: `ValueError` va a la lista `tipeo`; `KeyError` lo imprimes con la línea para ver de qué contenedor es."
```

## El juez

Como desde la sesión 4, el juez llama a tu función y compara lo que **devuelve**. Una excepción que se escape de tu función es un error de ejecución: aquí los errores se **devuelven como datos**.

```exercise
id: py16-juez-manifiesto
type: judge
mode: function
function: revisar_manifiesto
title: El manifiesto línea por línea
prompt: |
  **Escribe `revisar_manifiesto(lineas, tarifas)`, que devuelve `(total, errores)`: lo que se cobra por las líneas buenas, en céntimos, y la lista de líneas malas como pares `(numero_de_linea, nombre_del_error)`.**

  Cada línea es `codigo;producto;kilos` y se cobra `tarifas[producto] * kilos`. Revísala en este orden, que es justo lo que pasa si escribes el código en ese orden:

  1. `codigo, producto, kilos = linea.split(";")`: si no hay exactamente 3 campos, es `ValueError`.
  2. `tarifas[producto]`: si el producto no está, es `KeyError`.
  3. `int(kilos)`: si no es un entero, es `ValueError`; y si es 0 o negativo, **lánzalo tú**: `raise ValueError(...)`.

  Las líneas se numeran **desde 1**. Una línea mala no detiene la revisión: anota `(numero, type(error).__name__)` y sigue con la siguiente. Atrapa **solo** `ValueError` y `KeyError`.

  **Restricciones:** de 0 a 12 líneas · tarifas de 1 a 15 céntimos por kilo.
visual:
  figure:
    title: El ejemplo 1, línea por línea
    input: { label: lineas, table: { head: ["#", "línea", "pasa"], rows: [["1", "MSKU-4410;mango;18400", "18400 × 3"], ["2", "TGHU-2207;limón;12,5", "ValueError"], ["3", "SUDU-5150;langostino;300", "KeyError"], ["4", "CMAU-1120;café;-50", "ValueError (lo lanzas tú)"], ["5", "HLXU-7702;pota;1000", "1000 × 7"]] } }
    arrow: suma las buenas, anota las malas
    output: { label: devuelve, text: "(62200, [(2, \"ValueError\"), (3, \"KeyError\"), (4, \"ValueError\")])" }
starter: |
  def revisar_manifiesto(lineas, tarifas):
      return (0, [])
solution: |
  def cobrar_linea(linea, tarifas):
      """Lo que se cobra por una línea; lanza ValueError o KeyError si está mala."""
      codigo, producto, kilos = linea.split(";")
      tarifa = tarifas[producto]
      kilos = int(kilos)
      if kilos <= 0:
          raise ValueError(f"{codigo}: {kilos} kilos")
      return tarifa * kilos


  def revisar_manifiesto(lineas, tarifas):
      total = 0
      errores = []
      for numero, linea in enumerate(lineas, start=1):
          try:
              total += cobrar_linea(linea, tarifas)
          except (ValueError, KeyError) as error:
              errores.append((numero, type(error).__name__))
      return (total, errores)
hints:
  - "Escribe una ayudante `cobrar_linea(linea, tarifas)` que haga los tres pasos y lance; `revisar_manifiesto` solo la llama dentro de un `try`."
  - "`for numero, linea in enumerate(lineas, start=1):` te da el número de línea desde 1."
samples:
  - args: [["MSKU-4410;mango;18400", "TGHU-2207;limón;12,5", "SUDU-5150;langostino;300", "CMAU-1120;café;-50", "HLXU-7702;pota;1000"], { mango: 3, "limón": 2, "café": 9, pota: 7 }]
    returns: [62200, [[2, ValueError], [3, KeyError], [4, ValueError]]]
    note: El dibujo de arriba.
  - args: [["CMAU-1121;café", "CMAU-1122;café;100;extra"], { "café": 9 }]
    returns: [0, [[1, ValueError], [2, ValueError]]]
    note: Con campos de menos o de más, el desempaque lanza ValueError.
edge:
  - args: [[], { mango: 3 }]
    tag: sin líneas
  - args: [["MSKU-1000;mango;0"], { mango: 3 }]
    tag: con kilos en cero
  - args: [["MSKU-1000;uva;12,5"], { mango: 3 }]
    tag: con producto desconocido y kilos mal escritos en la misma línea
  - args: [["MSKU-1000;mango;10", "MSKU-1001;uva;10", "MSKU-1002;mango;x", "MSKU-1003;mango;20"], { mango: 3 }]
    tag: con líneas buenas después de las malas
  - args: [["A;mango;1", "B;mango;1", "C;mango;1"], { mango: 15 }]
    tag: con todas las líneas buenas
  - args: [["A;mango", "B;limón;", "C;café;-1", "D;pota;1.5"], { mango: 3, "limón": 2, "café": 9, pota: 7 }]
    tag: con todas las líneas malas
random:
  count: 40
  seed: 1616
  generate: |
    productos = ["mango", "limón", "pota", "banano", "café", "langostino", "uva"]
    tarifas = {"mango": 3, "limón": 2, "pota": 7, "banano": 1, "café": 9}
    lineas = []
    for _ in range(rng.int(0, 12)):
        bueno = str(rng.int(1, 30000))
        kilos = rng.pick([bueno, bueno, bueno, bueno, "0", f"-{rng.int(1, 900)}", "12,5", "2l000", ""])
        partes = [f"MSKU-{rng.int(1000, 9999)}", rng.pick(productos), kilos]
        forma = rng.int(0, 9)
        if forma == 0:
            partes = partes[:2]
        elif forma == 1:
            partes.append("extra")
        lineas.append(";".join(partes))
    return [lineas, tarifas]
wrong:
  - |
    def revisar_manifiesto(lineas, tarifas):
        total = 0
        for numero, linea in enumerate(lineas, start=1):
            try:
                codigo, producto, kilos = linea.split(";")
                kilos = int(kilos)
                if kilos <= 0:
                    raise ValueError(codigo)
                total += tarifas[producto] * kilos
            except (ValueError, KeyError) as error:
                return (total, [(numero, type(error).__name__)])
        return (total, [])
  - |
    def revisar_manifiesto(lineas, tarifas):
        total = 0
        errores = []
        for numero, linea in enumerate(lineas, start=1):
            try:
                codigo, producto, kilos = linea.split(";")
                tarifa = tarifas[producto]
                kilos = int(kilos)
                if kilos <= 0:
                    raise ValueError(codigo)
                total += tarifa * kilos
            except Exception:
                errores.append((numero, "ValueError"))
        return (total, errores)
  - |
    def revisar_manifiesto(lineas, tarifas):
        total = 0
        errores = []
        for numero, linea in enumerate(lineas, start=1):
            try:
                codigo, producto, kilos = linea.split(";")
                kilos = int(kilos)
                if kilos <= 0:
                    raise ValueError(codigo)
                total += tarifas[producto] * kilos
            except (ValueError, KeyError) as error:
                errores.append((numero, type(error).__name__))
        return (total, errores)
```

```exercise
id: py16-juez-despacho
type: judge
mode: function
function: despachar
title: Liberar, retener o rechazar
prompt: |
  **Escribe `despachar(contenedores)`, que reparte los códigos en tres listas, `[liberados, retenidos, rechazados]`, usando una familia de excepciones propia.**

  Cada contenedor es `[codigo, kilos_declarados, kilos_balanza, precinto_intacto]`. Escribe `inspeccionar(contenedor)`, que devuelve el código si todo está bien y **lanza** si no, revisando en este orden:

  1. El código debe ser 4 letras mayúsculas, un guion y 4 dígitos (`MSKU-4410`); si no, `CodigoInvalido`.
  2. Si el precinto no está intacto, `PrecintoRoto`.
  3. Si la balanza se aleja de lo declarado **más del 5 %** (`abs(balanza - declarado) * 100 > declarado * 5`), `DiferenciaDePeso`.

  La familia: `ErrorAduana` es la base; `ErrorDocumento` (de él hereda `CodigoInvalido`) significa **rechazar**, y `ErrorCarga` (de él heredan `PrecintoRoto` y `DiferenciaDePeso`) significa **retener**. `despachar` atrapa `ErrorCarga` y `ErrorDocumento` por separado; cada lista conserva el orden de llegada.

  `re.fullmatch(r"[A-Z]{4}-\d{4}", codigo)` revisa el código (con `import re` arriba).

  **Restricciones:** de 0 a 10 contenedores · kilos declarados de 1000 a 30000.
visual:
  figure:
    title: La familia y el ejemplo 1
    panes:
      - label: la familia
        table: { head: ["clase", "hereda de", "qué hace despachar"], rows: [["ErrorAduana", "Exception", "—"], ["ErrorDocumento", "ErrorAduana", "rechaza"], ["CodigoInvalido", "ErrorDocumento", "rechaza"], ["ErrorCarga", "ErrorAduana", "retiene"], ["PrecintoRoto", "ErrorCarga", "retiene"], ["DiferenciaDePeso", "ErrorCarga", "retiene"]] }
      - label: ejemplo 1
        table: { head: ["contenedor", "pasa"], rows: [["MSKU-4410, 18400, 18900, sí", "liberado (2.7 %)"], ["HLXU-7702, 21000, 21000, no", "PrecintoRoto → retenido"], ["msku-4413, 19100, 19100, sí", "CodigoInvalido → rechazado"], ["CMAU-1120, 15000, 16000, sí", "DiferenciaDePeso (6.7 %) → retenido"]] }
starter: |
  import re


  def despachar(contenedores):
      return [[], [], []]
solution: |
  import re


  class ErrorAduana(Exception):
      """Cualquier problema de un contenedor."""

  class ErrorDocumento(ErrorAduana):
      """Los papeles están mal: el contenedor se rechaza."""

  class ErrorCarga(ErrorAduana):
      """La carga no cuadra: el contenedor se retiene."""

  class CodigoInvalido(ErrorDocumento): pass
  class PrecintoRoto(ErrorCarga): pass
  class DiferenciaDePeso(ErrorCarga): pass


  def inspeccionar(contenedor):
      codigo, declarado, balanza, precinto = contenedor
      if not re.fullmatch(r"[A-Z]{4}-\d{4}", codigo):
          raise CodigoInvalido(codigo)
      if not precinto:
          raise PrecintoRoto(codigo)
      if abs(balanza - declarado) * 100 > declarado * 5:
          raise DiferenciaDePeso(f"{codigo}: {declarado} declarados, {balanza} en balanza")
      return codigo


  def despachar(contenedores):
      liberados, retenidos, rechazados = [], [], []
      for contenedor in contenedores:
          try:
              codigo = inspeccionar(contenedor)
          except ErrorCarga:
              retenidos.append(contenedor[0])
          except ErrorDocumento:
              rechazados.append(contenedor[0])
          else:
              liberados.append(codigo)
      return [liberados, retenidos, rechazados]
hints:
  - "Seis clases cortas: `class PrecintoRoto(ErrorCarga): pass` basta."
  - "En `despachar`: `try: codigo = inspeccionar(contenedor)`, un `except` por familia y `else: liberados.append(codigo)`."
samples:
  - args: [[["MSKU-4410", 18400, 18900, true], ["HLXU-7702", 21000, 21000, false], ["msku-4413", 19100, 19100, true], ["CMAU-1120", 15000, 16000, true]]]
    returns: [["MSKU-4410"], ["HLXU-7702", "CMAU-1120"], ["msku-4413"]]
    note: La tabla de arriba.
  - args: [[["TGHU-2207", 20000, 21000, true], ["TGHU-2208", 20000, 18999, true]]]
    returns: [["TGHU-2207"], ["TGHU-2208"], []]
    note: 1000 kilos son justo el 5 % de 20000, y eso todavía pasa; 1001 ya no.
edge:
  - args: [[]]
    tag: sin contenedores
  - args: [[["MSK-4410", 18000, 30000, false]]]
    tag: con un código malo que además tiene la carga mal
  - args: [[["CMAU-0981", 10000, 9500, true], ["CMAU-0982", 10000, 10500, true]]]
    tag: con diferencias de justo el 5 %
  - args: [[["CMAU-0981", 10000, 9000, true]]]
    tag: con la balanza por debajo de lo declarado
  - args: [[["HLXU-7702", 21000, 21000, false], ["HLXU-7703", 21000, 21000, false]]]
    tag: con todos retenidos
  - args: [[["MSKU_4410", 18400, 18400, true], ["MSKU-441", 18400, 18400, true], ["MSKU-44100", 18400, 18400, true]]]
    tag: con códigos casi correctos
random:
  count: 40
  seed: 1617
  generate: |
    lote = []
    for _ in range(rng.int(0, 10)):
        prefijo = rng.pick(["MSKU", "HLXU", "CMAU", "TGHU", "SUDU", "msku", "MSK", "HLX7"])
        codigo = prefijo + rng.pick(["-", "-", "-", "", "_"]) + str(rng.int(100, 9999))
        declarado = rng.int(50, 1500) * 20
        balanza = declarado + rng.pick([0, 0, rng.int(-declarado // 10, declarado // 10), declarado // 20, -(declarado // 20), declarado // 20 + 1])
        lote.append([codigo, declarado, balanza, rng.int(0, 4) > 0])
    return [lote]
wrong:
  - |
    import re

    def inspeccionar(contenedor):
        codigo, declarado, balanza, precinto = contenedor
        if not re.fullmatch(r"[A-Z]{4}-\d{4}", codigo):
            raise ValueError(codigo)
        if not precinto or abs(balanza - declarado) * 100 > declarado * 5:
            raise ValueError(codigo)
        return codigo

    def despachar(contenedores):
        liberados, retenidos = [], []
        for contenedor in contenedores:
            try:
                liberados.append(inspeccionar(contenedor))
            except Exception:
                retenidos.append(contenedor[0])
        return [liberados, retenidos, []]
  - |
    import re

    def despachar(contenedores):
        resultado = [[], [], []]
        for codigo, declarado, balanza, precinto in contenedores:
            if not precinto or abs(balanza - declarado) * 100 > declarado * 5:
                resultado[1].append(codigo)
            elif not re.fullmatch(r"[A-Z]{4}-\d{4}", codigo):
                resultado[2].append(codigo)
            else:
                resultado[0].append(codigo)
        return resultado
  - |
    import re

    def despachar(contenedores):
        resultado = [[], [], []]
        for codigo, declarado, balanza, precinto in contenedores:
            if not re.fullmatch(r"[A-Z]{4}-\d{4}", codigo):
                resultado[2].append(codigo)
            elif not precinto or (balanza - declarado) * 100 >= declarado * 5:
                resultado[1].append(codigo)
            else:
                resultado[0].append(codigo)
        return resultado
tests:
  - name: usa una familia de excepciones propia
    source: 'class\s+\w+\(\s*ErrorCarga\s*\)'
    msg: PrecintoRoto y DiferenciaDePeso heredan de ErrorCarga.
  - name: inspeccionar lanza los errores
    source: '\braise\s+\w+'
```

## Misión final

```exercise
id: py16-mision-grua
type: mission
title: La grúa ocupada
prompt: |
  **Recorre el muelle levantando cada contenedor con `grua(codigo)`: si la grúa está ocupada, reintenta hasta 3 veces en total; si el contenedor está trabado, no insistas. Al final entrega en la oficina (D) la lista de liberados.**

  Quilla empieza en la columna 1 mirando al este. `contenedores` es una lista de pares `[columna, codigo]`, en orden; para llegar a cada uno, `robot.avanzar(columna - robot.posicion.x)`.

  `grua(codigo)` ya está escrita: devuelve los kilos del contenedor, o lanza un `ErrorGrua` de uno de dos tipos:

  - `GruaOcupada`: pasajero; **vuelve a llamar**, hasta 3 intentos en total por contenedor;
  - `ContenedorTrabado`: reintentar no sirve; ese contenedor queda retenido al primer intento.

  1. Escribe `levantar(codigo, intentos=3)`: devuelve los kilos, reintenta solo con `GruaOcupada` y, si se le acaban los intentos, lanza `GruaOcupada` otra vez.
  2. En `informe[codigo]` anota los kilos, o `"retenido"` si `levantar` lanzó cualquier `ErrorGrua`.
  3. Camina hasta la pared del fondo (la oficina) y entrega `"Liberados: "` con los códigos liberados separados por `", "`, en orden.

  Nada de `except:` ni `except Exception`: un error que no es de la grúa tiene que verse. Los datos cambian en cada prueba.
visual:
  figure:
    title: La primera tarde
    panes:
      - label: contenedores
        table: { head: ["columna", "código", "la grúa"], rows: [["3", "MSKU-4410", "lo levanta"], ["6", "HLXU-7702", "ocupada 2 veces, al 3.er intento sí"], ["9", "CMAU-1120", "lo levanta"]] }
      - { label: entrega, value: "Liberados: MSKU-4410, HLXU-7702, CMAU-1120" }
starter: |
  # contenedores: [[3, "MSKU-4410"], ...]   columna y código, en orden
  class ErrorGrua(Exception): pass
  class GruaOcupada(ErrorGrua): pass        # pasajero: vuelve a intentarlo
  class ContenedorTrabado(ErrorGrua): pass  # reintentar no sirve

  llamadas = []

  def grua(codigo):
      """Levanta el contenedor y devuelve sus kilos."""
      llamadas.append(codigo)
      if codigo in trabados:
          raise ContenedorTrabado(codigo)
      if llamadas.count(codigo) <= ocupada.get(codigo, 0):
          raise GruaOcupada(codigo)
      return pesos[codigo]


  def levantar(codigo, intentos=3):
      pass


  informe = {}
  # TODO: recorre contenedores, llena informe, camina a la oficina y entrega
solution: |
  class ErrorGrua(Exception): pass
  class GruaOcupada(ErrorGrua): pass        # pasajero: vuelve a intentarlo
  class ContenedorTrabado(ErrorGrua): pass  # reintentar no sirve

  llamadas = []

  def grua(codigo):
      """Levanta el contenedor y devuelve sus kilos."""
      llamadas.append(codigo)
      if codigo in trabados:
          raise ContenedorTrabado(codigo)
      if llamadas.count(codigo) <= ocupada.get(codigo, 0):
          raise GruaOcupada(codigo)
      return pesos[codigo]


  def levantar(codigo, intentos=3):
      for _ in range(intentos - 1):
          try:
              return grua(codigo)
          except GruaOcupada:
              pass
      return grua(codigo)


  informe = {}
  for columna, codigo in contenedores:
      robot.avanzar(columna - robot.posicion.x)
      try:
          kilos = levantar(codigo)
      except ErrorGrua:
          informe[codigo] = "retenido"
      else:
          informe[codigo] = kilos
          robot.decir(f"{codigo}: {kilos} kg")

  while not robot.hay_pared():
      robot.avanzar()
  liberados = [codigo for codigo, kilos in informe.items() if kilos != "retenido"]
  robot.entregar("Liberados: " + ", ".join(liberados))
hints:
  - "En `levantar`, los primeros intentos van en un `try` con `except GruaOcupada: pass`; el último intento va sin `try`, así su error sube solo."
  - "Afuera, `try: kilos = levantar(codigo)` con `except ErrorGrua:` (la familia entera) y `else:` para anotar los kilos. Para llegar a la oficina: `while not robot.hay_pared(): robot.avanzar()`."
world:
  theme: barranco
  level: 2
  dir: E
  items: { c: contenedor }
  map: |
    ##############
    #R..........D#
    ###c##c##c####
    ##############
globals:
  contenedores: [[3, MSKU-4410], [6, HLXU-7702], [9, CMAU-1120]]
  pesos: { MSKU-4410: 18400, HLXU-7702: 21000, CMAU-1120: 15000 }
  ocupada: { HLXU-7702: 2 }
  trabados: []
scenarios:
  - tests:
      - name: el informe de la primera tarde
        expect: 'informe == {"MSKU-4410": 18400, "HLXU-7702": 21000, "CMAU-1120": 15000}'
      - name: tres intentos para el que encontró la grúa ocupada
        expect: 'llamadas == ["MSKU-4410", "HLXU-7702", "HLXU-7702", "HLXU-7702", "CMAU-1120"]'
  - map: |
      #############
      #R.........D#
      ##c##c#c#c###
      #############
    globals:
      contenedores: [[2, TGHU-2207], [5, SUDU-5150], [7, HLXU-7705], [9, CMAU-0981]]
      pesos: { TGHU-2207: 12500, SUDU-5150: 22300, HLXU-7705: 8000, CMAU-0981: 20500 }
      ocupada: { TGHU-2207: 3, HLXU-7705: 1 }
      trabados: [SUDU-5150]
    tests:
      - name: el informe de la segunda tarde
        expect: 'informe == {"TGHU-2207": "retenido", "SUDU-5150": "retenido", "HLXU-7705": 8000, "CMAU-0981": 20500}'
      - name: ni un intento de más
        expect: 'llamadas == ["TGHU-2207"] * 3 + ["SUDU-5150"] + ["HLXU-7705"] * 2 + ["CMAU-0981"]'
        msg: Con GruaOcupada se intenta hasta 3 veces en total; con ContenedorTrabado, una sola.
  - map: |
      ###########
      #R.......D#
      ####c#c####
      ###########
    globals:
      contenedores: [[4, CMAU-1121], [6, MSKU-4490]]
      pesos: { CMAU-1121: 14800, MSKU-4490: 19900 }
      ocupada: { CMAU-1121: 4 }
      trabados: [MSKU-4490]
    tests:
      - name: el informe de una tarde difícil
        expect: 'informe == {"CMAU-1121": "retenido", "MSKU-4490": "retenido"}'
      - name: la grúa se rindió a tiempo
        expect: 'llamadas == ["CMAU-1121"] * 3 + ["MSKU-4490"]'
tests:
  - name: entrega la lista de liberados en la oficina
    state: 'w.delivered == ["Liberados: " + ", ".join(c for _, c in g["contenedores"] if c not in g["trabados"] and g["ocupada"].get(c, 0) < 3)]'
    msg: 'Entrega una sola etiqueta: "Liberados: " y los códigos liberados separados por ", ", en orden.'
  - name: termina en la oficina sin chocar
    state: w.at_goal and not w.crashed
  - name: levantar es una función
    expect: callable(levantar)
  - name: reintenta solo con GruaOcupada
    source: 'except\s+GruaOcupada'
  - name: nada de except para todo
    sourceNot: 'except\s*(:|Exception\b|BaseException\b)'
    msg: "Un except: o un except Exception esconde cualquier bug. Atrapa GruaOcupada y ErrorGrua."
```

## Reto experto

```exercise
id: py16-reto-auditoria
type: challenge
title: La auditoría que no se detiene
visual:
  figure:
    title: Un contenedor, todos sus problemas
    input: { label: contenedor, text: "[\"msku-1\", 1000, 1300, False]" }
    arrow: corre las tres revisiones y junta lo que falle
    output: { label: lanza, text: "ExceptionGroup(\"msku-1\", [\n  CodigoInvalido, PrecintoRoto, DiferenciaDePeso\n])" }
prompt: |
  **Escribe `inspeccion_completa(contenedor)` y `auditar(lote)`.** Para quien ya programa.

  La auditoría de fin de mes no se detiene en el primer problema: quiere **todos**. Las tres revisiones ya están escritas y cada una lanza su propio error.

  - `inspeccion_completa(contenedor)` corre las tres funciones de `revisiones`, en orden, junta cada excepción que lancen y, si hay al menos una, lanza `ExceptionGroup(codigo, errores)`. Si no, devuelve el código.
  - `auditar(lote)` devuelve un diccionario con cuatro listas de códigos, en orden de llegada: `"codigo"`, `"precinto"`, `"peso"` (los contenedores con ese problema; uno puede estar en varias) y `"limpios"`. Atiende el grupo con un `except*` por tipo de error.

  `errores_de` ya está escrita y sirve para probar.
starter: |
  import re

  class CodigoInvalido(Exception): pass
  class PrecintoRoto(Exception): pass
  class DiferenciaDePeso(Exception): pass


  def revisar_codigo(contenedor):
      if not re.fullmatch(r"[A-Z]{4}-\d{4}", contenedor[0]):
          raise CodigoInvalido(contenedor[0])

  def revisar_precinto(contenedor):
      if not contenedor[3]:
          raise PrecintoRoto(contenedor[0])

  def revisar_peso(contenedor):
      codigo, declarado, balanza, _ = contenedor
      if abs(balanza - declarado) * 100 > declarado * 5:
          raise DiferenciaDePeso(codigo)

  revisiones = [revisar_codigo, revisar_precinto, revisar_peso]


  def inspeccion_completa(contenedor):
      pass


  def auditar(lote):
      return {"codigo": [], "precinto": [], "peso": [], "limpios": []}


  def errores_de(contenedor):
      """Los nombres de los errores del grupo, en orden alfabético."""
      try:
          inspeccion_completa(contenedor)
      except ExceptionGroup as grupo:
          return sorted(type(error).__name__ for error in grupo.exceptions)
      return []

  print(errores_de(["msku-1", 1000, 1300, False]))
solution: |
  import re

  class CodigoInvalido(Exception): pass
  class PrecintoRoto(Exception): pass
  class DiferenciaDePeso(Exception): pass


  def revisar_codigo(contenedor):
      if not re.fullmatch(r"[A-Z]{4}-\d{4}", contenedor[0]):
          raise CodigoInvalido(contenedor[0])

  def revisar_precinto(contenedor):
      if not contenedor[3]:
          raise PrecintoRoto(contenedor[0])

  def revisar_peso(contenedor):
      codigo, declarado, balanza, _ = contenedor
      if abs(balanza - declarado) * 100 > declarado * 5:
          raise DiferenciaDePeso(codigo)

  revisiones = [revisar_codigo, revisar_precinto, revisar_peso]


  def inspeccion_completa(contenedor):
      errores = []
      for revisar in revisiones:
          try:
              revisar(contenedor)
          except (CodigoInvalido, PrecintoRoto, DiferenciaDePeso) as error:
              errores.append(error)
      if errores:
          raise ExceptionGroup(contenedor[0], errores)
      return contenedor[0]


  def auditar(lote):
      informe = {"codigo": [], "precinto": [], "peso": [], "limpios": []}
      for contenedor in lote:
          codigo = contenedor[0]
          try:
              inspeccion_completa(contenedor)
          except* CodigoInvalido:
              informe["codigo"].append(codigo)
          except* PrecintoRoto:
              informe["precinto"].append(codigo)
          except* DiferenciaDePeso:
              informe["peso"].append(codigo)
          else:
              informe["limpios"].append(codigo)
      return informe


  def errores_de(contenedor):
      """Los nombres de los errores del grupo, en orden alfabético."""
      try:
          inspeccion_completa(contenedor)
      except ExceptionGroup as grupo:
          return sorted(type(error).__name__ for error in grupo.exceptions)
      return []

  print(errores_de(["msku-1", 1000, 1300, False]))
hints:
  - "En `inspeccion_completa`, un `try` dentro del `for` que recorre `revisiones`; el `except` agrega el error a una lista y el bucle sigue."
  - "En `auditar`, `try` / `except* CodigoInvalido:` / `except* PrecintoRoto:` / `except* DiferenciaDePeso:` / `else:`. Dentro de un `except*` no se permite `continue`, así que usa `else` para los limpios."
tests:
  - name: junta los tres problemas
    run: 'errores_de(["msku-1", 1000, 1300, False])'
    equals: [CodigoInvalido, DiferenciaDePeso, PrecintoRoto]
  - name: uno solo también va en grupo
    run: 'errores_de(["MSKU-4410", 18400, 18400, False])'
    equals: [PrecintoRoto]
  - name: un contenedor limpio devuelve su código
    run: 'inspeccion_completa(["MSKU-4410", 18400, 18500, True])'
    equals: MSKU-4410
  - name: un contenedor sin problemas no lanza
    run: 'errores_de(["HLXU-7702", 21000, 21000, True])'
    equals: []
  - name: la auditoría de un lote
    run: 'auditar([["MSKU-4410", 18400, 18500, True], ["msku-1", 1000, 1300, False], ["HLXU-7702", 20000, 21001, True], ["CMAU-1120", 15000, 15000, False]])'
    equals: { codigo: [msku-1], precinto: [msku-1, CMAU-1120], peso: [msku-1, HLXU-7702], limpios: [MSKU-4410] }
  - name: un lote vacío
    run: auditar([])
    equals: { codigo: [], precinto: [], peso: [], limpios: [] }
  - name: lanza un ExceptionGroup y lo atiende con except*
    source: 'ExceptionGroup\([\s\S]*except\*'
```
