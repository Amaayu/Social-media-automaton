const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { EncryptionService } = require('../services/encryption.service');
const InstagramGraphService = require('../services/instagram-graph.service');
const { authMiddleware } = require('../middleware/auth.middleware');

const encryptionService = new EncryptionService();

/**
 * GET /api/credentials - Get user's platform credentials status
 */
router.get('/', async (req, res) => {
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
      credentials: {
        instagram: {
          configured: !!(user.instagramCredentials?.accessToken),
          accountId: user.instagramCredentials?.accountId || null,
          accountName: user.instagramCredentials?.accountName || null,
          isActive: user.instagramCredentials?.isActive !== false
        },
        gemini: {
          configured: !!user.geminiApiKey
        }
      }
    });
  } catch (error) {
    console.error('Error getting credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve credentials'
    });
  }
});

/**
 * POST /api/credentials/instagram - Save Instagram credentials
 */
router.post('/instagram', async (req, res) => {
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
    const encryptedToken = encryptionService.encrypt(accessToken);

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
});

/**
 * POST /api/credentials/instagram/test - Test Instagram connection
 */
router.post('/instagram/test', async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.instagramCredentials?.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram credentials not configured'
      });
    }

    // Decrypt the access token
    const decryptedToken = encryptionService.decrypt(user.instagramCredentials.accessToken);

    // Test the connection
    const instagramService = new InstagramGraphService();
    await instagramService.initialize(decryptedToken, user.instagramCredentials.accountId);

    // Get full account info including follower count
    const accountInfo = await instagramService.getAccountInfo();

    res.json({
      success: true,
      message: 'Connection successful',
      accountInfo: {
        username: accountInfo.username,
        name: accountInfo.name || accountInfo.username,
        followersCount: accountInfo.followers_count || 0
      }
    });
  } catch (error) {
    console.error('Error testing Instagram connection:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to connect to Instagram'
    });
  }
});

/**
 * DELETE /api/credentials/instagram - Delete Instagram credentials
 */
router.delete('/instagram', async (req, res) => {
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
});

module.exports = router;
