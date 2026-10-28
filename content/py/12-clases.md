# Sesión 12 — Clases

## El encargo

Tacna, domingo a las siete de la mañana, a dos cuadras del Arco Parabólico. **Panadería El Arco** ya tiene cola: familias tacneñas que vienen por su pan de yema y turistas de Arica que cruzaron la frontera a desayunar pastel de choclo y que piden "marraqueta", a lo que doña **Eulalia Copaja** responde, muy seria, que eso se llama pan francés.

Su nieta **Ximena** lleva las cuentas: los hornos, las bandejas, los pedidos por WhatsApp y la libreta del fiado. Hasta ayer todo eso eran diccionarios sueltos y funciones por todos lados, y alguien terminó anotando una deuda de −40 soles. Maru mandó a Quilla con su brazo de mozo y una idea: que cada cosa de la panadería sea un **objeto** que guarda sus datos **y** sabe qué se puede hacer con ellos, y que se niegue a quedar en un estado imposible. Hoy Quilla aprende a escribir **clases**.

```escena
theme: cocina
level: 4
dir: E
caption: Panadería El Arco. Quilla lleva pan de yema a la mesa 1, vuelve a la cocina (K) y baja al patio con un pastel de choclo para la mesa 4.
map: |
  ############
  #K.........#
  #.##1###2#.#
  #.##.......#
  #.####3###.#
  #..........#
  ###4####5###
  ############
program: |
  robot.preparar("pan de yema")
  robot.avanzar(3)
  robot.servir()
  robot.girar_derecha()
  robot.girar_derecha()
  robot.avanzar(3)
  robot.preparar("pastel de choclo")
  robot.girar_izquierda()
  robot.avanzar(4)
  robot.girar_izquierda()
  robot.avanzar(2)
  robot.servir()
```

## Lo mínimo

Una **clase** es un molde; cada **objeto** (una *instancia*) que sale de él tiene sus propios datos. Se define con `class` (con mayúscula, `Horno`) y se crea un objeto llamándola como a una función: `Horno("de leña", 220)`. Las funciones de adentro son **métodos**; el primero, `__init__`, prepara el objeto recién creado.

```py run
class Horno:
    def __init__(self, nombre, temperatura):
        self.nombre = nombre
        self.temperatura = temperatura

    def describir(self):
        return f"Horno {self.nombre} a {self.temperatura} °C"

lena = Horno("de leña", 220)
print(lena.describir(), lena.temperatura)
```

**`self` es el objeto mismo.** `lena.describir()` es lo mismo que `Horno.describir(lena)`: Python pasa el objeto como primer argumento. Por eso cada método recibe `self`, y `self.nombre = …` le pega un **atributo** a ese objeto en particular. Mira cómo se llena el objeto paso a paso:

```anima
title: self es el objeto que está trabajando
code: |
  class Horno:
      def __init__(self, nombre):
          self.nombre = nombre
          self.panes = 0

      def hornear(self, cantidad):
          self.panes += cantidad
          return self.panes

      def __repr__(self):
          return f"Horno {vars(self)}"

  lena = Horno("leña")
  lena.hornear(40)
  total = lena.hornear(25)
  print(lena, total)
notes:
  1: "class solo guarda el molde con sus métodos; todavía no hay ningún horno."
  13: "Horno(\"leña\") crea un objeto vacío y llama a __init__ con self = ese objeto."
  3: "Cada self.algo = … le agrega un atributo al objeto. vars(self) los muestra todos."
  14: "lena.hornear(40) es Horno.hornear(lena, 40): self es lena."
  7: "El método cambia el objeto: el cambio se queda en lena después de volver."
  16: "print usa __repr__ para mostrar el objeto (lo vemos abajo)."
```

**Atributos de la clase y de la instancia.** Lo que asignas en el cuerpo de la clase (fuera de los métodos) es **de la clase**: un solo valor, compartido por todos los objetos. Lo que asignas con `self.` es **de cada objeto**. Al leer `a.capacidad`, Python busca primero en el objeto y, si no está, en la clase.

```py run
class Bandeja:
    capacidad = 24              # de la clase: una para todas
    def __init__(self, pan):
        self.pan = pan          # de cada bandeja

a, b = Bandeja("yema"), Bandeja("tacneño")
Bandeja.capacidad = 30
print(a.capacidad, b.capacidad, a.pan, b.pan)
```

Así se ve esa búsqueda, objeto primero y clase después:

```figura
title: La clase guarda lo compartido; cada objeto, lo suyo
panes:
  - { label: "La clase (el molde)", cards: [{ title: Bandeja, rows: [["capacidad", "30"], ["métodos", "__init__"]] }] }
  - { label: "a", cards: [{ title: "objeto a", rows: [["pan", "'yema'"]] }] }
  - { label: "b", cards: [{ title: "objeto b", rows: [["pan", "'tacneño'"]] }] }
steps:
  - "`a.pan`: ¿está en `a`? Sí → `'yema'`. Se acabó la búsqueda."
  - "`a.capacidad`: ¿está en `a`? No → ¿está en `Bandeja`? Sí → `30`. Por eso `a` y `b` ven el mismo valor."
  - "`Bandeja.capacidad = 30` cambia la clase, y todos los objetos lo ven. `a.capacidad = 5` solo le pegaría un atributo propio a `a`."
```


**Cómo se muestra un objeto.** `__str__` da el texto para personas (lo usan `print` y `str`); `__repr__` da el texto para programadores (lo usan las listas, la consola y `repr`) y, si no hay `__str__`, también `print`. En un f-string, `!r` pide el `repr` de un valor: `{self.nombre!r}` sale con comillas.

```py run
class Pan:
    def __init__(self, nombre, precio):
        self.nombre, self.precio = nombre, precio
    def __str__(self):
        return f"{self.nombre} a S/ {self.precio:.2f}"
    def __repr__(self):
        return f"Pan({self.nombre!r}, {self.precio})"

yema = Pan("yema", 0.6)
print(yema, [yema])
```

**`@property`: un atributo que se vigila.** Con `@property` un método se lee como atributo (`bolsa.panes`, sin paréntesis), y con `@panes.setter` decides qué pasa cuando alguien le asigna. El dato de verdad vive en `self._panes` (el guion bajo dice "no lo toques desde afuera"). Si el valor no sirve, el setter lo rechaza con **`raise ValueError(…)`**, que detiene la operación; quien quiera seguir adelante lo atrapa con **`try` / `except ValueError`** (los errores tienen su propia sesión; para hoy basta esto).

