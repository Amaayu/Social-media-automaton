const { IgApiClient } = require('instagram-private-api');
const fs = require('fs').promises;
const path = require('path');

/**
 * InstagramService - Handles all Instagram API interactions
 * Manages authentication, comment fetching, and reply posting
 */
class InstagramService {
  constructor() {
    this.client = new IgApiClient();
    this.isAuthenticated = false;
    this.username = null;
    this.userId = null;
    this.sessionPath = path.join(__dirname, '../storage/instagram-session.json');
    
    // Rate limiting: 200 requests/hour = ~3.33 requests/minute
    this.requestCount = 0;
    this.requestWindowStart = Date.now();
    this.maxRequestsPerHour = 200;
    this.requestWindow = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  /**
   * Load saved session if available
   * @param {string} username - Instagram username
   * @returns {Promise<boolean>} - True if session loaded successfully
   */
  async loadSession(username) {
    try {
      const sessionData = await fs.readFile(this.sessionPath, 'utf8');
      const session = JSON.parse(sessionData);
      
      if (session.username !== username) {
        console.log('[InstagramService] Session username mismatch, will re-authenticate');
        return false;
      }
      
      // Restore session state
      await this.client.state.deserialize(session.state);
      this.client.state.generateDevice(username);
      
      // Verify session is still valid
      const user = await this.client.account.currentUser();
      
      this.isAuthenticated = true;
      this.username = username;
      this.userId = user.pk;
      
      console.log(`[InstagramService] Successfully restored session for ${username}`);
      return true;
    } catch (error) {
      console.log('[InstagramService] Could not load session:', error.message);
      return false;
    }
  }

  /**
   * Save current session
   * @returns {Promise<void>}
   */
  async saveSession() {
    try {
      const state = await this.client.state.serialize();
      const session = {
        username: this.username,
        state: state,
        savedAt: new Date().toISOString()
      };
      
      await fs.writeFile(this.sessionPath, JSON.stringify(session, null, 2));
      console.log('[InstagramService] Session saved successfully');
    } catch (error) {
      console.error('[InstagramService] Failed to save session:', error.message);
    }
  }

  /**
   * Authenticate with Instagram
   * @param {string} username - Instagram username
   * @param {string} password - Instagram password
   * @returns {Promise<boolean>} - True if authentication successful
   * @throws {Error} - Authentication errors
   */
  async authenticate(username, password) {
    try {
      // Try to load existing session first
      const sessionLoaded = await this.loadSession(username);
      if (sessionLoaded) {
        return true;
      }
      
      // Set device and user agent
      this.client.state.generateDevice(username);
      
      // Perform login
      const auth = await this.client.account.login(username, password);
      
      this.isAuthenticated = true;
      this.username = username;
      this.userId = auth.pk;
      
      // Save session for future use
      await this.saveSession();
      
      console.log(`[InstagramService] Successfully authenticated as ${username}`);
      return true;
    } catch (error) {
      this.isAuthenticated = false;
      this.username = null;
      this.userId = null;
      
      // Handle specific error types
      if (error.message.includes('challenge_required')) {
        throw new Error('Instagram requires additional verification (2FA or challenge). Please verify your account manually first.');
      } else if (error.message.includes('invalid_user') || error.message.includes('invalid_password')) {
        throw new Error('Invalid Instagram username or password.');
      } else if (error.message.includes('checkpoint_required')) {
        throw new Error('Instagram checkpoint required. Please log in via the app or website first.');
      } else if (error.message.includes('rate_limit')) {
        throw new Error('Instagram rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Instagram authentication failed: ${error.message}`);
    }
  }

  /**
   * Check if rate limit allows another request
   * @returns {boolean} - True if request is allowed
   */
  _checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.requestWindowStart > this.requestWindow) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }
    
    // Check if we're under the limit
    if (this.requestCount >= this.maxRequestsPerHour) {
      const timeUntilReset = this.requestWindow - (now - this.requestWindowStart);
      const minutesUntilReset = Math.ceil(timeUntilReset / 60000);
      throw new Error(`Instagram rate limit reached. Please wait ${minutesUntilReset} minutes.`);
    }
    
    this.requestCount++;
    return true;
  }

