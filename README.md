# OdysseySky — Flight Deal Aggregator

An ad-free flight deal scanner: it queries flight-offer APIs directly and
scans independent deal-blog RSS feeds, then scores everything by price
relative to the route so the best deals surface first — no sponsored
placements.

This is the backend + web app. There's also a native mobile client in
[`mobile/`](./mobile) (React Native / Expo) that talks to the same API —
see `mobile/README.md` to run it on your phone via Expo Go.

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

### Price-history anomaly detection

Point-in-time results (what the search tab shows) are inherently a Kayak-style
metasearch: whatever partners report right now, sorted. A real deal is
relative to a route's *own* history — the same $400 fare is unremarkable on
one route and a mistake fare on another — so a second engine tracks that:

- **`lib/db.ts`** — a local SQLite database (`data/odysseysky.db`, gitignored)
  with two tables: `watched_routes` and `price_snapshots`.
- **`lib/priceHistory.ts`** — CRUD for watched routes and their price
  snapshots.
- **`lib/anomaly.ts`** — flags a new price as a real deal only when it's a
  statistical outlier vs. that route's prior snapshots (≥20% below the
  median, or a z-score ≤ -1.5), and only once at least 3 snapshots exist so
  a single noisy reading can't trigger a false "deal."
- **`app/api/routes`** (GET/POST) and **`app/api/routes/[id]`** (DELETE) —
  manage which routes are being tracked.
- **`app/api/collect`** (POST) — snapshots the current cheapest price for
  every tracked route and records it. Call this on a schedule (Vercel Cron,
  a GitHub Actions cron job, or any external scheduler hitting the endpoint
  hourly/daily) so history actually accumulates — a single call only adds
  one data point per route. In the UI, search a route, click "Track this
  route," then use "Collect prices now" to add snapshots manually while
  testing.

This is the same underlying mechanism as tools like Going.com or Thrifty
Traveler: watch a specific search over time and flag when it's genuinely
unusual, rather than presenting whatever prices happen to be available today.

### Self-transfer via any European hub

"Fly via any European hub" search on the home page does what Kiwi.com calls
"virtual interlining": instead of one connecting itinerary, it books two
separate one-way tickets — origin → hub and hub → final destination — which
can be cheaper and can combine airlines that don't otherwise interline
(e.g. Turkish Airlines into Athens, then a separate ticket on Icelandair
out to JFK).

- **`lib/selfTransfer.ts`** — tries each hub in `EUROPEAN_HUBS` (20 major
  airports), searches origin→hub and hub→destination (both same-day and
  next-day, to catch overnight connections) via the existing provider
  search, pairs them by a valid connection window, and ranks hubs by
  combined price.
- Connection-time math requires real timestamps, so `FlightOffer` now
  carries `departAt`/`arriveAt` (both `mock.ts` and `amadeus.ts` populate
  these — Amadeus from the actual first/last segment times).
- Minimum connection is set to **3 hours**, not the ~45–90 min minimum
  connection time (MCT) a single ticket allows — separate tickets mean
  landside transfer: immigration, baggage reclaim, and a fresh
  check-in/security run. Max layover is capped at 48h so results don't
  include multi-day gaps unless that's genuinely what's cheapest.
- **Real risk, surfaced in the UI, not hidden**: self-transfer has no
  missed-connection protection. If leg 1 is delayed and you miss leg 2,
  the airline operating leg 2 owes you nothing — you bought two unrelated
  tickets. Every result carries that disclaimer. There's also a landside
  transfer at the hub, which can mean needing a transit/Schengen visa
  depending on nationality and hub country — not modeled here, worth
  checking before booking.
- **API cost with a real provider**: this runs 3 searches per hub × 20 hubs
  = 60 provider calls per self-transfer search. Fine with the mock
  provider (instant, local); expensive against a metered API like Amadeus's
  free tier. Consider trimming `EUROPEAN_HUBS` down once a real provider is
  wired in, or gating this search behind an explicit rate limit.

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

This also means the 10 feed URLs in `lib/scrapers/dealFeeds.ts` are
best-effort (standard WordPress `/feed/` convention) and unverified — check
the `errors` array `/api/deals` returns after you run it somewhere with
real network access, and report back any that 404 so they can be fixed.

## Next steps to grow this into a real product

1. **Add more real providers** (Kiwi Tequila has a generous free tier,
   Duffel is developer-friendly) so results aren't Amadeus-only, and so
   `/api/collect` snapshots are based on real prices rather than mock data.
2. **Move price history to a hosted database** (Postgres via Neon/Supabase)
   before deploying anywhere serverless — local SQLite works for `npm run
   dev`, but a platform like Vercel gives function instances an ephemeral
   filesystem, so `data/odysseysky.db` won't persist across deploys or even
   across invocations.
3. **Schedule `/api/collect`** with Vercel Cron or a GitHub Actions cron job
   once deployed, so tracked routes actually build up history instead of
   only collecting when someone happens to click the button.
4. **Add more deal-blog sources** and tighten the price/route extraction
   (an LLM call per post is more robust than regex for messy titles).
5. **Add flexible-date search** ("cheapest day in the next 3 months") since
   that's where most real deals live.
6. **Notifications**: currently you have to open the app to see a flagged
   deal — wire up email/push when `/api/collect` finds a new anomaly.
7. **Targeted scraping of specific non-partner sites**, if/when you want to
   go beyond API + RSS coverage — deliberately deferred for now since it's
   ToS/legal-risk territory and an ongoing anti-bot maintenance burden, not
   a one-time build. Worth revisiting with specific named sites rather than
   scraping broadly.

## Security notes

`npm audit` flags two issues nested *inside* Next.js's own bundled
dependencies (an internal `postcss` copy used by its build pipeline, and
the optional `sharp` image-optimization library, which this app doesn't
use since no `next/image` usage exists yet). They aren't reachable from
this app's code and will clear once Next.js ships a patch release.
