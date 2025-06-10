import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface FAQEntry {
  question: string;
  answer: string;
  keywords: string[];
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

    const { content, filename, chatbotId } = await req.json();

    if (!content || !filename || !chatbotId) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: content, filename, chatbotId"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let faqEntries: FAQEntry[] = [];

    // Try AI processing first if OpenAI is available
    if (openaiApiKey) {
      try {
        const prompt = `
          Extract FAQ entries from the following document content. 
          Return a JSON array of objects with "question", "answer", and "keywords" fields.
          Keywords should be an array of relevant terms for each FAQ entry.
          
          Document: ${filename}
          Content: ${content}
          
          Format:
          [
            {
              "question": "What are your business hours?",
              "answer": "We're open Monday-Friday 9AM-6PM",
              "keywords": ["hours", "open", "schedule", "time"]
            }
          ]
        `;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        });

        if (openaiResponse.ok) {
          const completion = await openaiResponse.json();
          const response = completion.choices[0]?.message?.content || '[]';
          
          try {
            const aiEntries = JSON.parse(response);
            if (Array.isArray(aiEntries)) {
              faqEntries = aiEntries;
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fall back to manual parsing
          }
        }
      } catch (error) {
        console.error('OpenAI processing failed:', error);
        // Fall back to manual parsing
      }
    }

    // Fallback to manual parsing if AI processing failed or OpenAI not available
    if (faqEntries.length === 0) {
      faqEntries = parseFAQManually(content);
    }

    return new Response(
      JSON.stringify({
        success: true,
        entries: faqEntries,
        count: faqEntries.length,
        method: faqEntries.length > 0 && openaiApiKey ? 'ai' : 'manual'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-faq-document function:', error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Manual FAQ parsing fallback
function parseFAQManually(content: string): FAQEntry[] {
  const entries: FAQEntry[] = [];
  const lines = content.split('\n');
  
  let currentQuestion = '';
  let currentAnswer = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('Q:') || trimmed.startsWith('Question:')) {
      if (currentQuestion && currentAnswer) {
        entries.push({
          question: currentQuestion,
          answer: currentAnswer,
          keywords: extractKeywords(currentQuestion + ' ' + currentAnswer)
        });
      }
      currentQuestion = trimmed.replace(/^(Q:|Question:)\s*/, '');
      currentAnswer = '';
    } else if (trimmed.startsWith('A:') || trimmed.startsWith('Answer:')) {
      currentAnswer = trimmed.replace(/^(A:|Answer:)\s*/, '');
    } else if (currentAnswer && trimmed) {
      currentAnswer += ' ' + trimmed;
    }
  }
  
  // Add the last entry
  if (currentQuestion && currentAnswer) {
    entries.push({
      question: currentQuestion,
      answer: currentAnswer,
      keywords: extractKeywords(currentQuestion + ' ' + currentAnswer)
    });
  }
  
  return entries;
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common stop words
  const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'];
  
  return [...new Set(words.filter(word => !stopWords.includes(word)))].slice(0, 10);
}