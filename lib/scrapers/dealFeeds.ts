import Parser from "rss-parser";

export interface DealPost {
  id: string;
  source: string;
  title: string;
  link: string;
  publishedAt: string | undefined;
  price: number | null;
  route: string | null;
  summary: string;
}

/**
 * Independent flight-deal and travel blogs that publish public RSS feeds.
 * This reads feeds the sites intentionally syndicate, not screen-scraped
 * HTML — the same content their own subscribers get. Broader than pure
 * "deal" blogs on purpose (points/travel blogs post mistake fares too);
 * scoring and the price/route regex do the filtering downstream.
 *
 * These URLs follow each site's standard WordPress /feed/ convention but
 * are NOT verified live — this sandbox's network policy blocks outbound
 * requests to arbitrary domains (see README). Run locally or deployed and
 * check the `errors` array this module returns; report back any dead URLs
 * so they can be fixed.
 */
const DEAL_FEEDS: { source: string; url: string }[] = [
  { source: "The Flight Deal", url: "https://www.theflightdeal.com/feed/" },
  { source: "Secret Flying", url: "https://www.secretflying.com/feed/" },
  { source: "Fly4Free", url: "https://www.fly4free.com/feed/" },
  { source: "Thrifty Traveler", url: "https://thriftytraveler.com/feed/" },
  { source: "God Save The Points", url: "https://www.godsavethepoints.com/feed/" },
  { source: "Live and Let's Fly", url: "https://liveandletsfly.com/feed/" },
  { source: "One Mile at a Time", url: "https://onemileatatime.com/feed/" },
  { source: "The Points Guy", url: "https://thepointsguy.com/feed/" },
  { source: "Johnny Jet", url: "https://johnnyjet.com/feed/" },
  { source: "Map Happy", url: "https://maphappy.org/feed/" },
];

const PRICE_RE = /\$\s?(\d{2,4})/;
const ROUTE_RE = /\b([A-Z]{3})\s?(?:-|to|–|—)\s?([A-Z]{3})\b/;

function extractPrice(text: string): number | null {
  const match = PRICE_RE.exec(text);
  return match ? parseInt(match[1], 10) : null;
}

function extractRoute(text: string): string | null {
  const match = ROUTE_RE.exec(text);
  return match ? `${match[1]}-${match[2]}` : null;
}

const parser = new Parser({
  // A slow blog must never stall a flight search now that feeds are also
  // scanned inline with /api/search.
  timeout: 5000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; OdysseySkyBot/1.0; +https://odysseysky.app/bot)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

async function fetchFeed(source: string, url: string): Promise<DealPost[]> {
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, 15).map((item, i) => {
    const title = item.title || "Untitled deal";
    const summary = (item.contentSnippet || item.content || "").slice(0, 240);
    const combinedText = `${title} ${summary}`;

    return {
      id: `${source}-${i}-${item.link || title}`,
      source,
      title,
      link: item.link || url,
      publishedAt: item.isoDate || item.pubDate,
      price: extractPrice(combinedText),
      route: extractRoute(combinedText),
      summary,
    };
  });
}

interface ScanResult {
  deals: DealPost[];
  errors: { source: string; message: string }[];
}

// Feeds get hit from /api/deals AND from every /api/search now, so cache
// the scan in-process — 10 RSS fetches per page load would hammer the
// blogs and slow every search.
let scanCache: { at: number; result: ScanResult } | null = null;
const SCAN_CACHE_TTL_MS = 15 * 60 * 1000;

export async function scanDealFeeds(): Promise<ScanResult> {
  if (scanCache && Date.now() - scanCache.at < SCAN_CACHE_TTL_MS) {
    return scanCache.result;
  }

  const errors: { source: string; message: string }[] = [];

  const results = await Promise.all(
    DEAL_FEEDS.map(async ({ source, url }) => {
      try {
        return await fetchFeed(source, url);
      } catch (err) {
        errors.push({
          source,
          message: err instanceof Error ? err.message : "Unknown error",
        });
        return [];
      }
    })
  );

  const deals = results
    .flat()
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

  const result = { deals, errors };
  scanCache = { at: Date.now(), result };
  return result;
}

/**
 * Search-time cross-check: surfaces recent deal-blog posts that plausibly
 * mention the searched route. Matches on extracted IATA route first, then
 * word-boundary city-name mentions (destination-focused — a deal post is
 * about where you're going, not where you start).
 */
export async function findDealsForRoute(
  origin: string,
  destination: string
): Promise<DealPost[]> {
  const { cityForCode } = await import("../airports");
  const { deals } = await scanDealFeeds();

  const o = origin.toUpperCase();
  const d = destination.toUpperCase();
  const originCity = cityForCode(o);
  const destCity = cityForCode(d);

  const cityMentioned = (text: string, city: string | null) => {
    if (!city || city.length < 4) return false;
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  };

  const scored = deals
    .map((deal) => {
      const text = `${deal.title} ${deal.summary}`;
      let score = 0;
      if (deal.route?.includes(o) && deal.route?.includes(d)) score = 3;
      else if (deal.route?.includes(d) || cityMentioned(text, destCity)) score = 2;
      else if (deal.route?.includes(o) || cityMentioned(text, originCity)) score = 1;
      return { deal, score };
    })
    .filter((s) => s.score >= 2);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.deal);
}
