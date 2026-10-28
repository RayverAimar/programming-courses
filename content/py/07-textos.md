# Sesión 7 — Textos

## El encargo

Catacaos, en el Bajo Piura, a media cuadra de la calle Comercio, donde las tiendas de filigrana brillan desde la vereda. Ahí, en un segundo piso que huele a café de olla, transmite **Radio La Filigrana**: la voz de doña **Hermelinda Sosa** despierta al pueblo a las cinco con avisos, saludos y dedicatorias. La gente llama, dicta su mensaje y el practicante lo apunta como puede: con espacios de más, todo en mayúsculas o todo en minúsculas, a veces en clave.

Hermelinda le pidió a Maru "un robot que lea bonito" y a Quilla lo mandaron en bus hasta Piura. Los mensajes son **texto**, y hoy Quilla aprende a limpiarlos, cortarlos, buscar dentro de ellos y darles formato. Al final del día llevará los encargos dictados por la radio, casa por casa.

```escena
theme: barranco
level: 1
dir: E
caption: Quilla baja de la radio (a la izquierda) y lleva la primera dedicatoria del día al buzón de la tía Chabuca (D).
map: |
  #########
  #R.######
  ##.....D#
  #########
program: |
  robot.avanzar(1)
  robot.girar_derecha()
  robot.avanzar(1)
  robot.girar_izquierda()
  robot.avanzar(5)
  robot.entregar("Saludos para la tía Chabuca")
```

## Lo mínimo

Un texto (`str`) es una fila de caracteres. Python trae decenas de **métodos** para trabajar con ellos: se llaman con un punto, `texto.metodo()`, y **cada uno devuelve un texto nuevo**.

```py run
mensaje = "  Saludos para la TÍA Chabuca, de Wilmer  "
limpio = mensaje.strip()
print(limpio.lower())
print(limpio.split(", "))
print(limpio.startswith("Saludos"), limpio.find("Chabuca"), limpio.count("a"))
print(limpio.replace("Wilmer", "su sobrino Wilmer"))
```

- **`strip()`** quita los espacios (y saltos de línea) de los extremos; **`lower()`** / **`upper()`** cambian a minúsculas / mayúsculas.
- **`split(sep)`** parte el texto en una lista de trozos; **sin argumento**, parte por cualquier cantidad de espacios y descarta los vacíos. **`sep.join(lista)`** hace lo contrario: une los trozos poniendo `sep` en medio. `" ".join(texto.split())` deja un solo espacio entre palabras.
- **`replace(viejo, nuevo)`** cambia todas las apariciones; **`startswith`** / **`endswith`** preguntan por el comienzo y el final; **`find`** dice en qué posición aparece algo (o `-1` si no está); **`count`** cuenta cuántas veces aparece.

Cada carácter tiene una **posición**, que empieza en 0. Con corchetes sacas uno o un **corte** `[desde:hasta:paso]`, igual que en las listas: `hasta` no se incluye y los negativos cuentan desde el final.

```figura
title: El código de un pedido, letra por letra
panes:
  - label: "codigo = \"CAT-0417\""
    cells: ["C", "A", "T", "-", "0", "4", "1", "7"]
    highlight: [4, 5, 6, 7]
caption: "`codigo[4:8]` es `\"0417\"`, `codigo[:3]` es `\"CAT\"` y `codigo[-1]` es `\"7\"`."
```

```py run
codigo = "CAT-0417-SOMBRERO"
print(codigo[0], codigo[-1], codigo[4:8], codigo[9:])
print(codigo[::-1])
print("SOMBRERO" in codigo, len(codigo))
```

Un `for` recorre un texto **carácter por carácter**, y `in` pregunta si un carácter (o un trozo) está dentro de otro texto. Mira cómo Quilla cuenta las vocales de un saludo:

```anima
title: Recorrer un texto, letra por letra
code: |
  saludo = "Hola Catacaos"
  vocales = 0
  for letra in saludo.lower():
      if letra in "aeiou":
          vocales += 1
  print(vocales, "vocales")
notes:
  3: "saludo.lower() es un texto nuevo; el for lo recorre de a un carácter."
  4: "in pregunta si la letra está dentro de \"aeiou\"."
  6: "El espacio y las consonantes no sumaron nada."
```

**Formato dentro de las f-strings.** Después de `:` va cómo escribir el valor: `{x:>8}` lo alinea a la derecha en 8 espacios (`<` a la izquierda, `^` al centro), `{x:.2f}` con dos decimales, `{x:,}` con separador de miles y `{x:05d}` con ceros a la izquierda hasta 5 cifras. Se combinan: `{x:>10,.2f}`.

```py run
cliente = "Petronila"
total = 1309.5
print(f"[{cliente:<12}][{cliente:>12}][{cliente:^12}]")
print(f"S/ {total:>10,.2f}  Pedido {7:05d}")
```

**Los caracteres son números.** `ord("A")` da el código de la letra (65) y `chr(65)` hace el camino de vuelta. Como las letras de la `A` a la `Z` tienen códigos seguidos, con `ord` y `chr` se puede "mover" una letra: `chr(ord("A") + 2)` es `"C"`.

```py run
print(ord("A"), ord("B"), ord("Z"))
print(chr(ord("H") + 1), chr(ord("a") - 32))
```

> **Trampa común:** los textos **no se pueden cambiar**. `mensaje.upper()` sola no hace nada visible: devuelve un texto nuevo que se pierde si no lo guardas (`mensaje = mensaje.upper()`). Y `mensaje[0] = "S"` es un `TypeError`: para "cambiar" un carácter, arma un texto nuevo.

<!-- legacy: format-spec -->

<!-- legacy: removeprefix -->

<!-- mdn: str-methods format-spec removeprefix -->

## Práctica

```exercise
id: py7-predice-inmutable
type: predict
title: El saludo que no se arregló
prompt: |
  El practicante quiere dejar el saludo limpio y en mayúsculas antes de leerlo al aire. ¿Qué imprime?
