// Case 2, "La red de los pagos" (sessions 5–8). In March 2026 a ring sells phones and e-scooters on
// Marketplace that never arrive: each victim pays an advance by Yape to a "cobrador" (three people and
// one unregistered chip), who forwards 90 % within a couple of hours to Milagros, the cashier, who pays
// the leader, the manager of a front company in Gamarra. The trail, session by session, is in docs/sql.md.
export const CAST = {
  sonia: 118, walter: 164, ximena: 207, edwin: 259, pilar: 286, raul: 318, gabriela: 357, ivan: 441, daniela: 489,
  ernesto: 512, nelly: 568, marco: 603, maribel: 655, hugo: 688,
  kevin: 742, brenda: 779, jhonatan: 815, milagros: 846, percy: 873, gustavo: 934, teodoro: 961, rocio: 987,
};
export const CHIP = "951207384";

export function pagos(ctx) {
  const { rows, add, people, stamp, shift, w } = ctx;
  const ids = Object.values(CAST);
  const used = new Set(people.map((p) => p.telefono).filter(Boolean));
  const spare = ["947310582", "936584102", "961845730", "958402617"].filter((p) => !used.has(p));
  const person = (id, fields) => {
    const p = people[id - 1];
    Object.assign(p, fields);
    if (!p.telefono) p.telefono = spare.shift();
  };
  const job = (es, en) => w(es, en);
  if (used.has(CHIP)) throw new Error("pagos: the chip's number is taken");

  person(CAST.sonia, { nombre: "Sonia Huamán Ríos", distrito: "Surquillo", ocupacion: job("docente", "teacher") });
  person(CAST.walter, { nombre: "Walter Mendoza Quispe", distrito: "Los Olivos", ocupacion: job("chofer", "driver") });
  person(CAST.ximena, { nombre: "Ximena Flores Aguilar", distrito: "San Borja", ocupacion: job("estudiante", "student") });
  person(CAST.edwin, { nombre: "Edwin Condori Pumacayo", distrito: "Comas", ocupacion: job("electricista", "electrician") });
  person(CAST.pilar, { nombre: "Pilar Castillo Ramos", distrito: "Lince", ocupacion: job("enfermera", "nurse") });
  person(CAST.raul, { nombre: "Raúl Espinoza Tello", distrito: "Chorrillos", ocupacion: job("mecánico", "mechanic") });
  person(CAST.gabriela, { nombre: "Gabriela Vargas Silva", distrito: "Miraflores", ocupacion: job("contadora", "accountant") });
  person(CAST.ivan, { nombre: "Iván Choque Medina", distrito: "San Juan de Lurigancho", ocupacion: job("estudiante", "student") });
  person(CAST.daniela, { nombre: "Daniela Romero Cruz", distrito: "Jesús María", ocupacion: job("programadora", "programmer") });
  person(CAST.ernesto, { nombre: "Ernesto Cusi Yupanqui", distrito: "Ate", ocupacion: job("panadero", "baker") });
  person(CAST.nelly, { nombre: "Nelly Gutiérrez Soto", distrito: "Breña", ocupacion: job("costurera", "seamstress") });
  person(CAST.marco, { nombre: "Marco Benavides Lozano", distrito: "Rímac", ocupacion: job("taxista", "taxi driver") });
  person(CAST.maribel, { nombre: "Maribel Montes Ugarte", distrito: "Callao", ocupacion: job("cocinero", "cook") });
  person(CAST.hugo, { nombre: "Hugo Ramos Ticona", distrito: "San Miguel", ocupacion: job("jubilado", "retired") });
  person(CAST.kevin, { nombre: "Kevin Rojas Palomino", distrito: "La Victoria", ocupacion: job("repartidor", "courier"), nacimiento: "2004-02-17" });
  person(CAST.brenda, { nombre: "Brenda Salazar Cusi", distrito: "La Victoria", ocupacion: job("repartidor", "courier"), nacimiento: "2005-07-09" });
  person(CAST.jhonatan, { nombre: "Jhonatan Ugarte Llanos", distrito: "San Juan de Lurigancho", ocupacion: job("chofer", "driver"), nacimiento: "2002-11-30" });
  person(CAST.milagros, { nombre: "Milagros Tello Benavides", distrito: "Surquillo", ocupacion: job("asistente", "assistant"), nacimiento: "1996-04-03" });
  person(CAST.percy, { nombre: "Percy Tello Benavides", distrito: "Surquillo", ocupacion: job("taxista", "taxi driver"), nacimiento: "1999-09-12" });
  person(CAST.gustavo, { nombre: "Gustavo Alvarado Zevallos", distrito: "San Borja", ocupacion: job("comerciante", "merchant"), nacimiento: "1983-01-25" });
  person(CAST.teodoro, { nombre: "Teodoro Huanca Cruz", distrito: "Surquillo", ocupacion: job("jubilado", "retired"), nacimiento: "1954-06-08" });
  person(CAST.rocio, { nombre: "Rocío Medina Huanca", distrito: "La Victoria", ocupacion: job("asistente", "assistant") });
  const tel = (id) => people[id - 1].telefono;

  const ring = new Set([CAST.kevin, CAST.brenda, CAST.jhonatan, CAST.milagros].map(tel));
  rows.transferencias = rows.transferencias.filter((t) => !ring.has(t.de_telefono) && !ring.has(t.a_telefono));
  rows.llamadas = rows.llamadas.filter((c) => !ring.has(c.origen) && !ring.has(c.destino));
  rows.denuncias = rows.denuncias.filter((d) => !ids.includes(d.denunciante_id));
  const pay = (from, to, monto, ts, mensaje = null) => add("transferencias", { id: 0, de_telefono: typeof from === "number" ? tel(from) : from, a_telefono: typeof to === "number" ? tel(to) : to, monto, momento: ts, mensaje });

  // The advances. [victim, mule, amount, what, day, h, m, reported on]
  const VICTIMS = [
    [CAST.sonia, CAST.brenda, 300, ["iPhone 13", "iPhone 13"], 3, 19, 12, "2026-03-05"],
    [CAST.walter, CAST.kevin, 450, ["scooter", "scooter"], 4, 10, 40, "2026-03-06"],
    [CAST.ximena, CAST.kevin, 380, ["Samsung S23", "Samsung S23"], 5, 21, 5, "2026-03-07"],
    [CAST.edwin, CHIP, 500, ["scooter", "scooter"], 6, 13, 30, "2026-03-09"],
    [CAST.pilar, CAST.jhonatan, 420, ["iPhone 14", "iPhone 14"], 7, 16, 20, "2026-03-10"],
    [CAST.raul, CAST.kevin, 350, ["scooter eléctrico", "e-scooter"], 8, 11, 0, "2026-03-11"],
    [CAST.gabriela, CAST.brenda, 250, ["Xiaomi", "Xiaomi"], 9, 20, 45, "2026-03-12"],
    [CAST.ivan, CHIP, 320, ["iPhone 13", "iPhone 13"], 10, 18, 10, "2026-03-16"],
    [CAST.daniela, CAST.jhonatan, 480, ["scooter", "scooter"], 11, 9, 25, "2026-03-17"],
    [CAST.ernesto, CAST.kevin, 400, ["scooter", "scooter"], 12, 12, 15, null],
    [CAST.nelly, CAST.brenda, 280, ["Samsung A54", "Samsung A54"], 15, 19, 30, null],
    [CAST.marco, CHIP, 600, ["iPhone 15", "iPhone 15"], 16, 10, 5, null],
    [CAST.maribel, CAST.jhonatan, 260, ["scooter", "scooter"], 17, 15, 50, null],
    [CAST.hugo, CHIP, 350, ["iPhone 12", "iPhone 12"], 18, 22, 10, null],
  ];
  const HOP = [65, 92, 48, 131, 77, 104, 55, 86, 119, 71, 98, 62, 140, 83];
  const DONE = [w("listo", "done"), null, w("ok", "ok"), null, w("ya", "sent"), null, null];
  VICTIMS.forEach(([victim, mule, amount, [es, en], day, h, m, reported], i) => {
    const ts = stamp(day, h, m, (i * 17) % 60);
    pay(victim, mule, amount, ts, w(`adelanto ${es}`, `deposit ${en}`));
    pay(mule, CAST.milagros, Math.round(amount * 0.9), shift(ts, HOP[i]), DONE[i % DONE.length]);
    if (!reported) return;
    const p = people[victim - 1];
    const thing = { es: `un ${es}`, en: /^(e-|i)/.test(en) ? `an ${en}` : `a ${en}` };
    const price = Math.round(amount * 3 / 100) * 100;
    add("denuncias", { id: 0, fecha: reported, hora: ["09:15", "10:40", "16:05", "11:30", "18:20", "08:50", "12:10", "17:35", "10:05"][i], distrito: p.distrito, tipo: w("estafa", "fraud"), lugar: w("Internet (Marketplace)", "Online (Marketplace)"), descripcion: i === 0 ? w(
      `Vi en Marketplace ${thing.es} a S/ ${price}. El vendedor me pidió S/ ${amount} de adelanto por Yape para separarlo. Le pagué el ${day} de marzo y nunca más contestó. En el Yape salía "Brenda S.".`,
      `I saw ${thing.en} on Marketplace for S/ ${price}. The seller asked for a S/ ${amount} deposit by Yape to hold it. I paid on ${day} March and they never answered again. Yape showed "Brenda S.".`) : w(
      `Vi en Marketplace ${thing.es} a S/ ${price}. El vendedor me pidió S/ ${amount} de adelanto por Yape para separarlo. Le pagué el ${day} de marzo y nunca más contestó.`,
      `I saw ${thing.en} on Marketplace for S/ ${price}. The seller asked for a S/ ${amount} deposit by Yape to hold it. I paid on ${day} March and they never answered again.`), denunciante_id: victim });
  });

  // The cashier's own life, and where the money goes next.
  const others = people.filter((p) => p.telefono && !ids.includes(p.id) && !ring.has(p.telefono)).map((p) => p.telefono);
  const friend = (k) => others[(k * 37) % others.length];
  pay(CAST.milagros, CAST.teodoro, 900, stamp(1, 9, 2, 40), w("alquiler marzo", "March rent"));
  [[2, 13, 10, 15, "menú"], [4, 8, 5, 3.5, "pasaje"], [6, 13, 40, 15, "menú"], [10, 19, 55, 42, "cumpleaños"], [12, 7, 50, 3.5, "pasaje"], [17, 13, 5, 16, "menú"], [21, 18, 30, 60, "luz y agua"], [24, 12, 45, 15, "menú"], [26, 20, 10, 35, "gaseosas"]].forEach(([d, h, m, amount, note], k) => {
    const en = { "menú": "lunch", pasaje: "bus fare", "cumpleaños": "birthday", "luz y agua": "utilities", gaseosas: "soft drinks" }[note];
    pay(CAST.milagros, friend(k + 1), amount, stamp(d, h, m, 12), w(note, en));
  });
  pay(CAST.milagros, CAST.gustavo, 1800, stamp(9, 21, 34, 5), w("mercadería", "stock"));
  pay(CAST.milagros, CAST.gustavo, 1900, stamp(16, 21, 12, 48), null);
  pay(CAST.milagros, CAST.gustavo, 600, stamp(19, 8, 3, 20), w("lo de la semana", "this week's"));
  pay(CAST.milagros, CAST.percy, 1200, stamp(19, 17, 40, 2), w("préstamo mototaxi", "motorcycle-taxi loan"));
  pay(CAST.percy, CAST.milagros, 100, stamp(31, 18, 5, 0), w("primera cuota", "first instalment"));
  for (const [k, d] of [[3, 1], [5, 1], [8, 2], [11, 2], [14, 3]]) pay(friend(k + 20), CAST.teodoro, 850 + k * 10, stamp(d, 10 + k % 8, k * 4, 0), w("alquiler marzo", "March rent"));
  [[2, 11, 20, 20, "pasaje"], [7, 14, 0, 12, "menú"], [13, 9, 30, 25, "gaseosas"], [22, 16, 45, 14, "menú"]].forEach(([d, h, m, amount, note], k) => {
    const en = { "menú": "lunch", pasaje: "bus fare", gaseosas: "soft drinks" }[note];
    for (const mule of [CAST.kevin, CAST.brenda, CAST.jhonatan]) pay(mule, friend(k * 3 + mule), amount, stamp(d, h, (m + mule) % 60, 30), w(note, en));
  });

  const call = (a, b, ts, s) => add("llamadas", { id: 0, origen: typeof a === "number" ? tel(a) : a, destino: typeof b === "number" ? tel(b) : b, inicio: ts, duracion_s: s });
  call(CAST.kevin, CAST.milagros, stamp(4, 11, 2, 10), 48);
  call(CAST.milagros, CAST.kevin, stamp(4, 11, 40, 0), 95);
  call(CHIP, CAST.milagros, stamp(6, 14, 1, 33), 37);
  call(CAST.brenda, CAST.milagros, stamp(9, 21, 0, 5), 62);
  call(CAST.milagros, CAST.gustavo, stamp(9, 21, 36, 40), 121);
  call(CAST.jhonatan, CAST.milagros, stamp(11, 10, 30, 0), 25);
  call(CAST.milagros, CAST.jhonatan, stamp(11, 12, 5, 0), 70);
  call(CAST.milagros, CAST.gustavo, stamp(16, 21, 15, 2), 88);
  call(CAST.gustavo, CAST.milagros, stamp(16, 21, 52, 30), 240);
  call(CHIP, CAST.milagros, stamp(18, 23, 40, 9), 31);
  call(CAST.milagros, CAST.percy, stamp(19, 17, 30, 0), 300);

  const fid = Math.max(...rows.empresas.map((e) => e.id)) + 1;
  add("empresas", { id: fid, ruc: "20605518273", razon_social: "Importaciones Ccori S.A.C.", rubro: w("venta de celulares", "phone sales"), distrito: "La Victoria" });
  const crew = [CAST.kevin, CAST.brenda, CAST.jhonatan, CAST.milagros, CAST.gustavo, CAST.rocio, CAST.percy, CAST.teodoro];
  rows.empleos = rows.empleos.filter((e) => !crew.includes(e.persona_id));
  let eid = Math.max(...rows.empleos.map((e) => e.id));
  const hire = (persona_id, empresa_id, cargo, desde, hasta, sueldo) => add("empleos", { id: ++eid, persona_id, empresa_id, cargo, desde, hasta, sueldo });
  hire(CAST.gustavo, 23, w("vendedor", "salesman"), "2016-03-01", "2023-05-31", 3200);
  hire(CAST.gustavo, fid, w("gerente", "manager"), "2023-06-01", null, 6500);
  hire(CAST.rocio, fid, w("asistente", "assistant"), "2023-08-15", null, 1500);
  hire(CAST.milagros, fid, w("cajera", "cashier"), "2024-02-01", null, 1800);
  hire(CAST.kevin, 41, w("repartidor", "courier"), "2023-01-10", "2025-10-31", 1300);
  hire(CAST.kevin, fid, w("repartidor", "courier"), "2025-11-03", null, 1250);
  hire(CAST.brenda, fid, w("repartidor", "courier"), "2025-11-03", null, 1250);
  hire(CAST.jhonatan, 12, w("operario", "operator"), "2024-05-20", null, 1600);
  hire(CAST.percy, 7, w("repartidor", "courier"), "2021-03-01", "2025-12-31", 1400);

  const said = (persona_id, fecha, transcripcion) => add("entrevistas", { id: 0, persona_id, fecha, caso: "EST-0323", transcripcion });
  said(CAST.sonia, "2026-03-23", w(
    "El celular estaba bien barato, por eso me animé. El chico de Marketplace me dijo que lo tenía en Gamarra y que si no adelantaba se lo daba a otro. Le yapeé y me bloqueó a la media hora.",
    "The phone was really cheap, that's why I went for it. The guy on Marketplace said he had it in Gamarra and that if I didn't pay up front he'd give it to someone else. I sent the Yape and he blocked me half an hour later."));
  said(CAST.ernesto, "2026-03-24", w(
    "No denuncié porque me dio vergüenza, eran 400 soles. Me dijeron que el scooter lo entregaban en una tienda de celulares de Gamarra, pero nunca me dieron la dirección.",
    "I didn't report it because I was embarrassed, it was 400 soles. They said they'd hand the scooter over at a phone shop in Gamarra, but they never gave me the address."));
  said(CAST.milagros, "2026-03-25", w(
    "Kevin y Brenda son compañeros del trabajo. Me devolvían plata que les presté, nada más. Lo que le pago a mi jefe es mercadería que le compro para revender.",
    "Kevin and Brenda are workmates. They were paying back money I lent them, that's all. What I pay my boss is stock I buy from him to resell."));
  said(CAST.percy, "2026-03-25", w(
    "Mi hermana me prestó para la inicial de mi mototaxi. Ya le empecé a pagar. Yo no sé nada de celulares.",
    "My sister lent me the down payment for my motorcycle taxi. I've started paying her back. I don't know anything about phones."));
  said(CAST.teodoro, "2026-03-25", w(
    "Milagros me alquila un cuarto en Surquillo desde hace dos años. Paga puntual el primero de cada mes, como los otros inquilinos.",
    "Milagros has rented a room from me in Surquillo for two years. She pays on time on the first of every month, like the other tenants."));
  said(CAST.gustavo, "2026-03-26", w(
    "Soy gerente de una importadora seria, con RUC. Milagros trabaja conmigo y a veces me compra mercadería. Lo que hagan los chicos con sus celulares no es asunto mío.",
    "I manage a proper import business, registered and all. Milagros works for me and sometimes buys stock from me. Whatever the kids do with their phones is not my business."));
}
