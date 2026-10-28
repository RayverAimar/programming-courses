// Lima's case files: a deterministic database, the same in Spanish and English (only names of tables,
// columns and words inside the data change). Background rows come from a seeded generator; each case
// plants its trail on top (plots/). The build, verify.mjs and the browser worker all call fillWorld,
// so the database a learner queries is the one the build checked. See docs/sql.md.
import { TABLES, tableName, colName, createSql } from "./schema.js";
import { PLOTS } from "./plots/index.js";

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = (list) => list[int(0, list.length - 1)];
  const chance = (p) => next() < p;
  return { next, int, pick, chance, list: (n, lo, hi) => Array.from({ length: n }, () => int(lo, hi)) };
}

// A word that changes with the language: { es, en }. Everything else is the same in both.
export const w = (es, en) => ({ es, en });
const say = (v, lang) => (v && typeof v === "object" && "es" in v ? v[lang] ?? v.es : v);

export const pad = (n, k = 2) => String(n).padStart(k, "0");
export const stamp = (day, h, m, s = 0) => `2026-03-${pad(day)} ${pad(h)}:${pad(m)}:${pad(s)}`;
export function shift(ts, minutes) {
  const d = new Date(ts.replace(" ", "T") + "Z");
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 19).replace("T", " ");
}
export const toUtc = (local) => shift(local, 300);

export const FIRST_F = "Ana Rosa María Lucía Carmen Juana Elena Patricia Rocío Milagros Yolanda Flor Gladys Marleny Fiorella Kiara Valeria Ximena Sofía Daniela Nelly Teresa Susana Mónica Silvia Zoila Edith Maribel Yesenia Pilar Gabriela Camila Brenda Luz Celia Delia Norma Sonia Martha Haydée".split(" ");
export const FIRST_M = "José Luis Juan Carlos Jorge Pedro Miguel Víctor Julio Óscar Renzo César Raúl Alberto Wilmer Edwin Hugo Marco Diego Sebastián Andrés Kevin Bryan Percy Walter Teodoro Félix Ernesto Fernando Iván Rubén Alfredo Gustavo Manuel Ricardo Eduardo Nilton Jhonatan Abel Tito".split(" ");
export const SURNAMES = "Quispe Mamani Huamán Flores Rojas García Rodríguez Sánchez Torres Ramos Chávez Vargas Castillo Mendoza Paredes Cárdenas Ccori Condori Ticona Apaza Gutiérrez Salazar Espinoza Vílchez Pérez Díaz Romero Huanca Choque Cruz Silva Ríos Campos Medina Aguilar Llanos Palomino Zevallos Benavides Alvarado Ccahuana Huamaní Soto Rivera Lozano Arias Tello Cusi Pumacayo Yupanqui Ugarte Bustamante Montes".split(" ");
export const DISTRICTS = ["Surquillo", "Miraflores", "Barranco", "San Borja", "Surco", "San Isidro", "Lince", "Jesús María", "Breña", "La Victoria", "Rímac", "Chorrillos", "San Miguel", "Pueblo Libre", "Magdalena", "Los Olivos", "Comas", "Ate", "San Juan de Lurigancho", "Villa El Salvador", "Callao"];
export const OCCUPATIONS = [
  w("comerciante", "merchant"), w("proveedor", "supplier"), w("limpieza", "cleaner"), w("vigilante", "security guard"),
  w("estudiante", "student"), w("docente", "teacher"), w("chofer", "driver"), w("ingeniera", "engineer"), w("enfermera", "nurse"),
  w("cocinero", "cook"), w("contadora", "accountant"), w("mecánico", "mechanic"), w("electricista", "electrician"),
  w("programadora", "programmer"), w("abogado", "lawyer"), w("costurera", "seamstress"), w("taxista", "taxi driver"),
  w("panadero", "baker"), w("jubilado", "retired"), w("técnico de robots", "robot technician"),
];
export const COLORS = [w("blanco", "white"), w("negro", "black"), w("rojo", "red"), w("gris", "grey"), w("plata", "silver"), w("azul", "blue"), w("verde", "green"), w("amarillo", "yellow")];
const CARS = [["Toyota", ["Yaris", "Corolla", "Hilux", "RAV4"]], ["Hyundai", ["Accent", "Tucson", "Elantra"]], ["Kia", ["Rio", "Picanto", "Sportage"]], ["Nissan", ["Sentra", "Versa", "Frontier"]], ["Chevrolet", ["Sail", "Spark"]], ["Suzuki", ["Swift", "Alto"]], ["Volkswagen", ["Gol", "Tiguan"]], ["Mitsubishi", ["L200", "Mirage"]]];
const LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ";
const TRADES = [w("frutas", "fruit"), w("verduras", "vegetables"), w("pescado", "fish"), w("carnes", "meat"), w("pollo", "chicken"), w("abarrotes", "groceries"), w("juguería", "juice bar"), w("menú", "set lunches"), w("flores", "flowers"), w("especias", "spices"), w("panadería", "bakery"), w("quesos", "cheese"), w("reparaciones", "repairs")];

