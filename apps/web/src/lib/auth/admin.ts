import { createSupabaseServerClient, isSupabaseConfigured } from "../supabase/server";

export interface AdminAuthResult {
  authorized: boolean;
  demoMode: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
}

/**
 * Memverifikasi bahwa user yang sedang login memiliki role = 'admin' pada tabel public.profiles.
 * Jika env Supabase belum diisi, mengembalikan demoMode = true agar dashboard tetap bisa dipreview secara lokal.
 */
export async function getAdminAuth(): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return {
        authorized: false,
        demoMode: false,
        userId: null,
        email: null,
        fullName: null,
      };
    }

    return {
      authorized: true,
      demoMode: true,
      userId: "demo-admin",
      email: "admin@bumbuket.pku",
      fullName: "Admin Bumbuket (Mode Preview)",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      authorized: false,
      demoMode: false,
      userId: null,
      email: null,
      fullName: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      demoMode: false,
      userId: null,
      email: null,
      fullName: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      authorized: false,
      demoMode: false,
      userId: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
    };
  }

  return {
    authorized: true,
    demoMode: false,
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name ?? "Admin Bumbuket.pku",
  };
}
