# Sesión 19 — Archivos, módulos y datos

## El encargo

Chiclayo, siete de la mañana. El **Mercado Modelo** ya huele a culantro, a pato en olla y a las hierbas de los curanderos del pasaje del fondo. En el patio de comidas del segundo piso, cuatro puestos comparten una sola caja registradora: Catalina con sus King Kong, Wálter con su arroz con pato, Rocío con el cabrito y Hermes con la tortilla de raya. El administrador de la asociación, **don Segundo Puicón**, tiene mañana una revisión de boletas y una montaña de papeles, cuadernos y archivos que no cuadran.

Maru mandó a Quilla en el bus de la noche, con su brazo de mozo. Hasta hoy, todo lo que Quilla sabía se le olvidaba al terminar el programa. Hoy aprende a **leer y escribir archivos**: el registro de la caja en CSV, la lista de precios en JSON, un cuaderno de texto. Y a partir su código en **módulos**, como un programa de verdad.

```escena
theme: cocina
level: 4
dir: E
caption: El patio de comidas del Mercado Modelo. Quilla lee la comanda, prepara en la cocina (K) y sirve las mesas 2 y 4.
map: |
  ############
  #K.........#
  ##1#2#3#4#5#
  ############
program: |
  robot.preparar("arroz con pato")
  robot.avanzar(3)
  robot.servir()
  robot.girar_derecha()
  robot.girar_derecha()
  robot.avanzar(3)
  robot.girar_derecha()
  robot.girar_derecha()
  robot.preparar("King Kong")
  robot.avanzar(7)
  robot.servir()
```

## Lo mínimo

Un **archivo de texto** es texto guardado con un nombre. Se abre con `open(ruta, modo, encoding="utf-8")` dentro de un `with`, que lo **cierra solo** al salir del bloque, aunque haya un error en medio. El modo `"r"` (el de siempre) lee, `"w"` crea el archivo o lo **borra y reescribe**, y `"a"` agrega al final.

```py
with open("caja.txt", encoding="utf-8") as archivo:
    for linea in archivo:            # cada línea trae su "\n" al final
        print(linea.strip())

with open("resumen.txt", "w", encoding="utf-8") as salida:
    salida.write("Total: 132.50\n")  # write no agrega el salto de línea
```

`archivo.read()` da todo el contenido en un solo texto, y recorrer el archivo da una línea por vuelta. **¿Por qué `encoding`?** Un archivo guarda bytes, no letras: la `ñ` y las tildes ocupan dos bytes en UTF-8, y si lo lees con otra codificación salen garabatos:

```py run
nombre = "Chapoñán"
datos = nombre.encode("utf-8")
print(len(nombre), len(datos))
print(datos.decode("latin-1"))
```

**`pathlib.Path`** es una ruta con métodos: `/` une partes, `.name`, `.stem` y `.suffix` la desarman, `.exists()` pregunta si existe, `.read_text()` y `.write_text()` leen y escriben de un tirón, y `.glob("*.csv")` lista los archivos de una carpeta.

```py run
from pathlib import Path
ruta = Path("ventas") / "octubre" / "puesto-48.csv"
print(ruta)
print(ruta.name, ruta.stem, ruta.suffix)
print(ruta.parent)
```

Un **CSV** es una tabla en texto: una fila por línea, columnas separadas por comas, y la primera fila es el encabezado. Si un valor lleva una coma, va entre comillas, y por eso nunca se parte con `split(",")`: el módulo **`csv`** lo hace bien. `csv.DictReader` te da cada fila como diccionario, con las claves del encabezado. Al abrir un CSV, pásale `newline=""`. Aquí, `io.StringIO(texto)` hace de archivo: funciona igual que lo que devuelve `open`.

```py run
import csv
import io
texto = 'puesto,plato,monto\nWálter,"Arroz con pato, doble",45.00\n'
for fila in csv.DictReader(io.StringIO(texto)):
    print(fila["plato"], "|", float(fila["monto"]) * 2)
```

Para escribir uno, `csv.writer(archivo).writerow(["Wálter", "Arroz con pato, doble", 45])` pone las comillas donde hagan falta. Y para sumar por grupo, `collections.defaultdict(float)` crea cada clave en `0.0` la primera vez que la tocas:

```anima
title: Sumar un CSV por puesto
code: |
  import csv
  import io
  from collections import defaultdict
  texto = "puesto,monto\nWálter,26.00\nHermes,22.00\nWálter,45.00\n"
  totales = defaultdict(float)
  for fila in csv.DictReader(io.StringIO(texto)):
      totales[fila["puesto"]] += float(fila["monto"])
  print(dict(totales))
show: [fila, totales]
notes:
  5: "Un defaultdict(float): una clave que no existe empieza en 0.0."
  6: "DictReader se salta el encabezado y lo usa como claves de cada fila."
  7: "fila[\"monto\"] es el texto \"26.00\": sin float, no se puede sumar."
  8: "Wálter suma 26 + 45; el orden es el de la primera aparición."
```

**JSON** es el formato de los diccionarios y listas en texto. `json.loads(texto)` lo convierte en datos de Python y `json.dumps(datos)` hace lo contrario; con archivos, `json.load(archivo)` y `json.dump(datos, archivo)`. `true` se vuelve `True` y `null`, `None`. Sin `ensure_ascii=False`, las tildes salen como códigos:

```py run
import json
datos = json.loads('{"puesto": "Chapoñán", "platos": ["King Kong", "cocadas"], "abierto": true}')
print(datos["platos"][0], datos["abierto"])
print(json.dumps(datos, ensure_ascii=False))
print(json.dumps({"señora": "Ñique"}))
```

Dos herramientas de `collections` y un orden con varias claves: `Counter` cuenta una lista de un golpe, `defaultdict(list)` agrupa sin `setdefault`, y una **tupla como `key`** ordena por varias cosas a la vez (el `-` pone los números de mayor a menor):

```py run
from collections import Counter, defaultdict
print(Counter(["pato", "raya", "pato", "cabrito", "raya", "pato"]).most_common(2))
por_mesa = defaultdict(list)
por_mesa[3].append("pato")
print(dict(por_mesa), por_mesa[7])
print(sorted([("Rocío", 72.0), ("Wálter", 97.0), ("Hermes", 72.0)], key=lambda p: (-p[1], p[0])))
```

**Módulos.** Todo archivo `.py` es un módulo: si junto a tu programa hay un `mercado.py`, `import mercado` lo ejecuta una vez y te da sus nombres como `mercado.con_igv`, y `from mercado import con_igv` trae uno directo. Igual que `import csv`. Dentro de un módulo, `__name__` vale su nombre (`"mercado"`), pero en el archivo que ejecutas vale `"__main__"`. Por eso el código de prueba de un módulo va así, y no corre cuando otro lo importa:

```py
def con_igv(monto):
    return round(monto * 1.18, 2)

if __name__ == "__main__":
    print("Probando:", con_igv(100))
```

Así busca Python cuando escribes `import`, paso a paso:

