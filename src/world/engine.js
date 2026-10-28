// The Taller's world: a grid, a robot and what it can do. Pure logic, no DOM, so the same code
// runs in the sandbox worker (to execute the learner's program) and in the page (to draw it).

export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const LEFT = { N: "W", W: "S", S: "E", E: "N" };
const RIGHT = { N: "E", E: "S", S: "W", W: "N" };
export const MAX_ACTIONS = 3000;

const MSG = {
  es: {
    wall: (x, y, n) => `En la acción ${n}, el robot chocó con una pared al intentar entrar en (${x}, ${y}).`,
    battery: (n, x, y) => `Sin batería en la acción ${n}: el robot se quedó parado en (${x}, ${y}).`,
    tooMany: `El robot hizo más de ${MAX_ACTIONS} acciones. ¿Hay un bucle que nunca termina?`,
    steps: (n) => `avanzar(${n}): el número de pasos tiene que ser un entero positivo.`,
    notD: (x, y) => `El robot intentó entregar en (${x}, ${y}), que no es la casa del cliente. entregar() solo funciona parado sobre el buzón.`,
    label: "entregar() necesita la etiqueta del paquete, un texto.",
    noDoor: "Aquí no hay ninguna puerta debajo del robot. Colócate justo encima de una.",
    noK: "preparar() solo funciona parado en la cocina (la casilla K).",
    dish: "preparar() necesita el nombre del plato, un texto.",
    full: "La bandeja ya lleva un plato. Sirve ese antes de preparar otro.",
    noTable: "No hay ninguna mesa justo debajo del robot.",
    empty: "La bandeja está vacía: primero preparar(plato) en la cocina.",
    side: (s) => `hayPared() acepta "frente", "izquierda" o "derecha", no "${s}".`,
    report: "reportar() necesita un número.",
    noApi: (n) => `El robot de este ejercicio no tiene ${n}.`,
    full2: (n) => `La carga está llena (${n} objetos). Suelta algo antes de tomar otro.`,
    notCarrying: (n) => `La carga no tiene ${n === undefined ? "ningún objeto" : JSON.stringify(n)}.`,
    taken: "Ahí ya hay un objeto: suéltalo en una casilla libre.",
    noFrontDoor: "No hay ninguna puerta justo enfrente del robot.",
    locked: "La puerta tiene candado: necesitas la llave en la carga.",
    path: "seguirRuta() necesita una lista de casillas vecinas ([x, y] o { x, y }) o de direcciones (\"N\", \"E\", \"S\", \"O\").",
    jump: (i, x, y) => `El paso ${i} de la ruta va a (${x}, ${y}), que no es vecina de donde está el robot.`,
    cell: "marcar() necesita una casilla ([x, y] o { x, y }) o una lista de casillas.",
  },
  en: {
    wall: (x, y, n) => `On action ${n}, the robot hit a wall trying to enter (${x}, ${y}).`,
    battery: (n, x, y) => `Out of battery on action ${n}: the robot stopped at (${x}, ${y}).`,
    tooMany: `The robot took more than ${MAX_ACTIONS} actions. Is there a loop that never ends?`,
    steps: (n) => `forward(${n}): the number of steps must be a positive whole number.`,
    notD: (x, y) => `The robot tried to deliver at (${x}, ${y}), which isn't the customer's house. deliver() only works standing on the mailbox.`,
    label: "deliver() needs the package label, a string.",
    noDoor: "There is no door right below the robot. Stand just above one.",
    noK: "cook() only works standing in the kitchen (the K tile).",
    dish: "cook() needs the name of the dish, a string.",
    full: "The tray already holds a dish. Serve it before cooking another.",
    noTable: "There is no table right below the robot.",
    empty: "The tray is empty: cook(dish) in the kitchen first.",
    side: (s) => `wallAhead() takes "front", "left" or "right", not "${s}".`,
    report: "report() needs a number.",
    noApi: (n) => `This exercise's robot has no ${n}.`,
    full2: (n) => `The cargo is full (${n} items). Drop something before taking another.`,
    notCarrying: (n) => `The cargo has no ${n === undefined ? "items" : JSON.stringify(n)}.`,
    taken: "There is already an item here: drop it on a free tile.",
    noFrontDoor: "There is no door right in front of the robot.",
    locked: "The door is padlocked: you need the key in the cargo.",
    path: "followPath() needs a list of neighbouring tiles ([x, y] or { x, y }) or of directions (\"N\", \"E\", \"S\", \"W\").",
    jump: (i, x, y) => `Step ${i} of the path goes to (${x}, ${y}), which isn't next to the robot.`,
    cell: "mark() needs a tile ([x, y] or { x, y }) or a list of tiles.",
  },
};

