export interface FAQQuestion {
  question: string;
  answer: string;
  keywords: string[];
}

export interface FAQCategory {
  category: string;
  questions: FAQQuestion[];
}

export const appFAQ: FAQCategory[] = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create my first chatbot?",
        answer:
          "To create your first chatbot, click the 'New Chatbot' button in your dashboard. You can either start from scratch or choose from our professional templates. Our drag-and-drop builder makes it easy to create sophisticated conversation flows without any coding knowledge.",
        keywords: [
          "create",
          "first",
          "chatbot",
          "new",
          "start",
          "begin",
          "build",
          "make",
        ],
      },
      {
        question: "What templates are available?",
        answer:
          "We offer several professional templates including Customer Support Bot, Lead Generation Bot, FAQ Assistant, Appointment Booking Bot, and E-commerce Assistant. Each template is fully customizable and includes pre-built conversation flows optimized for specific use cases.",
        keywords: [
          "templates",
          "available",
          "types",
          "examples",
          "pre-built",
          "ready",
        ],
      },
      {
        question: "Do I need coding skills to use BotForge?",
        answer:
          "No coding skills required! BotForge is designed as a no-code platform. Our visual drag-and-drop interface allows you to create sophisticated chatbots using simple point-and-click actions. However, if you're a developer, you can also access advanced features and integrations.",
        keywords: [
          "coding",
          "skills",
          "programming",
          "technical",
          "no-code",
          "easy",
        ],
      },
      {
        question: "How long does it take to build a chatbot?",
        answer:
          "With our templates, you can have a basic chatbot running in under 10 minutes. More complex, custom chatbots typically take 30-60 minutes to build. The time depends on the complexity of your conversation flows and the number of integrations you need.",
        keywords: [
          "time",
          "duration",
          "how long",
          "quick",
          "fast",
          "minutes",
          "hours",
        ],
      },
    ],
  },
  {
    category: "NPM Package Integration",
    questions: [
      {
        question: "How do I install the BotForge widget package?",
        answer:
          "Install the widget using npm: `npm install @botforge/widget`. The package supports React, Vue, Angular, and vanilla JavaScript. It includes TypeScript definitions and works with all modern bundlers like Webpack, Vite, and Rollup.",
        keywords: [
          "npm",
          "install",
          "package",
          "widget",
          "integration",
          "setup",
        ],
      },
      {
        question: "Which frameworks are supported by the NPM package?",
        answer:
          "The @botforge/widget package supports React 16.8+, Vue 2 & 3, Angular 10+, and vanilla JavaScript. It's framework-agnostic and can be used with any modern web framework or static site generator like Next.js, Nuxt.js, Gatsby, or plain HTML.",
        keywords: [
          "frameworks",
          "react",
          "vue",
          "angular",
          "javascript",
          "support",
          "compatibility",
        ],
      },
      {
        question: "How do I customize the widget appearance?",
        answer:
          "The widget is highly customizable through the theme prop. You can change colors, sizes, positioning, fonts, and more. All styling is done through JavaScript configuration - no CSS files needed. The widget also supports custom CSS for advanced styling.",
        keywords: [
          "customize",
          "theme",
          "styling",
          "appearance",
          "colors",
          "design",
        ],
      },
      {
        question: "Can I control the widget programmatically?",
        answer:
          "Yes! The widget provides a complete API for programmatic control. You can open/close the chat, send messages, update user information, and listen to events. Use React refs or the vanilla JS API to access these methods.",
        keywords: [
          "api",
          "control",
          "programmatic",
          "methods",
          "events",
          "javascript",
        ],
      },
      {
        question: "How do I handle widget events?",
        answer:
          "The widget supports comprehensive event handling through the events prop. You can listen for onOpen, onClose, onMessage, onUserMessage, onBotMessage, onError, and onReady events. This allows you to integrate the widget with your analytics, logging, or other systems.",
        keywords: [
          "events",
          "callbacks",
          "listeners",
          "onMessage",
          "onOpen",
          "onClose",
        ],
      },
      {
        question: "Is the NPM package TypeScript compatible?",
        answer:
          "Yes! The package includes full TypeScript definitions out of the box. All interfaces, types, and API methods are properly typed. You get full IntelliSense support and type safety when using the widget in TypeScript projects.",
        keywords: [
          "typescript",
          "types",
          "definitions",
          "intellisense",
          "type safety",
        ],
      },
    ],
  },
  {
    category: "AI Features",
    questions: [
      {
        question: "What AI features are available?",
        answer:
          "BotForge includes OpenAI integration for natural language processing, intelligent FAQ responses, document processing for training data, intent recognition, and context-aware conversations. Pro and Enterprise plans include advanced AI features like custom model training and multi-language support.",
        keywords: [
          "ai",
          "artificial intelligence",
          "openai",
          "nlp",
          "smart",
          "intelligent",
        ],
      },
      {
        question: "How do I set up OpenAI integration?",
        answer:
          "OpenAI integration is handled server-side for security. Simply enable AI features in your chatbot settings, and our system will use OpenAI's models to generate intelligent responses. No API keys needed on your end - we handle all the complexity securely.",
        keywords: [
          "openai",
          "setup",
          "integration",
          "api",
          "gpt",
          "configuration",
        ],
      },
      {
        question: "Can I upload FAQ documents for training?",
        answer:
          "Yes! Pro and Enterprise users can upload FAQ documents in TXT, CSV, or PDF format. Our AI automatically extracts questions and answers, generates relevant keywords, and trains your chatbot to provide accurate responses based on your content.",
        keywords: [
          "faq",
          "upload",
          "documents",
          "training",
          "pdf",
          "csv",
          "txt",
        ],
      },
      {
        question: "How does AI response generation work?",
        answer:
          "Our AI system combines your chatbot's conversation flow with uploaded FAQ content and OpenAI's language models. It understands context, maintains conversation history, and generates human-like responses that match your brand voice and knowledge base.",
        keywords: [
          "ai response",
          "generation",
          "context",
          "conversation",
          "natural language",
        ],
      },
    ],
  },
  {
    category: "Deployment & Integration",
    questions: [
      {
        question: "How do I add the chatbot to my website?",
        answer:
          "There are three ways to integrate: 1) NPM package (recommended) for modern frameworks, 2) Simple script tag for any website, or 3) Iframe embed for full isolation. The NPM package offers the best performance and customization options.",
        keywords: [
          "website",
          "integration",
          "embed",
          "deploy",
          "install",
          "add",
        ],
      },
      {
        question: "Can I deploy to multiple channels?",
        answer:
          "Yes! BotForge supports multi-channel deployment including your website, WhatsApp Business, Facebook Messenger, and more. Pro and Enterprise plans include advanced channel management and unified analytics across all platforms.",
        keywords: [
          "multi-channel",
          "whatsapp",
          "facebook",
          "messenger",
          "channels",
          "platforms",
        ],
      },
      {
        question: "How do I set up WhatsApp integration?",
        answer:
          "WhatsApp integration requires a Facebook Business account and WhatsApp Business API access. Our step-by-step wizard guides you through the setup process, including webhook configuration and phone number verification. This feature is available on Pro and Enterprise plans.",
        keywords: [
          "whatsapp",
          "integration",
          "facebook",
          "business",
          "api",
          "setup",
        ],
      },
      {
        question: "Is the widget mobile-responsive?",
        answer:
          "Absolutely! The widget is fully responsive and optimized for all devices including mobile phones, tablets, and desktops. It automatically adapts its size and behavior based on the screen size and device capabilities.",
        keywords: [
          "mobile",
          "responsive",
          "tablet",
          "desktop",
          "device",
          "adaptive",
        ],
      },
    ],
  },
  {
    category: "Analytics & Performance",
    questions: [
      {
        question: "What analytics are available?",
        answer:
          "BotForge provides comprehensive analytics including conversation metrics, user engagement data, goal completion rates, satisfaction scores, and performance insights. Advanced analytics with A/B testing and funnel analysis are available on Pro and Enterprise plans.",
        keywords: [
          "analytics",
          "metrics",
          "data",
          "insights",
          "performance",
          "tracking",
        ],
      },
      {
        question: "How do I view conversation history?",
        answer:
          "Access detailed conversation logs in the Analytics section. You can view individual conversations, search by user or content, export data for compliance, and analyze conversation patterns. All data is stored securely and can be anonymized for privacy compliance.",
        keywords: [
          "conversation",
          "history",
          "logs",
          "view",
          "search",
          "export",
        ],
      },
      {
        question: "Can I A/B test different chatbots?",
        answer:
          "Yes! Pro and Enterprise plans include A/B testing capabilities. You can test different conversation flows, response styles, or entire chatbot configurations to optimize performance and conversion rates. Our system automatically tracks and reports results.",
        keywords: [
          "ab testing",
          "split testing",
          "optimization",
          "conversion",
          "performance",
        ],
      },
      {
        question: "How do I export conversation data?",
        answer:
          "Conversation data can be exported in CSV or JSON format from the Analytics dashboard. You can filter by date range, user, or conversation outcome. This is useful for compliance, analysis, or integrating with external systems.",
        keywords: ["export", "data", "csv", "json", "download", "backup"],
      },
    ],
  },
  {
    category: "Pricing & Plans",
    questions: [
      {
        question: "What's included in the Free plan?",
        answer:
          "The Free plan includes 1 chatbot, 100 messages per month, basic templates, website deployment, and email support. It's perfect for trying out the platform and small personal projects.",
        keywords: ["free", "plan", "included", "limitations", "trial", "basic"],
      },
      {
        question: "What are the Pro plan benefits?",
        answer:
          "Pro plan ($29/month) includes 5 chatbots, 5,000 messages/month, AI-powered responses, multi-channel deployment, advanced analytics, A/B testing, FAQ upload, and priority support. Perfect for growing businesses.",
        keywords: ["pro", "plan", "benefits", "features", "pricing", "upgrade"],
      },
      {
        question: "What does Enterprise include?",
        answer:
          "Enterprise plan ($99/month) includes unlimited chatbots and messages, advanced AI features, white-label solution, custom integrations, dedicated support, SLA guarantee, and advanced security features. Ideal for large organizations.",
        keywords: [
          "enterprise",
          "unlimited",
          "white-label",
          "custom",
          "dedicated",
          "sla",
        ],
      },
      {
        question: "How do I upgrade my plan?",
        answer:
          "You can upgrade your plan anytime from the Settings page. Click 'Manage Plan' to view options and upgrade instantly. Billing is prorated, and new features are available immediately after upgrade.",
        keywords: [
          "upgrade",
          "plan",
          "billing",
          "payment",
          "change",
          "subscription",
        ],
      },
    ],
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "What browsers are supported?",
        answer:
          "BotForge works on all modern browsers including Chrome 60+, Firefox 60+, Safari 12+, and Edge 79+. The widget is optimized for performance and works on both desktop and mobile browsers.",
        keywords: [
          "browsers",
          "support",
          "chrome",
          "firefox",
          "safari",
          "edge",
          "compatibility",
        ],
      },
      {
        question: "How do I troubleshoot integration issues?",
        answer:
          "Common integration issues include incorrect chatbot ID, CORS errors, or missing dependencies. Check our troubleshooting guide in the documentation, verify your configuration, and ensure your chatbot is published. Contact support if issues persist.",
        keywords: [
          "troubleshoot",
          "issues",
          "problems",
          "errors",
          "debug",
          "help",
        ],
      },
      {
        question: "Is there API documentation available?",
        answer:
          "Yes! Complete API documentation is available at /widget/docs.html. It includes detailed examples for all frameworks, configuration options, event handling, and troubleshooting guides. The documentation is regularly updated with new features.",
        keywords: [
          "api",
          "documentation",
          "docs",
          "reference",
          "guide",
          "examples",
        ],
      },
      {
        question: "How do I get technical support?",
        answer:
          "Free users get email support, Pro users get priority email support, and Enterprise users get dedicated support with SLA guarantees. You can also access our help documentation, community forum, and live chat during business hours.",
        keywords: [
          "support",
          "help",
          "contact",
          "technical",
          "assistance",
          "email",
        ],
      },
    ],
  },
];

// Helper function to search FAQ
export function searchFAQ(query: string): FAQQuestion[] {
  const queryLower = query.toLowerCase();
  const results: FAQQuestion[] = [];

  appFAQ.forEach((category) => {
    category.questions.forEach((faq) => {
      const questionMatch = faq.question.toLowerCase().includes(queryLower);
      const answerMatch = faq.answer.toLowerCase().includes(queryLower);
      const keywordMatch = faq.keywords.some(
        (keyword) =>
          keyword.toLowerCase().includes(queryLower) ||
          queryLower.includes(keyword.toLowerCase())
      );

      if (questionMatch || answerMatch || keywordMatch) {
        results.push({ ...faq, category: category.category } as any);
      }
    });
  });

  return results;
}

// Helper function to get all categories
export function getAllCategories(): string[] {
  return appFAQ.map((category) => category.category);
}
