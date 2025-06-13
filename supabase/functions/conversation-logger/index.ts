import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ConversationEvent {
  type: 'start' | 'end' | 'message' | 'feedback' | 'goal_achieved' | 'handoff_requested'
  conversation_id: string
  chatbot_id: string
  user_identifier: string
  channel_type?: string
  outcome?: string | null
  data?: any
  sessionId?: string
  userAgent?: string
  deviceInfo?: any
  geolocation?: any
  timestamp?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const eventData: ConversationEvent = await req.json()
    
    console.log('Processing conversation event:', eventData.type, eventData.conversation_id)

    switch (eventData.type) {
      case 'start':
        await handleConversationStart(supabaseClient, eventData)
        break
      case 'end':
        await handleConversationEnd(supabaseClient, eventData)
        break
      case 'message':
        await handleMessage(supabaseClient, eventData)
        break
      case 'feedback':
        await handleFeedback(supabaseClient, eventData)
        break
      case 'goal_achieved':
        await handleGoalAchieved(supabaseClient, eventData)
        break
      case 'handoff_requested':
        await handleHandoffRequested(supabaseClient, eventData)
        break
      default:
        throw new Error(`Unknown event type: ${eventData.type}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing conversation event:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process conversation event',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function handleConversationStart(supabaseClient: any, eventData: ConversationEvent) {
  // First, create conversation record
  const { error: conversationError } = await supabaseClient
    .from('conversations')
    .insert({
      id: eventData.conversation_id,
      chatbot_id: eventData.chatbot_id,
      user_identifier: eventData.user_identifier,
      platform: eventData.channel_type || 'web',
      channel_type: eventData.channel_type || 'web',
      status: 'active',
      session_data: {
        sessionId: eventData.sessionId,
        userAgent: eventData.userAgent,
        deviceInfo: eventData.deviceInfo,
        geolocation: eventData.geolocation,
        ...eventData.data
      }
    })

  if (conversationError) {
    console.error('Failed to create conversation:', conversationError)
    throw new Error(`Failed to create conversation: ${conversationError.message}`)
  }

  console.log('Conversation created successfully:', eventData.conversation_id)

  // The conversation_logs entry should be created automatically by the database trigger
  // Let's verify it was created correctly
  const { data: logData, error: logCheckError } = await supabaseClient
    .from('conversation_logs')
    .select('*')
    .eq('conversation_id', eventData.conversation_id)
    .single()

  if (logCheckError) {
    console.error('Failed to verify conversation log creation:', logCheckError)
    
    // If the trigger didn't create the log, create it manually
    const { error: manualLogError } = await supabaseClient
      .from('conversation_logs')
      .insert({
        conversation_id: eventData.conversation_id,
        chatbot_id: eventData.chatbot_id,
        user_identifier: eventData.user_identifier,
        channel_type: eventData.channel_type || 'web',
        conversation_start: new Date().toISOString(),
        total_messages: 0,
        outcome: null, // Explicitly set to null for active conversations
        goal_achieved: false,
        metadata: {
          sessionId: eventData.sessionId,
          userAgent: eventData.userAgent,
          deviceInfo: eventData.deviceInfo,
          geolocation: eventData.geolocation,
          ...eventData.data
        }
      })

    if (manualLogError) {
      console.error('Failed to manually create conversation log:', manualLogError)
      throw new Error(`Failed to create conversation log: ${manualLogError.message}`)
    }
  } else {
    console.log('Conversation log created by trigger:', logData.id)
  }

  console.log('Conversation started successfully:', eventData.conversation_id)
}

async function handleConversationEnd(supabaseClient: any, eventData: ConversationEvent) {
  // Update conversation status
  const { error: conversationError } = await supabaseClient
    .from('conversations')
    .update({
      status: eventData.outcome === 'completed' ? 'completed' : 'abandoned',
      ended_at: new Date().toISOString(),
      satisfaction_rating: eventData.data?.satisfactionScore,
      goal_completed: eventData.data?.goalAchieved || false
    })
    .eq('id', eventData.conversation_id)

  if (conversationError) {
    console.error('Failed to update conversation:', conversationError)
  }

  // Update conversation log with proper outcome
  const validOutcome = eventData.outcome || 'abandoned'
  const { error: logError } = await supabaseClient
    .from('conversation_logs')
    .update({
      conversation_end: new Date().toISOString(),
      outcome: validOutcome,
      satisfaction_score: eventData.data?.satisfactionScore,
      feedback_text: eventData.data?.feedbackText,
      goal_achieved: eventData.data?.goalAchieved || false,
      conversion_value: eventData.data?.conversionValue,
      total_messages: eventData.data?.messageCount || 0,
      metadata: {
        ...eventData.data
      }
    })
    .eq('conversation_id', eventData.conversation_id)

  if (logError) {
    console.error('Failed to update conversation log:', logError)
  }

  console.log('Conversation ended successfully:', eventData.conversation_id)
}

async function handleMessage(supabaseClient: any, eventData: ConversationEvent) {
  // Insert message record
  const { error: messageError } = await supabaseClient
    .from('messages')
    .insert({
      conversation_id: eventData.conversation_id,
      sender: eventData.data.sender,
      content: eventData.data.content,
      message_type: eventData.data.message_type,
      node_id: eventData.data.node_id,
      metadata: eventData.data.metadata
    })

  if (messageError) {
    console.error('Failed to create message:', messageError)
  }

  // Update conversation log message count
  const { error: updateError } = await supabaseClient
    .rpc('increment_message_count', {
      conv_id: eventData.conversation_id
    })

  if (updateError) {
    console.error('Failed to update message count:', updateError)
  }

  console.log('Message logged successfully:', eventData.conversation_id)
}

async function handleFeedback(supabaseClient: any, eventData: ConversationEvent) {
  // Insert feedback record
  const { error: feedbackError } = await supabaseClient
    .from('conversation_feedback')
    .insert({
      conversation_id: eventData.conversation_id,
      chatbot_id: eventData.chatbot_id,
      feedback_type: eventData.data.feedback_type,
      rating_value: eventData.data.rating_value,
      nps_score: eventData.data.nps_score,
      feedback_text: eventData.data.feedback_text,
      feedback_data: eventData.data.feedback_data,
      sentiment: eventData.data.sentiment,
      categories: eventData.data.categories
    })

  if (feedbackError) {
    console.error('Failed to create feedback:', feedbackError)
  }

  console.log('Feedback logged successfully:', eventData.conversation_id)
}

async function handleGoalAchieved(supabaseClient: any, eventData: ConversationEvent) {
  // Update conversation with goal achievement
  const { error: conversationError } = await supabaseClient
    .from('conversations')
    .update({
      goal_completed: true
    })
    .eq('id', eventData.conversation_id)

  if (conversationError) {
    console.error('Failed to update conversation goal:', conversationError)
  }

  // Update conversation log
  const { error: logError } = await supabaseClient
    .from('conversation_logs')
    .update({
      goal_achieved: true,
      conversion_value: eventData.data.goalValue
    })
    .eq('conversation_id', eventData.conversation_id)

  if (logError) {
    console.error('Failed to update conversation log goal:', logError)
  }

  console.log('Goal achievement logged successfully:', eventData.conversation_id)
}

async function handleHandoffRequested(supabaseClient: any, eventData: ConversationEvent) {
  // Create human handoff record
  const { error: handoffError } = await supabaseClient
    .from('human_handoffs')
    .insert({
      chatbot_id: eventData.chatbot_id,
      conversation_id: eventData.conversation_id,
      reason: eventData.data.reason,
      priority: eventData.data.priority,
      status: 'pending'
    })

  if (handoffError) {
    console.error('Failed to create handoff:', handoffError)
  }

  // Update conversation
  const { error: conversationError } = await supabaseClient
    .from('conversations')
    .update({
      human_handoff: true
    })
    .eq('id', eventData.conversation_id)

  if (conversationError) {
    console.error('Failed to update conversation handoff:', conversationError)
  }

  console.log('Handoff request logged successfully:', eventData.conversation_id)
}