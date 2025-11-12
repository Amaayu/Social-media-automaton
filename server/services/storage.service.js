const ActivityLog = require('../models/ActivityLog');
const ProcessedComment = require('../models/ProcessedComment');
const User = require('../models/User');

/**
 * Storage Service - MongoDB Implementation
 * Handles all data persistence using MongoDB models
 */
class StorageService {
  constructor(userId = null) {
    this.userId = userId;
  }

  /**
   * Set the user ID for this storage service instance
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Get user ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Append a log entry
   */
  async appendLog(logData) {
    try {
      if (!this.userId) {
        console.warn('No userId set for storage service, skipping log');
        return;
      }

      await ActivityLog.log(
        this.userId,
        logData.type || 'info',
        logData.action || 'automation',
        logData.message,
        logData.details || {}
      );
    } catch (error) {
      console.error('Error appending log:', error);
      throw error;
    }
  }

  /**
   * Get logs with pagination
   */
  async getLogs(options = {}) {
    try {
      if (!this.userId) {
        return [];
      }

      const {
        type = null,
        limit = 100,
        skip = 0,
        startDate = null,
        endDate = null
      } = options;

      return await ActivityLog.getUserLogs(this.userId, {
        type,
        limit,
        skip,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Error getting logs:', error);
      throw error;
    }
  }

  /**
   * Check if a comment has been processed
   */
  async isCommentProcessed(commentId) {
    try {
      if (!this.userId) {
        return false;
      }

      return await ProcessedComment.isProcessed(this.userId, commentId);
    } catch (error) {
      console.error('Error checking if comment is processed:', error);
      return false;
    }
  }

  /**
   * Mark a comment as processed
   */
  async markCommentProcessed(commentId, commentData = {}) {
    try {
      if (!this.userId) {
        console.warn('No userId set for storage service, skipping mark processed');
        return;
      }

      await ProcessedComment.markProcessed(this.userId, {
        id: commentId,
        postId: commentData.postId || 'unknown',
        username: commentData.username || 'unknown',
        text: commentData.text || '',
        reply: commentData.reply || null,
        replyId: commentData.replyId || null,
        status: commentData.status || 'reply_posted'
      });
    } catch (error) {
      console.error('Error marking comment as processed:', error);
      throw error;
    }
  }

  /**
   * Get configuration (from User model)
   */
  async getConfig() {
    try {
      if (!this.userId) {
        return null;
      }

      const user = await User.findById(this.userId);
      if (!user) {
        return null;
      }

      return {
        replyTone: user.automationSettings?.replyTone || 'friendly',
        pollIntervalSeconds: user.automationSettings?.pollIntervalSeconds || 30,
        maxCommentsPerCheck: user.automationSettings?.maxCommentsPerCheck || 10,
        automation: {
          isActive: user.automationSettings?.isActive || false
        }
      };
    } catch (error) {
      console.error('Error getting config:', error);
      return null;
    }
  }

  /**
   * Save configuration (to User model)
   */
  async saveConfig(config) {
    try {
      if (!this.userId) {
        throw new Error('No userId set for storage service');
      }

      const user = await User.findById(this.userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (config.replyTone) {
        user.automationSettings.replyTone = config.replyTone;
      }
      if (config.pollIntervalSeconds) {
        user.automationSettings.pollIntervalSeconds = config.pollIntervalSeconds;
      }
      if (config.maxCommentsPerCheck) {
        user.automationSettings.maxCommentsPerCheck = config.maxCommentsPerCheck;
      }

      await user.save();
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  /**
   * Save automation state
   */
  async saveAutomationState(state) {
    try {
      if (!this.userId) {
        throw new Error('No userId set for storage service');
      }

      const user = await User.findById(this.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.automationSettings.isActive = state.isActive || false;
      await user.save();
    } catch (error) {
      console.error('Error saving automation state:', error);
      throw error;
    }
  }

  /**
   * Load automation state
   */
  async loadAutomationState() {
    try {
      if (!this.userId) {
        return null;
      }

      const user = await User.findById(this.userId);
      if (!user) {
        return null;
      }

      return {
        isActive: user.automationSettings?.isActive || false,
        lastCheckTime: null,
        processedComments: []
      };
    } catch (error) {
      console.error('Error loading automation state:', error);
      return null;
    }
  }

  /**
   * Delete configuration (for testing)
   */
  async deleteConfig() {
    try {
      if (!this.userId) {
        return;
      }

      const user = await User.findById(this.userId);
      if (user) {
        user.automationSettings = {
          replyTone: 'friendly',
          pollIntervalSeconds: 30,
          maxCommentsPerCheck: 10,
          isActive: false
        };
        await user.save();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  }
}

module.exports = StorageService;
