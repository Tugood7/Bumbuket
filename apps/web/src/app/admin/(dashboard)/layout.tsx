import { redirect } from "next/navigation";
import { getAdminAuth } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAdminAuth();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream lg:flex-row">
      <AdminSidebar
        adminName={auth.fullName ?? "Admin Bumbuket.pku"}
        adminEmail={auth.email}
      />

      <div className="flex-1">
        {auth.demoMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-900 print:hidden">
            <strong>Mode Preview Admin:</strong> Supabase belum dikonfigurasi di{" "}
            <code>.env.local</code>, sehingga dashboard menampilkan data contoh
            lokal.
          </div>
        )}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
