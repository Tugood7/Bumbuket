import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategories } from "@/lib/data/catalog";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = {
  title: "Tambah Buket Baru — Admin",
};

export default async function AdminNewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-rose hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Katalog Produk
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-bold text-foreground">
          Tambah Buket Baru
        </h1>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
