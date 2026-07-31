import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// Serverless platforms (Vercel included) ship a read-only filesystem
// outside of os.tmpdir() — writing under process.cwd() throws there. Using
// tmpdir() everywhere keeps one code path instead of branching on
// environment, at the cost of the local dev DB living outside the repo
// (it's gitignored anyway, so that's not a real downside).
//
// Note this doesn't make persistence *work* on serverless: tmpdir() is
// still wiped between deploys and isn't guaranteed to survive between
// invocations on a cold instance. It just stops it from crashing. See
// README's "hosted database" note for the real fix.
const DATA_DIR = path.join(os.tmpdir(), "odysseysky");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, "odysseysky.db"));
db.pragma("journal_mode = WAL");
// SQLite ignores ON DELETE CASCADE below unless this is set per-connection.
db.pragma("foreign_keys = ON");
// Next.js's build step evaluates route modules across several workers at
// once, each opening its own connection to this same file — without a busy
// timeout, the CREATE TABLE statements below race and throw SQLITE_BUSY
// instead of one connection just waiting its turn.
db.pragma("busy_timeout = 5000");

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
