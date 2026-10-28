// Progress lives in a real SQLite database (sql.js, WebAssembly), the same on the web and in the app.
// The database is in memory; persist.js stores its bytes (IndexedDB on the web, a file in the app).
// Every write marks it dirty and a debounced save follows.
import initSqlJs from "sql.js/dist/sql-wasm-browser.js";

// Each entry upgrades the schema by one version (PRAGMA user_version). Never edit a shipped one: add the next.
export const MIGRATIONS = [
  `CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
   CREATE TABLE lesson_state (
     lesson_id TEXT PRIMARY KEY, course_id TEXT NOT NULL, module_id TEXT NOT NULL,
     state TEXT NOT NULL DEFAULT 'started', position TEXT,
     opened_at INTEGER, done_at INTEGER, updated_at INTEGER NOT NULL);
   CREATE TABLE item_state (
     item_id TEXT PRIMARY KEY, course_id TEXT, lesson_id TEXT, kind TEXT,
     passed INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, fails INTEGER NOT NULL DEFAULT 0,
     first_ok INTEGER, passed_at INTEGER, updated_at INTEGER NOT NULL);
   CREATE TABLE attempt (
     uid TEXT PRIMARY KEY, item_id TEXT NOT NULL, course_id TEXT, lesson_id TEXT, kind TEXT, lang TEXT,
     ok INTEGER NOT NULL, detail TEXT, at INTEGER NOT NULL, device TEXT);
   CREATE INDEX attempt_item ON attempt (item_id);
   CREATE TABLE saved_code (item_id TEXT NOT NULL, lang TEXT NOT NULL, code TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (item_id, lang));
   CREATE TABLE check_answer (check_id TEXT PRIMARY KEY, lesson_id TEXT, answer TEXT, correct INTEGER, at INTEGER NOT NULL);
   CREATE TABLE note (lesson_id TEXT PRIMARY KEY, course_id TEXT, body TEXT NOT NULL, updated_at INTEGER NOT NULL);
   CREATE TABLE study_day (day TEXT NOT NULL, device TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY (day, device));
   CREATE TABLE review_item (item_id TEXT PRIMARY KEY, course_id TEXT, lesson_id TEXT, title TEXT, href TEXT, reason TEXT, created_at INTEGER NOT NULL, resolved_at INTEGER);
   CREATE TABLE course_done (course_id TEXT PRIMARY KEY, done_at INTEGER NOT NULL);
   CREATE TABLE unlock (module_id TEXT PRIMARY KEY, at INTEGER NOT NULL);
   CREATE TABLE pref (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER NOT NULL);`,
  // Notes and written answers become rich text (HTML); their images live in attachment.
  `CREATE TABLE attachment (id TEXT PRIMARY KEY, mime TEXT NOT NULL, width INTEGER, height INTEGER, size INTEGER NOT NULL, data BLOB NOT NULL, created_at INTEGER NOT NULL);
   UPDATE note SET body = '<p>' || replace(replace(replace(replace(replace(body, char(13), ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), char(10), '</p><p>') || '</p>';
   UPDATE saved_code SET code = '<p>' || replace(replace(replace(replace(replace(code, char(13), ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), char(10), '</p><p>') || '</p>' WHERE lang = 'text';`,
  // The learner's profile from the first-run welcome: name, email, daily goal, whether the welcome was done.
  `CREATE TABLE profile (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER NOT NULL);`,
];
export const SCHEMA_VERSION = MIGRATIONS.length;

let SQL = null;

export async function loadEngine(wasmUrl) {
  if (!SQL) SQL = await initSqlJs({ locateFile: () => wasmUrl });
  return SQL;
}

