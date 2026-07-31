"use client";

import { useMemo, useState } from "react";
import { searchAirports } from "@/lib/airports";

export default function AirportInput({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    // Once a bare IATA code is in the box (typed or picked), the list is noise.
    if (/^[A-Z]{3}$/.test(value.trim())) return [];
    return searchAirports(value);
  }, [value]);

  return (
    <label className="relative flex flex-col gap-1">
      <span className="text-xs text-white/50">{label}</span>
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-md bg-deal-bg px-3 py-2 uppercase tracking-wide outline-none ring-1 ring-white/10 focus:ring-deal-accent"
      />
      {focused && suggestions.length > 0 && (
        <ul className="absolute top-full z-20 mt-1 w-full min-w-64 overflow-hidden rounded-md bg-deal-panel shadow-lg ring-1 ring-white/15">
          {suggestions.map(([code, name, city, country]) => (
            <li key={code}>
              <button
                type="button"
                // preventDefault on pointer-down keeps the input from
                // blurring (and unmounting this list) before the tap lands.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(code);
                  setFocused(false);
                }}
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-white/10"
              >
                <span className="font-mono font-semibold text-deal-accent">{code}</span>
                <span className="truncate text-sm">
                  {city}
                  <span className="text-white/40"> · {name}, {country}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
