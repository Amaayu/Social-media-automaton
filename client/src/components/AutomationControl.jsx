import { useState } from 'react';
import { automationAPI } from '../utils/api';
import { useApp } from '../context/AppContext';
import PostSelector from './PostSelector';

const AutomationControl = () => {
  const { automationStatus, fetchAutomationStatus, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [showPostSelector, setShowPostSelector] = useState(false);

  // Toggle automation on/off
  const handleToggle = async () => {
    setLoading(true);
    
    try {
      if (automationStatus.isRunning) {
        await automationAPI.stop();
        toast.showSuccess('Automation stopped successfully');
      } else {
        await automationAPI.start();
        toast.showSuccess('Automation started successfully');
      }
      
      // Refresh status
      await fetchAutomationStatus();
    } catch (err) {
      console.error('Error toggling automation:', err);
      toast.showError(err.message || 'Failed to toggle automation');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Post Selection Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Select Posts to Monitor</h2>
          <button
            onClick={() => setShowPostSelector(!showPostSelector)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showPostSelector ? 'Hide Posts' : 'Show Posts'}
          </button>
        </div>

        {selectedPosts.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <span className="font-semibold">✓ {selectedPosts.length} post(s) selected</span> - Automation will monitor only these posts for comments
            </p>
          </div>
        )}

        {showPostSelector && (
          <PostSelector onPostsSelected={setSelectedPosts} />
        )}
      </div>

      {/* Automation Control Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Automation Control</h2>
        
        {/* Status Indicator */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${automationStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-lg font-semibold text-gray-900">
            Status: {automationStatus.isRunning ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            automationStatus.isRunning
              ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
              : 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
          }`}
        >
          {loading ? 'Processing...' : automationStatus.isRunning ? 'Stop Automation' : 'Start Automation'}
        </button>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Last Check</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {formatDate(automationStatus.lastCheck)}
              </p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Comments Processed</p>
              <p className="text-lg font-bold text-green-900 mt-1">
                {automationStatus.commentsProcessed || 0}
              </p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Errors</p>
              <p className="text-lg font-bold text-red-900 mt-1">
                {automationStatus.errors || 0}
              </p>
            </div>
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      
        {/* Additional Info */}
        {automationStatus.isRunning && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">ℹ️ Automation is running:</span> The system is checking for new comments every 30 seconds and will automatically generate and post replies.
              {selectedPosts.length > 0 && (
                <span> Monitoring {selectedPosts.length} selected post(s).</span>
              )}
              {selectedPosts.length === 0 && (
                <span> Monitoring all recent posts.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationControl;
