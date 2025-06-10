export interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  code?: string;
  warning?: string;
  note?: string;
}

export interface QuickStartGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  icon: string;
  steps: QuickStartStep[];
  tips: string[];
  troubleshooting: Array<{
    problem: string;
    solution: string;
  }>;
  nextSteps: string[];
}

export const quickStartGuides: QuickStartGuide[] = [
  {
    id: "create-first-chatbot",
    title: "Create Your First Chatbot",
    description:
      "Step-by-step guide to building your first chatbot in under 10 minutes",
    category: "Getting Started",
    difficulty: "beginner",
    estimatedTime: "5 min",
    icon: "Zap",
    steps: [
      {
        id: "step-1",
        title: "Access the Chatbot Builder",
        description:
          "Navigate to the chatbot creation interface and get familiar with the workspace.",
        action:
          '1. Click on "New Chatbot" button in the sidebar\n2. You\'ll be taken to the chatbot builder interface\n3. Take a moment to explore the different panels and tools available',
        note: "The builder interface consists of three main areas: the node palette (left), the canvas (center), and the properties panel (right).",
      },
      {
        id: "step-2",
        title: "Choose a Template or Start from Scratch",
        description:
          "Select a pre-built template that matches your use case or create a custom flow.",
        action:
          '1. Click "Choose Template" to browse available templates\n2. Select a template that matches your needs (e.g., "Customer Support Bot")\n3. Alternatively, click "Start from Scratch" for a blank canvas',
        note: "Templates provide a great starting point and include best practices for common use cases.",
      },
      {
        id: "step-3",
        title: "Configure Basic Settings",
        description:
          "Set up your chatbot's name, description, and basic personality.",
        action:
          "1. Enter a descriptive name for your chatbot\n2. Add a brief description of what your bot does\n3. These details help you organize multiple bots later",
        code: 'Example:\nName: "Customer Support Assistant"\nDescription: "Helps customers with common questions and routes complex issues to human agents"',
      },
      {
        id: "step-4",
        title: "Design Your Conversation Flow",
        description:
          "Add nodes and connect them to create your chatbot's conversation logic.",
        action:
          '1. Drag a "Start" node from the palette to the canvas\n2. Add a "Message" node and connect it to the start\n3. Configure the welcome message in the properties panel\n4. Add a "Question" node with multiple choice options\n5. Connect the question to different response paths',
        warning:
          'Always start with a "Start" node - this is where every conversation begins.',
      },
      {
        id: "step-5",
        title: "Test Your Chatbot",
        description:
          "Use the built-in simulator to test your conversation flow.",
        action:
          '1. Click the "Test Bot" button in the sidebar\n2. Try different conversation paths\n3. Check that all responses work as expected\n4. Make adjustments as needed',
        note: "Testing is crucial - always test every possible conversation path before publishing.",
      },
      {
        id: "step-6",
        title: "Publish Your Chatbot",
        description: "Make your chatbot live and ready to interact with users.",
        action:
          '1. Click "Save Flow" to save your work\n2. Click "Publish" to make your bot live\n3. Your bot is now ready to handle real conversations!',
        note: "Published bots can be deployed to your website, WhatsApp, or other channels.",
      },
    ],
    tips: [
      "Start simple - you can always add complexity later",
      "Use clear, conversational language in your messages",
      "Test every conversation path thoroughly",
      "Keep your initial flow focused on one main goal",
      "Use templates as inspiration even if you start from scratch",
    ],
    troubleshooting: [
      {
        problem: "My chatbot isn't responding",
        solution:
          'Check that you have a "Start" node and that all nodes are properly connected. Ensure your bot is published.',
      },
      {
        problem: "Users are getting stuck in the conversation",
        solution:
          'Add fallback responses and ensure every question has clear answer options. Consider adding a "human handoff" option.',
      },
      {
        problem: "The flow seems too complex",
        solution:
          "Break down complex flows into smaller, focused conversations. Use conditional logic to route users appropriately.",
      },
    ],
    nextSteps: [
      "Learn about AI-powered responses to make your bot smarter",
      "Explore multi-channel deployment options",
      "Set up analytics to track your bot's performance",
      "Add advanced features like lead capture and integrations",
    ],
  },
  {
    id: "ai-faq-setup",
    title: "AI-Powered FAQ Setup",
    description:
      "Learn how to upload documents and create intelligent FAQ responses",
    category: "AI Features",
    difficulty: "intermediate",
    estimatedTime: "8 min",
    icon: "Brain",
    steps: [
      {
        id: "step-1",
        title: "Prepare Your FAQ Documents",
        description:
          "Organize your knowledge base documents for optimal AI processing.",
        action:
          "1. Gather your FAQ documents, manuals, or knowledge base content\n2. Ensure documents are in supported formats (TXT, CSV, PDF)\n3. Clean up formatting and remove unnecessary content\n4. Organize content with clear questions and answers",
        code: "Supported formats:\n• TXT files with Q: and A: format\n• CSV files with question,answer columns\n• PDF documents with structured content",
        note: "Well-structured documents lead to better AI extraction and more accurate responses.",
      },
      {
        id: "step-2",
        title: "Access the FAQ Uploader",
        description:
          "Navigate to the FAQ upload feature in your chatbot builder.",
        action:
          '1. Open your chatbot in the builder\n2. Look for "Upload FAQ" in the Advanced Features section\n3. Click to open the FAQ document uploader interface',
        note: "FAQ upload is available for Pro and Enterprise plans. Free users can manually create FAQ entries.",
      },
      {
        id: "step-3",
        title: "Upload Your Documents",
        description: "Upload your FAQ documents for AI processing.",
        action:
          '1. Drag and drop your files into the upload area\n2. Or click "browse" to select files from your computer\n3. You can upload multiple files at once\n4. Wait for the upload to complete',
        warning:
          "File size limit is 10MB per file. Larger documents should be split into smaller sections.",
      },
      {
        id: "step-4",
        title: "AI Processing and Extraction",
        description:
          "Let our AI analyze your documents and extract FAQ entries.",
        action:
          "1. Watch the processing status for each uploaded file\n2. The AI will automatically extract questions and answers\n3. Keywords and categories are generated automatically\n4. Processing time varies based on document size and complexity",
        note: "Our AI uses advanced natural language processing to understand context and extract meaningful FAQ pairs.",
      },
      {
        id: "step-5",
        title: "Review and Refine Extracted FAQs",
        description:
          "Review the AI-extracted FAQ entries and make improvements.",
        action:
          "1. Review the extracted questions and answers\n2. Edit any entries that need clarification\n3. Add additional keywords if needed\n4. Remove or merge duplicate entries\n5. Organize entries by category",
        note: "Human review ensures the highest quality responses for your users.",
      },
      {
        id: "step-6",
        title: "Configure AI Response Node",
        description:
          "Add an AI Response node to your chatbot flow to use the FAQ data.",
        action:
          '1. Drag an "AI Response" node to your canvas\n2. Connect it to appropriate conversation paths\n3. Configure the system prompt to reference your FAQ data\n4. Set fallback responses for when no FAQ match is found',
        code: 'Example system prompt:\n"You are a helpful customer service assistant. Use the uploaded FAQ data to answer questions accurately. If you don\'t find a relevant answer, politely ask the user to rephrase or offer to connect them with a human agent."',
      },
      {
        id: "step-7",
        title: "Test AI Responses",
        description: "Test your AI-powered FAQ responses to ensure accuracy.",
        action:
          "1. Use the chatbot simulator to test various questions\n2. Try questions that should match your FAQ entries\n3. Test edge cases and unclear questions\n4. Verify that fallback responses work correctly\n5. Adjust system prompts as needed",
        note: "Regular testing helps maintain high-quality AI responses as you add more content.",
      },
    ],
    tips: [
      "Use clear, specific questions in your FAQ documents",
      "Include common variations of questions users might ask",
      "Regularly update your FAQ content to keep it current",
      "Monitor AI responses and refine prompts based on user interactions",
      "Consider adding a feedback mechanism to improve AI accuracy over time",
    ],
    troubleshooting: [
      {
        problem: "AI extracted incorrect or irrelevant FAQ entries",
        solution:
          "Review your document structure. Use clear Q: and A: formatting. Consider breaking complex documents into smaller, focused sections.",
      },
      {
        problem: "AI responses are too generic or unhelpful",
        solution:
          "Refine your system prompt to be more specific about your business context. Add more detailed FAQ entries with examples.",
      },
      {
        problem: "Upload fails or processing takes too long",
        solution:
          "Check file size (max 10MB) and format. Try splitting large documents. Ensure stable internet connection during upload.",
      },
    ],
    nextSteps: [
      "Set up conversation analytics to track FAQ effectiveness",
      "Implement user feedback collection to improve AI responses",
      "Explore advanced AI features like sentiment analysis",
      "Consider integrating with your existing knowledge management system",
    ],
  },
  {
    id: "multi-channel-deployment",
    title: "Multi-Channel Deployment",
    description: "Deploy your chatbot to website, WhatsApp, and other channels",
    category: "Deployment",
    difficulty: "advanced",
    estimatedTime: "12 min",
    icon: "Globe",
    steps: [
      {
        id: "step-1",
        title: "Prepare Your Chatbot for Deployment",
        description:
          "Ensure your chatbot is ready for multi-channel deployment.",
        action:
          "1. Complete and test your chatbot flow thoroughly\n2. Publish your chatbot to make it live\n3. Review all conversation paths for different channel contexts\n4. Ensure your bot handles various input types (text, quick replies, etc.)",
        warning:
          "Different channels have different capabilities. Test your bot on each channel to ensure compatibility.",
      },
      {
        id: "step-2",
        title: "Website Integration",
        description:
          "Add your chatbot to your website with a customizable widget.",
        action:
          '1. Go to Multi-Channel Setup in your chatbot settings\n2. Select "Website" as your deployment channel\n3. Customize the chat widget appearance and behavior\n4. Copy the provided embed code\n5. Add the code to your website\'s HTML',
        code: '<!-- Add this code before closing </body> tag -->\n<script>\n  window.chatbotConfig = {\n    botId: "your-bot-id",\n    theme: "blue",\n    position: "bottom-right"\n  };\n</script>\n<script src="https://cdn.BotForge.site/widget.js"></script>',
        note: "The widget is responsive and works on both desktop and mobile devices.",
      },
      {
        id: "step-3",
        title: "WhatsApp Business Setup",
        description: "Connect your chatbot to WhatsApp Business for messaging.",
        action:
          '1. Ensure you have a WhatsApp Business account\n2. In Multi-Channel Setup, select "WhatsApp"\n3. Follow the OAuth flow to connect your WhatsApp Business account\n4. Configure your business profile and welcome message\n5. Set up webhook URLs for message handling',
        warning:
          "WhatsApp has strict policies. Ensure your bot complies with their business messaging guidelines.",
      },
      {
        id: "step-4",
        title: "Facebook Messenger Integration",
        description: "Deploy your chatbot to Facebook Messenger.",
        action:
          '1. Create a Facebook App and Page if you don\'t have one\n2. In Multi-Channel Setup, select "Facebook Messenger"\n3. Connect your Facebook Page to the chatbot\n4. Configure page access tokens and webhook verification\n5. Test the integration with your Facebook Page',
        note: "Facebook Messenger supports rich media like images, buttons, and carousels.",
      },
      {
        id: "step-5",
        title: "Configure Channel-Specific Settings",
        description:
          "Optimize your chatbot for each channel's unique features.",
        action:
          "1. Review channel-specific limitations and features\n2. Adjust message formatting for each platform\n3. Configure platform-specific quick replies and buttons\n4. Set up channel-specific analytics tracking\n5. Test user experience on each channel",
        note: "Each channel has different user expectations and interaction patterns.",
      },
      {
        id: "step-6",
        title: "Test Multi-Channel Functionality",
        description:
          "Thoroughly test your chatbot across all deployed channels.",
        action:
          "1. Test complete conversation flows on each channel\n2. Verify that all features work correctly\n3. Check message formatting and media support\n4. Test error handling and fallback scenarios\n5. Ensure consistent user experience across channels",
        warning:
          "Some features may not be available on all channels. Plan fallback options accordingly.",
      },
      {
        id: "step-7",
        title: "Monitor and Optimize",
        description:
          "Set up monitoring and optimization for your multi-channel deployment.",
        action:
          "1. Enable analytics for all channels\n2. Set up alerts for deployment issues\n3. Monitor user engagement across channels\n4. Collect feedback from users on different platforms\n5. Regularly review and optimize performance",
        note: "Different channels may have different user behaviors and preferences.",
      },
    ],
    tips: [
      "Start with one channel and gradually expand to others",
      "Consider channel-specific user expectations and behaviors",
      "Use analytics to understand which channels perform best",
      "Keep your bot's core functionality consistent across channels",
      "Regularly update and maintain your integrations",
    ],
    troubleshooting: [
      {
        problem: "Website widget not appearing",
        solution:
          "Check that the embed code is placed correctly before the closing </body> tag. Verify your bot is published and the bot ID is correct.",
      },
      {
        problem: "WhatsApp messages not being received",
        solution:
          "Verify webhook URLs are correctly configured and accessible. Check WhatsApp Business API status and permissions.",
      },
      {
        problem: "Facebook Messenger integration failing",
        solution:
          "Ensure your Facebook App has proper permissions and your Page access token is valid. Check webhook verification settings.",
      },
    ],
    nextSteps: [
      "Set up advanced analytics to compare channel performance",
      "Implement channel-specific conversation flows",
      "Explore additional channels like Telegram or Slack",
      "Set up automated channel health monitoring",
    ],
  },
  {
    id: "analytics-tracking",
    title: "Analytics & Performance Tracking",
    description:
      "Set up comprehensive analytics to monitor and optimize your chatbot's performance",
    category: "Analytics",
    difficulty: "intermediate",
    estimatedTime: "10 min",
    icon: "BarChart3",
    steps: [
      {
        id: "step-1",
        title: "Access Analytics Dashboard",
        description:
          "Navigate to your chatbot's analytics and understand the available metrics.",
        action:
          "1. Go to the Analytics section in the main navigation\n2. Select your chatbot from the dropdown\n3. Explore the different analytics tabs: Overview, Conversations, Advanced\n4. Familiarize yourself with the key metrics displayed",
        note: "Analytics data is updated in real-time and provides insights into user behavior and bot performance.",
      },
      {
        id: "step-2",
        title: "Configure Key Performance Indicators",
        description:
          "Set up the most important metrics for your chatbot's success.",
        action:
          "1. Identify your primary goals (lead generation, support resolution, etc.)\n2. Set up goal tracking in your conversation flows\n3. Configure conversion events and success metrics\n4. Define what constitutes a successful conversation for your use case",
        code: "Common KPIs to track:\n• Conversation completion rate\n• User satisfaction scores\n• Goal achievement rate\n• Average response time\n• Fallback rate\n• Human handoff rate",
      },
      {
        id: "step-3",
        title: "Set Up Conversation Monitoring",
        description:
          "Enable detailed conversation tracking and quality assurance.",
        action:
          "1. Go to the Conversations tab in Analytics\n2. Enable conversation logging and recording\n3. Set up filters to monitor specific conversation types\n4. Configure alerts for problematic conversations\n5. Review conversation transcripts regularly",
        warning:
          "Ensure you comply with privacy regulations when logging conversations. Consider anonymizing personal data.",
      },
      {
        id: "step-4",
        title: "Create Custom Reports",
        description:
          "Build custom analytics reports tailored to your business needs.",
        action:
          "1. Use the Advanced Analytics section\n2. Create custom dashboards with relevant metrics\n3. Set up automated report generation\n4. Configure report sharing with team members\n5. Schedule regular performance reviews",
        note: "Custom reports help you focus on metrics that matter most to your business objectives.",
      },
      {
        id: "step-5",
        title: "Implement A/B Testing",
        description: "Set up A/B tests to optimize your chatbot's performance.",
        action:
          "1. Access the A/B Testing Manager\n2. Create test variations of your conversation flows\n3. Define success metrics for your tests\n4. Set traffic split percentages\n5. Launch tests and monitor results\n6. Implement winning variations",
        note: "A/B testing helps you make data-driven improvements to your chatbot's effectiveness.",
      },
      {
        id: "step-6",
        title: "Set Up Performance Alerts",
        description:
          "Configure alerts to notify you of performance issues or opportunities.",
        action:
          "1. Define alert thresholds for key metrics\n2. Set up email or Slack notifications\n3. Configure escalation procedures for critical issues\n4. Create alerts for unusual conversation patterns\n5. Test alert systems to ensure they work correctly",
        warning:
          "Set realistic thresholds to avoid alert fatigue while catching important issues.",
      },
      {
        id: "step-7",
        title: "Export and Share Data",
        description:
          "Learn how to export analytics data and share insights with stakeholders.",
        action:
          "1. Use the Export functionality to download conversation data\n2. Choose appropriate formats (CSV, JSON, PDF reports)\n3. Set up automated report distribution\n4. Create executive summaries for stakeholders\n5. Ensure data privacy and security in exports",
        note: "Regular reporting helps demonstrate ROI and identify improvement opportunities.",
      },
    ],
    tips: [
      "Focus on metrics that align with your business objectives",
      "Set up regular review cycles to analyze performance trends",
      "Use conversation transcripts to identify common user pain points",
      "Compare performance across different channels and time periods",
      "Involve your team in defining success metrics and KPIs",
    ],
    troubleshooting: [
      {
        problem: "Analytics data seems incomplete or missing",
        solution:
          "Check that analytics tracking is enabled for your chatbot. Verify that conversations are being properly logged and that your bot is published.",
      },
      {
        problem: "Conversion tracking not working",
        solution:
          "Ensure goal events are properly configured in your conversation flow. Check that goal completion nodes are correctly set up and triggered.",
      },
      {
        problem: "Reports showing unexpected data",
        solution:
          "Verify your date ranges and filters. Check for timezone differences and ensure you're comparing like-for-like periods.",
      },
    ],
    nextSteps: [
      "Set up advanced funnel analysis to understand user drop-off points",
      "Implement sentiment analysis to gauge user satisfaction",
      "Create automated optimization recommendations based on analytics",
      "Integrate analytics with your existing business intelligence tools",
    ],
  },
  {
    id: "advanced-features",
    title: "Advanced Features & Integrations",
    description:
      "Explore powerful features like API integrations, conditional logic, and automation",
    category: "Advanced",
    difficulty: "advanced",
    estimatedTime: "15 min",
    icon: "Settings",
    steps: [
      {
        id: "step-1",
        title: "Understanding Advanced Node Types",
        description:
          "Learn about the advanced nodes available for complex chatbot logic.",
        action:
          "1. Explore the Advanced Features section in the node palette\n2. Review available node types: Conditional Logic, API/Webhook, Human Handoff, Survey, File Upload\n3. Understand when and how to use each advanced node type\n4. Plan your advanced conversation flows",
        note: "Advanced features require Pro or Enterprise plans and enable sophisticated chatbot behaviors.",
      },
      {
        id: "step-2",
        title: "Implementing Conditional Logic",
        description:
          "Create dynamic conversation flows that adapt based on user responses and data.",
        action:
          "1. Add a Conditional Logic node to your flow\n2. Define conditions based on user variables or responses\n3. Set up different conversation paths for each condition\n4. Test various scenarios to ensure logic works correctly\n5. Use variables to store and reference user information",
        code: 'Example conditions:\n• If user_type = "premium" → Show premium features\n• If previous_purchase = true → Offer related products\n• If satisfaction_score < 3 → Trigger human handoff',
        warning:
          "Complex conditional logic can make flows hard to maintain. Keep conditions simple and well-documented.",
      },
      {
        id: "step-3",
        title: "Setting Up API Integrations",
        description: "Connect your chatbot to external systems and databases.",
        action:
          "1. Add an API/Webhook node to your flow\n2. Configure the endpoint URL and HTTP method\n3. Set up authentication (API keys, OAuth, etc.)\n4. Define request parameters and data mapping\n5. Handle API responses and error scenarios\n6. Test the integration thoroughly",
        code: 'Example API integration:\nEndpoint: https://api.yourcrm.com/leads\nMethod: POST\nHeaders: {\n  "Authorization": "Bearer YOUR_API_KEY",\n  "Content-Type": "application/json"\n}\nBody: {\n  "name": "{{user_name}}",\n  "email": "{{user_email}}",\n  "source": "chatbot"\n}',
        note: "API integrations enable real-time data exchange with your existing business systems.",
      },
      {
        id: "step-4",
        title: "Configuring Human Handoff",
        description: "Set up seamless transitions from bot to human agents.",
        action:
          "1. Add Human Handoff nodes at appropriate points in your flow\n2. Configure handoff triggers (user request, bot confusion, escalation)\n3. Set up agent notification systems\n4. Define handoff context and conversation history transfer\n5. Create fallback procedures for when agents are unavailable",
        note: "Effective human handoff ensures users get help when the bot reaches its limits.",
      },
      {
        id: "step-5",
        title: "Creating Interactive Surveys",
        description:
          "Build surveys and feedback collection within your chatbot.",
        action:
          "1. Add Survey nodes to collect structured feedback\n2. Design question flows with various input types\n3. Configure NPS scoring and satisfaction ratings\n4. Set up data collection and storage\n5. Create follow-up actions based on survey responses",
        warning:
          "Keep surveys concise to maintain user engagement. Only ask for information you'll actually use.",
      },
      {
        id: "step-6",
        title: "Implementing File Upload/Download",
        description:
          "Enable file sharing capabilities in your chatbot conversations.",
        action:
          "1. Add File Upload nodes where users need to share documents\n2. Configure allowed file types and size limits\n3. Set up secure file storage and processing\n4. Implement file download functionality for resources\n5. Handle file processing errors gracefully",
        code: "Supported file types:\n• Documents: PDF, DOC, DOCX, TXT\n• Images: JPG, PNG, GIF\n• Archives: ZIP, RAR\n• Max size: 10MB per file",
        note: "File handling requires careful security considerations and storage management.",
      },
      {
        id: "step-7",
        title: "Testing and Optimization",
        description:
          "Thoroughly test your advanced features and optimize performance.",
        action:
          "1. Test all advanced features in the simulator\n2. Verify API integrations work correctly\n3. Test error handling and edge cases\n4. Monitor performance impact of advanced features\n5. Optimize conversation flows based on user behavior\n6. Document your advanced configurations",
        note: "Advanced features add complexity, so thorough testing is essential for reliable operation.",
      },
    ],
    tips: [
      "Start with simple integrations and gradually add complexity",
      "Always implement error handling for external API calls",
      "Use variables effectively to create personalized experiences",
      "Document your advanced configurations for team members",
      "Monitor performance impact of complex features",
      "Keep user experience smooth despite backend complexity",
    ],
    troubleshooting: [
      {
        problem: "API integration not working",
        solution:
          "Check API endpoint URLs, authentication credentials, and request format. Verify that the external service is accessible and responding correctly.",
      },
      {
        problem: "Conditional logic not triggering correctly",
        solution:
          "Review your condition syntax and variable names. Ensure variables are being set correctly in previous conversation steps.",
      },
      {
        problem: "File uploads failing",
        solution:
          "Check file size limits, allowed file types, and storage configuration. Ensure your server has adequate storage space and permissions.",
      },
    ],
    nextSteps: [
      "Explore enterprise features like custom integrations",
      "Set up advanced analytics for your integrations",
      "Implement custom authentication and user management",
      "Create automated workflows triggered by chatbot interactions",
    ],
  },
];

export function getGuideById(id: string): QuickStartGuide | undefined {
  return quickStartGuides.find((guide) => guide.id === id);
}

export function getGuidesByCategory(category: string): QuickStartGuide[] {
  return quickStartGuides.filter((guide) => guide.category === category);
}

export function getGuidesByDifficulty(
  difficulty: "beginner" | "intermediate" | "advanced"
): QuickStartGuide[] {
  return quickStartGuides.filter((guide) => guide.difficulty === difficulty);
}
