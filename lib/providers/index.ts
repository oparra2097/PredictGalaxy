import { amadeusProvider } from "./amadeus";
import { mockProvider } from "./mock";
import type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";

const ALL_PROVIDERS: FlightProvider[] = [amadeusProvider, mockProvider];

export function getActiveProviders(): FlightProvider[] {
  const configured = ALL_PROVIDERS.filter((p) => p.isConfigured());
  // Always keep the mock provider so the app works with zero setup,
  // unless a real provider is configured and someone wants real-only results.
  return configured.length > 0 ? configured : [mockProvider];
}

export async function searchAllProviders(
  params: FlightSearchParams
): Promise<{ offers: FlightOffer[]; errors: { provider: string; message: string }[] }> {
  const providers = getActiveProviders();
  const errors: { provider: string; message: string }[] = [];

  const results = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await provider.search(params);
      } catch (err) {
        errors.push({
          provider: provider.name,
          message: err instanceof Error ? err.message : "Unknown error",
        });
        return [];
      }
    })
  );

  return { offers: results.flat(), errors };
}

export type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";
