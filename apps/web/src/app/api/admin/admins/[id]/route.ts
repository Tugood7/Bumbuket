import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { id } = await context.params;

  if (auth.userId && auth.userId === id) {
    return NextResponse.json(
      { error: "Anda tidak dapat mencabut atau menghapus akun Anda sendiri." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin client belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Minimal harus ada 1 akun admin aktif." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "delete" ? "delete" : "demote";

  if (mode === "delete") {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json(
        { error: `Gagal menghapus akun admin: ${error.message}` },
        { status: 500 }
      );
    }
  } else {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role: "customer" })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Gagal mencabut akses admin: ${error.message}` },
        { status: 500 }
      );
    }
  }

  revalidatePath("/admin/admins");
  return NextResponse.json({ ok: true, id, mode });
}

