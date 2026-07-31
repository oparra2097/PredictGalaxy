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
 * Independent flight-deal blogs that publish public RSS feeds. This reads
 * feeds the sites intentionally syndicate, not screen-scraped HTML — the
 * same content their own subscribers get.
 */
const DEAL_FEEDS: { source: string; url: string }[] = [
  { source: "The Flight Deal", url: "https://www.theflightdeal.com/feed/" },
  { source: "Secret Flying", url: "https://www.secretflying.com/feed/" },
  { source: "Fly4Free", url: "https://www.fly4free.com/feed/" },
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
      "Mozilla/5.0 (compatible; FareflockBot/1.0; +https://fareflock.app/bot)",
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
