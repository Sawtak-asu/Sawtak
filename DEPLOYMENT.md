# 🚀 Sawtak Deployment Guide

This guide covers deploying Sawtak using Docker containers.

## 📋 Prerequisites

- **Docker** v24.0+ and **Docker Compose** v2.20+
- A domain name (for production)
- Required API keys and secrets (Hedera, Cloudflare R2, Google OAuth)

---

## 🏃 Quick Start (Local Development)

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env  # or your preferred editor
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/swagger

---

## 🏭 Production Deployment

### 1. Server Requirements

- **VPS/Cloud Instance**: 2+ vCPU, 4GB+ RAM, 40GB+ SSD
- **OS**: Ubuntu 22.04+ or Debian 11+
- **Domain**: Point your domain to the server IP

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone Repository

```bash
git clone https://github.com/your-org/sawtak.git
cd sawtak
```

### 4. Configure Environment

```bash
# Copy and edit environment
cp .env.example .env
nano .env
```

**Important Production Settings:**

```env
# Required for production
NODE_ENV=production
DOMAIN=sawtak.yourdomain.com
FRONTEND_URL=https://sawtak.yourdomain.com

# Strong passwords (generate with: openssl rand -hex 32)
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
JWT_SECRET=<strong-secret>
ENCRYPTION_KEY=<32-byte-hex>

# SSL/TLS
ACME_EMAIL=admin@yourdomain.com

# Hedera - use mainnet for production
HEDERA_NETWORK=mainnet
```

### 5. Generate Traefik Dashboard Auth

```bash
# Generate password hash for Traefik dashboard
echo $(htpasswd -nb admin YourSecurePassword) | sed -e s/\\$/\\$\\$/g
# Add output to TRAEFIK_DASHBOARD_AUTH in .env
```

### 6. Deploy

```bash
# Build and start production stack
docker-compose -f docker-compose.prod.yml up -d --build

# Watch the logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Verify Deployment

- **Frontend**: https://sawtak.yourdomain.com
- **API**: https://api.sawtak.yourdomain.com
- **Traefik Dashboard**: https://traefik.sawtak.yourdomain.com

---

## 🔧 Management Commands

### Database Operations

```bash
# Run database migrations
docker-compose exec backend bunx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend bunx prisma generate

# Database shell access
docker-compose exec postgres psql -U postgres -d sawtak
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Enter container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Updates and Restart

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Backup

```bash
# Backup PostgreSQL database
docker-compose exec postgres pg_dump -U postgres sawtak > backup_$(date +%Y%m%d).sql

# Backup Redis data
docker-compose exec redis redis-cli BGSAVE
docker cp sawtak-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

---

## 🌐 Alternative Hosting Options

### Railway

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Railway auto-detects Dockerfiles

### Render

1. Create Web Services for backend and frontend
2. Create PostgreSQL and Redis instances
3. Configure environment variables
4. Deploy from GitHub

### DigitalOcean App Platform

1. Create new App from GitHub
2. Configure resources (Backend, Frontend, Database)
3. Set environment variables
4. Enable auto-deploy

### AWS ECS / GCP Cloud Run

For enterprise deployments, use the provided Dockerfiles with:
- AWS ECS with Fargate
- GCP Cloud Run
- Azure Container Apps

---

## 🔒 Security Checklist

- [ ] All secrets are strong and unique (use `openssl rand -hex 32`)
- [ ] HTTPS is enforced via Traefik
- [ ] Database and Redis are not exposed to public internet
- [ ] Traefik dashboard is password-protected
- [ ] Regular backups are configured
- [ ] Log monitoring is set up
- [ ] Firewall allows only ports 80, 443, and SSH

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker-compose logs backend

# Verify environment variables
docker-compose config

# Check container health
docker inspect sawtak-backend | grep -A 10 "Health"
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose ps postgres

# Test connection from backend
docker-compose exec backend sh -c 'bunx prisma db push --dry-run'
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker-compose -f docker-compose.prod.yml logs traefik

# Verify DNS is pointing correctly
dig +short yourdomain.com

# Check certificate status
docker-compose -f docker-compose.prod.yml exec traefik \
  cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates'
```

---

## 📊 Monitoring (Optional)

Add these services to `docker-compose.prod.yml` for monitoring:

```yaml
  # Prometheus metrics
  prometheus:
    image: prom/prometheus
    # ...

  # Grafana dashboards  
  grafana:
    image: grafana/grafana
    # ...
```

---

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review container logs
