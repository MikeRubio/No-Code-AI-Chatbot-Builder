(function() {
  'use strict';

  // Widget configuration
  let widgetConfig = {
    chatbotId: null,
    apiUrl: 'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--858c0e43.local-credentialless.webcontainer-api.io',
    supabaseUrl: null,
    supabaseAnonKey: null,
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#3B82F6',
    title: 'Chat with us',
    subtitle: 'We\'re here to help!',
    placeholder: 'Type your message...',
    welcomeMessage: 'Hello! How can I help you today?',
    offlineMessage: 'We\'re currently offline. Please leave a message and we\'ll get back to you.',
    poweredBy: true,
    autoOpen: false,
    showOnPages: [],
    hideOnPages: [],
    triggers: {
      timeDelay: 0,
      scrollPercentage: 0,
      exitIntent: false,
      pageViews: 0
    }
  };

  // Global state
  let isOpen = false;
  let isMinimized = false;
  let conversationId = null;
  let userIdentifier = null;
  let currentNodeId = null;
  let conversationState = {};
  let chatbotFlow = null;
  let isLoading = false;

  // Initialize widget
  function initWidget(config) {
    // Merge user config with defaults
    widgetConfig = { ...widgetConfig, ...config };
    
    // Validate required config
    if (!widgetConfig.chatbotId) {
      console.error('BotForge Widget: chatbotId is required');
      return;
    }

    // Generate user identifier
    userIdentifier = getUserIdentifier();
    
    // Load chatbot configuration and flow
    loadChatbotData().then(() => {
      createWidget();
      setupTriggers();
    }).catch(error => {
      console.error('BotForge Widget: Failed to load chatbot data:', error);
      // Still create widget with fallback flow
      createWidget();
      setupTriggers();
    });
  }

  // Load chatbot data from API
  async function loadChatbotData() {
    try {
      isLoading = true;
      
      // First, try to get chatbot data from the main API
      let response = await fetch(`${widgetConfig.apiUrl}/api/chatbots/${widgetConfig.chatbotId}/public`);
      
      // If main API fails, try Supabase directly
      if (!response.ok && widgetConfig.supabaseUrl && widgetConfig.supabaseAnonKey) {
        response = await fetch(`${widgetConfig.supabaseUrl}/rest/v1/chatbots?id=eq.${widgetConfig.chatbotId}&select=*`, {
          headers: {
            'apikey': widgetConfig.supabaseAnonKey,
            'Authorization': `Bearer ${widgetConfig.supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const chatbot = data[0];
            chatbotFlow = chatbot.flow_data;
            
            // Update widget config with chatbot settings
            if (chatbot.name) widgetConfig.title = chatbot.name;
            if (chatbot.description) widgetConfig.subtitle = chatbot.description;
            
            return;
          }
        }
      } else if (response.ok) {
        const chatbot = await response.json();
        chatbotFlow = chatbot.flow_data;
        
        // Update widget config with chatbot settings
        if (chatbot.name) widgetConfig.title = chatbot.name;
        if (chatbot.description) widgetConfig.subtitle = chatbot.description;
        
        return;
      }
      
      throw new Error('Failed to load chatbot data');
    } catch (error) {
      console.warn('BotForge Widget: Using fallback flow due to error:', error);
      // Use fallback flow if loading fails
      chatbotFlow = getFallbackFlow();
    } finally {
      isLoading = false;
    }
  }

  // Get fallback flow for when chatbot data can't be loaded
  function getFallbackFlow() {
    return {
      nodes: [
        {
          id: 'start',
          type: 'start',
          data: {
            content: widgetConfig.welcomeMessage || 'Hello! How can I help you today?'
          }
        },
        {
          id: 'ai_response',
          type: 'ai_response',
          data: {
            systemPrompt: 'You are a helpful customer service assistant. Be friendly and helpful.'
          }
        }
      ],
      edges: [
        {
          id: 'start-to-ai',
          source: 'start',
          target: 'ai_response'
        }
      ]
    };
  }

  // Get or create user identifier
  function getUserIdentifier() {
    let identifier = localStorage.getItem('botforge_user_id');
    if (!identifier) {
      identifier = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('botforge_user_id', identifier);
    }
    return identifier;
  }

  // Create widget HTML
  function createWidget() {
    // Remove existing widget if present
    const existingWidget = document.getElementById('botforge-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'botforge-widget';
    widget.innerHTML = getWidgetHTML();
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = getWidgetCSS();
    document.head.appendChild(style);
    
    // Add widget to page
    document.body.appendChild(widget);
    
    // Setup event listeners
    setupEventListeners();
  }

  // Get widget HTML
  function getWidgetHTML() {
    const position = widgetConfig.position || 'bottom-right';
    const positionClass = `botforge-${position}`;
    
    return `
      <div class="botforge-widget ${positionClass}" data-theme="${widgetConfig.theme}">
        <!-- Chat Button -->
        <div class="botforge-button" id="botforge-button">
          <div class="botforge-button-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="botforge-button-close" style="display: none;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <div class="botforge-notification-dot"></div>
        </div>

        <!-- Chat Window -->
        <div class="botforge-chat-window" id="botforge-chat-window" style="display: none;">
          <!-- Header -->
          <div class="botforge-header">
            <div class="botforge-header-content">
              <div class="botforge-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="5" r="2"></circle>
                  <path d="M12 7v4"></path>
                </svg>
              </div>
              <div class="botforge-header-text">
                <div class="botforge-title">${widgetConfig.title}</div>
                <div class="botforge-subtitle">${widgetConfig.subtitle}</div>
              </div>
            </div>
            <div class="botforge-header-actions">
              <button class="botforge-minimize" id="botforge-minimize">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button class="botforge-close" id="botforge-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="botforge-messages" id="botforge-messages">
            <div class="botforge-loading" id="botforge-loading" style="display: none;">
              <div class="botforge-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="botforge-input-container">
            <div class="botforge-input-wrapper">
              <input 
                type="text" 
                class="botforge-input" 
                id="botforge-input" 
                placeholder="${widgetConfig.placeholder}"
                autocomplete="off"
              />
              <button class="botforge-send" id="botforge-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            </div>
            ${widgetConfig.poweredBy ? `
              <div class="botforge-powered-by">
                <a href="https://botforge.site" target="_blank" rel="noopener">
                  Powered by BotForge
                </a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Get widget CSS
  function getWidgetCSS() {
    return `
      .botforge-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }

      .botforge-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .botforge-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .botforge-top-right {
        top: 20px;
        right: 20px;
      }

      .botforge-top-left {
        top: 20px;
        left: 20px;
      }

      .botforge-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${widgetConfig.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        position: relative;
      }

      .botforge-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }

      .botforge-notification-dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 12px;
        height: 12px;
        background: #ef4444;
        border-radius: 50%;
        border: 2px solid white;
        display: none;
      }

      .botforge-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.8) translateY(20px);
        opacity: 0;
        transition: all 0.3s ease;
      }

      .botforge-chat-window.open {
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      .botforge-chat-window.minimized {
        height: 60px;
      }

      .botforge-header {
        background: ${widgetConfig.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .botforge-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .botforge-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .botforge-title {
        font-weight: 600;
        font-size: 16px;
      }

      .botforge-subtitle {
        font-size: 12px;
        opacity: 0.9;
      }

      .botforge-header-actions {
        display: flex;
        gap: 8px;
      }

      .botforge-minimize,
      .botforge-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .botforge-minimize:hover,
      .botforge-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }

      .botforge-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .botforge-message {
        display: flex;
        gap: 8px;
        max-width: 80%;
      }

      .botforge-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .botforge-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .botforge-message.bot .botforge-message-avatar {
        background: ${widgetConfig.primaryColor};
        color: white;
      }

      .botforge-message.user .botforge-message-avatar {
        background: #e5e7eb;
        color: #6b7280;
      }

      .botforge-message-content {
        background: #f3f4f6;
        padding: 12px 16px;
        border-radius: 18px;
        word-wrap: break-word;
      }

      .botforge-message.user .botforge-message-content {
        background: ${widgetConfig.primaryColor};
        color: white;
      }

      .botforge-message-time {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
      }

      .botforge-quick-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }

      .botforge-quick-reply {
        background: white;
        border: 1px solid ${widgetConfig.primaryColor};
        color: ${widgetConfig.primaryColor};
        padding: 8px 12px;
        border-radius: 16px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .botforge-quick-reply:hover {
        background: ${widgetConfig.primaryColor};
        color: white;
      }

      .botforge-input-container {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
      }

      .botforge-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .botforge-input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        padding: 12px 16px;
        outline: none;
        font-size: 14px;
      }

      .botforge-input:focus {
        border-color: ${widgetConfig.primaryColor};
      }

      .botforge-send {
        background: ${widgetConfig.primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .botforge-send:hover {
        transform: scale(1.05);
      }

      .botforge-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .botforge-powered-by {
        text-align: center;
        margin-top: 8px;
      }

      .botforge-powered-by a {
        color: #9ca3af;
        text-decoration: none;
        font-size: 11px;
      }

      .botforge-powered-by a:hover {
        color: ${widgetConfig.primaryColor};
      }

      .botforge-loading {
        display: flex;
        justify-content: center;
        padding: 16px;
      }

      .botforge-typing-indicator {
        display: flex;
        gap: 4px;
      }

      .botforge-typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9ca3af;
        animation: botforge-typing 1.4s infinite ease-in-out;
      }

      .botforge-typing-indicator span:nth-child(1) {
        animation-delay: -0.32s;
      }

      .botforge-typing-indicator span:nth-child(2) {
        animation-delay: -0.16s;
      }

      @keyframes botforge-typing {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Dark theme */
      .botforge-widget[data-theme="dark"] .botforge-chat-window {
        background: #1f2937;
        color: white;
      }

      .botforge-widget[data-theme="dark"] .botforge-messages {
        background: #1f2937;
      }

      .botforge-widget[data-theme="dark"] .botforge-message.bot .botforge-message-content {
        background: #374151;
        color: white;
      }

      .botforge-widget[data-theme="dark"] .botforge-input-container {
        background: #1f2937;
        border-color: #374151;
      }

      .botforge-widget[data-theme="dark"] .botforge-input {
        background: #374151;
        border-color: #4b5563;
        color: white;
      }

      .botforge-widget[data-theme="dark"] .botforge-input::placeholder {
        color: #9ca3af;
      }

      /* Mobile responsive */
      @media (max-width: 480px) {
        .botforge-chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 100px);
          bottom: 80px;
          right: 20px;
        }
      }
    `;
  }

  // Setup event listeners
  function setupEventListeners() {
    const button = document.getElementById('botforge-button');
    const chatWindow = document.getElementById('botforge-chat-window');
    const closeBtn = document.getElementById('botforge-close');
    const minimizeBtn = document.getElementById('botforge-minimize');
    const input = document.getElementById('botforge-input');
    const sendBtn = document.getElementById('botforge-send');

    // Toggle chat window
    button.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    minimizeBtn.addEventListener('click', minimizeChat);

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Auto-resize input
    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });

    // Initialize send button state
    sendBtn.disabled = true;
  }

  // Setup triggers
  function setupTriggers() {
    const triggers = widgetConfig.triggers;

    // Time delay trigger
    if (triggers.timeDelay > 0) {
      setTimeout(() => {
        if (!isOpen) {
          showNotification();
        }
      }, triggers.timeDelay * 1000);
    }

    // Scroll percentage trigger
    if (triggers.scrollPercentage > 0) {
      window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= triggers.scrollPercentage && !isOpen) {
          showNotification();
        }
      });
    }

    // Exit intent trigger
    if (triggers.exitIntent) {
      document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !isOpen) {
          showNotification();
        }
      });
    }

    // Page views trigger
    if (triggers.pageViews > 0) {
      let pageViews = parseInt(localStorage.getItem('botforge_page_views') || '0');
      pageViews++;
      localStorage.setItem('botforge_page_views', pageViews.toString());
      
      if (pageViews >= triggers.pageViews && !isOpen) {
        showNotification();
      }
    }

    // Auto-open
    if (widgetConfig.autoOpen) {
      setTimeout(openChat, 1000);
    }
  }

  // Show notification dot
  function showNotification() {
    const dot = document.querySelector('.botforge-notification-dot');
    if (dot) {
      dot.style.display = 'block';
    }
  }

  // Hide notification dot
  function hideNotification() {
    const dot = document.querySelector('.botforge-notification-dot');
    if (dot) {
      dot.style.display = 'none';
    }
  }

  // Toggle chat window
  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // Open chat window
  function openChat() {
    const chatWindow = document.getElementById('botforge-chat-window');
    const buttonIcon = document.querySelector('.botforge-button-icon');
    const buttonClose = document.querySelector('.botforge-button-close');
    
    chatWindow.style.display = 'flex';
    setTimeout(() => {
      chatWindow.classList.add('open');
    }, 10);
    
    buttonIcon.style.display = 'none';
    buttonClose.style.display = 'flex';
    
    isOpen = true;
    isMinimized = false;
    hideNotification();
    
    // Initialize conversation if not started
    if (!conversationId) {
      initializeConversation();
    }
    
    // Focus input
    const input = document.getElementById('botforge-input');
    if (input) {
      input.focus();
    }
  }

  // Close chat window
  function closeChat() {
    const chatWindow = document.getElementById('botforge-chat-window');
    const buttonIcon = document.querySelector('.botforge-button-icon');
    const buttonClose = document.querySelector('.botforge-button-close');
    
    chatWindow.classList.remove('open');
    setTimeout(() => {
      chatWindow.style.display = 'none';
    }, 300);
    
    buttonIcon.style.display = 'flex';
    buttonClose.style.display = 'none';
    
    isOpen = false;
    isMinimized = false;
  }

  // Minimize chat window
  function minimizeChat() {
    const chatWindow = document.getElementById('botforge-chat-window');
    
    if (isMinimized) {
      chatWindow.classList.remove('minimized');
      isMinimized = false;
    } else {
      chatWindow.classList.add('minimized');
      isMinimized = true;
    }
  }

  // Initialize conversation
  function initializeConversation() {
    conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Find start node and begin conversation
    if (chatbotFlow && chatbotFlow.nodes) {
      const startNode = chatbotFlow.nodes.find(node => 
        node.type === 'start' || node.data?.nodeType === 'start'
      );
      
      if (startNode) {
        currentNodeId = startNode.id;
        const welcomeMessage = startNode.data?.content || widgetConfig.welcomeMessage;
        addBotMessage(welcomeMessage);
        
        // Move to next node after welcome message
        setTimeout(() => {
          moveToNextNode(startNode.id);
        }, 1000);
      } else {
        // Fallback welcome message
        addBotMessage(widgetConfig.welcomeMessage);
      }
    } else {
      // Fallback welcome message
      addBotMessage(widgetConfig.welcomeMessage);
    }
  }

  // Send user message
  function sendMessage() {
    const input = document.getElementById('botforge-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addUserMessage(message);
    input.value = '';
    
    // Process message
    processUserMessage(message);
  }

  // Process user message through the flow
  async function processUserMessage(userInput) {
    showTyping();
    
    try {
      // Find current node
      const currentNode = chatbotFlow?.nodes?.find(node => node.id === currentNodeId);
      
      if (!currentNode) {
        // Fallback to AI response
        await handleAIResponse(userInput);
        return;
      }
      
      // Handle different node types
      switch (currentNode.type || currentNode.data?.nodeType) {
        case 'question':
          handleQuestionNode(currentNode, userInput);
          break;
        case 'lead_capture':
          handleLeadCaptureNode(currentNode, userInput);
          break;
        case 'ai_response':
          await handleAIResponse(userInput, currentNode);
          break;
        case 'conditional':
          handleConditionalNode(currentNode, userInput);
          break;
        default:
          await handleAIResponse(userInput);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage("I'm sorry, I encountered an error. Please try again.");
    } finally {
      hideTyping();
    }
  }

  // Handle question node
  function handleQuestionNode(node, userInput) {
    const options = node.data?.options || [];
    
    // Check if user input matches any option
    const selectedOption = options.find(option =>
      userInput.toLowerCase().includes(option.toLowerCase()) ||
      option.toLowerCase().includes(userInput.toLowerCase())
    );
    
    if (selectedOption) {
      conversationState[node.id] = selectedOption;
      addBotMessage(`You selected: ${selectedOption}`);
      moveToNextNode(node.id);
    } else {
      addBotMessage("Please select one of the available options:", options);
    }
  }

  // Handle lead capture node
  function handleLeadCaptureNode(node, userInput) {
    const fields = node.data?.fields || [];
    
    if (fields.length > 0) {
      const fieldName = fields[0].name;
      conversationState[fieldName] = userInput;
      conversationState[node.id] = userInput;
      
      addBotMessage(`Thank you for providing your ${fieldName}!`);
      moveToNextNode(node.id);
    } else {
      conversationState[node.id] = userInput;
      addBotMessage("Thank you for the information!");
      moveToNextNode(node.id);
    }
  }

  // Handle AI response
  async function handleAIResponse(userInput, node = null) {
    try {
      const systemPrompt = node?.data?.systemPrompt || 
        'You are a helpful customer service assistant. Be friendly and helpful.';
      
      // Try to call the AI endpoint
      const response = await fetch(`${widgetConfig.apiUrl}/functions/v1/openai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${widgetConfig.supabaseAnonKey || ''}`
        },
        body: JSON.stringify({
          userInput,
          systemPrompt,
          conversationHistory: getConversationHistory(),
          nodeContext: {
            conversationState,
            chatbotInfo: {
              id: widgetConfig.chatbotId,
              name: widgetConfig.title
            }
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        addBotMessage(result.response);
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      // Fallback response
      const fallbackResponse = getFallbackResponse(userInput);
      addBotMessage(fallbackResponse);
    }
    
    // Move to next node if available
    if (node) {
      moveToNextNode(node.id);
    }
  }

  // Handle conditional node
  function handleConditionalNode(node, userInput) {
    const conditions = node.data?.conditions || [];
    let targetNodeId = null;
    
    for (const condition of conditions) {
      const variableValue = conversationState[condition.variable] || '';
      const checkValue = condition.value.toLowerCase();
      const actualValue = variableValue.toLowerCase();
      
      let matches = false;
      switch (condition.operator) {
        case 'contains':
          matches = actualValue.includes(checkValue) || checkValue.includes(actualValue);
          break;
        case 'equals':
          matches = actualValue === checkValue;
          break;
        case 'not_equals':
          matches = actualValue !== checkValue;
          break;
      }
      
      if (matches) {
        // Find edge with this condition
        const edge = chatbotFlow.edges?.find(e => 
          e.source === node.id && e.condition === condition.action
        );
        if (edge) {
          targetNodeId = edge.target;
          break;
        }
      }
    }
    
    // If no condition met, take default edge
    if (!targetNodeId) {
      const defaultEdge = chatbotFlow.edges?.find(e => 
        e.source === node.id && !e.condition
      );
      if (defaultEdge) {
        targetNodeId = defaultEdge.target;
      }
    }
    
    if (targetNodeId) {
      currentNodeId = targetNodeId;
      const targetNode = chatbotFlow.nodes?.find(n => n.id === targetNodeId);
      if (targetNode && targetNode.data?.content) {
        addBotMessage(substituteVariables(targetNode.data.content));
      }
      moveToNextNode(targetNodeId);
    }
  }

  // Move to next node in the flow
  function moveToNextNode(fromNodeId) {
    if (!chatbotFlow?.edges) return;
    
    const outgoingEdges = chatbotFlow.edges.filter(edge => edge.source === fromNodeId);
    
    if (outgoingEdges.length === 0) {
      // End of conversation
      addBotMessage("Thank you for chatting with me! Is there anything else I can help you with?");
      return;
    }
    
    // Take the first edge (in a real implementation, you'd handle conditions)
    const nextEdge = outgoingEdges[0];
    const nextNode = chatbotFlow.nodes?.find(node => node.id === nextEdge.target);
    
    if (!nextNode) return;
    
    currentNodeId = nextNode.id;
    
    // Generate response based on next node type
    const nodeType = nextNode.type || nextNode.data?.nodeType;
    
    setTimeout(() => {
      switch (nodeType) {
        case 'message':
          addBotMessage(substituteVariables(nextNode.data?.content || "Hello!"));
          moveToNextNode(nextNode.id);
          break;
        case 'question':
          const questionContent = substituteVariables(nextNode.data?.content || "Please choose an option:");
          const options = nextNode.data?.options || [];
          addBotMessage(questionContent, options);
          break;
        case 'lead_capture':
          const fields = nextNode.data?.fields || [];
          const fieldPrompt = fields.length > 0 
            ? `Please provide your ${fields[0].name}:`
            : "Please provide your information:";
          addBotMessage(substituteVariables(fieldPrompt));
          break;
        case 'conditional':
          // Conditional nodes don't show messages, they just route
          handleConditionalNode(nextNode, '');
          break;
        default:
          if (nextNode.data?.content) {
            addBotMessage(substituteVariables(nextNode.data.content));
          }
      }
    }, 500);
  }

  // Substitute variables in content
  function substituteVariables(content) {
    if (!content) return '';
    
    let result = content;
    Object.keys(conversationState).forEach(key => {
      const value = conversationState[key] || '';
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    
    return result;
  }

  // Get conversation history for AI context
  function getConversationHistory() {
    const messages = document.querySelectorAll('.botforge-message');
    const history = [];
    
    messages.forEach(msg => {
      const isUser = msg.classList.contains('user');
      const content = msg.querySelector('.botforge-message-content').textContent;
      history.push({
        sender: isUser ? 'user' : 'bot',
        content: content
      });
    });
    
    return history.slice(-10); // Last 10 messages
  }

  // Get fallback response
  function getFallbackResponse(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! How can I help you today?';
    } else if (input.includes('help')) {
      return 'I\'d be happy to help you! What do you need assistance with?';
    } else if (input.includes('price') || input.includes('cost')) {
      return 'For pricing information, please contact our sales team.';
    } else if (input.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    } else {
      return 'I understand. Let me connect you with someone who can help you better.';
    }
  }

  // Add user message to chat
  function addUserMessage(message) {
    const messagesContainer = document.getElementById('botforge-messages');
    const messageEl = createMessageElement('user', message);
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
  }

  // Add bot message to chat
  function addBotMessage(message, quickReplies = null) {
    const messagesContainer = document.getElementById('botforge-messages');
    const messageEl = createMessageElement('bot', message, quickReplies);
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
  }

  // Create message element
  function createMessageElement(sender, message, quickReplies = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `botforge-message ${sender}`;
    
    const avatarEl = document.createElement('div');
    avatarEl.className = 'botforge-message-avatar';
    avatarEl.innerHTML = sender === 'user' 
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>';
    
    const contentEl = document.createElement('div');
    contentEl.className = 'botforge-message-content';
    contentEl.textContent = message;
    
    const timeEl = document.createElement('div');
    timeEl.className = 'botforge-message-time';
    timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageContent = document.createElement('div');
    messageContent.appendChild(contentEl);
    messageContent.appendChild(timeEl);
    
    // Add quick replies if provided
    if (quickReplies && quickReplies.length > 0) {
      const quickRepliesEl = document.createElement('div');
      quickRepliesEl.className = 'botforge-quick-replies';
      
      quickReplies.forEach(reply => {
        const replyBtn = document.createElement('button');
        replyBtn.className = 'botforge-quick-reply';
        replyBtn.textContent = reply;
        replyBtn.addEventListener('click', () => {
          const input = document.getElementById('botforge-input');
          input.value = reply;
          sendMessage();
        });
        quickRepliesEl.appendChild(replyBtn);
      });
      
      messageContent.appendChild(quickRepliesEl);
    }
    
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(messageContent);
    
    return messageEl;
  }

  // Show typing indicator
  function showTyping() {
    const loading = document.getElementById('botforge-loading');
    if (loading) {
      loading.style.display = 'flex';
      scrollToBottom();
    }
  }

  // Hide typing indicator
  function hideTyping() {
    const loading = document.getElementById('botforge-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  // Scroll to bottom of messages
  function scrollToBottom() {
    const messagesContainer = document.getElementById('botforge-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Public API
  window.BotForgeWidget = {
    init: initWidget,
    open: openChat,
    close: closeChat,
    minimize: minimizeChat,
    sendMessage: function(message) {
      const input = document.getElementById('botforge-input');
      if (input) {
        input.value = message;
        sendMessage();
      }
    },
    isOpen: function() {
      return isOpen;
    },
    destroy: function() {
      const widget = document.getElementById('botforge-widget');
      if (widget) {
        widget.remove();
      }
    }
  };

  // Auto-initialize if config is provided
  if (window.botforgeConfig) {
    initWidget(window.botforgeConfig);
  }
})();