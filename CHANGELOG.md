# Changelog

## [1.1.0] - 2024-11-12

### 🚨 Breaking Changes
- Updated for Instagram API scope changes (effective January 27, 2025)
- Users must regenerate access tokens with new scope names

### ✨ Added
- **MongoDB Storage**: Replaced file-based storage with MongoDB for logs, comments, and configuration
- **New Documentation**: Comprehensive Instagram API setup guide (`INSTAGRAM_API_SETUP.md`)
- **Token Checker**: Utility script to verify access token scopes (`npm run check-token`)
- **Multi-user Support**: Each user's data is now isolated in the database
- **CORS Fix**: Dynamic CORS to support any localhost port

### 🔧 Changed
- **Instagram Graph API**: Updated to v21.0 (latest stable)
- **Gemini Model**: Using `gemini-flash-latest` for stable AI responses
- **Scope Names**: Updated documentation for new Instagram scope requirements:
  - `instagram_business_basic` (replaces `business_basic`)
  - `instagram_business_manage_comments` (replaces `business_manage_comments`)

### 🐛 Fixed
- Fixed file-based storage errors (logs.json not found)
- Fixed CORS issues when frontend runs on different ports
- Fixed authentication flow for automation endpoints
- Fixed storage service to use authenticated user IDs

### 📚 Documentation
- Added `INSTAGRAM_API_SETUP.md` - Complete Instagram API setup guide
- Added `CHANGELOG.md` - Track all changes
- Updated `README.md` - Added warning about new scope requirements
- Added inline UI warnings about scope changes

### 🛠️ Technical Changes

#### New Files
- `server/services/storage.service.js` - MongoDB-based storage
- `server/controllers/logs.controller.js` - Log management
- `server/controllers/config.controller.js` - Configuration management
- `server/models/user-credentials.model.js` - Credential wrapper
- `server/routes/credentials.routes.js` - Credential status API
- `server/utils/check-token-scopes.js` - Token verification utility
- `INSTAGRAM_API_SETUP.md` - Setup documentation
- `CHANGELOG.md` - This file

#### Modified Files
- `server/index.js` - Dynamic CORS, removed file-based initialization
- `server/services/ai-reply.service.js` - Updated to `gemini-flash-latest`
- `server/services/instagram-graph.service.js` - Updated to API v21.0
- `server/controllers/automation.controller.js` - User-specific storage
- `client/src/components/ConfigurationPanel.jsx` - Added scope warnings
- `README.md` - Added API update warnings
- `package.json` - Added `check-token` script

### 📦 Database Models
- `ActivityLog` - User activity and automation logs
- `ProcessedComment` - Track processed comments per user
- `User` - User authentication and settings

### 🔐 Security
- Credentials encrypted before storage
- User-specific data isolation
- JWT-based authentication
- Secure token handling

### 📊 Migration Notes

If you're upgrading from a previous version:

1. **MongoDB Required**: Set up MongoDB Atlas (see `MONGODB_QUICK_SETUP.md`)
2. **Regenerate Tokens**: Create new access tokens with updated scope names
3. **Environment Variables**: Update `.env` with MongoDB connection string
4. **Test Token**: Run `npm run check-token YOUR_TOKEN` to verify scopes

### 🎯 Next Steps

Users should:
1. Read `INSTAGRAM_API_SETUP.md` for complete setup instructions
2. Regenerate Instagram access tokens with new scope names
3. Verify tokens using `npm run check-token YOUR_TOKEN`
4. Update tokens before January 27, 2025 deadline

---

## [1.0.0] - 2024-11-11

### Initial Release
- Instagram comment automation
- AI-powered replies using Gemini
- File-based storage
- Single-user setup
- Basic authentication
