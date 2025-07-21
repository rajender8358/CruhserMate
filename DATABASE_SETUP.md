# 🗄️ CrusherMate Database & Environment Setup Guide

## 📋 Prerequisites

### Required Software:
1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
3. **React Native CLI** - `npm install -g @react-native-community/cli`

## 🚀 Quick Start

### 1. Install MongoDB

#### Option A: Local MongoDB Installation
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Windows
# Download installer from https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string

### 2. Start MongoDB (Local Installation)
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
# MongoDB should start automatically after installation
```

### 3. Verify MongoDB Connection
```bash
# Connect to MongoDB shell
mongosh

# You should see something like:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/?directConnection=true
# Using MongoDB: 5.0.x
```

## ⚙️ Environment Configuration

### Backend Environment (.env)

The backend `.env` file is already created with practice values. Update these keys as needed:

```env
# ===============================================
# CRITICAL KEYS TO UPDATE
# ===============================================

# Database - Replace with your MongoDB connection
MONGODB_URI=mongodb://localhost:27017/crushermate
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crushermate

# JWT Secrets - MUST change for production
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars

# CORS - Add your frontend URLs
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://10.0.2.2:3000
```

### Frontend Environment (.env)

The frontend `.env` file contains React Native configurations. Update these for your setup:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api

# For physical device testing, replace localhost with your computer's IP:
# API_BASE_URL=http://192.168.1.100:3000/api

# Android Emulator
ANDROID_API_URL=http://10.0.2.2:3000/api

# iOS Simulator
IOS_API_URL=http://localhost:3000/api
```

## 📊 Database Setup & Seeding

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Seed the Database
```bash
# Run the seeding script
npm run seed

# Expected output:
# ✅ Connected to MongoDB
# 🌱 Seeding data...
# ✅ Default admin user created
# ✅ Material rates initialized
# ✅ Sample truck entries created
# 🎉 Database seeded successfully!
```

### 3. Verify Database Contents
```bash
# Connect to MongoDB shell
mongosh

# Switch to crushermate database
use crushermate

# Check collections
show collections
# Expected: materialrates, truckentries, users

# Check sample data
db.users.find().pretty()
db.materialrates.find().pretty()
db.truckentries.find().pretty()
```

## 🏃‍♂️ Running the Application

### 1. Start Backend Server
```bash
cd backend
npm run dev

# Expected output:
# ✅ MongoDB connected successfully
# 📊 Database: crushermate
# 🚀 Server running on port 3000
# 📱 Environment: development
```

### 2. Start React Native Metro
```bash
# In project root
npm start

# Expected output:
# Welcome to React Native!
# To reload the app, press "r"
# To open developer menu, press "d"
```

### 3. Run on Device/Emulator
```bash
# Android
npm run android

# iOS
npm run ios
```

## 🔧 Database Collections Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
  role: "user" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

### TruckEntries Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to Users
  truckNumber: "KA01AB1234",
  entryType: "Sales" | "Raw Stone",
  materialType: "M-Sand" | "P-Sand" | "Blue Metal" | null,
  units: 10.5,
  ratePerUnit: 22000,
  totalAmount: 231000, // Auto-calculated
  entryDate: Date,
  entryTime: "14:30",
  createdAt: Date,
  updatedAt: Date
}
```

### MaterialRates Collection
```javascript
{
  _id: ObjectId,
  materialType: "M-Sand" | "P-Sand" | "Blue Metal",
  currentRate: 22000,
  previousRate: 21000,
  effectiveDate: Date,
  notes: "Market rate update",
  updatedBy: ObjectId, // Reference to Users
  createdAt: Date
}
```

## 🔍 API Testing

### Test Backend APIs with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get app config (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/config/app
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. MongoDB Connection Failed
```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

#### 2. Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 PID
```

#### 3. React Native Metro Issues
```bash
# Reset Metro cache
npm start -- --reset-cache

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Environment Variables Not Loading
```bash
# Restart Metro bundler after .env changes
npm start -- --reset-cache

# For React Native, environment variables need app restart
```

## 🔐 Security Notes

### For Production:
1. **Change all default secrets** in `.env` files
2. **Use MongoDB Atlas** or secure MongoDB setup
3. **Enable authentication** on MongoDB
4. **Use HTTPS** for all communications
5. **Set strong JWT secrets** (32+ characters)
6. **Restrict CORS origins** to your domain only

### Default Credentials (Development Only):
- **Admin User**: admin@crushermate.com / admin123
- **Test User**: user@crushermate.com / user123

## 📱 Device-Specific Configuration

### Android Emulator:
- API Base URL: `http://10.0.2.2:3000/api`
- No additional configuration needed

### iOS Simulator:
- API Base URL: `http://localhost:3000/api`
- No additional configuration needed

### Physical Device:
1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```
2. Update `.env` file:
   ```env
   API_BASE_URL=http://YOUR_COMPUTER_IP:3000/api
   ```
3. Ensure firewall allows connections on port 3000

## ✅ Verification Checklist

- [ ] MongoDB installed and running
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Database seeded successfully
- [ ] Backend server starts without errors
- [ ] React Native Metro starts successfully
- [ ] App builds and runs on emulator/device
- [ ] API calls work (check console logs)
- [ ] Environment variables loaded correctly

## 🆘 Need Help?

If you encounter issues:
1. Check the console logs for error messages
2. Verify MongoDB is running and accessible
3. Ensure all environment variables are set correctly
4. Check network connectivity between frontend and backend
5. Try clearing caches and reinstalling dependencies

**Happy Coding! 🚀** 