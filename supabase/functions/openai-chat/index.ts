import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChatRequest {
  userInput: string;
  systemPrompt?: string;
  conversationHistory?: Array<{sender: string, content: string}>;
  nodeContext?: any;
  chatbotId?: string;
}

interface AIResponse {
  response: string;
  intent: string;
  confidence: number;
  tokens_used?: number;
  processing_time?: number;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          fallback: true
        }),
        {
          status: 200, // Return 200 to allow fallback handling
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Supabase configuration missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { 
      userInput, 
      systemPrompt, 
      conversationHistory = [], 
      nodeContext,
      chatbotId 
    }: ChatRequest = await req.json();

    if (!userInput) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameter: userInput"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const startTime = Date.now();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load FAQ context if chatbotId is provided
    let faqContext: any[] = [];
    if (chatbotId) {
      const { data: faqEntries } = await supabase
        .from('faq_entries')
        .select('question, answer, keywords')
        .eq('chatbot_id', chatbotId);
      
      faqContext = faqEntries || [];
    }

    // Build context-aware system prompt
    let contextualPrompt = systemPrompt || 'You are a helpful AI assistant for a business chatbot.';
    
    // Add FAQ context
    if (faqContext.length > 0) {
      contextualPrompt += '\n\nAvailable FAQ Information:\n';
      faqContext.slice(0, 10).forEach((faq, index) => {
        contextualPrompt += `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
      });
      contextualPrompt += '\nUse this FAQ information to answer questions when relevant.';
    }

    // Add node-specific context
    if (nodeContext) {
      if (nodeContext.conversationState) {
        contextualPrompt += `\n\nConversation Variables: ${JSON.stringify(nodeContext.conversationState)}`;
      }
      if (nodeContext.chatbotInfo) {
        contextualPrompt += `\n\nChatbot Info: ${JSON.stringify(nodeContext.chatbotInfo)}`;
      }
    }

    contextualPrompt += `
    
Guidelines:
- Be helpful, friendly, and professional
- Keep responses concise but informative
- If you don't know something, say so and offer to connect them with a human
- Use the FAQ information when relevant
- Personalize responses using any available user information
- Stay in character as a business assistant`;

    // Prepare conversation messages
    const messages: any[] = [
      { role: 'system', content: contextualPrompt }
    ];

    // Add conversation history (last 10 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user input
    messages.push({ role: 'user', content: userInput });

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      
      // Return fallback response
      return new Response(
        JSON.stringify({
          response: getFallbackResponse(userInput),
          intent: analyzeIntent(userInput),
          confidence: 0.6,
          processing_time: Date.now() - startTime,
          fallback: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const completion = await openaiResponse.json();
    const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at this time.';
    const tokensUsed = completion.usage?.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    // Analyze intent and confidence
    const { intent, confidence } = analyzeIntentAndConfidence(userInput, response);

    const result: AIResponse = {
      response: response.trim(),
      intent,
      confidence,
      tokens_used: tokensUsed,
      processing_time: processingTime
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in openai-chat function:', error);
    
    // Return fallback response on error
    const { userInput } = await req.json().catch(() => ({ userInput: '' }));
    
    return new Response(
      JSON.stringify({
        response: getFallbackResponse(userInput),
        intent: analyzeIntent(userInput),
        confidence: 0.6,
        processing_time: 1000,
        fallback: true,
        error: error.message
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function getFallbackResponse(userInput: string): string {
  const input = userInput.toLowerCase();
  
  if (input.includes('hello') || input.includes('hi')) {
    return 'Hello! How can I help you today?';
  } else if (input.includes('help')) {
    return 'I\'d be happy to help you! What do you need assistance with?';
  } else if (input.includes('price') || input.includes('cost')) {
    return 'For pricing information, please contact our sales team or check our website.';
  } else if (input.includes('thank')) {
    return 'You\'re welcome! Is there anything else I can help you with?';
  } else {
    return 'I understand you\'re asking about that. For the most accurate information, I\'d recommend speaking with one of our team members who can provide detailed assistance.';
  }
}

function analyzeIntent(userInput: string): string {
  const input = userInput.toLowerCase();
  
  if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
    return 'greeting';
  }
  
  if (input.includes('help') || input.includes('support') || input.includes('assist')) {
    return 'help_request';
  }
  
  if (input.includes('price') || input.includes('cost') || input.includes('fee')) {
    return 'pricing_inquiry';
  }
  
  if (input.includes('thank') || input.includes('thanks')) {
    return 'gratitude';
  }
  
  if (input.includes('bye') || input.includes('goodbye') || input.includes('exit')) {
    return 'farewell';
  }

  return 'general_inquiry';
}

function analyzeIntentAndConfidence(userInput: string, aiResponse: string): {intent: string, confidence: number} {
  const intent = analyzeIntent(userInput);
  
  // Calculate confidence based on intent type and response quality
  let confidence = 0.7;
  
  if (intent === 'greeting' || intent === 'gratitude' || intent === 'farewell') {
    confidence = 0.9;
  } else if (intent === 'help_request' || intent === 'pricing_inquiry') {
    confidence = 0.8;
  }
  
  // Adjust confidence based on response length and quality
  if (aiResponse.length > 50 && !aiResponse.includes('I don\'t know')) {
    confidence += 0.1;
  }
  
  return { intent, confidence: Math.min(confidence, 1.0) };
}