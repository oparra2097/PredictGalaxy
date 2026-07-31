"use client";

import { useEffect, useState } from "react";
import SearchForm, { SearchValues } from "@/components/SearchForm";
import FlightResults from "@/components/FlightResults";
import DealFeed from "@/components/DealFeed";
import type { ScoredFlightOffer } from "@/lib/scoring";
import type { DealPost } from "@/lib/scrapers/dealFeeds";

export default function Home() {
  const [offers, setOffers] = useState<ScoredFlightOffer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [deals, setDeals] = useState<DealPost[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((data) => setDeals(data.deals || []))
      .finally(() => setDealsLoading(false));
  }, []);

  async function handleSearch(values: SearchValues) {
    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);
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
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">Fareflock</h1>
        <p className="mt-1 text-white/50">
          Ad-free flight deal scanning across airline data and independent deal blogs.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <SearchForm onSearch={handleSearch} loading={searchLoading} />
        {searchError && <p className="text-red-400">{searchError}</p>}
        {hasSearched && !searchLoading && (
          <FlightResults offers={offers} />
        )}
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
