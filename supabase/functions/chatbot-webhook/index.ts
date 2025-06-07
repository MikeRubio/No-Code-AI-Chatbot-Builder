import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const from = formData.get('From')?.toString()
    const body = formData.get('Body')?.toString()
    const to = formData.get('To')?.toString()

    if (!from || !body || !to) {
      throw new Error('Missing required webhook parameters')
    }

    // Find chatbot by WhatsApp phone number
    const { data: chatbot, error: botError } = await supabaseClient
      .from('chatbots')
      .select('*')
      .eq('whatsapp_phone_number', to)
      .eq('is_published', true)
      .single()

    if (botError || !chatbot) {
      throw new Error('Chatbot not found for this phone number')
    }

    // Find or create conversation
    let { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('chatbot_id', chatbot.id)
      .eq('user_identifier', from)
      .eq('platform', 'whatsapp')
      .eq('status', 'active')
      .single()

    if (convError || !conversation) {
      // Create new conversation
      const { data: newConv, error: newConvError } = await supabaseClient
        .from('conversations')
        .insert({
          chatbot_id: chatbot.id,
          user_identifier: from,
          platform: 'whatsapp',
          status: 'active'
        })
        .select()
        .single()

      if (newConvError) throw newConvError
      conversation = newConv
    }

    // Save user message
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'user',
        content: body,
        message_type: 'text'
      })

    // Process message through chatbot flow
    const response = await processMessage(chatbot, body, conversation.id, supabaseClient)

    // Save bot response
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'bot',
        content: response.message,
        message_type: 'text',
        node_id: response.nodeId
      })

    // Send response via Twilio
    const twilioResponse = await sendWhatsAppMessage(to, from, response.message)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function processMessage(chatbot: any, userMessage: string, conversationId: string, supabase: any) {
  const flow = chatbot.flow_data
  
  // Simple flow processing - start with first node or find appropriate response
  let currentNode = flow.nodes.find((node: any) => node.type === 'start')
  
  if (!currentNode) {
    currentNode = flow.nodes[0] // Fallback to first node
  }

  // Process based on node type
  switch (currentNode?.type) {
    case 'message':
      return {
        message: currentNode.data.content || 'Hello! How can I help you?',
        nodeId: currentNode.id
      }
    
    case 'ai_response':
      // Call OpenAI for AI response
      const aiResponse = await generateAIResponse(userMessage, chatbot)
      return {
        message: aiResponse,
        nodeId: currentNode.id
      }
    
    default:
      return {
        message: chatbot.fallback_message || "I'm sorry, I didn't understand that.",
        nodeId: null
      }
  }
}

async function generateAIResponse(userMessage: string, chatbot: any) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    return "I'm sorry, AI responses are not available right now."
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chatbot.openai_model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for ${chatbot.name}. ${chatbot.description || ''}`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
  } catch (error) {
    console.error('OpenAI API error:', error)
    return "I'm sorry, I'm having trouble responding right now."
  }
}

async function sendWhatsAppMessage(from: string, to: string, message: string) {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  
  if (!twilioSid || !twilioToken) {
    throw new Error('Twilio credentials not configured')
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: message,
    }),
  })

  return response.json()
}