import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Settings, 
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Globe,
  Package,
  FileCode,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface WebsiteWidgetProps {
  chatbot: any;
  isOpen: boolean;
  onClose: () => void;
}

interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  size: 'small' | 'medium' | 'large';
  showBranding: boolean;
  customCSS: string;
  greeting: string;
  placeholder: string;
  borderRadius: number;
  shadow: boolean;
  animation: 'none' | 'bounce' | 'pulse' | 'slide';
}

export function WebsiteWidget({ chatbot, isOpen, onClose }: WebsiteWidgetProps) {
  const [activeTab, setActiveTab] = useState<'embed' | 'react' | 'vue' | 'angular' | 'svelte' | 'npm'>('embed');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [config, setConfig] = useState<WidgetConfig>({
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#3B82F6',
    size: 'medium',
    showBranding: true,
    customCSS: '',
    greeting: 'Hi! How can I help you today?',
    placeholder: 'Type your message...',
    borderRadius: 12,
    shadow: true,
    animation: 'bounce'
  });

  // Ensure chatbot exists and has required properties
  if (!chatbot) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Website Widget" size="xl">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            Chatbot data is not available. Please try again.
          </p>
        </div>
      </Modal>
    );
  }

  const chatbotId = chatbot.id;
  const chatbotName = chatbot.name || 'Chatbot';
  const baseUrl = window.location.origin;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const generateEmbedCode = () => {
    const configJson = JSON.stringify(config, null, 2);
    return `<!-- BotForge Chatbot Widget -->
<div id="botforge-widget"></div>
<script>
  window.BotForgeConfig = ${configJson.replace(/"/g, '"')};
  window.BotForgeConfig.chatbotId = "${chatbotId}";
  window.BotForgeConfig.apiUrl = "${baseUrl}";
</script>
<script src="${baseUrl}/widget/botforge-widget.js" async></script>`;
  };

  const generateReactComponent = () => {
    return `import React, { useEffect } from 'react';

interface BotForgeWidgetProps {
  chatbotId: string;
  config?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    size?: 'small' | 'medium' | 'large';
    greeting?: string;
    placeholder?: string;
  };
}

export const BotForgeWidget: React.FC<BotForgeWidgetProps> = ({ 
  chatbotId, 
  config = {} 
}) => {
  useEffect(() => {
    // Set global config
    window.BotForgeConfig = {
      chatbotId,
      apiUrl: '${baseUrl}',
      position: '${config.position}',
      theme: '${config.theme}',
      primaryColor: '${config.primaryColor}',
      size: '${config.size}',
      greeting: '${config.greeting}',
      placeholder: '${config.placeholder}',
      ...config
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget/botforge-widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="botforge-widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      const widget = document.getElementById('botforge-widget');
      if (widget) {
        widget.remove();
      }
    };
  }, [chatbotId, config]);

  return <div id="botforge-widget" />;
};

// Usage Example:
// <BotForgeWidget 
//   chatbotId="${chatbotId}"
//   config={{
//     position: 'bottom-right',
//     theme: 'light',
//     primaryColor: '#3B82F6'
//   }}
// />`;
  };

  const generateVueComponent = () => {
    return `<template>
  <div id="botforge-widget"></div>
</template>

<script>
export default {
  name: 'BotForgeWidget',
  props: {
    chatbotId: {
      type: String,
      required: true,
      default: '${chatbotId}'
    },
    config: {
      type: Object,
      default: () => ({
        position: '${config.position}',
        theme: '${config.theme}',
        primaryColor: '${config.primaryColor}',
        size: '${config.size}',
        greeting: '${config.greeting}',
        placeholder: '${config.placeholder}'
      })
    }
  },
  mounted() {
    this.loadWidget();
  },
  beforeUnmount() {
    this.cleanupWidget();
  },
  methods: {
    loadWidget() {
      // Set global config
      window.BotForgeConfig = {
        chatbotId: this.chatbotId,
        apiUrl: '${baseUrl}',
        ...this.config
      };

      // Load widget script
      const script = document.createElement('script');
      script.src = '${baseUrl}/widget/botforge-widget.js';
      script.async = true;
      document.body.appendChild(script);
    },
    cleanupWidget() {
      const existingScript = document.querySelector('script[src*="botforge-widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      const widget = document.getElementById('botforge-widget');
      if (widget) {
        widget.remove();
      }
    }
  }
};
</script>

<!-- Usage Example: -->
<!-- <BotForgeWidget :chatbot-id="'${chatbotId}'" :config="widgetConfig" /> -->`;
  };

  const generateAngularComponent = () => {
    return `import { Component, Input, OnInit, OnDestroy } from '@angular/core';

declare global {
  interface Window {
    BotForgeConfig: any;
  }
}

@Component({
  selector: 'app-botforge-widget',
  template: '<div id="botforge-widget"></div>'
})
export class BotForgeWidgetComponent implements OnInit, OnDestroy {
  @Input() chatbotId: string = '${chatbotId}';
  @Input() config: any = {
    position: '${config.position}',
    theme: '${config.theme}',
    primaryColor: '${config.primaryColor}',
    size: '${config.size}',
    greeting: '${config.greeting}',
    placeholder: '${config.placeholder}'
  };

  ngOnInit() {
    this.loadWidget();
  }

  ngOnDestroy() {
    this.cleanupWidget();
  }

  private loadWidget() {
    // Set global config
    window.BotForgeConfig = {
      chatbotId: this.chatbotId,
      apiUrl: '${baseUrl}',
      ...this.config
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget/botforge-widget.js';
    script.async = true;
    document.body.appendChild(script);
  }

  private cleanupWidget() {
    const existingScript = document.querySelector('script[src*="botforge-widget.js"]');
    if (existingScript) {
      existingScript.remove();
    }
    const widget = document.getElementById('botforge-widget');
    if (widget) {
      widget.remove();
    }
  }
}

// Usage in template:
// <app-botforge-widget [chatbotId]="'${chatbotId}'" [config]="widgetConfig"></app-botforge-widget>`;
  };

  const generateSvelteComponent = () => {
    return `<script>
  import { onMount, onDestroy } from 'svelte';

  export let chatbotId = '${chatbotId}';
  export let config = {
    position: '${config.position}',
    theme: '${config.theme}',
    primaryColor: '${config.primaryColor}',
    size: '${config.size}',
    greeting: '${config.greeting}',
    placeholder: '${config.placeholder}'
  };

  onMount(() => {
    loadWidget();
  });

  onDestroy(() => {
    cleanupWidget();
  });

  function loadWidget() {
    // Set global config
    window.BotForgeConfig = {
      chatbotId,
      apiUrl: '${baseUrl}',
      ...config
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget/botforge-widget.js';
    script.async = true;
    document.body.appendChild(script);
  }

  function cleanupWidget() {
    const existingScript = document.querySelector('script[src*="botforge-widget.js"]');
    if (existingScript) {
      existingScript.remove();
    }
    const widget = document.getElementById('botforge-widget');
    if (widget) {
      widget.remove();
    }
  }
</script>

<div id="botforge-widget"></div>

<!-- Usage Example: -->
<!-- <BotForgeWidget chatbotId="${chatbotId}" config={{theme: 'dark'}} /> -->`;
  };

  const generateNPMPackage = () => {
    return `// Install the package
npm install @botforge/widget

// ES6 Import
import BotForgeWidget from '@botforge/widget';

// Initialize the widget
const widget = new BotForgeWidget({
  chatbotId: '${chatbotId}',
  apiUrl: '${baseUrl}',
  config: {
    position: '${config.position}',
    theme: '${config.theme}',
    primaryColor: '${config.primaryColor}',
    size: '${config.size}',
    greeting: '${config.greeting}',
    placeholder: '${config.placeholder}',
    showBranding: ${config.showBranding},
    borderRadius: ${config.borderRadius},
    shadow: ${config.shadow},
    animation: '${config.animation}'
  }
});

// Mount the widget
widget.mount();

// Widget API Methods
widget.open();        // Open the chat
widget.close();       // Close the chat
widget.toggle();      // Toggle chat state
widget.destroy();     // Remove widget
widget.updateConfig(newConfig); // Update configuration

// Event Listeners
widget.on('open', () => console.log('Chat opened'));
widget.on('close', () => console.log('Chat closed'));
widget.on('message', (data) => console.log('Message sent:', data));

// CommonJS (Node.js)
const BotForgeWidget = require('@botforge/widget');

// CDN Usage
<script src="https://unpkg.com/@botforge/widget@latest/dist/botforge-widget.min.js"></script>
<script>
  const widget = new BotForgeWidget({
    chatbotId: '${chatbotId}',
    apiUrl: '${baseUrl}'
  });
  widget.mount();
</script>`;
  };

  const getCodeForTab = () => {
    switch (activeTab) {
      case 'embed': return generateEmbedCode();
      case 'react': return generateReactComponent();
      case 'vue': return generateVueComponent();
      case 'angular': return generateAngularComponent();
      case 'svelte': return generateSvelteComponent();
      case 'npm': return generateNPMPackage();
      default: return generateEmbedCode();
    }
  };

  const downloadCode = () => {
    const code = getCodeForTab();
    const extensions = {
      embed: 'html',
      react: 'tsx',
      vue: 'vue',
      angular: 'ts',
      svelte: 'svelte',
      npm: 'js'
    };
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `botforge-widget.${extensions[activeTab]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'embed', name: 'HTML Embed', icon: Code, description: 'Simple script tag integration' },
    { id: 'react', name: 'React', icon: FileCode, description: 'React component' },
    { id: 'vue', name: 'Vue.js', icon: FileCode, description: 'Vue component' },
    { id: 'angular', name: 'Angular', icon: FileCode, description: 'Angular component' },
    { id: 'svelte', name: 'Svelte', icon: FileCode, description: 'Svelte component' },
    { id: 'npm', name: 'NPM Package', icon: Package, description: 'JavaScript package' }
  ];

  const deviceSizes = {
    desktop: { width: '100%', height: '600px' },
    tablet: { width: '768px', height: '500px' },
    mobile: { width: '375px', height: '400px' }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Website Widget Integration" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Deploy {chatbotName} to Your Website
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Choose your preferred integration method and customize the widget appearance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCode}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Widget Configuration
              </h4>
              
              <div className="space-y-4">
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <select
                    value={config.position}
                    onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={config.theme}
                    onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <select
                    value={config.size}
                    onChange={(e) => setConfig(prev => ({ ...prev, size: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Greeting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Greeting Message
                  </label>
                  <input
                    type="text"
                    value={config.greeting}
                    onChange={(e) => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Animation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Animation
                  </label>
                  <select
                    value={config.animation}
                    onChange={(e) => setConfig(prev => ({ ...prev, animation: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="none">None</option>
                    <option value="bounce">Bounce</option>
                    <option value="pulse">Pulse</option>
                    <option value="slide">Slide</option>
                  </select>
                </div>

                {/* Show Branding */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showBranding"
                    checked={config.showBranding}
                    onChange={(e) => setConfig(prev => ({ ...prev, showBranding: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="showBranding" className="text-sm text-gray-700 dark:text-gray-300">
                    Show BotForge branding
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* Code Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {/* Framework Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Code Display */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {tabs.find(t => t.id === activeTab)?.name} Integration Code
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getCodeForTab(), activeTab)}
                  >
                    {copiedCode === activeTab ? (
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedCode === activeTab ? 'Copied!' : 'Copy Code'}
                  </Button>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100 whitespace-pre-wrap">
                    <code>{getCodeForTab()}</code>
                  </pre>
                </div>
              </div>

              {/* Integration Instructions */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Integration Instructions
                </h5>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                  {activeTab === 'embed' && (
                    <div>
                      <p>1. Copy the code above and paste it into your HTML file</p>
                      <p>{`2. Place it just before the closing </body> tag`}</p>
                      <p>3. The widget will automatically load and position itself</p>
                    </div>
                  )}
                  {activeTab === 'react' && (
                    <div>
                      <p>1. Copy the component code into a new file (e.g., BotForgeWidget.tsx)</p>
                      <p>2. Import and use the component in your React app</p>
                      <p>3. Pass your chatbot ID and configuration as props</p>
                    </div>
                  )}
                  {activeTab === 'vue' && (
                    <div>
                      <p>1. Create a new Vue component with the code above</p>
                      <p>2. Register the component in your Vue app</p>
                      <p>3. Use the component with your chatbot ID and config</p>
                    </div>
                  )}
                  {activeTab === 'angular' && (
                    <div>
                      <p>1. Create a new Angular component with the code above</p>
                      <p>2. Add the component to your module declarations</p>
                      <p>3. Use the component selector in your templates</p>
                    </div>
                  )}
                  {activeTab === 'svelte' && (
                    <div>
                      <p>1. Create a new Svelte component with the code above</p>
                      <p>2. Import and use the component in your Svelte app</p>
                      <p>3. Pass props for chatbot ID and configuration</p>
                    </div>
                  )}
                  {activeTab === 'npm' && (
                    <div>
                      <p>1. Install the package using npm or yarn</p>
                      <p>2. Import and initialize the widget in your JavaScript</p>
                      <p>3. Use the API methods to control the widget behavior</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Widget Preview
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                        <button
                          key={device}
                          onClick={() => setPreviewDevice(device)}
                          className={`p-2 rounded-lg ${
                            previewDevice === device
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {device === 'desktop' && <Monitor className="w-4 h-4" />}
                          {device === 'tablet' && <Tablet className="w-4 h-4" />}
                          {device === 'mobile' && <Smartphone className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                    <Button variant="ghost" onClick={() => setShowPreview(false)}>
                      ×
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 flex justify-center">
                <div 
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden"
                  style={deviceSizes[previewDevice]}
                >
                  {/* Mock website content */}
                  <div className="p-8 h-full">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Your Website
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      This is a preview of how the chatbot widget will appear on your website.
                    </p>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  {/* Widget Preview */}
                  <div 
                    className={`absolute ${
                      config.position.includes('bottom') ? 'bottom-4' : 'top-4'
                    } ${
                      config.position.includes('right') ? 'right-4' : 'left-4'
                    }`}
                  >
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg ${
                        config.animation === 'bounce' ? 'animate-bounce' : 
                        config.animation === 'pulse' ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        backgroundColor: config.primaryColor,
                        borderRadius: `${config.borderRadius}px`
                      }}
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <a
              href={`${baseUrl}/widget/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Documentation
            </a>
            <a
              href={`${baseUrl}/widget/examples`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
            >
              <Globe className="w-4 h-4 mr-1" />
              Live Examples
            </a>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Widget ID: {chatbotId}
          </div>
        </div>
      </div>
    </Modal>
  );
}