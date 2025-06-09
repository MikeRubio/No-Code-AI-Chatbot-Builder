/*
  # Stripe Integration Schema

  1. New Tables
    - Update existing subscriptions table with Stripe fields
    - Add payment_methods table for storing customer payment info
    - Add invoices table for billing history
    - Add usage_tracking table for monitoring plan limits

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access
    - Add indexes for performance

  3. Functions
    - Add function to check plan limits
    - Add function to reset monthly usage
*/

-- Update subscriptions table with Stripe fields
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end timestamp with time zone;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone;

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal')),
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_invoice_id text UNIQUE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_paid integer NOT NULL, -- Amount in cents
  amount_due integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_pdf text, -- URL to PDF
  hosted_invoice_url text,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('messages', 'chatbots', 'api_calls', 'storage')),
  usage_count integer DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_type, period_start)
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can manage own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for invoices
CREATE POLICY "Users can read own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for usage_tracking
CREATE POLICY "Users can read own usage"
  ON usage_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage usage tracking"
  ON usage_tracking
  FOR ALL
  TO service_role
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_resource ON usage_tracking(user_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Update triggers
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user can perform action based on plan limits
CREATE OR REPLACE FUNCTION check_plan_limit(
  user_uuid uuid,
  resource_type text,
  requested_amount integer DEFAULT 1
) RETURNS boolean AS $$
DECLARE
  user_plan text;
  current_usage integer;
  plan_limit integer;
BEGIN
  -- Get user's current plan
  SELECT plan INTO user_plan
  FROM profiles
  WHERE id = user_uuid;

  -- Get current usage for this period
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM usage_tracking
  WHERE user_id = user_uuid
    AND resource_type = check_plan_limit.resource_type
    AND period_start <= now()
    AND period_end > now();

  -- Set plan limits
  CASE user_plan
    WHEN 'free' THEN
      CASE resource_type
        WHEN 'messages' THEN plan_limit := 100;
        WHEN 'chatbots' THEN plan_limit := 1;
        WHEN 'api_calls' THEN plan_limit := 50;
        ELSE plan_limit := 0;
      END CASE;
    WHEN 'pro' THEN
      CASE resource_type
        WHEN 'messages' THEN plan_limit := 5000;
        WHEN 'chatbots' THEN plan_limit := 5;
        WHEN 'api_calls' THEN plan_limit := 1000;
        ELSE plan_limit := 100;
      END CASE;
    WHEN 'enterprise' THEN
      plan_limit := -1; -- Unlimited
    ELSE
      plan_limit := 0; -- Default to no access
  END CASE;

  -- Check if unlimited or within limits
  RETURN plan_limit = -1 OR (current_usage + requested_amount) <= plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid uuid,
  resource_type text,
  amount integer DEFAULT 1
) RETURNS boolean AS $$
DECLARE
  current_period_start timestamptz;
  current_period_end timestamptz;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', now());
  current_period_end := current_period_start + interval '1 month';

  -- Insert or update usage tracking
  INSERT INTO usage_tracking (user_id, resource_type, usage_count, period_start, period_end)
  VALUES (user_uuid, resource_type, amount, current_period_start, current_period_end)
  ON CONFLICT (user_id, resource_type, period_start)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + amount,
    updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (called by cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage() RETURNS void AS $$
BEGIN
  -- Archive old usage data and reset for new period
  INSERT INTO usage_tracking (user_id, resource_type, usage_count, period_start, period_end)
  SELECT 
    user_id,
    resource_type,
    0,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month'
  FROM (
    SELECT DISTINCT user_id, resource_type
    FROM usage_tracking
    WHERE period_end <= now()
  ) AS distinct_users
  ON CONFLICT (user_id, resource_type, period_start) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;