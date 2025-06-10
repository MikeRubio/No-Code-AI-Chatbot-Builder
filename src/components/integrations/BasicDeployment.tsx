import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MessageCircle, Share, ExternalLink, Copy, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { WebsiteWidget } from './WebsiteWidget';
import toast from 'react-hot-toast';

interface BasicDeploymentProps {
  chatbotId: string;
  chatbotName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BasicDeployment({ chatbotId, chatbotName, isOpen, onClose }: BasicDeploymentProps) {
  const [showWebsiteWidget, setShowWebsiteWidget] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const directUrl = `${baseUrl}/chat/${chatbotId}`;
  const embedUrl = `${baseUrl}/embed/${chatbotId}`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const deploymentOptions = [
    {
      id: 'website',
      title: 'Website Widget',
      description: 'Add a chat widget to your website with customizable themes and positioning',
      icon: Globe,
      action: () => setShowWebsiteWidget(true),
      buttonText: 'Get Embed Code',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'direct',
      title: 'Direct Link',
      description: 'Share a direct link to your chatbot that opens in a new page',
      icon: ExternalLink,
      action: () => copyToClipboard(directUrl, 'direct'),
      buttonText: copied === 'direct' ? 'Copied!' : 'Copy Link',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'embed',
      title: 'Embeddable Frame',
      description: 'Embed your chatbot as an iframe in any webpage or application',
      icon: MessageCircle,
      action: () => copyToClipboard(`<iframe src="${embedUrl}" width="400" height="600" frameborder="0"></iframe>`, 'embed'),
      buttonText: copied === 'embed' ? 'Copied!' : 'Copy Iframe',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'share',
      title: 'Social Sharing',
      description: 'Share your chatbot on social media or messaging platforms',
      icon: Share,
      action: () => copyToClipboard(directUrl, 'share'),
      buttonText: copied === 'share' ? 'Copied!' : 'Copy Share Link',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Deploy Your Chatbot"
        size="xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Deploy "{chatbotName}"
            </h3>
            <p className="text-gray-600">
              Choose how you want to deploy your chatbot. All options are available on the free plan!
            </p>
          </div>

          {/* Free Plan Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-800 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-medium">Free Plan Deployment</span>
            </div>
            <p className="text-green-700 text-sm">
              All basic deployment options are included in your free plan. Upgrade to Pro for advanced features like WhatsApp integration, custom domains, and analytics.
            </p>
          </div>

          {/* Deployment Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {deploymentOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover className="p-6 h-full">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <option.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {option.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">
                        {option.description}
                      </p>
                      <Button
                        onClick={option.action}
                        size="sm"
                        className="w-full"
                      >
                        {option.buttonText}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Quick Access Links</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Direct Chat Link</div>
                  <div className="text-sm text-gray-600 truncate">{directUrl}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(directUrl, 'quick-direct')}
                >
                  {copied === 'quick-direct' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Embed URL</div>
                  <div className="text-sm text-gray-600 truncate">{embedUrl}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedUrl, 'quick-embed')}
                >
                  {copied === 'quick-embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Upgrade Notice */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Want More Deployment Options?</h4>
            <p className="text-blue-800 text-sm mb-4">
              Upgrade to Pro or Enterprise for advanced deployment features including WhatsApp Business integration, custom domains, branded widgets, and detailed analytics.
            </p>
            <Button variant="outline" size="sm">
              View Upgrade Options
            </Button>
          </Card>
        </div>
      </Modal>

      {/* Website Widget Modal */}
      <WebsiteWidget
        chatbotId={chatbotId}
        chatbotName={chatbotName}
        isOpen={showWebsiteWidget}
        onClose={() => setShowWebsiteWidget(false)}
      />
    </>
  );
}