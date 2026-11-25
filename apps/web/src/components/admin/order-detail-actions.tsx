"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  MessageCircle,
  Printer,
  XCircle,
} from "lucide-react";
import {
  ADMIN_ORDER_WORKFLOW_STEPS,
  buildWhatsAppUrl,
  formatRupiah,
  ORDER_STATUS_META,
  type OrderStatus,
  type OrderWithItems,
} from "@bumbuket/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface OrderDetailActionsProps {
  order: OrderWithItems;
}

export function OrderDetailActions({ order }: OrderDetailActionsProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(
    order.order_status
  );
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  const patchOrder = async (payload: Record<string, unknown>, msg: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback(json.error ?? "Gagal memperbarui pesanan.");
        return;
      }
      if (payload.orderStatus) {
        setCurrentStatus(payload.orderStatus as OrderStatus);
      }
      if (payload.paymentStatus) {
        setPaymentStatus(payload.paymentStatus as typeof paymentStatus);
        if (
          (payload.paymentStatus === "paid" ||
            payload.paymentStatus === "dp_paid") &&
          currentStatus === "pending_payment"
        ) {
          setCurrentStatus("processing");
        }
      }
      setFeedback(
        json.demoMode
          ? `${msg} (Mode Preview — hubungkan Supabase untuk simpan permanen)`
          : msg
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const copyGreetingCard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCardId(id);
      setTimeout(() => setCopiedCardId(null), 2000);
    } catch {
      // Abaikan
    }
  };

  const notifyCustomerWaUrl = buildWhatsAppUrl(
    `Halo Kak ${order.customer_name}! Pesanan *${order.order_number}* dari Bumbuket.pku saat ini berstatus: *${ORDER_STATUS_META[currentStatus].label}*. Terima kasih!`,
    order.customer_phone
  );

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 print:hidden">
          {feedback}
        </div>
      )}

      {/* Bukti Transfer BRI dari Customer */}
      {(order.checkout_channel === "bank_transfer" || order.payment_proof_url) && (
        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand-rose" />
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Bukti Transfer BRI
              </h2>
            </div>
            {order.payment_proof_url ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                Screenshot Sudah Diunggah
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                Belum Unggah Bukti Transfer
              </span>
            )}
          </div>

          {order.payment_proof_url ? (
            <div className="mt-4 flex flex-wrap items-start gap-4">
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noreferrer"
                className="relative h-48 w-36 shrink-0 overflow-hidden rounded-2xl border border-pink-200 bg-brand-cream shadow-xs transition-transform hover:scale-[1.02]"
              >
                <Image
                  src={order.payment_proof_url}
                  alt={`Bukti transfer ${order.order_number}`}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </a>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Customer telah mengunggah screenshot bukti transfer BRI.
                </p>
                {order.payment_proof_uploaded_at && (
                  <p>
                    Waktu unggah:{" "}
                    <strong className="text-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date(order.payment_proof_uploaded_at))}{" "}
                      WIB
                    </strong>
                  </p>
                )}
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-blush px-3.5 py-2 font-semibold text-brand-rose hover:bg-pink-200/70"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka Gambar Ukuran Penuh
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Customer belum mengunggah screenshot bukti transfer di halaman pesanan.
            </p>
          )}
        </div>
      )}

      {/* Konfirmasi Pembayaran Manual (DP / Pelunasan / Lunas) */}
      {paymentStatus !== "paid" && currentStatus !== "cancelled" && (
        <div
          className={cn(
            "rounded-2xl border p-4 print:hidden",
            paymentStatus === "dp_paid"
              ? "border-sky-200 bg-sky-50"
              : "border-amber-200 bg-amber-50"
          )}
        >
          <p
            className={cn(
              "text-xs font-bold",
              paymentStatus === "dp_paid" ? "text-sky-900" : "text-amber-900"
            )}
          >
            {paymentStatus === "dp_paid"
              ? "DP Sudah Diterima — Menunggu Pelunasan Sisa"
              : order.payment_plan === "dp"
                ? "Pesanan Skema DP — Belum Terkonfirmasi"
                : `Pembayaran Belum Terkonfirmasi (${paymentStatus.toUpperCase()})`}
          </p>

          {order.payment_plan === "dp" && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <span>
                Total: <strong>{formatRupiah(order.total_amount)}</strong>
              </span>
              <span>
                DP: <strong className="text-brand-rose">{formatRupiah(order.dp_amount ?? 0)}</strong>
              </span>
              <span>
                Sisa Pelunasan:{" "}
                <strong>
                  {formatRupiah(
                    order.remaining_amount ??
                      Math.max(0, order.total_amount - (order.dp_amount ?? 0))
                  )}
                </strong>
              </span>
            </div>
          )}

          <p
            className={cn(
              "mt-1 text-xs",
              paymentStatus === "dp_paid" ? "text-sky-800" : "text-amber-800"
            )}
          >
            Setelah mengecek mutasi BRI Sonia Wulandari (<code>540701018229534</code>),
            konfirmasi status pembayaran di bawah ini.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {order.payment_plan === "dp" && paymentStatus !== "dp_paid" && (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  patchOrder(
                    { paymentStatus: "dp_paid", orderStatus: "processing" },
                    "DP dikonfirmasi diterima & pesanan masuk tahap Diproses!"
                  )
                }
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Konfirmasi DP Diterima ({formatRupiah(order.dp_amount ?? 0)})
              </Button>
            )}

            <Button
              size="sm"
              disabled={saving}
              onClick={() =>
                patchOrder(
                  paymentStatus === "dp_paid"
                    ? { paymentStatus: "paid" }
                    : { paymentStatus: "paid", orderStatus: "processing" },
                  paymentStatus === "dp_paid"
                    ? "Pelunasan dikonfirmasi! Pembayaran kini Lunas."
                    : "Pembayaran dikonfirmasi Lunas & pesanan masuk tahap Diproses!"
                )
              }
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {paymentStatus === "dp_paid"
                ? "Konfirmasi Pelunasan Lunas"
                : "Konfirmasi Pembayaran Lunas"}
            </Button>
          </div>
        </div>
      )}

      {/* Tombol Workflow Status Florist */}
      <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card print:hidden">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Update Status Pengerjaan
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ADMIN_ORDER_WORKFLOW_STEPS.map((step) => {
            const active = currentStatus === step;
            return (
              <button
                key={step}
                type="button"
                disabled={saving}
                onClick={() =>
                  patchOrder(
                    { orderStatus: step },
                    `Status diperbarui ke "${ORDER_STATUS_META[step].label}".`
                  )
                }
                className={cn(
                  "rounded-2xl border px-3 py-3 text-xs font-bold transition-all",
                  active
                    ? "border-brand-rose bg-brand-rose text-white shadow-soft"
                    : "border-pink-200 bg-white text-foreground hover:bg-brand-blush/50"
                )}
              >
                {ORDER_STATUS_META[step].label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-2">
          <label
            htmlFor="admin-notes"
            className="block text-xs font-semibold text-foreground"
          >
            Catatan Internal Admin / Florist
          </label>
          <Textarea
            id="admin-notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Misal: Sudah difotokan ke customer, menunggu driver GoSend..."
            className="min-h-[76px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  patchOrder({ adminNotes }, "Catatan admin berhasil disimpan.")
                }
              >
                Simpan Catatan
              </Button>
              <a href={notifyCustomerWaUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="whatsapp">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Kabari Customer via WA
                </Button>
              </a>
            </div>

            {currentStatus !== "cancelled" && currentStatus !== "completed" && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  patchOrder(
                    { orderStatus: "cancelled" },
                    "Pesanan telah dibatalkan."
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
              >
                <XCircle className="h-3.5 w-3.5" />
                Batalkan Pesanan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kartu Ucapan Siap Cetak / Salin */}
      <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Kartu Ucapan (Siap Salin / Cetak)
          </h2>
          <Button
            size="sm"
            variant="soft"
            onClick={() => typeof window !== "undefined" && window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak Kartu Ucapan
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(order.items ?? []).map((item, idx) => {
            const cardText =
              item.greeting_card_text?.trim() || "(Kartu kosong saja)";
            return (
              <div
                key={item.id ?? idx}
                className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-pink-200 bg-brand-blush/20 p-5 text-center"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-pink">
                    Bumbuket.pku • {item.product_name}
                  </p>
                  <p className="mt-3 font-serif text-base italic leading-relaxed text-brand-rose">
                    &ldquo;{cardText}&rdquo;
                  </p>
                </div>

                {item.greeting_card_text && (
                  <button
                    type="button"
                    onClick={() => copyGreetingCard(item.id, cardText)}
                    className="mx-auto mt-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-rose ring-1 ring-pink-200 hover:bg-brand-blush/50 print:hidden"
                  >
                    {copiedCardId === item.id ? (
                      <>
                        <Check className="h-3 w-3" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Salin Teks
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
