/*
  # Advanced Chatbot Builder Features

  1. New Tables
    - `conditional_logic` - For conditional logic nodes
    - `api_integrations` - For API/webhook configurations
    - `file_uploads` - For file upload/download nodes
    - `surveys` - For survey/feedback nodes
    - `ab_tests` - For A/B testing functionality
    - `human_handoffs` - For live agent transfers
    - `deployment_channels` - For multi-channel deployment
    - `funnel_analytics` - For advanced analytics

  2. Enhanced Tables
    - Add new node types to existing flow structure
    - Add A/B testing fields to chatbots
    - Add advanced analytics fields

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user access
*/

-- Conditional Logic table for if/else flows
CREATE TABLE IF NOT EXISTS conditional_logic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  conditions jsonb NOT NULL, -- Array of condition objects
  created_at timestamptz DEFAULT now()
);

-- API Integrations table for webhook/API nodes
CREATE TABLE IF NOT EXISTS api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  name text NOT NULL,
  endpoint_url text NOT NULL,
  method text DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
  headers jsonb DEFAULT '{}',
  auth_type text DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'api_key', 'basic')),
  auth_config jsonb DEFAULT '{}',
  request_template jsonb DEFAULT '{}',
  response_mapping jsonb DEFAULT '{}',
  timeout_seconds integer DEFAULT 30,
  retry_attempts integer DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- File Uploads table for file handling nodes
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  node_id text,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  upload_url text,
  download_url text,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Surveys table for feedback collection
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL, -- Array of question objects
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Survey Responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  responses jsonb NOT NULL, -- User responses to questions
  nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  completed_at timestamptz DEFAULT now()
);

-- A/B Tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  variant_a_flow jsonb NOT NULL,
  variant_b_flow jsonb NOT NULL,
  traffic_split numeric(3,2) DEFAULT 0.5 CHECK (traffic_split BETWEEN 0 AND 1),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  start_date timestamptz,
  end_date timestamptz,
  goal_metric text DEFAULT 'conversion_rate',
  goal_target numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- A/B Test Results table
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES ab_tests(id) ON DELETE CASCADE NOT NULL,
  variant text NOT NULL CHECK (variant IN ('A', 'B')),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  goal_achieved boolean DEFAULT false,
  conversion_value numeric(10,2),
  session_duration integer, -- in seconds
  created_at timestamptz DEFAULT now()
);

-- Human Handoffs table
CREATE TABLE IF NOT EXISTS human_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  node_id text,
  reason text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'escalated')),
  assigned_agent_id text,
  assigned_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  customer_satisfaction integer CHECK (customer_satisfaction BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- Deployment Channels table
CREATE TABLE IF NOT EXISTS deployment_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('web', 'whatsapp', 'facebook', 'telegram', 'sms', 'slack')),
  channel_config jsonb NOT NULL,
  is_active boolean DEFAULT false,
  deployment_url text,
  webhook_url text,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Funnel Analytics table for advanced analytics
CREATE TABLE IF NOT EXISTS funnel_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  funnel_name text NOT NULL,
  steps jsonb NOT NULL, -- Array of step definitions
  date date NOT NULL,
  step_data jsonb NOT NULL, -- Conversion data for each step
  created_at timestamptz DEFAULT now(),
  UNIQUE(chatbot_id, funnel_name, date)
);

-- User Journey Heatmaps table
CREATE TABLE IF NOT EXISTS user_journey_heatmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  date date NOT NULL,
  visits integer DEFAULT 0,
  exits integer DEFAULT 0,
  avg_time_spent integer DEFAULT 0, -- in seconds
  bounce_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(chatbot_id, node_id, date)
);

-- Add new columns to existing tables
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS ab_test_id uuid REFERENCES ab_tests(id);
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0';
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS parent_bot_id uuid REFERENCES chatbots(id);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ab_test_variant text CHECK (ab_test_variant IN ('A', 'B'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_type text DEFAULT 'web';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS session_data jsonb DEFAULT '{}';

-- Enable Row Level Security on new tables
ALTER TABLE conditional_logic ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_heatmaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conditional_logic
CREATE POLICY "Users can manage conditional logic for their chatbots"
  ON conditional_logic FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for api_integrations
CREATE POLICY "Users can manage API integrations for their chatbots"
  ON api_integrations FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for file_uploads
CREATE POLICY "Users can manage file uploads for their chatbots"
  ON file_uploads FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for surveys
CREATE POLICY "Users can manage surveys for their chatbots"
  ON surveys FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for survey_responses
CREATE POLICY "Users can read survey responses for their chatbots"
  ON survey_responses FOR SELECT
  TO authenticated
  USING (
    survey_id IN (
      SELECT s.id FROM surveys s
      JOIN chatbots cb ON s.chatbot_id = cb.id
      WHERE cb.user_id = auth.uid()
    )
  );

-- RLS Policies for ab_tests
CREATE POLICY "Users can manage A/B tests for their chatbots"
  ON ab_tests FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ab_test_results
CREATE POLICY "Users can read A/B test results for their tests"
  ON ab_test_results FOR SELECT
  TO authenticated
  USING (
    test_id IN (
      SELECT t.id FROM ab_tests t
      JOIN chatbots cb ON t.chatbot_id = cb.id
      WHERE cb.user_id = auth.uid()
    )
  );

-- RLS Policies for human_handoffs
CREATE POLICY "Users can manage human handoffs for their chatbots"
  ON human_handoffs FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for deployment_channels
CREATE POLICY "Users can manage deployment channels for their chatbots"
  ON deployment_channels FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for funnel_analytics
CREATE POLICY "Users can read funnel analytics for their chatbots"
  ON funnel_analytics FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for user_journey_heatmaps
CREATE POLICY "Users can read user journey heatmaps for their chatbots"
  ON user_journey_heatmaps FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conditional_logic_chatbot_id ON conditional_logic(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_chatbot_id ON api_integrations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_chatbot_id ON file_uploads(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_conversation_id ON file_uploads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_surveys_chatbot_id ON surveys(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_chatbot_id ON ab_tests(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_human_handoffs_chatbot_id ON human_handoffs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_human_handoffs_status ON human_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_deployment_channels_chatbot_id ON deployment_channels(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_chatbot_date ON funnel_analytics(chatbot_id, date);
CREATE INDEX IF NOT EXISTS idx_user_journey_heatmaps_chatbot_date ON user_journey_heatmaps(chatbot_id, date);

-- Create triggers for updated_at
CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_channels_updated_at
  BEFORE UPDATE ON deployment_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();