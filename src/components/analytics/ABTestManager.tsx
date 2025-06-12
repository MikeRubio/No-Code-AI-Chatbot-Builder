import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Plus, 
  Play, 
  Pause, 
  TrendingUp, 
  Users, 
  Target,
  Calendar,
  Settings,
  Trash2,
  Copy,
  Eye,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Bot,
  Zap,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

interface ABTestManagerProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  variant_a_flow: any;
  variant_b_flow: any;
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  goal_metric: string;
  goal_target: number;
  created_at: string;
}

interface TestResults {
  variant: 'A' | 'B';
  conversations: number;
  conversions: number;
  conversion_rate: number;
  avg_session_duration: number;
}

interface ChatbotOption {
  id: string;
  name: string;
  description: string;
  flow_data: any;
  is_published: boolean;
  created_at: string;
}

export function ABTestManager({ chatbotId, isOpen, onClose }: ABTestManagerProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testResults, setTestResults] = useState<{ A: TestResults; B: TestResults } | null>(null);
  const [availableChatbots, setAvailableChatbots] = useState<ChatbotOption[]>([]);
  const [currentChatbot, setCurrentChatbot] = useState<ChatbotOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTests();
      loadAvailableChatbots();
    }
  }, [isOpen, chatbotId]);

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast.error('Failed to load A/B tests: ' + error.message);
    }
  };

  const loadAvailableChatbots = async () => {
    try {
      // Get all chatbots for this user
      const { data: chatbots, error } = await supabase
        .from('chatbots')
        .select('id, name, description, flow_data, is_published, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const chatbotOptions: ChatbotOption[] = chatbots || [];
      setAvailableChatbots(chatbotOptions);

      // Find the current chatbot
      const current = chatbotOptions.find(bot => bot.id === chatbotId);
      setCurrentChatbot(current || null);

    } catch (error: any) {
      toast.error('Failed to load chatbots: ' + error.message);
    }
  };

  const createTest = async (testData: Partial<ABTest>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          chatbot_id: chatbotId,
          ...testData
        })
        .select()
        .single();

      if (error) throw error;

      setTests(prev => [data, ...prev]);
      setShowCreateForm(false);
      toast.success('A/B test created successfully!');
    } catch (error: any) {
      toast.error('Failed to create A/B test: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTestStatus = async (testId: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'running' && !tests.find(t => t.id === testId)?.start_date) {
        updates.start_date = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updates.end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ab_tests')
        .update(updates)
        .eq('id', testId);

      if (error) throw error;

      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, ...updates } : test
      ));

      toast.success(`Test ${status} successfully!`);
    } catch (error: any) {
      toast.error('Failed to update test: ' + error.message);
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this A/B test?')) return;

    try {
      const { error } = await supabase
        .from('ab_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      setTests(prev => prev.filter(test => test.id !== testId));
      toast.success('A/B test deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete test: ' + error.message);
    }
  };

  const loadTestResults = async (testId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ab_test_results')
        .select(`
          variant,
          goal_achieved,
          conversion_value,
          session_duration,
          conversation_id
        `)
        .eq('test_id', testId);

      if (error) throw error;

      // Calculate results for each variant
      const variantA = data.filter(r => r.variant === 'A');
      const variantB = data.filter(r => r.variant === 'B');

      const calculateResults = (results: any[]): TestResults => ({
        variant: results[0]?.variant || 'A',
        conversations: results.length,
        conversions: results.filter(r => r.goal_achieved).length,
        conversion_rate: results.length > 0 
          ? (results.filter(r => r.goal_achieved).length / results.length) * 100 
          : 0,
        avg_session_duration: results.length > 0
          ? results.reduce((sum, r) => sum + (r.session_duration || 0), 0) / results.length
          : 0
      });

      setTestResults({
        A: calculateResults(variantA),
        B: calculateResults(variantB)
      });

      setShowResultsModal(true);
    } catch (error: any) {
      toast.error('Failed to load test results: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100 dark:text-green-200 dark:bg-green-900';
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:text-blue-200 dark:bg-blue-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-200 dark:bg-gray-800';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getVariantDescription = (variant: any, variantName: string) => {
    if (!variant || !variant.metadata) return `${variantName} variant`;
    
    if (variant.metadata.type === 'chatbot') {
      return variant.metadata.chatbotName || `${variantName} chatbot`;
    } else if (variant.metadata.type === 'template') {
      return variant.metadata.templateName || `${variantName} template`;
    } else {
      return `${variantName} flow (${variant.nodes?.length || 0} nodes)`;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="A/B Testing Manager"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">A/B Tests</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Test different chatbots, flows, or conversation approaches to optimize performance
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>

        {/* Create Test Form */}
        {showCreateForm && (
          <CreateTestForm
            availableChatbots={availableChatbots}
            currentChatbot={currentChatbot}
            onCreate={createTest}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isLoading}
          />
        )}

        {/* Tests List */}
        <div className="space-y-4">
          {tests.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No A/B Tests Yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first A/B test to optimize your chatbot's performance
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Test
              </Button>
            </Card>
          ) : (
            tests.map((test) => (
              <Card key={test.id} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{test.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{test.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                    {test.status === 'running' && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {getDaysRemaining(test.end_date)} days left
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(test.traffic_split * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Traffic Split</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {test.goal_target}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Goal Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {test.start_date ? format(new Date(test.start_date), 'MMM d') : '-'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Start Date</div>
                  </div>
                </div>

                {/* Test Variants Preview */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-900 dark:text-blue-200">Variant A</span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {getVariantDescription(test.variant_a_flow, 'A')}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-900 dark:text-purple-200">Variant B</span>
                    </div>
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      {getVariantDescription(test.variant_b_flow, 'B')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {test.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'running')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Test
                      </Button>
                    )}
                    
                    {test.status === 'running' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTestStatus(test.id, 'paused')}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTestStatus(test.id, 'completed')}
                        >
                          Stop Test
                        </Button>
                      </>
                    )}
                    
                    {test.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'running')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    
                    {(test.status === 'completed' || test.status === 'running') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTestResults(test.id)}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        View Results
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTest(test)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTest(test.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Results Modal */}
        {showResultsModal && testResults && (
          <TestResultsModal
            results={testResults}
            onClose={() => setShowResultsModal(false)}
          />
        )}
      </div>
    </Modal>
  );
}

interface CreateTestFormProps {
  availableChatbots: ChatbotOption[];
  currentChatbot: ChatbotOption | null;
  onCreate: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CreateTestForm({ availableChatbots, currentChatbot, onCreate, onCancel, isLoading }: CreateTestFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    traffic_split: 0.5,
    goal_metric: 'conversion_rate',
    goal_target: 20,
    duration_days: 14,
    test_type: 'chatbot', // 'chatbot', 'template', 'custom'
    variant_a_flow: null as any,
    variant_b_flow: null as any
  });

  const [expandedVariant, setExpandedVariant] = useState<'A' | 'B' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.variant_a_flow || !formData.variant_b_flow) {
      toast.error('Please select options for both variants');
      return;
    }
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + formData.duration_days);
    
    // Destructure to exclude duration_days from the data sent to database
    const { duration_days, test_type, ...testData } = formData;
    
    onCreate({
      ...testData,
      end_date: endDate.toISOString(),
      status: 'draft'
    });
  };

  const handleChatbotSelect = (chatbot: ChatbotOption, variant: 'A' | 'B') => {
    const flowData = {
      nodes: chatbot.flow_data?.nodes || [],
      edges: chatbot.flow_data?.edges || [],
      metadata: {
        type: 'chatbot',
        chatbotId: chatbot.id,
        chatbotName: chatbot.name,
        chatbotDescription: chatbot.description
      }
    };

    if (variant === 'A') {
      setFormData(prev => ({ ...prev, variant_a_flow: flowData }));
    } else {
      setFormData(prev => ({ ...prev, variant_b_flow: flowData }));
    }
    setExpandedVariant(null);
  };

  const handleTemplateSelect = (template: any, variant: 'A' | 'B') => {
    const flowData = {
      nodes: template.nodes,
      edges: template.edges,
      metadata: {
        type: 'template',
        templateName: template.name,
        templateDescription: template.description
      }
    };

    if (variant === 'A') {
      setFormData(prev => ({ ...prev, variant_a_flow: flowData }));
    } else {
      setFormData(prev => ({ ...prev, variant_b_flow: flowData }));
    }
    setExpandedVariant(null);
  };

  // Predefined conversation templates for testing
  const conversationTemplates = [
    {
      id: 'direct',
      name: 'Direct Approach',
      description: 'Get straight to the point with minimal questions',
      nodes: [
        { id: 'start', type: 'start', data: { content: 'Hi! How can I help you today?' } },
        { id: 'ai', type: 'ai_response', data: { systemPrompt: 'Be direct and helpful. Provide concise answers.' } }
      ],
      edges: []
    },
    {
      id: 'friendly',
      name: 'Friendly & Conversational',
      description: 'Warm, engaging approach with personality',
      nodes: [
        { id: 'start', type: 'start', data: { content: 'Hello there! 👋 I\'m excited to help you today. What brings you here?' } },
        { id: 'ai', type: 'ai_response', data: { systemPrompt: 'Be warm, friendly, and conversational. Use emojis and show personality.' } }
      ],
      edges: []
    },
    {
      id: 'qualification',
      name: 'Lead Qualification',
      description: 'Comprehensive lead qualification process',
      nodes: [
        { id: 'start', type: 'start', data: { content: 'Welcome! I\'d love to learn about your needs.' } },
        { id: 'company', type: 'question', data: { content: 'What size is your company?', options: ['1-10', '11-50', '51-200', '200+'] } },
        { id: 'contact', type: 'lead_capture', data: { fields: [{ name: 'email', type: 'email' }] } }
      ],
      edges: []
    },
    {
      id: 'support',
      name: 'Support-Focused',
      description: 'Optimized for customer support scenarios',
      nodes: [
        { id: 'start', type: 'start', data: { content: 'Hi! I\'m here to help resolve any issues you might have.' } },
        { id: 'issue', type: 'question', data: { content: 'What type of issue are you experiencing?', options: ['Technical', 'Billing', 'Account', 'Other'] } }
      ],
      edges: []
    }
  ];

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New A/B Test</h3>
        <Button variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Chatbot A vs Chatbot B"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min="1"
              max="90"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={2}
            placeholder="Describe what you're testing..."
          />
        </div>

        {/* Test Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What do you want to test?
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, test_type: 'chatbot' }))}
              className={`p-4 border rounded-lg text-left transition-colors ${
                formData.test_type === 'chatbot'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Bot className="w-5 h-5 mb-2 text-blue-600 dark:text-blue-400" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Different Chatbots</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Compare two different chatbots</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, test_type: 'template' }))}
              className={`p-4 border rounded-lg text-left transition-colors ${
                formData.test_type === 'template'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-2 text-purple-600 dark:text-purple-400" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Conversation Styles</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Test different conversation approaches</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, test_type: 'custom' }))}
              className={`p-4 border rounded-lg text-left transition-colors ${
                formData.test_type === 'custom'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Zap className="w-5 h-5 mb-2 text-orange-600 dark:text-orange-400" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Custom Flows</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Test specific flow variations</div>
            </button>
          </div>
        </div>

        {/* Variant Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Test Variants
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Variant A */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-200">Variant A</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedVariant(expandedVariant === 'A' ? null : 'A')}
                  >
                    {expandedVariant === 'A' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.variant_a_flow && (
                  <div className="mt-2 text-sm text-blue-800 dark:text-blue-300 flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    {formData.variant_a_flow.metadata?.chatbotName || 
                     formData.variant_a_flow.metadata?.templateName || 
                     `Selected (${formData.variant_a_flow.nodes?.length || 0} nodes)`}
                  </div>
                )}
              </div>
              
              {expandedVariant === 'A' && (
                <div className="p-4 space-y-3">
                  {formData.test_type === 'chatbot' && (
                    <>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Available Chatbots</h4>
                      {availableChatbots.map((chatbot) => (
                        <div
                          key={chatbot.id}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleChatbotSelect(chatbot, 'A')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{chatbot.name}</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{chatbot.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {chatbot.flow_data?.nodes?.length || 0} nodes
                                </span>
                                {chatbot.is_published && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                    Published
                                  </span>
                                )}
                              </div>
                            </div>
                            {formData.variant_a_flow?.metadata?.chatbotId === chatbot.id && (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {formData.test_type === 'template' && (
                    <>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Conversation Templates</h4>
                      {conversationTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleTemplateSelect(template, 'A')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{template.name}</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{template.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.nodes.length} nodes</p>
                            </div>
                            {formData.variant_a_flow?.metadata?.templateName === template.name && (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Variant B */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-purple-900 dark:text-purple-200">Variant B</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedVariant(expandedVariant === 'B' ? null : 'B')}
                  >
                    {expandedVariant === 'B' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.variant_b_flow && (
                  <div className="mt-2 text-sm text-purple-800 dark:text-purple-300 flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    {formData.variant_b_flow.metadata?.chatbotName || 
                     formData.variant_b_flow.metadata?.templateName || 
                     `Selected (${formData.variant_b_flow.nodes?.length || 0} nodes)`}
                  </div>
                )}
              </div>
              
              {expandedVariant === 'B' && (
                <div className="p-4 space-y-3">
                  {formData.test_type === 'chatbot' && (
                    <>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Available Chatbots</h4>
                      {availableChatbots.map((chatbot) => (
                        <div
                          key={chatbot.id}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleChatbotSelect(chatbot, 'B')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{chatbot.name}</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{chatbot.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {chatbot.flow_data?.nodes?.length || 0} nodes
                                </span>
                                {chatbot.is_published && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                    Published
                                  </span>
                                )}
                              </div>
                            </div>
                            {formData.variant_b_flow?.metadata?.chatbotId === chatbot.id && (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {formData.test_type === 'template' && (
                    <>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Conversation Templates</h4>
                      {conversationTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleTemplateSelect(template, 'B')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{template.name}</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{template.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.nodes.length} nodes</p>
                            </div>
                            {formData.variant_b_flow?.metadata?.templateName === template.name && (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Traffic Split (A/B)
            </label>
            <select
              value={formData.traffic_split}
              onChange={(e) => setFormData(prev => ({ ...prev, traffic_split: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value={0.5}>50% / 50%</option>
              <option value={0.3}>70% / 30%</option>
              <option value={0.2}>80% / 20%</option>
              <option value={0.1}>90% / 10%</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Metric
            </label>
            <select
              value={formData.goal_metric}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_metric: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="conversion_rate">Conversion Rate</option>
              <option value="session_duration">Session Duration</option>
              <option value="goal_completion">Goal Completion</option>
              <option value="user_satisfaction">User Satisfaction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target (%)
            </label>
            <input
              type="number"
              value={formData.goal_target}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_target: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Creating...' : 'Create Test'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface TestResultsModalProps {
  results: { A: TestResults; B: TestResults };
  onClose: () => void;
}

function TestResultsModal({ results, onClose }: TestResultsModalProps) {
  const winner = results.A.conversion_rate > results.B.conversion_rate ? 'A' : 'B';
  const improvement = Math.abs(results.A.conversion_rate - results.B.conversion_rate);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">A/B Test Results</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          {/* Winner Banner */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-200">
                  Variant {winner} is the winner!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {improvement.toFixed(1)}% improvement in conversion rate
                </p>
              </div>
            </div>
          </div>

          {/* Results Comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* Variant A */}
            <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Variant A</h4>
                {winner === 'A' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    Winner
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Conversations</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{results.A.conversations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Conversions</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{results.A.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Conversion Rate</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{results.A.conversion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Avg Session</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(results.A.avg_session_duration)}s</span>
                </div>
              </div>
            </Card>

            {/* Variant B */}
            <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Variant B</h4>
                {winner === 'B' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    Winner
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Conversations</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{results.B.conversations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Conversions</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{results.B.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Conversion Rate</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{results.B.conversion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Avg Session</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(results.B.avg_session_duration)}s</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <Button onClick={onClose}>Close Results</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}