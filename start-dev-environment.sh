#!/bin/bash

# ===============================================
# CRUSHERMATE DEVELOPMENT ENVIRONMENT SETUP
# ===============================================
# This script sets up a complete development environment
# with backend, frontend, and testing organization

set -e  # Exit on any error

echo "🚀 Starting CrusherMate Development Environment..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        print_warning "Port $port is in use. Killing existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Create testing environment configuration
setup_testing_env() {
    print_status "Setting up testing environment configuration..."
    
    # Create testing backend .env
    cat > backend/.env.testing << EOF
# ===============================================
# CRUSHERMATE TESTING ENVIRONMENT CONFIGURATION
# ===============================================

# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database Configuration - Using testing database
MONGODB_URI=mongodb+srv://rajenderreddygarlapalli:MacBook%408358%249154@crushermate.utrbdfv.mongodb.net/CrusherMate_Testing?retryWrites=true&w=majority

# Database Settings
DB_NAME=crushermate_testing
DB_CONNECT_TIMEOUT=30000
DB_SOCKET_TIMEOUT=45000

# JWT Authentication
JWT_SECRET=crushermate_testing_app_super_secret_jwt_key_2024_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=crushermate_testing_refresh_token_secret_practice_app_2024_min_32
JWT_REFRESH_EXPIRE=30d

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8081,http://10.0.2.2:3001
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Business Configuration
DEFAULT_CURRENCY=INR
DEFAULT_LOCALE=en-IN
TIMEZONE=Asia/Kolkata

# Material Rate Defaults
DEFAULT_M_SAND_RATE=22000
DEFAULT_P_SAND_RATE=20000
DEFAULT_BLUE_METAL_RATE=24000

# Development Settings
DEBUG=crushermate:*
SEED_DATABASE=true
AUTO_SEED_ON_START=true

# Testing Organization Settings
ADMIN_EMAIL=test@crushermate.com
ADMIN_PASSWORD=Test@123
ADMIN_USERNAME=testadmin
ORGANIZATION_NAME=CrusherMate Testing Organization
EOF

    # Create testing frontend .env
    cat > .env.testing << EOF
# ===============================================
# CRUSHERMATE FRONTEND TESTING ENVIRONMENT
# ===============================================

# API Configuration
API_BASE_URL=http://localhost:3001/api
API_TIMEOUT=30000

# Development Settings
NODE_ENV=development
REACT_NATIVE_PACKAGER_HOSTNAME=localhost

# Metro Configuration
METRO_HOST=localhost
METRO_PORT=8081

# Android Configuration
ANDROID_API_URL=http://10.0.2.2:3001/api
ANDROID_LOCALHOST=10.0.2.2

# iOS Configuration
IOS_API_URL=http://localhost:3001/api
IOS_LOCALHOST=localhost

# App Configuration
APP_NAME=CrusherMate Testing
APP_VERSION=1.0.0
APP_BUILD_NUMBER=1

# Authentication
AUTH_TOKEN_KEY=crushermate_testing_auth_token
REFRESH_TOKEN_KEY=crushermate_testing_refresh_token
USER_DATA_KEY=crushermate_testing_user_data

# Storage Keys
STORAGE_PREFIX=crushermate_testing_
CACHE_EXPIRY=86400000

# API Endpoints
LOGIN_ENDPOINT=/auth/login
REGISTER_ENDPOINT=/auth/register
CONFIG_ENDPOINT=/config/app
RATES_ENDPOINT=/config/rates
CALCULATE_ENDPOINT=/config/calculate
VALIDATE_ENDPOINT=/config/validate
TRUCK_ENTRIES_ENDPOINT=/truck-entries

# Features Flags
ENABLE_OFFLINE_MODE=true
ENABLE_BIOMETRIC_LOGIN=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=false

# UI Configuration
DEFAULT_CURRENCY=INR
DEFAULT_LOCALE=en-IN
DATE_FORMAT=DD/MM/YYYY
TIME_FORMAT=HH:mm

# Debug Settings
DEBUG_API_CALLS=true
ENABLE_FLIPPER=true
LOG_LEVEL=debug

# Performance Settings
REQUEST_TIMEOUT=10000
RETRY_ATTEMPTS=3
CACHE_SIZE_LIMIT=50

# Security Settings
ENABLE_SSL_PINNING=false
CERTIFICATE_TRANSPARENCY=false
EOF

    print_success "Testing environment configuration created"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Dependencies installed successfully"
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server..."
    
    # Kill any existing process on port 3001
    kill_port 3001
    
    # Copy testing environment
    cp backend/.env.testing backend/.env
    
    # Start backend server
    cd backend
    print_status "Backend server starting on port 3001..."
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Backend server is running on http://localhost:3001"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend server failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
    done
}

