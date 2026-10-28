# Sesión 4 — Funciones

## El encargo

Domingo, mediodía, en el malecón de Chorrillos. **El Bote de Tito** es una cevichería de seis mesas pegada al muelle de pescadores: el pescado llega a las once, a las doce ya hay cola y a la una ya no queda jalea. Tito Panta cocina, su hija Yesenia cobra y el mozo renunció el viernes para irse a correr olas a Punta Hermosa.

Maru le atornilló a Quilla un **brazo con bandeja** y lo mandó en combi. El problema: llevar un plato a una mesa son seis o siete instrucciones, y un domingo salen cincuenta platos. Copiar y pegar 300 líneas no es programar. Hoy Quilla aprende a **ponerle nombre a una rutina**, darle datos y recibir un resultado.

```escena
theme: cocina
level: 4
dir: E
caption: El Bote de Tito. Quilla prepara en la cocina (K), sirve la mesa 2 en el salón y baja a la terraza a servir la mesa 5.
map: |
  ##########
  #K......##
  #.#1#2#3##
  #.########
  #.......##
  ##4#5#6###
  ##########
program: |
  robot.preparar("ceviche")
  robot.avanzar(4)
  robot.servir()
  robot.girar_derecha()
  robot.girar_derecha()
  robot.avanzar(4)
  robot.girar_izquierda()
  robot.preparar("jalea")
  robot.avanzar(3)
  robot.girar_izquierda()
  robot.avanzar(3)
  robot.servir()
```

## Lo mínimo

Una **función** es un bloque de código con nombre. Se define con `def`, recibe datos por sus **parámetros** y entrega un resultado con **`return`**. Definirla no la ejecuta: se ejecuta cada vez que la **llamas** con paréntesis.

```py run
def subtotal(precio, cantidad=1):
    """Lo que cuesta un plato pedido varias veces."""
    return precio * cantidad

print(subtotal(36, 2))
print(subtotal(45))
print(subtotal(cantidad=3, precio=9))
```

Mira qué pasa cuando una función llama a otra: cada llamada abre una caja en la **pila de llamadas** con sus parámetros, y al llegar al `return` la caja se cierra y le entrega su valor a quien la llamó.

```anima
title: Una llamada es una caja con entradas y una salida
code: |
  def subtotal(precio, cantidad):
      return precio * cantidad

  def cuenta(precio, cantidad, propina=0.1):
      base = subtotal(precio, cantidad)
      return base + base * propina

  total = cuenta(40, 2)
  print(total)
notes:
  1: "def solo guarda la receta con su nombre; todavía no se ejecuta nada."
  8: "Se llama a cuenta con 40 y 2; propina no vino, así que vale 0.1."
  5: "cuenta llama a subtotal: la pila crece una caja."
  2: "subtotal devuelve 80 y su caja se cierra."
  6: "base vale 80; cuenta devuelve 88.0 a la línea 8."
  9: "total guarda lo que devolvió cuenta."
```

Lo que necesitas para hoy:

- **Sin `return`, la función devuelve `None`.** `print` muestra algo en la consola, pero no se lo entrega al programa: para usar un resultado, devuélvelo.
- **Valores por defecto**: `cantidad=1` se usa cuando no te pasan ese argumento. Van al final de la lista de parámetros.
- **Argumentos con nombre**: `subtotal(cantidad=3, precio=9)`. Con nombre, el orden da igual y la llamada se lee sola.
- **`*args` y `**kwargs`**: un parámetro con `*` recoge en una **tupla** los argumentos sueltos que sobran; uno con `**` recoge en un **diccionario** los que vienen con nombre.
- **Docstring**: el texto entre `"""` justo debajo del `def` explica qué hace la función. `help(subtotal)` lo muestra.
- **Variables locales**: lo que asignas dentro de una función vive solo ahí y desaparece al terminar. Puedes **leer** una variable de afuera (global), pero si le asignas algo dentro, Python la trata como local en toda la función.

```py run
def anotar(mesa, *platos, **extras):
    print(mesa, platos, extras)

anotar(4, "ceviche", "chicha", sin_cebolla=True)
anotar(6)
```

```py run
propina = 0.1  # global: se ve desde todas partes

def con_igv(monto):
    igv = monto * 0.18  # local: solo existe aquí dentro
    return monto + igv

print(con_igv(100), propina)
```

Cada llamada a una función abre su propio **cuarto**, y al terminar lo cierra. Desde adentro puedes mirar hacia el cuarto de afuera, pero desde afuera no ves lo de adentro:

