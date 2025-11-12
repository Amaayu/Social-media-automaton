require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const UserCredentialsModel = require('./models/user-credentials.model');
const { EncryptionService } = require('./services/encryption.service');
const StorageService = require('./services/storage.service');

/**
 * Check if comments are hidden by Instagram's automatic filtering
 */

async function checkHiddenComments() {
  try {
    console.log('='.repeat(70));
    console.log('Instagram Hidden Comments Check');
    console.log('='.repeat(70));

    const userId = process.argv[2];
    if (!userId) {
      console.error('❌ Please provide userId');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation');

    const storageService = new StorageService(userId);
    const encryptionService = new EncryptionService();
    const credentialsModel = new UserCredentialsModel(storageService, encryptionService);

    const credentials = await credentialsModel.getCredentials(userId, 'instagram');
    if (!credentials) {
      console.error('❌ No credentials found');
      process.exit(1);
    }

    const accessToken = credentials.accessToken;
    const accountId = credentials.accountId;

    console.log(`\n✅ Testing account: ${accountId}\n`);

    // Get posts with comments
    const mediaResponse = await axios.get(
      `https://graph.instagram.com/v21.0/${accountId}/media`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,caption,comments_count,timestamp',
          limit: 10
        }
      }
    );

    const postsWithComments = mediaResponse.data.data.filter(m => m.comments_count > 0);
    
    console.log(`Found ${postsWithComments.length} posts with comments\n`);
    console.log('='.repeat(70));

    for (const post of postsWithComments) {
      console.log(`\n📝 Post ID: ${post.id}`);
      console.log(`   Caption: ${post.caption ? post.caption.substring(0, 50) + '...' : 'No caption'}`);
      console.log(`   Comments Count: ${post.comments_count}`);
      console.log(`   Posted: ${new Date(post.timestamp).toLocaleString()}`);
      console.log('');

      // Try to get comments with 'hidden' field
      try {
        const commentsResponse = await axios.get(
          `https://graph.instagram.com/v21.0/${post.id}/comments`,
          {
            params: {
              access_token: accessToken,
              fields: 'id,text,username,timestamp,hidden,from{id,username}',
              limit: 100
            }
          }
        );
        
        const comments = commentsResponse.data.data;
        console.log(`   📊 API Response:`);
        console.log(`      - Visible comments returned: ${comments.length}`);
        console.log(`      - Expected comments: ${post.comments_count}`);
        console.log(`      - Missing: ${post.comments_count - comments.length}`);
        
        if (comments.length > 0) {
          console.log(`\n   ✅ Found ${comments.length} accessible comment(s):`);
          comments.forEach((c, i) => {
            const hiddenStatus = c.hidden ? '🔒 HIDDEN' : '👁️ VISIBLE';
            console.log(`      ${i + 1}. [${hiddenStatus}] @${c.username}: "${c.text.substring(0, 40)}..."`);
          });
        }
        
        if (comments.length === 0 && post.comments_count > 0) {
          console.log(`\n   ⚠️  PROBLEM DETECTED:`);
          console.log(`      Post shows ${post.comments_count} comments but API returns 0`);
          console.log('');
          console.log(`   🔍 Possible Reasons:`);
          console.log('');
          console.log(`   1. Comments are from PRIVATE accounts`);
          console.log(`      → Instagram API cannot access comments from private accounts`);
          console.log(`      → This is the most common reason`);
          console.log('');
          console.log(`   2. Comments are HIDDEN by Instagram's filter`);
          console.log(`      → Check Instagram app: Settings → Privacy → Hidden Words`);
          console.log(`      → Look in "Hidden comments" section`);
          console.log('');
          console.log(`   3. Comments are REPLIES to other comments`);
          console.log(`      → API only returns top-level comments by default`);
          console.log(`      → Replies are not included`);
          console.log('');
          console.log(`   4. Comments were DELETED`);
          console.log(`      → Comment count might not update immediately`);
          console.log('');
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error?.message || error.message}`);
      }
      
      console.log('\n' + '-'.repeat(70));
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    console.log('To test if your automation works:');
    console.log('');
    console.log('1. Open Instagram on your phone');
    console.log('2. Check if you can see the comments on your posts');
    console.log('3. If you see them, check the commenter\'s profile:');
    console.log('   - Is their account PRIVATE? (lock icon)');
    console.log('   - If yes, that\'s why API can\'t access them');
    console.log('');
    console.log('4. To test automation:');
    console.log('   a. Use a PUBLIC Instagram account (or create one)');
    console.log('   b. Make sure account privacy is OFF');
    console.log('   c. Comment: "Test from public account 🎉"');
    console.log('   d. Wait 2-3 minutes');
    console.log('   e. Run this script again');
    console.log('   f. You should see the comment!');
    console.log('');
    console.log('5. Check for hidden comments:');
    console.log('   - Instagram app → Settings → Privacy → Hidden Words');
    console.log('   - Check "Hidden comments" section');
    console.log('   - Unhide if needed');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkHiddenComments();
