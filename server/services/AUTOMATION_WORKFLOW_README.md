# AutomationWorkflow Service

## Overview

The `AutomationWorkflow` service is the core orchestration engine for the Instagram Comment Automation system. It uses LangGraph to manage a stateful workflow that automatically detects new Instagram comments, generates AI-powered replies, and posts them back to Instagram.

## Architecture

The workflow is built using LangGraph's `StateGraph`, which provides a structured way to manage complex automation flows with state management, conditional routing, and error handling.

### Workflow Nodes

1. **detectCommentsNode**: Fetches new comments from Instagram posts
2. **generateReplyNode**: Uses AI service to generate contextual replies
3. **postReplyNode**: Posts the generated reply back to Instagram
4. **errorHandlingNode**: Handles and logs errors that occur during processing

### Workflow Flow

```
START
  ↓
detectComments
  ↓
[Has new comments?]
  ↓ Yes                    ↓ No
generateReply              END
  ↓
[Reply generated?]
  ↓ Yes              ↓ No
postReply         errorHandling
  ↓                    ↓
[More comments?]    detectComments
  ↓ Yes    ↓ No
  ←────────┘
  ↓
detectComments (loop)
```

## Usage

### Basic Setup

```javascript
const AutomationWorkflow = require('./automation-workflow.service');
const InstagramService = require('./instagram.service');
const AIReplyService = require('./ai-reply.service');
const StorageService = require('./storage.service');

// Initialize services
const instagramService = new InstagramService();
const aiReplyService = new AIReplyService(process.env.GEMINI_API_KEY);
const storageService = new StorageService();

// Authenticate with Instagram
await instagramService.authenticate(username, password);

// Create workflow
const workflow = new AutomationWorkflow(
  instagramService,
  aiReplyService,
  storageService,
  {
    pollIntervalSeconds: 30,      // Check for new comments every 30 seconds
    maxCommentsPerCheck: 10,      // Process up to 10 comments per cycle
    replyTone: 'friendly'         // Use friendly tone for replies
  }
);
```

### Starting the Workflow

```javascript
// Start automation
await workflow.start();

// The workflow will now:
// 1. Poll Instagram every 30 seconds
// 2. Detect new comments
// 3. Generate AI replies
// 4. Post replies automatically
```

### Stopping the Workflow

```javascript
// Stop automation
await workflow.stop();
```

### Getting Workflow Status

```javascript
const status = workflow.getState();

console.log(status);
// {
//   isRunning: true,
//   lastCheckTime: Date,
//   stats: {
//     commentsDetected: 5,
//     repliesGenerated: 5,
//     repliesPosted: 4,
//     errorCount: 1
//   },
//   pendingCommentsCount: 0,
//   processedCommentsCount: 4,
//   errorCount: 1,
//   isProcessing: false
// }
```

### Updating Configuration

```javascript
// Update reply tone
workflow.updateConfig({ replyTone: 'professional' });

// Update poll interval
workflow.updateConfig({ pollIntervalSeconds: 60 });
```

## State Management

The workflow maintains a comprehensive state object:

```javascript
{
  isRunning: boolean,              // Whether workflow is active
  lastCheckTime: Date,             // Last time comments were checked
  processedComments: Set<string>,  // IDs of processed comments
  pendingComments: Array,          // Comments waiting to be processed
  errors: Array,                   // Error history
  stats: {
    commentsDetected: number,      // Total comments found
    repliesGenerated: number,      // Total replies generated
    repliesPosted: number,         // Total replies posted
    errorCount: number             // Total errors encountered
  }
}
```

## Error Handling

The workflow includes robust error handling:

- **Authentication Errors**: Logged and workflow continues
- **API Errors**: Retried with exponential backoff (handled by AI service)
- **Network Errors**: Logged and workflow continues with next comment
- **Rate Limiting**: Respected automatically by Instagram service

All errors are:
1. Logged to the storage service
2. Added to the workflow state
3. Handled gracefully without stopping the workflow

## Features

### Automatic Comment Detection

- Checks the last 5 posts from the authenticated account
- Filters out already processed comments
- Ignores own comments (no self-replies)
- Only processes top-level comments (not replies to replies)

### AI Reply Generation

- Uses configured reply tone (friendly, formal, professional)
- Includes post context (caption, type) for better replies
- Validates reply length against Instagram limits
- Retries on failure (up to 3 attempts)

### Smart Processing

- Processes up to `maxCommentsPerCheck` comments per cycle
- Marks comments as processed to avoid duplicates
- Maintains processing state across cycles
- Logs all activities for monitoring

### Polling Mechanism

- Configurable poll interval (default: 30 seconds)
- Prevents overlapping cycles with `isProcessing` flag
- Automatically restarts on configuration changes
- Clean shutdown on stop

## Integration with Other Services

### InstagramService

Required methods:
- `getAccountPosts(limit)`: Fetch recent posts
- `getRecentComments(mediaId)`: Fetch comments for a post
- `replyToComment(mediaId, commentId, text)`: Post a reply
- `isOwnComment(userId)`: Check if comment is from authenticated user

### AIReplyService

Required methods:
- `generateReply(text, tone, context)`: Generate AI reply

### StorageService

Required methods:
- `appendLog(entry)`: Log workflow activities
- `isCommentProcessed(commentId)`: Check if comment was processed
- `markCommentProcessed(commentId)`: Mark comment as processed

## Testing

Run the test script to verify functionality:

```bash
node server/services/test-automation-workflow.js
```

The test uses mock services to demonstrate:
- Workflow initialization
- Comment detection
- Reply generation
- Reply posting
- State management
- Logging

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollIntervalSeconds` | number | 30 | Seconds between comment checks |
| `maxCommentsPerCheck` | number | 10 | Max comments to process per cycle |
| `replyTone` | string | 'friendly' | AI reply tone (friendly/formal/professional) |

## Best Practices

1. **Start with longer poll intervals** (60+ seconds) to avoid rate limiting
2. **Monitor the stats** regularly to track performance
3. **Check logs** for errors and adjust configuration as needed
4. **Use appropriate reply tone** for your brand/audience
5. **Test with a small account** before deploying to production

## Troubleshooting

### Workflow not detecting comments

- Verify Instagram authentication is valid
- Check that posts have comments
- Ensure comments aren't already processed
- Review logs for errors

### Replies not being posted

- Check Instagram rate limits
- Verify reply text meets Instagram requirements
- Review error logs for specific issues
- Ensure Instagram account has posting permissions

### High error count

- Check network connectivity
- Verify API keys are valid
- Review Instagram account status
- Check rate limiting settings

## Requirements Satisfied

This implementation satisfies the following requirements:

- **3.1**: Polls Instagram for new comments at regular intervals
- **3.3**: Triggers reply generation process for new comments
- **3.5**: Logs all detected comments with timestamps
- **4.1**: Sends comment text to AI service
- **5.1**: Posts AI-generated replies to Instagram
- **8.2**: Begins monitoring when started
- **8.3**: Ceases activities when stopped
- **10.2**: Uses LangGraph for workflow state management
