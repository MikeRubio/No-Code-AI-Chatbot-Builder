import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSubscriptionSync } from '../../hooks/useSubscriptionSync';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function SubscriptionSuccessHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { syncSubscriptionFromStripe } = useSubscriptionSync();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success === 'true' && sessionId && !isProcessing) {
      handlePaymentSuccess(sessionId);
    } else if (canceled === 'true') {
      handlePaymentCanceled();
    }
  }, [searchParams, isProcessing]);

  const handlePaymentSuccess = async (sessionId: string) => {
    setIsProcessing(true);
    
    try {
      // Show immediate success message
      toast.success('Payment successful! Updating your subscription...');

      // Wait a moment for Stripe webhook to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Sync subscription data
      await syncSubscriptionFromStripe(sessionId);

      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });

      // Show final success message
      toast.success('Subscription updated successfully! Welcome to your new plan!');

      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('success');
      newSearchParams.delete('session_id');
      setSearchParams(newSearchParams);

    } catch (error: any) {
      console.error('Error processing payment success:', error);
      toast.error('Payment was successful, but there was an issue updating your subscription. Please contact support if this persists.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCanceled = () => {
    toast.error('Payment was canceled. You can try again anytime.');
    
    // Clean up URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('canceled');
    setSearchParams(newSearchParams);
  };

  // Don't render anything - this is just a handler component
  return null;
}