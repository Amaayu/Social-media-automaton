const express = require('express');
const router = express.Router();
const database = require('../config/database');

/**
 * Debug endpoint to check system configuration status
 * GET /api/debug/config-status
 */
router.get('/config-status', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Check MongoDB connection
    const mongoConnected = database.isConnected();
    
    // Check ENV variables
    const envStatus = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      INSTAGRAM_CLIENT_ID: !!process.env.INSTAGRAM_CLIENT_ID,
      INSTAGRAM_CLIENT_SECRET: !!process.env.INSTAGRAM_CLIENT_SECRET,
      YOUTUBE_CLIENT_ID: !!process.env.YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET: !!process.env.YOUTUBE_CLIENT_SECRET,
      PORT: !!process.env.PORT,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    // Log missing ENV variables
    const missingEnv = Object.entries(envStatus)
      .filter(([key, value]) => !value && key !== 'NODE_ENV')
      .map(([key]) => key);
    
    if (missingEnv.length > 0) {
      console.warn('[DEBUG] Missing ENV variables:', missingEnv.join(', '));
    }
    
    // Check encryption key validity
    let encryptionKeyValid = false;
    if (process.env.ENCRYPTION_KEY) {
      try {
        const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        encryptionKeyValid = keyBuffer.length === 32;
      } catch (e) {
        encryptionKeyValid = false;
      }
    }
    
    // Check JWT secret validity
    const jwtSecretValid = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32;
    
    // Check user credentials if authenticated
    let userCredentials = {
      instagram: false,
      youtube: false,
      geminiApiKey: false
    };
    
    if (userId && mongoConnected) {
      try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        if (user) {
          userCredentials = {
            instagram: !!(user.instagramCredentials?.accessToken && user.instagramCredentials?.accountId),
            youtube: !!(user.youtubeCredentials?.accessToken && user.youtubeCredentials?.refreshToken),
            geminiApiKey: !!user.geminiApiKey
          };
        }
      } catch (error) {
        console.error('[DEBUG] Error checking user credentials:', error.message);
      }
    }
    
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      },
      database: {
        connected: mongoConnected,
        uri: process.env.MONGODB_URI ? 'Configured' : 'Not configured'
      },
      environment: envStatus,
      validation: {
        encryptionKeyValid,
        jwtSecretValid,
        missingEnvVars: missingEnv
      },
      user: userId ? {
        authenticated: true,
        userId,
        credentials: userCredentials
      } : {
        authenticated: false
      }
    };
    
    res.json(status);
  } catch (error) {
    console.error('[DEBUG] Error in config-status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
