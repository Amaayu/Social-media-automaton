import { useState, useEffect } from 'react';
import { configAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

const ConfigurationPanel = () => {
  const { toast } = useApp();
  
  // API Mode: 'official' or 'legacy'
  const [apiMode, setApiMode] = useState('official');
  
  // Legacy form data (old unofficial API)
  const [formData, setFormData] = useState({
    instagramUsername: '',
    instagramPassword: '',
    replyTone: 'friendly',
    geminiApiKey: ''
  });
  
  // Official API form data (new multi-tenant)
  const [officialFormData, setOfficialFormData] = useState({
    accessToken: '',
    accountId: '',
    accountName: '',
    replyTone: 'friendly',
    geminiApiKey: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
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
      // Check for official API credentials first
      const credentialsResponse = await fetch('/api/credentials');
      if (credentialsResponse.ok) {
        const credentialsData = await credentialsResponse.json();
        const instagramPlatform = credentialsData.platforms?.find(p => p.platform === 'instagram');
        
        if (instagramPlatform) {
          setHasOfficialConfig(true);
          setApiMode('official');
          setOfficialFormData(prev => ({
            ...prev,
            accountId: instagramPlatform.accountId || '',
            accountName: instagramPlatform.accountName || ''
          }));
        }
      }
      
      // Also check for legacy config
      const [instagramResponse, toneResponse] = await Promise.all([
        configAPI.getInstagramConfig(),
        configAPI.getTone()
      ]);
      
      if (instagramResponse.data && instagramResponse.data.configured) {
        setFormData(prev => ({
          ...prev,
          instagramUsername: instagramResponse.data.username || '',
          replyTone: toneResponse.data.tone || 'friendly'
        }));
        setOfficialFormData(prev => ({
          ...prev,
          replyTone: toneResponse.data.tone || 'friendly'
        }));
        setHasExistingConfig(true);
        
        // If no official config, default to legacy mode
        if (!hasOfficialConfig) {
          setApiMode('legacy');
        }
      }
    } catch (error) {
      // No existing config or error loading - that's okay
      console.log('No existing configuration found');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Reset API key validation when key changes
    if (name === 'geminiApiKey') {
      setApiKeyValid(null);
    }
  };

  const validateUsername = (username) => {
    if (!username || !username.trim()) {
      return 'Username is required';
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length > 30) {
      return 'Username cannot exceed 30 characters';
    }
    
    // Instagram usernames can only contain letters, numbers, periods, and underscores
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmed)) {
      return 'Username can only contain letters, numbers, periods, and underscores';
    }
    
    return null;
  };

  const validatePassword = (password) => {
    if (!password || !password.trim()) {
      return 'Password is required';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    if (password.length > 128) {
      return 'Password cannot exceed 128 characters';
    }
    
    return null;
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
    
    if (trimmed.length > 50) {
      return 'API key appears to be too long';
    }
    
    const apiKeyRegex = /^[A-Za-z0-9_-]+$/;
    if (!apiKeyRegex.test(trimmed)) {
      return 'API key contains invalid characters';
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate username
    const usernameError = validateUsername(formData.instagramUsername);
    if (usernameError) {
      newErrors.instagramUsername = usernameError;
    }
    
    // Validate password (only if not updating existing config or if password is provided)
    if (!hasExistingConfig || formData.instagramPassword.trim()) {
      const passwordError = validatePassword(formData.instagramPassword);
      if (passwordError) {
        newErrors.instagramPassword = passwordError;
      }
    }
    
    // Validate API key format
    const apiKeyError = validateApiKeyFormat(formData.geminiApiKey);
    if (apiKeyError) {
      newErrors.geminiApiKey = apiKeyError;
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.showError('Please fix the validation errors');
      return false;
    }
    
    return true;
  };

  const handleValidateApiKey = async () => {
    // First check format
    const formatError = validateApiKeyFormat(formData.geminiApiKey);
    if (formatError) {
      setErrors(prev => ({ ...prev, geminiApiKey: formatError }));
      toast.showError(formatError);
      return;
    }

    setValidatingApiKey(true);
    setApiKeyValid(null);

    try {
      await configAPI.validateApiKey(formData.geminiApiKey.trim());
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Save Instagram credentials (only if password is provided or it's a new config)
      if (!hasExistingConfig || formData.instagramPassword.trim()) {
        await configAPI.saveInstagramConfig({
          username: formData.instagramUsername.trim(),
          password: formData.instagramPassword
        });
      }

      // Save reply tone
      await configAPI.saveTone(formData.replyTone);

      toast.showSuccess(
        hasExistingConfig 
          ? 'Configuration updated successfully!' 
          : 'Configuration saved successfully!'
      );
      setHasExistingConfig(true);
      
      // Clear password field for security
      setFormData(prev => ({
        ...prev,
        instagramPassword: '',
        geminiApiKey: '' // Also clear API key for security
      }));
      
      // Clear validation states
      setApiKeyValid(null);
      setErrors({});
    } catch (error) {
      toast.showError(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    if (!window.confirm('Are you sure you want to clear all saved credentials?')) {
      return;
    }

    setLoading(true);

    try {
      await configAPI.deleteInstagramConfig();
      
      setFormData({
        instagramUsername: '',
        instagramPassword: '',
        replyTone: 'friendly',
        geminiApiKey: ''
      });
      setHasExistingConfig(false);
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuration</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Instagram Credentials Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Instagram Account</h3>
          
          <div>
            <label htmlFor="instagramUsername" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="instagramUsername"
              name="instagramUsername"
              value={formData.instagramUsername}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:border-transparent outline-none transition ${
                errors.instagramUsername 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="your_instagram_username"
              required
            />
            {errors.instagramUsername && (
              <p className="mt-1 text-sm text-red-600">{errors.instagramUsername}</p>
            )}
          </div>

          <div>
            <label htmlFor="instagramPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="instagramPassword"
              name="instagramPassword"
              value={formData.instagramPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:border-transparent outline-none transition ${
                errors.instagramPassword 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="••••••••"
              required={!hasExistingConfig}
            />
            {errors.instagramPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.instagramPassword}</p>
            )}
            {hasExistingConfig && !errors.instagramPassword && (
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to keep existing password
              </p>
            )}
          </div>
        </div>

        {/* Reply Tone Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Reply Tone</h3>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition">
              <input
                type="radio"
                name="replyTone"
                value="friendly"
                checked={formData.replyTone === 'friendly'}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Friendly</span>
                <p className="text-sm text-gray-500">Casual and approachable responses</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition">
              <input
                type="radio"
                name="replyTone"
                value="formal"
                checked={formData.replyTone === 'formal'}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Formal</span>
                <p className="text-sm text-gray-500">Polite and professional responses</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition">
              <input
                type="radio"
                name="replyTone"
                value="professional"
                checked={formData.replyTone === 'professional'}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Professional</span>
                <p className="text-sm text-gray-500">Business-focused corporate responses</p>
              </div>
            </label>
          </div>
        </div>

        {/* Gemini API Key Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">AI Configuration</h3>
          
          <div>
            <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                id="geminiApiKey"
                name="geminiApiKey"
                value={formData.geminiApiKey}
                onChange={handleInputChange}
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
                disabled={validatingApiKey || !formData.geminiApiKey.trim()}
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
            {!errors.geminiApiKey && apiKeyValid !== true && (
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
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Saving...' : hasExistingConfig ? 'Update Configuration' : 'Save Configuration'}
          </button>
          
          {hasExistingConfig && (
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
    </div>
  );
};

export default ConfigurationPanel;
