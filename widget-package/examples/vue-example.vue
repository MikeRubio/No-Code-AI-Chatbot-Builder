<template>
  <div class="app">
    <h1>BotForge Widget - Vue.js Example</h1>
    
    <div class="controls">
      <button @click="openChat">Open Chat</button>
      <button @click="closeChat">Close Chat</button>
      <button @click="toggleChat">Toggle Chat</button>
      <button @click="sendMessage">Send Message</button>
      <button @click="updateUser">Update User</button>
    </div>

    <div class="status">
      {{ status }}
    </div>

    <BotForgeWidget
      ref="widget"
      :chatbot-id="config.chatbotId"
      :theme="config.theme"
      :position="config.position"
      :user="config.user"
      :events="config.events"
      :auto-open="config.autoOpen"
      :show-branding="config.showBranding"
    />
  </div>
</template>

<script>
import { BotForgeWidget } from '@botforge/widget';

export default {
  name: 'App',
  components: {
    BotForgeWidget,
  },
  data() {
    return {
      status: 'Widget ready',
      config: {
        chatbotId: 'demo-chatbot-id',
        theme: {
          primaryColor: '#8b5cf6',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          buttonSize: 'medium',
        },
        position: {
          bottom: '20px',
          right: '20px',
        },
        user: {
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        },
        events: {
          onOpen: () => {
            this.updateStatus('Chat opened');
          },
          onClose: () => {
            this.updateStatus('Chat closed');
          },
          onMessage: (message) => {
            this.updateStatus(`New message: ${message.content}`);
          },
          onReady: () => {
            this.updateStatus('Widget ready');
          },
          onError: (error) => {
            this.updateStatus(`Error: ${error.message}`);
          },
        },
        autoOpen: false,
        showBranding: true,
      },
    };
  },
  methods: {
    openChat() {
      this.$refs.widget.open();
    },
    closeChat() {
      this.$refs.widget.close();
    },
    toggleChat() {
      this.$refs.widget.toggle();
    },
    sendMessage() {
      this.$refs.widget.sendMessage('Hello from Vue.js!');
    },
    updateUser() {
      this.$refs.widget.setUser({
        id: 'user456',
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
      this.updateStatus('User updated');
    },
    updateStatus(message) {
      const timestamp = new Date().toLocaleTimeString();
      this.status = `[${timestamp}] ${message}`;
    },
  },
};
</script>

<style scoped>
.app {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.controls {
  margin-bottom: 20px;
}

.controls button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
}

.controls button:hover {
  background: #7c3aed;
}

.status {
  margin-top: 20px;
  padding: 15px;
  background: #f3f4f6;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
}
</style>