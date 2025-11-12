const mongoose = require('mongoose');

/**
 * User Context Model
 * Stores user's account information and preferences for AI post generation
 * This allows for personalized, consistent content generation
 */
const userContextSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Account Information
  accountType: {
    type: String,
    enum: ['business', 'personal-brand', 'influencer', 'ecommerce', 'service-provider', 'content-creator', 'nonprofit', 'other'],
    default: 'business'
  },
  
  targetAudience: {
    type: String,
    default: 'general audience'
  },
  
  brandVoice: {
    type: String,
    default: 'professional and friendly'
  },
  
  // Content Preferences
  preferredTopics: [{
    type: String
  }],
  
  industryNiche: {
    type: String
  },
  
  // Brand Details
  brandName: {
    type: String
  },
  
  brandDescription: {
    type: String
  },
  
  brandValues: [{
    type: String
  }],
  
  // Visual Preferences
  preferredImageStyle: {
    type: String,
    default: 'professional, high-quality, modern'
  },
  
  colorScheme: {
    type: String
  },
  
  // Content Strategy
  postingGoals: [{
    type: String
  }],
  
  callToActionPreference: {
    type: String
  },
  
  // Additional Context
  additionalNotes: {
    type: String
  },
  
  // Usage Stats
  totalPostsGenerated: {
    type: Number,
    default: 0
  },
  
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUsed on every query
userContextSchema.pre('findOne', function() {
  this.set({ lastUsed: new Date() });
});

module.exports = mongoose.model('UserContext', userContextSchema);
