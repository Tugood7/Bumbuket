import { z } from "zod";
import {
  isStoreOpenOnDate,
  isValidTimeSlotForDate,
} from "../constants/store-hours";
import { moneyBouquetDetailsSchema } from "./customization.schema";

const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "ID produk tidak valid"),
  variantId: z.string().min(1).nullable().optional(),
  quantity: z.number().int().min(1).max(50),
  wrappingColor: z.string().trim().max(60).nullable().optional(),
  greetingCardText: z.string().trim().max(300).nullable().optional(),
  customNotes: z.string().trim().max(300).nullable().optional(),
  moneyBouquetDetails: moneyBouquetDetailsSchema.nullable().optional(),
});

export const checkoutSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, "Nama customer minimal 2 karakter")
      .max(100),
    customerPhone: z
      .string()
      .trim()
      .regex(
        PHONE_REGEX,
        "Masukkan nomor WhatsApp Indonesia yang valid (contoh: 082288890279)"
      ),
    customerEmail: z
      .string()
      .trim()
      .email("Format email tidak valid")
      .optional()
      .or(z.literal("")),
    fulfillmentMethod: z.enum(["pickup_store", "instant_courier"]),
    courierProvider: z.enum(["gojek", "maxim", "grab"]).nullable().optional(),
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    scheduledTimeSlot: z.string().min(1, "Pilih jam pengambilan / pengiriman"),
    // Khusus pengiriman via GoSend / Maxim / Grab (sesuai FORMAT ORDER BUMBUKET)
    recipientName: z.string().trim().max(100).nullable().optional(),
    recipientPhone: z.string().trim().max(25).nullable().optional(),
    deliveryDistrict: z.string().trim().max(80).nullable().optional(),
    deliveryAddress: z.string().trim().max(400).nullable().optional(),
    deliveryNotes: z.string().trim().max(250).nullable().optional(),
    checkoutChannel: z
      .enum(["midtrans", "bank_transfer", "whatsapp"])
      .default("midtrans"),
    paymentPlan: z.enum(["full", "dp"]).default("full"),
    dpAmount: z.number().int().min(0).nullable().optional(),
    items: z
      .array(checkoutItemSchema)
      .min(1, "Keranjang belanja tidak boleh kosong"),
  })
  .superRefine((data, ctx) => {
    if (!isStoreOpenOnDate(data.scheduledDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledDate"],
        message:
          "Toko tutup di hari Minggu. Pilih hari Senin-Sabtu atau konsultasikan via WhatsApp.",
      });
    } else if (
      !isValidTimeSlotForDate(data.scheduledDate, data.scheduledTimeSlot)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledTimeSlot"],
        message:
          "Jam pengambilan tidak tersedia pada hari tersebut (Senin-Jumat 09:00-20:00, Sabtu 12:00-20:00 WIB).",
      });
    }

    if (data.fulfillmentMethod === "instant_courier") {
      if (!data.courierProvider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["courierProvider"],
          message: "Pilih kurir instan (Gojek / GoSend, Maxim, atau Grab).",
        });
      }
      if (!data.recipientName || data.recipientName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientName"],
          message: "Nama penerima wajib diisi untuk pengiriman kurir instan.",
        });
      }
      if (!data.recipientPhone || !PHONE_REGEX.test(data.recipientPhone.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientPhone"],
          message: "Nomor HP/WhatsApp penerima wajib diisi dengan format valid.",
        });
      }
      if (!data.deliveryDistrict || data.deliveryDistrict.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deliveryDistrict"],
          message: "Pilih kecamatan pengiriman di Pekanbaru.",
        });
      }
      if (!data.deliveryAddress || data.deliveryAddress.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deliveryAddress"],
          message: "Masukkan alamat lengkap penerima (minimal 10 karakter).",
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