# Function to create testing organization
create_testing_organization() {
    print_status "Creating testing organization..."
    
    # Wait a bit for the server to fully initialize
    sleep 5
    
    # Create testing organization using the seed script
    cd backend
    node -e "
    require('dotenv').config();
    const { seedDatabase } = require('./src/utils/seedData');
    
    seedDatabase()
        .then(() => {
            console.log('✅ Testing organization created successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error creating testing organization:', error);
            process.exit(1);
        });
    "
    cd ..
    
    print_success "Testing organization created successfully"
    print_status "Test Admin Credentials:"
    print_status "  Email: test@crushermate.com"
    print_status "  Password: Test@123"
    print_status "  Username: testadmin"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend..."
    
    # Kill any existing process on port 8081
    kill_port 8081
    
    # Copy testing environment
    cp .env.testing .env
    
    # Start React Native Metro bundler
    print_status "Starting React Native Metro bundler..."
    npm start &
    FRONTEND_PID=$!
    
    # Wait for Metro to start
    print_status "Waiting for Metro bundler to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8081 > /dev/null 2>&1; then
            print_success "Metro bundler is running on http://localhost:8081"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Metro bundler failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
    done
}

# Function to show development URLs
show_urls() {
    echo ""
    echo "==============================================="
    echo "🚀 CRUSHERMATE DEVELOPMENT ENVIRONMENT"
    echo "==============================================="
    echo ""
    echo "📱 Frontend (React Native):"
    echo "   Metro Bundler: http://localhost:8081"
    echo "   Android Emulator: http://10.0.2.2:3001/api"
    echo "   iOS Simulator: http://localhost:3001/api"
    echo ""
    echo "🔧 Backend API:"
    echo "   Health Check: http://localhost:3001/health"
    echo "   API Base: http://localhost:3001/api"
    echo ""
    echo "👤 Testing Organization:"
    echo "   Email: test@crushermate.com"
    echo "   Password: Test@123"
    echo "   Username: testadmin"
    echo ""
    echo "📊 Database: CrusherMate_Testing (separate from production)"
    echo ""
    echo "🛑 To stop all services, press Ctrl+C"
    echo "==============================================="
    echo ""
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down development environment..."
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill processes on ports
    kill_port 3001
    kill_port 8081
    
    # Restore original .env files
    if [ -f "backend/.env.backup" ]; then
        cp backend/.env.backup backend/.env
    fi
    
    if [ -f ".env.backup" ]; then
        cp .env.backup .env
    fi
    
    print_success "Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Setting up CrusherMate development environment..."
    
    # Backup original .env files
    if [ -f "backend/.env" ]; then
        cp backend/.env backend/.env.backup
    fi
    
    if [ -f ".env" ]; then
        cp .env .env.backup
    fi
    
    # Setup testing environment
    setup_testing_env
    
    # Install dependencies
    install_dependencies
    
    # Start backend
    start_backend
    
    # Create testing organization
    create_testing_organization
    
    # Start frontend
    start_frontend
    
    # Show URLs and information
    show_urls
    
    # Keep script running
    print_status "Development environment is ready! Press Ctrl+C to stop."
    wait
}

# Run main function
main "$@" 