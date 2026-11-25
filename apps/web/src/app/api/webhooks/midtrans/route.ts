import { NextResponse } from "next/server";
import { mapMidtransStatus, verifyMidtransSignature } from "@/lib/midtrans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MidtransNotificationPayload;

    const isValid = verifyMidtransSignature({
      orderId: body.order_id,
      statusCode: body.status_code,
      grossAmount: body.gross_amount,
      signatureKey: body.signature_key,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Signature Midtrans tidak valid." },
        { status: 403 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, payment_plan, payment_status, order_status, items:order_items(product_id, quantity)"
      )
      .eq("order_number", body.order_id)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const mapped = mapMidtransStatus(
      body.transaction_status,
      body.fraud_status
    );

    const wasAlreadySettledOrDp =
      existingOrder.payment_status === "paid" ||
      existingOrder.payment_status === "dp_paid";

    const nextPaymentStatus =
      mapped.isPaidNow && existingOrder.payment_plan === "dp"
        ? "dp_paid"
        : mapped.paymentStatus;

    const updatePayload: Record<string, unknown> = {
      payment_status: nextPaymentStatus,
      payment_method: body.payment_type ?? null,
      midtrans_transaction_id: body.transaction_id ?? null,
    };

    if (mapped.isPaidNow && !wasAlreadySettledOrDp) {
      updatePayload.paid_at = new Date().toISOString();
    }

    if (nextPaymentStatus === "paid") {
      updatePayload.remaining_amount = 0;
    }

    if (mapped.orderStatus) {
      // Jangan timpa status florist bila pesanan sudah masuk tahap dirangkai/siap/selesai
      const advancedStatuses = ["arranging", "ready", "completed"];
      if (!advancedStatuses.includes(existingOrder.order_status)) {
        updatePayload.order_status = mapped.orderStatus;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", existingOrder.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Gagal memperbarui status pesanan." },
        { status: 500 }
      );
    }

    // Kurangi stok produk ready_stock secara idempoten saat pertama kali berstatus paid / dp_paid
    if (mapped.isPaidNow && !wasAlreadySettledOrDp && Array.isArray(existingOrder.items)) {
      for (const item of existingOrder.items as Array<{
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
          const nextStock = Math.max(0, prod.stock_quantity - item.quantity);
          await supabaseAdmin
            .from("products")
            .update({ stock_quantity: nextStock })
            .eq("id", prod.id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
