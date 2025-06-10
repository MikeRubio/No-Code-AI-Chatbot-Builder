import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Code,
  Eye,
  Palette,
  Monitor,
  Smartphone,
  Check,
  ExternalLink,
  Download,
  Send,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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
  const [activeTab, setActiveTab] = useState<"embed" | "customize" | "preview">(
    "embed"
  );
  const [widgetConfig, setWidgetConfig] = useState({
    position: "bottom-right",
    theme: "light",
    primaryColor: "#3B82F6",
    greeting: "Hi! How can I help you today?",
    placeholder: "Type your message...",
    width: "400px",
    height: "600px",
    borderRadius: "12px",
    showBranding: true,
  });
  const [copied, setCopied] = useState(false);

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const widgetUrl = `${baseUrl}/widget/${chatbot.id}`;

    return `<!-- BotForge Chatbot Widget -->
<div id="botforge-widget"></div>
<script>
  (function() {
    var config = {
      chatbotId: '${chatbot.id}',
      position: '${widgetConfig.position}',
      theme: '${widgetConfig.theme}',
      primaryColor: '${widgetConfig.primaryColor}',
      greeting: '${widgetConfig.greeting}',
      placeholder: '${widgetConfig.placeholder}',
      width: '${widgetConfig.width}',
      height: '${widgetConfig.height}',
      borderRadius: '${widgetConfig.borderRadius}',
      showBranding: ${widgetConfig.showBranding}
    };
    
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.onload = function() {
      BotForgeWidget.init(config);
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const generateIframeCode = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      theme: widgetConfig.theme,
      color: widgetConfig.primaryColor.replace("#", ""),
      greeting: widgetConfig.greeting,
      placeholder: widgetConfig.placeholder,
      branding: widgetConfig.showBranding.toString(),
    });

    return `<iframe 
  src="${baseUrl}/widget/${chatbot.id}?${params.toString()}"
  width="${widgetConfig.width}"
  height="${widgetConfig.height}"
  style="border: none; border-radius: ${widgetConfig.borderRadius};"
  title="${chatbot.name} Chatbot">