import { robotIds, robotDoc, ROBOT } from "../api/expose.js";

export class RobotError extends Error {
  constructor(message) {
    super(message);
    this.name = "RobotError";
  }
}

const key = (x, y) => `${x},${y}`;

// Map characters. Digits mean crystals in a mine and table numbers in a kitchen.
const ITEM = /^[a-z]$/;
export function parseMap(config) {
  const rows = String(config.map).replace(/^\n+|\s+$/g, "").split("\n").map((r) => r.replace(/\s+$/, ""));
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const theme = config.theme || "barranco";
  const tiles = [];
  const state = { crystals: {}, doors: {}, motion: [], tables: {}, items: {}, start: null, goal: null, kitchen: null };
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const c = rows[y][x] || "#";
      let t = ".";
      if (c === "#" || c === " ") t = "#";
      else if (c === "R") state.start = [x, y];
      else if (c === "D") { t = "D"; state.goal = [x, y]; }
      else if (c === "K") { t = "K"; state.kitchen = [x, y]; state.start = state.start || [x, y]; }
      else if (c === "P") { t = "P"; state.doors[key(x, y)] = "closed"; }
      else if (c === "O") { t = "P"; state.doors[key(x, y)] = "open"; }
      else if (c === "L") { t = "P"; state.doors[key(x, y)] = "locked"; }
      else if (c === "m") state.motion.push(key(x, y));
      else if (ITEM.test(c)) state.items[key(x, y)] = c;
      else if (/[1-9]/.test(c) && theme === "cocina") { t = "T"; state.tables[key(x, y)] = Number(c); }
      else if (/[1-9]/.test(c)) state.crystals[key(x, y)] = Number(c);
      row.push(t);
    }
    tiles.push(row);
  }
  if (!state.start) throw new Error("World map needs an R (or K) for the robot");
  return { w, h, theme, tiles, ...state };
}

export class World {
  constructor(config, lang = "es") {
    this.m = MSG[lang] || MSG.es;
    this.lang = lang;
    const p = parseMap(config);
    this.map = p;
    this.robot = {
      x: p.start[0],
      y: p.start[1],
      dir: config.dir === "O" ? "W" : config.dir || "E", // "O" (oeste) is how Spanish pages say W
      battery: config.battery === undefined ? null : Number(config.battery),
      carry: null,
      level: config.level || 1,
    };
    this.crystals = { ...p.crystals };
    this.doors = { ...p.doors };
    this.motion = [...p.motion];
    this.alarms = [];
    this.served = [];
    this.delivered = [];
    this.reports = [];
    this.said = [];
    this.collected = 0;
    this.items = { ...p.items };
    this.itemNames = config.items || {};
    this.inventory = [];
    this.dropped = [];
    this.marks = [];
    this.capacity = config.capacity ?? null;
    this.vision = config.vision ?? 1;
    this.ids = robotIds(config);
    this.say = "";
    this.event = "";
    this.crashed = false;
    this.actions = 0;
    this.frames = [this.snapshot()];
  }

  snapshot() {
    return {
      robot: { ...this.robot },
      crystals: { ...this.crystals },
      doors: { ...this.doors },
      alarms: [...this.alarms],
      served: this.served.map((s) => ({ ...s })),
      delivered: this.delivered.length,
      collected: this.collected,
      items: { ...this.items },
      inventory: this.inventory.map((i) => i.char),
      marks: [...this.marks],
      say: this.say,
      event: this.event,
      crashed: this.crashed,
    };
  }

