# Sawtak Local Testnet & Development Guide

Welcome to the Sawtak local development guide! This document explains how to easily spin up a true, multi-node Cosmos blockchain testnet alongside the full Sawtak stack (Frontend, Backend, Identity Provider, Redis, and Postgres) directly on your local machine.

---

## 🛠️ Prerequisites
Before you start, ensure you have the following installed:
- **Docker Desktop** (or Docker Engine on Linux)
- **Docker Compose**
- **Git** (Required for version control and line-ending management)
- *(Optional but recommended for frontend dev)* **Bun** (v1.x)

> [!NOTE] 
> **Windows Users:** We have added a `.gitattributes` file to the repository. This ensures that shell scripts (`.sh`) are always checked out with Linux `LF` line endings. **Do not change this**, as Docker containers will crash if the entrypoint scripts use Windows `CRLF` line endings.

---

## 🚀 1. Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd sawtak
   ```

2. **Setup your environment variables:**
   Copy the example environment file and fill in your specific credentials (like your `R2_ACCESS_KEY_ID`, `GOOGLE_CLIENT_ID`, etc.).
   ```bash
   cp .env.example .env
   ```

---

## 🖥️ 2. Running the Full Stack

We have configured specific Docker Compose files optimized for different operating systems to avoid common filesystem and networking quirks.

### For Windows Users
The Windows compose file bypasses Prisma migration issues on existing databases by dynamically pushing the schema, and handles Windows-to-Linux pathing securely.

```powershell
docker-compose -f docker/docker-compose.dev-windows-testnet.yml --env-file .env up -d
```

### For Linux / Mac Users
The Linux compose file is heavily optimized for native Unix-like environments (and is also fully compatible with Podman).

```bash
docker-compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env up -d
```

> [!TIP]
> The backend container will automatically run `bunx prisma db push --accept-data-loss` on startup. This ensures that whether you are on a completely fresh machine or have existing unmigrated data, the database schema will synchronize perfectly without crashing.

---

## 🔗 3. The Multi-Node Architecture
When you start the stack, you are actually launching a **3-node local blockchain network**:
- **Node 1 (Genesis Node):** Initializes the blockchain, generates the true `genesis.json`, and saves it to a shared Docker volume.
- **Node 2 & Node 3 (Validators):** Wait for Node 1 to finish, then automatically copy the `genesis.json` and dynamically connect to Node 1 using its runtime-generated Node ID.

You can verify they are perfectly synced by running the provided test script:
```bash
bun run tests/query_nodes.ts
```

---

## 🧹 4. Troubleshooting & Clean Slate
If the blockchain nodes fail to sync (e.g., if you stopped the containers midway through genesis creation), or if you just want to completely reset the database and blockchain state:

1. **Stop all containers:**
   ```bash
   docker-compose -f <your_compose_file.yml> down
   ```
2. **Wipe all persistent data (Volumes):**
   ```bash
   docker volume rm sawtak_sawtak_node_1_data sawtak_sawtak_node_2_data sawtak_sawtak_node_3_data sawtak_sawtak_shared_genesis sawtak_postgres_data sawtak_redis_data
   ```
3. **Restart the stack.** Node 1 will generate a brand new genesis file, and the validators will follow suit.

---

## 💻 5. Running the Frontend Locally (Outside Docker)
If you prefer to run the frontend directly on your host machine for faster hot-reloading while keeping the backend and blockchain in Docker:

1. Install frontend dependencies:
   ```bash
   cd Front-end
   bun install
   ```
2. Start the development server:
   ```bash
   bun run dev
   ```
   *The frontend will be available at `http://localhost:3000` and will route API requests to the Privacy Proxy running in Docker.*
