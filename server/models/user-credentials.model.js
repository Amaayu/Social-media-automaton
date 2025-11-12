const User = require('./User');

/**
 * UserCredentialsModel - Handles encrypted credential storage and retrieval
 * This is a wrapper around the User model for credential management
 */
class UserCredentialsModel {
  constructor(storageService, encryptionService) {
    this.storageService = storageService;
    this.encryptionService = encryptionService;
  }

  /**
   * Get credentials for a specific platform
   */
  async getCredentials(userId, platform = 'instagram') {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }

      if (platform === 'instagram') {
        if (!user.instagramCredentials || !user.instagramCredentials.accessToken) {
          return null;
        }

        // Decrypt the access token
        const decryptedToken = this.encryptionService.decrypt(
          user.instagramCredentials.accessToken
        );

        return {
          accessToken: decryptedToken,
          accountId: user.instagramCredentials.accountId,
          accountName: user.instagramCredentials.accountName,
          appId: user.instagramCredentials.appId,
          isActive: user.instagramCredentials.isActive !== false
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  }

  /**
   * Save credentials for a specific platform
   */
  async saveCredentials(userId, platform, credentials) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (platform === 'instagram') {
        // Encrypt the access token
        const encryptedToken = this.encryptionService.encrypt(credentials.accessToken);

        user.instagramCredentials = {
          accessToken: encryptedToken,
          accountId: credentials.accountId,
          accountName: credentials.accountName || '',
          appId: credentials.appId || '',
          isActive: credentials.isActive !== false,
          lastUpdated: new Date()
        };

        await user.save();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  /**
   * Delete credentials for a specific platform
   */
  async deleteCredentials(userId, platform = 'instagram') {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (platform === 'instagram') {
        user.instagramCredentials = undefined;
        await user.save();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      throw error;
    }
  }

  /**
   * Check if credentials exist for a platform
   */
  async hasCredentials(userId, platform = 'instagram') {
    try {
      const credentials = await this.getCredentials(userId, platform);
      return credentials !== null && credentials.accessToken !== null;
    } catch (error) {
      console.error('Error checking credentials:', error);
      return false;
    }
  }
}

module.exports = UserCredentialsModel;
