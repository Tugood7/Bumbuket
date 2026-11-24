import Image from "next/image";
import Link from "next/link";
import { Flower2, Plus } from "lucide-react";
import { formatRupiah } from "@bumbuket/shared";
import { getAdminProducts } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import { ProductQuickActions } from "@/components/admin/product-quick-actions";

export const metadata = {
  title: "Katalog Produk — Admin",
};

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
            Manajemen Katalog
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
            Daftar Buket ({products.length})
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik badge <strong>Ready Stock / Pre-Order</strong> untuk mengubah
            status ketersediaan produk secara instan.
          </p>
        </div>

        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Tambah Buket Baru
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-pink-100 bg-brand-cream/80 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5">Produk</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Harga Dasar</th>
                <th className="px-4 py-3.5">Stok</th>
                <th className="px-4 py-3.5 text-right">Status &amp; Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-brand-cream/40">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-pink-100 bg-brand-blush/40">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-rose/60">
                            <Flower2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-serif text-sm font-bold text-foreground">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          /{product.slug}
                          {product.is_money_bouquet ? " • Money Bouquet" : ""}
                          {product.images.length > 0
                            ? ` • ${product.images.length} foto`
                            : " • Belum ada foto"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-brand-blush/60 px-2.5 py-0.5 text-[11px] font-semibold text-brand-rose">
                      {product.category?.name ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-brand-rose">
                    {product.is_money_bouquet
                      ? "Mulai Rp 100.000 (Jasa)"
                      : formatRupiah(product.base_price)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    {product.stock_quantity}
                  </td>
                  <td className="px-4 py-3.5">
                    <ProductQuickActions
                      productId={product.id}
                      productName={product.name}
                      availabilityType={product.availability_type}
                      isActive={product.is_active}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
