# Product Requirements Document: Sawtak Blockchain

## Overview
Sawtak is a secure, decentralized platform for logging and managing complaints (whistleblowing and institutional feedback). This document outlines the migration from Hedera Hashgraph to a custom Cosmos SDK-based permissioned blockchain.

---

## 1. Current Hedera Architecture (Reference)

### 1.1 Current Implementation
- **Blockchain Service Interface** (`IBlockchainService`):
  ```typescript
  interface IBlockchainService {
    submitMessage(topicId: string, message: any): Promise<{
      transactionId: string;
      consensusTimestamp: string;
    }>;
  }
  ```

- **Topic-based Separation**:
  - `HEDERA_TOPIC_ID_COMPLAINTS` - Anonymous complaint submissions
  - `HEDERA_TOPIC_ID_STATUS` - Status updates for submitted complaints

- **Indexing**:
  - Hedera Mirror Node API polling (`fetchMessages()`)
  - Stores in PostgreSQL via Prisma (`indexedComplaint`, `indexedStatusUpdate`)
  - Tracks `hcs_hash`, `tracking_hash`, `consensus_timestamp`

---

## 2. Cosmos SDK Blockchain Requirements

### 2.1 Technical Architecture

| Component | Requirement | Status |
|-----------|-------------|--------|
| **Framework** | Cosmos SDK v0.50+ (latest stable) | Required |
| **Consensus** | Proof of Authority (PoA) via `x/poa` module | Required |
| **State Machine** | Custom `x/sawtak` module for complaint logic | Required |
| **Banking** | Standard `x/bank` module (for governance tokens) | Standard |
| **Staking** | Disabled/Removed (PoA replaces this) | Required |
| **Minting** | Disabled/Removed (no public token generation) | Required |

### 2.2 Authentication & Authorization

**Cosmos SDK uses account-based authentication:**

1. **Proposers** (Sawtak Backend Node):
   - Unique Cosmos account with address (bech32 format: `sawtak1...`)
   - Must be registered as an authorized validator or delegated authority
   - Signs transactions with private key before broadcasting

2. **Validators** (Authority Nodes):
   - Guardians of the network (institutional/government validators)
   - Validate PoA consensus on complaint transactions

---

## 3. Backend-to-Blockchain Communication

### 3.1 How to Broadcast Transactions

**Problem:** Unlike Hedera's simple `.submitMessage()`, Cosmos SDK requires transaction construction, signing, and broadcasting.

**Solution Architecture:**

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│ Backend Node    │────▶│  Cosmos SDK Client   │───▶│  Sawtak Chain   │
│ (TS Client)     │     │  (grpc/http)         │     │  (Validator Set)│
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

**Implementation Options:**

| Option | Approach | Details |
|--------|----------|---------|
| **A. CosmJS (Recommended)** | TypeScript/SDK library | Use `@cosmjs/stargate` with custom protobuf messages |
| **B. Cosmos SDK gRPC Gateway** | Go binary + API | Build a thin Go service that exposes REST API to backend |

**Recommended: Option A (CosmJS Direct)**

The backend (Node.js/TypeScript) should use CosmJS to:
1. Create a signing client with backend's Cosmos account
2. Build and sign transactions locally
3. Broadcast to validator nodes via gRPC/HTTP

### 3.2 CosmJS Implementation Pattern

```typescript
// cosmos-client.ts - New service to replace HederaService
import { SigningStargateClient } from "@cosmjs/stargate";
import { Registry } from "@cosmjs/proto-signing";

export class SawtakCosmosService implements IBlockchainService {
  private client: SigningStargateClient;
  private backendAddress: string; // sawtak1...

  constructor() {
    // Initialize with backend's mnemonic/private key
    // Connect to validator RPC endpoint
  }

  async submitMessage(topicId: string, message: any): Promise<{
    transactionId: string;
    consensusTimestamp: string;
  }> {
    // Map message to Cosmos SDK Msg type
    const msg = this.mapToCosmosMessage(topicId, message);

    // Sign and broadcast
    const result = await this.client.signAndBroadcast(
      this.backendAddress,
      [msg],
      "auto" // Auto-calculate gas
    );

    return {
      transactionId: result.transactionHash,
      consensusTimestamp: result.height.toString()
    };
  }
}
```

---

## 4. Custom Cosmos SDK Module: `x/sawtak`

### 4.1 Module Responsibilities

The `x/sawtak` module replaces Hedera's HCS topic-based message submission with native Cosmos transactions.

### 4.2 Message Types (Protocol Buffers)

