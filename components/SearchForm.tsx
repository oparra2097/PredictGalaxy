"use client";

import { useState } from "react";
import AirportInput from "./AirportInput";
import { resolveAirportCode } from "@/lib/airports";

export interface SearchValues {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  adults: number;
}

type TripType = "roundtrip" | "oneway";

export default function SearchForm({
  onSearch,
  loading,
}: {
  onSearch: (values: SearchValues) => void;
  loading: boolean;
}) {
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<SearchValues>({
    origin: "",
    destination: "",
    departDate: "",
    returnDate: "",
    adults: 1,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const origin = resolveAirportCode(values.origin);
    const destination = resolveAirportCode(values.destination);
    if (!origin || !destination) {
      setFormError(
        `Couldn't match "${!origin ? values.origin : values.destination}" to an airport — try a city name or 3-letter code.`
      );
      return;
    }

    // Snap the inputs to the resolved codes so what runs is what's shown.
    setValues((v) => ({ ...v, origin, destination }));
    onSearch({
      ...values,
      origin,
      destination,
      returnDate: tripType === "oneway" ? "" : values.returnDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-deal-panel p-4">
      <div className="flex gap-1 self-start rounded-lg bg-deal-bg p-1">
        {(
          [
            ["roundtrip", "Round-trip"],
            ["oneway", "One-way"],
          ] as [TripType, string][]
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tripType === type
                ? "bg-deal-accent text-deal-bg"
                : "text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-3 ${tripType === "roundtrip" ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
        <AirportInput
          required
          label="From"
          placeholder="City or code"
          value={values.origin}
          onChange={(origin) => setValues({ ...values, origin })}
        />
        <AirportInput
          required
          label="To"
          placeholder="City or code"
          value={values.destination}
          onChange={(destination) => setValues({ ...values, destination })}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/50">Depart</span>
          <input
            required
            type="date"
            value={values.departDate}
            onChange={(e) => setValues({ ...values, departDate: e.target.value })}
            className="w-full rounded-md bg-deal-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-deal-accent"
          />
        </label>
        {tripType === "roundtrip" && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Return</span>
            <input
              type="date"
              value={values.returnDate}
              onChange={(e) => setValues({ ...values, returnDate: e.target.value })}
              className="w-full rounded-md bg-deal-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-deal-accent"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={loading}
          className="self-end rounded-md bg-deal-accent px-4 py-2 font-medium text-deal-bg transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find deals"}
        </button>
      </div>

      {formError && <p className="text-sm text-red-400">{formError}</p>}
    </form>
  );
}
