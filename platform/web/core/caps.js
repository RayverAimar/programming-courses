// What this copy of the site can do. The desktop app exposes a small bridge (platform/electron/preload.cjs);
// the web has none. Screens ask here and show "disponible en la app" when the answer is no.
const bridge = typeof window !== "undefined" ? window.desktop || null : null;
let env = null;

export const desktop = () => !!bridge;
export const getBridge = () => bridge;
export const devMode = () => !bridge && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
export const os = () => (bridge ? bridge.platform : /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "darwin" : /Win/.test(navigator.platform || navigator.userAgent) ? "win32" : /Linux|Android/.test(navigator.userAgent) ? "linux" : "other");

// Tools the machine has (Node, Python, clang…), checked once by the app.
export async function checkEnv(force = false) {
  if (!bridge) return null;
  if (!env || force) env = await bridge.env.check();
  return env;
}
const NATIVE = { cpp: ["clang++", "g++"], c: ["clang", "gcc"], rust: ["rustc"], python: ["python3", "python"], node: ["node"] };
export function canRunNative(lang) {
  if (!bridge || !env) return false;
  return (NATIVE[lang] || [lang]).some((tool) => env.tools.some((t) => t.id === tool && t.found));
}
export const can = {
  openExternal: () => !!bridge,
  syncFile: () => !!bridge,
  openInEditor: () => !!bridge,
  offline: () => !!bridge,
};

export function openExternal(url) {
  if (bridge) bridge.openExternal(url);
  else window.open(url, "_blank", "noopener");
}
