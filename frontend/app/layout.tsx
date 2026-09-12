import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap"
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Travel Agent OTA Platform",
  description: "Travel Agent OTA ticketing, settlement, and scanner platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={plusJakarta.className}>{process.env.APP_MODE === "demo" && <div role="status" className="sticky top-0 z-[100] bg-amber-200 px-4 py-2 text-center text-sm font-semibold text-amber-950">Demo Mode — fictional data · 12 months of history · refreshed daily (Malaysia time)</div>}{children}</body>
    </html>
  );
}
