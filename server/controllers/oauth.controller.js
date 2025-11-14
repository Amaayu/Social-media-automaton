const InstagramOAuthService = require('../services/oauth-instagram.service');
const YouTubeOAuthService = require('../services/oauth-youtube.service');
const User = require('../models/User');
const { EncryptionService } = require('../services/encryption.service');

const encryptionService = new EncryptionService();
const instagramOAuth = new InstagramOAuthService();
const youtubeOAuth = new YouTubeOAuthService();

class OAuthController {
  /**
   * POST /api/oauth/instagram/config
   * Save Instagram OAuth client credentials
   */
  async saveInstagramOAuthConfig(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      const { clientId, clientSecret } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({
          success: false,
          error: 'Client ID and Client Secret are required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Encrypt credentials
      const encryptedClientId = encryptionService.encrypt(clientId);
      const encryptedClientSecret = encryptionService.encrypt(clientSecret);

      // Update user
      if (!user.instagramCredentials) {
        user.instagramCredentials = {};
      }
      user.instagramCredentials.clientId = encryptedClientId;
      user.instagramCredentials.clientSecret = encryptedClientSecret;
      user.instagramCredentials.lastUpdated = new Date();

      await user.save();

      res.json({
        success: true,
        message: 'Instagram OAuth configuration saved successfully'
      });
    } catch (error) {
      console.error('[OAuth] Save Instagram config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/oauth/instagram/auth-url
   * Generate Instagram OAuth authorization URL
   */
  async getInstagramAuthUrl(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user || !user.instagramCredentials?.clientId) {
        return res.status(400).json({
          success: false,
          error: 'Instagram OAuth not configured. Please save client credentials first.'
        });
      }

      // Decrypt client ID
      const clientId = encryptionService.decrypt(user.instagramCredentials.clientId);
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/instagram/callback`;

      const { url, state } = instagramOAuth.generateAuthUrl(clientId, redirectUri);

      // Store state in session or database for validation
      req.session = req.session || {};
      req.session.instagramOAuthState = state;

      res.json({
        success: true,
        authUrl: url,
        state
      });
    } catch (error) {
      console.error('[OAuth] Get Instagram auth URL error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/oauth/instagram/callback
   * Handle Instagram OAuth callback
   */
  async handleInstagramCallback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code not provided'
        });
      }

      // Validate state (CSRF protection)
      // In production, validate against stored state

      const userId = req.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user || !user.instagramCredentials?.clientId) {
        return res.status(400).json({
          success: false,
          error: 'Instagram OAuth not configured'
        });
      }

      // Decrypt credentials
      const clientId = encryptionService.decrypt(user.instagramCredentials.clientId);
      const clientSecret = encryptionService.decrypt(user.instagramCredentials.clientSecret);
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/instagram/callback`;

      // Exchange code for token
      const tokenResult = await instagramOAuth.exchangeCodeForToken(
        clientId,
        clientSecret,
        code,
        redirectUri
      );

      if (!tokenResult.success) {
        return res.status(400).json({
          success: false,
          error: tokenResult.error
        });
      }

      // Get long-lived token
      const longLivedResult = await instagramOAuth.getLongLivedToken(
        clientSecret,
        tokenResult.accessToken
      );

      if (!longLivedResult.success) {
        return res.status(400).json({
          success: false,
          error: longLivedResult.error
        });
      }

      // Validate and get account info
      const validation = await instagramOAuth.validateToken(longLivedResult.accessToken);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Encrypt and save token
      const encryptedToken = encryptionService.encrypt(longLivedResult.accessToken);
      const expiresAt = new Date(Date.now() + longLivedResult.expiresIn * 1000);

      user.instagramCredentials.accessToken = encryptedToken;
      user.instagramCredentials.accountId = validation.accountId;
      user.instagramCredentials.accountName = validation.username;
      user.instagramCredentials.tokenExpiresAt = expiresAt;
      user.instagramCredentials.isActive = true;
      user.instagramCredentials.lastUpdated = new Date();

      await user.save();

      // Redirect back to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/oauth-config?instagram=success&account=${encodeURIComponent(validation.username)}`);
    } catch (error) {
      console.error('[OAuth] Instagram callback error:', error);
      // Redirect back to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/oauth-config?instagram=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * POST /api/oauth/youtube/config
   * Save YouTube OAuth client credentials
   */
  async saveYouTubeOAuthConfig(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      const { clientId, clientSecret } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({
          success: false,
          error: 'Client ID and Client Secret are required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Encrypt credentials
      const encryptedClientId = encryptionService.encrypt(clientId);
      const encryptedClientSecret = encryptionService.encrypt(clientSecret);

      // Update user
      if (!user.youtubeCredentials) {
        user.youtubeCredentials = {};
      }
      user.youtubeCredentials.clientId = encryptedClientId;
      user.youtubeCredentials.clientSecret = encryptedClientSecret;
      user.youtubeCredentials.lastUpdated = new Date();

      await user.save();

      res.json({
        success: true,
        message: 'YouTube OAuth configuration saved successfully'
      });
    } catch (error) {
      console.error('[OAuth] Save YouTube config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/oauth/youtube/auth-url
   * Generate YouTube OAuth authorization URL
   */
  async getYouTubeAuthUrl(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user || !user.youtubeCredentials?.clientId) {
        return res.status(400).json({
          success: false,
          error: 'YouTube OAuth not configured. Please save client credentials first.'
        });
      }

      // Decrypt client credentials
      const clientId = encryptionService.decrypt(user.youtubeCredentials.clientId);
      const clientSecret = encryptionService.decrypt(user.youtubeCredentials.clientSecret);
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/youtube/callback`;

      const { url, state } = youtubeOAuth.generateAuthUrl(clientId, clientSecret, redirectUri);

      // Store state for validation
      req.session = req.session || {};
      req.session.youtubeOAuthState = state;

      res.json({
        success: true,
        authUrl: url,
        state
      });
    } catch (error) {
      console.error('[OAuth] Get YouTube auth URL error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/oauth/youtube/callback
   * Handle YouTube OAuth callback
   */
  async handleYouTubeCallback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code not provided'
        });
      }

      const userId = req.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user || !user.youtubeCredentials?.clientId) {
        return res.status(400).json({
          success: false,
          error: 'YouTube OAuth not configured'
        });
      }

      // Decrypt credentials
      const clientId = encryptionService.decrypt(user.youtubeCredentials.clientId);
      const clientSecret = encryptionService.decrypt(user.youtubeCredentials.clientSecret);
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/youtube/callback`;

      // Exchange code for tokens
      const tokenResult = await youtubeOAuth.exchangeCodeForToken(
        clientId,
        clientSecret,
        code,
        redirectUri
      );

      if (!tokenResult.success) {
        return res.status(400).json({
          success: false,
          error: tokenResult.error
        });
      }

      // Validate and get channel info
      const validation = await youtubeOAuth.validateToken(
        tokenResult.accessToken,
        clientId,
        clientSecret
      );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Encrypt and save tokens
      const encryptedAccessToken = encryptionService.encrypt(tokenResult.accessToken);
      const encryptedRefreshToken = encryptionService.encrypt(tokenResult.refreshToken);
      const expiresAt = new Date(tokenResult.expiresIn);

      user.youtubeCredentials.accessToken = encryptedAccessToken;
      user.youtubeCredentials.refreshToken = encryptedRefreshToken;
      user.youtubeCredentials.channelId = validation.channelId;
      user.youtubeCredentials.channelName = validation.channelTitle;
      user.youtubeCredentials.tokenExpiresAt = expiresAt;
      user.youtubeCredentials.isActive = true;
      user.youtubeCredentials.lastUpdated = new Date();

      await user.save();

      // Redirect back to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/oauth-config?youtube=success&channel=${encodeURIComponent(validation.channelTitle)}`);
    } catch (error) {
      console.error('[OAuth] YouTube callback error:', error);
      // Redirect back to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/oauth-config?youtube=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * POST /api/oauth/instagram/refresh
   * Refresh Instagram access token
   */
  async refreshInstagramToken(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user || !user.instagramCredentials?.accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Instagram not connected'
        });
      }

      // Decrypt token
      const accessToken = encryptionService.decrypt(user.instagramCredentials.accessToken);

      // Refresh token
      const refreshResult = await instagramOAuth.refreshToken(accessToken);

      if (!refreshResult.success) {
        return res.status(400).json({
          success: false,
          error: refreshResult.error
        });
      }

      // Encrypt and save new token
      const encryptedToken = encryptionService.encrypt(refreshResult.accessToken);
      const expiresAt = new Date(Date.now() + refreshResult.expiresIn * 1000);

      user.instagramCredentials.accessToken = encryptedToken;
      user.instagramCredentials.tokenExpiresAt = expiresAt;
      user.instagramCredentials.lastUpdated = new Date();

      await user.save();

      res.json({
        success: true,
        message: 'Instagram token refreshed successfully',
        expiresAt
      });
    } catch (error) {
      console.error('[OAuth] Instagram refresh error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/oauth/youtube/refresh
   * Refresh YouTube access token
   */
  async refreshYouTubeToken(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user || !user.youtubeCredentials?.refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'YouTube not connected'
        });
      }

      // Decrypt credentials
      const clientId = encryptionService.decrypt(user.youtubeCredentials.clientId);
      const clientSecret = encryptionService.decrypt(user.youtubeCredentials.clientSecret);
      const refreshToken = encryptionService.decrypt(user.youtubeCredentials.refreshToken);

      // Refresh token
      const refreshResult = await youtubeOAuth.refreshAccessToken(
        clientId,
        clientSecret,
        refreshToken
      );

      if (!refreshResult.success) {
        return res.status(400).json({
          success: false,
          error: refreshResult.error
        });
      }

      // Encrypt and save new token
      const encryptedToken = encryptionService.encrypt(refreshResult.accessToken);
      const expiresAt = new Date(refreshResult.expiresIn);

      user.youtubeCredentials.accessToken = encryptedToken;
      user.youtubeCredentials.tokenExpiresAt = expiresAt;
      user.youtubeCredentials.lastUpdated = new Date();

      await user.save();

      res.json({
        success: true,
        message: 'YouTube token refreshed successfully',
        expiresAt
      });
    } catch (error) {
      console.error('[OAuth] YouTube refresh error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = OAuthController;
