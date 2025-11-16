# Production Deployment Guide

## OAuth Redirect URL Configuration

### Understanding the URLs

Your application uses these URLs for OAuth callbacks:

**Instagram OAuth Callback:**
```
{OAUTH_REDIRECT_BASE_URL}/api/oauth/instagram/callback
```

**YouTube OAuth Callback:**
```
{OAUTH_REDIRECT_BASE_URL}/api/oauth/youtube/callback
```

---

## Production URL Options

### Option 1: Deploy on a VPS/Cloud Server (Recommended)

If you deploy on a server with a domain:

**Example Domain:** `https://yourdomain.com`

```env
# Production .env
NODE_ENV=production
PORT=3000

# Your production domain (MUST be HTTPS)
OAUTH_REDIRECT_BASE_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# OAuth credentials
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

**Full Callback URLs to register:**
- Instagram: `https://yourdomain.com/api/oauth/instagram/callback`
- YouTube: `https://yourdomain.com/api/oauth/youtube/callback`

---

### Option 2: Deploy on Railway.app (Easy & Free)

Railway provides a free tier with automatic HTTPS:

**Example URL:** `https://your-app-name.up.railway.app`

```env
# Railway .env
NODE_ENV=production
PORT=3000

# Railway automatically provides HTTPS
OAUTH_REDIRECT_BASE_URL=https://your-app-name.up.railway.app
APP_URL=https://your-app-name.up.railway.app
FRONTEND_URL=https://your-app-name.up.railway.app
```

**Deployment Steps:**
1. Go to https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in Railway dashboard
6. Railway will provide your URL: `https://your-app-name.up.railway.app`

**Full Callback URLs:**
- Instagram: `https://your-app-name.up.railway.app/api/oauth/instagram/callback`
- YouTube: `https://your-app-name.up.railway.app/api/oauth/youtube/callback`

---

### Option 3: Deploy on Render.com (Free Tier Available)

**Example URL:** `https://your-app-name.onrender.com`

```env
# Render .env
NODE_ENV=production
PORT=3000

OAUTH_REDIRECT_BASE_URL=https://your-app-name.onrender.com
APP_URL=https://your-app-name.onrender.com
FRONTEND_URL=https://your-app-name.onrender.com
```

**Deployment Steps:**
1. Go to https://render.com/
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Set build command: `npm install && cd client && npm install && npm run build`
6. Set start command: `npm start`
7. Add environment variables
8. Deploy

**Full Callback URLs:**
- Instagram: `https://your-app-name.onrender.com/api/oauth/instagram/callback`
- YouTube: `https://your-app-name.onrender.com/api/oauth/youtube/callback`

---

### Option 4: Deploy on Heroku

**Example URL:** `https://your-app-name.herokuapp.com`

```env
# Heroku .env
NODE_ENV=production
PORT=3000

OAUTH_REDIRECT_BASE_URL=https://your-app-name.herokuapp.com
APP_URL=https://your-app-name.herokuapp.com
FRONTEND_URL=https://your-app-name.herokuapp.com
```

---

### Option 5: Deploy on DigitalOcean App Platform

**Example URL:** `https://your-app-name.ondigitalocean.app`

```env
# DigitalOcean .env
NODE_ENV=production
PORT=3000

OAUTH_REDIRECT_BASE_URL=https://your-app-name.ondigitalocean.app
APP_URL=https://your-app-name.ondigitalocean.app
FRONTEND_URL=https://your-app-name.ondigitalocean.app
```

---

### Option 6: Deploy with Docker on Your Own Server

If you have a VPS (DigitalOcean, AWS EC2, Linode, etc.):

**Example Domain:** `https://api.yourdomain.com`

```env
# Docker Production .env
NODE_ENV=production
PORT=3000

OAUTH_REDIRECT_BASE_URL=https://api.yourdomain.com
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Docker Deployment:**
```bash
# On your server
git clone https://github.com/Amaayu/Social-media-automaton.git
cd Social-media-automaton

