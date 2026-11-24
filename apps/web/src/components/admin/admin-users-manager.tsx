"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { AdminUserRecord } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminUsersManagerProps {
  initialAdmins: AdminUserRecord[];
  currentUserId: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Belum pernah login";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminUsersManager({
  initialAdmins,
  currentUserId,
}: AdminUsersManagerProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUserRecord[]>(initialAdmins);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phone }),
      });

      const json = await res.json();
      if (!res.ok) {
        const detail = json.fieldErrors
          ? Object.values(json.fieldErrors as Record<string, string[]>)
              .flat()
              .join(" • ")
          : "";
        setError(detail ? `${json.error} (${detail})` : json.error ?? "Gagal menambah admin.");
        return;
      }

      if (json.admin) {
        setAdmins((prev) => [...prev, json.admin as AdminUserRecord]);
      }
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSuccess(
        `Admin "${json.admin?.full_name ?? email}" berhasil ditambahkan dan langsung bisa login.`
      );
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan saat menambah admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (
    admin: AdminUserRecord,
    mode: "demote" | "delete"
  ) => {
    const confirmMsg =
      mode === "delete"
        ? `Hapus permanen akun "${admin.full_name ?? admin.email}" (${admin.email})? Akun tidak bisa dipakai login lagi.`
        : `Cabut akses admin dari "${admin.full_name ?? admin.email}" (${admin.email})?`;

    if (!window.confirm(confirmMsg)) return;

    setBusyId(admin.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/admins/${admin.id}?mode=${mode}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Gagal memperbarui akses admin.");
        return;
      }

      setAdmins((prev) => prev.filter((item) => item.id !== admin.id));
      setSuccess(
        mode === "delete"
          ? `Akun admin "${admin.email}" berhasil dihapus permanen.`
          : `Akses admin "${admin.email}" berhasil dicabut.`
      );
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan saat memperbarui akses admin.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          {success}
        </div>
      )}

      {/* Form Tambah Admin Baru */}
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-brand-rose" />
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Tambah Admin Baru
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Admin baru otomatis terverifikasi dan langsung dapat masuk di{" "}
          <code>/admin/login</code> untuk mengelola katalog buket dan pesanan.
        </p>

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-admin-name"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Nama Lengkap *
            </label>
            <Input
              id="new-admin-name"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Sonia Wulandari"
            />
          </div>

          <div>
            <label
              htmlFor="new-admin-email"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Email Login *
            </label>
            <Input
              id="new-admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin2@tugoodly.my.id"
            />
          </div>

          <div>
            <label
              htmlFor="new-admin-password"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Kata Sandi (Min. 8 karakter) *
            </label>
            <div className="relative">
              <Input
                id="new-admin-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-rose"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-admin-phone"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              No. WhatsApp (Opsional)
            </label>
            <Input
              id="new-admin-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Tambah Admin
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Daftar Admin Aktif */}
      <section className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-card">
        <div className="border-b border-pink-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-rose" />
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Daftar Admin Aktif ({admins.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-pink-100 bg-brand-cream/80 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Admin</th>
                <th className="px-5 py-3.5">WhatsApp</th>
                <th className="px-5 py-3.5">Terakhir Login</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {admins.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    Belum ada data admin.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = currentUserId === admin.id;
                  const isBusy = busyId === admin.id;
                  return (
                    <tr key={admin.id} className="hover:bg-brand-cream/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-serif text-sm font-bold text-foreground">
                            {admin.full_name || "Admin Bumbuket.pku"}
                          </p>
                          {isSelf && (
                            <span className="rounded-full bg-brand-blush px-2 py-0.5 text-[10px] font-bold text-brand-rose">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {admin.email}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {admin.phone || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatDateTime(admin.last_sign_in_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-muted-foreground">
                            Akun aktif
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRemove(admin, "demote")}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                              title="Cabut role admin (ubah jadi customer)"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserMinus className="h-3.5 w-3.5" />
                              )}
                              Cabut Akses
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRemove(admin, "delete")}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title="Hapus akun permanen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

