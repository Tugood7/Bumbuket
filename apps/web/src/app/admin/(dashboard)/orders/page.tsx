import Link from "next/link";
import {
  formatIndonesianDate,
  formatRupiah,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@bumbuket/shared";
import { getAdminOrders } from "@/lib/data/admin";
import {
  OrderStatusPill,
  PaymentStatusPill,
} from "@/components/admin/order-status-pill";
import { cn } from "@/lib/utils";

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

const FILTER_TABS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "pending_payment", label: ORDER_STATUS_META.pending_payment.label },
  { value: "processing", label: ORDER_STATUS_META.processing.label },
  { value: "arranging", label: ORDER_STATUS_META.arranging.label },
  { value: "ready", label: ORDER_STATUS_META.ready.label },
  { value: "completed", label: ORDER_STATUS_META.completed.label },
  { value: "cancelled", label: ORDER_STATUS_META.cancelled.label },
];

export const metadata = {
  title: "Daftar Pesanan — Admin",
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const activeStatus = FILTER_TABS.some((t) => t.value === params.status)
    ? (params.status as OrderStatus | "all")
    : "all";

  const orders = await getAdminOrders(activeStatus);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
          Manajemen Transaksi
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
          Semua Pesanan
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "all"
                ? "/admin/orders"
                : `/admin/orders?status=${tab.value}`
            }
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              activeStatus === tab.value
                ? "bg-brand-rose text-white"
                : "border border-pink-200 bg-white text-foreground hover:bg-brand-blush/50"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-pink-100 bg-brand-cream/80 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5">Pesanan</th>
                <th className="px-4 py-3.5">Jadwal Ambil / Kirim</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Belum ada pesanan untuk filter status ini.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-cream/40">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">
                        {formatIndonesianDate(order.scheduled_date)}
                      </p>
                      <p className="text-[11px] text-brand-rose">
                        {order.scheduled_time_slot} WIB
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">
                        {order.customer_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {order.customer_phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 uppercase">
                      {order.checkout_channel === "bank_transfer"
                        ? "TF BRI"
                        : order.checkout_channel}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-brand-rose">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <OrderStatusPill status={order.order_status} />
                        <PaymentStatusPill status={order.payment_status} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-brand-rose hover:underline"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
