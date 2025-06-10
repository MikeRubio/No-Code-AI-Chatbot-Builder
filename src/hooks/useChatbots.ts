import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

export interface Chatbot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  flow_data: any;
  settings: any;
  is_active: boolean;
  is_published: boolean;
  whatsapp_phone_number: string | null;
  whatsapp_webhook_url: string | null;
  openai_model: string;
  fallback_message: string;
  created_at: string;
  updated_at: string;
}

export function useChatbots() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const chatbotsQuery = useQuery({
    queryKey: ["chatbots", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Chatbot[];
    },
    enabled: !!user,
  });

  const createChatbotMutation = useMutation({
    mutationFn: async (chatbot: Partial<Chatbot>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("chatbots")
        .insert({
          user_id: user.id,
          name: chatbot.name || "New Chatbot",
          description: chatbot.description,
          flow_data: chatbot.flow_data || { nodes: [], connections: [] },
          settings: chatbot.settings || {},
          openai_model: "gpt-3.5-turbo",
          fallback_message:
            "I'm sorry, I didn't understand that. Can you please rephrase?",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Chatbot created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create chatbot");
    },
  });

  const updateChatbotMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Chatbot>;
    }) => {
      const { data, error } = await supabase
        .from("chatbots")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Chatbot updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update chatbot");
    },
  });

  const deleteChatbotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatbots").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Chatbot deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete chatbot");
    },
  });

  const publishChatbotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("chatbots")
        .update({ is_published: true, is_active: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Chatbot published successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to publish chatbot");
    },
  });

  return {
    chatbots: chatbotsQuery.data || [],
    isLoading: chatbotsQuery.isLoading,
    error: chatbotsQuery.error,
    createChatbot: createChatbotMutation.mutate,
    createChatbotAsync: createChatbotMutation.mutateAsync,
    updateChatbot: updateChatbotMutation.mutate,
    deleteChatbot: deleteChatbotMutation.mutate,
    publishChatbot: publishChatbotMutation.mutate,
    isCreating: createChatbotMutation.isPending,
    isUpdating: updateChatbotMutation.isPending,
    isDeleting: deleteChatbotMutation.isPending,
    isPublishing: publishChatbotMutation.isPending,
  };
}
