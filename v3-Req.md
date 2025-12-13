## 1. SYSTEM OVERVIEW

### 1.1 Purpose
Dual-mode whistleblowing platform:
- **Anonymous Mode**: Blockchain-stored with public pseudonym (IMMUTABLE - cannot edit/delete)
- **Identified Mode**: Database-stored with identity visible to admins (CAN edit/delete)

### 1.2 Core Architecture
- Single account system (email/password)
- Auto-generated anonymous identifier per user
- User selects mode per complaint
- Encrypted identity-to-pseudonym mapping

### 1.3 Technology Stack

Frontend:
```
├── Web: React 19, TailwindCSS, TypeScript
├── State: React Query (TanStack), 
└── Mobile: Expo / React Native

Backend:
├── Runtime: Bun
├── Framework: Elysia.js
├── Language: TypeScript
└── Jobs: Bull Queue (Redis-backed)

Database:
├── Primary: PostgreSQL
├── Cache: Redis 7 (for sessions, rate limiting, job queue)
└── Search: PostgreSQL Full-Text Search (tsvector)

Blockchain:
├── Network: Hedera 
├── SDK: @hashgraph/sdk
└── Service: HCS (Consensus Service)

File Storage:
├── Anonymous: IPFS via Web3.Storage (free)
└── Identified: Supabase Storage (free tier)

Authentication:
├── JWT (access + refresh tokens)
├── Password: bcrypt (cost: 12)
└── Admin: Same as regular users but with admin role

Background Jobs:
├── Queue: Bull (Redis)
└── Scheduler: node-cron

Redis Usage:
├── Session storage (JWT refresh tokens)
├── Rate limiting counters
├── Bull queue for background jobs (HCS indexer ...)
```

### 1.4 File Structure (Not Final)

```
project-root/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/
│   │   │   ├── submit/              # Mode selection + forms
│   │   │   ├── my-complaints/
│   │   │   │   ├── anonymous/
│   │   │   │   └── identified/
│   │   │   └── profile/
│   │   ├── admin/
│   │   │   ├── anonymous/
│   │   │   ├── identified/
│   │   ├── public/
│   │   │   ├── browse/              # Public complaint browsing
│   │   │   ├── complaint/[hash]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── layouts/
│   └── lib/
│       ├── api.ts
│       └── utils.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── complaint.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── public.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── hedera.service.ts
│   │   │   ├── ipfs.service.ts
│   │   │   └── indexer.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── jobs/
│   │   │   ├── hcs-indexer.job.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── README.md
```

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 User Authentication & Profile

User Registration:
- Register with email and password
- Email valid format and unique
- Password min 8 chars: uppercase, lowercase, number, special char
- System auto-generates anonymous_identifier: anon_{12-char-hex}
  - Generated: SHA256(user_id + platform_secret)[0:12]
  - Unique, cannot be changed
- Send email verification link (valid 24 hours)
- Cannot submit complaints until email verified
- Can resend verification (max 3/hour)
- Store passwords as bcrypt hash (cost: 12)

User Login:
- Authenticate with email/password
- Case-insensitive email
- Generic error for invalid credentials (no user enumeration)
- Lock account after 5 failed attempts
- Issue JWT tokens:
  - Access token: 1 hour expiry
  - Refresh token: 7 days expiry (stored in Redis)
  - Include: user_id, email, anonymous_identifier, role
- Rate limiting:
  - Login: 10/min per IP
  - Signup: 5/hour per IP
- Log all auth events (login success/failure, signup, password reset)

Profile Management:
- View profile: email, anonymous_identifier, name, phone, created_at
- Update: name, phone (optional fields)
- Cannot update: email, anonymous_identifier
- Change password (requires current password, invalidates all sessions)

Password Recovery:
- Submit email → receive reset link
- Token valid 1 hour, single-use
- Invalidate all sessions on reset

---

### 2.2 Complaint Submission

