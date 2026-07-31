"use client";

import { useEffect, useState } from "react";
import SearchForm, { SearchValues } from "@/components/SearchForm";
import FlightResults from "@/components/FlightResults";
import DealFeed from "@/components/DealFeed";
import WatchedRoutes, { WatchedRouteWithHistory } from "@/components/WatchedRoutes";
import type { ScoredFlightOffer } from "@/lib/scoring";
import type { DealPost } from "@/lib/scrapers/dealFeeds";

export default function Home() {
  const [offers, setOffers] = useState<ScoredFlightOffer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearch, setLastSearch] = useState<SearchValues | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackedMessage, setTrackedMessage] = useState<string | null>(null);

  const [deals, setDeals] = useState<DealPost[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  const [watchedRoutes, setWatchedRoutes] = useState<WatchedRouteWithHistory[]>([]);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((data) => setDeals(data.deals || []))
      .finally(() => setDealsLoading(false));
    refreshWatchedRoutes();
  }, []);

  async function refreshWatchedRoutes() {
    const res = await fetch("/api/routes");
    const data = await res.json();
    setWatchedRoutes(data.routes || []);
  }

  async function handleSearch(values: SearchValues) {
    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);
    setTrackedMessage(null);
    try {
      const params = new URLSearchParams({
        origin: values.origin,
        destination: values.destination,
        departDate: values.departDate,
        adults: String(values.adults),
      });
      if (values.returnDate) params.set("returnDate", values.returnDate);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setOffers(data.offers || []);
      setLastSearch(values);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleTrackRoute() {
    if (!lastSearch) return;
    setTracking(true);
    setTrackedMessage(null);
    try {
      await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastSearch),
      });
      await refreshWatchedRoutes();
      setTrackedMessage("Tracking started — collect prices over time to detect real deals.");
    } finally {
      setTracking(false);
    }
  }

  async function handleCollect() {
    setCollecting(true);
    try {
      await fetch("/api/collect", { method: "POST" });
      await refreshWatchedRoutes();
    } finally {
      setCollecting(false);
    }
  }

  async function handleRemoveRoute(id: number) {
    await fetch(`/api/routes/${id}`, { method: "DELETE" });
    await refreshWatchedRoutes();
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">OdysseySky</h1>
        <p className="mt-1 text-white/50">
          Ad-free flight deal scanning across airline data and independent deal blogs.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <SearchForm onSearch={handleSearch} loading={searchLoading} />
        {searchError && <p className="text-red-400">{searchError}</p>}
        {hasSearched && !searchLoading && (
          <>
            <FlightResults offers={offers} />
            {offers.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTrackRoute}
                  disabled={tracking}
                  className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50"
                >
                  {tracking ? "Tracking…" : "Track this route for price-drop alerts"}
                </button>
                {trackedMessage && (
                  <span className="text-sm text-deal-good">{trackedMessage}</span>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Tracked routes</h2>
        <WatchedRoutes
          routes={watchedRoutes}
          collecting={collecting}
          onCollect={handleCollect}
          onRemove={handleRemoveRoute}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Latest deal-blog finds</h2>
        {dealsLoading ? (
          <p className="text-white/50">Scanning deal blogs…</p>
        ) : (
          <DealFeed deals={deals} />
        )}
      </section>
    </main>
  );
}
