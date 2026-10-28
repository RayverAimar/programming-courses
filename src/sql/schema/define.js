// Helpers to describe a table of the case files: Spanish and English names, types, keys and what
// each column means. Used by schema.js and by each case's own tables (schema/<case>.js).
export const T = (es, en, desc, cols) => ({ es, en, desc, cols: cols.map(([ces, cen, type, d, extra = {}]) => ({ es: ces, en: cen, type, desc: d, ...extra })) });
export const PK = { pk: true };
export const fk = (table) => ({ fk: table });
