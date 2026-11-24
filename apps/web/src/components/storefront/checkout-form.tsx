"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Truck,
} from "lucide-react";
import {
  COURIER_PROVIDER_OPTIONS,
  formatIndonesianDate,
  formatRupiah,
  FULFILLMENT_METHOD_OPTIONS,
  getNextAvailableOrderDateWib,
  getStoreHoursForDate,
  getTimeSlotsForDate,
  PEKANBARU_DISTRICTS,
  STORE_INFO,
  type CheckoutChannel,
  type CourierProvider,
  type FulfillmentMethod,
} from "@bumbuket/shared";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const maxLeadTimeDays = useMemo(
    () => items.reduce((max, item) => Math.max(max, item.leadTimeDays), 0),
    [items]
  );

  const minDate = useMemo(
    () => getNextAvailableOrderDateWib(maxLeadTimeDays),
    [maxLeadTimeDays]
  );

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [scheduledDate, setScheduledDate] = useState(minDate);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState(
    () => getTimeSlotsForDate(minDate)[0] ?? ""
  );

  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup_store");
  const [courierProvider, setCourierProvider] =
    useState<CourierProvider>("gojek");

  // Data Penerima khusus pengiriman kurir instan (sesuai FORMAT ORDER BUMBUKET)
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(
    PEKANBARU_DISTRICTS[0]
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [checkoutChannel, setCheckoutChannel] =
    useState<CheckoutChannel>("midtrans");

  const [copiedBri, setCopiedBri] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const hasSeparateMoneyBouquetCash = items.some(
    (item) =>
      item.moneyBouquetDetails?.cash_payment_mode === "separate_via_whatsapp"
  );

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

  const copyBriAccount = async () => {
    try {
      await navigator.clipboard.writeText(STORE_INFO.bankAccount.accountNumber);
      setCopiedBri(true);
      setTimeout(() => setCopiedBri(false), 2000);
    } catch {
      // Abaikan bila clipboard tidak diizinkan
    }
  };

  const fillRecipientFromCustomer = () => {
    setRecipientName(customerName);
    setRecipientPhone(customerPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (items.length === 0) {
      setErrorMessage("Keranjang belanja masih kosong.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          fulfillmentMethod,
          courierProvider:
            fulfillmentMethod === "instant_courier" ? courierProvider : null,
          scheduledDate,
          scheduledTimeSlot,
          recipientName:
            fulfillmentMethod === "instant_courier" ? recipientName : null,
          recipientPhone:
            fulfillmentMethod === "instant_courier" ? recipientPhone : null,
          deliveryDistrict:
            fulfillmentMethod === "instant_courier" ? deliveryDistrict : null,
          deliveryAddress:
            fulfillmentMethod === "instant_courier" ? deliveryAddress : null,
          deliveryNotes: deliveryNotes || null,
          checkoutChannel,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            wrappingColor: item.wrappingColor,
            greetingCardText: item.greetingCardText,
            customNotes: item.customNotes,
            moneyBouquetDetails: item.moneyBouquetDetails,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error ?? "Mohon periksa kembali data formulir checkout Anda."
        );
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setIsSubmitting(false);
        return;
      }

      // Simpan snapshot lokal agar halaman tracking tetap tampil mulus bahkan di mode preview
      if (typeof window !== "undefined" && data.orderSnapshot) {
        window.sessionStorage.setItem(
          `bumbuket-order-${data.orderNumber}`,
          JSON.stringify({
            ...data.orderSnapshot,
            whatsappUrl: data.whatsappUrl,
            snapRedirectUrl: data.snapRedirectUrl,
            demoMode: data.demoMode,
          })
        );
      }

      clearCart();

      // 1. Jika checkout via WhatsApp: buka WA dengan FORMAT ORDER BUMBUKET💐 + arahkan ke halaman tracking
      if (checkoutChannel === "whatsapp" && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        router.push(`/orders/${data.orderNumber}`);
        return;
      }

      // 2. Jika Midtrans Snap token tersedia & snap.js termuat di browser
      if (
        checkoutChannel === "midtrans" &&
        data.snapToken &&
        typeof window !== "undefined" &&
        window.snap
      ) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => router.push(`/orders/${data.orderNumber}`),
          onPending: () => router.push(`/orders/${data.orderNumber}`),
          onError: () => router.push(`/orders/${data.orderNumber}`),
          onClose: () => router.push(`/orders/${data.orderNumber}`),
        });
        return;
      }

      // 3. Jika Midtrans mengembalikan redirect_url (fallback tanpa popup)
      if (checkoutChannel === "midtrans" && data.snapRedirectUrl) {
        window.location.href = data.snapRedirectUrl;
        return;
      }

      // 4. Transfer Bank BRI atau fallback langsung ke halaman tracking pesanan
      router.push(`/orders/${data.orderNumber}`);
    } catch {
      setErrorMessage(
        "Gagal terhubung ke server. Silakan coba lagi atau order via WhatsApp."
      );
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-pink-100 bg-white p-12 text-center shadow-card">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Belum ada buket di keranjang
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pilih buket dari katalog terlebih dahulu sebelum melanjutkan checkout.
        </p>
        <Link href="/catalog" className="mt-6 inline-block">
          <Button>Lihat Katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-start gap-8 lg:grid-cols-12"
    >
      {/* KOLOM KIRI: FORMULIR CHECKOUT */}
      <div className="space-y-6 lg:col-span-7">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* 1. Data Customer */}
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            1. Data Pemesan
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="customer-name"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Nama Customer *
              </label>
              <Input
                id="customer-name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Sonia Wulandari"
              />
              {fieldErrors.customerName && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.customerName[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="customer-phone"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                No. WhatsApp Aktif *
              </label>
              <Input
                id="customer-phone"
                required
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0822xxxxxxxx"
              />
              {fieldErrors.customerPhone && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.customerPhone[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="customer-email"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Email (Opsional — untuk bukti pembayaran Midtrans)
              </label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
          </div>
        </section>

        {/* 2. Jadwal Pengambilan / Pengiriman */}
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-rose" />
            <h2 className="font-serif text-xl font-semibold text-foreground">
              2. Tanggal &amp; Jam Pengambilan
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Jam pengambilan <strong>09.00–20.00 WIB</strong> (Sabtu mulai
            12.00 WIB, Minggu tutup).
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkout-date"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Tanggal Pengambilan *
              </label>
              <Input
                id="checkout-date"
                type="date"
                required
                min={minDate}
                value={scheduledDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {fieldErrors.scheduledDate && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.scheduledDate[0]}
                </p>
              )}
            </div>

            <div>
              <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
                <Clock className="h-3.5 w-3.5 text-brand-pink" />
                Jam ({formatIndonesianDate(scheduledDate)}) *
              </span>

              {isClosedDay ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Hari Minggu toko tutup. Pilih hari Senin–Sabtu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledTimeSlot(slot)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        scheduledTimeSlot === slot
                          ? "border-brand-rose bg-brand-rose text-white"
                          : "border-pink-200 bg-white text-foreground hover:bg-brand-blush/40"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              {fieldErrors.scheduledTimeSlot && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.scheduledTimeSlot[0]}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 3. Pengambilan di Toko atau Kurir Instan (GoSend / Maxim / Grab) */}
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            3. Metode Pengambilan (Pekanbaru)
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["pickup_store", "instant_courier"] as FulfillmentMethod[]).map(
              (method) => {
                const option = FULFILLMENT_METHOD_OPTIONS[method];
                const active = fulfillmentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFulfillmentMethod(method)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      active
                        ? "border-brand-rose bg-brand-blush/40 ring-1 ring-brand-rose"
                        : "border-pink-200 bg-white hover:bg-brand-blush/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                        {method === "pickup_store" ? (
                          <MapPin className="h-4 w-4 text-brand-rose" />
                        ) : (
                          <Truck className="h-4 w-4 text-brand-rose" />
                        )}
                        {option.shortLabel}
                      </span>
                      {active && (
                        <Check className="h-4 w-4 text-brand-rose" />
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              }
            )}
          </div>

          {fulfillmentMethod === "pickup_store" ? (
            <div className="mt-4 rounded-2xl border border-pink-100 bg-brand-cream/80 p-4 text-xs">
              <p className="font-semibold text-foreground">
                Lokasi Pengambilan Toko:
              </p>
              <p className="mt-1 text-muted-foreground">{STORE_INFO.address}</p>
              <a
                href={STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-rose hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Google Maps: {STORE_INFO.googleMapsLabel}
              </a>
            </div>
          ) : (
            <div className="mt-5 space-y-4 rounded-2xl border border-pink-100 bg-brand-cream/60 p-4">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Pilih Aplikasi Kurir Instan *
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["gojek", "maxim", "grab"] as CourierProvider[]).map(
                    (provider) => {
                      const opt = COURIER_PROVIDER_OPTIONS[provider];
                      const active = courierProvider === provider;
                      return (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setCourierProvider(provider)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors",
                            active
                              ? "border-brand-rose bg-brand-rose text-white"
                              : "border-pink-200 bg-white text-foreground hover:bg-brand-blush/50"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    }
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Ongkir mengikuti tarif aplikasi{" "}
                  <strong>{COURIER_PROVIDER_OPTIONS[courierProvider].label}</strong>{" "}
                  dan dibayar terpisah.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-pink-100 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-rose">
                  Data Penerima (Via GoSend / Kurir)
                </p>
                <button
                  type="button"
                  onClick={fillRecipientFromCustomer}
                  className="text-xs font-semibold text-brand-rose hover:underline"
                >
                  Sama dengan pemesan
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="recipient-name"
                    className="mb-1 block text-xs font-semibold text-foreground"
                  >
                    Nama Penerima *
                  </label>
                  <Input
                    id="recipient-name"
                    required={fulfillmentMethod === "instant_courier"}
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama penerima buket"
                  />
                  {fieldErrors.recipientName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.recipientName[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="recipient-phone"
                    className="mb-1 block text-xs font-semibold text-foreground"
                  >
                    No. Telp Penerima *
                  </label>
                  <Input
                    id="recipient-phone"
                    type="tel"
                    required={fulfillmentMethod === "instant_courier"}
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                  {fieldErrors.recipientPhone && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.recipientPhone[0]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="delivery-district"
                  className="mb-1 block text-xs font-semibold text-foreground"
                >
                  Kecamatan (Kota Pekanbaru) *
                </label>
                <select
                  id="delivery-district"
                  value={deliveryDistrict}
                  onChange={(e) => setDeliveryDistrict(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-pink-200/90 bg-white px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                >
                  {PEKANBARU_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="delivery-address"
                  className="mb-1 block text-xs font-semibold text-foreground"
                >
                  Alamat Lengkap Penerima *
                </label>
                <Textarea
                  id="delivery-address"
                  required={fulfillmentMethod === "instant_courier"}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah/kos/gedung, patokan warna pagar atau tempat terdekat..."
                />
                {fieldErrors.deliveryAddress && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.deliveryAddress[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="delivery-notes"
                  className="mb-1 block text-xs font-semibold text-foreground"
                >
                  Catatan untuk Driver / Toko (Opsional)
                </label>
                <Input
                  id="delivery-notes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Misal: Titip di resepsionis / kabari dulu sebelum berangkat"
                />
              </div>
            </div>
          )}
        </section>

        {/* 4. Metode Pembayaran (Hybrid Checkout) */}
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              4. Metode Pembayaran
            </h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
              Batas bayar {STORE_INFO.paymentDeadlineMinutes} menit agar diproses
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Option A: Midtrans */}
            <button
              type="button"
              onClick={() => setCheckoutChannel("midtrans")}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-all",
                checkoutChannel === "midtrans"
                  ? "border-brand-rose bg-brand-blush/40 ring-1 ring-brand-rose"
                  : "border-pink-200 bg-white hover:bg-brand-blush/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CreditCard className="h-4 w-4 text-brand-rose" />
                  Pembayaran Otomatis (Midtrans)
                </span>
                {checkoutChannel === "midtrans" && (
                  <Check className="h-4 w-4 text-brand-rose" />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                QRIS, Virtual Account (BRI, BCA, Mandiri, BNI), GoPay,
                ShopeePay, dan E-Wallet. Verifikasi otomatis.
              </p>
            </button>

            {/* Option B: Transfer Bank BRI Manual */}
            <div
              className={cn(
                "rounded-2xl border p-4 transition-all",
                checkoutChannel === "bank_transfer"
                  ? "border-brand-rose bg-brand-blush/40 ring-1 ring-brand-rose"
                  : "border-pink-200 bg-white hover:bg-brand-blush/20"
              )}
            >
              <button
                type="button"
                onClick={() => setCheckoutChannel("bank_transfer")}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Building2 className="h-4 w-4 text-brand-rose" />
                    Transfer Bank {STORE_INFO.bankAccount.bankName} (Rekening
                    Resmi)
                  </span>
                  {checkoutChannel === "bank_transfer" && (
                    <Check className="h-4 w-4 text-brand-rose" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hanya melalui 1 rekening resmi{" "}
                  <strong>
                    {STORE_INFO.bankAccount.bankName}{" "}
                    {STORE_INFO.bankAccount.accountNumber}
                  </strong>{" "}
                  a.n. <strong>{STORE_INFO.bankAccount.accountHolder}</strong>.
                </p>
              </button>

              {checkoutChannel === "bank_transfer" && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pink-200 bg-white px-3.5 py-2.5 text-xs">
                  <div>
                    <p className="font-mono text-sm font-bold text-brand-rose">
                      {STORE_INFO.bankAccount.accountNumber}
                    </p>
                    <p className="text-muted-foreground">
                      {STORE_INFO.bankAccount.bankName} a.n.{" "}
                      {STORE_INFO.bankAccount.accountHolder}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyBriAccount}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-blush px-3 py-1.5 font-semibold text-brand-rose hover:bg-pink-200/80"
                  >
                    {copiedBri ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Salin No. Rek
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Option C: Order via WhatsApp */}
            <button
              type="button"
              onClick={() => setCheckoutChannel("whatsapp")}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-all",
                checkoutChannel === "whatsapp"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                  : "border-pink-200 bg-white hover:bg-emerald-50/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  Kirim Format Order via WhatsApp
                </span>
                {checkoutChannel === "whatsapp" && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Otomatis membuat pesanan dan membuka WhatsApp admin dengan{" "}
                <strong>FORMAT ORDER BUMBUKET💐</strong> yang sudah terisi
                lengkap.
              </p>
            </button>
          </div>
        </section>
      </div>

      {/* KOLOM KANAN: RINGKASAN PESANAN */}
      <aside className="rounded-3xl border border-pink-100 bg-white p-6 shadow-soft lg:sticky lg:top-24 lg:col-span-5">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Ringkasan Pesanan
        </h2>

        <ul className="mt-4 divide-y divide-pink-100">
          {items.map((item) => (
            <li key={item.cartKey} className="py-3 text-xs">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {item.productName} × {item.quantity}
                  </p>
                  {item.variantName && (
                    <p className="text-brand-rose">{item.variantName}</p>
                  )}
                  <p className="text-muted-foreground">
                    Wrap: {item.wrappingColor ?? "-"} • Ucapan:{" "}
                    {item.greetingCardText
                      ? `"${item.greetingCardText.slice(0, 40)}${
                          item.greetingCardText.length > 40 ? "..." : ""
                        }"`
                      : "(Kartu kosong)"}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-brand-rose">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {hasSeparateMoneyBouquetCash && (
          <div className="mt-3 rounded-xl border border-pink-200 bg-brand-blush/40 p-3 text-xs text-brand-rose">
            <strong>Info Money Bouquet:</strong> Total di bawah hanya mencakup
            biaya jasa rangkai. Uang isi buket dapat diantar ke toko atau
            ditransfer terpisah via WhatsApp.
          </div>
        )}

        <div className="mt-4 space-y-2 border-t border-pink-100 pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal Buket</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Ongkir</span>
            <span className="text-xs font-medium">
              {fulfillmentMethod === "pickup_store"
                ? "Gratis (Ambil di Toko)"
                : `Sesuai tarif ${COURIER_PROVIDER_OPTIONS[courierProvider].label}`}
            </span>
          </div>
          <div className="flex justify-between border-t border-pink-100 pt-3 text-base font-bold text-brand-rose">
            <span>Total Bayar</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || isClosedDay}
          variant={checkoutChannel === "whatsapp" ? "whatsapp" : "default"}
          className="mt-6 w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses Pesanan...
            </>
          ) : checkoutChannel === "midtrans" ? (
            "Bayar Sekarang via Midtrans"
          ) : checkoutChannel === "bank_transfer" ? (
            "Buat Pesanan & Bayar via BRI"
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              Buat Pesanan &amp; Kirim ke WhatsApp
            </>
          )}
        </Button>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Pembayaran ditunggu maksimal{" "}
          <strong>{STORE_INFO.paymentDeadlineMinutes} menit</strong> agar
          pesanan segera masuk jadwal florist.
        </p>
      </aside>
    </form>
  );
}
