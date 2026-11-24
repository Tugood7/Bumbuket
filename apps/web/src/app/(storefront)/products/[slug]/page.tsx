import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getFeaturedProducts, getProductBySlug } from "@/lib/data/catalog";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductCustomizer } from "@/components/storefront/product-customizer";
import { ProductGallery } from "@/components/storefront/product-gallery";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Produk Tidak Ditemukan" };
  }

  return {
    title: product.name,
    description:
      product.description ??
      `Pesan ${product.name} di Bumbuket.pku Pekanbaru. Bisa ambil di toko Marpoyan Damai atau kirim via Gojek, Maxim, Grab.`,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const [product, featured] = await Promise.all([
    getProductBySlug(slug),
    getFeaturedProducts(4),
  ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = featured
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-brand-rose">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/catalog" className="hover:text-brand-rose">
          Katalog
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/catalog?category=${product.category.slug}`}
              className="hover:text-brand-rose"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      {/* Main 2-Column Layout */}
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-5">
          <ProductGallery
            images={product.images}
            productName={product.name}
            categoryLabel={product.category?.name}
            availabilityType={product.availability_type}
            isMoneyBouquet={product.is_money_bouquet}
          />
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card sm:p-8">
            <ProductCustomizer product={product} />
          </div>
        </div>
      </div>

      {/* Produk Lainnya */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Pilihan Buket Lainnya
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

