/**
 * Test script for input validation and API key verification
 * Tests all validation functions added in task 15
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { ValidationService } = require('./encryption.service');
const AIReplyService = require('./ai-reply.service');

console.log('='.repeat(60));
console.log('Testing Input Validation and API Key Verification');
console.log('='.repeat(60));

// Test 1: Instagram Username Validation
console.log('\n1. Testing Instagram Username Validation:');
console.log('-'.repeat(60));

const usernameTests = [
  { input: 'valid_username', shouldPass: true },
  { input: 'user.name123', shouldPass: true },
  { input: '', shouldPass: false, error: 'empty' },
  { input: '   ', shouldPass: false, error: 'empty after trim' },
  { input: 'user@name', shouldPass: false, error: 'invalid character @' },
  { input: 'user name', shouldPass: false, error: 'space' },
  { input: 'a'.repeat(31), shouldPass: false, error: 'too long' },
];

usernameTests.forEach(test => {
  try {
    ValidationService.validateInstagramUsername(test.input);
    if (test.shouldPass) {
      console.log(`✓ PASS: "${test.input}"`);
    } else {
      console.log(`✗ FAIL: "${test.input}" should have failed (${test.error})`);
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log(`✓ PASS: "${test.input}" correctly rejected - ${error.message}`);
    } else {
      console.log(`✗ FAIL: "${test.input}" should have passed - ${error.message}`);
    }
  }
});

// Test 2: Instagram Password Validation
console.log('\n2. Testing Instagram Password Validation:');
console.log('-'.repeat(60));

const passwordTests = [
  { input: 'password123', shouldPass: true },
  { input: 'short', shouldPass: false, error: 'too short' },
  { input: '', shouldPass: false, error: 'empty' },
  { input: 'a'.repeat(129), shouldPass: false, error: 'too long' },
  { input: 'valid_pass_123!@#', shouldPass: true },
];

passwordTests.forEach(test => {
  try {
    ValidationService.validateInstagramPassword(test.input);
    if (test.shouldPass) {
      console.log(`✓ PASS: Password with length ${test.input.length}`);
    } else {
      console.log(`✗ FAIL: Password should have failed (${test.error})`);
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log(`✓ PASS: Password correctly rejected - ${error.message}`);
    } else {
      console.log(`✗ FAIL: Password should have passed - ${error.message}`);
    }
  }
});

// Test 3: Gemini API Key Format Validation
console.log('\n3. Testing Gemini API Key Format Validation:');
console.log('-'.repeat(60));

const apiKeyTests = [
  { input: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx', shouldPass: true },
  { input: 'AIza' + 'x'.repeat(35), shouldPass: true },
  { input: 'invalid_key', shouldPass: false, error: 'wrong prefix' },
  { input: '', shouldPass: false, error: 'empty' },
  { input: 'AIza', shouldPass: false, error: 'too short' },
  { input: 'AIza' + 'x'.repeat(50), shouldPass: false, error: 'too long' },
  { input: 'AIza@#$%', shouldPass: false, error: 'invalid characters' },
];

apiKeyTests.forEach(test => {
  try {
    ValidationService.validateGeminiApiKey(test.input);
    if (test.shouldPass) {
      console.log(`✓ PASS: API key format valid`);
    } else {
      console.log(`✗ FAIL: API key should have failed (${test.error})`);
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log(`✓ PASS: API key correctly rejected - ${error.message}`);
    } else {
      console.log(`✗ FAIL: API key should have passed - ${error.message}`);
    }
  }
});

// Test 4: Reply Tone Validation
console.log('\n4. Testing Reply Tone Validation:');
console.log('-'.repeat(60));

const toneTests = [
  { input: 'friendly', shouldPass: true },
  { input: 'formal', shouldPass: true },
  { input: 'professional', shouldPass: true },
  { input: 'FRIENDLY', shouldPass: true },
  { input: 'casual', shouldPass: false, error: 'invalid tone' },
  { input: '', shouldPass: false, error: 'empty' },
];

toneTests.forEach(test => {
  try {
    ValidationService.validateReplyTone(test.input);
    if (test.shouldPass) {
      console.log(`✓ PASS: Tone "${test.input}" is valid`);
    } else {
      console.log(`✗ FAIL: Tone "${test.input}" should have failed (${test.error})`);
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log(`✓ PASS: Tone "${test.input}" correctly rejected - ${error.message}`);
    } else {
      console.log(`✗ FAIL: Tone "${test.input}" should have passed - ${error.message}`);
    }
  }
});

// Test 5: Credentials Validation and Sanitization
console.log('\n5. Testing Credentials Validation and Sanitization:');
console.log('-'.repeat(60));

try {
  const sanitized = ValidationService.validateAndSanitizeCredentials({
    username: '  test_user  ',
    password: 'password123'
  });
  console.log(`✓ PASS: Credentials sanitized - username: "${sanitized.username}"`);
} catch (error) {
  console.log(`✗ FAIL: Valid credentials rejected - ${error.message}`);
}

try {
  ValidationService.validateAndSanitizeCredentials({
    username: 'invalid@user',
    password: 'password123'
  });
  console.log(`✗ FAIL: Invalid username should have been rejected`);
} catch (error) {
  console.log(`✓ PASS: Invalid username correctly rejected - ${error.message}`);
}

// Test 6: API Key Validation (Real API Test)
console.log('\n6. Testing Gemini API Key Validation (Real API Test):');
console.log('-'.repeat(60));
console.log('Note: This test requires a valid Gemini API key in .env');

async function testApiKeyValidation() {
  // Test with invalid format
  console.log('\nTesting with invalid format key...');
  const invalidResult = await AIReplyService.validateApiKey('invalid_key_format');
  if (!invalidResult.valid) {
    console.log(`✓ PASS: Invalid format key rejected - ${invalidResult.error}`);
  } else {
    console.log(`✗ FAIL: Invalid format key should have been rejected`);
  }

  // Test with properly formatted but fake key
  console.log('\nTesting with fake but properly formatted key...');
  const fakeResult = await AIReplyService.validateApiKey('AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  if (!fakeResult.valid) {
    console.log(`✓ PASS: Fake key rejected - ${fakeResult.error}`);
  } else {
    console.log(`✗ FAIL: Fake key should have been rejected`);
  }

  // Test with environment variable key (if set)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    console.log('\nTesting with environment variable key...');
    const envResult = await AIReplyService.validateApiKey(process.env.GEMINI_API_KEY);
    if (envResult.valid) {
      console.log(`✓ PASS: Environment key is valid`);
    } else {
      console.log(`✗ FAIL: Environment key validation failed - ${envResult.error}`);
    }
  } else {
    console.log('\n⚠️  SKIP: No valid GEMINI_API_KEY in environment');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Validation Tests Complete!');
  console.log('='.repeat(60));
}

testApiKeyValidation().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
