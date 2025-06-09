import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Plus, Bot, Trash2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useChatbots } from "./hooks/useChatbots";
import { useProfile } from "./hooks/useProfile";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthForm } from "./components/auth/AuthForm";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ChatbotBuilder } from "./components/chatbot/ChatbotBuilder";
import { Analytics } from "./components/analytics/Analytics";
import { SubscriptionManager } from "./components/subscription/SubscriptionManager";
import { SubscriptionSuccessHandler } from "./components/subscription/SubscriptionSuccessHandler";
import { AccountManagement } from "./components/subscription/AccountManagement";
import { DocumentationPage } from "./components/help/DocumentationPage";
import { HelpButton } from "./components/help/HelpButton";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";

const queryClient = new QueryClient();

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App bg-gray-900 min-h-screen">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<DocumentationPage />} />
            <Route
              path="/auth"
              element={
                user ? (
                  <Navigate to="/dashboard\" replace />
                ) : (
                  <AuthForm mode={authMode} onModeChange={setAuthMode} />
                )
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
              <Route path="account" element={<AccountManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/\" replace />} />
          </Routes>

          {/* Help Button - Show on all authenticated pages */}
          {user && <HelpButton />}

          {/* Subscription Success Handler */}
          {user && <SubscriptionSuccessHandler />}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(31, 41, 55, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(75, 85, 99, 0.3)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                color: "#f3f4f6",
              },
              success: {
                style: {
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#10b981",
                },
              },
              error: {
                style: {
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                },
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
          <p className="text-gray-400">Loading chatbots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Your Chatbots</h2>
        <Link to="/chatbots/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Bot
          </Button>
        </Link>
      </div>

      {chatbots.length === 0 ? (
        <Card className="p-12 text-center bg-gray-800 border-gray-700">
          <Bot className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-100 mb-2">
            No chatbots yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create your first AI chatbot to get started
          </p>
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
            <Card
              key={chatbot.id}
              className="p-6 bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    chatbot.is_published
                      ? "bg-green-900 text-green-300 border border-green-700"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  {chatbot.is_published ? "Published" : "Draft"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {chatbot.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {chatbot.description || "No description provided"}
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
                      if (
                        confirm("Are you sure you want to delete this chatbot?")
                      ) {
                        deleteChatbot(chatbot.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Settings</h2>
        <Link to="/settings/account">
          <Button variant="outline">Manage Account</Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Profile Information
          </h3>
          {profile && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name || ""}
                  onChange={(e) => updateProfile({ full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Subscription
          </h3>
          {profile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-100">
                    {profile.plan.charAt(0).toUpperCase() +
                      profile.plan.slice(1)}{" "}
                    Plan
                  </p>
                  <p className="text-sm text-gray-400">
                    {profile.messages_used} /{" "}
                    {profile.message_quota === -1 ? "∞" : profile.message_quota}{" "}
                    messages used
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  Manage Plan
                </Button>
              </div>
              {profile.message_quota !== -1 && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (profile.messages_used / profile.message_quota) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
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
