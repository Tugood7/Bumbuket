import {
  getTodayIsoDateWib,
  type OrderStatus,
  type OrderWithItems,
  type ProductWithRelations,
} from "@bumbuket/shared";
import { createSupabaseAdminClient } from "../supabase/admin";
import { FALLBACK_PRODUCTS } from "./fallback-catalog";

function buildDemoOrders(): OrderWithItems[] {
  const today = getTodayIsoDateWib();
  const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrow = getTodayIsoDateWib(tomorrowDate);

  return [
    {
      id: "demo-order-1",
      order_number: "BBK-20261123-0101",
      user_id: null,
      customer_name: "Nadia Aulia",
      customer_phone: "6281275001122",
      customer_email: "nadia@example.com",
      fulfillment_method: "instant_courier",
      courier_provider: "gojek",
      shipping_paid_separately: true,
      scheduled_date: today,
      scheduled_time_slot: "11:00-13:00",
      recipient_name: "Putri Maharani",
      recipient_phone: "6281365009988",
      delivery_district: "Marpoyan Damai",
      delivery_address:
        "Jl. Kaharuddin Nasution No. 88 (Depan UIR, pagar putih)",
      delivery_notes: "Tolong kabari sebelum kurir berangkat ya kak",
      subtotal: 185000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 185000,
      checkout_channel: "midtrans",
      payment_status: "paid",
      payment_method: "qris",
      payment_expires_at: null,
      midtrans_order_id: "BBK-20261123-0101",
      midtrans_snap_token: null,
      midtrans_transaction_id: "tx-demo-01",
      paid_at: `${today}T02:15:00.000Z`,
      order_status: "arranging",
      admin_notes: "Pita satin pink pastel",
      created_at: `${today}T02:10:00.000Z`,
      updated_at: `${today}T02:20:00.000Z`,
      items: [
        {
          id: "demo-item-1",
          order_id: "demo-order-1",
          product_id: "prod-lily-blush",
          variant_id: "var-lily-m",
          product_name: "Blush Pink Lily Premium",
          variant_name: "Ukuran Medium (5 Tangkai Lily)",
          product_image_url: null,
          unit_price: 185000,
          quantity: 1,
          subtotal: 185000,
          wrapping_color: "Blush Pink",
          greeting_card_text:
            "Happy Graduation Putri! Semoga ilmunya berkah dan sukses selalu. — Nadia",
          custom_notes: "Request bunga lily paling mekar",
          money_bouquet_details: null,
          created_at: `${today}T02:10:00.000Z`,
        },
      ],
    },
    {
      id: "demo-order-2",
      order_number: "BBK-20261123-0102",
      user_id: null,
      customer_name: "Rizky Pratama",
      customer_phone: "6282288112233",
      customer_email: null,
      fulfillment_method: "pickup_store",
      courier_provider: null,
      shipping_paid_separately: false,
      scheduled_date: today,
      scheduled_time_slot: "15:00-17:00",
      recipient_name: null,
      recipient_phone: null,
      delivery_district: null,
      delivery_address: null,
      delivery_notes: null,
      subtotal: 200000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 200000,
      checkout_channel: "bank_transfer",
      payment_status: "pending",
      payment_method: "bri_manual",
      payment_expires_at: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      midtrans_order_id: null,
      midtrans_snap_token: null,
      midtrans_transaction_id: null,
      paid_at: null,
      order_status: "pending_payment",
      admin_notes: "Menunggu bukti TF BRI Sonia Wulandari",
      created_at: `${today}T03:00:00.000Z`,
      updated_at: `${today}T03:00:00.000Z`,
      items: [
        {
          id: "demo-item-2",
          order_id: "demo-order-2",
          product_id: "prod-money-bouquet",
          variant_id: null,
          product_name: "Premium Money Bouquet Custom",
          variant_name: "25 Lembar × Rp 50.000",
          product_image_url: null,
          unit_price: 200000,
          quantity: 1,
          subtotal: 200000,
          wrapping_color: "Midnight Black",
          greeting_card_text: "Happy Birthday Mama tersayang! Sehat selalu.",
          custom_notes: "Uang 1.250.000 diantar langsung ke toko jam 11",
          money_bouquet_details: {
            sheet_count: 25,
            denomination: 50000,
            crafting_fee: 200000,
            cash_amount: 1250000,
            cash_payment_mode: "separate_via_whatsapp",
            include_foil_balloon: true,
            request_new_notes: false,
          },
          created_at: `${today}T03:00:00.000Z`,
        },
      ],
    },
    {
      id: "demo-order-3",
      order_number: "BBK-20261123-0103",
      user_id: null,
      customer_name: "Dina Kartika",
      customer_phone: "6285271003344",
      customer_email: null,
      fulfillment_method: "instant_courier",
      courier_provider: "grab",
      shipping_paid_separately: true,
      scheduled_date: tomorrow,
      scheduled_time_slot: "09:00-11:00",
      recipient_name: "Ibu Rini (SMAN 8 Pekanbaru)",
      recipient_phone: "6281268004455",
      delivery_district: "Sail",
      delivery_address: "Jl. Abdul Muis No. 3, Ruang Guru SMAN 8 Pekanbaru",
      delivery_notes: "Titip di meja piket bila sedang mengajar",
      subtotal: 145000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 145000,
      checkout_channel: "midtrans",
      payment_status: "paid",
      payment_method: "bca_va",
      payment_expires_at: null,
      midtrans_order_id: "BBK-20261123-0103",
      midtrans_snap_token: null,
      midtrans_transaction_id: "tx-demo-03",
      paid_at: `${today}T04:00:00.000Z`,
      order_status: "processing",
      admin_notes: null,
      created_at: `${today}T03:55:00.000Z`,
      updated_at: `${today}T04:00:00.000Z`,
      items: [
        {
          id: "demo-item-3",
          order_id: "demo-order-3",
          product_id: "prod-spesial-wisuda",
          variant_id: "var-sp-standar",
          product_name: "Buket Spesial Wisuda & Hari Guru",
          variant_name: "Edisi Hari Guru (Bunga Artifisial)",
          product_image_url: null,
          unit_price: 145000,
          quantity: 1,
          subtotal: 145000,
          wrapping_color: "Champagne Cream",
          greeting_card_text:
            "Selamat Hari Guru Ibu Rini! Terima kasih atas segala ilmu dan kesabarannya.",
          custom_notes: null,
          money_bouquet_details: null,
          created_at: `${today}T03:55:00.000Z`,
        },
      ],
    },
  ];
}

