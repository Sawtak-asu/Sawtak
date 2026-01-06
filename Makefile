# ============================================
# Sawtak - Makefile for Common Commands
# ============================================

.PHONY: help dev build up down logs restart clean migrate

# Default target
help:
	@echo "Sawtak - Available Commands"
	@echo "============================================"
	@echo "Development (Database Only):"
	@echo "  make dev-db       - Start database container for local dev"
	@echo "  make dev-db-stop  - Stop database container"
	@echo "  make dev-db-logs  - View database logs"
	@echo ""
	@echo "Development (Full Docker):"

	@echo "  make dev          - Start full development environment"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - View all logs"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make db-shell     - Open Postgres shell"
	@echo "  make backup       - Create database backup"
	@echo "  make restore      - Restore database from backup"
	@echo ""
	@echo "Monitoring (Grafana):"
	@echo "  make monitor      - Start Prometheus + Grafana"
	@echo "  make monitor-down - Stop monitoring stack"
	@echo ""
	@echo "Production:"
	@echo "  make prod-up      - Start production stack"
	@echo "  make prod-down    - Stop production stack"
	@echo "  make prod-logs    - View production logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove containers and volumes"
	@echo ""


# ============================================
# Development Commands
# ============================================


# Start only database containers (for local development)
dev-db:
	docker-compose -f docker/docker-compose.dev.yml up -d
	@echo "✅ Development database started"
	@echo "👉 PostgreSQL: localhost:5432"
	@echo ""
	@echo "Now run your apps locally:"
	@echo "  cd backend && bun run dev"
	@echo "  cd front-end && bun run dev"

dev-db-stop:
	docker-compose -f docker/docker-compose.dev.yml down

dev-db-logs:
	docker-compose -f docker/docker-compose.dev.yml logs -f

# Full Docker development (all services in containers)
dev:
	docker-compose -f docker/docker-compose.yml up -d
	@echo "✅ Development environment started"
	@echo "👉 Frontend: http://localhost:3000"
	@echo "👉 Backend:  http://localhost:8000"
	@echo "👉 API Docs: http://localhost:8000/swagger"

build:
	docker-compose -f docker/docker-compose.yml build --no-cache

up:
	docker-compose -f docker/docker-compose.yml up -d

down:
	docker-compose -f docker/docker-compose.yml down

logs:
	docker-compose -f docker/docker-compose.yml logs -f

logs-backend:
	docker-compose -f docker/docker-compose.yml logs -f backend

logs-frontend:
	docker-compose -f docker/docker-compose.yml logs -f frontend

restart:
	docker-compose -f docker/docker-compose.yml restart


# ============================================
# Database Commands
# ============================================

migrate:
	docker-compose -f docker/docker-compose.yml exec backend bunx prisma migrate deploy

migrate-dev:
	docker-compose -f docker/docker-compose.yml exec backend bunx prisma migrate dev

# For full docker setup
db-shell:
	docker-compose -f docker/docker-compose.yml exec postgres psql -U postgres -d sawtak

# For local dev (database only in Docker)
db-shell-dev:
	docker exec -it sawtak-postgres-dev psql -U postgres -d sawtak

db-reset:
	docker-compose -f docker/docker-compose.yml exec backend bunx prisma migrate reset --force

# Backup database (works with both setups)
backup:
	@mkdir -p docker/backups
	@echo "Creating database backup..."
	@if docker ps | grep -q sawtak-postgres-dev; then \
		docker exec sawtak-postgres-dev pg_dump -U postgres sawtak > docker/backups/sawtak_$$(date +%Y%m%d_%H%M%S).sql; \
	elif docker ps | grep -q sawtak-postgres; then \
		docker exec sawtak-postgres pg_dump -U postgres sawtak > docker/backups/sawtak_$$(date +%Y%m%d_%H%M%S).sql; \
	else \
		echo "No PostgreSQL container found. Start with 'make dev-db' or 'make dev' first."; \
		exit 1; \
	fi
	@echo "✅ Database backed up to docker/backups/"
	@ls -la docker/backups/*.sql | tail -1

# Restore database from the most recent backup
restore:
	@echo "Restoring database from backup..."
	@BACKUP_FILE=$$(ls -t docker/backups/*.sql 2>/dev/null | head -1); \
	if [ -z "$$BACKUP_FILE" ]; then \
		echo "No backup files found in docker/backups/"; \
		exit 1; \
	fi; \
	echo "Using backup: $$BACKUP_FILE"; \
	if docker ps | grep -q sawtak-postgres-dev; then \
		docker exec sawtak-postgres-dev psql -U postgres -c "DROP DATABASE IF EXISTS sawtak;"; \
		docker exec sawtak-postgres-dev psql -U postgres -c "CREATE DATABASE sawtak;"; \
		docker cp $$BACKUP_FILE sawtak-postgres-dev:/tmp/backup.sql; \
		docker exec sawtak-postgres-dev psql -U postgres -d sawtak -f /tmp/backup.sql; \
	elif docker ps | grep -q sawtak-postgres; then \
		docker exec sawtak-postgres psql -U postgres -c "DROP DATABASE IF EXISTS sawtak;"; \
		docker exec sawtak-postgres psql -U postgres -c "CREATE DATABASE sawtak;"; \
		docker cp $$BACKUP_FILE sawtak-postgres:/tmp/backup.sql; \
		docker exec sawtak-postgres psql -U postgres -d sawtak -f /tmp/backup.sql; \
	else \
		echo "No PostgreSQL container found."; \
		exit 1; \
	fi
	@echo "✅ Database restored"


# ============================================
# Production Commands
# ============================================

prod-build:
	docker-compose -f docker/docker-compose.prod.yml build --no-cache

prod-up:
	docker-compose -f docker/docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker/docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker/docker-compose.prod.yml logs -f

prod-restart:
	docker-compose -f docker/docker-compose.prod.yml restart

# ============================================
# Monitoring Commands (Prometheus + Grafana)
# ============================================

monitor:
	docker-compose -f docker/docker-compose.monitoring.yml up -d
	@echo "✅ Monitoring stack started"
	@echo "👉 Grafana:    http://localhost:3001 (admin/admin)"
	@echo "👉 Prometheus: http://localhost:9090"
	@echo "👉 Metrics:    http://localhost:8000/metrics"

monitor-down:
	docker-compose -f docker/docker-compose.monitoring.yml down

monitor-logs:
	docker-compose -f docker/docker-compose.monitoring.yml logs -f

# ============================================
# Maintenance Commands
# ============================================

clean:
	docker-compose -f docker/docker-compose.yml down -v --rmi local
	@echo "✅ Containers and volumes removed"

clean-dev:
	docker-compose -f docker/docker-compose.dev.yml down -v
	@echo "✅ Dev containers and volumes removed"


# ============================================
# Health Checks
# ============================================

health:
	@echo "Checking service health..."
	@curl -s http://localhost:8000/api/health | python -m json.tool 2>/dev/null || echo "Backend: Not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: OK" || echo "Frontend: Not responding"

status:
	docker-compose -f docker/docker-compose.yml ps
