# @botforge/widget

The official BotForge widget for easy integration into any website or web application.

## Installation

```bash
npm install @botforge/widget
```

## Quick Start

### React

```jsx
import React from 'react';
import { BotForgeWidget } from '@botforge/widget';

function App() {
  return (
    <div>
      <h1>My Website</h1>
      <BotForgeWidget
        chatbotId="your-chatbot-id"
        theme={{
          primaryColor: '#3b82f6',
          borderRadius: '12px',
        }}
        position={{
          bottom: '20px',
          right: '20px',
        }}
        events={{
          onOpen: () => console.log('Chat opened'),
          onMessage: (message) => console.log('New message:', message),
        }}
      />
    </div>
  );
}

export default App;
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>My Website</h1>
  
  <script src="https://unpkg.com/@botforge/widget/dist/botforge-widget.umd.js"></script>
  <script>
    const widget = BotForge.initBotForge({
      chatbotId: 'your-chatbot-id',
      theme: {
        primaryColor: '#3b82f6',
        borderRadius: '12px',
      },
      position: {
        bottom: '20px',
        right: '20px',
      },
      events: {
        onOpen: () => console.log('Chat opened'),
        onMessage: (message) => console.log('New message:', message),
      },
    });
  </script>
</body>
</html>
```

### Vue.js

```vue
<template>
  <div>
    <h1>My Website</h1>
    <BotForgeWidget
      :chatbot-id="chatbotId"
      :theme="theme"
      :position="position"
      :events="events"
    />
  </div>
</template>

<script>
import { BotForgeWidget } from '@botforge/widget';

export default {
  components: {
    BotForgeWidget,
  },
  data() {
    return {
      chatbotId: 'your-chatbot-id',
      theme: {
        primaryColor: '#3b82f6',
        borderRadius: '12px',
      },
      position: {
        bottom: '20px',
        right: '20px',
      },
      events: {
        onOpen: () => console.log('Chat opened'),
        onMessage: (message) => console.log('New message:', message),
      },
    };
  },
};
</script>
```

### Angular

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>My Website</h1>
    <div id="botforge-widget"></div>
  `,
})
export class AppComponent {
  ngOnInit() {
    import('@botforge/widget').then(({ initBotForge }) => {
      initBotForge({
        chatbotId: 'your-chatbot-id',
        theme: {
          primaryColor: '#3b82f6',
          borderRadius: '12px',
        },
        position: {
          bottom: '20px',
          right: '20px',
        },
        events: {
          onOpen: () => console.log('Chat opened'),
          onMessage: (message) => console.log('New message:', message),
        },
      });
    });
  }
}
```

## Configuration

### Required Props

- `chatbotId` (string): Your BotForge chatbot ID

### Optional Props

- `apiUrl` (string): Custom API URL (defaults to 'https://botforge.site')
- `theme` (BotForgeTheme): Customize the appearance
- `position` (BotForgePosition): Position the widget on the page
- `autoOpen` (boolean): Automatically open the chat on load
- `showBranding` (boolean): Show "Powered by BotForge" (defaults to true)
- `user` (BotForgeUser): Pre-populate user information
- `events` (BotForgeEvents): Event callbacks

### Theme Options

```typescript
interface BotForgeTheme {
  primaryColor?: string;        // Main color (default: '#3b82f6')
  backgroundColor?: string;     // Chat background (default: '#ffffff')
  textColor?: string;          // Text color (default: '#1f2937')
  borderRadius?: string;       // Border radius (default: '12px')
  fontFamily?: string;         // Font family
  buttonSize?: 'small' | 'medium' | 'large'; // Chat button size
  chatHeight?: string;         // Chat window height (default: '500px')
  chatWidth?: string;          // Chat window width (default: '380px')
}
```

### Position Options

```typescript
interface BotForgePosition {
  bottom?: string;  // Distance from bottom (default: '20px')
  right?: string;   // Distance from right (default: '20px')
  left?: string;    // Distance from left
  top?: string;     // Distance from top
}
```

### Events

```typescript
interface BotForgeEvents {
  onOpen?: () => void;                           // Chat opened
  onClose?: () => void;                          // Chat closed
  onMessage?: (message: BotForgeMessage) => void; // Any message
  onUserMessage?: (message: BotForgeMessage) => void; // User message
  onBotMessage?: (message: BotForgeMessage) => void;  // Bot message
  onError?: (error: Error) => void;              // Error occurred
  onReady?: () => void;                          // Widget ready
}
```

## API Methods

When using React, you can access the widget API using a ref:

```jsx
import React, { useRef } from 'react';
import { BotForgeWidget } from '@botforge/widget';

function App() {
  const widgetRef = useRef();

  const handleOpenChat = () => {
    widgetRef.current?.open();
  };

  const handleSendMessage = () => {
    widgetRef.current?.sendMessage('Hello from the parent app!');
  };

  return (
    <div>
      <button onClick={handleOpenChat}>Open Chat</button>
      <button onClick={handleSendMessage}>Send Message</button>
      
      <BotForgeWidget
        ref={widgetRef}
        chatbotId="your-chatbot-id"
      />
    </div>
  );
}
```

### Available Methods

- `open()`: Open the chat window
- `close()`: Close the chat window
- `toggle()`: Toggle the chat window
- `sendMessage(message: string)`: Send a message programmatically
- `setUser(user: BotForgeUser)`: Update user information
- `isOpen()`: Check if chat is open
- `destroy()`: Remove the widget completely

## Advanced Usage

### Custom Styling

You can override the default styles using CSS:

```css
/* Custom button styles */
#botforge-widget #chat-button {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4) !important;
}

/* Custom chat window styles */
#botforge-widget #chat-window {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}
```

### Multiple Widgets

You can have multiple widgets on the same page:

```jsx
<BotForgeWidget
  chatbotId="support-bot"
  position={{ bottom: '20px', right: '20px' }}
  theme={{ primaryColor: '#3b82f6' }}
/>

<BotForgeWidget
  chatbotId="sales-bot"
  position={{ bottom: '20px', left: '20px' }}
  theme={{ primaryColor: '#10b981' }}
/>
```

### Conditional Rendering

```jsx
function App() {
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    // Show widget after user has been on page for 10 seconds
    const timer = setTimeout(() => setShowWidget(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <h1>My Website</h1>
      {showWidget && (
        <BotForgeWidget
          chatbotId="your-chatbot-id"
          autoOpen={true}
        />
      )}
    </div>
  );
}
```

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## TypeScript Support

This package includes TypeScript definitions out of the box. No additional setup required!

## License

MIT

## Support

For support, email support@botforge.site or visit our [documentation](https://botforge.site/docs).