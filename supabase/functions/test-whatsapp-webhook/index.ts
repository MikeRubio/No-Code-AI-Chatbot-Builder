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

    const { chatbotId, verifyToken, accessToken, phoneNumberId } = await req.json()

    if (!chatbotId || !verifyToken || !accessToken || !phoneNumberId) {
      throw new Error('Missing required parameters')
    }

    // Test 1: Verify webhook URL accessibility
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook?chatbot=${chatbotId}`
    
    try {
      const verifyResponse = await fetch(`${webhookUrl}&hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test_challenge`)
      
      if (verifyResponse.status !== 200) {
        throw new Error(`Webhook verification failed with status: ${verifyResponse.status}`)
      }

      const challengeResponse = await verifyResponse.text()
      if (challengeResponse !== 'test_challenge') {
        throw new Error('Webhook verification challenge failed')
      }
    } catch (error) {
      throw new Error(`Webhook URL test failed: ${error.message}`)
    }

    // Test 2: Verify WhatsApp API access token and phone number
    try {
      const phoneResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`)
      
      if (!phoneResponse.ok) {
        const errorData = await phoneResponse.json()
        throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Invalid access token or phone number ID'}`)
      }

      const phoneData = await phoneResponse.json()
      console.log('WhatsApp phone number verified:', phoneData)
    } catch (error) {
      throw new Error(`WhatsApp API test failed: ${error.message}`)
    }

    // Test 3: Verify chatbot exists and is published
    const { data: chatbot, error: chatbotError } = await supabaseClient
      .from('chatbots')
      .select('id, name, is_published')
      .eq('id', chatbotId)
      .single()

    if (chatbotError || !chatbot) {
      throw new Error('Chatbot not found')
    }

    if (!chatbot.is_published) {
      throw new Error('Chatbot is not published')
    }

    // Test 4: Check if webhook is properly configured in Facebook
    try {
      const webhookResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/webhook?access_token=${accessToken}`)
      
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json()
        console.log('Webhook configuration:', webhookData)
      }
    } catch (error) {
      console.log('Could not verify webhook configuration:', error.message)
      // This is not a critical error, so we don't throw
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All tests passed successfully',
        chatbot: {
          id: chatbot.id,
          name: chatbot.name,
          published: chatbot.is_published
        },
        webhook: {
          url: webhookUrl,
          verified: true
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('WhatsApp webhook test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})