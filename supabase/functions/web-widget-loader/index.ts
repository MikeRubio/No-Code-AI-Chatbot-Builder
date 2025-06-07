import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Return the widget JavaScript code
  const widgetJS = `
(function() {
  'use strict';
  
  window.ChatbotWidget = {
    init: function(config) {
      this.config = config;
      this.createWidget();
      this.bindEvents();
    },
    
    createWidget: function() {
      // Create widget container
      const widget = document.createElement('div');
      widget.id = 'chatbot-widget-container';
      widget.style.cssText = \`
        position: fixed;
        \${this.getPositionStyles()}
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: none;
        flex-direction: column;
        overflow: hidden;
      \`;
      
      // Create widget button
      const button = document.createElement('div');
      button.id = 'chatbot-widget-button';
      button.style.cssText = \`
        position: fixed;
        \${this.getPositionStyles()}
        width: 60px;
        height: 60px;
        background: \${this.config.color};
        border-radius: 50%;
        cursor: pointer;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
      \`;
      
      button.innerHTML = \`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      \`;
      
      // Create widget content
      widget.innerHTML = \`
        <div style="background: \${this.config.color}; color: white; padding: 16px; font-weight: 600;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Chat Support</span>
            <button id="chatbot-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">&times;</button>
          </div>
        </div>
        <div id="chatbot-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb;">
          <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            \${this.config.welcomeMessage}
          </div>
        </div>
        <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; gap: 8px;">
            <input 
              id="chatbot-input" 
              type="text" 
              placeholder="\${this.config.placeholderText}"
              style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none;"
            />
            <button 
              id="chatbot-send"
              style="background: \${this.config.color}; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
            >
              Send
            </button>
          </div>
        </div>
      \`;
      
      document.body.appendChild(button);
      document.body.appendChild(widget);
      
      this.widget = widget;
      this.button = button;
    },
    
    getPositionStyles: function() {
      const position = this.config.position || 'bottom-right';
      switch(position) {
        case 'bottom-left':
          return 'bottom: 20px; left: 20px;';
        case 'top-right':
          return 'top: 20px; right: 20px;';
        case 'top-left':
          return 'top: 20px; left: 20px;';
        default:
          return 'bottom: 20px; right: 20px;';
      }
    },
    
    bindEvents: function() {
      const self = this;
      
      // Toggle widget
      this.button.addEventListener('click', function() {
        const isVisible = self.widget.style.display === 'flex';
        self.widget.style.display = isVisible ? 'none' : 'flex';
      });
      
      // Close widget
      document.getElementById('chatbot-close').addEventListener('click', function() {
        self.widget.style.display = 'none';
      });
      
      // Send message
      const input = document.getElementById('chatbot-input');
      const sendBtn = document.getElementById('chatbot-send');
      
      function sendMessage() {
        const message = input.value.trim();
        if (!message) return;
        
        self.addMessage(message, 'user');
        input.value = '';
        
        // Send to chatbot API
        self.sendToChatbot(message);
      }
      
      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    },
    
    addMessage: function(content, sender) {
      const messagesContainer = document.getElementById('chatbot-messages');
      const messageDiv = document.createElement('div');
      
      const isUser = sender === 'user';
      messageDiv.style.cssText = \`
        background: \${isUser ? this.config.color : 'white'};
        color: \${isUser ? 'white' : 'black'};
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        margin-left: \${isUser ? '20px' : '0'};
        margin-right: \${isUser ? '0' : '20px'};
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      \`;
      
      messageDiv.textContent = content;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    sendToChatbot: function(message) {
      const self = this;
      
      // Show typing indicator
      this.addMessage('Typing...', 'bot');
      
      // Simulate API call (replace with actual chatbot API)
      setTimeout(function() {
        // Remove typing indicator
        const messages = document.getElementById('chatbot-messages');
        messages.removeChild(messages.lastChild);
        
        // Add bot response
        self.addMessage('Thank you for your message! This is a demo response. The chatbot will be connected to your actual bot logic.', 'bot');
      }, 1000);
    }
  };
})();
`;

  return new Response(widgetJS, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript',
    },
  })
})