import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Flower2,
  Wallet,
} from "lucide-react";
import {
  COURIER_PROVIDER_OPTIONS,
  formatIndonesianDate,
  formatRupiah,
} from "@bumbuket/shared";
import { getAdminDashboardSummary } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import {
  OrderStatusPill,
  PaymentStatusPill,
} from "@/components/admin/order-status-pill";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminOverviewPage() {
  const summary = await getAdminDashboardSummary();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
            {formatIndonesianDate(summary.today)}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
            Ringkasan Operasional
          </h1>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/schedule">
            <Button variant="outline" size="sm">
              <CalendarClock className="h-4 w-4" />
              Jadwal Hari Ini
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button size="sm">+ Tambah Buket</Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Jadwal Hari Ini</span>
            <CalendarClock className="h-4 w-4 text-brand-rose" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-brand-rose">
            {summary.dueTodayCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Pesanan perlu diambil / dikirim hari ini
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Verifikasi TF BRI</span>
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-amber-700">
            {summary.pendingBriCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Menunggu cek mutasi BRI Sonia Wulandari
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Antrean Florist</span>
            <Flower2 className="h-4 w-4 text-brand-pink" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-foreground">
            {summary.activeArrangingCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Status Diproses &amp; Sedang Dirangkai
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Total Lunas</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-emerald-700">
            {formatRupiah(summary.paidRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Dari seluruh pesanan berstatus Lunas
          </p>
        </div>
      </div>

      {/* Jadwal Mendesak Hari Ini + Stok Menipis */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Antrean Pengambilan / Kirim Hari Ini
            </h2>
            <Link
              href="/admin/schedule"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-rose hover:underline"
            >
              Lihat Semua Jadwal <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {summary.upcomingOrders.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-brand-cream p-6 text-center text-sm text-muted-foreground">
              Belum ada jadwal pengambilan/pengiriman aktif untuk hari ini.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-pink-100">
              {summary.upcomingOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-blush px-2.5 py-0.5 text-xs font-bold text-brand-rose">
                        {order.scheduled_time_slot} WIB
                      </span>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-bold text-foreground hover:text-brand-rose"
                      >
                        {order.order_number}
                      </Link>
                      <OrderStatusPill status={order.order_status} />
                      <PaymentStatusPill status={order.payment_status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.customer_name} •{" "}
                      {order.fulfillment_method === "pickup_store"
                        ? "Ambil di Toko"
                        : `Via ${
                            order.courier_provider
                              ? COURIER_PROVIDER_OPTIONS[order.courier_provider]
                                  .label
                              : "Kurir Instan"
                          } → ${order.recipient_name ?? "-"}`}
                    </p>
                  </div>

                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      Kelola
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:col-span-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Stok Ready Menipis
            </h2>
          </div>

          {summary.lowStockReadyProducts.length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Semua produk Ready Stock masih dalam jumlah aman (&gt; 3 pcs).
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {summary.lowStockReadyProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5 text-xs"
                >
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="font-semibold text-foreground hover:text-brand-rose"
                  >
                    {p.name}
                  </Link>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                    Sisa {p.stock_quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
