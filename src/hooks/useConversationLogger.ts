import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for logging conversation events
 * 
 * This hook provides a simple interface for logging various conversation events
 * to the backend for quality assurance, compliance, and analytics purposes.
 * 
 * Usage:
 * const logger = useConversationLogger();
 * 
 * // Log conversation start
 * logger.logConversationStart(conversationId, chatbotId, userIdentifier, channelType);
 * 
 * // Log message
 * logger.logMessage(conversationId, chatbotId, messageData);
 * 
 * // Log feedback
 * logger.logFeedback(conversationId, chatbotId, feedbackData);
 */

interface MessageData {
  sender: 'user' | 'bot';
  content: string;
  messageType: string;
  nodeId?: string;
  responseTimeMs?: number;
  intentDetected?: string;
  confidenceScore?: number;
  fallbackTriggered?: boolean;
  processingTimeMs?: number;
  errorDetails?: any;
}

interface FeedbackData {
  type: 'rating' | 'nps' | 'survey' | 'thumbs' | 'custom';
  ratingValue?: number;
  npsScore?: number;
  feedbackText?: string;
  feedbackData?: any;
  sentiment?: 'positive' | 'neutral' | 'negative';
  categories?: string[];
}

interface GoalData {
  goalType: string;
  goalValue?: number;
  goalMetadata?: any;
}

interface HandoffData {
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  agentId?: string;
}

export function useConversationLogger() {
  const logEvent = useCallback(async (eventType: string, data: any) => {
    try {
      // Get user context
      const userAgent = navigator.userAgent;
      const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
      
      // Store session ID for future use
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }

      // Get device info
      const deviceInfo = {
        type: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop',
        os: getOperatingSystem(userAgent),
        browser: getBrowser(userAgent),
        screenSize: `${screen.width}x${screen.height}`
      };

      // Get geolocation (if available and permitted)
      let geolocation = null;
      try {
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          geolocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        }
      } catch (error) {
        // Geolocation not available or denied
        console.debug('Geolocation not available:', error);
      }

      const eventData = {
        type: eventType,
        sessionId,
        userAgent,
        deviceInfo,
        geolocation,
        timestamp: new Date().toISOString(),
        ...data
      };

      // Send to conversation logger edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-logger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Logging failed: ${response.statusText}. ${errorData.details || ''}`);
      }

      console.debug(`Logged event: ${eventType}`, eventData);
    } catch (error) {
      console.error('Failed to log conversation event:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }, []);

  const logConversationStart = useCallback(async (
    conversationId: string,
    chatbotId: string,
    userIdentifier: string,
    channelType: string,
    metadata?: any
  ) => {
    await logEvent('start', {
      conversation_id: conversationId,
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      channel_type: channelType,
      data: metadata
    });
  }, [logEvent]);

  const logConversationEnd = useCallback(async (
    conversationId: string,
    chatbotId: string,
    userIdentifier: string,
    outcome: 'completed' | 'abandoned' | 'transferred' | 'error',
    metadata?: any
  ) => {
    await logEvent('end', {
      conversation_id: conversationId,
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      data: {
        outcome,
        ...metadata
      }
    });
  }, [logEvent]);

  const logMessage = useCallback(async (
    conversationId: string,
    chatbotId: string,
    userIdentifier: string,
    messageData: MessageData,
    metadata?: any
  ) => {
    await logEvent('message', {
      conversation_id: conversationId,
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      channel_type: 'web',
      data: {
        sender: messageData.sender,
        content: messageData.content,
        message_type: messageData.messageType,
        node_id: messageData.nodeId,
        metadata: {
          responseTimeMs: messageData.responseTimeMs,
          intentDetected: messageData.intentDetected,
          confidenceScore: messageData.confidenceScore,
          fallbackTriggered: messageData.fallbackTriggered,
          processingTimeMs: messageData.processingTimeMs,
          errorDetails: messageData.errorDetails,
          ...metadata
        }
      }
    });
  }, [logEvent]);

  const logFeedback = useCallback(async (
    conversationId: string,
    chatbotId: string,
    userIdentifier: string,
    feedbackData: FeedbackData,
    metadata?: any
  ) => {
    await logEvent('feedback', {
      conversation_id: conversationId,
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      data: {
        feedback_type: feedbackData.type,
        rating_value: feedbackData.ratingValue,
        nps_score: feedbackData.npsScore,
        feedback_text: feedbackData.feedbackText,
        feedback_data: feedbackData.feedbackData,
        sentiment: feedbackData.sentiment,
        categories: feedbackData.categories,
        ...metadata
      }
    });
  }, [logEvent]);

  const logGoalAchieved = useCallback(async (
    conversationId: string,
    chatbotId: string,
    userIdentifier: string,
    goalData: GoalData,
    metadata?: any
  ) => {
    await logEvent('goal_achieved', {
      conversation_id: conversationId,
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      data: {
        goalType: goalData.goalType,
        goalValue: goalData.goalValue,
        goalMetadata: goalData.goalMetadata,
        ...metadata
      }
    });
  }, [logEvent]);

  const logHandoffRequested = useCallback(async (
    conversationId: string,
    chatbotId: string,
    userIdentifier: string,
    handoffData: HandoffData,
    metadata?: any
  ) => {
    await logEvent('handoff_requested', {
      conversation_id: conversationId,
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      data: {
        reason: handoffData.reason,
        priority: handoffData.priority,
        department: handoffData.department,
        agentId: handoffData.agentId,
        ...metadata
      }
    });
  }, [logEvent]);

  return {
    logConversationStart,
    logConversationEnd,
    logMessage,
    logFeedback,
    logGoalAchieved,
    logHandoffRequested
  };
}

// Utility functions
function generateSessionId(): string {
  return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}