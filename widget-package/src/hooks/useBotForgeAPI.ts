import { useCallback, useRef } from 'react';
import { BotForgeMessage, BotForgeUser } from '../types';

interface UseBotForgeAPIProps {
  chatbotId: string;
  apiUrl: string;
  user?: BotForgeUser;
  onMessage?: (message: BotForgeMessage) => void;
  onError?: (error: Error) => void;
}

export const useBotForgeAPI = ({
  chatbotId,
  apiUrl,
  user,
  onMessage,
  onError,
}: UseBotForgeAPIProps) => {
  const conversationIdRef = useRef<string | null>(null);
  const userIdentifierRef = useRef<string>(user?.id || `user_${Date.now()}`);

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const initializeConversation = useCallback(async () => {
    try {
      conversationIdRef.current = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send welcome message
      const welcomeMessage: BotForgeMessage = {
        id: generateMessageId(),
        content: "Hello! How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
      };

      onMessage?.(welcomeMessage);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onMessage, onError]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      // Add user message immediately
      const userMessage: BotForgeMessage = {
        id: generateMessageId(),
        content,
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
      };

      onMessage?.(userMessage);

      // Simulate API call to BotForge backend
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          message: content,
          conversationId: conversationIdRef.current,
          userIdentifier: userIdentifierRef.current,
          user,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add bot response
      const botMessage: BotForgeMessage = {
        id: generateMessageId(),
        content: data.response || "I'm sorry, I couldn't process your message right now.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        metadata: data.metadata,
      };

      onMessage?.(botMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: BotForgeMessage = {
        id: generateMessageId(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
      };

      onMessage?.(errorMessage);
      onError?.(error as Error);
    }
  }, [chatbotId, apiUrl, user, onMessage, onError]);

  const setUser = useCallback((newUser: BotForgeUser) => {
    if (newUser.id) {
      userIdentifierRef.current = newUser.id;
    }
  }, []);

  return {
    initializeConversation,
    sendMessage,
    setUser,
  };
};