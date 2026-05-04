#!/bin/bash
set -e

COMPOSE_FILE="docker/docker-compose.prod-testnet.yml"

echo "==> Building backend..."
podman build -f backend/Dockerfile -t sawtak-backend:latest .

echo "==> Building frontend..."
podman build -f Front-end/Dockerfile -t sawtak-frontend:latest Front-end/

echo "==> Building sawtak-node..."
podman build -f network/Sawtak/Dockerfile -t sawtak-node:latest network/Sawtak/

echo "==> Building haweya..."
podman build -f haweya/Dockerfile -t sawtak-haweya-app:latest haweya/

echo "==> Done"