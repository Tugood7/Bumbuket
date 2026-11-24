import crypto from "crypto";
import {
  STORE_INFO,
  type OrderStatus,
  type PaymentStatus,
} from "@bumbuket/shared";

const MIDTRANS_SANDBOX_SNAP_URL =
  "https://app.sandbox.midtrans.com/snap/v1/transactions";
const MIDTRANS_PRODUCTION_SNAP_URL =
  "https://app.midtrans.com/snap/v1/transactions";

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export function getMidtransSnapScriptUrl(): string {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return isProd
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export interface MidtransSnapRequestParams {
  orderNumber: string;
  grossAmount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  finishRedirectUrl?: string;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

/**
 * Membuat transaksi Midtrans Snap (mendukung QRIS, Virtual Account, GoPay/ShopeePay/E-Wallet)
 * dengan batas waktu pembayaran 10 menit sesuai aturan Bumbuket.pku.
 */
export async function createMidtransSnapTransaction(
  params: MidtransSnapRequestParams
): Promise<MidtransSnapResponse> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const endpoint = isProd
    ? MIDTRANS_PRODUCTION_SNAP_URL
    : MIDTRANS_SANDBOX_SNAP_URL;

  const authHeader = Buffer.from(`${serverKey}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id: params.orderNumber,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerName,
      phone: params.customerPhone,
      email: params.customerEmail || undefined,
    },
    item_details: params.items.map((item) => ({
      id: item.id.slice(0, 50),
      name: item.name.slice(0, 50),
      price: item.price,
      quantity: item.quantity,
    })),
    expiry: {
      unit: "minutes",
      duration: STORE_INFO.paymentDeadlineMinutes,
    },
    callbacks: params.finishRedirectUrl
      ? { finish: params.finishRedirectUrl }
      : undefined,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gagal membuat transaksi Midtrans (${response.status}): ${errorBody}`
    );
  }

  return (await response.json()) as MidtransSnapResponse;
}

/**
 * Verifikasi SHA-512 signature_key dari webhook Midtrans secara timing-safe.
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !params.signatureKey) return false;

  const expected = crypto
    .createHash("sha512")
    .update(
      `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`
    )
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(params.signatureKey, "utf8");

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus | null;
  isPaidNow: boolean;
} {
  if (transactionStatus === "capture") {
    if (fraudStatus === "accept" || !fraudStatus) {
      return {
        paymentStatus: "paid",
        orderStatus: "processing",
        isPaidNow: true,
      };
    }
    return { paymentStatus: "pending", orderStatus: null, isPaidNow: false };
  }

  if (transactionStatus === "settlement") {
    return {
      paymentStatus: "paid",
      orderStatus: "processing",
      isPaidNow: true,
    };
  }

  if (transactionStatus === "pending") {
    return { paymentStatus: "pending", orderStatus: null, isPaidNow: false };
  }

  if (transactionStatus === "expire") {
    return {
      paymentStatus: "expired",
      orderStatus: "cancelled",
      isPaidNow: false,
    };
  }

  if (transactionStatus === "deny" || transactionStatus === "cancel") {
    return {
      paymentStatus: "failed",
      orderStatus: "cancelled",
      isPaidNow: false,
    };
  }

  if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
    return {
      paymentStatus: "refunded",
      orderStatus: "cancelled",
      isPaidNow: false,
    };
  }

  return { paymentStatus: "pending", orderStatus: null, isPaidNow: false };
}
