const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter'],
    default: 'instagram'
  },
  caption: {
    type: String,
    required: true
  },
  imagePrompt: {
    type: String
  },
  imageUrl: {
    type: String
  },
  instagramMediaId: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'publishing', 'published', 'failed'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  error: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Post', postSchema);
