import type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";

/**
 * Google Flights results via SerpApi (serpapi.com — self-serve signup,
 * free tier ~100 searches/month). Complements Travelpayouts: Google
 * Flights leans airline-direct pricing while Travelpayouts caches OTA
 * fares, so disagreement between the two is itself a signal (see the
 * spread detection in /api/search).
 *
 * Env: SERPAPI_KEY.
 */

const API_BASE = "https://serpapi.com/search.json";

interface SerpApiSegment {
  departure_airport?: { id?: string; time?: string };
  arrival_airport?: { id?: string; time?: string };
  airline?: string;
}

interface SerpApiItinerary {
  flights?: SerpApiSegment[];
  total_duration?: number;
  price?: number;
}

interface SerpApiResponse {
  best_flights?: SerpApiItinerary[];
  other_flights?: SerpApiItinerary[];
  error?: string;
}

/** "2026-08-13 09:35" → ISO-ish local timestamp our UI can render. */
function toIso(time: string | undefined, fallbackDate: string): string {
  if (!time) return `${fallbackDate}T00:00:00`;
  return `${time.replace(" ", "T")}:00`;
}

export const serpapiProvider: FlightProvider = {
  name: "google-flights",
  isConfigured() {
    return Boolean(process.env.SERPAPI_KEY);
  },
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    const key = process.env.SERPAPI_KEY;
    if (!key) throw new Error("SerpApi key is not configured");

    const query = new URLSearchParams({
      engine: "google_flights",
      departure_id: params.origin.toUpperCase(),
      arrival_id: params.destination.toUpperCase(),
      outbound_date: params.departDate,
      currency: "USD",
      // 1 = round trip (requires return_date), 2 = one way
      type: params.returnDate ? "1" : "2",
      adults: String(params.adults || 1),
      api_key: key,
    });
    if (params.returnDate) query.set("return_date", params.returnDate);

    const res = await fetch(`${API_BASE}?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`SerpApi search failed: ${res.status} ${await res.text()}`);
    }

    const body = (await res.json()) as SerpApiResponse;
    if (body.error) {
      throw new Error(`SerpApi: ${body.error}`);
    }

    const itineraries = [...(body.best_flights || []), ...(body.other_flights || [])]
      .filter((it) => typeof it.price === "number" && (it.flights?.length || 0) > 0)
      .slice(0, 15);

    return itineraries.map((it, i) => {
      const segments = it.flights!;
      const first = segments[0];
      const last = segments[segments.length - 1];

      return {
        id: `google-flights-${i}`,
        provider: "google-flights",
        origin: first.departure_airport?.id || params.origin.toUpperCase(),
        destination: last.arrival_airport?.id || params.destination.toUpperCase(),
        departDate: params.departDate,
        returnDate: params.returnDate,
        airline: first.airline || "Unknown",
        price: Math.round(it.price!),
        currency: "USD",
        stops: segments.length - 1,
        durationMinutes: it.total_duration || 0,
        departAt: toIso(first.departure_airport?.time, params.departDate),
        arriveAt: toIso(last.arrival_airport?.time, params.departDate),
        deepLink: `https://www.google.com/travel/flights?q=Flights%20from%20${params.origin}%20to%20${params.destination}%20on%20${params.departDate}`,
      };
    });
  },
};
