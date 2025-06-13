// BotForge Widget - Standalone Version
// This is a self-contained version that can be loaded directly in any website

(function () {
  "use strict";

  // Widget configuration
  let config = {
    chatbotId: "",
    apiUrl: "https://botforge.site",
    theme: {
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      borderRadius: "12px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      buttonSize: "medium",
      chatHeight: "500px",
      chatWidth: "380px",
    },
    position: {
      bottom: "20px",
      right: "20px",
    },
    autoOpen: false,
    showBranding: true,
    user: null,
    events: {},
  };

  // Widget state
  let isOpen = false;
  let messages = [];
  let conversationId = null;
  let userIdentifier = null;
  let isLoading = false;

  // DOM elements
  let widgetContainer = null;
  let chatWindow = null;
  let chatButton = null;

  // Initialize the widget
  function initBotForge(userConfig) {
    config = { ...config, ...userConfig };

    if (!config.chatbotId) {
      console.error("BotForge: chatbotId is required");
      return null;
    }

    createWidgetElements();

    if (config.autoOpen) {
      openChat();
    }

    // Trigger ready event
    if (config.events.onReady) {
      config.events.onReady();
    }

    return {
      open: openChat,
      close: closeChat,
      toggle: toggleChat,
      sendMessage: sendMessage,
      setUser: setUser,
      isOpen: () => isOpen,
      destroy: destroyWidget,
    };
  }

  // Create widget DOM elements
  function createWidgetElements() {
    // Create container
    widgetContainer = document.createElement("div");
    widgetContainer.id = "botforge-widget";
    widgetContainer.style.cssText = `
      position: fixed;
      z-index: 9999;
      font-family: ${config.theme.fontFamily};
      ${config.position.bottom ? `bottom: ${config.position.bottom};` : ""}
      ${config.position.right ? `right: ${config.position.right};` : ""}
      ${config.position.left ? `left: ${config.position.left};` : ""}
      ${config.position.top ? `top: ${config.position.top};` : ""}
    `;

    // Create chat button
    createChatButton();

    document.body.appendChild(widgetContainer);
  }

  // Create chat button
  function createChatButton() {
    chatButton = document.createElement("button");
    chatButton.id = "chat-button";
    chatButton.innerHTML = "💬";

    const buttonSize = getButtonSize();
    chatButton.style.cssText = `
      width: ${buttonSize.width};
      height: ${buttonSize.height};
      background-color: ${config.theme.primaryColor};
      color: #ffffff;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      font-size: ${buttonSize.fontSize};
      transition: transform 0.2s ease;
      outline: none;
    `;

    chatButton.addEventListener("click", openChat);
    chatButton.addEventListener("mouseenter", () => {
      chatButton.style.transform = "scale(1.05)";
    });
    chatButton.addEventListener("mouseleave", () => {
      chatButton.style.transform = "scale(1)";
    });

    widgetContainer.appendChild(chatButton);
  }

  // Get button size based on theme
  function getButtonSize() {
    switch (config.theme.buttonSize) {
      case "small":
        return { width: "50px", height: "50px", fontSize: "20px" };
      case "large":
        return { width: "70px", height: "70px", fontSize: "28px" };
      default:
        return { width: "60px", height: "60px", fontSize: "24px" };
    }
  }

  // Create chat window
  function createChatWindow() {
    chatWindow = document.createElement("div");
    chatWindow.id = "chat-window";
    chatWindow.style.cssText = `
      width: ${config.theme.chatWidth};
      height: ${config.theme.chatHeight};
      background-color: ${config.theme.backgroundColor};
      border-radius: ${config.theme.borderRadius};
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 20px;
      opacity: 0;
      transform: scale(0.9) translateY(20px);
      transition: all 0.2s ease;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      background-color: ${config.theme.primaryColor};
      color: #ffffff;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const headerContent = document.createElement("div");
    headerContent.innerHTML = `
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Chat Support</h3>
      <p style="margin: 0; font-size: 12px; opacity: 0.8;">We're here to help</p>
    `;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #ffffff;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    `;
    closeButton.addEventListener("click", closeChat);

    header.appendChild(headerContent);
    header.appendChild(closeButton);

    // Messages container
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "messages-container";
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Input container
    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
    `;

    const inputForm = document.createElement("form");
    inputForm.style.position = "relative";

    const messageInput = document.createElement("textarea");
    messageInput.id = "message-input";
    messageInput.placeholder = "Type your message...";
    messageInput.rows = 1;
    messageInput.style.cssText = `
      width: 100%;
      padding: 12px 60px 12px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      resize: none;
      font-family: inherit;
      box-sizing: border-box;
    `;

    const sendButton = document.createElement("button");
    sendButton.type = "submit";
    sendButton.innerHTML = "Send";
    sendButton.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background-color: ${config.theme.primaryColor};
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
    `;

    inputForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (message && !isLoading) {
        sendMessage(message);
        messageInput.value = "";
      }
    });

    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        inputForm.dispatchEvent(new Event("submit"));
      }
    });

    inputForm.appendChild(messageInput);
    inputForm.appendChild(sendButton);
    inputContainer.appendChild(inputForm);

    // Branding
    if (config.showBranding) {
      const branding = document.createElement("div");
      branding.style.cssText = `
        text-align: center;
        margin-top: 8px;
        font-size: 11px;
        color: #6b7280;
      `;
      branding.innerHTML = `
        Powered by <a href="https://botforge.site" target="_blank" rel="noopener noreferrer" 
        style="color: ${config.theme.primaryColor}; text-decoration: none;">BotForge</a>
      `;
      inputContainer.appendChild(branding);
    }

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputContainer);

    widgetContainer.appendChild(chatWindow);

    // Animate in
    setTimeout(() => {
      chatWindow.style.opacity = "1";
      chatWindow.style.transform = "scale(1) translateY(0)";
    }, 10);
  }

  // Open chat
  function openChat() {
    if (isOpen) return;

    isOpen = true;
    chatButton.style.display = "none";
    createChatWindow();

    if (config.events.onOpen) {
      config.events.onOpen();
    }

    // Initialize conversation if not already done
    if (!conversationId) {
      initializeConversation();
    }
  }

  // Close chat
  function closeChat() {
    if (!isOpen) return;

    isOpen = false;
    chatButton.style.display = "flex";

    if (chatWindow) {
      chatWindow.style.opacity = "0";
      chatWindow.style.transform = "scale(0.9) translateY(20px)";
      setTimeout(() => {
        if (chatWindow) {
          widgetContainer.removeChild(chatWindow);
          chatWindow = null;
        }
      }, 200);
    }

    if (config.events.onClose) {
      config.events.onClose();
    }
  }

  // Toggle chat
  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // Initialize conversation
  async function initializeConversation() {
    if (conversationId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${config.apiUrl}/functions/v1/widget-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatbotId: config.chatbotId,
            action: "initialize",
            userIdentifier: config.user?.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      conversationId = data.conversationId;
      userIdentifier = data.userIdentifier;

      if (data.welcomeMessage) {
        const welcomeMsg = {
          id: data.welcomeMessage.id,
          content: data.welcomeMessage.content,
          sender: "bot",
          timestamp: new Date(data.welcomeMessage.timestamp),
          type: "text",
        };
        addMessage(welcomeMsg);
      }

      if (config.events.onReady) {
        config.events.onReady();
      }
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
      if (config.events.onError) {
        config.events.onError(error);
      }

      // Fallback welcome message
      const fallbackMessage = {
        id: `msg_${Date.now()}`,
        content: "Hello! How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      };
      addMessage(fallbackMessage);
    } finally {
      setLoading(false);
    }
  }

  // Send message
  async function sendMessage(content) {
    if (!content.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    addMessage(userMessage);

    if (!conversationId) {
      await initializeConversation();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${config.apiUrl}/functions/v1/widget-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatbotId: config.chatbotId,
            conversationId: conversationId,
            message: content,
            action: "send_message",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.botMessage) {
        const botMessage = {
          id: data.botMessage.id,
          content: data.botMessage.content,
          sender: "bot",
          timestamp: new Date(data.botMessage.timestamp),
          type: "text",
        };

        addMessage(botMessage);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      if (config.events.onError) {
        config.events.onError(error);
      }

      // Fallback response
      const fallbackResponse = {
        id: `msg_${Date.now()}_fallback`,
        content:
          "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      };

      addMessage(fallbackResponse);
    } finally {
      setLoading(false);
    }
  }

  // Add message to UI
  function addMessage(message) {
    messages.push(message);

    if (config.events.onMessage) {
      config.events.onMessage(message);
    }

    if (message.sender === "user" && config.events.onUserMessage) {
      config.events.onUserMessage(message);
    } else if (message.sender === "bot" && config.events.onBotMessage) {
      config.events.onBotMessage(message);
    }

    if (chatWindow) {
      renderMessages();
    }
  }

  // Render messages in UI
  function renderMessages() {
    const messagesContainer = document.getElementById("messages-container");
    if (!messagesContainer) return;

    messagesContainer.innerHTML = "";

    messages.forEach((message) => {
      const messageElement = createMessageElement(message);
      messagesContainer.appendChild(messageElement);
    });

    if (isLoading) {
      const typingElement = createTypingIndicator();
      messagesContainer.appendChild(typingElement);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Create message element
  function createMessageElement(message) {
    const isUser = message.sender === "user";

    const messageWrapper = document.createElement("div");
    messageWrapper.style.cssText = `
      display: flex;
      justify-content: ${isUser ? "flex-end" : "flex-start"};
      margin-bottom: 8px;
    `;

    const messageBubble = document.createElement("div");
    messageBubble.style.cssText = `
      background-color: ${isUser ? config.theme.primaryColor : "#f3f4f6"};
      color: ${isUser ? "#ffffff" : config.theme.textColor};
      padding: 12px 16px;
      border-radius: 18px;
      max-width: 70%;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    `;
    messageBubble.textContent = message.content;

    const timeElement = document.createElement("div");
    timeElement.style.cssText = `
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
      text-align: ${isUser ? "right" : "left"};
    `;
    timeElement.textContent = message.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const container = document.createElement("div");
    container.appendChild(messageWrapper);
    container.appendChild(timeElement);

    messageWrapper.appendChild(messageBubble);

    return container;
  }

  // Create typing indicator
  function createTypingIndicator() {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      display: flex;
      justify-content: flex-start;
      margin-bottom: 8px;
    `;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      background-color: #f3f4f6;
      padding: 12px 16px;
      border-radius: 18px;
      max-width: 70%;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    const text = document.createElement("span");
    text.textContent = "Typing";
    text.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      margin-right: 8px;
    `;

    bubble.appendChild(text);

    // Add animated dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 6px;
        height: 6px;
        background-color: #9ca3af;
        border-radius: 50%;
        animation: typing-dot 1s infinite;
        animation-delay: ${i * 0.2}s;
      `;
      bubble.appendChild(dot);
    }

    wrapper.appendChild(bubble);
    return wrapper;
  }

  // Set loading state
  function setLoading(loading) {
    isLoading = loading;

    const sendButton = document.querySelector(
      '#chat-window button[type="submit"]'
    );
    const messageInput = document.getElementById("message-input");

    if (sendButton) {
      sendButton.disabled = loading;
      sendButton.style.opacity = loading ? "0.6" : "1";
      sendButton.style.cursor = loading ? "not-allowed" : "pointer";
    }

    if (messageInput) {
      messageInput.disabled = loading;
    }

    if (chatWindow) {
      renderMessages();
    }
  }

  // Set user
  function setUser(user) {
    config.user = user;
  }

  // Destroy widget
  function destroyWidget() {
    if (widgetContainer) {
      document.body.removeChild(widgetContainer);
      widgetContainer = null;
      chatWindow = null;
      chatButton = null;
    }

    isOpen = false;
    messages = [];
    conversationId = null;
    userIdentifier = null;
  }

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes typing-dot {
      0%, 60%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      30% {
        transform: scale(1.2);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Expose to global scope
  window.BotForge = {
    initBotForge: initBotForge,
  };
})();
