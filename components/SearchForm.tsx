"use client";

import { useState } from "react";

export interface SearchValues {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  adults: number;
}

export default function SearchForm({
  onSearch,
  loading,
}: {
  onSearch: (values: SearchValues) => void;
  loading: boolean;
}) {
  const [values, setValues] = useState<SearchValues>({
    origin: "",
    destination: "",
    departDate: "",
    returnDate: "",
    adults: 1,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(values);
      }}
      className="grid grid-cols-1 gap-3 rounded-xl bg-deal-panel p-4 sm:grid-cols-5"
    >
      <input
        required
        maxLength={3}
        placeholder="From (e.g. JFK)"
        value={values.origin}
        onChange={(e) => setValues({ ...values, origin: e.target.value.toUpperCase() })}
        className="rounded-md bg-deal-bg px-3 py-2 uppercase tracking-wide outline-none ring-1 ring-white/10 focus:ring-deal-accent"
      />
      <input
        required
        maxLength={3}
        placeholder="To (e.g. LIS)"
        value={values.destination}
        onChange={(e) => setValues({ ...values, destination: e.target.value.toUpperCase() })}
        className="rounded-md bg-deal-bg px-3 py-2 uppercase tracking-wide outline-none ring-1 ring-white/10 focus:ring-deal-accent"
      />
      <input
        required
        type="date"
        value={values.departDate}
        onChange={(e) => setValues({ ...values, departDate: e.target.value })}
        className="rounded-md bg-deal-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-deal-accent"
      />
      <input
        type="date"
        placeholder="Return (optional)"
        value={values.returnDate}
        onChange={(e) => setValues({ ...values, returnDate: e.target.value })}
        className="rounded-md bg-deal-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-deal-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-deal-accent px-4 py-2 font-medium text-deal-bg transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Searching…" : "Find deals"}
      </button>
    </form>
  );
}
