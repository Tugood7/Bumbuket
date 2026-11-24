export interface StoreDayHours {
  dayIndex: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  dayName: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  timeSlots: readonly string[];
}

/**
 * Jam pengambilan / pengiriman reguler: 09:00 - 20:00 WIB (Senin - Jumat),
 * serta Sabtu mengikuti jam buka toko mulai 12:00 hingga 20:00 WIB.
 */
export const WEEKDAY_TIME_SLOTS = [
  "09:00-11:00",
  "11:00-13:00",
  "13:00-15:00",
  "15:00-17:00",
  "17:00-20:00",
] as const;

export const SATURDAY_TIME_SLOTS = [
  "12:00-14:00",
  "14:00-16:00",
  "16:00-18:00",
  "18:00-20:00",
] as const;

export const ALL_TIME_SLOTS = [
  ...WEEKDAY_TIME_SLOTS,
  ...SATURDAY_TIME_SLOTS,
] as const;

export const STORE_OPERATING_HOURS: readonly StoreDayHours[] = [
  {
    dayIndex: 0,
    dayName: "Minggu",
    isOpen: false,
    openTime: null,
    closeTime: null,
    timeSlots: [],
  },
  {
    dayIndex: 1,
    dayName: "Senin",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    timeSlots: WEEKDAY_TIME_SLOTS,
  },
  {
    dayIndex: 2,
    dayName: "Selasa",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    timeSlots: WEEKDAY_TIME_SLOTS,
  },
  {
    dayIndex: 3,
    dayName: "Rabu",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    timeSlots: WEEKDAY_TIME_SLOTS,
  },
  {
    dayIndex: 4,
    dayName: "Kamis",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    timeSlots: WEEKDAY_TIME_SLOTS,
  },
  {
    dayIndex: 5,
    dayName: "Jumat",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    timeSlots: WEEKDAY_TIME_SLOTS,
  },
  {
    dayIndex: 6,
    dayName: "Sabtu",
    isOpen: true,
    openTime: "12:00",
    closeTime: "18:00",
    timeSlots: SATURDAY_TIME_SLOTS,
  },
] as const;

export const STORE_HOURS_SUMMARY = [
  { days: "Senin - Jumat (Toko)", hours: "08:00 - 18:00 WIB" },
  { days: "Sabtu (Toko)", hours: "12:00 - 18:00 WIB" },
  { days: "Slot Pengambilan / Kirim", hours: "09:00 - 20:00 WIB (Sabtu mulai 12:00)" },
  { days: "Minggu", hours: "Tutup (Hubungi WA untuk kebutuhan khusus)" },
] as const;

export function getDayOfWeekFromIsoDate(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return utcDate.getUTCDay();
}

export function getStoreHoursForDate(isoDate: string): StoreDayHours | null {
  const dayIndex = getDayOfWeekFromIsoDate(isoDate);
  if (dayIndex === null) return null;
  return STORE_OPERATING_HOURS[dayIndex] ?? null;
}

export function isStoreOpenOnDate(isoDate: string): boolean {
  const hours = getStoreHoursForDate(isoDate);
  return Boolean(hours?.isOpen);
}

export function getTimeSlotsForDate(isoDate: string): readonly string[] {
  const hours = getStoreHoursForDate(isoDate);
  return hours?.isOpen ? hours.timeSlots : [];
}

export function isValidTimeSlotForDate(isoDate: string, timeSlot: string): boolean {
  const slots = getTimeSlotsForDate(isoDate);
  return slots.includes(timeSlot);
}
