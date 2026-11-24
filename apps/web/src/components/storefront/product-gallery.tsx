"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductAvailability } from "@bumbuket/shared";
import { AvailabilityBadge } from "./availability-badge";
import { BouquetImage } from "./bouquet-image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  categoryLabel?: string | null;
  availabilityType: ProductAvailability;
  isMoneyBouquet?: boolean;
}

export function ProductGallery({
  images,
  productName,
  categoryLabel,
  availabilityType,
  isMoneyBouquet = false,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeSrc = images[selectedIndex] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-soft">
        <BouquetImage
          src={activeSrc}
          alt={productName}
          categoryLabel={categoryLabel}
          isMoneyBouquet={isMoneyBouquet}
          ratio="4/5"
          priority
        />
        <div className="absolute left-4 top-4">
          <AvailabilityBadge type={availabilityType} />
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-2xl border-2 transition-all",
                idx === selectedIndex
                  ? "border-brand-rose ring-2 ring-brand-blush"
                  : "border-pink-100 opacity-75 hover:opacity-100"
              )}
            >
              <Image
                src={url}
                alt={`${productName} foto ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

