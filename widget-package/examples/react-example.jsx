import React, { useRef, useState } from 'react';
import { BotForgeWidget } from '@botforge/widget';

function App() {
  const widgetRef = useRef();
  const [user, setUser] = useState({
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
  });

  const handleOpenChat = () => {
    widgetRef.current?.open();
  };

  const handleSendMessage = () => {
    widgetRef.current?.sendMessage('Hello from React!');
  };

  const handleSetUser = () => {
    widgetRef.current?.setUser({
      ...user,
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>BotForge Widget - React Example</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleOpenChat} style={{ marginRight: '10px' }}>
          Open Chat
        </button>
        <button onClick={handleSendMessage} style={{ marginRight: '10px' }}>
          Send Message
        </button>
        <button onClick={handleSetUser}>
          Update User
        </button>
      </div>

      <BotForgeWidget
        ref={widgetRef}
        chatbotId="demo-chatbot-id"
        user={user}
        theme={{
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          buttonSize: 'large',
        }}
        position={{
          bottom: '20px',
          right: '20px',
        }}
        events={{
          onOpen: () => console.log('Chat opened'),
          onClose: () => console.log('Chat closed'),
          onMessage: (message) => console.log('New message:', message),
          onReady: () => console.log('Widget ready'),
        }}
        autoOpen={false}
        showBranding={true}
      />
    </div>
  );
}

export default App;