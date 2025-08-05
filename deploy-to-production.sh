#!/bin/bash

echo "🚀 Starting CrusherMate Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the CrusherMate root directory"
    exit 1
fi

print_status "📋 Deployment Checklist:"
echo "1. ✅ Frontend API configured for production"
echo "2. ✅ Backend API cleaned of console.log statements"
echo "3. ✅ Vercel configuration ready"
echo "4. 🔄 Deploying backend to Vercel..."
echo "5. 🔄 Building and deploying frontend..."

# Deploy Backend to Vercel
print_status "Deploying backend to Vercel..."

cd backend

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
print_status "Running Vercel deployment..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    print_success "Backend deployed successfully to Vercel!"
else
    print_error "Backend deployment failed!"
    exit 1
fi

cd ..

# Build and deploy frontend
print_status "Building React Native app for production..."

# Clean previous builds
rm -rf android/app/build
rm -rf android/build

# Build Android APK
print_status "Building Android APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    print_success "Android APK built successfully!"
    print_status "APK location: android/app/build/outputs/apk/release/app-release.apk"
else
    print_error "Android build failed!"
    exit 1
fi

cd ..

print_status "🎉 Deployment Summary:"
echo "✅ Backend: Deployed to Vercel"
echo "✅ Frontend: Built for production"
echo "📱 Android APK: Ready for distribution"
echo ""
print_success "Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the production backend API"
echo "2. Install the APK on devices"
echo "3. Monitor the application in production"
echo ""
echo "🔗 Backend URL: https://crushermate-backend.vercel.app"
echo "📱 APK Location: android/app/build/outputs/apk/release/app-release.apk" 