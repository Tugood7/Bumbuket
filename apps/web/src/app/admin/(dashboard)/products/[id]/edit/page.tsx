import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminProductById } from "@/lib/data/admin";
import { getCategories } from "@/lib/data/catalog";
import { ProductForm } from "@/components/admin/product-form";

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

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
          Edit: {product.name}
        </h1>
      </div>

      <ProductForm categories={categories} initialProduct={product} />
    </div>
  );
}
