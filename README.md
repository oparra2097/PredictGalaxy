# OdysseySky — Flight Deal Aggregator

An ad-free flight deal scanner: it queries flight-offer APIs directly and
scans independent deal-blog RSS feeds, then scores everything by price
relative to the route so the best deals surface first — no sponsored
placements.

## How it works

- **`lib/providers/`** — a small provider interface (`FlightProvider`).
  - `mock.ts`: deterministic, realistic sample offers. Works with zero
    setup so you can run the app immediately.
  - `amadeus.ts`: real flight-offer search via the [Amadeus Self-Service
    API](https://developers.amadeus.com/register) (free test tier). Add
    credentials in `.env.local` (see `.env.example`) to switch from mock to
    real data automatically — `lib/providers/index.ts` prefers any
    configured real provider and falls back to mock otherwise.
  - Add another provider (Kiwi Tequila, Duffel, Skyscanner via RapidAPI,
    etc.) by implementing the same `FlightProvider` interface and
    registering it in `lib/providers/index.ts`.
- **`lib/scrapers/dealFeeds.ts`** — pulls the public RSS feeds that
  independent flight-deal blogs (The Flight Deal, Secret Flying, Fly4Free)
  already publish for syndication, and extracts price/route hints from each
  post with lightweight regex. This is reading feeds sites intentionally
  publish, not screen-scraping HTML.
- **`lib/scoring.ts`** — ranks offers against the median price for that
  specific search (not a fixed dollar amount), tagging the cheapest as
  "Best deal" and penalizing extra stops slightly.
- **`app/api/search/route.ts`** — `GET /api/search?origin=JFK&destination=LIS&departDate=2026-09-01`
  fans out to every configured provider in parallel and returns scored
  offers.
- **`app/api/deals/route.ts`** — `GET /api/deals` returns the latest scanned
  deal-blog posts, cached 15 minutes.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The search form works immediately using mock
data. To get real flight prices, copy `.env.example` to `.env.local` and
add free Amadeus test credentials.

## Known limitation in this sandbox

Outbound requests to the deal-blog RSS feeds are blocked by this
development sandbox's network policy (not by the sites — verified via
direct `CONNECT` failures at the proxy level). The deal-feed scanner is
implemented and degrades gracefully (empty list, no crash) when feeds are
unreachable; it will pull live posts once deployed somewhere with normal
outbound internet access (Vercel, your own server, etc.).

## Next steps to grow this into a real product

1. **Add more real providers** (Kiwi Tequila has a generous free tier,
   Duffel is developer-friendly) so results aren't Amadeus-only.
2. **Persist and diff prices over time** (e.g. a cron job + database) to
   detect genuine price drops/error fares instead of just point-in-time
   comparisons.
3. **Add more deal-blog sources** and tighten the price/route extraction
   (an LLM call per post is more robust than regex for messy titles).
4. **Add flexible-date search** ("cheapest day in the next 3 months") since
   that's where most real deals live.
5. **Alerts**: let users save a route and get notified when a new post or
   API result beats their target price.

## Security notes

`npm audit` flags two issues nested *inside* Next.js's own bundled
dependencies (an internal `postcss` copy used by its build pipeline, and
the optional `sharp` image-optimization library, which this app doesn't
use since no `next/image` usage exists yet). They aren't reachable from
this app's code and will clear once Next.js ships a patch release.
