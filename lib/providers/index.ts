import { amadeusProvider } from "./amadeus";
import { mockProvider } from "./mock";
import type { FlightOffer, FlightProvider, FlightSearchParams } from "./types";

const ALL_PROVIDERS: FlightProvider[] = [amadeusProvider, mockProvider];

export function getActiveProviders(): FlightProvider[] {
  // Mock reports itself as always configured, so it must be excluded here
  // or it would blend fake fares into real results the moment a real
  // provider comes online. It exists purely as the zero-setup fallback.
  const real = ALL_PROVIDERS.filter(
    (p) => p.name !== mockProvider.name && p.isConfigured()
  );
  return real.length > 0 ? real : [mockProvider];
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