#### 2.2.1 Mode Selection

Dashboard Submit Page:
- User lands on /dashboard/submit
- Choose submission mode:
  
  Option A: Submit Anonymously
  - Full anonymity via blockchain
  - Cannot edit or delete after submission (immutable)
  - Public record forever
  - Small transaction fee (~$0.0001, paid by platform)
  - Shows anonymous_identifier that will be used
  
  Option B: Submit with Identity
  - Free, no blockchain
  - Can edit/delete anytime
  - Private by default (admins see identity)
  - Optional: make public (identity still hidden from public)

#### 2.2.2 Anonymous Submission Workflow

Form Fields:
- Complaint text: 10-10,000 chars (required)
- Category: dropdown from predefined list (required)
- Area: text field for district/location (required)
- Evidence files: up to 10 files (optional)

File Upload (Integrated in Form):
- Drag-and-drop or click to upload
- Supported: JPEG, PNG, WEBP, MP4, WEBM, PDF
- Max 50MB per file, 200MB total
- Max 10 files
- File validation:
  - Check magic bytes (not extension)
  - Reject executables (.exe, .sh, .bat, .js, .app)
  - Strip EXIF from images
  - Show clear errors if rejected
- Show preview thumbnails in form
- Allow removing files before submission
- Progress bar during upload

Pre-submission Display:
- Show form summary with all entered data
- Display anonID/wallet prominently
- Warnings:
  - "Your anonymous ID will be: 0xa3f9c2e1d4"
  - "This will be publicly visible on the blockchain forever"
  - "Files will be uploaded to IPFS (public, permanent)"
  - "Cannot edit or delete after submission"
  - "Submission is immutable on blockchain"
- Require checkbox confirmation
- Submit button enabled only after confirmation

Submission Process:
1. User clicks Submit
2. Frontend validates all fields
3. If files attached:
    - Upload to IPFS via Web3.Storage
    - Show upload progress
    - Collect CID for each file
4. Backend builds HCS message:
   ```json
   {
     "submittedBy": "anon_a3f9c2e1d4",
     "text": "complaint text",
     "category": "infrastructure",
     "area": "District 5",
     "evidence": [
       {"cid": "bafyb...", "filename": "photo.jpg", "type": "image/jpeg", "size": 2458392}
     ],
     "timestamp": 1699564800
   }
   ```
5. Submit to Hedera HCS Topic 1 (backend operator wallet pays fee)
6. Store in complaints_anonymous_tracking:
   - user_id (encrypted)
   - anonymous_identifier
   - hcs_transaction_hash
   - complaint_text
   - category
   - area
   - evidence_cids (array)
   - submitted_at
7. Return receipt to user:
   - Transaction hash
   - Complaint hash (for tracking/searching)
   - Blockchain explorer link
   - Consensus timestamp

Success Page:
- "Complaint submitted successfully!"
- Display complaint hash prominently: "Your complaint hash: abc123..."
- "Save this hash to track your complaint"
- Copy button for hash
- Link to view on public page
- Link to blockchain explorer

#### 2.2.3 Identified Submission Workflow

Form Fields:
- Same as anonymous: text, category, area, evidence
- Additional field: Visibility (private/public)
  - Private (default): only admins see
  - Public: appears in public feed (but your identity hidden from public, only admins see it)

File Upload (Integrated in Form):
- Same drag-and-drop interface
- Same validation rules
- Upload to Supabase Storage (private bucket)
- Show upload progress
- Preview thumbnails

Pre-submission Display:
- Show form summary
- Notice: "Your identity (email, name) will be visible to admins"
- Notice: "You can edit or delete this complaint later"
- Notice: "Free submission (no blockchain fee)"

Submission Process:
1. Validate fields
2. If files: upload to Supabase, collect URLs
3. Insert into complaints_identified table:
   - user_id
   - text, category, area
   - status: 'submitted'
   - visibility: 'private' or 'public'
   - evidence_urls (array)
   - created_at
