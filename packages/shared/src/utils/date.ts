import {
  getDayOfWeekFromIsoDate,
  isStoreOpenOnDate,
} from "../constants/store-hours";

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Format tanggal YYYY-MM-DD ke format lokal Indonesia (contoh: "Senin, 23 November 2026").
 */
export function formatIndonesianDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  const dayOfWeek = getDayOfWeekFromIsoDate(isoDate);
  if (!match || dayOfWeek === null) return isoDate;

  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);

  const dayName = INDONESIAN_DAYS[dayOfWeek] ?? "";
  const monthName = INDONESIAN_MONTHS[monthIdx] ?? "";
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatScheduleLabel(isoDate: string, timeSlot: string): string {
  return `${formatIndonesianDate(isoDate)} • ${timeSlot} WIB`;
}

/**
 * Mengembalikan tanggal hari ini dalam zona waktu WIB (UTC+7) sebagai YYYY-MM-DD.
 */
export function getTodayIsoDateWib(referenceDate: Date = new Date()): string {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wib = new Date(referenceDate.getTime() + wibOffsetMs);
  const year = wib.getUTCFullYear();
  const month = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wib.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Menghitung tanggal pemesanan paling awal yang tersedia berdasarkan lead_time_days
 * dan otomatis melewati hari Minggu (toko tutup).
 */
export function getNextAvailableOrderDateWib(
  leadTimeDays: number = 0,
  referenceDate: Date = new Date()
): string {
  const safeLead = Math.max(0, Math.floor(leadTimeDays));
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const cursor = new Date(referenceDate.getTime() + wibOffsetMs);
  cursor.setUTCDate(cursor.getUTCDate() + safeLead);

  for (let i = 0; i < 7; i += 1) {
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cursor.getUTCDate()).padStart(2, "0");
    const candidate = `${year}-${month}-${day}`;
    if (isStoreOpenOnDate(candidate)) {
      return candidate;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return getTodayIsoDateWib(referenceDate);
}

