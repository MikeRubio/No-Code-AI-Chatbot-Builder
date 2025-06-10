import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  BookOpen,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { appFAQ, searchFAQ } from "../../data/appFAQ";
import { openAIService } from "../../lib/openai";

interface Message {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: Date;
  type?: "text" | "quick_replies" | "faq_results";
  options?: string[];
  faqResults?: any[];
}

interface HelpChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpChatbot({ isOpen, onClose }: HelpChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set up FAQ context for the AI
    const faqEntries = appFAQ.flatMap((category) =>
      category.questions.map((q) => ({
        question: q.question,
        answer: q.answer,
        keywords: q.keywords,
      }))
    );

    openAIService.setFAQContext(faqEntries);
    openAIService.setChatbotContext(
      "BotForge Pro Help Assistant - A no-code chatbot building platform. Help users with questions about creating, deploying, and managing chatbots."
    );
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      sender: "bot",
      content:
        "Hi! 👋 I'm your BotForge Pro assistant. I can help you with questions about creating chatbots, using features, deployment, pricing, and more.\n\nWhat would you like to know?",
      timestamp: new Date(),
      type: "quick_replies",
      options: [
        "🚀 Getting Started",
        "🤖 AI Features",
        "📱 Deployment",
        "📊 Analytics",
        "💰 Pricing",
        "🔧 Technical Help",
      ],
    };

    setMessages([welcomeMessage]);
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Process the message
    setTimeout(async () => {
      await processUserMessage(text);
      setIsTyping(false);
    }, 1000);
  };

  const processUserMessage = async (userInput: string) => {
    let botResponse = "";
    let messageType: "text" | "quick_replies" | "faq_results" = "text";
    let options: string[] = [];
    let faqResults: any[] = [];

    // Check for category selection
    if (userInput.includes("Getting Started")) {
      botResponse =
        "🚀 **Getting Started Help**\n\nI can help you with:\n• Creating your first chatbot\n• Understanding templates\n• Basic setup and configuration\n• Publishing your bot\n\nWhat specific topic would you like help with?";
      messageType = "quick_replies";
      options = [
        "How to create my first chatbot?",
        "What templates are available?",
        "Do I need coding skills?",
        "How long does it take?",
      ];
    } else if (userInput.includes("AI Features")) {
      botResponse =
        "🤖 **AI Features Help**\n\nOur AI capabilities include:\n• OpenAI integration\n• Intelligent FAQ responses\n• Document processing\n• Natural language understanding\n\nWhat would you like to know about AI features?";
      messageType = "quick_replies";
      options = [
        "What AI features are available?",
        "How to set up OpenAI?",
        "Can I upload FAQ documents?",
        "How does AI response work?",
      ];
    } else if (userInput.includes("Deployment")) {
      botResponse =
        "📱 **Deployment Help**\n\nYou can deploy your chatbot to:\n• Your website\n• WhatsApp Business\n• Facebook Messenger\n• Multiple channels\n\nWhich deployment option interests you?";
      messageType = "quick_replies";
      options = [
        "How to add to my website?",
        "WhatsApp integration setup",
        "Multi-channel deployment",
        "Customizing appearance",
      ];
    } else if (userInput.includes("Analytics")) {
      botResponse =
        "📊 **Analytics Help**\n\nTrack your chatbot performance with:\n• Conversation metrics\n• User engagement data\n• A/B testing\n• Export capabilities\n\nWhat analytics topic can I help with?";
      messageType = "quick_replies";
      options = [
        "What analytics are available?",
        "How to view conversations?",
        "A/B testing setup",
        "Exporting data",
      ];
    } else if (userInput.includes("Pricing")) {
      botResponse =
        "💰 **Pricing Help**\n\nOur plans:\n• **Free**: 1 bot, 100 messages/month\n• **Pro**: 5 bots, 5K messages, AI features\n• **Enterprise**: Unlimited everything\n\nWhat pricing question do you have?";
      messageType = "quick_replies";
      options = [
        "What's in the Free plan?",
        "Pro plan benefits",
        "Enterprise features",
        "How to upgrade?",
      ];
    } else if (userInput.includes("Technical Help")) {
      botResponse =
        "🔧 **Technical Support**\n\nI can help with:\n• Troubleshooting issues\n• Setup problems\n• Integration questions\n• Best practices\n\nWhat technical issue can I assist with?";
      messageType = "quick_replies";
      options = [
        "Chatbot not responding",
        "OpenAI setup issues",
        "Browser compatibility",
        "How to get more help",
      ];
    } else {
      // Search FAQ or use AI
      const searchResults = searchFAQ(userInput);

      if (searchResults.length > 0) {
        // Found FAQ matches
        const topResult = searchResults[0];
        botResponse = `📚 **Found this in our FAQ:**\n\n**${topResult.question}**\n\n${topResult.answer}`;

        if (searchResults.length > 1) {
          botResponse += `\n\n💡 **Related topics:**`;
          faqResults = searchResults.slice(1, 4);
          messageType = "faq_results";
        }
      } else {
        // Use AI for more complex questions
        try {
          const aiResponse = await openAIService.generateResponse(
            userInput,
            `You are a helpful assistant for BotForge, a no-code chatbot building platform. 
            Answer questions about the platform features, help users troubleshoot issues, and guide them to the right resources.
            Be friendly, concise, and helpful. If you don't know something specific, direct them to contact support.`,
            [],
            { platform: "BotForge" }
          );

          botResponse = aiResponse.response;
        } catch (error) {
          botResponse =
            "I'm having trouble processing that question right now. Let me suggest some common topics that might help, or you can contact our support team for personalized assistance.";
          messageType = "quick_replies";
          options = [
            "🚀 Getting Started",
            "🤖 AI Features",
            "📱 Deployment",
            "💬 Contact Support",
          ];
        }
      }
    }

    // Add follow-up options for most responses
    if (messageType === "text" && options.length === 0) {
      messageType = "quick_replies";
      options = [
        "❓ Ask another question",
        "📚 Browse FAQ categories",
        "💬 Contact Support",
        "🔄 Start over",
      ];
    }

    const botMessage: Message = {
      id: Date.now().toString(),
      sender: "bot",
      content: botResponse,
      timestamp: new Date(),
      type: messageType,
      options: options.length > 0 ? options : undefined,
      faqResults: faqResults.length > 0 ? faqResults : undefined,
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const handleFAQClick = (faq: any) => {
    const faqMessage: Message = {
      id: Date.now().toString(),
      sender: "bot",
      content: `**${faq.question}**\n\n${faq.answer}`,
      timestamp: new Date(),
      type: "quick_replies",
      options: [
        "❓ Ask another question",
        "📚 More from this category",
        "🔄 Start over",
      ],
    };

    setMessages((prev) => [...prev, faqMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          height: isMinimized ? 60 : 500,
          width: isMinimized ? 300 : 400,
        }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Help Assistant</h3>
              <p className="text-xs text-blue-100">
                Ask me anything about BotForge
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[85%] ${
                        message.sender === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === "user"
                            ? "bg-blue-500"
                            : "bg-gradient-to-r from-blue-500 to-purple-600"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User className="w-3 h-3 text-white" />
                        ) : (
                          <Bot className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {/* Quick Reply Options */}
                        {message.type === "quick_replies" &&
                          message.options && (
                            <div className="mt-3 space-y-1">
                              {message.options.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleOptionClick(option)}
                                  className="block w-full text-left px-3 py-2 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                        {/* FAQ Results */}
                        {message.type === "faq_results" &&
                          message.faqResults && (
                            <div className="mt-3 space-y-2">
                              {message.faqResults.map((faq, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleFAQClick(faq)}
                                  className="block w-full text-left px-3 py-2 text-xs bg-blue-50 text-blue-800 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                  <BookOpen className="w-3 h-3 inline mr-1" />
                                  {faq.question}
                                </button>
                              ))}
                            </div>
                          )}

                        <div className="text-xs opacity-75 mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="p-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
