import type {
  Category,
  ProductAvailability,
  ProductWithRelations,
} from "@bumbuket/shared";
import { createSupabaseServerClient } from "../supabase/server";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "./fallback-catalog";

export interface ProductQueryFilters {
  categorySlug?: string;
  availability?: ProductAvailability | "all";
  search?: string;
  sort?: "featured" | "price_asc" | "price_desc" | "newest";
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_CATEGORIES;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("[catalog] getCategories Supabase error:", error.message);
    }
    return FALLBACK_CATEGORIES;
  }

  return data as Category[];
}

export async function getProducts(
  filters: ProductQueryFilters = {}
): Promise<ProductWithRelations[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return filterLocalProducts(FALLBACK_PRODUCTS, filters);
  }

  let query = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq("is_active", true);

  if (filters.availability && filters.availability !== "all") {
    query = query.eq("availability_type", filters.availability);
  }

  if (filters.search && filters.search.trim().length > 0) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) {
      console.error("[catalog] getProducts Supabase error:", error.message);
    }
    return filterLocalProducts(FALLBACK_PRODUCTS, filters);
  }

  let normalized = (data as ProductWithRelations[]).map((product) => ({
    ...product,
    variants: (product.variants ?? [])
      .filter((v) => v.is_active)
      .sort((a, b) => a.display_order - b.display_order),
  }));

  if (filters.categorySlug && filters.categorySlug !== "all") {
    if (filters.categorySlug === "ready-stock") {
      normalized = normalized.filter(
        (p) =>
          p.availability_type === "ready_stock" ||
          p.category?.slug === "ready-stock"
      );
    } else {
      normalized = normalized.filter(
        (p) => p.category?.slug === filters.categorySlug
      );
    }
  }

  return normalized;
}

export async function getReadyStockProducts(
  limit: number = 4
): Promise<ProductWithRelations[]> {
  const products = await getProducts({ availability: "ready_stock" });
  return products.slice(0, limit);
}

export async function getFeaturedProducts(
  limit: number = 6
): Promise<ProductWithRelations[]> {
  const products = await getProducts({ sort: "featured" });
  return products.slice(0, limit);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    if (error) {
      console.error("[catalog] getProductBySlug Supabase error:", error.message);
    }
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  const product = data as ProductWithRelations;
  return {
    ...product,
    variants: (product.variants ?? [])
      .filter((v) => v.is_active)
      .sort((a, b) => a.display_order - b.display_order),
  };
}

function filterLocalProducts(
  items: ProductWithRelations[],
  filters: ProductQueryFilters
): ProductWithRelations[] {
  let list = [...items];

  if (filters.categorySlug && filters.categorySlug !== "all") {
    if (filters.categorySlug === "ready-stock") {
      list = list.filter(
        (p) =>
          p.availability_type === "ready_stock" ||
          p.category?.slug === "ready-stock"
      );
    } else {
      list = list.filter((p) => p.category?.slug === filters.categorySlug);
    }
  }

  if (filters.availability && filters.availability !== "all") {
    list = list.filter((p) => p.availability_type === filters.availability);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }

  switch (filters.sort) {
    case "price_asc":
      list.sort((a, b) => a.base_price - b.base_price);
      break;
    case "price_desc":
      list.sort((a, b) => b.base_price - a.base_price);
      break;
    default:
      list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
      break;
  }

  return list;
}

