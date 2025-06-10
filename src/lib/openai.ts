// Production-ready OpenAI service that uses server-side endpoints
interface AIResponse {
  response: string;
  intent: string;
  confidence: number;
  tokens_used?: number;
  processing_time?: number;
  fallback?: boolean;
}

interface FAQEntry {
  question: string;
  answer: string;
  keywords: string[];
}

class OpenAIService {
  private faqContext: FAQEntry[] = [];
  private chatbotContext: string = "";

  /**
   * Set FAQ context for the AI to reference
   */
  setFAQContext(faqEntries: FAQEntry[]): void {
    this.faqContext = faqEntries;
  }

  /**
   * Set chatbot context and personality
   */
  setChatbotContext(context: string): void {
    this.chatbotContext = context;
  }

  /**
   * Generate AI response using server-side endpoint
   */
  async generateResponse(
    userInput: string,
    systemPrompt?: string,
    conversationHistory: Array<{ sender: string; content: string }> = [],
    nodeContext?: Record<string, unknown> & { chatbotInfo?: { id?: string } }
  ): Promise<AIResponse> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userInput,
            systemPrompt: this.buildSystemPrompt(systemPrompt, nodeContext),
            conversationHistory,
            nodeContext,
            chatbotId: nodeContext?.chatbotInfo?.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error && !result.fallback) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("AI response generation failed:", error);

      // Return local fallback response
      return this.getFallbackResponse(userInput);
    }
  }

  /**
   * Search FAQ entries for relevant answers
   */
  async searchFAQ(query: string): Promise<FAQEntry | null> {
    if (this.faqContext.length === 0) {
      return null;
    }

    try {
      // Simple keyword matching
      const queryLower = query.toLowerCase();
      const matches = this.faqContext.filter((faq) => {
        const questionMatch = faq.question.toLowerCase().includes(queryLower);
        const keywordMatch = faq.keywords.some(
          (keyword) =>
            queryLower.includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(queryLower)
        );
        return questionMatch || keywordMatch;
      });

      if (matches.length > 0) {
        return matches[0];
      }

      return null;
    } catch (error) {
      console.error("FAQ search error:", error);
      return null;
    }
  }

  /**
   * Process and extract FAQ entries from uploaded documents using server-side endpoint
   */
  async processFAQDocument(
    content: string,
    filename: string
  ): Promise<FAQEntry[]> {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/process-faq-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            filename,
            chatbotId: "temp", // This would be passed from the calling component
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.entries || [];
    } catch (error) {
      console.error("FAQ processing error:", error);
      return this.parseFAQFallback(content);
    }
  }

  /**
   * Build context-aware system prompt
   */
  private buildSystemPrompt(
    customPrompt?: string,
    nodeContext?: Record<string, unknown> & {
      conversationState?: unknown;
      userInfo?: unknown;
    }
  ): string {
    let prompt =
      customPrompt || "You are a helpful AI assistant for a business chatbot.";

    // Add chatbot context
    if (this.chatbotContext) {
      prompt += `\n\nChatbot Context: ${this.chatbotContext}`;
    }

    // Add FAQ context
    if (this.faqContext.length > 0) {
      prompt += "\n\nAvailable FAQ Information:\n";
      this.faqContext.slice(0, 10).forEach((faq, index) => {
        prompt += `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
      });
      prompt += "\nUse this FAQ information to answer questions when relevant.";
    }

    // Add node-specific context
    if (nodeContext) {
      if (nodeContext.conversationState) {
        prompt += `\n\nConversation Variables: ${JSON.stringify(
          nodeContext.conversationState
        )}`;
      }
      if (nodeContext.userInfo) {
        prompt += `\n\nUser Information: ${JSON.stringify(
          nodeContext.userInfo
        )}`;
      }
    }

    return prompt;
  }

  /**
   * Fallback response when server-side AI is not available
   */
  private getFallbackResponse(userInput: string): AIResponse {
    const input = userInput.toLowerCase();

    let response = "";
    let intent = "general_inquiry";
    let confidence = 0.6;

    if (input.includes("hello") || input.includes("hi")) {
      response = "Hello! How can I help you today?";
      intent = "greeting";
      confidence = 0.9;
    } else if (input.includes("help")) {
      response = "I'd be happy to help you! What do you need assistance with?";
      intent = "help_request";
      confidence = 0.8;
    } else if (input.includes("price") || input.includes("cost")) {
      response =
        "For pricing information, please contact our sales team or check our website.";
      intent = "pricing_inquiry";
      confidence = 0.7;
    } else if (input.includes("thank")) {
      response = "You're welcome! Is there anything else I can help you with?";
      intent = "gratitude";
      confidence = 0.9;
    } else {
      response =
        "I understand you're asking about that. For the most accurate information, I'd recommend speaking with one of our team members who can provide detailed assistance.";
    }

    return {
      response,
      intent,
      confidence,
      fallback: true,
      processing_time: 100,
    };
  }

  /**
   * Fallback FAQ parsing when server-side processing is not available
   */
  private parseFAQFallback(content: string): FAQEntry[] {
    const entries: FAQEntry[] = [];
    const lines = content.split("\n");

    let currentQuestion = "";
    let currentAnswer = "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("Q:") || trimmed.startsWith("Question:")) {
        if (currentQuestion && currentAnswer) {
          entries.push({
            question: currentQuestion,
            answer: currentAnswer,
            keywords: this.extractKeywords(
              currentQuestion + " " + currentAnswer
            ),
          });
        }
        currentQuestion = trimmed.replace(/^(Q:|Question:)\s*/, "");
        currentAnswer = "";
      } else if (trimmed.startsWith("A:") || trimmed.startsWith("Answer:")) {
        currentAnswer = trimmed.replace(/^(A:|Answer:)\s*/, "");
      } else if (currentAnswer && trimmed) {
        currentAnswer += " " + trimmed;
      }
    }

    // Add the last entry
    if (currentQuestion && currentAnswer) {
      entries.push({
        question: currentQuestion,
        answer: currentAnswer,
        keywords: this.extractKeywords(currentQuestion + " " + currentAnswer),
      });
    }

    return entries;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Remove common stop words
    const stopWords = [
      "this",
      "that",
      "with",
      "have",
      "will",
      "from",
      "they",
      "know",
      "want",
      "been",
      "good",
      "much",
      "some",
      "time",
      "very",
      "when",
      "come",
      "here",
      "just",
      "like",
      "long",
      "make",
      "many",
      "over",
      "such",
      "take",
      "than",
      "them",
      "well",
      "were",
    ];

    return [
      ...new Set(words.filter((word) => !stopWords.includes(word))),
    ].slice(0, 10);
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
