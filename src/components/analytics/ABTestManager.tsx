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
  Trash2
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

export function ABTestManager({ chatbotId, isOpen, onClose }: ABTestManagerProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testResults, setTestResults] = useState<{ A: TestResults; B: TestResults } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTests();
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
      setShowCreateModal(false);
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
      case 'running': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
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
            <h3 className="text-lg font-semibold text-gray-900">A/B Tests</h3>
            <p className="text-sm text-gray-600">
              Test different conversation flows to optimize performance
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>

        {/* Tests List */}
        <div className="space-y-4">
          {tests.length === 0 ? (
            <Card className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No A/B Tests Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first A/B test to optimize your chatbot's performance
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Test
              </Button>
            </Card>
          ) : (
            tests.map((test) => (
              <Card key={test.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                    {test.status === 'running' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {getDaysRemaining(test.end_date)} days left
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(test.traffic_split * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Traffic Split</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {test.goal_target}%
                    </div>
                    <div className="text-sm text-gray-600">Goal Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {test.start_date ? format(new Date(test.start_date), 'MMM d') : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Start Date</div>
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
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Test Modal */}
        {showCreateModal && (
          <CreateTestModal
            onCreate={createTest}
            onClose={() => setShowCreateModal(false)}
            isLoading={isLoading}
          />
        )}

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

interface CreateTestModalProps {
  onCreate: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

function CreateTestModal({ onCreate, onClose, isLoading }: CreateTestModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    traffic_split: 0.5,
    goal_metric: 'conversion_rate',
    goal_target: 20,
    duration_days: 14
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + formData.duration_days);
    
    onCreate({
      ...formData,
      end_date: endDate.toISOString(),
      variant_a_flow: { nodes: [], edges: [] }, // Will be set from current flow
      variant_b_flow: { nodes: [], edges: [] }, // Will be configured later
      status: 'draft'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create A/B Test</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Welcome Message Test"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe what you're testing..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traffic Split (A/B)
                </label>
                <select
                  value={formData.traffic_split}
                  onChange={(e) => setFormData(prev => ({ ...prev, traffic_split: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0.5}>50% / 50%</option>
                  <option value={0.3}>70% / 30%</option>
                  <option value={0.2}>80% / 20%</option>
                  <option value={0.1}>90% / 10%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="90"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Metric
                </label>
                <select
                  value={formData.goal_metric}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_metric: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="session_duration">Session Duration</option>
                  <option value="goal_completion">Goal Completion</option>
                  <option value="user_satisfaction">User Satisfaction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target (%)
                </label>
                <input
                  type="number"
                  value={formData.goal_target}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_target: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Test'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
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
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">A/B Test Results</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          {/* Winner Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <h4 className="font-semibold text-green-900">
                  Variant {winner} is the winner!
                </h4>
                <p className="text-sm text-green-700">
                  {improvement.toFixed(1)}% improvement in conversion rate
                </p>
              </div>
            </div>
          </div>

          {/* Results Comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* Variant A */}
            <Card className="p-4">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Variant A</h4>
                {winner === 'A' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Winner
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversations</span>
                  <span className="font-medium">{results.A.conversations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversions</span>
                  <span className="font-medium">{results.A.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-medium">{results.A.conversion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Session</span>
                  <span className="font-medium">{Math.round(results.A.avg_session_duration)}s</span>
                </div>
              </div>
            </Card>

            {/* Variant B */}
            <Card className="p-4">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Variant B</h4>
                {winner === 'B' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Winner
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversations</span>
                  <span className="font-medium">{results.B.conversations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversions</span>
                  <span className="font-medium">{results.B.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-medium">{results.B.conversion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Session</span>
                  <span className="font-medium">{Math.round(results.B.avg_session_duration)}s</span>
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