import { getAdminAuth } from "@/lib/auth/admin";
import { getAdminUsers } from "@/lib/data/admin";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";

export const metadata = {
  title: "Kelola Admin — Admin",
};

export default async function AdminUsersPage() {
  const [auth, admins] = await Promise.all([getAdminAuth(), getAdminUsers()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
          Pengaturan Akses
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
          Kelola Akun Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tambahkan staf atau rekan florist sebagai admin, atau cabut akses
          admin yang sudah tidak aktif.
        </p>
      </div>

      <AdminUsersManager
        initialAdmins={admins}
        currentUserId={auth.userId}
      />
    </div>
  );
}