```red
title: Cómo busca Python un módulo cuando haces import
caption: "Primero tu carpeta, luego las librerías instaladas. Un módulo se ejecuta **una sola vez**."
speed: 4200
nodes:
  - { id: prog, icon: program, label: "Tu programa", sub: "el archivo que ejecutas" }
  - { id: mer, icon: file, label: "mercado.py", sub: "en la misma carpeta" }
  - { id: std, icon: box, label: "Librería estándar", sub: "csv, json, collections…" }
steps:
  - phase: "1. Tu propio módulo"
    move: [prog, mer]
    packet: { kind: up, label: "¿hay un mercado?" }
    note: "`import mercado`: Python busca primero **junto a tu programa**, en su misma carpeta. Encuentra `mercado.py`."
  - at: mer
    packet: { kind: local, label: "se ejecuta una vez" }
    note: "Lo **ejecuta una vez**, de arriba abajo. Aquí solo define `con_igv`."
    tags: { mer: "ejecutado" }
    show: { label: mercado.py, text: "def con_igv(monto):\n    return round(monto * 1.18, 2)" }
  - move: [mer, prog]
    packet: { kind: down, label: "mercado.con_igv" }
    note: "Sus nombres vuelven a tu programa, guardados dentro de `mercado`: `mercado.con_igv(100)`. Con `from mercado import con_igv` llega solo ese nombre, sin prefijo."
  - phase: "2. Otra vez"
    at: mer
    note: "Un segundo `import mercado`, en tu programa o en otro módulo, **no lo ejecuta de nuevo**: Python ya lo tiene en memoria y entrega lo mismo."
    tags: { mer: "ya cargado: no corre otra vez" }
  - phase: "3. Librería estándar"
    move: [prog, std]
    packet: { kind: up, label: "¿hay un csv?" }
    dim: [mer]
    note: "`import csv`: junto a tu programa no hay un `csv.py`, así que Python sigue con la **librería estándar**, los módulos que ya vienen instalados. Por eso tu archivo no debe llamarse como una librería: taparía a la verdadera."
  - phase: "4. Si no está"
    move: [prog, std]
    packet: { kind: up, label: "¿hay un inventado?" }
    dim: [mer]
    note: "Si el módulo no está ni junto a tu programa ni en las librerías instaladas, Python se detiene."
  - at: prog
    tags: { prog: ModuleNotFoundError }
    note: "El mensaje es `ModuleNotFoundError: No module named 'inventado'`. Casi siempre es un error de escritura o un archivo en otra carpeta."
  - phase: "5. Quién corre el archivo"
    at: prog
    note: "Dentro de un módulo, `__name__` dice cómo se está usando: si lo ejecutas tú directamente vale `\"__main__\"` y corre el bloque de prueba; si otro lo importa, vale su nombre y no corre."
    show: { label: "__name__", text: "python mercado.py → \"__main__\"\nimport mercado    → \"mercado\"" }
```

> **Trampa común:** todo lo que sale de un archivo es **texto**. `"10" + "9"` da `"109"`, `"10" > "9"` es `False` (compara letra por letra) y `sorted(["9", "45", "120"])` da `['120', '45', '9']`. Convierte con `int()` o `float()` apenas leas cada fila.

<!-- legacy: with-open -->

<!-- legacy: pathlib -->

<!-- mdn: with-open pathlib csv-dictreader json main-guard -->

## Práctica

```exercise
id: py19-completa-caja
type: complete
title: El cuaderno de Catalina
prompt: |
  Catalina anota sus ventas en `caja.txt`, una por línea: `plato,monto`. Completa los `___` para **leer** el archivo, sumar los montos y **escribir** el total en `resumen.txt`, con el formato `Total: 132.50` y un salto de línea al final.
visual:
  figure:
    input: { label: caja.txt, text: "arroz con pato,32.50\ncabrito,28.00\ntortilla de raya,22.00\nespesado,18.00\nKing Kong de piña,32.00" }
    arrow: "with open(...) → suma → write"
    output: { label: resumen.txt, text: "Total: 132.50" }
files:
  caja.txt: |
    arroz con pato,32.50
    cabrito,28.00
    tortilla de raya,22.00
    espesado,18.00
    King Kong de piña,32.00
starter: |
  total = 0
  with ___("caja.txt", encoding="utf-8") as archivo:
      for linea in archivo:
          plato, monto = linea.___().split(",")
          total += ___(monto)

  with open("resumen.txt", "___", encoding="utf-8") as salida:
      salida.___(f"Total: {total:.2f}\n")
  print(f"Total: {total:.2f}")
solution: |
  total = 0
  with open("caja.txt", encoding="utf-8") as archivo:
      for linea in archivo:
          plato, monto = linea.strip().split(",")
          total += float(monto)

  with open("resumen.txt", "w", encoding="utf-8") as salida:
      salida.write(f"Total: {total:.2f}\n")
  print(f"Total: {total:.2f}")
hints:
  - "Cada línea trae un `\"\\n\"` al final: `strip()` lo quita. Y el monto llega como texto."
  - "Para escribir, el modo es `\"w\"` y el método es `write`."
tests:
  - name: suma los cinco montos
    expect: total == 132.5
  - name: escribe resumen.txt
    expect: 'open("resumen.txt", encoding="utf-8").read() == "Total: 132.50\n"'
    msg: 'El archivo debe tener exactamente "Total: 132.50" y un salto de línea.'
  - name: la consola lo dice
    output: "Total: 132.50"
```

```exercise
id: py19-escribe-carpeta
type: write
title: Una carpeta, un archivo por día
prompt: |
  Escribe `totales_por_dia(carpeta)`, que lee **cada archivo `.txt`** de la carpeta y devuelve un diccionario `nombre del archivo sin extensión → suma de sus montos`, con los días en el orden de sus nombres.

  Hermes guarda las boletas de cada día en `ventas/2026-10-20.txt`, `ventas/2026-10-21.txt`…, un monto por línea. En la carpeta también hay un `LEEME.md`, que no es de ventas, y un día en que no vendió nada (el archivo está vacío). Usa `Path(carpeta).glob("*.txt")`, `ruta.stem` y `ruta.read_text(encoding="utf-8").split()`.
visual:
  figure:
    input: { label: ventas/, table: { head: ["archivo", "contenido"], rows: [["2026-10-20.txt", "32.50 · 28.00 · 22.00"], ["2026-10-21.txt", "45.00 · 18.50"], ["2026-10-22.txt", "(vacío)"], ["LEEME.md", "(no es .txt)"]] } }
    arrow: "glob(\"*.txt\") → stem → suma"
    output: { label: devuelve, cards: [{ title: totales, rows: [["2026-10-20", "82.5"], ["2026-10-21", "63.5"], ["2026-10-22", "0"]] }] }
files:
  ventas/2026-10-21.txt: "45.00\n18.50\n"
  ventas/2026-10-20.txt: "32.50\n28.00\n22.00\n"
  ventas/2026-10-22.txt: ""
  ventas/LEEME.md: "Un monto por línea, en soles.\n"
  feria/sabado.txt: "12.00\n8.50\n"
starter: |
  from pathlib import Path


  def totales_por_dia(carpeta):
      return {}


  print(totales_por_dia("ventas"))
solution: |
  from pathlib import Path


  def totales_por_dia(carpeta):
      totales = {}
      for ruta in sorted(Path(carpeta).glob("*.txt")):
          montos = ruta.read_text(encoding="utf-8").split()
          totales[ruta.stem] = sum(float(monto) for monto in montos)
      return totales


  print(totales_por_dia("ventas"))
