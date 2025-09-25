# ConviveITESO Production Deployment Makefile

.PHONY: prod-up prod-up-ci prod-down prod-logs prod-status dev-db-up dev-db-down

# Production deployment (external database)
prod-up:
	@echo "<� Starting production services with external database..."
	@export CI=false && docker compose -f docker-compose.prod.yaml up --build -d
	@echo " Production services started!"
	@echo "=
 API: http://localhost:$${API_PORT:-8080}"
	@echo "=
 Web: http://localhost:$${WEB_PORT:-3000}"

# Production deployment in CI mode (uses dev database)
prod-up-ci:
	@echo "=' Starting production services in CI mode with dev database..."
	@echo "=� Starting development database..."
	@docker compose -f docker-compose.yaml up -d
	@echo "� Waiting for database to be ready..."
	@sleep 10
	@echo "<�  Starting production services..."
	@export CI=true && \
	 export DATABASE_URL="postgresql://user:unsafe@db:5432/convive-iteso-db" && \
	 export COMPOSE_PROJECT_NAME="convive-iteso-app" && \
	 docker compose -f docker-compose.prod.yaml up --build -d
	@echo " CI mode deployment complete!"
	@echo "=
 API: http://localhost:$${API_PORT:-8080}"
	@echo "=
 Web: http://localhost:$${WEB_PORT:-3000}"

# Stop production services
prod-down:
	@echo "=� Stopping production services..."
	@docker compose -f docker-compose.prod.yaml down
	@echo " Production services stopped!"

# Stop production services and dev database (CI mode)
prod-down-ci:
	@echo "=� Stopping production services..."
	@docker compose -f docker-compose.prod.yaml down
	@echo "=� Stopping development database..."
	@docker compose -f docker-compose.yaml down
	@echo " All services stopped!"

# View production logs
prod-logs:
	@docker compose -f docker-compose.prod.yaml logs -f

# Check production service status
prod-status:
	@docker compose -f docker-compose.prod.yaml ps

# Start only development database
dev-db-up:
	@echo "=� Starting development database..."
	@docker compose -f docker-compose.yaml up -d db
	@echo " Development database started!"

# Stop development database
dev-db-down:
	@echo "=� Stopping development database..."
	@docker compose -f docker-compose.yaml down
	@echo " Development database stopped!"

# Help target
help:
	@echo "ConviveITESO Production Deployment Commands:"
	@echo ""
	@echo "  make prod-up       - Start production with external database"
	@echo "  make prod-up-ci    - Start production with dev database (CI mode)"
	@echo "  make prod-down     - Stop production services only"
	@echo "  make prod-down-ci  - Stop production services and dev database"
	@echo "  make prod-logs     - View production logs"
	@echo "  make prod-status   - Check service status"
	@echo "  make dev-db-up     - Start only development database"
	@echo "  make dev-db-down   - Stop development database"
	@echo "  make help          - Show this help message"
	@echo ""
	@echo "Environment variables:"
	@echo "  API_PORT           - API port (default: 8080)"
	@echo "  WEB_PORT           - Web port (default: 3000)"
	@echo "  DATABASE_URL       - External database URL (required for prod-up)"