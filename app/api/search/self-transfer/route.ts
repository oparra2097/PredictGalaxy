import { NextRequest, NextResponse } from "next/server";
import { searchSelfTransfer } from "@/lib/selfTransfer";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const origin = params.get("origin");
  const destination = params.get("destination");
  const departDate = params.get("departDate");
  const adults = parseInt(params.get("adults") || "1", 10);

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: "origin, destination, and departDate are required" },
      { status: 400 }
    );
  }

  const { combos, errors } = await searchSelfTransfer(
    origin,
    destination,
    departDate,
    Number.isFinite(adults) && adults > 0 ? adults : 1
  );

  return NextResponse.json({ combos, errors });
}
