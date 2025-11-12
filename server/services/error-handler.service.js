/**
 * Custom Error Classes for Instagram Comment Automation
 */

/**
 * Base error class for automation errors
 */
class AutomationError extends Error {
  constructor(message, code, recoverable = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.recoverable = recoverable;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication-related errors (Instagram login, session, etc.)
 */
class AuthenticationError extends AutomationError {
  constructor(message, details = {}) {
    super(message, 'AUTH_ERROR', false); // Not recoverable - requires user action
    this.details = details;
  }
}

/**
 * Rate limiting errors (Instagram or Gemini API)
 */
class RateLimitError extends AutomationError {
  constructor(message, retryAfter = null, details = {}) {
    super(message, 'RATE_LIMIT_ERROR', true); // Recoverable with wait
    this.retryAfter = retryAfter; // Milliseconds to wait
    this.details = details;
  }
}

/**
 * Network-related errors (connection, timeout, DNS)
 */
class NetworkError extends AutomationError {
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', true); // Recoverable with retry
    this.details = details;
  }
}

/**
 * API errors (Gemini, Instagram API failures)
 */
class APIError extends AutomationError {
  constructor(message, statusCode = null, details = {}) {
    super(message, 'API_ERROR', true); // Usually recoverable
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validation errors (invalid input, malformed data)
 */
class ValidationError extends AutomationError {
  constructor(message, field = null, details = {}) {
    super(message, 'VALIDATION_ERROR', false); // Not recoverable - requires correction
    this.field = field;
    this.details = details;
  }
}

/**
 * Error Actions - What to do when an error occurs
 */
const ErrorAction = {
  STOP_AUTOMATION: 'STOP_AUTOMATION',
  RETRY_WITH_BACKOFF: 'RETRY_WITH_BACKOFF',
  SKIP_AND_CONTINUE: 'SKIP_AND_CONTINUE',
  WAIT_AND_RETRY: 'WAIT_AND_RETRY',
  LOG_AND_CONTINUE: 'LOG_AND_CONTINUE'
};

/**
 * ErrorHandler - Centralized error handling with retry logic and recovery strategies
 */
class ErrorHandler {
  constructor(storageService = null) {
    this.storageService = storageService;
    this.maxRetries = 3;
    this.baseBackoffMs = 1000; // 1 second
    this.maxBackoffMs = 60000; // 60 seconds
  }

  /**
   * Main error handling method
   * @param {Error} error - The error to handle
   * @param {Object} context - Context about where/when error occurred
   * @returns {Promise<Object>} - Action to take and any additional data
   */
  async handleError(error, context = {}) {
    // Classify the error if it's not already a custom error
    const classifiedError = this.classifyError(error);
    
    // Log the error
    await this.logError(classifiedError, context);
    
    // Determine the appropriate action
    const action = this.determineAction(classifiedError, context);
    
    // Notify frontend if storage service is available
    if (this.storageService) {
      await this.notifyFrontend(classifiedError, context);
    }
    
    return {
      action,
      error: classifiedError,
      retryAfter: classifiedError.retryAfter || this.calculateBackoff(context.attemptNumber || 1),
      shouldStop: action === ErrorAction.STOP_AUTOMATION
    };
  }

  /**
   * Classify generic errors into specific error types
   * @private
   */
  classifyError(error) {
    // If already a custom error, return as-is
    if (error instanceof AutomationError) {
      return error;
    }

    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('authentication') || 
        message.includes('login') ||
        message.includes('invalid credentials') ||
        message.includes('challenge_required') ||
        message.includes('checkpoint_required') ||
        message.includes('not authenticated')) {
      return new AuthenticationError(error.message, { originalError: error.name });
    }

    // Rate limit errors
    if (message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('429')) {
      const retryAfter = this.extractRetryAfter(error) || 60000; // Default 1 minute
      return new RateLimitError(error.message, retryAfter, { originalError: error.name });
    }

    // Network errors
    if (message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('connection') ||
        message.includes('dns')) {
      return new NetworkError(error.message, { originalError: error.name });
    }

    // API errors
    if (message.includes('api') ||
        message.includes('gemini') ||
        message.includes('instagram') ||
        error.statusCode) {
      return new APIError(error.message, error.statusCode, { originalError: error.name });
    }

    // Validation errors
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        message.includes('must be')) {
      return new ValidationError(error.message, null, { originalError: error.name });
    }

    // Default to generic API error
    return new APIError(error.message, null, { originalError: error.name });
  }

  /**
   * Determine what action to take based on error type
   * @private
   */
  determineAction(error, context) {
    const attemptNumber = context.attemptNumber || 1;

    // Authentication errors - stop automation
    if (error instanceof AuthenticationError) {
      return ErrorAction.STOP_AUTOMATION;
    }

    // Rate limit errors - wait and retry
    if (error instanceof RateLimitError) {
      return ErrorAction.WAIT_AND_RETRY;
    }

    // Network errors - retry with backoff
    if (error instanceof NetworkError) {
      if (attemptNumber >= this.maxRetries) {
        return ErrorAction.SKIP_AND_CONTINUE;
      }
      return ErrorAction.RETRY_WITH_BACKOFF;
    }

    // API errors - retry with backoff
    if (error instanceof APIError) {
      if (attemptNumber >= this.maxRetries) {
        return ErrorAction.SKIP_AND_CONTINUE;
      }
      return ErrorAction.RETRY_WITH_BACKOFF;
    }

    // Validation errors - skip and continue
    if (error instanceof ValidationError) {
      return ErrorAction.SKIP_AND_CONTINUE;
    }

    // Default - log and continue
    return ErrorAction.LOG_AND_CONTINUE;
  }