hints:
  - "`sorted(Path(carpeta).glob(\"*.txt\"))` da las rutas de los `.txt` en orden de nombre."
  - "`split()` sin argumentos corta por saltos de línea y no deja textos vacíos; un archivo vacío da `[]`, y `sum` de nada es 0."
tests:
  - name: los tres días de Hermes, en orden
    expect: 'totales_por_dia("ventas") == {"2026-10-20": 82.5, "2026-10-21": 63.5, "2026-10-22": 0}'
  - name: los días salen en el orden de sus nombres
    expect: 'list(totales_por_dia("ventas")) == ["2026-10-20", "2026-10-21", "2026-10-22"]'
  - name: otra carpeta
    expect: 'totales_por_dia("feria") == {"sabado": 20.5}'
  - name: usa Path
    source: '\bPath\s*\('
```

```exercise
id: py19-predice-coma
type: predict
title: La coma dentro del plato
prompt: |
  Una fila del registro de la caja, partida de dos maneras. ¿Qué imprime?
code: |
  import csv
  import io
  linea = 'Puesto 12,"Pato, arroz y cabrito",45\n'
  print(len(linea.strip().split(",")))
  fila = next(csv.reader(io.StringIO(linea)))
  print(len(fila), fila[1])
  print(fila[2] * 2)
options:
  - "4\n3 Pato, arroz y cabrito\n4545"
  - "3\n3 Pato, arroz y cabrito\n90"
  - "4\n3 Pato, arroz y cabrito\n90"
  - "4\n4 \"Pato\n4545"
answer: "4\n3 Pato, arroz y cabrito\n4545"
explain: |
  `split(",")` no sabe de comillas: corta también la coma del plato y da 4 pedazos. `csv.reader` respeta las comillas y da 3 columnas, sin las comillas. Y `fila[2]` es el **texto** `"45"`: por 2, se repite.
```

```exercise
id: py19-arregla-pesadas
type: fix
title: Las pesadas del limón
prompt: |
  Rocío pesa lo que compra en el mercado de abastos y lo anota en `pesadas.csv`. Este programa debería sumar los kilos de cada producto, pero se cae en la primera vuelta. Ejecútalo y lee el error.

  Arréglalo leyendo el archivo con **`csv.DictReader`** (así el encabezado no cuenta como dato) y convirtiendo los kilos a número.
visual:
  figure:
    input: { label: pesadas.csv, table: { head: ["producto", "kilos"], rows: [["limón", "2.5"], ["ají amarillo", "1.25"], ["limón", "3"], ["cebolla roja", "4"], ["ají amarillo", "0.75"]] } }
    output: { label: kilos, cards: [{ title: kilos, rows: [["limón", "5.5"], ["ají amarillo", "2.0"], ["cebolla roja", "4.0"]] }] }
files:
  pesadas.csv: |
    producto,kilos
    limón,2.5
    ají amarillo,1.25
    limón,3
    cebolla roja,4
    ají amarillo,0.75
starter: |
  import csv

  kilos = {}
  with open("pesadas.csv", encoding="utf-8", newline="") as archivo:
      for fila in csv.reader(archivo):
          producto = fila[0]
          kilos[producto] = kilos.get(producto, 0) + fila[1]
  print(kilos)
solution: |
  import csv
  from collections import defaultdict

  kilos = defaultdict(float)
  with open("pesadas.csv", encoding="utf-8", newline="") as archivo:
      for fila in csv.DictReader(archivo):
          kilos[fila["producto"]] += float(fila["kilos"])
  print(dict(kilos))
hints:
  - "La primera fila es `[\"producto\", \"kilos\"]`, y `0 + \"kilos\"` es un `TypeError`. Aunque te saltes esa fila, `\"2.5\"` sigue siendo texto."
  - "Con `csv.DictReader(archivo)` cada fila es `{\"producto\": \"limón\", \"kilos\": \"2.5\"}`. Suma `float(fila[\"kilos\"])`."
tests:
  - name: suma los kilos de cada producto
    expect: 'dict(kilos) == {"limón": 5.5, "ají amarillo": 2.0, "cebolla roja": 4.0}'
  - name: el encabezado no es un producto
    expect: '"producto" not in kilos'
  - name: usa DictReader
    source: '\bDictReader\s*\('
```

```exercise
id: py19-escribe-json
type: write
title: La subida de precios
prompt: |
  Escribe `subir_precios(entrada, salida, subida)`, que lee la carta de un archivo JSON, le suma `subida` soles a cada precio, **guarda** la carta nueva en el archivo `salida` y la devuelve.

  Wálter subió todo porque el pato está caro. La carta está en `precios.json`. Guarda la nueva con `json.dump(carta, archivo, ensure_ascii=False, indent=2)`: así las tildes quedan como tildes y el archivo se puede leer a ojo.
visual:
  figure:
    input: { label: precios.json, cards: [{ title: carta, rows: [["arroz con pato", "26.0"], ["cabrito", "24.0"], ["pepián de pavo", "20.0"], ["chinguirito", "16.0"]] }] }
    arrow: "json.load → + 2 → json.dump"
    output: { label: precios_nuevos.json, text: "{\n  \"arroz con pato\": 28.0,\n  \"cabrito\": 26.0,\n  \"pepián de pavo\": 22.0,\n  \"chinguirito\": 18.0\n}" }
files:
  precios.json: '{"arroz con pato": 26.0, "cabrito": 24.0, "pepián de pavo": 20.0, "chinguirito": 16.0}'
starter: |
  import json


  def subir_precios(entrada, salida, subida):
      return {}


  print(subir_precios("precios.json", "precios_nuevos.json", 2))
solution: |
  import json


  def subir_precios(entrada, salida, subida):
      with open(entrada, encoding="utf-8") as archivo:
          carta = json.load(archivo)
      nueva = {plato: precio + subida for plato, precio in carta.items()}
      with open(salida, "w", encoding="utf-8") as archivo:
          json.dump(nueva, archivo, ensure_ascii=False, indent=2)
      return nueva


  print(subir_precios("precios.json", "precios_nuevos.json", 2))
hints:
  - "`json.load(archivo)` lee un archivo abierto (sin la s final); `json.loads(texto)` lee un texto."
  - "Una comprensión de diccionario arma la carta nueva: `{plato: precio + subida for plato, precio in carta.items()}`."
tests:
  - name: devuelve la carta nueva
    expect: 'subir_precios("precios.json", "precios_nuevos.json", 2) == {"arroz con pato": 28.0, "cabrito": 26.0, "pepián de pavo": 22.0, "chinguirito": 18.0}'
  - name: el archivo nuevo tiene la carta nueva
    expect: 'json.load(open("precios_nuevos.json", encoding="utf-8")) == {"arroz con pato": 28.0, "cabrito": 26.0, "pepián de pavo": 22.0, "chinguirito": 18.0}'
  - name: las tildes quedan como tildes
    expect: '"pepián" in open("precios_nuevos.json", encoding="utf-8").read()'
    msg: Usa ensure_ascii=False en json.dump.
  - name: con sangría de dos espacios
    expect: 'open("precios_nuevos.json", encoding="utf-8").read().startswith("{\n  \"")'
    msg: Usa indent=2 en json.dump.
  - name: no toca precios.json
    expect: 'json.load(open("precios.json", encoding="utf-8"))["cabrito"] == 24.0'
