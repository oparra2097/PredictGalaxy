import { getApiBaseUrl } from "./storage";
import type {
  DealPost,
  ScoredFlightOffer,
  SelfTransferCombo,
  WatchedRouteWithHistory,
} from "./types";

export class ApiNotConfiguredError extends Error {
  constructor() {
    super("Set the backend URL in Settings before using OdysseySky.");
    this.name = "ApiNotConfiguredError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiNotConfiguredError();
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
}

export function searchFlights(params: SearchParams) {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departDate: params.departDate,
    adults: String(params.adults),
  });
  if (params.returnDate) query.set("returnDate", params.returnDate);
  return apiFetch<{ offers: ScoredFlightOffer[]; errors: { provider: string; message: string }[] }>(
    `/api/search?${query.toString()}`
  );
}

export function searchSelfTransfer(params: {
  origin: string;
  destination: string;
  departDate: string;
  adults: number;
}) {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departDate: params.departDate,
    adults: String(params.adults),
  });
  return apiFetch<{ combos: SelfTransferCombo[]; errors: { hub: string; message: string }[] }>(
    `/api/search/self-transfer?${query.toString()}`
  );
}

export function fetchDeals() {
  return apiFetch<{ deals: DealPost[]; errors: { source: string; message: string }[] }>(
    "/api/deals"
  );
}

export function fetchWatchedRoutes() {
  return apiFetch<{ routes: WatchedRouteWithHistory[] }>("/api/routes");
}

export function trackRoute(values: SearchParams) {
  return apiFetch<{ route: unknown }>("/api/routes", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function removeRoute(id: number) {
  return apiFetch<{ ok: boolean }>(`/api/routes/${id}`, { method: "DELETE" });
}

export function collectPrices() {
  return apiFetch<{ collected: number; results: unknown[] }>("/api/collect", {
    method: "POST",
  });
}
