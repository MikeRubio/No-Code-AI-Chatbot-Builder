import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  MessageCircle,
  Facebook,
  Send,
  Smartphone,
  Plus,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { WebsiteWidget } from "./WebsiteWidget";
import { WhatsAppSetup } from "./WhatsAppSetup";
import { FacebookMessengerSetup } from "./FacebookMessengerSetup";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { useProfile } from "../../hooks/useProfile";

interface MultiChannelSetupProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DeploymentChannel {
  id: string;
  channel_type: string;
  channel_config: any;
  is_active: boolean;
  deployment_url: string | null;
  webhook_url: string | null;
  last_sync_at: string | null;
  sync_status: "pending" | "syncing" | "synced" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const channels = [
  {
    id: "web",
    name: "Website Widget",
    description: "Embed on your website with modern framework support",
    icon: Globe,
    color: "from-blue-500 to-blue-600",
    features: [
      "React/Vue/Angular support",
      "Customizable appearance",
      "Mobile responsive",
      "Easy integration",
    ],
    setupComponent: "WebsiteWidget",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Connect with customers on WhatsApp",
    icon: MessageCircle,
    color: "from-green-500 to-green-600",
    features: [
      "Business API integration",
      "Rich media support",
      "Template messages",
      "Global reach",
    ],
    setupComponent: "WhatsAppSetup",
    requiresPro: true,
  },
  {
    id: "facebook",
    name: "Facebook Messenger",
    description: "Engage users on Facebook and Instagram",
    icon: Facebook,
    color: "from-blue-600 to-purple-600",
    features: [
      "Messenger integration",
      "Instagram DMs",
      "Rich interactions",
      "Social commerce",
    ],
    setupComponent: "FacebookMessengerSetup",
    requiresPro: true,
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Deploy on Telegram with bot API",
    icon: Send,
    color: "from-cyan-500 to-blue-500",
    features: [
      "Bot API integration",
      "Group chat support",
      "Inline keyboards",
      "File sharing",
    ],
    setupComponent: null,
    requiresPro: true,
    comingSoon: true,
  },
  {
    id: "sms",
    name: "SMS",
    description: "Text message conversations via Twilio",
    icon: Smartphone,
    color: "from-purple-500 to-pink-500",
    features: [
      "Twilio integration",
      "Global SMS delivery",
      "Two-way messaging",
      "Shortcode support",
    ],
    setupComponent: null,
    requiresPro: true,
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Internal team communication bot",
    icon: MessageCircle,
    color: "from-purple-600 to-indigo-600",
    features: [
      "Slack app integration",
      "Workspace deployment",
      "Slash commands",
      "Thread support",
    ],
    setupComponent: null,
    requiresPro: true,
    comingSoon: true,
  },
];

export function MultiChannelSetup({
  chatbotId,
  isOpen,
  onClose,
}: MultiChannelSetupProps) {
  const [deployments, setDeployments] = useState<DeploymentChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showChannelSetup, setShowChannelSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useProfile();

  const loadDeployments = async () => {
    try {
      const { data, error } = await supabase
        .from("deployment_channels")
        .select("*")
        .eq("chatbot_id", chatbotId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeployments(data || []);
    } catch (error) {
      console.error("Failed to load deployments:", error);
      toast.error("Failed to load deployment channels");
    }
  };

  const handleChannelSetup = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    if (channel?.comingSoon) {
      toast.success("This channel is coming soon! Stay tuned for updates.");
      return;
    }

    setSelectedChannel(channelId);
    setShowChannelSetup(true);
  };

  useEffect(() => {
    if (isOpen) {
      loadDeployments();
    }
  }, [isOpen, chatbotId]);

  const toggleChannelStatus = async (
    deploymentId: string,
    isActive: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("deployment_channels")
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deploymentId);

      if (error) throw error;

      setDeployments((prev) =>
        prev.map((dep) =>
          dep.id === deploymentId ? { ...dep, is_active: !isActive } : dep
        )
      );

      toast.success(
        `Channel ${!isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Failed to toggle channel status:", error);
      toast.error("Failed to update channel status");
    }
  };

  const deleteDeployment = async (deploymentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this deployment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("deployment_channels")
        .delete()
        .eq("id", deploymentId);

      if (error) throw error;

      setDeployments((prev) => prev.filter((dep) => dep.id !== deploymentId));
      toast.success("Deployment deleted successfully");
    } catch (error) {
      console.error("Failed to delete deployment:", error);
      toast.error("Failed to delete deployment");
    }
  };

  const syncDeployment = async (deploymentId: string) => {
    try {
      setIsLoading(true);

      // Update sync status to syncing
      await supabase
        .from("deployment_channels")
        .update({
          sync_status: "syncing",
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", deploymentId);

      // Simulate sync process (in real implementation, this would call the respective API)
      setTimeout(async () => {
        await supabase
          .from("deployment_channels")
          .update({
            sync_status: "synced",
            error_message: null,
          })
          .eq("id", deploymentId);

        loadDeployments();
        toast.success("Deployment synced successfully");
      }, 2000);
    } catch (error) {
      console.error("Failed to sync deployment:", error);
      toast.error("Failed to sync deployment");
    } finally {
      setIsLoading(false);
    }
  };

  const getChannelIcon = (channelType: string) => {
    const channel = channels.find((c) => c.id === channelType);
    return channel?.icon || Globe;
  };

  const getChannelColor = (channelType: string) => {
    const channel = channels.find((c) => c.id === channelType);
    return channel?.color || "from-gray-500 to-gray-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "text-green-600 bg-green-100";
      case "syncing":
        return "text-blue-600 bg-blue-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getDeployedChannels = () => {
    return deployments.map((dep) => dep.channel_type);
  };

  const getAvailableChannels = () => {
    const deployedChannels = getDeployedChannels();
    return channels.filter((channel) => !deployedChannels.includes(channel.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Multi-Channel Deployment
            </h2>
            <p className="text-gray-600">
              Deploy your chatbot across multiple platforms and channels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Active Deployments */}
          {deployments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active Deployments
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {deployments.map((deployment) => {
                  const IconComponent = getChannelIcon(deployment.channel_type);
                  const channel = channels.find(
                    (c) => c.id === deployment.channel_type
                  );

                  return (
                    <Card key={deployment.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${getChannelColor(
                              deployment.channel_type
                            )} rounded-lg flex items-center justify-center`}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {channel?.name}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                                  deployment.sync_status
                                )}`}
                              >
                                {deployment.sync_status}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  deployment.is_active
                                    ? "text-green-600 bg-green-100"
                                    : "text-gray-600 bg-gray-100"
                                }`}
                              >
                                {deployment.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => syncDeployment(deployment.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${
                                isLoading ? "animate-spin" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleChannelStatus(
                                deployment.id,
                                deployment.is_active
                              )
                            }
                          >
                            {deployment.is_active ? (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDeployment(deployment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {deployment.deployment_url && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-600 mb-1">
                            Deployment URL:
                          </p>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                              {deployment.deployment_url}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  deployment.deployment_url!
                                )
                              }
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {deployment.error_message && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {deployment.error_message}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        Last synced:{" "}
                        {deployment.last_sync_at
                          ? new Date(deployment.last_sync_at).toLocaleString()
                          : "Never"}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Channels */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Channels
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAvailableChannels().map((channel) => {
                const IconComponent = channel.icon;

                return (
                  <Card key={channel.id} hover className="p-6">
                    <div className="flex items-center mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${channel.color} rounded-xl flex items-center justify-center mr-4`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {channel.name}
                          </h4>
                          {channel.requiresPro && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              Pro
                            </span>
                          )}
                          {channel.comingSoon && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {channel.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      {channel.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleChannelSetup(channel.id)}
                      disabled={
                        channel.comingSoon ||
                        (channel.requiresPro && profile?.plan === "free")
                      }
                      className="w-full"
                    >
                      {channel.comingSoon ? (
                        "Coming Soon"
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Setup Channel
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {deployments.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Deployments Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Deploy your chatbot across multiple channels to reach your
                audience wherever they are.
              </p>
              <Button onClick={() => handleChannelSetup("web")}>
                <Plus className="w-4 h-4 mr-2" />
                Deploy Your First Channel
              </Button>
            </div>
          )}
        </div>

        {/* Channel Setup Modals */}
        {showChannelSetup && selectedChannel === "web" && (
          <WebsiteWidget
            chatbotId={chatbotId}
            isOpen={showChannelSetup}
            onClose={() => {
              setShowChannelSetup(false);
              setSelectedChannel(null);
              loadDeployments();
            }}
          />
        )}

        {showChannelSetup && selectedChannel === "whatsapp" && (
          <WhatsAppSetup
            chatbotId={chatbotId}
            isOpen={showChannelSetup}
            onClose={() => {
              setShowChannelSetup(false);
              setSelectedChannel(null);
              loadDeployments();
            }}
          />
        )}

        {showChannelSetup && selectedChannel === "facebook" && (
          <FacebookMessengerSetup
            chatbotId={chatbotId}
            isOpen={showChannelSetup}
            onClose={() => {
              setShowChannelSetup(false);
              setSelectedChannel(null);
              loadDeployments();
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