4. Return complaint_id

Success Page:
- "Complaint submitted successfully!"
- Display complaint ID
- Link to view/edit in dashboard

---

### 2.3 User Dashboard - View My Complaints

My Anonymous Submissions (/dashboard/my-complaints/anonymous):
- List all user's anonymous complaints
- Display per complaint:
  - Anonymous ID
  - Text preview (first 100 chars)
  - Category
  - Area
  - Current status
  - Submitted date
  - Complaint hash
- Search by keyword (local filter)
- Filter by: category, status
- Sort by: date (newest first default)
- Paginate: 20 per page
- Click complaint to view details

Anonymous Complaint Detail:
- Full text
- Category, area
- Current status with timeline:
  - Each status update shows: date, new status, admin notes
- Evidence files with IPFS links
  - Display images inline
  - Video player for videos
  - Download link for PDFs
- Blockchain transaction hash + explorer link
- Complaint hash (for searching)
- Clear banner: "This complaint is immutable - cannot be edited or deleted"
- Share button (copy link to public page)

My Identified Complaints (/dashboard/my-complaints/identified):
- List all user's identified complaints
- Display per complaint:
  - Text preview
  - Category, area
  - Current status
  - Visibility (private/public)
  - Submitted date
  - Last updated date
- Search by keyword
- Filter by: category, status, visibility
- Sort by: date
- Paginate: 20 per page
- Action buttons: View, Edit, Delete

Identified Complaint Detail:
- Full text
- Category, area
- Current status with timeline
- Evidence files (Supabase URLs)
- Visibility setting
- Action buttons:
  - Edit (if status allows)
  - Delete (if not under investigation)

Edit Identified Complaint:
- Same form as submission
- Can update: text, category, area
- Can add/remove evidence files
- Cannot edit if status: resolved, rejected, under_investigation
- Updates updated_at timestamp
- Shows warning if trying to edit restricted complaint

Delete Identified Complaint:
- Confirmation modal: "Are you sure? This cannot be undone."
- Cannot delete if under investigation (status check)
- Soft delete: set deleted_at timestamp
- Delete Supabase files
- Redirect to my complaints list

---

### 2.4 Public Browse & Search

Public Complaint Feed (/public/browse):
- NO authentication required
- Anyone can access (journalists, citizens, researchers)
- Shows ONLY anonymous complaints
- Never shows identified complaints (even if visibility=public, identity must remain hidden to public)

Display:
- List view with cards:
  - Anonymous ID
  - Complaint text (first 200 chars)
  - Category badge
  - Area
  - Current status badge
  - Submitted date
  - View count (optional)

Search & Filter Panel:
- Search bar: keyword search across text, category, area
- Filter by Category: dropdown (all categories)
- Filter by Area: dropdown or autocomplete (all areas)
- Filter by Status: dropdown (submitted, under_review, investigating, resolved, rejected)
- Date range picker: from/to
- Apply filters button
- Clear filters button
- Combine all filters with AND logic

Results:
- Highlighted search terms in results
- Paginate: 20 per page
- Sort options:
  - Newest first (default)
  - Oldest first
  - Most recent status update
- Show total count: "Showing 41-60 of 237 complaints"

Complaint Hash Search:
- Prominent search box: "Search by complaint hash"
- Enter hash → redirect to complaint detail page
- Error if hash not found

Public Complaint Detail (/public/complaint/[hash]):
- Full complaint text
- Category, area
- Current status
- Status timeline:
  - All status updates from HCS Topic 2
  - Each entry: date, status, admin notes (if any)
- Evidence section:
  - Display images inline (IPFS gateway)
  - Video player for videos
  - PDF viewer or download link
- Blockchain verification:
  - Transaction hash
  - Link to Hedera explorer
  - Consensus timestamp
