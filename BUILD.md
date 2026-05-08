# Building Sawtak

Sawtak uses build-time environment variables for the frontend (Next.js), which means you must build the images yourself with your own configuration. Pre-built images won't work because they embed `NEXT_PUBLIC_*` values at build time.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and Bun (for local development)
- All required API keys and secrets

## Required Environment Variables

### Frontend (Build-Time)
These are embedded in the frontend bundle at build time:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_HAWEYA_URL=https://your-haweya-domain.com
NEXT_PUBLIC_HAWEYA_CLIENT_ID=your-haweya-client-id
INTERNAL_API_URL=http://privacy-proxy:4000
```

### Backend (Runtime)
```bash
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-frontend-domain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/sawtak?schema=public

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Secrets
JWT_SECRET=your-jwt-secret
PROXY_SECRET=your-proxy-secret
ENCRYPTION_KEY=your-32-byte-hex-key
PLATFORM_SECRET=your-platform-secret
REQUIRE_PROXY_AUTH=true

# Cosmos (if using Cosmos blockchain)
COSMOS_CHAIN_ID=sawtak-testnet-1
COSMOS_RPC_ENDPOINT=http://cosmos-node:26657
COSMOS_GRPC_ENDPOINT=http://cosmos-node:9090
COSMOS_REST_ENDPOINT=http://cosmos-node:1317
COSMOS_ADDRESS_PREFIX=sawtak
COSMOS_BACKEND_MNEMONIC=your-mnemonic
BACKEND_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Indexer
ENABLE_HEDERA_INDEXER=false
ENABLE_COSMOS_INDEXER=true
INDEXER_START_HEIGHT=0
INDEXER_POLL_INTERVAL=10000

# AI Validation
GEMINI_API_KEY=your-gemini-api-key

# Cloudflare R2 (for file uploads)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=sawtak-public-evidence
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Google Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Haweya (Egypt National ID OAuth)
HAWEYA_ISSUER_URL=http://haweya:3030
HAWEYA_CLIENT_ID=sawtak_client
HAWEYA_CLIENT_SECRET=sawtak_secret
```

### Privacy Proxy (Runtime)
```bash
NODE_ENV=production
PROXY_PORT=4000
BACKEND_INTERNAL_URL=http://backend:8000
PROXY_SECRET=your-proxy-secret
REDIS_HOST=redis
REDIS_PORT=6379
FRONTEND_URL=https://your-frontend-domain.com
```

### Haweya (Runtime)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@haweya-db:5432/haweya?schema=public
PORT=3030
```

## Building Images

### 1. Create `.env` file

Create a `.env` file in the root directory with all your environment variables:

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Build all images

```bash
docker compose -f docker/docker-compose.prod-testnet.local.yml build
```

This builds:
- `sawtak-backend:latest`
- `sawtak-privacy-proxy:latest`
- `sawtak-frontend:latest`
- `sawtak-haweya-app:latest`
- `sawtak-node:latest` (Cosmos chain)

### 3. Start the stack

```bash
docker compose -f docker/docker-compose.prod-testnet.local.yml up -d
```

### 4. Verify health

```bash
# Check proxy health
curl http://localhost:4000/health

# Check backend health (through proxy)
curl http://localhost:4000/api/health
```

## Building Individual Images

If you need to build images separately:

### Backend
```bash
cd backend
docker build -t sawtak-backend:latest .
```

### Frontend
```bash
cd Front-end
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://your-api.com \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id \
  --build-arg NEXT_PUBLIC_HAWEYA_URL=https://haweya.com \
  --build-arg NEXT_PUBLIC_HAWEYA_CLIENT_ID=your-client-id \
  --build-arg INTERNAL_API_URL=http://privacy-proxy:4000 \
  -t sawtak-frontend:latest .
```

### Privacy Proxy
```bash
cd privacy-proxy
docker build -t sawtak-privacy-proxy:latest .
```

### Haweya
```bash
cd haweya
docker build -t sawtak-haweya-app:latest .
```

### Cosmos Chain
```bash
cd network/Sawtak
docker build -t sawtak-node:latest .
```

## Pushing to Your Registry

If you want to push images to your own registry:

```bash
# Tag images
docker tag sawtak-backend:latest your-registry.com/sawtak-backend:latest
docker tag sawtak-frontend:latest your-registry.com/sawtak-frontend:latest
docker tag sawtak-privacy-proxy:latest your-registry.com/sawtak-privacy-proxy:latest
docker tag sawtak-haweya-app:latest your-registry.com/sawtak-haweya-app:latest
docker tag sawtak-node:latest your-registry.com/sawtak-node:latest

# Push images
docker push your-registry.com/sawtak-backend:latest
docker push your-registry.com/sawtak-frontend:latest
docker push your-registry.com/sawtak-privacy-proxy:latest
docker push your-registry.com/sawtak-haweya-app:latest
docker push your-registry.com/sawtak-node:latest
```

Then update `docker/docker-compose.prod-testnet.local.yml` to use your registry:

```yaml
services:
  backend:
    image: your-registry.com/sawtak-backend:latest
  frontend:
    image: your-registry.com/sawtak-frontend:latest
  privacy-proxy:
    image: your-registry.com/sawtak-privacy-proxy:latest
  haweya-app:
    image: your-registry.com/sawtak-haweya-app:latest
  sawtak-node-1:
    image: your-registry.com/sawtak-node:latest
  sawtak-node-2:
    image: your-registry.com/sawtak-node:latest
  sawtak-node-3:
    image: your-registry.com/sawtak-node:latest
```

## Troubleshooting

### Frontend build fails with missing env vars
Make sure all `NEXT_PUBLIC_*` env vars are set before building. These are required at build time.

### Backend fails to start
Check that:
- Database is accessible and schema is pushed (`bunx prisma db push`)
- Redis is running
- All required secrets are set

### Proxy can't connect to backend
Verify:
- `BACKEND_INTERNAL_URL` is correct
- Backend is running and healthy
- `PROXY_SECRET` matches between proxy and backend

### Cosmos nodes not syncing
Check:
- `COSMOS_BACKEND_MNEMONIC` is set correctly
- Nodes can reach each other (check `PERSISTENT_PEERS`)
- `COSMOS_CHAIN_ID` matches across all nodes

## Security Notes

- Never commit `.env` files to version control
- Use strong, randomly generated secrets for `JWT_SECRET`, `PROXY_SECRET`, `ENCRYPTION_KEY`, `PLATFORM_SECRET`
- `ENCRYPTION_KEY` must be exactly 32 bytes (64 hex characters)
- Rotate secrets regularly in production
- Use environment-specific `.env` files (`.env.production`, `.env.staging`)