  /**
   * Ensure user is authenticated, re-authenticate if needed
   * @throws {Error} - If not authenticated and no credentials available
   */
  _ensureAuthenticated() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Instagram. Please authenticate first.');
    }
  }

  /**
   * Get recent posts from the authenticated user's account
   * @param {number} limit - Maximum number of posts to retrieve (default: 10)
   * @returns {Promise<Array>} - Array of post objects
   */
  async getAccountPosts(limit = 10) {
    this._ensureAuthenticated();
    this._checkRateLimit();
    
    try {
      const userFeed = this.client.feed.user(this.userId);
      const posts = [];
      
      let itemsToFetch = limit;
      while (itemsToFetch > 0) {
        const items = await userFeed.items();
        
        for (const item of items) {
          if (posts.length >= limit) break;
          
          posts.push({
            id: item.id,
            pk: item.pk,
            type: item.media_type === 1 ? 'photo' : item.media_type === 2 ? 'video' : 'reel',
            caption: item.caption?.text || '',
            timestamp: new Date(item.taken_at * 1000),
            commentCount: item.comment_count || 0
          });
        }
        
        if (posts.length >= limit || !userFeed.isMoreAvailable()) {
          break;
        }
        
        itemsToFetch = limit - posts.length;
      }
      
      return posts.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to fetch account posts: ${error.message}`);
    }
  }

  /**
   * Get recent comments from a specific post
   * @param {string} mediaId - Instagram media ID (post ID)
   * @returns {Promise<Array>} - Array of comment objects
   */
  async getRecentComments(mediaId) {
    this._ensureAuthenticated();
    this._checkRateLimit();
    
    try {
      const mediaComments = this.client.feed.mediaComments(mediaId);
      const comments = await mediaComments.items();
      
      return comments.map(comment => ({
        id: comment.pk.toString(),
        postId: mediaId,
        userId: comment.user_id.toString(),
        username: comment.user.username,
        text: comment.text,
        timestamp: new Date(comment.created_at * 1000),
        hasReplied: comment.has_liked_comment || false, // Approximation
        parentCommentId: comment.parent_comment_id || null
      }));
    } catch (error) {
      // Handle case where media doesn't exist or is inaccessible
      if (error.message.includes('Media not found')) {
        return [];
      }
      throw new Error(`Failed to fetch comments for post ${mediaId}: ${error.message}`);
    }
  }

  /**
   * Reply to a specific comment
   * @param {string} mediaId - Instagram media ID (post ID)
   * @param {string} commentId - Comment ID to reply to
   * @param {string} text - Reply text
   * @returns {Promise<boolean>} - True if reply posted successfully
   */
  async replyToComment(mediaId, commentId, text) {
    this._ensureAuthenticated();
    this._checkRateLimit();
    
    try {
      // Validate reply text
      if (!text || text.trim().length === 0) {
        throw new Error('Reply text cannot be empty');
      }
      
      // Instagram comment limit is 2200 characters
      if (text.length > 2200) {
        throw new Error('Reply text exceeds Instagram character limit (2200)');
      }
      
      // Post the reply
      await this.client.media.comment({
        mediaId: mediaId,
        text: text.trim(),
        replied_to_comment_id: commentId
      });
      
      console.log(`[InstagramService] Successfully posted reply to comment ${commentId}`);
      return true;
    } catch (error) {
      // Handle specific errors
      if (error.message.includes('feedback_required')) {
        throw new Error('Instagram has temporarily blocked commenting. This usually resolves within 24 hours.');
      } else if (error.message.includes('spam')) {
        throw new Error('Comment flagged as spam by Instagram. Try different text.');
      }
      
      throw new Error(`Failed to post reply: ${error.message}`);
    }
  }

  /**
   * Logout and clear session
   */
  async logout() {
    try {
      if (this.isAuthenticated) {
        await this.client.account.logout();
      }
      
      // Delete saved session file
      try {
        await fs.unlink(this.sessionPath);
        console.log('[InstagramService] Session file deleted');
      } catch (error) {
        // Ignore if file doesn't exist
      }
    } catch (error) {
      console.error('[InstagramService] Logout error:', error.message);
    } finally {
      this.isAuthenticated = false;
      this.username = null;
      this.userId = null;
      this.requestCount = 0;
      console.log('[InstagramService] Logged out successfully');
    }
  }

  /**
   * Get current authentication status
   * @returns {Object} - Authentication status object
   */
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      username: this.username,
      userId: this.userId,
      requestCount: this.requestCount,
      requestsRemaining: this.maxRequestsPerHour - this.requestCount
    };
  }

  /**
   * Check if a comment is from the authenticated user (to avoid self-replies)
   * @param {string} commentUserId - User ID of the comment author
   * @returns {boolean} - True if comment is from authenticated user
   */
  isOwnComment(commentUserId) {
    return this.userId && commentUserId === this.userId.toString();
  }
}

module.exports = InstagramService;
