# ConviveITESO Production Deployment Makefile

.PHONY: prod-up prod-up-ci prod-down prod-down-ci prod-logs prod-status dev-db-up dev-db-down help

API_PORT ?= 8080
WEB_PORT ?= 3000
PROJECT_NAME ?= convive-iteso-app
COMPOSE_PROD := docker-compose.prod.yaml
COMPOSE_DEV  := docker-compose.yaml

# Production deployment (external database)
prod-up:
	@printf "[+] Starting production services with external database...\n"
	@CI=false docker compose -p $(PROJECT_NAME) -f $(COMPOSE_PROD) up --build -d
	@printf "API: http://localhost:%s\n" "$(API_PORT)"
	@printf "Web: http://localhost:%s\n" "$(WEB_PORT)"

# Production deployment in CI mode (uses dev database)
prod-up-ci:
	@printf "[+] Starting production services in CI mode with dev database...\n"
	@printf "[+] Starting development database...\n"
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_DEV) up -d db
	@printf "[+] Waiting for database to be ready...\n"
	@sleep 10
	@printf "[+] Starting production services...\n"
	@CI=true COMPOSE_PROJECT_NAME=$(PROJECT_NAME) \
		docker compose -p $(PROJECT_NAME) -f $(COMPOSE_PROD) up --build -d
	@printf "API: http://localhost:%s\n" "$(API_PORT)"
	@printf "Web: http://localhost:%s\n" "$(WEB_PORT)"

# Stop production services
prod-down:
	@printf "[+] Stopping production services...\n"
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_PROD) down
	@printf "[+] Production services stopped!\n"

# Stop production services and dev database (CI mode)
prod-down-ci:
	@printf "[+] Stopping production services...\n"
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_PROD) down
	@printf "[+] Stopping development database...\n"
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_DEV) down
	@printf "[+] All services stopped!\n"

# View production logs
prod-logs:
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_PROD) logs -f

# Check production service status
prod-status:
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_PROD) ps

# Start only development database
dev-db-up:
	@printf "[+] Starting development database...\n"
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_DEV) up -d db
	@printf "[+] Development database started!\n"

# Stop development database
dev-db-down:
	@printf "[+] Stopping development database...\n"
	@docker compose -p $(PROJECT_NAME) -f $(COMPOSE_DEV) down
	@printf "[+] Development database stopped!\n"

# Help target
help:
	@printf "ConviveITESO Production Deployment Commands:\n\n"
	@printf "  make prod-up       - Start production with external database\n"
	@printf "  make prod-up-ci    - Start production with dev database (CI mode)\n"
	@printf "  make prod-down     - Stop production services only\n"
	@printf "  make prod-down-ci  - Stop production services and dev database\n"
	@printf "  make prod-logs     - View production logs\n"
	@printf "  make prod-status   - Check service status\n"
	@printf "  make dev-db-up     - Start only development database\n"
	@printf "  make dev-db-down   - Stop development database\n"
	@printf "  make help          - Show this help message\n\n"
	@printf "Environment variables:\n"
	@printf "  API_PORT           - API port (default: 8080)\n"
	@printf "  WEB_PORT           - Web port (default: 3000)\n"
	@printf "  DATABASE_URL       - External database URL (required for prod-up)\n"
	@printf "  PROJECT_NAME       - Docker Compose project name (default: convive-iteso-app)\n"