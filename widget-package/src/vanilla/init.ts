import { BotForgeConfig, BotForgeAPI } from '../types';

// Global registry for widget instances
const widgetInstances = new Map<string, any>();

export function initBotForge(config: BotForgeConfig): BotForgeAPI {
  const containerId = `botforge-widget-${Date.now()}`;
  
  // Create container element
  const container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);

  // Create widget instance (this would be the actual implementation)
  const widget = createVanillaWidget(container, config);
  
  // Store instance
  widgetInstances.set(containerId, widget);

  // Return API
  return {
    open: () => widget.open(),
    close: () => widget.close(),
    toggle: () => widget.toggle(),
    sendMessage: (message: string) => widget.sendMessage(message),
    setUser: (user: any) => widget.setUser(user),
    destroy: () => {
      widget.destroy();
      widgetInstances.delete(containerId);
      container.remove();
    },
    isOpen: () => widget.isOpen(),
  };
}

// Vanilla JavaScript widget implementation
function createVanillaWidget(container: HTMLElement, config: BotForgeConfig) {
  let isOpen = config.autoOpen || false;
  let messages: any[] = [];

  const theme = {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderRadius: '12px',
    ...config.theme,
  };

  const position = {
    bottom: '20px',
    right: '20px',
    ...config.position,
  };

  // Create widget HTML
  container.innerHTML = `
    <div id="botforge-widget" style="
      position: fixed;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      bottom: ${position.bottom};
      right: ${position.right};
      ${position.left ? `left: ${position.left};` : ''}
      ${position.top ? `top: ${position.top};` : ''}
    ">
      <div id="chat-window" style="
        width: ${theme.chatWidth || '380px'};
        height: ${theme.chatHeight || '500px'};
        background: ${theme.backgroundColor};
        border-radius: ${theme.borderRadius};
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        margin-bottom: 80px;
        display: ${isOpen ? 'flex' : 'none'};
        flex-direction: column;
        overflow: hidden;
      ">
        <div id="chat-header" style="
          background: ${theme.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center;">
            <div style="
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
            ">🤖</div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Chat Assistant</h3>
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">Online now</p>
            </div>
          </div>
          <button id="close-btn" style="
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            opacity: 0.8;
          ">×</button>
        </div>
        <div id="messages" style="
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        ">
          <div style="text-align: center; color: #6b7280; padding: 20px;">
            <p>👋 Hello! How can I help you today?</p>
          </div>
        </div>
        <div id="input-area" style="
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        ">
          <form id="message-form" style="display: flex; gap: 8px;">
            <input id="message-input" type="text" placeholder="Type your message..." style="
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
            ">
            <button type="submit" style="
              background: ${theme.primaryColor};
              color: white;
              border: none;
              border-radius: 8px;
              padding: 8px 16px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            ">Send</button>
          </form>
          ${config.showBranding !== false ? `
            <div style="text-align: center; margin-top: 8px;">
              <a href="https://botforge.site" target="_blank" style="
                font-size: 11px;
                color: #9ca3af;
                text-decoration: none;
              ">Powered by BotForge</a>
            </div>
          ` : ''}
        </div>
      </div>
      <button id="chat-button" style="
        width: ${theme.buttonSize === 'small' ? '48px' : theme.buttonSize === 'large' ? '64px' : '56px'};
        height: ${theme.buttonSize === 'small' ? '48px' : theme.buttonSize === 'large' ? '64px' : '56px'};
        background: ${theme.primaryColor};
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        color: white;
        font-size: ${theme.buttonSize === 'small' ? '20px' : theme.buttonSize === 'large' ? '28px' : '24px'};
        outline: none;
      ">${isOpen ? '×' : '💬'}</button>
    </div>
  `;

  // Add event listeners
  const chatButton = container.querySelector('#chat-button') as HTMLButtonElement;
  const closeBtn = container.querySelector('#close-btn') as HTMLButtonElement;
  const messageForm = container.querySelector('#message-form') as HTMLFormElement;
  const messageInput = container.querySelector('#message-input') as HTMLInputElement;
  const chatWindow = container.querySelector('#chat-window') as HTMLDivElement;
  const messagesContainer = container.querySelector('#messages') as HTMLDivElement;

  const toggleChat = () => {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'flex' : 'none';
    chatButton.textContent = isOpen ? '×' : '💬';
    
    if (isOpen) {
      config.events?.onOpen?.();
    } else {
      config.events?.onClose?.();
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    messages.push(userMessage);
    renderMessages();

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: `msg_${Date.now() + 1}`,
        content: "Thank you for your message! This is a demo response.",
        sender: 'bot',
        timestamp: new Date(),
      };
      
      messages.push(botMessage);
      renderMessages();
      config.events?.onMessage?.(botMessage);
    }, 1000);

    config.events?.onMessage?.(userMessage);
  };

  const renderMessages = () => {
    messagesContainer.innerHTML = messages.map(message => `
      <div style="display: flex; justify-content: ${message.sender === 'user' ? 'flex-end' : 'flex-start'};">
        <div style="
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 12px;
          background: ${message.sender === 'user' ? theme.primaryColor : '#f3f4f6'};
          color: ${message.sender === 'user' ? 'white' : theme.textColor};
          font-size: 14px;
          line-height: 1.4;
        ">${message.content}</div>
      </div>
    `).join('');
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  chatButton.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);
  
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(messageInput.value);
    messageInput.value = '';
  });

  // Initialize
  if (isOpen) {
    config.events?.onOpen?.();
  }
  
  setTimeout(() => {
    config.events?.onReady?.();
  }, 100);

  return {
    open: () => {
      if (!isOpen) toggleChat();
    },
    close: () => {
      if (isOpen) toggleChat();
    },
    toggle: toggleChat,
    sendMessage,
    setUser: (user: any) => {
      // Update user context
    },
    destroy: () => {
      // Cleanup
    },
    isOpen: () => isOpen,
  };
}