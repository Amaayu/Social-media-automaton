const axios = require('axios');
const crypto = require('crypto');

/**
 * Instagram OAuth Service
 * Handles OAuth 2.0 flow for Instagram Graph API
 */
class InstagramOAuthService {
  constructor() {
    this.authUrl = 'https://api.instagram.com/oauth/authorize';
    this.tokenUrl = 'https://api.instagram.com/oauth/access_token';
    this.graphApiUrl = 'https://graph.instagram.com';
    
    // Required scopes for Instagram automation
    this.requiredScopes = [
      'instagram_business_basic',
      'instagram_business_content_publish',
      'instagram_business_manage_comments'
    ];
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(clientId, redirectUri, state = null) {
    const stateParam = state || crypto.randomBytes(16).toString('hex');
    const scope = this.requiredScopes.join(',');
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code',
      state: stateParam
    });

    return {
      url: `${this.authUrl}?${params.toString()}`,
      state: stateParam
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(clientId, clientSecret, code, redirectUri) {
    try {
      const response = await axios.post(this.tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        userId: response.data.user_id,
        expiresIn: response.data.expires_in || 3600
      };
    } catch (error) {
      console.error('[InstagramOAuth] Token exchange error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_message || error.message
      };
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async getLongLivedToken(clientSecret, shortLivedToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortLivedToken
        }
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in // ~5184000 seconds (60 days)
      };
    } catch (error) {
      console.error('[InstagramOAuth] Long-lived token error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Refresh long-lived token (before expiration)
   */
  async refreshToken(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('[InstagramOAuth] Token refresh error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Validate access token and get account info
   */
  async validateToken(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return {
        success: true,
        accountId: response.data.id,
        username: response.data.username,
        accountType: response.data.account_type,
        mediaCount: response.data.media_count
      };
    } catch (error) {
      console.error('[InstagramOAuth] Token validation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get token expiration info
   */
  async getTokenInfo(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/debug_token`, {
        params: {
          input_token: accessToken,
          access_token: accessToken
        }
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('[InstagramOAuth] Token info error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

module.exports = InstagramOAuthService;
