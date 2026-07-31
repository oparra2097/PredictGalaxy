import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fareflock — Flight Deal Aggregator",
  description:
    "Ad-free flight deal scanning across airline APIs and independent deal blogs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
