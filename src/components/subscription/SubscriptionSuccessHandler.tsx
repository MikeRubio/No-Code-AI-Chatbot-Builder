import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useSubscriptionSync } from "../../hooks/useSubscriptionSync";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export function SubscriptionSuccessHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { syncSubscriptionFromStripe, isLoading } = useSubscriptionSync();
  const { profile, isLoading: profileLoading } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const [syncStatus, setSyncStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [retryCount, setRetryCount] = useState(0);

  const success = searchParams.get("success");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Only proceed if user is authenticated and auth loading is complete
    if (success === "true" && sessionId && user && !authLoading) {
      handleSubscriptionSync();
    }
  }, [success, sessionId, user, authLoading]);

  const handleSubscriptionSync = async () => {
    // Double-check authentication before proceeding
    if (!user) {
      setSyncStatus("error");
      toast.error("Please log in to complete subscription setup");
      return;
    }

    try {
      setSyncStatus("pending");
      await syncSubscriptionFromStripe(sessionId || undefined);
      setSyncStatus("success");
      toast.success("Subscription activated successfully!");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error: any) {
      console.error("Sync error:", error);
      setSyncStatus("error");
      toast.error("Failed to sync subscription. Please try again.");
    }
  };

  const handleRetry = async () => {
    setRetryCount((prev) => prev + 1);
    await handleSubscriptionSync();
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Don't render if missing required params or still loading auth
  if (!success || !sessionId || authLoading) {
    return null;
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please log in to complete your subscription setup.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          {syncStatus === "pending" && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Activating Your Subscription
              </h3>
              <p className="text-gray-600 mb-4">
                Please wait while we set up your account with the new plan...
              </p>
              <div className="text-sm text-gray-500">
                This usually takes just a few seconds
              </div>
            </>
          )}

          {syncStatus === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🎉 Subscription Activated!
              </h3>
              <p className="text-gray-600 mb-4">
                Your account has been successfully upgraded. You now have access
                to all premium features.
              </p>
              {profile && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-green-800">
                    <div className="font-medium">
                      Current Plan:{" "}
                      {profile.plan.charAt(0).toUpperCase() +
                        profile.plan.slice(1)}
                    </div>
                    <div>
                      Message Quota:{" "}
                      {profile.message_quota === -1
                        ? "Unlimited"
                        : profile.message_quota.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in a few seconds...
              </p>
            </>
          )}

          {syncStatus === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sync Issue Detected
              </h3>
              <p className="text-gray-600 mb-4">
                Your payment was successful, but we're having trouble updating
                your account. Don't worry - your subscription is active.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Try Again {retryCount > 0 && `(${retryCount})`}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleManualRefresh}
                  className="w-full"
                >
                  Refresh Page
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Continue to Dashboard
                </Button>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  If the issue persists, please contact support with session ID:
                  <br />
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    {sessionId}
                  </code>
                </p>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
