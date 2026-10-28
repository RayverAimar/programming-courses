// The desktop app: the same built site (dist/), served from disk under app://site/, in one window.
// Progress lives in a file in the app's data folder, or in a shared file the learner picks
// (iCloud Drive, Dropbox), which the app watches for changes made elsewhere.
const { app, BrowserWindow, protocol, ipcMain, dialog, shell, Menu, nativeTheme, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");

const ROOT = path.join(__dirname, "..", "..");
const DIST = path.join(ROOT, "dist");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const ORIGIN = "app://site";
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".wasm": "application/wasm",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".zip": "application/zip", ".txt": "text/plain; charset=utf-8",
};

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } },
]);

// The data folder keeps the name the app had before it was renamed (site.config.json userDataDirs,
// first one that exists), so progress saved under the old name is still found.
app.setName(CONFIG.name);
const legacyDir = (CONFIG.userDataDirs || []).map((n) => path.join(app.getPath("appData"), n)).find((d) => fs.existsSync(d));
if (legacyDir) app.setPath("userData", legacyDir);
// Tests run the app against a throwaway data folder.
if (process.env.APP_USER_DATA) app.setPath("userData", process.env.APP_USER_DATA);
if (!app.requestSingleInstanceLock()) app.quit();

// ── Settings: window size and where progress lives ──
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
  } catch (_) {
    return {};
  }
}
function writeSettings(patch) {
  atomicWrite(settingsFile(), JSON.stringify({ ...readSettings(), ...patch }, null, 2));
}
function atomicWrite(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

// ── Progress file ──
const defaultDb = () => path.join(app.getPath("userData"), `${CONFIG.prefix}-progress.sqlite`);
const dbPath = () => readSettings().syncPath || defaultDb();
const hash = (buf) => crypto.createHash("sha1").update(buf).digest("hex");
let lastHash = null;
let watching = null;

function watchDb(win) {
  if (watching) fs.unwatchFile(watching);
  watching = dbPath();
  if (!readSettings().syncPath) return;
  // Polling, because iCloud Drive and Dropbox replace the file rather than writing into it.
  fs.watchFile(watching, { interval: 2000 }, () => {
    let buf;
    try { buf = fs.readFileSync(watching); } catch (_) { return; }
    const h = hash(buf);
    if (h === lastHash) return;
    lastHash = h;
    if (!win.isDestroyed()) win.webContents.send("db:external", buf);
  });
}

// ── What this machine has, for "Revisar mi entorno" and future native runners ──
const TOOLS = [
  { id: "node", name: "Node.js", cmd: ["node", "--version"], help: "https://nodejs.org/" },
  { id: "python3", name: "Python 3", cmd: [process.platform === "win32" ? "python" : "python3", "--version"], help: "https://www.python.org/downloads/" },
  { id: "clang", name: "clang", cmd: ["clang", "--version"], help: "https://clang.llvm.org/get_started.html" },
  { id: "clang++", name: "clang++", cmd: ["clang++", "--version"], help: "https://clang.llvm.org/get_started.html" },
  { id: "g++", name: "g++", cmd: ["g++", "--version"], help: "https://gcc.gnu.org/install/" },
  { id: "rustc", name: "Rust (rustc)", cmd: ["rustc", "--version"], help: "https://rustup.rs/" },
  { id: "cmake", name: "CMake", cmd: ["cmake", "--version"], help: "https://cmake.org/download/" },
  { id: "ninja", name: "Ninja", cmd: ["ninja", "--version"], help: "https://ninja-build.org/" },
  { id: "git", name: "Git", cmd: ["git", "--version"], help: "https://git-scm.com/downloads" },
  { id: "code", name: "VS Code (code)", cmd: ["code", "--version"], help: "https://code.visualstudio.com/docs/setup/setup-overview" },
];
// Apps opened from the Finder get a minimal PATH; add the usual install places.
const PATHS = process.platform === "win32" ? [] : ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", path.join(require("node:os").homedir(), ".cargo", "bin")];
const envPath = [process.env.PATH, ...PATHS].filter(Boolean).join(path.delimiter);
function probe(t) {
  return new Promise((resolve) => {
    execFile(t.cmd[0], t.cmd.slice(1), { timeout: 4000, env: { ...process.env, PATH: envPath }, windowsHide: true }, (err, stdout, stderr) => {
      const out = `${stdout || ""}${stderr || ""}`.trim().split("\n")[0];
      resolve({ id: t.id, name: t.name, found: !err, version: err ? null : out.replace(/^.*?(\d+\.\d+(\.\d+)?).*$/, "$1"), help: t.help });
    });
  });
}

// ── Window ──
function createWindow() {
  const s = readSettings();
  const area = screen.getPrimaryDisplay().workAreaSize;
  const b = s.bounds || { width: Math.min(1360, area.width), height: Math.min(900, area.height) };
  const win = new BrowserWindow({
    ...b,
    minWidth: 720,
    minHeight: 560,
    show: false,
    title: CONFIG.name,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0f1115" : "#f7f7f8",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 16, y: 14 },
    icon: path.join(ROOT, "build", "icons", "512x512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (s.maximized) win.maximize();
  const saveBounds = () => { if (!win.isDestroyed() && !win.isMaximized() && !win.isMinimized()) writeSettings({ bounds: win.getBounds() }); };
  win.on("resized", saveBounds);
  win.on("moved", saveBounds);
  win.on("maximize", () => writeSettings({ maximized: true }));
  win.on("unmaximize", () => writeSettings({ maximized: false }));
  win.once("ready-to-show", () => win.show());

  // Only the app's own pages load inside; links out open in the browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });

  // Before closing, the page writes its last changes.
  let closing = false;
  win.on("close", (e) => {
    if (closing) return;
    e.preventDefault();
    closing = true;
    const done = () => {
      if (!win.isDestroyed()) win.destroy();
      if (quitting) app.quit();
    };
    ipcMain.once("app:flushed", done);
    setTimeout(done, 1500);
    win.webContents.send("app:before-quit");
  });

  const lang = s.lang && s.lang !== CONFIG.defaultLang ? `${s.lang}/` : "";
  win.loadURL(`${ORIGIN}/${lang}index.html`);
  watchDb(win);
  return win;
}

function menu(win) {
  const go = (hash) => () => win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)}`);
  const mac = process.platform === "darwin";
  const template = [
    ...(mac ? [{ label: CONFIG.name, submenu: [{ role: "about" }, { type: "separator" }, { label: "Ajustes…", accelerator: "Cmd+,", click: go("#/ajustes") }, { type: "separator" }, { role: "services" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" }] }] : []),
    { label: mac ? "Archivo" : "&Archivo", submenu: [{ label: "Inicio", accelerator: "CmdOrCtrl+1", click: go("#/") }, { label: "Mis cursos", accelerator: "CmdOrCtrl+2", click: go("#/cursos") }, { label: "Mi progreso", accelerator: "CmdOrCtrl+3", click: go("#/progreso") }, ...(mac ? [] : [{ label: "Ajustes", accelerator: "Ctrl+,", click: go("#/ajustes") }]), { type: "separator" }, mac ? { role: "close" } : { role: "quit" }] },
    { role: "editMenu" },
    { label: "Ver", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
    { role: "windowMenu" },
    { role: "help", submenu: [{ label: "Código y versiones", click: () => shell.openExternal(`https://github.com/${CONFIG.repo}`) }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── The bridge's other half (platform/electron/preload.cjs) ──
function handlers(getWin) {
  ipcMain.handle("db:read", () => {
    try {
      const buf = fs.readFileSync(dbPath());
      lastHash = hash(buf);
      return buf;
    } catch (_) {
      return null;
    }
  });
  ipcMain.handle("db:write", (_e, bytes) => {
    const buf = Buffer.from(bytes);
    lastHash = hash(buf);
    atomicWrite(dbPath(), buf);
    return true;
  });
  ipcMain.handle("db:location", () => ({ path: dbPath(), shared: !!readSettings().syncPath }));
  ipcMain.handle("db:reveal", () => shell.showItemInFolder(dbPath()));
  ipcMain.handle("db:chooseSync", async () => {
    const r = await dialog.showSaveDialog(getWin(), {
      title: "Archivo de progreso compartido",
      defaultPath: path.join(app.getPath("home"), `${CONFIG.name.toLowerCase()}-progreso.sqlite`),
      buttonLabel: "Usar este archivo",
      filters: [{ name: "Progreso", extensions: ["sqlite"] }],
      properties: ["createDirectory", "showOverwriteConfirmation"],
    });
    if (r.canceled || !r.filePath) return null;
    let existing = null;
    try { existing = fs.readFileSync(r.filePath); } catch (_) {}
    writeSettings({ syncPath: r.filePath });
    watchDb(getWin());
    return { path: r.filePath, existing };
  });
  ipcMain.handle("db:useDefault", () => {
    writeSettings({ syncPath: null });
    watchDb(getWin());
    return dbPath();
  });
  ipcMain.handle("files:save", async (_e, bytes, name) => {
    const r = await dialog.showSaveDialog(getWin(), { defaultPath: path.join(app.getPath("documents"), name), filters: [{ name: "Progreso", extensions: ["sqlite"] }] });
    if (r.canceled || !r.filePath) return null;
    atomicWrite(r.filePath, Buffer.from(bytes));
    return r.filePath;
  });
  ipcMain.handle("files:open", async () => {
    const r = await dialog.showOpenDialog(getWin(), { properties: ["openFile"], filters: [{ name: "Progreso", extensions: ["sqlite", "db"] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    return fs.readFileSync(r.filePaths[0]);
  });
  ipcMain.handle("env:check", async () => ({ tools: await Promise.all(TOOLS.map(probe)), platform: process.platform, arch: process.arch }));
  ipcMain.handle("app:version", () => app.getVersion());
  ipcMain.on("app:open-external", (_e, url) => { if (/^https?:\/\//.test(String(url))) shell.openExternal(url); });
  ipcMain.on("app:theme", (_e, mode) => { nativeTheme.themeSource = mode === "light" || mode === "dark" ? mode : "system"; });
  ipcMain.on("app:lang", (_e, lang) => writeSettings({ lang }));
}

// Files under dist/, never outside it, with the same security policy as the web build.
function serve() {
  protocol.handle("app", async (req) => {
    const url = new URL(req.url);
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST + path.sep)) return new Response("Forbidden", { status: 403 });
    try {
      const body = await fs.promises.readFile(file);
      return new Response(body, { headers: { "content-type": MIME[path.extname(file)] || "application/octet-stream", "x-content-type-options": "nosniff" } });
    } catch (_) {
      return new Response("Not found", { status: 404 });
    }
  });
}

let mainWindow = null;
let quitting = false;
app.on("before-quit", () => (quitting = true));
app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});
app.whenReady().then(() => {
  serve();
  handlers(() => mainWindow);
  mainWindow = createWindow();
  menu(mainWindow);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
