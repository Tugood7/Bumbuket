"use client";

import Image from "next/image";
import Link from "next/link";
import { Flower2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatRupiah } from "@bumbuket/shared";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem } =
    useCartStore();

  if (!isDrawerOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-brand-rose/20 backdrop-blur-xs"
        onClick={closeDrawer}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-rose" />
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Keranjang Buket
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Tutup keranjang"
            className="rounded-full p-2 text-muted-foreground hover:bg-brand-blush/60 hover:text-brand-rose"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blush text-brand-rose">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="mt-4 font-serif text-lg font-semibold">
                Keranjang masih kosong
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih buket favoritmu dan sesuaikan warna wrapping serta kartu
                ucapan.
              </p>
              <Link href="/catalog" onClick={closeDrawer} className="mt-5">
                <Button size="sm">Lihat Katalog Buket</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.cartKey}
                  className="rounded-2xl border border-pink-100 bg-brand-cream/60 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-pink-100 bg-brand-blush/40">
                        {item.productImageUrl ? (
                          <Image
                            src={item.productImageUrl}
                            alt={item.productName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-rose/60">
                            <Flower2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/products/${item.productSlug}`}
                          onClick={closeDrawer}
                          className="font-serif text-base font-semibold text-foreground hover:text-brand-rose"
                        >
                          {item.productName}
                        </Link>
                        {item.variantName && (
                          <p className="text-xs font-medium text-brand-rose">
                            {item.variantName}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartKey)}
                      aria-label="Hapus item"
                      className="rounded-lg p-1 text-muted-foreground hover:bg-pink-100 hover:text-brand-rose"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.wrappingColor && (
                      <p>
                        <span className="font-medium text-foreground">
                          Wrapping:
                        </span>{" "}
                        {item.wrappingColor}
                      </p>
                    )}
                    {item.moneyBouquetDetails && (
                      <p>
                        <span className="font-medium text-foreground">
                          Money Bouquet:
                        </span>{" "}
                        {item.moneyBouquetDetails.sheet_count} lbr ×{" "}
                        {formatRupiah(item.moneyBouquetDetails.denomination)} (
                        {item.moneyBouquetDetails.cash_payment_mode ===
                        "included_in_checkout"
                          ? "Bayar sekaligus"
                          : "Bayar jasa dulu"}
                        )
                      </p>
                    )}
                    {item.greetingCardText && (
                      <p className="line-clamp-2 italic">
                        &ldquo;{item.greetingCardText}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-pink-200 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cartKey, item.quantity - 1)
                        }
                        className="p-1.5 text-brand-rose hover:bg-brand-blush/60 rounded-l-full"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cartKey, item.quantity + 1)
                        }
                        className="p-1.5 text-brand-rose hover:bg-brand-blush/60 rounded-r-full"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-brand-rose">
                      {formatRupiah(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-pink-100 bg-brand-cream/70 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal Checkout</span>
              <span className="text-lg font-bold text-brand-rose">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ongkir kurir instan (Gojek / Maxim / Grab) dibayar terpisah sesuai
              tarif aplikasi.
            </p>
            <Link href="/checkout" onClick={closeDrawer} className="mt-4 block">
              <Button className="w-full" size="lg">
                Lanjut ke Checkout
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

