# Deployment Quick Reference

## ✅ All Issues Fixed

1. ✅ **Docker build error** - Removed unused `mime` package
2. ✅ **GitHub Actions workflow** - Fixed invalid Docker tag for PRs
3. ✅ **WebSocket production error** - Auto-detects backend URL

---

## 🚀 Deploy Now (3 Options)

### Option 1: Docker (Easiest)

```bash
# 1. Make sure .env is configured
# 2. Build and run
docker compose up -d

# 3. Access at http://localhost:3000
```

**WebSocket will auto-connect to the same domain!**

### Option 2: Railway.app (Free & Fast)

```bash
# 1. Go to https://railway.app/
# 2. Connect your GitHub repo
# 3. Add environment variables from .env
# 4. Deploy!

# Railway URL: https://your-app.up.railway.app
# WebSocket auto-connects - no configuration needed!
```

### Option 3: Render.com (Free Tier)

```bash
# 1. Go to https://render.com/
# 2. New Web Service → Connect repo
# 3. Build: npm install && cd client && npm install && npm run build
# 4. Start: npm start
# 5. Add environment variables

# Render URL: https://your-app.onrender.com
# WebSocket auto-connects - no configuration needed!
```

---

## 🔧 Environment Variables Needed

### Backend (.env in root)

```env
# Security
ENCRYPTION_KEY=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Production URLs (replace with your actual domain)
OAUTH_REDIRECT_BASE_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# OAuth
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret

# AI
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (client/.env.production)

```env
# Leave empty for auto-detection (recommended)
VITE_API_URL=

# Only set if backend is on different domain:
# VITE_API_URL=https://api.yourdomain.com
```

---

## 📝 After Deployment Checklist

- [ ] Update Instagram OAuth redirect URI: `https://yourdomain.com/api/oauth/instagram/callback`
- [ ] Update YouTube OAuth redirect URI: `https://yourdomain.com/api/oauth/youtube/callback`
- [ ] Test health endpoint: `curl https://yourdomain.com/api/health`
- [ ] Check WebSocket in browser console (should show your domain, not localhost)
- [ ] Test AI Post Generator (should see real-time progress)

---

## 🐛 Quick Troubleshooting

### WebSocket still shows localhost:3000

**Solution:** Rebuild frontend
```bash
cd client
npm run build
```

### OAuth redirect mismatch

**Solution:** Update redirect URIs in:
- Facebook Developer Console (Instagram)
- Google Cloud Console (YouTube)

Must match exactly: `https://yourdomain.com/api/oauth/[platform]/callback`

### Docker build fails

**Solution:** Rebuild without cache
```bash
docker compose build --no-cache
docker compose up -d
```

---

## 📚 Full Documentation

- **WEBSOCKET_PRODUCTION_FIX.md** - WebSocket fix details
- **PRODUCTION_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **QUICK_PRODUCTION_SETUP.md** - OAuth URL configuration
- **GITHUB_ACTIONS_SETUP.md** - Docker Hub publishing

---

## 🎯 Most Common Setup

**Same domain (frontend + backend together):**

1. Deploy with Docker or platform (Railway/Render)
2. Set `OAUTH_REDIRECT_BASE_URL` to your domain
3. Update OAuth app redirect URIs
4. Done! WebSocket auto-connects

**No VITE_API_URL needed!**

---

## 💡 Pro Tips

1. **Use HTTPS in production** - Required for OAuth
2. **Generate new security keys** - Don't use development keys
3. **Test locally with Docker first** - Catch issues early
4. **Monitor logs** - `docker compose logs -f`
5. **Keep .env files secure** - Never commit to git

---

## 🆘 Need Help?

Check the detailed guides:
- WebSocket issues → `WEBSOCKET_PRODUCTION_FIX.md`
- Deployment → `PRODUCTION_DEPLOYMENT_GUIDE.md`
- OAuth URLs → `QUICK_PRODUCTION_SETUP.md`
- Docker Hub → `GITHUB_ACTIONS_SETUP.md`