```py run
class Bolsa:
    def __init__(self, panes):
        self.panes = panes          # también pasa por el setter

    @property
    def panes(self):
        return self._panes

    @panes.setter
    def panes(self, cantidad):
        if cantidad < 0:
            raise ValueError("una bolsa no tiene panes negativos")
        self._panes = cantidad

bolsa = Bolsa(10)
bolsa.panes -= 4
try:
    bolsa.panes = -1
except ValueError as error:
    print("Rechazado:", error)
print(bolsa.panes)
```

**Otros constructores y ayudantes.** Un `@classmethod` recibe la clase (`cls`) en vez del objeto: sirve para fabricar objetos de otra forma, como "desde un texto". Un `@staticmethod` no recibe ni la clase ni el objeto: es una función que vive dentro de la clase porque tiene que ver con ella.

```py run
class Precio:
    def __init__(self, pan, soles):
        self.pan, self.soles = pan, soles

    @classmethod
    def desde_pizarra(cls, linea):          # "yema=0.60"
        pan, soles = linea.split("=")
        return cls(pan, float(soles))

    @staticmethod
    def docenas(unidades):
        return unidades // 12

yema = Precio.desde_pizarra("yema=0.60")
print(yema.pan, yema.soles, Precio.docenas(40))
```

**`@dataclass` escribe lo aburrido por ti.** Declaras los campos con su tipo y Python genera `__init__`, `__repr__` y `__eq__`. Una lista por defecto se pide con `field(default_factory=list)` (una lista nueva para cada objeto). `order=True` agrega `<`, `>`, `sorted` y `min`, comparando campo por campo en orden; `frozen=True` hace el objeto inmutable (asignarle da error) y por eso puede ir en un set o ser clave de un diccionario.

```py run
from dataclasses import dataclass, field

@dataclass(order=True)
class Hornada:
    hora: str
    pan: str
    bandejas: list[int] = field(default_factory=list)

a, b = Hornada("06:30", "yema"), Hornada("05:45", "tacneño", [24, 24])
print(a)
print(min(a, b).pan, a == Hornada("06:30", "yema"))
```

**Herencia.** `class Empanada(Producto):` hace una clase que **es** un `Producto` y hereda todos sus métodos; solo escribes lo que cambia. Dentro, `super()` llama a la versión del padre: `super().__init__(…)` para que el padre prepare su parte, `super().etiqueta()` para aprovechar lo que ya hacía.

```py run
class Producto:
    def __init__(self, nombre, precio):
        self.nombre, self.precio = nombre, precio
    def etiqueta(self):
        return f"{self.nombre}: S/ {self.precio:.2f}"

class Empanada(Producto):
    def __init__(self, nombre, precio, relleno):
        super().__init__(nombre, precio)
        self.relleno = relleno
    def etiqueta(self):
        return super().etiqueta() + f" (de {self.relleno})"

print(Empanada("empanada", 4.5, "queso").etiqueta(), isinstance(Empanada("e", 1, "x"), Producto))
```

> **Trampa común:** una lista escrita en el cuerpo de la clase (`panes = []`) es **una sola lista para todos los objetos**. `self.panes.append(…)` no crea una lista nueva: busca `panes`, no la encuentra en el objeto, la encuentra en la clase y le agrega ahí, así que lo que pones en una bandeja aparece en todas. Las listas de cada objeto se crean en `__init__` (`self.panes = []`) o, en una dataclass, con `field(default_factory=list)`.

<!-- legacy: property -->

<!-- legacy: dataclass -->

<!-- legacy: super-noargs -->

<!-- mdn: property dataclass super-noargs -->

## Práctica

```exercise
id: py12-predice-temperatura
type: predict
title: El horno que tenía su propia temperatura
prompt: |
  Ximena cambia la temperatura de un horno y después la de todos. ¿Qué imprime?
code: |
  class Horno:
      temperatura = 180

      def __init__(self, nombre):
          self.nombre = nombre

  lena = Horno("leña")
  electrico = Horno("eléctrico")
  electrico.temperatura = 220
  Horno.temperatura = 200
  print(lena.temperatura, electrico.temperatura, Horno.temperatura)
options:
  - "200 220 200"
  - "180 220 200"
  - "200 200 200"
  - "180 220 180"
answer: "200 220 200"
explain: |
  `electrico.temperatura = 220` no cambia la clase: le crea al horno eléctrico **su propio** atributo, que tapa al de la clase. `lena` no tiene uno propio, así que sigue leyendo el de la clase, que después pasó a 200. El eléctrico ya no se entera: tiene su 220.
```

```exercise
id: py12-completa-horno
type: complete
title: El horno que no se deja quemar
prompt: |
  Un horno de panadería trabaja entre **120 y 260 °C**, ambos incluidos. Completa los `___` para que `temperatura` sea una propiedad: se lee normal, y al asignarle un valor fuera de ese rango lanza `ValueError` sin cambiar nada. Las líneas de abajo prueban tres valores y anotan qué pasó.
starter: |
  class Horno:
      def __init__(self, nombre, temperatura):
          self.nombre = nombre
          self.temperatura = temperatura  # pasa por el setter

      ___
      def temperatura(self):
          return self._temperatura

      @temperatura.___
      def temperatura(self, grados):
          if not 120 <= grados <= 260:
              ___ ValueError(f"{grados} °C no es temperatura de horno")
          self.___ = grados


  pruebas = []
  for grados in [180, 300, 120, 90]:
      try:
          Horno("prueba", grados)
          pruebas.append("ok")
      except ValueError:
          pruebas.append("rechazado")
  print(pruebas)
solution: |
  class Horno:
      def __init__(self, nombre, temperatura):
          self.nombre = nombre
          self.temperatura = temperatura  # pasa por el setter

      @property
      def temperatura(self):
          return self._temperatura

      @temperatura.setter
      def temperatura(self, grados):
          if not 120 <= grados <= 260:
              raise ValueError(f"{grados} °C no es temperatura de horno")
          self._temperatura = grados


  pruebas = []
  for grados in [180, 300, 120, 90]:
      try:
          Horno("prueba", grados)
          pruebas.append("ok")
      except ValueError:
          pruebas.append("rechazado")
  print(pruebas)
hints:
  - "Arriba del primer método va `@property`; arriba del segundo, `@temperatura.setter`."
  - "El valor se guarda en `self._temperatura`, con guion bajo. Si lo guardas en `self.temperatura`, el setter se llama a sí mismo sin fin."
tests:
  - name: se lee como atributo
    expect: Horno("leña", 200).temperatura == 200
  - name: rechaza lo que está fuera de 120…260
    expect: 'pruebas == ["ok", "rechazado", "ok", "rechazado"]'
  - name: el dato vive en _temperatura
    expect: 'vars(Horno("leña", 150)) == {"nombre": "leña", "_temperatura": 150}'
```

