#!/bin/bash

# ===============================================
# CRUSHERMATE APP RUNNER
# ===============================================
# Run the React Native app on different platforms

set -e

echo "🚀 CrusherMate App Runner"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend if not running
start_backend_if_needed() {
    if ! check_backend; then
        print_warning "Backend not running. Starting backend..."
        
        # Setup testing environment
        if [ ! -f "backend/.env.testing" ]; then
            print_status "Creating testing environment..."
            cat > backend/.env.testing << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://rajenderreddygarlapalli:MacBook%408358%249154@crushermate.utrbdfv.mongodb.net/CrusherMate?retryWrites=true&w=majority
JWT_SECRET=crushermate_app_super_secret_jwt_key_2024_min_32_chars
JWT_REFRESH_SECRET=crushermate_refresh_token_secret_practice_app_2024_min_32
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8081,http://10.0.2.2:3001
SEED_DATABASE=true
AUTO_SEED_ON_START=true
ADMIN_EMAIL=test@crushermate.com
ADMIN_PASSWORD=Test@123
ADMIN_USERNAME=testadmin
EOF
        fi
        
        # Use testing environment
        cp backend/.env.testing backend/.env
        
        # Start backend
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        # Wait for backend
        print_status "Waiting for backend to start..."
        for i in {1..30}; do
            if check_backend; then
                print_success "Backend running on http://localhost:3001"
                break
            fi
            sleep 1
        done
    else
        print_success "Backend is already running"
    fi
}

# Function to setup frontend environment
setup_frontend() {
    print_status "Setting up frontend environment..."
    
    # Create testing frontend config if not exists
    if [ ! -f ".env.testing" ]; then
        cat > .env.testing << EOF
API_BASE_URL=http://localhost:3001/api
ANDROID_API_URL=http://10.0.2.2:3001/api
IOS_API_URL=http://localhost:3001/api
AUTH_TOKEN_KEY=crushermate_auth_token
REFRESH_TOKEN_KEY=crushermate_refresh_token
USER_DATA_KEY=crushermate_user_data
STORAGE_PREFIX=crushermate_
EOF
    fi
    
    # Use testing environment
    cp .env.testing .env
    
    print_success "Frontend environment configured"
}

# Function to run on iOS
run_ios() {
    print_status "Running on iOS..."
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode is not installed. Please install Xcode first."
        exit 1
    fi
    
    # Check if iOS Simulator is available
    if ! xcrun simctl list devices | grep -q "iPhone"; then
        print_error "No iOS Simulator found. Please install iOS Simulator."
        exit 1
    fi
    
    setup_frontend
    start_backend_if_needed
    
    print_status "Starting iOS Simulator..."
    npx react-native run-ios
}

# Function to run on Android
run_android() {
    print_status "Running on Android..."
    
    # Check if Android SDK is available
    if [ -z "$ANDROID_HOME" ]; then
        print_warning "ANDROID_HOME not set. Trying to find Android SDK..."
        export ANDROID_HOME=$HOME/Library/Android/sdk
    fi
    
    if [ ! -d "$ANDROID_HOME" ]; then
        print_error "Android SDK not found. Please install Android Studio and SDK."
        exit 1
    fi
    
    # Check if Android emulator is running
    if ! adb devices | grep -q "emulator"; then
        print_warning "No Android emulator running. Starting emulator..."
        # Try to start an emulator
        $ANDROID_HOME/emulator/emulator -list-avds | head -1 | xargs -I {} $ANDROID_HOME/emulator/emulator -avd {} &
        sleep 10
    fi
    
    setup_frontend
    start_backend_if_needed
    
    print_status "Starting Android app..."
    npx react-native run-android
}

# Function to run Metro bundler only
run_metro() {
    print_status "Starting Metro bundler only..."
    
    setup_frontend
    start_backend_if_needed
    
    print_status "Starting Metro bundler..."
    npm start
}

# Function to show help
show_help() {
    echo ""
    echo "==============================================="
    echo "🚀 CRUSHERMATE APP RUNNER"
    echo "==============================================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  ios       Run on iOS Simulator"
    echo "  android   Run on Android Emulator"
    echo "  metro     Start Metro bundler only"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 ios"
    echo "  $0 android"
    echo "  $0 metro"
    echo ""
    echo "Test Login Credentials:"
    echo "  Email: test@crushermate.com"
    echo "  Password: Test@123"
    echo ""
    echo "==============================================="
    echo ""
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    print_success "Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    case "${1:-help}" in
        "ios")
            run_ios
            ;;
        "android")
            run_android
            ;;
        "metro")
            run_metro
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

main "$@" 