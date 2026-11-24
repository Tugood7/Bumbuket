import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const adminOrderPatchSchema = z.object({
  orderStatus: z
    .enum([
      "pending_payment",
      "processing",
      "arranging",
      "ready",
      "completed",
      "cancelled",
    ])
    .optional(),
  paymentStatus: z
    .enum(["unpaid", "pending", "paid", "failed", "expired", "refunded"])
    .optional(),
  adminNotes: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = adminOrderPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data pembaruan pesanan tidak valid." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({
      demoMode: true,
      updated: parsed.data,
    });
  }

  const { data: existing, error: findErr } = await supabaseAdmin
    .from("orders")
    .select(
      "id, payment_status, order_status, items:order_items(product_id, quantity)"
    )
    .eq("id", id)
    .single();

  if (findErr || !existing) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.orderStatus !== undefined) {
    updates.order_status = parsed.data.orderStatus;
  }
  if (parsed.data.paymentStatus !== undefined) {
    updates.payment_status = parsed.data.paymentStatus;
    if (
      parsed.data.paymentStatus === "paid" &&
      existing.payment_status !== "paid"
    ) {
      updates.paid_at = new Date().toISOString();
      if (
        !parsed.data.orderStatus &&
        existing.order_status === "pending_payment"
      ) {
        updates.order_status = "processing";
      }
    }
  }
  if (parsed.data.adminNotes !== undefined) {
    updates.admin_notes = parsed.data.adminNotes;
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateErr) {
    return NextResponse.json(
      { error: `Gagal memperbarui pesanan: ${updateErr.message}` },
      { status: 500 }
    );
  }

  // Kurangi stok ready_stock jika admin baru saja mengonfirmasi pembayaran BRI manual -> paid
  if (
    parsed.data.paymentStatus === "paid" &&
    existing.payment_status !== "paid" &&
    Array.isArray(existing.items)
  ) {
    for (const item of existing.items as Array<{
      product_id: string | null;
      quantity: number;
    }>) {
      if (!item.product_id) continue;
      const { data: prod } = await supabaseAdmin
        .from("products")
        .select("id, stock_quantity, availability_type")
        .eq("id", item.product_id)
        .single();

      if (prod && prod.availability_type === "ready_stock") {
        await supabaseAdmin
          .from("products")
          .update({ stock_quantity: Math.max(0, prod.stock_quantity - item.quantity) })
          .eq("id", prod.id);
      }
    }
  }

  return NextResponse.json({ order: updated });
}