</iframe>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadHtmlFile = () => {
    const embedCode = generateEmbedCode();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with ${chatbot.name} Chatbot</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is a sample page with the ${chatbot.name} chatbot integrated.</p>
    
    ${embedCode}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chatbot.name.toLowerCase().replace(/\s+/g, "-")}-demo.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "embed", name: "Embed Code", icon: Code },
    { id: "customize", name: "Customize", icon: Palette },
    { id: "preview", name: "Preview", icon: Eye },
  ];

  const positions = [
    { id: "bottom-right", name: "Bottom Right", preview: "bottom-4 right-4" },
    { id: "bottom-left", name: "Bottom Left", preview: "bottom-4 left-4" },
    { id: "top-right", name: "Top Right", preview: "top-4 right-4" },
    { id: "top-left", name: "Top Left", preview: "top-4 left-4" },
  ];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Website Widget Deployment"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Deploy {chatbot.name} to Your Website
          </h3>
          <p className="text-gray-600">
            Add your chatbot to any website with a simple embed code
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "embed" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Integration Method
              </h4>

              <div className="grid md:grid-cols-2 gap-6">
                {/* JavaScript Widget */}
                <Card className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Code className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        JavaScript Widget
                      </h5>
                      <p className="text-sm text-gray-600">
                        Recommended - Full features
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {generateEmbedCode()}
                    </pre>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => copyToClipboard(generateEmbedCode())}
                      size="sm"
                      className="flex-1"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? "Copied!" : "Copy Code"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadHtmlFile}
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Demo
                    </Button>
                  </div>
                </Card>

                {/* iFrame Embed */}
                <Card className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <ExternalLink className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        iFrame Embed
                      </h5>
                      <p className="text-sm text-gray-600">
                        Simple - Works anywhere
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {generateIframeCode()}
                    </pre>
                  </div>

                  <Button
                    onClick={() => copyToClipboard(generateIframeCode())}
                    size="sm"
                    className="w-full"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy iFrame Code"}
                  </Button>
                </Card>
              </div>
            </div>

            {/* Instructions */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-3">
                Integration Instructions
              </h5>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                <li>Copy the embed code above</li>
                <li>
                  Paste it into your website's HTML, just before the closing
                  &lt;/body&gt; tag
                </li>
                <li>Save and publish your website</li>
                <li>Your chatbot will appear automatically!</li>
              </ol>
            </Card>
          </div>
        )}

        {activeTab === "customize" && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">
              Customize Widget Appearance
            </h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Widget Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {positions.map((position) => (
                    <button
                      key={position.id}
                      onClick={() =>
                        setWidgetConfig((prev) => ({
                          ...prev,
                          position: position.id,
                        }))
                      }
                      className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                        widgetConfig.position === position.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {position.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["light", "dark"].map((theme) => (
                    <button
                      key={theme}
                      onClick={() =>
                        setWidgetConfig((prev) => ({ ...prev, theme }))
                      }
                      className={`p-3 text-sm rounded-lg border-2 transition-colors capitalize ${
                        widgetConfig.theme === theme
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={widgetConfig.primaryColor}
                    onChange={(e) =>
                      setWidgetConfig((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={widgetConfig.primaryColor}
                    onChange={(e) =>
                      setWidgetConfig((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Widget Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Width
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.width}
                      onChange={(e) =>
                        setWidgetConfig((prev) => ({
                          ...prev,
                          width: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Height
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.height}
                      onChange={(e) =>
                        setWidgetConfig((prev) => ({
                          ...prev,
                          height: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Greeting Message */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Greeting Message
                </label>
                <input
                  type="text"
                  value={widgetConfig.greeting}
                  onChange={(e) =>
                    setWidgetConfig((prev) => ({
                      ...prev,
                      greeting: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hi! How can I help you today?"
                />
              </div>

              {/* Placeholder */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Placeholder
                </label>
                <input
                  type="text"
                  value={widgetConfig.placeholder}
                  onChange={(e) =>
                    setWidgetConfig((prev) => ({
                      ...prev,
                      placeholder: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your message..."
                />
              </div>

              {/* Show Branding */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={widgetConfig.showBranding}
                    onChange={(e) =>
                      setWidgetConfig((prev) => ({
                        ...prev,
                        showBranding: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show "Powered by BotForge" branding
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                Widget Preview
              </h4>
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Desktop View</span>
              </div>
            </div>

            {/* Preview Container */}
            <div className="relative bg-gray-100 rounded-lg p-8 min-h-96">
              {/* Mock Website Content */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Your Website
                </h3>
                <p className="text-gray-600 mb-4">
                  This is how your chatbot widget will appear on your website.
                </p>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>

              {/* Widget Preview */}
              <div
                className={`absolute ${
                  positions.find((p) => p.id === widgetConfig.position)?.preview
                }`}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-80 h-96 rounded-lg shadow-xl border ${
                    widgetConfig.theme === "dark"
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                  style={{ borderRadius: widgetConfig.borderRadius }}
                >
                  {/* Widget Header */}
                  <div
                    className="p-4 rounded-t-lg flex items-center space-x-3"
                    style={{
                      backgroundColor: widgetConfig.primaryColor,
                      borderRadius: `${widgetConfig.borderRadius} ${widgetConfig.borderRadius} 0 0`,
                    }}
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {chatbot.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">
                        {chatbot.name}
                      </h4>
                      <p className="text-white/80 text-xs">Online</p>
                    </div>
                  </div>

                  {/* Widget Body */}
                  <div
                    className={`p-4 flex-1 ${
                      widgetConfig.theme === "dark"
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    <div className="mb-4">
                      <div className="flex items-start space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: widgetConfig.primaryColor }}
                        >
                          B
                        </div>
                        <div
                          className={`p-2 rounded-lg max-w-xs ${
                            widgetConfig.theme === "dark"
                              ? "bg-gray-800"
                              : "bg-gray-100"
                          }`}
                        >
                          <p className="text-sm">{widgetConfig.greeting}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Widget Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={widgetConfig.placeholder}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                          widgetConfig.theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        disabled
                      />
                      <button
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: widgetConfig.primaryColor }}
                        disabled
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {widgetConfig.showBranding && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-500">
                          Powered by BotForge
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile Preview Toggle */}
            <div className="flex items-center justify-center">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
                <Smartphone className="w-4 h-4" />
                <span>View Mobile Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Widget will be available at:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {window.location.origin}/widget/{chatbot.id}
            </code>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => copyToClipboard(generateEmbedCode())}>
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy Embed Code
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
