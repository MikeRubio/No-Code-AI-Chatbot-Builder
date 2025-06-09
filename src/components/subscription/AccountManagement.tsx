import { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useSubscriptionSync } from "../../hooks/useSubscriptionSync";
import { supabase } from "../../lib/supabase";
import { stripeService } from "../../lib/stripe";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export function AccountManagement() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { syncSubscriptionFromStripe } = useSubscriptionSync();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading subscription:", error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSubscription = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      await syncSubscriptionFromStripe();
      await loadSubscription();
      toast.success("Subscription synced successfully!");
    } catch (error: any) {
      toast.error("Failed to sync subscription: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error("No billing information found. Please contact support.");
      return;
    }

    setIsProcessing(true);
    try {
      await stripeService.createPortalSession(subscription.stripe_customer_id);
    } catch (error: any) {
      console.error("Error opening billing portal:", error);
      toast.error("Error opening billing portal: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
            reason: cancelReason,
            feedback: cancelFeedback,
            cancelAtPeriodEnd: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      await loadSubscription();
      setShowCancelModal(false);
      setCancelReason("");
      setCancelFeedback("");
      toast.success(
        "Subscription cancelled successfully. You'll retain access until the end of your billing period."
      );
    } catch (error: any) {
      toast.error("Failed to cancel subscription: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/reactivate-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reactivate subscription");
      }

      await loadSubscription();
      setShowReactivateModal(false);
      toast.success("Subscription reactivated successfully!");
    } catch (error: any) {
      toast.error("Failed to reactivate subscription: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmEmail !== user.email) {
      toast.error("Email confirmation does not match");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            confirmEmail: user.email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      toast.success(
        "Account deleted successfully. You will be logged out shortly."
      );

      // Sign out after a brief delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return "text-orange-600 bg-orange-100 border-orange-200";
    }

    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 border-green-200";
      case "canceled":
        return "text-red-600 bg-red-100 border-red-200";
      case "past_due":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "unpaid":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusText = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return "Cancelled (Active until period end)";
    }

    switch (status) {
      case "active":
        return "Active";
      case "canceled":
        return "Cancelled";
      case "past_due":
        return "Past Due";
      case "unpaid":
        return "Unpaid";
      default:
        return status;
    }
  };

  const hasBillingAccess = subscription?.stripe_customer_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Account Management
          </h1>
          <p className="text-gray-600">
            Manage your subscription, billing, and account settings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSyncSubscription}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Sync Account
        </Button>
      </div>

      {/* Account Overview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Account Overview
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Profile Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium">
                  {profile?.full_name || "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium">
                  {profile?.created_at
                    ? format(parseISO(profile.created_at), "MMM d, yyyy")
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Usage Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages Used:</span>
                <span className="font-medium">
                  {profile?.messages_used || 0} /{" "}
                  {profile?.message_quota === -1
                    ? "∞"
                    : profile?.message_quota || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium capitalize">
                  {profile?.plan || "Free"}
                </span>
              </div>
              {profile?.quota_reset_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Quota Resets:</span>
                  <span className="font-medium">
                    {format(parseISO(profile.quota_reset_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Management */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Subscription Management
        </h2>

        {subscription ? (
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                      subscription.status,
                      subscription.cancel_at_period_end
                    )}`}
                  >
                    {getStatusText(
                      subscription.status,
                      subscription.cancel_at_period_end
                    )}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 capitalize">
                    {subscription.plan} Plan
                  </span>
                </div>

                {/* Cancellation Notice */}
                {subscription.cancel_at_period_end &&
                  subscription.current_period_end && (
                    <div className="flex items-center space-x-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 mt-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Your subscription will end on{" "}
                        {format(
                          parseISO(subscription.current_period_end),
                          "MMMM d, yyyy"
                        )}
                      </span>
                    </div>
                  )}

                {/* Active Period Info */}
                {subscription.current_period_start &&
                  subscription.current_period_end &&
                  !subscription.cancel_at_period_end && (
                    <div className="text-sm text-gray-600 mt-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Current period:{" "}
                      {format(
                        parseISO(subscription.current_period_start),
                        "MMM d"
                      )}{" "}
                      -{" "}
                      {format(
                        parseISO(subscription.current_period_end),
                        "MMM d, yyyy"
                      )}
                    </div>
                  )}

                {/* Cancelled Date */}
                {subscription.canceled_at && (
                  <div className="text-sm text-gray-600 mt-2">
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Cancelled on:{" "}
                    {format(parseISO(subscription.canceled_at), "MMM d, yyyy")}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {hasBillingAccess && (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isProcessing}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                )}

                {subscription.cancel_at_period_end ? (
                  <Button
                    onClick={() => setShowReactivateModal(true)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate
                  </Button>
                ) : (
                  subscription.status === "active" && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelModal(true)}
                      disabled={isProcessing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Subscription Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Billing Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer ID:</span>
                    <span className="font-mono text-xs">
                      {subscription.stripe_customer_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription ID:</span>
                    <span className="font-mono text-xs">
                      {subscription.stripe_subscription_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>
                      {format(parseISO(subscription.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Plan Features
                </h3>
                <div className="space-y-2 text-sm">
                  {subscription.plan === "pro" && (
                    <>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />5 chatbots
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        5,000 messages/month
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        AI-powered responses
                      </div>
                    </>
                  )}
                  {subscription.plan === "enterprise" && (
                    <>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unlimited chatbots
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unlimited messages
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Advanced AI features
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-600 mb-4">
              You're currently on the free plan
            </p>
            <Button onClick={() => (window.location.href = "/settings")}>
              Upgrade Plan
            </Button>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to cancel?
            </h3>
            <p className="text-gray-600">
              Your subscription will remain active until the end of your current
              billing period.
              {subscription?.current_period_end && (
                <span className="block mt-2 font-medium">
                  Access until:{" "}
                  {format(
                    parseISO(subscription.current_period_end),
                    "MMMM d, yyyy"
                  )}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancelling (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                <option value="too_expensive">Too expensive</option>
                <option value="not_using">Not using enough</option>
                <option value="missing_features">Missing features</option>
                <option value="found_alternative">Found alternative</option>
                <option value="temporary">Temporary cancellation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional feedback (optional)
              </label>
              <textarea
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Help us improve by sharing your feedback..."
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reactivate Subscription Modal */}
      <Modal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        title="Reactivate Subscription"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reactivate Your Subscription
            </h3>
            <p className="text-gray-600">
              Your subscription will continue with the same plan and billing
              cycle. You'll be charged at the next billing date.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowReactivateModal(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReactivateSubscription}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Reactivating..." : "Reactivate Subscription"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Your Account
            </h3>
            <p className="text-red-600 font-medium mb-2">
              This action cannot be undone!
            </p>
            <p className="text-gray-600">
              This will permanently delete your account, all chatbots,
              conversations, and associated data. Your subscription will also be
              cancelled.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type your email address to confirm:{" "}
              <span className="font-mono">{user?.email}</span>
            </label>
            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your email address"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmEmail("");
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isProcessing || deleteConfirmEmail !== user?.email}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
