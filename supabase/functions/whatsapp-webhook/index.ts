import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const chatbotId = url.searchParams.get('chatbot')

    if (!chatbotId) {
      throw new Error('Chatbot ID is required')
    }

    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      if (mode === 'subscribe') {
        // Get the verify token from the database
        const { data: channel, error } = await supabaseClient
          .from('deployment_channels')
          .select('channel_config')
          .eq('chatbot_id', chatbotId)
          .eq('channel_type', 'whatsapp')
          .single()

        if (error || !channel) {
          console.error('WhatsApp channel not found:', error)
          return new Response('Channel not found', { status: 404 })
        }

        const verifyToken = channel.channel_config.webhookVerifyToken

        if (token === verifyToken) {
          console.log('WhatsApp webhook verified successfully')
          return new Response(challenge, { status: 200 })
        } else {
          console.error('WhatsApp verification token mismatch')
          return new Response('Verification token mismatch', { status: 403 })
        }
      }

      return new Response('Invalid request', { status: 400 })
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body = await req.json()

      // Process each entry in the webhook payload
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value
            
            // Handle incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                await handleIncomingMessage(supabaseClient, chatbotId, message, value.metadata)
              }
            }
            
            // Handle message status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                await handleMessageStatus(supabaseClient, status)
              }
            }
          }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200 })
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function handleIncomingMessage(supabase: any, chatbotId: string, message: any, metadata: any) {
  const senderId = message.from
  const messageId = message.id
  const messageType = message.type

  // Only handle text messages for now
  if (messageType !== 'text') {
    console.log(`Skipping ${messageType} message`)
    return
  }

  const messageText = message.text?.body
  if (!messageText) return

  try {
    // Get chatbot configuration
    const { data: chatbot, error: botError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .eq('is_published', true)
      .single()

    if (botError || !chatbot) {
      console.error('Chatbot not found:', botError)
      return
    }

    // Get WhatsApp channel configuration
    const { data: channel, error: channelError } = await supabase
      .from('deployment_channels')
      .select('channel_config')
      .eq('chatbot_id', chatbotId)
      .eq('channel_type', 'whatsapp')
      .single()

    if (channelError || !channel) {
      console.error('WhatsApp channel not found:', channelError)
      return
    }

    const { accessToken, phoneNumberId } = channel.channel_config

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('user_identifier', senderId)
      .eq('channel_type', 'whatsapp')
      .eq('status', 'active')
      .single()

    if (convError || !conversation) {
      // Create new conversation
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          chatbot_id: chatbotId,
          user_identifier: senderId,
          channel_type: 'whatsapp',
          status: 'active'
        })
        .select()
        .single()

      if (newConvError) {
        console.error('Failed to create conversation:', newConvError)
        return
      }
      conversation = newConv
    }

    // Save user message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'user',
        content: messageText,
        message_type: 'text',
        metadata: { 
          whatsapp_message_id: messageId,
          whatsapp_timestamp: message.timestamp,
          phone_number_id: phoneNumberId
        }
      })

    // Process message through chatbot flow
    const response = await processMessage(chatbot, messageText, conversation.id, supabase)

    // Save bot response
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'bot',
        content: response.message,
        message_type: 'text',
        node_id: response.nodeId
      })

    // Send response via WhatsApp
    await sendWhatsAppMessage(senderId, response.message, accessToken, phoneNumberId)

  } catch (error) {
    console.error('Error handling WhatsApp message:', error)
  }
}

async function handleMessageStatus(supabase: any, status: any) {
  // Handle message delivery status updates
  console.log('Message status update:', status)
  
  // You can update message status in your database here
  // For example: delivered, read, failed, etc.
}

async function processMessage(chatbot: any, userMessage: string, conversationId: string, supabase: any) {
  const flow = chatbot.flow_data
  
  // Simple flow processing - start with first node or find appropriate response
  let currentNode = flow.nodes?.find((node: any) => node.data?.nodeType === 'start')
  
  if (!currentNode && flow.nodes?.length > 0) {
    currentNode = flow.nodes[0] // Fallback to first node
  }

  // Process based on node type
  switch (currentNode?.data?.nodeType) {
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
    
    case 'question':
      // Handle question node with options
      const questionText = currentNode.data.content || 'Please choose an option:'
      const options = currentNode.data.options || []
      
      if (options.length > 0) {
        const optionsText = options.map((option: string, index: number) => 
          `${index + 1}. ${option}`
        ).join('\n')
        
        return {
          message: `${questionText}\n\n${optionsText}`,
          nodeId: currentNode.id
        }
      }
      
      return {
        message: questionText,
        nodeId: currentNode.id
      }
    
    default:
      return {
        message: chatbot.fallback_message || "I'm sorry, I didn't understand that. Can you please rephrase?",
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
            content: `You are a helpful assistant for ${chatbot.name}. ${chatbot.description || ''} Keep responses concise and helpful for WhatsApp messaging.`
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

async function sendWhatsAppMessage(recipientId: string, messageText: string, accessToken: string, phoneNumberId: string) {
  const messageData = {
    messaging_product: 'whatsapp',
    to: recipientId,
    type: 'text',
    text: {
      body: messageText
    }
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('WhatsApp API error:', errorData)
      throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()
    console.log('WhatsApp message sent successfully:', result)
    return result
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}