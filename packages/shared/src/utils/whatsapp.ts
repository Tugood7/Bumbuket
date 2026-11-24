import {
  COURIER_PROVIDER_OPTIONS,
  FULFILLMENT_METHOD_OPTIONS,
} from "../constants/delivery";
import { MONEY_BOUQUET_CASH_PAYMENT_MODES } from "../constants/money-bouquet";
import { STORE_INFO } from "../constants/store";
import type {
  CourierProvider,
  FulfillmentMethod,
  MoneyBouquetDetails,
} from "../types/domain";
import { formatRupiah } from "./currency";
import { formatIndonesianDate } from "./date";

export function normalizeIndonesianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export function buildWhatsAppUrl(
  message: string,
  phone: string = STORE_INFO.whatsappNumber
): string {
  const normalizedPhone = normalizeIndonesianPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export interface CustomProductWaParams {
  customerName?: string | null;
  productName: string;
  availabilityLabel?: string;
  variantName?: string | null;
  unitPrice?: number;
  quantity?: number;
  wrappingColor?: string | null;
  greetingCardText?: string | null;
  scheduledDate?: string | null;
  scheduledTimeSlot?: string | null;
  fulfillmentMethod?: FulfillmentMethod | null;
  courierProvider?: CourierProvider | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAddress?: string | null;
  customNotes?: string | null;
  moneyBouquetDetails?: MoneyBouquetDetails | null;
  productUrl?: string;
}

/**
 * Generator pesan WhatsApp mengikuti FORMAT ORDER BUMBUKET💐 resmi dari toko.
 */
export function buildCustomOrderWaLink(params: CustomProductWaParams): string {
  const methodLabel =
    params.fulfillmentMethod === "instant_courier"
      ? params.courierProvider
        ? `Via ${COURIER_PROVIDER_OPTIONS[params.courierProvider].label} (${COURIER_PROVIDER_OPTIONS[params.courierProvider].serviceName})`
        : "Kurir Instan (GoSend / Maxim / Grab)"
      : "Dijemput di Toko (Marpoyan Damai)";

  const jenisBuket = [
    params.productName,
    params.variantName ? `(${params.variantName})` : null,
    params.quantity && params.quantity > 1 ? `x${params.quantity}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const lines: string[] = [
    "FORMAT ORDER BUMBUKET💐",
    "",
    `• Nama customer : ${params.customerName?.trim() || "-"}`,
    `• Tanggal pengambilan : ${
      params.scheduledDate ? formatIndonesianDate(params.scheduledDate) : "-"
    }`,
    `• Jam pengambilan : ${
      params.scheduledTimeSlot ? `${params.scheduledTimeSlot} WIB` : "-"
    }`,
    "   _(Jam pengambilan 09.00-20.00 WIB)_",
    `• Jenis Buket : ${jenisBuket}`,
    `• Pengambilan : ${methodLabel}`,
    `• Request warna wrapping : ${params.wrappingColor || "-"}`,
    `• Ucapan : ${
      params.greetingCardText?.trim()
        ? params.greetingCardText.trim()
        : "(Kartu kosong saja)"
    }`,
  ];

  if (typeof params.unitPrice === "number") {
    lines.push(
      `• Estimasi Harga : ${formatRupiah(
        params.unitPrice * (params.quantity ?? 1)
      )}`
    );
  }

  if (params.customNotes?.trim()) {
    lines.push(`• Catatan tambahan : ${params.customNotes.trim()}`);
  }

  if (params.moneyBouquetDetails) {
    const mb = params.moneyBouquetDetails;
    lines.push("______________________________");
    lines.push("_(Detail Order Money Bouquet)_");
    lines.push(`• Pecahan uang : ${formatRupiah(mb.denomination)}`);
    lines.push(`• Berapa lembar uang : ${mb.sheet_count} lembar`);
    lines.push(`• Total isi uang : ${formatRupiah(mb.cash_amount)}`);
    lines.push(`• Jasa rangkai : ${formatRupiah(mb.crafting_fee)}`);
    lines.push(
      `• Pembayaran uang : ${MONEY_BOUQUET_CASH_PAYMENT_MODES[mb.cash_payment_mode].label}`
    );
    lines.push(`• Balon foil : ${mb.include_foil_balloon ? "Pakai (Gratis)" : "Tidak"}`);
    if (mb.request_new_notes) {
      lines.push("• Request pecahan baru (2k-20k) : Ya (selama stok tersedia)");
    }
  }

  if (params.fulfillmentMethod === "instant_courier") {
    lines.push("_____________________________");
    lines.push("Metode pengambilan VIA KURIR INSTAN (GoSend / Maxim / Grab)");
    lines.push(`• Nama penerima : ${params.recipientName?.trim() || "-"}`);
    lines.push(`• No. Telp penerima : ${params.recipientPhone?.trim() || "-"}`);
    lines.push(
      `• Alamat lengkap penerima : ${params.deliveryAddress?.trim() || "-"}`
    );
  }

  if (params.productUrl) {
    lines.push("");
    lines.push(`Link produk: ${params.productUrl}`);
  }

  return buildWhatsAppUrl(lines.join("\n"));
}

export interface OrderConfirmationWaParams {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  scheduledDate: string;
  scheduledTimeSlot: string;
  fulfillmentMethod: FulfillmentMethod;
  courierProvider?: CourierProvider | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryDistrict?: string | null;
  paymentMethodLabel?: string;
  hasSeparateMoneyBouquetCash?: boolean;
  itemsSummary: Array<{
    productName: string;
    variantName?: string | null;
    quantity: number;
    wrappingColor?: string | null;
    greetingCardText?: string | null;
    moneyBouquetDetails?: MoneyBouquetDetails | null;
  }>;
}

/**
 * Generator pesan konfirmasi pesanan resmi sesuai FORMAT ORDER BUMBUKET💐
 * untuk checkout via WhatsApp / Transfer BRI / konfirmasi uang Money Bouquet terpisah.
 */
export function buildOrderConfirmWaLink(
  params: OrderConfirmationWaParams
): string {
  const methodLabel =
    params.fulfillmentMethod === "instant_courier" && params.courierProvider
      ? `Via ${COURIER_PROVIDER_OPTIONS[params.courierProvider].label} (${COURIER_PROVIDER_OPTIONS[params.courierProvider].serviceName})`
      : FULFILLMENT_METHOD_OPTIONS[params.fulfillmentMethod].label;

  const jenisBuketList = params.itemsSummary
    .map((item) => {
      const variantPart = item.variantName ? ` (${item.variantName})` : "";
      return `${item.productName}${variantPart} x${item.quantity}`;
    })
    .join(", ");

  const wrappingList = params.itemsSummary
    .map((i) => i.wrappingColor)
    .filter(Boolean)
    .join(", ");

  const ucapanList = params.itemsSummary
    .map((i) => i.greetingCardText?.trim())
    .filter(Boolean)
    .join(" | ");

  const moneyItem = params.itemsSummary.find((i) => i.moneyBouquetDetails);

  const lines: string[] = [
    "FORMAT ORDER BUMBUKET💐",
    `No. Pesanan : *${params.orderNumber}*`,
    "",
    `• Nama customer : ${params.customerName}`,
    `• Tanggal pengambilan : ${formatIndonesianDate(params.scheduledDate)}`,
    `• Jam pengambilan : ${params.scheduledTimeSlot} WIB`,
    "   _(Jam pengambilan 09.00-20.00 WIB)_",
    `• Jenis Buket : ${jenisBuketList}`,
    `• Pengambilan : ${methodLabel}`,
    `• Request warna wrapping : ${wrappingList || "-"}`,
    `• Ucapan : ${ucapanList || "(Kartu kosong saja)"}`,
  ];

  if (moneyItem?.moneyBouquetDetails) {
    const mb = moneyItem.moneyBouquetDetails;
    lines.push("______________________________");
    lines.push("_(Order Money Bouquet)_");
    lines.push(`• Pecahan uang : ${formatRupiah(mb.denomination)}`);
    lines.push(`• Berapa lembar uang : ${mb.sheet_count} lembar`);
    lines.push(
      `• Pembayaran uang : ${MONEY_BOUQUET_CASH_PAYMENT_MODES[mb.cash_payment_mode].label}`
    );
  }

  if (params.fulfillmentMethod === "instant_courier") {
    lines.push("_____________________________");
    lines.push("Metode pengambilan VIA KURIR INSTAN");
    lines.push(`• Nama penerima : ${params.recipientName || "-"}`);
    lines.push(`• No. Telp penerima : ${params.recipientPhone || "-"}`);
    lines.push(
      `• Alamat lengkap penerima : ${[
        params.deliveryAddress,
        params.deliveryDistrict ? `Kec. ${params.deliveryDistrict}, Pekanbaru` : null,
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  }

  lines.push("_________________________________");
  lines.push(`Total Checkout : *${formatRupiah(params.totalAmount)}*`);
  if (params.paymentMethodLabel) {
    lines.push(`Metode Bayar : ${params.paymentMethodLabel}`);
  }
  if (params.hasSeparateMoneyBouquetCash) {
    lines.push(
      "Catatan : Uang isi Money Bouquet akan diantar / ditransfer terpisah via WA."
    );
  }
  lines.push(
    `Alamat toko : ${STORE_INFO.shortAddress} (Maps: ${STORE_INFO.googleMapsLabel})`
  );

  return buildWhatsAppUrl(lines.join("\n"));
}
