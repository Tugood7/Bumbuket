-- ============================================================================
-- Migration 0002: Row Level Security (RLS) Policies — Bumbuket.pku
-- ============================================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile or admin all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile without changing role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. PRODUCT VARIANTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active product variants"
  ON public.product_variants FOR SELECT
  USING (
    public.is_admin()
    OR (
      is_active = TRUE
      AND EXISTS (
        SELECT 1
        FROM public.products p
        WHERE p.id = product_variants.product_id
          AND p.is_active = TRUE
      )
    )
  );

CREATE POLICY "Admins can manage product variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. ORDERS
-- Catatan: Pembuatan pesanan (INSERT) dilakukan oleh Server API Route (service_role)
-- untuk menjamin validasi harga, kalkulasi Money Bouquet, dan Midtrans Snap Token.
-- ----------------------------------------------------------------------------
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. ORDER ITEMS
-- ----------------------------------------------------------------------------
CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

