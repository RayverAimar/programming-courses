// A simulated server on a virtual clock: requests take a seeded latency, some fail, and nothing
// really waits, so runs are instant and identical every time.
import { serverObject, serverDocs } from "../api/expose.js";

const MSG = {
  es: {
    down: (r) => `El servidor no respondió al pedir "${r}" (503). Inténtalo otra vez.`,
    missing: (r) => `El servidor no tiene "${r}" (404).`,
    stuck: "El programa se quedó esperando una promesa que nunca se cumple ni se rechaza.",
    tooMany: "Demasiadas esperas: ¿un bucle que nunca termina de pedir o esperar?",
  },
  en: {
    down: (r) => `The server didn't answer the request for "${r}" (503). Try again.`,
    missing: (r) => `The server has no "${r}" (404).`,
    stuck: "The program was left waiting for a promise that never fulfils or rejects.",
    tooMany: "Too many waits: a loop that never stops requesting or waiting?",
  },
};
const MAX_EVENTS = 5000;

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Server {
  constructor(config = {}, lang = "es") {
    this.lang = lang;
    this.m = MSG[lang] || MSG.es;
    this.data = config.data || {};
    this.latency = config.latency || [100, 400];
    this.failRate = config.failRate ?? 0;
    this.failOn = config.failOn || [];
    this.rand = mulberry(config.seed ?? 1);
    this.clock = 0;
    this.seq = 0;
    this.queue = [];
    this.log = [];
    this.sent = [];
    this.events = 0;
  }

  at(delay, fn) {
    if (++this.events > MAX_EVENTS) throw new Error(this.m.tooMany);
    const ev = { t: this.clock + Math.max(0, Number(delay) || 0), n: this.seq++, fn };
    let i = this.queue.length;
    while (i > 0 && (this.queue[i - 1].t > ev.t || (this.queue[i - 1].t === ev.t && this.queue[i - 1].n > ev.n))) i--;
    this.queue.splice(i, 0, ev);
    return ev;
  }

  call(resource, payload, isSend) {
    const n = this.log.length + 1;
    const [lo, hi] = this.latency;
    const delay = Math.round(lo + this.rand() * (hi - lo));
    const fails = this.failOn.length ? this.failOn.includes(n) : this.rand() < this.failRate;
    const entry = { n, resource: String(resource), start: this.clock, end: this.clock + delay, ok: !fails, status: fails ? 503 : 200 };
    if (!isSend && !fails && !(resource in this.data)) { entry.ok = false; entry.status = 404; }
    this.log.push(entry);
    return new Promise((resolve, reject) => {
      this.at(delay, () => {
        if (!entry.ok) {
          const err = new Error(entry.status === 404 ? this.m.missing(resource) : this.m.down(resource));
          err.status = entry.status;
          return reject(err);
        }
        if (isSend) {
          this.sent.push({ resource: String(resource), data: clone(payload), at: this.clock });
          return resolve({ ok: true });
        }
        resolve(clone(this.data[resource]));
      });
    });
  }

  api() {
    const s = this;
    const impl = {
      request: (r) => s.call(r, undefined, false),
      send: (r, data) => s.call(r, data, true),
      wait: (ms) => new Promise((resolve) => s.at(ms, resolve)),
      now: () => s.clock,
    };
    const api = {};
    for (const d of serverDocs(this.lang)) api[d.name] = impl[d.id];
    return Object.freeze(api);
  }

  name() {
    return serverObject(this.lang).name;
  }

  // A virtual setTimeout for async lessons; the callback runs on the simulated clock.
  timers() {
    const ids = new Map();
    let next = 1;
    return {
      setTimeout: (fn, ms = 0, ...args) => {
        const id = next++;
        ids.set(id, this.at(ms, () => { ids.delete(id); fn(...args); }));
        return id;
      },
      clearTimeout: (id) => {
        const ev = ids.get(id);
        if (ev) this.queue.splice(this.queue.indexOf(ev), 1);
        ids.delete(id);
      },
    };
  }

  // Drives the clock until the promise settles: microtasks first, then the next timed event.
  async settle(promise) {
    let state = 0, value, error;
    promise.then((v) => { state = 1; value = v; }, (e) => { state = 2; error = e; });
    for (;;) {
      for (let i = 0; i < 1000 && !state; i++) await null;
      if (state) break;
      const ev = this.queue.shift();
      if (!ev) throw new Error(this.m.stuck);
      this.clock = ev.t;
      ev.fn();
    }
    // Like a real event loop, timers still pending when the program ends run before the run ends.
    for (let ev = this.queue.shift(); ev; ev = this.queue.shift()) {
      this.clock = ev.t;
      ev.fn();
      for (let i = 0; i < 1000; i++) await null;
    }
    if (state === 2) throw error;
    return value;
  }

  summary() {
    return { clock: this.clock, requests: this.log.map((e) => ({ ...e })), sent: this.sent.map((e) => ({ ...e })) };
  }
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