```

```exercise
id: py19-predice-ranking
type: predict
title: El plato más pedido
prompt: |
  Don Segundo cuenta los pedidos de la mañana y arma el ranking. ¿Qué imprime?
code: |
  from collections import Counter
  pedidos = ["pato", "raya", "cabrito", "raya", "pato", "espesado", "cabrito"]
  conteo = Counter(pedidos)
  print(conteo["pato"], conteo["chinguirito"])
  ranking = sorted(conteo.items(), key=lambda par: (-par[1], par[0]))
  print(ranking[:3])
  print(sorted(["9", "45", "120"]))
options:
  - "2 0\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['120', '45', '9']"
  - "2 0\n[('pato', 2), ('raya', 2), ('cabrito', 2)]\n['120', '45', '9']"
  - "2 0\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['9', '45', '120']"
  - "2 None\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['120', '45', '9']"
answer: "2 0\n[('cabrito', 2), ('pato', 2), ('raya', 2)]\n['120', '45', '9']"
explain: |
  Un `Counter` da 0 para lo que nunca vio, sin `KeyError`. La clave `(-cantidad, nombre)` ordena primero por cantidad de mayor a menor y, en el empate de tres platos con 2, por nombre. Y los textos se comparan letra por letra: `"1"` va antes que `"4"` y que `"9"`.
```

```exercise
id: py19-escribe-modulo
type: write
title: El módulo de la asociación
prompt: |
  En la carpeta hay un módulo, `mercado.py`, que la asociación usa en todos los puestos. **Importa de él `con_igv` y `soles`** (no las copies) y escribe `principal()`, que imprime una línea por plato de `platos` con su precio con IGV: `arroz con pato: S/ 30.68`. Llama a `principal()` dentro de un `if __name__ == "__main__":`.

  Fíjate: `mercado.py` también imprime algo cuando lo ejecutas directamente, pero al importarlo no sale nada.
visual:
  figure:
    input: { label: mercado.py, text: "IGV = 0.18\n\ndef con_igv(monto): ...\ndef soles(monto): ...\n\nif __name__ == \"__main__\":\n    print(\"Probando mercado.py:\", ...)" }
    arrow: "from mercado import con_igv, soles"
    output: { label: consola, text: "arroz con pato: S/ 30.68\ncabrito: S/ 28.32" }
files:
  mercado.py: |
    """Cuentas del patio de comidas del Mercado Modelo."""

    IGV = 0.18


    def con_igv(monto):
        """El monto con IGV, redondeado a céntimos."""
        return round(monto * (1 + IGV), 2)


    def soles(monto):
        """El monto como va en una boleta: S/ 12.50."""
        return f"S/ {monto:.2f}"


    if __name__ == "__main__":
        print("Probando mercado.py:", soles(con_igv(100)))
starter: |
  platos = [("arroz con pato", 26.0), ("cabrito", 24.0)]


  def principal():
      pass
solution: |
  from mercado import con_igv, soles

  platos = [("arroz con pato", 26.0), ("cabrito", 24.0)]


  def principal():
      for plato, precio in platos:
          print(f"{plato}: {soles(con_igv(precio))}")


  if __name__ == "__main__":
      principal()
hints:
  - "`from mercado import con_igv, soles` va arriba, como `import csv`."
  - "Dentro de `principal`: `print(f\"{plato}: {soles(con_igv(precio))}\")`. Al final, `if __name__ == \"__main__\":` y `principal()` con sangría."
tests:
  - name: imprime los dos platos con IGV
    output: "arroz con pato: S/ 30.68\ncabrito: S/ 28.32"
    msg: "Si ves \"Probando mercado.py\", estás ejecutando el módulo en vez de importarlo."
  - name: importa del módulo
    source: '\bfrom\s+mercado\s+import\b|\bimport\s+mercado\b'
  - name: no copia las funciones
    sourceNot: '\bdef\s+(con_igv|soles)\b'
  - name: llama a principal desde el bloque __main__
    source: 'if\s+__name__\s*==\s*["'']__main__["'']\s*:\s*\n\s+principal\(\)'
```

## El caso

```exercise
id: py19-caso-boleta
type: case
title: La boleta que no está en el archivo
prompt: |
  **Suma, por puesto, las boletas emitidas del archivo de la caja y compáralo con lo que suman las copias en papel de cada puesto. Después encuentra la copia que no está en el archivo.**

  Don Segundo juntó los talonarios de los cuatro puestos (las copias en papel de cada boleta) y el archivo que exporta la caja registradora, `archivo_caja.csv`. Mañana viene la revisión, y cada boleta entregada a un cliente tiene que estar en el archivo. Ojo con dos cosas: algunos platos llevan comas, y una boleta del archivo está **anulada** (se emitió por error y no cuenta como venta).

  Imprime una línea por puesto que empiece con su nombre, con el total del archivo al final: `print("Catalina:", total)`. El tablero lo compara con lo que suman sus copias.
visual:
  board:
    for: py19-caso-boleta
    task: "Total del archivo = suma de los montos de sus boletas emitidas. Compáralo con la suma de sus copias en papel."
    cards:
      - name: Catalina
        kind: person
        role: King Kong y dulces
        rows: [["Copias", "3 boletas"], ["Suman", "S/ 85.50"]]
        clue: { find: "Catalina", says: 85.5, saysLabel: Copias }
      - name: Hermes
        kind: person
        role: Tortilla de raya y espesado
        rows: [["Copias", "4 boletas"], ["Suman", "S/ 78.00"]]
        clue: { find: "Hermes", says: 78, saysLabel: Copias }
      - name: Rocío
        kind: person
        role: Cabrito
        culprit: true
        rows: [["Copias", "4 boletas"], ["Suman", "S/ 110.00"], ["Dijo", "\"esa tarde la caja se colgó un ratito\""]]
        clue: { find: "Rocío", says: 110, saysLabel: Copias }
      - name: Wálter
        kind: person
        role: Arroz con pato
        rows: [["Copias", "3 boletas"], ["Suman", "S/ 87.00"]]
        clue: { find: "Wálter", says: 87, saysLabel: Copias }
      - name: archivo_caja.csv
        kind: note
        role: Lo que exportó la caja
        rows: [["Columnas", "boleta, puesto, detalle, monto, estado"], ["Filas", "14, agrupadas por puesto"]]
    caption: "Si Wálter no cuadra, revisa si sumaste la boleta anulada."
files:
  archivo_caja.csv: |
    boleta,puesto,detalle,monto,estado
    B-1031,Catalina,King Kong de manjar,32.00,emitida
    B-1036,Catalina,"Alfajores, maná y cocadas",18.50,emitida
    B-1041,Catalina,King Kong de piña,35.00,emitida
    B-1034,Hermes,Tortilla de raya,22.00,emitida
    B-1037,Hermes,"Espesado, con yuca",19.00,emitida
    B-1040,Hermes,Causa ferreñafana,15.00,emitida
    B-1042,Hermes,Tortilla de raya,22.00,emitida
    B-1033,Rocío,Cabrito con frejoles,28.50,emitida
    B-1038,Rocío,Cabrito,24.00,emitida
    B-1044,Rocío,"Seco de cabrito, para llevar",30.00,emitida
    B-1032,Wálter,"Arroz con pato, doble",45.00,emitida
    B-1035,Wálter,Arroz con pato,26.00,anulada
    B-1039,Wálter,Arroz con pato,26.00,emitida
    B-1045,Wálter,Chinguirito,16.00,emitida
