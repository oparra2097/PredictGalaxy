import { Pool } from "pg";
import { detectAnomaly, type AnomalyResult } from "./anomaly";

/**
 * Price-history store with two backends behind one async interface:
 * - Postgres (Neon/Supabase/any) when DATABASE_URL is set — required for
 *   durable history on serverless hosts like Vercel.
 * - SQLite in tmpdir otherwise — zero-setup local dev, and the graceful
 *   degradation mode on Vercel until a database is configured.
 */
const usePostgres = () => Boolean(process.env.DATABASE_URL);

export interface WatchedRoute {
  id: number;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string | null;
  createdAt: string;
}

export interface PriceSnapshot {
  id: number;
  routeId: number;
  price: number;
  currency: string;
  airline: string;
  collectedAt: string;
}

export interface WatchedRouteWithHistory extends WatchedRoute {
  snapshots: PriceSnapshot[];
  anomaly: AnomalyResult | null;
}

interface WatchedRouteRow {
  id: number;
  origin: string;
  destination: string;
  depart_date: string;
  return_date: string | null;
  created_at: string;
}

interface PriceSnapshotRow {
  id: number;
  route_id: number;
  price: number;
  currency: string;
  airline: string;
  collected_at: string;
}

function toWatchedRoute(row: WatchedRouteRow): WatchedRoute {
  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    departDate: row.depart_date,
    returnDate: row.return_date || null,
    createdAt: row.created_at,
  };
}

function toSnapshot(row: PriceSnapshotRow): PriceSnapshot {
  return {
    id: row.id,
    routeId: row.route_id,
    price: row.price,
    currency: row.currency,
    airline: row.airline,
    collectedAt: row.collected_at,
  };
}

// ---------------------------------------------------------------- postgres

let pool: Pool | null = null;
let pgSchemaReady: Promise<void> | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL!;
    pool = new Pool({
      connectionString: url,
      // Hosted Postgres (Neon/Supabase) requires TLS; a local dev database
      // typically doesn't speak it at all.
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
      // One connection per serverless instance — use the provider's pooled
      // connection string (e.g. Neon's -pooler host) for concurrency.
      max: 1,
    });
  }
  return pool;
}

function ensurePgSchema(): Promise<void> {
  if (!pgSchemaReady) {
    pgSchemaReady = getPool()
      .query(
        `
        CREATE TABLE IF NOT EXISTS watched_routes (
          id SERIAL PRIMARY KEY,
          origin TEXT NOT NULL,
          destination TEXT NOT NULL,
          depart_date TEXT NOT NULL,
          return_date TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          UNIQUE(origin, destination, depart_date, return_date)
        );
        CREATE TABLE IF NOT EXISTS price_snapshots (
          id SERIAL PRIMARY KEY,
          route_id INTEGER NOT NULL REFERENCES watched_routes(id) ON DELETE CASCADE,
          price DOUBLE PRECISION NOT NULL,
          currency TEXT NOT NULL,
          airline TEXT NOT NULL,
          collected_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_snapshots_route
          ON price_snapshots(route_id, collected_at);
        `
      )
      .then(() => undefined);
  }
  return pgSchemaReady;
}

// ------------------------------------------------------------------ sqlite

async function sqliteDb() {
  const mod = await import("./db");
  return mod.default;
}

// ------------------------------------------------------------------- store

export async function addWatchedRoute(
  origin: string,
  destination: string,
  departDate: string,
  returnDate?: string
): Promise<WatchedRoute> {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();
  // Empty string, not NULL: both engines treat every NULL as distinct in a
  // UNIQUE constraint, which would defeat de-duping one-way routes.
  const r = returnDate || "";
  const createdAt = new Date().toISOString();

  if (usePostgres()) {
    await ensurePgSchema();
    const { rows } = await getPool().query<WatchedRouteRow>(
      `INSERT INTO watched_routes (origin, destination, depart_date, return_date, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (origin, destination, depart_date, return_date)
       DO UPDATE SET origin = EXCLUDED.origin
       RETURNING *`,
      [o, d, departDate, r, createdAt]
    );
    return toWatchedRoute(rows[0]);
  }

  const db = await sqliteDb();
  const row = db
    .prepare(
      `INSERT INTO watched_routes (origin, destination, depart_date, return_date, created_at)
       VALUES (@o, @d, @departDate, @r, @createdAt)
       ON CONFLICT(origin, destination, depart_date, return_date) DO UPDATE SET origin = origin
       RETURNING *`
    )
    .get({ o, d, departDate, r, createdAt }) as WatchedRouteRow;
  return toWatchedRoute(row);
}

export async function listWatchedRoutes(): Promise<WatchedRoute[]> {
  if (usePostgres()) {
    await ensurePgSchema();
    const { rows } = await getPool().query<WatchedRouteRow>(
      "SELECT * FROM watched_routes ORDER BY created_at DESC"
    );
    return rows.map(toWatchedRoute);
  }

  const db = await sqliteDb();
  const rows = db
    .prepare("SELECT * FROM watched_routes ORDER BY created_at DESC")
    .all() as WatchedRouteRow[];
  return rows.map(toWatchedRoute);
}

export async function deleteWatchedRoute(id: number): Promise<void> {
  if (usePostgres()) {
    await ensurePgSchema();
    await getPool().query("DELETE FROM watched_routes WHERE id = $1", [id]);
    return;
  }

  const db = await sqliteDb();
  db.prepare("DELETE FROM watched_routes WHERE id = ?").run(id);
}

export async function recordSnapshot(
  routeId: number,
  price: number,
  currency: string,
  airline: string
): Promise<PriceSnapshot> {
  const collectedAt = new Date().toISOString();

  if (usePostgres()) {
    await ensurePgSchema();
    const { rows } = await getPool().query<PriceSnapshotRow>(
      `INSERT INTO price_snapshots (route_id, price, currency, airline, collected_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [routeId, price, currency, airline, collectedAt]
    );
    return toSnapshot(rows[0]);
  }

  const db = await sqliteDb();
  const row = db
    .prepare(
      `INSERT INTO price_snapshots (route_id, price, currency, airline, collected_at)
       VALUES (@routeId, @price, @currency, @airline, @collectedAt) RETURNING *`
    )
    .get({ routeId, price, currency, airline, collectedAt }) as PriceSnapshotRow;
  return toSnapshot(row);
}

export async function getSnapshots(routeId: number): Promise<PriceSnapshot[]> {
  if (usePostgres()) {
    await ensurePgSchema();
    const { rows } = await getPool().query<PriceSnapshotRow>(
      "SELECT * FROM price_snapshots WHERE route_id = $1 ORDER BY collected_at ASC",
      [routeId]
    );
    return rows.map(toSnapshot);
  }

  const db = await sqliteDb();
  const rows = db
    .prepare("SELECT * FROM price_snapshots WHERE route_id = ? ORDER BY collected_at ASC")
    .all(routeId) as PriceSnapshotRow[];
  return rows.map(toSnapshot);
}

export async function listWatchedRoutesWithHistory(): Promise<WatchedRouteWithHistory[]> {
  const routes = await listWatchedRoutes();
  return Promise.all(
    routes.map(async (route) => {
      const snapshots = await getSnapshots(route.id);
      if (snapshots.length === 0) {
        return { ...route, snapshots, anomaly: null };
      }
      const latest = snapshots[snapshots.length - 1];
      const priorHistory = snapshots.slice(0, -1).map((s) => s.price);
      const anomaly = detectAnomaly(priorHistory, latest.price);
      return { ...route, snapshots, anomaly };
    })
  );
}
