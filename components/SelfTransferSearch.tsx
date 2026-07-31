"use client";

import { useState, type FormEvent } from "react";
import AirportInput from "./AirportInput";
import { resolveAirportCode } from "@/lib/airports";

interface LegOffer {
  airline: string;
  price: number;
  currency: string;
  departAt: string;
  arriveAt: string;
  stops: number;
}

interface Combo {
  hub: string;
  leg1: LegOffer;
  leg2: LegOffer;
  totalPrice: number;
  currency: string;
  layoverMinutes: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLayover(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h ${m}m` : `${h}h ${m}m`;
}

export default function SelfTransferSearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const originCode = resolveAirportCode(origin);
    const destCode = resolveAirportCode(destination);
    if (!originCode || !destCode) {
      setError(
        `Couldn't match "${!originCode ? origin : destination}" to an airport — try a city name or 3-letter code.`
      );
      return;
    }
    setOrigin(originCode);
    setDestination(destCode);

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        origin: originCode,
        destination: destCode,
        departDate,
        adults: "1",
      });
      const res = await fetch(`/api/search/self-transfer?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setCombos(data.combos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50">
        Instead of one connecting itinerary, this books two separate one-way
        tickets through any major European hub — often cheaper, especially
        across airlines that don&apos;t interline with each other.
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 rounded-xl bg-deal-panel p-4 sm:grid-cols-4"
      >
        <AirportInput
          required
          label="From"
          placeholder="City or code"
          value={origin}
          onChange={setOrigin}
        />
        <AirportInput
          required
          label="Final destination"
          placeholder="City or code"
          value={destination}
          onChange={setDestination}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/50">Depart</span>
          <input
            required
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            className="w-full rounded-md bg-deal-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-deal-accent"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="self-end rounded-md bg-deal-accent px-4 py-2 font-medium text-deal-bg transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find hub combos"}
        </button>
      </form>

      {error && <p className="text-red-400">{error}</p>}

      {searched && !loading && (
        combos.length === 0 ? (
          <p className="text-white/50">No valid self-transfer combos found for that route/date.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {combos.map((combo) => (
              <li key={combo.hub} className="rounded-lg bg-deal-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {origin} → {combo.hub} → {destination}
                  </span>
                  <span className="text-xl font-bold text-deal-accent">
                    ${combo.totalPrice}
                    <span className="ml-1 text-xs font-normal text-white/40">{combo.currency}</span>
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-white/60 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-white/80">Leg 1: </span>
                    {combo.leg1.airline} · ${combo.leg1.price} · {formatTime(combo.leg1.departAt)} →{" "}
                    {formatTime(combo.leg1.arriveAt)}
                  </div>
                  <div>
                    <span className="font-medium text-white/80">Leg 2: </span>
                    {combo.leg2.airline} · ${combo.leg2.price} · {formatTime(combo.leg2.departAt)} →{" "}
                    {formatTime(combo.leg2.arriveAt)}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white/60">
                    Layover in {combo.hub}: {formatLayover(combo.layoverMinutes)}
                  </span>
                  <span className="rounded bg-deal-warn/20 px-2 py-0.5 text-deal-warn">
                    Self-transfer — separate tickets, no missed-connection protection
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
