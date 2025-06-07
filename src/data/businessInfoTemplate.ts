export const businessInfoTemplate = {
  id: "business-info",
  name: "Business Information Collector",
  description:
    "Gather comprehensive business details from visitors including company info, industry, and contact details.",
  category: "business" as const,
  icon: "Building2",
  color: "from-blue-500 to-blue-600",
  difficulty: "beginner" as const,
  tags: ["lead-generation", "business", "information-collection"],
  settings: {
    welcomeMessage: "Welcome! I'd love to learn more about your business.",
    fallbackMessage:
      "I didn't quite understand that. Could you please clarify?",
  },
  flow: {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: {
          nodeType: "start",
          label: "Welcome",
          content:
            "Hello! I'm here to learn more about your business. This will help us provide you with the best possible service. Shall we get started?",
        },
      },
      {
        id: "question-1",
        type: "question",
        position: { x: 100, y: 250 },
        data: {
          nodeType: "question",
          label: "Ready to Start?",
          content:
            "Are you ready to share some information about your business?",
          options: [
            "Yes, let's start!",
            "I need more information first",
            "Maybe later",
          ],
        },
      },
      {
        id: "conditional-1",
        type: "conditional",
        position: { x: 100, y: 400 },
        data: {
          nodeType: "conditional",
          label: "Check Response",
          conditions: [
            {
              variable: "user_response",
              operator: "contains",
              value: "yes",
              action: "continue",
            },
            {
              variable: "user_response",
              operator: "contains",
              value: "information",
              action: "explain",
            },
          ],
        },
      },
      {
        id: "message-1",
        type: "message",
        position: { x: 400, y: 400 },
        data: {
          nodeType: "message",
          label: "Explanation",
          content:
            "I understand! This information helps us:\n• Provide relevant recommendations\n• Connect you with the right team\n• Customize our services for your needs\n\nAll information is kept confidential. Ready to proceed?",
        },
      },
      {
        id: "lead-capture-1",
        type: "lead_capture",
        position: { x: 100, y: 550 },
        data: {
          nodeType: "lead_capture",
          label: "Business Details",
          content: "Great! Let's start with your business information:",
          fields: [
            {
              name: "business_name",
              type: "text",
              required: true,
              label: "Business Name",
            },
            {
              name: "industry",
              type: "text",
              required: true,
              label: "Industry",
            },
            {
              name: "business_size",
              type: "text",
              required: false,
              label: "Company Size",
            },
            {
              name: "location",
              type: "text",
              required: true,
              label: "Location (City, State)",
            },
          ],
        },
      },
      {
        id: "lead-capture-2",
        type: "lead_capture",
        position: { x: 100, y: 700 },
        data: {
          nodeType: "lead_capture",
          label: "Contact Information",
          content: "Now, let's get your contact details:",
          fields: [
            {
              name: "contact_name",
              type: "text",
              required: true,
              label: "Your Name",
            },
            {
              name: "email",
              type: "email",
              required: true,
              label: "Email Address",
            },
            {
              name: "phone",
              type: "phone",
              required: false,
              label: "Phone Number",
            },
            {
              name: "website",
              type: "text",
              required: false,
              label: "Website URL",
            },
          ],
        },
      },
      {
        id: "lead-capture-3",
        type: "lead_capture",
        position: { x: 100, y: 850 },
        data: {
          nodeType: "lead_capture",
          label: "Business Hours & Services",
          content: "Finally, tell us about your operations:",
          fields: [
            {
              name: "business_hours",
              type: "text",
              required: false,
              label: "Business Hours",
            },
            {
              name: "services",
              type: "text",
              required: false,
              label: "Main Services/Products",
            },
            {
              name: "target_audience",
              type: "text",
              required: false,
              label: "Target Customers",
            },
          ],
        },
      },
      {
        id: "api-webhook-1",
        type: "api_webhook",
        position: { x: 100, y: 1000 },
        data: {
          nodeType: "api_webhook",
          label: "Save to CRM",
          apiConfig: {
            url: "https://your-crm.com/api/leads",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            auth: { type: "api_key" },
            timeout: 30,
          },
        },
      },
      {
        id: "message-2",
        type: "message",
        position: { x: 100, y: 1150 },
        data: {
          nodeType: "message",
          label: "Thank You",
          content:
            "Perfect! Thank you for sharing your business information with us. Our team will review your details and get back to you within 24 hours with personalized recommendations.\n\nIs there anything specific you'd like to know about our services?",
        },
      },
      {
        id: "survey-1",
        type: "survey",
        position: { x: 100, y: 1300 },
        data: {
          nodeType: "survey",
          label: "Quick Feedback",
          surveyConfig: {
            title: "How was your experience?",
            questions: [
              {
                type: "rating",
                question:
                  "How easy was it to provide your business information?",
                required: true,
              },
              {
                type: "text",
                question: "Any suggestions for improvement?",
                required: false,
              },
            ],
            collectNPS: true,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "question-1" },
      { id: "e2", source: "question-1", target: "conditional-1" },
      {
        id: "e3",
        source: "conditional-1",
        target: "message-1",
        condition: "explain",
      },
      {
        id: "e4",
        source: "conditional-1",
        target: "lead-capture-1",
        condition: "continue",
      },
      { id: "e5", source: "message-1", target: "lead-capture-1" },
      { id: "e6", source: "lead-capture-1", target: "lead-capture-2" },
      { id: "e7", source: "lead-capture-2", target: "lead-capture-3" },
      { id: "e8", source: "lead-capture-3", target: "api-webhook-1" },
      { id: "e9", source: "api-webhook-1", target: "message-2" },
      { id: "e10", source: "message-2", target: "survey-1" },
    ],
  },
};