export function migrate(db) {
  const v = db.exec("PRAGMA user_version")[0].values[0][0];
  if (v > SCHEMA_VERSION) throw new Error(`Progress file is from a newer version (schema ${v}, this app knows ${SCHEMA_VERSION})`);
  for (let i = v; i < SCHEMA_VERSION; i++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  return db;
}

export function openBytes(bytes) {
  const db = bytes && bytes.length ? new SQL.Database(bytes) : new SQL.Database();
  db.exec("PRAGMA foreign_keys = ON");
  return migrate(db);
}

// A thin wrapper: synchronous queries over the in-memory database, and a change hook for saving.
export class Store {
  constructor(db, onChange) {
    this.db = db;
    this.onChange = onChange;
    this.batch = 0;
  }
  all(sql, params = []) {
    const st = this.db.prepare(sql);
    try {
      st.bind(params);
      const out = [];
      while (st.step()) out.push(st.getAsObject());
      return out;
    } finally {
      st.free();
    }
  }
  one(sql, params = []) {
    return this.all(sql, params)[0] || null;
  }
  value(sql, params = []) {
    const r = this.one(sql, params);
    return r ? Object.values(r)[0] : null;
  }
  run(sql, params = []) {
    this.db.run(sql, params);
    if (!this.batch) this.onChange();
  }
  tx(fn) {
    this.batch++;
    this.db.exec("BEGIN");
    try {
      const r = fn();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    } finally {
      this.batch--;
      if (!this.batch) this.onChange();
    }
  }
  meta(key, value) {
    if (value === undefined) return this.value("SELECT value FROM meta WHERE key = ?", [key]);
    this.run("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", [key, value]);
  }
  export() {
    return this.db.export();
  }
  replace(db) {
    this.db.close();
    this.db = db;
    this.onChange();
  }
}

// Merging another copy of the progress (an imported file, the shared sync file) into this one.
// Nothing is lost: done stays done, attempts add up, and for text the newest edit wins.
const MERGE = {
  lesson_state: `INSERT INTO lesson_state VALUES (:lesson_id, :course_id, :module_id, :state, :position, :opened_at, :done_at, :updated_at)
    ON CONFLICT (lesson_id) DO UPDATE SET
      state = CASE WHEN excluded.state = 'done' OR lesson_state.state = 'done' THEN 'done' ELSE lesson_state.state END,
      position = CASE WHEN excluded.updated_at > lesson_state.updated_at THEN excluded.position ELSE lesson_state.position END,
      opened_at = min(coalesce(lesson_state.opened_at, excluded.opened_at), coalesce(excluded.opened_at, lesson_state.opened_at)),
      done_at = min(coalesce(lesson_state.done_at, excluded.done_at), coalesce(excluded.done_at, lesson_state.done_at)),
      updated_at = max(lesson_state.updated_at, excluded.updated_at)`,
  item_state: `INSERT INTO item_state VALUES (:item_id, :course_id, :lesson_id, :kind, :passed, :attempts, :fails, :first_ok, :passed_at, :updated_at)
    ON CONFLICT (item_id) DO UPDATE SET
      passed = max(item_state.passed, excluded.passed),
      attempts = max(item_state.attempts, excluded.attempts),
      fails = max(item_state.fails, excluded.fails),
      first_ok = CASE WHEN coalesce(excluded.passed_at, 9e15) < coalesce(item_state.passed_at, 9e15) THEN excluded.first_ok ELSE coalesce(item_state.first_ok, excluded.first_ok) END,
      passed_at = min(coalesce(item_state.passed_at, excluded.passed_at), coalesce(excluded.passed_at, item_state.passed_at)),
      updated_at = max(item_state.updated_at, excluded.updated_at)`,
  attempt: `INSERT OR IGNORE INTO attempt VALUES (:uid, :item_id, :course_id, :lesson_id, :kind, :lang, :ok, :detail, :at, :device)`,
  saved_code: `INSERT INTO saved_code VALUES (:item_id, :lang, :code, :updated_at)
    ON CONFLICT (item_id, lang) DO UPDATE SET code = excluded.code, updated_at = excluded.updated_at WHERE excluded.updated_at > saved_code.updated_at`,
  check_answer: `INSERT INTO check_answer VALUES (:check_id, :lesson_id, :answer, :correct, :at)
    ON CONFLICT (check_id) DO UPDATE SET answer = excluded.answer, correct = excluded.correct, at = excluded.at WHERE excluded.at > check_answer.at`,
  note: `INSERT INTO note VALUES (:lesson_id, :course_id, :body, :updated_at)
    ON CONFLICT (lesson_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at WHERE excluded.updated_at > note.updated_at`,
  study_day: `INSERT INTO study_day VALUES (:day, :device, :seconds, :updated_at)
    ON CONFLICT (day, device) DO UPDATE SET seconds = max(study_day.seconds, excluded.seconds), updated_at = max(study_day.updated_at, excluded.updated_at)`,
  review_item: `INSERT INTO review_item VALUES (:item_id, :course_id, :lesson_id, :title, :href, :reason, :created_at, :resolved_at)
    ON CONFLICT (item_id) DO UPDATE SET
      created_at = min(review_item.created_at, excluded.created_at),
      resolved_at = max(coalesce(review_item.resolved_at, 0), coalesce(excluded.resolved_at, 0))`,
  course_done: `INSERT INTO course_done VALUES (:course_id, :done_at)
    ON CONFLICT (course_id) DO UPDATE SET done_at = min(course_done.done_at, excluded.done_at)`,
  unlock: `INSERT OR IGNORE INTO unlock VALUES (:module_id, :at)`,
  attachment: `INSERT OR IGNORE INTO attachment VALUES (:id, :mime, :width, :height, :size, :data, :created_at)`,
  profile: `INSERT INTO profile VALUES (:key, :value, :updated_at)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at WHERE excluded.updated_at > profile.updated_at`,
};

export function merge(store, bytes) {
  const other = openBytes(bytes);
  const counts = {};
  try {
    store.tx(() => {
      for (const [table, sql] of Object.entries(MERGE)) {
        const rows = new Store(other, () => {}).all(`SELECT * FROM ${table}`);
        counts[table] = rows.length;
        for (const r of rows) {
          const params = {};
          for (const [k, v] of Object.entries(r)) params[":" + k] = v;
          store.db.run(sql, params);
        }
      }
      store.db.run("UPDATE review_item SET resolved_at = NULL WHERE resolved_at = 0");
    });
    const lastWrite = new Store(other, () => {}).value("SELECT value FROM meta WHERE key = 'last_write'");
    return { counts, lastWrite: lastWrite ? JSON.parse(lastWrite) : null };
  } finally {
    other.close();
  }
}

// Is this a progress database? (The first 16 bytes of every SQLite file.)
export const isSqlite = (bytes) => bytes && bytes.length > 16 && new TextDecoder().decode(bytes.slice(0, 15)) === "SQLite format 3";
