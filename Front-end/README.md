# 🗣️ Sawtak - Anonymous Whistleblowing Platform

A secure, resilient, and trustworthy platform that allows citizens  to anonymously report misconduct, corruption, or other complaints with cryptographic guarantees of data integrity and submission proof.


---

### Key Features

- **Dual Submission Modes**
  - 🔒 **Anonymous Mode**: Immutable blockchain storage with public pseudonym
  - 👤 **Identified Mode**: Traditional database with admin-visible identity

- **Blockchain Transparency**
  - All anonymous complaints stored on Hedera Consensus Service (HCS)
  - Public verification via blockchain explorer
  - Immutable audit trail

- **Public Transparency Portal**
  - Browse all anonymous complaints without login
  - Advanced search and filtering by category, area, status
  - Real-time statistics dashboard

- **Secure Admin Portal**
  - Multi-role access control
  - Identity reveal workflow with multi-sig approval
  - Comprehensive audit logging

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         SAWTAK                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Next.js 14)              Backend (Bun + Elysia)   │
│  ├── User Dashboard                 ├── REST API             │
│  ├── Admin Portal                   ├── Hedera Integration   │
│  └── Public Browse                  ├── IPFS/Supabase        │
│                                     └── Background Jobs      │
│                                                               │
│  Database (PostgreSQL)              Blockchain (Hedera)      │
│  ├── Users & Profiles               ├── HCS Topic 1          │
│  ├── Identified Complaints          │   (Complaints)         │
│  ├── Tracking & Audit               └── HCS Topic 2          │
│  └── Indexed Complaints                 (Status Updates)     │
│                                                               │
│  Cache (Redis)                      Storage                  │
│  ├── Sessions                       ├── IPFS (Anonymous)     │
│  ├── Rate Limiting                  └── Supabase (Identified)│
│  └── Job Queue                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, TailwindCSS
- **State**: React Query (TanStack), Zustand
- **Language**: TypeScript

### Backend
- **Runtime**: Bun
- **Framework**: Elysia.js
- **Language**: TypeScript
- **Jobs**: Bull Queue

### Database & Storage
- **Primary DB**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: Prisma
- **File Storage**: 
  - IPFS (Web3.Storage) for anonymous evidence
  - Supabase Storage for identified evidence

### Blockchain
- **Network**: Hedera Mainnet
- **SDK**: @hashgraph/sdk
- **Service**: Hedera Consensus Service (HCS)
---



## 📁 Project Structure
```
sawtak/
├── backend/
│   ├── src/
│   │   ├── routes/           # API route definitions
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── hedera.service.ts
│   │   │   ├── ipfs.service.ts
│   │   │   └── supabase.service.ts
│   │   ├── middleware/       # Auth, validation, rate limiting
│   │   ├── jobs/             # Background jobs
│   │   │   ├── hcs-indexer.job.ts
│   │   │   └── analytics.job.ts
│   │   ├── db/               # Database clients
│   │   ├── utils/            # Helper functions
│   │   └── types/            # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/           # Login, signup pages
│   │   ├── dashboard/        # User dashboard
│   │   ├── admin/            # Admin portal
│   │   └── public/           # Public browse
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔑 Key Concepts

### Anonymous Identifier

Every user gets an auto-generated anonymous identifier (e.g., `anon_a3f9c2e1d4`) on signup. This is used for anonymous submissions and is publicly visible on the blockchain while the user's real identity (email, name) remains encrypted in the database.

### Dual-Mode Submission

**Anonymous Mode:**
- Stored on Hedera blockchain (immutable)
- Public pseudonym visible
- Cannot edit or delete
- Evidence on IPFS (public)
- Transaction fee ~$0.0001 (paid by platform)

**Identified Mode:**
- Stored in PostgreSQL database
- Admin sees full identity
- Can edit/delete
- Evidence on Supabase (private)
- Free for users

### HCS Indexer

Background job that polls Hedera HCS topics every 2 seconds to:
1. Fetch new complaint and status update messages
2. Parse and validate JSON
3. Store in local PostgreSQL for fast querying
4. Enable search, filtering, and pagination

Without the indexer, querying the blockchain directly would be too slow.

---

## 🔐 Security Features

- **Password Hashing**: bcrypt with cost factor 12
- **JWT Authentication**: Access (1h) + Refresh (7d) tokens
- **Rate Limiting**: Redis-based per-IP and per-user limits
- **Encrypted Storage**: User IDs encrypted (AES-256-GCM) in anonymous tracking
- **Audit Logging**: All actions logged immutably
- **Identity Reveal**: Multi-sig approval workflow for accessing anonymous identities
- **Input Sanitization**: XSS and SQL injection prevention

---

## 📊 Database Schema

### Key Tables

- `users`: User accounts with email, password, anonymous_identifier
- `complaints_identified`: Database-stored complaints (editable)
- `complaints_anonymous_tracking`: Links users to blockchain submissions (encrypted)
- `indexed_complaints`: Local cache of HCS messages for fast queries
- `indexed_status_updates`: Status changes from HCS Topic 2
- `audit_logs`: Immutable log of all system actions
- `identity_access_logs`: Tracks all anonymous identity reveals

---

## 🎮 API Endpoints

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Complaints
```
POST   /api/complaints/submit-anonymous
POST   /api/complaints/submit-identified
GET    /api/complaints/my-anonymous
GET    /api/complaints/my-identified
GET    /api/complaints/anonymous/:hash
GET    /api/complaints/identified/:id
PUT    /api/complaints/identified/:id
DELETE /api/complaints/identified/:id
```

### Admin
```
GET    /api/admin/complaints/anonymous
GET    /api/admin/complaints/identified
POST   /api/admin/complaints/anonymous/:hash/status
PUT    /api/admin/complaints/identified/:id/status
POST   /api/admin/identity/request-access
POST   /api/admin/identity/approve-access
POST   /api/admin/identity/reveal
GET    /api/admin/analytics
GET    /api/admin/audit-logs
```

### Public
```
GET    /api/public/complaints
GET    /api/public/complaint/:hash
POST   /api/public/search
GET    /api/public/stats
```

---


## 📈 Monitoring

Access monitoring dashboards:

- **Grafana**: http://localhost:3001
- **Bull Dashboard**: http://localhost:8000/admin/queues
- **Prisma Studio**: `bunx prisma studio`

---

## Get Started (Locally)


## 📋 Prerequisites

- **Bun** >= 1.0.0
- **Node.js** >= 20.0.0 (for some dependencies)
- **PostgreSQL** >= 15
- **Redis** >= 7
- **Docker** (optional, for local development)

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/sawtak.git
cd sawtak
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run database migrations
bunx prisma migrate dev

# Generate Prisma client
bunx prisma generate

# Start development server
bun run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
bun install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local

# Start development server
bun run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/swagger

---

## 🔧 Environment Variables

### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sawtak

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
PLATFORM_SECRET=your-platform-secret-for-anonymous-ids

# Hedera
HEDERA_NETWORK=mainnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key
HEDERA_TOPIC_COMPLAINTS=0.0.TOPIC_ID
HEDERA_TOPIC_STATUS=0.0.TOPIC_ID

# IPFS
WEB3_STORAGE_TOKEN=your-web3-storage-token

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET=complaints-evidence

# Logging
LOG_LEVEL=info
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_IPFS_GATEWAY=https://w3s.link/ipfs
NEXT_PUBLIC_HEDERA_EXPLORER=https://hashscan.io/mainnet
```
