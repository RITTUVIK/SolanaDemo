import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SplitFrame } from "@/components/SplitFrame";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap", weight: ["400", "500", "600", "700"] });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "SolFrends",
  description: "SolFrends",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#2a2108" }, { media: "(prefers-color-scheme: light)", color: "#fff3d1" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers><SplitFrame>{children}</SplitFrame></Providers>
      </body>
    </html>
  );
}
