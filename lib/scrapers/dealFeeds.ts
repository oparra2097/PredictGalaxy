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

export async function scanDealFeeds(): Promise<{
  deals: DealPost[];
  errors: { source: string; message: string }[];
}> {
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

  return { deals, errors };
}
