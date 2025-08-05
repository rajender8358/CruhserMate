#!/bin/bash

# ===============================================
# CRUSHERMATE QUICK START SCRIPT
# ===============================================
# Quick setup for development with testing organization

set -e

echo "🚀 Quick Start - CrusherMate Development Environment"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Function to kill process on port
kill_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port $port is in use. Killing existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Setup testing environment
setup_testing() {
    print_status "Setting up testing environment..."
    
    # Create testing backend config
    cat > backend/.env.testing << EOF
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

    # Create testing frontend config
    cat > .env.testing << EOF
API_BASE_URL=http://localhost:3001/api
ANDROID_API_URL=http://10.0.2.2:3001/api
IOS_API_URL=http://localhost:3001/api
AUTH_TOKEN_KEY=crushermate_testing_auth_token
REFRESH_TOKEN_KEY=crushermate_testing_refresh_token
USER_DATA_KEY=crushermate_testing_user_data
STORAGE_PREFIX=crushermate_testing_
EOF

    print_success "Testing environment configured"
}

# Start backend
start_backend() {
    print_status "Starting backend server..."
    
    kill_port 3001
    
    # Use testing environment
    cp backend/.env.testing backend/.env
    
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend
    print_status "Waiting for backend to start..."
    for i in {1..20}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Backend running on http://localhost:3001"
            break
        fi
        sleep 1
    done
}

# Start frontend
start_frontend() {
    print_status "Starting frontend..."
    
    kill_port 8081
    
    # Use testing environment
    cp .env.testing .env
    
    npm start &
    FRONTEND_PID=$!
    
    # Wait for Metro
    print_status "Waiting for Metro bundler..."
    for i in {1..20}; do
        if curl -s http://localhost:8081 > /dev/null 2>&1; then
            print_success "Metro running on http://localhost:8081"
            break
        fi
        sleep 1
    done
}

# Show information
show_info() {
    echo ""
    echo "==============================================="
    echo "🚀 CRUSHERMATE DEVELOPMENT READY"
    echo "==============================================="
    echo ""
    echo "📱 Frontend: http://localhost:8081"
    echo "🔧 Backend: http://localhost:3001"
    echo ""
    echo "👤 Test Login:"
    echo "   Email: test@crushermate.com"
    echo "   Password: Test@123"
    echo ""
    echo "📊 Database: CrusherMate_Testing"
    echo ""
    echo "🛑 Press Ctrl+C to stop"
    echo "==============================================="
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Stopping services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    kill_port 3001
    kill_port 8081
    
    print_success "Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Setting up CrusherMate development environment..."
    
    setup_testing
    start_backend
    start_frontend
    show_info
    
    print_status "Development environment ready! Press Ctrl+C to stop."
    wait
}

main "$@" 