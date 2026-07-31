import { searchAllProviders } from "./providers";
import type { FlightOffer } from "./providers/types";

/**
 * Major European hub airports to try as a connection point. This is
 * "virtual interlining" — Kiwi.com's original approach — combining two
 * separate one-way tickets (which don't need to be the same airline or
 * alliance) instead of relying on a single connecting itinerary.
 */
export const EUROPEAN_HUBS = [
  "LHR", "CDG", "FRA", "AMS", "MAD", "FCO", "MUC", "ZRH", "VIE", "LIS",
  "BCN", "CPH", "DUB", "BRU", "ATH", "WAW", "MXP", "OSL", "ARN", "HEL",
];

// Separate tickets mean landside transfer: immigration, baggage reclaim,
// and a fresh check-in/security run — real minimum connection time is
// longer than what a single protected itinerary needs.
const MIN_CONNECTION_MINUTES = 180;
const MAX_LAYOVER_HOURS = 48;

export interface SelfTransferCombo {
  hub: string;
  leg1: FlightOffer;
  leg2: FlightOffer;
  totalPrice: number;
  currency: string;
  layoverMinutes: number;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function searchLeg(
  origin: string,
  destination: string,
  departDate: string,
  adults: number
): Promise<FlightOffer[]> {
  const { offers } = await searchAllProviders({ origin, destination, departDate, adults });
  return offers;
}

/**
 * For each candidate hub, finds the cheapest origin->hub / hub->destination
 * pairing with a connection time that's actually workable for separate
 * tickets, and ranks hubs by combined price. Runs three provider searches
 * per hub (leg1, leg2 same-day, leg2 next-day) — with a real metered
 * provider like Amadeus that's meaningful API quota per search, see README.
 */
export async function searchSelfTransfer(
  origin: string,
  destination: string,
  departDate: string,
  adults: number
): Promise<{ combos: SelfTransferCombo[]; errors: { hub: string; message: string }[] }> {
  const hubs = EUROPEAN_HUBS.filter(
    (h) => h !== origin.toUpperCase() && h !== destination.toUpperCase()
  );
  const errors: { hub: string; message: string }[] = [];

  const results = await Promise.all(
    hubs.map(async (hub) => {
      try {
        const [leg1Offers, leg2SameDay, leg2NextDay] = await Promise.all([
          searchLeg(origin, hub, departDate, adults),
          searchLeg(hub, destination, departDate, adults),
          searchLeg(hub, destination, addDays(departDate, 1), adults),
        ]);
        const leg2Offers = [...leg2SameDay, ...leg2NextDay];

        let best: SelfTransferCombo | null = null;
        for (const leg1 of leg1Offers) {
          const leg1Arrive = new Date(leg1.arriveAt).getTime();
          for (const leg2 of leg2Offers) {
            const leg2Depart = new Date(leg2.departAt).getTime();
            const layoverMinutes = (leg2Depart - leg1Arrive) / 60000;
            if (
              layoverMinutes >= MIN_CONNECTION_MINUTES &&
              layoverMinutes <= MAX_LAYOVER_HOURS * 60
            ) {
              const totalPrice = leg1.price + leg2.price;
              if (!best || totalPrice < best.totalPrice) {
                best = { hub, leg1, leg2, totalPrice, currency: leg1.currency, layoverMinutes };
              }
            }
          }
        }
        return best;
      } catch (err) {
        errors.push({ hub, message: err instanceof Error ? err.message : "Unknown error" });
        return null;
      }
    })
  );

  const combos = results
    .filter((c): c is SelfTransferCombo => c !== null)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  return { combos, errors };
}