  tick(event, say) {
    if (++this.actions > MAX_ACTIONS) throw new RobotError(this.m.tooMany);
    this.event = event;
    if (say !== undefined) this.say = say;
    if (this.frames.length < MAX_ACTIONS + 2) this.frames.push(this.snapshot());
  }

  wallAt(x, y) {
    const row = this.map.tiles[y];
    return !row || row[x] === undefined || row[x] === "#" || row[x] === "T" || (row[x] === "P" && this.doors[key(x, y)] !== "open");
  }

  front(dir = this.robot.dir) {
    const [dx, dy] = DIRS[dir];
    return [this.robot.x + dx, this.robot.y + dy];
  }

  forward(n = 1) {
    if (!Number.isInteger(n) || n < 1) throw new RobotError(this.m.steps(n));
    for (let i = 0; i < n; i++) {
      const [nx, ny] = this.front();
      if (this.wallAt(nx, ny)) {
        this.crashed = true;
        this.tick("crash", "¡Pum!");
        throw new RobotError(this.m.wall(nx, ny, this.actions));
      }
      if (this.robot.battery !== null) {
        if (this.robot.battery <= 0) {
          this.tick("flat");
          throw new RobotError(this.m.battery(this.actions, this.robot.x, this.robot.y));
        }
        this.robot.battery -= 1;
      }
      this.robot.x = nx;
      this.robot.y = ny;
      this.tick("move", "");
    }
  }

  turn(side) {
    this.robot.dir = side === "L" ? LEFT[this.robot.dir] : RIGHT[this.robot.dir];
    this.tick("turn", "");
  }

  wallAhead(side) {
    const names = this.lang === "en" ? { front: 0, left: "L", right: "R" } : { frente: 0, izquierda: "L", derecha: "R" };
    const s = side === undefined ? 0 : names[side];
    if (s === undefined) throw new RobotError(this.m.side(side));
    const dir = s === "L" ? LEFT[this.robot.dir] : s === "R" ? RIGHT[this.robot.dir] : this.robot.dir;
    const [x, y] = this.front(dir);
    return this.wallAt(x, y);
  }

  deliver(label) {
    const { x, y } = this.robot;
    if (this.map.tiles[y][x] !== "D") throw new RobotError(this.m.notD(x, y));
    if (typeof label !== "string") throw new RobotError(this.m.label);
    this.delivered.push({ label, x, y });
    this.tick("deliver", label);
  }

  below() {
    return [this.robot.x, this.robot.y + 1];
  }

  doorBelow() {
    const [x, y] = this.below();
    if (this.doors[key(x, y)] === undefined) throw new RobotError(this.m.noDoor);
    return [x, y];
  }

  sensor() {
    const [x, y] = this.doorBelow();
    const open = this.doors[key(x, y)] === "open";
    const motion = this.motion.includes(key(x, y + 1));
    this.tick("scan", "");
    return this.lang === "en" ? { door: open ? "open" : "closed", motion } : { puerta: open ? "abierta" : "cerrada", movimiento: motion };
  }

  closeDoor() {
    const [x, y] = this.doorBelow();
    this.doors[key(x, y)] = "closed";
    this.tick("close", "");
  }

  alarm() {
    const [x, y] = this.doorBelow();
    if (!this.alarms.includes(key(x, y))) this.alarms.push(key(x, y));
    this.tick("alarm", "¡Alarma!");
  }

  collect() {
    const k = key(this.robot.x, this.robot.y);
    const n = this.crystals[k] || 0;
    delete this.crystals[k];
    this.collected += n;
    this.tick("collect", n ? `+${n}` : "");
    return n;
  }

  report(n) {
    if (typeof n !== "number") throw new RobotError(this.m.report);
    this.reports.push(n);
    this.tick("report", String(n));
  }

  cook(dish) {
    const { x, y } = this.robot;
    if (this.map.tiles[y][x] !== "K") throw new RobotError(this.m.noK);
    if (typeof dish !== "string") throw new RobotError(this.m.dish);
    if (this.robot.carry) throw new RobotError(this.m.full);
    this.robot.carry = dish;
    this.tick("cook", dish);
  }

