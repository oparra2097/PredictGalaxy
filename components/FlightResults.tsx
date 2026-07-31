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

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function FlightResults({ offers }: { offers: ScoredFlightOffer[] }) {
  if (offers.length === 0) {
    return <p className="text-white/50">No flights found for that search yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {offers.map((offer) => (
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
  );
}
