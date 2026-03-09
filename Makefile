# StackMemory Makefile - Quick Commands

.PHONY: help install dev build test deploy clean

help: ## Show this help
	@echo "StackMemory Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd frontend && npm install
	cd mcp-server && npm install
	pip install -r backend/requirements.txt
	pip install -r bridge/requirements.txt

dev: ## Start development servers
	@echo "🚀 Starting development servers..."
	docker-compose up

dev-frontend: ## Start frontend only
	@echo "🎨 Starting frontend..."
	cd frontend && npm run dev

dev-backend: ## Start backend only
	@echo "⚙️ Starting backend..."
	cd backend && uvicorn server:app --reload

build: ## Build all Docker images
	@echo "🏗️ Building Docker images..."
	docker-compose build

test: ## Run all tests
	@echo "🧪 Running tests..."
	cd frontend && npm test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	cd frontend && npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	cd frontend && npm run test:coverage

lint: ## Lint code
	@echo "🔍 Linting code..."
	cd frontend && npm run lint

deploy: ## Deploy to production
	@echo "🚀 Deploying to production..."
	docker-compose --profile bots --profile monitoring up -d

deploy-simple: ## Deploy core services only
	@echo "🚀 Deploying core services..."
	docker-compose up -d

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker-compose restart

logs: ## Show logs
	@echo "📋 Showing logs..."
	docker-compose logs -f

logs-frontend: ## Show frontend logs
	@echo "📋 Showing frontend logs..."
	docker-compose logs -f frontend

logs-backend: ## Show backend logs
	@echo "📋 Showing backend logs..."
	docker-compose logs -f backend

logs-bridge: ## Show bridge logs
	@echo "📋 Showing bridge logs..."
	docker-compose logs -f bridge

ps: ## Show running services
	@echo "📊 Running services:"
	docker-compose ps

health: ## Check service health
	@echo "🏥 Checking health..."
	@curl -f http://localhost:3000/api/health || echo "❌ Frontend unhealthy"
	@curl -f http://localhost:8080/health || echo "❌ Bridge unhealthy"

clean: ## Clean build artifacts
	@echo "🧹 Cleaning..."
	cd frontend && rm -rf .next node_modules
	cd mcp-server && rm -rf dist node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

clean-docker: ## Clean Docker resources
	@echo "🧹 Cleaning Docker..."
	docker-compose down -v
	docker system prune -f

backup: ## Backup data
	@echo "💾 Creating backup..."
	docker-compose exec -T postgres pg_dump -U postgres > backup_$$(date +%Y%m%d_%H%M%S).sql

restore: ## Restore from backup (usage: make restore FILE=backup.sql)
	@echo "📥 Restoring from $(FILE)..."
	docker-compose exec -T postgres psql -U postgres < $(FILE)

monitoring: ## Start monitoring stack
	@echo "📊 Starting monitoring..."
	docker-compose --profile monitoring up -d

bots: ## Start bot services
	@echo "🤖 Starting bots..."
	docker-compose --profile bots up -d

shell-frontend: ## Shell into frontend container
	docker-compose exec frontend sh

shell-backend: ## Shell into backend container
	docker-compose exec backend bash

shell-bridge: ## Shell into bridge container
	docker-compose exec bridge bash

update: ## Update dependencies
	@echo "⬆️ Updating dependencies..."
	cd frontend && npm update
	cd mcp-server && npm update
	pip install --upgrade -r backend/requirements.txt
	pip install --upgrade -r bridge/requirements.txt

security-scan: ## Run security scan
	@echo "🔒 Running security scan..."
	cd frontend && npm audit
	pip-audit

benchmark: ## Run performance benchmarks
	@echo "⚡ Running benchmarks..."
	cd frontend && npm run benchmark

docs: ## Generate documentation
	@echo "📚 Generating docs..."
	@echo "Docs available in this repository and product guides"

version: ## Show version
	@echo "StackMemory - AI coding workflow memory layer"

