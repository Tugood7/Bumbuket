-- ============================================================================
-- Migration 0005: Bukti Transfer Bank BRI (Screenshot Upload) — Bumbuket.pku
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_proof_url         TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  TRUE,
  5242880, -- 5 MB per screenshot
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view payment proofs'
  ) THEN
    CREATE POLICY "Public can view payment proofs"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'payment-proofs');
  END IF;
END $$;

