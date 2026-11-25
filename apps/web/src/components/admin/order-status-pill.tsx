import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  type OrderStatus,
  type PaymentStatus,
} from "@bumbuket/shared";
import { cn } from "@/lib/utils";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  const toneClass =
    meta.tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : meta.tone === "pink"
        ? "bg-brand-blush text-brand-rose border-pink-200"
        : meta.tone === "info"
          ? "bg-sky-50 text-sky-800 border-sky-200"
          : meta.tone === "danger"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-900 border-amber-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        toneClass
      )}
    >
      {meta.label}
    </span>
  );
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  const toneClass =
    meta.tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : meta.tone === "info"
        ? "bg-sky-50 text-sky-800 border-sky-200"
        : meta.tone === "warning"
          ? "bg-amber-50 text-amber-900 border-amber-200"
          : meta.tone === "danger"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        toneClass
      )}
    >
      {meta.label}
    </span>
  );
}