  serve() {
    const [x, y] = this.below();
    const table = this.map.tables[key(x, y)];
    if (!table) throw new RobotError(this.m.noTable);
    if (!this.robot.carry) throw new RobotError(this.m.empty);
    this.served.push({ table, dish: this.robot.carry });
    this.robot.carry = null;
    this.tick("serve", "");
  }

  cellAt(x, y) {
    const row = this.map.tiles[y];
    if (!row || row[x] === undefined) return "?";
    const k = key(x, y);
    const t = row[x];
    if (t === "#") return "#";
    if (t === "P") return { open: "O", closed: "P", locked: "L" }[this.doors[k]];
    if (t === "T") return String(this.map.tables[k]);
    if (this.items[k]) return this.items[k];
    if (this.crystals[k]) return String(this.crystals[k]);
    return t;
  }

  scan() {
    const r = this.vision;
    const grid = [];
    for (let dy = -r; dy <= r; dy++) {
      const row = [];
      for (let dx = -r; dx <= r; dx++) row.push(this.cellAt(this.robot.x + dx, this.robot.y + dy));
      grid.push(row);
    }
    this.tick("scan", "");
    return grid;
  }

  fullMap() {
    return this.map.tiles.map((row, y) => row.map((_t, x) => this.cellAt(x, y)));
  }

  itemName(c) {
    return this.itemNames[c] ?? c;
  }

  take() {
    const k = key(this.robot.x, this.robot.y);
    const c = this.items[k];
    if (!c) { this.tick("take", ""); return null; }
    if (this.capacity !== null && this.inventory.length >= this.capacity) throw new RobotError(this.m.full2(this.capacity));
    delete this.items[k];
    this.inventory.push({ char: c, name: this.itemName(c) });
    this.tick("take", `+${this.itemName(c)}`);
    return this.itemName(c);
  }

  drop(name) {
    const i = name === undefined ? this.inventory.length - 1 : this.inventory.findIndex((it) => it.name === name);
    if (i < 0) throw new RobotError(this.m.notCarrying(name));
    const k = key(this.robot.x, this.robot.y);
    if (this.items[k]) throw new RobotError(this.m.taken);
    const [it] = this.inventory.splice(i, 1);
    this.items[k] = it.char;
    this.dropped.push({ item: it.name, x: this.robot.x, y: this.robot.y });
    this.tick("drop", `−${it.name}`);
  }

  openDoor() {
    const [x, y] = this.front();
    const k = key(x, y);
    if (this.doors[k] === undefined) throw new RobotError(this.m.noFrontDoor);
    if (this.doors[k] === "locked" && !this.inventory.some((it) => it.char === "k")) throw new RobotError(this.m.locked);
    this.doors[k] = "open";
    this.tick("open", "");
  }

  cell(c, err) {
    if (Array.isArray(c) && c.length === 2 && c.every(Number.isInteger)) return c;
    if (c && typeof c === "object" && Number.isInteger(c.x) && Number.isInteger(c.y)) return [c.x, c.y];
    throw new RobotError(err);
  }

  followPath(path) {
    if (!Array.isArray(path)) throw new RobotError(this.m.path);
    const names = { N: "N", E: "E", S: "S", W: "W", O: "W" };
    path.forEach((step, i) => {
      let dir;
      if (typeof step === "string") {
        dir = names[step];
        if (!dir) throw new RobotError(this.m.path);
      } else {
        const [x, y] = this.cell(step, this.m.path);
        const dx = x - this.robot.x, dy = y - this.robot.y;
        if (dx === 0 && dy === 0) return;
        dir = Object.keys(DIRS).find((d) => DIRS[d][0] === dx && DIRS[d][1] === dy);
        if (!dir) throw new RobotError(this.m.jump(i + 1, x, y));
      }
      while (this.robot.dir !== dir) this.turn(RIGHT[this.robot.dir] === dir ? "R" : LEFT[this.robot.dir] === dir ? "L" : "R");
      this.forward(1);
    });
  }

