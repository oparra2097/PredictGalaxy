import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, "odysseysky.db"));
db.pragma("journal_mode = WAL");
// SQLite ignores ON DELETE CASCADE below unless this is set per-connection.
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS watched_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    depart_date TEXT NOT NULL,
    return_date TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(origin, destination, depart_date, return_date)
  );

  CREATE TABLE IF NOT EXISTS price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL REFERENCES watched_routes(id) ON DELETE CASCADE,
    price REAL NOT NULL,
    currency TEXT NOT NULL,
    airline TEXT NOT NULL,
    collected_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_route ON price_snapshots(route_id, collected_at);
`);

export default db;
