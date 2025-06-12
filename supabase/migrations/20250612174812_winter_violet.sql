/*
  # A/B Testing System Improvements

  1. Database Structure Updates
    - Ensure ab_tests table has proper JSONB columns for flow variants
    - Create ab_test_results table for tracking test outcomes
    - Add proper indexes for performance

  2. Security
    - Enable RLS on ab_test_results table
    - Add policies for secure access to test results
    - Grant appropriate permissions

  3. Functions
    - Function to assign users to A/B test variants
    - Function to update test results
    - Proper security and permissions
*/

-- Update ab_tests table structure if needed
DO $$
BEGIN
  -- Check if variant_a_flow column exists and is properly typed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ab_tests' AND column_name = 'variant_a_flow' AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE ab_tests ALTER COLUMN variant_a_flow TYPE jsonb USING variant_a_flow::jsonb;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ab_tests' AND column_name = 'variant_b_flow' AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE ab_tests ALTER COLUMN variant_b_flow TYPE jsonb USING variant_b_flow::jsonb;
  END IF;
END $$;

-- Ensure ab_test_results table exists
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant text NOT NULL CHECK (variant IN ('A', 'B')),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  goal_achieved boolean DEFAULT false,
  conversion_value numeric(10,2),
  session_duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_conversation_id ON ab_test_results(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON ab_test_results(test_id, variant);

-- Enable RLS
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can read A/B test results for their tests" ON ab_test_results;
  DROP POLICY IF EXISTS "System can insert A/B test results" ON ab_test_results;
  DROP POLICY IF EXISTS "System can update A/B test results" ON ab_test_results;
  
  -- Create new policies
  CREATE POLICY "Users can read A/B test results for their tests"
    ON ab_test_results
    FOR SELECT
    TO authenticated
    USING (
      test_id IN (
        SELECT t.id 
        FROM ab_tests t 
        JOIN chatbots cb ON t.chatbot_id = cb.id 
        WHERE cb.user_id = auth.uid()
      )
    );

  CREATE POLICY "System can insert A/B test results"
    ON ab_test_results
    FOR INSERT
    TO authenticated
    WITH CHECK (
      test_id IN (
        SELECT t.id 
        FROM ab_tests t 
        JOIN chatbots cb ON t.chatbot_id = cb.id 
        WHERE cb.user_id = auth.uid()
      )
    );

  CREATE POLICY "System can update A/B test results"
    ON ab_test_results
    FOR UPDATE
    TO authenticated
    USING (
      test_id IN (
        SELECT t.id 
        FROM ab_tests t 
        JOIN chatbots cb ON t.chatbot_id = cb.id 
        WHERE cb.user_id = auth.uid()
      )
    );
END $$;

-- Drop existing functions if they exist and recreate them
DROP FUNCTION IF EXISTS assign_ab_test_variant(uuid, uuid);
DROP FUNCTION IF EXISTS update_ab_test_result(uuid, uuid, boolean, integer, numeric);

-- Function to assign user to A/B test variant
CREATE OR REPLACE FUNCTION assign_ab_test_variant(
  p_chatbot_id uuid,
  p_conversation_id uuid
) RETURNS jsonb AS $$
DECLARE
  active_test ab_tests%ROWTYPE;
  assigned_variant text;
  test_flow jsonb;
  random_value numeric;
BEGIN
  -- Find active A/B test for this chatbot
  SELECT * INTO active_test
  FROM ab_tests
  WHERE chatbot_id = p_chatbot_id
    AND status = 'running'
    AND (end_date IS NULL OR end_date > now())
  LIMIT 1;

  -- If no active test, return null
  IF active_test.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if conversation already has an assignment
  SELECT variant INTO assigned_variant
  FROM ab_test_results
  WHERE test_id = active_test.id
    AND conversation_id = p_conversation_id;

  -- If already assigned, return existing assignment
  IF assigned_variant IS NOT NULL THEN
    test_flow := CASE 
      WHEN assigned_variant = 'A' THEN active_test.variant_a_flow
      ELSE active_test.variant_b_flow
    END;
    
    RETURN jsonb_build_object(
      'test_id', active_test.id,
      'variant', assigned_variant,
      'flow', test_flow
    );
  END IF;

  -- Assign to variant based on traffic split
  random_value := random();
  assigned_variant := CASE 
    WHEN random_value < active_test.traffic_split THEN 'A'
    ELSE 'B'
  END;

  -- Record the assignment
  INSERT INTO ab_test_results (test_id, variant, conversation_id)
  VALUES (active_test.id, assigned_variant, p_conversation_id);

  -- Get the appropriate flow
  test_flow := CASE 
    WHEN assigned_variant = 'A' THEN active_test.variant_a_flow
    ELSE active_test.variant_b_flow
  END;

  RETURN jsonb_build_object(
    'test_id', active_test.id,
    'variant', assigned_variant,
    'flow', test_flow
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update A/B test results
CREATE OR REPLACE FUNCTION update_ab_test_result(
  p_test_id uuid,
  p_conversation_id uuid,
  p_goal_achieved boolean DEFAULT NULL,
  p_session_duration integer DEFAULT NULL,
  p_conversion_value numeric DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE ab_test_results
  SET 
    goal_achieved = COALESCE(p_goal_achieved, goal_achieved),
    session_duration = COALESCE(p_session_duration, session_duration),
    conversion_value = COALESCE(p_conversion_value, conversion_value)
  WHERE test_id = p_test_id
    AND conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_ab_test_variant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_ab_test_result(uuid, uuid, boolean, integer, numeric) TO authenticated;