code: |
  saludo = "  saludos para la tía chabuca  "
  saludo.strip()
  saludo.upper()
  print(f"[{saludo}]")
  saludo = saludo.strip().upper()
  print(f"[{saludo}]")
options:
  - "[  saludos para la tía chabuca  ]\n[SALUDOS PARA LA TÍA CHABUCA]"
  - "[SALUDOS PARA LA TÍA CHABUCA]\n[SALUDOS PARA LA TÍA CHABUCA]"
  - "[saludos para la tía chabuca]\n[SALUDOS PARA LA TÍA CHABUCA]"
  - "[  SALUDOS PARA LA TÍA CHABUCA  ]\n[SALUDOS PARA LA TÍA CHABUCA]"
answer: "[  saludos para la tía chabuca  ]\n[SALUDOS PARA LA TÍA CHABUCA]"
explain: |
  Las líneas 2 y 3 calculan textos nuevos y los botan: nadie los guarda. `saludo` sigue igual hasta la línea 5, que guarda el resultado de `strip().upper()` en la misma variable.
```

```exercise
id: py7-predice-cortes
type: predict
title: El código del pedido
prompt: |
  Cada pedido de la sombrerería llega con un código. ¿Qué imprime este programa?
code: |
  codigo = "CAT-0417-SOMBRERO"
  print(codigo[:3], codigo[4:8], codigo[-8:])
  print(codigo.find("-"), codigo.find("x"), codigo.count("O"))
options:
  - "CAT 0417 SOMBRERO\n3 -1 2"
  - "CAT- 0417- SOMBRERO\n3 -1 2"
  - "CAT 0417 SOMBRERO\n3 None 2"
  - "CAT 417- SOMBRERO\n4 -1 3"
answer: "CAT 0417 SOMBRERO\n3 -1 2"
explain: |
  En un corte, el número de la derecha **no se incluye**: `[:3]` son las posiciones 0, 1 y 2, y `[4:8]` de la 4 a la 7. `[-8:]` son los 8 últimos. `find` da la **primera** posición del guion (3) y `-1` cuando no encuentra nada; `count("O")` cuenta las O mayúsculas: hay dos, en SOMBRERO.
```

```exercise
id: py7-predice-ord
type: predict
title: Letras que son números
prompt: |
  Quilla mira las letras por dentro. ¿Qué imprime?
code: |
  print(ord("A"), ord("D"), chr(ord("a") + 2), chr(72) + chr(105))
options:
  - "65 68 c Hi"
  - "65 68 a2 Hi"
  - "1 4 c Hi"
  - "65 68 c 177"
answer: "65 68 c Hi"
explain: |
  `ord("A")` es 65, y como las letras van seguidas, `D` es 68. `ord("a") + 2` es un número; `chr` lo vuelve letra: `c`. `chr(72)` es `H` y `chr(105)` es `i`, y dos textos con `+` se pegan.
```

```exercise
id: py7-completa-cartelera
type: complete
title: La cartelera de avisos
prompt: |
  Hermelinda cobra los avisos por segundo y pega la lista en la pared de la cabina. Completa los `___` con formatos para que salga **exactamente** así:

  ```
  Parte N.° 00042
  Sombrerería Yarlequé    30s  S/     45.00
  Picantería La Chayo     45s  S/     67.50
  Filigranas Ipanaqué    120s  S/  1,180.00
  ```

  - el número de parte con **ceros a la izquierda** hasta 5 cifras;
  - el cliente **a la izquierda** en 22 espacios;
  - los segundos **a la derecha** en 4;
  - el precio **a la derecha** en 9, con **separador de miles** y **2 decimales**.
starter: |
  parte = 42
  avisos = [("Sombrerería Yarlequé", 30, 45.0), ("Picantería La Chayo", 45, 67.5), ("Filigranas Ipanaqué", 120, 1180.0)]

  print(f"Parte N.° {parte:___}")
  for cliente, segundos, precio in avisos:
      print(f"{cliente:___}{segundos:___}s  S/ {precio:___}")
solution: |
  parte = 42
  avisos = [("Sombrerería Yarlequé", 30, 45.0), ("Picantería La Chayo", 45, 67.5), ("Filigranas Ipanaqué", 120, 1180.0)]

  print(f"Parte N.° {parte:05d}")
  for cliente, segundos, precio in avisos:
      print(f"{cliente:<22}{segundos:>4}s  S/ {precio:>9,.2f}")
hints:
  - "Ceros a la izquierda: `05d`. Alinear: `<22` y `>4`."
  - "El precio junta tres cosas en este orden: alineación y ancho, la coma, los decimales: `>9,.2f`."
tests:
  - name: la cartelera sale exacta
    output: "Parte N.° 00042\nSombrerería Yarlequé    30s  S/     45.00\nPicantería La Chayo     45s  S/     67.50\nFiligranas Ipanaqué    120s  S/  1,180.00"
  - name: usa formatos, no espacios a mano
    source: '\{parte:05d\}'
    msg: Escribe el número de parte con {parte:05d}.
