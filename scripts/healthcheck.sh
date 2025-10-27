#!/bin/bash
# Oruba Contacts - Health Check Script
# Bu script tüm servislerin sağlıklı çalıştığını kontrol eder

set -e

echo "=================================="
echo "Oruba Contacts Health Check"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local name=$3

    echo -n "Checking $name... "

    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Check Docker is running
echo -n "Checking Docker... "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if containers are running
echo ""
echo "Container Status:"
docker-compose ps

echo ""
echo "Service Health Checks:"

# Check Database
echo -n "Checking Database... "
if docker exec orubacontacts-db pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check Backend
check_service "backend" "http://localhost:3000/health" "Backend API"

# Check Frontend
check_service "frontend" "http://localhost:8080/health" "Frontend"

echo ""
echo "=================================="

# Summary
BACKEND_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "error")
if [[ $BACKEND_HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}All services are healthy!${NC}"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: http://localhost:8080"
    echo "  Backend:  http://localhost:3000"
    echo "  Database: localhost:5432"
    exit 0
else
    echo -e "${YELLOW}Some services are not responding.${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
