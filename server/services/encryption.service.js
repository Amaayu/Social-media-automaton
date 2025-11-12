const crypto = require('crypto');

/**
 * Encryption Service
 * Provides utilities for encrypting and decrypting sensitive data using AES-256-CBC
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32; // 32 bytes for AES-256
    this.ivLength = 16; // 16 bytes for AES
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * Get encryption key from environment variable
   * @returns {Buffer} Encryption key as buffer
   * @throws {Error} If ENCRYPTION_KEY is not set or invalid
   */
  getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Convert hex string to buffer
    const keyBuffer = Buffer.from(key, 'hex');
    
    if (keyBuffer.length !== this.keyLength) {
      throw new Error(`ENCRYPTION_KEY must be ${this.keyLength} bytes (${this.keyLength * 2} hex characters)`);
    }

    return keyBuffer;
  }

  /**
   * Encrypt a password using AES-256-CBC
   * @param {string} password - Plain text password to encrypt
   * @returns {Object} Object containing encrypted password and IV
   * @returns {string} returns.encrypted - Encrypted password in hex format
   * @returns {string} returns.iv - Initialization vector in hex format
   * @throws {Error} If password is invalid
   */
  encryptPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Generate random initialization vector
    const iv = crypto.randomBytes(this.ivLength);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Encrypt password
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt a password using AES-256-CBC
   * @param {string} encryptedPassword - Encrypted password in hex format
   * @param {string} ivHex - Initialization vector in hex format
   * @returns {string} Decrypted password
   * @throws {Error} If decryption fails or parameters are invalid
   */
  decryptPassword(encryptedPassword, ivHex) {
    if (!encryptedPassword || typeof encryptedPassword !== 'string') {
      throw new Error('Encrypted password must be a non-empty string');
    }

    if (!ivHex || typeof ivHex !== 'string') {
      throw new Error('IV must be a non-empty string');
    }

    try {
      // Convert IV from hex to buffer
      const iv = Buffer.from(ivHex, 'hex');
      
      if (iv.length !== this.ivLength) {
        throw new Error(`IV must be ${this.ivLength} bytes`);
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Decrypt password
      let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt a string (wrapper for encryptPassword)
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text in format "encrypted:iv"
   */
  encrypt(text) {
    if (!text) return null;
    const { encrypted, iv } = this.encryptPassword(text);
    return `${encrypted}:${iv}`;
  }

  /**
   * Decrypt a string (wrapper for decryptPassword)
   * @param {string} encryptedText - Encrypted text in format "encrypted:iv"
   * @returns {string} Decrypted text
   */
  decrypt(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string') return null;
    
    // Check if the encrypted text contains the separator
    if (!encryptedText.includes(':')) {
      console.warn('Invalid encrypted text format - missing separator');
      return null;
    }
    
    const [encrypted, iv] = encryptedText.split(':');
    
    if (!encrypted || !iv) {
      console.warn('Invalid encrypted text format - missing encrypted data or IV');
      return null;
    }
    
    return this.decryptPassword(encrypted, iv);
  }

  /**
   * Generate a random encryption key
   * Utility function to help users generate a secure encryption key
   * @returns {string} Random 32-byte key in hex format
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

/**
 * Input Validation and Sanitization Utilities
 */
class ValidationService {
  /**
   * Validate Instagram username
   * @param {string} username - Instagram username to validate
   * @returns {boolean} True if valid
   * @throws {Error} If username is invalid
   */
  static validateInstagramUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username must be a non-empty string');
    }

    const trimmed = username.trim();
    
    if (trimmed.length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (trimmed.length > 30) {
      throw new Error('Username cannot exceed 30 characters');
    }

    // Instagram usernames can only contain letters, numbers, periods, and underscores
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new Error('Username can only contain letters, numbers, periods, and underscores');
    }

    return true;
  }

  /**
   * Validate Instagram password
   * @param {string} password - Instagram password to validate
   * @returns {boolean} True if valid
   * @throws {Error} If password is invalid
   */
  static validateInstagramPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password cannot exceed 128 characters');
    }

    return true;
  }

  /**
   * Validate Gemini API key format
   * @param {string} apiKey - Gemini API key to validate
   * @returns {boolean} True if valid
   * @throws {Error} If API key is invalid
   */
  static validateGeminiApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key must be a non-empty string');
    }

    const trimmed = apiKey.trim();
    
    if (trimmed.length === 0) {
      throw new Error('API key cannot be empty');
    }

    // Basic format check - Gemini API keys typically start with "AIza"
    if (!trimmed.startsWith('AIza')) {
      throw new Error('Invalid Gemini API key format. Keys should start with "AIza"');
    }

    // Gemini API keys are typically 39 characters long
    if (trimmed.length < 30) {
      throw new Error('API key appears to be too short. Gemini API keys are typically 39 characters');
    }

    if (trimmed.length > 50) {
      throw new Error('API key appears to be too long');
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    const apiKeyRegex = /^[A-Za-z0-9_-]+$/;
    if (!apiKeyRegex.test(trimmed)) {
      throw new Error('API key contains invalid characters');
    }

    return true;
  }

  /**
   * Validate reply tone
   * @param {string} tone - Reply tone to validate
   * @returns {boolean} True if valid
   * @throws {Error} If tone is invalid
   */
  static validateReplyTone(tone) {
    const validTones = ['friendly', 'formal', 'professional'];
    
    if (!tone || typeof tone !== 'string') {
      throw new Error('Reply tone must be a non-empty string');
    }

    if (!validTones.includes(tone.toLowerCase())) {
      throw new Error(`Reply tone must be one of: ${validTones.join(', ')}`);
    }

    return true;
  }

  /**
   * Sanitize string input by trimming whitespace
   * @param {string} input - String to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }
    return input.trim();
  }

  /**
   * Validate and sanitize Instagram credentials
   * @param {Object} credentials - Credentials object
   * @param {string} credentials.username - Instagram username
   * @param {string} credentials.password - Instagram password
   * @returns {Object} Sanitized credentials
   * @throws {Error} If credentials are invalid
   */
  static validateAndSanitizeCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Credentials must be an object');
    }

    const { username, password } = credentials;

    // Sanitize inputs
    const sanitizedUsername = this.sanitizeString(username);
    const sanitizedPassword = password; // Don't trim passwords as spaces might be intentional

    // Validate
    this.validateInstagramUsername(sanitizedUsername);
    this.validateInstagramPassword(sanitizedPassword);

    return {
      username: sanitizedUsername,
      password: sanitizedPassword
    };
  }

  /**
   * Validate poll interval
   * @param {number} seconds - Poll interval in seconds
   * @returns {boolean} True if valid
   * @throws {Error} If interval is invalid
   */
  static validatePollInterval(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      throw new Error('Poll interval must be a number');
    }

    if (seconds < 10) {
      throw new Error('Poll interval must be at least 10 seconds to avoid rate limiting');
    }

    if (seconds > 3600) {
      throw new Error('Poll interval cannot exceed 3600 seconds (1 hour)');
    }

    return true;
  }
}

module.exports = {
  EncryptionService,
  ValidationService
};
