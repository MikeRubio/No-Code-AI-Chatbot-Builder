/*
  # Add increment message count function

  1. New Functions
    - `increment_message_count` - Safely increments the total_messages count in conversation_logs
  
  2. Security
    - Function is accessible to authenticated users and service role
*/

CREATE OR REPLACE FUNCTION increment_message_count(conv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversation_logs 
  SET total_messages = COALESCE(total_messages, 0) + 1,
      updated_at = now()
  WHERE conversation_id = conv_id;
  
  -- If no row was updated, it means the conversation log doesn't exist yet
  -- This is handled by the conversation-logger edge function
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION increment_message_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_message_count(uuid) TO service_role;