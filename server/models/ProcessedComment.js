const mongoose = require('mongoose');

/**
 * Processed Comment Schema
 * Tracks which comments have been processed to avoid duplicates
 */
const processedCommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  commentId: {
    type: String,
    required: true,
    index: true
  },
  postId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  commentText: {
    type: String,
    required: true
  },
  replyText: {
    type: String,
    default: null
  },
  replyId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['detected', 'reply_generated', 'reply_posted', 'failed', 'skipped'],
    default: 'detected'
  },
  processedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  repliedAt: {
    type: Date,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes
processedCommentSchema.index({ userId: 1, commentId: 1 }, { unique: true });
processedCommentSchema.index({ userId: 1, processedAt: -1 });
processedCommentSchema.index({ userId: 1, status: 1 });

// TTL index - delete processed comments older than 30 days
processedCommentSchema.index({ processedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

/**
 * Check if comment is already processed
 */
processedCommentSchema.statics.isProcessed = async function(userId, commentId) {
  const count = await this.countDocuments({ userId, commentId });
  return count > 0;
};

/**
 * Mark comment as processed
 */
processedCommentSchema.statics.markProcessed = async function(userId, commentData) {
  try {
    await this.create({
      userId,
      commentId: commentData.id,
      postId: commentData.postId,
      username: commentData.username,
      commentText: commentData.text,
      replyText: commentData.reply || null,
      replyId: commentData.replyId || null,
      status: commentData.status || 'detected'
    });
    return true;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key - already processed
      return false;
    }
    throw error;
  }
};

/**
 * Get processed comments for user
 */
processedCommentSchema.statics.getUserComments = async function(userId, options = {}) {
  const {
    status = null,
    limit = 50,
    skip = 0
  } = options;

  const query = { userId };
  if (status) {
    query.status = status;
  }

  return await this.find(query)
    .sort({ processedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * Get statistics
 */
processedCommentSchema.statics.getStats = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        processedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

module.exports = mongoose.model('ProcessedComment', processedCommentSchema);
