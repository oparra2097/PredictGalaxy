import type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";

/**
 * Travelpayouts (the affiliate/data platform behind Aviasales). Unlike a
 * live-quote GDS API, this serves *cached* prices collected from real user
 * searches — ideal for a deal scanner (broad, free, instant signup), with
 * the tradeoff that a price needs re-verification at booking time. The
 * deep link lands on Aviasales with the affiliate marker attached, which
 * is also this product's natural revenue model.
 *
 * Env: TRAVELPAYOUTS_TOKEN (API token from the Travelpayouts profile),
 * optional TRAVELPAYOUTS_MARKER (affiliate id for monetized links).
 */

const API_BASE = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";

interface TravelpayoutsItem {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at?: string;
  transfers: number;
  duration_to?: number;
  duration?: number;
  link?: string;
}

export const travelpayoutsProvider: FlightProvider = {
  name: "travelpayouts",
  isConfigured() {
    return Boolean(process.env.TRAVELPAYOUTS_TOKEN);
  },
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) throw new Error("Travelpayouts token is not configured");

    const query = new URLSearchParams({
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      departure_at: params.departDate,
      currency: "usd",
      sorting: "price",
      limit: "30",
      one_way: params.returnDate ? "false" : "true",
      token,
    });
    if (params.returnDate) query.set("return_at", params.returnDate);

    const res = await fetch(`${API_BASE}?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Travelpayouts search failed: ${res.status} ${await res.text()}`);
    }

    const body = (await res.json()) as { success: boolean; data?: TravelpayoutsItem[] };
    if (!body.success || !Array.isArray(body.data)) {
      throw new Error("Travelpayouts returned an unexpected response shape");
    }

    const marker = process.env.TRAVELPAYOUTS_MARKER;

    return body.data.map((item, i) => {
      const durationMinutes = item.duration_to ?? item.duration ?? 0;
      const departAt = item.departure_at;
      const arriveAt =
        durationMinutes > 0
          ? new Date(new Date(departAt).getTime() + durationMinutes * 60000).toISOString()
          : departAt;

      const deepLink = item.link
        ? `https://www.aviasales.com${item.link}${marker ? `&marker=${marker}` : ""}`
        : `https://www.google.com/travel/flights?q=Flights%20from%20${params.origin}%20to%20${params.destination}%20on%20${params.departDate}`;

      return {
        id: `travelpayouts-${item.airline}${item.flight_number}-${i}`,
        provider: "travelpayouts",
        origin: item.origin || params.origin.toUpperCase(),
        destination: item.destination || params.destination.toUpperCase(),
        departDate: params.departDate,
        returnDate: params.returnDate,
        airline: item.airline,
        price: Math.round(item.price),
        currency: "USD",
        stops: item.transfers ?? 0,
        durationMinutes,
        departAt,
        arriveAt,
        deepLink,
      };
    });
  },
};
