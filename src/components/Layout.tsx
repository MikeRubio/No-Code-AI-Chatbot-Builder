import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Bot,
  Home,
  Settings,
  BarChart3,
  Plus,
  User,
  LogOut,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";

export function Layout() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Chatbots", href: "/chatbots", icon: Bot },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="sidebar-nav w-64 glass-dark border-r border-gray-700 min-h-screen">
          <div className="p-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                BotBuilder
              </span>
            </Link>
          </div>

          <nav className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-gray-300 hover:text-gray-100 hover:bg-gray-700/50"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Documentation Link */}
            <Link
              to="/docs"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50"
            >
              <BookOpen className="mr-3 h-5 w-5" />
              Documentation
            </Link>
          </nav>

          {/* Plan Status */}
          {profile && (
            <div className="mx-4 mt-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}{" "}
                  Plan
                </span>
                {profile.plan === "free" && (
                  <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-700">
                    Limited
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {profile.messages_used} / {profile.message_quota} messages
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (profile.messages_used / profile.message_quota) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            <Link
              to="/chatbots/new"
              className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Chatbot
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="glass-dark border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-100">
                  {navigation.find((item) => item.href === location.pathname)
                    ?.name || "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
