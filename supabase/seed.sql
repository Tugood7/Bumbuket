-- ============================================================================
-- Seed Data: Kategori & Contoh Produk Awal Bumbuket.pku
-- ============================================================================

INSERT INTO public.categories (name, slug, description, is_special_catalog, display_order)
VALUES
  ('Ready Stock', 'ready-stock', 'Buket siap kirim atau ambil hari ini juga di toko Marpoyan Damai.', FALSE, 1),
  ('Lily', 'lily', 'Buket bunga lily artifisial premium dengan nuansa feminin dan elegan.', FALSE, 2),
  ('Mix Flower', 'mix-flower', 'Perpaduan bunga artifisial warna-warni pastel maupun cerah.', FALSE, 3),
  ('Money Bouquet', 'money-bouquet', 'Buket uang estetik lengkap dengan dried flowers Baby Breath/Caspea & gratis kartu ucapan.', FALSE, 4),
  ('Custom Bouquet', 'custom-bouquet', 'Rangkaian buket sesuai request warna, isi, dan budget acara Anda.', FALSE, 5),
  ('Boneka', 'boneka', 'Buket kombinasi boneka lucu & bunga artifisial, favorit untuk wisuda dan ulang tahun.', FALSE, 6),
  ('Handbouquet', 'handbouquet', 'Handbouquet elegan untuk lamaran, akad, maupun sesi foto.', FALSE, 7),
  ('Katalog Spesial', 'katalog-spesial', 'Koleksi khusus momen Wisuda, Hari Guru, dan perayaan spesial lainnya.', TRUE, 8)
ON CONFLICT (slug) DO NOTHING;

-- Produk contoh 1: Money Bouquet (sesuai pricelist resmi Bumbuket.pku)
WITH money_cat AS (
  SELECT id FROM public.categories WHERE slug = 'money-bouquet' LIMIT 1
),
inserted_money_product AS (
  INSERT INTO public.products (
    category_id,
    name,
    slug,
    description,
    base_price,
    availability_type,
    lead_time_days,
    stock_quantity,
    available_wrapping_colors,
    is_customizable,
    is_money_bouquet,
    is_featured
  )
  SELECT
    money_cat.id,
    'Premium Money Bouquet Custom',
    'premium-money-bouquet-custom',
    'Buket uang premium dirangkai rapi dengan dried flowers (Baby Breath / Caspea), free greeting card, free request warna wrapping, opsi balon foil gratis, serta tersedia request uang pecahan baru 2k-20k (selama stok tersedia). Harga pricelist merupakan biaya jasa rangkai dan belum termasuk nominal uang.',
    0,
    'pre_order',
    1,
    99,
    '[
      {"name": "Blush Pink", "hex": "#FCE7F3"},
      {"name": "Soft Rose", "hex": "#F472B6"},
      {"name": "Pearl White", "hex": "#FFFFFF"},
      {"name": "Champagne Cream", "hex": "#F5EBE0"},
      {"name": "Sage Pastel", "hex": "#D8E2DC"},
      {"name": "Midnight Black", "hex": "#1F2937"}
    ]'::jsonb,
    TRUE,
    TRUE,
    TRUE
  FROM money_cat
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO public.product_variants (product_id, name, sku, price_adjustment, stock_quantity, display_order)
SELECT id, v.name, v.sku, v.price, 99, v.ord
FROM inserted_money_product
CROSS JOIN (
  VALUES
    ('1 - 10 Lembar (Jasa Rangkai)',   'MB-01-10',   100000, 1),
    ('11 - 20 Lembar (Jasa Rangkai)',  'MB-11-20',   150000, 2),
    ('21 - 30 Lembar (Jasa Rangkai)',  'MB-21-30',   200000, 3),
    ('31 - 40 Lembar (Jasa Rangkai)',  'MB-31-40',   250000, 4),
    ('41 - 50 Lembar (Jasa Rangkai)',  'MB-41-50',   325000, 5),
    ('51 - 60 Lembar (Jasa Rangkai)',  'MB-51-60',   425000, 6),
    ('61 - 75 Lembar (Jasa Rangkai)',  'MB-61-75',   675000, 7),
    ('76 - 100 Lembar (Jasa Rangkai)', 'MB-76-100', 1150000, 8)
) AS v(name, sku, price, ord)
ON CONFLICT (sku) DO NOTHING;

-- Produk contoh 2: Ready Stock Lily Bouquet
INSERT INTO public.products (
  category_id, name, slug, description, base_price,
  availability_type, lead_time_days, stock_quantity,
  available_wrapping_colors, is_customizable, is_money_bouquet, is_featured
)
SELECT
  id,
  'Blush Pink Lily Premium',
  'blush-pink-lily-premium',
  'Rangkaian bunga lily artifisial pink premium dengan wrapping blush pink dan pita satin manis. Ready stock, siap kirim hari ini di area Pekanbaru.',
  185000,
  'ready_stock',
  0,
  5,
  '[
    {"name": "Blush Pink", "hex": "#FCE7F3"},
    {"name": "Pearl White", "hex": "#FFFFFF"},
    {"name": "Deep Rose", "hex": "#9D174D"}
  ]'::jsonb,
  TRUE,
  FALSE,
  TRUE
FROM public.categories WHERE slug = 'lily'
ON CONFLICT (slug) DO NOTHING;

-- Produk contoh 3: Mix Flower Pastel
INSERT INTO public.products (
  category_id, name, slug, description, base_price,
  availability_type, lead_time_days, stock_quantity,
  available_wrapping_colors, is_customizable, is_money_bouquet, is_featured
)
SELECT
  id,
  'Garden Pastel Mix Flower',
  'garden-pastel-mix-flower',
  'Kombinasi bunga artifisial warna pastel ceria dengan wrapping putih bersih dan pita satin elegan. Cocok untuk ulang tahun, wisuda, maupun ucapan terima kasih.',
  210000,
  'ready_stock',
  0,
  4,
  '[
    {"name": "Pearl White", "hex": "#FFFFFF"},
    {"name": "Blush Pink", "hex": "#FCE7F3"},
    {"name": "Champagne Cream", "hex": "#F5EBE0"},
    {"name": "Baby Blue", "hex": "#DBEAFE"}
  ]'::jsonb,
  TRUE,
  FALSE,
  TRUE
FROM public.categories WHERE slug = 'mix-flower'
ON CONFLICT (slug) DO NOTHING;

-- Produk contoh 4: Katalog Spesial Hari Guru / Wisuda
INSERT INTO public.products (
  category_id, name, slug, description, base_price,
  availability_type, lead_time_days, stock_quantity,
  available_wrapping_colors, is_customizable, is_money_bouquet, is_featured
)
SELECT
  id,
  'Buket Spesial Wisuda & Hari Guru',
  'buket-spesial-wisuda-hari-guru',
  'Buket edisi spesial dengan kombinasi bunga artifisial pilihan dan kartu ucapan custom. Dapat dipesan Pre-Order untuk memastikan ketersediaan warna favorit.',
  145000,
  'pre_order',
  1,
  20,
  '[
    {"name": "Blush Pink", "hex": "#FCE7F3"},
    {"name": "Soft Rose", "hex": "#F472B6"},
    {"name": "Pearl White", "hex": "#FFFFFF"},
    {"name": "Midnight Black", "hex": "#1F2937"}
  ]'::jsonb,
  TRUE,
  FALSE,
  TRUE
FROM public.categories WHERE slug = 'katalog-spesial'
ON CONFLICT (slug) DO NOTHING;

