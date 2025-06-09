import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  Zap,
  Crown,
  Rocket,
  ArrowRight,
  Loader,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { STRIPE_CONFIG, stripeService } from "../../lib/stripe";
import { useProfile } from "../../hooks/useProfile";
import toast from "react-hot-toast";

interface PricingPlansProps {
  onPlanSelect?: (planId: string) => void;
  currentPlan?: string;
  showCurrentPlan?: boolean;
}

export function PricingPlans({
  onPlanSelect,
  currentPlan,
  showCurrentPlan = true,
}: PricingPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
  const { profile } = useProfile();

  const handlePlanSelect = async (planId: string) => {
    if (planId === "free") {
      onPlanSelect?.(planId);
      return;
    }

    setIsLoading(planId);

    try {
      await stripeService.initialize();
      const plan =
        STRIPE_CONFIG.plans[planId as keyof typeof STRIPE_CONFIG.plans];

      if (!plan.priceId) {
        toast.error("Plan not available. Please contact support.");
        return;
      }

      await stripeService.createCheckoutSession(
        plan.priceId,
        profile?.subscription_id || undefined
      );
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      toast.error(
        error.message || "Failed to process payment. Please try again."
      );
    } finally {
      setIsLoading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return Rocket;
      case "pro":
        return Zap;
      case "enterprise":
        return Crown;
      default:
        return Star;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "free":
        return "from-gray-500 to-gray-600";
      case "pro":
        return "from-blue-500 to-blue-600";
      case "enterprise":
        return "from-purple-500 to-purple-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const isCurrentPlan = (planId: string) => {
    return showCurrentPlan && currentPlan === planId;
  };

  const getYearlyDiscount = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount
    const savings = monthlyPrice * 12 - yearlyPrice;
    return { yearlyPrice, savings };
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === "month"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingInterval === "year"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              20% off
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan], index) => {
          const Icon = getPlanIcon(planId);
          const colorClass = getPlanColor(planId);
          const isPopular = planId === "pro";
          const isCurrent = isCurrentPlan(planId);
          const loading = isLoading === planId;

          const { yearlyPrice, savings } = getYearlyDiscount(plan.price);
          const displayPrice =
            billingInterval === "year" ? yearlyPrice / 12 : plan.price;
          const displayInterval =
            billingInterval === "year" ? "month (billed yearly)" : "month";

          return (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-4 right-4 z-10">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </div>
                </div>
              )}

              <Card
                className={`p-8 h-full relative overflow-hidden ${
                  isPopular ? "ring-2 ring-blue-500 shadow-xl" : ""
                } ${isCurrent ? "ring-2 ring-green-500" : ""}`}
                hover={!isCurrent}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <div
                    className={`w-full h-full bg-gradient-to-br ${colorClass} rounded-full transform translate-x-16 -translate-y-16`}
                  />
                </div>

                {/* Plan Header */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${colorClass} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {billingInterval === "year" && plan.price > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-green-600 font-medium">
                          Save ${savings.toFixed(0)}/year
                        </div>
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        ${displayPrice.toFixed(0)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{displayInterval}
                      </span>
                    </div>
                    {billingInterval === "year" && plan.price > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        ${yearlyPrice.toFixed(0)} billed annually
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanSelect(planId)}
                    disabled={loading || isCurrent}
                    className={`w-full ${
                      isPopular
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        : isCurrent
                        ? "bg-green-500 hover:bg-green-600"
                        : ""
                    }`}
                    variant={
                      isPopular ? "primary" : isCurrent ? "primary" : "outline"
                    }
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : planId === "free" ? (
                      "Get Started Free"
                    ) : (
                      <>
                        Upgrade to {plan.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Additional Info */}
                  {planId === "enterprise" && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Need custom features?{" "}
                        <a
                          href="mailto:sales@botbuilder.com"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Contact Sales
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Compare Plans
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl mx-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-900">
                  Features
                </th>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <th
                    key={planId}
                    className="text-center py-4 px-6 font-medium text-gray-900"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 px-6 text-gray-700">Chatbots</td>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <td key={planId} className="text-center py-4 px-6">
                    {plan.limits.chatbots === -1
                      ? "Unlimited"
                      : plan.limits.chatbots}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700">Messages per month</td>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <td key={planId} className="text-center py-4 px-6">
                    {plan.limits.messages === -1
                      ? "Unlimited"
                      : plan.limits.messages.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700">AI Features</td>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <td key={planId} className="text-center py-4 px-6">
                    {plan.limits.aiFeatures ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700">
                  Multi-Channel Deployment
                </td>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <td key={planId} className="text-center py-4 px-6">
                    {plan.limits.multiChannel ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700">Advanced Analytics</td>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <td key={planId} className="text-center py-4 px-6">
                    {plan.limits.analytics ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700">Custom Branding</td>
                {Object.entries(STRIPE_CONFIG.plans).map(([planId, plan]) => (
                  <td key={planId} className="text-center py-4 px-6">
                    {plan.limits.customBranding ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h3>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Can I change my plan anytime?
            </h4>
            <p className="text-gray-700 text-sm">
              Yes! You can upgrade or downgrade your plan at any time. Changes
              take effect immediately, and we'll prorate the billing
              accordingly.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              What happens if I exceed my message limit?
            </h4>
            <p className="text-gray-700 text-sm">
              Your chatbots will continue to work, but you'll be prompted to
              upgrade your plan. We'll never shut down your service without
              notice.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Do you offer refunds?
            </h4>
            <p className="text-gray-700 text-sm">
              We offer a 30-day money-back guarantee for all paid plans. If
              you're not satisfied, contact us for a full refund.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Is there a setup fee?
            </h4>
            <p className="text-gray-700 text-sm">
              No setup fees, no hidden costs. The price you see is exactly what
              you pay. Cancel anytime with no penalties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
