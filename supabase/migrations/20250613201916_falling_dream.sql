/*
  # Fix conversation logs constraint and add helper functions

  1. Database Changes
    - Update conversation_logs outcome constraint to allow NULL values
    - Drop and recreate increment_message_count function with correct signature
    - Clean up any invalid outcome values
    - Add performance indexes

  2. Security
    - Maintain existing RLS policies
    - Use SECURITY DEFINER for helper functions
*/

-- Update the check constraint to allow null values for outcome
ALTER TABLE conversation_logs 
DROP CONSTRAINT IF EXISTS conversation_logs_outcome_check;

ALTER TABLE conversation_logs 
ADD CONSTRAINT conversation_logs_outcome_check 
CHECK (outcome IS NULL OR outcome = ANY (ARRAY['completed'::text, 'abandoned'::text, 'transferred'::text, 'error'::text]));

-- Drop existing function if it exists (to avoid return type conflicts)
DROP FUNCTION IF EXISTS increment_message_count(uuid);

-- Create the function with correct signature
CREATE OR REPLACE FUNCTION increment_message_count(conversation_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count integer;
BEGIN
    -- Get current message count for the conversation
    SELECT total_messages INTO current_count
    FROM conversation_logs
    WHERE conversation_id = conversation_uuid;
    
    -- If no record exists, return 1
    IF current_count IS NULL THEN
        RETURN 1;
    END IF;
    
    -- Return incremented count
    RETURN current_count + 1;
END;
$$;

-- Update any existing records that might have invalid outcome values
UPDATE conversation_logs 
SET outcome = NULL 
WHERE outcome IS NOT NULL 
AND outcome NOT IN ('completed', 'abandoned', 'transferred', 'error');

-- Add index for better performance on conversation_id lookups
CREATE INDEX IF NOT EXISTS idx_conversation_logs_conversation_id_outcome 
ON conversation_logs(conversation_id, outcome);

-- Add index for conversation start date queries
CREATE INDEX IF NOT EXISTS idx_conversation_logs_start_date 
ON conversation_logs(conversation_start);

-- Add a helper function to safely create conversation logs
CREATE OR REPLACE FUNCTION create_conversation_log(
    p_conversation_id uuid,
    p_chatbot_id uuid,
    p_user_identifier text,
    p_channel_type text DEFAULT 'web'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id uuid;
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
        metadata
    ) VALUES (
        p_conversation_id,
        p_chatbot_id,
        p_user_identifier,
        p_channel_type,
        now(),
        0,
        NULL, -- Start with NULL outcome
        false,
        '{}'::jsonb
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;