"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  AVAILABILITY_BADGES,
  buildCustomOrderWaLink,
  calculateMoneyBouquetPrice,
  COURIER_PROVIDER_OPTIONS,
  DEFAULT_WRAPPING_COLORS,
  formatIndonesianDate,
  formatRupiah,
  FULFILLMENT_METHOD_OPTIONS,
  getNextAvailableOrderDateWib,
  getStoreHoursForDate,
  getTimeSlotsForDate,
  type CourierProvider,
  type FulfillmentMethod,
  type MoneyBouquetDetails,
  type ProductWithRelations,
} from "@bumbuket/shared";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MoneyBouquetConfigurator } from "./money-bouquet-configurator";

interface ProductCustomizerProps {
  product: ProductWithRelations;
}

export function ProductCustomizer({ product }: ProductCustomizerProps) {
  const addItem = useCartStore((state) => state.addItem);

  const wrappingPalette =
    product.available_wrapping_colors.length > 0
      ? product.available_wrapping_colors
      : [...DEFAULT_WRAPPING_COLORS];

  const initialDate = useMemo(
    () => getNextAvailableOrderDateWib(product.lead_time_days),
    [product.lead_time_days]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    !product.is_money_bouquet && product.variants[0]
      ? product.variants[0].id
      : null
  );
  const [wrappingColor, setWrappingColor] = useState<string>(
    wrappingPalette[0]?.name ?? "Blush Pink"
  );
  const [greetingCardText, setGreetingCardText] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>(initialDate);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>(
    () => getTimeSlotsForDate(initialDate)[0] ?? ""
  );
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup_store");
  const [courierProvider, setCourierProvider] =
    useState<CourierProvider>("gojek");
  const [quantity, setQuantity] = useState(1);

  const [moneyBouquetDetails, setMoneyBouquetDetails] =
    useState<MoneyBouquetDetails>(() => {
      const calc = calculateMoneyBouquetPrice({
        sheetCount: 20,
        denomination: 50_000,
        cashPaymentMode: "included_in_checkout",
      });
      return {
        sheet_count: 20,
        denomination: 50_000,
        crafting_fee: calc.craftingFee,
        cash_amount: calc.cashAmount,
        cash_payment_mode: "included_in_checkout",
        include_foil_balloon: false,
        request_new_notes: false,
      };
    });

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? null;

  const storeHours = getStoreHoursForDate(scheduledDate);
  const availableSlots = getTimeSlotsForDate(scheduledDate);
  const isClosedDay = !storeHours?.isOpen;

  const handleDateChange = (nextDate: string) => {
    setScheduledDate(nextDate);
    const nextSlots = getTimeSlotsForDate(nextDate);
    if (!nextSlots.includes(scheduledTimeSlot)) {
      setScheduledTimeSlot(nextSlots[0] ?? "");
    }
  };

  // Hitung harga satuan yang akan masuk checkout
  const unitPrice = product.is_money_bouquet
    ? calculateMoneyBouquetPrice({
        sheetCount: moneyBouquetDetails.sheet_count,
        denomination: moneyBouquetDetails.denomination,
        cashPaymentMode: moneyBouquetDetails.cash_payment_mode,
      }).checkoutPayableAmount
    : product.base_price + (selectedVariant?.price_adjustment ?? 0);

  const totalPrice = unitPrice * quantity;

  const waHref = buildCustomOrderWaLink({
    productName: product.name,
    availabilityLabel: AVAILABILITY_BADGES[product.availability_type].label,
    variantName: product.is_money_bouquet
      ? `${moneyBouquetDetails.sheet_count} Lembar (${formatRupiah(
          moneyBouquetDetails.denomination
        )})`
      : selectedVariant?.name ?? null,
    unitPrice,
    quantity,
    wrappingColor,
    greetingCardText: greetingCardText.trim() || null,
    scheduledDate: isClosedDay ? null : scheduledDate,
    scheduledTimeSlot: isClosedDay ? null : scheduledTimeSlot,
    fulfillmentMethod,
    courierProvider:
      fulfillmentMethod === "instant_courier" ? courierProvider : null,
    customNotes: customNotes.trim() || null,
    moneyBouquetDetails: product.is_money_bouquet ? moneyBouquetDetails : null,
  });

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImageUrl: product.images[0] ?? null,
      availabilityType: product.availability_type,
      leadTimeDays: product.lead_time_days,
      isMoneyBouquet: product.is_money_bouquet,
      variantId: product.is_money_bouquet ? null : selectedVariant?.id ?? null,
      variantName: product.is_money_bouquet
        ? `${moneyBouquetDetails.sheet_count} Lembar × ${formatRupiah(
            moneyBouquetDetails.denomination
          )}`
        : selectedVariant?.name ?? null,
      unitPrice,
      quantity,
      wrappingColor,
      greetingCardText: greetingCardText.trim() || null,
      customNotes: customNotes.trim() || null,
      moneyBouquetDetails: product.is_money_bouquet
        ? moneyBouquetDetails
        : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Harga & Info Ringkas */}
      <div className="border-b border-pink-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
          {product.category?.name ?? "Premium Bouquet"}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          {product.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <p className="text-2xl font-bold text-brand-rose">
            {formatRupiah(unitPrice)}
          </p>
          <span className="text-xs text-muted-foreground">
            {product.availability_type === "ready_stock"
              ? `Ready Stock (${product.stock_quantity} tersedia — bisa kirim hari ini)`
              : `Pre-Order (Estimasi pengerjaan H+${Math.max(
                  1,
                  product.lead_time_days
                )})`}
          </span>
        </div>
        {product.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}
      </div>

      {/* Kalkulator Khusus Money Bouquet ATAU Pilihan Varian Reguler */}
      {product.is_money_bouquet ? (
        <MoneyBouquetConfigurator
          value={moneyBouquetDetails}
          onChange={setMoneyBouquetDetails}
        />
      ) : (
        product.variants.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground">
              Pilih Varian Buket
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {product.variants.map((variant) => {
                const active = selectedVariantId === variant.id;
                const variantPrice =
                  product.base_price + variant.price_adjustment;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={cn(
                      "rounded-2xl border p-3.5 text-left transition-all",
                      active
                        ? "border-brand-rose bg-brand-blush/45 ring-1 ring-brand-rose"
                        : "border-pink-200 bg-white hover:bg-brand-blush/20"
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {variant.name}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-brand-rose">
                      {formatRupiah(variantPrice)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Pemilih Warna Kertas Wrapping */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            Warna Kertas Wrapping
          </p>
          <span className="text-xs font-semibold text-brand-rose">
            {wrappingColor}
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {wrappingPalette.map((color) => {
            const active = wrappingColor === color.name;
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => setWrappingColor(color.name)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "border-brand-rose bg-brand-blush/60 text-brand-rose ring-1 ring-brand-rose"
                    : "border-pink-200 bg-white text-foreground hover:bg-brand-blush/30"
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-pink-200 shadow-xs"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kartu Ucapan Gratis */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="greeting-card"
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <Heart className="h-4 w-4 text-brand-pink" />
            Teks Kartu Ucapan (Gratis)
          </label>
          <span className="text-xs text-muted-foreground">
            {greetingCardText.length}/300
          </span>
        </div>
        <Textarea
          id="greeting-card"
          maxLength={300}
          value={greetingCardText}
          onChange={(e) => setGreetingCardText(e.target.value)}
          placeholder="Contoh: Happy Graduation Nadya! Semoga sukses selalu di langkah berikutnya. — Dari Rina"
          className="mt-2"
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Ucapan sebaiknya diisi — jika dikosongkan, buket akan diberikan{" "}
          <strong>kartu ucapan kosong</strong> saja.
        </p>
        {greetingCardText.trim().length > 0 && (
          <div className="mt-2.5 rounded-2xl border border-pink-200/80 bg-brand-blush/30 p-3.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-pink">
              Preview Kartu Ucapan
            </p>
            <p className="mt-1 font-serif text-sm italic text-brand-rose">
              &ldquo;{greetingCardText.trim()}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Tanggal & Jam Pengiriman / Pengambilan (Sesuai Jam Buka Toko) */}
      <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-xs">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-brand-rose" />
          Jadwal Pengambilan / Pengiriman (WIB)
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Slot pengambilan 09:00–20:00 WIB (Sabtu mulai 12:00) • Minggu Tutup
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="schedule-date"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Tanggal
            </label>
            <Input
              id="schedule-date"
              type="date"
              min={initialDate}
              value={scheduledDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Metode Rencana
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["pickup_store", "instant_courier"] as FulfillmentMethod[]).map(
                (method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFulfillmentMethod(method)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition-colors",
                      fulfillmentMethod === method
                        ? "border-brand-rose bg-brand-blush/60 text-brand-rose"
                        : "border-pink-200 bg-white text-muted-foreground hover:bg-brand-blush/20"
                    )}
                  >
                    {method === "pickup_store" ? (
                      <MapPin className="h-3.5 w-3.5" />
                    ) : (
                      <Truck className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {FULFILLMENT_METHOD_OPTIONS[method].shortLabel}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {fulfillmentMethod === "instant_courier" && (
          <div className="mt-3 rounded-xl bg-brand-cream p-3 text-xs">
            <p className="font-semibold text-foreground">
              Preferensi Kurir Instan Pekanbaru:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["gojek", "maxim", "grab"] as CourierProvider[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourierProvider(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-semibold",
                    courierProvider === c
                      ? "border-brand-rose bg-brand-rose text-white"
                      : "border-pink-200 bg-white text-foreground"
                  )}
                >
                  {COURIER_PROVIDER_OPTIONS[c].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Ongkir mengikuti tarif aplikasi Gojek / Maxim / Grab dan dibayar
              terpisah.
            </p>
          </div>
        )}

        <div className="mt-3">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-brand-pink" />
            Slot Jam ({formatIndonesianDate(scheduledDate)})
          </span>

          {isClosedDay ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Hari Minggu toko tutup. Silakan pilih Senin–Sabtu, atau hubungi
              kami via tombol WhatsApp di bawah untuk kebutuhan khusus.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setScheduledTimeSlot(slot)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    scheduledTimeSlot === slot
                      ? "border-brand-rose bg-brand-rose text-white"
                      : "border-pink-200 bg-white text-foreground hover:bg-brand-blush/50"
                  )}
                >
                  {slot} WIB
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Catatan Tambahan */}
      <div>
        <label
          htmlFor="custom-notes"
          className="block text-sm font-semibold text-foreground"
        >
          Catatan Tambahan (Opsional)
        </label>
        <Input
          id="custom-notes"
          maxLength={300}
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="Contoh: Pita warna champagne, request bunga dominan pink lembut"
          className="mt-2"
        />
      </div>

      {/* Jumlah & Tombol Aksi Utama (Hybrid Checkout) */}
      <div className="space-y-3 border-t border-pink-100 pt-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-full border border-pink-200 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Kurangi jumlah"
              className="rounded-l-full p-2.5 text-brand-rose hover:bg-brand-blush/50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[40px] text-center text-sm font-bold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label="Tambah jumlah"
              className="rounded-r-full p-2.5 text-brand-rose hover:bg-brand-blush/50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Item</p>
            <p className="text-xl font-bold text-brand-rose">
              {formatRupiah(totalPrice)}
            </p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button size="lg" onClick={handleAddToCart} className="w-full">
            <ShoppingBag className="h-4 w-4" />
            Tambah ke Keranjang
          </Button>

          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button variant="whatsapp" size="lg" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Order Custom via WA
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

