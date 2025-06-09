/*
  # Add Account Management Tables

  1. New Tables
    - `subscription_feedback` - Store user feedback when canceling/reactivating subscriptions
    - `account_deletions` - Audit trail for account deletions

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies for data access
*/

-- Subscription feedback table
CREATE TABLE IF NOT EXISTS subscription_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('cancel', 'reactivate')),
  reason text,
  feedback text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_feedback ENABLE ROW LEVEL SECURITY;

-- Account deletions audit table
CREATE TABLE IF NOT EXISTS account_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  deletion_requested_at timestamptz NOT NULL,
  deletion_completed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_feedback_subscription_id ON subscription_feedback(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_feedback_action ON subscription_feedback(action);
CREATE INDEX IF NOT EXISTS idx_account_deletions_user_id ON account_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletions_status ON account_deletions(status);

-- RLS Policies
CREATE POLICY "Service role can manage subscription feedback"
  ON subscription_feedback
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage account deletions"
  ON account_deletions
  FOR ALL
  TO service_role
  USING (true);

-- Users can view their own deletion records (if they somehow still have access)
CREATE POLICY "Users can view own deletion records"
  ON account_deletions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);