import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useProfile } from '../../hooks/useProfile';
import toast from 'react-hot-toast';

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionManager({ isOpen, onClose }: SubscriptionManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { profile, updateProfile } = useProfile();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out our platform',
      features: [
        '1 chatbot',
        '100 messages/month',
        'Basic analytics',
        'Website integration',
        'Community support'
      ],
      limitations: [
        'No WhatsApp integration',
        'No OpenAI integration',
        'Limited customization'
      ],
      color: 'from-gray-500 to-gray-600',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'Best for growing businesses',
      features: [
        '5 chatbots',
        '5,000 messages/month',
        'Advanced analytics',
        'WhatsApp integration',
        'OpenAI integration',
        'Priority support',
        'Custom branding',
        'FAQ document upload',
        'Conversation history'
      ],
      color: 'from-blue-500 to-blue-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large organizations',
      features: [
        'Unlimited chatbots',
        'Unlimited messages',
        'Advanced integrations',
        'Custom AI training',
        'White-label solution',
        'Dedicated support',
        'SLA guarantee',
        'Custom deployment',
        'Advanced security'
      ],
      color: 'from-purple-500 to-purple-600',
      popular: false
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      toast.error('You are already on the free plan');
      return;
    }

    setIsUpgrading(true);
    setSelectedPlan(planId);

    try {
      // In a real implementation, this would integrate with Stripe
      // For now, we'll simulate the upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Update user profile with new plan
      updateProfile({
        plan: planId as 'free' | 'pro' | 'enterprise',
        message_quota: planId === 'pro' ? 5000 : planId === 'enterprise' ? 999999 : 100,
        subscription_status: 'active'
      });

      toast.success(`Successfully upgraded to ${plan.name} plan!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upgrade plan');
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const getCurrentPlanFeatures = () => {
    const currentPlan = plans.find(p => p.id === profile?.plan);
    return currentPlan?.features || [];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscription Management"
      size="xl"
    >
      <div className="space-y-6">
        {/* Current Plan Status */}
        {profile && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Current Plan: {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
                </h3>
                <p className="text-gray-600">
                  {profile.messages_used} / {profile.message_quota} messages used this month
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((profile.messages_used / profile.message_quota) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Next reset</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile.quota_reset_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Crown className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <Card className={`p-6 h-full ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              } ${profile?.plan === plan.id ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    {plan.id === 'free' && <Zap className="w-6 h-6 text-white" />}
                    {plan.id === 'pro' && <BarChart3 className="w-6 h-6 text-white" />}
                    {plan.id === 'enterprise' && <Shield className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-2">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {profile?.plan === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isUpgrading}
                  >
                    {isUpgrading && selectedPlan === plan.id ? (
                      'Upgrading...'
                    ) : plan.id === 'free' ? (
                      'Downgrade'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Feature Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-2 font-medium text-gray-900">Free</th>
                  <th className="text-center py-2 font-medium text-gray-900">Pro</th>
                  <th className="text-center py-2 font-medium text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-gray-600">Number of Chatbots</td>
                  <td className="text-center py-2">1</td>
                  <td className="text-center py-2">5</td>
                  <td className="text-center py-2">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Messages per Month</td>
                  <td className="text-center py-2">100</td>
                  <td className="text-center py-2">5,000</td>
                  <td className="text-center py-2">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">WhatsApp Integration</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">OpenAI Integration</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Advanced Analytics</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Priority Support</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Modal>
  );
}