```exercise
id: py12-arregla-bandejas
type: fix
title: Las bandejas que se pasaban los panes
prompt: |
  Cada horno tiene su bandeja. Ximena puso dos panes de yema en la del horno de leña y uno francés en la del eléctrico, pero las dos bandejas dicen tener los tres panes. Encuentra por qué y arréglalo: cada bandeja tiene que tener **su propia** lista.
visual:
  figure:
    panes:
      - { label: se esperaba, cards: [{ title: lena, rows: [["panes", "['yema', 'yema']"]] }, { title: electrico, rows: [["panes", "['francés']"]] }] }
      - { label: salió, cards: [{ title: lena, rows: [["panes", "['yema', 'yema', 'francés']"]] }, { title: electrico, rows: [["panes", "['yema', 'yema', 'francés']"]] }] }
starter: |
  class Bandeja:
      panes = []

      def __init__(self, horno):
          self.horno = horno

      def poner(self, pan):
          self.panes.append(pan)
          return len(self.panes)


  lena = Bandeja("leña")
  electrico = Bandeja("eléctrico")
  lena.poner("yema")
  lena.poner("yema")
  electrico.poner("francés")
  print(lena.panes, electrico.panes)
solution: |
  class Bandeja:
      def __init__(self, horno):
          self.horno = horno
          self.panes = []

      def poner(self, pan):
          self.panes.append(pan)
          return len(self.panes)


  lena = Bandeja("leña")
  electrico = Bandeja("eléctrico")
  lena.poner("yema")
  lena.poner("yema")
  electrico.poner("francés")
  print(lena.panes, electrico.panes)
hints:
  - "`panes = []` en el cuerpo de la clase es un atributo **de la clase**: una sola lista para todas las bandejas."
  - "Créala en `__init__` con `self.panes = []`."
tests:
  - name: la de leña tiene sus dos panes
    expect: 'lena.panes == ["yema", "yema"]'
  - name: la eléctrica tiene solo el suyo
    expect: 'electrico.panes == ["francés"]'
  - name: una bandeja nueva empieza vacía
    expect: Bandeja("nuevo").panes == []
  - name: la lista se crea en __init__
    source: 'self\.panes\s*=\s*\[\]'
```

```exercise
id: py12-arregla-precio
type: fix
title: El precio que se llamaba a sí mismo
prompt: |
  Ximena quiere que el precio de un pan nunca sea cero ni negativo, y escribió una propiedad. Pero al crear el primer pan el programa se cae con un error larguísimo. Ejecútalo, lee el error y arréglalo sin quitar la validación.
starter: |
  class Pan:
      def __init__(self, nombre, precio):
          self.nombre = nombre
          self.precio = precio

      @property
      def precio(self):
          return self.precio

      @precio.setter
      def precio(self, valor):
          if valor <= 0:
              raise ValueError("el precio tiene que ser positivo")
          self.precio = valor


  yema = Pan("pan de yema", 0.6)
  yema.precio = 0.7
  print(yema.nombre, yema.precio)
solution: |
  class Pan:
      def __init__(self, nombre, precio):
          self.nombre = nombre
          self.precio = precio

      @property
      def precio(self):
          return self._precio

      @precio.setter
      def precio(self, valor):
          if valor <= 0:
              raise ValueError("el precio tiene que ser positivo")
          self._precio = valor


  yema = Pan("pan de yema", 0.6)
  yema.precio = 0.7
  print(yema.nombre, yema.precio)
hints:
  - "Dentro del setter, `self.precio = valor` vuelve a llamar al setter, que vuelve a asignar, que vuelve a llamar… hasta el `RecursionError`. Al getter le pasa lo mismo."
  - "El dato tiene que vivir con otro nombre: `self._precio`, en el getter y en el setter."
tests:
  - name: el precio se puede cambiar
    expect: yema.precio == 0.7
  - name: la consola lo dice
    output: pan de yema 0.7
  - name: el dato vive en _precio
    expect: '"_precio" in vars(yema)'
  - name: la validación sigue ahí
    source: 'raise\s+ValueError'
```

