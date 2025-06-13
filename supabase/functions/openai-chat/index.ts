const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  userInput: string;
  systemPrompt?: string;
  conversationHistory?: Array<{ sender: string; content: string }>;
  nodeContext?: any;
  chatbotId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userInput, systemPrompt, conversationHistory = [], nodeContext, chatbotId }: ChatRequest = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      // Return fallback response when OpenAI is not configured
      return new Response(
        JSON.stringify({
          response: "I understand your message. For the most accurate assistance, please contact our support team.",
          intent: "general_inquiry",
          confidence: 0.5,
          fallback: true,
          processing_time: 100
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the conversation context
    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful AI assistant. Be concise and helpful in your responses.'
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user input
    messages.push({
      role: 'user',
      content: userInput
    });

    const startTime = Date.now();

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    const processingTime = Date.now() - startTime;

    // Simple intent detection based on keywords
    let intent = 'general_inquiry';
    let confidence = 0.7;

    const input = userInput.toLowerCase();
    if (input.includes('hello') || input.includes('hi')) {
      intent = 'greeting';
      confidence = 0.9;
    } else if (input.includes('help')) {
      intent = 'help_request';
      confidence = 0.8;
    } else if (input.includes('price') || input.includes('cost')) {
      intent = 'pricing_inquiry';
      confidence = 0.8;
    } else if (input.includes('thank')) {
      intent = 'gratitude';
      confidence = 0.9;
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        intent: intent,
        confidence: confidence,
        tokens_used: data.usage?.total_tokens || 0,
        processing_time: processingTime,
        fallback: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OpenAI chat error:', error);
    
    // Return fallback response on error
    return new Response(
      JSON.stringify({
        response: "I'm having trouble processing your request right now. Please try again or contact our support team for assistance.",
        intent: "error",
        confidence: 0.5,
        fallback: true,
        processing_time: 100,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});