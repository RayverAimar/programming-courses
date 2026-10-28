import { createPlatform } from "../platform/web/core/boot.js";
import { adapter } from "./adapter.js";
import { watchTables } from "./scrollhint.js";

createPlatform(adapter);
watchTables();