- Social share buttons:
  - Copy link
  - Twitter
  - Facebook
  - WhatsApp
- Report button (for inappropriate content)

Public Statistics (/public/stats):
- Dashboard layout with cards:
  - Total anonymous complaints
  - Complaints by status (pie chart)
  - Complaints by category (bar chart)
  - Complaints by area (list or map)
  - Last 30 days trend (line chart)
  - Average resolution time
  - Most active categories this month
- Cached: refresh every hour
- Exportable as PDF (optional)

Rate Limiting (Public Pages):
- 100 requests/hour per IP
- Display remaining requests in header
- When exceeded: show friendly message with timer

---

### 2.5 Admin Portal

Admin Authentication:
- Same login page as regular users (/login)
- Admin role set in users table (role: 'admin', 'moderator', 'investigator', 'super_admin')
- Enhanced security:
  - 2FA required (TOTP via authenticator app)
  - Stricter rate limits
  - Session timeout: 8 hours (vs 1 hour for regular users)
- All admin logins logged

Admin Roles:
- Viewer: read-only access
- Moderator: update complaint status, add notes
- Admin: full access to all complaints and users
- Super Admin: system configuration, manage other admins, access to anonid/wallet->user db

Anonymous Complaints Dashboard (/admin/anonymous):
- List all anonymous complaints
- Table view with columns:
  - Complaint Hash (clickable)
  - Anonymous ID
  - Text preview (100 chars)
  - Category
  - Area
  - Current Status
  - Submitted Date
  - Actions button

Search & Filter:
- Search by: hash, keyword, anonymous_id
- Filter by: status, category, area, date range
- Sort by: date, status
- Paginate: 50 per page
- Bulk actions (optional): update status for multiple

Complaint Detail View (Admin):
- Full complaint info
- Evidence files (IPFS)
- Status timeline
- Blockchain info
- Admin Actions panel:
  - Update Status button
  - Add Internal Note (not visible to public)
  - Flag as inappropriate / delete / ban submitter temporarily

Update Status (Anonymous):
- Modal with form:
  - Current status (readonly)
  - New status (dropdown)
  - Public notes (visible to user and public)
  - Internal notes (admins only)
  - Submit button
- On submit:
  - Build HCS Topic 2 message:
    ```json
    {
      "complaintHash": "abc123...",
      "oldStatus": "submitted",
      "newStatus": "under_review",
      "publicNotes": "Investigation started",
      "adminId": "admin_xyz",
      "timestamp": 1699564900
    }
    ```
  - Submit to HCS Topic 2
  - Show success message

Identified Complaints Dashboard (/admin/identified):
- List all identified complaints
- Table view with columns:
  - Complaint ID
  - User Name
  - User Email
  - Text preview
  - Category
  - Area
  - Status
  - Visibility
  - Submitted Date

Filter & Search:
- Search by: complaint ID, user email, user name, keyword
- Filter by: status, category, area, visibility
- Sort by: date, status
- Paginate: 50 per page

Complaint Detail (Admin):
- Full complaint info
- User profile card:
  - Name, email, phone
  - All complaints by this user
  - Account created date
- Evidence files (Supabase URLs)
- Status timeline
- Admin Actions:
  - Update Status (writes to DB, not blockchain)
  - Add Internal Note
  - Contact User (mailto link)
  - Delete Complaint (if appropriate)

Update Status (Identified):
- Modal with form:
  - New status (dropdown)
  - Notes (visible to user)
  - Submit button
- On submit:
  - Update complaints_identified.status
  - Insert into status_updates table
  - No blockchain submission

---

### 2.6 Hedera Blockchain Integration

HCS Topic Setup:
- Create Topic 1 (Complaints): stores anonymous complaints
- Create Topic 2 (Status Updates): stores status changes for anonymous complaints
- Both topics have public read access
- Only backend operator account can submit messages
- Store topic IDs in environment variables

