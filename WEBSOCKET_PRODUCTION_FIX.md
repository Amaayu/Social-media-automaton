# WebSocket Production Fix Guide

## Problem Fixed ✅

The frontend was hardcoded to connect to `http://localhost:3000` for WebSocket connections, causing connection failures in production.

## What Was Changed

### 1. Socket Service (`client/src/services/socket.service.js`)

Updated to auto-detect the correct server URL:

```javascript
// Auto-detection logic:
// 1. Use VITE_API_URL if set
// 2. In production, use window.location.origin (same domain)
// 3. In development, use http://localhost:3000
```

### 2. DualPublisher Component (`client/src/components/DualPublisher.jsx`)

Updated Socket.IO initialization with the same auto-detection logic.

### 3. Environment Files Created

- `client/.env.example` - Template for environment variables
- `client/.env.development` - Development configuration
- `client/.env.production` - Production configuration

### 4. Vite Config Updated (`client/vite.config.js`)

Added WebSocket proxy support for development.

---

## How It Works

### Development (localhost)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- WebSocket connects to: `http://localhost:3000`

### Production (same domain)
- Frontend: `https://yourdomain.com`
- Backend: `https://yourdomain.com`
- WebSocket connects to: `https://yourdomain.com` (auto-detected)

### Production (different domains)
- Frontend: `https://yourdomain.com`
- Backend: `https://api.yourdomain.com`
- Set `VITE_API_URL=https://api.yourdomain.com` in environment

---

## Deployment Instructions

### Option 1: Frontend and Backend on Same Domain (Recommended)

This is the setup when using Docker or serving both from the same server.

**No configuration needed!** The app will auto-detect and use `window.location.origin`.

**Example:**
- Your app is at: `https://myapp.com`
- WebSocket will connect to: `https://myapp.com`

### Option 2: Frontend and Backend on Different Domains

If your backend is on a different domain:

**Step 1:** Set environment variable before building:

```bash
cd client
echo "VITE_API_URL=https://api.yourdomain.com" > .env.production
npm run build
```

**Step 2:** Deploy the built files from `client/dist/`

---

## Platform-Specific Instructions

### Railway.app

**Scenario A: Single Service (Frontend + Backend together)**
```bash
# No configuration needed!
# Railway URL: https://your-app.up.railway.app
# WebSocket auto-connects to: https://your-app.up.railway.app
```

**Scenario B: Separate Services**
```bash
# In Railway dashboard, add environment variable:
# VITE_API_URL=https://your-backend.up.railway.app
```

### Render.com

**Scenario A: Single Web Service**
```bash
# No configuration needed!
# Render URL: https://your-app.onrender.com
# WebSocket auto-connects to: https://your-app.onrender.com
```

**Scenario B: Separate Services**
```bash
# In Render dashboard, add environment variable:
# VITE_API_URL=https://your-backend.onrender.com
```

### Docker Deployment

**Using docker-compose.yml (current setup):**

The Dockerfile already builds the frontend and serves it with the backend, so no configuration is needed!

```bash
# Just run:
docker compose up -d

# WebSocket will auto-connect to the same domain
```

**If you need a custom backend URL:**

Update `docker-compose.yml` to add build args:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=https://api.yourdomain.com
```

Then update `Dockerfile` to use the build arg:

```dockerfile
# In the frontend-builder stage, before npm run build:
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
```

### VPS with Nginx

If using nginx as reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Frontend (static files)
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**No VITE_API_URL needed** - WebSocket will auto-connect to `https://yourdomain.com`

---

## Testing the Fix

### 1. Check Browser Console

After deploying, open your production site and check the browser console:

```
[SocketService] Connecting to: https://your-production-domain.com
[SocketService] ✅ Connected to server, socket ID: abc123
```

### 2. Test WebSocket Connection

```javascript
// In browser console:
console.log('Socket URL:', window.location.origin);
```

Should show your production domain, not localhost.

### 3. Test AI Post Generation

1. Go to AI Post Generator page
2. Start generating a post
3. You should see real-time progress updates
4. No WebSocket errors in console

---

## Troubleshooting

### Issue: Still seeing "localhost:3000" in console

**Solution:** Rebuild the frontend:
```bash
cd client
npm run build
```

Then redeploy.

### Issue: WebSocket connects but immediately disconnects

**Possible causes:**
1. CORS not configured on backend
2. Backend not running
3. Firewall blocking WebSocket connections

**Solution:** Check backend logs and ensure CORS allows your frontend domain.

### Issue: "Mixed content" error (HTTP/HTTPS)

**Solution:** Ensure both frontend and backend use HTTPS in production.

### Issue: WebSocket works in development but not production

**Solution:** 
1. Check that backend is accessible at the production URL
2. Verify WebSocket endpoint: `https://your-domain.com/socket.io/`
3. Check nginx/proxy configuration for WebSocket support

---

## Environment Variable Reference

### Client Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | No | Backend URL (auto-detected if empty) | `https://api.yourdomain.com` |

### When to Set VITE_API_URL

**Set it when:**
- ✅ Backend is on a different domain than frontend
- ✅ Using a custom API subdomain
- ✅ Testing against a specific backend

**Don't set it when:**
- ❌ Frontend and backend are on the same domain
- ❌ Using Docker with the default setup
- ❌ Backend is served from the same server

---

## Rebuild and Redeploy

After making changes:

```bash
# 1. Rebuild frontend
cd client
npm run build

# 2. If using Docker, rebuild image
cd ..
docker compose build --no-cache

# 3. Restart
docker compose up -d

# 4. Check logs
docker compose logs -f
```

---

## Summary

✅ **Fixed:** WebSocket auto-detects production URL
✅ **Created:** Environment configuration files
✅ **Updated:** Socket service and DualPublisher component
✅ **Added:** Vite proxy for WebSocket in development

**Result:** WebSocket connections now work in both development and production without manual configuration!
