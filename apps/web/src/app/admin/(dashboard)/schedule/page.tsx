import Link from "next/link";
import { Calendar, Clock, MapPin, Truck } from "lucide-react";
import {
  COURIER_PROVIDER_OPTIONS,
  formatIndonesianDate,
  formatRupiah,
  getTodayIsoDateWib,
  type OrderWithItems,
} from "@bumbuket/shared";
import { getAdminScheduledOrders } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import {
  OrderStatusPill,
  PaymentStatusPill,
} from "@/components/admin/order-status-pill";

export const metadata = {
  title: "Jadwal Pesanan Masuk — Admin",
};

export default async function AdminSchedulePage() {
  const orders = await getAdminScheduledOrders();
  const today = getTodayIsoDateWib();

  // Kelompokkan berdasarkan scheduled_date (sudah urut ASC dari database)
  const grouped = new Map<string, OrderWithItems[]>();
  for (const order of orders) {
    const existing = grouped.get(order.scheduled_date) ?? [];
    existing.push(order);
    grouped.set(order.scheduled_date, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
            Papan Produksi Florist
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
            Jadwal Pesanan Masuk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Diurutkan otomatis berdasarkan tanggal &amp; jam pengambilan /
            pengiriman terdekat agar tidak ada pesanan yang terlewat.
          </p>
        </div>

        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            Lihat Semua Pesanan
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-pink-100 bg-white p-12 text-center shadow-card">
          <Calendar className="mx-auto h-10 w-10 text-brand-pink" />
          <h2 className="mt-3 font-serif text-xl font-semibold">
            Tidak ada antrean jadwal aktif
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua pesanan sudah selesai atau belum ada pesanan masuk baru.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([date, dayOrders]) => {
            const isToday = date === today;
            return (
              <section key={date} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-serif text-xl font-bold text-brand-rose">
                    {formatIndonesianDate(date)}
                  </h2>
                  {isToday && (
                    <span className="rounded-full bg-brand-rose px-2.5 py-0.5 text-[11px] font-bold text-white">
                      HARI INI
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({dayOrders.length} pesanan)
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {dayOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col justify-between rounded-2xl border border-pink-100 bg-white p-5 shadow-card"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blush px-3 py-1 text-xs font-bold text-brand-rose">
                            <Clock className="h-3.5 w-3.5" />
                            {order.scheduled_time_slot} WIB
                          </span>
                          <div className="flex items-center gap-1.5">
                            <PaymentStatusPill status={order.payment_status} />
                            <OrderStatusPill status={order.order_status} />
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-serif text-lg font-bold text-foreground hover:text-brand-rose"
                          >
                            {order.order_number}
                          </Link>
                          <span className="text-sm font-bold text-brand-rose">
                            {formatRupiah(order.total_amount)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Customer:{" "}
                          <strong className="text-foreground">
                            {order.customer_name}
                          </strong>{" "}
                          ({order.customer_phone})
                        </p>

                        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                          {order.fulfillment_method === "pickup_store" ? (
                            <>
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-pink" />
                              <span>Ambil di Toko (Marpoyan Damai)</span>
                            </>
                          ) : (
                            <>
                              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-pink" />
                              <span>
                                Via{" "}
                                <strong>
                                  {order.courier_provider
                                    ? COURIER_PROVIDER_OPTIONS[
                                        order.courier_provider
                                      ].label
                                    : "Kurir Instan"}
                                </strong>{" "}
                                → {order.recipient_name ?? "-"} (
                                {order.delivery_district ?? "Pekanbaru"})
                              </span>
                            </>
                          )}
                        </div>

                        <ul className="mt-3 space-y-2 border-t border-pink-100 pt-3 text-xs">
                          {(order.items ?? []).map((item) => (
                            <li
                              key={item.id}
                              className="rounded-xl bg-brand-cream/70 p-2.5"
                            >
                              <p className="font-semibold text-foreground">
                                {item.product_name}
                                {item.variant_name
                                  ? ` (${item.variant_name})`
                                  : ""}{" "}
                                × {item.quantity}
                              </p>
                              <p className="mt-0.5 text-muted-foreground">
                                Wrap:{" "}
                                <strong>{item.wrapping_color ?? "-"}</strong>
                              </p>
                              {item.money_bouquet_details && (
                                <p className="mt-0.5 font-semibold text-brand-rose">
                                  Money Bouquet:{" "}
                                  {item.money_bouquet_details.sheet_count} lbr ×{" "}
                                  {formatRupiah(
                                    item.money_bouquet_details.denomination
                                  )}{" "}
                                  (
                                  {item.money_bouquet_details
                                    .cash_payment_mode ===
                                  "included_in_checkout"
                                    ? "Uang sudah di checkout"
                                    : "Uang terpisah via WA"}
                                  )
                                </p>
                              )}
                              <p className="mt-0.5 italic text-muted-foreground">
                                Ucapan:{" "}
                                {item.greeting_card_text
                                  ? `"${item.greeting_card_text}"`
                                  : "(Kartu kosong saja)"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 flex justify-end border-t border-pink-100 pt-3">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm">Update Status &amp; Detail</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
