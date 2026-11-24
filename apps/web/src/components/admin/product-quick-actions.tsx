"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Loader2, Trash2 } from "lucide-react";
import type { ProductAvailability } from "@bumbuket/shared";
import { cn } from "@/lib/utils";

interface ProductQuickActionsProps {
  productId: string;
  productName: string;
  availabilityType: ProductAvailability;
  isActive: boolean;
}

export function ProductQuickActions({
  productId,
  productName,
  availabilityType,
  isActive,
}: ProductQuickActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      const next: ProductAvailability =
        availabilityType === "ready_stock" ? "pre_order" : "ready_stock";
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _mode: "quick", availability_type: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _mode: "quick", is_active: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Hapus buket "${productName}" dari katalog?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={loading}
        onClick={toggleAvailability}
        className={cn(
          "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
          availabilityType === "ready_stock"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-pink-200 bg-brand-blush/60 text-brand-rose hover:bg-brand-blush"
        )}
        title="Klik untuk ganti antara Ready Stock dan Pre-Order"
      >
        {availabilityType === "ready_stock" ? "Ready Stock" : "Pre-Order"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={toggleActive}
        className={cn(
          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          isActive
            ? "border-pink-200 bg-white text-foreground hover:bg-muted"
            : "border-border bg-muted text-muted-foreground"
        )}
      >
        {isActive ? "Aktif" : "Draft"}
      </button>

      <Link
        href={`/admin/products/${productId}/edit`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-pink-200 text-brand-rose hover:bg-brand-blush/60"
        title="Edit produk"
      >
        <Edit className="h-3.5 w-3.5" />
      </Link>

      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        title="Hapus produk"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