const plate = (r) => `${r.pick(LETTERS)}${r.int(0, 9)}${r.pick(LETTERS)}-${r.int(100, 999)}`;
export const dirtyPlate = (p, r) => {
  const k = r.int(0, 3);
  return k === 0 ? p.toLowerCase() : k === 1 ? p.replace("-", "") : k === 2 ? p.replace("-", " ") : p.toLowerCase().replace("-", "");
};
const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
function dirtyName(n, r) {
  const k = r.int(0, 4);
  return k === 0 ? n.toLowerCase() : k === 1 ? n.toUpperCase() : k === 2 ? `${n} ` : k === 3 ? stripAccents(n) : n.replace(" ", "  ");
}

function generate() {
  const r = rng(20260313);
  const rows = Object.fromEntries(TABLES.map((t) => [t.es, []]));
  const add = (table, row) => { rows[table].push(row); return row; };

  const people = [];
  const usedPhones = new Set();
  const phone = () => { let p; do p = `9${r.int(10000000, 99999999)}`; while (usedPhones.has(p)); usedPhones.add(p); return p; };
  for (let id = 1; id <= 1200; id++) {
    const female = r.chance(0.5);
    const name = `${r.pick(female ? FIRST_F : FIRST_M)} ${r.pick(SURNAMES)} ${r.pick(SURNAMES)}`;
    const p = {
      id, nombre: r.chance(0.05) ? dirtyName(name, r) : name, dni: String(r.int(10000000, 79999999)),
      distrito: r.chance(0.02) ? null : r.chance(0.18) ? "Surquillo" : r.pick(DISTRICTS), telefono: r.chance(0.08) ? null : phone(),
      nacimiento: `${r.int(1950, 2007)}-${pad(r.int(1, 12))}-${pad(r.int(1, 28))}`, ocupacion: r.chance(0.06) ? null : r.pick(OCCUPATIONS),
      altura_cm: female ? r.int(146, 176) : r.int(155, 190),
    };
    people.push(add("personas", p));
  }
  const byJob = (es) => people.filter((p) => p.ocupacion && p.ocupacion.es === es);

  let vid = 0;
  for (const p of people) {
    if (!r.chance(0.55)) continue;
    const [make, models] = r.pick(CARS);
    add("vehiculos", { id: ++vid, placa: plate(r), persona_id: p.id, marca: make, modelo: r.pick(models), color: r.chance(0.04) ? null : r.pick(COLORS), anio: r.int(2004, 2025) });
  }
  let lid = 0;
  for (const p of people) {
    if (!r.chance(0.62)) continue;
    const y = r.int(2014, 2025);
    add("licencias", { id: ++lid, persona_id: p.id, categoria: r.pick(["A-I", "A-I", "A-I", "A-IIa", "A-IIb", "A-IIIa"]), emitida: `${y}-${pad(r.int(1, 12))}-${pad(r.int(1, 28))}`, vence: `${y + r.pick([5, 8, 10])}-${pad(r.int(1, 12))}-${pad(r.int(1, 28))}`, puntos: r.chance(0.7) ? 0 : r.int(5, 100) });
  }

  const merchants = byJob("comerciante");
  for (let n = 1; n <= 120; n++) {
    const owner = merchants[n % merchants.length];
    const trade = r.pick(TRADES);
    add("puestos", { id: n, numero: n, nombre: w(`Puesto ${n}`, `Stall ${n}`), rubro: trade, persona_id: owner.id, pasillo: "ABCDEF"[Math.floor((n - 1) / 20)] });
  }

  const CAMS = [
    ["CAM-SUR-01", "Surquillo", w("Av. Paseo de la República con Av. Ricardo Palma", "Av. Paseo de la República at Av. Ricardo Palma")],
    ["CAM-SUR-02", "Surquillo", w("Av. Ricardo Palma, frente a la Puerta 2 del mercado", "Av. Ricardo Palma, opposite the market's Gate 2")],
    ["CAM-SUR-03", "Surquillo", w("Jr. Narciso de la Colina, frente a la Puerta 3 del mercado", "Jr. Narciso de la Colina, opposite the market's Gate 3")],
    ["CAM-SUR-04", "Surquillo", w("Av. Angamos Este con Av. Tomás Marsano", "Av. Angamos Este at Av. Tomás Marsano")],
    ["CAM-MIR-01", "Miraflores", w("Óvalo de Miraflores", "Miraflores roundabout")],
    ["CAM-MIR-02", "Miraflores", w("Av. Larco con Av. Benavides", "Av. Larco at Av. Benavides")],
    ["CAM-MIR-03", "Miraflores", w("Malecón de la Reserva, bajada Balta", "Malecón de la Reserva, Balta slope")],
    ["CAM-BAR-01", "Barranco", w("Av. Grau con Av. Bolognesi", "Av. Grau at Av. Bolognesi")],
    ["CAM-BAR-02", "Barranco", w("Puente de los Suspiros", "Bridge of Sighs")],
    ["CAM-SBO-01", "San Borja", w("Av. Javier Prado con Av. Aviación", "Av. Javier Prado at Av. Aviación")],
    ["CAM-SBO-02", "San Borja", w("Av. San Luis con Av. San Borja Norte", "Av. San Luis at Av. San Borja Norte")],
    ["CAM-SIS-01", "San Isidro", w("Av. Javier Prado con Av. Arequipa", "Av. Javier Prado at Av. Arequipa")],
    ["CAM-SUC-01", "Surco", w("Av. Primavera con Av. Velasco Astete", "Av. Primavera at Av. Velasco Astete")],
    ["CAM-SUC-02", "Surco", w("Av. Benavides con Panamericana Sur", "Av. Benavides at Panamericana Sur")],
    ["CAM-LIN-01", "Lince", w("Av. Arequipa con Av. Risso", "Av. Arequipa at Av. Risso")],
    ["CAM-LVI-01", "La Victoria", w("Gamarra, Jr. Gamarra con Av. Aviación", "Gamarra, Jr. Gamarra at Av. Aviación")],
    ["CAM-CHO-01", "Chorrillos", w("Av. Huaylas con Av. Defensores del Morro", "Av. Huaylas at Av. Defensores del Morro")],
    ["CAM-RIM-01", "Rímac", w("Puente Trujillo", "Trujillo Bridge")],
    ["CAM-JMA-01", "Jesús María", w("Campo de Marte, Av. Salaverry", "Campo de Marte, Av. Salaverry")],
    ["CAM-SMI-01", "San Miguel", w("Av. La Marina con Av. Universitaria", "Av. La Marina at Av. Universitaria")],
    ["CAM-CAL-01", "Callao", w("Av. Faucett, entrada al aeropuerto", "Av. Faucett, airport entrance")],
    ["CAM-ATE-01", "Ate", w("Carretera Central, km 3", "Carretera Central, km 3")],
    ["CAM-LOL-01", "Los Olivos", w("Av. Carlos Izaguirre con Panamericana Norte", "Av. Carlos Izaguirre at Panamericana Norte")],
    ["CAM-SJL-01", "San Juan de Lurigancho", w("Av. Próceres de la Independencia, estación Los Jardines", "Av. Próceres de la Independencia, Los Jardines station")],
  ];
  CAMS.forEach(([codigo, distrito, ubicacion], i) => add("camaras", { id: i + 1, codigo, distrito, ubicacion }));

  // Market swipes: owners open and close, suppliers come and go, the cleaning crew works at night.
  const swipe = (persona_id, puerta, momento, sentido) => add("ingresos_mercado", { id: 0, persona_id, puerta, momento, sentido: sentido === "in" ? w("entrada", "in") : w("salida", "out") });
  const owners = [...new Set(rows.puestos.map((p) => p.persona_id))];
  const suppliers = byJob("proveedor").slice(0, 45);
  const cleaners = byJob("limpieza").slice(0, 14);
  for (let day = 1; day <= 31; day++) {
    for (const o of owners) {
      if (r.chance(0.12)) continue;
      swipe(o, r.pick([1, 1, 2, 3]), stamp(day, r.int(5, 7), r.int(0, 59), r.int(0, 59)), "in");
      swipe(o, r.pick([1, 2, 2, 3]), stamp(day, r.int(17, 19), r.int(0, 59), r.int(0, 59)), "out");
    }
    for (const s of suppliers) {
      if (!r.chance(0.3)) continue;
      const night = r.chance(0.25);
      const h = night ? r.int(20, 21) : r.int(4, 10);
      const g = night ? 3 : r.pick([1, 2, 3]);
      swipe(s.id, g, stamp(day, h, r.int(0, 59), r.int(0, 59)), "in");
      swipe(s.id, g, stamp(day, night ? r.int(21, 23) : h + 1, r.int(0, 59), r.int(0, 59)), "out");
    }
    for (const c of cleaners) {
      if (r.chance(0.15)) continue;
      swipe(c.id, 3, stamp(day, 20, r.int(0, 50), r.int(0, 59)), "in");
      swipe(c.id, 3, stamp(day, 23, r.int(35, 59), r.int(0, 59)), "out");
    }
  }

  const plates = rows.vehiculos.map((v) => v.placa);
  for (let i = 0; i < 6000; i++) {
    const p = r.pick(plates);
    const local = stamp(r.int(1, 31), r.int(5, 23), r.int(0, 59), r.int(0, 59));
    add("avistamientos", { id: 0, camara_id: r.int(1, CAMS.length), placa: r.chance(0.16) ? dirtyPlate(p, r) : p, momento_utc: toUtc(local) });
  }

  const phones = people.filter((p) => p.telefono).map((p) => p.telefono);
  for (let i = 0; i < 5000; i++) {
    const a = r.pick(phones);
    let b = r.pick(phones);
    if (b === a) b = phones[(phones.indexOf(a) + 1) % phones.length];
    add("llamadas", { id: 0, origen: a, destino: b, inicio: stamp(r.int(1, 31), r.int(6, 23), r.int(0, 59), r.int(0, 59)), duracion_s: r.chance(0.15) ? 0 : r.int(5, 1800) });
  }
  const NOTES = [w("menú", "lunch"), w("pasaje", "bus fare"), w("polla del partido", "match pool"), w("cuota de la junta", "savings-club share"), w("taxi", "taxi"), w("almuerzo", "lunch"), w("préstamo", "loan"), w("cumpleaños", "birthday"), w("luz y agua", "utilities"), w("gaseosas", "soft drinks"), w("alquiler", "rent")];
  for (let i = 0; i < 6000; i++) {
    const a = r.pick(phones);
    let b = r.pick(phones);
    if (b === a) b = phones[(phones.indexOf(a) + 7) % phones.length];
    add("transferencias", { id: 0, de_telefono: a, a_telefono: b, monto: Math.round(r.pick([r.int(1, 40), r.int(5, 120), r.int(50, 600)]) * (r.chance(0.3) ? 1.5 : 1) * 10) / 10, momento: stamp(r.int(1, 31), r.int(6, 23), r.int(0, 59), r.int(0, 59)), mensaje: r.chance(0.3) ? null : r.pick(NOTES) });
  }

  const KINDS = [
    [w("robo", "theft"), [w("Me arrancharon el celular al bajar de la combi.", "Someone snatched my phone as I got off the minibus."), w("Se llevaron la bicicleta que estaba con candado en la puerta.", "They took the bike that was locked at the door."), w("Desapareció la caja registradora de la bodega.", "The till disappeared from the corner shop.")]],
    [w("ruido", "noise"), [w("Fiesta con parlantes hasta las 3 de la mañana.", "A party with speakers until 3 a.m."), w("Un perro ladra toda la noche en la azotea de al lado.", "A dog barks all night on the roof next door.")]],
    [w("choque", "crash"), [w("Una mototaxi chocó un auto estacionado y se fue.", "A motorcycle taxi hit a parked car and drove off."), w("Choque leve en el cruce, sin heridos.", "A minor crash at the junction, nobody hurt.")]],
    [w("estafa", "fraud"), [w("Me pidieron un Yape adelantado por un celular que nunca llegó.", "They asked for a Yape payment up front for a phone that never arrived."), w("Llamaron diciendo que eran del banco y pidieron mi clave.", "Someone called pretending to be the bank and asked for my PIN.")]],
    [w("pérdida", "lost"), [w("Perdí mi DNI en el mercado.", "I lost my ID card at the market."), w("Se me cayó la billetera en el bus.", "I dropped my wallet on the bus.")]],
  ];
  for (let i = 0; i < 300; i++) {
    const [tipo, texts] = r.pick(KINDS);
    const d = r.chance(0.3) ? "Surquillo" : r.pick(DISTRICTS);
    add("denuncias", { id: 0, fecha: `2026-03-${pad(r.int(1, 31))}`, hora: `${pad(r.int(0, 23))}:${pad(r.int(0, 59))}`, distrito: d, tipo, lugar: d === "Surquillo" && r.chance(0.3) ? w("Mercado N.º 1", "Market No. 1") : w("Vía pública", "Street"), descripcion: r.pick(texts), denunciante_id: r.int(1, 1200) });
  }

  const INDUSTRIES = [w("logística", "logistics"), w("robótica", "robotics"), w("alimentos", "food"), w("textil", "textiles"), w("construcción", "construction"), w("software", "software"), w("transporte", "transport"), w("repuestos", "spare parts")];
  const COMPANY = ["Andina", "Rímac", "Pacífico", "Inca", "Los Andes", "Costa Verde", "El Sol", "Santa Rosa", "Chasqui", "Pachacámac", "Huascarán", "Misti", "Titicaca", "Amazonas", "Moche", "Nazca"];
  for (let i = 1; i <= 60; i++) {
    const ind = r.pick(INDUSTRIES);
    add("empresas", { id: i, ruc: `20${r.int(100000000, 999999999)}`, razon_social: `Grupo ${COMPANY[i % COMPANY.length]} ${["S.A.C.", "E.I.R.L.", "S.A."][i % 3]}${i > COMPANY.length ? ` ${Math.ceil(i / COMPANY.length)}` : ""}`, rubro: ind, distrito: r.pick(DISTRICTS) });
  }
  const ROLES = [w("asistente", "assistant"), w("operario", "operator"), w("supervisora", "supervisor"), w("analista", "analyst"), w("gerente", "manager"), w("técnico", "technician"), w("repartidor", "courier")];
  let eid = 0;
  for (const p of people) {
    if (!r.chance(0.72)) continue;
    const jobs = r.chance(0.3) ? 2 : 1;
    let y = r.int(2012, 2022);
    for (let k = 0; k < jobs; k++) {
      const last = k === jobs - 1;
      const until = last && r.chance(0.75) ? null : `${y + r.int(1, 3)}-${pad(r.int(1, 12))}-${pad(r.int(1, 28))}`;
      add("empleos", { id: ++eid, persona_id: p.id, empresa_id: r.int(1, 60), cargo: r.pick(ROLES), desde: `${y}-${pad(r.int(1, 12))}-${pad(r.int(1, 28))}`, hasta: until, sueldo: r.int(1130, 9500) });
      y = until ? Number(until.slice(0, 4)) : y + 1;
    }
  }
  const EVENTS = [w("Feria gastronómica", "Food fair"), w("Concierto de cumbia", "Cumbia concert"), w("Partido de vóley", "Volleyball match"), w("Feria de robótica", "Robotics fair"), w("Misa de domingo", "Sunday mass"), w("Cumpleaños", "Birthday party"), w("Pollada", "Chicken fundraiser")];
  for (let i = 1; i <= 40; i++) {
    const d = r.pick(DISTRICTS);
    const day = r.int(1, 31), h = r.int(9, 20);
    add("eventos", { id: i, nombre: r.pick(EVENTS), lugar: w(`Local comunal de ${d}`, `${d} community hall`), distrito: d, inicio: stamp(day, h, 0), fin: stamp(day, Math.min(h + r.int(2, 5), 23), 30) });
  }
  let aid = 0;
  for (let i = 0; i < 1500; i++) {
    const ev = r.pick(rows.eventos);
    add("asistencias", { id: ++aid, evento_id: ev.id, persona_id: r.int(1, 1200), momento: shift(ev.inicio, r.int(-20, 90)) });
  }
  const BOTS = [["Chasqui", "Loop T-1", w("detective asistente de Loop", "Loop's assistant detective")], ["Wayra", "Loop T-2", w("reparto en Surquillo", "deliveries in Surquillo")], ["Tika", "Loop T-2", w("vigilancia nocturna", "night watch")], ["Kusi", "Loop T-3", w("cocina", "kitchen")], ["Quilla", "Loop P-1", w("reparto en el Callao", "deliveries in Callao")], ["Illa", "Andina R4", w("inventario", "stocktaking")], ["Sumaq", "Andina R4", w("limpieza", "cleaning")], ["Ronco", "Pacífico M2", w("balanza del mercado", "market scales")], ["Piqui", "Pacífico M2", w("balanza del mercado", "market scales")], ["Tumi", "Pacífico M2", w("balanza del mercado", "market scales")], ["Pituco", "Loop T-1", w("reparto en Barranco", "deliveries in Barranco")], ["Mishki", "Andina R5", w("panadería", "bakery")], ["Inti", "Andina R5", w("seguridad", "security")], ["Kallpa", "Misti X", w("carga pesada", "heavy lifting")], ["Puma", "Misti X", w("carga pesada", "heavy lifting")]];
  for (let i = 0; i < 30; i++) {
    const [nombre, modelo, trabajo] = BOTS[i] || [`${["Rumi", "Tayta", "Yaku", "Nina", "Killa"][i % 5]}-${i}`, r.pick(["Andina R4", "Pacífico M2", "Misti X"]), r.pick([w("reparto", "deliveries"), w("limpieza", "cleaning"), w("seguridad", "security")])];
    add("robots", { id: i + 1, nombre, modelo, dueno_id: r.int(1, 1200), trabajo, fabricado: `${r.int(2019, 2025)}-${pad(r.int(1, 12))}-${pad(r.int(1, 28))}` });
  }
  const SENSORS = [["bateria", "battery", 20, 100], ["temperatura", "temperature", 28, 55], ["giroscopio", "gyroscope", -2, 2]];
  for (let bot = 1; bot <= 12; bot++) {
    for (let day = 10; day <= 16; day++) for (let h = 0; h < 24; h += 2) for (const [es, en, lo, hi] of SENSORS) {
      const v = Math.round((lo + r.next() * (hi - lo)) * 100) / 100;
      add("lecturas", { id: 0, robot_id: bot, sensor: w(es, en), momento: stamp(day, h, r.int(0, 59), r.int(0, 59)), valor: v, datos: `{"firmware":"2.${r.int(3, 5)}.${r.int(0, 9)}","ok":${r.chance(0.97)}}` });
    }
  }

  const ctx = { r, rows, add, people, phone, swipe, stamp, toUtc, shift, w, pad, dirtyPlate };
  for (const plot of PLOTS) plot(ctx);

  // Double swipes: the reader sometimes counts a card twice, a few seconds apart.
  const twice = rows.ingresos_mercado.filter((x) => !x.planted && r.chance(0.02)).map((x) => ({ ...x, momento: x.momento.slice(0, 17) + pad(Math.min(59, Number(x.momento.slice(17)) + r.int(1, 4))) }));
  rows.ingresos_mercado.push(...twice);
  for (const t of ["ingresos_mercado", "avistamientos", "llamadas", "transferencias", "denuncias", "lecturas", "entrevistas"]) {
    const key = { ingresos_mercado: "momento", avistamientos: "momento_utc", llamadas: "inicio", transferencias: "momento", denuncias: "fecha", lecturas: "momento", entrevistas: "fecha" }[t];
    rows[t].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
    rows[t].forEach((x, i) => { x.id = i + 1; });
  }
  return rows;
}

let ROWS = null;
export const worldRows = () => (ROWS ||= generate());

// Fills an empty sql.js database with the world, in one language.
export function fillWorld(db, lang = "es") {
  const rows = worldRows();
  db.exec(createSql(lang));
  db.exec("BEGIN");
  for (const t of TABLES) {
    const cols = t.cols.map((c) => c.es);
    const st = db.prepare(`INSERT INTO ${tableName(t, lang)} (${t.cols.map((c) => colName(c, lang)).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`);
    for (const row of rows[t.es]) st.run(cols.map((c) => { const v = say(row[c], lang); return v === undefined ? null : v; }));
    st.free();
  }
  db.exec("COMMIT");
  return db;
}
