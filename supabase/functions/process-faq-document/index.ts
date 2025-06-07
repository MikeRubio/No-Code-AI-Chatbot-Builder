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

    const { documentId } = await req.json()

    // Get document from database
    const { data: document, error: docError } = await supabaseClient
      .from('faq_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    // Update status to processing
    await supabaseClient
      .from('faq_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId)

    // Parse content based on file type
    let faqEntries: Array<{ question: string; answer: string }> = []

    if (document.file_type === 'text/csv') {
      // Parse CSV format: question,answer
      const lines = document.content.split('\n')
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim()
        if (!line) continue
        
        // Handle CSV parsing with proper quote handling
        const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
        const parts = line.split(csvRegex)
        
        if (parts.length >= 2) {
          const question = parts[0].trim().replace(/^"|"$/g, '')
          const answer = parts[1].trim().replace(/^"|"$/g, '')
          
          if (question && answer) {
            faqEntries.push({ question, answer })
          }
        }
      }
    } else if (document.file_type === 'text/plain') {
      // Parse plain text format: Q: question\nA: answer\n\n
      const sections = document.content.split('\n\n')
      for (const section of sections) {
        const lines = section.trim().split('\n')
        let question = ''
        let answer = ''
        
        for (const line of lines) {
          if (line.startsWith('Q:') || line.startsWith('Question:')) {
            question = line.replace(/^(Q:|Question:)\s*/, '').trim()
          } else if (line.startsWith('A:') || line.startsWith('Answer:')) {
            answer = line.replace(/^(A:|Answer:)\s*/, '').trim()
          }
        }
        
        if (question && answer) {
          faqEntries.push({ question, answer })
        }
      }
    } else if (document.file_type === 'application/pdf') {
      // For PDF files, we'll need to implement PDF parsing
      // For now, we'll mark it as failed with a helpful message
      await supabaseClient
        .from('faq_documents')
        .update({ 
          processing_status: 'failed',
          error_message: 'PDF processing not yet implemented. Please use TXT or CSV format.'
        })
        .eq('id', documentId)

      return new Response(
        JSON.stringify({ 
          error: 'PDF processing not yet implemented. Please use TXT or CSV format.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (faqEntries.length === 0) {
      await supabaseClient
        .from('faq_documents')
        .update({ 
          processing_status: 'failed',
          error_message: 'No valid FAQ entries found in the document. Please check the format.'
        })
        .eq('id', documentId)

      return new Response(
        JSON.stringify({ 
          error: 'No valid FAQ entries found in the document. Please check the format.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Process each FAQ entry
    for (const entry of faqEntries) {
      try {
        // Extract keywords from question (simple keyword extraction)
        const keywords = entry.question
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 10) // Limit to 10 keywords

        // Insert FAQ entry without embeddings for now
        const { error: insertError } = await supabaseClient
          .from('faq_entries')
          .insert({
            document_id: documentId,
            chatbot_id: document.chatbot_id,
            question: entry.question,
            answer: entry.answer,
            keywords,
            embedding_data: null, // We'll add embeddings later when OpenAI is configured
          })

        if (insertError) {
          console.error('Error inserting FAQ entry:', insertError)
          throw insertError
        }
      } catch (error) {
        console.error('Error processing FAQ entry:', error)
        throw error
      }
    }

    // Update document status to completed
    await supabaseClient
      .from('faq_documents')
      .update({ 
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        entriesProcessed: faqEntries.length,
        message: `Successfully processed ${faqEntries.length} FAQ entries`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing FAQ document:', error)
    
    // Update document status to failed
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { documentId } = await req.json().catch(() => ({}))
      if (documentId) {
        await supabaseClient
          .from('faq_documents')
          .update({ 
            processing_status: 'failed',
            error_message: error.message
          })
          .eq('id', documentId)
      }
    } catch (updateError) {
      console.error('Error updating document status:', updateError)
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Import at the top
import { createClient } from 'npm:@supabase/supabase-js@2'