```protobuf
// proto/sawtak/tx.proto
syntax = "proto3";
package sawtak.sawtak;

// MsgCreateAnonymousComplaint
// Replaces: HCS topic message for anonymous complaints
message MsgCreateAnonymousComplaint {
  string creator = 1;           // Backend address (sawtak1...)
  string tracking_hash = 2;     // SHA256 of tracking code (first 16 chars)
  string encrypted_anon_id = 3;   // AES-256 encrypted anonymous identifier
  string title = 4;
  string text = 5;
  string category = 6;
  string area = 7;
  DirectedTo directed_to = 8;
  string incident_date = 9;       // ISO 8601
  repeated string evidence_cids = 10;
}

// MsgCreateIdentifiedComplaint
// Replaces: Database-only storage with blockchain anchoring
message MsgCreateIdentifiedComplaint {
  string creator = 1;             // Backend address
  string user_id = 2;           // UUID of registered user
  string title = 3;
  string text = 4;
  string category = 5;
  string area = 6;
  DirectedTo directed_to = 7;
  string incident_date = 8;
  repeated string evidence_cids = 9;
  string visibility = 10;         // "public" | "private"
}

// MsgUpdateComplaintStatus
// Replaces: HCS topic message for status updates
message MsgUpdateComplaintStatus {
  string creator = 1;             // Admin address
  string complaint_id = 2;        // Blockchain tx hash of complaint
  string old_status = 3;          // For audit log
  string new_status = 4;          // submitted | investigating | resolved | dismissed
  string public_notes = 5;        // Admin-visible notes
}

// DirectedTo sub-message
message DirectedTo {
  string type = 1;                // "ministry" | "governorate" | "center"
  string ministry_id = 2;
  string governorate_id = 3;
  string center_id = 4;
}
```

### 4.3 State Storage (KV Store)

```go
// keeper/complaint_store.go
// Primary keys:
// "complaint/<tx_hash>" -> Complaint protobuf
// "complaint_by_tracking/<tracking_hash>" -> tx_hash
// "complaint_by_user/<user_id>/<tx_hash>" -> nil (index)
// "complaint_by_status/<status>/<tx_hash>" -> nil (index)
// "status_update/<complaint_id>/<sequence>" -> StatusUpdate protobuf
```

### 4.4 Query Endpoints (for Indexing)

```protobuf
// proto/sawtak/query.proto
service Query {
  // Get single complaint by transaction hash
  rpc Complaint(QueryComplaintRequest) returns (QueryComplaintResponse);

  // Get complaint by tracking hash (for lookup)
  rpc ComplaintByTrackingHash(QueryByTrackingHashRequest) returns (QueryComplaintResponse);

  // List all complaints with pagination
  rpc Complaints(QueryComplaintsRequest) returns (QueryComplaintsResponse);

  // Get status history for a complaint
  rpc StatusHistory(QueryStatusHistoryRequest) returns (QueryStatusHistoryResponse);

  // Get complaints by user (identified)
  rpc ComplaintsByUser(QueryComplaintsByUserRequest) returns (QueryComplaintsResponse);

  // Get complaints filtered by status
  rpc ComplaintsByStatus(QueryComplaintsByStatusRequest) returns (QueryComplaintsResponse);
}
```

---

## 5. Indexing from Cosmos Blockchain

### 5.1 Cosmos SDK Event System vs Hedera Mirror Node

**Hedera Approach (Current):**
- Poll `/api/v1/topics/{topicId}/messages` endpoint
- Parse base64 messages
- Store in PostgreSQL

**Cosmos Approach (New):**
- Use Tendermint WebSocket or gRPC streaming
- Subscribe to `tx` events with filter for `message.action='create_complaint'`
- Parse `FinalizeBlock` events

### 5.2 Cosmos Event Indexing Implementation

