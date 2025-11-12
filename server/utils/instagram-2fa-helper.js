const { IgApiClient } = require('instagram-private-api');
const readline = require('readline');

/**
 * Helper script to handle Instagram 2FA/Challenge verification
 * Run this manually when you need to verify your account
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function handle2FA() {
  try {
    const username = await question('Instagram username: ');
    const password = await question('Instagram password: ');
    
    const client = new IgApiClient();
    client.state.generateDevice(username);
    
    console.log('\nAttempting to login...');
    
    try {
      await client.account.login(username, password);
      console.log('✓ Login successful! No 2FA required.');
      
      // Save session
      const state = await client.state.serialize();
      const fs = require('fs').promises;
      const path = require('path');
      
      const sessionPath = path.join(__dirname, '../storage/instagram-session.json');
      await fs.writeFile(sessionPath, JSON.stringify({
        username: username,
        state: state,
        savedAt: new Date().toISOString()
      }, null, 2));
      
      console.log('✓ Session saved successfully!');
      console.log('\nYou can now use the automation without 2FA challenges.');
      
    } catch (error) {
      if (error.message.includes('challenge_required')) {
        console.log('\n⚠ Instagram requires verification.');
        console.log('Please complete the challenge:');
        console.log('1. Open Instagram app on your phone');
        console.log('2. You should see a security notification');
        console.log('3. Approve the login attempt');
        console.log('4. Wait a few minutes and try again');
        
      } else if (error.message.includes('two_factor_required')) {
        console.log('\n⚠ 2FA code required');
        const code = await question('Enter 2FA code: ');
        
        const twoFactorIdentifier = error.response.body.two_factor_info.two_factor_identifier;
        await client.account.twoFactorLogin({
          username,
          verificationCode: code,
          twoFactorIdentifier,
          verificationMethod: '1', // '1' for SMS, '0' for authenticator app
          trustThisDevice: '1'
        });
        
        console.log('✓ 2FA verification successful!');
        
        // Save session
        const state = await client.state.serialize();
        const fs = require('fs').promises;
        const path = require('path');
        
        const sessionPath = path.join(__dirname, '../storage/instagram-session.json');
        await fs.writeFile(sessionPath, JSON.stringify({
          username: username,
          state: state,
          savedAt: new Date().toISOString()
        }, null, 2));
        
        console.log('✓ Session saved successfully!');
        
      } else {
        console.error('✗ Login failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

console.log('=== Instagram 2FA Helper ===\n');
console.log('This tool helps you authenticate with Instagram when 2FA is required.\n');

handle2FA();
