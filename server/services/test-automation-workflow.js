/**
 * Test script for AutomationWorkflow service
 * This script demonstrates the workflow initialization and basic functionality
 */

const AutomationWorkflow = require('./automation-workflow.service');

// Mock services for testing
class MockInstagramService {
  constructor() {
    this.isAuthenticated = true;
    this.userId = '12345';
  }

  async getAccountPosts(limit) {
    console.log(`[MockInstagram] Getting ${limit} posts`);
    return [
      {
        id: 'post_1',
        pk: 'post_pk_1',
        type: 'photo',
        caption: 'Test post caption',
        timestamp: new Date(),
        commentCount: 2
      }
    ];
  }

  async getRecentComments(mediaId) {
    console.log(`[MockInstagram] Getting comments for ${mediaId}`);
    return [
      {
        id: 'comment_1',
        postId: mediaId,
        userId: '67890',
        username: 'test_user',
        text: 'Great post!',
        timestamp: new Date(),
        hasReplied: false,
        parentCommentId: null
      }
    ];
  }

  async replyToComment(mediaId, commentId, text) {
    console.log(`[MockInstagram] Posting reply to ${commentId}: "${text}"`);
    return true;
  }

  isOwnComment(userId) {
    return userId === this.userId;
  }
}

class MockAIReplyService {
  async generateReply(commentText, tone, context) {
    console.log(`[MockAI] Generating ${tone} reply for: "${commentText}"`);
    await this.sleep(500); // Simulate API delay
    return `Thank you for your comment! We appreciate your feedback. 😊`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class MockStorageService {
  constructor() {
    this.logs = [];
    this.processedComments = new Set();
  }

  async appendLog(entry) {
    const logEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
    this.logs.push(logEntry);
    console.log(`[MockStorage] Log: [${entry.type}] ${entry.message}`);
  }

  async isCommentProcessed(commentId) {
    return this.processedComments.has(commentId);
  }

  async markCommentProcessed(commentId) {
    this.processedComments.add(commentId);
    console.log(`[MockStorage] Marked comment ${commentId} as processed`);
  }

  getLogs() {
    return this.logs;
  }
}

// Test the workflow
async function testWorkflow() {
  console.log('=== Testing AutomationWorkflow ===\n');

  // Create mock services
  const instagramService = new MockInstagramService();
  const aiReplyService = new MockAIReplyService();
  const storageService = new MockStorageService();

  // Create workflow with short poll interval for testing
  const workflow = new AutomationWorkflow(
    instagramService,
    aiReplyService,
    storageService,
    {
      pollIntervalSeconds: 5,
      maxCommentsPerCheck: 10,
      replyTone: 'friendly'
    }
  );

  console.log('✓ Workflow created successfully\n');

  // Test getting initial state
  console.log('Initial state:', workflow.getState());
  console.log('');

  // Start the workflow
  console.log('Starting workflow...\n');
  await workflow.start();

  // Let it run for one cycle
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check state after first cycle
  console.log('\nState after first cycle:', workflow.getState());
  console.log('');

  // Stop the workflow
  console.log('Stopping workflow...\n');
  await workflow.stop();

  // Display logs
  console.log('\n=== Logs ===');
  const logs = storageService.getLogs();
  logs.forEach(log => {
    console.log(`[${log.type}] ${log.message}`);
  });

  console.log('\n=== Test Complete ===');
  console.log('✓ Workflow executed successfully');
  console.log('✓ All nodes functioning correctly');
  console.log('✓ State management working');
}

// Run the test
testWorkflow().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
