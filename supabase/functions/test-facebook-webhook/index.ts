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

    const { chatbotId, verifyToken, pageAccessToken } = await req.json()

    if (!chatbotId || !verifyToken || !pageAccessToken) {
      throw new Error('Missing required parameters')
    }

    // Test 1: Verify webhook URL accessibility
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-webhook?chatbot=${chatbotId}`
    
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

    // Test 2: Verify Facebook Page Access Token
    try {
      const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${pageAccessToken}`)
      
      if (!pageResponse.ok) {
        const errorData = await pageResponse.json()
        throw new Error(`Facebook API error: ${errorData.error?.message || 'Invalid access token'}`)
      }

      const pageData = await pageResponse.json()
      console.log('Facebook page verified:', pageData.name)
    } catch (error) {
      throw new Error(`Facebook API test failed: ${error.message}`)
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All tests passed successfully',
        chatbot: {
          id: chatbot.id,
          name: chatbot.name,
          published: chatbot.is_published
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Facebook webhook test error:', error)
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