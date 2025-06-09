import { useState } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Copy,
  Download,
  Globe,
  Eye,
  CheckCircle,
  ExternalLink,
  Monitor,
  Smartphone,
  BookOpen,
  Zap,
  Layers,
  MessageCircle,
  Send,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useChatbots } from "../../hooks/useChatbots";
import toast from "react-hot-toast";

interface WebsiteWidgetProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WidgetConfig {
  theme: "light" | "dark" | "auto";
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  primaryColor: string;
  buttonText: string;
  welcomeMessage: string;
  size: "small" | "medium" | "large";
  showBranding: boolean;
  customCSS: string;
  triggerDelay: number;
  enableSound: boolean;
  enableTyping: boolean;
}

const frameworks = [
  {
    id: "vanilla",
    name: "Vanilla JavaScript",
    icon: Code,
    description: "Pure HTML/CSS/JS - works anywhere",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "react",
    name: "React",
    icon: Layers,
    description: "React component with hooks",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "vue",
    name: "Vue.js",
    icon: Zap,
    description: "Vue 3 composition API component",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "angular",
    name: "Angular",
    icon: Globe,
    description: "Angular component with TypeScript",
    color: "from-red-500 to-pink-500",
  },
];

export function WebsiteWidget({
  chatbotId,
  isOpen,
  onClose,
}: WebsiteWidgetProps) {
  const { chatbots } = useChatbots();
  const [selectedFramework, setSelectedFramework] = useState("vanilla");
  const [showPreview, setShowPreview] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [config, setConfig] = useState<WidgetConfig>({
    theme: "light",
    position: "bottom-right",
    primaryColor: "#3B82F6",
    buttonText: "Chat with us",
    welcomeMessage: "Hi! How can I help you today?",
    size: "medium",
    showBranding: true,
    customCSS: "",
    triggerDelay: 0,
    enableSound: true,
    enableTyping: true,
  });

  const currentChatbot = chatbots.find((bot) => bot.id === chatbotId);

  const generateCode = () => {
    const baseUrl = window.location.origin;
    const widgetId = `chatbot-widget-${chatbotId}`;

    switch (selectedFramework) {
      case "vanilla":
        return generateVanillaCode(baseUrl, widgetId);
      case "react":
        return generateReactCode(baseUrl, widgetId);
      case "vue":
        return generateVueCode(baseUrl, widgetId);
      case "angular":
        return generateAngularCode(baseUrl, widgetId);
      default:
        return generateVanillaCode(baseUrl, widgetId);
    }
  };

  const generateVanillaCode = (baseUrl: string, widgetId: string) => {
    return `<!-- BotBuilder Pro Widget -->
<div id="${widgetId}"></div>
<script>
  (function() {
    // Widget configuration
    window.BotBuilderConfig = {
      chatbotId: '${chatbotId}',
      theme: '${config.theme}',
      position: '${config.position}',
      primaryColor: '${config.primaryColor}',
      buttonText: '${config.buttonText}',
      welcomeMessage: '${config.welcomeMessage}',
      size: '${config.size}',
      showBranding: ${config.showBranding},
      triggerDelay: ${config.triggerDelay},
      enableSound: ${config.enableSound},
      enableTyping: ${config.enableTyping}
    };

    // Load widget script
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/chatbot-widget.js';
    script.async = true;
    document.head.appendChild(script);

    // Load widget styles
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${baseUrl}/widget/chatbot-widget.css';
    document.head.appendChild(link);
  })();
</script>

${config.customCSS ? `<style>\n${config.customCSS}\n</style>` : ""}`;
  };

  const generateReactCode = (baseUrl: string, widgetId: string) => {
    return `import React, { useEffect, useRef } from 'react';

interface ChatbotWidgetProps {
  chatbotId?: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  buttonText?: string;
  welcomeMessage?: string;
  size?: 'small' | 'medium' | 'large';
  showBranding?: boolean;
  triggerDelay?: number;
  enableSound?: boolean;
  enableTyping?: boolean;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  chatbotId = '${chatbotId}',
  theme = '${config.theme}',
  position = '${config.position}',
  primaryColor = '${config.primaryColor}',
  buttonText = '${config.buttonText}',
  welcomeMessage = '${config.welcomeMessage}',
  size = '${config.size}',
  showBranding = ${config.showBranding},
  triggerDelay = ${config.triggerDelay},
  enableSound = ${config.enableSound},
  enableTyping = ${config.enableTyping}
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set global configuration
    (window as any).BotBuilderConfig = {
      chatbotId,
      theme,
      position,
      primaryColor,
      buttonText,
      welcomeMessage,
      size,
      showBranding,
      triggerDelay,
      enableSound,
      enableTyping
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget/chatbot-widget.js';
    script.async = true;
    document.head.appendChild(script);

    // Load widget styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${baseUrl}/widget/chatbot-widget.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="chatbot-widget.js"]');
      const existingLink = document.querySelector('link[href*="chatbot-widget.css"]');
      if (existingScript) existingScript.remove();
      if (existingLink) existingLink.remove();
    };
  }, [chatbotId, theme, position, primaryColor, buttonText, welcomeMessage, size, showBranding, triggerDelay, enableSound, enableTyping]);

  return <div ref={widgetRef} id="chatbot-widget-${chatbotId}" />;
};

export default ChatbotWidget;

// Usage:
// <ChatbotWidget />`;
  };

  const generateVueCode = (baseUrl: string, widgetId: string) => {
    return `<template>
  <div ref="widgetRef" :id="widgetId"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  chatbotId?: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  buttonText?: string;
  welcomeMessage?: string;
  size?: 'small' | 'medium' | 'large';
  showBranding?: boolean;
  triggerDelay?: number;
  enableSound?: boolean;
  enableTyping?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  chatbotId: '${chatbotId}',
  theme: '${config.theme}',
  position: '${config.position}',
  primaryColor: '${config.primaryColor}',
  buttonText: '${config.buttonText}',
  welcomeMessage: '${config.welcomeMessage}',
  size: '${config.size}',
  showBranding: ${config.showBranding},
  triggerDelay: ${config.triggerDelay},
  enableSound: ${config.enableSound},
  enableTyping: ${config.enableTyping}
});

const widgetRef = ref<HTMLDivElement>();
const widgetId = \`chatbot-widget-\${props.chatbotId}\`;

let scriptElement: HTMLScriptElement | null = null;
let linkElement: HTMLLinkElement | null = null;

const loadWidget = () => {
  // Set global configuration
  (window as any).BotBuilderConfig = {
    chatbotId: props.chatbotId,
    theme: props.theme,
    position: props.position,
    primaryColor: props.primaryColor,
    buttonText: props.buttonText,
    welcomeMessage: props.welcomeMessage,
    size: props.size,
    showBranding: props.showBranding,
    triggerDelay: props.triggerDelay,
    enableSound: props.enableSound,
    enableTyping: props.enableTyping
  };

  // Load widget script
  scriptElement = document.createElement('script');
  scriptElement.src = '${baseUrl}/widget/chatbot-widget.js';
  scriptElement.async = true;
  document.head.appendChild(scriptElement);

  // Load widget styles
  linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = '${baseUrl}/widget/chatbot-widget.css';
  document.head.appendChild(linkElement);
};

const cleanupWidget = () => {
  if (scriptElement) {
    scriptElement.remove();
    scriptElement = null;
  }
  if (linkElement) {
    linkElement.remove();
    linkElement = null;
  }
};

onMounted(() => {
  loadWidget();
});

onUnmounted(() => {
  cleanupWidget();
});

// Watch for prop changes and reload widget
watch(() => props, () => {
  cleanupWidget();
  setTimeout(loadWidget, 100);
}, { deep: true });
</script>

<!-- Usage: -->
<!-- <ChatbotWidget /> -->`;
  };

  const generateAngularCode = (baseUrl: string, widgetId: string) => {
    return `import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-chatbot-widget',
  template: \`<div #widgetContainer [id]="widgetId"></div>\`,
  styleUrls: ['./chatbot-widget.component.css']
})
export class ChatbotWidgetComponent implements OnInit, OnDestroy {
  @Input() chatbotId: string = '${chatbotId}';
  @Input() theme: 'light' | 'dark' | 'auto' = '${config.theme}';
  @Input() position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = '${config.position}';
  @Input() primaryColor: string = '${config.primaryColor}';
  @Input() buttonText: string = '${config.buttonText}';
  @Input() welcomeMessage: string = '${config.welcomeMessage}';
  @Input() size: 'small' | 'medium' | 'large' = '${config.size}';
  @Input() showBranding: boolean = ${config.showBranding};
  @Input() triggerDelay: number = ${config.triggerDelay};
  @Input() enableSound: boolean = ${config.enableSound};
  @Input() enableTyping: boolean = ${config.enableTyping};

  @ViewChild('widgetContainer', { static: true }) widgetContainer!: ElementRef;

  private scriptElement: HTMLScriptElement | null = null;
  private linkElement: HTMLLinkElement | null = null;

  get widgetId(): string {
    return \`chatbot-widget-\${this.chatbotId}\`;
  }

  ngOnInit(): void {
    this.loadWidget();
  }

  ngOnDestroy(): void {
    this.cleanupWidget();
  }

  private loadWidget(): void {
    // Set global configuration
    (window as any).BotBuilderConfig = {
      chatbotId: this.chatbotId,
      theme: this.theme,
      position: this.position,
      primaryColor: this.primaryColor,
      buttonText: this.buttonText,
      welcomeMessage: this.welcomeMessage,
      size: this.size,
      showBranding: this.showBranding,
      triggerDelay: this.triggerDelay,
      enableSound: this.enableSound,
      enableTyping: this.enableTyping
    };

    // Load widget script
    this.scriptElement = document.createElement('script');
    this.scriptElement.src = '${baseUrl}/widget/chatbot-widget.js';
    this.scriptElement.async = true;
    document.head.appendChild(this.scriptElement);

    // Load widget styles
    this.linkElement = document.createElement('link');
    this.linkElement.rel = 'stylesheet';
    this.linkElement.href = '${baseUrl}/widget/chatbot-widget.css';
    document.head.appendChild(this.linkElement);
  }

  private cleanupWidget(): void {
    if (this.scriptElement) {
      this.scriptElement.remove();
      this.scriptElement = null;
    }
    if (this.linkElement) {
      this.linkElement.remove();
      this.linkElement = null;
    }
  }
}

// Usage in template:
// <app-chatbot-widget></app-chatbot-widget>`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const downloadCode = () => {
    const code = generateCode();
    const framework = frameworks.find((f) => f.id === selectedFramework);
    const extension =
      selectedFramework === "vanilla"
        ? "html"
        : selectedFramework === "react"
        ? "tsx"
        : selectedFramework === "vue"
        ? "vue"
        : "ts";

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatbot-widget.${extension}`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Code downloaded successfully!");
  };

  const getPositionPreview = () => {
    const positions = {
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
    };
    return positions[config.position];
  };

  const getSizeClasses = () => {
    const sizes = {
      small: "w-12 h-12",
      medium: "w-14 h-14",
      large: "w-16 h-16",
    };
    return sizes[config.size];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Website Widget</h2>
            <p className="text-gray-600">
              Embed your chatbot on any website with modern framework support
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Configuration Panel */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Framework Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Framework
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {frameworks.map((framework) => {
                    const IconComponent = framework.icon;
                    return (
                      <button
                        key={framework.id}
                        onClick={() => setSelectedFramework(framework.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedFramework === framework.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 bg-gradient-to-r ${framework.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {framework.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appearance Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Appearance
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={config.theme}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      value={config.position}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          position: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <select
                      value={config.size}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          size: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Content
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={config.buttonText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          buttonText: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welcome Message
                    </label>
                    <textarea
                      value={config.welcomeMessage}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          welcomeMessage: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Advanced
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Delay (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.triggerDelay}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          triggerDelay: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="0"
                      max="60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.showBranding}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            showBranding: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Show BotBuilder branding
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.enableSound}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            enableSound: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Enable sound notifications
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.enableTyping}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            enableTyping: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Show typing indicators
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Preview and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => setShowInstallGuide(true)}
                    variant="outline"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Installation Guide
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => copyToClipboard(generateCode())}
                    variant="outline"
                  >
                    {copiedCode ? (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedCode ? "Copied!" : "Copy Code"}
                  </Button>
                  <Button onClick={downloadCode}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Framework Info */}
              <div className="mb-6">
                {frameworks.map((framework) => {
                  if (framework.id !== selectedFramework) return null;
                  const IconComponent = framework.icon;
                  return (
                    <div
                      key={framework.id}
                      className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${framework.color} rounded-xl flex items-center justify-center mr-4`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {framework.name}
                        </h3>
                        <p className="text-gray-600">{framework.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Code Display */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {selectedFramework === "vanilla"
                      ? "HTML"
                      : selectedFramework === "react"
                      ? "TSX"
                      : selectedFramework === "vue"
                      ? "Vue"
                      : "TypeScript"}
                  </span>
                </div>
                <pre className="p-4 text-green-400 text-sm overflow-x-auto max-h-96">
                  <code>{generateCode()}</code>
                </pre>
              </div>

              {/* Widget Preview */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Widget Preview
                </h3>
                <div className="relative bg-gray-100 rounded-lg h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"></div>
                  <div className="absolute inset-4 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <p className="text-gray-500 text-sm">
                      Your website content
                    </p>
                  </div>

                  {/* Widget Button Preview */}
                  <div className={`absolute ${getPositionPreview()}`}>
                    <div
                      className={`${getSizeClasses()} rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center`}
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <WidgetPreviewModal
            config={config}
            chatbot={currentChatbot}
            onClose={() => setShowPreview(false)}
          />
        )}

        {/* Installation Guide Modal */}
        {showInstallGuide && (
          <InstallationGuideModal
            framework={selectedFramework}
            onClose={() => setShowInstallGuide(false)}
          />
        )}
      </motion.div>
    </div>
  );
}

interface WidgetPreviewModalProps {
  config: WidgetConfig;
  chatbot: any;
  onClose: () => void;
}

function WidgetPreviewModal({
  config,
  chatbot,
  onClose,
}: WidgetPreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      content: config.welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const getPositionClasses = () => {
    const positions = {
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
    };
    return positions[config.position];
  };

  const getSizeClasses = () => {
    const sizes = {
      small: "w-12 h-12",
      medium: "w-14 h-14",
      large: "w-16 h-16",
    };
    return sizes[config.size];
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        content:
          "Thanks for your message! This is a preview of how your chatbot will respond.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Widget Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-4 mb-4">
            <Button
              variant={!isOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={isOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsOpen(true)}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile
            </Button>
          </div>

          <div
            className={`relative bg-gray-100 rounded-lg overflow-hidden ${
              isOpen ? "h-96" : "h-80"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"></div>
            <div className="absolute inset-4 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <p className="text-gray-500">Your website content</p>
            </div>

            {/* Widget Button */}
            <div className={`absolute ${getPositionClasses()}`}>
              <div
                className={`${getSizeClasses()} rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center`}
                style={{ backgroundColor: config.primaryColor }}
                onClick={() => setIsOpen(!isOpen)}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Chat Window */}
            {isOpen && (
              <div
                className={`absolute ${
                  config.position.includes("bottom") ? "bottom-20" : "top-20"
                } ${
                  config.position.includes("right") ? "right-4" : "left-4"
                } w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col`}
              >
                <div
                  className="flex items-center justify-between p-4 border-b border-gray-200"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">
                        {chatbot?.name || "Chatbot"}
                      </h4>
                      <p className="text-xs text-white/80">Online</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-white/80 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender === "user"
                            ? "text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                        style={
                          message.sender === "user"
                            ? { backgroundColor: config.primaryColor }
                            : {}
                        }
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {config.showBranding && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-500 text-center">
                      Powered by{" "}
                      <span className="font-medium">BotBuilder Pro</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface InstallationGuideModalProps {
  framework: string;
  onClose: () => void;
}

function InstallationGuideModal({
  framework,
  onClose,
}: InstallationGuideModalProps) {
  const getInstallationSteps = () => {
    switch (framework) {
      case "vanilla":
        return [
          {
            title: "Copy the Code",
            description:
              "Copy the generated HTML code from the code editor above.",
            code: "<!-- Paste the generated code here -->",
          },
          {
            title: "Add to Your Website",
            description:
              "Paste the code just before the closing </body> tag in your HTML.",
            code: `<!DOCTYPE html>
<html>
<head>
  <title>Your Website</title>
</head>
<body>
  <!-- Your website content -->
  
  <!-- Paste the widget code here -->
  
</body>
</html>`,
          },
          {
            title: "Test the Widget",
            description:
              "Refresh your website and you should see the chat widget appear.",
            code: null,
          },
        ];

      case "react":
        return [
          {
            title: "Install Dependencies",
            description:
              "No additional dependencies required for the basic widget.",
            code: "# The widget uses vanilla JavaScript under the hood",
          },
          {
            title: "Create Component",
            description:
              "Copy the React component code and save it as ChatbotWidget.tsx",
            code: "// Save as src/components/ChatbotWidget.tsx",
          },
          {
            title: "Import and Use",
            description:
              "Import the component in your app and use it anywhere.",
            code: `import ChatbotWidget from './components/ChatbotWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatbotWidget />
    </div>
  );
}`,
          },
          {
            title: "Customize Props",
            description: "Pass custom props to override default settings.",
            code: `<ChatbotWidget 
  theme="dark"
  position="bottom-left"
  primaryColor="#10B981"
  buttonText="Need help?"
/>`,
          },
        ];

      case "vue":
        return [
          {
            title: "Create Component",
            description:
              "Copy the Vue component code and save it as ChatbotWidget.vue",
            code: "// Save as src/components/ChatbotWidget.vue",
          },
          {
            title: "Register Component",
            description: "Import and register the component in your Vue app.",
            code: `import ChatbotWidget from './components/ChatbotWidget.vue';

export default {
  components: {
    ChatbotWidget
  }
}`,
          },
          {
            title: "Use in Template",
            description: "Add the component to your template.",
            code: `<template>
  <div>
    <!-- Your app content -->
    <ChatbotWidget />
  </div>
</template>`,
          },
          {
            title: "Pass Props",
            description: "Customize the widget with props.",
            code: `<ChatbotWidget 
  :theme="'dark'"
  :position="'bottom-left'"
  :primary-color="'#10B981'"
  :button-text="'Need help?'"
/>`,
          },
        ];

      case "angular":
        return [
          {
            title: "Create Component",
            description: "Generate a new component and copy the code.",
            code: `ng generate component chatbot-widget`,
          },
          {
            title: "Update Component Files",
            description:
              "Replace the generated component code with the provided TypeScript code.",
            code: "// Update chatbot-widget.component.ts",
          },
          {
            title: "Add to Module",
            description: "Import the component in your module.",
            code: `import { ChatbotWidgetComponent } from './chatbot-widget/chatbot-widget.component';

@NgModule({
  declarations: [
    ChatbotWidgetComponent
  ]
})`,
          },
          {
            title: "Use in Template",
            description: "Add the component to your template.",
            code: `<app-chatbot-widget
  [theme]="'dark'"
  [position]="'bottom-left'"
  [primaryColor]="'#10B981'"
  [buttonText]="'Need help?'">
</app-chatbot-widget>`,
          },
        ];

      default:
        return [];
    }
  };

  const steps = getInstallationSteps();
  const frameworkInfo = frameworks.find((f) => f.id === framework);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {frameworkInfo && (
              <div
                className={`w-10 h-10 bg-gradient-to-r ${frameworkInfo.color} rounded-lg flex items-center justify-center`}
              >
                <frameworkInfo.icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {frameworkInfo?.name} Installation Guide
              </h3>
              <p className="text-gray-600">
                Step-by-step instructions to integrate the widget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  {step.code && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
            <p className="text-blue-800 text-sm mb-3">
              If you encounter any issues during installation, check our
              documentation or contact support.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Support
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
