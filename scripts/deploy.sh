#!/bin/bash
# AI-ULU Production Deployment Script

set -e

echo "🚀 AI-ULU Production Deployment"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env from .env.example"
    exit 1
fi

# Load environment
source .env

# Check required variables
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "OPENAI_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build images
echo "🏗️ Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Stop old containers
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Health check
echo "🏥 Checking service health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend is unhealthy${NC}"
    exit 1
fi

if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bridge is healthy${NC}"
else
    echo -e "${RED}❌ Bridge is unhealthy${NC}"
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "Services:"
echo "  Frontend: http://localhost:3000"
echo "  Bridge:   http://localhost:8080"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana:  http://localhost:3001"
echo ""
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