Backend Operator Account:
- Hedera account (e.g., 0.0.12345)
- Private key in environment variable
- Pays all transaction fees 
- Users never interact with blockchain directly
- Platform subsidizes all costs

Submit to Topic 1 (Complaints):
- When user submits anonymous complaint:
  1. Build JSON message with complaint data
  2. Use Hedera SDK: TopicMessageSubmitTransaction
  3. Set topic ID, message (JSON.stringify)
  4. Sign with operator private key
  5. Execute transaction
  6. Get receipt with:
     - Transaction hash
     - Consensus timestamp
     - Sequence number
  7. Store transaction hash in database

Submit to Topic 2 (Status Updates):
- When admin updates anonymous complaint status:
  1. Build JSON message with status update
  2. Same process as Topic 1
  3. Message format:
  
     ```json
     {
       "complaintHash": "abc123...",
       "oldStatus": "submitted",
       "newStatus": "under_review",
       "publicNotes": "Investigation started",
       "adminId": "admin_xyz",
       "timestamp": 1699564900
     }
     ```

HCS Indexer (Background Job):
- Runs every 2 seconds
- Uses TopicMessageQuery or Hedera Mirror Node API
- Tracks last processed sequence number in Redis
- For each new message:
  1. Fetch message
  2. Parse JSON
  3. Validate format
  4. Store in indexed_complaints table for Topic 1
  5. Store in indexed_status_updates table for Topic 2
  6. Update full-text search index
- Error handling:
  - Log errors
  - Retry failed messages (max 3 attempts)
  - Dead letter queue for permanent failures

Indexed Complaints Table:
- Enables fast querying without hitting blockchain
- Fields:
  - hcs_hash (primary key - transaction hash)
  - anonymous_identifier
  - complaint_text
  - category
  - area
  - evidence_cids (JSONB array)
  - status
  - consensus_timestamp
  - sequence_number
  - indexed_at
- Full-text search index on complaint_text
- Indexes on: anonymous_identifier, category, area, status

Why Indexer Needed:
- HCS has no query capability (only sequential reads)
- Indexer provides:
  - Fast search/filter
  - Pagination
  - Full-text search
- Public API and admin dashboard query indexed table, not blockchain
- Blockchain serves as source of truth / verification

---

### 2.7 File Storage

IPFS (Anonymous Complaints):
- Use Web3.Storage API (free tier)
- Upload process:
  1. User selects files in form
  2. Frontend validates files
  3. On form submit, upload to IPFS sequentially
  4. Show progress bar
  5. Collect CID for each file
  6. Include CIDs in HCS message
- Store CIDs in complaints_anonymous_tracking table
- Retrieval:
  - Generate gateway URLs: https://w3s.link/ipfs/{cid}
  - Fallback gateways: ipfs.io, nftstorage.link
  - Display images/videos inline
  - Download link for PDFs
- Files are:
  - Public (anyone with CID can access)
  - Permanent (cannot be deleted)
  - Immutable (content-addressed)

Supabase Storage (Identified Complaints):
- Use Supabase Storage (free tier: 1GB)
- Private bucket (not publicly accessible)
- Upload process:
  1. User selects files
  2. Frontend validates
  3. On submit, upload to Supabase
  4. Store file URLs in complaints_identified.evidence_urls (JSONB array)
- Retrieval:
  - Generate signed URLs with expiration (1 hour)
  - Only admins can access
  - User can access their own files
- Files can be deleted when complaint deleted
- Path structure: complaints/{complaint_id}/{filename}

File Validation (Both):
- Check file type using magic bytes (not extension)
- Allowed: JPEG, PNG, WEBP, MP4, WEBM, PDF
- Rejected: executables, scripts (.exe, .sh, .bat, .js, .app, etc.)
- Size limits:
  - Max 50MB per file
  - Max 200MB total per complaint
  - Max 10 files per complaint
- Image processing:
  - Strip EXIF metadata (privacy)
  - Generate thumbnail (200x200) for gallery view
