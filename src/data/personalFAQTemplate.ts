import { v4 as uuidv4 } from 'uuid';

export const personalFAQTemplate = {
  id: 'personal-faq-assistant',
  name: 'Personal FAQ Assistant',
  description: 'A friendly, personalized FAQ bot that gets the user\'s name first, then helps them find answers or connects them to you directly.',
  category: 'support' as const,
  icon: 'HelpCircle',
  color: 'from-blue-500 to-purple-600',
  difficulty: 'beginner' as const,
  tags: ['personal', 'faq', 'small-business', 'human-handoff'],
  settings: {
    welcomeMessage: 'Hi there! I\'m here to help you find answers quickly.',
    fallbackMessage: 'Let me connect you with our team member who can help you personally.'
  },
  flow: {
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          nodeType: 'start',
          label: 'Welcome',
          content: 'Hi there! 👋 I\'m here to help you get the answers you need quickly. Before we start, I\'d love to know your name so I can assist you personally.'
        }
      },
      {
        id: 'lead-capture-1',
        type: 'lead_capture',
        position: { x: 100, y: 250 },
        data: {
          nodeType: 'lead_capture',
          label: 'Get First Name',
          content: 'What\'s your first name? I want to make sure I can help you personally! 😊',
          fields: [
            { 
              name: 'first_name', 
              type: 'text', 
              required: true, 
              label: 'Your First Name',
              placeholder: 'Enter your first name...'
            }
          ]
        }
      },
      {
        id: 'message-1',
        type: 'message',
        position: { x: 100, y: 400 },
        data: {
          nodeType: 'message',
          label: 'Personal Greeting',
          content: 'Nice to meet you, {first_name}! 😊 I\'m here to help you find answers to common questions about our business. What would you like to know about?'
        }
      },
      {
        id: 'question-1',
        type: 'question',
        position: { x: 100, y: 550 },
        data: {
          nodeType: 'question',
          label: 'FAQ Categories',
          content: 'Here are the topics I can help you with, {first_name}:',
          options: [
            '🕒 Business Hours & Location',
            '💰 Pricing & Services',
            '📞 Contact Information',
            '📋 How to Get Started',
            '❓ Other Questions',
            '👤 Speak to Someone'
          ]
        }
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        position: { x: 100, y: 700 },
        data: {
          nodeType: 'conditional',
          label: 'Route Question',
          conditions: [
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'Business Hours',
              action: 'hours'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'Pricing',
              action: 'pricing'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'Contact',
              action: 'contact'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'Get Started',
              action: 'getting_started'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'Other',
              action: 'other'
            },
            {
              variable: 'selected_option',
              operator: 'contains',
              value: 'Speak to Someone',
              action: 'human'
            }
          ]
        }
      },
      // Business Hours Response
      {
        id: 'message-hours',
        type: 'message',
        position: { x: 400, y: 700 },
        data: {
          nodeType: 'message',
          label: 'Business Hours',
          content: 'Great question, {first_name}! Here are our business hours:\n\n🕒 **Business Hours:**\n• Monday - Friday: 9:00 AM - 6:00 PM\n• Saturday: 10:00 AM - 4:00 PM\n• Sunday: Closed\n\n📍 **Location:**\n123 Main Street\nYour City, State 12345\n\nWe\'re also available by appointment outside these hours if needed!'
        }
      },
      // Pricing Response
      {
        id: 'message-pricing',
        type: 'message',
        position: { x: 700, y: 700 },
        data: {
          nodeType: 'message',
          label: 'Pricing Info',
          content: 'Thanks for asking about our pricing, {first_name}! Here\'s an overview:\n\n💰 **Our Services:**\n• Basic Package: $99/month\n• Standard Package: $199/month\n• Premium Package: $299/month\n\n✨ **What\'s Included:**\n• All packages include setup and training\n• 24/7 email support\n• Monthly check-ins\n\nWould you like me to connect you with someone to discuss which package might be best for your needs?'
        }
      },
      // Contact Response
      {
        id: 'message-contact',
        type: 'message',
        position: { x: 1000, y: 700 },
        data: {
          nodeType: 'message',
          label: 'Contact Info',
          content: 'Here\'s how you can reach us, {first_name}:\n\n📞 **Phone:** (555) 123-4567\n📧 **Email:** hello@yourbusiness.com\n💬 **Text/WhatsApp:** (555) 123-4567\n\n🌐 **Website:** www.yourbusiness.com\n📱 **Social Media:**\n• Facebook: @YourBusiness\n• Instagram: @yourbusiness\n\nFeel free to reach out anytime - we love hearing from our customers!'
        }
      },
      // Getting Started Response
      {
        id: 'message-started',
        type: 'message',
        position: { x: 400, y: 850 },
        data: {
          nodeType: 'message',
          label: 'Getting Started',
          content: 'Excellent, {first_name}! Getting started is easy:\n\n🚀 **Simple 3-Step Process:**\n\n1️⃣ **Free Consultation** (15 minutes)\n   • We\'ll discuss your needs\n   • Answer any questions\n   • Recommend the best solution\n\n2️⃣ **Choose Your Package**\n   • Select what works for your budget\n   • No long-term contracts\n   • Cancel anytime\n\n3️⃣ **Get Started**\n   • Quick setup (usually same day)\n   • Personal training included\n   • Ongoing support\n\nReady to schedule your free consultation?'
        }
      },
      // Other Questions - AI Response
      {
        id: 'ai-response-1',
        type: 'ai_response',
        position: { x: 700, y: 850 },
        data: {
          nodeType: 'ai_response',
          label: 'AI FAQ Search',
          systemPrompt: 'You are a helpful assistant for a small business. The user has provided their name, so use it naturally in your responses to keep the conversation personal and friendly. Answer questions about business services, policies, and common concerns. Keep responses friendly, personal, and concise. If you don\'t know something specific, offer to connect them with the business owner. Always end by asking if they need anything else.'
        }
      },
      // Human Handoff
      {
        id: 'human-handoff-1',
        type: 'human_handoff',
        position: { x: 1000, y: 850 },
        data: {
          nodeType: 'human_handoff',
          label: 'Connect to Owner',
          content: 'Absolutely, {first_name}! I\'ll connect you with our team member right away. They\'ll be able to give you personalized attention and answer any specific questions you have.\n\nSomeone will be with you shortly - usually within a few minutes during business hours!',
          handoffConfig: {
            reason: 'Customer requested to speak with someone',
            priority: 'medium',
            department: 'general'
          }
        }
      },
      // Follow-up Question
      {
        id: 'question-2',
        type: 'question',
        position: { x: 100, y: 1000 },
        data: {
          nodeType: 'question',
          label: 'Anything Else',
          content: 'Is there anything else I can help you with today, {first_name}?',
          options: [
            '✅ That answered my question!',
            '❓ I have another question',
            '👤 I\'d like to speak with someone',
            '📞 Please have someone call me'
          ]
        }
      },
      {
        id: 'conditional-2',
        type: 'conditional',
        position: { x: 100, y: 1150 },
        data: {
          nodeType: 'conditional',
          label: 'Follow-up Action',
          conditions: [
            {
              variable: 'followup_choice',
              operator: 'contains',
              value: 'answered',
              action: 'satisfied'
            },
            {
              variable: 'followup_choice',
              operator: 'contains',
              value: 'another question',
              action: 'more_questions'
            },
            {
              variable: 'followup_choice',
              operator: 'contains',
              value: 'speak with someone',
              action: 'human_handoff'
            },
            {
              variable: 'followup_choice',
              operator: 'contains',
              value: 'call me',
              action: 'callback'
            }
          ]
        }
      },
      // Satisfied Response
      {
        id: 'message-satisfied',
        type: 'message',
        position: { x: 400, y: 1150 },
        data: {
          nodeType: 'message',
          label: 'Thank You',
          content: 'Wonderful, {first_name}! 🎉 I\'m so glad I could help you today.\n\nIf you need anything else in the future, just come back and chat with me anytime. We\'re always here to help!\n\nHave a fantastic day! 😊'
        }
      },
      // Callback Request
      {
        id: 'lead-capture-2',
        type: 'lead_capture',
        position: { x: 700, y: 1150 },
        data: {
          nodeType: 'lead_capture',
          label: 'Callback Request',
          content: 'Of course, {first_name}! I\'d be happy to have someone call you. What\'s the best number to reach you at?',
          fields: [
            { 
              name: 'phone_number', 
              type: 'phone', 
              required: true, 
              label: 'Phone Number',
              placeholder: 'Enter your phone number...'
            },
            { 
              name: 'best_time', 
              type: 'text', 
              required: false, 
              label: 'Best time to call (optional)',
              placeholder: 'e.g., mornings, after 3pm, etc.'
            }
          ]
        }
      },
      {
        id: 'message-callback',
        type: 'message',
        position: { x: 700, y: 1300 },
        data: {
          nodeType: 'message',
          label: 'Callback Confirmation',
          content: 'Perfect, {first_name}! 📞 I\'ve got your number and someone from our team will call you back soon.\n\n**What to expect:**\n• Call within 2 hours during business hours\n• If after hours, we\'ll call first thing tomorrow\n• The call will be from (555) 123-4567\n\nThanks for reaching out - we look forward to speaking with you!'
        }
      },
      // Feedback Collection
      {
        id: 'survey-1',
        type: 'survey',
        position: { x: 100, y: 1300 },
        data: {
          nodeType: 'survey',
          label: 'Quick Feedback',
          surveyConfig: {
            title: 'How did I do today?',
            questions: [
              {
                type: 'rating',
                question: 'How helpful was this chat experience?',
                required: true
              },
              {
                type: 'text',
                question: 'Any suggestions to make our chat even better?',
                required: false
              }
            ]
          }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'lead-capture-1' },
      { id: 'e2', source: 'lead-capture-1', target: 'message-1' },
      { id: 'e3', source: 'message-1', target: 'question-1' },
      { id: 'e4', source: 'question-1', target: 'conditional-1' },
      
      // FAQ Routing
      { id: 'e5', source: 'conditional-1', target: 'message-hours', condition: 'hours' },
      { id: 'e6', source: 'conditional-1', target: 'message-pricing', condition: 'pricing' },
      { id: 'e7', source: 'conditional-1', target: 'message-contact', condition: 'contact' },
      { id: 'e8', source: 'conditional-1', target: 'message-started', condition: 'getting_started' },
      { id: 'e9', source: 'conditional-1', target: 'ai-response-1', condition: 'other' },
      { id: 'e10', source: 'conditional-1', target: 'human-handoff-1', condition: 'human' },
      
      // Back to follow-up
      { id: 'e11', source: 'message-hours', target: 'question-2' },
      { id: 'e12', source: 'message-pricing', target: 'question-2' },
      { id: 'e13', source: 'message-contact', target: 'question-2' },
      { id: 'e14', source: 'message-started', target: 'question-2' },
      { id: 'e15', source: 'ai-response-1', target: 'question-2' },
      
      // Follow-up routing
      { id: 'e16', source: 'question-2', target: 'conditional-2' },
      { id: 'e17', source: 'conditional-2', target: 'message-satisfied', condition: 'satisfied' },
      { id: 'e18', source: 'conditional-2', target: 'question-1', condition: 'more_questions' },
      { id: 'e19', source: 'conditional-2', target: 'human-handoff-1', condition: 'human_handoff' },
      { id: 'e20', source: 'conditional-2', target: 'lead-capture-2', condition: 'callback' },
      
      // Callback flow
      { id: 'e21', source: 'lead-capture-2', target: 'message-callback' },
      { id: 'e22', source: 'message-callback', target: 'survey-1' },
      { id: 'e23', source: 'message-satisfied', target: 'survey-1' }
    ]
  }
};