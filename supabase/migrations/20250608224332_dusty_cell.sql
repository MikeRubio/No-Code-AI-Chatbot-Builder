/*
  # Add missing subscription columns

  1. New Columns
    - `stripe_price_id` (text) - Stripe price ID for the subscription
    - `stripe_product_id` (text) - Stripe product ID for the subscription
    - `trial_start` (timestamptz) - Trial period start date
    - `trial_end` (timestamptz) - Trial period end date
    - `cancel_at_period_end` (boolean) - Whether subscription cancels at period end
    - `canceled_at` (timestamptz) - When the subscription was canceled

  2. Changes
    - Add missing columns to subscriptions table to match edge function expectations
    - Set appropriate default values for new columns
*/

-- Add missing columns to subscriptions table
DO $$
BEGIN
  -- Add stripe_price_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_price_id text;
  END IF;

  -- Add stripe_product_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_product_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_product_id text;
  END IF;

  -- Add trial_start column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_start timestamptz;
  END IF;

  -- Add trial_end column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_end timestamptz;
  END IF;

  -- Add cancel_at_period_end column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;

  -- Add canceled_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN canceled_at timestamptz;
  END IF;
END $$;