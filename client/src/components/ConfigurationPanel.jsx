import { useState, useEffect } from 'react';
import { configAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

const ConfigurationPanel = () => {
  const { toast } = useApp();
  
  // API Mode: 'official' (recommended) or 'legacy' (deprecated)
  const [apiMode, setApiMode] = useState('official');
  
  // Official API form data (new multi-tenant - RECOMMENDED)
  const [officialFormData, setOfficialFormData] = useState({
    accessToken: '',
    accountId: '',
    accountName: '',
    replyTone: 'friendly',
    geminiApiKey: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [hasOfficialConfig, setHasOfficialConfig] = useState(false);
  const [validatingApiKey, setValidatingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Load existing configuration on mount
  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      // Check for official API credentials
      const credentialsResponse = await fetch('/api/credentials');
      if (credentialsResponse.ok) {
        const credentialsData = await credentialsResponse.json();
        const instagramPlatform = credentialsData.platforms?.find(p => p.platform === 'instagram');
        
        if (instagramPlatform) {
          setHasOfficialConfig(true);
          setOfficialFormData(prev => ({
            ...prev,
            accountId: instagramPlatform.accountId || '',
            accountName: instagramPlatform.accountName || ''
          }));
        }
      }
      
      // Load reply tone
      const toneResponse = await configAPI.getTone();
      setOfficialFormData(prev => ({
        ...prev,
        replyTone: toneResponse.data.tone || 'friendly'
      }));
    } catch (error) {
      console.log('No existing configuration found');
    }
  };

  const handleOfficialInputChange = (e) => {
    const { name, value } = e.target;
    setOfficialFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Reset validations
    if (name === 'geminiApiKey') {
      setApiKeyValid(null);
    }
    if (name === 'accessToken' || name === 'accountId') {
      setConnectionStatus(null);
    }
  };

  const validateApiKeyFormat = (apiKey) => {
    if (!apiKey || !apiKey.trim()) {
      return 'API key is required';
    }
    
    const trimmed = apiKey.trim();
    
    if (!trimmed.startsWith('AIza')) {
      return 'Invalid API key format. Keys should start with "AIza"';
    }
    
    if (trimmed.length < 30) {
      return 'API key appears to be too short';
    }
    
    return null;
  };

  const handleValidateApiKey = async () => {
    const formatError = validateApiKeyFormat(officialFormData.geminiApiKey);
    if (formatError) {
      setErrors(prev => ({ ...prev, geminiApiKey: formatError }));
      toast.showError(formatError);
      return;
    }

    setValidatingApiKey(true);
    setApiKeyValid(null);

    try {
      await configAPI.validateApiKey(officialFormData.geminiApiKey.trim());
      setApiKeyValid(true);
      toast.showSuccess('API key is valid!');
    } catch (error) {
      setApiKeyValid(false);
      const errorMsg = error.message || 'Invalid API key';
      setErrors(prev => ({ ...prev, geminiApiKey: errorMsg }));
      toast.showError(errorMsg);
    } finally {
      setValidatingApiKey(false);
    }
  };

  const handleTestConnection = async () => {
    if (!officialFormData.accessToken || !officialFormData.accountId) {
      toast.showError('Please enter access token and account ID first');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      // First save the credentials
      await fetch('/api/credentials/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: officialFormData.accessToken.trim(),
          accountId: officialFormData.accountId.trim(),
          accountName: officialFormData.accountName.trim()
        })
      });

      // Then test the connection
      const testResponse = await fetch('/api/credentials/instagram/test', {
        method: 'POST'
      });

      const testData = await testResponse.json();

      if (testData.success) {
        setConnectionStatus({
          success: true,
          accountInfo: testData.accountInfo
        });
        toast.showSuccess('Connection successful!');
      } else {
        setConnectionStatus({
          success: false,
          error: testData.error || 'Connection failed'
        });
        toast.showError(testData.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error.message
      });
      toast.showError(error.message || 'Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleOfficialSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {};
    if (!officialFormData.accessToken.trim()) {
      newErrors.accessToken = 'Access token is required';
    }
    if (!officialFormData.accountId.trim()) {
      newErrors.accountId = 'Account ID is required';
    }
    if (!officialFormData.geminiApiKey.trim()) {
      newErrors.geminiApiKey = 'Gemini API key is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.showError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Save Instagram credentials
      await fetch('/api/credentials/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: officialFormData.accessToken.trim(),
          accountId: officialFormData.accountId.trim(),
          accountName: officialFormData.accountName.trim()
        })
      });

      // Save reply tone
      await configAPI.saveTone(officialFormData.replyTone);

      toast.showSuccess('Configuration saved successfully!');
      setHasOfficialConfig(true);
      
      // Clear sensitive fields
      setOfficialFormData(prev => ({
        ...prev,
        accessToken: '',
        geminiApiKey: ''
      }));
      
      setErrors({});
      setApiKeyValid(null);
      setConnectionStatus(null);
      
      // Reload config
      await loadExistingConfig();
    } catch (error) {
      toast.showError(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    if (!window.confirm('Are you sure you want to clear your Instagram credentials?')) {
      return;
    }

    setLoading(true);

    try {
      await fetch('/api/credentials/instagram', {
        method: 'DELETE'
      });
      
      setOfficialFormData({
        accessToken: '',
        accountId: '',
        accountName: '',
        replyTone: 'friendly',
        geminiApiKey: ''
      });
      setHasOfficialConfig(false);
      setConnectionStatus(null);
      setApiKeyValid(null);
      setErrors({});
      toast.showSuccess('Configuration cleared successfully!');
    } catch (error) {
      toast.showError(error.message || 'Failed to clear configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configuration</h2>
        {hasOfficialConfig && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            ✓ Connected
          </span>
        )}
      </div>

      {/* Info about NEW Instagram API */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">⚠️ Important: New API Scopes Required</h3>
            <p className="mt-1 text-sm text-blue-700">
              When generating your access token, use these <strong>new scope names</strong> (required after Jan 27, 2025):
            </p>
            <ul className="mt-2 text-xs text-blue-600 space-y-1 ml-4 list-disc">
              <li><code className="bg-blue-100 px-1 rounded">instagram_business_basic</code></li>
              <li><code className="bg-blue-100 px-1 rounded">instagram_business_manage_comments</code></li>
            </ul>
            <p className="mt-2 text-xs text-blue-600">
              See <strong>INSTAGRAM_API_SETUP.md</strong> for complete setup instructions.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleOfficialSubmit} className="space-y-6">
        {/* Instagram Official API Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Instagram Business Account</h3>
          
          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
              Access Token *
            </label>
            <textarea
              id="accessToken"
              name="accessToken"
              value={officialFormData.accessToken}
              onChange={handleOfficialInputChange}
              rows={3}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:border-transparent outline-none transition font-mono text-sm ${
                errors.accessToken 
                  ? 'border-red-500 focus:ring-red-500' 
                  : connectionStatus?.success
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Your Instagram long-lived access token"
              required
            />
            {errors.accessToken && (
              <p className="mt-1 text-sm text-red-600">{errors.accessToken}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Generate token: <code className="bg-gray-100 px-1 rounded">node server/utils/instagram-oauth-helper.js</code>
            </p>
          </div>

          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
              Instagram Account ID *
            </label>
            <input
              type="text"
              id="accountId"
              name="accountId"
              value={officialFormData.accountId}
              onChange={handleOfficialInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:border-transparent outline-none transition ${
                errors.accountId 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Your Instagram Business Account ID"
              required
            />
            {errors.accountId && (
              <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>
            )}
          </div>

          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
              Account Name (Optional)
            </label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              value={officialFormData.accountName}
              onChange={handleOfficialInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="@your_instagram_username"
            />
            <p className="mt-1 text-xs text-gray-500">
              For display purposes only
            </p>
          </div>

          {/* Test Connection Button */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection || !officialFormData.accessToken || !officialFormData.accountId}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {testingConnection ? 'Testing Connection...' : 'Test Connection'}
          </button>

          {/* Connection Status */}
          {connectionStatus && (
            <div className={`p-4 rounded-md ${
              connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h4 className={`font-medium ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                {connectionStatus.success ? '✓ Connection Successful' : '✗ Connection Failed'}
              </h4>
              {connectionStatus.accountInfo && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Username: @{connectionStatus.accountInfo.username}</p>
                  <p>Name: {connectionStatus.accountInfo.name}</p>
                  <p>Followers: {connectionStatus.accountInfo.followersCount?.toLocaleString()}</p>
                </div>
              )}
              {connectionStatus.error && (
                <p className="mt-2 text-sm text-red-700">{connectionStatus.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Reply Tone Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Reply Tone</h3>
          
          <div className="space-y-2">
            {['friendly', 'formal', 'professional'].map((tone) => (
              <label key={tone} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="replyTone"
                  value={tone}
                  checked={officialFormData.replyTone === tone}
                  onChange={handleOfficialInputChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900 capitalize">{tone}</span>
                  <p className="text-sm text-gray-500">
                    {tone === 'friendly' && 'Casual and approachable responses'}
                    {tone === 'formal' && 'Polite and professional responses'}
                    {tone === 'professional' && 'Business-focused corporate responses'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Gemini API Key Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">AI Configuration</h3>
          
          <div>
            <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key *
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                id="geminiApiKey"
                name="geminiApiKey"
                value={officialFormData.geminiApiKey}
                onChange={handleOfficialInputChange}
                className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.geminiApiKey 
                    ? 'border-red-500 focus:ring-red-500' 
                    : apiKeyValid === true
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="AIza..."
                required
              />
              <button
                type="button"
                onClick={handleValidateApiKey}
                disabled={validatingApiKey || !officialFormData.geminiApiKey.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {validatingApiKey ? 'Validating...' : 'Validate'}
              </button>
            </div>
            {errors.geminiApiKey && (
              <p className="mt-1 text-sm text-red-600">{errors.geminiApiKey}</p>
            )}
            {apiKeyValid === true && !errors.geminiApiKey && (
              <p className="mt-1 text-sm text-green-600">✓ API key is valid</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Get your free API key from{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Saving...' : hasOfficialConfig ? 'Update Configuration' : 'Save Configuration'}
          </button>
          
          {hasOfficialConfig && (
            <button
              type="button"
              onClick={handleClearConfig}
              disabled={loading}
              className="px-6 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">🎉 NEW: No Facebook Page Required!</h4>
        <p className="text-sm text-blue-700 mb-3">
          We're using the latest Instagram API (2024) that doesn't require a Facebook Page connection.
        </p>
        <h5 className="text-sm font-medium text-blue-900 mb-2">Setup Steps:</h5>
        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
          <li>Create a Meta App at <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com/apps</a></li>
          <li>Add <strong>"Instagram API with Instagram Login"</strong> product (NEW!)</li>
          <li>Run: <code className="bg-blue-100 px-1 rounded">node server/utils/instagram-oauth-helper.js</code></li>
          <li>Follow the OAuth flow to get your access token</li>
          <li>Paste the credentials here and test the connection</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          ℹ️ Make sure you have an Instagram Business or Creator account (not personal)
        </p>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
