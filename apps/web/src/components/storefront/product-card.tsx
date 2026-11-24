import Link from "next/link";
import {
  formatRupiah,
  type ProductWithRelations,
} from "@bumbuket/shared";
import { ArrowUpRight } from "lucide-react";
import { AvailabilityBadge } from "./availability-badge";
import { BouquetImage } from "./bouquet-image";

interface ProductCardProps {
  product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
  const coverImage = product.images[0] ?? null;
  const wrappingSwatches = product.available_wrapping_colors.slice(0, 4);

  const displayPrice = product.is_money_bouquet
    ? "Mulai Rp 100.000"
    : formatRupiah(product.base_price);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-soft"
    >
      <div className="relative">
        <BouquetImage
          src={coverImage}
          alt={product.name}
          categoryLabel={product.category?.name}
          isMoneyBouquet={product.is_money_bouquet}
          ratio="4/5"
        />

        <div className="absolute left-3 top-3">
          <AvailabilityBadge type={product.availability_type} compact />
        </div>

        {product.is_money_bouquet && (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand-rose/90 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            Jasa rangkai (belum termasuk uang)
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-pink">
            {product.category?.name ?? "Bouquet"}
          </span>
          {wrappingSwatches.length > 0 && (
            <div
              className="flex items-center -space-x-1"
              title="Pilihan warna wrapping tersedia"
            >
              {wrappingSwatches.map((color) => (
                <span
                  key={color.name}
                  className="h-3.5 w-3.5 rounded-full border border-pink-200 shadow-xs"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-2 font-serif text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-brand-rose">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-base font-bold text-brand-rose">{displayPrice}</p>
            <p className="text-[11px] text-muted-foreground">
              {product.availability_type === "ready_stock"
                ? "Bisa kirim/ambil hari ini"
                : `Estimasi PO H+${Math.max(1, product.lead_time_days)}`}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blush/80 text-brand-rose transition-colors group-hover:bg-brand-rose group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

