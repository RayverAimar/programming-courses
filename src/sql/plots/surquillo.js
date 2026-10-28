// Case 1, "El giroscopio de Wayra" (sessions 1–4). The night of Friday 13 March 2026 someone took the
// gyroscope out of Wayra, a Loop robot charging at stall 47 of Surquillo Market No. 1.
// The trail, session by session, is in docs/sql.md.
export const CAST = {
  carmen: 58, marleny: 233, renzo: 731, lucia: 412, oscar: 905, fiorella: 1046, julio: 377, tito: 1129,
};

export function surquillo(ctx) {
  const { rows, add, people, phone, swipe, stamp, toUtc, w, r } = ctx;
  const person = (id, fields) => Object.assign(people[id - 1], fields);
  const job = (es, en) => w(es, en);

  person(CAST.carmen, { nombre: "Carmen Ríos Llanos", distrito: "Surquillo", ocupacion: job("técnico de robots", "robot technician"), telefono: phone(), altura_cm: 158 });
  person(CAST.marleny, { nombre: "Marleny Quispe Apaza", distrito: "Surquillo", ocupacion: job("vigilante", "security guard"), telefono: phone(), altura_cm: 154 });
  person(CAST.renzo, { nombre: "Renzo Huamaní Cárdenas", distrito: "La Victoria", ocupacion: job("proveedor", "supplier"), telefono: phone(), altura_cm: 181, nacimiento: "1994-08-21" });
  person(CAST.lucia, { nombre: "Lucía Paredes Soto", distrito: "Surquillo", ocupacion: job("comerciante", "merchant"), telefono: phone(), altura_cm: 162 });
  person(CAST.oscar, { nombre: "Óscar Ticona Mamani", distrito: "Villa El Salvador", ocupacion: job("limpieza", "cleaner"), telefono: phone(), altura_cm: 167 });
  person(CAST.fiorella, { nombre: "Fiorella Campos Rojas", distrito: "Surco", ocupacion: job("proveedor", "supplier"), telefono: phone(), altura_cm: 165 });
  person(CAST.julio, { nombre: "Julio Ccahuana Ríos", distrito: "Ate", ocupacion: job("proveedor", "supplier"), telefono: phone(), altura_cm: 176 });
  person(CAST.tito, { nombre: "Tito Vílchez Arias", distrito: "La Victoria", ocupacion: job("comerciante", "merchant"), telefono: phone(), altura_cm: 170 });
  const tel = (id) => people[id - 1].telefono;

  const others = rows.puestos.map((p) => p.persona_id).filter((id) => !Object.values(CAST).includes(id));
  for (const p of rows.puestos) if (Object.values(CAST).includes(p.persona_id)) p.persona_id = others[p.id % others.length];
  Object.assign(rows.puestos[46], { nombre: w("Loop", "Loop"), rubro: w("reparaciones", "repairs"), persona_id: CAST.carmen });
  Object.assign(rows.puestos[11], { nombre: w("Juguería Lucía", "Lucía's Juice Bar"), rubro: w("juguería", "juice bar"), persona_id: CAST.lucia });

  rows.vehiculos = rows.vehiculos.filter((v) => !Object.values(CAST).includes(v.persona_id));
  let vid = Math.max(...rows.vehiculos.map((v) => v.id));
  const car = (persona_id, placa, marca, modelo, color, anio) => add("vehiculos", { id: ++vid, placa, persona_id, marca, modelo, color, anio });
  car(CAST.renzo, "B7R-415", "Toyota", "Yaris", w("blanco", "white"), 2016);
  car(CAST.lucia, "C3M-208", "Kia", "Rio", w("blanco", "white"), 2019);
  car(CAST.fiorella, "F2T-664", "Hyundai", "Accent", w("rojo", "red"), 2018);
  car(CAST.julio, "D9K-731", "Nissan", "Versa", null, 2013);
  car(CAST.carmen, "A4P-902", "Suzuki", "Swift", w("azul", "blue"), 2021);

  // That night at gate 3 nobody but the five suspects goes out between 22:41 and 23:30.
  const quiet = (x) => {
    const day = x.momento.slice(0, 10);
    const t = x.momento.slice(11);
    const out = (x.sentido.es || x.sentido) === "salida";
    if (Object.values(CAST).includes(x.persona_id) && (day === "2026-03-13" || day === "2026-03-14")) return false;
    return !(day === "2026-03-13" && x.puerta === 3 && out && t >= "22:41:00" && t <= "23:30:59");
  };
  rows.ingresos_mercado = rows.ingresos_mercado.filter(quiet);
  const planted = (id, gate, ts, dir) => { swipe(id, gate, ts, dir).planted = true; };
  planted(CAST.carmen, 1, stamp(13, 6, 2, 11), "in");
  planted(CAST.carmen, 2, stamp(13, 19, 31, 40), "out");
  planted(CAST.lucia, 1, stamp(13, 6, 10, 2), "in");
  planted(CAST.marleny, 1, stamp(13, 19, 55, 18), "in");
  planted(CAST.oscar, 3, stamp(13, 20, 12, 44), "in");
  planted(CAST.fiorella, 3, stamp(13, 21, 40, 9), "in");
  planted(CAST.renzo, 3, stamp(13, 21, 58, 3), "in");
  planted(CAST.julio, 3, stamp(13, 22, 5, 37), "in");
  planted(CAST.renzo, 3, stamp(13, 22, 46, 12), "out");
  planted(CAST.oscar, 3, stamp(13, 22, 58, 40), "out");
  planted(CAST.fiorella, 3, stamp(13, 23, 4, 5), "out");
  planted(CAST.lucia, 3, stamp(13, 23, 12, 51), "out");
  planted(CAST.julio, 3, stamp(13, 23, 21, 30), "out");
  planted(CAST.marleny, 1, stamp(14, 6, 5, 2), "out");
  planted(CAST.carmen, 1, stamp(14, 6, 14, 55), "in");
  planted(CAST.lucia, 2, stamp(14, 6, 31, 20), "in");

  const seen = (cam, placa, local) => add("avistamientos", { id: 0, camara_id: cam, placa, momento_utc: toUtc(local) });
  seen(3, "b7r415", stamp(13, 22, 48, 31));
  seen(3, "F2T-664", stamp(13, 23, 6, 10));
  seen(3, "C3M-208", stamp(13, 23, 14, 2));
  seen(3, "D9K 731", stamp(13, 23, 23, 47));
  seen(16, "B7R-415", stamp(13, 23, 9, 26));
  seen(16, "b7r-415", stamp(14, 10, 12, 8));
  seen(1, "c3m208", stamp(13, 23, 16, 40));
  seen(13, "F2T664", stamp(13, 23, 24, 15));
  seen(22, "D9K-731", stamp(13, 23, 58, 3));

  const tels = people.filter((p) => p.telefono && !Object.values(CAST).includes(p.id)).map((p) => p.telefono);
  const call = (a, b, ts, s) => add("llamadas", { id: 0, origen: tel(a), destino: tel(b), inicio: ts, duracion_s: s });
  call(CAST.renzo, CAST.tito, stamp(12, 20, 10, 5), 184);
  call(CAST.renzo, CAST.tito, stamp(13, 16, 2, 41), 75);
  call(CAST.renzo, CAST.tito, stamp(13, 22, 52, 18), 41);
  call(CAST.tito, CAST.renzo, stamp(14, 8, 30, 0), 302);
  call(CAST.marleny, CAST.carmen, stamp(14, 6, 16, 30), 95);
  add("llamadas", { id: 0, origen: tel(CAST.lucia), destino: r.pick(tels), inicio: stamp(13, 23, 30, 12), duracion_s: 220 });

  const pay = (a, b, amount, ts, note) => add("transferencias", { id: 0, de_telefono: typeof a === "number" ? tel(a) : a, a_telefono: typeof b === "number" ? tel(b) : b, monto: amount, momento: ts, mensaje: note });
  pay(CAST.tito, CAST.renzo, 450, stamp(14, 11, 5, 3), w("repuesto", "spare part"));
  pay(CAST.tito, CAST.renzo, 500, stamp(14, 18, 40, 51), null);
  pay(CAST.tito, CAST.renzo, 400, stamp(15, 9, 12, 30), w("lo que faltaba", "the rest"));
  pay(CAST.tito, r.pick(tels), 80, stamp(11, 12, 0, 4), w("parlante", "speaker"));
  pay(CAST.tito, r.pick(tels), 120, stamp(14, 16, 22, 9), w("celular usado", "used phone"));
  pay(CAST.tito, r.pick(tels), 60, stamp(16, 10, 47, 33), null);
  pay(CAST.renzo, r.pick(tels), 15, stamp(12, 13, 20, 0), w("menú", "lunch"));
  pay(CAST.renzo, r.pick(tels), 35.5, stamp(14, 20, 5, 12), w("gaseosas", "soft drinks"));
  pay(CAST.lucia, r.pick(tels), 220, stamp(14, 9, 0, 0), w("fruta del sábado", "Saturday's fruit"));
  pay(CAST.julio, CAST.lucia, 18, stamp(13, 21, 2, 0), w("jugos", "juices"));

  const report = (fecha, hora, distrito, tipo, lugar, descripcion, denunciante_id) => add("denuncias", { id: 0, fecha, hora, distrito, tipo, lugar, descripcion, denunciante_id });
  report("2026-03-14", "06:20", "Surquillo", w("robo", "theft"), w("Mercado N.º 1, puesto 47", "Market No. 1, stall 47"), w(
    "Al abrir el puesto 47 encontré a nuestro robot Wayra apagado y sin su giroscopio. La tapa estaba desatornillada con cuidado: fue alguien que sabía lo que hacía. Según el registro interno de Wayra, el giroscopio dejó de responder a las 22:41 del viernes. La vigilante de la noche, Marleny Quispe, dice que vio salir a alguien apurado por la Puerta 3.",
    "When I opened stall 47 I found our robot Wayra switched off and missing its gyroscope. The cover had been unscrewed carefully: someone who knew what they were doing. Wayra's internal log says the gyroscope stopped responding at 22:41 on Friday. The night guard, Marleny Quispe, says she saw someone leave in a hurry through Gate 3."), CAST.carmen);
  report("2026-03-14", "09:45", "Surquillo", w("robo", "theft"), w("Paradero de Av. Angamos", "Av. Angamos bus stop"), w("Me arrancharon el celular mientras esperaba el bus.", "Someone snatched my phone while I waited for the bus."), 640);
  report("2026-03-13", "23:50", "Surquillo", w("ruido", "noise"), w("Jr. Narciso de la Colina", "Jr. Narciso de la Colina"), w("Un auto salió chirriando llantas de la puerta del mercado.", "A car screeched off from the market gate."), 642);
  report("2026-03-14", "07:10", "Miraflores", w("robo", "theft"), w("Parque Kennedy", "Kennedy Park"), w("Se llevaron la batería de mi scooter eléctrico.", "They took my e-scooter's battery."), 900);

  const said = (persona_id, fecha, transcripcion) => add("entrevistas", { id: 0, persona_id, fecha, caso: "SUR-0314", transcripcion });
  said(CAST.carmen, "2026-03-14", w(
    "Cerré el puesto a las siete y media. Wayra se quedó cargando, como siempre. A las seis y cuarto lo encontré sin el giroscopio. Para sacarlo hay que saber: son cuatro tornillos de estrella y un conector que se rompe si jalas mal. Y no lo rompieron.",
    "I closed the stall at half past seven. Wayra stayed on charge, as always. At a quarter past six I found it without the gyroscope. You need to know what you're doing to take it out: four Phillips screws and a connector that breaks if you pull it wrong. And they didn't break it."));
  said(CAST.marleny, "2026-03-14", w(
    "Hago ronda cada media hora. Como a las once menos cuarto vi salir apurado a alguien por la Puerta 3, con una caja de herramientas. No le vi la cara, tenía capucha. Afuera se subió a un auto blanco; la placa no la vi.",
    "I do a round every half hour. At about a quarter to eleven I saw someone hurry out through Gate 3 with a toolbox. I didn't see their face, they had a hood up. Outside they got into a white car; I didn't see the plate."));
  said(CAST.renzo, "2026-03-15", w(
    "Yo traigo repuestos electrónicos a varios puestos. Ese viernes salí del mercado como a las once y diez y me fui directo a mi casa. No vi nada raro.",
    "I bring electronic spare parts to several stalls. That Friday I left the market at about ten past eleven and went straight home. I didn't see anything strange."));
  said(CAST.lucia, "2026-03-15", w(
    "Me quedé hasta tarde haciendo el inventario de la juguería. Salí pasadas las once y me fui en mi carro a la casa, aquí nomás en Surquillo.",
    "I stayed late doing the juice bar's stocktake. I left a bit after eleven and drove home, right here in Surquillo."));
  said(CAST.julio, "2026-03-15", w(
    "Vine a dejar cajas de fruta para el sábado. Salí tarde, ya cerca de las once y media, y me fui para Ate.",
    "I came to drop off boxes of fruit for Saturday. I left late, nearly half past eleven, and drove back to Ate."));
  said(CAST.oscar, "2026-03-15", w(
    "Terminé de baldear el pasillo C y salí a tomar mi carro de regreso a Villa El Salvador. Yo no tengo auto, señorita: el carro es la combi.",
    "I finished mopping aisle C and went out to catch my ride back to Villa El Salvador. I don't have a car, miss: my ride is the minibus."));
  said(CAST.fiorella, "2026-03-15", w(
    "Salí como a las once. Mi carro es rojo, se lo puede preguntar a cualquiera del mercado.",
    "I left at about eleven. My car is red, you can ask anyone at the market."));

  const wayra = rows.robots.find((b) => b.nombre === "Wayra");
  wayra.dueno_id = CAST.carmen;
  rows.lecturas = rows.lecturas.filter((x) => !(x.robot_id === wayra.id && (x.sensor.es === "giroscopio") && x.momento > "2026-03-13 22:41:07"));
  add("lecturas", { id: 0, robot_id: wayra.id, sensor: w("giroscopio", "gyroscope"), momento: stamp(13, 22, 41, 7), valor: null, datos: '{"firmware":"2.4.1","ok":false,"error":"timeout"}' });

  // Session 4: Renzo's other calls. Over the whole month Teresa is his most frequent contact; only
  // from Thursday 12 to Saturday 14 does Tito come out on top.
  const teresa = 312, silvia = 215, gustavo = 540;
  call(CAST.renzo, teresa, stamp(2, 9, 14, 20), 132);
  call(teresa, CAST.renzo, stamp(5, 17, 48, 2), 0);
  call(CAST.renzo, teresa, stamp(5, 18, 3, 37), 245);
  call(CAST.renzo, teresa, stamp(9, 10, 31, 9), 96);
  call(teresa, CAST.renzo, stamp(14, 19, 20, 44), 58);
  call(CAST.renzo, teresa, stamp(18, 12, 6, 15), 310);
  call(teresa, CAST.renzo, stamp(22, 8, 55, 0), 77);
  call(CAST.renzo, teresa, stamp(27, 16, 40, 31), 143);
  call(gustavo, CAST.renzo, stamp(12, 9, 40, 12), 421);
  call(CAST.renzo, silvia, stamp(13, 11, 15, 50), 0);
  call(CAST.renzo, gustavo, stamp(20, 20, 2, 5), 388);
}
