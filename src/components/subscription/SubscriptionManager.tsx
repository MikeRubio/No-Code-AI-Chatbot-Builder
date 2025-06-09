import { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { PricingPlans } from "./PricingPlans";
import { useProfile } from "../../hooks/useProfile";
import { stripeService, STRIPE_CONFIG } from "../../lib/stripe";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionData {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  plan: string;
  stripe_customer_id: string;
}

export function SubscriptionManager({
  isOpen,
  onClose,
}: SubscriptionManagerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "billing">(
    "overview"
  );
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const { profile, updateProfile } = useProfile();

  useEffect(() => {
    if (isOpen && profile) {
      loadSubscriptionData();
      loadUsageData();
    }
  }, [isOpen, profile]);

  const loadSubscriptionData = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", profile.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setSubscription(data);
    } catch (error: any) {
      console.error("Failed to load subscription:", error);
    }
  };

  const loadUsageData = async () => {
    if (!profile) return;

    try {
      // Get current month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: chatbots } = await supabase
        .from("chatbots")
        .select("id")
        .eq("user_id", profile.id);

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .in("chatbot_id", chatbots?.map((c) => c.id) || [])
        .gte("created_at", startOfMonth.toISOString());

      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .in("conversation_id", conversations?.map((c) => c.id) || [])
        .gte("created_at", startOfMonth.toISOString());

      setUsageData({
        chatbots: chatbots?.length || 0,
        conversations: conversations?.length || 0,
        messages: messages?.length || 0,
      });
    } catch (error: any) {
      console.error("Failed to load usage data:", error);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error("No billing information found");
      return;
    }

    setIsLoading(true);
    try {
      await stripeService.createPortalSession(subscription.stripe_customer_id);
    } catch (error: any) {
      toast.error("Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (newPlanId: string) => {
    if (!profile) return;

    try {
      await updateProfile({ plan: newPlanId as any });
      toast.success("Plan updated successfully!");
      setActiveTab("overview");
      loadSubscriptionData();
    } catch (error: any) {
      toast.error("Failed to update plan");
    }
  };

  const downloadInvoice = async () => {
    // This would typically call your backend to generate/fetch invoice
    toast.info("Invoice download feature coming soon!");
  };

  const getCurrentPlan = () => {
    return STRIPE_CONFIG.plans[
      profile?.plan as keyof typeof STRIPE_CONFIG.plans
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "past_due":
        return "text-yellow-600 bg-yellow-100";
      case "canceled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: CreditCard },
    { id: "plans", name: "Plans", icon: Settings },
    { id: "billing", name: "Billing", icon: Calendar },
  ];

  if (!profile) return null;

  const currentPlan = getCurrentPlan();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscription Management"
      size="xl"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Current Plan */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Current Plan
                </h3>
                {subscription && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {subscription.status}
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentPlan?.name} Plan
                  </h4>
                  <p className="text-gray-600 mb-4">
                    ${currentPlan?.price}/month
                  </p>

                  {subscription && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Next billing:{" "}
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setActiveTab("plans")}
                    variant="outline"
                    className="w-full"
                  >
                    Change Plan
                  </Button>
                  {subscription?.stripe_customer_id && (
                    <Button
                      onClick={handleManageBilling}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Usage Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Usage This Month
                </h3>
                <Button onClick={loadUsageData} variant="ghost" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Chatbots */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Chatbots
                    </span>
                    <span className="text-sm text-gray-600">
                      {usageData?.chatbots || 0} /{" "}
                      {currentPlan?.limits.chatbots === -1
                        ? "∞"
                        : currentPlan?.limits.chatbots}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${getUsagePercentage(
                          usageData?.chatbots || 0,
                          currentPlan?.limits.chatbots || 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Messages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Messages
                    </span>
                    <span className="text-sm text-gray-600">
                      {profile.messages_used} /{" "}
                      {currentPlan?.limits.messages === -1
                        ? "∞"
                        : currentPlan?.limits.messages.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${getUsagePercentage(
                          profile.messages_used,
                          currentPlan?.limits.messages || 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Conversations
                    </span>
                    <span className="text-sm text-gray-600">
                      {usageData?.conversations || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Plan Features */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plan Features
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {currentPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alerts */}
            {profile.messages_used / profile.message_quota > 0.8 && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-900">
                      Usage Warning
                    </h4>
                    <p className="text-yellow-800 text-sm">
                      You've used{" "}
                      {Math.round(
                        (profile.messages_used / profile.message_quota) * 100
                      )}
                      % of your monthly message quota. Consider upgrading to
                      avoid service interruption.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "plans" && (
          <div>
            <PricingPlans
              onPlanSelect={handlePlanChange}
              currentPlan={profile.plan}
              showCurrentPlan={true}
            />
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Billing Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Billing Information
              </h3>

              {subscription ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan
                      </label>
                      <p className="text-gray-900">{currentPlan?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <p className="text-gray-900">
                        ${currentPlan?.price}/month
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Next Billing Date
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <Button onClick={handleManageBilling} disabled={isLoading}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Payment Methods
                    </Button>
                    <Button onClick={downloadInvoice} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Billing Information
                  </h4>
                  <p className="text-gray-600 mb-4">
                    You're currently on the free plan. Upgrade to access premium
                    features.
                  </p>
                  <Button onClick={() => setActiveTab("plans")}>
                    View Plans
                  </Button>
                </div>
              )}
            </Card>

            {/* Billing History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Billing History
              </h3>

              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Billing history will appear here once you have a paid
                  subscription.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Modal>
  );
}