```exercise
id: py12-escribe-pedido
type: write
title: Los pedidos del WhatsApp
prompt: |
  Los pedidos llegan por WhatsApp así: `"Herminia: yema, Tacneño ,yema"`. Escribe una dataclass `Pedido` con:

  - los campos `cliente` (texto) y `panes` (lista de textos, **vacía por defecto** y nueva para cada pedido);
  - un `@staticmethod` `limpiar(pan)`, que le quita los espacios de los bordes y lo pasa a minúsculas;
  - un `@classmethod` `desde_texto(texto)`, que separa el cliente de los panes por los dos puntos y los panes por las comas, limpia cada uno y se salta los vacíos;
  - un método `cuantos(pan)`, que dice cuántas veces está ese pan en el pedido (limpiándolo primero).
visual:
  figure:
    input: { label: llega, text: "\"Herminia: yema, Tacneño ,yema\"" }
    arrow: Pedido.desde_texto(…)
    output: { label: devuelve, text: "Pedido(cliente='Herminia', panes=['yema', 'tacneño', 'yema'])" }
starter: |
  from dataclasses import dataclass, field


  # TODO: la dataclass Pedido


  print(Pedido.desde_texto("Herminia: yema, Tacneño ,yema"))
solution: |
  from dataclasses import dataclass, field


  @dataclass
  class Pedido:
      cliente: str
      panes: list[str] = field(default_factory=list)

      @staticmethod
      def limpiar(pan):
          return pan.strip().lower()

      @classmethod
      def desde_texto(cls, texto):
          cliente, lista = texto.split(":")
          panes = [cls.limpiar(pan) for pan in lista.split(",") if pan.strip()]
          return cls(cliente.strip(), panes)

      def cuantos(self, pan):
          return self.panes.count(self.limpiar(pan))


  print(Pedido.desde_texto("Herminia: yema, Tacneño ,yema"))
hints:
  - "`texto.split(\":\")` te da el cliente y el resto; `resto.split(\",\")` te da los panes sucios."
  - "Dentro de `desde_texto`, termina con `return cls(cliente, panes)`: así funciona también para una clase hija."
tests:
  - name: limpiar
    run: Pedido.limpiar("  Yema ")
    equals: yema
  - name: desde_texto arma el pedido
    expect: 'Pedido.desde_texto("Herminia: yema, Tacneño ,yema") == Pedido("Herminia", ["yema", "tacneño", "yema"])'
  - name: un pedido sin panes
    expect: 'Pedido.desde_texto("Wálter:") == Pedido("Wálter")'
  - name: cuantos
    run: 'Pedido.desde_texto("Yanet: yema, francés, YEMA").cuantos(" yema")'
    equals: 2
  - name: cada pedido tiene su propia lista
    expect: Pedido("a").panes is not Pedido("b").panes
    msg: "Usa field(default_factory=list) para que cada pedido tenga una lista nueva."
  - name: usa @dataclass, @classmethod y @staticmethod
    source: '@dataclass[\s\S]*@staticmethod[\s\S]*@classmethod|@dataclass[\s\S]*@classmethod[\s\S]*@staticmethod'
```

```exercise
id: py12-escribe-lena
type: write
title: El horno de leña
prompt: |
  El `Horno` de la panadería ya está escrito. Escribe `HornoDeLena`, que **hereda** de `Horno`:

  - `__init__(self, nombre, lena_kg)`: deja que el padre prepare su parte con `super().__init__(nombre)` y guarda los kilos de leña.
  - `hornear(pan)`: cada hornada gasta **3 kg**. Si no alcanza, devuelve `"<nombre>: falta leña"` sin contar la hornada; si alcanza, descuenta la leña y devuelve lo mismo que el `hornear` del padre.
  - `cargar(kg)`: suma leña.
visual:
  figure:
    title: HornoDeLena("Copaja", 7)
    panes:
      - { table: { head: ["llamada", "devuelve", "leña", "hornadas"], rows: [["hornear(\"yema\")", "\"Copaja: yema listo\"", "4", "1"], ["hornear(\"tacneño\")", "\"Copaja: tacneño listo\"", "1", "2"], ["hornear(\"francés\")", "\"Copaja: falta leña\"", "1", "2"], ["cargar(5)", "—", "6", "2"]] } }
starter: |
  class Horno:
      def __init__(self, nombre):
          self.nombre = nombre
          self.hornadas = 0

      def hornear(self, pan):
          self.hornadas += 1
          return f"{self.nombre}: {pan} listo"


  # TODO: class HornoDeLena(Horno)
solution: |
  class Horno:
      def __init__(self, nombre):
          self.nombre = nombre
          self.hornadas = 0

      def hornear(self, pan):
          self.hornadas += 1
          return f"{self.nombre}: {pan} listo"


  class HornoDeLena(Horno):
      def __init__(self, nombre, lena_kg):
          super().__init__(nombre)
          self.lena_kg = lena_kg

      def hornear(self, pan):
          if self.lena_kg < 3:
              return f"{self.nombre}: falta leña"
          self.lena_kg -= 3
          return super().hornear(pan)

      def cargar(self, kg):
          self.lena_kg += kg
hints:
  - "La primera línea de tu `__init__` es `super().__init__(nombre)`: así el horno de leña también tiene `nombre` y `hornadas`."
  - "En `hornear`, después de descontar la leña, `return super().hornear(pan)` cuenta la hornada y arma el texto."
tests:
  - name: tres hornadas con 7 kg
    run: '(h := HornoDeLena("Copaja", 7), h.hornear("yema"), h.hornear("tacneño"), h.hornear("francés"), h.hornadas, h.lena_kg)[1:]'
    equals: ["Copaja: yema listo", "Copaja: tacneño listo", "Copaja: falta leña", 2, 1]
  - name: sin leña no hornea; después de cargar, sí
    run: '(h := HornoDeLena("Eulalia", 2), h.hornear("yema"), h.cargar(4), h.hornear("yema"), h.lena_kg)[1:]'
    equals: ["Eulalia: falta leña", null, "Eulalia: yema listo", 3]
  - name: un horno de leña es un horno
    expect: isinstance(HornoDeLena("a", 0), Horno)
  - name: usa super() en __init__ y en hornear
    source: 'super\(\)\.__init__\([\s\S]*super\(\)\.hornear\('
```

## El caso

```exercise
id: py12-caso-fiado
type: case
title: La cuenta con propiedad rota
prompt: |
  **Escribe la clase `CuentaFiado`, cuya `deuda` es una propiedad que nunca baja de 0 ni pasa del límite del cliente; repite la libreta de la semana y compara la deuda final de cada cliente con la que mostró el programa viejo.**

  El sobrino de doña Eulalia hizo un programa para el fiado. Cada vecino tiene un **límite**: lo que se le puede fiar como máximo. `fiar(monto)` suma a la deuda y `pagar(monto)` le resta. Una operación que dejaría la deuda **por debajo de 0 o por encima del límite** se rechaza entera: la deuda queda como estaba. Llegar justo al límite sí vale.

  El programa del sobrino tenía la propiedad rota: rechazaba los pagos de más, pero cuando alguien pasaba su límite solo mostraba un aviso… y lo anotaba igual. Imprime una línea por cliente con su deuda final, `Herminia: 60`. ¿A quién le fiaron de más?
visual:
  board:
    for: py12-caso-fiado
    task: "Repite la libreta con una CuentaFiado por cliente (0 ≤ deuda ≤ límite) y compara la deuda final con la del programa viejo."
    cards:
      - name: Herminia
        kind: person
        rows: [["Límite", "S/ 60"], ["Programa viejo", "S/ 60"]]
        clue: { find: "Herminia", says: 60, saysLabel: Programa viejo }
      - name: Wálter
        kind: person
        rows: [["Límite", "S/ 40"], ["Programa viejo", "S/ 12"]]
        clue: { find: "Wálter", says: 12, saysLabel: Programa viejo }
      - name: Yanet
        kind: person
        culprit: true
        rows: [["Límite", "S/ 50"], ["Programa viejo", "S/ 55"]]
        clue: { find: "Yanet", says: 55, saysLabel: Programa viejo }
      - name: Abdón
        kind: person
        rows: [["Límite", "S/ 30"], ["Programa viejo", "S/ 30"]]
        clue: { find: "Abdón", says: 30, saysLabel: Programa viejo }
    caption: "Si Herminia o Abdón no cuadran, revisa tu comparación: llegar **justo** al límite está permitido."
starter: |
  limites = {"Herminia": 60, "Wálter": 40, "Yanet": 50, "Abdón": 30}

  libreta = [
      ("Herminia", "fiar", 25), ("Yanet", "fiar", 20), ("Wálter", "fiar", 30),
      ("Abdón", "fiar", 12), ("Herminia", "fiar", 20), ("Yanet", "fiar", 18),
      ("Wálter", "pagar", 35), ("Abdón", "fiar", 9), ("Herminia", "pagar", 30),
      ("Yanet", "fiar", 15), ("Wálter", "pagar", 30), ("Abdón", "pagar", 21),
      ("Herminia", "fiar", 40), ("Yanet", "pagar", 8), ("Wálter", "fiar", 12),
      ("Abdón", "fiar", 30), ("Herminia", "fiar", 5), ("Yanet", "fiar", 10),
  ]

  # Así se lee una línea de la libreta:
  cliente, accion, monto = libreta[0]
  print(cliente, accion, monto)

  # TODO: class CuentaFiado con cliente, limite y la propiedad deuda
  #       (el setter lanza ValueError si queda fuera de 0…limite),
  #       y los métodos fiar(monto) y pagar(monto).

  # TODO: una cuenta por cliente; repite la libreta atrapando el ValueError
  #       e imprime la deuda final así: Herminia: 60
solution: |
  limites = {"Herminia": 60, "Wálter": 40, "Yanet": 50, "Abdón": 30}

  libreta = [
      ("Herminia", "fiar", 25), ("Yanet", "fiar", 20), ("Wálter", "fiar", 30),
      ("Abdón", "fiar", 12), ("Herminia", "fiar", 20), ("Yanet", "fiar", 18),
      ("Wálter", "pagar", 35), ("Abdón", "fiar", 9), ("Herminia", "pagar", 30),
      ("Yanet", "fiar", 15), ("Wálter", "pagar", 30), ("Abdón", "pagar", 21),
      ("Herminia", "fiar", 40), ("Yanet", "pagar", 8), ("Wálter", "fiar", 12),
      ("Abdón", "fiar", 30), ("Herminia", "fiar", 5), ("Yanet", "fiar", 10),
  ]


  class CuentaFiado:
      def __init__(self, cliente, limite):
          self.cliente = cliente
          self.limite = limite
          self.deuda = 0

      @property
      def deuda(self):
          return self._deuda

      @deuda.setter
      def deuda(self, valor):
          if not 0 <= valor <= self.limite:
              raise ValueError(f"deuda fuera de rango: {valor}")
          self._deuda = valor

      def fiar(self, monto):
          self.deuda += monto

      def pagar(self, monto):
          self.deuda -= monto


  cuentas = {cliente: CuentaFiado(cliente, limite) for cliente, limite in limites.items()}
  rechazadas = 0
  for cliente, accion, monto in libreta:
      cuenta = cuentas[cliente]
      try:
          if accion == "fiar":
              cuenta.fiar(monto)
          else:
              cuenta.pagar(monto)
      except ValueError:
          rechazadas += 1

  for cuenta in cuentas.values():
      print(f"{cuenta.cliente}: {cuenta.deuda}")
  print("Operaciones rechazadas:", rechazadas)
answer: Yanet
answerLabel: ¿A quién le fiaron de más?
reveal: |
  A Yanet. Con 38 de deuda le fiaron 15 más: 53, por encima de su límite de 50. Esa operación tenía que rechazarse, y su deuda final es 40, no 55. Wálter es la otra operación rechazada (quiso pagar 35 debiendo 30), pero esa el programa viejo sí la rechazaba. Herminia y Abdón terminan **justo** en su límite: con `<` en vez de `<=` también te salían mal.
hints:
  - "Con la validación en el setter, `fiar` y `pagar` son de una línea: `self.deuda += monto`. Si el setter lanza el error, `_deuda` no cambia."
  - "Repite la libreta con `try:` alrededor de la operación y `except ValueError:` para contar la rechazada y seguir."
```

## El juez

Otra vez un problema de **diseño**: tú escribes la clase y el juez la usa a través de `probar`, que ya viene escrita. Como el juez compara lo que **devuelve** una función, `probar` crea una cuenta, le aplica una lista de operaciones y devuelve lo que respondió cada una; si una lanza `ValueError`, anota `"error"` y sigue. Las operaciones llegan como símbolos para que los casos sean iguales en cualquier idioma.

```exercise
id: py12-juez-monedero
type: judge
mode: function
function: probar
title: El monedero de El Arco
prompt: |
  **Escribe la clase `Cuenta`, el monedero prepagado de la panadería, con un `saldo` que nunca es negativo.**

  Los clientes de siempre dejan plata adelantada y compran con ella. Escribe `class Cuenta` con:

  - `Cuenta(titular, saldo=0)`: guarda el titular y el saldo. El saldo inicial **también se valida**.
  - `saldo`: una propiedad. Su setter lanza `ValueError` si el valor es negativo (0 está bien).
  - `recargar(monto)`: si `monto` no es positivo, `ValueError`. Si no, suma el monto, y si es de **50 o más** suma también un **bono de 5** (guarda el 5 y el 50 como atributos de la clase). Devuelve el saldo nuevo.
  - `comprar(precio)`: si `precio` no es positivo, `ValueError`. Si no, resta el precio; si no alcanza, el setter lo rechaza y el saldo queda igual. Devuelve el saldo nuevo.
  - `__str__`: `"Ximena: S/ 68"` (el titular, dos puntos y el saldo).

  `probar(saldo_inicial, operaciones)` aplica las operaciones a una cuenta de Ximena: `["+", monto]` recarga, `["-", precio]` compra, `["=", valor]` asigna `cuenta.saldo = valor`, `["s"]` pide `str(cuenta)`. Si el saldo inicial no es válido, devuelve `["error"]`. No la cambies.

  **Restricciones:** saldo inicial de −5 a 60 · hasta 25 operaciones · montos de −10 a 90.
visual:
  figure:
    title: El ejemplo 1, operación por operación (empieza con 20)
    panes:
      - { table: { head: ["operación", "saldo", "devuelve"], rows: [["[\"-\", 7]", "13", "13"], ["[\"-\", 15]", "13 (no alcanza)", "\"error\""], ["[\"+\", 50]", "13 + 50 + 5 = 68", "68"], ["[\"s\"]", "68", "\"Ximena: S/ 68\""], ["[\"=\", -3]", "68 (negativo)", "\"error\""], ["[\"+\", 0]", "68 (no es positivo)", "\"error\""]] } }
    caption: "Una operación rechazada no cambia nada: el saldo sigue en lo que estaba."
starter: |
  class Cuenta:
      # TODO: atributos de la clase (el bono y desde cuánto se da),
      #       __init__, la propiedad saldo con su setter,
      #       recargar, comprar y __str__
      pass


  def probar(saldo_inicial, operaciones):
      """El juez llama a esta función. No la cambies."""
      try:
          cuenta = Cuenta("Ximena", saldo_inicial)
      except ValueError:
          return ["error"]
      resultados = []
      for op, *dato in operaciones:
          try:
              if op == "+":
                  resultados.append(cuenta.recargar(dato[0]))
              elif op == "-":
                  resultados.append(cuenta.comprar(dato[0]))
              elif op == "=":
                  cuenta.saldo = dato[0]
                  resultados.append(cuenta.saldo)
              else:
                  resultados.append(str(cuenta))
          except ValueError:
              resultados.append("error")
      return resultados
solution: |
  class Cuenta:
      BONO = 5
      RECARGA_CON_BONO = 50

      def __init__(self, titular, saldo=0):
          self.titular = titular
          self.saldo = saldo

      @property
      def saldo(self):
          return self._saldo

      @saldo.setter
      def saldo(self, valor):
          if valor < 0:
              raise ValueError("el saldo no puede ser negativo")
          self._saldo = valor

      def recargar(self, monto):
          if monto <= 0:
              raise ValueError("la recarga tiene que ser positiva")
          bono = self.BONO if monto >= self.RECARGA_CON_BONO else 0
          self.saldo += monto + bono
          return self.saldo

      def comprar(self, precio):
          if precio <= 0:
              raise ValueError("el precio tiene que ser positivo")
          self.saldo -= precio
          return self.saldo

      def __str__(self):
          return f"{self.titular}: S/ {self.saldo}"


  def probar(saldo_inicial, operaciones):
      """El juez llama a esta función. No la cambies."""
      try:
          cuenta = Cuenta("Ximena", saldo_inicial)
      except ValueError:
          return ["error"]
      resultados = []
      for op, *dato in operaciones:
          try:
              if op == "+":
                  resultados.append(cuenta.recargar(dato[0]))
              elif op == "-":
                  resultados.append(cuenta.comprar(dato[0]))
              elif op == "=":
                  cuenta.saldo = dato[0]
                  resultados.append(cuenta.saldo)
              else:
                  resultados.append(str(cuenta))
          except ValueError:
              resultados.append("error")
      return resultados
hints:
  - "En `__init__` escribe `self.saldo = saldo` (sin guion bajo): así el saldo inicial pasa por el setter y se valida."
  - "En `comprar` basta `self.saldo -= precio`: si el resultado es negativo, el setter lanza el error **antes** de guardar, y el saldo queda igual."
samples:
  - args: [20, [["-", 7], ["-", 15], ["+", 50], ["s"], ["=", -3], ["+", 0]]]
    returns: [13, "error", 68, "Ximena: S/ 68", "error", "error"]
    note: "La segunda compra no alcanza; la recarga de 50 trae bono; asignar −3 y recargar 0 se rechazan."
  - args: [-5, [["s"]]]
    returns: ["error"]
    note: Un saldo inicial negativo también se rechaza.
  - args: [0, [["+", 49], ["-", 49], ["s"]]]
    returns: [49, 0, "Ximena: S/ 0"]
    note: "Con 49 no hay bono, y gastar justo todo lo que hay está permitido."
edge:
  - args: [12, []]
    tag: sin operaciones
  - args: [0, [["s"]]]
    tag: con saldo inicial cero
  - args: [10, [["-", 10], ["-", 1]]]
    tag: comprando justo lo que hay
  - args: [8, [["-", 9], ["s"]]]
    tag: con una compra que no alcanza
  - args: [0, [["+", 50], ["+", 49], ["+", 51]]]
    tag: con recargas en el borde del bono
  - args: [5, [["+", 0], ["+", -20], ["-", 0], ["-", -4], ["s"]]]
    tag: con montos cero y negativos
  - args: [30, [["=", -1], ["s"], ["=", 0], ["s"], ["+", 90]]]
    tag: asignando el saldo directamente
  - args: [-1, [["+", 50]]]
    tag: con saldo inicial negativo
random:
  count: 40
  seed: 1212
  generate: |
    operaciones = []
    for _ in range(rng.int(1, 25)):
        op = rng.pick(["+", "+", "-", "-", "-", "=", "s"])
        if op == "s":
            operaciones.append(["s"])
        elif op == "=":
            operaciones.append(["=", rng.int(-10, 80)])
        elif op == "+":
            operaciones.append(["+", rng.pick([0, 50, rng.int(-5, 49), rng.int(51, 90)])])
        else:
            operaciones.append(["-", rng.pick([0, rng.int(1, 30), rng.int(-3, 60)])])
    return [rng.pick([0, 0, rng.int(1, 60), rng.int(-5, -1)]), operaciones]
wrong:
  - |
    class Cuenta:
        BONO = 5
        RECARGA_CON_BONO = 50
        def __init__(self, titular, saldo=0):
            self.titular = titular
            self._saldo = saldo
        @property
        def saldo(self):
            return self._saldo
        @saldo.setter
        def saldo(self, valor):
            if valor < 0:
                raise ValueError("negativo")
        def recargar(self, monto):
            if monto <= 0:
                raise ValueError("monto")
            self.saldo += monto + (self.BONO if monto >= self.RECARGA_CON_BONO else 0)
            return self.saldo
        def comprar(self, precio):
            if precio <= 0:
                raise ValueError("precio")
            self.saldo -= precio
            return self.saldo
        def __str__(self):
            return f"{self.titular}: S/ {self.saldo}"
    def probar(saldo_inicial, operaciones):
        try:
            cuenta = Cuenta("Ximena", saldo_inicial)
        except ValueError:
            return ["error"]
        resultados = []
        for op, *dato in operaciones:
            try:
                if op == "+":
                    resultados.append(cuenta.recargar(dato[0]))
                elif op == "-":
                    resultados.append(cuenta.comprar(dato[0]))
                elif op == "=":
                    cuenta.saldo = dato[0]
                    resultados.append(cuenta.saldo)
                else:
                    resultados.append(str(cuenta))
            except ValueError:
                resultados.append("error")
        return resultados
  - |
    class Cuenta:
        BONO = 5
        RECARGA_CON_BONO = 50
        def __init__(self, titular, saldo=0):
            self.titular = titular
            self._saldo = saldo
        @property
        def saldo(self):
            return self._saldo
        @saldo.setter
        def saldo(self, valor):
            if valor < 0:
                raise ValueError("negativo")
            self._saldo = valor
        def recargar(self, monto):
            if monto <= 0:
                raise ValueError("monto")
            self.saldo += monto + (self.BONO if monto >= self.RECARGA_CON_BONO else 0)
            return self.saldo
        def comprar(self, precio):
            if precio <= 0:
                raise ValueError("precio")
            self.saldo -= precio
            return self.saldo
        def __str__(self):
            return f"{self.titular}: S/ {self.saldo}"
    def probar(saldo_inicial, operaciones):
        try:
            cuenta = Cuenta("Ximena", saldo_inicial)
        except ValueError:
            return ["error"]
        resultados = []
        for op, *dato in operaciones:
            try:
                if op == "+":
                    resultados.append(cuenta.recargar(dato[0]))
                elif op == "-":
                    resultados.append(cuenta.comprar(dato[0]))
                elif op == "=":
                    cuenta.saldo = dato[0]
                    resultados.append(cuenta.saldo)
                else:
                    resultados.append(str(cuenta))
            except ValueError:
                resultados.append("error")
        return resultados
  - |
    class Cuenta:
        BONO = 5
        RECARGA_CON_BONO = 50
        def __init__(self, titular, saldo=0):
            self.titular = titular
            self.saldo = saldo
        @property
        def saldo(self):
            return self._saldo
        @saldo.setter
        def saldo(self, valor):
            if valor < 0:
                raise ValueError("negativo")
            self._saldo = valor
        def recargar(self, monto):
            if monto <= 0:
                raise ValueError("monto")
            self.saldo += monto + (self.BONO if monto > self.RECARGA_CON_BONO else 0)
            return self.saldo
        def comprar(self, precio):
            if precio <= 0:
                raise ValueError("precio")
            if precio >= self.saldo:
                raise ValueError("no alcanza")
            self.saldo -= precio
            return self.saldo
        def __str__(self):
            return f"{self.titular}: S/ {self.saldo}"
    def probar(saldo_inicial, operaciones):
        try:
            cuenta = Cuenta("Ximena", saldo_inicial)
        except ValueError:
            return ["error"]
        resultados = []
        for op, *dato in operaciones:
            try:
                if op == "+":
                    resultados.append(cuenta.recargar(dato[0]))
                elif op == "-":
                    resultados.append(cuenta.comprar(dato[0]))
                elif op == "=":
                    cuenta.saldo = dato[0]
                    resultados.append(cuenta.saldo)
                else:
                    resultados.append(str(cuenta))
            except ValueError:
                resultados.append("error")
        return resultados
tests:
  - name: saldo es una propiedad con setter
    source: '@property[\s\S]*@saldo\.setter'
```

## Misión final

```exercise
id: py12-mision-mozo
type: mission
title: Quilla, mozo de El Arco
prompt: |
  **Completa la clase `Mozo`, que envuelve al robot y sabe atender una mesa, y úsala para servir todos los `pedidos` en orden; al final, Quilla dice cuántos platos sirvió.**

  Quilla empieza en la cocina (K). La clase ya trae, como **atributo de la clase**, la ruta desde la cocina hasta la casilla de encima de cada mesa (`"O"` es oeste). `robot.seguir_ruta(pasos)` camina una lista de direcciones, como `["E", "E", "S"]`; `list("EES")` la arma desde un texto. Tu parte:

  - `__init__(self, robot)`: guarda el robot y crea la lista `servidos`, **propia de cada mozo**.
  - `invertir(ruta)`, un `@staticmethod`: la ruta de vuelta, como texto. Se recorre al revés y cada dirección cambia por su opuesta: `invertir("EES")` es `"NOO"`.
  - `atender(mesa, plato)`: prepara el plato, va a la mesa, sirve, **vuelve a la cocina** y anota el par `(mesa, plato)` en `servidos`.
  - `__str__`: `"3 platos servidos"`, con el número que corresponda.

  Crea un mozo con `Mozo(robot)`, atiende cada pedido (`pedidos` es una lista de pares `[mesa, plato]` que cambia en cada prueba) y termina con `robot.decir(str(mozo))`. Cuando pase, junto con el juez, se desbloquea la sesión 13.
visual:
  figure:
    title: Las rutas de Mozo.RUTAS
    panes:
      - { label: "a la mesa 3 y de vuelta", grid: ["############", "#K.........#", "#.##1###2#.#", "#.##.......#", "#.####3###.#", "#..........#", "###4####5###", "############"], path: ["1,1", "2,1", "3,1", "4,1", "5,1", "6,1", "7,1", "8,1", "9,1", "10,1", "10,2", "10,3", "9,3", "8,3", "7,3", "6,3"] }
      - { label: ida y vuelta, table: { head: ["mesa", "ida", "vuelta"], rows: [["1", "EEE", "OOO"], ["3", "EEEEEEEEE SS OOOO", "EEEE NN OOOOOOOOO"], ["4", "SSSS EE", "OO NNNN"]] } }
starter: |
  # pedidos llega de la caja, por ejemplo: [[3, "pan de yema"], [4, "pastel de choclo"]]


  class Mozo:
      # De la cocina a la casilla de encima de cada mesa ("O" es oeste)
      RUTAS = {
          1: "EEE",
          2: "E" * 7,
          3: "E" * 9 + "SS" + "O" * 4,
          4: "SSSS" + "EE",
          5: "SSSS" + "E" * 7,
      }

      def __init__(self, robot):
          # TODO: guarda el robot y crea la lista servidos
          pass

      @staticmethod
      def invertir(ruta):
          # TODO: la ruta al revés, con cada dirección cambiada por su opuesta
          pass

      def atender(self, mesa, plato):
          # TODO: prepara, ve a la mesa, sirve, vuelve y anota (mesa, plato)
          pass

      def __str__(self):
          # TODO: "3 platos servidos"
          pass


  # TODO: crea el mozo, atiende cada pedido y haz que Quilla diga str(mozo)
solution: |
  class Mozo:
      # De la cocina a la casilla de encima de cada mesa ("O" es oeste)
      RUTAS = {
          1: "EEE",
          2: "E" * 7,
          3: "E" * 9 + "SS" + "O" * 4,
          4: "SSSS" + "EE",
          5: "SSSS" + "E" * 7,
      }

      def __init__(self, robot):
          self.robot = robot
          self.servidos = []

      @staticmethod
      def invertir(ruta):
          opuesta = {"N": "S", "S": "N", "E": "O", "O": "E"}
          return "".join(opuesta[paso] for paso in reversed(ruta))

      def atender(self, mesa, plato):
          ruta = self.RUTAS[mesa]
          self.robot.preparar(plato)
          self.robot.seguir_ruta(list(ruta))
          self.robot.servir()
          self.robot.seguir_ruta(list(self.invertir(ruta)))
          self.servidos.append((mesa, plato))

      def __str__(self):
          return f"{len(self.servidos)} platos servidos"


  mozo = Mozo(robot)
  for mesa, plato in pedidos:
      mozo.atender(mesa, plato)
  robot.decir(str(mozo))
hints:
  - "Para invertir: `reversed(ruta)` recorre el texto al revés, un diccionario `{\"N\": \"S\", …}` da la opuesta de cada paso, y `\"\".join(…)` los vuelve a juntar."
  - "Dentro de `atender`, la ruta de ida es `self.RUTAS[mesa]` y la de vuelta `self.invertir(ruta)`; las dos se caminan con `self.robot.seguir_ruta(list(…))`."
world:
  theme: cocina
  level: 4
  dir: E
  api: [move, kitchen, path]
  map: |
    ############
    #K.........#
    #.##1###2#.#
    #.##.......#
    #.####3###.#
    #..........#
    ###4####5###
    ############
globals:
  pedidos:
    - [1, pan de yema]
    - [4, pastel de choclo]
    - [3, chicha de maíz morado]
scenarios:
  - tests:
      - name: dice "3 platos servidos"
        state: 'w.said[-1:] == ["3 platos servidos"]'
  - globals:
      pedidos:
        - [5, empanada de queso]
        - [2, rosquitas]
        - [3, pan de yema]
        - [5, café pasado]
        - [1, pastel de choclo]
    tests:
      - name: dice "5 platos servidos"
        state: 'w.said[-1:] == ["5 platos servidos"]'
  - globals:
      pedidos:
        - [3, pan francés]
        - [4, pan francés]
    tests:
      - name: dice "2 platos servidos"
        state: 'w.said[-1:] == ["2 platos servidos"]'
tests:
  - name: invertir da la ruta de vuelta
    run: Mozo.invertir("EES")
    equals: NOO
  - name: invertir una ruta de la clase
    run: Mozo.invertir(Mozo.RUTAS[3])
    equals: EEEENNOOOOOOOOO
  - name: cada pedido llega a su mesa, en orden
    state: 'len(w.served) == len(g.pedidos) and all(s.table == m and s.dish == p for s, (m, p) in zip(w.served, g.pedidos))'
    msg: Los platos servidos no coinciden con los pedidos (mesa, plato u orden).
  - name: el mozo anota lo que sirvió
    expect: 'mozo.servidos == [tuple(p) for p in pedidos]'
  - name: cada mozo tiene su propia lista
    expect: Mozo(robot).servidos == []
    msg: "Crea la lista en __init__ con self.servidos = []; una lista en el cuerpo de la clase la comparten todos los mozos."
  - name: termina en la cocina
    state: w.at_kitchen
  - name: sin chocar
    state: not w.crashed
```

## Reto experto

```exercise
id: py12-reto-vitrina
type: challenge
title: La vitrina por hornadas
visual:
  figure:
    title: Vitrina.desde_texto(…).orden()
    input: { label: texto, text: "06:30 40 pan de yema\n05:45 60 tacneño\n06:30 25 francés\n05:45 12 tacneño" }
    arrow: "ordena por hora y pan; la hornada repetida cuenta una vez"
    output: { label: devuelve, text: "['05:45 tacneño', '06:30 francés', '06:30 pan de yema']" }
prompt: |
  **Escribe dos dataclasses, `Hornada` y `Vitrina`, para el registro de hornadas de la panadería.** Para quien ya programa.

  - `Hornada(hora, pan, unidades)`: **inmutable** (`frozen`) y **ordenable** (`order`) por hora y después por pan. Las unidades **no cuentan** para comparar ni para el hash: `field(compare=False)`. Así, dos registros de la misma hora y el mismo pan son la misma hornada.
  - `Hornada.desde_linea("06:30 40 pan de yema")`: un `@classmethod`. La hora, las unidades y el resto es el pan (que puede tener espacios).
  - `Vitrina(hornadas)`: una lista de hornadas, vacía por defecto y propia de cada vitrina.
  - `Vitrina.desde_texto(texto)`: una hornada por línea no vacía; si una hornada se repite, se queda **la primera**.
  - `orden()`: la lista `"hora pan"` de las hornadas, ordenadas. `por_pan()`: un diccionario pan → unidades sumadas.
starter: |
  from dataclasses import dataclass, field


  # TODO: Hornada y Vitrina
solution: |
  from dataclasses import dataclass, field


  @dataclass(frozen=True, order=True)
  class Hornada:
      hora: str
      pan: str
      unidades: int = field(compare=False)

      @classmethod
      def desde_linea(cls, linea):
          hora, unidades, pan = linea.split(maxsplit=2)
          return cls(hora, pan, int(unidades))


  @dataclass
  class Vitrina:
      hornadas: list[Hornada] = field(default_factory=list)

      @classmethod
      def desde_texto(cls, texto):
          vitrina = cls()
          for linea in texto.splitlines():
              if linea.strip():
                  hornada = Hornada.desde_linea(linea)
                  if hornada not in vitrina.hornadas:
                      vitrina.hornadas.append(hornada)
          return vitrina

      def orden(self):
          return [f"{h.hora} {h.pan}" for h in sorted(self.hornadas)]

      def por_pan(self):
          conteo = {}
          for h in self.hornadas:
              conteo[h.pan] = conteo.get(h.pan, 0) + h.unidades
          return conteo
hints:
  - "`linea.split(maxsplit=2)` corta solo en los dos primeros espacios: lo que queda es el pan entero."
  - "Con `compare=False`, `hornada in lista` ya ignora las unidades: te sirve para descartar las repetidas."
tests:
  - name: desde_linea
    expect: 'Hornada.desde_linea("06:30 40 pan de yema") == Hornada("06:30", "pan de yema", 40)'
  - name: las unidades no cuentan para comparar
    expect: 'Hornada("06:30", "yema", 40) == Hornada("06:30", "yema", 10)'
  - name: es inmutable y se puede guardar en un set
    expect: 'len({Hornada("06:30", "yema", 40), Hornada("06:30", "yema", 10)}) == 1'
    msg: "Una dataclass con frozen=True se puede hashear; sin frozen, no."
  - name: se ordena por hora y después por pan
    run: 'Vitrina.desde_texto("06:30 40 pan de yema\n05:45 60 tacneño\n06:30 25 francés\n05:45 12 tacneño").orden()'
    equals: ["05:45 tacneño", "06:30 francés", "06:30 pan de yema"]
  - name: la repetida cuenta una vez, con las unidades de la primera
    run: 'Vitrina.desde_texto("05:45 60 tacneño\n\n07:00 30 tacneño\n05:45 12 tacneño\n07:00 24 pan de yema").por_pan()'
    equals: { "tacneño": 90, "pan de yema": 24 }
  - name: una vitrina nueva está vacía y es solo suya
    expect: Vitrina().hornadas == [] and Vitrina().hornadas is not Vitrina().hornadas
  - name: usa frozen y order
    source: '@dataclass\(\s*(frozen=True\s*,\s*order=True|order=True\s*,\s*frozen=True)\s*\)'
```
