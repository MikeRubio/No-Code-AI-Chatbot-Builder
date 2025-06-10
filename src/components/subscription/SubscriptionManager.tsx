import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Check, 
  X, 
  CreditCard, 
  Zap, 
  Users, 
  MessageCircle,
  BarChart3,
  Globe,
  Shield,
  Star,
  ArrowRight,
  Loader
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
  const { profile } = useProfile();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Stripe when component mounts
    stripeService.initialize();
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

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      await stripeService.createCheckoutSession(
        plan.priceId,
        profile.stripe_customer_id,
        user.email || undefined
      );
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!profile?.stripe_customer_id) {
      toast.error('No billing information found');
      return;
    }

    setIsLoading(true);
    try {
      await stripeService.createPortalSession(profile.stripe_customer_id);
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  const plans = Object.values(STRIPE_CONFIG.plans);
  const currentPlan = profile?.plan || 'free';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Subscription" size="xl">
      <div className="space-y-8">
        {/* Current Plan Status */}
        {profile && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {profile.messages_used} / {profile.message_quota === -1 ? '∞' : profile.message_quota} messages used
                </p>
                {profile.message_quota !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((profile.messages_used / profile.message_quota) * 100, 100)}%` 
                      }}
                    />
                  </div>
                )}
              </div>
              {currentPlan !== 'free' && profile.stripe_customer_id && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isPopular = plan.id === 'pro';
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <Card className={`p-6 h-full ${
                  isCurrentPlan 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : isPopular 
                    ? 'ring-2 ring-purple-500/50' 
                    : ''
                }`}>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 ml-1">
                        /{plan.interval}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : plan.id === 'free' ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          toast.info('You can downgrade to the free plan by canceling your current subscription');
                        }}
                      >
                        Downgrade
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          isPopular 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                            : ''
                        }`}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isLoading}
                      >
                        {isLoading && selectedPlan === plan.id ? (
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        {currentPlan === 'free' ? 'Upgrade' : 'Switch Plan'}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            What's included in each plan?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-200">AI Chatbots</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Analytics</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Multi-Channel</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Priority Support</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Can I change plans anytime?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">What happens to my data if I downgrade?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Your data is preserved, but you may lose access to premium features until you upgrade again.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Do you offer refunds?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}