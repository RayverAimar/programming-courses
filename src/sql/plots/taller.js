// Case 5, "La base de Loop" (sessions 15–18). The municipality hands Loop the registry of the
// stalls of Market No. 1; on Friday 20 March 2026, 18:52, stall 47 and three more pass to Yolanda
// Ugarte through counter 1. The trail, session by session, is in docs/sql.md.
export const CAST = {
  carmen: 58, alfredo: 1163, susana: 1176, delia: 1117, edith: 1034, yolanda: 1144, abel: 1166,
};
export const TAKEN = [19, 47, 64, 102];

function prng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return { next, int, pick: (l) => l[int(0, l.length - 1)], chance: (p) => next() < p };
}

const KINDS = {
  renov: ["renovación", "renewal", 120],
  trasp: ["traspaso", "transfer", 350],
  rubro: ["cambio de rubro", "change of trade", 60],
  baja: ["baja", "closure", 0],
};

export function taller(ctx) {
  const { rows, add, people, phone, swipe, w, pad } = ctx;
  const r = prng(20260323);
  const P = (id) => people[id - 1];
  const set = (id, fields) => Object.assign(P(id), fields);
  set(CAST.alfredo, { nombre: "Alfredo Benavides Tello" });
  set(CAST.susana, { nombre: "Susana Salazar Pumacayo" });
  set(CAST.delia, { nombre: "Delia Lozano Yupanqui" });
  set(CAST.edith, { nombre: "Edith Choque Ramos" });
  set(CAST.yolanda, { nombre: "Yolanda Ugarte Montes" });
  set(CAST.abel, { nombre: "Abel Vílchez Arias" });
  const tel = (id) => P(id).telefono;
  const castIds = new Set(Object.values(CAST));

  // Accounts of the registry app.
  const USERS = [["abenavides", CAST.alfredo, w("registro", "registry"), "VENT-1"], ["ssalazar", CAST.susana, w("registro", "registry"), "VENT-2"], ["dlozano", CAST.delia, w("sistemas", "IT"), "SIS-01"], ["echoque", CAST.edith, w("gerencia", "management"), "GER-01"], ["admin", null, w("sistemas", "IT"), "SIS-01"]];
  USERS.forEach(([login, persona_id, rol, terminal], i) => add("usuarios", { id: i + 1, login, persona_id, rol, terminal }));
  const CLERK = { 1: ["abenavides", "VENT-1"], 2: ["ssalazar", "VENT-2"] };

  // The registry as it stood on 1 January, from the market's own list of stalls.
  const reg = rows.puestos.map((p) => {
    const y = r.int(2018, 2024);
    const expired = r.chance(0.16);
    const vence = expired ? `2026-${pad(r.int(1, 3))}-${pad(r.int(1, 20))}` : `${r.pick([2026, 2026, 2027, 2027, 2028])}-${pad(r.int(4, 12))}-${pad(r.int(1, 28))}`;
    return { id: p.numero, puesto: p.numero, titular_id: p.persona_id, licencia: `LF-${y}-${pad(p.numero, 4)}`, vence, estado: w("vigente", "active"), actualizado: `2025-${pad(r.int(1, 12))}-${pad(r.int(1, 28))} ${pad(r.int(8, 17))}:${pad(r.int(0, 59))}:${pad(r.int(0, 59))}`, actualizado_por: r.pick(["abenavides", "ssalazar"]) };
  });
  for (const k of [8, 33, 71, 90, 115]) reg[k - 1].estado = w("suspendida", "suspended");
  reg[46].vence = "2026-03-31";
  reg[46].licencia = "LF-2021-0047";
  const byStall = (n) => reg[n - 1];

  // Filings and, from March on, the app's session log: the clerk opens the stall's record (a read
  // outside any transaction), then BEGIN, the filing, the whole row written back from the form, COMMIT.
  const log = [];
  const sessions = new Map();
  const sessionOf = (login, terminal, day) => {
    const key = `${login}|${day}`;
    if (!sessions.has(key)) sessions.set(key, { login, terminal, first: null, rows: [] });
    return sessions.get(key);
  };
  const S = (es, en) => w(es, en);
  const sel = (n) => S(`SELECT * FROM padron_puestos WHERE puesto = ${n}`, `SELECT * FROM stall_registry WHERE stall = ${n}`);
  const ins = (n, kind, who, to) => S(
    `INSERT INTO tramites (puesto, tipo, solicitante_id${to ? ", nuevo_titular_id" : ""}) VALUES (${n}, '${KINDS[kind][0]}', ${who}${to ? `, ${to}` : ""})`,
    `INSERT INTO filings (stall, kind, applicant_id${to ? ", new_holder_id" : ""}) VALUES (${n}, '${KINDS[kind][1]}', ${who}${to ? `, ${to}` : ""})`);
  const upd = (n, row) => S(
    `UPDATE padron_puestos SET titular_id = ${row.titular_id}, licencia = '${row.licencia}', vence = '${row.vence}', estado = '${row.estado.es}' WHERE puesto = ${n}`,
    `UPDATE stall_registry SET holder_id = ${row.titular_id}, license = '${row.licencia}', expires = '${row.vence}', status = '${row.estado.en}' WHERE stall = ${n}`);
  const at = (ts, sec) => {
    const d = new Date(ts.replace(" ", "T") + "Z");
    d.setUTCSeconds(d.getUTCSeconds() + sec);
    return d.toISOString().slice(0, 19).replace("T", " ");
  };
  const put = (sess, momento, puesto, sentencia) => { sess.rows.push({ momento, puesto, sentencia }); };

  const filing = (f) => add("tramites", { id: 0, ...f });
  const apply = (f, kind, row, newRow) => {
    if (f.estado.es !== "aprobado") return;
    Object.assign(row, newRow, { actualizado: f.presentado, actualizado_por: f.funcionario });
  };
  const nextRow = (row, kind, when, to) => {
    if (kind === "renov") {
      const base = row.vence > when.slice(0, 10) ? row.vence : when.slice(0, 10);
      return { ...row, vence: `${Number(base.slice(0, 4)) + 1}${base.slice(4)}` };
    }
    if (kind === "trasp") return { ...row, titular_id: to, licencia: `LF-${when.slice(0, 4)}-${pad(row.puesto, 4)}` };
    if (kind === "baja") return { ...row, estado: w("suspendida", "suspended") };
    return { ...row };
  };

  const stranger = () => { let id; do id = r.int(2, 1200); while (castIds.has(id) || !P(id).telefono); return id; };
  const days = [];
  for (const [m, last] of [[1, 31], [2, 28], [3, 20]]) for (let d = 1; d <= last; d++) {
    const dow = new Date(Date.UTC(2026, m - 1, d)).getUTCDay();
    if (dow >= 1 && dow <= 5) days.push(`2026-${pad(m)}-${pad(d)}`);
  }
  for (const day of days) {
    const n = r.int(2, 6);
    const times = Array.from({ length: n }, () => `${day} ${pad(r.int(8, 17))}:${pad(r.int(0, 59))}:${pad(r.int(0, 59))}`).sort();
    for (const when of times) {
      let stall;
      do stall = r.int(1, 120); while (TAKEN.includes(stall) || stall === 23);
      const row = byStall(stall);
      const roll = r.next();
      const kind = roll < 0.58 ? "renov" : roll < 0.74 ? "rubro" : roll < 0.9 ? "trasp" : "baja";
      const counter = r.chance(0.5) ? 1 : 2;
      const [login, terminal] = CLERK[counter];
      const to = kind === "trasp" ? stranger() : null;
      const st = r.next();
      const estado = when < "2026-03-10" && st < 0.05 ? w("pendiente", "pending") : st < 0.13 ? w("rechazado", "rejected") : w("aprobado", "approved");
      const f = { puesto: stall, tipo: w(KINDS[kind][0], KINDS[kind][1]), solicitante_id: row.titular_id, nuevo_titular_id: to, ventanilla: counter, funcionario: login, presentado: when, estado, pago: KINDS[kind][2] };
      const newRow = nextRow(row, kind, when, to);
      if (day >= "2026-03-02" && estado.es === "aprobado") {
        const sess = sessionOf(login, terminal, day);
        put(sess, at(when, -r.int(60, 400)), stall, sel(stall));
        put(sess, at(when, -1), null, "BEGIN");
        put(sess, when, stall, ins(stall, kind, row.titular_id, to));
        put(sess, at(when, 1), stall, upd(stall, newRow));
        put(sess, at(when, 2), null, "COMMIT");
      }
      filing(f);
      apply(f, kind, row, newRow);
    }
  }

  // Monday 9 March, stall 23: an honest lost update. The owner renews at counter 2 and then sells at
  // counter 1, where the record had been opened before the renewal: the sale writes the old date back.
  {
    const row = byStall(23);
    const owner = row.titular_id, buyer = stranger();
    const g = sessionOf("abenavides", "VENT-1", "2026-03-09"), s = sessionOf("ssalazar", "VENT-2", "2026-03-09");
    const stale = { ...row };
    put(g, "2026-03-09 10:02:14", 23, sel(23));
    put(s, "2026-03-09 10:03:40", 23, sel(23));
    const renewed = nextRow(row, "renov", "2026-03-09 10:05:31");
    put(s, "2026-03-09 10:05:30", null, "BEGIN");
    put(s, "2026-03-09 10:05:31", 23, ins(23, "renov", owner));
    put(s, "2026-03-09 10:05:32", 23, upd(23, renewed));
    put(s, "2026-03-09 10:05:33", null, "COMMIT");
    filing({ puesto: 23, tipo: w(KINDS.renov[0], KINDS.renov[1]), solicitante_id: owner, nuevo_titular_id: null, ventanilla: 2, funcionario: "ssalazar", presentado: "2026-03-09 10:05:31", estado: w("aprobado", "approved"), pago: 120 });
    const sold = nextRow(stale, "trasp", "2026-03-09 10:09:12", buyer);
    put(g, "2026-03-09 10:09:11", null, "BEGIN");
    put(g, "2026-03-09 10:09:12", 23, ins(23, "trasp", owner, buyer));
    put(g, "2026-03-09 10:09:13", 23, upd(23, sold));
    put(g, "2026-03-09 10:09:14", null, "COMMIT");
    filing({ puesto: 23, tipo: w(KINDS.trasp[0], KINDS.trasp[1]), solicitante_id: owner, nuevo_titular_id: buyer, ventanilla: 1, funcionario: "abenavides", presentado: "2026-03-09 10:09:12", estado: w("aprobado", "approved"), pago: 350 });
    Object.assign(row, sold, { actualizado: "2026-03-09 10:09:13", actualizado_por: "abenavides" });
  }

  // Friday 20 March. Counter 2 renews Carmen's licence at 18:47; counter 1, whose session read stall 47
  // at 18:45, writes the whole row back at 18:52 with Yolanda as holder and the old expiry date.
  {
    const s = sessionOf("ssalazar", "VENT-2", "2026-03-20");
    const g = { login: "abenavides", terminal: "VENT-1", first: null, rows: [] };
    sessions.set("abenavides|2026-03-20|late", g);
    const row = byStall(47);
    const stale = { ...row };
    put(s, "2026-03-20 18:44:12", 47, sel(47));
    put(g, "2026-03-20 18:45:05", 47, sel(47));
    const renewed = { ...row, vence: "2027-03-31" };
    put(s, "2026-03-20 18:47:30", null, "BEGIN");
    put(s, "2026-03-20 18:47:31", 47, ins(47, "renov", CAST.carmen));
    put(s, "2026-03-20 18:47:32", 47, upd(47, renewed));
    put(s, "2026-03-20 18:47:33", null, "COMMIT");
    filing({ puesto: 47, tipo: w(KINDS.renov[0], KINDS.renov[1]), solicitante_id: CAST.carmen, nuevo_titular_id: null, ventanilla: 2, funcionario: "ssalazar", presentado: "2026-03-20 18:47:31", estado: w("aprobado", "approved"), pago: 120 });
    const plan = [[47, "18:45:05", "18:52:38"], [19, "18:53:50", "18:54:10"], [64, "18:55:40", "18:56:01"], [102, "18:57:20", "18:57:46"]];
    for (const [n, read, begin] of plan) {
      const base = n === 47 ? stale : { ...byStall(n) };
      const taken = { ...base, titular_id: CAST.yolanda, licencia: `LF-2026-${pad(n, 4)}` };
      const t0 = `2026-03-20 ${begin}`;
      if (n !== 47) put(g, `2026-03-20 ${read}`, n, sel(n));
      put(g, t0, null, "BEGIN");
      put(g, at(t0, 1), n, ins(n, "trasp", CAST.yolanda, CAST.yolanda));
      put(g, at(t0, 2), n, upd(n, taken));
      put(g, at(t0, 3), null, "COMMIT");
      filing({ puesto: n, tipo: w(KINDS.trasp[0], KINDS.trasp[1]), solicitante_id: CAST.yolanda, nuevo_titular_id: CAST.yolanda, ventanilla: 1, funcionario: "abenavides", presentado: at(t0, 1), estado: w("aprobado", "approved"), pago: 0 });
      Object.assign(byStall(n), taken, { actualizado: at(t0, 2), actualizado_por: "abenavides" });
    }
  }

  // A few reports from IT, and the shared admin account once.
  for (const day of ["2026-03-04", "2026-03-11", "2026-03-18"]) {
    const d = sessionOf("dlozano", "SIS-01", day);
    put(d, `${day} 11:${pad(r.int(0, 59))}:${pad(r.int(0, 59))}`, null, S("SELECT estado, count(*) FROM padron_puestos GROUP BY estado", "SELECT status, count(*) FROM stall_registry GROUP BY status"));
  }
  put(sessionOf("admin", "SIS-01", "2026-03-02"), "2026-03-02 07:15:00", null, "VACUUM");

  for (const s of sessions.values()) s.rows.sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const ordered = [...sessions.values()].filter((s) => s.rows.length).sort((a, b) => (a.rows[0].momento < b.rows[0].momento ? -1 : 1));
  ordered.forEach((s, i) => { for (const x of s.rows) log.push({ sesion: 300 + i, usuario: s.login, terminal: s.terminal, ...x }); });
  log.sort((a, b) => (a.momento < b.momento ? -1 : a.momento > b.momento ? 1 : a.sesion - b.sesion));
  log.forEach((x, i) => add("bitacora", { id: i + 1, ...x }));
  rows.tramites.sort((a, b) => (a.presentado < b.presentado ? -1 : 1));
  rows.tramites.forEach((x, i) => { x.id = i + 1; });
  for (const row of reg) add("padron_puestos", row);

  // The office's old spreadsheet: one row per stall, edited in place, some typed twice, names typed
  // by hand, a second trade after a comma, and a few owners whose new number reached only one row.
  const typo = (name) => {
    const k = r.int(0, 5);
    return k === 0 ? name.toUpperCase() : k === 1 ? name.normalize("NFD").replace(/[̀-ͯ]/g, "") : name;
  };
  const SECOND = [w("verduras", "vegetables"), w("abarrotes", "groceries"), w("especias", "spices"), w("flores", "flowers")];
  const oldPhone = new Map();
  let fila = 0;
  const sheetRow = (row, edited, phoneOverride) => {
    const p = P(row.titular_id);
    const stall = rows.puestos[row.puesto - 1];
    const extra = r.chance(0.25) ? r.pick(SECOND) : null;
    const rubros = extra && extra.es !== stall.rubro.es ? w(`${stall.rubro.es}, ${extra.es}`, `${stall.rubro.en}, ${extra.en}`) : stall.rubro;
    add("planilla_puestos", { fila: ++fila, puesto: row.puesto, pasillo: stall.pasillo, rubros, titular: typo(String(p.nombre).trim()), dni: p.dni, telefono: phoneOverride || p.telefono, distrito: p.distrito, licencia: row.licencia, editado: edited });
  };
  const stale = new Set();
  for (const row of reg) {
    const p = P(row.titular_id);
    if (!p.telefono) continue;
    if (!TAKEN.includes(row.puesto) && !oldPhone.has(p.id) && stale.size < 6 && r.chance(0.08)) { oldPhone.set(p.id, phone()); stale.add(p.id); }
  }
  for (const row of reg) {
    if (TAKEN.includes(row.puesto)) {
      sheetRow(row, "2026-03-20", tel(CAST.delia));
      continue;
    }
    const p = P(row.titular_id);
    const edited = `2025-${pad(r.int(2, 12))}-${pad(r.int(1, 28))}`;
    const old = oldPhone.get(p.id);
    sheetRow(row, edited, old && !oldPhone.has(`done${p.id}`) ? (oldPhone.set(`done${p.id}`, 1), old) : null);
    if (r.chance(0.03)) sheetRow(row, `2026-0${r.int(1, 2)}-${pad(r.int(1, 28))}`);
  }

  // Market cards: the office is on the market's second floor, so its staff swipe in and out.
  rows.ingresos_mercado = rows.ingresos_mercado.filter((x) => !(castIds.has(x.persona_id) && x.persona_id !== CAST.carmen && x.momento >= "2026-03-"));
  const staff = [CAST.alfredo, CAST.susana, CAST.delia, CAST.edith];
  const planted = (id, gate, ts, dir) => { swipe(id, gate, ts, dir).planted = true; };
  for (let d = 2; d <= 31; d++) {
    const dow = new Date(Date.UTC(2026, 2, d)).getUTCDay();
    if (dow === 0 || dow === 6 || d === 20) continue;
    for (const id of staff) {
      planted(id, r.pick([1, 1, 2]), `2026-03-${pad(d)} 0${r.int(7, 8)}:${pad(r.int(30, 59))}:${pad(r.int(0, 59))}`, "in");
      planted(id, r.pick([1, 2]), `2026-03-${pad(d)} ${r.int(17, 18)}:${pad(r.int(0, 50))}:${pad(r.int(0, 59))}`, "out");
    }
  }
  planted(CAST.alfredo, 1, "2026-03-20 07:52:10", "in");
  planted(CAST.susana, 2, "2026-03-20 07:58:44", "in");
  planted(CAST.delia, 1, "2026-03-20 08:09:31", "in");
  planted(CAST.edith, 1, "2026-03-20 08:31:02", "in");
  planted(CAST.edith, 1, "2026-03-20 17:46:20", "out");
  planted(CAST.delia, 1, "2026-03-20 18:20:14", "out");
  planted(CAST.alfredo, 1, "2026-03-20 18:28:05", "out");
  planted(CAST.alfredo, 2, "2026-03-20 18:41:37", "in");
  planted(CAST.alfredo, 2, "2026-03-20 19:06:50", "out");
  planted(CAST.susana, 2, "2026-03-20 19:11:26", "out");

  // The money and the calls.
  const pair = (a, b) => castIds.has(a) && castIds.has(b);
  const phoneOwner = new Map(people.filter((p) => p.telefono).map((p) => [p.telefono, p.id]));
  rows.transferencias = rows.transferencias.filter((x) => !pair(phoneOwner.get(x.de_telefono), phoneOwner.get(x.a_telefono)));
  rows.llamadas = rows.llamadas.filter((x) => !pair(phoneOwner.get(x.origen), phoneOwner.get(x.destino)));
  const buyers = [stranger(), stranger(), stranger()];
  const pay = (a, b, monto, momento, mensaje) => add("transferencias", { id: 0, de_telefono: a, a_telefono: b, monto, momento, mensaje });
  pay(tel(CAST.abel), tel(CAST.yolanda), 3000, "2026-03-19 20:14:33", w("primera cuota puesto 47", "first instalment stall 47"));
  pay(tel(CAST.abel), tel(CAST.yolanda), 2000, "2026-03-21 10:05:12", w("saldo puesto 47", "balance stall 47"));
  pay(tel(buyers[0]), tel(CAST.yolanda), 2500, "2026-03-21 11:40:09", w("puesto 19", "stall 19"));
  pay(tel(buyers[1]), tel(CAST.yolanda), 1800, "2026-03-21 16:22:51", w("puesto 64", "stall 64"));
  pay(tel(buyers[2]), tel(CAST.yolanda), 2200, "2026-03-22 09:03:27", w("PUESTO 102", "STALL 102"));
  pay(tel(CAST.yolanda), tel(CAST.alfredo), 4500, "2026-03-21 12:30:00", w("cuota de la junta", "savings-club share"));
  pay(tel(CAST.yolanda), tel(CAST.alfredo), 3000, "2026-03-23 09:10:44", w("préstamo", "loan"));
  const call = (a, b, inicio, duracion_s) => add("llamadas", { id: 0, origen: tel(a), destino: tel(b), inicio, duracion_s });
  call(CAST.abel, CAST.yolanda, "2026-03-19 19:40:05", 310);
  call(CAST.yolanda, CAST.alfredo, "2026-03-19 21:02:10", 230);
  call(CAST.alfredo, CAST.yolanda, "2026-03-20 18:53:30", 48);
  call(CAST.alfredo, CAST.yolanda, "2026-03-23 09:05:02", 95);
}
