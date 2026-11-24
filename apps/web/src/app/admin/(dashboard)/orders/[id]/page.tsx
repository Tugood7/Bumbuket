import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Truck } from "lucide-react";
import {
  COURIER_PROVIDER_OPTIONS,
  formatRupiah,
  formatScheduleLabel,
  FULFILLMENT_METHOD_OPTIONS,
} from "@bumbuket/shared";
import { getAdminOrderById } from "@/lib/data/admin";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import {
  OrderStatusPill,
  PaymentStatusPill,
} from "@/components/admin/order-status-pill";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href="/admin/schedule"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-rose hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Jadwal Pesanan
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {order.order_number}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Customer: <strong>{order.customer_name}</strong> •{" "}
              {order.customer_phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PaymentStatusPill status={order.payment_status} />
            <OrderStatusPill status={order.order_status} />
          </div>
        </div>
      </div>

      {/* Info Jadwal, Pengiriman & Item */}
      <div className="grid gap-6 lg:grid-cols-12 print:hidden">
        <div className="space-y-4 rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:col-span-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Jadwal &amp; Pengiriman
          </h2>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-brand-rose" />
              <p className="font-semibold text-foreground">
                {formatScheduleLabel(
                  order.scheduled_date,
                  order.scheduled_time_slot
                )}
              </p>
            </div>

            <div className="flex items-start gap-2">
              {order.fulfillment_method === "pickup_store" ? (
                <MapPin className="mt-0.5 h-4 w-4 text-brand-rose" />
              ) : (
                <Truck className="mt-0.5 h-4 w-4 text-brand-rose" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {FULFILLMENT_METHOD_OPTIONS[order.fulfillment_method].label}
                </p>
                {order.fulfillment_method === "instant_courier" && (
                  <div className="mt-1 space-y-1">
                    {order.courier_provider && (
                      <p>
                        Kurir:{" "}
                        <strong className="text-foreground">
                          {COURIER_PROVIDER_OPTIONS[order.courier_provider].label}
                        </strong>
                      </p>
                    )}
                    <p>
                      Penerima:{" "}
                      <strong className="text-foreground">
                        {order.recipient_name ?? "-"}
                      </strong>{" "}
                      ({order.recipient_phone ?? "-"})
                    </p>
                    <p>
                      Alamat: {order.delivery_address ?? "-"}
                      {order.delivery_district
                        ? `, Kec. ${order.delivery_district}`
                        : ""}
                    </p>
                    {order.delivery_notes && (
                      <p className="italic">Catatan: {order.delivery_notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:col-span-7">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Rincian Item Buket
          </h2>
          <ul className="mt-3 divide-y divide-pink-100 text-xs">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.product_name} × {item.quantity}
                    </p>
                    {item.variant_name && (
                      <p className="text-brand-rose">{item.variant_name}</p>
                    )}
                    <p className="mt-1 text-muted-foreground">
                      Warna Wrapping: <strong>{item.wrapping_color ?? "-"}</strong>
                    </p>
                    {item.custom_notes && (
                      <p className="text-muted-foreground">
                        Catatan: {item.custom_notes}
                      </p>
                    )}
                    {item.money_bouquet_details && (
                      <p className="mt-1 font-semibold text-brand-rose">
                        Money Bouquet: {item.money_bouquet_details.sheet_count}{" "}
                        lembar ×{" "}
                        {formatRupiah(item.money_bouquet_details.denomination)} (
                        {item.money_bouquet_details.cash_payment_mode ===
                        "included_in_checkout"
                          ? "Bayar sekaligus"
                          : "Uang diantar/transfer via WA"}
                        )
                        {item.money_bouquet_details.include_foil_balloon
                          ? " • +Balon Foil"
                          : ""}
                        {item.money_bouquet_details.request_new_notes
                          ? " • Req Uang Baru"
                          : ""}
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

          <div className="mt-3 flex justify-between border-t border-pink-100 pt-3 text-base font-bold text-brand-rose">
            <span>Total Checkout</span>
            <span>{formatRupiah(order.total_amount)}</span>
          </div>
        </div>
      </div>

      <OrderDetailActions order={order} />
    </div>
  );
}
