import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Platform Settings Page
 * Allows users to configure their own Instagram/Facebook credentials
 */
export default function PlatformSettings() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instagram');
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [instagramForm, setInstagramForm] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    accountId: '',
    accountName: ''
  });

  const [facebookForm, setFacebookForm] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    pageId: '',
    pageName: ''
  });

  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const response = await axios.get('/api/credentials');
      setPlatforms(response.data.platforms || []);
      
      // Load existing credentials if available
      for (const platform of response.data.platforms) {
        if (platform.platform === 'instagram') {
          const creds = await axios.get('/api/credentials/instagram');
          setInstagramForm({
            appId: creds.data.credentials.appId || '',
            appSecret: '',
            accessToken: '',
            accountId: creds.data.credentials.accountId || '',
            accountName: creds.data.credentials.accountName || ''
          });
        } else if (platform.platform === 'facebook') {
          const creds = await axios.get('/api/credentials/facebook');
          setFacebookForm({
            appId: creds.data.credentials.appId || '',
            appSecret: '',
            accessToken: '',
            pageId: creds.data.credentials.accountId || '',
            pageName: creds.data.credentials.accountName || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInstagram = async (e) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      await axios.post('/api/credentials/instagram', instagramForm);
      alert('Instagram credentials saved successfully!');
      await loadPlatforms();
      setShowForm(false);
    } catch (error) {
      alert('Error saving Instagram credentials: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFacebook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      await axios.post('/api/credentials/facebook', facebookForm);
      alert('Facebook credentials saved successfully!');
      await loadPlatforms();
      setShowForm(false);
    } catch (error) {
      alert('Error saving Facebook credentials: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTestCredentials = async (platform) => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await axios.post(`/api/credentials/${platform}/test`);
      setTestResult(response.data.test);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTogglePlatform = async (platform, isActive) => {
    try {
      await axios.patch(`/api/credentials/${platform}/toggle`, { isActive });
      await loadPlatforms();
    } catch (error) {
      alert('Error toggling platform: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeletePlatform = async (platform) => {
    if (!confirm(`Are you sure you want to delete ${platform} credentials?`)) {
      return;
    }

    try {
      await axios.delete(`/api/credentials/${platform}`);
      await loadPlatforms();
      alert(`${platform} credentials deleted successfully`);
    } catch (error) {
      alert('Error deleting credentials: ' + (error.response?.data?.error || error.message));
    }
  };

  const getPlatformConfig = (platformName) => {
    return platforms.find(p => p.platform === platformName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading platforms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your social media credentials to enable automation
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('instagram')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'instagram'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Instagram
          </button>
          <button
            onClick={() => setActiveTab('facebook')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'facebook'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Facebook
          </button>
        </nav>
      </div>

      {/* Instagram Tab */}
      {activeTab === 'instagram' && (
        <div className="space-y-6">
          {getPlatformConfig('instagram') ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Instagram Connected</h3>
                  <p className="text-sm text-gray-500">
                    Account: {getPlatformConfig('instagram').accountName || getPlatformConfig('instagram').accountId}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last updated: {new Date(getPlatformConfig('instagram').updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getPlatformConfig('instagram').isActive}
                      onChange={(e) => handleTogglePlatform('instagram', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <button
                    onClick={() => handleTestCredentials('instagram')}
                    disabled={testing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDeletePlatform('instagram')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`mt-4 p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? '✓ Connection Successful' : '✗ Connection Failed'}
                  </h4>
                  {testResult.accountInfo && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>Username: @{testResult.accountInfo.username}</p>
                      <p>Name: {testResult.accountInfo.name}</p>
                      <p>Followers: {testResult.accountInfo.followersCount?.toLocaleString()}</p>
                    </div>
                  )}
                  {testResult.error && (
                    <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Instagram account connected</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your Instagram credentials</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Instagram Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instagram Form */}
          {showForm && activeTab === 'instagram' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Instagram Credentials</h3>
              <form onSubmit={handleSaveInstagram} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">App ID (Optional)</label>
                  <input
                    type="text"
                    value={instagramForm.appId}
                    onChange={(e) => setInstagramForm({ ...instagramForm, appId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Your Meta App ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">App Secret (Optional)</label>
                  <input
                    type="password"
                    value={instagramForm.appSecret}
                    onChange={(e) => setInstagramForm({ ...instagramForm, appSecret: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Your Meta App Secret"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Token *</label>
                  <textarea
                    value={instagramForm.accessToken}
                    onChange={(e) => setInstagramForm({ ...instagramForm, accessToken: e.target.value })}
                    required
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
                    placeholder="Your Instagram long-lived access token"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get this from Meta Developer Console or use the OAuth helper
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Instagram Account ID *</label>
                  <input
                    type="text"
                    value={instagramForm.accountId}
                    onChange={(e) => setInstagramForm({ ...instagramForm, accountId: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Your Instagram Business Account ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Name (Optional)</label>
                  <input
                    type="text"
                    value={instagramForm.accountName}
                    onChange={(e) => setInstagramForm({ ...instagramForm, accountName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="@your_instagram_username"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">How to get your credentials:</h4>
                <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>Create a Meta App at developers.facebook.com/apps</li>
                  <li>Add Instagram product to your app</li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">node server/utils/instagram-oauth-helper.js</code></li>
                  <li>Follow the OAuth flow to get your access token</li>
                  <li>Paste the credentials here</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Facebook Tab */}
      {activeTab === 'facebook' && (
        <div className="space-y-6">
          {getPlatformConfig('facebook') ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Facebook Connected</h3>
                  <p className="text-sm text-gray-500">
                    Page: {getPlatformConfig('facebook').accountName || getPlatformConfig('facebook').accountId}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getPlatformConfig('facebook').isActive}
                      onChange={(e) => handleTogglePlatform('facebook', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDeletePlatform('facebook')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-8">
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Facebook page connected</h3>
                <p className="mt-1 text-sm text-gray-500">Add your Facebook page credentials to enable automation</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Facebook Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Facebook Form - Similar structure to Instagram */}
          {showForm && activeTab === 'facebook' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Facebook Page Credentials</h3>
              <form onSubmit={handleSaveFacebook} className="space-y-4">
                {/* Similar form fields for Facebook */}
                <div className="text-center py-8 text-gray-500">
                  Facebook integration coming soon...
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
