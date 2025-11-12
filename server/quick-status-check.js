require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

/**
 * Quick status check script
 * Shows current automation status for all users
 * Run with: node server/quick-status-check.js
 */

async function checkStatus() {
  try {
    console.log('🔍 Checking Automation Status...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation');

    const User = require('./models/User');
    const ProcessedComment = require('./models/ProcessedComment');
    const ActivityLog = require('./models/ActivityLog');

    // Get all users
    const users = await User.find({}, {
      email: 1,
      name: 1,
      automationSettings: 1,
      instagramCredentials: 1,
      geminiApiKey: 1
    });

    console.log(`Found ${users.length} user(s)\n`);
    console.log('='.repeat(80));

    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`\n   📊 Configuration:`);
      console.log(`   - Instagram Connected: ${user.instagramCredentials?.accessToken ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Gemini API Key: ${user.geminiApiKey ? '✅ Set' : '❌ Not set'}`);
      console.log(`   - Automation Active: ${user.automationSettings?.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Reply Tone: ${user.automationSettings?.replyTone || 'friendly'}`);
      console.log(`   - Poll Interval: ${user.automationSettings?.pollIntervalSeconds || 30}s`);
      console.log(`   - Selected Posts: ${user.automationSettings?.selectedPosts?.length || 0}`);

      // Get processed comments count
      const processedCount = await ProcessedComment.countDocuments({ userId: user._id });
      console.log(`\n   📝 Statistics:`);
      console.log(`   - Total Comments Processed: ${processedCount}`);

      // Get recent activity
      const recentLogs = await ActivityLog.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(5);

      if (recentLogs.length > 0) {
        console.log(`\n   📋 Recent Activity (last 5):`);
        for (const log of recentLogs) {
          const time = new Date(log.timestamp).toLocaleString();
          const icon = log.type === 'error' ? '❌' : log.type === 'info' ? 'ℹ️' : '✅';
          console.log(`   ${icon} [${time}] ${log.message}`);
        }
      } else {
        console.log(`\n   📋 Recent Activity: No activity yet`);
      }

      // Get last processed comment
      const lastProcessed = await ProcessedComment.findOne({ userId: user._id })
        .sort({ processedAt: -1 });

      if (lastProcessed) {
        const time = new Date(lastProcessed.processedAt).toLocaleString();
        console.log(`\n   🕐 Last Comment Processed:`);
        console.log(`   - Time: ${time}`);
        console.log(`   - Username: @${lastProcessed.username}`);
        console.log(`   - Comment: "${lastProcessed.text.substring(0, 50)}${lastProcessed.text.length > 50 ? '...' : ''}"`);
        console.log(`   - Status: ${lastProcessed.status}`);
      }

      console.log('\n' + '='.repeat(80));
    }

    console.log('\n✅ Status check complete!\n');

    // Provide recommendations
    console.log('💡 Recommendations:');
    for (const user of users) {
      const issues = [];
      
      if (!user.instagramCredentials?.accessToken) {
        issues.push('Add Instagram credentials in Platform Settings');
      }
      if (!user.geminiApiKey && !process.env.GEMINI_API_KEY) {
        issues.push('Set Gemini API key in .env or user settings');
      }
      if (!user.automationSettings?.isActive) {
        issues.push('Start automation from the Automation tab');
      }

      if (issues.length > 0) {
        console.log(`\n   ${user.email}:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }

    if (users.every(u => u.automationSettings?.isActive && u.instagramCredentials?.accessToken && (u.geminiApiKey || process.env.GEMINI_API_KEY))) {
      console.log('\n   ✅ All users are properly configured!');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkStatus();
