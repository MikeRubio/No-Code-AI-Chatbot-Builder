import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for demo purposes - in production, use server-side
});

interface AIResponse {
  response: string;
  intent: string;
  confidence: number;
  tokens_used?: number;
  processing_time?: number;
}

interface FAQEntry {
  question: string;
  answer: string;
  keywords: string[];
}

class OpenAIService {
  private faqContext: FAQEntry[] = [];
  private chatbotContext: string = "";

  constructor() {
    this.validateApiKey();
  }

  private validateApiKey(): boolean {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (
      !apiKey ||
      apiKey.includes("your_") ||
      apiKey === "---------------------------"
    ) {
      console.warn(
        "OpenAI API key not configured. AI features will use fallback responses."
      );
      return false;
    }
    return true;
  }

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
   * Generate AI response based on user input and context
   */
  async generateResponse(
    userInput: string,
    systemPrompt?: string,
    conversationHistory: Array<{ sender: string; content: string }> = [],
    nodeContext?: any
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Check if API key is configured
      if (!this.validateApiKey()) {
        return this.getFallbackResponse(userInput);
      }

      // Build context-aware system prompt
      const contextualPrompt = this.buildSystemPrompt(
        systemPrompt,
        nodeContext
      );

      // Prepare conversation messages
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: contextualPrompt },
      ];

      // Add conversation history (last 10 messages to stay within token limits)
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg) => {
        messages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });

      // Add current user input
      messages.push({ role: "user", content: userInput });

      // Generate response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response =
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response at this time.";
      const tokensUsed = completion.usage?.total_tokens || 0;
      const processingTime = Date.now() - startTime;

      // Analyze intent and confidence
      const { intent, confidence } = await this.analyzeIntent(
        userInput,
        response
      );

      return {
        response: response.trim(),
        intent,
        confidence,
        tokens_used: tokensUsed,
        processing_time: processingTime,
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);

      // Return fallback response on error
      return {
        ...this.getFallbackResponse(userInput),
        processing_time: Date.now() - startTime,
      };
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
      // Simple keyword matching for now
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
        // Return the best match (first one for now)
        return matches[0];
      }

      // If no direct match, use AI to find semantic similarity
      if (this.validateApiKey()) {
        const semanticMatch = await this.findSemanticMatch(query);
        return semanticMatch;
      }

      return null;
    } catch (error) {
      console.error("FAQ search error:", error);
      return null;
    }
  }

  /**
   * Generate embeddings for FAQ entries (for semantic search)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      if (!this.validateApiKey()) {
        return [];
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error("Embedding generation error:", error);
      return [];
    }
  }

  /**
   * Process and extract FAQ entries from uploaded documents
   */
  async processFAQDocument(
    content: string,
    filename: string
  ): Promise<FAQEntry[]> {
    try {
      if (!this.validateApiKey()) {
        return this.parseFAQFallback(content);
      }

      const prompt = `
        Extract FAQ entries from the following document content. 
        Return a JSON array of objects with "question", "answer", and "keywords" fields.
        Keywords should be an array of relevant terms for each FAQ entry.
        
        Document: ${filename}
        Content: ${content}
        
        Format:
        [
          {
            "question": "What are your business hours?",
            "answer": "We're open Monday-Friday 9AM-6PM",
            "keywords": ["hours", "open", "schedule", "time"]
          }
        ]
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || "[]";

      try {
        const faqEntries = JSON.parse(response);
        return Array.isArray(faqEntries) ? faqEntries : [];
      } catch (parseError) {
        console.error("Failed to parse FAQ JSON:", parseError);
        return this.parseFAQFallback(content);
      }
    } catch (error) {
      console.error("FAQ processing error:", error);
      return this.parseFAQFallback(content);
    }
  }

  /**
   * Analyze user intent and confidence
   */
  private async analyzeIntent(
    userInput: string,
    aiResponse: string
  ): Promise<{ intent: string; confidence: number }> {
    // Simple intent classification based on keywords
    const input = userInput.toLowerCase();

    if (
      input.includes("hello") ||
      input.includes("hi") ||
      input.includes("hey")
    ) {
      return { intent: "greeting", confidence: 0.9 };
    }

    if (
      input.includes("help") ||
      input.includes("support") ||
      input.includes("assist")
    ) {
      return { intent: "help_request", confidence: 0.85 };
    }

    if (
      input.includes("price") ||
      input.includes("cost") ||
      input.includes("fee")
    ) {
      return { intent: "pricing_inquiry", confidence: 0.8 };
    }

    if (input.includes("thank") || input.includes("thanks")) {
      return { intent: "gratitude", confidence: 0.9 };
    }

    if (
      input.includes("bye") ||
      input.includes("goodbye") ||
      input.includes("exit")
    ) {
      return { intent: "farewell", confidence: 0.85 };
    }

    // Default to general inquiry
    return { intent: "general_inquiry", confidence: 0.7 };
  }

  /**
   * Build context-aware system prompt
   */
  private buildSystemPrompt(customPrompt?: string, nodeContext?: any): string {
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

    prompt += `
    
Guidelines:
- Be helpful, friendly, and professional
- Keep responses concise but informative
- If you don't know something, say so and offer to connect them with a human
- Use the FAQ information when relevant
- Personalize responses using any available user information
- Stay in character as a business assistant`;

    return prompt;
  }

  /**
   * Find semantic match using AI
   */
  private async findSemanticMatch(query: string): Promise<FAQEntry | null> {
    try {
      const faqText = this.faqContext
        .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join("\n\n");

      const prompt = `
        Given this query: "${query}"
        
        Find the most relevant FAQ entry from the following list:
        ${faqText}
        
        Return only the JSON object of the most relevant FAQ entry in this format:
        {
          "question": "...",
          "answer": "...",
          "keywords": [...]
        }
        
        If no relevant entry is found, return null.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content || "null";

      try {
        const result = JSON.parse(response);
        return result && typeof result === "object" ? result : null;
      } catch {
        return null;
      }
    } catch (error) {
      console.error("Semantic search error:", error);
      return null;
    }
  }

  /**
   * Fallback response when OpenAI is not available
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

    return { response, intent, confidence };
  }

  /**
   * Fallback FAQ parsing when OpenAI is not available
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
