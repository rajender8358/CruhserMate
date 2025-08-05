# CrusherMate Development Environment Setup

This guide will help you set up a complete development environment for CrusherMate with a testing organization to avoid affecting production data.

## 🚀 Quick Start

### Option 1: Quick Setup (Recommended)
```bash
./quick-start.sh
```

### Option 2: Full Setup with Dependencies
```bash
./start-dev-environment.sh
```

### Option 3: Run App on Specific Platform
```bash
# Run on iOS Simulator
./run-app.sh ios

# Run on Android Emulator
./run-app.sh android

# Start Metro bundler only
./run-app.sh metro
```

## 📋 Prerequisites

Before running the development environment, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **React Native CLI**
4. **Xcode** (for iOS development)
5. **Android Studio** (for Android development)

### Install React Native CLI
```bash
npm install -g @react-native-community/cli
```

## 🔧 What the Scripts Do

### Testing Environment Setup
- Creates a separate testing database (`CrusherMate_Testing`)
- Sets up testing organization with admin credentials
- Configures separate JWT secrets for testing
- Uses different ports (3001 for backend, 8081 for Metro)

### Backend Configuration
- Runs on port 3001 (separate from production)
- Uses testing database
- Auto-seeds testing organization
- Includes test admin user

### Frontend Configuration
- Connects to testing backend
- Uses separate storage keys
- Configured for both iOS and Android

## 👤 Testing Organization Credentials

```
Email: test@crushermate.com
Password: Test@123
Username: testadmin
```

## 🌐 Development URLs

- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Metro Bundler**: http://localhost:8081
- **Android Emulator**: http://10.0.2.2:3001/api
- **iOS Simulator**: http://localhost:3001/api

## 📱 Running the App

### iOS Development
```bash
# Start backend and run on iOS
./run-app.sh ios
```

### Android Development
```bash
# Start backend and run on Android
./run-app.sh android
```

### Metro Only (for debugging)
```bash
# Start Metro bundler only
./run-app.sh metro
```

## 🛠️ Manual Setup (if scripts don't work)

### 1. Setup Backend
```bash
cd backend

# Create testing environment
cp .env .env.backup
cat > .env << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://rajenderreddygarlapalli:MacBook%408358%249154@crushermate.utrbdfv.mongodb.net/CrusherMate_Testing?retryWrites=true&w=majority
JWT_SECRET=crushermate_testing_app_super_secret_jwt_key_2024_min_32_chars
JWT_REFRESH_SECRET=crushermate_testing_refresh_token_secret_practice_app_2024_min_32
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8081,http://10.0.2.2:3001
SEED_DATABASE=true
AUTO_SEED_ON_START=true
ADMIN_EMAIL=test@crushermate.com
ADMIN_PASSWORD=Test@123
ADMIN_USERNAME=testadmin
EOF

# Install dependencies
npm install

# Start backend
npm run dev
```

### 2. Setup Frontend
```bash
# Create testing environment
cp .env .env.backup
cat > .env << EOF
API_BASE_URL=http://localhost:3001/api
ANDROID_API_URL=http://10.0.2.2:3001/api
IOS_API_URL=http://localhost:3001/api
AUTH_TOKEN_KEY=crushermate_testing_auth_token
REFRESH_TOKEN_KEY=crushermate_testing_refresh_token
USER_DATA_KEY=crushermate_testing_user_data
STORAGE_PREFIX=crushermate_testing_
EOF

# Install dependencies
npm install

# Start Metro bundler
npm start
```

### 3. Run on Platform
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 🔍 Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:8081 | xargs kill -9
```

### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

### iOS Build Issues
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Database Connection Issues
Check if the MongoDB connection string is correct in the `.env` file.

## 🧹 Cleanup

To stop all services and restore original configuration:
```bash
# Press Ctrl+C in the terminal running the script
# Or manually kill processes:
pkill -f "node.*server.js"
pkill -f "react-native.*start"
```

## 📊 Database Information

- **Testing Database**: `CrusherMate_Testing`
- **Production Database**: `CrusherMate`
- **Separate Collections**: All data is isolated between testing and production

## 🔐 Security Notes

- Testing environment uses separate JWT secrets
- Testing organization is isolated from production
- All testing data is in a separate database
- Original `.env` files are backed up before modification

## 📞 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Try the manual setup steps
4. Check if ports are available
5. Ensure MongoDB connection is working

## 🎯 Next Steps

After successful setup:

1. Login with test credentials
2. Explore the testing organization
3. Test all features without affecting production data
4. Develop new features in the isolated environment
5. Use the testing organization for all development work 