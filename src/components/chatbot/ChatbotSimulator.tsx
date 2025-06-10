import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, RotateCcw, Star } from "lucide-react";
import { Button } from "../ui/Button";
import { useConversationLogger } from "../../hooks/useConversationLogger";
import { openAIService } from "../../lib/openai";
import { v4 as uuidv4 } from "uuid";
import { Edge, Node } from "reactflow";

interface Message {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: Date;
  nodeId?: string;
  options?: string[];
  responseTimeMs?: number;
}

interface ChatbotSimulatorProps {
  chatbot: any;
  flow: { nodes: any[]; edges: any[] };
  isOpen: boolean;
  onClose: () => void;
}

export function ChatbotSimulator({
  chatbot,
  flow,
  isOpen,
  onClose,
}: ChatbotSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<any>({});
  const [conversationId] = useState(() => uuidv4());
  const [userIdentifier] = useState(() => `simulator_${Date.now()}`);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ sender: string; content: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const logger = useConversationLogger();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize OpenAI service with chatbot context
    if (chatbot) {
      openAIService.setChatbotContext(
        `Business: ${chatbot.name}. ${chatbot.description || ""}`
      );

      // Load FAQ context if available
      loadFAQContext();
    }
  }, [chatbot]);

  const loadFAQContext = async () => {
    try {
      // In a real implementation, this would load from the database
      // For now, we'll use some sample FAQ data
      const sampleFAQ = [
        {
          question: "What are your business hours?",
          answer:
            "We're open Monday-Friday 9AM-6PM, Saturday 10AM-4PM, and closed on Sunday.",
          keywords: [
            "hours",
            "open",
            "schedule",
            "time",
            "monday",
            "friday",
            "weekend",
          ],
        },
        {
          question: "How can I contact support?",
          answer:
            "You can reach our support team at support@company.com or call (555) 123-4567.",
          keywords: [
            "contact",
            "support",
            "help",
            "email",
            "phone",
            "assistance",
          ],
        },
        {
          question: "What services do you offer?",
          answer:
            "We offer consulting, implementation, and ongoing support services for businesses of all sizes.",
          keywords: [
            "services",
            "consulting",
            "implementation",
            "support",
            "business",
          ],
        },
      ];

      openAIService.setFAQContext(sampleFAQ);
    } catch (error) {
      console.error("Failed to load FAQ context:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced variable substitution function
  const substituteVariables = (content: string, variables: any = {}) => {
    let substitutedContent = content;

    // Create a comprehensive mapping of all possible variable names
    const allVariables = {
      ...variables,
      // Common name mappings
      user_name:
        variables.user_name ||
        variables.first_name ||
        variables.name ||
        variables.contact_name ||
        "",
      first_name:
        variables.first_name ||
        variables.user_name ||
        variables.name ||
        variables.contact_name ||
        "",
      name:
        variables.name ||
        variables.first_name ||
        variables.user_name ||
        variables.contact_name ||
        "",
      contact_name:
        variables.contact_name ||
        variables.name ||
        variables.first_name ||
        variables.user_name ||
        "",
    };

    // Replace all variable patterns
    Object.keys(allVariables).forEach((key) => {
      const value = allVariables[key] || "";
      if (value) {
        // Only substitute if we have a value
        const patterns = [
          new RegExp(`\\{${key}\\}`, "g"),
          new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        ];

        patterns.forEach((pattern) => {
          substitutedContent = substitutedContent.replace(pattern, value);
        });
      }
    });

    return substitutedContent;
  };

  const initializeChat = async () => {
    // Log conversation start
    await logger.logConversationStart(
      conversationId,
      chatbot.id,
      userIdentifier,
      "web",
      { simulator: true, chatbotName: chatbot.name }
    );

    // Find the start node
    const startNode = flow.nodes.find(
      (node: any) => node.data.nodeType === "start"
    );

    if (startNode) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        sender: "bot",
        content: substituteVariables(
          startNode.data.content || "Hello! How can I help you today?",
          conversationState
        ),
        timestamp: new Date(),
        nodeId: startNode.id,
        responseTimeMs: 100,
      };

      setMessages([welcomeMessage]);
      setCurrentNodeId(startNode.id);

      // Update conversation history
      setConversationHistory([
        {
          sender: "bot",
          content: welcomeMessage.content,
        },
      ]);

      // Log the welcome message
      await logger.logMessage(conversationId, chatbot.id, userIdentifier, {
        sender: "bot",
        content: welcomeMessage.content,
        messageType: "text",
        nodeId: startNode.id,
        responseTimeMs: 100,
      });

      // Move to next node automatically
      setTimeout(() => {
        moveToNextNode(startNode.id);
      }, 1000);
    }
  };

  const resetChat = async () => {
    // Log conversation end
    await logger.logConversationEnd(
      conversationId,
      chatbot.id,
      userIdentifier,
      "abandoned",
      { reason: "user_reset", messageCount: messages.length }
    );

    setMessages([]);
    setCurrentNodeId(null);
    setInputValue("");
    setConversationState({});
    setConversationHistory([]);
    setShowFeedback(false);
    setFeedbackGiven(false);

    // Start new conversation
    setTimeout(() => {
      initializeChat();
    }, 500);
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim()) return;

    const startTime = Date.now();
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Update conversation history
    setConversationHistory((prev) => [
      ...prev,
      {
        sender: "user",
        content: text,
      },
    ]);

    // Log user message
    await logger.logMessage(conversationId, chatbot.id, userIdentifier, {
      sender: "user",
      content: text,
      messageType: "text",
    });

    // Process the user input
    setTimeout(async () => {
      const responseTime = Date.now() - startTime;
      await processUserMessage(text, responseTime);
      setIsTyping(false);
    }, 1000);
  };

  const processUserMessage = async (
    userInput: string,
    responseTime: number
  ) => {
    if (!currentNodeId) return;

    const currentNode = flow.nodes.find(
      (node: any) => node.id === currentNodeId
    );
    if (!currentNode) return;

    let botResponse = "";
    let fallbackTriggered = false;
    let intentDetected = null;
    let confidenceScore = null;

    // Handle different node types and update conversation state
    switch (currentNode.data.nodeType) {
      case "lead_capture": {
        // Store the captured information with multiple key mappings
        const fieldName = currentNode.data.fields?.[0]?.name || "user_input";
        const newState = {
          ...conversationState,
          [fieldName]: userInput,
          // Store with common name variations for easy access
          user_name: fieldName.includes("name")
            ? userInput
            : conversationState.user_name,
          first_name: fieldName.includes("name")
            ? userInput
            : conversationState.first_name,
          name: fieldName.includes("name") ? userInput : conversationState.name,
          contact_name: fieldName.includes("name")
            ? userInput
            : conversationState.contact_name,
          last_user_input: userInput,
        };

        // If this is a name field, store it in all name variations
        if (
          fieldName.includes("name") ||
          fieldName === "first_name" ||
          fieldName === "user_name"
        ) {
          newState.user_name = userInput;
          newState.first_name = userInput;
          newState.name = userInput;
          newState.contact_name = userInput;
        }

        setConversationState(newState);

        botResponse = `Thank you, ${userInput}!`;
        intentDetected = "information_provided";
        confidenceScore = 0.9;
        break;
      }

      case "question": {
        // Check if user input matches any option
        const selectedOption = currentNode.data.options?.find(
          (option: string) =>
            userInput.toLowerCase().includes(option.toLowerCase()) ||
            option.toLowerCase().includes(userInput.toLowerCase())
        );

        if (selectedOption) {
          // Store the selection in conversation state with multiple mappings
          const questionState = {
            ...conversationState,
            [currentNode.id]: selectedOption,
            selected_option: selectedOption,
            last_user_input: userInput,
            // Store for different template types
            visitor_type: currentNode.data.label?.includes("Visitor")
              ? selectedOption
              : conversationState.visitor_type,
            company_size: currentNode.data.label?.includes("Company")
              ? selectedOption
              : conversationState.company_size,
            current_challenge: currentNode.data.label?.includes("Challenge")
              ? selectedOption
              : conversationState.current_challenge,
            timeline: currentNode.data.label?.includes("Timeline")
              ? selectedOption
              : conversationState.timeline,
            budget: currentNode.data.label?.includes("Budget")
              ? selectedOption
              : conversationState.budget,
            selected_category: currentNode.data.label?.includes("Categories")
              ? selectedOption
              : conversationState.selected_category,
            helpful_response: currentNode.data.label?.includes("helpful")
              ? selectedOption
              : conversationState.helpful_response,
            followup_choice: currentNode.data.label?.includes("Anything Else")
              ? selectedOption
              : conversationState.followup_choice,
          };
          setConversationState(questionState);

          botResponse = `You selected: ${selectedOption}`;
          intentDetected = "option_selected";
          confidenceScore = 0.9;
        } else {
          botResponse =
            "I didn't understand your selection. Please choose one of the available options.";
          fallbackTriggered = true;
        }
        break;
      }

      case "ai_response": {
        // Generate AI response using OpenAI
        const aiResponse = await generateAIResponse(userInput, currentNode);
        botResponse = aiResponse.response;
        intentDetected = aiResponse.intent;
        confidenceScore = aiResponse.confidence;

        setConversationState((prev) => ({
          ...prev,
          last_user_input: userInput,
        }));
        break;
      }

      default:
        botResponse = "I understand. Let me help you with that.";
        intentDetected = "general_inquiry";
        confidenceScore = 0.7;
        setConversationState((prev) => ({
          ...prev,
          last_user_input: userInput,
        }));
    }

    if (botResponse) {
      // Substitute variables in the bot response using UPDATED conversation state
      const substitutedResponse = substituteVariables(
        botResponse,
        conversationState
      );

      const botMessage: Message = {
        id: Date.now().toString(),
        sender: "bot",
        content: substitutedResponse,
        timestamp: new Date(),
        nodeId: currentNode.id,
        responseTimeMs: responseTime,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          content: substitutedResponse,
        },
      ]);

      // Log bot response
      await logger.logMessage(conversationId, chatbot.id, userIdentifier, {
        sender: "bot",
        content: substitutedResponse,
        messageType: "text",
        nodeId: currentNode.id,
        responseTimeMs: responseTime,
        intentDetected: intentDetected ?? undefined,
        confidenceScore: confidenceScore ?? undefined,
        fallbackTriggered,
      });
    }

    // Move to next node
    setTimeout(() => {
      moveToNextNode(currentNodeId, userInput);
    }, 500);
  };

  const generateAIResponse = async (
    userInput: string,
    node: any
  ): Promise<{
    response: string;
    intent: string;
    confidence: number;
  }> => {
    try {
      // Use OpenAI service to generate response
      const aiResponse = await openAIService.generateResponse(
        userInput,
        node.data.systemPrompt || node.data.content,
        conversationHistory,
        {
          conversationState,
          nodeContext: node.data,
          chatbotInfo: {
            id: chatbot.id,
          },
        }
      );

      return {
        response: aiResponse.response,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
      };
    } catch (error) {
      console.error("AI response generation failed:", error);

      // Fallback to simple responses
      const input = userInput.toLowerCase();
      const userName =
        conversationState.user_name ||
        conversationState.first_name ||
        conversationState.name ||
        "";

      if (input.includes("hello") || input.includes("hi")) {
        return {
          response: `Hello${
            userName ? `, ${userName}` : ""
          }! I'm here to help you. What can I do for you today?`,
          intent: "greeting",
          confidence: 0.95,
        };
      } else if (input.includes("help")) {
        return {
          response: `I'd be happy to help you${
            userName ? `, ${userName}` : ""
          }! You can ask me about our services, pricing, or any other questions you might have.`,
          intent: "help_request",
          confidence: 0.9,
        };
      } else if (input.includes("price") || input.includes("cost")) {
        return {
          response: `Our pricing is very competitive${
            userName ? `, ${userName}` : ""
          }! We offer different plans to suit your needs. Would you like me to show you our pricing options?`,
          intent: "pricing_inquiry",
          confidence: 0.85,
        };
      } else if (input.includes("thank")) {
        return {
          response: `You're very welcome${
            userName ? `, ${userName}` : ""
          }! Is there anything else I can help you with?`,
          intent: "gratitude",
          confidence: 0.9,
        };
      } else {
        return {
          response: `I understand you're asking about "${userInput}"${
            userName ? `, ${userName}` : ""
          }. Let me help you with that. For the most accurate information, I'd recommend speaking with one of our team members who can provide detailed assistance.`,
          intent: "general_inquiry",
          confidence: 0.7,
        };
      }
    }
  };

  const moveToNextNode = (fromNodeId: string, userInput?: string) => {
    // Find outgoing edges from current node
    const outgoingEdges = flow.edges.filter(
      (edge: Edge) => edge.source === fromNodeId
    );

    if (outgoingEdges.length === 0) {
      // End of conversation
      const endMessage: Message = {
        id: Date.now().toString(),
        sender: "bot",
        content: substituteVariables(
          "Thank you for chatting with me! Is there anything else I can help you with?",
          conversationState
        ),
        timestamp: new Date(),
        responseTimeMs: 200,
      };
      setMessages((prev) => [...prev, endMessage]);

      // Show feedback form
      setTimeout(() => {
        setShowFeedback(true);
      }, 2000);

      return;
    }

    // For simplicity, take the first edge (in a real implementation, you'd handle conditions)
    const nextEdge = outgoingEdges[0];
    const nextNode = flow.nodes.find(
      (node: Node) => node.id === nextEdge.target
    );

    if (!nextNode) return;

    setCurrentNodeId(nextNode.id);

    // Generate response based on next node type
    let botResponse = "";
    let options: string[] | undefined;

    switch (nextNode.data.nodeType) {
      case "message":
        botResponse = nextNode.data.content || "Hello!";
        break;

      case "question":
        botResponse = nextNode.data.content || "Please choose an option:";
        options = nextNode.data.options;
        if (options && options.length > 0) {
          botResponse +=
            "\n\n" +
            options
              .map((option: string, index: number) => `${index + 1}. ${option}`)
              .join("\n");
        }
        break;

      case "lead_capture": {
        const fields = nextNode.data.fields || [];
        if (fields.length > 0) {
          botResponse =
            nextNode.data.content || `Please provide your ${fields[0].name}:`;
        } else {
          botResponse =
            nextNode.data.content || "Please provide your information:";
        }
        break;
      }

      case "conditional": {
        // Handle conditional logic - this is where the flow was breaking
        const conditions = nextNode.data.conditions || [];
        let conditionMet = false;
        let targetNodeId = null;

        for (const condition of conditions) {
          const variableValue = conversationState[condition.variable] || "";
          const checkValue = condition.value.toLowerCase();
          const actualValue = variableValue.toLowerCase();

          let matches = false;
          switch (condition.operator) {
            case "contains":
              matches =
                actualValue.includes(checkValue) ||
                checkValue.includes(actualValue);
              break;
            case "equals":
              matches = actualValue === checkValue;
              break;
            case "not_equals":
              matches = actualValue !== checkValue;
              break;
            case "greater_than":
              matches = parseFloat(actualValue) > parseFloat(checkValue);
              break;
            case "less_than":
              matches = parseFloat(actualValue) < parseFloat(checkValue);
              break;
          }

          if (matches) {
            conditionMet = true;
            // Find the edge with this condition
            const conditionalEdge = flow.edges.find(
              (edge: any) =>
                edge.source === nextNode.id &&
                edge.condition === condition.action
            );
            if (conditionalEdge) {
              targetNodeId = conditionalEdge.target;
            }
            break;
          }
        }

        // If no condition met, take the first edge without condition
        if (!conditionMet) {
          const defaultEdge = flow.edges.find(
            (edge: any) => edge.source === nextNode.id && !edge.condition
          );
          if (defaultEdge) {
            targetNodeId = defaultEdge.target;
          }
        }

        // If conditional node, immediately move to target node without showing a message
        if (targetNodeId) {
          setTimeout(() => {
            moveToNextNode(targetNodeId);
          }, 100);
        }
        return;
      }

      case "appointment":
        botResponse =
          nextNode.data.content ||
          "I can help you book an appointment. Please let me know your preferred time.";
        break;

      case "action":
        botResponse = `Action executed: ${
          nextNode.data.content || "Processing your request..."
        }`;
        break;

      case "human_handoff":
        botResponse =
          nextNode.data.content ||
          "Let me connect you with a human agent who can help you.";
        break;

      case "api_webhook":
        botResponse = "Processing your information...";
        // Simulate API call delay and move to next node
        setTimeout(() => {
          moveToNextNode(nextNode.id);
        }, 1500);
        return;

      case "survey": {
        botResponse =
          nextNode.data.surveyConfig?.title || "Please provide your feedback:";
        const questions = nextNode.data.surveyConfig?.questions || [];
        if (questions.length > 0) {
          botResponse += "\n\n" + questions[0].question;
        }
        break;
      }

      default:
        botResponse = nextNode.data.content || "How can I help you?";
    }

    if (botResponse) {
      // Substitute variables in the response using current conversation state
      const substitutedResponse = substituteVariables(
        botResponse,
        conversationState
      );

      const botMessage: Message = {
        id: Date.now().toString(),
        sender: "bot",
        content: substitutedResponse,
        timestamp: new Date(),
        nodeId: nextNode.id,
        options,
        responseTimeMs: 300,
      };

      setTimeout(async () => {
        setMessages((prev) => [...prev, botMessage]);

        // Update conversation history
        setConversationHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            content: substitutedResponse,
          },
        ]);

        // Log bot message
        await logger.logMessage(conversationId, chatbot.id, userIdentifier, {
          sender: "bot",
          content: substitutedResponse,
          messageType: "text",
          nodeId: nextNode.id,
          responseTimeMs: 300,
        });
      }, 500);
    }
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const submitFeedback = async (rating: number, feedback?: string) => {
    await logger.logFeedback(conversationId, chatbot.id, userIdentifier, {
      type: "rating",
      ratingValue: rating,
      feedbackText: feedback,
      sentiment:
        rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral",
    });

    // Log conversation end with feedback
    await logger.logConversationEnd(
      conversationId,
      chatbot.id,
      userIdentifier,
      "completed",
      {
        satisfactionScore: rating,
        feedbackText: feedback,
        goalAchieved: rating >= 4,
        messageCount: messages.length,
      }
    );

    setFeedbackGiven(true);
    setShowFeedback(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md h-[600px] bg-white rounded-xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{chatbot.name}</h3>
              <p className="text-sm text-green-600">● Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetChat}
              className="p-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              ×
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === "user"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === "user"
                        ? "bg-blue-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-600"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
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
                    <div
                      className={`flex items-center justify-between mt-2 text-xs ${
                        message.sender === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.responseTimeMs && (
                        <span>{message.responseTimeMs}ms</span>
                      )}
                    </div>

                    {/* Quick Reply Options */}
                    {message.sender === "bot" &&
                      message.options &&
                      message.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleOptionClick(option)}
                              className="block w-full text-left px-3 py-2 text-sm bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
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

        {/* Feedback Modal */}
        {showFeedback && !feedbackGiven && (
          <FeedbackModal
            onSubmit={submitFeedback}
            onClose={() => setShowFeedback(false)}
          />
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </motion.div>
    </div>
  );
}

interface FeedbackModalProps {
  onSubmit: (rating: number, feedback?: string) => void;
  onClose: () => void;
}

function FeedbackModal({ onSubmit, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, feedback);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How was your experience?
        </h3>

        <div className="flex justify-center space-x-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`p-1 ${
                rating >= star ? "text-yellow-500" : "text-gray-300"
              }`}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us more about your experience (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          rows={3}
        />

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1"
          >
            Submit
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