- Return clear error messages if validation fails

---

### 2.8 Security & Audit

Audit Logging:
- Log all significant actions to audit_logs table:
  - Authentication: login, logout, signup, email verification, password reset, 2FA
  - Complaints: submit, edit, delete, status update
  - Admin actions: status updates, notes
  - Include:
    - user_id or admin_id
    - action type
    - resource_id (complaint_id or user_id)
    - details (JSONB with action-specific data)
    - ip_address
    - user_agent
    - timestamp
- Logs are immutable:
  - Never UPDATE or DELETE
  - Append-only
  - Super admins can view, not modify
- Retention: 2 years minimum
- Hash chain (optional): each log entry includes hash of previous for tamper detection


Rate Limiting:
- Implemented via Redis counters
- Limits: (EXAMPLE, STILL NOT FINALIZED)
  - Public API: 100 requests/hour per IP
  - Auth endpoints: 10 requests/minute per IP
  - Submit anonymous: 5 complaints/hour per user
  - Submit identified: 20 complaints/hour per user
  - Admin API: 1000 requests/hour per admin
- Return HTTP 429 when exceeded with headers:
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
  - Retry-After
- Display friendly error message to user

Data Encryption:
- user_id in complaints_anonymous_tracking encrypted (AES-256-GCM)
- Encryption key stored in environment variable or KMS
- Passwords: bcrypt hash (cost: 12)
- JWT secrets in environment variables
- Supabase files: server-side encryption (automatic)
- Database: encrypt sensitive columns (optional, depends on hosting)

Input Validation:
- Sanitize all user inputs (prevent XSS)
- Validate data types and formats
- Use parameterized queries (SQL injection prevention)
- TypeScript types for compile-time safety
- Zod schemas for runtime validation

Session Management:
- JWT access tokens stored in memory (httpOnly cookie)
- Refresh tokens stored in Redis with user_id as key
- Refresh token rotation on use
- Invalidate all sessions on password change
- Admin sessions expire after 8 hours
- Regular user sessions expire after refresh token TTL (7 days)

---

## 3. API ENDPOINTS

```
Authentication:
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
PUT    /api/auth/change-password
POST   /api/auth/verify-email?token={token}
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

Complaints:
POST   /api/complaints/submit-anonymous
POST   /api/complaints/submit-identified
GET    /api/complaints/my-anonymous
GET    /api/complaints/my-identified
GET    /api/complaints/anonymous/:hash
GET    /api/complaints/identified/:id
PUT    /api/complaints/identified/:id
DELETE /api/complaints/identified/:id

Admin:
GET    /api/admin/complaints/anonymous
GET    /api/admin/complaints/identified
GET    /api/admin/complaints/anonymous/:hash
GET    /api/admin/complaints/identified/:id
POST   /api/admin/complaints/anonymous/:hash/status
PUT    /api/admin/complaints/identified/:id/status
POST   /api/admin/identity/request-access
POST   /api/admin/identity/approve-access

Public:
GET    /api/public/complaints
GET    /api/public/complaint/:hash

File Upload:
POST   /api/upload/ipfs
POST   /api/upload/supabase
```

---

## 4. FUTURE ADDITIONS

Mobile App:
- React Native (iOS + Android)
- Biometric authentication (Face ID, Touch ID)
- Offline support (draft complaints)
- Push notifications

Camera Integration (Mobile):
- Take photos directly in-app
- React Native Camera
- Image compression before upload
- OCR for text extraction from photos

Notifications (FOR NON ANON COMPLAINTS):
- Email verification
- Complaint submitted confirmation
- Status update notifications
- Admin alerts for new complaints
- Identity access alerts
- (SendGrid/AWS SES + Bull queue)

More:
- Accessibility (WCAG 2.1 AA)
- Two-factor authentication (TOTP)
- Complaint timeline visualization

---
