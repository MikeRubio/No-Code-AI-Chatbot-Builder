import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Users, 
  MessageCircle, 
  BarChart3, 
  Globe,
  X,
  Loader,
  CreditCard,
  Shield
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { stripeService, STRIPE_CONFIG } from '../../lib/stripe';
import toast from 'react-hot-toast';

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionManager({ isOpen, onClose }: SubscriptionManagerProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Stripe when component mounts
    stripeService.initialize().catch(console.error);
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (!user || !profile) {
      toast.error('Please sign in to upgrade your plan');
      return;
    }

    const plan = STRIPE_CONFIG.plans[planId as keyof typeof STRIPE_CONFIG.plans];
    if (!plan || !plan.priceId) {
      toast.error('Invalid plan selected');
      return;
    }

    if (profile.plan === planId) {
      toast.error('You are already on this plan');
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      // Initialize Stripe if not already done
      await stripeService.initialize();

      // Create checkout session
      await stripeService.createCheckoutSession(
        plan.priceId,
        profile.stripe_customer_id || undefined,
        user.email || undefined
      );
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to start upgrade process. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!profile?.stripe_customer_id) {
      toast.error('No billing information found. Please contact support.');
      return;
    }

    setIsLoading(true);
    try {
      await stripeService.createPortalSession(profile.stripe_customer_id);
    } catch (error: any) {
      console.error('Billing portal error:', error);
      toast.error(error.message || 'Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '1 chatbot',
        '100 messages/month',
        'Basic templates',
        'Web deployment',
        'Email support'
      ],
      limitations: [
        'No AI features',
        'No multi-channel deployment',
        'Basic analytics only'
      ],
      popular: false,
      color: 'from-gray-500 to-gray-600'
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
        'AI-powered responses',
        'Multi-channel deployment',
        'Advanced analytics',
        'A/B testing',
        'Priority support',
        'Custom branding'
      ],
      limitations: [],
      popular: true,
      color: 'from-blue-500 to-purple-600'
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
        'Advanced AI features',
        'White-label solution',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
        'Custom training'
      ],
      limitations: [],
      popular: false,
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const currentPlan = plans.find(plan => plan.id === profile?.plan) || plans[0];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Subscription" size="xl">
      <div className="space-y-6">
        {/* Current Plan Status */}
        {profile && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Current Plan: {currentPlan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {profile.messages_used} / {profile.message_quota === -1 ? '∞' : profile.message_quota} messages used
                </p>
                {profile.message_quota !== -1 && (
                  <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((profile.messages_used / profile.message_quota) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              {profile.plan !== 'free' && profile.stripe_customer_id && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Manage Billing
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <Card className={`p-6 h-full relative overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-500/50 dark:ring-blue-400/50' : ''
              } ${
                profile?.plan === plan.id ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''
              }`}>
                {/* Background gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plan.color} opacity-10 rounded-full -mr-16 -mt-16`} />
                
                {/* Current plan badge */}
                {profile?.plan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      Current
                    </div>
                  </div>
                )}

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      /{plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center text-sm">
                        <X className="w-4 h-4 text-red-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500 dark:text-gray-400">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading || profile?.plan === plan.id || plan.id === 'free'}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : profile?.plan === plan.id ? (
                      'Current Plan'
                    ) : plan.id === 'free' ? (
                      'Free Plan'
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Feature Comparison
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-3">
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Chatbots</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>Free: 1 chatbot</div>
                <div>Pro: 5 chatbots</div>
                <div>Enterprise: Unlimited</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-purple-600 dark:text-purple-400">
                <Zap className="w-5 h-5 mr-2" />
                <span className="font-medium">AI Features</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>Free: Basic only</div>
                <div>Pro: Full AI power</div>
                <div>Enterprise: Advanced AI</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <Globe className="w-5 h-5 mr-2" />
                <span className="font-medium">Deployment</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>Free: Web only</div>
                <div>Pro: Multi-channel</div>
                <div>Enterprise: All channels</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-orange-600 dark:text-orange-400">
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium">Support</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>Free: Email support</div>
                <div>Pro: Priority support</div>
                <div>Enterprise: Dedicated support</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center text-blue-800 dark:text-blue-200">
            <Shield className="w-5 h-5 mr-2" />
            <div>
              <h4 className="font-medium">Secure Payment Processing</h4>
              <p className="text-sm mt-1">
                All payments are processed securely through Stripe. Your payment information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}