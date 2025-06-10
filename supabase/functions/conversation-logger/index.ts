/*
  # Conversation Logger Edge Function

  This function handles logging of conversation events including:
  - Conversation start/end events
  - Message logging
  - Feedback collection
  - Goal achievements
  - Human handoff requests

  The function processes different event types and stores them in appropriate database tables
  while maintaining data integrity and proper error handling.
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ConversationEvent {
  type: 'start' | 'end' | 'message' | 'feedback' | 'goal_achieved' | 'handoff_requested';
  conversation_id: string;
  chatbot_id: string;
  user_identifier: string;
  channel_type?: string;
  sessionId?: string;
  userAgent?: string;
  deviceInfo?: any;
  geolocation?: any;
  timestamp?: string;
  data?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const event: ConversationEvent = await req.json();
    
    console.log('Processing conversation event:', event.type, event);

    switch (event.type) {
      case 'start':
        await handleConversationStart(supabase, event);
        break;
      case 'end':
        await handleConversationEnd(supabase, event);
        break;
      case 'message':
        await handleMessage(supabase, event);
        break;
      case 'feedback':
        await handleFeedback(supabase, event);
        break;
      case 'goal_achieved':
        await handleGoalAchieved(supabase, event);
        break;
      case 'handoff_requested':
        await handleHandoffRequested(supabase, event);
        break;
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
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
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

async function handleConversationStart(supabase: any, event: ConversationEvent) {
  // First, ensure the conversation exists in the conversations table
  const { data: existingConversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', event.conversation_id)
    .single();

  if (conversationError && conversationError.code === 'PGRST116') {
    // Conversation doesn't exist, create it
    const { error: createError } = await supabase
      .from('conversations')
      .insert({
        id: event.conversation_id,
        chatbot_id: event.chatbot_id,
        user_identifier: event.user_identifier,
        platform: event.channel_type || 'web',
        channel_type: event.channel_type || 'web',
        status: 'active',
        session_data: {
          sessionId: event.sessionId,
          userAgent: event.userAgent,
          deviceInfo: event.deviceInfo,
          geolocation: event.geolocation,
          ...event.data
        }
      });

    if (createError) {
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }
  }

  // Create or update conversation log with 'active' outcome for new conversations
  const { error: logError } = await supabase
    .from('conversation_logs')
    .upsert({
      conversation_id: event.conversation_id,
      chatbot_id: event.chatbot_id,
      user_identifier: event.user_identifier,
      channel_type: event.channel_type || 'web',
      conversation_start: event.timestamp || new Date().toISOString(),
      total_messages: 0,
      outcome: null, // Set to null initially, will be updated when conversation ends
      goal_achieved: false,
      metadata: {
        sessionId: event.sessionId,
        userAgent: event.userAgent,
        deviceInfo: event.deviceInfo,
        geolocation: event.geolocation,
        startData: event.data
      }
    }, {
      onConflict: 'conversation_id'
    });

  if (logError) {
    throw new Error(`Failed to create conversation log: ${logError.message}`);
  }
}

async function handleConversationEnd(supabase: any, event: ConversationEvent) {
  const outcome = event.data?.outcome || 'completed';
  
  // Validate outcome against check constraint
  const validOutcomes = ['completed', 'abandoned', 'transferred', 'error'];
  if (!validOutcomes.includes(outcome)) {
    throw new Error(`Invalid outcome: ${outcome}. Must be one of: ${validOutcomes.join(', ')}`);
  }

  // Update conversation status
  const { error: conversationError } = await supabase
    .from('conversations')
    .update({
      status: outcome === 'completed' ? 'completed' : 'abandoned',
      ended_at: event.timestamp || new Date().toISOString(),
      satisfaction_rating: event.data?.satisfaction_rating,
      goal_completed: event.data?.goal_completed || false,
      human_handoff: event.data?.human_handoff || false
    })
    .eq('id', event.conversation_id);

  if (conversationError) {
    throw new Error(`Failed to update conversation: ${conversationError.message}`);
  }

  // Update conversation log
  const { error: logError } = await supabase
    .from('conversation_logs')
    .update({
      conversation_end: event.timestamp || new Date().toISOString(),
      outcome: outcome,
      satisfaction_score: event.data?.satisfaction_score,
      nps_score: event.data?.nps_score,
      feedback_text: event.data?.feedback_text,
      goal_achieved: event.data?.goal_achieved || false,
      conversion_value: event.data?.conversion_value,
      tags: event.data?.tags,
      conversation_duration: event.data?.duration,
      metadata: {
        ...event.data,
        endTimestamp: event.timestamp
      }
    })
    .eq('conversation_id', event.conversation_id);

  if (logError) {
    throw new Error(`Failed to update conversation log: ${logError.message}`);
  }
}

async function handleMessage(supabase: any, event: ConversationEvent) {
  // Insert message
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: event.conversation_id,
      sender: event.data?.sender || 'user',
      content: event.data?.content || '',
      message_type: event.data?.message_type || 'text',
      node_id: event.data?.node_id,
      metadata: event.data?.metadata || {}
    });

  if (messageError) {
    throw new Error(`Failed to insert message: ${messageError.message}`);
  }

  // Update conversation log message count
  const { error: updateError } = await supabase
    .rpc('increment_message_count', {
      conv_id: event.conversation_id
    });

  if (updateError) {
    console.warn('Failed to update message count:', updateError.message);
  }
}

async function handleFeedback(supabase: any, event: ConversationEvent) {
  const { error: feedbackError } = await supabase
    .from('conversation_feedback')
    .insert({
      conversation_id: event.conversation_id,
      chatbot_id: event.chatbot_id,
      feedback_type: event.data?.feedback_type || 'rating',
      rating_value: event.data?.rating_value,
      nps_score: event.data?.nps_score,
      feedback_text: event.data?.feedback_text,
      feedback_data: event.data?.feedback_data,
      sentiment: event.data?.sentiment,
      categories: event.data?.categories
    });

  if (feedbackError) {
    throw new Error(`Failed to insert feedback: ${feedbackError.message}`);
  }

  // Update conversation log with feedback
  const { error: logError } = await supabase
    .from('conversation_logs')
    .update({
      satisfaction_score: event.data?.rating_value,
      nps_score: event.data?.nps_score,
      feedback_text: event.data?.feedback_text
    })
    .eq('conversation_id', event.conversation_id);

  if (logError) {
    console.warn('Failed to update conversation log with feedback:', logError.message);
  }
}

async function handleGoalAchieved(supabase: any, event: ConversationEvent) {
  // Update conversation
  const { error: conversationError } = await supabase
    .from('conversations')
    .update({
      goal_completed: true
    })
    .eq('id', event.conversation_id);

  if (conversationError) {
    throw new Error(`Failed to update conversation goal: ${conversationError.message}`);
  }

  // Update conversation log
  const { error: logError } = await supabase
    .from('conversation_logs')
    .update({
      goal_achieved: true,
      conversion_value: event.data?.goalValue,
      metadata: {
        goalType: event.data?.goalType,
        goalMetadata: event.data?.goalMetadata
      }
    })
    .eq('conversation_id', event.conversation_id);

  if (logError) {
    throw new Error(`Failed to update conversation log goal: ${logError.message}`);
  }
}

async function handleHandoffRequested(supabase: any, event: ConversationEvent) {
  // Insert human handoff record
  const { error: handoffError } = await supabase
    .from('human_handoffs')
    .insert({
      chatbot_id: event.chatbot_id,
      conversation_id: event.conversation_id,
      reason: event.data?.reason || 'User requested human assistance',
      priority: event.data?.priority || 'medium',
      status: 'pending',
      assigned_agent_id: event.data?.agentId
    });

  if (handoffError) {
    throw new Error(`Failed to create handoff request: ${handoffError.message}`);
  }

  // Update conversation
  const { error: conversationError } = await supabase
    .from('conversations')
    .update({
      human_handoff: true
    })
    .eq('id', event.conversation_id);

  if (conversationError) {
    throw new Error(`Failed to update conversation handoff: ${conversationError.message}`);
  }
}