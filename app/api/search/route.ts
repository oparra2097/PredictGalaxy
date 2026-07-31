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

  return NextResponse.json({ offers: scored, relatedDeals, flexDates, errors });
}
