"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatRupiah } from "@bumbuket/shared";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
            Bumbuket.pku
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
            Keranjang Belanja
          </h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-muted-foreground hover:text-brand-rose"
          >
            Kosongkan Keranjang
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-pink-100 bg-white p-14 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blush text-brand-rose">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-semibold">
            Keranjangmu masih kosong
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Yuk pilih buket favoritmu, tentukan warna wrapping, dan tulis kartu
            ucapan manis untuk orang tersayang.
          </p>
          <Link href="/catalog" className="mt-6 inline-block">
            <Button size="lg">Jelajahi Katalog Buket</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {items.map((item) => (
              <div
                key={item.cartKey}
                className="rounded-2xl border border-pink-100 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-pink-100 bg-brand-blush/40">
                      {item.productImageUrl ? (
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-rose/60">
                          <Flower2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="mb-1.5">
                        <AvailabilityBadge type={item.availabilityType} compact />
                      </div>
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="font-serif text-xl font-semibold text-foreground hover:text-brand-rose"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="mt-0.5 text-xs font-semibold text-brand-rose">
                          {item.variantName}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.cartKey)}
                    aria-label="Hapus buket"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-brand-blush/60 hover:text-brand-rose"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 rounded-xl bg-brand-cream/70 p-3.5 text-xs text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Warna Wrapping:</strong>{" "}
                    {item.wrappingColor ?? "-"}
                  </p>
                  <p>
                    <strong className="text-foreground">Kartu Ucapan:</strong>{" "}
                    {item.greetingCardText ? (
                      <span className="italic">
                        &ldquo;{item.greetingCardText}&rdquo;
                      </span>
                    ) : (
                      <span>(Kartu kosong saja)</span>
                    )}
                  </p>
                  {item.moneyBouquetDetails && (
                    <div className="border-t border-pink-100 pt-1.5">
                      <p className="font-semibold text-brand-rose">
                        Detail Money Bouquet:
                      </p>
                      <p>
                        {item.moneyBouquetDetails.sheet_count} lembar ×{" "}
                        {formatRupiah(item.moneyBouquetDetails.denomination)} ={" "}
                        {formatRupiah(item.moneyBouquetDetails.cash_amount)} |
                        Jasa rangkai:{" "}
                        {formatRupiah(item.moneyBouquetDetails.crafting_fee)}
                      </p>
                      <p>
                        Mode uang:{" "}
                        {item.moneyBouquetDetails.cash_payment_mode ===
                        "included_in_checkout"
                          ? "Bayar sekaligus di checkout"
                          : "Bayar jasa dulu (uang diantar/transfer via WA)"}
                      </p>
                    </div>
                  )}
                  {item.customNotes && (
                    <p>
                      <strong className="text-foreground">Catatan:</strong>{" "}
                      {item.customNotes}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-pink-200 bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartKey, item.quantity - 1)
                      }
                      className="rounded-l-full p-2 text-brand-rose hover:bg-brand-blush/50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3.5 text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartKey, item.quantity + 1)
                      }
                      className="rounded-r-full p-2 text-brand-rose hover:bg-brand-blush/50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-base font-bold text-brand-rose">
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-soft lg:sticky lg:top-24 lg:col-span-4">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Ringkasan Belanja
            </h2>

            <div className="mt-4 space-y-2 border-b border-pink-100 pb-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Buket</span>
                <span>
                  {items.reduce((sum, i) => sum + i.quantity, 0)} item
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkir Kurir Instan</span>
                <span className="text-xs">Tarif Gojek/Maxim/Grab</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Subtotal
              </span>
              <span className="text-xl font-bold text-brand-rose">
                {formatRupiah(subtotal)}
              </span>
            </div>

            <Link href="/checkout" className="mt-6 block">
              <Button size="lg" className="w-full">
                Lanjut ke Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/catalog" className="mt-2.5 block">
              <Button variant="outline" className="w-full">
                Tambah Buket Lainnya
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
