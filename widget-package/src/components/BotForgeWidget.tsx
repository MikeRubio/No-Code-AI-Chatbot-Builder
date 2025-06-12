import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BotForgeConfig, BotForgeMessage, BotForgeAPI } from '../types';
import { ChatWindow } from './ChatWindow';
import { ChatButton } from './ChatButton';
import { useBotForgeAPI } from '../hooks/useBotForgeAPI';

interface BotForgeWidgetProps extends BotForgeConfig {
  className?: string;
  style?: React.CSSProperties;
}

export const BotForgeWidget = React.forwardRef<BotForgeAPI, BotForgeWidgetProps>(
  (props, ref) => {
    const {
      chatbotId,
      apiUrl = 'https://botforge.site',
      theme = {},
      position = { bottom: '20px', right: '20px' },
      autoOpen = false,
      showBranding = true,
      user,
      events,
      className,
      style,
    } = props;

    const [isOpen, setIsOpen] = useState(autoOpen);
    const [messages, setMessages] = useState<BotForgeMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const api = useBotForgeAPI({
      chatbotId,
      apiUrl,
      user,
      onMessage: (message) => {
        setMessages(prev => [...prev, message]);
        events?.onMessage?.(message);
        if (message.sender === 'user') {
          events?.onUserMessage?.(message);
        } else {
          events?.onBotMessage?.(message);
        }
      },
      onError: events?.onError,
    });

    // Expose API methods via ref
    React.useImperativeHandle(ref, () => ({
      open: () => {
        setIsOpen(true);
        events?.onOpen?.();
      },
      close: () => {
        setIsOpen(false);
        events?.onClose?.();
      },
      toggle: () => {
        setIsOpen(prev => {
          const newState = !prev;
          if (newState) {
            events?.onOpen?.();
          } else {
            events?.onClose?.();
          }
          return newState;
        });
      },
      sendMessage: api.sendMessage,
      setUser: api.setUser,
      destroy: () => {
        setIsOpen(false);
        setMessages([]);
      },
      isOpen: () => isOpen,
    }), [isOpen, api, events]);

    const handleToggle = useCallback(() => {
      setIsOpen(prev => {
        const newState = !prev;
        if (newState) {
          events?.onOpen?.();
        } else {
          events?.onClose?.();
        }
        return newState;
      });
    }, [events]);

    const handleSendMessage = useCallback(async (content: string) => {
      setIsLoading(true);
      try {
        await api.sendMessage(content);
      } catch (error) {
        console.error('Failed to send message:', error);
        events?.onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    }, [api, events]);

    useEffect(() => {
      if (isOpen && messages.length === 0) {
        // Initialize conversation
        api.initializeConversation();
      }
    }, [isOpen, messages.length, api]);

    useEffect(() => {
      events?.onReady?.();
    }, [events]);

    const containerStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      fontFamily: theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ...position,
      ...style,
    };

    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
      >
        <AnimatePresence>
          {isOpen && (
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              onClose={() => {
                setIsOpen(false);
                events?.onClose?.();
              }}
              isLoading={isLoading}
              theme={theme}
              showBranding={showBranding}
              chatbotId={chatbotId}
            />
          )}
        </AnimatePresence>

        <ChatButton
          onClick={handleToggle}
          isOpen={isOpen}
          theme={theme}
        />
      </div>
    );
  }
);

BotForgeWidget.displayName = 'BotForgeWidget';