#!/bin/bash

# ===============================================
# CRUSHERMATE DEVELOPMENT STATUS CHECKER
# ===============================================

echo "🔍 Checking CrusherMate Development Environment Status"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check backend status
echo ""
echo "🔧 Backend Status:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend is running on http://localhost:3001"
    response=$(curl -s http://localhost:3001/health)
    echo "   Database: $(echo $response | grep -o '"database":"[^"]*"' | cut -d'"' -f4)"
    echo "   Version: $(echo $response | grep -o '"version":"[^"]*"' | cut -d'"' -f4)"
else
    print_error "Backend is not running"
fi

# Check Metro bundler status
echo ""
echo "📱 Metro Bundler Status:"
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    print_success "Metro bundler is running on http://localhost:8081"
else
    print_error "Metro bundler is not running"
fi

# Check environment files
echo ""
echo "📁 Environment Files:"
if [ -f "backend/.env.testing" ]; then
    print_success "Backend testing environment exists"
else
    print_error "Backend testing environment missing"
fi

if [ -f ".env.testing" ]; then
    print_success "Frontend testing environment exists"
else
    print_error "Frontend testing environment missing"
fi

# Check if testing environment is active
echo ""
echo "⚙️  Active Environment:"
if grep -q "PORT=3001" backend/.env 2>/dev/null; then
    print_success "Testing environment is active"
else
    print_warning "Production environment is active"
fi

# Check database connection
echo ""
echo "📊 Database Status:"
if curl -s http://localhost:3001/health | grep -q "connected"; then
    print_success "Database is connected"
else
    print_error "Database connection failed"
fi

# Show testing credentials
echo ""
echo "👤 Testing Organization:"
echo "   Email: test@crushermate.com"
echo "   Password: Test@123"
echo "   Username: testadmin"

# Show URLs
echo ""
echo "🌐 Development URLs:"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo "   Metro Bundler: http://localhost:8081"
echo "   Android Emulator: http://10.0.2.2:3001/api"
echo "   iOS Simulator: http://localhost:3001/api"

# Check for running processes
echo ""
echo "🔄 Running Processes:"
backend_pid=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$backend_pid" ]; then
    print_success "Backend process running (PID: $backend_pid)"
else
    print_error "No backend process found"
fi

metro_pid=$(lsof -ti:8081 2>/dev/null)
if [ ! -z "$metro_pid" ]; then
    print_success "Metro process running (PID: $metro_pid)"
else
    print_error "No Metro process found"
fi

echo ""
echo "=================================================="
echo "🎯 Ready for Development!"
echo ""
echo "To run the app:"
echo "  iOS:     ./run-app.sh ios"
echo "  Android: ./run-app.sh android"
echo "  Metro:   ./run-app.sh metro"
echo ""
echo "To stop all services:"
echo "  Press Ctrl+C in the terminal running the script"
echo "==================================================" 