```

```exercise
id: py7-arregla-telefono
type: fix
title: El teléfono al aire
prompt: |
  Por la radio no se leen teléfonos: `tapar_numeros` debería cambiar **cada dígito por un asterisco** y devolver el mensaje tapado. Se cae. Ejecútalo, lee el error y arréglalo **recorriendo el mensaje carácter por carácter** (`for caracter in mensaje`) y armando un texto nuevo.
starter: |
  def tapar_numeros(mensaje):
      """Cambia cada dígito por un asterisco."""
      for i in range(len(mensaje)):
          if mensaje[i] in "0123456789":
              mensaje[i] = "*"
      return mensaje


  print(tapar_numeros("Llamen a Pancho al 969 123 456"))
solution: |
  def tapar_numeros(mensaje):
      """Cambia cada dígito por un asterisco."""
      tapado = ""
      for caracter in mensaje:
          if caracter in "0123456789":
              tapado += "*"
          else:
              tapado += caracter
      return tapado


  print(tapar_numeros("Llamen a Pancho al 969 123 456"))
hints:
  - "El error dice que un `str` no acepta asignar a una posición: los textos no se cambian."
  - "Empieza con `tapado = \"\"` y, en cada vuelta, súmale `\"*\"` o el carácter tal cual."
tests:
  - name: tapa el teléfono
    run: tapar_numeros("Llamen a Pancho al 969 123 456")
    equals: "Llamen a Pancho al *** *** ***"
  - name: sin números, no cambia nada
    run: tapar_numeros("Saludos a Catacaos")
    equals: Saludos a Catacaos
  - name: un mensaje vacío
    run: tapar_numeros("")
    equals: ""
  - name: la consola lo muestra
    output: Llamen a Pancho al *** *** ***
  - name: recorre los caracteres con for … in
    source: '\bfor\s+\w+\s+in\s+mensaje\b'
    msg: Recorre el texto directo, for caracter in mensaje, sin range(len(…)).
```

```exercise
id: py7-escribe-siglas
type: write
title: Las siglas de la asociación
prompt: |
  Escribe `siglas(nombre)`, que devuelve las **iniciales en mayúsculas** de las palabras del nombre, **sin contar** las palabras cortas `de`, `del`, `la`, `las`, `los`, `el` e `y` (escritas como sea).

  En la radio, los nombres largos se anuncian con siglas: `"Asociación de Artesanos de Catacaos"` es `"AAC"`. El nombre puede traer espacios de más.
visual:
  figure:
    title: siglas("Asociación  de Artesanos de Catacaos")
    input: { label: palabras, cells: ["Asociación", "de", "Artesanos", "de", "Catacaos"], index: false }
    arrow: "sin las palabras cortas, la primera letra de cada una"
    output: { label: devuelve, value: "\"AAC\"" }
starter: |
  def siglas(nombre):
      pass


  print(siglas("Asociación  de Artesanos de Catacaos"))
solution: |
  CORTAS = {"de", "del", "la", "las", "los", "el", "y"}


  def siglas(nombre):
      """Las iniciales de las palabras que no son cortas, en mayúsculas."""
      iniciales = ""
      for palabra in nombre.split():
          if palabra.lower() not in CORTAS:
              iniciales += palabra[0].upper()
      return iniciales


  print(siglas("Asociación  de Artesanos de Catacaos"))
hints:
  - "`nombre.split()` sin argumento parte por cualquier cantidad de espacios. `palabra[0]` es la primera letra."
  - "Compara `palabra.lower()` con las palabras cortas, para que `DE` y `De` también se salten."
tests:
  - name: la asociación
    run: siglas("Asociación  de Artesanos de Catacaos")
    equals: AAC
  - name: con mayúsculas y minúsculas mezcladas
    run: siglas("radio LA filigrana DEL bajo piura")
    equals: RFBP
  - name: con espacios en los extremos
    run: siglas("   feria y fiesta   ")
    equals: FF
  - name: un nombre vacío
    run: siglas("")
    equals: ""
  - name: con tildes
    run: siglas("úrsula ñique")
    equals: ÚÑ
```

```exercise
id: py7-escribe-dedicatoria
type: write
title: La ficha de la dedicatoria
prompt: |
  Escribe `leer_dedicatoria(ficha)`, que devuelve la frase que Hermelinda lee al aire: `Wilmer le dedica «Cholo soy» a la tía Chabuca`.

  El practicante llena una ficha por llamada, con tres campos separados por `|`: `DE:`, `PARA:` y `CANCIÓN:`, **en cualquier orden** y con espacios de más alrededor. Recorre los campos, límpialos y reconoce cada uno por cómo empieza (`startswith`), quitándole la etiqueta con `removeprefix`.
visual:
  figure:
    title: Una ficha, campo por campo
    input: { label: ficha, text: " PARA:  la tía Chabuca |DE: Wilmer| CANCIÓN: Cholo soy " }
    arrow: "split(\"|\"), strip, removeprefix"
    output: { label: devuelve, text: "Wilmer le dedica «Cholo soy» a la tía Chabuca" }
starter: |
  def leer_dedicatoria(ficha):
      pass


  print(leer_dedicatoria(" PARA:  la tía Chabuca |DE: Wilmer| CANCIÓN: Cholo soy "))
solution: |
  def leer_dedicatoria(ficha):
      """La frase para el aire, a partir de los tres campos de la ficha."""
      de, para, cancion = "", "", ""
      for campo in ficha.split("|"):
          campo = campo.strip()
          if campo.startswith("DE:"):
              de = campo.removeprefix("DE:").strip()
          elif campo.startswith("PARA:"):
              para = campo.removeprefix("PARA:").strip()
          elif campo.startswith("CANCIÓN:"):
              cancion = campo.removeprefix("CANCIÓN:").strip()
      return f"{de} le dedica «{cancion}» a {para}"


  print(leer_dedicatoria(" PARA:  la tía Chabuca |DE: Wilmer| CANCIÓN: Cholo soy "))
