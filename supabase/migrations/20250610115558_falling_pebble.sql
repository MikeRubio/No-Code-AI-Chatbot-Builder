/*
  # Add increment_message_count function

  This migration adds a database function to safely increment the message count
  in conversation_logs table.
*/

-- Create function to safely increment message count
CREATE OR REPLACE FUNCTION increment_message_count(conv_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the message count in conversation_logs
  UPDATE conversation_logs
  SET total_messages = total_messages + 1
  WHERE conversation_id = conv_id;
  
  -- If no row was updated, it might not exist yet, so we don't need to do anything
  -- The conversation_logs table will be populated when the conversation starts
END;
$$ LANGUAGE plpgsql;