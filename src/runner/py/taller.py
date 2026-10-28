"""The Python track's runner, inside Pyodide: runs a learner's program against an exercise, judges
it, traces snippets for the concept animations and plays scene programs on the robot's world.

The same file runs in the browser worker and, through the Node build and verify scripts, on the
same Pyodide, so the checks a learner sees are the ones the build verified. JavaScript talks to it
with JSON strings only (see src/runner/pybridge.js); the robot's world stays the JavaScript
engine, reached through the `taller_js` module the bridge registers.
"""

import ast
import asyncio
import asyncio.base_events
import builtins
import copy
import importlib
import inspect
import io
import json
import math
import os
import re
import shutil
import sys
import time
import tokenize
from collections import deque, namedtuple

import taller_js

FILENAME = "<taller>"
MAX_LINES = 500
MAX_OUTPUT = 200_000

T = {
    "es": {
        "gaps": "Todavía quedan huecos ___ por completar.",
        "notDefined": "No existe `{0}`. ¿Lo escribiste igual, con las mismas mayúsculas, y le diste un valor antes de usarlo?",
        "unbound": "Usas `{0}` dentro de la función antes de darle valor ahí. Como la asignas en la función, Python la trata como local: pásala como parámetro, o usa `nonlocal`/`global` si de verdad quieres cambiar la de afuera.",
        "syntax": "Error de sintaxis: {0}. Revisa paréntesis, comillas y los dos puntos al final de if, for, while y def.",
        "indent": "La sangría no cuadra: {0}. Dentro de un bloque, todas las líneas van con los mismos espacios (4 por nivel).",
        "concat": 'Intentaste usar + entre un texto y algo que no es texto. Si querías sumar, convierte el texto a número con int(...) o float(...); si querías armar un mensaje, usa un f-string: f"{{valor}}".',
        "operand": "No se puede usar `{0}` entre {1} y {2}. Revisa los tipos: ¿alguno es texto cuando debería ser número (usa int(...) o float(...))?",
        "notSubscriptable": "Intentaste usar [ ] sobre {0}, que no se puede indexar.",
        "noneSubscript": "Intentaste usar [ ] sobre None. ¿Una función no devolvió nada (le falta return) o una variable quedó en None?",
        "notCallable": "`{0}` no es una función, así que no se puede llamar con ().",
        "missingArg": "Llamaste a `{0}` sin el argumento `{1}`. Revisa cuántos valores le pasas.",
        "tooManyArgs": "Llamaste a `{0}` con más argumentos de los que acepta.",
        "strAssign": "Los textos no se pueden cambiar por partes (son inmutables). Arma un texto nuevo.",
        "tupleAssign": "Las tuplas no se pueden cambiar (son inmutables). Usa una lista o arma una tupla nueva.",
        "unhashable": "Un {0} no puede ser clave de un diccionario ni estar en un set, porque puede cambiar. Usa una tupla en su lugar.",
        "noneAttr": "Intentaste leer `.{0}` de None. ¿Una función no devolvió nada (le falta return)?",
        "noAttr": "{0} no tiene `.{1}`.",
        "noAttrHint": "{0} no tiene `.{1}`; en Python se dice `.{2}`.",
        "index": "Pediste una posición que no existe. Las posiciones van de 0 a len(...) - 1.",
        "key": "El diccionario no tiene la clave {0}. Revisa con `in` antes, o usa .get().",
        "zero": "Dividiste entre cero.",
        "recursion": "La pila de llamadas se desbordó: una función se llamó a sí misma miles de veces sin parar. Revisa el caso base: ¿hay un caso que devuelva sin volver a llamar, y cada llamada se acerca a él?",
        "intParse": "int() no pudo convertir {0} en un número entero.",
        "floatParse": "float() no pudo convertir {0} en un número.",
        "unpack": "Al desempaquetar, la cantidad de nombres no coincide con la de valores ({0}).",
        "noInput": "Este ejercicio no tiene entrada que leer: input() solo se usa en los problemas del juez.",
        "eof": "input() ya no tiene más líneas que leer: leíste más de las que trae la entrada.",
        "generic": "{0}",
        "line": " (línea {0})",
        "expected": "Esperaba {0}, pero salió {1}.",
        "output": "La consola debería mostrar:\n{0}\nPero mostró:\n{1}",
        "outputHas": "En la consola falta: {0}",
        "source": "Tu código todavía no usa lo que pide el ejercicio.",
        "sourceNot": "Tu código usa algo que este ejercicio pide evitar.",
        "failed": "Todavía no se cumple.",
        "gotWant": "`{0}` vale {1}; se esperaba {2}.",
        "outputGot": "La consola mostró: {0}",
        "nothingOut": "(nada)",
        "robotAt": "El robot terminó en ({0}, {1}) mirando al {2}{3}, tras {4} acciones.",
        "battery": ", con {0} de batería",
        "goalAt": " El objetivo está en ({0}, {1}).",
        "dirs": {"N": "norte", "E": "este", "S": "sur", "W": "oeste"},
        "none": "ninguna",
        "nothing": "nada",
        "room": "sala {0}",
        "doors": " Puertas abiertas: {0}. Movimiento en: {1}. Alarma en: {2}.",
        "crystals": " Quedan {0} de {1} cristales; reportó {2}.",
        "served": " Sirvió: {0}.",
        "dish": "mesa {0} {1}",
        "crashed": "El programa se detuvo antes de llegar aquí.",
        "scenario": "Escenario {0} de {1}",
        "missing": "No encontré la función `{0}`. Revisa que se llame así, con las mismas letras.",
        "stuck": "El programa se quedó esperando algo que nunca termina (un await que nunca se cumple).",
        "tooMany": "Demasiadas esperas: ¿un bucle que nunca termina de pedir o esperar?",
        "down": 'El servidor no respondió al pedir "{0}" (503). Inténtalo otra vez.',
        "notFound": 'El servidor no tiene "{0}" (404).',
        "unserializable": "La función devolvió un {0}, que no es un valor que el juez sepa comparar. Devuelve números, textos, listas, tuplas o diccionarios.",
        "asyncNoAwait": "Llamaste a una función async sin await: devuelve una corrutina, no su resultado.",
        "timeout": "TimeoutError: se acabó el tiempo de espera (asyncio.timeout o wait_for) antes de que terminara.",
    },
    "en": {
        "gaps": "There are still ___ gaps to fill in.",
        "notDefined": "`{0}` doesn't exist. Did you spell it the same, same capitals, and give it a value before using it?",
        "unbound": "You use `{0}` inside the function before giving it a value there. Since you assign it in the function, Python treats it as local: pass it as a parameter, or use `nonlocal`/`global` if you really mean to change the outer one.",
        "syntax": "Syntax error: {0}. Check brackets, quotes and the colon at the end of if, for, while and def.",
        "indent": "The indentation doesn't line up: {0}. Inside a block, every line has the same spaces (4 per level).",
        "concat": 'You used + between a string and something that isn\'t a string. If you meant to add, turn the text into a number with int(...) or float(...); if you meant to build a message, use an f-string: f"{{value}}".',
        "operand": "`{0}` can't be used between {1} and {2}. Check the types: is one of them text when it should be a number (use int(...) or float(...))?",
        "notSubscriptable": "You tried to use [ ] on {0}, which can't be indexed.",
        "noneSubscript": "You tried to use [ ] on None. Did a function return nothing (missing return) or a variable stay None?",
        "notCallable": "`{0}` is not a function, so it can't be called with ().",
        "missingArg": "You called `{0}` without the argument `{1}`. Check how many values you pass.",
        "tooManyArgs": "You called `{0}` with more arguments than it takes.",
        "strAssign": "Strings can't be changed in place (they're immutable). Build a new string.",
        "tupleAssign": "Tuples can't be changed (they're immutable). Use a list, or build a new tuple.",
        "unhashable": "A {0} can't be a dictionary key or a set member, because it can change. Use a tuple instead.",
        "noneAttr": "You tried to read `.{0}` from None. Did a function return nothing (missing return)?",
        "noAttr": "{0} has no `.{1}`.",
        "noAttrHint": "{0} has no `.{1}`; in Python it's `.{2}`.",
        "index": "You asked for a position that doesn't exist. Positions go from 0 to len(...) - 1.",
        "key": "The dictionary has no key {0}. Check with `in` first, or use .get().",
        "zero": "You divided by zero.",
        "recursion": "The call stack overflowed: a function called itself thousands of times without stopping. Check the base case: is there a case that returns without calling again, and does every call get closer to it?",
        "intParse": "int() couldn't turn {0} into a whole number.",
        "floatParse": "float() couldn't turn {0} into a number.",
        "unpack": "When unpacking, the number of names doesn't match the number of values ({0}).",
        "noInput": "This exercise has no input to read: input() is only for the judge's problems.",
        "eof": "input() has no more lines: you read more lines than the input has.",
        "generic": "{0}",
        "line": " (line {0})",
        "expected": "Expected {0}, but got {1}.",
        "output": "The console should show:\n{0}\nBut it showed:\n{1}",
        "outputHas": "Missing from the console: {0}",
        "source": "Your code doesn't use what the exercise asks for yet.",
        "sourceNot": "Your code uses something this exercise asks you to avoid.",
        "failed": "Not met yet.",
        "gotWant": "`{0}` is {1}; expected {2}.",
        "outputGot": "The console showed: {0}",
        "nothingOut": "(nothing)",
        "robotAt": "The robot ended at ({0}, {1}) facing {2}{3}, after {4} actions.",
        "battery": ", with {0} battery left",
        "goalAt": " The goal is at ({0}, {1}).",
        "dirs": {"N": "north", "E": "east", "S": "south", "W": "west"},
        "none": "none",
        "nothing": "nothing",
        "room": "room {0}",
        "doors": " Open doors: {0}. Motion at: {1}. Alarm at: {2}.",
        "crystals": " {0} of {1} crystals left; reported {2}.",
        "served": " Served: {0}.",
        "dish": "table {0} {1}",
        "crashed": "The program stopped before getting here.",
        "scenario": "Scenario {0} of {1}",
        "missing": "I couldn't find the function `{0}`. Check that it has exactly that name.",
        "stuck": "The program was left waiting for something that never finishes (an await that never completes).",
        "tooMany": "Too many waits: a loop that never stops requesting or waiting?",
        "down": 'The server didn\'t answer the request for "{0}" (503). Try again.',
        "notFound": 'The server has no "{0}" (404).',
        "unserializable": "The function returned a {0}, which isn't a value the judge can compare. Return numbers, strings, lists, tuples or dictionaries.",
        "asyncNoAwait": "You called an async function without await: it returns a coroutine, not its result.",
        "timeout": "TimeoutError: the wait ran out (asyncio.timeout or wait_for) before it finished.",
    },
}

