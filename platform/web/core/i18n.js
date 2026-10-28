// UI strings come from the site data (platform/web/ui.json merged with the repo's own ui.json).
let UI = {};
let LANG = "es";

export function setStrings(lang, ui) {
  LANG = lang;
  UI = ui;
}
export const lang = () => LANG;

export function t(key, vars) {
  const raw = UI[key];
  if (raw === undefined) {
    console.warn(`Missing UI string "${key}"`);
    return key;
  }
  return vars ? raw.replace(/\{(\w+)\}/g, (_m, k) => (vars[k] === undefined ? "" : vars[k])) : raw;
}
export const has = (key) => UI[key] !== undefined;
// A course may word a string its own way: "lesson.next.js" wins over "lesson.next".
export const tc = (key, course, vars) => t(course && UI[`${key}.${course}`] !== undefined ? `${key}.${course}` : key, vars);
// "1 lección" / "3 lecciones": keys "x.one" and "x.other".
export const tn = (key, n, vars = {}) => t(`${key}.${n === 1 ? "one" : "other"}`, { n, ...vars });

export function duration(seconds) {
  const m = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
  if (m < 60) return t("time.min", { n: m });
  const h = Math.floor(m / 60), r = m % 60;
  return r ? t("time.hmin", { h, m: r }) : t("time.h", { h });
}

const DEVICE_LEGACY = [[/celular|phone/i, "phone"], [/mac/i, "app.darwin"], [/windows/i, "app.win32"], [/linux/i, "app.linux"], [/web/i, "web"]];

export function deviceName(label) {
  const raw = String(label || "");
  const key = /^(web|phone|app\.(darwin|win32|linux))$/.test(raw) ? raw : (DEVICE_LEGACY.find(([re]) => re.test(raw)) || [])[1];
  return key ? t(`device.${key}`) : raw;
}

export function ago(ts, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(LANG, { numeric: "auto" });
  const s = Math.round((ts - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return t("time.now");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 14) return rtf.format(Math.round(s / 86400), "day");
  if (abs < 86400 * 60) return rtf.format(Math.round(s / (86400 * 7)), "week");
  return rtf.format(Math.round(s / (86400 * 30)), "month");
}

export const date = (ts, opts = { day: "numeric", month: "short", year: "numeric" }) => new Intl.DateTimeFormat(LANG, opts).format(new Date(ts));
export const pct = (x) => `${Math.round(x * 100)}%`;