hints:
  - "`ficha.split(\"|\")` da los tres campos. Después de `strip()`, cada uno empieza con su etiqueta."
  - "`campo.removeprefix(\"DE:\").strip()` deja solo el valor."
tests:
  - name: la ficha del dibujo
    run: 'leer_dedicatoria(" PARA:  la tía Chabuca |DE: Wilmer| CANCIÓN: Cholo soy ")'
    equals: "Wilmer le dedica «Cholo soy» a la tía Chabuca"
  - name: en otro orden
    run: 'leer_dedicatoria("CANCIÓN: Mi Piurana|DE: doña Rosa|PARA: su compadre Pancho")'
    equals: "doña Rosa le dedica «Mi Piurana» a su compadre Pancho"
  - name: con espacios dentro del valor que se respetan
    run: 'leer_dedicatoria("DE:Eulalia |  PARA:   los del mercado  |CANCIÓN:   Tondero de mi tierra")'
    equals: "Eulalia le dedica «Tondero de mi tierra» a los del mercado"
  - name: reconoce cada campo por cómo empieza
    source: '\.startswith\s*\('
    msg: Usa startswith para saber qué campo es cada uno; el orden cambia.
```

## El caso

```exercise
id: py7-caso-cifrado
type: case
title: El mensaje cifrado
prompt: |
  **Descifra el pedido de cada cliente con su clave y compara la cantidad de sombreros con la que anotó el practicante.**

  Doña Petronila Yarlequé, la mejor sombrerera de Catacaos, recibe sus pedidos por la radio, pero **en clave**, para que la competencia de enfrente no se entere de quién le compra. Cada cliente tiene su número secreto `k` y corre cada letra `k` lugares hacia adelante en el alfabeto (A a Z, sin Ñ; después de la Z se vuelve a la A). Los números y los espacios no se tocan. Kevin, el practicante, descifró los cuatro pedidos de memoria y anotó las cantidades… y un cliente recibió la cantidad equivocada.

  Para descifrar, corre cada letra `k` lugares **hacia atrás**: `chr((ord(letra) - ord("A") - k) % 26 + ord("A"))`. El `% 26` es lo que hace que antes de la A venga la Z.

  Imprime una línea por cliente con su nombre y el mensaje descifrado: `print("Eulalia:", descifrado)`. El tablero toma el número del mensaje y lo compara con lo que anotó Kevin.
visual:
  board:
    for: py7-caso-cifrado
    task: "Descifra cada mensaje con su clave y compara la cantidad con la que anotó Kevin."
    cards:
      - name: Eulalia
        kind: person
        rows: [["Clave", "3"], ["Llegó", "TXLHUR 12 VRPEUHURV GH SDMD ILQD"], ["Kevin anotó", "12 sombreros"]]
        clue: { find: "Eulalia", says: 12, saysLabel: Kevin anotó }
      - name: Pancho
        kind: person
        rows: [["Clave", "8"], ["Llegó", "UIVLMV 4 AWUJZMZWA XIZI TI XZWKMAQWV"], ["Kevin anotó", "4 sombreros"]]
        clue: { find: "Pancho", says: 4, saysLabel: Kevin anotó }
      - name: Rosa
        kind: person
        rows: [["Clave", "11"], ["Llegó", "DZY 7 DZXMCPCZD ALCL PW XLECTXZYTZ"], ["Kevin anotó", "7 sombreros"]]
        clue: { find: "Rosa", says: 7, saysLabel: Kevin anotó }
      - name: Wilmer
        kind: person
        culprit: true
        rows: [["Clave", "5"], ["Llegó", "SJHJXNYT 15 XTRGWJWTX FSYJX IJQ XFGFIT"], ["Kevin anotó", "5 sombreros"]]
        clue: { find: "Wilmer", says: 5, saysLabel: Kevin anotó }
      - name: La regla de la clave
        kind: note
        role: Pegada en la cabina
        rows: [["Con clave 3", "A → D, B → E, X → A"], ["Para leer", "cada letra, 3 hacia atrás"], ["Números y espacios", "no cambian"]]
starter: |
  # Lo que llegó por la radio, con la clave de cada cliente
  eulalia = "TXLHUR 12 VRPEUHURV GH SDMD ILQD"   # clave 3
  pancho = "UIVLMV 4 AWUJZMZWA XIZI TI XZWKMAQWV"  # clave 8
  rosa = "DZY 7 DZXMCPCZD ALCL PW XLECTXZYTZ"     # clave 11
  wilmer = "SJHJXNYT 15 XTRGWJWTX FSYJX IJQ XFGFIT"  # clave 5

  # TODO: escribe descifrar(mensaje, clave), que devuelve el mensaje descifrado
  # e imprime una línea por cliente, por ejemplo:
  # print("Eulalia:", descifrar(eulalia, 3))
