# 🗣️ Sawtak - Anonymous Whistleblowing Platform

A secure, resilient, and trustworthy platform that allows citizens to anonymously report misconduct, corruption, or other complaints with cryptographic guarantees of data integrity and submission proof.

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
  - Community voting on complaints

- **Secure Admin Portal**
  - Multi-role access control
  - Identity reveal workflow with multi-sig approval 
  - Comprehensive audit logging

---

## 🏗️ Architecture

### Current Architecture (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                         SAWTAK                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Next.js 14)             Backend (Bun + Elysia)   │
│  ├── User Dashboard                ├── REST API             │
│  ├── Admin Portal                  ├── Hedera Integration   │
│  └── Public Browse                 ├── IPFS/Supabase        │
│                                    └── Background Jobs      │
│                                                             │
│  Database (PostgreSQL)             Blockchain (Hedera)      │
│  ├── Users & Profiles              ├── HCS Topic 1          │
│  ├── Identified Complaints         │   (Complaints)         │
│  ├── Tracking & Audit              └── HCS Topic 2          │
│  └── Indexed Complaints                (Status Updates)     │
│                                                             │
│  Cache (Redis)                     Storage                  │
│  ├── Sessions                      ├── IPFS (Anonymous)     │
│  ├── Rate Limiting                 └── CloudflareR2 (Identified)│
│  └── Job Queue                                              │
└─────────────────────────────────────────────────────────────┘
```

### Future Architecture (Phase 2 - Privacy Proxy Layer)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Frontend)                        │
│                 (Web Browser / Mobile App)                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              🔒 Privacy Proxy Server 🔒                    │
│             (Public-Facing, Port 443/8443)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Privacy Protection Layer                           │    │
│  │  ├─ Session Management (Redis)                      │    │
│  │  ├─ Rate Limiting (Per-Session + IP)                │    │
│  │  ├─ IP Anonymization (VPN-like)                     │    │
│  │  ├─ Browser Fingerprint Stripping                   │    │
│  │  └─ Request Sanitization                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Replaces: Client IP → Proxy IP                             │
│  Strips: User-Agent, Referer, X-Forwarded-*                 │
│  Forwards: Clean, anonymized requests                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Internal Network Only
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Elysia.js Backend (Internal Only, Port 8000)        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware: Auth, CORS, Logging                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Services: Complaints, Storage, Blockchain          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │              │               │
          ▼              ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Hedera     │ │  PostgreSQL │ │   Storage    │
│  Blockchain  │ │  Database   │ │  (S3/IPFS)   │
└──────────────┘ └─────────────┘ └──────────────┘
```

**Key Benefits of Phase 2:**
- ✅ Privacy Proxy intercepts ALL client requests
- ✅ Backend NEVER sees real client IPs or metadata
- ✅ Session-based rate limiting (not IP-based)
- ✅ VPN-like anonymization for whistleblowers
- ✅ Optional Tor integration for maximum privacy
- ✅ Backend runs on internal network (not publicly accessible)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 
- **State**: React Query (TanStack), Zustand
- **Language**: TypeScript

### Backend
- **Runtime**: Bun
- **Framework**: Elysia.js
- **Language**: TypeScript
- **Monitoring**: Prometheus + Grafana

### Database & Storage
- **Primary DB**: PostgreSQL 15
- **ORM**: Prisma
- **File Storage**: Supabase Storage (identified evidence), IPFS (anonymous evidence)

