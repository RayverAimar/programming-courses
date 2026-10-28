// Case 5, "La base de Loop" (sessions 15–18): the market's stall registry that the municipality
// hands over to Loop, the filings at its two counters, the old app's session log, its users
// and the spreadsheet the office kept before the app.
import { T, PK, fk } from "./define.js";

export const TALLER = [
  T("padron_puestos", "stall_registry", { es: "El padrón oficial de la municipalidad: la licencia de cada puesto del Mercado N.º 1.", en: "The municipality's official registry: the licence of each stall in Market No. 1." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["puesto", "stall", "INTEGER", { es: "Número del puesto", en: "Stall number" }],
    ["titular_id", "holder_id", "INTEGER", { es: "A nombre de quién está la licencia", en: "Whose name the licence is in" }, fk("personas")],
    ["licencia", "license", "TEXT", { es: "Código de la licencia, como LF-2021-0047", en: "Licence code, like LF-2021-0047" }],
    ["vence", "expires", "TEXT", { es: "Fecha en que vence (AAAA-MM-DD)", en: "Expiry date (YYYY-MM-DD)" }],
    ["estado", "status", "TEXT", { es: "'vigente' o 'suspendida'", en: "'active' or 'suspended'" }],
    ["actualizado", "updated_at", "TEXT", { es: "Último cambio (fecha y hora de Lima)", en: "Last change (Lima date and time)" }],
    ["actualizado_por", "updated_by", "TEXT", { es: "Usuario que hizo el último cambio", en: "User who made the last change" }],
  ]),
  T("tramites", "filings", { es: "Trámites presentados en las ventanillas de la Oficina de Mercados.", en: "Filings made at the Markets Office counters." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["puesto", "stall", "INTEGER", { es: "Número del puesto", en: "Stall number" }],
    ["tipo", "kind", "TEXT", { es: "renovación, traspaso, cambio de rubro o baja", en: "renewal, transfer, change of trade or closure" }],
    ["solicitante_id", "applicant_id", "INTEGER", { es: "Quién lo pidió", en: "Who asked for it" }, fk("personas")],
    ["nuevo_titular_id", "new_holder_id", "INTEGER", { es: "En un traspaso, a quién pasa el puesto; si no, NULL", en: "For a transfer, who gets the stall; otherwise NULL" }, fk("personas")],
    ["ventanilla", "counter", "INTEGER", { es: "Ventanilla 1 o 2", en: "Counter 1 or 2" }],
    ["funcionario", "clerk", "TEXT", { es: "Usuario que lo atendió", en: "User who handled it" }],
    ["presentado", "filed_at", "TEXT", { es: "Fecha y hora de Lima", en: "Lima date and time" }],
    ["estado", "status", "TEXT", { es: "aprobado, pendiente o rechazado", en: "approved, pending or rejected" }],
    ["pago", "fee", "REAL", { es: "Lo que se pagó, en soles", en: "What was paid, in soles" }],
  ]),
  T("bitacora", "session_log", { es: "Cada sentencia que la app del padrón envió a la base, con su sesión (hora de Lima).", en: "Every statement the registry app sent to the database, with its session (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["sesion", "session", "INTEGER", { es: "Número de la conexión", en: "Connection number" }],
    ["usuario", "username", "TEXT", { es: "Usuario conectado", en: "Logged-in user" }],
    ["terminal", "terminal", "TEXT", { es: "Computadora desde donde se conectó", en: "Computer it connected from" }],
    ["momento", "moment", "TEXT", { es: "Fecha y hora, con segundos", en: "Date and time, with seconds" }],
    ["puesto", "stall", "INTEGER", { es: "Puesto que toca la sentencia; NULL en BEGIN y COMMIT", en: "Stall the statement touches; NULL for BEGIN and COMMIT" }],
    ["sentencia", "statement", "TEXT", { es: "El SQL que se ejecutó", en: "The SQL that ran" }],
  ]),
  T("usuarios", "users", { es: "Las cuentas de la app del padrón.", en: "The registry app's accounts." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["login", "login", "TEXT", { es: "Nombre de usuario", en: "Username" }],
    ["persona_id", "person_id", "INTEGER", { es: "Dueño de la cuenta; NULL si es genérica", en: "Account owner; NULL if shared" }, fk("personas")],
    ["rol", "role", "TEXT", { es: "registro, sistemas o gerencia", en: "registry, IT or management" }],
    ["terminal", "terminal", "TEXT", { es: "Su computadora asignada", en: "Their assigned computer" }],
  ]),
  T("planilla_puestos", "stall_sheet", { es: "La hoja de Excel que la oficina llenaba a mano antes de la app, importada tal cual.", en: "The spreadsheet the office filled by hand before the app, imported as it was." }, [
    ["fila", "row_num", "INTEGER", { es: "Fila de la hoja", en: "Sheet row" }, PK],
    ["puesto", "stall", "INTEGER", { es: "Número del puesto", en: "Stall number" }],
    ["pasillo", "aisle", "TEXT", { es: "Pasillo", en: "Aisle" }],
    ["rubros", "trades", "TEXT", { es: "Lo que vende, separado por comas", en: "What it sells, comma-separated" }],
    ["titular", "holder", "TEXT", { es: "Nombre del titular, escrito a mano", en: "Holder's name, typed by hand" }],
    ["dni", "national_id", "TEXT", { es: "DNI del titular", en: "Holder's national ID" }],
    ["telefono", "phone", "TEXT", { es: "Celular de contacto", en: "Contact mobile" }],
    ["distrito", "district", "TEXT", { es: "Distrito del titular", en: "Holder's district" }],
    ["licencia", "license", "TEXT", { es: "Código de la licencia", en: "Licence code" }],
    ["editado", "edited", "TEXT", { es: "Fecha en que se editó la fila", en: "Date the row was edited" }],
  ]),
];
