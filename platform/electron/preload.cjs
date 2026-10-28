// The only door between the page and the computer: a few named calls, nothing else.
const { contextBridge, ipcRenderer } = require("electron");

let beforeQuit = null;
ipcRenderer.on("app:before-quit", async () => {
  try {
    if (beforeQuit) await beforeQuit();
  } finally {
    ipcRenderer.send("app:flushed");
  }
});

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  db: {
    read: () => ipcRenderer.invoke("db:read"),
    write: (bytes) => ipcRenderer.invoke("db:write", bytes),
    location: () => ipcRenderer.invoke("db:location"),
    reveal: () => ipcRenderer.invoke("db:reveal"),
    chooseSyncFile: () => ipcRenderer.invoke("db:chooseSync"),
    useDefault: () => ipcRenderer.invoke("db:useDefault"),
    onExternalChange: (fn) => ipcRenderer.on("db:external", (_e, bytes) => fn(bytes)),
  },
  files: {
    save: (bytes, name) => ipcRenderer.invoke("files:save", bytes, name),
    open: () => ipcRenderer.invoke("files:open"),
  },
  env: { check: () => ipcRenderer.invoke("env:check") },
  version: () => ipcRenderer.invoke("app:version"),
  openExternal: (url) => ipcRenderer.send("app:open-external", url),
  setTheme: (mode) => ipcRenderer.send("app:theme", mode),
  setLang: (lang) => ipcRenderer.send("app:lang", lang),
  onBeforeQuit: (fn) => { beforeQuit = fn; },
});