```alcance
title: Una llamada abre un cuarto y lo cierra al terminar
speed: 3600
steps:
  - note: "Antes de llamar solo existe el cuarto global, con `propina` y la función `con_igv`."
    rooms:
      - { id: g, name: global, vars: { propina: 0.1 }, fns: [{ name: con_igv }] }
  - note: "`con_igv(100)` abre un cuarto nuevo con `monto` e `igv`. Desde adentro lees `propina`, que vive afuera; desde global, `igv` no existe."
    rooms:
      - id: g
        name: global
        vars: { propina: 0.1 }
        fns: [{ name: con_igv }]
        rooms:
          - { id: c, name: "con_igv(100)", on: true, vars: { monto: 100, igv: "18.0" }, up: "Si falta un nombre, lo busca en global." }
  - note: "Con el `return` la llamada termina y su cuarto se descarta: `monto` e `igv` desaparecen. Lo único que sale es el valor devuelto."
    rooms:
      - id: g
        name: global
        vars: { propina: 0.1 }
        fns: [{ name: con_igv }]
        rooms:
          - { id: c, name: "con_igv(100)", gone: true, vars: { monto: 100, igv: "18.0" } }
```

La regla que más confunde: si **asignas** un nombre dentro de una función, Python lo trata como local en **todo** ese cuarto, incluso en las líneas anteriores a la asignación.

```py
contador = 0

def sumar():
    contador += 1   # asigna: contador es local aquí

sumar()
```

```alcance
title: Por qué sumar() da UnboundLocalError
note: "Como `sumar` asigna `contador`, Python decide que es **local de su cuarto**. Para hacer `+ 1` primero lo lee, pero ese `contador` local todavía no tiene valor, y no mira el de global. Si solo quisieras **leerlo**, sí lo encontraría afuera."
rooms:
  - id: g
    name: global
    vars: { contador: 0 }
    fns: [{ name: sumar }]
    rooms:
      - { id: s, name: "sumar()", on: true, bad: "UnboundLocalError: contador se lee antes de tener valor" }
```

> **Trampa común:** el valor por defecto se crea **una sola vez**, cuando Python lee el `def`, no en cada llamada. Si es una lista (`def f(platos=[])`) y la función la modifica, todas las llamadas comparten esa misma lista y los platos de una mesa aparecen en la siguiente. Usa `None` como valor por defecto y crea la lista dentro.

<!-- legacy: mutable-default -->

<!-- mdn: keyword-args mutable-default args-kwargs -->

## Práctica

```exercise
id: py4-predice-none
type: predict
title: El limón que no llegó
prompt: |
  Tito pidió una función que calcule cuántos limones lleva una tanda de ceviche. ¿Qué imprime?
code: |
  def limones_para(platos):
      print(platos * 6)

  total = limones_para(4)
  print("Total:", total)
options:
  - "24\nTotal: None"
  - "Total: 24"
  - "24\nTotal: 24"
  - "Total: None"
answer: "24\nTotal: None"
explain: |
  `limones_para` **imprime** 24, pero no tiene `return`, así que devuelve `None`. Por eso `total` vale `None`. Con `return platos * 6` en lugar del `print`, la salida sería solo `Total: 24`.
```

```exercise
id: py4-predice-nombres
type: predict
title: El pedido con nombre
prompt: |
  Yesenia anota los pedidos con una función que tiene valores por defecto. ¿Qué imprime?
code: |
  def pedido(plato, cantidad=1, picante="normal"):
      return f"{cantidad} {plato} ({picante})"

  print(pedido("jalea"))
  print(pedido("ceviche", picante="bravo"))
  print(pedido(cantidad=2, plato="sudado"))
options:
  - "1 jalea (normal)\n1 ceviche (bravo)\n2 sudado (normal)"
  - "1 jalea (normal)\nbravo ceviche (normal)\n2 sudado (normal)"
  - "jalea\n1 ceviche (bravo)\n2 sudado (normal)"
  - "1 jalea (normal)\n1 ceviche (bravo)\nsudado 2 (normal)"
answer: "1 jalea (normal)\n1 ceviche (bravo)\n2 sudado (normal)"
explain: |
  Lo que no se pasa toma su valor por defecto. `picante="bravo"` va directo a `picante` aunque se salte `cantidad`, y en la última llamada los nombres mandan: el orden en que los escribas da igual.
```

