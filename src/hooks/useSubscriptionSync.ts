import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function useSubscriptionSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const syncSubscriptionFromStripe = useCallback(
    async (sessionId?: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        // Call our sync function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userEmail: user.email,
              sessionId: sessionId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to sync subscription");
        }

        const result = await response.json();

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });

        return result;
      } catch (error: any) {
        console.error("Subscription sync error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, queryClient]
  );

  return {
    syncSubscriptionFromStripe,
    isLoading,
  };
}
