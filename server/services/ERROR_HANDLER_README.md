# Error Handler Service

## Overview

The Error Handler Service provides comprehensive error handling, classification, retry logic, and recovery strategies for the Instagram Comment Automation system. It ensures robust operation by automatically handling transient errors and providing clear guidance for non-recoverable issues.

## Features

- **Error Classification**: Automatically categorizes errors into specific types
- **Retry Logic**: Implements exponential backoff for transient failures
- **Recovery Strategies**: Provides appropriate actions for different error types
- **User-Friendly Messages**: Converts technical errors into actionable user messages
- **Logging Integration**: Automatically logs all errors to storage
- **Frontend Notifications**: Notifies users about errors through the UI

## Error Types

### 1. AuthenticationError
**When it occurs**: Instagram login failures, invalid credentials, session expiration

**Recovery Strategy**: Stop automation and require user action

**User Action**: Update Instagram credentials in configuration panel

**Example**:
```javascript
throw new AuthenticationError('Invalid Instagram credentials');
```

### 2. RateLimitError
**When it occurs**: Instagram or Gemini API rate limits exceeded

**Recovery Strategy**: Wait for specified duration, then retry

**User Action**: Automation resumes automatically

**Example**:
```javascript
throw new RateLimitError('Instagram rate limit exceeded', 60000); // Wait 60 seconds
```

### 3. NetworkError
**When it occurs**: Connection timeouts, DNS failures, network issues

**Recovery Strategy**: Retry with exponential backoff (up to 3 attempts)

**User Action**: Check internet connection; automation retries automatically

**Example**:
```javascript
throw new NetworkError('Connection timeout');
```

### 4. APIError
**When it occurs**: Gemini API failures, Instagram API errors

**Recovery Strategy**: Retry with exponential backoff (up to 3 attempts)

**User Action**: Automation retries automatically

**Example**:
```javascript
throw new APIError('Gemini API request failed', 500);
```

### 5. ValidationError
**When it occurs**: Invalid input data, malformed requests

**Recovery Strategy**: Skip the problematic item and continue

**User Action**: Check logs for validation details

**Example**:
```javascript
throw new ValidationError('Comment text exceeds character limit', 'text');
```

## Usage

### Basic Error Handling

```javascript
const { ErrorHandler } = require('./error-handler.service');
const errorHandler = new ErrorHandler(storageService);

try {
  // Your code here
  await instagramService.authenticate(username, password);
} catch (error) {
  const result = await errorHandler.handleError(error, {
    operation: 'authenticate',
    username: username
  });
  
  if (result.shouldStop) {
    // Stop automation
    await workflow.stop();
  }
}
```

### Execute with Automatic Retry

```javascript
const { ErrorHandler } = require('./error-handler.service');
const errorHandler = new ErrorHandler(storageService);

// Automatically retries up to 3 times with exponential backoff
const posts = await errorHandler.executeWithRetry(
  () => instagramService.getAccountPosts(5),
  { operation: 'getAccountPosts' },
  3 // max attempts
);
```

### Custom Error Creation

```javascript
const { AuthenticationError, RateLimitError } = require('./error-handler.service');

// Authentication error
if (!isValidCredentials) {
  throw new AuthenticationError('Invalid Instagram credentials', {
    username: username
  });
}

// Rate limit error with retry time
if (rateLimitExceeded) {
  throw new RateLimitError('Rate limit exceeded', 120000, {
    requestCount: requestCount,
    limit: maxRequests
  });
}
```

## Error Actions

The error handler determines the appropriate action for each error:

| Error Type | Action | Description |
|------------|--------|-------------|
| AuthenticationError | STOP_AUTOMATION | Stop workflow, require user intervention |
| RateLimitError | WAIT_AND_RETRY | Wait for specified duration, then retry |
| NetworkError | RETRY_WITH_BACKOFF | Retry with exponential backoff |
| APIError | RETRY_WITH_BACKOFF | Retry with exponential backoff |
| ValidationError | SKIP_AND_CONTINUE | Skip problematic item, continue workflow |

## Exponential Backoff

The error handler implements exponential backoff with jitter to prevent thundering herd:

- **Attempt 1**: ~1 second
- **Attempt 2**: ~2 seconds
- **Attempt 3**: ~4 seconds
- **Maximum**: 60 seconds

Jitter (±20%) is added to prevent synchronized retries.

## Integration with Automation Workflow

The error handler is integrated into the automation workflow service:

```javascript
// In AutomationWorkflow constructor
this.errorHandler = new ErrorHandler(storageService);

// In workflow nodes
const posts = await this.errorHandler.executeWithRetry(
  () => this.instagramService.getAccountPosts(5),
  { operation: 'getAccountPosts', node: 'detectComments' }
);
```

## Error Logging

All errors are automatically logged with:
- Error type and code
- Error message
- Context (operation, node, etc.)
- Stack trace
- Timestamp
- Recoverability status

Logs are stored in `server/storage/logs.json` and visible in the frontend activity log.

## Frontend Notifications

Errors are automatically converted to user-friendly messages and sent to the frontend:

