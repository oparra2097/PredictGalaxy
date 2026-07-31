import type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";

const AMADEUS_BASE_URL =
  process.env.AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Amadeus credentials are not configured");
  }

  const res = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // refresh a little early
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

interface AmadeusFlightOffer {
  id: string;
  price: { total: string; currency: string };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      carrierCode: string;
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
    }>;
  }>;
}

function parseIsoDurationToMinutes(iso: string): number {
  const match = /P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  const hours = match?.[1] ? parseInt(match[1], 10) : 0;
  const minutes = match?.[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + minutes;
}

export const amadeusProvider: FlightProvider = {
  name: "amadeus",
  isConfigured() {
    return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  },
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    const token = await getAccessToken();

    const query = new URLSearchParams({
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departDate,
      adults: String(params.adults || 1),
      currencyCode: "USD",
      max: "20",
    });
    if (params.returnDate) {
      query.set("returnDate", params.returnDate);
    }

    const res = await fetch(
      `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${query.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Amadeus search failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { data: AmadeusFlightOffer[] };

    return (data.data || []).map((offer) => {
      const firstItinerary = offer.itineraries[0];
      const firstSegment = firstItinerary.segments[0];
      const stops = firstItinerary.segments.length - 1;

      return {
        id: `amadeus-${offer.id}`,
        provider: "amadeus",
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        departDate: params.departDate,
        returnDate: params.returnDate,
        airline: firstSegment.carrierCode,
        price: Math.round(parseFloat(offer.price.total)),
        currency: offer.price.currency,
        stops,
        durationMinutes: parseIsoDurationToMinutes(firstItinerary.duration),
        deepLink: `https://www.google.com/travel/flights?q=Flights%20from%20${params.origin}%20to%20${params.destination}%20on%20${params.departDate}`,
      };
    });
  },
};
