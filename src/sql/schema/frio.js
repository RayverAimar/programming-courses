// Case 4, "El caso frío de 1998": the textile mill's org chart, the 1998 phone book, every call of
// December 1998 and the statements taken then. Rows are planted by plots/frio.js.
import { T, PK, fk } from "./define.js";

export const FRIO = [
  T("empleados_1998", "employees_1998", { es: "Planilla de Textil San Jacinto en diciembre de 1998, con el jefe de cada uno.", en: "Textil San Jacinto's staff in December 1998, with each one's boss." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["nombre", "name", "TEXT", { es: "Nombre completo", en: "Full name" }],
    ["dni", "national_id", "TEXT", { es: "DNI, 8 dígitos", en: "National ID (DNI), 8 digits" }],
    ["cargo", "role", "TEXT", { es: "Cargo", en: "Job title" }],
    ["area", "department", "TEXT", { es: "Área, escrita a mano en la ficha (puede faltar)", en: "Department, handwritten on the record (may be missing)" }],
    ["jefe_id", "boss_id", "INTEGER", { es: "Su jefe directo; NULL para el gerente general", en: "Their direct boss; NULL for the general manager" }, fk("empleados_1998")],
    ["telefono", "phone", "TEXT", { es: "Teléfono de su casa (7 dígitos), puede faltar", en: "Home phone (7 digits), may be missing" }],
    ["distrito", "district", "TEXT", { es: "Distrito donde vivía", en: "District where they lived" }],
  ]),
  T("telefonos_1998", "phones_1998", { es: "La guía telefónica de Lima de 1998: cada número y su titular.", en: "Lima's 1998 phone book: every number and who held it." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["numero", "number", "TEXT", { es: "Número de 7 dígitos", en: "7-digit number" }],
    ["titular", "holder", "TEXT", { es: "A nombre de quién o de qué negocio", en: "Person or business it's registered to" }],
    ["tipo", "kind", "TEXT", { es: "'casa', 'negocio' o 'público'", en: "'home', 'business' or 'public'" }],
    ["direccion", "address", "TEXT", { es: "Dirección", en: "Address" }],
    ["distrito", "district", "TEXT", { es: "Distrito", en: "District" }],
  ]),
  T("llamadas_1998", "calls_1998", { es: "Cada llamada de diciembre de 1998 de la central de La Victoria (hora de Lima).", en: "Every call of December 1998 through the La Victoria exchange (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["origen", "caller", "TEXT", { es: "Número que llama", en: "Calling number" }],
    ["destino", "callee", "TEXT", { es: "Número que recibe", en: "Receiving number" }],
    ["inicio", "started", "TEXT", { es: "Fecha y hora (AAAA-MM-DD HH:MM:SS)", en: "Date and time (YYYY-MM-DD HH:MM:SS)" }],
    ["duracion_s", "duration_s", "INTEGER", { es: "Duración en segundos; 0 si nadie contestó", en: "Duration in seconds; 0 if nobody answered" }],
  ]),
  T("declaraciones_1998", "statements_1998", { es: "Lo que declaró cada empleado a la policía en diciembre de 1998.", en: "What each employee told the police in December 1998." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["empleado_id", "employee_id", "INTEGER", { es: "Quién declaró", en: "Who gave it" }, fk("empleados_1998")],
    ["fecha", "statement_date", "TEXT", { es: "Fecha", en: "Date" }],
    ["texto", "text", "TEXT", { es: "Lo que dijo, palabra por palabra", en: "What they said, word for word" }],
  ]),
];
