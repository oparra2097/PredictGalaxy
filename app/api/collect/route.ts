import { NextResponse } from "next/server";
import { searchAllProviders } from "@/lib/providers";
import { detectAnomaly } from "@/lib/anomaly";
import { getSnapshots, listWatchedRoutes, recordSnapshot } from "@/lib/priceHistory";

/**
 * Snapshots the current cheapest price for every watched route. Intended to
 * be called on a schedule (e.g. Vercel Cron or a GitHub Actions cron hitting
 * this endpoint hourly) so price history builds up over time — a single
 * call only adds one data point per route.
 */
export async function POST() {
  const routes = listWatchedRoutes();
  const results = [];

  for (const route of routes) {
    try {
      const { offers } = await searchAllProviders({
        origin: route.origin,
        destination: route.destination,
        departDate: route.departDate,
        returnDate: route.returnDate || undefined,
        adults: 1,
      });

      if (offers.length === 0) {
        results.push({ routeId: route.id, error: "No offers found" });
        continue;
      }

      const cheapest = offers.reduce((min, o) => (o.price < min.price ? o : min));
      const priorHistory = getSnapshots(route.id).map((s) => s.price);
      const anomaly = detectAnomaly(priorHistory, cheapest.price);

      recordSnapshot(route.id, cheapest.price, cheapest.currency, cheapest.airline);

      results.push({
        routeId: route.id,
        origin: route.origin,
        destination: route.destination,
        price: cheapest.price,
        currency: cheapest.currency,
        anomaly,
      });
    } catch (err) {
      results.push({
        routeId: route.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ collected: results.length, results });
}