### Blockchain
- **Network**: Hedera Mainnet/Testnet
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
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── google.provider.ts
│   │   │   │   └── haweya.provider.ts   # 🆕 Haweya OAuth
│   │   │   ├── hedera.service.ts
│   │   │   ├── hedera-indexer.service.ts
│   │   │   ├── anonymous-submission.service.ts
│   │   │   ├── identified-complaint.service.ts
│   │   │   ├── feed.service.ts
│   │   │   └── vote.service.ts
│   │   ├── data/
│   │   │   └── egypt-locations.ts      # 🆕 Egypt admin divisions
│   │   ├── middleware/       # Auth, logging middleware
│   │   ├── telemetry/        # Prometheus metrics
│   │   ├── utils/            # Helper functions
│   │   └── validators/       # Input validation
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   └── Dockerfile
│
├── Front-end/
│   ├── app/
│   │   ├── (auth)/           # Login, signup pages
│   │   ├── feed/             # Public feed
│   │   ├── admin/            # Admin portal
│   │   ├── file-complaint/   # Complaint form with directedTo
│   │   └── complaints/       # Complaint submission
│   ├── components/           # React components
│   ├── lib/
│   │   ├── egypt-locations.ts  # 🆕 Egypt admin divisions
│   │   └── auth-context.tsx
│   └── package.json
│
├── haweya/                   # 🆕 Mock Haweya OAuth Provider
│   ├── backend/
│   │   └── src/
│   │       ├── index.ts      # Elysia OAuth server
│   │       └── db.ts         # In-memory store
│   ├── frontend/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── signup.html
│   │   └── css/style.css
│   ├── Dockerfile
│   ├── package.json
│   └── README.md             # Haweya documentation
│
├── docker/                   # Docker configurations
├── monitoring/               # Grafana + Prometheus configs
├── Makefile                  # Build automation
├── docker-compose.yml
└── README.md
```

---

## 🇪🇬 Egypt-Specific Features

### Directed To (Complaint Routing)

Complaints can be directed to specific government entities for better routing:

- **Ministries**: 16 Egyptian ministries (Health, Education, Interior, etc.)
- **Governorates**: 27 Egyptian governorates
- **Centers/Townships**: Major cities and centers within each governorate

This enables admins from specific jurisdictions to filter and view complaints relevant to them.

### Expanded Categories

- General
- Corruption
- Misconduct
- Harassment
- Discrimination
- Fraud
- Safety Concerns
- Environmental Issues
- Infrastructure Problems
- Healthcare Issues
- Education Issues
- Public Services
- Other

---

## 🆔 Haweya OAuth (Mock Identity Provider)

Sawtak includes a mock OAuth 2.0 provider simulating Egypt's National ID (Haweya) system.

### Setup

```bash
cd haweya
bun install
bun run dev
```

Runs on `http://localhost:3030`

### Integration

1. Add env variables to Sawtak backend:
```
HAWEYA_CLIENT_ID=sawtak_client
HAWEYA_CLIENT_SECRET=sawtak_secret
HAWEYA_ISSUER_URL=http://localhost:3030
```

2. Use "Sign in with Haweya" button in frontend

See `haweya/README.md` for full documentation.

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
- Evidence on Supabase Storage (private)
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
- **JWT Authentication**: Access tokens with configurable expiry
- **Encrypted Storage**: User IDs encrypted (AES-256-GCM) in anonymous tracking
- **Audit Logging**: All admin actions logged immutably
- **Identity Reveal Workflow**: Team Admins request reveals → Platform Admins approve with manual decryption key (✅ Implemented)
- **Input Sanitization**: XSS and SQL injection prevention

---

## 📊 Database Schema

### Key Tables

- `users`: User accounts with email, password, anonymous_identifier
- `identified_complaints`: Database-stored complaints (editable)
- `anonymous_complaint_tracking`: Links users to blockchain submissions (encrypted)
- `indexed_complaints`: Local cache of HCS messages for fast queries
- `indexed_status_updates`: Status changes from HCS Topic 2
- `admin_audit`: Admin action audit trail
- `user_complaint_votes`: Upvote/downvote tracking

---

## 🎮 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login with email/password |
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/google/login` | ❌ | Login with Google OAuth |
| GET | `/api/auth/verify` | ✅ | Verify JWT token |

### Anonymous Complaints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/complaints/anonymous/submit` | ✅ | Submit anonymous complaint to blockchain |

### Identified Complaints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/complaints/identified/submit` | ✅ | Submit identified complaint to database |
| GET | `/api/complaints/identified/my` | ✅ | Get user's identified complaints |
| PUT | `/api/complaints/identified/:id` | ✅ | Update complaint |
| DELETE | `/api/complaints/identified/:id` | ✅ | Delete complaint |

### Public Feed
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feed/public` | ❌ | Get paginated public complaints |
| GET | `/api/feed/public/:hash` | ❌ | Get single complaint by hash |
| GET | `/api/feed/stats` | ❌ | Get platform statistics |

### Tracking (User's Submissions)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tracking/my-anonymous` | ✅ | Get user's anonymous submissions |
| GET | `/api/tracking/my-identified` | ✅ | Get user's identified submissions |

