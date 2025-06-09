import { useState } from "react";
import {
  CreditCard,
  Crown,
  Zap,
  Check,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { StripeWebhookSetup } from "./StripeWebhookSetup";
import { PricingPlans } from "./PricingPlans";
import { useProfile } from "../../hooks/useProfile";
import { stripeService, STRIPE_CONFIG } from "../../lib/stripe";
import toast from "react-hot-toast";

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionManager({
  isOpen,
  onClose,
}: SubscriptionManagerProps) {
  const { profile } = useProfile();
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = profile
    ? STRIPE_CONFIG.plans[profile.plan as keyof typeof STRIPE_CONFIG.plans]
    : null;

  const handleUpgrade = async (planId: string) => {
    if (!profile) return;

    setIsLoading(true);
    try {
      await stripeService.initialize();
      const plan =
        STRIPE_CONFIG.plans[planId as keyof typeof STRIPE_CONFIG.plans];

      if (plan.priceId) {
        await stripeService.createCheckoutSession(plan.priceId);
      } else {
        toast.error(
          "Price ID not configured. Please set up Stripe products first."
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!profile?.subscription_id) {
      toast.error("No active subscription found");
      return;
    }

    setIsLoading(true);
    try {
      await stripeService.createPortalSession(profile.subscription_id);
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!profile) return 0;
    if (profile.message_quota === -1) return 0; // Unlimited
    return Math.min((profile.messages_used / profile.message_quota) * 100, 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90)
      return "text-red-600 bg-red-100 dark:text-red-200 dark:bg-red-900";
    if (percentage >= 75)
      return "text-orange-600 bg-orange-100 dark:text-orange-200 dark:bg-orange-900";
    return "text-green-600 bg-green-100 dark:text-green-200 dark:bg-green-900";
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Subscription Management"
        size="lg"
      >
        <div className="space-y-6">
          {/* Current Plan */}
          {currentPlan && (
            <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    {currentPlan.id === "enterprise" ? (
                      <Crown className="w-6 h-6 text-white" />
                    ) : currentPlan.id === "pro" ? (
                      <Zap className="w-6 h-6 text-white" />
                    ) : (
                      <CreditCard className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {currentPlan.name} Plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {currentPlan.price === 0
                        ? "Free"
                        : `$${currentPlan.price}/${currentPlan.interval}`}
                    </p>
                  </div>
                </div>

                {profile.plan !== "free" && (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isLoading}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
              </div>

              {/* Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    Message Usage
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor()}`}
                  >
                    {profile.message_quota === -1
                      ? `${profile.messages_used} messages (Unlimited)`
                      : `${profile.messages_used} / ${profile.message_quota} messages`}
                  </span>
                </div>
                {profile.message_quota !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getUsagePercentage()}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Plan Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
                      <span className="text-gray-700 dark:text-gray-200">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Upgrade Options */}
          {profile?.plan === "free" && (
            <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Upgrade Your Plan
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Pro Plan
                    </h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    $29
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                      /month
                    </span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    Perfect for growing businesses
                  </p>
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Upgrade to Pro
                  </Button>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Enterprise Plan
                    </h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    $99
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                      /month
                    </span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    For large organizations
                  </p>
                  <Button
                    onClick={() => handleUpgrade("enterprise")}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Upgrade to Enterprise
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Subscription Status */}
          {profile &&
            profile.subscription_status !== "active" &&
            profile.plan !== "free" && (
              <Card className="p-6 bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-800">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-200 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      Subscription Issue
                    </h3>
                    <p className="text-orange-800 dark:text-orange-100 text-sm mb-3">
                      Your subscription status is:{" "}
                      <strong>{profile.subscription_status}</strong>
                    </p>
                    {profile.subscription_status === "past_due" && (
                      <p className="text-orange-800 dark:text-orange-100 text-sm mb-3">
                        Please update your payment method to continue using
                        premium features.
                      </p>
                    )}
                    <Button
                      onClick={handleManageBilling}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
                    >
                      Resolve Issue
                    </Button>
                  </div>
                </div>
              </Card>
            )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Webhook Setup Modal */}
      <StripeWebhookSetup
        isOpen={showWebhookSetup}
        onClose={() => setShowWebhookSetup(false)}
      />

      {/* Pricing Plans Modal */}
      <PricingPlans />
    </>
  );
}
