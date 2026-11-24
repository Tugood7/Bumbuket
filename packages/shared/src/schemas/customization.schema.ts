import { z } from "zod";
import {
  MONEY_BOUQUET_DENOMINATIONS,
  MONEY_BOUQUET_MAX_SHEETS,
  MONEY_BOUQUET_MIN_SHEETS,
} from "../constants/money-bouquet";
import {
  isStoreOpenOnDate,
  isValidTimeSlotForDate,
} from "../constants/store-hours";

export const moneyBouquetDetailsSchema = z.object({
  sheet_count: z
    .number()
    .int("Jumlah lembar harus bilangan bulat")
    .min(
      MONEY_BOUQUET_MIN_SHEETS,
      `Minimal ${MONEY_BOUQUET_MIN_SHEETS} lembar`
    )
    .max(
      MONEY_BOUQUET_MAX_SHEETS,
      `Maksimal ${MONEY_BOUQUET_MAX_SHEETS} lembar per buket`
    ),
  denomination: z
    .number()
    .int()
    .refine(
      (val) =>
        (MONEY_BOUQUET_DENOMINATIONS as readonly number[]).includes(val),
      "Pecahan uang tidak valid"
    ),
  crafting_fee: z.number().int().nonnegative(),
  cash_amount: z.number().int().nonnegative(),
  cash_payment_mode: z.enum([
    "included_in_checkout",
    "separate_via_whatsapp",
  ]),
  include_foil_balloon: z.boolean().default(false),
  request_new_notes: z.boolean().default(false),
});

export const scheduleSchema = z
  .object({
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    scheduledTimeSlot: z.string().min(1, "Pilih jam pengiriman / pengambilan"),
  })
  .superRefine((data, ctx) => {
    if (!isStoreOpenOnDate(data.scheduledDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledDate"],
        message:
          "Toko tutup di hari Minggu. Silakan pilih Senin-Sabtu atau hubungi WhatsApp untuk kebutuhan khusus.",
      });
      return;
    }

    if (!isValidTimeSlotForDate(data.scheduledDate, data.scheduledTimeSlot)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledTimeSlot"],
        message:
          "Jam tidak tersedia pada hari tersebut (Senin-Jumat 08:00-18:00, Sabtu 12:00-18:00 WIB).",
      });
    }
  });

export const productCustomizationSchema = z.object({
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1, "Minimal 1 buket").max(50, "Maksimal 50 buket"),
  wrappingColor: z
    .string()
    .trim()
    .min(1, "Pilih warna kertas wrapping")
    .max(60)
    .nullable()
    .optional(),
  greetingCardText: z
    .string()
    .trim()
    .max(300, "Teks kartu ucapan maksimal 300 karakter")
    .nullable()
    .optional(),
  customNotes: z
    .string()
    .trim()
    .max(300, "Catatan tambahan maksimal 300 karakter")
    .nullable()
    .optional(),
  moneyBouquetDetails: moneyBouquetDetailsSchema.nullable().optional(),
});

export type ProductCustomizationInput = z.infer<
  typeof productCustomizationSchema
>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;

