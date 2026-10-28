// The case files' database: every table with its Spanish and English names, column types, keys and
// what each column means. The generator (world.js), the editor's autocomplete, the ER diagrams and
// the schema panel all read it. See docs/sql.md.

import { T, PK, fk } from "./schema/define.js";
import { CASE_TABLES } from "./schema/index.js";

export const TABLES = [
  T("personas", "people", { es: "Cada persona del padrón municipal.", en: "Everyone in the municipal register." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["nombre", "name", "TEXT", { es: "Nombre completo (a veces mal escrito)", en: "Full name (sometimes badly typed)" }],
    ["dni", "national_id", "TEXT", { es: "DNI, 8 dígitos", en: "National ID (DNI), 8 digits" }],
    ["distrito", "district", "TEXT", { es: "Distrito donde vive", en: "District where they live" }],
    ["telefono", "phone", "TEXT", { es: "Celular, puede faltar", en: "Mobile number, may be missing" }],
    ["nacimiento", "born", "TEXT", { es: "Fecha de nacimiento (AAAA-MM-DD)", en: "Date of birth (YYYY-MM-DD)" }],
    ["ocupacion", "occupation", "TEXT", { es: "Ocupación, puede faltar", en: "Occupation, may be missing" }],
    ["altura_cm", "height_cm", "INTEGER", { es: "Altura en centímetros", en: "Height in centimetres" }],
  ]),
  T("vehiculos", "vehicles", { es: "Vehículos registrados y su dueño.", en: "Registered vehicles and their owner." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["placa", "plate", "TEXT", { es: "Placa, como ABC-123", en: "Plate, like ABC-123" }],
    ["persona_id", "person_id", "INTEGER", { es: "Dueño", en: "Owner" }, fk("personas")],
    ["marca", "make", "TEXT", { es: "Marca", en: "Make" }],
    ["modelo", "model", "TEXT", { es: "Modelo", en: "Model" }],
    ["color", "color", "TEXT", { es: "Color, puede faltar", en: "Colour, may be missing" }],
    ["anio", "year", "INTEGER", { es: "Año de fabricación", en: "Year it was built" }],
  ]),
  T("licencias", "licenses", { es: "Licencias de conducir.", en: "Driving licences." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["persona_id", "person_id", "INTEGER", { es: "Titular", en: "Holder" }, fk("personas")],
    ["categoria", "category", "TEXT", { es: "Categoría (A-I, A-IIa…)", en: "Category (A-I, A-IIa…)" }],
    ["emitida", "issued", "TEXT", { es: "Fecha de emisión", en: "Date issued" }],
    ["vence", "expires", "TEXT", { es: "Fecha de vencimiento", en: "Expiry date" }],
    ["puntos", "points", "INTEGER", { es: "Puntos acumulados por faltas", en: "Penalty points" }],
  ]),
  T("puestos", "stalls", { es: "Puestos del Mercado N.º 1 de Surquillo.", en: "Stalls of Surquillo Market No. 1." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["numero", "number", "INTEGER", { es: "Número del puesto", en: "Stall number" }],
    ["nombre", "name", "TEXT", { es: "Nombre del puesto", en: "Stall name" }],
    ["rubro", "trade", "TEXT", { es: "Qué vende", en: "What it sells" }],
    ["persona_id", "person_id", "INTEGER", { es: "Dueño o dueña", en: "Owner" }, fk("personas")],
    ["pasillo", "aisle", "TEXT", { es: "Pasillo (A–F)", en: "Aisle (A–F)" }],
  ]),
  T("ingresos_mercado", "market_entries", { es: "Cada vez que alguien pasa su tarjeta por una puerta del mercado (hora de Lima).", en: "Every card swipe at a market gate (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["persona_id", "person_id", "INTEGER", { es: "Quién pasó la tarjeta", en: "Who swiped" }, fk("personas")],
    ["puerta", "gate", "INTEGER", { es: "Puerta 1, 2 o 3", en: "Gate 1, 2 or 3" }],
    ["momento", "moment", "TEXT", { es: "Fecha y hora de Lima (AAAA-MM-DD HH:MM:SS)", en: "Lima date and time (YYYY-MM-DD HH:MM:SS)" }],
    ["sentido", "direction", "TEXT", { es: "'entrada' o 'salida'", en: "'in' or 'out'" }],
  ]),
  T("camaras", "cameras", { es: "Cámaras de la municipalidad que leen placas.", en: "Municipal cameras that read plates." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["codigo", "code", "TEXT", { es: "Código, como CAM-SUR-03", en: "Code, like CAM-SUR-03" }],
    ["distrito", "district", "TEXT", { es: "Distrito", en: "District" }],
    ["ubicacion", "location", "TEXT", { es: "Dónde está", en: "Where it is" }],
  ]),
  T("avistamientos", "sightings", { es: "Cada placa que leyó una cámara. La hora está en UTC (Lima es UTC−5).", en: "Every plate a camera read. Times are UTC (Lima is UTC−5)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["camara_id", "camera_id", "INTEGER", { es: "Cámara", en: "Camera" }, fk("camaras")],
    ["placa", "plate", "TEXT", { es: "Placa como la leyó la cámara (a veces sin guion o en minúsculas)", en: "Plate as the camera read it (sometimes without a dash or in lowercase)" }],
    ["momento_utc", "moment_utc", "TEXT", { es: "Fecha y hora UTC", en: "UTC date and time" }],
  ]),
  T("llamadas", "calls", { es: "Registro de llamadas entre celulares (hora de Lima).", en: "Calls between mobiles (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["origen", "caller", "TEXT", { es: "Número que llama", en: "Calling number" }],
    ["destino", "callee", "TEXT", { es: "Número que recibe", en: "Receiving number" }],
    ["inicio", "started", "TEXT", { es: "Fecha y hora", en: "Date and time" }],
    ["duracion_s", "duration_s", "INTEGER", { es: "Duración en segundos", en: "Duration in seconds" }],
  ]),
  T("transferencias", "transfers", { es: "Pagos de celular a celular, al estilo Yape (hora de Lima).", en: "Phone-to-phone payments, Yape style (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["de_telefono", "from_phone", "TEXT", { es: "Quién paga", en: "Who pays" }],
    ["a_telefono", "to_phone", "TEXT", { es: "Quién recibe", en: "Who receives" }],
    ["monto", "amount", "REAL", { es: "Soles", en: "Soles" }],
    ["momento", "moment", "TEXT", { es: "Fecha y hora", en: "Date and time" }],
    ["mensaje", "note", "TEXT", { es: "Mensaje del pago, puede faltar", en: "Payment note, may be missing" }],
  ]),
  T("denuncias", "reports", { es: "Denuncias registradas en las comisarías.", en: "Reports filed at police stations." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["fecha", "report_date", "TEXT", { es: "Fecha (AAAA-MM-DD)", en: "Date (YYYY-MM-DD)" }],
    ["hora", "report_time", "TEXT", { es: "Hora (HH:MM)", en: "Time (HH:MM)" }],
    ["distrito", "district", "TEXT", { es: "Distrito", en: "District" }],
    ["tipo", "kind", "TEXT", { es: "robo, ruido, choque, estafa, pérdida", en: "theft, noise, crash, fraud, lost" }],
    ["lugar", "place", "TEXT", { es: "Dónde pasó", en: "Where it happened" }],
    ["descripcion", "description", "TEXT", { es: "Lo que contó quien denunció", en: "What the person reporting said" }],
    ["denunciante_id", "reporter_id", "INTEGER", { es: "Quién denunció", en: "Who reported it" }, fk("personas")],
  ]),
  T("entrevistas", "interviews", { es: "Declaraciones de testigos y sospechosos, palabra por palabra.", en: "Statements by witnesses and suspects, word for word." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["persona_id", "person_id", "INTEGER", { es: "Quién declaró", en: "Who gave it" }, fk("personas")],
    ["fecha", "interview_date", "TEXT", { es: "Fecha", en: "Date" }],
    ["caso", "case_code", "TEXT", { es: "Código del caso (SUR-0314…)", en: "Case code (SUR-0314…)" }],
    ["transcripcion", "transcript", "TEXT", { es: "Lo que dijo", en: "What they said" }],
  ]),
  T("empresas", "companies", { es: "Empresas con RUC.", en: "Registered companies." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["ruc", "tax_id", "TEXT", { es: "RUC, 11 dígitos", en: "Tax ID (RUC), 11 digits" }],
    ["razon_social", "name", "TEXT", { es: "Razón social", en: "Registered name" }],
    ["rubro", "industry", "TEXT", { es: "A qué se dedica", en: "Industry" }],
    ["distrito", "district", "TEXT", { es: "Distrito", en: "District" }],
  ]),
  T("empleos", "jobs", { es: "Quién trabaja (o trabajó) dónde.", en: "Who works (or worked) where." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["persona_id", "person_id", "INTEGER", { es: "Trabajador", en: "Worker" }, fk("personas")],
    ["empresa_id", "company_id", "INTEGER", { es: "Empresa", en: "Company" }, fk("empresas")],
    ["cargo", "role", "TEXT", { es: "Cargo", en: "Role" }],
    ["desde", "since", "TEXT", { es: "Desde (fecha)", en: "Since (date)" }],
    ["hasta", "until", "TEXT", { es: "Hasta; NULL si sigue ahí", en: "Until; NULL if still there" }],
    ["sueldo", "salary", "INTEGER", { es: "Sueldo mensual en soles", en: "Monthly salary in soles" }],
  ]),
  T("eventos", "events", { es: "Eventos públicos: ferias, conciertos, partidos.", en: "Public events: fairs, concerts, matches." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["nombre", "name", "TEXT", { es: "Nombre del evento", en: "Event name" }],
    ["lugar", "venue", "TEXT", { es: "Lugar", en: "Venue" }],
    ["distrito", "district", "TEXT", { es: "Distrito", en: "District" }],
    ["inicio", "starts", "TEXT", { es: "Empieza (fecha y hora)", en: "Starts (date and time)" }],
    ["fin", "ends", "TEXT", { es: "Termina (fecha y hora)", en: "Ends (date and time)" }],
  ]),
  T("asistencias", "attendance", { es: "Entradas escaneadas en cada evento.", en: "Tickets scanned at each event." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["evento_id", "event_id", "INTEGER", { es: "Evento", en: "Event" }, fk("eventos")],
    ["persona_id", "person_id", "INTEGER", { es: "Quién entró", en: "Who went in" }, fk("personas")],
    ["momento", "moment", "TEXT", { es: "Cuándo escanearon la entrada", en: "When the ticket was scanned" }],
  ]),
  T("robots", "robots", { es: "Los robots de Lima, colegas de Chasqui.", en: "Lima's robots, Chasqui's colleagues." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["nombre", "name", "TEXT", { es: "Nombre", en: "Name" }],
    ["modelo", "model", "TEXT", { es: "Modelo", en: "Model" }],
    ["dueno_id", "owner_id", "INTEGER", { es: "Quién lo usa", en: "Who runs it" }, fk("personas")],
    ["trabajo", "job", "TEXT", { es: "A qué se dedica", en: "What it does" }],
    ["fabricado", "built", "TEXT", { es: "Fecha de fabricación", en: "Date built" }],
  ]),
  T("lecturas", "readings", { es: "Lecturas de los sensores de cada robot (hora de Lima).", en: "Each robot's sensor readings (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["robot_id", "robot_id", "INTEGER", { es: "Robot", en: "Robot" }, fk("robots")],
    ["sensor", "sensor", "TEXT", { es: "bateria, temperatura, giroscopio…", en: "battery, temperature, gyroscope…" }],
    ["momento", "moment", "TEXT", { es: "Fecha y hora", en: "Date and time" }],
    ["valor", "value", "REAL", { es: "Valor medido", en: "Measured value" }],
    ["datos", "data", "TEXT", { es: "Detalle en JSON", en: "Details as JSON" }],
  ]),
  ...CASE_TABLES,
];

