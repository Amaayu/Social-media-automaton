/**
 * Test script for AIReplyService
 * Run with: node server/services/test-ai-service.js
 */

require('dotenv').config();
const AIReplyService = require('./ai-reply.service');

async function testAIReplyService() {
  console.log('Testing AI Reply Service...\n');

  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('Please add GEMINI_API_KEY to your .env file');
    process.exit(1);
  }

  try {
    // Initialize service
    const aiService = new AIReplyService(process.env.GEMINI_API_KEY);
    console.log('✓ AIReplyService initialized\n');

    // Test 1: Friendly tone
    console.log('Test 1: Friendly tone');
    console.log('Comment: "Love this post!"');
    const friendlyReply = await aiService.generateReply('Love this post!', 'friendly');
    console.log('Reply:', friendlyReply);
    console.log('Length:', friendlyReply.length, 'characters\n');

    // Test 2: Formal tone
    console.log('Test 2: Formal tone');
    console.log('Comment: "Could you provide more information about this?"');
    const formalReply = await aiService.generateReply(
      'Could you provide more information about this?',
      'formal'
    );
    console.log('Reply:', formalReply);
    console.log('Length:', formalReply.length, 'characters\n');

    // Test 3: Professional tone
    console.log('Test 3: Professional tone');
    console.log('Comment: "Interested in collaborating with your brand"');
    const professionalReply = await aiService.generateReply(
      'Interested in collaborating with your brand',
      'professional'
    );
    console.log('Reply:', professionalReply);
    console.log('Length:', professionalReply.length, 'characters\n');

    // Test 4: With context
    console.log('Test 4: With post context');
    console.log('Comment: "Where can I buy this?"');
    const contextReply = await aiService.generateReply(
      'Where can I buy this?',
      'friendly',
      {
        caption: 'Check out our new summer collection! 🌞',
        postType: 'photo'
      }
    );
    console.log('Reply:', contextReply);
    console.log('Length:', contextReply.length, 'characters\n');

    // Test 5: Connection test
    console.log('Test 5: Connection test');
    const connectionTest = await aiService.testConnection();
    console.log('Connection test:', connectionTest.success ? '✓ Passed' : '✗ Failed');
    if (connectionTest.success) {
      console.log('Sample reply:', connectionTest.reply);
    }

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testAIReplyService();