# Create production .env file
nano .env
# (paste your production environment variables)

# Run with Docker Compose
docker compose up -d

# Set up nginx reverse proxy with SSL
# (see nginx configuration below)
```

---

## Important: Update OAuth App Settings

After deploying, you MUST update your OAuth app redirect URIs:

### Instagram (Facebook Developer Console)

1. Go to https://developers.facebook.com/apps
2. Select your app
3. Go to **Instagram API with Instagram Login** → **Settings**
4. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://your-production-domain.com/api/oauth/instagram/callback
   ```
5. Click **Save Changes**

### YouTube (Google Cloud Console)

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://your-production-domain.com/api/oauth/youtube/callback
   ```
6. Click **Save**

---

## Complete Production .env Template

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security - REQUIRED (Generate new keys for production!)
ENCRYPTION_KEY=<generate_new_32_byte_hex>
JWT_SECRET=<generate_new_32_byte_hex>
JWT_EXPIRES_IN=7d

# MongoDB Atlas - REQUIRED
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instagram-automation

# Production URLs - REPLACE WITH YOUR ACTUAL DOMAIN
OAUTH_REDIRECT_BASE_URL=https://your-production-domain.com
APP_URL=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com

# OAuth Configuration - REQUIRED
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Gemini API - REQUIRED
GEMINI_API_KEY=your_gemini_api_key

# Image Hosting - Optional
IMGBB_API_KEY=your_imgbb_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Automation Settings
POLL_INTERVAL_SECONDS=30
MAX_COMMENTS_PER_CHECK=10
```

---

## Generate New Security Keys for Production

**IMPORTANT:** Never use development keys in production!

```bash
# Generate new ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate new JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Nginx Configuration (If using VPS)

If you're deploying on a VPS with nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Get SSL Certificate:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Testing Your Production Deployment

After deployment, test these endpoints:

1. **Health Check:**
   ```bash
   curl https://your-production-domain.com/api/health
   ```

2. **OAuth Instagram URL:**
   ```bash
   curl https://your-production-domain.com/api/oauth/instagram/url
   ```

3. **OAuth YouTube URL:**
   ```bash
   curl https://your-production-domain.com/api/oauth/youtube/url
   ```

---

## Common Issues & Solutions

### Issue: OAuth redirect mismatch error

**Solution:** Make sure the redirect URI in your OAuth app settings EXACTLY matches:
- Instagram: `https://your-domain.com/api/oauth/instagram/callback`
- YouTube: `https://your-domain.com/api/oauth/youtube/callback`

### Issue: Mixed content error (HTTP/HTTPS)

**Solution:** Ensure ALL URLs use HTTPS in production:
```env
OAUTH_REDIRECT_BASE_URL=https://your-domain.com  # NOT http://
```

### Issue: CORS errors

**Solution:** Update `FRONTEND_URL` to match your actual frontend domain

---

## Recommended: Use Environment-Specific Files

Create separate env files:

- `.env.development` - Local development
- `.env.production` - Production deployment
- `.env.example` - Template (commit to git)

**Never commit `.env` or `.env.production` to git!**

---

## Quick Deployment Checklist

- [ ] Choose deployment platform (Railway, Render, VPS, etc.)
- [ ] Get your production domain/URL
- [ ] Generate new ENCRYPTION_KEY and JWT_SECRET
- [ ] Update OAUTH_REDIRECT_BASE_URL with production URL
- [ ] Update Instagram OAuth redirect URI in Facebook Developer Console
- [ ] Update YouTube OAuth redirect URI in Google Cloud Console
- [ ] Set NODE_ENV=production
- [ ] Test OAuth flows after deployment
- [ ] Enable HTTPS (automatic on Railway/Render, manual on VPS)

---

## Need Help?

- Railway: https://docs.railway.app/
- Render: https://render.com/docs
- DigitalOcean: https://docs.digitalocean.com/
- Let's Encrypt (SSL): https://letsencrypt.org/getting-started/
