import {
  MessageSquare,
  HelpCircle,
  Zap,
  Play,
  Calendar,
  User,
  Brain,
  GitBranch,
  Globe,
  FileUp,
  BarChart3,
  Headphones,
} from "lucide-react";

// Enhanced node type definitions with new advanced nodes
export const nodeTypeDefinitions = [
  // Flow Control
  {
    type: "start",
    title: "Start",
    description: "Beginning of conversation",
    icon: Play,
    color: "from-green-500 to-green-600",
    category: "flow",
  },
  {
    type: "conditional",
    title: "Conditional Logic",
    description: "If/else branching logic",
    icon: GitBranch,
    color: "from-yellow-500 to-yellow-600",
    category: "flow",
    requiresPro: true,
  },

  // Basic Interactions
  {
    type: "message",
    title: "Message",
    description: "Send a message to user",
    icon: MessageSquare,
    color: "from-blue-500 to-blue-600",
    category: "basic",
  },
  {
    type: "question",
    title: "Question",
    description: "Ask user a question with options",
    icon: HelpCircle,
    color: "from-purple-500 to-purple-600",
    category: "basic",
  },

  // AI Features
  {
    type: "ai_response",
    title: "AI Response",
    description: "Generate AI-powered response",
    icon: Brain,
    color: "from-indigo-500 to-indigo-600",
    category: "ai",
    requiresPro: true,
  },

  // Data Collection
  {
    type: "lead_capture",
    title: "Lead Capture",
    description: "Collect user information",
    icon: User,
    color: "from-pink-500 to-pink-600",
    category: "data",
  },
  {
    type: "survey",
    title: "Survey/Feedback",
    description: "Collect structured feedback",
    icon: BarChart3,
    color: "from-teal-500 to-teal-600",
    category: "data",
    requiresPro: true,
  },
  {
    type: "file_upload",
    title: "File Upload",
    description: "Allow file uploads/downloads",
    icon: FileUp,
    color: "from-cyan-500 to-cyan-600",
    category: "data",
    requiresPro: true,
  },

  // Actions
  {
    type: "appointment",
    title: "Book Appointment",
    description: "Schedule a meeting",
    icon: Calendar,
    color: "from-orange-500 to-orange-600",
    category: "action",
    requiresPro: true,
  },
  {
    type: "api_webhook",
    title: "API/Webhook",
    description: "Connect to external APIs",
    icon: Globe,
    color: "from-emerald-500 to-emerald-600",
    category: "action",
    requiresPro: true,
  },
  {
    type: "human_handoff",
    title: "Human Handoff",
    description: "Transfer to live agent",
    icon: Headphones,
    color: "from-rose-500 to-rose-600",
    category: "action",
    requiresPro: true,
  },
  {
    type: "action",
    title: "Custom Action",
    description: "Perform custom action",
    icon: Zap,
    color: "from-red-500 to-red-600",
    category: "action",
    requiresPro: true,
  },
];