```exercise
id: py4-predice-comanda
type: predict
title: La comanda que se repite
prompt: |
  Esta función arma la comanda de cada mesa. La mesa 1 pide ceviche y la mesa 2 pide jalea. ¿Qué imprime?
code: |
  def nueva_comanda(plato, comanda=[]):
      comanda.append(plato)
      return comanda

  mesa_1 = nueva_comanda("ceviche")
  mesa_2 = nueva_comanda("jalea")
  print(mesa_1)
  print(mesa_2)
options:
  - "['ceviche', 'jalea']\n['ceviche', 'jalea']"
  - "['ceviche']\n['jalea']"
  - "['ceviche']\n['ceviche', 'jalea']"
  - "['jalea']\n['jalea']"
answer: "['ceviche', 'jalea']\n['ceviche', 'jalea']"
explain: |
  La lista `[]` del valor por defecto se creó **una sola vez**, al leer el `def`. Las dos llamadas le agregan a la misma lista y devuelven esa misma lista: `mesa_1` y `mesa_2` son dos nombres para ella. Con `comanda=None` y `if comanda is None: comanda = []` dentro, cada mesa tendría la suya.
```

```exercise
id: py4-completa-anotar
type: complete
title: La libreta de Yesenia
prompt: |
  `anotar_pedido` recibe la mesa, **cualquier cantidad de platos** y **cualquier cantidad de pedidos especiales con nombre** (`sin_cebolla=True`, `para_llevar=True`…). Completa los `___` para que `platos` junte los platos en una tupla y `extras` junte los pedidos especiales en un diccionario.
starter: |
  def anotar_pedido(mesa, ___platos, ___extras):
      """Devuelve la línea de la libreta para una mesa."""
      return f"Mesa {mesa}, platos: {len(platos)}, extras: {extras}"

  print(anotar_pedido(7, "ceviche", "jalea", "chicha", sin_cebolla=True))
  print(anotar_pedido(2))
solution: |
  def anotar_pedido(mesa, *platos, **extras):
      """Devuelve la línea de la libreta para una mesa."""
      return f"Mesa {mesa}, platos: {len(platos)}, extras: {extras}"

  print(anotar_pedido(7, "ceviche", "jalea", "chicha", sin_cebolla=True))
  print(anotar_pedido(2))
hints:
  - Un asterisco junta los argumentos sueltos; dos asteriscos juntan los que vienen con nombre.
tests:
  - name: tres platos y un extra
    run: anotar_pedido(7, "ceviche", "jalea", "chicha", sin_cebolla=True)
    equals: "Mesa 7, platos: 3, extras: {'sin_cebolla': True}"
  - name: una mesa sin nada
    run: anotar_pedido(2)
    equals: "Mesa 2, platos: 0, extras: {}"
  - name: dos extras con nombre
    run: anotar_pedido(5, "sudado", para_llevar=True, cubiertos=2)
    equals: "Mesa 5, platos: 1, extras: {'para_llevar': True, 'cubiertos': 2}"
  - name: la consola muestra las dos líneas
    output: "Mesa 7, platos: 3, extras: {'sin_cebolla': True}\nMesa 2, platos: 0, extras: {}"
```

```exercise
id: py4-arregla-limones
type: fix
title: Los limones que nadie restó
prompt: |
  En la cocina quedan 60 limones y cada ceviche lleva 4. Esta función debería descontar los limones de 5 ceviches, pero el programa se cae. Ejecútalo y lee el error.

  Arréglalo sin `global`: haz que `exprimir(limones, platos)` **reciba** los limones que hay y **devuelva** cuántos quedan, y guarda el resultado afuera, en `limones`.
starter: |
  limones = 60  # los que quedan en la cocina

  def exprimir(platos):
      limones = limones - platos * 4
      return limones

  exprimir(5)
  print("Quedan", limones, "limones")
solution: |
  limones = 60  # los que quedan en la cocina

  def exprimir(limones, platos):
      return limones - platos * 4

  limones = exprimir(limones, 5)
  print("Quedan", limones, "limones")
hints:
  - "Como `exprimir` le asigna a `limones`, Python la trata como una variable local en toda la función, y la lee antes de tener valor: `UnboundLocalError`."
  - "Pásale los limones como parámetro y guarda lo que devuelve: `limones = exprimir(limones, 5)`."
tests:
  - name: exprimir(60, 5) devuelve 40
    run: exprimir(60, 5)
    equals: 40
  - name: exprimir(10, 0) devuelve 10
    run: exprimir(10, 0)
    equals: 10
  - name: limones queda en 40
    expect: limones == 40
  - name: la consola lo dice
    output: Quedan 40 limones
  - name: sin global
    sourceNot: '\bglobal\b'
    msg: No uses global. Pasa los limones como parámetro y devuelve el resultado.
```

