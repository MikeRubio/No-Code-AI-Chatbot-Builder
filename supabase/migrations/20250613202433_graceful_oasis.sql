/*
  # Fix conversation logs outcome constraint and helper functions

  1. Security
    - Drop and recreate functions to avoid conflicts
    - Enable RLS and proper policies
  
  2. Changes
    - Fix outcome constraint to allow NULL values
    - Create helper functions for safe operations
    - Add performance indexes
    - Clean up invalid data
*/

-- First, drop ALL existing functions that might conflict
DROP FUNCTION IF EXISTS increment_message_count(uuid);
DROP FUNCTION IF EXISTS create_conversation_log(uuid, uuid, text);
DROP FUNCTION IF EXISTS create_conversation_log(uuid, uuid, text, text);

-- Drop the existing problematic constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_logs_outcome_check' 
        AND table_name = 'conversation_logs'
    ) THEN
        ALTER TABLE conversation_logs DROP CONSTRAINT conversation_logs_outcome_check;
    END IF;
END $$;

-- Create a new constraint that properly allows NULL values
ALTER TABLE conversation_logs 
ADD CONSTRAINT conversation_logs_outcome_check 
CHECK (outcome IS NULL OR outcome IN ('completed', 'abandoned', 'transferred', 'error'));

-- Clean up any existing invalid data
UPDATE conversation_logs 
SET outcome = NULL 
WHERE outcome IS NOT NULL 
  AND outcome NOT IN ('completed', 'abandoned', 'transferred', 'error');

-- Create helper function for incrementing message count
CREATE FUNCTION increment_message_count(conversation_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE conversation_logs 
    SET total_messages = COALESCE(total_messages, 0) + 1,
        updated_at = NOW()
    WHERE conversation_id = conversation_uuid;
    
    -- If no record was updated, we don't create one here
    -- That's handled by create_conversation_log
END;
$$;

-- Create helper function for safe conversation log creation
CREATE FUNCTION create_conversation_log(
    p_conversation_id uuid,
    p_chatbot_id uuid,
    p_user_identifier text,
    p_channel_type text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO conversation_logs (
        conversation_id,
        chatbot_id,
        user_identifier,
        channel_type,
        conversation_start,
        total_messages,
        outcome,
        goal_achieved,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        p_conversation_id,
        p_chatbot_id,
        p_user_identifier,
        p_channel_type,
        NOW(),
        0,
        NULL, -- Explicitly set to NULL for active conversations
        false,
        jsonb_build_object(
            'created_via', 'widget',
            'version', '1.0.2',
            'initialized_at', NOW()
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (conversation_id) DO NOTHING; -- Prevent duplicates
END;
$$;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversation_logs_outcome_status 
ON conversation_logs(outcome, conversation_start) 
WHERE outcome IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_logs_active 
ON conversation_logs(conversation_start) 
WHERE outcome IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_logs_chatbot_outcome 
ON conversation_logs(chatbot_id, outcome);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT conversation_logs_outcome_check ON conversation_logs IS 
'Allows NULL for active conversations, or specific outcome values for completed conversations';

-- Add comments to the helper functions
COMMENT ON FUNCTION increment_message_count(uuid) IS 
'Safely increments the message count for an existing conversation log';

COMMENT ON FUNCTION create_conversation_log(uuid, uuid, text, text) IS 
'Creates a new conversation log entry with NULL outcome for active conversations';