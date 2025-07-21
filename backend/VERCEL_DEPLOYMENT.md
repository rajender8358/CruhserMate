# 🚀 Vercel Deployment Guide

## 📋 **Deploy to Vercel (Free Cloud Service)**

### **Step 1: Login to Vercel**
```bash
vercel login
```

### **Step 2: Deploy**
```bash
vercel --prod
```

### **Step 3: Set Environment Variables**

When prompted, set these environment variables:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://rajenderreddygarlapalli:MacBook%408358%249154@crushermate.utrbdfv.mongodb.net/CrusherMate?retryWrites=true&w=majority
JWT_SECRET=crushermate_practice_app_super_secret_jwt_key_2024_min_32_chars
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=true
```

### **Step 4: Get Deployment URL**

Vercel will give you a URL like:
`https://crushermate-backend.vercel.app`

### **Step 5: Update APK**

Update `src/services/apiService.js`:
```javascript
// For production, use Vercel URL
API_BASE_URL = 'https://crushermate-backend.vercel.app/api';
```

### **Step 6: Build New APK**
```bash
cd android && ./gradlew assembleRelease
```

## ✅ **Vercel Benefits:**

- ✅ **100% Free** for personal projects
- ✅ **Global CDN** - Fast worldwide access
- ✅ **Auto-deploy** from Git
- ✅ **SSL certificate** included
- ✅ **Custom domains** supported
- ✅ **Serverless functions** - Auto-scaling

## 🔄 **Deployment Commands:**

```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Get deployment URL
vercel domains
```

## 📱 **APK Testing After Deployment:**

- ✅ **Works from anywhere** in the world
- ✅ **No network restrictions**
- ✅ **24/7 uptime**
- ✅ **Multiple testers** can use simultaneously

## 🎯 **Next Steps:**

1. **Run:** `vercel login`
2. **Run:** `vercel --prod`
3. **Set environment variables** when prompted
4. **Copy the deployment URL**
5. **Update APK** with the URL
6. **Build new APK**
7. **Share APK** with testers

## 🚀 **Ready to Deploy?**

Just run: `vercel --prod` 