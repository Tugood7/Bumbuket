import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = "payment-proofs";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await context.params;
  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "Supabase Storage belum dikonfigurasi. Tidak dapat mengunggah bukti transfer di mode preview.",
      },
      { status: 503 }
    );
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, checkout_channel, payment_status, order_status")
    .eq("order_number", orderNumber)
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan." },
      { status: 404 }
    );
  }

  if (order.checkout_channel !== "bank_transfer") {
    return NextResponse.json(
      { error: "Upload bukti transfer hanya berlaku untuk metode Transfer Bank BRI." },
      { status: 400 }
    );
  }

  if (order.order_status === "cancelled") {
    return NextResponse.json(
      { error: "Pesanan yang dibatalkan tidak dapat menerima bukti transfer." },
      { status: 400 }
    );
  }

  if (order.payment_status === "paid") {
    return NextResponse.json(
      { error: "Pembayaran pesanan ini sudah terkonfirmasi Lunas." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "File screenshot bukti transfer tidak ditemukan." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Format gambar harus JPG/JPEG, PNG, atau WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Ukuran screenshot maksimal 5 MB." },
      { status: 400 }
    );
  }

  // Pastikan bucket payment-proofs tersedia di Supabase Storage
  const { data: existingBucket } = await supabaseAdmin.storage.getBucket(BUCKET_NAME);
  if (!existingBucket) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const safeOrderNum = order.order_number.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = `orders/${safeOrderNum}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Gagal mengunggah bukti transfer: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  const uploadedAt = new Date().toISOString();

  const { error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({
      payment_proof_url: publicUrl,
      payment_proof_uploaded_at: uploadedAt,
    })
    .eq("id", order.id);

  if (updateErr) {
    return NextResponse.json(
      {
        error: `Screenshot terunggah, tetapi gagal menyimpan ke database: ${updateErr.message}`,
      },
      { status: 500 }
    );
  }

  revalidatePath(`/orders/${order.order_number}`);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/schedule");

  return NextResponse.json(
    { url: publicUrl, uploadedAt, orderNumber: order.order_number },
    { status: 201 }
  );
}