  mark(cells) {
    const list = Array.isArray(cells) && cells.length && typeof cells[0] === "object" ? cells : [cells];
    for (const c of list) {
      const [x, y] = this.cell(c, this.m.cell);
      if (!this.marks.includes(key(x, y))) this.marks.push(key(x, y));
    }
    this.tick("mark", "");
  }

  speak(text) {
    this.said.push(String(text));
    this.tick("say", String(text));
  }

  // The object the learner's code sees: the members this exercise exposes, named in the page's language.
  api() {
    const w = this;
    const impl = {
      forward: (n) => w.forward(n),
      turnLeft: () => w.turn("L"),
      turnRight: () => w.turn("R"),
      wallAhead: (side) => w.wallAhead(side),
      say: (text) => w.speak(text),
      deliver: (label) => w.deliver(label),
      sensor: () => w.sensor(),
      closeDoor: () => w.closeDoor(),
      alarm: () => w.alarm(),
      collect: () => w.collect(),
      report: (n) => w.report(n),
      cook: (dish) => w.cook(dish),
      serve: () => w.serve(),
      scan: () => w.scan(),
      map: () => w.fullMap(),
      take: () => w.take(),
      drop: (name) => w.drop(name),
      openDoor: () => w.openDoor(),
      followPath: (path) => w.followPath(path),
      mark: (cells) => w.mark(cells),
    };
    const props = {
      battery: () => w.robot.battery,
      position: () => ({ x: w.robot.x, y: w.robot.y }),
      direction: () => (w.lang === "en" ? w.robot.dir : { N: "N", E: "E", S: "S", W: "O" }[w.robot.dir]),
      inventory: () => w.inventory.map((it) => it.name),
    };
    const api = {};
    for (const id of this.ids) {
      const { name } = robotDoc(id, this.lang);
      if (props[id]) Object.defineProperty(api, name, { get: props[id], enumerable: true });
      else api[name] = impl[id];
    }
    const known = new Set(Object.keys(ROBOT.members).flatMap((id) => [ROBOT.members[id].es.name, ROBOT.members[id].en.name]));
    return new Proxy(Object.freeze(api), {
      get: (o, k) => {
        if (typeof k === "string" && !(k in o) && known.has(k)) throw new RobotError(w.m.noApi(`robot.${k}`));
        return o[k];
      },
    });
  }

  // What tests may inspect once the program has finished.
  summary() {
    return {
      x: this.robot.x,
      y: this.robot.y,
      dir: this.robot.dir,
      battery: this.robot.battery,
      carry: this.robot.carry,
      crashed: this.crashed,
      atGoal: !!this.map.goal && this.robot.x === this.map.goal[0] && this.robot.y === this.map.goal[1],
      atKitchen: !!this.map.kitchen && this.robot.x === this.map.kitchen[0] && this.robot.y === this.map.kitchen[1],
      wallAhead: this.wallAhead(),
      delivered: this.delivered.map((d) => d.label),
      crystalsLeft: Object.values(this.crystals).reduce((a, b) => a + b, 0),
      crystalsTotal: Object.values(this.map.crystals).reduce((a, b) => a + b, 0),
      collected: this.collected,
      reports: [...this.reports],
      said: [...this.said],
      openDoors: Object.values(this.doors).filter((d) => d === "open").length,
      openDoorKeys: Object.keys(this.doors).filter((k) => this.doors[k] === "open").sort(),
      hasDoors: Object.keys(this.doors).length > 0,
      doorKeys: Object.keys(this.doors).sort((a, b) => Number(a.split(",")[0]) - Number(b.split(",")[0])),
      alarms: [...this.alarms].sort(),
      motionDoors: this.motion.map((k) => { const [x, y] = k.split(",").map(Number); return key(x, y - 1); }).sort(),
      served: this.served.map((s) => ({ ...s })),
      inventory: this.inventory.map((it) => it.name),
      items: Object.fromEntries(Object.entries(this.items).map(([k, c]) => [k, this.itemName(c)])),
      itemsLeft: Object.keys(this.items).length,
      dropped: this.dropped.map((d) => ({ ...d })),
      marks: [...this.marks],
      actions: this.actions,
      goal: this.map.goal,
    };
  }
}
