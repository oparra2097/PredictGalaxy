import { NextRequest, NextResponse } from "next/server";
import { searchAllProviders } from "@/lib/providers";
import { scoreOffers } from "@/lib/scoring";

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

  return NextResponse.json({ offers: scored, errors });
}
