"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { STORE_INFO } from "@bumbuket/shared";
import { useCartStore } from "@/store/cart.store";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/catalog", label: "Katalog" },
  { href: "/catalog?availability=ready_stock", label: "Ready Stock" },
  { href: "/catalog?category=money-bouquet", label: "Money Bouquet" },
  { href: "/catalog?category=katalog-spesial", label: "Wisuda & Hari Guru" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blush via-pink-200 to-brand-pink/50 font-serif text-xl font-bold text-brand-rose shadow-sm ring-1 ring-pink-200">
            B
          </span>
          <div className="leading-tight">
            <span className="block font-serif text-lg font-bold text-brand-rose">
              {STORE_INFO.name}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Pekanbaru Florist
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/85 transition-colors hover:text-brand-rose"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Buka keranjang belanja"
            className="relative inline-flex h-10 items-center gap-2 rounded-full border border-pink-200 bg-brand-blush/50 px-4 text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-blush"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Keranjang</span>
            {totalCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-rose px-1.5 text-[11px] font-bold text-white">
                {totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu navigasi"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 text-foreground md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-pink-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-brand-blush/50 hover:text-brand-rose"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

