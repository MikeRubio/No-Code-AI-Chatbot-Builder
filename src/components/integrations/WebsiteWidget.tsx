import { useState } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Copy,
  ExternalLink,
  Palette,
  Settings,
  Eye,
  Download,
  Package,
  Zap,
  Globe,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import toast from "react-hot-toast";

interface WebsiteWidgetProps {
  chatbot: any;
  isOpen: boolean;
  onClose: () => void;
}

export function WebsiteWidget({
  chatbot,
  isOpen,
  onClose,
}: WebsiteWidgetProps) {
  const [activeTab, setActiveTab] = useState<"npm" | "script" | "iframe">(
    "npm"
  );
  const [theme, setTheme] = useState({
    primaryColor: "#3b82f6",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    position: "bottom-right",
    buttonSize: "medium",
  });
  const [showPreview, setShowPreview] = useState(false);

  const tabs = [
    {
      id: "npm",
      name: "NPM Package",
      icon: Package,
      description: "Professional integration for modern frameworks",
    },
    {
      id: "script",
      name: "Script Tag",
      icon: Code,
      description: "Simple integration for any website",
    },
    {
      id: "iframe",
      name: "Iframe Embed",
      icon: Globe,
      description: "Basic embed for quick testing",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard!");
  };

  const generateNPMCode = () => {
    return {
      install: `npm install @botforge/widget`,
      react: `import React from 'react';
import { BotForgeWidget } from '@botforge/widget';

function App() {
  return (
    <div>
      <h1>My Website</h1>
      <BotForgeWidget
        chatbotId="${chatbot.id}"
        theme={{
          primaryColor: '${theme.primaryColor}',
          backgroundColor: '${theme.backgroundColor}',
          borderRadius: '${theme.borderRadius}',
          buttonSize: '${theme.buttonSize}',
        }}
        position={{
          ${
            theme.position === "bottom-right"
              ? 'bottom: "20px", right: "20px"'
              : theme.position === "bottom-left"
              ? 'bottom: "20px", left: "20px"'
              : theme.position === "top-right"
              ? 'top: "20px", right: "20px"'
              : 'top: "20px", left: "20px"'
          }
        }}
        events={{
          onOpen: () => console.log('Chat opened'),
          onMessage: (message) => console.log('New message:', message),
        }}
      />
    </div>
  );
}

export default App;`,
      vue: `<template>
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
  components: { BotForgeWidget },
  data() {
    return {
      chatbotId: '${chatbot.id}',
      theme: {
        primaryColor: '${theme.primaryColor}',
        backgroundColor: '${theme.backgroundColor}',
        borderRadius: '${theme.borderRadius}',
        buttonSize: '${theme.buttonSize}',
      },
      position: {
        ${
          theme.position === "bottom-right"
            ? 'bottom: "20px", right: "20px"'
            : theme.position === "bottom-left"
            ? 'bottom: "20px", left: "20px"'
            : theme.position === "top-right"
            ? 'top: "20px", right: "20px"'
            : 'top: "20px", left: "20px"'
        }
      },
      events: {
        onOpen: () => console.log('Chat opened'),
        onMessage: (message) => console.log('New message:', message),
      },
    };
  },
};
</script>`,
      vanilla: `<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>My Website</h1>
  
  <script src="https://unpkg.com/@botforge/widget/dist/botforge-widget.umd.js"></script>
  <script>
    const widget = BotForge.initBotForge({
      chatbotId: '${chatbot.id}',
      theme: {
        primaryColor: '${theme.primaryColor}',
        backgroundColor: '${theme.backgroundColor}',
        borderRadius: '${theme.borderRadius}',
        buttonSize: '${theme.buttonSize}',
      },
      position: {
        ${
          theme.position === "bottom-right"
            ? 'bottom: "20px", right: "20px"'
            : theme.position === "bottom-left"
            ? 'bottom: "20px", left: "20px"'
            : theme.position === "top-right"
            ? 'top: "20px", right: "20px"'
            : 'top: "20px", left: "20px"'
        }
      },
      events: {
        onOpen: () => console.log('Chat opened'),
        onMessage: (message) => console.log('New message:', message),
      },
    });
  </script>
</body>
</html>`,
    };
  };

  const generateScriptCode = () => {
    return `<!-- BotForge Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/@botforge/widget/dist/botforge-widget.umd.js';
    script.onload = function() {
      BotForge.initBotForge({
        chatbotId: '${chatbot.id}',
        theme: {
          primaryColor: '${theme.primaryColor}',
          backgroundColor: '${theme.backgroundColor}',
          borderRadius: '${theme.borderRadius}',
          buttonSize: '${theme.buttonSize}',
        },
        position: {
          ${
            theme.position === "bottom-right"
              ? 'bottom: "20px", right: "20px"'
              : theme.position === "bottom-left"
              ? 'bottom: "20px", left: "20px"'
              : theme.position === "top-right"
              ? 'top: "20px", right: "20px"'
              : 'top: "20px", left: "20px"'
          }
        },
        autoOpen: false,
        showBranding: true,
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const generateIframeCode = () => {
    const params = new URLSearchParams({
      chatbotId: chatbot.id,
      primaryColor: theme.primaryColor,
      backgroundColor: theme.backgroundColor,
      borderRadius: theme.borderRadius,
      position: theme.position,
      buttonSize: theme.buttonSize,
    });

    return `<iframe
  src="https://botforge.site/widget/embed?${params.toString()}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px;"
  title="${chatbot.name} Chat Widget">
</iframe>`;
  };

  const downloadPackageFiles = () => {
    const npmCode = generateNPMCode();

    // Create a zip-like structure with multiple files
    const files = [
      {
        name: "README.md",
        content: `# ${chatbot.name} Widget Integration\n\n## Installation\n\n\`\`\`bash\n${npmCode.install}\n\`\`\`\n\n## Usage\n\nSee the example files for React, Vue, and Vanilla JS implementations.`,
      },
      { name: "react-example.jsx", content: npmCode.react },
      { name: "vue-example.vue", content: npmCode.vue },
      { name: "vanilla-example.html", content: npmCode.vanilla },
      {
        name: "script-integration.html",
        content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Script Integration</title>\n</head>\n<body>\n  <h1>My Website</h1>\n  ${generateScriptCode()}\n</body>\n</html>`,
      },
    ];

    // Create and download each file
    files.forEach((file) => {
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });

    toast.success("Integration files downloaded!");
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Website Widget Integration"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Add {chatbot.name} to Your Website
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Choose your preferred integration method and customize the
            appearance
          </p>
        </div>

        {/* Integration Method Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div>{tab.name}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Customization Panel */}
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Customize Appearance
            </h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPackageFiles}
              >
                <Download className="w-4 h-4 mr-1" />
                Download Files
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) =>
                  setTheme((prev) => ({
                    ...prev,
                    primaryColor: e.target.value,
                  }))
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Background
              </label>
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) =>
                  setTheme((prev) => ({
                    ...prev,
                    backgroundColor: e.target.value,
                  }))
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position
              </label>
              <select
                value={theme.position}
                onChange={(e) =>
                  setTheme((prev) => ({ ...prev, position: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Button Size
              </label>
              <select
                value={theme.buttonSize}
                onChange={(e) =>
                  setTheme((prev) => ({ ...prev, buttonSize: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Integration Code */}
        <div className="space-y-4">
          {activeTab === "npm" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">
                    NPM Package Integration
                  </h4>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Professional integration for React, Vue, Angular, and other
                  modern frameworks. Includes TypeScript support, event
                  handling, and full customization options.
                </p>
              </div>

              {/* Installation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    1. Install the package
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateNPMCode().install)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateNPMCode().install}</code>
                </pre>
              </div>

              {/* Framework Examples */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "React", code: generateNPMCode().react, icon: "⚛️" },
                  { name: "Vue.js", code: generateNPMCode().vue, icon: "💚" },
                  {
                    name: "Vanilla JS",
                    code: generateNPMCode().vanilla,
                    icon: "🟨",
                  },
                ].map((framework) => (
                  <Card key={framework.name} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <span className="mr-2">{framework.icon}</span>
                        {framework.name}
                      </h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(framework.code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto max-h-40">
                      <code>{framework.code}</code>
                    </pre>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "script" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-green-900 dark:text-green-200">
                    Script Tag Integration
                  </h4>
                </div>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Simple integration for any website. Just add this script tag
                  to your HTML and the widget will load automatically.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Add this script to your website
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateScriptCode())}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateScriptCode()}</code>
                </pre>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                  💡 Pro Tip
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Place this script just before the closing{" "}
                  <code>&lt;/body&gt;</code> tag for optimal loading
                  performance.
                </p>
              </div>
            </div>
          )}

          {activeTab === "iframe" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-200">
                    Iframe Embed
                  </h4>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  Basic embed option for quick testing or when you need a
                  contained chat interface.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Embed code
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateIframeCode())}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateIframeCode()}</code>
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  📱 Responsive Design
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  The iframe will automatically adapt to different screen sizes.
                  You can adjust the width and height attributes as needed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Mobile Optimized
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Responsive design that works perfectly on all devices
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Lightning Fast
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Optimized for performance with minimal impact on your site
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Fully Customizable
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Match your brand with extensive theming options
            </p>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Need Help?
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            <a
              href="/docs"
              target="_blank"
              className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Documentation
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Complete integration guide
                </div>
              </div>
            </a>

            <a
              href="https://github.com/botforge/widget"
              target="_blank"
              className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Package className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  NPM Package
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  View on GitHub
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Widget Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 relative min-h-[400px]">
                <div className="text-center text-gray-600 dark:text-gray-300 mb-4">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Widget preview would appear here</p>
                  <p className="text-sm">
                    Use the actual integration code to see the live widget
                  </p>
                </div>

                {/* Mock widget button */}
                <div
                  className="fixed rounded-full shadow-lg flex items-center justify-center text-white text-xl cursor-pointer"
                  style={{
                    backgroundColor: theme.primaryColor,
                    width:
                      theme.buttonSize === "small"
                        ? "48px"
                        : theme.buttonSize === "large"
                        ? "64px"
                        : "56px",
                    height:
                      theme.buttonSize === "small"
                        ? "48px"
                        : theme.buttonSize === "large"
                        ? "64px"
                        : "56px",
                    [theme.position.includes("bottom") ? "bottom" : "top"]:
                      "20px",
                    [theme.position.includes("right") ? "right" : "left"]:
                      "20px",
                  }}
                >
                  💬
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Modal>
  );
}