```typescript
// cosmos-indexer.service.ts - Replacing hedera-indexer.service.ts
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClient } from "@cosmjs/stargate";

export class CosmosIndexerService {
  private tmClient: Tendermint34Client;
  private queryClient: QueryClient;

  async start(): Promise<void> {
    // Connect to Tendermint RPC WebSocket
    this.tmClient = await Tendermint34Client.connect(
      process.env.COSMOS_RPC_WS || "ws://localhost:26657"
    );

    // Subscribe to new blocks with tx events
    const stream = this.tmClient.subscribeNewBlock();

    for await (const block of stream) {
      await this.processBlock(block);
    }
  }

  private async processBlock(block: Block): Promise<void> {
    for (const tx of block.txs) {
      // Decode transaction and extract messages
      const events = await this.decodeTxEvents(tx);

      for (const event of events) {
        if (event.type === "sawtak.create_anonymous_complaint") {
          await this.indexAnonymousComplaint(event);
        } else if (event.type === "sawtak.create_identified_complaint") {
          await this.indexIdentifiedComplaint(event);
        } else if (event.type === "sawtak.update_complaint_status") {
          await this.indexStatusUpdate(event);
        }
      }
    }
  }

  // Stores in PostgreSQL same schema as before
  private async indexAnonymousComplaint(event: Event): Promise<void> {
    const { txHash, timestamp, attributes } = this.parseEvent(event);

    await prisma.indexedComplaint.create({
      data: {
        cosmos_hash: txHash,
        tracking_hash: attributes.tracking_hash,
        anonymous_identifier: attributes.encrypted_anon_id,
        title: attributes.title,
        complaint_text: attributes.text,
        category: attributes.category,
        directed_to: JSON.parse(attributes.directed_to || '{}'),
        area: attributes.area,
        incident_date: attributes.incident_date,
        evidence_cids: JSON.parse(attributes.evidence_cids || '[]'),
        status: "submitted",
        consensus_timestamp: new Date(timestamp),
      },
    });
  }
}
```

### 5.3 Indexer State Requirements

| Table | Cosmos Fields | Hedera Equivalent |
|-------|---------------|-------------------|
| `indexedComplaint` | `cosmos_hash` (primary key) | `hcs_hash` |
| | `consensus_timestamp` | Same |
| | `tracking_hash` | Same |
| | `status` | Same |
| `indexedStatusUpdate` | `cosmos_tx_hash` + `sequence` | `hcs_hash` |
| | `complaint_hash` (fk) | Same |

---

## 6. Backend API Endpoints Mapping

### 6.1 Anonymous Complaints

| Endpoint | Current Hedera | Migration |
|----------|---------------|-----------|
| `POST /api/complaints/anonymous/submit` | `hedera.submitMessage(TOPIC_ID_COMPLAINTS, {...})` | `cosmosClient.signAndBroadcast(MsgCreateAnonymousComplaint)` |
| `GET /api/track/:code` | Query `prisma.indexedComplaint.findFirst({ tracking_hash })` | Same (indexed data unchanged) |
| `GET /api/track/:code/history` | Query `prisma.indexedStatusUpdate.findMany` | Same (indexed data unchanged) |

### 6.2 Identified Complaints

| Endpoint | Current | Migration |
|----------|---------|-----------|
| `POST /api/complaints/identified/submit` | `prisma.identifiedComplaint.create({...})` | Two-phase: 1) Create in DB, 2) Anchor to chain via `MsgCreateIdentifiedComplaint` |
| `GET /api/complaints/identified/user/:userId` | `prisma.identifiedComplaint.findMany` | Query chain via REST or use cached index |

### 6.3 Admin/Status Management

| Endpoint | Current Hedera | Migration |
|----------|---------------|-----------|
| `POST /api/admin/status-updates` (implied) | `complaintStatusService.updateStatus()` -> `hedera.submitMessage(TOPIC_ID_STATUS, {...})` | `cosmosClient.signAndBroadcast(MsgUpdateComplaintStatus)` |

### 6.4 Indexer Management

| Endpoint | Current | Migration |
|----------|---------|-----------|
| `GET /api/indexer/status` | Hedera-specific metrics | Cosmos-specific: `lastBlockHeight`, `syncStatus` |
| `POST /api/indexer/start` | Start Hedera mirror polling | Start Tendermint WebSocket subscription |
| `POST /api/indexer/reindex` | Re-fetch from Hedera timestamp | Query old Cosmos blocks via gRPC |

---

## 7. Data Encryption & Privacy

### 7.1 Encrypted Fields

| Field | Encryption | Storage |
|-------|------------|---------|
| `anonymousIdentifier` (user side) | AES-256-GCM | In Cosmos `encrypted_anon_id` field (ciphertext) |
| `trackingCode` | SHA-256 -> 16 char hash | `tracking_hash` for lookup |
| User identity (identified) | AES-256 | Off-chain in PostgreSQL only |

### 7.2 Zero-Knowledge Future Extension

Anonymous complaints can be upgraded to ZK-proofs (zk-SNARKs) in a future version:
- Proof: User knows `anon_id` without revealing it
- Public inputs: `tracking_hash`, `category`, `merkle_root_of_allowed_submitters`

---

