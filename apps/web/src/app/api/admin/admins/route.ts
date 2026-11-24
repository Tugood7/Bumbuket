import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth } from "@/lib/auth/admin";
import { getAdminUsers } from "@/lib/data/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createAdminSchema = z.object({
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(100),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(100),
  phone: z.string().trim().max(25).optional().or(z.literal("")),
});

export async function GET() {
  const auth = await getAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const admins = await getAdminUsers();
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const auth = await getAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAdminSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data admin baru belum valid.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "Supabase admin client belum dikonfigurasi. Tidak dapat menambah admin di mode preview.",
      },
      { status: 503 }
    );
  }

  const { fullName, email, password, phone } = parsed.data;
  const normalizedPhone = phone?.trim() || null;

  const { data: created, error: createErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
      },
    });

  if (createErr || !created.user) {
    const isDuplicate =
      createErr?.message?.toLowerCase().includes("already") ||
      createErr?.message?.toLowerCase().includes("registered");

    return NextResponse.json(
      {
        error: isDuplicate
          ? "Email tersebut sudah terdaftar. Gunakan email lain."
          : `Gagal membuat akun admin: ${createErr?.message ?? "Unknown"}`,
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
    {
      id: created.user.id,
      full_name: fullName,
      phone: normalizedPhone,
      role: "admin",
    },
    { onConflict: "id" }
  );

  if (profileErr) {
    return NextResponse.json(
      {
        error: `Akun dibuat, tetapi gagal menetapkan role admin: ${profileErr.message}`,
      },
      { status: 500 }
    );
  }

  revalidatePath("/admin/admins");

  return NextResponse.json(
    {
      admin: {
        id: created.user.id,
        email: created.user.email ?? email,
        full_name: fullName,
        phone: normalizedPhone,
        created_at: created.user.created_at,
        last_sign_in_at: null,
      },
    },
    { status: 201 }
  );
}

