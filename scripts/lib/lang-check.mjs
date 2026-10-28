// Flags identifiers in the wrong language: Spanish words in English code and English words in
// Spanish code. Names are split on camelCase; people's names and dishes are fine as part of a
// name (alfajorPrice) but not as the whole name on an English page (alfajores).
const ES = `precio precios vuelto vueltos cantidad cantidades pedido pedidos cliente clientes plato platos mesa mesas suma
lista listas cuenta cuentas nombre nombres edad edades hora horas puerta puertas paso pasos bateria caja cajas lectura
lecturas mensaje mensajes texto textos numero numeros resultado resultados etiqueta etiquetas entrega entregas pago pagos
pagado pagó dinero monto montos billete billetes moneda monedas cambio dia dias semana mes año anio fila filas columna
columnas mapa casilla casillas pared paredes robot robots cristal cristales reporte reportes informe sala salas alarma
movimiento abierta abierto cerrada cerrado salida entrada linea lineas primero primera ultimo ultima siguiente anterior
mayor menor maximo minimo promedio contador conteo vez veces bucle tramo tramos vagoneta vagonetas mina total_ subtotal
propina descuento impuesto igv pan panes pedir enviar recibir respuesta servidor dato datos valor valores clave claves
lado izquierda derecha frente arriba abajo norte sur este oeste tarea tareas visitado visitados cola pila camino ruta
rutas distancia vecino vecinos inicio fin meta tiempo tiempos falta faltan sobra dueño dueña tienda puesto stock
precioUnitario unidad unidades docena kilo kilos gramos litro litros llave llaves objeto objetos carga encargo vecina
reportado reportada reporto calculado calcula calcular esperado correcto correcta incorrecto culpable sospechoso
mensual diario semanal nota notas alumno alumnos curso cursos sesion sesiones juez caso casos libre libres ocupado
ocupada lleno llena vacio vacia hay es esta estan tiene tienen dar dame quedan queda nuevo nueva viejo vieja cocina
cocinero mozo comensal comensales ticket boleta factura recibo recibido entregado entregada ganancia costo costos
venta ventas compra compras saldo deuda pasaje pasajes combi tarifa tarifas parada paradas asiento asientos
largo ancho alto alto bajo grande chico pequeño contar sumar restar mostrar imprimir leer escribir buscar encontrar
agregar quitar ordenar filtrar recorrer revisar verificar validar es_ si sino mientras para cada`;
const EN = `price prices change changes amount amounts order orders customer customers dish dishes table tables sum
list lists bill bills name names age ages hour hours door doors step steps battery box boxes reading readings message
messages text texts number numbers result results label labels deliveries payment payments paid money coin
coins day days week month year row rows column columns map tile tiles wall walls crystal crystals report reports room
rooms alarm motion open opened closed output input line lines first last next previous max min average counter count
times loop stretch cart carts mine subtotal tip discount tax bread request send receive response server data value
values key keys side left right front up down north south east west task tasks visited queue stack path route routes
distance neighbour neighbours neighbor neighbors start end goal time owner shop stall stock unit units dozen
cargo job reported calculated calculate expected correct wrong culprit suspect note notes student students
course courses session sessions judge case cases free busy full empty new old kitchen cook waiter diner diners
receipt received delivered profit cost costs sale sales purchase balance debt fare fares stop stops seat seats
length width height big small add remove sort filter show print read write find check validate each total_`;
const PERU = `alfajor alfajores picaron picarones suspiro ceviche ceviche chicha chicharron lomo saltado anticucho anticuchos
causa tamal tamales empanada empanadas lucuma inca kola pisco chasqui rosa lucho mechita pancho juana carmen pedro
quispe mamani barranco miraflores callao gamarra lima cusco rimac surco yanapay sol soles`;

const set = (s) => new Set(s.split(/\s+/).filter(Boolean).map((w) => w.replace(/_$/, "")));
const SPANISH = set(ES), ENGLISH = set(EN), LOCAL = set(PERU);
for (const w of ["total", "robot", "robots", "mina", "mine", "es", "stock", "kilo", "kilos", "inca", "sol", "soles"]) { SPANISH.delete(w); ENGLISH.delete(w); }
for (const w of ["subtotal", "ticket", "combi", "length"]) { SPANISH.delete(w); ENGLISH.delete(w); }

const words = (id) => id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_$]/g, " ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter(Boolean);