starter: |
  import csv

  # Las copias en papel que cada puesto le entregó a don Segundo
  copias = {
      "Catalina": ["B-1031", "B-1036", "B-1041"],
      "Hermes": ["B-1034", "B-1037", "B-1040", "B-1042"],
      "Rocío": ["B-1033", "B-1038", "B-1043", "B-1044"],
      "Wálter": ["B-1032", "B-1039", "B-1045"],
  }

  # El archivo de la caja está en la carpeta. Su primera línea:
  with open("archivo_caja.csv", encoding="utf-8", newline="") as archivo:
      print(archivo.readline().strip())

  # TODO: recorre el archivo con csv.DictReader, suma por puesto los montos de las
  # boletas emitidas y guarda en un set los números de boleta que aparecen.
  # TODO: imprime una línea por puesto: print("Catalina:", total)
  # TODO: busca qué copias no están en el archivo (una resta de sets)
solution: |
  import csv
  from collections import defaultdict

  copias = {
      "Catalina": ["B-1031", "B-1036", "B-1041"],
      "Hermes": ["B-1034", "B-1037", "B-1040", "B-1042"],
      "Rocío": ["B-1033", "B-1038", "B-1043", "B-1044"],
      "Wálter": ["B-1032", "B-1039", "B-1045"],
  }

  totales = defaultdict(float)
  en_archivo = set()
  with open("archivo_caja.csv", encoding="utf-8", newline="") as archivo:
      for fila in csv.DictReader(archivo):
          en_archivo.add(fila["boleta"])
          if fila["estado"] == "emitida":
              totales[fila["puesto"]] += float(fila["monto"])

  for puesto, numeros in copias.items():
      print(f"{puesto}: {totales[puesto]:.2f}")
      for boleta in sorted(set(numeros) - en_archivo):
          print("  No está en el archivo:", boleta)
answer: B-1043
answerLabel: ¿Qué boleta no está en el archivo?
reveal: |
  La B-1043, del puesto de Rocío. Sus copias suman 110 soles, pero en el archivo solo hay 82.50: faltan los 27.50 de esa boleta, que se entregó en papel y nunca entró a la caja. Wálter cuadra solo si dejas fuera la B-1035, que está anulada; y quien partió las filas con `split(",")` se tropezó con los platos que llevan coma.
hints:
  - "En cada vuelta de `csv.DictReader`, `fila[\"boleta\"]` va al set y, si `fila[\"estado\"] == \"emitida\"`, `float(fila[\"monto\"])` se suma al total de `fila[\"puesto\"]`."
  - "Las copias que faltan son `set(copias[puesto]) - en_archivo`."
```

## El juez

Como desde la sesión 4, el juez llama a tus funciones y compara lo que devuelven. Aquí los archivos llegan **como texto**: envuélvelo en `io.StringIO(texto)` para que `csv` lo lea como si fuera un archivo abierto.

```exercise
id: py19-juez-resumen
type: judge
mode: function
function: resumen_ventas
title: El resumen del patio de comidas
prompt: |
  **Escribe `resumen_ventas(texto)`, que recibe un CSV de ventas y devuelve una lista `[puesto, unidades, total]` por puesto, del que más vendió al que menos.**

  El CSV tiene el encabezado `puesto,producto,cantidad,precio`. Cada fila vendió `cantidad` unidades a `precio` soles cada una. Por puesto, `unidades` es la suma de las cantidades y `total` la suma de `cantidad × precio`.

  - Ordena por `total`, de mayor a menor; si dos puestos empatan, por nombre del puesto, de la A a la Z.
  - Algunos productos llevan comas y vienen entre comillas.
  - Un CSV con solo el encabezado devuelve `[]`.

  **Restricciones:** de 0 a 25 filas · cantidades de 1 a 6 · precios múltiplos de 0.5, de 1 a 45.
visual:
  figure:
    title: El ejemplo 1
    input: { label: texto, text: "puesto,producto,cantidad,precio\nWálter,Arroz con pato,2,26.00\nCatalina,King Kong de manjar,1,32.00\nWálter,\"Arroz con pato, doble\",1,45.00\nRocío,Cabrito,3,24.00\nCatalina,\"Alfajores, maná y cocadas\",2,18.50" }
    arrow: "DictReader → suma por puesto → sorted(key=(-total, puesto))"
    output: { label: devuelve, table: { head: ["puesto", "unidades", "total"], rows: [["Wálter", "3", "97.0"], ["Rocío", "3", "72.0"], ["Catalina", "3", "69.0"]] } }
starter: |
  import csv
  import io


  def resumen_ventas(texto):
      return []
solution: |
  import csv
  import io
  from collections import defaultdict


  def resumen_ventas(texto):
      unidades = defaultdict(int)
      totales = defaultdict(float)
      for fila in csv.DictReader(io.StringIO(texto)):
          cantidad = int(fila["cantidad"])
          unidades[fila["puesto"]] += cantidad
          totales[fila["puesto"]] += cantidad * float(fila["precio"])
      resumen = [[puesto, unidades[puesto], totales[puesto]] for puesto in totales]
      return sorted(resumen, key=lambda r: (-r[2], r[0]))
hints:
  - "`csv.DictReader(io.StringIO(texto))` te da cada fila como diccionario; `cantidad` y `precio` llegan como texto."
  - "Con dos `defaultdict` sumas unidades y totales; ordena con `key=lambda r: (-r[2], r[0])`."
samples:
  - args: ["puesto,producto,cantidad,precio\nWálter,Arroz con pato,2,26.00\nCatalina,King Kong de manjar,1,32.00\nWálter,\"Arroz con pato, doble\",1,45.00\nRocío,Cabrito,3,24.00\nCatalina,\"Alfajores, maná y cocadas\",2,18.50\n"]
    returns: [["Wálter", 3, 97.0], ["Rocío", 3, 72.0], ["Catalina", 3, 69.0]]
    note: "Wálter: 2 × 26 + 45 = 97. Catalina: 32 + 2 × 18.50 = 69."
  - args: ["puesto,producto,cantidad,precio\nSegundo,Espesado,2,19.00\nHermes,Tortilla de raya,1,22.00\nHermes,Chinguirito,1,16.00\n"]
    returns: [["Hermes", 2, 38.0], ["Segundo", 2, 38.0]]
    note: Empatan en 38; Hermes va primero por nombre.
edge:
  - args: ["puesto,producto,cantidad,precio\n"]
    tag: con solo el encabezado
  - args: ["puesto,producto,cantidad,precio\nHermes,Espesado,1,19.00"]
    tag: con una sola venta y sin salto de línea al final
  - args: ["puesto,producto,cantidad,precio\nWálter,Chinguirito,2,16.00\nCatalina,King Kong,1,32.00\n"]
    tag: con un empate donde el primero en aparecer va segundo
  - args: ["puesto,producto,cantidad,precio\nRocío,\"Cabrito, con frejoles\",2,28.50\nRocío,\"Seco, para llevar\",1,30.00\n"]
    tag: con comas dentro de los productos
  - args: ["puesto,producto,cantidad,precio\nSegundo,Raya,1,10.00\nHermes,Pato,2,5.00\nEufemia,Cocadas,4,2.50\n"]
    tag: con tres puestos empatados
  - args: ["puesto,producto,cantidad,precio\nHermes,Espesado,1,9.00\nCatalina,King Kong,4,30.00\nWálter,Pato,1,45.00\n"]
    tag: con totales de distinta cantidad de cifras
