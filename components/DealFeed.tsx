import type { DealPost } from "@/lib/scrapers/dealFeeds";

export default function DealFeed({ deals }: { deals: DealPost[] }) {
  if (deals.length === 0) {
    return <p className="text-white/50">No deal posts loaded yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {deals.map((deal) => (
        <li key={deal.id} className="rounded-lg bg-deal-panel p-4">
          <a
            href={deal.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white hover:text-deal-accent"
          >
            {deal.title}
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">
            <span>{deal.source}</span>
            {deal.route && <span className="rounded bg-white/10 px-1.5 py-0.5">{deal.route}</span>}
            {deal.price !== null && (
              <span className="rounded bg-deal-good/20 px-1.5 py-0.5 text-deal-good">
                ~${deal.price}
              </span>
            )}
          </div>
          {deal.summary && <p className="mt-2 text-sm text-white/60">{deal.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
