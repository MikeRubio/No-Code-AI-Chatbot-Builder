import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BotForgeMessage, BotForgeTheme } from '../types';

interface ChatWindowProps {
  messages: BotForgeMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  isLoading: boolean;
  theme: BotForgeTheme;
  showBranding: boolean;
  chatbotId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  onClose,
  isLoading,
  theme,
  showBranding,
  chatbotId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const windowStyle: React.CSSProperties = {
    width: theme.chatWidth || '380px',
    height: theme.chatHeight || '500px',
    backgroundColor: theme.backgroundColor || '#ffffff',
    borderRadius: theme.borderRadius || '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    marginBottom: '80px',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.2 }}
      style={windowStyle}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: theme.primaryColor || '#3b82f6',
          color: '#ffffff',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
            }}
          >
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Chat Assistant
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
              Online now
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            opacity: 0.8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            <p>👋 Hello! How can I help you today?</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: message.sender === 'user' 
                  ? (theme.primaryColor || '#3b82f6')
                  : '#f3f4f6',
                color: message.sender === 'user' 
                  ? '#ffffff' 
                  : (theme.textColor || '#1f2937'),
                fontSize: '14px',
                lineHeight: '1.4',
              }}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s infinite ease-in-out',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s infinite ease-in-out 0.16s',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s infinite ease-in-out 0.32s',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: theme.textColor || '#1f2937',
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            style={{
              backgroundColor: theme.primaryColor || '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
            }}
          >
            Send
          </button>
        </form>

        {showBranding && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <a
              href="https://botforge.site"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                textDecoration: 'none',
              }}
            >
              Powered by BotForge
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </motion.div>
  );
};