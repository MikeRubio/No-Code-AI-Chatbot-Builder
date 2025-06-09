/*
  # Add unique constraint to subscriptions.user_id

  1. Changes
    - Add unique constraint on `user_id` column in `subscriptions` table
    - This allows upsert operations to work correctly with `onConflict: 'user_id'`

  2. Security
    - No changes to RLS policies needed
    - Maintains existing security model
*/

-- Add unique constraint to user_id column in subscriptions table
-- This allows upsert operations to work correctly
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);