import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Settings, Code, FileText, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface NodePropertiesPanelProps {
  node: any;
  onUpdate: (data: any) => void;
  onClose: () => void;
}

export function NodePropertiesPanel({ node, onUpdate, onClose }: NodePropertiesPanelProps) {
  const [formData, setFormData] = useState({
    label: '',
    content: '',
    options: [] as string[],
    actionType: 'webhook',
    fields: [] as any[],
    systemPrompt: '',
    conditions: [] as any[],
    apiConfig: {
      url: '',
      method: 'POST',
      headers: {},
      auth: { type: 'none' },
      timeout: 30
    },
    surveyConfig: {
      title: '',
      questions: [] as any[],
      collectNPS: false
    },
    fileConfig: {
      allowedTypes: ['pdf', 'doc', 'jpg', 'png'],
      maxSize: 10,
      downloadable: false
    },
    handoffConfig: {
      reason: '',
      priority: 'medium',
      department: 'support'
    }
  });

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data.label || '',
        content: node.data.content || '',
        options: node.data.options || [],
        actionType: node.data.actionType || 'webhook',
        fields: node.data.fields || [],
        systemPrompt: node.data.systemPrompt || '',
        conditions: node.data.conditions || [],
        apiConfig: node.data.apiConfig || {
          url: '',
          method: 'POST',
          headers: {},
          auth: { type: 'none' },
          timeout: 30
        },
        surveyConfig: node.data.surveyConfig || {
          title: '',
          questions: [],
          collectNPS: false
        },
        fileConfig: node.data.fileConfig || {
          allowedTypes: ['pdf', 'doc', 'jpg', 'png'],
          maxSize: 10,
          downloadable: false
        },
        handoffConfig: node.data.handoffConfig || {
          reason: '',
          priority: 'medium',
          department: 'support'
        }
      });
    }
  }, [node]);

  const handleUpdate = () => {
    onUpdate(formData);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', type: 'text', required: true }]
    }));
  };

  const updateField = (index: number, field: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { 
        variable: '', 
        operator: 'equals', 
        value: '', 
        action: 'continue' 
      }]
    }));
  };

  const updateCondition = (index: number, condition: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? condition : c)
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addSurveyQuestion = () => {
    setFormData(prev => ({
      ...prev,
      surveyConfig: {
        ...prev.surveyConfig,
        questions: [...prev.surveyConfig.questions, {
          type: 'text',
          question: '',
          required: true,
          options: []
        }]
      }
    }));
  };

  const updateSurveyQuestion = (index: number, question: any) => {
    setFormData(prev => ({
      ...prev,
      surveyConfig: {
        ...prev.surveyConfig,
        questions: prev.surveyConfig.questions.map((q, i) => i === index ? question : q)
      }
    }));
  };

  const removeSurveyQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      surveyConfig: {
        ...prev.surveyConfig,
        questions: prev.surveyConfig.questions.filter((_, i) => i !== index)
      }
    }));
  };

  if (!node) return null;

  const nodeType = node.data.nodeType;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-10 overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {nodeType.replace('_', ' ')} Node
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Node Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter node label"
            />
          </div>

          {/* Content for message, question, and AI response nodes */}
          {(nodeType === 'message' || nodeType === 'question' || nodeType === 'ai_response') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {nodeType === 'ai_response' ? 'System Prompt' : 'Message Content'}
              </label>
              <textarea
                value={nodeType === 'ai_response' ? formData.systemPrompt : formData.content}
                onChange={(e) => {
                  if (nodeType === 'ai_response') {
                    setFormData(prev => ({ ...prev, systemPrompt: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, content: e.target.value }));
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  nodeType === 'ai_response' 
                    ? 'Enter system prompt for AI...'
                    : 'Enter your message...'
                }
              />
            </div>
          )}

          {/* Options for question nodes */}
          {nodeType === 'question' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <Button size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Logic Configuration */}
          {nodeType === 'conditional' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Conditions
                </label>
                <Button size="sm" onClick={addCondition}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Condition
                </Button>
              </div>
              <div className="space-y-3">
                {formData.conditions.map((condition, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Condition {index + 1}</span>
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={condition.variable}
                        onChange={(e) => updateCondition(index, { ...condition, variable: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Variable name"
                      />
                      <div className="flex space-x-2">
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { ...condition, operator: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                        </select>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { ...condition, value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Value"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* API/Webhook Configuration */}
          {nodeType === 'api_webhook' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Code className="w-4 h-4 inline mr-1" />
                  API Configuration
                </label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={formData.apiConfig.url}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      apiConfig: { ...prev.apiConfig, url: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://api.example.com/endpoint"
                  />
                  <div className="flex space-x-2">
                    <select
                      value={formData.apiConfig.method}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        apiConfig: { ...prev.apiConfig, method: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                    <input
                      type="number"
                      value={formData.apiConfig.timeout}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        apiConfig: { ...prev.apiConfig, timeout: parseInt(e.target.value) }
                      }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                      min="1"
                      max="300"
                    />
                    <span className="text-sm text-gray-500 self-center">seconds</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Survey Configuration */}
          {nodeType === 'survey' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Survey Configuration
                </label>
                <input
                  type="text"
                  value={formData.surveyConfig.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    surveyConfig: { ...prev.surveyConfig, title: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Survey title"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Questions
                  </label>
                  <Button size="sm" onClick={addSurveyQuestion}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.surveyConfig.questions.map((question, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                        <button
                          onClick={() => removeSurveyQuestion(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => updateSurveyQuestion(index, { ...question, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Question text"
                        />
                        <div className="flex space-x-2">
                          <select
                            value={question.type}
                            onChange={(e) => updateSurveyQuestion(index, { ...question, type: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="text">Text</option>
                            <option value="rating">Rating (1-5)</option>
                            <option value="nps">NPS (0-10)</option>
                            <option value="multiple_choice">Multiple Choice</option>
                          </select>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateSurveyQuestion(index, { ...question, required: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* File Upload Configuration */}
          {nodeType === 'file_upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  File Configuration
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Allowed File Types</label>
                    <div className="flex flex-wrap gap-2">
                      {['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif', 'mp4', 'mp3'].map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.fileConfig.allowedTypes.includes(type)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...formData.fileConfig.allowedTypes, type]
                                : formData.fileConfig.allowedTypes.filter(t => t !== type);
                              setFormData(prev => ({
                                ...prev,
                                fileConfig: { ...prev.fileConfig, allowedTypes: types }
                              }));
                            }}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Max Size (MB)</label>
                      <input
                        type="number"
                        value={formData.fileConfig.maxSize}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fileConfig: { ...prev.fileConfig, maxSize: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="100"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.fileConfig.downloadable}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            fileConfig: { ...prev.fileConfig, downloadable: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Downloadable</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Human Handoff Configuration */}
          {nodeType === 'human_handoff' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handoff Configuration
                </label>
                <div className="space-y-3">
                  <textarea
                    value={formData.handoffConfig.reason}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      handoffConfig: { ...prev.handoffConfig, reason: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Reason for handoff..."
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <select
                      value={formData.handoffConfig.priority}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        handoffConfig: { ...prev.handoffConfig, priority: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <select
                      value={formData.handoffConfig.department}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        handoffConfig: { ...prev.handoffConfig, department: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="support">Support</option>
                      <option value="sales">Sales</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fields for lead capture nodes */}
          {nodeType === 'lead_capture' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Form Fields
                </label>
                <Button size="sm" onClick={addField}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {formData.fields.map((field, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                      <button
                        onClick={() => removeField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Field name"
                      />
                      <div className="flex space-x-2">
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="number">Number</option>
                        </select>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Appointment booking settings */}
          {nodeType === 'appointment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Instructions
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter booking instructions or calendar link..."
              />
            </div>
          )}

          {/* Action type for action nodes */}
          {nodeType === 'action' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={formData.actionType}
                onChange={(e) => setFormData(prev => ({ ...prev, actionType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="webhook">Webhook Call</option>
                <option value="email">Send Email</option>
                <option value="sms">Send SMS</option>
                <option value="api">API Call</option>
                <option value="database">Database Update</option>
                <option value="notification">Send Notification</option>
              </select>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleUpdate} className="w-full">
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}