### Voting
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/votes/:hash/upvote` | ✅ | Upvote a complaint |
| POST | `/api/votes/:hash/downvote` | ✅ | Downvote a complaint |
| DELETE | `/api/votes/:hash` | ✅ | Remove vote |
| GET | `/api/votes/:hash/status` | ✅ | Get user's vote status |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/complaints` | ✅ Admin | Get all complaints |
| GET | `/api/admin/complaints/:id` | ✅ Admin | Get complaint details |
| PUT | `/api/admin/complaints/:id/status` | ✅ Admin | Update complaint status |
| GET | `/api/admin/stats` | ✅ Admin | Admin dashboard stats |
| GET | `/api/admin/audit` | ✅ Admin | Get audit logs |

### Identity Reveal (Escalation Workflow)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/complaints/:id/request-identity-reveal` | ✅ Team Admin | Request identity reveal (creates pending request) |
| GET | `/api/admin/identity-reveal-requests` | ✅ Platform Admin | List all reveal requests (search & filter) |
| GET | `/api/admin/identity-reveal-requests/:id` | ✅ Platform Admin | Get reveal request details |
| POST | `/api/admin/identity-reveal-requests/:id/approve` | ✅ Platform Admin | Approve with manual decryption key |
| POST | `/api/admin/identity-reveal-requests/:id/reject` | ✅ Platform Admin | Reject reveal request |
| GET | `/api/admin/my-reveal-requests` | ✅ Team Admin | Get own reveal requests |

### Audits (Role-Based Access)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/audits` | ✅ Manager+ | Get audit logs with role-based visibility |

**Access Levels:**
- Platform Admin: All audits, filter by entity
- Team Admin: Audits from managers & reviewers in their team
- Manager: Audits from reviewers in their team
- Reviewer: No access

### Uploads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | ✅ | Upload evidence files |

### Indexer (Internal)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/indexer/trigger` | ✅ Admin | Manually trigger indexer |
| GET | `/api/indexer/status` | ✅ Admin | Get indexer status |

### Health & Metrics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Health check |
| GET | `/metrics` | ❌ | Prometheus metrics |

---

## 📈 Monitoring

Access monitoring dashboards:

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Prisma Studio**: `bunx prisma studio`
- **Swagger API Docs**: http://localhost:8000/swagger

---

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.0.0
- **Node.js** >= 20.0.0 (for some dependencies)
- **PostgreSQL** >= 15
- **Docker** (recommended for local development)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/sawtak.git
cd sawtak
```

### 2. Using Docker (Recommended)
```bash
# Start all services
make up

# Or manually
docker-compose up -d
```

### 3. Manual Setup

**Backend:**
```bash
cd backend
bun install
bunx prisma generate
bunx prisma migrate dev
bun run dev
```

**Frontend:**
```bash
cd Front-end
bun install
bun run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/swagger

---

## � Future Roadmap

### 1 - Privacy Proxy Layer
- [ ] Dedicated privacy proxy server
- [ ] Redis-based session management
- [ ] IP anonymization and metadata stripping
- [ ] Rate limiting per-session

### 2 - Enhanced Security
- [x] ~~Multi-signature identity reveal workflow~~ → Implemented as escalation workflow (Team Admin → Platform Admin)
- [ ] **Encryption Key Rotation** - Automatic periodic rotation of AES-256 encryption keys with re-encryption of sensitive data
- [ ] **Immutable Audit Logs on Blockchain** - Record all audit entries on Hedera/blockchain for tamper-proof audit trail
- [ ] Integration with Hweya (Egyptian national ID)
- [ ] End-to-end encryption for identified complaints
- [ ] Hardware Security Module (HSM) integration for key storage

### 3 - Mobile & Accessibility
- [ ] Progressive Web App (PWA)
- [ ] Arabic RTL support improvements
- [ ] Accessibility (WCAG 2.1 compliance)

### 4 - Custom Blockchain Network
- [ ] Migration from Hedera to custom blockchain solution
- [ ] Private/consortium blockchain for government/corporate deployments
- [ ] Enhanced throughput and reduced transaction costs
- [ ] Full control over consensus mechanisms

