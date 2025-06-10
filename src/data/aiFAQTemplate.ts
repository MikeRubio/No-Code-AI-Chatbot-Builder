import { v4 as uuidv4 } from 'uuid';

export const aiFAQTemplate = {
  id: 'ai-faq-assistant',
  name: 'AI-Powered FAQ Assistant',
  description: 'An intelligent FAQ bot that uses AI to understand questions and provide accurate answers from your knowledge base. Includes smart fallback to human agents.',
  category: 'support' as const,
  icon: 'HelpCircle',
  color: 'from-emerald-500 to-blue-600',
  difficulty: 'intermediate' as const,
  tags: ['ai-powered', 'faq', 'intelligent', 'support', 'knowledge-base'],
  settings: {
    welcomeMessage: 'Hi! I\'m your AI-powered assistant. I can help answer your questions using our knowledge base.',
    fallbackMessage: 'Let me connect you with a human expert who can provide more detailed assistance.'
  },
  flow: {
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          nodeType: 'start',
          label: 'AI Welcome',
          content: 'Hello! 🤖 I\'m your AI-powered FAQ assistant. I have access to our complete knowledge base and can help answer questions about our products, services, policies, and more.\n\nWhat would you like to know?'
        }
      },
      {
        id: 'ai-response-main',
        type: 'ai_response',
        position: { x: 100, y: 250 },
        data: {
          nodeType: 'ai_response',
          label: 'AI FAQ Search & Response',
          systemPrompt: `You are an intelligent FAQ assistant with access to a comprehensive knowledge base. Your role is to:

1. SEARCH the FAQ database for relevant information
2. PROVIDE accurate, helpful answers based on the knowledge base
3. PERSONALIZE responses when user information is available
4. ADMIT when you don't know something and offer human assistance

Guidelines:
- Always search the FAQ context first before responding
- If you find relevant FAQ information, use it to provide detailed answers
- Be conversational and friendly, not robotic
- If the question is outside your knowledge base, be honest and offer to connect them with a human
- Ask follow-up questions to better understand complex queries
- Provide specific, actionable information when possible

Knowledge Base Instructions:
- Reference specific FAQ entries when available
- Combine multiple FAQ entries if needed for comprehensive answers
- Update answers based on the most current information in the knowledge base
- Suggest related topics the user might be interested in

Response Format:
- Start with a direct answer to their question
- Provide additional relevant details
- End with a helpful follow-up question or offer for more assistance`
        }
      },
      {
        id: 'question-helpful',
        type: 'question',
        position: { x: 100, y: 400 },
        data: {
          nodeType: 'question',
          label: 'Helpfulness Check',
          content: 'Did that answer your question completely?',
          options: [
            '✅ Yes, that was perfect!',
            '📚 I need more details',
            '❓ I have a different question',
            '👤 I\'d like to speak with someone',
            '🔍 Can you search for something else?'
          ]
        }
      },
      {
        id: 'conditional-followup',
        type: 'conditional',
        position: { x: 100, y: 550 },
        data: {
          nodeType: 'conditional',
          label: 'Route Follow-up',
          conditions: [
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'perfect',
              action: 'satisfied'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'more details',
              action: 'more_info'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'different question',
              action: 'new_question'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'speak with someone',
              action: 'human_handoff'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'search',
              action: 'new_search'
            }
          ]
        }
      },
      // Satisfied path
      {
        id: 'message-satisfied',
        type: 'message',
        position: { x: 400, y: 550 },
        data: {
          nodeType: 'message',
          label: 'Satisfaction Confirmation',
          content: 'Wonderful! 🎉 I\'m glad I could help you find the information you needed.\n\nIf you have any other questions in the future, just ask! I\'m always here and my knowledge base is constantly being updated with new information.\n\nIs there anything else I can help you with today?'
        }
      },
      // More details path
      {
        id: 'ai-response-details',
        type: 'ai_response',
        position: { x: 700, y: 550 },
        data: {
          nodeType: 'ai_response',
          label: 'Detailed AI Response',
          systemPrompt: `The user wants more detailed information about their previous question. Provide a comprehensive, in-depth response that:

1. EXPANDS on the previous answer with more specific details
2. INCLUDES step-by-step instructions if applicable
3. PROVIDES examples or use cases
4. REFERENCES additional FAQ entries that might be relevant
5. ANTICIPATES follow-up questions and addresses them

Guidelines:
- Be thorough but organized - use bullet points or numbered lists
- Include specific details like timeframes, costs, requirements
- Provide context and background information
- Suggest next steps or related actions
- Reference multiple knowledge base entries if relevant

Make this response significantly more detailed than the previous one while staying focused on their original question.`
        }
      },
      // Human handoff path
      {
        id: 'human-handoff-1',
        type: 'human_handoff',
        position: { x: 1000, y: 550 },
        data: {
          nodeType: 'human_handoff',
          label: 'Expert Connection',
          content: 'Absolutely! I\'ll connect you with one of our human experts who can provide personalized assistance and answer any complex questions.\n\n🔄 **What happens next:**\n• You\'ll be connected with a specialist\n• They have access to all the same information I do, plus more\n• They can provide personalized recommendations\n• Average wait time is less than 2 minutes during business hours\n\nConnecting you now...',
          handoffConfig: {
            reason: 'User requested human assistance after AI FAQ interaction',
            priority: 'medium',
            department: 'support'
          }
        }
      },
      // New question path - loops back to AI
      {
        id: 'message-new-question',
        type: 'message',
        position: { x: 100, y: 700 },
        data: {
          nodeType: 'message',
          label: 'New Question Prompt',
          content: 'Perfect! I\'m ready to help with your new question. 🤔\n\nI have access to information about:\n• Products and services\n• Pricing and billing\n• Technical support\n• Account management\n• Policies and procedures\n• Getting started guides\n\nWhat would you like to know?'
        }
      },
      // Advanced search capabilities
      {
        id: 'ai-response-search',
        type: 'ai_response',
        position: { x: 400, y: 700 },
        data: {
          nodeType: 'ai_response',
          label: 'Advanced AI Search',
          systemPrompt: `The user wants you to search for specific information. Act as an intelligent search assistant that:

1. UNDERSTANDS the search intent and context
2. SEARCHES through the entire knowledge base systematically
3. FINDS relevant information even if not directly matching keywords
4. PRESENTS results in an organized, easy-to-understand format
5. SUGGESTS related topics they might find useful

Search Capabilities:
- Semantic search (understanding meaning, not just keywords)
- Cross-reference multiple FAQ entries
- Find related topics and suggestions
- Identify gaps in the knowledge base

Response Format:
- "I found [X] relevant pieces of information about [topic]:"
- Present findings in a clear, organized way
- Include confidence levels when appropriate
- Suggest follow-up searches or related topics
- If no results found, explain what you searched and suggest alternatives`
        }
      },
      // Feedback collection
      {
        id: 'question-final',
        type: 'question',
        position: { x: 100, y: 850 },
        data: {
          nodeType: 'question',
          label: 'Final Check',
          content: 'Is there anything else I can help you with today?',
          options: [
            '✅ No, I\'m all set - thanks!',
            '❓ I have another question',
            '📞 I\'d like to schedule a call',
            '📧 Send me more information',
            '🔄 Start over with a new topic'
          ]
        }
      },
      {
        id: 'conditional-final',
        type: 'conditional',
        position: { x: 100, y: 1000 },
        data: {
          nodeType: 'conditional',
          label: 'Final Action Router',
          conditions: [
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'all set',
              action: 'complete'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'another question',
              action: 'loop_back'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'schedule',
              action: 'appointment'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'information',
              action: 'lead_capture'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'start over',
              action: 'restart'
            }
          ]
        }
      },
      // Completion path
      {
        id: 'message-complete',
        type: 'message',
        position: { x: 400, y: 1000 },
        data: {
          nodeType: 'message',
          label: 'Completion Message',
          content: 'Perfect! 🌟 I\'m so glad I could help you today.\n\n**Remember:**\n• I\'m available 24/7 for any questions\n• My knowledge base is constantly updated\n• You can always ask for a human expert if needed\n\nHave a wonderful day, and don\'t hesitate to come back anytime you need assistance!'
        }
      },
      // Appointment booking
      {
        id: 'appointment-1',
        type: 'appointment',
        position: { x: 700, y: 1000 },
        data: {
          nodeType: 'appointment',
          label: 'Schedule Expert Call',
          content: 'Great idea! 📅 I can help you schedule a call with one of our experts.\n\nThey can provide:\n• Personalized consultation\n• Detailed product demonstrations\n• Custom solution recommendations\n• Implementation planning\n\nLet\'s find a time that works for you!'
        }
      },
      // Lead capture for information
      {
        id: 'lead-capture-info',
        type: 'lead_capture',
        position: { x: 1000, y: 1000 },
        data: {
          nodeType: 'lead_capture',
          label: 'Information Request',
          content: 'I\'d be happy to send you more detailed information! 📧\n\nPlease provide your contact details and I\'ll make sure you receive:\n• Comprehensive guides\n• Latest updates\n• Exclusive resources\n• Personalized recommendations',
          fields: [
            { name: 'email', type: 'email', required: true, label: 'Email Address' },
            { name: 'name', type: 'text', required: false, label: 'Name (optional)' },
            { name: 'specific_interest', type: 'text', required: false, label: 'What specific information interests you most?' }
          ]
        }
      },
      // Feedback survey
      {
        id: 'survey-1',
        type: 'survey',
        position: { x: 100, y: 1150 },
        data: {
          nodeType: 'survey',
          label: 'AI Assistant Feedback',
          surveyConfig: {
            title: 'How was your AI assistant experience?',
            questions: [
              {
                type: 'rating',
                question: 'How helpful was the AI assistant in answering your questions?',
                required: true
              },
              {
                type: 'rating',
                question: 'How accurate were the answers provided?',
                required: true
              },
              {
                type: 'text',
                question: 'What could we improve about the AI assistant?',
                required: false
              },
              {
                type: 'text',
                question: 'What topics would you like to see added to the knowledge base?',
                required: false
              }
            ],
            collectNPS: true
          }
        }
      }
    ],
    edges: [
      // Main flow
      { id: 'e1', source: 'start-1', target: 'ai-response-main' },
      { id: 'e2', source: 'ai-response-main', target: 'question-helpful' },
      { id: 'e3', source: 'question-helpful', target: 'conditional-followup' },
      
      // Follow-up routing
      { id: 'e4', source: 'conditional-followup', target: 'message-satisfied', condition: 'satisfied' },
      { id: 'e5', source: 'conditional-followup', target: 'ai-response-details', condition: 'more_info' },
      { id: 'e6', source: 'conditional-followup', target: 'message-new-question', condition: 'new_question' },
      { id: 'e7', source: 'conditional-followup', target: 'human-handoff-1', condition: 'human_handoff' },
      { id: 'e8', source: 'conditional-followup', target: 'ai-response-search', condition: 'new_search' },
      
      // Back to main flow
      { id: 'e9', source: 'message-satisfied', target: 'question-final' },
      { id: 'e10', source: 'ai-response-details', target: 'question-helpful' },
      { id: 'e11', source: 'message-new-question', target: 'ai-response-main' },
      { id: 'e12', source: 'ai-response-search', target: 'question-helpful' },
      
      // Final routing
      { id: 'e13', source: 'question-final', target: 'conditional-final' },
      { id: 'e14', source: 'conditional-final', target: 'message-complete', condition: 'complete' },
      { id: 'e15', source: 'conditional-final', target: 'ai-response-main', condition: 'loop_back' },
      { id: 'e16', source: 'conditional-final', target: 'appointment-1', condition: 'appointment' },
      { id: 'e17', source: 'conditional-final', target: 'lead-capture-info', condition: 'lead_capture' },
      { id: 'e18', source: 'conditional-final', target: 'start-1', condition: 'restart' },
      
      // To feedback
      { id: 'e19', source: 'message-complete', target: 'survey-1' },
      { id: 'e20', source: 'appointment-1', target: 'survey-1' },
      { id: 'e21', source: 'lead-capture-info', target: 'survey-1' },
      { id: 'e22', source: 'human-handoff-1', target: 'survey-1' }
    ]
  }
};