TYPE_NAMES = {
    "es": {
        "str": "un texto (str)",
        "int": "un entero (int)",
        "float": "un decimal (float)",
        "list": "una lista",
        "dict": "un diccionario",
        "tuple": "una tupla",
        "set": "un set",
        "NoneType": "None",
        "bool": "un booleano",
        "function": "una función",
    },
    "en": {
        "str": "a string (str)",
        "int": "an integer (int)",
        "float": "a float",
        "list": "a list",
        "dict": "a dictionary",
        "tuple": "a tuple",
        "set": "a set",
        "NoneType": "None",
        "bool": "a boolean",
        "function": "a function",
    },
}
# Methods learners bring from JavaScript, and what Python calls them.
METHOD_HINTS = {
    "push": "append",
    "length": "__len__ → len(...)",
    "toUpperCase": "upper",
    "toLowerCase": "lower",
    "trim": "strip",
    "includes": "__contains__ → in",
    "indexOf": "index",
    "forEach": "__iter__ → for",
    "lenght": "__len__ → len(...)",
    "contains": "__contains__ → in",
    "size": "__len__ → len(...)",
}


def tr(lang, key, *args):
    return T.get(lang, T["es"])[key].format(*args)


def type_name(v, lang):
    n = type(v).__name__
    return TYPE_NAMES.get(lang, TYPE_NAMES["es"]).get(n, n)


