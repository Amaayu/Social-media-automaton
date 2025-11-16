# Quick Production Setup Guide

## TL;DR - What URL to Use?

The `OAUTH_REDIRECT_BASE_URL` should be **your backend's public URL** where the app is deployed.

---

## Most Common Scenarios

### 🚀 Scenario 1: Railway.app (Easiest - Recommended)

**Your URL will be:** `https://your-app-name.up.railway.app`

```env
OAUTH_REDIRECT_BASE_URL=https://your-app-name.up.railway.app
APP_URL=https://your-app-name.up.railway.app
FRONTEND_URL=https://your-app-name.up.railway.app
```

**Callback URLs to register:**
- Instagram: `https://your-app-name.up.railway.app/api/oauth/instagram/callback`
- YouTube: `https://your-app-name.up.railway.app/api/oauth/youtube/callback`

**Deploy in 5 minutes:**
1. Go to https://railway.app/
2. Connect GitHub repo
3. Add environment variables
4. Deploy!

---

### 🌐 Scenario 2: Your Own Domain

**Your URL will be:** `https://yourdomain.com`

```env
OAUTH_REDIRECT_BASE_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Callback URLs to register:**
- Instagram: `https://yourdomain.com/api/oauth/instagram/callback`
- YouTube: `https://yourdomain.com/api/oauth/youtube/callback`

---

### 🐳 Scenario 3: Docker on VPS

**Your URL will be:** `https://api.yourdomain.com` or `https://yourdomain.com`

```env
OAUTH_REDIRECT_BASE_URL=https://api.yourdomain.com
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Callback URLs to register:**
- Instagram: `https://api.yourdomain.com/api/oauth/instagram/callback`
- YouTube: `https://api.yourdomain.com/api/oauth/youtube/callback`

---

## Critical Rules

### ✅ DO:
- Use **HTTPS** in production (required by OAuth providers)
- Use the **exact same URL** in both `.env` and OAuth app settings
- Include the **full domain** (e.g., `https://yourdomain.com`)
- Test the callback URLs after deployment

### ❌ DON'T:
- Use `http://` in production (OAuth won't work)
- Use `localhost` in production
- Forget to update OAuth app redirect URIs
- Use trailing slashes (e.g., `https://yourdomain.com/`)

---

## After Deployment: Update OAuth Apps

### Instagram (Facebook Developer Console)

1. Go to https://developers.facebook.com/apps
2. Your App → Instagram API → Settings
3. Add to **Valid OAuth Redirect URIs:**
   ```
   https://YOUR-PRODUCTION-URL/api/oauth/instagram/callback
   ```

### YouTube (Google Cloud Console)

1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials → Your OAuth Client
3. Add to **Authorized redirect URIs:**
   ```
   https://YOUR-PRODUCTION-URL/api/oauth/youtube/callback
   ```

---

## Example: Complete Production .env

```env
# Server
PORT=3000
NODE_ENV=production

# Security (Generate new ones!)
ENCRYPTION_KEY=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# 🎯 REPLACE THIS WITH YOUR ACTUAL PRODUCTION URL
OAUTH_REDIRECT_BASE_URL=https://your-production-url.com
APP_URL=https://your-production-url.com
FRONTEND_URL=https://your-production-url.com

# OAuth (from Facebook & Google consoles)
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## Quick Test

After deployment, test if it's working:

```bash
# Replace with your actual URL
curl https://your-production-url.com/api/health

# Should return: {"status":"ok","message":"Server is running"}
```

---

## Need More Details?

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for:
- Platform-specific deployment guides
- Nginx configuration
- SSL setup
- Troubleshooting
- Security best practices
