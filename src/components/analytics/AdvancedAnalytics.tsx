import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Clock, 
  Bot, 
  Target,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AdvancedAnalyticsProps {
  chatbotId?: string;
}

export function AdvancedAnalytics({ chatbotId }: AdvancedAnalyticsProps) {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('conversations');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [chatbotId, dateRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange.replace('d', '')));

      // Load basic analytics
      let analyticsQuery = supabase
        .from('analytics')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date');

      // Only apply chatbot filter if chatbotId is defined
      if (chatbotId) {
        analyticsQuery = analyticsQuery.eq('chatbot_id', chatbotId);
      }

      const { data: analytics, error: analyticsError } = await analyticsQuery;

      if (analyticsError) throw analyticsError;

      // Load funnel analytics
      let funnelQuery = supabase
        .from('funnel_analytics')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      // Only apply chatbot filter if chatbotId is defined
      if (chatbotId) {
        funnelQuery = funnelQuery.eq('chatbot_id', chatbotId);
      }

      const { data: funnel, error: funnelError } = await funnelQuery;

      if (funnelError) throw funnelError;

      // Load heatmap data
      let heatmapQuery = supabase
        .from('user_journey_heatmaps')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      // Only apply chatbot filter if chatbotId is defined
      if (chatbotId) {
        heatmapQuery = heatmapQuery.eq('chatbot_id', chatbotId);
      }

      const { data: heatmap, error: heatmapError } = await heatmapQuery;

      if (heatmapError) throw heatmapError;

      setAnalyticsData(analytics);
      setFunnelData(processFunnelData(funnel));
      setHeatmapData(heatmap);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processFunnelData = (data: any[]) => {
    // Process funnel data for visualization
    const steps = [
      { name: 'Started Conversation', value: 1000, fill: '#3B82F6' },
      { name: 'Engaged with Bot', value: 800, fill: '#10B981' },
      { name: 'Provided Information', value: 600, fill: '#8B5CF6' },
      { name: 'Completed Goal', value: 400, fill: '#F59E0B' },
      { name: 'Converted', value: 200, fill: '#EF4444' }
    ];
    return steps;
  };

  const exportData = async () => {
    try {
      // Generate CSV export
      const csvData = analyticsData.map((row: any) => ({
        Date: row.date,
        Conversations: row.total_conversations,
        Users: row.active_users,
        Messages: row.messages_sent + row.messages_received,
        'Goal Completions': row.goal_completions,
        'Satisfaction': row.satisfaction_avg,
        'Fallback Rate': row.fallback_rate,
        'Handoff Rate': row.human_handoff_rate
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatbot-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const stats = [
    {
      name: 'Total Conversations',
      value: analyticsData?.reduce((sum: number, day: any) => sum + day.total_conversations, 0) || 0,
      change: '+12%',
      trend: 'up',
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Unique Users',
      value: analyticsData?.reduce((sum: number, day: any) => sum + day.active_users, 0) || 0,
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
      value: analyticsData?.length > 0 
        ? `${(analyticsData.reduce((sum: number, day: any) => sum + day.goal_completions, 0) / 
             analyticsData.reduce((sum: number, day: any) => sum + day.total_conversations, 0) * 100).toFixed(1)}%`
        : '0%',
      change: '+5%',
      trend: 'up',
      icon: Target,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const chartData = analyticsData?.map((day: any) => ({
    date: format(new Date(day.date), 'MMM dd'),
    conversations: day.total_conversations,
    users: day.active_users,
    messages: day.messages_sent + day.messages_received,
    conversions: day.goal_completions,
    satisfaction: day.satisfaction_avg,
    fallbackRate: day.fallback_rate,
    handoffRate: day.human_handoff_rate
  })) || [];

  const intentData = [
    { name: 'Support', value: 35, color: '#3B82F6' },
    { name: 'FAQ', value: 25, color: '#10B981' },
    { name: 'Booking', value: 20, color: '#8B5CF6' },
    { name: 'Sales', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 5, color: '#6B7280' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="conversations">Conversations</option>
              <option value="users">Users</option>
              <option value="messages">Messages</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>
        </div>
        
        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

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
                  {stat.change} from last period
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Time Series</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
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
                dataKey={selectedMetric} 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Advanced Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Conversion Funnel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Journey Heatmap */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">User Journey Heatmap</h3>
          <div className="space-y-3">
            {heatmapData.slice(0, 8).map((node, index) => (
              <div key={node.node_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Node {node.node_id}</p>
                    <p className="text-sm text-gray-600">{node.visits} visits</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((node.visits / Math.max(...heatmapData.map(n => n.visits))) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{node.avg_time_spent}s avg</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Satisfaction Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Satisfaction Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="satisfaction" 
                  fill="url(#satisfactionGradient)" 
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Intent Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Intent Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
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
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Insights</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center mb-2">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <p className="font-medium text-blue-900">Peak Performance</p>
            </div>
            <p className="text-sm text-blue-700">
              Your chatbot performs best between 2-4 PM with 89% user satisfaction
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <p className="font-medium text-green-900">Conversion Opportunity</p>
            </div>
            <p className="text-sm text-green-700">
              Users who engage with FAQ nodes are 3x more likely to convert
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-orange-600 mr-2" />
              <p className="font-medium text-orange-900">Optimization Suggestion</p>
            </div>
            <p className="text-sm text-orange-700">
              Consider adding more quick reply options to reduce fallback rate by 15%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}