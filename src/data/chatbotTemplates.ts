import { v4 as uuidv4 } from 'uuid';
import { personalFAQTemplate } from './personalFAQTemplate';
import { aiFAQTemplate } from './aiFAQTemplate';

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'support' | 'sales' | 'general';
  icon: string;
  color: string;
  flow: {
    nodes: any[];
    edges: any[];
  };
  settings: any;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const chatbotTemplates: ChatbotTemplate[] = [
  // Add the AI FAQ template first (featured)
  aiFAQTemplate,
  
  // Add the personal FAQ template
  personalFAQTemplate,
  
  {
    id: 'business-info',
    name: 'Business Information Collector',
    description: 'Gather comprehensive business details from visitors including company info, industry, and contact details.',
    category: 'business',
    icon: 'Building2',
    color: 'from-blue-500 to-blue-600',
    difficulty: 'beginner',
    tags: ['lead-generation', 'business', 'information-collection'],
    settings: {
      welcomeMessage: 'Welcome! I\'d love to learn more about your business.',
      fallbackMessage: 'I didn\'t quite understand that. Could you please clarify?'
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
            content: 'Hello! I\'m here to learn more about your business. This will help us provide you with the best possible service. Let\'s start with some basic information.'
          }
        },
        {
          id: 'lead-capture-1',
          type: 'lead_capture',
          position: { x: 100, y: 250 },
          data: {
            nodeType: 'lead_capture',
            label: 'Business Details',
            content: 'First, let\'s get your business information:',
            fields: [
              { name: 'business_name', type: 'text', required: true, label: 'Business Name' },
              { name: 'industry', type: 'text', required: true, label: 'Industry' },
              { name: 'business_size', type: 'text', required: false, label: 'Company Size (employees)' },
              { name: 'location', type: 'text', required: true, label: 'Location (City, State)' }
            ]
          }
        },
        {
          id: 'lead-capture-2',
          type: 'lead_capture',
          position: { x: 100, y: 400 },
          data: {
            nodeType: 'lead_capture',
            label: 'Contact Information',
            content: 'Great! Now let\'s get your contact details:',
            fields: [
              { name: 'contact_name', type: 'text', required: true, label: 'Your Name' },
              { name: 'email', type: 'email', required: true, label: 'Email Address' },
              { name: 'phone', type: 'phone', required: false, label: 'Phone Number' },
              { name: 'website', type: 'text', required: false, label: 'Website URL' }
            ]
          }
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 100, y: 550 },
          data: {
            nodeType: 'question',
            label: 'Business Goals',
            content: 'What\'s your main business goal right now?',
            options: [
              'Increase sales and revenue',
              'Improve customer service',
              'Reduce operational costs',
              'Scale the business',
              'Improve team productivity',
              'Other'
            ]
          }
        },
        {
          id: 'lead-capture-3',
          type: 'lead_capture',
          position: { x: 100, y: 700 },
          data: {
            nodeType: 'lead_capture',
            label: 'Business Operations',
            content: 'Tell us more about your operations:',
            fields: [
              { name: 'business_hours', type: 'text', required: false, label: 'Business Hours' },
              { name: 'services', type: 'text', required: false, label: 'Main Services/Products' },
              { name: 'target_audience', type: 'text', required: false, label: 'Target Customers' },
              { name: 'current_challenges', type: 'text', required: false, label: 'Current Challenges' }
            ]
          }
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 100, y: 850 },
          data: {
            nodeType: 'question',
            label: 'Budget Range',
            content: 'What\'s your monthly budget for business solutions?',
            options: [
              'Under $500',
              '$500 - $2,000',
              '$2,000 - $5,000',
              '$5,000 - $10,000',
              'Over $10,000',
              'Not sure yet'
            ]
          }
        },
        {
          id: 'api-webhook-1',
          type: 'api_webhook',
          position: { x: 100, y: 1000 },
          data: {
            nodeType: 'api_webhook',
            label: 'Save to CRM',
            apiConfig: {
              url: 'https://your-crm.com/api/leads',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              auth: { type: 'api_key' },
              timeout: 30
            }
          }
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 100, y: 1150 },
          data: {
            nodeType: 'message',
            label: 'Thank You',
            content: 'Perfect! Thank you for sharing your business information with us. Our team will review your details and get back to you within 24 hours with personalized recommendations.\n\nBased on what you\'ve told us, we can definitely help you achieve your goals!'
          }
        },
        {
          id: 'question-3',
          type: 'question',
          position: { x: 100, y: 1300 },
          data: {
            nodeType: 'question',
            label: 'Next Steps',
            content: 'What would you like to do next?',
            options: [
              'Schedule a consultation call',
              'Receive our information packet',
              'Get a custom quote',
              'Just wait for your team to contact me'
            ]
          }
        },
        {
          id: 'appointment-1',
          type: 'appointment',
          position: { x: 400, y: 1300 },
          data: {
            nodeType: 'appointment',
            label: 'Schedule Consultation',
            content: 'Excellent! Let\'s schedule a 30-minute consultation to discuss your specific needs and how we can help your business grow.'
          }
        },
        {
          id: 'message-2',
          type: 'message',
          position: { x: 700, y: 1300 },
          data: {
            nodeType: 'message',
            label: 'Information Packet',
            content: 'Great choice! We\'ll send you our comprehensive information packet within the next hour. It includes case studies, pricing details, and success stories from businesses like yours.'
          }
        },
        {
          id: 'survey-1',
          type: 'survey',
          position: { x: 100, y: 1450 },
          data: {
            nodeType: 'survey',
            label: 'Quick Feedback',
            surveyConfig: {
              title: 'How was your experience?',
              questions: [
                {
                  type: 'rating',
                  question: 'How easy was it to provide your business information?',
                  required: true
                },
                {
                  type: 'text',
                  question: 'Any suggestions for improvement?',
                  required: false
                }
              ],
              collectNPS: true
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'lead-capture-1' },
        { id: 'e2', source: 'lead-capture-1', target: 'lead-capture-2' },
        { id: 'e3', source: 'lead-capture-2', target: 'question-1' },
        { id: 'e4', source: 'question-1', target: 'lead-capture-3' },
        { id: 'e5', source: 'lead-capture-3', target: 'question-2' },
        { id: 'e6', source: 'question-2', target: 'api-webhook-1' },
        { id: 'e7', source: 'api-webhook-1', target: 'message-1' },
        { id: 'e8', source: 'message-1', target: 'question-3' },
        { id: 'e9', source: 'question-3', target: 'appointment-1', condition: 'consultation' },
        { id: 'e10', source: 'question-3', target: 'message-2', condition: 'packet' },
        { id: 'e11', source: 'question-3', target: 'survey-1', condition: 'wait' },
        { id: 'e12', source: 'appointment-1', target: 'survey-1' },
        { id: 'e13', source: 'message-2', target: 'survey-1' }
      ]
    }
  },
  {
    id: 'faq-assistant',
    name: 'FAQ Assistant',
    description: 'Intelligent FAQ bot that answers common questions and escalates complex queries to human agents.',
    category: 'support',
    icon: 'HelpCircle',
    color: 'from-green-500 to-green-600',
    difficulty: 'intermediate',
    tags: ['faq', 'support', 'ai-powered'],
    settings: {
      welcomeMessage: 'Hi! I\'m here to help answer your questions.',
      fallbackMessage: 'I\'m not sure about that. Let me connect you with a human agent who can help.'
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
            content: 'Hello! I\'m your FAQ assistant. I can help answer questions about our products, services, policies, and more. What would you like to know?'
          }
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 100, y: 250 },
          data: {
            nodeType: 'question',
            label: 'FAQ Categories',
            content: 'What topic would you like to explore?',
            options: [
              'Product Information',
              'Pricing & Billing',
              'Technical Support',
              'Account Management',
              'Shipping & Returns',
              'Ask a specific question'
            ]
          }
        },
        {
          id: 'conditional-1',
          type: 'conditional',
          position: { x: 100, y: 400 },
          data: {
            nodeType: 'conditional',
            label: 'Route by Category',
            conditions: [
              {
                variable: 'selected_category',
                operator: 'contains',
                value: 'Product',
                action: 'product'
              },
              {
                variable: 'selected_category',
                operator: 'contains',
                value: 'Pricing',
                action: 'pricing'
              },
              {
                variable: 'selected_category',
                operator: 'contains',
                value: 'Technical',
                action: 'technical'
              },
              {
                variable: 'selected_category',
                operator: 'contains',
                value: 'specific',
                action: 'ai_search'
              }
            ]
          }
        },
        {
          id: 'message-product',
          type: 'message',
          position: { x: 400, y: 400 },
          data: {
            nodeType: 'message',
            label: 'Product Information',
            content: '📦 **Product Information:**\n\n• **Features:** Our platform includes advanced analytics, automation tools, and 24/7 monitoring\n• **Compatibility:** Works with all major browsers and mobile devices\n• **Updates:** Regular feature updates and security patches\n• **Support:** Comprehensive documentation and video tutorials\n\nWhat specific product feature would you like to know more about?'
          }
        },
        {
          id: 'message-pricing',
          type: 'message',
          position: { x: 700, y: 400 },
          data: {
            nodeType: 'message',
            label: 'Pricing Information',
            content: '💰 **Pricing & Billing:**\n\n• **Starter:** $29/month - Perfect for small teams\n• **Professional:** $79/month - For growing businesses\n• **Enterprise:** $199/month - Advanced features\n\n✨ **All plans include:**\n• 30-day free trial\n• No setup fees\n• Cancel anytime\n• 24/7 support\n\nWould you like to start a free trial?'
          }
        },
        {
          id: 'message-technical',
          type: 'message',
          position: { x: 1000, y: 400 },
          data: {
            nodeType: 'message',
            label: 'Technical Support',
            content: '🔧 **Technical Support:**\n\n**Common Issues:**\n• Login problems → Reset password or clear browser cache\n• Slow performance → Check internet connection\n• Feature not working → Try refreshing the page\n\n**Need more help?**\n• Check our knowledge base\n• Contact technical support\n• Schedule a screen share session\n\nWhat technical issue are you experiencing?'
          }
        },
        {
          id: 'ai-response-1',
          type: 'ai_response',
          position: { x: 100, y: 550 },
          data: {
            nodeType: 'ai_response',
            label: 'AI FAQ Search',
            systemPrompt: 'You are a helpful FAQ assistant. Search through the knowledge base to answer user questions accurately. If you cannot find a specific answer, politely say so and offer to connect them with a human agent. Keep responses concise but helpful.'
          }
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 100, y: 700 },
          data: {
            nodeType: 'question',
            label: 'Was this helpful?',
            content: 'Did this answer your question?',
            options: ['Yes, that helped!', 'Partially helpful', 'No, I need more help', 'I have another question']
          }
        },
        {
          id: 'conditional-2',
          type: 'conditional',
          position: { x: 100, y: 850 },
          data: {
            nodeType: 'conditional',
            label: 'Follow-up Action',
            conditions: [
              {
                variable: 'helpful_response',
                operator: 'contains',
                value: 'Yes',
                action: 'satisfied'
              },
              {
                variable: 'helpful_response',
                operator: 'contains',
                value: 'another question',
                action: 'more_questions'
              },
              {
                variable: 'helpful_response',
                operator: 'contains',
                value: 'need more help',
                action: 'human_help'
              }
            ]
          }
        },
        {
          id: 'message-satisfied',
          type: 'message',
          position: { x: 400, y: 850 },
          data: {
            nodeType: 'message',
            label: 'Glad to Help',
            content: 'Wonderful! I\'m glad I could help you today. If you need anything else in the future, just come back and ask. Have a great day! 😊'
          }
        },
        {
          id: 'human-handoff-1',
          type: 'human_handoff',
          position: { x: 700, y: 850 },
          data: {
            nodeType: 'human_handoff',
            label: 'Connect to Agent',
            content: 'No problem! Let me connect you with one of our support specialists who can provide more detailed assistance.',
            handoffConfig: {
              reason: 'Complex question requiring human assistance',
              priority: 'medium',
              department: 'support'
            }
          }
        },
        {
          id: 'survey-1',
          type: 'survey',
          position: { x: 100, y: 1000 },
          data: {
            nodeType: 'survey',
            label: 'Feedback',
            surveyConfig: {
              title: 'How did we do?',
              questions: [
                {
                  type: 'rating',
                  question: 'How satisfied are you with the help you received?',
                  required: true
                },
                {
                  type: 'text',
                  question: 'How can we improve our FAQ assistant?',
                  required: false
                }
              ],
              collectNPS: true
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'question-1' },
        { id: 'e2', source: 'question-1', target: 'conditional-1' },
        { id: 'e3', source: 'conditional-1', target: 'message-product', condition: 'product' },
        { id: 'e4', source: 'conditional-1', target: 'message-pricing', condition: 'pricing' },
        { id: 'e5', source: 'conditional-1', target: 'message-technical', condition: 'technical' },
        { id: 'e6', source: 'conditional-1', target: 'ai-response-1', condition: 'ai_search' },
        { id: 'e7', source: 'message-product', target: 'question-2' },
        { id: 'e8', source: 'message-pricing', target: 'question-2' },
        { id: 'e9', source: 'message-technical', target: 'question-2' },
        { id: 'e10', source: 'ai-response-1', target: 'question-2' },
        { id: 'e11', source: 'question-2', target: 'conditional-2' },
        { id: 'e12', source: 'conditional-2', target: 'message-satisfied', condition: 'satisfied' },
        { id: 'e13', source: 'conditional-2', target: 'question-1', condition: 'more_questions' },
        { id: 'e14', source: 'conditional-2', target: 'human-handoff-1', condition: 'human_help' },
        { id: 'e15', source: 'message-satisfied', target: 'survey-1' },
        { id: 'e16', source: 'human-handoff-1', target: 'survey-1' }
      ]
    }
  },
  {
    id: 'lead-capture',
    name: 'Lead Capture & Qualification',
    description: 'Capture visitor information and qualify leads based on their needs and budget.',
    category: 'sales',
    icon: 'Target',
    color: 'from-purple-500 to-purple-600',
    difficulty: 'intermediate',
    tags: ['lead-generation', 'sales', 'qualification'],
    settings: {
      welcomeMessage: 'Welcome! Let\'s see how we can help your business grow.',
      fallbackMessage: 'I want to make sure I understand your needs correctly. Could you rephrase that?'
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
            content: 'Welcome! I\'m here to help you discover how our solutions can benefit your business. This will only take a few minutes to understand your needs better.'
          }
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 100, y: 250 },
          data: {
            nodeType: 'question',
            label: 'Visitor Type',
            content: 'What best describes you?',
            options: [
              'Business owner/decision maker',
              'Manager/team lead',
              'Individual contributor',
              'Student/researcher',
              'Just browsing'
            ]
          }
        },
        {
          id: 'conditional-1',
          type: 'conditional',
          position: { x: 100, y: 400 },
          data: {
            nodeType: 'conditional',
            label: 'Qualify Visitor',
            conditions: [
              {
                variable: 'visitor_type',
                operator: 'contains',
                value: 'owner',
                action: 'high_priority'
              },
              {
                variable: 'visitor_type',
                operator: 'contains',
                value: 'manager',
                action: 'medium_priority'
              },
              {
                variable: 'visitor_type',
                operator: 'contains',
                value: 'browsing',
                action: 'nurture'
              }
            ]
          }
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 100, y: 550 },
          data: {
            nodeType: 'question',
            label: 'Company Size',
            content: 'What\'s the size of your company?',
            options: [
              'Just me (1 person)',
              'Small team (2-10 people)',
              'Growing business (11-50 people)',
              'Medium company (51-200 people)',
              'Large enterprise (200+ people)'
            ]
          }
        },
        {
          id: 'question-3',
          type: 'question',
          position: { x: 100, y: 700 },
          data: {
            nodeType: 'question',
            label: 'Current Challenge',
            content: 'What\'s your biggest challenge right now?',
            options: [
              'Need to increase sales',
              'Improve customer service',
              'Reduce operational costs',
              'Scale the business',
              'Improve team productivity',
              'Other'
            ]
          }
        },
        {
          id: 'question-4',
          type: 'question',
          position: { x: 100, y: 850 },
          data: {
            nodeType: 'question',
            label: 'Timeline',
            content: 'When are you looking to implement a solution?',
            options: [
              'Immediately (within 1 month)',
              'Soon (1-3 months)',
              'Planning ahead (3-6 months)',
              'Just researching (6+ months)',
              'Not sure yet'
            ]
          }
        },
        {
          id: 'question-5',
          type: 'question',
          position: { x: 100, y: 1000 },
          data: {
            nodeType: 'question',
            label: 'Budget Range',
            content: 'What\'s your monthly budget for this type of solution?',
            options: [
              'Under $100',
              '$100 - $500',
              '$500 - $2,000',
              '$2,000 - $10,000',
              'Over $10,000',
              'Not sure yet'
            ]
          }
        },
        {
          id: 'conditional-2',
          type: 'conditional',
          position: { x: 100, y: 1150 },
          data: {
            nodeType: 'conditional',
            label: 'Lead Scoring',
            conditions: [
              {
                variable: 'budget',
                operator: 'contains',
                value: '2,000',
                action: 'qualified'
              },
              {
                variable: 'timeline',
                operator: 'contains',
                value: 'Immediately',
                action: 'hot_lead'
              },
              {
                variable: 'budget',
                operator: 'contains',
                value: 'Under',
                action: 'nurture'
              }
            ]
          }
        },
        {
          id: 'lead-capture-1',
          type: 'lead_capture',
          position: { x: 100, y: 1300 },
          data: {
            nodeType: 'lead_capture',
            label: 'Contact Information',
            content: 'Great! Based on your answers, I think we can definitely help you. Let me get your contact details so our team can reach out:',
            fields: [
              { name: 'name', type: 'text', required: true, label: 'Full Name' },
              { name: 'email', type: 'email', required: true, label: 'Business Email' },
              { name: 'phone', type: 'phone', required: false, label: 'Phone Number' },
              { name: 'company', type: 'text', required: true, label: 'Company Name' }
            ]
          }
        },
        {
          id: 'message-nurture',
          type: 'message',
          position: { x: 400, y: 1150 },
          data: {
            nodeType: 'message',
            label: 'Nurture Message',
            content: 'Thanks for your interest! While our premium solutions might be outside your current budget, we have some great resources that can help you get started. Would you like me to send you our free guide and keep you updated on special offers?'
          }
        },
        {
          id: 'lead-capture-nurture',
          type: 'lead_capture',
          position: { x: 400, y: 1300 },
          data: {
            nodeType: 'lead_capture',
            label: 'Nurture Contact',
            content: 'Please share your email to receive our free resources:',
            fields: [
              { name: 'email', type: 'email', required: true, label: 'Email Address' },
              { name: 'name', type: 'text', required: false, label: 'First Name (optional)' }
            ]
          }
        },
        {
          id: 'api-webhook-1',
          type: 'api_webhook',
          position: { x: 100, y: 1450 },
          data: {
            nodeType: 'api_webhook',
            label: 'Send to CRM',
            apiConfig: {
              url: 'https://your-crm.com/api/qualified-leads',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              auth: { type: 'bearer' },
              timeout: 30
            }
          }
        },
        {
          id: 'conditional-3',
          type: 'conditional',
          position: { x: 100, y: 1600 },
          data: {
            nodeType: 'conditional',
            label: 'Next Action',
            conditions: [
              {
                variable: 'lead_score',
                operator: 'equals',
                value: 'hot_lead',
                action: 'immediate_call'
              },
              {
                variable: 'lead_score',
                operator: 'equals',
                value: 'qualified',
                action: 'schedule_demo'
              }
            ]
          }
        },
        {
          id: 'message-immediate',
          type: 'message',
          position: { x: 400, y: 1600 },
          data: {
            nodeType: 'message',
            label: 'Immediate Follow-up',
            content: 'Perfect! Since you\'re looking to implement a solution immediately, I\'ve marked your inquiry as high priority. Someone from our team will call you within the next 2 hours to discuss your specific needs.'
          }
        },
        {
          id: 'appointment-1',
          type: 'appointment',
          position: { x: 700, y: 1600 },
          data: {
            nodeType: 'appointment',
            label: 'Schedule Demo',
            content: 'Excellent! Based on your needs, I think a personalized demo would be valuable. Our sales team can show you exactly how we can help with your specific challenges. Would you like to schedule a 30-minute demo?'
          }
        },
        {
          id: 'survey-1',
          type: 'survey',
          position: { x: 100, y: 1750 },
          data: {
            nodeType: 'survey',
            label: 'Lead Quality Feedback',
            surveyConfig: {
              title: 'Quick feedback',
              questions: [
                {
                  type: 'rating',
                  question: 'How relevant were the questions we asked?',
                  required: true
                },
                {
                  type: 'text',
                  question: 'What other information would have been helpful to provide?',
                  required: false
                }
              ]
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'question-1' },
        { id: 'e2', source: 'question-1', target: 'conditional-1' },
        { id: 'e3', source: 'conditional-1', target: 'question-2' },
        { id: 'e4', source: 'question-2', target: 'question-3' },
        { id: 'e5', source: 'question-3', target: 'question-4' },
        { id: 'e6', source: 'question-4', target: 'question-5' },
        { id: 'e7', source: 'question-5', target: 'conditional-2' },
        { id: 'e8', source: 'conditional-2', target: 'lead-capture-1', condition: 'qualified' },
        { id: 'e9', source: 'conditional-2', target: 'message-nurture', condition: 'nurture' },
        { id: 'e10', source: 'message-nurture', target: 'lead-capture-nurture' },
        { id: 'e11', source: 'lead-capture-1', target: 'api-webhook-1' },
        { id: 'e12', source: 'lead-capture-nurture', target: 'api-webhook-1' },
        { id: 'e13', source: 'api-webhook-1', target: 'conditional-3' },
        { id: 'e14', source: 'conditional-3', target: 'message-immediate', condition: 'immediate_call' },
        { id: 'e15', source: 'conditional-3', target: 'appointment-1', condition: 'schedule_demo' },
        { id: 'e16', source: 'message-immediate', target: 'survey-1' },
        { id: 'e17', source: 'appointment-1', target: 'survey-1' }
      ]
    }
  },
  {
    id: 'appointment-booking',
    name: 'Appointment Booking Assistant',
    description: 'Guide users through service selection and appointment scheduling with calendar integration.',
    category: 'business',
    icon: 'Calendar',
    color: 'from-orange-500 to-orange-600',
    difficulty: 'advanced',
    tags: ['appointments', 'scheduling', 'services'],
    settings: {
      welcomeMessage: 'Hello! I\'ll help you book an appointment that fits your schedule.',
      fallbackMessage: 'Let me help you with that. Could you please choose from the available options?'
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
            content: 'Hello! I\'m here to help you book an appointment. I\'ll guide you through selecting the right service and finding a time that works for you.'
          }
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 100, y: 250 },
          data: {
            nodeType: 'question',
            label: 'Service Selection',
            content: 'What type of service are you looking for?',
            options: [
              'Initial Consultation (30 min)',
              'Strategy Session (60 min)',
              'Full Assessment (90 min)',
              'Follow-up Meeting (30 min)',
              'Custom Service'
            ]
          }
        },
        {
          id: 'conditional-1',
          type: 'conditional',
          position: { x: 100, y: 400 },
          data: {
            nodeType: 'conditional',
            label: 'Service Type Check',
            conditions: [
              {
                variable: 'service_type',
                operator: 'contains',
                value: 'Custom',
                action: 'custom'
              },
              {
                variable: 'service_type',
                operator: 'contains',
                value: 'Consultation',
                action: 'standard'
              }
            ]
          }
        },
        {
          id: 'lead-capture-custom',
          type: 'lead_capture',
          position: { x: 400, y: 400 },
          data: {
            nodeType: 'lead_capture',
            label: 'Custom Service Details',
            content: 'Please tell us more about your custom service needs:',
            fields: [
              { name: 'custom_service', type: 'text', required: true, label: 'Describe your needs' },
              { name: 'estimated_duration', type: 'text', required: false, label: 'Estimated duration' },
              { name: 'special_requirements', type: 'text', required: false, label: 'Any special requirements?' }
            ]
          }
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 100, y: 550 },
          data: {
            nodeType: 'question',
            label: 'Meeting Preference',
            content: 'How would you prefer to meet?',
            options: [
              'In-person at our office',
              'Video call (Zoom/Teams)',
              'Phone call',
              'At your location'
            ]
          }
        },
        {
          id: 'question-3',
          type: 'question',
          position: { x: 100, y: 700 },
          data: {
            nodeType: 'question',
            label: 'Time Preference',
            content: 'What time of day works best for you?',
            options: [
              'Morning (9 AM - 12 PM)',
              'Afternoon (12 PM - 5 PM)',
              'Evening (5 PM - 8 PM)',
              'I\'m flexible'
            ]
          }
        },
        {
          id: 'question-4',
          type: 'question',
          position: { x: 100, y: 850 },
          data: {
            nodeType: 'question',
            label: 'Day Preference',
            content: 'Which days work best for you?',
            options: [
              'Weekdays only',
              'Weekends only',
              'Any day is fine',
              'Specific days (I\'ll specify)'
            ]
          }
        },
        {
          id: 'question-5',
          type: 'question',
          position: { x: 100, y: 1000 },
          data: {
            nodeType: 'question',
            label: 'Urgency',
            content: 'How soon do you need this appointment?',
            options: [
              'This week',
              'Next week',
              'Within 2 weeks',
              'Within a month',
              'I\'m flexible'
            ]
          }
        },
        {
          id: 'lead-capture-contact',
          type: 'lead_capture',
          position: { x: 100, y: 1150 },
          data: {
            nodeType: 'lead_capture',
            label: 'Contact Information',
            content: 'Great! Now I need your contact information to confirm the appointment:',
            fields: [
              { name: 'full_name', type: 'text', required: true, label: 'Full Name' },
              { name: 'email', type: 'email', required: true, label: 'Email Address' },
              { name: 'phone', type: 'phone', required: true, label: 'Phone Number' },
              { name: 'company', type: 'text', required: false, label: 'Company (optional)' }
            ]
          }
        },
        {
          id: 'api-webhook-availability',
          type: 'api_webhook',
          position: { x: 100, y: 1300 },
          data: {
            nodeType: 'api_webhook',
            label: 'Check Availability',
            apiConfig: {
              url: 'https://your-calendar-api.com/availability',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              auth: { type: 'api_key' },
              timeout: 30
            }
          }
        },
        {
          id: 'appointment-1',
          type: 'appointment',
          position: { x: 100, y: 1450 },
          data: {
            nodeType: 'appointment',
            label: 'Schedule Appointment',
            content: 'Perfect! Based on your preferences, here are some available time slots. Please select your preferred appointment time:'
          }
        },
        {
          id: 'api-webhook-confirm',
          type: 'api_webhook',
          position: { x: 100, y: 1600 },
          data: {
            nodeType: 'api_webhook',
            label: 'Confirm Booking',
            apiConfig: {
              url: 'https://your-calendar-api.com/book',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              auth: { type: 'api_key' },
              timeout: 30
            }
          }
        },
        {
          id: 'message-confirmation',
          type: 'message',
          position: { x: 100, y: 1750 },
          data: {
            nodeType: 'message',
            label: 'Confirmation',
            content: 'Excellent! Your appointment has been confirmed. You\'ll receive a confirmation email shortly with:\n\n• Meeting details and location\n• Calendar invite\n• Preparation materials\n• Contact information\n\nWe\'re looking forward to meeting with you!'
          }
        },
        {
          id: 'question-6',
          type: 'question',
          position: { x: 100, y: 1900 },
          data: {
            nodeType: 'question',
            label: 'Additional Services',
            content: 'Is there anything else I can help you with today?',
            options: [
              'Book another appointment',
              'Get more information about our services',
              'Speak with someone now',
              'That\'s all for now'
            ]
          }
        },
        {
          id: 'survey-1',
          type: 'survey',
          position: { x: 100, y: 2050 },
          data: {
            nodeType: 'survey',
            label: 'Booking Experience',
            surveyConfig: {
              title: 'How was your booking experience?',
              questions: [
                {
                  type: 'rating',
                  question: 'How easy was it to book your appointment?',
                  required: true
                },
                {
                  type: 'text',
                  question: 'Any suggestions to improve our booking process?',
                  required: false
                }
              ]
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'question-1' },
        { id: 'e2', source: 'question-1', target: 'conditional-1' },
        { id: 'e3', source: 'conditional-1', target: 'lead-capture-custom', condition: 'custom' },
        { id: 'e4', source: 'conditional-1', target: 'question-2', condition: 'standard' },
        { id: 'e5', source: 'lead-capture-custom', target: 'question-2' },
        { id: 'e6', source: 'question-2', target: 'question-3' },
        { id: 'e7', source: 'question-3', target: 'question-4' },
        { id: 'e8', source: 'question-4', target: 'question-5' },
        { id: 'e9', source: 'question-5', target: 'lead-capture-contact' },
        { id: 'e10', source: 'lead-capture-contact', target: 'api-webhook-availability' },
        { id: 'e11', source: 'api-webhook-availability', target: 'appointment-1' },
        { id: 'e12', source: 'appointment-1', target: 'api-webhook-confirm' },
        { id: 'e13', source: 'api-webhook-confirm', target: 'message-confirmation' },
        { id: 'e14', source: 'message-confirmation', target: 'question-6' },
        { id: 'e15', source: 'question-6', target: 'survey-1' }
      ]
    }
  }
];

export const getTemplatesByCategory = (category: string) => {
  return chatbotTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return chatbotTemplates.find(template => template.id === id);
};

export const getTemplatesByDifficulty = (difficulty: string) => {
  return chatbotTemplates.filter(template => template.difficulty === difficulty);
};