# ── Output ──────────────────────────────────────────────────────────────────────────────────
class Capture(io.TextIOBase):
    """What the program prints, as lines; capped so a runaway loop can't fill the memory."""

    def __init__(self):
        self.parts = []
        self.size = 0

    def writable(self):
        return True

    def write(self, s):
        s = str(s)
        if self.size < MAX_OUTPUT:
            self.parts.append(s)
            self.size += len(s)
        return len(s)

    def text(self):
        return "".join(self.parts)

    def lines(self):
        raw = self.text()
        if not raw:
            return []
        if raw.endswith("\n"):
            raw = raw[:-1]
        return raw.split("\n")[:MAX_LINES]


class Streams:
    """Points stdout (and stdin) at the run's own buffers while the program runs."""

    def __init__(self, out, stdin=None):
        self.out, self.stdin = out, stdin

    def __enter__(self):
        self.saved = (sys.stdout, sys.stderr, sys.stdin)
        sys.stdout = self.out
        sys.stderr = self.out
        sys.stdin = self.stdin if self.stdin is not None else io.StringIO("")
        return self

    def __exit__(self, *exc):
        sys.stdout, sys.stderr, sys.stdin = self.saved
        return False


# ── Errors in plain words ───────────────────────────────────────────────────────────────────
class RobotError(BaseException):
    """The robot stopped (a wall, no battery…). Not an Exception, so `except Exception` can't hide it."""


class Stuck(BaseException):
    pass


def error_line(exc):
    if isinstance(exc, SyntaxError) and exc.filename == FILENAME:
        return exc.lineno
    line = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == FILENAME:
            line = tb.tb_lineno
        tb = tb.tb_next
    return line


def explain(exc, lang, with_line=True):
    if isinstance(exc, RobotError):
        return {"kind": "robot", "text": str(exc)}
    t = lambda key, *a: tr(lang, key, *a)  # noqa: E731
    msg = str(exc)
    name = type(exc).__name__
    text = None
    if isinstance(exc, IndentationError):
        text = t("indent", exc.msg)
    elif isinstance(exc, SyntaxError):
        text = t("syntax", exc.msg)
    elif isinstance(exc, UnboundLocalError):
        m = re.search(r"local variable '(\w+)'", msg)
        text = t("unbound", m.group(1) if m else "?")
    elif isinstance(exc, NameError):
        n = getattr(exc, "name", None) or (re.search(r"name '(\w+)'", msg) or [None, "?"])[1]
        text = t("gaps") if n == "___" else t("notDefined", n)
    elif isinstance(exc, RecursionError):
        text = t("recursion")
    elif isinstance(exc, ZeroDivisionError):
        text = t("zero")
    elif isinstance(exc, IndexError) and "out of range" in msg:
        text = t("index")
    elif isinstance(exc, KeyError):
        text = t("key", msg)
    elif isinstance(exc, AttributeError):
        obj = getattr(exc, "obj", None)
        attr = getattr(exc, "name", None)
        if attr is None:
            m = re.search(r"has no attribute '(\w+)'", msg)
            attr = m.group(1) if m else "?"
        if "'NoneType'" in msg:
            text = t("noneAttr", attr)
        elif attr in METHOD_HINTS and "→" not in METHOD_HINTS[attr]:
            text = t("noAttrHint", type_name(obj, lang) if obj is not None else msg.split("'")[1], attr, METHOD_HINTS[attr])
        elif attr in METHOD_HINTS:
            text = t("noAttr", type_name(obj, lang) if obj is not None else msg.split("'")[1], attr) + " " + METHOD_HINTS[attr].split("→ ")[1]
        else:
            m = re.match(r"'(\w+)' object has no attribute", msg)
            what = TYPE_NAMES.get(lang, {}).get(m.group(1), m.group(1)) if m else msg
            text = t("noAttr", what[0].upper() + what[1:], attr) if m else msg
    elif isinstance(exc, TypeError):
        m = None
        if re.search(r'can only concatenate str \(not ".+"\) to str', msg):
            text = t("concat")
        elif m := re.search(r"unsupported operand type\(s\) for (.+): '(\w+)' and '(\w+)'", msg):
            names = TYPE_NAMES.get(lang, {})
            text = t("operand", m.group(1), names.get(m.group(2), m.group(2)), names.get(m.group(3), m.group(3)))
        elif "'NoneType' object is not subscriptable" in msg:
            text = t("noneSubscript")
        elif m := re.search(r"'(\w+)' object is not subscriptable", msg):
            text = t("notSubscriptable", TYPE_NAMES.get(lang, {}).get(m.group(1), m.group(1)))
        elif m := re.search(r"'(\w+)' object is not callable", msg):
            text = t("notCallable", TYPE_NAMES.get(lang, {}).get(m.group(1), m.group(1)))
        elif m := re.search(r"(\w+)\(\) missing \d+ required (?:positional|keyword-only) arguments?: '(\w+)'", msg):
            text = t("missingArg", m.group(1), m.group(2))
        elif m := re.search(r"(\w+)\(\) takes .* but \d+ .*w(?:as|ere) given", msg):
            text = t("tooManyArgs", m.group(1))
        elif "'str' object does not support item assignment" in msg:
            text = t("strAssign")
        elif "'tuple' object does not support item assignment" in msg:
            text = t("tupleAssign")
        elif m := re.search(r"unhashable type: '(\w+)'", msg):
            text = t("unhashable", m.group(1))
    elif isinstance(exc, ValueError):
        if m := re.search(r"invalid literal for int\(\) with base 10: (.+)$", msg):
            text = t("intParse", m.group(1))
        elif m := re.search(r"could not convert string to float: (.+)$", msg):
            text = t("floatParse", m.group(1))
        elif m := re.search(r"(too many values to unpack|not enough values to unpack.*)", msg):
            text = t("unpack", m.group(1))
    elif isinstance(exc, TimeoutError) and not msg:
        text = t("timeout")
    elif isinstance(exc, EOFError):
        text = t("eof")
    if text is None:
        text = f"{name}: {msg}" if msg else name
    line = error_line(exc) if with_line else None
    return {"kind": "py", "text": text + (t("line", line) if line else "")}


# ── Values: how they're shown and compared ───────────────────────────────────────────────────
def plain(v):
    """A value as JSON-able data: tuples become lists, so a test written in YAML can match it."""
    if isinstance(v, (bool, int, str)) or v is None:
        return v
    if isinstance(v, float):
        return v
    if isinstance(v, (list, tuple, deque)):
        return [plain(x) for x in v]
    if isinstance(v, dict):
        return {str(k) if not isinstance(k, str) else k: plain(x) for k, x in v.items()}
    if isinstance(v, (set, frozenset)):
        return sorted((plain(x) for x in v), key=repr)
    raise TypeError(type(v).__name__)


