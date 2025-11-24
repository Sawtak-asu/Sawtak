# Sawtak Backend

Privacy-first whistleblowing platform backend built with **Bun**, **Elysia.js**, and **Hedera Blockchain**.

## 🏗️ Architecture

### Current Architecture (Phase 1)

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Frontend)                     │
│                 (Web Browser / Mobile App)               │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Elysia.js API Gateway                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Middleware Layer                               │   │
│  │  ├─ CORS (Cross-Origin Resource Sharing)       │   │
│  │  ├─ Auth Middleware (JWT Verification)         │   │
│  │  ├─ Proxy Middleware (Metadata Sanitization)   │   │
│  │  └─ Swagger (Auto API Documentation)           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Route Handlers                                 │   │
│  │  ├─ /api/auth/google/*                         │   │
│  │  ├─ /api/complaints/anonymous/*                │   │
│  │  ├─ /api/complaints/identified/*               │   │
│  │  ├─ /api/upload/*                              │   │
│  │  ├─ /api/admin/*                               │   │
│  │  └─ /api/public/*                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │              │               │
         ▼              ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│  Anonymous   │ │  Identified │ │   Upload     │
│  Submission  │ │  Complaint  │ │   Service    │
│   Service    │ │   Service   │ │              │
└──────────────┘ └─────────────┘ └──────────────┘
         │              │               │
         ▼              ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Hedera     │ │  PostgreSQL │ │   Supabase   │
│  Blockchain  │ │  (Prisma)   │ │   Storage    │
│     HCS      │ │             │ │              │
└──────────────┘ └─────────────┘ └──────────────┘
```

### Future Architecture (Phase 2 - Privacy Proxy Layer)

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Frontend)                     │
│                 (Web Browser / Mobile App)               │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌────────────────────────────────────────────────────────┐
│              🔒 Privacy Proxy Server 🔒                │
│             (Public-Facing, Port 443/8443)             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Privacy Protection Layer                       │   │
│  │  ├─ Session Management (Redis)                  │   │
│  │  ├─ Rate Limiting (Per-Session + IP)            │   │
│  │  ├─ IP Anonymization (VPN-like)                 │   │
│  │  ├─ Browser Fingerprint Stripping               │   │
│  │  └─ Request Sanitization                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  Replaces: Client IP → Proxy IP                        │
│  Strips: User-Agent, Referer, X-Forwarded-*            │
│  Forwards: Clean, anonymized requests                  │
└────────────────────────────────────────────────────────┘
                         │
                         │ Internal Network Only
                         ▼
┌─────────────────────────────────────────────────────────┐
│         Elysia.js Backend (Internal Only, Port 8000)    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Middleware: Auth, CORS, Logging                │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Services: Complaints, Storage, Blockchain      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         │              │               │
         ▼              ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Hedera     │ │  PostgreSQL │ │   Supabase   │
│  Blockchain  │ │  Database   │ │   Storage    │
└──────────────┘ └─────────────┘ └──────────────┘
```

**Key Differences in Phase 2:**
- ✅ Privacy Proxy intercepts ALL client requests
- ✅ Backend NEVER sees real client IPs or metadata
- ✅ Session-based rate limiting (not IP-based)
- ✅ VPN-like anonymization for whistleblowers
- ✅ Optional Tor integration for maximum privacy
- ✅ Backend runs on internal network (not publicly accessible)

**Implementation Status:**
- ✅ **Phase 1**: Current implementation (API Gateway) - In Progress
- 🔜 **Phase 2**: Privacy Proxy (planned for production)

### How Sessions & JWT Work Together (Phase 2)

**Two Different Systems:**

1. **Redis Sessions (Privacy Proxy)** - Anonymous tracking
   - Tracks activity WITHOUT knowing who you are
   - Used for: Rate limiting, DDoS protection
   - Example: "This browser made 45 requests in the last minute"

2. **JWT Tokens (Backend)** - User authentication
   - Proves who you are
   - Used for: Accessing protected endpoints (complaints, uploads)
   - Example: "This is user-123, email: user@gmail.com"

**Flow:**
```
User Visits → Proxy gives cookie (session_id=abc123)
User Logs In → Backend gives JWT token
User Submits → Proxy checks rate limit (session)
             → Backend checks identity (JWT)
```

**Why Both?**
- Proxy doesn't know WHO is making requests (privacy!)
- Backend doesn't care WHEN requests started (just validates identity)
- Rate limiting works even for logged-out users

## 🚀 Tech Stack
- **Storage**: [Supabase Storage](https://supabase.com/) for evidence files
- **IPFS**: Web3.Storage for anonymous complaint evidence
- **Authentication**: JWT with Google OAuth support

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL database
- Hedera Testnet account
- Supabase account
- Google OAuth credentials (optional)

### Setup

1. **Clone and install dependencies**:
```bash
cd backend
bun install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables)).

3. **Database setup**:
```bash
# Generate Prisma client
bun prisma generate

# Run migrations
bun prisma migrate dev
```

4. **Start development server**:
```bash
bun run dev
```

Server will start at `http://localhost:8000`

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=development
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sawtak?schema=public

# Hedera Blockchain
HEDERA_ACCOUNT_ID=0.0.123456  # or HEDERA_OPERATOR_ID
HEDERA_PRIVATE_KEY=302e...    # or HEDERA_OPERATOR_KEY
HEDERA_TOPIC_ID_COMPLAINTS=0.0.123457  # or HEDERA_TOPIC_COMPLAINTS
HEDERA_TOPIC_ID_STATUS=0.0.123458      # or HEDERA_TOPIC_STATUS

# Security
ENCRYPTION_KEY=64_character_hex_string  # For encrypting anonymous identifiers
JWT_SECRET=your-super-secret-jwt-key

# Supabase (for identified complaint media) , will eventually migrate to an AWS S3 bucket
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Google OAuth ( ALSO TEMPORARY UNTIL WE HAVE ACCESS TO HWEYA )
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Web3 Storage (IPFS)
WEB3_STORAGE_TOKEN=your-web3-storage-token
```

### Generating Keys

**Encryption Key** (32 bytes = 64 hex characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google/login` | ❌ | Login with Google OAuth |
| GET | `/api/auth/google/verify` | ✅ | Verify JWT token |

### Complaints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/complaints/anonymous/submit` | ✅ | Submit anonymous complaint to blockchain |
| POST | `/api/complaints/identified/submit` | ✅ | Submit identified complaint to database |

### Uploads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | ✅ | Upload evidence files to Supabase |



## 🔒 Authentication Flow

### 1. Google Login (Frontend)

```javascript
// User logs in with Google
const response = await googleLogin();

// Send ID token to backend
const { token, user } = await fetch('/api/auth/google/login', {
  method: 'POST',
  body: JSON.stringify({ idToken: response.credential })
}).then(r => r.json());

// Store JWT token
localStorage.setItem('token', token);
```

###  Making Authenticated Requests

```javascript
// Include JWT in Authorization header
fetch('/api/complaints/anonymous/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: user.id,
    anonymousIdentifier: user.anonymousIdentifier,
    title: "Complaint Title",
    text: "Description...",
    category: "corruption"
  })
});
```

## 🗄️ Database Schema

### Key Models

- **User**: User accounts (Google OAuth or email/password)
- **IdentifiedComplaint**: Public complaints stored in database
- **IndexedComplaint**: Blockchain complaints indexed for search
- **IndexedStatusUpdate**: Status change history from blockchain
- **AdminAudit**: Admin action audit trail

### Schema Diagram

```prisma
model User {
  id                   String   @id @default(uuid())
  email                String   @unique
  password             String?  // Optional for OAuth users
  anonymous_identifier String   @unique
  auth_provider        String   @default("email")
  auth_provider_id     String?
}

model IdentifiedComplaint {
  id            String   @id @default(uuid())
  user_id       String
  title         String
  text          String
  category      String
  area          String
  incident_date DateTime
  evidence_urls Json?
  status        String
}

// Anonymous complaints are blockchain-only (no local storage)
// See IndexedComplaint for blockchain data cache
```

View full schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

## 🔗 Blockchain Integration

### Anonymous Complaints Flow

1. **Encrypt User Identity**:
   - User's `anonymousIdentifier` is encrypted with AES-256
   - Only admins with `ENCRYPTION_KEY` can decrypt

2. **Submit to Hedera**:
   - Complaint data → Hedera Consensus Service (HCS)
   - Returns immutable transaction ID

3. **Create Initial Status**:
   - Status "submitted" → HCS Status Topic
   - Linked to complaint by transaction hash

4. **No Local Storage**:
   - Anonymous complaints are **blockchain-only**
   - No database record of the complaint content

### Testing Hedera Connection

```bash
bun run test-hedera.ts
```

This script tests:
- Connection to Hedera Testnet
- Submission to Complaints Topic
- Submission to Status Topic

## 🛠️ Development

### Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── interfaces/       # TypeScript interfaces
│   ├── jobs/             # Background jobs (indexer)
│   ├── middleware/       # Auth, proxy middleware
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   │   ├── anonymous-submission.service.ts
│   │   ├── complaint-status.service.ts
│   │   ├── hedera.service.ts
│   │   ├── public-evidence-storage.service.ts
│   │   └── ...
│   ├── utils/            # Crypto, helpers
│   ├── db.ts             # Prisma client
│   └── server.ts         # Main entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── .env                  # Environment variables
└── package.json
```

### Available Scripts

```bash
# Development
bun run dev          # Start dev server with hot reload

# Database
bun prisma generate  # Generate Prisma client
bun prisma migrate dev  # Run migrations
bun prisma studio    # Open database GUI

# Testing
bun run test-hedera.ts  # Test Hedera connection

# Production
bun run build        # Build for production
bun start            # Start production server
```

### Adding a New Route

1. Create route file: `src/routes/my-feature.routes.ts`
```typescript
import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";

export const myFeatureRoutes = new Elysia({ prefix: "/api/my-feature" })
  .use(authMiddleware) // Optional: protect routes
  .get("/", ({ user }) => {
    return { message: `Hello ${user.email}` };
  });
```

2. Register in `src/server.ts`:
```typescript
import { myFeatureRoutes } from "./routes/my-feature.routes";

const app = new Elysia()
  .use(myFeatureRoutes)
  // ...
```

