import { NextRequest, NextResponse } from "next/server";
import { searchAllProviders } from "@/lib/providers";
import { scoreOffers } from "@/lib/scoring";
import { findDealsForRoute } from "@/lib/scrapers/dealFeeds";
import type { DealPost } from "@/lib/scrapers/dealFeeds";

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

  // Best-effort deal-blog cross-check — a feed outage must never take the
  // core search down with it.
  let relatedDeals: DealPost[] = [];
  try {
    relatedDeals = await findDealsForRoute(origin, destination);
  } catch {
    // ignore — section simply won't render
  }

  return NextResponse.json({ offers: scored, relatedDeals, errors });
}
