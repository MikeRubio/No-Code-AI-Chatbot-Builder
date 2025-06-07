import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Phone, 
  Key, 
  Globe, 
  CheckCircle, 
  ExternalLink, 
  Copy,
  AlertCircle,
  QrCode,
  Smartphone,
  Building2,
  Shield
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface WhatsAppBusinessSetupProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WhatsAppConfig {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  webhookUrl: string;
  phoneNumber: string;
  displayName: string;
  isConnected: boolean;
  setupMethod: 'cloud_api' | 'on_premise' | 'partner';
}

export function WhatsAppBusinessSetup({ chatbotId, isOpen, onClose }: WhatsAppBusinessSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<WhatsAppConfig>({
    businessAccountId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: generateVerifyToken(),
    webhookUrl: '',
    phoneNumber: '',
    displayName: '',
    isConnected: false,
    setupMethod: 'cloud_api'
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  const steps = [
    {
      id: 1,
      title: 'Choose Setup Method',
      description: 'Select how you want to integrate WhatsApp'
    },
    {
      id: 2,
      title: 'Business Account Setup',
      description: 'Configure your WhatsApp Business Account'
    },
    {
      id: 3,
      title: 'Phone Number Setup',
      description: 'Add and verify your business phone number'
    },
    {
      id: 4,
      title: 'Webhook Configuration',
      description: 'Set up real-time message handling'
    },
    {
      id: 5,
      title: 'Test & Activate',
      description: 'Test the integration and go live'
    }
  ];

  const setupMethods = [
    {
      id: 'cloud_api',
      name: 'WhatsApp Cloud API',
      description: 'Free, hosted by Meta (Facebook). Best for most businesses.',
      icon: Globe,
      features: [
        'Free to use (pay only for messages)',
        'Hosted by Meta',
        'Easy setup',
        'Automatic scaling',
        'Built-in reliability'
      ],
      recommended: true
    },
    {
      id: 'on_premise',
      name: 'On-Premises API',
      description: 'Self-hosted solution for enterprise customers.',
      icon: Building2,
      features: [
        'Full control over infrastructure',
        'Custom security policies',
        'Higher message volume limits',
        'Requires technical setup',
        'Enterprise pricing'
      ],
      recommended: false
    },
    {
      id: 'partner',
      name: 'Business Solution Provider',
      description: 'Use a WhatsApp BSP partner like 360Dialog, MessageBird, etc.',
      icon: Shield,
      features: [
        'Managed service',
        'Additional features',
        'Support included',
        'Third-party pricing',
        'Quick setup'
      ],
      recommended: false
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
        .eq('channel_type', 'whatsapp')
        .single();

      if (data && !error) {
        setConfig(prev => ({
          ...prev,
          ...data.channel_config,
          isConnected: data.is_active
        }));
        
        if (data.is_active) {
          setCurrentStep(5);
          setWebhookStatus('verified');
        }
      }
    } catch (error) {
      console.log('No existing WhatsApp configuration found');
    }
  };

  const generateWebhookUrl = () => {
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook?chatbot=${chatbotId}`;
    setConfig(prev => ({ ...prev, webhookUrl }));
  };

  const handleInputChange = (field: keyof WhatsAppConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!config.setupMethod;
      case 2:
        return !!(config.businessAccountId && config.accessToken);
      case 3:
        return !!(config.phoneNumberId && config.phoneNumber);
      case 4:
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
      await saveConfiguration();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-whatsapp-webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          verifyToken: config.webhookVerifyToken,
          accessToken: config.accessToken,
          phoneNumberId: config.phoneNumberId
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
        setupMethod: config.setupMethod,
        businessAccountId: config.businessAccountId,
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        webhookVerifyToken: config.webhookVerifyToken,
        webhookUrl: config.webhookUrl,
        phoneNumber: config.phoneNumber,
        displayName: config.displayName
      };

      const { data: existingChannel } = await supabase
        .from('deployment_channels')
        .select('id')
        .eq('chatbot_id', chatbotId)
        .eq('channel_type', 'whatsapp')
        .single();

      if (existingChannel) {
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
        const { error } = await supabase
          .from('deployment_channels')
          .insert({
            chatbot_id: chatbotId,
            channel_type: 'whatsapp',
            channel_config: channelConfig,
            sync_status: 'synced',
            is_active: true
          });

        if (error) throw error;
      }

      toast.success('WhatsApp configuration saved!');
    } catch (error: any) {
      toast.error('Failed to save configuration: ' + error.message);
      throw error;
    }
  };

  const connectWhatsApp = async () => {
    setIsConnecting(true);
    try {
      await saveConfiguration();
      setConfig(prev => ({ ...prev, isConnected: true }));
      toast.success('WhatsApp Business integration activated!');
      onClose();
    } catch (error: any) {
      toast.error('Failed to connect WhatsApp: ' + error.message);
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
      title="WhatsApp Business Integration"
      size="xl"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Choose Your WhatsApp Integration Method
                </h3>
                <p className="text-gray-600">
                  Select the best WhatsApp Business API option for your needs.
                </p>
              </div>

              <div className="grid gap-4">
                {setupMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        config.setupMethod === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('setupMethod', method.id)}
                    >
                      {method.recommended && (
                        <div className="absolute -top-2 left-4">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{method.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                          
                          <ul className="space-y-1">
                            {method.features.map((feature, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          config.setupMethod === method.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {config.setupMethod === method.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {config.setupMethod === 'cloud_api' ? 'WhatsApp Cloud API Setup' : 'Business Account Setup'}
              </h3>

              {config.setupMethod === 'cloud_api' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Cloud API Setup Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a></li>
                    <li>Create a new app or use an existing one</li>
                    <li>Add the "WhatsApp" product to your app</li>
                    <li>Go to WhatsApp → Getting Started</li>
                    <li>Copy your temporary access token and phone number ID</li>
                    <li>Note your WhatsApp Business Account ID</li>
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Business Account ID
                  </label>
                  <input
                    type="text"
                    value={config.businessAccountId}
                    onChange={(e) => handleInputChange('businessAccountId', e.target.value)}
                    placeholder="Your WhatsApp Business Account ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={config.accessToken}
                    onChange={(e) => handleInputChange('accessToken', e.target.value)}
                    placeholder="Your WhatsApp API Access Token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {config.setupMethod === 'cloud_api' 
                      ? 'Use the temporary token for testing, then generate a permanent token'
                      : 'Your permanent access token from your BSP or on-premises setup'
                    }
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• The temporary token expires in 24 hours</li>
                  <li>• You'll need to generate a permanent token for production</li>
                  <li>• Keep your access token secure and never share it publicly</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://developers.facebook.com/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Facebook Developers
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Phone Number Configuration
              </h3>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Phone Number Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                  <li>In your Facebook App, go to WhatsApp → Getting Started</li>
                  <li>Add a phone number or use the test number provided</li>
                  <li>Verify your phone number with the SMS code</li>
                  <li>Copy the Phone Number ID from the dashboard</li>
                  <li>Set your business display name</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={config.phoneNumberId}
                    onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
                    placeholder="Phone Number ID from Facebook"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={config.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Display Name
                </label>
                <input
                  type="text"
                  value={config.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Your Business Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name will appear in WhatsApp conversations
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Test Number vs Production:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-700">Test Number</h5>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Free to use</li>
                      <li>• Limited to 5 recipients</li>
                      <li>• Perfect for development</li>
                      <li>• No verification required</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700">Production Number</h5>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Your own business number</li>
                      <li>• Unlimited recipients</li>
                      <li>• Requires verification</li>
                      <li>• Professional appearance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Webhook Configuration
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
                    {config.webhookVerifyToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.webhookVerifyToken, 'Verify Token')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Webhook Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>In your Facebook App, go to WhatsApp → Configuration</li>
                  <li>Click "Edit" next to Webhook</li>
                  <li>Paste the Webhook URL above</li>
                  <li>Paste the Verify Token above</li>
                  <li>Subscribe to these webhook fields: messages</li>
                  <li>Click "Verify and Save"</li>
                </ol>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={testWebhook}
                  disabled={isTestingWebhook || !config.accessToken || !config.phoneNumberId}
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

          {currentStep === 5 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900">
                WhatsApp Integration Complete!
              </h3>
              
              <p className="text-gray-600">
                Your chatbot is now connected to WhatsApp Business. Customers can message your business number and receive automated responses.
              </p>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">What's working now:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ WhatsApp Business API connected</li>
                  <li>✓ Webhook receiving messages</li>
                  <li>✓ Chatbot processing conversations</li>
                  <li>✓ Automated responses being sent</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Testing your integration:</h4>
                <p className="text-sm text-blue-800">
                  Send a WhatsApp message to <strong>{config.phoneNumber}</strong> from a different phone to test the integration.
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Next steps for production:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Generate a permanent access token</li>
                  <li>• Complete business verification if needed</li>
                  <li>• Set up message templates for notifications</li>
                  <li>• Configure business hours and auto-replies</li>
                </ul>
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
                onClick={connectWhatsApp}
                disabled={isConnecting}
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
  return 'whatsapp_verify_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}