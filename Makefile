# StackMemory — Quick Commands (v3.2)
#
# Architecture: frontend (Next.js) → MCP server (Cloudflare D1 + Vectorize).
# There is no FastAPI backend or Python bridge anymore.

.PHONY: help install dev dev-frontend dev-mcp build test lint deploy stop restart logs clean health mcp-deploy

help: ## Show this help
	@echo "StackMemory Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (frontend + mcp-server)
	@echo "Installing dependencies..."
	cd frontend && npm install
	cd mcp-server && npm install

dev: ## Start the dashboard against the live MCP endpoint
	cd frontend && npm run dev

dev-frontend: ## Alias of dev
	cd frontend && npm run dev

dev-mcp: ## Run a local MCP server (Cloudflare wrangler dev)
	cd mcp-server && npx wrangler dev

selfhost: ## Run dashboard + self-hosted MCP via docker compose
	docker compose --profile selfhost up

build: ## Build Docker images
	docker compose build

test: ## Run frontend tests
	cd frontend && npm test

lint: ## Lint frontend code
	cd frontend && npm run lint

deploy: ## Deploy dashboard via docker compose (production)
	docker compose up -d

mcp-deploy: ## Deploy the MCP worker to Cloudflare
	cd mcp-server && npx wrangler deploy

stop: ## Stop all services
	docker compose down

restart: ## Restart services
	docker compose restart

logs: ## Tail all logs
	docker compose logs -f

logs-frontend: ## Tail frontend logs
	docker compose logs -f frontend

logs-mcp: ## Tail self-hosted MCP server logs
	docker compose logs -f mcp-server

health: ## Health check
	curl -fsS http://localhost:3000/api/health | jq .

clean: ## Remove containers and volumes
	docker compose down -v
