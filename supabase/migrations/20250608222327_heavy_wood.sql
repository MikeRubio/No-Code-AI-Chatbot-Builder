/*
  # Fix subscription updates and user linking

  1. Add missing foreign key constraints
  2. Create function to sync subscription data
  3. Add indexes for better performance
  4. Update RLS policies for proper access
*/

-- Add user_id to subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Function to sync subscription data with profile
CREATE OR REPLACE FUNCTION sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when subscription changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles 
    SET 
      plan = NEW.plan,
      subscription_id = NEW.stripe_subscription_id,
      subscription_status = NEW.status,
      message_quota = CASE 
        WHEN NEW.plan = 'pro' THEN 5000
        WHEN NEW.plan = 'enterprise' THEN -1
        ELSE 100
      END,
      updated_at = now()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription sync
DROP TRIGGER IF EXISTS trigger_sync_subscription_to_profile ON subscriptions;
CREATE TRIGGER trigger_sync_subscription_to_profile
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_to_profile();

-- Function to link subscription by customer email
CREATE OR REPLACE FUNCTION link_subscription_by_email(
  customer_id text,
  customer_email text
)
RETURNS uuid AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Find user by email
  SELECT id INTO user_uuid
  FROM profiles
  WHERE email = customer_email;
  
  -- Update subscription with user_id if found
  IF user_uuid IS NOT NULL THEN
    UPDATE subscriptions
    SET user_id = user_uuid
    WHERE stripe_customer_id = customer_id AND user_id IS NULL;
  END IF;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update existing subscriptions to link with users
UPDATE subscriptions 
SET user_id = profiles.id
FROM profiles
WHERE subscriptions.user_id IS NULL 
  AND profiles.email IN (
    SELECT email FROM profiles 
    WHERE profiles.id IS NOT NULL
  );