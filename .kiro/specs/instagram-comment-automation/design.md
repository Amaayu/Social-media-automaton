# Design Document: Instagram Comment Automation

## Overview

The Instagram Comment Automation system is a full-stack JavaScript application that automatically monitors Instagram posts/reels for new comments and generates AI-powered replies using Google's free Gemini API. The system consists of:

1. **Frontend**: Vite + React web interface for configuration and monitoring
2. **Backend**: Node.js/Express server handling Instagram integration and automation logic
3. **AI Layer**: LangChain + Gemini API for intelligent reply generation
4. **Workflow Engine**: LangGraph for managing automation state and flow
5. **Storage**: Local JSON file storage for configuration and logs (easily upgradeable to database)

The architecture prioritizes simplicity, free deployment, and ease of use while maintaining security and reliability.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Interface                         │
│                    (Vite + React)                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Server                           │
│                   (Node.js + Express)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  Automation  │  │   Config     │     │
│  │  Controller  │  │  Controller  │  │  Controller  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────┬────────────────┬────────────────┬─────────────┘
             │                │                │
             ▼                ▼                ▼
┌────────────────────┐ ┌──────────────────────────────────┐
│  Instagram API     │ │    LangGraph Workflow Engine     │
│  Integration       │ │                                  │
└────────────────────┘ │  ┌────────────────────────────┐ │
                       │  │  Comment Detection Node    │ │
                       │  └────────────┬───────────────┘ │
                       │               ▼                  │
                       │  ┌────────────────────────────┐ │
                       │  │  Reply Generation Node     │ │
                       │  │  (LangChain + Gemini)      │ │
                       │  └────────────┬───────────────┘ │
                       │               ▼                  │
                       │  ┌────────────────────────────┐ │
                       │  │  Reply Posting Node        │ │
                       │  └────────────────────────────┘ │
                       └──────────────────────────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │   Storage Layer              │
                       │   (JSON Files)               │
                       │   - config.json              │
                       │   - logs.json                │
                       │   - processed_comments.json  │
                       └──────────────────────────────┘
```

### Technology Stack

- **Frontend**: Vite, React, TailwindCSS (for simple, responsive UI)
- **Backend**: Node.js 18+, Express.js
- **AI/ML**: LangChain.js, @langchain/google-genai (Gemini integration)
- **Workflow**: @langchain/langgraph
- **Instagram Integration**: instagram-private-api (unofficial but widely used)
- **Security**: crypto (Node.js built-in for encryption), dotenv
- **Deployment**: Docker-ready, compatible with Render, Railway, Fly.io (free tiers)

## Components and Interfaces

### 1. Frontend Components

#### ConfigurationPanel Component
```typescript
interface ConfigurationPanelProps {
  onSave: (config: UserConfig) => Promise<void>;
  currentConfig: UserConfig | null;
}

interface UserConfig {
  instagramUsername: string;
  instagramPassword: string; // Encrypted before sending to backend
  replyTone: 'friendly' | 'formal' | 'professional';
  geminiApiKey: string;
}
```

**Responsibilities:**
- Collect Instagram credentials
- Select reply tone
- Configure Gemini API key
- Validate inputs before submission

#### AutomationControl Component
```typescript
interface AutomationControlProps {
  isActive: boolean;
  onToggle: () => Promise<void>;
  status: AutomationStatus;
}

interface AutomationStatus {
  isRunning: boolean;
  lastCheck: Date | null;
  commentsProcessed: number;
  errors: number;
}
```

**Responsibilities:**
- Start/stop automation
- Display current status
- Show real-time statistics

#### ActivityLog Component
```typescript
interface ActivityLogProps {
  logs: LogEntry[];
  onExport: () => void;
  onFilter: (filter: LogFilter) => void;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'comment_detected' | 'reply_generated' | 'reply_posted' | 'error';
  message: string;
  details?: any;
}
```

**Responsibilities:**
- Display activity logs
- Filter by date/type
- Export logs

### 2. Backend API Endpoints

```typescript
// Authentication & Configuration
POST   /api/config/instagram     // Save Instagram credentials
GET    /api/config/instagram     // Get current config (without password)
DELETE /api/config/instagram     // Remove credentials

POST   /api/config/tone          // Set reply tone
GET    /api/config/tone          // Get current tone

// Automation Control
POST   /api/automation/start     // Start automation
POST   /api/automation/stop      // Stop automation
GET    /api/automation/status    // Get current status

// Logs & History
GET    /api/logs                 // Get activity logs (with pagination)
GET    /api/logs/export          // Export logs as JSON
DELETE /api/logs                 // Clear logs

