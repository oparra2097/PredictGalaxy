"use client";

interface AnomalyInfo {
  sampleSize: number;
  median: number;
  latestPrice: number;
  percentBelowMedian: number;
  isAnomaly: boolean;
}

interface Snapshot {
  id: number;
  price: number;
  currency: string;
  collectedAt: string;
}

export interface WatchedRouteWithHistory {
  id: number;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string | null;
  snapshots: Snapshot[];
  anomaly: AnomalyInfo | null;
}

export default function WatchedRoutes({
  routes,
  collecting,
  onCollect,
  onRemove,
}: {
  routes: WatchedRouteWithHistory[];
  collecting: boolean;
  onCollect: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">
          Snapshots the cheapest price for each route over time and flags real
          drops vs that route&apos;s own history — not just today&apos;s cheapest.
        </p>
        <button
          onClick={onCollect}
          disabled={collecting || routes.length === 0}
          className="shrink-0 rounded-md bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50"
        >
          {collecting ? "Collecting…" : "Collect prices now"}
        </button>
      </div>

      {routes.length === 0 ? (
        <p className="text-white/50">
          No tracked routes yet. Search above, then track a route to start
          building its price history.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {routes.map((route) => {
            const latest = route.snapshots[route.snapshots.length - 1];
            return (
              <li key={route.id} className="rounded-lg bg-deal-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold">
                      {route.origin} → {route.destination}
                    </span>
                    <span className="ml-2 text-xs text-white/40">
                      {route.departDate}
                      {route.returnDate ? ` – ${route.returnDate}` : " (one-way)"}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(route.id)}
                    className="text-xs text-white/40 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>

                {latest ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-bold text-deal-accent">
                      ${latest.price}
                    </span>
                    <span className="text-xs text-white/40">
                      {route.anomaly?.sampleSize ?? 0} prior snapshot(s)
                    </span>
                    {route.anomaly?.isAnomaly && (
                      <span className="rounded-full bg-deal-good px-2 py-0.5 text-xs font-medium text-deal-bg">
                        🔥 Deal detected: {Math.round(route.anomaly.percentBelowMedian * 100)}% below normal
                      </span>
                    )}
                    {route.anomaly && !route.anomaly.isAnomaly && route.anomaly.sampleSize < 3 && (
                      <span className="text-xs text-white/40">
                        Building history — need at least 3 snapshots to detect deals
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-white/40">
                    No price collected yet — click &quot;Collect prices now&quot;.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
