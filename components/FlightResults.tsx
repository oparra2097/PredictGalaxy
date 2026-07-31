"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScoredFlightOffer } from "@/lib/scoring";

const LABEL_STYLES: Record<ScoredFlightOffer["label"], string> = {
  "best-deal": "bg-deal-good text-deal-bg",
  great: "bg-emerald-400/20 text-emerald-300",
  good: "bg-sky-400/20 text-sky-300",
  average: "bg-white/10 text-white/70",
  high: "bg-amber-400/20 text-amber-300",
};

const LABEL_TEXT: Record<ScoredFlightOffer["label"], string> = {
  "best-deal": "Best deal",
  great: "Great price",
  good: "Good price",
  average: "Average",
  high: "Above average",
};

type SortKey = "best" | "price" | "duration" | "depart";
type StopsFilter = "any" | "direct" | "one";

const selectClass =
  "rounded-md bg-deal-bg px-2 py-1.5 text-sm outline-none ring-1 ring-white/10 focus:ring-deal-accent";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function FlightResults({ offers }: { offers: ScoredFlightOffer[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("best");
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  // New search results invalidate filter selections made against the old
  // ones (e.g. an airline that no longer appears).
  useEffect(() => {
    setStopsFilter("any");
    setAirlineFilter("all");
    setMaxPrice("");
  }, [offers]);

  const airlines = useMemo(
    () => [...new Set(offers.map((o) => o.airline))].sort(),
    [offers]
  );

  const visibleOffers = useMemo(() => {
    const priceCap = maxPrice ? parseInt(maxPrice, 10) : Infinity;
    const filtered = offers.filter((offer) => {
      if (stopsFilter === "direct" && offer.stops !== 0) return false;
      if (stopsFilter === "one" && offer.stops > 1) return false;
      if (airlineFilter !== "all" && offer.airline !== airlineFilter) return false;
      if (offer.price > priceCap) return false;
      return true;
    });

    const sorted = [...filtered];
    switch (sortKey) {
      case "price":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "duration":
        sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case "depart":
        sorted.sort((a, b) => a.departAt.localeCompare(b.departAt));
        break;
      case "best":
      default:
        sorted.sort((a, b) => b.score - a.score);
    }
    return sorted;
  }, [offers, sortKey, stopsFilter, airlineFilter, maxPrice]);

  if (offers.length === 0) {
    return <p className="text-white/50">No flights found for that search yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-deal-panel p-3">
        <label className="flex items-center gap-1.5 text-sm text-white/50">
          Sort
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="best">Best match</option>
            <option value="price">Cheapest</option>
            <option value="duration">Fastest</option>
            <option value="depart">Earliest departure</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-white/50">
          Stops
          <select
            value={stopsFilter}
            onChange={(e) => setStopsFilter(e.target.value as StopsFilter)}
            className={selectClass}
          >
            <option value="any">Any</option>
            <option value="direct">Direct only</option>
            <option value="one">Up to 1 stop</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-white/50">
          Airline
          <select
            value={airlineFilter}
            onChange={(e) => setAirlineFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All</option>
            {airlines.map((airline) => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-white/50">
          Max $
          <input
            type="number"
            min={0}
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={`${selectClass} w-20`}
          />
        </label>
        <span className="ml-auto text-xs text-white/40">
          {visibleOffers.length} of {offers.length} flights
        </span>
      </div>

      {visibleOffers.length === 0 ? (
        <p className="text-white/50">
          No flights match those filters —{" "}
          <button
            onClick={() => {
              setStopsFilter("any");
              setAirlineFilter("all");
              setMaxPrice("");
            }}
            className="text-deal-accent underline"
          >
            clear filters
          </button>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleOffers.map((offer) => (
            <li
              key={offer.id}
              className="flex flex-col items-start justify-between gap-2 rounded-lg bg-deal-panel p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{offer.airline}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_STYLES[offer.label]}`}
                  >
                    {LABEL_TEXT[offer.label]}
                  </span>
                  <span className="text-xs text-white/40">via {offer.provider}</span>
                </div>
                <div className="text-sm text-white/60">
                  {offer.origin} → {offer.destination} · {offer.stops === 0 ? "Direct" : `${offer.stops} stop(s)`} ·{" "}
                  {formatDuration(offer.durationMinutes)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-deal-accent">
                  ${offer.price}
                  <span className="ml-1 text-xs font-normal text-white/40">{offer.currency}</span>
                </span>
                <a
                  href={offer.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
                >
                  View
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
