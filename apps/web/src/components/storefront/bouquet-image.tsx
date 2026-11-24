import Image from "next/image";
import { Flower2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BouquetImageProps {
  src?: string | null;
  alt: string;
  categoryLabel?: string | null;
  isMoneyBouquet?: boolean;
  ratio?: "4/5" | "1/1";
  priority?: boolean;
  className?: string;
}

export function BouquetImage({
  src,
  alt,
  categoryLabel,
  isMoneyBouquet = false,
  ratio = "4/5",
  priority = false,
  className,
}: BouquetImageProps) {
  const aspectClass = ratio === "1/1" ? "aspect-square" : "aspect-[4/5]";

  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-brand-blush/40",
          aspectClass,
          className
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-blush via-[#FFF5F9] to-pink-100/80 p-6 text-center",
        aspectClass,
        className
      )}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-pink/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-brand-rose/10 blur-2xl" />

      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-pink-200 bg-white/85 text-brand-rose shadow-soft">
        {isMoneyBouquet ? (
          <Sparkles className="h-7 w-7" />
        ) : (
          <Flower2 className="h-7 w-7" />
        )}
      </div>

      <p className="relative mt-4 font-serif text-base font-semibold text-brand-rose">
        Bumbuket.pku
      </p>
      <p className="relative mt-1 text-xs font-medium text-brand-rose/75">
        {categoryLabel ?? "Premium Bouquet"}
      </p>
    </div>
  );
}

