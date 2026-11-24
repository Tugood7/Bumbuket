import type { MoneyBouquetCashPaymentMode } from "../types/domain";

export interface MoneyBouquetTier {
  id: string;
  label: string;
  minSheets: number;
  maxSheets: number;
  craftingFee: number; // Biaya jasa rangkai (belum termasuk isi uang)
}

/**
 * Pricelist resmi Money Bouquet Bumbuket.pku
 * Catatan: Harga yang tertera adalah biaya jasa rangkai & perlengkapan, BELUM termasuk nominal uang.
 */
export const MONEY_BOUQUET_TIERS: readonly MoneyBouquetTier[] = [
  { id: "tier-1-10", label: "1 - 10 lembar", minSheets: 1, maxSheets: 10, craftingFee: 100_000 },
  { id: "tier-11-20", label: "11 - 20 lembar", minSheets: 11, maxSheets: 20, craftingFee: 150_000 },
  { id: "tier-21-30", label: "21 - 30 lembar", minSheets: 21, maxSheets: 30, craftingFee: 200_000 },
  { id: "tier-31-40", label: "31 - 40 lembar", minSheets: 31, maxSheets: 40, craftingFee: 250_000 },
  { id: "tier-41-50", label: "41 - 50 lembar", minSheets: 41, maxSheets: 50, craftingFee: 325_000 },
  { id: "tier-51-60", label: "51 - 60 lembar", minSheets: 51, maxSheets: 60, craftingFee: 425_000 },
  { id: "tier-61-75", label: "61 - 75 lembar", minSheets: 61, maxSheets: 75, craftingFee: 675_000 },
  { id: "tier-76-100", label: "76 - 100 lembar", minSheets: 76, maxSheets: 100, craftingFee: 1_150_000 },
] as const;

export const MONEY_BOUQUET_MIN_SHEETS = 1;
export const MONEY_BOUQUET_MAX_SHEETS = 100;

export const MONEY_BOUQUET_DENOMINATIONS = [
  2_000,
  5_000,
  10_000,
  20_000,
  50_000,
  100_000,
] as const;

export type MoneyBouquetDenomination = (typeof MONEY_BOUQUET_DENOMINATIONS)[number];

/**
 * Pecahan yang mendukung opsi request uang baru (selama stok tersedia).
 */
export const MONEY_BOUQUET_NEW_NOTE_DENOMINATIONS: readonly number[] = [
  2_000,
  5_000,
  10_000,
  20_000,
];

export const MONEY_BOUQUET_INCLUDES = [
  "Dried Flowers (Bunga Kering) Baby Breath / Caspea",
  "Balon Foil (centang / tulis catatan jika ingin pakai)",
  "Free Greeting Card (Kartu Ucapan)",
  "Free Request Warna Wrapping",
  "Uang Pecahan Baru Rp 2.000 - Rp 20.000 (selama stok tersedia)",
] as const;

export const MONEY_BOUQUET_DISCLAIMER =
  "Harga pricelist adalah biaya jasa rangkai & perlengkapan, belum termasuk nominal uang isi buket.";

export const MONEY_BOUQUET_CASH_PAYMENT_MODES: Record<
  MoneyBouquetCashPaymentMode,
  {
    value: MoneyBouquetCashPaymentMode;
    label: string;
    description: string;
  }
> = {
  included_in_checkout: {
    value: "included_in_checkout",
    label: "Bayar Jasa + Isi Uang Sekaligus",
    description:
      "Total checkout sudah mencakup biaya jasa rangkai dan nominal uang isi buket.",
  },
  separate_via_whatsapp: {
    value: "separate_via_whatsapp",
    label: "Bayar Jasa Dulu (Uang Diantar / Transfer via WA)",
    description:
      "Di checkout Anda cukup membayar biaya jasa rangkai. Uang isi buket dapat diantar ke toko atau ditransfer terpisah via WhatsApp.",
  },
};

export function findMoneyBouquetTier(sheetCount: number): MoneyBouquetTier | null {
  if (!Number.isInteger(sheetCount)) return null;
  return (
    MONEY_BOUQUET_TIERS.find(
      (tier) => sheetCount >= tier.minSheets && sheetCount <= tier.maxSheets
    ) ?? null
  );
}

export interface MoneyBouquetPriceBreakdown {
  tier: MoneyBouquetTier;
  sheetCount: number;
  denomination: number;
  craftingFee: number;
  cashAmount: number;
  /** Nominal yang dibayarkan saat checkout (hanya jasa rangkai atau jasa + isi uang) */
  checkoutPayableAmount: number;
  /** Nilai total keseluruhan buket (jasa rangkai + isi uang) */
  totalBouquetValue: number;
  canRequestNewNotes: boolean;
}

export function calculateMoneyBouquetPrice(params: {
  sheetCount: number;
  denomination: number;
  cashPaymentMode: MoneyBouquetCashPaymentMode;
}): MoneyBouquetPriceBreakdown {
  const tier = findMoneyBouquetTier(params.sheetCount);
  if (!tier) {
    throw new RangeError(
      `Jumlah lembar Money Bouquet harus antara ${MONEY_BOUQUET_MIN_SHEETS} sampai ${MONEY_BOUQUET_MAX_SHEETS} lembar.`
    );
  }

  const cashAmount = params.sheetCount * params.denomination;
  const craftingFee = tier.craftingFee;
  const totalBouquetValue = craftingFee + cashAmount;
  const checkoutPayableAmount =
    params.cashPaymentMode === "included_in_checkout"
      ? totalBouquetValue
      : craftingFee;

  return {
    tier,
    sheetCount: params.sheetCount,
    denomination: params.denomination,
    craftingFee,
    cashAmount,
    checkoutPayableAmount,
    totalBouquetValue,
    canRequestNewNotes: MONEY_BOUQUET_NEW_NOTE_DENOMINATIONS.includes(
      params.denomination
    ),
  };
}

