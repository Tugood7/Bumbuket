import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bumbuket.pku — Artificial Flower & Premium Bouquet Pekanbaru",
    template: "%s | Bumbuket.pku",
  },
  description:
    "Toko buket bunga artifisial, Money Bouquet, buket wisuda, Hari Guru, dan custom bouquet premium di Marpoyan Damai, Kota Pekanbaru. Ready stock & Pre-Order.",
  keywords: [
    "buket pekanbaru",
    "bumbuket pku",
    "money bouquet pekanbaru",
    "buket wisuda pekanbaru",
    "buket hari guru pekanbaru",
    "toko buket marpoyan damai",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-brand-cream text-foreground">
        {children}
      </body>
    </html>
  );
}

