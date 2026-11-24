"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  ExternalLink,
  Flower2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { STORE_INFO } from "@bumbuket/shared";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/schedule",
    label: "Jadwal Pesanan",
    icon: CalendarClock,
    exact: false,
  },
  { href: "/admin/orders", label: "Semua Pesanan", icon: ShoppingBag, exact: false },
  { href: "/admin/products", label: "Katalog Produk", icon: Flower2, exact: false },
  { href: "/admin/admins", label: "Kelola Admin", icon: ShieldCheck, exact: false },
];

interface AdminSidebarProps {
  adminName: string;
  adminEmail: string | null;
}

export function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Abaikan di mode preview
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="flex w-full flex-col border-b border-pink-100 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r print:hidden">
      <div className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blush font-serif text-lg font-bold text-brand-rose">
            B
          </span>
          <div className="leading-tight">
            <span className="block font-serif text-base font-bold text-brand-rose">
              {STORE_INFO.name}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Admin Florist
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-visible">
        {ADMIN_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-blush text-brand-rose"
                  : "text-muted-foreground hover:bg-brand-cream hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-pink-100 p-4 lg:block">
        <p className="truncate text-xs font-semibold text-foreground">
          {adminName}
        </p>
        {adminEmail && (
          <p className="truncate text-[11px] text-muted-foreground">
            {adminEmail}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-brand-rose hover:bg-brand-blush/50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Lihat Storefront
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
