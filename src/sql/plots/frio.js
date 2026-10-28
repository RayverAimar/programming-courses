// Case 4, "El caso frío de 1998" (sessions 12–14). The night of Friday 18 December 1998 someone opened
// the safe of Textil San Jacinto, in La Victoria, with its combination and took the Christmas payroll.
// The night guard, Teodoro Llanos, was convicted; in March 2026 his daughter asks Loop to look
// again. Everything here has its own seed, so the other cases' rows don't move.
// The trail: docs/sql.md. Ids and numbers the sessions quote are in CAST and NUM.
import { rng, w, pad, FIRST_F, FIRST_M, SURNAMES } from "../world.js";

export const CAST = {
  gerente: 7, finanzas: 52, rosa: 214, pilar: 233, gladys: 287, victor: 318, edwin: 366, yesenia: 377, nilton: 405,
  kevin: 419, raul: 431, milagros: 452, sonia: 468, bryan: 512, teodoro: 590, abel: 131, admin: 19, hugo: 543,
};
export const NUM = {
  caseta: "4721093", central: "4721000", publico: "4723310", victor: "4417825", rosa: "4402216", nilton: "2741958",
  kiara: "4237750", candado: "4256641", teodoro: "2715504", celia: "4239014", ayudante: "3302871", hermana: "2716620",
};

const D98 = ["La Victoria", "Lince", "Breña", "Surquillo", "San Borja", "Rímac", "Jesús María", "San Isidro", "Surco", "Cercado de Lima", "San Martín de Porres", "Comas", "El Agustino", "Ate", "San Juan de Lurigancho", "Chorrillos", "Barranco", "Miraflores", "Pueblo Libre", "San Miguel"];
const STREETS = ["Av. México", "Av. Aviación", "Jr. Huánuco", "Av. Manco Cápac", "Jr. Gamarra", "Av. Grau", "Av. Arriola", "Jr. Antonio Bazo", "Av. Canadá", "Av. Iquitos", "Av. Arequipa", "Av. Brasil", "Jr. Huaraz", "Av. Petit Thouars", "Calle Los Geranios", "Av. Angamos", "Jr. Ayacucho", "Av. Tacna", "Av. Abancay", "Calle Las Begonias"];
const at = (d, h, m, s = 0) => `1998-12-${pad(d)} ${pad(h)}:${pad(m)}:${pad(s)}`;