export function declaredNames(code) {
  const src = String(code || "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
  const out = new Set();
  const add = (list) => list.split(",").map((p) => p.trim().replace(/^\.\.\./, "").split(/[=\s:]/)[0]).filter((p) => /^[A-Za-z_$][\w$]*$/.test(p)).forEach((p) => out.add(p));
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s+[[{]([^\]}]*)[\]}]/g)) add(m[1]);
  for (const m of src.matchAll(/\bfunction\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g)) { if (m[1]) out.add(m[1]); add(m[2]); }
  for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) add(m[1].replace(/[[\]{}]/g, ""));
  for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) out.add(m[1]);
  const keys = new Set();
  for (const m of src.matchAll(/[{,]\s*([A-Za-z_$][\w$]*)\s*:(?!:)/g)) if (!out.has(m[1])) keys.add(m[1]);
  return [...[...out].map((name) => ({ name })), ...[...keys].map((name) => ({ name, key: true }))];
}

const PY_KEYWORDS = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self cls".split(" "));

// Python: assignments (a, b = …), annotated names, def/class names and parameters, for targets,
// lambda parameters, `as` names, walrus and self.attributes. Dict keys are strings: data, not names.
export function declaredNamesPy(code) {
  const src = String(code || "")
    .replace(/("""|\'\'\')[\s\S]*?\1/g, '""')
    .replace(/[rbfuRBFU]{0,2}(["'])(?:\\.|(?!\1)[^\\\n])*\1/g, '""')
    .replace(/#[^\n]*/g, "");
  const out = new Set();
  const add = (list) =>
    list.split(",").map((p) => p.trim().replace(/^\*{1,2}/, "").split(/[=:\s]/)[0].replace(/[()[\]]/g, "")).filter((p) => /^[A-Za-z_]\w*$/.test(p) && !PY_KEYWORDS.has(p) && !/^__\w+__$/.test(p)).forEach((p) => out.add(p));
  // A `name=` line inside an open bracket is a keyword argument (`key=lambda …` in a multi-line call), not an assignment.
  const nested = (at) => { let d = 0; for (let i = 0; i < at; i++) d += "([{".includes(src[i]) ? 1 : ")]}".includes(src[i]) ? -1 : 0; return d > 0; };
  for (const m of src.matchAll(/^[ \t]*([A-Za-z_][\w]*(?:[ \t]*,[ \t]*[A-Za-z_][\w]*)*)[ \t]*(?::[^=\n]+)?=(?!=)/gm)) if (!nested(m.index)) add(m[1]);
  for (const m of src.matchAll(/^[ \t]*([A-Za-z_]\w*)[ \t]*:[ \t]*[A-Za-z_][\w.[\]| ,]*$/gm)) add(m[1]);
  for (const m of src.matchAll(/\b(?:def|class)\s+([A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\s*\(([^)]*)\)/g)) { add(m[1]); if (!/^[A-Z]/.test(m[1]) || /def\s/.test(m[0])) add(m[2].replace(/\[[^\]]*\]/g, "")); }
  for (const m of src.matchAll(/\bclass\s+([A-Za-z_]\w*)/g)) add(m[1]);
  for (const m of src.matchAll(/\bfor\s+([\w\s,()]+?)\s+in\b/g)) add(m[1]);
  for (const m of src.matchAll(/\blambda\s+([^:]*):/g)) add(m[1]);
  for (const m of src.matchAll(/\bas\s+([A-Za-z_]\w*)/g)) add(m[1]);
  for (const m of src.matchAll(/([A-Za-z_]\w*)\s*:=/g)) add(m[1]);
  for (const m of src.matchAll(/\bself\.([A-Za-z_]\w*)\s*(?::[^=\n]+)?=(?!=)/g)) add(m[1]);
  return [...out].map((name) => ({ name }));
}

export function wrongLanguage(code, lang, track = "js") {
  const bad = [];
  for (const { name: id, key } of track === "py" ? declaredNamesPy(code) : declaredNames(code)) {
    const ws = words(id);
    if (lang === "en") {
      const es = ws.filter((w) => SPANISH.has(w) || /cion$|ñ/.test(w));
      if (es.length) bad.push(`${id} (${es.join(", ")})`);
      else if (!key && ws.length && ws.every((w) => LOCAL.has(w))) bad.push(`${id} (a Peruvian name or dish alone; add an English word, e.g. ${ws[0]}Price)`);
    } else {
      const en = ws.filter((w) => ENGLISH.has(w) && !SPANISH.has(w));
      if (en.length) bad.push(`${id} (${en.join(", ")})`);
    }
  }
  return bad;
}
