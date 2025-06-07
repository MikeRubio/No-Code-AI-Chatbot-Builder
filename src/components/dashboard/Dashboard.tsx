import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageCircle, Users, TrendingUp, Plus, Settings, BarChart3, Crown } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { useChatbots } from '../../hooks/useChatbots';
import { useProfile } from '../../hooks/useProfile';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { SubscriptionManager } from '../subscription/SubscriptionManager';
import { useState } from 'react';

export function Dashboard() {
  const { chatbots, isLoading } = useChatbots();
  const { profile } = useProfile();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const stats = [
    {
      name: 'Total Chatbots',
      value: chatbots.length.toString(),
      change: '+2 this month',
      icon: Bot,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Messages This Month',
      value: profile?.messages_used?.toString() || '0',
      change: `${profile?.message_quota || 0} quota`,
      icon: MessageCircle,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Active Bots',
      value: chatbots.filter(bot => bot.is_published).length.toString(),
      change: 'Published and running',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Current Plan',
      value: profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1) || 'Free',
      change: profile?.plan === 'free' ? 'Upgrade available' : 'Active subscription',
      icon: Crown,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentBots = chatbots.slice(0, 3).map(bot => ({
    id: bot.id,
    name: bot.name,
    status: bot.is_published ? 'Active' : 'Draft',
    messages: Math.floor(Math.random() * 500), // Mock data
    lastUpdated: new Date(bot.updated_at).toLocaleDateString()
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <OnboardingTour />
      
      {/* Welcome Section */}
      <div className="dashboard-welcome flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-1">Here's what's happening with your chatbots today.</p>
        </div>
        <Link to="/chatbots/new" className="create-bot-button">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New Bot
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Usage Warning */}
      {profile && profile.messages_used / profile.message_quota > 0.8 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-orange-900">Usage Warning</h3>
              <p className="text-sm text-orange-700">
                You've used {Math.round((profile.messages_used / profile.message_quota) * 100)}% of your monthly message quota.
              </p>
            </div>
            {profile.plan === 'free' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubscriptionModal(true)}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Chatbots */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Chatbots</h3>
            <Link to="/chatbots" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentBots.length > 0 ? (
              recentBots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{bot.name}</p>
                      <p className="text-sm text-gray-600">{bot.messages} messages</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      bot.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bot.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{bot.lastUpdated}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No chatbots yet</p>
                <Link to="/chatbots/new">
                  <Button size="sm" className="mt-2">
                    Create your first bot
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-4">
            <Link to="/chatbots/new" className="block">
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Create New Chatbot</p>
                  <p className="text-sm text-gray-600">Build a new AI assistant</p>
                </div>
              </div>
            </Link>
            
            <Link to="/analytics" className="analytics-link block">
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg hover:from-green-100 hover:to-blue-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-600">Check performance metrics</p>
                </div>
              </div>
            </Link>
            
            <Link to="/settings" className="block">
              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Account Settings</p>
                  <p className="text-sm text-gray-600">Manage your account</p>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Upgrade Banner */}
      {profile?.plan === 'free' && (
        <Card className="upgrade-banner p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
              <p className="text-blue-100">
                Get unlimited chatbots, advanced analytics, and WhatsApp integration
              </p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setShowSubscriptionModal(true)}
            >
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}

      {/* Subscription Modal */}
      <SubscriptionManager
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
}