// Python for the build and verify scripts: Pyodide (the same runtime the page uses) in a worker
// thread, with a watchdog. A call that runs too long, such as a starter with an endless loop,
// kills the thread; the next call starts a new one.
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

export class PyHost {
  constructor() {
    this.worker = null;
    this.booting = null;
    this.seq = 0;
    this.pending = new Map();
  }

  spawn() {
    this.worker = new Worker(join(HERE, "pyworker-node.mjs"));
    this.booting = new Promise((resolve, reject) => {
      this.worker.on("message", (d) => {
        if ("ready" in d) return d.ready ? resolve() : reject(new Error(d.error));
        const p = this.pending.get(d.id);
        if (!p) return;
        this.pending.delete(d.id);
        clearTimeout(p.timer);
        if (d.error) p.reject(new Error(d.error));
        else p.resolve(d.result);
      });
      this.worker.on("error", reject);
    });
    return this.booting;
  }

  kill() {
    const w = this.worker;
    this.worker = null;
    this.booting = null;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.resolve({ __timeout: true }); }
    this.pending.clear();
    if (w) w.terminate();
  }

  async call(op, args, timeout = 10000) {
    if (!this.worker) this.spawn();
    await this.booting;
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => this.kill(), timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, op, args });
    });
  }

  close() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
  }
}