solution: |
  eulalia = "TXLHUR 12 VRPEUHURV GH SDMD ILQD"
  pancho = "UIVLMV 4 AWUJZMZWA XIZI TI XZWKMAQWV"
  rosa = "DZY 7 DZXMCPCZD ALCL PW XLECTXZYTZ"
  wilmer = "SJHJXNYT 15 XTRGWJWTX FSYJX IJQ XFGFIT"


  def descifrar(mensaje, clave):
      """Corre cada letra mayúscula `clave` lugares hacia atrás."""
      claro = ""
      for caracter in mensaje:
          if "A" <= caracter <= "Z":
              claro += chr((ord(caracter) - ord("A") - clave) % 26 + ord("A"))
          else:
              claro += caracter
      return claro


  print("Eulalia:", descifrar(eulalia, 3))
  print("Pancho:", descifrar(pancho, 8))
  print("Rosa:", descifrar(rosa, 11))
  print("Wilmer:", descifrar(wilmer, 5))
answer: Wilmer
answerLabel: ¿A qué cliente le anotaron mal el pedido?
reveal: |
  Wilmer. Su mensaje dice `NECESITO 15 SOMBREROS ANTES DEL SABADO` y Kevin anotó 5: se comió el 1. Los otros tres cuadran: `QUIERO 12 SOMBREROS DE PAJA FINA`, `MANDEN 4 SOMBREROS PARA LA PROCESION` y `SON 7 SOMBREROS PARA EL MATRIMONIO`.
hints:
  - "Recorre el mensaje con `for caracter in mensaje:` y arma un texto nuevo. Solo las letras se corren: pregunta `\"A\" <= caracter <= \"Z\"`."
  - "Con clave 3, la `T` (posición 19) va a `(19 - 3) % 26 = 16`, que es la `Q`. La `A` va a `(0 - 3) % 26 = 23`, la `X`."
```

## El juez

Los dos jueces de hoy están en modo función, como desde la sesión 4: el juez llama a tus funciones y compara lo que **devuelven**.

```exercise
id: py7-juez-nombres
type: judge
mode: function
function: normalizar_nombre
title: Los nombres para el aire
prompt: |
  **Escribe `normalizar_nombre(nombre)`, que devuelve el nombre limpio: sin espacios de sobra, cada palabra con mayúscula inicial y el resto en minúsculas, salvo las partículas.**

  Kevin apunta los nombres de los oyentes como le dictan: `"  maría   DE LOS  ángeles  SERNAQUÉ "`. Hermelinda los quiere leer bien escritos: `"María de los Ángeles Sernaqué"`.

  - Las palabras quedan separadas por **un solo espacio**, sin espacios en los extremos.
  - Cada palabra va con la **primera letra en mayúscula** y las demás en minúscula.
  - Las **partículas** `de`, `del`, `la`, `las`, `los` e `y` van **todas en minúscula**… salvo si son la **primera** palabra, que siempre lleva mayúscula: `"DEL carpio"` es `"Del Carpio"`.

  `palabra.capitalize()` deja la primera letra en mayúscula y el resto en minúscula, tildes incluidas.

  **Restricciones:** hasta 10 palabras de letras (con tildes y ñ), separadas por uno o más espacios · un nombre vacío o solo con espacios devuelve `""`.
visual:
  figure:
    title: El ejemplo 1, palabra por palabra
    input: { label: nombre, text: "\"  maría   DE LOS  ángeles  SERNAQUÉ \"" }
    arrow: "split() · capitalize() salvo las partículas · \" \".join"
    output: { label: devuelve, cells: ["María", "de", "los", "Ángeles", "Sernaqué"], index: false }
    steps:
      - "`split()` sin argumento se come todos los espacios: quedan 5 palabras."
      - "`de` y `los` son partículas y no son la primera: van en minúscula."
      - "Al final se unen con un solo espacio: `\"María de los Ángeles Sernaqué\"`."
starter: |
  def normalizar_nombre(nombre):
      return nombre
solution: |
  PARTICULAS = {"de", "del", "la", "las", "los", "y"}


  def normalizar_nombre(nombre):
      """El nombre con un espacio entre palabras, mayúsculas iniciales y partículas en minúscula."""
      palabras = []
      for palabra in nombre.split():
          palabra = palabra.lower()
          if palabras and palabra in PARTICULAS:
              palabras.append(palabra)
          else:
              palabras.append(palabra.capitalize())
      return " ".join(palabras)
hints:
  - "`nombre.split()` (sin argumento) te da las palabras sin ningún espacio vacío; `\" \".join(palabras)` las vuelve a unir."
  - "Una palabra es la primera si la lista que vas armando todavía está vacía."
samples:
  - args: ["  maría   DE LOS  ángeles  SERNAQUÉ "]
    returns: María de los Ángeles Sernaqué
  - args: ["DEL carpio   wilmer"]
    returns: Del Carpio Wilmer
    note: La primera palabra siempre va con mayúscula, aunque sea una partícula.
  - args: ["pancho y   rosa"]
    returns: Pancho y Rosa
edge:
  - args: [""]
    tag: con un nombre vacío
  - args: ["     "]
    tag: con un nombre que solo tiene espacios
  - args: ["eulalia"]
    tag: con una sola palabra
  - args: ["   ÚRSULA    "]
    tag: con una sola palabra en mayúsculas y espacios
  - args: ["la   LA la"]
    tag: con partículas repetidas
  - args: ["de la cruz"]
    tag: con un nombre que empieza con dos partículas
  - args: ["ñique   yarlequé DE   la   ROSA"]
    tag: con ñ y tildes
  - args: ["y"]
    tag: con una partícula sola