random:
  count: 40
  seed: 1919
  generate: |
    import csv
    import io
    puestos = ["Catalina", "Hermes", "Rocío", "Wálter", "Eufemia", "Segundo"]
    productos = ["King Kong", "Arroz con pato", "Cabrito, con frejoles", "Tortilla de raya",
                 "Espesado", "Pato, arroz y yuca", "Chinguirito"]
    salida = io.StringIO()
    escritor = csv.writer(salida, lineterminator="\n")
    escritor.writerow(["puesto", "producto", "cantidad", "precio"])
    k = rng.int(1, 6)
    for _ in range(rng.int(0, 25)):
        precio = rng.int(1, 18) * 2.5
        escritor.writerow([rng.pick(puestos[:k]), rng.pick(productos), rng.int(1, 6), f"{precio:.2f}"])
    return [salida.getvalue()]
wrong:
  - |
    def resumen_ventas(texto):
        datos = {}
        for linea in texto.strip().split("\n")[1:]:
            puesto, producto, cantidad, precio = linea.split(",")
            u, t = datos.get(puesto, (0, 0))
            datos[puesto] = (u + int(cantidad), t + int(cantidad) * float(precio))
        return sorted(([p, u, t] for p, (u, t) in datos.items()), key=lambda r: (-r[2], r[0]))
  - |
    import csv
    import io


    def resumen_ventas(texto):
        datos = {}
        for fila in csv.DictReader(io.StringIO(texto)):
            u, t = datos.get(fila["puesto"], (0, 0))
            datos[fila["puesto"]] = (u + int(fila["cantidad"]), t + int(fila["cantidad"]) * float(fila["precio"]))
        return sorted(([p, u, t] for p, (u, t) in datos.items()), key=lambda r: r[2], reverse=True)
  - |
    import csv
    import io


    def resumen_ventas(texto):
        datos = {}
        for fila in csv.DictReader(io.StringIO(texto)):
            u, t = datos.get(fila["puesto"], (0, 0))
            datos[fila["puesto"]] = (u + int(fila["cantidad"]), t + int(fila["cantidad"]) * float(fila["precio"]))
        return sorted(([p, u, t] for p, (u, t) in datos.items()), key=lambda r: (r[2], r[0]), reverse=True)
  - |
    import csv
    import io


    def resumen_ventas(texto):
        datos = {}
        for puesto, producto, cantidad, precio in csv.reader(io.StringIO(texto)):
            u, t = datos.get(puesto, (0, 0))
            datos[puesto] = (u + int(cantidad), t + int(cantidad) * float(precio))
        return sorted(([p, u, t] for p, (u, t) in datos.items()), key=lambda r: (-r[2], r[0]))
```

```exercise
id: py19-juez-fiados
type: judge
mode: function
function: fusionar_fiados
title: Los fiados de las dos cajas
prompt: |
  **Escribe `fusionar_fiados(caja_a, caja_b)`, que junta los fiados de dos cajas y devuelve, como texto JSON, cuánto debe todavía cada cliente.**

  En el patio de comidas hay caseros que comen hoy y pagan el viernes. Las dos cajas del mercado anotan esos fiados y exportan un texto JSON cada una: una lista de registros `{"boleta": "F-2", "cliente": "Puicón", "monto": 30.0, "pagado": false}`.

  - Una boleta puede estar **en las dos cajas** (se sincronizan): cuéntala una sola vez, y si los registros no coinciden, vale el de `caja_b`, que es la más nueva.
  - La deuda de un cliente es la suma de los `monto` de sus boletas no pagadas. Los clientes que no deben nada no aparecen.
  - Devuelve exactamente `json.dumps(deudas, ensure_ascii=False, sort_keys=True)`.

  **Restricciones:** de 0 a 14 boletas distintas · montos múltiplos de 0.5, de 1 a 20.
visual:
  figure:
    title: El ejemplo 1
    panes:
      - { label: caja_a, table: { head: ["boleta", "cliente", "monto", "pagado"], rows: [["F-1", "Ñique", "12.5", "false"], ["F-2", "Puicón", "30.0", "false"]] } }
      - { label: caja_b, table: { head: ["boleta", "cliente", "monto", "pagado"], rows: [["F-2", "Puicón", "30.0", "true"], ["F-3", "Ñique", "8.0", "false"], ["F-4", "Chapoñán", "15.5", "false"]] } }
      - { label: devuelve, value: "{\"Chapoñán\": 15.5, \"Ñique\": 20.5}" }
    caption: "La F-2 está en las dos cajas y gana la de `caja_b`: Puicón ya pagó."
starter: |
  import json


  def fusionar_fiados(caja_a, caja_b):
      return "{}"
solution: |
  import json


  def fusionar_fiados(caja_a, caja_b):
      boletas = {}
      for registro in json.loads(caja_a) + json.loads(caja_b):
          boletas[registro["boleta"]] = registro
      deudas = {}
      for registro in boletas.values():
          if not registro["pagado"]:
              cliente = registro["cliente"]
              deudas[cliente] = deudas.get(cliente, 0) + registro["monto"]
      return json.dumps(deudas, ensure_ascii=False, sort_keys=True)
hints:
  - "Un diccionario `boleta → registro` quita los repetidos: si recorres primero `caja_a` y luego `caja_b`, el de `caja_b` pisa al de `caja_a`."
  - "Sin `ensure_ascii=False`, `Ñique` sale como `\\u00d1ique` y el texto ya no es el mismo."
samples:
  - args: ['[{"boleta": "F-1", "cliente": "Ñique", "monto": 12.5, "pagado": false}, {"boleta": "F-2", "cliente": "Puicón", "monto": 30.0, "pagado": false}]', '[{"boleta": "F-2", "cliente": "Puicón", "monto": 30.0, "pagado": true}, {"boleta": "F-3", "cliente": "Ñique", "monto": 8.0, "pagado": false}, {"boleta": "F-4", "cliente": "Chapoñán", "monto": 15.5, "pagado": false}]']
    returns: '{"Chapoñán": 15.5, "Ñique": 20.5}'
    note: El dibujo de arriba.
  - args: ['[{"boleta": "F-7", "cliente": "Tantaleán", "monto": 22.5, "pagado": false}]', '[{"boleta": "F-7", "cliente": "Tantaleán", "monto": 22.5, "pagado": false}]']
    returns: '{"Tantaleán": 22.5}'
    note: La misma boleta en las dos cajas se cuenta una vez.