  /**
   * Log error to storage service
   * @private
   */
  async logError(error, context) {
    const logEntry = {
      type: 'error',
      message: error.message,
      details: {
        errorType: error.name,
        errorCode: error.code,
        recoverable: error.recoverable,
        context: context,
        stack: error.stack
      }
    };

    // Log to console
    console.error(`[ErrorHandler] ${error.name}: ${error.message}`, context);

    // Log to storage if available
    if (this.storageService) {
      try {
        await this.storageService.appendLog(logEntry);
      } catch (logError) {
        console.error('[ErrorHandler] Failed to log error to storage:', logError.message);
      }
    }
  }

  /**
   * Notify frontend about the error
   * @private
   */
  async notifyFrontend(error, context) {
    if (!this.storageService) return;

    const notificationEntry = {
      type: 'error',
      message: this.getUserFriendlyMessage(error),
      details: {
        errorType: error.name,
        recoverable: error.recoverable,
        action: this.determineAction(error, context),
        timestamp: error.timestamp
      }
    };

    try {
      await this.storageService.appendLog(notificationEntry);
    } catch (logError) {
      console.error('[ErrorHandler] Failed to notify frontend:', logError.message);
    }
  }

  /**
   * Get user-friendly error message
   * @private
   */
  getUserFriendlyMessage(error) {
    if (error instanceof AuthenticationError) {
      return 'Authentication failed. Please check your Instagram credentials and try again.';
    }

    if (error instanceof RateLimitError) {
      const minutes = Math.ceil((error.retryAfter || 60000) / 60000);
      return `Rate limit reached. Automation will resume in approximately ${minutes} minute(s).`;
    }

    if (error instanceof NetworkError) {
      return 'Network connection issue. Retrying automatically...';
    }

    if (error instanceof APIError) {
      return 'API error occurred. Retrying automatically...';
    }

    if (error instanceof ValidationError) {
      return `Validation error: ${error.message}`;
    }

    return `An error occurred: ${error.message}`;
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  calculateBackoff(attemptNumber) {
    const backoff = Math.min(
      this.baseBackoffMs * Math.pow(2, attemptNumber - 1),
      this.maxBackoffMs
    );
    
    // Add jitter (±20%) to prevent thundering herd
    const jitter = backoff * 0.2 * (Math.random() * 2 - 1);
    
    return Math.floor(backoff + jitter);
  }

  /**
   * Extract retry-after value from error
   * @private
   */
  extractRetryAfter(error) {
    // Try to extract from error message or headers
    if (error.response && error.response.headers) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        return parseInt(retryAfter) * 1000; // Convert seconds to ms
      }
    }

    // Try to parse from message
    const match = error.message.match(/(\d+)\s*(minute|second|hour)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('hour')) return value * 60 * 60 * 1000;
      if (unit.startsWith('minute')) return value * 60 * 1000;
      if (unit.startsWith('second')) return value * 1000;
    }

    return null;
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - Async function to execute
   * @param {Object} context - Context for error handling
   * @param {number} maxAttempts - Maximum retry attempts (default: 3)
   * @returns {Promise<any>} - Result of the function
   */
  async executeWithRetry(fn, context = {}, maxAttempts = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        const errorContext = { ...context, attemptNumber: attempt };
        const result = await this.handleError(error, errorContext);
        
        // If we should stop, throw the error
        if (result.shouldStop) {
          throw error;
        }
        
        // If this was the last attempt, throw
        if (attempt >= maxAttempts) {
          throw error;
        }
        
        // Wait before retrying
        if (result.action === ErrorAction.RETRY_WITH_BACKOFF || 
            result.action === ErrorAction.WAIT_AND_RETRY) {
          await this.sleep(result.retryAfter);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a recovery strategy for a specific error type
   * @param {string} errorType - Type of error
   * @returns {Object} - Recovery strategy
   */
  getRecoveryStrategy(errorType) {
    const strategies = {
      AuthenticationError: {
        action: ErrorAction.STOP_AUTOMATION,
        message: 'Stop automation and require user to re-authenticate',
        userAction: 'Please update your Instagram credentials in the configuration panel'
      },
      RateLimitError: {
        action: ErrorAction.WAIT_AND_RETRY,
        message: 'Wait for rate limit window to reset',
        userAction: 'Automation will resume automatically when rate limit resets'
      },
      NetworkError: {
        action: ErrorAction.RETRY_WITH_BACKOFF,
        message: 'Retry with exponential backoff',
        userAction: 'Check your internet connection. Automation will retry automatically'
      },
      APIError: {
        action: ErrorAction.RETRY_WITH_BACKOFF,
        message: 'Retry with exponential backoff',
        userAction: 'Automation will retry automatically. If issue persists, check API status'
      },
      ValidationError: {
        action: ErrorAction.SKIP_AND_CONTINUE,
        message: 'Skip invalid item and continue',
        userAction: 'Check logs for details about validation failures'
      }
    };

    return strategies[errorType] || {
      action: ErrorAction.LOG_AND_CONTINUE,
      message: 'Log error and continue',
      userAction: 'Check logs for details'
    };
  }
}

// Export classes and constants
module.exports = {
  ErrorHandler,
  AutomationError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  APIError,
  ValidationError,
  ErrorAction
};
