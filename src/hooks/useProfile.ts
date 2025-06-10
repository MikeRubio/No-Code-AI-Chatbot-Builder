import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_id: string | null;
  subscription_status: string;
  message_quota: number;
  messages_used: number;
  quota_reset_date: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || null,
              plan: 'free',
              message_quota: 100,
              messages_used: 0,
              quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              onboarding_completed: false,
            })
            .select()
            .single();

          if (createError) throw createError;
          return newProfile as Profile;
        }
        throw error;
      }
      
      let profile = data as Profile;

      // If user has a subscription_id, fetch the stripe_customer_id from subscriptions table
      if (profile.subscription_id) {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', user.id)
          .single();

        if (!subscriptionError && subscriptionData) {
          profile.stripe_customer_id = subscriptionData.stripe_customer_id;
        }
      }
      
      return profile;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const incrementMessageUsage = async () => {
    if (!user || !profileQuery.data) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        messages_used: profileQuery.data.messages_used + 1 
      })
      .eq('id', user.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  };

  const canSendMessage = () => {
    if (!profileQuery.data) return false;
    return profileQuery.data.messages_used < profileQuery.data.message_quota;
  };

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutate,
    completeOnboarding: completeOnboardingMutation.mutate,
    incrementMessageUsage,
    canSendMessage,
    isUpdating: updateProfileMutation.isPending,
  };
}