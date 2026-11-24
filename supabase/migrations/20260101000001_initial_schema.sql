-- ============================================================================
-- Migration 0001: Initial Schema — Bumbuket.pku E-Commerce Ecosystem
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM (
  'customer',
  'admin'
);

CREATE TYPE public.product_availability AS ENUM (
  'ready_stock', -- Bisa kirim / ambil hari ini
  'pre_order'    -- Pre-Order / Custom
);

CREATE TYPE public.fulfillment_method AS ENUM (
  'pickup_store',    -- Ambil di Toko (Jl. Pahlawan Kerja, Marpoyan Damai)
  'instant_courier'  -- Kirim Kurir Instan (Gojek / Maxim / Grab area Pekanbaru)
);

CREATE TYPE public.courier_provider AS ENUM (
  'gojek',
  'maxim',
  'grab'
);

CREATE TYPE public.checkout_channel AS ENUM (
  'midtrans',
  'whatsapp'
);

CREATE TYPE public.payment_status AS ENUM (
  'unpaid',
  'pending',
  'paid',
  'failed',
  'expired',
  'refunded'
);

CREATE TYPE public.order_status AS ENUM (
  'pending_payment', -- Menunggu Pembayaran
  'processing',      -- Diproses
  'arranging',       -- Dirangkai
  'ready',           -- Siap Diambil / Dikirim
  'completed',       -- Selesai
  'cancelled'        -- Dibatalkan
);

-- ----------------------------------------------------------------------------
-- 2. UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence harian/global sederhana untuk nomor pesanan BBK-YYYYMMDD-XXXX
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  seq_val   BIGINT;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
  seq_val   := NEXTVAL('public.order_number_seq');
  RETURN 'BBK-' || today_str || '-' || LPAD((seq_val % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. TABLES
-- ----------------------------------------------------------------------------

-- 3.1 Profiles (sinkron dengan auth.users untuk role admin & customer)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  role        public.user_role NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3.2 Categories
CREATE TABLE public.categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  image_url           TEXT,
  is_special_catalog  BOOLEAN NOT NULL DEFAULT FALSE, -- Misal: Katalog Spesial Wisuda / Hari Guru
  display_order       SMALLINT NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Products
CREATE TABLE public.products (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id               UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL UNIQUE,
  description               TEXT,
  base_price                INTEGER NOT NULL CHECK (base_price >= 0),
  availability_type         public.product_availability NOT NULL DEFAULT 'pre_order',
  lead_time_days            SMALLINT NOT NULL DEFAULT 1 CHECK (lead_time_days >= 0),
  stock_quantity            INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  images                    TEXT[] NOT NULL DEFAULT '{}',
  available_wrapping_colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format JSONB: [{"name": "Blush Pink", "hex": "#FCE7F3"}]
  is_customizable           BOOLEAN NOT NULL DEFAULT TRUE,
  is_money_bouquet          BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured               BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Product Variants
CREATE TABLE public.product_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name              TEXT NOT NULL, -- Misal: "1-10 Lembar", "Ukuran M (10 Tangkai)", "Include Boneka Wisuda"
  sku               TEXT UNIQUE,
  price_adjustment  INTEGER NOT NULL DEFAULT 0, -- Harga akhir = products.base_price + price_adjustment
  stock_quantity    INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url         TEXT,
  display_order     SMALLINT NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Orders
CREATE TABLE public.orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number             TEXT NOT NULL UNIQUE DEFAULT public.generate_order_number(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Data Pembeli
  customer_name            TEXT NOT NULL,
  customer_phone           TEXT NOT NULL,
  customer_email           TEXT,

  -- Pengiriman / Pengambilan Lokal Pekanbaru
  fulfillment_method       public.fulfillment_method NOT NULL,
  courier_provider         public.courier_provider, -- gojek / maxim / grab (jika instant_courier)
  shipping_paid_separately BOOLEAN NOT NULL DEFAULT TRUE, -- Ongkir ojol dibayar terpisah sesuai tarif aplikasi
  scheduled_date           DATE NOT NULL,        -- Urutan jadwal utama di Dashboard Admin
  scheduled_time_slot      TEXT NOT NULL,        -- Misal: "08:00-10:00", "12:00-14:00"
  delivery_address         TEXT,
  delivery_district        TEXT,                 -- Kecamatan area Pekanbaru
  delivery_notes           TEXT,                 -- Patokan lokasi / nama & nomor HP penerima

  -- Rincian Biaya (Rupiah)
  subtotal                 INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee             INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount          INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount             INTEGER NOT NULL CHECK (total_amount >= 0),

  -- Hybrid Checkout & Pembayaran
  checkout_channel         public.checkout_channel NOT NULL DEFAULT 'midtrans',
  payment_status           public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_method           TEXT,
  midtrans_order_id        TEXT UNIQUE,
  midtrans_snap_token      TEXT,
  midtrans_transaction_id  TEXT,
  paid_at                  TIMESTAMPTZ,

  -- Status Pengerjaan Buket
  order_status             public.order_status NOT NULL DEFAULT 'pending_payment',
  admin_notes              TEXT,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_instant_courier_details CHECK (
    fulfillment_method = 'pickup_store'
    OR (
      courier_provider IS NOT NULL
      AND delivery_address IS NOT NULL
      AND LENGTH(TRIM(delivery_address)) > 0
    )
  )
);

-- 3.6 Order Items
CREATE TABLE public.order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id            UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

  -- Snapshot produk saat checkout
  product_name          TEXT NOT NULL,
  variant_name          TEXT,
  product_image_url     TEXT,
  unit_price            INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  subtotal              INTEGER NOT NULL CHECK (subtotal >= 0),

  -- Kustomisasi Buket
  wrapping_color        TEXT,
  greeting_card_text    TEXT,
  custom_notes          TEXT,

  -- Detail khusus Money Bouquet (opsional, NULL untuk buket non-uang)
  -- Format JSONB:
  -- {
  --   "sheet_count": 20,
  --   "denomination": 50000,
  --   "crafting_fee": 150000,
  --   "cash_amount": 1000000,
  --   "cash_payment_mode": "included_in_checkout" | "separate_via_whatsapp",
  --   "include_foil_balloon": true,
  --   "request_new_notes": false
  -- }
  money_bouquet_details JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS (updated_at)
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_categories_display_order
  ON public.categories (display_order ASC, is_active);

CREATE INDEX idx_products_category_active
  ON public.products (category_id, is_active);

CREATE INDEX idx_products_availability_active
  ON public.products (availability_type, is_active);

CREATE INDEX idx_products_featured_active
  ON public.products (is_featured, is_active);

CREATE INDEX idx_product_variants_product_id
  ON public.product_variants (product_id, display_order ASC);

-- Index khusus jadwal pesanan aktif di Dashboard Admin
CREATE INDEX idx_orders_admin_schedule
  ON public.orders (scheduled_date ASC, scheduled_time_slot ASC)
  WHERE order_status NOT IN ('completed', 'cancelled');

CREATE INDEX idx_orders_user_created
  ON public.orders (user_id, created_at DESC);

CREATE INDEX idx_orders_status
  ON public.orders (order_status, payment_status);

CREATE INDEX idx_order_items_order_id
  ON public.order_items (order_id);

