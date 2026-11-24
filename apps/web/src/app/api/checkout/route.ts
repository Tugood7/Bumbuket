import { NextResponse } from "next/server";
import {
  buildOrderConfirmWaLink,
  calculateMoneyBouquetPrice,
  checkoutSchema,
  normalizeIndonesianPhone,
  STORE_INFO,
  type MoneyBouquetDetails,
  type ProductWithRelations,
} from "@bumbuket/shared";
import { FALLBACK_PRODUCTS } from "@/lib/data/fallback-catalog";
import {
  createMidtransSnapTransaction,
  isMidtransConfigured,
} from "@/lib/midtrans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ResolvedOrderItem {
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  wrappingColor: string | null;
  greetingCardText: string | null;
  customNotes: string | null;
  moneyBouquetDetails: MoneyBouquetDetails | null;
}

function generateLocalOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `BBK-${y}${m}${d}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = checkoutSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Data checkout belum lengkap atau tidak valid.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabaseAdmin = createSupabaseAdminClient();
    const supabaseUserClient = await createSupabaseServerClient();
    const authUser = supabaseUserClient
      ? (await supabaseUserClient.auth.getUser()).data.user
      : null;

    // 1. Ambil produk dari database (atau fallback saat mode preview lokal tanpa env)
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const productsMap = new Map<string, ProductWithRelations>();

    if (supabaseAdmin) {
      const { data: dbProducts, error } = await supabaseAdmin
        .from("products")
        .select("*, variants:product_variants(*)")
        .in("id", productIds)
        .eq("is_active", true);

      if (error) {
        return NextResponse.json(
          { error: "Gagal memverifikasi produk di database." },
          { status: 500 }
        );
      }

      for (const p of (dbProducts ?? []) as ProductWithRelations[]) {
        productsMap.set(p.id, p);
      }
    } else {
      for (const p of FALLBACK_PRODUCTS) {
        if (productIds.includes(p.id)) {
          productsMap.set(p.id, p);
        }
      }
    }

    // 2. Hitung ulang harga di sisi server agar anti-manipulasi
    const resolvedItems: ResolvedOrderItem[] = [];
    for (const reqItem of input.items) {
      const product = productsMap.get(reqItem.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produk tidak ditemukan atau sudah tidak aktif.` },
          { status: 404 }
        );
      }

      let unitPrice = product.base_price;
      let variantName: string | null = null;
      let variantId: string | null = null;
      let normalizedMoneyDetails: MoneyBouquetDetails | null = null;

      if (product.is_money_bouquet && reqItem.moneyBouquetDetails) {
        const mb = reqItem.moneyBouquetDetails;
        const calc = calculateMoneyBouquetPrice({
          sheetCount: mb.sheet_count,
          denomination: mb.denomination,
          cashPaymentMode: mb.cash_payment_mode,
        });

        unitPrice = calc.checkoutPayableAmount;
        variantName = `${mb.sheet_count} Lembar × Rp ${mb.denomination.toLocaleString("id-ID")}`;
        normalizedMoneyDetails = {
          sheet_count: mb.sheet_count,
          denomination: mb.denomination,
          crafting_fee: calc.craftingFee,
          cash_amount: calc.cashAmount,
          cash_payment_mode: mb.cash_payment_mode,
          include_foil_balloon: mb.include_foil_balloon,
          request_new_notes: calc.canRequestNewNotes && mb.request_new_notes,
        };
      } else if (reqItem.variantId) {
        const variant = (product.variants ?? []).find(
          (v) => v.id === reqItem.variantId && v.is_active
        );
        if (!variant) {
          return NextResponse.json(
            { error: `Varian untuk ${product.name} tidak tersedia.` },
            { status: 400 }
          );
        }
        variantId = variant.id;
        variantName = variant.name;
        unitPrice = Math.max(0, product.base_price + variant.price_adjustment);
      }

      resolvedItems.push({
        productId: supabaseAdmin ? product.id : null,
        variantId: supabaseAdmin ? variantId : null,
        productName: product.name,
        variantName,
        productImageUrl: product.images[0] ?? null,
        unitPrice,
        quantity: reqItem.quantity,
        subtotal: unitPrice * reqItem.quantity,
        wrappingColor: reqItem.wrappingColor ?? null,
        greetingCardText: reqItem.greetingCardText?.trim() || null,
        customNotes: reqItem.customNotes?.trim() || null,
        moneyBouquetDetails: normalizedMoneyDetails,
      });
    }

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.subtotal, 0);
    // Ongkir Gojek / Maxim / Grab dibayar terpisah sesuai tarif aplikasi
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;
    const paymentExpiresAt = new Date(
      Date.now() + STORE_INFO.paymentDeadlineMinutes * 60 * 1000
    ).toISOString();

    const normalizedCustomerPhone = normalizeIndonesianPhone(input.customerPhone);
    const normalizedRecipientPhone = input.recipientPhone
      ? normalizeIndonesianPhone(input.recipientPhone)
      : null;

    const hasSeparateMoneyBouquetCash = resolvedItems.some(
      (item) =>
        item.moneyBouquetDetails?.cash_payment_mode === "separate_via_whatsapp"
    );

    const paymentMethodLabel =
      input.checkoutChannel === "midtrans"
        ? "Midtrans (QRIS / VA / E-Wallet)"
        : input.checkoutChannel === "bank_transfer"
          ? `Transfer Bank ${STORE_INFO.bankAccount.bankName} ${STORE_INFO.bankAccount.accountNumber} a.n. ${STORE_INFO.bankAccount.accountHolder}`
          : "Order & Konfirmasi via WhatsApp";

    let orderNumber = generateLocalOrderNumber();
    let orderId: string | null = null;
    let snapToken: string | null = null;
    let snapRedirectUrl: string | null = null;
    const demoMode = !supabaseAdmin;

    // 3. Simpan pesanan ke Supabase bila sudah terhubung
    if (supabaseAdmin) {
      const { data: insertedOrder, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: authUser?.id ?? null,
          customer_name: input.customerName,
          customer_phone: normalizedCustomerPhone,
          customer_email: input.customerEmail || null,
          fulfillment_method: input.fulfillmentMethod,
          courier_provider:
            input.fulfillmentMethod === "instant_courier"
              ? input.courierProvider ?? null
              : null,
          shipping_paid_separately: input.fulfillmentMethod === "instant_courier",
          scheduled_date: input.scheduledDate,
          scheduled_time_slot: input.scheduledTimeSlot,
          recipient_name:
            input.fulfillmentMethod === "instant_courier"
              ? input.recipientName ?? null
              : null,
          recipient_phone:
            input.fulfillmentMethod === "instant_courier"
              ? normalizedRecipientPhone
              : null,
          delivery_district:
            input.fulfillmentMethod === "instant_courier"
              ? input.deliveryDistrict ?? null
              : null,
          delivery_address:
            input.fulfillmentMethod === "instant_courier"
              ? input.deliveryAddress ?? null
              : null,
          delivery_notes: input.deliveryNotes ?? null,
          subtotal,
          shipping_fee: shippingFee,
          discount_amount: 0,
          total_amount: totalAmount,
          checkout_channel: input.checkoutChannel,
          payment_status: "pending",
          payment_method:
            input.checkoutChannel === "bank_transfer"
              ? "bri_manual"
              : input.checkoutChannel === "whatsapp"
                ? "whatsapp_manual"
                : null,
          payment_expires_at: paymentExpiresAt,
          order_status: "pending_payment",
        })
        .select("id, order_number")
        .single();

      if (orderError || !insertedOrder) {
        return NextResponse.json(
          { error: `Gagal menyimpan pesanan: ${orderError?.message ?? "Unknown"}` },
          { status: 500 }
        );
      }

      orderId = insertedOrder.id;
      orderNumber = insertedOrder.order_number;

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(
          resolvedItems.map((item) => ({
            order_id: insertedOrder.id,
            product_id: item.productId,
            variant_id: item.variantId,
            product_name: item.productName,
            variant_name: item.variantName,
            product_image_url: item.productImageUrl,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            wrapping_color: item.wrappingColor,
            greeting_card_text: item.greetingCardText,
            custom_notes: item.customNotes,
            money_bouquet_details: item.moneyBouquetDetails,
          }))
        );

      if (itemsError) {
        return NextResponse.json(
          { error: `Gagal menyimpan rincian item: ${itemsError.message}` },
          { status: 500 }
        );
      }
    }

    // 4. Generate Midtrans Snap Token jika metode = midtrans & kunci terkonfigurasi
    if (input.checkoutChannel === "midtrans" && isMidtransConfigured()) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const snap = await createMidtransSnapTransaction({
        orderNumber,
        grossAmount: totalAmount,
        customerName: input.customerName,
        customerPhone: normalizedCustomerPhone,
        customerEmail: input.customerEmail || null,
        items: resolvedItems.map((item, idx) => ({
          id: item.productId ?? `item-${idx + 1}`,
          name: item.variantName
            ? `${item.productName} - ${item.variantName}`
            : item.productName,
          price: item.unitPrice,
          quantity: item.quantity,
        })),
        finishRedirectUrl: `${appUrl}/orders/${orderNumber}`,
      });

      snapToken = snap.token;
      snapRedirectUrl = snap.redirect_url;

      if (supabaseAdmin && orderId) {
        await supabaseAdmin
          .from("orders")
          .update({
            midtrans_order_id: orderNumber,
            midtrans_snap_token: snap.token,
          })
          .eq("id", orderId);
      }
    }

    // 5. Generate link WhatsApp resmi FORMAT ORDER BUMBUKET💐
    const whatsappUrl = buildOrderConfirmWaLink({
      orderNumber,
      customerName: input.customerName,
      totalAmount,
      scheduledDate: input.scheduledDate,
      scheduledTimeSlot: input.scheduledTimeSlot,
      fulfillmentMethod: input.fulfillmentMethod,
      courierProvider: input.courierProvider ?? null,
      recipientName: input.recipientName ?? null,
      recipientPhone: input.recipientPhone ?? null,
      deliveryAddress: input.deliveryAddress ?? null,
      deliveryDistrict: input.deliveryDistrict ?? null,
      paymentMethodLabel,
      hasSeparateMoneyBouquetCash,
      itemsSummary: resolvedItems.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        wrappingColor: item.wrappingColor,
        greetingCardText: item.greetingCardText,
        moneyBouquetDetails: item.moneyBouquetDetails,
      })),
    });

    return NextResponse.json({
      orderNumber,
      checkoutChannel: input.checkoutChannel,
      totalAmount,
      paymentExpiresAt,
      snapToken,
      snapRedirectUrl,
      whatsappUrl,
      demoMode,
      orderSnapshot: {
        order_number: orderNumber,
        customer_name: input.customerName,
        customer_phone: normalizedCustomerPhone,
        fulfillment_method: input.fulfillmentMethod,
        courier_provider:
          input.fulfillmentMethod === "instant_courier"
            ? input.courierProvider ?? null
            : null,
        shipping_paid_separately: input.fulfillmentMethod === "instant_courier",
        scheduled_date: input.scheduledDate,
        scheduled_time_slot: input.scheduledTimeSlot,
        recipient_name: input.recipientName ?? null,
        recipient_phone: input.recipientPhone ?? null,
        delivery_district: input.deliveryDistrict ?? null,
        delivery_address: input.deliveryAddress ?? null,
        delivery_notes: input.deliveryNotes ?? null,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: 0,
        total_amount: totalAmount,
        checkout_channel: input.checkoutChannel,
        payment_status: "pending",
        payment_method: paymentMethodLabel,
        payment_expires_at: paymentExpiresAt,
        midtrans_snap_token: snapToken,
        order_status: "pending_payment",
        items: resolvedItems.map((item, idx) => ({
          id: `local-item-${idx + 1}`,
          product_name: item.productName,
          variant_name: item.variantName,
          product_image_url: item.productImageUrl,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          wrapping_color: item.wrappingColor,
          greeting_card_text: item.greetingCardText,
          custom_notes: item.customNotes,
          money_bouquet_details: item.moneyBouquetDetails,
        })),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan saat checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
