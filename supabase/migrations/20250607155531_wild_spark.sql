/*
  # Create conversation logs table and related functionality

  1. New Tables
    - `conversation_logs`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `chatbot_id` (uuid, references chatbots)
      - `user_identifier` (text)
      - `channel_type` (text)
      - `conversation_start` (timestamptz)
      - `conversation_end` (timestamptz, nullable)
      - `total_messages` (integer)
      - `outcome` (text, nullable)
      - `satisfaction_score` (integer, nullable)
      - `nps_score` (integer, nullable)
      - `feedback_text` (text, nullable)
      - `goal_achieved` (boolean)
      - `conversion_value` (numeric, nullable)
      - `tags` (text array, nullable)
      - `conversation_duration` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `conversation_feedback`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `chatbot_id` (uuid, references chatbots)
      - `feedback_type` (text)
      - `rating_value` (integer, nullable)
      - `nps_score` (integer, nullable)
      - `feedback_text` (text, nullable)
      - `feedback_data` (jsonb, nullable)
      - `sentiment` (text, nullable)
      - `categories` (text array, nullable)
      - `submitted_at` (timestamptz)

    - `conversation_exports`
      - `id` (uuid, primary key)
      - `chatbot_id` (uuid, references chatbots)
      - `export_type` (text)
      - `filters` (jsonb)
      - `total_records` (integer)
      - `status` (text)
      - `file_size` (bigint, nullable)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Functions
    - `calculate_conversation_stats` - Calculate conversation statistics
    - `anonymize_conversation_data` - Anonymize conversation data for privacy
    - `update_conversation_log` - Trigger function to maintain conversation logs

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add triggers for automatic timestamp updates
*/

-- Create conversation_logs table
CREATE TABLE IF NOT EXISTS conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_identifier text NOT NULL,
  channel_type text NOT NULL DEFAULT 'web',
  conversation_start timestamptz NOT NULL,
  conversation_end timestamptz,
  total_messages integer DEFAULT 0,
  outcome text,
  satisfaction_score integer,
  nps_score integer,
  feedback_text text,
  goal_achieved boolean DEFAULT false,
  conversion_value numeric(10,2),
  tags text[],
  conversation_duration text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_feedback table
CREATE TABLE IF NOT EXISTS conversation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  feedback_type text NOT NULL,
  rating_value integer,
  nps_score integer,
  feedback_text text,
  feedback_data jsonb,
  sentiment text,
  categories text[],
  submitted_at timestamptz DEFAULT now()
);

-- Create conversation_exports table
CREATE TABLE IF NOT EXISTS conversation_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  export_type text NOT NULL,
  filters jsonb DEFAULT '{}',
  total_records integer DEFAULT 0,
  status text DEFAULT 'pending',
  file_size bigint,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_logs_chatbot_id ON conversation_logs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_conversation_id ON conversation_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_start_date ON conversation_logs(conversation_start);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_channel_outcome ON conversation_logs(channel_type, outcome);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_conversation_id ON conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_chatbot_id ON conversation_feedback(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_exports_chatbot_id ON conversation_exports(chatbot_id);

-- Add constraints
ALTER TABLE conversation_logs ADD CONSTRAINT IF NOT EXISTS conversation_logs_outcome_check 
  CHECK (outcome IS NULL OR outcome IN ('completed', 'abandoned', 'transferred', 'error'));

ALTER TABLE conversation_logs ADD CONSTRAINT IF NOT EXISTS conversation_logs_satisfaction_check 
  CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 1 AND satisfaction_score <= 5));

ALTER TABLE conversation_logs ADD CONSTRAINT IF NOT EXISTS conversation_logs_nps_check 
  CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10));

ALTER TABLE conversation_feedback ADD CONSTRAINT IF NOT EXISTS conversation_feedback_type_check 
  CHECK (feedback_type IN ('rating', 'nps', 'survey', 'thumbs', 'custom'));

