# 🚀 CrusherMate Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Frontend Configuration
- [x] API service configured to use production URL
- [x] All console.log statements removed
- [x] Production build ready

### ✅ Backend Configuration
- [x] Vercel configuration ready (`vercel.json`)
- [x] API entry point configured (`api/index.js`)
- [x] All console.log statements removed
- [x] CORS configured for production

## 🔧 Backend Deployment to Vercel

### 1. Environment Variables Setup

Create these environment variables in your Vercel dashboard:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://rajenderreddygarlapalli:MacBook%408358%249154@crushermate.utrbdfv.mongodb.net/CrusherMate?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-production-crushermate-2024
JWT_EXPIRES_IN=7d

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=true

# Admin User Configuration
ADMIN_EMAIL=raj_owner@crushermate.com
ADMIN_PASSWORD=Test@123
ADMIN_USERNAME=raj_owner
ADMIN_ROLE=owner

# Test User Configuration
TEST_EMAIL=raj_user@crushermate.com
TEST_PASSWORD=test123
TEST_USERNAME=raj_user
TEST_ROLE=user

# Organization Configuration
DEFAULT_ORGANIZATION_NAME=CrusherMate Production
DEFAULT_ORGANIZATION_DESCRIPTION=Production organization for CrusherMate

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Logging Configuration
LOG_LEVEL=error
NODE_ENV=production
```

### 2. Deploy Backend to Vercel

```bash
# Navigate to backend directory
cd backend

# Install Vercel CLI if not installed
npm install -g vercel

# Deploy to Vercel
vercel --prod --yes
```

### 3. Verify Backend Deployment

Test the deployed backend:
```bash
# Health check
curl https://crushermate-backend.vercel.app/health

# API health check
curl https://crushermate-backend.vercel.app/api/health
```

## 📱 Frontend Production Build

### 1. Build Android APK

```bash
# Clean previous builds
rm -rf android/app/build
rm -rf android/build

# Build release APK
cd android
./gradlew assembleRelease
cd ..
```

### 2. APK Location
The production APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔗 Production URLs

### Backend API
- **Health Check**: https://crushermate-backend.vercel.app/health
- **API Base**: https://crushermate-backend.vercel.app/api
- **Database Health**: https://crushermate-backend.vercel.app/api/health/db

### Frontend
- **APK File**: `android/app/build/outputs/apk/release/app-release.apk`

## 🧪 Testing Production Deployment

### 1. Test Backend API
```bash
# Test health endpoint
curl https://crushermate-backend.vercel.app/health

# Test API health
curl https://crushermate-backend.vercel.app/api/health

# Test database connectivity
curl https://crushermate-backend.vercel.app/api/health/db
```

### 2. Test Frontend App
1. Install the APK on a test device
2. Test login with production credentials:
   - **Owner**: raj_owner@crushermate.com / Test@123
   - **User**: raj_user@crushermate.com / test123
3. Test all major features:
   - Truck entry creation
   - Material rate management
   - Dashboard functionality
   - Report generation
   - OCR functionality

## 📊 Monitoring Production

### 1. Vercel Dashboard
- Monitor backend performance
- Check error logs
- View deployment status

### 2. MongoDB Atlas
- Monitor database performance
- Check connection status
- Review data usage

### 3. Application Monitoring
- Test API endpoints regularly
- Monitor app crashes
- Check user feedback

## 🚨 Troubleshooting

### Backend Issues
1. **Database Connection**: Check MongoDB Atlas connection
2. **Environment Variables**: Verify all variables are set in Vercel
3. **CORS Issues**: Check ALLOWED_ORIGINS configuration
4. **Rate Limiting**: Monitor rate limit settings

### Frontend Issues
1. **API Connection**: Verify production URL in apiService.js
2. **Build Errors**: Check Android build configuration
3. **App Crashes**: Test on multiple devices

## 📞 Support

For production issues:
1. Check Vercel deployment logs
2. Monitor MongoDB Atlas dashboard
3. Test API endpoints manually
4. Review application error logs

---

**🎉 Production Deployment Complete!**

Your CrusherMate application is now running in production with:
- ✅ Backend API deployed on Vercel
- ✅ Frontend APK built for distribution
- ✅ Database connected and configured
- ✅ All security measures in place 