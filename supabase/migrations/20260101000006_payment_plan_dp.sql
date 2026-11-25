-- ============================================================================
-- Migration 0006: Skema Pembayaran DP vs Lunas — Bumbuket.pku
-- ============================================================================

ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'dp_paid';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_plan     TEXT    NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS dp_amount        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_orders_payment_plan'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT chk_orders_payment_plan
      CHECK (payment_plan IN ('full', 'dp') AND dp_amount >= 0 AND remaining_amount >= 0);
  END IF;
END $$;

