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
    // Create Supabase client with service role key for full database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { channelId } = await req.json()

    if (!channelId) {
      throw new Error('Channel ID is required')
    }

    // Get channel details
    const { data: channelData, error: channelError } = await supabaseClient
      .from('deployment_channels')
      .select('*')
      .eq('id', channelId)
      .single()

    if (channelError) {
      console.error('Channel fetch error:', channelError)
      throw new Error(`Failed to fetch channel: ${channelError.message}`)
    }

    if (!channelData) {
      throw new Error('Channel not found')
    }

    const channel = channelData

    let deploymentUrl = ''
    let webhookUrl = ''

    // Handle different channel types
    switch (channel.channel_type) {
      case 'web':
        // For web widget, generate embed code and deployment URL
        const widgetConfig = channel.channel_config
        const embedCode = generateWebWidgetEmbedCode(channel.chatbot_id, widgetConfig)
        
        // In a real implementation, you might store this in a CDN or static hosting
        deploymentUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/web-widget/${channel.chatbot_id}`
        
        // Store the embed code in the channel config
        const { error: updateError } = await supabaseClient
          .from('deployment_channels')
          .update({
            channel_config: {
              ...widgetConfig,
              embed_code: embedCode,
              deployment_url: deploymentUrl
            }
          })
          .eq('id', channelId)
        
        if (updateError) {
          console.error('Channel update error:', updateError)
          throw new Error(`Failed to update channel: ${updateError.message}`)
        }
        
        break

      case 'whatsapp':
        // Generate webhook URL for WhatsApp
        webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/chatbot-webhook?channel=${channelId}`
        deploymentUrl = `https://business.facebook.com/wa/manage/phone-numbers/`
        break

      case 'facebook':
        // Generate webhook URL for Facebook Messenger
        webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/chatbot-webhook?channel=${channelId}`
        deploymentUrl = `https://developers.facebook.com/apps/`
        break

      case 'telegram':
        // Generate webhook URL for Telegram
        webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/chatbot-webhook?channel=${channelId}`
        deploymentUrl = `https://t.me/BotFather`
        break

      case 'sms':
        // Generate webhook URL for SMS
        webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/chatbot-webhook?channel=${channelId}`
        deploymentUrl = `https://console.twilio.com/`
        break

      default:
        throw new Error(`Unsupported channel type: ${channel.channel_type}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        deploymentUrl,
        webhookUrl,
        message: `${channel.channel_type} channel deployed successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Deploy channel error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateWebWidgetEmbedCode(chatbotId: string, config: any): string {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://your-project.supabase.co'
  
  return `<!-- Chatbot Widget -->
<div id="chatbot-widget-${chatbotId}"></div>
<script>
  (function() {
    var chatbotConfig = {
      chatbotId: '${chatbotId}',
      position: '${config.widget_position || 'bottom-right'}',
      color: '${config.widget_color || '#3B82F6'}',
      welcomeMessage: '${config.welcome_message || 'Hello! How can I help you?'}',
      placeholderText: '${config.placeholder_text || 'Type your message...'}',
      apiUrl: '${baseUrl}/functions/v1/chatbot-webhook'
    };
    
    var script = document.createElement('script');
    script.src = '${baseUrl}/functions/v1/web-widget-loader';
    script.async = true;
    script.onload = function() {
      if (window.ChatbotWidget) {
        window.ChatbotWidget.init(chatbotConfig);
      }
    };
    document.head.appendChild(script);
  })();
</script>`
}