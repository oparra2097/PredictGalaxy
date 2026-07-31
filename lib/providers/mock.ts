import type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";

const AIRLINES = [
  "United",
  "Delta",
  "American",
  "JetBlue",
  "Southwest",
  "Frontier",
  "Spirit",
  "Icelandair",
  "TAP Air Portugal",
  "Norse Atlantic",
];

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

/**
 * A route's "true" base price stays stable (seeded by route+date only), but
 * a day-seeded market factor nudges it up/down like real fares do, with an
 * occasional larger drop to simulate a mistake fare. This is what lets
 * repeated /api/collect snapshots build a history with real variance for
 * the anomaly detector to evaluate, instead of an identical number forever.
 */
function dailyMarketFactor(seedKey: string): number {
  const dayKey = new Date().toISOString().slice(0, 10);
  const rand = seededRandom(`${seedKey}-${dayKey}`);
  const roll = rand();
  if (roll < 0.08) {
    // Simulated mistake fare / flash sale.
    return 0.45 + rand() * 0.2;
  }
  return 0.9 + rand() * 0.2;
}

/**
 * Deterministic mock provider so the app is usable with zero API keys.
 * Swap in a real provider (see amadeus.ts) once you have credentials.
 */
export const mockProvider: FlightProvider = {
  name: "mock",
  isConfigured() {
    return true;
  },
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    const routeKey = `${params.origin}-${params.destination}-${params.departDate}`;
    const rand = seededRandom(routeKey);
    const basePrice = (120 + rand() * 550) * dailyMarketFactor(routeKey);
    const count = 6 + Math.floor(rand() * 5);

    return Array.from({ length: count }, (_, i) => {
      const airline = AIRLINES[Math.floor(rand() * AIRLINES.length)];
      const variance = (rand() - 0.4) * 0.6;
      const price = Math.max(59, Math.round(basePrice * (1 + variance)));
      const stops = rand() < 0.45 ? 0 : rand() < 0.8 ? 1 : 2;
      const durationMinutes = 90 + stops * 80 + Math.floor(rand() * 240);

      const departHour = Math.floor(rand() * 22);
      const departMinute = Math.floor(rand() * 60);
      const departAt = new Date(
        `${params.departDate}T${String(departHour).padStart(2, "0")}:${String(
          departMinute
        ).padStart(2, "0")}:00Z`
      );
      const arriveAt = new Date(departAt.getTime() + durationMinutes * 60000);

      return {
        id: `mock-${params.origin}-${params.destination}-${i}`,
        provider: "mock",
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        departDate: params.departDate,
        returnDate: params.returnDate,
        airline,
        price,
        currency: "USD",
        stops,
        durationMinutes,
        departAt: departAt.toISOString(),
        arriveAt: arriveAt.toISOString(),
        deepLink: `https://www.google.com/travel/flights?q=Flights%20from%20${params.origin}%20to%20${params.destination}%20on%20${params.departDate}`,
      };
    });
  },
};
