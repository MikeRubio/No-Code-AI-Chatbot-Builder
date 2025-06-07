import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  MessageCircle, 
  User, 
  Star, 
  Clock,
  ExternalLink,
  Eye,
  MoreVertical,
  RefreshCw,
  FileText,
  Shield,
  Trash2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { format, parseISO, subDays } from 'date-fns';
import toast from 'react-hot-toast';

interface ConversationHistoryProps {
  chatbotId?: string;
}

interface ConversationLog {
  id: string;
  conversation_id: string;
  user_identifier: string;
  channel_type: string;
  conversation_start: string;
  conversation_end: string | null;
  total_messages: number;
  outcome: string;
  satisfaction_score: number | null;
  nps_score: number | null;
  feedback_text: string | null;
  goal_achieved: boolean;
  conversion_value: number | null;
  tags: string[];
  conversation_duration: string | null;
}

interface ConversationMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  message_type: string;
  created_at: string;
  response_time_ms: number | null;
  intent_detected: string | null;
  confidence_score: number | null;
  fallback_triggered: boolean;
}

export function ConversationHistory({ chatbotId }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationLog[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationLog | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [channelFilter, setChannelFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [satisfactionFilter, setSatisfactionFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadConversations();
  }, [chatbotId, dateRange, channelFilter, outcomeFilter, satisfactionFilter, currentPage]);

  useEffect(() => {
    applyFilters();
  }, [conversations, searchTerm]);

  const loadConversations = async () => {
    if (!chatbotId) return;
    
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange.replace('d', '')));

      let query = supabase
        .from('conversation_logs')
        .select('*', { count: 'exact' })
        .eq('chatbot_id', chatbotId)
        .gte('conversation_start', startDate.toISOString())
        .lte('conversation_start', endDate.toISOString())
        .order('conversation_start', { ascending: false });

      // Apply filters
      if (channelFilter !== 'all') {
        query = query.eq('channel_type', channelFilter);
      }
      
      if (outcomeFilter !== 'all') {
        query = query.eq('outcome', outcomeFilter);
      }
      
      if (satisfactionFilter !== 'all') {
        if (satisfactionFilter === 'positive') {
          query = query.gte('satisfaction_score', 4);
        } else if (satisfactionFilter === 'negative') {
          query = query.lte('satisfaction_score', 2);
        } else if (satisfactionFilter === 'neutral') {
          query = query.eq('satisfaction_score', 3);
        }
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setConversations(data || []);
      setTotalItems(count || 0);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchTerm) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => 
      conv.user_identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.channel_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.outcome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      conv.feedback_text?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredConversations(filtered);
  };

  const loadConversationDetails = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender,
          content,
          message_type,
          created_at,
          response_time_ms,
          intent_detected,
          confidence_score,
          fallback_triggered
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setConversationMessages(data || []);
    } catch (error: any) {
      console.error('Failed to load conversation details:', error);
      toast.error('Failed to load conversation details');
    }
  };

  const viewConversation = async (conversation: ConversationLog) => {
    setSelectedConversation(conversation);
    await loadConversationDetails(conversation.conversation_id);
    setShowConversationModal(true);
  };

  const exportConversations = async (format: 'csv' | 'json') => {
    try {
      setIsLoading(true);
      
      // Create export record
      const { data: exportRecord, error: exportError } = await supabase
        .from('conversation_exports')
        .insert({
          chatbot_id: chatbotId,
          export_type: format,
          filters: {
            dateRange,
            channelFilter,
            outcomeFilter,
            satisfactionFilter,
            searchTerm
          },
          total_records: filteredConversations.length
        })
        .select()
        .single();

      if (exportError) throw exportError;

      // Generate export data
      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        const headers = [
          'Conversation ID',
          'User ID',
          'Channel',
          'Start Time',
          'End Time',
          'Duration',
          'Messages',
          'Outcome',
          'Satisfaction',
          'NPS Score',
          'Goal Achieved',
          'Conversion Value',
          'Feedback'
        ];

        const rows = filteredConversations.map(conv => [
          conv.conversation_id,
          conv.user_identifier,
          conv.channel_type,
          format(parseISO(conv.conversation_start), 'yyyy-MM-dd HH:mm:ss'),
          conv.conversation_end ? format(parseISO(conv.conversation_end), 'yyyy-MM-dd HH:mm:ss') : '',
          conv.conversation_duration || '',
          conv.total_messages.toString(),
          conv.outcome || '',
          conv.satisfaction_score?.toString() || '',
          conv.nps_score?.toString() || '',
          conv.goal_achieved ? 'Yes' : 'No',
          conv.conversion_value?.toString() || '',
          conv.feedback_text || ''
        ]);

        exportData = [headers, ...rows].map(row => 
          row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        filename = `conversations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
      } else {
        exportData = JSON.stringify(filteredConversations, null, 2);
        filename = `conversations-${format(new Date(), 'yyyy-MM-dd')}.json`;
        mimeType = 'application/json';
      }

      // Download file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Update export record
      await supabase
        .from('conversation_exports')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_size: blob.size
        })
        .eq('id', exportRecord.id);

      toast.success(`Conversations exported as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error('Failed to export conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.conversation_id !== conversationId));
      toast.success('Conversation deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const anonymizeConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to anonymize this conversation? This will remove all personal data.')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('anonymize_conversation_data', {
        conversation_uuid: conversationId
      });

      if (error) throw error;

      toast.success('Conversation anonymized successfully');
      loadConversations(); // Reload to show updated data
    } catch (error: any) {
      console.error('Failed to anonymize conversation:', error);
      toast.error('Failed to anonymize conversation');
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'abandoned': return 'text-red-600 bg-red-100';
      case 'transferred': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSatisfactionColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 4) return 'text-green-600';
    if (score <= 2) return 'text-red-600';
    return 'text-yellow-600';
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return 'N/A';
    
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (!match) return duration;
    
    const [, hours, minutes, seconds] = match;
    if (parseInt(hours) > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversation History</h2>
          <p className="text-gray-600">Monitor and analyze all chatbot conversations for quality assurance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={loadConversations}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Search and basic filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Channels</option>
              <option value="web">Web</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="telegram">Telegram</option>
              <option value="sms">SMS</option>
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Outcomes</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
              <option value="transferred">Transferred</option>
              <option value="error">Error</option>
            </select>

            <select
              value={satisfactionFilter}
              onChange={(e) => setSatisfactionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="positive">Positive (4-5)</option>
              <option value="neutral">Neutral (3)</option>
              <option value="negative">Negative (1-2)</option>
            </select>
          </div>

          {/* Advanced filters toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
            <div className="text-sm text-gray-600">
              Showing {filteredConversations.length} of {totalItems} conversations
            </div>
          </div>
        </div>
      </Card>

      {/* Conversations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User & Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration & Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satisfaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <tr key={conversation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {conversation.user_identifier.startsWith('anonymous_') 
                            ? 'Anonymous User' 
                            : conversation.user_identifier
                          }
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {conversation.channel_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDuration(conversation.conversation_duration)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {conversation.total_messages} messages
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getOutcomeColor(conversation.outcome)}`}>
                      {conversation.outcome || 'Unknown'}
                    </span>
                    {conversation.goal_achieved && (
                      <div className="text-xs text-green-600 mt-1">Goal achieved</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {conversation.satisfaction_score ? (
                        <>
                          <Star className={`w-4 h-4 mr-1 ${getSatisfactionColor(conversation.satisfaction_score)}`} />
                          <span className={`text-sm ${getSatisfactionColor(conversation.satisfaction_score)}`}>
                            {conversation.satisfaction_score}/5
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No rating</span>
                      )}
                    </div>
                    {conversation.nps_score !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        NPS: {conversation.nps_score}/10
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{format(parseISO(conversation.conversation_start), 'MMM d, yyyy')}</div>
                    <div>{format(parseISO(conversation.conversation_start), 'HH:mm')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewConversation(conversation)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <div className="relative group">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <button
                            onClick={() => anonymizeConversation(conversation.conversation_id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Anonymize
                          </button>
                          <button
                            onClick={() => deleteConversation(conversation.conversation_id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Conversation Detail Modal */}
      {showConversationModal && selectedConversation && (
        <ConversationDetailModal
          conversation={selectedConversation}
          messages={conversationMessages}
          onClose={() => {
            setShowConversationModal(false);
            setSelectedConversation(null);
            setConversationMessages([]);
          }}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onExport={exportConversations}
          onClose={() => setShowExportModal(false)}
          totalRecords={filteredConversations.length}
        />
      )}
    </div>
  );
}

interface ConversationDetailModalProps {
  conversation: ConversationLog;
  messages: ConversationMessage[];
  onClose: () => void;
}

function ConversationDetailModal({ conversation, messages, onClose }: ConversationDetailModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Conversation Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Conversation Summary */}
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">User</p>
              <p className="font-medium">{conversation.user_identifier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Channel</p>
              <p className="font-medium capitalize">{conversation.channel_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium">{conversation.conversation_duration || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Messages</p>
              <p className="font-medium">{conversation.total_messages}</p>
            </div>
          </div>
        </Card>

        {/* Messages */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span>{format(parseISO(message.created_at), 'HH:mm')}</span>
                  {message.response_time_ms && (
                    <span>{message.response_time_ms}ms</span>
                  )}
                </div>
                {message.fallback_triggered && (
                  <div className="text-xs text-orange-200 mt-1">Fallback triggered</div>
                )}
                {message.intent_detected && (
                  <div className="text-xs opacity-75 mt-1">
                    Intent: {message.intent_detected}
                    {message.confidence_score && ` (${Math.round(message.confidence_score * 100)}%)`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        {(conversation.satisfaction_score || conversation.feedback_text) && (
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">User Feedback</h4>
            {conversation.satisfaction_score && (
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span>{conversation.satisfaction_score}/5</span>
              </div>
            )}
            {conversation.feedback_text && (
              <p className="text-sm text-gray-600">{conversation.feedback_text}</p>
            )}
          </Card>
        )}
      </div>
    </Modal>
  );
}

interface ExportModalProps {
  onExport: (format: 'csv' | 'json') => void;
  onClose: () => void;
  totalRecords: number;
}

function ExportModal({ onExport, onClose, totalRecords }: ExportModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Export Conversations"
      size="md"
    >
      <div className="space-y-6">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Export Conversation Data
          </h3>
          <p className="text-gray-600">
            Export {totalRecords} conversations with current filters applied
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            className="h-20 flex-col"
          >
            <FileText className="w-6 h-6 mb-2" />
            CSV Format
            <span className="text-xs text-gray-500">Spreadsheet compatible</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('json')}
            className="h-20 flex-col"
          >
            <FileText className="w-6 h-6 mb-2" />
            JSON Format
            <span className="text-xs text-gray-500">Developer friendly</span>
          </Button>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Export includes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Conversation metadata and timing</li>
            <li>• User interactions and bot responses</li>
            <li>• Satisfaction ratings and feedback</li>
            <li>• Performance metrics and outcomes</li>
            <li>• Channel and device information</li>
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Privacy Notice:</h4>
          <p className="text-sm text-yellow-800">
            Exported data may contain personal information. Please handle according to your privacy policy and applicable regulations (GDPR, CCPA, etc.).
          </p>
        </div>
      </div>
    </Modal>
  );
}