import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Facebook, 
  Send, 
  Smartphone, 
  Globe, 
  CheckCircle, 
  ExternalLink,
  Settings,
  Plus,
  Trash2,
  Copy,
  Code
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FacebookMessengerSetup } from './FacebookMessengerSetup';
import { WhatsAppBusinessSetup } from './WhatsAppBusinessSetup';
import toast from 'react-hot-toast';

interface MultiChannelSetupProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Channel {
  id: string;
  channel_type: string;
  channel_config: any;
  is_active: boolean;
  deployment_url?: string;
  sync_status: string;
  error_message?: string;
}

const channelTypes = [
  {
    type: 'web',
    name: 'Website Widget',
    icon: Globe,
    color: 'from-blue-500 to-blue-600',
    description: 'Embed chatbot on your website',
    free: true
  },
  {
    type: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageCircle,
    color: 'from-green-500 to-green-600',
    description: 'Connect via WhatsApp Business API (No Twilio needed)',
    free: false
  },
  {
    type: 'facebook',
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'from-blue-600 to-blue-700',
    description: 'Deploy to Facebook Messenger',
    free: false
  },
  {
    type: 'telegram',
    name: 'Telegram Bot',
    icon: Send,
    color: 'from-sky-500 to-sky-600',
    description: 'Create a Telegram bot',
    free: false
  },
  {
    type: 'sms',
    name: 'SMS/Text',
    icon: Smartphone,
    color: 'from-purple-500 to-purple-600',
    description: 'SMS-based conversations',
    free: false
  }
];

