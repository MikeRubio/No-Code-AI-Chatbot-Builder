import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration missing. Please check your environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "botforge-web",
    },
  },
});

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: "free" | "pro" | "enterprise";
          subscription_id: string | null;
          subscription_status: string;
          message_quota: number;
          messages_used: number;
          quota_reset_date: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "enterprise";
          subscription_id?: string | null;
          subscription_status?: string;
          message_quota?: number;
          messages_used?: number;
          quota_reset_date?: string;
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "enterprise";
          subscription_id?: string | null;
          subscription_status?: string;
          message_quota?: number;
          messages_used?: number;
          quota_reset_date?: string;
          onboarding_completed?: boolean;
        };
      };
      chatbots: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          flow_data: any;
          settings: any;
          is_active: boolean;
          is_published: boolean;
          whatsapp_phone_number: string | null;
          whatsapp_webhook_url: string | null;
          openai_model: string;
          fallback_message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          flow_data?: any;
          settings?: any;
          is_active?: boolean;
          is_published?: boolean;
          whatsapp_phone_number?: string | null;
          whatsapp_webhook_url?: string | null;
          openai_model?: string;
          fallback_message?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          flow_data?: any;
          settings?: any;
          is_active?: boolean;
          is_published?: boolean;
          whatsapp_phone_number?: string | null;
          whatsapp_webhook_url?: string | null;
          openai_model?: string;
          fallback_message?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          chatbot_id: string;
          user_identifier: string;
          platform: "web" | "whatsapp";
          status:
            | "active"
            | "completed"
            | "abandoned"
            | "transferred"
            | "error";
          satisfaction_rating: number | null;
          goal_completed: boolean;
          human_handoff: boolean;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          chatbot_id: string;
          user_identifier: string;
          platform?: "web" | "whatsapp";
          status?:
            | "active"
            | "completed"
            | "abandoned"
            | "transferred"
            | "error";
          satisfaction_rating?: number | null;
          goal_completed?: boolean;
          human_handoff?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          status?:
            | "active"
            | "completed"
            | "abandoned"
            | "transferred"
            | "error";
          satisfaction_rating?: number | null;
          goal_completed?: boolean;
          human_handoff?: boolean;
          ended_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender: "user" | "bot";
          content: string;
          message_type: "text" | "image" | "file" | "quick_reply";
          node_id: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender: "user" | "bot";
          content: string;
          message_type?: "text" | "image" | "file" | "quick_reply";
          node_id?: string | null;
          metadata?: any;
        };
        Update: {
          content?: string;
          message_type?: "text" | "image" | "file" | "quick_reply";
          node_id?: string | null;
          metadata?: any;
        };
      };
      faq_documents: {
        Row: {
          id: string;
          chatbot_id: string;
          filename: string;
          file_type: string;
          file_size: number;
          content: string | null;
          processing_status: "pending" | "processing" | "completed" | "failed";
          error_message: string | null;
          uploaded_at: string;
          processed_at: string | null;
        };
        Insert: {
          chatbot_id: string;
          filename: string;
          file_type: string;
          file_size: number;
          content?: string | null;
          processing_status?: "pending" | "processing" | "completed" | "failed";
          error_message?: string | null;
        };
        Update: {
          content?: string | null;
          processing_status?: "pending" | "processing" | "completed" | "failed";
          error_message?: string | null;
          processed_at?: string | null;
        };
      };
      faq_entries: {
        Row: {
          id: string;
          document_id: string;
          chatbot_id: string;
          question: string;
          answer: string;
          keywords: string[];
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          document_id: string;
          chatbot_id: string;
          question: string;
          answer: string;
          keywords?: string[];
          embedding?: number[] | null;
        };
        Update: {
          question?: string;
          answer?: string;
          keywords?: string[];
          embedding?: number[] | null;
        };
      };
      analytics: {
        Row: {
          id: string;
          chatbot_id: string;
          date: string;
          total_conversations: number;
          active_users: number;
          messages_sent: number;
          messages_received: number;
          goal_completions: number;
          satisfaction_avg: number | null;
          fallback_rate: number | null;
          human_handoff_rate: number | null;
          created_at: string;
        };
        Insert: {
          chatbot_id: string;
          date: string;
          total_conversations?: number;
          active_users?: number;
          messages_sent?: number;
          messages_received?: number;
          goal_completions?: number;
          satisfaction_avg?: number | null;
          fallback_rate?: number | null;
          human_handoff_rate?: number | null;
        };
        Update: {
          total_conversations?: number;
          active_users?: number;
          messages_sent?: number;
          messages_received?: number;
          goal_completions?: number;
          satisfaction_avg?: number | null;
          fallback_rate?: number | null;
          human_handoff_rate?: number | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          plan: "free" | "pro" | "enterprise";
          status: "active" | "canceled" | "past_due" | "unpaid";
          current_period_start: string | null;
          current_period_end: string | null;
          trial_start: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          plan: "free" | "pro" | "enterprise";
          status: "active" | "canceled" | "past_due" | "unpaid";
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
        };
        Update: {
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          plan?: "free" | "pro" | "enterprise";
          status?: "active" | "canceled" | "past_due" | "unpaid";
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
        };
      };
      conversation_logs: {
        Row: {
          id: string;
          conversation_id: string;
          chatbot_id: string;
          user_identifier: string;
          channel_type: string;
          conversation_start: string;
          conversation_end: string | null;
          total_messages: number;
          outcome: "completed" | "abandoned" | "transferred" | "error" | null;
          satisfaction_score: number | null;
          nps_score: number | null;
          feedback_text: string | null;
          goal_achieved: boolean;
          conversion_value: number | null;
          tags: string[] | null;
          conversation_duration: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          conversation_id: string;
          chatbot_id: string;
          user_identifier: string;
          channel_type?: string;
          conversation_start: string;
          conversation_end?: string | null;
          total_messages?: number;
          outcome?: "completed" | "abandoned" | "transferred" | "error" | null;
          satisfaction_score?: number | null;
          nps_score?: number | null;
          feedback_text?: string | null;
          goal_achieved?: boolean;
          conversion_value?: number | null;
          tags?: string[] | null;
          conversation_duration?: string | null;
          metadata?: any;
        };
        Update: {
          conversation_end?: string | null;
          total_messages?: number;
          outcome?: "completed" | "abandoned" | "transferred" | "error" | null;
          satisfaction_score?: number | null;
          nps_score?: number | null;
          feedback_text?: string | null;
          goal_achieved?: boolean;
          conversion_value?: number | null;
          tags?: string[] | null;
          conversation_duration?: string | null;
          metadata?: any;
        };
      };
    };
  };
};
