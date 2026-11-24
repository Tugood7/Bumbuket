import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { productFormSchema } from "@bumbuket/shared";
import { getAdminAuth } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function revalidateCatalogPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/products", "layout");
  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

export async function POST(request: Request) {
  const auth = await getAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = productFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data produk belum lengkap atau tidak valid.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({
      demoMode: true,
      product: { id: `demo-${Date.now()}`, ...parsed.data },
    });
  }

  const { variants, ...productPayload } = parsed.data;

  const { data: created, error } = await supabaseAdmin
    .from("products")
    .insert(productPayload)
    .select("*")
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: `Gagal menyimpan produk: ${error?.message ?? "Unknown"}` },
      { status: 500 }
    );
  }

  if (variants && variants.length > 0) {
    const { error: varErr } = await supabaseAdmin
      .from("product_variants")
      .insert(
        variants.map((v, idx) => ({
          product_id: created.id,
          name: v.name,
          sku: v.sku || null,
          price_adjustment: v.price_adjustment,
          stock_quantity: v.stock_quantity,
          image_url: v.image_url || null,
          display_order: v.display_order ?? idx,
          is_active: v.is_active ?? true,
        }))
      );

    if (varErr) {
      return NextResponse.json(
        { error: `Produk tersimpan, tetapi gagal menyimpan varian: ${varErr.message}` },
        { status: 500 }
      );
    }
  }

  revalidateCatalogPaths(created.slug);

  return NextResponse.json({ product: created }, { status: 201 });
}