export function frio({ rows }) {
  const r = rng(19981218);
  const emp = [];
  const usedNames = new Set();
  const nameOf = () => {
    let n;
    do { const f = r.chance(0.45); n = `${r.pick(f ? FIRST_F : FIRST_M)} ${r.pick(SURNAMES)} ${r.pick(SURNAMES)}`; } while (usedNames.has(n));
    usedNames.add(n);
    return n;
  };

  // The org chart: who reports to whom. Planted people keep their ids; everyone else gets a free one.
  const add = (fixed, nombre, cargo, area, boss) => { const e = { fixed, nombre: nombre || nameOf(), cargo, area, boss }; if (nombre) usedNames.add(nombre); emp.push(e); return e; };
  const A = (es, en) => w(es, en);
  const AREA = {
    ger: A("Gerencia", "Management"), prod: A("Producción", "Production"), fin: A("Finanzas", "Finance"), tes: A("Tesorería", "Treasury"),
    con: A("Contabilidad", "Accounting"), cre: A("Créditos", "Credit"), adm: A("Administración", "Administration"), seg: A("Seguridad", "Security"),
    ser: A("Servicios", "Services"), rrhh: A("Recursos Humanos", "Human Resources"), com: A("Comercial", "Sales"), log: A("Logística", "Logistics"),
  };
  const C = (es, en) => w(es, en);
  const gg = add(CAST.gerente, "Ernesto Zevallos Arias", C("gerente general", "general manager"), AREA.ger, null);
  const gProd = add(11, null, C("gerente de producción", "production manager"), AREA.prod, gg);
  const gFin = add(CAST.finanzas, "Augusto Benavides Tello", C("gerente de finanzas", "finance manager"), AREA.fin, gg);
  const gAdm = add(CAST.admin, "Marco Aguilar Ríos", C("gerente de administración", "administration manager"), AREA.adm, gg);
  const gCom = add(28, null, C("gerente comercial", "sales manager"), AREA.com, gg);
  const gLog = add(36, null, C("gerente de logística", "logistics manager"), AREA.log, gg);

  for (const [es, en] of [["hilandería", "spinning"], ["tejeduría", "weaving"], ["tintorería", "dyeing"], ["confección", "garment making"]]) {
    const jefe = add(null, null, C(`jefe de ${es}`, `head of ${en}`), AREA.prod, gProd);
    for (let s = 0; s < 4; s++) {
      const sup = add(null, null, C(`supervisor de ${es}`, `${en} supervisor`), AREA.prod, jefe);
      const n = r.int(24, 32);
      for (let k = 0; k < n; k++) add(null, null, C("operario", "machine operator"), r.chance(0.04) ? null : AREA.prod, sup);
    }
  }

  const rosa = add(CAST.rosa, "Rosa Ugarte Bustamante", C("jefa de tesorería", "head of treasury"), AREA.tes, gFin);
  add(CAST.pilar, "Pilar Ramos Vargas", C("asistente de tesorería", "treasury assistant"), AREA.fin, rosa);
  const victor = add(CAST.victor, "Víctor Salazar Montes", C("supervisor de caja", "cash supervisor"), AREA.tes, rosa);
  const gladys = add(CAST.gladys, "Gladys Ccori Medina", C("supervisora de caja", "cash supervisor"), w("Tesoreria", "Treasury "), rosa);
  add(CAST.edwin, "Edwin Torres Mendoza", C("cajero", "cashier"), w("tesorería", "treasury"), victor);
  add(CAST.yesenia, "Yesenia Flores Ccori", C("cajera", "cashier"), AREA.tes, victor);
  add(CAST.kevin, "Kevin Huamán Soto", C("cajero", "cashier"), AREA.tes, victor);
  add(CAST.milagros, "Milagros Díaz Rivera", C("cajera", "cashier"), AREA.tes, victor);
  const nilton = add(CAST.nilton, "Nilton Palomino Ríos", C("cajero", "cashier"), AREA.tes, gladys);
  add(CAST.raul, "Raúl Condori Paredes", C("cajero", "cashier"), AREA.tes, gladys);
  add(CAST.sonia, "Sonia Quispe Llanos", C("cajera", "cashier"), AREA.tes, gladys);
  add(CAST.bryan, "Bryan Rojas Tello", C("practicante de caja", "cashier trainee"), null, nilton);
  const jCon = add(null, null, C("jefe de contabilidad", "head of accounting"), AREA.con, gFin);
  for (let k = 0; k < 8; k++) add(null, null, k < 2 ? C("analista contable", "accounting analyst") : C("asistente contable", "accounting assistant"), AREA.con, jCon);
  const jCre = add(null, null, C("jefa de créditos y cobranzas", "head of credit and collections"), AREA.cre, gFin);
  for (let k = 0; k < 5; k++) add(null, null, C("gestor de cobranzas", "collections officer"), r.chance(0.2) ? AREA.fin : AREA.cre, jCre);

  const abel = add(CAST.abel, "Abel Choque Huanca", C("jefe de seguridad", "head of security"), AREA.seg, gAdm);
  add(CAST.teodoro, "Teodoro Llanos Cusi", C("vigilante nocturno", "night guard"), AREA.seg, abel);
  for (let k = 0; k < 7; k++) add(null, null, k < 3 ? C("vigilante nocturno", "night guard") : C("vigilante", "guard"), AREA.seg, abel);
  const jSer = add(null, null, C("jefe de servicios", "head of services"), AREA.ser, gAdm);
  add(CAST.hugo, "Hugo Mamani Vargas", C("mensajero", "messenger"), AREA.tes, jSer);
  for (let k = 0; k < 10; k++) add(null, null, k < 6 ? C("limpieza", "cleaner") : C("mensajero", "messenger"), AREA.ser, jSer);
  const jRh = add(null, null, C("jefa de recursos humanos", "head of human resources"), AREA.rrhh, gAdm);
  for (let k = 0; k < 4; k++) add(null, null, C("asistente de personal", "HR assistant"), AREA.rrhh, jRh);
  for (let j = 0; j < 2; j++) {
    const jv = add(null, null, C("jefe de ventas", "head of sales"), AREA.com, gCom);
    for (let k = 0; k < 6; k++) add(null, null, C("vendedor", "salesperson"), AREA.com, jv);
  }
  const jAlm = add(null, null, C("jefe de almacén", "head of warehouse"), AREA.log, gLog);
  for (let k = 0; k < 12; k++) add(null, null, C("almacenero", "warehouse worker"), AREA.log, jAlm);
  const jTr = add(null, null, C("jefe de transporte", "head of transport"), AREA.log, gLog);
  for (let k = 0; k < 8; k++) add(null, null, C("chofer", "driver"), AREA.log, jTr);

  const taken = new Set(emp.filter((e) => e.fixed).map((e) => e.fixed));
  const free = [];
  for (let id = 1; free.length < emp.length - taken.size; id++) if (!taken.has(id)) free.push(id);
  for (let i = free.length - 1; i > 0; i--) { const j = r.int(0, i); [free[i], free[j]] = [free[j], free[i]]; }
  let fi = 0;
  for (const e of emp) e.id = e.fixed || free[fi++];

  // Phones: 7-digit numbers. Home numbers of the staff, other homes, shops and public phones.
  const used = new Set(Object.values(NUM));
  const number = (lo = 2, hi = 4) => { let n; do n = `${r.int(lo, hi)}${r.int(100000, 999999)}`; while (used.has(n)); used.add(n); return n; };
  const phones = [];
  const phone = (numero, titular, tipo, direccion, distrito) => { phones.push({ numero, titular, tipo, direccion, distrito }); return numero; };
  const KIND = { casa: w("casa", "home"), negocio: w("negocio", "business"), publico: w("público", "public") };
  const addr = () => `${r.pick(STREETS)} ${r.int(1, 30) * 10 + r.int(0, 9)}`;
  const PLANTED_HOMES = {
    [CAST.victor]: [NUM.victor, "Gloria Tello de Salazar", "Calle Los Geranios 145", "San Borja"],
    [CAST.rosa]: [NUM.rosa, "Rosa Ugarte Bustamante", "Av. Arequipa 2210", "Lince"],
    [CAST.nilton]: [NUM.nilton, "Nilton Palomino Ríos", "Calle Las Begonias 318", "Surco"],
    [CAST.teodoro]: [NUM.teodoro, "Teodoro Llanos Cusi", "Jr. Narciso de la Colina 512", "Surquillo"],
  };
  for (const e of emp) {
    const planted = PLANTED_HOMES[e.id];
    if (planted) {
      const [numero, titular, direccion, distrito] = planted;
      e.telefono = phone(numero, titular, KIND.casa, direccion, distrito);
      e.distrito = distrito;
      continue;
    }
    e.distrito = r.pick(D98);
    if (!r.chance(0.55)) { e.telefono = null; continue; }
    const titular = r.chance(0.7) ? e.nombre : `${r.pick(FIRST_F)} ${e.nombre.split(" ")[2]} de ${e.nombre.split(" ")[1]}`;
    e.telefono = phone(number(), titular, KIND.casa, addr(), e.distrito);
  }
  phone(NUM.caseta, w("Textil San Jacinto S.A. (caseta de vigilancia)", "Textil San Jacinto S.A. (guard booth)"), KIND.negocio, "Av. México 1450", "La Victoria");
  phone(NUM.central, "Textil San Jacinto S.A.", KIND.negocio, "Av. México 1450", "La Victoria");
  phone(NUM.publico, w("Telefónica del Perú (teléfono público)", "Telefónica del Perú (public phone)"), KIND.publico, w("Av. México cdra. 14, frente a Textil San Jacinto", "Av. México block 14, opposite Textil San Jacinto"), "La Victoria");
  phone(NUM.kiara, "Kiara Medina Aguilar", KIND.casa, "Jr. Huaraz 1180", "Breña");
  phone(NUM.celia, "Celia Aguilar Rojas", KIND.casa, "Jr. Huaraz 1180", "Breña");
  phone(NUM.candado, "Cerrajería El Candado", KIND.negocio, w("Jr. Huánuco 1290 (cajas fuertes y llaves)", "Jr. Huánuco 1290 (safes and keys)"), "La Victoria");
  phone(NUM.ayudante, "Félix Apaza Ramos", KIND.casa, "Jr. Antonio Bazo 877", "La Victoria");
  phone(NUM.hermana, "Zoila Llanos Cusi", KIND.casa, "Jr. Narciso de la Colina 530", "Surquillo");
  const locksmiths = [
    phone(number(), "Cerrajería Lima", KIND.negocio, "Jr. Ayacucho 455", "Cercado de Lima"),
    phone(number(), "CERRAJERIA LOS ANDES", KIND.negocio, "Av. Grau 1320", "La Victoria"),
    phone(number(), "Cerrajería San Martín", KIND.negocio, "Av. Tacna 610", "Cercado de Lima"),
    phone(number(), "cerrajería la llave de oro", KIND.negocio, "Av. Brasil 2330", "Jesús María"),
  ];
  const homes = [];
  for (let i = 0; i < 4200; i++) homes.push(phone(number(), nameOf(), KIND.casa, addr(), r.pick(D98)));
  const SHOPS = [["Bodega", "Bodega"], ["Farmacia", "Farmacia"], ["Pollería", "Pollería"], ["Ferretería", "Ferretería"], ["Panadería", "Panadería"], ["Botica", "Botica"], ["Taller mecánico", "Taller mecánico"], ["Librería", "Librería"], ["Chifa", "Chifa"], ["Textiles", "Textiles"]];
  const shops = [];
  for (let i = 0; i < 520; i++) {
    const [kind] = r.pick(SHOPS);
    shops.push(phone(number(), `${kind} ${r.pick([...FIRST_F, ...FIRST_M])}${r.chance(0.3) ? ` ${r.int(2, 9)}` : ""}`, KIND.negocio, addr(), r.pick(D98)));
  }
  const publics = [];
  for (let i = 0; i < 80; i++) publics.push(phone(number(), w("Telefónica del Perú (teléfono público)", "Telefónica del Perú (public phone)"), KIND.publico, w(`${r.pick(STREETS)} cdra. ${r.int(1, 30)}`, `${r.pick(STREETS)} block ${r.int(1, 30)}`), r.pick(D98)));
  for (let i = phones.length - 1; i > 0; i--) { const j = r.int(0, i); [phones[i], phones[j]] = [phones[j], phones[i]]; }
  phones.forEach((p, i) => { p.id = i + 1; rows.telefonos_1998.push(p); });

  for (const e of emp) rows.empleados_1998.push({ id: e.id, nombre: e.nombre, dni: String(r.int(6000000, 46000000)).padStart(8, "0"), cargo: e.cargo, area: e.area, jefe_id: e.boss ? e.boss.id : null, telefono: e.telefono, distrito: e.distrito });
  rows.empleados_1998.sort((a, b) => a.id - b.id);

  // Calls: a month of background traffic, then the trail. Hours lean to the day; public phones mostly
  // call out. Nobody but the trail touches the booth, the public phone or the locksmith at night.
  const staffPhones = emp.filter((e) => e.telefono).map((e) => e.telefono);
  const knowers = new Set(rows.empleados_1998.filter((e) => inTreasury(e.id, rows.empleados_1998)).map((e) => e.telefono).filter(Boolean));
  const special = new Set([NUM.caseta, NUM.publico, NUM.candado, NUM.ayudante, ...locksmiths]);
  const everyone = [...staffPhones, ...homes, ...homes, ...shops, NUM.kiara, NUM.celia, NUM.hermana, NUM.central];
  const HOURS = [7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 15, 16, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 23, 0, 6];
  const calls = [];
  const call = (origen, destino, inicio, duracion_s) => calls.push({ origen, destino, inicio, duracion_s });
  const night = (ts) => ts >= "1998-12-18 18:00:00" && ts <= "1998-12-19 06:00:00";
  const guarded = new Set([NUM.victor, NUM.rosa, NUM.nilton, NUM.kiara, NUM.teodoro, NUM.celia, NUM.hermana, ...knowers]);
  for (let i = 0; i < 60000; i++) {
    const fromPublic = r.chance(0.04);
    const a = fromPublic ? r.pick(publics) : r.pick(everyone);
    let b = r.pick(everyone);
    if (b === a) b = r.pick(shops);
    const inicio = at(r.int(1, 31), r.pick(HOURS), r.int(0, 59), r.int(0, 59));
    const dur = r.chance(0.12) ? 0 : r.pick([r.int(8, 90), r.int(30, 400), r.int(60, 1500)]);
    if (night(inicio) && (guarded.has(a) || guarded.has(b))) continue;
    call(a, b, inicio, dur);
  }
  for (let d = 1; d <= 31; d++) {
    if (r.chance(0.7)) call(NUM.central, NUM.caseta, at(d, r.int(8, 17), r.int(0, 59), r.int(0, 59)), r.int(20, 180));
    if (r.chance(0.5)) call(NUM.caseta, NUM.central, at(d, r.int(8, 17), r.int(0, 59), r.int(0, 59)), r.int(20, 180));
    if (r.chance(0.15)) call(r.pick(homes), NUM.candado, at(d, r.int(9, 18), r.int(0, 59), r.int(0, 59)), r.int(40, 300));
    if (r.chance(0.25)) call(r.pick([...homes, ...shops]), r.pick(locksmiths), at(d, r.int(9, 18), r.int(0, 59), r.int(0, 59)), r.int(40, 300));
    if (r.chance(0.6)) call(NUM.publico, r.pick(everyone.filter((x) => !guarded.has(x))), at(d, r.int(9, 20), r.int(0, 59), r.int(0, 59)), r.int(30, 400));
  }
  call(NUM.rosa, locksmiths[0], at(2, 10, 14, 30), 124);
  call(NUM.teodoro, NUM.hermana, at(6, 12, 30, 0), 610);
  call(NUM.kiara, NUM.nilton, at(11, 21, 2, 41), 1320);
  call(NUM.nilton, NUM.kiara, at(15, 20, 41, 5), 905);

  // The trail.
  call(NUM.victor, NUM.candado, at(12, 19, 40, 12), 310);
  call(NUM.victor, NUM.candado, at(14, 20, 15, 3), 125);
  call(NUM.victor, NUM.candado, at(15, 22, 50, 47), 95);
  call(NUM.victor, NUM.publico, at(15, 23, 21, 9), 70);
  call(NUM.publico, NUM.caseta, at(15, 23, 26, 44), 48);
  call(NUM.candado, NUM.victor, at(16, 8, 10, 30), 60);
  call(NUM.victor, NUM.candado, at(17, 21, 5, 18), 240);
  call(NUM.celia, NUM.kiara, at(18, 21, 10, 2), 330);
  call(NUM.caseta, NUM.teodoro, at(18, 22, 5, 11), 840);
  call(NUM.teodoro, NUM.hermana, at(18, 22, 30, 40), 415);
  call(NUM.publico, NUM.kiara, at(18, 22, 31, 52), 180);
  call(NUM.victor, NUM.candado, at(18, 22, 58, 26), 52);
  call(NUM.candado, NUM.ayudante, at(18, 23, 5, 0), 64);
  call(NUM.victor, NUM.publico, at(18, 23, 36, 15), 95);
  call(NUM.publico, NUM.caseta, at(18, 23, 41, 2), 62);
  call(NUM.kiara, NUM.nilton, at(18, 23, 50, 33), 600);
  call(NUM.caseta, NUM.rosa, at(19, 0, 52, 8), 0);
  call(NUM.caseta, NUM.rosa, at(19, 0, 55, 40), 0);
  call(NUM.caseta, NUM.central, at(19, 7, 31, 0), 0);
  call(NUM.rosa, NUM.caseta, at(19, 7, 48, 19), 260);
  calls.sort((a, b) => (a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : 0));
  calls.forEach((c, i) => { c.id = i + 1; });
  rows.llamadas_1998.push(...calls);

  // What each one told the police, word for word.
  const said = (empleado_id, fecha, texto) => rows.declaraciones_1998.push({ id: 0, empleado_id, fecha, texto });
  said(CAST.teodoro, "1998-12-19", w(
    "A las once y cuarenta me llamaron a la caseta. Una voz de hombre dijo que hablaba de parte de la señora Ugarte, de Tesorería, y que iba a entrar el técnico de la caja fuerte, como me habían avisado el martes en la noche. Lo dejé pasar por la puerta lateral. Salió como a las doce y cuarenta con su maletín. A la una menos ocho llamé a la casa de la señora Ugarte para avisarle que el técnico ya se había ido, pero nadie contestó.",
    "At twenty to twelve somebody called the booth. A man's voice said he was calling for Mrs Ugarte, from Treasury, and that the safe technician was coming in, as they'd warned me on Tuesday night. I let him in through the side door. He left at about twenty to one with his case. At eight minutes to one I called Mrs Ugarte's home to tell her the technician had gone, but nobody answered."));
  said(CAST.rosa, "1998-12-19", w(
    "Yo no mandé a ningún técnico. La combinación de la caja fuerte la cambié el martes 15 y solo la conocíamos yo y mi gente: todos los que dependen de mí en Tesorería, directa o indirectamente. Esa noche me fui a dormir temprano y no escuché el teléfono.",
    "I didn't send any technician. I changed the safe's combination on Tuesday the 15th and only my people and I knew it: everyone who reports to me in Treasury, directly or indirectly. That night I went to bed early and didn't hear the phone."));
  said(CAST.victor, "1998-12-20", w(
    "Salí de la fiesta de la empresa como a las nueve y media y me fui a mi casa. Toda la noche estuve con mi familia viendo televisión. No conozco a ningún cerrajero y nunca he llamado a uno.",
    "I left the company party at about half past nine and went home. I spent the whole night with my family watching television. I don't know any locksmith and I've never called one."));
  said(CAST.nilton, "1998-12-20", w(
    "Esa noche estuve en una pollada en Breña con mi enamorada, Kiara. Me fui antes que ella; me llamó cuando llegué a mi casa, como a las doce menos diez.",
    "That night I was at a chicken fundraiser in Breña with my girlfriend, Kiara. I left before her; she called me when I got home, at about ten to twelve."));
  said(CAST.gladys, "1998-12-19", w(
    "Me enteré el sábado en la mañana. La caja fuerte no estaba forzada: el que la abrió sabía la combinación.",
    "I found out on Saturday morning. The safe wasn't forced: whoever opened it knew the combination."));
  said(CAST.finanzas, "1998-12-19", w(
    "Yo no conocía la combinación nueva. La señora Ugarte la maneja con su equipo; yo solo firmo los retiros del banco.",
    "I didn't know the new combination. Mrs Ugarte handles it with her team; I only sign the bank withdrawals."));
  said(CAST.abel, "1998-12-19", w(
    "Teodoro lleva once años con nosotros y nunca tuvo un problema. Esa noche estaba solo en la caseta, como siempre.",
    "Teodoro has been with us eleven years and never had a problem. That night he was alone in the booth, as always."));
  said(CAST.pilar, "1998-12-19", w(
    "El viernes cerramos la caja a las seis con el dinero de las gratificaciones adentro: cuatrocientos doce mil soles.",
    "On Friday we closed the safe at six with the Christmas bonus money inside: four hundred and twelve thousand soles."));
  said(CAST.hugo, "1998-12-20", w(
    "Yo llevo sobres de Tesorería al banco, pero la combinación nunca me la dieron.",
    "I carry Treasury's envelopes to the bank, but they never gave me the combination."));
  const BORING = [
    w("Salí a las seis, cuando terminó mi turno, y no vi nada raro.", "I left at six when my shift ended and didn't see anything strange."),
    w("Estuve en la fiesta hasta las nueve y después me fui a mi casa en combi.", "I was at the party until nine and then took a minibus home."),
    w("No trabajo de noche. Me enteré por la radio el sábado.", "I don't work nights. I heard about it on the radio on Saturday."),
    w("Esa semana estaba de vacaciones en Huancayo.", "That week I was on holiday in Huancayo."),
  ];
  const plain = emp.filter((e) => !e.fixed);
  for (let i = 0; i < 18; i++) said(plain[r.int(0, plain.length - 1)].id, `1998-12-${pad(r.int(19, 23))}`, r.pick(BORING));
  rows.declaraciones_1998.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.empleado_id - b.empleado_id));
  rows.declaraciones_1998.forEach((x, i) => { x.id = i + 1; });
}

function inTreasury(id, all) {
  const byId = new Map(all.map((e) => [e.id, e]));
  for (let e = byId.get(id); e; e = byId.get(e.jefe_id)) if (e.id === CAST.rosa) return true;
  return false;
}
