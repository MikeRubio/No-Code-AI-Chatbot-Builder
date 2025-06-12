import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSubscriptionSync } from '../../hooks/useSubscriptionSync';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export function SubscriptionSuccessHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { syncSubscriptionFromStripe, isLoading } = useSubscriptionSync();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    // Handle canceled payment immediately (no auth required)
    if (canceled === 'true') {
      toast.error('Payment was canceled. You can try again anytime.');
      setSearchParams(new URLSearchParams());
      return;
    }

    // Only proceed with success handling if user is authenticated
    if (success === 'true' && sessionId && user && !authLoading) {
      handleSubscriptionSuccess(sessionId);
    }
  }, [searchParams, setSearchParams, user, authLoading]);

  const handleSubscriptionSuccess = async (sessionId: string) => {
    try {
      console.log('Processing successful subscription with session ID:', sessionId);
      
      // Show loading toast
      const loadingToast = toast.loading('Processing your subscription...');
      
      // Sync subscription data from Stripe
      await syncSubscriptionFromStripe(sessionId);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success message
      toast.success('🎉 Subscription activated successfully! Welcome to your new plan!', {
        duration: 5000,
      });
      
      // Clean up URL parameters
      setSearchParams(new URLSearchParams());
      
      // Reload the page to ensure all data is fresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Subscription sync error:', error);
      toast.error(
        error.message || 'There was an issue processing your subscription. Please contact support if this persists.'
      );
      
      // Clean up URL even on error
      setSearchParams(new URLSearchParams());
    }
  };

  // Don't render anything visible
  return null;
}