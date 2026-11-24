import type {
  OrderStatus,
  PaymentStatus,
  ProductAvailability,
} from "../types/domain";

export const AVAILABILITY_BADGES: Record<
  ProductAvailability,
  {
    label: string;
    shortLabel: string;
    description: string;
    tone: "ready" | "preorder";
  }
> = {
  ready_stock: {
    label: "Ready Stock",
    shortLabel: "Ready Hari Ini",
    description: "Tersedia di toko, bisa dikirim atau diambil hari ini.",
    tone: "ready",
  },
  pre_order: {
    label: "Pre-Order / Custom",
    shortLabel: "Pre-Order",
    description: "Dirangkai khusus sesuai warna & jadwal pilihan Anda.",
    tone: "preorder",
  },
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    stepOrder: number;
    tone: "neutral" | "info" | "pink" | "success" | "danger";
  }
> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    description: "Pesanan tercatat, menunggu konfirmasi pembayaran.",
    stepOrder: 0,
    tone: "neutral",
  },
  processing: {
    label: "Diproses",
    description: "Pesanan sudah dikonfirmasi dan masuk antrean jadwal florist.",
    stepOrder: 1,
    tone: "info",
  },
  arranging: {
    label: "Dirangkai",
    description: "Buket sedang dirangkai oleh tim Bumbuket.pku.",
    stepOrder: 2,
    tone: "pink",
  },
  ready: {
    label: "Siap Diambil / Dikirim",
    description: "Buket selesai dirangkai dan siap diambil atau diserahkan ke kurir.",
    stepOrder: 3,
    tone: "info",
  },
  completed: {
    label: "Selesai",
    description: "Buket sudah diterima pelanggan. Terima kasih telah berbelanja!",
    stepOrder: 4,
    tone: "success",
  },
  cancelled: {
    label: "Dibatalkan",
    description: "Pesanan dibatalkan.",
    stepOrder: -1,
    tone: "danger",
  },
};

export const ADMIN_ORDER_WORKFLOW_STEPS: readonly OrderStatus[] = [
  "processing",
  "arranging",
  "ready",
  "completed",
] as const;

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  {
    label: string;
    tone: "neutral" | "warning" | "success" | "danger";
  }
> = {
  unpaid: { label: "Belum Dibayar", tone: "neutral" },
  pending: { label: "Menunggu Pembayaran", tone: "warning" },
  paid: { label: "Lunas", tone: "success" },
  failed: { label: "Gagal", tone: "danger" },
  expired: { label: "Kedaluwarsa", tone: "danger" },
  refunded: { label: "Dikembalikan", tone: "neutral" },
};