random:
  count: 40
  seed: 707
  generate: |
    nombres = ["maría", "josé", "eulalia", "pancho", "rosa", "wilmer", "hermelinda", "petronila", "ángel", "úrsula", "yesenia", "kevin", "chabuca", "ñique"]
    apellidos = ["chunga", "ipanaqué", "sernaqué", "yarlequé", "vílchez", "sosa", "purizaca", "cruz", "carpio", "santos", "flores", "zapata"]
    particulas = ["de", "del", "de la", "de los", "y", "la", "de las"]
    partes = []
    if rng.int(0, 3) == 0:
        partes.append(rng.pick(["de", "del", "la", "de los"]))
    for _ in range(rng.int(1, 2)):
        partes.append(rng.pick(nombres))
    for _ in range(rng.int(1, 3)):
        if rng.int(0, 2) == 0:
            partes.append(rng.pick(particulas))
        partes.append(rng.pick(apellidos))
    texto = " " * rng.int(0, 3)
    for i, palabra in enumerate(" ".join(partes).split()):
        estilo = rng.int(0, 3)
        if estilo == 0:
            palabra = palabra.upper()
        elif estilo == 1:
            palabra = palabra.capitalize()
        elif estilo == 2:
            mezcla = ""
            for letra in palabra:
                mezcla += letra.upper() if rng.int(0, 1) else letra
            palabra = mezcla
        if i > 0:
            texto += " " * rng.int(1, 3)
        texto += palabra
    texto += " " * rng.int(0, 3)
    return [texto]
wrong:
  - |
    def normalizar_nombre(nombre):
        return " ".join(nombre.split()).title()
  - |
    PARTICULAS = {"de", "del", "la", "las", "los", "y"}


    def normalizar_nombre(nombre):
        palabras = []
        for palabra in nombre.strip().split(" "):
            palabra = palabra.lower()
            if palabras and palabra in PARTICULAS:
                palabras.append(palabra)
            else:
                palabras.append(palabra.capitalize())
        return " ".join(palabras)
  - |
    PARTICULAS = {"de", "del", "la", "las", "los", "y"}


    def normalizar_nombre(nombre):
        palabras = []
        for palabra in nombre.split():
            palabra = palabra.lower()
            if palabra in PARTICULAS:
                palabras.append(palabra)
            else:
                palabras.append(palabra.capitalize())
        return " ".join(palabras)
```

```exercise
id: py7-juez-comprimir
type: judge
mode: function
function: comprimir
title: El telegrama ahorrador
prompt: |
  **Escribe `comprimir(texto)`, que junta cada racha de caracteres iguales seguidos en `cantidad + carácter`, y `descomprimir(codigo)`, que hace el camino de vuelta.**

  El aviso por mensaje de texto le cuesta a la radio por carácter, y en Catacaos la gente escribe `"SIIIIII LLEGAMOS"`. Una racha de un carácter que se repite `n` veces seguidas se escribe como `n` y el carácter: `"AAAABBBCCD"` es `"4A3B2CD"`. Una racha de **un solo** carácter va sin número (`D`, no `1D`). El número puede tener varias cifras: doce `A` son `"12A"`.

  El juez prueba las dos funciones. En `descomprimir`, `caracter.isdigit()` dice si un carácter es una cifra; junta las cifras seguidas antes de convertirlas con `int`.

  **Restricciones:** el texto tiene de 0 a 200 caracteres, solo letras mayúsculas y espacios (nunca cifras) · los códigos que recibe `descomprimir` son los que produciría `comprimir`.
visual:
  figure:
    title: El ejemplo 1, racha por racha
    input: { label: texto, cells: ["A", "A", "A", "A", "B", "B", "B", "C", "C", "D"], index: false }
    arrow: "cada racha → cantidad + carácter"
    output: { label: devuelve, cells: ["4A", "3B", "2C", "D"], index: false }
    steps:
      - "Cuatro A seguidas son `4A`; tres B, `3B`; dos C, `2C`."
      - "La D está sola: va sin número."
      - "Se pegan en un solo texto: `\"4A3B2CD\"`."
starter: |
  def comprimir(texto):
      return texto


  def descomprimir(codigo):
      return codigo
solution: |
  def bloque(veces, caracter):
      """Una racha escrita como cantidad y carácter; sin cantidad si es 1."""
      if veces == 1:
          return caracter
      return f"{veces}{caracter}"


  def comprimir(texto):
      """Cada racha de caracteres iguales, como cantidad + carácter."""
      if texto == "":
          return ""
      partes = []
      actual = texto[0]
      veces = 0
      for caracter in texto:
          if caracter == actual:
              veces += 1
          else:
              partes.append(bloque(veces, actual))
              actual = caracter
              veces = 1
      partes.append(bloque(veces, actual))
      return "".join(partes)


  def descomprimir(codigo):
      """Repite cada carácter las veces que dicen las cifras de delante."""
      resultado = []
      cifras = ""
      for caracter in codigo:
          if caracter.isdigit():
              cifras += caracter
          else:
              veces = int(cifras) if cifras else 1
              resultado.append(caracter * veces)
              cifras = ""
      return "".join(resultado)
hints:
  - "En `comprimir`, lleva el carácter de la racha actual y cuántas veces va. Cuando llega uno distinto, cierra la racha; al terminar el `for`, cierra la última."
  - "En `descomprimir`, junta las cifras en un texto (`\"12\"`) hasta llegar a una letra o espacio; ese carácter se repite `int(cifras)` veces, o una si no hubo cifras. `\"A\" * 3` es `\"AAA\"`."
samples:
  - args: ["AAAABBBCCD"]
    returns: 4A3B2CD
  - args: ["SIIIIII LLEGAMOS"]
    returns: S6I 2LEGAMOS
    note: El espacio también es un carácter; aquí está solo, así que va sin número.
  - fn: descomprimir
    args: ["12A3B"]
    returns: AAAAAAAAAAAABBB
    note: Doce A y tres B.
