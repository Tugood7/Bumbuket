"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { STORE_INFO } from "@bumbuket/shared";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Konfigurasi Supabase belum aktif. Anda bisa langsung membuka /admin di mode preview."
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-cream via-brand-blush/40 to-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-8 shadow-soft">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blush font-serif text-2xl font-bold text-brand-rose">
            B
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">
            Admin {STORE_INFO.name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Masuk untuk mengelola jadwal pesanan masuk &amp; katalog buket
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Email Admin
            </label>
            <Input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bumbuket.pku"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Kata Sandi
            </label>
            <Input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Masuk Dashboard Admin
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-pink-100 pt-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="font-semibold text-brand-rose hover:underline">
            ← Kembali ke Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
