# ============================================
# Sawtak - Makefile for Common Commands
# ============================================

.PHONY: help dev build up down logs restart clean migrate

# Default target
help:
	@echo "Sawtak - Available Commands"
	@echo "============================================"
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - View all logs"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make db-shell     - Open Postgres shell"
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
	@echo "  make backup       - Backup database"
	@echo ""

# ============================================
# Development Commands
# ============================================

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

db-shell:
	docker-compose -f docker/docker-compose.yml exec postgres psql -U postgres -d sawtak

db-reset:
	docker-compose -f docker/docker-compose.yml exec backend bunx prisma migrate reset --force

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

backup:
	@mkdir -p backups
	docker-compose -f docker/docker-compose.yml exec postgres pg_dump -U postgres sawtak > backups/sawtak_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up to backups/"

# ============================================
# Health Checks
# ============================================

health:
	@echo "Checking service health..."
	@curl -s http://localhost:8000/api/health | python -m json.tool 2>/dev/null || echo "Backend: Not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: OK" || echo "Frontend: Not responding"

status:
	docker-compose -f docker/docker-compose.yml ps