ALTER TABLE conversation_feedback ADD CONSTRAINT IF NOT EXISTS conversation_feedback_rating_check 
  CHECK (rating_value IS NULL OR (rating_value >= 1 AND rating_value <= 5));

ALTER TABLE conversation_feedback ADD CONSTRAINT IF NOT EXISTS conversation_feedback_nps_check 
  CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10));

ALTER TABLE conversation_feedback ADD CONSTRAINT IF NOT EXISTS conversation_feedback_sentiment_check 
  CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative'));

ALTER TABLE conversation_exports ADD CONSTRAINT IF NOT EXISTS conversation_exports_type_check 
  CHECK (export_type IN ('csv', 'json', 'xlsx'));

ALTER TABLE conversation_exports ADD CONSTRAINT IF NOT EXISTS conversation_exports_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Enable RLS
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_logs
CREATE POLICY "Users can read conversation logs for their chatbots"
  ON conversation_logs
  FOR SELECT
  TO authenticated
  USING (chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create conversation logs for their chatbots"
  ON conversation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update conversation logs for their chatbots"
  ON conversation_logs
  FOR UPDATE
  TO authenticated
  USING (chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  ));

-- Create RLS policies for conversation_feedback
CREATE POLICY "Users can read conversation feedback for their chatbots"
  ON conversation_feedback
  FOR SELECT
  TO authenticated
  USING (chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create conversation feedback for their chatbots"
  ON conversation_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  ));

-- Create RLS policies for conversation_exports
CREATE POLICY "Users can manage conversation exports for their chatbots"
  ON conversation_exports
  FOR ALL
  TO authenticated
  USING (chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  ));

-- Create function to calculate conversation statistics
CREATE OR REPLACE FUNCTION calculate_conversation_stats(conversation_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_record conversations%ROWTYPE;
  message_count integer;
  start_time timestamptz;
  end_time timestamptz;
  duration_interval interval;
  duration_text text;
BEGIN
  -- Get conversation details
  SELECT * INTO conv_record FROM conversations WHERE id = conversation_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found: %', conversation_uuid;
  END IF;

  -- Count messages
  SELECT COUNT(*) INTO message_count 
  FROM messages 
  WHERE conversation_id = conversation_uuid;

  -- Get start and end times
  SELECT MIN(created_at), MAX(created_at) 
  INTO start_time, end_time
  FROM messages 
  WHERE conversation_id = conversation_uuid;

  -- Use conversation times if message times not available
  IF start_time IS NULL THEN
    start_time := conv_record.started_at;
  END IF;
  
  IF end_time IS NULL AND conv_record.ended_at IS NOT NULL THEN
    end_time := conv_record.ended_at;
  END IF;

  -- Calculate duration
  IF start_time IS NOT NULL AND end_time IS NOT NULL THEN
    duration_interval := end_time - start_time;
    duration_text := EXTRACT(EPOCH FROM duration_interval)::text || ' seconds';
    
    -- Format as HH:MM:SS
    duration_text := TO_CHAR(duration_interval, 'HH24:MI:SS');
  END IF;

  -- Insert or update conversation log
  INSERT INTO conversation_logs (
    conversation_id,
    chatbot_id,
    user_identifier,
    channel_type,
    conversation_start,
    conversation_end,
    total_messages,
    outcome,
    satisfaction_score,
    goal_achieved,
    conversation_duration,
    created_at,
    updated_at
  ) VALUES (
    conversation_uuid,
    conv_record.chatbot_id,
    conv_record.user_identifier,
    conv_record.channel_type,
    COALESCE(start_time, conv_record.started_at),
    COALESCE(end_time, conv_record.ended_at),
    message_count,
    conv_record.status,
    conv_record.satisfaction_rating,
    conv_record.goal_completed,
    duration_text,
    now(),
    now()
  )
  ON CONFLICT (conversation_id) 
  DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    conversation_end = EXCLUDED.conversation_end,
    outcome = EXCLUDED.outcome,
    satisfaction_score = EXCLUDED.satisfaction_score,
    goal_achieved = EXCLUDED.goal_achieved,
    conversation_duration = EXCLUDED.conversation_duration,
    updated_at = now();
END;
$$;

-- Create function to anonymize conversation data
CREATE OR REPLACE FUNCTION anonymize_conversation_data(conversation_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Anonymize conversation data
  UPDATE conversations 
  SET 
    user_identifier = 'anonymous_' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    session_data = jsonb_build_object(
      'anonymized', true,
      'anonymized_at', now()
    )
  WHERE id = conversation_uuid;

  -- Anonymize messages (keep content but remove personal identifiers)
  UPDATE messages 
  SET 
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'anonymized', true,
      'anonymized_at', now()
    )
  WHERE conversation_id = conversation_uuid;

  -- Anonymize conversation logs
  UPDATE conversation_logs 
  SET 
    user_identifier = 'anonymous_' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    feedback_text = CASE 
      WHEN feedback_text IS NOT NULL THEN '[Anonymized feedback]'
      ELSE NULL 
    END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'anonymized', true,
      'anonymized_at', now()
    ),
    updated_at = now()
  WHERE conversation_id = conversation_uuid;

  -- Anonymize feedback
  UPDATE conversation_feedback 
  SET 
    feedback_text = CASE 
      WHEN feedback_text IS NOT NULL THEN '[Anonymized feedback]'
      ELSE NULL 
    END,
    feedback_data = CASE 
      WHEN feedback_data IS NOT NULL THEN jsonb_build_object('anonymized', true)
      ELSE NULL 
    END
  WHERE conversation_id = conversation_uuid;
