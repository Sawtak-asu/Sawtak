# 🗣️ Sawtak - Anonymous Whistleblowing Platform

A secure, resilient, and trustworthy platform that allows citizens to anonymously report misconduct, corruption, or other complaints with cryptographic guarantees of data integrity and submission proof. Sawtak leverages its own sovereign blockchain network to ensure that your voice cannot be silenced or altered.

---

### Key Features

- **Dual Submission Modes**
  - 🔒 **Anonymous Mode**: Immutable storage on the **Sawtak Blockchain** with advanced metadata stripping via a privacy proxy.
  - 👤 **Identified Mode**: Traditional secure storage with identity verification via **Haweya** (National ID) or Google.

- **Sovereign Blockchain Integrity**
  - All anonymous complaints are hashed and recorded on the **Sawtak Blockchain** (built on Cosmos SDK & Tendermint).
  - Public verification via the **Sawtak Blockchain Explorer**.
  - Immutable audit trail with Byzantine Fault Tolerance.

- **Privacy Proxy Layer**
  - Mandatory redaction of IP addresses, User-Agents, and device identifiers before data reaches the backend.
  - Ensures zero-knowledge of anonymous reporters' technical metadata.

- **Public Transparency Portal**
  - Browse all public anonymous complaints without login.
  - Advanced search and filtering by category, area, status.
  - Real-time statistics dashboard with on-chain verification.

- **Secure Admin Portal**
  - Multi-role access control (Reviewer, Manager, Admin).
  - Secure identity reveal workflow for identified complaints.
  - Comprehensive, immutable audit logging of all administrative actions.

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         SAWTAK                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Next.js 15)              Backend (Bun + Elysia)   │
│  ├── User Dashboard                 ├── REST API             │
│  ├── Admin Portal                   ├── Blockchain Service   │
│  └── Public Browse                  ├── IPFS Integration     │
│                                     └── Background Indexer   │
│                                                               │
│  Database (PostgreSQL)              Blockchain (Sawtak)      │
│  ├── Users & Profiles               ├── Cosmos SDK Node      │
│  ├── Identified Complaints          │   (Tendermint Core)    │
│  ├── Tracking & Audit               └── Immutable Ledger     │
│  └── Indexed Complaints                 (On-chain Hashes)    │
│                                                               │
│  Cache (Redis)                      Storage                  │
│  ├── Sessions                       ├── IPFS (Anonymous)     │
│  ├── Rate Limiting                  └── Cloudflare R2        │
│  └── Job Queue                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TailwindCSS, Lucide Icons
- **State**: React Query (TanStack), Zustand
- **I18n**: Next-intl (Full Arabic/English support)

### Backend
- **Runtime**: Bun (Blazing fast JS runtime)
- **Framework**: Elysia.js
- **Language**: TypeScript
- **Auth**: Lucia Auth / Haweya Integration

### Database & Storage
- **Primary DB**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **File Storage**: 
  - **IPFS** for anonymous evidence (Decentralized)
  - **Cloudflare R2 / Supabase** for identified evidence

### Blockchain
- **Network**: Sawtak Blockchain (Sovereign L1)
- **Engine**: Cosmos SDK & Tendermint (BFT Consensus)
- **Finality**: Immediate (1-2 seconds)
---

## 📁 Project Structure
```
sawtak/
├── Front-end/            # Next.js Application
│   ├── app/              # App Router (i18n localized)
│   ├── components/       # UI Components (Tailwind)
│   ├── messages/         # i18n JSON files (en/ar)
│   └── lib/              # Contexts & Utilities
│
├── Back-end/             # Bun/Elysia API
│   ├── src/
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Blockchain & IPFS logic
│   │   └── jobs/         # Blockchain Indexers
│
├── Blockchain/           # Sawtak Blockchain Node
│   └── x/complaints/     # Custom Cosmos SDK module
│
├── docker-compose.yml    # Development environment
└── README.md
```

---

## 🔑 Key Concepts

### Privacy Proxy
Every request for an anonymous complaint passes through a specialized proxy that strips identifying headers (IP, User-Agent, Referrer) and forwards only the raw complaint data to the backend. This ensures the platform never sees the reporter's technical footprint.

### On-Chain Verification
For every anonymous complaint, a unique cryptographic hash is generated and published to the **Sawtak Blockchain**. This creates a timestamped "Proof of Existence" that anyone can verify using the hash, making it impossible for authorities to claim a complaint was never filed.

### Dual-Mode Submission

**Anonymous Mode:**
- Stored as a hash on the Sawtak Blockchain (immutable).
- Identity stripped at the edge.
- Evidence pinned to IPFS (censorship-resistant).
- Cannot be edited or deleted by anyone.

**Identified Mode:**
- Identity verified via Haweya/National ID.
- Stored in secure, encrypted PostgreSQL database.
- Allows for direct follow-up and status updates.
- Encrypted with AES-256-GCM.

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- **Bun** >= 1.1.0
- **Docker** & **Docker Compose**
- **Go** (if building the blockchain node from source)

### 2. Environment Setup
Clone the repository and copy the example environment files:
```bash
cp .env.example .env
cd Front-end && cp .env.local.example .env.local
cd ../Back-end && cp .env.example .env
```

### 3. Run with Docker
The easiest way to start the entire stack (Frontend, Backend, DB, Redis, and Blockchain Node):
```bash
docker-compose up --build
```

---

## 🔧 Core Configuration

### Blockchain Config
- `CHAIN_ID`: sawtak-mainnet-1
- `RPC_URL`: http://blockchain:26657
- `REST_URL`: http://blockchain:1317

### Storage Config
- `IPFS_GATEWAY`: https://ipfs.sawtak.io
- `R2_BUCKET`: sawtak-evidence

---

## ⚖️ License
This project is part of a graduation thesis for Ain Shams University, Faculty of Science, Computer Science Department. All rights reserved.