## 8. Deployment & Configuration

### 8.1 Environment Variables

```bash
# Blockchain Connection
COSMOS_RPC_ENDPOINT=http://validator1.sawtak.local:26657
COSMOS_GRPC_ENDPOINT=http://validator1.sawtak.local:9090
COSMOS_RPC_WS=ws://validator1.sawtak.local:26657/websocket

# Backend Credentials (Cosmos Account)
COSMOS_BACKEND_MNEMONIC="abandon abandon ... about"
COSMOS_BACKEND_ADDRESS=sawtak1...

# Chain Configuration
COSMOS_CHAIN_ID=sawtak-testnet-1
COSMOS_GAS_PRICE=0.025usawtak

# Indexer
INDEXER_START_HEIGHT=0  # Block height to start indexing from
```

### 8.2 Validator Network Topology

```
┌─────────────────────────────────────────────┐
│           Sawtak PoA Network                │
│                                             │
│  ┌──────────┐     ┌──────────┐             │
│  │ Validator│◄───►│ Validator│             │
│  │ Node 1   │     │ Node 2   │             │
│  │ (Ministry)     │ (Gov)    │             │
│  └────┬─────┘     └────┬─────┘             │
│       │                │                   │
│  ┌────┴─────┐     ┌────┴─────┐            │
│  │ Validator│◄───►│ Validator│            │
│  │ Node 3   │     │ Node 4   │            │
│  │ (Center) │     │ (Audit)  │            │
│  └────┬─────┘     └────┬─────┘            │
│       │                │                  │
└───────┼────────────────┼──────────────────┘
        │                │
     ┌──┴──┐          ┌──┴──┐
     │gRPC │          │RPC  │
     └──┬──┘          └──┬──┘
        │                │
   ┌────┴────┐      ┌────┴────┐
   │ Backend │      │ Indexer │
   │ Node    │      │ Service │
   └─────────┘      └─────────┘
```

---

## 9. Migration Checklist

### Phase 1: Cosmos Chain Development
- [ ] Scaffold Cosmos SDK app with `ignite` or `cosmos-sdk` CLI
- [ ] Implement `x/poa` module (custom or use existing)
- [ ] Implement `x/sawtak` module with 3 message types
- [ ] Add query endpoints for indexing
- [ ] Set up local testnet with 4 validators

### Phase 2: Backend Migration
- [ ] Create `SawtakCosmosService` implementing `IBlockchainService`
- [ ] Replace `HederaService` injection
- [ ] Implement `CosmosIndexerService` to replace `HederaIndexerService`
- [ ] Update Prisma schema for `cosmos_hash` fields
- [ ] Add CosmJS dependencies (`@cosmjs/stargate`, `@cosmjs/proto-signing`)

### Phase 3: Hedera Deprecation
- [ ] Switch indexers to Cosmos-only
- [ ] Remove Hedera dependencies
- [ ] Archive Hedera topic data

---

## 10. Appendix: Current Hedera Types Reference

### Anonymous Submission Payload (Current)
```typescript
interface AnonymousSubmission {
  anonymousIdentifier: string;  // → encrypted_anon_id
  title: string;
  text: string;
  category: string;
  area?: string;
  directedTo?: DirectedTo;
  incidentDate?: Date;        // → incident_date (ISO string)
  evidenceCids?: string[];      // → evidence_cids
}
```

### Status Update Payload (Current)
```typescript
interface StatusUpdate {
  complaintHash: string;      // → complaint_id (Cosmos tx hash)
  oldStatus: string | null;   // → old_status
  newStatus: string;          // → new_status
  publicNotes?: string;       // → public_notes
  adminId: string;            // → creator (Cosmos address of admin)
}
```

### Indexed Complaint Schema (Current → New)
```prisma
model IndexedComplaint {
  id                    String    @id @default(uuid())
  // Hedera: hcs_hash        (string)
  // Cosmos: cosmos_tx_hash  (string)
  chain_hash            String    @unique  // Generic, store tx hash from either
  chain_type            String    // "hedera" | "cosmos"

  tracking_hash         String?   @unique
  anonymous_identifier  String?
  title                 String
  complaint_text        String?
  category              String
  directed_to           Json?
  area                  String    @default("Unknown")
  severity              String    @default("medium")
  incident_date         DateTime?
  evidence_cids         String[]
  status                String    @default("submitted")
  consensus_timestamp   DateTime
  created_at            DateTime  @default(now())

  @@index([tracking_hash])
  @@index([chain_hash])
  @@index([status])
}
```

---