edge:
  - args: ["[]", "[]"]
    tag: con las dos cajas vacías
  - args: ['[{"boleta": "F-1", "cliente": "Vallejos", "monto": 10.0, "pagado": true}]', "[]"]
    tag: cuando todo está pagado
  - args: ["[]", '[{"boleta": "F-2", "cliente": "Ñique", "monto": 4.0, "pagado": false}, {"boleta": "F-3", "cliente": "Ñique", "monto": 6.5, "pagado": false}]']
    tag: con todo en la segunda caja
  - args: ['[{"boleta": "F-9", "cliente": "Saavedra", "monto": 3.5, "pagado": false}]', '[{"boleta": "F-9", "cliente": "Saavedra", "monto": 3.5, "pagado": true}]']
    tag: cuando la segunda caja ya registró el pago
  - args: ['[{"boleta": "F-1", "cliente": "Vallejos", "monto": 2.0, "pagado": false}, {"boleta": "F-2", "cliente": "Acosta", "monto": 5.0, "pagado": false}]', '[{"boleta": "F-3", "cliente": "Puicón", "monto": 1.5, "pagado": false}]']
    tag: con clientes que hay que ordenar
random:
  count: 40
  seed: 1920
  generate: |
    import json
    clientes = ["Ñique", "Tantaleán", "Chapoñán", "Puicón", "Vallejos", "Saavedra"]
    caja_a, caja_b = [], []
    for n in range(rng.int(0, 14)):
        registro = {"boleta": f"F-{n + 1}", "cliente": rng.pick(clientes),
                    "monto": rng.int(2, 40) / 2, "pagado": rng.int(0, 3) == 0}
        lugar = rng.int(0, 3)
        if lugar == 0:
            caja_a.append(registro)
        elif lugar == 1:
            caja_b.append(registro)
        else:
            caja_a.append(registro)
            copia = dict(registro)
            if rng.int(0, 1) == 0:
                copia["pagado"] = True
            caja_b.append(copia)
    return [json.dumps(caja_a, ensure_ascii=False), json.dumps(rng.shuffle(caja_b), ensure_ascii=False)]
wrong:
  - |
    import json


    def fusionar_fiados(caja_a, caja_b):
        boletas = {r["boleta"]: r for r in json.loads(caja_a) + json.loads(caja_b)}
        deudas = {}
        for r in boletas.values():
            if not r["pagado"]:
                deudas[r["cliente"]] = deudas.get(r["cliente"], 0) + r["monto"]
        return json.dumps(deudas, sort_keys=True)
  - |
    import json


    def fusionar_fiados(caja_a, caja_b):
        deudas = {}
        for r in json.loads(caja_a) + json.loads(caja_b):
            if not r["pagado"]:
                deudas[r["cliente"]] = deudas.get(r["cliente"], 0) + r["monto"]
        return json.dumps(deudas, ensure_ascii=False, sort_keys=True)
  - |
    import json


    def fusionar_fiados(caja_a, caja_b):
        boletas = {r["boleta"]: r for r in json.loads(caja_b) + json.loads(caja_a)}
        deudas = {}
        for r in boletas.values():
            if not r["pagado"]:
                deudas[r["cliente"]] = deudas.get(r["cliente"], 0) + r["monto"]
        return json.dumps(deudas, ensure_ascii=False, sort_keys=True)
```

## Misión final

```exercise
id: py19-mision-comandas
type: mission
title: Las comandas del archivo
prompt: |
  **Lee `pedidos.csv`, sirve los pedidos que no están anulados en orden de hora y anota cada uno en `servidos.txt`.**

  La caja ya no grita los pedidos: los deja en `pedidos.csv`, con las columnas `hora,mesa,plato,estado`. Quilla empieza en la cocina (K) mirando al este, y `llevar(mesa, plato)` ya está escrita: prepara, sirve y vuelve a la cocina.

  1. Lee el archivo con `csv.DictReader` y quédate con las filas cuyo `estado` no es `"anulado"`. Ojo: `mesa` llega como texto.
  2. Ordénalas por `hora` y, si dos tienen la misma hora, primero la mesa de número menor (una tupla como `key`).
  3. Sirve cada una y escribe en `servidos.txt` una línea por pedido servido: `12:05 mesa 1: Tortilla de raya`.

  El archivo cambia en cada prueba. Cuando pase, junto con los jueces, se desbloquea la sesión 20.
visual:
  figure:
    title: El pedidos.csv de la primera prueba
    input: { label: pedidos.csv, table: { head: ["hora", "mesa", "plato", "estado"], rows: [["12:40", "3", "Arroz con pato, sin culantro", "listo"], ["12:05", "1", "Tortilla de raya", "listo"], ["12:20", "5", "Cabrito", "anulado"], ["12:40", "2", "Espesado", "listo"], ["12:15", "4", "King Kong de manjar", "listo"]] } }
    arrow: "sin anulados · sorted(key=(hora, mesa))"
    output: { label: servidos.txt, text: "12:05 mesa 1: Tortilla de raya\n12:15 mesa 4: King Kong de manjar\n12:40 mesa 2: Espesado\n12:40 mesa 3: Arroz con pato, sin culantro" }
files:
  pedidos.csv: |
    hora,mesa,plato,estado
    12:40,3,"Arroz con pato, sin culantro",listo
    12:05,1,Tortilla de raya,listo
    12:20,5,Cabrito,anulado
    12:40,2,Espesado,listo
    12:15,4,King Kong de manjar,listo
starter: |
  import csv


  def media_vuelta():
      robot.girar_derecha()
      robot.girar_derecha()


  def llevar(mesa, plato):
      """Prepara el plato, lo sirve en su mesa y vuelve a la cocina mirando al este."""
      pasos = 2 * mesa - 1
      robot.preparar(plato)
      robot.avanzar(pasos)
      robot.servir()
      media_vuelta()
      robot.avanzar(pasos)
      media_vuelta()


  # TODO: lee pedidos.csv con csv.DictReader y quita los anulados
  # TODO: ordena por hora y, en empate, por número de mesa
  # TODO: sirve cada pedido y anótalo en servidos.txt
solution: |
  import csv


  def media_vuelta():
      robot.girar_derecha()
      robot.girar_derecha()


  def llevar(mesa, plato):
      """Prepara el plato, lo sirve en su mesa y vuelve a la cocina mirando al este."""
      pasos = 2 * mesa - 1
      robot.preparar(plato)
      robot.avanzar(pasos)
      robot.servir()
      media_vuelta()
      robot.avanzar(pasos)
      media_vuelta()


  with open("pedidos.csv", encoding="utf-8", newline="") as archivo:
      pedidos = [fila for fila in csv.DictReader(archivo) if fila["estado"] != "anulado"]
  pedidos.sort(key=lambda p: (p["hora"], int(p["mesa"])))

  with open("servidos.txt", "w", encoding="utf-8") as registro:
      for pedido in pedidos:
          llevar(int(pedido["mesa"]), pedido["plato"])
          registro.write(f"{pedido['hora']} mesa {pedido['mesa']}: {pedido['plato']}\n")
hints:
  - "`[fila for fila in csv.DictReader(archivo) if fila[\"estado\"] != \"anulado\"]` lee y filtra de una vez. Para `llevar`, la mesa va como `int(fila[\"mesa\"])`."
  - "`pedidos.sort(key=lambda p: (p[\"hora\"], int(p[\"mesa\"])))`: las horas `\"12:05\"` se ordenan bien como texto porque todas tienen dos cifras."
world:
  theme: cocina
  level: 4
  dir: E
  map: |
    ############
    #K.........#
    ##1#2#3#4#5#
    ############
