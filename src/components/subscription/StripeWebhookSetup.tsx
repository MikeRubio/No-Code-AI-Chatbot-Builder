import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  RefreshCw,
  Globe,
  Key,
  Webhook,
  Code
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface StripeWebhookSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StripeWebhookSetup({ isOpen, onClose }: StripeWebhookSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    // Generate webhook URL based on Supabase project
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      setWebhookUrl(`${supabaseUrl}/functions/v1/stripe-webhook`);
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const testWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      // Test webhook endpoint
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature'
        },
        body: JSON.stringify({
          type: 'test.webhook',
          data: { object: { id: 'test' } }
        })
      });

      if (response.ok) {
        setWebhookStatus('success');
        toast.success('Webhook endpoint is working!');
      } else {
        setWebhookStatus('error');
        toast.error('Webhook endpoint test failed');
      }
    } catch (error) {
      setWebhookStatus('error');
      toast.error('Failed to test webhook endpoint');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const steps = [
    {
      title: 'Get Your Webhook URL',
      description: 'Copy your Supabase function URL for the Stripe webhook',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Your Webhook URL
            </h4>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                {webhookUrl || 'Loading...'}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(webhookUrl)}
                disabled={!webhookUrl}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Important</h4>
                <p className="text-yellow-800 text-sm">
                  Make sure your Stripe webhook function is deployed in Supabase before proceeding.
                  You can check this in your Supabase Dashboard under Edge Functions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={testWebhook}
              disabled={!webhookUrl || isTestingWebhook}
              variant="outline"
            >
              {isTestingWebhook ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Webhook className="w-4 h-4 mr-2" />
              )}
              Test Webhook
            </Button>
            
            {webhookStatus === 'success' && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Webhook is working
              </div>
            )}
            
            {webhookStatus === 'error' && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Webhook test failed
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Create Webhook in Stripe',
      description: 'Add the webhook endpoint in your Stripe Dashboard',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Step-by-step instructions:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span>Go to <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Dashboard → Webhooks</a></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span>Click "Add endpoint"</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span>Paste your webhook URL in the "Endpoint URL" field</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                <span>Add description: "BotBuilder Pro Webhook"</span>
              </li>
            </ol>
          </div>

          <Button
            onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Stripe Dashboard
          </Button>
        </div>
      )
    },
    {
      title: 'Configure Events',
      description: 'Select which Stripe events to listen for',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">Required Events:</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                'customer.subscription.created',
                'customer.subscription.updated',
                'customer.subscription.deleted',
                'invoice.payment_succeeded',
                'invoice.payment_failed',
                'customer.created',
                'customer.updated'
              ].map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <code className="text-green-800">{event}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to add events:</h4>
            <ol className="space-y-1 text-sm text-blue-800">
              <li>1. In the webhook creation form, click "Select events"</li>
              <li>2. Search for each event above and select it</li>
              <li>3. Click "Add events" after selecting all required events</li>
              <li>4. Click "Add endpoint" to save the webhook</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: 'Get Signing Secret',
      description: 'Copy the webhook signing secret for verification',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2 flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Webhook Signing Secret
            </h4>
            <p className="text-orange-800 text-sm mb-3">
              After creating the webhook, you'll need to get the signing secret to verify webhook authenticity.
            </p>
            <ol className="space-y-1 text-sm text-orange-800">
              <li>1. Click on your newly created webhook in the Stripe Dashboard</li>
              <li>2. In the "Signing secret" section, click "Reveal"</li>
              <li>3. Copy the secret (starts with "whsec_")</li>
              <li>4. Add it to your environment variables</li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2 flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Environment Variable
            </h4>
            <pre className="text-green-400 text-sm">
              <code>STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here</code>
            </pre>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Paste your webhook secret here (optional):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`)}
                disabled={!webhookSecret}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Update Price IDs',
      description: 'Configure your Stripe product price IDs',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Update Price IDs in Code:</h4>
            <p className="text-blue-800 text-sm mb-3">
              You need to update the price IDs in your Stripe configuration with your actual Stripe product price IDs.
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">File: src/lib/stripe.ts</h4>
            <pre className="text-green-400 text-sm overflow-x-auto">
              <code>{`pro: {
  id: 'pro',
  name: 'Pro',
  price: 29,
  priceId: 'price_YOUR_ACTUAL_PRO_PRICE_ID', // ← Update this
  interval: 'month',
  // ... other config
},
enterprise: {
  id: 'enterprise',
  name: 'Enterprise',
  price: 99,
  priceId: 'price_YOUR_ACTUAL_ENTERPRISE_PRICE_ID', // ← Update this
  interval: 'month',
  // ... other config
}`}</code>
            </pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">How to get Price IDs:</h4>
            <ol className="space-y-1 text-sm text-yellow-800">
              <li>1. Go to Stripe Dashboard → Products</li>
              <li>2. Create products for Pro ($29/month) and Enterprise ($99/month) if not already created</li>
              <li>3. Click on each product to see its price ID</li>
              <li>4. Copy the price IDs and update your code</li>
            </ol>
          </div>

          <Button
            onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Stripe Products
          </Button>
        </div>
      )
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stripe Webhook Setup"
      size="xl"
    >
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Step {currentStep + 1} of {steps.length}
          </h3>
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Step */}
        <Card className="p-6">
          <div className="mb-4">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h4>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
          
          {steps[currentStep].content}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-3">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>

        {/* Quick Reference */}
        <Card className="p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Quick Reference:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Webhook URL:</span>
              <code className="block text-xs text-gray-600 mt-1 break-all">
                {webhookUrl}
              </code>
            </div>
            <div>
              <span className="font-medium text-gray-700">Required Events:</span>
              <div className="text-xs text-gray-600 mt-1">
                subscription.*, invoice.payment_*, customer.*
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}