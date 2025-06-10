import { Building2, HelpCircle, Target, Calendar, MessageCircle, Users, ShoppingCart, Phone } from "lucide-react";
import { personalFAQTemplate } from "./personalFAQTemplate";
import { aiFAQTemplate } from "./aiFAQTemplate";

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  category: "business" | "support" | "sales" | "general";
  difficulty: "beginner" | "intermediate" | "advanced";
  icon: string;
  color: string;
  tags: string[];
  flow: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: {
        nodeType: string;
        label: string;
        content?: string;
        options?: string[];
        fields?: Array<{
          name: string;
          type: string;
          required: boolean;
        }>;
      };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>;
  };
}

export const chatbotTemplates: ChatbotTemplate[] = [
  // FREE TIER TEMPLATES - Basic nodes only
  {
    id: "simple-welcome",
    name: "Simple Welcome Bot",
    description: "A basic welcome chatbot that greets visitors and provides company information. Perfect for getting started!",
    category: "general",
    difficulty: "beginner",
    icon: "MessageCircle",
    color: "from-blue-500 to-cyan-500",
    tags: ["welcome", "greeting", "basic", "starter"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "Welcome Start",
            content: "👋 Welcome to our website! I'm here to help you learn more about our company."
          }
        },
        {
          id: "question-1",
          type: "question",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "question",
            label: "What interests you?",
            content: "What would you like to know about us?",
            options: [
              "About our company",
              "Our services",
              "Contact information",
              "Business hours"
            ]
          }
        },
        {
          id: "message-1",
          type: "message",
          position: { x: -150, y: 400 },
          data: {
            nodeType: "message",
            label: "About Company",
            content: "We're a growing company dedicated to providing excellent service to our customers. Founded in 2020, we've helped hundreds of clients achieve their goals."
          }
        },
        {
          id: "message-2",
          type: "message",
          position: { x: 50, y: 400 },
          data: {
            nodeType: "message",
            label: "Our Services",
            content: "We offer consulting, implementation, and support services. Our team of experts is ready to help you succeed with tailored solutions."
          }
        },
        {
          id: "message-3",
          type: "message",
          position: { x: 250, y: 400 },
          data: {
            nodeType: "message",
            label: "Contact Info",
            content: "📧 Email: hello@company.com\n📞 Phone: (555) 123-4567\n🌐 Website: www.company.com"
          }
        },
        {
          id: "message-4",
          type: "message",
          position: { x: 450, y: 400 },
          data: {
            nodeType: "message",
            label: "Business Hours",
            content: "🕒 We're open:\nMonday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed"
          }
        },
        {
          id: "question-2",
          type: "question",
          position: { x: 150, y: 550 },
          data: {
            nodeType: "question",
            label: "Anything else?",
            content: "Is there anything else I can help you with today?",
            options: [
              "Yes, I have more questions",
              "No, thank you",
              "I'd like to speak with someone"
            ]
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "question-1" },
        { id: "e2", source: "question-1", target: "message-1" },
        { id: "e3", source: "question-1", target: "message-2" },
        { id: "e4", source: "question-1", target: "message-3" },
        { id: "e5", source: "question-1", target: "message-4" },
        { id: "e6", source: "message-1", target: "question-2" },
        { id: "e7", source: "message-2", target: "question-2" },
        { id: "e8", source: "message-3", target: "question-2" },
        { id: "e9", source: "message-4", target: "question-2" }
      ]
    }
  },

  {
    id: "lead-collection",
    name: "Lead Collection Bot",
    description: "Collect visitor information and qualify leads with a friendly conversation flow. Great for growing your contact list!",
    category: "sales",
    difficulty: "beginner",
    icon: "Users",
    color: "from-green-500 to-emerald-500",
    tags: ["leads", "contact", "qualification", "sales"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "Welcome",
            content: "Hi there! 👋 I'd love to learn more about you and how we can help."
          }
        },
        {
          id: "lead-1",
          type: "lead_capture",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "lead_capture",
            label: "Get Name",
            content: "What's your name?",
            fields: [
              {
                name: "name",
                type: "text",
                required: true
              }
            ]
          }
        },
        {
          id: "message-1",
          type: "message",
          position: { x: 100, y: 400 },
          data: {
            nodeType: "message",
            label: "Nice to meet you",
            content: "Nice to meet you, {name}! 😊"
          }
        },
        {
          id: "lead-2",
          type: "lead_capture",
          position: { x: 100, y: 550 },
          data: {
            nodeType: "lead_capture",
            label: "Get Email",
            content: "What's your email address so we can stay in touch?",
            fields: [
              {
                name: "email",
                type: "email",
                required: true
              }
            ]
          }
        },
        {
          id: "question-1",
          type: "question",
          position: { x: 100, y: 700 },
          data: {
            nodeType: "question",
            label: "Company Size",
            content: "What size is your company?",
            options: [
              "Just me (1 person)",
              "Small team (2-10 people)",
              "Medium business (11-50 people)",
              "Large company (50+ people)"
            ]
          }
        },
        {
          id: "question-2",
          type: "question",
          position: { x: 100, y: 850 },
          data: {
            nodeType: "question",
            label: "Main Challenge",
            content: "What's your biggest challenge right now?",
            options: [
              "Need more customers",
              "Want to save time",
              "Looking to reduce costs",
              "Improve team productivity"
            ]
          }
        },
        {
          id: "message-2",
          type: "message",
          position: { x: 100, y: 1000 },
          data: {
            nodeType: "message",
            label: "Thank You",
            content: "Thanks {name}! 🎉 We'll be in touch at {email} with some ideas on how we can help with your challenge. Have a great day!"
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "lead-1" },
        { id: "e2", source: "lead-1", target: "message-1" },
        { id: "e3", source: "message-1", target: "lead-2" },
        { id: "e4", source: "lead-2", target: "question-1" },
        { id: "e5", source: "question-1", target: "question-2" },
        { id: "e6", source: "question-2", target: "message-2" }
      ]
    }
  },

  {
    id: "faq-helper",
    name: "FAQ Helper Bot",
    description: "Answer common questions about your business with an organized, easy-to-navigate FAQ chatbot.",
    category: "support",
    difficulty: "beginner",
    icon: "HelpCircle",
    color: "from-purple-500 to-pink-500",
    tags: ["faq", "support", "help", "questions"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "FAQ Start",
            content: "Hi! I'm here to answer your questions. What would you like to know?"
          }
        },
        {
          id: "question-1",
          type: "question",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "question",
            label: "FAQ Categories",
            content: "Choose a category:",
            options: [
              "Pricing & Plans",
              "Getting Started",
              "Technical Support",
              "Account & Billing"
            ]
          }
        },
        {
          id: "question-2",
          type: "question",
          position: { x: -200, y: 400 },
          data: {
            nodeType: "question",
            label: "Pricing Questions",
            content: "What pricing question do you have?",
            options: [
              "How much does it cost?",
              "Is there a free trial?",
              "Can I change plans later?",
              "What payment methods do you accept?"
            ]
          }
        },
        {
          id: "question-3",
          type: "question",
          position: { x: 0, y: 400 },
          data: {
            nodeType: "question",
            label: "Getting Started",
            content: "What do you need help with?",
            options: [
              "How do I sign up?",
              "How do I get started?",
              "Do I need technical skills?",
              "How long does setup take?"
            ]
          }
        },
        {
          id: "question-4",
          type: "question",
          position: { x: 200, y: 400 },
          data: {
            nodeType: "question",
            label: "Technical Support",
            content: "What technical issue can I help with?",
            options: [
              "Login problems",
              "Feature not working",
              "Browser compatibility",
              "Data export issues"
            ]
          }
        },
        {
          id: "question-5",
          type: "question",
          position: { x: 400, y: 400 },
          data: {
            nodeType: "question",
            label: "Account & Billing",
            content: "What account question do you have?",
            options: [
              "How to update billing info?",
              "How to cancel subscription?",
              "Where are my invoices?",
              "How to change password?"
            ]
          }
        },
        {
          id: "message-1",
          type: "message",
          position: { x: 100, y: 600 },
          data: {
            nodeType: "message",
            label: "Answer",
            content: "Here's the answer to your question: [This would contain the specific answer based on the user's selection]"
          }
        },
        {
          id: "question-6",
          type: "question",
          position: { x: 100, y: 750 },
          data: {
            nodeType: "question",
            label: "More Help",
            content: "Was this helpful? What would you like to do next?",
            options: [
              "Ask another question",
              "Contact support",
              "I'm all set, thanks!"
            ]
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "question-1" },
        { id: "e2", source: "question-1", target: "question-2" },
        { id: "e3", source: "question-1", target: "question-3" },
        { id: "e4", source: "question-1", target: "question-4" },
        { id: "e5", source: "question-1", target: "question-5" },
        { id: "e6", source: "question-2", target: "message-1" },
        { id: "e7", source: "question-3", target: "message-1" },
        { id: "e8", source: "question-4", target: "message-1" },
        { id: "e9", source: "question-5", target: "message-1" },
        { id: "e10", source: "message-1", target: "question-6" },
        { id: "e11", source: "question-6", target: "question-1" }
      ]
    }
  },

  {
    id: "appointment-scheduler",
    name: "Simple Appointment Bot",
    description: "Help visitors schedule appointments or consultations with a friendly, guided conversation.",
    category: "business",
    difficulty: "beginner",
    icon: "Calendar",
    color: "from-orange-500 to-red-500",
    tags: ["appointment", "scheduling", "booking", "consultation"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "Appointment Start",
            content: "Hello! I'd be happy to help you schedule an appointment. 📅"
          }
        },
        {
          id: "question-1",
          type: "question",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "question",
            label: "Service Type",
            content: "What type of appointment would you like to schedule?",
            options: [
              "Free consultation",
              "Product demo",
              "Support session",
              "Sales meeting"
            ]
          }
        },
        {
          id: "lead-1",
          type: "lead_capture",
          position: { x: 100, y: 400 },
          data: {
            nodeType: "lead_capture",
            label: "Get Name",
            content: "Great choice! What's your name?",
            fields: [
              {
                name: "name",
                type: "text",
                required: true
              }
            ]
          }
        },
        {
          id: "lead-2",
          type: "lead_capture",
          position: { x: 100, y: 550 },
          data: {
            nodeType: "lead_capture",
            label: "Get Email",
            content: "What's your email address?",
            fields: [
              {
                name: "email",
                type: "email",
                required: true
              }
            ]
          }
        },
        {
          id: "lead-3",
          type: "lead_capture",
          position: { x: 100, y: 700 },
          data: {
            nodeType: "lead_capture",
            label: "Get Phone",
            content: "And your phone number?",
            fields: [
              {
                name: "phone",
                type: "phone",
                required: true
              }
            ]
          }
        },
        {
          id: "question-2",
          type: "question",
          position: { x: 100, y: 850 },
          data: {
            nodeType: "question",
            label: "Preferred Time",
            content: "When would you prefer to meet?",
            options: [
              "Morning (9 AM - 12 PM)",
              "Afternoon (12 PM - 5 PM)",
              "Evening (5 PM - 7 PM)",
              "I'm flexible"
            ]
          }
        },
        {
          id: "question-3",
          type: "question",
          position: { x: 100, y: 1000 },
          data: {
            nodeType: "question",
            label: "Preferred Days",
            content: "Which days work best for you?",
            options: [
              "Monday - Wednesday",
              "Thursday - Friday",
              "Weekends",
              "Any day is fine"
            ]
          }
        },
        {
          id: "message-1",
          type: "message",
          position: { x: 100, y: 1150 },
          data: {
            nodeType: "message",
            label: "Confirmation",
            content: "Perfect! Thanks {name}. 🎉\n\nI've noted your preferences:\n• Service: {selected_option}\n• Preferred time: {preferred_time}\n• Preferred days: {preferred_days}\n\nSomeone from our team will contact you at {email} or {phone} within 24 hours to confirm your appointment time.\n\nLooking forward to meeting with you!"
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "question-1" },
        { id: "e2", source: "question-1", target: "lead-1" },
        { id: "e3", source: "lead-1", target: "lead-2" },
        { id: "e4", source: "lead-2", target: "lead-3" },
        { id: "e5", source: "lead-3", target: "question-2" },
        { id: "e6", source: "question-2", target: "question-3" },
        { id: "e7", source: "question-3", target: "message-1" }
      ]
    }
  },

  {
    id: "product-showcase",
    name: "Product Showcase Bot",
    description: "Showcase your products or services with an interactive guide that helps visitors find what they need.",
    category: "sales",
    difficulty: "beginner",
    icon: "ShoppingCart",
    color: "from-indigo-500 to-purple-500",
    tags: ["products", "showcase", "sales", "catalog"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "Product Start",
            content: "Welcome! 🛍️ I'm here to help you discover our amazing products and services."
          }
        },
        {
          id: "question-1",
          type: "question",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "question",
            label: "Product Categories",
            content: "What are you interested in?",
            options: [
              "Software Solutions",
              "Consulting Services",
              "Training Programs",
              "Support Packages"
            ]
          }
        },
        {
          id: "message-1",
          type: "message",
          position: { x: -150, y: 400 },
          data: {
            nodeType: "message",
            label: "Software Info",
            content: "💻 Our Software Solutions:\n\n✅ Easy-to-use interface\n✅ Cloud-based platform\n✅ 24/7 availability\n✅ Advanced analytics\n\nPerfect for businesses looking to streamline their operations!"
          }
        },
        {
          id: "message-2",
          type: "message",
          position: { x: 50, y: 400 },
          data: {
            nodeType: "message",
            label: "Consulting Info",
            content: "🎯 Our Consulting Services:\n\n✅ Expert guidance\n✅ Custom strategies\n✅ Proven methodologies\n✅ Ongoing support\n\nLet our experts help you achieve your goals faster!"
          }
        },
        {
          id: "message-3",
          type: "message",
          position: { x: 250, y: 400 },
          data: {
            nodeType: "message",
            label: "Training Info",
            content: "📚 Our Training Programs:\n\n✅ Hands-on learning\n✅ Certified instructors\n✅ Flexible scheduling\n✅ Completion certificates\n\nUpskill your team with our comprehensive training!"
          }
        },
        {
          id: "message-4",
          type: "message",
          position: { x: 450, y: 400 },
          data: {
            nodeType: "message",
            label: "Support Info",
            content: "🛠️ Our Support Packages:\n\n✅ Priority assistance\n✅ Dedicated account manager\n✅ Regular check-ins\n✅ Proactive monitoring\n\nEnsure smooth operations with our support!"
          }
        },
        {
          id: "question-2",
          type: "question",
          position: { x: 150, y: 600 },
          data: {
            nodeType: "question",
            label: "Next Steps",
            content: "What would you like to do next?",
            options: [
              "Get a free quote",
              "Schedule a demo",
              "Download brochure",
              "Speak with sales"
            ]
          }
        },
        {
          id: "lead-1",
          type: "lead_capture",
          position: { x: 150, y: 750 },
          data: {
            nodeType: "lead_capture",
            label: "Contact Info",
            content: "Great! Let me get your contact information so we can follow up.",
            fields: [
              {
                name: "name",
                type: "text",
                required: true
              }
            ]
          }
        },
        {
          id: "lead-2",
          type: "lead_capture",
          position: { x: 150, y: 900 },
          data: {
            nodeType: "lead_capture",
            label: "Get Email",
            content: "What's your email address?",
            fields: [
              {
                name: "email",
                type: "email",
                required: true
              }
            ]
          }
        },
        {
          id: "message-5",
          type: "message",
          position: { x: 150, y: 1050 },
          data: {
            nodeType: "message",
            label: "Thank You",
            content: "Excellent! Thanks {name}. 🙌\n\nWe'll send you the information you requested to {email} within the next hour.\n\nIf you have any immediate questions, feel free to call us at (555) 123-4567.\n\nHave a wonderful day!"
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "question-1" },
        { id: "e2", source: "question-1", target: "message-1" },
        { id: "e3", source: "question-1", target: "message-2" },
        { id: "e4", source: "question-1", target: "message-3" },
        { id: "e5", source: "question-1", target: "message-4" },
        { id: "e6", source: "message-1", target: "question-2" },
        { id: "e7", source: "message-2", target: "question-2" },
        { id: "e8", source: "message-3", target: "question-2" },
        { id: "e9", source: "message-4", target: "question-2" },
        { id: "e10", source: "question-2", target: "lead-1" },
        { id: "e11", source: "lead-1", target: "lead-2" },
        { id: "e12", source: "lead-2", target: "message-5" }
      ]
    }
  },

  {
    id: "contact-qualifier",
    name: "Contact Qualifier Bot",
    description: "Qualify incoming contacts and route them to the right department or person based on their needs.",
    category: "business",
    difficulty: "beginner",
    icon: "Phone",
    color: "from-teal-500 to-blue-500",
    tags: ["contact", "routing", "qualification", "support"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "Contact Start",
            content: "Hello! 👋 I'm here to help connect you with the right person. Let me ask a few quick questions."
          }
        },
        {
          id: "question-1",
          type: "question",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "question",
            label: "Visitor Type",
            content: "Are you a:",
            options: [
              "New potential customer",
              "Existing customer",
              "Partner or vendor",
              "Job seeker"
            ]
          }
        },
        {
          id: "question-2",
          type: "question",
          position: { x: -150, y: 400 },
          data: {
            nodeType: "question",
            label: "New Customer Needs",
            content: "What can we help you with?",
            options: [
              "Learn about our services",
              "Get a quote",
              "Schedule a consultation",
              "Technical questions"
            ]
          }
        },
        {
          id: "question-3",
          type: "question",
          position: { x: 50, y: 400 },
          data: {
            nodeType: "question",
            label: "Existing Customer",
            content: "How can we assist you today?",
            options: [
              "Technical support",
              "Billing question",
              "Account changes",
              "Feature request"
            ]
          }
        },
        {
          id: "question-4",
          type: "question",
          position: { x: 250, y: 400 },
          data: {
            nodeType: "question",
            label: "Partner Inquiry",
            content: "What type of partnership are you interested in?",
            options: [
              "Become a reseller",
              "Integration partnership",
              "Vendor application",
              "Joint venture"
            ]
          }
        },
        {
          id: "question-5",
          type: "question",
          position: { x: 450, y: 400 },
          data: {
            nodeType: "question",
            label: "Job Interest",
            content: "What type of position interests you?",
            options: [
              "Engineering roles",
              "Sales positions",
              "Marketing opportunities",
              "Customer success"
            ]
          }
        },
        {
          id: "lead-1",
          type: "lead_capture",
          position: { x: 150, y: 600 },
          data: {
            nodeType: "lead_capture",
            label: "Contact Details",
            content: "Perfect! Let me get your contact information so the right person can reach out to you.",
            fields: [
              {
                name: "name",
                type: "text",
                required: true
              }
            ]
          }
        },
        {
          id: "lead-2",
          type: "lead_capture",
          position: { x: 150, y: 750 },
          data: {
            nodeType: "lead_capture",
            label: "Email",
            content: "What's your email address?",
            fields: [
              {
                name: "email",
                type: "email",
                required: true
              }
            ]
          }
        },
        {
          id: "lead-3",
          type: "lead_capture",
          position: { x: 150, y: 900 },
          data: {
            nodeType: "lead_capture",
            label: "Company",
            content: "What company do you work for? (Optional)",
            fields: [
              {
                name: "company",
                type: "text",
                required: false
              }
            ]
          }
        },
        {
          id: "message-1",
          type: "message",
          position: { x: 150, y: 1050 },
          data: {
            nodeType: "message",
            label: "Routing Confirmation",
            content: "Thanks {name}! 🎉\n\nI've routed your inquiry to our {department} team. They'll reach out to you at {email} within 24 hours.\n\nYour reference number is: #REF{timestamp}\n\nIf you need immediate assistance, you can also call us at (555) 123-4567.\n\nThank you for your interest!"
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "question-1" },
        { id: "e2", source: "question-1", target: "question-2" },
        { id: "e3", source: "question-1", target: "question-3" },
        { id: "e4", source: "question-1", target: "question-4" },
        { id: "e5", source: "question-1", target: "question-5" },
        { id: "e6", source: "question-2", target: "lead-1" },
        { id: "e7", source: "question-3", target: "lead-1" },
        { id: "e8", source: "question-4", target: "lead-1" },
        { id: "e9", source: "question-5", target: "lead-1" },
        { id: "e10", source: "lead-1", target: "lead-2" },
        { id: "e11", source: "lead-2", target: "lead-3" },
        { id: "e12", source: "lead-3", target: "message-1" }
      ]
    }
  },

  // EXISTING PRO TEMPLATES (keeping the advanced ones for Pro users)
  {
    id: "ai-customer-support",
    name: "AI Customer Support",
    description: "Advanced AI-powered customer support with intelligent responses, FAQ integration, and human handoff capabilities.",
    category: "support",
    difficulty: "advanced",
    icon: "HelpCircle",
    color: "from-blue-500 to-indigo-600",
    tags: ["ai", "support", "intelligent", "handoff"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "AI Support Start",
            content: "Hello! I'm your AI assistant. I can help with questions, troubleshooting, and connect you with human support when needed."
          }
        },
        {
          id: "ai-1",
          type: "ai_response",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "ai_response",
            label: "AI Assistant",
            content: "I'm here to help with any questions or issues you might have. What can I assist you with today?",
            systemPrompt: "You are a helpful customer support AI. Answer questions about products, troubleshoot issues, and escalate to humans when needed."
          }
        },
        {
          id: "conditional-1",
          type: "conditional",
          position: { x: 100, y: 400 },
          data: {
            nodeType: "conditional",
            label: "Escalation Check",
            conditions: [
              {
                variable: "escalate",
                operator: "equals",
                value: "yes",
                action: "handoff"
              }
            ]
          }
        },
        {
          id: "human-handoff-1",
          type: "human_handoff",
          position: { x: 300, y: 550 },
          data: {
            nodeType: "human_handoff",
            label: "Connect to Human",
            content: "I'll connect you with a human agent who can provide more specialized assistance.",
            handoffConfig: {
              reason: "Customer requested human assistance",
              priority: "medium",
              department: "support"
            }
          }
        },
        {
          id: "survey-1",
          type: "survey",
          position: { x: -100, y: 550 },
          data: {
            nodeType: "survey",
            label: "Satisfaction Survey",
            surveyConfig: {
              title: "How was your experience?",
              questions: [
                {
                  type: "rating",
                  question: "How satisfied are you with the support?",
                  required: true
                },
                {
                  type: "text",
                  question: "Any additional feedback?",
                  required: false
                }
              ]
            }
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "ai-1" },
        { id: "e2", source: "ai-1", target: "conditional-1" },
        { id: "e3", source: "conditional-1", target: "human-handoff-1" },
        { id: "e4", source: "conditional-1", target: "survey-1" }
      ]
    }
  },

  {
    id: "lead-qualification-pro",
    name: "Advanced Lead Qualification",
    description: "Sophisticated lead qualification with conditional logic, API integrations, and automated follow-up workflows.",
    category: "sales",
    difficulty: "advanced",
    icon: "Target",
    color: "from-green-500 to-teal-600",
    tags: ["leads", "qualification", "automation", "crm"],
    flow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            nodeType: "start",
            label: "Lead Qualification Start",
            content: "Welcome! Let's see how we can help your business grow."
          }
        },
        {
          id: "lead-1",
          type: "lead_capture",
          position: { x: 100, y: 250 },
          data: {
            nodeType: "lead_capture",
            label: "Basic Info",
            content: "Let's start with some basic information.",
            fields: [
              { name: "name", type: "text", required: true },
              { name: "email", type: "email", required: true },
              { name: "company", type: "text", required: true }
            ]
          }
        },
        {
          id: "conditional-1",
          type: "conditional",
          position: { x: 100, y: 400 },
          data: {
            nodeType: "conditional",
            label: "Company Size Check",
            conditions: [
              {
                variable: "company_size",
                operator: "equals",
                value: "enterprise",
                action: "enterprise_flow"
              }
            ]
          }
        },
        {
          id: "api-1",
          type: "api_webhook",
          position: { x: 300, y: 550 },
          data: {
            nodeType: "api_webhook",
            label: "CRM Integration",
            apiConfig: {
              url: "https://api.crm.com/leads",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              auth: { type: "bearer" }
            }
          }
        },
        {
          id: "appointment-1",
          type: "appointment",
          position: { x: -100, y: 550 },
          data: {
            nodeType: "appointment",
            label: "Schedule Demo",
            content: "Let's schedule a personalized demo for your team."
          }
        }
      ],
      edges: [
        { id: "e1", source: "start-1", target: "lead-1" },
        { id: "e2", source: "lead-1", target: "conditional-1" },
        { id: "e3", source: "conditional-1", target: "api-1" },
        { id: "e4", source: "conditional-1", target: "appointment-1" }
      ]
    }
  },
  aiFAQTemplate,
  personalFAQTemplate,
];