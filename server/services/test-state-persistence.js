/**
 * Test script for automation state persistence
 * Tests the saveAutomationState and loadAutomationState methods
 */

const StorageService = require('./storage.service');
const path = require('path');
const fs = require('fs').promises;

async function testStatePersistence() {
  console.log('='.repeat(50));
  console.log('Testing Automation State Persistence');
  console.log('='.repeat(50));

  // Use a test storage directory
  const testStorageDir = path.join(__dirname, '../storage-test');
  const storageService = new StorageService(testStorageDir);

  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n1. Testing saveAutomationState...');
    const testState = {
      isActive: true,
      lastCheckTime: new Date(),
      stats: {
        commentsDetected: 5,
        repliesGenerated: 4,
        repliesPosted: 3,
        errorCount: 1
      }
    };

    await storageService.saveAutomationState(testState);
    console.log('✓ State saved successfully');
    console.log('  State:', JSON.stringify(testState, null, 2));

    console.log('\n2. Testing loadAutomationState...');
    const loadedState = await storageService.loadAutomationState();
    console.log('✓ State loaded successfully');
    console.log('  Loaded state:', JSON.stringify(loadedState, null, 2));

    console.log('\n3. Verifying state integrity...');
    if (loadedState.isActive !== testState.isActive) {
      throw new Error('isActive mismatch');
    }
    if (loadedState.stats.commentsDetected !== testState.stats.commentsDetected) {
      throw new Error('commentsDetected mismatch');
    }
    if (loadedState.stats.repliesGenerated !== testState.stats.repliesGenerated) {
      throw new Error('repliesGenerated mismatch');
    }
    if (loadedState.stats.repliesPosted !== testState.stats.repliesPosted) {
      throw new Error('repliesPosted mismatch');
    }
    if (loadedState.stats.errorCount !== testState.stats.errorCount) {
      throw new Error('errorCount mismatch');
    }
    console.log('✓ State integrity verified');

    console.log('\n4. Testing state update...');
    const updatedState = {
      isActive: false,
      lastCheckTime: new Date(),
      stats: {
        commentsDetected: 10,
        repliesGenerated: 9,
        repliesPosted: 8,
        errorCount: 2
      }
    };

    await storageService.saveAutomationState(updatedState);
    const reloadedState = await storageService.loadAutomationState();
    
    if (reloadedState.isActive !== false) {
      throw new Error('State update failed - isActive should be false');
    }
    if (reloadedState.stats.commentsDetected !== 10) {
      throw new Error('State update failed - commentsDetected should be 10');
    }
    console.log('✓ State update successful');

    console.log('\n5. Testing null state (no automation config)...');
    // Clear config
    await storageService.deleteConfig();
    const nullState = await storageService.loadAutomationState();
    
    if (nullState !== null) {
      throw new Error('Expected null state for empty config');
    }
    console.log('✓ Null state handling correct');

    console.log('\n' + '='.repeat(50));
    console.log('All tests passed! ✓');
    console.log('='.repeat(50));

    // Cleanup
    await fs.rm(testStorageDir, { recursive: true, force: true });
    console.log('\nTest storage cleaned up');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    
    // Cleanup on error
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run tests
testStatePersistence();
