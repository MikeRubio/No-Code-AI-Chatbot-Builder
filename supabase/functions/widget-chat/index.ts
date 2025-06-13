import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  chatbotId: string;
  conversationId?: string;
  message?: string;
  userIdentifier?: string;
  action: 'initialize' | 'send_message' | 'get_flow';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Widget chat request:', requestBody);
    
    const { chatbotId, conversationId, message, userIdentifier, action }: ChatRequest = requestBody;

    if (!chatbotId) {
      console.error('Missing chatbotId in request');
      return new Response(
        JSON.stringify({ error: 'chatbotId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!action) {
      console.error('Missing action in request');
      return new Response(
        JSON.stringify({ error: 'action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'get_flow': {
        console.log('Getting flow for chatbot:', chatbotId);
        
        try {
          // Get chatbot flow data - allow both published and unpublished for widget testing
          const { data: chatbot, error } = await supabase
            .from('chatbots')
            .select('flow_data, name, description, is_published')
            .eq('id', chatbotId)
            .single();

          if (error) {
            console.error('Error fetching chatbot:', error);
            return new Response(
              JSON.stringify({ error: `Chatbot not found: ${error.message}` }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!chatbot) {
            console.error('Chatbot not found for ID:', chatbotId);
            return new Response(
              JSON.stringify({ error: 'Chatbot not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Chatbot found:', { name: chatbot.name, hasFlow: !!chatbot.flow_data });

          return new Response(
            JSON.stringify({ 
              flow: chatbot.flow_data || { nodes: [], edges: [] },
              name: chatbot.name,
              description: chatbot.description
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Unexpected error in get_flow:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to get chatbot flow' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'initialize': {
        console.log('Initializing conversation for chatbot:', chatbotId);
        
        try {
          // First check if chatbot exists - allow both published and unpublished for testing
          const { data: chatbot, error: chatbotError } = await supabase
            .from('chatbots')
            .select('id, name, flow_data')
            .eq('id', chatbotId)
            .single();

          if (chatbotError) {
            console.error('Chatbot lookup error:', chatbotError);
            return new Response(
              JSON.stringify({ error: `Chatbot not found: ${chatbotError.message}` }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!chatbot) {
            console.error('Chatbot not found for ID:', chatbotId);
            return new Response(
              JSON.stringify({ error: 'Chatbot not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Chatbot found for initialization:', { id: chatbot.id, name: chatbot.name });

          // Create a new conversation
          const newConversationId = crypto.randomUUID();
          const newUserIdentifier = userIdentifier || `widget_user_${Date.now()}`;

          console.log('Creating conversation:', { 
            conversationId: newConversationId, 
            userIdentifier: newUserIdentifier 
          });

          // Create conversation record
          const { error: conversationError } = await supabase
            .from('conversations')
            .insert({
              id: newConversationId,
              chatbot_id: chatbotId,
              user_identifier: newUserIdentifier,
              platform: 'web',
              channel_type: 'web',
              status: 'active',
              started_at: new Date().toISOString(),
            });

          if (conversationError) {
            console.error('Error creating conversation:', conversationError);
            return new Response(
              JSON.stringify({ error: `Failed to initialize conversation: ${conversationError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Conversation created successfully');

          // Create conversation log entry using the helper function
          const { error: logError } = await supabase.rpc('create_conversation_log', {
            p_conversation_id: newConversationId,
            p_chatbot_id: chatbotId,
            p_user_identifier: newUserIdentifier,
            p_channel_type: 'web'
          });

          if (logError) {
            console.error('Error creating conversation log:', logError);
            // Don't fail the initialization for logging issues, just log the error
            console.log('Continuing without conversation log due to error:', logError.message);
          } else {
            console.log('Conversation log created successfully');
          }

          // Find the start node and get welcome message
          const startNode = chatbot.flow_data?.nodes?.find((node: any) => 
            node.data?.nodeType === 'start' || node.type === 'start'
          );

          const welcomeMessage = startNode?.data?.content || 'Hello! How can I help you today?';

          console.log('Welcome message:', welcomeMessage);

          // Create welcome message
          const welcomeMessageId = crypto.randomUUID();
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              id: welcomeMessageId,
              conversation_id: newConversationId,
              sender: 'bot',
              content: welcomeMessage,
              message_type: 'text',
              node_id: startNode?.id,
            });

          if (messageError) {
            console.error('Error creating welcome message:', messageError);
            // Don't fail the initialization for this, just log it
          } else {
            console.log('Welcome message created successfully');
          }

          console.log('Conversation initialized successfully:', {
            conversationId: newConversationId,
            userIdentifier: newUserIdentifier
          });

          return new Response(
            JSON.stringify({
              conversationId: newConversationId,
              userIdentifier: newUserIdentifier,
              welcomeMessage: {
                id: welcomeMessageId,
                content: welcomeMessage,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                type: 'text'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Unexpected error in initialize:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to initialize conversation',
              details: error.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'send_message': {
        if (!conversationId || !message) {
          console.error('Missing required fields for send_message:', { 
            hasConversationId: !!conversationId, 
            hasMessage: !!message 
          });
          return new Response(
            JSON.stringify({ error: 'Missing conversationId or message' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Sending message:', { conversationId, message });

        try {
          // Save user message
          const userMessageId = crypto.randomUUID();
          const { error: userMessageError } = await supabase
            .from('messages')
            .insert({
              id: userMessageId,
              conversation_id: conversationId,
              sender: 'user',
              content: message,
              message_type: 'text',
            });

          if (userMessageError) {
            console.error('Error saving user message:', userMessageError);
            return new Response(
              JSON.stringify({ error: `Failed to save message: ${userMessageError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Update conversation log with new message count using the helper function
          try {
            const { error: updateLogError } = await supabase.rpc('increment_message_count', { 
              conversation_uuid: conversationId 
            });

            if (updateLogError) {
              console.log('Could not update conversation log message count:', updateLogError.message);
            }
          } catch (logUpdateError) {
            console.log('Error updating conversation log:', logUpdateError);
          }

          // Get chatbot data for response generation
          const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select(`
              chatbot_id,
              chatbots (
                flow_data,
                name,
                openai_model,
                fallback_message
              )
            `)
            .eq('id', conversationId)
            .single();

          if (convError || !conversation) {
            console.error('Conversation not found:', convError);
            return new Response(
              JSON.stringify({ error: 'Conversation not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Generate bot response (simplified for now)
          let botResponse = "I understand. How can I help you further?";
          
          // Try to use OpenAI if available
          try {
            const openaiResponse = await fetch(`${supabaseUrl}/functions/v1/openai-chat`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userInput: message,
                systemPrompt: `You are a helpful assistant for ${conversation.chatbots.name}. Be concise and helpful.`,
                conversationHistory: [],
                chatbotId: chatbotId,
              }),
            });

            if (openaiResponse.ok) {
              const aiResult = await openaiResponse.json();
              if (aiResult.response) {
                botResponse = aiResult.response;
              }
            } else {
              console.log('OpenAI response not ok:', openaiResponse.status);
            }
          } catch (error) {
            console.log('OpenAI not available, using fallback response:', error.message);
            botResponse = conversation.chatbots.fallback_message || botResponse;
          }

          // Save bot response
          const botMessageId = crypto.randomUUID();
          const { error: botMessageError } = await supabase
            .from('messages')
            .insert({
              id: botMessageId,
              conversation_id: conversationId,
              sender: 'bot',
              content: botResponse,
              message_type: 'text',
            });

          if (botMessageError) {
            console.error('Error saving bot message:', botMessageError);
            // Don't fail the request for this, just log it
          }

          console.log('Message exchange completed successfully');

          return new Response(
            JSON.stringify({
              userMessage: {
                id: userMessageId,
                content: message,
                sender: 'user',
                timestamp: new Date().toISOString(),
                type: 'text'
              },
              botMessage: {
                id: botMessageId,
                content: botResponse,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                type: 'text'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Unexpected error in send_message:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to send message',
              details: error.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        console.error('Invalid action:', action);
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Widget chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});