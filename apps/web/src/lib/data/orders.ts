import type { OrderWithItems } from "@bumbuket/shared";
import { createSupabaseAdminClient } from "../supabase/admin";

export async function getOrderByNumber(
  orderNumber: string
): Promise<OrderWithItems | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select(
      `
      *,
      items:order_items(*)
    `
    )
    .eq("order_number", orderNumber)
    .single();

  if (error || !data) {
    return null;
  }

  return data as OrderWithItems;
}
