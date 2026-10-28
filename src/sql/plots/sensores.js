// Case 3, "El sabotaje de la sala de sensores" (sessions 9–11). Loop's robots sleep and calibrate
// every night at 03:00 in the sensor room. On the nights of Tuesday 24 and Thursday 26 March 2026 someone
// opened the room with the card Wilmer reported lost, flashed a firmware nobody released (2.6.0) on
// Tika, Kusi and Pituco, and the 03:00 calibration applied a wrong gyroscope offset. The trail, session
// by session, is in docs/sql.md.
export const CAST = { carmen: 58, wilmer: 1013, yesenia: 1087, kiara: 953, gonzalo: 1152 };
const BOTS = [[1, "chasqui", 33], [3, "tika", 31], [4, "kusi", 36], [5, "quilla", 32], [11, "pituco", 34]];

function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sensores(ctx) {
  const { add, people, stamp, shift, w, pad } = ctx;
  const rnd = prng(20260324);
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const noise = (s) => (rnd() + rnd() + rnd() - 1.5) * s;
  const person = (id, fields) => Object.assign(people[id - 1], fields);

  person(CAST.wilmer, { nombre: "Wilmer Zevallos Benavides", distrito: "Jesús María", ocupacion: w("vigilante", "security guard"), altura_cm: 172 });
  person(CAST.yesenia, { nombre: "Yesenia Choque Ugarte", distrito: "Chorrillos", ocupacion: w("estudiante", "student"), altura_cm: 157 });
  person(CAST.kiara, { nombre: "Kiara Montes Alvarado", distrito: "San Borja", ocupacion: w("técnico de robots", "robot technician"), altura_cm: 163 });
  person(CAST.gonzalo, { nombre: "Gonzalo Pumacayo Tello", distrito: "Surco", ocupacion: w("programador", "programmer"), altura_cm: 178 });

  // Firmware releases: Gonzalo wrote them until he left in February; Carmen since.
  const CHANGES = [w("mejor lectura del giroscopio", "better gyroscope reading"), w("ahorro de batería", "battery saving"), w("arreglo del ventilador", "fan fix"), w("nuevas rutas de reparto", "new delivery routes"), w("calibración más rápida", "faster calibration"), w("registro de errores", "error log"), w("arreglo de la cámara", "camera fix"), w("voz más clara", "clearer voice")];
  let fid = 0;
  for (let minor = 3; minor <= 5; minor++) for (let patch = 0; patch <= 9; patch++) {
    const n = (minor - 3) * 10 + patch;
    const month = 9 + n;
    const y = 2023 + Math.floor((month - 1) / 12);
    const date = n === 29 ? "2026-03-18" : `${y}-${pad(((month - 1) % 12) + 1)}-${pad(int(2, 27))}`;
    const author = [15, 22, 29].includes(n) ? CAST.carmen : CAST.gonzalo;
    const user = author === CAST.carmen ? "crios" : "gpumacayo";
    const picked = [CHANGES[n % CHANGES.length], CHANGES[(n * 3 + 1) % CHANGES.length]].slice(0, 1 + (n % 2));
    const json = (lang) => JSON.stringify(lang === "es" ? { usuario: user, cambios: picked.map((c) => c.es) } : { user, changes: picked.map((c) => c.en) });
    add("firmwares", { id: ++fid, version: `2.${minor}.${patch}`, publicado: date, autor_id: author, notas: w(json("es"), json("en")) });
  }

  // Sensor readings, every 10 minutes from Friday 20 to Saturday 28, two sensors per robot.
  const FLASH = {
    tika: { day: 24, gap: ["01:41", "02:09"], at: "02:09:37", offset: 1.8, patches: [["giroscopio.offset=+1.8", "gyroscope.offset=+1.8"], ["calibracion.verificar=no", "calibration.check=off"]] },
    kusi: { day: 24, gap: ["01:53", "02:15"], at: "02:14:52", offset: -1.6, patches: [["giroscopio.offset=-1.6", "gyroscope.offset=-1.6"], ["ventilador.umbral=75", "fan.threshold=75"], ["calibracion.verificar=no", "calibration.check=off"]] },
    pituco: { day: 26, gap: ["02:05", "02:30"], at: "02:29:31", offset: 2.1, patches: [["giroscopio.offset=+2.1", "gyroscope.offset=+2.1"], ["calibracion.verificar=no", "calibration.check=off"]] },
  };
  const drop = new Set();
  while (drop.size < 7) {
    const day = int(20, 28), h = int(7, 21), b = BOTS[int(0, BOTS.length - 1)][1];
    drop.add(`${b} ${stamp(day, h, int(0, 5) * 10).slice(0, 15)}`);
  }
  const event = (robot_id, momento, de, a, user, device, patches) => add("lecturas", {
    id: 0, robot_id, sensor: w("sistema", "system"), momento, valor: null,
    datos: w(
      JSON.stringify({ evento: "actualizacion", de, a, usuario: user, equipo: device, parches: patches.map((p) => p[0]) }),
      JSON.stringify({ event: "update", from: de, to: a, user, device, patches: patches.map((p) => p[1]) }),
    ),
  });
  BOTS.forEach(([id, name, base], i) => {
    const f = FLASH[name];
    const flashed = f ? stamp(f.day, 3, 0) : null;
    for (let day = 20; day <= 28; day++) for (let k = 0; k < 144; k++) {
      const h = Math.floor(k / 6), m = (k % 6) * 10 + i * 2;
      const t = stamp(day, h, m, int(0, 59));
      const hm = t.slice(11, 16);
      if (drop.has(`${name} ${t.slice(0, 15)}`)) continue;
      if (day === 20 && h === 10 && m === 40 + i * 2) continue;
      if (f && day === f.day && hm >= f.gap[0] && hm < f.gap[1]) continue;
      const fw = t < "2026-03-20 10:45" ? "2.5.8" : f && t > `2026-03-${f.day} ${f.at}` ? "2.6.0" : "2.5.9";
      const bad = f && t >= flashed;
      const gyro = Math.round(((bad ? f.offset : 0) + noise(0.06)) * 100) / 100;
      const work = h >= 8 && h < 19 ? 3 + 2 * Math.sin(((h - 8) / 11) * Math.PI) : 0;
      let temp = base + work + noise(1.2);
      if (name === "kusi" && bad) temp += h >= 11 && h < 15 ? 27 + (h - 11) * 3 + noise(2) : 9;
      temp = Math.round(temp * 10) / 10;
      const ok = !(name === "kusi" && temp > 65);
      const datos = JSON.stringify({ firmware: fw, ok });
      add("lecturas", { id: 0, robot_id: id, sensor: w("giroscopio", "gyroscope"), momento: t, valor: gyro, datos });
      add("lecturas", { id: 0, robot_id: id, sensor: w("temperatura", "temperature"), momento: t, valor: temp, datos });
    }
    event(id, `2026-03-20 10:${pad(36 + i * 2)}:${pad(int(0, 59))}`, "2.5.8", "2.5.9", "ychoque", "PC-LOOP-02", []);
    if (f) event(id, `2026-03-${f.day} ${f.at}`, "2.5.9", "2.6.0", "gpumacayo", "LAP-07", f.patches);
  });

  // The sensor room's card reader, Monday 16 to Saturday 28.
  const log = [];
  const card = (tarjeta, persona_id, momento, dir) => log.push({ id: 0, tarjeta, persona_id, momento, sentido: dir === "in" ? w("entrada", "in") : w("salida", "out") });
  const visit = (tarjeta, persona_id, from, minutes) => { card(tarjeta, persona_id, from, "in"); card(tarjeta, persona_id, shift(from, minutes).slice(0, 17) + pad(int(0, 59)), "out"); };
  for (let day = 16; day <= 28; day++) {
    const dow = new Date(Date.UTC(2026, 2, day)).getUTCDay();
    const wilmer = day <= 23 ? "T-0412" : "T-0533";
    visit(wilmer, CAST.wilmer, stamp(day, 0, int(1, 6), int(0, 59)), int(3, 5));
    visit(wilmer, CAST.wilmer, stamp(day, 4, int(0, 7), int(0, 59)), int(3, 5));
    if (dow !== 0) {
      card("T-0101", CAST.carmen, stamp(day, 7, int(40, 55), int(0, 59)), "in");
      card("T-0101", CAST.carmen, stamp(day, 12, int(50, 59), int(0, 59)), "out");
      card("T-0101", CAST.carmen, stamp(day, 14, int(5, 20), int(0, 59)), "in");
      card("T-0101", CAST.carmen, stamp(day, 19, int(15, 35), int(0, 59)), "out");
    }
    if (dow >= 1 && dow <= 5) {
      card("T-0215", CAST.yesenia, stamp(day, 9, int(0, 9), int(0, 59)), "in");
      card("T-0215", CAST.yesenia, stamp(day, 13, int(0, 5), int(0, 59)), "out");
      card("T-0215", CAST.yesenia, stamp(day, 14, int(0, 9), int(0, 59)), "in");
      card("T-0215", CAST.yesenia, stamp(day, 18, int(0, 12), int(0, 59)), "out");
    }
    if (dow === 3) visit("T-0388", CAST.kiara, stamp(day, 15, int(0, 10), int(0, 59)), int(85, 95));
    if (day === 21) visit("T-0388", CAST.kiara, stamp(day, 10, int(0, 10), int(0, 59)), int(35, 45));
  }
  card("T-0412", CAST.wilmer, "2026-03-24 01:38:12", "in");
  card("T-0412", CAST.wilmer, "2026-03-24 02:16:40", "out");
  card("T-0412", CAST.wilmer, "2026-03-26 01:52:05", "in");
  card("T-0412", CAST.wilmer, "2026-03-26 02:31:18", "out");
  log.sort((a, b) => (a.momento < b.momento ? -1 : a.momento > b.momento ? 1 : 0)).forEach((x, i) => { x.id = i + 1; add("accesos", x); });

  const report = (fecha, hora, tipo, lugar, descripcion, denunciante_id) => add("denuncias", { id: 0, fecha, hora, distrito: "Surquillo", tipo, lugar, descripcion, denunciante_id });
  report("2026-03-23", "19:20", w("pérdida", "lost"), w("Paradero de Av. Angamos", "Av. Angamos bus stop"), w(
    "Perdí mi tarjeta de acceso T-0412, la de la sala de sensores de Loop. La tenía en el bolsillo de la casaca y en el paradero ya no estaba.",
    "I lost my access card T-0412, the one for the Loop sensor room. It was in my jacket pocket and at the bus stop it was gone."), CAST.wilmer);
  report("2026-03-27", "09:10", w("sabotaje", "sabotage"), w("Loop, sala de sensores", "Loop, sensor room"), w(
    "Desde el martes 24, Tika choca con las paredes en su ronda y Kusi se recalienta en la cocina; desde el jueves 26, Pituco se va de lado. Los tres se calibran de noche en nuestra sala de sensores. Alguien les cambió la calibración. Las lecturas y el registro de la puerta están en el sistema.",
    "Since Tuesday 24, Tika bumps into walls on its rounds and Kusi overheats in the kitchen; since Thursday 26, Pituco leans to one side. All three calibrate at night in our sensor room. Someone changed their calibration. The readings and the door log are in the system."), CAST.carmen);

  const said = (persona_id, fecha, es, en) => add("entrevistas", { id: 0, persona_id, fecha, caso: "SEN-0327", transcripcion: w(es, en) });
  said(CAST.carmen, "2026-03-27",
    "Los robots duermen en la sala de sensores y a las tres de la mañana se calibran solos. Tarjeta para entrar tenemos cuatro: yo, Yesenia, que es practicante; Wilmer, el vigilante de la galería, que hace sus rondas; y Kiara, de Andina Robótica, que alquila un pad los miércoles.",
    "The robots sleep in the sensor room and calibrate themselves at three in the morning. Four of us have a card to get in: me; Yesenia, our intern; Wilmer, the arcade's night guard, who does his rounds; and Kiara, from Andina Robótica, who rents a pad on Wednesdays.");
  said(CAST.wilmer, "2026-03-28",
    "Hago dos rondas: a medianoche y a las cuatro. Entro, miro que los robots estén cargando y salgo. El lunes perdí mi tarjeta y lo denuncié; la señora Carmen me dio otra esa misma noche. A las dos de la mañana yo estoy en la caseta de la entrada.",
    "I do two rounds: at midnight and at four. I go in, check the robots are charging and go out. On Monday I lost my card and reported it; Mrs Carmen gave me another that same night. At two in the morning I'm in the booth at the entrance.");
  said(CAST.yesenia, "2026-03-28",
    "El viernes 20 en la mañana actualicé los cinco robots a la 2.5.9, la versión que publicó Carmen el miércoles. Yo trabajo de nueve a seis; de noche nunca he entrado.",
    "On Friday 20 in the morning I updated all five robots to 2.5.9, the version Carmen released on Wednesday. I work nine to six; I've never been in at night.");
  said(CAST.kiara, "2026-03-28",
    "Voy los miércoles en la tarde a calibrar a Illa, que es de Andina. No toco los robots de Loop: ni siquiera tengo su programa.",
    "I go on Wednesday afternoons to calibrate Illa, which belongs to Andina. I don't touch Loop's robots: I don't even have their software.");
  said(CAST.carmen, "2026-03-28",
    "Para cambiar un firmware hay que saber programarlo. Aquí lo sabemos hacer dos: yo y Gonzalo, que escribió casi todas las versiones hasta que se fue en febrero, peleado, a una empresa que compite con nosotros por el contrato de la municipalidad. Le desactivé la tarjeta el día que se fue.",
    "To change a firmware you have to know how to program it. Two of us here can: me, and Gonzalo, who wrote almost every version until he left in February, after a fight, for a company competing with us for the municipal contract. I deactivated his card the day he left.");
  said(CAST.gonzalo, "2026-03-30",
    "Yo ya no trabajo en Loop y mi tarjeta no abre nada desde febrero. Esas noches estuve en mi casa, en Surco. Si los robots fallan, será que alguien no sabe actualizarlos.",
    "I don't work at Loop any more and my card hasn't opened anything since February. Those nights I was at home, in Surco. If the robots are failing, it'll be because someone doesn't know how to update them.");
}
