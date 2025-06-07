/*
  # Chatbot Builder Database Schema

  1. New Tables
    - `profiles` - User profile information with subscription plans
    - `chatbots` - Chatbot configurations and flow data
    - `conversations` - Chat conversation records
    - `messages` - Individual messages in conversations
    - `faq_documents` - Uploaded FAQ documents
    - `faq_entries` - Parsed FAQ question-answer pairs
    - `analytics` - Daily analytics aggregations
    - `subscriptions` - User subscription management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for chatbot access based on ownership
*/

-- Profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  subscription_id text,
  subscription_status text DEFAULT 'active',
  message_quota integer DEFAULT 100,
  messages_used integer DEFAULT 0,
  quota_reset_date timestamptz DEFAULT (now() + interval '1 month'),
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  flow_data jsonb DEFAULT '{"nodes": [], "connections": []}',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  is_published boolean DEFAULT false,
  whatsapp_phone_number text,
  whatsapp_webhook_url text,
  openai_model text DEFAULT 'gpt-3.5-turbo',
  fallback_message text DEFAULT 'I''m sorry, I didn''t understand that. Can you please rephrase?',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  user_identifier text NOT NULL, -- phone number, session id, etc.
  platform text DEFAULT 'web' CHECK (platform IN ('web', 'whatsapp')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  goal_completed boolean DEFAULT false,
  human_handoff boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'bot')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'quick_reply')),
  node_id text, -- reference to flow node that generated this message
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- FAQ Documents table
CREATE TABLE IF NOT EXISTS faq_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  content text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  uploaded_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- FAQ Entries table (parsed from documents)
CREATE TABLE IF NOT EXISTS faq_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES faq_documents(id) ON DELETE CASCADE NOT NULL,
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[], -- for search optimization
  embedding vector(1536), -- OpenAI embeddings for semantic search
  created_at timestamptz DEFAULT now()
);

-- Analytics table (daily aggregations)
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_conversations integer DEFAULT 0,
  active_users integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  goal_completions integer DEFAULT 0,
  satisfaction_avg numeric(3,2),
  fallback_rate numeric(5,2),
  human_handoff_rate numeric(5,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(chatbot_id, date)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan text NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for chatbots
CREATE POLICY "Users can read own chatbots"
  ON chatbots FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own chatbots"
  ON chatbots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chatbots"
  ON chatbots FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own chatbots"
  ON chatbots FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for conversations
CREATE POLICY "Users can read conversations for their chatbots"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations for their chatbots"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can read messages for their chatbot conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN chatbots cb ON c.chatbot_id = cb.id
      WHERE cb.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their chatbot conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN chatbots cb ON c.chatbot_id = cb.id
      WHERE cb.user_id = auth.uid()
    )
  );

-- RLS Policies for FAQ documents
CREATE POLICY "Users can manage FAQ documents for their chatbots"
  ON faq_documents FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for FAQ entries
CREATE POLICY "Users can read FAQ entries for their chatbots"
  ON faq_entries FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for analytics
CREATE POLICY "Users can read analytics for their chatbots"
  ON analytics FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_faq_entries_chatbot_id ON faq_entries(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_analytics_chatbot_date ON analytics(chatbot_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();