const byEs = new Map(TABLES.map((t) => [t.es, t]));
const byEn = new Map(TABLES.map((t) => [t.en, t]));

export const tableOf = (name) => byEs.get(name) || byEn.get(name) || null;
export const tableName = (t, lang) => (lang === "en" ? t.en : t.es);
export const colName = (c, lang) => (lang === "en" ? c.en : c.es);

// The schema as the page shows it: names, types, keys and descriptions in one language.
export function schemaFor(lang, only = null) {
  const keep = only ? new Set(only.map((n) => tableOf(n)).filter(Boolean)) : null;
  return TABLES.filter((t) => !keep || keep.has(t)).map((t) => ({
    name: tableName(t, lang),
    desc: t.desc[lang] || t.desc.es,
    cols: t.cols.map((c) => ({ name: colName(c, lang), type: c.type, desc: c.desc[lang] || c.desc.es, pk: !!c.pk, fk: c.fk ? tableName(tableOf(c.fk), lang) : null })),
  }));
}

export function createSql(lang) {
  return TABLES.map((t) => `CREATE TABLE ${tableName(t, lang)} (\n  ${t.cols.map((c) => `${colName(c, lang)} ${c.type}${c.pk ? " PRIMARY KEY" : ""}${c.fk ? ` REFERENCES ${tableName(tableOf(c.fk), lang)}(id)` : ""}`).join(",\n  ")}\n);`).join("\n");
}

// The world tables a query names, in the order they appear.
export function tablesIn(sql, lang) {
  const names = new Set(TABLES.map((t) => tableName(t, lang)));
  const found = [];
  for (const m of String(sql).matchAll(/\b([A-Za-z_]\w*)\b/g)) if (names.has(m[1]) && !found.includes(m[1])) found.push(m[1]);
  return found;
}
