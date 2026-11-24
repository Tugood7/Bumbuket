import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/data/orders";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await context.params;
  const order = await getOrderByNumber(orderNumber);

  if (!order) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
