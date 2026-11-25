"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import {
  ADMIN_ORDER_WORKFLOW_STEPS,
  buildOrderConfirmWaLink,
  COURIER_PROVIDER_OPTIONS,
  formatRupiah,
  formatScheduleLabel,
  FULFILLMENT_METHOD_OPTIONS,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  STORE_INFO,
  type OrderWithItems,
} from "@bumbuket/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderTrackerProps {
  orderNumber: string;
  initialOrder: OrderWithItems | null;
}

interface StoredDemoOrder extends Partial<OrderWithItems> {
  whatsappUrl?: string;
  snapRedirectUrl?: string | null;
  demoMode?: boolean;
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "00:00";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function OrderTracker({
  orderNumber,
  initialOrder,
}: OrderTrackerProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(initialOrder);
  const [demoFallback, setDemoFallback] = useState<StoredDemoOrder | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [copiedBri, setCopiedBri] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofSuccess, setProofSuccess] = useState<string | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(
    initialOrder?.payment_proof_url ?? null
  );
  const [uploadedProofAt, setUploadedProofAt] = useState<string | null>(
    initialOrder?.payment_proof_uploaded_at ?? null
  );

  // Jika dibuka di mode preview lokal tanpa Supabase, baca snapshot dari sessionStorage
  useEffect(() => {
    if (!order && typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem(`bumbuket-order-${orderNumber}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as StoredDemoOrder;
          setDemoFallback(parsed);
        } catch {
          // Abaikan JSON rusak
        }
      }
    }
  }, [order, orderNumber]);

  // Live countdown 10 menit pembayaran
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOrder = (order ?? demoFallback) as StoredDemoOrder | null;

  const refreshOrder = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.order) {
          setOrder(json.order);
          if (json.order.payment_proof_url) {
            setUploadedProofUrl(json.order.payment_proof_url);
            setUploadedProofAt(json.order.payment_proof_uploaded_at ?? null);
          }
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    setProofError(null);
    setProofSuccess(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
        {
          method: "POST",
          body: fd,
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setProofError(json.error ?? "Gagal mengunggah screenshot bukti transfer.");
        return;
      }

      setUploadedProofUrl(json.url);
      setUploadedProofAt(json.uploadedAt ?? new Date().toISOString());
      setProofSuccess(
        "Bukti transfer berhasil diunggah! Admin kami akan segera memverifikasi pembayaran Anda."
      );
      await refreshOrder();
    } catch {
      setProofError("Terjadi kesalahan jaringan saat mengunggah bukti transfer.");
    } finally {
      setUploadingProof(false);
      e.target.value = "";
    }
  };

  const copyBriAccount = async () => {
    try {
      await navigator.clipboard.writeText(STORE_INFO.bankAccount.accountNumber);
      setCopiedBri(true);
      setTimeout(() => setCopiedBri(false), 2000);
    } catch {
      // Abaikan
    }
  };

  if (!activeOrder) {
    return (
      <div className="rounded-3xl border border-pink-100 bg-white p-12 text-center shadow-card">
        <Package className="mx-auto h-10 w-10 text-brand-pink" />
        <h1 className="mt-4 font-serif text-2xl font-bold">
          Pesanan {orderNumber} tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pastikan nomor pesanan sudah benar atau hubungi admin kami melalui
          WhatsApp.
        </p>
        <Link href="/catalog" className="mt-6 inline-block">
          <Button>Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  const orderStatus = activeOrder.order_status ?? "pending_payment";
  const paymentStatus = activeOrder.payment_status ?? "pending";
  const paymentPlan = activeOrder.payment_plan ?? "full";
  const dpAmount = activeOrder.dp_amount ?? 0;
  const remainingAmount =
    paymentStatus === "paid"
      ? 0
      : activeOrder.remaining_amount ??
        (paymentPlan === "dp"
          ? Math.max(0, (activeOrder.total_amount ?? 0) - dpAmount)
          : 0);
  const transferTargetAmount =
    paymentStatus === "dp_paid"
      ? remainingAmount
      : paymentPlan === "dp" && dpAmount > 0
        ? dpAmount
        : activeOrder.total_amount ?? 0;

  const statusMeta = ORDER_STATUS_META[orderStatus];
  const paymentMeta = PAYMENT_STATUS_META[paymentStatus];
  const items = activeOrder.items ?? [];

  const expiresAtMs = activeOrder.payment_expires_at
    ? new Date(activeOrder.payment_expires_at).getTime()
    : null;
  const remainingMs = expiresAtMs ? expiresAtMs - nowMs : null;
  const isWaitingPayment =
    paymentStatus === "pending" || paymentStatus === "unpaid";
  const isWaitingSettlement = paymentStatus === "dp_paid" && remainingAmount > 0;

  const hasSeparateMoneyBouquetCash = items.some(
    (item) =>
      item.money_bouquet_details?.cash_payment_mode === "separate_via_whatsapp"
  );

  const waConfirmUrl =
    demoFallback?.whatsappUrl ??
    buildOrderConfirmWaLink({
      orderNumber: activeOrder.order_number ?? orderNumber,
      customerName: activeOrder.customer_name ?? "-",
      totalAmount: activeOrder.total_amount ?? 0,
      scheduledDate: activeOrder.scheduled_date ?? "",
      scheduledTimeSlot: activeOrder.scheduled_time_slot ?? "",
      fulfillmentMethod: activeOrder.fulfillment_method ?? "pickup_store",
      courierProvider: activeOrder.courier_provider ?? null,
      recipientName: activeOrder.recipient_name ?? null,
      recipientPhone: activeOrder.recipient_phone ?? null,
      deliveryAddress: activeOrder.delivery_address ?? null,
      deliveryDistrict: activeOrder.delivery_district ?? null,
      paymentMethodLabel: activeOrder.payment_method ?? undefined,
      paymentPlan,
      dpAmount,
      remainingAmount,
      hasSeparateMoneyBouquetCash,
      itemsSummary: items.map((item) => ({
        productName: item.product_name,
        variantName: item.variant_name,
        quantity: item.quantity,
        wrappingColor: item.wrapping_color,
        greetingCardText: item.greeting_card_text,
        moneyBouquetDetails: item.money_bouquet_details,
      })),
    });

  return (
    <div className="space-y-6">
      {/* Header Pesanan */}
      <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
              Status Pesanan Bumbuket.pku
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
              {activeOrder.order_number ?? orderNumber}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={paymentStatus === "paid" ? "ready" : "preorder"}>
                Pembayaran: {paymentMeta.label}
              </Badge>
              <Badge variant="blush">Status: {statusMeta.label}</Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrder}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            Perbarui Status
          </Button>
        </div>

        {/* Countdown 10 Menit Pembayaran */}
        {isWaitingPayment && remainingMs !== null && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-bold">
                  Payment ditunggu {STORE_INFO.paymentDeadlineMinutes} menit
                  supaya orderan bisa diproses
                </p>
                <p className="text-amber-800/90">
                  Selesaikan pembayaran sebelum batas waktu berakhir agar slot
                  jadwal buketmu tetap aman.
                </p>
              </div>
            </div>
            <span className="rounded-xl bg-white px-3.5 py-2 font-mono text-lg font-bold text-brand-rose shadow-xs ring-1 ring-amber-200">
              {remainingMs > 0 ? formatCountdown(remainingMs) : "Waktu Habis"}
            </span>
          </div>
        )}

        {/* Instruksi Pembayaran BRI atau Midtrans */}
        {(isWaitingPayment || isWaitingSettlement) &&
          activeOrder.checkout_channel === "bank_transfer" && (
          <div className="mt-5 rounded-2xl border border-pink-200 bg-brand-blush/35 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-rose">
                <Building2 className="h-4 w-4" />
                {isWaitingSettlement
                  ? `Instruksi Pelunasan Sisa DP — Bank ${STORE_INFO.bankAccount.bankName}`
                  : paymentPlan === "dp"
                    ? `Instruksi Transfer DP — Bank ${STORE_INFO.bankAccount.bankName}`
                    : `Instruksi Transfer Bank ${STORE_INFO.bankAccount.bankName}`}
              </div>
              {paymentPlan === "dp" && (
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 ring-1 ring-sky-200">
                  {isWaitingSettlement ? "DP Sudah Diterima" : "Skema Bayar DP"}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pembayaran transfer hanya melalui 1 rekening resmi berikut:
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-pink-200">
              <div>
                <p className="text-xs text-muted-foreground">
                  Bank {STORE_INFO.bankAccount.bankName} — a.n.{" "}
                  <strong>{STORE_INFO.bankAccount.accountHolder}</strong>
                </p>
                <p className="mt-0.5 font-mono text-xl font-bold text-brand-rose">
                  {STORE_INFO.bankAccount.accountNumber}
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  {isWaitingSettlement
                    ? "Sisa Pelunasan:"
                    : paymentPlan === "dp"
                      ? "Nominal DP Sekarang:"
                      : "Total Transfer:"}{" "}
                  <span className="text-brand-rose">
                    {formatRupiah(transferTargetAmount)}
                  </span>
                </p>
                {paymentPlan === "dp" && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Total Pesanan: {formatRupiah(activeOrder.total_amount ?? 0)}
                    {!isWaitingSettlement &&
                      ` • Sisa Pelunasan: ${formatRupiah(remainingAmount)}`}
                  </p>
                )}
              </div>
              <Button variant="soft" size="sm" onClick={copyBriAccount}>
                {copiedBri ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Salin Rekening
                  </>
                )}
              </Button>
            </div>

            {/* Upload Screenshot Bukti Transfer BRI */}
            <div className="mt-4 rounded-2xl border border-pink-200 bg-white p-4">
              <p className="text-xs font-bold text-foreground">
                Upload Screenshot Bukti Transfer BRI
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Unggah foto/screenshot struk transfer (JPG, PNG, atau WebP, maks 5 MB) agar admin dapat langsung memverifikasi pesanan Anda.
              </p>

              {proofError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {proofError}
                </div>
              )}

              {proofSuccess && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                  {proofSuccess}
                </div>
              )}

              {(uploadedProofUrl ?? activeOrder.payment_proof_url) ? (
                <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <a
                    href={(uploadedProofUrl ?? activeOrder.payment_proof_url)!}
                    target="_blank"
                    rel="noreferrer"
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-xs"
                  >
                    <Image
                      src={(uploadedProofUrl ?? activeOrder.payment_proof_url)!}
                      alt="Bukti Transfer BRI"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </a>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="inline-flex items-center gap-1.5 font-bold text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Bukti Transfer Terkirim — Menunggu Verifikasi Admin
                    </p>
                    {(uploadedProofAt ?? activeOrder.payment_proof_uploaded_at) && (
                      <p className="mt-0.5 text-[11px] text-emerald-800/90">
                        Diunggah:{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Jakarta",
                        }).format(
                          new Date(
                            (uploadedProofAt ??
                              activeOrder.payment_proof_uploaded_at)!
                          )
                        )}{" "}
                        WIB
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <a
                        href={(uploadedProofUrl ?? activeOrder.payment_proof_url)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Lihat Gambar
                      </a>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-brand-blush px-3 py-1 text-[11px] font-semibold text-brand-rose hover:bg-pink-200/70">
                        {uploadingProof ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ImagePlus className="h-3 w-3" />
                        )}
                        <span>
                          {uploadingProof ? "Mengunggah..." : "Ganti Screenshot"}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingProof}
                          onChange={handleUploadProof}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-rose px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-rose/90">
                    {uploadingProof ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    <span>
                      {uploadingProof
                        ? "Mengunggah Bukti Transfer..."
                        : "Upload Screenshot Bukti Transfer"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingProof}
                      onChange={handleUploadProof}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <a
              href={waConfirmUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block"
            >
              <Button variant="whatsapp" size="sm">
                <MessageCircle className="h-4 w-4" />
                Kirim Konfirmasi &amp; Format Order ke WhatsApp
              </Button>
            </a>
          </div>
        )}

        {/* Tampilkan ringkasan bukti transfer bila sudah terverifikasi Lunas */}
        {paymentStatus === "paid" &&
          (uploadedProofUrl ?? activeOrder.payment_proof_url) && (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <a
                href={(uploadedProofUrl ?? activeOrder.payment_proof_url)!}
                target="_blank"
                rel="noreferrer"
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white"
              >
                <Image
                  src={(uploadedProofUrl ?? activeOrder.payment_proof_url)!}
                  alt="Bukti Transfer BRI"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </a>
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Bukti Transfer BRI Terverifikasi
                </p>
                <a
                  href={(uploadedProofUrl ?? activeOrder.payment_proof_url)!}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-rose hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Lihat Screenshot Bukti Transfer
                </a>
              </div>
            </div>
          )}

        {isWaitingPayment &&
          activeOrder.checkout_channel === "midtrans" &&
          demoFallback?.snapRedirectUrl && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-brand-blush/35 p-4">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <CreditCard className="h-4 w-4 text-brand-rose" />
                <span>
                  Lanjutkan pembayaran QRIS / Virtual Account / E-Wallet di
                  Midtrans.
                </span>
              </div>
              <a href={demoFallback.snapRedirectUrl}>
                <Button size="sm">Bayar via Midtrans</Button>
              </a>
            </div>
          )}

        {/* Florist Workflow Stepper */}
        {orderStatus !== "cancelled" && (
          <div className="mt-7 border-t border-pink-100 pt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Progres Pengerjaan Buket
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ADMIN_ORDER_WORKFLOW_STEPS.map((step) => {
                const stepMeta = ORDER_STATUS_META[step];
                const isReached = statusMeta.stepOrder >= stepMeta.stepOrder;
                return (
                  <div
                    key={step}
                    className={cn(
                      "rounded-2xl border p-3.5 transition-colors",
                      isReached
                        ? "border-brand-rose bg-brand-blush/40"
                        : "border-pink-100 bg-brand-cream/40 opacity-65"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          isReached
                            ? "text-brand-rose"
                            : "text-muted-foreground/50"
                        )}
                      />
                      <span className="text-xs font-bold text-foreground">
                        {stepMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rincian Jadwal, Pengiriman & Buket */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:col-span-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Jadwal &amp; Pengambilan
          </h2>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-brand-rose" />
              <div>
                <p className="font-semibold text-foreground">Jadwal</p>
                <p>
                  {activeOrder.scheduled_date && activeOrder.scheduled_time_slot
                    ? formatScheduleLabel(
                        activeOrder.scheduled_date,
                        activeOrder.scheduled_time_slot
                      )
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {activeOrder.fulfillment_method === "pickup_store" ? (
                <MapPin className="mt-0.5 h-4 w-4 text-brand-rose" />
              ) : (
                <Truck className="mt-0.5 h-4 w-4 text-brand-rose" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {
                    FULFILLMENT_METHOD_OPTIONS[
                      activeOrder.fulfillment_method ?? "pickup_store"
                    ].label
                  }
                </p>
                {activeOrder.fulfillment_method === "pickup_store" ? (
                  <>
                    <p>{STORE_INFO.address}</p>
                    <a
                      href={STORE_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-rose hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Maps: {STORE_INFO.googleMapsLabel}
                    </a>
                  </>
                ) : (
                  <div className="mt-1 space-y-1">
                    {activeOrder.courier_provider && (
                      <p>
                        Kurir:{" "}
                        <strong className="text-foreground">
                          {
                            COURIER_PROVIDER_OPTIONS[
                              activeOrder.courier_provider
                            ].label
                          }
                        </strong>{" "}
                        (ongkir dibayar terpisah)
                      </p>
                    )}
                    <p>
                      Penerima:{" "}
                      <strong className="text-foreground">
                        {activeOrder.recipient_name ?? "-"}
                      </strong>{" "}
                      ({activeOrder.recipient_phone ?? "-"})
                    </p>
                    <p>
                      Alamat: {activeOrder.delivery_address ?? "-"}
                      {activeOrder.delivery_district
                        ? `, Kec. ${activeOrder.delivery_district}, Pekanbaru`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <a
            href={waConfirmUrl}
            target="_blank"
            rel="noreferrer"
            className="block pt-2"
          >
            <Button variant="whatsapp" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Konfirmasi / Tanya Admin via WA
            </Button>
          </a>
        </div>

        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:col-span-7">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Rincian Buket
          </h2>

          <ul className="mt-4 divide-y divide-pink-100">
            {items.map((item, idx) => (
              <li key={item.id ?? idx} className="py-3.5 text-xs">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.product_name} × {item.quantity}
                    </p>
                    {item.variant_name && (
                      <p className="text-brand-rose">{item.variant_name}</p>
                    )}
                    <p className="mt-1 text-muted-foreground">
                      <strong>Wrapping:</strong> {item.wrapping_color ?? "-"}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Kartu Ucapan:</strong>{" "}
                      {item.greeting_card_text ? (
                        <span className="italic">
                          &ldquo;{item.greeting_card_text}&rdquo;
                        </span>
                      ) : (
                        "(Kartu kosong saja)"
                      )}
                    </p>
                    {item.money_bouquet_details && (
                      <p className="mt-1 text-brand-rose">
                        Money Bouquet: {item.money_bouquet_details.sheet_count}{" "}
                        lembar ×{" "}
                        {formatRupiah(item.money_bouquet_details.denomination)}{" "}
                        (
                        {item.money_bouquet_details.cash_payment_mode ===
                        "included_in_checkout"
                          ? "Bayar sekaligus"
                          : "Uang terpisah via WA"}
                        )
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-brand-rose">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-pink-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Total Pesanan
              </span>
              <span className="text-xl font-bold text-brand-rose">
                {formatRupiah(activeOrder.total_amount ?? 0)}
              </span>
            </div>
            {paymentPlan === "dp" && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Skema Pembayaran (DP)</span>
                  <span className="font-semibold text-foreground">
                    {formatRupiah(dpAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sisa Pelunasan</span>
                  <span className="font-bold text-brand-rose">
                    {formatRupiah(remainingAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