```exercise
id: py4-escribe-porciones
type: write
title: ¿Cuántos ceviches salen?
prompt: |
  Escribe dos funciones, **cada una con su docstring**:

  - `porciones(pescado_g, por_plato=180)`: cuántos platos completos salen con `pescado_g` gramos de pescado, si cada plato lleva `por_plato` gramos (180 si no te lo dicen).
  - `platos_posibles(pescado_g, limones)`: cuántos ceviches se pueden servir de verdad. Cada ceviche necesita su porción de pescado **y 5 limones**, así que manda lo que se acabe primero. Usa `porciones` dentro.

  `min(a, b)` te da el menor de dos números.
visual:
  figure:
    title: platos_posibles(2000, 30)
    input: { label: En la cocina, cards: [{ title: despensa, rows: [["pescado", "2000 g"], ["limones", "30"]] }] }
    arrow: "porciones(2000) = 11 · 30 // 5 = 6 · el menor"
    output: { label: devuelve, value: "6" }
    steps:
      - "Alcanza pescado para 11 ceviches, pero limones solo para 6: salen 6."
starter: |
  def porciones(pescado_g, por_plato=180):
      pass


  def platos_posibles(pescado_g, limones):
      pass


  print(platos_posibles(2000, 30))
solution: |
  def porciones(pescado_g, por_plato=180):
      """Cuántos platos completos salen con ese pescado, en gramos."""
      return pescado_g // por_plato


  def platos_posibles(pescado_g, limones):
      """Cuántos ceviches se pueden servir: manda lo que se acabe primero."""
      return min(porciones(pescado_g), limones // 5)


  print(platos_posibles(2000, 30))
hints:
  - "`//` cuenta cuántas veces cabe un número en otro, sin decimales."
  - "`platos_posibles` puede devolver `min(porciones(pescado_g), limones // 5)`."
