// Tables a case adds to the world, after the shared ones in schema.js. A new case adds its line here.
import { sensores } from "./sensores.js";
import { FRIO } from "./frio.js";
import { TALLER } from "./taller.js";

export const CASE_TABLES = [...sensores, ...FRIO, ...TALLER];