edge:
  - args: [""]
    tag: con un texto vacío
  - args: ["Z"]
    tag: con un solo carácter
  - args: ["ABAB"]
    tag: con letras que se repiten pero no seguidas
  - args: ["AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"]
    tag: con una sola racha larga
  - args: ["HOLA   CATACAOS"]
    tag: con una racha de espacios
  - args: ["ABBB"]
    tag: con la última racha larga
  - fn: descomprimir
    args: [""]
    tag: en descomprimir, con un código vacío
  - fn: descomprimir
    args: ["4A3B2CD"]
    tag: en descomprimir, con rachas de una cifra
  - fn: descomprimir
    args: ["S6I 2LEGAMOS"]
    tag: en descomprimir, con un espacio
  - fn: descomprimir
    args: ["15Z2 X"]
    tag: en descomprimir, con una cantidad de dos cifras
  - fn: descomprimir
    args: ["ABC"]
    tag: en descomprimir, sin ningún número
random:
  count: 40
  seed: 77
  generate: |
    letras = rng.pick(["AB", "ABC", "SILO ", "CATAOS ", "ABCDEFGHIJKLMNOPQRSTUVWXYZ "])
    texto = ""
    for _ in range(rng.int(1, 15)):
        texto += rng.pick(list(letras)) * rng.pick([1, 1, 2, 3, 4, rng.int(5, 12)])
    return [texto[:200]]
wrong:
  - |
    def comprimir(texto):
        if texto == "":
            return ""
        partes = []
        actual = texto[0]
        veces = 0
        for caracter in texto:
            if caracter == actual:
                veces += 1
            else:
                partes.append(f"{veces}{actual}")
                actual = caracter
                veces = 1
        partes.append(f"{veces}{actual}")
        return "".join(partes)


    def descomprimir(codigo):
        resultado, cifras = "", ""
        for caracter in codigo:
            if caracter.isdigit():
                cifras += caracter
            else:
                resultado += caracter * int(cifras or 1)
                cifras = ""
        return resultado
  - |
    def comprimir(texto):
        partes = []
        actual = texto[:1]
        veces = 0
        for caracter in texto:
            if caracter == actual:
                veces += 1
            else:
                partes.append(f"{veces}{actual}" if veces > 1 else actual)
                actual = caracter
                veces = 1
        return "".join(partes)


    def descomprimir(codigo):
        resultado, cifras = "", ""
        for caracter in codigo:
            if caracter.isdigit():
                cifras += caracter
            else:
                resultado += caracter * int(cifras or 1)
                cifras = ""
        return resultado
  - |
    def comprimir(texto):
        if texto == "":
            return ""
        partes = []
        actual = texto[0]
        veces = 0
        for caracter in texto:
            if caracter == actual:
                veces += 1
            else:
                partes.append(f"{veces}{actual}" if veces > 1 else actual)
                actual = caracter
                veces = 1
        partes.append(f"{veces}{actual}" if veces > 1 else actual)
        return "".join(partes)


    def descomprimir(codigo):
        resultado = ""
        anterior = ""
        for caracter in codigo:
            if caracter.isdigit():
                anterior = caracter
            else:
                resultado += caracter * (int(anterior) if anterior else 1)
                anterior = ""
        return resultado
```

## Misión final

```exercise
id: py7-mision-encargos
type: mission
title: Los encargos de la radio
prompt: |
  **Lee el dictado de la radio línea por línea, arma la etiqueta de cada encargo y entrégala en su buzón.**

  A mediodía, Hermelinda lee al aire los encargos para la calle Comercio y Kevin los pasa a `dictado`, un solo texto con **un encargo por línea**: `pasos | nombre | producto`. `pasos` es cuántas casillas hay que avanzar **desde el buzón anterior** (o desde la radio, para el primero). Quilla empieza mirando al este y su batería alcanza justo para la calle.

  Kevin escribe como le sale: espacios de más en todas partes, mayúsculas donde caigan y **alguna línea en blanco** que hay que saltar. La etiqueta de cada encargo es `Nombre Apellido: producto`:

  - el nombre con un espacio entre palabras y cada una con mayúscula inicial (`.title()` sirve: hoy no hay partículas);
  - el producto en minúsculas, también con un solo espacio entre palabras.

  `"  3 | eulalia   CHUNGA | Sombrero de PAJA  "` → avanza 3 y entrega `"Eulalia Chunga: sombrero de paja"`. El dictado y la calle cambian en cada prueba.

  Cuando pase, junto con los jueces, se desbloquea la sesión 8.
visual:
  figure:
    title: La primera línea, desarmada
    input: { label: linea, text: "  3 | eulalia   CHUNGA | Sombrero de PAJA  " }
    arrow: "split(\"|\") · strip · title / lower"
    output: { label: Quilla hace, text: "robot.avanzar(3)\nrobot.entregar(\"Eulalia Chunga: sombrero de paja\")" }
starter: |
  # dictado llega de la cabina, por ejemplo:
  # "  3 | eulalia   CHUNGA | Sombrero de PAJA  \n5|pancho ipanaqué|FILIGRANA de plata\n..."
  print(dictado)
  # TODO: recorre las líneas, arma cada etiqueta y entrégala
solution: |
  def limpio(texto):
      """Un solo espacio entre palabras y nada en los extremos."""
      return " ".join(texto.split())


  for linea in dictado.splitlines():
      if linea.strip() == "":
          continue
      pasos, nombre, producto = linea.split("|")
      etiqueta = f"{limpio(nombre).title()}: {limpio(producto).lower()}"
      robot.avanzar(int(pasos))
      robot.entregar(etiqueta)
