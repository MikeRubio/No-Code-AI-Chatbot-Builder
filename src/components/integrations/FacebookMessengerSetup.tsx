import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Key, 
  Globe, 
  CheckCircle, 
  ExternalLink, 
  Copy,
  AlertCircle,
  Settings,
  MessageCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface FacebookMessengerSetupProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
  appId: string;
  appSecret: string;
  verifyToken: string;
  webhookUrl: string;
  isConnected: boolean;
}

export function FacebookMessengerSetup({ chatbotId, isOpen, onClose }: FacebookMessengerSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<FacebookConfig>({
    pageId: '',
    pageAccessToken: '',
    appId: '',
    appSecret: '',
    verifyToken: generateVerifyToken(),
    webhookUrl: '',
    isConnected: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  const steps = [
    {
      id: 1,
      title: 'Facebook App Setup',
      description: 'Create and configure your Facebook App'
    },
    {
      id: 2,
      title: 'Page Configuration',
      description: 'Connect your Facebook Page'
    },
    {
      id: 3,
      title: 'Webhook Setup',
      description: 'Configure webhook for real-time messaging'
    },
    {
      id: 4,
      title: 'Test & Activate',
      description: 'Test the integration and go live'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      loadExistingConfig();
      generateWebhookUrl();
    }
  }, [isOpen, chatbotId]);

  const loadExistingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_channels')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('channel_type', 'facebook')
        .single();

      if (data && !error) {
        setConfig(prev => ({
          ...prev,
          ...data.channel_config,
          isConnected: data.is_active
        }));
        
        if (data.is_active) {
          setCurrentStep(4);
          setWebhookStatus('verified');
        }
      }
    } catch (error) {
      console.log('No existing Facebook configuration found');
    }
  };

  const generateWebhookUrl = () => {
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-webhook?chatbot=${chatbotId}`;
    setConfig(prev => ({ ...prev, webhookUrl }));
  };

  const handleInputChange = (field: keyof FacebookConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(config.appId && config.appSecret);
      case 2:
        return !!(config.pageId && config.pageAccessToken);
      case 3:
        return webhookStatus === 'verified';
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const testWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      // Save configuration first
      await saveConfiguration();
      
      // Test webhook connectivity
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-facebook-webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          verifyToken: config.verifyToken,
          pageAccessToken: config.pageAccessToken
        }),
      });

      if (response.ok) {
        setWebhookStatus('verified');
        toast.success('Webhook verified successfully!');
      } else {
        throw new Error('Webhook verification failed');
      }
    } catch (error: any) {
      setWebhookStatus('failed');
      toast.error('Webhook verification failed: ' + error.message);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const channelConfig = {
        pageId: config.pageId,
        pageAccessToken: config.pageAccessToken,
        appId: config.appId,
        appSecret: config.appSecret,
        verifyToken: config.verifyToken,
        webhookUrl: config.webhookUrl
      };

      // Check if channel exists
      const { data: existingChannel } = await supabase
        .from('deployment_channels')
        .select('id')
        .eq('chatbot_id', chatbotId)
        .eq('channel_type', 'facebook')
        .single();

      if (existingChannel) {
        // Update existing channel
        const { error } = await supabase
          .from('deployment_channels')
          .update({
            channel_config: channelConfig,
            sync_status: 'synced',
            is_active: true
          })
          .eq('id', existingChannel.id);

        if (error) throw error;
      } else {
        // Create new channel
        const { error } = await supabase
          .from('deployment_channels')
          .insert({
            chatbot_id: chatbotId,
            channel_type: 'facebook',
            channel_config: channelConfig,
            sync_status: 'synced',
            is_active: true
          });

        if (error) throw error;
      }

      toast.success('Facebook Messenger configuration saved!');
    } catch (error: any) {
      toast.error('Failed to save configuration: ' + error.message);
      throw error;
    }
  };

  const connectFacebookMessenger = async () => {
    setIsConnecting(true);
    try {
      await saveConfiguration();
      setConfig(prev => ({ ...prev, isConnected: true }));
      toast.success('Facebook Messenger integration activated!');
      onClose();
    } catch (error: any) {
      toast.error('Failed to connect Facebook Messenger: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Facebook Messenger Integration"
      size="lg"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Facebook className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Create Facebook App
                </h3>
                <p className="text-gray-600">
                  First, you'll need to create a Facebook App to enable Messenger integration.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Steps to create your Facebook App:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a></li>
                  <li>Click "Create App" and select "Business" as the app type</li>
                  <li>Fill in your app details and create the app</li>
                  <li>Add the "Messenger" product to your app</li>
                  <li>Copy your App ID and App Secret from the Basic Settings</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={(e) => handleInputChange('appId', e.target.value)}
                    placeholder="Your Facebook App ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Secret
                  </label>
                  <input
                    type="password"
                    value={config.appSecret}
                    onChange={(e) => handleInputChange('appSecret', e.target.value)}
                    placeholder="Your Facebook App Secret"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Facebook Developers
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Connect Your Facebook Page
              </h3>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Page Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                  <li>In your Facebook App, go to Messenger → Settings</li>
                  <li>In the "Access Tokens" section, click "Add or Remove Pages"</li>
                  <li>Select the Facebook Page you want to connect</li>
                  <li>Generate a Page Access Token and copy it</li>
                  <li>Copy your Page ID from your Facebook Page settings</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page ID
                  </label>
                  <input
                    type="text"
                    value={config.pageId}
                    onChange={(e) => handleInputChange('pageId', e.target.value)}
                    placeholder="Your Facebook Page ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Access Token
                  </label>
                  <input
                    type="password"
                    value={config.pageAccessToken}
                    onChange={(e) => handleInputChange('pageAccessToken', e.target.value)}
                    placeholder="Your Page Access Token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">How to find your Page ID:</h4>
                <p className="text-sm text-gray-600">
                  Go to your Facebook Page → About → Page Transparency → Page ID
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Configure Webhook
              </h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Webhook URL</h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white p-2 rounded border text-sm break-all">
                    {config.webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.webhookUrl, 'Webhook URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Verify Token</h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white p-2 rounded border text-sm">
                    {config.verifyToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.verifyToken, 'Verify Token')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Webhook Configuration Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>In your Facebook App, go to Messenger → Settings</li>
                  <li>In the "Webhooks" section, click "Add Callback URL"</li>
                  <li>Paste the Webhook URL above</li>
                  <li>Paste the Verify Token above</li>
                  <li>Subscribe to these events: messages, messaging_postbacks, messaging_optins</li>
                  <li>Click "Verify and Save"</li>
                </ol>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={testWebhook}
                  disabled={isTestingWebhook || !config.pageAccessToken}
                >
                  {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
                </Button>
              </div>

              {webhookStatus === 'verified' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Webhook verified successfully!</span>
                  </div>
                </div>
              )}

              {webhookStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Webhook verification failed. Please check your configuration.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900">
                Ready to Go Live!
              </h3>
              
              <p className="text-gray-600">
                Your Facebook Messenger integration is configured and ready. Users can now chat with your bot through Facebook Messenger.
              </p>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ Your chatbot is connected to Facebook Messenger</li>
                  <li>✓ Users can message your Facebook Page</li>
                  <li>✓ Messages will be processed by your chatbot</li>
                  <li>✓ Responses will be sent back through Messenger</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Testing your integration:</h4>
                <p className="text-sm text-blue-800">
                  Send a message to your Facebook Page from a different Facebook account to test the integration.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={connectFacebookMessenger}
                disabled={isConnecting || !config.isConnected}
              >
                {isConnecting ? 'Activating...' : 'Activate Integration'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function generateVerifyToken(): string {
  return 'verify_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}