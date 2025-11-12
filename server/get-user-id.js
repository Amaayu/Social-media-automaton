require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

/**
 * Get User ID by email
 * Run with: node server/get-user-id.js [email]
 * If no email provided, lists all users
 */

async function getUserId() {
  try {
    const email = process.argv[2];

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation');

    const User = require('./models/User');

    if (email) {
      // Find specific user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User not found with email: ${email}`);
        process.exit(1);
      }

      console.log('\n✅ User found!');
      console.log('='.repeat(60));
      console.log(`Name:     ${user.name}`);
      console.log(`Email:    ${user.email}`);
      console.log(`User ID:  ${user._id}`);
      console.log('='.repeat(60));
      console.log('\n📋 Copy this User ID to use with debug script:');
      console.log(`\n   node server/test-automation-debug.js ${user._id}\n`);
    } else {
      // List all users
      const users = await User.find({}, { name: 1, email: 1 }).sort({ createdAt: -1 });
      
      if (users.length === 0) {
        console.log('❌ No users found in database');
        process.exit(1);
      }

      console.log(`\n📋 Found ${users.length} user(s):\n`);
      console.log('='.repeat(80));
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Debug command: node server/test-automation-debug.js ${user._id}`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('\n💡 Tip: Run with email to get specific user:');
      console.log('   node server/get-user-id.js user@example.com\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

getUserId();
