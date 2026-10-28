// Case 3, "El sabotaje de la sala de sensores" (sessions 9–11): the sensor room's card reader and the
// Loop's firmware releases.
import { T, PK, fk } from "./define.js";

export const sensores = [
  T("accesos", "access_log", { es: "Cada vez que una tarjeta abre la puerta de la sala de sensores de Loop (hora de Lima).", en: "Every time a card opens the door of Loop's sensor room (Lima time)." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["tarjeta", "card", "TEXT", { es: "Código de la tarjeta, como T-0101", en: "Card code, like T-0101" }],
    ["persona_id", "person_id", "INTEGER", { es: "A nombre de quién está la tarjeta", en: "Whose name the card is in" }, fk("personas")],
    ["momento", "moment", "TEXT", { es: "Fecha y hora", en: "Date and time" }],
    ["sentido", "direction", "TEXT", { es: "'entrada' o 'salida'", en: "'in' or 'out'" }],
  ]),
  T("firmwares", "firmware_releases", { es: "Versiones del firmware de los robots de Loop que se publicaron.", en: "Released versions of Loop robots' firmware." }, [
    ["id", "id", "INTEGER", { es: "Identificador", en: "Identifier" }, PK],
    ["version", "version", "TEXT", { es: "Versión, como 2.5.9", en: "Version, like 2.5.9" }],
    ["publicado", "released", "TEXT", { es: "Fecha de publicación", en: "Release date" }],
    ["autor_id", "author_id", "INTEGER", { es: "Quién la programó", en: "Who wrote it" }, fk("personas")],
    ["notas", "notes", "TEXT", { es: "Notas en JSON: usuario y cambios", en: "Notes as JSON: user and changes" }],
  ]),
];