hints:
  - "`dictado.splitlines()` da la lista de líneas. Salta las que, sin espacios, quedan vacías (`continue`)."
  - "`pasos, nombre, producto = linea.split(\"|\")` separa los tres campos. `int(\"  3 \")` funciona aunque traiga espacios."
world:
  theme: barranco
  level: 1
  dir: E
  battery: 13
  map: |
    ################
    #R..D....D.D..D#
    ################
globals:
  dictado: "  3 | eulalia   CHUNGA | Sombrero de PAJA  \n5|pancho ipanaqué|FILIGRANA de plata\n\n 2 | ROSA sernaqué | chicha  de jora \n3 |  wilmer  vílchez  |  algarrobina"
scenarios:
  - tests:
      - name: entrega las cuatro etiquetas, en orden
        state: 'w.delivered == ["Eulalia Chunga: sombrero de paja", "Pancho Ipanaqué: filigrana de plata", "Rosa Sernaqué: chicha de jora", "Wilmer Vílchez: algarrobina"]'
        msg: Alguna etiqueta no salió limpia o en orden. Revisa espacios, mayúsculas y minúsculas.
  - map: |
      ##############
      #R.D......D.D#
      ##############
    world: { battery: 11 }
    globals:
      dictado: "\n2|  úrsula PURIZACA |cerámica de Simbilá\n   \n 7 | HERMELINDA    sosa| Manta  BORDADA  \n2|yesenia zapata|NATILLAS\n"
    tests:
      - name: salta las líneas en blanco
        state: 'w.delivered == ["Úrsula Purizaca: cerámica de simbilá", "Hermelinda Sosa: manta bordada", "Yesenia Zapata: natillas"]'
        msg: Las líneas en blanco (o solo con espacios) no son encargos; sáltalas.
  - map: |
      ##############
      #R..........D#
      ##############
    world: { battery: 11 }
    globals:
      dictado: "  11 |MAMÁ  ENCARNACIÓN  | Pañuelos de COLORES"
    tests:
      - name: un solo encargo, lejos
        state: 'w.delivered == ["Mamá Encarnación: pañuelos de colores"]'
tests:
  - name: termina en el último buzón
    state: w.at_goal
  - name: sin chocar ni quedarse sin batería
    state: not w.crashed
  - name: parte el texto con split
    source: '\.split\s*\('
    msg: Parte cada línea con split("|"); el dictado cambia en cada prueba.
```

## Reto experto

```exercise
id: py7-reto-pantalla
type: challenge
title: La pantalla de la locutora
visual:
  figure:
    title: "ajustar(\"se vende chicha de jora bien helada\", 12)"
    input: { label: ancho, value: "12" }
    arrow: "palabra por palabra, mientras quepa"
    output: { label: devuelve, cells: ["se vende", "chicha de", "jora bien", "helada"], index: false }
    steps:
      - "`se vende chicha` tendría 15 caracteres: `chicha` baja a la línea siguiente."
      - "`chicha de jora` tendría 14: `jora` baja."
prompt: |
  **Escribe `ajustar(texto, ancho)`, que parte el aviso en líneas de a lo más `ancho` caracteres y devuelve la lista de líneas.** Para quien ya programa.

  Hermelinda lee los avisos en una pantallita angosta. Las palabras van en orden, separadas por un espacio, y cada línea lleva **todas las palabras que quepan**: si la siguiente ya no entra (contando el espacio que la separa), empieza una línea nueva. Los espacios de sobra del texto no cuentan. Ninguna palabra es más larga que `ancho`. Un texto sin palabras da `[]`.
starter: |
  def ajustar(texto, ancho):
      return []


  print(ajustar("se vende chicha de jora bien helada", 12))
solution: |
  def ajustar(texto, ancho):
      """Las palabras repartidas en líneas de a lo más `ancho` caracteres."""
      lineas = []
      actual = ""
      for palabra in texto.split():
          if actual == "":
              actual = palabra
          elif len(actual) + 1 + len(palabra) <= ancho:
              actual += " " + palabra
          else:
              lineas.append(actual)
              actual = palabra
      if actual:
          lineas.append(actual)
      return lineas


  print(ajustar("se vende chicha de jora bien helada", 12))
hints:
  - "Lleva la línea que estás armando. Una palabra entra si `len(actual) + 1 + len(palabra) <= ancho`."
  - "Al terminar, la última línea sigue en `actual`: no te olvides de agregarla."
tests:
  - name: el ejemplo del dibujo
    run: ajustar("se vende chicha de jora bien helada", 12)
    equals: ["se vende", "chicha de", "jora bien", "helada"]
  - name: todo cabe en una línea
    run: ajustar("hola Catacaos", 20)
    equals: ["hola Catacaos"]
  - name: justo al ancho
    run: ajustar("abc def ghi", 7)
    equals: ["abc def", "ghi"]
  - name: una palabra por línea
    run: ajustar("filigrana de plata", 9)
    equals: ["filigrana", "de plata"]
  - name: con espacios de sobra
    run: ajustar("   misa   a las   seis  ", 6)
    equals: ["misa a", "las", "seis"]
  - name: sin palabras
    run: ajustar("    ", 10)
    equals: []
  - name: ninguna línea pasa el ancho
    expect: 'all(len(linea) <= 5 for linea in ajustar("a bb ccc dddd eeeee f gg", 5))'
```
