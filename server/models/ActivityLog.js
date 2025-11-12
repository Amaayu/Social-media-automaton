const mongoose = require('mongoose');

/**
 * Activity Log Schema
 * Stores all user activities, automation logs, and system events
 */
const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'auth',
      'config',
      'automation',
      'comment_detected',
      'reply_generated',
      'reply_posted',
      'error',
      'info',
      'warning'
    ],
    index: true
  },
  action: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Compound indexes for efficient queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, type: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

/**
 * Static method to log activity
 */
activityLogSchema.statics.log = async function(userId, type, action, message, details = {}, req = null) {
  try {
    const logEntry = {
      userId,
      type,
      action,
      message,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null
    };

    await this.create(logEntry);
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};

/**
 * Get logs for a user
 */
activityLogSchema.statics.getUserLogs = async function(userId, options = {}) {
  const {
    type = null,
    limit = 100,
    skip = 0,
    startDate = null,
    endDate = null
  } = options;

  const query = { userId };

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * Get log statistics
 */
activityLogSchema.statics.getStats = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
