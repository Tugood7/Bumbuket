/**
 * Format angka nominal Rupiah Indonesia (contoh: 185000 -> "Rp 185.000").
 */
export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = new Intl.NumberFormat("id-ID").format(Math.abs(safeAmount));
  return safeAmount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format ringkas untuk badge atau tabel pricelist (contoh: 150000 -> "150k", 1150000 -> "1.150k").
 */
export function formatCompactRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (safeAmount >= 1_000 && safeAmount % 1_000 === 0) {
    return `${new Intl.NumberFormat("id-ID").format(safeAmount / 1_000)}k`;
  }
  return formatRupiah(safeAmount);
}

