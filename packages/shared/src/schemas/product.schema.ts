import { z } from "zod";

export const wrappingColorSchema = z.object({
  name: z.string().trim().min(1, "Nama warna wajib diisi").max(40),
  hex: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Format warna harus HEX 6 digit (contoh: #FCE7F3)"),
});

export const productVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Nama varian wajib diisi").max(80),
  sku: z.string().trim().max(50).nullable().optional(),
  price_adjustment: z.number().int(),
  stock_quantity: z.number().int().min(0),
  image_url: z.string().url().nullable().optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const productFormSchema = z.object({
  category_id: z.string().uuid("Pilih kategori produk"),
  name: z.string().trim().min(3, "Nama buket minimal 3 karakter").max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung"),
  description: z.string().trim().max(2000).nullable().optional(),
  base_price: z.number().int().min(0, "Harga tidak boleh negatif"),
  availability_type: z.enum(["ready_stock", "pre_order"]),
  lead_time_days: z.number().int().min(0).max(30),
  stock_quantity: z.number().int().min(0),
  images: z.array(z.string().url("URL gambar tidak valid")).default([]),
  available_wrapping_colors: z.array(wrappingColorSchema).default([]),
  is_customizable: z.boolean().default(true),
  is_money_bouquet: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  variants: z.array(productVariantInputSchema).optional(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    "pending_payment",
    "processing",
    "arranging",
    "ready",
    "completed",
    "cancelled",
  ]),
  adminNotes: z.string().trim().max(500).nullable().optional(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