scenarios:
  - tests:
      - name: sirve los cuatro pedidos en orden
        state: '[(s.table, s.dish) for s in w.served] == [(1, "Tortilla de raya"), (4, "King Kong de manjar"), (2, "Espesado"), (3, "Arroz con pato, sin culantro")]'
        msg: Los platos servidos no coinciden (mesa, plato u orden). ¿Quitaste el anulado y ordenaste por hora y mesa?
      - name: anota los cuatro en servidos.txt
        expect: 'open("servidos.txt", encoding="utf-8").read().splitlines() == ["12:05 mesa 1: Tortilla de raya", "12:15 mesa 4: King Kong de manjar", "12:40 mesa 2: Espesado", "12:40 mesa 3: Arroz con pato, sin culantro"]'
  - files:
      pedidos.csv: |
        hora,mesa,plato,estado
        13:10,5,"Pepián de pavo, con arroz",listo
        13:02,5,Chinguirito,listo
        13:30,1,Arroz con pato,anulado
        13:25,2,Causa ferreñafana,listo
    tests:
      - name: sirve los pedidos de la tarde
        state: '[(s.table, s.dish) for s in w.served] == [(5, "Chinguirito"), (5, "Pepián de pavo, con arroz"), (2, "Causa ferreñafana")]'
      - name: anota los de la tarde
        expect: 'open("servidos.txt", encoding="utf-8").read().splitlines() == ["13:02 mesa 5: Chinguirito", "13:10 mesa 5: Pepián de pavo, con arroz", "13:25 mesa 2: Causa ferreñafana"]'
  - files:
      pedidos.csv: |
        hora,mesa,plato,estado
        11:55,4,Cabrito,anulado
        11:45,3,Seco de cabrito,listo
    tests:
      - name: sirve solo el que no se anuló
        state: '[(s.table, s.dish) for s in w.served] == [(3, "Seco de cabrito")]'
      - name: anota uno solo
        expect: 'open("servidos.txt", encoding="utf-8").read() == "11:45 mesa 3: Seco de cabrito\n"'
tests:
  - name: termina en la cocina mirando al este
    state: 'w.at_kitchen and w.dir == "E"'
  - name: sin chocar
    state: not w.crashed
  - name: lee con DictReader dentro de un with
    source: '\bwith\s+open\s*\([\s\S]*\bDictReader\s*\('
  - name: ordena con una tupla como key
    source: 'key\s*=\s*lambda\s+\w+\s*:\s*\('
```

## Reto experto

```exercise
id: py19-reto-reporte
type: challenge
title: El reporte para la revisión
visual:
  figure:
    title: ventas_dia, agrupado y escrito
    input: { label: ventas_dia, table: { head: ["puesto", "producto", "cantidad", "precio"], rows: [["Wálter", "Arroz con pato, doble", "1", "45.0"], ["Catalina", "King Kong", "2", "32.0"], ["Wálter", "Chinguirito", "3", "16.0"], ["Wálter", "Arroz con pato, doble", "1", "45.0"]] } }
    arrow: "agrupa · ordena · csv.writer"
    output: { label: devuelve, text: "puesto,producto,cantidad,importe\nCatalina,King Kong,2,64.00\nWálter,\"Arroz con pato, doble\",2,90.00\nWálter,Chinguirito,3,48.00\nTOTAL,,7,202.00" }
prompt: |
  **Escribe `reporte_csv(ventas)`, que devuelve el texto del CSV que don Segundo le entrega al revisor.** Para quien ya programa.

  `ventas` es una lista de diccionarios con `puesto`, `producto`, `cantidad` y `precio` (números).

  - Junta las filas del mismo puesto y producto: suma `cantidad` e `importe` (`cantidad × precio`).
  - Encabezado `puesto,producto,cantidad,importe`. Filas ordenadas por puesto (A a Z), luego por importe (de mayor a menor), luego por producto.
  - Al final, `TOTAL,,<unidades>,<importe total>`. Los importes con dos decimales.
  - Escríbelo con `csv.writer` sobre un `io.StringIO`, con `lineterminator="\n"`: así los productos con comas salen entre comillas.
globals:
  ventas_dia:
    - { puesto: Wálter, producto: "Arroz con pato, doble", cantidad: 1, precio: 45.0 }
    - { puesto: Catalina, producto: King Kong, cantidad: 2, precio: 32.0 }
    - { puesto: Wálter, producto: Chinguirito, cantidad: 3, precio: 16.0 }
    - { puesto: Wálter, producto: "Arroz con pato, doble", cantidad: 1, precio: 45.0 }
starter: |
  import csv
  import io


  def reporte_csv(ventas):
      return ""


  print(reporte_csv(ventas_dia))
solution: |
  import csv
  import io
  from collections import defaultdict


  def reporte_csv(ventas):
      cantidades = defaultdict(int)
      importes = defaultdict(float)
      for venta in ventas:
          clave = (venta["puesto"], venta["producto"])
          cantidades[clave] += venta["cantidad"]
          importes[clave] += venta["cantidad"] * venta["precio"]
      orden = sorted(importes, key=lambda c: (c[0], -importes[c], c[1]))
      salida = io.StringIO()
      escritor = csv.writer(salida, lineterminator="\n")
      escritor.writerow(["puesto", "producto", "cantidad", "importe"])
      for puesto, producto in orden:
          clave = (puesto, producto)
          escritor.writerow([puesto, producto, cantidades[clave], f"{importes[clave]:.2f}"])
      escritor.writerow(["TOTAL", "", sum(cantidades.values()), f"{sum(importes.values()):.2f}"])
      return salida.getvalue()


  print(reporte_csv(ventas_dia))
hints:
  - "Una tupla `(puesto, producto)` sirve de clave para agrupar con `defaultdict`."
  - "`csv.writer(salida, lineterminator=\"\\n\")` y al final `salida.getvalue()`."
tests:
  - name: el reporte del dibujo
    run: reporte_csv(ventas_dia)
    equals: "puesto,producto,cantidad,importe\nCatalina,King Kong,2,64.00\nWálter,\"Arroz con pato, doble\",2,90.00\nWálter,Chinguirito,3,48.00\nTOTAL,,7,202.00\n"
  - name: sin ventas
    run: reporte_csv([])
    equals: "puesto,producto,cantidad,importe\nTOTAL,,0,0.00\n"
  - name: empate de importe, por producto
    run: 'reporte_csv([{"puesto": "Rocío", "producto": "Seco", "cantidad": 1, "precio": 30.0}, {"puesto": "Rocío", "producto": "Cabrito", "cantidad": 2, "precio": 15.0}, {"puesto": "Hermes", "producto": "Raya", "cantidad": 1, "precio": 22.5}])'
    equals: "puesto,producto,cantidad,importe\nHermes,Raya,1,22.50\nRocío,Cabrito,2,30.00\nRocío,Seco,1,30.00\nTOTAL,,4,82.50\n"
  - name: se lee de vuelta con csv
    expect: 'list(csv.reader(io.StringIO(reporte_csv(ventas_dia))))[2] == ["Wálter", "Arroz con pato, doble", "2", "90.00"]'
  - name: usa csv.writer
    source: '\bcsv\.writer\s*\('
```
