import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Gift,
  MapPin,
  MessageCircle,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  buildWhatsAppUrl,
  formatCompactRupiah,
  MONEY_BOUQUET_TIERS,
  STORE_INFO,
} from "@bumbuket/shared";
import {
  getCategories,
  getFeaturedProducts,
  getReadyStockProducts,
} from "@/lib/data/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, readyStockProducts, featuredProducts] = await Promise.all([
    getCategories(),
    getReadyStockProducts(4),
    getFeaturedProducts(6),
  ]);

  const customWaUrl = buildWhatsAppUrl(
    `Halo Kak admin ${STORE_INFO.name}! Saya ingin order Custom Bouquet untuk acara di Pekanbaru.`
  );

  return (
    <div className="space-y-16 pb-8">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-pink-100 bg-gradient-to-br from-[#FFF9FB] via-brand-blush/55 to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-brand-rose/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-7">
            <Badge variant="blush" className="mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Artificial Flower & Premium Bouquet • Pekanbaru
            </Badge>
            <h1 className="font-serif text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Rangkaian Buket Elegan untuk Setiap{" "}
              <span className="text-brand-rose">Momen Spesial</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Pilih buket <strong>Ready Stock</strong> yang siap kirim hari ini
              atau pesan <strong>Custom / Money Bouquet</strong> sesuai warna
              wrapping &amp; kartu ucapan favoritmu di Marpoyan Damai, Pekanbaru.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/catalog">
                <Button size="lg">
                  Jelajahi Katalog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/catalog?availability=ready_stock">
                <Button variant="outline" size="lg">
                  Lihat Ready Stock Hari Ini
                </Button>
              </Link>
              <a href={customWaUrl} target="_blank" rel="noreferrer">
                <Button variant="whatsapp" size="lg">
                  <MessageCircle className="h-4 w-4" />
                  Order Custom WA
                </Button>
              </a>
            </div>

            <div className="mt-8 grid gap-3 border-t border-pink-200/70 pt-6 sm:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Ambil di Toko</p>
                  <p className="text-muted-foreground">
                    Jl. Pahlawan Kerja, Marpoyan Damai
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">
                    Kurir Instan Pekanbaru
                  </p>
                  <p className="text-muted-foreground">
                    Gojek, Maxim &amp; Grab (ongkir aplikasi)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Jam Buka</p>
                  <p className="text-muted-foreground">
                    Sen–Jum 08–18 • Sab 12–18 WIB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <Badge variant="ready">Bisa Kirim Hari Ini</Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  Gratis Kartu Ucapan
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-blush/50 p-4">
                  <p className="font-serif text-lg font-bold text-brand-rose">
                    Lily &amp; Mix
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Artificial flower awet selamanya, tampilan tetap mewah.
                  </p>
                </div>
                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="font-serif text-lg font-bold text-brand-rose">
                    Money Bouquet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    1–100 lembar, include dried flowers &amp; balon foil.
                  </p>
                </div>
                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="font-serif text-lg font-bold text-brand-rose">
                    Wisuda &amp; Guru
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Katalog spesial dengan boneka toga &amp; warna custom.
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-blush/50 p-4">
                  <p className="font-serif text-lg font-bold text-brand-rose">
                    Hybrid Pay
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    QRIS, VA, E-Wallet (Midtrans) atau konsultasi via WA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KATEGORI PILIHAN */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
              Koleksi Bumbuket.pku
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-foreground">
              Pilih Kategori Buket
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-semibold text-brand-rose hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={
                cat.slug === "ready-stock"
                  ? "/catalog?availability=ready_stock"
                  : `/catalog?category=${cat.slug}`
              }
              className="group flex flex-col items-center justify-center rounded-2xl border border-pink-100 bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand-pink hover:bg-brand-blush/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blush text-brand-rose transition-colors group-hover:bg-brand-rose group-hover:text-white">
                {cat.is_special_catalog ? (
                  <Gift className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </span>
              <span className="mt-2.5 text-xs font-semibold text-foreground group-hover:text-brand-rose">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* READY STOCK HARI INI */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="ready" className="mb-2">
              Bisa Kirim / Ambil Hari Ini
            </Badge>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Ready Stock Pekanbaru
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Butuh buket mendadak? Koleksi di bawah siap dikirim via Gojek,
              Maxim, Grab atau langsung diambil di Marpoyan Damai.
            </p>
          </div>
          <Link href="/catalog?availability=ready_stock">
            <Button variant="outline" size="sm">
              Semua Ready Stock
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {readyStockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* HIGHLIGHT MONEY BOUQUET PRICELIST */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-pink-200/80 bg-gradient-to-br from-brand-blush/70 via-white to-pink-50 p-6 shadow-soft sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Badge variant="default">Best Seller Custom</Badge>
              <h2 className="mt-3 font-serif text-3xl font-bold text-brand-rose">
                Pricelist Money Bouquet
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sudah termasuk dried flowers (Baby Breath / Caspea), free
                greeting card, free request warna wrapping, opsi balon foil
                gratis, dan pilihan pecahan uang baru 2k–20k (selama stok
                tersedia). Bisa bayar uang sekaligus di checkout atau diantar /
                transfer terpisah via WhatsApp.
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-rose">
                *Harga jasa rangkai di samping belum termasuk nominal isi uang.
              </p>
              <div className="mt-6">
                <Link href="/products/premium-money-bouquet-custom">
                  <Button>
                    Hitung &amp; Pesan Money Bouquet
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:col-span-6">
              {MONEY_BOUQUET_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-2xl border border-pink-100 bg-white/95 p-3 text-center shadow-xs"
                >
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {tier.label}
                  </p>
                  <p className="mt-1 font-serif text-lg font-bold text-brand-rose">
                    {formatCompactRupiah(tier.craftingFee)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KOLEKSI UNGGULAN */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
              Pilihan Favorit Pelanggan
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-foreground">
              Katalog Unggulan
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-semibold text-brand-rose hover:underline"
          >
            Semua Produk →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

