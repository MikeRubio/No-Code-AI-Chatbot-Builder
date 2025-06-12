import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useSubscriptionSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const syncSubscriptionFromStripe = useCallback(async (sessionId?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      console.log('Syncing subscription for user:', user.email, 'with session:', sessionId);
      
      // Call our sync function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          sessionId: sessionId
        }),
      });

      console.log('Sync response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.error || 'Failed to sync subscription');
      }

      const result = await response.json();
      console.log('Sync result:', result);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      
      return result;
    } catch (error: any) {
      console.error('Subscription sync error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, queryClient]);

  return {
    syncSubscriptionFromStripe,
    isLoading
  };
}