// Health Check
GET    /api/health               // Health check for deployment monitoring
```

### 3. Instagram Integration Service

```typescript
class InstagramService {
  private client: IgApiClient;
  private isAuthenticated: boolean;

  async authenticate(username: string, password: string): Promise<boolean>;
  async getRecentComments(postId: string): Promise<Comment[]>;
  async replyToComment(commentId: string, text: string): Promise<boolean>;
  async getAccountPosts(limit: number): Promise<Post[]>;
  async logout(): Promise<void>;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  hasReplied: boolean;
}

interface Post {
  id: string;
  type: 'photo' | 'video' | 'reel';
  caption: string;
  timestamp: Date;
}
```

### 4. LangChain AI Service

```typescript
class AIReplyService {
  private model: ChatGoogleGenerativeAI;
  private chain: LLMChain;

  constructor(apiKey: string);
  
  async generateReply(
    comment: string,
    tone: ReplyTone,
    context?: PostContext
  ): Promise<string>;
  
  private buildPrompt(comment: string, tone: ReplyTone): string;
}

interface PostContext {
  caption: string;
  postType: string;
}

type ReplyTone = 'friendly' | 'formal' | 'professional';
```

**Prompt Templates:**
- **Friendly**: "You are a friendly and warm social media manager. Reply to this Instagram comment in a casual, approachable way..."
- **Formal**: "You are a professional social media manager. Reply to this Instagram comment in a polite and formal manner..."
- **Professional**: "You are a business professional managing a corporate Instagram account. Reply to this comment professionally..."

### 5. LangGraph Workflow Engine

```typescript
interface AutomationState {
  isRunning: boolean;
  lastCheckTime: Date;
  processedComments: Set<string>;
  pendingComments: Comment[];
  errors: Error[];
}

class AutomationWorkflow {
  private graph: StateGraph<AutomationState>;
  
  constructor(
    instagramService: InstagramService,
    aiService: AIReplyService
  );
  
  // Workflow nodes
  private async detectCommentsNode(state: AutomationState): Promise<AutomationState>;
  private async generateReplyNode(state: AutomationState): Promise<AutomationState>;
  private async postReplyNode(state: AutomationState): Promise<AutomationState>;
  private async errorHandlingNode(state: AutomationState): Promise<AutomationState>;
  
  async start(): Promise<void>;
  async stop(): Promise<void>;
  getState(): AutomationState;
}
```

**Workflow Graph:**
```
START → DetectComments → [Has New Comments?]
                              ↓ Yes
                         GenerateReply → PostReply → DetectComments
                              ↓ No
                         Wait(30s) → DetectComments
                         
                         [Any Error?] → ErrorHandling → Log → Continue
```

### 6. Storage Service

```typescript
class StorageService {
  private configPath: string;
  private logsPath: string;
  private processedCommentsPath: string;

  async saveConfig(config: EncryptedConfig): Promise<void>;
  async getConfig(): Promise<EncryptedConfig | null>;
  async deleteConfig(): Promise<void>;
  
  async appendLog(entry: LogEntry): Promise<void>;
  async getLogs(filter?: LogFilter): Promise<LogEntry[]>;
  async clearLogs(): Promise<void>;
  
  async markCommentProcessed(commentId: string): Promise<void>;
  async isCommentProcessed(commentId: string): Promise<boolean>;
  async getProcessedComments(): Promise<string[]>;
}

