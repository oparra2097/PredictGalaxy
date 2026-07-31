import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deal: {
          bg: "#0b1220",
          panel: "#111a2b",
          accent: "#38bdf8",
          good: "#34d399",
          warn: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};

export default config;
