const User = require('../models/User');
const { EncryptionService } = require('../services/encryption.service');
const AIReplyService = require('../services/ai-reply.service');

/**
 * ConfigController - Handles configuration management
 */
class ConfigController {
  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * POST /api/config/instagram - Save Instagram credentials
   */
  async saveInstagramCredentials(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { accessToken, accountId, accountName, appId } = req.body;

      if (!accessToken || !accountId) {
        return res.status(400).json({
          success: false,
          error: 'Access token and account ID are required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Encrypt the access token
      const encryptedToken = this.encryptionService.encrypt(accessToken);

      user.instagramCredentials = {
        accessToken: encryptedToken,
        accountId,
        accountName: accountName || '',
        appId: appId || '',
        isActive: true,
        lastUpdated: new Date()
      };

      await user.save();

      res.json({
        success: true,
        message: 'Instagram credentials saved successfully'
      });
    } catch (error) {
      console.error('Error saving Instagram credentials:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save Instagram credentials'
      });
    }
  }

  /**
   * GET /api/config/instagram - Get Instagram configuration
   */
  async getInstagramConfig(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const user = await User.findById(userId);
      if (!user || !user.instagramCredentials) {
        return res.json({
          success: true,
          configured: false
        });
      }

      res.json({
        success: true,
        configured: true,
        accountId: user.instagramCredentials.accountId,
        accountName: user.instagramCredentials.accountName,
        appId: user.instagramCredentials.appId,
        isActive: user.instagramCredentials.isActive,
        lastUpdated: user.instagramCredentials.lastUpdated
      });
    } catch (error) {
      console.error('Error getting Instagram config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve Instagram configuration'
      });
    }
  }

  /**
   * DELETE /api/config/instagram - Delete Instagram credentials
   */
  async deleteInstagramCredentials(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.instagramCredentials = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Instagram credentials deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting Instagram credentials:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete Instagram credentials'
      });
    }
  }

  /**
   * POST /api/config/tone - Set reply tone
   */
  async setReplyTone(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { tone } = req.body;

      if (!tone || !['friendly', 'formal', 'professional'].includes(tone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tone. Must be friendly, formal, or professional'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.automationSettings.replyTone = tone;
      await user.save();

      res.json({
        success: true,
        message: 'Reply tone updated successfully',
        tone
      });
    } catch (error) {
      console.error('Error setting reply tone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update reply tone'
      });
    }
  }

  /**
   * GET /api/config/tone - Get reply tone
   */
  async getReplyTone(req, res) {
    try {
      const userId = req.userId || req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        tone: user.automationSettings?.replyTone || 'friendly'
      });
    } catch (error) {
      console.error('Error getting reply tone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve reply tone'
      });
    }
  }

  /**
   * POST /api/config/validate-api-key - Validate Gemini API key
   */
  async validateApiKey(req, res) {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required'
        });
      }

      console.log('[ConfigController] Validating API key...');
      
      // Use the static validation method which makes a direct API call
      const validation = await AIReplyService.validateApiKey(apiKey);

      console.log('[ConfigController] Validation result:', validation);

      if (validation.valid) {
        res.json({
          success: true,
          message: 'API key is valid'
        });
      } else {
        res.status(400).json({
          success: false,
          error: validation.error || 'API key validation failed'
        });
      }
    } catch (error) {
      console.error('[ConfigController] Error validating API key:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid API key'
      });
    }
  }
}

module.exports = ConfigController;
