import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
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

const quickPatchSchema = z.object({
  availability_type: z.enum(["ready_stock", "pre_order"]).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
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

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ demoMode: true, id, updated: body });
  }

  // Mode quick toggle (Ready Stock / PO / Aktif / Stok)
  if (body._mode === "quick") {
    const parsedQuick = quickPatchSchema.safeParse(body);
    if (!parsedQuick.success) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...parsedQuick.data };
    if (parsedQuick.data.availability_type === "ready_stock") {
      updateData.lead_time_days = 0;
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidateCatalogPaths(data?.slug);
    return NextResponse.json({ product: data });
  }

  // Mode full edit form
  const parsed = productFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data produk tidak valid.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { variants, ...productPayload } = parsed.data;
  const { data: updated, error } = await supabaseAdmin
    .from("products")
    .update(productPayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (variants) {
    const { error: deleteVarErr } = await supabaseAdmin
      .from("product_variants")
      .delete()
      .eq("product_id", id);

    if (deleteVarErr) {
      return NextResponse.json(
        {
          error: `Produk tersimpan, tetapi gagal memperbarui varian: ${deleteVarErr.message}`,
        },
        { status: 500 }
      );
    }

    if (variants.length > 0) {
      const { error: insertVarErr } = await supabaseAdmin
        .from("product_variants")
        .insert(
          variants.map((v, idx) => ({
            product_id: id,
            name: v.name,
            sku: v.sku || null,
            price_adjustment: v.price_adjustment,
            stock_quantity: v.stock_quantity,
            image_url: v.image_url || null,
            display_order: v.display_order ?? idx,
            is_active: v.is_active ?? true,
          }))
        );

      if (insertVarErr) {
        return NextResponse.json(
          {
            error: `Produk tersimpan, tetapi gagal menyimpan varian baru: ${insertVarErr.message}`,
          },
          { status: 500 }
        );
      }
    }
  }

  revalidateCatalogPaths(updated?.slug);
  return NextResponse.json({ product: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { id } = await context.params;
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ demoMode: true, deleted: id });
  }

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateCatalogPaths();
  return NextResponse.json({ deleted: id });
}
