import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ConversationEvent {
  type: 'message' | 'feedback' | 'start' | 'end';
  chatbot_id: string;
  conversation_id?: string;
  user_identifier: string;
  channel_type?: string;
  data?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const event: ConversationEvent = await req.json();
    console.log('Processing conversation event:', event.type, event.chatbot_id);

    switch (event.type) {
      case 'message':
        await handleMessageEvent(supabase, event);
        break;
      case 'feedback':
        await handleFeedbackEvent(supabase, event);
        break;
      case 'start':
        await handleStartEvent(supabase, event);
        break;
      case 'end':
        await handleEndEvent(supabase, event);
        break;
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing conversation event:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process conversation event',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleMessageEvent(supabase: any, event: ConversationEvent) {
  // Check if conversation exists
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', event.conversation_id)
    .single();

  if (convError && convError.code !== 'PGRST116') {
    throw new Error(`Failed to check conversation: ${convError.message}`);
  }

  // Create conversation if it doesn't exist
  if (!conversation) {
    const { error: createError } = await supabase
      .from('conversations')
      .insert({
        id: event.conversation_id,
        chatbot_id: event.chatbot_id,
        user_identifier: event.user_identifier,
        channel_type: event.channel_type || 'web',
        status: 'active'
      });

    if (createError) {
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }

    // Create conversation log entry
    const { error: logError } = await supabase
      .from('conversation_logs')
      .insert({
        conversation_id: event.conversation_id,
        chatbot_id: event.chatbot_id,
        user_identifier: event.user_identifier,
        channel_type: event.channel_type || 'web',
        conversation_start: new Date().toISOString(),
        total_messages: 0,
        outcome: null, // Will be set when conversation ends
        goal_achieved: false,
        metadata: {}
      });

    if (logError) {
      throw new Error(`Failed to create conversation log: ${logError.message}`);
    }
  }

  // Insert message
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: event.conversation_id,
      sender: event.data.sender,
      content: event.data.content,
      message_type: event.data.message_type || 'text',
      node_id: event.data.node_id,
      metadata: event.data.metadata || {}
    });

  if (messageError) {
    throw new Error(`Failed to insert message: ${messageError.message}`);
  }
}

async function handleFeedbackEvent(supabase: any, event: ConversationEvent) {
  const { error } = await supabase
    .from('conversation_feedback')
    .insert({
      conversation_id: event.conversation_id,
      chatbot_id: event.chatbot_id,
      feedback_type: event.data.feedback_type,
      rating_value: event.data.rating_value,
      nps_score: event.data.nps_score,
      feedback_text: event.data.feedback_text,
      feedback_data: event.data.feedback_data,
      sentiment: event.data.sentiment,
      categories: event.data.categories
    });

  if (error) {
    throw new Error(`Failed to insert feedback: ${error.message}`);
  }
}

async function handleStartEvent(supabase: any, event: ConversationEvent) {
  // Create conversation
  const { error: convError } = await supabase
    .from('conversations')
    .insert({
      id: event.conversation_id,
      chatbot_id: event.chatbot_id,
      user_identifier: event.user_identifier,
      channel_type: event.channel_type || 'web',
      status: 'active',
      session_data: event.data || {}
    });

  if (convError) {
    throw new Error(`Failed to create conversation: ${convError.message}`);
  }

  // Create conversation log entry
  const { error: logError } = await supabase
    .from('conversation_logs')
    .insert({
      conversation_id: event.conversation_id,
      chatbot_id: event.chatbot_id,
      user_identifier: event.user_identifier,
      channel_type: event.channel_type || 'web',
      conversation_start: new Date().toISOString(),
      total_messages: 0,
      outcome: null, // Will be set when conversation ends
      goal_achieved: false,
      metadata: event.data || {}
    });

  if (logError) {
    throw new Error(`Failed to create conversation log: ${logError.message}`);
  }
}

async function handleEndEvent(supabase: any, event: ConversationEvent) {
  // Update conversation
  const { error: convError } = await supabase
    .from('conversations')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      satisfaction_rating: event.data?.satisfactionScore || event.data?.satisfaction_rating,
      goal_completed: event.data?.goalAchieved || event.data?.goal_completed || false,
      human_handoff: event.data?.human_handoff || false
    })
    .eq('id', event.conversation_id);

  if (convError) {
    throw new Error(`Failed to update conversation: ${convError.message}`);
  }

  // Determine outcome based on event data
  let outcome = 'completed';
  if (event.data?.outcome === 'reset' || event.data?.outcome === 'abandoned') {
    outcome = 'abandoned';
  } else if (event.data?.outcome === 'transferred') {
    outcome = 'transferred';
  } else if (event.data?.outcome === 'error') {
    outcome = 'error';
  }

  // Update conversation log
  const { error: logError } = await supabase
    .from('conversation_logs')
    .update({
      conversation_end: new Date().toISOString(),
      outcome: outcome,
      satisfaction_score: event.data?.satisfactionScore || event.data?.satisfaction_rating,
      nps_score: event.data?.nps_score,
      feedback_text: event.data?.feedback_text,
      goal_achieved: event.data?.goalAchieved || event.data?.goal_completed || false,
      conversion_value: event.data?.conversion_value,
      tags: event.data?.tags,
      conversation_duration: event.data?.conversation_duration
    })
    .eq('conversation_id', event.conversation_id);

  if (logError) {
    throw new Error(`Failed to update conversation log: ${logError.message}`);
  }
}