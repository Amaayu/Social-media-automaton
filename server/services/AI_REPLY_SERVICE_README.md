# AI Reply Service

## Overview
The AIReplyService generates intelligent, context-aware replies to Instagram comments using Google's Gemini API through LangChain.

## Features
- ✅ Three reply tones: friendly, formal, professional
- ✅ Context-aware replies (includes post caption and type)
- ✅ Automatic retry logic (up to 3 attempts with exponential backoff)
- ✅ Instagram character limit validation (2200 characters)
- ✅ Intelligent reply truncation at sentence boundaries
- ✅ Connection testing utility

## Usage

### Basic Usage
```javascript
const AIReplyService = require('./server/services/ai-reply.service');

// Initialize with Gemini API key
const aiService = new AIReplyService(process.env.GEMINI_API_KEY);

// Generate a friendly reply
const reply = await aiService.generateReply(
  'Love this post!',
  'friendly'
);
console.log(reply);
```

### With Context
```javascript
// Include post context for more relevant replies
const reply = await aiService.generateReply(
  'Where can I buy this?',
  'professional',
  {
    caption: 'Check out our new summer collection! 🌞',
    postType: 'photo'
  }
);
```

### Reply Tones

**Friendly**
- Casual and approachable
- Uses emojis occasionally
- Enthusiastic and genuine
- Example: "Thank you so much! We're glad you enjoyed it! 😊"

**Formal**
- Polite and professional
- Proper grammar, no slang
- Respectful and considerate
- Example: "Thank you for your kind words. We appreciate your support."

**Professional**
- Business-appropriate
- Concise and value-focused
- Brand reputation conscious
- Example: "We appreciate your feedback. Please visit our website for more information."

## API Reference

### Constructor
```javascript
new AIReplyService(apiKey)
```
- `apiKey` (string, required): Gemini API key

### Methods

#### generateReply(commentText, tone, context)
Generates a reply to an Instagram comment.

**Parameters:**
- `commentText` (string, required): The comment to reply to
- `tone` (string, optional): 'friendly', 'formal', or 'professional' (default: 'friendly')
- `context` (object, optional): Post context
  - `caption` (string): Post caption
  - `postType` (string): 'photo', 'video', or 'reel'

**Returns:** Promise<string> - Generated reply text

**Throws:** Error if generation fails after 3 retries

#### testConnection()
Tests the service connectivity and API key validity.

**Returns:** Promise<{success: boolean, reply?: string, error?: string}>

## Testing

Run the test script to verify the service:
```bash
node server/services/test-ai-service.js
```

Make sure you have `GEMINI_API_KEY` set in your `.env` file.

## Error Handling

The service includes robust error handling:
- Validates input parameters
- Retries failed API calls up to 3 times
- Uses exponential backoff (2s, 4s, 8s)
- Validates reply length against Instagram limits
- Provides detailed error messages

## Character Limits

Instagram comment character limit: 2200 characters

The service automatically:
1. Validates reply length
2. Truncates at sentence boundaries if too long
3. Adds ellipsis (...) if hard truncation is needed

## Requirements Satisfied

- ✅ 2.3: Uses selected reply tone for generation
- ✅ 4.1: Sends comment text to Gemini API
- ✅ 4.2: Includes reply tone in API request
- ✅ 4.3: Receives generated reply within timeout
- ✅ 4.4: Retries up to 3 times on failure
- ✅ 4.5: Validates Instagram character limits
