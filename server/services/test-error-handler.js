/**
 * Test script for ErrorHandler service
 * Run with: node server/services/test-error-handler.js
 */

const {
  ErrorHandler,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  APIError,
  ValidationError,
  ErrorAction
} = require('./error-handler.service');

// Mock storage service for testing
class MockStorageService {
  constructor() {
    this.logs = [];
  }

  async appendLog(entry) {
    this.logs.push(entry);
    console.log(`[MockStorage] Log added: ${entry.type} - ${entry.message}`);
  }

  getLogs() {
    return this.logs;
  }
}

async function runTests() {
  console.log('=== Error Handler Service Tests ===\n');

  const mockStorage = new MockStorageService();
  const errorHandler = new ErrorHandler(mockStorage);

  // Test 1: Authentication Error
  console.log('Test 1: Authentication Error');
  try {
    const authError = new AuthenticationError('Invalid Instagram credentials');
    const result = await errorHandler.handleError(authError, { operation: 'login' });
    console.log(`✓ Action: ${result.action}`);
    console.log(`✓ Should Stop: ${result.shouldStop}`);
    console.log(`✓ Expected: ${ErrorAction.STOP_AUTOMATION}\n`);
  } catch (error) {
    console.error('✗ Test 1 failed:', error.message);
  }

  // Test 2: Rate Limit Error
  console.log('Test 2: Rate Limit Error');
  try {
    const rateLimitError = new RateLimitError('Instagram rate limit exceeded', 60000);
    const result = await errorHandler.handleError(rateLimitError, { operation: 'getComments' });
    console.log(`✓ Action: ${result.action}`);
    console.log(`✓ Retry After: ${result.retryAfter}ms`);
    console.log(`✓ Expected: ${ErrorAction.WAIT_AND_RETRY}\n`);
  } catch (error) {
    console.error('✗ Test 2 failed:', error.message);
  }

  // Test 3: Network Error with Retry
  console.log('Test 3: Network Error with Retry');
  try {
    const networkError = new NetworkError('Connection timeout');
    const result = await errorHandler.handleError(networkError, { 
      operation: 'fetchPosts',
      attemptNumber: 1
    });
    console.log(`✓ Action: ${result.action}`);
    console.log(`✓ Retry After: ${result.retryAfter}ms`);
    console.log(`✓ Expected: ${ErrorAction.RETRY_WITH_BACKOFF}\n`);
  } catch (error) {
    console.error('✗ Test 3 failed:', error.message);
  }

  // Test 4: API Error Classification
  console.log('Test 4: Generic Error Classification');
  try {
    const genericError = new Error('Instagram authentication failed: invalid_user');
    const result = await errorHandler.handleError(genericError, { operation: 'test' });
    console.log(`✓ Classified as: ${result.error.name}`);
    console.log(`✓ Action: ${result.action}`);
    console.log(`✓ Expected: AuthenticationError\n`);
  } catch (error) {
    console.error('✗ Test 4 failed:', error.message);
  }

  // Test 5: Exponential Backoff Calculation
  console.log('Test 5: Exponential Backoff Calculation');
  try {
    const backoff1 = errorHandler.calculateBackoff(1);
    const backoff2 = errorHandler.calculateBackoff(2);
    const backoff3 = errorHandler.calculateBackoff(3);
    console.log(`✓ Attempt 1 backoff: ~${Math.round(backoff1)}ms (expected ~1000ms)`);
    console.log(`✓ Attempt 2 backoff: ~${Math.round(backoff2)}ms (expected ~2000ms)`);
    console.log(`✓ Attempt 3 backoff: ~${Math.round(backoff3)}ms (expected ~4000ms)\n`);
  } catch (error) {
    console.error('✗ Test 5 failed:', error.message);
  }

  // Test 6: Execute with Retry - Success on Second Attempt
  console.log('Test 6: Execute with Retry - Success on Second Attempt');
  try {
    let attemptCount = 0;
    const testFunction = async () => {
      attemptCount++;
      if (attemptCount < 2) {
        throw new NetworkError('Temporary network issue');
      }
      return 'Success!';
    };

    const result = await errorHandler.executeWithRetry(
      testFunction,
      { operation: 'testRetry' },
      3
    );
    console.log(`✓ Result: ${result}`);
    console.log(`✓ Attempts: ${attemptCount}`);
    console.log(`✓ Expected: Success after 2 attempts\n`);
  } catch (error) {
    console.error('✗ Test 6 failed:', error.message);
  }

  // Test 7: Execute with Retry - Fail After Max Attempts
  console.log('Test 7: Execute with Retry - Fail After Max Attempts');
  let attemptCount7 = 0;
  try {
    const testFunction = async () => {
      attemptCount7++;
      throw new APIError('Persistent API error');
    };

    await errorHandler.executeWithRetry(
      testFunction,
      { operation: 'testRetryFail' },
      3
    );
    console.error('✗ Should have thrown an error');
  } catch (error) {
    console.log(`✓ Failed as expected after ${attemptCount7} attempts`);
    console.log(`✓ Error: ${error.message}\n`);
  }

  // Test 8: Execute with Retry - Stop on Authentication Error
  console.log('Test 8: Execute with Retry - Stop on Authentication Error');
  let attemptCount8 = 0;
  try {
    const testFunction = async () => {
      attemptCount8++;
      throw new AuthenticationError('Invalid credentials');
    };

    await errorHandler.executeWithRetry(
      testFunction,
      { operation: 'testAuthError' },
      3
    );
    console.error('✗ Should have thrown an error');
  } catch (error) {
    console.log(`✓ Stopped immediately on authentication error`);
    console.log(`✓ Attempts: ${attemptCount8} (expected 1)`);
    console.log(`✓ Error: ${error.message}\n`);
  }

  // Test 9: User-Friendly Messages
  console.log('Test 9: User-Friendly Error Messages');
  try {
    const errors = [
      new AuthenticationError('Invalid credentials'),
      new RateLimitError('Rate limit exceeded', 120000),
      new NetworkError('Connection timeout'),
      new APIError('Gemini API error'),
      new ValidationError('Invalid input')
    ];

    for (const error of errors) {
      const message = errorHandler.getUserFriendlyMessage(error);
      console.log(`✓ ${error.name}: "${message}"`);
    }
    console.log();
  } catch (error) {
    console.error('✗ Test 9 failed:', error.message);
  }

  // Test 10: Recovery Strategies
  console.log('Test 10: Recovery Strategies');
  try {
    const errorTypes = [
      'AuthenticationError',
      'RateLimitError',
      'NetworkError',
      'APIError',
      'ValidationError'
    ];

    for (const errorType of errorTypes) {
      const strategy = errorHandler.getRecoveryStrategy(errorType);
      console.log(`✓ ${errorType}:`);
      console.log(`  - Action: ${strategy.action}`);
      console.log(`  - User Action: ${strategy.userAction}`);
    }
    console.log();
  } catch (error) {
    console.error('✗ Test 10 failed:', error.message);
  }

  // Test 11: Storage Integration
  console.log('Test 11: Storage Integration');
  try {
    const logs = mockStorage.getLogs();
    console.log(`✓ Total logs created: ${logs.length}`);
    console.log(`✓ Error logs: ${logs.filter(l => l.type === 'error').length}`);
    console.log(`✓ Sample log:`, logs[0]);
    console.log();
  } catch (error) {
    console.error('✗ Test 11 failed:', error.message);
  }

  console.log('=== All Tests Completed ===');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
