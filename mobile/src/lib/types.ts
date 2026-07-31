export interface FlightOffer {
  id: string;
  provider: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  airline: string;
  price: number;
  currency: string;
  stops: number;
  durationMinutes: number;
  departAt: string;
  arriveAt: string;
  deepLink: string;
}

export type DealLabel = "best-deal" | "great" | "good" | "average" | "high";

export interface ScoredFlightOffer extends FlightOffer {
  score: number;
  label: DealLabel;
}

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

export interface AnomalyInfo {
  sampleSize: number;
  median: number;
  mean: number;
  stdDev: number;
  latestPrice: number;
  percentBelowMedian: number;
  zScore: number;
  isAnomaly: boolean;
}

export interface Snapshot {
  id: number;
  price: number;
  currency: string;
  airline: string;
  collectedAt: string;
}

export interface WatchedRouteWithHistory {
  id: number;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string | null;
  createdAt: string;
  snapshots: Snapshot[];
  anomaly: AnomalyInfo | null;
}

export interface SelfTransferCombo {
  hub: string;
  leg1: FlightOffer;
  leg2: FlightOffer;
  totalPrice: number;
  currency: string;
  layoverMinutes: number;
}
