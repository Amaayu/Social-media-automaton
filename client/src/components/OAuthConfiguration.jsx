import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OAuthConfiguration() {
  const [instagramConfig, setInstagramConfig] = useState({
    clientId: '',
    clientSecret: '',
    configured: false,
    connected: false
  });

  const [youtubeConfig, setYoutubeConfig] = useState({
    clientId: '',
    clientSecret: '',
    configured: false,
    connected: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    checkCredentialsStatus();
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // YouTube callback
    if (urlParams.get('youtube') === 'success') {
      const channel = urlParams.get('channel');
      setMessage({
        type: 'success',
        text: `✅ YouTube connected successfully! Channel: ${channel}`
      });
      // Clean URL
      window.history.replaceState({}, '', '/oauth-config');
      // Refresh status
      setTimeout(() => checkCredentialsStatus(), 1000);
    } else if (urlParams.get('youtube') === 'error') {
      const errorMsg = urlParams.get('message');
      setMessage({
        type: 'error',
        text: `❌ YouTube connection failed: ${errorMsg}`
      });
      window.history.replaceState({}, '', '/oauth-config');
    }
    
    // Instagram callback
    if (urlParams.get('instagram') === 'success') {
      const account = urlParams.get('account');
      setMessage({
        type: 'success',
        text: `✅ Instagram connected successfully! Account: @${account}`
      });
      window.history.replaceState({}, '', '/oauth-config');
      setTimeout(() => checkCredentialsStatus(), 1000);
    } else if (urlParams.get('instagram') === 'error') {
      const errorMsg = urlParams.get('message');
      setMessage({
        type: 'error',
        text: `❌ Instagram connection failed: ${errorMsg}`
      });
      window.history.replaceState({}, '', '/oauth-config');
    }
  }, []);

  const checkCredentialsStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/credentials', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInstagramConfig(prev => ({
          ...prev,
          configured: response.data.credentials.instagram.configured,
          connected: response.data.credentials.instagram.configured
        }));

        setYoutubeConfig(prev => ({
          ...prev,
          configured: response.data.credentials.youtube?.configured || false,
          connected: response.data.credentials.youtube?.configured || false
        }));
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  };

  const saveInstagramConfig = async () => {
    if (!instagramConfig.clientId || !instagramConfig.clientSecret) {
      setMessage({ type: 'error', text: 'Please enter both Client ID and Client Secret' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/oauth/instagram/config',
        {
          clientId: instagramConfig.clientId,
          clientSecret: instagramConfig.clientSecret
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Instagram OAuth configured! Now click "Connect Instagram" to authorize.' });
        setInstagramConfig(prev => ({ ...prev, configured: true }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const connectInstagram = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/oauth/instagram/auth-url', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Open OAuth flow in popup or redirect
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to get authorization URL' });
      setLoading(false);
    }
  };

  const saveYouTubeConfig = async () => {
    if (!youtubeConfig.clientId || !youtubeConfig.clientSecret) {
      setMessage({ type: 'error', text: 'Please enter both Client ID and Client Secret' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/oauth/youtube/config',
        {
          clientId: youtubeConfig.clientId,
          clientSecret: youtubeConfig.clientSecret
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'YouTube OAuth configured! Now click "Connect YouTube" to authorize.' });
        setYoutubeConfig(prev => ({ ...prev, configured: true }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const connectYouTube = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/oauth/youtube/auth-url', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Open OAuth flow in popup or redirect
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to get authorization URL' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">OAuth Configuration</h2>
        
        {message.text && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Instagram OAuth */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📸</span>
            Instagram OAuth
            {instagramConfig.connected && (
              <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
            )}
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">Required Scopes:</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li><code>instagram_business_basic</code></li>
              <li><code>instagram_business_content_publish</code></li>
              <li><code>instagram_business_manage_comments</code></li>
            </ul>
            <p className="mt-2 text-sm text-blue-700">
              Get your OAuth credentials from{' '}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                Facebook Developers
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={instagramConfig.clientId}
                onChange={(e) => setInstagramConfig({ ...instagramConfig, clientId: e.target.value })}
                disabled={loading || instagramConfig.connected}
                placeholder="Enter Instagram App Client ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={instagramConfig.clientSecret}
                onChange={(e) => setInstagramConfig({ ...instagramConfig, clientSecret: e.target.value })}
                disabled={loading || instagramConfig.connected}
                placeholder="Enter Instagram App Client Secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex space-x-4">
              {!instagramConfig.configured && (
                <button
                  onClick={saveInstagramConfig}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Save Configuration
                </button>
              )}
              
              {instagramConfig.configured && !instagramConfig.connected && (
                <button
                  onClick={connectInstagram}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Connect Instagram
                </button>
              )}

              {instagramConfig.connected && (
                <button
                  onClick={connectInstagram}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Reconnect Instagram
                </button>
              )}
            </div>
          </div>
        </div>

        {/* YouTube OAuth */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🎬</span>
            YouTube OAuth
            {youtubeConfig.connected && (
              <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
            )}
          </h3>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h4 className="font-semibold text-red-900 mb-2">Required Scopes:</h4>
            <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
              <li><code>https://www.googleapis.com/auth/youtube.upload</code></li>
              <li><code>https://www.googleapis.com/auth/youtube.force-ssl</code></li>
            </ul>
            <p className="mt-2 text-sm text-red-700">
              Get your OAuth credentials from{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={youtubeConfig.clientId}
                onChange={(e) => setYoutubeConfig({ ...youtubeConfig, clientId: e.target.value })}
                disabled={loading || youtubeConfig.connected}
                placeholder="Enter Google OAuth Client ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={youtubeConfig.clientSecret}
                onChange={(e) => setYoutubeConfig({ ...youtubeConfig, clientSecret: e.target.value })}
                disabled={loading || youtubeConfig.connected}
                placeholder="Enter Google OAuth Client Secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex space-x-4">
              {!youtubeConfig.configured && (
                <button
                  onClick={saveYouTubeConfig}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  Save Configuration
                </button>
              )}
              
              {youtubeConfig.configured && !youtubeConfig.connected && (
                <button
                  onClick={connectYouTube}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Connect YouTube
                </button>
              )}

              {youtubeConfig.connected && (
                <button
                  onClick={connectYouTube}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Reconnect YouTube
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
