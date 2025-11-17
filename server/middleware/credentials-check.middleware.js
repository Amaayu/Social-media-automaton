/**
 * Middleware to check and backfill user credentials
 * Prevents crashes when credentials are null or undefined
 */

const User = require('../models/User');

/**
 * Check Instagram credentials and return appropriate response
 */
async function checkInstagramCredentials(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    
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

    // Backfill: if instagramCredentials is null, initialize it
    if (!user.instagramCredentials) {
      console.log('[CredentialsCheck] Instagram credentials null, initializing...');
      user.instagramCredentials = {};
      await user.save();
    }

    // Check if configured
    if (!user.instagramCredentials.accessToken || !user.instagramCredentials.accountId) {
      return res.json({
        success: false,
        needsConfig: true,
        error: 'Instagram credentials not configured. Please connect your Instagram account.'
      });
    }

    // Attach user to request for next middleware
    req.userDoc = user;
    next();
  } catch (error) {
    console.error('[CredentialsCheck] Error checking Instagram credentials:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check credentials'
    });
  }
}

/**
 * Check YouTube credentials and return appropriate response
 */
async function checkYouTubeCredentials(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    
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

    // Backfill: if youtubeCredentials is null, initialize it
    if (!user.youtubeCredentials) {
      console.log('[CredentialsCheck] YouTube credentials null, initializing...');
      user.youtubeCredentials = {};
      await user.save();
    }

    // Check if configured
    if (!user.youtubeCredentials.accessToken || !user.youtubeCredentials.refreshToken) {
      return res.json({
        success: false,
        needsConfig: true,
        error: 'YouTube credentials not configured. Please connect your YouTube account.'
      });
    }

    // Attach user to request for next middleware
    req.userDoc = user;
    next();
  } catch (error) {
    console.error('[CredentialsCheck] Error checking YouTube credentials:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check credentials'
    });
  }
}

/**
 * Soft check - doesn't block request, just logs warning
 */
async function softCheckCredentials(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    
    if (!userId) {
      return next();
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return next();
    }

    // Backfill credentials if null
    let updated = false;
    
    if (!user.instagramCredentials) {
      console.log('[CredentialsCheck] Backfilling Instagram credentials for user:', userId);
      user.instagramCredentials = {};
      updated = true;
    }
    
    if (!user.youtubeCredentials) {
      console.log('[CredentialsCheck] Backfilling YouTube credentials for user:', userId);
      user.youtubeCredentials = {};
      updated = true;
    }
    
    if (updated) {
      await user.save();
    }

    req.userDoc = user;
    next();
  } catch (error) {
    console.error('[CredentialsCheck] Error in soft check:', error);
    // Don't block request on error
    next();
  }
}

module.exports = {
  checkInstagramCredentials,
  checkYouTubeCredentials,
  softCheckCredentials
};
