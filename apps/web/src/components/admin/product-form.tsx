"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  DEFAULT_WRAPPING_COLORS,
  type Category,
  type ProductAvailability,
  type ProductWithRelations,
  type WrappingColor,
} from "@bumbuket/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface VariantDraft {
  name: string;
  sku: string;
  price_adjustment: number;
  stock_quantity: number;
}

interface ProductFormProps {
  categories: Category[];
  initialProduct?: ProductWithRelations | null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({ categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id ?? categories[0]?.id ?? ""
  );
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [description, setDescription] = useState(
    initialProduct?.description ?? ""
  );
  const [basePrice, setBasePrice] = useState(initialProduct?.base_price ?? 150000);
  const [availabilityType, setAvailabilityType] =
    useState<ProductAvailability>(
      initialProduct?.availability_type ?? "ready_stock"
    );
  const [leadTimeDays, setLeadTimeDays] = useState(
    initialProduct?.lead_time_days ?? 0
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct?.stock_quantity ?? 5
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [wrappingColors, setWrappingColors] = useState<WrappingColor[]>(
    initialProduct?.available_wrapping_colors?.length
      ? initialProduct.available_wrapping_colors
      : [...DEFAULT_WRAPPING_COLORS.slice(0, 5)]
  );

  const [isCustomizable, setIsCustomizable] = useState(
    initialProduct?.is_customizable ?? true
  );
  const [isMoneyBouquet, setIsMoneyBouquet] = useState(
    initialProduct?.is_money_bouquet ?? false
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProduct?.is_featured ?? false
  );
  const [isActive, setIsActive] = useState(initialProduct?.is_active ?? true);

  const [variants, setVariants] = useState<VariantDraft[]>(
    (initialProduct?.variants ?? []).map((v) => ({
      name: v.name,
      sku: v.sku ?? "",
      price_adjustment: v.price_adjustment,
      stock_quantity: v.stock_quantity,
    }))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const toggleWrappingColor = (color: WrappingColor) => {
    setWrappingColors((prev) =>
      prev.some((c) => c.name === color.name)
        ? prev.filter((c) => c.name !== color.name)
        : [...prev, color]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengunggah foto.");
        return;
      }
      if (json.url) {
        setImages((prev) => [...prev, json.url]);
      }
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const addManualImageUrl = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("URL gambar harus diawali dengan http:// atau https://");
      return;
    }
    setError(null);
    setImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setManualImageUrl("");
  };

  const setAsCoverImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(idx, 1);
      return selected ? [selected, ...next] : prev;
    });
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { name: "", sku: "", price_adjustment: 0, stock_quantity: 10 },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) {
      setError("Tunggu hingga proses upload foto selesai sebelum menyimpan.");
      return;
    }

    const pendingManualUrl = manualImageUrl.trim();
    let finalImages = images;
    if (pendingManualUrl) {
      if (!/^https?:\/\//i.test(pendingManualUrl)) {
        setError("URL gambar manual harus diawali dengan http:// atau https://");
        return;
      }
      if (!images.includes(pendingManualUrl)) {
        finalImages = [...images, pendingManualUrl];
        setImages(finalImages);
      }
      setManualImageUrl("");
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = isEditing
        ? `/api/admin/products/${initialProduct!.id}`
        : "/api/admin/products";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          name,
          slug,
          description: description || null,
          base_price: Number(basePrice),
          availability_type: availabilityType,
          lead_time_days:
            availabilityType === "ready_stock" ? 0 : Math.max(1, Number(leadTimeDays)),
          stock_quantity: Number(stockQuantity),
          images: finalImages,
          available_wrapping_colors: wrappingColors,
          is_customizable: isCustomizable,
          is_money_bouquet: isMoneyBouquet,
          is_featured: isFeatured,
          is_active: isActive,
          variants: variants
            .filter((v) => v.name.trim().length > 0)
            .map((v, idx) => ({
              name: v.name.trim(),
              sku: v.sku.trim() || null,
              price_adjustment: Number(v.price_adjustment) || 0,
              stock_quantity: Number(v.stock_quantity) || 0,
              display_order: idx,
              is_active: true,
            })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const detailMessages = json.fieldErrors
          ? Object.entries(json.fieldErrors as Record<string, string[]>)
              .flatMap(([field, msgs]) =>
                (msgs ?? []).map((msg) => `${field}: ${msg}`)
              )
              .join(" • ")
          : "";
        setError(
          detailMessages
            ? `${json.error ?? "Gagal menyimpan produk."} (${detailMessages})`
            : json.error ?? "Gagal menyimpan produk."
        );
        setSaving(false);
        return;
      }

      if (json.demoMode) {
        setError(
          "Perubahan belum tersimpan permanen karena Supabase (.env.local / .env.production) belum dikonfigurasi. Hubungkan Supabase terlebih dahulu agar foto dan produk tampil di storefront."
        );
        setSaving(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan saat menyimpan produk.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Informasi Dasar */}
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Informasi Buket
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Nama Buket *
            </label>
            <Input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Blush Pink Lily Premium"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Slug URL *
            </label>
            <Input
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="blush-pink-lily-premium"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Kategori *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-pink-200 bg-white px-3.5 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Harga Dasar (Rupiah) *
            </label>
            <Input
              type="number"
              min={0}
              step={1000}
              required
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Status Ketersediaan *
            </label>
            <select
              value={availabilityType}
              onChange={(e) =>
                setAvailabilityType(e.target.value as ProductAvailability)
              }
              className="flex h-11 w-full rounded-xl border border-pink-200 bg-white px-3.5 text-sm"
            >
              <option value="ready_stock">
                Ready Stock (Bisa Kirim Hari Ini)
              </option>
              <option value="pre_order">Pre-Order / Custom</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Stok Tersedia
              </label>
              <Input
                type="number"
                min={0}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Lead Time PO (Hari)
              </label>
              <Input
                type="number"
                min={0}
                max={30}
                disabled={availabilityType === "ready_stock"}
                value={availabilityType === "ready_stock" ? 0 : leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold">
              Deskripsi Buket
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan jenis bunga artifisial, ukuran buket, dan momen yang cocok..."
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-xs">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-brand-rose"
            />
            <span className="font-semibold">Tampilkan di Katalog</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-brand-rose"
            />
            <span className="font-semibold">Produk Unggulan Beranda</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isCustomizable}
              onChange={(e) => setIsCustomizable(e.target.checked)}
              className="h-4 w-4 accent-brand-rose"
            />
            <span className="font-semibold">Bisa Kustomisasi Wrapping &amp; Ucapan</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isMoneyBouquet}
              onChange={(e) => setIsMoneyBouquet(e.target.checked)}
              className="h-4 w-4 accent-brand-rose"
            />
            <span className="font-semibold text-brand-rose">
              Aktifkan Kalkulator Money Bouquet (1–100 Lembar)
            </span>
          </label>
        </div>
      </section>

      {/* Foto Buket (Supabase Storage) */}
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Foto Buket (Rasio 4:5 / 1:1)
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload langsung ke Supabase Storage bucket <code>product-images</code>{" "}
          (maks 5 MB, JPEG/PNG/WebP).
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-blush px-4 py-2 text-xs font-semibold text-brand-rose hover:bg-pink-200/70">
            {uploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            <span>{uploadingImage ? "Mengunggah..." : "Upload Foto Buket"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>

          <div className="flex flex-1 min-w-[220px] gap-2">
            <Input
              value={manualImageUrl}
              onChange={(e) => setManualImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManualImageUrl();
                }
              }}
              placeholder="Atau tempel URL gambar https://..."
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addManualImageUrl}
            >
              Tambah URL
            </Button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-pink-200 bg-brand-cream"
              >
                <Image
                  src={url}
                  alt={`Foto buket ${idx + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                {idx === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-rose px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Sampul
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAsCoverImage(idx)}
                    className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-xs hover:bg-brand-blush hover:text-brand-rose"
                  >
                    Jadikan Sampul
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow-sm hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Warna Kertas Wrapping */}
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Pilihan Warna Kertas Wrapping
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEFAULT_WRAPPING_COLORS.map((color) => {
            const active = wrappingColors.some((c) => c.name === color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleWrappingColor(color)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  active
                    ? "border-brand-rose bg-brand-blush/60 text-brand-rose"
                    : "border-pink-200 bg-white text-muted-foreground"
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-pink-200"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Varian Produk */}
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Varian Buket (Opsional)
            </h2>
            <p className="text-xs text-muted-foreground">
              Misal: Ukuran M / L, Tambah Boneka Toga. Selisih harga ditambahkan
              ke harga dasar.
            </p>
          </div>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={addVariantRow}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Varian
          </Button>
        </div>

        {variants.length > 0 && (
          <div className="mt-4 space-y-3">
            {variants.map((variant, idx) => (
              <div
                key={idx}
                className="grid items-end gap-2 rounded-2xl border border-pink-100 bg-brand-cream/50 p-3 sm:grid-cols-12"
              >
                <div className="sm:col-span-5">
                  <label className="mb-1 block text-[11px] font-semibold">
                    Nama Varian
                  </label>
                  <Input
                    value={variant.name}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, name: e.target.value } : row
                        )
                      )
                    }
                    placeholder="Ukuran Large (8 Tangkai)"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold">
                    SKU
                  </label>
                  <Input
                    value={variant.sku}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, sku: e.target.value } : row
                        )
                      )
                    }
                    placeholder="LILY-L"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold">
                    Selisih Harga
                  </label>
                  <Input
                    type="number"
                    step={1000}
                    value={variant.price_adjustment}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                price_adjustment: Number(e.target.value),
                              }
                            : row
                        )
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold">
                    Stok
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={variant.stock_quantity}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                stock_quantity: Number(e.target.value),
                              }
                            : row
                        )
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="rounded-xl p-2.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Batal
        </Button>
        <Button type="submit" size="lg" disabled={saving || uploadingImage}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : isEditing ? (
            "Simpan Perubahan Buket"
          ) : (
            "Publikasikan Buket"
          )}
        </Button>
      </div>
    </form>
  );
}