interface EncryptedConfig {
  instagramUsername: string;
  instagramPasswordEncrypted: string;
  replyTone: ReplyTone;
  iv: string; // Initialization vector for decryption
}
```

## Data Models

### Configuration Data
```json
{
  "instagram": {
    "username": "user123",
    "passwordEncrypted": "encrypted_base64_string",
    "iv": "initialization_vector"
  },
  "replyTone": "friendly",
  "automation": {
    "isActive": false,
    "pollIntervalSeconds": 30
  }
}
```

### Logs Data
```json
{
  "logs": [
    {
      "id": "uuid-v4",
      "timestamp": "2025-11-11T10:30:00Z",
      "type": "comment_detected",
      "message": "New comment detected on post abc123",
      "details": {
        "commentId": "comment_456",
        "username": "follower_user",
        "text": "Love this post!"
      }
    },
    {
      "id": "uuid-v4",
      "timestamp": "2025-11-11T10:30:05Z",
      "type": "reply_generated",
      "message": "AI reply generated",
      "details": {
        "commentId": "comment_456",
        "reply": "Thank you so much! We're glad you enjoyed it! 😊"
      }
    }
  ]
}
```

### Processed Comments Data
```json
{
  "processedComments": [
    "comment_456",
    "comment_789"
  ]
}
```

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid Instagram credentials
   - Instagram session expired
   - Two-factor authentication required
   - **Handling**: Log error, stop automation, notify user via UI

2. **API Errors**
   - Gemini API key invalid
   - Gemini API rate limit exceeded
   - Gemini API timeout
   - **Handling**: Retry up to 3 times with exponential backoff, log error, continue with next comment

3. **Instagram API Errors**
   - Rate limiting (429)
   - Comment not found
   - Permission denied
   - **Handling**: Implement exponential backoff, respect rate limits, log and skip problematic comments

4. **Network Errors**
   - Connection timeout
   - DNS resolution failure
   - **Handling**: Retry with exponential backoff, log error, continue automation

### Error Recovery Strategy

```typescript
class ErrorHandler {
  async handleError(error: Error, context: ErrorContext): Promise<ErrorAction> {
    // Log all errors
    await this.logError(error, context);
    
    // Determine action based on error type
    if (error instanceof AuthenticationError) {
      return ErrorAction.STOP_AUTOMATION;
    }
    
    if (error instanceof RateLimitError) {
      return ErrorAction.WAIT_AND_RETRY;
    }
    
    if (error instanceof NetworkError) {
      return ErrorAction.RETRY_WITH_BACKOFF;
    }
    
    // Default: log and continue
    return ErrorAction.CONTINUE;
  }
}
```

## Security Considerations

### 1. Credential Encryption
- Instagram passwords encrypted using AES-256-CBC before storage
- Encryption key derived from environment variable
- Initialization vector (IV) stored with encrypted data

```typescript
import crypto from 'crypto';

function encryptPassword(password: string, key: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}
```

### 2. API Key Protection
- Gemini API key stored in .env file (never committed to git)
- .env.example provided with placeholder values
- API key never exposed in logs or API responses

### 3. Rate Limiting
- Implement rate limiting on backend API endpoints
- Respect Instagram's rate limits (max 200 requests/hour)
- Implement exponential backoff for failed requests

### 4. Input Validation
- Validate all user inputs on both frontend and backend
- Sanitize Instagram credentials before use
- Validate generated replies before posting

## Testing Strategy

### Unit Tests
- Test individual services (InstagramService, AIReplyService, StorageService)
- Test encryption/decryption functions
- Test prompt generation for different tones
- Test error handling logic

### Integration Tests
- Test complete workflow from comment detection to reply posting
- Test API endpoints with mock services
- Test LangGraph workflow state transitions

### End-to-End Tests
- Test full user flow: configure → start automation → detect comment → generate reply → post reply
- Test error scenarios (invalid credentials, API failures)
- Test automation start/stop functionality

### Manual Testing Checklist
- Deploy to free cloud platform and verify functionality
- Test with real Instagram account (test account recommended)
- Verify UI responsiveness on mobile and desktop
- Test with different reply tones
- Verify logs and export functionality

## Deployment Architecture

### Environment Variables (.env)
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Security
ENCRYPTION_KEY=your_32_byte_hex_key_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Instagram (optional, can be configured via UI)
INSTAGRAM_USERNAME=
INSTAGRAM_PASSWORD=

# Automation Settings
POLL_INTERVAL_SECONDS=30
MAX_COMMENTS_PER_CHECK=10
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Free Cloud Platform Options

1. **Render.com** (Recommended)
   - Free tier: 750 hours/month
   - Auto-deploy from GitHub
   - Built-in environment variables
   - Zero configuration needed

2. **Railway.app**
   - $5 free credit/month
   - Simple deployment
   - Good for Node.js apps

3. **Fly.io**
   - Free tier with limitations
   - Global deployment
   - Dockerfile support

### Deployment Steps
1. Push code to GitHub repository
2. Connect repository to cloud platform
3. Set environment variables in platform dashboard
4. Deploy (automatic build and start)
5. Access web interface via provided URL

## Performance Considerations

### Optimization Strategies

1. **Polling Interval**: Default 30 seconds (configurable)
2. **Batch Processing**: Process up to 10 comments per check
3. **Caching**: Cache Instagram session to avoid re-authentication
4. **Lazy Loading**: Load logs on-demand with pagination
5. **Memory Management**: Limit in-memory log storage to last 1000 entries

### Scalability Notes
- Current design supports single Instagram account
- Storage uses JSON files (suitable for single user)
- For multi-user support, would need:
  - Database (PostgreSQL/MongoDB)
  - User authentication system
  - Queue system for comment processing

## Future Enhancements (Out of Scope)

- Multi-account support
- Custom reply templates
- Comment filtering (keywords, user blacklist)
- Analytics dashboard
- Scheduled automation (time-based activation)
- Direct message automation
- Multi-language support
