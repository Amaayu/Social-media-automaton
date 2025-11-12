const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user authentication and profile information
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  geminiApiKey: {
    type: String,
    default: null
  },
  instagramCredentials: {
    accessToken: String,
    accountId: String,
    accountName: String,
    appId: String,
    isActive: {
      type: Boolean,
      default: true
    },
    lastUpdated: Date
  },
  automationSettings: {
    replyTone: {
      type: String,
      enum: ['friendly', 'formal', 'professional'],
      default: 'friendly'
    },
    pollIntervalSeconds: {
      type: Number,
      default: 30,
      min: 10,
      max: 3600
    },
    maxCommentsPerCheck: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    selectedPosts: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries (email already has unique index)
userSchema.index({ createdAt: -1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get public profile (without sensitive data)
 */
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    isActive: this.isActive,
    hasGeminiApiKey: !!this.geminiApiKey,
    hasInstagramCredentials: !!(this.instagramCredentials?.accessToken),
    automationSettings: this.automationSettings,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

/**
 * Update last login time
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
