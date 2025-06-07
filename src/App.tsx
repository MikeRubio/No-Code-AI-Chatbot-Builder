import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Plus, Bot, Trash2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useChatbots } from './hooks/useChatbots';
import { useProfile } from './hooks/useProfile';
import { LandingPage } from './components/landing/LandingPage';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { ChatbotBuilder } from './components/chatbot/ChatbotBuilder';
import { Analytics } from './components/analytics/Analytics';
import { SubscriptionManager } from './components/subscription/SubscriptionManager';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

const queryClient = new QueryClient();

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/auth" 
              element={
                user ? <Navigate to="/dashboard\" replace /> : 
                <AuthForm mode={authMode} onModeChange={setAuthMode} />
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={user ? <Layout /> : <Navigate to="/auth\" replace />}
            >
              <Route index element={<Dashboard />} />
            </Route>
            
            <Route 
              path="/chatbots" 
              element={user ? <Layout /> : <Navigate to="/auth\" replace />}
            >
              <Route index element={<ChatbotList />} />
              <Route path="new" element={<ChatbotBuilder />} />
              <Route path=":id/edit" element={<ChatbotBuilder />} />
            </Route>
            
            <Route 
              path="/analytics" 
              element={user ? <Layout /> : <Navigate to="/auth\" replace />}
            >
              <Route index element={<Analytics />} />
            </Route>
            
            <Route 
              path="/settings" 
              element={user ? <Layout /> : <Navigate to="/auth\" replace />}
            >
              <Route index element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/\" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

// Chatbot List Component
function ChatbotList() {
  const { chatbots, deleteChatbot, isLoading } = useChatbots();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chatbots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Chatbots</h2>
        <Link to="/chatbots/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Bot
          </Button>
        </Link>
      </div>

      {chatbots.length === 0 ? (
        <Card className="p-12 text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No chatbots yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI chatbot to get started</p>
          <Link to="/chatbots/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Bot
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <Card key={chatbot.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  chatbot.is_published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {chatbot.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{chatbot.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {chatbot.description || 'No description provided'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Updated {new Date(chatbot.updated_at).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Link to={`/chatbots/${chatbot.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this chatbot?')) {
                        deleteChatbot(chatbot.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Page Component
function SettingsPage() {
  const { profile, updateProfile } = useProfile();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          {profile && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => updateProfile({ full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
          {profile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan
                  </p>
                  <p className="text-sm text-gray-600">
                    {profile.messages_used} / {profile.message_quota} messages used
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  Manage Plan
                </Button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((profile.messages_used / profile.message_quota) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      <SubscriptionManager
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
}

export default App;