export async function getAdminScheduledOrders(): Promise<OrderWithItems[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return buildDemoOrders().sort((a, b) =>
      `${a.scheduled_date} ${a.scheduled_time_slot}`.localeCompare(
        `${b.scheduled_date} ${b.scheduled_time_slot}`
      )
    );
  }

  const { data, error } = await admin
    .from("orders")
    .select("*, items:order_items(*)")
    .not("order_status", "in", "(completed,cancelled)")
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time_slot", { ascending: true });

  if (error || !data) return [];
  return data as OrderWithItems[];
}

export async function getAdminOrders(
  statusFilter?: OrderStatus | "all"
): Promise<OrderWithItems[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    const demo = buildDemoOrders();
    if (statusFilter && statusFilter !== "all") {
      return demo.filter((o) => o.order_status === statusFilter);
    }
    return demo;
  }

  let query = admin
    .from("orders")
    .select("*, items:order_items(*)")
    .order("scheduled_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("order_status", statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as OrderWithItems[];
}

export async function getAdminOrderById(
  id: string
): Promise<OrderWithItems | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return buildDemoOrders().find((o) => o.id === id) ?? null;
  }

  const { data, error } = await admin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as OrderWithItems;
}

export async function getAdminProducts(): Promise<ProductWithRelations[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return FALLBACK_PRODUCTS;

  const { data, error } = await admin
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)")
    .order("created_at", { ascending: false });

  if (error || !data) return FALLBACK_PRODUCTS;
  return data as ProductWithRelations[];
}

export async function getAdminProductById(
  id: string
): Promise<ProductWithRelations | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return FALLBACK_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  const { data, error } = await admin
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ProductWithRelations;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return [
      {
        id: "demo-admin",
        email: "admin@bumbuket.pku",
        full_name: "Admin Bumbuket (Mode Preview)",
        phone: null,
        created_at: new Date().toISOString(),
        last_sign_in_at: null,
      },
    ];
  }

  const [{ data: profiles, error: profileErr }, { data: usersPage, error: usersErr }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: true }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  if (profileErr || !profiles) {
    if (profileErr) {
      console.error("[admin] getAdminUsers profile error:", profileErr.message);
    }
    return [];
  }

  if (usersErr) {
    console.error("[admin] getAdminUsers listUsers error:", usersErr.message);
  }

  const authUsersMap = new Map(
    (usersPage?.users ?? []).map((u) => [u.id, u])
  );

  return profiles.map((p) => {
    const authUser = authUsersMap.get(p.id);
    return {
      id: p.id,
      email: authUser?.email ?? "-",
      full_name: p.full_name,
      phone: p.phone,
      created_at: p.created_at,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });
}

export async function getAdminDashboardSummary() {
  const today = getTodayIsoDateWib();
  const [orders, products] = await Promise.all([
    getAdminOrders("all"),
    getAdminProducts(),
  ]);

  const dueToday = orders.filter(
    (o) =>
      o.scheduled_date === today &&
      o.order_status !== "completed" &&
      o.order_status !== "cancelled"
  );

  const pendingBriVerification = orders.filter(
    (o) =>
      o.checkout_channel === "bank_transfer" &&
      o.payment_status !== "paid" &&
      o.order_status !== "cancelled"
  );

  const activeArranging = orders.filter(
    (o) => o.order_status === "processing" || o.order_status === "arranging"
  );

  const paidRevenue = orders.reduce((sum, o) => {
    if (o.payment_status === "paid") return sum + o.total_amount;
    if (o.payment_status === "dp_paid") return sum + (o.dp_amount ?? 0);
    return sum;
  }, 0);

  const lowStockReadyProducts = products.filter(
    (p) =>
      p.is_active &&
      p.availability_type === "ready_stock" &&
      p.stock_quantity <= 3
  );

  return {
    today,
    dueTodayCount: dueToday.length,
    pendingBriCount: pendingBriVerification.length,
    activeArrangingCount: activeArranging.length,
    paidRevenue,
    lowStockReadyProducts,
    upcomingOrders: dueToday.slice(0, 5),
  };
}
