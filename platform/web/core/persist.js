// Where the progress database's bytes live. Web: IndexedDB in this browser. Desktop: a file in the
// app's data folder (or a shared sync file), written atomically by the main process.

function idb(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbOp(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", mode);
    const req = fn(tx.objectStore("files"));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function webPersistence(siteId) {
  let conn = null;
  const open = async () => (conn ||= await idb(`${siteId}-progress`));
  return {
    kind: "web",
    async load() {
      try {
        const v = await idbOp(await open(), "readonly", (s) => s.get("progress.sqlite"));
        return v ? new Uint8Array(v) : null;
      } catch (_) {
        return null;
      }
    },
    async save(bytes) {
      await idbOp(await open(), "readwrite", (s) => s.put(bytes, "progress.sqlite"));
    },
    onExternalChange() {},
    location: () => null,
  };
}

export function desktopPersistence(bridge) {
  return {
    kind: "desktop",
    load: () => bridge.db.read().then((b) => (b ? new Uint8Array(b) : null)),
    save: (bytes) => bridge.db.write(bytes),
    onExternalChange: (fn) => bridge.db.onExternalChange((b) => fn(new Uint8Array(b))),
    location: () => bridge.db.location(),
  };
}