export function MultiChannelSetup({ chatbotId, isOpen, onClose }: MultiChannelSetupProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChannelConfig, setShowChannelConfig] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showFacebookSetup, setShowFacebookSetup] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadChannels();
    }
  }, [isOpen, chatbotId]);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_channels')
        .select('*')
        .eq('chatbot_id', chatbotId);

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      toast.error('Failed to load channels: ' + error.message);
    }
  };

  const addChannel = async (channelType: string) => {
    if (!user) {
      toast.error('You must be logged in to add channels');
      return;
    }

    // Handle special setup flows
    if (channelType === 'facebook') {
      setShowFacebookSetup(true);
      return;
    }

    if (channelType === 'whatsapp') {
      setShowWhatsAppSetup(true);
      return;
    }

    setIsLoading(true);
    try {
      const channelConfig = getDefaultConfig(channelType);
      
      const { data, error } = await supabase
        .from('deployment_channels')
        .insert({
          chatbot_id: chatbotId,
          channel_type: channelType,
          channel_config: channelConfig,
          is_active: false,
          sync_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setChannels(prev => [...prev, data]);
      setSelectedChannel(data.id);
      setShowChannelConfig(true);
      toast.success('Channel added successfully!');
    } catch (error: any) {
      toast.error('Failed to add channel: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChannel = async (channelId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('deployment_channels')
        .update(updates)
        .eq('id', channelId);

      if (error) throw error;

      setChannels(prev => prev.map(ch => 
        ch.id === channelId ? { ...ch, ...updates } : ch
      ));
      
      toast.success('Channel updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update channel: ' + error.message);
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const { error } = await supabase
        .from('deployment_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      setChannels(prev => prev.filter(ch => ch.id !== channelId));
      toast.success('Channel deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete channel: ' + error.message);
    }
  };

  const deployChannel = async (channelId: string) => {
    setIsLoading(true);
    try {
      // Update sync status to syncing
      await updateChannel(channelId, { sync_status: 'syncing' });

      // Check if environment variables are configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
        throw new Error('Supabase environment variables are not configured. Please check your .env file.');
      }

      // Call deployment function
      const response = await fetch(`${supabaseUrl}/functions/v1/deploy-channel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      await updateChannel(channelId, { 
        sync_status: 'synced',
        deployment_url: result.deploymentUrl,
        is_active: true
      });

      toast.success('Channel deployed successfully!');
    } catch (error: any) {
      console.error('Deployment error:', error);
      await updateChannel(channelId, { 
        sync_status: 'error',
        error_message: error.message
      });
      
      if (error.message.includes('environment variables')) {
        toast.error('Configuration Error: ' + error.message);
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Network Error: Unable to connect to deployment service. Please check your internet connection and Supabase configuration.');
      } else {
        toast.error('Deployment failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultConfig = (channelType: string) => {
    switch (channelType) {
      case 'web':
        return {
          widget_position: 'bottom-right',
          widget_color: '#3B82F6',
          welcome_message: 'Hello! How can I help you?',
          placeholder_text: 'Type your message...'
        };
      case 'telegram':
        return {
          bot_token: '',
          webhook_url: ''
        };
      case 'sms':
        return {
          twilio_sid: '',
          twilio_token: '',
          phone_number: ''
        };
      default:
        return {};
    }
  };

  const getChannelIcon = (type: string) => {
    const channel = channelTypes.find(ch => ch.type === type);
    return channel?.icon || Globe;
  };

  const getChannelColor = (type: string) => {
    const channel = channelTypes.find(ch => ch.type === type);
    return channel?.color || 'from-gray-500 to-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'syncing': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyEmbedCode = (channel: Channel) => {
    const embedCode = channel.channel_config?.embed_code;
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      toast.success('Embed code copied to clipboard!');
    } else {
      toast.error('Embed code not available. Please deploy the channel first.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Multi-Channel Deployment"
      size="xl"
    >
      <div className="space-y-6">
        {/* Available Channels */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Channels</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelTypes.map((channelType) => {
              const isAdded = channels.some(ch => ch.channel_type === channelType.type);
              const Icon = channelType.icon;
              
              return (
                <Card key={channelType.type} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${channelType.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {!channelType.free && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Pro
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{channelType.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{channelType.description}</p>
                  
                  {isAdded ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Added
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => addChannel(channelType.type)}
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Channel
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Configured Channels */}
        {channels.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configured Channels</h3>
            <div className="space-y-4">
              {channels.map((channel) => {
                const Icon = getChannelIcon(channel.channel_type);
                const colorClass = getChannelColor(channel.channel_type);
                const statusClass = getStatusColor(channel.sync_status);
                
                return (
                  <Card key={channel.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {channelTypes.find(ct => ct.type === channel.channel_type)?.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
                              {channel.sync_status}
                            </span>
                            {channel.is_active && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {channel.channel_type === 'web' && channel.sync_status === 'synced' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyEmbedCode(channel)}
                            title="Copy embed code"
                          >
                            <Code className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {channel.deployment_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(channel.deployment_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (channel.channel_type === 'facebook') {
                              setShowFacebookSetup(true);
                            } else if (channel.channel_type === 'whatsapp') {
                              setShowWhatsAppSetup(true);
                            } else {
                              setSelectedChannel(channel.id);
                              setShowChannelConfig(true);
                            }
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        
                        {channel.sync_status === 'pending' || channel.sync_status === 'error' ? (
                          <Button
                            size="sm"
                            onClick={() => deployChannel(channel.id)}
                            disabled={isLoading}
                          >
                            Deploy
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteChannel(channel.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {channel.error_message && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{channel.error_message}</p>
                        {channel.error_message.includes('environment variables') && (
                          <p className="text-xs text-red-600 mt-1">
                            Please configure your Supabase URL and API key in the .env file
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Channel Configuration Modal */}
        {showChannelConfig && selectedChannel && (
          <ChannelConfigModal
            channel={channels.find(ch => ch.id === selectedChannel)!}
            onUpdate={(updates) => updateChannel(selectedChannel, updates)}
            onClose={() => {
              setShowChannelConfig(false);
              setSelectedChannel(null);
            }}
          />
        )}

        {/* Facebook Messenger Setup Modal */}
        <FacebookMessengerSetup
          chatbotId={chatbotId}
          isOpen={showFacebookSetup}
          onClose={() => {
            setShowFacebookSetup(false);
            loadChannels(); // Reload channels after Facebook setup
          }}
        />

        {/* WhatsApp Business Setup Modal */}
        <WhatsAppBusinessSetup
          chatbotId={chatbotId}
          isOpen={showWhatsAppSetup}
          onClose={() => {
            setShowWhatsAppSetup(false);
            loadChannels(); // Reload channels after WhatsApp setup
          }}
        />
      </div>
    </Modal>
  );
}

interface ChannelConfigModalProps {
  channel: Channel;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

function ChannelConfigModal({ channel, onUpdate, onClose }: ChannelConfigModalProps) {
  const [config, setConfig] = useState(channel.channel_config);

  const handleSave = () => {
    onUpdate({ channel_config: config });
    onClose();
  };

  const renderConfigFields = () => {
    switch (channel.channel_type) {
      case 'web':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Position
              </label>
              <select
                value={config.widget_position}
                onChange={(e) => setConfig(prev => ({ ...prev, widget_position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Color
              </label>
              <input
                type="color"
                value={config.widget_color}
                onChange={(e) => setConfig(prev => ({ ...prev, widget_color: e.target.value }))}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Message
              </label>
              <input
                type="text"
                value={config.welcome_message}
                onChange={(e) => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={config.placeholder_text}
                onChange={(e) => setConfig(prev => ({ ...prev, placeholder_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
        
      case 'telegram':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="password"
                value={config.bot_token}
                onChange={(e) => setConfig(prev => ({ ...prev, bot_token: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Configuration options for this channel will be available soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Configure {channelTypes.find(ct => ct.type === channel.channel_type)?.name}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          
          {renderConfigFields()}
          
          <div className="flex space-x-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Configuration
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}