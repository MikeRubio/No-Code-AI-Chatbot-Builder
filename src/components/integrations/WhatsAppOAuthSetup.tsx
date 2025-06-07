import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  CheckCircle, 
  ExternalLink, 
  Shield,
  Smartphone,
  Globe,
  Users,
  Zap,
  ArrowRight,
  Facebook,
  Loader
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface WhatsAppOAuthSetupProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WhatsAppIntegration {
  id: string;
  status: 'pending' | 'connecting' | 'connected' | 'failed';
  businessName?: string;
  phoneNumber?: string;
  displayName?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  errorMessage?: string;
}

export function WhatsAppOAuthSetup({ chatbotId, isOpen, onClose }: WhatsAppOAuthSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Connect Facebook Business',
      description: 'Securely connect your Facebook Business account'
    },
    {
      id: 2,
      title: 'Select WhatsApp Business',
      description: 'Choose your WhatsApp Business account'
    },
    {
      id: 3,
      title: 'Configure Settings',
      description: 'Set up your chatbot preferences'
    },
    {
      id: 4,
      title: 'Go Live',
      description: 'Activate your WhatsApp chatbot'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      checkExistingIntegration();
    }
  }, [isOpen, chatbotId]);

  useEffect(() => {
    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'WHATSAPP_OAUTH_SUCCESS') {
        handleOAuthSuccess(event.data.payload);
      } else if (event.data.type === 'WHATSAPP_OAUTH_ERROR') {
        handleOAuthError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkExistingIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_channels')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('channel_type', 'whatsapp')
        .single();

      if (data && !error) {
        setIntegration({
          id: data.id,
          status: data.is_active ? 'connected' : 'pending',
          businessName: data.channel_config?.businessName,
          phoneNumber: data.channel_config?.phoneNumber,
          displayName: data.channel_config?.displayName,
          verificationStatus: data.channel_config?.verificationStatus
        });
        
        if (data.is_active) {
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.log('No existing WhatsApp integration found');
    }
  };

  const startFacebookOAuth = async () => {
    setIsConnecting(true);
    
    try {
      // Generate OAuth state for security
      const state = generateSecureState();
      
      // Store state in session for verification
      sessionStorage.setItem('whatsapp_oauth_state', state);
      
      // Facebook OAuth URL with WhatsApp Business permissions
      const facebookOAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      facebookOAuthUrl.searchParams.set('client_id', import.meta.env.VITE_FACEBOOK_APP_ID);
      facebookOAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/whatsapp/callback`);
      facebookOAuthUrl.searchParams.set('scope', 'whatsapp_business_management,whatsapp_business_messaging,business_management,pages_read_engagement');
      facebookOAuthUrl.searchParams.set('response_type', 'code');
      facebookOAuthUrl.searchParams.set('state', state);
      facebookOAuthUrl.searchParams.set('extras', JSON.stringify({
        chatbotId,
        userId: user?.id,
        setup_type: 'whatsapp_business'
      }));

      // Open OAuth popup
      const popup = window.open(
        facebookOAuthUrl.toString(),
        'whatsapp_oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      setAuthWindow(popup);

      // Monitor popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          setAuthWindow(null);
        }
      }, 1000);

    } catch (error: any) {
      setIsConnecting(false);
      toast.error('Failed to start Facebook authentication: ' + error.message);
    }
  };

  const handleOAuthSuccess = async (payload: any) => {
    try {
      setIsConnecting(true);
      
      // Close auth window
      if (authWindow) {
        authWindow.close();
        setAuthWindow(null);
      }

      // Process the OAuth response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-oauth-handler`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          userId: user?.id,
          authCode: payload.code,
          state: payload.state
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process WhatsApp authentication');
      }

      const result = await response.json();
      
      setIntegration({
        id: result.integrationId,
        status: 'connecting',
        businessName: result.businessName,
        phoneNumber: result.phoneNumber,
        displayName: result.displayName
      });

      setCurrentStep(2);
      toast.success('Facebook Business account connected successfully!');

    } catch (error: any) {
      toast.error('Failed to complete authentication: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOAuthError = (error: string) => {
    setIsConnecting(false);
    if (authWindow) {
      authWindow.close();
      setAuthWindow(null);
    }
    toast.error('Authentication failed: ' + error);
  };

  const selectWhatsAppBusiness = async (businessAccountId: string) => {
    try {
      setIsConnecting(true);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-business-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          integrationId: integration?.id,
          businessAccountId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set up WhatsApp Business');
      }

      const result = await response.json();
      
      setIntegration(prev => ({
        ...prev!,
        status: 'connecting',
        phoneNumber: result.phoneNumber,
        displayName: result.displayName
      }));

      setCurrentStep(3);
      toast.success('WhatsApp Business account selected!');

    } catch (error: any) {
      toast.error('Failed to set up WhatsApp Business: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const configureSettings = async (settings: any) => {
    try {
      setIsConnecting(true);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          integrationId: integration?.id,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to configure WhatsApp settings');
      }

      setCurrentStep(4);
      toast.success('WhatsApp settings configured!');

    } catch (error: any) {
      toast.error('Failed to configure settings: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const activateIntegration = async () => {
    try {
      setIsConnecting(true);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          integrationId: integration?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate WhatsApp integration');
      }

      setIntegration(prev => ({
        ...prev!,
        status: 'connected'
      }));

      toast.success('WhatsApp chatbot is now live!');
      onClose();

    } catch (error: any) {
      toast.error('Failed to activate integration: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const generateSecureState = () => {
    return btoa(JSON.stringify({
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2),
      chatbotId
    }));
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
                <div className={`w-16 h-1 mx-2 ${
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
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Connect Your WhatsApp Business
                </h3>
                <p className="text-gray-600 text-lg">
                  We'll handle all the technical setup for you. Just connect your Facebook Business account and we'll take care of the rest.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Secure & Safe</h4>
                  <p className="text-sm text-gray-600">Bank-level security with OAuth 2.0 authentication</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Instant Setup</h4>
                  <p className="text-sm text-gray-600">No technical knowledge required - we handle everything</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Official API</h4>
                  <p className="text-sm text-gray-600">Direct integration with WhatsApp Business API</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">What we'll do for you:</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Register your webhook automatically
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Configure phone number settings
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Set up message templates
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Handle token management
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Test the integration
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Monitor connection health
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={startFacebookOAuth}
                  disabled={isConnecting}
                  className="px-8 py-4"
                >
                  {isConnecting ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Facebook className="w-5 h-5 mr-2" />
                      Connect Facebook Business
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  You'll be redirected to Facebook to authorize the connection
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <WhatsAppBusinessSelector
              onSelect={selectWhatsAppBusiness}
              isLoading={isConnecting}
            />
          )}

          {currentStep === 3 && (
            <WhatsAppSettingsConfig
              integration={integration}
              onConfigure={configureSettings}
              isLoading={isConnecting}
            />
          )}

          {currentStep === 4 && (
            <WhatsAppActivation
              integration={integration}
              onActivate={activateIntegration}
              isLoading={isConnecting}
            />
          )}
        </Card>
      </div>
    </Modal>
  );
}

// Component for selecting WhatsApp Business account
function WhatsAppBusinessSelector({ onSelect, isLoading }: { onSelect: (id: string) => void; isLoading: boolean }) {
  const [businesses, setBusinesses] = useState([
    {
      id: 'waba_123456789',
      name: 'My Business',
      phoneNumber: '+1 (555) 123-4567',
      status: 'verified',
      currency: 'USD'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Select Your WhatsApp Business Account
        </h3>
        <p className="text-gray-600">
          Choose which WhatsApp Business account to connect to your chatbot
        </p>
      </div>

      <div className="space-y-3">
        {businesses.map((business) => (
          <Card key={business.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{business.name}</h4>
                  <p className="text-sm text-gray-600">{business.phoneNumber}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      business.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {business.status}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onSelect(business.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Select'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Component for configuring WhatsApp settings
function WhatsAppSettingsConfig({ integration, onConfigure, isLoading }: { 
  integration: any; 
  onConfigure: (settings: any) => void; 
  isLoading: boolean;
}) {
  const [settings, setSettings] = useState({
    welcomeMessage: 'Hello! How can I help you today?',
    businessHours: 'always',
    autoReply: true,
    humanHandoff: true
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Configure Your WhatsApp Settings
        </h3>
        <p className="text-gray-600">
          Customize how your chatbot behaves on WhatsApp
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Welcome Message
          </label>
          <textarea
            value={settings.welcomeMessage}
            onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
            placeholder="Enter the first message users will see..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Hours
          </label>
          <select
            value={settings.businessHours}
            onChange={(e) => setSettings(prev => ({ ...prev, businessHours: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="always">24/7 - Always available</option>
            <option value="business">Business hours only</option>
            <option value="custom">Custom schedule</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Auto-reply to messages</h4>
            <p className="text-sm text-gray-600">Automatically respond to incoming messages</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoReply}
              onChange={(e) => setSettings(prev => ({ ...prev, autoReply: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Human handoff</h4>
            <p className="text-sm text-gray-600">Allow transfer to human agents when needed</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.humanHandoff}
              onChange={(e) => setSettings(prev => ({ ...prev, humanHandoff: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>

      <div className="text-center">
        <Button
          onClick={() => onConfigure(settings)}
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? 'Configuring...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

// Component for final activation
function WhatsAppActivation({ integration, onActivate, isLoading }: { 
  integration: any; 
  onActivate: () => void; 
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          Ready to Go Live!
        </h3>
        <p className="text-gray-600 text-lg">
          Your WhatsApp Business integration is configured and ready to activate.
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-3">Integration Summary:</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <p className="text-green-800"><strong>Business:</strong> {integration?.businessName}</p>
            <p className="text-green-800"><strong>Phone:</strong> {integration?.phoneNumber}</p>
          </div>
          <div className="text-left">
            <p className="text-green-800"><strong>Status:</strong> Ready to activate</p>
            <p className="text-green-800"><strong>Type:</strong> WhatsApp Business API</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">What happens when you activate:</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            Webhook will be registered with WhatsApp
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            Your chatbot will start receiving messages
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            Automated responses will be sent to customers
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            Analytics and monitoring will begin
          </div>
        </div>
      </div>

      <Button
        onClick={onActivate}
        disabled={isLoading}
        size="lg"
        className="px-8 py-4"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Activating...
          </>
        ) : (
          <>
            Activate WhatsApp Integration
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}