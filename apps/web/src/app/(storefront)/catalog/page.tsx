import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { ProductAvailability } from "@bumbuket/shared";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CatalogPageProps {
  searchParams: Promise<{
    category?: string;
    availability?: string;
    q?: string;
    sort?: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Buket Pekanbaru",
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const activeCategory = params.category ?? "all";
  const activeAvailability =
    params.availability === "ready_stock" || params.availability === "pre_order"
      ? (params.availability as ProductAvailability)
      : "all";
  const searchQuery = params.q ?? "";
  const sort =
    params.sort === "price_asc" ||
    params.sort === "price_desc" ||
    params.sort === "newest"
      ? params.sort
      : "featured";

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: activeCategory,
      availability: activeAvailability,
      search: searchQuery,
      sort,
    }),
  ]);

  const buildFilterUrl = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: activeCategory !== "all" ? activeCategory : undefined,
      availability:
        activeAvailability !== "all" ? activeAvailability : undefined,
      q: searchQuery || undefined,
      sort: sort !== "featured" ? sort : undefined,
      ...overrides,
    };

    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== "all") {
        next.set(key, value);
      }
    });
    const qs = next.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
          Bumbuket.pku Pekanbaru
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Katalog Buket Premium
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Temukan buket Ready Stock untuk pengiriman hari ini atau Pre-Order /
          Custom sesuai warna wrapping &amp; momen spesialmu.
        </p>

        {/* Baris Pencarian & Filter Status */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            action="/catalog"
            method="GET"
            className="flex w-full max-w-md items-center gap-2"
          >
            {activeCategory !== "all" && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
            {activeAvailability !== "all" && (
              <input
                type="hidden"
                name="availability"
                value={activeAvailability}
              />
            )}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari buket lily, money bouquet, wisuda..."
                className="pl-10"
              />
            </div>
            <Button type="submit" size="sm">
              Cari
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Status:
            </span>
            {[
              { value: "all", label: "Semua" },
              { value: "ready_stock", label: "Ready Stock (Hari Ini)" },
              { value: "pre_order", label: "Pre-Order / Custom" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildFilterUrl({ availability: opt.value })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  activeAvailability === opt.value
                    ? "bg-brand-rose text-white shadow-xs"
                    : "border border-pink-200 bg-brand-cream text-foreground hover:bg-brand-blush/60"
                )}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Filter Kategori & Urutan */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-pink-100 pt-5">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildFilterUrl({ category: "all" })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeCategory === "all"
                  ? "bg-brand-blush text-brand-rose ring-1 ring-brand-pink"
                  : "bg-muted/70 text-muted-foreground hover:bg-brand-blush/50 hover:text-brand-rose"
              )}
            >
              Semua Kategori
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildFilterUrl({ category: cat.slug })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  activeCategory === cat.slug
                    ? "bg-brand-blush text-brand-rose ring-1 ring-brand-pink"
                    : "bg-muted/70 text-muted-foreground hover:bg-brand-blush/50 hover:text-brand-rose"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Urutkan:</span>
            {[
              { value: "featured", label: "Unggulan" },
              { value: "price_asc", label: "Termurah" },
              { value: "price_desc", label: "Termahal" },
            ].map((s) => (
              <Link
                key={s.value}
                href={buildFilterUrl({ sort: s.value })}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold",
                  sort === s.value
                    ? "bg-brand-rose text-white"
                    : "text-muted-foreground hover:text-brand-rose"
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Produk */}
      <div className="mt-8">
        <p className="mb-4 text-sm text-muted-foreground">
          Menampilkan <strong className="text-foreground">{products.length}</strong>{" "}
          buket
        </p>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-pink-100 bg-white p-12 text-center shadow-card">
            <p className="font-serif text-xl font-semibold text-foreground">
              Buket tidak ditemukan
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Coba ubah kata kunci atau filter kategori, atau langsung konsultasi
              buket custom via WhatsApp.
            </p>
            <Link href="/catalog" className="mt-5 inline-block">
              <Button variant="outline">Reset Filter</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