tests:
  - name: porciones(1000) es 5
    run: porciones(1000)
    equals: 5
  - name: porciones(1000, por_plato=250) es 4
    run: porciones(1000, por_plato=250)
    equals: 4
  - name: faltan limones
    run: platos_posibles(2000, 30)
    equals: 6
  - name: falta pescado
    run: platos_posibles(900, 100)
    equals: 5
  - name: sin pescado no hay ceviche
    run: platos_posibles(100, 50)
    equals: 0
  - name: las dos tienen docstring
    expect: porciones.__doc__ is not None and platos_posibles.__doc__ is not None
    msg: Pon un texto entre """ justo debajo de cada def.
  - name: platos_posibles usa porciones
    source: 'def\s+platos_posibles[\s\S]*\bporciones\s*\('
    msg: No repitas la cuenta del pescado; llama a porciones dentro de platos_posibles.
```

## El caso

```exercise
id: py4-caso-propina
type: case
title: La propina repartida
prompt: |
  **Escribe `cuota(platos, propina=0.1)`, que devuelve lo que le toca pagar a una persona: la suma de sus platos más la propina, y compárala con lo que pagó cada uno.**

  Cinco exalumnos del colegio de Chorrillos celebraron en El Bote de Tito. Acordaron que cada uno paga **lo suyo más el 10 % de propina**, menos **Renzo, que cumple años y no paga propina** (llámala con `propina=0`). Al cerrar la caja, Yesenia contó y faltaba plata: alguien pagó de menos.

  Imprime una línea por persona que empiece con su nombre, con la cuota redondeada a dos decimales al final: `print("Kiara:", round(cuota(platos_kiara), 2))`. El tablero la compara con lo que pagó.
visual:
  board:
    for: py4-caso-propina
    task: "Cuota = suma de sus platos + 10 % de propina (Renzo, sin propina). Compárala con lo que pagó."
    cards:
      - name: Kiara
        kind: person
        rows: [["Pidió", "ceviche, chicha"], ["Pagó", "S/ 49.50"]]
        clue: { find: "Kiara", says: 49.5, saysLabel: Pagó }
      - name: Renzo
        kind: person
        role: El cumpleañero
        rows: [["Pidió", "jalea, chilcano"], ["Pagó", "S/ 59"]]
        clue: { find: "Renzo", says: 59, saysLabel: Pagó }
      - name: Milagros
        kind: person
        rows: [["Pidió", "tiradito, sudado"], ["Pagó", "S/ 79.20"]]
        clue: { find: "Milagros", says: 79.2, saysLabel: Pagó }
      - name: Jhon
        kind: person
        culprit: true
        rows: [["Pidió", "ceviche, jalea, chicha"], ["Pagó", "S/ 95"]]
        clue: { find: "Jhon", says: 95, saysLabel: Pagó }
      - name: Fiorella
        kind: person
        rows: [["Pidió", "sudado, chilcano, chicha"], ["Pagó", "S/ 69.30"]]
        clue: { find: "Fiorella", says: 69.3, saysLabel: Pagó }
      - name: La carta
        kind: note
        role: Pizarra de El Bote de Tito
        rows: [["Ceviche", "S/ 36"], ["Jalea", "S/ 45"], ["Tiradito", "S/ 32"], ["Sudado", "S/ 40"], ["Chilcano", "S/ 14"], ["Chicha", "S/ 9"]]
    caption: "Si Renzo no cuadra, revisa si le cobraste propina al cumpleañero."
starter: |
  # Lo que pidió cada uno, con los precios de la carta
  platos_kiara = [36, 9]          # ceviche, chicha
  platos_renzo = [45, 14]         # jalea, chilcano (cumpleañero: sin propina)
  platos_milagros = [32, 40]      # tiradito, sudado
  platos_jhon = [36, 45, 9]       # ceviche, jalea, chicha
  platos_fiorella = [40, 14, 9]   # sudado, chilcano, chicha

  # sum(lista) suma todos los números de una lista:
  print("Kiara consumió", sum(platos_kiara))

  # TODO: escribe cuota(platos, propina=0.1) con def y return

  # TODO: imprime una línea por persona, por ejemplo:
  # print("Kiara:", round(cuota(platos_kiara), 2))
solution: |
  platos_kiara = [36, 9]
  platos_renzo = [45, 14]
  platos_milagros = [32, 40]
  platos_jhon = [36, 45, 9]
  platos_fiorella = [40, 14, 9]


  def cuota(platos, propina=0.1):
      """Lo que paga una persona: sus platos más la propina."""
      consumo = sum(platos)
      return consumo + consumo * propina


  print("Kiara:", round(cuota(platos_kiara), 2))
  print("Renzo:", round(cuota(platos_renzo, propina=0), 2))
  print("Milagros:", round(cuota(platos_milagros), 2))
  print("Jhon:", round(cuota(platos_jhon), 2))
  print("Fiorella:", round(cuota(platos_fiorella), 2))
answer: Jhon
answerLabel: ¿Quién pagó de menos?
reveal: |
  Jhon. Consumió `36 + 45 + 9 = 90`, con el 10 % son 99.0, y pagó 95: cuatro soles menos. Renzo pagó 59 justos porque, como cumpleañero, `cuota(platos_renzo, propina=0)` no le suma propina.
hints:
  - "Dentro de `cuota`: `consumo = sum(platos)` y luego `return consumo + consumo * propina`."
  - "Para Renzo, nombra el argumento al llamar: `cuota(platos_renzo, propina=0)`."
```

## El juez

Desde esta sesión el juez cambia de forma: ya no lee la entrada con `input()` ni mira lo que imprimes. **Llama a tus funciones** con unos argumentos y compara lo que **devuelven**, como en LeetCode. Por eso puede juzgar cada función por separado, y por eso tienen que llamarse exactamente como dice el enunciado. Lo que imprimas con `print` no cuenta: lo que cuenta es el `return`.

```exercise
id: py4-juez-cuenta
type: judge
mode: function
function: cuenta_mesa
tolerance: 0.000001
title: La cuenta de la mesa
prompt: |
  **Escribe `cuenta_mesa(platos, propina=0.1, personas=1)`, que devuelve cuánto paga cada persona de una mesa, y sus dos ayudantes `subtotal` y `con_propina`.**

  Yesenia quiere que Quilla cobre. Cada mesa llega como una lista de pares `[precio, cantidad]`: `[[36, 2], [9, 3]]` son dos platos de 36 soles y tres de 9. Escribe tres funciones; el juez prueba las tres:

  - `subtotal(platos)`: la suma de `precio × cantidad` de todos los pares. `for precio, cantidad in platos:` saca los dos números de cada par.
  - `con_propina(monto, propina=0.1)`: el monto más la propina, que es una **fracción** del monto (`0.1` es el 10 %). Si no te la pasan, es 0.1.
  - `cuenta_mesa(platos, propina=0.1, personas=1)`: el subtotal con propina, **dividido entre las personas** que pagan. Usa las dos de arriba.

  El juez acepta diferencias de decimales minúsculas (hasta 0.000001), así que no redondees.

  **Restricciones:** de 0 a 6 pares por mesa · precios de 5 a 60 · cantidades de 0 a 5 · propina de 0 a 0.2 · de 1 a 8 personas.
visual:
  figure:
    title: El ejemplo 1, como cuenta
    input: { label: "cuenta_mesa([[36, 2], [9, 3]], 0.1, 3)", receipt: { title: EL BOTE DE TITO, rows: [["2 × 36", "72"], ["3 × 9", "27"]], totalLabel: "subtotal", total: "99" } }
    arrow: "con_propina(99, 0.1) = 108.9 · entre 3 personas"
    output: { label: devuelve, value: "36.3" }
    steps:
      - "`subtotal` suma 72 + 27 = 99."
      - "`con_propina` le suma el 10 %: 99 + 9.9 = 108.9."
      - "`cuenta_mesa` lo divide entre 3: cada uno paga 36.3."
starter: |
  def subtotal(platos):
      pass


  def con_propina(monto, propina):
      pass


  def cuenta_mesa(platos, propina, personas):
      pass
solution: |
  def subtotal(platos):
      """Suma precio × cantidad de cada par [precio, cantidad]."""
      total = 0
      for precio, cantidad in platos:
          total += precio * cantidad
      return total


  def con_propina(monto, propina=0.1):
      """El monto más la propina, que es una fracción del monto."""
      return monto + monto * propina


  def cuenta_mesa(platos, propina=0.1, personas=1):
      """Lo que paga cada persona de la mesa."""
      return con_propina(subtotal(platos), propina) / personas
hints:
  - "Los valores por defecto van en la firma: `def con_propina(monto, propina=0.1):`."
  - "`cuenta_mesa` no necesita sumar nada: `return con_propina(subtotal(platos), propina) / personas`."
samples:
  - args: [[[36, 2], [9, 3]], 0.1, 3]
    returns: 36.3
    note: "99 de consumo, más el 10 % son 108.9, entre 3 personas."
  - args: [[[45, 1], [14, 2]]]
    returns: 80.3
    note: Sin propina ni personas; los valores por defecto ponen 0.1 y 1.
  - fn: con_propina
    args: [50]
    returns: 55.0
    note: Las ayudantes también se juzgan solas.
  - fn: subtotal
    args: [[[32, 2], [40, 1]]]
    returns: 104
edge:
  - args: [[]]
    tag: con una mesa sin pedidos
  - args: [[], 0.1, 4]
    tag: con una mesa sin pedidos y varias personas
  - args: [[[40, 1]], 0]
    tag: sin propina
  - args: [[[40, 1], [9, 2]], 0, 2]
    tag: sin propina y entre dos
  - args: [[[60, 5], [60, 5], [60, 5], [60, 5], [60, 5], [60, 5]], 0.2, 8]
    tag: con la mesa más cara y la propina más alta
  - args: [[[12, 0], [30, 1]], 0.15]
    tag: con un plato de cantidad cero
  - fn: subtotal
    args: [[]]
    tag: en subtotal, sin pares
  - fn: subtotal
    args: [[[9, 0]]]
    tag: en subtotal, con cantidad cero
  - fn: con_propina
    args: [80, 0.2]
    tag: en con_propina, con otra propina
  - fn: con_propina
    args: [0]
    tag: en con_propina, con monto cero
random:
  count: 40
  seed: 404
  generate: |
    platos = [[rng.int(5, 60), rng.int(0, 5)] for _ in range(rng.int(0, 6))]
    propina = rng.pick([0, 0.05, 0.1, 0.15, 0.2])
    return [platos, propina, rng.int(1, 8)]
wrong:
  - |
    def subtotal(platos):
        total = 0
        for precio, cantidad in platos:
            total += precio * cantidad
        return total


    def con_propina(monto, propina):
        return monto + monto * propina


    def cuenta_mesa(platos, propina, personas):
        return con_propina(subtotal(platos), propina) / personas
  - |
    def subtotal(platos):
        total = 0
        for precio, cantidad in platos:
            total += precio * cantidad
        return total


    def con_propina(monto, propina=0.1):
        return monto + propina


    def cuenta_mesa(platos, propina=0.1, personas=1):
        return con_propina(subtotal(platos), propina) / personas
  - |
    def subtotal(platos):
        total = 0
        for precio, cantidad in platos:
            total += precio
        return total


    def con_propina(monto, propina=0.1):
        return monto + monto * propina


    def cuenta_mesa(platos, propina=0.1, personas=1):
        return con_propina(subtotal(platos), propina) / personas
  - |
    def subtotal(platos):
        total = 0
        for precio, cantidad in platos:
            total += precio * cantidad
        return total


    def con_propina(monto, propina=0.1):
        return monto + monto * propina


    def cuenta_mesa(platos, propina=0.1, personas=1):
        consumo = subtotal(platos)
        return consumo + consumo * propina / personas
```

## Misión final

```exercise
id: py4-mision-bote
type: mission
title: Domingo en El Bote de Tito
prompt: |
  **Escribe `atender(mesa, plato)`, que lleva un plato a su mesa y vuelve a la cocina, y úsala para atender todos los `pedidos` en orden.**

  Quilla empieza en la cocina (K) mirando al este. El Bote de Tito tiene dos pisos:

  - **El salón** (mesas 1, 2 y 3) queda debajo del pasillo de arriba: la mesa `n` está a `2 × n` pasos al este de la cocina.
  - **La terraza** (mesas 4, 5 y 6) queda debajo del pasillo de abajo. Para llegar, Quilla baja 3 casillas al sur y gira al este; desde ahí, la mesa `n` está a `2 × (n − 4) + 1` pasos.

  `robot.preparar(plato)` pone el plato en la bandeja (solo en la cocina, y cabe uno) y `robot.servir()` lo deja en la mesa de abajo.

  1. Completa `pasos_hasta(mesa)`, que devuelve los pasos de la tabla.
  2. Completa `atender(mesa, plato)`: prepara, lleva, sirve y **vuelve a la cocina mirando al este**. `ida_y_vuelta` ya está escrita: úsala.
  3. Atiende cada pedido con un bucle. `pedidos` es una lista de pares `[mesa, plato]` que cambia en cada prueba; `for mesa, plato in pedidos:` saca los dos datos de cada par.

  Cuando pase, junto con el juez, se desbloquea la sesión 5.
visual:
  figure:
    title: Cuántos pasos hay hasta cada mesa
    panes:
      - label: Salón (pasillo de arriba)
        table: { head: ["mesa", "pasos al este"], rows: [["1", "2"], ["2", "4"], ["3", "6"]] }
      - label: Terraza (bajando 3 al sur)
        table: { head: ["mesa", "pasos al este"], rows: [["4", "1"], ["5", "3"], ["6", "5"]] }
starter: |
  # pedidos llega de la caja, por ejemplo: [[3, "ceviche"], [5, "jalea"]]

  def media_vuelta():
      robot.girar_derecha()
      robot.girar_derecha()


  def ida_y_vuelta(pasos):
      """Avanza, sirve y regresa al punto de partida, mirando hacia donde miraba."""
      robot.avanzar(pasos)
      robot.servir()
      media_vuelta()
      robot.avanzar(pasos)
      media_vuelta()


  def pasos_hasta(mesa):
      """Pasos al este desde el inicio del pasillo de esa mesa."""
      pass


  def atender(mesa, plato):
      # prepara, lleva, sirve, vuelve a la cocina mirando al este
      pass
solution: |
  def media_vuelta():
      robot.girar_derecha()
      robot.girar_derecha()


  def ida_y_vuelta(pasos):
      """Avanza, sirve y regresa al punto de partida, mirando hacia donde miraba."""
      robot.avanzar(pasos)
      robot.servir()
      media_vuelta()
      robot.avanzar(pasos)
      media_vuelta()


  def pasos_hasta(mesa):
      """Pasos al este desde el inicio del pasillo de esa mesa."""
      if mesa <= 3:
          return 2 * mesa
      return 2 * (mesa - 4) + 1


  def atender(mesa, plato):
      robot.preparar(plato)
      if mesa <= 3:
          ida_y_vuelta(pasos_hasta(mesa))
      else:
          robot.girar_derecha()
          robot.avanzar(3)
          robot.girar_izquierda()
          ida_y_vuelta(pasos_hasta(mesa))
          robot.girar_izquierda()
          robot.avanzar(3)
          robot.girar_derecha()


  for mesa, plato in pedidos:
      atender(mesa, plato)
hints:
  - "Para la terraza: mirando al este, `girar_derecha` te deja mirando al sur; después de bajar, `girar_izquierda` te deja mirando al este otra vez. Para volver, lo mismo al revés."
  - "`ida_y_vuelta` te devuelve al mismo sitio y mirando igual, así que solo tienes que deshacer la bajada."
world:
  theme: cocina
  level: 4
  dir: E
  map: |
    ##########
    #K......##
    #.#1#2#3##
    #.########
    #.......##
    ##4#5#6###
    ##########
globals:
  pedidos:
    - [3, ceviche]
    - [5, jalea]
    - [1, chicha morada]
scenarios:
  - {}
  - globals:
      pedidos:
        - [4, sudado]
        - [2, tiradito]
        - [6, ceviche]
        - [2, chilcano]
        - [5, arroz con mariscos]
  - globals:
      pedidos:
        - [6, jalea]
tests:
  - name: atender es una función
    expect: callable(atender)
  - name: pasos_hasta da los pasos de la tabla
    expect: '[pasos_hasta(m) for m in range(1, 7)] == [2, 4, 6, 1, 3, 5]'
    msg: "Salón: 2 × mesa. Terraza: 2 × (mesa − 4) + 1."
  - name: cada pedido llega a su mesa, en orden
    state: 'len(w.served) == len(g["pedidos"]) and all(s.table == m and s.dish == p for s, (m, p) in zip(w.served, g["pedidos"]))'
    msg: Los platos servidos no coinciden con los pedidos (mesa, plato u orden).
  - name: termina en la cocina mirando al este
    state: 'w.at_kitchen and w.dir == "E"'
  - name: sin chocar
    state: not w.crashed
  - name: usa atender dentro de un bucle
    source: '\b(for|while)\b[\s\S]*\batender\s*\('
    msg: Llama a atender desde un bucle que recorra pedidos.
```

## Reto experto

```exercise
id: py4-reto-comanda
type: challenge
title: La comanda para la cocina
visual:
  figure:
    title: Lo que recibe y lo que devuelve
    input: { label: llamada, text: "comanda(4, \"ceviche\", \"jalea\", sin_cebolla=\"ceviche\")" }
    arrow: "*platos y **notas"
    output: { label: devuelve, text: "Mesa 4 (2 platos)\n- ceviche\n- jalea\n  sin cebolla: ceviche" }
prompt: |
  **Escribe `comanda(mesa, *platos, **notas)`, que devuelve el papelito que Tito cuelga en la cocina, como un solo texto con saltos de línea.** Para quien ya programa.

  - Primera línea: `Mesa 4 (2 platos)`; con un solo plato, `Mesa 4 (1 plato)`.
  - Una línea `- plato` por cada plato, en el orden en que llegaron.
  - Una línea por nota, en el orden en que llegaron, con dos espacios delante y los guiones bajos del nombre cambiados por espacios: `sin_cebolla="ceviche"` es `  sin cebolla: ceviche`.

  Ojo: la función no puede guardar nada entre una llamada y otra.
starter: |
  def comanda(mesa, *platos, **notas):
      return ""


  print(comanda(4, "ceviche", "jalea", sin_cebolla="ceviche"))
solution: |
  def comanda(mesa, *platos, **notas):
      """El papelito de la cocina para una mesa."""
      cuantos = len(platos)
      lineas = [f"Mesa {mesa} ({cuantos} plato{'' if cuantos == 1 else 's'})"]
      for plato in platos:
          lineas.append(f"- {plato}")
      for clave, valor in notas.items():
          lineas.append(f"  {clave.replace('_', ' ')}: {valor}")
      return "\n".join(lineas)


  print(comanda(4, "ceviche", "jalea", sin_cebolla="ceviche"))
hints:
  - "Junta las líneas en una lista y al final únelas con `\"\\n\".join(lineas)`."
  - "`notas.items()` te da cada par `(clave, valor)`, y `clave.replace(\"_\", \" \")` cambia los guiones bajos."
tests:
  - name: dos platos y una nota
    run: 'comanda(4, "ceviche", "jalea", sin_cebolla="ceviche")'
    equals: "Mesa 4 (2 platos)\n- ceviche\n- jalea\n  sin cebolla: ceviche"
  - name: un solo plato, en singular
    run: 'comanda(1, "sudado")'
    equals: "Mesa 1 (1 plato)\n- sudado"
  - name: sin platos ni notas
    run: comanda(6)
    equals: "Mesa 6 (0 platos)"
  - name: varias notas, en orden
    run: 'comanda(2, "jalea", para_llevar=True, aji_aparte="sí")'
    equals: "Mesa 2 (1 plato)\n- jalea\n  para llevar: True\n  aji aparte: sí"
  - name: no guarda nada entre llamadas
    run: '[comanda(3, "causa"), comanda(3, "causa")]'
    equals: ["Mesa 3 (1 plato)\n- causa", "Mesa 3 (1 plato)\n- causa"]
  - name: usa *platos y **notas
    source: 'def\s+comanda\s*\(\s*mesa\s*,\s*\*platos\s*,\s*\*\*notas\s*\)'
```