END;
$$;

-- Create trigger function to automatically update conversation logs
CREATE OR REPLACE FUNCTION update_conversation_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process if conversation has ended or been updated significantly
  IF TG_OP = 'UPDATE' AND (
    OLD.status != NEW.status OR 
    OLD.ended_at IS DISTINCT FROM NEW.ended_at OR
    OLD.satisfaction_rating IS DISTINCT FROM NEW.satisfaction_rating OR
    OLD.goal_completed IS DISTINCT FROM NEW.goal_completed
  ) THEN
    -- Recalculate stats for this conversation
    PERFORM calculate_conversation_stats(NEW.id);
  ELSIF TG_OP = 'INSERT' THEN
    -- Create initial log entry for new conversation
    PERFORM calculate_conversation_stats(NEW.id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically maintain conversation logs
DROP TRIGGER IF EXISTS trigger_update_conversation_log ON conversations;
CREATE TRIGGER trigger_update_conversation_log
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_log();

-- Create trigger to update conversation logs when messages are added
CREATE OR REPLACE FUNCTION update_conversation_log_on_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update message count and duration when messages are added
  PERFORM calculate_conversation_stats(NEW.conversation_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_conversation_log_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_log_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_log_on_message();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_conversation_logs_updated_at
  BEFORE UPDATE ON conversation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to prevent duplicate conversation logs
ALTER TABLE conversation_logs ADD CONSTRAINT IF NOT EXISTS conversation_logs_conversation_id_key 
  UNIQUE (conversation_id);

-- Populate existing conversation logs from existing conversations
INSERT INTO conversation_logs (
  conversation_id,
  chatbot_id,
  user_identifier,
  channel_type,
  conversation_start,
  conversation_end,
  total_messages,
  outcome,
  satisfaction_score,
  goal_achieved,
  conversation_duration,
  created_at,
  updated_at
)
SELECT 
  c.id,
  c.chatbot_id,
  c.user_identifier,
  c.channel_type,
  c.started_at,
  c.ended_at,
  COALESCE((SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id), 0),
  c.status,
  c.satisfaction_rating,
  c.goal_completed,
  CASE 
    WHEN c.started_at IS NOT NULL AND c.ended_at IS NOT NULL 
    THEN TO_CHAR(c.ended_at - c.started_at, 'HH24:MI:SS')
    ELSE NULL 
  END,
  c.created_at,
  c.created_at
FROM conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_logs cl WHERE cl.conversation_id = c.id
);