```javascript
// Technical error
new AuthenticationError('IgLoginBadPasswordError')

// User sees
"Authentication failed. Please check your Instagram credentials and try again."
```

## Testing

Run the test suite to verify error handler functionality:

```bash
node server/services/test-error-handler.js
```

Tests cover:
- Error classification
- Retry logic
- Exponential backoff
- Recovery strategies
- User-friendly messages
- Storage integration

## Best Practices

1. **Always provide context**: Include operation name and relevant details
   ```javascript
   await errorHandler.handleError(error, {
     operation: 'replyToComment',
     commentId: comment.id,
     postId: post.id
   });
   ```

2. **Use executeWithRetry for transient operations**: Network calls, API requests
   ```javascript
   const result = await errorHandler.executeWithRetry(
     () => apiCall(),
     { operation: 'apiCall' }
   );
   ```

3. **Throw specific error types**: Use custom error classes for better handling
   ```javascript
   throw new RateLimitError('Rate limit exceeded', retryAfter);
   ```

4. **Check shouldStop flag**: Stop automation when required
   ```javascript
   if (result.shouldStop) {
     await this.stop();
   }
   ```

5. **Log errors with details**: Include relevant context for debugging
   ```javascript
   await errorHandler.handleError(error, {
     operation: 'generateReply',
     commentText: comment.text,
     tone: this.replyTone
   });
   ```

## Error Recovery Strategies

### Authentication Errors
- **Action**: Stop automation immediately
- **User Action**: Update credentials in configuration panel
- **Automatic Recovery**: No (requires user intervention)

### Rate Limit Errors
- **Action**: Wait for specified duration
- **User Action**: None (automatic)
- **Automatic Recovery**: Yes (after wait period)

### Network Errors
- **Action**: Retry with exponential backoff
- **User Action**: Check internet connection
- **Automatic Recovery**: Yes (up to 3 attempts)

### API Errors
- **Action**: Retry with exponential backoff
- **User Action**: Check API status if persistent
- **Automatic Recovery**: Yes (up to 3 attempts)

### Validation Errors
- **Action**: Skip problematic item
- **User Action**: Review logs for details
- **Automatic Recovery**: Yes (continues with next item)

## Configuration

The error handler can be configured with custom settings:

```javascript
const errorHandler = new ErrorHandler(storageService);

// Customize retry settings
errorHandler.maxRetries = 5; // Default: 3
errorHandler.baseBackoffMs = 2000; // Default: 1000
errorHandler.maxBackoffMs = 120000; // Default: 60000
```

## Monitoring

Monitor error rates and types through:
1. **Activity Log**: View errors in real-time in the frontend
2. **Storage Logs**: Access detailed error logs in `logs.json`
3. **Workflow Stats**: Check `errorCount` in automation status

## Troubleshooting

### High Error Rate
- Check Instagram credentials
- Verify internet connection
- Review rate limit status
- Check Gemini API key validity

### Persistent Authentication Errors
- Update Instagram credentials
- Verify account is not locked
- Check for 2FA requirements
- Try logging in manually first

### Frequent Rate Limit Errors
- Reduce poll interval
- Decrease max comments per check
- Wait for rate limit window to reset

### Network Errors
- Check internet connection
- Verify firewall settings
- Test DNS resolution
- Check proxy configuration

## API Reference

### ErrorHandler Class

#### Methods

- `handleError(error, context)`: Handle an error and determine action
- `executeWithRetry(fn, context, maxAttempts)`: Execute function with retry logic
- `classifyError(error)`: Classify generic error into specific type
- `determineAction(error, context)`: Determine appropriate action for error
- `getUserFriendlyMessage(error)`: Get user-friendly error message
- `getRecoveryStrategy(errorType)`: Get recovery strategy for error type
- `calculateBackoff(attemptNumber)`: Calculate exponential backoff delay

### Error Classes

All error classes extend `AutomationError` and include:
- `message`: Error message
- `code`: Error code
- `recoverable`: Whether error is recoverable
- `timestamp`: When error occurred
- `details`: Additional error details

## Examples

### Example 1: Handle Instagram Authentication

```javascript
try {
  await instagramService.authenticate(username, password);
} catch (error) {
  const result = await errorHandler.handleError(error, {
    operation: 'authenticate',
    username: username
  });
  
  if (result.shouldStop) {
    console.log('Stopping automation due to authentication error');
    await workflow.stop();
  }
}
```

### Example 2: Retry API Call

```javascript
const reply = await errorHandler.executeWithRetry(
  () => aiReplyService.generateReply(commentText, tone),
  { operation: 'generateReply', commentId: comment.id },
  3
);
```

### Example 3: Handle Rate Limit

```javascript
try {
  await instagramService.replyToComment(postId, commentId, reply);
} catch (error) {
  const result = await errorHandler.handleError(error, {
    operation: 'replyToComment',
    commentId: commentId
  });
  
  if (result.action === ErrorAction.WAIT_AND_RETRY) {
    console.log(`Waiting ${result.retryAfter}ms before retry`);
    await sleep(result.retryAfter);
    // Retry logic here
  }
}
```
