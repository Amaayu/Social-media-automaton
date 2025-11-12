require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const UserCredentialsModel = require('./models/user-credentials.model');
const { EncryptionService } = require('./services/encryption.service');
const StorageService = require('./services/storage.service');

/**
 * Check what permissions/scopes the access token has
 * This will help diagnose if the token is missing required permissions
 */

async function checkTokenPermissions() {
  try {
    console.log('='.repeat(70));
    console.log('Instagram Access Token Permissions Check');
    console.log('='.repeat(70));

    const userId = process.argv[2];
    if (!userId) {
      console.error('❌ Please provide userId: node server/check-token-permissions.js <userId>');
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

    console.log(`\n✅ Credentials loaded`);
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Token: ${accessToken.substring(0, 30)}...\n`);

    // Method 1: Try to get token info using debug_token endpoint
    console.log('1️⃣ Checking token metadata...\n');
    
    try {
      // For Instagram tokens, we need to check via the account endpoint
      const accountResponse = await axios.get(
        `https://graph.instagram.com/v21.0/${accountId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,username,name,account_type,media_count'
          }
        }
      );
      
      console.log('✅ Token is valid and active');
      console.log(`   Username: @${accountResponse.data.username}`);
      console.log(`   Account Type: ${accountResponse.data.account_type}`);
      console.log(`   Media Count: ${accountResponse.data.media_count}`);
    } catch (error) {
      console.error('❌ Token validation failed:', error.response?.data?.error?.message || error.message);
      process.exit(1);
    }

    // Method 2: Test specific permissions by trying to access protected resources
    console.log('\n2️⃣ Testing specific permissions...\n');

    const permissionTests = [
      {
        name: 'instagram_business_basic',
        description: 'Read basic account info',
        test: async () => {
          const response = await axios.get(
            `https://graph.instagram.com/v21.0/${accountId}`,
            {
              params: {
                access_token: accessToken,
                fields: 'id,username'
              }
            }
          );
          return response.status === 200;
        }
      },
      {
        name: 'instagram_business_manage_comments',
        description: 'Read and manage comments',
        test: async () => {
          // Get a media item first
          const mediaResponse = await axios.get(
            `https://graph.instagram.com/v21.0/${accountId}/media`,
            {
              params: {
                access_token: accessToken,
                fields: 'id',
                limit: 1
              }
            }
          );
          
          if (mediaResponse.data.data.length === 0) {
            return 'NO_MEDIA';
          }
          
          const mediaId = mediaResponse.data.data[0].id;
          
          // Try to read comments
          const commentsResponse = await axios.get(
            `https://graph.instagram.com/v21.0/${mediaId}/comments`,
            {
              params: {
                access_token: accessToken,
                fields: 'id,text'
              }
            }
          );
          
          return commentsResponse.status === 200;
        }
      },
      {
        name: 'pages_read_engagement',
        description: 'Read Page engagement (for Facebook Login)',
        test: async () => {
          // This is only needed for Facebook Login method
          // For Instagram Login, this is not required
          return 'NOT_REQUIRED_FOR_INSTAGRAM_LOGIN';
        }
      }
    ];

    for (const test of permissionTests) {
      try {
        console.log(`   Testing: ${test.name}`);
        console.log(`   Description: ${test.description}`);
        
        const result = await test.test();
        
        if (result === 'NO_MEDIA') {
          console.log(`   ⚠️  Cannot test - no media found`);
        } else if (result === 'NOT_REQUIRED_FOR_INSTAGRAM_LOGIN') {
          console.log(`   ℹ️  Not required for Instagram Login method`);
        } else if (result === true) {
          console.log(`   ✅ GRANTED - Permission is working`);
        } else {
          console.log(`   ❌ DENIED - Permission not working`);
        }
      } catch (error) {
        const errorCode = error.response?.data?.error?.code;
        const errorMessage = error.response?.data?.error?.message;
        const errorType = error.response?.data?.error?.type;
        
        if (errorCode === 10 || errorType === 'OAuthException') {
          console.log(`   ❌ MISSING - Permission not granted`);
          console.log(`   Error: ${errorMessage}`);
        } else {
          console.log(`   ⚠️  ERROR - ${errorMessage || error.message}`);
        }
      }
      console.log('');
    }

    // Method 3: Try to actually fetch comments from a post with comments
    console.log('3️⃣ Testing comment access on actual posts...\n');
    
    try {
      const mediaResponse = await axios.get(
        `https://graph.instagram.com/v21.0/${accountId}/media`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,caption,comments_count',
            limit: 10
          }
        }
      );
      
      const postsWithComments = mediaResponse.data.data.filter(m => m.comments_count > 0);
      
      if (postsWithComments.length === 0) {
        console.log('   ⚠️  No posts with comments found to test');
      } else {
        console.log(`   Found ${postsWithComments.length} posts with comments\n`);
        
        for (const post of postsWithComments.slice(0, 3)) {
          console.log(`   Post: ${post.id} (${post.comments_count} comments)`);
          
          try {
            const commentsResponse = await axios.get(
              `https://graph.instagram.com/v21.0/${post.id}/comments`,
              {
                params: {
                  access_token: accessToken,
                  fields: 'id,text,username,timestamp,hidden,from'
                }
              }
            );
            
            const comments = commentsResponse.data.data;
            console.log(`   ✅ API returned ${comments.length} comments`);
            
            if (comments.length === 0 && post.comments_count > 0) {
              console.log(`   ⚠️  WARNING: Post has ${post.comments_count} comments but API returns 0`);
              console.log(`   Possible reasons:`);
              console.log(`      - Comments are from private accounts`);
              console.log(`      - Comments are hidden/filtered`);
              console.log(`      - Comments are replies (not top-level)`);
            } else if (comments.length > 0) {
              console.log(`   Sample comment: @${comments[0].username}: "${comments[0].text.substring(0, 40)}..."`);
            }
          } catch (error) {
            console.log(`   ❌ Failed to fetch comments: ${error.response?.data?.error?.message || error.message}`);
          }
          console.log('');
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to fetch media: ${error.response?.data?.error?.message || error.message}`);
    }

    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY\n');
    console.log('Required Permissions for Comment Automation:');
    console.log('  ✅ instagram_business_basic');
    console.log('  ✅ instagram_business_manage_comments');
    console.log('');
    console.log('If any permission shows as MISSING or DENIED:');
    console.log('  1. Regenerate your access token:');
    console.log('     node server/utils/instagram-oauth-helper.js');
    console.log('');
    console.log('  2. Make sure to grant ALL required permissions');
    console.log('');
    console.log('  3. Update token in Platform Settings');
    console.log('');
    console.log('If permissions are OK but comments return 0:');
    console.log('  → Comments are likely from PRIVATE Instagram accounts');
    console.log('  → Test with comments from PUBLIC accounts');
    console.log('  → Read: INSTAGRAM_COMMENTS_ISSUE.md');
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

checkTokenPermissions();
