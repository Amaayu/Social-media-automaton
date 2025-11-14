import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigurationPanel from '../components/ConfigurationPanel';
import AutomationControl from '../components/AutomationControl';
import ActivityLog from '../components/ActivityLog';
import { useApp } from '../context/AppContext';
import { getUser, clearAuth } from '../utils/localStorage';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('config');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
      }

      clearAuth();
      toast.showSuccess('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Instagram Automation
              </h1>
              {user && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                  Welcome back, {user.name}
                </p>
              )}
            </div>

            {/* Desktop User Info and Logout */}
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              {user && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="hidden sm:flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('config')}
                className={`${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
              >
                Configuration
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`${
                  activeTab === 'automation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
              >
                Automation
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
              >
                Logs
              </button>
              <button
                onClick={() => navigate('/ai-post')}
                className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent text-purple-600 hover:text-purple-700 hover:border-purple-300 font-medium text-sm transition flex items-center gap-2"
              >
                <span>🤖</span> AI Post Generator
              </button>
              <button
                onClick={() => navigate('/dual-publish')}
                className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent text-green-600 hover:text-green-700 hover:border-green-300 font-medium text-sm transition flex items-center gap-2"
              >
                <span>🎬</span> Dual Publisher
              </button>
              <button
                onClick={() => navigate('/oauth-config')}
                className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent text-blue-600 hover:text-blue-700 hover:border-blue-300 font-medium text-sm transition flex items-center gap-2"
              >
                <span>🔐</span> OAuth Setup
              </button>
            </nav>

            {/* Mobile Tabs */}
            <nav className="sm:hidden -mb-px flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('config')}
                className={`${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                } flex-1 min-w-fit py-3 px-3 border-b-2 font-medium text-xs transition`}
              >
                Config
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`${
                  activeTab === 'automation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                } flex-1 min-w-fit py-3 px-3 border-b-2 font-medium text-xs transition`}
              >
                Automation
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                } flex-1 min-w-fit py-3 px-3 border-b-2 font-medium text-xs transition`}
              >
                Logs
              </button>
              <button
                onClick={() => navigate('/ai-post')}
                className="flex-1 min-w-fit py-3 px-3 border-b-2 border-transparent text-purple-600 font-medium text-xs transition"
              >
                🤖 AI Post
              </button>
              <button
                onClick={() => navigate('/dual-publish')}
                className="flex-1 min-w-fit py-3 px-3 border-b-2 border-transparent text-green-600 font-medium text-xs transition"
              >
                🎬 Dual
              </button>
              <button
                onClick={() => navigate('/oauth-config')}
                className="flex-1 min-w-fit py-3 px-3 border-b-2 border-transparent text-blue-600 font-medium text-xs transition"
              >
                🔐 OAuth
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'config' && <ConfigurationPanel />}
          {activeTab === 'automation' && <AutomationControl />}
          {activeTab === 'logs' && <ActivityLog />}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
