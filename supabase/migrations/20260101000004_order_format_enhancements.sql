-- ============================================================================
-- Migration 0004: Order Format Enhancements (Recipient, BRI Transfer, 10m SLA)
-- ============================================================================

ALTER TYPE public.checkout_channel ADD VALUE IF NOT EXISTS 'bank_transfer';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS recipient_name     TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone    TEXT,
  ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;

-- Perbarui constraint kurir instan agar mewajibkan data penerima (Nama, No. Telp, Alamat)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_instant_courier_details;

ALTER TABLE public.orders
  ADD CONSTRAINT chk_instant_courier_details CHECK (
    fulfillment_method = 'pickup_store'
    OR (
      courier_provider IS NOT NULL
      AND recipient_name IS NOT NULL
      AND LENGTH(TRIM(recipient_name)) > 0
      AND recipient_phone IS NOT NULL
      AND LENGTH(TRIM(recipient_phone)) > 0
      AND delivery_address IS NOT NULL
      AND LENGTH(TRIM(delivery_address)) > 0
    )
  );
