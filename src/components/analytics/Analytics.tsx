import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, MessageCircle, Clock, Bot, Target, History, BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ConversationHistory } from './ConversationHistory';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { useChatbots } from '../../hooks/useChatbots';

export function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'advanced'>('overview');
  const [selectedChatbot, setSelectedChatbot] = useState<string>('all');
  const { chatbots } = useChatbots();

  const stats = [
    {
      name: 'Total Messages',
      value: '12,847',
      change: '+12%',
      trend: 'up',
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Unique Users',
      value: '3,421',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Avg Response Time',
      value: '0.8s',
      change: '-15%',
      trend: 'up',
      icon: Clock,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Conversion Rate',
      value: '24.5%',
      change: '+5%',
      trend: 'up',
      icon: Target,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const messageData = [
    { name: 'Mon', messages: 120, users: 45 },
    { name: 'Tue', messages: 180, users: 67 },
    { name: 'Wed', messages: 150, users: 52 },
    { name: 'Thu', messages: 220, users: 78 },
    { name: 'Fri', messages: 290, users: 95 },
    { name: 'Sat', messages: 180, users: 61 },
    { name: 'Sun', messages: 140, users: 48 },
  ];

  const botPerformanceData = [
    { name: 'Customer Support', messages: 4500, satisfaction: 4.8 },
    { name: 'FAQ Assistant', messages: 3200, satisfaction: 4.6 },
    { name: 'Lead Qualifier', messages: 2100, satisfaction: 4.4 },
    { name: 'Booking Bot', messages: 1800, satisfaction: 4.9 },
  ];

  const intentData = [
    { name: 'Support', value: 35, color: '#3B82F6' },
    { name: 'FAQ', value: 25, color: '#10B981' },
    { name: 'Booking', value: 20, color: '#8B5CF6' },
    { name: 'Sales', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 5, color: '#6B7280' },
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'conversations', name: 'Conversations', icon: History },
    { id: 'advanced', name: 'Advanced', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Chatbot Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Monitor performance and analyze conversations</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedChatbot}
            onChange={(e) => setSelectedChatbot(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Chatbots</option>
            {chatbots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Overview */}
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
                    <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Messages Over Time */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Messages & Users This Week</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={messageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Intent Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Intent Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={intentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {intentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Bot Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Chatbot Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={botPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="messages" 
                    fill="url(#colorGradient)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Performing Bots */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Bots</h3>
              <div className="space-y-4">
                {botPerformanceData.map((bot, index) => (
                  <div key={bot.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{bot.name}</p>
                        <p className="text-sm text-gray-600">{bot.messages.toLocaleString()} messages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="font-medium text-gray-900">{bot.satisfaction}</span>
                      </div>
                      <p className="text-xs text-gray-500">satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-blue-900">Peak Usage Hours</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Most conversations happen between 9 AM - 5 PM on weekdays
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="font-medium text-green-900">Improved Response Time</p>
                  <p className="text-sm text-green-700 mt-1">
                    Average response time decreased by 23% this month
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="font-medium text-purple-900">High Conversion Rate</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Lead qualification bot has 89% accuracy rate
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <p className="font-medium text-orange-900">Training Suggestion</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Consider adding more FAQ responses for product pricing
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'conversations' && (
        <ConversationHistory chatbotId={selectedChatbot === 'all' ? undefined : selectedChatbot} />
      )}

      {activeTab === 'advanced' && (
        <AdvancedAnalytics chatbotId={selectedChatbot === 'all' ? undefined : selectedChatbot} />
      )}
    </div>
  );
}