def same(a, b, tol=0.0):
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if tol:
            return abs(a - b) <= tol
        return a == b
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(same(x, y, tol) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(same(a[k], b[k], tol) for k in a)
    return type(a) is type(b) and a == b


def show(v):
    try:
        s = repr(v)
    except Exception:
        s = object.__repr__(v)
    return s if len(s) <= 400 else s[:400] + "…"


def strip_comments(code):
    """The code without comments, for source checks: a `# for` in a comment doesn't count."""
    try:
        out = []
        for tok in tokenize.generate_tokens(io.StringIO(code).readline):
            if tok.type == tokenize.COMMENT:
                continue
            out.append(tok)
        return tokenize.untokenize(out)
    except Exception:
        return re.sub(r"#[^\n]*", "", code)


class AttrDict(dict):
    def __getattr__(self, k):
        try:
            return self[k]
        except KeyError:
            raise AttributeError(k) from None


def snake(name):
    return re.sub(r"(?<=[a-z0-9])([A-Z])", r"_\1", name).lower()


def snake_keys(v):
    if isinstance(v, dict):
        return AttrDict({snake(k): snake_keys(x) for k, x in v.items()})
    if isinstance(v, list):
        return [snake_keys(x) for x in v]
    return v


# ── The robot ───────────────────────────────────────────────────────────────────────────────
ROBOT = {}
CAMEL_TO_SNAKE = {}
POSITION = {"es": namedtuple("Posicion", "x y"), "en": namedtuple("Position", "x y")}


def boot(robot_json):
    ROBOT.update(json.loads(robot_json))
    for m in ROBOT["members"].values():
        for lang in ("es", "en"):
            n = m[lang]["name"]
            CAMEL_TO_SNAKE[n] = snake(n)
    asyncio.run = virtual_run
    sys.setrecursionlimit(max(sys.getrecursionlimit(), 1000))


def py_message(text):
    """Engine messages name members the JavaScript way (hayPared()); here they're snake_case."""
    return re.sub(r"\b([a-z]+[A-Z]\w*)(?=\(|\b)", lambda m: CAMEL_TO_SNAKE.get(m.group(1), m.group(1)), text)


class Robot:
    """The learner's `robot`: the JavaScript world's members, in snake_case."""

    def __init__(self, index, lang):
        object.__setattr__(self, "_i", index)
        object.__setattr__(self, "_lang", lang)
        ids = json.loads(taller_js.worldIds(index))
        members = {}
        for mid in ids:
            m = ROBOT["members"][mid]
            members[snake(m[lang]["name"])] = (mid, m.get("kind", "method"))
        object.__setattr__(self, "_members", members)
        known = {snake(m[l]["name"]) for m in ROBOT["members"].values() for l in ("es", "en")}
        object.__setattr__(self, "_known", known)

    def _call(self, mid, args):
        r = json.loads(taller_js.worldCall(self._i, mid, json.dumps(plain(list(args)))))
        if "error" in r:
            raise RobotError(py_message(r["error"])) if r.get("robot") else RuntimeError(r["error"])
        return r.get("ok")

    def __getattr__(self, name):
        hit = self._members.get(name)
        if hit is None:
            if name in self._known:
                raise RobotError(py_message(json.loads(taller_js.noApi(self._i, f"robot.{name}"))))
            raise AttributeError(f"'robot' has no attribute '{name}'")
        mid, kind = hit
        if kind == "property":
            v = self._call(mid, [])
            if mid == "position":
                return POSITION.get(self._lang, POSITION["es"])(v["x"], v["y"])
            return v
        fn = lambda *args: self._call(mid, args)  # noqa: E731
        fn.__name__ = name
        return fn

    def __setattr__(self, name, value):
        raise AttributeError(f"robot.{name}: read-only")

    def __dir__(self):
        return sorted(self._members)

    def __repr__(self):
        return "<robot>"


# ── The simulated server and a virtual clock for asyncio ────────────────────────────────────
class _Selector:
    """What asyncio polls between callbacks: here it only moves the virtual clock forward."""

    def __init__(self, loop):
        self.loop = loop

    def select(self, timeout):
        if timeout is None:
            raise Stuck()
        if timeout > 0:
            self.loop._now += timeout
            self.loop._waits += 1
            if self.loop._waits > 5000:
                raise Stuck("too many")
        return []

    def close(self):
        pass


class VirtualLoop(asyncio.base_events.BaseEventLoop):
    """An event loop on a simulated clock: sleeps and latencies take no real time."""

    def __init__(self):
        super().__init__()
        self._now = 0.0
        self._waits = 0
        self._selector = _Selector(self)

    def time(self):
        return self._now

    def _process_events(self, event_list):
        pass

    def _write_to_self(self):
        pass

    def close(self):
        self._selector = _Selector(self)
        super().close()


def virtual_run(main, *, debug=None, loop_factory=None):
    """`asyncio.run` for learners: Pyodide's own loop always counts as running, so it steps aside."""
    outer = asyncio.events._get_running_loop()
    asyncio.events._set_running_loop(None)
    try:
        with asyncio.Runner(debug=debug, loop_factory=VirtualLoop) as runner:
            return runner.run(main)
    finally:
        asyncio.events._set_running_loop(outer)


def mulberry(seed):
    a = seed & 0xFFFFFFFF

    def imul(x, y):
        return (x * y) & 0xFFFFFFFF

    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return nxt


class Server:
    """`taller` / `workshop`: answers late (on the virtual clock) and sometimes fails."""

    def __init__(self, config, lang, error_cls):
        self.lang = lang
        self.data = config.get("data", {})
        self.latency = config.get("latency", [100, 400])
        self.fail_rate = config.get("failRate", 0)
        self.fail_on = config.get("failOn", [])
        self.rand = mulberry(config.get("seed", 1))
        self.log = []
        self.sent = []
        self.error_cls = error_cls

    def _clock(self):
        try:
            return round(asyncio.get_running_loop().time() * 1000)
        except RuntimeError:
            return 0

    async def _call(self, resource, payload, is_send):
        n = len(self.log) + 1
        lo, hi = self.latency
        delay = round(lo + self.rand() * (hi - lo))
        fails = (n in self.fail_on) if self.fail_on else self.rand() < self.fail_rate
        start = self._clock()
        entry = {"n": n, "resource": str(resource), "start": start, "end": start + delay, "ok": not fails, "status": 503 if fails else 200}
        if not is_send and not fails and resource not in self.data:
            entry["ok"], entry["status"] = False, 404
        self.log.append(entry)
        await asyncio.sleep(delay / 1000)
        if not entry["ok"]:
            key = "notFound" if entry["status"] == 404 else "down"
            raise self.error_cls(tr(self.lang, key, resource), entry["status"])
        if is_send:
            self.sent.append({"resource": str(resource), "data": copy.deepcopy(payload), "at": self._clock()})
            return {"ok": True}
        return copy.deepcopy(self.data[resource])

    def api(self):
        names = SERVER_NAMES[self.lang]
        s = self

        class Api:
            __slots__ = ()

            def __repr__(self):
                return f"<{names['object']}>"

        api = Api
        setattr(api, names["request"], staticmethod(lambda resource: s._call(resource, None, False)))
        setattr(api, names["send"], staticmethod(lambda resource, data: s._call(resource, data, True)))
        setattr(api, names["now"], staticmethod(lambda: s._clock()))
        return api()

    def summary(self):
        # The loop is gone by now, so the clock is the last moment the server saw: a reply or a send.
        clock = max([e["end"] for e in self.log] + [e["at"] for e in self.sent], default=0)
        return {"clock": clock, "requests": [dict(e) for e in self.log], "sent": [dict(e) for e in self.sent]}


SERVER_NAMES = {
    "es": {"object": "taller", "request": "pedir", "send": "enviar", "now": "ahora", "error": "ErrorServidor"},
    "en": {"object": "workshop", "request": "request", "send": "send", "now": "now", "error": "ServerError"},
}


def server_error_class(lang):
    class ServerError(Exception):
        def __init__(self, message, status):
            super().__init__(message)
            self.status = status

    ServerError.__name__ = ServerError.__qualname__ = SERVER_NAMES[lang]["error"]
    return ServerError


# ── Running a program ───────────────────────────────────────────────────────────────────────
GAP = re.compile(r"(^|[^\w])___([^\w]|$)")


def no_input(lang):
    def input(prompt=""):  # noqa: A001
        raise RuntimeError(tr(lang, "noInput"))

    return input


def helper_values(helpers, lang):
    out = {}
    for h in helpers or []:
        code = h.get("code")
        if code is None:
            continue
        ns = {"__builtins__": builtins}
        src = str(code)
        try:
            out[h["name"]] = eval(compile(src, "<helper>", "eval"), ns)
        except SyntaxError:
            exec(compile(src, "<helper>", "exec"), ns)
            out[h["name"]] = ns[h["name"]]
    return out


def is_async(ex):
    return bool(ex.get("server") or ex.get("async"))


WORKDIR = "/home/pyodide/taller-files"


def prepare_files(files):
    """An exercise's `files:` become real files in a fresh folder, which is the working directory."""
    shutil.rmtree(WORKDIR, ignore_errors=True)
    # A module imported from the last run's files would otherwise shadow this run's version.
    for name, mod in list(sys.modules.items()):
        if (getattr(mod, "__file__", None) or "").startswith(WORKDIR):
            del sys.modules[name]
    importlib.invalidate_caches()
    os.makedirs(WORKDIR, exist_ok=True)
    for path, content in (files or {}).items():
        full = os.path.join(WORKDIR, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(str(content))
    os.chdir(WORKDIR)


def program_namespace(ex, scenario, lang, world_index=None):
    prepare_files({**(ex.get("files") or {}), **(scenario.get("files") or {})})
    ns = {"__name__": "__main__", "__builtins__": builtins}
    server = None
    if world_index is not None:
        ns["robot"] = Robot(world_index, lang)
    if ex.get("server"):
        err = server_error_class(lang)
        cfg = {**(ex.get("server") or {}), **(scenario.get("server") or {})}
        server = Server(cfg, lang, err)
        ns[SERVER_NAMES[lang]["object"]] = server.api()
        ns[SERVER_NAMES[lang]["error"]] = err
    ns.update(helper_values(ex.get("helpers"), lang))
    for k, v in {**(ex.get("globals") or {}), **(scenario.get("globals") or {})}.items():
        ns[k] = copy.deepcopy(v)
    return ns, server


def execute(code, ns, lang, out, *, use_async=False, stdin=None, inputs_allowed=False):
    """Runs the program; returns the explained error, or None."""
    if GAP.search(code):
        return {"kind": "py", "text": tr(lang, "gaps")}
    flags = ast.PyCF_ALLOW_TOP_LEVEL_AWAIT if use_async else 0
    try:
        obj = compile(code, FILENAME, "exec", flags=flags, dont_inherit=True)
    except SyntaxError as e:
        return explain(e, lang)
    saved_input = builtins.input
    if not inputs_allowed:
        builtins.input = no_input(lang)
    try:
        with Streams(out, stdin):
            r = eval(obj, ns)
            if inspect.iscoroutine(r):
                virtual_run(r)
    except SystemExit:
        return None
    except Stuck as e:
        return {"kind": "py", "text": tr(lang, "tooMany" if str(e) == "too many" else "stuck")}
    except BaseException as e:  # the learner's error, explained; KeyboardInterrupt can't happen here
        return explain(e, lang)
    finally:
        builtins.input = saved_input
    return None


def eq_sides(expr):
    """`a == b` alone can say what each side was; anything more complex just passes or fails."""
    try:
        node = ast.parse(expr.strip(), mode="eval").body
    except SyntaxError:
        return None
    if isinstance(node, ast.Compare) and len(node.ops) == 1 and isinstance(node.ops[0], ast.Eq):
        return ast.get_source_segment(expr.strip(), node.left), ast.get_source_segment(expr.strip(), node.comparators[0])
    return None


def evaluate(expr, ns):
    return eval(compile(str(expr), "<test>", "eval"), ns)


def where_text(summary, ex, lang):
    t = lambda key, *a: tr(lang, key, *a)  # noqa: E731
    L = T.get(lang, T["es"])
    s = summary
    rooms = lambda keys: ", ".join(t("room", s["doorKeys"].index(k) + 1) for k in keys) if keys else L["none"]  # noqa: E731
    text = t("robotAt", s["x"], s["y"], L["dirs"][s["dir"]], "" if s["battery"] is None else t("battery", s["battery"]), s["actions"])
    if s.get("goal") and not s["atGoal"]:
        text += t("goalAt", s["goal"][0], s["goal"][1])
    if s["hasDoors"]:
        text += t("doors", rooms(s["openDoorKeys"]), rooms(s["motionDoors"]), rooms(s["alarms"]))
    if s["crystalsTotal"]:
        text += t("crystals", s["crystalsLeft"], s["crystalsTotal"], ", ".join(map(str, s["reports"])) if s["reports"] else L["none"])
    if (ex.get("world") or {}).get("theme") == "cocina":
        text += t("served", ", ".join(t("dish", d["table"], d["dish"]) for d in s["served"]) if s["served"] else L["nothing"])
    return text


def run_once(ex, code, scenario, lang):
    t = lambda key, *a: tr(lang, key, *a)  # noqa: E731
    world_cfg = None
    if ex.get("world"):
        world_cfg = {**ex["world"], **(scenario.get("world") or {})}
        if scenario.get("map"):
            world_cfg["map"] = scenario["map"]
    world = taller_js.newWorld(json.dumps(world_cfg), lang) if world_cfg else None
    out = Capture()
    tests = list(ex.get("tests") or []) + list(scenario.get("tests") or [])
    try:
        ns, server = program_namespace(ex, scenario, lang, world)
    except Exception as e:  # a broken exercise, not the learner's fault
        return {"logs": [], "error": {"kind": "py", "text": f"exercise setup: {e}"}, "tests": [], "pass": False, "world": world}
    given = {**(ex.get("globals") or {}), **(scenario.get("globals") or {})}
    error = execute(code, ns, lang, out, use_async=is_async(ex))
    logs = out.lines()
    summary = json.loads(taller_js.worldSummary(world)) if world is not None else None
    where = where_text(summary, ex, lang) if summary else ""
    told = False
    results = []
    clean = strip_comments(code)
    for x in tests:
        name = x["name"]

        def fail(msg):
            return {"name": name, "pass": False, "msg": msg}

        try:
            if "source" in x:
                ok = re.search(x["source"], clean, re.M)
                results.append({"name": name, "pass": True} if ok else fail(x.get("msg") or t("source")))
                continue
            if "sourceNot" in x:
                ok = not re.search(x["sourceNot"], clean, re.M)
                results.append({"name": name, "pass": True} if ok else fail(x.get("msg") or t("sourceNot")))
                continue
            if "output" in x:
                want = str(x["output"]).rstrip()
                got = "\n".join(l.rstrip() for l in logs)
                if got == want:
                    results.append({"name": name, "pass": True})
                else:
                    nothing = T[lang]["nothingOut"]
                    results.append(fail(f"{x['msg']}\n{t('outputGot', got or nothing)}" if x.get("msg") else t("output", want, got or nothing)))
                continue
            if "outputIncludes" in x:
                whole = "\n".join(logs)
                if str(x["outputIncludes"]) in whole:
                    results.append({"name": name, "pass": True})
                else:
                    results.append(
                        fail(
                            " ".join(
                                filter(
                                    None, [x.get("msg") or t("outputHas", x["outputIncludes"]), "\n" + t("outputGot", whole or T[lang]["nothingOut"])]
                                )
                            )
                        )
                    )
                continue
            if "state" in x:
                if summary is None and server is None:
                    results.append(fail(t("failed")))
                    continue
                env = {
                    "w": snake_keys(summary) if summary else None,
                    "out": logs,
                    "g": AttrDict(copy.deepcopy(given)),
                    "s": snake_keys(server.summary()) if server else None,
                    "__builtins__": builtins,
                }
                if evaluate(x["state"], env):
                    results.append({"name": name, "pass": True})
                else:
                    note = "" if error or told else where
                    told = True
                    results.append(fail(" ".join(filter(None, [x.get("msg") or t("failed"), note]))))
                continue
            if error:
                results.append(fail(t("crashed")))
                continue
            if "run" in x:
                got = evaluate(x["run"], ns)
                if inspect.iscoroutine(got):
                    got.close()
                    results.append(fail(tr(lang, "asyncNoAwait")))
                    continue
                try:
                    ok = same(plain(got), x["equals"])
                except TypeError:
                    ok = False
                if ok:
                    results.append({"name": name, "pass": True})
                else:
                    want = show(x["equals"])
                    m = t("expected", want, show(got))
                    results.append(fail(f"{x['msg']} {m}" if x.get("msg") else m))
                continue
            eq = eq_sides(x["expect"])
            if eq:
                lhs, rhs = evaluate(eq[0], ns), evaluate(eq[1], ns)
                if lhs == rhs:
                    results.append({"name": name, "pass": True})
                else:
                    results.append(fail(" ".join(filter(None, [x.get("msg"), t("gotWant", eq[0], show(lhs), show(rhs))]))))
                continue
            results.append({"name": name, "pass": True} if evaluate(x["expect"], ns) else fail(x.get("msg") or t("failed")))
        except BaseException as e:
            results.append(fail(explain(e, lang, False)["text"]))
    return {"logs": logs, "error": error, "tests": results, "pass": error is None and all(r["pass"] for r in results), "world": world}


def run_exercise(ex_json, code, lang):
    """Every scenario must pass; the result shows the first failing scenario, or the first one."""
    ex = json.loads(ex_json)
    scenarios = ex.get("scenarios") or [{}]
    runs = [run_once(ex, code, s, lang) for s in scenarios]
    shown = next((i for i, r in enumerate(runs) if not r["pass"]), 0)
    r = runs[shown]
    tests = r["tests"]
    if len(scenarios) > 1:
        tests = [x if x["pass"] else {**x, "scenario": tr(lang, "scenario", shown + 1, len(scenarios))} for x in tests]
    world = None
    if ex.get("world"):
        world = {**ex["world"], **(scenarios[shown].get("world") or {})}
    return json.dumps(
        {
            "pass": all(x["pass"] for x in runs),
            "logs": r["logs"],
            "error": r["error"],
            "tests": tests,
            "worldIndex": r["world"],
            "scenario": shown,
            "scenarios": len(scenarios),
            "map": (scenarios[shown].get("map") or ex["world"].get("map")) if ex.get("world") else None,
            "world": world,
        }
    )


# ── The judge ───────────────────────────────────────────────────────────────────────────────
def normalise(text):
    return re.sub(r"\n+$", "", "\n".join(l.rstrip() for l in str(text).split("\n")))


def _judge_namespace(env, lang):
    ex = {"helpers": (env or {}).get("helpers"), "server": (env or {}).get("server"), "files": (env or {}).get("files")}
    ns, server = program_namespace(ex, {}, lang)
    return ns


def run_case(code, input_text, lang, env):
    out = Capture()
    ns = _judge_namespace(env, lang)
    stdin = io.StringIO(str(input_text) + ("\n" if input_text and not str(input_text).endswith("\n") else ""))
    t0 = time.perf_counter()
    err = execute(code, ns, lang, out, use_async=bool((env or {}).get("async")), stdin=stdin, inputs_allowed=True)
    ms = (time.perf_counter() - t0) * 1000
    return {"out": "\n".join(out.lines()), "error": err["text"] if err else None, "ms": ms}


def call_case(code, fn, args_json, lang, env):
    out = Capture()
    ns = _judge_namespace(env, lang)
    err = execute(code, ns, lang, out, use_async=bool((env or {}).get("async")))
    if err:
        return {"error": err["text"]}
    f = ns.get(fn)
    if not callable(f):
        return {"error": tr(lang, "missing", fn), "missing": True}
    args = json.loads(args_json)
    try:
        with Streams(out):
            t0 = time.perf_counter()
            value = f(*args)
            if inspect.iscoroutine(value):
                value = virtual_run(value)
            ms = (time.perf_counter() - t0) * 1000
    except Stuck as e:
        return {"error": tr(lang, "tooMany" if str(e) == "too many" else "stuck")}
    except BaseException as e:
        return {"error": explain(e, lang)["text"]}
    try:
        data = plain(value)
    except TypeError:
        return {"error": tr(lang, "unserializable", type_name(value, lang)), "got": show(value)}
    return {"value": data, "repr": show(value), "ms": ms}


def judge_case(code, case_json, lang, tol, env_json):
    c = json.loads(case_json)
    env = json.loads(env_json) if env_json else {}
    limit = env.get("limit") or 0
    if c.get("fn"):
        r = call_case(code, c["fn"], c["argsJson"], lang, env)
        if r.get("error"):
            return json.dumps({"verdict": "re", "error": r["error"], "missing": bool(r.get("missing"))})
        if limit and r["ms"] > limit:
            return json.dumps({"verdict": "tle"})
        ok = same(r["value"], json.loads(c["expectedJson"]), tol)
        return json.dumps({"verdict": "ok"} if ok else {"verdict": "wa", "got": r["repr"]})
    r = run_case(code, c["input"], lang, env)
    if r["error"]:
        return json.dumps({"verdict": "re", "got": r["out"], "error": r["error"]})
    if limit and r["ms"] > limit:
        return json.dumps({"verdict": "tle"})
    got = normalise(r["out"])
    return json.dumps({"verdict": "ok"} if got == c["output"] else {"verdict": "wa", "got": got})


class Rng:
    """The judge's seeded generator: the same seed gives the same cases everywhere."""

    def __init__(self, seed):
        self.next = mulberry(seed)

    def int(self, lo, hi):
        return lo + math.floor(self.next() * (hi - lo + 1))

    def pick(self, items):
        return items[self.int(0, len(items) - 1)]

    def list(self, n, lo, hi):
        return [self.int(lo, hi) for _ in range(n)]

    def shuffle(self, items):
        items = list(items)
        for i in range(len(items) - 1, 0, -1):
            j = self.int(0, i)
            items[i], items[j] = items[j], items[i]
        return items


def random_inputs(random):
    if not random:
        return []
    body = "def __gen(rng):\n" + "\n".join("    " + l for l in str(random["generate"]).split("\n"))
    ns = {"__builtins__": builtins}
    exec(compile(body, "<generate>", "exec"), ns)
    rng = Rng(random.get("seed", 1))
    return [ns["__gen"](rng) for _ in range(random.get("count", 30))]


def call_text(fn, args):
    return f"{fn}({', '.join(show(a) for a in args)})"


def build_cases(ex_json, lang):
    """Every case with its expected output: samples, then edge cases, then random ones."""
    ex = json.loads(ex_json)
    env = {"helpers": ex.get("helpers") or [], "server": ex.get("server"), "async": is_async(ex), "limit": 0, "files": ex.get("files")}
    fn_mode = ex.get("mode") == "function"
    raw = []
    for c in ex.get("samples") or []:
        raw.append({**c, "sample": True, "note": c.get("note", "")})
    for c in ex.get("edge") or []:
        raw.append({**c, "tag": c.get("tag", "")})
    tag = (ex.get("random") or {}).get("tag", "")
    for r in random_inputs(ex.get("random")):
        raw.append({"args": r, "tag": tag, "random": True} if fn_mode else {"input": str(r), "tag": tag, "random": True})
    cases = []
    for i, c in enumerate(raw):
        where = f"{ex['id']}: case {i + 1}"
        if fn_mode:
            fn = c.get("fn") or ex["function"]
            if not isinstance(c.get("args"), (list, tuple)):
                raise ValueError(f"{where} needs its arguments as a list")
            args = plain(c["args"])
            r = call_case(ex["solution"], fn, json.dumps(args), lang, env)
            if r.get("error"):
                raise ValueError(f"{where}: the reference fails: {r['error']}")
            if r["value"] is None:
                raise ValueError(f"{where}: the reference returns None")
            if c.get("sample") and "returns" in c and not same(plain(c["returns"]), r["value"], ex.get("tolerance") or 0):
                raise ValueError(f"{where}: the sample says {show(c['returns'])} but the reference returns {r['repr']}")
            cases.append(
                {
                    "fn": fn,
                    "argsJson": json.dumps(args),
                    "expectedJson": json.dumps(r["value"]),
                    "callText": call_text(fn, args),
                    "expectedText": r["repr"],
                    "sample": bool(c.get("sample")),
                    "note": c.get("note", ""),
                    "tag": c.get("tag", ""),
                    "random": bool(c.get("random")),
                    "size": len(json.dumps(args)),
                }
            )
        else:
            text = re.sub(r"\n+$", "", str(c["input"]))
            r = run_case(ex["solution"], text, lang, env)
            if r["error"]:
                raise ValueError(f"{where}: the reference fails: {r['error']}")
            expected = normalise(r["out"])
            if c.get("sample") and c.get("output") is not None and normalise(c["output"]) != expected:
                raise ValueError(f"{where}: the sample says {json.dumps(c['output'])} but the reference prints {json.dumps(expected)}")
            cases.append(
                {
                    "input": text,
                    "output": expected,
                    "sample": bool(c.get("sample")),
                    "note": c.get("note", ""),
                    "tag": c.get("tag", ""),
                    "random": bool(c.get("random")),
                    "size": len(text),
                }
            )
    return json.dumps(cases)


# ── Concept animations: a real trace of the snippet ─────────────────────────────────────────
def _visible(d):
    out = {}
    for k, v in d.items():
        if k.startswith("__") or inspect.ismodule(v) or inspect.isfunction(v) or inspect.isclass(v) or inspect.isbuiltin(v):
            continue
        out[k] = v
    return out


def _data(v):
    try:
        return plain(v)
    except TypeError:
        return None


def _heap(vars_, ids, keep):
    """Names and the objects they point at, with an id per object that stays the same across steps."""
    heap, refs = {}, {}

    def oid(v):
        k = id(v)
        if k not in ids:
            ids[k] = f"o{len(ids) + 1}"
            keep.append(v)
        return ids[k]

    def holder(v):
        return isinstance(v, (list, tuple, dict, set, frozenset)) or (
            type(v).__module__ == "__main__" and hasattr(v, "__dict__") and not inspect.isclass(v) and not callable(v)
        )

    def cell(v, d):
        return {"r": reg(v, d)} if holder(v) and d < 5 else {"p": show(v)}

    def reg(v, d):
        i = oid(v)
        if i in heap:
            return i
        heap[i] = {"k": "val", "p": show(v)}
        if isinstance(v, (list, tuple)):
            heap[i] = {"k": "tuple" if isinstance(v, tuple) else "list", "items": [[None, cell(x, d + 1)] for x in v]}
        elif isinstance(v, (set, frozenset)):
            heap[i] = {"k": "set", "items": [[None, cell(x, d + 1)] for x in v]}
        elif isinstance(v, dict):
            heap[i] = {"k": "dict", "items": [[show(a), cell(b, d + 1)] for a, b in v.items()]}
        elif holder(v):
            heap[i] = {"k": "obj", "cls": type(v).__name__, "items": [[a, cell(b, d + 1)] for a, b in vars(v).items()]}
        return i

    for k, v in vars_.items():
        refs[k] = {"r": reg(v, 0)}
    return {"refs": refs, "heap": heap}


def trace(code, globals_json="{}", with_refs=False, max_steps=300):
    """Steps for an animation: after each line, the line, the variables, the stack and the output."""
    steps, stack = [], []
    ids, keep = {}, []
    out = Capture()
    ns = {"__name__": "__main__", "__builtins__": builtins, **json.loads(globals_json)}
    pending = {}

    def snap(line, frame, extra=None):
        if len(steps) >= max_steps:
            raise Stuck("max")
        scope = frame.f_locals if frame.f_code.co_name != "<module>" else frame.f_globals
        vars_ = _visible(dict(scope))
        step = {
            "line": line,
            "vars": {k: _data(v) for k, v in vars_.items()},
            "reprs": {k: show(v) for k, v in vars_.items()},
            "out": len(out.lines()),
            "stack": [dict(f) for f in stack],
        }
        if with_refs:
            step.update(_heap(vars_, ids, keep))
        if extra:
            step.update(extra)
        steps.append(step)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        key = id(frame)
        # A class body runs as a frame too, but it isn't a call: only functions get CO_NEWLOCALS.
        is_call = bool(frame.f_code.co_flags & inspect.CO_NEWLOCALS)
        if event == "call" and is_call:
            info = inspect.getargvalues(frame)
            args = ", ".join(f"{a} = {show(info.locals.get(a))}" for a in info.args)
            stack.append({"name": frame.f_code.co_name, "args": args})
        elif event == "line":
            if key in pending:
                snap(pending[key], frame)
            pending[key] = frame.f_lineno
        elif event == "return":
            if key in pending:
                snap(pending.pop(key), frame)
            if is_call and stack:
                f = stack.pop()
                if steps:
                    last = steps[-1]
                    steps.append({**last, "stack": [dict(x) for x in stack] + [{**f, "ret": show(arg)}], "out": len(out.lines())})
        return tracer

    error = None
    try:
        obj = compile(code, FILENAME, "exec", dont_inherit=True)
        with Streams(out):
            sys.settrace(tracer)
            try:
                exec(obj, ns)
            finally:
                sys.settrace(None)
    except Stuck:
        pass
    except BaseException as e:
        error = explain(e, "es", False)["text"]
        last = steps[-1] if steps else {"line": 0, "vars": {}, "reprs": {}, "stack": []}
        steps.append({**last, "error": f"{type(e).__name__}: {e}", "out": len(out.lines())})
    return json.dumps({"steps": steps, "logs": out.lines(), "error": error})


# ── Scenes: a short program the robot plays when the picture scrolls into view ──────────────
def scene(spec_json, program, lang):
    spec = json.loads(spec_json)
    world = taller_js.newWorld(json.dumps(spec), lang)
    ns = {"__name__": "__main__", "__builtins__": builtins, "robot": Robot(world, lang)}
    out = Capture()
    err = execute(program, ns, lang, out)
    return json.dumps({"worldIndex": world, "error": err["text"] if err and err["kind"] != "robot" else None})


def run_plain(code, lang):
    """A runnable example or a predict snippet: just what it prints."""
    prepare_files({})
    out = Capture()
    ns = {"__name__": "__main__", "__builtins__": builtins}
    err = execute(code, ns, lang, out)
    return json.dumps({"logs": out.lines(), "error": err})
