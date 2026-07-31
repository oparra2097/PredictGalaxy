export interface AnomalyResult {
  sampleSize: number;
  median: number;
  mean: number;
  stdDev: number;
  latestPrice: number;
  percentBelowMedian: number;
  zScore: number;
  isAnomaly: boolean;
}

const MIN_SAMPLE_SIZE = 3;
const PERCENT_BELOW_MEDIAN_THRESHOLD = 0.2; // 20% cheaper than usual
const Z_SCORE_THRESHOLD = -1.5;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Flags a price as a real deal only relative to that route's own history,
 * not a fixed dollar amount — the same $400 fare can be unremarkable on one
 * route and a mistake fare on another.
 */
export function detectAnomaly(priorHistory: number[], latestPrice: number): AnomalyResult {
  const sampleSize = priorHistory.length;

  if (sampleSize === 0) {
    return {
      sampleSize,
      median: latestPrice,
      mean: latestPrice,
      stdDev: 0,
      latestPrice,
      percentBelowMedian: 0,
      zScore: 0,
      isAnomaly: false,
    };
  }

  const med = median(priorHistory);
  const avg = mean(priorHistory);
  const sd = stdDev(priorHistory, avg);
  const percentBelowMedian = med > 0 ? (med - latestPrice) / med : 0;
  const zScore = sd > 0 ? (latestPrice - avg) / sd : 0;

  const isAnomaly =
    sampleSize >= MIN_SAMPLE_SIZE &&
    (percentBelowMedian >= PERCENT_BELOW_MEDIAN_THRESHOLD || zScore <= Z_SCORE_THRESHOLD);

  return {
    sampleSize,
    median: med,
    mean: avg,
    stdDev: sd,
    latestPrice,
    percentBelowMedian,
    zScore,
    isAnomaly,
  };
}
