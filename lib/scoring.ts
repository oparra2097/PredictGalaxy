import type { FlightOffer } from "./providers/types";

export interface ScoredFlightOffer extends FlightOffer {
  score: number;
  label: "best-deal" | "great" | "good" | "average" | "high";
}

/**
 * Scores offers relative to the median price for the same search, so
 * "best deal" reflects this specific route/date rather than a fixed
 * dollar threshold.
 */
export function scoreOffers(offers: FlightOffer[]): ScoredFlightOffer[] {
  if (offers.length === 0) return [];

  const sortedPrices = [...offers.map((o) => o.price)].sort((a, b) => a - b);
  const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
  const cheapest = sortedPrices[0];

  return offers
    .map((offer) => {
      const ratio = offer.price / median;
      let label: ScoredFlightOffer["label"] = "average";
      if (offer.price === cheapest) label = "best-deal";
      else if (ratio <= 0.85) label = "great";
      else if (ratio <= 1.0) label = "good";
      else if (ratio <= 1.2) label = "average";
      else label = "high";

      // Lower price and fewer stops score higher; direct flights get a boost.
      const stopsPenalty = offer.stops * 0.05;
      const score = Math.max(0, 1 - (offer.price / median - 1) - stopsPenalty);

      return { ...offer, score, label };
    })
    .sort((a, b) => b.score - a.score);
}
