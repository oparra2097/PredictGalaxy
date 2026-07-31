import { NextRequest, NextResponse } from "next/server";
import { addWatchedRoute, listWatchedRoutesWithHistory } from "@/lib/priceHistory";

export async function GET() {
  const routes = listWatchedRoutesWithHistory();
  return NextResponse.json({ routes });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { origin, destination, departDate, returnDate } = body;

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: "origin, destination, and departDate are required" },
      { status: 400 }
    );
  }

  const route = addWatchedRoute(origin, destination, departDate, returnDate || undefined);
  return NextResponse.json({ route });
}
