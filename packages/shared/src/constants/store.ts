export const STORE_INFO = {
  name: "Bumbuket.pku",
  tagline: "Artificial Flower & Premium Bouquet Pekanbaru",
  address:
    "Jl. Pahlawan Kerja, Perhentian Marpoyan, Kec. Marpoyan Damai, Kota Pekanbaru, Riau 28288",
  shortAddress: "Jl. Pahlawan Kerja, Marpoyan Damai, Pekanbaru",
  googleMapsLabel: "Bumbuket.pku",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Bumbuket.pku+Jl+Pahlawan+Kerja+Pekanbaru",
  city: "Kota Pekanbaru",
  province: "Riau",
  postalCode: "28288",
  whatsappNumber: "6282288890279",
  whatsappDisplay: "0822-8889-0279",
  instagramHandle: "@bumbuket.pku",
  instagramUrl: "https://instagram.com/bumbuket.pku",
  timezone: "Asia/Jakarta",
  timezoneLabel: "WIB",
  paymentDeadlineMinutes: 10,
  minDpPercent: 50,
  minDpAmount: 50_000,
  bankAccount: {
    bankName: "BRI",
    accountNumber: "540701018229534",
    accountHolder: "Sonia Wulandari",
    note: "Pembayaran transfer bank hanya melalui 1 rekening resmi ini (BRI 540701018229534 a.n. Sonia Wulandari). Payment ditunggu 10 menit supaya orderan bisa diproses.",
  },
} as const;

export const STORE_BRAND_COLORS = {
  primaryPink: "#F472B6",
  blushPink: "#FCE7F3",
  accentDeepRose: "#9D174D",
  backgroundWhite: "#FFFFFF",
  warmOffWhite: "#FFF9FB",
} as const;

/**
 * Hitung minimal DP untuk sebuah total pesanan:
 * minimal 50% dari total pesanan atau Rp 50.000 (mana yang lebih besar).
 */
export function calculateMinDpAmount(totalAmount: number): number {
  if (totalAmount <= STORE_INFO.minDpAmount) {
    return totalAmount;
  }
  return Math.min(
    totalAmount,
    Math.max(STORE_INFO.minDpAmount, Math.ceil(totalAmount * (STORE_INFO.minDpPercent / 100)))
  );
}
