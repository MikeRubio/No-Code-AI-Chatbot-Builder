import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Key, Globe, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useChatbots } from '../../hooks/useChatbots';
import toast from 'react-hot-toast';

interface WhatsAppSetupProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppSetup({ chatbotId, isOpen, onClose }: WhatsAppSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    whatsappPhoneNumber: '',
    webhookUrl: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { updateChatbot } = useChatbots();

  const steps = [
    {
      id: 1,
      title: 'Twilio Account Setup',
      description: 'Create and configure your Twilio account'
    },
    {
      id: 2,
      title: 'WhatsApp Business Setup',
      description: 'Set up WhatsApp Business API'
    },
    {
      id: 3,
      title: 'Configure Webhook',
      description: 'Connect your chatbot to WhatsApp'
    },
    {
      id: 4,
      title: 'Test Connection',
      description: 'Verify everything is working'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const connectWhatsApp = async () => {
    setIsConnecting(true);
    try {
      // Generate webhook URL
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-webhook`;
      
      // Update chatbot with WhatsApp configuration
      updateChatbot({
        id: chatbotId,
        updates: {
          whatsapp_phone_number: formData.whatsappPhoneNumber,
          whatsapp_webhook_url: webhookUrl,
          is_published: true
        }
      });

      toast.success('WhatsApp integration configured successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to configure WhatsApp integration');
    } finally {
      setIsConnecting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Integration Setup"
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
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Set up your Twilio Account
                </h3>
                <p className="text-gray-600">
                  You'll need a Twilio account to connect WhatsApp to your chatbot.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Steps to get started:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Create a free Twilio account at twilio.com</li>
                  <li>Verify your phone number</li>
                  <li>Get your Account SID and Auth Token from the console</li>
                  <li>Apply for WhatsApp Business API access</li>
                </ol>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://www.twilio.com/try-twilio', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Twilio Console
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Enter your Twilio credentials
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account SID
                </label>
                <input
                  type="text"
                  value={formData.twilioAccountSid}
                  onChange={(e) => handleInputChange('twilioAccountSid', e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={formData.twilioAuthToken}
                  onChange={(e) => handleInputChange('twilioAuthToken', e.target.value)}
                  placeholder="Your Twilio Auth Token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Security Note:</strong> Your credentials are encrypted and stored securely. 
                  We never share your Twilio credentials with third parties.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Configure WhatsApp Number
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Business Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsappPhoneNumber}
                  onChange={(e) => handleInputChange('whatsappPhoneNumber', e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include country code (e.g., +1 for US numbers)
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Webhook URL</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Configure this URL in your Twilio WhatsApp sandbox:
                </p>
                <code className="block bg-white p-2 rounded border text-sm break-all">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-webhook
                </code>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900">
                Ready to Connect!
              </h3>
              
              <p className="text-gray-600">
                Your chatbot is ready to be connected to WhatsApp. Click the button below to complete the setup.
              </p>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ Your chatbot will be published and activated</li>
                  <li>✓ WhatsApp messages will be routed to your bot</li>
                  <li>✓ You can start receiving customer inquiries</li>
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
                disabled={
                  (currentStep === 2 && (!formData.twilioAccountSid || !formData.twilioAuthToken)) ||
                  (currentStep === 3 && !formData.whatsappPhoneNumber)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={connectWhatsApp}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}