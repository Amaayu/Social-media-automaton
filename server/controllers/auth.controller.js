const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Authentication Controller
 * Handles user registration, login, and session management
 */
class AuthController {
  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req, res) {
    try {
      // Check if MongoDB is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          error: 'Database not connected. Please set up MongoDB Atlas. See MONGODB_SETUP_GUIDE.md'
        });
      }

      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        name: name.trim()
      });

      await user.save();

      // Log activity
      await ActivityLog.log(
        user._id,
        'auth',
        'register',
        'User registered successfully',
        { email: user.email },
        req
      );

      // Generate token
      const token = this.generateToken(user._id);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: user.getPublicProfile()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  async login(req, res) {
    try {
      // Check if MongoDB is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          error: 'Database not connected. Please set up MongoDB Atlas. See MONGODB_SETUP_GUIDE.md'
        });
      }

      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated. Please contact support.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Log activity
      await ActivityLog.log(
        user._id,
        'auth',
        'login',
        'User logged in successfully',
        { email: user.email },
        req
      );

      // Generate token
      const token = this.generateToken(user._id);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: user.getPublicProfile()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user
   */
  async logout(req, res) {
    try {
      if (req.user) {
        await ActivityLog.log(
          req.user._id,
          'auth',
          'logout',
          'User logged out',
          {},
          req
        );
      }

      // Clear cookie
      res.clearCookie('token');

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        user: req.user.getPublicProfile()
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const user = req.user;

      if (name) {
        user.name = name.trim();
      }

      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: user._id }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Email is already taken'
          });
        }

        user.email = email.toLowerCase();
      }

      await user.save();

      await ActivityLog.log(
        user._id,
        'auth',
        'update_profile',
        'Profile updated',
        { name, email },
        req
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: user.getPublicProfile()
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  /**
   * PUT /api/auth/password
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      const user = req.user;

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      await ActivityLog.log(
        user._id,
        'auth',
        'change_password',
        'Password changed successfully',
        {},
        req
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
}

module.exports = new AuthController();
