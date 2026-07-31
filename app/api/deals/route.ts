import { NextResponse } from "next/server";
import { scanDealFeeds } from "@/lib/scrapers/dealFeeds";

export const revalidate = 900; // cache deal feed for 15 minutes

export async function GET() {
  const { deals, errors } = await scanDealFeeds();
  return NextResponse.json({ deals, errors });
}
