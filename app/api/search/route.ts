import { NextRequest, NextResponse } from "next/server";
import { searchAllProviders } from "@/lib/providers";
import { scoreOffers } from "@/lib/scoring";
import { findDealsForRoute } from "@/lib/scrapers/dealFeeds";
import type { DealPost } from "@/lib/scrapers/dealFeeds";
import {
  fetchMonthCheapest,
  travelpayoutsProvider,
  type FlexDatePrice,
} from "@/lib/providers/travelpayouts";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const origin = params.get("origin");
  const destination = params.get("destination");
  const departDate = params.get("departDate");
  const returnDate = params.get("returnDate") || undefined;
  const adults = parseInt(params.get("adults") || "1", 10);

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: "origin, destination, and departDate are required" },
      { status: 400 }
    );
  }

  const { offers, errors } = await searchAllProviders({
    origin,
    destination,
    departDate,
    returnDate,
    adults: Number.isFinite(adults) && adults > 0 ? adults : 1,
  });

  const scored = scoreOffers(offers);

  // Seller-spread signal: when two independent sources disagree sharply on
  // the cheapest price for the same trip, the low one is usually an OTA
  // outlier (consolidator fare) — a deal in its own right, distinct from
  // the route-history anomaly signal.
  let spread: {
    provider: string;
    price: number;
    otherProvider: string;
    otherPrice: number;
    percent: number;
  } | null = null;
  const cheapestByProvider = new Map<string, number>();
  for (const offer of offers) {
    const current = cheapestByProvider.get(offer.provider);
    if (current === undefined || offer.price < current) {
      cheapestByProvider.set(offer.provider, offer.price);
    }
  }
  if (cheapestByProvider.size >= 2) {
    const entries = [...cheapestByProvider.entries()].sort((a, b) => a[1] - b[1]);
    const [bestProvider, bestPrice] = entries[0];
    const [otherProvider, otherPrice] = entries[entries.length - 1];
    const percent = 1 - bestPrice / otherPrice;
    if (percent >= 0.3) {
      spread = { provider: bestProvider, price: bestPrice, otherProvider, otherPrice, percent };
    }
  }

  // Best-effort extras — neither a feed outage nor a flex-date lookup
  // failure may take the core search down with it.
  let relatedDeals: DealPost[] = [];
  try {
    relatedDeals = await findDealsForRoute(origin, destination);
  } catch {
    // ignore — section simply won't render
  }

  // Cached-fare APIs are thin for any single exact date, so also return the
  // cheapest fare per day for the searched month when Travelpayouts is on.
  let flexDates: FlexDatePrice[] = [];
  if (travelpayoutsProvider.isConfigured()) {
    try {
      flexDates = await fetchMonthCheapest(
        origin,
        destination,
        departDate.slice(0, 7),
        !returnDate
      );
    } catch {
      // ignore — strip simply won't render
    }
  }

  return NextResponse.json({ offers: scored, relatedDeals, flexDates, spread, errors });
}
