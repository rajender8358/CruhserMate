# 🚀 CrusherMate Backend Deployment Guide

## ✅ **Vercel & Ruby Removed Successfully!**

Your project is now clean and ready for deployment on any Node.js hosting platform.

## 📦 **Available Build Commands**

```bash
# In backend directory
npm run build    # Build the application
npm start        # Start production server
npm run dev      # Start development server with nodemon
npm test         # Run tests
npm run clean    # Clean and reinstall dependencies
```

## 🌐 **Deployment Options**

### **Option 1: Railway (Recommended)**
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `rajender8358/CruhserMate`
5. Set root directory: `backend`
6. Add environment variables (see below)

### **Option 2: Render**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Set root directory: `backend`
6. Build command: `npm run build`
7. Start command: `npm start`

### **Option 3: Heroku**
1. Install Heroku CLI
2. `heroku create crushermate-backend`
3. `heroku config:set MONGODB_URI=your_mongodb_uri`
4. `git push heroku main`

## 🔧 **Environment Variables**

Add these to your deployment platform:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://rajenderreddygarlapalli:MacBook%408358%249154@crushermate.utrbdfv.mongodb.net/CrusherMate?retryWrites=true&w=majority
JWT_SECRET=crushermate_practice_app_super_secret_jwt_key_2024_min_32_chars
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=true
```

## 📱 **After Deployment**

1. **Get your deployment URL** (e.g., `https://crushermate-backend.railway.app`)
2. **Update frontend API URL** in `src/services/apiService.js`
3. **Build new APK** with updated API URL
4. **Test with external users**

## 🧪 **Test Your Deployment**

```bash
# Test health endpoint
curl https://your-deployment-url.railway.app/health

# Should return:
{
  "success": true,
  "message": "CrusherMate API Server is running!",
  "timestamp": "2025-07-21T16:28:18.924Z",
  "version": "1.0.0"
}
```

## 🔄 **Local Development**

```bash
cd backend
npm install
npm run dev
```

## 📊 **Server Management (Local)**

```bash
# Start with PM2 (production-like)
./start-server.sh

# Monitor server
./monitor-server.sh

# Check status
pm2 status
```

## ✅ **What's Working Now**

- ✅ **Clean Node.js backend** (no Vercel/Ruby dependencies)
- ✅ **Proper build process** (`npm run build`)
- ✅ **Production-ready server** (`npm start`)
- ✅ **Development server** (`npm run dev`)
- ✅ **PM2 management** for local production-like testing
- ✅ **All APIs functional** and tested

## 🎯 **Next Steps**

1. **Choose a deployment platform** (Railway recommended)
2. **Deploy your backend**
3. **Update frontend API URL**
4. **Build new APK**
5. **Test with external users**

Your backend is now clean, simple, and ready for deployment! 🚀 