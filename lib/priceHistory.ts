import db from "./db";
import { detectAnomaly, type AnomalyResult } from "./anomaly";

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

export function addWatchedRoute(
  origin: string,
  destination: string,
  departDate: string,
  returnDate?: string
): WatchedRoute {
  const stmt = db.prepare(`
    INSERT INTO watched_routes (origin, destination, depart_date, return_date, created_at)
    VALUES (@origin, @destination, @departDate, @returnDate, @createdAt)
    ON CONFLICT(origin, destination, depart_date, return_date) DO UPDATE SET origin = origin
    RETURNING *
  `);
  const row = stmt.get({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departDate,
    // Empty string, not NULL: SQLite's UNIQUE constraint treats every NULL
    // as distinct, which would defeat de-duping one-way routes.
    returnDate: returnDate || "",
    createdAt: new Date().toISOString(),
  }) as WatchedRouteRow;
  return toWatchedRoute(row);
}

export function listWatchedRoutes(): WatchedRoute[] {
  const rows = db
    .prepare("SELECT * FROM watched_routes ORDER BY created_at DESC")
    .all() as WatchedRouteRow[];
  return rows.map(toWatchedRoute);
}

export function deleteWatchedRoute(id: number): void {
  db.prepare("DELETE FROM watched_routes WHERE id = ?").run(id);
}

export function recordSnapshot(
  routeId: number,
  price: number,
  currency: string,
  airline: string
): PriceSnapshot {
  const stmt = db.prepare(`
    INSERT INTO price_snapshots (route_id, price, currency, airline, collected_at)
    VALUES (@routeId, @price, @currency, @airline, @collectedAt)
    RETURNING *
  `);
  const row = stmt.get({
    routeId,
    price,
    currency,
    airline,
    collectedAt: new Date().toISOString(),
  }) as PriceSnapshotRow;
  return toSnapshot(row);
}

export function getSnapshots(routeId: number): PriceSnapshot[] {
  const rows = db
    .prepare("SELECT * FROM price_snapshots WHERE route_id = ? ORDER BY collected_at ASC")
    .all(routeId) as PriceSnapshotRow[];
  return rows.map(toSnapshot);
}

export function listWatchedRoutesWithHistory(): WatchedRouteWithHistory[] {
  return listWatchedRoutes().map((route) => {
    const snapshots = getSnapshots(route.id);
    if (snapshots.length === 0) {
      return { ...route, snapshots, anomaly: null };
    }
    const latest = snapshots[snapshots.length - 1];
    const priorHistory = snapshots.slice(0, -1).map((s) => s.price);
    const anomaly = detectAnomaly(priorHistory, latest.price);
    return { ...route, snapshots, anomaly };
  });
}
